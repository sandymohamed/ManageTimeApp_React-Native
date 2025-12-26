import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Chip,
  IconButton,
  Portal,
  Modal,
  TextInput,
  FAB
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { Milestone  } from '@/types/goal';
import {  MilestoneStatus } from '@/types';
import { format, isBefore, differenceInDays } from 'date-fns';
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
  const [fabScale] = useState(new Animated.Value(1));

  useEffect(() => {
    fetchGoal(route.params.goalId);
  }, [route.params.goalId]);

  const animateFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
        return theme.colors.success || '#4CAF50';
      case MilestoneStatus.IN_PROGRESS:
        return theme.colors.primary || '#2196F3';
      case MilestoneStatus.TODO:
        return theme.colors.surfaceVariant || '#9E9E9E';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusBackgroundColor = (status: MilestoneStatus) => {
    const color = getStatusColor(status);
    return `${color}15`; // Add transparency
  };

  const getTimeStatus = (targetDate?: string) => {
    if (!targetDate) return null;

    const target = new Date(targetDate);
    const now = new Date();

    if (isBefore(target, now)) return { text: t('goals.overdue'), color: theme.colors.error || '#F44336' };

    const daysLeft = differenceInDays(target, now);
    if (daysLeft <= 7) return { text: t('goals.dueInDays', { days: daysLeft }), color: theme.colors.warning || '#FF9800' };

    return { text: format(target, 'MMM dd'), color: theme.colors.textSecondary };
  };

  const renderMilestone = ({ item: milestone }: { item: Milestone }) => {
    const timeStatus = getTimeStatus(milestone.targetDate);
    const statusColor = getStatusColor(milestone.status);
    const statusBgColor = getStatusBackgroundColor(milestone.status);

    return (
      <Card style={[styles.milestoneCard, { borderLeftWidth: 4, borderLeftColor: statusColor }]}>
        <Card.Content style={styles.milestoneContent}>
          <View style={styles.milestoneHeader}>
            <View style={styles.milestoneInfo}>
              <Text variant="titleMedium" style={styles.milestoneTitle}>
                {milestone.title}
              </Text>
              <View style={styles.milestoneBadges}>
                <Chip
                  mode="flat"
                  compact
                  textStyle={[styles.statusChipText, { color: statusColor }]}
                  style={[styles.statusChip, { backgroundColor: statusBgColor }]}
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
                  icon="check-circle"
                  size={22}
                  iconColor={theme.colors.success}
                  style={[styles.actionButton, { backgroundColor: `${theme.colors.success}15` }]}
                  onPress={() => handleCompleteMilestone(milestone)}
                />
              )}
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}15` }]}
                onPress={() => handleEditMilestone(milestone)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                style={[styles.actionButton, { backgroundColor: `${theme.colors.error}15` }]}
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
            <View style={styles.dateContainer}>
              <IconButton
                icon="calendar"
                size={16}
                iconColor={theme.colors.textSecondary}
                style={styles.dateIcon}
              />
              <Text variant="bodySmall" style={styles.milestoneDate}>
                {t('goals.due')}: {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderModal = (isEdit: boolean) => (
    <Portal>
      <Modal
        visible={isEdit ? showEditModal : showCreateModal}
        onDismiss={() => {
          isEdit ? setShowEditModal(false) : setShowCreateModal(false);
          resetForm();
        }}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.modalHeader}>
          <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.text }]}>
            {isEdit ? t('goals.editMilestone') : t('goals.createMilestone')}
          </Text>
          <View style={[styles.modalTitleUnderline, { backgroundColor: theme.colors.primary }]} />
        </View>

        <TextInput
          label={t('goals.milestoneTitle')}
          value={milestoneTitle}
          onChangeText={setMilestoneTitle}
          error={!!errors.title}
          style={styles.modalInput}
          maxLength={100}
          mode="outlined"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
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
          mode="outlined"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.description && (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.description}
          </Text>
        )}

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <View style={[styles.dateButton, { borderColor: theme.colors.outline }]}>
            <IconButton
              icon="calendar"
              size={20}
              iconColor={theme.colors.primary}
              style={styles.dateButtonIcon}
            />
            <Text style={[styles.dateButtonText, { color: milestoneTargetDate ? theme.colors.text : theme.colors.textSecondary }]}>
              {milestoneTargetDate ? milestoneTargetDate.toLocaleDateString() : t('goals.selectDate')}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={() => {
              isEdit ? setShowEditModal(false) : setShowCreateModal(false);
              resetForm();
            }}
            style={styles.modalButton}
            textColor={theme.colors.primary}
          >
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={isEdit ? handleUpdateMilestone : handleCreateMilestone}
            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ color: theme.colors.onPrimary }}
          >
            {isEdit ? t('goals.editGoal') : t('goals.createGoal')}
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
        <IconButton
          icon="alert-circle"
          size={64}
          iconColor={theme.colors.error}
          style={styles.errorIcon}
        />
        <Text variant="headlineSmall" style={styles.errorTitle}>
          {t('goals.goalNotFound')}
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
          labelStyle={{ color: theme.colors.onPrimary }}
        >
          {t('common.back')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, {
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.outline
      }]}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.primary }]}>
           {t('goals.milestones')} 
          </Text>
          <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {currentGoal.title}
          </Text>
        </View>
        <View style={[styles.progressIndicator, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Text variant="labelSmall" style={[styles.progressText, { color: theme.colors.primary }]}>
            {currentGoal.milestones?.length || 0}  {t('goals.milestones')}
          </Text>
        </View>
      </View>

      <FlatList
        data={currentGoal.milestones}
        renderItem={renderMilestone}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <IconButton
              icon="flag-variant-outline"
              size={80}
              iconColor={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
              {t('goals.noMilestones')}
            </Text>
            <Text variant="bodyMedium" style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
              {t('goals.noMilestonesDescription')}
            </Text>
            <Button
              mode="contained"
              onPress={() => {
                setShowCreateModal(true);
                animateFab();
              }}
              style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
              icon="plus"
              labelStyle={{ color: theme.colors.onPrimary }}
            >
              {t('goals.createMilestone')}
            </Button>
          </View>
        )}
      />

      {currentGoal.milestones && currentGoal.milestones.length > 0 && (
        <Animated.View style={{ transform: [{ scale: fabScale }] }}>
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              setShowCreateModal(true);
              animateFab();
            }}
            // label={t('goals.addMilestone')}
            color={theme.colors.onPrimary}
          />
        </Animated.View>
      )}

      {renderModal(false)}
      {renderModal(true)}

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
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.text,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.colors.background,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    marginBottom: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 8,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomWidth: 1,
  },
  headerContent: {
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 24,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  progressIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    fontWeight: '600',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  milestoneCard: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  milestoneContent: {
    paddingVertical: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneInfo: {
    flex: 1,
    marginRight: 12,
  },
  milestoneTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
    fontSize: 16,
  },
  milestoneBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    height: 24,
    borderRadius: 6,
    lineHeight: 10,
  },
  statusChipText: {
    fontSize: 10,
    lineHeight: 8,
    fontWeight: '600',
  },
  timeChip: {
    height: 24,
    borderRadius: 6,
  },
  timeChipText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  milestoneActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    margin: 0,
    marginHorizontal: 2,
  },
  milestoneDescription: {
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
    fontSize: 14,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateIcon: {
    margin: 0,
    marginRight: 4,
    marginLeft: -8,
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
    minHeight: 400,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    opacity: 0.8,
  },
  createButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modal: {
    margin: 20,
    padding: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: theme.colors.surfaceVariant || `${theme.colors.primary}08`,
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalTitleUnderline: {
    height: 3,
    width: 40,
    borderRadius: 2,
    alignSelf: 'center',
  },
  modalInput: {
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  dateButtonIcon: {
    margin: 0,
    marginRight: 8,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
    backgroundColor: theme.colors.surfaceVariant || `${theme.colors.background}80`,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 24,
    fontSize: 12,
  },
});