import api from './api';
import { User, Permission } from '../types/user.types';

export interface CreateUserData {
  username: string;
  email?: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: 'SUPERVISOR' | 'MANAGER' | 'ADMIN';
  permission_ids?: number[];
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  role?: 'SUPERVISOR' | 'MANAGER' | 'ADMIN';
  permission_ids?: number[];
}

export const usersService = {
  getAll: async (search?: string): Promise<User[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/settings/users/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/settings/users/${id}/`);
    return response.data;
  },

  create: async (data: CreateUserData): Promise<User> => {
    const response = await api.post('/settings/users/', data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserData): Promise<User> => {
    const response = await api.put(`/settings/users/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/settings/users/${id}/`);
  },

  getAvailablePermissions: async (): Promise<Permission[]> => {
    try {
      const response = await api.get('/settings/users/permissions/');
      // Handle both array and object with results property
      return Array.isArray(response.data) ? response.data : (response.data.results || response.data || []);
    } catch (error: any) {
      console.error('Error fetching available permissions:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },
};

export type { User, Permission };

