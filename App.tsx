import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar, Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import FlashMessage from 'react-native-flash-message';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { LoadingScreen } from './src/components/LoadingScreen';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { pushNotificationService } from './src/services/pushNotificationService';
import './src/i18n'; // Initialize i18n

import { enableScreens } from 'react-native-screens';

enableScreens(); // Add this line

const App: React.FC = () => {
  const { initializeAuth, isInitialized, isLoading, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    console.log('🚀 App: Initializing authentication...');
    initializeAuth();
  }, [initializeAuth]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      console.log('🔔 App: Initializing push notifications...');
      pushNotificationService.initialize().catch((error) => {
        console.error('Failed to initialize push notifications:', error);
      });
    }
  }, [isInitialized, isAuthenticated, user]);

  if (!isInitialized || isLoading) {
    return <LoadingScreen message="Initializing app..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NotificationProvider>
              <PaperProvider>
              <StatusBar
                barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
              />
              <AppNavigator />
              <Toast />
              <FlashMessage position="top" />
              </PaperProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
