from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import BuyboxTracking, ProductVariant, Product, PriceLog
from ..schemas import (
    BuyboxItemResponse,
    BuyboxTrackUpdate,
    PriceLogResponse,
    CompetitorAttackSimulation
)
from ..services.buybox_scanner import BuyboxScanner

router = APIRouter(prefix="/api/buybox", tags=["buybox"])

@router.get("", response_model=List[BuyboxItemResponse])
def get_buybox_items(db: Session = Depends(get_db)):
    trackings = db.query(BuyboxTracking).all()
    results = []
    for t in trackings:
        v = db.query(ProductVariant).filter(ProductVariant.id == t.variant_id).first()
        if not v:
            continue
        p = db.query(Product).filter(Product.id == v.product_id).first()
        results.append(
            BuyboxItemResponse(
                id=t.id,
                variant_id=v.id,
                barcode=v.barcode,
                product_title=p.title if p else "Ürün",
                variant_name=v.variant_name,
                current_price=v.current_price,
                min_price=v.min_price,
                has_buybox=t.has_buybox,
                last_buybox_price=t.last_buybox_price,
                winner_seller_name=t.winner_seller_name,
                competitor_lowest_price=t.competitor_lowest_price,
                is_active=t.is_active,
                strategy=t.strategy,
                price_diff=t.price_diff,
                last_checked_at=t.last_checked_at
            )
        )
    return results

@router.put("/{tracking_id}", response_model=BuyboxItemResponse)
def update_buybox_strategy(tracking_id: int, payload: BuyboxTrackUpdate, db: Session = Depends(get_db)):
    tracking = db.query(BuyboxTracking).filter(BuyboxTracking.id == tracking_id).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="Takip kaydı bulunamadı.")
    
    tracking.is_active = payload.is_active
    tracking.strategy = payload.strategy
    tracking.price_diff = payload.price_diff
    db.commit()
    db.refresh(tracking)

    v = db.query(ProductVariant).filter(ProductVariant.id == tracking.variant_id).first()
    p = db.query(Product).filter(Product.id == v.product_id).first()

    return BuyboxItemResponse(
        id=tracking.id,
        variant_id=v.id,
        barcode=v.barcode,
        product_title=p.title if p else "Ürün",
        variant_name=v.variant_name,
        current_price=v.current_price,
        min_price=v.min_price,
        has_buybox=tracking.has_buybox,
        last_buybox_price=tracking.last_buybox_price,
        winner_seller_name=tracking.winner_seller_name,
        competitor_lowest_price=tracking.competitor_lowest_price,
        is_active=tracking.is_active,
        strategy=tracking.strategy,
        price_diff=tracking.price_diff,
        last_checked_at=tracking.last_checked_at
    )

@router.post("/simulate-attack")
async def simulate_competitor_attack(payload: CompetitorAttackSimulation, db: Session = Depends(get_db)):
    tracking = db.query(BuyboxTracking).filter(BuyboxTracking.variant_id == payload.variant_id).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="Bu varyant için Buybox takibi bulunamadı.")
    
    result = await BuyboxScanner.process_buybox_check(
        db=db,
        tracking=tracking,
        simulated_competitor_price=payload.competitor_price,
        simulated_competitor_name=payload.competitor_name
    )
    return result

@router.get("/logs", response_model=List[PriceLogResponse])
def get_price_logs(limit: int = 30, db: Session = Depends(get_db)):
    logs = db.query(PriceLog).order_by(PriceLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        v = db.query(ProductVariant).filter(ProductVariant.id == l.variant_id).first()
        results.append(
            PriceLogResponse(
                id=l.id,
                variant_id=l.variant_id,
                barcode=v.barcode if v else "Bilinmiyor",
                old_price=l.old_price,
                new_price=l.new_price,
                trigger_source=l.trigger_source,
                reason=l.reason,
                created_at=l.created_at
            )
        )
    return results
