import { create } from 'zustand';
import { Alarm, CreateAlarmData, UpdateAlarmData, Timer, CreateTimerData, UpdateTimerData } from '@/types/alarm';
import { alarmService } from '@/services/alarmApiService';
import { notificationService } from '@/services/notificationService';
import { reliableAlarmService } from '@/services/ReliableAlarmService';
import { useAuthStore } from '@/store/authStore';

interface AlarmState {
  // State
  alarms: Alarm[];
  timers: Timer[];
  activeTimer: Timer | null;
  loading: boolean;
  error: string | null;
  lastSaveTime: number | null;
  countdownInterval: NodeJS.Timeout | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions
  fetchAlarms: (page?: number, limit?: number, enabled?: boolean) => Promise<void>;
  fetchTimers: (page?: number, limit?: number) => Promise<void>;
  createAlarm: (data: CreateAlarmData) => Promise<Alarm>;
  updateAlarm: (id: string, data: UpdateAlarmData) => Promise<Alarm>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  snoozeAlarm: (id: string, duration?: number) => Promise<void>;
  dismissAlarm: (id: string) => Promise<void>;

  createTimer: (data: CreateTimerData) => Promise<Timer>;
  updateTimer: (id: string, data: UpdateTimerData) => Promise<Timer>;
  deleteTimer: (id: string) => Promise<void>;
  startTimer: (id: string) => Promise<void>;
  pauseTimer: (id: string) => Promise<void>;
  stopTimer: (id: string) => Promise<void>;
  resetTimer: (id: string) => Promise<void>;
  setActiveTimer: (timer: Timer | null) => void;
  updateTimerRemainingTime: (id: string, remainingTime: number) => void;

  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Timer countdown methods
  startCountdown: () => void;
  stopCountdown: () => void;
  checkTimerCompletion: () => void;

  // Local storage methods for offline support
  saveTimersToStorage: () => Promise<void>;
  loadTimersFromStorage: () => Promise<Timer[]>;
}

const inFlightAlarmDeletes = new Set<string>();

export const useAlarmStore = create<AlarmState>((set, get) => ({
  // Initial state
  alarms: [],
  timers: [],
  activeTimer: null,
  loading: false,
  error: null,
  lastSaveTime: null,
  countdownInterval: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },

  // Alarm actions
  fetchAlarms: async (page = 1, limit = 20, enabled) => {
    try {
      set({ loading: true, error: null });
      const response = await alarmService.getAlarms(page, limit, enabled);
      set({
        alarms: response.data,
        pagination: response.pagination,
        loading: false,
      });

      // Schedule all enabled alarms using native Android AlarmManager
      const enabledAlarms = response.data.filter(a => a.enabled);
      enabledAlarms.forEach(alarm => {
        reliableAlarmService.scheduleAlarm(alarm).catch((error) => {
          console.error(`Failed to schedule native alarm ${alarm.id}:`, error);
        });
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch alarms',
        loading: false,
      });
    }
  },

  fetchTimers: async (page = 1, limit = 20) => {
    try {
      set({ loading: true, error: null });

      // Try to fetch from server first
      try {
        const response = await alarmService.getTimers(page, limit);
        set({
          timers: response.data,
          pagination: response.pagination,
          loading: false,
        });
      } catch (serverError) {

        // Load from local storage or create default timers
        const storedTimers = await get().loadTimersFromStorage();
        const localTimers = storedTimers.length > 0 ? storedTimers : [
          {
            id: 'default_pomodoro',
            title: 'Pomodoro Timer',
            duration: 25,
            remainingTime: 25 * 60,
            isRunning: false,
            isPaused: false,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'local',
          }
        ];

        set({
          timers: localTimers,
          pagination: {
            page: 1,
            limit: 20,
            total: localTimers.length,
            totalPages: 1,
          },
          loading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch timers',
        loading: false,
      });
    }
  },

  createAlarm: async (data) => {
    try {
      set({ loading: true, error: null });
      const alarm = await alarmService.createAlarm(data);
      set((state) => ({
        alarms: [alarm, ...state.alarms],
        loading: false,
      }));

      // Schedule the new alarm using native Android AlarmManager if enabled
      if (alarm.enabled) {
        reliableAlarmService.scheduleAlarm(alarm).catch((error) => {
          console.error('Failed to schedule native alarm:', error);
        });
      }

      return alarm;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create alarm',
        loading: false,
      });
      throw error;
    }
  },

  updateAlarm: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const alarm = await alarmService.updateAlarm(id, data);
      set((state) => ({
        alarms: state.alarms.map((a) => (a.id === id ? alarm : a)),
        loading: false,
      }));

      // Reschedule the alarm if it was updated
      reliableAlarmService.cancelAlarm(id).catch((error) => {
        console.error('Failed to cancel native alarm:', error);
      });
      if (alarm.enabled) {
        notificationService.scheduleAlarm(alarm);
      }

      return alarm;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update alarm',
        loading: false,
      });
      throw error;
    }
  },

  deleteAlarm: async (id) => {
    const { isAuthenticated } = useAuthStore.getState();

    if (inFlightAlarmDeletes.has(id)) {
      console.log(`Delete already in progress for alarm ${id}, skipping duplicate request.`);
      return;
    }

    if (!isAuthenticated) {
      // Update store locally and ensure the scheduled notification is removed
      set((state) => ({
        alarms: state.alarms.filter((a) => a.id !== id),
        loading: false,
      }));
      reliableAlarmService.cancelAlarm(id).catch((error) => {
        console.error('Failed to cancel native alarm:', error);
      });
      return;
    }

    inFlightAlarmDeletes.add(id);

    try {
      set({ loading: true, error: null });
      await alarmService.deleteAlarm(id);
      set((state) => ({
        alarms: state.alarms.filter((a) => a.id !== id),
        loading: false,
      }));

      // Cancel the scheduled alarm
      reliableAlarmService.cancelAlarm(id).catch((error) => {
        console.error('Failed to cancel native alarm:', error);
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete alarm',
        loading: false,
      });
      throw error;
    } finally {
      inFlightAlarmDeletes.delete(id);
    }
  },

  toggleAlarm: async (id) => {
    try {
      const alarm = get().alarms.find((a) => a.id === id);
      if (!alarm) return;

      const updatedAlarm = await alarmService.updateAlarm(id, {
        enabled: !alarm.enabled,
      });

      set((state) => ({
        alarms: state.alarms.map((a) => (a.id === id ? updatedAlarm : a)),
      }));

      // Reschedule or cancel alarm using native Android AlarmManager based on new enabled state
      reliableAlarmService.cancelAlarm(id).catch((error) => {
        console.error('Failed to cancel native alarm:', error);
      });
      if (updatedAlarm.enabled) {
        reliableAlarmService.scheduleAlarm(updatedAlarm).catch((error) => {
          console.error('Failed to schedule native alarm:', error);
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle alarm',
      });
    }
  },

  snoozeAlarm: async (id, duration = 5) => {
    try {
      const alarm = get().alarms.find((a) => a.id === id);
      if (!alarm) return;

      // Cancel current alarm
      await reliableAlarmService.cancelAlarm(id);

      // Calculate snooze time (default 5 minutes)
      const snoozeTime = new Date(Date.now() + duration * 60 * 1000);
      
      // Create snooze alarm
      const snoozeAlarm: Alarm = {
        ...alarm,
        id: `${id}_snooze_${Date.now()}`,
        time: snoozeTime.toISOString(),
        recurrenceRule: 'none', // Snooze is always one-time
      };

      // Schedule snooze alarm using native Android AlarmManager
      await reliableAlarmService.scheduleAlarm(snoozeAlarm);

      // If authenticated, also update backend
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
    try {
      await alarmService.snoozeAlarm(id, duration);
        } catch (error) {
          console.error('Failed to sync snooze to backend:', error);
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to snooze alarm',
      });
    }
  },

  dismissAlarm: async (id) => {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      reliableAlarmService.cancelAlarm(id).catch((error) => {
        console.error('Failed to cancel native alarm:', error);
      });
      return;
    }

    try {
      await alarmService.dismissAlarm(id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to dismiss alarm',
      });
    }
  },

  // Timer actions
  createTimer: async (data) => {
    try {
      set({ loading: true, error: null });

      // Create timer locally first for immediate UI response
      const localTimer: Timer = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        duration: data.duration,
        remainingTime: data.duration * 60, // convert minutes to seconds
        isRunning: false,
        isPaused: false,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'local', // Will be updated when synced
      };

      set((state) => ({
        timers: [localTimer, ...state.timers],
        loading: false,
      }));

      // Save to local storage (async)
      get().saveTimersToStorage().catch(err => console.log('Failed to save timers:', err));

      // Try to sync with backend in background (don't wait for it)
      try {
        const serverTimer = await alarmService.createTimer(data);
        set((state) => ({
          timers: state.timers.map(t =>
            t.id === localTimer.id ? { ...serverTimer, remainingTime: localTimer.remainingTime } : t
          ),
        }));
      } catch (syncError) {
        console.log('Timer sync failed, using local version:', syncError);
        // Keep using local timer
      }

      return localTimer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create timer',
        loading: false,
      });
      throw error;
    }
  },

  updateTimer: async (id, data) => {
    try {
      set({ loading: true, error: null });

      // Update timer locally first
      const currentTimer = get().timers.find(t => t.id === id);
      if (!currentTimer) {
        throw new Error('Timer not found');
      }

      const updatedTimer: Timer = {
        ...currentTimer,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        timers: state.timers.map((t) => (t.id === id ? updatedTimer : t)),
        activeTimer: state.activeTimer?.id === id ? updatedTimer : state.activeTimer,
        loading: false,
      }));

      // Save to local storage (async)
      get().saveTimersToStorage().catch(err => console.log('Failed to save timers:', err));

      // Try to sync with backend in background
      if (!id.startsWith('local_')) {
        try {
          const serverTimer = await alarmService.updateTimer(id, data);
          set((state) => ({
            timers: state.timers.map((t) => (t.id === id ? { ...serverTimer, remainingTime: updatedTimer.remainingTime } : t)),
            activeTimer: state.activeTimer?.id === id ? { ...serverTimer, remainingTime: updatedTimer.remainingTime } : state.activeTimer,
          }));
        } catch (syncError) {
          console.log('Timer update sync failed, using local version:', syncError);
        }
      }

      return updatedTimer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update timer',
        loading: false,
      });
      throw error;
    }
  },

  deleteTimer: async (id) => {
    try {
      set({ loading: true, error: null });

      // Remove timer locally first
      set((state) => ({
        timers: state.timers.filter((t) => t.id !== id),
        activeTimer: state.activeTimer?.id === id ? null : state.activeTimer,
        loading: false,
      }));

      // Save to local storage (async)
      get().saveTimersToStorage().catch(err => console.log('Failed to save timers:', err));

      // Try to sync with backend in background
      if (!id.startsWith('local_')) {
        try {
          await alarmService.deleteTimer(id);
        } catch (syncError) {
          console.log('Timer delete sync failed, already removed locally:', syncError);
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete timer',
        loading: false,
      });
      throw error;
    }
  },

  startTimer: async (id) => {
    try {
      // Update timer locally first
      const currentTimer = get().timers.find(t => t.id === id);
      if (!currentTimer) {
        throw new Error('Timer not found');
      }

      // Stop any other running timers
      set((state) => ({
        timers: state.timers.map((t) =>
          t.id !== id && t.isRunning ? { ...t, isRunning: false, isPaused: false } : t
        ),
        activeTimer: null,
      }));

      const updatedTimer: Timer = {
        ...currentTimer,
        isRunning: true,
        isPaused: false,
        isCompleted: false,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        timers: state.timers.map((t) => (t.id === id ? updatedTimer : t)),
        activeTimer: updatedTimer,
      }));

      // Schedule notification for timer completion (for background execution)
      notificationService.scheduleTimer(updatedTimer.id, updatedTimer.title, updatedTimer.remainingTime);

      // Start countdown
      get().startCountdown();

      // Save to local storage (async)
      get().saveTimersToStorage().catch(err => console.log('Failed to save timers:', err));

      // Try to sync with backend in background
      if (!id.startsWith('local_')) {
        try {
          const serverTimer = await alarmService.startTimer(id);
          set((state) => ({
            timers: state.timers.map((t) => (t.id === id ? { ...serverTimer, remainingTime: updatedTimer.remainingTime } : t)),
            activeTimer: { ...serverTimer, remainingTime: updatedTimer.remainingTime },
          }));
        } catch (syncError) {
          console.log('Timer start sync failed, using local version:', syncError);
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start timer',
      });
    }
  },

  pauseTimer: async (id) => {
    try {
      // Update timer locally first
      const currentTimer = get().timers.find(t => t.id === id);
      if (!currentTimer) {
        throw new Error('Timer not found');
      }

      const updatedTimer: Timer = {
        ...currentTimer,
        isRunning: false,
        isPaused: true,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        timers: state.timers.map((t) => (t.id === id ? updatedTimer : t)),
        activeTimer: state.activeTimer?.id === id ? updatedTimer : state.activeTimer,
      }));

      // Cancel scheduled notification when pausing
      notificationService.cancelTimer(id);

      // Stop countdown when pausing
      get().stopCountdown();

      // Save to local storage (async)
      get().saveTimersToStorage().catch(err => console.log('Failed to save timers:', err));

      // Try to sync with backend in background
      if (!id.startsWith('local_')) {
        try {
          const serverTimer = await alarmService.pauseTimer(id);
          set((state) => ({
            timers: state.timers.map((t) => (t.id === id ? { ...serverTimer, remainingTime: updatedTimer.remainingTime } : t)),
            activeTimer: state.activeTimer?.id === id ? { ...serverTimer, remainingTime: updatedTimer.remainingTime } : state.activeTimer,
          }));
        } catch (syncError) {
          console.log('Timer pause sync failed, using local version:', syncError);
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to pause timer',
      });
    }
  },

  stopTimer: async (id) => {
    try {
      // Update timer locally first
      const currentTimer = get().timers.find(t => t.id === id);
      if (!currentTimer) {
        throw new Error('Timer not found');
      }

      const updatedTimer: Timer = {
        ...currentTimer,
        isRunning: false,
        isPaused: false,
        isCompleted: true,
        remainingTime: 0,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        timers: state.timers.map((t) => (t.id === id ? updatedTimer : t)),
        activeTimer: state.activeTimer?.id === id ? null : state.activeTimer,
      }));

      // Cancel scheduled notification when stopping
      notificationService.cancelTimer(id);

      // Stop countdown when stopping
      get().stopCountdown();

      // Save to local storage (async)
      get().saveTimersToStorage().catch(err => console.log('Failed to save timers:', err));

      // Try to sync with backend in background
      if (!id.startsWith('local_')) {
        try {
          const serverTimer = await alarmService.stopTimer(id);
          set((state) => ({
            timers: state.timers.map((t) => (t.id === id ? { ...serverTimer, remainingTime: updatedTimer.remainingTime } : t)),
          }));
        } catch (syncError) {
          console.log('Timer stop sync failed, using local version:', syncError);
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to stop timer',
      });
    }
  },

  resetTimer: async (id) => {
    try {
      // Update timer locally first
      const currentTimer = get().timers.find(t => t.id === id);
      if (!currentTimer) {
        throw new Error('Timer not found');
      }

      const updatedTimer: Timer = {
        ...currentTimer,
        isRunning: false,
        isPaused: false,
        isCompleted: false,
        remainingTime: currentTimer.duration * 60, // reset to original duration
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        timers: state.timers.map((t) => (t.id === id ? updatedTimer : t)),
        activeTimer: state.activeTimer?.id === id ? updatedTimer : state.activeTimer,
      }));

      // Stop countdown when resetting
      get().stopCountdown();

      // Save to local storage (async)
      get().saveTimersToStorage().catch(err => console.log('Failed to save timers:', err));

      // Try to sync with backend in background
      if (!id.startsWith('local_')) {
        try {
          const serverTimer = await alarmService.resetTimer(id);
          set((state) => ({
            timers: state.timers.map((t) => (t.id === id ? { ...serverTimer, remainingTime: updatedTimer.remainingTime } : t)),
            activeTimer: state.activeTimer?.id === id ? { ...serverTimer, remainingTime: updatedTimer.remainingTime } : state.activeTimer,
          }));
        } catch (syncError) {
          console.log('Timer reset sync failed, using local version:', syncError);
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset timer',
      });
    }
  },

  setActiveTimer: (timer) => {
    set({ activeTimer: timer });
  },

  updateTimerRemainingTime: (id, remainingTime) => {
    set((state) => ({
      timers: state.timers.map((t) =>
        t.id === id ? { ...t, remainingTime } : t
      ),
      activeTimer: state.activeTimer?.id === id
        ? { ...state.activeTimer, remainingTime }
        : state.activeTimer,
    }));

    // Save to local storage (throttled to avoid too frequent saves)
    const now = Date.now();
    const lastSaveTime = get().lastSaveTime;
    if (!lastSaveTime || now - lastSaveTime > 1000) { // Save max once per second
      get().saveTimersToStorage();
      set({ lastSaveTime: now });
    }
  },

  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ loading }),

  // Timer countdown methods
  startCountdown: () => {
    const { countdownInterval } = get();

    // Clear existing interval if any
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    // Start new countdown interval
    const interval = setInterval(() => {
      const { activeTimer } = get();

      if (activeTimer && activeTimer.isRunning && activeTimer.remainingTime > 0) {
        // Decrease remaining time by 1 second
        const newRemainingTime = activeTimer.remainingTime - 1;
        get().updateTimerRemainingTime(activeTimer.id, newRemainingTime);

        // Check if timer is completed
        if (newRemainingTime <= 0) {
          get().checkTimerCompletion();
        }
      } else if (!activeTimer || !activeTimer.isRunning) {
        // Stop countdown if no active timer or timer is not running
        get().stopCountdown();
      }
    }, 1000);

    set({ countdownInterval: interval });
  },

  stopCountdown: () => {
    const { countdownInterval } = get();
    if (countdownInterval) {
      clearInterval(countdownInterval);
      set({ countdownInterval: null });
    }
  },

  checkTimerCompletion: () => {
    const { activeTimer } = get();
    if (activeTimer && activeTimer.remainingTime <= 0) {
      // Timer completed - trigger completion notification
      console.log('⏱️ Timer completed in store:', activeTimer.id);
      
      // Trigger immediate notification with sound/vibration
      const { notificationService } = require('@/services/notificationService');
      notificationService.triggerImmediateTimerNotification({
        id: activeTimer.id,
        title: activeTimer.title,
      });

      // Stop the timer
      get().stopTimer(activeTimer.id);
    }
  },

  // Local storage methods for offline support - using AsyncStorage for React Native
  saveTimersToStorage: async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const timers = get().timers;
      const timersWithStartTime = timers.map(t => ({
        ...t,
        // Save start time if timer is running
        _startTime: t.isRunning && !t.isPaused ? Date.now() : null,
        _pausedTime: t.isPaused ? Date.now() : null,
      }));
      await AsyncStorage.setItem('offline_timers', JSON.stringify(timersWithStartTime));
    } catch (error) {
      console.log('Failed to save timers to storage:', error);
    }
  },

  loadTimersFromStorage: async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const stored = await AsyncStorage.getItem('offline_timers');
      if (stored) {
        const timers = JSON.parse(stored);
        
        // Recalculate remaining time for running timers based on start time
        const now = Date.now();
        const recalculatedTimers = timers.map((t: any) => {
          if (t.isRunning && !t.isPaused && t._startTime) {
            const elapsed = Math.floor((now - t._startTime) / 1000);
            const newRemaining = Math.max(0, (t.remainingTime || t.duration * 60) - elapsed);
            return {
              ...t,
              remainingTime: newRemaining,
              isRunning: newRemaining > 0, // Stop if completed
              isCompleted: newRemaining <= 0,
            };
          }
          return t;
        });
        
        set({ timers: recalculatedTimers });
        return recalculatedTimers;
      }
    } catch (error) {
      console.log('Failed to load timers from storage:', error);
    }
    return [];
  },
}));
