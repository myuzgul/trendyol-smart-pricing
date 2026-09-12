import httpx
import logging

logger = logging.getLogger(__name__)

class TelegramService:
    @staticmethod
    async def send_message(bot_token: str, chat_id: str, text: str) -> bool:
        if not bot_token or not chat_id:
            logger.warning("Telegram Bot Token veya Chat ID eksik!")
            return False
        
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=payload, timeout=10.0)
                if resp.status_code == 200:
                    return True
                else:
                    logger.error(f"Telegram API Hatası: {resp.text}")
                    return False
        except Exception as e:
            logger.error(f"Telegram gönderme hatası: {str(e)}")
            return False

    @staticmethod
    async def send_buybox_lost_alert(
        bot_token: str,
        chat_id: str,
        product_title: str,
        variant_name: str,
        barcode: str,
        my_price: float,
        competitor_price: float,
        competitor_name: str,
        repriced: bool = False,
        new_price: float = None,
        safety_stop: bool = False,
        min_price: float = None
    ) -> bool:
        """
        Buybox kaybedildiğinde veya repricer devreye girdiğinde formatlı bildirim yollar.
        """
        if safety_stop:
            msg = (
                f"🚨 <b>TRENDYOL BUYBOX GÜVENLİK ALARMI!</b>\n\n"
                f"📦 <b>Ürün:</b> {product_title}\n"
                f"📏 <b>Varyant:</b> {variant_name} (<code>{barcode}</code>)\n\n"
                f"⚠️ <b>Durum:</b> Rakip <b>{competitor_name}</b> fiyatı <b>{competitor_price:.2f} TL</b> seviyesine kırdı!\n"
                f"🛑 <b>GÜVENLİK KİLİDİ DEVREDE:</b> Sizin minimum taban fiyatınız <b>{min_price:.2f} TL</b> olduğu için zarar etmemeniz adına fiyatınız düşürülmedi.\n\n"
                f"👉 <i>Mevcut Fiyatınız: {my_price:.2f} TL</i>"
            )
        elif repriced and new_price:
            msg = (
                f"⚡ <b>TRENDYOL OTOMATİK REPRICER ÇALIŞTI!</b>\n\n"
                f"📦 <b>Ürün:</b> {product_title}\n"
                f"📏 <b>Varyant:</b> {variant_name} (<code>{barcode}</code>)\n\n"
                f"⚔️ <b>Rakip:</b> {competitor_name} ({competitor_price:.2f} TL)\n"
                f"🎯 <b>Buybox Geri Alındı:</b> Fiyatınız <s>{my_price:.2f} TL</s> ➡️ <b>{new_price:.2f} TL</b> olarak güncellendi!\n"
                f"🛡️ <i>Taban Kâr Limiti Korundu (Min: {min_price:.2f} TL)</i>"
            )
        else:
            msg = (
                f"🔔 <b>TRENDYOL BUYBOX KAYBEDİLDİ!</b>\n\n"
                f"📦 <b>Ürün:</b> {product_title}\n"
                f"📏 <b>Varyant:</b> {variant_name} (<code>{barcode}</code>)\n\n"
                f"🔻 <b>Sizin Fiyatınız:</b> {my_price:.2f} TL\n"
                f"👑 <b>Buybox'ı Alan:</b> {competitor_name} (<b>{competitor_price:.2f} TL</b>)\n"
                f"📊 <i>Fark: {(my_price - competitor_price):.2f} TL</i>\n\n"
                f"💡 <i>Paneline girerek veya otomatik repricer'ı açarak Buybox'ı geri alabilirsiniz.</i>"
            )
        
        return await TelegramService.send_message(bot_token, chat_id, msg)
