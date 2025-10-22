// import React, {useState, useEffect} from 'react';
// import {View, StyleSheet, FlatList, Switch, Alert} from 'react-native';
// import {Text, FAB, Card, Button, Chip, List, SegmentedButtons, Portal, Modal, TextInput} from 'react-native-paper';
// import {useTranslation} from 'react-i18next';
// import {useNavigation} from '@react-navigation/native';
// import {theme} from '@/utils/theme';
// import {formatTime} from '@/utils/dateUtils';
// import {useAlarmStore} from '@/store/alarmStore';
// import {Alarm, Timer, CreateTimerData} from '@/types/alarm';

// // Define navigation types
// type RootStackParamList = {
//   AlarmCreate: undefined;
//   AlarmEdit: { alarmId: string };
// };

// type NavigationProp = {
//   navigate: (screen: keyof RootStackParamList, params?: any) => void;
//   goBack: () => void;
// };

// export const AlarmsScreen: React.FC = () => {
//   const {t} = useTranslation();
//   const navigation = useNavigation<NavigationProp>();
//   const [activeTab, setActiveTab] = useState('alarms');
//   const [showTimerModal, setShowTimerModal] = useState(false);
//   const [timerTitle, setTimerTitle] = useState('');
//   const [timerDuration, setTimerDuration] = useState(25); // Default 25 minutes

//   const {
//     alarms,
//     timers,
//     activeTimer,
//     loading,
//     error,
//     fetchAlarms,
//     fetchTimers,
//     createTimer,
//     updateTimer,
//     deleteTimer,
//     startTimer,
//     pauseTimer,
//     stopTimer,
//     resetTimer,
//     setActiveTimer,
//     updateTimerRemainingTime,
//     clearError,
//   } = useAlarmStore();

//   useEffect(() => {
//     fetchAlarms();
//     fetchTimers();
//   }, []);

//   // Listen for timer completion
//   useEffect(() => {
//     if (error && error.includes('completed')) {
//       Alert.alert(t('timers.completed'), t('timers.timerCompletedMessage'));
//       clearError();
//     }
//   }, [error, clearError, t]);


//   const handleCreateTimer = async () => {
//     if (!timerTitle.trim()) {
//       Alert.alert(t('common.error'), t('timers.titleRequired'));
//       return;
//     }

//     try {
//       const timerData: CreateTimerData = {
//         title: timerTitle.trim(),
//         duration: timerDuration,
//       };
//       await createTimer(timerData);
//       setShowTimerModal(false);
//       setTimerTitle('');
//       setTimerDuration(25);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.createError'));
//     }
//   };

//   const handleStartTimer = async (timer: Timer) => {
//     try {
//       await startTimer(timer.id);
//       setActiveTimer(timer);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.startError'));
//     }
//   };

//   const handlePauseTimer = async (timer: Timer) => {
//     try {
//       await pauseTimer(timer.id);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.pauseError'));
//     }
//   };

//   const handleStopTimer = async (timer: Timer) => {
//     try {
//       await stopTimer(timer.id);
//       setActiveTimer(null);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.stopError'));
//     }
//   };

//   const handleResetTimer = async (timer: Timer) => {
//     try {
//       await resetTimer(timer.id);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.resetError'));
//     }
//   };

//   const handleDeleteTimer = async (timer: Timer) => {
//     Alert.alert(
//       t('common.confirm'),
//       t('timers.deleteConfirm'),
//       [
//         {text: t('common.cancel'), style: 'cancel'},
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteTimer(timer.id);
//               if (activeTimer?.id === timer.id) {
//                 setActiveTimer(null);
//               }
//             } catch (error) {
//               Alert.alert(t('common.error'), t('timers.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const formatTime = (seconds: number): string => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;

//     if (hours > 0) {
//       return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//     }
//     return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getTimerStatusColor = (timer: Timer) => {
//     if (timer.isCompleted) return theme.colors.success;
//     if (timer.isRunning) return theme.colors.primary;
//     if (timer.isPaused) return theme.colors.warning;
//     return theme.colors.outline;
//   };

//   const getTimerStatusText = (timer: Timer) => {
//     if (timer.isCompleted) return t('timers.completed');
//     if (timer.isRunning) return t('timers.running');
//     if (timer.isPaused) return t('timers.paused');
//     return t('timers.stopped');
//   };

//   const isOfflineTimer = (timer: Timer) => {
//     return timer.id.startsWith('local_') || timer.userId === 'local';
//   };

//   const renderAlarm = ({item}: {item: Alarm}) => (
//     <Card style={styles.alarmCard}>
//       <Card.Content>
//         <View style={styles.alarmHeader}>
//           <View style={styles.alarmInfo}>
//             <Text variant="titleMedium" style={styles.alarmTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineSmall" style={styles.alarmTime}>
//               {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
//             </Text>
//             <Text variant="bodySmall" style={styles.alarmDays}>
//               {item.timezone}
//             </Text>
//           </View>
//           <Switch
//             value={item.enabled}
//             onValueChange={() => handleToggleAlarm(item.id)}
//             trackColor={{false: theme.colors.outline, true: theme.colors.primary}}
//             thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
//           />
//         </View>

//         <View style={styles.alarmDetails}>
//           {item.toneUrl && (
//           <View style={styles.detailRow}>
//             <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.sound')}:
//             </Text>
//             <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.toneUrl}
//             </Text>
//           </View>
//           )}
//           {item.smartWakeWindow && (
//           <View style={styles.detailRow}>
//             <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.smartWake')}:
//             </Text>
//             <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.smartWakeWindow} min
//             </Text>
//           </View>
//           )}
//           {item.snoozeConfig && (
//           <View style={styles.detailRow}>
//             <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.snooze')}:
//             </Text>
//             <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.snoozeConfig.duration} min
//             </Text>
//           </View>
//           )}
//         </View>

//         <View style={styles.alarmActions}>
//           <Button
//             mode="text"
//             onPress={() => navigation.navigate('AlarmEdit', { alarmId: item.id })}
//             style={styles.actionButton}>
//             {t('common.edit')}
//           </Button>
//           <Button
//             mode="text"
//             onPress={() => handleDeleteAlarm(item.id)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}>
//             {t('common.delete')}
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderTimer = ({item}: {item: Timer}) => (
//     <Card style={[styles.timerCard, activeTimer?.id === item.id && styles.activeTimerCard]}>
//       <Card.Content>
//         <View style={styles.timerHeader}>
//           <View style={styles.timerInfo}>
//             <Text variant="titleMedium" style={styles.timerTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineLarge" style={[styles.timerTime, {color: getTimerStatusColor(item)}]}>
//               {formatTime(item.remainingTime)}
//             </Text>
//             <Text variant="bodySmall" style={[styles.timerStatus, {color: getTimerStatusColor(item)}]}>
//               {getTimerStatusText(item)}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.timerDetails}>
//           <View style={styles.detailRow}>
//             <Text variant="bodySmall" style={styles.detailLabel}>
//               {t('timers.duration')}:
//             </Text>
//             <Text variant="bodySmall" style={styles.detailValue}>
//               {item.duration} {t('timers.minutes')}
//             </Text>
//           </View>
//           {isOfflineTimer(item) && (
//             <Chip mode="outlined" compact style={styles.offlineChip}>
//               {t('timers.offline')}
//             </Chip>
//           )}
//         </View>

//         <View style={styles.timerActions}>
//           {!item.isRunning && !item.isCompleted && (
//             <Button
//               mode="contained"
//               onPress={() => handleStartTimer(item)}
//               style={styles.actionButton}>
//               {t('timers.start')}
//             </Button>
//           )}
//           {item.isRunning && !item.isPaused && (
//             <Button
//               mode="outlined"
//               onPress={() => handlePauseTimer(item)}
//               style={styles.actionButton}>
//               {t('timers.pause')}
//             </Button>
//           )}
//           {item.isPaused && (
//             <Button
//               mode="contained"
//               onPress={() => handleStartTimer(item)}
//               style={styles.actionButton}>
//               {t('timers.resume')}
//             </Button>
//           )}
//           {(item.isRunning || item.isPaused) && (
//             <Button
//               mode="outlined"
//               onPress={() => handleStopTimer(item)}
//               style={styles.actionButton}>
//               {t('timers.stop')}
//             </Button>
//           )}
//           {item.isCompleted && (
//             <Button
//               mode="outlined"
//               onPress={() => handleResetTimer(item)}
//               style={styles.actionButton}>
//               {t('timers.reset')}
//             </Button>
//           )}
//           <Button
//             mode="text"
//             onPress={() => handleDeleteTimer(item)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}>
//             {t('common.delete')}
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Text variant="headlineSmall" style={styles.emptyTitle}>
//         {activeTab === 'alarms' ? t('alarms.noAlarms') : t('timers.noTimers')}
//       </Text>
//       <Text variant="bodyMedium" style={styles.emptyMessage}>
//         {activeTab === 'alarms' ? t('alarms.createFirstAlarm') : t('timers.createFirstTimer')}
//       </Text>
//       <Button 
//         mode="contained" 
//         onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : handleCreateAlarm()} 
//         style={styles.createButton}>
//         {activeTab === 'alarms' ? t('alarms.createAlarm') : t('timers.createTimer')}
//       </Button>
//     </View>
//   );

//   const handleCreateAlarm = () => {
//     navigation.navigate('AlarmCreate');
//   };

//   const handleToggleAlarm = async (alarmId: string) => {
//     try {
//       await useAlarmStore.getState().toggleAlarm(alarmId);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('alarms.toggleError'));
//     }
//   };

//   const handleDeleteAlarm = async (alarmId: string) => {
//     Alert.alert(
//       t('common.confirm'),
//       t('alarms.deleteConfirm'),
//       [
//         {text: t('common.cancel'), style: 'cancel'},
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await useAlarmStore.getState().deleteAlarm(alarmId);
//             } catch (error) {
//               Alert.alert(t('common.error'), t('alarms.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <SegmentedButtons
//         value={activeTab}
//         onValueChange={setActiveTab}
//         buttons={[
//           {value: 'alarms', label: t('alarms.title')},
//           {value: 'timers', label: t('timers.title')},
//         ]}
//         style={styles.segmentedButtons}
//       />

//       {activeTab === 'alarms' ? (
//         <FlatList<Alarm>
//           data={alarms}
//           renderItem={renderAlarm}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchAlarms}
//         />
//       ) : (
//         <FlatList<Timer>
//           data={timers}
//           renderItem={renderTimer}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchTimers}
//         />
//       )}

//       <FAB
//         icon="plus"
//         style={styles.fab}
//         onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : handleCreateAlarm()}
//         label={activeTab === 'alarms' ? t('alarms.addAlarm') : t('timers.addTimer')}
//       />

//       <Portal>
//         <Modal
//           visible={showTimerModal}
//           onDismiss={() => setShowTimerModal(false)}
//           contentContainerStyle={styles.modalContent}>
//           <Text variant="headlineSmall" style={styles.modalTitle}>
//             {t('timers.createTimer')}
//           </Text>

//           <TextInput
//             label={t('timers.title')}
//             value={timerTitle}
//             onChangeText={setTimerTitle}
//             style={styles.input}
//             mode="outlined"
//           />

//           <View style={styles.durationContainer}>
//             <Text variant="bodyLarge" style={styles.durationLabel}>
//               {t('timers.duration')}: {timerDuration} {t('timers.minutes')}
//             </Text>
//             <View style={styles.durationButtons}>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))}
//                 style={styles.durationButton}>
//                 -5
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))}
//                 style={styles.durationButton}>
//                 -1
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))}
//                 style={styles.durationButton}>
//                 +1
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))}
//                 style={styles.durationButton}>
//                 +5
//               </Button>
//             </View>
//           </View>

//           <View style={styles.modalActions}>
//             <Button
//               mode="outlined"
//               onPress={() => setShowTimerModal(false)}
//               style={styles.modalButton}>
//               {t('common.cancel')}
//             </Button>
//             <Button
//               mode="contained"
//               onPress={handleCreateTimer}
//               style={styles.modalButton}>
//               {t('common.create')}
//             </Button>
//           </View>
//         </Modal>
//       </Portal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   segmentedButtons: {
//     margin: theme.spacing.sm,
//   },
//   listContent: {
//     padding: theme.spacing.sm,
//     flexGrow: 1,
//   },
//   alarmCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//   },
//   timerCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//   },
//   activeTimerCard: {
//     borderWidth: 2,
//     borderColor: theme.colors.primary,
//     elevation: 8,
//   },
//   alarmHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.md,
//   },
//   timerHeader: {
//     marginBottom: theme.spacing.md,
//   },
//   alarmInfo: {
//     flex: 1,
//   },
//   timerInfo: {
//     alignItems: 'center',
//   },
//   alarmTitle: {
//     marginBottom: theme.spacing.xs,
//   },
//   timerTitle: {
//     marginBottom: theme.spacing.sm,
//     textAlign: 'center',
//   },
//   alarmTime: {
//     color: theme.colors.primary,
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//   },
//   timerTime: {
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 32,
//   },
//   alarmDays: {
//     color: theme.colors.textSecondary,
//   },
//   timerStatus: {
//     fontWeight: '500',
//   },
//   alarmDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   timerDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xs,
//   },
//   detailLabel: {
//     color: theme.colors.textSecondary,
//   },
//   detailValue: {
//     color: theme.colors.text,
//   },
//   smartWakeChip: {
//     alignSelf: 'flex-start',
//     marginTop: theme.spacing.sm,
//   },
//   alarmActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   timerActions: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     flexWrap: 'wrap',
//     gap: theme.spacing.sm,
//   },
//   actionButton: {
//     marginLeft: theme.spacing.sm,
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: theme.spacing.xl,
//   },
//   emptyTitle: {
//     marginBottom: theme.spacing.sm,
//     color: theme.colors.textSecondary,
//   },
//   emptyMessage: {
//     textAlign: 'center',
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.lg,
//   },
//   createButton: {
//     marginTop: theme.spacing.sm,
//   },
//   fab: {
//     position: 'absolute',
//     margin: theme.spacing.md,
//     right: 0,
//     bottom: 0,
//   },
//   modalContent: {
//     backgroundColor: theme.colors.surface,
//     padding: theme.spacing.lg,
//     margin: theme.spacing.lg,
//     borderRadius: theme.spacing.sm,
//   },
//   modalTitle: {
//     marginBottom: theme.spacing.lg,
//     textAlign: 'center',
//   },
//   input: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationContainer: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationLabel: {
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//   },
//   durationButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },
//   durationButton: {
//     minWidth: 60,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },
//   modalButton: {
//     flex: 1,
//     marginHorizontal: theme.spacing.xs,
//   },
//   offlineChip: {
//     alignSelf: 'flex-start',
//     marginTop: theme.spacing.sm,
//     backgroundColor: theme.colors.surfaceVariant,
//   },
// });


// import React, { useState, useEffect, useRef } from 'react';
// import { View, StyleSheet, FlatList, Switch, Alert, Vibration, Platform } from 'react-native';
// import { Text, FAB, Card, Button, Chip, List, SegmentedButtons, Portal, Modal, TextInput, IconButton } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useNavigation } from '@react-navigation/native';
// import { theme } from '@/utils/theme';
// import { useAlarmStore } from '@/store/alarmStore';
// import { Alarm, Timer, CreateTimerData } from '@/types/alarm';
// import Sound from 'react-native-sound';

// // Define navigation types
// type RootStackParamList = {
//   AlarmCreate: undefined;
//   AlarmEdit: { alarmId: string };
// };

// type NavigationProp = {
//   navigate: (screen: keyof RootStackParamList, params?: any) => void;
//   goBack: () => void;
// };

// // Initialize sound
// Sound.setCategory('Playback');

// export const AlarmsScreen: React.FC = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation<NavigationProp>();
//   const [activeTab, setActiveTab] = useState('alarms');
//   const [showTimerModal, setShowTimerModal] = useState(false);
//   const [timerTitle, setTimerTitle] = useState('');
//   const [timerDuration, setTimerDuration] = useState(25); // Default 25 minutes
//   const [alarmSound, setAlarmSound] = useState<Sound | null>(null);
//   const [isRinging, setIsRinging] = useState(false);

//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

//   const {
//     alarms,
//     timers,
//     activeTimer,
//     loading,
//     error,
//     fetchAlarms,
//     fetchTimers,
//     createTimer,
//     updateTimer,
//     deleteTimer,
//     startTimer,
//     pauseTimer,
//     stopTimer,
//     resetTimer,
//     setActiveTimer,
//     updateTimerRemainingTime,
//     clearError,
//     toggleAlarm,
//     deleteAlarm,
//   } = useAlarmStore();

//   useEffect(() => {
//     fetchAlarms();
//     fetchTimers();

//     // Cleanup on unmount
//     return () => {
//       stopAllSounds();
//       clearAllIntervals();
//     };
//   }, []);

//   // Timer countdown effect
//   useEffect(() => {
//     if (activeTimer?.isRunning) {
//       intervalRef.current = setInterval(() => {
//         const updatedTime = activeTimer.remainingTime - 1;

//         if (updatedTime <= 0) {
//           // Timer completed
//           handleTimerCompletion(activeTimer);
//           clearInterval(intervalRef.current!);
//         } else {
//           updateTimerRemainingTime(activeTimer.id, updatedTime);
//         }
//       }, 1000);
//     } else {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//       }
//     }

//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//       }
//     };
//   }, [activeTimer?.isRunning, activeTimer?.remainingTime]);

//   // Listen for timer completion and errors
//   useEffect(() => {
//     if (error) {
//       if (error.includes('completed')) {
//         // Don't show alert for completion - we handle it with sound/vibration
//         clearError();
//       } else {
//         Alert.alert(t('common.error'), error);
//         clearError();
//       }
//     }
//   }, [error]);

//   const clearAllIntervals = () => {
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//     }
//     if (vibrationIntervalRef.current) {
//       clearInterval(vibrationIntervalRef.current);
//     }
//   };

//   const stopAllSounds = () => {
//     if (alarmSound) {
//       alarmSound.stop();
//       alarmSound.release();
//       setAlarmSound(null);
//     }
//     setIsRinging(false);
//   };

//   const playAlarmSound = () => {
//     try {
//       stopAllSounds();

//       // For iOS, use system sound. For Android, you might need a local file
//       const sound = new Sound(
//         'alarm.mp3', // You need to add this sound file to your project
//         Sound.MAIN_BUNDLE,
//         (error) => {
//           if (error) {
//             console.log('Failed to load sound', error);
//             // Fallback to system beep or vibration
//             Vibration.vibrate([500, 500, 500]);
//             return;
//           }

//           sound.play((success) => {
//             if (success) {
//               console.log('Sound played successfully');
//             } else {
//               console.log('Sound playback failed');
//             }
//           });

//           // Loop the sound
//           sound.setNumberOfLoops(-1);
//           setAlarmSound(sound);
//         }
//       );
//     } catch (error) {
//       console.log('Error playing sound:', error);
//       // Fallback to vibration
//       Vibration.vibrate([500, 500, 500], true);
//     }
//   };

//   const handleTimerCompletion = async (timer: Timer) => {
//     try {
//       // Stop the timer
//       await stopTimer(timer.id);
//       setActiveTimer(null);

//       // Play alarm sound and vibrate
//       setIsRinging(true);
//       playAlarmSound();

//       // Start vibration pattern
//       vibrationIntervalRef.current = setInterval(() => {
//         Vibration.vibrate([500, 500, 500]);
//       }, 2000);

//       // Show completion alert with stop option
//       Alert.alert(
//         t('timers.completed'),
//         t('timers.timerCompletedMessage', { title: timer.title }),
//         [
//           {
//             text: t('timers.stopAlarm'),
//             onPress: () => {
//               stopAllSounds();
//               clearInterval(vibrationIntervalRef.current!);
//               resetTimer(timer.id);
//             },
//           },
//         ],
//         { cancelable: false }
//       );
//     } catch (error) {
//       console.log('Error handling timer completion:', error);
//     }
//   };

//   const handleCreateTimer = async () => {
//     if (!timerTitle.trim()) {
//       Alert.alert(t('common.error'), t('timers.titleRequired'));
//       return;
//     }

//     try {
//       const timerData: CreateTimerData = {
//         title: timerTitle.trim(),
//         duration: timerDuration,
//         remainingTime: timerDuration * 60, // Convert to seconds
//       };
//       await createTimer(timerData);
//       setShowTimerModal(false);
//       setTimerTitle('');
//       setTimerDuration(25);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.createError'));
//     }
//   };

//   const handleStartTimer = async (timer: Timer) => {
//     try {
//       await startTimer(timer.id);
//       setActiveTimer(timer);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.startError'));
//     }
//   };

//   const handlePauseTimer = async (timer: Timer) => {
//     try {
//       await pauseTimer(timer.id);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.pauseError'));
//     }
//   };

//   const handleStopTimer = async (timer: Timer) => {
//     try {
//       await stopTimer(timer.id);
//       if (activeTimer?.id === timer.id) {
//         setActiveTimer(null);
//       }
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.stopError'));
//     }
//   };

//   const handleResetTimer = async (timer: Timer) => {
//     try {
//       await resetTimer(timer.id);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.resetError'));
//     }
//   };

//   const handleDeleteTimer = async (timer: Timer) => {
//     Alert.alert(
//       t('common.confirm'),
//       t('timers.deleteConfirm'),
//       [
//         { text: t('common.cancel'), style: 'cancel' },
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               // Stop alarm if this timer is ringing
//               if (timer.id === activeTimer?.id && isRinging) {
//                 stopAllSounds();
//               }

//               await deleteTimer(timer.id);
//               if (activeTimer?.id === timer.id) {
//                 setActiveTimer(null);
//               }
//             } catch (error) {
//               Alert.alert(t('common.error'), t('timers.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const formatTime = (seconds: number): string => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;

//     if (hours > 0) {
//       return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//     }
//     return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getTimerStatusColor = (timer: Timer) => {
//     if (timer.isCompleted) return theme.colors.success;
//     if (timer.isRunning) return theme.colors.primary;
//     if (timer.isPaused) return theme.colors.warning;
//     return theme.colors.outline;
//   };

//   const getTimerStatusText = (timer: Timer) => {
//     if (timer.isCompleted) return t('timers.completed');
//     if (timer.isRunning) return t('timers.running');
//     if (timer.isPaused) return t('timers.paused');
//     return t('timers.stopped');
//   };

//   const isOfflineTimer = (timer: Timer) => {
//     return timer.id.startsWith('local_') || timer.userId === 'local';
//   };

//   const handleToggleAlarm = async (alarmId: string) => {
//     try {
//       await toggleAlarm(alarmId);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('alarms.toggleError'));
//     }
//   };

//   const handleDeleteAlarm = async (alarmId: string) => {
//     Alert.alert(
//       t('common.confirm'),
//       t('alarms.deleteConfirm'),
//       [
//         { text: t('common.cancel'), style: 'cancel' },
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteAlarm(alarmId);
//             } catch (error) {
//               Alert.alert(t('common.error'), t('alarms.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const getAlarmDaysText = (alarm: Alarm) => {
//     if (!alarm.daysOfWeek || alarm.daysOfWeek.length === 0) {
//       return t('alarms.once');
//     }

//     if (alarm.daysOfWeek.length === 7) {
//       return t('alarms.everyday');
//     }

//     const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
//     return alarm.daysOfWeek.map(day => dayAbbreviations[day]).join(' ');
//   };

//   const renderAlarm = ({ item }: { item: Alarm }) => (
//     <Card style={styles.alarmCard}>
//       <Card.Content>
//         <View style={styles.alarmHeader}>
//           <View style={styles.alarmInfo}>
//             <Text variant="titleMedium" style={styles.alarmTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineSmall" style={styles.alarmTime}>
//               {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//             </Text>
//             <View style={styles.alarmMeta}>
//               <Chip mode="outlined" compact style={styles.daysChip}>
//                 {getAlarmDaysText(item)}
//               </Chip>
//               {item.timezone && item.timezone !== 'UTC' && (
//                 <Text variant="bodySmall" style={styles.timezoneText}>
//                   {item.timezone}
//                 </Text>
//               )}
//             </View>
//           </View>
//           <Switch
//             value={item.enabled}
//             onValueChange={() => handleToggleAlarm(item.id)}
//             trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
//             thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
//           />
//         </View>

//         <View style={styles.alarmDetails}>
//           {item.toneUrl && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.sound')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.toneUrl}
//               </Text>
//             </View>
//           )}
//           {item.smartWakeWindow && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.smartWake')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.smartWakeWindow} {t('common.minutes')}
//               </Text>
//             </View>
//           )}
//           {item.snoozeConfig && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.snooze')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.snoozeConfig.duration} {t('common.minutes')}
//               </Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.alarmActions}>
//           <Button
//             mode="text"
//             onPress={() => navigation.navigate('AlarmEdit', { alarmId: item.id })}
//             style={styles.actionButton}>
//             {t('common.edit')}
//           </Button>
//           <Button
//             mode="text"
//             onPress={() => handleDeleteAlarm(item.id)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}>
//             {t('common.delete')}
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderTimer = ({ item }: { item: Timer }) => (
//     <Card style={[
//       styles.timerCard,
//       activeTimer?.id === item.id && styles.activeTimerCard,
//       isRinging && item.id === activeTimer?.id && styles.ringingTimerCard
//     ]}>
//       <Card.Content>
//         <View style={styles.timerHeader}>
//           <View style={styles.timerInfo}>
//             <Text variant="titleMedium" style={styles.timerTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineLarge" style={[styles.timerTime, { color: getTimerStatusColor(item) }]}>
//               {formatTime(item.remainingTime)}
//             </Text>
//             <Text variant="bodySmall" style={[styles.timerStatus, { color: getTimerStatusColor(item) }]}>
//               {getTimerStatusText(item)}
//             </Text>
//           </View>
//           {isRinging && item.id === activeTimer?.id && (
//             <IconButton
//               icon="bell-ring"
//               size={24}
//               iconColor={theme.colors.error}
//               style={styles.ringingIcon}
//             />
//           )}
//         </View>

//         <View style={styles.timerDetails}>
//           <View style={styles.detailRow}>
//             <Text variant="bodySmall" style={styles.detailLabel}>
//               {t('timers.duration')}:
//             </Text>
//             <Text variant="bodySmall" style={styles.detailValue}>
//               {item.duration} {t('common.minutes')}
//             </Text>
//           </View>
//           {isOfflineTimer(item) && (
//             <Chip mode="outlined" compact style={styles.offlineChip}>
//               {t('timers.offline')}
//             </Chip>
//           )}
//         </View>

//         <View style={styles.timerActions}>
//           {!item.isRunning && !item.isCompleted && (
//             <Button
//               mode="contained"
//               onPress={() => handleStartTimer(item)}
//               style={styles.actionButton}
//               disabled={isRinging}>
//               {t('timers.start')}
//             </Button>
//           )}
//           {item.isRunning && !item.isPaused && (
//             <Button
//               mode="outlined"
//               onPress={() => handlePauseTimer(item)}
//               style={styles.actionButton}
//               disabled={isRinging}>
//               {t('timers.pause')}
//             </Button>
//           )}
//           {item.isPaused && (
//             <Button
//               mode="contained"
//               onPress={() => handleStartTimer(item)}
//               style={styles.actionButton}
//               disabled={isRinging}>
//               {t('timers.resume')}
//             </Button>
//           )}
//           {(item.isRunning || item.isPaused) && (
//             <Button
//               mode="outlined"
//               onPress={() => handleStopTimer(item)}
//               style={styles.actionButton}
//               disabled={isRinging}>
//               {t('timers.stop')}
//             </Button>
//           )}
//           {item.isCompleted && (
//             <Button
//               mode="outlined"
//               onPress={() => handleResetTimer(item)}
//               style={styles.actionButton}
//               disabled={isRinging}>
//               {t('timers.reset')}
//             </Button>
//           )}
//           {isRinging && item.id === activeTimer?.id && (
//             <Button
//               mode="contained"
//               onPress={() => {
//                 stopAllSounds();
//                 clearInterval(vibrationIntervalRef.current!);
//                 resetTimer(item.id);
//               }}
//               style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
//               icon="bell-off">
//               {t('timers.stopAlarm')}
//             </Button>
//           )}
//           <Button
//             mode="text"
//             onPress={() => handleDeleteTimer(item)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}
//             disabled={isRinging && item.id === activeTimer?.id}>
//             {t('common.delete')}
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Text variant="headlineSmall" style={styles.emptyTitle}>
//         {activeTab === 'alarms' ? t('alarms.noAlarms') : t('timers.noTimers')}
//       </Text>
//       <Text variant="bodyMedium" style={styles.emptyMessage}>
//         {activeTab === 'alarms' ? t('alarms.createFirstAlarm') : t('timers.createFirstTimer')}
//       </Text>
//       <Button
//         mode="contained"
//         onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//         style={styles.createButton}>
//         {activeTab === 'alarms' ? t('alarms.createAlarm') : t('timers.createTimer')}
//       </Button>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <SegmentedButtons
//         value={activeTab}
//         onValueChange={setActiveTab}
//         buttons={[
//           { value: 'alarms', label: t('alarms.title') },
//           { value: 'timers', label: t('timers.title') },
//         ]}
//         style={styles.segmentedButtons}
//       />

//       {activeTab === 'alarms' ? (
//         <FlatList<Alarm>
//           data={alarms}
//           renderItem={renderAlarm}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchAlarms}
//         />
//       ) : (
//         <FlatList<Timer>
//           data={timers}
//           renderItem={renderTimer}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchTimers}
//         />
//       )}

//       {!isRinging && (
//         <FAB
//           icon="plus"
//           style={styles.fab}
//           onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//           label={activeTab === 'alarms' ? t('alarms.addAlarm') : t('timers.addTimer')}
//         />
//       )}

//       <Portal>
//         <Modal
//           visible={showTimerModal}
//           onDismiss={() => setShowTimerModal(false)}
//           contentContainerStyle={styles.modalContent}>
//           <Text variant="headlineSmall" style={styles.modalTitle}>
//             {t('timers.createTimer')}
//           </Text>

//           <TextInput
//             label={t('timers.title')}
//             value={timerTitle}
//             onChangeText={setTimerTitle}
//             style={styles.input}
//             mode="outlined"
//             maxLength={50}
//           />

//           <View style={styles.durationContainer}>
//             <Text variant="bodyLarge" style={styles.durationLabel}>
//               {t('timers.duration')}: {timerDuration} {t('common.minutes')}
//             </Text>
//             <View style={styles.durationButtons}>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))}
//                 style={styles.durationButton}>
//                 -5
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))}
//                 style={styles.durationButton}>
//                 -1
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))}
//                 style={styles.durationButton}>
//                 +1
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))}
//                 style={styles.durationButton}>
//                 +5
//               </Button>
//             </View>
//           </View>

//           <View style={styles.quickDurations}>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(5)}
//               style={styles.quickButton}>
//               5 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(15)}
//               style={styles.quickButton}>
//               15 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(30)}
//               style={styles.quickButton}>
//               30 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(60)}
//               style={styles.quickButton}>
//               60 min
//             </Button>
//           </View>

//           <View style={styles.modalActions}>
//             <Button
//               mode="outlined"
//               onPress={() => setShowTimerModal(false)}
//               style={styles.modalButton}>
//               {t('common.cancel')}
//             </Button>
//             <Button
//               mode="contained"
//               onPress={handleCreateTimer}
//               style={styles.modalButton}
//               disabled={!timerTitle.trim()}>
//               {t('common.create')}
//             </Button>
//           </View>
//         </Modal>
//       </Portal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   segmentedButtons: {
//     margin: theme.spacing.sm,
//   },
//   listContent: {
//     padding: theme.spacing.sm,
//     flexGrow: 1,
//   },
//   alarmCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   timerCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   activeTimerCard: {
//     borderWidth: 2,
//     borderColor: theme.colors.primary,
//     elevation: 8,
//   },
//   ringingTimerCard: {
//     borderWidth: 3,
//     borderColor: theme.colors.error,
//     backgroundColor: `${theme.colors.error}10`,
//     elevation: 12,
//   },
//   alarmHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: theme.spacing.md,
//   },
//   timerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.md,
//   },
//   alarmInfo: {
//     flex: 1,
//   },
//   timerInfo: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   alarmTitle: {
//     marginBottom: theme.spacing.xs,
//     fontWeight: '600',
//   },
//   timerTitle: {
//     marginBottom: theme.spacing.sm,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   alarmTime: {
//     color: theme.colors.primary,
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 28,
//   },
//   timerTime: {
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 32,
//   },
//   alarmMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: theme.spacing.sm,
//   },
//   daysChip: {
//     height: 24,
//   },
//   timezoneText: {
//     color: theme.colors.textSecondary,
//     fontSize: 12,
//   },
//   timerStatus: {
//     fontWeight: '500',
//   },
//   alarmDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   timerDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xs,
//   },
//   detailLabel: {
//     color: theme.colors.textSecondary,
//   },
//   detailValue: {
//     color: theme.colors.text,
//   },
//   alarmActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   timerActions: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     flexWrap: 'wrap',
//     gap: theme.spacing.sm,
//   },
//   actionButton: {
//     minWidth: 80,
//   },
//   ringingIcon: {
//     margin: 0,
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: theme.spacing.xl,
//   },
//   emptyTitle: {
//     marginBottom: theme.spacing.sm,
//     color: theme.colors.textSecondary,
//     textAlign: 'center',
//   },
//   emptyMessage: {
//     textAlign: 'center',
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.lg,
//     lineHeight: 20,
//   },
//   createButton: {
//     marginTop: theme.spacing.sm,
//   },
//   fab: {
//     position: 'absolute',
//     margin: theme.spacing.md,
//     right: 0,
//     bottom: 0,
//     borderRadius: 28,
//   },
//   modalContent: {
//     backgroundColor: theme.colors.surface,
//     padding: theme.spacing.lg,
//     margin: theme.spacing.lg,
//     borderRadius: theme.spacing.md,
//   },
//   modalTitle: {
//     marginBottom: theme.spacing.lg,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   input: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationContainer: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationLabel: {
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//     fontWeight: '500',
//   },
//   durationButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.md,
//   },
//   durationButton: {
//     minWidth: 60,
//   },
//   quickDurations: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.lg,
//   },
//   quickButton: {
//     minWidth: 60,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     gap: theme.spacing.sm,
//   },
//   modalButton: {
//     flex: 1,
//   },
//   offlineChip: {
//     alignSelf: 'flex-start',
//     marginTop: theme.spacing.sm,
//     backgroundColor: theme.colors.surfaceVariant,
//   },
// });



// import React, {useState, useEffect, useRef} from 'react';
// import {View, StyleSheet, FlatList, Switch, Alert, Vibration, Platform} from 'react-native';
// import {Text, FAB, Card, Button, Chip, List, SegmentedButtons, Portal, Modal, TextInput, IconButton} from 'react-native-paper';
// import {useTranslation} from 'react-i18next';
// import {useNavigation} from '@react-navigation/native';
// import {theme} from '@/utils/theme';
// import {useAlarmStore} from '@/store/alarmStore';
// import {Alarm, Timer, CreateTimerData} from '@/types/alarm';

// // Define navigation types
// type RootStackParamList = {
//   AlarmCreate: undefined;
//   AlarmEdit: { alarmId: string };
// };

// type NavigationProp = {
//   navigate: (screen: keyof RootStackParamList, params?: any) => void;
//   goBack: () => void;
// };

// // Sound service using React Native APIs
// class SoundService {
//   private isPlaying = false;
//   private vibrationInterval: NodeJS.Timeout | null = null;

//   playAlarm() {
//     this.stopAlarm(); // Stop any existing alarm first

//     this.isPlaying = true;

//     // Play system sound (you can replace this with a custom sound implementation)
//     if (Platform.OS === 'ios') {
//       // For iOS, you can use SystemSounds
//       this.playVibrationPattern();
//     } else {
//       // For Android, use vibration and system beep
//       this.playVibrationPattern();
//     }

//     // Start vibration pattern
//     this.vibrationInterval = setInterval(() => {
//       Vibration.vibrate([500, 500, 500]);
//     }, 2000);
//   }

//   private playVibrationPattern() {
//     // Vibrate pattern: vibrate for 500ms, pause for 500ms, vibrate for 500ms
//     Vibration.vibrate([500, 500, 500], true);
//   }

//   stopAlarm() {
//     this.isPlaying = false;
//     Vibration.cancel();

//     if (this.vibrationInterval) {
//       clearInterval(this.vibrationInterval);
//       this.vibrationInterval = null;
//     }
//   }

//   isAlarmPlaying() {
//     return this.isPlaying;
//   }
// }

// export const AlarmsScreen: React.FC = () => {
//   const {t} = useTranslation();
//   const navigation = useNavigation<NavigationProp>();
//   const [activeTab, setActiveTab] = useState('alarms');
//   const [showTimerModal, setShowTimerModal] = useState(false);
//   const [timerTitle, setTimerTitle] = useState('');
//   const [timerDuration, setTimerDuration] = useState(25); // Default 25 minutes

//   const soundService = useRef(new SoundService()).current;

//   const {
//     alarms,
//     timers,
//     activeTimer,
//     loading,
//     error,
//     fetchAlarms,
//     fetchTimers,
//     createTimer,
//     updateTimer,
//     deleteTimer,
//     startTimer,
//     pauseTimer,
//     stopTimer,
//     resetTimer,
//     setActiveTimer,
//     updateTimerRemainingTime,
//     clearError,
//     toggleAlarm,
//     deleteAlarm,
//   } = useAlarmStore();

//   useEffect(() => {
//     fetchAlarms();
//     fetchTimers();

//     // Cleanup on unmount
//     return () => {
//       soundService.stopAlarm();
//       clearAllIntervals();
//     };
//   }, []);

//   // Timer countdown effect
//   useEffect(() => {
//     if (activeTimer?.isRunning) {
//       const interval = setInterval(() => {
//         const updatedTime = activeTimer.remainingTime - 1;

//         if (updatedTime <= 0) {
//           // Timer completed
//           handleTimerCompletion(activeTimer);
//           clearInterval(interval);
//         } else {
//           updateTimerRemainingTime(activeTimer.id, updatedTime);
//         }
//       }, 1000);

//       return () => clearInterval(interval);
//     }
//   }, [activeTimer?.isRunning, activeTimer?.remainingTime]);

//   // Listen for timer completion and errors
//   useEffect(() => {
//     if (error) {
//       if (error.includes('completed')) {
//         clearError();
//       } else {
//         Alert.alert(t('common.error'), error);
//         clearError();
//       }
//     }
//   }, [error]);

//   const clearAllIntervals = () => {
//     // Intervals are now cleaned up in useEffect return
//   };

//   const handleTimerCompletion = async (timer: Timer) => {
//     try {
//       // Stop the timer
//       await stopTimer(timer.id);
//       setActiveTimer(null);

//       // Play alarm sound and vibrate
//       soundService.playAlarm();

//       // Show completion alert with stop option
//       Alert.alert(
//         t('timers.completed'),
//         t('timers.timerCompletedMessage', { title: timer.title }),
//         [
//           {
//             text: t('timers.stopAlarm'),
//             onPress: () => {
//               soundService.stopAlarm();
//               resetTimer(timer.id);
//             },
//           },
//         ],
//         { cancelable: false }
//       );
//     } catch (error) {
//       console.log('Error handling timer completion:', error);
//       Alert.alert(t('common.error'), t('timers.completionError'));
//     }
//   };

//   const handleCreateTimer = async () => {
//     if (!timerTitle.trim()) {
//       Alert.alert(t('common.error'), t('timers.titleRequired'));
//       return;
//     }

//     try {
//       const timerData: CreateTimerData = {
//         title: timerTitle.trim(),
//         duration: timerDuration,
//       };
//       await createTimer(timerData);
//       setShowTimerModal(false);
//       setTimerTitle('');
//       setTimerDuration(25);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.createError'));
//     }
//   };

//   const handleStartTimer = async (timer: Timer) => {
//     try {
//       await startTimer(timer.id);
//       setActiveTimer(timer);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.startError'));
//     }
//   };

//   const handlePauseTimer = async (timer: Timer) => {
//     try {
//       await pauseTimer(timer.id);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.pauseError'));
//     }
//   };

//   const handleStopTimer = async (timer: Timer) => {
//     try {
//       await stopTimer(timer.id);
//       if (activeTimer?.id === timer.id) {
//         setActiveTimer(null);
//       }
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.stopError'));
//     }
//   };

//   const handleResetTimer = async (timer: Timer) => {
//     try {
//       await resetTimer(timer.id);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.resetError'));
//     }
//   };

//   const handleDeleteTimer = async (timer: Timer) => {
//     Alert.alert(
//       t('common.confirm'),
//       t('timers.deleteConfirm'),
//       [
//         {text: t('common.cancel'), style: 'cancel'},
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               // Stop alarm if this timer is ringing
//               if (timer.id === activeTimer?.id && soundService.isAlarmPlaying()) {
//                 soundService.stopAlarm();
//               }

//               await deleteTimer(timer.id);
//               if (activeTimer?.id === timer.id) {
//                 setActiveTimer(null);
//               }
//             } catch (error) {
//               Alert.alert(t('common.error'), t('timers.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const formatTime = (seconds: number): string => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;

//     if (hours > 0) {
//       return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//     }
//     return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getTimerStatusColor = (timer: Timer) => {
//     if (timer.isCompleted) return theme.colors.success;
//     if (timer.isRunning) return theme.colors.primary;
//     if (timer.isPaused) return theme.colors.warning;
//     return theme.colors.outline;
//   };

//   const getTimerStatusText = (timer: Timer) => {
//     if (timer.isCompleted) return t('timers.completed');
//     if (timer.isRunning) return t('timers.running');
//     if (timer.isPaused) return t('timers.paused');
//     return t('timers.stopped');
//   };

//   const isOfflineTimer = (timer: Timer) => {
//     return timer.id.startsWith('local_') || timer.userId === 'local';
//   };

//   const handleToggleAlarm = async (alarmId: string) => {
//     try {
//       await toggleAlarm(alarmId);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('alarms.toggleError'));
//     }
//   };

//   const handleDeleteAlarm = async (alarmId: string) => {
//     Alert.alert(
//       t('common.confirm'),
//       t('alarms.deleteConfirm'),
//       [
//         {text: t('common.cancel'), style: 'cancel'},
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteAlarm(alarmId);
//             } catch (error) {
//               Alert.alert(t('common.error'), t('alarms.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const getAlarmDaysText = (alarm: Alarm) => {
//     if (!alarm.recurrenceRule) {
//       return t('alarms.once');
//     }

//     // Parse recurrence rule to determine if it's daily
//     if (alarm.recurrenceRule.includes('FREQ=DAILY')) {
//       return t('alarms.everyday');
//     }

//     // For now, show "Custom" for other recurrence patterns
//     // You can expand this to parse specific days from the recurrence rule
//     return t('alarms.custom');
//   };

//   const renderAlarm = ({item}: {item: Alarm}) => (
//     <Card style={styles.alarmCard}>
//       <Card.Content>
//         <View style={styles.alarmHeader}>
//           <View style={styles.alarmInfo}>
//             <Text variant="titleMedium" style={styles.alarmTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineSmall" style={styles.alarmTime}>
//               {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
//             </Text>
//             <View style={styles.alarmMeta}>
//               <Chip mode="outlined" compact style={styles.daysChip}>
//                 {getAlarmDaysText(item)}
//               </Chip>
//               {item.timezone && item.timezone !== 'UTC' && (
//                 <Text variant="bodySmall" style={styles.timezoneText}>
//                   {item.timezone}
//                 </Text>
//               )}
//             </View>
//           </View>
//           <Switch
//             value={item.enabled}
//             onValueChange={() => handleToggleAlarm(item.id)}
//             trackColor={{false: theme.colors.outline, true: theme.colors.primary}}
//             thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
//           />
//         </View>

//         <View style={styles.alarmDetails}>
//           {item.toneUrl && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.sound')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.toneUrl}
//               </Text>
//             </View>
//           )}
//           {item.smartWakeWindow && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.smartWake')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.smartWakeWindow} {t('common.minutes')}
//               </Text>
//             </View>
//           )}
//           {item.snoozeConfig && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.snooze')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.snoozeConfig.duration} {t('common.minutes')}
//               </Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.alarmActions}>
//           <Button
//             mode="text"
//             onPress={() => navigation.navigate('AlarmEdit', { alarmId: item.id })}
//             style={styles.actionButton}>
//             {t('common.edit')}
//           </Button>
//           <Button
//             mode="text"
//             onPress={() => handleDeleteAlarm(item.id)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}>
//             {t('common.delete')}
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderTimer = ({item}: {item: Timer}) => {
//     const isRinging = soundService.isAlarmPlaying() && item.id === activeTimer?.id;

//     return (
//       <Card style={[
//         styles.timerCard, 
//         activeTimer?.id === item.id && styles.activeTimerCard,
//         isRinging && styles.ringingTimerCard
//       ]}>
//         <Card.Content>
//           <View style={styles.timerHeader}>
//             <View style={styles.timerInfo}>
//               <Text variant="titleMedium" style={styles.timerTitle}>
//                 {item.title}
//               </Text>
//               <Text variant="headlineLarge" style={[styles.timerTime, {color: getTimerStatusColor(item)}]}>
//                 {formatTime(item.remainingTime)}
//               </Text>
//               <Text variant="bodySmall" style={[styles.timerStatus, {color: getTimerStatusColor(item)}]}>
//                 {getTimerStatusText(item)}
//               </Text>
//             </View>
//             {isRinging && (
//               <IconButton
//                 icon="bell-ring"
//                 size={24}
//                 iconColor={theme.colors.error}
//                 style={styles.ringingIcon}
//               />
//             )}
//           </View>

//           <View style={styles.timerDetails}>
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('timers.duration')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.duration} {t('common.minutes')}
//               </Text>
//             </View>
//             {isOfflineTimer(item) && (
//               <Chip mode="outlined" compact style={styles.offlineChip}>
//                 {t('timers.offline')}
//               </Chip>
//             )}
//           </View>

//           <View style={styles.timerActions}>
//             {!item.isRunning && !item.isCompleted && (
//               <Button
//                 mode="contained"
//                 onPress={() => handleStartTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.start')}
//               </Button>
//             )}
//             {item.isRunning && !item.isPaused && (
//               <Button
//                 mode="outlined"
//                 onPress={() => handlePauseTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.pause')}
//               </Button>
//             )}
//             {item.isPaused && (
//               <Button
//                 mode="contained"
//                 onPress={() => handleStartTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.resume')}
//               </Button>
//             )}
//             {(item.isRunning || item.isPaused) && (
//               <Button
//                 mode="outlined"
//                 onPress={() => handleStopTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.stop')}
//               </Button>
//             )}
//             {item.isCompleted && (
//               <Button
//                 mode="outlined"
//                 onPress={() => handleResetTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.reset')}
//               </Button>
//             )}
//             {isRinging && (
//               <Button
//                 mode="contained"
//                 onPress={() => {
//                   soundService.stopAlarm();
//                   resetTimer(item.id);
//                 }}
//                 style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
//                 icon="bell-off">
//                 {t('timers.stopAlarm')}
//               </Button>
//             )}
//             <Button
//               mode="text"
//               onPress={() => handleDeleteTimer(item)}
//               textColor={theme.colors.error}
//               style={styles.actionButton}
//               disabled={isRinging}>
//               {t('common.delete')}
//             </Button>
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Text variant="headlineSmall" style={styles.emptyTitle}>
//         {activeTab === 'alarms' ? t('alarms.noAlarms') : t('timers.noTimers')}
//       </Text>
//       <Text variant="bodyMedium" style={styles.emptyMessage}>
//         {activeTab === 'alarms' ? t('alarms.createFirstAlarm') : t('timers.createFirstTimer')}
//       </Text>
//       <Button 
//         mode="contained" 
//         onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')} 
//         style={styles.createButton}>
//         {activeTab === 'alarms' ? t('alarms.createAlarm') : t('timers.createTimer')}
//       </Button>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <SegmentedButtons
//         value={activeTab}
//         onValueChange={setActiveTab}
//         buttons={[
//           {value: 'alarms', label: t('alarms.title')},
//           {value: 'timers', label: t('timers.title')},
//         ]}
//         style={styles.segmentedButtons}
//       />

//       {activeTab === 'alarms' ? (
//         <FlatList<Alarm>
//           data={alarms}
//           renderItem={renderAlarm}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchAlarms}
//         />
//       ) : (
//         <FlatList<Timer>
//           data={timers}
//           renderItem={renderTimer}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchTimers}
//         />
//       )}

//       {!soundService.isAlarmPlaying() && (
//         <FAB
//           icon="plus"
//           style={styles.fab}
//           onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//           label={activeTab === 'alarms' ? t('alarms.addAlarm') : t('timers.addTimer')}
//         />
//       )}

//       <Portal>
//         <Modal
//           visible={showTimerModal}
//           onDismiss={() => setShowTimerModal(false)}
//           contentContainerStyle={styles.modalContent}>
//           <Text variant="headlineSmall" style={styles.modalTitle}>
//             {t('timers.createTimer')}
//           </Text>

//           <TextInput
//             label={t('timers.title')}
//             value={timerTitle}
//             onChangeText={setTimerTitle}
//             style={styles.input}
//             mode="outlined"
//             maxLength={50}
//           />

//           <View style={styles.durationContainer}>
//             <Text variant="bodyLarge" style={styles.durationLabel}>
//               {t('timers.duration')}: {timerDuration} {t('common.minutes')}
//             </Text>
//             <View style={styles.durationButtons}>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))}
//                 style={styles.durationButton}>
//                 -5
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))}
//                 style={styles.durationButton}>
//                 -1
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))}
//                 style={styles.durationButton}>
//                 +1
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))}
//                 style={styles.durationButton}>
//                 +5
//               </Button>
//             </View>
//           </View>

//           <View style={styles.quickDurations}>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(5)}
//               style={styles.quickButton}>
//               5 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(15)}
//               style={styles.quickButton}>
//               15 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(30)}
//               style={styles.quickButton}>
//               30 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(60)}
//               style={styles.quickButton}>
//               60 min
//             </Button>
//           </View>

//           <View style={styles.modalActions}>
//             <Button
//               mode="outlined"
//               onPress={() => setShowTimerModal(false)}
//               style={styles.modalButton}>
//               {t('common.cancel')}
//             </Button>
//             <Button
//               mode="contained"
//               onPress={handleCreateTimer}
//               style={styles.modalButton}
//               disabled={!timerTitle.trim()}>
//               {t('common.create')}
//             </Button>
//           </View>
//         </Modal>
//       </Portal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   segmentedButtons: {
//     margin: theme.spacing.sm,
//   },
//   listContent: {
//     padding: theme.spacing.sm,
//     flexGrow: 1,
//   },
//   alarmCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   timerCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   activeTimerCard: {
//     borderWidth: 2,
//     borderColor: theme.colors.primary,
//     elevation: 8,
//   },
//   ringingTimerCard: {
//     borderWidth: 3,
//     borderColor: theme.colors.error,
//     backgroundColor: `${theme.colors.error}10`,
//     elevation: 12,
//   },
//   alarmHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: theme.spacing.md,
//   },
//   timerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.md,
//   },
//   alarmInfo: {
//     flex: 1,
//   },
//   timerInfo: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   alarmTitle: {
//     marginBottom: theme.spacing.xs,
//     fontWeight: '600',
//   },
//   timerTitle: {
//     marginBottom: theme.spacing.sm,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   alarmTime: {
//     color: theme.colors.primary,
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 28,
//   },
//   timerTime: {
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 32,
//   },
//   alarmMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: theme.spacing.sm,
//   },
//   daysChip: {
//     height: 24,
//   },
//   timezoneText: {
//     color: theme.colors.textSecondary,
//     fontSize: 12,
//   },
//   timerStatus: {
//     fontWeight: '500',
//   },
//   alarmDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   timerDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xs,
//   },
//   detailLabel: {
//     color: theme.colors.textSecondary,
//   },
//   detailValue: {
//     color: theme.colors.text,
//   },
//   alarmActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   timerActions: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     flexWrap: 'wrap',
//     gap: theme.spacing.sm,
//   },
//   actionButton: {
//     minWidth: 80,
//   },
//   ringingIcon: {
//     margin: 0,
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: theme.spacing.xl,
//   },
//   emptyTitle: {
//     marginBottom: theme.spacing.sm,
//     color: theme.colors.textSecondary,
//     textAlign: 'center',
//   },
//   emptyMessage: {
//     textAlign: 'center',
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.lg,
//     lineHeight: 20,
//   },
//   createButton: {
//     marginTop: theme.spacing.sm,
//   },
//   fab: {
//     position: 'absolute',
//     margin: theme.spacing.md,
//     right: 0,
//     bottom: 0,
//     borderRadius: 28,
//   },
//   modalContent: {
//     backgroundColor: theme.colors.surface,
//     padding: theme.spacing.lg,
//     margin: theme.spacing.lg,
//     borderRadius: theme.spacing.md,
//   },
//   modalTitle: {
//     marginBottom: theme.spacing.lg,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   input: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationContainer: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationLabel: {
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//     fontWeight: '500',
//   },
//   durationButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.md,
//   },
//   durationButton: {
//     minWidth: 60,
//   },
//   quickDurations: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.lg,
//   },
//   quickButton: {
//     minWidth: 60,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     gap: theme.spacing.sm,
//   },
//   modalButton: {
//     flex: 1,
//   },
//   offlineChip: {
//     alignSelf: 'flex-start',
//     marginTop: theme.spacing.sm,
//     backgroundColor: theme.colors.surfaceVariant,
//   },
// });

// import React, { useState, useEffect, useRef } from 'react';
// import { View, StyleSheet, FlatList, Switch, Alert, Platform } from 'react-native';
// import { Text, FAB, Card, Button, Chip, List, SegmentedButtons, Portal, Modal, TextInput, IconButton } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useNavigation } from '@react-navigation/native';
// import PushNotification from 'react-native-push-notification';
// import { theme } from '@/utils/theme';
// import { useAlarmStore } from '@/store/alarmStore';
// import { Alarm, Timer, CreateTimerData } from '@/types/alarm';

// // Define navigation types
// type RootStackParamList = {
//   AlarmCreate: undefined;
//   AlarmEdit: { alarmId: string };
// };

// type NavigationProp = {
//   navigate: (screen: keyof RootStackParamList, params?: any) => void;
//   goBack: () => void;
// };

// // Configure Push Notifications with null checks
// const configurePushNotifications = () => {
//   try {
//     if (PushNotification) {
//       PushNotification.configure({
//         onNotification: function (notification: any) {
//           console.log('NOTIFICATION:', notification);
//         },
//         popInitialNotification: true,
//         requestPermissions: Platform.OS === 'ios',
//       });

//       // Create notification channel for Android
//       PushNotification.createChannel(
//         {
//           channelId: "alarm-channel",
//           channelName: "Alarm notifications",
//           channelDescription: "Notifications for alarms and timers",
//           playSound: true,
//           soundName: "default",
//           importance: 4,
//           vibrate: true,
//         },
//         (created: any) => console.log(`createChannel returned '${created}'`)
//       );
//     } else {
//       console.warn('PushNotification is not available');
//     }
//   } catch (error) {
//     console.error('Error configuring push notifications:', error);
//   }
// };

// // Configure Push Notifications
// // PushNotification.configure({
// //   // Required: called when remote or local notification is opened
// //   onNotification: function (notification: any) {
// //     console.log('NOTIFICATION:', notification);
// //   },
// //   popInitialNotification: true,
// //   requestPermissions: Platform.OS === 'ios',
// // });

// // // Create notification channel for Android
// // PushNotification.createChannel(
// //   {
// //     channelId: "alarm-channel",
// //     channelName: "Alarm notifications",
// //     channelDescription: "Notifications for alarms and timers",
// //     playSound: true,
// //     soundName: "default",
// //     importance: 4,
// //     vibrate: true,
// //   },
// //   (created: any) => console.log(`createChannel returned '${created}'`)
// // );

// // class NotificationService {
// //   private notificationIds = new Set();

// //   scheduleTimerNotification(timer: Timer, seconds: number) {
// //     const notificationId = `timer_${timer.id}_${Date.now()}`;
// //     this.notificationIds.add(notificationId);

// //     const fireDate = new Date(Date.now() + seconds * 1000);

// //     PushNotification.localNotificationSchedule({
// //       channelId: "alarm-channel",
// //       id: notificationId,
// //       title: timer.title,
// //       message: timer.title,
// //       date: fireDate,
// //       allowWhileIdle: true,
// //       playSound: true,
// //       soundName: "default",
// //       vibrate: true,
// //       vibration: 1000,
// //     });

// //     return notificationId;
// //   }

// //   scheduleAlarmNotification(alarm: Alarm) {
// //     const notificationId = `alarm_${alarm.id}`;
// //     this.notificationIds.add(notificationId);

// //     const alarmTime = new Date(alarm.time);

// //     PushNotification.localNotificationSchedule({
// //       channelId: "alarm-channel",
// //       id: notificationId,
// //       title: alarm.title,
// //       message: alarm.title,
// //       date: alarmTime,
// //       allowWhileIdle: true,
// //       playSound: true,
// //       soundName: "default",
// //       vibrate: true,
// //       vibration: 1000,
// //       repeatType: alarm.recurrenceRule ? 'day' : undefined,
// //     });

// //     return notificationId;
// //   }

// //   cancelNotification(notificationId: string) {
// //     PushNotification.cancelLocalNotifications({ id: notificationId });
// //     this.notificationIds.delete(notificationId);
// //   }

// //   cancelAllNotifications() {
// //     PushNotification.cancelAllLocalNotifications();
// //     this.notificationIds.clear();
// //   }

// //   // Check if notification permissions are granted
// //   async checkPermissions() {
// //     return new Promise((resolve) => {
// //       PushNotification.checkPermissions((permissions: any) => {
// //         resolve(permissions);
// //       });
// //     });
// //   }

// //   // Request notification permissions
// //   async requestPermissions() {
// //     return new Promise((resolve) => {
// //       PushNotification.requestPermissions().then((permissions: any) => {
// //         resolve(permissions);
// //       });
// //     });
// //   }
// // }

// class NotificationService {
//   private notificationIds = new Set();
//   private isAvailable = false;

//   constructor() {
//     this.isAvailable = !!PushNotification;
//   }

//   scheduleTimerNotification(timer: Timer, seconds: number) {
//     if (!this.isAvailable) {
//       console.warn('PushNotification not available');
//       return null;
//     }

//     try {
//       const notificationId = `timer_${timer.id}_${Date.now()}`;
//       this.notificationIds.add(notificationId);

//       const fireDate = new Date(Date.now() + seconds * 1000);

//       PushNotification.localNotificationSchedule({
//         channelId: "alarm-channel",
//         id: notificationId,
//         title: timer.title,
//         message: timer.title,
//         date: fireDate,
//         allowWhileIdle: true,
//         playSound: true,
//         soundName: "default",
//         vibrate: true,
//         vibration: 1000,
//       });

//       return notificationId;
//     } catch (error) {
//       console.error('Error scheduling timer notification:', error);
//       return null;
//     }
//   }

//   scheduleAlarmNotification(alarm: Alarm) {
//     if (!this.isAvailable) {
//       console.warn('PushNotification not available');
//       return null;
//     }

//     try {
//       const notificationId = `alarm_${alarm.id}`;
//       this.notificationIds.add(notificationId);

//       const alarmTime = new Date(alarm.time);

//       PushNotification.localNotificationSchedule({
//         channelId: "alarm-channel",
//         id: notificationId,
//         title: alarm.title,
//         message: alarm.title,
//         date: alarmTime,
//         allowWhileIdle: true,
//         playSound: true,
//         soundName: "default",
//         vibrate: true,
//         vibration: 1000,
//         repeatType: alarm.recurrenceRule ? 'day' : undefined,
//       });

//       return notificationId;
//     } catch (error) {
//       console.error('Error scheduling alarm notification:', error);
//       return null;
//     }
//   }

//   cancelNotification(notificationId: string) {
//     if (!this.isAvailable) return;

//     try {
//       PushNotification.cancelLocalNotifications({ id: notificationId });
//       this.notificationIds.delete(notificationId);
//     } catch (error) {
//       console.error('Error canceling notification:', error);
//     }
//   }

//   cancelAllNotifications() {
//     if (!this.isAvailable) return;

//     try {
//       PushNotification.cancelAllLocalNotifications();
//       this.notificationIds.clear();
//     } catch (error) {
//       console.error('Error canceling all notifications:', error);
//     }
//   }

//   // Check if notification permissions are granted
//   async checkPermissions() {
//     if (!this.isAvailable) {
//       return { alert: false, notification: false };
//     }

//     return new Promise((resolve) => {
//       PushNotification.checkPermissions((permissions: any) => {
//         resolve(permissions);
//       });
//     });
//   }

//   // Request notification permissions
//   async requestPermissions() {
//     if (!this.isAvailable) {
//       return { alert: false, notification: false };
//     }

//     return new Promise((resolve) => {
//       PushNotification.requestPermissions().then((permissions: any) => {
//         resolve(permissions);
//       });
//     });
//   }

//   // Safe method to get initial notification
//   async getInitialNotification() {
//     if (!this.isAvailable) {
//       console.warn('PushNotification not available for getInitialNotification');
//       return null;
//     }

//     try {
//       // Use popInitialNotification instead of getInitialNotification
//       return new Promise((resolve) => {
//         PushNotification.popInitialNotification((notification: any) => {
//           resolve(notification);
//         });
//       });
//     } catch (error) {
//       console.error('Error getting initial notification:', error);
//       return null;
//     }
//   }
// }
// export const AlarmsScreen: React.FC = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation<NavigationProp>();
//   const [activeTab, setActiveTab] = useState('alarms');
//   const [showTimerModal, setShowTimerModal] = useState(false);
//   const [timerTitle, setTimerTitle] = useState('');
//   const [timerDuration, setTimerDuration] = useState(25);
//   const [localTimers, setLocalTimers] = useState<Timer[]>([]);
//   const [isRinging, setIsRinging] = useState(false);
//   const [ringingTimerId, setRingingTimerId] = useState<string | null>(null);
//   const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

//   const notificationService = useRef(new NotificationService()).current;
//   const countdownRef = useRef<NodeJS.Timeout | null>(null);

//   const {
//     alarms,
//     timers,
//     activeTimer,
//     loading,
//     error,
//     fetchAlarms,
//     fetchTimers,
//     createTimer,
//     updateTimer,
//     deleteTimer,
//     startTimer,
//     pauseTimer,
//     stopTimer,
//     resetTimer,
//     setActiveTimer,
//     updateTimerRemainingTime,
//     clearError,
//     toggleAlarm,
//     deleteAlarm,
//   } = useAlarmStore();

//   // Initialize and check permissions
//   // useEffect(() => {
//   //   const initialize = async () => {
//   //     try {
//   //       // Check and request notification permissions
//   //       const permissions: any = await notificationService.checkPermissions();
//   //       if (permissions.alert || permissions.notification) {
//   //         setHasNotificationPermission(true);
//   //       } else {
//   //         const newPermissions: any = await notificationService.requestPermissions();
//   //         setHasNotificationPermission(!!newPermissions.alert || !!newPermissions.notification);
//   //       }

//   //       // Fetch data
//   //       fetchAlarms();
//   //       fetchTimers();

//   //       // Schedule existing alarms
//   //       alarms.forEach(alarm => {
//   //         if (alarm.enabled) {
//   //           notificationService.scheduleAlarmNotification(alarm);
//   //         }
//   //       });
//   //     } catch (error) {
//   //       console.log('Initialization error:', error);
//   //     }
//   //   };

//   //   initialize();

//   //   // Cleanup on unmount
//   //   return () => {
//   //     if (countdownRef.current) {
//   //       clearInterval(countdownRef.current);
//   //     }
//   //   };
//   // }, []);

//   // Initialize and check permissions
//   useEffect(() => {
//     const initialize = async () => {
//       try {
//         // Configure push notifications first
//         configurePushNotifications();

//         // Check and request notification permissions
//         const permissions: any = await notificationService.checkPermissions();
//         if (permissions.alert || permissions.notification) {
//           setHasNotificationPermission(true);
//         } else {
//           const newPermissions: any = await notificationService.requestPermissions();
//           setHasNotificationPermission(!!newPermissions.alert || !!newPermissions.notification);
//         }

//         // Fetch data
//         fetchAlarms();
//         fetchTimers();

//         // Schedule existing alarms only if permissions are granted
//         if (hasNotificationPermission) {
//           alarms.forEach(alarm => {
//             if (alarm.enabled) {
//               notificationService.scheduleAlarmNotification(alarm);
//             }
//           });
//         }

//         // Check for any initial notification
//         const initialNotification = await notificationService.getInitialNotification();
//         if (initialNotification) {
//           console.log('Initial notification:', initialNotification);
//           // Handle initial notification if needed
//         }
//       } catch (error) {
//         console.log('Initialization error:', error);
//       }
//     };

//     initialize();

//     // Cleanup on unmount
//     return () => {
//       if (countdownRef.current) {
//         clearInterval(countdownRef.current);
//       }
//       // Optionally cancel all notifications on unmount
//       // notificationService.cancelAllNotifications();
//     };
//   }, []);
//   // Sync local timers with store timers
//   useEffect(() => {
//     setLocalTimers(timers.map(timer => ({ ...timer })));
//   }, [timers]);

//   // Sync alarms with notifications
//   useEffect(() => {
//     if (hasNotificationPermission) {
//       // Cancel all existing alarm notifications
//       alarms.forEach(alarm => {
//         notificationService.cancelNotification(`alarm_${alarm.id}`);
//       });

//       // Schedule enabled alarms
//       alarms.forEach(alarm => {
//         if (alarm.enabled) {
//           notificationService.scheduleAlarmNotification(alarm);
//         }
//       });
//     }
//   }, [alarms, hasNotificationPermission]);

//   // Timer countdown effect
//   useEffect(() => {
//     // Clear any existing interval
//     if (countdownRef.current) {
//       clearInterval(countdownRef.current);
//       countdownRef.current = null;
//     }

//     const runningTimer = localTimers.find(timer => timer.isRunning && timer.remainingTime > 0);

//     if (runningTimer) {
//       console.log('Starting countdown for timer:', runningTimer.title);

//       // Schedule notification for timer completion
//       if (hasNotificationPermission) {
//         notificationService.scheduleTimerNotification(runningTimer, runningTimer.remainingTime);
//       }

//       countdownRef.current = setInterval(() => {
//         setLocalTimers(prev => prev.map(timer => {
//           if (timer.id === runningTimer.id && timer.remainingTime > 0) {
//             const newTime = timer.remainingTime - 1;

//             // Update store every 10 seconds for persistence
//             if (newTime % 10 === 0) {
//               updateTimerRemainingTime(timer.id, newTime);
//             }

//             return {
//               ...timer,
//               remainingTime: newTime
//             };
//           }
//           return timer;
//         }));
//       }, 1000);
//     }

//     return () => {
//       if (countdownRef.current) {
//         clearInterval(countdownRef.current);
//       }
//     };
//   }, [localTimers, hasNotificationPermission]);

//   // Check for timer completion
//   useEffect(() => {
//     const completedTimer = localTimers.find(timer =>
//       timer.isRunning && timer.remainingTime <= 0 && !timer.isCompleted
//     );

//     if (completedTimer && !isRinging) {
//       console.log('Timer completion detected:', completedTimer.title);
//       handleTimerCompletion(completedTimer);
//     }
//   }, [localTimers, isRinging]);

//   // Listen for errors
//   useEffect(() => {
//     if (error) {
//       Alert.alert(t('common.error'), error);
//       clearError();
//     }
//   }, [error]);

//   const handleTimerCompletion = async (timer: Timer) => {
//     try {
//       console.log('Handling timer completion for:', timer.title);

//       // Stop the timer in store
//       await stopTimer(timer.id);
//       if (activeTimer?.id === timer.id) {
//         setActiveTimer(null);
//       }

//       // Clear countdown
//       if (countdownRef.current) {
//         clearInterval(countdownRef.current);
//         countdownRef.current = null;
//       }

//       // Update local state to mark as completed
//       setLocalTimers(prev => prev.map(t =>
//         t.id === timer.id
//           ? { ...t, isRunning: false, isCompleted: true, remainingTime: 0 }
//           : t
//       ));

//       // Set ringing state
//       setIsRinging(true);
//       setRingingTimerId(timer.id);

//       // Show completion alert
//       Alert.alert(
//         t('timers.completed'),
//         t('timers.timerCompletedMessage', { title: timer.title }),
//         [
//           {
//             text: t('timers.stopAlarm'),
//             onPress: () => {
//               handleStopAlarm(timer);
//             },
//           },
//         ],
//         {
//           cancelable: false
//         }
//       );

//     } catch (error) {
//       console.log('Error handling timer completion:', error);
//       Alert.alert(t('common.error'), t('timers.completionError'));
//     }
//   };

//   const handleStopAlarm = (timer: Timer) => {
//     console.log('Stopping alarm for timer:', timer.title);
//     setIsRinging(false);
//     setRingingTimerId(null);
//     resetTimer(timer.id);
//     setLocalTimers(prev => prev.map(t =>
//       t.id === timer.id
//         ? { ...t, isCompleted: false, remainingTime: timer.duration * 60 }
//         : t
//     ));
//   };

//   const handleCreateTimer = async () => {
//     if (!timerTitle.trim()) {
//       Alert.alert(t('common.error'), t('timers.titleRequired'));
//       return;
//     }

//     try {
//       const timerData: CreateTimerData = {
//         title: timerTitle.trim(),
//         duration: timerDuration,
//       };
//       await createTimer(timerData);
//       setShowTimerModal(false);
//       setTimerTitle('');
//       setTimerDuration(25);
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.createError'));
//     }
//   };

//   const handleStartTimer = async (timer: Timer) => {
//     try {
//       console.log('Starting timer:', timer.title);
//       await startTimer(timer.id);
//       setActiveTimer(timer);
//       // Update local state immediately
//       setLocalTimers(prev => prev.map(t =>
//         t.id === timer.id
//           ? { ...t, isRunning: true, isPaused: false, isCompleted: false }
//           : t
//       ));
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.startError'));
//     }
//   };

//   const handlePauseTimer = async (timer: Timer) => {
//     try {
//       console.log('Pausing timer:', timer.title);
//       await pauseTimer(timer.id);
//       setLocalTimers(prev => prev.map(t =>
//         t.id === timer.id
//           ? { ...t, isRunning: false, isPaused: true }
//           : t
//       ));
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.pauseError'));
//     }
//   };

//   const handleStopTimer = async (timer: Timer) => {
//     try {
//       console.log('Stopping timer:', timer.title);
//       await stopTimer(timer.id);
//       if (activeTimer?.id === timer.id) {
//         setActiveTimer(null);
//       }
//       setLocalTimers(prev => prev.map(t =>
//         t.id === timer.id
//           ? { ...t, isRunning: false, isPaused: false, remainingTime: timer.duration * 60 }
//           : t
//       ));
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.stopError'));
//     }
//   };

//   const handleResetTimer = async (timer: Timer) => {
//     try {
//       console.log('Resetting timer:', timer.title);
//       await resetTimer(timer.id);
//       setLocalTimers(prev => prev.map(t =>
//         t.id === timer.id
//           ? { ...t, isRunning: false, isPaused: false, isCompleted: false, remainingTime: timer.duration * 60 }
//           : t
//       ));
//     } catch (error) {
//       Alert.alert(t('common.error'), t('timers.resetError'));
//     }
//   };

//   const handleDeleteTimer = async (timer: Timer) => {
//     Alert.alert(
//       t('common.confirm'),
//       t('timers.deleteConfirm'),
//       [
//         { text: t('common.cancel'), style: 'cancel' },
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               // Stop alarm if this timer is ringing
//               if (isRinging && ringingTimerId === timer.id) {
//                 setIsRinging(false);
//                 setRingingTimerId(null);
//               }

//               await deleteTimer(timer.id);
//               if (activeTimer?.id === timer.id) {
//                 setActiveTimer(null);
//               }
//             } catch (error) {
//               Alert.alert(t('common.error'), t('timers.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleToggleAlarm = async (alarmId: string) => {
//     try {
//       const alarm = alarms.find(a => a.id === alarmId);
//       if (alarm) {
//         await toggleAlarm(alarmId);

//         // Update notification
//         if (alarm.enabled) {
//           // Alarm was enabled, now disabling - cancel notification
//           notificationService.cancelNotification(`alarm_${alarmId}`);
//         } else {
//           // Alarm was disabled, now enabling - schedule notification
//           notificationService.scheduleAlarmNotification({ ...alarm, enabled: true });
//         }
//       }
//     } catch (error) {
//       Alert.alert(t('common.error'), t('alarms.toggleError'));
//     }
//   };

//   const handleDeleteAlarm = async (alarmId: string) => {
//     Alert.alert(
//       t('common.confirm'),
//       t('alarms.deleteConfirm'),
//       [
//         { text: t('common.cancel'), style: 'cancel' },
//         {
//           text: t('common.delete'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               // Cancel notification first
//               notificationService.cancelNotification(`alarm_${alarmId}`);
//               await deleteAlarm(alarmId);
//             } catch (error) {
//               Alert.alert(t('common.error'), t('alarms.deleteError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   // Rest of the component (formatTime, getTimerStatusColor, etc.) remains the same...
//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getTimerStatusColor = (timer: Timer) => {
//     if (timer.isCompleted) return theme.colors.success;
//     if (timer.isRunning) return theme.colors.primary;
//     if (timer.isPaused) return theme.colors.warning;
//     return theme.colors.outline;
//   };

//   const getTimerStatusText = (timer: Timer) => {
//     if (timer.isCompleted) return t('timers.completed');
//     if (timer.isRunning) return t('timers.running');
//     if (timer.isPaused) return t('timers.paused');
//     return t('timers.stopped');
//   };

//   const isOfflineTimer = (timer: Timer) => {
//     return timer.id.startsWith('local_') || timer.userId === 'local';
//   };

//   const getAlarmDaysText = (alarm: Alarm) => {
//     if (!alarm.recurrenceRule) {
//       return t('alarms.once');
//     }

//     if (alarm.recurrenceRule.includes('FREQ=DAILY')) {
//       return t('alarms.everyday');
//     }

//     return t('alarms.custom');
//   };

//   const renderAlarm = ({ item }: { item: Alarm }) => (
//     <Card style={styles.alarmCard}>
//       <Card.Content>
//         <View style={styles.alarmHeader}>
//           <View style={styles.alarmInfo}>
//             <Text variant="titleMedium" style={styles.alarmTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineSmall" style={styles.alarmTime}>
//               {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//             </Text>
//             <View style={styles.alarmMeta}>
//               <Chip mode="outlined" compact style={styles.daysChip}>
//                 {getAlarmDaysText(item)}
//               </Chip>
//               {item.timezone && item.timezone !== 'UTC' && (
//                 <Text variant="bodySmall" style={styles.timezoneText}>
//                   {item.timezone}
//                 </Text>
//               )}
//             </View>
//           </View>
//           <Switch
//             value={item.enabled}
//             onValueChange={() => handleToggleAlarm(item.id)}
//             trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
//             thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
//           />
//         </View>

//         <View style={styles.alarmDetails}>
//           {item.toneUrl && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.sound')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.toneUrl}
//               </Text>
//             </View>
//           )}
//           {item.smartWakeWindow && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.smartWake')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.smartWakeWindow} {t('common.minutes')}
//               </Text>
//             </View>
//           )}
//           {item.snoozeConfig && (
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('alarms.snooze')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.snoozeConfig.duration} {t('common.minutes')}
//               </Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.alarmActions}>
//           <Button
//             mode="text"
//             onPress={() => navigation.navigate('AlarmEdit', { alarmId: item.id })}
//             style={styles.actionButton}>
//             {t('common.edit')}
//           </Button>
//           <Button
//             mode="text"
//             onPress={() => handleDeleteAlarm(item.id)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}>
//             {t('common.delete')}
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderTimer = ({ item }: { item: Timer }) => {
//     const isThisTimerRinging = isRinging && ringingTimerId === item.id;

//     return (
//       <Card style={[
//         styles.timerCard,
//         activeTimer?.id === item.id && styles.activeTimerCard,
//         isThisTimerRinging && styles.ringingTimerCard
//       ]}>
//         <Card.Content>
//           <View style={styles.timerHeader}>
//             <View style={styles.timerInfo}>
//               <Text variant="titleMedium" style={styles.timerTitle}>
//                 {item.title}
//               </Text>
//               <Text variant="headlineLarge" style={[styles.timerTime, { color: getTimerStatusColor(item) }]}>
//                 {formatTime(item.remainingTime)}
//               </Text>
//               <Text variant="bodySmall" style={[styles.timerStatus, { color: getTimerStatusColor(item) }]}>
//                 {getTimerStatusText(item)}
//               </Text>
//             </View>
//             {isThisTimerRinging && (
//               <IconButton
//                 icon="bell-ring"
//                 size={24}
//                 iconColor={theme.colors.error}
//                 style={styles.ringingIcon}
//               />
//             )}
//           </View>

//           <View style={styles.timerDetails}>
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 {t('timers.duration')}:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.duration} {t('common.minutes')}
//               </Text>
//             </View>
//             {!hasNotificationPermission && (
//               <Chip mode="outlined" compact style={styles.warningChip}>
//                 {t('timers.noNotifications')}
//               </Chip>
//             )}
//             {isOfflineTimer(item) && (
//               <Chip mode="outlined" compact style={styles.offlineChip}>
//                 {t('timers.offline')}
//               </Chip>
//             )}
//           </View>

//           <View style={styles.timerActions}>
//             {!item.isRunning && !item.isCompleted && (
//               <Button
//                 mode="contained"
//                 onPress={() => handleStartTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.start')}
//               </Button>
//             )}
//             {item.isRunning && !item.isPaused && (
//               <Button
//                 mode="outlined"
//                 onPress={() => handlePauseTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.pause')}
//               </Button>
//             )}
//             {item.isPaused && (
//               <Button
//                 mode="contained"
//                 onPress={() => handleStartTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.resume')}
//               </Button>
//             )}
//             {(item.isRunning || item.isPaused) && (
//               <Button
//                 mode="outlined"
//                 onPress={() => handleStopTimer(item)}
//                 style={styles.actionButton}
//                 disabled={isRinging}>
//                 {t('timers.stop')}
//               </Button>
//             )}
//             {item.isCompleted && !isThisTimerRinging && (
//               <Button
//                 mode="outlined"
//                 onPress={() => handleResetTimer(item)}
//                 style={styles.actionButton}>
//                 {t('timers.reset')}
//               </Button>
//             )}
//             {isThisTimerRinging && (
//               <Button
//                 mode="contained"
//                 onPress={() => handleStopAlarm(item)}
//                 style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
//                 icon="bell-off">
//                 {t('timers.stopAlarm')}
//               </Button>
//             )}
//             <Button
//               mode="text"
//               onPress={() => handleDeleteTimer(item)}
//               textColor={theme.colors.error}
//               style={styles.actionButton}
//               disabled={isThisTimerRinging}>
//               {t('common.delete')}
//             </Button>
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Text variant="headlineSmall" style={styles.emptyTitle}>
//         {activeTab === 'alarms' ? t('alarms.noAlarms') : t('timers.noTimers')}
//       </Text>
//       <Text variant="bodyMedium" style={styles.emptyMessage}>
//         {activeTab === 'alarms' ? t('alarms.createFirstAlarm') : t('timers.createFirstTimer')}
//       </Text>
//       {!hasNotificationPermission && (
//         <Text variant="bodySmall" style={styles.warningText}>
//           {t('timers.notificationPermissionRequired')}
//         </Text>
//       )}
//       <Button
//         mode="contained"
//         onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//         style={styles.createButton}>
//         {activeTab === 'alarms' ? t('alarms.createAlarm') : t('timers.createTimer')}
//       </Button>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <SegmentedButtons
//         value={activeTab}
//         onValueChange={setActiveTab}
//         buttons={[
//           { value: 'alarms', label: t('alarms.title') },
//           { value: 'timers', label: t('timers.title') },
//         ]}
//         style={styles.segmentedButtons}
//       />

//       {activeTab === 'alarms' ? (
//         <FlatList<Alarm>
//           data={alarms}
//           renderItem={renderAlarm}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchAlarms}
//         />
//       ) : (
//         <FlatList<Timer>
//           data={localTimers}
//           renderItem={renderTimer}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchTimers}
//         />
//       )}

//       {!isRinging && (
//         <FAB
//           icon="plus"
//           style={styles.fab}
//           onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//           label={activeTab === 'alarms' ? t('alarms.addAlarm') : t('timers.addTimer')}
//         />
//       )}

//       <Portal>
//         <Modal
//           visible={showTimerModal}
//           onDismiss={() => setShowTimerModal(false)}
//           contentContainerStyle={styles.modalContent}>
//           <Text variant="headlineSmall" style={styles.modalTitle}>
//             {t('timers.createTimer')}
//           </Text>

//           <TextInput
//             label={t('timers.title')}
//             value={timerTitle}
//             onChangeText={setTimerTitle}
//             style={styles.input}
//             mode="outlined"
//             maxLength={50}
//           />

//           <View style={styles.durationContainer}>
//             <Text variant="bodyLarge" style={styles.durationLabel}>
//               {t('timers.duration')}: {timerDuration} {t('common.minutes')}
//             </Text>
//             <View style={styles.durationButtons}>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))}
//                 style={styles.durationButton}>
//                 -5
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))}
//                 style={styles.durationButton}>
//                 -1
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))}
//                 style={styles.durationButton}>
//                 +1
//               </Button>
//               <Button
//                 mode="outlined"
//                 onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))}
//                 style={styles.durationButton}>
//                 +5
//               </Button>
//             </View>
//           </View>

//           <View style={styles.quickDurations}>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(5)}
//               style={styles.quickButton}>
//               5 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(15)}
//               style={styles.quickButton}>
//               15 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(30)}
//               style={styles.quickButton}>
//               30 min
//             </Button>
//             <Button
//               mode="text"
//               onPress={() => setTimerDuration(60)}
//               style={styles.quickButton}>
//               60 min
//             </Button>
//           </View>

//           {!hasNotificationPermission && (
//             <Text variant="bodySmall" style={styles.warningText}>
//               {t('timers.enableNotificationsForAlarms')}
//             </Text>
//           )}

//           <View style={styles.modalActions}>
//             <Button
//               mode="outlined"
//               onPress={() => setShowTimerModal(false)}
//               style={styles.modalButton}>
//               {t('common.cancel')}
//             </Button>
//             <Button
//               mode="contained"
//               onPress={handleCreateTimer}
//               style={styles.modalButton}
//               disabled={!timerTitle.trim()}>
//               {t('common.create')}
//             </Button>
//           </View>
//         </Modal>
//       </Portal>
//     </View>
//   );
// };

// // Add to your translation files:
// const translationKeys = {
//   "alarms": {
//     "alarmTitle": "Alarm",
//     "wakeUp": "Time to wake up!"
//   },
//   "timers": {
//     "noNotifications": "No Notifications",
//     "notificationPermissionRequired": "Notification permission required for alarms",
//     "enableNotificationsForAlarms": "Enable notifications for proper alarm functionality"
//   }
// };




// // Keep the same styles as before...
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   segmentedButtons: {
//     margin: theme.spacing.sm,
//   },
//   listContent: {
//     padding: theme.spacing.sm,
//     flexGrow: 1,
//   },
//   alarmCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   timerCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   activeTimerCard: {
//     borderWidth: 2,
//     borderColor: theme.colors.primary,
//     elevation: 8,
//   },
//   ringingTimerCard: {
//     borderWidth: 3,
//     borderColor: theme.colors.error,
//     backgroundColor: `${theme.colors.error}10`,
//     elevation: 12,
//   },
//   alarmHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: theme.spacing.md,
//   },
//   timerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.md,
//   },
//   alarmInfo: {
//     flex: 1,
//   },
//   timerInfo: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   alarmTitle: {
//     marginBottom: theme.spacing.xs,
//     fontWeight: '600',
//   },
//   timerTitle: {
//     marginBottom: theme.spacing.sm,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   alarmTime: {
//     color: theme.colors.primary,
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 28,
//   },
//   timerTime: {
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 32,
//   },
//   alarmMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: theme.spacing.sm,
//   },
//   daysChip: {
//     height: 24,
//   },
//   timezoneText: {
//     color: theme.colors.textSecondary,
//     fontSize: 12,
//   },
//   timerStatus: {
//     fontWeight: '500',
//   },
//   alarmDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   timerDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xs,
//   },
//   detailLabel: {
//     color: theme.colors.textSecondary,
//   },
//   detailValue: {
//     color: theme.colors.text,
//   },
//   alarmActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   timerActions: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     flexWrap: 'wrap',
//     gap: theme.spacing.sm,
//   },
//   actionButton: {
//     minWidth: 80,
//   },
//   ringingIcon: {
//     margin: 0,
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: theme.spacing.xl,
//   },
//   emptyTitle: {
//     marginBottom: theme.spacing.sm,
//     color: theme.colors.textSecondary,
//     textAlign: 'center',
//   },
//   emptyMessage: {
//     textAlign: 'center',
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.lg,
//     lineHeight: 20,
//   },
//   createButton: {
//     marginTop: theme.spacing.sm,
//   },
//   fab: {
//     position: 'absolute',
//     margin: theme.spacing.md,
//     right: 0,
//     bottom: 0,
//     borderRadius: 28,
//   },


//   warningChip: {
//     alignSelf: 'flex-start',
//     marginTop: theme.spacing.sm,
//     backgroundColor: theme.colors.warning + '20',
//     borderColor: theme.colors.warning,
//   },

//   modalContent: {
//     backgroundColor: theme.colors.surface,
//     padding: theme.spacing.lg,
//     margin: theme.spacing.lg,
//     borderRadius: theme.spacing.md,
//   },
//   modalTitle: {
//     marginBottom: theme.spacing.lg,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   input: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationContainer: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationLabel: {
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//     fontWeight: '500',
//   },
//   durationButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.md,
//   },
//   durationButton: {
//     minWidth: 60,
//   },
//   quickDurations: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.lg,
//   },
//   quickButton: {
//     minWidth: 60,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     gap: theme.spacing.sm,
//   },
//   modalButton: {
//     flex: 1,
//   },
//   offlineChip: {
//     alignSelf: 'flex-start',
//     marginTop: theme.spacing.sm,
//     backgroundColor: theme.colors.surfaceVariant,
//   },

//   warningText: {
//     color: theme.colors.warning,
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//     fontStyle: 'italic',

//     alignSelf: 'flex-start',
//     marginTop: theme.spacing.sm,
//     backgroundColor: theme.colors.warning + '20',
//     borderColor: theme.colors.warning,
//   },
// });















// import React, { useState, useEffect, useRef } from 'react';
// import { View, StyleSheet, FlatList, Switch, Alert, Platform, AppState } from 'react-native';
// import { Text, FAB, Card, Button, Chip, SegmentedButtons, Portal, Modal, TextInput, IconButton } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useNavigation } from '@react-navigation/native';
// import { theme } from '@/utils/theme';
// import { useAlarmStore } from '@/store/alarmStore';
// import { Alarm, Timer, CreateTimerData } from '@/types/alarm';

// // Try to import PushNotification with error handling
// let PushNotification: any = null;
// try {
//   PushNotification = require('react-native-push-notification').default;
// } catch (error) {
//   console.warn('react-native-push-notification not available:', error);
// }

// // Navigation types
// type RootStackParamList = {
//   AlarmCreate: undefined;
//   AlarmEdit: { alarmId: string };
// };

// type NavigationProp = {
//   navigate: (screen: keyof RootStackParamList, params?: any) => void;
//   goBack: () => void;
// };

// // Notification Service with null safety
// class NotificationService {
//   private notificationIdCounter = 0;
//   private scheduledNotifications = new Map<string, number>();
//   private isAvailable = false;

//   constructor() {
//     this.isAvailable = PushNotification !== null;
//     if (this.isAvailable) {
//       this.configure();
//     } else {
//       console.warn('⚠️ Push notifications are not available. Please install react-native-push-notification');
//     }
//   }

//   configure() {
//     if (!this.isAvailable || !PushNotification) return;

//     try {
//       PushNotification.configure({
//         onNotification: (notification: any) => {
//           console.log('Notification received:', notification);

//           if (notification.userInteraction) {
//             console.log('User tapped notification');
//           }

//           if (Platform.OS === 'ios' && notification.finish) {
//             notification.finish('UIBackgroundFetchResultNewData');
//           }
//         },
//         permissions: {
//           alert: true,
//           badge: true,
//           sound: true,
//         },
//         popInitialNotification: true,
//         requestPermissions: Platform.OS === 'ios',
//       });

//       // Create Android notification channel
//       if (Platform.OS === 'android') {
//         PushNotification.createChannel(
//           {
//             channelId: 'alarm-channel',
//             channelName: 'Alarms & Timers',
//             channelDescription: 'Notifications for alarms and timers',
//             playSound: true,
//             soundName: 'default',
//             importance: 4,
//             vibrate: true,
//           },
//           (created: boolean) => console.log(`Channel created: ${created}`)
//         );
//       }
//     } catch (error) {
//       console.error('Error configuring push notifications:', error);
//       this.isAvailable = false;
//     }
//   }

//   async requestPermissions(): Promise<boolean> {
//     if (!this.isAvailable || !PushNotification) {
//       console.warn('Push notifications not available');
//       return false;
//     }

//     try {
//       if (Platform.OS === 'ios') {
//         return new Promise((resolve) => {
//           PushNotification.requestPermissions((permissions: any) => {
//             resolve(permissions.alert === 1);
//           });
//         });
//       }
//       return true;
//     } catch (error) {
//       console.error('Error requesting permissions:', error);
//       return false;
//     }
//   }

//   scheduleTimerNotification(timerId: string, title: string, durationSeconds: number): number | null {
//     if (!this.isAvailable || !PushNotification) {
//       console.warn('Cannot schedule notification - service not available');
//       return null;
//     }

//     try {
//       const notificationId = ++this.notificationIdCounter;
//       const fireDate = new Date(Date.now() + durationSeconds * 1000);

//       console.log(`Scheduling timer notification for ${title} at ${fireDate}`);

//       PushNotification.localNotificationSchedule({
//         channelId: 'alarm-channel',
//         id: notificationId.toString(),
//         title: '⏰ Timer Complete!',
//         message: title,
//         date: fireDate,
//         playSound: true,
//         soundName: 'default',
//         importance: 'high',
//         vibrate: true,
//         vibration: 300,
//         allowWhileIdle: true,
//         invokeApp: true,
//         userInfo: {
//           type: 'timer',
//           timerId: timerId,
//         },
//       });

//       this.scheduledNotifications.set(timerId, notificationId);
//       return notificationId;
//     } catch (error) {
//       console.error('Error scheduling timer notification:', error);
//       return null;
//     }
//   }

//   scheduleAlarmNotification(alarmId: string, title: string, alarmDate: Date, repeat: boolean = false): number | null {
//     if (!this.isAvailable || !PushNotification) {
//       console.warn('Cannot schedule notification - service not available');
//       return null;
//     }

//     try {
//       const notificationId = ++this.notificationIdCounter;

//       console.log(`Scheduling alarm notification for ${title} at ${alarmDate}`);

//       PushNotification.localNotificationSchedule({
//         channelId: 'alarm-channel',
//         id: notificationId.toString(),
//         title: '⏰ Alarm!',
//         message: title,
//         date: alarmDate,
//         playSound: true,
//         soundName: 'default',
//         importance: 'high',
//         vibrate: true,
//         vibration: 300,
//         allowWhileIdle: true,
//         invokeApp: true,
//         repeatType: repeat ? 'day' : undefined,
//         userInfo: {
//           type: 'alarm',
//           alarmId: alarmId,
//         },
//       });

//       this.scheduledNotifications.set(alarmId, notificationId);
//       return notificationId;
//     } catch (error) {
//       console.error('Error scheduling alarm notification:', error);
//       return null;
//     }
//   }

//   cancelNotification(id: string) {
//     if (!this.isAvailable || !PushNotification) return;

//     try {
//       const notificationId = this.scheduledNotifications.get(id);
//       if (notificationId) {
//         PushNotification.cancelLocalNotification(notificationId.toString());
//         this.scheduledNotifications.delete(id);
//         console.log(`Cancelled notification for ${id}`);
//       }
//     } catch (error) {
//       console.error('Error canceling notification:', error);
//     }
//   }

//   cancelAllNotifications() {
//     if (!this.isAvailable || !PushNotification) return;

//     try {
//       PushNotification.cancelAllLocalNotifications();
//       this.scheduledNotifications.clear();
//       console.log('Cancelled all notifications');
//     } catch (error) {
//       console.error('Error canceling all notifications:', error);
//     }
//   }

//   playImmediateNotification(title: string, message: string) {
//     if (!this.isAvailable || !PushNotification) {
//       console.warn('Cannot play notification - service not available');
//       return;
//     }

//     try {
//       PushNotification.localNotification({
//         channelId: 'alarm-channel',
//         title: title,
//         message: message,
//         playSound: true,
//         soundName: 'default',
//         vibrate: true,
//         vibration: 300,
//         importance: 'high',
//       });
//     } catch (error) {
//       console.error('Error playing immediate notification:', error);
//     }
//   }

//   isServiceAvailable(): boolean {
//     return this.isAvailable;
//   }
// }

// export const AlarmsScreen: React.FC = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation<NavigationProp>();
//   const [activeTab, setActiveTab] = useState('timers');
//   const [showTimerModal, setShowTimerModal] = useState(false);
//   const [timerTitle, setTimerTitle] = useState('');
//   const [timerDuration, setTimerDuration] = useState(25);
//   const [hasPermission, setHasPermission] = useState(false);
//   const [notificationServiceAvailable, setNotificationServiceAvailable] = useState(false);

//   const notificationService = useRef(new NotificationService()).current;
//   const appState = useRef(AppState.currentState);
//   const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

//   const {
//     alarms,
//     timers,
//     activeTimer,
//     loading,
//     error,
//     fetchAlarms,
//     fetchTimers,
//     createTimer,
//     deleteTimer,
//     startTimer,
//     pauseTimer,
//     stopTimer,
//     resetTimer,
//     setActiveTimer,
//     updateTimerRemainingTime,
//     clearError,
//     toggleAlarm,
//     deleteAlarm,
//   } = useAlarmStore();

//   // Initialize
//   useEffect(() => {
//     const init = async () => {
//       const serviceAvailable = notificationService.isServiceAvailable();
//       setNotificationServiceAvailable(serviceAvailable);

//       if (serviceAvailable) {
//         const granted = await notificationService.requestPermissions();
//         setHasPermission(granted);

//         if (!granted) {
//           Alert.alert(
//             'Permissions Required',
//             'Please enable notifications to receive alarm and timer alerts.',
//             [{ text: 'OK' }]
//           );
//         }
//       } else {
//         Alert.alert(
//           'Setup Required',
//           'Push notifications are not configured. Alarms and timers will work, but you won\'t receive sound notifications.\n\nPlease install react-native-push-notification.',
//           [{ text: 'OK' }]
//         );
//       }

//       fetchAlarms();
//       fetchTimers();
//     };

//     init();

//     // Handle app state changes
//     const subscription = AppState.addEventListener('change', nextAppState => {
//       if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
//         fetchTimers();
//         fetchAlarms();
//       }
//       appState.current = nextAppState;
//     });

//     return () => {
//       subscription.remove();
//       if (timerIntervalRef.current) {
//         clearInterval(timerIntervalRef.current);
//       }
//     };
//   }, []);

//   // Client-side timer countdown (as fallback)
//   useEffect(() => {
//     if (timerIntervalRef.current) {
//       clearInterval(timerIntervalRef.current);
//       timerIntervalRef.current = null;
//     }

//     const runningTimer = timers.find(t => t.isRunning && !t.isPaused);

//     if (runningTimer && runningTimer.remainingTime > 0) {
//       console.log('Starting local countdown for:', runningTimer.title);

//       timerIntervalRef.current = setInterval(() => {
//         const updatedTime = runningTimer.remainingTime - 1;

//         if (updatedTime <= 0) {
//           // Timer completed
//           console.log('Timer completed locally:', runningTimer.title);
//           if (timerIntervalRef.current) {
//             clearInterval(timerIntervalRef.current);
//             timerIntervalRef.current = null;
//           }

//           // Play notification if available
//           if (notificationServiceAvailable) {
//             notificationService.playImmediateNotification(
//               '⏰ Timer Complete!',
//               runningTimer.title
//             );
//           }

//           // Show alert
//           Alert.alert(
//             'Timer Complete!',
//             runningTimer.title,
//             [
//               {
//                 text: 'OK',
//                 onPress: () => {
//                   stopTimer(runningTimer.id);
//                   setActiveTimer(null);
//                 }
//               }
//             ]
//           );
//         } else {
//           updateTimerRemainingTime(runningTimer.id, updatedTime);
//         }
//       }, 1000);
//     }

//     return () => {
//       if (timerIntervalRef.current) {
//         clearInterval(timerIntervalRef.current);
//       }
//     };
//   }, [timers, notificationServiceAvailable]);

//   // Handle errors
//   useEffect(() => {
//     if (error) {
//       Alert.alert('Error', error);
//       clearError();
//     }
//   }, [error]);

//   // Monitor running timer and schedule notifications
//   useEffect(() => {
//     if (activeTimer?.isRunning && hasPermission && notificationServiceAvailable) {
//       notificationService.cancelNotification(activeTimer.id);
//       notificationService.scheduleTimerNotification(
//         activeTimer.id,
//         activeTimer.title,
//         activeTimer.remainingTime
//       );
//     }
//   }, [activeTimer?.isRunning, hasPermission, notificationServiceAvailable]);

//   // Sync alarm notifications
//   useEffect(() => {
//     if (!hasPermission || !notificationServiceAvailable) return;

//     alarms.forEach(alarm => {
//       notificationService.cancelNotification(alarm.id);
//     });

//     alarms.forEach(alarm => {
//       if (alarm.enabled) {
//         const alarmDate = new Date(alarm.time);
//         const hasRecurrence = !!alarm.recurrenceRule;
//         notificationService.scheduleAlarmNotification(
//           alarm.id,
//           alarm.title,
//           alarmDate,
//           hasRecurrence
//         );
//       }
//     });
//   }, [alarms, hasPermission, notificationServiceAvailable]);

//   const handleCreateTimer = async () => {
//     if (!timerTitle.trim()) {
//       Alert.alert('Error', 'Please enter a timer title');
//       return;
//     }

//     try {
//       const timerData: CreateTimerData = {
//         title: timerTitle.trim(),
//         duration: timerDuration,
//       };
//       await createTimer(timerData);
//       setShowTimerModal(false);
//       setTimerTitle('');
//       setTimerDuration(25);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to create timer');
//     }
//   };

//   const handleStartTimer = async (timer: Timer) => {
//     try {
//       await startTimer(timer.id);
//       setActiveTimer(timer);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to start timer');
//     }
//   };

//   const handlePauseTimer = async (timer: Timer) => {
//     try {
//       if (notificationServiceAvailable) {
//         notificationService.cancelNotification(timer.id);
//       }
//       await pauseTimer(timer.id);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to pause timer');
//     }
//   };

//   const handleStopTimer = async (timer: Timer) => {
//     try {
//       if (notificationServiceAvailable) {
//         notificationService.cancelNotification(timer.id);
//       }
//       await stopTimer(timer.id);
//       if (activeTimer?.id === timer.id) {
//         setActiveTimer(null);
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to stop timer');
//     }
//   };

//   const handleResetTimer = async (timer: Timer) => {
//     try {
//       if (notificationServiceAvailable) {
//         notificationService.cancelNotification(timer.id);
//       }
//       await resetTimer(timer.id);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to reset timer');
//     }
//   };

//   const handleDeleteTimer = async (timer: Timer) => {
//     Alert.alert(
//       'Confirm Delete',
//       'Are you sure you want to delete this timer?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               if (notificationServiceAvailable) {
//                 notificationService.cancelNotification(timer.id);
//               }
//               await deleteTimer(timer.id);
//               if (activeTimer?.id === timer.id) {
//                 setActiveTimer(null);
//               }
//             } catch (error) {
//               Alert.alert('Error', 'Failed to delete timer');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleToggleAlarm = async (alarmId: string) => {
//     try {
//       await toggleAlarm(alarmId);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to toggle alarm');
//     }
//   };

//   const handleDeleteAlarm = async (alarmId: string) => {
//     Alert.alert(
//       'Confirm Delete',
//       'Are you sure you want to delete this alarm?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               if (notificationServiceAvailable) {
//                 notificationService.cancelNotification(alarmId);
//               }
//               await deleteAlarm(alarmId);
//             } catch (error) {
//               Alert.alert('Error', 'Failed to delete alarm');
//             }
//           },
//         },
//       ]
//     );
//   };

//   // Helper functions
//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getTimerStatusColor = (timer: Timer) => {
//     if (timer.isCompleted) return theme.colors.success;
//     if (timer.isRunning) return theme.colors.primary;
//     if (timer.isPaused) return theme.colors.warning;
//     return theme.colors.outline;
//   };

//   const getTimerStatusText = (timer: Timer) => {
//     if (timer.isCompleted) return 'Completed';
//     if (timer.isRunning) return 'Running';
//     if (timer.isPaused) return 'Paused';
//     return 'Stopped';
//   };

//   const getAlarmDaysText = (alarm: Alarm) => {
//     if (!alarm.recurrenceRule) return 'Once';
//     if (alarm.recurrenceRule.includes('FREQ=DAILY')) return 'Every day';
//     return 'Custom';
//   };

//   // Render functions
//   const renderTimer = ({ item }: { item: Timer }) => (
//     <Card style={[
//       styles.timerCard,
//       activeTimer?.id === item.id && styles.activeTimerCard
//     ]}>
//       <Card.Content>
//         <View style={styles.timerHeader}>
//           <View style={styles.timerInfo}>
//             <Text variant="titleMedium" style={styles.timerTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineLarge" style={[styles.timerTime, { color: getTimerStatusColor(item) }]}>
//               {formatTime(item.remainingTime)}
//             </Text>
//             <Text variant="bodySmall" style={[styles.timerStatus, { color: getTimerStatusColor(item) }]}>
//               {getTimerStatusText(item)}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.timerDetails}>
//           <View style={styles.detailRow}>
//             <Text variant="bodySmall" style={styles.detailLabel}>
//               Duration:
//             </Text>
//             <Text variant="bodySmall" style={styles.detailValue}>
//               {item.duration} minutes
//             </Text>
//           </View>
//           {!notificationServiceAvailable && (
//             <Chip mode="outlined" compact
//             //  style={styles.warningChip}
//              >
//               No notifications
//             </Chip>
//           )}
//         </View>

//         <View style={styles.timerActions}>
//           {!item.isRunning && !item.isCompleted && (
//             <Button mode="contained" onPress={() => handleStartTimer(item)} style={styles.actionButton}>
//               Start
//             </Button>
//           )}
//           {item.isRunning && !item.isPaused && (
//             <Button mode="outlined" onPress={() => handlePauseTimer(item)} style={styles.actionButton}>
//               Pause
//             </Button>
//           )}
//           {item.isPaused && (
//             <Button mode="contained" onPress={() => handleStartTimer(item)} style={styles.actionButton}>
//               Resume
//             </Button>
//           )}
//           {(item.isRunning || item.isPaused) && (
//             <Button mode="outlined" onPress={() => handleStopTimer(item)} style={styles.actionButton}>
//               Stop
//             </Button>
//           )}
//           {item.isCompleted && (
//             <Button mode="outlined" onPress={() => handleResetTimer(item)} style={styles.actionButton}>
//               Reset
//             </Button>
//           )}
//           <Button
//             mode="text"
//             onPress={() => handleDeleteTimer(item)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}>
//             Delete
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderAlarm = ({ item }: { item: Alarm }) => (
//     <Card style={styles.alarmCard}>
//       <Card.Content>
//         <View style={styles.alarmHeader}>
//           <View style={styles.alarmInfo}>
//             <Text variant="titleMedium" style={styles.alarmTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineSmall" style={styles.alarmTime}>
//               {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//             </Text>
//             <Chip mode="outlined" compact style={styles.daysChip}>
//               {getAlarmDaysText(item)}
//             </Chip>
//           </View>
//           <Switch
//             value={item.enabled}
//             onValueChange={() => handleToggleAlarm(item.id)}
//             trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
//             thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
//           />
//         </View>

//         <View style={styles.alarmActions}>
//           <Button
//             mode="text"
//             onPress={() => navigation.navigate('AlarmEdit', { alarmId: item.id })}
//             style={styles.actionButton}>
//             Edit
//           </Button>
//           <Button
//             mode="text"
//             onPress={() => handleDeleteAlarm(item.id)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}>
//             Delete
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Text variant="headlineSmall" style={styles.emptyTitle}>
//         {activeTab === 'alarms' ? 'No alarms yet' : 'No timers yet'}
//       </Text>
//       <Text variant="bodyMedium" style={styles.emptyMessage}>
//         {activeTab === 'alarms' ? 'Create your first alarm to get started' : 'Create your first timer to get started'}
//       </Text>
//       {!notificationServiceAvailable && (
//         <Text variant="bodySmall" style={styles.warningText}>
//           ⚠️ Push notifications not configured
//         </Text>
//       )}
//       <Button
//         mode="contained"
//         onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//         style={styles.createButton}>
//         {activeTab === 'alarms' ? 'Create Alarm' : 'Create Timer'}
//       </Button>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <SegmentedButtons
//         value={activeTab}
//         onValueChange={setActiveTab}
//         buttons={[
//           { value: 'alarms', label: 'Alarms' },
//           { value: 'timers', label: 'Timers' },
//         ]}
//         style={styles.segmentedButtons}
//       />

//       {activeTab === 'alarms' ? (
//         <FlatList<Alarm>
//           data={alarms}
//           renderItem={renderAlarm}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchAlarms}
//         />
//       ) : (
//         <FlatList<Timer>
//           data={timers}
//           renderItem={renderTimer}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchTimers}
//         />
//       )}

//       <FAB
//         icon="plus"
//         style={styles.fab}
//         onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//         label={activeTab === 'alarms' ? 'Add Alarm' : 'Add Timer'}
//       />

//       <Portal>
//         <Modal
//           visible={showTimerModal}
//           onDismiss={() => setShowTimerModal(false)}
//           contentContainerStyle={styles.modalContent}>
//           <Text variant="headlineSmall" style={styles.modalTitle}>
//             Create Timer
//           </Text>

//           <TextInput
//             label="Title"
//             value={timerTitle}
//             onChangeText={setTimerTitle}
//             style={styles.input}
//             mode="outlined"
//             maxLength={50}
//           />

//           <View style={styles.durationContainer}>
//             <Text variant="bodyLarge" style={styles.durationLabel}>
//               Duration: {timerDuration} minutes
//             </Text>
//             <View style={styles.durationButtons}>
//               <Button mode="outlined" onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))} style={styles.durationButton}>
//                 -5
//               </Button>
//               <Button mode="outlined" onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))} style={styles.durationButton}>
//                 -1
//               </Button>
//               <Button mode="outlined" onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))} style={styles.durationButton}>
//                 +1
//               </Button>
//               <Button mode="outlined" onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))} style={styles.durationButton}>
//                 +5
//               </Button>
//             </View>
//           </View>

//           <View style={styles.quickDurations}>
//             {[5, 15, 30, 60].map(mins => (
//               <Button key={mins} mode="text" onPress={() => setTimerDuration(mins)} style={styles.quickButton}>
//                 {mins} min
//               </Button>
//             ))}
//           </View>

//           <View style={styles.modalActions}>
//             <Button mode="outlined" onPress={() => setShowTimerModal(false)} style={styles.modalButton}>
//               Cancel
//             </Button>
//             <Button mode="contained" onPress={handleCreateTimer} style={styles.modalButton} disabled={!timerTitle.trim()}>
//               Create
//             </Button>
//           </View>
//         </Modal>
//       </Portal>
//     </View>
//   );
// };



// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   segmentedButtons: {
//     margin: theme.spacing.sm,
//   },
//   listContent: {
//     padding: theme.spacing.sm,
//     flexGrow: 1,
//   },
//   timerCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   activeTimerCard: {
//     borderWidth: 2,
//     borderColor: theme.colors.primary,
//     elevation: 8,
//   },
//   alarmCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   timerHeader: {
//     marginBottom: theme.spacing.md,
//   },
//   timerInfo: {
//     alignItems: 'center',
//   },
//   timerTitle: {
//     marginBottom: theme.spacing.sm,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   timerTime: {
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 32,
//   },
//   timerStatus: {
//     fontWeight: '500',
//   },
//   timerDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xs,
//   },
//   detailLabel: {
//     color: theme.colors.textSecondary,
//   },
//   detailValue: {
//     color: theme.colors.text,
//   },
//   timerActions: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     flexWrap: 'wrap',
//     gap: theme.spacing.sm,
//   },
//   actionButton: {
//     minWidth: 80,
//   },
//   alarmHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: theme.spacing.md,
//   },
//   alarmInfo: {
//     flex: 1,
//   },
//   alarmTitle: {
//     marginBottom: theme.spacing.xs,
//     fontWeight: '600',
//   },
//   alarmTime: {
//     color: theme.colors.primary,
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 28,
//   },
//   daysChip: {
//     alignSelf: 'flex-start',
//     height: 24,
//   },
//   alarmActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: theme.spacing.xl,
//   },
//   emptyTitle: {
//     marginBottom: theme.spacing.sm,
//     color: theme.colors.textSecondary,
//     textAlign: 'center',
//   },
//   emptyMessage: {
//     textAlign: 'center',
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.lg,
//     lineHeight: 20,
//   },
//   warningText: {
//     color: theme.colors.warning,
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//     fontStyle: 'italic',
//   },
//   createButton: {
//     marginTop: theme.spacing.sm,
//   },
//   fab: {
//     position: 'absolute',
//     margin: theme.spacing.md,
//     right: 0,
//     bottom: 0,
//     borderRadius: 28,
//   },
//   modalContent: {
//     backgroundColor: theme.colors.surface,
//     padding: theme.spacing.lg,
//     margin: theme.spacing.lg,
//     borderRadius: theme.spacing.md,
//   },
//   modalTitle: {
//     marginBottom: theme.spacing.lg,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   input: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationContainer: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationLabel: {
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//     fontWeight: '500',
//   },
//   durationButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.md,
//   },
//   durationButton: {
//     minWidth: 60,
//   },
//   quickDurations: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.lg,
//   },
//   quickButton: {
//     minWidth: 60,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     gap: theme.spacing.sm,
//   },
//   modalButton: {
//     flex: 1,
//   },
// });


import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Switch, 
  Alert, 
  Platform, 
  AppState, 
  Vibration
} from 'react-native';
import { Text, FAB, Card, Button, Chip, SegmentedButtons, Portal, Modal, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { theme } from '@/utils/theme';
import { useAlarmStore } from '@/store/alarmStore';
import { Alarm, Timer, CreateTimerData } from '@/types/alarm';

// Navigation types
type RootStackParamList = {
  AlarmCreate: undefined;
  AlarmEdit: { alarmId: string };
};

type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
};

// Simple Sound Manager using React Native APIs
class SoundManager {
  private vibrationInterval: NodeJS.Timeout | null = null;
  private isPlaying = false;

  playAlarmSound() {
    try {
      console.log('🔊 Playing alarm sound with vibration');
      
      // Stop any existing alarm first
      this.stopSound();
      
      // Start vibration
      this.startVibration();
      
      this.isPlaying = true;
      
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Fallback: just show alert without vibration
      Alert.alert(
        'Alarm Error',
        'Could not play vibration. Please check app permissions.',
        [{ text: 'OK' }]
      );
    }
  }

  startVibration() {
    try {
      // More noticeable vibration pattern
      if (Platform.OS === 'android') {
        // Android: Use pattern vibration
        Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
      } else {
        // iOS: Use interval-based vibration
        this.vibrationInterval = setInterval(() => {
          Vibration.vibrate(1000);
        }, 2000);
      }
      console.log('Vibration started');
    } catch (error) {
      console.error('Vibration error:', error);
      throw error; // Re-throw to handle in calling function
    }
  }

  stopSound() {
    try {
      console.log('🔇 Stopping alarm sound');
      
      // Stop vibration
      Vibration.cancel();
      
      // Clear vibration interval
      if (this.vibrationInterval) {
        clearInterval(this.vibrationInterval);
        this.vibrationInterval = null;
      }
      
      this.isPlaying = false;
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const AlarmsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState('timers');
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerTitle, setTimerTitle] = useState('');
  const [timerDuration, setTimerDuration] = useState(25);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const [completedTimerId, setCompletedTimerId] = useState<string | null>(null);

  const soundManager = useRef(new SoundManager()).current;
  const appState = useRef(AppState.currentState);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    alarms,
    timers,
    activeTimer,
    loading,
    error,
    fetchAlarms,
    fetchTimers,
    createTimer,
    deleteTimer,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setActiveTimer,
    updateTimerRemainingTime,
    clearError,
    toggleAlarm,
    deleteAlarm,
  } = useAlarmStore();

  // Initialize
  useEffect(() => {
    fetchAlarms();
    fetchTimers();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchTimers();
        fetchAlarms();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      soundManager.stopSound();
    };
  }, []);

  // Client-side timer countdown
  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Find running timer
    const runningTimer = timers.find(t => t.isRunning && !t.isPaused && t.remainingTime > 0);

    if (runningTimer) {
      console.log('Starting countdown for:', runningTimer.title, 'Remaining:', runningTimer.remainingTime);
      
      timerIntervalRef.current = setInterval(() => {
        // Get fresh timer data
        const currentTimer = timers.find(t => t.id === runningTimer.id);
        
        if (!currentTimer || !currentTimer.isRunning || currentTimer.isPaused) {
          // Timer was stopped or paused
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return;
        }

        const updatedTime = currentTimer.remainingTime - 1;
        
        if (updatedTime <= 0) {
          // Timer completed!
          console.log('⏰ Timer completed!', currentTimer.title);
          
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          handleTimerCompletion(currentTimer);
        } else {
          // Update remaining time
          updateTimerRemainingTime(currentTimer.id, updatedTime);
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timers]);

  // Handle timer completion
  const handleTimerCompletion = async (timer: Timer) => {
    try {
      console.log('🎯 Handling timer completion:', timer.title);
      
      // Play sound and vibration
      soundManager.playAlarmSound();
      setAlarmPlaying(true);
      setCompletedTimerId(timer.id);

      // Stop the timer in store
      await stopTimer(timer.id);
      if (activeTimer?.id === timer.id) {
        setActiveTimer(null);
      }

      // Show alert with option to stop alarm
      Alert.alert(
        '⏰ Timer Complete!',
        `${timer.title}\n\n🔊 Sound and vibration are playing`,
        [
          {
            text: 'Stop Alarm',
            onPress: () => {
              soundManager.stopSound();
              setAlarmPlaying(false);
              setCompletedTimerId(null);
            },
          },
        ],
        { 
          cancelable: false,
          onDismiss: () => {
            // Auto-stop when alert is dismissed
            soundManager.stopSound();
            setAlarmPlaying(false);
            setCompletedTimerId(null);
          }
        }
      );
    } catch (error) {
      console.error('Error handling timer completion:', error);
      // Fallback: show alert without vibration
      Alert.alert(
        '⏰ Timer Complete!',
        `${timer.title}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAlarmPlaying(false);
              setCompletedTimerId(null);
            },
          },
        ]
      );
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  const handleCreateTimer = async () => {
    if (!timerTitle.trim()) {
      Alert.alert('Error', 'Please enter a timer title');
      return;
    }

    try {
      const timerData: CreateTimerData = {
        title: timerTitle.trim(),
        duration: timerDuration,
      };
      await createTimer(timerData);
      setShowTimerModal(false);
      setTimerTitle('');
      setTimerDuration(25);
    } catch (error) {
      Alert.alert('Error', 'Failed to create timer');
    }
  };

  const handleStartTimer = async (timer: Timer) => {
    try {
      await startTimer(timer.id);
      setActiveTimer(timer);
    } catch (error) {
      Alert.alert('Error', 'Failed to start timer');
    }
  };

  const handlePauseTimer = async (timer: Timer) => {
    try {
      await pauseTimer(timer.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to pause timer');
    }
  };

  const handleStopTimer = async (timer: Timer) => {
    try {
      await stopTimer(timer.id);
      if (activeTimer?.id === timer.id) {
        setActiveTimer(null);
      }
      
      // Stop alarm if this timer is ringing
      if (alarmPlaying && completedTimerId === timer.id) {
        soundManager.stopSound();
        setAlarmPlaying(false);
        setCompletedTimerId(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop timer');
    }
  };

  const handleResetTimer = async (timer: Timer) => {
    try {
      await resetTimer(timer.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to reset timer');
    }
  };

  const handleDeleteTimer = async (timer: Timer) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTimer(timer.id);
              if (activeTimer?.id === timer.id) {
                setActiveTimer(null);
              }
              
              // Stop alarm if this timer is ringing
              if (alarmPlaying && completedTimerId === timer.id) {
                soundManager.stopSound();
                setAlarmPlaying(false);
                setCompletedTimerId(null);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete timer');
            }
          },
        },
      ]
    );
  };

  const handleToggleAlarm = async (alarmId: string) => {
    try {
      await toggleAlarm(alarmId);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle alarm');
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlarm(alarmId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete alarm');
            }
          },
        },
      ]
    );
  };

  // Helper functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerStatusColor = (timer: Timer) => {
    if (timer.isCompleted) return theme.colors.success;
    if (timer.isRunning) return theme.colors.primary;
    if (timer.isPaused) return theme.colors.warning;
    return theme.colors.outline;
  };

  const getTimerStatusText = (timer: Timer) => {
    if (timer.isCompleted) return 'Completed';
    if (timer.isRunning) return 'Running';
    if (timer.isPaused) return 'Paused';
    return 'Stopped';
  };

  const getAlarmDaysText = (alarm: Alarm) => {
    if (!alarm.recurrenceRule) return 'Once';
    if (alarm.recurrenceRule.includes('FREQ=DAILY')) return 'Every day';
    return 'Custom';
  };

  // Render functions
  const renderTimer = ({ item }: { item: Timer }) => {
    const isRinging = alarmPlaying && completedTimerId === item.id;

    return (
      <Card style={[
        styles.timerCard,
        activeTimer?.id === item.id && styles.activeTimerCard,
        isRinging && styles.ringingTimerCard,
      ]}>
        <Card.Content>
          <View style={styles.timerHeader}>
            <View style={styles.timerInfo}>
              <Text variant="titleMedium" style={styles.timerTitle}>
                {item.title}
              </Text>
              <Text variant="headlineLarge" style={[styles.timerTime, { color: getTimerStatusColor(item) }]}>
                {formatTime(item.remainingTime)}
              </Text>
              <Text variant="bodySmall" style={[styles.timerStatus, { color: getTimerStatusColor(item) }]}>
                {getTimerStatusText(item)}
              </Text>
              {isRinging && (
                <Chip mode="flat" style={styles.ringingChip} textStyle={styles.ringingText}>
                  🔊 RINGING
                </Chip>
              )}
            </View>
          </View>

          <View style={styles.timerDetails}>
            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Duration:
              </Text>
              <Text variant="bodySmall" style={styles.detailValue}>
                {item.duration} minutes
              </Text>
            </View>
          </View>

          <View style={styles.timerActions}>
            {isRinging && (
              <Button 
                mode="contained" 
                onPress={() => {
                  soundManager.stopSound();
                  setAlarmPlaying(false);
                  setCompletedTimerId(null);
                }} 
                style={[styles.actionButton, styles.stopAlarmButton]}
                icon="bell-off"
                buttonColor={theme.colors.error}>
                Stop Alarm
              </Button>
            )}
            {!isRinging && !item.isRunning && !item.isCompleted && (
              <Button mode="contained" onPress={() => handleStartTimer(item)} style={styles.actionButton} icon="play">
                Start
              </Button>
            )}
            {!isRinging && item.isRunning && !item.isPaused && (
              <Button mode="outlined" onPress={() => handlePauseTimer(item)} style={styles.actionButton} icon="pause">
                Pause
              </Button>
            )}
            {!isRinging && item.isPaused && (
              <Button mode="contained" onPress={() => handleStartTimer(item)} style={styles.actionButton} icon="play">
                Resume
              </Button>
            )}
            {!isRinging && (item.isRunning || item.isPaused) && (
              <Button mode="outlined" onPress={() => handleStopTimer(item)} style={styles.actionButton} icon="stop">
                Stop
              </Button>
            )}
            {!isRinging && item.isCompleted && (
              <Button mode="outlined" onPress={() => handleResetTimer(item)} style={styles.actionButton} icon="refresh">
                Reset
              </Button>
            )}
            {!isRinging && (
              <Button
                mode="text"
                onPress={() => handleDeleteTimer(item)}
                textColor={theme.colors.error}
                style={styles.actionButton}
                icon="delete">
                Delete
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <Card style={styles.alarmCard}>
      <Card.Content>
        <View style={styles.alarmHeader}>
          <View style={styles.alarmInfo}>
            <Text variant="titleMedium" style={styles.alarmTitle}>
              {item.title}
            </Text>
            <Text variant="headlineSmall" style={styles.alarmTime}>
              {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Chip mode="outlined" compact style={styles.daysChip}>
              {getAlarmDaysText(item)}
            </Chip>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => handleToggleAlarm(item.id)}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
            thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
          />
        </View>

        <View style={styles.alarmActions}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('AlarmEdit', { alarmId: item.id })}
            style={styles.actionButton}
            icon="pencil">
            Edit
          </Button>
          <Button
            mode="text"
            onPress={() => handleDeleteAlarm(item.id)}
            textColor={theme.colors.error}
            style={styles.actionButton}
            icon="delete">
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {activeTab === 'alarms' ? '⏰ No alarms yet' : '⏱️ No timers yet'}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        {activeTab === 'alarms' 
          ? 'Create your first alarm to get started' 
          : 'Create your first timer and stay productive!'}
      </Text>
      <Button
        mode="contained"
        onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
        style={styles.createButton}
        icon="plus">
        {activeTab === 'alarms' ? 'Create Alarm' : 'Create Timer'}
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'alarms', label: 'Alarms', icon: 'alarm' },
          { value: 'timers', label: 'Timers', icon: 'timer' },
        ]}
        style={styles.segmentedButtons}
      />

      {activeTab === 'alarms' ? (
        <FlatList<Alarm>
          data={alarms}
          renderItem={renderAlarm}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchAlarms}
        />
      ) : (
        <FlatList<Timer>
          data={timers}
          renderItem={renderTimer}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchTimers}
        />
      )}

      {!alarmPlaying && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
          label={activeTab === 'alarms' ? 'Add Alarm' : 'Add Timer'}
        />
      )}

      <Portal>
        <Modal
          visible={showTimerModal}
          onDismiss={() => setShowTimerModal(false)}
          contentContainerStyle={styles.modalContent}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            ⏱️ Create Timer
          </Text>

          <TextInput
            label="Timer Title"
            value={timerTitle}
            onChangeText={setTimerTitle}
            style={styles.input}
            mode="outlined"
            maxLength={50}
            placeholder="e.g., Focus Session"
          />

          <View style={styles.durationContainer}>
            <Text variant="bodyLarge" style={styles.durationLabel}>
              Duration: {timerDuration} minutes
            </Text>
            <View style={styles.durationButtons}>
              <Button mode="outlined" onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))} style={styles.durationButton}>
                -5
              </Button>
              <Button mode="outlined" onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))} style={styles.durationButton}>
                -1
              </Button>
              <Button mode="outlined" onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))} style={styles.durationButton}>
                +1
              </Button>
              <Button mode="outlined" onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))} style={styles.durationButton}>
                +5
              </Button>
            </View>
          </View>

          <View style={styles.quickDurations}>
            <Text variant="bodySmall" style={styles.quickLabel}>Quick select:</Text>
            {[5, 15, 25, 30, 45, 60].map(mins => (
              <Button 
                key={mins} 
                mode={timerDuration === mins ? 'contained' : 'outlined'}
                onPress={() => setTimerDuration(mins)} 
                style={styles.quickButton}
                compact>
                {mins}m
              </Button>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowTimerModal(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateTimer} style={styles.modalButton} disabled={!timerTitle.trim()}>
              Create
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  segmentedButtons: {
    margin: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.sm,
    flexGrow: 1,
  },
  timerCard: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    elevation: 2,
  },
  activeTimerCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    elevation: 8,
  },
  ringingTimerCard: {
    borderWidth: 3,
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '15',
    elevation: 12,
  },
  alarmCard: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    elevation: 2,
  },
  timerHeader: {
    marginBottom: theme.spacing.md,
  },
  timerInfo: {
    alignItems: 'center',
  },
  timerTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  timerTime: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontSize: 48,
    letterSpacing: 2,
  },
  timerStatus: {
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  ringingChip: {
    backgroundColor: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  ringingText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  timerDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    color: theme.colors.textSecondary,
  },
  detailValue: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  timerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    minWidth: 90,
  },
  stopAlarmButton: {
    minWidth: 150,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTitle: {
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  alarmTime: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontSize: 28,
  },
  daysChip: {
    alignSelf: 'flex-start',
    height: 24,
  },
  alarmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  createButton: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: theme.spacing.lg,
  },
  durationContainer: {
    marginBottom: theme.spacing.md,
  },
  durationLabel: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontWeight: '600',
    fontSize: 18,
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  durationButton: {
    minWidth: 60,
  },
  quickDurations: {
    marginBottom: theme.spacing.lg,
  },
  quickLabel: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  quickButton: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});




// import React, { useState, useEffect, useRef } from 'react';
// import { View, StyleSheet, FlatList, Switch, Alert, Platform, AppState, Vibration, Linking } from 'react-native';
// import { Text, FAB, Card, Button, Chip, SegmentedButtons, Portal, Modal, TextInput } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useNavigation } from '@react-navigation/native';
// import Sound from 'react-native-sound';
// import { theme } from '@/utils/theme';
// import { useAlarmStore } from '@/store/alarmStore';
// import { Alarm, Timer, CreateTimerData } from '@/types/alarm';

// // Navigation types
// type RootStackParamList = {
//   AlarmCreate: undefined;
//   AlarmEdit: { alarmId: string };
// };

// type NavigationProp = {
//   navigate: (screen: keyof RootStackParamList, params?: any) => void;
//   goBack: () => void;
// };

// // Configure sound
// Sound.setCategory('Playback');

// // Sound Manager Class
// class SoundManager {
//   private sound: Sound | null = null;
//   private isPlaying = false;
//   private vibrationInterval: NodeJS.Timeout | null = null;

//   async playAlarmSound() {
//     try {
//       // Stop any existing sound
//       this.stopSound();

//       // Create a simple beep using system sound
//       // For Android, you can use a bundled sound file
//       // For iOS, you can use system sounds
      
//       this.sound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
//         if (error) {
//           console.log('Failed to load sound, using fallback', error);
//           // Fallback: just use vibration
//           this.playVibrationOnly();
//           return;
//         }

//         // Play the sound on loop
//         this.sound?.setNumberOfLoops(-1); // Loop forever
//         this.sound?.setVolume(1.0);
//         this.sound?.play((success) => {
//           if (!success) {
//             console.log('Playback failed');
//             this.playVibrationOnly();
//           }
//         });
//       });

//       this.isPlaying = true;

//       // Start continuous vibration pattern
//       this.startVibration();

//     } catch (error) {
//       console.error('Error playing sound:', error);
//       this.playVibrationOnly();
//     }
//   }

//   playVibrationOnly() {
//     this.startVibration();
//     this.isPlaying = true;
//   }

//   startVibration() {
//     // Vibrate pattern: [delay, vibrate, delay, vibrate]
//     // Vibrate for 1000ms, pause 500ms, repeat
//     Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
//   }

//   stopSound() {
//     try {
//       if (this.sound) {
//         this.sound.stop(() => {
//           this.sound?.release();
//           this.sound = null;
//         });
//       }

//       // Stop vibration
//       Vibration.cancel();
      
//       if (this.vibrationInterval) {
//         clearInterval(this.vibrationInterval);
//         this.vibrationInterval = null;
//       }

//       this.isPlaying = false;
//     } catch (error) {
//       console.error('Error stopping sound:', error);
//     }
//   }

//   isCurrentlyPlaying(): boolean {
//     return this.isPlaying;
//   }
// }

// export const AlarmsScreen: React.FC = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation<NavigationProp>();
//   const [activeTab, setActiveTab] = useState('timers');
//   const [showTimerModal, setShowTimerModal] = useState(false);
//   const [timerTitle, setTimerTitle] = useState('');
//   const [timerDuration, setTimerDuration] = useState(25);
//   const [alarmPlaying, setAlarmPlaying] = useState(false);
//   const [completedTimerId, setCompletedTimerId] = useState<string | null>(null);

//   const soundManager = useRef(new SoundManager()).current;
//   const appState = useRef(AppState.currentState);
//   const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

//   const {
//     alarms,
//     timers,
//     activeTimer,
//     loading,
//     error,
//     fetchAlarms,
//     fetchTimers,
//     createTimer,
//     deleteTimer,
//     startTimer,
//     pauseTimer,
//     stopTimer,
//     resetTimer,
//     setActiveTimer,
//     updateTimerRemainingTime,
//     clearError,
//     toggleAlarm,
//     deleteAlarm,
//   } = useAlarmStore();

//   // Initialize
//   useEffect(() => {
//     fetchAlarms();
//     fetchTimers();

//     // Handle app state changes
//     const subscription = AppState.addEventListener('change', nextAppState => {
//       if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
//         // App came to foreground - refresh data
//         fetchTimers();
//         fetchAlarms();
//       }
//       appState.current = nextAppState;
//     });

//     return () => {
//       subscription.remove();
//       if (timerIntervalRef.current) {
//         clearInterval(timerIntervalRef.current);
//       }
//       soundManager.stopSound();
//     };
//   }, []);

//   // Client-side timer countdown
//   useEffect(() => {
//     // Clear any existing interval
//     if (timerIntervalRef.current) {
//       clearInterval(timerIntervalRef.current);
//       timerIntervalRef.current = null;
//     }

//     // Find running timer
//     const runningTimer = timers.find(t => t.isRunning && !t.isPaused && t.remainingTime > 0);

//     if (runningTimer) {
//       console.log('Starting countdown for:', runningTimer.title, 'Remaining:', runningTimer.remainingTime);
      
//       timerIntervalRef.current = setInterval(() => {
//         // Get fresh timer data
//         const currentTimer = timers.find(t => t.id === runningTimer.id);
        
//         if (!currentTimer || !currentTimer.isRunning || currentTimer.isPaused) {
//           // Timer was stopped or paused
//           if (timerIntervalRef.current) {
//             clearInterval(timerIntervalRef.current);
//             timerIntervalRef.current = null;
//           }
//           return;
//         }

//         const updatedTime = currentTimer.remainingTime - 1;
        
//         if (updatedTime <= 0) {
//           // Timer completed!
//           console.log('⏰ Timer completed!', currentTimer.title);
          
//           if (timerIntervalRef.current) {
//             clearInterval(timerIntervalRef.current);
//             timerIntervalRef.current = null;
//           }
          
//           handleTimerCompletion(currentTimer);
//         } else {
//           // Update remaining time
//           updateTimerRemainingTime(currentTimer.id, updatedTime);
//         }
//       }, 1000);
//     }

//     return () => {
//       if (timerIntervalRef.current) {
//         clearInterval(timerIntervalRef.current);
//       }
//     };
//   }, [timers]);

//   // Handle timer completion
//   const handleTimerCompletion = async (timer: Timer) => {
//     try {
//       // Play sound and vibration
//       soundManager.playAlarmSound();
//       setAlarmPlaying(true);
//       setCompletedTimerId(timer.id);

//       // Stop the timer in store
//       await stopTimer(timer.id);
//       if (activeTimer?.id === timer.id) {
//         setActiveTimer(null);
//       }

//       // Show alert with option to stop alarm
//       Alert.alert(
//         '⏰ Timer Complete!',
//         timer.title,
//         [
//           {
//             text: 'Stop Alarm',
//             onPress: () => {
//               soundManager.stopSound();
//               setAlarmPlaying(false);
//               setCompletedTimerId(null);
//             },
//           },
//         ],
//         { 
//           cancelable: false,
//         }
//       );
//     } catch (error) {
//       console.error('Error handling timer completion:', error);
//     }
//   };

//   // Handle errors
//   useEffect(() => {
//     if (error) {
//       Alert.alert('Error', error);
//       clearError();
//     }
//   }, [error]);

//   const handleCreateTimer = async () => {
//     if (!timerTitle.trim()) {
//       Alert.alert('Error', 'Please enter a timer title');
//       return;
//     }

//     try {
//       const timerData: CreateTimerData = {
//         title: timerTitle.trim(),
//         duration: timerDuration,
//       };
//       await createTimer(timerData);
//       setShowTimerModal(false);
//       setTimerTitle('');
//       setTimerDuration(25);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to create timer');
//     }
//   };

//   const handleStartTimer = async (timer: Timer) => {
//     try {
//       await startTimer(timer.id);
//       setActiveTimer(timer);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to start timer');
//     }
//   };

//   const handlePauseTimer = async (timer: Timer) => {
//     try {
//       await pauseTimer(timer.id);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to pause timer');
//     }
//   };

//   const handleStopTimer = async (timer: Timer) => {
//     try {
//       await stopTimer(timer.id);
//       if (activeTimer?.id === timer.id) {
//         setActiveTimer(null);
//       }
      
//       // Stop alarm if this timer is ringing
//       if (alarmPlaying && completedTimerId === timer.id) {
//         soundManager.stopSound();
//         setAlarmPlaying(false);
//         setCompletedTimerId(null);
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to stop timer');
//     }
//   };

//   const handleResetTimer = async (timer: Timer) => {
//     try {
//       await resetTimer(timer.id);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to reset timer');
//     }
//   };

//   const handleDeleteTimer = async (timer: Timer) => {
//     Alert.alert(
//       'Confirm Delete',
//       'Are you sure you want to delete this timer?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteTimer(timer.id);
//               if (activeTimer?.id === timer.id) {
//                 setActiveTimer(null);
//               }
              
//               // Stop alarm if this timer is ringing
//               if (alarmPlaying && completedTimerId === timer.id) {
//                 soundManager.stopSound();
//                 setAlarmPlaying(false);
//                 setCompletedTimerId(null);
//               }
//             } catch (error) {
//               Alert.alert('Error', 'Failed to delete timer');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleToggleAlarm = async (alarmId: string) => {
//     try {
//       await toggleAlarm(alarmId);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to toggle alarm');
//     }
//   };

//   const handleDeleteAlarm = async (alarmId: string) => {
//     Alert.alert(
//       'Confirm Delete',
//       'Are you sure you want to delete this alarm?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteAlarm(alarmId);
//             } catch (error) {
//               Alert.alert('Error', 'Failed to delete alarm');
//             }
//           },
//         },
//       ]
//     );
//   };

//   // Helper functions
//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getTimerStatusColor = (timer: Timer) => {
//     if (timer.isCompleted) return theme.colors.success;
//     if (timer.isRunning) return theme.colors.primary;
//     if (timer.isPaused) return theme.colors.warning;
//     return theme.colors.outline;
//   };

//   const getTimerStatusText = (timer: Timer) => {
//     if (timer.isCompleted) return 'Completed';
//     if (timer.isRunning) return 'Running';
//     if (timer.isPaused) return 'Paused';
//     return 'Stopped';
//   };

//   const getAlarmDaysText = (alarm: Alarm) => {
//     if (!alarm.recurrenceRule) return 'Once';
//     if (alarm.recurrenceRule.includes('FREQ=DAILY')) return 'Every day';
//     return 'Custom';
//   };

//   // Render functions
//   const renderTimer = ({ item }: { item: Timer }) => {
//     const isRinging = alarmPlaying && completedTimerId === item.id;

//     return (
//       <Card style={[
//         styles.timerCard,
//         activeTimer?.id === item.id && styles.activeTimerCard,
//         isRinging && styles.ringingTimerCard,
//       ]}>
//         <Card.Content>
//           <View style={styles.timerHeader}>
//             <View style={styles.timerInfo}>
//               <Text variant="titleMedium" style={styles.timerTitle}>
//                 {item.title}
//               </Text>
//               <Text variant="headlineLarge" style={[styles.timerTime, { color: getTimerStatusColor(item) }]}>
//                 {formatTime(item.remainingTime)}
//               </Text>
//               <Text variant="bodySmall" style={[styles.timerStatus, { color: getTimerStatusColor(item) }]}>
//                 {getTimerStatusText(item)}
//               </Text>
//               {isRinging && (
//                 <Chip mode="flat" style={styles.ringingChip} textStyle={styles.ringingText}>
//                   🔔 RINGING
//                 </Chip>
//               )}
//             </View>
//           </View>

//           <View style={styles.timerDetails}>
//             <View style={styles.detailRow}>
//               <Text variant="bodySmall" style={styles.detailLabel}>
//                 Duration:
//               </Text>
//               <Text variant="bodySmall" style={styles.detailValue}>
//                 {item.duration} minutes
//               </Text>
//             </View>
//           </View>

//           <View style={styles.timerActions}>
//             {isRinging && (
//               <Button 
//                 mode="contained" 
//                 onPress={() => {
//                   soundManager.stopSound();
//                   setAlarmPlaying(false);
//                   setCompletedTimerId(null);
//                 }} 
//                 style={[styles.actionButton, styles.stopAlarmButton]}
//                 icon="bell-off"
//                 buttonColor={theme.colors.error}>
//                 Stop Alarm
//               </Button>
//             )}
//             {!isRinging && !item.isRunning && !item.isCompleted && (
//               <Button mode="contained" onPress={() => handleStartTimer(item)} style={styles.actionButton} icon="play">
//                 Start
//               </Button>
//             )}
//             {!isRinging && item.isRunning && !item.isPaused && (
//               <Button mode="outlined" onPress={() => handlePauseTimer(item)} style={styles.actionButton} icon="pause">
//                 Pause
//               </Button>
//             )}
//             {!isRinging && item.isPaused && (
//               <Button mode="contained" onPress={() => handleStartTimer(item)} style={styles.actionButton} icon="play">
//                 Resume
//               </Button>
//             )}
//             {!isRinging && (item.isRunning || item.isPaused) && (
//               <Button mode="outlined" onPress={() => handleStopTimer(item)} style={styles.actionButton} icon="stop">
//                 Stop
//               </Button>
//             )}
//             {!isRinging && item.isCompleted && (
//               <Button mode="outlined" onPress={() => handleResetTimer(item)} style={styles.actionButton} icon="refresh">
//                 Reset
//               </Button>
//             )}
//             {!isRinging && (
//               <Button
//                 mode="text"
//                 onPress={() => handleDeleteTimer(item)}
//                 textColor={theme.colors.error}
//                 style={styles.actionButton}
//                 icon="delete">
//                 Delete
//               </Button>
//             )}
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderAlarm = ({ item }: { item: Alarm }) => (
//     <Card style={styles.alarmCard}>
//       <Card.Content>
//         <View style={styles.alarmHeader}>
//           <View style={styles.alarmInfo}>
//             <Text variant="titleMedium" style={styles.alarmTitle}>
//               {item.title}
//             </Text>
//             <Text variant="headlineSmall" style={styles.alarmTime}>
//               {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//             </Text>
//             <Chip mode="outlined" compact style={styles.daysChip}>
//               {getAlarmDaysText(item)}
//             </Chip>
//           </View>
//           <Switch
//             value={item.enabled}
//             onValueChange={() => handleToggleAlarm(item.id)}
//             trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
//             thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
//           />
//         </View>

//         <View style={styles.alarmActions}>
//           <Button
//             mode="text"
//             onPress={() => navigation.navigate('AlarmEdit', { alarmId: item.id })}
//             style={styles.actionButton}
//             icon="pencil">
//             Edit
//           </Button>
//           <Button
//             mode="text"
//             onPress={() => handleDeleteAlarm(item.id)}
//             textColor={theme.colors.error}
//             style={styles.actionButton}
//             icon="delete">
//             Delete
//           </Button>
//         </View>
//       </Card.Content>
//     </Card>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Text variant="headlineSmall" style={styles.emptyTitle}>
//         {activeTab === 'alarms' ? '⏰ No alarms yet' : '⏱️ No timers yet'}
//       </Text>
//       <Text variant="bodyMedium" style={styles.emptyMessage}>
//         {activeTab === 'alarms' 
//           ? 'Create your first alarm to get started' 
//           : 'Create your first timer and stay productive!'}
//       </Text>
//       <Button
//         mode="contained"
//         onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//         style={styles.createButton}
//         icon="plus">
//         {activeTab === 'alarms' ? 'Create Alarm' : 'Create Timer'}
//       </Button>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <SegmentedButtons
//         value={activeTab}
//         onValueChange={setActiveTab}
//         buttons={[
//           { value: 'alarms', label: 'Alarms', icon: 'alarm' },
//           { value: 'timers', label: 'Timers', icon: 'timer' },
//         ]}
//         style={styles.segmentedButtons}
//       />

//       {activeTab === 'alarms' ? (
//         <FlatList<Alarm>
//           data={alarms}
//           renderItem={renderAlarm}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchAlarms}
//         />
//       ) : (
//         <FlatList<Timer>
//           data={timers}
//           renderItem={renderTimer}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmptyState}
//           showsVerticalScrollIndicator={false}
//           refreshing={loading}
//           onRefresh={fetchTimers}
//         />
//       )}

//       {!alarmPlaying && (
//         <FAB
//           icon="plus"
//           style={styles.fab}
//           onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : navigation.navigate('AlarmCreate')}
//           label={activeTab === 'alarms' ? 'Add Alarm' : 'Add Timer'}
//         />
//       )}

//       <Portal>
//         <Modal
//           visible={showTimerModal}
//           onDismiss={() => setShowTimerModal(false)}
//           contentContainerStyle={styles.modalContent}>
//           <Text variant="headlineSmall" style={styles.modalTitle}>
//             ⏱️ Create Timer
//           </Text>

//           <TextInput
//             label="Timer Title"
//             value={timerTitle}
//             onChangeText={setTimerTitle}
//             style={styles.input}
//             mode="outlined"
//             maxLength={50}
//             placeholder="e.g., Focus Session"
//           />

//           <View style={styles.durationContainer}>
//             <Text variant="bodyLarge" style={styles.durationLabel}>
//               Duration: {timerDuration} minutes
//             </Text>
//             <View style={styles.durationButtons}>
//               <Button mode="outlined" onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))} style={styles.durationButton}>
//                 -5
//               </Button>
//               <Button mode="outlined" onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))} style={styles.durationButton}>
//                 -1
//               </Button>
//               <Button mode="outlined" onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))} style={styles.durationButton}>
//                 +1
//               </Button>
//               <Button mode="outlined" onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))} style={styles.durationButton}>
//                 +5
//               </Button>
//             </View>
//           </View>

//           <View style={styles.quickDurations}>
//             <Text variant="bodySmall" style={styles.quickLabel}>Quick select:</Text>
//             {[5, 15, 25, 30, 45, 60].map(mins => (
//               <Button 
//                 key={mins} 
//                 mode={timerDuration === mins ? 'contained' : 'outlined'}
//                 onPress={() => setTimerDuration(mins)} 
//                 style={styles.quickButton}
//                 compact>
//                 {mins}m
//               </Button>
//             ))}
//           </View>

//           <View style={styles.modalActions}>
//             <Button mode="outlined" onPress={() => setShowTimerModal(false)} style={styles.modalButton}>
//               Cancel
//             </Button>
//             <Button mode="contained" onPress={handleCreateTimer} style={styles.modalButton} disabled={!timerTitle.trim()}>
//               Create
//             </Button>
//           </View>
//         </Modal>
//       </Portal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   segmentedButtons: {
//     margin: theme.spacing.sm,
//   },
//   listContent: {
//     padding: theme.spacing.sm,
//     flexGrow: 1,
//   },
//   timerCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   activeTimerCard: {
//     borderWidth: 2,
//     borderColor: theme.colors.primary,
//     elevation: 8,
//   },
//   ringingTimerCard: {
//     borderWidth: 3,
//     borderColor: theme.colors.error,
//     backgroundColor: theme.colors.error + '15',
//     elevation: 12,
//   },
//   alarmCard: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//     elevation: 2,
//   },
//   timerHeader: {
//     marginBottom: theme.spacing.md,
//   },
//   timerInfo: {
//     alignItems: 'center',
//   },
//   timerTitle: {
//     marginBottom: theme.spacing.sm,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   timerTime: {
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 48,
//     letterSpacing: 2,
//   },
//   timerStatus: {
//     fontWeight: '500',
//     marginBottom: theme.spacing.xs,
//   },
//   ringingChip: {
//     backgroundColor: theme.colors.error,
//     marginTop: theme.spacing.sm,
//   },
//   ringingText: {
//     color: '#ffffff',
//     fontWeight: 'bold',
//   },
//   timerDetails: {
//     marginBottom: theme.spacing.md,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xs,
//   },
//   detailLabel: {
//     color: theme.colors.textSecondary,
//   },
//   detailValue: {
//     color: theme.colors.text,
//     fontWeight: '500',
//   },
//   timerActions: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     flexWrap: 'wrap',
//     gap: theme.spacing.sm,
//   },
//   actionButton: {
//     minWidth: 90,
//   },
//   stopAlarmButton: {
//     minWidth: 150,
//   },
//   alarmHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: theme.spacing.md,
//   },
//   alarmInfo: {
//     flex: 1,
//   },
//   alarmTitle: {
//     marginBottom: theme.spacing.xs,
//     fontWeight: '600',
//   },
//   alarmTime: {
//     color: theme.colors.primary,
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.xs,
//     fontSize: 28,
//   },
//   daysChip: {
//     alignSelf: 'flex-start',
//     height: 24,
//   },
//   alarmActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: theme.spacing.xl,
//   },
//   emptyTitle: {
//     marginBottom: theme.spacing.sm,
//     color: theme.colors.textSecondary,
//     textAlign: 'center',
//   },
//   emptyMessage: {
//     textAlign: 'center',
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.lg,
//     lineHeight: 22,
//   },
//   createButton: {
//     marginTop: theme.spacing.sm,
//   },
//   fab: {
//     position: 'absolute',
//     margin: theme.spacing.md,
//     right: 0,
//     bottom: 0,
//     borderRadius: 28,
//   },
//   modalContent: {
//     backgroundColor: theme.colors.surface,
//     padding: theme.spacing.lg,
//     margin: theme.spacing.lg,
//     borderRadius: theme.spacing.md,
//     maxHeight: '80%',
//   },
//   modalTitle: {
//     marginBottom: theme.spacing.lg,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   input: {
//     marginBottom: theme.spacing.lg,
//   },
//   durationContainer: {
//     marginBottom: theme.spacing.md,
//   },
//   durationLabel: {
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//     fontWeight: '600',
//     fontSize: 18,
//   },
//   durationButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.md,
//   },
//   durationButton: {
//     minWidth: 60,
//   },
//   quickDurations: {
//     marginBottom: theme.spacing.lg,
//   },
//   quickLabel: {
//     marginBottom: theme.spacing.sm,
//     color: theme.colors.textSecondary,
//   },
//   quickButton: {
//     marginRight: theme.spacing.xs,
//     marginBottom: theme.spacing.xs,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     gap: theme.spacing.sm,
//   },
//   modalButton: {
//     flex: 1,
//   },
// });
