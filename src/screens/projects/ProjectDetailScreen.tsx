import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, useTheme, IconButton, Chip, Avatar, Menu, Divider, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Project, ProjectRole, ProjectStatus, ProjectMilestone, ProjectTask, MilestoneStatus, TaskStatus, TaskPriority } from '@/types/project';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { milestoneService } from '@/services/milestoneService';
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
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const { projectId } = route.params;
  const { currentProject, fetchProject, updateProject, deleteProject, removeMember, updateMemberRole } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();

  const [menuVisible, setMenuVisible] = useState(false);
  const [memberMenuVisible, setMemberMenuVisible] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones'>('overview');
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<ProjectMilestone[]>([]);

  const fetchProjectMilestones = async () => {
    try {
      const milestones = await milestoneService.getProjectMilestones(projectId);
      setProjectMilestones(milestones);
    } catch (error) {
      console.error('Failed to fetch project milestones:', error);
    }
  };

  useEffect(() => {
    fetchProject(projectId);
    fetchTasks();
    fetchProjectMilestones();
  }, [projectId, fetchProject, fetchTasks]);

  useEffect(() => {
    if (tasks && currentProject) {
      console.log('tasks', tasks);
      // Filter tasks for this project
      const filteredTasks = tasks
        .filter(task => task.projectId === projectId)
        .map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status as TaskStatus,
          priority: task.priority as TaskPriority,
          dueDate: task.dueDate,
          completedAt: task.completedAt,
          assigneeId: task.assigneeId,
          assigneeName: task.assigneeId ? 'Assignee' : undefined, // You might want to fetch actual assignee name
          milestoneId: task.goalId, // Using goalId as milestoneId for now
          milestoneTitle: task.goalId ? 'Milestone' : undefined,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }));
      setProjectTasks(filteredTasks);
    }
  }, [tasks, currentProject, projectId]);

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

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return theme.colors.textSecondary;
      case TaskStatus.IN_PROGRESS: return theme.colors.info;
      case TaskStatus.DONE: return theme.colors.success;
      case TaskStatus.CANCELLED: return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getTaskPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW: return theme.colors.success;
      case TaskPriority.MEDIUM: return theme.colors.info;
      case TaskPriority.HIGH: return theme.colors.warning;
      case TaskPriority.URGENT: return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getMilestoneStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.TODO: return theme.colors.textSecondary;
      case MilestoneStatus.IN_PROGRESS: return theme.colors.info;
      case MilestoneStatus.DONE: return theme.colors.success;
      case MilestoneStatus.CANCELLED: return theme.colors.error;
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'tasks':
        return renderTasksContent();
      case 'milestones':
        return renderMilestonesContent();
      default:
        return renderOverviewContent();
    }
  };

  const renderOverviewContent = () => (
    <>
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
    </>
  );

  const renderTasksContent = () => {
    // Group tasks by milestone
    const tasksByMilestone = projectTasks.reduce((acc, task) => {
      const milestoneId = task.milestoneId || 'no-milestone';
      if (!acc[milestoneId]) {
        acc[milestoneId] = [];
      }
      acc[milestoneId].push(task);
      return acc;
    }, {} as Record<string, ProjectTask[]>);

    // Get milestone info for each group
    const getMilestoneInfo = (milestoneId: string) => {
      if (milestoneId === 'no-milestone') {
        return { title: t('projects.noMilestone'), color: theme.colors.textSecondary };
      }
      const milestone = projectMilestones.find(m => m.id === milestoneId);
      return milestone
        ? { title: milestone.title, color: getMilestoneStatusColor(milestone.status) }
        : { title: t('projects.unknownMilestone'), color: theme.colors.textSecondary };
    };

    return (
      <View style={styles.tabContent}>
        <Card style={[styles.contentCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('projects.tasks')} ({projectTasks.length})
              </Text>
              <IconButton
                mode="outlined"
                icon="plus"
                onPress={() => navigation.navigate('TaskCreate', { projectId })}
                style={styles.addButton}
              />
            </View>

            {projectTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('projects.noTasks')}
                </Text>
              </View>
            ) : (
              <View style={styles.tasksGroupedList}>
                {Object.entries(tasksByMilestone).map(([milestoneId, tasks]) => {
                  const milestoneInfo = getMilestoneInfo(milestoneId);
                  return (
                    <View key={milestoneId} style={styles.milestoneGroup}>
                      <View style={styles.milestoneGroupHeader}>
                        <View style={[styles.milestoneGroupIndicator, { backgroundColor: milestoneInfo.color }]} />
                        <Text variant="titleSmall" style={[styles.milestoneGroupTitle, { color: milestoneInfo.color }]}>
                          {milestoneInfo.title}
                        </Text>
                        <Text variant="bodySmall" style={[styles.milestoneGroupCount, { color: theme.colors.textSecondary }]}>
                          ({tasks.length})
                        </Text>
                      </View>
                      <View style={styles.tasksList}>
                        {tasks.map((task) => (
                          <View key={task.id} style={styles.taskItem}>
                            <View style={styles.taskInfo}>
                              <Text variant="bodyMedium" style={[styles.taskTitle, { color: theme.colors.text }]}>
                                {task.title}
                              </Text>
                              {task.description && (
                                <Text variant="bodySmall" style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
                                  {task.description}
                                </Text>
                              )}

                              <View style={styles.taskMeta}>
                                <Chip
                                  style={[styles.statusChip, { backgroundColor: getTaskStatusColor(task.status) + '20' }]}
                                  textStyle={{ color: getTaskStatusColor(task.status) }}
                                >
                                  {t(`tasks.status.${task.status.toLowerCase()}`)}
                                </Chip>
                                <Chip
                                  style={[styles.priorityChip, { backgroundColor: getTaskPriorityColor(task.priority) + '20' }]}
                                  textStyle={{ color: getTaskPriorityColor(task.priority) }}
                                >
                                  {t(`tasks.priority.${task.priority.toLowerCase()}`)}
                                </Chip>
                              </View>
                            </View>
                            <IconButton
                              icon="chevron-right"
                              size={20}
                              iconColor={theme.colors.textSecondary}
                              onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderMilestonesContent = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.contentCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('projects.milestones')} ({projectMilestones.length})
            </Text>
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => navigation.navigate('MilestoneCreate', { projectId })}
              style={styles.addButton}
            >
              {t('projects.addMilestone')}
            </Button>
          </View>

          {projectMilestones.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('projects.noMilestones')}
              </Text>
            </View>
          ) : (
            <View style={styles.milestonesList}>
              {projectMilestones.map((milestone) => (
                <View key={milestone.id} style={styles.milestoneItem}>
                  <View style={styles.milestoneInfo}>
                    <Text variant="bodyMedium" style={[styles.milestoneTitle, { color: theme.colors.text }]}>
                      {milestone.title}
                    </Text>
                    {milestone.description && (
                      <Text variant="bodySmall" style={[styles.milestoneDescription, { color: theme.colors.textSecondary }]}>
                        {milestone.description}
                      </Text>
                    )}
                    <View style={styles.milestoneMeta}>
                      <Text variant="bodySmall" style={[styles.milestoneDates, { color: theme.colors.textSecondary }]}>
                        {new Date(milestone.startDate).toLocaleDateString()} - {new Date(milestone.dueDate).toLocaleDateString()}
                      </Text>
                      <Chip
                        style={[styles.statusChip, { backgroundColor: getMilestoneStatusColor(milestone.status) + '20' }]}
                        textStyle={{ color: getMilestoneStatusColor(milestone.status) }}
                      >
                        {t(`milestones.status.${milestone.status.toLowerCase()}`)}
                      </Chip>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text variant="bodyMedium" style={[
            styles.tabText,
            { color: activeTab === 'overview' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            {t('projects.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text variant="bodyMedium" style={[
            styles.tabText,
            { color: activeTab === 'tasks' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            {t('projects.tasks')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'milestones' && styles.activeTab]}
          onPress={() => setActiveTab('milestones')}
        >
          <Text variant="bodyMedium" style={[
            styles.tabText,
            { color: activeTab === 'milestones' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            {t('projects.milestones')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
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
    height: 35,
    alignSelf: 'flex-start',
    lineHeight: 8,
    padding: 0,
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
    height: 35,
    alignSelf: 'flex-start',
    lineHeight: 8,
    padding: 0,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    elevation: 2,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontWeight: '500',
  },
  // Content styles
  tabContent: {
    flex: 1,
  },
  contentCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    borderRadius: 20,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  // Task styles
  tasksList: {
    gap: 12,
  },
  tasksGroupedList: {
    gap: 24,
  },
  milestoneGroup: {
    marginBottom: 16,
  },
  milestoneGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '20',
  },
  milestoneGroupIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  milestoneGroupTitle: {
    fontWeight: '600',
    flex: 1,
  },
  milestoneGroupCount: {
    fontSize: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '20',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  taskDescription: {
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
 
  priorityChip: {
    height: 35,
    alignSelf: 'flex-start',
    lineHeight: 8,
    padding: 0,
  },
  // Milestone styles
  milestonesList: {
    gap: 12,
  },
  milestoneItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '20',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  milestoneDescription: {
    marginBottom: 8,
  },
  milestoneMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneDates: {
    fontSize: 12,
  },
});
