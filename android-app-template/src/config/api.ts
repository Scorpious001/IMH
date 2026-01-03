import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL - Update this with your AWS backend URL
export const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000/api' // Android emulator localhost
  : 'http://3.234.249.243/api'; // Production EC2 URL (update to HTTPS when SSL is configured)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Token storage key
const TOKEN_KEY = '@imh_ims:auth_token';
const CSRF_TOKEN_KEY = '@imh_ims:csrf_token';

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // Add CSRF token if available (for session auth)
    const csrfToken = await AsyncStorage.getItem(CSRF_TOKEN_KEY);
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth
      await AsyncStorage.multiRemove([TOKEN_KEY, CSRF_TOKEN_KEY]);
      // Could navigate to login screen here
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: async (username: string, password: string) => {
    // Get CSRF token first
    const csrfResponse = await api.get('/auth/csrf/');
    const csrfToken = csrfResponse.data.csrfToken;
    await AsyncStorage.setItem(CSRF_TOKEN_KEY, csrfToken);

    // Login
    const response = await api.post('/auth/login/', { username, password });
    
    // Store token if provided
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    }
    
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove([TOKEN_KEY, CSRF_TOKEN_KEY]);
    }
  },

  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },
};

export default api;

