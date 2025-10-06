export enum NotificationType {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: any;
  isRead: boolean;
  scheduledAt?: string;
  sentAt?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

export interface CreateNotificationData {
  title: string;
  body: string;
  type: NotificationType;
  data?: any;
  scheduledAt?: string;
}

export interface UpdateNotificationData {
  isRead?: boolean;
}
