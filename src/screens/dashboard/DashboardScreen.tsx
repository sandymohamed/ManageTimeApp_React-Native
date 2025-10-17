import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, ProgressBar, Chip, IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isThisWeek, isThisMonth, addDays, subDays } from 'date-fns';

interface DashboardScreenProps {
  navigation: any;
}

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const { tasks, fetchTasks, isLoading } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [activeChart, setActiveChart] = useState<'progress' | 'priority'>('progress');

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  // React to changes in tasks and projects
  useEffect(() => {
    // This will trigger re-renders when tasks or projects change
    // The analytics calculations will automatically update
  }, [tasks, projects]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchProjects()]);
    setRefreshing(false);
  };

  // Calculate progress data
  const getProgressData = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'weekly':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'monthly':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    const periodTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startDate && taskDate <= endDate;
    });

    const completedTasks = periodTasks.filter(task => task.status === TaskStatus.DONE);
    const totalTasks = periodTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks: completedTasks.length,
      completionRate,
      periodTasks
    };
  };

  // Get urgent tasks
  const getUrgentTasks = () => {
    return tasks.filter(task =>
      task.priority === TaskPriority.URGENT &&
      task.status !== TaskStatus.DONE &&
      (!task.dueDate || new Date(task.dueDate) >= new Date())
    ).slice(0, 5);
  };

  // Get this week's tasks
  const getWeeklyTasks = () => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const weekTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });

    // Group by day
    const tasksByDay: { [key: string]: Task[] } = {};
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayKey = format(day, 'yyyy-MM-dd');
      tasksByDay[dayKey] = weekTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === day.toDateString();
      });
    }

    return tasksByDay;
  };

  // Get analytics data
  const getAnalyticsData = () => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
      });
      return {
        date: format(date, ' dd'),
        completed: dayTasks.filter(task => task.status === TaskStatus.DONE).length,
        total: dayTasks.length
      };
    });

    const priorityDistribution = [
      { name: 'Urgent', count: tasks.filter(t => t.priority === TaskPriority.URGENT).length, color: '#FF4444', legendFontColor: theme.colors.text, legendFontSize: 12 },
      { name: 'High', count: tasks.filter(t => t.priority === TaskPriority.HIGH).length, color: '#FF6B6B', legendFontColor: theme.colors.text, legendFontSize: 12 },
      { name: 'Medium', count: tasks.filter(t => t.priority === TaskPriority.MEDIUM).length, color: '#42A5F5', legendFontColor: theme.colors.text, legendFontSize: 12 },
      { name: 'Low', count: tasks.filter(t => t.priority === TaskPriority.LOW).length, color: '#66BB6A', legendFontColor: theme.colors.text, legendFontSize: 12 },
    ];

    return { last7Days, priorityDistribution };
  };

  const progressData = getProgressData();
  const urgentTasks = getUrgentTasks();
  const weeklyTasks = getWeeklyTasks();
  const analytics = getAnalyticsData();

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.colors.text.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.primary
    }
  };

  const renderProgressCard = () => (
    <Card style={[styles.card, styles.elevatedCard]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {t('dashboard.progress')}
          </Text>
          <View style={styles.periodSelector}>
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive
                  ]}
                >
                  {t(`dashboard.${period}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <Text variant="headlineLarge" style={styles.progressNumber}>
              {Math.round(progressData.completionRate)}%
            </Text>
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressRingFill,
                  {
                    transform: [{ rotate: `${(progressData.completionRate / 100) * 360}deg` }],
                    backgroundColor: theme.colors.primary
                  }
                ]}
              />
            </View>
          </View>
          <View style={styles.progressStats}>
            <Text variant="titleLarge" style={styles.completedNumber}>
              {progressData.completedTasks}
            </Text>
            <Text variant="bodyMedium" style={styles.progressLabel}>
              {t('dashboard.tasksCompleted')}
            </Text>
            <ProgressBar
              progress={progressData.completionRate / 100}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.totalTasks}>
              {progressData.totalTasks} {t('dashboard.totalTasks')}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderUrgentTasks = () => (
    <Card style={[styles.card, styles.elevatedCard]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleWithIcon}>
            <View style={[styles.iconContainer, { backgroundColor: '#FF444420' }]}>
              <Text style={[styles.iconText, { color: '#FF4444' }]}>⚠️</Text>
            </View>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('dashboard.urgentTasks')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Tasks', { filter: 'urgent' })}
            style={styles.seeAllButton}
          >
            <Text variant="bodyMedium" style={styles.seeAllText}>
              {t('common.seeAll')}
            </Text>
          </TouchableOpacity>
        </View>

        {urgentTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: theme.colors.surfaceVariant }]}>🎯</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {t('dashboard.noUrgentTasks')}
            </Text>
          </View>
        ) : (
          urgentTasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskItem,
                index === urgentTasks.length - 1 && styles.lastTaskItem
              ]}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
            >
              <View style={[styles.priorityIndicator, { backgroundColor: '#FF4444' }]} />
              <View style={styles.taskContent}>
                <Text variant="bodyMedium" style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                {task.dueDate && (
                  <View style={styles.dueDateContainer}>
                    <Text style={[styles.dueDateIcon, { color: theme.colors.primary }]}>📅</Text>
                    <Text variant="bodySmall" style={styles.taskDueDate}>
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                )}
              </View>
              <Chip
                mode="outlined"
                textStyle={styles.statusChip}
                style={[
                  styles.statusChipContainer,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: `${theme.colors.primary}10`
                  }
                ]}
              >
                {t(`task.status.${task.status.toLowerCase()}`)}
              </Chip>
            </TouchableOpacity>
          ))
        )}
      </Card.Content>
    </Card>
  );

  const renderWeeklyTasks = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date()), i));

    return (
      <Card style={[styles.card, styles.elevatedCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleWithIcon}>
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Text style={[styles.iconText, { color: theme.colors.primary }]}>📅</Text>
              </View>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('dashboard.thisWeekTasks')}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weeklyScrollContent}
          >
            {weekDays.map((day, index) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayTasks = weeklyTasks[dayKey] || [];
              const completedTasks = dayTasks.filter(task => task.status === TaskStatus.DONE).length;
              const isCurrentDay = day.toDateString() === new Date().toDateString();

              return (
                <TouchableOpacity
                  key={dayKey}
                  style={[
                    styles.dayCard,
                    isCurrentDay && styles.currentDayCard
                  ]}
                  onPress={() => navigation.navigate('Tasks', { filter: 'day', date: dayKey })}
                >
                  <Text variant="bodySmall" style={[
                    styles.dayName,
                    isCurrentDay && styles.currentDayText
                  ]}>
                    {format(day, 'EEE')}
                  </Text>
                  <Text variant="titleMedium" style={[
                    styles.dayNumber,
                    isCurrentDay && styles.currentDayText
                  ]}>
                    {format(day, 'd')}
                  </Text>
                  <View style={styles.dayStats}>
                    <Text variant="bodySmall" style={[
                      styles.dayTaskCount,
                      isCurrentDay && styles.currentDayText
                    ]}>
                      {completedTasks}/{dayTasks.length}
                    </Text>
                    <View style={[styles.dayProgress, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.dayProgressFill,
                          {
                            backgroundColor: isCurrentDay ? theme.colors.onPrimary : theme.colors.primary,
                            width: dayTasks.length > 0 ? `${Math.max((completedTasks / dayTasks.length) * 100, 5)}%` : '0%'
                          }
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderAnalytics = () => (
    <Card style={[styles.card, styles.elevatedCard]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleWithIcon}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.secondary}20` }]}>
              <Text style={[styles.iconText, { color: theme.colors.secondary }]}>📊</Text>
            </View>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('dashboard.analytics')}
            </Text>
          </View>
          <View style={styles.chartSelector}>
            <TouchableOpacity
              onPress={() => setActiveChart('progress')}
              style={[
                styles.chartSelectorButton,
                activeChart === 'progress' && styles.chartSelectorButtonActive
              ]}
            >
              <Text style={[
                styles.chartSelectorText,
                activeChart === 'progress' && styles.chartSelectorTextActive
              ]}>
                Progress
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveChart('priority')}
              style={[
                styles.chartSelectorButton,
                activeChart === 'priority' && styles.chartSelectorButtonActive
              ]}
            >
              <Text style={[
                styles.chartSelectorText,
                activeChart === 'priority' && styles.chartSelectorTextActive
              ]}>
                Priority
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartsContainer}>
          {activeChart === 'progress' ? (
            <View style={styles.chartContainer}>
              <Text variant="bodyMedium" style={styles.chartTitle}>
                {t('dashboard.last7Days')}
              </Text>
              <LineChart
                data={{
                  labels: analytics.last7Days.map(d => d.date),
                  datasets: [{
                    data: analytics.last7Days.map(d => d.completed),
                    color: (opacity = 1) => theme.colors.primary,
                    strokeWidth: 3,

                  }]
                }}
                width={screenWidth - 35}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={false}
                withShadow={true}
              />
            </View>
          ) : (
            <View style={styles.chartContainer}>
              <Text variant="bodyMedium" style={styles.chartTitle}>
                {t('dashboard.priorityDistribution')}
              </Text>
              <PieChart
                data={analytics.priorityDistribution.filter(item => item.count > 0)}
                width={screenWidth - 35}
                height={220}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
                absolute
              />
              <View style={styles.legendContainer}>
                {analytics.priorityDistribution.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text variant="bodySmall" style={styles.legendText}>
                      {item.name}: {item.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProgressCard()}
        {renderUrgentTasks()}
        {renderWeeklyTasks()}
        {renderAnalytics()}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  elevatedCard: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  cardTitle: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  seeAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seeAllText: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  periodButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  progressCircle: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 8,
    borderColor: theme.colors.surfaceVariant,
  },
  progressRingFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 8,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'currentColor',
    borderTopColor: 'currentColor',
    transformOrigin: 'center',
  },
  progressNumber: {
    fontWeight: '700',
    fontSize: 24,
    color: theme.colors.text,
  },
  progressStats: {
    flex: 1,
    gap: 8,
  },
  completedNumber: {
    fontWeight: '700',
    fontSize: 32,
    color: theme.colors.primary,
  },
  progressLabel: {
    color: theme.colors.text,
    opacity: 0.8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceVariant,
  },
  totalTasks: {
    color: theme.colors.text,
    opacity: 0.6,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceVariant}80`,
  },
  lastTaskItem: {
    borderBottomWidth: 0,
  },
  priorityIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateIcon: {
    fontSize: 12,
  },
  taskDueDate: {
    color: theme.colors.text,
    opacity: 0.7,
  },
  statusChip: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  statusChipContainer: {
    height: 24,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.text,
    opacity: 0.7,
  },
  weeklyScrollContent: {
    paddingHorizontal: 4,
  },
  dayCard: {
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    borderRadius: 12,
    minWidth: 70,
    backgroundColor: theme.colors.surfaceVariant,
  },
  currentDayCard: {
    backgroundColor: theme.colors.primary,
  },
  dayName: {
    fontWeight: '600',
    color: theme.colors.text,
    opacity: 0.8,
  },
  dayNumber: {
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 4,
  },
  currentDayText: {
    color: theme.colors.onPrimary,
    opacity: 1,
  },
  dayStats: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  dayTaskCount: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
    opacity: 0.8,
    marginBottom: 6,
  },
  dayProgress: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  dayProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  chartsContainer: {
    gap: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    marginBottom: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 2,
  },
  chartSelectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chartSelectorButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  chartSelectorText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  chartSelectorTextActive: {
    color: theme.colors.onPrimary,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: theme.colors.text,
    fontSize: 12,
  },
});