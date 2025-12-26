import api from './api';
import { Location } from '../types/location.types';

export const locationsService = {
  getAll: async (): Promise<Location[]> => {
    const response = await api.get('/locations/');
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Location> => {
    const response = await api.get(`/locations/${id}/`);
    return response.data;
  },

  getTree: async (): Promise<Location[]> => {
    const response = await api.get('/locations/tree/');
    return response.data;
  },

  getStock: async (id: number): Promise<any> => {
    const response = await api.get(`/locations/${id}/stock/`);
    return response.data;
  },

  create: async (location: Partial<Location>): Promise<Location> => {
    const response = await api.post('/locations/', location);
    return response.data;
  },
};

