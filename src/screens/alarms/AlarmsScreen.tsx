import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Switch, 
  Alert, 
  Platform, 
  AppState, 
  Vibration
} from 'react-native';
import Sound from 'react-native-sound';
import PushNotification from 'react-native-push-notification';
import { Text, FAB, Card, Button, Chip, SegmentedButtons, Portal, Modal, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { theme } from '@/utils/theme';
import { useAlarmStore } from '@/store/alarmStore';
import { Alarm, Timer, CreateTimerData } from '@/types/alarm';

// Navigation types
type RootStackParamList = {
  AlarmCreate: undefined;
  AlarmEdit: { alarmId: string };
};

type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
};

// Sound Manager with audio playback and vibration
class SoundManager {
  private vibrationInterval: NodeJS.Timeout | null = null;
  private sound: Sound | null = null;
  private isPlaying = false;

  playAlarmSound() {
    try {
      console.log('🔊 Playing alarm sound with vibration');
      
      // Stop any existing alarm first
      this.stopSound();
      
      // Enable playback in silent mode (iOS)
      Sound.setCategory('Playback', true);
      
      // Start vibration
      this.startVibration();
      
      // Try to play a system notification sound
      // Note: For proper alarm sounds, you should bundle sound files in your app
      // For now, we'll use the system notification sound which works differently per platform
      try {
        // On iOS, we can use system sounds
        // On Android, we'll rely more on vibration and notification system
        if (Platform.OS === 'ios') {
          // iOS: Use system sound (this will play even in silent mode due to category)
          // Create a simple beep pattern using vibration + system sound
          this.sound = new Sound(
            'default', // System default sound
            Sound.MAIN_BUNDLE,
            (error) => {
              if (error) {
                console.log('Failed to load sound on iOS, using vibration only:', error);
                this.isPlaying = true;
                return;
              }
              
              // Play sound in loop
              this.sound?.setNumberOfLoops(-1);
              this.sound?.setVolume(1.0);
              this.sound?.play((success) => {
                if (success) {
                  console.log('Sound playing successfully on iOS');
                } else {
                  console.log('Sound playback failed on iOS');
                }
              });
              this.isPlaying = true;
            }
          );
        } else {
          // Android: The notification system will handle sound when app is in background
          // For foreground, we'll use vibration primarily
          // You can add a bundled sound file here if needed
          console.log('Android: Using vibration and notification system for sound');
          this.isPlaying = true;
        }
      } catch (soundError) {
        console.log('Sound initialization failed, using vibration only:', soundError);
        this.isPlaying = true;
      }
      
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Fallback: just vibration
      this.startVibration();
      this.isPlaying = true;
    }
  }

  startVibration() {
    try {
      // More noticeable vibration pattern
      if (Platform.OS === 'android') {
        // Android: Use pattern vibration
        Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
      } else {
        // iOS: Use interval-based vibration
        this.vibrationInterval = setInterval(() => {
          Vibration.vibrate(1000);
        }, 2000);
      }
      console.log('Vibration started');
    } catch (error) {
      console.error('Vibration error:', error);
      throw error; // Re-throw to handle in calling function
    }
  }

  stopSound() {
    try {
      console.log('🔇 Stopping alarm sound');
      
      // Stop sound
      if (this.sound) {
        this.sound.stop(() => {
          this.sound?.release();
          this.sound = null;
        });
      }
      
      // Stop vibration
      Vibration.cancel();
      
      // Clear vibration interval
      if (this.vibrationInterval) {
        clearInterval(this.vibrationInterval);
        this.vibrationInterval = null;
      }
      
      this.isPlaying = false;
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const AlarmsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState('timers');
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerTitle, setTimerTitle] = useState('New Timer');
  const [timerDuration, setTimerDuration] = useState(25);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const [completedTimerId, setCompletedTimerId] = useState<string | null>(null);

  const soundManager = useRef(new SoundManager()).current;
  const appState = useRef(AppState.currentState);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    snoozeAlarm,
    dismissAlarm,
  } = useAlarmStore();

  // Track which alarms have already fired per minute to prevent duplicate alerts
  // Key format: "alarmId:YYYY-MM-DD-HH-MM"
  const firedAlarmsRef = useRef<Set<string>>(new Set());
  
  // Get minute key for an alarm (uses current date for recurring alarms)
  const getAlarmMinuteKey = (alarmId: string, alarmTime: Date, isRecurring: boolean = false): string => {
    const dateToUse = isRecurring ? new Date() : alarmTime;
    const year = dateToUse.getFullYear();
    const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
    const day = String(dateToUse.getDate()).padStart(2, '0');
    const hour = String(alarmTime.getHours()).padStart(2, '0'); // Always use alarm time's hour/minute
    const minute = String(alarmTime.getMinutes()).padStart(2, '0');
    return `${alarmId}:${year}-${month}-${day}-${hour}-${minute}`;
  };
  
  // Handle alarm fired
  const handleAlarmFired = React.useCallback((alarm: Alarm) => {
    const alarmTime = new Date(alarm.time);
    const isRecurring = !!(alarm.recurrenceRule && alarm.recurrenceRule !== 'none');
    const minuteKey = getAlarmMinuteKey(alarm.id, alarmTime, isRecurring);
    
    // Prevent duplicate alerts for the same alarm in the same minute
    if (firedAlarmsRef.current.has(minuteKey)) {
      console.log(`⏸️ Alarm ${alarm.id} already fired this minute, skipping duplicate`);
      return;
    }
    
    console.log('🎯 Handling alarm fired:', alarm.title, 'at', new Date().toISOString());
    
    // Mark this alarm as fired for this minute
    firedAlarmsRef.current.add(minuteKey);
    
    // Clean up old keys (older than 1 hour) to prevent memory leak
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    firedAlarmsRef.current.forEach(key => {
      const [, datePart] = key.split(':');
      const [year, month, day, hour, minute] = datePart.split('-').map(Number);
      const keyDate = new Date(year, month - 1, day, hour, minute);
      if (keyDate < oneHourAgo) {
        firedAlarmsRef.current.delete(key);
      }
    });
    
    // Play sound and vibration
    soundManager.playAlarmSound();
    setAlarmPlaying(true);
    
    // Show alert
    Alert.alert(
      '⏰ Alarm',
      alarm.title,
      [
        {
          text: 'Dismiss',
          onPress: () => {
            soundManager.stopSound();
            setAlarmPlaying(false);
            // Note: We don't delete the minuteKey here so it won't fire again this minute
            // Dismiss the alarm
            dismissAlarm(alarm.id);
          },
        },
        {
          text: 'Snooze',
          onPress: () => {
            soundManager.stopSound();
            setAlarmPlaying(false);
            // Note: We don't delete the minuteKey here so it won't fire again this minute
            // Snooze the alarm
            const snoozeDuration = alarm.snoozeConfig?.duration || 5;
            snoozeAlarm(alarm.id, snoozeDuration);
          },
        },
      ],
      { 
        cancelable: false,
        onDismiss: () => {
          soundManager.stopSound();
          setAlarmPlaying(false);
          // Note: We don't delete the minuteKey here so it won't fire again this minute
        }
      }
    );
  }, [soundManager, dismissAlarm, snoozeAlarm]);
  
  // Check if alarm should fire based on recurrence
  const shouldAlarmFireToday = (alarm: Alarm, now: Date): boolean => {
    if (!alarm.recurrenceRule || alarm.recurrenceRule === 'none') {
      // One-time alarm: check if it's the exact date
      const alarmTime = new Date(alarm.time);
      return (
        now.getFullYear() === alarmTime.getFullYear() &&
        now.getMonth() === alarmTime.getMonth() &&
        now.getDate() === alarmTime.getDate()
      );
    }

    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    switch (alarm.recurrenceRule) {
      case 'daily':
        return true; // Fire every day
      case 'weekdays':
        return currentDay >= 1 && currentDay <= 5; // Monday to Friday
      case 'weekends':
        return currentDay === 0 || currentDay === 6; // Saturday or Sunday
      case 'weekly':
        // Fire on the same day of the week as when it was created
        const alarmTime = new Date(alarm.time);
        return currentDay === alarmTime.getDay();
      default:
        // For RFC 5545 or other formats, default to daily
        return true;
    }
  };

  // Check for alarms that should have fired
  const checkAlarmsThatShouldHaveFired = React.useCallback(() => {
    const now = new Date();
    const currentAlarms = alarms; // Use current alarms from closure
    
    currentAlarms.forEach(alarm => {
      if (alarm.enabled && !alarmPlaying) {
        const alarmTime = new Date(alarm.time);
        const isRecurring = !!(alarm.recurrenceRule && alarm.recurrenceRule !== 'none');
        const minuteKey = getAlarmMinuteKey(alarm.id, alarmTime, isRecurring);
        
        // Check if alarm time has passed and we're in the same minute
        const nowMinutes = now.getMinutes();
        const alarmMinutes = alarmTime.getMinutes();
        const nowHours = now.getHours();
        const alarmHours = alarmTime.getHours();
        const nowDate = now.getDate();
        const alarmDate = alarmTime.getDate();
        const nowMonth = now.getMonth();
        const alarmMonth = alarmTime.getMonth();
        const nowYear = now.getFullYear();
        const alarmYear = alarmTime.getFullYear();
        
        // Check if we're in the exact minute when the alarm should fire
        const isSameMinute = 
          nowYear === alarmYear &&
          nowMonth === alarmMonth &&
          nowDate === alarmDate &&
          nowHours === alarmHours &&
          nowMinutes === alarmMinutes;
        
        // For recurring alarms, check if it should fire today (based on recurrence rule)
        // and if the time matches
        const shouldFireToday = shouldAlarmFireToday(alarm, now);
        const timeMatches = nowHours === alarmHours && nowMinutes === alarmMinutes;
        
        // For one-time alarms, check exact date and time
        // For recurring alarms, check if it should fire today and time matches
        const shouldFire = alarm.recurrenceRule && alarm.recurrenceRule !== 'none'
          ? (shouldFireToday && timeMatches && !firedAlarmsRef.current.has(minuteKey))
          : (isSameMinute && !firedAlarmsRef.current.has(minuteKey));
        
        if (shouldFire) {
          console.log(`⏰ Alarm "${alarm.title}" should fire now! Time: ${alarmTime.toISOString()}, Now: ${now.toISOString()}, Recurrence: ${alarm.recurrenceRule || 'none'}`);
          handleAlarmFired(alarm);
        }
      }
    });
  }, [alarms, alarmPlaying, handleAlarmFired]);
  
  // Initialize
  useEffect(() => {
    fetchAlarms();
    fetchTimers();

    // Check for alarms that should fire every second (more aggressive)
    const alarmCheckInterval = setInterval(() => {
      checkAlarmsThatShouldHaveFired();
    }, 1000); // Check every 1 second

    // Handle app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchTimers();
        fetchAlarms();
        
        // Check for any alarms that should have fired
        checkAlarmsThatShouldHaveFired();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(alarmCheckInterval);
      subscription.remove();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      soundManager.stopSound();
    };
  }, []);
  
  // Use effect to check alarms when alarms list changes
  useEffect(() => {
    // Check immediately when alarms list changes
    checkAlarmsThatShouldHaveFired();
    
    // Also set up a more frequent check when we have active alarms
    const enabledAlarms = alarms.filter(a => a.enabled);
    if (enabledAlarms.length > 0) {
      const quickCheckInterval = setInterval(() => {
        checkAlarmsThatShouldHaveFired();
      }, 1000); // Check every second when alarms are active
      
      return () => clearInterval(quickCheckInterval);
    }
  }, [alarms, checkAlarmsThatShouldHaveFired]);
  
  // Clear fired alarms when alarms list changes (new alarms added)
  useEffect(() => {
    const currentAlarmIds = new Set(alarms.map(a => a.id));
    // Remove IDs that are no longer in the alarms list
    firedAlarmsRef.current.forEach(id => {
      if (!currentAlarmIds.has(id)) {
        firedAlarmsRef.current.delete(id);
      }
    });
  }, [alarms]);

  // Client-side timer countdown
  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Find running timer
    const runningTimer = timers.find(t => t.isRunning && !t.isPaused && t.remainingTime > 0);

    if (runningTimer) {
      console.log('Starting countdown for:', runningTimer.title, 'Remaining:', runningTimer.remainingTime);
      
      timerIntervalRef.current = setInterval(() => {
        // Get fresh timer data
        const currentTimer = timers.find(t => t.id === runningTimer.id);
        
        if (!currentTimer || !currentTimer.isRunning || currentTimer.isPaused) {
          // Timer was stopped or paused
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return;
        }

        const updatedTime = currentTimer.remainingTime - 1;
        
        if (updatedTime <= 0) {
          // Timer completed!
          console.log('⏰ Timer completed!', currentTimer.title);
          
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          handleTimerCompletion(currentTimer);
        } else {
          // Update remaining time
          updateTimerRemainingTime(currentTimer.id, updatedTime);
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timers]);

  // Handle timer completion
  const handleTimerCompletion = async (timer: Timer) => {
    try {
      console.log('🎯 Handling timer completion:', timer.title);
      
      // Play sound and vibration
      soundManager.playAlarmSound();
      setAlarmPlaying(true);
      setCompletedTimerId(timer.id);

      // Stop the timer in store
      await stopTimer(timer.id);
      if (activeTimer?.id === timer.id) {
        setActiveTimer(null);
      }

      // Show alert with option to stop alarm
      Alert.alert(
        '⏰ Timer Complete!',
        `${timer.title} is complete!`,
        [
          {
            text: 'Stop Alarm',
            onPress: () => {
              soundManager.stopSound();
              setAlarmPlaying(false);
              setCompletedTimerId(null);
            },
          },
        ],
        { 
          cancelable: false,
          onDismiss: () => {
            // Auto-stop when alert is dismissed
            soundManager.stopSound();
            setAlarmPlaying(false);
            setCompletedTimerId(null);
          }
        }
      );
    } catch (error) {
      console.error('Error handling timer completion:', error);
      // Fallback: show alert without vibration
      Alert.alert(
        '⏰ Timer Complete!',
        `${timer.title}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAlarmPlaying(false);
              setCompletedTimerId(null);
            },
          },
        ]
      );
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  const handleCreateTimer = async () => {
    if (!timerTitle.trim()) {
      Alert.alert('Error', 'Please enter a timer title');
      return;
    }

    try {
      const timerData: CreateTimerData = {
        title: timerTitle.trim(),
        duration: timerDuration,
      };
      await createTimer(timerData);
      setShowTimerModal(false);
      setTimerTitle('');
      setTimerDuration(25);
    } catch (error) {
      Alert.alert('Error', 'Failed to create timer');
    }
  };

  const handleStartTimer = async (timer: Timer) => {
    try {
      await startTimer(timer.id);
      setActiveTimer(timer);
    } catch (error) {
      Alert.alert('Error', 'Failed to start timer');
    }
  };

  const handlePauseTimer = async (timer: Timer) => {
    try {
      await pauseTimer(timer.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to pause timer');
    }
  };

  const handleStopTimer = async (timer: Timer) => {
    try {
      await stopTimer(timer.id);
      if (activeTimer?.id === timer.id) {
        setActiveTimer(null);
      }
      
      // Stop alarm if this timer is ringing
      if (alarmPlaying && completedTimerId === timer.id) {
        soundManager.stopSound();
        setAlarmPlaying(false);
        setCompletedTimerId(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop timer');
    }
  };

  const handleResetTimer = async (timer: Timer) => {
    try {
      await resetTimer(timer.id);
    } catch (error) {
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
              
              // Stop alarm if this timer is ringing
              if (alarmPlaying && completedTimerId === timer.id) {
                soundManager.stopSound();
                setAlarmPlaying(false);
                setCompletedTimerId(null);
              }
            } catch (error) {
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
    } catch (error) {
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
              await deleteAlarm(alarmId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete alarm');
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

  const getTimerStatusColor = (timer: Timer) => {
    if (timer.isCompleted) return theme.colors.success;
    if (timer.isRunning) return theme.colors.primary;
    if (timer.isPaused) return theme.colors.warning;
    return theme.colors.outline;
  };

  const getTimerStatusText = (timer: Timer) => {
    if (timer.isCompleted) return 'Completed';
    if (timer.isRunning) return 'Running';
    if (timer.isPaused) return 'Paused';
    return 'Stopped';
  };

  const getAlarmDaysText = (alarm: Alarm) => {
    if (!alarm.recurrenceRule) return 'Once';
    if (alarm.recurrenceRule.includes('FREQ=DAILY')) return 'Every day';
    return 'Custom';
  };

  // Render functions
  const renderTimer = ({ item }: { item: Timer }) => {
    const isRinging = alarmPlaying && completedTimerId === item.id;

    return (
      <Card style={[
        styles.timerCard,
        activeTimer?.id === item.id && styles.activeTimerCard,
        isRinging && styles.ringingTimerCard,
      ]}>
        <Card.Content>
          <View style={styles.timerHeader}>
            <View style={styles.timerInfo}>
              <Text variant="titleMedium" style={styles.timerTitle}>
                {item.title}
              </Text>
              <Text variant="headlineLarge" style={[styles.timerTime, { color: getTimerStatusColor(item) }]}>
                {formatTime(item.remainingTime)}
              </Text>
              <Text variant="bodySmall" style={[styles.timerStatus, { color: getTimerStatusColor(item) }]}>
                {getTimerStatusText(item)}
              </Text>
              {isRinging && (
                <Chip mode="flat" style={styles.ringingChip} textStyle={styles.ringingText}>
                  🔊 RINGING
                </Chip>
              )}
            </View>
          </View>

          <View style={styles.timerDetails}>
            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Duration:
              </Text>
              <Text variant="bodySmall" style={styles.detailValue}>
                {item.duration} minutes
              </Text>
            </View>
          </View>

          <View style={styles.timerActions}>
            {isRinging && (
              <Button 
                mode="contained" 
                onPress={() => {
                  soundManager.stopSound();
                  setAlarmPlaying(false);
                  setCompletedTimerId(null);
                }} 
                style={[styles.actionButton, styles.stopAlarmButton]}
                icon="bell-off"
                buttonColor={theme.colors.error}>
                Stop Alarm
              </Button>
            )}
            {!isRinging && !item.isRunning && !item.isCompleted && (
              <Button mode="contained" onPress={() => handleStartTimer(item)} style={styles.actionButton} icon="play">
                Start
              </Button>
            )}
            {!isRinging && item.isRunning && !item.isPaused && (
              <Button mode="outlined" onPress={() => handlePauseTimer(item)} style={styles.actionButton} icon="pause">
                Pause
              </Button>
            )}
            {!isRinging && item.isPaused && (
              <Button mode="contained" onPress={() => handleStartTimer(item)} style={styles.actionButton} icon="play">
                Resume
              </Button>
            )}
            {!isRinging && (item.isRunning || item.isPaused) && (
              <Button mode="outlined" onPress={() => handleStopTimer(item)} style={styles.actionButton} icon="stop">
                Stop
              </Button>
            )}
            {!isRinging && item.isCompleted && (
              <Button mode="outlined" onPress={() => handleResetTimer(item)} style={styles.actionButton} icon="refresh">
                Reset
              </Button>
            )}
            {!isRinging && (
              <Button
                mode="text"
                onPress={() => handleDeleteTimer(item)}
                textColor={theme.colors.error}
                style={styles.actionButton}
                icon="delete">
                Delete
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <Card style={styles.alarmCard}>
      <Card.Content>
        <View style={styles.alarmHeader}>
          <View style={styles.alarmInfo}>
            <Text variant="titleMedium" style={styles.alarmTitle}>
              {item.title}
            </Text>
            <Text variant="headlineSmall" style={styles.alarmTime}>
              {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Chip mode="outlined" compact style={styles.daysChip}>
              {getAlarmDaysText(item)}
            </Chip>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => handleToggleAlarm(item.id)}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
            thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
          />
        </View>

        <View style={styles.alarmActions}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('AlarmEdit', { alarmId: item.id })}
            style={styles.actionButton}
            icon="pencil">
            Edit
          </Button>
          <Button
            mode="text"
            onPress={() => handleDeleteAlarm(item.id)}
            textColor={theme.colors.error}
            style={styles.actionButton}
            icon="delete">
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

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
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'alarms', label: 'Alarms', icon: 'alarm' },
          { value: 'timers', label: 'Timers', icon: 'timer' },
        ]}
        style={styles.segmentedButtons}
      />

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

      {!alarmPlaying && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
          label={activeTab === 'alarms' ? 'Add Alarm' : 'Add Timer'}
        />
      )}

      <Portal>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  segmentedButtons: {
    margin: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.sm,
    flexGrow: 1,
  },
  timerCard: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    elevation: 2,
  },
  activeTimerCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    elevation: 8,
  },
  ringingTimerCard: {
    borderWidth: 3,
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '15',
    elevation: 12,
  },
  alarmCard: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    elevation: 2,
  },
  timerHeader: {
    marginBottom: theme.spacing.md,
  },
  timerInfo: {
    alignItems: 'center',
  },
  timerTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  timerTime: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontSize: 48,
    letterSpacing: 2,
  },
  timerStatus: {
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  ringingChip: {
    backgroundColor: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  ringingText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  timerDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    color: theme.colors.textSecondary,
  },
  detailValue: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  timerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    minWidth: 90,
  },
  stopAlarmButton: {
    minWidth: 150,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTitle: {
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  alarmTime: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontSize: 28,
  },
  daysChip: {
    alignSelf: 'flex-start',
    height: 24,
  },
  alarmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    lineHeight: 22,
  },
  createButton: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    maxHeight: '80%',
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
    fontSize: 18,
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
});


