import api from './api';
import { InventoryTransaction } from '../types/stock.types';

export const receivingService = {
  receive: async (data: {
    item_id: number;
    to_location_id: number;
    qty: number;
    cost?: number;
    vendor_id?: number;
    po_number?: string;
    notes?: string;
  }): Promise<InventoryTransaction> => {
    const response = await api.post('/receiving/receive/', data);
    return response.data;
  },

  getHistory: async (): Promise<InventoryTransaction[]> => {
    const response = await api.get('/receiving/history/');
    return response.data;
  },
};

