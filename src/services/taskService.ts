import { apiClient } from './apiClient';
import { Task, CreateTaskData, UpdateTaskData } from '@/types/task';
import { ApiResponse, PaginatedResponse } from '@/types';
import { logger } from '@/utils/logger';

class TaskService {
  async getTasks(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    goalId?: string;
    assigneeId?: string;
  }): Promise<Task[]> {
    console.log('Get tasks:', params);
    try {
      const response = await apiClient.get<ApiResponse<Task[]>>('/tasks', {
        params,
      });
      console.log('Response TaskService:', response.data);


      if (!response.success) {
        throw new Error(response.error || 'Failed to get tasks');
      }

      return response.data;
    } catch (error) {
      logger.error('Get tasks error:', error);
      throw error;
    }
  }

  async getTask(id: string): Promise<Task> {
    try {
      const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get task');
      }

      return response.data;
    } catch (error) {
      logger.error('Get task error:', error);
      throw error;
    }
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    try {
      const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create task');
      }

      return response.data;
    } catch (error) {
      logger.error('Create task error:', error);
      throw error;
    }
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    try {
      const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update task');
      }

      return response.data;
    } catch (error) {
      logger.error('Update task error:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/tasks/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete task');
      }
    } catch (error) {
      logger.error('Delete task error:', error);
      throw error;
    }
  }

  async assignTask(id: string, assigneeId: string): Promise<Task> {
    try {
      const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/assign`, {
        assigneeId,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to assign task');
      }

      return response.data;
    } catch (error) {
      logger.error('Assign task error:', error);
      throw error;
    }
  }

  async completeTask(id: string): Promise<Task> {
    try {
      const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/complete`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete task');
      }

      return response.data;
    } catch (error) {
      logger.error('Complete task error:', error);
      throw error;
    }
  }

  async uncompleteTask(id: string): Promise<Task> {
    try {
      const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/uncomplete`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to uncomplete task');
      }

      return response.data;
    } catch (error) {
      logger.error('Uncomplete task error:', error);
      throw error;
    }
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({ projectId });
      return response;
    } catch (error) {
      logger.error('Get tasks by project error:', error);
      throw error;
    }
  }

  async getTasksByGoal(goalId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({ goalId });
      return response;
    } catch (error) {
      logger.error('Get tasks by goal error:', error);
      throw error;
    }
  }

  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({ assigneeId });
      return response;
    } catch (error) {
      logger.error('Get tasks by assignee error:', error);
      throw error;
    }
  }

  async searchTasks(query: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({ search: query });
      return response;
    } catch (error) {
      logger.error('Search tasks error:', error);
      throw error;
    }
  }

  async updateTaskOrder(taskOrders: { id: string; order: number }[]): Promise<void> {
    try {

      console.log(" taskOrders in update task order", taskOrders);
      const response = await apiClient.patch<ApiResponse<void>>('/tasks/reorder', {
        taskOrders,
      });

      console.log(" response in update task order", response);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update task order');
      }
    } catch (error) {
      logger.error('Update task order error:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();
