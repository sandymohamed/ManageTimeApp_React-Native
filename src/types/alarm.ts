export interface Alarm {
  id: string;
  title: string;
  time: string;
  days: string[];
  isActive: boolean;
  sound: string;
  volume: number;
  snoozeMinutes: number;
  smartWake: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

export interface CreateAlarmData {
  title: string;
  time: string;
  days: string[];
  sound?: string;
  volume?: number;
  snoozeMinutes?: number;
  smartWake?: boolean;
}

export interface UpdateAlarmData {
  title?: string;
  time?: string;
  days?: string[];
  isActive?: boolean;
  sound?: string;
  volume?: number;
  snoozeMinutes?: number;
  smartWake?: boolean;
}

export interface SnoozeConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxSnoozes: number;
}

export interface SmartWakeConfig {
  enabled: boolean;
  windowMinutes: number;
  gradualVolume: boolean;
}
