import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goalService } from '@/services/goalService';
import { Goal, CreateGoalData, UpdateGoalData, GoalStatus, GoalPriority, Milestone, CreateMilestoneData, UpdateMilestoneData, MilestoneStatus } from '@/types/goal';
import { logger } from '@/utils/logger';

interface GoalState {
  goals: Goal[];
  filteredGoals: Goal[];
  currentGoal: Goal | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: GoalStatus[];
  priorityFilter: GoalPriority[];
  categoryFilter: string[];
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'targetDate' | 'progress' | 'priority';
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface GoalActions {
  // Data fetching
  fetchGoals: (page?: number, limit?: number) => Promise<void>;
  fetchGoal: (id: string) => Promise<void>;
  refreshGoals: () => Promise<void>;
  loadMoreGoals: () => Promise<void>;

  // CRUD operations
  createGoal: (data: CreateGoalData) => Promise<void>;
  updateGoal: (id: string, data: UpdateGoalData) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Goal actions
  completeGoal: (id: string) => Promise<void>;
  pauseGoal: (id: string) => Promise<void>;
  resumeGoal: (id: string) => Promise<void>;
  cancelGoal: (id: string) => Promise<void>;

  // Milestone management
  createMilestone: (goalId: string, data: CreateMilestoneData) => Promise<void>;
  updateMilestone: (goalId: string, milestoneId: string, data: UpdateMilestoneData) => Promise<void>;
  deleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  completeMilestone: (goalId: string, milestoneId: string) => Promise<void>;

  // AI Planning
  generateAIPlan: (goalId: string, prompt?: string) => Promise<void>;

  // Analytics
  getGoalAnalytics: (goalId: string, timeRange?: string) => Promise<any>;

  // Filtering and searching
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: GoalStatus[]) => void;
  setPriorityFilter: (priority: GoalPriority[]) => void;
  setCategoryFilter: (category: string[]) => void;
  setSortBy: (sortBy: 'createdAt' | 'updatedAt' | 'title' | 'targetDate' | 'progress' | 'priority') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  clearFilters: () => void;
  applyFilters: () => void;

  // State management
  setCurrentGoal: (goal: Goal | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Local updates (optimistic updates)
  addGoal: (goal: Goal) => void;
  updateGoalLocal: (id: string, data: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  updateGoalProgress: (id: string, progress: number) => void;
}

type GoalStore = GoalState & GoalActions;

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      // State
      goals: [],
      filteredGoals: [],
      currentGoal: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      statusFilter: [],
      priorityFilter: [],
      categoryFilter: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',
      
      // Pagination
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 20,
      hasNextPage: false,
      hasPreviousPage: false,

      // Data fetching
      fetchGoals: async (page = 1, limit = 20) => {
        try {
          set({ isLoading: true, error: null });

          const response = await goalService.getGoals({
            page,
            limit,
            search: get().searchQuery,
            status: get().statusFilter.length > 0 ? get().statusFilter.join(',') : undefined,
          });
          
          console.log('Fetch goals response:', response);
          const goals = response.data || [];
          const pagination = response.pagination;
          
          set({
            goals: page === 1 ? goals : [...get().goals, ...goals],
            filteredGoals: page === 1 ? goals : [...get().filteredGoals, ...goals],
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalItems: pagination.total,
            itemsPerPage: pagination.limit,
            hasNextPage: pagination.page < pagination.totalPages,
            hasPreviousPage: pagination.page > 1,
            isLoading: false,
          });

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Fetch goals error:', error);
          set({
            error: error.message || 'Failed to fetch goals',
            isLoading: false,
          });
        }
      },

      fetchGoal: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const goal = await goalService.getGoal(id);

          set({
            currentGoal: goal,
            isLoading: false,
          });
        } catch (error: any) {
          logger.error('Fetch goal error:', error);
          set({
            error: error.message || 'Failed to fetch goal',
            isLoading: false,
          });
        }
      },

      refreshGoals: async () => {
        await get().fetchGoals(1, get().itemsPerPage);
      },

      loadMoreGoals: async () => {
        const { currentPage, hasNextPage, isLoading } = get();
        if (hasNextPage && !isLoading) {
          await get().fetchGoals(currentPage + 1, get().itemsPerPage);
        }
      },

      // CRUD operations
      createGoal: async (data: CreateGoalData) => {
        try {
          set({ isLoading: true, error: null });

          const goal = await goalService.createGoal(data);

          set((state) => ({
            goals: [goal, ...state.goals],
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Create goal error:', error);
          set({
            error: error.message || 'Failed to create goal',
            isLoading: false,
          });
          throw error;
        }
      },

      updateGoal: async (id: string, data: UpdateGoalData) => {
        try {
          set({ isLoading: true, error: null });

          const goal = await goalService.updateGoal(id, data);

          set((state) => ({
            goals: state.goals.map(g => g.id === id ? goal : g),
            currentGoal: state.currentGoal?.id === id ? goal : state.currentGoal,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Update goal error:', error);
          set({
            error: error.message || 'Failed to update goal',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteGoal: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          await goalService.deleteGoal(id);

          set((state) => ({
            goals: state.goals.filter(g => g.id !== id),
            currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Delete goal error:', error);
          set({
            error: error.message || 'Failed to delete goal',
            isLoading: false,
          });
          throw error;
        }
      },

      // Goal actions
      completeGoal: async (id: string) => {
        try {
          const goal = await goalService.updateGoal(id, {
            status: GoalStatus.DONE,
            progress: 100,
            completedAt: new Date().toISOString()
          });

          set((state) => ({
            goals: state.goals.map(g => g.id === id ? goal : g),
            currentGoal: state.currentGoal?.id === id ? goal : state.currentGoal,
          }));

          get().applyFilters();
        } catch (error: any) {
          logger.error('Complete goal error:', error);
          throw error;
        }
      },

      pauseGoal: async (id: string) => {
        try {
          const goal = await goalService.updateGoal(id, { status: GoalStatus.PAUSED });

          set((state) => ({
            goals: state.goals.map(g => g.id === id ? goal : g),
            currentGoal: state.currentGoal?.id === id ? goal : state.currentGoal,
          }));

          get().applyFilters();
        } catch (error: any) {
          logger.error('Pause goal error:', error);
          throw error;
        }
      },

      resumeGoal: async (id: string) => {
        try {
          const goal = await goalService.updateGoal(id, { status: GoalStatus.ACTIVE });

          set((state) => ({
            goals: state.goals.map(g => g.id === id ? goal : g),
            currentGoal: state.currentGoal?.id === id ? goal : state.currentGoal,
          }));

          get().applyFilters();
        } catch (error: any) {
          logger.error('Resume goal error:', error);
          throw error;
        }
      },

      cancelGoal: async (id: string) => {
        try {
          const goal = await goalService.updateGoal(id, { status: GoalStatus.CANCELLED });

          set((state) => ({
            goals: state.goals.map(g => g.id === id ? goal : g),
            currentGoal: state.currentGoal?.id === id ? goal : state.currentGoal,
          }));

          get().applyFilters();
        } catch (error: any) {
          logger.error('Cancel goal error:', error);
          throw error;
        }
      },

      // Milestone management
      createMilestone: async (goalId: string, data: CreateMilestoneData) => {
        try {
          const milestone = await goalService.createMilestone(goalId, data);

          set((state) => ({
            goals: state.goals.map(g => 
              g.id === goalId 
                ? { ...g, milestones: [...g.milestones, milestone] }
                : g
            ),
            currentGoal: state.currentGoal?.id === goalId 
              ? { ...state.currentGoal, milestones: [...state.currentGoal.milestones, milestone] }
              : state.currentGoal,
          }));

          get().applyFilters();
        } catch (error: any) {
          logger.error('Create milestone error:', error);
          throw error;
        }
      },

      updateMilestone: async (goalId: string, milestoneId: string, data: UpdateMilestoneData) => {
        try {
          const milestone = await goalService.updateMilestone(goalId, milestoneId, data);

          set((state) => ({
            goals: state.goals.map(g => 
              g.id === goalId 
                ? { ...g, milestones: g.milestones.map(m => m.id === milestoneId ? milestone : m) }
                : g
            ),
            currentGoal: state.currentGoal?.id === goalId 
              ? { ...state.currentGoal, milestones: state.currentGoal.milestones.map(m => m.id === milestoneId ? milestone : m) }
              : state.currentGoal,
          }));

          get().applyFilters();
        } catch (error: any) {
          logger.error('Update milestone error:', error);
          throw error;
        }
      },

      deleteMilestone: async (goalId: string, milestoneId: string) => {
        try {
          await goalService.deleteMilestone(goalId, milestoneId);

          set((state) => ({
            goals: state.goals.map(g => 
              g.id === goalId 
                ? { ...g, milestones: g.milestones.filter(m => m.id !== milestoneId) }
                : g
            ),
            currentGoal: state.currentGoal?.id === goalId 
              ? { ...state.currentGoal, milestones: state.currentGoal.milestones.filter(m => m.id !== milestoneId) }
              : state.currentGoal,
          }));

          get().applyFilters();
        } catch (error: any) {
          logger.error('Delete milestone error:', error);
          throw error;
        }
      },

      completeMilestone: async (goalId: string, milestoneId: string) => {
        try {
          const milestone = await goalService.completeMilestone(goalId, milestoneId);

          set((state) => ({
            goals: state.goals.map(g => 
              g.id === goalId 
                ? { ...g, milestones: g.milestones.map(m => m.id === milestoneId ? milestone : m) }
                : g
            ),
            currentGoal: state.currentGoal?.id === goalId 
              ? { ...state.currentGoal, milestones: state.currentGoal.milestones.map(m => m.id === milestoneId ? milestone : m) }
              : state.currentGoal,
          }));

          // Calculate and update goal progress based on completed milestones
          const goal = get().goals.find(g => g.id === goalId);
          if (goal) {
            const completedMilestones = goal.milestones.filter(m => m.status === MilestoneStatus.DONE).length;
            const newProgress = goal.milestones.length > 0 ? Math.round((completedMilestones / goal.milestones.length) * 100) : goal.progress;
            get().updateGoalProgress(goalId, newProgress);
          }

          get().applyFilters();
        } catch (error: any) {
          logger.error('Complete milestone error:', error);
          throw error;
        }
      },

      // Filtering and searching
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().applyFilters();
      },

      setStatusFilter: (status: GoalStatus[]) => {
        set({ statusFilter: status });
        get().applyFilters();
      },

      setPriorityFilter: (priority: GoalPriority[]) => {
        set({ priorityFilter: priority });
        get().applyFilters();
      },

      setCategoryFilter: (category: string[]) => {
        set({ categoryFilter: category });
        get().applyFilters();
      },

      setSortBy: (sortBy: 'createdAt' | 'updatedAt' | 'title' | 'targetDate' | 'progress' | 'priority') => {
        set({ sortBy });
        get().applyFilters();
      },

      setSortOrder: (order: 'asc' | 'desc') => {
        set({ sortOrder: order });
        get().applyFilters();
      },

      clearFilters: () => {
        set({
          searchQuery: '',
          statusFilter: [],
          priorityFilter: [],
          categoryFilter: [],
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        get().applyFilters();
      },

      // Apply filters to goals
      applyFilters: () => {
        const { goals, searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder = "desc" } = get();

        let filtered = [...goals];

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(goal =>
            goal.title.toLowerCase().includes(query) ||
            (goal.description && goal.description.toLowerCase().includes(query)) ||
            goal.category.toLowerCase().includes(query)
          );
        }

        // Apply status filter
        if (statusFilter.length > 0) {
          filtered = filtered.filter(goal => statusFilter.includes(goal.status));
        }

        // Apply priority filter
        if (priorityFilter.length > 0) {
          filtered = filtered.filter(goal => priorityFilter.includes(goal.priority));
        }

        // Apply category filter
        if (categoryFilter.length > 0) {
          filtered = filtered.filter(goal => categoryFilter.includes(goal.category));
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortBy) {
            case 'title':
              aValue = a.title.toLowerCase();
              bValue = b.title.toLowerCase();
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case 'updatedAt':
              aValue = new Date(a.updatedAt).getTime();
              bValue = new Date(b.updatedAt).getTime();
              break;
            case 'targetDate':
              aValue = a.targetDate ? new Date(a.targetDate).getTime() : 0;
              bValue = b.targetDate ? new Date(b.targetDate).getTime() : 0;
              break;
            case 'progress':
              aValue = a.progress;
              bValue = b.progress;
              break;
            case 'priority':
              const priorityOrder = { [GoalPriority.URGENT]: 4, [GoalPriority.HIGH]: 3, [GoalPriority.MEDIUM]: 2, [GoalPriority.LOW]: 1 };
              aValue = priorityOrder[a.priority] || 0;
              bValue = priorityOrder[b.priority] || 0;
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

        set({ filteredGoals: filtered });
      },

      // State management
      setCurrentGoal: (goal: Goal | null) => set({ currentGoal: goal }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Local updates (optimistic updates)
      addGoal: (goal: Goal) => {
        set((state) => ({
          goals: [goal, ...state.goals],
        }));
        get().applyFilters();
      },

      updateGoalLocal: (id: string, data: Partial<Goal>) => {
        set((state) => ({
          goals: state.goals.map(g => g.id === id ? { ...g, ...data } : g),
          currentGoal: state.currentGoal?.id === id ? { ...state.currentGoal, ...data } : state.currentGoal,
        }));
        get().applyFilters();
      },

      removeGoal: (id: string) => {
        set((state) => ({
          goals: state.goals.filter(g => g.id !== id),
          currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
        }));
        get().applyFilters();
      },

      updateGoalProgress: (id: string, progress: number) => {
        set((state) => ({
          goals: state.goals.map(g => g.id === id ? { ...g, progress, updatedAt: new Date().toISOString() } : g),
          currentGoal: state.currentGoal?.id === id ? { ...state.currentGoal, progress, updatedAt: new Date().toISOString() } : state.currentGoal,
        }));
        get().applyFilters();
      },

      // AI Planning
      generateAIPlan: async (goalId: string, prompt?: string) => {
        try {
          set({ isLoading: true, error: null });

          // This would integrate with the AI service
          // For now, we'll simulate AI planning
          const goal = get().goals.find(g => g.id === goalId);
          if (!goal) return;

          // Simulate AI-generated milestones based on goal
          const aiMilestones = [
            {
              id: `ai_milestone_${Date.now()}_1`,
              goalId,
              title: `Research and plan ${goal.title.toLowerCase()}`,
              description: `Gather information and create a detailed plan for achieving ${goal.title}`,
              status: MilestoneStatus.TODO,
              targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
              order: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeleted: false,
            },
            {
              id: `ai_milestone_${Date.now()}_2`,
              goalId,
              title: `Take first action towards ${goal.title.toLowerCase()}`,
              description: `Begin implementing your plan with the first concrete step`,
              status: MilestoneStatus.TODO,
              targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeleted: false,
            },
            {
              id: `ai_milestone_${Date.now()}_3`,
              goalId,
              title: `Review and adjust approach`,
              description: `Evaluate progress and make necessary adjustments to your strategy`,
              status: MilestoneStatus.TODO,
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
              order: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeleted: false,
            }
          ];

          const updatedGoal = {
            ...goal,
            milestones: [...goal.milestones, ...aiMilestones],
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            goals: state.goals.map(g => g.id === goalId ? updatedGoal : g),
            currentGoal: state.currentGoal?.id === goalId ? updatedGoal : state.currentGoal,
            isLoading: false,
          }));

          get().applyFilters();
        } catch (error: any) {
          logger.error('Generate AI plan error:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Analytics
      getGoalAnalytics: async (goalId: string, timeRange?: string) => {
        try {
          set({ isLoading: true, error: null });

          // This would integrate with the analytics service
          // For now, we'll return mock analytics data
          const goal = get().goals.find(g => g.id === goalId);
          if (!goal) return null;

          const analytics = {
            goalId,
            timeRange: timeRange || 'all',
            totalMilestones: goal.milestones.length,
            completedMilestones: goal.milestones.filter(m => m.status === MilestoneStatus.DONE).length,
            progress: goal.progress,
            averageMilestoneCompletionTime: 7, // days
            streak: 5, // consecutive days of activity
            estimatedCompletionDate: goal.targetDate,
            insights: [
              'You\'re making steady progress towards your goal',
              'Consider breaking down larger milestones into smaller tasks',
              'Your consistency is paying off - keep it up!'
            ]
          };

          set({ isLoading: false });
          return analytics;
        } catch (error: any) {
          logger.error('Get goal analytics error:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'goal-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        goals: state.goals,
        searchQuery: state.searchQuery,
        statusFilter: state.statusFilter,
        priorityFilter: state.priorityFilter,
        categoryFilter: state.categoryFilter,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
