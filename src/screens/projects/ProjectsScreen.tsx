import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Text, FAB, Card, Button, Chip, IconButton, useTheme, Menu, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Project, ProjectStatus, ProjectRole } from '@/types/project';
import { useProjectStore } from '@/store/projectStore';
import { showDeleteConfirmation } from '@/components/ConfirmationDialog';

interface ProjectsScreenProps {
  navigation: any;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const {
    projects,
    filteredProjects,
    isLoading,
    error,
    searchQuery,
    sortBy,
    sortOrder,
    fetchProjects,
    refreshProjects,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    updateMemberRole,
  } = useProjectStore();

  const [searchVisible, setSearchVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRefresh = async () => {
    await refreshProjects();
  };

  const handleCreateProject = () => {
    navigation.navigate('ProjectCreate');
  };

  const handleProjectPress = (project: Project) => {
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  const handleEditProject = (project: Project) => {
    navigation.navigate('ProjectEdit', { projectId: project.id });
  };

  const handleDeleteProject = async (project: Project) => {
    showDeleteConfirmation(
      project.name,
      async () => {
        try {
          await deleteProject(project.id);
          showSuccess(t('projects.deletedSuccessfully', { name: project.name }));
        } catch (error) {
          console.error('Failed to delete project:', error);
          showError(t('projects.deleteFailed', { name: project.name }));
        }
      }
    );
  };

  const handleAddMember = (project: Project) => {
    navigation.navigate('ProjectInvite', { projectId: project.id });
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

  const renderProject = ({ item: project }: { item: Project }) => (
    <Card style={[styles.projectCard, { backgroundColor: theme.colors.card }]}>
      <TouchableOpacity onPress={() => handleProjectPress(project)}>
        <Card.Content style={styles.projectContent}>
          <View style={styles.projectHeader}>
            <View style={[styles.colorIndicator, { backgroundColor: project.color }]} />
            <View style={styles.projectInfo}>
              <Text variant="titleMedium" style={[styles.projectName, { color: theme.colors.text }]}>
                {project.name}
              </Text>
              {project.description && (
                <Text variant="bodyMedium" style={[styles.projectDescription, { color: theme.colors.textSecondary }]}>
                  {project.description}
                </Text>
              )}
            </View>
            <View style={styles.projectActions}>
              <IconButton
                icon="account-plus"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => handleAddMember(project)}
              />
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => handleEditProject(project)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => handleDeleteProject(project)}
              />
            </View>
          </View>

          <View style={styles.projectStatus}>
            <Chip
              icon={getStatusIcon(project.status)}
              style={[styles.statusChip, { backgroundColor: getStatusColor(project.status) + '20' }]}
              textStyle={{ color: getStatusColor(project.status) }}
            >
              {t(`projects.status.${project.status.toLowerCase()}`)}
            </Chip>
          </View>

          <View style={styles.projectFooter}>
            <View style={styles.memberInfo}>
              <Text variant="bodySmall" style={[styles.memberCount, { color: theme.colors.textSecondary }]}>
                {project.members.length} {t('projects.members')}
              </Text>
              <Text variant="bodySmall" style={[styles.createdDate, { color: theme.colors.textSecondary }]}>
                {t('projects.createdOn', { date: new Date(project.createdAt).toLocaleDateString() })}
              </Text>
            </View>
            {project.members.length > 0 && (
              <View style={styles.memberAvatars}>
                {project.members.slice(0, 3).map((member, index) => (
                  <View
                    key={member.id}
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: theme.colors.primary },
                      index > 0 && { marginLeft: -8 }
                    ]}
                  >
                    <Text style={[styles.memberInitial, { color: theme.colors.onPrimary }]}>
                      {member.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ))}
                {project.members.length > 3 && (
                  <View style={[styles.memberAvatar, styles.moreMembers, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={[styles.memberInitial, { color: theme.colors.textSecondary }]}>
                      +{project.members.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton
        icon="folder-plus-outline"
        size={64}
        iconColor={theme.colors.textSecondary}
      />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
        {t('projects.noProjects')}
      </Text>
      <Text variant="bodyLarge" style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
        {t('projects.noProjectsDescription')}
      </Text>
      <Button mode="contained" onPress={handleCreateProject} style={styles.createButton}>
        {t('projects.createProject')}
      </Button>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <IconButton
        icon="alert-circle"
        size={64}
        iconColor={theme.colors.error}
      />
      <Text variant="headlineSmall" style={[styles.errorTitle, { color: theme.colors.error }]}>
        {t('common.error')}
      </Text>
      <Text variant="bodyLarge" style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
        {error || t('common.tryAgain')}
      </Text>
      <Button mode="outlined" onPress={handleRefresh} style={styles.retryButton}>
        {t('common.retry')}
      </Button>
    </View>
  );

  const renderSortMenu = () => (
    <Menu
      visible={sortMenuVisible}
      onDismiss={() => setSortMenuVisible(false)}
      anchor={
        <IconButton
          icon="sort"
          size={24}
          iconColor={theme.colors.primary}
          onPress={() => setSortMenuVisible(true)}
        />
      }
    >
      <Menu.Item
        onPress={() => {
          setSortBy('name');
          setSortMenuVisible(false);
        }}
        title={t('projects.sortByName')}
        leadingIcon="sort-alphabetical-ascending"
      />
      <Menu.Item
        onPress={() => {
          setSortBy('createdAt');
          setSortMenuVisible(false);
        }}
        title={t('projects.sortByCreated')}
        leadingIcon="calendar"
      />
      <Menu.Item
        onPress={() => {
          setSortBy('updatedAt');
          setSortMenuVisible(false);
        }}
        title={t('projects.sortByUpdated')}
        leadingIcon="update"
      />

      <Divider />
      <Menu.Item
        onPress={() => {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          setSortMenuVisible(false);
        }}
        title={sortOrder === 'asc' ? t('projects.sortDescending') : t('projects.sortAscending')}
        leadingIcon={sortOrder === 'asc' ? 'sort-descending' : 'sort-ascending'}
      />
    </Menu>
  );

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Actions */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTop}>
          <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('navigation.projects')}
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="magnify"
              size={24}
              iconColor={theme.colors.primary}
              onPress={() => setSearchVisible(!searchVisible)}
            />
            {renderSortMenu()}
          </View>
        </View>

        {searchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, {
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.text,
                borderColor: theme.colors.outline
              }]}
              placeholder={t('common.search')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <IconButton
              icon="close"
              size={20}
              iconColor={theme.colors.textSecondary}
              onPress={() => setSearchVisible(false)}
            />
          </View>
        )
        }
      </View >

      {/* Project List */}
      < FlatList
        data={filteredProjects}
        renderItem={renderProject}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          < RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      < FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateProject}
        label={t('projects.addProject')}
      />
    </View >
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  projectCard: {
    marginBottom: 12,
    elevation: 2,
  },
  projectContent: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    marginBottom: 4,
    fontWeight: '600',
  },
  projectDescription: {
    lineHeight: 18,
  },
  projectActions: {
    flexDirection: 'row',
  },
  projectStatus: {
    marginBottom: 12,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberCount: {
    marginBottom: 2,
  },
  createdDate: {
    fontSize: 12,
  },
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  moreMembers: {
    borderColor: theme.colors.outline,
  },
  memberInitial: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  createButton: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
