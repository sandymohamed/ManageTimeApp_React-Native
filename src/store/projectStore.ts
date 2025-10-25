import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enhancedProjectService as projectService } from '@/services/enhancedProjectService';
import { 
  Project, 
  CreateProjectData, 
  UpdateProjectData, 
  AddMemberData, 
  UpdateMemberRoleData, 
  ProjectStatus,
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
import { logger } from '@/utils/logger';

interface ProjectState {
  projects: Project[];
  filteredProjects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'startDate' | 'endDate' | 'status';
  sortOrder: 'asc' | 'desc';
  
  // New features state
  templates: ProjectTemplate[];
  currentProjectComments: ProjectComment[];
  currentProjectActivities: ProjectActivity[];
  currentProjectFiles: ProjectFile[];
  currentProjectNotifications: ProjectNotification[];
  currentProjectAnalytics: ProjectAnalytics | null;
  currentProjectBudget: ProjectBudget | null;
  searchFilters: ProjectSearchFilters;
}

interface ProjectActions {
  // Data fetching
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;

  // CRUD operations
  createProject: (data: CreateProjectData) => Promise<void>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;

  // Member management
  addMember: (projectId: string, data: AddMemberData) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  updateMemberRole: (projectId: string, userId: string, data: UpdateMemberRoleData) => Promise<void>;

  // Project Templates
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: CreateProjectTemplateData) => Promise<void>;
  updateTemplate: (id: string, data: UpdateProjectTemplateData) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  createProjectFromTemplate: (templateId: string, data: CreateProjectData) => Promise<void>;

  // Project Comments
  fetchProjectComments: (projectId: string) => Promise<void>;
  createProjectComment: (projectId: string, data: CreateProjectCommentData) => Promise<void>;
  updateProjectComment: (projectId: string, commentId: string, data: UpdateProjectCommentData) => Promise<void>;
  deleteProjectComment: (projectId: string, commentId: string) => Promise<void>;

  // Project Activities
  fetchProjectActivities: (projectId: string) => Promise<void>;
  logProjectActivity: (projectId: string, type: string, description: string, metadata?: any) => Promise<void>;

  // Project Files
  fetchProjectFiles: (projectId: string) => Promise<void>;
  uploadProjectFile: (projectId: string, data: CreateProjectFileData) => Promise<void>;
  deleteProjectFile: (projectId: string, fileId: string) => Promise<void>;

  // Project Notifications
  fetchProjectNotifications: (projectId: string) => Promise<void>;
  createProjectNotification: (projectId: string, data: CreateProjectNotificationData) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: (projectId: string) => Promise<void>;

  // Project Analytics
  fetchProjectAnalytics: (projectId: string) => Promise<void>;
  refreshProjectAnalytics: (projectId: string) => Promise<void>;

  // Project Budget
  fetchProjectBudget: (projectId: string) => Promise<void>;
  updateProjectBudget: (projectId: string, budget: number) => Promise<void>;
  createBudgetCategory: (projectId: string, data: CreateBudgetCategoryData) => Promise<void>;
  updateBudgetCategory: (projectId: string, categoryId: string, data: UpdateBudgetCategoryData) => Promise<void>;
  deleteBudgetCategory: (projectId: string, categoryId: string) => Promise<void>;

  // Search and filtering
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'createdAt' | 'updatedAt' | 'name' | 'startDate' | 'endDate' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSearchFilters: (filters: ProjectSearchFilters) => void;
  applyFilters: () => void;
  clearFilters: () => void;

  // State management
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Local updates (optimistic updates)
  updateProjectInList: (project: Project) => void;
  removeProjectFromList: (id: string) => void;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // State
      projects: [],
      filteredProjects: [],
      currentProject: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      
      // New features state
      templates: [],
      currentProjectComments: [],
      currentProjectActivities: [],
      currentProjectFiles: [],
      currentProjectNotifications: [],
      currentProjectAnalytics: null,
      currentProjectBudget: null,
      searchFilters: {},

      // Data fetching
      fetchProjects: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await projectService.getProjects();
          console.log('response fetchProjects', response);
          const projects = response?.data || [];

          set({
            projects: projects,
            filteredProjects: projects,
            isLoading: false,
          });

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Fetch projects error:', error);
          set({
            error: error.message || 'Failed to fetch projects',
            isLoading: false,
          });
        }
      },

      fetchProject: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const project = await projectService.getProject(id);

          set({
            currentProject: project,
            isLoading: false,
          });
        } catch (error: any) {
          logger.error('Fetch project error:', error);
          set({
            error: error.message || 'Failed to fetch project',
            isLoading: false,
          });
        }
      },

      refreshProjects: async () => {
        await get().fetchProjects();
      },

      // CRUD operations
      createProject: async (data: CreateProjectData) => {
        try {
          set({ isLoading: true, error: null });

          const project = await projectService.createProject(data);

          set((state) => ({
            projects: [project, ...state.projects],
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Create project error:', error);
          set({
            error: error.message || 'Failed to create project',
            isLoading: false,
          });
          throw error;
        }
      },

      updateProject: async (id: string, data: UpdateProjectData) => {
        try {
          set({ isLoading: true, error: null });

          const project = await projectService.updateProject(id, data);

          set((state) => ({
            projects: state.projects.map(p => p.id === id ? project : p),
            currentProject: state.currentProject?.id === id ? project : state.currentProject,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Update project error:', error);
          set({
            error: error.message || 'Failed to update project',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteProject: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          await projectService.deleteProject(id);

          set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Delete project error:', error);
          set({
            error: error.message || 'Failed to delete project',
            isLoading: false,
          });
          throw error;
        }
      },

      // Member management
      addMember: async (projectId: string, data: AddMemberData) => {
        try {
          set({ isLoading: true, error: null });

          const project = await projectService.addMember(projectId, data);

          set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? project : p),
            currentProject: state.currentProject?.id === projectId ? project : state.currentProject,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Add member error:', error);
          set({
            error: error.message || 'Failed to add member',
            isLoading: false,
          });
          throw error;
        }
      },

      removeMember: async (projectId: string, userId: string) => {
        try {
          set({ isLoading: true, error: null });

          const project = await projectService.removeMember(projectId, userId);

          set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? project : p),
            currentProject: state.currentProject?.id === projectId ? project : state.currentProject,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Remove member error:', error);
          set({
            error: error.message || 'Failed to remove member',
            isLoading: false,
          });
          throw error;
        }
      },

      updateMemberRole: async (projectId: string, userId: string, data: UpdateMemberRoleData) => {
        try {
          set({ isLoading: true, error: null });

          const project = await projectService.updateMemberRole(projectId, userId, data);

          set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? project : p),
            currentProject: state.currentProject?.id === projectId ? project : state.currentProject,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Update member role error:', error);
          set({
            error: error.message || 'Failed to update member role',
            isLoading: false,
          });
          throw error;
        }
      },

      // Search and filtering
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().applyFilters();
      },

      setSortBy: (sortBy: 'createdAt' | 'updatedAt' | 'name' | 'startDate' | 'endDate' | 'status') => {
        set({ sortBy });
        get().applyFilters();
      },

      setSortOrder: (order: 'asc' | 'desc') => {
        set({ sortOrder: order });
        get().applyFilters();
      },

      applyFilters: () => {
        const { projects, searchQuery, sortBy, sortOrder, searchFilters } = get();

        let filtered = [...projects];

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(project =>
            project.name.toLowerCase().includes(query) ||
            (project.description && project.description.toLowerCase().includes(query))
          );
        }

        // Apply advanced filters
        if (searchFilters.status && searchFilters.status.length > 0) {
          filtered = filtered.filter(project => searchFilters.status!.includes(project.status));
        }

        if (searchFilters.category && searchFilters.category.length > 0) {
          filtered = filtered.filter(project => 
            project.category && searchFilters.category!.includes(project.category)
          );
        }

        if (searchFilters.tags && searchFilters.tags.length > 0) {
          filtered = filtered.filter(project => 
            project.tags.some(tag => searchFilters.tags!.includes(tag))
          );
        }


        if (searchFilters.hasBudget !== undefined) {
          filtered = filtered.filter(project => 
            searchFilters.hasBudget ? project.budget !== undefined : project.budget === undefined
          );
        }

        if (searchFilters.startDateFrom) {
          filtered = filtered.filter(project => 
            project.startDate && new Date(project.startDate) >= new Date(searchFilters.startDateFrom!)
          );
        }

        if (searchFilters.startDateTo) {
          filtered = filtered.filter(project => 
            project.startDate && new Date(project.startDate) <= new Date(searchFilters.startDateTo!)
          );
        }

        if (searchFilters.endDateFrom) {
          filtered = filtered.filter(project => 
            project.endDate && new Date(project.endDate) >= new Date(searchFilters.endDateFrom!)
          );
        }

        if (searchFilters.endDateTo) {
          filtered = filtered.filter(project => 
            project.endDate && new Date(project.endDate) <= new Date(searchFilters.endDateTo!)
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortBy) {
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case 'updatedAt':
              aValue = new Date(a.updatedAt).getTime();
              bValue = new Date(b.updatedAt).getTime();
              break;
            case 'startDate':
              aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
              bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
              break;
            case 'endDate':
              aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
              bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
              break;
            case 'status':
              aValue = a.status;
              bValue = b.status;
              break;
            default:
              return 0;
          }

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        set({ filteredProjects: filtered });
      },

      // State management
      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Local updates
      updateProjectInList: (project: Project) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === project.id ? project : p),
        }));
        get().applyFilters();
      },

      removeProjectFromList: (id: string) => {
        set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
        }));
        get().applyFilters();
      },

      // Archive and restore projects
      archiveProject: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await projectService.updateProject(id, { status: ProjectStatus.ARCHIVED });
          set((state) => ({
            projects: state.projects.map(p => p.id === id ? { ...p, status: ProjectStatus.ARCHIVED } : p),
            isLoading: false,
          }));
          get().applyFilters();
        } catch (error: any) {
          logger.error('Archive project error:', error);
          set({
            error: error.message || 'Failed to archive project',
            isLoading: false,
          });
          throw error;
        }
      },

      restoreProject: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await projectService.updateProject(id, { status: ProjectStatus.ACTIVE });
          set((state) => ({
            projects: state.projects.map(p => p.id === id ? { ...p, status: ProjectStatus.ACTIVE } : p),
            isLoading: false,
          }));
          get().applyFilters();
        } catch (error: any) {
          logger.error('Restore project error:', error);
          set({
            error: error.message || 'Failed to restore project',
            isLoading: false,
          });
          throw error;
        }
      },

      // Project Templates
      fetchTemplates: async () => {
        try {
          set({ isLoading: true, error: null });
          const templates = await projectService.getTemplates();
          set({ templates, isLoading: false });
        } catch (error: any) {
          logger.error('Fetch templates error:', error);
          set({
            error: error.message || 'Failed to fetch templates',
            isLoading: false,
          });
        }
      },

      createTemplate: async (data: CreateProjectTemplateData) => {
        try {
          set({ isLoading: true, error: null });
          const template = await projectService.createTemplate(data);
          set((state) => ({
            templates: [template, ...state.templates],
            isLoading: false,
          }));
        } catch (error: any) {
          logger.error('Create template error:', error);
          set({
            error: error.message || 'Failed to create template',
            isLoading: false,
          });
          throw error;
        }
      },

      updateTemplate: async (id: string, data: UpdateProjectTemplateData) => {
        try {
          set({ isLoading: true, error: null });
          const template = await projectService.updateTemplate(id, data);
          set((state) => ({
            templates: state.templates.map(t => t.id === id ? template : t),
            isLoading: false,
          }));
        } catch (error: any) {
          logger.error('Update template error:', error);
          set({
            error: error.message || 'Failed to update template',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteTemplate: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await projectService.deleteTemplate(id);
          set((state) => ({
            templates: state.templates.filter(t => t.id !== id),
            isLoading: false,
          }));
        } catch (error: any) {
          logger.error('Delete template error:', error);
          set({
            error: error.message || 'Failed to delete template',
            isLoading: false,
          });
          throw error;
        }
      },

      createProjectFromTemplate: async (templateId: string, data: CreateProjectData) => {
        try {
          set({ isLoading: true, error: null });
          const project = await projectService.createProjectFromTemplate(templateId, data);
          set((state) => ({
            projects: [project, ...state.projects],
            isLoading: false,
          }));
          get().applyFilters();
        } catch (error: any) {
          logger.error('Create project from template error:', error);
          set({
            error: error.message || 'Failed to create project from template',
            isLoading: false,
          });
          throw error;
        }
      },

      // Project Comments
      fetchProjectComments: async (projectId: string) => {
        try {
          const comments = await projectService.getProjectComments(projectId);
          set({ currentProjectComments: comments });
        } catch (error: any) {
          logger.error('Fetch project comments error:', error);
          set({ error: error.message || 'Failed to fetch comments' });
        }
      },

      createProjectComment: async (projectId: string, data: CreateProjectCommentData) => {
        try {
          const comment = await projectService.createProjectComment(projectId, data);
          set((state) => ({
            currentProjectComments: [...state.currentProjectComments, comment],
          }));
          // Log activity
          get().logProjectActivity(projectId, 'COMMENT_ADDED', 'Added a comment');
        } catch (error: any) {
          logger.error('Create project comment error:', error);
          set({ error: error.message || 'Failed to create comment' });
          throw error;
        }
      },

      updateProjectComment: async (projectId: string, commentId: string, data: UpdateProjectCommentData) => {
        try {
          const comment = await projectService.updateProjectComment(projectId, commentId, data);
          set((state) => ({
            currentProjectComments: state.currentProjectComments.map(c => 
              c.id === commentId ? comment : c
            ),
          }));
        } catch (error: any) {
          logger.error('Update project comment error:', error);
          set({ error: error.message || 'Failed to update comment' });
          throw error;
        }
      },

      deleteProjectComment: async (projectId: string, commentId: string) => {
        try {
          await projectService.deleteProjectComment(projectId, commentId);
          set((state) => ({
            currentProjectComments: state.currentProjectComments.filter(c => c.id !== commentId),
          }));
        } catch (error: any) {
          logger.error('Delete project comment error:', error);
          set({ error: error.message || 'Failed to delete comment' });
          throw error;
        }
      },

      // Project Activities
      fetchProjectActivities: async (projectId: string) => {
        try {
          const activities = await projectService.getProjectActivities(projectId);
          set({ currentProjectActivities: activities });
        } catch (error: any) {
          logger.error('Fetch project activities error:', error);
          set({ error: error.message || 'Failed to fetch activities' });
        }
      },

      logProjectActivity: async (projectId: string, type: string, description: string, metadata?: any) => {
        try {
          await projectService.logProjectActivity(projectId, type, description, metadata);
          // Refresh activities
          get().fetchProjectActivities(projectId);
        } catch (error: any) {
          logger.error('Log project activity error:', error);
        }
      },

      // Project Files
      fetchProjectFiles: async (projectId: string) => {
        try {
          const files = await projectService.getProjectFiles(projectId);
          set({ currentProjectFiles: files });
        } catch (error: any) {
          logger.error('Fetch project files error:', error);
          set({ error: error.message || 'Failed to fetch files' });
        }
      },

      uploadProjectFile: async (projectId: string, data: CreateProjectFileData) => {
        try {
          const file = await projectService.uploadProjectFile(projectId, data);
          set((state) => ({
            currentProjectFiles: [...state.currentProjectFiles, file],
          }));
          // Log activity
          get().logProjectActivity(projectId, 'FILE_UPLOADED', `Uploaded file: ${data.fileName}`);
        } catch (error: any) {
          logger.error('Upload project file error:', error);
          set({ error: error.message || 'Failed to upload file' });
          throw error;
        }
      },

      deleteProjectFile: async (projectId: string, fileId: string) => {
        try {
          await projectService.deleteProjectFile(projectId, fileId);
          set((state) => ({
            currentProjectFiles: state.currentProjectFiles.filter(f => f.id !== fileId),
          }));
        } catch (error: any) {
          logger.error('Delete project file error:', error);
          set({ error: error.message || 'Failed to delete file' });
          throw error;
        }
      },

      // Project Notifications
      fetchProjectNotifications: async (projectId: string) => {
        try {
          const notifications = await projectService.getProjectNotifications(projectId);
          set({ currentProjectNotifications: notifications });
        } catch (error: any) {
          logger.error('Fetch project notifications error:', error);
          set({ error: error.message || 'Failed to fetch notifications' });
        }
      },

      createProjectNotification: async (projectId: string, data: CreateProjectNotificationData) => {
        try {
          const notification = await projectService.createProjectNotification(projectId, data);
          set((state) => ({
            currentProjectNotifications: [notification, ...state.currentProjectNotifications],
          }));
        } catch (error: any) {
          logger.error('Create project notification error:', error);
          set({ error: error.message || 'Failed to create notification' });
          throw error;
        }
      },

      markNotificationAsRead: async (notificationId: string) => {
        try {
          await projectService.markNotificationAsRead(notificationId);
          set((state) => ({
            currentProjectNotifications: state.currentProjectNotifications.map(n => 
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          }));
        } catch (error: any) {
          logger.error('Mark notification as read error:', error);
          set({ error: error.message || 'Failed to mark notification as read' });
        }
      },

      markAllNotificationsAsRead: async (projectId: string) => {
        try {
          await projectService.markAllNotificationsAsRead(projectId);
          set((state) => ({
            currentProjectNotifications: state.currentProjectNotifications.map(n => 
              n.projectId === projectId ? { ...n, isRead: true } : n
            ),
          }));
        } catch (error: any) {
          logger.error('Mark all notifications as read error:', error);
          set({ error: error.message || 'Failed to mark all notifications as read' });
        }
      },

      // Project Analytics
      fetchProjectAnalytics: async (projectId: string) => {
        try {
          const analytics = await projectService.getProjectAnalytics(projectId);
          set({ currentProjectAnalytics: analytics });
        } catch (error: any) {
          logger.error('Fetch project analytics error:', error);
          set({ error: error.message || 'Failed to fetch analytics' });
        }
      },

      refreshProjectAnalytics: async (projectId: string) => {
        await get().fetchProjectAnalytics(projectId);
      },

      // Project Budget
      fetchProjectBudget: async (projectId: string) => {
        try {
          const budget = await projectService.getProjectBudget(projectId);
          set({ currentProjectBudget: budget });
        } catch (error: any) {
          logger.error('Fetch project budget error:', error);
          set({ error: error.message || 'Failed to fetch budget' });
        }
      },

      updateProjectBudget: async (projectId: string, budget: number) => {
        try {
          const updatedBudget = await projectService.updateProjectBudget(projectId, budget);
          set({ currentProjectBudget: updatedBudget });
          // Update project in list
          set((state) => ({
            projects: state.projects.map(p => 
              p.id === projectId ? { ...p, budget } : p
            ),
          }));
        } catch (error: any) {
          logger.error('Update project budget error:', error);
          set({ error: error.message || 'Failed to update budget' });
          throw error;
        }
      },

      createBudgetCategory: async (projectId: string, data: CreateBudgetCategoryData) => {
        try {
          const category = await projectService.createBudgetCategory(projectId, data);
          set((state) => ({
            currentProjectBudget: state.currentProjectBudget ? {
              ...state.currentProjectBudget,
              categories: [...state.currentProjectBudget.categories, category]
            } : null,
          }));
        } catch (error: any) {
          logger.error('Create budget category error:', error);
          set({ error: error.message || 'Failed to create budget category' });
          throw error;
        }
      },

      updateBudgetCategory: async (projectId: string, categoryId: string, data: UpdateBudgetCategoryData) => {
        try {
          const category = await projectService.updateBudgetCategory(projectId, categoryId, data);
          set((state) => ({
            currentProjectBudget: state.currentProjectBudget ? {
              ...state.currentProjectBudget,
              categories: state.currentProjectBudget.categories.map(c => 
                c.id === categoryId ? category : c
              )
            } : null,
          }));
        } catch (error: any) {
          logger.error('Update budget category error:', error);
          set({ error: error.message || 'Failed to update budget category' });
          throw error;
        }
      },

      deleteBudgetCategory: async (projectId: string, categoryId: string) => {
        try {
          await projectService.deleteBudgetCategory(projectId, categoryId);
          set((state) => ({
            currentProjectBudget: state.currentProjectBudget ? {
              ...state.currentProjectBudget,
              categories: state.currentProjectBudget.categories.filter(c => c.id !== categoryId)
            } : null,
          }));
        } catch (error: any) {
          logger.error('Delete budget category error:', error);
          set({ error: error.message || 'Failed to delete budget category' });
          throw error;
        }
      },

      // Enhanced search and filtering
      setSearchFilters: (filters: ProjectSearchFilters) => {
        set({ searchFilters: filters });
        get().applyFilters();
      },

      clearFilters: () => {
        set({ 
          searchQuery: '',
          searchFilters: {},
          sortBy: 'updatedAt',
          sortOrder: 'desc'
        });
        get().applyFilters();
      },
    }),
    {
      name: 'project-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
