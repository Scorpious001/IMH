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
    try {
      console.log('📦 Calling items API with params:', params);
      const response = await api.get('/items/', { 
        params,
        withCredentials: true, // Ensure cookies are sent
      });
      
      console.log('📦 Items API response:', { 
        status: response.status, 
        statusText: response.statusText,
        data: response.data,
        hasResults: !!response.data?.results,
        resultsLength: response.data?.results?.length,
        isArray: Array.isArray(response.data),
        dataLength: response.data?.length,
        keys: Object.keys(response.data || {}),
        fullResponse: response
      });
      
      const data = response.data;
      
      // Handle paginated response
      if (data && data.results) {
        console.log('📦 Paginated response detected. Results count:', data.results.length);
        let allItems = [...data.results];
        
        // If there are more pages, fetch them all
        if (data.next) {
          console.log('📦 Fetching additional pages...');
          let nextUrl = data.next;
          let pageCount = 1;
          while (nextUrl && pageCount < 100) { // Safety limit
            try {
              // Handle both absolute and relative URLs
              let apiPath = nextUrl;
              if (nextUrl.startsWith('http://') || nextUrl.startsWith('https://')) {
                // Extract the path from absolute URL
                const urlObj = new URL(nextUrl);
                apiPath = urlObj.pathname + urlObj.search;
              }
              
              console.log(`📦 Fetching page ${pageCount + 1} from:`, apiPath);
              const nextResponse = await api.get(apiPath);
              if (nextResponse.data.results) {
                allItems = [...allItems, ...nextResponse.data.results];
                nextUrl = nextResponse.data.next;
                pageCount++;
                console.log(`📦 Page ${pageCount} loaded. Total items so far:`, allItems.length);
              } else {
                break;
              }
            } catch (error) {
              console.error('📦 Error fetching next page:', error);
              break;
            }
          }
        }
        
        console.log('📦 Total items after pagination:', allItems.length);
        return allItems;
      }
      
      // Non-paginated response
      if (Array.isArray(data)) {
        console.log('📦 Array response detected. Items count:', data.length);
        return data;
      }
      
      // Empty or unexpected response
      console.warn('📦 Unexpected response format:', data);
      return [];
    } catch (error: any) {
      console.error('📦 Error in itemsService.getAll:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          params: error.config?.params
        }
      });
      throw error;
    }
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

