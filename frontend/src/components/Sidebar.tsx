import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Radar, 
  History, 
  Settings, 
  Sparkles,
  ShoppingBag,
  PackagePlus,
  Scissors
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMockMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isMockMode }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'curtain_wizard', label: 'Perde Ürün Sihirbazı', icon: PackagePlus, badge: 'V2 Ürün Yükle' },
    { id: 'orders_workshop', label: 'Siparişler & Kesim Fişi', icon: Scissors, badge: 'SLA & İmalat' },
    { id: 'formula', label: 'Toplu Fiyat & Eşitleme', icon: TrendingUp, badge: 'Trendyol Canlı' },
    { id: 'buybox', label: 'Buybox Radarı & Repricer', icon: Radar, badge: 'Canlı Takip' },
    { id: 'logs', label: 'Fiyat Geçmişi & Loglar', icon: History },
    { id: 'settings', label: 'API & Telegram Ayarları', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-md border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen print:hidden">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Trendyol <span className="text-orange-500 text-xs px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30">PRO</span>
            </h1>
            <p className="text-xs text-slate-400">Akıllı Perde & İmalat</p>
          </div>
        </div>

        {/* Mode Pill */}
        <div className="px-4 py-3">
          <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between border ${
            isMockMode 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          }`}>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full animate-pulse ${isMockMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              {isMockMode ? 'Demo / Simülasyon' : 'Canlı Trendyol API'}
            </span>
            <Sparkles className="w-3.5 h-3.5 opacity-70" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Uçtan Uca İmalat & Satış</p>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
            Fiyatlama, ürün açma, SLA takibi ve atölye kesim raporları tek ekranda.
          </p>
        </div>
      </div>
    </aside>
  );
};
