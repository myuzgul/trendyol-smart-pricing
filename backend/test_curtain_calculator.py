import sys
import os

if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.curtain_calculator import CurtainCalculator

def run_calculator_tests():
    print("=== PERDE HESAPLAMA MOTORU TESTLERİ ===\n")

    # 1. TÜL PERDE TESTLERİ
    print("1. TÜL PERDE TESTLERİ (En: 100 cm, Metre Fiyatı: 100 TL)")
    tul_pilesiz = CurtainCalculator.calculate_tul_perde(100, 260, 100.0, "pilesiz")
    tul_1x2 = CurtainCalculator.calculate_tul_perde(100, 260, 100.0, "1x2")
    tul_1x25 = CurtainCalculator.calculate_tul_perde(100, 260, 100.0, "1x2.5")
    tul_1x3 = CurtainCalculator.calculate_tul_perde(100, 260, 100.0, "1x3")

    print(f"   -> Pilesiz Metre: {tul_pilesiz['required_meters']} m (Beklenen: 1.20 m)")
    print(f"   -> 1x2 Pile Metre: {tul_1x2['required_meters']} m (Beklenen: 2.20 m)")
    print(f"   -> 1x2.5 Pile Metre: {tul_1x25['required_meters']} m (Beklenen: 2.70 m)")
    print(f"   -> 1x3 Pile Metre: {tul_1x3['required_meters']} m (Beklenen: 3.20 m)")

    assert tul_pilesiz['required_meters'] == 1.20
    assert tul_1x2['required_meters'] == 2.20
    assert tul_1x25['required_meters'] == 2.70
    assert tul_1x3['required_meters'] == 3.20
    print("   [OK] Tül Perde Pile Hesapları Başarılı!\n")

    # 2. STOR / ZEBRA PERDE TESTLERİ
    print("2. STOR / ZEBRA TESTLERİ (M2 Fiyatı: 100 TL)")
    
    # Test A: En 60, Boy 200 -> 2 m² olmalı
    s1 = CurtainCalculator.calculate_stor_zebra(60, 200, 100.0)
    print(f"   -> En 60, Boy 200: M2 = {s1['calculated_m2']} m² (Beklenen: 2.00 m²)")
    assert s1['calculated_m2'] == 2.00

    # Test B: En 100, Boy 180 -> 2 m² olmalı
    s2 = CurtainCalculator.calculate_stor_zebra(100, 180, 100.0)
    print(f"   -> En 100, Boy 180: M2 = {s2['calculated_m2']} m² (Beklenen: 2.00 m²)")
    assert s2['calculated_m2'] == 2.00

    # Test C: En 75, Boy 220 -> En 100, Boy 220 -> 2.2 m² olmalı
    s3 = CurtainCalculator.calculate_stor_zebra(75, 220, 100.0)
    print(f"   -> En 75, Boy 220: M2 = {s3['calculated_m2']} m² (Beklenen: 2.20 m²)")
    assert s3['calculated_m2'] == 2.20

    # Test D: En 125, Boy 215 -> En 130, Boy 220 -> 1.30 * 2.20 = 2.86 m²
    s4 = CurtainCalculator.calculate_stor_zebra(125, 215, 100.0)
    print(f"   -> En 125, Boy 215: M2 = {s4['calculated_m2']} m² (Beklenen: 2.86 m²)")
    assert s4['calculated_m2'] == 2.86

    # Test E: En 165, Boy 215 (En > 150 ve Boy > 200) -> En 200, Boy 220 -> 4.4 m²
    s5 = CurtainCalculator.calculate_stor_zebra(165, 215, 100.0)
    print(f"   -> En 165, Boy 215: M2 = {s5['calculated_m2']} m² (Beklenen: 4.40 m²)")
    assert s5['calculated_m2'] == 4.40

    # Test F: Etek Dilimli ve Boncuklu (+50 +50 TL/m²)
    s6 = CurtainCalculator.calculate_stor_zebra(100, 200, 100.0, has_skirt=True, has_bead=True)
    print(f"   -> Etek (+50) & Boncuk (+50) Birim Fiyat: {s6['unit_m2_price']} TL/m² (Beklenen: 200.00 TL/m²)")
    assert s6['unit_m2_price'] == 200.00
    print("   [OK] Stor / Zebra Hesapları Başarılı!\n")

    # 3. FON PERDE TESTLERİ
    print("3. FON PERDE TESTLERİ (En: 100 cm, Metre Fiyatı: 100 TL)")
    fon_tek = CurtainCalculator.calculate_fon_perde(100, 260, 100.0, "tek_kanat", "1x2.5")
    fon_cift = CurtainCalculator.calculate_fon_perde(100, 260, 100.0, "cift_kanat", "1x2.5")
    print(f"   -> Tek Kanat 1x2.5 Metre: {fon_tek['required_meters']} m (Beklenen: 2.70 m)")
    print(f"   -> Çift Kanat 1x2.5 Metre: {fon_cift['required_meters']} m (Beklenen: 5.40 m)")
    assert fon_tek['required_meters'] == 2.70
    assert fon_cift['required_meters'] == 5.40
    print("   [OK] Fon Perde Hesapları Başarılı!\n")

    # 4. KARARTMA & SATEN GÜNEŞLİK TESTLERİ
    print("4. KARARTMA / SATEN GÜNEŞLİK TESTLERİ (En: 140 cm, Metre Fiyatı: 80 TL)")
    blackout = CurtainCalculator.calculate_blackout_saten(140, 260, 80.0)
    print(f"   -> Metre: {blackout['required_meters']} m (Beklenen: 1.60 m)")
    assert blackout['required_meters'] == 1.60
    print("   [OK] Karartma & Saten Güneşlik Hesapları Başarılı!\n")

    print("🎉 TÜM FORMÜLLER %100 BAŞARIYLA DOĞRULANDI!")

if __name__ == "__main__":
    run_calculator_tests()
