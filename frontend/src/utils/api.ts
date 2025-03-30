import { logger } from './logger';
import apiCache from './cache';

interface RequestOptions extends RequestInit {
  retries?: number;
  useCache?: boolean;
  cacheTTL?: number;
  revalidateOnError?: boolean;
}

class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    useCache = false,
    cacheTTL,
    revalidateOnError = true,
    ...fetchOptions
  } = options;

  // Check cache first if enabled
  if (useCache) {
    const cachedData = await apiCache.get<T>(url, async (): Promise<T> => {
      try {
        const data = await fetchAndProcessResponse<T>(url, fetchOptions);
        return data;
      } catch (error) {
        if (revalidateOnError) {
          throw error; // Let the cache handle revalidation
        }
        return null as T;
      }
    });
    if (cachedData) {
      return cachedData;
    }
  }

  return fetchAndProcessResponse(url, fetchOptions);
}

async function fetchAndProcessResponse<T>(
  url: string,
  fetchOptions: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = new ApiError('API request failed');
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = await response.text();
    }
    throw error;
  }

  const data = await response.json();
  return data as T;
}

// Helper methods for common HTTP methods
export const api = {
  get: <T>(url: string, options?: RequestOptions) => 
    apiRequest<T>(url, { method: 'GET', ...options }),

  post: <T>(url: string, data: any, options?: RequestOptions) =>
    apiRequest<T>(url, { 
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  put: <T>(url: string, data: any, options?: RequestOptions) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    }),

  delete: <T>(url: string, options?: RequestOptions) =>
    apiRequest<T>(url, { method: 'DELETE', ...options }),
};

// API endpoints
export const endpoints = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
    },
    rides: {
        create: '/rides',
        list: '/rides',
        get: (id: string) => `/rides/${id}`,
        cancel: (id: string) => `/rides/${id}/cancel`,
    },
    payments: {
        create: '/payments',
        list: '/payments',
        get: (id: string) => `/payments/${id}`,
    },
    users: {
        profile: '/users/profile',
        update: '/users/profile',
    },
};

// API functions with caching
export const apiFunctions = {
    auth: {
        login: (data: { email: string; password: string }) =>
            api.post(endpoints.auth.login, data),
        register: (data: { email: string; password: string; name: string }) =>
            api.post(endpoints.auth.register, data),
        logout: () => api.post(endpoints.auth.logout, {}),
        refresh: () => api.post(endpoints.auth.refresh, {}),
    },
    rides: {
        create: (data: any) => api.post(endpoints.rides.create, data),
        list: () => api.get(endpoints.rides.list, { useCache: true }),
        get: (id: string) => api.get(endpoints.rides.get(id), { useCache: true }),
        cancel: (id: string) => api.post(endpoints.rides.cancel(id), {}),
    },
    payments: {
        create: (data: any) => api.post(endpoints.payments.create, data),
        list: () => api.get(endpoints.payments.list, { useCache: true }),
        get: (id: string) => api.get(endpoints.payments.get(id), { useCache: true }),
    },
    users: {
        getProfile: () => api.get(endpoints.users.profile, { useCache: true }),
        updateProfile: (data: any) => api.put(endpoints.users.update, data),
    },
}; 