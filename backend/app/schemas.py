from pydantic import BaseModel
from typing import List, Optional, Dict, Any
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

# Perde Hesaplama Şemaları
class CurtainSizeInput(BaseModel):
    width: float
    height: float

class CurtainCalculateBatchRequest(BaseModel):
    category_type: str # "tul", "stor_zebra", "fon", "karartma_saten"
    unit_price: float # Metre veya M² fiyatı
    pleat_type: Optional[str] = "1x2.5" # "pilesiz", "1x2", "1x2.5", "1x3"
    panel_type: Optional[str] = "tek_kanat" # "tek_kanat", "cift_kanat"
    has_skirt: Optional[bool] = False
    skirt_m2_extra: Optional[float] = 50.0
    has_bead: Optional[bool] = False
    bead_m2_extra: Optional[float] = 50.0
    cargo_cost: Optional[float] = 45.0
    commission_rate: Optional[float] = 0.20
    target_profit_margin: Optional[float] = 0.25
    round_to_90: Optional[bool] = True
    sizes: List[CurtainSizeInput]

class CurtainCalculateItemResult(BaseModel):
    width_cm: float
    height_cm: float
    size_label: str
    calculated_quantity_or_m2: float
    fabric_cost: float
    direct_cost: float
    total_cost: float
    sale_price: float
    min_price: float
    commission_amount: float
    net_income: float
    net_profit: float
    profit_margin_pct: float

# Trendyol V2 Uyumlu Ürün Yükleme Şeması
class CreateCurtainProductRequestV2(BaseModel):
    title: str
    brand_id: int = 361
    brand_name: str = "Taç"
    category_id: int = 2045
    category_name: str = "Tül Perde"
    model_code: str
    description: Optional[str] = "<p>Özel ölçü kaliteli perde. Yıkamaya dayanıklı, dökümlü ve ütü istemez kumaş.</p>"
    color: Optional[str] = "Ekru"
    cargo_company_id: Optional[int] = 10 # Trendyol Express
    delivery_duration: Optional[int] = 2 # 2 gün
    vat_rate: Optional[int] = 10 # %10 KDV
    dimensional_weight: Optional[float] = 2.0 # Desi
    image_url: Optional[str] = None
    variants: List[Dict[str, Any]]

# Toplu Fiyat Ayarlama Şemaları
class BulkAdjustmentRequest(BaseModel):
    scope: str # "all", "category", "selected"
    category_name: Optional[str] = None
    selected_variant_ids: Optional[List[int]] = []
    adjustment_type: str # "percentage" veya "fixed_amount"
    operation: str # "increase" veya "decrease"
    value: float
    round_to_90: bool = False

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
    estimated_net_income: float
    estimated_net_profit: float
    profit_margin_pct: float

class BulkSyncTrendyolRequest(BaseModel):
    items: List[dict]

class SingleVariantPriceUpdate(BaseModel):
    variant_id: int
    new_price: float
    cost_price: Optional[float] = None

class BuyboxTrackUpdate(BaseModel):
    is_active: bool
    strategy: str
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
