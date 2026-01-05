export interface Category {
  id: number;
  name: string;
  icon?: string;
  parent_category?: number;
  subcategories?: Category[];
  is_active: boolean;
  par_min?: number;
  par_max?: number;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: number;
  name: string;
  contact_info?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: number;
  name: string;
  short_code: string;
  category?: number;
  category_name?: string;
  photo_url?: string;
  unit_of_measure: string;
  default_vendor?: number;
  default_vendor_name?: string;
  cost?: number;
  lead_time_days: number;
  is_active: boolean;
  property_on_hand?: number;
  property_id?: string;
  is_below_par_anywhere?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageData {
  item_id: number;
  item_name: string;
  period_days: number;
  usage_by_day: Array<{
    day: string;
    total_qty: number;
  }>;
}

export interface StockByLocationItem {
  id: number;
  item?: number;  // From serializer
  item_id?: number;  // Alternative field name
  item_name?: string;
  item_short_code?: string;
  location: number;  // From serializer
  location_id?: number;  // Alternative field name
  location_name: string;
  location_property_id?: string;
  on_hand_qty: number;
  reserved_qty: number;
  available_qty: number;
  par: number;
  is_below_par: boolean;
  is_at_risk: boolean;
  last_counted_at?: string;
}

export interface StockByLocationData {
  item_id: number;
  item_name: string;
  property_on_hand: number;
  property_id?: string;
  stock_by_location: StockByLocationItem[];
}

export interface ImportPreviewRow {
  row_number: number;
  data: {
    name: string;
    short_code: string;
    category?: string;
    default_vendor?: string;
    photo_url?: string;
    unit_of_measure: string;
    cost?: number;
    lead_time_days: number;
    is_active: boolean;
    location_name?: string;
    location_type?: string;
    location_property_id?: string;
    parent_location_name?: string;
    on_hand_qty?: number;
    par?: number;
  };
  errors: string[];
}

export interface ImportPreviewResponse {
  preview: boolean;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  rows: ImportPreviewRow[];
  errors: Array<{
    row_number: number;
    errors: string[];
    data: Record<string, any>;
  }>;
  original_columns?: string[];
  detected_columns?: string[];
}

export interface ImportResult {
  items_created: number;
  items_updated: number;
  vendors_created?: number;
  locations_created: number;
  stock_levels_created: number;
  stock_levels_updated: number;
  errors: Array<{
    row_number: number;
    errors: string[];
  }>;
}

