import axios from 'axios';

// Get API URL from environment or use appropriate default
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV 
    ? 'http://localhost:5000/api'  // Development
    : '/api'                         // Production (assumes backend at same domain)
);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: 401 → clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const isAuthPage = /\/login$|\/register$/.test(window.location.pathname);
      if (!isAuthPage) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;