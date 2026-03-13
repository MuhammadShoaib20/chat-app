import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV 
    ? 'http://localhost:5000'
    : 'https://chat-app-14ut.onrender.com'
);

const api = axios.create({
  baseURL: API_URL,
  // ✅ Remove the default Content-Type header – let Axios set it automatically
  // headers: { 'Content-Type': 'application/json' }, // ❌ removed
});

// Request interceptor to add token
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

// Response interceptor for 401 handling
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