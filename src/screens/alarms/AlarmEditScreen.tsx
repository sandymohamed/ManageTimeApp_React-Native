import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, Card, TextInput, Switch, Chip, SegmentedButtons } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/utils/theme';
import { useAlarmStore } from '@/store/alarmStore';
import { UpdateAlarmData, Alarm } from '@/types/alarm';

export const AlarmEditScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { alarmId } = route.params as { alarmId: string };
  const { alarms, updateAlarm, loading } = useAlarmStore();

  // Find the alarm to edit
  const alarm = alarms.find(a => a.id === alarmId);

  // Form state
  const [title, setTitle] = useState(alarm?.title || '');
  const [selectedTime, setSelectedTime] = useState(alarm ? new Date(alarm.time) : new Date());
  const [timezone, setTimezone] = useState(alarm?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [enabled, setEnabled] = useState(alarm?.enabled || true);
  const [recurrence, setRecurrence] = useState(alarm?.recurrenceRule || 'none');
  const [toneUrl, setToneUrl] = useState(alarm?.toneUrl || 'default');
  const [smartWakeWindow, setSmartWakeWindow] = useState(alarm?.smartWakeWindow || 0);
  const [snoozeDuration, setSnoozeDuration] = useState(alarm?.snoozeConfig?.duration || 5);
  const [maxSnoozes, setMaxSnoozes] = useState(alarm?.snoozeConfig?.maxSnoozes || 3);

  // UI state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (alarm) {
      setTitle(alarm.title);
      setSelectedTime(new Date(alarm.time));
      setTimezone(alarm.timezone);
      setEnabled(alarm.enabled);
      setRecurrence(alarm.recurrenceRule || 'none');
      setToneUrl(alarm.toneUrl || 'default');
      setSmartWakeWindow(alarm.smartWakeWindow || 0);
      setSnoozeDuration(alarm.snoozeConfig?.duration || 5);
      setMaxSnoozes(alarm.snoozeConfig?.maxSnoozes || 3);
    }
  }, [alarm]);

  const recurrenceOptions = [
    { value: 'none', label: t('alarms.recurrence.none') },
    { value: 'daily', label: t('alarms.recurrence.daily') },
    { value: 'weekdays', label: t('alarms.recurrence.weekdays') },
    { value: 'weekends', label: t('alarms.recurrence.weekends') },
    { value: 'weekly', label: t('alarms.recurrence.weekly') },
  ];

  const toneOptions = [
    { value: 'default', label: t('alarms.tones.default') },
    { value: 'gentle', label: t('alarms.tones.gentle') },
    { value: 'classic', label: t('alarms.tones.classic') },
    { value: 'digital', label: t('alarms.tones.digital') },
    { value: 'nature', label: t('alarms.tones.nature') },
  ];

  const snoozeOptions = [5, 10, 15, 30];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = t('alarms.titleRequired');
    }

    if (title.length > 100) {
      newErrors.title = t('alarms.titleTooLong');
    }

    if (smartWakeWindow < 0 || smartWakeWindow > 60) {
      newErrors.smartWakeWindow = t('alarms.smartWakeWindowInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateAlarm = async () => {
    if (!alarm || !validateForm()) return;

    try {
      const alarmData: UpdateAlarmData = {
        title: title.trim(),
        time: selectedTime.toISOString(),
        timezone,
        enabled,
        recurrenceRule: recurrence === 'none' ? undefined : recurrence,
        toneUrl: toneUrl === 'default' ? undefined : toneUrl,
        smartWakeWindow: smartWakeWindow > 0 ? smartWakeWindow : undefined,
        snoozeConfig: {
          duration: snoozeDuration,
          maxSnoozes,
        },
      };

      await updateAlarm(alarm.id, alarmData);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update alarm:', error);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!alarm) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={styles.errorText}>
            {t('alarms.alarmNotFound')}
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            {t('common.back')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {t('alarms.editAlarm')}
            </Text>

            {/* Alarm Title */}
            <TextInput
              label={t('alarms.alarmTitle')}
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              error={!!errors.title}
              placeholder={t('alarms.alarmTitlePlaceholder')}
            />
            {errors.title && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.title}
              </Text>
            )}

            {/* Time Selection */}
            <View style={styles.timeSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('alarms.alarmTime')}
              </Text>
              
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                style={styles.timeButton}
                icon="clock-outline">
                {formatTime(selectedTime)}
              </Button>
              
              <Text variant="bodySmall" style={styles.dateText}>
                {formatDate(selectedTime)}
              </Text>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            {/* Recurrence */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('alarms.recurrence.title')}
              </Text>
              
              <SegmentedButtons
                value={recurrence}
                onValueChange={setRecurrence}
                buttons={recurrenceOptions}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Tone Selection */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('alarms.sound')}
              </Text>
              
              <View style={styles.chipContainer}>
                {toneOptions.map((tone) => (
                  <Chip
                    key={tone.value}
                    selected={toneUrl === tone.value}
                    onPress={() => setToneUrl(tone.value)}
                    style={styles.chip}>
                    {tone.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Smart Wake */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('alarms.smartWake')}
                </Text>
                <Switch
                  value={smartWakeWindow > 0}
                  onValueChange={(value) => setSmartWakeWindow(value ? 15 : 0)}
                />
              </View>
              
              {smartWakeWindow > 0 && (
                <Text variant="bodySmall" style={styles.smartWakeDescription}>
                  {t('alarms.smartWakeDescription', { minutes: smartWakeWindow })}
                </Text>
              )}
            </View>

            {/* Snooze Settings */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('alarms.snooze')}
              </Text>
              
              <View style={styles.snoozeContainer}>
                <Text variant="bodyMedium" style={styles.snoozeLabel}>
                  {t('alarms.snoozeDuration')}:
                </Text>
                <View style={styles.chipContainer}>
                  {snoozeOptions.map((duration) => (
                    <Chip
                      key={duration}
                      selected={snoozeDuration === duration}
                      onPress={() => setSnoozeDuration(duration)}
                      style={styles.chip}>
                      {duration} min
                    </Chip>
                  ))}
                </View>
              </View>
            </View>

            {/* Enable/Disable */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('alarms.enabled')}
                </Text>
                <Switch
                  value={enabled}
                  onValueChange={setEnabled}
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
          disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={handleUpdateAlarm}
          style={styles.button}
          loading={loading}
          disabled={loading}>
          {t('alarms.updateAlarm')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  title: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  timeSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timeButton: {
    marginBottom: theme.spacing.sm,
    minWidth: 120,
  },
  dateText: {
    color: theme.colors.textSecondary,
  },
  segmentedButtons: {
    marginTop: theme.spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  chip: {
    marginBottom: theme.spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smartWakeDescription: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  snoozeContainer: {
    marginTop: theme.spacing.sm,
  },
  snoozeLabel: {
    marginBottom: theme.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
});
