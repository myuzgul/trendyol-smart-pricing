import datetime
from sqlalchemy.orm import Session
from ..models import BuyboxTracking, ProductVariant, Product, SellerAccount, PriceLog
from .telegram_service import TelegramService
from .trendyol_client import TrendyolClient

class BuyboxScanner:
    @staticmethod
    async def process_buybox_check(
        db: Session,
        tracking: BuyboxTracking,
        simulated_competitor_price: float = None,
        simulated_competitor_name: str = None
    ):
        variant = db.query(ProductVariant).filter(ProductVariant.id == tracking.variant_id).first()
        if not variant:
            return None
        
        product = db.query(Product).filter(Product.id == variant.product_id).first()
        seller = db.query(SellerAccount).first()

        # Rakiplerin fiyat bilgisi (Canlı API / Simülatör)
        if simulated_competitor_price is not None:
            comp_price = simulated_competitor_price
            comp_seller = simulated_competitor_name or "Rakip_Magaza"
        else:
            # Otomatik tarama durumunda mevcut kayıt veya rakip simülasyonu
            comp_price = tracking.competitor_lowest_price or (variant.current_price - 5.0)
            comp_seller = tracking.winner_seller_name if not tracking.has_buybox else "Rakip_Satici"

        tracking.last_checked_at = datetime.datetime.utcnow()
        tracking.competitor_lowest_price = comp_price

        # Buybox Kontrolü: Eğer rakip fiyatı bizim mevcut fiyatımızdan düşükse Buybox ondadır
        if comp_price < variant.current_price:
            tracking.has_buybox = False
            tracking.winner_seller_name = comp_seller
            tracking.last_buybox_price = comp_price

            # Otomatik Repricer Kontrolü
            if tracking.is_active and tracking.strategy in ("beat_by_diff", "match"):
                if tracking.strategy == "beat_by_diff":
                    target_price = round(comp_price - tracking.price_diff, 2)
                else:
                    target_price = round(comp_price, 2)

                # GÜVENLİK KİLİDİ: Taban fiyattan (min_price) aşağı inilemez!
                if target_price < variant.min_price:
                    # Güvenlik kilidi devreye girdi - Zararına satış engellendi!
                    if seller and seller.telegram_enabled and seller.telegram_bot_token and seller.telegram_chat_id:
                        await TelegramService.send_buybox_lost_alert(
                            bot_token=seller.telegram_bot_token,
                            chat_id=seller.telegram_chat_id,
                            product_title=product.title,
                            variant_name=variant.variant_name,
                            barcode=variant.barcode,
                            my_price=variant.current_price,
                            competitor_price=comp_price,
                            competitor_name=comp_seller,
                            safety_stop=True,
                            min_price=variant.min_price
                        )
                    db.commit()
                    return {
                        "status": "SAFETY_STOP",
                        "message": f"Rakip fiyatı ({comp_price:.2f} TL) çok düşük. Taban kâr limitiniz ({variant.min_price:.2f} TL) korundu.",
                        "has_buybox": False
                    }
                else:
                    # Güvenli: Fiyatı güncelle ve Buybox'ı geri al
                    old_price = variant.current_price
                    variant.current_price = target_price
                    variant.last_synced_at = datetime.datetime.utcnow()
                    tracking.has_buybox = True
                    tracking.winner_seller_name = "Bizim Mağaza (Buybox Kazanıldı)"
                    tracking.last_buybox_price = target_price

                    # Log oluştur
                    log = PriceLog(
                        variant_id=variant.id,
                        old_price=old_price,
                        new_price=target_price,
                        trigger_source="repricer_auto",
                        reason=f"Rakip {comp_seller} ({comp_price:.2f} TL) geçildi. Buybox alındı."
                    )
                    db.add(log)
                    db.commit()

                    # Trendyol API'ye fiyat gönder
                    await TrendyolClient.update_price_and_inventory(
                        supplier_id=seller.supplier_id if seller else "DEMO",
                        api_key=seller.api_key if seller else "DEMO",
                        api_secret=seller.api_secret if seller else "DEMO",
                        items=[{"barcode": variant.barcode, "quantity": variant.stock_quantity, "salePrice": target_price, "listPrice": target_price + 40}],
                        is_mock=seller.is_mock_mode if seller else True
                    )

                    # Telegram Bildirimi Gönder
                    if seller and seller.telegram_enabled and seller.telegram_bot_token and seller.telegram_chat_id:
                        await TelegramService.send_buybox_lost_alert(
                            bot_token=seller.telegram_bot_token,
                            chat_id=seller.telegram_chat_id,
                            product_title=product.title,
                            variant_name=variant.variant_name,
                            barcode=variant.barcode,
                            my_price=old_price,
                            competitor_price=comp_price,
                            competitor_name=comp_seller,
                            repriced=True,
                            new_price=target_price,
                            min_price=variant.min_price
                        )

                    return {
                        "status": "REPRICED_SUCCESS",
                        "message": f"Fiyat {old_price:.2f} TL -> {target_price:.2f} TL olarak güncellendi ve Buybox geri alındı.",
                        "new_price": target_price,
                        "has_buybox": True
                    }
            else:
                # Yalnızca bildirim modu
                if seller and seller.telegram_enabled and seller.telegram_bot_token and seller.telegram_chat_id:
                    await TelegramService.send_buybox_lost_alert(
                        bot_token=seller.telegram_bot_token,
                        chat_id=seller.telegram_chat_id,
                        product_title=product.title,
                        variant_name=variant.variant_name,
                        barcode=variant.barcode,
                        my_price=variant.current_price,
                        competitor_price=comp_price,
                        competitor_name=comp_seller,
                        repriced=False,
                        min_price=variant.min_price
                    )
                db.commit()
                return {
                    "status": "BUYBOX_LOST_ALERT_SENT",
                    "message": f"Buybox kaybedildi. Rakip: {comp_seller} ({comp_price:.2f} TL).",
                    "has_buybox": False
                }
        else:
            # Buybox zaten bizde
            tracking.has_buybox = True
            tracking.winner_seller_name = "Bizim Mağaza"
            tracking.last_buybox_price = variant.current_price
            db.commit()
            return {
                "status": "BUYBOX_SAFE",
                "message": "Buybox sizde.",
                "has_buybox": True
            }
