import axios from 'axios';

// Determine API base URL at runtime
// Always use relative URL when not on localhost (production)
// This ensures cookies are sent correctly for session-based auth
const getApiBaseUrl = () => {
  // Always use relative URL in production (when not on localhost)
  // This ensures session cookies work correctly
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return '/api';
  }
  
  // Only use absolute URL for local development
  // Check if REACT_APP_API_URL is set for local dev override
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return envUrl;
  }
  
  // Default to localhost for development
  return 'http://localhost:8000/api';
};

// Get API URL at runtime, not build time
let API_BASE_URL: string | null = null;

const getApiUrl = () => {
  if (!API_BASE_URL) {
    API_BASE_URL = getApiBaseUrl();
    // Debug logging to verify API URL
    console.log('API Base URL:', API_BASE_URL);
    console.log('Current hostname:', window.location.hostname);
    console.log('Current origin:', window.location.origin);
  }
  return API_BASE_URL;
};

const api = axios.create({
  baseURL: getApiUrl(),
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
    console.log('Fetching CSRF token from:', `${getApiUrl()}/auth/csrf/`);
    const response = await api.get('/auth/csrf/');
    csrfToken = response.data?.csrfToken || response.data?.csrf;
    console.log('CSRF token retrieved:', csrfToken ? 'Yes' : 'No');
    if (!csrfToken) {
      console.warn('CSRF token not found in response:', response.data);
    }
    return csrfToken;
  } catch (error: any) {
    console.error('Failed to get CSRF token:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    csrfToken = null;
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
    try {
      // Ensure we have a CSRF token before login
      if (!csrfToken) {
        console.log('Fetching CSRF token before login...');
        await getCSRFToken();
      }
      
      console.log('Attempting login for:', username);
      console.log('API Base URL:', getApiUrl());
      console.log('CSRF Token available:', !!csrfToken);
      
      const response = await api.post('/auth/login/', { username, password }, {
        withCredentials: true, // Ensure cookies are sent
      });
      
      console.log('Login response status:', response.status);
      console.log('Login response data:', response.data);
      
      // Refresh CSRF token after login
      await getCSRFToken();
      
      if (response.data && response.data.user) {
        console.log('Login successful, user data:', response.data.user);
        return response.data;
      } else {
        console.error('Login response missing user data:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
      
      // Provide more specific error messages
      if (error.response) {
        const errorData = error.response.data;
        if (errorData?.error) {
          throw new Error(errorData.error);
        }
        if (error.response.status === 401) {
          throw new Error('Invalid username or password');
        }
        if (error.response.status === 403) {
          throw new Error(errorData?.error || 'Access denied');
        }
        if (error.response.status === 400) {
          throw new Error(errorData?.error || 'Invalid request');
        }
        throw new Error(`Server error: ${error.response.status} ${error.response.statusText}`);
      }
      
      if (error.request) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      
      throw error;
    }
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

