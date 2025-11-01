// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import { Card, Title, Paragraph, Button, Chip, IconButton } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { theme } from '@/utils/theme';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { routineService } from '@/services/routineService';
// import { Routine, RoutineTask, RoutineFrequency } from '@/types/routine';
// import { useNotification } from '@/contexts/NotificationContext';

// const RoutinesScreen: React.FC = () => {
//   const navigation = useNavigation();
//   const { t } = useTranslation();
//   const { showSuccess, showError } = useNotification();
//   const [routines, setRoutines] = useState<Routine[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [creatingExamples, setCreatingExamples] = useState(false);

//   // Reload routines when screen comes into focus (after create/edit)
//   useFocusEffect(
//     React.useCallback(() => {
//       loadRoutines();
//     }, [])
//   );

//   const loadRoutines = async () => {
//     try {
//       setLoading(true);
//       const data = await routineService.getUserRoutines();
//       setRoutines(data);
//     } catch (error) {
//       console.error('Error loading routines:', error);
//       Alert.alert(t('common.error'), t('routines.loadError'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadRoutines();
//     setRefreshing(false);
//   };

//   const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
//     try {
//       await routineService.toggleTaskCompletion(taskId, !currentStatus);
//       await loadRoutines();
//     } catch (error) {
//       console.error('Error toggling task:', error);
//       Alert.alert(t('common.error'), t('routines.updateTaskError'));
//     }
//   };

//   const handleEditRoutine = (routineId: string) => {
//     // @ts-ignore
//     navigation.navigate('RoutineEdit', { routineId });
//   };

//   const handleCreateRoutine = () => {
//     // @ts-ignore
//     navigation.navigate('RoutineCreate');
//   };

//   const handleDeleteRoutine = async (routineId: string) => {
//     Alert.alert(
//       t('routines.deleteRoutine'),
//       t('routines.deleteRoutineConfirm'),
//       [
//         { text: t('common.cancel'), style: 'cancel' },
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await routineService.deleteRoutine(routineId);
//               await loadRoutines();
//               showSuccess(t('routines.routineDeleted'));
//             } catch (error) {
//               console.error('Error deleting routine:', error);
//               showError(t('routines.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const createExampleRoutines = async () => {
//     try {
//       setCreatingExamples(true);

//       // Morning Routine
//       const morningRoutine = await routineService.createRoutine({
//         title: t('routines.morningRoutine') || 'Morning Routine',
//         description: t('routines.morningRoutineDesc') || 'Daily morning routine at 6:00 AM',
//         frequency: 'DAILY',
//         schedule: {
//           time: '06:00',
//         },
//         timezone: 'UTC',
//       });

//       await routineService.addTaskToRoutine(morningRoutine.id, {
//         title: 'Drink water',
//         order: 0,
//       });
//       await routineService.addTaskToRoutine(morningRoutine.id, {
//         title: 'Exercise',
//         order: 1,
//       });
//       await routineService.addTaskToRoutine(morningRoutine.id, {
//         title: 'Breakfast',
//         order: 2,
//       });

//       // Friday Prayer (Weekly)
//       const fridayPrayer = await routineService.createRoutine({
//         title: t('routines.fridayPrayer') || 'Friday Prayer',
//         description: t('routines.fridayPrayerDesc') || 'Weekly Friday prayer at 1:00 PM',
//         frequency: 'WEEKLY',
//         schedule: {
//           time: '13:00',
//           days: [5], // Friday
//         },
//         timezone: 'UTC',
//       });

//       await routineService.addTaskToRoutine(fridayPrayer.id, {
//         title: 'Prepare for prayer',
//         order: 0,
//       });
//       await routineService.addTaskToRoutine(fridayPrayer.id, {
//         title: 'Attend Friday prayer',
//         order: 1,
//       });

//       await loadRoutines();
//       showSuccess(t('routines.exampleRoutinesCreated') || 'Example routines created successfully');
//     } catch (error: any) {
//       console.error('Error creating example routines:', error);
//       showError(error.message || 'Failed to create example routines');
//     } finally {
//       setCreatingExamples(false);
//     }
//   };

//   const getFrequencyLabel = (frequency: RoutineFrequency) => {
//     switch (frequency) {
//       case 'DAILY': return t('routines.daily');
//       case 'WEEKLY': return t('routines.weekly');
//       case 'MONTHLY': return t('routines.monthly');
//       case 'YEARLY': return t('routines.yearly');
//     }
//   };

//   const getFrequencyIcon = (frequency: RoutineFrequency) => {
//     switch (frequency) {
//       case 'DAILY': return 'calendar-today';
//       case 'WEEKLY': return 'calendar-range';
//       case 'MONTHLY': return 'calendar-month';
//       case 'YEARLY': return 'calendar';
//     }
//   };

//   const formatNextOccurrence = (date?: string) => {
//     if (!date) return t('routines.notScheduled');
//     return new Date(date).toLocaleString();
//   };

//   const renderRoutine = (routine: Routine) => {
//     const completedTasks = routine.routineTasks.filter(t => t.completed).length;
//     const totalTasks = routine.routineTasks.length;
//     const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

//     return (
//       <Card style={styles.routineCard} key={routine.id}>
//         <Card.Content>
//           <View style={styles.routineHeader}>
//             <View style={styles.routineTitleContainer}>
//               <Title style={styles.routineTitle}>{routine.title}</Title>
//               <Chip
//                 icon={() => <Icon name={getFrequencyIcon(routine.frequency)} size={16} color="#1976D2" />}
//                 style={styles.frequencyChip}
//               >
//                 {getFrequencyLabel(routine.frequency)}
//               </Chip>
//             </View>
//             {routine.schedule.time && (
//               <Chip style={styles.timeChip}>
//                 <Icon name="clock" size={14} color={theme.colors.primary} /> {routine.schedule.time}
//               </Chip>
//             )}
//           </View>

//           {routine.description && (
//             <Paragraph style={styles.description}>{routine.description}</Paragraph>
//           )}

//           <View style={styles.progressContainer}>
//             <View style={styles.progressBar}>
//               <View style={[styles.progressFill, { width: `${progress}%` }]} />
//             </View>
//             <Text style={styles.progressText}>
//               {t('routines.tasksCompleted', { completed: completedTasks, total: totalTasks })}
//             </Text>
//           </View>

//           {/* Routine Tasks */}
//           <View style={styles.tasksContainer}>
//             {routine.routineTasks.map((task, index) => (
//               <Card
//                 key={task.id}
//                 style={[
//                   styles.taskCard,
//                   task.completed && styles.taskCardCompleted,
//                 ]}
//               >
//                 <Card.Content style={styles.taskContent}>
//                   <View style={styles.taskHeader}>
//                     <View style={styles.taskCheckboxContainer}>
//                       <Button
//                         mode="text"
//                         onPress={() => handleToggleTask(task.id, task.completed)}
//                         icon={task.completed ? 'check-circle' : 'circle-outline'}
//                         textColor={task.completed ? '#4CAF50' : theme.colors.textSecondary}
//                       >
//                         <Text
//                           style={[
//                             styles.taskTitle,
//                             task.completed && styles.taskTitleCompleted,
//                           ]}
//                         >
//                           {task.title}
//                         </Text>
//                       </Button>
//                     </View>
//                   </View>
//                   {task.description && (
//                     <Paragraph style={styles.taskDescription}>
//                       {task.description}
//                     </Paragraph>
//                   )}
//                   {task.reminderTime && (
//                     <Chip
//                       icon={() => <Icon name="bell" size={14} />}
//                       style={styles.reminderChip}
//                     >
//                       {task.reminderTime}
//                     </Chip>
//                   )}
//                 </Card.Content>
//               </Card>
//             ))}
//           </View>

//           <View style={styles.routineFooter}>
//             <Text style={styles.nextOccurrence}>
//               {t('routines.next')}: {formatNextOccurrence(routine.nextOccurrenceAt)}
//             </Text>
//             <View style={styles.routineActions}>
//               <IconButton
//                 icon="pencil"
//                 size={20}
//                 onPress={() => handleEditRoutine(routine.id)}
//               />
//               <Button
//                 mode="outlined"
//                 onPress={() => handleDeleteRoutine(routine.id)}
//                 textColor="#F44336"
//                 icon="delete"
//                 style={styles.deleteButton}
//               >
//                 {t('common.delete')}
//               </Button>
//             </View>
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   if (loading && !refreshing) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         style={styles.scrollView}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={[theme.colors.primary || '#1976D2']}
//           />
//         }
//       >
//         {routines.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Icon name="repeat" size={64} color={theme.colors.textSecondary} />
//             <Title style={styles.emptyTitle}>{t('routines.noRoutines')}</Title>
//             <Paragraph style={styles.emptyText}>
//               {t('routines.createFirstRoutine')}
//             </Paragraph>
//             <View style={styles.emptyStateButtons}>
//               <Button
//                 mode="outlined"
//                 onPress={createExampleRoutines}
//                 icon="lightbulb"
//                 loading={creatingExamples}
//                 disabled={creatingExamples}
//                 style={styles.exampleButton}
//               >
//                 {t('routines.createExamples') || 'Create Example Routines'}
//               </Button>
//             </View>
//           </View>
//         ) : (
//           routines.map(routine => renderRoutine(routine))
//         )}
//       </ScrollView>

//       <Button
//         mode="contained"
//         onPress={handleCreateRoutine}
//         style={styles.fab}
//         icon="plus"
//       >
//         {t('routines.createRoutine')}
//       </Button>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background || '#F5F5F5',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: theme.colors.background || '#F5F5F5',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   routineCard: {
//     margin: 16,
//     marginBottom: 8,
//     elevation: 2,
//   },
//   routineHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   routineTitleContainer: {
//     flex: 1,
//   },
//   routineTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   frequencyChip: {
//     marginTop: 8,
//   },
//   timeChip: {
//     marginLeft: 8,
//   },
//   description: {
//     color: theme.colors.textSecondary,
//     marginBottom: 12,
//   },
//   progressContainer: {
//     marginVertical: 12,
//   },
//   progressBar: {
//     height: 8,
//     backgroundColor: theme.colors.outline || '#E0E0E0',
//     borderRadius: 4,
//     marginBottom: 8,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#4CAF50',
//   },
//   progressText: {
//     fontSize: 12,
//     color: theme.colors.textSecondary,
//   },
//   tasksContainer: {
//     marginTop: 12,
//     gap: 8,
//   },
//   taskCard: {
//     backgroundColor: '#F9F9F9',
//     marginBottom: 8,
//   },
//   taskCardCompleted: {
//     opacity: 0.6,
//   },
//   taskContent: {
//     paddingVertical: 8,
//   },
//   taskHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   taskCheckboxContainer: {
//     flex: 1,
//   },
//   taskTitle: {
//     fontSize: 16,
//     color: theme.colors.text,
//   },
//   taskTitleCompleted: {
//     textDecorationLine: 'line-through',
//     color: theme.colors.textSecondary,
//   },
//   taskDescription: {
//     fontSize: 14,
//     color: theme.colors.textSecondary,
//     marginTop: 4,
//   },
//   reminderChip: {
//     marginTop: 8,
//   },
//   routineFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 16,
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.outline || '#E0E0E0',
//   },
//   routineActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   deleteButton: {
//     marginLeft: 8,
//   },
//   nextOccurrence: {
//     fontSize: 12,
//     color: theme.colors.textSecondary,
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 64,
//     paddingHorizontal: 32,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: theme.colors.textSecondary,
//     textAlign: 'center',
//   },
//   emptyStateButtons: {
//     marginTop: 24,
//     width: '100%',
//     alignItems: 'center',
//   },
//   exampleButton: {
//     marginTop: 12,
//   },
//   fab: {
//     position: 'absolute',
//     margin: 16,
//     right: 0,
//     bottom: 0,
//   },
// });

// export { RoutinesScreen };


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, IconButton, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { routineService } from '@/services/routineService';
import { Routine, RoutineTask, RoutineFrequency } from '@/types/routine';
import { useNotification } from '@/contexts/NotificationContext';

const RoutinesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingExamples, setCreatingExamples] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadRoutines();
    }, [])
  );

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const data = await routineService.getUserRoutines();
      setRoutines(data);
    } catch (error) {
      console.error('Error loading routines:', error);
      Alert.alert(t('common.error'), t('routines.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutines();
    setRefreshing(false);
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await routineService.toggleTaskCompletion(taskId, !currentStatus);
      await loadRoutines();
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert(t('common.error'), t('routines.updateTaskError'));
    }
  };

  const handleEditRoutine = (routineId: string) => {
    // @ts-ignore
    navigation.navigate('RoutineEdit', { routineId });
  };

  const handleCreateRoutine = () => {
    // @ts-ignore
    navigation.navigate('RoutineCreate');
  };

  const handleDeleteRoutine = async (routineId: string) => {
    Alert.alert(
      t('routines.deleteRoutine'),
      t('routines.deleteRoutineConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await routineService.deleteRoutine(routineId);
              await loadRoutines();
              showSuccess(t('routines.routineDeleted'));
            } catch (error) {
              console.error('Error deleting routine:', error);
              showError(t('routines.deleteError'));
            }
          },
        },
      ]
    );
  };

  const createExampleRoutines = async () => {
    try {
      setCreatingExamples(true);

      const morningRoutine = await routineService.createRoutine({
        title: t('routines.morningRoutine') || 'Morning Routine',
        description: t('routines.morningRoutineDesc') || 'Daily morning routine at 6:00 AM',
        frequency: 'DAILY',
        schedule: {
          time: '06:00',
        },
        timezone: 'UTC',
      });

      await routineService.addTaskToRoutine(morningRoutine.id, {
        title: 'Drink water',
        order: 0,
      });
      await routineService.addTaskToRoutine(morningRoutine.id, {
        title: 'Exercise',
        order: 1,
      });
      await routineService.addTaskToRoutine(morningRoutine.id, {
        title: 'Breakfast',
        order: 2,
      });

      const fridayPrayer = await routineService.createRoutine({
        title: t('routines.fridayPrayer') || 'Friday Prayer',
        description: t('routines.fridayPrayerDesc') || 'Weekly Friday prayer at 1:00 PM',
        frequency: 'WEEKLY',
        schedule: {
          time: '13:00',
          days: [5],
        },
        timezone: 'UTC',
      });

      await routineService.addTaskToRoutine(fridayPrayer.id, {
        title: 'Prepare for prayer',
        order: 0,
      });
      await routineService.addTaskToRoutine(fridayPrayer.id, {
        title: 'Attend Friday prayer',
        order: 1,
      });

      await loadRoutines();
      showSuccess(t('routines.exampleRoutinesCreated') || 'Example routines created successfully');
    } catch (error: any) {
      console.error('Error creating example routines:', error);
      showError(error.message || 'Failed to create example routines');
    } finally {
      setCreatingExamples(false);
    }
  };

  const getFrequencyLabel = (frequency: RoutineFrequency) => {
    switch (frequency) {
      case 'DAILY': return t('routines.daily');
      case 'WEEKLY': return t('routines.weekly');
      case 'MONTHLY': return t('routines.monthly');
      case 'YEARLY': return t('routines.yearly');
    }
  };

  const getFrequencyIcon = (frequency: RoutineFrequency) => {
    switch (frequency) {
      case 'DAILY': return 'calendar-today';
      case 'WEEKLY': return 'calendar-range';
      case 'MONTHLY': return 'calendar-month';
      case 'YEARLY': return 'calendar';
    }
  };

  const formatNextOccurrence = (date?: string) => {
    if (!date) return t('routines.notScheduled');
    return new Date(date).toLocaleString();
  };

  const renderRoutine = (routine: Routine) => {
    const completedTasks = routine.routineTasks.filter(t => t.completed).length;
    const totalTasks = routine.routineTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
      <Card style={styles.routineCard} key={routine.id}>
        <Card.Content>
          <View style={styles.routineHeader}>
            <View style={styles.routineTitleContainer}>
              <Title style={styles.routineTitle}>{routine.title}</Title>
              <Chip
                icon={() => <Icon name={getFrequencyIcon(routine.frequency)} size={16} color={theme.colors.primary} />}
                style={styles.frequencyChip}
                textStyle={{ color: theme.colors.primary }}
              >
                {getFrequencyLabel(routine.frequency)}
              </Chip>
            </View>
            {routine.schedule.time && (
              <Chip
                style={[styles.timeChip, { backgroundColor: theme.colors.primary + '15' }]}
                textStyle={{ color: theme.colors.primary }}
              >
                <Icon name="clock" size={14} color={theme.colors.primary} /> {routine.schedule.time}
              </Chip>
            )}
          </View>

          {routine.description && (
            <Paragraph style={styles.description}>{routine.description}</Paragraph>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.success }]} />
            </View>
            <Text style={styles.progressText}>
              {t('routines.tasksCompleted', { completed: completedTasks, total: totalTasks })}
            </Text>
          </View>

          <View style={styles.tasksContainer}>
            {routine.routineTasks.map((task, index) => (
              <Card
                key={task.id}
                style={[
                  styles.taskCard,
                  task.completed && styles.taskCardCompleted,
                ]}
              >
                <Card.Content style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskCheckboxContainer}>
                      <Button
                        mode="text"
                        onPress={() => handleToggleTask(task.id, task.completed)}
                        icon={task.completed ? 'check-circle' : 'circle-outline'}
                        textColor={task.completed ? theme.colors.success : theme.colors.textSecondary}
                      >
                        <Text
                          style={[
                            styles.taskTitle,
                            task.completed && styles.taskTitleCompleted,
                          ]}
                        >
                          {task.title}
                        </Text>
                      </Button>
                    </View>
                  </View>
                  {task.description && (
                    <Paragraph style={styles.taskDescription}>
                      {task.description}
                    </Paragraph>
                  )}
                  {task.reminderTime && (
                    <Chip
                      icon={() => <Icon name="bell" size={14} color={theme.colors.primary} />}
                      style={[styles.reminderChip, { backgroundColor: theme.colors.primary + '15' }]}
                      textStyle={{ color: theme.colors.primary }}
                    >
                      {task.reminderTime}
                    </Chip>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>

          <View style={styles.routineFooter}>
            <Text style={styles.nextOccurrence}>
              {t('routines.next')}: {formatNextOccurrence(routine.nextOccurrenceAt)}
            </Text>
            <View style={styles.routineActions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => handleEditRoutine(routine.id)}
              />

              <FAB
                icon="delete"
                style={styles.deleteButton}
                onPress={() => handleDeleteRoutine(routine.id)}
                color={theme.colors.error}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('routines.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="repeat" size={64} color={theme.colors.textSecondary} />
            <Title style={styles.emptyTitle}>{t('routines.noRoutines')}</Title>
            <Paragraph style={styles.emptyText}>
              {t('routines.createFirstRoutine')}
            </Paragraph>
            <View style={styles.emptyStateButtons}>

              <Button
                mode="outlined"
                onPress={createExampleRoutines}
                icon="lightbulb"
                loading={creatingExamples}
                disabled={creatingExamples}
                style={styles.exampleButton}
                textColor={theme.colors.primary}
              >
                {t('routines.createExamples') || 'Create Example Routines'}
              </Button>

            </View>
          </View>
        ) : (
          routines.map(routine => renderRoutine(routine))
        )}
      </ScrollView>

      {/* <Button
        mode="contained"
        onPress={handleCreateRoutine}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        contentStyle={styles.fabContent}
      >
        {t('routines.createRoutine')}
      </Button> */}


      <FAB
        onPress={handleCreateRoutine}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        // contentStyle={styles.fabContent}
        color={theme.colors.onPrimary}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  routineCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routineTitleContainer: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  frequencyChip: {
    marginTop: 8,
    backgroundColor: theme.colors.primary + '15',
  },
  timeChip: {
    marginLeft: 8,
  },
  description: {
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  progressContainer: {
    marginVertical: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.outline,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  tasksContainer: {
    marginTop: 12,
    gap: 8,
  },
  taskCard: {
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: 8,
    borderRadius: 8,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskContent: {
    paddingVertical: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCheckboxContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: theme.colors.text,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  taskDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  reminderChip: {
    marginTop: 8,
  },
  routineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 8,
    borderColor: theme.colors.error,
    backgroundColor: "transparent",
  },
  nextOccurrence: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateButtons: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  exampleButton: {
    marginTop: 12,
    borderColor: theme.colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    elevation: 4,
  },
  fabContent: {
    height: 56,
  },
});

export { RoutinesScreen };