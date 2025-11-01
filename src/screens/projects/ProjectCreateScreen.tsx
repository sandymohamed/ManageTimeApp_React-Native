import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, Modal, ActivityIndicator } from 'react-native';
import { Text, Button, TextInput, Card, useTheme, IconButton, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { CreateProjectData, UpdateProjectData, ProjectStatus } from '@/types/project';
import { useProjectStore } from '@/store/projectStore';
import { validateForm, commonRules, validateDateRange } from '@/utils/validation';

interface ProjectCreateScreenProps {
  navigation: any;
}

type ProjectCreateScreenRouteProp = RouteProp<
  {
    ProjectCreate: undefined;
    ProjectEdit: { projectId: string };
  },
  'ProjectCreate' | 'ProjectEdit'
>;

const PROJECT_COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
  '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#607D8B'
];

export const ProjectCreateScreen: React.FC<ProjectCreateScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const route = useRoute<ProjectCreateScreenRouteProp>();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  // Check if we're in edit mode
  const projectId = 'projectId' in route.params ? route.params.projectId : undefined;
  const isEditMode = !!projectId;

  const { createProject, updateProject, fetchProject, currentProject } = useProjectStore();

  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateType, setDateType] = useState<'start' | 'end'>('start');

  // Load project data if in edit mode
  useEffect(() => {
    if (isEditMode && projectId) {
      loadProjectData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;

    try {
      setIsLoadingData(true);
      await fetchProject(projectId);

      if (currentProject) {
        setFormData({
          name: currentProject.name || '',
          description: currentProject.description || '',
          color: currentProject.color || PROJECT_COLORS[0],
          startDate: currentProject.startDate || undefined,
          endDate: currentProject.endDate || undefined,
        });

        // Set selected date based on the project's date
        if (currentProject.startDate) {
          setSelectedDate(new Date(currentProject.startDate));
        }
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      showError(t('projects.loadError'));
      navigation.goBack();
    } finally {
      setIsLoadingData(false);
    }
  };

  // Validation rules
  const validationRules = {
    name: commonRules.name,
    description: commonRules.optionalDescription, // Optional description with max length
    startDate: {
      custom: (value: string) => {
        if (!value) return null;
        if (formData.endDate && validateDateRange(value, formData.endDate)) {
          return 'Start date must be before end date';
        }
        return null;
      }
    },
    endDate: {
      custom: (value: string) => {
        if (!value) return null;
        if (formData.startDate && validateDateRange(formData.startDate, value)) {
          return 'End date must be after start date';
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
      if (isEditMode && projectId) {
        // Update existing project
        const updateData: UpdateProjectData = {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          startDate: formData.startDate,
          endDate: formData.endDate,
        };
        await updateProject(projectId, updateData);
        showSuccess(t('projects.updatedSuccessfully', { name: formData.name }));
      } else {
        // Create new project
        console.log("formData", formData);
        await createProject(formData);
        showSuccess(t('projects.createdSuccessfully', { name: formData.name }));
      }
      navigation.goBack();
    } catch (error: any) {
      console.error(`${isEditMode ? 'Update' : 'Create'} project error:`, error);
      showError(error.message || (isEditMode ? t('projects.updateError') : t('projects.createError')));
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

  const handleDatePress = (type: 'start' | 'end') => {
    setDateType(type);
    if (type === 'start' && formData.startDate) {
      setSelectedDate(new Date(formData.startDate));
    } else if (type === 'end' && formData.endDate) {
      setSelectedDate(new Date(formData.endDate));
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
        [dateType === 'start' ? 'startDate' : 'endDate']: selectedDate.toISOString(),
      });
    }
  };

  const handleDateConfirm = () => {
    setFormData({
      ...formData,
      [dateType === 'start' ? 'startDate' : 'endDate']: selectedDate.toISOString(),
    });
    setShowDatePicker(false);
  };

  const handleDateClear = (type: 'start' | 'end') => {
    setFormData({
      ...formData,
      [type === 'start' ? 'startDate' : 'endDate']: undefined,
    });
  };

  // Show loading screen while fetching project data
  if (isLoadingData && isEditMode) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>
              {isEditMode ? t('projects.editProject') : t('projects.createProject')}
            </Text>

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.projectName')} *
              </Text>
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) => handleFieldChange('name', text)}
                placeholder={t('projects.enterProjectName')}
                error={!!errors.name}
                disabled={isLoading}
                style={styles.input}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>
            </View>

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.description')}
              </Text>
              <TextInput
                mode="outlined"
                value={formData.description}
                onChangeText={(text) => handleFieldChange('description', text)}
                placeholder={t('projects.enterDescription')}
                multiline
                numberOfLines={3}
                disabled={isLoading}
                error={!!errors.description}
                style={styles.input}
              />
              <HelperText type="error" visible={!!errors.description}>
                {errors.description}
              </HelperText>
            </View>

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.color')}
              </Text>
              <View style={styles.colorPicker}>
                {PROJECT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.selectedColor
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  >
                    {formData.color === color && (
                      <IconButton
                        icon="check"
                        size={16}
                        iconColor="white"
                        style={styles.colorCheck}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.startDate')}
              </Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity 
                  style={[styles.dateButton, isLoading && styles.disabledButton]} 
                  onPress={() => !isLoading && handleDatePress('start')}
                  disabled={isLoading}
                >
                  <IconButton icon="calendar" size={20} iconColor={theme.colors.primary} />
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : t('projects.selectStartDate')}
                  </Text>
                </TouchableOpacity>
                {formData.startDate && !isLoading && (
                  <IconButton
                    icon="close-circle"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => handleDateClear('start')}
                  />
                )}
              </View>
            </View>

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.endDate')}
              </Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity 
                  style={[styles.dateButton, isLoading && styles.disabledButton]} 
                  onPress={() => !isLoading && handleDatePress('end')}
                  disabled={isLoading}
                >
                  <IconButton icon="calendar" size={20} iconColor={theme.colors.primary} />
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>
                    {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : t('projects.selectEndDate')}
                  </Text>
                </TouchableOpacity>
                {formData.endDate && !isLoading && (
                  <IconButton
                    icon="close-circle"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => handleDateClear('end')}
                  />
                )}
              </View>
              <HelperText type="error" visible={!!errors.endDate}>
                {errors.endDate}
              </HelperText>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isLoading || isLoadingData}
          disabled={isLoading || isLoadingData || !isFormValid()}
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        >
          {isEditMode ? t('common.save') : t('projects.createProject')}
        </Button>
      </View>

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
                  {dateType === 'start' ? t('projects.selectStartDate') : t('projects.selectEndDate')}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 24,
    fontWeight: '700',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    marginTop: 4,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  colorCheck: {
    margin: 0,
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
  disabledButton: {
    opacity: 0.6,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
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
});
