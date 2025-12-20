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
        // Called when a notification is received (foreground AND background)
        onNotification: async (notification: Omit<ReceivedNotification, 'userInfo'>) => {
          const isForeground = (notification as any).foreground === true;
          const payload = (notification as any).data || (notification as any).userInfo || {};
          const notificationType = payload.type || payload.notificationType;
          const isLocalNotification = payload?.__local === 'true';
          
          logger.info('📬 Push notification received:', {
            title: (notification as any).title,
            message: (notification as any).message,
            data: payload,
            notificationType,
            foreground: isForeground,
            appState: isForeground ? 'foreground' : 'background',
          });
          
          // Log notification type for debugging
          if (notificationType) {
            logger.info(`📬 Notification type: ${notificationType}`, payload);
          }

          // Handle alarm-related notifications (for sync, not for ringing)
          // NEW ARCHITECTURE: FCM is used for data sync only, NOT for ringing alarms
          // All alarms must be scheduled locally with Notifee triggers (which ring even when app is closed)
          if (notificationType === 'ALARM_TRIGGER' || 
              notificationType === 'alarm' ||
              notificationType === 'TASK_REMINDER' ||
              notificationType === 'DUE_DATE_REMINDER' ||
              notificationType === 'ROUTINE_REMINDER') {
            // Handle as sync notification - will re-schedule local Notifee triggers if needed
            await this.handleAlarmSyncNotification(notification as any);
            // Don't show banner - alarms are handled by Notifee triggers
            return;
          }
          
          // Handle timer notifications
          if (notificationType === 'timer') {
            await this.handleTimerNotification(notification as any);
            // Don't show banner for timers - they handle their own notification
            return;
          }

          // Show a banner when the app is in the foreground for other notifications
          if (Platform.OS === 'android' && isForeground && !isLocalNotification && notificationType !== 'ALARM_TRIGGER' && notificationType !== 'alarm' && notificationType !== 'timer') {
            try {
              const notificationTitle = (notification as any).title ||
                payload.title ||
                'Manage Time';
              
              // Ensure app name is included if not already present
              const finalTitle = notificationTitle.includes('Manage Time')
                ? notificationTitle
                : `Manage Time: ${notificationTitle}`;

              PushNotification.localNotification({
                title: finalTitle,
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
                // Add small icon for Android (using default app icon)
                // imageUrl can be added here if you have a logo URL
              });
            } catch (error) {
              logger.error('Failed to display foreground notification:', error);
            }
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
            channelName: 'Manage Time',
            channelDescription: 'Manage Time app notifications',
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
   * Handle alarm sync notification (NEW ARCHITECTURE)
   * FCM notifications are used for SYNC only, not for ringing alarms.
   * This method:
   * 1. Extracts alarm data from FCM notification
   * 2. Re-schedules alarm locally with Notifee triggers if needed (for future alarms)
   * 3. Rings alarm immediately if time has passed (missed alarm recovery)
   * 
   * Note: Primary alarm ringing is handled by Notifee trigger notifications scheduled locally
   */
  private async handleAlarmSyncNotification(notification: any): Promise<void> {
    try {
      const data = notification.data || notification.userInfo || {};
      const alarmId = data.alarmId;
      const notificationType = data.notificationType || data.type;
      
      logger.info('📬 Alarm sync notification received from backend:', { 
        alarmId, 
        notificationType,
        appState: (notification as any).foreground ? 'foreground' : 'background'
      });
      
      // For ALARM_TRIGGER, TASK_REMINDER, DUE_DATE_REMINDER, and ROUTINE_REMINDER notifications
      const isAlarmType = notificationType === 'ALARM_TRIGGER' || 
                          notificationType === 'TASK_REMINDER' ||
                          notificationType === 'DUE_DATE_REMINDER' ||
                          notificationType === 'ROUTINE_REMINDER';
      
      // Get alarm ID from various sources
      const alarmIdFromData = alarmId || data.targetId || data.taskId || data.routineId;
      
      if (isAlarmType && alarmIdFromData) {
        const alarmIdToUse = alarmIdFromData;
        const alarmTitle = data.title || notification.title || 'Alarm';
        const alarmTimeStr = data.alarmTime || data.time;
        const alarmMessage = data.body || notification.message || data.message || 'It\'s time!';
        
        logger.info(`📬 Alarm sync notification received (type: ${notificationType}):`, {
          alarmId: alarmIdToUse,
          title: alarmTitle,
          alarmTime: alarmTimeStr,
        });
        
        // NEW ARCHITECTURE: FCM is for sync only
        // 1. If alarm time is in the future, re-schedule with Notifee triggers (if not already scheduled)
        // 2. If alarm time has passed, ring immediately (missed alarm recovery)
        
        if (alarmTimeStr) {
          const alarmTime = new Date(alarmTimeStr);
          const now = new Date();
          const timeDiff = alarmTime.getTime() - now.getTime();
          
          if (timeDiff > 0) {
            // Alarm is in the future - schedule with Notifee triggers
            // This ensures it rings even when app is closed
            logger.info(`⏰ Scheduling future alarm with Notifee triggers: ${alarmIdToUse}`, {
              timeUntilAlarm: Math.floor(timeDiff / 1000) + ' seconds',
            });
            
            try {
              const { reliableAlarmService } = await import('@/services/ReliableAlarmService');
              const { Alarm } = await import('@/types/alarm');
              
              // Create alarm object for scheduling
              const alarmForScheduling: Alarm = {
                id: alarmIdToUse,
                title: alarmTitle,
                time: alarmTimeStr,
                recurrenceRule: data.recurrenceRule || 'none',
                enabled: true,
                userId: data.userId || '',
              };
              
              // Schedule with native Android AlarmManager (works even when app is closed)
              await reliableAlarmService.scheduleAlarm(alarmForScheduling);
              logger.info(`✅ Alarm scheduled with native Android AlarmManager: ${alarmIdToUse}`);
            } catch (scheduleError) {
              logger.error(`❌ Failed to schedule alarm with Notifee:`, scheduleError);
              // Store as pending so it can be handled when app opens
              AsyncStorage.setItem('pending_alarm_id', alarmIdToUse).catch(() => {});
              
              // Also store task/routine info for future reference
              if (data.targetId || data.taskId || data.routineId) {
                const taskRoutineInfo = {
                  targetId: data.targetId || data.taskId || data.routineId,
                  targetType: data.targetType || (notificationType === 'TASK_REMINDER' ? 'TASK' : notificationType === 'ROUTINE_REMINDER' ? 'ROUTINE' : null),
                  alarmId: alarmIdToUse,
                  title: alarmTitle,
                  notificationType: notificationType,
                };
                AsyncStorage.setItem('pending_task_routine_alarm', JSON.stringify(taskRoutineInfo)).catch(() => {});
              }
            }
          } else {
            // Alarm time has passed - ring immediately (missed alarm recovery)
            logger.info(`🔔 Missed alarm - ringing immediately: ${alarmIdToUse}`);
            
            // Store as pending alarm
            AsyncStorage.setItem('pending_alarm_id', alarmIdToUse).catch(() => {});
            
            // Store task/routine info if this is a task or routine reminder
            // This helps TasksScreen/RoutinesScreen show which item needs action
            if (data.targetId || data.taskId || data.routineId || notificationType === 'TASK_REMINDER' || notificationType === 'ROUTINE_REMINDER') {
              const taskRoutineInfo = {
                targetId: data.targetId || data.taskId || data.routineId,
                targetType: data.targetType || (notificationType === 'TASK_REMINDER' ? 'TASK' : notificationType === 'ROUTINE_REMINDER' ? 'ROUTINE' : null),
                alarmId: alarmIdToUse,
                title: alarmTitle,
                notificationType: notificationType,
              };
              AsyncStorage.setItem('pending_task_routine_alarm', JSON.stringify(taskRoutineInfo)).catch(() => {});
            }
            
            // Ring immediately using Notifee
            try {
              const notifee = await import('@notifee/react-native');
              const { AndroidImportance, AndroidVisibility } = await import('@notifee/react-native');
              
              await notifee.default.displayNotification({
          title: `⏰ ${alarmTitle}`,
                body: alarmMessage,
                android: {
                  channelId: 'alarm-channel-v2',
                  importance: AndroidImportance.HIGH,
                  sound: 'alarm',
                  vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
                  lights: ['#FF0000', 1000, 1000],
                  pressAction: { id: 'default', launchActivity: 'default' },
                  actions: [{ title: 'Stop', pressAction: { id: 'stop' } }],
          autoCancel: false,
                  ongoing: true,
                  visibility: AndroidVisibility.PUBLIC,
                },
          data: {
            type: 'alarm',
                  alarmId: alarmIdToUse,
            fromPush: true,
                  notificationType: notificationType,
                  ...(data.targetId && { targetId: data.targetId }),
                  ...(data.targetType && { targetType: data.targetType }),
          },
        });
        
              // Note: Native alarms automatically ring via AlarmPlayerService when AlarmManager fires
              // No need to manually trigger - the native system handles ringing automatically
              logger.info('✅ Alarm will ring automatically via native Android AlarmManager');
            } catch (notifeeError) {
              logger.error('❌ Failed to ring missed alarm:', notifeeError);
            }
          }
        } else {
          // No alarm time - store as pending for handling when app opens
          logger.info(`📝 No alarm time provided, storing as pending: ${alarmIdToUse}`);
          AsyncStorage.setItem('pending_alarm_id', alarmIdToUse).catch(() => {});
          
          // Store task/routine info
          if (data.targetId || data.taskId || data.routineId) {
            const taskRoutineInfo = {
              targetId: data.targetId || data.taskId || data.routineId,
              targetType: data.targetType || (notificationType === 'TASK_REMINDER' ? 'TASK' : notificationType === 'ROUTINE_REMINDER' ? 'ROUTINE' : null),
              alarmId: alarmIdToUse,
              title: alarmTitle,
              notificationType: notificationType,
            };
            AsyncStorage.setItem('pending_task_routine_alarm', JSON.stringify(taskRoutineInfo)).catch(() => {});
          }
        }
      }
      
      // Cancel the original notification if it has an ID
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
  private async handleTimerNotification(notification: any): Promise<void> {
    try {
      const data = notification.data || notification.userInfo || {};
      const timerId = data.timerId;
      logger.info('Timer notification triggered:', timerId);
      
      // Store timer ID so AlarmsScreen can handle completion when app opens
      if (timerId) {
        AsyncStorage.setItem('pending_timer_id', timerId);
      }
      
      // Trigger immediate notification for timer completion
      PushNotification.localNotification({
        id: `timer-${timerId}-${Date.now()}`,
        title: '⏱️ Timer Complete',
        message: data.title ? `${data.title} is complete!` : 'Timer is complete!',
        playSound: true,
        soundName: 'alarm', // References alarm.mp3 in android/app/src/main/res/raw/alarm.mp3
        vibrate: true,
        vibration: [0, 1000, 500, 1000, 500, 1000] as any, // Pattern vibration
        priority: 'max',
        importance: 5 as any, // MAX importance (5) - ensures sound and vibration
        allowWhileIdle: true,
        channelId: Platform.OS === 'android' ? 'timer-channel-v2' : undefined,
        ongoing: true, // Keep ringing until dismissed
        autoCancel: false,
        data: {
          type: 'timer',
          timerId: timerId,
          fromPush: true,
        },
        userInfo: {
          type: 'timer',
          timerId: timerId,
          fromPush: true,
        },
      });
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
          if (taskId) {
            navigate('TaskDetail', { taskId: String(taskId) });
          } else {
            navigate('Tasks');
          }
          break;
        case 'TASK_REMINDER':
        case 'DUE_DATE_REMINDER':
          // Navigate to Tasks screen so user can see which task needs action
          navigate('Tasks');
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
          // Navigate to Routines screen so user can see which routine needs action
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

