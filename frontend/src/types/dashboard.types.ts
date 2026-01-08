export interface TopItemUsed {
  item_id: number;
  item_name: string;
  item_short_code: string;
  item_photo_url: string;
  unit_of_measure: string;
  total_qty_used: number;
  transaction_count: number;
}

export interface OverallInventoryUsage {
  total_qty_used: number;
  unique_items_used: number;
  total_transactions: number;
  avg_qty_per_transaction: number;
  current_inventory_value: number;
  total_items_in_stock: number;
  items_below_par: number;
  period_days: number;
}

export interface DashboardStats {
  top_5_items_used: TopItemUsed[];
  overall_inventory_usage: OverallInventoryUsage;
  department_filter?: string;
}
