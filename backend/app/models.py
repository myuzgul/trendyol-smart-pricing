import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class SellerAccount(Base):
    __tablename__ = "seller_accounts"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(String(50), default="DEMO_SUPPLIER_123")
    api_key = Column(String(100), default="demo_api_key")
    api_secret = Column(String(100), default="demo_api_secret")
    is_mock_mode = Column(Boolean, default=True)
    telegram_bot_token = Column(String(150), nullable=True)
    telegram_chat_id = Column(String(50), nullable=True)
    telegram_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    products = relationship("Product", back_populates="seller")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("seller_accounts.id"), nullable=True)
    model_code = Column(String(100), index=True)
    title = Column(String(255))
    brand = Column(String(100), default="Taç")
    category_name = Column(String(100), default="Fon & Tül Perde")
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    seller = relationship("SellerAccount", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    barcode = Column(String(100), unique=True, index=True)
    variant_name = Column(String(100)) # e.g. "140 x 260 cm"
    width_cm = Column(Float, default=140.0)
    height_cm = Column(Float, default=260.0)
    fabric_type = Column(String(100), default="Jakar Kumaş")
    stock_quantity = Column(Integer, default=50)
    
    # Pricing info
    current_price = Column(Float, default=299.90)
    cost_price = Column(Float, default=120.0)
    commission_rate = Column(Float, default=0.20) # %20 Trendyol komisyonu
    cargo_cost = Column(Float, default=45.0) # Kargo baremi
    packaging_cost = Column(Float, default=15.0) # Paketleme & Aksesuar
    
    # Safety bounds for Repricer
    min_price = Column(Float, default=219.90) # Kâr sağlayan minimum taban fiyat
    max_price = Column(Float, default=450.0)
    
    last_synced_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="variants")
    buybox_tracking = relationship("BuyboxTracking", back_populates="variant", uselist=False, cascade="all, delete-orphan")
    price_logs = relationship("PriceLog", back_populates="variant", cascade="all, delete-orphan")

class PricingFormula(Base):
    __tablename__ = "pricing_formulas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    category = Column(String(100), default="Perde")
    fabric_m2_cost = Column(Float, default=65.0) # Kumaş m² maliyeti (TL)
    sewing_cost_per_m = Column(Float, default=20.0) # Dikiş ve ekstrafor maliyeti (TL)
    fixed_overhead = Column(Float, default=15.0) # Paketleme & Kutu
    cargo_cost = Column(Float, default=45.0) # Kargo
    commission_rate = Column(Float, default=0.20) # Trendyol Komisyon %20
    target_profit_margin = Column(Float, default=0.25) # Hedef Kâr Marjı %25
    round_to_90 = Column(Boolean, default=True) # Fiyat sonunu .90 yap (psikolojik fiyat)
    is_default = Column(Boolean, default=False)

class BuyboxTracking(Base):
    __tablename__ = "buybox_trackings"

    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), unique=True)
    is_active = Column(Boolean, default=True)
    strategy = Column(String(50), default="beat_by_diff") # beat_by_diff, match, alert_only
    price_diff = Column(Float, default=0.50) # Rakipten 0.50 TL ucuz ol
    
    last_buybox_price = Column(Float, nullable=True)
    has_buybox = Column(Boolean, default=True)
    winner_seller_name = Column(String(100), default="Bizim Mağaza")
    competitor_lowest_price = Column(Float, nullable=True)
    
    last_checked_at = Column(DateTime, default=datetime.datetime.utcnow)

    variant = relationship("ProductVariant", back_populates="buybox_tracking")

class PriceLog(Base):
    __tablename__ = "price_logs"

    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"))
    old_price = Column(Float)
    new_price = Column(Float)
    trigger_source = Column(String(50)) # "formula_batch", "repricer_auto", "manual_sync"
    reason = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    variant = relationship("ProductVariant", back_populates="price_logs")
