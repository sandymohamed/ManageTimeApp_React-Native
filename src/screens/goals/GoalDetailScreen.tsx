// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
// import { 
//   Text, 
//   Card, 
//   Button, 
//   useTheme,
//   ActivityIndicator,
//   Chip,
//   ProgressBar,
//   IconButton,
//   Portal,
//   Modal,
//   FAB,
//   Divider
// } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
// import { useNotification } from '@/contexts/NotificationContext';
// import { useGoalStore } from '@/store/goalStore';
// import { Goal, GoalStatus, GoalPriority, Milestone, MilestoneStatus } from '@/types/goal';
// import { format, isAfter, isBefore, differenceInDays } from 'date-fns';

// interface GoalDetailScreenProps {
//   navigation: any;
//   route: {
//     params: {
//       goalId: string;
//     };
//   };
// }

// export const GoalDetailScreen: React.FC<GoalDetailScreenProps> = ({ navigation, route }) => {
//   const { t } = useTranslation();
//   const { isRTL } = useLanguage();
//   const paperTheme = useTheme();
//   const customTheme = useCustomTheme();
//   const theme = customTheme.theme;
//   const styles = createStyles(theme);
//   const { showSuccess, showError } = useNotification();

//   const { 
//     currentGoal, 
//     fetchGoal, 
//     updateGoal, 
//     completeGoal, 
//     pauseGoal, 
//     resumeGoal, 
//     cancelGoal,
//     createMilestone,
//     updateMilestone,
//     completeMilestone,
//     isLoading 
//   } = useGoalStore();

//   const [refreshing, setRefreshing] = useState(false);
//   const [showMilestoneModal, setShowMilestoneModal] = useState(false);
//   const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

//   useEffect(() => {
//     fetchGoal(route.params.goalId);
//   }, [route.params.goalId]);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchGoal(route.params.goalId);
//     setRefreshing(false);
//   };

//   const handleGoalAction = async (action: 'complete' | 'pause' | 'resume' | 'cancel') => {
//     if (!currentGoal) return;

//     try {
//       switch (action) {
//         case 'complete':
//           await completeGoal(currentGoal.id);
//           showSuccess(t('goals.completedSuccessfully', { title: currentGoal.title }));
//           break;
//         case 'pause':
//           await pauseGoal(currentGoal.id);
//           showSuccess(t('goals.pausedSuccessfully', { title: currentGoal.title }));
//           break;
//         case 'resume':
//           await resumeGoal(currentGoal.id);
//           showSuccess(t('goals.resumedSuccessfully', { title: currentGoal.title }));
//           break;
//         case 'cancel':
//           await cancelGoal(currentGoal.id);
//           showSuccess(t('goals.cancelledSuccessfully', { title: currentGoal.title }));
//           break;
//       }
//     } catch (error: any) {
//       showError(error.message || t('goals.actionFailed'));
//     }
//   };

//   const handleMilestoneAction = async (milestone: Milestone, action: 'complete' | 'edit') => {
//     if (!currentGoal) return;

//     try {
//       if (action === 'complete') {
//         await completeMilestone(currentGoal.id, milestone.id);
//         showSuccess(t('goals.milestoneCompleted', { title: milestone.title }));
//       } else if (action === 'edit') {
//         setSelectedMilestone(milestone);
//         setShowMilestoneModal(true);
//       }
//     } catch (error: any) {
//       showError(error.message || t('goals.milestoneActionFailed'));
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
//         return theme.colors.textSecondary;
//     }
//   };

//   const getMilestoneStatusColor = (status: MilestoneStatus) => {
//     switch (status) {
//       case MilestoneStatus.DONE:
//         return '#4CAF50';
//       case MilestoneStatus.IN_PROGRESS:
//         return '#2196F3';
//       case MilestoneStatus.TODO:
//         return '#9E9E9E';
//       default:
//         return theme.colors.textSecondary;
//     }
//   };

//   const getTimeStatus = (targetDate?: string) => {
//     if (!targetDate) return null;

//     const target = new Date(targetDate);
//     const now = new Date();

//     if (isBefore(target, now)) return { text: t('goals.overdue'), color: '#F44336' };

//     const daysLeft = differenceInDays(target, now);
//     if (daysLeft <= 7) return { text: t('goals.dueInDays', { days: daysLeft }), color: '#FF9800' };

//     return { text: format(target, 'MMM dd, yyyy'), color: theme.colors.textSecondary };
//   };

//   const renderGoalHeader = () => {
//     if (!currentGoal) return null;

//     const timeStatus = getTimeStatus(currentGoal.targetDate);
//     const completedMilestones = currentGoal.milestones.filter(m => m.status === MilestoneStatus.DONE).length;
//     const totalMilestones = currentGoal.milestones.length;

//     return (
//       <Card style={[styles.headerCard, { borderLeftColor: getPriorityColor(currentGoal.priority) }]}>
//         <Card.Content>
//           <View style={styles.goalHeader}>
//             <Text variant="headlineSmall" style={styles.goalTitle}>
//               {currentGoal.title}
//             </Text>
//             <View style={styles.goalBadges}>
//               <Chip
//                 mode="outlined"
//                 compact
//                 textStyle={[styles.priorityChipText, { color: getPriorityColor(currentGoal.priority) }]}
//                 style={[styles.priorityChip, { borderColor: getPriorityColor(currentGoal.priority) }]}
//               >
//                 {t(`goals.priority.${currentGoal.priority.toLowerCase()}`)}
//               </Chip>
//               <Chip
//                 mode="outlined"
//                 compact
//                 textStyle={[styles.statusChipText, { color: getStatusColor(currentGoal.status) }]}
//                 style={[styles.statusChip, { borderColor: getStatusColor(currentGoal.status) }]}
//               >
//                 {t(`goals.status.${currentGoal.status.toLowerCase()}`)}
//               </Chip>
//             </View>
//           </View>

//           {currentGoal.description && (
//             <Text variant="bodyMedium" style={styles.goalDescription}>
//               {currentGoal.description}
//             </Text>
//           )}

//           <View style={styles.progressContainer}>
//             <View style={styles.progressHeader}>
//               <Text variant="titleMedium" style={styles.progressLabel}>
//                 {t('goals.progress')}
//               </Text>
//               <Text variant="titleMedium" style={styles.progressValue}>
//                 {currentGoal.progress}%
//               </Text>
//             </View>
//             <ProgressBar
//               progress={currentGoal.progress / 100}
//               color={getPriorityColor(currentGoal.priority)}
//               style={styles.progressBar}
//             />
//             {totalMilestones > 0 && (
//               <Text variant="bodySmall" style={styles.milestoneProgress}>
//                 {completedMilestones}/{totalMilestones} {t('goals.milestones')} {t('goals.completed')}
//               </Text>
//             )}
//           </View>

//           <View style={styles.goalMeta}>
//             <Chip mode="outlined" style={styles.categoryChip}>
//               {currentGoal.category}
//             </Chip>
//             {timeStatus && (
//               <Chip
//                 mode="outlined"
//                 textStyle={[styles.timeChipText, { color: timeStatus.color }]}
//                 style={[styles.timeChip, { borderColor: timeStatus.color }]}
//               >
//                 {timeStatus.text}
//               </Chip>
//             )}
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderMilestones = () => {
//     if (!currentGoal || currentGoal.milestones.length === 0) return null;

//     return (
//       <Card style={styles.milestonesCard}>
//         <Card.Content>
//           <View style={styles.milestonesHeader}>
//             <Text variant="titleMedium" style={styles.milestonesTitle}>
//               {t('goals.milestones')}
//             </Text>
//             <Button
//               mode="outlined"
//               compact
//               onPress={() => setShowMilestoneModal(true)}
//               icon="plus"
//             >
//               {t('goals.addMilestone')}
//             </Button>
//           </View>

//           {currentGoal.milestones.map((milestone, index) => (
//             <View key={milestone.id} style={styles.milestoneItem}>
//               <View style={styles.milestoneContent}>
//                 <View style={styles.milestoneHeader}>
//                   <Text variant="titleSmall" style={styles.milestoneTitle}>
//                     {milestone.title}
//                   </Text>
//                   <Chip
//                     mode="outlined"
//                     compact
//                     textStyle={[styles.milestoneStatusText, { color: getMilestoneStatusColor(milestone.status) }]}
//                     style={[styles.milestoneStatusChip, { borderColor: getMilestoneStatusColor(milestone.status) }]}
//                   >
//                     {t(`goals.milestoneStatus.${milestone.status.toLowerCase()}`)}
//                   </Chip>
//                 </View>

//                 {milestone.description && (
//                   <Text variant="bodySmall" style={styles.milestoneDescription}>
//                     {milestone.description}
//                   </Text>
//                 )}

//                 {milestone.targetDate && (
//                   <Text variant="bodySmall" style={styles.milestoneDate}>
//                     {t('goals.due')}: {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
//                   </Text>
//                 )}
//               </View>

//               {milestone.status !== MilestoneStatus.DONE && (
//                 <IconButton
//                   icon="check"
//                   size={20}
//                   iconColor="#4CAF50"
//                   onPress={() => handleMilestoneAction(milestone, 'complete')}
//                 />
//               )}
//             </View>
//           ))}
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderActionButtons = () => {
//     if (!currentGoal) return null;

//     return (
//       <Card style={styles.actionsCard}>
//         <Card.Content>
//           <Text variant="titleMedium" style={styles.actionsTitle}>
//             {t('goals.actions')}
//           </Text>

//           <View style={styles.actionButtons}>
//             {currentGoal.status === GoalStatus.ACTIVE && (
//               <>
//                 <Button
//                   mode="contained"
//                   onPress={() => handleGoalAction('complete')}
//                   style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
//                   icon="check"
//                 >
//                   {t('goals.complete')}
//                 </Button>
//                 <Button
//                   mode="outlined"
//                   onPress={() => handleGoalAction('pause')}
//                   style={styles.actionButton}
//                   icon="pause"
//                 >
//                   {t('goals.pause')}
//                 </Button>
//               </>
//             )}

//             {currentGoal.status === GoalStatus.PAUSED && (
//               <Button
//                 mode="contained"
//                 onPress={() => handleGoalAction('resume')}
//                 style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
//                 icon="play"
//               >
//                 {t('goals.resume')}
//               </Button>
//             )}

//             {currentGoal.status !== GoalStatus.DONE && currentGoal.status !== GoalStatus.CANCELLED && (
//               <Button
//                 mode="outlined"
//                 onPress={() => handleGoalAction('cancel')}
//                 style={[styles.actionButton, { borderColor: '#F44336' }]}
//                 textColor="#F44336"
//                 icon="cancel"
//               >
//                 {t('goals.cancel')}
//               </Button>
//             )}
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   if (isLoading && !refreshing) {
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
//       <ScrollView 
//         style={styles.scrollView} 
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {renderGoalHeader()}
//         {renderMilestones()}
//         {renderActionButtons()}
//       </ScrollView>

//       <FAB
//         icon="pencil"
//         style={[styles.fab, { backgroundColor: theme.colors.primary }]}
//         onPress={() => navigation.navigate('GoalEdit', { goalId: currentGoal.id })}
//         label={t('goals.edit')}
//       />
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
//   headerCard: {
//     marginBottom: 16,
//     borderLeftWidth: 4,
//     elevation: 2,
//   },
//   goalHeader: {
//     marginBottom: 12,
//   },
//   goalTitle: {
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   goalBadges: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   priorityChip: {
//     height: 28,
//   },
//   priorityChipText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   statusChip: {
//     height: 28,
//   },
//   statusChipText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   goalDescription: {
//     color: theme.colors.textSecondary,
//     marginBottom: 16,
//     lineHeight: 20,
//   },
//   progressContainer: {
//     marginBottom: 16,
//   },
//   progressHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   progressLabel: {
//     fontWeight: '600',
//   },
//   progressValue: {
//     fontWeight: 'bold',
//     color: theme.colors.primary,
//   },
//   progressBar: {
//     height: 8,
//     borderRadius: 4,
//     marginBottom: 8,
//   },
//   milestoneProgress: {
//     color: theme.colors.textSecondary,
//     fontSize: 12,
//   },
//   goalMeta: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   categoryChip: {
//     height: 28,
//   },
//   timeChip: {
//     height: 28,
//   },
//   timeChipText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   milestonesCard: {
//     marginBottom: 16,
//     elevation: 2,
//   },
//   milestonesHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   milestonesTitle: {
//     fontWeight: '600',
//   },
//   milestoneItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: theme.colors.surfaceVariant,
//   },
//   milestoneContent: {
//     flex: 1,
//     marginRight: 8,
//   },
//   milestoneHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   milestoneTitle: {
//     fontWeight: '600',
//     flex: 1,
//     marginRight: 8,
//   },
//   milestoneStatusChip: {
//     height: 24,
//   },
//   milestoneStatusText: {
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   milestoneDescription: {
//     color: theme.colors.textSecondary,
//     marginBottom: 4,
//   },
//   milestoneDate: {
//     color: theme.colors.textSecondary,
//     fontSize: 12,
//   },
//   actionsCard: {
//     marginBottom: 16,
//     elevation: 2,
//   },
//   actionsTitle: {
//     fontWeight: '600',
//     marginBottom: 16,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   actionButton: {
//     flex: 1,
//     minWidth: 120,
//   },
//   fab: {
//     position: 'absolute',
//     margin: 16,
//     right: 0,
//     bottom: 0,
//   },
// });



import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  ActivityIndicator,
  Chip,
  ProgressBar,
  IconButton,
  Portal,
  Modal,
  FAB,
  Divider,
  Avatar,
  Badge,
  List,
  TextInput,
  Menu
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { Goal, GoalStatus, GoalPriority, Milestone, MilestoneStatus } from '@/types/goal';
import { format, isAfter, isBefore, differenceInDays, isToday, isTomorrow } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

interface GoalDetailScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
    };
  };
}

export const GoalDetailScreen: React.FC<GoalDetailScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const {
    currentGoal,
    fetchGoal,
    updateGoal,
    completeGoal,
    pauseGoal,
    resumeGoal,
    cancelGoal,
    createMilestone,
    updateMilestone,
    completeMilestone,
    deleteMilestone,
    isLoading
  } = useGoalStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showMilestoneCreateModal, setShowMilestoneCreateModal] = useState(false);
  const [showMilestoneEditModal, setShowMilestoneEditModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneTargetDate, setMilestoneTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showMilestoneMenu, setShowMilestoneMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchGoal(route.params.goalId);
  }, [route.params.goalId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoal(route.params.goalId);
    setRefreshing(false);
  };

  const handleGoalAction = async (action: 'complete' | 'pause' | 'resume' | 'cancel') => {
    if (!currentGoal) return;

    try {
      switch (action) {
        case 'complete':
          await completeGoal(currentGoal.id);
          showSuccess(t('goals.completedSuccessfully', { title: currentGoal.title }));
          break;
        case 'pause':
          await pauseGoal(currentGoal.id);
          showSuccess(t('goals.pausedSuccessfully', { title: currentGoal.title }));
          break;
        case 'resume':
          await resumeGoal(currentGoal.id);
          showSuccess(t('goals.resumedSuccessfully', { title: currentGoal.title }));
          break;
        case 'cancel':
          await cancelGoal(currentGoal.id);
          showSuccess(t('goals.cancelledSuccessfully', { title: currentGoal.title }));
          break;
      }
    } catch (error: any) {
      showError(error.message || t('goals.actionFailed'));
    }
  };

  const handleMilestoneAction = async (milestone: Milestone, action: 'complete' | 'edit' | 'delete') => {
    if (!currentGoal) return;

    try {
      if (action === 'complete') {
        await completeMilestone(currentGoal.id, milestone.id);
        showSuccess(t('goals.milestoneCompleted', { title: milestone.title }));
      } else if (action === 'edit') {
        setSelectedMilestone(milestone);
        setMilestoneTitle(milestone.title);
        setMilestoneDescription(milestone.description || '');
        setMilestoneTargetDate(milestone.targetDate ? new Date(milestone.targetDate) : null);
        setShowMilestoneEditModal(true);
      } else if (action === 'delete') {
        // Show confirmation dialog
        Alert.alert(
          t('goals.deleteMilestone'),
          t('goals.deleteMilestoneConfirmation', { title: milestone.title }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteMilestone(currentGoal.id, milestone.id);
                  showSuccess(t('goals.milestoneDeleted'));
                } catch (error: any) {
                  showError(error.message || t('goals.milestoneDeleteError'));
                }
              }
            }
          ]
        );
      }
    } catch (error: any) {
      showError(error.message || t('goals.milestoneActionFailed'));
    }
  };

  const handleCreateMilestone = async () => {
    if (!currentGoal || !validateMilestoneForm()) return;

    try {
      await createMilestone(currentGoal.id, {
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim() || undefined,
        targetDate: milestoneTargetDate?.toISOString(),
      });

      showSuccess(t('goals.milestoneCreated'));
      setShowMilestoneCreateModal(false);
      resetMilestoneForm();
    } catch (error: any) {
      showError(error.message || t('goals.milestoneCreateError'));
    }
  };

  const handleUpdateMilestone = async () => {
    if (!currentGoal || !selectedMilestone || !validateMilestoneForm()) return;

    try {
      await updateMilestone(currentGoal.id, selectedMilestone.id, {
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim() || undefined,
        targetDate: milestoneTargetDate?.toISOString(),
      });

      showSuccess(t('goals.milestoneUpdated'));
      setShowMilestoneEditModal(false);
      resetMilestoneForm();
    } catch (error: any) {
      showError(error.message || t('goals.milestoneUpdateError'));
    }
  };

  const validateMilestoneForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!milestoneTitle.trim()) {
      newErrors.title = t('goals.milestoneTitleRequired');
    }

    if (milestoneTitle.length > 100) {
      newErrors.title = t('goals.milestoneTitleTooLong');
    }

    if (milestoneDescription && milestoneDescription.length > 500) {
      newErrors.description = t('goals.milestoneDescriptionTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetMilestoneForm = () => {
    setMilestoneTitle('');
    setMilestoneDescription('');
    setMilestoneTargetDate(null);
    setSelectedMilestone(null);
    setErrors({});
  };

  const renderMilestoneCreateModal = () => (
    <Portal>
      <Modal
        visible={showMilestoneCreateModal}
        onDismiss={() => {
          setShowMilestoneCreateModal(false);
          resetMilestoneForm();
        }}
        contentContainerStyle={[styles.milestoneModal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={[styles.milestoneModalTitle, { color: theme.colors.text }]}>
          {t('goals.createMilestone')}
        </Text>

        <TextInput
          label={t('goals.milestoneTitle')}
          value={milestoneTitle}
          onChangeText={setMilestoneTitle}
          error={!!errors.title}
          style={styles.milestoneModalInput}
          maxLength={100}
        />
        {errors.title && (
          <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.title}
          </Text>
        )}

        <TextInput
          label={t('goals.milestoneDescription')}
          value={milestoneDescription}
          onChangeText={setMilestoneDescription}
          error={!!errors.description}
          style={styles.milestoneModalInput}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        {errors.description && (
          <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.description}
          </Text>
        )}

        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
          icon="calendar"
        >
          {milestoneTargetDate ? milestoneTargetDate.toLocaleDateString() : t('goals.selectDate')}
        </Button>

        <View style={styles.milestoneModalActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setShowMilestoneCreateModal(false);
              resetMilestoneForm();
            }}
            style={styles.milestoneModalButton}
          >
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleCreateMilestone}
            style={[styles.milestoneModalButton, { backgroundColor: theme.colors.primary }]}
          >
            {t('goals.createMilestone')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const renderMilestoneEditModal = () => (
    <Portal>
      <Modal
        visible={showMilestoneEditModal}
        onDismiss={() => {
          setShowMilestoneEditModal(false);
          resetMilestoneForm();
        }}
        contentContainerStyle={[styles.milestoneModal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={[styles.milestoneModalTitle, { color: theme.colors.text }]}>
          {t('goals.editMilestone')}
        </Text>

        <TextInput
          label={t('goals.milestoneTitle')}
          value={milestoneTitle}
          onChangeText={setMilestoneTitle}
          error={!!errors.title}
          style={styles.milestoneModalInput}
          maxLength={100}
        />
        {errors.title && (
          <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.title}
          </Text>
        )}

        <TextInput
          label={t('goals.milestoneDescription')}
          value={milestoneDescription}
          onChangeText={setMilestoneDescription}
          error={!!errors.description}
          style={styles.milestoneModalInput}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        {errors.description && (
          <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.description}
          </Text>
        )}

        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
          icon="calendar"
        >
          {milestoneTargetDate ? milestoneTargetDate.toLocaleDateString() : t('goals.selectDate')}
        </Button>

        <View style={styles.milestoneModalActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setShowMilestoneEditModal(false);
              resetMilestoneForm();
            }}
            style={styles.milestoneModalButton}
          >
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleUpdateMilestone}
            style={[styles.milestoneModalButton, { backgroundColor: theme.colors.primary }]}
          >
            {t('goals.update')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );

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
        return theme.colors.textSecondary;
    }
  };

  const getMilestoneStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.DONE:
        return theme.colors.success || '#4CAF50';
      case MilestoneStatus.IN_PROGRESS:
        return theme.colors.primary || '#2196F3';
      case MilestoneStatus.TODO:
        return theme.colors.textDisabled || '#9E9E9E';
      default:
        return theme.colors.textSecondary;
    }
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

  const getTimeStatus = (targetDate?: string) => {
    if (!targetDate) return null;

    const target = new Date(targetDate);
    const now = new Date();

    if (isToday(target)) return { text: t('goals.dueToday'), color: theme.colors.warning || '#FF9800' };
    if (isTomorrow(target)) return { text: t('goals.dueTomorrow'), color: theme.colors.info || '#2196F3' };
    if (isBefore(target, now)) return { text: t('goals.overdue'), color: theme.colors.error || '#F44336' };

    const daysLeft = differenceInDays(target, now);
    if (daysLeft <= 7) return { text: t('goals.dueInDays', { days: daysLeft }), color: theme.colors.warning || '#FF9800' };

    return { text: format(target, 'MMM dd, yyyy'), color: theme.colors.textSecondary };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return theme.colors.success;
    if (progress >= 50) return theme.colors.warning;
    return theme.colors.error;
  };

  const renderGoalHeader = () => {
    if (!currentGoal) return null;

    const timeStatus = getTimeStatus(currentGoal.targetDate);
    const completedMilestones = currentGoal.milestones.filter(m => m.status === MilestoneStatus.DONE).length;
    const totalMilestones = currentGoal.milestones.length;
    const progressColor = getProgressColor(currentGoal.progress);

    return (
      <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]} elevation={3}>
        <Card.Content>
          {/* Header with Icon and Title */}
          <View style={styles.goalHeader}>
            <Avatar.Icon
              size={50}
              icon={getGoalIcon(currentGoal.category)}
              style={[styles.goalIcon, { backgroundColor: getPriorityColor(currentGoal.priority) + '20' }]}
              color={getPriorityColor(currentGoal.priority)}
            />
            <View style={styles.goalTitleContainer}>
              <Text variant="headlineSmall" style={[styles.goalTitle, { color: theme.colors.text }]}>
                {currentGoal.title}
              </Text>
              <View style={styles.goalBadges}>
                <Chip
                  mode="outlined"
                  compact
                  textStyle={[styles.priorityChipText, { color: getPriorityColor(currentGoal.priority) }]}
                  style={[styles.priorityChip, {
                    borderColor: getPriorityColor(currentGoal.priority),
                    backgroundColor: getPriorityColor(currentGoal.priority) + '15'
                  }]}
                >
                  {t(`goals.priority.${currentGoal.priority.toLowerCase()}`)}
                </Chip>
                <Chip
                  mode="outlined"
                  compact
                  textStyle={[styles.statusChipText, { color: getStatusColor(currentGoal.status) }]}
                  style={[styles.statusChip, {
                    borderColor: getStatusColor(currentGoal.status),
                    backgroundColor: getStatusColor(currentGoal.status) + '15'
                  }]}
                >
                  {t(`goals.status.${currentGoal.status.toLowerCase()}`)}
                </Chip>
              </View>
            </View>
          </View>

          {/* Description */}
          {currentGoal.description && (
            <Text variant="bodyMedium" style={[styles.goalDescription, { color: theme.colors.textSecondary }]}>
              {currentGoal.description}
            </Text>
          )}

          <Divider style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />

          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabels}>
                <Text variant="titleMedium" style={[styles.progressLabel, { color: theme.colors.text }]}>
                  {t('goals.progress')}
                </Text>
                {totalMilestones > 0 && (
                  <Text variant="bodySmall" style={[styles.milestoneProgress, { color: theme.colors.textSecondary }]}>
                    {completedMilestones}/{totalMilestones} {t('goals.milestones')}
                  </Text>
                )}
              </View>
              <View style={styles.progressValueContainer}>
                <Text variant="titleLarge" style={[styles.progressValue, { color: progressColor }]}>
                  {currentGoal.progress}%
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={currentGoal.progress / 100}
              color={progressColor}
              style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
            />
          </View>

          {/* Meta Information */}
          <View style={styles.goalMeta}>
            <Chip
              mode="outlined"
              style={[styles.categoryChip, { backgroundColor: theme.colors.surfaceVariant }]}
              textStyle={{ color: theme.colors.textSecondary }}
              icon={getGoalIcon(currentGoal.category)}
            >
              {currentGoal.category}
            </Chip>
            {timeStatus && (
              <Chip
                mode="outlined"
                textStyle={[styles.timeChipText, { color: timeStatus.color }]}
                style={[styles.timeChip, {
                  borderColor: timeStatus.color,
                  backgroundColor: timeStatus.color + '15'
                }]}
                icon="clock-outline"
              >
                {timeStatus.text}
              </Chip>
            )}
            {currentGoal.targetDate && (
              <Chip
                mode="outlined"
                style={[styles.dateChip, { backgroundColor: theme.colors.surfaceVariant }]}
                textStyle={{ color: theme.colors.textSecondary }}
                icon="calendar"
              >
                {format(new Date(currentGoal.targetDate), 'MMM dd, yyyy')}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMilestones = () => {
    if (!currentGoal) return null;

    const completedCount = currentGoal.milestones.filter(m => m.status === MilestoneStatus.DONE).length;
    const totalCount = currentGoal.milestones.length;

    return (
      <Card style={[styles.milestonesCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <View style={styles.milestonesHeader}>
            <View style={styles.milestonesTitleContainer}>
              <Text variant="titleLarge" style={[styles.milestonesTitle, { color: theme.colors.text }]}>
                {t('goals.milestones')}
              </Text>
              {totalCount > 0 && (
                <Badge style={[styles.milestoneBadge, { backgroundColor: theme.colors.primary }]}>
                  {`${completedCount}/${totalCount}`}
                </Badge>
              )}
            </View>



            <IconButton
              mode="contained"

              onPress={() => setShowMilestoneCreateModal(true)}
              icon="plus"
              style={styles.addMilestoneButton}
            />

          </View>

          {currentGoal.milestones.length === 0 ? (
            <View style={styles.emptyMilestones}>
              <Avatar.Icon
                size={60}
                icon="flag-outline"
                style={[styles.emptyMilestoneIcon, { backgroundColor: theme.colors.surfaceVariant }]}
                color={theme.colors.textSecondary}
              />
              <Text variant="bodyMedium" style={[styles.emptyMilestonesText, { color: theme.colors.textSecondary }]}>
                {t('goals.noMilestones')}
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowMilestoneCreateModal(true)}
                icon="plus"
                style={styles.addFirstMilestoneButton}
              >
                {t('goals.addFirstMilestone')}
              </Button>
            </View>
          ) : (
            currentGoal.milestones.map((milestone, index) => (
              <View key={milestone.id}>
                <View style={styles.milestoneItem}>
                  <View style={styles.milestoneContent}>
                    <View style={styles.milestoneHeader}>
                      <View style={styles.milestoneTitleContainer}>
                        <IconButton
                          icon={milestone.status === MilestoneStatus.DONE ? "check-circle" : "circle-outline"}
                          size={20}
                          iconColor={getMilestoneStatusColor(milestone.status)}
                          onPress={() => handleMilestoneAction(milestone, 'complete')}
                          style={styles.milestoneCheckbox}
                        />
                        <Text variant="titleSmall" style={[styles.milestoneTitle, { color: theme.colors.text }]}>
                          {milestone.title}
                        </Text>
                      </View>
                      <Chip
                        mode="outlined"
                        compact
                        textStyle={[styles.milestoneStatusText, { color: getMilestoneStatusColor(milestone.status) }]}
                        style={[styles.milestoneStatusChip, {
                          borderColor: getMilestoneStatusColor(milestone.status),
                          backgroundColor: getMilestoneStatusColor(milestone.status) + '15'
                        }]}
                      >
                        {t(`goals.milestoneStatus.${milestone.status.toLowerCase()}`)}
                      </Chip>
                    </View>

                    {milestone.description && (
                      <Text variant="bodySmall" style={[styles.milestoneDescription, { color: theme.colors.textSecondary }]}>
                        {milestone.description}
                      </Text>
                    )}

                    {milestone.targetDate && (
                      <View style={styles.milestoneMeta}>
                        <IconButton
                          icon="calendar"
                          size={16}
                          iconColor={theme.colors.textSecondary}
                          style={styles.milestoneMetaIcon}
                        />
                        <Text variant="bodySmall" style={[styles.milestoneDate, { color: theme.colors.textSecondary }]}>
                          {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Menu
                    visible={showMilestoneMenu === milestone.id}
                    onDismiss={() => setShowMilestoneMenu(null)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        iconColor={theme.colors.textSecondary}
                        onPress={() => setShowMilestoneMenu(milestone.id)}
                      />
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        setShowMilestoneMenu(null);
                        handleMilestoneAction(milestone, 'edit');
                      }}
                      title={t('goals.editMilestone')}
                      leadingIcon="pencil"
                    />
                    <Menu.Item
                      onPress={() => {
                        setShowMilestoneMenu(null);
                        handleMilestoneAction(milestone, 'delete');
                      }}
                      title={t('goals.deleteMilestone')}
                      leadingIcon="delete"
                    />
                  </Menu>
                </View>
                {index < currentGoal.milestones.length - 1 && (
                  <Divider style={[styles.milestoneDivider, { backgroundColor: theme.colors.surfaceVariant }]} />
                )}
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderActionButtons = () => {
    if (!currentGoal) return null;

    return (
      <Card style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.actionsTitle, { color: theme.colors.text }]}>
            {t('goals.actions')}
          </Text>

          <View style={styles.actionButtons}>
            {currentGoal.status === GoalStatus.ACTIVE && (
              <>
                <Button
                  mode="contained"
                  onPress={() => handleGoalAction('complete')}
                  style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                  icon="check"
                  contentStyle={styles.actionButtonContent}
                >
                  {t('goals.complete')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleGoalAction('pause')}
                  style={[styles.actionButton, { borderColor: theme.colors.warning }]}
                  textColor={theme.colors.warning}
                  icon="pause"
                  contentStyle={styles.actionButtonContent}
                >
                  {t('goals.pause')}
                </Button>
              </>
            )}

            {currentGoal.status === GoalStatus.PAUSED && (
              <Button
                mode="contained"
                onPress={() => handleGoalAction('resume')}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                icon="play"
                contentStyle={styles.actionButtonContent}
              >
                {t('goals.resume')}
              </Button>
            )}

            {currentGoal.status !== GoalStatus.DONE && currentGoal.status !== GoalStatus.CANCELLED && (
              <Button
                mode="outlined"
                onPress={() => handleGoalAction('cancel')}
                style={[styles.actionButton, { borderColor: theme.colors.error }]}
                textColor={theme.colors.error}
                icon="cancel"
                contentStyle={styles.actionButtonContent}
              >
                {t('goals.cancel')}
              </Button>
            )}

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('GoalAnalytics', { goalId: currentGoal.id })}
              style={styles.actionButton}
              icon="chart-line"
              contentStyle={styles.actionButtonContent}
            >
              {t('goals.analytics')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && !refreshing) {
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderGoalHeader()}
        {renderMilestones()}
        {renderActionButtons()}
      </ScrollView>

      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('GoalEdit', { goalId: currentGoal.id })}
        label={t('goals.edit')}
        color={theme.colors.onPrimary}
      />

      {/* Milestone Create Modal */}
      {renderMilestoneCreateModal()}

      {/* Milestone Edit Modal */}
      {renderMilestoneEditModal()}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={milestoneTargetDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setMilestoneTargetDate(selectedDate);
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    borderRadius: 12,
  },
  backButtonContent: {
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalIcon: {
    marginRight: 16,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 32,
  },
  goalBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    height: 28,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 12,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 12,
  },
  goalDescription: {
    marginBottom: 20,
    lineHeight: 22,
    fontSize: 15,
  },
  divider: {
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressLabels: {
    flex: 1,
  },
  progressLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  milestoneProgress: {
    fontSize: 13,
  },
  progressValueContainer: {
    alignItems: 'flex-end',
  },
  progressValue: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  goalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    height: 34,
    padding: 0,
    lineHeight: 14,
  },
  timeChip: {
    height: 34,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateChip: {
    height: 32,
  },
  milestonesCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestonesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestonesTitle: {
    fontWeight: '600',
  },
  milestoneBadge: {
    padding: 0,
    marginLeft: 8,
    fontSize: 10,
    color: theme.colors.onPrimary,
  },
  addMilestoneButton: {
    borderRadius: 12,
    padding: 0,
    backgroundColor: theme.colors.primary,
    color: theme.colors.onPrimary,
  },
  emptyMilestones: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMilestoneIcon: {
    marginBottom: 16,
  },
  emptyMilestonesText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  addFirstMilestoneButton: {
    borderRadius: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  milestoneContent: {
    flex: 1,
    marginRight: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  milestoneTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  milestoneCheckbox: {
    margin: 0,
    marginRight: 12,
  },
  milestoneTitle: {
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  milestoneStatusChip: {
    height: 28,
  },
  milestoneStatusText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  milestoneDescription: {
    marginBottom: 8,
    lineHeight: 18,
    fontSize: 13,
  },
  milestoneMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneMetaIcon: {
    margin: 0,
    marginRight: 4,
  },
  milestoneDate: {
    fontSize: 12,
  },
  milestoneDivider: {
    marginLeft: 52,
  },
  actionsCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionsTitle: {
    fontWeight: '600',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    elevation: 4,
  },
  milestoneModal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  milestoneModalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  milestoneModalInput: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  dateButton: {
    marginBottom: 20,
  },
  milestoneModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  milestoneModalButton: {
    flex: 1,
  },
  errorText: {
    marginTop: 4,
    marginBottom: 8,
  },
});