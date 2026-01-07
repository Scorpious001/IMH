import api from './api';
import { Alert, SuggestedOrdersResponse, UsageTrend } from '../types/report.types';

interface EnvironmentalImpact {
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

export const reportsService = {
  getAlerts: async (): Promise<Alert> => {
    const response = await api.get('/reports/alerts/');
    return response.data;
  },

  getSuggestedOrders: async (vendorId?: number): Promise<SuggestedOrdersResponse> => {
    const params = vendorId ? { vendor_id: vendorId } : {};
    const response = await api.get('/reports/suggested-orders/', { params });
    return response.data;
  },

  getUsageTrends: async (itemId: number, days: number = 30): Promise<UsageTrend> => {
    const response = await api.get('/reports/usage-trends/', {
      params: { item_id: itemId, days },
    });
    return response.data;
  },

  getGeneralUsage: async (period: 'month' | 'quarter' | 'year' = 'year'): Promise<any> => {
    const response = await api.get('/reports/general-usage/', {
      params: { period },
    });
    return response.data;
  },

  getLowParTrends: async (): Promise<any> => {
    const response = await api.get('/reports/low-par-trends/');
    return response.data;
  },

  getEnvironmentalImpact: async (): Promise<EnvironmentalImpact> => {
    const response = await api.get('/reports/environmental-impact/');
    return response.data;
  },
};
