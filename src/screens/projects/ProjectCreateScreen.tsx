import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, Modal } from 'react-native';
import { Text, Button, TextInput, Card, useTheme, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { CreateProjectData, ProjectStatus } from '@/types/project';
import { useProjectStore } from '@/store/projectStore';

interface ProjectCreateScreenProps {
  navigation: any;
}

const PROJECT_COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
  '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#607D8B'
];

export const ProjectCreateScreen: React.FC<ProjectCreateScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const { createProject } = useProjectStore();

  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateType, setDateType] = useState<'start' | 'end'>('start');

  const handleSave = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        newErrors.endDate = t('validation.endDateAfterStart');
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      console.log("formData", formData);

      await createProject(formData);
      showSuccess(t('projects.createdSuccessfully', { name: formData.name }));
      navigation.goBack();
    } catch (error: any) {
      console.error('Create project error:', error);
      showError(t('projects.createError'));
    }
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>
              {t('projects.createProject')}
            </Text>

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.projectName')} *
              </Text>
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t('projects.enterProjectName')}
                error={!!errors.name}
                style={styles.input}
              />
              {errors.name && (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.name}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.description')}
              </Text>
              <TextInput
                mode="outlined"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder={t('projects.enterDescription')}
                multiline
                numberOfLines={3}
                style={styles.input}
              />
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
                <TouchableOpacity style={styles.dateButton} onPress={() => handleDatePress('start')}>
                  <IconButton icon="calendar" size={20} iconColor={theme.colors.primary} />
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : t('projects.selectStartDate')}
                  </Text>
                </TouchableOpacity>
                {formData.startDate && (
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
                <TouchableOpacity style={styles.dateButton} onPress={() => handleDatePress('end')}>
                  <IconButton icon="calendar" size={20} iconColor={theme.colors.primary} />
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>
                    {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : t('projects.selectEndDate')}
                  </Text>
                </TouchableOpacity>
                {formData.endDate && (
                  <IconButton
                    icon="close-circle"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => handleDateClear('end')}
                  />
                )}
              </View>
              {errors.endDate && (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.endDate}
                </Text>
              )}
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
        >
          {t('common.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        >
          {t('projects.createProject')}
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
