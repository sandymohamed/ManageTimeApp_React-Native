import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme,
  ActivityIndicator,
  Chip,
  ProgressBar,
  IconButton,
  Portal,
  Modal,
  FAB,
  Divider
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { Goal, GoalStatus, GoalPriority, Milestone, MilestoneStatus } from '@/types/goal';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';

interface GoalDetailScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
    };
  };
}

export const GoalDetailScreen: React.FC<GoalDetailScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const { 
    currentGoal, 
    fetchGoal, 
    updateGoal, 
    completeGoal, 
    pauseGoal, 
    resumeGoal, 
    cancelGoal,
    createMilestone,
    updateMilestone,
    completeMilestone,
    isLoading 
  } = useGoalStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    fetchGoal(route.params.goalId);
  }, [route.params.goalId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoal(route.params.goalId);
    setRefreshing(false);
  };

  const handleGoalAction = async (action: 'complete' | 'pause' | 'resume' | 'cancel') => {
    if (!currentGoal) return;

    try {
      switch (action) {
        case 'complete':
          await completeGoal(currentGoal.id);
          showSuccess(t('goals.completedSuccessfully', { title: currentGoal.title }));
          break;
        case 'pause':
          await pauseGoal(currentGoal.id);
          showSuccess(t('goals.pausedSuccessfully', { title: currentGoal.title }));
          break;
        case 'resume':
          await resumeGoal(currentGoal.id);
          showSuccess(t('goals.resumedSuccessfully', { title: currentGoal.title }));
          break;
        case 'cancel':
          await cancelGoal(currentGoal.id);
          showSuccess(t('goals.cancelledSuccessfully', { title: currentGoal.title }));
          break;
      }
    } catch (error: any) {
      showError(error.message || t('goals.actionFailed'));
    }
  };

  const handleMilestoneAction = async (milestone: Milestone, action: 'complete' | 'edit') => {
    if (!currentGoal) return;

    try {
      if (action === 'complete') {
        await completeMilestone(currentGoal.id, milestone.id);
        showSuccess(t('goals.milestoneCompleted', { title: milestone.title }));
      } else if (action === 'edit') {
        setSelectedMilestone(milestone);
        setShowMilestoneModal(true);
      }
    } catch (error: any) {
      showError(error.message || t('goals.milestoneActionFailed'));
    }
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case GoalPriority.URGENT:
        return '#F44336';
      case GoalPriority.HIGH:
        return '#FF9800';
      case GoalPriority.MEDIUM:
        return '#2196F3';
      case GoalPriority.LOW:
        return '#4CAF50';
      default:
        return theme.colors.primary;
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.DONE:
        return '#4CAF50';
      case GoalStatus.ACTIVE:
        return '#2196F3';
      case GoalStatus.PAUSED:
        return '#FF9800';
      case GoalStatus.CANCELLED:
        return '#9E9E9E';
      case GoalStatus.DRAFT:
        return '#9E9E9E';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getMilestoneStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.DONE:
        return '#4CAF50';
      case MilestoneStatus.IN_PROGRESS:
        return '#2196F3';
      case MilestoneStatus.TODO:
        return '#9E9E9E';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTimeStatus = (targetDate?: string) => {
    if (!targetDate) return null;
    
    const target = new Date(targetDate);
    const now = new Date();
    
    if (isBefore(target, now)) return { text: t('goals.overdue'), color: '#F44336' };
    
    const daysLeft = differenceInDays(target, now);
    if (daysLeft <= 7) return { text: t('goals.dueInDays', { days: daysLeft }), color: '#FF9800' };
    
    return { text: format(target, 'MMM dd, yyyy'), color: theme.colors.textSecondary };
  };

  const renderGoalHeader = () => {
    if (!currentGoal) return null;

    const timeStatus = getTimeStatus(currentGoal.targetDate);
    const completedMilestones = currentGoal.milestones.filter(m => m.status === MilestoneStatus.DONE).length;
    const totalMilestones = currentGoal.milestones.length;

    return (
      <Card style={[styles.headerCard, { borderLeftColor: getPriorityColor(currentGoal.priority) }]}>
        <Card.Content>
          <View style={styles.goalHeader}>
            <Text variant="headlineSmall" style={styles.goalTitle}>
              {currentGoal.title}
            </Text>
            <View style={styles.goalBadges}>
              <Chip
                mode="outlined"
                compact
                textStyle={[styles.priorityChipText, { color: getPriorityColor(currentGoal.priority) }]}
                style={[styles.priorityChip, { borderColor: getPriorityColor(currentGoal.priority) }]}
              >
                {t(`goals.priority.${currentGoal.priority.toLowerCase()}`)}
              </Chip>
              <Chip
                mode="outlined"
                compact
                textStyle={[styles.statusChipText, { color: getStatusColor(currentGoal.status) }]}
                style={[styles.statusChip, { borderColor: getStatusColor(currentGoal.status) }]}
              >
                {t(`goals.status.${currentGoal.status.toLowerCase()}`)}
              </Chip>
            </View>
          </View>

          {currentGoal.description && (
            <Text variant="bodyMedium" style={styles.goalDescription}>
              {currentGoal.description}
            </Text>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text variant="titleMedium" style={styles.progressLabel}>
                {t('goals.progress')}
              </Text>
              <Text variant="titleMedium" style={styles.progressValue}>
                {currentGoal.progress}%
              </Text>
            </View>
            <ProgressBar
              progress={currentGoal.progress / 100}
              color={getPriorityColor(currentGoal.priority)}
              style={styles.progressBar}
            />
            {totalMilestones > 0 && (
              <Text variant="bodySmall" style={styles.milestoneProgress}>
                {completedMilestones}/{totalMilestones} {t('goals.milestones')} {t('goals.completed')}
              </Text>
            )}
          </View>

          <View style={styles.goalMeta}>
            <Chip mode="outlined" style={styles.categoryChip}>
              {currentGoal.category}
            </Chip>
            {timeStatus && (
              <Chip
                mode="outlined"
                textStyle={[styles.timeChipText, { color: timeStatus.color }]}
                style={[styles.timeChip, { borderColor: timeStatus.color }]}
              >
                {timeStatus.text}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMilestones = () => {
    if (!currentGoal || currentGoal.milestones.length === 0) return null;

    return (
      <Card style={styles.milestonesCard}>
        <Card.Content>
          <View style={styles.milestonesHeader}>
            <Text variant="titleMedium" style={styles.milestonesTitle}>
              {t('goals.milestones')}
            </Text>
            <Button
              mode="outlined"
              compact
              onPress={() => setShowMilestoneModal(true)}
              icon="plus"
            >
              {t('goals.addMilestone')}
            </Button>
          </View>

          {currentGoal.milestones.map((milestone, index) => (
            <View key={milestone.id} style={styles.milestoneItem}>
              <View style={styles.milestoneContent}>
                <View style={styles.milestoneHeader}>
                  <Text variant="titleSmall" style={styles.milestoneTitle}>
                    {milestone.title}
                  </Text>
                  <Chip
                    mode="outlined"
                    compact
                    textStyle={[styles.milestoneStatusText, { color: getMilestoneStatusColor(milestone.status) }]}
                    style={[styles.milestoneStatusChip, { borderColor: getMilestoneStatusColor(milestone.status) }]}
                  >
                    {t(`goals.milestoneStatus.${milestone.status.toLowerCase()}`)}
                  </Chip>
                </View>
                
                {milestone.description && (
                  <Text variant="bodySmall" style={styles.milestoneDescription}>
                    {milestone.description}
                  </Text>
                )}

                {milestone.targetDate && (
                  <Text variant="bodySmall" style={styles.milestoneDate}>
                    {t('goals.due')}: {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
                  </Text>
                )}
              </View>

              {milestone.status !== MilestoneStatus.DONE && (
                <IconButton
                  icon="check"
                  size={20}
                  iconColor="#4CAF50"
                  onPress={() => handleMilestoneAction(milestone, 'complete')}
                />
              )}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderActionButtons = () => {
    if (!currentGoal) return null;

    return (
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.actionsTitle}>
            {t('goals.actions')}
          </Text>
          
          <View style={styles.actionButtons}>
            {currentGoal.status === GoalStatus.ACTIVE && (
              <>
                <Button
                  mode="contained"
                  onPress={() => handleGoalAction('complete')}
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  icon="check"
                >
                  {t('goals.complete')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleGoalAction('pause')}
                  style={styles.actionButton}
                  icon="pause"
                >
                  {t('goals.pause')}
                </Button>
              </>
            )}
            
            {currentGoal.status === GoalStatus.PAUSED && (
              <Button
                mode="contained"
                onPress={() => handleGoalAction('resume')}
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                icon="play"
              >
                {t('goals.resume')}
              </Button>
            )}
            
            {currentGoal.status !== GoalStatus.DONE && currentGoal.status !== GoalStatus.CANCELLED && (
              <Button
                mode="outlined"
                onPress={() => handleGoalAction('cancel')}
                style={[styles.actionButton, { borderColor: '#F44336' }]}
                textColor="#F44336"
                icon="cancel"
              >
                {t('goals.cancel')}
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          {t('goals.loading')}
        </Text>
      </View>
    );
  }

  if (!currentGoal) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text variant="headlineSmall" style={styles.errorTitle}>
          {t('goals.goalNotFound')}
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderGoalHeader()}
        {renderMilestones()}
        {renderActionButtons()}
      </ScrollView>

      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('GoalEdit', { goalId: currentGoal.id })}
        label={t('goals.edit')}
      />
    </View>
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    marginBottom: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  goalHeader: {
    marginBottom: 12,
  },
  goalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  goalBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    height: 28,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalDescription: {
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontWeight: '600',
  },
  progressValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  milestoneProgress: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  goalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    height: 28,
  },
  timeChip: {
    height: 28,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  milestonesCard: {
    marginBottom: 16,
    elevation: 2,
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestonesTitle: {
    fontWeight: '600',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  milestoneContent: {
    flex: 1,
    marginRight: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestoneTitle: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  milestoneStatusChip: {
    height: 24,
  },
  milestoneStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  milestoneDescription: {
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  milestoneDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionsTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
