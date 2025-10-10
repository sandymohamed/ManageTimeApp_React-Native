import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, TextInput, FlatList, Animated, LayoutAnimation } from 'react-native';
import { Text, FAB, IconButton, Chip, Card, useTheme } from 'react-native-paper';

let DraggableFlatList: any = null;

try {
  const DraggableFlatListModule = require('react-native-draggable-flatlist');
  DraggableFlatList = DraggableFlatListModule.default;
} catch (error) {
  console.warn('Drag & drop not available');
}

import { useTranslation } from 'react-i18next';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Task, TaskStatus, TaskPriority, TaskFilter } from '@/types/task';
import { useTaskStore } from '@/store/taskStore';
import { showDeleteConfirmation } from '@/components/ConfirmationDialog';

interface TasksScreenProps {
  navigation: any;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const {
    filteredTasks,
    isLoading,
    error,
    filter,
    searchQuery,
    fetchTasks,
    refreshTasks,
    setFilter,
    setSearchQuery,
    clearFilters,
    completeTask,
    deleteTask,
    updateTaskOrder,
  } = useTaskStore();

  const [searchVisible, setSearchVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [useFallback, setUseFallback] = useState(true); // Start with fallback
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Sync local tasks with store tasks
  useEffect(() => {

    setLocalTasks(filteredTasks);
  }, [filteredTasks]);



  // Test drag & drop availability
  useEffect(() => {
    if (DraggableFlatList) {
      // Test if it works properly
      setTimeout(() => {
        setUseFallback(false);
      }, 1000);
    }
  }, []);

  const handleRefresh = async () => {
    await refreshTasks();
  };

  const handleCreateTask = () => {
    navigation.navigate('TaskCreate');
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const handleCompleteTask = async (task: Task) => {
    try {
      await completeTask(task.id);
      showSuccess(t('tasks.completedSuccessfully', { title: task.title }));
    } catch (error) {
      showError(t('tasks.completeFailed', { title: task.title }));
    }
  };

  const handleDeleteTask = async (task: Task) => {
    showDeleteConfirmation(
      task.title,
      async () => {
        try {
          await deleteTask(task.id);
          showSuccess(t('tasks.deletedSuccessfully', { title: task.title }));
        } catch (error) {
          showError(t('tasks.deleteFailed', { title: task.title }));
        }
      }
    );
  };

  const handleEditTask = (task: Task) => {
    navigation.navigate('TaskEdit', { taskId: task.id });
  };

  const handleFilterChange = (key: keyof TaskFilter, value: any) => {
    setFilter({
      ...filter,
      [key]: value,
    });
  };

  // SIMPLIFIED DRAG HANDLER - More reliable
  const handleDragEnd = async ({ data }: { data: Task[] }) => {
    try {
      if (!data || !Array.isArray(data)) {
        console.warn('Invalid drag data');
        return;
      }

      // Update local state immediately for smooth UX
      setLocalTasks(data);

      // Then update the store
      await updateTaskOrder(data);
      showSuccess(t('tasks.reorderedSuccessfully'));
    } catch (error) {
      showError(t('tasks.reorderFailed'));
      // Revert to original order
      setLocalTasks(filteredTasks);
    }
  };

  // MANUAL REORDERING - More reliable alternative
  const moveTask = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newTasks = [...localTasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, movedTask);

    // Update local state immediately
    setLocalTasks(newTasks);

    try {
      // Update store
      await updateTaskOrder(newTasks);
      showSuccess(t('tasks.reorderedSuccessfully'));
    } catch (error) {
      // Revert on error
      setLocalTasks(filteredTasks);
      showError(t('tasks.reorderFailed'));
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'checkbox-blank-circle-outline';
      case TaskStatus.IN_PROGRESS: return 'progress-clock';
      case TaskStatus.DONE: return 'check-circle';
      case TaskStatus.ARCHIVED: return 'archive-outline';
      default: return 'help-circle';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return theme.colors.urgent || '#dc2626';
      case TaskPriority.HIGH: return theme.colors.high || '#ea580c';
      case TaskPriority.MEDIUM: return theme.colors.medium || '#d97706';
      case TaskPriority.LOW: return theme.colors.low || '#16a34a';
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return theme.colors.completed || '#16a34a';
      case TaskStatus.IN_PROGRESS: return theme.colors.inProgress || '#2563eb';
      case TaskStatus.ARCHIVED: return theme.colors.archived || '#6b7280';
      default: return theme.colors.pending || '#d97706';
    }
  };

  // SIMPLIFIED TASK RENDER - More reliable
  const renderTask = ({ item: task, drag, isActive }: { item: Task; drag?: () => void; isActive?: boolean }) => {
    return (
      <Animated.View
        style={[
          styles.taskCardContainer,
          isActive && styles.draggingCard,
        ]}
      >
        <Card style={[styles.taskCard, { backgroundColor: theme.colors.card }]}>
          <Card.Content style={styles.taskContent}>
            {/* Main Content */}
            <View style={styles.mainContentRow}>
              {/* Status */}
              <TouchableOpacity
                onPress={() => handleCompleteTask(task)}
                style={styles.statusContainer}
              >
                <IconButton
                  icon={getStatusIcon(task.status)}
                  size={22}
                  iconColor={getStatusColor(task.status)}
                />sss
              </TouchableOpacity>

              {/* Text Content */}
              <TouchableOpacity
                onPress={() => handleTaskPress(task)}
                style={styles.textContent}
                activeOpacity={0.7}
              >
                <Text variant="titleMedium" style={[styles.taskTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {task.title}
                </Text>
                {task.description && (
                  <Text variant="bodySmall" style={[styles.taskDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {task.description}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Actions */}
              <View style={styles.compactActions}>
                <IconButton
                  icon="pencil"
                  size={18}
                  iconColor={theme.colors.primary}
                  onPress={() => handleEditTask(task)}
                  style={styles.actionButton}
                />
                <IconButton
                  icon="delete"
                  size={18}
                  iconColor={theme.colors.error}
                  onPress={() => handleDeleteTask(task)}
                  style={styles.actionButton}
                />
              </View>

              {/* Drag Handle - Only show if drag & drop is enabled */}
              {!useFallback && drag && (
                <TouchableOpacity
                  onPressIn={drag}
                  style={[styles.dragHandle, isActive && styles.activeDragHandle]}
                  hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
                >

                  <View style={styles.dragDotsContainer}>
                    <View style={styles.dragDots}>
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                    </View>
                    <View style={styles.dragDots}>
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                    </View>
                    <View style={styles.dragDots}>
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                      <View style={[styles.dragDot, { backgroundColor: theme.colors.textSecondary }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer */}
            <View style={styles.taskFooter}>
              <Chip
                mode="outlined"
                style={[styles.priorityChip, {
                  borderColor: getPriorityColor(task.priority),
                  backgroundColor: `${getPriorityColor(task.priority)}15`
                }]}
                textStyle={[styles.chipText, { color: getPriorityColor(task.priority) }]}
              >
                {task.priority.toLowerCase()}
              </Chip>

              {task.dueDate && (
                <Chip
                  mode="outlined"
                  style={[styles.dateChip, {
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surfaceVariant
                  }]}
                  textStyle={[styles.chipText, { color: theme.colors.textSecondary }]}
                >
                  {new Date(task.dueDate).toLocaleDateString()}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  // FALLBACK RENDERER - No drag & drop
  const renderFallbackTask = ({ item }: { item: Task }) => {
    return renderTask({ item });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton
        icon="clipboard-text-outline"
        size={64}
        iconColor={theme.colors.textSecondary}
      />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
        {t('tasks.noTasks')}
      </Text>
    </View>
  );

  const renderQuickFilters = () => {
    const statusOptions = [
      { status: TaskStatus.TODO, label: 'Todo', icon: 'checkbox-blank-circle-outline', color: theme.colors.primary },
      { status: TaskStatus.IN_PROGRESS, label: 'Progress', icon: 'progress-clock', color: theme.colors.info },
      { status: TaskStatus.DONE, label: 'Done', icon: 'check-circle', color: theme.colors.success },
    ];

    const isFilterActive = filter.status && filter.status.length > 0;

    return (
      <View style={styles.quickFilters}>
        {isFilterActive && (
          <TouchableOpacity
            style={[styles.filterChip, styles.clearFilterChip]}
            onPress={clearFilters}
          >
            <IconButton icon="close" size={16} iconColor={theme.colors.error} />
            <Text style={[styles.filterText, { color: theme.colors.error }]}>Clear All</Text>
          </TouchableOpacity>
        )}

        {statusOptions.map((option) => {
          const isActive = filter.status?.includes(option.status);
          return (
            <TouchableOpacity
              key={option.status}
              style={[styles.filterChip, isActive && styles.activeFilterChip]}
              onPress={() => {
                if (isActive) {
                  const newStatus = filter.status?.filter(s => s !== option.status) || [];
                  handleFilterChange('status', newStatus.length > 0 ? newStatus : undefined);
                } else {
                  const newStatus = [...(filter.status || []), option.status];
                  handleFilterChange('status', newStatus);
                }
              }}
            >
              <IconButton icon={option.icon} size={16} iconColor={isActive ? theme.colors.primary : option.color} />
              <Text style={[styles.filterText, { color: isActive ? theme.colors.primary : option.color }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTop}>
          <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('navigation.myTasks')}
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="magnify"
              size={24}
              iconColor={theme.colors.primary}
              onPress={() => setSearchVisible(!searchVisible)}
            />
            <IconButton
              icon="filter-variant"
              size={24}
              iconColor={theme.colors.primary}
              onPress={() => setFilterVisible(!filterVisible)}
            />
          </View>
        </View>

        {searchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, {
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.text,
                borderColor: theme.colors.outline
              }]}
              placeholder={t('common.search')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <IconButton
              icon="close"
              size={20}
              iconColor={theme.colors.textSecondary}
              onPress={() => setSearchVisible(false)}
            />
          </View>
        )}
      </View>

      {/* Quick Filters */}
      {filterVisible && renderQuickFilters()}

      {/* Task List - Use Fallback if drag & drop is problematic */}
      {useFallback ? (
        <FlatList
          data={localTasks}
          renderItem={renderFallbackTask}
          keyExtractor={(item: Task) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {DraggableFlatList ? (
            <DraggableFlatList
              data={localTasks}
              renderItem={renderTask}
              keyExtractor={(item: Task) => item.id}
              onDragEnd={handleDragEnd}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              activationDistance={10}
              autoscrollThreshold={100}
              autoscrollSpeed={500}
            />
          ) : (
            <FlatList
              data={localTasks}
              renderItem={renderFallbackTask}
              keyExtractor={(item: Task) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateTask}
        label={t('tasks.addTask')}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  clearFilterChip: {
    backgroundColor: theme.colors.errorContainer,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  listContent: {
    padding: 12,
    flexGrow: 1,
  },
  taskCardContainer: {
    marginBottom: 8,
  },
  taskCard: {
    borderRadius: 12,
  },
  draggingCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  taskContent: {
    padding: 16,
  },
  mainContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusContainer: {
    marginRight: 8,
  },
  textContent: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 13,
    lineHeight: 16,
  },
  compactActions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
    marginHorizontal: 2,
  },
  dragHandle: {
    padding: 8,
    justifyContent: 'center',
  },
  activeDragHandle: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 6,
  },
  dragDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
    height: 16,
  },
  dragDots: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 16,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  taskFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    height: 28,
  },
  dateChip: {
    height: 28,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});