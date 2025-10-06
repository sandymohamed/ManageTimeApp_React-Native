import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = config.API_BASE_URL;
    console.log("ApiClient baseURL:", this.baseURL);
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000, // Increased timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add retry configuration
      retry: 3,
      retryDelay: 1000,
    });

    this.setupInterceptors();
  }

  // In your ApiClient setupInterceptors method
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await useAuthStore.getState().getToken();
        console.log('🔑 Using token for request:', !!token);

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.log('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ Response received:', response.status);
        return response;
      },
      async (error) => {
        console.log('❌ Response error:', error.response?.status);
        console.log('❌ Error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          config: {
            baseURL: error.config?.baseURL,
            url: error.config?.url,
            method: error.config?.method
          }
        });

        const originalRequest = error.config;

        // Handle network errors
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          console.log('🌐 Network error detected, this might be a connectivity issue');
          return Promise.reject(new Error('Network connection failed. Please check your internet connection and try again.'));
        }

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔄 Attempting token refresh...');
          originalRequest._retry = true;

          try {
            await useAuthStore.getState().refreshAuthToken();

            const newToken = await useAuthStore.getState().getToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              console.log('✅ Token refreshed, retrying request...');
              return this.client(originalRequest);
            } else {
              console.log('❌ No token available after refresh, logging out...');
              await useAuthStore.getState().logout();
              return Promise.reject(new Error('Authentication failed'));
            }
          } catch (refreshError) {
            console.log('❌ Token refresh failed, logging out...');
            await useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  // Upload file
  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }

  // Download file
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
