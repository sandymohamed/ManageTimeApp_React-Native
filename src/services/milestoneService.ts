import { apiClient } from './apiClient';
import { ProjectMilestone, CreateMilestoneData, UpdateMilestoneData } from '@/types/project';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

class MilestoneService {
  async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectMilestone[]>>(`/milestones/project/${projectId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project milestones');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project milestones error:', error);
      throw error;
    }
  }

  async getMilestone(id: string): Promise<ProjectMilestone> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectMilestone>>(`/milestones/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get milestone');
      }

      return response.data;
    } catch (error) {
      logger.error('Get milestone error:', error);
      throw error;
    }
  }

  async createMilestone(projectId: string, data: CreateMilestoneData): Promise<ProjectMilestone> {
    try {
      console.log('data in createMilestone', data);
      const response = await apiClient.post<ApiResponse<ProjectMilestone>>(`/milestones/project/${projectId}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create milestone');
      }

      return response.data;
    } catch (error) {
      logger.error('Create milestone error:', error);
      throw error;
    }
  }

  async updateMilestone(id: string, data: UpdateMilestoneData): Promise<ProjectMilestone> {
    try {
      const response = await apiClient.put<ApiResponse<ProjectMilestone>>(`/milestones/${id}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update milestone');
      }

      return response.data;
    } catch (error) {
      logger.error('Update milestone error:', error);
      throw error;
    }
  }

  async deleteMilestone(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/milestones/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete milestone');
      }
    } catch (error) {
      logger.error('Delete milestone error:', error);
      throw error;
    }
  }
}

export const milestoneService = new MilestoneService();
