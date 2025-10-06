import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/utils/theme';
import { validateEmail, validatePassword } from '@/utils/validation';
import { authService } from '@/services/authService';
import { tokenService } from '@/services/tokenService';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// --------------------------------------------------------------

export const LoginScreen: React.FC = () => {
  console.log("LoginScreen");

  const navigation = useNavigation();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    console.log("handleLogin");
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    clearError();

    // Validate inputs
    let hasError = false;

    if (!email.trim()) {
      setEmailError(t('auth.emailRequired'));
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError(t('auth.emailInvalid'));
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError(t('auth.passwordRequired'));
      hasError = true;
    }

    if (hasError) return;

    try {
      await authService.testConnection();
      console.log("handleLogin try", email.trim(), password);
      await login({ email: email.trim(), password });

      // Debug right after login
      await tokenService.debugTokenStorage();

    } catch (error) {
      // Error is handled by the store
      console.log("handleLogin catch", error);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, isRTL && styles.rtlContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.content, isRTL && styles.rtlContent]}>
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              {t('auth.welcomeBack')}
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {t('auth.signInToAccount')}
            </Text>
            <View style={styles.languageSwitcher}>
              <LanguageSwitcher mode="button" showLabel={false} />
            </View>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!emailError}
                style={styles.input}
              />
              {emailError && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {emailError}
                </Text>
              )}

              <TextInput
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                autoComplete="password"
                error={!!passwordError}
                style={styles.input}
              />
              {passwordError && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {passwordError}
                </Text>
              )}

              {error && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {error}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}>
                {t('auth.signIn')}
              </Button>

              <Button
                mode="text"
                onPress={handleForgotPassword}
                style={styles.forgotButton}>
                {t('auth.forgotPassword')}
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.footerText}>
              {t('auth.dontHaveAccount')}
            </Text>
            <Button mode="text" onPress={handleRegister}>
              {t('auth.signUp')}
            </Button>
          </View>
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
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  languageSwitcher: {
    marginTop: theme.spacing.sm,
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
  loginButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  divider: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  footerText: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  // RTL styles
  rtlContainer: {
    // RTL container styles
  },
  rtlContent: {
    // RTL content styles
  },
});
