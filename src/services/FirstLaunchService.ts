import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import { nativeAlarmBridge } from './NativeAlarmBridge';
import { alarmPermissionService } from './AlarmPermissionService';

const FIRST_LAUNCH_KEY = '@app_first_launch_completed';
const FIRST_LAUNCH_VERSION_KEY = '@app_first_launch_version';

/**
 * First Launch Service
 * 
 * Handles cleanup and setup tasks that should run only once after app installation:
 * 1. Cancel all legacy alarms from previous installation
 * 2. Check and request required permissions
 * 3. Guide user through battery optimization setup
 */
class FirstLaunchService {
  /**
   * Check if this is the first launch after installation/reinstall
   */
  async isFirstLaunch(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      const appVersion = require('../../package.json').version;
      const storedVersion = await AsyncStorage.getItem(FIRST_LAUNCH_VERSION_KEY);

      // First launch if:
      // 1. Never completed before, OR
      // 2. App version changed (update/reinstall)
      const isFirst = !completed || storedVersion !== appVersion;

      if (isFirst) {
        logger.info('🆕 First launch detected - will run cleanup and setup');
      }

      return isFirst;
    } catch (error) {
      logger.error('❌ Error checking first launch:', error);
      return false; // Don't run setup if check fails
    }
  }

  /**
   * Mark first launch as completed
   */
  async markFirstLaunchCompleted(): Promise<void> {
    try {
      const appVersion = require('../../package.json').version;
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
      await AsyncStorage.setItem(FIRST_LAUNCH_VERSION_KEY, appVersion);
      logger.info('✅ First launch marked as completed');
    } catch (error) {
      logger.error('❌ Error marking first launch as completed:', error);
    }
  }

  /**
   * Run first launch setup tasks
   * Should be called on app initialization if isFirstLaunch() returns true
   */
  async runFirstLaunchSetup(): Promise<void> {
    logger.info('🚀 Running first launch setup...');

    try {
      // 1. Cancel all legacy alarms from previous installation
      logger.info('🧹 Step 1: Cancelling all legacy alarms...');
      await nativeAlarmBridge.cancelAllAlarms();

      // 2. Check and request permissions
      logger.info('🔐 Step 2: Checking permissions...');
      const permissions = await alarmPermissionService.checkAllPermissions();
      const batteryOptimized = await alarmPermissionService.checkBatteryOptimization();

      if (!permissions.allGranted || !batteryOptimized) {
        logger.warn('⚠️ Some permissions missing - will show setup dialog');
        // Show setup dialog after a short delay (so app UI is ready)
        setTimeout(() => {
          alarmPermissionService.showPermissionSetupDialog();
        }, 2000);
      } else {
        logger.info('✅ All permissions already granted');
      }

      // 3. Mark as completed
      await this.markFirstLaunchCompleted();
      logger.info('✅ First launch setup completed');
    } catch (error) {
      logger.error('❌ Error during first launch setup:', error);
      // Mark as completed anyway to prevent retry loops
      await this.markFirstLaunchCompleted().catch(() => {});
    }
  }

  /**
   * Force reset first launch (for testing)
   */
  async resetFirstLaunch(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
      await AsyncStorage.removeItem(FIRST_LAUNCH_VERSION_KEY);
      logger.info('🔄 First launch reset');
    } catch (error) {
      logger.error('❌ Error resetting first launch:', error);
    }
  }
}

export const firstLaunchService = new FirstLaunchService();

