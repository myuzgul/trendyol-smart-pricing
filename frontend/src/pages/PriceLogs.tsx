import React from 'react';
import { History, Zap, Calculator, ArrowRight, Clock } from 'lucide-react';
import { PriceLog } from '../types';

interface PriceLogsProps {
  logs: PriceLog[];
}

export const PriceLogs: React.FC<PriceLogsProps> = ({ logs }) => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
          <History className="w-4 h-4" />
          <span>Denetim & Geçmiş</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Fiyat Değişim Günlüğü</h2>
        <p className="text-xs text-slate-400 mt-1">
          Formül motoru ve otomatik Repricer tarafından yapılan tüm fiyat güncellemelerinin kayıtları.
        </p>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Kayıtlı Fiyat Hareketleri ({logs.length})</span>
          <span className="text-xs text-slate-400">Son 30 İşlem</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Zaman</th>
                <th className="py-3.5 px-4">Tetikleyici Kaynak</th>
                <th className="py-3.5 px-4">Barkod</th>
                <th className="py-3.5 px-4">Fiyat Değişimi</th>
                <th className="py-3.5 px-4">Açıklama / Sebep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Henüz fiyat log kaydı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(log.created_at).toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.trigger_source === 'repricer_auto' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          <Zap className="w-3 h-3" />
                          <span>Otomatik Repricer</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Calculator className="w-3 h-3" />
                          <span>Toplu Formül</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">{log.barcode}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-slate-500 line-through">{log.old_price.toFixed(2)} TL</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-emerald-400">{log.new_price.toFixed(2)} TL</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{log.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
