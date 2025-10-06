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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
      setFormData({
        ...formData,
        dueDate: selectedDate.toISOString(),
      });
    }
  };

  const handleDateConfirm = () => {
    setFormData({
      ...formData,
      dueDate: selectedDate.toISOString(),
    });
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
                    size={20}
                    iconColor={getPriorityColor(priority)}
                  />
                  <Text style={[styles.priorityText, { color: getPriorityColor(priority) }]}>
                    {priority}
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
                    styles.statusOption,
                    formData.status === status && styles.selectedStatus,
                    { borderColor: getStatusColor(status) }
                  ]}
                  onPress={() => setFormData({ ...formData, status })}
                >
                  <IconButton
                    icon={getStatusIcon(status)}
                    size={20}
                    iconColor={getStatusColor(status)}
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
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
                  {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : t('tasks.selectDate')}
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
    gap: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: .3,
    backgroundColor: theme.colors.surfaceVariant,
  },
  selectedPriority: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1.5,

  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: .3,
    backgroundColor: theme.colors.surfaceVariant,
  },
  selectedStatus: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
    marginRight: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
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