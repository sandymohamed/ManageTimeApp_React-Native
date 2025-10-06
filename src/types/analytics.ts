export interface AnalyticsEvent {
  id: string;
  eventName: string;
  properties: Record<string, any>;
  userId: string;
  createdAt: string;
  syncedAt?: string;
}

export interface AnalyticsSummary {
  period: '7d' | '30d' | '90d' | '1y';
  tasksCompleted: number;
  tasksCreated: number;
  goalsCompleted: number;
  goalsCreated: number;
  productivityScore: number;
  averageTaskCompletionTime: number;
  mostProductiveDay: string;
  mostProductiveTime: string;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface ProductivityMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  streakDays: number;
  goalsAchieved: number;
  timeSpent: number;
}

export interface TimeTracking {
  date: string;
  tasksCompleted: number;
  timeSpent: number;
  productivityScore: number;
}

export interface CreateAnalyticsEventData {
  eventName: string;
  properties: Record<string, any>;
}
