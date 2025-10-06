import React, {useEffect} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {Text, FAB, Card, Button, Chip, ProgressBar} from 'react-native-paper';
import {theme} from '@/utils/theme';
import {formatDate} from '@/utils/dateUtils';

export const GoalsScreen: React.FC = () => {
  // Mock data for now
  const goals = [
    {
      id: '1',
      title: 'Learn React Native',
      description: 'Master React Native development and build mobile apps',
      status: 'ACTIVE',
      priority: 'HIGH',
      category: 'Learning',
      progress: 65,
      targetDate: '2024-03-31T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'Complete Project Proposal',
      description: 'Write and submit the project proposal for Q1',
      status: 'ACTIVE',
      priority: 'URGENT',
      category: 'Work',
      progress: 90,
      targetDate: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '3',
      title: 'Read 12 Books This Year',
      description: 'Read one book per month to improve knowledge',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      category: 'Personal',
      progress: 25,
      targetDate: '2024-12-31T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const handleCreateGoal = () => {
    console.log('Create goal');
  };

  const handleGoalPress = (goal: any) => {
    console.log('Goal pressed:', goal.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return theme.colors.error;
      case 'HIGH':
        return theme.colors.warning;
      case 'MEDIUM':
        return theme.colors.info;
      case 'LOW':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return theme.colors.success;
      case 'ACTIVE':
        return theme.colors.info;
      case 'PAUSED':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderGoal = ({item}: {item: any}) => (
    <Card style={styles.goalCard} onPress={() => handleGoalPress(item)}>
      <Card.Content>
        <View style={styles.goalHeader}>
          <Text variant="titleMedium" style={styles.goalTitle}>
            {item.title}
          </Text>
          <Chip
            mode="outlined"
            textStyle={{color: getPriorityColor(item.priority)}}
            style={[styles.priorityChip, {borderColor: getPriorityColor(item.priority)}]}>
            {item.priority}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.goalDescription}>
          {item.description}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text variant="bodySmall" style={styles.progressLabel}>
              Progress
            </Text>
            <Text variant="bodySmall" style={styles.progressValue}>
              {item.progress}%
            </Text>
          </View>
          <ProgressBar
            progress={item.progress / 100}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>

        <View style={styles.goalFooter}>
          <View style={styles.goalMeta}>
            <Chip mode="outlined" compact style={styles.categoryChip}>
              {item.category}
            </Chip>
            <Chip
              mode="outlined"
              compact
              textStyle={{color: getStatusColor(item.status)}}
              style={[styles.statusChip, {borderColor: getStatusColor(item.status)}]}>
              {item.status}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.targetDate}>
            Due {formatDate(item.targetDate, 'MMM dd, yyyy')}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No goals yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        Set your first goal and start tracking your progress
      </Text>
      <Button mode="contained" onPress={handleCreateGoal} style={styles.createButton}>
        Create Goal
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateGoal}
        label="Add Goal"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.sm,
    flexGrow: 1,
  },
  goalCard: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  goalTitle: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
  goalDescription: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    color: theme.colors.textSecondary,
  },
  progressValue: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  statusChip: {
    marginBottom: theme.spacing.xs,
  },
  targetDate: {
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
  },
});
