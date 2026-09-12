import {
  Product,
  BulkAdjustmentRequest,
  BulkAdjustmentItemPreview,
  BuyboxItem,
  PriceLog,
  SellerSettings,
  CurtainCalculateBatchRequest,
  CurtainCalculateItemResult
} from './types';

const BASE_URL = 'http://127.0.0.1:8000/api';

export const api = {
  // Settings
  getSettings: async (): Promise<SellerSettings> => {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Ayarlar alınamadı');
    return res.json();
  },
  updateSettings: async (data: SellerSettings): Promise<SellerSettings> => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Ayarlar güncellenemedi');
    return res.json();
  },
  testTelegram: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${BASE_URL}/settings/test-telegram`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Telegram testi başarısız');
    }
    return res.json();
  },

  // Trendyol V2 Meta Servisleri
  getBrands: async (name?: string): Promise<{ id: number; name: string }[]> => {
    const url = name ? `${BASE_URL}/products/brands?name=${encodeURIComponent(name)}` : `${BASE_URL}/products/brands`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Markalar alınamadı');
    return res.json();
  },
  getCategoryTree: async (): Promise<{ id: number; name: string; parentId?: number }[]> => {
    const res = await fetch(`${BASE_URL}/products/categories-tree`);
    if (!res.ok) throw new Error('Kategoriler alınamadı');
    return res.json();
  },
  getCargoCompanies: async (): Promise<{ id: number; name: string }[]> => {
    const res = await fetch(`${BASE_URL}/products/cargo-companies`);
    if (!res.ok) throw new Error('Kargo firmaları alınamadı');
    return res.json();
  },
  getBatchStatus: async (batchRequestId: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/products/batch-status/${batchRequestId}`);
    if (!res.ok) throw new Error('Batch durumu sorgulanamadı');
    return res.json();
  },

  // Products & Curtain Wizard
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${BASE_URL}/products`);
    if (!res.ok) throw new Error('Ürünler alınamadı');
    return res.json();
  },
  syncProducts: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${BASE_URL}/products/sync`, { method: 'POST' });
    if (!res.ok) throw new Error('Senkronizasyon başarısız');
    return res.json();
  },
  calculateCurtainSizes: async (data: CurtainCalculateBatchRequest): Promise<CurtainCalculateItemResult[]> => {
    const res = await fetch(`${BASE_URL}/products/calculate-curtain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Perde hesaplaması yapılamadı');
    return res.json();
  },
  createProductV2: async (data: any): Promise<any> => {
    const res = await fetch(`${BASE_URL}/products/create-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Ürün oluşturulamadı');
    }
    return res.json();
  },

  // Bulk Pricing & Trendyol Sync
  getCategories: async (): Promise<string[]> => {
    const res = await fetch(`${BASE_URL}/pricing/categories`);
    if (!res.ok) throw new Error('Kategoriler alınamadı');
    return res.json();
  },
  previewBulkAdjustment: async (data: BulkAdjustmentRequest): Promise<BulkAdjustmentItemPreview[]> => {
    const res = await fetch(`${BASE_URL}/pricing/bulk-adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Fiyat ayarlaması hesaplanamadı');
    return res.json();
  },
  syncPricesToTrendyol: async (items: { variant_id: number; new_price: number }[]): Promise<any> => {
    const res = await fetch(`${BASE_URL}/pricing/sync-trendyol`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error('Trendyol ile eşitleme başarısız');
    return res.json();
  },
  updateSingleVariant: async (variantId: number, newPrice: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/pricing/variant/${variantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant_id: variantId, new_price: newPrice })
    });
    if (!res.ok) throw new Error('Fiyat güncellenemedi');
    return res.json();
  },

  // Buybox & Repricer
  getBuyboxItems: async (): Promise<BuyboxItem[]> => {
    const res = await fetch(`${BASE_URL}/buybox`);
    if (!res.ok) throw new Error('Buybox listesi alınamadı');
    return res.json();
  },
  updateBuyboxStrategy: async (id: number, data: { is_active: boolean; strategy: string; price_diff: number }): Promise<BuyboxItem> => {
    const res = await fetch(`${BASE_URL}/buybox/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Buybox stratejisi güncellenemedi');
    return res.json();
  },
  simulateCompetitorAttack: async (variantId: number, competitorPrice: number, competitorName: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/buybox/simulate-attack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variant_id: variantId,
        competitor_price: competitorPrice,
        competitor_name: competitorName
      })
    });
    if (!res.ok) throw new Error('Simülasyon çalıştırılamadı');
    return res.json();
  },
  getPriceLogs: async (): Promise<PriceLog[]> => {
    const res = await fetch(`${BASE_URL}/buybox/logs`);
    if (!res.ok) throw new Error('Fiyat geçmişi alınamadı');
    return res.json();
  }
};
