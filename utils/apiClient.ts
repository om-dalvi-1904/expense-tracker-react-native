import { API_BASE_URL } from '@/constants/Config';
import axios from 'axios';

// Create an axios instance with custom config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method?.toUpperCase()} request to ${config.url}`, {
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      message: error.message,
      response: {
        status: error.response?.status,
        data: error.response?.data,
      },
      request: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    });
    return Promise.reject(error);
  }
);

export default apiClient;
