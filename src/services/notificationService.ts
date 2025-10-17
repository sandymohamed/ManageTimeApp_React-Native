import { Platform, Alert, Vibration } from 'react-native';
import { Alarm } from '@/types/alarm';
import { useAlarmStore } from '@/store/alarmStore';

export interface NotificationOptions {
  title: string;
  body: string;
  sound?: string;
  vibrate?: boolean;
  priority?: 'high' | 'normal' | 'low';
  category?: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private scheduledAlarms: Map<string, NodeJS.Timeout> = new Map();
  private activeNotifications: Set<string> = new Set();

  constructor() {
    this.initializeService();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initializeService() {
    // Initialize notification permissions and setup
    this.requestPermissions();
  }

  private async requestPermissions() {
    // Request notification permissions
    // This would typically use a library like @react-native-async-storage/async-storage
    // or react-native-push-notification for actual implementation
    console.log('Requesting notification permissions...');
  }

  // Schedule an alarm to ring at the specified time
  scheduleAlarm(alarm: Alarm): void {
    const alarmTime = new Date(alarm.time);
    const now = new Date();
    const timeUntilAlarm = alarmTime.getTime() - now.getTime();

    // Clear existing alarm if it exists
    this.cancelAlarm(alarm.id);

    if (timeUntilAlarm <= 0) {
      console.log('Alarm time has already passed:', alarm.title);
      return;
    }

    console.log(`Scheduling alarm "${alarm.title}" for ${alarmTime.toLocaleString()}`);

    // Schedule the alarm
    const timeoutId = setTimeout(() => {
      this.triggerAlarm(alarm);
    }, timeUntilAlarm);

    this.scheduledAlarms.set(alarm.id, timeoutId);
  }

  // Cancel a scheduled alarm
  cancelAlarm(alarmId: string): void {
    const timeoutId = this.scheduledAlarms.get(alarmId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledAlarms.delete(alarmId);
      console.log(`Cancelled alarm: ${alarmId}`);
    }
  }

  // Trigger the alarm (ring, vibrate, show notification)
  private async triggerAlarm(alarm: Alarm): Promise<void> {
    console.log(`🔔 ALARM TRIGGERED: ${alarm.title}`);
    
    // Remove from scheduled alarms
    this.scheduledAlarms.delete(alarm.id);

    // Create notification options
    const notificationOptions: NotificationOptions = {
      title: `⏰ ${alarm.title}`,
      body: `It's time for your alarm!`,
      sound: alarm.toneUrl || 'default',
      vibrate: true,
      priority: 'high',
      category: 'alarm',
      data: { alarmId: alarm.id, type: 'alarm' }
    };

    // Show the alarm notification
    await this.showNotification(notificationOptions);

    // Vibrate the device
    this.vibrateDevice();

    // Play alarm sound
    this.playAlarmSound(alarm.toneUrl);

    // Show alarm screen/modal
    this.showAlarmModal(alarm);

    // Handle recurrence if applicable
    if (alarm.recurrenceRule) {
      this.handleRecurringAlarm(alarm);
    }
  }

  // Show notification (this would integrate with actual notification library)
  private async showNotification(options: NotificationOptions): Promise<void> {
    try {
      // In a real implementation, this would use a notification library
      // For now, we'll use React Native's Alert as a fallback
      Alert.alert(
        options.title,
        options.body,
        [
          {
            text: 'Snooze',
            onPress: () => this.handleSnooze(options.data?.alarmId),
          },
          {
            text: 'Dismiss',
            onPress: () => this.handleDismiss(options.data?.alarmId),
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );

      this.activeNotifications.add(options.data?.alarmId);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Vibrate the device
  private vibrateDevice(): void {
    try {
      // Vibration pattern for alarm: long-short-short-long
      Vibration.vibrate([0, 1000, 200, 500, 200, 500, 200, 1000]);
    } catch (error) {
      console.error('Failed to vibrate device:', error);
    }
  }

  // Play alarm sound
  private playAlarmSound(toneUrl?: string): void {
    try {
      // In a real implementation, this would use a sound library
      // For now, we'll just log the action
      console.log(`Playing alarm sound: ${toneUrl || 'default'}`);
      
      // This would typically use react-native-sound or similar
      // Sound.setCategory('Playback');
      // const sound = new Sound(toneUrl || 'alarm_default.mp3', Sound.MAIN_BUNDLE);
      // sound.play();
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
    }
  }

  // Show alarm modal/screen
  private showAlarmModal(alarm: Alarm): void {
    // This would typically navigate to an alarm screen or show a modal
    console.log(`Showing alarm modal for: ${alarm.title}`);
    
    // For now, we'll use Alert as a simple implementation
    Alert.alert(
      `⏰ ${alarm.title}`,
      `Alarm time! ${new Date().toLocaleTimeString()}`,
      [
        {
          text: 'Snooze (5 min)',
          onPress: () => this.handleSnooze(alarm.id, 5),
        },
        {
          text: 'Snooze (10 min)',
          onPress: () => this.handleSnooze(alarm.id, 10),
        },
        {
          text: 'Dismiss',
          onPress: () => this.handleDismiss(alarm.id),
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  }

  // Handle snooze functionality
  private handleSnooze(alarmId: string, duration: number = 5): void {
    console.log(`Snoozing alarm ${alarmId} for ${duration} minutes`);
    
    // Get the alarm from the store
    const alarm = useAlarmStore.getState().alarms.find(a => a.id === alarmId);
    if (!alarm) return;

    // Calculate new alarm time
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + duration);
    
    // Create snoozed alarm
    const snoozedAlarm: Alarm = {
      ...alarm,
      time: snoozeTime.toISOString(),
      title: `${alarm.title} (Snoozed)`,
    };

    // Schedule the snoozed alarm
    this.scheduleAlarm(snoozedAlarm);

    // Update the store
    useAlarmStore.getState().snoozeAlarm(alarmId, duration);
  }

  // Handle dismiss functionality
  private handleDismiss(alarmId: string): void {
    console.log(`Dismissing alarm ${alarmId}`);
    
    // Remove from active notifications
    this.activeNotifications.delete(alarmId);
    
    // Update the store
    useAlarmStore.getState().dismissAlarm(alarmId);
  }

  // Handle recurring alarms
  private handleRecurringAlarm(alarm: Alarm): void {
    if (!alarm.recurrenceRule) return;

    // Parse recurrence rule (simplified implementation)
    // In a real implementation, you'd use a library like rrule
    const nextAlarm = this.calculateNextRecurrence(alarm);
    if (nextAlarm) {
      this.scheduleAlarm(nextAlarm);
    }
  }

  // Calculate next recurrence (simplified)
  private calculateNextRecurrence(alarm: Alarm): Alarm | null {
    if (!alarm.recurrenceRule) return null;

    // This is a simplified implementation
    // In reality, you'd use a proper recurrence library
    const currentTime = new Date(alarm.time);
    const nextTime = new Date(currentTime);
    
    // Simple daily recurrence for now
    if (alarm.recurrenceRule.includes('DAILY')) {
      nextTime.setDate(nextTime.getDate() + 1);
      return {
        ...alarm,
        time: nextTime.toISOString(),
      };
    }

    return null;
  }

  // Schedule all enabled alarms
  scheduleAllAlarms(alarms: Alarm[]): void {
    console.log(`Scheduling ${alarms.length} alarms`);
    
    // Clear existing scheduled alarms
    this.scheduledAlarms.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledAlarms.clear();

    // Schedule each enabled alarm
    alarms
      .filter(alarm => alarm.enabled)
      .forEach(alarm => {
        this.scheduleAlarm(alarm);
      });
  }

  // Cancel all scheduled alarms
  cancelAllAlarms(): void {
    console.log('Cancelling all scheduled alarms');
    this.scheduledAlarms.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledAlarms.clear();
  }

  // Get scheduled alarm count
  getScheduledAlarmCount(): number {
    return this.scheduledAlarms.size;
  }

  // Check if alarm is scheduled
  isAlarmScheduled(alarmId: string): boolean {
    return this.scheduledAlarms.has(alarmId);
  }

  // Cleanup method
  cleanup(): void {
    this.cancelAllAlarms();
    this.activeNotifications.clear();
  }
}

export const notificationService = NotificationService.getInstance();
