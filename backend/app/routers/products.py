import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product, ProductVariant, SellerAccount, BuyboxTracking, PriceLog
from ..schemas import (
    ProductResponse,
    CurtainCalculateBatchRequest,
    CurtainCalculateItemResult,
    CreateCurtainProductRequest
)
from ..services.trendyol_client import TrendyolClient
from ..services.curtain_calculator import CurtainCalculator

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    if not products:
        # İlk açılışta demo verileri yükle
        import asyncio
        asyncio.create_task(sync_products_from_source(db))
        products = db.query(Product).all()
    return products

@router.post("/sync")
async def sync_products(db: Session = Depends(get_db)):
    return await sync_products_from_source(db)

@router.post("/calculate-curtain", response_model=List[CurtainCalculateItemResult])
def calculate_curtain_sizes(payload: CurtainCalculateBatchRequest):
    """
    Kullanıcının seçtiği perde kategorisine ve sektörel kurallara göre tüm ölçüleri hesaplar.
    """
    results = []
    for s in payload.sizes:
        w = s.width
        h = s.height
        size_label = f"{int(w)} x {int(h)} cm"

        if payload.category_type == "tul":
            calc = CurtainCalculator.calculate_tul_perde(
                width_cm=w,
                height_cm=h,
                meter_price=payload.unit_price,
                pleat_type=payload.pleat_type or "1x2.5",
                cargo_cost=payload.cargo_cost or 45.0,
                commission_rate=payload.commission_rate or 0.20,
                target_profit_margin=payload.target_profit_margin or 0.25,
                round_to_90=payload.round_to_90 if payload.round_to_90 is not None else True
            )
            qty_or_m2 = calc["required_meters"]

        elif payload.category_type == "stor_zebra":
            calc = CurtainCalculator.calculate_stor_zebra(
                width_cm=w,
                height_cm=h,
                m2_price=payload.unit_price,
                has_skirt=payload.has_skirt or False,
                skirt_m2_extra=payload.skirt_m2_extra or 50.0,
                has_bead=payload.has_bead or False,
                bead_m2_extra=payload.bead_m2_extra or 50.0,
                cargo_cost=payload.cargo_cost or 45.0,
                commission_rate=payload.commission_rate or 0.20,
                target_profit_margin=payload.target_profit_margin or 0.25,
                round_to_90=payload.round_to_90 if payload.round_to_90 is not None else True
            )
            qty_or_m2 = calc["calculated_m2"]

        elif payload.category_type == "fon":
            calc = CurtainCalculator.calculate_fon_perde(
                width_cm=w,
                height_cm=h,
                meter_price=payload.unit_price,
                panel_type=payload.panel_type or "tek_kanat",
                pleat_type=payload.pleat_type or "1x2.5",
                cargo_cost=payload.cargo_cost or 45.0,
                commission_rate=payload.commission_rate or 0.20,
                target_profit_margin=payload.target_profit_margin or 0.25,
                round_to_90=payload.round_to_90 if payload.round_to_90 is not None else True
            )
            qty_or_m2 = calc["required_meters"]

        else: # karartma_saten
            calc = CurtainCalculator.calculate_blackout_saten(
                width_cm=w,
                height_cm=h,
                meter_price=payload.unit_price,
                cargo_cost=payload.cargo_cost or 45.0,
                commission_rate=payload.commission_rate or 0.20,
                target_profit_margin=payload.target_profit_margin or 0.25,
                round_to_90=payload.round_to_90 if payload.round_to_90 is not None else True
            )
            qty_or_m2 = calc["required_meters"]

        results.append(
            CurtainCalculateItemResult(
                width_cm=w,
                height_cm=h,
                size_label=size_label,
                calculated_quantity_or_m2=qty_or_m2,
                fabric_cost=calc["fabric_cost"],
                direct_cost=calc["direct_cost"],
                total_cost=calc["total_cost"],
                sale_price=calc["sale_price"],
                min_price=calc["min_price"],
                commission_amount=calc["commission_amount"],
                net_income=calc["net_income"],
                net_profit=calc["net_profit"],
                profit_margin_pct=calc["profit_margin_pct"]
            )
        )

    return results

@router.post("/create-with-variants")
async def create_product_with_variants(payload: CreateCurtainProductRequest, db: Session = Depends(get_db)):
    """
    Yeni perde ürününü ve hesaplanan onlarca varyantını veritabanına kaydeder ve Trendyol'a yükler.
    """
    seller = db.query(SellerAccount).first()
    if not seller:
        seller = SellerAccount(is_mock_mode=True)
        db.add(seller)
        db.commit()
        db.refresh(seller)

    # 1. Ana Ürün Kaydı
    clean_model_code = payload.model_code.strip().upper().replace(" ", "-")
    existing_product = db.query(Product).filter(Product.model_code == clean_model_code).first()
    if existing_product:
        prod = existing_product
        prod.title = payload.title
        prod.brand = payload.brand
        prod.category_name = payload.category_name
        prod.image_url = payload.image_url
    else:
        prod = Product(
            seller_id=seller.id,
            model_code=clean_model_code,
            title=payload.title,
            brand=payload.brand,
            category_name=payload.category_name,
            image_url=payload.image_url or "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80"
        )
        db.add(prod)
        db.commit()
        db.refresh(prod)

    # 2. Varyantların Oluşturulması
    trendyol_items = []
    created_variant_count = 0

    for item in payload.variants:
        w = float(item.get("width_cm", 100))
        h = float(item.get("height_cm", 200))
        barcode = item.get("barcode") or f"{clean_model_code}-{int(w)}-{int(h)}"
        sale_p = float(item.get("sale_price", 299.90))
        min_p = float(item.get("min_price", sale_p * 0.75))
        direct_cost = float(item.get("direct_cost", sale_p * 0.40))
        stock_q = int(item.get("stock_quantity", 50))
        size_lbl = item.get("size_label", f"{int(w)} x {int(h)} cm")

        variant = db.query(ProductVariant).filter(ProductVariant.barcode == barcode).first()
        if not variant:
            variant = ProductVariant(
                product_id=prod.id,
                barcode=barcode,
                variant_name=size_lbl,
                width_cm=w,
                height_cm=h,
                fabric_type=payload.category_name,
                stock_quantity=stock_q,
                current_price=sale_p,
                cost_price=direct_cost,
                min_price=min_p,
                max_price=round(sale_p * 1.5, 2),
                cargo_cost=45.0,
                commission_rate=0.20
            )
            db.add(variant)
            db.commit()
            db.refresh(variant)
            created_variant_count += 1

            # Buybox takibi oluştur
            buybox = BuyboxTracking(
                variant_id=variant.id,
                is_active=True,
                strategy="beat_by_diff",
                price_diff=0.50,
                has_buybox=True,
                winner_seller_name="Bizim Mağaza",
                last_buybox_price=sale_p
            )
            db.add(buybox)
        else:
            variant.current_price = sale_p
            variant.min_price = min_p
            variant.cost_price = direct_cost
            variant.stock_quantity = stock_q

        trendyol_items.append({
            "barcode": barcode,
            "quantity": stock_q,
            "salePrice": sale_p,
            "listPrice": round(sale_p * 1.25, 2)
        })

    db.commit()

    # Trendyol'a yükle / eşitle
    api_resp = await TrendyolClient.update_price_and_inventory(
        supplier_id=seller.supplier_id,
        api_key=seller.api_key,
        api_secret=seller.api_secret,
        items=trendyol_items,
        is_mock=seller.is_mock_mode
    )

    return {
        "status": "success",
        "product_id": prod.id,
        "model_code": prod.model_code,
        "variant_count": len(trendyol_items),
        "message": f"'{prod.title}' ürünü {len(trendyol_items)} adet ölçü varyantıyla başarıyla oluşturuldu ve Trendyol'a yüklendi.",
        "trendyol_response": api_resp
    }

async def sync_products_from_source(db: Session):
    seller = db.query(SellerAccount).first()
    if not seller:
        seller = SellerAccount(is_mock_mode=True)
        db.add(seller)
        db.commit()
        db.refresh(seller)

    raw_products = await TrendyolClient.fetch_products(
        supplier_id=seller.supplier_id,
        api_key=seller.api_key,
        api_secret=seller.api_secret,
        is_mock=seller.is_mock_mode
    )

    synced_count = 0
    variant_count = 0

    for item in raw_products:
        model_code = item.get("model_code") or item.get("productCode", "DEMO-01")
        prod = db.query(Product).filter(Product.model_code == model_code).first()
        if not prod:
            prod = Product(
                seller_id=seller.id,
                model_code=model_code,
                title=item.get("title", "Örnek Ürün"),
                brand=item.get("brand", "Taç"),
                category_name=item.get("category_name", "Perde"),
                image_url=item.get("image_url")
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
            synced_count += 1

        for var_data in item.get("variants", []):
            barcode = var_data.get("barcode")
            variant = db.query(ProductVariant).filter(ProductVariant.barcode == barcode).first()
            if not variant:
                variant = ProductVariant(
                    product_id=prod.id,
                    barcode=barcode,
                    variant_name=var_data.get("name", "Standart"),
                    width_cm=float(var_data.get("w", 140)),
                    height_cm=float(var_data.get("h", 260)),
                    current_price=float(var_data.get("price", 299.90)),
                    cost_price=float(var_data.get("cost", 120.0)),
                    min_price=float(var_data.get("min_price", 219.90)),
                    max_price=float(var_data.get("max_price", 450.0)),
                    stock_quantity=int(var_data.get("stock", 50))
                )
                db.add(variant)
                db.commit()
                db.refresh(variant)
                variant_count += 1

                buybox = BuyboxTracking(
                    variant_id=variant.id,
                    is_active=True,
                    strategy="beat_by_diff",
                    price_diff=0.50,
                    has_buybox=True,
                    winner_seller_name="Bizim Mağaza",
                    last_buybox_price=variant.current_price
                )
                db.add(buybox)
                db.commit()

    return {
        "status": "success",
        "message": f"{synced_count} ana ürün ve {variant_count} varyant eşitlendi.",
        "is_mock": seller.is_mock_mode
    }
