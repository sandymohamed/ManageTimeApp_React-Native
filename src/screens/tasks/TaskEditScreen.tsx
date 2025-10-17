import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, Modal } from 'react-native';
import { Text, TextInput, Card, IconButton, useTheme, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTaskStore } from '@/store/taskStore';
import { TaskPriority, TaskStatus, UpdateTaskData } from '@/types/task';
import { LoadingScreen } from '@/components/LoadingScreen';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';


interface TaskEditScreenProps {
  navigation: any;
  route: {
    params: {
      taskId: string;
    };
  };
}

export const TaskEditScreen: React.FC<TaskEditScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  // const { isRTL } = useLanguage();
  // const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const { tasks, updateTask, isLoading } = useTaskStore();
  const { taskId } = route.params;


  const task = tasks.find(t => t.id === taskId);

  const [formData, setFormData] = useState<UpdateTaskData>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    dueDate: undefined,
    projectId: undefined,
    goalId: undefined,
    assigneeId: undefined,
    tags: [],
    metadata: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [hasTime, setHasTime] = useState(false);


  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        projectId: task.projectId,
        goalId: task.goalId,
        assigneeId: task.assigneeId,
        tags: task.tags,
        metadata: task.metadata || {},
      });
    }
  }, [task]);

  const handleSave = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = t('validation.titleRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateTask(taskId, formData);
      showSuccess(t('tasks.updatedSuccessfully', { title: formData.title }));
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update task:', error);
      showError(t('tasks.updateFailed', { title: formData.title }));
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleDatePress = () => {
    if (formData.dueDate) {
      setSelectedDate(new Date(formData.dueDate));
    }
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setSelectedDate(selectedDate);
      const combinedDateTime = new Date(selectedDate);
      if (hasTime) {
        combinedDateTime.setHours(selectedTime.getHours());
        combinedDateTime.setMinutes(selectedTime.getMinutes());
      }
      setFormData(prev => ({
        ...prev,
        dueDate: combinedDateTime.toISOString(),
      }));
      // Clear date error if it exists
      if (errors.dueDate) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.dueDate;
          return newErrors;
        });
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selectedTime) {
      setSelectedTime(selectedTime);
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(selectedTime.getHours());
      combinedDateTime.setMinutes(selectedTime.getMinutes());
      setFormData(prev => ({
        ...prev,
        dueDate: combinedDateTime.toISOString(),
      }));
      // Clear date error if it exists
      if (errors.dueDate) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.dueDate;
          return newErrors;
        });
      }
    }
  };

  const handleToggleTime = () => {
    setHasTime(!hasTime);
    if (!hasTime) {
      // When enabling time, set to current time
      setSelectedTime(new Date());
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(new Date().getHours());
      combinedDateTime.setMinutes(new Date().getMinutes());
      setFormData(prev => ({
        ...prev,
        dueDate: combinedDateTime.toISOString(),
      }));
    } else {
      // When disabling time, remove time component
      const dateOnly = new Date(selectedDate);
      dateOnly.setHours(0, 0, 0, 0);
      setFormData(prev => ({
        ...prev,
        dueDate: dateOnly.toISOString(),
      }));
    }
  };

  const handleDateConfirm = () => {
    const combinedDateTime = new Date(selectedDate);
    if (hasTime) {
      combinedDateTime.setHours(selectedTime.getHours());
      combinedDateTime.setMinutes(selectedTime.getMinutes());
    }
    setFormData(prev => ({
      ...prev,
      dueDate: combinedDateTime.toISOString(),
    }));
    setShowDatePicker(false);
  };

  const handleDateClear = () => {
    setFormData({
      ...formData,
      dueDate: undefined,
    });
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'alert';
      case TaskPriority.HIGH: return 'arrow-up';
      case TaskPriority.MEDIUM: return 'minus';
      case TaskPriority.LOW: return 'arrow-down';
      default: return 'flag';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return theme.colors.urgent;
      case TaskPriority.HIGH: return theme.colors.high;
      case TaskPriority.MEDIUM: return theme.colors.medium;
      case TaskPriority.LOW: return theme.colors.low;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'circle-outline';
      case TaskStatus.IN_PROGRESS: return 'clock-outline';
      case TaskStatus.DONE: return 'check-circle';
      case TaskStatus.ARCHIVED: return 'archive-outline';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return theme.colors.completed;
      case TaskStatus.IN_PROGRESS: return theme.colors.inProgress;
      case TaskStatus.ARCHIVED: return theme.colors.text;
      default: return theme.colors.pending;
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Updating task..." />;
  }

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <IconButton
            icon="alert-circle"
            size={64}
            iconColor={theme.colors.error}
          />
          <Text variant="headlineSmall" style={[styles.errorTitle, { color: theme.colors.error }]}>
            Task not found
          </Text>
        </View>
      </View>
    );
  }



  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTop}>
          <IconButton
            icon="close"
            size={24}
            iconColor={theme.colors.text}
            onPress={handleCancel}
          />
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('tasks.editTask')}
          </Text>
          <IconButton
            icon="check"
            size={24}
            iconColor={theme.colors.primary}
            onPress={handleSave}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Task Title */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('tasks.title')}
            </Text>
            <TextInput
              mode="outlined"
              value={formData.title || ''}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder={t('tasks.enterTitle')}
              error={!!errors.title}
              style={styles.input}
            />
            {errors.title && (
              <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.title}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Task Description */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('tasks.description')}
            </Text>
            <TextInput
              mode="outlined"
              value={formData.description || ''}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder={t('tasks.enterDescription')}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Priority Selection */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('tasks.priority')}
            </Text>
            <View style={styles.priorityContainer}>
              {Object.values(TaskPriority).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    formData.priority === priority && styles.selectedPriority,
                    { borderColor: getPriorityColor(priority) }
                  ]}
                  onPress={() => setFormData({ ...formData, priority })}
                >
                  <IconButton
                    icon={getPriorityIcon(priority)}
                    size={12}
                    style={{ padding: 0, margin: 0 }} iconColor={getPriorityColor(priority)}
                  />
                  <Text style={[styles.priorityText, { color: getPriorityColor(priority) }]}>
                    {t(`tasks.priority_options.${priority.toLowerCase()}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Status Selection */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('tasks.status')}
            </Text>
            <View style={styles.statusContainer}>
              {Object.values(TaskStatus).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.priorityOption,
                    formData.status === status && styles.selectedStatus,
                    { borderColor: getStatusColor(status) }
                  ]}
                  onPress={() => setFormData({ ...formData, status })}
                >
                  <IconButton
                    icon={getStatusIcon(status)}
                    size={12}
                    style={{ padding: 0, margin: 0 }} iconColor={getStatusColor(status)}
                  />
                  <Text style={[styles.priorityText, { color: getStatusColor(status) }]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Due Date */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('tasks.dueDate')}
            </Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.dateButton} onPress={handleDatePress}>
                <IconButton icon="calendar" size={20} iconColor={theme.colors.primary} />
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  {formData.dueDate ? format(new Date(formData.dueDate), hasTime ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy') : t('tasks.selectDate')}

                  {/* {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : t('tasks.selectDate')} */}
                </Text>
              </TouchableOpacity>
              {formData.dueDate && (
                <IconButton
                  icon="close-circle"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={handleDateClear}
                />
              )}
            </View>


            {/* Time Picker Button */}
            {hasTime && (
              <View >
                <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
                  <IconButton icon="clock" size={20} iconColor={theme.colors.primary} />
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>
                    {format(selectedTime, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Time Toggle */}
            <TouchableOpacity
              style={[styles.timeToggle, { backgroundColor: hasTime ? theme.colors.primaryContainer : theme.colors.surfaceVariant }]}
              onPress={handleToggleTime}
            >
              <IconButton
                icon={hasTime ? "clock" : "clock-outline"}
                size={20}
                iconColor={hasTime ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.timeToggleText, { color: hasTime ? theme.colors.primary : theme.colors.textSecondary }]}>
                {hasTime ? t('tasks.hasTime') : t('tasks.addTime')}
              </Text>
            </TouchableOpacity>

          </Card.Content>
        </Card>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {t('tasks.selectDate')}
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor={theme.colors.text}
                  onPress={() => setShowDatePicker(false)}
                />
              </View>

              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                style={styles.datePicker}
              />

              {Platform.OS === 'ios' && (
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker(false)}
                    style={styles.modalButton}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleDateConfirm}
                    style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  >
                    {t('common.confirm')}
                  </Button>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {t('tasks.selectTime')}
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor={theme.colors.text}
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
                    {t('common.cancel')}
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => setShowTimePicker(false)}
                    style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  >
                    {t('common.confirm')}
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: .3,
    backgroundColor: theme.colors.surfaceVariant,
  },
  selectedPriority: {
    // backgroundColor: theme.colors.primaryContainer,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    margin: 0,
    paddingEnd: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  selectedStatus: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1.5,
  },

  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
    marginRight: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
  timeToggle: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  timeToggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
  },
  timeButton: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginTop: 8,
  },
  // modal:
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: '700',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
});