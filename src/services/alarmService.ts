// @ts-ignore - react-native-alarm-notification may not have TypeScript definitions
import RNAlarmNotification from 'react-native-alarm-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, Timer } from '@/types/alarm';
import { logger } from '@/utils/logger';

/**
 * Native Alarm Service - Uses Android AlarmManager for reliable alarms
 * This service handles native alarm scheduling that works even when app is closed
 */
export class NativeAlarmService {
  /**
   * Schedule a native alarm using Android AlarmManager
   * Works even when app is completely closed
   */
  static scheduleAlarm(alarm: Alarm): void {
    try {
      // Check if native alarm library is available
      if (!RNAlarmNotification || typeof RNAlarmNotification.scheduleAlarm !== 'function') {
        logger.warn('⚠️ Native alarm library not available, relying on push notifications');
        return;
      }

      const alarmId = this.getNotificationId(alarm.id, 1000);
      const alarmTime = new Date(alarm.time);
      
      // Ensure alarm time is in the future
      if (alarmTime.getTime() <= Date.now()) {
        logger.warn('⚠️ Alarm time is in the past, skipping native scheduling:', alarmTime.toISOString());
        return;
      }
      
      // Parse recurrence rule
      const { scheduleType, intervalValue, intervalType } = this.parseRecurrenceRule(alarm.recurrenceRule);
      
      const alarmDetails: any = {
        id: alarmId,
        title: `${alarm.title}`,
        message: `Alarm at ${alarmTime.toLocaleTimeString()}`,
        channel: 'alarm_channel',
        ticker: 'Alarm Notification Ticker',
        auto_cancel: false, // Don't auto-cancel so it keeps ringing
        vibrate: true,
        vibration: 100,
        tag: `alarm_${alarm.id}`,
        small_icon: 'ic_launcher',
        large_icon: 'ic_launcher',
        play_sound: true,
        sound_name: 'alarm', // References alarm.mp3 in res/raw/alarm.mp3
        color: 'blue',
        schedule_type: scheduleType,
        interval_value: intervalValue,
        interval_type: intervalType,
        data: { 
          alarmId: alarm.id,
          type: 'ALARM',
          title: alarm.title,
          time: alarm.time,
        },
        fire_date: alarmTime.getTime(), // milliseconds
        has_button: true,
        button_text: 'Open',
        button_text_snooze: 'Snooze',
        button_text_dismiss: 'Dismiss',
      };

  
      RNAlarmNotification.scheduleAlarm(alarmDetails);
    } catch (error) {
      logger.error(' Failed to schedule native alarm:', error);
      // Don't throw - fallback to push notifications
    }
  }

  /**
   * Schedule a timer completion notification using native AlarmManager
   */
  static scheduleTimer(timer: Timer): void {
    try {
      const timerId = this.getNotificationId(timer.id, 2000);
      const fireDate = new Date(Date.now() + timer.remainingTime * 1000);
      
      const alarmDetails: any = {
        id: timerId,
        title: `⏱️ ${timer.title}`,
        message: 'Timer finished!',
        channel: 'timer_channel',
        ticker: 'Timer Notification Ticker',
        auto_cancel: true,
        vibrate: true,
        vibration: 100,
        tag: `timer_${timer.id}`,
        small_icon: 'ic_launcher',
        large_icon: 'ic_launcher',
        play_sound: true,
        sound_name: 'alarm', // References alarm.mp3 in res/raw/
        color: 'green',
        schedule_type: 'once',
        data: { 
          timerId: timer.id,
          type: 'TIMER',
          title: timer.title,
        },
        fire_date: fireDate.getTime(),
        has_button: true,
        button_text: 'Open',
        button_text_dismiss: 'Dismiss',
      };

      logger.info('📅 Scheduling native timer completion:', {
        timerId: timer.id,
        notificationId: timerId,
        fireDate: fireDate.toISOString(),
        remainingSeconds: timer.remainingTime,
      });
      
      RNAlarmNotification.scheduleAlarm(alarmDetails);
      logger.info('✅ Native timer scheduled successfully');
    } catch (error) {
      logger.error('❌ Failed to schedule native timer:', error);
    }
  }

  /**
   * Cancel a native alarm
   */
  static cancelAlarm(alarmId: string): void {
    try {
      const id = this.getNotificationId(alarmId, 1000);
      RNAlarmNotification.deleteAlarm(id);
      logger.info('✅ Native alarm cancelled:', alarmId);
    } catch (error) {
      logger.error('❌ Failed to cancel native alarm:', error);
    }
  }

  /**
   * Cancel a native timer
   */
  static cancelTimer(timerId: string): void {
    try {
      const id = this.getNotificationId(timerId, 2000);
      RNAlarmNotification.deleteAlarm(id);
      logger.info('✅ Native timer cancelled:', timerId);
    } catch (error) {
      logger.error('❌ Failed to cancel native timer:', error);
    }
  }

  /**
   * Cancel all native alarms
   */
  static cancelAll(): void {
    try {
      RNAlarmNotification.deleteAllAlarms();
      logger.info('✅ All native alarms cancelled');
    } catch (error) {
      logger.error('❌ Failed to cancel all alarms:', error);
    }
  }

  /**
   * Setup notification listeners for native alarms
   * Note: These methods may not exist in all versions of react-native-alarm-notification
   */
  static setupNotificationListeners(): void {
    try {
      // Handle when alarm fires - check if method exists
      if (typeof RNAlarmNotification?.onNotificationOpened === 'function') {
        RNAlarmNotification.onNotificationOpened((notification: any) => {
          logger.info('🔔 Native alarm fired:', notification);
          const data = notification.data || {};
          
          if (data.type === 'ALARM') {
            // Store in AsyncStorage for AlarmsScreen to pick up
            AsyncStorage.setItem('pending_alarm_id', data.alarmId).catch(err => {
              logger.error('Failed to store pending alarm ID:', err);
            });
          } else if (data.type === 'TIMER') {
            AsyncStorage.setItem('pending_timer_id', data.timerId).catch(err => {
              logger.error('Failed to store pending timer ID:', err);
            });
          }
        });
      } else {
        logger.warn('⚠️ onNotificationOpened not available in react-native-alarm-notification');
      }

      // Handle button clicks (Snooze/Dismiss) - check if method exists
      if (typeof RNAlarmNotification?.onNotificationButtonClicked === 'function') {
        RNAlarmNotification.onNotificationButtonClicked((notification: any) => {
          logger.info('🔘 Native alarm button clicked:', notification);
          const { button_pressed, data } = notification;
          
          if (button_pressed === 'snooze') {
            // Handle snooze - schedule alarm for 5 minutes later
            const alarmTime = new Date(Date.now() + 5 * 60 * 1000);
            this.scheduleAlarm({
              id: `${data.alarmId}_snooze`,
              title: `${data.title} (Snooze)`,
              time: alarmTime.toISOString(),
              recurrenceRule: 'none',
              enabled: true,
            } as Alarm);
          } else if (button_pressed === 'dismiss') {
            // Remove from AsyncStorage
            if (data.type === 'ALARM') {
              AsyncStorage.removeItem('pending_alarm_id').catch(() => {});
            } else if (data.type === 'TIMER') {
              AsyncStorage.removeItem('pending_timer_id').catch(() => {});
            }
          }
        });
      } else {
        logger.warn('⚠️ onNotificationButtonClicked not available in react-native-alarm-notification');
      }

      logger.info('✅ Native alarm notification listeners setup complete');
    } catch (error) {
      logger.error('❌ Failed to setup native alarm listeners:', error);
    }
  }

  /**
   * Parse recurrence rule to get schedule type and interval
   */
  private static parseRecurrenceRule(recurrenceRule: string | null | undefined): {
    scheduleType: 'once' | 'repeat';
    intervalValue: number;
    intervalType: 'day' | 'week' | 'month' | 'once';
  } {
    if (!recurrenceRule || recurrenceRule === 'none') {
      return { scheduleType: 'once', intervalValue: 0, intervalType: 'once' };
    }

    // Parse RRULE format (e.g., "FREQ=DAILY", "FREQ=WEEKLY;BYDAY=MO,TU", "FREQ=MONTHLY;BYMONTHDAY=15")
    if (recurrenceRule.includes('FREQ=DAILY')) {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'day' };
    } else if (recurrenceRule.includes('FREQ=WEEKLY')) {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'week' };
    } else if (recurrenceRule.includes('FREQ=MONTHLY')) {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'month' };
    } else if (recurrenceRule.includes('FREQ=YEARLY')) {
      return { scheduleType: 'repeat', intervalValue: 1, intervalType: 'month' }; // Approximate
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

  /**
   * Get numeric notification ID from string ID
   */
  private static getNotificationId(sourceId: string, baseOffset: number): number {
    // Extract numeric part from UUID or use hash
    const numericPart = parseInt(sourceId.replace(/\D/g, '').slice(-8) || '0', 10);
    return (numericPart % 10000) + baseOffset; // Keep within reasonable range
  }
}
