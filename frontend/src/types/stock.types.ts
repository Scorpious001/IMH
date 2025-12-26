export interface StockLevel {
  id: number;
  item: number;
  item_name: string;
  item_short_code: string;
  item_photo_url?: string;
  location: number;
  location_name: string;
  on_hand_qty: number;
  reserved_qty: number;
  available_qty: number;
  par: number;
  is_below_par: boolean;
  is_at_risk: boolean;
  last_counted_at?: string;
  last_counted_by?: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'RECEIVE' | 'ISSUE' | 'TRANSFER' | 'ADJUST' | 'COUNT_ADJUST';

export interface InventoryTransaction {
  id: number;
  item: number;
  item_name: string;
  from_location?: number;
  from_location_name?: string;
  to_location?: number;
  to_location_name?: string;
  qty: number;
  type: TransactionType;
  timestamp: string;
  user?: number;
  user_name?: string;
  cost?: number;
  notes?: string;
  requisition?: number;
  receipt_id?: string;
  work_order_id?: string;
  count_session?: number;
}

