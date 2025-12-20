// @ts-ignore - React version compatibility issue
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, TextInput, Button, Card, useTheme as usePaperTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '@/services/apiClient';
import { logger } from '@/utils/logger';

export const ChangePasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const paperTheme = usePaperTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) {
      newErrors.currentPassword = t('validation.currentPasswordRequired');
    }

    if (!newPassword) {
      newErrors.newPassword = t('validation.newPasswordRequired');
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t('validation.passwordTooShort');
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = t('validation.newPasswordSameAsOld');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.post('/me/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.success) {
        Alert.alert(
          t('common.success'),
          t('profile.passwordChanged'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error: any) {
      logger.error('Change password error:', error);
      
      let errorMessage = t('profile.changePasswordError');
      if (error?.message?.includes('current password')) {
        errorMessage = t('validation.currentPasswordIncorrect');
      }
      
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: theme.colors.disabled };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 1) return { strength, label: t('profile.passwordWeak'), color: theme.colors.error };
    if (strength <= 3) return { strength, label: t('profile.passwordMedium'), color: theme.colors.warning };
    return { strength, label: t('profile.passwordStrong'), color: theme.colors.success };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('profile.changePassword')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Info */}
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Card.Content>
            <View style={styles.infoRow}>
              <Icon name="shield-lock" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.text }]}>
                {t('profile.passwordSecurityInfo')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Password Form */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <TextInput
              label={t('profile.currentPassword')}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (errors.currentPassword) setErrors({ ...errors, currentPassword: undefined });
              }}
              mode="outlined"
              secureTextEntry={!showCurrentPassword}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showCurrentPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                />
              }
              error={!!errors.currentPassword}
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
            />
            {errors.currentPassword && (
              <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.currentPassword}
              </Text>
            )}

            <TextInput
              label={t('profile.newPassword')}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
              }}
              mode="outlined"
              secureTextEntry={!showNewPassword}
              left={<TextInput.Icon icon="lock-plus" />}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
              error={!!errors.newPassword}
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
            />
            {errors.newPassword && (
              <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.newPassword}
              </Text>
            )}

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarContainer}>
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text variant="bodySmall" style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <TextInput
              label={t('profile.confirmNewPassword')}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              error={!!errors.confirmPassword}
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
            />
            {errors.confirmPassword && (
              <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.confirmPassword}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Password Requirements */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('profile.passwordRequirements')}
            </Text>
            <View style={styles.requirementRow}>
              <Icon
                name={newPassword.length >= 6 ? 'check-circle' : 'circle-outline'}
                size={20}
                color={newPassword.length >= 6 ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text variant="bodyMedium" style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                {t('profile.passwordLength')}
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Icon
                name={/[A-Z]/.test(newPassword) ? 'check-circle' : 'circle-outline'}
                size={20}
                color={/[A-Z]/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text variant="bodyMedium" style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                {t('profile.passwordUppercase')}
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Icon
                name={/[a-z]/.test(newPassword) ? 'check-circle' : 'circle-outline'}
                size={20}
                color={/[a-z]/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text variant="bodyMedium" style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                {t('profile.passwordLowercase')}
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Icon
                name={/\d/.test(newPassword) ? 'check-circle' : 'circle-outline'}
                size={20}
                color={/\d/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text variant="bodyMedium" style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                {t('profile.passwordNumber')}
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Icon
                name={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'check-circle' : 'circle-outline'}
                size={20}
                color={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text variant="bodyMedium" style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                {t('profile.passwordSpecial')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleChangePassword}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
            buttonColor={theme.colors.primary}
            icon="lock-reset"
          >
            {t('profile.changePassword')}
          </Button>
          <Button mode="outlined" onPress={handleCancel} disabled={loading} style={styles.cancelButton}>
            {t('common.cancel')}
          </Button>
        </View>
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
    infoCard: {
      marginBottom: theme.spacing.md,
      elevation: 1,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    infoText: {
      flex: 1,
      lineHeight: 20,
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
    strengthContainer: {
      marginTop: -4,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
    },
    strengthBarContainer: {
      height: 4,
      backgroundColor: theme.colors.outline,
      borderRadius: 2,
      marginBottom: theme.spacing.xs,
      overflow: 'hidden',
    },
    strengthBar: {
      height: '100%',
      borderRadius: 2,
      transition: 'width 0.3s ease',
    },
    strengthLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
      fontWeight: '600',
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    requirementText: {
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

