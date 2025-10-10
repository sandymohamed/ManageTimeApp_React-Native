import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, TextInput, FlatList, Animated, LayoutAnimation } from 'react-native';
import { Text, FAB, IconButton, Chip, Card, useTheme } from 'react-native-paper';

// Use a more reliable drag & drop library or implement custom solution
let DraggableFlatList: any = null;

try {
  const DraggableFlatListModule = require('react-native-draggable-flatlist');
  DraggableFlatList = DraggableFlatListModule.default;
} catch (error) {
  console.warn('Drag & drop not available');
}

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
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
    sortBy,
    sortOrder,
    fetchTasks,
    refreshTasks,
    setFilter,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    clearFilters,
    resetToCustomOrder,
    deleteTask,
    completeTask,
    uncompleteTask,
    updateTaskOrder,
    setCurrentTask,
  } = useTaskStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  const handleCreateTask = () => {
    navigation.navigate('TaskCreate');
  };

  const handleTaskPress = (task: Task) => {
    setCurrentTask(task);
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    navigation.navigate('TaskEdit', { taskId: task.id });
  };

  const handleDeleteTask = async (task: Task) => {
    showDeleteConfirmation(
      task.title,
      async () => {
        try {
          await deleteTask(task.id);
          showSuccess(t('tasks.deletedSuccessfully', { title: task.title }));
        } catch (error) {
          console.error('Failed to delete task:', error);
          showError(t('tasks.deleteFailed', { title: task.title }));
        }
      }
    );
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === TaskStatus.DONE) {
        await uncompleteTask(task.id);
        showSuccess(t('tasks.uncompletedSuccessfully', { title: task.title }));
      } else {
        await completeTask(task.id);
        showSuccess(t('tasks.completedSuccessfully', { title: task.title }));
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      showError(t('tasks.completeFailed', { title: task.title }));
    }
  }
  const handleReorder = async (newTasks: Task[]) => {
    try {
      await updateTaskOrder(newTasks);
      showSuccess(t('tasks.reorderedSuccessfully'));
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      showError(t('tasks.reorderFailed'));
    }
  };

  const handleDragBegin = () => {
    setDragging(true);
  };

  const handleDragEnd = () => {
    setDragging(false);
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

  const getDueDateText = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('tasks.dueToday');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('tasks.dueTomorrow');
    } else {
      return t('tasks.dueOn', { date: date.toLocaleDateString() });
    }
  };

  const renderTaskItem = ({ item: task, drag, isActive }: { item: Task; drag: () => void; isActive: boolean }) => (
    <TouchableOpacity
      onLongPress={drag}
      disabled={isActive}
      style={[
        styles.taskCard,
        isActive && styles.draggingCard,
      ]}
    >
      <Card style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.taskContent}>
          <TouchableOpacity
            style={styles.taskTouchable}
            onPress={() => handleTaskPress(task)}
          >
            <View style={styles.taskHeader}>
              <View style={styles.taskInfo}>
                <TouchableOpacity
                  style={[styles.dragHandle, isActive && styles.activeDragHandle]}
                  onPress={drag}
                  disabled={isActive}
                >
                  <IconButton
                    icon="drag-horizontal"
                    size={16}
                    iconColor={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
                <View style={styles.taskText}>
                  <Text variant="titleMedium" style={[styles.taskTitle, { color: theme.colors.text }]}>
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text variant="bodyMedium" style={[styles.taskDescription, { color: theme.colors.text }]}>
                      {task.description}
                    </Text>
                  )}
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    onPress={() => handleToggleComplete(task)}
                    style={styles.taskActionButton}
                  >
                    <IconButton
                      icon={task.status === TaskStatus.DONE ? 'check-circle' : 'check-circle-outline'}
                      size={24}
                      iconColor={task.status === TaskStatus.DONE ? '#4CAF50' : theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEditTask(task)}
                    style={styles.taskActionButton}
                  >
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task)}
                    style={styles.taskActionButton}
                  >
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={theme.colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.taskFooter}>
              <Chip
                mode="outlined"
                textStyle={[styles.priorityChip, { color: getPriorityColor(task.priority) }]}
                style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority) }]}
              >
                {t(`task.priority.${task.priority.toLowerCase()}`)}
              </Chip>
              <Chip
                mode="outlined"
                textStyle={[styles.statusChip, { color: getStatusColor(task.status) }]}
                style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
              >
                {t(`task.status.${task.status.toLowerCase()}`)}
              </Chip>
              {task.dueDate && (
                <Chip
                  mode="outlined"
                  textStyle={[styles.dateChip, { color: theme.colors.text }]}
                  style={[styles.dateChip, { borderColor: theme.colors.outline }]}
                >
                  {getDueDateText(task.dueDate)}
                </Chip>
              )}
            </View>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {t('tasks.noTasks')}
      </Text>
      <Text variant="bodyMedium" style={[styles.emptyMessage, { color: theme.colors.text }]}>
        {t('tasks.noTasksDescription')}
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text variant="headlineSmall" style={[styles.errorTitle, { color: theme.colors.error }]}>
        {t('common.error')}
      </Text>
      <Text variant="bodyMedium" style={[styles.errorMessage, { color: theme.colors.text }]}>
        {error}
      </Text>
      <TouchableOpacity
        onPress={handleRefresh}
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
          {t('common.retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return renderErrorState();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTop}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('tasks.myTasks')}
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="magnify"
              size={24}
              iconColor={theme.colors.text}
              onPress={() => setSearchVisible(!searchVisible)}
            />
            <IconButton
              icon="filter"
              size={24}
              iconColor={theme.colors.text}
              onPress={() => setFilterVisible(!filterVisible)}
            />
            <IconButton
              icon="sort"
              size={24}
              iconColor={theme.colors.text}
              onPress={() => setSortMenuVisible(!sortMenuVisible)}
            />
          </View>
        </View>

        {/* Search Bar */}
        {searchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              placeholder={t('common.search')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.colors.text, borderColor: theme.colors.outline }]}
              left={<TextInput.Icon icon="magnify" />}
              right={<TextInput.Icon icon="close" onPress={() => setSearchVisible(false)} />}
            />
          </View>
        )}

        {/* Quick Filters */}
        {filterVisible && (
          <View style={styles.quickFilters}>
            <TouchableOpacity
              style={[styles.filterChip, filter.status?.includes(TaskStatus.TODO) && styles.activeFilterChip]}
              onPress={() => {
                const newStatus = filter.status?.includes(TaskStatus.TODO)
                  ? filter.status.filter(s => s !== TaskStatus.TODO)
                  : [...(filter.status || []), TaskStatus.TODO];
                setFilter({ ...filter, status: newStatus });
              }}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('task.status.todo')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter.status?.includes(TaskStatus.IN_PROGRESS) && styles.activeFilterChip]}
              onPress={() => {
                const newStatus = filter.status?.includes(TaskStatus.IN_PROGRESS)
                  ? filter.status.filter(s => s !== TaskStatus.IN_PROGRESS)
                  : [...(filter.status || []), TaskStatus.IN_PROGRESS];
                setFilter({ ...filter, status: newStatus });
              }}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('task.status.inProgress')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter.status?.includes(TaskStatus.DONE) && styles.activeFilterChip]}
              onPress={() => {
                const newStatus = filter.status?.includes(TaskStatus.DONE)
                  ? filter.status.filter(s => s !== TaskStatus.DONE)
                  : [...(filter.status || []), TaskStatus.DONE];
                setFilter({ ...filter, status: newStatus });
              }}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('task.status.done')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter.priority?.includes(TaskPriority.URGENT) && styles.activeFilterChip]}
              onPress={() => {
                const newPriority = filter.priority?.includes(TaskPriority.URGENT)
                  ? filter.priority.filter(p => p !== TaskPriority.URGENT)
                  : [...(filter.priority || []), TaskPriority.URGENT];
                setFilter({ ...filter, priority: newPriority });
              }}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('task.priority.urgent')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, (filter.status?.length || 0) > 0 && styles.clearFilterChip]}
              onPress={clearFilters}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('common.clear')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sort Menu */}
        {sortMenuVisible && (
          <View style={styles.quickFilters}>
            <TouchableOpacity
              style={[styles.filterChip, sortBy === 'createdAt' && styles.activeFilterChip]}
              onPress={() => setSortBy('createdAt')}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('tasks.sort.createdAt')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, sortBy === 'dueDate' && styles.activeFilterChip]}
              onPress={() => setSortBy('dueDate')}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('tasks.sort.dueDate')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, sortBy === 'priority' && styles.activeFilterChip]}
              onPress={() => setSortBy('priority')}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('tasks.sort.priority')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, sortBy === 'title' && styles.activeFilterChip]}
              onPress={() => setSortBy('title')}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('tasks.sort.title')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, sortBy === 'order' && styles.activeFilterChip]}
              onPress={resetToCustomOrder}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('tasks.sort.custom')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, sortOrder === 'asc' && styles.activeFilterChip]}
              onPress={() => setSortOrder('asc')}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('tasks.sort.ascending')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, sortOrder === 'desc' && styles.activeFilterChip]}
              onPress={() => setSortOrder('desc')}
            >
              <Text style={[styles.filterText, { color: theme.colors.text }]}>
                {t('tasks.sort.descending')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Drag Instructions */}
        {!dragging && (
          <View style={[styles.dragInstructions, { backgroundColor: theme.colors.surfaceVariant }]}>
            <IconButton
              icon="drag-horizontal"
              size={16}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodySmall" style={[styles.dragInstructionsText, { color: theme.colors.onSurfaceVariant }]}>
              {t('tasks.dragToReorder')}
            </Text>
          </View>
        )}
      </View>

      {/* Task List */}
      {isLoading ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={[styles.emptyMessage, { color: theme.colors.text }]}>
            {t('common.loading')}
          </Text>
        </View>
      ) : filteredTasks.length === 0 ? (
        renderEmptyState()
      ) : DraggableFlatList ? (
        <DraggableFlatList
          data={filteredTasks}
          onDragBegin={handleDragBegin}
          onDragEnd={handleDragEnd}
          onDragEnd={({ data }) => handleReorder(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderTaskItem({ item, drag: () => {}, isActive: false })}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
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
    elevation: 2,
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
    paddingHorizontal: 8,
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
  dragInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
  },
  dragInstructionsText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  taskCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  draggingCard: {
    elevation: 12,
    opacity: 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 1000,
  },
  taskTouchable: {
    flex: 1,
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskText: {
    flex: 1,
    marginLeft: 8,
  },
  taskTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    lineHeight: 18,
  },
  taskActions: {
    flexDirection: 'row',
  },
  taskActionButton: {
    padding: 4,
  },
  dragHandle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeDragHandle: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  taskFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    height: 33,
    lineHeight: .9,
  },
  statusChip: {
    height: 33,
    lineHeight: .9,
  },
  dateChip: {
    height: 33,
    lineHeight: .5,
    fontSize: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
  },
  retryButtonText: {
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});