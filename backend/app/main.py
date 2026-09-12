import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .database import engine, Base, SessionLocal
from .models import BuyboxTracking, SellerAccount
from .routers import settings, products, pricing, buybox, orders
from .services.buybox_scanner import BuyboxScanner

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Trendyol Akıllı Fiyatlandırma & Perde Yönetim Sistemi API (V2)",
    description="Trendyol satıcıları için otomatik repricing, varyant formülleri, V2 ürün yükleme ve atölye kesim listesi.",
    version="2.0.0"
)

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Statik Dosya Sunucusu (Yüklenen Fotoğraflar İçin)
from fastapi.staticfiles import StaticFiles
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Router'ları ekle
app.include_router(settings.router)
app.include_router(products.router)
app.include_router(pricing.router)
app.include_router(buybox.router)
app.include_router(orders.router)

scheduler = AsyncIOScheduler()

async def periodic_buybox_job():
    db = SessionLocal()
    try:
        trackings = db.query(BuyboxTracking).filter(BuyboxTracking.is_active == True).all()
        for t in trackings:
            await BuyboxScanner.process_buybox_check(db, t)
    except Exception as e:
        print(f"Periyodik Buybox tarama hatası: {str(e)}")
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        from .routers.products import sync_products_from_source
        await sync_products_from_source(db)
    except Exception as e:
        print(f"Başlangıç sync hatası: {e}")
    finally:
        db.close()

    scheduler.add_job(periodic_buybox_job, "interval", minutes=10)
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

@app.get("/")
def read_root():
    return {
        "message": "Trendyol Akıllı Perde & Fiyatlandırma Sistemi Aktif (V2)",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
