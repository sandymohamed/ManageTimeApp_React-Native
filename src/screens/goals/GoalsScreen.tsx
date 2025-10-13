import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  FAB, 
  Chip, 
  ProgressBar, 
  Searchbar, 
  Menu, 
  IconButton, 
  useTheme,
  ActivityIndicator,
  Portal,
  Modal,
  Button,
  SegmentedButtons,
  Badge
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { Goal, GoalStatus, GoalPriority } from '@/types/goal';
import { format, isAfter, isBefore, differenceInDays, isToday, isTomorrow, isYesterday } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

interface GoalsScreenProps {
  navigation: any;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const {
    goals,
    filteredGoals,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    fetchGoals,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setCategoryFilter,
    clearFilters,
    completeGoal,
    pauseGoal,
    resumeGoal,
    cancelGoal,
    deleteGoal,
    setCurrentGoal,
    generateAIPlan,
  } = useGoalStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchGoals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };

  const handleCreateGoal = () => {
    navigation.navigate('GoalCreate');
  };

  const handleGoalPress = (goal: Goal) => {
    setCurrentGoal(goal);
    navigation.navigate('GoalDetail', { goalId: goal.id });
  };

  const handleEditGoal = (goal: Goal) => {
    setCurrentGoal(goal);
    navigation.navigate('GoalEdit', { goalId: goal.id });
  };

  const handleViewAnalytics = (goal: Goal) => {
    setCurrentGoal(goal);
    navigation.navigate('GoalAnalytics', { goalId: goal.id });
  };

  const handleManageMilestones = (goal: Goal) => {
    setCurrentGoal(goal);
    navigation.navigate('MilestoneManagement', { goalId: goal.id });
  };

  const handleAIPlanning = (goal: Goal) => {
    // Show AI planning options
    Alert.alert(
      t('goals.aiPlanning'),
      t('goals.aiPlanningDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('goals.generatePlan'), 
          onPress: () => {
            try {
              generateAIPlan(goal.id);
              showSuccess(t('goals.aiPlanGenerated'));
            } catch (error: any) {
              showError(error.message || t('goals.aiPlanError'));
            }
          }
        }
      ]
    );
  };

  const handleGoalAction = async (goal: Goal, action: 'complete' | 'pause' | 'resume' | 'cancel' | 'delete') => {
    try {
      switch (action) {
        case 'complete':
          await completeGoal(goal.id);
          showSuccess(t('goals.completedSuccessfully', { title: goal.title }));
          break;
        case 'pause':
          await pauseGoal(goal.id);
          showSuccess(t('goals.pausedSuccessfully', { title: goal.title }));
          break;
        case 'resume':
          await resumeGoal(goal.id);
          showSuccess(t('goals.resumedSuccessfully', { title: goal.title }));
          break;
        case 'cancel':
          await cancelGoal(goal.id);
          showSuccess(t('goals.cancelledSuccessfully', { title: goal.title }));
          break;
        case 'delete':
          await deleteGoal(goal.id);
          showSuccess(t('goals.deletedSuccessfully', { title: goal.title }));
          break;
      }
    } catch (error: any) {
      showError(error.message || t('goals.actionFailed'));
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
        return theme.colors.textSecondary;
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

  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.DONE:
        return 'check-circle';
      case GoalStatus.ACTIVE:
        return 'play-circle';
      case GoalStatus.PAUSED:
        return 'pause-circle';
      case GoalStatus.CANCELLED:
        return 'cancel';
      case GoalStatus.DRAFT:
        return 'draft';
      default:
        return 'help-circle';
    }
  };

  const getTimeStatus = (targetDate?: string) => {
    if (!targetDate) return null;
    
    const target = new Date(targetDate);
    const now = new Date();
    
    if (isToday(target)) return { text: t('goals.dueToday'), color: '#FF9800' };
    if (isTomorrow(target)) return { text: t('goals.dueTomorrow'), color: '#2196F3' };
    if (isYesterday(target)) return { text: t('goals.overdue'), color: '#F44336' };
    if (isBefore(target, now)) return { text: t('goals.overdue'), color: '#F44336' };
    
    const daysLeft = differenceInDays(target, now);
    if (daysLeft <= 7) return { text: t('goals.dueInDays', { days: daysLeft }), color: '#FF9800' };
    
    return { text: format(target, 'MMM dd'), color: theme.colors.textSecondary };
  };

  const getFilteredGoals = () => {
    let filtered = filteredGoals;
    
    if (viewMode === 'active') {
      filtered = filtered.filter(goal => goal.status === GoalStatus.ACTIVE);
    } else if (viewMode === 'completed') {
      filtered = filtered.filter(goal => goal.status === GoalStatus.DONE);
    }
    
    return filtered;
  };

  const renderGoal = ({ item: goal }: { item: Goal }) => {
    const timeStatus = getTimeStatus(goal.targetDate);
    const completedMilestones = goal.milestones.filter(m => m.status === 'DONE').length;
    const totalMilestones = goal.milestones.length;

    return (
      <Card 
        style={[styles.goalCard, { borderLeftColor: getPriorityColor(goal.priority) }]} 
        onPress={() => handleGoalPress(goal)}
      >
        <Card.Content>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Text variant="titleMedium" style={styles.goalTitle} numberOfLines={2}>
                {goal.title}
              </Text>
              <View style={styles.goalBadges}>
                <Chip
                  mode="outlined"
                  compact
                  textStyle={[styles.priorityChipText, { color: getPriorityColor(goal.priority) }]}
                  style={[styles.priorityChip, { borderColor: getPriorityColor(goal.priority) }]}
                >
                  {t(`goals.priority.${goal.priority.toLowerCase()}`)}
                </Chip>
                <Chip
                  mode="outlined"
                  compact
                  textStyle={[styles.statusChipText, { color: getStatusColor(goal.status) }]}
                  style={[styles.statusChip, { borderColor: getStatusColor(goal.status) }]}
                >
                  {t(`goals.status.${goal.status.toLowerCase()}`)}
                </Chip>
              </View>
            </View>
            <IconButton
              icon="dots-vertical"
              size={20}
              iconColor={theme.colors.textSecondary}
              onPress={() => {
                setSelectedGoal(goal);
                setShowGoalModal(true);
              }}
            />
          </View>

          {goal.description && (
            <Text variant="bodyMedium" style={styles.goalDescription} numberOfLines={2}>
              {goal.description}
            </Text>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text variant="bodySmall" style={styles.progressLabel}>
                {t('goals.progress')}
              </Text>
              <Text variant="bodySmall" style={styles.progressValue}>
                {goal.progress}%
              </Text>
            </View>
            <ProgressBar
              progress={goal.progress / 100}
              color={getPriorityColor(goal.priority)}
              style={styles.progressBar}
            />
            {totalMilestones > 0 && (
              <Text variant="bodySmall" style={styles.milestoneProgress}>
                {completedMilestones}/{totalMilestones} {t('goals.milestones')}
              </Text>
            )}
          </View>

          <View style={styles.goalFooter}>
            <View style={styles.goalMeta}>
              <Chip mode="outlined" compact style={styles.categoryChip}>
                {goal.category}
              </Chip>
              {timeStatus && (
                <Chip
                  mode="outlined"
                  compact
                  textStyle={[styles.timeChipText, { color: timeStatus.color }]}
                  style={[styles.timeChip, { borderColor: timeStatus.color }]}
                >
                  {timeStatus.text}
                </Chip>
              )}
            </View>
            <View style={styles.goalStats}>
              <IconButton
                icon={getStatusIcon(goal.status)}
                size={16}
                iconColor={getStatusColor(goal.status)}
                style={styles.statusIcon}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {t('goals.noGoals')}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        {t('goals.noGoalsDescription')}
      </Text>
      <Button 
        mode="contained" 
        onPress={handleCreateGoal} 
        style={styles.createButton}
        icon="plus"
      >
        {t('goals.createGoal')}
      </Button>
    </View>
  );

  const renderGoalModal = () => (
    <Portal>
      <Modal
        visible={showGoalModal}
        onDismiss={() => setShowGoalModal(false)}
        contentContainerStyle={[styles.goalModal, { backgroundColor: theme.colors.surface }]}
      >
        {selectedGoal && (
          <View style={styles.goalModalContent}>
            <Text variant="titleLarge" style={[styles.goalModalTitle, { color: theme.colors.text }]}>
              {selectedGoal.title}
            </Text>
            
            <View style={styles.goalModalActions}>
              {selectedGoal.status === GoalStatus.ACTIVE && (
                <>
                  <Button
                    mode="contained"
                    onPress={() => {
                      handleGoalAction(selectedGoal, 'complete');
                      setShowGoalModal(false);
                    }}
                    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                    icon="check"
                  >
                    {t('goals.complete')}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      handleGoalAction(selectedGoal, 'pause');
                      setShowGoalModal(false);
                    }}
                    style={styles.actionButton}
                    icon="pause"
                  >
                    {t('goals.pause')}
                  </Button>
                </>
              )}
              
              {selectedGoal.status === GoalStatus.PAUSED && (
                <Button
                  mode="contained"
                  onPress={() => {
                    handleGoalAction(selectedGoal, 'resume');
                    setShowGoalModal(false);
                  }}
                  style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                  icon="play"
                >
                  {t('goals.resume')}
                </Button>
              )}
              
              {selectedGoal.status !== GoalStatus.DONE && selectedGoal.status !== GoalStatus.CANCELLED && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    handleGoalAction(selectedGoal, 'cancel');
                    setShowGoalModal(false);
                  }}
                  style={styles.actionButton}
                  icon="cancel"
                >
                  {t('goals.cancel')}
                </Button>
              )}
              
              <Button
                mode="outlined"
                onPress={() => {
                  handleGoalAction(selectedGoal, 'delete');
                  setShowGoalModal(false);
                }}
                style={[styles.actionButton, { borderColor: '#F44336' }]}
                textColor="#F44336"
                icon="delete"
              >
                {t('goals.delete')}
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          {t('goals.title')}
        </Text>
        <View style={styles.headerActions}>
          <IconButton
            icon="magnify"
            size={24}
            iconColor={theme.colors.text}
            onPress={() => {/* Implement search */}}
          />
          <Menu
            visible={showFilterMenu}
            onDismiss={() => setShowFilterMenu(false)}
            anchor={
              <IconButton
                icon="filter"
                size={24}
                iconColor={theme.colors.text}
                onPress={() => setShowFilterMenu(true)}
              />
            }
          >
            <Menu.Item onPress={() => setShowFilterMenu(false)} title={t('goals.filters')} />
            <Menu.Item onPress={() => setShowFilterMenu(false)} title={t('goals.clearFilters')} />
          </Menu>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('goals.searchGoals')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'all' | 'active' | 'completed')}
          buttons={[
            { value: 'all', label: t('goals.all') },
            { value: 'active', label: t('goals.active') },
            { value: 'completed', label: t('goals.completed') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Goals List */}
      <FlatList
        data={getFilteredGoals()}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateGoal}
        label={t('goals.addGoal')}
      />

      {renderGoalModal()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    elevation: 1,
  },
  viewModeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  listContent: {
    padding: 8,
    flexGrow: 1,
  },
  goalCard: {
    marginVertical: 4,
    marginHorizontal: 8,
    borderLeftWidth: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  goalTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  goalBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  priorityChip: {
    height: 24,
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  goalDescription: {
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  progressValue: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  milestoneProgress: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryChip: {
    height: 24,
  },
  timeChip: {
    height: 24,
  },
  timeChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  goalStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    margin: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 8,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  goalModal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  goalModalContent: {
    alignItems: 'center',
  },
  goalModalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  goalModalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    marginHorizontal: 4,
    marginVertical: 4,
  },
});