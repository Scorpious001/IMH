import api from './api';
import { RequestedItem } from '../types/requested-item.types';

export const requestedItemsService = {
  getAll: async (params?: {
    status?: string;
    user_id?: number;
    department_id?: number;
    item_id?: number;
  }): Promise<RequestedItem[]> => {
    const response = await api.get('/requested-items/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<RequestedItem> => {
    const response = await api.get(`/requested-items/${id}/`);
    return response.data;
  },

  create: async (data: {
    item_id: number;
    requested_qty: number;
    department_id?: number;
    notes?: string;
    priority?: number;
  }): Promise<RequestedItem> => {
    const response = await api.post('/requested-items/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<RequestedItem>): Promise<RequestedItem> => {
    const response = await api.patch(`/requested-items/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/requested-items/${id}/`);
  },

  markOrdered: async (id: number): Promise<RequestedItem> => {
    const response = await api.post(`/requested-items/${id}/mark_ordered/`);
    return response.data;
  },

  markReceived: async (id: number): Promise<RequestedItem> => {
    const response = await api.post(`/requested-items/${id}/mark_received/`);
    return response.data;
  },

  cancel: async (id: number): Promise<RequestedItem> => {
    const response = await api.post(`/requested-items/${id}/cancel/`);
    return response.data;
  },
};
