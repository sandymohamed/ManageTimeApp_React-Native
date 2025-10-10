import { apiClient } from './apiClient';
import { 
  ProjectRole, 
  ProjectInvitation, 
  CreateProjectInvitationData, 
  UpdateProjectInvitationData 
} from '@/types/project';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

class ProjectInvitationService {
  // Create invitation to join project
  async createInvitation(projectId: string, data: CreateProjectInvitationData): Promise<ProjectInvitation> {
    try {
      const response = await apiClient.post<ApiResponse<ProjectInvitation>>(`/projects/${projectId}/invitations`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Create project invitation error:', error);
      throw error;
    }
  }

  // Get project invitations (for project owner)
  async getProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectInvitation[]>>(`/projects/${projectId}/invitations`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project invitations');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project invitations error:', error);
      throw error;
    }
  }

  // Get user's pending invitations
  async getMyInvitations(): Promise<ProjectInvitation[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectInvitation[]>>('/project-invitations/my');

      if (!response.success) {
        throw new Error(response.error || 'Failed to get my invitations');
      }

      return response.data;
    } catch (error) {
      logger.error('Get my invitations error:', error);
      throw error;
    }
  }

  // Accept invitation
  async acceptInvitation(invitationId: string): Promise<ProjectInvitation> {
    try {
      const response = await apiClient.put<ApiResponse<ProjectInvitation>>(`/project-invitations/${invitationId}/accept`, {});

      if (!response.success) {
        throw new Error(response.error || 'Failed to accept invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Accept invitation error:', error);
      throw error;
    }
  }

  // Decline invitation
  async declineInvitation(invitationId: string): Promise<ProjectInvitation> {
    try {
      const response = await apiClient.put<ApiResponse<ProjectInvitation>>(`/project-invitations/${invitationId}/decline`, {});

      if (!response.success) {
        throw new Error(response.error || 'Failed to decline invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Decline invitation error:', error);
      throw error;
    }
  }

  // Cancel invitation (for project owner)
  async cancelInvitation(projectId: string, invitationId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/projects/${projectId}/invitations/${invitationId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel invitation');
      }
    } catch (error) {
      logger.error('Cancel invitation error:', error);
      throw error;
    }
  }

  // Resend invitation
  async resendInvitation(projectId: string, invitationId: string): Promise<ProjectInvitation> {
    try {
      const response = await apiClient.post<ApiResponse<ProjectInvitation>>(`/projects/${projectId}/invitations/${invitationId}/resend`, {});

      if (!response.success) {
        throw new Error(response.error || 'Failed to resend invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Resend invitation error:', error);
      throw error;
    }
  }

  // Get invitation by token (for email links)
  async getInvitationByToken(token: string): Promise<ProjectInvitation> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectInvitation>>(`/project-invitations/token/${token}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Get invitation by token error:', error);
      throw error;
    }
  }

  // Accept invitation by token (for email links)
  async acceptInvitationByToken(token: string): Promise<ProjectInvitation> {
    try {
      const response = await apiClient.put<ApiResponse<ProjectInvitation>>(`/project-invitations/token/${token}/accept`, {});

      if (!response.success) {
        throw new Error(response.error || 'Failed to accept invitation');
      }

      return response.data;
    } catch (error) {
      logger.error('Accept invitation by token error:', error);
      throw error;
    }
  }
}

export const projectInvitationService = new ProjectInvitationService();
