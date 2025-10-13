import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme,
  ActivityIndicator,
  Chip,
  IconButton,
  Portal,
  Modal,
  TextInput,
  FAB
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { Goal, Milestone, MilestoneStatus } from '@/types/goal';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

interface MilestoneManagementScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
    };
  };
}

export const MilestoneManagementScreen: React.FC<MilestoneManagementScreenProps> = ({ navigation, route }) => {
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
    createMilestone,
    updateMilestone,
    deleteMilestone,
    completeMilestone,
    isLoading 
  } = useGoalStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneTargetDate, setMilestoneTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchGoal(route.params.goalId);
  }, [route.params.goalId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoal(route.params.goalId);
    setRefreshing(false);
  };

  const handleCreateMilestone = async () => {
    if (!currentGoal || !validateForm()) return;

    try {
      await createMilestone(currentGoal.id, {
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim() || undefined,
        targetDate: milestoneTargetDate?.toISOString(),
      });

      showSuccess(t('goals.milestoneCreated'));
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      showError(error.message || t('goals.milestoneCreateError'));
    }
  };

  const handleUpdateMilestone = async () => {
    if (!currentGoal || !selectedMilestone || !validateForm()) return;

    try {
      await updateMilestone(currentGoal.id, selectedMilestone.id, {
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim() || undefined,
        targetDate: milestoneTargetDate?.toISOString(),
      });

      showSuccess(t('goals.milestoneUpdated'));
      setShowEditModal(false);
      resetForm();
    } catch (error: any) {
      showError(error.message || t('goals.milestoneUpdateError'));
    }
  };

  const handleDeleteMilestone = async (milestone: Milestone) => {
    if (!currentGoal) return;

    try {
      await deleteMilestone(currentGoal.id, milestone.id);
      showSuccess(t('goals.milestoneDeleted'));
    } catch (error: any) {
      showError(error.message || t('goals.milestoneDeleteError'));
    }
  };

  const handleCompleteMilestone = async (milestone: Milestone) => {
    if (!currentGoal) return;

    try {
      await completeMilestone(currentGoal.id, milestone.id);
      showSuccess(t('goals.milestoneCompleted', { title: milestone.title }));
    } catch (error: any) {
      showError(error.message || t('goals.milestoneActionFailed'));
    }
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneTitle(milestone.title);
    setMilestoneDescription(milestone.description || '');
    setMilestoneTargetDate(milestone.targetDate ? new Date(milestone.targetDate) : null);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setMilestoneTitle('');
    setMilestoneDescription('');
    setMilestoneTargetDate(null);
    setSelectedMilestone(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!milestoneTitle.trim()) {
      newErrors.title = t('goals.milestoneTitleRequired');
    }

    if (milestoneTitle.length > 100) {
      newErrors.title = t('goals.milestoneTitleTooLong');
    }

    if (milestoneDescription && milestoneDescription.length > 500) {
      newErrors.description = t('goals.milestoneDescriptionTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getStatusColor = (status: MilestoneStatus) => {
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
    
    return { text: format(target, 'MMM dd'), color: theme.colors.textSecondary };
  };

  const renderMilestone = ({ item: milestone }: { item: Milestone }) => {
    const timeStatus = getTimeStatus(milestone.targetDate);

    return (
      <Card style={styles.milestoneCard}>
        <Card.Content>
          <View style={styles.milestoneHeader}>
            <View style={styles.milestoneInfo}>
              <Text variant="titleMedium" style={styles.milestoneTitle}>
                {milestone.title}
              </Text>
              <View style={styles.milestoneBadges}>
                <Chip
                  mode="outlined"
                  compact
                  textStyle={[styles.statusChipText, { color: getStatusColor(milestone.status) }]}
                  style={[styles.statusChip, { borderColor: getStatusColor(milestone.status) }]}
                >
                  {t(`goals.milestoneStatus.${milestone.status.toLowerCase()}`)}
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
            </View>
            <View style={styles.milestoneActions}>
              {milestone.status !== MilestoneStatus.DONE && (
                <IconButton
                  icon="check"
                  size={20}
                  iconColor="#4CAF50"
                  onPress={() => handleCompleteMilestone(milestone)}
                />
              )}
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => handleEditMilestone(milestone)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#F44336"
                onPress={() => handleDeleteMilestone(milestone)}
              />
            </View>
          </View>

          {milestone.description && (
            <Text variant="bodyMedium" style={styles.milestoneDescription}>
              {milestone.description}
            </Text>
          )}

          {milestone.targetDate && (
            <Text variant="bodySmall" style={styles.milestoneDate}>
              {t('goals.due')}: {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderCreateModal = () => (
    <Portal>
      <Modal
        visible={showCreateModal}
        onDismiss={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.text }]}>
          {t('goals.createMilestone')}
        </Text>

        <TextInput
          label={t('goals.milestoneTitle')}
          value={milestoneTitle}
          onChangeText={setMilestoneTitle}
          error={!!errors.title}
          style={styles.modalInput}
          maxLength={100}
        />
        {errors.title && (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.title}
          </Text>
        )}

        <TextInput
          label={t('goals.milestoneDescription')}
          value={milestoneDescription}
          onChangeText={setMilestoneDescription}
          error={!!errors.description}
          style={styles.modalInput}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        {errors.description && (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.description}
          </Text>
        )}

        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
          icon="calendar"
        >
          {milestoneTargetDate ? milestoneTargetDate.toLocaleDateString() : t('goals.selectDate')}
        </Button>

        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            style={styles.modalButton}
          >
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleCreateMilestone}
            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
          >
            {t('goals.create')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const renderEditModal = () => (
    <Portal>
      <Modal
        visible={showEditModal}
        onDismiss={() => {
          setShowEditModal(false);
          resetForm();
        }}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.text }]}>
          {t('goals.editMilestone')}
        </Text>

        <TextInput
          label={t('goals.milestoneTitle')}
          value={milestoneTitle}
          onChangeText={setMilestoneTitle}
          error={!!errors.title}
          style={styles.modalInput}
          maxLength={100}
        />
        {errors.title && (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.title}
          </Text>
        )}

        <TextInput
          label={t('goals.milestoneDescription')}
          value={milestoneDescription}
          onChangeText={setMilestoneDescription}
          error={!!errors.description}
          style={styles.modalInput}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        {errors.description && (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.description}
          </Text>
        )}

        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
          icon="calendar"
        >
          {milestoneTargetDate ? milestoneTargetDate.toLocaleDateString() : t('goals.selectDate')}
        </Button>

        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setShowEditModal(false);
              resetForm();
            }}
            style={styles.modalButton}
          >
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleUpdateMilestone}
            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
          >
            {t('goals.update')}
          </Button>
        </View>
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
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.primary }]}>
          {t('goals.milestones')}
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          {currentGoal.title}
        </Text>
      </View>

      <FlatList
        data={currentGoal.milestones}
        renderItem={renderMilestone}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              {t('goals.noMilestones')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              {t('goals.noMilestonesDescription')}
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowCreateModal(true)}
              style={styles.createButton}
              icon="plus"
            >
              {t('goals.createMilestone')}
            </Button>
          </View>
        )}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
        label={t('goals.addMilestone')}
      />

      {renderCreateModal()}
      {renderEditModal()}

      {showDatePicker && (
        <DateTimePicker
          value={milestoneTargetDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setMilestoneTargetDate(selectedDate);
            }
          }}
        />
      )}
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
  header: {
    padding: 16,
    elevation: 2,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  milestoneCard: {
    marginBottom: 12,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  milestoneInfo: {
    flex: 1,
    marginRight: 8,
  },
  milestoneTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  milestoneBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeChip: {
    height: 24,
  },
  timeChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  milestoneActions: {
    flexDirection: 'row',
  },
  milestoneDescription: {
    color: theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  milestoneDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
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
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  dateButton: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 4,
    marginBottom: 8,
  },
});
