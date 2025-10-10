import { apiClient } from './apiClient';
import { 
  Project, 
  CreateProjectData, 
  UpdateProjectData, 
  AddMemberData, 
  UpdateMemberRoleData,
  ProjectTemplate,
  CreateProjectTemplateData,
  UpdateProjectTemplateData,
  ProjectComment,
  CreateProjectCommentData,
  UpdateProjectCommentData,
  ProjectActivity,
  ProjectFile,
  CreateProjectFileData,
  ProjectNotification,
  CreateProjectNotificationData,
  ProjectAnalytics,
  ProjectBudget,
  CreateBudgetCategoryData,
  UpdateBudgetCategoryData,
  ProjectSearchFilters
} from '@/types/project';
import { ApiResponse, PaginatedResponse } from '@/types';
import { logger } from '@/utils/logger';

class EnhancedProjectService {
  // Basic Project CRUD
  async getProjects(filters?: ProjectSearchFilters): Promise<PaginatedResponse<Project>> {
    try {
      // Only return projects the user has access to (private projects they're members of)
      const response = await apiClient.get<ApiResponse<{ data: Project[]; pagination: any }>>('/projects', {
        params: filters,
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

  // Member Management
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

  // Project Templates
  async getTemplates(): Promise<ProjectTemplate[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectTemplate[]>>('/project-templates');

      if (!response.success) {
        throw new Error(response.error || 'Failed to get templates');
      }

      return response.data;
    } catch (error) {
      logger.error('Get templates error:', error);
      throw error;
    }
  }

  async createTemplate(data: CreateProjectTemplateData): Promise<ProjectTemplate> {
    try {
      const response = await apiClient.post<ApiResponse<ProjectTemplate>>('/project-templates', data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create template');
      }

      return response.data;
    } catch (error) {
      logger.error('Create template error:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, data: UpdateProjectTemplateData): Promise<ProjectTemplate> {
    try {
      const response = await apiClient.put<ApiResponse<ProjectTemplate>>(`/project-templates/${id}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update template');
      }

      return response.data;
    } catch (error) {
      logger.error('Update template error:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/project-templates/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete template');
      }
    } catch (error) {
      logger.error('Delete template error:', error);
      throw error;
    }
  }

  async createProjectFromTemplate(templateId: string, data: CreateProjectData): Promise<Project> {
    try {
      const response = await apiClient.post<ApiResponse<Project>>(`/project-templates/${templateId}/create-project`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create project from template');
      }

      return response.data;
    } catch (error) {
      logger.error('Create project from template error:', error);
      throw error;
    }
  }

  // Project Comments
  async getProjectComments(projectId: string): Promise<ProjectComment[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectComment[]>>(`/projects/${projectId}/comments`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project comments');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project comments error:', error);
      throw error;
    }
  }

  async createProjectComment(projectId: string, data: CreateProjectCommentData): Promise<ProjectComment> {
    try {
      const response = await apiClient.post<ApiResponse<ProjectComment>>(`/projects/${projectId}/comments`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create project comment');
      }

      return response.data;
    } catch (error) {
      logger.error('Create project comment error:', error);
      throw error;
    }
  }

  async updateProjectComment(projectId: string, commentId: string, data: UpdateProjectCommentData): Promise<ProjectComment> {
    try {
      const response = await apiClient.put<ApiResponse<ProjectComment>>(`/projects/${projectId}/comments/${commentId}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update project comment');
      }

      return response.data;
    } catch (error) {
      logger.error('Update project comment error:', error);
      throw error;
    }
  }

  async deleteProjectComment(projectId: string, commentId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/projects/${projectId}/comments/${commentId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete project comment');
      }
    } catch (error) {
      logger.error('Delete project comment error:', error);
      throw error;
    }
  }

  // Project Activities
  async getProjectActivities(projectId: string): Promise<ProjectActivity[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectActivity[]>>(`/projects/${projectId}/activities`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project activities');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project activities error:', error);
      throw error;
    }
  }

  async logProjectActivity(projectId: string, type: string, description: string, metadata?: any): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(`/projects/${projectId}/activities`, {
        type,
        description,
        metadata,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to log project activity');
      }
    } catch (error) {
      logger.error('Log project activity error:', error);
      throw error;
    }
  }

  // Project Files
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectFile[]>>(`/projects/${projectId}/files`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project files');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project files error:', error);
      throw error;
    }
  }

  async uploadProjectFile(projectId: string, data: CreateProjectFileData): Promise<ProjectFile> {
    try {
      const response = await apiClient.post<ApiResponse<ProjectFile>>(`/projects/${projectId}/files`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to upload project file');
      }

      return response.data;
    } catch (error) {
      logger.error('Upload project file error:', error);
      throw error;
    }
  }

  async deleteProjectFile(projectId: string, fileId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/projects/${projectId}/files/${fileId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete project file');
      }
    } catch (error) {
      logger.error('Delete project file error:', error);
      throw error;
    }
  }

  // Project Notifications
  async getProjectNotifications(projectId: string): Promise<ProjectNotification[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectNotification[]>>(`/projects/${projectId}/notifications`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project notifications');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project notifications error:', error);
      throw error;
    }
  }

  async createProjectNotification(projectId: string, data: CreateProjectNotificationData): Promise<ProjectNotification> {
    try {
      const response = await apiClient.post<ApiResponse<ProjectNotification>>(`/projects/${projectId}/notifications`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create project notification');
      }

      return response.data;
    } catch (error) {
      logger.error('Create project notification error:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<void>>(`/project-notifications/${notificationId}/read`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark notification as read');
      }
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(projectId: string): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<void>>(`/projects/${projectId}/notifications/read-all`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      throw error;
    }
  }

  // Project Analytics
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectAnalytics>>(`/projects/${projectId}/analytics`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project analytics');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project analytics error:', error);
      throw error;
    }
  }

  // Project Budget
  async getProjectBudget(projectId: string): Promise<ProjectBudget> {
    try {
      const response = await apiClient.get<ApiResponse<ProjectBudget>>(`/projects/${projectId}/budget`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get project budget');
      }

      return response.data;
    } catch (error) {
      logger.error('Get project budget error:', error);
      throw error;
    }
  }

  async updateProjectBudget(projectId: string, budget: number): Promise<ProjectBudget> {
    try {
      const response = await apiClient.put<ApiResponse<ProjectBudget>>(`/projects/${projectId}/budget`, { budget });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update project budget');
      }

      return response.data;
    } catch (error) {
      logger.error('Update project budget error:', error);
      throw error;
    }
  }

  async createBudgetCategory(projectId: string, data: CreateBudgetCategoryData): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/projects/${projectId}/budget/categories`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create budget category');
      }

      return response.data;
    } catch (error) {
      logger.error('Create budget category error:', error);
      throw error;
    }
  }

  async updateBudgetCategory(projectId: string, categoryId: string, data: UpdateBudgetCategoryData): Promise<any> {
    try {
      const response = await apiClient.put<ApiResponse<any>>(`/projects/${projectId}/budget/categories/${categoryId}`, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update budget category');
      }

      return response.data;
    } catch (error) {
      logger.error('Update budget category error:', error);
      throw error;
    }
  }

  async deleteBudgetCategory(projectId: string, categoryId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/projects/${projectId}/budget/categories/${categoryId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete budget category');
      }
    } catch (error) {
      logger.error('Delete budget category error:', error);
      throw error;
    }
  }

  // Search and filtering
  async searchProjects(filters: ProjectSearchFilters): Promise<Project[]> {
    try {
      const response = await this.getProjects(filters);
      return response.data;
    } catch (error) {
      logger.error('Search projects error:', error);
      throw error;
    }
  }
}

export const enhancedProjectService = new EnhancedProjectService();
