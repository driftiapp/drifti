const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://drifti-backend.onrender.com';

export const apiConfig = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
  validateStatus: (status: number) => status >= 200 && status < 300,
  retry: 3,
  retryDelay: 1000, // 1 second
};

export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    verify: '/api/auth/verify',
    logout: '/api/auth/logout',
  },
  rides: {
    create: '/api/rides',
    list: '/api/rides',
    get: (id: string) => `/api/rides/${id}`,
    update: (id: string) => `/api/rides/${id}`,
    cancel: (id: string) => `/api/rides/${id}/cancel`,
  },
  payments: {
    create: '/api/payments',
    verify: '/api/payments/verify',
    refund: '/api/payments/refund',
  },
  health: {
    check: '/api/health',
    db: '/api/health/db',
  },
};

// API error types
export interface ApiError {
  status: 'error';
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// API response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: ApiError;
}

export default apiConfig; 