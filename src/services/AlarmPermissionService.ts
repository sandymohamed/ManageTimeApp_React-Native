import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { logger } from '@/utils/logger';

/**
 * Alarm Permission Service
 * 
 * Handles all Android permissions required for reliable alarm functionality:
 * - SCHEDULE_EXACT_ALARM (Android 12+)
 * - POST_NOTIFICATIONS (Android 13+)
 * - Foreground service permission
 * - Battery optimization exemption guidance
 */
class AlarmPermissionService {
  /**
   * Check if all required permissions are granted
   */
  async checkAllPermissions(): Promise<{
    exactAlarm: boolean;
    notifications: boolean;
    allGranted: boolean;
  }> {
    if (Platform.OS !== 'android') {
      return { exactAlarm: true, notifications: true, allGranted: true };
    }

    const exactAlarm = await this.checkExactAlarmPermission();
    const notifications = await this.checkNotificationPermission();

    return {
      exactAlarm,
      notifications,
      allGranted: exactAlarm && notifications,
    };
  }

  /**
   * Check SCHEDULE_EXACT_ALARM permission (Android 12+)
   */
  async checkExactAlarmPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 31) return true; // Android 11 and below don't need this

    try {
      const { AlarmModule } = require('react-native').NativeModules;
      if (AlarmModule && typeof AlarmModule.canScheduleExactAlarms === 'function') {
        const canSchedule = await AlarmModule.canScheduleExactAlarms();
        logger.info(`📱 Exact alarm permission check: ${canSchedule}`);
        return canSchedule;
      }

      // Fallback: Assume granted if native method doesn't exist
      // User can manually grant in settings if needed
      logger.warn('⚠️ Cannot check exact alarm permission - native method not available');
      return true;
    } catch (error) {
      logger.error('❌ Error checking exact alarm permission:', error);
      return false;
    }
  }

  /**
   * Request SCHEDULE_EXACT_ALARM permission (Android 12+)
   * This opens the system settings page where user must grant permission
   */
  async requestExactAlarmPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 31) return true;

    try {
      const { AlarmModule } = require('react-native').NativeModules;
      if (AlarmModule && typeof AlarmModule.openExactAlarmSettings === 'function') {
        await AlarmModule.openExactAlarmSettings();
        logger.info('📱 Opened exact alarm permission settings');
        return true;
      }

      // Fallback: Open app settings
      Alert.alert(
        'Exact Alarm Permission Required',
        'This app needs permission to schedule exact alarms. Please grant "Schedule exact alarms" permission in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    } catch (error) {
      logger.error('❌ Error requesting exact alarm permission:', error);
      Alert.alert(
        'Permission Error',
        'Please grant "Schedule exact alarms" permission in your device settings for alarms to work correctly.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    }
  }

  /**
   * Check POST_NOTIFICATIONS permission (Android 13+)
   */
  async checkNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 33) return true; // Android 12 and below don't need this

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      logger.info(`📱 Notification permission check: ${granted}`);
      return granted;
    } catch (error) {
      logger.error('❌ Error checking notification permission:', error);
      return false;
    }
  }

  /**
   * Request POST_NOTIFICATIONS permission (Android 13+)
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 33) return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message:
            'This app needs notification permission to show alarms and reminders. Please grant this permission for alarms to work correctly.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      logger.info(`📱 Notification permission request result: ${isGranted}`);
      return isGranted;
    } catch (error) {
      logger.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Request all required permissions
   * Shows alerts if permissions are missing
   */
  async requestAllPermissions(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();

    if (permissions.allGranted) {
      logger.info('✅ All alarm permissions already granted');
      return true;
    }

    // Request notification permission first (can be requested directly)
    if (!permissions.notifications) {
      await this.requestNotificationPermission();
    }

    // Request exact alarm permission (opens settings)
    if (!permissions.exactAlarm) {
      await this.requestExactAlarmPermission();
    }

    // Re-check after requests
    const finalCheck = await this.checkAllPermissions();
    return finalCheck.allGranted;
  }

  /**
   * Check if app is excluded from battery optimization
   */
  async checkBatteryOptimization(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const { AlarmModule } = require('react-native').NativeModules;
      if (AlarmModule && typeof AlarmModule.isIgnoringBatteryOptimizations === 'function') {
        const isIgnoring = await AlarmModule.isIgnoringBatteryOptimizations();
        logger.info(`📱 Battery optimization check: ${isIgnoring ? 'ignored (good)' : 'not ignored (may cause issues)'}`);
        return isIgnoring;
      }

      // Fallback: Assume not optimized if method doesn't exist
      logger.warn('⚠️ Cannot check battery optimization - native method not available');
      return true;
    } catch (error) {
      logger.error('❌ Error checking battery optimization:', error);
      return false;
    }
  }

  /**
   * Request battery optimization exemption
   * Shows alert with instructions
   */
  async requestBatteryOptimizationExemption(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const { AlarmModule } = require('react-native').NativeModules;
      if (AlarmModule && typeof AlarmModule.requestIgnoreBatteryOptimizations === 'function') {
        await AlarmModule.requestIgnoreBatteryOptimizations();
        logger.info('📱 Opened battery optimization settings');
        return true;
      }

      // Fallback: Show alert with instructions
      Alert.alert(
        'Battery Optimization',
        'For alarms to work reliably when the app is in the background, please disable battery optimization for this app.\n\nThis is especially important on Samsung, Xiaomi, and Huawei devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // Try to open battery optimization settings
              Linking.openSettings().catch(() => {
                Alert.alert(
                  'Manual Steps',
                  'Please go to: Settings > Apps > ManageTime > Battery > Unrestricted'
                );
              });
            },
          },
        ]
      );
      return false;
    } catch (error) {
      logger.error('❌ Error requesting battery optimization exemption:', error);
      return false;
    }
  }

  /**
   * Show comprehensive permission setup dialog
   * Called on first launch or when permissions are missing
   */
  async showPermissionSetupDialog(): Promise<void> {
    const permissions = await this.checkAllPermissions();
    const batteryOptimized = await this.checkBatteryOptimization();

    if (permissions.allGranted && batteryOptimized) {
      logger.info('✅ All permissions and battery settings are correct');
      return;
    }

    const missingItems: string[] = [];
    if (!permissions.exactAlarm) {
      missingItems.push('• Schedule Exact Alarms permission');
    }
    if (!permissions.notifications) {
      missingItems.push('• Notification permission');
    }
    if (!batteryOptimized) {
      missingItems.push('• Battery optimization exemption');
    }

    Alert.alert(
      'Alarm Permissions Required',
      `For alarms to work correctly, please grant the following:\n\n${missingItems.join('\n')}\n\nWould you like to open settings now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: async () => {
            await this.requestAllPermissions();
            if (!batteryOptimized) {
              await this.requestBatteryOptimizationExemption();
            }
          },
        },
      ]
    );
  }
}

export const alarmPermissionService = new AlarmPermissionService();

