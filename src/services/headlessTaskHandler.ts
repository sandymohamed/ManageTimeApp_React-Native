import PushNotification, { ReceivedNotification } from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import Sound from 'react-native-sound';
import { logger } from '@/utils/logger';

export class HeadlessTaskHandler {
  private static instance: HeadlessTaskHandler;
  private sound: Sound | null = null;

  static getInstance(): HeadlessTaskHandler {
    if (!HeadlessTaskHandler.instance) {
      HeadlessTaskHandler.instance = new HeadlessTaskHandler();
    }
    return HeadlessTaskHandler.instance;
  }

  /**
   * Initialize headless task handler
   * This runs even when the app is closed
   * Note: registerHeadlessTask may not exist in all versions of react-native-push-notification
   */
  initialize(): void {
    try {
      // Register headless task for Android
      if (Platform.OS === 'android') {
        const pushNotification = PushNotification as any;
        
        // Check if registerHeadlessTask method exists
        if (typeof pushNotification.registerHeadlessTask === 'function') {
          pushNotification.registerHeadlessTask(
            'ALARM_NOTIFICATION_TASK',
            async (notification: any) => {
              logger.info('Headless task received notification:', notification);
              await this.handleHeadlessNotification(notification);
            }
          );
          
          logger.info('Headless task handler initialized for Android');
        } else {
          logger.warn('⚠️ registerHeadlessTask not available in react-native-push-notification, headless tasks disabled');
          logger.info('Notifications will still work via push notification system');
        }
      }
    } catch (error) {
      logger.error('Failed to initialize headless task handler:', error);
      // Don't throw - app should continue to work without headless tasks
    }
  }

  /**
   * Handle notification when app is closed (headless task)
   */
  private async handleHeadlessNotification(notification: any): Promise<void> {
    try {
      const { data, userInfo } = notification;
      const payload = data || userInfo || {};

      const notificationType = payload.type || payload.notificationType;
      const alarmId = payload.alarmId;
      const timerId = payload.timerId;

      logger.info('Processing headless notification:', {
        type: notificationType,
        alarmId,
        timerId,
      });

      // Handle alarm types AND task/routine reminders as alarms (so they ring)
      if (notificationType === 'ALARM_TRIGGER' || 
          notificationType === 'ALARM_HEADLESS' || 
          notificationType === 'ALARM_IMMEDIATE' ||
          notificationType === 'TASK_REMINDER' ||
          notificationType === 'DUE_DATE_REMINDER' ||
          notificationType === 'ROUTINE_REMINDER') {
        // Get alarm ID from various sources (for task/routine reminders, use targetId)
        const alarmIdToUse = alarmId || payload.targetId || payload.taskId || payload.routineId;
        
        // Store alarm/reminder ID for when app opens
        if (alarmIdToUse) {
          await AsyncStorage.setItem('pending_alarm_id', alarmIdToUse);
          logger.info('Stored pending alarm ID:', alarmIdToUse);
        }

        // Note: Native alarms automatically ring via AlarmPlayerService when AlarmManager fires
        // If the alarm should ring immediately (time has passed), the native system will handle it
        // Otherwise, it's already scheduled to ring at the correct time
        logger.info('✅ Alarm is scheduled with native Android AlarmManager - will ring automatically:', alarmIdToUse);
        
        // Fallback: If alarm time has passed and native system hasn't fired yet, show notification
        // (This should rarely happen as native alarms are scheduled correctly)
        try {
          PushNotification.localNotification({
            channelId: 'alarm-channel-v2',
            title: `⏰ ${payload.title || 'Alarm'}`,
            message: payload.body || payload.message || 'Time to wake up!',
            playSound: true,
            soundName: 'alarm', // References alarm.mp3 in android/app/src/main/res/raw/alarm.mp3
            vibrate: true,
            vibration: [0, 1000, 500, 1000, 500, 1000] as any, // TypeScript types don't support arrays, but Android does
            priority: 'max',
            importance: 'max' as any, // MAX importance
            allowWhileIdle: true,
            ongoing: true,
            autoCancel: false,
            userInfo: {
              alarmId: alarmIdToUse,
              type: notificationType || 'ALARM_HEADLESS',
              title: payload.title,
            },
          });

          logger.info('Headless alarm notification triggered (fallback):', alarmIdToUse);
        } catch (notifError) {
          logger.error('❌ Failed to show fallback notification:', notifError);
        }
      } else if (notificationType === 'TIMER_COMPLETION' || notificationType === 'TIMER_IMMEDIATE') {
        // Store timer ID for when app opens
        if (timerId) {
          await AsyncStorage.setItem('pending_timer_id', timerId);
          logger.info('Stored pending timer ID:', timerId);
        }

        // Trigger immediate notification with sound/vibration
        PushNotification.localNotification({
          channelId: 'timer-channel-v2',
          title: `⏱️ ${payload.title || 'Timer'}`,
          message: 'Timer finished!',
          playSound: true,
          soundName: 'alarm', // References alarm.mp3 in android/app/src/main/res/raw/alarm.mp3
          vibrate: true,
          vibration: [0, 1000, 500, 1000] as any, // TypeScript types don't support arrays, but Android does
          priority: 'high',
          importance: 'high' as any, // HIGH importance
          allowWhileIdle: true,
          ongoing: true,
          autoCancel: false,
          userInfo: {
            timerId,
            type: 'TIMER_HEADLESS',
            title: payload.title,
          },
        });

        logger.info('Headless timer notification triggered:', timerId);
      }
    } catch (error) {
      logger.error('Error handling headless notification:', error);
    }
  }

  /**
   * Handle notification received (works in foreground and background)
   */
  async handleNotification(notification: ReceivedNotification): Promise<void> {
    try {
      const { userInfo, data } = notification;
      const info = userInfo || data || {};

      if (!info || Object.keys(info).length === 0) {
        return;
      }

      const { type, alarmId, timerId, notificationType } = info;
      const finalType = type || notificationType;

      logger.info('Handling notification:', {
        type: finalType,
        alarmId,
        timerId,
        appState: AppState.currentState,
      });

      if (finalType === 'ALARM_TRIGGER' || finalType === 'ALARM_HEADLESS' || finalType === 'ALARM_IMMEDIATE') {
        // Store for app to handle when it opens
        if (alarmId) {
          await AsyncStorage.setItem('pending_alarm_id', alarmId);
        }

        // If app is closed or in background, notification system handles sound/vibration
        // No need to play sound directly here as notification will handle it
        logger.info('Alarm notification stored:', alarmId);
      } else if (finalType === 'TIMER_COMPLETION' || finalType === 'TIMER_IMMEDIATE') {
        // Store timer ID
        if (timerId) {
          await AsyncStorage.setItem('pending_timer_id', timerId);
        }

        logger.info('Timer notification stored:', timerId);
      }
    } catch (error) {
      logger.error('Error handling notification:', error);
    }
  }

  /**
   * Play alarm sound (for compatibility)
   * Note: In most cases, notification system handles sound
   */
  playAlarmSound(): void {
    try {
      Sound.setCategory('Playback', true);
      this.sound = new Sound(
        'alarm.mp3',
        Sound.MAIN_BUNDLE,
        (error) => {
          if (error) {
            logger.warn('Failed to load sound:', error);
            return;
          }
          if (this.sound) {
            this.sound.setNumberOfLoops(-1);
            this.sound.setVolume(1.0);
            this.sound.play(() => {
              logger.info('Sound playback finished');
            });
          }
        }
      );
    } catch (error) {
      logger.error('Error playing sound:', error);
    }
  }

  /**
   * Stop alarm sound
   */
  stopSound(): void {
    try {
      if (this.sound) {
        this.sound.stop();
        this.sound.release();
        this.sound = null;
      }
    } catch (error) {
      logger.error('Error stopping sound:', error);
    }
  }
}

export const headlessTaskHandler = HeadlessTaskHandler.getInstance();

