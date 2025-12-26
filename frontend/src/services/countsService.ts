import api from './api';
import { CountSession, CountLine } from '../types/count.types';

export const countsService = {
  getAll: async (params?: { status?: string; location_id?: number }): Promise<CountSession[]> => {
    const response = await api.get('/counts/sessions/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<CountSession> => {
    const response = await api.get(`/counts/sessions/${id}/`);
    return response.data;
  },

  create: async (data: {
    location_id: number;
    notes?: string;
  }): Promise<CountSession> => {
    const response = await api.post('/counts/sessions/', data);
    return response.data;
  },

  addLine: async (sessionId: number, data: {
    item_id: number;
    counted_qty: number;
    reason_code?: string;
    notes?: string;
  }): Promise<CountLine> => {
    const response = await api.post(`/counts/sessions/${sessionId}/lines/`, data);
    return response.data;
  },

  complete: async (id: number): Promise<CountSession> => {
    const response = await api.post(`/counts/sessions/${id}/complete/`);
    return response.data;
  },

  approve: async (id: number): Promise<CountSession> => {
    const response = await api.post(`/counts/sessions/${id}/approve/`);
    return response.data;
  },
};

