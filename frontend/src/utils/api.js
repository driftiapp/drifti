import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const fetchComponentData = async (componentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/components/${componentId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch component data');
    }
};

export const fetchModelPredictions = async (componentId, params) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/components/${componentId}/predict`,
            params
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch predictions');
    }
};

export const fetchModelInsights = async (componentId) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/components/${componentId}/insights`
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch model insights');
    }
};

export const fetchStructuralBreaks = async (componentId) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/components/${componentId}/structural-breaks`
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch structural breaks');
    }
};

export const fetchFeatureImportance = async (componentId) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/components/${componentId}/feature-importance`
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch feature importance');
    }
};

export const fetchModelComparison = async (componentId) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/components/${componentId}/model-comparison`
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch model comparison');
    }
};

export const fetchModelInfo = async (componentId) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/components/${componentId}/model-info`
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch model info');
    }
}; 