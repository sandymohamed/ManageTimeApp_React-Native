import { apiClient } from './apiClient';

export interface InvitationNotification {
  id: string;
  type: string;
  payload: {
    invitationId: string;
    projectName: string;
    inviterName: string;
    role: string;
    notificationType: string;
  };
  createdAt: string;
  isRead: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

class NotificationService {
  async getNotifications(): Promise<InvitationNotification[]> {
    try {
      const response = await apiClient.get('/notifications');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data.data.count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();