import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  TextInput, 
  Button, 
  useTheme,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
  IconButton,
  Portal,
  Modal
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { Goal, GoalPriority, GoalStatus } from '@/types/goal';
import DateTimePicker from '@react-native-community/datetimepicker';

interface GoalEditScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
    };
  };
}

export const GoalEditScreen: React.FC<GoalEditScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const { currentGoal, fetchGoal, updateGoal, isLoading } = useGoalStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>(GoalPriority.MEDIUM);
  const [status, setStatus] = useState<GoalStatus>(GoalStatus.ACTIVE);
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    'Work', 'Personal', 'Health', 'Learning', 'Finance', 'Relationships', 'Hobbies', 'Other'
  ];

  useEffect(() => {
    fetchGoal(route.params.goalId);
  }, [route.params.goalId]);

  useEffect(() => {
    if (currentGoal) {
      setTitle(currentGoal.title);
      setDescription(currentGoal.description || '');
      setPriority(currentGoal.priority);
      setStatus(currentGoal.status);
      setCategory(currentGoal.category);
      if (currentGoal.targetDate) {
        setTargetDate(new Date(currentGoal.targetDate));
      }
    }
  }, [currentGoal]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = t('goals.titleRequired');
    }

    if (title.length > 100) {
      newErrors.title = t('goals.titleTooLong');
    }

    if (description && description.length > 500) {
      newErrors.description = t('goals.descriptionTooLong');
    }

    if (targetDate && targetDate < new Date()) {
      newErrors.targetDate = t('goals.targetDateInPast');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateGoal = async () => {
    if (!currentGoal || !validateForm()) return;

    try {
      await updateGoal(currentGoal.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        category: category || 'Other',
        targetDate: targetDate?.toISOString(),
      });

      showSuccess(t('goals.goalUpdated'));
      navigation.goBack();
    } catch (error: any) {
      showError(error.message || t('goals.updateError'));
    }
  };

  const handleDeleteGoal = async () => {
    if (!currentGoal) return;

    try {
      await useGoalStore.getState().deleteGoal(currentGoal.id);
      showSuccess(t('goals.goalDeleted'));
      navigation.navigate('Goals');
    } catch (error: any) {
      showError(error.message || t('goals.deleteError'));
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
        return theme.colors.primary;
    }
  };

  const renderPrioritySelector = () => (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('goals.priority')}
      </Text>
      <SegmentedButtons
        value={priority}
        onValueChange={(value) => setPriority(value as GoalPriority)}
        buttons={[
          { 
            value: GoalPriority.LOW, 
            label: t('goals.priority.low'),
            style: { backgroundColor: priority === GoalPriority.LOW ? getPriorityColor(GoalPriority.LOW) : undefined }
          },
          { 
            value: GoalPriority.MEDIUM, 
            label: t('goals.priority.medium'),
            style: { backgroundColor: priority === GoalPriority.MEDIUM ? getPriorityColor(GoalPriority.MEDIUM) : undefined }
          },
          { 
            value: GoalPriority.HIGH, 
            label: t('goals.priority.high'),
            style: { backgroundColor: priority === GoalPriority.HIGH ? getPriorityColor(GoalPriority.HIGH) : undefined }
          },
          { 
            value: GoalPriority.URGENT, 
            label: t('goals.priority.urgent'),
            style: { backgroundColor: priority === GoalPriority.URGENT ? getPriorityColor(GoalPriority.URGENT) : undefined }
          },
        ]}
        style={styles.segmentedButtons}
      />
    </View>
  );

  const renderStatusSelector = () => (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('goals.status')}
      </Text>
      <SegmentedButtons
        value={status}
        onValueChange={(value) => setStatus(value as GoalStatus)}
        buttons={[
          { 
            value: GoalStatus.DRAFT, 
            label: t('goals.status.draft'),
            style: { backgroundColor: status === GoalStatus.DRAFT ? getStatusColor(GoalStatus.DRAFT) : undefined }
          },
          { 
            value: GoalStatus.ACTIVE, 
            label: t('goals.status.active'),
            style: { backgroundColor: status === GoalStatus.ACTIVE ? getStatusColor(GoalStatus.ACTIVE) : undefined }
          },
          { 
            value: GoalStatus.PAUSED, 
            label: t('goals.status.paused'),
            style: { backgroundColor: status === GoalStatus.PAUSED ? getStatusColor(GoalStatus.PAUSED) : undefined }
          },
          { 
            value: GoalStatus.DONE, 
            label: t('goals.status.done'),
            style: { backgroundColor: status === GoalStatus.DONE ? getStatusColor(GoalStatus.DONE) : undefined }
          },
        ]}
        style={styles.segmentedButtons}
      />
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('goals.category')}
      </Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
            style={[
              styles.categoryChip,
              category === cat && { backgroundColor: theme.colors.primary }
            ]}
            textStyle={[
              styles.categoryChipText,
              category === cat && { color: theme.colors.onPrimary }
            ]}
          >
            {cat}
          </Chip>
        ))}
      </View>
    </View>
  );

  const renderDateSelector = () => (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('goals.targetDate')}
      </Text>
      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
        icon="calendar"
      >
        {targetDate ? targetDate.toLocaleDateString() : t('goals.selectDate')}
      </Button>
      {targetDate && (
        <Button
          mode="text"
          onPress={() => setTargetDate(null)}
          style={styles.clearDateButton}
          textColor={theme.colors.error}
        >
          {t('goals.clearDate')}
        </Button>
      )}
      {errors.targetDate && (
        <Text variant="bodySmall" style={styles.errorText}>
          {errors.targetDate}
        </Text>
      )}
    </View>
  );

  const renderDeleteModal = () => (
    <Portal>
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        contentContainerStyle={[styles.deleteModal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={[styles.deleteModalTitle, { color: theme.colors.text }]}>
          {t('goals.deleteGoal')}
        </Text>
        <Text variant="bodyMedium" style={[styles.deleteModalMessage, { color: theme.colors.textSecondary }]}>
          {t('goals.deleteConfirmation')}
        </Text>
        <View style={styles.deleteModalActions}>
          <Button
            mode="outlined"
            onPress={() => setShowDeleteModal(false)}
            style={styles.deleteModalButton}
          >
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleDeleteGoal}
            style={[styles.deleteModalButton, { backgroundColor: '#F44336' }]}
            textColor="white"
          >
            {t('goals.delete')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  if (isLoading) {
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                {t('goals.editGoal')}
              </Text>
              <IconButton
                icon="delete"
                size={24}
                iconColor="#F44336"
                onPress={() => setShowDeleteModal(true)}
              />
            </View>

            {/* Title Input */}
            <View style={styles.section}>
              <TextInput
                label={t('goals.goalTitle')}
                value={title}
                onChangeText={setTitle}
                error={!!errors.title}
                style={styles.input}
                maxLength={100}
                multiline
              />
              {errors.title && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.title}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.characterCount}>
                {title.length}/100
              </Text>
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <TextInput
                label={t('goals.goalDescription')}
                value={description}
                onChangeText={setDescription}
                error={!!errors.description}
                style={styles.input}
                multiline
                numberOfLines={4}
                maxLength={500}
                placeholder={t('goals.descriptionPlaceholder')}
              />
              {errors.description && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.description}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.characterCount}>
                {description.length}/500
              </Text>
            </View>

            {/* Priority Selector */}
            {renderPrioritySelector()}

            {/* Status Selector */}
            {renderStatusSelector()}

            {/* Category Selector */}
            {renderCategorySelector()}

            {/* Target Date Selector */}
            {renderDateSelector()}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
        >
          {t('common.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={handleUpdateGoal}
          style={[styles.actionButton, styles.updateButton]}
          disabled={!title.trim() || isLoading}
        >
          {t('goals.updateGoal')}
        </Button>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={targetDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setTargetDate(selectedDate);
            }
          }}
        />
      )}

      {renderDeleteModal()}
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
  card: {
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  characterCount: {
    textAlign: 'right',
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 4,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 12,
  },
  dateButton: {
    marginTop: 8,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    elevation: 4,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteModal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  deleteModalTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteModalMessage: {
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
  },
});
