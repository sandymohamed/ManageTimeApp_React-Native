import React, {useState} from 'react';
import {View, StyleSheet, FlatList, Switch} from 'react-native';
import {Text, FAB, Card, Button, Chip, List} from 'react-native-paper';
import {theme} from '@/utils/theme';
import {formatTime} from '@/utils/dateUtils';

export const AlarmsScreen: React.FC = () => {
  const [alarms, setAlarms] = useState([
    {
      id: '1',
      title: 'Morning Alarm',
      time: '07:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isActive: true,
      sound: 'Default',
      volume: 80,
      snoozeMinutes: 5,
      smartWake: false,
    },
    {
      id: '2',
      title: 'Workout Reminder',
      time: '18:00',
      days: ['Monday', 'Wednesday', 'Friday'],
      isActive: true,
      sound: 'Motivational',
      volume: 70,
      snoozeMinutes: 10,
      smartWake: true,
    },
    {
      id: '3',
      title: 'Bedtime Reminder',
      time: '22:30',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      isActive: false,
      sound: 'Gentle',
      volume: 50,
      snoozeMinutes: 15,
      smartWake: false,
    },
  ]);

  const handleCreateAlarm = () => {
    console.log('Create alarm');
  };

  const handleAlarmPress = (alarm: any) => {
    console.log('Alarm pressed:', alarm.id);
  };

  const handleToggleAlarm = (alarmId: string) => {
    setAlarms(prevAlarms =>
      prevAlarms.map(alarm =>
        alarm.id === alarmId ? {...alarm, isActive: !alarm.isActive} : alarm
      )
    );
  };

  const handleDeleteAlarm = (alarmId: string) => {
    setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== alarmId));
  };

  const getDaysText = (days: string[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday')) {
      return 'Weekdays';
    }
    if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) {
      return 'Weekends';
    }
    return days.join(', ');
  };

  const renderAlarm = ({item}: {item: any}) => (
    <Card style={styles.alarmCard}>
      <Card.Content>
        <View style={styles.alarmHeader}>
          <View style={styles.alarmInfo}>
            <Text variant="titleMedium" style={styles.alarmTitle}>
              {item.title}
            </Text>
            <Text variant="headlineSmall" style={styles.alarmTime}>
              {item.time}
            </Text>
            <Text variant="bodySmall" style={styles.alarmDays}>
              {getDaysText(item.days)}
            </Text>
          </View>
          <Switch
            value={item.isActive}
            onValueChange={() => handleToggleAlarm(item.id)}
            trackColor={{false: theme.colors.outline, true: theme.colors.primary}}
            thumbColor={item.isActive ? theme.colors.onPrimary : theme.colors.surface}
          />
        </View>

        <View style={styles.alarmDetails}>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Sound:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
              {item.sound}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Volume:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
              {item.volume}%
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Snooze:
            </Text>
            <Text variant="bodySmall" style={styles.detailValue}>
              {item.snoozeMinutes} min
            </Text>
          </View>
          {item.smartWake && (
            <Chip mode="outlined" compact style={styles.smartWakeChip}>
              Smart Wake
            </Chip>
          )}
        </View>

        <View style={styles.alarmActions}>
          <Button
            mode="text"
            onPress={() => handleAlarmPress(item)}
            style={styles.actionButton}>
            Edit
          </Button>
          <Button
            mode="text"
            onPress={() => handleDeleteAlarm(item.id)}
            textColor={theme.colors.error}
            style={styles.actionButton}>
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No alarms set
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        Create your first alarm to stay on schedule
      </Text>
      <Button mode="contained" onPress={handleCreateAlarm} style={styles.createButton}>
        Create Alarm
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={alarms}
        renderItem={renderAlarm}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateAlarm}
        label="Add Alarm"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.sm,
    flexGrow: 1,
  },
  alarmCard: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTitle: {
    marginBottom: theme.spacing.xs,
  },
  alarmTime: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  alarmDays: {
    color: theme.colors.textSecondary,
  },
  alarmDetails: {
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
});
