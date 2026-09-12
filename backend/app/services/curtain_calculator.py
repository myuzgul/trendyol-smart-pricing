import math
from typing import Dict, Any, List, Optional

class CurtainCalculator:
    """
    Perde ve Güneşlik Sistemleri için Sektörel Fiyat Hesaplama Motoru
    """

    @staticmethod
    def calculate_tul_perde(
        width_cm: float,
        height_cm: float,
        meter_price: float,
        pleat_type: str = "1x2.5", # "pilesiz", "1x2", "1x2.5", "1x3"
        extra_sewing_cost: float = 0.0,
        cargo_cost: float = 45.0,
        commission_rate: float = 0.20,
        target_profit_margin: float = 0.25,
        round_to_90: bool = True
    ) -> Dict[str, Any]:
        """
        1. TÜL PERDE HESAPLAMASI
        - Pilesiz: (en + 20 cm) * metre_fiyati
        - 1x2: (en * 2 + 20 cm) * metre_fiyati
        - 1x2.5: (en * 2.5 + 20 cm) * metre_fiyati
        - 1x3: (en * 3 + 20 cm) * metre_fiyati
        - Boy fiyata dahil değildir.
        """
        multiplier = 1.0
        if pleat_type == "1x2":
            multiplier = 2.0
        elif pleat_type == "1x2.5":
            multiplier = 2.5
        elif pleat_type == "1x3":
            multiplier = 3.0
        elif pleat_type == "pilesiz":
            multiplier = 1.0

        # Kumaş metre hesabı: (en_cm * katsayı + 20 cm) / 100
        required_meters = ((width_cm * multiplier) + 20.0) / 100.0
        fabric_cost = required_meters * meter_price
        direct_cost = fabric_cost + extra_sewing_cost
        total_cost_with_cargo = direct_cost + cargo_cost

        # Satış Fiyatı Formülü (Komisyon ve Kâr Marjı)
        divisor = max(1.0 - (commission_rate + target_profit_margin), 0.1)
        raw_price = total_cost_with_cargo / divisor

        min_divisor = max(1.0 - (commission_rate + 0.05), 0.2)
        raw_min_price = total_cost_with_cargo / min_divisor

        if round_to_90:
            final_price = math.floor(raw_price) + 0.90
            final_min_price = math.floor(raw_min_price) + 0.90
        else:
            final_price = round(raw_price, 2)
            final_min_price = round(raw_min_price, 2)

        commission_amount = final_price * commission_rate
        net_income = final_price - commission_amount - cargo_cost
        net_profit = net_income - direct_cost
        margin_pct = round((net_profit / final_price) * 100, 1) if final_price > 0 else 0

        return {
            "category": "Tül Perde",
            "pleat_type": pleat_type,
            "width_cm": width_cm,
            "height_cm": height_cm,
            "required_meters": round(required_meters, 2),
            "fabric_cost": round(fabric_cost, 2),
            "direct_cost": round(direct_cost, 2),
            "total_cost": round(total_cost_with_cargo, 2),
            "sale_price": round(final_price, 2),
            "min_price": round(final_min_price, 2),
            "commission_amount": round(commission_amount, 2),
            "net_income": round(net_income, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_pct": margin_pct
        }

    @staticmethod
    def calculate_stor_zebra(
        width_cm: float,
        height_cm: float,
        m2_price: float,
        has_skirt: bool = False, # Etek dilimli mi?
        skirt_m2_extra: float = 50.0, # Etek dilim m² farkı (modüler)
        has_bead: bool = False, # Boncuklu mu? (Sadece etekli ise)
        bead_m2_extra: float = 50.0, # Boncuk m² farkı (modüler)
        mechanism_cost: float = 40.0, # Kasa/Mekanizma maliyeti
        cargo_cost: float = 45.0,
        commission_rate: float = 0.20,
        target_profit_margin: float = 0.25,
        round_to_90: bool = True
    ) -> Dict[str, Any]:
        """
        2. STOR PERDE, ZEBRA PERDE VE ÇİFTLİ SİSTEM TÜL STOR PERDE HESAPLAMASI
        - En ve boy her zaman bir üst 10'luğa yuvarlanır (Örn: 125 -> 130, 215 -> 220)
        - Minimum metrekare 2 m² (En min 100 cm, boy min 200 cm)
        - 150 cm'den büyük en (200'e kadar) VE boy > 200 cm ise: En 200 cm sayılır, boy üst 10'luğa yuvarlanır.
        - Etek dilimli ise +50 TL/m² (modüler)
        - Boncuklu ise +50 TL/m² (modüler, sadece etek dilimli ise)
        """
        # 1. Üst 10'luğa yuvarlama
        rounded_w = math.ceil(width_cm / 10.0) * 10.0
        rounded_h = math.ceil(height_cm / 10.0) * 10.0

        # 2. Özel Kural: 150 < en <= 200 VE boy > 200 ise -> En 200 cm sayılır
        if (150.0 < width_cm <= 200.0) and (height_cm > 200.0):
            effective_w = 200.0
            effective_h = rounded_h
        else:
            # 3. Minimum 2 m² Kuralı (En min 100, boy min 200)
            effective_w = max(rounded_w, 100.0)
            effective_h = max(rounded_h, 200.0)

        # Metrekare Hesabı
        calculated_m2 = (effective_w * effective_h) / 10000.0
        calculated_m2 = max(calculated_m2, 2.0) # Kesin min 2 m²

        # Birim M² Fiyatı
        unit_m2_price = m2_price
        if has_skirt:
            unit_m2_price += skirt_m2_extra
            if has_bead:
                unit_m2_price += bead_m2_extra

        fabric_cost = calculated_m2 * unit_m2_price
        direct_cost = fabric_cost + mechanism_cost
        total_cost_with_cargo = direct_cost + cargo_cost

        divisor = max(1.0 - (commission_rate + target_profit_margin), 0.1)
        raw_price = total_cost_with_cargo / divisor

        min_divisor = max(1.0 - (commission_rate + 0.05), 0.2)
        raw_min_price = total_cost_with_cargo / min_divisor

        if round_to_90:
            final_price = math.floor(raw_price) + 0.90
            final_min_price = math.floor(raw_min_price) + 0.90
        else:
            final_price = round(raw_price, 2)
            final_min_price = round(raw_min_price, 2)

        commission_amount = final_price * commission_rate
        net_income = final_price - commission_amount - cargo_cost
        net_profit = net_income - direct_cost
        margin_pct = round((net_profit / final_price) * 100, 1) if final_price > 0 else 0

        return {
            "category": "Stor / Zebra Perde",
            "width_cm": width_cm,
            "height_cm": height_cm,
            "effective_width_cm": effective_w,
            "effective_height_cm": effective_h,
            "calculated_m2": round(calculated_m2, 2),
            "unit_m2_price": round(unit_m2_price, 2),
            "has_skirt": has_skirt,
            "has_bead": has_bead if has_skirt else False,
            "fabric_cost": round(fabric_cost, 2),
            "direct_cost": round(direct_cost, 2),
            "total_cost": round(total_cost_with_cargo, 2),
            "sale_price": round(final_price, 2),
            "min_price": round(final_min_price, 2),
            "commission_amount": round(commission_amount, 2),
            "net_income": round(net_income, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_pct": margin_pct
        }

    @staticmethod
    def calculate_fon_perde(
        width_cm: float,
        height_cm: float,
        meter_price: float,
        panel_type: str = "tek_kanat", # "tek_kanat", "cift_kanat"
        pleat_type: str = "1x2.5", # "pilesiz", "1x2", "1x2.5", "1x3"
        extra_sewing_cost: float = 0.0,
        cargo_cost: float = 45.0,
        commission_rate: float = 0.20,
        target_profit_margin: float = 0.25,
        round_to_90: bool = True
    ) -> Dict[str, Any]:
        """
        3. FON PERDE HESAPLAMASI
        - Tek Kanat veya Çift Kanat
        - Pilesiz: (en + 20) * metre_fiyat
        - 1x2: (en * 2 + 20) * metre_fiyat
        - 1x2.5: (en * 2.5 + 20) * metre_fiyat
        - 1x3: (en * 3 + 20) * metre_fiyat
        - Çift kanat ise sonuç x 2 ile çarpılır.
        - Boy fiyata dahil değildir.
        """
        multiplier = 1.0
        if pleat_type == "1x2":
            multiplier = 2.0
        elif pleat_type == "1x2.5":
            multiplier = 2.5
        elif pleat_type == "1x3":
            multiplier = 3.0
        elif pleat_type == "pilesiz":
            multiplier = 1.0

        required_meters_single = ((width_cm * multiplier) + 20.0) / 100.0
        is_double = panel_type == "cift_kanat"
        panel_multiplier = 2.0 if is_double else 1.0

        total_meters = required_meters_single * panel_multiplier
        fabric_cost = total_meters * meter_price
        direct_cost = fabric_cost + (extra_sewing_cost * panel_multiplier)
        total_cost_with_cargo = direct_cost + cargo_cost

        divisor = max(1.0 - (commission_rate + target_profit_margin), 0.1)
        raw_price = total_cost_with_cargo / divisor

        min_divisor = max(1.0 - (commission_rate + 0.05), 0.2)
        raw_min_price = total_cost_with_cargo / min_divisor

        if round_to_90:
            final_price = math.floor(raw_price) + 0.90
            final_min_price = math.floor(raw_min_price) + 0.90
        else:
            final_price = round(raw_price, 2)
            final_min_price = round(raw_min_price, 2)

        commission_amount = final_price * commission_rate
        net_income = final_price - commission_amount - cargo_cost
        net_profit = net_income - direct_cost
        margin_pct = round((net_profit / final_price) * 100, 1) if final_price > 0 else 0

        return {
            "category": "Fon Perde",
            "panel_type": panel_type,
            "pleat_type": pleat_type,
            "width_cm": width_cm,
            "height_cm": height_cm,
            "required_meters": round(total_meters, 2),
            "fabric_cost": round(fabric_cost, 2),
            "direct_cost": round(direct_cost, 2),
            "total_cost": round(total_cost_with_cargo, 2),
            "sale_price": round(final_price, 2),
            "min_price": round(final_min_price, 2),
            "commission_amount": round(commission_amount, 2),
            "net_income": round(net_income, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_pct": margin_pct
        }

    @staticmethod
    def calculate_blackout_saten(
        width_cm: float,
        height_cm: float,
        meter_price: float,
        cargo_cost: float = 45.0,
        commission_rate: float = 0.20,
        target_profit_margin: float = 0.25,
        round_to_90: bool = True
    ) -> Dict[str, Any]:
        """
        4. KARARTMA FON PERDE VE SATEN GÜNEŞLİK PERDE
        - (en + 20) / 100 * metre_fiyat
        - Boy fiyatı değiştirmez.
        """
        required_meters = (width_cm + 20.0) / 100.0
        fabric_cost = required_meters * meter_price
        direct_cost = fabric_cost
        total_cost_with_cargo = direct_cost + cargo_cost

        divisor = max(1.0 - (commission_rate + target_profit_margin), 0.1)
        raw_price = total_cost_with_cargo / divisor

        min_divisor = max(1.0 - (commission_rate + 0.05), 0.2)
        raw_min_price = total_cost_with_cargo / min_divisor

        if round_to_90:
            final_price = math.floor(raw_price) + 0.90
            final_min_price = math.floor(raw_min_price) + 0.90
        else:
            final_price = round(raw_price, 2)
            final_min_price = round(raw_min_price, 2)

        commission_amount = final_price * commission_rate
        net_income = final_price - commission_amount - cargo_cost
        net_profit = net_income - direct_cost
        margin_pct = round((net_profit / final_price) * 100, 1) if final_price > 0 else 0

        return {
            "category": "Karartma / Saten Güneşlik",
            "width_cm": width_cm,
            "height_cm": height_cm,
            "required_meters": round(required_meters, 2),
            "fabric_cost": round(fabric_cost, 2),
            "direct_cost": round(direct_cost, 2),
            "total_cost": round(total_cost_with_cargo, 2),
            "sale_price": round(final_price, 2),
            "min_price": round(final_min_price, 2),
            "commission_amount": round(commission_amount, 2),
            "net_income": round(net_income, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_pct": margin_pct
        }
