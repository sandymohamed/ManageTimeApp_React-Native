import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions,  } from 'react-native';
import { Text, Card, IconButton, Chip, useTheme, FAB, Badge, Portal, Modal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { useGoalStore } from '@/store/goalStore';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Milestone as GoalMilestone } from '@/types/goal';
import { ProjectMilestone } from '@/types/project';
import { Routine, RoutineFrequency } from '@/types/routine';
import { routineService } from '@/services/routineService';
import { reminderService, Reminder } from '@/services/reminderService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, subDays, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { useDayTranslations } from '@/utils/dateTranslations';

interface CalendarScreenProps {
  navigation: any;
}


export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();
  const { getDayName } = useDayTranslations();

  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { goals, fetchGoals } = useGoalStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineReminders, setRoutineReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchGoals();
    loadRoutines();
    loadRoutineReminders();
  }, []);

  const loadRoutineReminders = async () => {
    try {
      const reminders = await reminderService.getUpcomingReminders();
      // Filter for routine reminders only
      const routineRemindersList = reminders.filter(r => 
        r.schedule?.routineId && r.title?.includes('Routine Reminder:')
      );
      setRoutineReminders(routineRemindersList);
    } catch (error) {
      console.error('Error loading routine reminders:', error);
    }
  };

  const loadRoutines = async () => {
    try {
      const data = await routineService.getUserRoutines();
      setRoutines(data);
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  };

  // React to changes in tasks, projects, goals, routines, and reminders
  useEffect(() => {
    // This will trigger re-renders when tasks, projects, goals, routines, or reminders change
    // The calendar will automatically update with new task data
  }, [tasks, projects, goals, routines, routineReminders]);

  // Get upcoming tasks for reminders
  useEffect(() => {
    const now = new Date();
    const allItems = getAllCalendarItems();
    const upcoming = allItems.filter(item => {
      if (!item.dueDate || item.status === TaskStatus.DONE) return false;
      const itemDate = new Date(item.dueDate);
      const diffInHours = differenceInHours(itemDate, now);
      return diffInHours >= 0 && diffInHours <= 24; // Next 24 hours
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    setUpcomingTasks(upcoming);
  }, [tasks, projects, goals, routines, routineReminders, viewMode, currentDate, selectedDate]);

  // Convert goal milestones to Task-like format for calendar
  const getGoalMilestonesAsTasks = (): Task[] => {
    const calendarItems: Task[] = [];
    
    goals.forEach(goal => {
      goal.milestones?.forEach(milestone => {
        // Use targetDate (goal milestones use targetDate, not dueDate)
        const milestoneDate = milestone.targetDate;
        if (milestoneDate && milestone.status !== 'DONE' && milestone.status !== 'CANCELLED') {
          calendarItems.push({
            id: `goal_milestone_${milestone.id}`,
            title: milestone.title,
            description: milestone.description,
            status: milestone.status === 'DONE' ? TaskStatus.DONE : 
                   milestone.status === 'IN_PROGRESS' ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: milestoneDate,
            projectId: undefined,
            goalId: goal.id,
            assigneeId: undefined,
            createdBy: goal.userId,
            tags: ['goal', 'milestone', goal.category.toLowerCase()],
            order: milestone.order || 0,
            metadata: {
              isGoalMilestone: true,
              goalTitle: goal.title,
              milestoneId: milestone.id,
            },
            createdAt: milestone.createdAt,
            updatedAt: milestone.updatedAt,
            isDeleted: false,
          });
        }
      });
    });
    
    return calendarItems;
  };

  // Convert project milestones to Task-like format for calendar
  const getProjectMilestonesAsTasks = (): Task[] => {
    const calendarItems: Task[] = [];
    
    projects.forEach(project => {
      project.milestones?.forEach(milestone => {
        if (milestone.dueDate && milestone.status !== 'DONE' && milestone.status !== 'CANCELLED') {
          calendarItems.push({
            id: `project_milestone_${milestone.id}`,
            title: milestone.title,
            description: milestone.description,
            status: milestone.status === 'DONE' ? TaskStatus.DONE : 
                   milestone.status === 'IN_PROGRESS' ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: milestone.dueDate,
            projectId: project.id,
            goalId: undefined,
            assigneeId: undefined,
            createdBy: project.ownerId,
            tags: ['project', 'milestone', project.name.toLowerCase()],
            order: 0,
            metadata: {
              isProjectMilestone: true,
              projectName: project.name,
              milestoneId: milestone.id,
            },
            createdAt: milestone.createdAt,
            updatedAt: milestone.updatedAt,
            isDeleted: false,
          });
        }
      });
      
      // Also include project tasks that have due dates
      project.tasks?.forEach(projectTask => {
        if (projectTask.dueDate && projectTask.status !== 'DONE' && projectTask.status !== 'ARCHIVED') {
          calendarItems.push({
            id: `project_task_${projectTask.id}`,
            title: projectTask.title,
            description: projectTask.description,
            status: projectTask.status,
            priority: projectTask.priority,
            dueDate: projectTask.dueDate,
            projectId: project.id,
            goalId: undefined,
            assigneeId: projectTask.assigneeId,
            createdBy: project.ownerId,
            tags: ['project', 'task', project.name.toLowerCase()],
            order: 0,
            metadata: {
              isProjectTask: true,
              projectName: project.name,
              milestoneId: projectTask.milestoneId,
            },
            createdAt: projectTask.createdAt,
            updatedAt: projectTask.updatedAt,
            isDeleted: false,
          });
        }
      });
    });
    
    return calendarItems;
  };

  // Generate routine task instances for all days in the calendar view range
  const getRoutineTasksForCalendarRange = (startDate: Date, endDate: Date): Task[] => {
    const routineTasks: Task[] = [];
    const now = new Date();
    
    routines.forEach(routine => {
      if (!routine.enabled) return;
      
      const schedule = routine.schedule as any;
      const timeParts = schedule.time?.split(':') || ['0', '0'];
      const hour = parseInt(timeParts[0], 10);
      const minute = parseInt(timeParts[1], 10);
      
      routine.routineTasks.forEach(routineTask => {
        if (routine.frequency === 'DAILY') {
          // Generate instances for each day in the range
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const taskDate = new Date(currentDate);
            taskDate.setHours(hour, minute, 0, 0);
            
            // Check if task is completed today
            const isCompletedToday = routineTask.completed && routineTask.completedAt && 
              isSameDay(new Date(routineTask.completedAt), currentDate);
            
            const isUrgent = !isCompletedToday && taskDate < now;
            const taskStatus = isCompletedToday ? TaskStatus.DONE : TaskStatus.TODO;
            
            routineTasks.push({
              id: `routine_${routineTask.id}_${format(currentDate, 'yyyy-MM-dd')}`,
              title: routineTask.title,
              description: routineTask.description,
              status: taskStatus,
              priority: isUrgent ? TaskPriority.URGENT : TaskPriority.MEDIUM,
              dueDate: taskDate.toISOString(),
              dueTime: schedule.time,
              completedAt: isCompletedToday && routineTask.completedAt ? routineTask.completedAt : undefined,
              projectId: undefined,
              goalId: undefined,
              assigneeId: undefined,
              createdBy: routine.userId,
              tags: ['routine', routine.title.toLowerCase().replace(/\s+/g, '-')],
              order: routineTask.order,
              metadata: {
                routineId: routine.id,
                routineTaskId: routineTask.id,
                routineTitle: routine.title,
                isRoutineTask: true,
              },
              createdAt: routineTask.createdAt,
              updatedAt: routineTask.updatedAt,
              isDeleted: false,
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else if (routine.frequency === 'WEEKLY' && schedule.days && schedule.days.length > 0) {
          // Generate instances for each scheduled day in the range
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            if (schedule.days.includes(dayOfWeek)) {
              const taskDate = new Date(currentDate);
              taskDate.setHours(hour, minute, 0, 0);
              
              // Check if task is completed this week
              const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
              const isCompletedThisWeek = routineTask.completed && routineTask.completedAt && 
                new Date(routineTask.completedAt) >= weekStart;
              
              const isUrgent = !isCompletedThisWeek && taskDate < now;
              const taskStatus = isCompletedThisWeek ? TaskStatus.DONE : TaskStatus.TODO;
              
              routineTasks.push({
                id: `routine_${routineTask.id}_${format(currentDate, 'yyyy-MM-dd')}`,
                title: routineTask.title,
                description: routineTask.description,
                status: taskStatus,
                priority: isUrgent ? TaskPriority.URGENT : TaskPriority.MEDIUM,
                dueDate: taskDate.toISOString(),
                dueTime: schedule.time,
                completedAt: isCompletedThisWeek && routineTask.completedAt ? routineTask.completedAt : undefined,
                projectId: undefined,
                goalId: undefined,
                assigneeId: undefined,
                createdBy: routine.userId,
                tags: ['routine', routine.title.toLowerCase().replace(/\s+/g, '-')],
                order: routineTask.order,
                metadata: {
                  routineId: routine.id,
                  routineTaskId: routineTask.id,
                  routineTitle: routine.title,
                  isRoutineTask: true,
                  scheduledDay: dayOfWeek,
                },
                createdAt: routineTask.createdAt,
                updatedAt: routineTask.updatedAt,
                isDeleted: false,
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
        // For monthly and yearly, we can add similar logic if needed
      });
    });
    
    return routineTasks;
  };

  // Get routine reminders for a specific date range
  const getRoutineRemindersForDateRange = (startDate: Date, endDate: Date): Array<{ date: Date; reminder: Reminder }> => {
    const reminders: Array<{ date: Date; reminder: Reminder }> = [];
    
    routineReminders.forEach(reminder => {
      const schedule = reminder.schedule;
      if (!schedule?.time || !schedule?.routineId) return;
      
      // Calculate routine occurrence time
      const [routineHours, routineMinutes] = schedule.time.split(':').map(Number);
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        let routineOccurrence: Date | null = null;
        
        // Calculate when the routine occurs
        if (schedule.frequency === 'DAILY') {
          routineOccurrence = new Date(currentDate);
          routineOccurrence.setHours(routineHours, routineMinutes, 0, 0);
        } else if (schedule.frequency === 'WEEKLY' && schedule.days && schedule.days.length > 0) {
          const dayOfWeek = currentDate.getDay();
          if (schedule.days.includes(dayOfWeek)) {
            routineOccurrence = new Date(currentDate);
            routineOccurrence.setHours(routineHours, routineMinutes, 0, 0);
          }
        } else if (schedule.frequency === 'MONTHLY' && schedule.day) {
          if (currentDate.getDate() === schedule.day) {
            routineOccurrence = new Date(currentDate);
            routineOccurrence.setHours(routineHours, routineMinutes, 0, 0);
          }
        }
        
        if (routineOccurrence) {
          // Calculate reminder time (routine time minus reminderBefore)
          let reminderDate = new Date(routineOccurrence);
          
          if (schedule.reminderBefore) {
            const match = schedule.reminderBefore.match(/^(\d+)([hdw])$/);
            if (match) {
              const [, valueStr, unit] = match;
              const value = parseInt(valueStr, 10);
              
              if (unit === 'h') {
                reminderDate.setHours(reminderDate.getHours() - value);
              } else if (unit === 'd') {
                reminderDate.setDate(reminderDate.getDate() - value);
              } else if (unit === 'w') {
                reminderDate.setDate(reminderDate.getDate() - (value * 7));
              }
            }
          }
          
          // Only include if reminder date is in the range
          if (reminderDate >= startDate && reminderDate <= endDate) {
            reminders.push({ date: reminderDate, reminder });
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return reminders;
  };

  // Get all calendar items (tasks, routine tasks, goal milestones, project milestones)
  const getAllCalendarItems = (): Task[] => {
    // Filter out routine tasks from the tasks array (they're already included by backend, but we'll generate our own for calendar)
    const regularTasks = tasks.filter(task => !task.metadata?.isRoutineTask);
    
    // Get the date range for the current view
    let startDate: Date;
    let endDate: Date;
    
    if (viewMode === 'month') {
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
      // Extend to include full weeks
      const calendarStart = startOfWeek(startDate, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(endDate, { weekStartsOn: 0 });
      startDate = calendarStart;
      endDate = calendarEnd;
    } else if (viewMode === 'week') {
      startDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
      endDate = endOfWeek(selectedDate, { weekStartsOn: 0 });
    } else {
      // Day view
      startDate = selectedDate;
      endDate = selectedDate;
    }
    
    const routineTasks = getRoutineTasksForCalendarRange(startDate, endDate);
    const goalMilestones = getGoalMilestonesAsTasks();
    const projectMilestones = getProjectMilestonesAsTasks();
    
    return [...regularTasks, ...routineTasks, ...goalMilestones, ...projectMilestones];
  };

  // Get reminders for a specific date
  const getRemindersForDate = (date: Date): Array<{ date: Date; reminder: Reminder }> => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return getRoutineRemindersForDateRange(startDate, endDate);
  };

  const getTasksForDate = (date: Date) => {
    const allItems = getAllCalendarItems();
    return allItems.filter(item => {
      if (!item.dueDate) return false;
      const itemDate = new Date(item.dueDate);
      return isSameDay(itemDate, date);
    });
  };

  const getTasksForWeek = (startDate: Date) => {
    // Ensure we start from the beginning of the week (Sunday)
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
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
    // Ensure week starts on Sunday (0) for consistent 7-day layout
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

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

  useEffect(() => {
    console.log('selectedDate', selectedDate);
  }, [selectedDate])

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

    // Group days into weeks (7 days per week)
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

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

        {/* Calendar grid - Render by weeks to ensure 7 days per row */}
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
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
                    
                    {/* Reminder indicators */}
                    {(() => {
                      const dayReminders = getRemindersForDate(day);
                      if (dayReminders.length > 0) {
                        return (
                          <View style={styles.reminderIndicators}>
                            {dayReminders.map(({ reminder }) => (
                              <View
                                key={reminder.id}
                                style={[styles.reminderIndicator, { backgroundColor: '#FFA726' }]}
                              >
                                <Text style={[styles.reminderIndicatorText, { color: 'white' }]}>
                                  🔔
                                </Text>
                              </View>
                            ))}
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };



  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
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
                  {getDayName(day, 'short')}
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

    // Create time slots for the day (full 24 hours: 0-23)
    interface TimeSlot {
      hour: number;
      time: string;
      displayTime: string;
      tasks: Task[];
      reminders?: Array<{ reminder: Reminder; date: Date }>;
    }

    const timeSlots: TimeSlot[] = [];
    for (let hour = 0; hour <= 23; hour++) {
      const displayTime = hour === 0 ? '12:00 AM' : 
                         hour < 12 ? `${hour}:00 AM` : 
                         hour === 12 ? '12:00 PM' : 
                         `${hour - 12}:00 PM`;
      timeSlots.push({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        displayTime,
        tasks: []
      });
    }

    // Group tasks by time slots
    dayTasks.forEach(task => {
      let taskHour = 0; // Default to midnight if no time specified

      if (task.dueTime) {
        // Parse dueTime (HH:mm format)
        const [hours] = task.dueTime.split(':');
        taskHour = parseInt(hours, 10);
      } else if (task.dueDate) {
        // Fallback to dueDate time
        const taskDate = new Date(task.dueDate);
        taskHour = taskDate.getHours();
      }

      // Find the appropriate time slot (0-23)
      const slotIndex = Math.max(0, Math.min(timeSlots.length - 1, taskHour));
      timeSlots[slotIndex].tasks.push(task);
    });

    // Group reminders by time slots (reminders are shown as visual indicators, not tasks)
    dayReminders.forEach(({ reminder, date }) => {
      const reminderHour = date.getHours();
      const slotIndex = Math.max(0, Math.min(timeSlots.length - 1, reminderHour));
      // Store reminders separately - we'll render them differently
      if (!timeSlots[slotIndex].reminders) {
        timeSlots[slotIndex].reminders = [];
      }
      timeSlots[slotIndex].reminders!.push({ reminder, date });
    });

    // Sort tasks within each time slot by priority
    timeSlots.forEach(slot => {
      slot.tasks.sort((a, b) => {
        const priorityOrder = { [TaskPriority.URGENT]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
    });

    return (
      <View style={styles.dayView}>
        <Text variant="headlineSmall" style={[styles.dayViewTitle, { color: theme.colors.text }]}>
          {getDayName(selectedDate, 'full')}, {format(selectedDate, 'MMMM d, yyyy')}
        </Text>

        <ScrollView style={styles.timeSlotsContainer} showsVerticalScrollIndicator={false}>
          {timeSlots.map((slot, index) => (
            <View key={slot.time} style={styles.timeSlot}>
              <View style={styles.timeSlotHeader}>
                <Text variant="bodyMedium" style={[styles.timeSlotTime, { color: theme.colors.textSecondary }]}>
                  {slot.displayTime}
                </Text>
                <View style={[styles.timeSlotLine, { backgroundColor: theme.colors.outline }]} />
              </View>

              <View style={styles.timeSlotContent}>
                {/* Show reminders first (as visual indicators) */}
                {slot.reminders && slot.reminders.length > 0 && (
                  <View style={styles.reminderBadgesContainer}>
                    {slot.reminders.map(({ reminder, date }) => {
                      const routineTitle = reminder.title.replace('Routine Reminder: ', '');
                      return (
                        <TouchableOpacity
                          key={reminder.id}
                          style={[styles.reminderBadge, { backgroundColor: '#FFA72620', borderColor: '#FFA726' }]}
                          onPress={() => navigation.getParent()?.navigate('Routines')}
                        >
                          <Text style={[styles.reminderBadgeIcon, { color: '#FFA726' }]}>🔔</Text>
                          <Text variant="bodySmall" style={[styles.reminderBadgeText, { color: theme.colors.text }]} numberOfLines={1}>
                            {routineTitle}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                
                {slot.tasks.length === 0 ? (
                  <TouchableOpacity
                    style={[styles.emptyTimeSlot, { backgroundColor: theme.colors.surfaceVariant }]}
                    onPress={() => {
                      // Create a date with the selected date and the slot's hour
                      const taskDate = new Date(selectedDate);
                      taskDate.setHours(slot.hour, 0, 0, 0);

                      navigation.getParent()?.navigate('TaskCreate', {
                        dueDate: taskDate.toISOString(),
                        dueTime: slot.time
                      });
                    }}
                  >
                    <IconButton
                      icon="plus"
                      size={16}
                      iconColor={theme.colors.primary}
                      style={styles.addTaskIcon}
                    />
                    <Text variant="bodySmall" style={[styles.emptyTimeSlotText, { color: theme.colors.primary }]}>
                      {t('tasks.addTask')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  slot.tasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={[
                        styles.timeSlotTask,
                        {
                          backgroundColor: getPriorityColor(task.priority) + '20',
                          borderLeftColor: getPriorityColor(task.priority),
                        }
                      ]}
                      onPress={() => handleTaskPress(task)}
                    >
                      <View style={styles.timeSlotTaskContent}>
                        <Text variant="bodyMedium" style={[styles.timeSlotTaskTitle, { color: theme.colors.text }]} numberOfLines={1}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text variant="bodySmall" style={[styles.timeSlotTaskDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                            {task.description}
                          </Text>
                        )}
                        <View style={styles.timeSlotTaskBadges}>
                          <View style={[styles.timeSlotTaskPriority, { backgroundColor: getPriorityColor(task.priority) }]} />
                          <Text variant="bodySmall" style={[styles.timeSlotTaskStatus, { color: getStatusColor(task.status) }]}>
                            {t(`tasks.status_options.${task.status.toLowerCase()}`)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          ))}
        </ScrollView>
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
    const selectedReminders = getRemindersForDate(selectedDate);

    if (selectedTasks.length === 0 && selectedReminders.length === 0) return null;

    return (
      <Card style={[styles.selectedDateCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.selectedDateTitle, { color: theme.colors.text }]}>
            {format(selectedDate, 'MMM d')} - {selectedTasks.length} {t('calendar.tasks')}
            {selectedReminders.length > 0 && `, ${selectedReminders.length} ${t('calendar.reminders') || 'reminders'}`}
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
            {selectedReminders.map(({ reminder, date }) => {
              const routineTitle = reminder.title.replace('Routine Reminder: ', '');
              return (
                <TouchableOpacity
                  key={reminder.id}
                  style={[styles.selectedTaskItem, { backgroundColor: '#FFA72620', borderColor: '#FFA726', borderWidth: 1 }]}
                  onPress={() => navigation.getParent()?.navigate('Routines')}
                >
                  <View style={[styles.selectedTaskIndicator, { backgroundColor: '#FFA726' }]} />
                  <Text variant="bodySmall" style={[styles.selectedTaskTitle, { color: theme.colors.text }]}>
                    🔔 {routineTitle}
                  </Text>
                  <Text variant="bodySmall" style={[styles.selectedTaskTime, { color: theme.colors.textSecondary }]}>
                    {format(date, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
                  {t('tasks.priority')}
                </Text>
                <Chip
                  mode="outlined"
                  style={[styles.taskDetailChip, { borderColor: getPriorityColor(selectedTask.priority) }]}
                  textStyle={{ color: getPriorityColor(selectedTask.priority) }}
                >
                  {t(`tasks.priority_options.${selectedTask.priority.toLowerCase()}`)}
                </Chip>
              </View>

              <View style={styles.taskDetailRow}>
                <Text variant="bodyMedium" style={[styles.taskDetailLabel, { color: theme.colors.textSecondary }]}>
                  {t('tasks.status')}
                </Text>
                <Chip
                  mode="outlined"
                  style={[styles.taskDetailChip, { borderColor: getStatusColor(selectedTask.status) }]}
                  textStyle={{ color: getStatusColor(selectedTask.status) }}
                >
                  {t(`tasks.status_options.${selectedTask.status.toLowerCase()}`)}
                </Chip>
              </View>

              {selectedTask.dueDate && (
                <View style={styles.taskDetailRow}>
                  <Text variant="bodyMedium" style={[styles.taskDetailLabel, { color: theme.colors.textSecondary }]}>
                    {t('tasks.dueDate')}
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
                  {selectedTask.status === TaskStatus.DONE ? t('tasks.markIncomplete') : t('tasks.markComplete')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.taskActionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowTaskModal(false);
                  navigation.getParent()?.navigate('TaskEdit', { taskId: selectedTask.id });
                }}
              >
                <Text style={[styles.taskActionText, { color: 'white' }]}>
                  {t('tasks.edit')}
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
                ? `${format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 0 }), 'MMM d')}`
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
        onPress={() => {
          navigation.getParent()?.navigate('TaskCreate')

          navigation.getParent()?.navigate('TaskCreate', {
            dueDate: selectedDate.toISOString(),
          });

        }
        }

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
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
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
    flex: 1, // Use flex: 1 instead of fixed width
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
  },
  // weekDayHeader: {
  //   width: dayWidth,
  //   alignItems: 'center',
  //   paddingVertical: 8,
  // },
  weekDayText: {
    fontWeight: '500',
    opacity: 0.7,
  },
  calendarGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    flex: 1, // Use flex: 1 to evenly distribute space
    height: 80,
    padding: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
    justifyContent: 'space-between',
  },
  // dayCell: {
  //   width: dayWidth,
  //   height: 80,
  //   padding: 4,
  //   paddingVertical: 8,

  //   borderWidth: 1,
  //   borderColor: theme.colors.surfaceVariant,
  //   justifyContent: 'space-between',
  // },
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
    lineHeight: 12

  },
  priorityChipContainer: {
    height: 28,
  },
  statusChip: {
    fontSize: 10,
    lineHeight: 12

  },
  statusChipContainer: {
    height: 28,
  },
  taskTimeContainer: {
    marginTop: 8,
    height: 26,
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

  // Time Slot Styles (Google Calendar-like)
  timeSlotsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timeSlot: {
    minHeight: 60,
    marginBottom: 8,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeSlotTime: {
    fontSize: 12,
    fontWeight: '500',
    width: 60,
    textAlign: 'right',
    marginRight: 12,
  },
  timeSlotLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  timeSlotContent: {
    marginLeft: 72, // Align with time labels
    minHeight: 40,
  },
  emptyTimeSlot: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  emptyTimeSlotText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addTaskIcon: {
    margin: 0,
    padding: 0,
  },
  timeSlotTask: {
    marginBottom: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeSlotTaskContent: {
    flex: 1,
  },
  timeSlotTaskTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  timeSlotTaskDescription: {
    marginBottom: 8,
    lineHeight: 16,
  },
  timeSlotTaskBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeSlotTaskPriority: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeSlotTaskStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
  reminderIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    marginTop: 2,
  },
  reminderIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderIndicatorText: {
    fontSize: 6,
  },
  reminderBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  reminderBadgeIcon: {
    fontSize: 12,
  },
  reminderBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
