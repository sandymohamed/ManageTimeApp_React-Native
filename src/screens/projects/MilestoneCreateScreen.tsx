import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, Modal } from 'react-native';
import { Text, Button, TextInput, Card, useTheme, IconButton, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { CreateMilestoneData, MilestoneStatus } from '@/types/project';
import { milestoneService } from '@/services/milestoneService';
import { validateForm, commonRules, validateDateRange } from '@/utils/validation';

interface MilestoneCreateScreenProps {
  navigation: any;
  route: {
    params: {
      projectId: string;
    };
  };
}

export const MilestoneCreateScreen: React.FC<MilestoneCreateScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const { projectId } = route.params;

  const [formData, setFormData] = useState<CreateMilestoneData>({
    title: '',
    description: '',
    startDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateType, setDateType] = useState<'start' | 'due'>('start');

  // Validation rules
  const validationRules = {
    title: commonRules.title,
    description: commonRules.optionalDescription, // Optional description
    startDate: { required: true },
    dueDate: { 
      required: true,
      custom: (value: string) => {
        if (!value) return 'Due date is required';
        if (formData.startDate && validateDateRange(formData.startDate, value)) {
          return 'Due date must be after start date';
        }
        return null;
      }
    }
  };

  const handleSave = async () => {
    // Validate form using validation utility
    const newErrors = validateForm(formData, validationRules);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      await milestoneService.createMilestone(projectId, formData);
      showSuccess(t('milestones.createdSuccessfully', { title: formData.title }));
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to create milestone:', error);
      showError(error.message || t('milestones.createFailed', { title: formData.title }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isFormValid = () => {
    const validationErrors = validateForm(formData, validationRules);
    return Object.keys(validationErrors).length === 0;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString();
      if (dateType === 'start') {
        setFormData(prev => ({ ...prev, startDate: dateString }));
      } else {
        setFormData(prev => ({ ...prev, dueDate: dateString }));
      }
    }
  };

  const openDatePicker = (type: 'start' | 'due') => {
    setDateType(type);
    const currentDate = type === 'start' ? formData.startDate : formData.dueDate;
    if (currentDate) {
      setSelectedDate(new Date(currentDate));
    }
    setShowDatePicker(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.header}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor={theme.colors.primary}
                onPress={() => navigation.goBack()}
              />
              <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
                {t('milestones.createMilestone')}  
              </Text>
              <View style={{ width: 48 }} />
            </View>
          </Card.Content>
        </Card>

        {/* Milestone Information */}
        <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('milestones.milestoneInformation')}
            </Text>

            <TextInput
              label={t('milestones.title')}
              value={formData.title}
              onChangeText={(text) => handleFieldChange('title', text)}
              error={!!errors.title}
              disabled={isLoading}
              style={styles.input}
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.title}>
              {errors.title}
            </HelperText>

            <TextInput
              label={t('milestones.description')}
              value={formData.description}
              onChangeText={(text) => handleFieldChange('description', text)}
              multiline
              numberOfLines={3}
              disabled={isLoading}
              error={!!errors.description}
              style={styles.input}
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.description}>
              {errors.description}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Milestone Dates */}
        <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('milestones.dates')}
            </Text>

            <View style={styles.dateContainer}>
              <View style={styles.dateInputContainer}>
                <TextInput
                  label={t('milestones.startDate')}
                  value={formData.startDate ? new Date(formData.startDate).toLocaleDateString() : ''}
                  editable={false}
                  disabled={isLoading}
                  style={styles.input}
                  mode="outlined"
                  error={!!errors.startDate}
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      onPress={() => !isLoading && openDatePicker('start')}
                    />
                  }
                />
                <HelperText type="error" visible={!!errors.startDate}>
                  {errors.startDate}
                </HelperText>
              </View>

              <View style={styles.dateInputContainer}>
                <TextInput
                  label={t('milestones.endDate')}
                  value={formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : ''}
                  editable={false}
                  disabled={isLoading}
                  style={styles.input}
                  mode="outlined"
                  error={!!errors.dueDate}
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      onPress={() => !isLoading && openDatePicker('due')}
                    />
                  }
                />
                <HelperText type="error" visible={!!errors.dueDate}>
                  {errors.dueDate}
                </HelperText>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading || !isFormValid()}
          style={styles.saveButton}
        >
          {t('common.create')}
        </Button>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t(`milestones.${dateType}Date`)}
              </Text>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
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
                  onPress={() => {
                    handleDateChange(null, selectedDate);
                    setShowDatePicker(false);
                  }}
                  style={styles.modalButton}
                >
                  {t('common.select')}
                </Button>
              </View>
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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  formCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 8,
  },
  dateContainer: {
    gap: 16,
  },
  dateInputContainer: {
    position: 'relative',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    elevation: 5,
    minWidth: 300,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
