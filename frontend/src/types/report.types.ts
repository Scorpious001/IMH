import { StockLevel } from './stock.types';
import { Item } from './item.types';

export interface BelowParAlert {
  item_id: number;
  item_name: string;
  item_short_code: string;
  location_id: number;
  location_name: string;
  on_hand_qty: number;
  par: number;
  stock_level: StockLevel;
}

export interface AtRiskAlert {
  item_id: number;
  item_name: string;
  item_short_code: string;
  location_id: number;
  location_name: string;
  on_hand_qty: number;
  par: number;
  stock_level: StockLevel;
}

export interface Alert {
  below_par: BelowParAlert[];
  at_risk: AtRiskAlert[];
  below_par_count: number;
  at_risk_count: number;
}

export interface SuggestedOrder {
  item_id: number;
  item_name: string;
  item_short_code: string;
  location_id?: number;
  location_name?: string;
  item: Item;
  suggested_qty: number;
  reason: string;
  current_stock: number;
  current_on_hand?: number;
  par: number;
  avg_daily_usage?: number;
  lead_time_days?: number;
  projected_on_hand?: number;
  days_until_below_par?: number;
  vendor_id?: number;
  vendor_name?: string;
}

export interface SuggestedOrdersResponse {
  suggestions: SuggestedOrder[];
  total_suggested_value?: number;
}

export interface UsageTrend {
  item_id: number;
  item_name: string;
  period_days: number;
  usage_by_day: Array<{
    day: string;
    total_qty: number;
  }>;
  total_usage: number;
  average_daily_usage: number;
}

export interface EnvironmentalImpact {
  system_start_date: string;
  days_active: number;
  paper_savings: {
    total_transactions: number;
    pages_saved: number;
    trees_saved: number;
    co2_saved_kg: number;
  };
  waste_reduction: {
    total_items_tracked: number;
    below_par_alerts_prevented: number;
    waste_reduction_percentage: number;
    estimated_value_saved: number;
    waste_weight_kg: number;
    co2_saved_kg: number;
  };
  transportation: {
    total_receipts: number;
    trips_saved: number;
    km_saved: number;
    co2_saved_kg: number;
  };
  carbon_footprint: {
    total_co2_saved_kg: number;
    total_co2_saved_tons: number;
    equivalent_cars_off_road_days: number;
  };
  energy_savings: {
    kwh_saved: number;
    equivalent_homes_powered_days: number;
  };
  summary: {
    trees_saved: number;
    total_co2_tons: number;
    waste_avoided_kg: number;
  };
}