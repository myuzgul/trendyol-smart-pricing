import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Package, 
  Truck, 
  Layers, 
  FileText, 
  User, 
  MapPin, 
  Calendar, 
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export const OrdersWorkshop: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cutting_slip' | 'order_list'>('cutting_slip');
  const [orders, setOrders] = useState<any[]>([]);
  const [cuttingSlip, setCuttingSlip] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordList, slip] = await Promise.all([
        api.getOrders(),
        api.getWorkshopCuttingSlip()
      ]);
      setOrders(ordList);
      setCuttingSlip(slip);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (packetId: string, newStatus: string) => {
    setUpdatingId(packetId);
    try {
      await api.updateOrderStatus(packetId, newStatus);
      await loadData();
    } catch (err: any) {
      alert('Durum güncellenemedi: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const criticalOrdersCount = orders.filter(o => o.isCriticalSla).length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
      {/* Header (Hidden when printing) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
            <Scissors className="w-4 h-4" />
            <span>Trendyol getShipmentPackages & İmalat Yönetimi</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Siparişler & Atölye Kesim Listesi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Gelen perde siparişlerini otomatik kumaş kesim fişine dönüştürün, taahhüt sürelerini (SLA) takip edip gecikme cezalarını önleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
            title="Siparişleri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>Atölye Fişini Yazdır</span>
          </button>
        </div>
      </div>

      {/* Critical SLA Warning Alert */}
      {criticalOrdersCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between animate-fadeIn print:hidden shadow-lg">
          <div className="flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <strong className="font-bold text-sm">🚨 {criticalOrdersCount} Adet Siparişte Gecikme Cezası Riski!</strong>
              <p className="mt-0.5 text-slate-300">
                Trendyol'a taahhüt edilen kargolama süresine (SLA) 12 saatten az kaldı. Ceza puanı yememek için öncelikli dikime alın.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('order_list')}
            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition"
          >
            Siparişleri İncele
          </button>
        </div>
      )}

      {/* View Switcher Tabs (Print hidden) */}
      <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 w-fit text-xs font-bold print:hidden">
        <button
          onClick={() => setActiveTab('cutting_slip')}
          className={`px-5 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'cutting_slip' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>✂️ Atölye Kesim & Dikim Fişi</span>
        </button>

        <button
          onClick={() => setActiveTab('order_list')}
          className={`px-5 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'order_list' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>📦 Gelen Siparişler & SLA Takibi ({orders.length})</span>
        </button>
      </div>

      {/* VIEW 1: ATÖLYE KESİM VE DİKİM FİŞİ */}
      {activeTab === 'cutting_slip' && cuttingSlip && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 print:bg-white print:border-black print:text-black">
              <span className="text-xs text-slate-400 print:text-slate-600 font-medium">Toplam Sipariş Paketi</span>
              <div className="text-2xl font-bold text-white print:text-black mt-2">{cuttingSlip.totalPackages} Paket</div>
              <span className="text-[11px] text-slate-500">{cuttingSlip.totalPieces} Parça Perde</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 print:bg-white print:border-black print:text-black">
              <span className="text-xs text-slate-400 print:text-slate-600 font-medium">Toplam Tül / Fon Kumaş</span>
              <div className="text-2xl font-bold text-sky-400 print:text-black mt-2">{cuttingSlip.totalMeters} Metre</div>
              <span className="text-[11px] text-slate-500">Kesilecek net kumaş metrajı</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 print:bg-white print:border-black print:text-black">
              <span className="text-xs text-slate-400 print:text-slate-600 font-medium">Toplam Stor / Zebra Kumaş</span>
              <div className="text-2xl font-bold text-amber-400 print:text-black mt-2">{cuttingSlip.totalM2} m²</div>
              <span className="text-[11px] text-slate-500">İmal edilecek toplam alan</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 print:bg-white print:border-black print:text-black">
              <span className="text-xs text-slate-400 print:text-slate-600 font-medium">Rapor Saati</span>
              <div className="text-lg font-bold text-emerald-400 print:text-black mt-2">{cuttingSlip.reportDate}</div>
              <span className="text-[11px] text-slate-500">Trendyol Canlı Senkron</span>
            </div>
          </div>

          {/* Grouped Fabric Cutting Tables */}
          <div className="space-y-6">
            {cuttingSlip.fabricGroups.map((group: any, idx: number) => (
              <div key={idx} className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl print:border-black print:bg-white">
                {/* Group Title Bar */}
                <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between print:bg-slate-100 print:text-black print:border-black">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <h3 className="text-sm font-bold text-white print:text-black">
                      Kumaş Türü: {group.fabricType} — <span className="text-orange-400 print:text-black">{group.color}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-300 print:text-black font-semibold">
                      Toplam: {group.totalQuantity} Adet
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 font-bold print:border-black print:text-black">
                      {group.totalMeters > 0 ? `${group.totalMeters} Metre Kumaş` : `${group.totalM2} m² Alan`}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider print:bg-slate-50 print:text-black print:border-black">
                      <tr>
                        <th className="py-3 px-4">Sipariş No</th>
                        <th className="py-3 px-4">Müşteri</th>
                        <th className="py-3 px-4">Kesilecek Ölçü</th>
                        <th className="py-3 px-4">Adet</th>
                        <th className="py-3 px-4 text-orange-400 print:text-black">Gerekli Kumaş</th>
                        <th className="py-3 px-4">Barkod</th>
                        <th className="py-3 px-4 text-center">Atölye Onay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 print:divide-black print:text-black">
                      {group.cuttingItems.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-orange-400 print:text-black">{item.orderNumber}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-200 print:text-black">{item.customerName}</td>
                          <td className="py-3.5 px-4 font-bold text-white print:text-black text-sm">{item.productSize}</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400 print:text-black">{item.quantity} Adet</td>
                          <td className="py-3.5 px-4 font-semibold text-sky-400 print:text-black">{item.requiredLength}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 print:text-black">{item.barcode}</td>
                          <td className="py-3.5 px-4 text-center">
                            <input type="checkbox" className="w-4 h-4 rounded accent-orange-500 cursor-pointer" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: GELEN SİPARİŞLER VE SLA CEZA TAKİP LİSTESİ */}
      {activeTab === 'order_list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {orders.map((ord: any) => (
              <div
                key={ord.id}
                className={`p-5 rounded-2xl bg-slate-900/60 border transition space-y-4 shadow-xl ${
                  ord.isCriticalSla ? 'border-rose-500/60 bg-rose-950/10' : 'border-slate-800'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-mono">{ord.orderNumber}</span>
                        <span className="text-xs text-slate-500">({ord.packetId})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'Created' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : ord.status === 'Picking'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {ord.status === 'Created' ? 'Yeni Sipariş' : ord.status === 'Picking' ? 'Atölyede Kesimde' : 'Kargolandı'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ord.customerFirstName} {ord.customerLastName}</span>
                        <span className="text-slate-600">•</span>
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate max-w-xs">{ord.shipmentAddress}</span>
                      </p>
                    </div>
                  </div>

                  {/* SLA Countdown Timer Badge */}
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                      ord.isCriticalSla 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse' 
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}>
                      <Clock className={`w-4 h-4 ${ord.isCriticalSla ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span>Kargolamaya Kalan: {ord.remainingHours} Saat</span>
                    </div>

                    {/* Action Buttons */}
                    {ord.status === 'Created' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.packetId, 'Picking')}
                        disabled={updatingId === ord.packetId}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs rounded-xl transition"
                      >
                        Atölyeye Al (Kesim)
                      </button>
                    )}
                    {ord.status === 'Picking' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.packetId, 'Shipped')}
                        disabled={updatingId === ord.packetId}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Kargola</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Lines in this package */}
                <div className="space-y-2">
                  {ord.lines.map((l: any) => (
                    <div key={l.lineId} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-100">{l.productName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-slate-500">{l.barcode}</span>
                          <span className="text-slate-600">•</span>
                          <span>Renk: <strong className="text-slate-300">{l.color}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-sm text-orange-400">{l.productSize}</div>
                          <div className="text-[11px] text-emerald-400 font-semibold">{l.quantity} Adet ({(l.price * l.quantity).toFixed(2)} TL)</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
