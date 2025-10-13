import React, { useState } from 'react';
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
  IconButton
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { GoalPriority } from '@/types/goal';
import DateTimePicker from '@react-native-community/datetimepicker';

interface GoalCreateScreenProps {
  navigation: any;
}

export const GoalCreateScreen: React.FC<GoalCreateScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const { createGoal, isLoading } = useGoalStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>(GoalPriority.MEDIUM);
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    'Work', 'Personal', 'Health', 'Learning', 'Finance', 'Relationships', 'Hobbies', 'Other'
  ];

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

  const handleCreateGoal = async () => {
    if (!validateForm()) return;

    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category || 'Other',
        targetDate: targetDate?.toISOString(),
      });

      showSuccess(t('goals.goalCreated'));
      navigation.goBack();
    } catch (error: any) {
      showError(error.message || t('goals.createError'));
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          {t('goals.creating')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
              {t('goals.createGoal')}
            </Text>

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
          onPress={handleCreateGoal}
          style={[styles.actionButton, styles.createButton]}
          disabled={!title.trim() || isLoading}
        >
          {t('goals.createGoal')}
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
  createButton: {
    backgroundColor: theme.colors.primary,
  },
});
