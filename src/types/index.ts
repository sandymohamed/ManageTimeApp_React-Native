export * from './user';
export * from './task';
export * from './project';
export * from './goal';
export * from './alarm';
export * from './reminder';
export * from './notification';
export * from './analytics';

import { TaskStatus, TaskPriority } from './task';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SyncState {
  lastSyncAt: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
}

export interface ErrorState {
  message: string;
  code?: string;
  details?: any;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  projectId?: string;
  goalId?: string;
  assigneeId?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
}

export interface ProjectRole {
  OWNER: 'OWNER';
  EDITOR: 'EDITOR';
  VIEWER: 'VIEWER';
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  byDay?: string[];
  byMonthDay?: number[];
  byMonth?: number[];
  bySetPos?: number[];
  count?: number;
  until?: Date;
  rrule?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  radius: number;
  onEnter: boolean;
  onExit: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
}
