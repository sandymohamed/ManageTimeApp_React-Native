import React, {useState, useEffect} from 'react';
import {View, StyleSheet, FlatList, Switch, Alert} from 'react-native';
import {Text, FAB, Card, Button, Chip, List, SegmentedButtons, Portal, Modal, TextInput} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {theme} from '@/utils/theme';
import {formatTime} from '@/utils/dateUtils';
import {useAlarmStore} from '@/store/alarmStore';
import {Alarm, Timer, CreateTimerData} from '@/types/alarm';

export const AlarmsScreen: React.FC = () => {
  const {t} = useTranslation();
  const [activeTab, setActiveTab] = useState('alarms');
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerTitle, setTimerTitle] = useState('');
  const [timerDuration, setTimerDuration] = useState(25); // Default 25 minutes

  const {
    alarms,
    timers,
    activeTimer,
    loading,
    error,
    fetchAlarms,
    fetchTimers,
    createTimer,
    updateTimer,
    deleteTimer,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setActiveTimer,
    updateTimerRemainingTime,
    clearError,
  } = useAlarmStore();

  useEffect(() => {
    fetchAlarms();
    fetchTimers();
  }, []);

  // Listen for timer completion
  useEffect(() => {
    if (error && error.includes('completed')) {
      Alert.alert(t('timers.completed'), t('timers.timerCompletedMessage'));
      clearError();
    }
  }, [error, clearError, t]);


  const handleCreateTimer = async () => {
    if (!timerTitle.trim()) {
      Alert.alert(t('common.error'), t('timers.titleRequired'));
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
      Alert.alert(t('common.error'), t('timers.createError'));
    }
  };

  const handleStartTimer = async (timer: Timer) => {
    try {
      await startTimer(timer.id);
      setActiveTimer(timer);
    } catch (error) {
      Alert.alert(t('common.error'), t('timers.startError'));
    }
  };

  const handlePauseTimer = async (timer: Timer) => {
    try {
      await pauseTimer(timer.id);
    } catch (error) {
      Alert.alert(t('common.error'), t('timers.pauseError'));
    }
  };

  const handleStopTimer = async (timer: Timer) => {
    try {
      await stopTimer(timer.id);
      setActiveTimer(null);
    } catch (error) {
      Alert.alert(t('common.error'), t('timers.stopError'));
    }
  };

  const handleResetTimer = async (timer: Timer) => {
    try {
      await resetTimer(timer.id);
    } catch (error) {
      Alert.alert(t('common.error'), t('timers.resetError'));
    }
  };

  const handleDeleteTimer = async (timer: Timer) => {
    Alert.alert(
      t('common.confirm'),
      t('timers.deleteConfirm'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTimer(timer.id);
              if (activeTimer?.id === timer.id) {
                setActiveTimer(null);
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('timers.deleteError'));
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerStatusColor = (timer: Timer) => {
    if (timer.isCompleted) return theme.colors.success;
    if (timer.isRunning) return theme.colors.primary;
    if (timer.isPaused) return theme.colors.warning;
    return theme.colors.outline;
  };

  const getTimerStatusText = (timer: Timer) => {
    if (timer.isCompleted) return t('timers.completed');
    if (timer.isRunning) return t('timers.running');
    if (timer.isPaused) return t('timers.paused');
    return t('timers.stopped');
  };

  const isOfflineTimer = (timer: Timer) => {
    return timer.id.startsWith('local_') || timer.userId === 'local';
  };

  const renderAlarm = ({item}: {item: Alarm}) => (
    <Card style={styles.alarmCard}>
      <Card.Content>
        <View style={styles.alarmHeader}>
          <View style={styles.alarmInfo}>
            <Text variant="titleMedium" style={styles.alarmTitle}>
              {item.title}
            </Text>
            <Text variant="headlineSmall" style={styles.alarmTime}>
              {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
            <Text variant="bodySmall" style={styles.alarmDays}>
              {item.timezone}
            </Text>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => handleToggleAlarm(item.id)}
            trackColor={{false: theme.colors.outline, true: theme.colors.primary}}
            thumbColor={item.enabled ? theme.colors.onPrimary : theme.colors.surface}
          />
        </View>

        <View style={styles.alarmDetails}>
          {item.toneUrl && (
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
                {t('alarms.sound')}:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
                {item.toneUrl}
            </Text>
          </View>
          )}
          {item.smartWakeWindow && (
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
                {t('alarms.smartWake')}:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
                {item.smartWakeWindow} min
            </Text>
          </View>
          )}
          {item.snoozeConfig && (
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
                {t('alarms.snooze')}:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
                {item.snoozeConfig.duration} min
            </Text>
          </View>
          )}
        </View>

        <View style={styles.alarmActions}>
          <Button
            mode="text"
            onPress={() => {/* TODO: Navigate to edit alarm */}}
            style={styles.actionButton}>
            {t('common.edit')}
          </Button>
          <Button
            mode="text"
            onPress={() => handleDeleteAlarm(item.id)}
            textColor={theme.colors.error}
            style={styles.actionButton}>
            {t('common.delete')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTimer = ({item}: {item: Timer}) => (
    <Card style={[styles.timerCard, activeTimer?.id === item.id && styles.activeTimerCard]}>
      <Card.Content>
        <View style={styles.timerHeader}>
          <View style={styles.timerInfo}>
            <Text variant="titleMedium" style={styles.timerTitle}>
              {item.title}
            </Text>
            <Text variant="headlineLarge" style={[styles.timerTime, {color: getTimerStatusColor(item)}]}>
              {formatTime(item.remainingTime)}
            </Text>
            <Text variant="bodySmall" style={[styles.timerStatus, {color: getTimerStatusColor(item)}]}>
              {getTimerStatusText(item)}
            </Text>
          </View>
        </View>

        <View style={styles.timerDetails}>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              {t('timers.duration')}:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
              {item.duration} {t('timers.minutes')}
            </Text>
          </View>
          {isOfflineTimer(item) && (
            <Chip mode="outlined" compact style={styles.offlineChip}>
              {t('timers.offline')}
            </Chip>
          )}
        </View>

        <View style={styles.timerActions}>
          {!item.isRunning && !item.isCompleted && (
            <Button
              mode="contained"
              onPress={() => handleStartTimer(item)}
              style={styles.actionButton}>
              {t('timers.start')}
            </Button>
          )}
          {item.isRunning && !item.isPaused && (
            <Button
              mode="outlined"
              onPress={() => handlePauseTimer(item)}
              style={styles.actionButton}>
              {t('timers.pause')}
            </Button>
          )}
          {item.isPaused && (
            <Button
              mode="contained"
              onPress={() => handleStartTimer(item)}
              style={styles.actionButton}>
              {t('timers.resume')}
            </Button>
          )}
          {(item.isRunning || item.isPaused) && (
            <Button
              mode="outlined"
              onPress={() => handleStopTimer(item)}
              style={styles.actionButton}>
              {t('timers.stop')}
            </Button>
          )}
          {item.isCompleted && (
            <Button
              mode="outlined"
              onPress={() => handleResetTimer(item)}
              style={styles.actionButton}>
              {t('timers.reset')}
            </Button>
          )}
          <Button
            mode="text"
            onPress={() => handleDeleteTimer(item)}
            textColor={theme.colors.error}
            style={styles.actionButton}>
            {t('common.delete')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {activeTab === 'alarms' ? t('alarms.noAlarms') : t('timers.noTimers')}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        {activeTab === 'alarms' ? t('alarms.createFirstAlarm') : t('timers.createFirstTimer')}
      </Text>
      <Button 
        mode="contained" 
        onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : handleCreateAlarm()} 
        style={styles.createButton}>
        {activeTab === 'alarms' ? t('alarms.createAlarm') : t('timers.createTimer')}
      </Button>
    </View>
  );

  const handleCreateAlarm = () => {
    // TODO: Navigate to create alarm screen
    console.log('Create alarm');
  };

  const handleToggleAlarm = async (alarmId: string) => {
    try {
      await useAlarmStore.getState().toggleAlarm(alarmId);
    } catch (error) {
      Alert.alert(t('common.error'), t('alarms.toggleError'));
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    Alert.alert(
      t('common.confirm'),
      t('alarms.deleteConfirm'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await useAlarmStore.getState().deleteAlarm(alarmId);
            } catch (error) {
              Alert.alert(t('common.error'), t('alarms.deleteError'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          {value: 'alarms', label: t('alarms.title')},
          {value: 'timers', label: t('timers.title')},
        ]}
        style={styles.segmentedButtons}
      />

      <FlatList
        data={activeTab === 'alarms' ? alarms : timers}
        renderItem={activeTab === 'alarms' ? renderAlarm : renderTimer}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => activeTab === 'alarms' ? fetchAlarms() : fetchTimers()}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => activeTab === 'timers' ? setShowTimerModal(true) : handleCreateAlarm()}
        label={activeTab === 'alarms' ? t('alarms.addAlarm') : t('timers.addTimer')}
      />

      <Portal>
        <Modal
          visible={showTimerModal}
          onDismiss={() => setShowTimerModal(false)}
          contentContainerStyle={styles.modalContent}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {t('timers.createTimer')}
          </Text>
          
          <TextInput
            label={t('timers.title')}
            value={timerTitle}
            onChangeText={setTimerTitle}
            style={styles.input}
            mode="outlined"
          />
          
          <View style={styles.durationContainer}>
            <Text variant="bodyLarge" style={styles.durationLabel}>
              {t('timers.duration')}: {timerDuration} {t('timers.minutes')}
            </Text>
            <View style={styles.durationButtons}>
              <Button
                mode="outlined"
                onPress={() => setTimerDuration(Math.max(1, timerDuration - 5))}
                style={styles.durationButton}>
                -5
              </Button>
              <Button
                mode="outlined"
                onPress={() => setTimerDuration(Math.max(1, timerDuration - 1))}
                style={styles.durationButton}>
                -1
              </Button>
              <Button
                mode="outlined"
                onPress={() => setTimerDuration(Math.min(1440, timerDuration + 1))}
                style={styles.durationButton}>
                +1
              </Button>
              <Button
                mode="outlined"
                onPress={() => setTimerDuration(Math.min(1440, timerDuration + 5))}
                style={styles.durationButton}>
                +5
              </Button>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowTimerModal(false)}
              style={styles.modalButton}>
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateTimer}
              style={styles.modalButton}>
              {t('common.create')}
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
  alarmCard: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
  },
  timerCard: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
  },
  activeTimerCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    elevation: 8,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  timerHeader: {
    marginBottom: theme.spacing.md,
  },
  alarmInfo: {
    flex: 1,
  },
  timerInfo: {
    alignItems: 'center',
  },
  alarmTitle: {
    marginBottom: theme.spacing.xs,
  },
  timerTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  alarmTime: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  timerTime: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontSize: 32,
  },
  alarmDays: {
    color: theme.colors.textSecondary,
  },
  timerStatus: {
    fontWeight: '500',
  },
  alarmDetails: {
    marginBottom: theme.spacing.md,
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
  },
  smartWakeChip: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  alarmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  timerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    marginLeft: theme.spacing.sm,
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
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.spacing.sm,
  },
  modalTitle: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: theme.spacing.lg,
  },
  durationContainer: {
    marginBottom: theme.spacing.lg,
  },
  durationLabel: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  durationButton: {
    minWidth: 60,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  offlineChip: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
  },
});
