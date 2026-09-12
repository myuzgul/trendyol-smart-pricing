import React, { useState } from 'react';
import { 
  Radar, 
  Trophy, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  Play, 
  Send, 
  CheckCircle2, 
  Settings2,
  Lock,
  ArrowDownRight
} from 'lucide-react';
import { BuyboxItem } from '../types';
import { api } from '../api';

interface BuyboxRadarProps {
  buyboxItems: BuyboxItem[];
  onRefresh: () => void;
}

export const BuyboxRadar: React.FC<BuyboxRadarProps> = ({ buyboxItems, onRefresh }) => {
  // Simulator State
  const [selectedVariantId, setSelectedVariantId] = useState<number>(buyboxItems[0]?.variant_id || 1);
  const [simulatedPrice, setSimulatedPrice] = useState<number>(270.0);
  const [simulatedCompetitor, setSimulatedCompetitor] = useState<string>('EvTekstil_Pazari');
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleSimulate = async () => {
    setSimulationRunning(true);
    setSimulationResult(null);
    try {
      const res = await api.simulateCompetitorAttack(
        selectedVariantId,
        simulatedPrice,
        simulatedCompetitor
      );
      setSimulationResult(res);
      onRefresh();
    } catch (err: any) {
      alert('Simülasyon hatası: ' + err.message);
    } finally {
      setSimulationRunning(false);
    }
  };

  const handleStrategyChange = async (item: BuyboxItem, newStrategy: string) => {
    try {
      await api.updateBuyboxStrategy(item.id, {
        is_active: item.is_active,
        strategy: newStrategy,
        price_diff: item.price_diff
      });
      onRefresh();
    } catch (err: any) {
      alert('Strateji güncellenemedi: ' + err.message);
    }
  };

  const handleToggleActive = async (item: BuyboxItem) => {
    try {
      await api.updateBuyboxStrategy(item.id, {
        is_active: !item.is_active,
        strategy: item.strategy,
        price_diff: item.price_diff
      });
      onRefresh();
    } catch (err: any) {
      alert('Durum güncellenemedi: ' + err.message);
    }
  };

  const selectedItem = buyboxItems.find(b => b.variant_id === selectedVariantId) || buyboxItems[0];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
            <Radar className="w-4 h-4 animate-spin text-sky-400" />
            <span>7/24 Canlı Piyasa Radarı</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Buybox Takibi & Otomatik Repricer</h2>
          <p className="text-xs text-slate-400 mt-1">
            Rakiplerinizin fiyat hamlelerini takip edin, taban kârınızı ihlal etmeden Buybox'ı otomatik kazanın.
          </p>
        </div>
      </div>

      {/* Simulator Sandbox Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border border-sky-500/20 p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-4">
          <Play className="w-4 h-4" />
          <span>Canlı Rakip Fiyat Kırma & Repricer Simülatörü</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Controls */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Hedef Varyant:</label>
              <select
                value={selectedVariantId}
                onChange={(e) => {
                  const vId = Number(e.target.value);
                  setSelectedVariantId(vId);
                  const item = buyboxItems.find(b => b.variant_id === vId);
                  if (item) setSimulatedPrice(Math.round(item.current_price * 0.9));
                }}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
              >
                {buyboxItems.map((b) => (
                  <option key={b.variant_id} value={b.variant_id}>
                    {b.variant_name} ({b.current_price.toFixed(2)} TL)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Rakip Mağaza Adı:</label>
              <input
                type="text"
                value={simulatedCompetitor}
                onChange={(e) => setSimulatedCompetitor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Rakibin Kırdığı Fiyat (TL):</label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={simulatedPrice}
                  onChange={(e) => setSimulatedPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-orange-400 font-bold text-xs rounded-xl p-2.5"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">TL</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div>
            <button
              onClick={handleSimulate}
              disabled={simulationRunning}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{simulationRunning ? 'Simüle Ediliyor...' : 'Rakip Saldırısını Simüle Et'}</span>
            </button>
            {selectedItem && (
              <p className="mt-2 text-[11px] text-center text-slate-400">
                Taban Fiyat Koruması: <strong className="text-purple-400">{selectedItem.min_price.toFixed(2)} TL</strong>
              </p>
            )}
          </div>
        </div>

        {/* Simulation Output Card */}
        {simulationResult && (
          <div className="mt-5 p-4 rounded-xl border transition-all animate-fadeIn">
            {simulationResult.status === 'REPRICED_SUCCESS' && (
              <div className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 p-3 rounded-lg flex items-center gap-3 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="font-semibold">Buybox Başarıyla Geri Alındı!</strong>
                  <p className="mt-0.5 text-slate-300">{simulationResult.message}</p>
                </div>
              </div>
            )}
            {simulationResult.status === 'SAFETY_STOP' && (
              <div className="bg-rose-500/10 border-rose-500/30 text-rose-300 p-3 rounded-lg flex items-center gap-3 text-xs">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="font-semibold">🛑 Güvenlik Kilidi Devreye Girdi (Zarar Önleme)!</strong>
                  <p className="mt-0.5 text-slate-300">{simulationResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buybox Trackings Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Takip Edilen Ürün & Varyantlar ({buyboxItems.length})
          </span>
          <span className="text-xs text-slate-400">Arka Plan Kontrol Sıklığı: 10 Dakika</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Durum</th>
                <th className="py-3.5 px-4">Ürün & Varyant</th>
                <th className="py-3.5 px-4">Bizim Fiyatımız</th>
                <th className="py-3.5 px-4 text-purple-400">Taban Fiyat (Güvenlik)</th>
                <th className="py-3.5 px-4">Buybox Sahibi & Fiyatı</th>
                <th className="py-3.5 px-4">Repricer Stratejisi</th>
                <th className="py-3.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {buyboxItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    {item.has_buybox ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>Buybox Bizde</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Kaybedildi</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{item.variant_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{item.barcode}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-orange-400 text-sm">
                    {item.current_price.toFixed(2)} TL
                  </td>
                  <td className="py-3.5 px-4 font-medium text-purple-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {item.min_price.toFixed(2)} TL
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{item.winner_seller_name || 'Bizim Mağaza'}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.last_buybox_price ? `${item.last_buybox_price.toFixed(2)} TL` : `${item.current_price.toFixed(2)} TL`}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={item.strategy}
                      onChange={(e) => handleStrategyChange(item, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
                    >
                      <option value="beat_by_diff">Rakipten 0.50 TL Ucuz Ol</option>
                      <option value="match">Fiyatı Eşitle</option>
                      <option value="alert_only">Yalnızca Alarm / Bildirim</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                        item.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {item.is_active ? 'Otomasyon Aktif' : 'Duraklatıldı'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
