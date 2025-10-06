import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { projectService } from '@/services/projectService';
import { Project, CreateProjectData, UpdateProjectData, AddMemberData, UpdateMemberRoleData, ProjectStatus } from '@/types/project';
import { logger } from '@/utils/logger';

interface ProjectState {
  projects: Project[];
  filteredProjects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'createdAt' | 'updatedAt' | 'name';
  sortOrder: 'asc' | 'desc';
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

  // Member management
  addMember: (projectId: string, data: AddMemberData) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  updateMemberRole: (projectId: string, userId: string, data: UpdateMemberRoleData) => Promise<void>;

  // Search and filtering
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'createdAt' | 'updatedAt' | 'name') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  applyFilters: () => void;

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

      // Data fetching
      fetchProjects: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await projectService.getProjects();
          const projects = response.data;

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

      setSortBy: (sortBy: 'createdAt' | 'updatedAt' | 'name') => {
        set({ sortBy });
        get().applyFilters();
      },

      setSortOrder: (order: 'asc' | 'desc') => {
        set({ sortOrder: order });
        get().applyFilters();
      },

      applyFilters: () => {
        const { projects, searchQuery, sortBy, sortOrder } = get();

        let filtered = [...projects];

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(project =>
            project.name.toLowerCase().includes(query) ||
            (project.description && project.description.toLowerCase().includes(query))
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
