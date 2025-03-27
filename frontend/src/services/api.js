import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Health check endpoints
export const healthApi = {
    getStatus: () => api.get('/health/status'),
    getComponentStatus: (component) => api.get(`/health/status/${component}`),
    getDetailedStatus: () => api.get('/health/detailed-status')
};

// Alert endpoints
export const alertApi = {
    getStats: () => api.get('/alerts/stats'),
    getRecent: (limit = 100) => api.get(`/alerts/recent?limit=${limit}`),
    getByComponent: (component, limit = 50) => 
        api.get(`/alerts/component/${component}?limit=${limit}`),
    getByType: (type, limit = 50) => 
        api.get(`/alerts/type/${type}?limit=${limit}`),
    getByTimeRange: (startTime, endTime) => 
        api.get(`/alerts/time-range?startTime=${startTime}&endTime=${endTime}`)
};

// System metrics endpoints
export const metricsApi = {
    getSystemMetrics: () => api.get('/metrics/system'),
    getComponentMetrics: (component) => api.get(`/metrics/component/${component}`),
    getHistoricalMetrics: (timeRange) => 
        api.get(`/metrics/historical?timeRange=${timeRange}`)
};

// Configuration endpoints
export const configApi = {
    getAlertConfig: () => api.get('/config/alerts'),
    updateAlertConfig: (config) => api.put('/config/alerts', config),
    getThresholds: () => api.get('/config/thresholds'),
    updateThresholds: (thresholds) => api.put('/config/thresholds', thresholds)
};

export default api; 