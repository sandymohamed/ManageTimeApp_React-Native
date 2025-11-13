import { Alert, AlertButton, Vibration } from 'react-native';
import { Timer } from '@/types/alarm';
import { useAlarmStore } from '@/store/alarmStore';
import { navigate } from '@/utils/deepLinking';
import Sound from 'react-native-sound';

// Enable playback in background (optional)
Sound.setCategory('Playback');

export interface TimerNotificationOptions {
  title: string;
  body: string;
  sound?: string;
  vibrate?: boolean;
  priority?: 'high' | 'normal' | 'low';
  category?: string;
  data?: any;
}

class TimerNotificationService {
  private static instance: TimerNotificationService;
  private activeTimerNotifications: Set<string> = new Set();

  constructor() {
    this.initializeService();
  }

  static getInstance(): TimerNotificationService {
    if (!TimerNotificationService.instance) {
      TimerNotificationService.instance = new TimerNotificationService();
    }
    return TimerNotificationService.instance;
  }

  private initializeService() {
    // Initialize timer notification service
    console.log('Timer notification service initialized');
  }

  // Show timer completion notification
  showTimerCompletionNotification(timer: Timer): void {

    const notificationOptions: TimerNotificationOptions = {
      title: `⏰ ${timer.title} - Complete!`,
      body: `Your ${timer.duration}-minute timer has finished!`,
      sound: 'timer_complete',
      vibrate: true,
      priority: 'high',
      category: 'timer_completion',
      data: { timerId: timer.id, type: 'timer_completion' }
    };

    this.showNotification(notificationOptions);
    this.playTimerSound();
    this.vibrateDevice();
  }

  // Show timer pause notification
  showTimerPauseNotification(timer: Timer): void {

    const notificationOptions: TimerNotificationOptions = {
      title: `⏸️ ${timer.title} - Paused`,
      body: `Timer paused at ${this.formatTime(timer.remainingTime)} remaining`,
      sound: 'timer_pause',
      vibrate: false,
      priority: 'normal',
      category: 'timer_pause',
      data: { timerId: timer.id, type: 'timer_pause' }
    };

    this.showNotification(notificationOptions);
  }

  // Show timer start notification
  showTimerStartNotification(timer: Timer): void {

    const notificationOptions: TimerNotificationOptions = {
      title: `▶️ ${timer.title} - Started`,
      body: `Timer started for ${timer.duration} minutes`,
      sound: 'timer_start',
      vibrate: false,
      priority: 'normal',
      category: 'timer_start',
      data: { timerId: timer.id, type: 'timer_start' }
    };

    this.showNotification(notificationOptions);
  }

  // Show timer stop notification
  showTimerStopNotification(timer: Timer): void {

    const notificationOptions: TimerNotificationOptions = {
      title: `⏹️ ${timer.title} - Stopped`,
      body: `Timer stopped and marked as complete`,
      sound: 'timer_stop',
      vibrate: false,
      priority: 'normal',
      category: 'timer_stop',
      data: { timerId: timer.id, type: 'timer_stop' }
    };

    this.showNotification(notificationOptions);
  }

  // Show notification (this would integrate with actual notification library)
  private async showNotification(options: TimerNotificationOptions): Promise<void> {
    try {
      // In a real implementation, this would use a notification library
      // For now, we'll use React Native's Alert as a fallback
      const buttons = this.getNotificationButtons(options.data?.timerId, options.data?.type);

      Alert.alert(
        options.title,
        options.body,
        buttons,
        { cancelable: true }
      );

      if (options.data?.timerId) {
        this.activeTimerNotifications.add(options.data.timerId);
      }
    } catch (error) {
      console.error('Failed to show timer notification:', error);
    }
  }

  // Get appropriate buttons for different notification types
  private getNotificationButtons(timerId?: string, type?: string): AlertButton[] {
    switch (type) {
      case 'timer_completion':
        return [
          {
            text: 'Restart Timer',
            onPress: () => this.handleRestartTimer(timerId),
          },
          {
            text: 'Create New Timer',
            onPress: () => this.handleCreateNewTimer(),
          },
          {
            text: 'Dismiss',
            onPress: () => this.handleDismissTimer(timerId),
            style: 'cancel',
          },
        ];
      case 'timer_pause':
        return [
          {
            text: 'Resume',
            onPress: () => this.handleResumeTimer(timerId),
          },
          {
            text: 'Stop',
            onPress: () => this.handleStopTimer(timerId),
            style: 'destructive',
          },
          {
            text: 'Dismiss',
            onPress: () => this.handleDismissTimer(timerId),
            style: 'cancel',
          },
        ];
      default:
        return [
          {
            text: 'OK',
            onPress: () => this.handleDismissTimer(timerId),
          },
        ];
    }
  }

  // Vibrate the device
  private vibrateDevice(): void {
    try {
      // Vibration pattern for timer completion: short-short-short-long
      Vibration.vibrate([0, 200, 100, 200, 100, 200, 100, 500]);
    } catch (error) {
      console.error('Failed to vibrate device:', error);
    }
  }



  // Play timer sound
  private playTimerSound(soundType: string = 'timer_complete'): void {
    try {
      // In a real implementation, this would use a sound library
      console.log(`Playing timer sound: ${soundType}`);


      const sound = new Sound(require('./assets/audio/alarm.mp3'), (error) => {
        if (error) {
          Alert.alert('Error', 'Failed to load the sound');
          return;
        }
        sound.play((success) => {
          if (success) {
            console.log('successfully finished playing');
          } else {
            console.log('playback failed due to audio decoding errors');
          }
          // Release the sound when finished to free memory
          sound.release();
        });
      });


      // Sound.setCategory('Playback');
      const sound2 = new Sound(`alarm.mp3`, Sound.MAIN_BUNDLE);
      sound2.play();
    } catch (error) {
      console.error('Failed to play timer sound:', error);
    }
  }

  // Format time for display
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Handle restart timer
  private handleRestartTimer(timerId?: string): void {
    if (!timerId) return;
    const { resetTimer, startTimer } = useAlarmStore.getState();

    resetTimer(timerId)
      .then(() => startTimer(timerId))
      .then(() => this.handleDismissTimer(timerId))
      .catch((error) => {
        console.error(`Failed to restart timer ${timerId}:`, error);
      });
  }

  // Handle create new timer
  private handleCreateNewTimer(): void {
    console.log('Navigating to create new timer');
    navigate('Alarms', { initialTab: 'timers', showTimerModal: true });
  }

  // Handle resume timer
  private handleResumeTimer(timerId?: string): void {
    if (!timerId) return;
    const { startTimer } = useAlarmStore.getState();

    startTimer(timerId)
      .then(() => this.handleDismissTimer(timerId))
      .catch((error) => {
        console.error(`Failed to resume timer ${timerId}:`, error);
      });
  }

  // Handle stop timer
  private handleStopTimer(timerId?: string): void {
    if (!timerId) return;
    const { stopTimer } = useAlarmStore.getState();

    stopTimer(timerId)
      .then(() => this.handleDismissTimer(timerId))
      .catch((error) => {
        console.error(`Failed to stop timer ${timerId}:`, error);
      });
  }

  // Handle dismiss timer notification
  private handleDismissTimer(timerId?: string): void {
    if (timerId) {
      this.activeTimerNotifications.delete(timerId);
    }
  }

  // Show timer progress notification (for long timers)
  showTimerProgressNotification(timer: Timer, progressPercent: number): void {
    if (progressPercent < 0.25 || progressPercent > 0.75) return; // Only show at 25% and 75%

    const notificationOptions: TimerNotificationOptions = {
      title: `⏱️ ${timer.title} - Progress`,
      body: `${Math.round(progressPercent * 100)}% complete (${this.formatTime(timer.remainingTime)} remaining)`,
      sound: 'timer_progress',
      vibrate: false,
      priority: 'low',
      category: 'timer_progress',
      data: { timerId: timer.id, type: 'timer_progress' }
    };

    this.showNotification(notificationOptions);
  }

  // Show timer warning notification (5 minutes remaining)
  showTimerWarningNotification(timer: Timer): void {
    const notificationOptions: TimerNotificationOptions = {
      title: `⚠️ ${timer.title} - Warning`,
      body: `Only ${this.formatTime(timer.remainingTime)} remaining!`,
      sound: 'timer_warning',
      vibrate: true,
      priority: 'high',
      category: 'timer_warning',
      data: { timerId: timer.id, type: 'timer_warning' }
    };

    this.showNotification(notificationOptions);
  }

  // Cleanup method
  cleanup(): void {
    this.activeTimerNotifications.clear();
  }
}

export const timerNotificationService = TimerNotificationService.getInstance();
