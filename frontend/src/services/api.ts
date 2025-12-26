import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For session-based auth
});

// CSRF token cache
let csrfToken: string | null = null;

// Function to get CSRF token
export const getCSRFToken = async (): Promise<string | null> => {
  try {
    // Use the api instance to ensure cookies are sent
    const response = await api.get('/auth/csrf/');
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

// Initialize CSRF token on module load (but don't block)
// The token will be fetched when needed

// Request interceptor for adding CSRF token and handling requests
api.interceptors.request.use(
  async (config) => {
    // For FormData, let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // For state-changing requests, add CSRF token
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      // Get CSRF token if we don't have it
      if (!csrfToken) {
        await getCSRFToken();
      }
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear any auth state
      localStorage.removeItem('authToken');
      csrfToken = null;
      // Don't redirect if we're already trying to login
      if (!error.config?.url?.includes('/auth/login')) {
        // Could redirect to login page here if needed
        console.warn('Unauthorized access - please log in');
      }
    } else if (error.response?.status === 403) {
      // CSRF token might be invalid, try to get a new one
      if (error.response?.data?.detail?.includes('CSRF')) {
        await getCSRFToken();
      }
    }
    return Promise.reject(error);
  }
);

// Authentication helper functions
export const authService = {
  login: async (username: string, password: string) => {
    // Ensure we have a CSRF token before login
    if (!csrfToken) {
      await getCSRFToken();
    }
    const response = await api.post('/auth/login/', { username, password });
    // Refresh CSRF token after login
    await getCSRFToken();
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      csrfToken = null;
      localStorage.removeItem('authToken');
    }
  },
  getUser: async () => {
    const response = await api.get('/auth/user/');
    return response.data;
  },
};

export default api;

