import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, SegmentedButtons, Chip, ProgressBar, ActivityIndicator, useTheme, IconButton } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Project, ProjectStatus } from '@/types/project';
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay, isWithinInterval, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  productivityScore: number;
  averageTaskCompletionTime: number;
  totalTimeTracked: number;
  tasksByPriority: { [key in TaskPriority]: number };
  tasksByStatus: { [key in TaskStatus]: number };
  projectsByStatus: { [key in ProjectStatus]: number };
  dailyProductivity: { date: string; tasksCompleted: number; timeTracked: number }[];
  weeklyTrends: { week: string; tasksCompleted: number; projectsCompleted: number }[];
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  insights: string[];
}

export const AnalyticsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const { tasks, fetchTasks, isLoading: tasksLoading } = useTaskStore();
  const { projects, fetchProjects, isLoading: projectsLoading } = useProjectStore();

  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  // React to changes in tasks and projects
  useEffect(() => {
    // This will trigger re-renders when tasks or projects change
    // The analytics calculations will automatically update
  }, [tasks, projects]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchTasks(), fetchProjects()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case '1y':
        return { start: subYears(now, 1), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const calculateAnalytics = useMemo(() => {
    if (!tasks.length && !projects.length) return null;

    const { start, end } = getDateRange(selectedPeriod);
    
    // Filter data by selected period
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return isWithinInterval(taskDate, { start, end });
    });

    const filteredProjects = projects.filter(project => {
      const projectDate = new Date(project.createdAt);
      return isWithinInterval(projectDate, { start, end });
    });

    // Basic task metrics
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === TaskStatus.DONE).length;
    const inProgressTasks = filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const pendingTasks = filteredTasks.filter(task => task.status === TaskStatus.TODO).length;
    
    // Overdue tasks
    const now = new Date();
    const overdueTasks = filteredTasks.filter(task => {
      if (!task.dueDate || task.status === TaskStatus.DONE) return false;
      return new Date(task.dueDate) < now;
    }).length;

    // Project metrics
    const totalProjects = filteredProjects.length;
    const activeProjects = filteredProjects.filter(project => project.status === ProjectStatus.ACTIVE).length;
    const completedProjects = filteredProjects.filter(project => project.status === ProjectStatus.DONE).length;

    // Productivity score calculation
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    const productivityScore = Math.round((taskCompletionRate + projectCompletionRate) / 2);

    // Average task completion time (in hours)
    const completedTasksWithTime = filteredTasks.filter(task => 
      task.status === TaskStatus.DONE && task.completedAt && task.createdAt
    );
    const averageTaskCompletionTime = completedTasksWithTime.length > 0 
      ? completedTasksWithTime.reduce((acc, task) => {
          const created = new Date(task.createdAt);
          const completed = new Date(task.completedAt!);
          return acc + differenceInHours(completed, created);
        }, 0) / completedTasksWithTime.length
      : 0;

    // Total time tracked (estimated from task metadata)
    const totalTimeTracked = filteredTasks.reduce((acc, task) => {
      const estimatedHours = task.metadata?.estimatedHours || 0;
      const actualHours = task.metadata?.actualHours || estimatedHours;
      return acc + actualHours;
    }, 0);

    // Tasks by priority
    const tasksByPriority = {
      [TaskPriority.LOW]: filteredTasks.filter(task => task.priority === TaskPriority.LOW).length,
      [TaskPriority.MEDIUM]: filteredTasks.filter(task => task.priority === TaskPriority.MEDIUM).length,
      [TaskPriority.HIGH]: filteredTasks.filter(task => task.priority === TaskPriority.HIGH).length,
      [TaskPriority.URGENT]: filteredTasks.filter(task => task.priority === TaskPriority.URGENT).length,
    };

    // Tasks by status
    const tasksByStatus = {
      [TaskStatus.TODO]: filteredTasks.filter(task => task.status === TaskStatus.TODO).length,
      [TaskStatus.IN_PROGRESS]: filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
      [TaskStatus.DONE]: filteredTasks.filter(task => task.status === TaskStatus.DONE).length,
      [TaskStatus.ARCHIVED]: filteredTasks.filter(task => task.status === TaskStatus.ARCHIVED).length,
    };

    // Projects by status
    const projectsByStatus = {
      [ProjectStatus.PLANNING]: filteredProjects.filter(project => project.status === ProjectStatus.PLANNING).length,
      [ProjectStatus.ACTIVE]: filteredProjects.filter(project => project.status === ProjectStatus.ACTIVE).length,
      [ProjectStatus.ON_HOLD]: filteredProjects.filter(project => project.status === ProjectStatus.ON_HOLD).length,
      [ProjectStatus.DONE]: filteredProjects.filter(project => project.status === ProjectStatus.DONE).length,
      [ProjectStatus.CANCELLED]: filteredProjects.filter(project => project.status === ProjectStatus.CANCELLED).length,
      [ProjectStatus.ARCHIVED]: filteredProjects.filter(project => project.status === ProjectStatus.ARCHIVED).length,
    };

    // Daily productivity data
    const dailyProductivity: { date: string; tasksCompleted: number; timeTracked: number }[] = [];
    const daysDiff = differenceInDays(end, start);
    const daysToShow = Math.min(daysDiff, 30); // Limit to 30 days for chart readability

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(end, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayTasks = filteredTasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return isWithinInterval(completedDate, { start: dayStart, end: dayEnd });
      });

      const dayTimeTracked = dayTasks.reduce((acc, task) => {
        const estimatedHours = task.metadata?.estimatedHours || 0;
        const actualHours = task.metadata?.actualHours || estimatedHours;
        return acc + actualHours;
      }, 0);

      dailyProductivity.push({
        date: format(date, 'MMM dd'),
        tasksCompleted: dayTasks.length,
        timeTracked: dayTimeTracked,
      });
    }

    // Weekly trends
    const weeklyTrends: { week: string; tasksCompleted: number; projectsCompleted: number }[] = [];
    const weeksToShow = Math.min(Math.ceil(daysDiff / 7), 12); // Limit to 12 weeks

    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = subWeeks(end, i + 1);
      const weekEnd = subWeeks(end, i);
      
      const weekTasks = filteredTasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
      });

      const weekProjects = filteredProjects.filter(project => {
        if (!project.updatedAt) return false;
        const updatedDate = new Date(project.updatedAt);
        return isWithinInterval(updatedDate, { start: weekStart, end: weekEnd }) && 
               project.status === ProjectStatus.DONE;
      });

      weeklyTrends.push({
        week: format(weekStart, 'MMM dd'),
        tasksCompleted: weekTasks.length,
        projectsCompleted: weekProjects.length,
      });
    }

    // Category breakdown
    const categoryMap = new Map<string, number>();
    filteredTasks.forEach(task => {
      const category = task.metadata?.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    // Generate insights
    const insights: string[] = [];
    
    if (productivityScore >= 80) {
      insights.push("🎉 Excellent productivity! You're maintaining a high completion rate.");
    } else if (productivityScore >= 60) {
      insights.push("👍 Good progress! Consider focusing on completing more tasks.");
    } else {
      insights.push("💪 Room for improvement. Try breaking down large tasks into smaller ones.");
    }

    if (overdueTasks > 0) {
      insights.push(`⚠️ You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. Consider prioritizing them.`);
    }

    if (inProgressTasks > completedTasks) {
      insights.push("🔄 You have many tasks in progress. Consider finishing some before starting new ones.");
    }

    if (averageTaskCompletionTime > 0) {
      if (averageTaskCompletionTime < 24) {
        insights.push("⚡ Great! You're completing tasks quickly.");
      } else if (averageTaskCompletionTime < 72) {
        insights.push("📈 Good task completion time. Keep up the momentum!");
      } else {
        insights.push("⏰ Consider setting more realistic deadlines for your tasks.");
      }
    }

    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      insights.push(`📊 Your most active category is "${topCategory.category}" (${topCategory.percentage}% of tasks).`);
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      totalProjects,
      activeProjects,
      completedProjects,
      productivityScore,
      averageTaskCompletionTime,
      totalTimeTracked,
      tasksByPriority,
      tasksByStatus,
      projectsByStatus,
      dailyProductivity,
      weeklyTrends,
      categoryBreakdown,
      insights,
    };
  }, [tasks, projects, selectedPeriod]);

  useEffect(() => {
    setAnalyticsData(calculateAnalytics);
  }, [calculateAnalytics]);

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.colors.text.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const renderStatCard = (title: string, value: string | number, subtitle?: string, color?: string, icon?: string) => (
    <Card key={title} style={[styles.statCard, { borderLeftColor: color || theme.colors.primary }]}>
      <Card.Content style={styles.statContent}>
        {icon && (
          <IconButton
            icon={icon}
            size={24}
            iconColor={color || theme.colors.primary}
            style={styles.statIcon}
          />
        )}
        <Text variant="headlineSmall" style={[styles.statValue, { color: color || theme.colors.primary }]}>
          {value}
        </Text>
        <Text variant="bodyMedium" style={styles.statLabel}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" style={styles.statSubtitle}>
            {subtitle}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderProgressCard = (title: string, current: number, total: number, color: string) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return (
      <Card key={title} style={styles.progressCard}>
        <Card.Content>
          <View style={styles.progressHeader}>
            <Text variant="titleMedium" style={styles.progressTitle}>
              {title}
            </Text>
            <Text variant="bodyMedium" style={[styles.progressValue, { color }]}>
              {current}/{total}
            </Text>
          </View>
          <ProgressBar
            progress={percentage / 100}
            color={color}
            style={styles.progressBar}
          />
          <Text variant="bodySmall" style={styles.progressPercentage}>
            {Math.round(percentage)}% Complete
          </Text>
        </Card.Content>
      </Card>
    );
  };

  if (tasksLoading || projectsLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          {t('analytics.loading')}
        </Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          {t('analytics.noData')}
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          {t('analytics.noDataDescription')}
        </Text>
      </View>
    );
  }

  const {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    totalProjects,
    activeProjects,
    completedProjects,
    productivityScore,
    averageTaskCompletionTime,
    totalTimeTracked,
    tasksByPriority,
    tasksByStatus,
    dailyProductivity,
    weeklyTrends,
    categoryBreakdown,
    insights,
  } = analyticsData;

  const productivityData = {
    labels: dailyProductivity.map(d => d.date),
    datasets: [
      {
        data: dailyProductivity.map(d => d.tasksCompleted),
        color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const taskStatusData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
    data: [completedTasks, inProgressTasks, pendingTasks, overdueTasks],
  };

  const priorityData = {
    labels: ['Low', 'Medium', 'High', 'Urgent'],
    data: [tasksByPriority[TaskPriority.LOW], tasksByPriority[TaskPriority.MEDIUM], tasksByPriority[TaskPriority.HIGH], tasksByPriority[TaskPriority.URGENT]],
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          {t('analytics.title')}
        </Text>
        <SegmentedButtons
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          buttons={[
            { value: '7d', label: '7D' },
            { value: '30d', label: '30D' },
            { value: '90d', label: '90D' },
            { value: '1y', label: '1Y' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Key Metrics */}
      <View style={styles.statsContainer}>
        {renderStatCard(
          t('analytics.tasksCompleted'),
          completedTasks,
          `${totalTasks} total`,
          '#4CAF50',
          'check-circle'
        )}
        {renderStatCard(
          t('analytics.productivityScore'),
          `${productivityScore}%`,
          t('analytics.productivityDescription'),
          '#2196F3',
          'trending-up'
        )}
        {renderStatCard(
          t('analytics.timeTracked'),
          `${Math.round(totalTimeTracked)}h`,
          t('analytics.timeDescription'),
          '#FF9800',
          'clock'
        )}
        {renderStatCard(
          t('analytics.activeProjects'),
          activeProjects,
          `${totalProjects} total`,
          '#9C27B0',
          'folder'
        )}
      </View>

      {/* Progress Cards */}
      <View style={styles.progressContainer}>
        {renderProgressCard(
          t('analytics.taskProgress'),
          completedTasks,
          totalTasks,
          '#4CAF50'
        )}
        {renderProgressCard(
          t('analytics.projectProgress'),
          completedProjects,
          totalProjects,
          '#2196F3'
        )}
      </View>

      {/* Daily Productivity Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            {t('analytics.dailyProductivity')}
          </Text>
          <LineChart
            data={productivityData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Charts Row */}
      <View style={styles.chartsRow}>
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              {t('analytics.taskStatus')}
            </Text>
            <PieChart
              data={taskStatusData.data.map((value, index) => ({
                name: taskStatusData.labels[index],
                population: value,
                color: ['#4CAF50', '#FF9800', '#9E9E9E', '#F44336'][index],
                legendFontColor: theme.colors.text,
                legendFontSize: 12,
              }))}
              width={screenWidth / 2 - 24}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              {t('analytics.taskPriority')}
            </Text>
            <PieChart
              data={priorityData.data.map((value, index) => ({
                name: priorityData.labels[index],
                population: value,
                color: ['#66BB6A', '#42A5F5', '#FFA726', '#EF5350'][index],
                legendFontColor: theme.colors.text,
                legendFontSize: 12,
              }))}
              width={screenWidth / 2 - 24}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      </View>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              {t('analytics.categoryBreakdown')}
            </Text>
            <View style={styles.categoryList}>
              {categoryBreakdown.map((category, index) => (
                <View key={category.category} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text variant="bodyMedium" style={styles.categoryName}>
                      {category.category}
                    </Text>
                    <Text variant="bodySmall" style={styles.categoryCount}>
                      {category.count} tasks
                    </Text>
                  </View>
                  <View style={styles.categoryProgress}>
                    <ProgressBar
                      progress={category.percentage / 100}
                      color={theme.colors.primary}
                      style={styles.categoryProgressBar}
                    />
                    <Text variant="bodySmall" style={styles.categoryPercentage}>
                      {category.percentage}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Insights */}
      <Card style={styles.insightsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            {t('analytics.insights')}
          </Text>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Text variant="bodyMedium" style={styles.insightText}>
                {insight}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.text,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginLeft: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    borderLeftWidth: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIcon: {
    margin: 0,
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  statSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  progressContainer: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  progressCard: {
    margin: '1%',
    marginBottom: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  progressValue: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressPercentage: {
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  chartCard: {
    margin: 8,
    elevation: 2,
  },
  chartTitle: {
    marginBottom: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  categoryCount: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  categoryProgress: {
    flex: 1,
    marginLeft: 16,
  },
  categoryProgressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  categoryPercentage: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  insightsCard: {
    margin: 8,
    marginBottom: 32,
    elevation: 2,
  },
  insightItem: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  insightText: {
    color: theme.colors.text,
    lineHeight: 20,
  },
});