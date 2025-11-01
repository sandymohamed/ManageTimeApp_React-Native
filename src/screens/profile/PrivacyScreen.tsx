// @ts-ignore - React version compatibility issue
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { Text, Card, List, Switch, Divider, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '@/services/apiClient';
import { logger } from '@/utils/logger';

export const PrivacyScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [settings, setSettings] = useState({
    shareAnalytics: true,
    shareCrashReports: true,
    showProfileToOthers: true,
    allowProjectInvites: true,
    showActivityStatus: true,
    allowDataCollection: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/me/privacy-settings');
      if (response.success && response.data) {
        setSettings({ ...settings, ...response.data });
      }
    } catch (error) {
      logger.error('Load privacy settings error:', error);
    }
  };

  const handleToggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    try {
      await apiClient.put('/me/privacy-settings', newSettings);
    } catch (error) {
      logger.error('Update privacy settings error:', error);
      // Revert on error
      setSettings(settings);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      t('profile.areYouSure'),
      t('profile.deleteAccountConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.deleteForever'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete('/me');
              if (response.success) {
                Alert.alert(
                  t('common.success'),
                  t('profile.accountDeleted'),
                  [{ text: t('common.ok') }]
                );
                // Logout will be handled by the app
              }
            } catch (error) {
              logger.error('Delete account error:', error);
              Alert.alert(t('common.error'), t('profile.deleteAccountError'));
            }
          },
        },
      ]
    );
  };

  const handleViewPrivacyPolicy = () => {
    Linking.openURL('https://your-app-url.com/privacy-policy');
  };

  const handleViewTerms = () => {
    Linking.openURL('https://your-app-url.com/terms-of-service');
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
          {t('profile.privacy')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.privacySettings')}
            </Text>

            <List.Item
              title={t('settings.showProfileToOthers')}
              description={t('settings.showProfileToOthersDesc')}
              left={(props) => <List.Icon {...props} icon="account-eye" />}
              right={() => (
                <Switch
                  value={settings.showProfileToOthers}
                  onValueChange={() => handleToggle('showProfileToOthers')}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.allowProjectInvites')}
              description={t('settings.allowProjectInvitesDesc')}
              left={(props) => <List.Icon {...props} icon="account-plus" />}
              right={() => (
                <Switch
                  value={settings.allowProjectInvites}
                  onValueChange={() => handleToggle('allowProjectInvites')}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.showActivityStatus')}
              description={t('settings.showActivityStatusDesc')}
              left={(props) => <List.Icon {...props} icon="circle" />}
              right={() => (
                <Switch
                  value={settings.showActivityStatus}
                  onValueChange={() => handleToggle('showActivityStatus')}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Data Collection */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.dataCollection')}
            </Text>

            <List.Item
              title={t('settings.shareAnalytics')}
              description={t('settings.shareAnalyticsDesc')}
              left={(props) => <List.Icon {...props} icon="chart-line" />}
              right={() => (
                <Switch
                  value={settings.shareAnalytics}
                  onValueChange={() => handleToggle('shareAnalytics')}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.shareCrashReports')}
              description={t('settings.shareCrashReportsDesc')}
              left={(props) => <List.Icon {...props} icon="bug" />}
              right={() => (
                <Switch
                  value={settings.shareCrashReports}
                  onValueChange={() => handleToggle('shareCrashReports')}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.allowDataCollection')}
              description={t('settings.allowDataCollectionDesc')}
              left={(props) => <List.Icon {...props} icon="database" />}
              right={() => (
                <Switch
                  value={settings.allowDataCollection}
                  onValueChange={() => handleToggle('allowDataCollection')}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Legal Documents */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.legalDocuments')}
            </Text>

            <List.Item
              title={t('settings.privacyPolicy')}
              description={t('settings.privacyPolicyDesc')}
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={handleViewPrivacyPolicy}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.termsOfService')}
              description={t('settings.termsOfServiceDesc')}
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={handleViewTerms}
            />
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.error }]}>
              {t('profile.dangerZone')}
            </Text>
            <Text variant="bodyMedium" style={[styles.dangerText, { color: theme.colors.onErrorContainer }]}>
              {t('profile.dangerZoneDesc')}
            </Text>
            <Button
              mode="contained"
              onPress={handleDeleteAccount}
              buttonColor={theme.colors.error}
              icon="alert"
              style={styles.deleteButton}
            >
              {t('profile.deleteAccount')}
            </Button>
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
    dangerText: {
      marginBottom: theme.spacing.md,
      lineHeight: 20,
    },
    deleteButton: {
      marginTop: theme.spacing.sm,
    },
  });

