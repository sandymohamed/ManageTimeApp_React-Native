import {apiClient} from './apiClient';
import {Task, CreateTaskData, UpdateTaskData} from '@/types/task';
import {ApiResponse, PaginatedResponse} from '@/types';
import {logger} from '@/utils/logger';

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
   /*
    {
        "id": "22c98545-b807-45f1-a04d-766cfd28a51d",
        "title": "Complete API Documentation - Updated",
        "description": "Write comprehensive API documentation with examples",
        "creatorId": "ddc1ba7f-71c7-43cd-8c53-f8ab056638b0",
        "assigneeId": null,
        "projectId": null,
        "goalId": null,
        "milestoneId": null,
        "parentTaskId": null,
        "priority": "URGENT",
        "status": "IN_PROGRESS",
        "dueDate": "2024-01-20T17:00:00.000Z",
        "recurrenceRule": null,
        "metadata": {
            "category": "documentation",
            "estimatedHours": 4
        },
        "createdAt": "2025-09-29T18:59:25.702Z",
        "updatedAt": "2025-09-29T19:01:31.407Z",
        "creator": {
            "id": "ddc1ba7f-71c7-43cd-8c53-f8ab056638b0",
            "name": "sandy",
            "email": "sandysawy@gmail.com"
        },
        "assignee": null,
        "project": null,
        "goal": null,
        "milestone": null
    }
]
       */

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
      const response = await this.getTasks({projectId});
      return response;
    } catch (error) {
      logger.error('Get tasks by project error:', error);
      throw error;
    }
  }

  async getTasksByGoal(goalId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({goalId});
      return response;
    } catch (error) {
      logger.error('Get tasks by goal error:', error);
      throw error;
    }
  }

  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({assigneeId});
      return response;
    } catch (error) {
      logger.error('Get tasks by assignee error:', error);
      throw error;
    }
  }

  async searchTasks(query: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({search: query});
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
