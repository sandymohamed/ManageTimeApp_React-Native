// @ts-ignore - React version compatibility issue
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Text, Card, List, Switch, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '@/services/apiClient';
import { logger } from '@/utils/logger';
import { useAuthStore } from '@/store/authStore';

export const NotificationSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { user, updateUser } = useAuthStore();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    taskReminders: true,
    goalReminders: true,
    projectInvitations: true,
    taskAssignments: true,
    taskComments: true,
    dueDateReminders: true,
    weeklyDigest: false,
    monthlyReport: false,
    marketingEmails: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/me/notification-settings');
      if (response.success && response.data) {
        setSettings({ ...settings, ...response.data });
      }
    } catch (error) {
      logger.error('Load notification settings error:', error);
    }
  };

  const handleToggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    try {
      await apiClient.put('/me/notification-settings', newSettings);
    } catch (error) {
      logger.error('Update notification settings error:', error);
      // Revert on error
      setSettings(settings);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('profile.notificationSettings')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.pushNotifications')}
            </Text>

            <List.Item
              title={t('settings.enablePushNotifications')}
              description={t('settings.pushNotificationsDesc')}
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={() => handleToggle('pushNotifications')}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.taskReminders')}
              description={t('settings.taskRemindersDesc')}
              left={(props) => <List.Icon {...props} icon="checkbox-marked" />}
              right={() => (
                <Switch
                  value={settings.taskReminders}
                  onValueChange={() => handleToggle('taskReminders')}
                  color={theme.colors.primary}
                  disabled={!settings.pushNotifications}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.goalReminders')}
              description={t('settings.goalRemindersDesc')}
              left={(props) => <List.Icon {...props} icon="flag" />}
              right={() => (
                <Switch
                  value={settings.goalReminders}
                  onValueChange={() => handleToggle('goalReminders')}
                  color={theme.colors.primary}
                  disabled={!settings.pushNotifications}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.dueDateReminders')}
              description={t('settings.dueDateRemindersDesc')}
              left={(props) => <List.Icon {...props} icon="calendar-alert" />}
              right={() => (
                <Switch
                  value={settings.dueDateReminders}
                  onValueChange={() => handleToggle('dueDateReminders')}
                  color={theme.colors.primary}
                  disabled={!settings.pushNotifications}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Project Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.projectNotifications')}
            </Text>

            <List.Item
              title={t('settings.projectInvitations')}
              description={t('settings.projectInvitationsDesc')}
              left={(props) => <List.Icon {...props} icon="account-plus" />}
              right={() => (
                <Switch
                  value={settings.projectInvitations}
                  onValueChange={() => handleToggle('projectInvitations')}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.taskAssignments')}
              description={t('settings.taskAssignmentsDesc')}
              left={(props) => <List.Icon {...props} icon="account-arrow-right" />}
              right={() => (
                <Switch
                  value={settings.taskAssignments}
                  onValueChange={() => handleToggle('taskAssignments')}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.taskComments')}
              description={t('settings.taskCommentsDesc')}
              left={(props) => <List.Icon {...props} icon="comment" />}
              right={() => (
                <Switch
                  value={settings.taskComments}
                  onValueChange={() => handleToggle('taskComments')}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Email Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.emailNotifications')}
            </Text>

            <List.Item
              title={t('settings.enableEmailNotifications')}
              description={t('settings.emailNotificationsDesc')}
              left={(props) => <List.Icon {...props} icon="email" />}
              right={() => (
                <Switch
                  value={settings.emailNotifications}
                  onValueChange={() => handleToggle('emailNotifications')}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.weeklyDigest')}
              description={t('settings.weeklyDigestDesc')}
              left={(props) => <List.Icon {...props} icon="email-newsletter" />}
              right={() => (
                <Switch
                  value={settings.weeklyDigest}
                  onValueChange={() => handleToggle('weeklyDigest')}
                  color={theme.colors.primary}
                  disabled={!settings.emailNotifications}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.monthlyReport')}
              description={t('settings.monthlyReportDesc')}
              left={(props) => <List.Icon {...props} icon="chart-line" />}
              right={() => (
                <Switch
                  value={settings.monthlyReport}
                  onValueChange={() => handleToggle('monthlyReport')}
                  color={theme.colors.primary}
                  disabled={!settings.emailNotifications}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.marketingEmails')}
              description={t('settings.marketingEmailsDesc')}
              left={(props) => <List.Icon {...props} icon="bullhorn" />}
              right={() => (
                <Switch
                  value={settings.marketingEmails}
                  onValueChange={() => handleToggle('marketingEmails')}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingTop: Platform.OS === 'ios' ? 50 : theme.spacing.md,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    headerTitle: {
      fontWeight: '600',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    card: {
      marginBottom: theme.spacing.md,
      elevation: 2,
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
      fontWeight: '600',
    },
    divider: {
      marginVertical: theme.spacing.xs,
    },
  });

