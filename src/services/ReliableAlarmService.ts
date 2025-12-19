import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '@/types/alarm';
import { logger } from '@/utils/logger';
import { nativeAlarmBridge } from './NativeAlarmBridge';

export class ReliableAlarmService {
  private static instance: ReliableAlarmService;

  static getInstance(): ReliableAlarmService {
    if (!ReliableAlarmService.instance) {
      ReliableAlarmService.instance = new ReliableAlarmService();
    }
    return ReliableAlarmService.instance;
  }

  // Initialize - now just a placeholder for compatibility
  async initialize(): Promise<void> {
    logger.info('🔧 Initializing ReliableAlarmService (using native Android alarms)...');
    // Native alarms don't need initialization - they work via AlarmManager
  }

  // Schedule alarm using native Android AlarmManager
  async scheduleAlarm(alarm: Alarm): Promise<string> {
    const alarmId = alarm.id;
    
    logger.info(`📅 Scheduling native alarm "${alarm.title}"`);

    try {
      // Use native alarm bridge - schedules via Android AlarmManager
      await nativeAlarmBridge.scheduleAlarm(alarm);

      // Store alarm info for reference (optional, for UI purposes)
      await AsyncStorage.setItem(`alarm_${alarmId}`, JSON.stringify({
        id: alarmId,
        title: alarm.title,
        time: alarm.time,
        recurrenceRule: alarm.recurrenceRule,
        scheduledAt: Date.now(),
      }));

      logger.info('✅ Native alarm scheduled successfully');
      return alarmId;
    } catch (error) {
      logger.error('❌ Failed to schedule native alarm:', error);
      throw error;
    }
  }



  // Stop alarm - native alarms are stopped via notification actions
  // This method is kept for compatibility but doesn't play sound/vibration
  async stopAlarm(): Promise<void> {
    logger.info('🛑 Stopping alarm (stopping native service)...');
    try {
      // Stop the currently playing alarm sound/vibration
      await nativeAlarmBridge.stopPlayingAlarm();
      logger.info('✅ Native alarm service stopped');
    } catch (error) {
      logger.error('❌ Error stopping native alarm service:', error);
      // Continue with cleanup even if native stop fails
    }
    
    // Clean up storage
    await AsyncStorage.removeItem('active_alarm');
    logger.info('✅ Alarm stopped and cleaned up');
  }

  // Snooze alarm
  async snoozeAlarm(): Promise<void> {
    logger.info('😴 Snoozing alarm...');

    // Get active alarm info
    const activeAlarmStr = await AsyncStorage.getItem('active_alarm');
    if (activeAlarmStr) {
      const activeAlarm = JSON.parse(activeAlarmStr);
      
      // Schedule for 5 minutes later using native alarm
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

  // Cancel scheduled alarm
  async cancelAlarm(alarmId: string): Promise<void> {
    try {
      // Cancel via native alarm bridge
      await nativeAlarmBridge.cancelAlarm(alarmId);

      // Clean up storage
      await AsyncStorage.removeItem(`alarm_${alarmId}`);
      await AsyncStorage.removeItem(`alarm_notif_${alarmId}`);
      await AsyncStorage.removeItem(`alarm_timer_${alarmId}`);

      logger.info('✅ Alarm canceled successfully');
    } catch (error) {
      logger.error('❌ Error canceling alarm:', error);
    }
  }

  // Clean up everything
  async cleanUp(): Promise<void> {
    logger.info('🧹 Cleaning up alarms...');

    // Clear all stored alarms from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const alarmKeys = keys.filter(key => key.startsWith('alarm_'));
    await AsyncStorage.multiRemove(alarmKeys);

    logger.info('✅ Cleanup complete');
  }
}

export const reliableAlarmService = ReliableAlarmService.getInstance();

