import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  ShieldCheck,
  Activity,
  Building2,
  Clock,
  Palette,
  Box,
  Upload,
  Image as ImageIcon,
  FileSpreadsheet,
  Star,
  X
} from 'lucide-react';
import { CurtainCalculateBatchRequest, CurtainCalculateItemResult, CurtainSizeInput } from '../types';
import { api } from '../api';

interface CurtainWizardProps {
  onProductCreated: () => void;
}

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

  // Trendyol V2 Meta States
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number>(361);
  const [selectedBrandName, setSelectedBrandName] = useState<string>('Taç');
  
  const [cargoCompanies, setCargoCompanies] = useState<{ id: number; name: string }[]>([]);
  const [selectedCargoCompanyId, setSelectedCargoCompanyId] = useState<number>(10);
  
  const [deliveryDuration, setDeliveryDuration] = useState<number>(2); // 2 gün
  const [vatRate, setVatRate] = useState<number>(10); // %10 KDV
  const [desi, setDesi] = useState<number>(2.0);
  const [color, setColor] = useState<string>('Ekru');

  // Trendyol Official Attributes
  const [material, setMaterial] = useState<string>('Polyester');
  const [hangingType, setHangingType] = useState<string>('Kornişli');
  const [pattern, setPattern] = useState<string>('Düz');
  const [lightTransmittance, setLightTransmittance] = useState<string>('Şeffaf');
  const [usageArea, setUsageArea] = useState<string>('Salon / Oturma Odası');

  // Product Basic Info
  const [productTitle, setProductTitle] = useState<string>('Taç Ekstraforlu Premium Jakar Fon Perde');
  const [modelCode, setModelCode] = useState<string>('PERDE-TAC-01');
  const [description, setDescription] = useState<string>('<p>Özel ölçü lüks perde. Dökümlü kumaş, yıkamaya dayanıklı ve kırışmaz.</p>');

  // Photos State
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'
  ]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculation Parameters
  const [unitPrice, setUnitPrice] = useState<number>(120.0);
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

  // Results & Batch Progress
  const [calculatedItems, setCalculatedItems] = useState<CurtainCalculateItemResult[]>([]);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [batchStatusResult, setBatchStatusResult] = useState<any>(null);
  const [checkingBatch, setCheckingBatch] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Load Brands and Cargo Companies on Mount
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [bList, cList] = await Promise.all([
          api.getBrands(),
          api.getCargoCompanies()
        ]);
        setBrands(bList);
        setCargoCompanies(cList);
      } catch (err) {
        console.error(err);
      }
    };
    loadMeta();
  }, []);

  // Auto-switch template when category changes
  useEffect(() => {
    if (categoryType === 'stor_zebra') {
      setSizes(STANDARD_STOR_ZEBRA_SIZES);
      setProductTitle('Brillant Karartmalı Zebra Stor Perde');
      setModelCode('STOR-BRIL-01');
      setSelectedBrandId(482);
      setSelectedBrandName('Brillant');
      setLightTransmittance('Blackout');
      setMaterial('Polyester');
    } else if (categoryType === 'fon') {
      setSizes(STANDARD_TUL_FON_SIZES);
      setProductTitle('Taç Dokuma Lüks Jakar Fon Perde');
      setModelCode('FON-TAC-01');
      setSelectedBrandId(361);
      setSelectedBrandName('Taç');
      setLightTransmittance('Oda Karanlığı');
      setMaterial('Keten');
    } else if (categoryType === 'karartma_saten') {
      setSizes(STANDARD_TUL_FON_SIZES);
      setProductTitle('Blackout Karartma & Saten Güneşlik Perde');
      setModelCode('BLACKOUT-01');
      setLightTransmittance('Blackout');
      setMaterial('Polyester');
    } else {
      setSizes(STANDARD_TUL_FON_SIZES);
      setProductTitle('Brillant Keten Dökümlü Grek Tül Perde');
      setModelCode('TUL-BRIL-01');
      setSelectedBrandId(482);
      setSelectedBrandName('Brillant');
      setLightTransmittance('Şeffaf');
      setMaterial('Keten');
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

  const addCustomSize = () => {
    if (customWidth > 0 && customHeight > 0) {
      setSizes([...sizes, { width: customWidth, height: customHeight }]);
    }
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  // Image Upload Handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const uploadPromises = Array.from(files).map(file => api.uploadImage(file));
      const uploadedResults = await Promise.all(uploadPromises);
      const newUrls = uploadedResults.map(r => r.url);
      setImages(prev => [...prev, ...newUrls].slice(0, 8)); // Max 8 images for Trendyol
    } catch (err: any) {
      alert('Fotoğraf yükleme hatası: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setCoverImage = (index: number) => {
    if (index === 0) return;
    const newImgs = [...images];
    const [selected] = newImgs.splice(index, 1);
    newImgs.unshift(selected);
    setImages(newImgs);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Build Payload Helper
  const buildProductPayload = () => {
    const categoryId = categoryType === 'tul' ? 895 : categoryType === 'fon' ? 1848 : categoryType === 'stor_zebra' ? 1849 : 1848;

    const variants = calculatedItems.map(item => ({
      width_cm: item.width_cm,
      height_cm: item.height_cm,
      size_label: `${int_val(item.width_cm)} x ${int_val(item.height_cm)}`,
      barcode: `${modelCode.trim().toUpperCase()}-${int_val(item.width_cm)}-${int_val(item.height_cm)}`,
      sale_price: item.sale_price,
      min_price: item.min_price,
      direct_cost: item.direct_cost,
      stock_quantity: 50
    }));

    return {
      title: productTitle,
      brand_id: selectedBrandId,
      brand_name: selectedBrandName,
      category_id: categoryId,
      category_name: getCategoryLabel(categoryType),
      model_code: modelCode,
      description: description,
      color: color,
      material: material,
      hanging_type: hangingType,
      pattern: pattern,
      light_transmittance: lightTransmittance,
      usage_area: usageArea,
      cargo_company_id: selectedCargoCompanyId,
      delivery_duration: deliveryDuration,
      vat_rate: vatRate,
      dimensional_weight: desi,
      image_url: images[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
      images: images,
      variants: variants
    };
  };

  // Push to Trendyol V2 (createProducts V2)
  const handleCreateOnTrendyolV2 = async () => {
    if (calculatedItems.length === 0) return;
    setCreating(true);
    setSuccessBanner(null);
    setBatchStatusResult(null);
    try {
      const payload = buildProductPayload();
      const res = await api.createProductV2(payload);
      setSuccessBanner(res.message);
      if (res.batch_request_id) {
        setLastBatchId(res.batch_request_id);
      }
      onProductCreated();
    } catch (err: any) {
      alert('Trendyol V2 Ürün Yükleme Hatası: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Export official Trendyol Excel template (.xlsx)
  const handleExportExcel = async () => {
    if (calculatedItems.length === 0) return;
    setExportingExcel(true);
    try {
      const payload = buildProductPayload();
      const blob = await api.exportExcel(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Trendyol_Sablon_${modelCode.trim().toUpperCase()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Excel export hatası: ' + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  const checkBatchStatus = async () => {
    if (!lastBatchId) return;
    setCheckingBatch(true);
    try {
      const res = await api.getBatchStatus(lastBatchId);
      setBatchStatusResult(res);
    } catch (err: any) {
      alert('Batch sorgu hatası: ' + err.message);
    } finally {
      setCheckingBatch(false);
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
            <span>Trendyol Ürün V2 & Resmi Excel Entegrasyonu</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Akıllı Perde Ürün & Varyant Sihirbazı</h2>
          <p className="text-xs text-slate-400 mt-1">
            Trendyol V2 API standartlarına ve resmi Excel şablonuna tam uyumlu; fotoğraf yükleme, dikiş payı ve kâr marjı hesaplamaları.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Excel Export Button */}
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel || calculatedItems.length === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition disabled:opacity-50"
            title="Trendyol'un resmi 57 sütunlu Excel şablonunu doldurarak indir"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{exportingExcel ? 'Excel Hazırlanıyor...' : 'Trendyol Excel Şablonu İndir (.xlsx)'}</span>
          </button>

          {/* Primary Trendyol Push Button */}
          <button
            onClick={handleCreateOnTrendyolV2}
            disabled={creating || calculatedItems.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-xl shadow-orange-500/25 flex items-center gap-2.5 transition disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${creating ? 'animate-bounce' : ''}`} />
            <span>{creating ? 'Trendyol V2\'ye Aktarılıyor...' : `Tüm Ölçülerle (${calculatedItems.length}) Trendyol V2'ye Yükle`}</span>
          </button>
        </div>
      </div>

      {/* Success & Batch Status Banner */}
      {successBanner && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button onClick={() => setSuccessBanner(null)} className="text-xs underline hover:text-emerald-100">Kapat</button>
          </div>

          {lastBatchId && (
            <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono">
                <span className="text-slate-400">Batch Request ID:</span>
                <code className="bg-slate-950 px-2.5 py-1 rounded text-orange-400 font-bold">{lastBatchId}</code>
              </div>
              <button
                onClick={checkBatchStatus}
                disabled={checkingBatch}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{checkingBatch ? 'Kontrol Ediliyor...' : 'Trendyol Onay Durumunu Sorgula'}</span>
              </button>
            </div>
          )}

          {batchStatusResult && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div>Durum: <strong className="text-emerald-400">{batchStatusResult.status}</strong></div>
              <div>Toplam Öğe: {batchStatusResult.itemCount} | Hatalı Öğe: {batchStatusResult.failedItemCount || 0}</div>
            </div>
          )}
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
            <h4 className="text-sm font-bold text-slate-100">🪟 Tül Perde (V2)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Pilesiz, 1x2, 1x2.5, 1x3 Pile metre formülü</p>
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
            <h4 className="text-sm font-bold text-slate-100">📜 Stor & Zebra (V2)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">M² hesabı, min 2 m² kuralı, etek ve boncuk</p>
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
            <h4 className="text-sm font-bold text-slate-100">🎭 Fon Perde (V2)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Tek / Çift Kanat ve pile seçenekleri</p>
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
            <h4 className="text-sm font-bold text-slate-100">🌑 Karartma / Saten (V2)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Blackout ve Saten Güneşlik dikiş payı</p>
          </div>
        </button>
      </div>

      {/* Step 2: Photo Upload & Gallery Management */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-300">
            <ImageIcon className="w-4 h-4 text-orange-400" />
            <span>1. Ürün Fotoğrafları ({images.length}/8 Görsel)</span>
          </div>
          <span className="text-[11px] text-slate-400">Trendyol en fazla 8 görsel kabul eder (1. görsel kapak resmi)</span>
        </div>

        {/* Upload Zone */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Drag & Drop / File Select Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-6 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl bg-slate-950/60 hover:bg-slate-950 transition cursor-pointer flex flex-col items-center justify-center text-center group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
            <div className="p-3 rounded-full bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition mb-2">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-200">
              {isUploadingPhoto ? 'Fotoğraf Yükleniyor...' : 'Bilgisayardan Fotoğraf Seç'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">veya fotoğrafları buraya sürükleyip bırakın (JPG, PNG, WEBP)</p>
          </div>

          {/* Photo Gallery Grid */}
          <div className="lg:col-span-3 flex flex-wrap gap-3 items-center">
            {images.map((imgUrl, idx) => (
              <div 
                key={idx}
                className="relative group w-28 h-28 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md flex-shrink-0"
              >
                <img 
                  src={imgUrl} 
                  alt={`Ürün Görseli ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />

                {/* Badge for Main Cover */}
                {idx === 0 ? (
                  <span className="absolute top-1.5 left-1.5 bg-orange-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Kapak
                  </span>
                ) : (
                  <button
                    onClick={() => setCoverImage(idx)}
                    className="absolute top-1.5 left-1.5 bg-slate-900/80 hover:bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                    title="Bu görseli kapak resmi yap"
                  >
                    Kapak Yap
                  </button>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 bg-rose-600/80 hover:bg-rose-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                  title="Görseli sil"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="absolute bottom-1 right-1.5 bg-slate-950/80 px-1 rounded text-[9px] text-slate-300 font-mono">
                  #{idx + 1}
                </div>
              </div>
            ))}

            {images.length === 0 && (
              <div className="text-xs text-slate-500 italic p-4">
                Henüz ürün fotoğrafı eklenmedi. En az 1 görsel eklemeniz önerilir.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Trendyol V2 Meta & Attributes Setup */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-300">
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>2. Trendyol V2 & Excel Özellik Bilgileri (Resmi Standartlar)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">POST /v2/products & Excel Uyumlu</span>
        </div>

        {/* Row 1: Title, Model, Brand */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-400 font-medium mb-1.5">Trendyol Ürün Başlığı (title):</label>
            <input
              type="text"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Marka Seçimi (brandId):</label>
            <select
              value={selectedBrandId}
              onChange={(e) => {
                const bId = Number(e.target.value);
                setSelectedBrandId(bId);
                const b = brands.find(item => item.id === bId);
                if (b) setSelectedBrandName(b.name);
              }}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium focus:border-orange-500"
            >
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name} (ID: {b.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Model Kodu (productMainId):</label>
            <input
              type="text"
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-orange-400 font-bold uppercase focus:border-orange-500"
            />
          </div>
        </div>

        {/* Row 2: Perde Resmi Nitelikleri (Materyal, Takma Şekli, Desen, Işık Geçirgenliği, Kullanım Alanı) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Kumaş Materyali:</label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              <option value="Polyester">Polyester (Standart)</option>
              <option value="Keten">Keten</option>
              <option value="Pamuk">Pamuk</option>
              <option value="%100 Pamuk">%100 Pamuk</option>
              <option value="Dantel">Dantel</option>
              <option value="Mikrofiber">Mikrofiber</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Takma Şekli:</label>
            <select
              value={hangingType}
              onChange={(e) => setHangingType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              <option value="Kornişli">Kornişli</option>
              <option value="Rustik">Rustik</option>
              <option value="Halkalı">Halkalı</option>
              <option value="Briz Çubuğu">Briz Çubuğu</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Desen:</label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              <option value="Düz">Düz</option>
              <option value="Armürlü">Armürlü</option>
              <option value="Çizgili">Çizgili</option>
              <option value="Çiçekli">Çiçekli</option>
              <option value="Geometrik">Geometrik</option>
              <option value="Eskitme">Eskitme</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Işık Geçirgenliği:</label>
            <select
              value={lightTransmittance}
              onChange={(e) => setLightTransmittance(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              <option value="Şeffaf">Şeffaf (Tül Standart)</option>
              <option value="Oda Karanlığı">Oda Karanlığı</option>
              <option value="Blackout">Blackout (Tam Karartma)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Kullanım Alanı:</label>
            <select
              value={usageArea}
              onChange={(e) => setUsageArea(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              <option value="Salon / Oturma Odası">Salon / Oturma Odası</option>
              <option value="Yatak Odası">Yatak Odası</option>
              <option value="Mutfak">Mutfak</option>
              <option value="Antre / Hol">Antre / Hol</option>
              <option value="Bebek / Çocuk Odası">Bebek / Çocuk Odası</option>
            </select>
          </div>
        </div>

        {/* Row 3: Cargo, DeliveryDuration, VAT, Desi, Color */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Kargo Firması:</label>
            <select
              value={selectedCargoCompanyId}
              onChange={(e) => setSelectedCargoCompanyId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              {cargoCompanies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Kargoya Verme (Gün):</label>
            <select
              value={deliveryDuration}
              onChange={(e) => setDeliveryDuration(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              <option value={1}>1 Gün (Hızlı Teslimat)</option>
              <option value={2}>2 Gün (Standart)</option>
              <option value={3}>3 Gün (Özel Dikim)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">KDV Oranı (%):</label>
            <select
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              <option value={10}>%10 KDV (Tekstil/Perde)</option>
              <option value={20}>%20 KDV (Standart)</option>
              <option value={1}>%1 KDV</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Desi (Hacim):</label>
            <input
              type="number"
              step="0.5"
              value={desi}
              onChange={(e) => setDesi(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Renk Özelliği (Web Color):</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-medium"
            >
              <option value="Ekru">Ekru</option>
              <option value="Beyaz">Beyaz</option>
              <option value="Krem">Krem</option>
              <option value="Antrasit">Antrasit</option>
              <option value="Vizon">Vizon</option>
              <option value="Gri">Gri</option>
              <option value="Bej">Bej</option>
              <option value="Pudra">Pudra</option>
              <option value="Lacivert">Lacivert</option>
            </select>
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

          {/* Kâr & Komisyon */}
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

      {/* Step 3: Size Matrix */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">
              Ölçü Şablonu / Havuzu ({sizes.length} Ebat Tanımlı)
            </h3>
          </div>

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
            <span>Trendyol V2 Formatında Hesaplanmış Varyantlar ({calculatedItems.length} Varyant)</span>
          </div>
          <span className="text-[11px] text-slate-400">Canlı Önizleme</span>
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
                <th className="py-3.5 px-4 text-orange-400">Trendyol Satış Fiyatı (TSF)</th>
                <th className="py-3.5 px-4 text-purple-400">Taban Fiyat (Güvenlik)</th>
                <th className="py-3.5 px-4">Komisyon (%{vatRate ? 20 : 20})</th>
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
