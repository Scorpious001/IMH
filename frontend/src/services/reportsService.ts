import api from './api';
import { Alert, SuggestedOrdersResponse, UsageTrend } from '../types/report.types';

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
};
