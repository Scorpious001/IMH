import api from './api';
import { Department } from '../types/department.types';

export const departmentsService = {
  getAll: async (params?: { is_active?: boolean }): Promise<Department[]> => {
    const response = await api.get('/settings/departments/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Department> => {
    const response = await api.get(`/settings/departments/${id}/`);
    return response.data;
  },

  create: async (data: {
    name: string;
    code?: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Department> => {
    const response = await api.post('/settings/departments/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Department>): Promise<Department> => {
    const response = await api.patch(`/settings/departments/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/settings/departments/${id}/`);
  },
};
