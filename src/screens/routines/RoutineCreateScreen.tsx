// import React, { useState } from 'react';
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
// } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { useNavigation } from '@react-navigation/native';
// import { routineService } from '@/services/routineService';
// import {
//   CreateRoutineData,
//   RoutineFrequency,
//   RoutineSchedule,
// } from '@/types/routine';
// import { useNotification } from '@/contexts/NotificationContext';

// const RoutineCreateScreen: React.FC = () => {
//   const navigation = useNavigation();
//   const { t } = useTranslation();
//   const theme = useTheme();
//   const { showSuccess, showError } = useNotification();

//   const [formData, setFormData] = useState<CreateRoutineData>({
//     title: '',
//     description: '',
//     frequency: 'DAILY',
//     schedule: {
//       time: undefined,
//       days: undefined,
//       day: undefined,
//     },
//     timezone: 'UTC',
//   });

//   const [tasks, setTasks] = useState<Array<{ title: string; description?: string; reminderTime?: string }>>([]);
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [selectedTime, setSelectedTime] = useState<Date>(new Date());
//   const [selectedDays, setSelectedDays] = useState<number[]>([]);
//   const [selectedDay, setSelectedDay] = useState<number>(1);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);

//   const daysOfWeek = [
//     { value: 0, label: t('routines.sunday') },
//     { value: 1, label: t('routines.monday') },
//     { value: 2, label: t('routines.tuesday') },
//     { value: 3, label: t('routines.wednesday') },
//     { value: 4, label: t('routines.thursday') },
//     { value: 5, label: t('routines.friday') },
//     { value: 6, label: t('routines.saturday') },
//   ];

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

//   const removeTask = (index: number) => {
//     setTasks(tasks.filter((_, i) => i !== index));
//   };

//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.title.trim()) {
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

//       // Create routine
//       const routine = await routineService.createRoutine(formData);

//       // Add tasks
//       const validTasks = tasks.filter(t => t.title.trim());
//       for (let i = 0; i < validTasks.length; i++) {
//         const task = validTasks[i];
//         await routineService.addTaskToRoutine(routine.id, {
//           title: task.title,
//           description: task.description || undefined,
//           order: i,
//           reminderTime: task.reminderTime || undefined,
//         });
//       }

//       showSuccess(t('routines.routineCreated'));
//       navigation.goBack();
//     } catch (error: any) {
//       console.error('Error creating routine:', error);
//       showError(error.message || t('routines.createError'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         <Card style={styles.card}>
//           <Card.Content>
//             <Text variant="headlineSmall" style={styles.title}>
//               {t('routines.createRoutine')}
//             </Text>

//             <TextInput
//               label={t('routines.title')}
//               value={formData.title}
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
//               {formData.schedule.time || t('routines.selectTime')}
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
//   title: {
//     marginBottom: 24,
//     fontWeight: 'bold',
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
//   errorText: {
//     color: '#B00020',
//     fontSize: 12,
//     marginTop: -12,
//     marginBottom: 8,
//     marginLeft: 12,
//   },
// });

// export { RoutineCreateScreen };



import React, { useState } from 'react';
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
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { routineService } from '@/services/routineService';
import {
  CreateRoutineData,
  RoutineFrequency,
} from '@/types/routine';
import { useNotification } from '@/contexts/NotificationContext';

const RoutineCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [formData, setFormData] = useState<CreateRoutineData>({
    title: '',
    description: '',
    frequency: 'DAILY',
    schedule: {
      time: undefined,
      days: undefined,
      day: undefined,
    },
    timezone: 'UTC',
  });

  const [tasks, setTasks] = useState<Array<{ title: string; description?: string; reminderTime?: string }>>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { value: 0, label: t('routines.sunday') },
    { value: 1, label: t('routines.monday') },
    { value: 2, label: t('routines.tuesday') },
    { value: 3, label: t('routines.wednesday') },
    { value: 4, label: t('routines.thursday') },
    { value: 5, label: t('routines.friday') },
    { value: 6, label: t('routines.saturday') },
  ];

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

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate title
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = t('validation.titleRequired');
    }

    // Validate time
    if (!formData.schedule.time) {
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

      const routine = await routineService.createRoutine(routineData);

      const validTasks = tasks.filter(t => t.title && t.title.trim());
      for (let i = 0; i < validTasks.length; i++) {
        const task = validTasks[i];
        await routineService.addTaskToRoutine(routine.id, {
          title: task.title.trim(),
          description: task.description?.trim() || undefined,
          order: i,
          reminderTime: task.reminderTime?.trim() || undefined,
        });
      }

      showSuccess(t('routines.routineCreated'));
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating routine:', error);
      showError(error.message || t('routines.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {t('routines.createRoutine')}
            </Text>

            <TextInput
              label={t('routines.title')}
              value={formData.title}
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
              {formData.schedule.time || t('routines.selectTime')}
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
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
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
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 12,
  },
});

export { RoutineCreateScreen };