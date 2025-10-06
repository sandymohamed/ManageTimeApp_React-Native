export enum ReminderType {
  TIME = 'TIME',
  LOCATION = 'LOCATION',
  BOTH = 'BOTH',
}

export enum ReminderTargetType {
  TASK = 'TASK',
  GOAL = 'GOAL',
  PROJECT = 'PROJECT',
  CUSTOM = 'CUSTOM',
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: ReminderType;
  triggerTime?: string;
  triggerDate?: string;
  location?: GeoLocation;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  radius: number;
  onEnter: boolean;
  onExit: boolean;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  type: ReminderType;
  triggerTime?: string;
  triggerDate?: string;
  location?: GeoLocation;
}

export interface UpdateReminderData {
  title?: string;
  description?: string;
  type?: ReminderType;
  triggerTime?: string;
  triggerDate?: string;
  location?: GeoLocation;
  isActive?: boolean;
}
