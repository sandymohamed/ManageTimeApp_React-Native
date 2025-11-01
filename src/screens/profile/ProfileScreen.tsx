// @ts-ignore - React version compatibility issue
import React, { useState, useEffect, useCallback } from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {Text, Card, List, Button, Avatar, Divider, useTheme, Badge} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useAuthStore} from '@/store/authStore';
import {useTheme as useCustomTheme} from '@/contexts/ThemeContext';
import {notificationService} from '@/services/notificationService';

export const ProfileScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, logout, isLoading} = useAuthStore();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirmation'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {text: t('auth.logout'), style: 'destructive', onPress: logout},
      ]
    );
  };

  const handleEditProfile = () => {
    console.log('Edit profile');
  };

  const handleChangePassword = () => {
    console.log('Change password');
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleProjectInvitations = () => {
    navigation.navigate('ProjectInvitations' as never);
  };

  const handleHelp = () => {
    console.log('Help');
  };

  const handleAbout = () => {
    console.log('About');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme?.colors?.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={user?.name?.charAt(0) || 'U'}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.name || 'User'}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email || 'user@example.com'}
        </Text>
        <Button mode="outlined" onPress={handleEditProfile} style={styles.editButton}>
          {t('profile.editProfile')}
        </Button>
      </View>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <List.Item
            title={t('profile.settings')}
            description="Manage your account preferences"
            left={(props: any) => <List.Icon {...props} icon="account-cog" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleSettings}
          />
          <Divider />
          <List.Item
            title={t('invitations.projectInvitations')}
            description="Manage your project invitations"
            left={(props: any) => <List.Icon {...props} icon="account-plus" />}
            right={(props: any) => (
              <View style={styles.rightContainer}>
                {unreadCount > 0 && (
                  <Badge style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                    {unreadCount}
                  </Badge>
                )}
                <List.Icon {...props} icon="chevron-right" />
              </View>
            )}
            onPress={handleProjectInvitations}
          />
          <Divider />
          <List.Item
            title="Change Password"
            description="Update your password"
            left={(props: any) => <List.Icon {...props} icon="lock" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleChangePassword}
          />
          <Divider />
          <List.Item
            title={t('profile.notifications')}
            description="Manage notification preferences"
            left={(props: any) => <List.Icon {...props} icon="bell" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => console.log('Notifications')}
          />
          <Divider />
          <List.Item
            title="Privacy"
            description="Control your privacy settings"
            left={(props: any) => <List.Icon {...props} icon="shield-account" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => console.log('Privacy')}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme?.colors?.surface }]}>
        <Card.Content>
          <List.Item
            title="Help & Support"
            description="Get help and contact support"
            left={(props: any) => <List.Icon {...props} icon="help-circle" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleHelp}
          />
          <Divider />
          <List.Item
            title={t('profile.about')}
            description="App version and information"
            left={(props: any) => <List.Icon {...props} icon="information" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleAbout}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <List.Item
            title="Data & Storage"
            description="Manage your data and storage"
            left={(props: any) => <List.Icon {...props} icon="database" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => console.log('Data & Storage')}
          />
          <Divider />
          <List.Item
            title="Export Data"
            description="Export your data"
            left={(props: any) => <List.Icon {...props} icon="download" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => console.log('Export Data')}
          />
        </Card.Content>
      </Card>

      <View style={styles.logoutContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          loading={isLoading}
          disabled={isLoading}
          buttonColor={theme.colors.error}
          textColor={theme.colors.onError}
          style={styles.logoutButton}>
          {t('auth.logout')}
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Manage Time App v1.0.0
        </Text>
        <Text variant="bodySmall" style={styles.footerText}>
          Made with ❤️ for productivity
        </Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  name: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  email: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  editButton: {
    marginTop: theme.spacing.sm,
  },
  card: {
    margin: theme.spacing.sm,
  },
  logoutContainer: {
    padding: theme.spacing.lg,
  },
  logoutButton: {
    marginBottom: theme.spacing.md,
  },
  footer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  footerText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    marginRight: 8,
  },
});
