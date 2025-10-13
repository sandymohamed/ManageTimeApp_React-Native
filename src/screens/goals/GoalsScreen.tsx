// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native';
// import { 
//   Text, 
//   Card, 
//   FAB, 
//   Chip, 
//   ProgressBar, 
//   Searchbar, 
//   Menu, 
//   IconButton, 
//   useTheme,
//   ActivityIndicator,
//   Portal,
//   Modal,
//   Button,
//   SegmentedButtons,
//   Badge
// } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
// import { useNotification } from '@/contexts/NotificationContext';
// import { useGoalStore } from '@/store/goalStore';
// import { Goal, GoalStatus, GoalPriority } from '@/types/goal';
// import { format, isAfter, isBefore, differenceInDays, isToday, isTomorrow, isYesterday } from 'date-fns';

// const screenWidth = Dimensions.get('window').width;

// interface GoalsScreenProps {
//   navigation: any;
// }

// export const GoalsScreen: React.FC<GoalsScreenProps> = ({ navigation }) => {
//   const { t } = useTranslation();
//   const { isRTL } = useLanguage();
//   const paperTheme = useTheme();
//   const customTheme = useCustomTheme();
//   const theme = customTheme.theme;
//   const styles = createStyles(theme);
//   const { showSuccess, showError } = useNotification();

//   const {
//     goals,
//     filteredGoals,
//     isLoading,
//     error,
//     searchQuery,
//     statusFilter,
//     priorityFilter,
//     categoryFilter,
//     currentPage,
//     totalPages,
//     totalItems,
//     hasNextPage,
//     hasPreviousPage,
//     fetchGoals,
//     loadMoreGoals,
//     setSearchQuery,
//     setStatusFilter,
//     setPriorityFilter,
//     setCategoryFilter,
//     clearFilters,
//     completeGoal,
//     pauseGoal,
//     resumeGoal,
//     cancelGoal,
//     deleteGoal,
//     setCurrentGoal,
//     generateAIPlan,
//   } = useGoalStore();

//   const [refreshing, setRefreshing] = useState(false);
//   const [showFilterMenu, setShowFilterMenu] = useState(false);
//   const [showSortMenu, setShowSortMenu] = useState(false);
//   const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
//   const [showGoalModal, setShowGoalModal] = useState(false);
//   const [viewMode, setViewMode] = useState<'all' | 'active' | 'completed'>('all');

//   useEffect(() => {
//     fetchGoals();
//   }, []);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchGoals();
//     setRefreshing(false);
//   };

//   const handleCreateGoal = () => {
//     navigation.navigate('GoalCreate');
//   };

//   const handleGoalPress = (goal: Goal) => {
//     setCurrentGoal(goal);
//     navigation.navigate('GoalDetail', { goalId: goal.id });
//   };

//   const handleEditGoal = (goal: Goal) => {
//     setCurrentGoal(goal);
//     navigation.navigate('GoalEdit', { goalId: goal.id });
//   };

//   const handleViewAnalytics = (goal: Goal) => {
//     setCurrentGoal(goal);
//     navigation.navigate('GoalAnalytics', { goalId: goal.id });
//   };

//   const handleManageMilestones = (goal: Goal) => {
//     setCurrentGoal(goal);
//     navigation.navigate('MilestoneManagement', { goalId: goal.id });
//   };

//   const handleAIPlanning = (goal: Goal) => {
//     // Show AI planning options
//     Alert.alert(
//       t('goals.aiPlanning'),
//       t('goals.aiPlanningDescription'),
//       [
//         { text: t('common.cancel'), style: 'cancel' },
//         { 
//           text: t('goals.generatePlan'), 
//           onPress: () => {
//             try {
//               generateAIPlan(goal.id);
//               showSuccess(t('goals.aiPlanGenerated'));
//             } catch (error: any) {
//               showError(error.message || t('goals.aiPlanError'));
//             }
//           }
//         }
//       ]
//     );
//   };

//   const handleLoadMore = () => {
//     if (hasNextPage && !isLoading) {
//       loadMoreGoals();
//     }
//   };

//   const handleGoalAction = async (goal: Goal, action: 'complete' | 'pause' | 'resume' | 'cancel' | 'delete') => {
//     try {
//       switch (action) {
//         case 'complete':
//           await completeGoal(goal.id);
//           showSuccess(t('goals.completedSuccessfully', { title: goal.title }));
//           break;
//         case 'pause':
//           await pauseGoal(goal.id);
//           showSuccess(t('goals.pausedSuccessfully', { title: goal.title }));
//           break;
//         case 'resume':
//           await resumeGoal(goal.id);
//           showSuccess(t('goals.resumedSuccessfully', { title: goal.title }));
//           break;
//         case 'cancel':
//           await cancelGoal(goal.id);
//           showSuccess(t('goals.cancelledSuccessfully', { title: goal.title }));
//           break;
//         case 'delete':
//           await deleteGoal(goal.id);
//           showSuccess(t('goals.deletedSuccessfully', { title: goal.title }));
//           break;
//       }
//     } catch (error: any) {
//       showError(error.message || t('goals.actionFailed'));
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
//         return theme.colors.textSecondary;
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

//   const getStatusIcon = (status: GoalStatus) => {
//     switch (status) {
//       case GoalStatus.DONE:
//         return 'check-circle';
//       case GoalStatus.ACTIVE:
//         return 'play-circle';
//       case GoalStatus.PAUSED:
//         return 'pause-circle';
//       case GoalStatus.CANCELLED:
//         return 'cancel';
//       case GoalStatus.DRAFT:
//         return 'draft';
//       default:
//         return 'help-circle';
//     }
//   };

//   const getTimeStatus = (targetDate?: string) => {
//     if (!targetDate) return null;

//     const target = new Date(targetDate);
//     const now = new Date();

//     if (isToday(target)) return { text: t('goals.dueToday'), color: '#FF9800' };
//     if (isTomorrow(target)) return { text: t('goals.dueTomorrow'), color: '#2196F3' };
//     if (isYesterday(target)) return { text: t('goals.overdue'), color: '#F44336' };
//     if (isBefore(target, now)) return { text: t('goals.overdue'), color: '#F44336' };

//     const daysLeft = differenceInDays(target, now);
//     if (daysLeft <= 7) return { text: t('goals.dueInDays', { days: daysLeft }), color: '#FF9800' };

//     return { text: format(target, 'MMM dd'), color: theme.colors.textSecondary };
//   };

//   const getFilteredGoals = () => {
//     let filtered = filteredGoals;

//     if (viewMode === 'active') {
//       filtered = filtered.filter(goal => goal.status === GoalStatus.ACTIVE);
//     } else if (viewMode === 'completed') {
//       filtered = filtered.filter(goal => goal.status === GoalStatus.DONE);
//     }

//     return filtered;
//   };

//   const renderGoal = ({ item: goal }: { item: Goal }) => {
//     const timeStatus = getTimeStatus(goal.targetDate);
//     const completedMilestones = goal.milestones.filter(m => m.status === 'DONE').length;
//     const totalMilestones = goal.milestones.length;

//     return (
//       <Card 
//         style={[styles.goalCard, { borderLeftColor: getPriorityColor(goal.priority) }]} 
//         onPress={() => handleGoalPress(goal)}
//       >
//         <Card.Content>
//           <View style={styles.goalHeader}>
//             <View style={styles.goalTitleContainer}>
//               <Text variant="titleMedium" style={styles.goalTitle} numberOfLines={2}>
//                 {goal.title} 
//               </Text>
//               <View style={styles.goalBadges}>
//                 <Chip
//                   mode="outlined"
//                   compact
//                   textStyle={[styles.priorityChipText, { color: getPriorityColor(goal.priority) }]}
//                   style={[styles.priorityChip, { borderColor: getPriorityColor(goal.priority) }]}
//                 >
//                   {t(`goals.priority.${goal.priority.toLowerCase()}`)}
//                 </Chip>
//                 <Chip
//                   mode="outlined"
//                   compact
//                   textStyle={[styles.statusChipText, { color: getStatusColor(goal.status) }]}
//                   style={[styles.statusChip, { borderColor: getStatusColor(goal.status) }]}
//                 >
//                   {t(`goals.status.${goal.status.toLowerCase()}`)}
//                 </Chip>
//               </View>
//             </View>
//             <IconButton
//               icon="dots-vertical"
//               size={20}
//               iconColor={theme.colors.textSecondary}
//               onPress={() => {
//                 setSelectedGoal(goal);
//                 setShowGoalModal(true);
//               }}
//             />
//           </View>

//           {goal.description && (
//             <Text variant="bodyMedium" style={styles.goalDescription} numberOfLines={2}>
//               {goal.description}
//             </Text>
//           )}

//           <View style={styles.progressContainer}>
//             <View style={styles.progressHeader}>
//               <Text variant="bodySmall" style={styles.progressLabel}>
//                 {t('goals.progress')}
//               </Text>
//               <Text variant="bodySmall" style={styles.progressValue}>
//                 {goal.progress}%
//               </Text>
//             </View>
//             <ProgressBar
//               progress={goal.progress / 100}
//               color={getPriorityColor(goal.priority)}
//               style={styles.progressBar}
//             />
//             {totalMilestones > 0 && (
//               <Text variant="bodySmall" style={styles.milestoneProgress}>
//                 {completedMilestones}/{totalMilestones} {t('goals.milestones')}
//               </Text>
//             )}
//           </View>

//           <View style={styles.goalFooter}>
//             <View style={styles.goalMeta}>
//               <Chip mode="outlined" compact style={styles.categoryChip}>
//                 {goal.category}
//               </Chip>
//               {timeStatus && (
//                 <Chip
//                   mode="outlined"
//                   compact
//                   textStyle={[styles.timeChipText, { color: timeStatus.color }]}
//                   style={[styles.timeChip, { borderColor: timeStatus.color }]}
//                 >
//                   {timeStatus.text}
//                 </Chip>
//               )}
//             </View>
//             <View style={styles.goalStats}>
//               <IconButton
//                 icon={getStatusIcon(goal.status)}
//                 size={16}
//                 iconColor={getStatusColor(goal.status)}
//                 style={styles.statusIcon}
//               />
//             </View>
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Text variant="headlineSmall" style={styles.emptyTitle}>
//         {t('goals.noGoals')}
//       </Text>
//       <Text variant="bodyMedium" style={styles.emptyMessage}>
//         {t('goals.noGoalsDescription')}
//       </Text>
//       <Button 
//         mode="contained" 
//         onPress={handleCreateGoal} 
//         style={styles.createButton}
//         icon="plus"
//       >
//         {t('goals.createGoal')}
//       </Button>
//     </View>
//   );

//   const renderFooter = () => {
//     if (!hasNextPage && totalItems > 0) {
//       return (
//         <View style={styles.footer}>
//           <Text variant="bodySmall" style={styles.footerText}>
//             {t('common.showingAll', { count: totalItems })}
//           </Text>
//         </View>
//       );
//     }

//     if (isLoading && currentPage > 1) {
//       return (
//         <View style={styles.footer}>
//           <ActivityIndicator size="small" color={theme.colors.primary} />
//           <Text variant="bodySmall" style={styles.footerText}>
//             {t('common.loadingMore')}
//           </Text>
//         </View>
//       );
//     }

//     return null;
//   };

//   const renderGoalModal = () => (
//     <Portal>
//       <Modal
//         visible={showGoalModal}
//         onDismiss={() => setShowGoalModal(false)}
//         contentContainerStyle={[styles.goalModal, { backgroundColor: theme.colors.surface }]}
//       >
//         {selectedGoal && (
//           <View style={styles.goalModalContent}>
//             <Text variant="titleLarge" style={[styles.goalModalTitle, { color: theme.colors.text }]}>
//               {selectedGoal.title}
//             </Text>

//             <View style={styles.goalModalActions}>
//               {selectedGoal.status === GoalStatus.ACTIVE && (
//                 <>
//                   <Button
//                     mode="contained"
//                     onPress={() => {
//                       handleGoalAction(selectedGoal, 'complete');
//                       setShowGoalModal(false);
//                     }}
//                     style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
//                     icon="check"
//                   >
//                     {t('goals.complete')}
//                   </Button>
//                   <Button
//                     mode="outlined"
//                     onPress={() => {
//                       handleGoalAction(selectedGoal, 'pause');
//                       setShowGoalModal(false);
//                     }}
//                     style={styles.actionButton}
//                     icon="pause"
//                   >
//                     {t('goals.pause')}
//                   </Button>
//                 </>
//               )}

//               {selectedGoal.status === GoalStatus.PAUSED && (
//                 <Button
//                   mode="contained"
//                   onPress={() => {
//                     handleGoalAction(selectedGoal, 'resume');
//                     setShowGoalModal(false);
//                   }}
//                   style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
//                   icon="play"
//                 >
//                   {t('goals.resume')}
//                 </Button>
//               )}

//               {selectedGoal.status !== GoalStatus.DONE && selectedGoal.status !== GoalStatus.CANCELLED && (
//                 <Button
//                   mode="outlined"
//                   onPress={() => {
//                     handleGoalAction(selectedGoal, 'cancel');
//                     setShowGoalModal(false);
//                   }}
//                   style={styles.actionButton}
//                   icon="cancel"
//                 >
//                   {t('goals.cancel')}
//                 </Button>
//               )}

//               <Button
//                 mode="outlined"
//                 onPress={() => {
//                   handleEditGoal(selectedGoal);
//                   setShowGoalModal(false);
//                 }}
//                 style={styles.actionButton}
//                 icon="pencil"
//               >
//                 {t('goals.editDetails')}
//               </Button>

//               <Button
//                 mode="outlined"
//                 onPress={() => {
//                   handleViewAnalytics(selectedGoal);
//                   setShowGoalModal(false);
//                 }}
//                 style={styles.actionButton}
//                 icon="chart-line"
//               >
//                 {t('goals.viewAnalytics')}
//               </Button>

//               <Button
//                 mode="outlined"
//                 onPress={() => {
//                   handleManageMilestones(selectedGoal);
//                   setShowGoalModal(false);
//                 }}
//                 style={styles.actionButton}
//                 icon="flag"
//               >
//                 {t('goals.manageMilestones')}
//               </Button>

//               <Button
//                 mode="outlined"
//                 onPress={() => {
//                   handleGoalAction(selectedGoal, 'delete');
//                   setShowGoalModal(false);
//                 }}
//                 style={[styles.actionButton, { borderColor: '#F44336' }]}
//                 textColor="#F44336"
//                 icon="delete"
//               >
//                 {t('goals.delete')}
//               </Button>
//             </View>
//           </View>
//         )}
//       </Modal>
//     </Portal>
//   );

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

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
//         <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
//           {t('goals.title')}
//         </Text>
//         <View style={styles.headerActions}>
//           <IconButton
//             icon="magnify"
//             size={24}
//             iconColor={theme.colors.text}
//             onPress={() => {/* Implement search */}}
//           />
//           <Menu
//             visible={showFilterMenu}
//             onDismiss={() => setShowFilterMenu(false)}
//             anchor={
//               <IconButton
//                 icon="filter"
//                 size={24}
//                 iconColor={theme.colors.text}
//                 onPress={() => setShowFilterMenu(true)}
//               />
//             }
//           >
//             <Menu.Item onPress={() => setShowFilterMenu(false)} title={t('goals.filters')} />
//             <Menu.Item onPress={() => setShowFilterMenu(false)} title={t('goals.clearFilters')} />
//           </Menu>
//         </View>
//       </View>

//       {/* Search and Filters */}
//       <View style={styles.searchContainer}>
//         <Searchbar
//           placeholder={t('goals.searchGoals')}
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           style={styles.searchBar}
//         />
//       </View>

//       {/* View Mode Toggle */}
//       <View style={styles.viewModeContainer}>
//         <SegmentedButtons
//           value={viewMode}
//           onValueChange={(value) => setViewMode(value as 'all' | 'active' | 'completed')}
//           buttons={[
//             { value: 'all', label: t('goals.all') },
//             { value: 'active', label: t('goals.active') },
//             { value: 'completed', label: t('goals.completed') },
//           ]}
//           style={styles.segmentedButtons}
//         />
//       </View>

//       {/* Goals List */}
//       <FlatList
//         data={getFilteredGoals()}
//         renderItem={renderGoal}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={styles.listContent}
//         ListEmptyComponent={renderEmptyState}
//         ListFooterComponent={renderFooter}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.1}
//       />

//       {/* Floating Action Button */}
//       <FAB
//         icon="plus"
//         style={[styles.fab, { backgroundColor: theme.colors.primary }]}
//         onPress={handleCreateGoal}
//         label={t('goals.addGoal')}
//       />

//       {renderGoalModal()}
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
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     elevation: 2,
//   },
//   title: {
//     fontWeight: 'bold',
//   },
//   headerActions: {
//     flexDirection: 'row',
//   },
//   searchContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   searchBar: {
//     elevation: 1,
//   },
//   viewModeContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   segmentedButtons: {
//     marginBottom: 8,
//   },
//   listContent: {
//     padding: 8,
//     flexGrow: 1,
//   },
//   goalCard: {
//     marginVertical: 4,
//     marginHorizontal: 8,
//     borderLeftWidth: 4,
//     elevation: 2,
//   },
//   goalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 8,
//   },
//   goalTitleContainer: {
//     flex: 1,
//     marginRight: 8,
//   },
//   goalTitle: {
//     fontWeight: '600',
//     marginBottom: 8,
//   },
//   goalBadges: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 4,
//   },
//   priorityChip: {
//     height: 24,
//   },
//   priorityChipText: {
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   statusChip: {
//     height: 24,
//   },
//   statusChipText: {
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   goalDescription: {
//     color: theme.colors.textSecondary,
//     marginBottom: 12,
//     lineHeight: 20,
//   },
//   progressContainer: {
//     marginBottom: 12,
//   },
//   progressHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   progressLabel: {
//     color: theme.colors.textSecondary,
//     fontSize: 12,
//   },
//   progressValue: {
//     color: theme.colors.primary,
//     fontWeight: '600',
//     fontSize: 12,
//   },
//   progressBar: {
//     height: 6,
//     borderRadius: 3,
//     marginBottom: 4,
//   },
//   milestoneProgress: {
//     color: theme.colors.textSecondary,
//     fontSize: 10,
//   },
//   goalFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   goalMeta: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 4,
//   },
//   categoryChip: {
//     height: 24,
//   },
//   timeChip: {
//     height: 24,
//   },
//   timeChipText: {
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   goalStats: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusIcon: {
//     margin: 0,
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyTitle: {
//     marginBottom: 8,
//     color: theme.colors.textSecondary,
//     textAlign: 'center',
//   },
//   emptyMessage: {
//     textAlign: 'center',
//     color: theme.colors.textSecondary,
//     marginBottom: 24,
//     lineHeight: 20,
//   },
//   createButton: {
//     marginTop: 8,
//   },
//   fab: {
//     position: 'absolute',
//     margin: 16,
//     right: 0,
//     bottom: 0,
//   },
//   goalModal: {
//     margin: 20,
//     padding: 20,
//     borderRadius: 16,
//   },
//   goalModalContent: {
//     alignItems: 'center',
//   },
//   goalModalTitle: {
//     marginBottom: 20,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   goalModalActions: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     justifyContent: 'center',
//   },
//   actionButton: {
//     marginHorizontal: 4,
//     marginVertical: 4,
//   },
//   footer: {
//     padding: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   footerText: {
//     color: theme.colors.textSecondary,
//     marginTop: 8,
//   },
// });




import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native';
import {
  Text,
  Card,
  FAB,
  Chip,
  ProgressBar,
  Searchbar,
  Menu,
  IconButton,
  useTheme,
  ActivityIndicator,
  Portal,
  Modal,
  Button,
  SegmentedButtons,
  Badge,
  Avatar,
  Divider
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { Goal, GoalStatus, GoalPriority } from '@/types/goal';
import { format, isAfter, isBefore, differenceInDays, isToday, isTomorrow, isYesterday } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

interface GoalsScreenProps {
  navigation: any;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const {
    goals,
    filteredGoals,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    fetchGoals,
    loadMoreGoals,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setCategoryFilter,
    clearFilters,
    completeGoal,
    pauseGoal,
    resumeGoal,
    cancelGoal,
    deleteGoal,
    setCurrentGoal,
    generateAIPlan,
  } = useGoalStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchGoals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };

  const handleCreateGoal = () => {
    navigation.navigate('GoalCreate');
  };

  const handleGoalPress = (goal: Goal) => {
    setCurrentGoal(goal);
    navigation.navigate('GoalDetail', { goalId: goal.id });
  };

  const handleEditGoal = (goal: Goal) => {
    setCurrentGoal(goal);
    navigation.navigate('GoalEdit', { goalId: goal.id });
  };

  const handleViewAnalytics = (goal: Goal) => {
    setCurrentGoal(goal);
    navigation.navigate('GoalAnalytics', { goalId: goal.id });
  };

  const handleManageMilestones = (goal: Goal) => {
    setCurrentGoal(goal);
    navigation.navigate('MilestoneManagement', { goalId: goal.id });
  };

  const handleAIPlanning = (goal: Goal) => {
    Alert.alert(
      t('goals.aiPlanning'),
      t('goals.aiPlanningDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('goals.generatePlan'),
          onPress: () => {
            try {
              generateAIPlan(goal.id);
              showSuccess(t('goals.aiPlanGenerated'));
            } catch (error: any) {
              showError(error.message || t('goals.aiPlanError'));
            }
          }
        }
      ]
    );
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isLoading) {
      loadMoreGoals();
    }
  };

  const handleGoalAction = async (goal: Goal, action: 'complete' | 'pause' | 'resume' | 'cancel' | 'delete') => {
    try {
      switch (action) {
        case 'complete':
          await completeGoal(goal.id);
          showSuccess(t('goals.completedSuccessfully', { title: goal.title }));
          break;
        case 'pause':
          await pauseGoal(goal.id);
          showSuccess(t('goals.pausedSuccessfully', { title: goal.title }));
          break;
        case 'resume':
          await resumeGoal(goal.id);
          showSuccess(t('goals.resumedSuccessfully', { title: goal.title }));
          break;
        case 'cancel':
          await cancelGoal(goal.id);
          showSuccess(t('goals.cancelledSuccessfully', { title: goal.title }));
          break;
        case 'delete':
          await deleteGoal(goal.id);
          showSuccess(t('goals.deletedSuccessfully', { title: goal.title }));
          break;
      }
    } catch (error: any) {
      showError(error.message || t('goals.actionFailed'));
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
        return theme.colors.textSecondary;
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
    if (isYesterday(target)) return { text: t('goals.overdue'), color: theme.colors.error || '#F44336' };
    if (isBefore(target, now)) return { text: t('goals.overdue'), color: theme.colors.error || '#F44336' };

    const daysLeft = differenceInDays(target, now);
    if (daysLeft <= 7) return { text: t('goals.dueInDays', { days: daysLeft }), color: theme.colors.warning || '#FF9800' };

    return { text: format(target, 'MMM dd'), color: theme.colors.textSecondary };
  };

  const getFilteredGoals = () => {
    let filtered = filteredGoals;

    if (viewMode === 'active') {
      filtered = filtered.filter(goal => goal.status === GoalStatus.ACTIVE);
    } else if (viewMode === 'completed') {
      filtered = filtered.filter(goal => goal.status === GoalStatus.DONE);
    }

    return filtered;
  };
  const renderGoal = ({ item: goal }: { item: Goal }) => {
    const timeStatus = getTimeStatus(goal.targetDate);
    const completedMilestones = goal.milestones.filter(m => m.status === 'DONE').length;
    const totalMilestones = goal.milestones.length;
    const progressPercentage = goal.progress / 100;

    return (
      <TouchableOpacity onPress={() => handleGoalPress(goal)} activeOpacity={0.9}>
        <Card
          style={[styles.goalCard, {
            backgroundColor: theme.colors.surface,
            borderLeftWidth: 4,
            borderLeftColor: getPriorityColor(goal.priority)
          }]}
          elevation={2}
        >
          <Card.Content style={styles.cardContent}>
            {/* Header with Icon and Title */}
            <View style={styles.goalHeader}>
              <Avatar.Icon
                size={40}
                icon={getGoalIcon(goal.category)}
                style={[styles.goalIcon, { backgroundColor: getPriorityColor(goal.priority) + '20' }]}
                color={getPriorityColor(goal.priority)}
              />
              <View style={styles.goalTitleContainer}>
                <Text variant="titleMedium" style={[styles.goalTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {goal.title}
                </Text>
                <View style={styles.goalBadges}>
                  <Chip
                    mode="outlined"
                    compact
                    textStyle={[styles.chipText, { color: getPriorityColor(goal.priority) }]}
                    style={[styles.chip, {
                      borderColor: getPriorityColor(goal.priority),
                      backgroundColor: getPriorityColor(goal.priority) + '15'
                    }]}
                  >
                    {t(`goals.priority.${goal.priority.toLowerCase()}`)}
                  </Chip>
                </View>
              </View>
              <IconButton
                icon="dots-vertical"
                size={20}
                iconColor={theme.colors.textSecondary}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedGoal(goal);
                  setShowGoalModal(true);
                }}
              />
            </View>

            {/* Description */}
            {goal.description && (
              <Text variant="bodyMedium" style={[styles.goalDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                {goal.description}
              </Text>
            )}

            {/* Progress Section */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text variant="bodySmall" style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                  {t('goals.progress')}
                </Text>
                <View style={styles.progressStats}>
                  <Text variant="bodySmall" style={[styles.progressValue, { color: theme.colors.primary }]}>
                    {goal.progress}%
                  </Text>
                  {totalMilestones > 0 && (
                    <Text variant="bodySmall" style={[styles.milestoneProgress, { color: theme.colors.textSecondary }]}>
                      • {completedMilestones}/{totalMilestones} {t('goals.milestones')}
                    </Text>
                  )}
                </View>
              </View>
              <ProgressBar
                progress={progressPercentage}
                color={getPriorityColor(goal.priority)}
                style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
              />
            </View>

            {/* Footer with Meta Info */}
            <View style={styles.goalFooter}>
              <View style={styles.goalMeta}>
                <Chip
                  mode="outlined"
                  compact
                  style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}
                  textStyle={[styles.chipText,{ color: theme.colors.textSecondary }]}
                >
                  {goal.category}
                </Chip>
                {timeStatus && (
                  <Chip
                    mode="outlined"
                    compact
                    textStyle={[styles.chipText, { color: timeStatus.color }]}
                    style={[styles.chip, {
                      borderColor: timeStatus.color,
                      backgroundColor: timeStatus.color + '15'
                    }]}
                  >
                    {timeStatus.text}
                  </Chip>
                )}
              </View>
              <View style={styles.statusContainer}>
                <IconButton
                  icon={getStatusIcon(goal.status)}
                  size={16}
                  iconColor={getStatusColor(goal.status)}
                  style={styles.statusIcon}
                />
                <Text variant="bodySmall" style={[styles.statusText, { color: getStatusColor(goal.status) }]}>
                  {t(`goals.status.${goal.status.toLowerCase()}`)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Avatar.Icon
        size={80}
        icon="target"
        style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}
        color={theme.colors.textSecondary}
      />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {t('goals.noGoals')}
      </Text>
      <Text variant="bodyMedium" style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
        {t('goals.noGoalsDescription')}
      </Text>
      <Button
        mode="contained"
        onPress={handleCreateGoal}
        style={styles.createButton}
        icon="plus"
        contentStyle={styles.createButtonContent}
      >
        {t('goals.createGoal')}
      </Button>
    </View>
  );

  const renderFooter = () => {
    if (!hasNextPage && totalItems > 0) {
      return (
        <View style={styles.footer}>
          <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {t('common.showingAll', { count: totalItems })}
          </Text>
        </View>
      );
    }

    if (isLoading && currentPage > 1) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {t('common.loadingMore')}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderGoalModal = () => (
    <Portal>
      <Modal
        visible={showGoalModal}
        onDismiss={() => setShowGoalModal(false)}
        contentContainerStyle={[styles.goalModal, { backgroundColor: theme.colors.surface }]}
      >
        {selectedGoal && (
          <View style={styles.goalModalContent}>
            <View style={styles.modalHeader}>
              <Avatar.Icon
                size={48}
                icon={getGoalIcon(selectedGoal.category)}
                style={[styles.modalIcon, { backgroundColor: getPriorityColor(selectedGoal.priority) + '20' }]}
                color={getPriorityColor(selectedGoal.priority)}
              />
              <Text variant="titleLarge" style={[styles.goalModalTitle, { color: theme.colors.text }]}>
                {selectedGoal.title}
              </Text>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />

            <View style={styles.goalModalActions}>
              {selectedGoal.status === GoalStatus.ACTIVE && (
                <>
                  <Button
                    mode="contained"
                    onPress={() => {
                      handleGoalAction(selectedGoal, 'complete');
                      setShowGoalModal(false);
                    }}
                    style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                    icon="check"
                    contentStyle={styles.actionButtonContent}
                  >
                    {t('goals.complete')}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      handleGoalAction(selectedGoal, 'pause');
                      setShowGoalModal(false);
                    }}
                    style={[styles.actionButton, { borderColor: theme.colors.warning }]}
                    textColor={theme.colors.warning}
                    icon="pause"
                    contentStyle={styles.actionButtonContent}
                  >
                    {t('goals.pause')}
                  </Button>
                </>
              )}

              {selectedGoal.status === GoalStatus.PAUSED && (
                <Button
                  mode="contained"
                  onPress={() => {
                    handleGoalAction(selectedGoal, 'resume');
                    setShowGoalModal(false);
                  }}
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                  icon="play"
                  contentStyle={styles.actionButtonContent}
                >
                  {t('goals.resume')}
                </Button>
              )}

              <View style={styles.actionRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    handleEditGoal(selectedGoal);
                    setShowGoalModal(false);
                  }}
                  style={[styles.actionButton, { flex: 1 }]}
                  icon="pencil"
                  contentStyle={styles.actionButtonContent}
                >
                  {t('goals.edit')}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => {
                    handleViewAnalytics(selectedGoal);
                    setShowGoalModal(false);
                  }}
                  style={[styles.actionButton, { flex: 1 }]}
                  icon="chart-line"
                  contentStyle={styles.actionButtonContent}
                >
                  {t('goals.analytics')}
                </Button>
              </View>

              <View style={styles.actionRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    handleManageMilestones(selectedGoal);
                    setShowGoalModal(false);
                  }}
                  style={[styles.actionButton, { flex: 1 }]}
                  icon="flag"
                  contentStyle={styles.actionButtonContent}
                >
                  {t('goals.milestones')}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => {
                    handleAIPlanning(selectedGoal);
                    setShowGoalModal(false);
                  }}
                  style={[styles.actionButton, { flex: 1 }]}
                  icon="robot"
                  contentStyle={styles.actionButtonContent}
                >
                  {t('goals.aiPlan')}
                </Button>
              </View>

              {selectedGoal.status !== GoalStatus.DONE && selectedGoal.status !== GoalStatus.CANCELLED && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    handleGoalAction(selectedGoal, 'cancel');
                    setShowGoalModal(false);
                  }}
                  style={[styles.actionButton, { borderColor: theme.colors.textDisabled }]}
                  textColor={theme.colors.textDisabled}
                  icon="cancel"
                  contentStyle={styles.actionButtonContent}
                >
                  {t('goals.cancel')}
                </Button>
              )}

              <Button
                mode="outlined"
                onPress={() => {
                  handleGoalAction(selectedGoal, 'delete');
                  setShowGoalModal(false);
                }}
                style={[styles.actionButton, { borderColor: theme.colors.error }]}
                textColor={theme.colors.error}
                icon="delete"
                contentStyle={styles.actionButtonContent}
              >
                {t('goals.delete')}
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            {t('goals.title')}
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('goals.subtitle', { count: getFilteredGoals().length })}
          </Text>
        </View>
        <View style={styles.headerActions}>
         
          {/* Search and Filters */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
            <Searchbar
              placeholder={t('goals.searchGoals')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
              iconColor={theme.colors.textSecondary}
              inputStyle={{ color: theme.colors.text }}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>
      </View>


      {/* View Mode Toggle */}
      <View style={[styles.viewModeContainer, { backgroundColor: theme.colors.surface }]}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'all' | 'active' | 'completed')}
          buttons={[
            {
              value: 'all',
              label: t('goals.all'),
              style: { backgroundColor: viewMode === 'all' ? theme.colors.primary : theme.colors.surfaceVariant }
            },
            {
              value: 'active',
              label: t('goals.active'),
              style: { backgroundColor: viewMode === 'active' ? theme.colors.primary : theme.colors.surfaceVariant }
            },
            {
              value: 'completed',
              label: t('goals.completed'),
              style: { backgroundColor: viewMode === 'completed' ? theme.colors.primary : theme.colors.surfaceVariant }
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Goals List */}
      <FlatList
        data={getFilteredGoals()}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateGoal}
        // label={t('goals.addGoal')}
        color={theme.colors.onPrimary}
      />

      {renderGoalModal()}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  searchContainer: {
    flex: 1,
    paddingHorizontal: 2,
    paddingVertical: 12,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 12,
  },
  viewModeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  segmentedButtons: {
    marginBottom: 0,
  },
  listContent: {
    padding: 8,
    flexGrow: 1,
  },
  goalCard: {
    marginVertical: 6,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalIcon: {
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  goalTitle: {
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  goalBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    height: 26,

  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight:10
  },
  goalDescription: {
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressValue: {
    fontWeight: '600',
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  milestoneProgress: {
    fontSize: 10,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    margin: 0,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontSize: 14,
  },
  createButton: {
    borderRadius: 12,
    elevation: 2,
  },
  createButtonContent: {
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    elevation: 4,
  },
  goalModal: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  goalModalContent: {
    padding: 0,
  },
  modalHeader: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  modalIcon: {
    marginBottom: 16,
  },
  goalModalTitle: {
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 28,
  },
  divider: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  goalModalActions: {
    padding: 20,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 12,
  },
});