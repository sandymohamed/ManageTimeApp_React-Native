
import { apiClient } from './apiClient';
import { User, LoginCredentials, RegisterCredentials, ChangePasswordData } from '@/types/user';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

class AuthService {
 
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken: string }> {
    try {

      const response = await apiClient.post<ApiResponse<{
        user: User;
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      }>>('/auth/login', credentials);

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
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; token: string; refreshToken: string }> {
    try {

      const response = await apiClient.post<ApiResponse<{
        user: User;
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      }>>('/auth/signup', credentials);

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
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {

      const response = await apiClient.post<ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>>('/auth/refresh', { refreshToken });

      if (!response.success) {
        throw new Error(response.error || 'Token refresh failed');
      }

      // Transform the response to match expected format
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      return {
        token: accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      logger.error('Token refresh error:', error);

      // Provide more specific error messages
      if (error.message?.includes('Refresh token expired')) {
        throw new Error('Your session has expired. Please login again.');
      } else if (error.message?.includes('Invalid refresh token')) {
        throw new Error('Invalid session. Please login again.');
      } else if (error.message?.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      }

      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Try to call backend logout endpoint
      try {
        await apiClient.post('/auth/logout');
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
      const response = await apiClient.get<ApiResponse<User>>('/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get user');
      }

      return response.data;
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
