import api from './api';
import { Vendor } from '../types/vendor.types';

export const vendorsService = {
  getAll: async (): Promise<Vendor[]> => {
    const response = await api.get('/settings/vendors/');
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Vendor> => {
    const response = await api.get(`/settings/vendors/${id}/`);
    return response.data;
  },

  create: async (data: {
    name: string;
    contact_info?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
  }): Promise<Vendor> => {
    const response = await api.post('/settings/vendors/', data);
    return response.data;
  },

  update: async (id: number, data: {
    name?: string;
    contact_info?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
  }): Promise<Vendor> => {
    const response = await api.patch(`/settings/vendors/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/settings/vendors/${id}/`);
  },
};

