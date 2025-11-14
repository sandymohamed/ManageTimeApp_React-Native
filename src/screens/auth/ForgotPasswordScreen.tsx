import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '@/utils/theme';
import { validateEmail } from '@/utils/validation';
import { apiClient } from '@/services/apiClient';
import { ApiResponse } from '@/types';

type Step = 'email' | 'otp' | 'success';

import type { AuthStackParamList } from '@/navigation/AuthNavigator';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList, 'ForgotPassword'>>();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    // Clear previous errors
    setEmailError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        setStep('otp');
      } else {
        setEmailError(response.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      setEmailError(error?.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    // Clear previous errors
    setOtpError('');

    // Validate OTP
    if (!otp.trim()) {
      setOtpError('OTP is required');
      return;
    }

    if (otp.trim().length !== 6 || !/^\d+$/.test(otp.trim())) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (response.success && response.data?.token) {
        setResetToken(response.data.token);
        setStep('success');
        // Navigate to reset password screen
        navigation.navigate('ResetPassword', { token: response.data.token });
      } else {
        setOtpError(response.error || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      setOtpError(error?.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleResendOTP = () => {
    setOtp('');
    setOtpError('');
    handleSendOTP();
  };

  // Email Step
  if (step === 'email') {
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
              Enter your email to receive an OTP code
            </Text>

            <Card style={styles.card}>
              <Card.Content>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!emailError}
                  disabled={isLoading}
                  style={styles.input}
                />
                {emailError && (
                  <Text variant="bodySmall" style={styles.errorText}>
                    {emailError}
                  </Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleSendOTP}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.button}>
                  Send OTP
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
  }

  // OTP Step
  if (step === 'otp') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text variant="headlineLarge" style={styles.title}>
              Enter OTP Code
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              We sent a 6-digit code to {email}
            </Text>

            <Card style={styles.card}>
              <Card.Content>
                <TextInput
                  label="OTP Code"
                  value={otp}
                  onChangeText={(text) => {
                    // Only allow digits
                    const digitsOnly = text.replace(/[^0-9]/g, '');
                    if (digitsOnly.length <= 6) {
                      setOtp(digitsOnly);
                    }
                  }}
                  mode="outlined"
                  keyboardType="number-pad"
                  maxLength={6}
                  error={!!otpError}
                  disabled={isLoading}
                  style={styles.input}
                  placeholder="000000"
                />
                {otpError && (
                  <Text variant="bodySmall" style={styles.errorText}>
                    {otpError}
                  </Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleVerifyOTP}
                  loading={isLoading}
                  disabled={isLoading || otp.length !== 6}
                  style={styles.button}>
                  Verify OTP
                </Button>

                <Button
                  mode="text"
                  onPress={handleResendOTP}
                  style={styles.backButton}
                  disabled={isLoading}>
                  Resend OTP
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
  }

  // Success Step (shouldn't show, but just in case)
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          OTP Verified!
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Redirecting to password reset...
        </Text>
      </View>
    </View>
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
