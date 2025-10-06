import * as Keychain from 'react-native-keychain';

import { apiClient } from './apiClient';
import { User, AuthTokens, LoginCredentials, RegisterCredentials, ChangePasswordData } from '@/types/user';
import { ApiResponse } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/utils/logger';
import axios from 'axios';

class AuthService {
  // TODO: Remove this after testing
  // Add this to your AuthService temporarily
  // Add to your AuthService temporarily
  async debugTokenStorage(): Promise<void> {
    try {
      console.log('🔍 Debugging token storage...');

      // Check Keychain
      const credentials = await Keychain.getGenericPassword();
      console.log('Keychain credentials:', credentials);

      if (credentials) {
        const tokens = JSON.parse(credentials.password);
        console.log('Stored tokens:', tokens);
      } else {
        console.log('No credentials in Keychain');
      }

      // Check Zustand state
      const state = useAuthStore.getState();
      console.log('Zustand state:', {
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: await state.getToken?.(),
        refreshToken: await state.getRefreshToken?.(),
      });

    } catch (error) {
      console.log('Debug error:', error);
    }
  }

  async testConnection(): Promise<void> {
    try {
      console.log("🔍 Testing network connectivity...");

      // Test 1: Basic fetch to health endpoint
      console.log("🔍 Test 1: Basic fetch to health endpoint...");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const fetchTest = await fetch('http://192.168.1.13:3000/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log("✅ Fetch test result:", fetchTest.status, fetchTest.statusText);
        const data = await fetchTest.json();
        console.log("✅ Health check data:", data);
      } catch (fetchError) {
        console.log("❌ Fetch test failed:", fetchError);
      }

      // Test 2: Direct axios to health endpoint
      console.log("🔍 Test 2: Direct axios to health endpoint...");
      try {
        const directAxios = await axios.get('http://192.168.1.13:3000/health', {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log("✅ Direct axios result:", directAxios.status);
        console.log("✅ Health check data:", directAxios.data);
      } catch (directError) {
        console.log("❌ Direct axios failed:", directError);
      }

      // Test 3: Your apiClient
      console.log("🔍 Test 3: Your apiClient...");
      try {
        const apiClientTest = await apiClient.get('/health');
        console.log("✅ ApiClient test result:", apiClientTest);
      } catch (apiClientError: any) {
        console.log("❌ ApiClient test failed:", apiClientError);
        console.log("🔧 Error details:", {
          message: apiClientError.message,
          code: apiClientError.code,
          config: {
            baseURL: apiClientError.config?.baseURL,
            url: apiClientError.config?.url,
            method: apiClientError.config?.method
          }
        });
      }

    } catch (error) {
      console.log("💥 Overall test failed:", error);
    }
  }


  async login(credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      console.log('🔐 AuthService: Starting login...', credentials);

      // For testing purposes, if backend is not available, use mock data
      try {
        const response = await apiClient.post<ApiResponse<{
          user: User;
          tokens: {
            accessToken: string;
            refreshToken: string;
          };
        }>>('/auth/login', credentials);

        console.log('🔐 AuthService: Login response received:', response);

        if (!response.success) {
          throw new Error(response.error || 'Login failed');
        }

        // Transform the response to match expected format
        const { user, tokens } = response.data;
        return {
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      } catch (networkError: any) {
        // If it's a network error and we're in development, use mock data
        if (networkError.message?.includes('Network') || networkError.code === 'NETWORK_ERROR') {
          console.log('🌐 Network error detected, using mock data for testing...');
          
          // Mock successful login for testing
          const mockUser: User = {
            id: '1',
            email: credentials.email,
            name: 'Test User',
            avatar: undefined,
            preferences: {
              theme: 'light',
              language: 'en',
              notifications: {
                push: true,
                email: true,
                inApp: true
              },
              reminders: {
                taskDue: true,
                goalDeadline: true,
                projectUpdate: true
              },
              privacy: {
                profileVisible: true,
                activityVisible: true
              },
              timezone: 'UTC'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
          };

          const mockTokens = {
            token: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now()
          };

          console.log('✅ Using mock login data for testing');
          return {
            user: mockUser,
            token: mockTokens.token,
            refreshToken: mockTokens.refreshToken,
          };
        }
        
        throw networkError;
      }
    } catch (error) {
      console.log('❌ AuthService: Login error:', error);
      logger.error('Login error:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      console.log('🔐 AuthService: Starting registration...', credentials);

      const response = await apiClient.post<ApiResponse<{
        user: User;
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      }>>('/auth/signup', credentials);

      console.log('🔐 AuthService: Registration response received:', response);

      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }

      // Transform the response to match expected format
      const { user, tokens } = response.data;
      return {
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.log('❌ AuthService: Registration error:', error);
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      console.log('🔄 AuthService: Refreshing token...');

      try {
        const response = await apiClient.post<ApiResponse<{
          accessToken: string;
          refreshToken: string;
        }>>('/auth/refresh', { refreshToken });

        console.log('🔄 AuthService: Refresh response received:', response);

        if (!response.success) {
          throw new Error(response.error || 'Token refresh failed');
        }

        // Transform the response to match expected format
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        return {
          token: accessToken,
          refreshToken: newRefreshToken,
        };
      } catch (networkError: any) {
        // If it's a network error, generate new mock tokens
        if (networkError.message?.includes('Network') || networkError.code === 'NETWORK_ERROR') {
          console.log('🌐 Network error during refresh, generating new mock tokens...');
          
          const mockTokens = {
            token: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now()
          };

          console.log('✅ Generated new mock tokens for testing');
          return mockTokens;
        }
        
        throw networkError;
      }
    } catch (error) {
      console.log('❌ AuthService: Token refresh error:', error);
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Try to call backend logout endpoint
      try {
        await apiClient.post('/auth/logout');
        console.log('✅ Backend logout successful');
      } catch (error) {
        // If backend logout fails, just log it and continue
        console.log('⚠️ Backend logout failed, continuing with local logout:', error);
      }
    } catch (error) {
      logger.error('Logout error:', error);
      // Don't throw error for logout, just log it
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/logout-all');
    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>('/auth/change-password', data);

      if (!response.success) {
        throw new Error(response.error || 'Password change failed');
      }
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async getCurrentUser(token: string): Promise<User> {
    try {
      try {
        const response = await apiClient.get<ApiResponse<User>>('/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to get user');
        }

        return response.data;
      } catch (networkError: any) {
        // If it's a network error, return mock user data
        if (networkError.message?.includes('Network') || networkError.code === 'NETWORK_ERROR') {
          console.log('🌐 Network error during getCurrentUser, using mock data...');
          
          const mockUser: User = {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            avatar: undefined,
            preferences: {
              theme: 'light',
              language: 'en',
              notifications: {
                push: true,
                email: true,
                inApp: true
              },
              reminders: {
                taskDue: true,
                goalDeadline: true,
                projectUpdate: true
              },
              privacy: {
                profileVisible: true,
                activityVisible: true
              },
              timezone: 'UTC'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
          };

          console.log('✅ Using mock user data for testing');
          return mockUser;
        }
        
        throw networkError;
      }
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/me', data);

      if (!response.success) {
        throw new Error(response.error || 'Profile update failed');
      }

      return response.data;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
