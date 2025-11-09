import { ApiResponse } from '@/types';
import { apiClient } from './apiClient';
import PushNotification, { Importance } from 'react-native-push-notification';
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
          lights: true,
          lightColor: '#FF0000',
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
    if (!alarm.enabled) {
      console.log(`Alarm ${alarm.id} is disabled, skipping scheduling`);
      return;
    }

    try {
      let alarmTime = new Date(alarm.time);
      const now = new Date();
      
      // For one-time alarms, if the alarm time is tomorrow but the time today hasn't passed yet,
      // adjust it to today. This fixes cases where alarms were created with the wrong date.
      const isOneTimeAlarm = !alarm.recurrenceRule || alarm.recurrenceRule === 'none';
      if (isOneTimeAlarm) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alarmDate = new Date(alarmTime);
        alarmDate.setHours(0, 0, 0, 0);
        
        // If alarm is scheduled for tomorrow but the time today hasn't passed
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (alarmDate.getTime() === tomorrow.getTime()) {
          const alarmTimeToday = new Date(today);
          alarmTimeToday.setHours(alarmTime.getHours(), alarmTime.getMinutes(), 0, 0);
          
          // Only adjust if the time today hasn't passed
          if (alarmTimeToday.getTime() > now.getTime()) {
            console.log(`🔧 Adjusting alarm ${alarm.id} from tomorrow to today`);
            alarmTime = alarmTimeToday;
          }
        }
      }
      
      // Debug logging
      console.log(`🔍 Alarm scheduling debug for ${alarm.id}:`, {
        alarmTimeISO: alarm.time,
        alarmTimeParsed: alarmTime.toISOString(),
        alarmTimeLocal: alarmTime.toLocaleString(),
        nowISO: now.toISOString(),
        nowLocal: now.toLocaleString(),
        timezone: alarm.timezone,
        isOneTime: isOneTimeAlarm,
      });
      
      // Don't schedule if alarm time is in the past (more than 1 minute ago)
      // Allow scheduling if it's within the last minute to catch alarms that just passed
      const timeDiff = alarmTime.getTime() - now.getTime();
      if (timeDiff < -60000) {
        console.log(`⚠️ Alarm ${alarm.id} time is too far in the past (${Math.round(timeDiff / 1000)}s), skipping scheduling`);
        console.log(`   Alarm time: ${alarmTime.toLocaleString()}, Now: ${now.toLocaleString()}`);
        return;
      }

      // Calculate delay in milliseconds
      const delay = alarmTime.getTime() - now.getTime();

      console.log(`📅 Scheduling alarm ${alarm.id} "${alarm.title}" for ${alarmTime.toISOString()} (in ${Math.round(delay / 1000)}s)`);

      // Schedule local notification
      // Convert alarm ID to numeric ID for notification (notifications need numeric IDs)
      const notificationId = this.getNotificationBaseId(alarm.id).toString();
      
      // Cancel any existing notification with this ID first
      PushNotification.cancelLocalNotification(notificationId.toString());
      
      PushNotification.localNotificationSchedule({
        id: notificationId.toString(),
        title: '⏰ Alarm',
        message: alarm.title,
        date: alarmTime,
        allowWhileIdle: true,
        ignoreInForeground: false,
        soundName: 'default', // System default sound
        playSound: true,
        vibrate: true,
        vibration: 1000,
        priority: 'max',
        importance: 'max',
        channelId: Platform.OS === 'android' ? this.alarmChannelId : undefined,
        data: {
          type: 'alarm',
          alarmId: alarm.id,
        },
        userInfo: {
          type: 'alarm',
          alarmId: alarm.id,
        },
        repeatType: this.getRepeatType(alarm.recurrenceRule),
        actions: ['["Dismiss", "Snooze"]'],
        // Ensure notification works when app is closed
        ongoing: false,
        autoCancel: true,
        // For Android: ensure it wakes up device and plays sound
        wakeUp: true,
        tag: `alarm_${alarm.id}`,
        // For iOS: ensure sound plays even in silent mode
        ...(Platform.OS === 'ios' && {
          category: 'ALARM',
        }),
      });
      
      console.log(`✅ Alarm ${alarm.id} scheduled successfully with notification ID: ${notificationId}`);

      // Handle recurrence
      if (alarm.recurrenceRule) {
        this.handleRecurrence(alarm);
      }
    } catch (error) {
      console.error(`❌ Failed to schedule alarm ${alarm.id}:`, error);
    }
  }

  /**
   * Schedule all alarms
   */
  scheduleAllAlarms(alarms: Alarm[]): void {
    console.log(`Scheduling ${alarms.length} alarms`);
    
    // Schedule each enabled alarm
    alarms.forEach(alarm => {
      if (alarm.enabled) {
        // Cancel existing notification for this alarm before rescheduling
        this.cancelAlarm(alarm.id);
        this.scheduleAlarm(alarm);
      }
    });
  }

  /**
   * Cancel a scheduled alarm
   */
  cancelAlarm(alarmId: string): void {
    try {
      console.log(`Cancelling alarm notification ${alarmId}`);
      // Convert alarm ID to numeric ID for notification
      const notificationId = this.getNotificationBaseId(alarmId);
      PushNotification.cancelLocalNotification(notificationId.toString());
    } catch (error) {
      console.error(`Failed to cancel alarm ${alarmId}:`, error);
    }
  }

  /**
   * Schedule a timer notification
   */
  scheduleTimer(timerId: string, title: string, remainingSeconds: number): void {
    try {
      const triggerTime = new Date(Date.now() + remainingSeconds * 1000);
      
      console.log(`Scheduling timer ${timerId} for ${triggerTime.toISOString()}`);

      // Convert timer ID to numeric ID for notification
      const notificationId = this.getNotificationBaseId(timerId).toString();

      PushNotification.localNotificationSchedule({
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
      });
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
  private getRepeatType(recurrenceRule?: string): string | undefined {
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

      console.log('🔔 Triggering immediate alarm notification:', {
        notificationId,
        alarmId: alarm.id,
        title: alarm.title,
      });

      PushNotification.localNotification({
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
      });
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

      console.log('🔔 Triggering immediate timer notification:', {
        notificationId,
        timerId: timer.id,
        title: timer.title,
      });

      PushNotification.localNotification({
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
      });
    } catch (error) {
      console.error(`Failed to trigger immediate timer notification ${timer.id}:`, error);
    }
  }
}

export const notificationService = new NotificationService();