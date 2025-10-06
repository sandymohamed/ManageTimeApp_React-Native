import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskService } from '@/services/taskService';
import { Task, CreateTaskData, UpdateTaskData, TaskFilter, TaskStatus, TaskPriority } from '@/types/task';
import { logger } from '@/utils/logger';

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filter: TaskFilter;
  searchQuery: string;
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title' | 'order';
  sortOrder: 'asc' | 'desc';
}

interface TaskActions {
  // Data fetching
  fetchTasks: () => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;

  // CRUD operations
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Task actions
  completeTask: (id: string) => Promise<void>;
  uncompleteTask: (id: string) => Promise<void>;
  assignTask: (id: string, assigneeId: string) => Promise<void>;
  reorderTasks: (fromIndex: number, toIndex: number) => Promise<void>;
  updateTaskOrder: (newTasks: Task[]) => Promise<void>;

  // Filtering and searching
  setFilter: (filter: TaskFilter) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title' | 'order') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetToCustomOrder: () => void;
  clearFilters: () => void;
  applyFilters: () => void;

  // State management
  setCurrentTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Local updates (optimistic updates)
  addTask: (task: Task) => void;
  updateTaskLocal: (id: string, data: Partial<Task>) => void;
  removeTask: (id: string) => void;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // State
      tasks: [],
      filteredTasks: [],
      currentTask: null,
      isLoading: false,
      error: null,
      filter: {},
      searchQuery: '',
      sortBy: 'order',
      sortOrder: 'asc',

      // Data fetching
      fetchTasks: async () => {
        console.log('Fetching tasks');
        try {
          set({ isLoading: true, error: null });

          const response = await taskService.getTasks();
          console.log('Response:', response);
          const tasks = response;
          console.log('Tasks:', tasks);

          // Sort tasks by order field
          const sortedTasks = tasks.sort((a, b) => (a.order || 0) - (b.order || 0));

          set({
            tasks: sortedTasks,
            filteredTasks: sortedTasks,
            isLoading: false,
          });

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Fetch tasks error:', error);
          set({
            error: error.message || 'Failed to fetch tasks',
            isLoading: false,
          });
        }
      },

      fetchTask: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const task = await taskService.getTask(id);

          set({
            currentTask: task,
            isLoading: false,
          });
        } catch (error: any) {
          logger.error('Fetch task error:', error);
          set({
            error: error.message || 'Failed to fetch task',
            isLoading: false,
          });
        }
      },

      refreshTasks: async () => {
        await get().fetchTasks();
      },

      // CRUD operations
      createTask: async (data: CreateTaskData) => {
        try {
          set({ isLoading: true, error: null });

          // Filter out undefined values before sending to backend
          const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
          ) as CreateTaskData;

          const task = await taskService.createTask(filteredData);

          set((state) => ({
            tasks: [task, ...state.tasks],
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Create task error:', error);
          set({
            error: error.message || 'Failed to create task',
            isLoading: false,
          });
          throw error;
        }
      },

      updateTask: async (id: string, data: UpdateTaskData) => {
        try {
          set({ isLoading: true, error: null });

          console.log("data", data);

          // Filter out undefined values before sending to backend
          const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
          ) as UpdateTaskData;

          const task = await taskService.updateTask(id, filteredData);

          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t),
            currentTask: state.currentTask?.id === id ? task : state.currentTask,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Update task error:', error);
          set({
            error: error.message || 'Failed to update task',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteTask: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          await taskService.deleteTask(id);

          set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id),
            currentTask: state.currentTask?.id === id ? null : state.currentTask,
            isLoading: false,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Delete task error:', error);
          set({
            error: error.message || 'Failed to delete task',
            isLoading: false,
          });
          throw error;
        }
      },

      // Task actions
      completeTask: async (id: string) => {
        try {
          const task = await taskService.completeTask(id);

          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t),
            currentTask: state.currentTask?.id === id ? task : state.currentTask,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Complete task error:', error);
          throw error;
        }
      },

      uncompleteTask: async (id: string) => {
        try {
          const task = await taskService.uncompleteTask(id);

          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t),
            currentTask: state.currentTask?.id === id ? task : state.currentTask,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Uncomplete task error:', error);
          throw error;
        }
      },

      assignTask: async (id: string, assigneeId: string) => {
        try {
          const task = await taskService.assignTask(id, assigneeId);

          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t),
            currentTask: state.currentTask?.id === id ? task : state.currentTask,
          }));

          // Apply current filters
          get().applyFilters();
        } catch (error: any) {
          logger.error('Assign task error:', error);
          throw error;
        }
      },

      reorderTasks: async (fromIndex: number, toIndex: number) => {
        try {
          set((state) => {
            const newTasks = [...state.tasks];
            const [movedTask] = newTasks.splice(fromIndex, 1);
            newTasks.splice(toIndex, 0, movedTask);

            return {
              tasks: newTasks,
            };
          });

          // Apply current filters to update filteredTasks
          get().applyFilters();

          // Save the new order to backend (optional - you can implement this in taskService)
          // await taskService.updateTaskOrder(get().tasks.map((task, index) => ({ id: task.id, order: index })));
        } catch (error: any) {
          logger.error('Reorder tasks error:', error);
          throw error;
        }
      },

      updateTaskOrder: async (newTasks: Task[]) => {
        try {
          // Update tasks with new order values
          const tasksWithOrder = newTasks.map((task, index) => ({
            ...task,
            order: index
          }));

          set((state) => ({
            tasks: tasksWithOrder,
            filteredTasks: tasksWithOrder, // Update filtered tasks directly to preserve order
          }));

          // Save the new order to backend
          await taskService.updateTaskOrder(tasksWithOrder.map((task, index) => ({ id: task.id, order: index })));
        } catch (error: any) {
          logger.error('Update task order error:', error);
          throw error;
        }
      },

      // Filtering and searching
      setFilter: (filter: TaskFilter) => {
        set({ filter });
        get().applyFilters();
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().applyFilters();
      },

      setSortBy: (sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title' | 'order') => {
        set({ sortBy });
        get().applyFilters();
      },

      setSortOrder: (order: 'asc' | 'desc') => {
        set({ sortOrder: order });
        get().applyFilters();
      },

      resetToCustomOrder: () => {
        set({ sortBy: 'order', sortOrder: 'asc' });
        get().applyFilters();
      },

      clearFilters: () => {
        set({
          filter: {},
          searchQuery: '',
          sortBy: 'order',
          sortOrder: 'asc',
        });
        get().applyFilters();
      },

      // Apply filters to tasks
      applyFilters: () => {
        const { tasks, filter, searchQuery, sortBy, sortOrder = "asc" } = get();

        let filtered = [...tasks];

        // Apply search filter
        if (searchQuery) {
          filtered = filtered.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        // Apply status filter
        if (filter.status && filter.status?.length > 0) {
          filtered = filtered.filter(task => filter.status!.includes(task.status));
        }

        // Apply priority filter
        if (filter.priority && filter.priority?.length > 0) {
          filtered = filtered.filter(task => filter.priority!.includes(task.priority));
        }

        // Apply project filter
        if (filter.projectId) {
          filtered = filtered.filter(task => task.projectId === filter.projectId);
        }

        // Apply goal filter
        if (filter.goalId) {
          filtered = filtered.filter(task => task.goalId === filter.goalId);
        }

        // Apply assignee filter
        if (filter.assigneeId) {
          filtered = filtered.filter(task => task.assigneeId === filter.assigneeId);
        }

        // Apply due date filter
        if (filter.dueDate) {
          filtered = filtered.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            const from = filter.dueDate!.from;
            const to = filter.dueDate!.to;

            if (from && taskDate < from) return false;
            if (to && taskDate > to) return false;
            return true;
          });
        }

        // Apply sorting - but preserve custom order if no specific sort is applied
        if (sortBy && sortBy !== 'order') {
          filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
              case 'createdAt':
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
                break;
              case 'dueDate':
                aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                break;
              case 'priority':
                const priorityOrder = { [TaskPriority.URGENT]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
                aValue = priorityOrder[a.priority] || 0;
                bValue = priorityOrder[b.priority] || 0;
                break;
              case 'title':
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
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
        } else {
          // Default sorting by order field (preserves drag & drop order)
          filtered.sort((a, b) => {
            return (a.order || 0) - (b.order || 0);
          });
        }

        set({ filteredTasks: filtered });
      },

      // State management
      setCurrentTask: (task: Task | null) => set({ currentTask: task }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Local updates (optimistic updates)
      addTask: (task: Task) => {
        set((state) => ({
          tasks: [task, ...state.tasks],
        }));
        get().applyFilters();
      },

      updateTaskLocal: (id: string, data: Partial<Task>) => {
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...data } : t),
          currentTask: state.currentTask?.id === id ? { ...state.currentTask, ...data } : state.currentTask,
        }));
        get().applyFilters();
      },

      removeTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== id),
          currentTask: state.currentTask?.id === id ? null : state.currentTask,
        }));
        get().applyFilters();
      },
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        filter: state.filter,
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
