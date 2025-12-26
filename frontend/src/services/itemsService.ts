import api from './api';
import { Item, ImportPreviewResponse, ImportResult } from '../types/item.types';

export const itemsService = {
  getAll: async (params?: {
    category?: number;
    below_par?: boolean;
    vendor?: number;
    search?: string;
    critical?: boolean;
  }): Promise<Item[]> => {
    const response = await api.get('/items/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Item> => {
    const response = await api.get(`/items/${id}/`);
    return response.data;
  },

  create: async (item: Partial<Item>): Promise<Item> => {
    const response = await api.post('/items/', item);
    return response.data;
  },

  update: async (id: number, item: Partial<Item>): Promise<Item> => {
    const response = await api.put(`/items/${id}/`, item);
    return response.data;
  },

  getUsage: async (id: number, days: number = 30): Promise<any> => {
    const response = await api.get(`/items/${id}/usage/`, { params: { days } });
    return response.data;
  },

  getStockByLocation: async (id: number): Promise<any> => {
    const response = await api.get(`/items/${id}/stock_by_location/`);
    return response.data;
  },

  bulkImport: async (file: File, preview: boolean = true): Promise<ImportPreviewResponse | ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // FormData Content-Type will be set automatically by the interceptor
    const response = await api.post(
      `/items/bulk_import/?preview=${preview}`,
      formData
    );
    return response.data;
  },
};

