/**
 * Utility functions to clean up all alarm/timer related state from AsyncStorage
 * This prevents ghost alarms/timers from auto-triggering
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear ALL alarm/timer related AsyncStorage keys
 * Use this when stopping alarms/timers or on app startup
 */
export async function clearAllAlarmTimerState(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    
    // Find all alarm/timer related keys
    const keysToRemove = keys.filter(key => 
      key.startsWith('pending_') ||
      key.startsWith('active_') ||
      key.startsWith('timer_') ||
      key.startsWith('alarm_')
    );

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`🧹 Cleaned up ${keysToRemove.length} alarm/timer state keys:`, keysToRemove);
    }
  } catch (error) {
    console.error('❌ Error clearing alarm/timer state:', error);
  }
}

/**
 * Clear specific timer state
 */
export async function clearTimerState(timerId: string): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      `timer_end_time_${timerId}`,
      `timer_running_${timerId}`,
      `pending_timer_id`,
    ]);
  } catch (error) {
    console.error(`❌ Error clearing timer state for ${timerId}:`, error);
  }
}

/**
 * Clear specific alarm state
 */
export async function clearAlarmState(alarmId: string): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      `active_alarm`,
      `active_alarm_id`,
      `pending_alarm_id`,
      `alarm_${alarmId}`,
      `alarm_timer_${alarmId}`,
    ]);
  } catch (error) {
    console.error(`❌ Error clearing alarm state for ${alarmId}:`, error);
  }
}

/**
 * Check if there are any pending alarms/timers and clear them if alarms/timers don't exist
 */
export async function validateAndCleanPendingState(
  alarms: Array<{ id: string }>,
  timers: Array<{ id: string }>
): Promise<void> {
  try {
    // Check pending alarm
    const pendingAlarmId = await AsyncStorage.getItem('pending_alarm_id');
    if (pendingAlarmId) {
      const alarmExists = alarms.some(a => a.id === pendingAlarmId);
      if (!alarmExists) {
        console.log('🧹 Removing orphaned pending_alarm_id:', pendingAlarmId);
        await AsyncStorage.removeItem('pending_alarm_id');
      }
    }

    // Check pending timer
    const pendingTimerId = await AsyncStorage.getItem('pending_timer_id');
    if (pendingTimerId) {
      const timerExists = timers.some(t => t.id === pendingTimerId);
      if (!timerExists) {
        console.log('🧹 Removing orphaned pending_timer_id:', pendingTimerId);
        await AsyncStorage.removeItem('pending_timer_id');
      }
    }

    // Check active alarm
    const activeAlarmStr = await AsyncStorage.getItem('active_alarm');
    if (activeAlarmStr) {
      try {
        const activeAlarm = JSON.parse(activeAlarmStr);
        const alarmExists = alarms.some(a => a.id === activeAlarm.id);
        if (!alarmExists) {
          console.log('🧹 Removing orphaned active_alarm:', activeAlarm.id);
          await AsyncStorage.removeItem('active_alarm');
        }
      } catch (e) {
        // Invalid JSON, remove it
        await AsyncStorage.removeItem('active_alarm');
      }
    }

    // Check active alarm ID
    const activeAlarmId = await AsyncStorage.getItem('active_alarm_id');
    if (activeAlarmId) {
      const alarmExists = alarms.some(a => a.id === activeAlarmId);
      if (!alarmExists) {
        console.log('🧹 Removing orphaned active_alarm_id:', activeAlarmId);
        await AsyncStorage.removeItem('active_alarm_id');
      }
    }

    // Check timer running states
    const allKeys = await AsyncStorage.getAllKeys();
    const timerKeys = allKeys.filter(key => 
      key.startsWith('timer_end_time_') || key.startsWith('timer_running_')
    );
    
    for (const key of timerKeys) {
      const timerId = key.replace('timer_end_time_', '').replace('timer_running_', '');
      const timerExists = timers.some(t => t.id === timerId);
      if (!timerExists) {
        console.log('🧹 Removing orphaned timer state:', key);
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('❌ Error validating pending state:', error);
  }
}

