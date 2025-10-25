// import React, { useState } from 'react';
// import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
// import { Text, TextInput, Button, Card, Divider } from 'react-native-paper';
// import { useNavigation } from '@react-navigation/native';
// import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { useAuthStore } from '@/store/authStore';
// import { theme } from '@/utils/theme';
// import { validateEmail, validatePassword } from '@/utils/validation';
// import { authService } from '@/services/authService';
// import { tokenService } from '@/services/tokenService';
// import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// // --------------------------------------------------------------

// export const LoginScreen: React.FC = () => {
//   console.log("LoginScreen");

//   const navigation = useNavigation();
//   const { t } = useTranslation();
//   const { isRTL } = useLanguage();
//   const { login, isLoading, error, clearError } = useAuthStore();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [emailError, setEmailError] = useState('');
//   const [passwordError, setPasswordError] = useState('');

//   const handleLogin = async () => {
//     console.log("handleLogin");
//     // Clear previous errors
//     setEmailError('');
//     setPasswordError('');
//     clearError();

//     // Validate inputs
//     let hasError = false;

//     if (!email.trim()) {
//       setEmailError(t('auth.emailRequired'));
//       hasError = true;
//     } else if (!validateEmail(email)) {
//       setEmailError(t('auth.emailInvalid'));
//       hasError = true;
//     }

//     if (!password.trim()) {
//       setPasswordError(t('auth.passwordRequired'));
//       hasError = true;
//     }

//     if (hasError) return;

//     try {
//       await authService.testConnection();
//       console.log("handleLogin try", email.trim(), password);
//       await login({ email: email.trim(), password });

//       // Debug right after login
//       await tokenService.debugTokenStorage();

//     } catch (error) {
//       // Error is handled by the store
//       console.log("handleLogin catch", error);
//     }
//   };

//   const handleRegister = () => {
//     navigation.navigate('Register' as never);
//   };

//   const handleForgotPassword = () => {
//     navigation.navigate('ForgotPassword' as never);
//   };

//   return (
//     <KeyboardAvoidingView
//       style={[styles.container, isRTL && styles.rtlContainer]}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={[styles.content, isRTL && styles.rtlContent]}>
//           <View style={styles.header}>
//             <Text variant="headlineLarge" style={styles.title}>
//               {t('auth.welcomeBack')}
//             </Text>
//             <Text variant="bodyLarge" style={styles.subtitle}>
//               {t('auth.signInToAccount')}
//             </Text>
//             <View style={styles.languageSwitcher}>
//               <LanguageSwitcher mode="button" showLabel={false} />
//             </View>
//           </View>

//           <Card style={styles.card}>
//             <Card.Content>
//               <TextInput
//                 label={t('auth.email')}
//                 value={email}
//                 onChangeText={setEmail}
//                 mode="outlined"
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//                 autoComplete="email"
//                 error={!!emailError}
//                 style={styles.input}
//               />
//               {emailError && (
//                 <Text variant="bodySmall" style={styles.errorText}>
//                   {emailError}
//                 </Text>
//               )}

//               <TextInput
//                 label={t('auth.password')}
//                 value={password}
//                 onChangeText={setPassword}
//                 mode="outlined"
//                 secureTextEntry
//                 autoComplete="password"
//                 error={!!passwordError}
//                 style={styles.input}
//               />
//               {passwordError && (
//                 <Text variant="bodySmall" style={styles.errorText}>
//                   {passwordError}
//                 </Text>
//               )}

//               {error && (
//                 <Text variant="bodySmall" style={styles.errorText}>
//                   {error}
//                 </Text>
//               )}

//               <Button
//                 mode="contained"
//                 onPress={handleLogin}
//                 loading={isLoading}
//                 disabled={isLoading}
//                 style={styles.loginButton}>
//                 {t('auth.signIn')}
//               </Button>

//               <Button
//                 mode="text"
//                 onPress={handleForgotPassword}
//                 style={styles.forgotButton}>
//                 {t('auth.forgotPassword')}
//               </Button>
//             </Card.Content>
//           </Card>

//           <View style={styles.footer}>
//             <Divider style={styles.divider} />
//             <Text variant="bodyMedium" style={styles.footerText}>
//               {t('auth.dontHaveAccount')}
//             </Text>
//             <Button mode="text" onPress={handleRegister}>
//               {t('auth.signUp')}
//             </Button>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: theme.spacing.lg,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: theme.spacing.xl,
//   },
//   title: {
//     textAlign: 'center',
//     marginBottom: theme.spacing.sm,
//     color: theme.colors.primary,
//   },
//   subtitle: {
//     textAlign: 'center',
//     marginBottom: theme.spacing.md,
//     color: theme.colors.textSecondary,
//   },
//   languageSwitcher: {
//     marginTop: theme.spacing.sm,
//   },
//   card: {
//     marginBottom: theme.spacing.lg,
//   },
//   input: {
//     marginBottom: theme.spacing.sm,
//   },
//   errorText: {
//     color: theme.colors.error,
//     marginBottom: theme.spacing.sm,
//   },
//   loginButton: {
//     marginTop: theme.spacing.md,
//     marginBottom: theme.spacing.sm,
//   },
//   forgotButton: {
//     alignSelf: 'center',
//   },
//   footer: {
//     alignItems: 'center',
//   },
//   divider: {
//     width: '100%',
//     marginBottom: theme.spacing.md,
//   },
//   footerText: {
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.sm,
//   },
//   // RTL styles
//   rtlContainer: {
//     // RTL container styles
//   },
//   rtlContent: {
//     // RTL content styles
//   },
// });




import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Text, TextInput, Button, Card, Divider, IconButton } from 'react-native-paper';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { theme } from '@/utils/theme';
// import { validateEmail, validatePassword } from '@/utils/validation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
// import { authService } from '@/services/authService';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const navigation = useNavigation();

  const { login, isLoading, error, clearError } = useAuthStore();
  
  // Debug logging
  
  const [email, setEmail] = useState('sandysawy@gmail.com');
  const [password, setPassword] = useState('Sandy@123');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  console.log('🔍 LoginScreen Debug:', { isLoading, error, email, password });
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const logoScale = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    clearError();

    // Validate inputs
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) return;

    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      console.log("handleLogin catch", error);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleInputFocus = (inputName: string) => {
    setFocusedInput(inputName);
    clearError();
  };

  const handleInputBlur = () => {
    setFocusedInput(null);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section with Logo */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Animated.View
                style={[
                  styles.logoContainer,
                  { transform: [{ scale: logoScale }] }
                ]}
              >
                <View style={styles.logo}>
                  <Text style={styles.logoText}>⚡</Text>
                </View>
              </Animated.View>
              <Text variant="headlineLarge" style={styles.title}>
                {t('auth.welcomeBack')}
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                {t('auth.signInToAccount')}
              </Text>
            </Animated.View>

            {/* Login Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Card style={styles.card} elevation={4}>
                <Card.Content style={styles.cardContent}>
                  <Text variant="titleLarge" style={styles.formTitle}>
                    {t('auth.signIn')}
                  </Text>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      label={t('auth.email')}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => handleInputFocus('email')}
                      onBlur={handleInputBlur}
                      mode="outlined"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      error={!!emailError}
                      style={[
                        styles.input,
                        focusedInput === 'email' && styles.inputFocused
                      ]}
                      outlineColor={theme.colors.outline}
                      activeOutlineColor={theme.colors.primary}
                      left={
                        <TextInput.Icon
                          icon="email"
                          color={
                            focusedInput === 'email'
                              ? theme.colors.primary
                              : theme.colors.textSecondary
                          }
                        />
                      }
                    />
                    {emailError && (
                      <View style={styles.errorContainer}>
                        <Text variant="bodySmall" style={styles.errorText}>
                          {emailError}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      label={t('auth.password')}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => handleInputFocus('password')}
                      onBlur={handleInputBlur}
                      mode="outlined"
                      secureTextEntry={!isPasswordVisible}
                      autoComplete="password"
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={!!passwordError}
                      style={[
                        styles.input,
                        focusedInput === 'password' && styles.inputFocused
                      ]}
                      outlineColor={theme.colors.outline}
                      activeOutlineColor={theme.colors.primary}
                      left={
                        <TextInput.Icon
                          icon="lock"
                          color={
                            focusedInput === 'password'
                              ? theme.colors.primary
                              : theme.colors.textSecondary
                          }
                        />
                      }
                      right={
                        <TextInput.Icon
                          icon={isPasswordVisible ? "eye-off" : "eye"}
                          onPress={togglePasswordVisibility}
                          color={theme.colors.textSecondary}
                        />
                      }
                    />
                    {passwordError && (
                      <View style={styles.errorContainer}>
                        <Text variant="bodySmall" style={styles.errorText}>
                          {passwordError}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Error Message */}
                  {error && (
                    <View style={styles.mainErrorContainer}>
                      <Text variant="bodySmall" style={styles.mainErrorText}>
                        {error}
                      </Text>
                    </View>
                  )}

                  {/* Login Button */}
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.loginButton}
                    contentStyle={styles.loginButtonContent}
                    labelStyle={styles.loginButtonLabel}
                    icon="login"
                  >
                    {isLoading ? '...' : t('auth.signIn')} {isLoading ? '(Loading...)' : '(Ready)'}
                  </Button>

                  {/* Forgot Password */}
                  <Button
                    mode="text"
                    onPress={handleForgotPassword}
                    style={styles.forgotButton}
                    labelStyle={styles.forgotButtonLabel}
                    compact
                  >
                    {t('auth.forgotPassword')}
                  </Button>
                </Card.Content>
              </Card>

              {/* Divider & Register Section */}
              <View style={styles.footer}>
                <View style={styles.dividerContainer}>
                  <Divider style={styles.divider} />
                  <Text variant="bodyMedium" style={styles.dividerText}>
                    or
                  </Text>
                  <Divider style={styles.divider} />
                </View>

                <View style={styles.registerContainer}>
                  <Text variant="bodyMedium" style={styles.footerText}>
                    {t('auth.dontHaveAccount')}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={handleRegister}
                    style={styles.registerButton}
                    contentStyle={styles.registerButtonContent}
                    labelStyle={styles.registerButtonLabel}
                    icon="account-plus"
                  >
                    {t('auth.signUp')}
                  </Button>
                </View>
                <View style={styles.languageSwitcher}>
                  <LanguageSwitcher mode="button" showLabel={false} />
                </View>
              </View>

            </Animated.View>

            {/* Bottom Spacer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: screenHeight,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  logoContainer: {
    marginBottom: theme.spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `rgba(${theme.colors.primaryRGB}, 0.1)`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `rgba(${theme.colors.primaryRGB}, 0.2)`,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  formContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.lg,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
   },
  input: {
    backgroundColor: theme.colors.surface,
  },
  
  inputFocused: {
    backgroundColor: `${theme.colors.primary}08`,
  },
  errorContainer: {
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
  },
  mainErrorContainer: {
    backgroundColor: `${theme.colors.error}15`,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  mainErrorText: {
    color: theme.colors.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  forgotButtonLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outline,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  registerContainer: {
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  registerButton: {
    borderRadius: 12,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  registerButtonContent: {
    paddingVertical: theme.spacing.xs,
  },
  registerButtonLabel: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  languageSwitcher: {
    marginTop: theme.spacing.sm,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});