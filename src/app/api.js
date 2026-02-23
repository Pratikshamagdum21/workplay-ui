import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8081/',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request Interceptor (attach token)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response Interceptor (handle errors globally)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response ?.status === 401) {
            console.error('Unauthorized! Redirecting to login...');
        }
        return Promise.reject(error);
    }
);

export default api;