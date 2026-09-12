export interface ProductVariant {
  id: number;
  product_id: number;
  barcode: string;
  variant_name: string;
  width_cm: number;
  height_cm: number;
  fabric_type: string;
  stock_quantity: number;
  current_price: number;
  cost_price: number;
  commission_rate: number;
  cargo_cost: number;
  packaging_cost: number;
  min_price: number;
  max_price: number;
  last_synced_at?: string;
  product_title?: string;
  brand?: string;
  category_name?: string;
  image_url?: string;
}

export interface Product {
  id: number;
  model_code: string;
  title: string;
  brand: string;
  category_name: string;
  image_url?: string;
  variants: ProductVariant[];
}

// Perde Sihirbazı Tipleri
export interface CurtainSizeInput {
  width: number;
  height: number;
}

export interface CurtainCalculateBatchRequest {
  category_type: 'tul' | 'stor_zebra' | 'fon' | 'karartma_saten';
  unit_price: number;
  pleat_type?: 'pilesiz' | '1x2' | '1x2.5' | '1x3';
  panel_type?: 'tek_kanat' | 'cift_kanat';
  has_skirt?: boolean;
  skirt_m2_extra?: number;
  has_bead?: boolean;
  bead_m2_extra?: number;
  cargo_cost?: number;
  commission_rate?: number;
  target_profit_margin?: number;
  round_to_90?: boolean;
  sizes: CurtainSizeInput[];
}

export interface CurtainCalculateItemResult {
  width_cm: number;
  height_cm: number;
  size_label: string;
  calculated_quantity_or_m2: number;
  fabric_cost: number;
  direct_cost: number;
  total_cost: number;
  sale_price: number;
  min_price: number;
  commission_amount: number;
  net_income: number;
  net_profit: number;
  profit_margin_pct: number;
}

export interface CreateCurtainProductRequest {
  title: string;
  brand: string;
  category_name: string;
  model_code: string;
  image_url?: string;
  description?: string;
  variants: any[];
}

// Toplu Fiyatlandırma Tipleri
export interface BulkAdjustmentRequest {
  scope: 'all' | 'category' | 'selected';
  category_name?: string;
  selected_variant_ids?: number[];
  adjustment_type: 'percentage' | 'fixed_amount';
  operation: 'increase' | 'decrease';
  value: number;
  round_to_90?: boolean;
}

export interface BulkAdjustmentItemPreview {
  variant_id: number;
  product_title: string;
  brand: string;
  category_name: string;
  variant_name: string;
  barcode: string;
  stock_quantity: number;
  old_price: number;
  new_price: number;
  price_diff: number;
  commission_rate: number;
  commission_amount: number;
  estimated_net_income: number;
  estimated_net_profit: number;
  profit_margin_pct: number;
}

export interface BuyboxItem {
  id: number;
  variant_id: number;
  barcode: string;
  product_title: string;
  variant_name: string;
  current_price: number;
  min_price: number;
  has_buybox: boolean;
  last_buybox_price?: number;
  winner_seller_name?: string;
  competitor_lowest_price?: number;
  is_active: boolean;
  strategy: string;
  price_diff: number;
  last_checked_at?: string;
}

export interface PriceLog {
  id: number;
  variant_id: number;
  barcode?: string;
  old_price: number;
  new_price: number;
  trigger_source: string;
  reason: string;
  created_at: string;
}

export interface SellerSettings {
  id?: number;
  supplier_id: string;
  api_key: string;
  api_secret: string;
  is_mock_mode: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_enabled: boolean;
}
