import api from './api';

const authService = {

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  // Backend: POST /auth/login  (JSON body: { email, password })
  // Returns: { access_token, refresh_token, token_type, user }
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });

    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  // ─── REGISTER ────────────────────────────────────────────────────────────
  // Backend: POST /auth/register  (JSON body: { email, password, role, org_id })
  // Returns: UserResponse (no token — user must login after register)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // ─── REFRESH TOKEN ───────────────────────────────────────────────────────
  // Backend: POST /auth/refresh  (JSON body: { refresh_token })
  // Returns: { access_token, token_type }
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });

    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }

    return response.data;
  },

  // ─── LOGOUT ──────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  // ─── GET CURRENT USER ────────────────────────────────────────────────────
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // ─── IS AUTHENTICATED ────────────────────────────────────────────────────
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

export default authService;