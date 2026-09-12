import httpx
from typing import List, Dict, Any
import datetime

DEMO_PRODUCTS = [
    {
        "model_code": "PERDE-TAC-JAKAR-01",
        "title": "Taç Ekstraforlu Jakar Dokuma Fon Perde (Adet)",
        "brand": "Taç",
        "category_name": "Fon Perde",
        "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
        "variants": [
            {"barcode": "TAC-JAKAR-100-260", "name": "100 x 260 cm", "w": 100, "h": 260, "price": 289.90, "cost": 110.0, "stock": 45, "min_price": 219.90, "max_price": 380.0},
            {"barcode": "TAC-JAKAR-120-260", "name": "120 x 260 cm", "w": 120, "h": 260, "price": 319.90, "cost": 125.0, "stock": 60, "min_price": 239.90, "max_price": 420.0},
            {"barcode": "TAC-JAKAR-140-260", "name": "140 x 260 cm", "w": 140, "h": 260, "price": 349.90, "cost": 140.0, "stock": 80, "min_price": 259.90, "max_price": 460.0},
            {"barcode": "TAC-JAKAR-160-260", "name": "160 x 260 cm", "w": 160, "h": 260, "price": 379.90, "cost": 155.0, "stock": 35, "min_price": 279.90, "max_price": 490.0},
            {"barcode": "TAC-JAKAR-180-260", "name": "180 x 260 cm", "w": 180, "h": 260, "price": 419.90, "cost": 170.0, "stock": 25, "min_price": 309.90, "max_price": 540.0},
            {"barcode": "TAC-JAKAR-200-260", "name": "200 x 260 cm", "w": 200, "h": 260, "price": 459.90, "cost": 185.0, "stock": 30, "min_price": 339.90, "max_price": 590.0},
            {"barcode": "TAC-JAKAR-220-260", "name": "220 x 260 cm", "w": 220, "h": 260, "price": 499.90, "cost": 200.0, "stock": 20, "min_price": 369.90, "max_price": 640.0},
            {"barcode": "TAC-JAKAR-250-260", "name": "250 x 260 cm", "w": 250, "h": 260, "price": 549.90, "cost": 220.0, "stock": 15, "min_price": 409.90, "max_price": 690.0},
        ]
    },
    {
        "model_code": "PERDE-BRILLANT-TUL-02",
        "title": "Brillant Dökümlü Keten Düz Tül Perde (Grek Zemin)",
        "brand": "Brillant",
        "category_name": "Tül Perde",
        "image_url": "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=600&auto=format&fit=crop&q=80",
        "variants": [
            {"barcode": "BRIL-TUL-150-250", "name": "150 x 250 cm", "w": 150, "h": 250, "price": 249.90, "cost": 95.0, "stock": 70, "min_price": 189.90, "max_price": 340.0},
            {"barcode": "BRIL-TUL-200-250", "name": "200 x 250 cm", "w": 200, "h": 250, "price": 299.90, "cost": 115.0, "stock": 90, "min_price": 229.90, "max_price": 390.0},
            {"barcode": "BRIL-TUL-250-250", "name": "250 x 250 cm", "w": 250, "h": 250, "price": 349.90, "cost": 135.0, "stock": 65, "min_price": 269.90, "max_price": 450.0},
            {"barcode": "BRIL-TUL-300-250", "name": "300 x 250 cm", "w": 300, "h": 250, "price": 399.90, "cost": 155.0, "stock": 50, "min_price": 309.90, "max_price": 520.0},
            {"barcode": "BRIL-TUL-350-250", "name": "350 x 250 cm", "w": 350, "h": 250, "price": 459.90, "cost": 175.0, "stock": 40, "min_price": 349.90, "max_price": 590.0},
            {"barcode": "BRIL-TUL-400-250", "name": "400 x 250 cm", "w": 400, "h": 250, "price": 519.90, "cost": 195.0, "stock": 30, "min_price": 399.90, "max_price": 660.0},
        ]
    }
]

class TrendyolClient:
    BASE_URL = "https://api.trendyol.com/sapigw/suppliers"

    @staticmethod
    async def fetch_products(supplier_id: str, api_key: str, api_secret: str, is_mock: bool = True) -> List[Dict[str, Any]]:
        if is_mock:
            return DEMO_PRODUCTS
        
        url = f"{TrendyolClient.BASE_URL}/{supplier_id}/products"
        auth = (api_key, api_secret)
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, auth=auth, headers={"User-Agent": f"{supplier_id} - SelfIntegration"}, timeout=15.0)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("content", [])
            else:
                raise Exception(f"Trendyol API Hatası [{resp.status_code}]: {resp.text}")

    @staticmethod
    async def update_price_and_inventory(supplier_id: str, api_key: str, api_secret: str, items: List[Dict[str, Any]], is_mock: bool = True) -> Dict[str, Any]:
        """
        items format:
        [
            {
                "barcode": "TAC-JAKAR-140-260",
                "quantity": 80,
                "salePrice": 349.90,
                "listPrice": 399.90
            }
        ]
        """
        if is_mock:
            return {
                "batchRequestId": f"MOCK_BATCH_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
                "status": "COMPLETED",
                "itemCount": len(items),
                "message": f"Simülasyon Modu: {len(items)} adet ürün varyantının fiyatı başarıyla güncellendi."
            }

        url = f"{TrendyolClient.BASE_URL}/{supplier_id}/products/price-and-inventory"
        payload = {"items": items}
        auth = (api_key, api_secret)
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, auth=auth, headers={"User-Agent": f"{supplier_id} - SelfIntegration"}, timeout=15.0)
            if resp.status_code in (200, 201, 202):
                return resp.json()
            else:
                raise Exception(f"Trendyol Fiyat Güncelleme Hatası [{resp.status_code}]: {resp.text}")
