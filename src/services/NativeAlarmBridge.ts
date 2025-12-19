import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '@/types/alarm';
import { logger } from '@/utils/logger';

const { AlarmModule } = NativeModules;

/**
 * Native Alarm Bridge
 * 
 * This service bridges React Native code with the native Android AlarmModule.
 * All alarm scheduling/cancellation is handled by Android AlarmManager for reliability.
 */
class NativeAlarmBridge {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'android' && AlarmModule) {
      this.eventEmitter = new NativeEventEmitter(AlarmModule);
      this.setupEventListeners();
    }
  }

  /**
   * Setup event listeners for native alarm events
   */
  private setupEventListeners(): void {
    if (!this.eventEmitter) return;

    // Listen for snooze events
    // Note: The actual snooze handling is done by alarmStore.snoozeAlarm() which is called
    // from AlarmsScreen or other components that listen to these events
    this.eventEmitter.addListener('AlarmSnooze', (event: { alarmId: string; action: string }) => {
      logger.info('🔔 Native alarm snooze event received:', event.alarmId);
      // Store the alarm ID so UI components can handle it
      AsyncStorage.setItem('pending_snooze_alarm_id', event.alarmId).catch(() => {});
    });

    // Listen for stop events
    // Note: The alarm sound/vibration is already stopped by AlarmActionReceiver
    // This event just notifies JS to clean up UI state
    this.eventEmitter.addListener('AlarmStop', async (event: { alarmId: string; action: string }) => {
      logger.info('🔔 Native alarm stop event received:', event.alarmId);
      try {
        // Clear any pending alarm state
        await AsyncStorage.removeItem('pending_alarm_id').catch(() => {});
        await AsyncStorage.removeItem('active_alarm').catch(() => {});
        logger.info('✅ Alarm stopped - state cleared');
      } catch (error) {
        logger.error('❌ Failed to clear alarm state:', error);
      }
    });

    // Listen for alarm fired events (for UI updates)
    this.eventEmitter.addListener('AlarmFired', (event: { alarmId: string; title: string; action: string }) => {
      logger.info('🔔 Native alarm fired event:', event.alarmId);
      // Store pending alarm for UI
      AsyncStorage.setItem('pending_alarm_id', event.alarmId).catch(err => {
        logger.error('Failed to store pending alarm ID:', err);
      });
    });
  }

  /**
   * Schedule an alarm using native Android AlarmManager
   */
  async scheduleAlarm(alarm: Alarm): Promise<void> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      logger.warn('⚠️ Native AlarmModule not available');
      return;
    }

    try {
      const alarmTime = new Date(alarm.time);
      const timestamp = alarmTime.getTime();

      // Ensure alarm time is in the future
      if (timestamp <= Date.now()) {
        logger.warn('⚠️ Alarm time is in the past, calculating next occurrence');
        // For recurring alarms, calculate next occurrence
        if (alarm.recurrenceRule && alarm.recurrenceRule !== 'none') {
          const nextTime = this.calculateNextOccurrence(alarmTime, alarm.recurrenceRule);
          return this.scheduleAlarm({ ...alarm, time: nextTime.toISOString() });
        } else {
          logger.warn('⚠️ One-time alarm in the past, skipping');
          return;
        }
      }

      await AlarmModule.scheduleAlarm(
        alarm.id,
        timestamp,
        alarm.title,
        alarm.toneUrl || null,
        alarm.recurrenceRule || null
      );

      logger.info(`✅ Native alarm scheduled: ${alarm.title} at ${alarmTime.toISOString()}`);
    } catch (error) {
      logger.error('❌ Failed to schedule native alarm:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled alarm
   */
  async cancelAlarm(alarmId: string): Promise<void> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      logger.warn('⚠️ Native AlarmModule not available');
      return;
    }

    try {
      await AlarmModule.cancelAlarm(alarmId);
      logger.info(`✅ Native alarm canceled: ${alarmId}`);
    } catch (error) {
      logger.error('❌ Failed to cancel native alarm:', error);
      throw error;
    }
  }

  /**
   * Open system ringtone picker
   */
  async pickRingtone(): Promise<string | null> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      logger.warn('⚠️ Native AlarmModule not available');
      return null;
    }

    try {
      const uri = await AlarmModule.pickRingtone();
      return uri;
    } catch (error) {
      logger.error('❌ Failed to pick ringtone:', error);
      return null;
    }
  }

  /**
   * Get default alarm ringtone URI
   */
  async getDefaultRingtoneUri(): Promise<string | null> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      logger.warn('⚠️ Native AlarmModule not available');
      return null;
    }

    try {
      const uri = await AlarmModule.getDefaultRingtoneUri();
      return uri;
    } catch (error) {
      logger.error('❌ Failed to get default ringtone:', error);
      return null;
    }
  }

  /**
   * Stop currently playing alarm
   */
  async stopPlayingAlarm(): Promise<void> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      logger.warn('⚠️ Native AlarmModule not available');
      return;
    }

    try {
      await AlarmModule.stopPlayingAlarm();
      logger.info('✅ Alarm stopped successfully');
    } catch (error) {
      logger.error('❌ Failed to stop playing alarm:', error);
      throw error;
    }
  }

  /**
   * Calculate next occurrence for recurring alarms
   */
  private calculateNextOccurrence(alarmTime: Date, recurrenceRule: string): Date {
    const now = new Date();
    const next = new Date(alarmTime);

    if (recurrenceRule.includes('FREQ=DAILY') || recurrenceRule === 'daily') {
      // Daily - add 1 day until in the future
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

  /**
   * Remove event listeners
   */
  removeListeners(): void {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('AlarmSnooze');
      this.eventEmitter.removeAllListeners('AlarmStop');
    }
  }
}

export const nativeAlarmBridge = new NativeAlarmBridge();
