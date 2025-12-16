/**
 * Global Alarm Engine
 * 
 * Runs alarm checking at app level, not screen level.
 * This ensures alarms ring regardless of which screen the user is viewing.
 * 
 * Architecture:
 * - AlarmsScreen registers its check function when mounted
 * - App.tsx starts/stops the engine based on app state
 * - Engine runs independently of screen navigation
 */

let alarmCheckInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let registeredCheckFunction: (() => void) | null = null;

export type AlarmCheckFunction = () => void;

/**
 * Register the alarm check function
 * This should be called by AlarmsScreen when it mounts
 * @param checkFn - Function to call every second to check for alarms
 */
export function registerAlarmCheckFunction(checkFn: AlarmCheckFunction): void {
  registeredCheckFunction = checkFn;
  console.log('📝 Alarm check function registered');
  
  // If engine is already running, it will use the new function on next interval
  // No need to restart if already running
}

/**
 * Unregister the alarm check function
 * This should be called by AlarmsScreen when it unmounts (optional, for cleanup)
 */
export function unregisterAlarmCheckFunction(): void {
  registeredCheckFunction = null;
  console.log('📝 Alarm check function unregistered');
}

/**
 * Start the global alarm checking engine
 * This should be called from App.tsx when app is active
 */
export function startAlarmEngine(): void {
  if (isRunning) {
    console.log('⚠️ Alarm engine already running');
    return;
  }

  if (!registeredCheckFunction) {
    console.log('⚠️ Cannot start alarm engine: no check function registered');
    return;
  }

  console.log('🚀 Starting global alarm engine');
  
  // Clear any existing interval (safety check)
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
  }

  // Start checking alarms every second
  alarmCheckInterval = setInterval(() => {
    try {
      if (registeredCheckFunction) {
        registeredCheckFunction();
      }
    } catch (error) {
      console.error('❌ Error in alarm check function:', error);
    }
  }, 1000);

  isRunning = true;
  console.log('✅ Global alarm engine started');
}

/**
 * Stop the global alarm checking engine
 * This should be called from App.tsx when app goes to background or closes
 */
export function stopAlarmEngine(): void {
  if (!isRunning) {
    return;
  }

  console.log('🛑 Stopping global alarm engine');
  
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
  }

  isRunning = false;
  console.log('✅ Global alarm engine stopped');
}

/**
 * Check if the alarm engine is currently running
 */
export function isAlarmEngineRunning(): boolean {
  return isRunning;
}
