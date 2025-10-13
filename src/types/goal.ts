export enum GoalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: GoalPriority;
  category: string;
  targetDate?: string;
  completedAt?: string;
  progress: number;
  userId: string;
  milestones: Milestone[];
  tasks: string[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  targetDate?: string;
  completedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

export enum MilestoneStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface CreateGoalData {
  title: string;
  description?: string;
  priority?: GoalPriority;
  category?: string;
  targetDate?: string;
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  status?: GoalStatus;
  priority?: GoalPriority;
  category?: string;
  targetDate?: string;
  progress?: number;
  completedAt?: string;
}

export interface CreateMilestoneData {
  title: string;
  description?: string;
  targetDate?: string;
  order?: number;
}

export interface UpdateMilestoneData {
  title?: string;
  description?: string;
  status?: MilestoneStatus;
  targetDate?: string;
  order?: number;
}

export interface AIPlanRequest {
  goalId: string;
  promptOptions?: {
    intensity?: 'low' | 'medium' | 'high';
    weeklyHours?: number;
    language?: 'en' | 'ar';
    tone?: 'supportive' | 'professional' | 'casual';
  };
}

export interface GeneratedPlan {
  milestones: GeneratedMilestone[];
  tasks: GeneratedTask[];
  notes?: string;
}

export interface GeneratedMilestone {
  title: string;
  durationDays: number;
  description?: string;
  tasks: string[];
}

export interface GeneratedTask {
  title: string;
  milestoneIndex: number;
  dueOffsetDays: number;
  durationMinutes: number;
  recurrence?: string;
  description?: string;
}
