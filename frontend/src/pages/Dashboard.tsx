import React from 'react';
import { 
  Trophy, 
  AlertTriangle, 
  Layers, 
  Calculator, 
  ArrowUpRight, 
  TrendingUp, 
  Zap,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { Product, BuyboxItem, PriceLog } from '../types';

interface DashboardProps {
  products: Product[];
  buyboxItems: BuyboxItem[];
  logs: PriceLog[];
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  buyboxItems,
  logs,
  onNavigate
}) => {
  const totalVariants = products.reduce((acc, p) => acc + p.variants.length, 0);
  const activeTrackings = buyboxItems.filter(b => b.is_active);
  const buyboxWonCount = buyboxItems.filter(b => b.has_buybox).length;
  const buyboxRate = buyboxItems.length > 0 ? Math.round((buyboxWonCount / buyboxItems.length) * 100) : 0;
  const repricerActionsCount = logs.filter(l => l.trigger_source === 'repricer_auto').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 p-7 shadow-xl shadow-orange-500/10 text-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-200" />
            <span>Akıllı Repricer ve Formül Motoru Devrede</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Trendyol Satış & Kârlılık Kontrol Merkezi</h2>
          <p className="mt-2 text-sm text-orange-100 leading-relaxed">
            Perde ve çok varyantlı ürünlerinizin fiyatlarını hammadde ve komisyona göre otomatik hesaplayın, Buybox savaşlarında taban kârınızı koruyarak pazar payınızı artırın.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => onNavigate('formula')}
              className="px-4 py-2 rounded-xl bg-white text-orange-700 font-semibold text-xs shadow-md hover:bg-orange-50 transition flex items-center gap-1.5"
            >
              <Calculator className="w-4 h-4" />
              <span>Varyant Fiyatlarını Hesapla</span>
            </button>
            <button
              onClick={() => onNavigate('buybox')}
              className="px-4 py-2 rounded-xl bg-black/25 text-white font-semibold text-xs hover:bg-black/35 transition flex items-center gap-1.5 border border-white/20"
            >
              <span>Buybox Radarına Git</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Buybox Başarı Oranı</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">%{buyboxRate}</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> {buyboxWonCount}/{buyboxItems.length} Ürün
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Mevcut Buybox'ı elinde tutan ürün oranı</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Toplam Varyant Sayısı</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{totalVariants}</span>
            <span className="text-xs text-slate-400 font-medium">{products.length} Model</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Formülle yönetilen toplam ölçü & ebat</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Otomatik Repricing</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{repricerActionsCount}</span>
            <span className="text-xs text-sky-400 font-medium">Müdahale</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Rakip kırınca geri alınan Buybox sayısı</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Taban Güvenlik Koruması</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">%100</span>
            <span className="text-xs text-purple-400 font-medium">Aktif</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Zararına satışı engelleyen güvenlik kilidi</p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Products Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Yönetilen Ürün Grupları</h3>
            <button
              onClick={() => onNavigate('formula')}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
            >
              <span>Tümünü Gör ve Fiyatlandır</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Layers className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {p.brand}
                      </span>
                      <span className="text-xs text-slate-400">Model: {p.model_code}</span>
                    </div>
                    <h4 className="text-sm font-medium text-slate-100 mt-1">{p.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{p.variants.length} Farklı Ölçü / Varyant</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('formula')}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-medium border border-orange-500/20 transition"
                  >
                    Formül Uygula
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Live Activity Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Son Fiyat Hareketleri</h3>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              Tüm Günlük
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-4 divide-y divide-slate-800/60">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Henüz bir fiyat hareketi kaydedilmedi.</p>
            ) : (
              logs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      log.trigger_source === 'repricer_auto'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {log.trigger_source === 'repricer_auto' ? '⚡ Repricer' : '📐 Toplu Formül'}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Barkod: {log.barcode}</span>
                    <div className="flex items-center gap-1 font-semibold">
                      <span className="text-slate-500 line-through">{log.old_price.toFixed(2)} TL</span>
                      <span className="text-emerald-400">➡️ {log.new_price.toFixed(2)} TL</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{log.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
