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
import { Text, FAB, Card, Button, Chip, SegmentedButtons, Portal, Modal, TextInput, IconButton, Dialog, Avatar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useAlarmStore } from '@/store/alarmStore';
import { Alarm, Timer } from '@/types/alarm';
import { notificationService } from '@/services/notificationService';
import { headlessTaskHandler } from '@/services/headlessTaskHandler';
import { reliableAlarmService } from '@/services/ReliableAlarmService';

// Navigation types
type RootStackParamList = {
  AlarmCreate: undefined;
};

type NavigationProp = {
  navigate: (screen: keyof RootStackParamList) => void;
};

// Sound Manager - simplified and more reliable
class SoundManager {
  private sound: Sound | null = null;
  private vibrationInterval: NodeJS.Timeout | null = null;
  private isPlaying = false;
  private isStopping = false;

  playAlarmSound() {
    if (this.isPlaying || this.isStopping) {
      console.log('⚠️ Sound play blocked - already playing or stopping');
      return;
    }
    
    try {
      this.isPlaying = true;
      this.isStopping = false;
      
      // Enable playback in silent mode
      Sound.setCategory('Playback', true);
      
      // Start vibration
      this.startVibration();
      
      // Try to play sound
      if (Platform.OS === 'android') {
        this.sound = new Sound(
          'alarm.mp3',
          Sound.MAIN_BUNDLE,
          (error) => {
            if (error) {
              console.log('Sound failed, using vibration only');
              this.isPlaying = false;
              return;
            }
            if (this.sound && !this.isStopping) {
              this.sound.setNumberOfLoops(-1);
              this.sound.setVolume(1.0);
              this.sound.play(() => {
                console.log('Sound playback finished');
              });
            }
          }
        );
      } else {
        // Android: vibration is primary, notification handles sound
        console.log('Android: Using vibration');
      }
    } catch (err) {
      console.error('Error playing alarm:', err);
      this.isPlaying = false;
      this.startVibration();
    }
  }

  startVibration() {
    try {
      // Clear any existing vibration first
      if (this.vibrationInterval) {
        clearInterval(this.vibrationInterval);
        this.vibrationInterval = null;
      }
      Vibration.cancel();
      
      if (Platform.OS === 'android') {
        // Android: use pattern vibration
        Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
      } else {
        // iOS: use interval-based vibration
        this.vibrationInterval = setInterval(() => {
          if (!this.isStopping) {
            Vibration.vibrate(1000);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Vibration error:', err);
    }
  }

  stopSound() {
    try {
      console.log('🔇 Stopping alarm sound - force stop');
      this.isStopping = true;
      this.isPlaying = false;
      
      // Force stop sound immediately
      if (this.sound) {
        try {
          this.sound.stop();
          this.sound.release();
        } catch (e) {
          console.log('Error stopping sound:', e);
        }
        this.sound = null;
      }
      
      // Force stop vibration
      try {
        Vibration.cancel();
      } catch (e) {
        console.log('Error canceling vibration:', e);
      }
      
      // Clear vibration interval
      if (this.vibrationInterval) {
        clearInterval(this.vibrationInterval);
        this.vibrationInterval = null;
      }
      
      // Reset flags immediately
      this.isPlaying = false;
      this.isStopping = false;
    } catch (err) {
      console.error('Error stopping sound:', err);
      this.isPlaying = false;
      this.isStopping = false;
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const AlarmsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<'alarms' | 'timers'>('alarms');
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerTitle, setTimerTitle] = useState('New Timer');
  const [timerDuration, setTimerDuration] = useState(25);
  
  // Alarm/timer playing state - single source of truth
  const [activeAlarmId, setActiveAlarmId] = useState<string | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [timeUpdateKey, setTimeUpdateKey] = useState(0); // Force re-render for time updates

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
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  // Track fired alarms per minute to prevent duplicates
  const firedAlarmsRef = useRef<Set<string>>(new Set());

  const getAlarmMinuteKey = (alarmId: string, alarmTime: Date, isRecurring: boolean): string => {
    const dateToUse = isRecurring ? new Date() : alarmTime;
    const year = dateToUse.getFullYear();
    const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
    const day = String(dateToUse.getDate()).padStart(2, '0');
    const hour = String(alarmTime.getHours()).padStart(2, '0');
    const minute = String(alarmTime.getMinutes()).padStart(2, '0');
    return `${alarmId}:${year}-${month}-${day}-${hour}-${minute}`;
  };

  // Track alarm deletion timeouts
  const alarmDeleteTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Track alarms where auto-delete previously failed to avoid repeated requests
  const autoDeleteFailuresRef = useRef<Set<string>>(new Set());

  // Stop alarm - using AlarmFixService
  const handleStopAlarm = React.useCallback(async (alarmId: string, options: { skipAutoDelete?: boolean } = {}) => {
    const { skipAutoDelete = false } = options;
    console.log('🛑 Stopping alarm:', alarmId, 'activeAlarmId:', activeAlarmId, 'isStopping:', isStopping);
    
    // Force stop immediately regardless of state
    setIsStopping(true);
    setActiveAlarmId(null);
    setPendingAlarm(null);
    
    // Use ReliableAlarmService to stop alarm (handles sound, vibration, notifications)
    await reliableAlarmService.stopAlarm();
    
    // Cancel the scheduled notification
    notificationService.cancelAlarm(alarmId);
    
    // Also cancel via ReliableAlarmService
    await reliableAlarmService.cancelAlarm(alarmId);
    
    // Force stop the sound immediately (backup)
    soundManager.stopSound();
    
    // Also try to stop any ongoing vibration (backup)
    Vibration.cancel();
    
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

    if (alarm && skipAutoDelete && hasPreviousFailure) {
      console.log('Skipping auto-delete because it is explicitly skipped and previously failed:', alarmId);
    }

    if (shouldAttemptAutoDelete) {
      // Auto-delete one-time alarms after 30 seconds
      const isOneTimeAlarm = !alarm.recurrenceRule || alarm.recurrenceRule === 'none';
      if (isOneTimeAlarm) {
        const deleteTimeout = setTimeout(async () => {
          try {
            await deleteAlarm(alarmId);
            console.log('🗑️ Auto-deleted one-time alarm after 30s:', alarm.title);
            autoDeleteFailuresRef.current.delete(alarmId);
          } catch (err) {
            console.error('Failed to auto-delete alarm:', err);
            autoDeleteFailuresRef.current.add(alarmId);
          } finally {
            alarmDeleteTimeoutsRef.current.delete(alarmId);
          }
        }, 30000); // 30 seconds delay
        
        alarmDeleteTimeoutsRef.current.set(alarmId, deleteTimeout);
      }
    } else if (!shouldAttemptAutoDelete && alarm && !skipAutoDelete) {
      console.log('Skipping auto-delete because it previously failed:', alarmId);
    }
    
    // Clear stopping flag after sound stops
    setTimeout(() => {
      setIsStopping(false);
    }, 600);
  }, [alarms, deleteAlarm, notificationService, soundManager, activeAlarmId, isStopping]);

  // Handle alarm fired - using AlarmFixService
  const handleAlarmFired = React.useCallback((alarm: Alarm) => {
    // Prevent multiple triggers
    if (activeAlarmId === alarm.id || isStopping) {
      console.log('⚠️ Alarm firing blocked - already active or stopping');
      return;
    }

    const alarmTime = new Date(alarm.time);
    const isRecurring = !!(alarm.recurrenceRule && alarm.recurrenceRule !== 'none');
    const minuteKey = getAlarmMinuteKey(alarm.id, alarmTime, isRecurring);
    
    // Check if already fired this minute
    if (firedAlarmsRef.current.has(minuteKey)) {
      console.log('⚠️ Alarm already fired this minute:', minuteKey);
      return;
    }

    console.log('🎯 Alarm fired:', alarm.title);
    
    // Mark as fired FIRST to prevent re-triggering
    firedAlarmsRef.current.add(minuteKey);
    setActiveAlarmId(alarm.id);
    setPendingAlarm(alarm);
    
    // Use ReliableAlarmService to ring alarm (handles sound, vibration, notifications)
    reliableAlarmService.ringAlarm(alarm.id, alarm.title);
    
    // Also play sound locally (backup)
    soundManager.playAlarmSound();
    
    // Trigger immediate notification (backup)
    notificationService.triggerImmediateAlarmNotification(alarm);
  }, [activeAlarmId, isStopping, soundManager]);

  // Check if alarm should fire today
  const shouldAlarmFireToday = (alarm: Alarm, now: Date): boolean => {
    if (!alarm.recurrenceRule || alarm.recurrenceRule === 'none') {
      const alarmTime = new Date(alarm.time);
      return (
        now.getFullYear() === alarmTime.getFullYear() &&
        now.getMonth() === alarmTime.getMonth() &&
        now.getDate() === alarmTime.getDate()
      );
    }

    const currentDay = now.getDay();
    switch (alarm.recurrenceRule) {
      case 'daily':
        return true;
      case 'weekdays':
        return currentDay >= 1 && currentDay <= 5;
      case 'weekends':
        return currentDay === 0 || currentDay === 6;
      case 'weekly':
        const alarmTime = new Date(alarm.time);
        return currentDay === alarmTime.getDay();
      default:
        return true;
    }
  };

  // Ref to store the latest alarm check function
  const checkAlarmsRef = useRef<() => void>(() => {});

  // Check alarms that should fire - simplified logic
  const checkAlarmsThatShouldHaveFired = React.useCallback(() => {
    if (activeAlarmId || isStopping) {
      return;
    }
    
    const now = new Date();
    const currentAlarms = alarms; // Get current alarms from closure
    
    currentAlarms.forEach(alarm => {
      // Skip disabled alarms, active alarms, or if we're stopping
      if (!alarm.enabled || activeAlarmId === alarm.id || isStopping) {
        return;
      }
      
      let alarmTime = new Date(alarm.time);
      const isRecurring = !!(alarm.recurrenceRule && alarm.recurrenceRule !== 'none');
      
      // For one-time alarms, if the alarm time is tomorrow but the time today hasn't passed yet,
      // adjust it to today. This fixes cases where alarms were created with the wrong date.
      if (!isRecurring) {
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
            alarmTime = alarmTimeToday;
          }
        }
        
        // Auto-delete passed one-time alarms (after 1 minute past)
        if (alarmTime.getTime() <= now.getTime() - 60000) {
          if (autoDeleteFailuresRef.current.has(alarm.id)) {
            console.log('Skipping auto-delete for passed alarm due to previous failure:', alarm.id);
            return;
          }

          console.log(`🗑️ Auto-deleting passed one-time alarm: ${alarm.id}`);
          deleteAlarm(alarm.id)
            .then(() => autoDeleteFailuresRef.current.delete(alarm.id))
            .catch(err => {
              autoDeleteFailuresRef.current.add(alarm.id);
              console.error('Failed to auto-delete alarm:', err);
            });
          return;
        }
      }
      
      const minuteKey = getAlarmMinuteKey(alarm.id, alarmTime, isRecurring);
      
      // Simple time comparison - just check hour and minute match
      const nowMinutes = now.getMinutes();
      const alarmMinutes = alarmTime.getMinutes();
      const nowHours = now.getHours();
      const alarmHours = alarmTime.getHours();
      
      // For one-time alarms, also check date
      const nowDate = now.getDate();
      const alarmDate = alarmTime.getDate();
      const nowMonth = now.getMonth();
      const alarmMonth = alarmTime.getMonth();
      const nowYear = now.getFullYear();
      const alarmYear = alarmTime.getFullYear();
      
      const isSameMinute = 
        nowYear === alarmYear &&
        nowMonth === alarmMonth &&
        nowDate === alarmDate &&
        nowHours === alarmHours &&
        nowMinutes === alarmMinutes;
      
      const shouldFireToday = shouldAlarmFireToday(alarm, now);
      const timeMatches = nowHours === alarmHours && nowMinutes === alarmMinutes;
      
      const shouldFire = isRecurring
        ? (shouldFireToday && timeMatches && !firedAlarmsRef.current.has(minuteKey))
        : (isSameMinute && !firedAlarmsRef.current.has(minuteKey));
      
      // Debug: log when we're close to alarm time
      const timeDiff = Math.abs((alarmTime.getTime() - now.getTime()) / 1000);
      if (timeDiff <= 65) { // Within 65 seconds
        console.log(`🔍 Alarm check - ${alarm.id}:`, {
          alarmTime: alarmTime.toLocaleString(),
          now: now.toLocaleString(),
          timeDiff: `${Math.floor(timeDiff)}s`,
          isSameMinute,
          timeMatches,
          shouldFire,
          alreadyFired: firedAlarmsRef.current.has(minuteKey),
        });
      }
      
      if (shouldFire) {
        console.log('🎯 Alarm should fire:', {
          alarmId: alarm.id,
          alarmTime: alarmTime.toLocaleString(),
          now: now.toLocaleString(),
          isSameMinute,
          shouldFire,
        });
        handleAlarmFired(alarm);
      }
    });
  }, [alarms, activeAlarmId, isStopping, handleAlarmFired, deleteAlarm]);

  // Update ref when function changes
  useEffect(() => {
    checkAlarmsRef.current = checkAlarmsThatShouldHaveFired;
  }, [checkAlarmsThatShouldHaveFired]);

  // Timer countdown with background support
  const startTimerCountdown = (timer: Timer) => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Calculate start time
    const now = Date.now();
    timerStartTimeRef.current = now;
    timerPausedTimeRef.current = 0;

    // Initial notification update
    notificationService.updateTimerNotification(timer.id, timer.title, timer.remainingTime);

    // Start countdown
    timerIntervalRef.current = setInterval(() => {
      const currentTimer = timers.find(t => t.id === timer.id);
      if (!currentTimer || !currentTimer.isRunning || currentTimer.isPaused) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        return;
      }

      // Calculate elapsed time accounting for background
      const elapsed = Math.floor((Date.now() - (timerStartTimeRef.current || now)) / 1000) - timerPausedTimeRef.current;
      const newRemaining = Math.max(0, timer.duration * 60 - elapsed);

      if (newRemaining <= 0) {
        handleTimerCompletion(currentTimer);
      } else {
        updateTimerRemainingTime(currentTimer.id, newRemaining);
        
        // Always update notification - foreground service will keep it updated even when app is closed
        // Update every second to keep notification bar countdown accurate
        notificationService.updateTimerNotification(currentTimer.id, currentTimer.title, newRemaining);
      }
    }, 1000);
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
  useEffect(() => {
    const checkPendingNotifications = async () => {
      try {
        // Check for pending alarm from push notification
        const pendingAlarmId = await AsyncStorage.getItem('pending_alarm_id');
        if (pendingAlarmId) {
          await AsyncStorage.removeItem('pending_alarm_id');
          const alarm = alarms.find(a => a.id === pendingAlarmId);
          if (alarm && alarm.enabled) {
            console.log('🎯 Triggering alarm from push notification:', alarm.title);
            handleAlarmFired(alarm);
          }
        }
        
        // Check for pending timer from push notification
        const pendingTimerId = await AsyncStorage.getItem('pending_timer_id');
        if (pendingTimerId) {
          await AsyncStorage.removeItem('pending_timer_id');
          const timer = timers.find(t => t.id === pendingTimerId);
          if (timer) {
            console.log('🎯 Triggering timer completion from push notification:', timer.title);
            handleTimerCompletion(timer);
          }
        }
      } catch (error) {
        console.error('Error checking pending notifications:', error);
      }
    };
    
    // Check when alarms/timers are loaded
    if (alarms.length > 0 || timers.length > 0) {
      checkPendingNotifications();
    }
  }, [alarms, timers, handleAlarmFired]);

  // Initialize
  useEffect(() => {
    // Initialize headless task handler for background notifications
    // Initialize alarm system with ReliableAlarmService
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

    // Check alarms every second - use ref to get latest function
    const alarmCheckInterval = setInterval(() => {
      checkAlarmsRef.current();
    }, 1000);

    // Update time-until display every minute
    const timeUpdateInterval = setInterval(() => {
      // Force re-render by updating state
      setTimeUpdateKey(prev => prev + 1);
    }, 60000);

    return () => {
      clearInterval(alarmCheckInterval);
      clearInterval(timeUpdateInterval);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      soundManager.stopSound();
      // Clean up all alarm deletion timeouts
      alarmDeleteTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      alarmDeleteTimeoutsRef.current.clear();
    };
  }, [fetchAlarms, fetchTimers]);

  // Watch for timer changes
  useEffect(() => {
    const runningTimer = timers.find(t => t.isRunning && !t.isPaused);
    
    if (runningTimer && !timerIntervalRef.current) {
      startTimerCountdown(runningTimer);
    } else if (!runningTimer && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [timers]);

  // Schedule alarms when alarms are loaded or enabled - using ReliableAlarmService
  useEffect(() => {
    if (alarms.length > 0) {
      alarms.forEach(alarm => {
        if (alarm.enabled) {
          try {
            // Schedule alarm with ReliableAlarmService
            reliableAlarmService.scheduleAlarm(alarm);
            console.log(`✅ Alarm scheduled via ReliableAlarmService: ${alarm.title}`);
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
  }, [alarms, handleAlarmFired]);

  // Handle timer completion
  const handleTimerCompletion = async (timer: Timer) => {
    if (activeTimerId === timer.id || isStopping) return;
    const isTimerViewActive = isFocused && activeTab === 'timers';

    try {
      console.log('🎯 Timer completed:', timer.title);
      setActiveTimerId(timer.id);
      
      // Play sound
      soundManager.playAlarmSound();

      notificationService.triggerImmediateTimerNotification({ id: timer.id, title: timer.title });

      // Stop timer
      await stopTimer(timer.id);
      if (activeTimer?.id === timer.id) {
        setActiveTimer(null);
      }

      // Clear interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
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
  const handleStopTimer = (timerId: string) => {
    if (isStopping || activeTimerId !== timerId) return;
    
    setIsStopping(true);
    soundManager.stopSound();
    setActiveTimerId(null);
    setPendingTimer(null);
    
    setTimeout(() => {
      setIsStopping(false);
    }, 600);
  };

  const handleAlarmDialogStop = React.useCallback(async () => {
    if (!pendingAlarm) return;

    // Always stop locally first so the user gets immediate feedback
    await handleStopAlarm(pendingAlarm.id);
    setPendingAlarm(null);

    // Attempt to sync with backend, but don't block UI if it fails
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
  }, [pendingTimer, handleStopTimer]);

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

    try {
      await createTimer({
        title: timerTitle.trim(),
        duration: timerDuration,
      });
      setShowTimerModal(false);
      setTimerTitle('New Timer');
      setTimerDuration(25);
    } catch (err) {
      Alert.alert('Error', 'Failed to create timer');
    }
  };

  const handleStartTimer = async (timer: Timer) => {
    try {
      await startTimer(timer.id);
      setActiveTimer(timer);
      timerStartTimeRef.current = Date.now();
      timerPausedTimeRef.current = 0;
      
      // Schedule completion notification and start ongoing notification
      notificationService.scheduleTimer(timer.id, timer.title, timer.remainingTime);
      notificationService.updateTimerNotification(timer.id, timer.title, timer.remainingTime);
      
      // Timer completion is handled by notificationService.scheduleTimer
      // ReliableAlarmService is primarily for alarms
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
      await stopTimer(timer.id);
      if (activeTimer?.id === timer.id) {
        setActiveTimer(null);
      }
      timerStartTimeRef.current = null;
      timerPausedTimeRef.current = 0;
      
      // Cancel all timer notifications
      notificationService.cancelTimer(timer.id);
      notificationService.cancelTimerNotification(timer.id);
      
      // Cancel native timer
      // Timer cancellation handled by notificationService
      
      if (activeTimerId === timer.id) {
        handleStopTimer(timer.id);
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
              if (activeTimer?.id === timer.id) {
                setActiveTimer(null);
              }
              if (activeTimerId === timer.id) {
                handleStopTimer(timer.id);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete timer');
            }
          },
        },
      ]
    );
  };

  const handleToggleAlarm = async (alarmId: string) => {
    try {
      await toggleAlarm(alarmId);
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle alarm');
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
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
              // Clear any pending deletion timeout for this alarm
              const existingTimeout = alarmDeleteTimeoutsRef.current.get(alarmId);
              if (existingTimeout) {
                clearTimeout(existingTimeout);
                alarmDeleteTimeoutsRef.current.delete(alarmId);
              }
              
              // Stop alarm if it's active
              if (activeAlarmId === alarmId) {
                await handleStopAlarm(alarmId, { skipAutoDelete: true });
              }
              
              // Delete the alarm
              await deleteAlarm(alarmId);
              autoDeleteFailuresRef.current.delete(alarmId);
            } catch (err) {
              autoDeleteFailuresRef.current.add(alarmId);
              const message =
                err instanceof Error && err.message
                  ? err.message
                  : 'Failed to delete alarm';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllAlarms = () => {
    if (alarms.length === 0) return;
    
    Alert.alert(
      'Confirm Delete All',
      `Are you sure you want to delete all ${alarms.length} alarm${alarms.length === 1 ? '' : 's'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop any active alarms first
              if (activeAlarmId) {
                soundManager.stopSound();
                setActiveAlarmId(null);
              }
              
              // Delete all alarms in parallel
              const deletePromises = alarms.map(alarm => deleteAlarm(alarm.id));
              await Promise.all(deletePromises);
              
              console.log('🗑️ Deleted all alarms');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete some alarms');
            }
          },
        },
      ]
    );
  };

  // Helper functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecurrenceText = (alarm: Alarm): string => {
    if (!alarm.recurrenceRule || alarm.recurrenceRule === 'none') return 'Once';
    if (alarm.recurrenceRule === 'daily') return 'Daily';
    if (alarm.recurrenceRule === 'weekdays') return 'Weekdays';
    if (alarm.recurrenceRule === 'weekends') return 'Weekends';
    if (alarm.recurrenceRule === 'weekly') return 'Weekly';
    return 'Custom';
  };

  // Calculate time until alarm rings
  const getTimeUntilAlarm = (alarm: Alarm): string => {
    let alarmTime = new Date(alarm.time);
    const now = new Date();
    
    // For one-time alarms, if the alarm time is tomorrow but the time today hasn't passed yet,
    // adjust it to today for display purposes.
    const isRecurring = !!(alarm.recurrenceRule && alarm.recurrenceRule !== 'none');
    if (!isRecurring) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const alarmDate = new Date(alarmTime);
      alarmDate.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (alarmDate.getTime() === tomorrow.getTime()) {
        const alarmTimeToday = new Date(today);
        alarmTimeToday.setHours(alarmTime.getHours(), alarmTime.getMinutes(), 0, 0);
        
        // Only adjust if the time today hasn't passed
        if (alarmTimeToday.getTime() > now.getTime()) {
          alarmTime = alarmTimeToday;
        }
      }
    }
    
    const diffMs = alarmTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Ringing now';
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      const remainingMinutes = diffMinutes % 60;
      if (remainingHours > 0) {
        return `${diffDays}d ${remainingHours}h ${remainingMinutes}m`;
      }
      return `${diffDays}d ${remainingMinutes}m`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `${diffHours}h ${remainingMinutes}m`;
      }
      return `${diffHours}h`;
    } else {
      return `${diffMinutes}min`;
    }
  };

  // Render functions
  const renderTimer = ({ item }: { item: Timer }) => {
    const isRinging = activeTimerId === item.id;

    return (
      <Card style={[styles.card, isRinging && styles.ringingCard]}>
        <Card.Content>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text variant="titleMedium" style={styles.itemTitle}>
                {item.title}
              </Text>
              <Text variant="headlineLarge" style={[styles.timerTime, { color: theme.colors.primary }]}>
                {formatTime(item.remainingTime)}
              </Text>
              {isRinging && (
                <Chip mode="flat" style={styles.ringingChip} textStyle={styles.ringingText}>
                  🔊 RINGING
                </Chip>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            {isRinging ? (
              <Button 
                mode="contained" 
                onPress={() => handleStopTimer(item.id)} 
                style={styles.actionButton}
                buttonColor={theme.colors.error}
                icon="bell-off">
                Stop Alarm
              </Button>
            ) : (
              <>
                {!item.isRunning && !item.isCompleted && (
                  <Button mode="contained" onPress={() => handleStartTimer(item)} icon="play" style={styles.actionButton}>
                    Start
                  </Button>
                )}
                {item.isRunning && !item.isPaused && (
                  <Button mode="outlined" onPress={() => handlePauseTimer(item)} icon="pause" style={styles.actionButton}>
                    Pause
                  </Button>
                )}
                {item.isPaused && (
                  <Button mode="contained" onPress={() => handleStartTimer(item)} icon="play" style={styles.actionButton}>
                    Resume
                  </Button>
                )}
                {(item.isRunning || item.isPaused) && (
                  <Button mode="outlined" onPress={() => handleStopTimerAction(item)} icon="stop" style={styles.actionButton}>
                    Stop
                  </Button>
                )}
                {item.isCompleted && (
                  <Button mode="outlined" onPress={() => handleResetTimer(item)} icon="refresh" style={styles.actionButton}>
                    Reset
                  </Button>
                )}
                <Button
                  mode="text"
                  onPress={() => handleDeleteTimer(item)}
                  textColor={theme.colors.error}
                  icon="delete"
                  style={styles.actionButton}>
                  Delete
                </Button>
              </>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAlarm = ({ item }: { item: Alarm }) => {
    const timeUntil = getTimeUntilAlarm(item);
    let alarmTime = new Date(item.time);
    const now = new Date();
    
    // For one-time alarms, adjust date if needed for display
    const isRecurring = !!(item.recurrenceRule && item.recurrenceRule !== 'none');
    if (!isRecurring) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const alarmDate = new Date(alarmTime);
      alarmDate.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (alarmDate.getTime() === tomorrow.getTime()) {
        const alarmTimeToday = new Date(today);
        alarmTimeToday.setHours(alarmTime.getHours(), alarmTime.getMinutes(), 0, 0);
        if (alarmTimeToday.getTime() > now.getTime()) {
          alarmTime = alarmTimeToday;
        }
      }
    }
    
    const isPast = alarmTime.getTime() <= now.getTime();
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text variant="titleMedium" style={styles.itemTitle}>
                {item.title}
              </Text>
              <Text variant="headlineSmall" style={[styles.alarmTime, { color: theme.colors.primary }]}>
                {alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text variant="bodySmall" style={[styles.timeUntilText, { color: theme.colors.onSurfaceVariant }]}>
                {isPast && !isRecurring ? 'Alarm passed' : `Alarm rings in ${timeUntil}`}
              </Text>
              <Chip mode="outlined" compact style={styles.chip}>
                {getRecurrenceText(item)}
              </Chip>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => handleToggleAlarm(item.id)}
              trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
              thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
            />
          </View>

          <View style={styles.actions}>
            <Button
              mode="text"
              onPress={() => handleDeleteAlarm(item.id)}
              textColor={theme.colors.error}
              icon="delete"
              style={styles.actionButton}>
              Delete
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };


  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {activeTab === 'alarms' ? '⏰ No alarms yet' : '⏱️ No timers yet'}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        {activeTab === 'alarms' 
          ? 'Create your first alarm to get started' 
          : 'Create your first timer and stay productive!'}
      </Text>
      <Button
        mode="contained"
        onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
        style={styles.createButton}
        icon="plus">
        {activeTab === 'alarms' ? 'Create Alarm' : 'Create Timer'}
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'alarms' | 'timers')}
          buttons={[
            { value: 'alarms', label: 'Alarms', icon: 'alarm' },
            { value: 'timers', label: 'Timers', icon: 'timer' },
          ]}
          style={styles.segmentedButtons}
        />
        {activeTab === 'alarms' && alarms.length > 0 && (
          <IconButton
            icon="delete-sweep"
            size={24}
            iconColor={theme.colors.error}
            onPress={handleDeleteAllAlarms}
            style={styles.deleteAllButton}
          />
        )}
      </View>

      {activeTab === 'alarms' ? (
        <FlatList<Alarm>
          data={alarms}
          renderItem={renderAlarm}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchAlarms}
          extraData={timeUpdateKey} // Force re-render when time updates
        />
      ) : (
        <FlatList<Timer>
          data={timers}
          renderItem={renderTimer}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchTimers}
        />
      )}

      {!activeAlarmId && !activeTimerId && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
          // label={activeTab === 'alarms' ? 'Add Alarm' : 'Add Timer'}
        />
      )}

      <Portal>
        <Dialog
          visible={!!pendingAlarm}
          onDismiss={handleAlarmDialogStop}
          dismissable={false}
        >
          <Dialog.Content>
            <View style={styles.dialogHeader}>
              <Avatar.Icon
                size={48}
                icon="alarm"
                color={theme.colors.onPrimary}
                style={[styles.dialogIcon, { backgroundColor: theme.colors.error }]}
              />
              <View style={styles.dialogTextContainer}>
                <Text variant="titleLarge" style={styles.dialogTitle}>
                  {t('alarms.alarmRingingTitle') || 'Alarm Ringing'}
                </Text>
                <Text variant="bodyMedium" style={styles.dialogSubtitle}>
                  {pendingAlarm?.title}
                </Text>
              </View>
            </View>
            <Text variant="bodyMedium" style={styles.dialogBody}>
              {t('alarms.alarmRingingBody') || 'Tap stop to silence the alarm.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              icon="stop-circle"
              onPress={handleAlarmDialogStop}
              style={styles.dialogButton}
            >
              {t('common.stop') || 'Stop'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={!!pendingTimer}
          onDismiss={handleTimerDialogStop}
          dismissable={false}
        >
          <Dialog.Content>
            <View style={styles.dialogHeader}>
              <Avatar.Icon
                size={48}
                icon="timer-sand"
                color={theme.colors.onPrimary}
                style={[styles.dialogIcon, { backgroundColor: theme.colors.primary }]}
              />
              <View style={styles.dialogTextContainer}>
                <Text variant="titleLarge" style={styles.dialogTitle}>
                  {t('timers.timerRingingTitle') || 'Timer Finished'}
                </Text>
                <Text variant="bodyMedium" style={styles.dialogSubtitle}>
                  {pendingTimer?.title}
                </Text>
              </View>
            </View>
            <Text variant="bodyMedium" style={styles.dialogBody}>
              {t('timers.timerRingingBody') || 'Tap stop to silence the timer.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              icon="stop-circle"
              onPress={handleTimerDialogStop}
              style={styles.dialogButton}
            >
              {t('common.stop') || 'Stop'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Modal
          visible={showTimerModal}
          onDismiss={() => setShowTimerModal(false)}
          contentContainerStyle={styles.modalContent}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            ⏱️ Create Timer
          </Text>

          <TextInput
            label="Timer Title"
            value={timerTitle}
            onChangeText={setTimerTitle}
            style={styles.input}
            mode="outlined"
            maxLength={50}
            placeholder="e.g., Focus Session"
          />

          <View style={styles.durationContainer}>
            <Text variant="bodyLarge" style={styles.durationLabel}>
              Duration: {timerDuration} minutes
            </Text>
            <View style={styles.durationButtons}>
              <Button mode="outlined" onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))} style={styles.durationButton}>
                -5
              </Button>
              <Button mode="outlined" onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))} style={styles.durationButton}>
                -1
              </Button>
              <Button mode="outlined" onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))} style={styles.durationButton}>
                +1
              </Button>
              <Button mode="outlined" onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))} style={styles.durationButton}>
                +5
              </Button>
            </View>
          </View>

          <View style={styles.quickDurations}>
            <Text variant="bodySmall" style={styles.quickLabel}>Quick select:</Text>
            {[5, 15, 25, 30, 45, 60].map(mins => (
              <Button 
                key={mins} 
                mode={timerDuration === mins ? 'contained' : 'outlined'}
                onPress={() => setTimerDuration(mins)} 
                style={styles.quickButton}
                compact>
                {mins}m
              </Button>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowTimerModal(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateTimer} style={styles.modalButton} disabled={!timerTitle.trim()}>
              Create
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  segmentedButtons: {
    flex: 1,
  },
  deleteAllButton: {
    margin: 0,
    marginLeft: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  card: {
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  ringingCard: {
    borderWidth: 3,
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorContainer + '30',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  itemInfo: {
    flex: 1,
    alignItems: 'center',
  },
  itemTitle: {
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  timerTime: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontSize: 48,
    letterSpacing: 2,
  },
  alarmTime: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontSize: 28,
  },
  timeUntilText: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    fontSize: 12,
    opacity: 0.7,
  },
  chip: {
    alignSelf: 'center',
    marginTop: theme.spacing.xs,
  },
  ringingChip: {
    backgroundColor: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  ringingText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    minWidth: 90,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  modalTitle: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: theme.spacing.lg,
  },
  durationContainer: {
    marginBottom: theme.spacing.md,
  },
  durationLabel: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  durationButton: {
    minWidth: 60,
  },
  quickDurations: {
    marginBottom: theme.spacing.lg,
  },
  quickLabel: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  quickButton: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dialogIcon: {
    marginRight: theme.spacing.sm,
  },
  dialogTextContainer: {
    flex: 1,
  },
  dialogTitle: {
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  dialogSubtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  dialogBody: {
    marginTop: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  dialogButton: {
    flex: 1,
  },
});
