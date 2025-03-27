import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

export const aiService = {
    // Business Intelligence
    async getBusinessMetrics() {
        const response = await axios.get(`${API_BASE_URL}/ai/metrics`);
        return response.data;
    },

    async getRevenueForecasts() {
        const response = await axios.get(`${API_BASE_URL}/ai/forecasts/revenue`);
        return response.data;
    },

    async getDemandPredictions() {
        const response = await axios.get(`${API_BASE_URL}/ai/predictions/demand`);
        return response.data;
    },

    // Auto-Grow Features
    async getAutoGrowActions() {
        const response = await axios.get(`${API_BASE_URL}/ai/actions/auto-grow`);
        return response.data;
    },

    async executeAutoGrowAction(actionId) {
        const response = await axios.post(`${API_BASE_URL}/ai/actions/auto-grow/${actionId}/execute`);
        return response.data;
    },

    async toggleAutoGrow(enabled) {
        const response = await axios.post(`${API_BASE_URL}/ai/auto-grow/toggle`, { enabled });
        return response.data;
    },

    // Workforce Optimization
    async getWorkforceOptimization() {
        const response = await axios.get(`${API_BASE_URL}/ai/workforce/optimization`);
        return response.data;
    },

    async applyStaffingRecommendation(recommendationId) {
        const response = await axios.post(`${API_BASE_URL}/ai/workforce/recommendations/${recommendationId}/apply`);
        return response.data;
    },

    async toggleAutoScheduling(enabled) {
        const response = await axios.post(`${API_BASE_URL}/ai/workforce/auto-scheduling/toggle`, { enabled });
        return response.data;
    },

    // Revenue Optimization
    async getRevenueOptimization() {
        const response = await axios.get(`${API_BASE_URL}/ai/revenue/optimization`);
        return response.data;
    },

    async applyPriceAdjustment(adjustmentId) {
        const response = await axios.post(`${API_BASE_URL}/ai/revenue/adjustments/${adjustmentId}/apply`);
        return response.data;
    },

    async getInventoryAlerts() {
        const response = await axios.get(`${API_BASE_URL}/ai/inventory/alerts`);
        return response.data;
    },

    // Smart Advertising
    async getAdvertisingInsights() {
        const response = await axios.get(`${API_BASE_URL}/ai/advertising/insights`);
        return response.data;
    },

    async createAutoCampaign(campaignData) {
        const response = await axios.post(`${API_BASE_URL}/ai/advertising/campaigns`, campaignData);
        return response.data;
    },

    async optimizeCampaign(campaignId) {
        const response = await axios.post(`${API_BASE_URL}/ai/advertising/campaigns/${campaignId}/optimize`);
        return response.data;
    },

    async getRetargetingSegments() {
        const response = await axios.get(`${API_BASE_URL}/ai/advertising/retargeting/segments`);
        return response.data;
    },

    async createFlashSale(saleData) {
        const response = await axios.post(`${API_BASE_URL}/ai/advertising/flash-sales`, saleData);
        return response.data;
    },

    // Analytics & Reporting
    async getPerformanceMetrics(timeframe) {
        const response = await axios.get(`${API_BASE_URL}/ai/analytics/performance`, {
            params: { timeframe }
        });
        return response.data;
    },

    async generateInsightsReport(options) {
        const response = await axios.post(`${API_BASE_URL}/ai/analytics/reports/insights`, options);
        return response.data;
    },

    async getAutomationStats() {
        const response = await axios.get(`${API_BASE_URL}/ai/analytics/automation-stats`);
        return response.data;
    },

    // Error Handling
    handleError(error) {
        console.error('AI Service Error:', error);
        
        if (error.response) {
            // Server responded with error
            const { status, data } = error.response;
            return {
                status,
                message: data.message || 'An error occurred with the AI service',
                details: data.details || {}
            };
        } else if (error.request) {
            // Request made but no response
            return {
                status: 503,
                message: 'AI service is currently unavailable',
                details: { requestError: error.request }
            };
        } else {
            // Error in request setup
            return {
                status: 500,
                message: 'Error setting up AI service request',
                details: { message: error.message }
            };
        }
    }
};

// Interceptor to handle errors globally
axios.interceptors.response.use(
    response => response,
    error => {
        const errorResponse = aiService.handleError(error);
        // You can add global error handling here, like showing notifications
        return Promise.reject(errorResponse);
    }
);

export default aiService; 