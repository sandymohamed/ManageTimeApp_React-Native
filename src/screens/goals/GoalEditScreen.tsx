// import React, { useState, useEffect } from 'react';
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
//   IconButton,
//   Portal,
//   Modal
// } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
// import { useNotification } from '@/contexts/NotificationContext';
// import { useGoalStore } from '@/store/goalStore';
// import { Goal, GoalPriority, GoalStatus } from '@/types/goal';
// import DateTimePicker from '@react-native-community/datetimepicker';

// interface GoalEditScreenProps {
//   navigation: any;
//   route: {
//     params: {
//       goalId: string;
//     };
//   };
// }

// export const GoalEditScreen: React.FC<GoalEditScreenProps> = ({ navigation, route }) => {
//   const { t } = useTranslation();
//   const { isRTL } = useLanguage();
//   const paperTheme = useTheme();
//   const customTheme = useCustomTheme();
//   const theme = customTheme.theme;
//   const styles = createStyles(theme);
//   const { showSuccess, showError } = useNotification();

//   const { currentGoal, fetchGoal, updateGoal, isLoading } = useGoalStore();

//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [priority, setPriority] = useState<GoalPriority>(GoalPriority.MEDIUM);
//   const [status, setStatus] = useState<GoalStatus>(GoalStatus.ACTIVE);
//   const [category, setCategory] = useState('');
//   const [targetDate, setTargetDate] = useState<Date | null>(null);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   const categories = [
//     'Work', 'Personal', 'Health', 'Learning', 'Finance', 'Relationships', 'Hobbies', 'Other'
//   ];

//   useEffect(() => {
//     fetchGoal(route.params.goalId);
//   }, [route.params.goalId]);

//   useEffect(() => {
//     if (currentGoal) {
//       setTitle(currentGoal.title);
//       setDescription(currentGoal.description || '');
//       setPriority(currentGoal.priority);
//       setStatus(currentGoal.status);
//       setCategory(currentGoal.category);
//       if (currentGoal.targetDate) {
//         setTargetDate(new Date(currentGoal.targetDate));
//       }
//     }
//   }, [currentGoal]);

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

//   const handleUpdateGoal = async () => {
//     if (!currentGoal || !validateForm()) return;

//     try {
//       await updateGoal(currentGoal.id, {
//         title: title.trim(),
//         description: description.trim() || undefined,
//         priority,
//         status,
//         category: category || 'Other',
//         targetDate: targetDate?.toISOString(),
//       });

//       showSuccess(t('goals.goalUpdated'));
//       navigation.goBack();
//     } catch (error: any) {
//       showError(error.message || t('goals.updateError'));
//     }
//   };

//   const handleDeleteGoal = async () => {
//     if (!currentGoal) return;

//     try {
//       await useGoalStore.getState().deleteGoal(currentGoal.id);
//       showSuccess(t('goals.goalDeleted'));
//       navigation.navigate('Goals');
//     } catch (error: any) {
//       showError(error.message || t('goals.deleteError'));
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

//   const getStatusColor = (status: GoalStatus) => {
//     switch (status) {
//       case GoalStatus.DONE:
//         return '#4CAF50';
//       case GoalStatus.ACTIVE:
//         return '#2196F3';
//       case GoalStatus.PAUSED:
//         return '#FF9800';
//       case GoalStatus.CANCELLED:
//         return '#9E9E9E';
//       case GoalStatus.DRAFT:
//         return '#9E9E9E';
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

//   const renderStatusSelector = () => (
//     <View style={styles.section}>
//       <Text variant="titleMedium" style={styles.sectionTitle}>
//         {t('goals.status')}
//       </Text>
//       <SegmentedButtons
//         value={status}
//         onValueChange={(value) => setStatus(value as GoalStatus)}
//         buttons={[
//           { 
//             value: GoalStatus.DRAFT, 
//             label: t('goals.status.draft'),
//             style: { backgroundColor: status === GoalStatus.DRAFT ? getStatusColor(GoalStatus.DRAFT) : undefined }
//           },
//           { 
//             value: GoalStatus.ACTIVE, 
//             label: t('goals.status.active'),
//             style: { backgroundColor: status === GoalStatus.ACTIVE ? getStatusColor(GoalStatus.ACTIVE) : undefined }
//           },
//           { 
//             value: GoalStatus.PAUSED, 
//             label: t('goals.status.paused'),
//             style: { backgroundColor: status === GoalStatus.PAUSED ? getStatusColor(GoalStatus.PAUSED) : undefined }
//           },
//           { 
//             value: GoalStatus.DONE, 
//             label: t('goals.status.done'),
//             style: { backgroundColor: status === GoalStatus.DONE ? getStatusColor(GoalStatus.DONE) : undefined }
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

//   const renderDeleteModal = () => (
//     <Portal>
//       <Modal
//         visible={showDeleteModal}
//         onDismiss={() => setShowDeleteModal(false)}
//         contentContainerStyle={[styles.deleteModal, { backgroundColor: theme.colors.surface }]}
//       >
//         <Text variant="titleLarge" style={[styles.deleteModalTitle, { color: theme.colors.text }]}>
//           {t('goals.deleteGoal')}
//         </Text>
//         <Text variant="bodyMedium" style={[styles.deleteModalMessage, { color: theme.colors.textSecondary }]}>
//           {t('goals.deleteConfirmation')}
//         </Text>
//         <View style={styles.deleteModalActions}>
//           <Button
//             mode="outlined"
//             onPress={() => setShowDeleteModal(false)}
//             style={styles.deleteModalButton}
//           >
//             {t('common.cancel')}
//           </Button>
//           <Button
//             mode="contained"
//             onPress={handleDeleteGoal}
//             style={[styles.deleteModalButton, { backgroundColor: '#F44336' }]}
//             textColor="white"
//           >
//             {t('goals.delete')}
//           </Button>
//         </View>
//       </Modal>
//     </Portal>
//   );

//   if (isLoading) {
//     return (
//       <View style={[styles.container, styles.loadingContainer]}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//         <Text variant="bodyLarge" style={styles.loadingText}>
//           {t('goals.loading')}
//         </Text>
//       </View>
//     );
//   }

//   if (!currentGoal) {
//     return (
//       <View style={[styles.container, styles.errorContainer]}>
//         <Text variant="headlineSmall" style={styles.errorTitle}>
//           {t('goals.goalNotFound')}
//         </Text>
//         <Button mode="contained" onPress={() => navigation.goBack()}>
//           {t('common.back')}
//         </Button>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         <Card style={styles.card}>
//           <Card.Content>
//             <View style={styles.header}>
//               <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
//                 {t('goals.editGoal')}
//               </Text>
//               <IconButton
//                 icon="delete"
//                 size={24}
//                 iconColor="#F44336"
//                 onPress={() => setShowDeleteModal(true)}
//               />
//             </View>

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

//             {/* Status Selector */}
//             {renderStatusSelector()}

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
//           onPress={handleUpdateGoal}
//           style={[styles.actionButton, styles.updateButton]}
//           disabled={!title.trim() || isLoading}
//         >
//           {t('goals.updateGoal')}
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

//       {renderDeleteModal()}
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
//   errorContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   errorTitle: {
//     marginBottom: 16,
//     color: theme.colors.text,
//     textAlign: 'center',
//   },
//   scrollView: {
//     flex: 1,
//     padding: 16,
//   },
//   card: {
//     elevation: 2,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   title: {
//     fontWeight: 'bold',
//     flex: 1,
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
//   updateButton: {
//     backgroundColor: theme.colors.primary,
//   },
//   deleteModal: {
//     margin: 20,
//     padding: 20,
//     borderRadius: 16,
//   },
//   deleteModalTitle: {
//     marginBottom: 12,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   deleteModalMessage: {
//     marginBottom: 20,
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   deleteModalActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   deleteModalButton: {
//     flex: 1,
//   },
// });


import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
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
  Portal,
  Modal,
  Avatar,
  Divider,
  TouchableRipple
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { Goal, GoalPriority, GoalStatus } from '@/types/goal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface GoalEditScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
    };
  };
}

export const GoalEditScreen: React.FC<GoalEditScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const { currentGoal, fetchGoal, updateGoal, isLoading } = useGoalStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>(GoalPriority.MEDIUM);
  const [status, setStatus] = useState<GoalStatus>(GoalStatus.ACTIVE);
  const [category, setCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  useEffect(() => {
    fetchGoal(route.params.goalId);
  }, [route.params.goalId]);

  useEffect(() => {
    if (currentGoal) {
      setTitle(currentGoal.title);
      setDescription(currentGoal.description || '');
      setPriority(currentGoal.priority);
      setStatus(currentGoal.status);
      setCategory(currentGoal.category);
      if (currentGoal.targetDate) {
        setTargetDate(new Date(currentGoal.targetDate));
      }
    }
  }, [currentGoal]);

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

  const handleUpdateGoal = async () => {
    if (!currentGoal || !validateForm()) return;

    try {
      await updateGoal(currentGoal.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        category: category || 'Other',
        targetDate: targetDate?.toISOString(),
      });

      showSuccess(t('goals.goalUpdated'));
      navigation.goBack();
    } catch (error: any) {
      showError(error.message || t('goals.updateError'));
    }
  };

  const handleDeleteGoal = async () => {
    if (!currentGoal) return;

    try {
      await useGoalStore.getState().deleteGoal(currentGoal.id);
      showSuccess(t('goals.goalDeleted'));
      navigation.navigate('Goals');
    } catch (error: any) {
      showError(error.message || t('goals.deleteError'));
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

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.DONE:
        return theme.colors.success || '#4CAF50';
      case GoalStatus.ACTIVE:
        return theme.colors.primary || '#2196F3';
      case GoalStatus.PAUSED:
        return theme.colors.warning || '#FF9800';
      case GoalStatus.CANCELLED:
        return theme.colors.textDisabled || '#9E9E9E';
      case GoalStatus.DRAFT:
        return theme.colors.textDisabled || '#9E9E9E';
      default:
        return theme.colors.primary;
    }
  };

  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.DONE:
        return 'check-circle';
      case GoalStatus.ACTIVE:
        return 'play-circle';
      case GoalStatus.PAUSED:
        return 'pause-circle';
      case GoalStatus.CANCELLED:
        return 'cancel';
      case GoalStatus.DRAFT:
        return 'draft';
      default:
        return 'help-circle';
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : 'dots-horizontal';
  };

  const getGoalIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'health': 'heart',
      'fitness': 'run',
      'career': 'briefcase',
      'education': 'school',
      'finance': 'currency-usd',
      'personal': 'account',
      'family': 'home',
      'travel': 'airplane',
    };
    return icons[category.toLowerCase()] || 'target';
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
          {t('goals.editGoal')}
        </Text>
        <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {t('goals.editGoalDescription')}
        </Text>
      </View>
      <IconButton
        icon="delete"
        size={24}
        iconColor={theme.colors.error}
        onPress={() => setShowDeleteModal(true)}
        style={styles.deleteButton}
      />
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
          {t('goals.priorities')}
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

  const renderStatusSelector = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <IconButton
          icon={getStatusIcon(status)}
          size={20}
          iconColor={getStatusColor(status)}
          style={styles.sectionIcon}
        />
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('goals.status')}
        </Text>
      </View>
      <SegmentedButtons
        value={status}
        onValueChange={(value) => setStatus(value as GoalStatus)}
        buttons={[
          { 
            value: GoalStatus.DRAFT, 
            label: t('goals.status.draft'),
            style: { 
              backgroundColor: status === GoalStatus.DRAFT ? getStatusColor(GoalStatus.DRAFT) : theme.colors.surfaceVariant,
              borderColor: getStatusColor(GoalStatus.DRAFT)
            },
            labelStyle: { color: status === GoalStatus.DRAFT ? theme.colors.onPrimary : getStatusColor(GoalStatus.DRAFT) }
          },
          { 
            value: GoalStatus.ACTIVE, 
            label: t('goals.status.active'),
            style: { 
              backgroundColor: status === GoalStatus.ACTIVE ? getStatusColor(GoalStatus.ACTIVE) : theme.colors.surfaceVariant,
              borderColor: getStatusColor(GoalStatus.ACTIVE)
            },
            labelStyle: { color: status === GoalStatus.ACTIVE ? theme.colors.onPrimary : getStatusColor(GoalStatus.ACTIVE) }
          },
          { 
            value: GoalStatus.PAUSED, 
            label: t('goals.status.paused'),
            style: { 
              backgroundColor: status === GoalStatus.PAUSED ? getStatusColor(GoalStatus.PAUSED) : theme.colors.surfaceVariant,
              borderColor: getStatusColor(GoalStatus.PAUSED)
            },
            labelStyle: { color: status === GoalStatus.PAUSED ? theme.colors.onPrimary : getStatusColor(GoalStatus.PAUSED) }
          },
          { 
            value: GoalStatus.DONE, 
            label: t('goals.status.done'),
            style: { 
              backgroundColor: status === GoalStatus.DONE ? getStatusColor(GoalStatus.DONE) : theme.colors.surfaceVariant,
              borderColor: getStatusColor(GoalStatus.DONE)
            },
            labelStyle: { color: status === GoalStatus.DONE ? theme.colors.onPrimary : getStatusColor(GoalStatus.DONE) }
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

  const renderDeleteModal = () => (
    <Portal>
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        contentContainerStyle={[styles.deleteModal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.deleteModalHeader}>
          <Avatar.Icon 
            size={60} 
            icon="alert-circle" 
            style={[styles.deleteModalIcon, { backgroundColor: theme.colors.error + '20' }]}
            color={theme.colors.error}
          />
          <Text variant="titleLarge" style={[styles.deleteModalTitle, { color: theme.colors.text }]}>
            {t('goals.deleteGoal')}
          </Text>
          <Text variant="bodyMedium" style={[styles.deleteModalMessage, { color: theme.colors.textSecondary }]}>
            {t('goals.deleteConfirmation')}
          </Text>
          {currentGoal && (
            <Card style={[styles.deleteGoalCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Card.Content style={styles.deleteGoalContent}>
                <View style={styles.deleteGoalHeader}>
                  <IconButton
                    icon={getGoalIcon(currentGoal.category)}
                    size={20}
                    iconColor={getPriorityColor(currentGoal.priority)}
                    style={styles.deleteGoalIcon}
                  />
                  <Text variant="titleSmall" style={[styles.deleteGoalTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {currentGoal.title}
                  </Text>
                </View>
                <Text variant="bodySmall" style={[styles.deleteGoalCategory, { color: theme.colors.textSecondary }]}>
                  {currentGoal.category} • {t(`goals.priority.${currentGoal.priority.toLowerCase()}`)}
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
        <View style={styles.deleteModalActions}>
          <Button
            mode="outlined"
            onPress={() => setShowDeleteModal(false)}
            style={[styles.deleteModalButton, { borderColor: theme.colors.outline }]}
            contentStyle={styles.deleteModalButtonContent}
            textColor={theme.colors.text}
          >
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleDeleteGoal}
            style={[styles.deleteModalButton, { backgroundColor: theme.colors.error }]}
            contentStyle={styles.deleteModalButtonContent}
            textColor={theme.colors.onError}
            icon="delete"
          >
            {t('goals.delete')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.text }]}>
          {t('goals.loading')}
        </Text>
      </View>
    );
  }

  if (!currentGoal) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Avatar.Icon 
          size={80} 
          icon="alert-circle" 
          style={[styles.errorIcon, { backgroundColor: theme.colors.surfaceVariant }]}
          color={theme.colors.error}
        />
        <Text variant="headlineSmall" style={[styles.errorTitle, { color: theme.colors.text }]}>
          {t('goals.goalNotFound')}
        </Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          contentStyle={styles.backButtonContent}
        >
          {t('common.back')}
        </Button>
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

            {/* Status Selector */}
            {renderStatusSelector()}

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
          onPress={handleUpdateGoal}
          style={[styles.actionButton, styles.updateButton]}
          contentStyle={styles.actionButtonContent}
          disabled={!title.trim() || isLoading}
          icon="check"
        >
          {t('goals.updateGoal')}
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

      {renderDeleteModal()}
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    borderRadius: 12,
  },
  backButtonContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  // backButton: {
  //   margin: 0,
  //   marginRight: 12,
  // },
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
  deleteButton: {
    margin: 0,
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
  updateButton: {
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
  deleteModal: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteModalHeader: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  deleteModalIcon: {
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalMessage: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  deleteGoalCard: {
    width: '100%',
    marginTop: 8,
  },
  deleteGoalContent: {
    paddingVertical: 12,
  },
  deleteGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteGoalIcon: {
    margin: 0,
    marginRight: 8,
  },
  deleteGoalTitle: {
    flex: 1,
    fontWeight: '500',
  },
  deleteGoalCategory: {
    fontSize: 12,
    marginLeft: 32,
  },
  deleteModalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  deleteModalButtonContent: {
    paddingVertical: 8,
  },
});