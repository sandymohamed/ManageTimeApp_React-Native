import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, useTheme, IconButton, Chip, Avatar, Menu, Divider, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Project, ProjectRole, ProjectStatus } from '@/types/project';
import { useProjectStore } from '@/store/projectStore';
import { showDeleteConfirmation } from '@/components/ConfirmationDialog';

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      projectId: string;
    };
  };
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const { projectId } = route.params;
  const { currentProject, fetchProject, updateProject, deleteProject, removeMember, updateMemberRole } = useProjectStore();

  const [menuVisible, setMenuVisible] = useState(false);
  const [memberMenuVisible, setMemberMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    fetchProject(projectId);
  }, [projectId, fetchProject]);

  const handleEditProject = () => {
    navigation.navigate('ProjectEdit', { projectId });
  };

  const handleInviteMember = () => {
    navigation.navigate('ProjectInvite', { projectId });
  };

  const handleDeleteProject = () => {
    if (!currentProject) return;

    showDeleteConfirmation(
      currentProject.name,
      async () => {
        try {
          await deleteProject(currentProject.id);
          showSuccess(t('projects.deletedSuccessfully', { name: currentProject.name }));
          navigation.goBack();
        } catch (error) {
          console.error('Failed to delete project:', error);
          showError(t('projects.deleteFailed', { name: currentProject.name }));
        }
      }
    );
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    Alert.alert(
      t('projects.removeMember'),
      t('projects.removeMemberConfirmation', { name: userName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(projectId, userId);
              showSuccess(t('projects.memberRemovedSuccessfully', { name: userName }));
            } catch (error) {
              console.error('Failed to remove member:', error);
              showError(t('projects.removeMemberError'));
            }
          },
        },
      ]
    );
  };

  const handleUpdateMemberRole = async (userId: string, newRole: ProjectRole) => {
    try {
      await updateMemberRole(projectId, userId, { role: newRole });
      showSuccess(t('projects.memberRoleUpdatedSuccessfully'));
    } catch (error) {
      console.error('Failed to update member role:', error);
      showError(t('projects.updateMemberRoleError'));
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return theme.colors.success;
      case ProjectStatus.PLANNING: return theme.colors.info;
      case ProjectStatus.ON_HOLD: return theme.colors.warning;
      case ProjectStatus.DONE: return theme.colors.completed;
      case ProjectStatus.CANCELLED: return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return 'play-circle';
      case ProjectStatus.PLANNING: return 'calendar-clock';
      case ProjectStatus.ON_HOLD: return 'pause-circle';
      case ProjectStatus.DONE: return 'check-circle';
      case ProjectStatus.CANCELLED: return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getRoleIcon = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.OWNER: return 'crown';
      case ProjectRole.EDITOR: return 'pencil';
      case ProjectRole.VIEWER: return 'eye';
      default: return 'account';
    }
  };

  const getRoleColor = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.OWNER: return theme.colors.error;
      case ProjectRole.EDITOR: return theme.colors.primary;
      case ProjectRole.VIEWER: return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  if (!currentProject) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('common.loading')}...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Project Header */}
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.projectHeader}>
              <View style={[styles.colorIndicator, { backgroundColor: currentProject.color }]} />
              <View style={styles.projectInfo}>
                <Text variant="headlineMedium" style={[styles.projectName, { color: theme.colors.text }]}>
                  {currentProject.name}
                </Text>
                {currentProject.description && (
                  <Text variant="bodyLarge" style={[styles.projectDescription, { color: theme.colors.textSecondary }]}>
                    {currentProject.description}
                  </Text>
                )}
              </View>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={24}
                    iconColor={theme.colors.primary}
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    handleEditProject();
                  }}
                  title={t('projects.editProject')}
                  leadingIcon="pencil"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    handleInviteMember();
                  }}
                  title={t('projects.inviteMember')}
                  leadingIcon="account-plus"
                />
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    handleDeleteProject();
                  }}
                  title={t('projects.deleteProject')}
                  leadingIcon="delete"
                  titleStyle={{ color: theme.colors.error }}
                />
              </Menu>
            </View>

            <View style={styles.projectStatus}>
              <Chip
                icon={getStatusIcon(currentProject.status)}
                style={[styles.statusChip, { backgroundColor: getStatusColor(currentProject.status) + '20' }]}
                textStyle={{ color: getStatusColor(currentProject.status) }}
              >
                {t(`projects.status.${currentProject.status.toLowerCase()}`)}
              </Chip>
            </View>

            <View style={styles.projectMeta}>
              <View style={styles.metaItem}>
                <IconButton icon="calendar" size={16} iconColor={theme.colors.textSecondary} />
                <Text variant="bodySmall" style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {t('projects.createdOn', { date: new Date(currentProject.createdAt).toLocaleDateString() })}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <IconButton icon="account-group" size={16} iconColor={theme.colors.textSecondary} />
                <Text variant="bodySmall" style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {currentProject.members.length} {t('projects.members')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Project Dates */}
        {(currentProject.startDate || currentProject.endDate) && (
          <Card style={[styles.datesCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('projects.dates')}
              </Text>
              <View style={styles.datesContainer}>
                {currentProject.startDate && (
                  <View style={styles.dateItem}>
                    <IconButton icon="calendar-start" size={20} iconColor={theme.colors.primary} />
                    <View>
                      <Text variant="bodySmall" style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                        {t('projects.startDate')}
                      </Text>
                      <Text variant="bodyMedium" style={[styles.dateValue, { color: theme.colors.text }]}>
                        {new Date(currentProject.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                )}
                {currentProject.endDate && (
                  <View style={styles.dateItem}>
                    <IconButton icon="calendar-end" size={20} iconColor={theme.colors.primary} />
                    <View>
                      <Text variant="bodySmall" style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                        {t('projects.endDate')}
                      </Text>
                      <Text variant="bodyMedium" style={[styles.dateValue, { color: theme.colors.text }]}>
                        {new Date(currentProject.endDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Project Members */}
        <Card style={[styles.membersCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.membersHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('projects.members')} ({currentProject.members.length})
              </Text>
              <Button
                mode="outlined"
                icon="account-plus"
                onPress={handleInviteMember}
                style={styles.inviteButton}
              >
                {t('projects.invite')}
              </Button>
            </View>

            <View style={styles.membersList}>
              {currentProject.members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <Avatar.Text
                    size={40}
                    label={member.userName.charAt(0).toUpperCase()}
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <View style={styles.memberInfo}>
                    <Text variant="bodyMedium" style={[styles.memberName, { color: theme.colors.text }]}>
                      {member.userName}
                    </Text>
                    <Text variant="bodySmall" style={[styles.memberEmail, { color: theme.colors.textSecondary }]}>
                      {member.userEmail}
                    </Text>
                  </View>
                  <View style={styles.memberActions}>
                    <Chip
                      icon={getRoleIcon(member.role)}
                      style={[styles.roleChip, { backgroundColor: getRoleColor(member.role) + '20' }]}
                      textStyle={{ color: getRoleColor(member.role) }}
                    >
                      {t(`projects.roles.${member.role.toLowerCase()}`)}
                    </Chip>
                    <Menu
                      visible={memberMenuVisible === member.id}
                      onDismiss={() => setMemberMenuVisible(null)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          iconColor={theme.colors.textSecondary}
                          onPress={() => setMemberMenuVisible(member.id)}
                        />
                      }
                    >
                      {member.role !== ProjectRole.OWNER && (
                        <>
                          <Menu.Item
                            onPress={() => {
                              setMemberMenuVisible(null);
                              handleUpdateMemberRole(member.id, ProjectRole.EDITOR);
                            }}
                            title={t('projects.makeEditor')}
                            leadingIcon="pencil"
                          />
                          <Menu.Item
                            onPress={() => {
                              setMemberMenuVisible(null);
                              handleUpdateMemberRole(member.id, ProjectRole.VIEWER);
                            }}
                            title={t('projects.makeViewer')}
                            leadingIcon="eye"
                          />
                          <Divider />
                          <Menu.Item
                            onPress={() => {
                              setMemberMenuVisible(null);
                              handleRemoveMember(member.id, member.userName);
                            }}
                            title={t('projects.removeMember')}
                            leadingIcon="account-remove"
                            titleStyle={{ color: theme.colors.error }}
                          />
                        </>
                      )}
                    </Menu>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  colorIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    marginBottom: 8,
    fontWeight: '700',
  },
  projectDescription: {
    lineHeight: 22,
  },
  projectStatus: {
    marginBottom: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
  },
  datesCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  datesContainer: {
    gap: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    marginBottom: 2,
  },
  dateValue: {
    fontWeight: '500',
  },
  membersCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteButton: {
    borderRadius: 20,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleChip: {
    height: 28,
  },
});
