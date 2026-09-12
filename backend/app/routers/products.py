from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime

from ..database import get_db
from ..models import Product, ProductVariant, SellerAccount, BuyboxTracking
from ..schemas import ProductResponse, VariantResponse
from ..services.trendyol_client import TrendyolClient

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    if not products:
        # İlk açılışta demo verileri yükle
        sync_products_from_source(db)
        products = db.query(Product).all()
    return products

@router.post("/sync")
async def sync_products(db: Session = Depends(get_db)):
    return await sync_products_from_source(db)

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

                # Buybox Takip kaydı oluştur
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
        "message": f"{synced_count} ana ürün ve {variant_count} varyant Trendyol'dan eşitlendi.",
        "is_mock": seller.is_mock_mode
    }
