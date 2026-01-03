import api from './api';
import { Item, ImportPreviewResponse, ImportResult } from '../types/item.types';

export const itemsService = {
  getAll: async (params?: {
    category?: number;
    below_par?: boolean;
    vendor?: number;
    search?: string;
    critical?: boolean;
  }): Promise<Item[]> => {
    console.log('Calling items API with params:', params);
    const response = await api.get('/items/', { 
      params,
      withCredentials: true, // Ensure cookies are sent
    });
    console.log('Items API response:', { 
      status: response.status, 
      data: response.data,
      hasResults: !!response.data?.results,
      resultsLength: response.data?.results?.length,
      isArray: Array.isArray(response.data),
      dataLength: response.data?.length,
      keys: Object.keys(response.data || {})
    });
    const data = response.data;
    
    // Handle paginated response
    if (data.results) {
      let allItems = [...data.results];
      
      // If there are more pages, fetch them all
      if (data.next) {
        let nextUrl = data.next;
        while (nextUrl) {
          try {
            // Handle both absolute and relative URLs
            let apiPath = nextUrl;
            if (nextUrl.startsWith('http://') || nextUrl.startsWith('https://')) {
              // Extract the path from absolute URL
              const urlObj = new URL(nextUrl);
              apiPath = urlObj.pathname + urlObj.search;
            }
            
            const nextResponse = await api.get(apiPath);
            if (nextResponse.data.results) {
              allItems = [...allItems, ...nextResponse.data.results];
              nextUrl = nextResponse.data.next;
            } else {
              break;
            }
          } catch (error) {
            console.error('Error fetching next page:', error);
            break;
          }
        }
      }
      
      return allItems;
    }
    
    // Non-paginated response
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: number): Promise<Item> => {
    const response = await api.get(`/items/${id}/`);
    return response.data;
  },

  create: async (item: Partial<Item>): Promise<Item> => {
    const response = await api.post('/items/', item);
    return response.data;
  },

  update: async (id: number, item: Partial<Item>): Promise<Item> => {
    const response = await api.put(`/items/${id}/`, item);
    return response.data;
  },

  getUsage: async (id: number, days: number = 30): Promise<any> => {
    const response = await api.get(`/items/${id}/usage/`, { params: { days } });
    return response.data;
  },

  getStockByLocation: async (id: number): Promise<any> => {
    const response = await api.get(`/items/${id}/stock_by_location/`);
    return response.data;
  },

  bulkImport: async (file: File, preview: boolean = true): Promise<ImportPreviewResponse | ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // FormData Content-Type will be set automatically by the interceptor
    const response = await api.post(
      `/items/bulk_import/?preview=${preview}`,
      formData
    );
    return response.data;
  },

  lookupByCode: async (shortCode: string): Promise<Item> => {
    const response = await api.get(`/items/lookup/${shortCode}/`);
    return response.data;
  },

  getQRCode: async (id: number, size: number = 200): Promise<string> => {
    // Returns the QR code image URL
    // Use relative URL in production, absolute in development
    const hostname = window.location.hostname;
    const baseUrl = (hostname !== 'localhost' && hostname !== '127.0.0.1') 
      ? '/api' 
      : (process.env.REACT_APP_API_URL || 'http://localhost:8000/api');
    return `${baseUrl}/items/${id}/qr-code/?size=${size}`;
  },
};

