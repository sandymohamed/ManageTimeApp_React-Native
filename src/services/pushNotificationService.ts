import PushNotification, { PushNotification as PushNotificationType } from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import { apiClient } from './apiClient';
import { logger } from '@/utils/logger';
import { useAuthStore } from '@/store/authStore';
import { ApiResponse } from '@/types';

export interface PushTokenResponse {
  token: string;
  platform: 'android' | 'ios';
  registeredAt: Date;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;
  private currentToken: string | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notifications
   * Call this on app startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('Push notifications already initialized');
      return;
    }

    try {
      // Configure push notifications
      this.configurePushNotifications();

      // Request permissions
      await this.requestPermissions();

      // Register token with backend
      await this.registerToken();

      // Set up notification handlers
      this.setupNotificationHandlers();

      this.isInitialized = true;
      logger.info('Push notifications initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize push notifications:', error);
      throw error;
    }
  }

  /**
   * Configure push notification settings
   */
  private configurePushNotifications(): void {
    try {
      PushNotification.configure({
        // Called when a notification is received
        onNotification: (notification: PushNotificationType) => {
          logger.info('Notification received:', notification);
          
          // Handle notification based on type
          if (notification.userInteraction) {
            // User tapped on notification
            this.handleNotificationTap(notification);
          }
        },

        // Called when token is registered
        onRegister: async (token: { token: string }) => {
          logger.info('Push token registered:', token.token);
          this.currentToken = token.token;
          
          // Register token with backend
          try {
            await this.sendTokenToBackend(token.token);
          } catch (error) {
            logger.error('Failed to send token to backend:', error);
          }
        },

        // Called on error
        onRegistrationError: (error: Error) => {
          logger.error('Push notification registration error:', error);
        },

        // Request permissions on iOS
        requestPermissions: Platform.OS === 'ios',

        // Notification permissions
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },

        // Whether pop initial notification
        popInitialNotification: true,
      });

      // Create notification channel for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'default-channel-id',
            channelName: 'Default Channel',
            channelDescription: 'Default notification channel',
            playSound: true,
            soundName: 'default',
            importance: 4,
            vibrate: true,
          },
          (created) => logger.info(`Push notification channel created: ${created}`)
        );
      }
    } catch (error) {
      logger.error('Failed to configure push notifications:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requires explicit permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs notification permission to send you reminders and updates.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            logger.warn('Notification permission not granted');
            throw new Error('Notification permission denied');
          }
        }
      } else if (Platform.OS === 'ios') {
        // iOS permissions are requested via configure
        // Check if already granted
        PushNotification.checkPermissions((permissions) => {
          if (!permissions.alert || !permissions.badge || !permissions.sound) {
            logger.warn('iOS notification permissions not fully granted');
          }
        });
      }
    } catch (error) {
      logger.error('Failed to request notification permissions:', error);
      throw error;
    }
  }

  /**
   * Register current token with backend
   */
  private async registerToken(): Promise<void> {
    try {
      // Wait a bit for token to be available
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (this.currentToken) {
        await this.sendTokenToBackend(this.currentToken);
      }
    } catch (error) {
      logger.error('Failed to register token:', error);
    }
  }

  /**
   * Send push token to backend
   */
  async sendTokenToBackend(token: string): Promise<void> {
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        logger.warn('User not logged in, cannot register push token');
        return;
      }

      const response = await apiClient.post<ApiResponse<PushTokenResponse>>('/me/push-token', {
        token,
        platform: Platform.OS === 'android' ? 'android' : 'ios',
      });

      if (response.success) {
        logger.info('Push token registered with backend successfully');
      } else {
        logger.error('Failed to register push token:', response.error);
      }
    } catch (error) {
      logger.error('Failed to send push token to backend:', error);
      // Don't throw - token registration failure shouldn't break app
    }
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(notification: PushNotificationType): void {
    try {
      const data = notification.data;
      logger.info('Notification tapped:', data);

      // Navigate based on notification type
      // This will be handled by the navigation system
      // The data will be passed to the notification handler in App.tsx
    } catch (error) {
      logger.error('Failed to handle notification tap:', error);
    }
  }

  /**
   * Setup notification handlers
   */
  private setupNotificationHandlers(): void {
    // Set up action handlers if needed
    // PushNotification.setApplicationIconBadgeNumber(0); // Clear badge on app open
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.currentToken;
  }

  /**
   * Check if notifications are enabled
   */
  async checkPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      PushNotification.checkPermissions((permissions) => {
        const granted = permissions.alert && permissions.badge && permissions.sound;
        resolve(granted);
      });
    });
  }

  /**
   * Send local notification (for testing)
   */
  sendLocalNotification(title: string, message: string, data?: any): void {
    try {
      PushNotification.localNotification({
        title,
        message,
        data,
        channelId: 'default-channel-id',
        playSound: true,
        soundName: 'default',
      });
    } catch (error) {
      logger.error('Failed to send local notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    try {
      PushNotification.cancelAllLocalNotifications();
      PushNotification.setApplicationIconBadgeNumber(0);
    } catch (error) {
      logger.error('Failed to clear notifications:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

