import { apiClient } from './apiClient';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

export interface ProjectInvitation {
  id: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
  invitedAt: string;
  expiresAt: string;
  project: {
    id: string;
    name: string;
    description?: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateInvitationData {
  projectId: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

class InvitationService {
  async createInvitation(data: CreateInvitationData): Promise<ProjectInvitation> {
    try {
      const response = await apiClient.post<ApiResponse<ProjectInvitation>>('/invitations', data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Create invitation error:', error);
      throw error;
    }
  }

  async getProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectInvitation[]>>(`/invitations/project/${projectId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project invitations');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project invitations error:', error);
      throw error;
    }
  }

  async getInvitationByToken(token: string): Promise<ProjectInvitation> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectInvitation>>(`/invitations/${token}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Get invitation by token error:', error);
      throw error;
    }
  }

  async acceptInvitation(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(`/invitations/${token}/accept`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to accept invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Accept invitation error:', error);
      throw error;
    }
  }

  async declineInvitation(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(`/invitations/${token}/decline`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to decline invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Decline invitation error:', error);
      throw error;
    }
  }

  async cancelInvitation(invitationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(`/invitations/${invitationId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Cancel invitation error:', error);
      throw error;
    }
  }

  async getPendingInvitations(): Promise<ProjectInvitation[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectInvitation[]>>('/invitations/user/pending');

      if (!response.success) {
        throw new Error(response.error || 'Failed to get pending invitations');
      }

      return response.data;
    } catch (error) {
      logger.error('Get pending invitations error:', error);
      throw error;
    }
  }
}

export const invitationService = new InvitationService();
