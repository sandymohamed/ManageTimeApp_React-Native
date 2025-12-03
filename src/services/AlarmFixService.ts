import { Platform, AppState, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification, { Importance } from 'react-native-push-notification';
import Sound from 'react-native-sound';
// @ts-ignore - react-native-alarm-notification may not have TypeScript definitions
import RNAlarmNotification from 'react-native-alarm-notification';
import { logger } from '@/utils/logger';
import { Alarm } from '@/types/alarm';

export class AlarmFixService {
  private static instance: AlarmFixService;
  private sound: Sound | null = null;
  private isRinging = false;
  private vibrationInterval: NodeJS.Timeout | null = null;

  static getInstance(): AlarmFixService {
    if (!AlarmFixService.instance) {
      AlarmFixService.instance = new AlarmFixService();
    }
    return AlarmFixService.instance;
  }

  // STEP 1: Create HIGHEST priority notification channels
  async initializeChannels(): Promise<void> {
    logger.info('🔧 Initializing notification channels...');

    if (Platform.OS !== 'android') {
      logger.warn('⚠️ Notification channels only supported on Android');
      return;
    }

    try {
      // Create channel for react-native-push-notification
      PushNotification.createChannel(
        {
          channelId: 'alarm-channel-urgent',
          channelName: 'Urgent Alarms',
          channelDescription: 'Highest priority alarms - will ring even when app is closed',
          playSound: true,
          soundName: 'alarm',
          importance: Importance.MAX,
          vibrate: true,
          vibration: 1000,
        } as any,
        (created) => logger.info(`📢 Alarm channel created: ${created}`)
      );

      // Create channel for react-native-alarm-notification
      if (RNAlarmNotification && typeof RNAlarmNotification.createChannel === 'function') {
        try {
          RNAlarmNotification.createChannel({
            channelId: 'alarm_urgent_channel',
            channelName: 'Urgent Alarms',
            importance: 5, // MAX
            enableVibration: true,
            vibration: 1000,
            soundName: 'alarm',
            playSound: true,
          });
          logger.info('✅ Native alarm channel created');
        } catch (error) {
          logger.error('❌ Error creating native channel:', error);
        }
      } else {
        logger.warn('⚠️ RNAlarmNotification.createChannel not available');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize channels:', error);
    }
  }

  // STEP 2: Schedule alarm with MULTIPLE backup mechanisms
  async scheduleAlarm(alarm: Alarm): Promise<string> {
    const alarmId = alarm.id;
    const alarmTime = new Date(alarm.time);
    logger.info('📅 Scheduling alarm:', { title: alarm.title, time: alarmTime.toLocaleString() });

    try {
      // MECHANISM 1: Native Alarm (Android AlarmManager)
      await this.scheduleNativeAlarm(alarm);

      // MECHANISM 2: Local Notification (Backup)
      await this.scheduleLocalNotification(alarm);

      // MECHANISM 3: Background Task (Fallback)
      await this.scheduleBackgroundTask(alarm);

      // Store alarm for recovery
      await AsyncStorage.setItem(`alarm_${alarmId}`, JSON.stringify({
        id: alarmId,
        title: alarm.title,
        time: alarm.time,
        scheduledAt: Date.now(),
      }));

      logger.info('✅ Alarm scheduled with 3 mechanisms');
      return alarmId;
    } catch (error) {
      logger.error('❌ Failed to schedule alarm:', error);
      throw error;
    }
  }

  // Mechanism 1: Native Alarm (Works even when app is closed)
  private async scheduleNativeAlarm(alarm: Alarm): Promise<void> {
    if (!RNAlarmNotification || typeof RNAlarmNotification.scheduleAlarm !== 'function') {
      logger.warn('⚠️ Native alarm library not available');
      return;
    }

    const alarmId = this.getNotificationId(alarm.id, 1000);
    const alarmTime = new Date(alarm.time);

    // Ensure alarm time is in the future
    if (alarmTime.getTime() <= Date.now()) {
      logger.warn('⚠️ Alarm time is in the past, skipping native scheduling');
      return;
    }

    const { scheduleType, intervalValue, intervalType } = this.parseRecurrenceRule(alarm.recurrenceRule);

    const alarmDetails: any = {
      id: alarmId,
      title: `⏰ ${alarm.title}`,
      message: 'Time to wake up!',
      channel: 'alarm_urgent_channel',
      ticker: 'Alarm Notification',
      auto_cancel: false, // Don't auto-cancel so it keeps ringing
      vibrate: true,
      vibration: 1000,
      play_sound: true,
      sound_name: 'alarm',
      sound_name_alarm: 'alarm',
      has_button: true,
      button_text: 'Dismiss',
      button_text_snooze: 'Snooze',
      button_text_dismiss: 'Dismiss',
      color: 'red',
      schedule_type: scheduleType,
      interval_value: intervalValue,
      interval_type: intervalType,
      fire_date: alarmTime.getTime(),
      data: {
        alarmId: alarm.id,
        type: 'ALARM_URGENT',
        title: alarm.title,
        sound: 'alarm',
        vibration: 1000,
        priority: 'max',
        channel: 'alarm_urgent_channel',
      },
    };

    logger.info('📱 Scheduling native alarm:', {
      alarmId: alarm.id,
      notificationId: alarmId,
      fireDate: alarmTime.toISOString(),
      scheduleType,
      intervalValue,
      intervalType,
    });

    try {
      // First cancel any existing alarm with same ID
      if (typeof RNAlarmNotification.deleteAlarm === 'function') {
        RNAlarmNotification.deleteAlarm(alarmId);
      }

      // Schedule new alarm
      RNAlarmNotification.scheduleAlarm(alarmDetails);
      logger.info('✅ Native alarm scheduled');
    } catch (error) {
      logger.error('❌ Failed to schedule native alarm:', error);
    }
  }

  // Mechanism 2: Local Notification
  private async scheduleLocalNotification(alarm: Alarm): Promise<void> {
    const alarmTime = new Date(alarm.time);
    const notificationId = this.getNotificationId(alarm.id, 2000);

    // Ensure alarm time is in the future
    if (alarmTime.getTime() <= Date.now() + 1000) {
      logger.warn('⚠️ Alarm time is too soon or in the past, skipping local notification');
      return;
    }

    PushNotification.localNotificationSchedule({
      id: notificationId.toString(),
      title: `⏰ ${alarm.title}`,
      message: 'Alarm!',
      date: alarmTime,
      channelId: 'alarm-channel-urgent',
      priority: 'max',
      importance: Importance.MAX,
      allowWhileIdle: true,
      wakeup: true, // Wake up device
      playSound: true,
      soundName: 'alarm',
      vibrate: true,
      vibration: 1000,
      ongoing: true,
      autoCancel: false,
      invokeApp: false,
      userInfo: {
        alarmId: alarm.id,
        type: 'ALARM_BACKUP',
        title: alarm.title,
      },
      actions: ['Snooze', 'Dismiss'],
    } as any);

    logger.info('✅ Local notification scheduled');
  }

  // Mechanism 3: Background Task
  private async scheduleBackgroundTask(alarm: Alarm): Promise<void> {
    if (Platform.OS !== 'android') return;

    // This is a fallback mechanism - store alarm info
    await AsyncStorage.setItem(`bg_alarm_${alarm.id}`, JSON.stringify({
      alarmTime: new Date(alarm.time).getTime(),
      title: alarm.title,
    }));
  }

  // STEP 3: Handle Alarm Ringing
  async handleAlarmRing(alarmId: string, alarmTitle: string): Promise<void> {
    if (this.isRinging) {
      logger.warn('⚠️ Alarm already ringing, skipping');
      return;
    }

    logger.info('🔔 Alarm ringing:', alarmTitle);
    this.isRinging = true;

    // Store for UI to pick up
    await AsyncStorage.setItem('active_alarm_id', alarmId);

    // FORCE RINGING - Use ALL available methods

    // Method 1: Start foreground service
    this.startForegroundService(alarmTitle);

    // Method 2: Play sound directly
    this.playAlarmSound();

    // Method 3: Vibrate
    this.startVibration();

    // Method 4: Show persistent notification
    this.showPersistentNotification(alarmTitle);
  }

  // Play sound with maximum volume
  private playAlarmSound(): void {
    try {
      logger.info('🔊 Playing alarm sound...');

      // Stop any existing sound
      if (this.sound) {
        this.sound.stop();
        this.sound.release();
        this.sound = null;
      }

      // Set category for playback in silent mode
      Sound.setCategory('Playback', true);

      // Load and play alarm sound
      this.sound = new Sound(
        'alarm.mp3',
        Sound.MAIN_BUNDLE,
        (error) => {
          if (error) {
            logger.error('Failed to load sound:', error);
            // Try system default
            this.playDefaultSound();
            return;
          }

          if (!this.sound) return;

          // Configure sound
          this.sound.setNumberOfLoops(-1); // Loop forever
          this.sound.setVolume(1.0); // Maximum volume

          // Play
          this.sound.play((success) => {
            if (!success) {
              logger.error('Failed to play sound');
              this.playDefaultSound();
            } else {
              logger.info('✅ Sound playing');
            }
          });
        }
      );
    } catch (error) {
      logger.error('Error playing alarm sound:', error);
      this.playDefaultSound();
    }
  }

  private playDefaultSound(): void {
    // Use system default sound as fallback
    PushNotification.localNotification({
      channelId: 'alarm-channel-urgent',
      title: 'Alarm',
      message: 'Time to wake up!',
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 1000,
      priority: 'max',
      importance: Importance.MAX,
      ongoing: true,
    } as any);
  }

  private startVibration(): void {
    try {
      logger.info('📳 Starting vibration...');

      // Android pattern: vibrate for 1s, pause 0.5s, repeat
      const vibrationPattern = [0, 1000, 500, 1000, 500, 1000];

      if (Platform.OS === 'android') {
        // Use pattern vibration for Android
        Vibration.vibrate(vibrationPattern, true);
      } else {
        // iOS: simple vibration
        Vibration.vibrate(1000);
        // Continue vibrating every 2 seconds
        this.vibrationInterval = setInterval(() => {
          if (this.isRinging) {
            Vibration.vibrate(1000);
          } else {
            if (this.vibrationInterval) {
              clearInterval(this.vibrationInterval);
              this.vibrationInterval = null;
            }
          }
        }, 2000);
      }

      logger.info('✅ Vibration started');
    } catch (error) {
      logger.error('Error starting vibration:', error);
    }
  }

  private startForegroundService(title: string): void {
    if (Platform.OS !== 'android') return;

    logger.info('🚀 Starting foreground service...');

    // Create ongoing notification that acts as foreground service
    PushNotification.localNotification({
      id: 99999,
      title: `🔔 ${title}`,
      message: 'Alarm is ringing...',
      ongoing: true,
      autoCancel: false,
      priority: 'max',
      importance: Importance.MAX,
      allowWhileIdle: true,
      wakeup: true,
      visibility: 'public',
      playSound: false, // We're playing sound separately
      channelId: 'alarm-channel-urgent',
      userInfo: {
        type: 'ALARM_FOREGROUND_SERVICE',
        title: title,
      },
    } as any);
  }

  private showPersistentNotification(title: string): void {
    logger.info('📢 Showing persistent notification...');

    // Create a persistent notification that user must dismiss
    PushNotification.localNotification({
      id: 88888,
      title: `⏰ ${title}`,
      message: 'Tap to stop alarm',
      ongoing: true,
      autoCancel: false,
      priority: 'max',
      importance: Importance.MAX,
      allowWhileIdle: true,
      wakeup: true,
      playSound: true,
      soundName: 'alarm',
      vibrate: true,
      vibration: 1000,
      channelId: 'alarm-channel-urgent',
      actions: ['Dismiss'],
      userInfo: {
        type: 'ALARM_PERSISTENT',
        title: title,
      },
    } as any);
  }

  // STEP 4: Stop Alarm
  async stopAlarm(): Promise<void> {
    logger.info('🛑 Stopping alarm...');
    this.isRinging = false;

    // Stop sound
    if (this.sound) {
      this.sound.stop();
      this.sound.release();
      this.sound = null;
    }

    // Stop vibration
    Vibration.cancel();

    // Clear vibration interval
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }

    // Clear notifications
    PushNotification.cancelAllLocalNotifications();
    await AsyncStorage.removeItem('active_alarm_id');

    logger.info('✅ Alarm stopped');
  }

  // STEP 5: Setup Notification Listeners
  setupNotificationListeners(): void {
    logger.info('👂 Setting up notification listeners...');

    // Listen for native alarm notifications
    if (RNAlarmNotification && typeof RNAlarmNotification.onNotificationOpened === 'function') {
      RNAlarmNotification.onNotificationOpened((notification: any) => {
        logger.info('🔔 Native alarm opened:', notification);
        const data = notification.data || {};

        if (data.type === 'ALARM_URGENT') {
          this.handleAlarmRing(data.alarmId, data.title);
        }
      });
    } else {
      logger.warn('⚠️ RNAlarmNotification.onNotificationOpened not available');
    }

    // Listen for local notifications
    PushNotification.configure({
      onNotification: (notification: any) => {
        logger.info('📱 Local notification received:', notification);
        const data = notification.data || notification.userInfo || {};

        if (data && (data.type === 'ALARM_URGENT' || data.type === 'ALARM_BACKUP')) {
          this.handleAlarmRing(data.alarmId, data.title);
        }

        // Required on Android
        if (Platform.OS === 'android') {
          notification.finish(PushNotification.FetchResult.NoData);
        }
      },

      // Called when token is generated
      onRegister: (token: any) => {
        logger.info('📱 Push token:', token);
      },

      popInitialNotification: true,
      requestPermissions: true,
    });

    // Handle app state changes
    AppState.addEventListener('change', async (nextAppState) => {
      logger.info('📱 App state changed:', nextAppState);

      if (nextAppState === 'active') {
        // Check if alarm is ringing
        const activeAlarmId = await AsyncStorage.getItem('active_alarm_id');
        if (activeAlarmId) {
          logger.info('🔔 Found active alarm on app open:', activeAlarmId);
          // This will be handled by AlarmsScreen logic
        }
      }
    });

    logger.info('✅ Notification listeners setup complete');
  }

  // Helper methods
  private parseRecurrenceRule(recurrenceRule: string | null | undefined): {
    scheduleType: 'once' | 'repeat';
    intervalValue: number;
    intervalType: 'day' | 'week' | 'month' | 'once';
  } {
    if (!recurrenceRule || recurrenceRule === 'none') {
      return { scheduleType: 'once', intervalValue: 0, intervalType: 'once' };
    }

    // Parse RRULE format
    if (recurrenceRule.includes('FREQ=DAILY')) {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'day' };
    } else if (recurrenceRule.includes('FREQ=WEEKLY')) {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'week' };
    } else if (recurrenceRule.includes('FREQ=MONTHLY')) {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'month' };
    }

    // Fallback for simple string formats
    const rule = recurrenceRule.toLowerCase();
    if (rule === 'daily') {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'day' };
    } else if (rule === 'weekly') {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'week' };
    } else if (rule === 'monthly') {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'month' };
    }

    return { scheduleType: 'once', intervalValue: 0, intervalType: 'once' };
  }

  private getNotificationId(sourceId: string, baseOffset: number): number {
    const numericPart = parseInt(sourceId.replace(/\D/g, '').slice(-8) || '0', 10);
    return (numericPart % 10000) + baseOffset;
  }

  // Cancel a specific alarm
  async cancelAlarm(alarmId: string): Promise<void> {
    try {
      const notificationId = this.getNotificationId(alarmId, 1000);
      
      // Cancel native alarm
      if (RNAlarmNotification && typeof RNAlarmNotification.deleteAlarm === 'function') {
        RNAlarmNotification.deleteAlarm(notificationId);
      }

      // Cancel local notification
      PushNotification.cancelLocalNotification(notificationId.toString());

      // Remove from storage
      await AsyncStorage.removeItem(`alarm_${alarmId}`);
      await AsyncStorage.removeItem(`bg_alarm_${alarmId}`);

      logger.info('✅ Alarm cancelled:', alarmId);
    } catch (error) {
      logger.error('❌ Failed to cancel alarm:', error);
    }
  }

  // Clean up all alarms
  async cleanUp(): Promise<void> {
    logger.info('🧹 Cleaning up alarms...');

    if (RNAlarmNotification && typeof RNAlarmNotification.deleteAllAlarms === 'function') {
      RNAlarmNotification.deleteAllAlarms();
    }
    PushNotification.cancelAllLocalNotifications();
    await AsyncStorage.removeItem('active_alarm_id');

    logger.info('✅ Cleanup complete');
  }
}

export const alarmFixService = AlarmFixService.getInstance();

