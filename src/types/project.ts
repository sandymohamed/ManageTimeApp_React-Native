export enum ProjectRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  color: string;
  ownerId: string;
  members: ProjectMember[];
  startDate?: string;
  endDate?: string;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
  budget?: number;
  category?: string;
  tags: string[];
  templateId?: string;
  comments: ProjectComment[];
  activities: ProjectActivity[];
  files: ProjectFile[];
  notifications: ProjectNotification[];
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  category?: string;
  tags?: string[];
  templateId?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  color?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  category?: string;
  tags?: string[];
  templateId?: string;
}

export interface AddMemberData {
  userId: string;
  role: ProjectRole;
}

export interface UpdateMemberRoleData {
  role: ProjectRole;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

export enum MilestoneStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  assigneeId?: string;
  assigneeName?: string;
  milestoneId?: string;
  milestoneTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',


  // TODO = 'TODO',
  // IN_PROGRESS = 'IN_PROGRESS',
  // COMPLETED = 'COMPLETED',
  // CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface CreateMilestoneData {
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
}

export interface UpdateMilestoneData {
  title?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  status?: MilestoneStatus;
}

export interface CreateProjectTaskData {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  milestoneId?: string;
}

export interface UpdateProjectTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  milestoneId?: string;
}

// Project Template interfaces
export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  color?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectTemplateData {
  name: string;
  description?: string;
  category?: string;
  color?: string;
}

export interface UpdateProjectTemplateData {
  name?: string;
  description?: string;
  category?: string;
  color?: string;
}

// Project Comment interfaces
export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  replies?: ProjectComment[];
}

export interface CreateProjectCommentData {
  content: string;
  parentId?: string;
}

export interface UpdateProjectCommentData {
  content: string;
}

// Project Activity interfaces
export enum ProjectActivityType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  MEMBER_ROLE_CHANGED = 'MEMBER_ROLE_CHANGED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  MILESTONE_CREATED = 'MILESTONE_CREATED',
  MILESTONE_UPDATED = 'MILESTONE_UPDATED',
  MILESTONE_COMPLETED = 'MILESTONE_COMPLETED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  FILE_UPLOADED = 'FILE_UPLOADED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  type: ProjectActivityType;
  description: string;
  metadata?: any;
  createdAt: string;
}

// Project File interfaces
export interface ProjectFile {
  id: string;
  projectId: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface CreateProjectFileData {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

// Project Notification interfaces
export interface ProjectNotification {
  id: string;
  projectId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateProjectNotificationData {
  type: string;
  title: string;
  message: string;
}

// Project Analytics interfaces
export interface ProjectAnalytics {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalMilestones: number;
  completedMilestones: number;
  overdueMilestones: number;
  totalMembers: number;
  totalComments: number;
  totalFiles: number;
  budgetUsed: number;
  budgetRemaining: number;
  completionPercentage: number;
  averageTaskCompletionTime: number;
  mostActiveMember: string;
  recentActivity: ProjectActivity[];
}

// Project Budget interfaces
export interface ProjectBudget {
  projectId: string;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  currency: string;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  usedAmount: number;
  remainingAmount: number;
}

export interface CreateBudgetCategoryData {
  name: string;
  allocatedAmount: number;
}

export interface UpdateBudgetCategoryData {
  name?: string;
  allocatedAmount?: number;
}

// Project Status Transition interfaces
export interface ProjectStatusTransition {
  from: ProjectStatus;
  to: ProjectStatus;
  allowed: boolean;
  requiresConfirmation: boolean;
  message?: string;
}

// Project Search and Filter interfaces
export interface ProjectSearchFilters {
  search?: string;
  status?: ProjectStatus[];
  category?: string[];
  tags?: string[];
  ownerId?: string;
  memberId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  hasBudget?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Project Invitation Types
export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: ProjectRole;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface CreateProjectInvitationData {
  inviteeEmail: string;
  role: ProjectRole;
  message?: string;
  expiresInDays?: number; // Default 7 days
}

export interface UpdateProjectInvitationData {
  status: 'ACCEPTED' | 'DECLINED';
}
