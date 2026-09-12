from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SellerAccount
from ..schemas import SellerSettingsResponse, SellerSettingsUpdate
from ..services.telegram_service import TelegramService

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SellerSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    account = db.query(SellerAccount).first()
    if not account:
        account = SellerAccount(
            supplier_id="DEMO_SUPPLIER_123",
            api_key="demo_api_key",
            api_secret="demo_api_secret",
            is_mock_mode=True,
            telegram_enabled=False
        )
        db.add(account)
        db.commit()
        db.refresh(account)
    return account

@router.put("", response_model=SellerSettingsResponse)
def update_settings(payload: SellerSettingsUpdate, db: Session = Depends(get_db)):
    account = db.query(SellerAccount).first()
    if not account:
        account = SellerAccount()
        db.add(account)
    
    account.supplier_id = payload.supplier_id
    account.api_key = payload.api_key
    account.api_secret = payload.api_secret
    account.is_mock_mode = payload.is_mock_mode
    account.telegram_bot_token = payload.telegram_bot_token
    account.telegram_chat_id = payload.telegram_chat_id
    account.telegram_enabled = payload.telegram_enabled

    db.commit()
    db.refresh(account)
    return account

@router.post("/test-telegram")
async def test_telegram(db: Session = Depends(get_db)):
    account = db.query(SellerAccount).first()
    if not account or not account.telegram_bot_token or not account.telegram_chat_id:
        raise HTTPException(status_code=400, detail="Telegram Bot Token veya Chat ID tanımlanmamış.")
    
    msg = (
        "✅ <b>TRENDYOL AKILLI FİYATLANDIRMA SİSTEMİ</b>\n\n"
        "🎉 Tebrikler! Telegram bildirim botu bağlantınız başarıyla sağlandı.\n"
        "⚡ Artık Buybox değişimleri, rakip fiyat hareketleri ve otomatik kârlılık alarmları anında bu kanala iletilecektir."
    )
    success = await TelegramService.send_message(
        account.telegram_bot_token,
        account.telegram_chat_id,
        msg
    )
    if success:
        return {"status": "success", "message": "Test mesajı Telegram'a başarıyla gönderildi."}
    else:
        raise HTTPException(status_code=500, detail="Telegram'a mesaj gönderilemedi. Lütfen Token ve Chat ID'yi kontrol edin.")
