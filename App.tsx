import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar, Platform, AppState } from 'react-native';
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
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import './src/i18n'; // Initialize i18n

import { enableScreens } from 'react-native-screens';

enableScreens(); // Add this line

/**
 * Setup alarm notification channel on app startup
 * This MUST happen before any notifications arrive
 * If channel was previously created without sound, user must uninstall/reinstall app
 */
async function setupAlarmChannel(): Promise<void> {
  try {
    await notifee.createChannel({
      id: 'alarm-channel-v2',
      name: 'Alarms',
      importance: AndroidImportance.HIGH,
      sound: 'alarm', // References alarm.mp3 in android/app/src/main/res/raw/alarm.mp3
      vibration: true,
      visibility: AndroidVisibility.PUBLIC,
    });
    console.log('✅ Alarm channel created on app startup');
  } catch (error) {
    console.error('❌ Failed to create alarm channel:', error);
  }
}

const App: React.FC = () => {
  const { initializeAuth, isInitialized, isLoading, user, isAuthenticated } = useAuthStore();

  // STEP 1: Create alarm channel on app startup (BEFORE any notifications)
  useEffect(() => {
    if (Platform.OS === 'android') {
      setupAlarmChannel().catch((error) => {
        console.error('Failed to setup alarm channel:', error);
      });
    }
  }, []);

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

  // STEP 2: Start/stop global alarm engine based on app state
  useEffect(() => {
    const { startAlarmEngine, stopAlarmEngine } = require('./src/services/GlobalAlarmEngine');
    
    // Start engine when app is active
    startAlarmEngine();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground - start alarm checking
        startAlarmEngine();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - stop alarm checking (alarms will still ring via Notifee triggers)
        // Actually, we might want to keep it running in background too for reliability
        // Let's keep it running for now, only stop when app is terminated
      }
    });

    return () => {
      // Cleanup: stop engine when app unmounts/terminates
      stopAlarmEngine();
      subscription.remove();
    };
  }, []);

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
