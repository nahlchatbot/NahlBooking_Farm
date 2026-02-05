import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

console.log('[API CLIENT] Initializing with base URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-token');
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, {
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
  });
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] ${response.config.url}`, {
      status: response.status,
      ok: response.data?.ok,
    });
    return response;
  },
  (error) => {
    console.error(`[API ERROR] ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Don't redirect if we're already on login page or if this is the login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isOnLoginPage = window.location.pathname.includes('/login');

      console.log('[API ERROR] 401 detected', { isLoginRequest, isOnLoginPage });

      if (!isLoginRequest && !isOnLoginPage) {
        console.log('[API ERROR] Clearing auth and redirecting to login');
        localStorage.removeItem('admin-token');
        localStorage.removeItem('admin-user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/admin/auth/login', { email, password });
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get('/admin/auth/me');
    return res.data;
  },
};

// Bookings API
export const bookingsApi = {
  list: async (params?: Record<string, string>) => {
    const res = await apiClient.get('/admin/bookings', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/admin/bookings/${id}`);
    return res.data;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await apiClient.patch(`/admin/bookings/${id}`, data);
    return res.data;
  },
  cancel: async (id: string, reason?: string) => {
    const res = await apiClient.delete(`/admin/bookings/${id}`, {
      data: { reason },
    });
    return res.data;
  },
};

// Dashboard API
export const dashboardApi = {
  stats: async () => {
    const res = await apiClient.get('/admin/dashboard/stats');
    return res.data;
  },
};

// Chalets API
export const chaletsApi = {
  list: async () => {
    const res = await apiClient.get('/admin/chalets');
    return res.data;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await apiClient.patch(`/admin/chalets/${id}`, data);
    return res.data;
  },
};

// Pricing API
export const pricingApi = {
  list: async () => {
    const res = await apiClient.get('/admin/pricing');
    return res.data;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await apiClient.patch(`/admin/pricing/${id}`, data);
    return res.data;
  },
};

// Blackout Dates API
export const blackoutApi = {
  list: async (params?: Record<string, string>) => {
    const res = await apiClient.get('/admin/blackout-dates', { params });
    return res.data;
  },
  create: async (data: { date: string; visitType?: string; reason?: string }) => {
    const res = await apiClient.post('/admin/blackout-dates', data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/admin/blackout-dates/${id}`);
    return res.data;
  },
};

// Settings API
export const settingsApi = {
  list: async () => {
    const res = await apiClient.get('/admin/settings');
    return res.data;
  },
  update: async (key: string, value: unknown) => {
    const res = await apiClient.patch(`/admin/settings/${key}`, { value });
    return res.data;
  },
  bulkUpdate: async (settings: Record<string, unknown>) => {
    const res = await apiClient.put('/admin/settings', settings);
    return res.data;
  },
};
