import api from './api';
import { DashboardStats } from '../types/dashboard.types';

export const dashboardService = {
  getStats: async (days: number = 30): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats/', { params: { days } });
    return response.data;
  },
};
