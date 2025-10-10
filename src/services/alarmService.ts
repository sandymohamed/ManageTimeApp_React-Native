import { apiClient } from '@/services/apiClient';
import { Alarm, CreateAlarmData, UpdateAlarmData, Timer, CreateTimerData, UpdateTimerData } from '@/types/alarm';

export class AlarmService {
  private static instance: AlarmService;

  constructor() {
    // No need to initialize apiClient here since it's imported directly
  }

  static getInstance(): AlarmService {
    if (!AlarmService.instance) {
      AlarmService.instance = new AlarmService();
    }
    return AlarmService.instance;
  }

  // Alarm methods
  async getAlarms(page: number = 1, limit: number = 20, enabled?: boolean): Promise<{ data: Alarm[]; pagination: any }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (enabled !== undefined) {
        params.append('enabled', enabled.toString());
      }

      const response = await apiClient.get<{ data: Alarm[]; pagination: any }>(`/alarms?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get alarms:', error);
      throw error;
    }
  }

  async getAlarm(id: string): Promise<Alarm> {
    try {
      const response = await apiClient.get<{ data: Alarm }>(`/alarms/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get alarm:', error);
      throw error;
    }
  }

  async createAlarm(data: CreateAlarmData): Promise<Alarm> {
    try {
      const response = await apiClient.post<{ data: Alarm }>('/alarms', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create alarm:', error);
      throw error;
    }
  }

  async updateAlarm(id: string, data: UpdateAlarmData): Promise<Alarm> {
    try {
      const response = await apiClient.put<{ data: Alarm }>(`/alarms/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update alarm:', error);
      throw error;
    }
  }

  async deleteAlarm(id: string): Promise<void> {
    try {
      await apiClient.delete(`/alarms/${id}`);
    } catch (error) {
      console.error('Failed to delete alarm:', error);
      throw error;
    }
  }

  async snoozeAlarm(id: string, duration?: number): Promise<void> {
    try {
      await apiClient.post(`/alarms/${id}/snooze`, { duration });
    } catch (error) {
      console.error('Failed to snooze alarm:', error);
      throw error;
    }
  }

  async dismissAlarm(id: string): Promise<void> {
    try {
      await apiClient.post(`/alarms/${id}/dismiss`);
    } catch (error) {
      console.error('Failed to dismiss alarm:', error);
      throw error;
    }
  }

  // Timer methods
  async getTimers(page: number = 1, limit: number = 20): Promise<{ data: Timer[]; pagination: any }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiClient.get<{ data: Timer[]; pagination: any }>(`/timers?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get timers:', error);
      throw error;
    }
  }

  async getTimer(id: string): Promise<Timer> {
    try {
      const response = await apiClient.get<{ data: Timer }>(`/timers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get timer:', error);
      throw error;
    }
  }

  async createTimer(data: CreateTimerData): Promise<Timer> {
    try {
      const response = await apiClient.post<{ data: Timer }>('/timers', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create timer:', error);
      throw error;
    }
  }

  async updateTimer(id: string, data: UpdateTimerData): Promise<Timer> {
    try {
      const response = await apiClient.put<{ data: Timer }>(`/timers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update timer:', error);
      throw error;
    }
  }

  async deleteTimer(id: string): Promise<void> {
    try {
      await apiClient.delete(`/timers/${id}`);
    } catch (error) {
      console.error('Failed to delete timer:', error);
      throw error;
    }
  }

  async startTimer(id: string): Promise<Timer> {
    try {
      const response = await apiClient.post<{ data: Timer }>(`/timers/${id}/start`);
      return response.data;
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  }

  async pauseTimer(id: string): Promise<Timer> {
    try {
      const response = await apiClient.post<{ data: Timer }>(`/timers/${id}/pause`);
      return response.data;
    } catch (error) {
      console.error('Failed to pause timer:', error);
      throw error;
    }
  }

  async stopTimer(id: string): Promise<Timer> {
    try {
      const response = await apiClient.post<{ data: Timer }>(`/timers/${id}/stop`);
      return response.data;
    } catch (error) {
      console.error('Failed to stop timer:', error);
      throw error;
    }
  }

  async resetTimer(id: string): Promise<Timer> {
    try {
      const response = await apiClient.post<{ data: Timer }>(`/timers/${id}/reset`);
      return response.data;
    } catch (error) {
      console.error('Failed to reset timer:', error);
      throw error;
    }
  }
}

export const alarmService = AlarmService.getInstance();
