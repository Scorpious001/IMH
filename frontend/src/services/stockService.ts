import api from './api';
import { StockLevel, InventoryTransaction } from '../types/stock.types';

export const stockService = {
  getAll: async (params?: { item_id?: number; location_id?: number }): Promise<StockLevel[]> => {
    const response = await api.get('/stock/', { params });
    return response.data.results || response.data;
  },

  getByItem: async (itemId: number): Promise<any> => {
    const response = await api.get('/stock/by_item/', { params: { item_id: itemId } });
    return response.data;
  },

  transfer: async (data: {
    item_id: number;
    from_location_id: number;
    to_location_id: number;
    qty: number;
    notes?: string;
  }): Promise<InventoryTransaction> => {
    const response = await api.post('/stock/transfer/', data);
    return response.data;
  },

  issue: async (data: {
    item_id: number;
    from_location_id: number;
    qty: number;
    notes?: string;
    work_order_id?: string;
  }): Promise<InventoryTransaction> => {
    const response = await api.post('/stock/issue/', data);
    return response.data;
  },

  adjust: async (data: {
    item_id: number;
    location_id: number;
    qty: number;
    notes?: string;
    reason?: string;
  }): Promise<InventoryTransaction> => {
    const response = await api.post('/stock/adjust/', data);
    return response.data;
  },
};

