import { Platform, Vibration } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import notifee, { AndroidImportance, AndroidVisibility, EventType, TriggerType, TimestampTrigger } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import { Alarm } from '@/types/alarm';
import { logger } from '@/utils/logger';

export class ReliableAlarmService {
  private static instance: ReliableAlarmService;
  private sound: Sound | null = null;
  private isRinging = false;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  static getInstance(): ReliableAlarmService {
    if (!ReliableAlarmService.instance) {
      ReliableAlarmService.instance = new ReliableAlarmService();
    }
    return ReliableAlarmService.instance;
  }

  // Initialize notification channels
  async initialize(): Promise<void> {
    logger.info('🔧 Initializing ReliableAlarmService...');

    // Create notification channels
    await this.createNotificationChannels();

    // Setup notification event handlers
    this.setupNotificationHandlers();
    
    // Setup native alarm notification listeners (for RNAlarmNotification)
    this.setupNativeAlarmListeners();

    // Check for pending alarms
    await this.checkPendingAlarms();
  }

  // Setup native alarm notification listeners (Notifee trigger notifications)
  private setupNativeAlarmListeners(): void {
    try {
      // Notifee trigger notifications are handled via the existing setupNotificationHandlers
      // When a trigger notification fires, it goes through the standard notification handlers
      // which already store pending_alarm_id if data.type === 'ALARM'
      logger.info('✅ Notifee trigger notification listeners handled via setupNotificationHandlers');
    } catch (error) {
      logger.error('❌ Failed to setup native alarm listeners:', error);
    }
  }

  // Create notification channels with Notifee
  private async createNotificationChannels(): Promise<void> {
    try {
      // Alarm channel - use same ID as backend ('alarm-channel-v2')
      await notifee.createChannel({
        id: 'alarm-channel-v2',
        name: 'Alarms',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'alarm',
        visibility: AndroidVisibility.PUBLIC,
      });

      // Timer channel
      await notifee.createChannel({
        id: 'timer_channel',
        name: 'Timers',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'alarm',
      });

      logger.info('✅ Notification channels created');
    } catch (error) {
      logger.error('❌ Error creating channels:', error);
    }
  }

  // Setup notification event handlers
  private setupNotificationHandlers(): void {
    // Handle notification actions (Snooze/Stop) and trigger notifications
    notifee.onForegroundEvent(async ({ type, detail }) => {
      // Handle trigger notification display (when scheduled notification fires)
      if (type === EventType.TRIGGER_NOTIFICATION_CREATED || type === EventType.DELIVERED) {
        const notification = detail.notification;
        const data = notification?.data;
        if (data?.type === 'ALARM' && data?.alarmId && data?.fromTrigger === 'true') {
          // Trigger notification fired - store pending alarm ID and trigger alarm ringing
          logger.info('🔔 Notifee trigger alarm fired:', data.alarmId);
          try {
            await AsyncStorage.setItem('pending_alarm_id', data.alarmId);
            // Also trigger the alarm to ring immediately
            await this.ringAlarm(data.alarmId, data.title || 'Alarm');
          } catch (error) {
            logger.error('Failed to handle trigger notification:', error);
          }
        }
      }
      
      // Handle action buttons
      if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction?.id === 'stop') {
          this.stopAlarm();
        } else if (detail.pressAction?.id === 'snooze') {
          this.snoozeAlarm();
        }
      }
    });

    // Handle background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      // Handle trigger notification in background
      if (type === EventType.TRIGGER_NOTIFICATION_CREATED || type === EventType.DELIVERED) {
        const notification = detail.notification;
        const data = notification?.data;
        if (data?.type === 'ALARM' && data?.alarmId && data?.fromTrigger === 'true') {
          logger.info('🔔 Notifee trigger alarm fired (background):', data.alarmId);
          try {
            await AsyncStorage.setItem('pending_alarm_id', data.alarmId);
            // Trigger alarm to ring even in background
            await this.ringAlarm(data.alarmId, data.title || 'Alarm');
          } catch (error) {
            logger.error('Failed to handle trigger notification (background):', error);
          }
        }
      }
      
      // Handle action buttons
      if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction?.id === 'stop') {
          await this.stopAlarm();
        } else if (detail.pressAction?.id === 'snooze') {
          await this.snoozeAlarm();
        }
      }
    });
  }

  // Schedule alarm using BackgroundTimer
  async scheduleAlarm(alarm: Alarm): Promise<string> {
    const alarmId = alarm.id;
    const alarmTime = new Date(alarm.time);
    const now = new Date();
    
    // Parse recurrence rule for native scheduling
    const { scheduleType, intervalValue, intervalType } = this.parseRecurrenceRule(alarm.recurrenceRule);
    
    // Calculate next valid alarm time
    let scheduledAlarmTime = new Date(alarmTime);
    if (scheduledAlarmTime.getTime() <= now.getTime()) {
      // For recurring alarms, calculate next occurrence
      if (alarm.recurrenceRule && alarm.recurrenceRule !== 'none') {
        scheduledAlarmTime = this.calculateNextOccurrence(alarmTime, alarm.recurrenceRule);
      } else {
        // For one-time alarms in the past, skip (backend push notification should handle it)
        logger.warn('⚠️ Alarm time is in the past and not recurring, skipping native scheduling (relying on backend push)');
        return alarmId;
      }
    }

    logger.info(`📅 Scheduling alarm "${alarm.title}" for ${scheduledAlarmTime.toISOString()}`);

    try {
      // IMPORTANT: Use Notifee's trigger notifications which work even when app is closed
      // This is critical for routine/task alarms to ring outside the app like regular alarms
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: scheduledAlarmTime.getTime(),
      };

      // Cancel any existing notification for this alarm first
      try {
        const existingNotifications = await notifee.getTriggerNotifications();
        const existingNotif = existingNotifications.find(
          (n) => n.notification.data?.alarmId === alarmId
        );
        if (existingNotif) {
          await notifee.cancelNotification(existingNotif.notification.id);
        }
      } catch (cancelError) {
        logger.warn('⚠️ Error canceling existing notification:', cancelError);
      }

      // IMPORTANT: Ensure channel exists before scheduling (required for sound/vibration)
      try {
        await notifee.createChannel({
          id: 'alarm-channel-v2',
          name: 'Alarms',
          importance: AndroidImportance.HIGH,
          vibration: true,
          sound: 'alarm',
          visibility: AndroidVisibility.PUBLIC,
        });
      } catch (channelError) {
        // Channel might already exist, that's OK
        logger.debug('Alarm channel creation (may already exist)');
      }

      // Schedule notification using Notifee trigger (works when app is closed)
      // Note: Notifee trigger notifications automatically display with sound/vibration when they fire,
      // even when the app is completely closed. This is the native Android notification system.
      const notificationId = await notifee.createTriggerNotification(
        {
          title: `⏰ ${alarm.title}`,
          body: `Alarm at ${scheduledAlarmTime.toLocaleTimeString()}`,
          android: {
            channelId: 'alarm-channel-v2',
            importance: AndroidImportance.HIGH,
            sound: 'alarm', // References alarm.mp3 in res/raw/alarm.mp3
            vibrationPattern: [0, 1000, 500, 1000, 500, 1000], // 0 delay, then vibrate-pause pattern
            lights: ['#FF0000', 1000, 1000],
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            actions: [
              {
                title: 'Stop',
                pressAction: { id: 'stop' },
              },
            ],
            autoCancel: false,
            ongoing: true,
            visibility: AndroidVisibility.PUBLIC,
            // Ensure it can wake device and bypass doze mode
            showTimestamp: true,
          },
          data: {
            alarmId: alarmId,
            type: 'ALARM',
            title: alarm.title,
            time: alarm.time,
            fromTrigger: 'true',
            scheduledTime: scheduledAlarmTime.toISOString(),
          },
        },
        trigger
      );

      logger.info(`✅ Notifee trigger alarm scheduled successfully (works when app is closed): ${notificationId}`, {
        alarmId,
        alarmTitle: alarm.title,
        scheduledTime: scheduledAlarmTime.toISOString(),
        timeUntilAlarm: Math.floor((scheduledAlarmTime.getTime() - Date.now()) / 1000) + ' seconds'
      });
      
      // Store notification ID for cancellation
      await AsyncStorage.setItem(`alarm_notif_${alarmId}`, notificationId);
    } catch (notifeeError) {
      logger.error('❌ Failed to schedule Notifee trigger notification, falling back to BackgroundTimer:', notifeeError);
      
      // Fallback to BackgroundTimer (only works when app is running)
      let delayMs = scheduledAlarmTime.getTime() - now.getTime();
      if (delayMs > 0) {
        const timerId = BackgroundTimer.setTimeout(() => {
          logger.info('🔔 BackgroundTimer fired for alarm:', alarm.title);
          this.ringAlarm(alarmId, alarm.title);
          
          // Reschedule if recurring
          if (alarm.recurrenceRule && alarm.recurrenceRule !== 'none') {
            this.scheduleAlarm(alarm);
          }
        }, delayMs);
        await AsyncStorage.setItem(`alarm_timer_${alarmId}`, timerId.toString());
      }
    }

    // Store alarm info
    await AsyncStorage.setItem(`alarm_${alarmId}`, JSON.stringify({
      id: alarmId,
      title: alarm.title,
      time: alarm.time,
      recurrenceRule: alarm.recurrenceRule,
      scheduledAt: Date.now(),
      fireTime: scheduledAlarmTime.getTime(),
    }));

    logger.info('✅ Alarm scheduled successfully');
    return alarmId;
  }

  // Parse recurrence rule to get schedule type and interval
  private parseRecurrenceRule(recurrenceRule: string | null | undefined): {
    scheduleType: 'once' | 'repeat';
    intervalValue: number;
    intervalType: 'day' | 'week' | 'month' | 'once';
  } {
    if (!recurrenceRule || recurrenceRule === 'none') {
      return { scheduleType: 'once', intervalValue: 0, intervalType: 'once' };
    }

    if (recurrenceRule.includes('FREQ=DAILY') || recurrenceRule === 'daily') {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'day' };
    } else if (recurrenceRule.includes('FREQ=WEEKLY') || recurrenceRule === 'weekly') {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'week' };
    } else if (recurrenceRule.includes('FREQ=MONTHLY') || recurrenceRule === 'monthly') {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'month' };
    }

    return { scheduleType: 'once', intervalValue: 0, intervalType: 'once' };
  }


  // Calculate next occurrence for recurring alarms
  private calculateNextOccurrence(alarmTime: Date, recurrenceRule: string): Date {
    const now = new Date();
    const next = new Date(alarmTime);

    if (recurrenceRule.includes('FREQ=DAILY') || recurrenceRule === 'daily') {
      // Daily - add 1 day
      while (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1);
      }
    } else if (recurrenceRule.includes('FREQ=WEEKLY') || recurrenceRule === 'weekly') {
      // Weekly - add 7 days
      while (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 7);
      }
    } else if (recurrenceRule.includes('FREQ=MONTHLY') || recurrenceRule === 'monthly') {
      // Monthly - add 1 month
      while (next.getTime() <= now.getTime()) {
        next.setMonth(next.getMonth() + 1);
      }
    }

    return next;
  }

  // Ring the alarm
  async ringAlarm(alarmId: string, alarmTitle: string): Promise<void> {
    if (this.isRinging) {
      logger.warn('⚠️ Alarm already ringing, skipping');
      return;
    }

    logger.info('🔔 Alarm ringing:', alarmTitle);
    this.isRinging = true;

    try {
      // Store active alarm
      await AsyncStorage.setItem('active_alarm', JSON.stringify({
        id: alarmId,
        title: alarmTitle,
        startedAt: Date.now(),
      }));

      // 1. Show high-priority notification
      await this.showAlarmNotification(alarmTitle);

      // 2. Play sound
      this.playAlarmSound();

      // 3. Vibrate
      this.startVibration();

      // 4. Keep ringing until stopped
      this.keepAlarmRinging();

    } catch (error) {
      logger.error('❌ Error ringing alarm:', error);
    }
  }

  // Show alarm notification
  private async showAlarmNotification(title: string): Promise<void> {
    try {
      await notifee.displayNotification({
        title: `⏰ ${title}`,
        body: 'Tap to stop alarm',
        android: {
          channelId: 'alarm-channel-v2',
          importance: AndroidImportance.HIGH,
          sound: 'alarm',
          vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
          lights: ['#FF0000', 1000, 1000],
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'Snooze',
              pressAction: { id: 'snooze' },
            },
            {
              title: 'Stop',
              pressAction: { id: 'stop' },
            },
          ],
        },
      });
      logger.info('✅ Alarm notification shown');
    } catch (error) {
      logger.error('❌ Error showing notification:', error);
    }
  }

  // Play alarm sound
  private playAlarmSound(): void {
    try {
      logger.info('🔊 Playing alarm sound...');

      // Stop any existing sound
      if (this.sound) {
        this.sound.stop();
        this.sound.release();
        this.sound = null;
      }

      // Configure for playback
      Sound.setCategory('Playback', true);

      // Load sound
      this.sound = new Sound(
        'alarm.mp3',
        Sound.MAIN_BUNDLE,
        (error) => {
          if (error) {
            logger.error('❌ Failed to load sound:', error);
            // Use notification sound as fallback
            return;
          }

          if (!this.sound) return;

          // Play sound on loop
          this.sound.setNumberOfLoops(-1);
          this.sound.setVolume(1.0);
          this.sound.play();
          logger.info('✅ Sound playing');
        }
      );
    } catch (error) {
      logger.error('❌ Error playing sound:', error);
    }
  }

  // Start vibration
  private startVibration(): void {
    try {
      logger.info('📳 Starting vibration...');

      if (Platform.OS === 'android') {
        // Android pattern
        Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
      } else {
        // iOS
        Vibration.vibrate(1000);
      }

      logger.info('✅ Vibration started');
    } catch (error) {
      logger.error('❌ Error starting vibration:', error);
    }
  }

  // Keep alarm ringing
  private async keepAlarmRinging(): Promise<void> {
    // This keeps the alarm alive by updating the notification
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(async () => {
      if (!this.isRinging) {
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }
        return;
      }

      // Update notification to keep it fresh
      try {
        await notifee.displayNotification({
          title: `⏰ Alarm is ringing!`,
          body: 'Tap to stop',
          android: {
            channelId: 'alarm-channel-v2',
            importance: AndroidImportance.HIGH,
            ongoing: true,
            timestamp: Date.now(),
            sound: 'alarm',
            vibrationPattern: [0, 1000, 500, 1000],
            actions: [
              {
                title: 'Stop',
                pressAction: { id: 'stop' },
              },
            ],
          },
        });
      } catch (error) {
        logger.error('Error updating alarm notification:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  // Stop alarm
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

    // Clear keep-alive interval
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    // Clear notification
    await notifee.cancelAllNotifications();

    // Clear storage
    await AsyncStorage.removeItem('active_alarm');

    logger.info('✅ Alarm stopped');
  }

  // Snooze alarm
  async snoozeAlarm(): Promise<void> {
    logger.info('😴 Snoozing alarm...');

    // Stop current alarm
    await this.stopAlarm();

    // Get active alarm info
    const activeAlarmStr = await AsyncStorage.getItem('active_alarm');
    if (activeAlarmStr) {
      const activeAlarm = JSON.parse(activeAlarmStr);
      
      // Schedule for 5 minutes later
      const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
      const snoozeAlarm: Alarm = {
        id: `${activeAlarm.id}_snooze`,
        title: `${activeAlarm.title} (Snooze)`,
        time: snoozeTime.toISOString(),
        recurrenceRule: 'none',
        enabled: true,
        userId: '',
        createdAt: '',
        updatedAt: '',
        timezone: 'UTC',
      };

      await this.scheduleAlarm(snoozeAlarm);
      logger.info('✅ Alarm snoozed for 5 minutes');
    }
  }

  // Check for pending alarms on app start
  private async checkPendingAlarms(): Promise<void> {
    try {
      const activeAlarmStr = await AsyncStorage.getItem('active_alarm');
      if (activeAlarmStr) {
        const activeAlarm = JSON.parse(activeAlarmStr);
        logger.info('🔍 Found active alarm:', activeAlarm.title);

        // If alarm started less than 5 minutes ago, keep it ringing
        const alarmAge = Date.now() - activeAlarm.startedAt;
        if (alarmAge < 5 * 60 * 1000) { // 5 minutes
          logger.info('🔔 Continuing active alarm');
          await this.ringAlarm(activeAlarm.id, activeAlarm.title);
        } else {
          // Alarm is too old, clear it
          await AsyncStorage.removeItem('active_alarm');
        }
      }
    } catch (error) {
      logger.error('❌ Error checking pending alarms:', error);
    }
  }

  // Cancel scheduled alarm
  async cancelAlarm(alarmId: string): Promise<void> {
    try {
      // Cancel Notifee trigger notification if it exists
      try {
        const notificationIdStr = await AsyncStorage.getItem(`alarm_notif_${alarmId}`);
        if (notificationIdStr) {
          await notifee.cancelNotification(notificationIdStr);
          await AsyncStorage.removeItem(`alarm_notif_${alarmId}`);
          logger.info('✅ Notifee trigger alarm canceled');
        } else {
          // Try to find and cancel by alarmId in data
          const existingNotifications = await notifee.getTriggerNotifications();
          const existingNotif = existingNotifications.find(
            (n) => n.notification.data?.alarmId === alarmId
          );
          if (existingNotif) {
            await notifee.cancelNotification(existingNotif.notification.id);
            logger.info('✅ Notifee trigger alarm canceled (found by alarmId)');
          }
        }
      } catch (notifeeError) {
        logger.warn('⚠️ Failed to cancel Notifee trigger notification (may not exist):', notifeeError);
      }

      // Get timer ID (for BackgroundTimer fallback)
      const timerIdStr = await AsyncStorage.getItem(`alarm_timer_${alarmId}`);
      if (timerIdStr) {
        try {
          const timerId = parseInt(timerIdStr, 10);
          BackgroundTimer.clearTimeout(timerId);
          logger.info('✅ BackgroundTimer alarm cleared');
        } catch (timerError) {
          logger.warn('⚠️ Failed to clear BackgroundTimer:', timerError);
        }
      }

      // Clean up storage
      await AsyncStorage.removeItem(`alarm_${alarmId}`);
      await AsyncStorage.removeItem(`alarm_timer_${alarmId}`);

    } catch (error) {
      logger.error('❌ Error canceling alarm:', error);
    }
  }

  // Clean up everything
  async cleanUp(): Promise<void> {
    logger.info('🧹 Cleaning up alarms...');

    // Stop any ringing alarm
    await this.stopAlarm();

    // Clear all notifications
    await notifee.cancelAllNotifications();

    // Clear all stored alarms
    const keys = await AsyncStorage.getAllKeys();
    const alarmKeys = keys.filter(key => key.startsWith('alarm_'));
    await AsyncStorage.multiRemove(alarmKeys);

    logger.info('✅ Cleanup complete');
  }
}

export const reliableAlarmService = ReliableAlarmService.getInstance();

