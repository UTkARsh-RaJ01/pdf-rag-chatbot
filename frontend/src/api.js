import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const uploadPDFs = async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const sendMessage = async (question, chatHistory = []) => {
    const response = await api.post('/chat', {
        question,
        chat_history: chatHistory,
    });
    return response.data;
};

export const clearHistory = async () => {
    const response = await api.post('/clear-history');
    return response.data;
};

export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};

export const getEmbeddingProvider = async () => {
    const response = await api.get('/settings/embedding-provider');
    return response.data;
};

export const setEmbeddingProvider = async (provider) => {
    const response = await api.post('/settings/embedding-provider', { provider });
    return response.data;
};

export default api;
