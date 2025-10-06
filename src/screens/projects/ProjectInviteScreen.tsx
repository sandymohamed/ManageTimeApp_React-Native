import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, FlatList } from 'react-native';
import { Text, Button, TextInput, Card, useTheme, IconButton, Chip, Avatar, Menu, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ProjectRole } from '@/types/project';
import { useProjectStore } from '@/store/projectStore';

interface ProjectInviteScreenProps {
  navigation: any;
  route: {
    params: {
      projectId: string;
    };
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface InviteData {
  email: string;
  role: ProjectRole;
}

export const ProjectInviteScreen: React.FC<ProjectInviteScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const { showSuccess, showError } = useNotification();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const { projectId } = route.params;
  const { addMember, fetchProject } = useProjectStore();

  const [inviteData, setInviteData] = useState<InviteData>({
    email: '',
    role: ProjectRole.EDITOR,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock suggested users - in real app, this would come from API
  useEffect(() => {
    setSuggestedUsers([
      { id: '1', name: 'John Doe', email: 'john@example.com', avatar: undefined },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: undefined },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', avatar: undefined },
      { id: '4', name: 'Alice Brown', email: 'alice@example.com', avatar: undefined },
    ]);
  }, []);

  const handleEmailChange = (email: string) => {
    setInviteData({ ...inviteData, email });
    setShowSuggestions(email.length > 0);
    setErrors({ ...errors, email: '' });
  };

  const handleUserSelect = (user: User) => {
    setInviteData({ ...inviteData, email: user.email });
    setShowSuggestions(false);
  };

  const handleRoleSelect = (role: ProjectRole) => {
    setInviteData({ ...inviteData, role });
    setRoleMenuVisible(false);
  };

  const handleInvite = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};

    if (!inviteData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(inviteData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      await addMember(projectId, {
        userId: '', // This would be resolved by email on backend
        role: inviteData.role,
      });
      
      showSuccess(t('projects.memberInvitedSuccessfully', { email: inviteData.email }));
      navigation.goBack();
    } catch (error: any) {
      console.error('Invite member error:', error);
      showError(t('projects.inviteMemberError'));
    } finally {
      setIsLoading(false);
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

  const renderUserSuggestion = ({ item: user }: { item: User }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleUserSelect(user)}
    >
      <Avatar.Text
        size={40}
        label={user.name.charAt(0).toUpperCase()}
        style={{ backgroundColor: theme.colors.primary }}
      />
      <View style={styles.suggestionInfo}>
        <Text variant="bodyMedium" style={[styles.suggestionName, { color: theme.colors.text }]}>
          {user.name}
        </Text>
        <Text variant="bodySmall" style={[styles.suggestionEmail, { color: theme.colors.textSecondary }]}>
          {user.email}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>
              {t('projects.inviteMember')}
            </Text>

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.emailAddress')} *
              </Text>
              <TextInput
                mode="outlined"
                value={inviteData.email}
                onChangeText={handleEmailChange}
                placeholder={t('projects.enterEmailAddress')}
                error={!!errors.email}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* User Suggestions */}
            {showSuggestions && suggestedUsers.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <FlatList
                  data={suggestedUsers.filter(user => 
                    user.email.toLowerCase().includes(inviteData.email.toLowerCase()) ||
                    user.name.toLowerCase().includes(inviteData.email.toLowerCase())
                  )}
                  renderItem={renderUserSuggestion}
                  keyExtractor={item => item.id}
                  style={styles.suggestionsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text variant="bodyMedium" style={styles.label}>
                {t('projects.role')}
              </Text>
              <Menu
                visible={roleMenuVisible}
                onDismiss={() => setRoleMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    style={[styles.roleButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    onPress={() => setRoleMenuVisible(true)}
                  >
                    <IconButton
                      icon={getRoleIcon(inviteData.role)}
                      size={20}
                      iconColor={getRoleColor(inviteData.role)}
                    />
                    <Text style={[styles.roleText, { color: theme.colors.text }]}>
                      {t(`projects.roles.${inviteData.role.toLowerCase()}`)}
                    </Text>
                    <IconButton
                      icon="chevron-down"
                      size={20}
                      iconColor={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                }
              >
                <Menu.Item
                  onPress={() => handleRoleSelect(ProjectRole.EDITOR)}
                  title={t('projects.roles.editor')}
                  leadingIcon="pencil"
                />
                <Menu.Item
                  onPress={() => handleRoleSelect(ProjectRole.VIEWER)}
                  title={t('projects.roles.viewer')}
                  leadingIcon="eye"
                />
              </Menu>
            </View>

            {/* Role Description */}
            <View style={[styles.roleDescription, { backgroundColor: theme.colors.primaryContainer }]}>
              <IconButton
                icon={getRoleIcon(inviteData.role)}
                size={20}
                iconColor={theme.colors.primary}
              />
              <View style={styles.roleDescriptionText}>
                <Text variant="bodyMedium" style={[styles.roleDescriptionTitle, { color: theme.colors.primary }]}>
                  {t(`projects.roles.${inviteData.role.toLowerCase()}`)}
                </Text>
                <Text variant="bodySmall" style={[styles.roleDescriptionContent, { color: theme.colors.onPrimaryContainer }]}>
                  {t(`projects.roleDescriptions.${inviteData.role.toLowerCase()}`)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
        >
          {t('common.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={handleInvite}
          loading={isLoading}
          disabled={isLoading || !inviteData.email.trim()}
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        >
          {t('projects.sendInvite')}
        </Button>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 24,
    fontWeight: '700',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 8,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  suggestionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionName: {
    fontWeight: '500',
  },
  suggestionEmail: {
    marginTop: 2,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  roleText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  roleDescription: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  roleDescriptionText: {
    flex: 1,
    marginLeft: 8,
  },
  roleDescriptionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  roleDescriptionContent: {
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
  },
});
