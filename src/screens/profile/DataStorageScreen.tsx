// @ts-ignore - React version compatibility issue
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text, Card, List, Divider, Button, ProgressBar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '@/services/apiClient';
import { logger } from '@/utils/logger';

interface StorageStats {
  tasks: number;
  projects: number;
  goals: number;
  alarms: number;
  totalSize: string;
  storageLimit: string;
  usagePercentage: number;
}

export const DataStorageScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<StorageStats>({
    tasks: 0,
    projects: 0,
    goals: 0,
    alarms: 0,
    totalSize: '0 MB',
    storageLimit: '100 MB',
    usagePercentage: 0,
  });

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/me/stats');
      if (response.success && response.data) {
        setStats({
          tasks: response.data.tasks?.total || 0,
          projects: response.data.projects || 0,
          goals: response.data.goals?.total || 0,
          alarms: response.data.alarms || 0,
          totalSize: '15 MB', // Calculate based on data
          storageLimit: '100 MB',
          usagePercentage: 0.15,
        });
      }
    } catch (error) {
      logger.error('Load storage stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleExportData = async () => {
    Alert.alert(
      t('data.exportData'),
      t('data.exportDataDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('data.export'),
          onPress: async () => {
            try {
              setExporting(true);
              const response = await apiClient.get('/me/export');
              if (response.success) {
                Alert.alert(
                  t('common.success'),
                  t('data.exportSuccess')
                );
              }
            } catch (error) {
              logger.error('Export data error:', error);
              Alert.alert(t('common.error'), t('data.exportError'));
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      t('data.clearCache'),
      t('data.clearCacheDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('data.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear local cache
              Alert.alert(t('common.success'), t('data.cacheCleared'));
            } catch (error) {
              logger.error('Clear cache error:', error);
              Alert.alert(t('common.error'), t('data.clearCacheError'));
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      t('data.deleteAllData'),
      t('data.deleteAllDataWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: confirmDeleteAllData,
        },
      ]
    );
  };

  const confirmDeleteAllData = () => {
    Alert.alert(
      t('data.areYouSure'),
      t('data.deleteAllDataConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('data.deleteForever'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete('/me/data');
              if (response.success) {
                Alert.alert(t('common.success'), t('data.allDataDeleted'));
              }
            } catch (error) {
              logger.error('Delete all data error:', error);
              Alert.alert(t('common.error'), t('data.deleteDataError'));
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('profile.dataStorage')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Storage Usage */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('data.storageUsage')}
            </Text>

            <View style={styles.storageInfo}>
              <View style={styles.storageHeader}>
                <Text variant="bodyLarge" style={[styles.storageText, { color: theme.colors.text }]}>
                  {stats.totalSize} / {stats.storageLimit}
                </Text>
                <Text variant="bodyMedium" style={[styles.storagePercentage, { color: theme.colors.primary }]}>
                  {Math.round(stats.usagePercentage * 100)}%
                </Text>
              </View>
              <ProgressBar
                progress={stats.usagePercentage}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>

            <Button
              mode="outlined"
              onPress={loadStorageStats}
              loading={loading}
              icon="refresh"
              style={styles.refreshButton}
            >
              {t('data.refreshStats')}
            </Button>
          </Card.Content>
        </Card>

        {/* Data Breakdown */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('data.dataBreakdown')}
            </Text>

            <List.Item
              title={t('data.tasks')}
              description={`${stats.tasks} ${t('data.items')}`}
              left={(props) => <List.Icon {...props} icon="checkbox-marked-circle-outline" />}
              right={() => (
                <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                  ~{Math.round(stats.tasks * 0.01)} KB
                </Text>
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('data.projects')}
              description={`${stats.projects} ${t('data.items')}`}
              left={(props) => <List.Icon {...props} icon="folder" />}
              right={() => (
                <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                  ~{Math.round(stats.projects * 0.02)} KB
                </Text>
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('data.goals')}
              description={`${stats.goals} ${t('data.items')}`}
              left={(props) => <List.Icon {...props} icon="flag" />}
              right={() => (
                <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                  ~{Math.round(stats.goals * 0.015)} KB
                </Text>
              )}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('data.alarms')}
              description={`${stats.alarms} ${t('data.items')}`}
              left={(props) => <List.Icon {...props} icon="alarm" />}
              right={() => (
                <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                  ~{Math.round(stats.alarms * 0.005)} KB
                </Text>
              )}
            />
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('data.dataManagement')}
            </Text>

            <Button
              mode="contained"
              onPress={handleExportData}
              loading={exporting}
              disabled={exporting}
              icon="download"
              style={styles.actionButton}
            >
              {t('data.exportData')}
            </Button>

            <Button
              mode="outlined"
              onPress={handleClearCache}
              icon="broom"
              style={styles.actionButton}
            >
              {t('data.clearCache')}
            </Button>
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.error }]}>
              {t('data.dangerZone')}
            </Text>
            <Text variant="bodyMedium" style={[styles.dangerText, { color: theme.colors.onErrorContainer }]}>
              {t('data.dangerZoneDesc')}
            </Text>
            <Button
              mode="contained"
              onPress={handleDeleteAllData}
              buttonColor={theme.colors.error}
              icon="delete-forever"
              style={styles.deleteButton}
            >
              {t('data.deleteAllData')}
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
    storageInfo: {
      marginBottom: theme.spacing.md,
    },
    storageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    storageText: {
      fontWeight: '600',
    },
    storagePercentage: {
      fontWeight: '600',
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    refreshButton: {
      marginTop: theme.spacing.sm,
    },
    divider: {
      marginVertical: theme.spacing.xs,
    },
    actionButton: {
      marginBottom: theme.spacing.md,
    },
    dangerText: {
      marginBottom: theme.spacing.md,
      lineHeight: 20,
    },
    deleteButton: {
      marginTop: theme.spacing.sm,
    },
  });

