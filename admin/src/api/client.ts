import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on login page or if this is the login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isOnLoginPage = window.location.pathname.includes('/login');

      if (!isLoginRequest && !isOnLoginPage) {
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
export interface ChaletImage {
  id: string;
  url: string;
  caption?: string;
  sortOrder: number;
}

export interface Chalet {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  maxGuests: number;
  descriptionAr?: string;
  descriptionEn?: string;
  amenities: string[];
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  images: ChaletImage[];
  _count?: { bookings: number };
}

export interface CreateChaletData {
  nameAr: string;
  nameEn: string;
  maxGuests: number;
  descriptionAr?: string;
  descriptionEn?: string;
  amenities?: string[];
  imageUrl?: string;
  sortOrder?: number;
}

export interface UpdateChaletData {
  nameAr?: string;
  nameEn?: string;
  maxGuests?: number;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  amenities?: string[];
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const chaletsApi = {
  list: async () => {
    const res = await apiClient.get('/admin/chalets');
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/admin/chalets/${id}`);
    return res.data;
  },
  create: async (data: CreateChaletData) => {
    const res = await apiClient.post('/admin/chalets', data);
    return res.data;
  },
  update: async (id: string, data: UpdateChaletData) => {
    const res = await apiClient.patch(`/admin/chalets/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/admin/chalets/${id}`);
    return res.data;
  },
  // Image management
  addImage: async (chaletId: string, url: string, caption?: string) => {
    const res = await apiClient.post(`/admin/chalets/${chaletId}/images`, { url, caption });
    return res.data;
  },
  deleteImage: async (chaletId: string, imageId: string) => {
    const res = await apiClient.delete(`/admin/chalets/${chaletId}/images/${imageId}`);
    return res.data;
  },
  reorderImages: async (chaletId: string, imageIds: string[]) => {
    const res = await apiClient.patch(`/admin/chalets/${chaletId}/images/reorder`, { imageIds });
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

// Admin Users API
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  createdBy?: { id: string; name: string };
}

export interface CreateAdminUserData {
  email: string;
  password: string;
  name: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  phone?: string;
}

export interface UpdateAdminUserData {
  email?: string;
  name?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  phone?: string | null;
  isActive?: boolean;
}

export const adminUsersApi = {
  list: async () => {
    const res = await apiClient.get('/admin/users');
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/admin/users/${id}`);
    return res.data;
  },
  create: async (data: CreateAdminUserData) => {
    const res = await apiClient.post('/admin/users', data);
    return res.data;
  },
  update: async (id: string, data: UpdateAdminUserData) => {
    const res = await apiClient.patch(`/admin/users/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  },
  changePassword: async (id: string, newPassword: string) => {
    const res = await apiClient.post(`/admin/users/${id}/change-password`, { newPassword });
    return res.data;
  },
};

// Calendar API
export interface CalendarBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  visitType: string;
  status: string;
}

export interface CalendarDate {
  date: string;
  dayVisit: 'available' | 'booked' | 'blackout';
  overnight: 'available' | 'booked' | 'blackout';
  bookings: CalendarBooking[];
}

export interface CalendarSummary {
  available: number;
  booked: number;
  blackout: number;
  totalBookings: number;
}

export interface CalendarData {
  year: number;
  month: number;
  dates: CalendarDate[];
  summary: CalendarSummary;
}

export interface BlockDateData {
  startDate: string;
  endDate?: string;
  visitType?: 'DAY_VISIT' | 'OVERNIGHT_STAY';
  reason?: string;
}

export const calendarApi = {
  get: async (year: number, month: number) => {
    const res = await apiClient.get('/admin/calendar', { params: { year, month } });
    return res.data;
  },
  block: async (data: BlockDateData) => {
    const res = await apiClient.post('/admin/calendar/block', data);
    return res.data;
  },
  unblock: async (date: string, visitType?: string) => {
    const res = await apiClient.post('/admin/calendar/unblock', { date, visitType });
    return res.data;
  },
};

// Reports API
export interface ReportDateRange {
  startDate?: string;
  endDate?: string;
}

export interface BookingsReportParams extends ReportDateRange {
  visitType?: string;
  status?: string;
}

export const reportsApi = {
  bookings: async (params?: BookingsReportParams) => {
    const res = await apiClient.get('/admin/reports/bookings', { params });
    return res.data;
  },
  revenue: async (params?: ReportDateRange) => {
    const res = await apiClient.get('/admin/reports/revenue', { params });
    return res.data;
  },
  occupancy: async (params?: ReportDateRange) => {
    const res = await apiClient.get('/admin/reports/occupancy', { params });
    return res.data;
  },
  customers: async (params?: ReportDateRange) => {
    const res = await apiClient.get('/admin/reports/customers', { params });
    return res.data;
  },
  exportBookingsCsv: (params?: ReportDateRange) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    window.open(`${apiClient.defaults.baseURL}/admin/reports/export/bookings?${queryString}`, '_blank');
  },
  exportRevenueCsv: (params?: ReportDateRange) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    window.open(`${apiClient.defaults.baseURL}/admin/reports/export/revenue?${queryString}`, '_blank');
  },
};
