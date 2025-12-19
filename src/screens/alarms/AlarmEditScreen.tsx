import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Modal, Alert } from 'react-native';
import { Text, Button, Card, TextInput, SegmentedButtons, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/utils/theme';
import { useAlarmStore } from '@/store/alarmStore';
import { UpdateAlarmData, Alarm } from '@/types/alarm';
import { nativeAlarmBridge } from '@/services/NativeAlarmBridge';

export const AlarmEditScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { alarmId } = route.params as { alarmId: string };
  const { alarms, updateAlarm, loading } = useAlarmStore();

  // Find the alarm to edit
  const alarm = alarms.find(a => a.id === alarmId);

  // Initialize time from alarm or use default
  const getInitialTime = () => {
    if (alarm) {
      return new Date(alarm.time);
    }
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };

  // Use ref to maintain time value and prevent resets
  const timeRef = useRef<Date>(getInitialTime());
  const [title, setTitle] = useState(alarm?.title || 'new alarm');
  const [selectedTime, setSelectedTime] = useState<Date>(() => new Date(timeRef.current));
  const [timezone] = useState(alarm?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [recurrence, setRecurrence] = useState(alarm?.recurrenceRule || 'none');

  // UI state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize default ringtone if not set
  useEffect(() => {
    if (Platform.OS === 'android' && !ringtoneUri) {
      nativeAlarmBridge.getDefaultRingtoneUri().then((uri) => {
        if (uri) {
          setRingtoneUri(uri);
        }
      }).catch((error) => {
        console.error('Failed to get default ringtone:', error);
      });
    }
  }, []);

  // Update state when alarm loads
  useEffect(() => {
    if (alarm) {
      setTitle(alarm.title);
      const alarmTime = new Date(alarm.time);
      timeRef.current = alarmTime;
      setSelectedTime(new Date(alarmTime));
      setRecurrence(alarm.recurrenceRule || 'none');
      setRingtoneUri(alarm.toneUrl || null);
      setRingtoneName(alarm.toneUrl ? 'Custom Ringtone' : 'Default Alarm');
    }
  }, [alarm]);

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

  const handlePickRingtone = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Info', 'Ringtone picker is only available on Android');
      return;
    }

    try {
      const uri = await nativeAlarmBridge.pickRingtone();
      if (uri) {
        setRingtoneUri(uri);
        // Extract ringtone name from URI (simplified)
        const uriParts = uri.split('/');
        const name = uriParts[uriParts.length - 1] || 'Custom Ringtone';
        setRingtoneName(name.replace(/\.(mp3|ogg|wav)$/i, '').replace(/_/g, ' '));
      }
    } catch (error) {
      console.error('Failed to pick ringtone:', error);
      Alert.alert('Error', 'Failed to pick ringtone');
    }
  };

  const handleUpdateAlarm = async () => {
    if (!alarm || !validateForm()) return;

    try {
      // Use the ref value to ensure we have the latest time
      const alarmTime = timeRef.current;
      
      const alarmData: UpdateAlarmData = {
        title: title.trim() || 'new alarm',
        time: alarmTime.toISOString(),
        timezone,
        recurrenceRule: recurrence === 'none' ? undefined : recurrence,
        toneUrl: ringtoneUri || undefined, // Store ringtone URI if selected
      };

      await updateAlarm(alarm.id, alarmData);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to update alarm:', err);
    }
  };

  // Sync selectedTime with timeRef when opening picker
  const handleOpenTimePicker = () => {
    setSelectedTime(new Date(timeRef.current));
    setShowTimePicker(true);
  };

  // Handle iOS confirm - save the current picker value
  const handleConfirmTime = () => {
    timeRef.current = new Date(selectedTime);
    setShowTimePicker(false);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      // Always update state immediately (for iOS spinner mode)
      const newDate = new Date(selectedDate);
      setSelectedTime(newDate);
      // Also update ref immediately
      timeRef.current = newDate;
      
      // On Android, close immediately after selection
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }
    } else if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!alarm) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={styles.errorText}>
            {t('alarms.alarmNotFound') || 'Alarm not found'}
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            {t('common.back') || 'Back'}
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
                onPress={handleOpenTimePicker}
                icon="clock-outline"
                style={styles.timeButton}
              >
                {formatTime(timeRef.current)}
              </Button>
            </View>

            {/* Ringtone Selection */}
            {Platform.OS === 'android' && (
              <View style={styles.recurrenceContainer}>
                <Text variant="bodyLarge" style={styles.label}>
                  {t('alarms.ringtone') || 'Alarm Sound'}
                </Text>
                <Button
                  mode="outlined"
                  onPress={handlePickRingtone}
                  icon="music-note"
                  style={styles.timeButton}
                >
                  {ringtoneName}
                </Button>
              </View>
            )}

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
                onPress={handleUpdateAlarm}
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
                    onPress={handleConfirmTime}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
