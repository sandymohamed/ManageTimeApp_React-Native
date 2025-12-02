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
  refreshAuthToken: () => Promise<boolean>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  getToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  clearAllPersistedData: () => Promise<void>;
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
          set({ isLoading: true, error: null });
          
          // Get current user ID if logged in
          const currentUser = get().user;
          const newUserResponse = await authService.login(credentials);
          
          // If switching users, clear cached data
          if (currentUser && currentUser.id !== newUserResponse.user.id) {
            await get().clearAllPersistedData();
            
            // Reset all store states when switching accounts
            const { useTaskStore } = await import('./taskStore');
            const { useGoalStore } = await import('./goalStore');
            const { useProjectStore } = await import('./projectStore');
            
            useTaskStore.setState({
              tasks: [],
              filteredTasks: [],
              currentTask: null,
              isLoading: false,
              error: null,
              filter: {},
              searchQuery: '',
              sortBy: 'order',
              sortOrder: 'asc',
            });
            
            useGoalStore.setState({
              goals: [],
              filteredGoals: [],
              currentGoal: null,
              isLoading: false,
              error: null,
              searchQuery: '',
              statusFilter: undefined,
              priorityFilter: undefined,
              categoryFilter: undefined,
              sortBy: 'updatedAt',
              sortOrder: 'desc',
            });
            
            useProjectStore.setState({
              projects: [],
              filteredProjects: [],
              currentProject: null,
              isLoading: false,
              error: null,
              searchQuery: '',
              sortBy: 'updatedAt',
              sortOrder: 'desc',
              searchFilters: {},
            });
          }

          const { user, token, refreshToken } = newUserResponse;

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
          
          // Clear all persisted data from previous user before registering new account
          await get().clearAllPersistedData();
          
          // Reset all store states to clear any cached data in memory
          const { useTaskStore } = await import('./taskStore');
          const { useGoalStore } = await import('./goalStore');
          const { useProjectStore } = await import('./projectStore');
          
          // Reset task store state
          useTaskStore.setState({
            tasks: [],
            filteredTasks: [],
            currentTask: null,
            isLoading: false,
            error: null,
            filter: {},
            searchQuery: '',
            sortBy: 'order',
            sortOrder: 'asc',
          });
          
          // Reset goal store state
          useGoalStore.setState({
            goals: [],
            filteredGoals: [],
            currentGoal: null,
            isLoading: false,
            error: null,
            searchQuery: '',
            statusFilter: undefined,
            priorityFilter: undefined,
            categoryFilter: undefined,
            sortBy: 'updatedAt',
            sortOrder: 'desc',
          });
          
          // Reset project store state
          useProjectStore.setState({
            projects: [],
            filteredProjects: [],
            currentProject: null,
            isLoading: false,
            error: null,
            searchQuery: '',
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            searchFilters: {},
          });
          
          const response = await authService.register(credentials);
          
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
          // Clear tokens from Keychain
          await Keychain.resetGenericPassword();

          // Clear all persisted data from all stores
          await get().clearAllPersistedData();
          
          // Reset all store states to clear cached data in memory
          const { useTaskStore } = await import('./taskStore');
          const { useGoalStore } = await import('./goalStore');
          const { useProjectStore } = await import('./projectStore');
          
          useTaskStore.setState({
            tasks: [],
            filteredTasks: [],
            currentTask: null,
            isLoading: false,
            error: null,
            filter: {},
            searchQuery: '',
            sortBy: 'order',
            sortOrder: 'asc',
          });
          
          useGoalStore.setState({
            goals: [],
            filteredGoals: [],
            currentGoal: null,
            isLoading: false,
            error: null,
            searchQuery: '',
            statusFilter: undefined,
            priorityFilter: undefined,
            categoryFilter: undefined,
            sortBy: 'updatedAt',
            sortOrder: 'desc',
          });
          
          useProjectStore.setState({
            projects: [],
            filteredProjects: [],
            currentProject: null,
            isLoading: false,
            error: null,
            searchQuery: '',
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            searchFilters: {},
          });

          // Set state to completed logout (isInitialized stays true to avoid re-initialization)
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true, // Keep true to avoid triggering loading screen again
            isLoading: false,
            error: null,
          });

        } catch (error: any) {
          logger.error('Logout error:', error);
          // Even if logout fails, clear local state
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true, // Keep true to avoid triggering loading screen
            isLoading: false,
            error: null,
          });
        }
      },

      refreshAuthToken: async () => {
        try {
          const refreshToken = await get().getRefreshToken();

          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authService.refreshToken(refreshToken);
          const { token, refreshToken: newRefreshToken } = response;

          // Update tokens in Keychain
          await Keychain.setGenericPassword('auth_tokens', JSON.stringify({
            token,
            refreshToken: newRefreshToken,
          }));

          // Ensure user remains authenticated after token refresh
          set((state) => ({
            ...state,
            isAuthenticated: true, // Ensure authenticated state is maintained
          }));

          logger.info('Token refreshed successfully');
          
          // Return true to indicate success
          return true;
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

          // Verify token with backend with timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 5000); // 5 second timeout
          });

          const user = await Promise.race([
            authService.getCurrentUser(token),
            timeoutPromise
          ]) as any;

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

      clearAllPersistedData: async () => {
        try {
          // Clear specific persisted store data instead of all AsyncStorage
          // This is much faster and doesn't block the main thread
          const keysToRemove = [
            'auth-store',
            'task-storage',
            'goal-storage',
            'project-store',
          ];
          
          await AsyncStorage.multiRemove(keysToRemove);
          
          // Don't set state here - let the caller handle state updates
          // This prevents triggering loading screen unnecessarily
          
          logger.info('All persisted data cleared');
        } catch (error) {
          logger.error('Error clearing persisted data:', error);
          // Don't throw error, just log it
        }
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