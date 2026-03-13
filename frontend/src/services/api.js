import axios from 'axios';

// Direct backend URL from env, or fallback
// Tip: Agar local hai to baseURL: 'http://localhost:5000/api' rakhein
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL, // Yahan /api add kar diya taake niche files mein repeat na ho
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