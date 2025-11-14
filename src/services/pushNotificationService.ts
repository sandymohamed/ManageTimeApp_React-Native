import PushNotification, { ReceivedNotification } from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import { apiClient } from './apiClient';
import { logger } from '@/utils/logger';
import { useAuthStore } from '@/store/authStore';
import { ApiResponse } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '@/utils/deepLinking';

export interface PushTokenResponse {
  token: string;
  platform: 'android' | 'ios';
  registeredAt: Date;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;
  private currentToken: string | null = null;
  private static TOKEN_KEY = 'push:lastToken';

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
      const configureOptions: any = {
        senderID: '93362201097',
        // Called when a notification is received (foreground)
        onNotification: (notification: Omit<ReceivedNotification, 'userInfo'>) => {
          logger.info('📬 Push notification received:', {
            title: (notification as any).title,
            message: (notification as any).message,
            data: (notification as any).data,
            userInfo: (notification as any).userInfo,
            foreground: (notification as any).foreground,
          });
          
          const payload = (notification as any).data || (notification as any).userInfo || {};
          const notificationType = payload.type || payload.notificationType;
          const isLocalNotification = payload?.__local === 'true';
          const isForeground = (notification as any).foreground === true;
          
          // Log notification type for debugging
          if (notificationType) {
            logger.info(`📬 Notification type: ${notificationType}`, payload);
          }

          // Show a banner when the app is in the foreground.
          if (Platform.OS === 'android' && isForeground && !isLocalNotification) {
            try {
              PushNotification.localNotification({
                title:
                  (notification as any).title ||
                  payload.title ||
                  'Manage Time',
                message:
                  (notification as any).message ||
                  payload.body ||
                  payload.alert ||
                  'You have a new notification',
                channelId: 'default-channel-id',
                userInfo: {
                  ...payload,
                  __local: 'true',
                },
                playSound: true,
                soundName: 'default',
              });
            } catch (error) {
              logger.error('Failed to display foreground notification:', error);
            }
          }
          
          // Handle alarm notifications
          if (notificationType === 'alarm') {
            this.handleAlarmNotification(notification as any);
          }
          
          // Handle timer notifications
          if (notificationType === 'timer') {
            this.handleTimerNotification(notification as any);
          }
          
          // Handle notification tap
          if ((notification as any).userInteraction) {
            this.handleNotificationTap(notification as any);
          }
        },

        // Called when token is registered
        onRegister: async (token: { token: string }) => {
          logger.info('Push token registered:', token.token);
          this.currentToken = token.token;
          
          // Register token with backend
          try {
            const lastToken = await AsyncStorage.getItem(PushNotificationService.TOKEN_KEY);
            if (lastToken !== token.token) {
              await this.sendTokenToBackend(token.token);
              await AsyncStorage.setItem(PushNotificationService.TOKEN_KEY, token.token);
            } else {
              logger.info('Push token unchanged, skipping backend registration');
            }
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
      };

      PushNotification.configure(configureOptions);

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
        const requestPushToken = () => {
          try {
            PushNotification.requestPermissions();
          } catch (error) {
            logger.error('Failed to request push token permissions:', error);
          }
        };

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

          requestPushToken();
        } else {
          requestPushToken();
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

      let tokenToSend = this.currentToken;

      if (!tokenToSend) {
        // Attempt to reuse previously stored token if available
        const storedToken = await AsyncStorage.getItem(PushNotificationService.TOKEN_KEY);
        if (storedToken) {
          logger.info('Using stored push token from AsyncStorage');
          this.currentToken = storedToken;
          tokenToSend = storedToken;
        }
      }

      if (tokenToSend) {
        await this.sendTokenToBackend(tokenToSend);
      } else {
        logger.warn('No push token available to register with backend');
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
   * Handle alarm notification
   */
  private handleAlarmNotification(notification: any): void {
    try {
      const data = notification.data || notification.userInfo || {};
      const alarmId = data.alarmId;
      logger.info('Alarm notification triggered:', alarmId);
      
  
      
      if (notification.id) {
        PushNotification.cancelLocalNotifications({ id: notification.id.toString() });
      }
    } catch (error) {
      logger.error('Failed to handle alarm notification:', error);
    }
  }

  /**
   * Handle timer notification
   */
  private handleTimerNotification(notification: any): void {
    try {
      const data = notification.data || notification.userInfo || {};
      const timerId = data.timerId;
      logger.info('Timer notification triggered:', timerId);
      
      // Trigger timer completion - will be handled by AlarmsScreen
    } catch (error) {
      logger.error('Failed to handle timer notification:', error);
    }
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(notification: any): void {
    try {
      const data = notification.data || notification.userInfo || {};
      logger.info('Notification tapped:', data);
      if (!data) return;

      const type = (data.type || data.notificationType || '').toString();
      // Common IDs possibly present in payload
      const taskId = data.taskId || data.targetId;
      const goalId = data.goalId || data.targetId;
      const projectId = data.projectId || data.targetId;

      // Map known backend types to app routes
      switch (type) {
        case 'PROJECT_INVITATION':
          navigate('PendingInvitations');
          break;
        case 'TASK_ASSIGNMENT':
        case 'TASK_COMMENT':
        case 'TASK_REMINDER':
        case 'DUE_DATE_REMINDER':
          if (taskId) {
            navigate('TaskDetail', { taskId: String(taskId) });
          } else {
            navigate('Tasks');
          }
          break;
        case 'GOAL_REMINDER':
          if (goalId) {
            navigate('GoalDetail', { goalId: String(goalId) });
          } else {
            navigate('Goals');
          }
          break;
        case 'ALARM_TRIGGER':
          navigate('Alarms');
          break;
        case 'ROUTINE_REMINDER':
          // Extract routineId or taskId from targetId (format: routine_task_${taskId})
          const routineTaskId = data.targetId;
          if (routineTaskId && routineTaskId.startsWith('routine_task_')) {
            const extractedTaskId = routineTaskId.replace('routine_task_', '');
            logger.info(`📬 Routine reminder for task: ${extractedTaskId}`);
          }
          // Route to routines screen
          navigate('Routines');
          break;
        default:
          // Fallbacks: try project detail if projectId exists, otherwise dashboard
          if (projectId) {
            navigate('ProjectDetail', { projectId: String(projectId) });
          } else {
            navigate('MainTabs');
          }
      }
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
        resolve(granted || false);
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
        userInfo: {
          type: 'push',
          ...(data || {}),
        },
        channelId: Platform.OS === 'android' ? 'default-channel-id' : undefined,
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

