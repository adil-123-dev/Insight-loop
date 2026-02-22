import axios from 'axios';

// ══════════════════════════════════════════════════════════════════
//  AXIOS INSTANCE — Base configuration for all API calls
//  Backend runs at: http://localhost:8000
//  All routes are prefixed with /api on the backend
// ══════════════════════════════════════════════════════════════════

const api = axios.create({
  baseURL: 'http://localhost:8000',   // No /api prefix — backend routes include their own prefixes
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────────
// Automatically attach JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────────
// Handle 401 (token expired) globally — redirect to login
// BUT skip redirect on /auth/login itself (wrong password returns 401 too)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;