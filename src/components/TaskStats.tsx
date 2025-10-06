import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Task, TaskStatus } from '@/types/task';
import { theme } from '@/utils/theme';

interface TaskStatsProps {
  tasks: Task[];
}

export const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const { t } = useTranslation();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
  const todoTasks = tasks.filter(task => task.status === TaskStatus.TODO).length;
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === TaskStatus.DONE) return false;
    return new Date(task.dueDate) < new Date();
  }).length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getPriorityCount = (priority: string) => {
    return tasks.filter(task => task.priority === priority).length;
  };

  const urgentTasks = getPriorityCount('URGENT');
  const highTasks = getPriorityCount('HIGH');
  const mediumTasks = getPriorityCount('MEDIUM');
  const lowTasks = getPriorityCount('LOW');

  if (totalTasks === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {t('tasks.statistics')}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              {t('tasks.total')}
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {totalTasks}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              {t('tasks.completed')}
            </Text>
            <Text variant="headlineSmall" style={[styles.statValue, styles.completedValue]}>
              {completedTasks}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              {t('tasks.inProgress')}
            </Text>
            <Text variant="headlineSmall" style={[styles.statValue, styles.inProgressValue]}>
              {inProgressTasks}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text variant="bodySmall" style={styles.progressLabel}>
            {t('tasks.completionRate')}: {Math.round(completionRate)}%
          </Text>
          <ProgressBar
            progress={completionRate / 100}
            color={theme.colors.success}
            style={styles.progressBar}
          />
        </View>

        <View style={styles.priorityContainer}>
          <Text variant="bodySmall" style={styles.priorityLabel}>
            {t('tasks.priorityBreakdown')}
          </Text>
          <View style={styles.priorityChips}>
            {urgentTasks > 0 && (
              <Chip
                mode="outlined"
                textStyle={[styles.priorityChipText, { color: theme.colors.error }]}
                style={[styles.priorityChip, { borderColor: theme.colors.error }]}>
                {t('tasks.priority.urgent')}: {urgentTasks}
              </Chip>
            )}
            {highTasks > 0 && (
              <Chip
                mode="outlined"
                textStyle={[styles.priorityChipText, { color: theme.colors.warning }]}
                style={[styles.priorityChip, { borderColor: theme.colors.warning }]}>
                {t('tasks.priority.high')}: {highTasks}
              </Chip>
            )}
            {mediumTasks > 0 && (
              <Chip
                mode="outlined"
                textStyle={[styles.priorityChipText, { color: theme.colors.info }]}
                style={[styles.priorityChip, { borderColor: theme.colors.info }]}>
                {t('tasks.priority.medium')}: {mediumTasks}
              </Chip>
            )}
            {lowTasks > 0 && (
              <Chip
                mode="outlined"
                textStyle={[styles.priorityChipText, { color: theme.colors.success }]}
                style={[styles.priorityChip, { borderColor: theme.colors.success }]}>
                {t('tasks.priority.low')}: {lowTasks}
              </Chip>
            )}
          </View>
        </View>

        {overdueTasks > 0 && (
          <View style={styles.overdueContainer}>
            <Text variant="bodySmall" style={[styles.overdueText, { color: theme.colors.error }]}>
              {t('tasks.overdueTasks')}: {overdueTasks}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: theme.spacing.sm,
    elevation: 2,
  },
  title: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  completedValue: {
    color: theme.colors.success,
  },
  inProgressValue: {
    color: theme.colors.info,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressLabel: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  priorityContainer: {
    marginBottom: theme.spacing.sm,
  },
  priorityLabel: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  priorityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityChip: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  overdueContainer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  overdueText: {
    fontWeight: '600',
  },
});
