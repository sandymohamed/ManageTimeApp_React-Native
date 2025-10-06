import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Chip, 
  Menu, 
  Divider,
  HelperText,
  IconButton
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { TaskPriority, TaskStatus, CreateTaskData, UpdateTaskData } from '@/types/task';
import { theme } from '@/utils/theme';

interface TaskFormProps {
  data: CreateTaskData | UpdateTaskData;
  errors: Record<string, string>;
  onChange: (field: keyof (CreateTaskData | UpdateTaskData), value: any) => void;
  mode: 'create' | 'edit';
}

export const TaskForm: React.FC<TaskFormProps> = ({ data, errors, onChange, mode }) => {
  const { t } = useTranslation();
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !data.tags?.includes(tagInput.trim())) {
      onChange('tags', [...(data.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange('tags', data.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const handleDateChange = (field: 'dueDate', value: string) => {
    onChange(field, value);
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return t('tasks.priority.urgent');
      case TaskPriority.HIGH:
        return t('tasks.priority.high');
      case TaskPriority.MEDIUM:
        return t('tasks.priority.medium');
      case TaskPriority.LOW:
        return t('tasks.priority.low');
      default:
        return priority;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return t('tasks.status_options.todo');
      case TaskStatus.IN_PROGRESS:
        return t('tasks.status_options.inProgress');
      case TaskStatus.DONE:
        return t('tasks.status_options.completed');
      case TaskStatus.CANCELLED:
        return t('tasks.status_options.cancelled');
      case TaskStatus.ARCHIVED:
        return t('tasks.status_options.archived');
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return theme.colors.error;
      case TaskPriority.HIGH:
        return theme.colors.warning;
      case TaskPriority.MEDIUM:
        return theme.colors.info;
      case TaskPriority.LOW:
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return theme.colors.success;
      case TaskStatus.IN_PROGRESS:
        return theme.colors.info;
      case TaskStatus.CANCELLED:
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.field}>
        <TextInput
          label={t('tasks.title')}
          value={data.title || ''}
          onChangeText={(text) => onChange('title', text)}
          error={!!errors.title}
          mode="outlined"
          style={styles.input}
        />
        {errors.title && <HelperText type="error">{errors.title}</HelperText>}
      </View>

      {/* Description */}
      <View style={styles.field}>
        <TextInput
          label={t('tasks.description')}
          value={data.description || ''}
          onChangeText={(text) => onChange('description', text)}
          error={!!errors.description}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />
        {errors.description && <HelperText type="error">{errors.description}</HelperText>}
      </View>

      {/* Priority and Status */}
      <View style={styles.row}>
        <View style={[styles.field, styles.halfField]}>
          <Text variant="bodyMedium" style={styles.label}>
            {t('tasks.priority')} oooo
          </Text>
          <Menu
            visible={priorityMenuVisible}
            onDismiss={() => setPriorityMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setPriorityMenuVisible(true)}
                style={styles.menuButton}
                contentStyle={styles.menuButtonContent}>
               sssssssssssssssssssssssssssssssss {getPriorityLabel(data.priority || TaskPriority.MEDIUM)} 111111111111111
              </Button>
            }>
            {Object.values(TaskPriority).map((priority) => (
              <Menu.Item
                key={priority}
                onPress={() => {
                  onChange('priority', priority);
                  setPriorityMenuVisible(false);
                }}
                title={getPriorityLabel(priority)}
                titleStyle={{ color: getPriorityColor(priority) }}
              />
            ))}
          </Menu>
        </View>

        <View style={[styles.field, styles.halfField]}>
          <Text variant="bodyMedium" style={styles.label}>
            {t('tasks.status_options')}
          </Text>
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setStatusMenuVisible(true)}
                style={styles.menuButton}
                contentStyle={styles.menuButtonContent}>
                {getStatusLabel(data.status || TaskStatus.TODO)}
              </Button>
            }>
            {Object.values(TaskStatus).map((status) => (
              <Menu.Item
                key={status}
                onPress={() => {
                  onChange('status', status);
                  setStatusMenuVisible(false);
                }}
                title={getStatusLabel(status)}
                titleStyle={{ color: getStatusColor(status) }}
              />
            ))}
          </Menu>
        </View>
      </View>

      {/* Due Date */}
      <View style={styles.field}>
        <TextInput
          label={t('tasks.dueDate')}
          value={data.dueDate || ''}
          onChangeText={(text) => handleDateChange('dueDate', text)}
          error={!!errors.dueDate}
          mode="outlined"
          placeholder="YYYY-MM-DD"
          style={styles.input}
        />
        {errors.dueDate && <HelperText type="error">{errors.dueDate}</HelperText>}
      </View>

      {/* Project and Goal */}
      <View style={styles.row}>
        <View style={[styles.field, styles.halfField]}>
          <TextInput
            label={t('tasks.projectId')}
            value={data.projectId || ''}
            onChangeText={(text) => onChange('projectId', text)}
            error={!!errors.projectId}
            mode="outlined"
            style={styles.input}
          />
          {errors.projectId && <HelperText type="error">{errors.projectId}</HelperText>}
        </View>

        <View style={[styles.field, styles.halfField]}>
          <TextInput
            label={t('tasks.goalId')}
            value={data.goalId || ''}
            onChangeText={(text) => onChange('goalId', text)}
            error={!!errors.goalId}
            mode="outlined"
            style={styles.input}
          />
          {errors.goalId && <HelperText type="error">{errors.goalId}</HelperText>}
        </View>
      </View>

      {/* Assignee */}
      <View style={styles.field}>
        <TextInput
          label={t('tasks.assigneeId')}
          value={data.assigneeId || ''}
          onChangeText={(text) => onChange('assigneeId', text)}
          error={!!errors.assigneeId}
          mode="outlined"
          style={styles.input}
        />
        {errors.assigneeId && <HelperText type="error">{errors.assigneeId}</HelperText>}
      </View>

      {/* Tags */}
      <View style={styles.field}>
        <Text variant="bodyMedium" style={styles.label}>
          {t('tasks.tags')} taaaaaaaaaaaaaaag
        </Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            mode="outlined"
            placeholder={t('tasks.addTag')}
            style={styles.tagInput}
            onSubmitEditing={handleAddTag}
          />
          <IconButton
            icon="plus"
            size={20}
            onPress={handleAddTag}
            iconColor={theme.colors.primary}
          />
        </View>
        {data.tags && data.tags.length > 0 && (
          <View style={styles.tags}>
            {data.tags.map((tag, index) => (
              <Chip
                key={index}
                mode="outlined"
                onClose={() => handleRemoveTag(tag)}
                style={styles.tag}>
                {tag}
              </Chip>
            ))}
          </View>
        )}
      </View>

      {/* Metadata */}
      {data.metadata && (
        <View style={styles.field}>
          <Text variant="bodyMedium" style={styles.label}>
            {t('tasks.metadata')}
          </Text>
          <View style={styles.metadataContainer}>
            {data.metadata.durationMinutes && (
              <Text variant="bodySmall" style={styles.metadataText}>
                {t('tasks.duration')}: {data.metadata.durationMinutes} min
              </Text>
            )}
            {data.metadata.estimatedHours && (
              <Text variant="bodySmall" style={styles.metadataText}>
                {t('tasks.estimated')}: {data.metadata.estimatedHours} h
              </Text>
            )}
            {data.metadata.category && (
              <Text variant="bodySmall" style={styles.metadataText}>
                {t('tasks.category')}: {data.metadata.category}
              </Text>
            )}
            {data.metadata.location && (
              <Text variant="bodySmall" style={styles.metadataText}>
                {t('tasks.location')}: {data.metadata.location}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.sm,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  menuButton: {
    justifyContent: 'flex-start',
  },
  menuButtonContent: {
    justifyContent: 'flex-start',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    marginRight: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  tag: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  metadataContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  metadataText: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
});
