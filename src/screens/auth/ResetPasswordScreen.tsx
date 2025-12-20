import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { ApiResponse } from '@/types';

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const token = (route.params as any)?.token || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate new password
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    if (!token) {
      setPasswordError('Invalid reset token. Please start the password reset process again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', {
        token,
        newPassword,
      });

      if (response.success) {
        setIsSuccess(true);
        // Navigate to login after 2 seconds
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 2000);
      } else {
        setPasswordError(response.error || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      setPasswordError(error?.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login' as never);
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            ✅ Success!
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Your password has been reset successfully.
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            Redirecting to login...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Reset Password
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Enter your new password
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                mode="outlined"
                secureTextEntry
                error={!!passwordError}
                disabled={isLoading}
                style={styles.input}
                placeholder="At least 6 characters"
              />
              {passwordError && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {passwordError}
                </Text>
              )}

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                mode="outlined"
                secureTextEntry
                error={!!confirmPasswordError}
                disabled={isLoading}
                style={styles.input}
                placeholder="Re-enter your password"
              />
              {confirmPasswordError && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {confirmPasswordError}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={isLoading}
                disabled={isLoading || !newPassword || !confirmPassword}
                style={styles.button}>
                Reset Password
              </Button>

              <Button
                mode="text"
                onPress={handleBackToLogin}
                style={styles.backButton}
                disabled={isLoading}>
                Back to Login
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.textSecondary,
  },
  message: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.xs,
  },
});

