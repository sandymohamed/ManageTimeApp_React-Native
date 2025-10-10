import {apiClient} from './apiClient';
import {Project, CreateProjectData, UpdateProjectData, AddMemberData, UpdateMemberRoleData} from '@/types/project';
import {ApiResponse, PaginatedResponse} from '@/types';
import {logger} from '@/utils/logger';

class ProjectService {
  async getProjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isPublic?: boolean;
  }): Promise<PaginatedResponse<Project>> {
    try {
      const response = await apiClient.get<ApiResponse<{ data: Project[]; pagination: any }>>('/projects', {
        params,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get projects');
      }

      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      logger.error('Get projects error:', error);
      throw error;
    }
  }

  async getProject(id: string): Promise<Project> {
    try {
      const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project error:', error);
      throw error;
    }
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    try {
      const response = await apiClient.post<ApiResponse<Project>>('/projects', data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create project');
      }

      return response.data;
    } catch (error) {
      logger.error('Create project error:', error);
      throw error;
    }
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    try {
      const response = await apiClient.put<ApiResponse<Project>>(`/projects/${id}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update project');
      }

      return response.data;
    } catch (error) {
      logger.error('Update project error:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/projects/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (error) {
      logger.error('Delete project error:', error);
      throw error;
    }
  }

  async addMember(projectId: string, data: AddMemberData): Promise<Project> {
    try {
      const response = await apiClient.post<ApiResponse<Project>>(`/projects/${projectId}/members`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to add member');
      }

      return response.data;
    } catch (error) {
      logger.error('Add member error:', error);
      throw error;
    }
  }

  async removeMember(projectId: string, userId: string): Promise<Project> {
    try {
      const response = await apiClient.delete<ApiResponse<Project>>(`/projects/${projectId}/members/${userId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to remove member');
      }

      return response.data;
    } catch (error) {
      logger.error('Remove member error:', error);
      throw error;
    }
  }

  async updateMemberRole(projectId: string, userId: string, data: UpdateMemberRoleData): Promise<Project> {
    try {
      const response = await apiClient.put<ApiResponse<Project>>(`/projects/${projectId}/members/${userId}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update member role');
      }

      return response.data;
    } catch (error) {
      logger.error('Update member role error:', error);
      throw error;
    }
  }

  async searchProjects(query: string): Promise<Project[]> {
    try {
      const response = await this.getProjects({search: query});
      return response.data;
    } catch (error) {
      logger.error('Search projects error:', error);
      throw error;
    }
  }
}

export const projectService = new ProjectService();
