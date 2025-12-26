import api from './api';
import { InventoryTransaction } from '../types/stock.types';

export const transactionsService = {
  getByItem: async (itemId: number, limit: number = 50): Promise<InventoryTransaction[]> => {
    const response = await api.get(`/items/${itemId}/transactions/`, {
      params: { limit }
    });
    return response.data.transactions || [];
  },
};

