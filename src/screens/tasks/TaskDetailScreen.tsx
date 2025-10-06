import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Chip, IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useTaskStore } from '@/store/taskStore';
import { TaskPriority, TaskStatus } from '@/types/task';
import { LoadingScreen } from '@/components/LoadingScreen';
import { showDeleteConfirmation } from '@/components/ConfirmationDialog';

interface TaskDetailScreenProps {
  navigation: any;
  route: {
    params: {
      taskId: string;
    };
  };
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const { tasks, completeTask, deleteTask, isLoading } = useTaskStore();
  const { taskId } = route.params;

  const task = tasks.find(t => t.id === taskId);

  const handleComplete = async () => {
    try {
      await completeTask(taskId);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to complete task');
    }
  };

  const handleDelete = () => {
    if (!task) return;
    
    showDeleteConfirmation(
      task.title,
      async () => {
        try {
          await deleteTask(taskId);
          navigation.goBack();
        } catch (error) {
          Alert.alert(t('common.error'), 'Failed to delete task');
        }
      }
    );
  };

  const handleEdit = () => {
    navigation.navigate('TaskEdit', { taskId });
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'alert';
      case TaskPriority.HIGH: return 'arrow-up';
      case TaskPriority.MEDIUM: return 'minus';
      case TaskPriority.LOW: return 'arrow-down';
      default: return 'flag';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return theme.colors.urgent;
      case TaskPriority.HIGH: return theme.colors.high;
      case TaskPriority.MEDIUM: return theme.colors.medium;
      case TaskPriority.LOW: return theme.colors.low;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'circle-outline';
      case TaskStatus.IN_PROGRESS: return 'clock-outline';
      case TaskStatus.DONE: return 'check-circle';
      case TaskStatus.CANCELLED: return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return theme.colors.completed;
      case TaskStatus.IN_PROGRESS: return theme.colors.inProgress;
      case TaskStatus.CANCELLED: return theme.colors.cancelled;
      default: return theme.colors.pending;
    }
  };

  const styles = createStyles(theme);

  if (isLoading) {
    return <LoadingScreen message="Loading task..." />;
  }

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <IconButton
            icon="alert-circle"
            size={64}
            iconColor={theme.colors.error}
          />
          <Text variant="headlineSmall" style={[styles.errorTitle, { color: theme.colors.error }]}>
            Task not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.text}
            onPress={() => navigation.goBack()}
          />
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('tasks.taskDetails')}
          </Text>
          <IconButton
            icon="pencil"
            size={24}
            iconColor={theme.colors.primary}
            onPress={handleEdit}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Task Title */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <View style={styles.titleRow}>
              <IconButton
                icon={getStatusIcon(task.status)}
                size={24}
                iconColor={getStatusColor(task.status)}
                onPress={handleComplete}
              />
              <Text variant="headlineSmall" style={[styles.taskTitle, { color: theme.colors.text }]}>
                {task.title}
              </Text>
            </View>
            {task.description && (
              <Text variant="bodyLarge" style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
                {task.description}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Task Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('tasks.taskInfo')}
            </Text>
            
            <View style={styles.infoRow}>
              <IconButton icon="flag" size={20} iconColor={getPriorityColor(task.priority)} />
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                {t('tasks.priority')}:
              </Text>
              <Chip
                icon={getPriorityIcon(task.priority)}
                style={[styles.infoChip, { backgroundColor: getPriorityColor(task.priority) + '20' }]}
                textStyle={{ color: getPriorityColor(task.priority) }}
              >
                {task.priority}
              </Chip>
            </View>

            <View style={styles.infoRow}>
              <IconButton icon="circle" size={20} iconColor={getStatusColor(task.status)} />
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                {t('tasks.status')}:
              </Text>
              <Chip
                icon={getStatusIcon(task.status)}
                style={[styles.infoChip, { backgroundColor: getStatusColor(task.status) + '20' }]}
                textStyle={{ color: getStatusColor(task.status) }}
              >
                {task.status}
              </Chip>
            </View>

            {task.dueDate && (
              <View style={styles.infoRow}>
                <IconButton icon="calendar" size={20} iconColor={theme.colors.primary} />
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  {t('tasks.dueDate')}:
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <IconButton icon="calendar-plus" size={20} iconColor={theme.colors.primary} />
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                {t('tasks.created')}:
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {new Date(task.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('tasks.tags')}
              </Text>
              <View style={styles.tagsContainer}>
                {task.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    style={[styles.tagChip, { backgroundColor: theme.colors.surfaceVariant }]}
                    textStyle={{ color: theme.colors.textSecondary }}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('tasks.actions')}
            </Text>
            
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                icon="check"
                onPress={handleComplete}
                style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                textColor={theme.colors.onSuccess}
              >
                {task.status === TaskStatus.DONE ? t('tasks.markIncomplete') : t('tasks.markComplete')}
              </Button>
              
              <Button
                mode="outlined"
                icon="pencil"
                onPress={handleEdit}
                style={styles.actionButton}
              >
                {t('tasks.edit')}
              </Button>
              
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDelete}
                style={[styles.actionButton, { borderColor: theme.colors.error }]}
                textColor={theme.colors.error}
              >
                {t('tasks.delete')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '700',
  },
  taskDescription: {
    lineHeight: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoChip: {
    height: 32,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    height: 32,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
});