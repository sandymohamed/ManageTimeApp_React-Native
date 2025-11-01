// @ts-ignore - React version compatibility issue
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, TextInput, Button, Avatar, Card, useTheme as usePaperTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '@/services/apiClient';
import { logger } from '@/utils/logger';

export const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const paperTheme = usePaperTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [timezone, setTimezone] = useState(user?.timezone || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('validation.nameRequired');
    } else if (name.trim().length < 2) {
      newErrors.name = t('validation.nameTooShort');
    }

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('validation.invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.put('/me', {
        name: name.trim(),
        timezone: timezone.trim() || undefined,
      });

      if (response.success) {
        updateUser(response.data);
        Alert.alert(
          t('common.success'),
          t('profile.profileUpdated'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      logger.error('Update profile error:', error);
      Alert.alert(
        t('common.error'),
        t('profile.updateProfileError')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('profile.editProfile')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Avatar.Text
            size={100}
            label={name.charAt(0).toUpperCase() || 'U'}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <TouchableOpacity style={[styles.changeAvatarButton, { backgroundColor: theme.colors.primary }]}>
            <Icon name="camera" size={20} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <TextInput
              label={t('auth.name')}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
              error={!!errors.name}
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
            />
            {errors.name && (
              <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.name}
              </Text>
            )}

            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              left={<TextInput.Icon icon="email" />}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
              disabled
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
            />
            <Text variant="bodySmall" style={[styles.helperText, { color: theme.colors.textSecondary }]}>
              {t('profile.emailCannotBeChanged')}
            </Text>

            <TextInput
              label={t('profile.timezone')}
              value={timezone}
              onChangeText={setTimezone}
              mode="outlined"
              left={<TextInput.Icon icon="clock-outline" />}
              placeholder="UTC, America/New_York, etc."
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
            />
            <Text variant="bodySmall" style={[styles.helperText, { color: theme.colors.textSecondary }]}>
              {t('profile.timezoneHelper')}
            </Text>
          </Card.Content>
        </Card>

        {/* User Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('profile.accountInfo')}
            </Text>
            <View style={styles.infoRow}>
              <Icon name="calendar" size={20} color={theme.colors.textSecondary} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {t('profile.memberSince')}: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="update" size={20} color={theme.colors.textSecondary} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {t('profile.lastUpdated')}: {new Date(user?.updatedAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
            buttonColor={theme.colors.primary}
          >
            {t('common.save')}
          </Button>
          <Button
            mode="outlined"
            onPress={handleCancel}
            disabled={loading}
            style={styles.cancelButton}
          >
            {t('common.cancel')}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  avatar: {
    marginTop: theme.spacing.lg,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '38%',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    marginTop: -8,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  helperText: {
    marginTop: -8,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  actions: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  saveButton: {
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    marginBottom: theme.spacing.md,
  },
});

