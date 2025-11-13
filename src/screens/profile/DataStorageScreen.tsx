// @ts-ignore - React version compatibility issue
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Share } from 'react-native';
import { Text, Card, List, Divider, Button, ProgressBar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '@/services/apiClient';
import { logger } from '@/utils/logger';
import { ApiResponse, Task, Project, Goal } from '@/types';

interface StorageStats {
  tasks: number;
  projects: number;
  goals: number;
  alarms: number;
  totalSize: string;
  storageLimit: string;
  usagePercentage: number;
}
const DataFormatter = ({ data }: { data: any }) => {
  const formatDate = (date: string | number | Date) => {
    try {
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const line = (char = '─', len = 70) => char.repeat(len);

  const makeTable = (headers: string[], rows: string[][]) => {
    // Find column widths
    const colWidths = headers.map((_, i) =>
      Math.max(
        headers[i].length,
        ...rows.map((r) => (r[i] ? r[i].length : 0))
      )
    );

    const formatRow = (cols: string[]) =>
      '│ ' +
      cols
        .map((col, i) => col?.padEnd(colWidths[i], ' '))
        ?.join(' │ ') +
      ' │';

    let table = '';
    const topBorder =
      '┌' +
      colWidths.map((w) => '─'.repeat(w + 2)).join('┬') +
      '┐\n';
    const headerLine =
      '├' +
      colWidths.map((w) => '─'.repeat(w + 2)).join('┼') +
      '┤\n';
    const bottomBorder =
      '└' +
      colWidths.map((w) => '─'.repeat(w + 2)).join('┴') +
      '┘\n';

    table += topBorder;
    table += formatRow(headers) + '\n';
    table += headerLine;
    rows.forEach((r) => {
      table += formatRow(r) + '\n';
    });
    table += bottomBorder + '\n';
    return table;
  };

  const formatDataForDisplay = (exportData: any) => {
    if (!exportData) return '';

    const { user, tasks, projects, goals, alarms, reminders } = exportData;

    let out = '';
    out += `📊 𝗧𝗜𝗠𝗘 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧 𝗘𝗫𝗣𝗢𝗥𝗧\n${line()}\n`;
    out += `Generated: ${formatDate(new Date())}\n\n`;

    // USER INFO
    out += `👤 USER INFO\n${line()}\n`;
    out += makeTable(
      ['Name', 'Email', 'Timezone'],
      [[user?.name || 'N/A', user?.email || 'N/A', user?.timezone || 'UTC']]
    );

    // SUMMARY
    out += `📈 SUMMARY\n${line()}\n`;
    out += makeTable(
      ['Tasks', 'Projects', 'Goals', 'Alarms', 'Reminders'],
      [[
        String(tasks?.length || 0),
        String(projects?.length || 0),
        String(goals?.length || 0),
        String(alarms?.length || 0),
        String(reminders?.length || 0),
      ]]
    );

    // TASKS
    if (tasks?.length > 0) {
      out += `✅ TASKS (${tasks.length})\n${line()}\n`;
      const taskRows = tasks.slice(0, 10).map((t: any, i: number) => [
        String(i + 1),
        t.title,
        t.status || '-',
        t.priority || '-',
        t.dueDate ? formatDate(t.dueDate) : '-',
      ]);
      out += makeTable(['#', 'Title', 'Status', 'Priority', 'Due Date'], taskRows);
      if (tasks.length > 10)
        out += `... and ${tasks.length - 10} more tasks\n\n`;
    }

    // PROJECTS
    if (projects?.length > 0) {
      out += `📁 PROJECTS (${projects.length})\n${line()}\n`;
      const projRows = projects.slice(0, 5).map((p: any, i: number) => [
        String(i + 1),
        p.name,
        p.status || '-',
        p.startDate ? formatDate(p.startDate) : '-',
        p.endDate ? formatDate(p.endDate) : '-',
      ]);
      out += makeTable(['#', 'Name', 'Status', 'Start', 'End'], projRows);
      if (projects.length > 5)
        out += `... and ${projects.length - 5} more projects\n\n`;
    }

    // GOALS
    if (goals?.length > 0) {
      out += `🎯 GOALS (${goals.length})\n${line()}\n`;
      const goalRows = goals.slice(0, 5).map((g: any, i: number) => [
        String(i + 1),
        g.title,
        g.status || '-',
        g.progress ? `${g.progress}%` : '-',
        g.category || '-',
      ]);
      out += makeTable(['#', 'Title', 'Status', 'Progress', 'Category'], goalRows);
      if (goals.length > 5)
        out += `... and ${goals.length - 5} more goals\n\n`;
    }

    // ALARMS
    if (alarms?.length > 0) {
      out += `⏰ ALARMS (${alarms.length})\n${line()}\n`;
      const alarmRows = alarms.slice(0, 5).map((a: any, i: number) => [
        String(i + 1),
        a.title || '-',
        a.enabled ? 'On' : 'Off',
        a.time ? new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      ]);
      out += makeTable(['#', 'Title', 'Enabled', 'Time'], alarmRows);
      if (alarms.length > 5)
        out += `... and ${alarms.length - 5} more alarms\n\n`;
    }

    out += `${line()}\nExported from Time Management App\n`;

    return out;
  };

  return formatDataForDisplay(data);
};



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
      const response = await apiClient.get<{
        success: boolean;
        data: {
          tasks?: { total: number; completed: number };
          projects?: number;
          goals?: { total: number; completed: number };
          alarms?: number;
        };
      }>('/me/stats');

      if (response.success && response.data) {
        const data = response.data;
        const tasks = typeof data.tasks === 'object' ? data.tasks.total : 0;
        const projects = typeof data.projects === 'number' ? data.projects : 0;
        const goals = typeof data.goals === 'object' ? data.goals.total : 0;
        const alarms = typeof data.alarms === 'number' ? data.alarms : 0;

        // Estimate storage size (rough calculation)
        const estimatedBytes = (tasks * 1024) + (projects * 2048) + (goals * 1536) + (alarms * 512);
        const totalSizeMB = estimatedBytes / (1024 * 1024);
        const storageLimitMB = 100;
        const usagePercentage = Math.min(totalSizeMB / storageLimitMB, 1);

        setStats({
          tasks,
          projects,
          goals,
          alarms,
          totalSize: totalSizeMB > 0 ? `${totalSizeMB.toFixed(2)} MB` : '0 MB',
          storageLimit: '100 MB',
          usagePercentage,
        });
      }
    } catch (error: any) {
      logger.error('Load storage stats error:', error);
      // Don't show alert on initial load, just log the error
      // User can retry with refresh button if needed
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };



  // Updated export function
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
              const response = await apiClient.get<{ success: boolean; data: any }>('/me/export');
              if (response.success && response.data) {
                console.log("Export data response:", response.data);

                // Create both formats
                const jsonString = JSON.stringify(response.data, null, 2);
                const userFriendlyText = DataFormatter({ data: response.data });

                const timestamp = new Date().toISOString().split('T')[0];
                const filename = `manage-time-export-${timestamp}`;

                // Share both formats
                try {
                  const result = await Share.share({
                    message: `📊 TIME MANAGEMENT EXPORT\n\n` +
                      `We've prepared your data in an easy-to-read format below:\n\n` +
                      `${userFriendlyText}\n\n` +
                      `---\n` +
                      `RAW JSON DATA (for backup):\n` +
                      `${jsonString}`,
                    title: filename,
                  });

                  if (result.action === Share.sharedAction) {
                    Alert.alert(
                      t('common.success'),
                      t('data.exportSuccess')
                    );
                  }
                } catch (shareError) {
                  // Fallback: use only user-friendly format
                  logger.error('Share error:', shareError);
                  const result = await Share.share({
                    message: userFriendlyText,
                    title: filename,
                  });
                }
              } else {
                Alert.alert(t('common.error'), t('data.exportError'));
              }
            } catch (error: any) {
              logger.error('Export data error:', error);
              const errorMessage = error?.message || t('data.exportError');
              Alert.alert(t('common.error'), errorMessage);
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  // const handleExportData = async () => {
  //   Alert.alert(
  //     t('data.exportData'),
  //     t('data.exportDataDesc'),
  //     [
  //       { text: t('common.cancel'), style: 'cancel' },
  //       {
  //         text: t('data.export'),
  //         onPress: async () => {
  //           try {
  //             setExporting(true);
  //             const response = await apiClient.get<{ success: boolean; data: any }>('/me/export');
  //             if (response.success && response.data) {
  //               console.log("Export data response:", response.data);
  //               // Convert data to JSON string
  //               const jsonString = JSON.stringify(response.data, null, 2);
  //               const timestamp = new Date().toISOString().split('T')[0];
  //               const filename = `manage-time-export-${timestamp}.json`;

  //               // Share the exported data
  //               try {
  //                 const result = await Share.share({
  //                   message: jsonString,
  //                   title: filename,
  //                 });

  //                 if (result.action === Share.sharedAction) {
  //                   Alert.alert(
  //                     t('common.success'),
  //                     t('data.exportSuccess')
  //                   );
  //                 }
  //               } catch (shareError) {
  //                 // Fallback: copy to clipboard or show error
  //                 logger.error('Share error:', shareError);
  //                 Alert.alert(
  //                   t('common.success'),
  //                   t('data.exportSuccess') + '\n\nData exported. Check your share options.',
  //                 );
  //               }
  //             } else {
  //               Alert.alert(t('common.error'), t('data.exportError'));
  //             }
  //           } catch (error: any) {
  //             logger.error('Export data error:', error);
  //             const errorMessage = error?.message || t('data.exportError');
  //             Alert.alert(t('common.error'), errorMessage);
  //           } finally {
  //             setExporting(false);
  //           }
  //         },
  //       },
  //     ]
  //   );
  // };

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

  // const handleDeleteAllData = () => {
  //   Alert.alert(
  //     t('data.deleteAllData'),
  //     t('data.deleteAllDataWarning'),
  //     [
  //       { text: t('common.cancel'), style: 'cancel' },
  //       {
  //         text: t('common.delete'),
  //         style: 'destructive',
  //         onPress: confirmDeleteAllData,
  //       },
  //     ]
  //   );
  // };

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
              const response = await apiClient.delete<ApiResponse<void>>('/me/data');
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
              // disabled={exporting}
              disabled={true}
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
        {/* <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
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
        </Card> */}
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

