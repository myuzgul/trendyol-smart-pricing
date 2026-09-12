import React from 'react';
import { RefreshCw, Send, Bell, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onSync: () => void;
  syncing: boolean;
  telegramEnabled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onSync, syncing, telegramEnabled }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Trendyol API Bağlantısı: <strong className="text-emerald-400 font-semibold">Aktif</strong></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Send className={`w-3.5 h-3.5 ${telegramEnabled ? 'text-sky-400' : 'text-slate-500'}`} />
          <span>Telegram Radarı: <strong className={telegramEnabled ? 'text-sky-400' : 'text-slate-500'}>
            {telegramEnabled ? 'Bağlı & Aktif' : 'Pasif'}
          </strong></span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-orange-400' : 'text-slate-300'}`} />
          <span>{syncing ? 'Eşitleniyor...' : "Trendyol'dan Çek / Eşitle"}</span>
        </button>

        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
          <Bell className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
