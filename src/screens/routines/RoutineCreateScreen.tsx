import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Card,
  Chip,
  Switch,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { routineService } from '@/services/routineService';
import {
  CreateRoutineData,
  RoutineFrequency,
} from '@/types/routine';
import { useNotification } from '@/contexts/NotificationContext';

const RoutineCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [formData, setFormData] = useState<CreateRoutineData>({
    title: '',
    description: '',
    frequency: 'DAILY',
    schedule: {
      time: undefined,
      days: undefined,
      day: undefined,
    },
    timezone: 'UTC',
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [reminderValue, setReminderValue] = useState<string>('');
  const [reminderUnit, setReminderUnit] = useState<'hours' | 'days' | 'weeks'>('hours');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { value: 0, label: t('routines.sunday') },
    { value: 1, label: t('routines.monday') },
    { value: 2, label: t('routines.tuesday') },
    { value: 3, label: t('routines.wednesday') },
    { value: 4, label: t('routines.thursday') },
    { value: 5, label: t('routines.friday') },
    { value: 6, label: t('routines.saturday') },
  ];

  const handleFrequencyChange = (frequency: RoutineFrequency) => {
    // Reset reminder unit based on frequency
    const defaultUnit = frequency === 'DAILY' ? 'hours' : 'days';
    setReminderUnit(defaultUnit);
    
    setFormData({
      ...formData,
      frequency,
      schedule: {
        ...formData.schedule,
        days: frequency === 'WEEKLY' ? selectedDays : undefined,
        day: frequency === 'MONTHLY' ? selectedDay : undefined,
      },
    });
  };

  const updateReminder = (value: string, unit: 'hours' | 'days' | 'weeks') => {
    setReminderValue(value);
    setReminderUnit(unit);
    if (value && parseInt(value, 10) > 0) {
      const unitChar = unit === 'hours' ? 'h' : unit === 'days' ? 'd' : 'w';
      setFormData({
        ...formData,
        reminderBefore: `${value}${unitChar}`,
      });
    } else {
      setFormData({
        ...formData,
        reminderBefore: undefined,
      });
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedTime(date);
      const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setFormData({
        ...formData,
        schedule: {
          ...formData.schedule,
          time: timeString,
        },
      });
    }
  };

  const toggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort();
    setSelectedDays(newDays);
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        days: newDays,
      },
    });
  };


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate title
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = t('validation.titleRequired');
    }

    // Validate time
    if (!formData.schedule.time) {
      newErrors.time = t('routines.timeRequired') || 'Please select a time';
    }

    // Validate frequency-specific fields
    if (formData.frequency === 'WEEKLY' && (!selectedDays || selectedDays.length === 0)) {
      newErrors.days = t('validation.daysRequired');
    }

    if (formData.frequency === 'MONTHLY' && (!selectedDay || selectedDay < 1 || selectedDay > 31)) {
      newErrors.day = t('routines.dayRequired') || 'Please select a valid day of month (1-31)';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showError(t('validation.pleaseFixErrors'));
      return;
    }

    try {
      setLoading(true);

      // Prepare form data - convert empty description to undefined
      const routineData = {
        ...formData,
        description: formData.description?.trim() || undefined,
      };

      // Backend automatically creates one task with routine title and description
      const routine = await routineService.createRoutine(routineData);

      showSuccess(t('routines.routineCreated'));
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating routine:', error);
      showError(error.message || t('routines.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {t('routines.createRoutine')}
            </Text>

            <TextInput
              label={t('routines.title')}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              error={!!errors.title}
              mode="outlined"
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

            <TextInput
              label={t('routines.description')}
              value={formData.description || ''}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('routines.frequency')}
            </Text>
            <View style={styles.frequencyContainer}>
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RoutineFrequency[]).map((freq) => (
                <Chip
                  key={freq}
                  selected={formData.frequency === freq}
                  onPress={() => handleFrequencyChange(freq)}
                  style={[
                    styles.frequencyChip,
                    formData.frequency === freq && { backgroundColor: theme.colors.primary }
                  ]}
                  textStyle={formData.frequency === freq ? { color: theme.colors.onPrimary } : {}}
                >
                  {t(`routines.${freq.toLowerCase()}`)}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('routines.time')}
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              icon="clock"
              style={[
                styles.timeButton,
                errors.time && { borderColor: theme.colors.error }
              ]}
              textColor={errors.time ? theme.colors.error : theme.colors.primary}
            >
              {formData.schedule.time || t('routines.selectTime')}
            </Button>
            {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('routines.whenToRemind') || 'When to remind you'}
            </Text>
            <View style={styles.reminderContainer}>
              <TextInput
                label={formData.frequency === 'DAILY' 
                  ? (t('routines.hoursBefore') || 'Hours before')
                  : formData.frequency === 'WEEKLY'
                  ? (t('routines.daysBefore') || 'Days before')
                  : (t('routines.daysBefore') || 'Days before')}
                value={reminderValue}
                onChangeText={(text) => {
                  // const numValue = text.replace(/[^0-9]/g, '');
                  updateReminder(text, reminderUnit);
                }}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.reminderInput]}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                placeholder={formData.frequency === 'DAILY' ? '2' : '1'}
              />
              {formData.frequency === 'DAILY' ? (
                <Chip
                  selected={reminderUnit === 'hours'}
                  onPress={() => updateReminder(reminderValue, 'hours')}
                  style={[
                    styles.reminderChip,
                    reminderUnit === 'hours' && { backgroundColor: theme.colors.primary }
                  ]}
                  textStyle={reminderUnit === 'hours' ? { color: theme.colors.onPrimary } : {}}
                >
                  {t('routines.hours') || 'Hours'}
                </Chip>
              ) : (
                <View style={styles.reminderUnitContainer}>
                  <Chip
                    selected={reminderUnit === 'days'}
                    onPress={() => updateReminder(reminderValue, 'days')}
                    style={[
                      styles.reminderChip,
                      reminderUnit === 'days' && { backgroundColor: theme.colors.primary }
                    ]}
                    textStyle={reminderUnit === 'days' ? { color: theme.colors.onPrimary } : {}}
                  >
                    {t('routines.days') || 'Days'}
                  </Chip>
                  {formData.frequency === 'WEEKLY' && (
                    <Chip
                      selected={reminderUnit === 'weeks'}
                      onPress={() => updateReminder(reminderValue, 'weeks')}
                      style={[
                        styles.reminderChip,
                        reminderUnit === 'weeks' && { backgroundColor: theme.colors.primary }
                      ]}
                      textStyle={reminderUnit === 'weeks' ? { color: theme.colors.onPrimary } : {}}
                    >
                      {t('routines.weeks') || 'Weeks'}
                    </Chip>
                  )}
                </View>
              )}
            </View>
            <Text variant="bodySmall" style={[styles.helperText, { color: theme.colors.textSecondary }]}>
              {formData.frequency === 'DAILY' 
                ? (t('routines.reminderHelperDaily') || 'Get reminded before the routine starts')
                : (t('routines.reminderHelperWeekly') || 'Get reminded before the routine occurs')}
            </Text>

            {formData.frequency === 'WEEKLY' && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('routines.selectDays')}
                </Text>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map((day) => (
                    <Chip
                      key={day.value}
                      selected={selectedDays.includes(day.value)}
                      onPress={() => toggleDay(day.value)}
                      style={[
                        styles.dayChip,
                        selectedDays.includes(day.value) && { backgroundColor: theme.colors.primary }
                      ]}
                      textStyle={selectedDays.includes(day.value) ? { color: theme.colors.onPrimary } : {}}
                    >
                      {day.label}
                    </Chip>
                  ))}
                </View>
                {errors.days && <Text style={styles.errorText}>{errors.days}</Text>}
              </>
            )}

            {formData.frequency === 'MONTHLY' && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Day of Month (1-31)
                </Text>
                <TextInput
                  label="Day"
                  value={selectedDay.toString()}
                  onChangeText={(text) => {
                    const day = parseInt(text, 10);
                    if (!isNaN(day) && day >= 1 && day <= 31) {
                      setSelectedDay(day);
                      setFormData({
                        ...formData,
                        schedule: {
                          ...formData.schedule,
                          day,
                        },
                      });
                    }
                  }}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
                {errors.day && <Text style={styles.errorText}>{errors.day}</Text>}
              </>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={loading}
                textColor={theme.colors.primary}
              >
                {t('common.cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                loading={loading}
                disabled={loading}
              >
                {t('common.save')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  frequencyChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  timeButton: {
    marginBottom: 16,
    borderColor: theme.colors.primary,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  taskCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskNumber: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  addTaskButton: {
    marginBottom: 16,
    borderColor: theme.colors.primary,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  reminderInput: {
    flex: 1,
  },
  reminderUnitContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  helperText: {
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 12,
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: theme.colors.primary,
  },
  saveButton: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 12,
  },
});

export { RoutineCreateScreen };