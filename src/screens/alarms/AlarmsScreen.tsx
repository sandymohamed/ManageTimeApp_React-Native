import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Switch, 
  Alert, 
  Platform, 
  AppState,
  AppStateStatus,
  Vibration
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import BackgroundTimer from 'react-native-background-timer';
import { Text, FAB, Card, Button, Chip, SegmentedButtons, Portal, Modal, TextInput, IconButton, Dialog } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useAlarmStore } from '@/store/alarmStore';
import { Alarm, Timer } from '@/types/alarm';
import { notificationService } from '@/services/notificationService';
import { headlessTaskHandler } from '@/services/headlessTaskHandler';
import { reliableAlarmService } from '@/services/ReliableAlarmService';
import { validateAndCleanPendingState, clearTimerState, clearAlarmState } from '@/utils/alarmCleanup';

// Navigation types
type RootStackParamList = {
  AlarmCreate: undefined;
};

type NavigationProp = {
  navigate: (screen: keyof RootStackParamList) => void;
};

// Sound Manager
class SoundManager {
  private sound: Sound | null = null;
  private isPlaying = false;

  playAlarmSound() {
    if (this.isPlaying) return;
    
    try {
      Sound.setCategory('Playback', true);
      this.sound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error('Failed to load sound:', error);
          return;
        }
        this.sound?.setNumberOfLoops(-1);
        this.sound?.setVolume(1.0);
        this.sound?.play();
        this.isPlaying = true;
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  stopSound() {
    if (this.sound) {
      this.sound.stop();
      this.sound.release();
      this.sound = null;
      this.isPlaying = false;
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const AlarmsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'alarms' | 'timers'>('alarms');
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerTitle, setTimerTitle] = useState('New Timer');
  const [timerDuration, setTimerDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  
  // Alarm/timer playing state
  const [activeAlarmId, setActiveAlarmId] = useState<string | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [timeUpdateKey, setTimeUpdateKey] = useState(0);

  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const soundManager = useRef(new SoundManager()).current;
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isFocused = useIsFocused();
  const [pendingAlarm, setPendingAlarm] = useState<Alarm | null>(null);
  const [pendingTimer, setPendingTimer] = useState<{ id: string; title: string } | null>(null);
  
  // Timer background tracking
  const timerStartTimeRef = useRef<number | null>(null);
  const timerPausedTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const backgroundTimerRef = useRef<number | null>(null);
  const backgroundRemainingRef = useRef<number | null>(null);

  const {
    alarms,
    timers,
    activeTimer,
    loading,
    error,
    fetchAlarms,
    fetchTimers,
    createTimer,
    deleteTimer,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setActiveTimer,
    updateTimerRemainingTime,
    clearError,
    toggleAlarm,
    deleteAlarm,
    dismissAlarm,
  } = useAlarmStore();

  // Refresh alarms when screen is focused (e.g., after creating a routine)
  // This ensures alarms created from routines are visible
  useEffect(() => {
    if (isFocused) {
      console.log('🔄 AlarmsScreen focused - refreshing alarms and timers...');
      // Immediate refresh
      fetchAlarms();
      fetchTimers();
      
      // Also refresh after a short delay to catch async alarm creation from routines
      const delayedRefresh = setTimeout(() => {
        console.log('🔄 Delayed refresh for routine-created alarms...');
        fetchAlarms();
        fetchTimers();
      }, 2000); // 2 seconds delay
      
      return () => clearTimeout(delayedRefresh);
    }
  }, [isFocused, fetchAlarms, fetchTimers]);

  // Track fired alarms per minute to prevent duplicates
  const firedAlarmsRef = useRef<Set<string>>(new Set());
  const alarmDeleteTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const autoDeleteFailuresRef = useRef<Set<string>>(new Set());
  // Track alarms that were stopped this occurrence to prevent re-ringing
  const stoppedAlarmsThisOccurrenceRef = useRef<Map<string, number>>(new Map());

  const getAlarmMinuteKey = (alarmId: string, alarmTime: Date, isRecurring: boolean): string => {
    if (isRecurring) {
      return `${alarmId}-${alarmTime.getHours()}-${alarmTime.getMinutes()}`;
    }
    return `${alarmId}-${alarmTime.getTime()}`;
  };

  // Use ref for handleAlarmFired to avoid dependency issues
  const handleAlarmFiredRef = useRef<((alarm: Alarm) => void) | null>(null);

  // Check alarms that should have fired
  const checkAlarmsThatShouldHaveFired = React.useCallback(() => {
    const now = new Date();
    const routineAlarms = alarms.filter(a => a.enabled && a.title?.includes('Routine:'));
    if (routineAlarms.length > 0) {
      console.log(`🔍 Checking ${routineAlarms.length} routine alarms at ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
    }
    alarms.forEach((alarm) => {
      if (!alarm.enabled) return;
      
      // Don't process if we're currently stopping alarms
      if (isStopping) return;

      const alarmTime = new Date(alarm.time);
      const isRecurring = !!(alarm.recurrenceRule && alarm.recurrenceRule !== 'none');
      
      // Don't check if alarm is already active (prevents loops)
      if (activeAlarmId === alarm.id) {
        return;
      }
      
      // Check if alarm should fire
      let shouldFire = false;
      if (isRecurring) {
        // For recurring alarms, check if current time matches alarm time (within 1 minute window)
        // Fire if we're at the exact minute (any second within that minute)
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const alarmMinutes = alarmTime.getHours() * 60 + alarmTime.getMinutes();
        // Fire only at the exact minute (not before or after)
        shouldFire = currentMinutes === alarmMinutes;
        
        // Debug log for routine alarms
        if (alarm.title.includes('Routine:')) {
          console.log(`🔍 Checking routine alarm "${alarm.title}": current=${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}, alarm=${alarmTime.getHours()}:${alarmTime.getMinutes()}, shouldFire=${shouldFire}`);
        }
      } else {
        // For one-time alarms, check if time has passed (within 1 minute window)
        const timeDiff = now.getTime() - alarmTime.getTime();
        shouldFire = timeDiff >= 0 && timeDiff <= 60000; // 1 minute window
      }

      if (shouldFire) {
        const minuteKey = getAlarmMinuteKey(alarm.id, alarmTime, isRecurring);
        
        // Check if this alarm was already stopped for this occurrence
        // Only prevent re-ringing if stopped within the same minute window
        const stoppedTime = stoppedAlarmsThisOccurrenceRef.current.get(alarm.id);
        if (stoppedTime) {
          const timeSinceStop = now.getTime() - stoppedTime;
          const stoppedDate = new Date(stoppedTime);
          const stoppedMinutes = stoppedDate.getHours() * 60 + stoppedDate.getMinutes();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const isSameMinute = currentMinutes === stoppedMinutes;
          const isSameDay = stoppedDate.getDate() === now.getDate() && 
                           stoppedDate.getMonth() === now.getMonth() &&
                           stoppedDate.getFullYear() === now.getFullYear();
          
          // Only prevent if:
          // 1. Stopped within the last 2 minutes AND
          // 2. We're in the same minute AND  
          // 3. It's the same day
          // This prevents re-ringing in the same minute after stopping, but allows next day
          if (timeSinceStop < 2 * 60000 && isSameMinute && isSameDay) {
            if (alarm.title.includes('Routine:')) {
              console.log(`🚫 Routine alarm ${alarm.id} was stopped in same minute today, skipping re-fire`);
            }
            return; // Don't fire - was recently stopped in same minute today
          } else {
            // Clear the stopped marker if it's old, different minute, or different day
            stoppedAlarmsThisOccurrenceRef.current.delete(alarm.id);
            if (alarm.title.includes('Routine:')) {
              console.log(`🧹 Cleared stopped marker for routine alarm ${alarm.id} (old/different minute/day)`);
            }
          }
        }
        
        // Only fire if we haven't fired for this minute key
        // This prevents multiple fires in the same minute window
        if (!firedAlarmsRef.current.has(minuteKey)) {
          console.log(`✅ Firing alarm: ${alarm.title} at ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
          firedAlarmsRef.current.add(minuteKey);
          if (handleAlarmFiredRef.current) {
            handleAlarmFiredRef.current(alarm);
          }
          
          // For recurring alarms, clear the key after 2 minutes to allow next occurrence
          // For one-time alarms, clear after 5 minutes
          const clearTimeout = isRecurring ? 2 * 60 * 1000 : 5 * 60 * 1000;
          setTimeout(() => {
            firedAlarmsRef.current.delete(minuteKey);
          }, clearTimeout);
        }
      }
    });
  }, [alarms, activeAlarmId, isStopping]);

  // Register alarm check function with global alarm engine
  useEffect(() => {
    const { registerAlarmCheckFunction, unregisterAlarmCheckFunction } = require('@/services/GlobalAlarmEngine');
    
    // Register our check function with the global engine
    registerAlarmCheckFunction(checkAlarmsThatShouldHaveFired);
    
    // Cleanup: unregister when component unmounts (optional, engine handles missing function gracefully)
    return () => {
      unregisterAlarmCheckFunction();
    };
  }, [checkAlarmsThatShouldHaveFired]);

  // Timer countdown with background support using BackgroundTimer
  const startTimerCountdown = (timer: Timer) => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      if (Platform.OS === 'android') {
        BackgroundTimer.clearInterval(timerIntervalRef.current as number);
      } else {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = null;
    }

    // Calculate start time and end time
    const now = Date.now();
    const endTime = now + (timer.remainingTime * 1000);
    timerStartTimeRef.current = now;
    timerPausedTimeRef.current = 0;

    // Store timer end time in AsyncStorage for recovery
    AsyncStorage.setItem(`timer_end_time_${timer.id}`, endTime.toString()).catch(console.error);
    AsyncStorage.setItem(`timer_running_${timer.id}`, 'true').catch(console.error);

    // Initial notification update
    notificationService.updateTimerNotification(timer.id, timer.title, timer.remainingTime);

    // Use BackgroundTimer for Android (works in background), regular setInterval for iOS
    const intervalCallback = () => {
      const currentTimer = timers.find(t => t.id === timer.id);
      if (!currentTimer || !currentTimer.isRunning || currentTimer.isPaused) {
        if (timerIntervalRef.current) {
          if (Platform.OS === 'android') {
            BackgroundTimer.clearInterval(timerIntervalRef.current as number);
          } else {
            clearInterval(timerIntervalRef.current);
          }
          timerIntervalRef.current = null;
        }
        AsyncStorage.removeItem(`timer_end_time_${timer.id}`).catch(console.error);
        AsyncStorage.removeItem(`timer_running_${timer.id}`).catch(console.error);
        return;
      }

      // Calculate remaining time from end time
      const currentTime = Date.now();
      const newRemaining = Math.max(0, Math.floor((endTime - currentTime) / 1000));

      if (newRemaining <= 0) {
        // Timer completed
        AsyncStorage.removeItem(`timer_end_time_${timer.id}`).catch(console.error);
        AsyncStorage.removeItem(`timer_running_${timer.id}`).catch(console.error);
        if (timerIntervalRef.current) {
          if (Platform.OS === 'android') {
            BackgroundTimer.clearInterval(timerIntervalRef.current as number);
          } else {
            clearInterval(timerIntervalRef.current);
          }
          timerIntervalRef.current = null;
        }
        handleTimerCompletion(currentTimer);
      } else {
        // Update timer state
        updateTimerRemainingTime(currentTimer.id, newRemaining);
        
        // Update notification every second - this works even in background with BackgroundTimer
        notificationService.updateTimerNotification(currentTimer.id, currentTimer.title, newRemaining);
      }
    };

    // Start countdown using BackgroundTimer for Android
    if (Platform.OS === 'android') {
      timerIntervalRef.current = BackgroundTimer.setInterval(intervalCallback, 1000) as any;
    } else {
      timerIntervalRef.current = setInterval(intervalCallback, 1000);
    }
  };

  // Handle app state changes for timer
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appState.current;
      appState.current = nextAppState;

      if (nextAppState.match(/inactive|background/)) {
        const runningTimer = timers.find(t => t.isRunning && !t.isPaused);
        if (runningTimer) {
          backgroundTimerRef.current = Date.now();
          backgroundRemainingRef.current = runningTimer.remainingTime;
        }
      }

      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        fetchTimers();
        fetchAlarms();

        const runningTimer = timers.find(t => t.isRunning && !t.isPaused);
        if (runningTimer && backgroundTimerRef.current) {
          const elapsed = Math.floor((Date.now() - backgroundTimerRef.current) / 1000);
          const baseRemaining = backgroundRemainingRef.current ?? runningTimer.remainingTime;
          const recalculatedRemaining = Math.max(0, baseRemaining - elapsed);

          if (recalculatedRemaining !== runningTimer.remainingTime) {
            updateTimerRemainingTime(runningTimer.id, recalculatedRemaining);

            if (recalculatedRemaining <= 0) {
              handleTimerCompletion({ ...runningTimer, remainingTime: 0 });
            }
          }
        }

        backgroundTimerRef.current = null;
        backgroundRemainingRef.current = null;

        checkAlarmsThatShouldHaveFired();
      }
    });

    return () => subscription.remove();
  }, [timers, fetchTimers, fetchAlarms, updateTimerRemainingTime]);

  // Check for pending alarms/timers from push notifications when app opens
  // IMPORTANT: Only trigger if alarm/timer actually exists (prevents ghost alarms)
  useEffect(() => {
    const checkPendingNotifications = async () => {
      try {
        // Validate and clean orphaned state first
        await validateAndCleanPendingState(alarms, timers);
        
        // Check for pending alarm from push notification
        const pendingAlarmId = await AsyncStorage.getItem('pending_alarm_id');
        if (pendingAlarmId) {
          await AsyncStorage.removeItem('pending_alarm_id'); // Remove immediately to prevent retrigger
          const alarm = alarms.find(a => a.id === pendingAlarmId);
          // ONLY trigger if alarm exists AND is enabled
          if (alarm && alarm.enabled) {
            console.log('🎯 Triggering alarm from push notification:', alarm.title);
            handleAlarmFired(alarm);
          } else {
            console.log('🧹 Ignoring pending alarm - not found or disabled:', pendingAlarmId);
          }
        }
        
        // Check for pending timer from push notification
        const pendingTimerId = await AsyncStorage.getItem('pending_timer_id');
        if (pendingTimerId) {
          await AsyncStorage.removeItem('pending_timer_id'); // Remove immediately to prevent retrigger
          const timer = timers.find(t => t.id === pendingTimerId);
          // ONLY trigger if timer exists
          if (timer) {
            console.log('🎯 Triggering timer completion from push notification:', timer.title);
            handleTimerCompletion(timer);
          } else {
            console.log('🧹 Ignoring pending timer - not found:', pendingTimerId);
          }
        }
        
        // Check for active_alarm in ReliableAlarmService
        const activeAlarmStr = await AsyncStorage.getItem('active_alarm');
        if (activeAlarmStr) {
          try {
            const activeAlarm = JSON.parse(activeAlarmStr);
            const alarmExists = alarms.some(a => a.id === activeAlarm.id && a.enabled);
            if (!alarmExists) {
              // Alarm doesn't exist or is disabled, clear it
              console.log('🧹 Removing orphaned active_alarm:', activeAlarm.id);
              await AsyncStorage.removeItem('active_alarm');
            }
          } catch (e) {
            // Invalid JSON, remove it
            await AsyncStorage.removeItem('active_alarm');
          }
        }
      } catch (error) {
        console.error('Error checking pending notifications:', error);
      }
    };
    
    // Only check when alarms/timers are loaded AND we have data
    if (alarms.length > 0 || timers.length > 0) {
      checkPendingNotifications();
    } else {
      // If no alarms/timers, clear all pending state
      const clearAll = async () => {
        try {
          const { clearAllAlarmTimerState } = await import('@/utils/alarmCleanup');
          await clearAllAlarmTimerState();
          // Also stop any playing sounds
          soundManager.stopSound();
          Vibration.cancel();
        } catch (error) {
          console.error('Error clearing all state:', error);
        }
      };
      clearAll();
    }
  }, [alarms, timers]);

  // Initialize
  useEffect(() => {
    const initializeAlarms = async () => {
      console.log('🚀 Initializing alarm system...');

      try {
        // 1. Initialize ReliableAlarmService (creates channels, checks pending alarms)
        await reliableAlarmService.initialize();
        console.log('✅ ReliableAlarmService initialized');

        // 2. Initialize headless task handler (backup)
        headlessTaskHandler.initialize();
        console.log('✅ Headless task handler initialized');
      } catch (error) {
        console.error('❌ Failed to initialize alarm system:', error);
      }
    };

    initializeAlarms();

    fetchAlarms();
    fetchTimers();

    // REMOVED: Alarm checking interval - now handled by GlobalAlarmEngine at app level
    // This ensures alarms ring regardless of which screen user is viewing
    
    // Update time-until display every minute
    const timeUpdateInterval = setInterval(() => {
      setTimeUpdateKey(prev => prev + 1);
    }, 60000);

    return () => {
      // REMOVED: clearInterval(alarmCheckInterval) - no longer needed, handled by GlobalAlarmEngine
      clearInterval(timeUpdateInterval);
      if (timerIntervalRef.current) {
        if (Platform.OS === 'android') {
          BackgroundTimer.clearInterval(timerIntervalRef.current as number);
        } else {
          clearInterval(timerIntervalRef.current);
        }
        timerIntervalRef.current = null;
      }
      soundManager.stopSound();
      alarmDeleteTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      alarmDeleteTimeoutsRef.current.clear();
    };
  }, [fetchAlarms, fetchTimers]);

  // Watch for timer changes and recover timers from background
  useEffect(() => {
    const runningTimer = timers.find(t => t.isRunning && !t.isPaused);
    
    if (runningTimer && !timerIntervalRef.current) {
      // Check if timer was running in background and recover
      AsyncStorage.getItem(`timer_end_time_${runningTimer.id}`).then((endTimeStr) => {
        if (endTimeStr) {
          const endTime = parseInt(endTimeStr, 10);
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          
          if (remaining > 0) {
            // Recover timer with correct remaining time
            updateTimerRemainingTime(runningTimer.id, remaining);
            timerStartTimeRef.current = now - ((runningTimer.duration * 60 - remaining) * 1000);
          }
        }
        
        // Start countdown
        startTimerCountdown(runningTimer);
      }).catch(console.error);
    } else if (!runningTimer && timerIntervalRef.current) {
      // Clean up interval
      if (Platform.OS === 'android') {
        BackgroundTimer.clearInterval(timerIntervalRef.current as number);
      } else {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = null;
    }
  }, [timers]);

  // Schedule alarms when alarms are loaded or enabled - using ReliableAlarmService
  useEffect(() => {
    if (alarms.length > 0) {
      alarms.forEach(alarm => {
        if (alarm.enabled) {
          try {
            // Schedule alarm with ReliableAlarmService (uses Notifee triggers for when app is closed)
            // Note: This is a backup mechanism. Primary mechanism is backend push notifications
            reliableAlarmService.scheduleAlarm(alarm).then(() => {
              console.log(`✅ Alarm scheduled via ReliableAlarmService: ${alarm.title}`, {
                alarmId: alarm.id,
                alarmTime: alarm.time,
                isRecurring: !!(alarm.recurrenceRule && alarm.recurrenceRule !== 'none'),
                isRoutine: alarm.title?.includes('Routine:'),
                isTask: alarm.title?.includes('Task:'),
              });
            }).catch((error) => {
              console.error(`❌ Failed to schedule alarm ${alarm.id}:`, error);
            });
          } catch (error) {
            console.error(`❌ Failed to schedule alarm ${alarm.id}:`, error);
          }
        } else {
          // Cancel alarm if disabled
          try {
            reliableAlarmService.cancelAlarm(alarm.id);
            notificationService.cancelAlarm(alarm.id);
          } catch (error) {
            console.error(`Failed to cancel alarm ${alarm.id}:`, error);
          }
        }
      });
    }
  }, [alarms]);

  // Check for active alarm on app open
  useEffect(() => {
    const checkActiveAlarm = async () => {
      try {
        const activeAlarmId = await AsyncStorage.getItem('active_alarm_id');
        if (activeAlarmId) {
          console.log('🔔 Found active alarm on app open:', activeAlarmId);
          const alarm = alarms.find(a => a.id === activeAlarmId);
          if (alarm) {
            console.log('🔔 Continuing active alarm:', alarm.title);
            handleAlarmFired(alarm);
          }
        }
      } catch (error) {
        console.error('Error checking active alarm:', error);
      }
    };

    checkActiveAlarm();
  }, [alarms]);

  // Stop alarm - using ReliableAlarmService
  const handleStopAlarm = React.useCallback(async (alarmId: string, options: { skipAutoDelete?: boolean } = {}) => {
    const { skipAutoDelete = false } = options;
    console.log('🛑 Stopping alarm:', alarmId);

    // Force stop immediately regardless of state
    setIsStopping(true);
    setActiveAlarmId(null);
    setPendingAlarm(null);
    
    // Stop sound/vibration IMMEDIATELY
    soundManager.stopSound();
    if (Platform.OS === 'android') {
      Vibration.cancel();
    }
    
    // Use ReliableAlarmService to stop alarm
    await reliableAlarmService.stopAlarm();
    
    // Cancel the scheduled notification
    notificationService.cancelAlarm(alarmId);
    
    // Also cancel via ReliableAlarmService
    await reliableAlarmService.cancelAlarm(alarmId);
    
    // Clean up ALL AsyncStorage state for this alarm
    try {
      await clearAlarmState(alarmId);
      await AsyncStorage.removeItem('pending_alarm_id').catch(console.error);
    } catch (error) {
      console.error('Error cleaning alarm state:', error);
    }
    
    // Mark this alarm as stopped for this occurrence (prevents re-ringing)
    // This prevents the alarm from firing again in the current minute window
    stoppedAlarmsThisOccurrenceRef.current.set(alarmId, Date.now());
    
    // DON'T clear fired alarms ref entries when stopping - we want to prevent re-firing
    // The firedAlarmsRef entries will be cleared automatically after the timeout
    // This ensures that if the alarm was stopped, it won't fire again in the same window
    
    // Clear any existing delete timeout for this alarm
    const existingTimeout = alarmDeleteTimeoutsRef.current.get(alarmId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      alarmDeleteTimeoutsRef.current.delete(alarmId);
    }
    
    // Check if alarm is one-time and schedule deletion after 30 seconds
    const alarm = alarms.find(a => a.id === alarmId);
    const hasPreviousFailure = autoDeleteFailuresRef.current.has(alarmId);
    const shouldAttemptAutoDelete = !!alarm && !skipAutoDelete && !hasPreviousFailure;

    if (shouldAttemptAutoDelete) {
      // Don't auto-delete routine or task alarms (they're tied to routines/tasks)
      const isRoutineOrTaskAlarm = alarm.title?.includes('Routine:') || alarm.title?.includes('Task:');
      const isOneTimeAlarm = !alarm.recurrenceRule || alarm.recurrenceRule === 'none';
      
      // Only auto-delete one-time alarms that are NOT routine/task alarms
      if (isOneTimeAlarm && !isRoutineOrTaskAlarm) {
        const timeout = setTimeout(async () => {
          try {
            await deleteAlarm(alarmId);
            console.log('✅ Auto-deleted one-time alarm after ringing:', alarmId);
          } catch (error) {
            // Silently handle errors - alarm might already be deleted or backend validation failed
            console.error('❌ Auto-delete failed (non-critical):', error);
            autoDeleteFailuresRef.current.add(alarmId);
          }
        }, 30000);
        alarmDeleteTimeoutsRef.current.set(alarmId, timeout);
      } else if (isRoutineOrTaskAlarm) {
        console.log('⏭️ Skipping auto-delete for routine/task alarm:', alarm.title);
      }
    }

    setIsStopping(false);
  }, [alarms, deleteAlarm]);

  // Handle alarm fired
  const handleAlarmFired = React.useCallback((alarm: Alarm) => {
    // Prevent multiple triggers
    if (activeAlarmId === alarm.id || isStopping) {
      return;
    }

    const isAlarmViewActive = isFocused && activeTab === 'alarms';

    console.log('🎯 Alarm fired:', alarm.title, 'at', new Date().toISOString());
    setActiveAlarmId(alarm.id);

    try {
      // Use ReliableAlarmService to ring alarm (shows notification, plays sound, vibrates)
      reliableAlarmService.ringAlarm(alarm.id, alarm.title);
      console.log('✅ ReliableAlarmService.ringAlarm called for:', alarm.title);
    } catch (error) {
      console.error('❌ Error calling ReliableAlarmService.ringAlarm:', error);
    }
    
    // Also play sound locally (ensures immediate ringing even if ReliableAlarmService is slow)
    try {
      soundManager.playAlarmSound();
      console.log('✅ Local sound manager playing alarm');
    } catch (error) {
      console.error('❌ Error playing local sound:', error);
    }
    
    // Start vibration if not already started by ReliableAlarmService
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
        console.log('✅ Vibration started');
      }
    } catch (error) {
      console.error('❌ Error starting vibration:', error);
    }

    if (!isAlarmViewActive) {
      setPendingAlarm(alarm);
    }
  }, [activeAlarmId, isStopping, isFocused, activeTab]);

  // Update ref when handleAlarmFired changes
  useEffect(() => {
    handleAlarmFiredRef.current = handleAlarmFired;
  }, [handleAlarmFired]);

  // Handle timer completion - simplified to prevent duplicates
  const handleTimerCompletion = async (timer: Timer) => {
    // Prevent duplicate completion
    if (activeTimerId === timer.id || isStopping) {
      return;
    }
    const isTimerViewActive = isFocused && activeTab === 'timers';

    try {
      console.log('🎯 Timer completed:', timer.title);
      setActiveTimerId(timer.id);
      
      // Cancel scheduled completion notification (if any) to prevent duplicate
      // But DO NOT cancel the countdown notification - it will be replaced by ringing notification
      notificationService.cancelTimer(timer.id);
      
      // Play sound
      soundManager.playAlarmSound();

      // Trigger immediate notification - this REPLACES the countdown notification
      // Using the same notification ID ensures smooth transition
      notificationService.triggerImmediateTimerNotification({ id: timer.id, title: timer.title });

      // Stop timer
      await stopTimer(timer.id);
      if (activeTimer?.id === timer.id) {
        setActiveTimer(null);
      }

      // Clear interval
      if (timerIntervalRef.current) {
        if (Platform.OS === 'android') {
          BackgroundTimer.clearInterval(timerIntervalRef.current as number);
        } else {
          clearInterval(timerIntervalRef.current);
        }
        timerIntervalRef.current = null;
      }
      
      // Clean up ALL AsyncStorage state to prevent auto-restart
      try {
        await clearTimerState(timer.id);
        // Also clear pending timer ID to prevent auto-trigger on app restart
        await AsyncStorage.removeItem('pending_timer_id').catch(console.error);
      } catch (error) {
        console.error('Error cleaning timer state:', error);
      }

      if (!isTimerViewActive) {
        setPendingTimer({ id: timer.id, title: timer.title });
      }
    } catch (err) {
      console.error('Error handling timer completion:', err);
      handleStopTimer(timer.id);
    }
  };

  // Stop timer alarm - improved
  const handleStopTimer = async (timerId: string) => {
    if (isStopping || activeTimerId !== timerId) return;
    
    setIsStopping(true);
    
    // Stop sound/vibration IMMEDIATELY
    soundManager.stopSound();
    if (Platform.OS === 'android') {
      Vibration.cancel();
    }
    
    // Clear ALL AsyncStorage state for this timer
    try {
      await clearTimerState(timerId);
      await AsyncStorage.removeItem('pending_timer_id').catch(console.error);
    } catch (error) {
      console.error('Error cleaning timer state:', error);
    }
    
    setActiveTimerId(null);
    setPendingTimer(null);
    
    setTimeout(() => {
      setIsStopping(false);
    }, 600);
  };

  const handleAlarmDialogStop = React.useCallback(async () => {
    if (!pendingAlarm) return;

    await handleStopAlarm(pendingAlarm.id);
    setPendingAlarm(null);

    try {
      await dismissAlarm(pendingAlarm.id);
    } catch (err) {
      console.log('Dismiss alarm failed:', err);
    }
  }, [pendingAlarm, handleStopAlarm, dismissAlarm]);

  const handleTimerDialogStop = React.useCallback(() => {
    if (!pendingTimer) return;
    handleStopTimer(pendingTimer.id);
    setPendingTimer(null);
  }, [pendingTimer]);

  // Error handling
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  // Timer handlers
  const handleCreateTimer = async () => {
    if (!timerTitle.trim()) {
      Alert.alert('Error', 'Please enter a timer title');
      return;
    }

    // Determine duration: use custom if enabled and valid, otherwise use preset
    let finalDuration = timerDuration;
    if (useCustomDuration && customDuration.trim()) {
      const customValue = parseInt(customDuration.trim(), 10);
      if (isNaN(customValue) || customValue <= 0) {
        Alert.alert('Error', 'Please enter a valid duration in minutes');
        return;
      }
      finalDuration = customValue;
    }

    if (finalDuration <= 0) {
      Alert.alert('Error', 'Duration must be greater than 0');
      return;
    }

    try {
      await createTimer({
        title: timerTitle.trim(),
        duration: finalDuration,
      });
      setShowTimerModal(false);
      setTimerTitle('New Timer');
      setTimerDuration(25);
      setCustomDuration('');
      setUseCustomDuration(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to create timer');
    }
  };

  // Preset duration options
  const durationPresets = [1, 5, 10, 15, 25, 30, 60];

  const handleStartTimer = async (timer: Timer) => {
    try {
      await startTimer(timer.id);
      setActiveTimer(timer);
      timerStartTimeRef.current = Date.now();
      timerPausedTimeRef.current = 0;
      
      // Schedule completion notification and start ongoing notification
      notificationService.scheduleTimer(timer.id, timer.title, timer.remainingTime);
      notificationService.updateTimerNotification(timer.id, timer.title, timer.remainingTime);
    } catch (err) {
      Alert.alert('Error', 'Failed to start timer');
    }
  };

  const handlePauseTimer = async (timer: Timer) => {
    try {
      if (timerStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - timerStartTimeRef.current) / 1000);
        timerPausedTimeRef.current += elapsed;
      }
      await pauseTimer(timer.id);
      
      // Cancel ongoing notification when paused
      notificationService.cancelTimerNotification(timer.id);
    } catch (err) {
      Alert.alert('Error', 'Failed to pause timer');
    }
  };

  const handleStopTimerAction = async (timer: Timer) => {
    try {
      // Stop sound/vibration IMMEDIATELY
      soundManager.stopSound();
      if (Platform.OS === 'android') {
        Vibration.cancel();
      }
      
      await stopTimer(timer.id);
      if (activeTimer?.id === timer.id) {
        setActiveTimer(null);
      }
      timerStartTimeRef.current = null;
      timerPausedTimeRef.current = 0;
      
      // Cancel all timer notifications (both countdown and ringing)
      notificationService.cancelTimer(timer.id);
      notificationService.cancelTimerNotification(timer.id);
      
      // Clean up ALL AsyncStorage state to prevent auto-restart
      try {
        await clearTimerState(timer.id);
        await AsyncStorage.removeItem('pending_timer_id').catch(console.error);
      } catch (error) {
        console.error('Error cleaning timer state:', error);
      }
      
      if (activeTimerId === timer.id) {
        await handleStopTimer(timer.id);
      }
      setPendingTimer(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to stop timer');
    }
  };

  const handleResetTimer = async (timer: Timer) => {
    try {
      await resetTimer(timer.id);
      timerStartTimeRef.current = null;
      timerPausedTimeRef.current = 0;
    } catch (err) {
      Alert.alert('Error', 'Failed to reset timer');
    }
  };

  const handleDeleteTimer = async (timer: Timer) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTimer(timer.id);
              // Clean up state
              await clearTimerState(timer.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete timer');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAlarm = async (alarm: Alarm) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlarm(alarm.id);
              await reliableAlarmService.cancelAlarm(alarm.id);
              await clearAlarmState(alarm.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete alarm');
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeUntil = (alarmTime: string): string => {
    const now = new Date();
    const alarm = new Date(alarmTime);
    const diff = alarm.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Overdue';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const renderAlarmItem = ({ item }: { item: Alarm }) => {
    const isActive = activeAlarmId === item.id;
    const timeUntil = formatTimeUntil(item.time);
    const alarmDate = new Date(item.time);
    const isRecurring = item.recurrenceRule && item.recurrenceRule !== 'none';

    return (
      <Card style={[styles.card, isActive && styles.activeCard]} onPress={() => {}}>
        <Card.Content>
          <View style={styles.alarmHeader}>
            <View style={styles.alarmInfo}>
              <Text variant="titleMedium" style={styles.alarmTitle}>
                {item.title}
              </Text>
              <Text variant="bodySmall" style={styles.alarmTime}>
                {alarmDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isRecurring && (
                <Chip icon="repeat" style={styles.recurrenceChip} textStyle={styles.recurrenceText}>
                  {item.recurrenceRule}
                </Chip>
              )}
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleAlarm(item.id)}
            />
          </View>
          <View style={styles.alarmActions}>
            <Text variant="bodySmall" style={styles.timeUntil}>
              {timeUntil}
            </Text>
            {isActive && (
              <Button
                mode="contained"
                onPress={() => handleStopAlarm(item.id)}
                style={styles.stopButton}
              >
                Stop
              </Button>
            )}
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteAlarm(item)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTimerItem = ({ item }: { item: Timer }) => {
    const isActive = activeTimerId === item.id;
    const isRunning = item.isRunning && !item.isPaused;
    const totalDuration = item.duration * 60; // Convert minutes to seconds
    const progress = totalDuration > 0 ? (totalDuration - item.remainingTime) / totalDuration : 0;

    return (
      <Card style={[styles.card, isActive && styles.activeCard]}>
        <Card.Content>
          <View style={styles.timerHeader}>
            <View style={styles.timerInfo}>
              <Text variant="titleMedium" style={styles.timerTitle}>
                {item.title}
              </Text>
              <Text variant="headlineMedium" style={styles.timerTime}>
                {formatTime(item.remainingTime)}
              </Text>
              <View style={styles.timerMeta}>
                <Chip 
                  icon={isRunning ? "timer" : "timer-outline"} 
                  style={styles.statusChip}
                  textStyle={styles.statusChipText}
                >
                  {isRunning ? (item.isPaused ? 'Paused' : 'Running') : 'Stopped'}
                </Chip>
                <Text variant="bodySmall" style={styles.durationText}>
                  Duration: {item.duration} min
                </Text>
              </View>
            </View>
          </View>
          {isRunning && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          )}
          <View style={styles.timerActions}>
            {!isRunning ? (
              <Button
                mode="contained"
                onPress={() => handleStartTimer(item)}
                icon="play"
                style={styles.actionButton}
              >
                Start
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => handlePauseTimer(item)}
                icon="pause"
                style={styles.actionButton}
              >
                Pause
              </Button>
            )}
            <Button
              mode="outlined"
              onPress={() => handleStopTimerAction(item)}
              icon="stop"
              style={styles.actionButton}
            >
              Stop
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleResetTimer(item)}
              icon="refresh"
              style={styles.actionButton}
            >
              Reset
            </Button>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteTimer(item)}
            />
          </View>
          {isActive && (
            <View style={styles.ringingContainer}>
              <Chip 
                icon="bell-ring" 
                style={styles.ringingChip}
                textStyle={styles.ringingChipText}
              >
                🔔 Ringing
              </Chip>
              <Button
                mode="contained"
                onPress={() => handleStopTimer(item.id)}
                style={styles.stopButton}
                icon="stop"
              >
                Stop Ringing
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'alarms' | 'timers')}
        buttons={[
          { value: 'alarms', label: 'Alarms' },
          { value: 'timers', label: 'Timers' },
        ]}
        style={styles.segmentedButtons}
      />

      {activeTab === 'alarms' ? (
        <FlatList
          data={alarms}
          renderItem={renderAlarmItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge">No alarms</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={timers}
          renderItem={renderTimerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge">No timers</Text>
            </View>
          }
        />
      )}

      <FAB
        icon={activeTab === 'alarms' ? 'plus' : 'plus'}
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'alarms') {
            (navigation as any).navigate('AlarmCreate');
          } else {
            setShowTimerModal(true);
          }
        }}
      />

      <Portal>
        <Modal
          visible={showTimerModal}
          onDismiss={() => {
            setShowTimerModal(false);
            setCustomDuration('');
            setUseCustomDuration(false);
          }}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Create Timer
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => {
                setShowTimerModal(false);
                setCustomDuration('');
                setUseCustomDuration(false);
              }}
            />
          </View>
          
          <TextInput
            label="Timer Title"
            value={timerTitle}
            onChangeText={setTimerTitle}
            style={styles.modalInput}
            mode="outlined"
          />

          <Text variant="titleMedium" style={styles.durationLabel}>
            Duration (minutes)
          </Text>

          {/* Preset Duration Buttons */}
          <View style={styles.presetContainer}>
            {durationPresets.map((preset) => (
              <Chip
                key={preset}
                selected={!useCustomDuration && timerDuration === preset}
                onPress={() => {
                  setTimerDuration(preset);
                  setUseCustomDuration(false);
                  setCustomDuration('');
                }}
                style={[
                  styles.presetChip,
                  !useCustomDuration && timerDuration === preset && styles.selectedPresetChip,
                ]}
                textStyle={[
                  styles.presetChipText,
                  !useCustomDuration && timerDuration === preset && styles.selectedPresetChipText,
                ]}
              >
                {preset} {preset === 1 ? 'min' : 'min'}
              </Chip>
            ))}
          </View>

          {/* Custom Duration Option */}
          <View style={styles.customDurationContainer}>
            <Chip
              selected={useCustomDuration}
              onPress={() => {
                setUseCustomDuration(!useCustomDuration);
                if (!useCustomDuration) {
                  setTimerDuration(25); // Reset preset when switching to custom
                }
              }}
              style={[
                styles.customToggleChip,
                useCustomDuration && styles.selectedPresetChip,
              ]}
              icon={useCustomDuration ? 'check' : 'plus'}
            >
              Custom Duration
            </Chip>
            
            {useCustomDuration && (
              <TextInput
                label="Enter minutes (e.g., 3, 7, 45)"
                value={customDuration}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setCustomDuration(numericValue);
                }}
                keyboardType="numeric"
                style={styles.modalInput}
                mode="outlined"
                placeholder="Enter minutes"
              />
            )}
          </View>

          <View style={styles.modalButtons}>
            <Button 
              onPress={() => {
                setShowTimerModal(false);
                setCustomDuration('');
                setUseCustomDuration(false);
              }}
            >
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateTimer}>
              Create
            </Button>
          </View>
        </Modal>

        <Dialog visible={!!pendingAlarm} onDismiss={handleAlarmDialogStop}>
          <Dialog.Title>Alarm: {pendingAlarm?.title}</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={handleAlarmDialogStop}>Stop</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!pendingTimer} onDismiss={handleTimerDialogStop}>
          <Dialog.Title>Timer: {pendingTimer?.title}</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={handleTimerDialogStop}>Stop</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  segmentedButtons: {
    margin: theme.spacing?.md || 16,
  },
  listContent: {
    padding: theme.spacing?.md || 16,
  },
  card: {
    marginBottom: theme.spacing?.md || 16,
  },
  activeCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTitle: {
    fontWeight: 'bold',
  },
  alarmTime: {
    marginTop: 4,
  },
  recurrenceChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  recurrenceText: {
    fontSize: 12,
  },
  alarmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timeUntil: {
    color: theme.colors.onSurfaceVariant,
  },
  stopButton: {
    marginLeft: 8,
  },
  timerHeader: {
    marginBottom: 8,
  },
  timerInfo: {
    alignItems: 'center',
  },
  timerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerTime: {
    fontWeight: 'bold',
  },
  timerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 80,
  },
  timerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
  },
  durationText: {
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  ringingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  ringingChip: {
    backgroundColor: theme.colors.errorContainer,
  },
  ringingChipText: {
    color: theme.colors.onErrorContainer,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  durationLabel: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  selectedPresetChip: {
    backgroundColor: theme.colors.primary,
  },
  presetChipText: {
    color: theme.colors.onSurface,
  },
  selectedPresetChipText: {
    color: theme.colors.onPrimary,
  },
  customDurationContainer: {
    marginTop: 8,
  },
  customToggleChip: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
