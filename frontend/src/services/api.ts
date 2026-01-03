import axios from 'axios';

// Determine API base URL
// In production (when served from same domain), use relative URL
// In development, use localhost or env variable
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If we're in production (not localhost), use relative URL
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  
  // Default to localhost for development
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging to verify API URL
console.log('API Base URL:', API_BASE_URL);
console.log('Current hostname:', window.location.hostname);
console.log('Current origin:', window.location.origin);

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
    // Handle JSON parsing errors (axios throws these when response is not valid JSON)
    if (error.message && (error.message.includes('JSON') || error.message.includes('Unexpected token'))) {
      console.error('JSON parsing error:', error);
      console.error('Response data:', error.response?.data);
      return Promise.reject(new Error('Failed to parse server response. The server may have returned invalid JSON.'));
    }
    
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
    const response = await api.post('/auth/login/', { username, password }, {
      withCredentials: true, // Ensure cookies are sent
    });
    // Refresh CSRF token after login
    await getCSRFToken();
    console.log('Login successful, user data:', response.data);
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
    const response = await api.get('/auth/user/', {
      withCredentials: true, // Ensure cookies are sent
    });
    console.log('getUser response:', response.data);
    return response.data;
  },
};

export default api;

