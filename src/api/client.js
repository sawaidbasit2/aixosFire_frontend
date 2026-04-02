import axios from 'axios';

const normalizeApiUrl = (url) => {
    if (!url) return 'http://localhost:5000/api';
    
    let normalized = url.trim();
    
    // Remove trailing slash
    normalized = normalized.replace(/\/+$/, '');
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(normalized)) {
        if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
            normalized = `http://${normalized}`;
        } else {
            normalized = `https://${normalized}`;
        }
    }
    
    // Append /api if missing (backend structure for this project)
    if (!normalized.endsWith('/api')) {
        normalized = `${normalized}/api`;
    }
    
    return normalized;
};

export const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default client;
