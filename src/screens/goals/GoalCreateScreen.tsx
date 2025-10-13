// import React, { useState } from 'react';
// import { View, StyleSheet, ScrollView, Alert } from 'react-native';
// import { 
//   Text, 
//   Card, 
//   TextInput, 
//   Button, 
//   useTheme,
//   ActivityIndicator,
//   Chip,
//   SegmentedButtons,
//   IconButton
// } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
// import { useNotification } from '@/contexts/NotificationContext';
// import { useGoalStore } from '@/store/goalStore';
// import { GoalPriority } from '@/types/goal';
// import DateTimePicker from '@react-native-community/datetimepicker';

// interface GoalCreateScreenProps {
//   navigation: any;
// }

// export const GoalCreateScreen: React.FC<GoalCreateScreenProps> = ({ navigation }) => {
//   const { t } = useTranslation();
//   const { isRTL } = useLanguage();
//   const paperTheme = useTheme();
//   const customTheme = useCustomTheme();
//   const theme = customTheme.theme;
//   const styles = createStyles(theme);
//   const { showSuccess, showError } = useNotification();

//   const { createGoal, isLoading } = useGoalStore();

//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [priority, setPriority] = useState<GoalPriority>(GoalPriority.MEDIUM);
//   const [category, setCategory] = useState('');
//   const [targetDate, setTargetDate] = useState<Date | null>(null);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   const categories = [
//     'Work', 'Personal', 'Health', 'Learning', 'Finance', 'Relationships', 'Hobbies', 'Other'
//   ];

//   const validateForm = () => {
//     const newErrors: { [key: string]: string } = {};

//     if (!title.trim()) {
//       newErrors.title = t('goals.titleRequired');
//     }

//     if (title.length > 100) {
//       newErrors.title = t('goals.titleTooLong');
//     }

//     if (description && description.length > 500) {
//       newErrors.description = t('goals.descriptionTooLong');
//     }

//     if (targetDate && targetDate < new Date()) {
//       newErrors.targetDate = t('goals.targetDateInPast');
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleCreateGoal = async () => {
//     if (!validateForm()) return;

//     try {
//       await createGoal({
//         title: title.trim(),
//         description: description.trim() || undefined,
//         priority,
//         category: category || 'Other',
//         targetDate: targetDate?.toISOString(),
//       });

//       showSuccess(t('goals.goalCreated'));
//       navigation.goBack();
//     } catch (error: any) {
//       showError(error.message || t('goals.createError'));
//     }
//   };

//   const getPriorityColor = (priority: GoalPriority) => {
//     switch (priority) {
//       case GoalPriority.URGENT:
//         return '#F44336';
//       case GoalPriority.HIGH:
//         return '#FF9800';
//       case GoalPriority.MEDIUM:
//         return '#2196F3';
//       case GoalPriority.LOW:
//         return '#4CAF50';
//       default:
//         return theme.colors.primary;
//     }
//   };

//   const renderPrioritySelector = () => (
//     <View style={styles.section}>
//       <Text variant="titleMedium" style={styles.sectionTitle}>
//         {t('goals.priority')}
//       </Text>
//       <SegmentedButtons
//         value={priority}
//         onValueChange={(value) => setPriority(value as GoalPriority)}
//         buttons={[
//           { 
//             value: GoalPriority.LOW, 
//             label: t('goals.priority.low'),
//             style: { backgroundColor: priority === GoalPriority.LOW ? getPriorityColor(GoalPriority.LOW) : undefined }
//           },
//           { 
//             value: GoalPriority.MEDIUM, 
//             label: t('goals.priority.medium'),
//             style: { backgroundColor: priority === GoalPriority.MEDIUM ? getPriorityColor(GoalPriority.MEDIUM) : undefined }
//           },
//           { 
//             value: GoalPriority.HIGH, 
//             label: t('goals.priority.high'),
//             style: { backgroundColor: priority === GoalPriority.HIGH ? getPriorityColor(GoalPriority.HIGH) : undefined }
//           },
//           { 
//             value: GoalPriority.URGENT, 
//             label: t('goals.priority.urgent'),
//             style: { backgroundColor: priority === GoalPriority.URGENT ? getPriorityColor(GoalPriority.URGENT) : undefined }
//           },
//         ]}
//         style={styles.segmentedButtons}
//       />
//     </View>
//   );

//   const renderCategorySelector = () => (
//     <View style={styles.section}>
//       <Text variant="titleMedium" style={styles.sectionTitle}>
//         {t('goals.category')}
//       </Text>
//       <View style={styles.categoryContainer}>
//         {categories.map((cat) => (
//           <Chip
//             key={cat}
//             selected={category === cat}
//             onPress={() => setCategory(cat)}
//             style={[
//               styles.categoryChip,
//               category === cat && { backgroundColor: theme.colors.primary }
//             ]}
//             textStyle={[
//               styles.categoryChipText,
//               category === cat && { color: theme.colors.onPrimary }
//             ]}
//           >
//             {cat}
//           </Chip>
//         ))}
//       </View>
//     </View>
//   );

//   const renderDateSelector = () => (
//     <View style={styles.section}>
//       <Text variant="titleMedium" style={styles.sectionTitle}>
//         {t('goals.targetDate')}
//       </Text>
//       <Button
//         mode="outlined"
//         onPress={() => setShowDatePicker(true)}
//         style={styles.dateButton}
//         icon="calendar"
//       >
//         {targetDate ? targetDate.toLocaleDateString() : t('goals.selectDate')}
//       </Button>
//       {targetDate && (
//         <Button
//           mode="text"
//           onPress={() => setTargetDate(null)}
//           style={styles.clearDateButton}
//           textColor={theme.colors.error}
//         >
//           {t('goals.clearDate')}
//         </Button>
//       )}
//       {errors.targetDate && (
//         <Text variant="bodySmall" style={styles.errorText}>
//           {errors.targetDate}
//         </Text>
//       )}
//     </View>
//   );

//   if (isLoading) {
//     return (
//       <View style={[styles.container, styles.loadingContainer]}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//         <Text variant="bodyLarge" style={styles.loadingText}>
//           {t('goals.creating')}
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         <Card style={styles.card}>
//           <Card.Content>
//             <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
//               {t('goals.createGoal')}
//             </Text>

//             {/* Title Input */}
//             <View style={styles.section}>
//               <TextInput
//                 label={t('goals.goalTitle')}
//                 value={title}
//                 onChangeText={setTitle}
//                 error={!!errors.title}
//                 style={styles.input}
//                 maxLength={100}
//                 multiline
//               />
//               {errors.title && (
//                 <Text variant="bodySmall" style={styles.errorText}>
//                   {errors.title}
//                 </Text>
//               )}
//               <Text variant="bodySmall" style={styles.characterCount}>
//                 {title.length}/100
//               </Text>
//             </View>

//             {/* Description Input */}
//             <View style={styles.section}>
//               <TextInput
//                 label={t('goals.goalDescription')}
//                 value={description}
//                 onChangeText={setDescription}
//                 error={!!errors.description}
//                 style={styles.input}
//                 multiline
//                 numberOfLines={4}
//                 maxLength={500}
//                 placeholder={t('goals.descriptionPlaceholder')}
//               />
//               {errors.description && (
//                 <Text variant="bodySmall" style={styles.errorText}>
//                   {errors.description}
//                 </Text>
//               )}
//               <Text variant="bodySmall" style={styles.characterCount}>
//                 {description.length}/500
//               </Text>
//             </View>

//             {/* Priority Selector */}
//             {renderPrioritySelector()}

//             {/* Category Selector */}
//             {renderCategorySelector()}

//             {/* Target Date Selector */}
//             {renderDateSelector()}
//           </Card.Content>
//         </Card>
//       </ScrollView>

//       {/* Action Buttons */}
//       <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface }]}>
//         <Button
//           mode="outlined"
//           onPress={() => navigation.goBack()}
//           style={styles.actionButton}
//         >
//           {t('common.cancel')}
//         </Button>
//         <Button
//           mode="contained"
//           onPress={handleCreateGoal}
//           style={[styles.actionButton, styles.createButton]}
//           disabled={!title.trim() || isLoading}
//         >
//           {t('goals.createGoal')}
//         </Button>
//       </View>

//       {/* Date Picker Modal */}
//       {showDatePicker && (
//         <DateTimePicker
//           value={targetDate || new Date()}
//           mode="date"
//           display="default"
//           minimumDate={new Date()}
//           onChange={(event, selectedDate) => {
//             setShowDatePicker(false);
//             if (selectedDate) {
//               setTargetDate(selectedDate);
//             }
//           }}
//         />
//       )}
//     </View>
//   );
// };

// const createStyles = (theme: any) => StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   loadingContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 16,
//     color: theme.colors.text,
//   },
//   scrollView: {
//     flex: 1,
//     padding: 16,
//   },
//   card: {
//     elevation: 2,
//   },
//   title: {
//     marginBottom: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     marginBottom: 12,
//     fontWeight: '600',
//     color: theme.colors.text,
//   },
//   input: {
//     backgroundColor: theme.colors.surface,
//   },
//   characterCount: {
//     textAlign: 'right',
//     color: theme.colors.textSecondary,
//     marginTop: 4,
//   },
//   errorText: {
//     color: theme.colors.error,
//     marginTop: 4,
//   },
//   segmentedButtons: {
//     marginTop: 8,
//   },
//   categoryContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: 8,
//   },
//   categoryChip: {
//     marginBottom: 8,
//   },
//   categoryChipText: {
//     fontSize: 12,
//   },
//   dateButton: {
//     marginTop: 8,
//   },
//   clearDateButton: {
//     marginTop: 8,
//     alignSelf: 'flex-start',
//   },
//   actionContainer: {
//     flexDirection: 'row',
//     padding: 16,
//     elevation: 4,
//     gap: 12,
//   },
//   actionButton: {
//     flex: 1,
//   },
//   createButton: {
//     backgroundColor: theme.colors.primary,
//   },
// });


import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import {
  Text,
  Card,
  TextInput,
  Button,
  useTheme,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
  IconButton,
  Avatar,
  Divider,
  FAB,
  Portal,
  Modal,
  TouchableRipple
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { GoalPriority } from '@/types/goal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface GoalCreateScreenProps {
  navigation: any;
}

export const GoalCreateScreen: React.FC<GoalCreateScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const { createGoal, isLoading } = useGoalStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>(GoalPriority.MEDIUM);
  const [category, setCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    { name: 'Work', icon: 'briefcase' },
    { name: 'Personal', icon: 'account' },
    { name: 'Health', icon: 'heart' },
    { name: 'Learning', icon: 'school' },
    { name: 'Finance', icon: 'currency-usd' },
    { name: 'Relationships', icon: 'account-group' },
    { name: 'Hobbies', icon: 'palette' },
    { name: 'Other', icon: 'dots-horizontal' }
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = t('goals.titleRequired');
    }

    if (title.length > 100) {
      newErrors.title = t('goals.titleTooLong');
    }

    if (description && description.length > 500) {
      newErrors.description = t('goals.descriptionTooLong');
    }

    if (targetDate && targetDate < new Date()) {
      newErrors.targetDate = t('goals.targetDateInPast');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateGoal = async () => {
    if (!validateForm()) return;

    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category || 'Other',
        targetDate: targetDate?.toISOString(),
      });

      showSuccess(t('goals.goalCreated'));
      navigation.goBack();
    } catch (error: any) {
      showError(error.message || t('goals.createError'));
    }
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case GoalPriority.URGENT:
        return theme.colors.error || '#F44336';
      case GoalPriority.HIGH:
        return theme.colors.warning || '#FF9800';
      case GoalPriority.MEDIUM:
        return theme.colors.info || '#2196F3';
      case GoalPriority.LOW:
        return theme.colors.success || '#4CAF50';
      default:
        return theme.colors.primary;
    }
  };

  const getPriorityIcon = (priority: GoalPriority) => {
    switch (priority) {
      case GoalPriority.URGENT:
        return 'alert-circle';
      case GoalPriority.HIGH:
        return 'trending-up';
      case GoalPriority.MEDIUM:
        return 'equal';
      case GoalPriority.LOW:
        return 'trending-down';
      default:
        return 'flag';
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : 'dots-horizontal';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <IconButton
        icon="arrow-left"
        size={24}
        iconColor={theme.colors.text}
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      />
      <View style={styles.headerContent}>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('goals.createGoal')}
        </Text>
        <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {t('goals.createGoalDescription')}
        </Text>
      </View>
    </View>
  );

  const renderPrioritySelector = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <IconButton
          icon={getPriorityIcon(priority)}
          size={20}
          iconColor={getPriorityColor(priority)}
          style={styles.sectionIcon}
        />
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('goals.priority')}
        </Text>
      </View>
      <SegmentedButtons
        value={priority}
        onValueChange={(value) => setPriority(value as GoalPriority)}
        buttons={[
          {
            value: GoalPriority.LOW,
            label: t('goals.priority.low'),
            style: {
              backgroundColor: priority === GoalPriority.LOW ? getPriorityColor(GoalPriority.LOW) : theme.colors.surfaceVariant,
              borderColor: getPriorityColor(GoalPriority.LOW)
            },
            labelStyle: { color: priority === GoalPriority.LOW ? theme.colors.onPrimary : getPriorityColor(GoalPriority.LOW) }
          },
          {
            value: GoalPriority.MEDIUM,
            label: t('goals.priority.medium'),
            style: {
              backgroundColor: priority === GoalPriority.MEDIUM ? getPriorityColor(GoalPriority.MEDIUM) : theme.colors.surfaceVariant,
              borderColor: getPriorityColor(GoalPriority.MEDIUM)
            },
            labelStyle: { color: priority === GoalPriority.MEDIUM ? theme.colors.onPrimary : getPriorityColor(GoalPriority.MEDIUM) }
          },
          {
            value: GoalPriority.HIGH,
            label: t('goals.priority.high'),
            style: {
              backgroundColor: priority === GoalPriority.HIGH ? getPriorityColor(GoalPriority.HIGH) : theme.colors.surfaceVariant,
              borderColor: getPriorityColor(GoalPriority.HIGH)
            },
            labelStyle: { color: priority === GoalPriority.HIGH ? theme.colors.onPrimary : getPriorityColor(GoalPriority.HIGH) }
          },
          {
            value: GoalPriority.URGENT,
            label: t('goals.priority.urgent'),
            style: {
              backgroundColor: priority === GoalPriority.URGENT ? getPriorityColor(GoalPriority.URGENT) : theme.colors.surfaceVariant,
              borderColor: getPriorityColor(GoalPriority.URGENT)
            },
            labelStyle: { color: priority === GoalPriority.URGENT ? theme.colors.onPrimary : getPriorityColor(GoalPriority.URGENT) }
          },
        ]}
        style={styles.segmentedButtons}
      />
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <IconButton
          icon={getCategoryIcon(category)}
          size={20}
          iconColor={theme.colors.primary}
          style={styles.sectionIcon}
        />
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('goals.category')}
        </Text>
      </View>
      <TouchableRipple
        onPress={() => setShowCategoryModal(true)}
        style={[styles.categorySelector, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <View style={styles.categorySelectorContent}>
          <View style={styles.selectedCategory}>
            <IconButton
              icon={getCategoryIcon(category)}
              size={20}
              iconColor={theme.colors.primary}
              style={styles.categoryIcon}
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
              {category}
            </Text>
          </View>
          <IconButton
            icon="chevron-down"
            size={20}
            iconColor={theme.colors.textSecondary}
          />
        </View>
      </TouchableRipple>

      {/* Category Modal */}
      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('goals.selectCategory')}
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.text}
              onPress={() => setShowCategoryModal(false)}
            />
          </View>
          <Divider style={[styles.modalDivider, { backgroundColor: theme.colors.surfaceVariant }]} />
          <View style={styles.modalContent}>
            {categories.map((cat) => (
              <TouchableRipple
                key={cat.name}
                onPress={() => {
                  setCategory(cat.name);
                  setShowCategoryModal(false);
                }}
                style={[
                  styles.categoryOption,
                  category === cat.name && { backgroundColor: theme.colors.primary + '15' }
                ]}
              >
                <View style={styles.categoryOptionContent}>
                  <IconButton
                    icon={cat.icon}
                    size={24}
                    iconColor={category === cat.name ? theme.colors.primary : theme.colors.textSecondary}
                    style={styles.categoryOptionIcon}
                  />
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.categoryOptionText,
                      { color: category === cat.name ? theme.colors.primary : theme.colors.text }
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {category === cat.name && (
                    <IconButton
                      icon="check"
                      size={20}
                      iconColor={theme.colors.primary}
                    />
                  )}
                </View>
              </TouchableRipple>
            ))}
          </View>
        </Modal>
      </Portal>
    </View>
  );

  const renderDateSelector = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <IconButton
          icon="calendar"
          size={20}
          iconColor={theme.colors.primary}
          style={styles.sectionIcon}
        />
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('goals.targetDate')}
        </Text>
      </View>
      <TouchableRipple
        onPress={() => setShowDatePicker(true)}
        style={[styles.dateSelector, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <View style={styles.dateSelectorContent}>
          <View style={styles.selectedDate}>
            <IconButton
              icon="calendar"
              size={20}
              iconColor={targetDate ? theme.colors.primary : theme.colors.textSecondary}
              style={styles.dateIcon}
            />
            <Text variant="bodyMedium" style={{ color: targetDate ? theme.colors.text : theme.colors.textSecondary }}>
              {targetDate ? format(targetDate, 'MMMM dd, yyyy') : t('goals.selectDate')}
            </Text>
          </View>
          {targetDate && (
            <IconButton
              icon="close-circle"
              size={20}
              iconColor={theme.colors.error}
              onPress={(e) => {
                e.stopPropagation();
                setTargetDate(null);
              }}
            />
          )}
        </View>
      </TouchableRipple>
      {errors.targetDate && (
        <Text variant="bodySmall" style={styles.errorText}>
          {errors.targetDate}
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.text }]}>
          {t('goals.creating')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.cardContent}>
            {/* Title Input */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconButton
                  icon="format-title"
                  size={20}
                  iconColor={theme.colors.primary}
                  style={styles.sectionIcon}
                />
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t('goals.goalTitle')}
                </Text>
              </View>
              <TextInput
                label={t('goals.goalTitlePlaceholder')}
                value={title}
                onChangeText={setTitle}
                error={!!errors.title}
                style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
                maxLength={100}
                multiline
                mode="outlined"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
              />
              {errors.title && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.title}
                </Text>
              )}
              <View style={styles.characterCountContainer}>
                <Text variant="bodySmall" style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
                  {title.length}/100
                </Text>
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconButton
                  icon="text"
                  size={20}
                  iconColor={theme.colors.primary}
                  style={styles.sectionIcon}
                />
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t('goals.goalDescription')}
                </Text>
              </View>
              <TextInput
                label={t('goals.descriptionPlaceholder')}
                value={description}
                onChangeText={setDescription}
                error={!!errors.description}
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surfaceVariant }]}
                multiline
                numberOfLines={4}
                maxLength={500}
                mode="outlined"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
              />
              {errors.description && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {errors.description}
                </Text>
              )}
              <View style={styles.characterCountContainer}>
                <Text variant="bodySmall" style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
                  {description.length}/500
                </Text>
              </View>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />

            {/* Priority Selector */}
            {renderPrioritySelector()}

            <Divider style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />

            {/* Category Selector */}
            {renderCategorySelector()}

            <Divider style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />

            {/* Target Date Selector */}
            {renderDateSelector()}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={[styles.actionButton, { borderColor: theme.colors.outline }]}
          contentStyle={styles.actionButtonContent}
          textColor={theme.colors.text}
        >
          {t('common.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={handleCreateGoal}
          style={[styles.actionButton, styles.createButton]}
          contentStyle={styles.actionButtonContent}
          disabled={!title.trim() || isLoading}
          icon="check"
        >
          {t('goals.createGoal')}
        </Button>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={targetDate || new Date()}
          mode="date"
          display="spinner"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setTargetDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  backButton: {
    margin: 0,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    margin: 0,
    marginRight: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  input: {
    marginBottom: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 4,
    fontSize: 12,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  categorySelector: {
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    margin: 0,
    marginRight: 8,
  },
  dateSelector: {
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedDate: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateIcon: {
    margin: 0,
    marginRight: 8,
  },
  divider: {
    marginVertical: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    elevation: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontWeight: '600',
    flex: 1,
  },
  modalDivider: {
    marginBottom: 8,
  },
  modalContent: {
    maxHeight: 400,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOptionIcon: {
    margin: 0,
    marginRight: 12,
  },
  categoryOptionText: {
    flex: 1,
    fontWeight: '500',
  },
});