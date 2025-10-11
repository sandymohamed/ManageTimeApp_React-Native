// import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Keychain from 'react-native-keychain';
// import { authService } from '@/services/authService';
// import { User, LoginCredentials, RegisterCredentials, ChangePasswordData } from '@/types/user';
// import { logger } from '@/utils/logger';


// interface AuthState {
//   user: User | null;
//   isAuthenticated: boolean;
//   isInitialized: boolean;
//   isLoading: boolean;
//   error: string | null;
// }

// interface AuthActions {
//   login: (credentials: LoginCredentials) => Promise<void>;
//   register: (credentials: RegisterCredentials) => Promise<void>;
//   logout: () => Promise<void>;
//   refreshAuthToken: () => Promise<void>;
//   initializeAuth: () => Promise<void>;
//   clearError: () => void;
//   setLoading: (loading: boolean) => void;
//   changePassword: (data: ChangePasswordData) => Promise<void>;
//   updateProfile: (data: Partial<User>) => Promise<void>;
//   getToken: () => Promise<string | null>;
//   getRefreshToken: () => Promise<string | null>;
// }

// type AuthStore = AuthState & AuthActions;

// export const useAuthStore = create<AuthStore>()(
//   persist(
//     (set, get) => ({
//       // State
//       user: null,
//       isAuthenticated: false,
//       isInitialized: false,
//       isLoading: false,
//       error: null,

//       // Actions

//       // Token getters

//       getToken: async (): Promise<string | null> => {
//         try {
//           const credentials = await Keychain.getGenericPassword();
//           if (credentials) {
//             const tokens = JSON.parse(credentials.password);
//             return tokens.token || null;
//           }
//           return null;
//         } catch (error: any) {
//           logger.error('Error getting token:', error);
//           return null;
//         }
//       },

//       getRefreshToken: async(): Promise<string | null> => {
//         try {
//           const credentials = await Keychain.getGenericPassword();
//           if (credentials) {
//             const tokens = JSON.parse(credentials.password);
//             return tokens.refreshToken || null;
//           }
//           return null;
//         } catch (error: any) {
//           logger.error('Error getting refresh token:', error);
//           return null;
//         }
//       },
//       login: async (credentials: LoginCredentials) => {
//         try {
//           set({ isLoading: true, error: null });
          
//           const response = await authService.login(credentials);
//           const { user, token, refreshToken } = response;

//           // Store tokens securely in Keychain ONLY
//           await Keychain.setGenericPassword('auth_tokens', JSON.stringify({
//             token,
//             refreshToken,
//           }));

//           set({
//             user,
//             isAuthenticated: true,
//             isLoading: false,
//             error: null,
//           });

//           logger.info('Login successful, tokens stored');
//         } catch (error: any) {
//           logger.error('Login error:', error);
//           set({
//             error: error.message || 'Login failed',
//             isLoading: false,
//           });
//           throw error;
//         }
//       },

//       register: async (credentials: RegisterCredentials) => {
//         try {
//           set({ isLoading: true, error: null });

//           const response = await authService.register(credentials);
//           const { user, token, refreshToken } = response;

//           // Store tokens securely
//           await Keychain.setGenericPassword('auth_tokens', JSON.stringify({
//             token,
//             refreshToken,
//           }));

//           set({
//             user,
//             isAuthenticated: true,
//             isLoading: false,
//             error: null,
//           });
//         } catch (error: any) {
//           logger.error('Registration error:', error);
//           set({
//             error: error.message || 'Registration failed',
//             isLoading: false,
//           });
//           throw error;
//         }
//       },

//       logout: async () => {
//         try {
//           set({ isLoading: true });

//           // Get refresh token before clearing
//           const refreshToken = await get().getRefreshToken();
//           if (refreshToken) {
//             await authService.logout();
//           }

//           // Clear secure storage
//           await Keychain.resetGenericPassword();

//           set({
//             user: null,
//             isAuthenticated: false,
//             isLoading: false,
//             error: null,
//           });
//         } catch (error: any) {
//           logger.error('Logout error:', error);
//           // Still clear local state even if API call fails
//           await Keychain.resetGenericPassword();
//           set({
//             user: null,
//             isAuthenticated: false,
//             isLoading: false,
//           });
//         }
//       },

//       refreshAuthToken: async () => {
//         try {
//           const refreshToken = await get().getRefreshToken();
//           if (!refreshToken) {
//             throw new Error('No refresh token available');
//           }

//           const response = await authService.refreshToken(refreshToken);
//           const { token, refreshToken: newRefreshToken } = response;

//           // Update secure storage
//           await Keychain.setGenericPassword('auth_tokens', JSON.stringify({
//             token,
//             refreshToken: newRefreshToken,
//           }));

//           logger.info('Token refreshed successfully');
//         } catch (error: any) {
//           logger.error('Token refresh failed:', error);
//           // If refresh fails, logout user
//           await get().logout();
//           throw error;
//         }
//       },

//       initializeAuth: async () => {
//         try {
//           set({ isLoading: true });

//           // Try to get stored tokens from Keychain
//           const credentials = await Keychain.getGenericPassword();

//           if (credentials && credentials.password) {
//             const { token, refreshToken } = JSON.parse(credentials.password);

//             if (token) {
//               // Verify token is still valid
//               try {
//                 const user = await authService.getCurrentUser(token);
//                 set({
//                   user,
//                   isAuthenticated: true,
//                   isInitialized: true,
//                   isLoading: false,
//                 });
//                 logger.info('Auth initialized with valid token');
//                 return;
//               } catch (error) {
//                 // Token is invalid, try to refresh
//                 try {
//                   await get().refreshAuthToken();
//                   const newToken = await get().getToken();
//                   if (newToken) {
//                     const user = await authService.getCurrentUser(newToken);
//                     set({
//                       user,
//                       isAuthenticated: true,
//                       isInitialized: true,
//                       isLoading: false,
//                     });
//                     logger.info('Auth initialized with refreshed token');
//                     return;
//                   }
//                 } catch (refreshError) {
//                   logger.error('Token refresh during init failed:', refreshError);
//                 }
//               }
//             }
//           }

//           // No valid tokens found
//           await Keychain.resetGenericPassword();
//           set({
//             isInitialized: true,
//             isLoading: false,
//             isAuthenticated: false,
//           });
//           logger.info('Auth initialized - no valid tokens');

//         } catch (error: any) {
//           logger.error('Auth initialization failed:', error);
//           set({
//             isInitialized: true,
//             isLoading: false,
//             error: error.message,
//           });
//         }
//       },

//       changePassword: async (data: ChangePasswordData) => {
//         try {
//           set({ isLoading: true, error: null });
//           await authService.changePassword(data);
//           set({ isLoading: false, error: null });
//         } catch (error: any) {
//           logger.error('Change password error:', error);
//           set({
//             error: error.message || 'Password change failed',
//             isLoading: false,
//           });
//           throw error;
//         }
//       },

//       updateProfile: async (data: Partial<User>) => {
//         try {
//           set({ isLoading: true, error: null });
//           const updatedUser = await authService.updateProfile(data);
//           set({ user: updatedUser, isLoading: false, error: null });
//         } catch (error: any) {
//           logger.error('Update profile error:', error);
//           set({
//             error: error.message || 'Profile update failed',
//             isLoading: false,
//           });
//           throw error;
//         }
//       },

//       clearError: () => set({ error: null }),
//       setLoading: (loading: boolean) => set({ isLoading: loading }),
//     }),
//     {
//       name: 'auth-storage',
//       storage: createJSONStorage(() => AsyncStorage),
//       // Only persist non-sensitive data
//       partialize: (state) => ({
//         user: state.user,
//         isAuthenticated: state.isAuthenticated,
//         isInitialized: state.isInitialized,
//       }),
//     }
//   )
// );


// store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';
import { tokenService } from '@/services/tokenService';
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

      // Token getters
      getToken: async (): Promise<string | null> => {
        const tokens = await tokenService.getTokensWithRetry();
        return tokens?.token || null;
      },

      getRefreshToken: async (): Promise<string | null> => {
        const tokens = await tokenService.getTokensWithRetry();
        return tokens?.refreshToken || null;
      },

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          console.log('🚀 Starting login process...');

          // Test connection first
          try {
            await authService.testConnection();
          } catch (connectionError) {
            console.log('⚠️ Connection test failed, but proceeding with login...');
          }

          const response = await authService.login(credentials);
          const { user, token, refreshToken } = response;

          console.log('✅ Login successful, storing tokens...');
          
          // Store tokens using our service
          const storageSuccess = await tokenService.storeTokens({
            token,
            refreshToken,
          });

          if (!storageSuccess) {
            throw new Error('Failed to store authentication tokens');
          }

          // Add a small delay to ensure tokens are properly stored
          console.log('⏳ Waiting for token storage to complete...');
          await new Promise(resolve => setTimeout(resolve, 200));

          // Verify tokens were stored correctly
          const storedTokens = await tokenService.getTokensWithRetry();
          if (!storedTokens) {
            throw new Error('Tokens were not stored correctly');
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('🎉 Login complete, user authenticated');
          
          // Debug: Check if tokens are actually stored
          await tokenService.debugTokenStorage();

        } catch (error: any) {
          console.log('💥 Login error:', error);
          
          // Handle specific error types
          let errorMessage = 'Login failed';
          if (error.message?.includes('Network')) {
            errorMessage = 'Network connection failed. Please check your internet connection and try again.';
          } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.message?.includes('timeout')) {
            errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (error.message) {
            errorMessage = error.message;
          }

          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.register(credentials);
          const { user, token, refreshToken } = response;

          // Store tokens
          await tokenService.storeTokens({
            token,
            refreshToken,
          });

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
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

          // Get refresh token before clearing
          const refreshToken = await get().getRefreshToken();
          if (refreshToken) {
            await authService.logout();
          }

          // Clear tokens
          await tokenService.clearTokens();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.log('Logout error:', error);
          // Still clear local state
          await tokenService.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      refreshAuthToken: async () => {
        try {
          console.log('🔄 Refreshing auth token...');
          
          const refreshToken = await get().getRefreshToken();
          console.log('Refresh token available:', !!refreshToken);
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authService.refreshToken(refreshToken);
          const { token, refreshToken: newRefreshToken } = response;

          // Update tokens
          await tokenService.storeTokens({
            token,
            refreshToken: newRefreshToken,
          });

          console.log('✅ Token refreshed successfully');
        } catch (error: any) {
          console.log('❌ Token refresh failed:', error);
          
          // If refresh fails due to invalid/expired token, logout user immediately
          if (error.message?.includes('Invalid refresh token') || 
              error.message?.includes('Refresh token expired') ||
              error.message?.includes('401') ||
              error.message?.includes('Unauthorized')) {
            console.log('🚪 Invalid/expired refresh token detected, logging out user...');
            await get().logout();
            return; // Don't throw error, just logout
          }
          
          // For other errors, logout and throw
          await get().logout();
          throw error;
        }
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true });
          console.log('🔧 Initializing auth...');

          // Check if we have tokens
          const tokens = await tokenService.getTokensWithRetry();
          console.log('Tokens found during init:', tokens);

          if (tokens?.token) {
            try {
              // Verify token is valid
              console.log('🔍 Verifying token with backend...');
              const user = await authService.getCurrentUser(tokens.token);
              set({
                user,
                isAuthenticated: true,
                isInitialized: true,
                isLoading: false,
                error: null,
              });
              console.log('✅ Auth initialized with valid token');
              return;
            } catch (error) {
              console.log('❌ Token invalid, trying refresh...', error);
              try {
                await get().refreshAuthToken();
                const newTokens = await tokenService.getTokensWithRetry();
                if (newTokens?.token) {
                  const user = await authService.getCurrentUser(newTokens.token);
                  set({
                    user,
                    isAuthenticated: true,
                    isInitialized: true,
                    isLoading: false,
                    error: null,
                  });
                  console.log('✅ Auth initialized with refreshed token');
                  return;
                }
              } catch (refreshError) {
                console.log('❌ Token refresh failed during init:', refreshError);
                // Only clear tokens if it's a network error, not an auth error
                if (typeof refreshError === 'object' && refreshError !== null && 'message' in refreshError && typeof (refreshError as any).message === 'string' && (refreshError as any).message.includes('Network')) {
                  console.log('🌐 Network error during refresh, keeping tokens for retry');
                } else {
                  await tokenService.clearTokens();
                }
              }
            }
          }

          // No valid tokens or verification failed
          set({
            isInitialized: true,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
          console.log('🔓 Auth initialized - no valid tokens');

        } catch (error: any) {
          console.log('💥 Auth initialization failed:', error);
          set({
            isInitialized: true,
            isLoading: false,
            isAuthenticated: false,
            error: error.message,
          });
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
    }
  )
);