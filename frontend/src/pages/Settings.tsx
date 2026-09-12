import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Send, 
  Key, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { SellerSettings } from '../types';
import { api } from '../api';

interface SettingsProps {
  settings: SellerSettings;
  onUpdate: (updated: SellerSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState<SellerSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const updated = await api.updateSettings(formData);
      onUpdate(updated);
      setMsg({ type: 'success', text: 'Ayarlar başarıyla kaydedildi.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Hata: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setMsg(null);
    try {
      // Önce ayarları kaydet
      await api.updateSettings(formData);
      const res = await api.testTelegram();
      setMsg({ type: 'success', text: res.message });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>Sistem & Entegrasyon</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">API & Telegram Yapılandırması</h2>
        <p className="text-xs text-slate-400 mt-1">
          Trendyol Mağaza API anahtarlarınızı ve Buybox alarmlarını alacağınız Telegram botunuzu yapılandırın.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
          msg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Trendyol API Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white">Trendyol Satıcı API Bilgileri</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={formData.is_mock_mode}
                onChange={(e) => setFormData({ ...formData, is_mock_mode: e.target.checked })}
                className="rounded accent-orange-500"
              />
              <span className="font-medium text-amber-400">Demo / Simülasyon Modu</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Satıcı ID (Supplier ID):</label>
              <input
                type="text"
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                placeholder="Örn: 123456"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">API Key:</label>
              <input
                type="text"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                placeholder="Trendyol API Key"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">API Secret:</label>
              <input
                type="password"
                value={formData.api_secret}
                onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                placeholder="••••••••••••"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            * Trendyol Satıcı Panelinizden &gt; Hesap Bilgilerim &gt; Entegrasyon Bilgileri alanından temin edebilirsiniz.
          </p>
        </div>

        {/* Telegram Integration Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">Telegram Buybox Bildirim Botu</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={formData.telegram_enabled}
                onChange={(e) => setFormData({ ...formData, telegram_enabled: e.target.checked })}
                className="rounded accent-sky-500"
              />
              <span className="font-medium text-sky-400">Telegram Alarmlarını Etkinleştir</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Telegram Bot Token:</label>
              <input
                type="text"
                value={formData.telegram_bot_token || ''}
                onChange={(e) => setFormData({ ...formData, telegram_bot_token: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Telegram Chat ID / Kanal ID:</label>
              <input
                type="text"
                value={formData.telegram_chat_id || ''}
                onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                placeholder="987654321"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-[11px] text-slate-500">
              Telegram'da <code>@BotFather</code> üzerinden bot oluşturup token alabilirsiniz.
            </p>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram || !formData.telegram_bot_token}
              className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl font-medium transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingTelegram ? 'Test Ediliyor...' : 'Test Bildirimi Gönder'}</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
