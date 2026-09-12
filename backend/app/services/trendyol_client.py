import httpx
from typing import List, Dict, Any, Optional
import datetime
import uuid

# Popüler Perde Markaları & Kategorileri (Trendyol V2 Standartları)
TRENDYOL_PERDE_BRANDS = [
    {"id": 361, "name": "Taç"},
    {"id": 482, "name": "Brillant"},
    {"id": 1052, "name": "Linens"},
    {"id": 1420, "name": "Özdilek"},
    {"id": 2540, "name": "English Home"},
    {"id": 3100, "name": "Madame Coco"},
    {"id": 9999, "name": "Özel Üretim / Kendi Markam"}
]

TRENDYOL_PERDE_CATEGORIES = [
    {"id": 2045, "name": "Tül Perde", "parentId": 1020},
    {"id": 2046, "name": "Fon Perde", "parentId": 1020},
    {"id": 2047, "name": "Stor & Zebra Perde", "parentId": 1020},
    {"id": 2048, "name": "Karartma & Blackout Perde", "parentId": 1020},
    {"id": 2049, "name": "Güneşlik & Saten Perde", "parentId": 1020},
    {"id": 2050, "name": "Dikey & Jaluzi Perde", "parentId": 1020}
]

TRENDYOL_CARGO_COMPANIES = [
    {"id": 10, "name": "Trendyol Express"},
    {"id": 1, "name": "Yurtiçi Kargo"},
    {"id": 2, "name": "Aras Kargo"},
    {"id": 3, "name": "MNG Kargo"},
    {"id": 4, "name": "Sürat Kargo"},
    {"id": 5, "name": "PTT Kargo"}
]

# Örnek Canlı Perde Siparişleri (getShipmentPackages Uyumlu)
DEMO_ORDERS = [
    {
        "id": 901,
        "orderNumber": "TY-98421054",
        "packetId": "PKT-1001",
        "customerFirstName": "Ahmet",
        "customerLastName": "Yılmaz",
        "shipmentAddress": "Atatürk Mah. Karanfil Sok. No:14 D:5 Kadıköy / İstanbul",
        "orderDate": (datetime.datetime.utcnow() - datetime.timedelta(hours=4)).isoformat(),
        "agreedDeliveryDate": (datetime.datetime.utcnow() + datetime.timedelta(hours=18)).isoformat(), # 18 saat kaldı
        "status": "Created", # Created, Picking, Invoiced, Shipped
        "cargoProviderName": "Trendyol Express",
        "cargoTrackingNumber": "73409182341",
        "lines": [
            {
                "lineId": 1,
                "barcode": "PERDE-TAC-01-140-260",
                "productName": "Taç Ekstraforlu Jakar Dokuma Fon Perde",
                "productSize": "140 x 260 cm",
                "color": "Antrasit",
                "quantity": 2,
                "price": 572.90,
                "fabricType": "Jakar Fon Perde",
                "calculatedMeters": 5.4 # 2 adet x 2.7m
            }
        ]
    },
    {
        "id": 902,
        "orderNumber": "TY-98421088",
        "packetId": "PKT-1002",
        "customerFirstName": "Zeynep",
        "customerLastName": "Kaya",
        "shipmentAddress": "Çankaya Mah. Barış Cad. No:8 Çankaya / Ankara",
        "orderDate": (datetime.datetime.utcnow() - datetime.timedelta(hours=12)).isoformat(),
        "agreedDeliveryDate": (datetime.datetime.utcnow() + datetime.timedelta(hours=6)).isoformat(), # 6 saat kaldı (Kritik!)
        "status": "Created",
        "cargoProviderName": "Trendyol Express",
        "cargoTrackingNumber": "73409182390",
        "lines": [
            {
                "lineId": 2,
                "barcode": "TUL-BRIL-01-200-260",
                "productName": "Brillant Dökümlü Keten Grek Tül Perde",
                "productSize": "200 x 260 cm",
                "color": "Ekru",
                "quantity": 1,
                "price": 689.90,
                "fabricType": "Grek Keten Tül",
                "calculatedMeters": 5.2 # 1x2.5 pile = (200*2.5+20)/100 = 5.2m
            },
            {
                "lineId": 3,
                "barcode": "TUL-BRIL-01-140-260",
                "productName": "Brillant Dökümlü Keten Grek Tül Perde",
                "productSize": "140 x 260 cm",
                "color": "Ekru",
                "quantity": 2,
                "price": 489.90,
                "fabricType": "Grek Keten Tül",
                "calculatedMeters": 7.4 # 2 x 3.7m = 7.4m
            }
        ]
    },
    {
        "id": 903,
        "orderNumber": "TY-98421110",
        "packetId": "PKT-1003",
        "customerFirstName": "Mehmet",
        "customerLastName": "Demir",
        "shipmentAddress": "Alsancak Mah. 1450 Sok. No:2 Konak / İzmir",
        "orderDate": (datetime.datetime.utcnow() - datetime.timedelta(hours=2)).isoformat(),
        "agreedDeliveryDate": (datetime.datetime.utcnow() + datetime.timedelta(hours=34)).isoformat(),
        "status": "Picking", # Atölyede Kesimde
        "cargoProviderName": "Yurtiçi Kargo",
        "cargoTrackingNumber": "4239871234",
        "lines": [
            {
                "lineId": 4,
                "barcode": "STOR-BRIL-01-160-220",
                "productName": "Brillant Karartmalı Zebra Stor Perde",
                "productSize": "160 x 220 cm",
                "color": "Gri",
                "quantity": 1,
                "price": 749.90,
                "fabricType": "Zebra Kumaş",
                "calculatedM2": 3.52 # 1.6 x 2.2 = 3.52 m²
            }
        ]
    }
]

DEMO_PRODUCTS = [
    {
        "model_code": "PERDE-TAC-JAKAR-01",
        "title": "Taç Ekstraforlu Jakar Dokuma Fon Perde (Adet)",
        "brand": "Taç",
        "brandId": 361,
        "categoryId": 2046,
        "category_name": "Fon Perde",
        "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
        "variants": [
            {"barcode": "TAC-JAKAR-100-260", "name": "100 x 260 cm", "w": 100, "h": 260, "price": 289.90, "cost": 110.0, "stock": 45, "min_price": 219.90, "max_price": 380.0},
            {"barcode": "TAC-JAKAR-120-260", "name": "120 x 260 cm", "w": 120, "h": 260, "price": 319.90, "cost": 125.0, "stock": 60, "min_price": 239.90, "max_price": 420.0},
            {"barcode": "TAC-JAKAR-140-260", "name": "140 x 260 cm", "w": 140, "h": 260, "price": 349.90, "cost": 140.0, "stock": 80, "min_price": 259.90, "max_price": 460.0},
            {"barcode": "TAC-JAKAR-160-260", "name": "160 x 260 cm", "w": 160, "h": 260, "price": 379.90, "cost": 155.0, "stock": 35, "min_price": 279.90, "max_price": 490.0},
            {"barcode": "TAC-JAKAR-180-260", "name": "180 x 260 cm", "w": 180, "h": 260, "price": 419.90, "cost": 170.0, "stock": 25, "min_price": 309.90, "max_price": 540.0},
            {"barcode": "TAC-JAKAR-200-260", "name": "200 x 260 cm", "w": 200, "h": 260, "price": 459.90, "cost": 185.0, "stock": 30, "min_price": 339.90, "max_price": 590.0},
            {"barcode": "TAC-JAKAR-250-260", "name": "250 x 260 cm", "w": 250, "h": 260, "price": 549.90, "cost": 220.0, "stock": 15, "min_price": 409.90, "max_price": 690.0},
        ]
    },
    {
        "model_code": "PERDE-BRIL-TUL-02",
        "title": "Brillant Dökümlü Keten Düz Grek Tül Perde",
        "brand": "Brillant",
        "brandId": 482,
        "categoryId": 2045,
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
    """
    Trendyol Ürün V2 ve Sipariş (getShipmentPackages) API İstemcisi
    Resmi API Gateway: https://apigw.trendyol.com/integration
    """
    API_GATEWAY = "https://apigw.trendyol.com/integration"
    
    # 1. Sipariş Paketlerini Çekme (getShipmentPackages)
    @staticmethod
    async def get_shipment_packages(
        supplier_id: str,
        api_key: str,
        api_secret: str,
        status: Optional[str] = None,
        is_mock: bool = True
    ) -> List[Dict[str, Any]]:
        if is_mock:
            if status:
                return [o for o in DEMO_ORDERS if o["status"].lower() == status.lower()]
            return DEMO_ORDERS

        url = f"https://api.trendyol.com/sapigw/suppliers/{supplier_id}/orders"
        params = {"status": status} if status else {}
        auth = (api_key, api_secret)
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, auth=auth, headers={"User-Agent": f"{supplier_id} - SelfIntegration"}, timeout=15.0)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("content", [])
            return DEMO_ORDERS

    # 2. Marka Listesi (V1-V2)
    @staticmethod
    async def get_brands(name: Optional[str] = None, is_mock: bool = True) -> List[Dict[str, Any]]:
        if is_mock:
            if name:
                return [b for b in TRENDYOL_PERDE_BRANDS if name.lower() in b["name"].lower()]
            return TRENDYOL_PERDE_BRANDS
        
        url = f"{TrendyolClient.API_GATEWAY}/product/brands"
        params = {"name": name} if name else {}
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=10.0)
            if resp.status_code == 200:
                return resp.json().get("brands", [])
            return TRENDYOL_PERDE_BRANDS

    # 3. Kategori Ağacı (V1-V2)
    @staticmethod
    async def get_categories(is_mock: bool = True) -> List[Dict[str, Any]]:
        if is_mock:
            return TRENDYOL_PERDE_CATEGORIES
        
        url = f"{TrendyolClient.API_GATEWAY}/product/product-categories"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=15.0)
            if resp.status_code == 200:
                return resp.json().get("categories", [])
            return TRENDYOL_PERDE_CATEGORIES

    # 4. Kategori Özellik Listesi V2
    @staticmethod
    async def get_category_attributes(category_id: int, is_mock: bool = True) -> List[Dict[str, Any]]:
        if is_mock:
            return [
                {
                    "attribute": {"id": 338, "name": "Ebat / Beden"},
                    "required": True,
                    "allowCustom": True,
                    "attributeValues": [
                        {"id": 1, "name": "100 x 200 cm"},
                        {"id": 2, "name": "140 x 260 cm"},
                        {"id": 3, "name": "200 x 260 cm"}
                    ]
                },
                {
                    "attribute": {"id": 47, "name": "Renk"},
                    "required": True,
                    "allowCustom": True,
                    "attributeValues": [
                        {"id": 10, "name": "Beyaz"},
                        {"id": 11, "name": "Ekru"},
                        {"id": 12, "name": "Krem"},
                        {"id": 13, "name": "Antrasit"},
                        {"id": 14, "name": "Vizon"},
                        {"id": 15, "name": "Gri"}
                    ]
                }
            ]

        url = f"{TrendyolClient.API_GATEWAY}/product/categories/{category_id}/attributes"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10.0)
            if resp.status_code == 200:
                return resp.json().get("categoryAttributes", [])
            return []

    # 5. Ürün Yaratma V2 (POST /v2/products)
    @staticmethod
    async def create_products_v2(
        supplier_id: str,
        api_key: str,
        api_secret: str,
        items: List[Dict[str, Any]],
        is_mock: bool = True
    ) -> Dict[str, Any]:
        batch_id = f"BATCH_V2_{uuid.uuid4().hex[:12].upper()}"

        if is_mock:
            return {
                "batchRequestId": batch_id,
                "status": "COMPLETED",
                "itemCount": len(items),
                "message": f"Trendyol V2: {len(items)} adet ürün varyantı başarıyla işlendi ve onay sürecine gönderildi.",
                "creationDate": datetime.datetime.utcnow().isoformat()
            }

        url = f"{TrendyolClient.API_GATEWAY}/product/sellers/{supplier_id}/v2/products"
        payload = {"items": items}
        auth = (api_key, api_secret)
        headers = {"User-Agent": f"{supplier_id} - SelfIntegration"}

        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, auth=auth, headers=headers, timeout=20.0)
            if resp.status_code in (200, 201, 202):
                return resp.json()
            else:
                raise Exception(f"Trendyol V2 Ürün Yaratma Hatası [{resp.status_code}]: {resp.text}")

    # 6. Toplu İşlem Durumu Kontrolü V2 (getBatchRequestResult)
    @staticmethod
    async def get_batch_request_result(
        supplier_id: str,
        api_key: str,
        api_secret: str,
        batch_request_id: str,
        is_mock: bool = True
    ) -> Dict[str, Any]:
        if is_mock:
            return {
                "batchRequestId": batch_request_id,
                "status": "COMPLETED",
                "itemCount": 25,
                "failedItemCount": 0,
                "items": [
                    {"status": "SUCCESS", "description": "Ürün başarıyla oluşturuldu."}
                ]
            }

        url = f"{TrendyolClient.API_GATEWAY}/product/sellers/{supplier_id}/products/batch-requests/{batch_request_id}"
        auth = (api_key, api_secret)
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, auth=auth, timeout=10.0)
            if resp.status_code == 200:
                return resp.json()
            else:
                raise Exception(f"Batch Sorgu Hatası [{resp.status_code}]: {resp.text}")

    # 7. Ürünleri Çekme (Filtreleme)
    @staticmethod
    async def fetch_products(supplier_id: str, api_key: str, api_secret: str, is_mock: bool = True) -> List[Dict[str, Any]]:
        if is_mock:
            return DEMO_PRODUCTS
        
        url = f"https://api.trendyol.com/sapigw/suppliers/{supplier_id}/products"
        auth = (api_key, api_secret)
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, auth=auth, headers={"User-Agent": f"{supplier_id} - SelfIntegration"}, timeout=15.0)
            if resp.status_code == 200:
                return resp.json().get("content", [])
            return DEMO_PRODUCTS

    # 8. Stok ve Fiyat Güncelleme (updatePriceAndInventory)
    @staticmethod
    async def update_price_and_inventory(
        supplier_id: str,
        api_key: str,
        api_secret: str,
        items: List[Dict[str, Any]],
        is_mock: bool = True
    ) -> Dict[str, Any]:
        if is_mock:
            return {
                "batchRequestId": f"MOCK_BATCH_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
                "status": "COMPLETED",
                "itemCount": len(items),
                "message": f"Simülasyon Modu: {len(items)} adet ürün varyantının fiyatı başarıyla güncellendi."
            }

        url = f"{TrendyolClient.API_GATEWAY}/inventory/sellers/{supplier_id}/products/price-and-inventory"
        payload = {"items": items}
        auth = (api_key, api_secret)
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, auth=auth, headers={"User-Agent": f"{supplier_id} - SelfIntegration"}, timeout=15.0)
            if resp.status_code in (200, 201, 202):
                return resp.json()
            else:
                raise Exception(f"Trendyol Fiyat Güncelleme Hatası [{resp.status_code}]: {resp.text}")
