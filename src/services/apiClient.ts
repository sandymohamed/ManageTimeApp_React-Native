// import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
// import { useAuthStore } from '@/store/authStore';
// import { config } from '@/config/env';
// import { logger } from '@/utils/logger';

// class ApiClient {
//   private client: AxiosInstance;
//   private baseURL: string;

//   constructor() {
//     this.baseURL = config.API_BASE_URL;
//     console.log("ApiClient baseURL:", this.baseURL);
//     this.client = axios.create({
//       baseURL: this.baseURL,
//       timeout: 15000, // Increased timeout
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//       },
//       // Add retry configuration
//       retry: 3,
//       retryDelay: 1000,
//     });

//     this.setupInterceptors();
//   }

//   // In your ApiClient setupInterceptors method
//   private setupInterceptors() {
//     // Request interceptor
//     this.client.interceptors.request.use(
//       async (config) => {
//         const token = await useAuthStore.getState().getToken();
//         console.log('🔑 Using token for request:', !!token);

//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => {
//         console.log('❌ Request interceptor error:', error);
//         return Promise.reject(error);
//       }
//     );

//     // Response interceptor
//     this.client.interceptors.response.use(
//       (response) => {
//         console.log('✅ Response received:', response.status);
//         return response;
//       },
//       async (error) => {
//         console.log('❌ Response error:', error.response?.status);
//         console.log('❌ Error details:', {
//           message: error.message,
//           code: error.code,
//           response: error.response?.data,
//           config: {
//             baseURL: error.config?.baseURL,
//             url: error.config?.url,
//             method: error.config?.method
//           }
//         });

//         const originalRequest = error.config;

//         // Handle network errors
//         if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
//           console.log('🌐 Network error detected, this might be a connectivity issue');
//           return Promise.reject(new Error('Network connection failed. Please check your internet connection and try again.'));
//         }

//         // Handle 401 errors with token refresh
//         if (error.response?.status === 401 && !originalRequest._retry) {
//           console.log('🔄 Attempting token refresh...');
//           originalRequest._retry = true;

//           try {
//             await useAuthStore.getState().refreshAuthToken();

//             const newToken = await useAuthStore.getState().getToken();
//             if (newToken) {
//               originalRequest.headers.Authorization = `Bearer ${newToken}`;
//               console.log('✅ Token refreshed, retrying request...');
//               return this.client(originalRequest);
//             } else {
//               console.log('❌ No token available after refresh, logging out...');
//               await useAuthStore.getState().logout();
//               return Promise.reject(new Error('Authentication failed'));
//             }
//           } catch (refreshError: any) {
//             console.log('❌ Token refresh failed:', refreshError.message);

//             // If it's a refresh token error, don't retry
//             if (refreshError.message?.includes('Refresh token expired') ||
//                 refreshError.message?.includes('Invalid refresh token') ||
//                 refreshError.message?.includes('401')) {
//               console.log('🚪 Refresh token error detected, logging out...');
//               await useAuthStore.getState().logout();
//               return Promise.reject(new Error('Authentication failed. Please login again.'));
//             }

//             await useAuthStore.getState().logout();
//             return Promise.reject(refreshError);
//           }
//         }

//         return Promise.reject(error);
//       }
//     );
//   }

//   async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
//     const response: AxiosResponse<T> = await this.client.get(url, config);
//     return response.data;
//   }

//   async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
//     const response: AxiosResponse<T> = await this.client.post(url, data, config);
//     return response.data;
//   }

//   async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
//     const response: AxiosResponse<T> = await this.client.put(url, data, config);
//     return response.data;
//   }

//   async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
//     const response: AxiosResponse<T> = await this.client.patch(url, data, config);
//     return response.data;
//   }

//   async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
//     const response: AxiosResponse<T> = await this.client.delete(url, config);
//     return response.data;
//   }

//   // Upload file
//   async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
//     const response: AxiosResponse<T> = await this.client.post(url, formData, {
//       ...config,
//       headers: {
//         'Content-Type': 'multipart/form-data',
//         ...config?.headers,
//       },
//     });
//     return response.data;
//   }

//   // Download file
//   async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
//     const response: AxiosResponse<Blob> = await this.client.get(url, {
//       ...config,
//       responseType: 'blob',
//     });
//     return response.data;
//   }
// }

// export const apiClient = new ApiClient();



import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { config } from '@/config/env';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.baseURL = config.API_BASE_URL;
    console.log("ApiClient baseURL:", this.baseURL);
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (conf) => {
        const token = await useAuthStore.getState().getToken();
        if (token) {
          conf.headers.Authorization = `Bearer ${token}`;
        }
        return conf;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {

        const originalRequest = error.config;

        // Handle network errors
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          return Promise.reject(new Error('Network connection failed. Please check your internet connection.'));
        }

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, add to queue
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch(err => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Use the refresh token method from your auth store
            const refreshResult = await useAuthStore.getState().refreshAuthToken();

            // If refresh was successful (returns true)
            if (refreshResult === true) {
              const newToken = await useAuthStore.getState().getToken();
              if (newToken) {
                // Reset refreshing flag
                this.isRefreshing = false;
                
                // Update the authorization header
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Process queued requests with new token
                this.processQueue(null, newToken);

                return this.client(originalRequest);
              } else {
                // No token available after successful refresh
                this.isRefreshing = false;
                this.processQueue(new Error('No token available after refresh'));
                await useAuthStore.getState().logout();
                return Promise.reject(new Error('Authentication failed'));
              }
            } else {
              // If we reach here, token refresh failed
              this.processQueue(new Error('Token refresh failed'));
              await useAuthStore.getState().logout();
              return Promise.reject(new Error('Authentication failed'));
            }

          } catch (refreshError: any) {

            // Process queued requests with error
            this.processQueue(refreshError, null);

            // Check for specific refresh token errors
            const errorMessage = refreshError.response?.data?.message || refreshError.message;
            if (errorMessage?.includes('Refresh token expired') ||
              errorMessage?.includes('Invalid refresh token') ||
              errorMessage?.includes('refresh token') ||
              refreshError.response?.status === 401) {
              await useAuthStore.getState().logout();
              return Promise.reject(new Error('Session expired. Please login again.'));
            }

            // For other errors, just reject
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        if (error.response?.status === 403) {
          return Promise.reject(new Error('You do not have permission to perform this action.'));
        }

        if (error.response?.status >= 500) {
          return Promise.reject(new Error('Server error. Please try again later.'));
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, conf?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, conf);
    return response.data;
  }

  async post<T>(url: string, data?: any, conf?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, conf);
    return response.data;
  }

  async put<T>(url: string, data?: any, conf?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, conf);
    return response.data;
  }

  async patch<T>(url: string, data?: any, conf?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, conf);
    return response.data;
  }

  async delete<T>(url: string, conf?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, conf);
    return response.data;
  }

  // Upload file
  async upload<T>(url: string, formData: FormData, conf?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...conf?.headers,
      },
    });
    return response.data;
  }

  // Download file
  async download(url: string, conf?: AxiosRequestConfig): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.get(url, {
      ...conf,
      responseType: 'blob',
    });
    return response.data;
  }

  // Method to manually clear the queue (useful on logout)
  clearQueue() {
    this.failedQueue = [];
    this.isRefreshing = false;
  }
}

export const apiClient = new ApiClient();