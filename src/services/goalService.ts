import {apiClient} from './apiClient';
import {Goal, CreateGoalData, UpdateGoalData, AIPlanRequest, GeneratedPlan} from '@/types/goal';
import {ApiResponse, PaginatedResponse} from '@/types';
import {logger} from '@/utils/logger';

class GoalService {
  async getGoals(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Goal>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Goal>>>('/goals', {
        params,
      });

      console.log('Get goals response:', response);
      if (!response.success) {
        throw new Error(response.error || 'Failed to get goals');
      }

      return response.data;
    } catch (error) {
      logger.error('Get goals error:', error);
      throw error;
    }
  }

  async getGoal(id: string): Promise<Goal> {
    try {
      const response = await apiClient.get<ApiResponse<Goal>>(`/goals/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get goal');
      }

      return response.data;
    } catch (error) {
      logger.error('Get goal error:', error);
      throw error;
    }
  }

  async createGoal(data: CreateGoalData): Promise<Goal> {
    try {
      const response = await apiClient.post<ApiResponse<Goal>>('/goals', data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create goal');
      }

      return response.data;
    } catch (error) {
      logger.error('Create goal error:', error);
      throw error;
    }
  }

  async updateGoal(id: string, data: UpdateGoalData): Promise<Goal> {
    try {
      const response = await apiClient.put<ApiResponse<Goal>>(`/goals/${id}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update goal');
      }

      return response.data;
    } catch (error) {
      logger.error('Update goal error:', error);
      throw error;
    }
  }

  async deleteGoal(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/goals/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete goal');
      }
    } catch (error) {
      logger.error('Delete goal error:', error);
      throw error;
    }
  }

  async generateAIPlan(data: AIPlanRequest): Promise<GeneratedPlan> {
    try {
      const response = await apiClient.post<ApiResponse<GeneratedPlan>>('/ai/generate-plan', data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate AI plan');
      }

      return response.data;
    } catch (error) {
      logger.error('Generate AI plan error:', error);
      throw error;
    }
  }

  async generateSimplePlan(goalTitle: string): Promise<GeneratedPlan> {
    try {
      const response = await apiClient.post<ApiResponse<GeneratedPlan>>('/ai/generate-simple-plan', {
        goalTitle,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate simple plan');
      }

      return response.data;
    } catch (error) {
      logger.error('Generate simple plan error:', error);
      throw error;
    }
  }

  async searchGoals(query: string): Promise<Goal[]> {
    try {
      const response = await this.getGoals({search: query});
      return response.data;
    } catch (error) {
      logger.error('Search goals error:', error);
      throw error;
    }
  }
}

export const goalService = new GoalService();
