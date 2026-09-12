import math
import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product, ProductVariant, PriceLog, SellerAccount
from ..schemas import (
    BulkAdjustmentRequest,
    BulkAdjustmentItemPreview,
    BulkSyncTrendyolRequest,
    SingleVariantPriceUpdate
)
from ..services.trendyol_client import TrendyolClient

router = APIRouter(prefix="/api/pricing", tags=["pricing"])

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Product.category_name).distinct().all()
    return [c[0] for c in categories if c[0]]

@router.post("/bulk-adjust", response_model=List[BulkAdjustmentItemPreview])
def preview_bulk_adjustment(payload: BulkAdjustmentRequest, db: Session = Depends(get_db)):
    """
    Belirli ürünler, kategori veya tüm mağaza için toplu fiyat artış/indirim simülasyonu yapar.
    """
    query = db.query(ProductVariant).join(Product)

    if payload.scope == "category" and payload.category_name:
        query = query.filter(Product.category_name == payload.category_name)
    elif payload.scope == "selected" and payload.selected_variant_ids:
        query = query.filter(ProductVariant.id.in_(payload.selected_variant_ids))

    variants = query.all()
    results = []

    for var in variants:
        product = var.product
        old_price = var.current_price

        # Fiyat Hesaplama
        if payload.adjustment_type == "percentage":
            factor = payload.value / 100.0
            if payload.operation == "increase":
                new_price = old_price * (1.0 + factor)
            else:
                new_price = max(old_price * (1.0 - factor), 10.0)
        else: # fixed_amount
            if payload.operation == "increase":
                new_price = old_price + payload.value
            else:
                new_price = max(old_price - payload.value, 10.0)

        # Psikolojik Fiyatlandırma (.90 TL)
        if payload.round_to_90:
            new_price = math.floor(new_price) + 0.90

        new_price = round(new_price, 2)
        diff = round(new_price - old_price, 2)

        # Trendyol Komisyonu ve Net Gelir Hesabı
        commission_rate = var.commission_rate or 0.20
        commission_amount = round(new_price * commission_rate, 2)
        cargo_cost = var.cargo_cost or 45.0
        cost_price = var.cost_price or (old_price * 0.40)

        # Satıcının eline geçecek net tutar (Trendyol komisyonu ve kargo düşüldükten sonra)
        net_income = round(new_price - commission_amount - cargo_cost, 2)
        net_profit = round(net_income - cost_price, 2)
        profit_margin_pct = round((net_profit / new_price) * 100, 1) if new_price > 0 else 0.0

        results.append(
            BulkAdjustmentItemPreview(
                variant_id=var.id,
                product_title=product.title,
                brand=product.brand,
                category_name=product.category_name,
                variant_name=var.variant_name,
                barcode=var.barcode,
                stock_quantity=var.stock_quantity,
                old_price=old_price,
                new_price=new_price,
                price_diff=diff,
                commission_rate=commission_rate,
                commission_amount=commission_amount,
                estimated_net_income=net_income,
                estimated_net_profit=net_profit,
                profit_margin_pct=profit_margin_pct
            )
        )

    return results

@router.post("/sync-trendyol")
async def sync_prices_to_trendyol(payload: BulkSyncTrendyolRequest, db: Session = Depends(get_db)):
    """
    Onaylanan yeni fiyatları veritabanında günceller ve tek tıkla Trendyol API'sine gönderir.
    """
    seller = db.query(SellerAccount).first()
    trendyol_items = []
    updated_count = 0

    for item in payload.items:
        v_id = item["variant_id"]
        new_p = float(item["new_price"])

        variant = db.query(ProductVariant).filter(ProductVariant.id == v_id).first()
        if variant:
            old_p = variant.current_price
            variant.current_price = new_p
            variant.last_synced_at = datetime.datetime.utcnow()

            # Fiyat değişim günlüğü (Audit Log)
            diff = new_p - old_p
            action_type = "Artış" if diff > 0 else "İndirim"
            log = PriceLog(
                variant_id=variant.id,
                old_price=old_p,
                new_price=new_p,
                trigger_source="bulk_sync",
                reason=f"Toplu {action_type} Eşitlemesi ({old_p:.2f} TL -> {new_p:.2f} TL)"
            )
            db.add(log)

            trendyol_items.append({
                "barcode": variant.barcode,
                "quantity": variant.stock_quantity,
                "salePrice": new_p,
                "listPrice": round(new_p * 1.25, 2)
            })
            updated_count += 1

    db.commit()

    # Trendyol Seller API İsteği (Canlı veya Mock)
    api_response = await TrendyolClient.update_price_and_inventory(
        supplier_id=seller.supplier_id if seller else "DEMO",
        api_key=seller.api_key if seller else "DEMO",
        api_secret=seller.api_secret if seller else "DEMO",
        items=trendyol_items,
        is_mock=seller.is_mock_mode if seller else True
    )

    return {
        "status": "success",
        "updated_count": updated_count,
        "message": f"{updated_count} adet ürün varyantının fiyatı başarıyla Trendyol'da güncellendi.",
        "trendyol_response": api_response
    }

@router.put("/variant/{variant_id}")
async def update_single_variant_price(variant_id: int, payload: SingleVariantPriceUpdate, db: Session = Depends(get_db)):
    """
    Tablodan tek bir varyantın fiyatını anlık olarak manuel değiştirip Trendyol'a gönderme.
    """
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Varyant bulunamadı")
    
    old_p = variant.current_price
    new_p = payload.new_price
    variant.current_price = new_p
    if payload.cost_price:
        variant.cost_price = payload.cost_price
    variant.last_synced_at = datetime.datetime.utcnow()

    log = PriceLog(
        variant_id=variant.id,
        old_price=old_p,
        new_price=new_p,
        trigger_source="manual_single",
        reason=f"Manuel Fiyat Güncellemesi ({old_p:.2f} -> {new_p:.2f} TL)"
    )
    db.add(log)
    db.commit()

    seller = db.query(SellerAccount).first()
    api_resp = await TrendyolClient.update_price_and_inventory(
        supplier_id=seller.supplier_id if seller else "DEMO",
        api_key=seller.api_key if seller else "DEMO",
        api_secret=seller.api_secret if seller else "DEMO",
        items=[{"barcode": variant.barcode, "quantity": variant.stock_quantity, "salePrice": new_p, "listPrice": new_p + 30}],
        is_mock=seller.is_mock_mode if seller else True
    )

    return {"status": "success", "variant_id": variant_id, "new_price": new_p, "trendyol_response": api_resp}
