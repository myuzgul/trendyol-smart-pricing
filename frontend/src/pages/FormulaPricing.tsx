import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign, 
  Send, 
  CheckCircle2, 
  Layers, 
  Search, 
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  Filter,
  Lock,
  Wallet
} from 'lucide-react';
import { Product, BulkAdjustmentRequest, BulkAdjustmentItemPreview } from '../types';
import { api } from '../api';

interface BulkPricingProps {
  products: Product[];
  onPricesUpdated: () => void;
}

export const FormulaPricing: React.FC<BulkPricingProps> = ({ products, onPricesUpdated }) => {
  // Filter & Scope States
  const [scope, setScope] = useState<'all' | 'category' | 'selected'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);

  // Adjustment Parameters
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(10);
  const [roundTo90, setRoundTo90] = useState<boolean>(true);

  // Data & Execution States
  const [previewItems, setPreviewItems] = useState<BulkAdjustmentItemPreview[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Load Categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        if (cats.length > 0 && !selectedCategory) {
          setSelectedCategory(cats[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  // Fetch / Calculate Preview
  const calculatePreview = async () => {
    setLoading(true);
    try {
      const req: BulkAdjustmentRequest = {
        scope,
        category_name: scope === 'category' ? selectedCategory : undefined,
        selected_variant_ids: scope === 'selected' ? selectedVariantIds : undefined,
        adjustment_type: adjustmentType,
        operation,
        value: Number(adjustmentValue),
        round_to_90: roundTo90
      };
      const data = await api.previewBulkAdjustment(req);
      setPreviewItems(data);
    } catch (err: any) {
      console.error('Önizleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-calculate when parameters change
  useEffect(() => {
    calculatePreview();
  }, [scope, selectedCategory, selectedVariantIds, operation, adjustmentType, adjustmentValue, roundTo90, products]);

  // Handle Select All / Deselect
  const allVariantIds = previewItems.map(p => p.variant_id);
  const isAllSelected = allVariantIds.length > 0 && allVariantIds.every(id => selectedVariantIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVariantIds([]);
    } else {
      setSelectedVariantIds(allVariantIds);
    }
  };

  const toggleSelectVariant = (id: number) => {
    if (selectedVariantIds.includes(id)) {
      setSelectedVariantIds(selectedVariantIds.filter(vId => vId !== id));
    } else {
      setSelectedVariantIds([...selectedVariantIds, id]);
    }
  };

  // Handle Quick Presets
  const applyPreset = (op: 'increase' | 'decrease', type: 'percentage' | 'fixed_amount', val: number) => {
    setOperation(op);
    setAdjustmentType(type);
    setAdjustmentValue(val);
  };

  // Inline single price edit
  const handleInlinePriceChange = (variantId: number, val: number) => {
    setPreviewItems(prev => prev.map(item => {
      if (item.variant_id === variantId) {
        const diff = Number((val - item.old_price).toFixed(2));
        const comm = Number((val * item.commission_rate).toFixed(2));
        const netInc = Number((val - comm - 45).toFixed(2));
        const netProf = Number((netInc - (item.old_price * 0.40)).toFixed(2));
        const margin = val > 0 ? Number(((netProf / val) * 100).toFixed(1)) : 0;
        return {
          ...item,
          new_price: val,
          price_diff: diff,
          commission_amount: comm,
          estimated_net_income: netInc,
          estimated_net_profit: netProf,
          profit_margin_pct: margin
        };
      }
      return item;
    }));
  };

  // One-Click Push / Sync to Trendyol
  const handleSyncTrendyol = async () => {
    // If scope is 'selected', only sync selected. Otherwise sync all previewed items.
    const itemsToSync = (scope === 'selected' && selectedVariantIds.length > 0)
      ? previewItems.filter(p => selectedVariantIds.includes(p.variant_id))
      : previewItems;

    if (itemsToSync.length === 0) {
      alert('Güncellenecek ürün varyantı bulunamadı!');
      return;
    }

    setSyncing(true);
    setSuccessBanner(null);
    try {
      const payload = itemsToSync.map(i => ({
        variant_id: i.variant_id,
        new_price: i.new_price
      }));
      const res = await api.syncPricesToTrendyol(payload);
      setSuccessBanner(`Tebrikler! ${res.updated_count} adet varyantın fiyatı Trendyol ile eşitlendi ve canlıda güncellendi.`);
      onPricesUpdated();
    } catch (err: any) {
      alert('Trendyol eşitleme hatası: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Filtered view by search query
  const filteredItems = previewItems.filter(item => 
    item.product_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.variant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Toplu Fiyat & Kârlılık Yönetimi</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Toplu Fiyat Değiştirme ve Trendyol Eşitleme</h2>
          <p className="text-xs text-slate-400 mt-1">
            İstediğiniz ürün veya kategoride tek tıkla % veya TL bazlı zam/indirim yapın, net kârınızı görün ve Trendyol'a anında eşitleyin.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleSyncTrendyol}
          disabled={syncing || previewItems.length === 0}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-xl shadow-orange-500/20 flex items-center gap-2.5 transition disabled:opacity-50"
        >
          <Send className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
          <span>{syncing ? 'Trendyol ile Eşitleniyor...' : 'Trendyol ile Eşitle (Canlıya Al)'}</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs underline hover:text-emerald-100"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Control Console Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-2xl backdrop-blur-md">
        {/* Step 1: Scope Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
            1. Hedef Kapsam (Nerede Fiyat Değişecek?)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              onClick={() => setScope('all')}
              className={`p-3 rounded-xl border text-left font-medium transition ${
                scope === 'all'
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-slate-200">🏪 Tüm Mağaza</div>
              <div className="text-[11px] text-slate-500 mt-1">Yayındaki tüm ürün ve varyantlar</div>
            </button>

            <button
              onClick={() => setScope('category')}
              className={`p-3 rounded-xl border text-left font-medium transition ${
                scope === 'category'
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-slate-200">📁 Kategori Bazlı</div>
              <div className="text-[11px] text-slate-500 mt-1">Sadece seçilen kategorideki ürünler</div>
            </button>

            <button
              onClick={() => setScope('selected')}
              className={`p-3 rounded-xl border text-left font-medium transition ${
                scope === 'selected'
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-slate-200">☑️ Seçili Varyantlar ({selectedVariantIds.length})</div>
              <div className="text-[11px] text-slate-500 mt-1">Tablodan tek tek işaretlenen ebatlar</div>
            </button>
          </div>

          {/* Category Dropdown if Category Scope */}
          {scope === 'category' && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Kategori Seçin:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-orange-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 2: Action & Amount */}
        <div className="pt-4 border-t border-slate-800/80">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
            2. Fiyat Değişikliği (Ne Kadar Artacak / Düşecek?)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Operation Selector */}
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1">
              <button
                onClick={() => setOperation('increase')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  operation === 'increase'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+ Zam / Artış</span>
              </button>
              <button
                onClick={() => setOperation('decrease')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  operation === 'decrease'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>- İndirim</span>
              </button>
            </div>

            {/* Type Selector */}
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1">
              <button
                onClick={() => setAdjustmentType('percentage')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  adjustmentType === 'percentage'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Yüzdesel (%)</span>
              </button>
              <button
                onClick={() => setAdjustmentType('fixed_amount')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  adjustmentType === 'fixed_amount'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Sabit Tutar (TL)</span>
              </button>
            </div>

            {/* Value Input */}
            <div className="relative">
              <input
                type="number"
                step="1"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-orange-400 font-bold text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-orange-500"
                placeholder="Değer girin"
              />
              <span className="absolute right-3 top-3 text-xs text-slate-500 font-bold">
                {adjustmentType === 'percentage' ? '%' : 'TL'}
              </span>
            </div>

            {/* Round to .90 */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={roundTo90}
                onChange={(e) => setRoundTo90(e.target.checked)}
                className="rounded accent-orange-500 w-4 h-4"
              />
              <span>Psikolojik Fiyat (<strong>.90 TL</strong>)</span>
            </label>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-500 font-medium">Hızlı Şablonlar:</span>
            <button
              onClick={() => applyPreset('increase', 'percentage', 5)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
            >
              + %5 Zam
            </button>
            <button
              onClick={() => applyPreset('increase', 'percentage', 10)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
            >
              + %10 Zam
            </button>
            <button
              onClick={() => applyPreset('increase', 'percentage', 15)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
            >
              + %15 Zam
            </button>
            <button
              onClick={() => applyPreset('increase', 'fixed_amount', 30)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
            >
              + 30 TL Ekle
            </button>
            <button
              onClick={() => applyPreset('increase', 'fixed_amount', 50)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
            >
              + 50 TL Ekle
            </button>
            <button
              onClick={() => applyPreset('decrease', 'percentage', 10)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] border border-rose-500/20 transition"
            >
              - %10 İndirim
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl">
        {/* Table Top Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded accent-orange-500 w-4 h-4"
              />
              <span>Tümünü Seç ({filteredItems.length} Varyant)</span>
            </label>
            {selectedVariantIds.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/30">
                {selectedVariantIds.length} varyant işaretlendi
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ölçü, model veya barkod ara..."
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-orange-500 w-60"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">Seç</th>
                <th className="py-3.5 px-4">Ürün & Ölçü / Varyant</th>
                <th className="py-3.5 px-4">Barkod</th>
                <th className="py-3.5 px-4">Mevcut Fiyat</th>
                <th className="py-3.5 px-4 text-orange-400">Yeni Satış Fiyatı (Trendyol)</th>
                <th className="py-3.5 px-4">Fark</th>
                <th className="py-3.5 px-4">Trendyol Komisyonu (%20)</th>
                <th className="py-3.5 px-4 text-emerald-400">Ele Geçecek Net Tutar</th>
                <th className="py-3.5 px-4 text-emerald-400">Tahmini Net Kâr & Marj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Filtrelere uygun varyant bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selectedVariantIds.includes(item.variant_id);
                  return (
                    <tr 
                      key={item.variant_id} 
                      className={`hover:bg-slate-800/40 transition ${isChecked ? 'bg-orange-500/5' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectVariant(item.variant_id)}
                          className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          {item.variant_name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.product_title}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{item.barcode}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {item.old_price.toFixed(2)} TL
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.10"
                            value={item.new_price}
                            onChange={(e) => handleInlinePriceChange(item.variant_id, Number(e.target.value))}
                            className="w-24 bg-slate-950 border border-orange-500/40 text-orange-400 font-bold text-xs rounded-lg p-1.5 focus:outline-none focus:border-orange-400"
                          />
                          <span className="text-slate-500 text-[11px]">TL</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.price_diff > 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : item.price_diff < 0 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.price_diff > 0 ? `+${item.price_diff.toFixed(2)} TL` : `${item.price_diff.toFixed(2)} TL`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        -{item.commission_amount.toFixed(2)} TL
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">
                        {item.estimated_net_income.toFixed(2)} TL
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-400">+{item.estimated_net_profit.toFixed(2)} TL</div>
                        <div className="text-[10px] text-emerald-500">%{item.profit_margin_pct} marj</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
