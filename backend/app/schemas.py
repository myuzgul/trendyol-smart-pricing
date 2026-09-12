from pydantic import BaseModel
from typing import List, Optional
import datetime

class VariantBase(BaseModel):
    barcode: str
    variant_name: str
    width_cm: float
    height_cm: float
    fabric_type: str
    stock_quantity: int
    current_price: float
    cost_price: float
    commission_rate: float
    cargo_cost: float
    packaging_cost: float
    min_price: float
    max_price: float

class VariantResponse(VariantBase):
    id: int
    product_id: int
    product_title: Optional[str] = None
    brand: Optional[str] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    last_synced_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: int
    model_code: str
    title: str
    brand: str
    category_name: str
    image_url: Optional[str] = None
    variants: List[VariantResponse] = []

    class Config:
        from_attributes = True

# Toplu Fiyat Ayarlama Talebi
class BulkAdjustmentRequest(BaseModel):
    scope: str # "all", "category", "selected"
    category_name: Optional[str] = None
    selected_variant_ids: Optional[List[int]] = []
    
    adjustment_type: str # "percentage" veya "fixed_amount"
    operation: str # "increase" veya "decrease"
    value: float # örn: 10 (%10) veya 50 (50 TL)
    round_to_90: bool = False # .90 TL ile bitir
    default_cost_margin: Optional[float] = 0.40 # Varsayılan maliyet oranı

class BulkAdjustmentItemPreview(BaseModel):
    variant_id: int
    product_title: str
    brand: str
    category_name: str
    variant_name: str
    barcode: str
    stock_quantity: int
    old_price: float
    new_price: float
    price_diff: float
    commission_rate: float
    commission_amount: float
    estimated_net_income: float # Satıcının eline geçecek net tutar
    estimated_net_profit: float
    profit_margin_pct: float

class BulkSyncTrendyolRequest(BaseModel):
    items: List[dict] # [{"variant_id": 1, "new_price": 329.90, "cost_price": 120.0}]

class SingleVariantPriceUpdate(BaseModel):
    variant_id: int
    new_price: float
    cost_price: Optional[float] = None

class BuyboxTrackUpdate(BaseModel):
    is_active: bool
    strategy: str # beat_by_diff, match, alert_only
    price_diff: float = 0.50

class BuyboxItemResponse(BaseModel):
    id: int
    variant_id: int
    barcode: str
    product_title: str
    variant_name: str
    current_price: float
    min_price: float
    has_buybox: bool
    last_buybox_price: Optional[float] = None
    winner_seller_name: Optional[str] = None
    competitor_lowest_price: Optional[float] = None
    is_active: bool
    strategy: str
    price_diff: float
    last_checked_at: Optional[datetime.datetime]

class PriceLogResponse(BaseModel):
    id: int
    variant_id: int
    barcode: Optional[str] = None
    old_price: float
    new_price: float
    trigger_source: str
    reason: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SellerSettingsUpdate(BaseModel):
    supplier_id: str
    api_key: str
    api_secret: str
    is_mock_mode: bool
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    telegram_enabled: bool = False

class SellerSettingsResponse(SellerSettingsUpdate):
    id: int

    class Config:
        from_attributes = True

class CompetitorAttackSimulation(BaseModel):
    variant_id: int
    competitor_name: str = "Rakip_Perdeci_XYZ"
    competitor_price: float
