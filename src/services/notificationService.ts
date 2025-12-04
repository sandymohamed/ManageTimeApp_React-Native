import { ApiResponse } from '@/types';
import { apiClient } from './apiClient';
import PushNotification, { Importance } from 'react-native-push-notification';
import type {
  PushNotificationScheduleObject,
  PushNotificationObject,
} from 'react-native-push-notification';
import { Platform } from 'react-native';
import { Alarm, Timer } from '@/types/alarm';

export interface InvitationNotification {
  id: string;
  type: string;
  payload: {
    invitationId: string;
    projectName: string;
    inviterName: string;
    role: string;
    notificationType: string;
  };
  createdAt: string;
  isRead: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

type ExtendedScheduleNotification = PushNotificationScheduleObject & {
  data?: Record<string, any>;
  wakeUp?: boolean;
};

type ExtendedNotification = PushNotificationObject & {
  data?: Record<string, any>;
};

class NotificationService {
  private alarmChannelId = 'alarm-channel-v2';
  private timerChannelId = 'timer-channel-v2';
  private initialized = false;
  constructor() {
    this.initializeChannels();
  }

  private getNotificationBaseId(sourceId: string): number {
    return (
      parseInt(sourceId.replace(/\D/g, '').slice(-8) || '0', 10) ||
      Math.abs(
        sourceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      )
    );
  }

  private initializeChannels() {
    if (this.initialized || Platform.OS !== 'android') return;

    try {
      try {
        PushNotification.deleteChannel?.(this.alarmChannelId);
        PushNotification.deleteChannel?.(this.timerChannelId);
      } catch (channelError) {
        console.log('Channel cleanup failed (safe to ignore):', channelError);
      }

      // Create alarm channel for Android with MAX priority
      // Note: soundName is not set in channel creation - sounds are set per notification
      PushNotification.createChannel(
        {
          channelId: this.alarmChannelId,
          channelName: 'Alarms',
          channelDescription: 'Notifications for alarms - will wake device and play sound',
          playSound: true,
          // soundName removed - set per notification instead to avoid parsing errors
          importance: 5 as any, // MAX importance (5) for alarms - ensures sound and vibration
          vibrate: true,
          sound: 'alarm', // Set default sound for channel (references alarm.mp3)
        } as any, // TypeScript types may not include 'sound' property
        (created) => console.log(`Alarm channel created: ${created}`)
      );

      // Create timer channel for Android with HIGH priority
      // Note: soundName is not set in channel creation - sounds are set per notification
      PushNotification.createChannel(
        {
          channelId: this.timerChannelId,
          channelName: 'Timers',
          channelDescription: 'Timer countdown and completion notifications',
          playSound: true,
          // soundName removed - set per notification instead to avoid parsing errors
          importance: Importance.HIGH,
          vibrate: true,
          sound: 'alarm', // Set default sound for channel (references alarm.mp3)
        } as any, // TypeScript types may not include 'sound' property
        (created) => console.log(`Timer channel created: ${created}`)
      );

      this.initialized = true;
      
      // Setup notification actions
      this.setupNotificationActions();
    } catch (error) {
      console.error('Failed to initialize notification channels:', error);
    }
  }


  /**
   * Setup notification actions (Snooze/Dismiss)
   * Note: onAction may not exist in all versions of react-native-push-notification
   */
  private setupNotificationActions(): void {
    if (Platform.OS !== 'android') return;

    try {
      // Check if onAction method exists
      const pushNotification = PushNotification as any;
      if (typeof pushNotification.onAction === 'function') {
        // Handle notification actions
        pushNotification.onAction((notification: any) => {
          const { action, userInfo } = notification;
          
          console.log('Notification action pressed:', { action, userInfo });

          if (action === 'Snooze') {
            // Handle snooze logic
            const alarmId = userInfo?.alarmId;
            if (alarmId) {
              console.log('Snooze pressed for alarm:', alarmId);
              this.scheduleSnooze(alarmId, userInfo?.title || 'Alarm');
            }
          } else if (action === 'Dismiss') {
            // Handle dismiss logic
            const alarmId = userInfo?.alarmId;
            const timerId = userInfo?.timerId;
            
            if (alarmId) {
              console.log('Dismiss pressed for alarm:', alarmId);
              this.cancelAlarm(alarmId);
              // Cancel any ongoing notification
              PushNotification.cancelLocalNotification(this.getNotificationBaseId(alarmId).toString());
            } else if (timerId) {
              console.log('Dismiss pressed for timer:', timerId);
              this.cancelTimer(timerId);
              this.cancelTimerNotification(timerId);
            }
          }
        });

        console.log('Notification actions setup complete');
      } else {
        console.log('⚠️ onAction not available in react-native-push-notification, notification actions disabled');
      }
    } catch (error) {
      console.error('Failed to setup notification actions:', error);
    }
  }

  /**
   * Schedule snooze for alarm
   */
  private scheduleSnooze(alarmId: string, title: string): void {
    try {
      const snoozeTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      const snoozeNotificationId = this.getNotificationBaseId(`${alarmId}_snooze`);

      const snoozePayload: ExtendedScheduleNotification = {
        id: snoozeNotificationId.toString(),
        title: `⏰ ${title} (Snooze)`,
        message: 'Snooze alarm',
        date: snoozeTime,
        channelId: this.alarmChannelId,
        priority: 'max',
        importance: 'max',
        allowWhileIdle: true,
        playSound: true,
        soundName: 'alarm_sound',
        vibrate: true,
        vibration: [0, 1000, 500, 1000, 500, 1000] as any, // Pattern vibration (works at runtime)
        userInfo: {
          alarmId: `${alarmId}_snooze`,
          type: 'ALARM_SNOOZE',
          title: title,
        },
        data: {
          type: 'ALARM_SNOOZE',
          alarmId: `${alarmId}_snooze`,
          title: title,
        },
      };

      PushNotification.localNotificationSchedule(snoozePayload);
      console.log(`Snooze scheduled for alarm ${alarmId} at ${snoozeTime.toISOString()}`);
    } catch (error) {
      console.error(`Failed to schedule snooze for alarm ${alarmId}:`, error);
    }
  }

  async getNotifications(): Promise<InvitationNotification[]> {
    try {
      const response = await apiClient.get<ApiResponse<InvitationNotification[]>>('/notifications');
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.put<ApiResponse<void>>(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a single alarm notification
   */
  scheduleAlarm(alarm: Alarm): void {
    // Backend now manages alarm push notifications. Ensure any legacy local notifications are cleared.
    this.cancelAlarm(alarm.id);
  }

  /**
   * Schedule all alarms
   */
  scheduleAllAlarms(alarms: Alarm[]): void {

    // Clear any legacy local notifications for the provided alarms
    alarms.forEach(alarm => {
      this.cancelAlarm(alarm.id);
    });
  }

  /**
   * Cancel a scheduled alarm
   */
  cancelAlarm(alarmId: string): void {
    try {
      // Convert alarm ID to numeric ID for notification
      const notificationId = this.getNotificationBaseId(alarmId);
      this.cancelAlarmNotifications(notificationId.toString());
    } catch (error) {
      console.error(`Failed to cancel alarm ${alarmId}:`, error);
    }
  }

  /**
   * Cancel all notifications (primary + reminders) for an alarm
   */
  private cancelAlarmNotifications(baseNotificationId: string): void {
    PushNotification.cancelLocalNotification(baseNotificationId);
  }

  /**
   * Schedule a timer notification for completion
   * Enhanced with better sound and vibration
   */
  scheduleTimer(timerId: string, title: string, remainingSeconds: number): void {
    try {
      const triggerTime = new Date(Date.now() + remainingSeconds * 1000);

      // Convert timer ID to numeric ID for notification
      const notificationId = this.getNotificationBaseId(timerId).toString();

      const notificationPayload: ExtendedScheduleNotification = {
        id: notificationId,
        title: `⏱️ ${title}`,
        message: 'Timer finished!',
        date: triggerTime,
        allowWhileIdle: true, // Works even in doze mode
        ignoreInForeground: false,
        soundName: 'alarm', // References alarm.mp3 in android/app/src/main/res/raw/alarm.mp3
        playSound: true,
        vibrate: true,
        vibration: [0, 1000, 500, 1000, 500, 1000] as any, // Pattern vibration (works at runtime)
        priority: 'max', // MAX priority for timer completion
        importance: 'max' as any, // MAX importance to ensure it rings
        channelId: Platform.OS === 'android' ? this.timerChannelId : undefined,
        invokeApp: false, // Don't open app automatically
        data: {
          type: 'TIMER_COMPLETION',
          timerId: timerId,
          title: title,
        },
        userInfo: {
          type: 'TIMER_COMPLETION',
          timerId: timerId,
          title: title,
        },
      };

      PushNotification.localNotificationSchedule(notificationPayload);
      console.log(`Timer completion scheduled: ${timerId} at ${triggerTime.toISOString()}`);
    } catch (error) {
      console.error(`Failed to schedule timer ${timerId}:`, error);
    }
  }

  /**
   * Update timer notification with remaining time (for foreground service)
   * This creates an ongoing notification that shows the countdown
   */
  updateTimerNotification(timerId: string, title: string, remainingSeconds: number): void {
    try {
      // Use a consistent notification ID so it can be updated
      // This creates a persistent notification that shows countdown in system notification bar
      const notificationId = this.getNotificationBaseId(timerId) + 10000; // Use base ID + offset for ongoing notification
      
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Create ongoing notification that acts as foreground service
      // This keeps the notification visible in the system notification bar with live countdown
      const notificationPayload: ExtendedNotification = {
        id: notificationId.toString(),
        title: `⏱️ ${title}`,
        message: `Time remaining: ${timeString}`, // This updates every second, visible in notification bar
        ongoing: true, // Android: makes it non-dismissible (acts as foreground service)
        autoCancel: false,
        playSound: false, // Don't play sound on updates (only on completion)
        vibrate: false,
        priority: 'high',
        importance: 'high' as any,
        allowWhileIdle: true, // Critical: allows updates even when device is idle
        channelId: Platform.OS === 'android' ? this.timerChannelId : undefined,
        visibility: 'public',
        // Foreground service properties for Android
        ...(Platform.OS === 'android' && {
          ongoing: true,
          autoCancel: false,
          // This makes it show in system notification bar like Android's built-in timer
          showWhen: true,
          when: Date.now(),
        }),
        data: {
          type: 'TIMER_FOREGROUND_SERVICE',
          timerId: timerId,
          remainingSeconds: remainingSeconds.toString(),
          title: title,
          startTime: Date.now().toString(),
        },
        userInfo: {
          type: 'TIMER_FOREGROUND_SERVICE',
          timerId: timerId,
          remainingSeconds: remainingSeconds.toString(),
          title: title,
          startTime: Date.now().toString(),
        },
      };

      // Update the notification - this will show the countdown in the notification bar
      PushNotification.localNotification(notificationPayload);
      
      // Try to use foreground service API if available (keeps app process alive)
      if (Platform.OS === 'android') {
        try {
          const pushNotification = PushNotification as any;
          if (typeof pushNotification.startForegroundService === 'function') {
            pushNotification.startForegroundService({
              id: notificationId.toString(),
              title: `⏱️ ${title}`,
              message: `Time remaining: ${timeString}`,
              channelId: this.timerChannelId,
              ongoing: true,
              autoCancel: false,
            });
          }
        } catch (fgError) {
          // Foreground service might not be available, continue with regular notification
          // The ongoing notification will still work
        }
      }
    } catch (error) {
      console.error(`Failed to update timer notification ${timerId}:`, error);
    }
  }

  /**
   * Cancel ongoing timer notification
   */
  cancelTimerNotification(timerId: string): void {
    try {
      // Cancel ongoing notification (the countdown one)
      const ongoingNotificationId = (this.getNotificationBaseId(timerId) + 10000).toString();
      PushNotification.cancelLocalNotification(ongoingNotificationId);
      
      // Also cancel any scheduled completion notification
      const scheduledNotificationId = this.getNotificationBaseId(timerId).toString();
      PushNotification.cancelLocalNotification(scheduledNotificationId);
      
      console.log(`✅ Cancelled timer notifications for ${timerId}`);
    } catch (error) {
      console.error(`Failed to cancel timer notification ${timerId}:`, error);
    }
  }

  /**
   * Cancel a timer notification
   */
  cancelTimer(timerId: string): void {
    try {
      // Convert timer ID to numeric ID for notification
      const notificationId = this.getNotificationBaseId(timerId);
      PushNotification.cancelLocalNotification(notificationId.toString());
    } catch (error) {
      console.error(`Failed to cancel timer ${timerId}:`, error);
    }
  }

  /**
   * Get repeat type for notification based on recurrence rule
   */
  private getRepeatType(recurrenceRule?: string): 'day' | 'week' | undefined {
    if (!recurrenceRule) return undefined;

    // Handle simple recurrence strings from the alarm form
    switch (recurrenceRule) {
      case 'daily':
        return 'day';
      case 'weekly':
        return 'week';
      case 'weekdays':
      case 'weekends':
        // These require custom handling - schedule daily and check day
        return 'day';
      default:
        // Handle RFC 5545 format if present
        if (recurrenceRule.includes('FREQ=DAILY')) {
          return 'day';
        }
        if (recurrenceRule.includes('FREQ=WEEKLY')) {
          return 'week';
        }
        return undefined;
    }
  }

  /**
   * Handle recurrence for alarms (weekdays, weekends, etc.)
   */
  private handleRecurrence(alarm: Alarm): void {
    // For weekdays/weekends, we schedule daily and check the day when it fires
    // The alarm checking logic in AlarmsScreen will handle filtering
    if (alarm.recurrenceRule && ['weekdays', 'weekends'].includes(alarm.recurrenceRule)) {
      console.log(`Recurrence rule: ${alarm.recurrenceRule} - will be handled by daily scheduling`);
      // Note: The actual filtering happens in the alarm checking logic
      // since local notifications can't easily handle complex recurrence
    }
  }

  /**
   * Trigger an immediate alarm notification (foreground support)
   * Enhanced with better sound, vibration, and ongoing support
   */
  triggerImmediateAlarmNotification(alarm: Alarm): void {
    try {
      const notificationId = `${this.getNotificationBaseId(alarm.id)}-instant-${Date.now()}`;
      const alarmTitle = alarm.title || 'Alarm';
      const alarmTime = new Date(alarm.time).toLocaleTimeString();

      const notificationPayload: ExtendedNotification = {
        id: notificationId,
        title: `⏰ ${alarmTitle}`,
        message: `Alarm! ${alarmTime}`,
        playSound: true,
        soundName: 'alarm', // References alarm.mp3 in android/app/src/main/res/raw/alarm.mp3
        vibrate: true,
        vibration: [0, 1000, 500, 1000, 500, 1000] as any, // Pattern vibration
        priority: 'max',
        importance: 'max' as any,
        allowWhileIdle: true, // Wake device even in doze mode
        ignoreInForeground: false,
        ongoing: true, // Keep ringing until dismissed
        autoCancel: false,
        invokeApp: true, // Open app when clicked
        channelId: Platform.OS === 'android' ? this.alarmChannelId : undefined,
        visibility: 'public',
        data: {
          type: 'ALARM_IMMEDIATE',
          alarmId: alarm.id,
          title: alarmTitle,
          time: alarm.time,
        },
        userInfo: {
          type: 'ALARM_IMMEDIATE',
          alarmId: alarm.id,
          title: alarmTitle,
          time: alarm.time,
        },
      };

      PushNotification.localNotification(notificationPayload);
      console.log(`Immediate alarm notification triggered: ${alarm.id}`);
    } catch (error) {
      console.error(`Failed to trigger immediate alarm notification ${alarm.id}:`, error);
    }
  }

  /**
   * Trigger an immediate timer completion notification (foreground support)
   * Enhanced with better sound, vibration, and ongoing support
   * This notification stays visible and allows opening app to stop
   */
  triggerImmediateTimerNotification(timer: Pick<Timer, 'id' | 'title'>): void {
    try {
      // Use the SAME notification ID as the countdown notification so it REPLACES it
      // This ensures smooth transition from countdown to ringing
      const notificationId = (this.getNotificationBaseId(timer.id) + 10000).toString();
      const timerTitle = timer.title || 'Timer';

      const notificationPayload: ExtendedNotification = {
        id: notificationId, // SAME ID as countdown notification - replaces it
        title: `⏱️ ${timerTitle}`,
        message: 'Timer is ringing! Tap to open app and stop.',
        playSound: true,
        soundName: 'alarm', // References alarm.mp3 in android/app/src/main/res/raw/alarm.mp3
        vibrate: true,
        vibration: [0, 1000, 500, 1000, 500, 1000] as any, // Pattern vibration
        priority: 'max', // MAX priority for timer completion
        importance: 'max' as any, // MAX importance to ensure it rings
        allowWhileIdle: true, // Wake device even in doze mode
        ignoreInForeground: false,
        ongoing: true, // Keep visible until dismissed (persistent notification)
        autoCancel: false, // Don't auto-dismiss
        invokeApp: true, // Open app when clicked/tapped
        channelId: Platform.OS === 'android' ? this.timerChannelId : undefined,
        visibility: 'public',
        ...(Platform.OS === 'android' && {
          // Android-specific: Make it non-dismissible and always visible
          ongoing: true,
          autoCancel: false,
          showWhen: true,
          when: Date.now(),
        }),
        data: {
          type: 'TIMER_RINGING',
          timerId: timer.id,
          title: timerTitle,
          action: 'open_app',
        },
        userInfo: {
          type: 'TIMER_RINGING',
          timerId: timer.id,
          title: timerTitle,
          action: 'open_app',
        },
      };

      // Update the existing countdown notification to show ringing notification
      // Using the same ID replaces the countdown notification smoothly
      PushNotification.localNotification(notificationPayload);
      console.log(`✅ Timer ringing notification triggered: ${timer.id} - Replaces countdown notification and stays visible`);
    } catch (error) {
      console.error(`Failed to trigger immediate timer notification ${timer.id}:`, error);
    }
  }
}

export const notificationService = new NotificationService();