import api from './api';
import { PhysicalChangeRequest, PhysicalChangeRequestLine } from '../types/physical-change-request.types';

export const physicalChangeRequestsService = {
  getAll: async (params?: {
    status?: string;
    location_id?: number;
    user_id?: number;
    needs_approval?: boolean;
  }): Promise<PhysicalChangeRequest[]> => {
    const response = await api.get('/physical-change-requests/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<PhysicalChangeRequest> => {
    const response = await api.get(`/physical-change-requests/${id}/`);
    return response.data;
  },

  create: async (data: {
    request_type: string;
    location_id: number;
    lines: Array<{ item_id: number; qty: number; notes?: string }>;
    notes?: string;
    cost_threshold?: number;
  }): Promise<PhysicalChangeRequest> => {
    const response = await api.post('/physical-change-requests/', data);
    return response.data;
  },

  approve: async (id: number): Promise<PhysicalChangeRequest> => {
    const response = await api.post(`/physical-change-requests/${id}/approve/`);
    return response.data;
  },

  deny: async (id: number, denial_reason?: string): Promise<PhysicalChangeRequest> => {
    const response = await api.post(`/physical-change-requests/${id}/deny/`, { denial_reason });
    return response.data;
  },

  markPrinted: async (id: number): Promise<PhysicalChangeRequest> => {
    const response = await api.post(`/physical-change-requests/${id}/mark_printed/`);
    return response.data;
  },

  getForPrint: async (cost_threshold?: number): Promise<PhysicalChangeRequest[]> => {
    const params = cost_threshold ? { cost_threshold } : {};
    const response = await api.get('/physical-change-requests/for_print/', { params });
    return response.data.results || response.data;
  },
};
