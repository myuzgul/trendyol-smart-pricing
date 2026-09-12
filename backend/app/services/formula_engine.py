import math
from typing import Dict, Any

class FormulaEngine:
    @staticmethod
    def calculate_variant_price(
        width_cm: float,
        height_cm: float,
        fabric_m2_cost: float,
        sewing_cost_per_m: float,
        fixed_overhead: float,
        cargo_cost: float,
        commission_rate: float,
        target_profit_margin: float,
        round_to_90: bool = True
    ) -> Dict[str, Any]:
        """
        Perde ve varyantlı ürünler için e-ticaret kârlılık formülü.
        """
        # 1. Metrekare ve Alan Hesabı
        width_m = max(width_cm / 100.0, 0.5)
        height_m = max(height_cm / 100.0, 0.5)
        m2 = width_m * height_m

        # 2. Üretim & Hammadde Maliyeti
        fabric_cost = m2 * fabric_m2_cost
        sewing_cost = width_m * sewing_cost_per_m
        total_direct_cost = fabric_cost + sewing_cost + fixed_overhead

        # 3. Toplam Temel Maliyet (Kargo Dahil)
        base_cost_with_cargo = total_direct_cost + cargo_cost

        # 4. Trendyol Komisyon & Hedef Kâr Payı ile Satış Fiyatı Formülü
        # Fiyat = Maliyet / (1 - Komisyon - Kâr_Marjı)
        divisor = 1.0 - (commission_rate + target_profit_margin)
        if divisor <= 0.1:
            divisor = 0.1  # Güvenlik payı

        raw_selling_price = base_cost_with_cargo / divisor

        # 5. Taban Fiyat (Safety Floor Price - Minimum %5 kâr ile en düşük kurtarır fiyat)
        min_divisor = 1.0 - (commission_rate + 0.05)
        raw_min_price = base_cost_with_cargo / max(min_divisor, 0.2)

        # 6. Psikolojik Fiyatlandırma (.90 ile bitirme)
        if round_to_90:
            final_selling_price = math.floor(raw_selling_price) + 0.90
            if final_selling_price < raw_selling_price:
                final_selling_price += 1.0
            final_min_price = math.floor(raw_min_price) + 0.90
        else:
            final_selling_price = round(raw_selling_price, 2)
            final_min_price = round(raw_min_price, 2)

        # 7. Net Kâr Tutarı ve Gerçek Marj
        trendyol_commission_cut = final_selling_price * commission_rate
        net_income = final_selling_price - trendyol_commission_cut - cargo_cost - total_direct_cost
        real_profit_margin_pct = round((net_income / final_selling_price) * 100, 1)

        return {
            "m2": round(m2, 2),
            "fabric_cost": round(fabric_cost, 2),
            "sewing_cost": round(sewing_cost, 2),
            "direct_cost": round(total_direct_cost, 2),
            "total_cost": round(base_cost_with_cargo, 2),
            "calculated_selling_price": round(final_selling_price, 2),
            "calculated_min_price": round(final_min_price, 2),
            "profit_amount": round(net_income, 2),
            "profit_margin_pct": real_profit_margin_pct
        }
