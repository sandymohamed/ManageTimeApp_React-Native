import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { authService } from '@/services/authService';
import { User, LoginCredentials, RegisterCredentials, ChangePasswordData } from '@/types/user';
import { logger } from '@/utils/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  getToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
      error: null,

      // Actions

      // Token getters
      getToken: async (): Promise<string | null> => {
        try {
          const credentials = await Keychain.getGenericPassword();
          if (credentials) {
            const tokens = JSON.parse(credentials.password);
            return tokens.token || null;
          }
          return null;
        } catch (error: any) {
          logger.error('Error getting token:', error);
          return null;
        }
      },

      getRefreshToken: async(): Promise<string | null> => {
        try {
          const credentials = await Keychain.getGenericPassword();
          if (credentials) {
            const tokens = JSON.parse(credentials.password);
            return tokens.refreshToken || null;
          }
          return null;
        } catch (error: any) {
          logger.error('Error getting refresh token:', error);
          return null;
        }
      },

      login: async (credentials: LoginCredentials) => {
        try {
          console.log("**************** login try get", get());
          set({ isLoading: true, error: null });

          const response = await authService.login(credentials);
          const { user, token, refreshToken } = response;

          // Store tokens securely in Keychain ONLY
          await Keychain.setGenericPassword('auth_tokens', JSON.stringify({
            token,
            refreshToken,
          }));

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          logger.error('Login error:', error);
          set({
            error: error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          console.log("register try", credentials);
          const response = await authService.register(credentials);
          console.log("register try response", response);
          
          const { user, token, refreshToken } = response;

          console.log("register try user", user);
          console.log("register try token", token);
          console.log("register try refreshToken", refreshToken);

          // Store tokens securely in Keychain ONLY
          await Keychain.setGenericPassword('auth_tokens', JSON.stringify({
            token,
            refreshToken,
          }));

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          logger.info('User registered successfully', { userId: user.id });
        } catch (error: any) {
          logger.error('Registration error:', error);
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          // Clear tokens from Keychain
          await Keychain.resetGenericPassword();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          logger.info('User logged out successfully');
        } catch (error: any) {
          logger.error('Logout error:', error);
          // Even if logout fails, clear local state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshAuthToken: async () => {
        try {
          const refreshToken = await get().getRefreshToken();

          console.log("refreshAuthToken refreshToken", refreshToken);

          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authService.refreshToken(refreshToken);
          console.log("refreshAuthToken response", response);
          const { token, refreshToken: newRefreshToken } = response;

          console.log("refreshAuthToken token", token);
          console.log("refreshAuthToken newRefreshToken", newRefreshToken);


          // Update tokens in Keychain
          await Keychain.setGenericPassword('auth_tokens', JSON.stringify({
            token,
            refreshToken: newRefreshToken,
          }));

          logger.info('Token refreshed successfully');
        } catch (error: any) {
          logger.error('Token refresh error:', error);
          // If refresh fails, logout user
          await get().logout();
          throw error;
        }
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true });

          const token = await get().getToken();
          if (!token) {
            set({ isInitialized: true, isLoading: false });
            return;
          }

          // Verify token with backend
          const user = await authService.getCurrentUser(token);
          console.log("initializeAuth user", user);
          set({
            user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null,
          });

          logger.info('Auth initialized successfully', { userId: user.id });
        } catch (error: any) {
          logger.error('Auth initialization error:', error);
          // Clear invalid tokens
          await Keychain.resetGenericPassword();
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: null,
          });
        }
      },

      changePassword: async (data: ChangePasswordData) => {
        try {
          set({ isLoading: true, error: null });
          
          await authService.changePassword(data);
          
          set({ isLoading: false });
          logger.info('Password changed successfully');
        } catch (error: any) {
          logger.error('Change password error:', error);
          set({
            error: error.message || 'Failed to change password',
            isLoading: false,
          });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          
          const updatedUser = await authService.updateProfile(data);
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });

          logger.info('Profile updated successfully', { userId: updatedUser.id });
        } catch (error: any) {
          logger.error('Update profile error:', error);
          set({
            error: error.message || 'Failed to update profile',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        isInitialized: state.isInitialized,
      }),
    }
  )
);