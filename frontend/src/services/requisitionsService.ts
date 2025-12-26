import api from './api';
import { Requisition } from '../types/requisition.types';

export const requisitionsService = {
  getAll: async (params?: { status?: string; location_id?: number }): Promise<Requisition[]> => {
    const response = await api.get('/requisitions/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Requisition> => {
    const response = await api.get(`/requisitions/${id}/`);
    return response.data;
  },

  create: async (data: {
    from_location_id: number;
    to_location_id: number;
    lines: Array<{ item_id: number; qty: number }>;
    needed_by?: string;
    notes?: string;
  }): Promise<Requisition> => {
    const response = await api.post('/requisitions/', data);
    return response.data;
  },

  pick: async (id: number): Promise<Requisition> => {
    const response = await api.post(`/requisitions/${id}/pick/`);
    return response.data;
  },

  complete: async (id: number): Promise<Requisition> => {
    const response = await api.post(`/requisitions/${id}/complete/`);
    return response.data;
  },

  approve: async (id: number): Promise<Requisition> => {
    const response = await api.post(`/requisitions/${id}/approve/`);
    return response.data;
  },

  deny: async (id: number, denial_reason?: string): Promise<Requisition> => {
    const response = await api.post(`/requisitions/${id}/deny/`, { denial_reason });
    return response.data;
  },
};

