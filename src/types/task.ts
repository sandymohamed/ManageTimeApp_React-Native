export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  dueTime?: string; // Time in HH:mm format
  completedAt?: string;
  projectId?: string;
  goalId?: string;
  assigneeId?: string;
  createdBy: string;
  tags: string[];
  order: number;
  metadata?: TaskMetadata;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

export interface TaskMetadata {
  durationMinutes?: number;
  estimatedHours?: number;
  actualHours?: number;
  category?: string;
  location?: string;
  attachments?: string[];
  comments?: TaskComment[];
  subtasks?: string[];
  dependencies?: string[];
  aiGenerated?: boolean;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  dueTime?: string; // Time in HH:mm format
  projectId?: string;
  goalId?: string;
  milestoneId?: string;
  assigneeId?: string;
  tags?: string[];
  metadata?: Partial<TaskMetadata>;
  recurrenceRule?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  dueTime?: string; // Time in HH:mm format
  projectId?: string;
  goalId?: string;
  assigneeId?: string;
  tags?: string[];
  metadata?: Partial<TaskMetadata>;
  recurrenceRule?: string;
}
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  projectId?: string;
  goalId?: string;
  assigneeId?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
}

