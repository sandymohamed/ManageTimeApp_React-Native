import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, Card, IconButton, Chip, useTheme, FAB, Badge, Portal, Modal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, subDays, isToday, isTomorrow, isYesterday, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

interface CalendarScreenProps {
  navigation: any;
}

const screenWidth = Dimensions.get('window').width;
const dayWidth = screenWidth / 7;

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  // Get upcoming tasks for reminders
  useEffect(() => {
    const now = new Date();
    const upcoming = tasks.filter(task => {
      if (!task.dueDate || task.status === TaskStatus.DONE) return false;
      const taskDate = new Date(task.dueDate);
      const diffInHours = differenceInHours(taskDate, now);
      return diffInHours >= 0 && diffInHours <= 24; // Next 24 hours
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    setUpcomingTasks(upcoming);
  }, [tasks]);

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  const getTasksForWeek = (startDate: Date) => {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const weekTasks: { [key: string]: Task[] } = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      weekTasks[dayKey] = getTasksForDate(day);
    });
    
    return { weekDays, weekTasks };
  };

  const getTasksForMonth = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const monthTasks: { [key: string]: Task[] } = {};
    
    days.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      monthTasks[dayKey] = getTasksForDate(day);
    });
    
    return { days, monthTasks };
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return '#FF6B6B';
      case TaskPriority.HIGH:
        return '#FFA726';
      case TaskPriority.MEDIUM:
        return '#42A5F5';
      case TaskPriority.LOW:
        return '#66BB6A';
      default:
        return theme.colors.primary;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return '#4CAF50';
      case TaskStatus.IN_PROGRESS:
        return '#FF9800';
      case TaskStatus.TODO:
        return '#9E9E9E';
      default:
        return theme.colors.primary;
    }
  };

  const getTimeUntilTask = (dueDate: string) => {
    const now = new Date();
    const taskDate = new Date(dueDate);
    const diffInMinutes = differenceInMinutes(taskDate, now);
    const diffInHours = differenceInHours(taskDate, now);
    const diffInDays = differenceInDays(taskDate, now);

    if (diffInMinutes < 0) return t('calendar.overdue');
    if (diffInMinutes < 60) return `${diffInMinutes}m ${t('calendar.remaining')}`;
    if (diffInHours < 24) return `${diffInHours}h ${t('calendar.remaining')}`;
    if (diffInDays < 7) return `${diffInDays}d ${t('calendar.remaining')}`;
    return format(taskDate, 'MMM d');
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskComplete = async (task: Task) => {
    try {
      await updateTask(task.id, { 
        status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
      });
      showSuccess(t('tasks.completedSuccessfully', { title: task.title }));
    } catch (error) {
      showError(t('tasks.completeFailed', { title: task.title }));
    }
  };

  const getTaskTimeText = (dueDate: string) => {
    const taskDate = new Date(dueDate);
    return format(taskDate, 'h:mm a');
  };

  const renderMonthView = () => {
    const { days, monthTasks } = getTasksForMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.monthView}>
        {/* Week day headers */}
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <View key={day} style={styles.weekDayHeader}>
              <Text variant="bodySmall" style={[styles.weekDayText, { color: theme.colors.text }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayTasks = monthTasks[dayKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <TouchableOpacity
                key={dayKey}
                style={[
                  styles.dayCell,
                  !isCurrentMonth && styles.dayCellOtherMonth,
                  isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.dayNumber,
                    { color: theme.colors.text },
                    !isCurrentMonth && { opacity: 0.3 },
                    isToday && { color: theme.colors.primary, fontWeight: 'bold' },
                    isSelected && { color: theme.colors.onPrimary }
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                
                {/* Task indicators */}
                <View style={styles.taskIndicators}>
                  {dayTasks.slice(0, 3).map((task, taskIndex) => (
                    <TouchableOpacity
                      key={task.id}
                      onPress={() => handleTaskPress(task)}
                      style={[
                        styles.taskIndicator,
                        { backgroundColor: getPriorityColor(task.priority) }
                      ]}
                    >
                      <Text style={[styles.taskIndicatorText, { color: 'white' }]}>
                        {task.title.charAt(0).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {dayTasks.length > 3 && (
                    <TouchableOpacity
                      style={[styles.moreTasksIndicator, { backgroundColor: theme.colors.surfaceVariant }]}
                      onPress={() => setSelectedDate(day)}
                    >
                      <Text variant="bodySmall" style={[styles.moreTasksText, { color: theme.colors.text }]}>
                        +{dayTasks.length - 3}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const { weekDays, weekTasks } = getTasksForWeek(weekStart);
    
    return (
      <View style={styles.weekView}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weekDays.map((day, index) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayTasks = weekTasks[dayKey] || [];
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <TouchableOpacity
                key={dayKey}
                style={[
                  styles.weekDayCard,
                  { backgroundColor: theme.colors.surface },
                  isToday && { backgroundColor: theme.colors.primaryContainer },
                  isSelected && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  variant="bodySmall"
                  style={[
                    styles.weekDayName,
                    { color: theme.colors.text },
                    isSelected && { color: theme.colors.onPrimary }
                  ]}
                >
                  {format(day, 'EEE')}
                </Text>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.weekDayNumber,
                    { color: theme.colors.text },
                    isSelected && { color: theme.colors.onPrimary }
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                
                {/* Task count */}
                <Text
                  variant="bodySmall"
                  style={[
                    styles.weekTaskCount,
                    { color: theme.colors.text },
                    isSelected && { color: theme.colors.onPrimary }
                  ]}
                >
                  {dayTasks.length} {t('calendar.tasks')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(selectedDate);
    const sortedTasks = dayTasks.sort((a, b) => {
      // Sort by priority first, then by due time
      const priorityOrder = { [TaskPriority.URGENT]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return 0;
    });

    return (
      <View style={styles.dayView}>
        <Text variant="headlineSmall" style={[styles.dayViewTitle, { color: theme.colors.text }]}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
        
        {sortedTasks.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyCardContent}>
              <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.text }]}>
                {t('calendar.noTasksForDay')}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          sortedTasks.map((task) => (
            <Card key={task.id} style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.taskCardHeader}>
                  <View style={styles.taskTitleContainer}>
                    <Text variant="titleMedium" style={[styles.taskTitle, { color: theme.colors.text }]}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text variant="bodyMedium" style={[styles.taskDescription, { color: theme.colors.text }]}>
                        {task.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.taskBadges}>
                    <Chip
                      mode="outlined"
                      textStyle={[styles.priorityChip, { color: getPriorityColor(task.priority) }]}
                      style={[styles.priorityChipContainer, { borderColor: getPriorityColor(task.priority) }]}
                    >
                      {t(`task.priority.${task.priority.toLowerCase()}`)}
                    </Chip>
                    <Chip
                      mode="outlined"
                      textStyle={[styles.statusChip, { color: getStatusColor(task.status) }]}
                      style={[styles.statusChipContainer, { borderColor: getStatusColor(task.status) }]}
                    >
                      {t(`task.status.${task.status.toLowerCase()}`)}
                    </Chip>
                  </View>
                </View>
                
                {task.dueDate && (
                  <View style={styles.taskTimeContainer}>
                    <Text variant="bodySmall" style={[styles.taskTime, { color: theme.colors.text }]}>
                      {format(new Date(task.dueDate), 'h:mm a')}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    );
  };

  const renderUpcomingTasks = () => {
    if (upcomingTasks.length === 0) return null;

    return (
      <Card style={[styles.upcomingCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.upcomingHeader}>
            <Text variant="titleMedium" style={[styles.upcomingTitle, { color: theme.colors.text }]}>
              {t('calendar.upcomingTasks')}
            </Text>
            <Badge style={[styles.upcomingBadge, { backgroundColor: theme.colors.primary }]}>
              {upcomingTasks.length}
            </Badge>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.upcomingScroll}>
            {upcomingTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.upcomingTaskItem, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => handleTaskPress(task)}
              >
                <View style={[styles.upcomingTaskIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
                <Text variant="bodySmall" style={[styles.upcomingTaskTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text variant="bodySmall" style={[styles.upcomingTaskTime, { color: theme.colors.textSecondary }]}>
                  {task.dueDate && getTimeUntilTask(task.dueDate)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderSelectedDateTasks = () => {
    const selectedTasks = getTasksForDate(selectedDate);
    
    if (selectedTasks.length === 0) return null;
    
    return (
      <Card style={[styles.selectedDateCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.selectedDateTitle, { color: theme.colors.text }]}>
            {format(selectedDate, 'MMM d')} - {selectedTasks.length} {t('calendar.tasks')}
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedTasksScroll}>
            {selectedTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.selectedTaskItem, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => handleTaskPress(task)}
              >
                <View style={[styles.selectedTaskIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
                <Text variant="bodySmall" style={[styles.selectedTaskTitle, { color: theme.colors.text }]}>
                  {task.title}
                </Text>
                {task.dueDate && (
                  <Text variant="bodySmall" style={[styles.selectedTaskTime, { color: theme.colors.textSecondary }]}>
                    {getTaskTimeText(task.dueDate)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderTaskModal = () => (
    <Portal>
      <Modal
        visible={showTaskModal}
        onDismiss={() => setShowTaskModal(false)}
        contentContainerStyle={[styles.taskModal, { backgroundColor: theme.colors.surface }]}
      >
        {selectedTask && (
          <ScrollView style={styles.taskModalContent}>
            <View style={styles.taskModalHeader}>
              <Text variant="headlineSmall" style={[styles.taskModalTitle, { color: theme.colors.text }]}>
                {selectedTask.title}
              </Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={theme.colors.text}
                onPress={() => setShowTaskModal(false)}
              />
            </View>

            {selectedTask.description && (
              <Text variant="bodyMedium" style={[styles.taskModalDescription, { color: theme.colors.text }]}>
                {selectedTask.description}
              </Text>
            )}

            <View style={styles.taskModalDetails}>
              <View style={styles.taskDetailRow}>
                <Text variant="bodyMedium" style={[styles.taskDetailLabel, { color: theme.colors.textSecondary }]}>
                  {t('task.priority')}
                </Text>
                <Chip
                  mode="outlined"
                  style={[styles.taskDetailChip, { borderColor: getPriorityColor(selectedTask.priority) }]}
                  textStyle={{ color: getPriorityColor(selectedTask.priority) }}
                >
                  {t(`task.priority.${selectedTask.priority.toLowerCase()}`)}
                </Chip>
              </View>

              <View style={styles.taskDetailRow}>
                <Text variant="bodyMedium" style={[styles.taskDetailLabel, { color: theme.colors.textSecondary }]}>
                  {t('task.status')}
                </Text>
                <Chip
                  mode="outlined"
                  style={[styles.taskDetailChip, { borderColor: getStatusColor(selectedTask.status) }]}
                  textStyle={{ color: getStatusColor(selectedTask.status) }}
                >
                  {t(`task.status.${selectedTask.status.toLowerCase()}`)}
                </Chip>
              </View>

              {selectedTask.dueDate && (
                <View style={styles.taskDetailRow}>
                  <Text variant="bodyMedium" style={[styles.taskDetailLabel, { color: theme.colors.textSecondary }]}>
                    {t('task.dueDate')}
                  </Text>
                  <Text variant="bodyMedium" style={[styles.taskDetailValue, { color: theme.colors.text }]}>
                    {format(new Date(selectedTask.dueDate), 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.taskModalActions}>
              <TouchableOpacity
                style={[styles.taskActionButton, { backgroundColor: getStatusColor(selectedTask.status) }]}
                onPress={() => handleTaskComplete(selectedTask)}
              >
                <Text style={[styles.taskActionText, { color: 'white' }]}>
                  {selectedTask.status === TaskStatus.DONE ? t('task.markIncomplete') : t('task.markComplete')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.taskActionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowTaskModal(false);
                  navigation.navigate('TaskEdit', { taskId: selectedTask.id });
                }}
              >
                <Text style={[styles.taskActionText, { color: 'white' }]}>
                  {t('task.edit')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Modal>
    </Portal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="chevron-left"
            size={24}
            iconColor={theme.colors.text}
            onPress={() => {
              if (viewMode === 'month') {
                setCurrentDate(subMonths(currentDate, 1));
              } else if (viewMode === 'week') {
                setSelectedDate(subDays(selectedDate, 7));
              } else {
                setSelectedDate(subDays(selectedDate, 1));
              }
            }}
          />
          <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.text }]}>
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : viewMode === 'week'
              ? `${format(startOfWeek(selectedDate), 'MMM d')} - ${format(endOfWeek(selectedDate), 'MMM d')}`
              : format(selectedDate, 'MMMM d, yyyy')
            }
            
          </Text>
          <IconButton
            icon="chevron-right"
            size={24}
            iconColor={theme.colors.text}
            onPress={() => {
              if (viewMode === 'month') {
                setCurrentDate(addMonths(currentDate, 1));
              } else if (viewMode === 'week') {
                setSelectedDate(addDays(selectedDate, 7));
              } else {
                setSelectedDate(addDays(selectedDate, 1));
              }
            }}
          />
        </View>
      </View>
        <View style={styles.viewModeSelector}>
          {(['month', 'week', 'day'] as const).map((mode) => (
            <Chip
              key={mode}
              selected={viewMode === mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.viewModeChip,
                viewMode === mode && { backgroundColor: theme.colors.primary }
              ]}
              textStyle={[
                styles.viewModeChipText,
                viewMode === mode && { color: theme.colors.onPrimary }
              ]}
            >
              {t(`calendar.${mode}`)}
            </Chip>
          ))}
        </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderUpcomingTasks()}
        
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        
        {viewMode !== 'day' && renderSelectedDateTasks()}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('TaskCreate')}
        label={t('tasks.addTask')}
      />

      {renderTaskModal()}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
    marginHorizontal: 8,
  },
  viewModeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeChip: {
    height: 32,
  },
  viewModeChipText: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  monthView: {
    gap: 8,
  },
  weekHeader: {
    flexDirection: 'row',
  },
  weekDayHeader: {
    width: dayWidth,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontWeight: '500',
    opacity: 0.7,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: dayWidth,
    height: 80,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
    justifyContent: 'space-between',
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: theme.colors.primaryContainer,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayNumber: {
    textAlign: 'center',
    fontWeight: '500',
  },
  taskIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  taskIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreTasksText: {
    fontSize: 10,
    fontWeight: '500',
  },
  weekView: {
    marginBottom: 16,
  },
  weekDayCard: {
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    borderRadius: 12,
    minWidth: 80,
  },
  weekDayName: {
    fontWeight: '500',
    opacity: 0.7,
  },
  weekDayNumber: {
    fontWeight: '600',
    marginVertical: 4,
  },
  weekTaskCount: {
    fontSize: 12,
  },
  dayView: {
    gap: 16,
  },
  dayViewTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    opacity: 0.7,
  },
  taskCard: {
    marginBottom: 8,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontWeight: '500',
  },
  taskDescription: {
    marginTop: 4,
    opacity: 0.7,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    fontSize: 10,
  },
  priorityChipContainer: {
    height: 24,
  },
  statusChip: {
    fontSize: 10,
  },
  statusChipContainer: {
    height: 24,
  },
  taskTimeContainer: {
    marginTop: 8,
  },
  taskTime: {
    fontWeight: '500',
  },
  selectedDateCard: {
    marginTop: 16,
  },
  selectedDateTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedTasksScroll: {
    marginTop: 8,
  },
  selectedTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedTaskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  selectedTaskTitle: {
    fontWeight: '500',
  },
  selectedTaskTime: {
    fontSize: 10,
    fontWeight: '400',
  },
  // Upcoming tasks styles
  upcomingCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  upcomingTitle: {
    fontWeight: '600',
  },
  upcomingBadge: {
    marginLeft: 8,
  },
  upcomingScroll: {
    marginTop: 8,
  },
  upcomingTaskItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 140,
  },
  upcomingTaskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  upcomingTaskTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  upcomingTaskTime: {
    fontSize: 10,
    fontWeight: '400',
  },
  // Task modal styles
  taskModal: {
    margin: 20,
    maxHeight: '80%',
    borderRadius: 16,
  },
  taskModalContent: {
    padding: 20,
  },
  taskModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskModalTitle: {
    flex: 1,
    fontWeight: '600',
  },
  taskModalDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  taskModalDetails: {
    marginBottom: 20,
  },
  taskDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskDetailChip: {
    height: 32,
  },
  taskDetailValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  taskModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  taskActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  taskActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Enhanced task indicators
  taskIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  moreTasksIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  // FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
