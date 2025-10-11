import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, ProgressBar, Chip, IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
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
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

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
        date: format(date, 'MMM dd'),
        completed: dayTasks.filter(task => task.status === TaskStatus.DONE).length,
        total: dayTasks.length
      };
    });

    const priorityDistribution = [
      { name: 'Urgent', count: tasks.filter(t => t.priority === TaskPriority.URGENT).length, color: '#FF6B6B' },
      { name: 'High', count: tasks.filter(t => t.priority === TaskPriority.HIGH).length, color: '#FFA726' },
      { name: 'Medium', count: tasks.filter(t => t.priority === TaskPriority.MEDIUM).length, color: '#42A5F5' },
      { name: 'Low', count: tasks.filter(t => t.priority === TaskPriority.LOW).length, color: '#66BB6A' },
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
    color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.colors.text.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, ${opacity})`,
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
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('dashboard.progress')} - {t(`dashboard.${selectedPeriod}`)}
          </Text>
          <View style={styles.periodSelector}>
            {/* these chips doesn't renser in the UI as it overflow the screen so they should be swapped or change style */}
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <Chip
                key={period}
                selected={selectedPeriod === period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodChip,
                  selectedPeriod === period && { backgroundColor: theme.colors.primary }
                ]}
                textStyle={[
                  styles.periodChipText,
                  selectedPeriod === period && { color: theme.colors.onPrimary }
                ]}
              >
                {t(`dashboard.${period}`)} 
              </Chip>
            ))}
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressStats}>
            <Text variant="headlineLarge" style={[styles.progressNumber, { color: theme.colors.primary }]}>
              {Math.round(progressData.completionRate)}%
            </Text>
            <Text variant="bodyMedium" style={[styles.progressLabel, { color: theme.colors.text }]}>
              {progressData.completedTasks} / {progressData.totalTasks} {t('dashboard.tasksCompleted')}
            </Text>
          </View>
          <ProgressBar
            progress={progressData.completionRate / 100}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderUrgentTasks = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('dashboard.urgentTasks')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text variant="bodyMedium" style={[styles.seeAllText, { color: theme.colors.primary }]}>
              {t('common.seeAll')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {urgentTasks.length === 0 ? (
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.text }]}>
            {t('dashboard.noUrgentTasks')}
          </Text>
        ) : (
          urgentTasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={[styles.priorityIndicator, { backgroundColor: '#FF6B6B' }]} />
              <View style={styles.taskContent}>
                <Text variant="bodyMedium" style={[styles.taskTitle, { color: theme.colors.text }]}>
                  {task.title}
                </Text>
                {task.dueDate && (
                  <Text variant="bodySmall" style={[styles.taskDueDate, { color: theme.colors.text }]}>
                    {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </Text>
                )}
              </View>
              <Chip
                mode="outlined"
                textStyle={[styles.statusChip, { color: theme.colors.primary }]}
                style={[styles.statusChipContainer, { borderColor: theme.colors.primary }]}
              >
                {t(`task.status.${task.status.toLowerCase()}`)}
              </Chip>
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );

  const renderWeeklyTasks = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date()), i));
    
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.text }]}>
              {t('dashboard.thisWeekTasks')}
            </Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weeklyScrollView}>
            {weekDays.map((day, index) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayTasks = weeklyTasks[dayKey] || [];
              const completedTasks = dayTasks.filter(task => task.status === TaskStatus.DONE).length;
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <View key={dayKey} style={[styles.dayCard, isToday && { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text variant="bodySmall" style={[styles.dayName, { color: theme.colors.text }]}>
                    {format(day, 'EEE')}
                  </Text>
                  <Text variant="titleMedium" style={[styles.dayNumber, { color: theme.colors.text }]}>
                    {format(day, 'd')}
                  </Text>
                  <View style={styles.dayStats}>
                    <Text variant="bodySmall" style={[styles.dayTaskCount, { color: theme.colors.text }]}>
                      {completedTasks}/{dayTasks.length}
                    </Text>
                    <View style={[styles.dayProgress, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <View 
                        style={[
                          styles.dayProgressFill, 
                          { 
                            backgroundColor: theme.colors.primary,
                            width: dayTasks.length > 0 ? `${(completedTasks / dayTasks.length) * 100}%` : '0%'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderAnalytics = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.text }]}>
          {t('dashboard.analytics')}
        </Text>
        
        <View style={styles.chartsContainer}>
          <View style={styles.chartContainer}>
            <Text variant="bodyMedium" style={[styles.chartTitle, { color: theme.colors.text }]}>
              {t('dashboard.last7Days')}
            </Text>
            <LineChart
              data={{
                labels: analytics.last7Days.map(d => d.date),
                datasets: [{
                  data: analytics.last7Days.map(d => d.completed),
                  color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, ${opacity})`,
                  strokeWidth: 2
                }]
              }}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
          
          <View style={styles.chartContainer}>
            <Text variant="bodyMedium" style={[styles.chartTitle, { color: theme.colors.text }]}>
              {t('dashboard.priorityDistribution')}
            </Text>
            <PieChart
              data={analytics.priorityDistribution.filter(item => item.count > 0)}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
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
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
  },
  seeAllText: {
    fontWeight: '500',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    height: 32,
  },
  periodChipText: {
    fontSize: 12,
  },
  progressContainer: {
    gap: 16,
  },
  progressStats: {
    alignItems: 'center',
  },
  progressNumber: {
    fontWeight: '700',
    fontSize: 48,
  },
  progressLabel: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: '500',
  },
  taskDueDate: {
    marginTop: 2,
    opacity: 0.7,
  },
  statusChip: {
    fontSize: 12,
  },
  statusChipContainer: {
    height: 28,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    opacity: 0.7,
  },
  weeklyScrollView: {
    marginTop: 8,
  },
  dayCard: {
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    borderRadius: 12,
    minWidth: 60,
    backgroundColor: theme.colors.surfaceVariant,
  },
  dayName: {
    fontWeight: '500',
    opacity: 0.7,
  },
  dayNumber: {
    fontWeight: '600',
    marginTop: 4,
  },
  dayStats: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  dayTaskCount: {
    fontSize: 12,
    marginBottom: 4,
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
    gap: 24,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    marginBottom: 12,
    fontWeight: '500',
  },
  chart: {
    borderRadius: 16,
  },
});
