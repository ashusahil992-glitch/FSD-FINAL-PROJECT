import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../redux/authSlice.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

// Attach the JWT (added in Phase 2) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn any failure into a human-readable `error.userMessage`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      error.userMessage = error.response.data?.message || 'Something went wrong. Please try again.';
    } else if (error.code === 'ECONNABORTED') {
      error.userMessage = 'The server took too long to respond.';
    } else {
      error.userMessage = 'Cannot reach the server. Is the backend running?';
    }
    return Promise.reject(error);
  }
);

export default api;
