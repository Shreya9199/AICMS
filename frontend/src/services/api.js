import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nivaran_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic interceptor for handling 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      localStorage.removeItem('nivaran_token');
      localStorage.removeItem('nivaran_user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/track')) {
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
