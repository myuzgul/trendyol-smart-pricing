import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SellerAccount
from ..services.trendyol_client import TrendyolClient, DEMO_ORDERS

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.get("")
async def get_orders(status: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Trendyol getShipmentPackages API üzerinden gelen siparişleri çeker ve SLA kalan süresini hesaplar.
    """
    seller = db.query(SellerAccount).first()
    is_mock = seller.is_mock_mode if seller else True

    raw_orders = await TrendyolClient.get_shipment_packages(
        supplier_id=seller.supplier_id if seller else "DEMO",
        api_key=seller.api_key if seller else "DEMO",
        api_secret=seller.api_secret if seller else "DEMO",
        status=status,
        is_mock=is_mock
    )

    now = datetime.datetime.utcnow()
    processed_orders = []

    for o in raw_orders:
        delivery_str = o.get("agreedDeliveryDate")
        remaining_hours = 24.0
        is_critical_sla = False

        if delivery_str:
            try:
                delivery_dt = datetime.datetime.fromisoformat(delivery_str.replace("Z", ""))
                diff = delivery_dt - now
                remaining_hours = round(diff.total_seconds() / 3600.0, 1)
                if remaining_hours <= 12 and o.get("status") in ("Created", "Picking"):
                    is_critical_sla = True
            except Exception:
                pass

        processed_orders.append({
            **o,
            "remainingHours": remaining_hours,
            "isCriticalSla": is_critical_sla
        })

    return processed_orders

@router.get("/workshop-cutting-slip")
async def get_workshop_cutting_slip(db: Session = Depends(get_db)):
    """
    Atölye İmalat & Kesim Raporu:
    Gelen aktif siparişleri (Created & Picking) kumaş ve ölçü bazında otomatik gruplar ve toplam kesilecek metre/m² ihtiyacını çıkarır.
    """
    seller = db.query(SellerAccount).first()
    is_mock = seller.is_mock_mode if seller else True

    orders = await TrendyolClient.get_shipment_packages(
        supplier_id=seller.supplier_id if seller else "DEMO",
        api_key=seller.api_key if seller else "DEMO",
        api_secret=seller.api_secret if seller else "DEMO",
        is_mock=is_mock
    )

    # Sadece imalata girecek siparişler (Created ve Picking)
    active_orders = [o for o in orders if o.get("status") in ("Created", "Picking")]

    fabric_groups: Dict[str, Dict[str, Any]] = {}
    total_packages_count = len(active_orders)
    total_pieces_count = 0
    total_fabric_meters = 0.0
    total_fabric_m2 = 0.0

    for o in active_orders:
        customer_name = f"{o.get('customerFirstName', '')} {o.get('customerLastName', '')}".strip()
        order_num = o.get("orderNumber")
        packet_id = o.get("packetId")

        for line in o.get("lines", []):
            fabric = line.get("fabricType", "Standart Kumaş")
            size = line.get("productSize", "Özel Ölçü")
            color = line.get("color", "Standart")
            qty = int(line.get("quantity", 1))
            meters = float(line.get("calculatedMeters", 0.0))
            m2 = float(line.get("calculatedM2", 0.0))

            total_pieces_count += qty
            total_fabric_meters += (meters * qty) if meters > 0 else 0
            total_fabric_m2 += (m2 * qty) if m2 > 0 else 0

            group_key = f"{fabric} ({color})"

            if group_key not in fabric_groups:
                fabric_groups[group_key] = {
                    "fabricType": fabric,
                    "color": color,
                    "totalQuantity": 0,
                    "totalMeters": 0.0,
                    "totalM2": 0.0,
                    "cuttingItems": []
                }

            fabric_groups[group_key]["totalQuantity"] += qty
            fabric_groups[group_key]["totalMeters"] = round(fabric_groups[group_key]["totalMeters"] + (meters * qty), 2)
            fabric_groups[group_key]["totalM2"] = round(fabric_groups[group_key]["totalM2"] + (m2 * qty), 2)

            fabric_groups[group_key]["cuttingItems"].append({
                "productName": line.get("productName"),
                "productSize": size,
                "quantity": qty,
                "requiredLength": f"{meters} m" if meters > 0 else f"{m2} m²",
                "customerName": customer_name,
                "orderNumber": order_num,
                "packetId": packet_id,
                "barcode": line.get("barcode")
            })

    return {
        "reportDate": datetime.datetime.utcnow().strftime("%d.%m.%Y %H:%M"),
        "totalPackages": total_packages_count,
        "totalPieces": total_pieces_count,
        "totalMeters": round(total_fabric_meters, 2),
        "totalM2": round(total_fabric_m2, 2),
        "fabricGroups": list(fabric_groups.values())
    }

@router.post("/{packet_id}/update-status")
async def update_order_status(packet_id: str, payload: dict, db: Session = Depends(get_db)):
    """
    Paket durumunu güncelleme (Created -> Picking -> Shipped)
    """
    new_status = payload.get("status", "Picking")
    for o in DEMO_ORDERS:
        if o.get("packetId") == packet_id:
            o["status"] = new_status
            return {"status": "success", "packetId": packet_id, "newStatus": new_status, "message": f"Sipariş durumu '{new_status}' olarak güncellendi."}
    return {"status": "success", "packetId": packet_id, "newStatus": new_status}
