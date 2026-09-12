import sys
import os
import asyncio

# Ensure utf-8 stdout on windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.services.formula_engine import FormulaEngine
from app.services.buybox_scanner import BuyboxScanner
from app.models import Product, ProductVariant, BuyboxTracking, SellerAccount
from app.routers.products import sync_products_from_source

async def run_tests():
    print("[TEST 1] Formül Motoru Test Ediliyor...")
    calc = FormulaEngine.calculate_variant_price(
        width_cm=140.0,
        height_cm=260.0,
        fabric_m2_cost=65.0,
        sewing_cost_per_m=20.0,
        fixed_overhead=15.0,
        cargo_cost=45.0,
        commission_rate=0.20,
        target_profit_margin=0.25,
        round_to_90=True
    )
    print(f"   -> M2: {calc['m2']} m2")
    print(f"   -> Doğrudan Üretim Maliyeti: {calc['direct_cost']} TL")
    print(f"   -> Toplam Maliyet (Kargo Dahil): {calc['total_cost']} TL")
    print(f"   -> Hesaplanan Satış Fiyatı: {calc['calculated_selling_price']} TL")
    print(f"   -> Taban Fiyat (Safety Limit): {calc['calculated_min_price']} TL")
    print(f"   -> Net Kâr: {calc['profit_amount']} TL (%{calc['profit_margin_pct']})")

    assert calc['calculated_selling_price'] > calc['total_cost'], "Satış fiyatı maliyetten yüksek olmalı!"
    assert calc['calculated_min_price'] < calc['calculated_selling_price'], "Taban fiyat normal fiyattan düşük olmalı!"
    print("   [OK] Formül Motoru Başarıyla Doğrulandı!\n")

    print("[TEST 2] Veritabanı ve Buybox Scanner Test Ediliyor...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Sync initial products
    await sync_products_from_source(db)

    # Test Buybox tracking item
    variant = db.query(ProductVariant).first()
    tracking = db.query(BuyboxTracking).filter(BuyboxTracking.variant_id == variant.id).first()

    print(f"   Seçilen Varyant: {variant.variant_name} ({variant.barcode})")
    print(f"   Mevcut Fiyat: {variant.current_price} TL | Taban Fiyat: {variant.min_price} TL")

    # Test Case A: Rakip fiyat kırdı ama taban fiyattan yüksek (Repricer devreye girmeli)
    print("\n   [Test A] Rakip 275.00 TL yaptı (Güvenli Alan)...")
    res_a = await BuyboxScanner.process_buybox_check(
        db=db,
        tracking=tracking,
        simulated_competitor_price=275.0,
        simulated_competitor_name="Test_Rakip_1"
    )
    print(f"   Sonuç: {res_a['status']} | Mesaj: {res_a['message']}")
    assert res_a['status'] == 'REPRICED_SUCCESS', "Repricer fiyatı düşürüp buybox'ı geri almalıydı!"
    assert variant.current_price == 274.50, f"Beklenen fiyat 274.50, gelen {variant.current_price}"
    print("   [OK] [Test A] Repricer Başarıyla Çalıştı!")

    # Test Case B: Rakip zararına 150 TL yaptı (Taban fiyat 219 TL -> Güvenlik kilidi devreye girmeli!)
    print("\n   [Test B] Rakip zararına 150.00 TL yaptı (Taban Fiyat 219.90 TL)...")
    res_b = await BuyboxScanner.process_buybox_check(
        db=db,
        tracking=tracking,
        simulated_competitor_price=150.0,
        simulated_competitor_name="Zararina_Satan_Rakip"
    )
    print(f"   Sonuç: {res_b['status']} | Mesaj: {res_b['message']}")
    assert res_b['status'] == 'SAFETY_STOP', "Güvenlik kilidi devreye girmeliydi!"
    print("   [OK] [Test B] Güvenlik Kilidi Başarıyla Kârı Korudu!")

    db.close()
    print("\n[TAMAMLANDI] TÜM TESTLER BAŞARIYLA TAMAMLANDI!")

if __name__ == "__main__":
    asyncio.run(run_tests())
