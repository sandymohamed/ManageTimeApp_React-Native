// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   Platform,
//   KeyboardAvoidingView,
// } from 'react-native';
// import {
//   Text,
//   Button,
//   TextInput,
//   Card,
//   Chip,
//   Switch,
//   useTheme,
//   ActivityIndicator,
// } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { routineService } from '@/services/routineService';
// import {
//   Routine,
//   RoutineTask,
//   UpdateRoutineData,
//   RoutineFrequency,
//   RoutineSchedule,
// } from '@/types/routine';
// import { useNotification } from '@/contexts/NotificationContext';

// const RoutineEditScreen: React.FC = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { t } = useTranslation();
//   const theme = useTheme();
//   const { showSuccess, showError } = useNotification();

//   // @ts-ignore
//   const { routineId } = route.params;

//   const [routine, setRoutine] = useState<Routine | null>(null);
//   const [formData, setFormData] = useState<UpdateRoutineData>({
//     title: '',
//     description: '',
//     frequency: 'DAILY',
//     schedule: {
//       time: undefined,
//       days: undefined,
//       day: undefined,
//     },
//     enabled: true,
//   });

//   const [tasks, setTasks] = useState<Array<{ id?: string; title: string; description?: string; reminderTime?: string }>>([]);
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [selectedTime, setSelectedTime] = useState<Date>(new Date());
//   const [selectedDays, setSelectedDays] = useState<number[]>([]);
//   const [selectedDay, setSelectedDay] = useState<number>(1);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(true);

//   const daysOfWeek = [
//     { value: 0, label: t('routines.sunday') },
//     { value: 1, label: t('routines.monday') },
//     { value: 2, label: t('routines.tuesday') },
//     { value: 3, label: t('routines.wednesday') },
//     { value: 4, label: t('routines.thursday') },
//     { value: 5, label: t('routines.friday') },
//     { value: 6, label: t('routines.saturday') },
//   ];

//   useEffect(() => {
//     loadRoutine();
//   }, [routineId]);

//   const loadRoutine = async () => {
//     try {
//       setInitialLoading(true);
//       const data = await routineService.getRoutineById(routineId);
//       setRoutine(data);

//       setFormData({
//         title: data.title,
//         description: data.description || '',
//         frequency: data.frequency,
//         schedule: data.schedule,
//         enabled: data.enabled,
//       });

//       if (data.schedule.time) {
//         const [hours, minutes] = data.schedule.time.split(':');
//         const timeDate = new Date();
//         timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
//         setSelectedTime(timeDate);
//       }

//       if (data.schedule.days) {
//         setSelectedDays(data.schedule.days);
//       }

//       if (data.schedule.day) {
//         setSelectedDay(data.schedule.day);
//       }

//       setTasks(
//         data.routineTasks.map(task => ({
//           id: task.id,
//           title: task.title,
//           description: task.description || '',
//           reminderTime: task.reminderTime || '',
//         }))
//       );
//     } catch (error: any) {
//       console.error('Error loading routine:', error);
//       showError(error.message || t('routines.loadError'));
//       navigation.goBack();
//     } finally {
//       setInitialLoading(false);
//     }
//   };

//   const handleFrequencyChange = (frequency: RoutineFrequency) => {
//     setFormData({
//       ...formData,
//       frequency,
//       schedule: {
//         ...formData.schedule,
//         days: frequency === 'WEEKLY' ? selectedDays : undefined,
//         day: frequency === 'MONTHLY' ? selectedDay : undefined,
//       },
//     });
//   };

//   const handleTimeChange = (event: any, date?: Date) => {
//     if (Platform.OS === 'android') {
//       setShowTimePicker(false);
//     }
//     if (date) {
//       setSelectedTime(date);
//       const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
//       setFormData({
//         ...formData,
//         schedule: {
//           ...formData.schedule,
//           time: timeString,
//         },
//       });
//     }
//   };

//   const toggleDay = (day: number) => {
//     const newDays = selectedDays.includes(day)
//       ? selectedDays.filter(d => d !== day)
//       : [...selectedDays, day].sort();
//     setSelectedDays(newDays);
//     setFormData({
//       ...formData,
//       schedule: {
//         ...formData.schedule,
//         days: newDays,
//       },
//     });
//   };

//   const addTask = () => {
//     setTasks([...tasks, { title: '', description: '', reminderTime: '' }]);
//   };

//   const updateTask = (index: number, field: string, value: string) => {
//     const newTasks = [...tasks];
//     newTasks[index] = { ...newTasks[index], [field]: value };
//     setTasks(newTasks);
//   };

//   const removeTask = async (index: number) => {
//     const task = tasks[index];
//     if (task.id) {
//       // Delete existing task
//       try {
//         await routineService.deleteRoutineTask(task.id);
//       } catch (error) {
//         console.error('Error deleting task:', error);
//       }
//     }
//     setTasks(tasks.filter((_, i) => i !== index));
//   };

//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.title?.trim()) {
//       newErrors.title = t('validation.titleRequired');
//     }

//     if (formData.frequency === 'WEEKLY' && (!selectedDays || selectedDays.length === 0)) {
//       newErrors.days = t('validation.daysRequired');
//     }

//     if (formData.frequency === 'MONTHLY' && (!selectedDay || selectedDay < 1 || selectedDay > 31)) {
//       newErrors.day = 'Please select a valid day of month (1-31)';
//     }

//     const validTasks = tasks.filter(t => t.title.trim());
//     if (validTasks.length === 0) {
//       newErrors.tasks = 'Please add at least one task';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSave = async () => {
//     if (!validateForm()) {
//       showError(t('validation.pleaseFixErrors'));
//       return;
//     }

//     try {
//       setLoading(true);

//       // Update routine
//       await routineService.updateRoutine(routineId, formData);

//       // Update tasks
//       const validTasks = tasks.filter(t => t.title.trim());

//       // Delete tasks that were removed
//       if (routine) {
//         const existingTaskIds = validTasks.map(t => t.id).filter(Boolean);
//         const tasksToDelete = routine.routineTasks.filter(
//           t => !existingTaskIds.includes(t.id)
//         );
//         for (const task of tasksToDelete) {
//           await routineService.deleteRoutineTask(task.id);
//         }
//       }

//       // Update or create tasks
//       for (let i = 0; i < validTasks.length; i++) {
//         const task = validTasks[i];
//         if (task.id) {
//           // Update existing task
//           await routineService.updateRoutineTask(task.id, {
//             title: task.title,
//             description: task.description || undefined,
//             order: i,
//             reminderTime: task.reminderTime || undefined,
//           });
//         } else {
//           // Create new task
//           await routineService.addTaskToRoutine(routineId, {
//             title: task.title,
//             description: task.description || undefined,
//             order: i,
//             reminderTime: task.reminderTime || undefined,
//           });
//         }
//       }

//       showSuccess(t('routines.routineUpdated'));
//       navigation.goBack();
//     } catch (error: any) {
//       console.error('Error updating routine:', error);
//       showError(error.message || t('routines.updateError'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = () => {
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
//               setLoading(true);
//               await routineService.deleteRoutine(routineId);
//               showSuccess(t('routines.routineDeleted'));
//               navigation.goBack();
//             } catch (error: any) {
//               console.error('Error deleting routine:', error);
//               showError(error.message || t('routines.deleteError'));
//             } finally {
//               setLoading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   if (initialLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   if (!routine) {
//     return null;
//   }

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         <Card style={styles.card}>
//           <Card.Content>
//             <Text variant="headlineSmall" style={styles.title}>
//               {t('routines.editRoutine')}
//             </Text>

//             <View style={styles.enabledContainer}>
//               <Text variant="bodyLarge">{t('routines.active')}</Text>
//               <Switch
//                 value={formData.enabled ?? true}
//                 onValueChange={(value) => setFormData({ ...formData, enabled: value })}
//               />
//             </View>

//             <TextInput
//               label={t('routines.title')}
//               value={formData.title || ''}
//               onChangeText={(text) => setFormData({ ...formData, title: text })}
//               error={!!errors.title}
//               mode="outlined"
//               style={styles.input}
//             />
//             {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

//             <TextInput
//               label={t('routines.description')}
//               value={formData.description || ''}
//               onChangeText={(text) => setFormData({ ...formData, description: text })}
//               mode="outlined"
//               multiline
//               numberOfLines={3}
//               style={styles.input}
//             />

//             <Text variant="titleMedium" style={styles.sectionTitle}>
//               {t('routines.frequency')}
//             </Text>
//             <View style={styles.frequencyContainer}>
//               {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RoutineFrequency[]).map((freq) => (
//                 <Chip
//                   key={freq}
//                   selected={formData.frequency === freq}
//                   onPress={() => handleFrequencyChange(freq)}
//                   style={styles.frequencyChip}
//                 >
//                   {t(`routines.${freq.toLowerCase()}`)}
//                 </Chip>
//               ))}
//             </View>

//             <Text variant="titleMedium" style={styles.sectionTitle}>
//               {t('routines.time')}
//             </Text>
//             <Button
//               mode="outlined"
//               onPress={() => setShowTimePicker(true)}
//               icon="clock"
//               style={styles.timeButton}
//             >
//               {formData.schedule?.time || t('routines.selectTime')}
//             </Button>
//             {showTimePicker && (
//               <DateTimePicker
//                 value={selectedTime}
//                 mode="time"
//                 is24Hour={true}
//                 display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                 onChange={handleTimeChange}
//               />
//             )}

//             {formData.frequency === 'WEEKLY' && (
//               <>
//                 <Text variant="titleMedium" style={styles.sectionTitle}>
//                   {t('routines.selectDays')}
//                 </Text>
//                 <View style={styles.daysContainer}>
//                   {daysOfWeek.map((day) => (
//                     <Chip
//                       key={day.value}
//                       selected={selectedDays.includes(day.value)}
//                       onPress={() => toggleDay(day.value)}
//                       style={styles.dayChip}
//                     >
//                       {day.label}
//                     </Chip>
//                   ))}
//                 </View>
//                 {errors.days && <Text style={styles.errorText}>{errors.days}</Text>}
//               </>
//             )}

//             {formData.frequency === 'MONTHLY' && (
//               <>
//                 <Text variant="titleMedium" style={styles.sectionTitle}>
//                   Day of Month (1-31)
//                 </Text>
//                 <TextInput
//                   label="Day"
//                   value={selectedDay.toString()}
//                   onChangeText={(text) => {
//                     const day = parseInt(text, 10);
//                     if (!isNaN(day) && day >= 1 && day <= 31) {
//                       setSelectedDay(day);
//                       setFormData({
//                         ...formData,
//                         schedule: {
//                           ...formData.schedule,
//                           day,
//                         },
//                       });
//                     }
//                   }}
//                   keyboardType="numeric"
//                   mode="outlined"
//                   style={styles.input}
//                 />
//                 {errors.day && <Text style={styles.errorText}>{errors.day}</Text>}
//               </>
//             )}

//             <Text variant="titleMedium" style={styles.sectionTitle}>
//               Tasks
//             </Text>
//             {tasks.map((task, index) => (
//               <Card key={index} style={styles.taskCard}>
//                 <Card.Content>
//                   <View style={styles.taskHeader}>
//                     <Text variant="titleSmall">Task {index + 1}</Text>
//                     <Button
//                       mode="text"
//                       onPress={() => removeTask(index)}
//                       textColor={theme.colors.error}
//                     >
//                       Remove
//                     </Button>
//                   </View>
//                   <TextInput
//                     label="Task Title"
//                     value={task.title}
//                     onChangeText={(text) => updateTask(index, 'title', text)}
//                     mode="outlined"
//                     style={styles.input}
//                   />
//                   <TextInput
//                     label="Description (optional)"
//                     value={task.description || ''}
//                     onChangeText={(text) => updateTask(index, 'description', text)}
//                     mode="outlined"
//                     multiline
//                     style={styles.input}
//                   />
//                   <TextInput
//                     label="Reminder Time (optional, e.g., 10:00)"
//                     value={task.reminderTime || ''}
//                     onChangeText={(text) => updateTask(index, 'reminderTime', text)}
//                     mode="outlined"
//                     style={styles.input}
//                   />
//                 </Card.Content>
//               </Card>
//             ))}
//             {errors.tasks && <Text style={styles.errorText}>{errors.tasks}</Text>}

//             <Button
//               mode="outlined"
//               onPress={addTask}
//               icon="plus"
//               style={styles.addTaskButton}
//             >
//               Add Task
//             </Button>

//             <View style={styles.buttonContainer}>
//               <Button
//                 mode="outlined"
//                 onPress={() => navigation.goBack()}
//                 style={styles.cancelButton}
//                 disabled={loading}
//               >
//                 {t('common.cancel')}
//               </Button>
//               <Button
//                 mode="contained"
//                 onPress={handleSave}
//                 style={styles.saveButton}
//                 loading={loading}
//                 disabled={loading}
//               >
//                 {t('common.save')}
//               </Button>
//             </View>

//             <Button
//               mode="outlined"
//               onPress={handleDelete}
//               textColor={theme.colors.error}
//               style={styles.deleteButton}
//               disabled={loading}
//             >
//               {t('common.delete')}
//             </Button>
//           </Card.Content>
//         </Card>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   card: {
//     margin: 16,
//     elevation: 2,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   title: {
//     marginBottom: 24,
//     fontWeight: 'bold',
//   },
//   enabledContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   input: {
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     marginTop: 16,
//     marginBottom: 12,
//     fontWeight: 'bold',
//   },
//   frequencyContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginBottom: 16,
//   },
//   frequencyChip: {
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   timeButton: {
//     marginBottom: 16,
//   },
//   daysContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginBottom: 16,
//   },
//   dayChip: {
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   taskCard: {
//     marginBottom: 16,
//     backgroundColor: '#FAFAFA',
//   },
//   taskHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   addTaskButton: {
//     marginBottom: 16,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 24,
//     gap: 12,
//   },
//   cancelButton: {
//     flex: 1,
//   },
//   saveButton: {
//     flex: 1,
//   },
//   deleteButton: {
//     marginTop: 16,
//   },
//   errorText: {
//     color: '#B00020',
//     fontSize: 12,
//     marginTop: -12,
//     marginBottom: 8,
//     marginLeft: 12,
//   },
// });

// export { RoutineEditScreen };



import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Card,
  Chip,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { routineService } from '@/services/routineService';
import {
  Routine,
  RoutineTask,
  UpdateRoutineData,
  RoutineFrequency,
} from '@/types/routine';
import { useNotification } from '@/contexts/NotificationContext';

const RoutineEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  // @ts-ignore
  const { routineId } = route.params;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [formData, setFormData] = useState<UpdateRoutineData>({
    title: '',
    description: '',
    frequency: 'DAILY',
    schedule: {
      time: undefined,
      days: undefined,
      day: undefined,
    },
    enabled: true,
  });

  const [tasks, setTasks] = useState<Array<{ id?: string; title: string; description?: string; reminderTime?: string }>>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const daysOfWeek = [
    { value: 0, label: t('routines.sunday') },
    { value: 1, label: t('routines.monday') },
    { value: 2, label: t('routines.tuesday') },
    { value: 3, label: t('routines.wednesday') },
    { value: 4, label: t('routines.thursday') },
    { value: 5, label: t('routines.friday') },
    { value: 6, label: t('routines.saturday') },
  ];

  useEffect(() => {
    loadRoutine();
  }, [routineId]);

  const loadRoutine = async () => {
    try {
      setInitialLoading(true);
      const data = await routineService.getRoutineById(routineId);
      setRoutine(data);

      setFormData({
        title: data.title,
        description: data.description || '',
        frequency: data.frequency,
        schedule: data.schedule,
        enabled: data.enabled,
      });

      if (data.schedule.time) {
        const [hours, minutes] = data.schedule.time.split(':');
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        setSelectedTime(timeDate);
      }

      if (data.schedule.days) {
        setSelectedDays(data.schedule.days);
      }

      if (data.schedule.day) {
        setSelectedDay(data.schedule.day);
      }

      setTasks(
        data.routineTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          reminderTime: task.reminderTime || '',
        }))
      );
    } catch (error: any) {
      console.error('Error loading routine:', error);
      showError(error.message || t('routines.loadError'));
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleFrequencyChange = (frequency: RoutineFrequency) => {
    setFormData({
      ...formData,
      frequency,
      schedule: {
        ...formData.schedule,
        days: frequency === 'WEEKLY' ? selectedDays : undefined,
        day: frequency === 'MONTHLY' ? selectedDay : undefined,
      },
    });
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedTime(date);
      const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setFormData({
        ...formData,
        schedule: {
          ...formData.schedule,
          time: timeString,
        },
      });
    }
  };

  const toggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort();
    setSelectedDays(newDays);
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        days: newDays,
      },
    });
  };

  const addTask = () => {
    setTasks([...tasks, { title: '', description: '', reminderTime: formData.schedule.time || '' }]);
  };

  const updateTask = (index: number, field: string, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const removeTask = async (index: number) => {
    const task = tasks[index];
    if (task.id) {
      try {
        await routineService.deleteRoutineTask(task.id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate title
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = t('validation.titleRequired');
    }

    // Validate time
    if (!formData.schedule?.time) {
      newErrors.time = t('routines.timeRequired') || 'Please select a time';
    }

    // Validate frequency-specific fields
    if (formData.frequency === 'WEEKLY' && (!selectedDays || selectedDays.length === 0)) {
      newErrors.days = t('validation.daysRequired');
    }

    if (formData.frequency === 'MONTHLY' && (!selectedDay || selectedDay < 1 || selectedDay > 31)) {
      newErrors.day = t('routines.dayRequired') || 'Please select a valid day of month (1-31)';
    }

    // Validate tasks
    const validTasks = tasks.filter(t => t.title && t.title.trim());
    if (validTasks.length === 0) {
      newErrors.tasks = t('routines.tasksRequired') || 'Please add at least one task';
    } else {
      // Check if any task has empty title
      tasks.forEach((task, index) => {
        if (task.title && !task.title.trim()) {
          newErrors[`task_${index}_title`] = t('validation.titleRequired');
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showError(t('validation.pleaseFixErrors'));
      return;
    }

    try {
      setLoading(true);

      // Prepare form data - convert empty description to undefined
      const routineData = {
        ...formData,
        description: formData.description?.trim() || undefined,
      };

      await routineService.updateRoutine(routineId, routineData);

      const validTasks = tasks.filter(t => t.title && t.title.trim());

      if (routine) {
        const existingTaskIds = validTasks.map(t => t.id).filter(Boolean);
        const tasksToDelete = routine.routineTasks.filter(
          t => !existingTaskIds.includes(t.id)
        );
        for (const task of tasksToDelete) {
          await routineService.deleteRoutineTask(task.id);
        }
      }

      for (let i = 0; i < validTasks.length; i++) {
        const task = validTasks[i];
        if (task.id) {
          await routineService.updateRoutineTask(task.id, {
            title: task.title.trim(),
            description: task.description?.trim() || undefined,
            order: i,
            reminderTime: task.reminderTime?.trim() || undefined,
          });
        } else {
          await routineService.addTaskToRoutine(routineId, {
            title: task.title.trim(),
            description: task.description?.trim() || undefined,
            order: i,
            reminderTime: task.reminderTime?.trim() || undefined,
          });
        }
      }

      showSuccess(t('routines.routineUpdated'));
      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating routine:', error);
      showError(error.message || t('routines.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
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
              setLoading(true);
              await routineService.deleteRoutine(routineId);
              showSuccess(t('routines.routineDeleted'));
              navigation.goBack();
            } catch (error: any) {
              console.error('Error deleting routine:', error);
              showError(error.message || t('routines.deleteError'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('routines.loading')}</Text>
      </View>
    );
  }

  if (!routine) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {t('routines.editRoutine')}
            </Text>

            <View style={styles.enabledContainer}>
              <Text variant="bodyLarge" style={styles.enabledText}>
                {t('routines.active')}
              </Text>
              <Switch
                value={formData.enabled ?? true}
                onValueChange={(value) => setFormData({ ...formData, enabled: value })}
                color={theme.colors.primary}
              />
            </View>

            <TextInput
              label={t('routines.title')}
              value={formData.title || ''}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              error={!!errors.title}
              mode="outlined"
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

            <TextInput
              label={t('routines.description')}
              value={formData.description || ''}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('routines.frequency')}
            </Text>
            <View style={styles.frequencyContainer}>
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RoutineFrequency[]).map((freq) => (
                <Chip
                  key={freq}
                  selected={formData.frequency === freq}
                  onPress={() => handleFrequencyChange(freq)}
                  style={[
                    styles.frequencyChip,
                    formData.frequency === freq && { backgroundColor: theme.colors.primary }
                  ]}
                  textStyle={formData.frequency === freq ? { color: theme.colors.onPrimary } : {}}
                >
                  {t(`routines.${freq.toLowerCase()}`)}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('routines.time')}
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              icon="clock"
              style={[
                styles.timeButton,
                errors.time && { borderColor: theme.colors.error }
              ]}
              textColor={errors.time ? theme.colors.error : theme.colors.primary}
            >
              {formData.schedule?.time || t('routines.selectTime')}
            </Button>
            {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            {formData.frequency === 'WEEKLY' && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('routines.selectDays')}
                </Text>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map((day) => (
                    <Chip
                      key={day.value}
                      selected={selectedDays.includes(day.value)}
                      onPress={() => toggleDay(day.value)}
                      style={[
                        styles.dayChip,
                        selectedDays.includes(day.value) && { backgroundColor: theme.colors.primary }
                      ]}
                      textStyle={selectedDays.includes(day.value) ? { color: theme.colors.onPrimary } : {}}
                    >
                      {day.label}
                    </Chip>
                  ))}
                </View>
                {errors.days && <Text style={styles.errorText}>{errors.days}</Text>}
              </>
            )}

            {formData.frequency === 'MONTHLY' && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Day of Month (1-31)
                </Text>
                <TextInput
                  label="Day"
                  value={selectedDay.toString()}
                  onChangeText={(text) => {
                    const day = parseInt(text, 10);
                    if (!isNaN(day) && day >= 1 && day <= 31) {
                      setSelectedDay(day);
                      setFormData({
                        ...formData,
                        schedule: {
                          ...formData.schedule,
                          day,
                        },
                      });
                    }
                  }}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
                {errors.day && <Text style={styles.errorText}>{errors.day}</Text>}
              </>
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tasks
            </Text>
            {tasks.map((task, index) => (
              <Card key={index} style={styles.taskCard}>
                <Card.Content>
                  <View style={styles.taskHeader}>
                    <Text variant="titleSmall" style={styles.taskNumber}>
                      Task {index + 1}
                    </Text>
                    <Button
                      mode="text"
                      onPress={() => removeTask(index)}
                      textColor={theme.colors.error}
                    >
                      Remove
                    </Button>
                  </View>
                  <TextInput
                    label="Task Title"
                    value={task.title}
                    onChangeText={(text) => updateTask(index, 'title', text)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                  <TextInput
                    label="Description (optional)"
                    value={task.description || ''}
                    onChangeText={(text) => updateTask(index, 'description', text)}
                    mode="outlined"
                    multiline
                    style={styles.input}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                  <TextInput
                    label="Reminder Time (optional, e.g., 10:00)"
                    value={task.reminderTime || ''}
                    onChangeText={(text) => updateTask(index, 'reminderTime', text)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                </Card.Content>
              </Card>
            ))}
            {errors.tasks && <Text style={styles.errorText}>{errors.tasks}</Text>}

            <Button
              mode="outlined"
              onPress={addTask}
              icon="plus"
              style={styles.addTaskButton}
              textColor={theme.colors.primary}
            >
              Add Task
            </Button>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={loading}
                textColor={theme.colors.primary}
              >
                {t('common.cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                loading={loading}
                disabled={loading}
              >
                {t('common.save')}
              </Button>
            </View>

            <Button
              mode="outlined"
              onPress={handleDelete}
              textColor={theme.colors.error}
              style={[styles.deleteButton, { borderColor: theme.colors.error }]}
              disabled={loading}
            >
              {t('common.delete')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
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
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  enabledContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  enabledText: {
    color: theme.colors.text,
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  frequencyChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  timeButton: {
    marginBottom: 16,
    borderColor: theme.colors.primary,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  taskCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskNumber: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  addTaskButton: {
    marginBottom: 16,
    borderColor: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: theme.colors.primary,
  },
  saveButton: {
    flex: 1,
  },
  deleteButton: {
    marginTop: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 12,
  },
});

export { RoutineEditScreen };
