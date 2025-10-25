import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/utils/theme';
import { validateEmail, validatePassword } from '@/utils/validation';
// --------------------------------------------------------------

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  console.log("RegisterScreen - isAuthenticated:", isAuthenticated);

  useEffect(() => {
    console.log("RegisterScreen - Authentication state changed:", isAuthenticated);
  }, [isAuthenticated]);

  const handleRegister = async () => {
    // Clear previous errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();
    console.log("handleRegister try", name.trim(), email.trim(), password);
    // Validate inputs
    let hasError = false;
    console.log("handleRegister try2222222222", name.trim(), email.trim(), password);
    
    if (!name.trim()) {
      console.log("handleRegister xxxxxxxxxxxxxxxxxxx", name.trim(), email.trim(), password);
      setNameError('Name is required');
      hasError = true;
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      console.log("handleRegister yyyyyyyyyyyyyyy", name.trim(), email.trim(), password);
      setNameError('Name must be between 2 and 100 characters');
      hasError = true;
      console.log("handleRegister yyyyyyyyyyyyyyy000", name.trim(), email.trim(), password);
    }

    console.log("handleRegister 3333333333333", name.trim(), email.trim(), password);
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      hasError = true;
    }

    console.log("handleRegister 44444444444444", name.trim(), email.trim(), password);
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
      console.log("handleRegister 5555555555555", name.trim(), email.trim(), password);
    } else {
      console.log("handleRegister 6666666666666", name.trim(), email.trim(), password);
      if (!validatePassword(password)) {
        setPasswordError('Password must be at least 6 characters long');
        hasError = true;
        console.log("handleRegister 77777777777", name.trim(), email.trim(), password);
      }
    }

    if (!confirmPassword.trim()) {
      console.log("handleRegister 888888888888888", name.trim(), email.trim(), password);
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (password !== confirmPassword) {
      console.log("handleRegister 9999999999999", name.trim(), email.trim(), password);
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;
    console.log("handleRegister 000000000000", name.trim(), email.trim(), password);

    try {
      console.log("handleRegister try", name.trim(), email.trim(), password);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      
      console.log("Registration successful! User should be redirected to main app.");
      console.log("RegisterScreen - isAuthenticated after registration:", isAuthenticated);
      // Registration successful - user will be automatically redirected by auth state change
    } catch (error) {
      console.log("Registration failed:", error);
      // Error is handled by the store
    }
  };



  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Create Account
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign up to get started
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="name"
                error={!!nameError}
                style={styles.input}
              />
              {nameError && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {nameError}
                </Text>
              )}

              <TextInput
                label="Email"
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
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                autoComplete="password-new"
                error={!!passwordError}
                style={styles.input}
              />
              {passwordError && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {passwordError}
                </Text>
              )}

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                autoComplete="password-new"
                error={!!confirmPasswordError}
                style={styles.input}
              />
              {confirmPasswordError && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {confirmPasswordError}
                </Text>
              )}

              {error && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {error}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
                style={styles.registerButton}>
                Sign Up
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.footerText}>
              Already have an account?
            </Text>
            <Button mode="text" onPress={handleLogin}>
              Sign In
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
  registerButton: {
    marginTop: theme.spacing.md,
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
});
