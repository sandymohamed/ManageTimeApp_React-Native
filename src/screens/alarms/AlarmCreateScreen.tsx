// import React, { useState } from 'react';
// import { View, StyleSheet, ScrollView, Platform, Modal, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
// import { Text, Button, Card, TextInput, IconButton, Chip } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useNavigation } from '@react-navigation/native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { useAlarmStore } from '@/store/alarmStore';
// import { CreateAlarmData } from '@/types/alarm';
// import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';

// export const AlarmCreateScreen: React.FC = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation();
//   const { createAlarm, loading } = useAlarmStore();
//   const customTheme = useCustomTheme();
//   const theme = customTheme.theme;
//   const styles = createStyles(theme);

//   // Get default time (1 hour from now, always today)
//   const getDefaultTime = (): Date => {
//     const now = new Date();
//     const date = new Date(now);
//     date.setHours(now.getHours() + 1);
//     date.setMinutes(0);
//     date.setSeconds(0);
//     date.setMilliseconds(0);
//     // Ensure we're using today's date
//     date.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
//     return date;
//   };

//   // State - single source of truth
//   const [selectedTime, setSelectedTime] = useState<Date>(getDefaultTime());
//   const [title, setTitle] = useState('New Alarm');
//   const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
//   const [recurrence, setRecurrence] = useState('none');
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const recurrenceOptions = [
//     { value: 'none', label: t('alarms.recurrence.none') || 'None', icon: 'calendar-remove' },
//     { value: 'daily', label: t('alarms.recurrence.daily') || 'Daily', icon: 'calendar-today' },
//     { value: 'weekdays', label: t('alarms.recurrence.weekdays') || 'Weekdays', icon: 'calendar-week' },
//     { value: 'weekends', label: t('alarms.recurrence.weekends') || 'Weekends', icon: 'calendar-weekend' },
//     { value: 'weekly', label: t('alarms.recurrence.weekly') || 'Weekly', icon: 'calendar-range' },
//   ];

//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (!title.trim()) {
//       newErrors.title = t('alarms.titleRequired') || 'Title is required';
//     }

//     // Validate time is in the future
//     const now = new Date();
//     if (selectedTime <= now) {
//       newErrors.time = t('alarms.futureTimeRequired') || 'Please select a future time';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleCreateAlarm = async () => {
//     if (!validateForm()) return;

//     try {
//       const alarmData: CreateAlarmData = {
//         title: title.trim() || 'New Alarm',
//         time: selectedTime.toISOString(),
//         timezone,
//         enabled: true,
//         recurrenceRule: recurrence === 'none' ? undefined : recurrence,
//       };

//       await createAlarm(alarmData);
//       navigation.goBack();
//     } catch (error) {
//       console.error('Failed to create alarm:', error);
//       Alert.alert('Error', 'Failed to create alarm');
//     }
//   };

//   // Handle time change - ensure date is set to today if time is in the future
//   const handleTimeChange = (event: any, date?: Date) => {
//     if (Platform.OS === 'android') {
//       if (event?.type === 'dismissed') {
//         setShowTimePicker(false);
//         return;
//       }
//     }

//     if (date) {
//       setSelectedTime((prev) => {
//         const baseDate = new Date(prev);
//         baseDate.setHours(date.getHours(), date.getMinutes(), 0, 0);

//         const now = new Date();
//         if (baseDate <= now) {
//           baseDate.setDate(baseDate.getDate() + 1);
//         }

//         return baseDate;
//       });
//     }

//     if (Platform.OS === 'android' && event?.type === 'set') {
//       setShowTimePicker(false);
//     }
//   };

//   // Handle iOS confirm button
//   const handleConfirmTime = () => {
//     setShowTimePicker(false);
//     // selectedTime is already updated via handleTimeChange
//   };

//   // Format time for display
//   const formatTime = (date: Date): string => {
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const formatTimeWithDetails = (date: Date): string => {
//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     let dayInfo = '';
//     if (date.toDateString() === today.toDateString()) {
//       dayInfo = t('alarms.today') || 'Today';
//     } else if (date.toDateString() === tomorrow.toDateString()) {
//       dayInfo = t('alarms.tomorrow') || 'Tomorrow';
//     } else {
//       dayInfo = date.toLocaleDateString([], { weekday: 'long' });
//     }

//     return `${formatTime(date)} • ${dayInfo}`;
//   };

//   const getRecurrenceDescription = () => {
//     switch (recurrence) {
//       case 'daily':
//         return t('alarms.recurrence.dailyDesc') || 'Every day';
//       case 'weekdays':
//         return t('alarms.recurrence.weekdaysDesc') || 'Monday to Friday';
//       case 'weekends':
//         return t('alarms.recurrence.weekendsDesc') || 'Saturday and Sunday';
//       case 'weekly':
//         return t('alarms.recurrence.weeklyDesc') || 'Every week on this day';
//       default:
//         return t('alarms.recurrence.noneDesc') || 'One time alarm';
//     }
//   };

//   return (
//     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//       <View style={styles.container}>
//         <ScrollView 
//           style={styles.scrollView} 
//           contentContainerStyle={styles.content}
//           showsVerticalScrollIndicator={false}
//         >
//           <Card style={styles.card} elevation={3}>
//             <Card.Content>
//               {/* Header */}
//               <View style={styles.header}>
//                 <Text variant="headlineSmall" style={styles.headerTitle}>
//                   {t('alarms.createAlarm') || 'Create Alarm'}
//                 </Text>
//                 <Text variant="bodyMedium" style={styles.headerSubtitle}>
//                   {t('alarms.createAlarmDesc') || 'Set your alarm time and preferences'}
//                 </Text>
//               </View>

//               {/* Time Selection Card */}
//               <Card 
//                 style={[styles.timeCard, errors.time && styles.errorBorder]}
//                 mode="contained"
//               >
//                 <Card.Content>
//                   <TouchableWithoutFeedback onPress={() => setShowTimePicker(true)}>
//                     <View style={styles.timeCardContent}>
//                       <View style={styles.timeIconContainer}>
//                         <IconButton
//                           icon="clock-outline"
//                           size={24}
//                           iconColor={theme.colors.primary}
//                           style={styles.timeIcon}
//                         />
//                       </View>
//                       <View style={styles.timeTextContainer}>
//                         <Text variant="titleLarge" style={styles.timeDisplay}>
//                           {formatTime(selectedTime)}
//                         </Text>
//                         <Text variant="bodyMedium" style={styles.timeDetails}>
//                           {formatTimeWithDetails(selectedTime)}
//                         </Text>
//                       </View>
//                       <IconButton
//                         icon="pencil-outline"
//                         size={20}
//                         onPress={() => setShowTimePicker(true)}
//                       />
//                     </View>
//                   </TouchableWithoutFeedback>
//                 </Card.Content>
//               </Card>
//               {errors.time && (
//                 <Text style={styles.errorText}>{errors.time}</Text>
//               )}

//               {/* Title Input */}
//               <View style={styles.inputContainer}>
//                 <TextInput
//                   label={t('alarms.title') || 'Alarm Title'}
//                   value={title}
//                   onChangeText={setTitle}
//                   mode="outlined"
//                   style={styles.input}
//                   error={!!errors.title}
//                   placeholder="New Alarm"
//                   left={<TextInput.Icon icon="format-title" />}
//                   outlineColor={theme.colors.outline}
//                   activeOutlineColor={theme.colors.primary}
//                 />
//                 {errors.title && (
//                   <Text style={styles.errorText}>{errors.title}</Text>
//                 )}
//               </View>

//               {/* Recurrence Selection */}
//               <View style={styles.section}>
//                 <Text variant="titleSmall" style={styles.sectionTitle}>
//                   {t('alarms.recurrence.title') || 'Repeat'}
//                 </Text>
//                 <Text variant="bodyMedium" style={styles.sectionDescription}>
//                   {getRecurrenceDescription()}
//                 </Text>
                
//                 <ScrollView 
//                   horizontal 
//                   showsHorizontalScrollIndicator={false}
//                   style={styles.chipContainer}
//                   contentContainerStyle={styles.chipContent}
//                 >
//                   {recurrenceOptions.map((option) => (
//                     <Chip
//                       key={option.value}
//                       selected={recurrence === option.value}
//                       onPress={() => setRecurrence(option.value)}
//                       mode="outlined"
//                       style={styles.chip}
//                       showSelectedCheck={false}
//                       icon={option.icon}
//                       selectedColor={theme.colors.primary}
//                     >
//                       {option.label}
//                     </Chip>
//                   ))}
//                 </ScrollView>
//               </View>
//             </Card.Content>
//           </Card>
//         </ScrollView>

//         {/* Action Buttons */}
//         <View style={styles.footer}>
//           <Button
//             mode="outlined"
//             onPress={() => navigation.goBack()}
//             style={styles.cancelButton}
//             disabled={loading}
//             icon="close"
//           >
//             {t('common.cancel') || 'Cancel'}
//           </Button>
//           <Button
//             mode="contained"
//             onPress={handleCreateAlarm}
//             style={styles.saveButton}
//             loading={loading}
//             disabled={loading}
//             icon="check"
//           >
//             {t('common.save') || 'Save Alarm'}
//           </Button>
//         </View>

//         {/* Time Picker Modal */}
//         {showTimePicker && (
//           <Modal
//             visible={showTimePicker}
//             transparent={true}
//             animationType="slide"
//             onRequestClose={() => setShowTimePicker(false)}
//           >
//             <View style={styles.modalOverlay}>
//               <View style={styles.modalContent}>
//                 <View style={styles.modalHeader}>
//                   <Text variant="headlineSmall" style={styles.modalTitle}>
//                     {t('alarms.selectTime') || 'Select Time'}
//                   </Text>
//                   <IconButton
//                     icon="close"
//                     size={24}
//                     onPress={() => setShowTimePicker(false)}
//                   />
//                 </View>

//                 {/* Time Picker - key is used to force re-render with correct value */}
//                 <DateTimePicker
//                   key={selectedTime.getTime()}
//                   value={selectedTime}
//                   mode="time"
//                   display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                   onChange={handleTimeChange}
//                   style={styles.datePicker}
//                   textColor={theme.colors.onSurface}
//                   accentColor={theme.colors.primary}
//                 />
                
//                 {Platform.OS === 'ios' && (
//                   <View style={styles.modalActions}>
//                     <Button
//                       mode="outlined"
//                       onPress={() => setShowTimePicker(false)}
//                       style={styles.modalButton}
//                     >
//                       {t('common.cancel') || 'Cancel'}
//                     </Button>
//                     <Button
//                       mode="contained"
//                       onPress={handleConfirmTime}
//                       style={styles.modalButton}
//                     >
//                       {t('common.confirm') || 'Confirm'}
//                     </Button>
//                   </View>
//                 )}
//               </View>
//             </View>
//           </Modal>
//         )}
//       </View>
//     </TouchableWithoutFeedback>
//   );
// };

// const createStyles = (theme: any) => StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   content: {
//     padding: theme.spacing.md,
//     paddingBottom: 100, // Space for footer
//   },
//   card: {
//     borderRadius: theme.borderRadius.lg,
//     backgroundColor: theme.colors.surface,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: theme.spacing.lg,
//     paddingHorizontal: theme.spacing.sm,
//   },
//   headerTitle: {
//     fontWeight: '700',
//     marginBottom: theme.spacing.xs,
//     color: theme.colors.onSurface,
//   },
//   headerSubtitle: {
//     textAlign: 'center',
//     color: theme.colors.onSurfaceVariant,
//     opacity: 0.7,
//   },
//   timeCard: {
//     marginBottom: theme.spacing.lg,
//     borderRadius: theme.borderRadius.md,
//     backgroundColor: theme.colors.surfaceVariant,
//   },
//   timeCardContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: theme.spacing.sm,
//   },
//   timeIconContainer: {
//     marginRight: theme.spacing.md,
//   },
//   timeIcon: {
//     margin: 0,
//   },
//   timeTextContainer: {
//     flex: 1,
//   },
//   timeDisplay: {
//     fontWeight: '700',
//     fontSize: 28,
//     color: theme.colors.onSurface,
//   },
//   timeDetails: {
//     color: theme.colors.onSurfaceVariant,
//     opacity: 0.8,
//     marginTop: theme.spacing.xs,
//   },
//   inputContainer: {
//     marginBottom: theme.spacing.lg,
//   },
//   input: {
//     marginBottom: theme.spacing.xs,
//   },
//   section: {
//     marginBottom: theme.spacing.lg,
//   },
//   sectionTitle: {
//     fontWeight: '600',
//     marginBottom: theme.spacing.xs,
//     color: theme.colors.onSurface,
//   },
//   sectionDescription: {
//     color: theme.colors.onSurfaceVariant,
//     marginBottom: theme.spacing.md,
//     opacity: 0.8,
//   },
//   chipContainer: {
//     marginHorizontal: -theme.spacing.xs,
//   },
//   chipContent: {
//     paddingHorizontal: theme.spacing.xs,
//   },
//   chip: {
//     marginHorizontal: theme.spacing.xs,
//     marginBottom: theme.spacing.sm,
//   },
//   errorText: {
//     color: theme.colors.error,
//     fontSize: 12,
//     marginTop: theme.spacing.xs,
//     marginLeft: theme.spacing.md,
//   },
//   errorBorder: {
//     borderColor: theme.colors.error,
//     borderWidth: 1,
//   },
//   footer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     padding: theme.spacing.md,
//     backgroundColor: theme.colors.surface,
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.outline,
//     gap: theme.spacing.md,
//   },
//   cancelButton: {
//     flex: 1,
//   },
//   saveButton: {
//     flex: 1,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: theme.colors.surface,
//     borderTopLeftRadius: theme.borderRadius.xl,
//     borderTopRightRadius: theme.borderRadius.xl,
//     padding: theme.spacing.lg,
//     maxHeight: '50%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.lg,
//   },
//   modalTitle: {
//     fontWeight: 'bold',
//   },
//   datePicker: {
//     width: '100%',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: theme.spacing.lg,
//     gap: theme.spacing.md,
//   },
//   modalButton: {
//     flex: 1,
//   },
// });


import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Modal, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { Text, Button, Card, TextInput, IconButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAlarmStore } from '@/store/alarmStore';
import { CreateAlarmData } from '@/types/alarm';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { nativeAlarmBridge } from '@/services/NativeAlarmBridge';

export const AlarmCreateScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { createAlarm, loading } = useAlarmStore();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  // Get default time (1 hour from now, always today)
  const getDefaultTime = (): Date => {
    const now = new Date();
    const date = new Date(now);
    date.setHours(now.getHours() + 1);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    // Ensure we're using today's date
    date.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    return date;
  };

  // State - single source of truth
  const [selectedTime, setSelectedTime] = useState<Date>(getDefaultTime());
  const [title, setTitle] = useState('New Alarm');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [recurrence, setRecurrence] = useState('none');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [ringtoneUri, setRingtoneUri] = useState<string | null>(null);
  const [ringtoneName, setRingtoneName] = useState<string>('Default Alarm');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize default ringtone on mount if not set
  useEffect(() => {
    if (Platform.OS === 'android' && !ringtoneUri) {
      nativeAlarmBridge.getDefaultRingtoneUri().then((uri) => {
        if (uri) {
          setRingtoneUri(uri);
          // Get the actual name for default ringtone
          nativeAlarmBridge.getRingtoneTitle(uri).then((title) => {
            if (title) {
              setRingtoneName(title);
            }
          }).catch(() => {
            // Keep default name if title fetch fails
          });
        }
      }).catch((error) => {
        console.error('Failed to get default ringtone:', error);
      });
    }
  }, []);

  // Update ringtone name whenever ringtoneUri changes
  useEffect(() => {
    if (Platform.OS === 'android' && ringtoneUri) {
      nativeAlarmBridge.getRingtoneTitle(ringtoneUri)
        .then((title) => {
          if (title) {
            setRingtoneName(title);
            console.log('✅ Ringtone name updated:', title);
          }
        })
        .catch((error) => {
          console.warn('Could not get ringtone title for URI:', ringtoneUri, error);
          // Fallback name based on URI
          if (ringtoneUri.includes('default')) {
            setRingtoneName('Default Alarm');
          } else {
            setRingtoneName('Custom Ringtone');
          }
        });
    }
  }, [ringtoneUri]);

  const recurrenceOptions = [
    { value: 'none', label: t('alarms.recurrence.none') || 'None', icon: 'calendar-remove' },
    { value: 'daily', label: t('alarms.recurrence.daily') || 'Daily', icon: 'calendar-today' },
    { value: 'weekdays', label: t('alarms.recurrence.weekdays') || 'Weekdays', icon: 'calendar-week' },
    { value: 'weekends', label: t('alarms.recurrence.weekends') || 'Weekends', icon: 'calendar-weekend' },
    { value: 'weekly', label: t('alarms.recurrence.weekly') || 'Weekly', icon: 'calendar-range' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = t('alarms.titleRequired') || 'Title is required';
    }

    // Validate time is in the future
    const now = new Date();
    if (selectedTime <= now) {
      newErrors.time = t('tasks.futureTimeRequired') || 'Please select a future time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickRingtone = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Info', 'Ringtone picker is only available on Android');
      return;
    }

    console.log('🔔 Opening ringtone picker...');
    try {
      const uri = await nativeAlarmBridge.pickRingtone();
      console.log('🔔 Ringtone picked, URI:', uri);
      if (uri) {
        setRingtoneUri(uri);
        
        // Get the actual ringtone name from native module
        try {
          const title = await nativeAlarmBridge.getRingtoneTitle(uri);
          if (title) {
            setRingtoneName(title);
            console.log('✅ Ringtone name retrieved:', title);
          } else {
            // Fallback if title not available
            setRingtoneName(uri.includes('default') ? 'Default Alarm' : 'Custom Ringtone');
          }
        } catch (titleError) {
          console.warn('Could not get ringtone title, using fallback:', titleError);
          // Fallback to parsing URI
          const uriParts = uri.split('/');
          const lastPart = uriParts[uriParts.length - 1];
          const fallbackName = uri.includes('default') || lastPart === 'default' 
            ? 'Default Alarm' 
            : 'Custom Ringtone';
          setRingtoneName(fallbackName);
        }
      } else {
        console.log('⚠️ No ringtone URI returned');
      }
    } catch (error: any) {
      console.error('❌ Failed to pick ringtone:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      if (errorMessage.includes('CANCELLED')) {
        console.log('ℹ️ User cancelled ringtone picker');
        // Don't show alert for cancellation
      } else {
        Alert.alert('Error', `Failed to pick ringtone: ${errorMessage}`);
      }
    }
  };

  const handleCreateAlarm = async () => {
    if (!validateForm()) return;

    try {
      const alarmData: CreateAlarmData = {
        title: title.trim() || 'New Alarm',
        time: selectedTime.toISOString(),
        timezone,
        enabled: true,
        recurrenceRule: recurrence === 'none' ? undefined : recurrence,
        toneUrl: ringtoneUri || undefined, // Store ringtone URI if selected
      };

      await createAlarm(alarmData);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to create alarm:', err);
      Alert.alert('Error', 'Failed to create alarm');
    }
  };

  // Handle time change - ensure date is set to today if time is in the future
  const handleTimeChange = (event: any, date?: Date) => {
    // On Android, close picker immediately
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    // Only update if we have a valid date
    if (date) {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get the selected time (hours and minutes)
      const selectedHours = date.getHours();
      const selectedMinutes = date.getMinutes();
      
      // Create a new date with today's date and selected time
      const newDate = new Date(today);
      newDate.setHours(selectedHours, selectedMinutes, 0, 0);
      
      // If the selected time is in the past today, use today anyway
      // (validation will catch it if it's too far in the past)
      // Otherwise, if it's in the future, use today
      const now = new Date();
      if (newDate <= now) {
        // Time is in the past - for non-recurring alarms, we could use tomorrow
        // But for now, we'll use today and let validation handle it
        // Actually, let's use today and validation will show an error if needed
      }
      
      setSelectedTime(newDate);
    } else if (Platform.OS === 'android' && event.type === 'dismissed') {
      // User dismissed the picker on Android
      setShowTimePicker(false);
    }
  };

  // Handle iOS confirm button
  const handleConfirmTime = () => {
    setShowTimePicker(false);
    // selectedTime is already updated via handleTimeChange
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeWithDetails = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayInfo = '';
    if (date.toDateString() === today.toDateString()) {
      dayInfo = t('alarms.today') || 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayInfo = t('alarms.tomorrow') || 'Tomorrow';
    } else {
      dayInfo = date.toLocaleDateString([], { weekday: 'long' });
    }

    return `${formatTime(date)} • ${dayInfo}`;
  };

  const getRecurrenceDescription = () => {
    switch (recurrence) {
      case 'daily':
        return t('alarms.recurrence.dailyDesc') || 'Every day';
      case 'weekdays':
        return t('alarms.recurrence.weekdaysDesc') || 'Monday to Friday';
      case 'weekends':
        return t('alarms.recurrence.weekendsDesc') || 'Saturday and Sunday';
      case 'weekly':
        return t('alarms.recurrence.weeklyDesc') || 'Every week on this day';
      default:
        return t('alarms.recurrence.noneDesc') || 'One time alarm';
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card} elevation={3}>
            <Card.Content>
              {/* Header */}
              <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.headerTitle}>
                  {t('alarms.createAlarm') || 'Create Alarm'}
                </Text>
                <Text variant="bodyMedium" style={styles.headerSubtitle}>
                  {t('alarms.createAlarmDesc') || 'Set your alarm time and preferences'}
                </Text>
              </View>

              {/* Time Selection Card */}
              <Card 
                style={[styles.timeCard, errors.time && styles.errorBorder]}
                mode="contained"
              >
                <Card.Content>
                  <TouchableWithoutFeedback onPress={() => setShowTimePicker(true)}>
                    <View style={styles.timeCardContent}>
                      <View style={styles.timeIconContainer}>
                        <IconButton
                          icon="clock-outline"
                          size={24}
                          iconColor={theme.colors.primary}
                          style={styles.timeIcon}
                        />
                      </View>
                      <View style={styles.timeTextContainer}>
                        <Text variant="titleLarge" style={styles.timeDisplay}>
                          {formatTime(selectedTime)}
                        </Text>
                        <Text variant="bodyMedium" style={styles.timeDetails}>
                          {formatTimeWithDetails(selectedTime)}
                        </Text>
                      </View>
                      <IconButton
                        icon="pencil-outline"
                        size={20}
                        onPress={() => setShowTimePicker(true)}
                      />
                    </View>
                  </TouchableWithoutFeedback>
                </Card.Content>
              </Card>
              {errors.time && (
                <Text style={styles.errorText}>{errors.time}</Text>
              )}

              {/* Title Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  label={t('alarms.title') || 'Alarm Title'}
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.title}
                  placeholder="New Alarm"
                  left={<TextInput.Icon icon="format-title" />}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>

              {/* Ringtone Selection */}
              {Platform.OS === 'android' && (
                <View style={styles.section}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    {t('alarms.ringtone') || 'Alarm Sound'}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={handlePickRingtone}
                    icon="music-note"
                    style={styles.ringtoneButton}
                    contentStyle={styles.ringtoneButtonContent}
                  >
                    {ringtoneName}
                  </Button>
                </View>
              )}

              {/* Recurrence Selection */}
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  {t('alarms.recurrence.title') || 'Repeat'}
                </Text>
                <Text variant="bodyMedium" style={styles.sectionDescription}>
                  {getRecurrenceDescription()}
                </Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipContainer}
                  contentContainerStyle={styles.chipContent}
                >
                  {recurrenceOptions.map((option) => (
                    <Chip
                      key={option.value}
                      selected={recurrence === option.value}
                      onPress={() => setRecurrence(option.value)}
                      mode="outlined"
                      style={styles.chip}
                      showSelectedCheck={false}
                      icon={option.icon}
                      selectedColor={theme.colors.primary}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={loading}
            icon="close"
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            mode="contained"
            onPress={handleCreateAlarm}
            style={styles.saveButton}
            loading={loading}
            disabled={loading}
            icon="check"
          >
            {t('common.save') || 'Save Alarm'}
          </Button>
        </View>

        {/* Time Picker Modal */}
        {showTimePicker && (
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text variant="headlineSmall" style={styles.modalTitle}>
                    {t('alarms.selectTime') || 'Select Time'}
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setShowTimePicker(false)}
                  />
                </View>

                {/* Time Picker - key is used to force re-render with correct value */}
                <DateTimePicker
                  key={selectedTime.getTime()}
                  value={selectedTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  style={styles.datePicker}
                  textColor={theme.colors.onSurface}
                  accentColor={theme.colors.primary}
                />
                
                {Platform.OS === 'ios' && (
                  <View style={styles.modalActions}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowTimePicker(false)}
                      style={styles.modalButton}
                    >
                      {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleConfirmTime}
                      style={styles.modalButton}
                    >
                      {t('common.confirm') || 'Confirm'}
                    </Button>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    </TouchableWithoutFeedback>
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
  content: {
    padding: theme.spacing.md,
    paddingBottom: 100, // Space for footer
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    color: theme.colors.onSurface,
  },
  headerSubtitle: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    opacity: 0.7,
  },
  timeCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  timeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  timeIconContainer: {
    marginRight: theme.spacing.md,
  },
  timeIcon: {
    margin: 0,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeDisplay: {
    fontWeight: '700',
    fontSize: 28,
    color: theme.colors.onSurface,
  },
  timeDetails: {
    color: theme.colors.onSurfaceVariant,
    opacity: 0.8,
    marginTop: theme.spacing.xs,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    color: theme.colors.onSurface,
  },
  sectionDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
    opacity: 0.8,
  },
  chipContainer: {
    marginHorizontal: -theme.spacing.xs,
  },
  chipContent: {
    paddingHorizontal: theme.spacing.xs,
  },
  chip: {
    marginHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  ringtoneButton: {
    marginTop: theme.spacing.sm,
  },
  ringtoneButtonContent: {
    paddingVertical: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.md,
  },
  errorBorder: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  datePicker: {
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});