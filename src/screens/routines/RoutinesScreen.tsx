import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Switch, useTheme, Chip, Modal, Portal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';

interface Routine {
  id: string;
  title: string;
  description?: string;
  time: string;
  days: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  alarmEnabled: boolean;
  createdAt: string;
  completedToday?: boolean;
}

interface RoutinesScreenProps {
  navigation: any;
}

export const RoutinesScreen: React.FC<RoutinesScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    days: [] as string[],
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    alarmEnabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const weekDays = [
    { key: 'monday', label: t('routines.monday') },
    { key: 'tuesday', label: t('routines.tuesday') },
    { key: 'wednesday', label: t('routines.wednesday') },
    { key: 'thursday', label: t('routines.thursday') },
    { key: 'friday', label: t('routines.friday') },
    { key: 'saturday', label: t('routines.saturday') },
    { key: 'sunday', label: t('routines.sunday') },
  ];

  const frequencyOptions = [
    { key: 'daily', label: t('routines.daily') },
    { key: 'weekly', label: t('routines.weekly') },
    { key: 'monthly', label: t('routines.monthly') },
  ];

  // Load routines from storage (you can implement this with AsyncStorage)
  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = () => {
    // Mock data - replace with actual storage implementation
    const mockRoutines: Routine[] = [
      {
        id: '1',
        title: t('routines.morningPrayer'),
        description: t('routines.morningPrayerDesc'),
        time: '05:30',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        frequency: 'daily',
        isActive: true,
        alarmEnabled: true,
        createdAt: new Date().toISOString(),
        completedToday: false,
      },
      {
        id: '2',
        title: t('routines.breakfast'),
        description: t('routines.breakfastDesc'),
        time: '06:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        frequency: 'daily',
        isActive: true,
        alarmEnabled: true,
        createdAt: new Date().toISOString(),
        completedToday: true,
      },
      {
        id: '3',
        title: t('routines.fridayPrayer'),
        description: t('routines.fridayPrayerDesc'),
        time: '13:00',
        days: ['friday'],
        frequency: 'weekly',
        isActive: true,
        alarmEnabled: true,
        createdAt: new Date().toISOString(),
        completedToday: false,
      },
      {
        id: '4',
        title: t('routines.monthlySubscription'),
        description: t('routines.monthlySubscriptionDesc'),
        time: '09:00',
        days: ['1'], // First day of month
        frequency: 'monthly',
        isActive: true,
        alarmEnabled: true,
        createdAt: new Date().toISOString(),
        completedToday: false,
      },
    ];
    setRoutines(mockRoutines);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      time: '',
      days: [],
      frequency: 'daily',
      alarmEnabled: true,
    });
    setSelectedDays([]);
    setErrors({});
  };

  const handleCreateRoutine = () => {
    setEditingRoutine(null);
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setFormData({
      title: routine.title,
      description: routine.description || '',
      time: routine.time,
      days: routine.days,
      frequency: routine.frequency,
      alarmEnabled: routine.alarmEnabled,
    });
    setSelectedDays(routine.days);
    setShowCreateModal(true);
  };

  const handleSaveRoutine = () => {
    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.titleRequired');
    }

    if (!formData.time) {
      newErrors.time = t('validation.timeRequired');
    }

    if (formData.frequency === 'weekly' && selectedDays.length === 0) {
      newErrors.days = t('validation.daysRequired');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const routineData: Routine = {
      id: editingRoutine?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      time: formData.time,
      days: selectedDays,
      frequency: formData.frequency,
      isActive: true,
      alarmEnabled: formData.alarmEnabled,
      createdAt: editingRoutine?.createdAt || new Date().toISOString(),
    };

    if (editingRoutine) {
      setRoutines(prev => prev.map(r => r.id === editingRoutine.id ? routineData : r));
      showSuccess(t('routines.routineUpdated'));
    } else {
      setRoutines(prev => [routineData, ...prev]);
      showSuccess(t('routines.routineCreated'));
    }

    setShowCreateModal(false);
    resetForm();
  };

  const handleDeleteRoutine = (id: string) => {
    Alert.alert(
      t('routines.deleteRoutine'),
      t('routines.deleteRoutineConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setRoutines(prev => prev.filter(r => r.id !== id));
            showSuccess(t('routines.routineDeleted'));
          },
        },
      ]
    );
  };

  const handleToggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const handleToggleAlarm = (id: string) => {
    setRoutines(prev => prev.map(r => 
      r.id === id ? { ...r, alarmEnabled: !r.alarmEnabled } : r
    ));
  };

  const handleCompleteRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => 
      r.id === id ? { ...r, completedToday: !r.completedToday } : r
    ));
  };

  const handleTimePress = () => {
    if (formData.time) {
      const [hours, minutes] = formData.time.split(':');
      setSelectedTime(new Date(2024, 0, 1, parseInt(hours), parseInt(minutes)));
    }
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedTime(selectedDate);
      setFormData(prev => ({
        ...prev,
        time: selectedDate.toTimeString().slice(0, 5),
      }));
    }
    setShowTimePicker(false);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const getFrequencyText = (routine: Routine) => {
    switch (routine.frequency) {
      case 'daily':
        return t('routines.everyDay');
      case 'weekly':
        const dayNames = routine.days.map(day => 
          weekDays.find(wd => wd.key === day)?.label || day
        ).join(', ');
        return `${t('routines.every')} ${dayNames}`;
      case 'monthly':
        return t('routines.everyMonth');
      default:
        return '';
    }
  };

  const renderRoutineCard = (routine: Routine) => (
    <Card key={routine.id} style={[styles.routineCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.routineHeader}>
          <View style={styles.routineTitleContainer}>
            <Text variant="titleMedium" style={[styles.routineTitle, { color: theme.colors.text }]}>
              {routine.title}
            </Text>
            {routine.description && (
              <Text variant="bodyMedium" style={[styles.routineDescription, { color: theme.colors.text }]}>
                {routine.description}
              </Text>
            )}
          </View>
          <View style={styles.routineActions}>
            <IconButton
              icon={routine.completedToday ? 'check-circle' : 'check-circle-outline'}
              size={24}
              iconColor={routine.completedToday ? '#4CAF50' : theme.colors.text}
              onPress={() => handleCompleteRoutine(routine.id)}
            />
            <IconButton
              icon="pencil"
              size={20}
              iconColor={theme.colors.text}
              onPress={() => handleEditRoutine(routine)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => handleDeleteRoutine(routine.id)}
            />
          </View>
        </View>

        <View style={styles.routineDetails}>
          <View style={styles.routineDetailItem}>
            <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.text }]}>
              {t('routines.time')}
            </Text>
            <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.text }]}>
              {routine.time}
            </Text>
          </View>
          
          <View style={styles.routineDetailItem}>
            <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.text }]}>
              {t('routines.frequency')}
            </Text>
            <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.text }]}>
              {getFrequencyText(routine)}
            </Text>
          </View>
        </View>

        <View style={styles.routineControls}>
          <View style={styles.controlItem}>
            <Text variant="bodySmall" style={[styles.controlLabel, { color: theme.colors.text }]}>
              {t('routines.active')}
            </Text>
            <Switch
              value={routine.isActive}
              onValueChange={() => handleToggleRoutine(routine.id)}
              color={theme.colors.primary}
            />
          </View>
          
          <View style={styles.controlItem}>
            <Text variant="bodySmall" style={[styles.controlLabel, { color: theme.colors.text }]}>
              {t('routines.alarm')}
            </Text>
            <Switch
              value={routine.alarmEnabled}
              onValueChange={() => handleToggleAlarm(routine.id)}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCreateModal = () => (
    <Portal>
      <Modal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <ScrollView style={styles.modalContent}>
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.text }]}>
            {editingRoutine ? t('routines.editRoutine') : t('routines.createRoutine')}
          </Text>

          <TextInput
            label={t('routines.title')}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            error={!!errors.title}
            style={styles.input}
          />
          {errors.title && (
            <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.title}
            </Text>
          )}

          <TextInput
            label={t('routines.description')}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <TouchableOpacity style={styles.timeInput} onPress={handleTimePress}>
            <Text variant="bodyMedium" style={[styles.timeInputText, { color: theme.colors.text }]}>
              {formData.time || t('routines.selectTime')}
            </Text>
            <IconButton icon="clock" size={20} iconColor={theme.colors.primary} />
          </TouchableOpacity>
          {errors.time && (
            <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.time}
            </Text>
          )}

          <Text variant="bodyMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('routines.frequency')}
          </Text>
          <View style={styles.frequencySelector}>
            {frequencyOptions.map((option) => (
              <Chip
                key={option.key}
                selected={formData.frequency === option.key}
                onPress={() => setFormData(prev => ({ ...prev, frequency: option.key as any }))}
                style={[
                  styles.frequencyChip,
                  formData.frequency === option.key && { backgroundColor: theme.colors.primary }
                ]}
                textStyle={[
                  styles.frequencyChipText,
                  formData.frequency === option.key && { color: theme.colors.onPrimary }
                ]}
              >
                {option.label}
              </Chip>
            ))}
          </View>

          {formData.frequency === 'weekly' && (
            <>
              <Text variant="bodyMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('routines.selectDays')}
              </Text>
              <View style={styles.daysSelector}>
                {weekDays.map((day) => (
                  <Chip
                    key={day.key}
                    selected={selectedDays.includes(day.key)}
                    onPress={() => toggleDay(day.key)}
                    style={[
                      styles.dayChip,
                      selectedDays.includes(day.key) && { backgroundColor: theme.colors.primary }
                    ]}
                    textStyle={[
                      styles.dayChipText,
                      selectedDays.includes(day.key) && { color: theme.colors.onPrimary }
                    ]}
                  >
                    {day.label}
                  </Chip>
                ))}
              </View>
              {errors.days && (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.days}
                </Text>
              )}
            </>
          )}

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowCreateModal(false)}
              style={styles.modalButton}
            >
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveRoutine}
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
            >
              {editingRoutine ? t('common.update') : t('common.create')}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('routines.myRoutines')}
        </Text>
        <Button
          mode="contained"
          onPress={handleCreateRoutine}
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          icon="plus"
        >
          {t('routines.createRoutine')}
        </Button>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {routines.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyCardContent}>
              <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.text }]}>
                {t('routines.noRoutines')}
              </Text>
              <Button
                mode="outlined"
                onPress={handleCreateRoutine}
                style={styles.emptyButton}
              >
                {t('routines.createFirstRoutine')}
              </Button>
            </Card.Content>
          </Card>
        ) : (
          routines.map(renderRoutineCard)
        )}
      </ScrollView>

      {renderCreateModal()}

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
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  headerTitle: {
    fontWeight: '600',
  },
  createButton: {
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  routineCard: {
    marginBottom: 16,
    elevation: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routineTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  routineTitle: {
    fontWeight: '600',
  },
  routineDescription: {
    marginTop: 4,
    opacity: 0.7,
  },
  routineActions: {
    flexDirection: 'row',
  },
  routineDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routineDetailItem: {
    flex: 1,
  },
  detailLabel: {
    opacity: 0.7,
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '500',
  },
  routineControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  controlItem: {
    alignItems: 'center',
  },
  controlLabel: {
    marginBottom: 4,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyButton: {
    borderRadius: 20,
  },
  modal: {
    margin: 20,
    borderRadius: 20,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    marginBottom: 16,
  },
  timeInputText: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 8,
  },
  frequencySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  frequencyChip: {
    height: 36,
  },
  frequencyChipText: {
    fontSize: 14,
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayChip: {
    height: 36,
  },
  dayChipText: {
    fontSize: 14,
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
  errorText: {
    marginTop: 4,
    marginBottom: 8,
  },
});
