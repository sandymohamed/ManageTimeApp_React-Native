import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Modal } from 'react-native';
import { Text, Button, Card, TextInput, SegmentedButtons, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/utils/theme';
import { useAlarmStore } from '@/store/alarmStore';
import { CreateAlarmData } from '@/types/alarm';

export const AlarmCreateScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { createAlarm, loading } = useAlarmStore();

  // Initialize time with current time plus 1 hour (default to future time)
  const getDefaultTime = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };

  // Use ref to maintain time value and prevent resets
  const timeRef = useRef<Date>(getDefaultTime());
  const [title, setTitle] = useState('new alarm');
  const [selectedTime, setSelectedTime] = useState<Date>(timeRef.current);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [recurrence, setRecurrence] = useState('none');

  // UI state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const recurrenceOptions = [
    { value: 'none', label: t('alarms.recurrence.none') || 'None' },
    { value: 'daily', label: t('alarms.recurrence.daily') || 'Daily' },
    { value: 'weekdays', label: t('alarms.recurrence.weekdays') || 'Weekdays' },
    { value: 'weekends', label: t('alarms.recurrence.weekends') || 'Weekends' },
    { value: 'weekly', label: t('alarms.recurrence.weekly') || 'Weekly' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = t('alarms.titleRequired') || 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAlarm = async () => {
    if (!validateForm()) return;

    try {
      // Use the ref value to ensure we have the latest time
      const alarmTime = timeRef.current;
      
      const alarmData: CreateAlarmData = {
        title: title.trim() || 'new alarm',
        time: alarmTime.toISOString(),
        timezone,
        enabled: true,
        recurrenceRule: recurrence === 'none' ? undefined : recurrence,
      };

      await createAlarm(alarmData);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create alarm:', error);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      // Update both ref and state
      timeRef.current = selectedDate;
      setSelectedTime(selectedDate);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            {/* Title */}
            <TextInput
              label={t('alarms.title') || 'Title'}
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              error={!!errors.title}
              placeholder="new alarm"
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}

            {/* Time Picker */}
            <View style={styles.timeContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                {t('alarms.time') || 'Time'}
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                icon="clock-outline"
                style={styles.timeButton}
              >
                {formatTime(selectedTime)}
              </Button>
            </View>

            {/* Recurrence */}
            <View style={styles.recurrenceContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                {t('alarms.recurrence.title') || 'Recurrence'}
              </Text>
              <SegmentedButtons
                value={recurrence}
                onValueChange={setRecurrence}
                buttons={recurrenceOptions}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={loading}
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateAlarm}
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                {t('common.save') || 'Save'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text variant="headlineSmall" style={styles.modalTitle}>
                  {t('alarms.selectTime') || 'Select Time'}
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setShowTimePicker(false)}
                />
              </View>

              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.datePicker}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowTimePicker(false)}
                    style={styles.modalButton}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => setShowTimePicker(false)}
                    style={styles.modalButton}
                  >
                    {t('common.confirm') || 'Confirm'}
                  </Button>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error || '#B00020',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 12,
  },
  timeContainer: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  timeButton: {
    marginTop: 8,
  },
  recurrenceContainer: {
    marginBottom: 24,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface || '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  datePicker: {
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
