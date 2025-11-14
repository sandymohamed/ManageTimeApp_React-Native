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

      // Create alarm channel for Android with highest priority
      PushNotification.createChannel(
        {
          channelId: this.alarmChannelId,
          channelName: 'Alarms',
          channelDescription: 'Notifications for alarms - will wake device and play sound',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created) => console.log(`Alarm channel created: ${created}`)
      );

      // Create timer channel for Android
      PushNotification.createChannel(
        {
          channelId: this.timerChannelId,
          channelName: 'Timers',
          channelDescription: 'Notifications for timers',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created) => console.log(`Timer channel created: ${created}`)
      );

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize notification channels:', error);
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
   * Schedule a timer notification
   */
  scheduleTimer(timerId: string, title: string, remainingSeconds: number): void {
    try {
      const triggerTime = new Date(Date.now() + remainingSeconds * 1000);

      // Convert timer ID to numeric ID for notification
      const notificationId = this.getNotificationBaseId(timerId).toString();

      const notificationPayload: ExtendedScheduleNotification = {
        id: notificationId,
        title: '⏱️ Timer Complete',
        message: `${title} is complete!`,
        date: triggerTime,
        allowWhileIdle: true,
        ignoreInForeground: false,
        soundName: 'default',
        playSound: true,
        vibrate: true,
        vibration: 1000,
        priority: 'max',
        importance: 'max',
        channelId: Platform.OS === 'android' ? this.timerChannelId : undefined,
        data: {
          type: 'timer',
          timerId: timerId,
        },
        userInfo: {
          type: 'timer',
          timerId: timerId,
        },
      };

      PushNotification.localNotificationSchedule(notificationPayload);
    } catch (error) {
      console.error(`Failed to schedule timer ${timerId}:`, error);
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
   */
  triggerImmediateAlarmNotification(alarm: Alarm): void {
    try {
      const notificationId = `${this.getNotificationBaseId(alarm.id)}-instant-${Date.now()}`;

      const notificationPayload: ExtendedNotification = {
        id: notificationId,
        title: '⏰ Alarm',
        message: alarm.title || 'Alarm',
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 1000,
        priority: 'max',
        importance: 'max',
        allowWhileIdle: true,
        ignoreInForeground: false,
        channelId: Platform.OS === 'android' ? this.alarmChannelId : undefined,
        data: {
          type: 'alarm',
          alarmId: alarm.id,
        },
        userInfo: {
          type: 'alarm',
          alarmId: alarm.id,
        },
      };

      PushNotification.localNotification(notificationPayload);
    } catch (error) {
      console.error(`Failed to trigger immediate alarm notification ${alarm.id}:`, error);
    }
  }

  /**
   * Trigger an immediate timer completion notification (foreground support)
   */
  triggerImmediateTimerNotification(timer: Pick<Timer, 'id' | 'title'>): void {
    try {
      const notificationId = `${this.getNotificationBaseId(timer.id)}-instant-${Date.now()}`;

      const notificationPayload: ExtendedNotification = {
        id: notificationId,
        title: '⏱️ Timer Complete',
        message: `${timer.title} is complete!`,
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 1000,
        priority: 'max',
        importance: 'max',
        allowWhileIdle: true,
        ignoreInForeground: false,
        channelId: Platform.OS === 'android' ? this.timerChannelId : undefined,
        data: {
          type: 'timer',
          timerId: timer.id,
        },
        userInfo: {
          type: 'timer',
          timerId: timer.id,
        },
      };

      PushNotification.localNotification(notificationPayload);
    } catch (error) {
      console.error(`Failed to trigger immediate timer notification ${timer.id}:`, error);
    }
  }
}

export const notificationService = new NotificationService();