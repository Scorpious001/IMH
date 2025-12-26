import api from './api';
import { Category } from '../types/item.types';
import { Vendor } from '../types/vendor.types';

export const settingsService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/settings/categories/');
    return response.data.results || response.data;
  },

  createCategory: async (data: { name: string; parent_category?: number | null; description?: string; icon?: string; is_active?: boolean }): Promise<Category> => {
    console.log('Creating category with data:', data);
    try {
      const response = await api.post('/settings/categories/', data);
      return response.data;
    } catch (error: any) {
      console.error('Error in createCategory:', error);
      console.error('Request data was:', data);
      throw error;
    }
  },

  updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
    const response = await api.patch(`/settings/categories/${id}/`, data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/settings/categories/${id}/`);
  },

  getVendors: async (): Promise<Vendor[]> => {
    const response = await api.get('/settings/vendors/');
    return response.data.results || response.data;
  },

  updateParLevels: async (updates: Array<{
    item_id: number;
    location_id: number;
    par?: number;
  }>): Promise<any> => {
    const response = await api.post('/settings/par-levels/', { updates });
    return response.data;
  },

  getCategoryParLevels: async (categoryId: number): Promise<any> => {
    const response = await api.get(`/settings/categories/${categoryId}/par-levels/`);
    return response.data;
  },

  updateCategoryParLevels: async (categoryId: number, parMin?: number, parMax?: number): Promise<any> => {
    const response = await api.post(`/settings/categories/${categoryId}/par-levels/`, {
      par_min: parMin,
      par_max: parMax,
    });
    return response.data;
  },

  bulkApplyCategoryParLevels: async (categoryId: number): Promise<any> => {
    const response = await api.post(`/settings/categories/${categoryId}/par-levels/bulk-apply/`);
    return response.data;
  },
};

