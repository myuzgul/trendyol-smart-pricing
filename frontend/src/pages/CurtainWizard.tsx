import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Layers, 
  Plus, 
  Trash2, 
  Scissors, 
  ScrollText, 
  Theater, 
  SunMedium, 
  Sliders, 
  Percent, 
  Truck, 
  DollarSign, 
  HelpCircle,
  PackagePlus,
  ArrowRight
} from 'lucide-react';
import { CurtainCalculateBatchRequest, CurtainCalculateItemResult, CurtainSizeInput } from '../types';
import { api } from '../api';

interface CurtainWizardProps {
  onProductCreated: () => void;
}

// Hazır Standart Ölçü Şablonları
const STANDARD_TUL_FON_SIZES: CurtainSizeInput[] = [
  { width: 100, height: 260 },
  { width: 120, height: 260 },
  { width: 140, height: 260 },
  { width: 160, height: 260 },
  { width: 180, height: 260 },
  { width: 200, height: 260 },
  { width: 220, height: 260 },
  { width: 250, height: 260 },
  { width: 280, height: 260 },
  { width: 300, height: 260 },
  { width: 350, height: 260 },
  { width: 400, height: 260 }
];

const STANDARD_STOR_ZEBRA_SIZES: CurtainSizeInput[] = [
  { width: 80, height: 200 },
  { width: 100, height: 200 },
  { width: 120, height: 200 },
  { width: 140, height: 200 },
  { width: 150, height: 200 },
  { width: 160, height: 220 },
  { width: 180, height: 220 },
  { width: 200, height: 220 },
  { width: 125, height: 215 },
  { width: 165, height: 215 }
];

export const CurtainWizard: React.FC<CurtainWizardProps> = ({ onProductCreated }) => {
  // Category Type
  const [categoryType, setCategoryType] = useState<'tul' | 'stor_zebra' | 'fon' | 'karartma_saten'>('tul');

  // Product Basic Info
  const [productTitle, setProductTitle] = useState<string>('Taç Ekstraforlu Premium Jakar Fon Perde');
  const [brand, setBrand] = useState<string>('Taç');
  const [modelCode, setModelCode] = useState<string>('PERDE-TAC-01');
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80');

  // Calculation Parameters
  const [unitPrice, setUnitPrice] = useState<number>(120.0); // Metre veya M2 fiyatı
  const [pleatType, setPleatType] = useState<'pilesiz' | '1x2' | '1x2.5' | '1x3'>('1x2.5');
  const [panelType, setPanelType] = useState<'tek_kanat' | 'cift_kanat'>('tek_kanat');
  const [hasSkirt, setHasSkirt] = useState<boolean>(false);
  const [skirtM2Extra, setSkirtM2Extra] = useState<number>(50.0);
  const [hasBead, setHasBead] = useState<boolean>(false);
  const [beadM2Extra, setBeadM2Extra] = useState<number>(50.0);

  // Financial Bounds
  const [cargoCost, setCargoCost] = useState<number>(45.0);
  const [commissionRate, setCommissionRate] = useState<number>(0.20);
  const [targetProfitMargin, setTargetProfitMargin] = useState<number>(0.25);
  const [roundTo90, setRoundTo90] = useState<boolean>(true);

  // Sizes List
  const [sizes, setSizes] = useState<CurtainSizeInput[]>(STANDARD_TUL_FON_SIZES);
  const [customWidth, setCustomWidth] = useState<number>(150);
  const [customHeight, setCustomHeight] = useState<number>(260);

  // Calculation Results & Sync State
  const [calculatedItems, setCalculatedItems] = useState<CurtainCalculateItemResult[]>([]);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Auto-switch size template when category changes
  useEffect(() => {
    if (categoryType === 'stor_zebra') {
      setSizes(STANDARD_STOR_ZEBRA_SIZES);
      setProductTitle('Brillant Karartmalı Zebra Stor Perde');
      setModelCode('STOR-BRIL-01');
    } else if (categoryType === 'fon') {
      setSizes(STANDARD_TUL_FON_SIZES);
      setProductTitle('Taç Dokuma Lüks Fon Perde');
      setModelCode('FON-TAC-01');
    } else if (categoryType === 'karartma_saten') {
      setSizes(STANDARD_TUL_FON_SIZES);
      setProductTitle('Blackout Karartma & Saten Güneşlik Perde');
      setModelCode('BLACKOUT-01');
    } else {
      setSizes(STANDARD_TUL_FON_SIZES);
      setProductTitle('Brillant Keten Dökümlü Grek Tül Perde');
      setModelCode('TUL-BRIL-01');
    }
  }, [categoryType]);

  // Run Calculation
  const runCalculation = async () => {
    if (sizes.length === 0) return;
    setCalculating(true);
    try {
      const payload: CurtainCalculateBatchRequest = {
        category_type: categoryType,
        unit_price: Number(unitPrice),
        pleat_type: pleatType,
        panel_type: panelType,
        has_skirt: hasSkirt,
        skirt_m2_extra: Number(skirtM2Extra),
        has_bead: hasSkirt ? hasBead : false,
        bead_m2_extra: Number(beadM2Extra),
        cargo_cost: Number(cargoCost),
        commission_rate: Number(commissionRate),
        target_profit_margin: Number(targetProfitMargin),
        round_to_90: roundTo90,
        sizes: sizes
      };
      const results = await api.calculateCurtainSizes(payload);
      setCalculatedItems(results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    runCalculation();
  }, [
    categoryType,
    unitPrice,
    pleatType,
    panelType,
    hasSkirt,
    skirtM2Extra,
    hasBead,
    beadM2Extra,
    cargoCost,
    commissionRate,
    targetProfitMargin,
    roundTo90,
    sizes
  ]);

  // Size management
  const addCustomSize = () => {
    if (customWidth > 0 && customHeight > 0) {
      setSizes([...sizes, { width: customWidth, height: customHeight }]);
    }
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  // Push / Create to Trendyol
  const handleCreateOnTrendyol = async () => {
    if (calculatedItems.length === 0) return;
    setCreating(true);
    setSuccessBanner(null);
    try {
      const variants = calculatedItems.map(item => ({
        width_cm: item.width_cm,
        height_cm: item.height_cm,
        size_label: item.size_label,
        barcode: `${modelCode.trim().toUpperCase()}-${int_val(item.width_cm)}-${int_val(item.height_cm)}`,
        sale_price: item.sale_price,
        min_price: item.min_price,
        direct_cost: item.direct_cost,
        stock_quantity: 50
      }));

      const payload = {
        title: productTitle,
        brand: brand,
        category_name: getCategoryLabel(categoryType),
        model_code: modelCode,
        image_url: imageUrl,
        variants: variants
      };

      const res = await api.createProductWithVariants(payload);
      setSuccessBanner(res.message);
      onProductCreated();
    } catch (err: any) {
      alert('Trendyol ürün yükleme hatası: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const int_val = (n: number) => Math.round(n);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'tul': return 'Tül Perde';
      case 'stor_zebra': return 'Stor & Zebra Perde';
      case 'fon': return 'Fon Perde';
      case 'karartma_saten': return 'Karartma & Saten Güneşlik';
      default: return 'Perde';
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
            <PackagePlus className="w-4 h-4" />
            <span>Sektörel Perde Sihirbazı</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Akıllı Perde Ürün & Varyant Yükleme</h2>
          <p className="text-xs text-slate-400 mt-1">
            Tül, Stor, Zebra ve Fon perdeler için sektörel kurallarla tek tıkla 40+ ölçü oluşturun ve Trendyol'a yükleyin.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleCreateOnTrendyol}
          disabled={creating || calculatedItems.length === 0}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-xl shadow-orange-500/25 flex items-center gap-2.5 transition disabled:opacity-50"
        >
          <Send className={`w-4 h-4 ${creating ? 'animate-bounce' : ''}`} />
          <span>{creating ? 'Trendyol\'a Yükleniyor...' : `Tüm Varyantlarla (${calculatedItems.length}) Trendyol'a Yükle`}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
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

      {/* Step 1: Category Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setCategoryType('tul')}
          className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
            categoryType === 'tul'
              ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${categoryType === 'tul' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">🪟 Tül Perde</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Pileli (1x2, 1x2.5, 1x3) veya Pilesiz metre hesabı</p>
          </div>
        </button>

        <button
          onClick={() => setCategoryType('stor_zebra')}
          className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
            categoryType === 'stor_zebra'
              ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${categoryType === 'stor_zebra' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">📜 Stor & Zebra</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">M² hesabı, min 2 m² kuralı, etek ve boncuk opsiyonu</p>
          </div>
        </button>

        <button
          onClick={() => setCategoryType('fon')}
          className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
            categoryType === 'fon'
              ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${categoryType === 'fon' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <Theater className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">🎭 Fon Perde</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Tek Kanat / Çift Kanat ve pile seçenekleri</p>
          </div>
        </button>

        <button
          onClick={() => setCategoryType('karartma_saten')}
          className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
            categoryType === 'karartma_saten'
              ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${categoryType === 'karartma_saten' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <SunMedium className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">🌑 Karartma / Saten</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Blackout ve Saten Güneşlik dikiş payı hesabı</p>
          </div>
        </button>
      </div>

      {/* Step 2: Dynamic Parameters & Formula Rules Console */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-2xl">
        {/* Product Basic Meta */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-400 font-medium mb-1.5">Trendyol Ürün Başlığı:</label>
            <input
              type="text"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Marka:</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Model Kodu (Barkod Ön Eki):</label>
            <input
              type="text"
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-orange-400 font-bold uppercase focus:border-orange-500"
            />
          </div>
        </div>

        {/* Dynamic Category Specific Calculation Options */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs items-center">
          {/* Unit Price (Metre veya M2) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <label className="text-slate-400 font-medium block">
              {categoryType === 'stor_zebra' ? 'Kumaş M² Fiyatı:' : 'Kumaş Metre Fiyatı:'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="5"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-orange-400 font-bold text-sm rounded-lg p-2 focus:border-orange-500"
              />
              <span className="absolute right-3 top-2 text-slate-500 font-bold">
                {categoryType === 'stor_zebra' ? 'TL/m²' : 'TL/m'}
              </span>
            </div>
          </div>

          {/* TÜL & FON Pile Seçenekleri */}
          {(categoryType === 'tul' || categoryType === 'fon') && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-medium block">Pile Seçeneği:</label>
              <select
                value={pleatType}
                onChange={(e) => setPleatType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-medium focus:border-orange-500"
              >
                <option value="pilesiz">Düz Pilesiz (+20 cm)</option>
                <option value="1x2">1x2 Seyrek Pile (En x 2 + 20 cm)</option>
                <option value="1x2.5">1x2,5 Normal Pile (En x 2.5 + 20 cm)</option>
                <option value="1x3">1x3 Sık Pile (En x 3 + 20 cm)</option>
              </select>
            </div>
          )}

          {/* FON PERDE Kanat Seçeneği */}
          {categoryType === 'fon' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-medium block">Kanat Türü:</label>
              <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1">
                <button
                  onClick={() => setPanelType('tek_kanat')}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition ${
                    panelType === 'tek_kanat' ? 'bg-orange-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Tek Kanat
                </button>
                <button
                  onClick={() => setPanelType('cift_kanat')}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition ${
                    panelType === 'cift_kanat' ? 'bg-orange-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Çift Kanat (x2)
                </button>
              </div>
            </div>
          )}

          {/* STOR & ZEBRA Etek Dilimi & Boncuk */}
          {categoryType === 'stor_zebra' && (
            <>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center justify-between text-slate-300 font-medium cursor-pointer">
                  <span>Etek Dilimli mi?</span>
                  <input
                    type="checkbox"
                    checked={hasSkirt}
                    onChange={(e) => {
                      setHasSkirt(e.target.checked);
                      if (!e.target.checked) setHasBead(false);
                    }}
                    className="rounded accent-orange-500 w-4 h-4"
                  />
                </label>
                {hasSkirt && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>Etek Farkı:</span>
                    <input
                      type="number"
                      value={skirtM2Extra}
                      onChange={(e) => setSkirtM2Extra(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-orange-400 font-bold"
                    />
                    <span>TL/m²</span>
                  </div>
                )}
              </div>

              {/* Boncuk Seçeneği (Sadece Etek Dilimli ise Görünür) */}
              {hasSkirt && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-fadeIn">
                  <label className="flex items-center justify-between text-slate-300 font-medium cursor-pointer">
                    <span>Boncuklu mu?</span>
                    <input
                      type="checkbox"
                      checked={hasBead}
                      onChange={(e) => setHasBead(e.target.checked)}
                      className="rounded accent-orange-500 w-4 h-4"
                    />
                  </label>
                  {hasBead && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span>Boncuk Farkı:</span>
                      <input
                        type="number"
                        value={beadM2Extra}
                        onChange={(e) => setBeadM2Extra(Number(e.target.value))}
                        className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-orange-400 font-bold"
                      />
                      <span>TL/m²</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Kâr & Komisyon Ayarları */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Hedef Kâr Marjı:</span>
              <span className="font-bold text-emerald-400">%{Math.round(targetProfitMargin * 100)}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.05"
              value={targetProfitMargin}
              onChange={(e) => setTargetProfitMargin(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Komisyon: %{Math.round(commissionRate * 100)}</span>
              <span>Kargo: {cargoCost} TL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Size Matrix & Custom Size Adder */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">
              Ölçü Şablonu / Havuzu ({sizes.length} Ebat Tanımlı)
            </h3>
          </div>

          {/* Custom Size Adder */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Özel Ölçü:</span>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(Number(e.target.value))}
              placeholder="En"
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-slate-200"
            />
            <span className="text-slate-500">x</span>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(Number(e.target.value))}
              placeholder="Boy"
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-slate-200"
            />
            <button
              onClick={addCustomSize}
              className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ekle</span>
            </button>
          </div>
        </div>

        {/* Quick Size Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {sizes.map((s, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 hover:border-slate-700 transition"
            >
              <span>{s.width} x {s.height} cm</span>
              <button
                onClick={() => removeSize(idx)}
                className="text-slate-500 hover:text-rose-400 transition"
                title="Ölçüyü kaldır"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Step 4: Calculated Variants Live Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Hesaplanan Canlı Varyant Fiyatları ({calculatedItems.length} Varyant)</span>
          </div>
          <span className="text-[11px] text-slate-400">Trendyol Satış Önizlemesi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ölçü / Varyant</th>
                <th className="py-3.5 px-4">
                  {categoryType === 'stor_zebra' ? 'Hesaplanan M²' : 'Gerekli Kumaş (Metre)'}
                </th>
                <th className="py-3.5 px-4">Üretim Maliyeti</th>
                <th className="py-3.5 px-4 text-orange-400">Trendyol Satış Fiyatı</th>
                <th className="py-3.5 px-4 text-purple-400">Taban Fiyat (Güvenlik)</th>
                <th className="py-3.5 px-4">Komisyon (%20)</th>
                <th className="py-3.5 px-4 text-emerald-400">Ele Geçecek Net</th>
                <th className="py-3.5 px-4 text-emerald-400">Net Kâr / Marj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {calculatedItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    {item.size_label}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-sky-400 font-semibold">
                    {item.calculated_quantity_or_m2} {categoryType === 'stor_zebra' ? 'm²' : 'metre'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{item.direct_cost.toFixed(2)} TL</td>
                  <td className="py-3.5 px-4 font-bold text-orange-400 text-sm">{item.sale_price.toFixed(2)} TL</td>
                  <td className="py-3.5 px-4 text-purple-400 font-medium">{item.min_price.toFixed(2)} TL</td>
                  <td className="py-3.5 px-4 text-slate-400">-{item.commission_amount.toFixed(2)} TL</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-400">{item.net_income.toFixed(2)} TL</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-emerald-400">+{item.net_profit.toFixed(2)} TL</div>
                    <div className="text-[10px] text-emerald-500">%{item.profit_margin_pct} marj</div>
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
