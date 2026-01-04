# Task Creation and Alarm Flow - Complete Documentation

This document provides a comprehensive guide to how tasks are created and how alarms are automatically generated and scheduled for them.

---

## Table of Contents

1. [Task Creation Flow](#task-creation-flow)
2. [Backend Alarm Creation](#backend-alarm-creation)
3. [Frontend Alarm Fetching](#frontend-alarm-fetching)
4. [Alarm Scheduling](#alarm-scheduling)
5. [How Alarms Work](#how-alarms-work)
6. [Troubleshooting](#troubleshooting)

---

## 1. Task Creation Flow

### 1.1 Frontend: User Creates Task

**Location:** `ManageTimeApp_React-Native/src/store/taskStore.ts`

When a user creates a task through the UI:

```typescript
// Line 214-262: createTask function
createTask: async (data: CreateTaskData) => {
  try {
    set({ isLoading: true, error: null });

    // Step 1: Filter out undefined values (but always include description)
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        if (key === 'description') return true;
        return value !== undefined;
      })
    ) as CreateTaskData;

    // Step 2: Ensure description is always a string
    filteredData.description = filteredData.description ?? '';

    // Step 3: Send task creation request to backend
    const task = await taskService.createTask(filteredData);
    // ↑ This calls: POST /api/v1/tasks

    // Step 4: Update local state with new task
    set((state) => ({
      tasks: [task, ...state.tasks],
      isLoading: false,
    }));

    // Step 5: Apply current filters
    get().applyFilters();

    // Step 6: Refresh alarms if task has dueDate
    // This ensures newly created alarms from backend are fetched
    if (task.dueDate) {
      try {
        // Import alarm store dynamically to avoid circular dependency
        const { useAlarmStore } = await import('./alarmStore');
        
        // Wait 1 second for backend to process alarm creation
        setTimeout(() => {
          // Fetch with high limit (1000) and enabled=true to get all enabled alarms
          useAlarmStore.getState().fetchAlarms(1, 1000, true).catch(err => {
            logger.warn('Failed to refresh alarms after task creation:', err);
            // Don't throw - this is a background operation
          });
        }, 1000);
      } catch (error) {
        logger.warn('Failed to refresh alarms after task creation:', error);
        // Don't throw - alarm refresh failure shouldn't break task creation
      }
    }
  } catch (error: any) {
    logger.error('Create task error:', error);
    set({
      error: error.message || 'Failed to create task',
      isLoading: false,
    });
    throw error;
  }
}
```

**Key Points:**
- Task data is filtered and validated before sending
- Description is always included (even if empty string)
- After successful creation, alarms are automatically refreshed
- 1-second delay allows backend time to create the alarm
- Alarm refresh is non-blocking (won't break task creation if it fails)

### 1.2 Frontend: API Call

**Location:** `ManageTimeApp_React-Native/src/services/taskService.ts`

```typescript
// Line 49-62: createTask method
async createTask(data: CreateTaskData): Promise<Task> {
  try {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    // ↑ Makes HTTP POST request to backend

    if (!response.success) {
      throw new Error(response.error || 'Failed to create task');
    }

    return response.data; // Returns the created task
  } catch (error) {
    logger.error('Create task error:', error);
    throw error;
  }
}
```

**Key Points:**
- Uses `apiClient` which handles authentication, error handling, and token refresh
- Returns the complete task object from backend
- Includes all task relationships (creator, assignee, project, goal, milestone)

### 1.3 Backend: Task Creation Endpoint

**Location:** `clean_repo/src/routes/task.ts`

```typescript
// Line 266-391: POST /api/v1/tasks
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Step 1: Validate request data
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }

    const userId = req.user!.id;
    const prisma = getPrismaClient();

    // Step 2: Check project access if projectId is provided
    if (value.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: value.projectId,
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      });

      if (!project) {
        throw new AuthorizationError('You do not have access to this project');
      }
    }

    // Step 3: Check goal access if goalId is provided
    if (value.goalId) {
      const goal = await prisma.goal.findFirst({
        where: {
          id: value.goalId,
          userId,
        },
      });

      if (!goal) {
        throw new AuthorizationError('You do not have access to this goal');
      }
    }

    // Step 4: Get the next order value for this user's tasks
    const lastTask = await prisma.task.findFirst({
      where: {
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          { project: { members: { some: { userId } } } },
        ],
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (lastTask?.order || 0) + 1;

    // Step 5: Create the task in database
    const task = await prisma.task.create({
      data: {
        ...value,
        creatorId: userId,
        order: nextOrder,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
        goal: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
      },
    });

    // Step 6: Schedule notifications and alarms if task has dueDate
    const notificationScheduler = await import('../services/notificationScheduler');

    if (task.dueDate) {
      const taskUserId = task.assigneeId || task.creatorId;
      const dueTime = value.dueTime || task.dueTime || null;
      
      logger.info('Scheduling task notifications', { 
        taskId: task.id, 
        userId: taskUserId, 
        dueDate: task.dueDate, 
        dueTime 
      });
      
      // This is where alarms are created!
      notificationScheduler.scheduleTaskDueDateNotifications(
        task.id, 
        taskUserId, 
        task.dueDate, 
        task.title, 
        dueTime
      ).catch(err => logger.error('Failed to schedule task notifications:', err));
    }

    // Step 7: Send other notifications (task created, assignment, etc.)
    // ... (not relevant to alarm creation)

    // Step 8: Return created task
    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (error) {
    logger.error('Failed to create task:', error);
    throw error;
  }
});
```

**Key Points:**
- Validates user permissions for project/goal
- Calculates order for task sorting
- Creates task in database with all relationships
- **If task has `dueDate`, automatically calls `scheduleTaskDueDateNotifications`**
- This happens asynchronously (doesn't block task creation response)

---

## 2. Backend Alarm Creation

### 2.1 Notification Scheduler Function

**Location:** `clean_repo/src/services/notificationScheduler.ts`

This is the **core function** that creates alarms for tasks:

```typescript
// Line 33-236: scheduleTaskDueDateNotifications
export async function scheduleTaskDueDateNotifications(
  taskId: string,
  userId: string,
  dueDate: Date,
  taskTitle: string,
  dueTime?: string | null
): Promise<void> {
  try {
    logger.info('scheduleTaskDueDateNotifications called', { taskId, userId, dueDate, dueTime });
    const prisma = getPrismaClient();
    
    // Step 1: Delete existing reminders for this task (avoid duplicates)
    await executeWithRetry(async () => {
      return await prisma.reminder.deleteMany({
        where: {
          targetType: 'TASK',
          targetId: taskId,
          userId,
        },
      });
    });
    
    // Step 2: Delete existing alarms for this task (avoid duplicates)
    await executeWithRetry(async () => {
      return await prisma.alarm.deleteMany({
        where: {
          userId,
          linkedTaskId: taskId,
        },
      });
    }).catch(err => {
      logger.warn(`Failed to delete existing alarms for task ${taskId}, continuing anyway:`, err);
    });

    // Step 3: Calculate due date/time
    const now = new Date();
    const dueDateTime = new Date(dueDate);
    
    if (dueTime) {
      // If dueTime is provided, combine it with dueDate
      const [hours, minutes] = dueTime.split(':').map(Number);
      dueDateTime.setHours(hours, minutes, 0, 0);
      logger.info('Combined due date with time', { dueDateTime: dueDateTime.toISOString() });
    } else {
      // If no time specified, use end of day (23:59)
      dueDateTime.setHours(23, 59, 0, 0);
      logger.info('No due time specified, using end of day', { dueDateTime: dueDateTime.toISOString() });
    }
    
    // Step 4: Only schedule if due date is in the future
    if (dueDateTime <= now) {
      logger.warn(`Task ${taskId} due date is in the past, skipping notification scheduling`);
      return;
    }

    // Step 5: Calculate reminder times
    const oneDayBefore = new Date(dueDateTime);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    
    const oneHourBefore = new Date(dueDateTime);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    // Step 6: Create reminders (1 day before, 1 hour before, at due time)
    const reminders = [];

    // 1 day before reminder
    if (oneDayBefore > now && oneDayBefore < dueDateTime) {
      const reminder1 = await executeWithRetry(async () => {
        return await prisma.reminder.create({
          data: {
            userId,
            targetType: 'TASK',
            targetId: taskId,
            title: `Task Due Tomorrow: ${taskTitle}`,
            note: `Your task "${taskTitle}" is due tomorrow.`,
            triggerType: 'TIME',
            schedule: { at: oneDayBefore.toISOString() },
          },
        });
      });
      reminders.push({ reminder: reminder1, time: oneDayBefore, type: 'DUE_DATE_REMINDER' });
    }

    // 1 hour before reminder
    if (oneHourBefore > now && oneHourBefore < dueDateTime) {
      const reminder2 = await executeWithRetry(async () => {
        return await prisma.reminder.create({
          data: {
            userId,
            targetType: 'TASK',
            targetId: taskId,
            title: `Task Due in 1 Hour: ${taskTitle}`,
            note: `Your task "${taskTitle}" is due in 1 hour.`,
            triggerType: 'TIME',
            schedule: { at: oneHourBefore.toISOString() },
          },
        });
      });
      reminders.push({ reminder: reminder2, time: oneHourBefore, type: 'DUE_DATE_REMINDER' });
    }

    // Step 7: Create "at due time" reminder AND alarm
    try {
      const reminder3 = await executeWithRetry(async () => {
        return await prisma.reminder.create({
          data: {
            userId,
            targetType: 'TASK',
            targetId: taskId,
            title: `Task Due: ${taskTitle}`,
            note: `Your task "${taskTitle}" is due now.`,
            triggerType: 'TIME',
            schedule: { at: dueDateTime.toISOString() },
          },
        });
      });
      reminders.push({ reminder: reminder3, time: dueDateTime, type: 'DUE_DATE_REMINDER' });
      
      // ⭐ THIS IS WHERE THE ALARM IS CREATED ⭐
      try {
        // Delete existing alarms for this task to avoid duplicates
        await executeWithRetry(async () => {
          return await prisma.alarm.deleteMany({
            where: {
              userId,
              linkedTaskId: taskId,
            },
          });
        });
        
        // Get user timezone (default to UTC if not available)
        const user = await executeWithRetry(async () => {
          return await prisma.user.findUnique({
            where: { id: userId },
            select: { timezone: true },
          });
        }).catch(() => null);
        const userTimezone = user?.timezone || 'UTC';
        
        // Create alarm record in database
        await executeWithRetry(async () => {
          return await prisma.alarm.create({
            data: {
              userId,
              title: `Task Due: ${taskTitle}`,  // Alarm title
              time: dueDateTime,                 // When alarm should fire
              timezone: userTimezone,            // User's timezone
              linkedTaskId: taskId,              // Link to task
              enabled: true,                     // Alarm is enabled by default
              recurrenceRule: null,              // Tasks are one-time (no recurrence)
            },
          });
        });
        logger.info(`Created alarm record for task ${taskId} at ${dueDateTime.toISOString()}`);
      } catch (alarmError) {
        logger.error(`Failed to create alarm record for task ${taskId}:`, alarmError);
        // Don't fail the whole operation if alarm creation fails
      }
    } catch (error) {
      logger.error(`Failed to create due-time reminder for task ${taskId}:`, error);
    }

    // Step 8: Schedule all reminders (for push notifications)
    logger.info(`Scheduling ${reminders.length} reminders for task ${taskId}`);
    for (const { reminder, time, type } of reminders) {
      try {
        await scheduleReminder(reminder.id, userId, time, type);
        logger.info(`Successfully scheduled task reminder for ${taskId} at ${time.toISOString()}`);
      } catch (error: any) {
        logger.error(`Failed to schedule reminder for task ${taskId}:`, error);
        // Clean up reminder if scheduling failed
        await executeWithRetry(async () => {
          return await prisma.reminder.delete({ where: { id: reminder.id } });
        }).catch(() => {});
      }
    }
  } catch (error) {
    logger.error(`Failed to schedule task due date notifications for ${taskId}:`, error);
    // Don't throw - this shouldn't break task creation
  }
}
```

**Key Points:**
- **Deletes existing alarms/reminders** for the task first (prevents duplicates)
- **Calculates due date/time**: Uses `dueTime` if provided, otherwise 23:59
- **Only creates if due date is in the future**
- **Creates 3 reminders**: 1 day before, 1 hour before, at due time
- **Creates 1 alarm**: At due time (for native device scheduling)
- **Alarm properties**:
  - `title`: "Task Due: {taskTitle}"
  - `time`: Calculated due date/time
  - `timezone`: User's timezone
  - `linkedTaskId`: Links alarm to task
  - `enabled`: true (by default)
  - `recurrenceRule`: null (one-time only)

---

## 3. Frontend Alarm Fetching

### 3.1 Automatic Refresh After Task Creation

**Location:** `ManageTimeApp_React-Native/src/store/taskStore.ts`

After a task is created with a `dueDate`, the frontend automatically refreshes alarms:

```typescript
// Line 244-262: Alarm refresh after task creation
if (task.dueDate) {
  try {
    // Import alarm store dynamically to avoid circular dependency
    const { useAlarmStore } = await import('./alarmStore');
    
    // Wait 1 second for backend to process alarm creation
    setTimeout(() => {
      // Fetch with high limit (1000) and enabled=true to get all enabled alarms
      useAlarmStore.getState().fetchAlarms(1, 1000, true).catch(err => {
        logger.warn('Failed to refresh alarms after task creation:', err);
      });
    }, 1000); // 1 second delay
  } catch (error) {
    logger.warn('Failed to refresh alarms after task creation:', error);
  }
}
```

**Key Points:**
- **1-second delay**: Gives backend time to create the alarm
- **High limit (1000)**: Ensures all alarms are fetched, not just first 20
- **enabled=true**: Only fetches enabled alarms
- **Non-blocking**: Won't break task creation if alarm fetch fails

### 3.2 Fetch Alarms Function

**Location:** `ManageTimeApp_React-Native/src/store/alarmStore.ts`

This is the main function that fetches alarms from the backend:

```typescript
// Line 77-264: fetchAlarms function
fetchAlarms: async (page = 1, limit = 20, enabled, retryCount = 0) => {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  try {
    set({ loading: true, error: null });
    
    // Step 1: Fetch alarms from backend API
    const response = await alarmService.getAlarms(page, limit, enabled);
    // ↑ Makes GET request to /api/v1/alarms?page=1&limit=1000&enabled=true
    
    // Step 2: Merge backend data with local state
    // This preserves:
    // - Locally-disabled alarms (prevent re-enabling if backend update failed)
    // - Locally-created snooze alarms (they don't exist in backend)
    const currentState = get();
    
    // Preserve all locally-created snooze alarms
    const localSnoozeAlarms = currentState.alarms.filter(a => 
      a.id.includes('_snooze_') || a.id.endsWith('_snooze')
    );
    
    // Merge backend alarms with local state
    const mergedAlarms = response.data.map(backendAlarm => {
      const localAlarm = currentState.alarms.find(a => a.id === backendAlarm.id);
      
      // If alarm exists locally and was locally disabled, preserve that state
      if (localAlarm && localAlarm.enabled === false && backendAlarm.enabled === true) {
        return { ...backendAlarm, enabled: false };
      }
      
      return backendAlarm;
    });
    
    // Add back only ACTIVE (enabled, future time) local snooze alarms
    const now = Date.now();
    const activeSnoozeAlarms = localSnoozeAlarms.filter(snoozeAlarm => {
      if (!snoozeAlarm.enabled) return false;
      const snoozeTime = new Date(snoozeAlarm.time).getTime();
      return snoozeTime > now + 30000; // More than 30 seconds in future
    });
    
    const allAlarms = [...mergedAlarms, ...activeSnoozeAlarms];
    
    // Step 3: Update state with merged alarms
    set({
      alarms: allAlarms,
      pagination: response.pagination,
      loading: false,
    });

    // Step 4: Cancel alarms that are no longer enabled or deleted
    const currentAlarmIds = new Set(allAlarms.map(a => a.id));
    const alarmsToCancel: string[] = [];
    
    for (const alarm of currentState.alarms) {
      const newAlarm = allAlarms.find(a => a.id === alarm.id);
      if (!currentAlarmIds.has(alarm.id) || (newAlarm && !newAlarm.enabled)) {
        alarmsToCancel.push(alarm.id);
      }
    }
    
    // Cancel orphaned/disabled alarms
    await Promise.allSettled(
      alarmsToCancel.map(async (alarmId) => {
        try {
          await reliableAlarmService.cancelAlarm(alarmId);
        } catch (error) {
          console.warn(`Failed to cancel alarm ${alarmId}:`, error);
        }
      })
    );

    // Step 5: Filter alarms that should be scheduled
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    let stoppedAlarmsSet = new Set<string>();
    
    // Check AsyncStorage for stopped alarms
    try {
      const stoppedAlarms = await AsyncStorage.getItem('stopped_alarms');
      if (stoppedAlarms) {
        stoppedAlarmsSet = new Set(JSON.parse(stoppedAlarms));
      }
    } catch (error) {
      console.warn('Failed to read stopped alarms from AsyncStorage:', error);
    }
    
    // Filter enabled alarms that should be scheduled
    const enabledAlarms = allAlarms.filter(a => {
      if (!a.enabled) return false;
      
      // Skip alarms marked as stopped
      if (stoppedAlarmsSet.has(a.id)) {
        return false;
      }
      
      // Skip recently stopped alarms
      const wasRecentlyStopped = currentState.alarms.find(localAlarm => {
        if (localAlarm.id === a.id) {
          return localAlarm.enabled === false && a.enabled === true;
        }
        return false;
      });
      if (wasRecentlyStopped) return false;
      
      // For one-time alarms, only schedule if time is in the future
      const isOneTime = !a.recurrenceRule || a.recurrenceRule === 'none';
      if (isOneTime) {
        const alarmTime = new Date(a.time).getTime();
        const isSnoozeAlarm = a.id.includes('_snooze_') || a.id.endsWith('_snooze');
        const buffer = isSnoozeAlarm ? 10000 : 30000; // 10s for snooze, 30s for regular
        const isFuture = alarmTime > now + buffer;
        if (!isFuture) return false;
      }
      
      return true;
    });
    
    // Step 6: Schedule all enabled alarms natively
    console.log(`📅 Scheduling ${enabledAlarms.length} enabled alarms natively...`);
    for (const alarm of enabledAlarms) {
      try {
        // Always cancel first to prevent duplicate scheduling
        await reliableAlarmService.cancelAlarm(alarm.id).catch(() => {});
        
        // Schedule the alarm
        await reliableAlarmService.scheduleAlarm(alarm);
        console.log(`✅ Successfully scheduled: ${alarm.title}`);
      } catch (error) {
        console.error(`❌ Failed to schedule native alarm ${alarm.id}:`, error);
      }
    }
  } catch (error) {
    // Retry logic for network errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alarms';
    const isNetworkError = errorMessage.includes('Network connection failed') || 
                          errorMessage.includes('Network Error') ||
                          (error as any)?.code === 'NETWORK_ERROR';
    
    if (isNetworkError && retryCount < maxRetries) {
      logger.warn(`Network error fetching alarms, retrying... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
      return get().fetchAlarms(page, limit, enabled, retryCount + 1);
    }
    
    set({
      error: errorMessage,
      loading: false,
    });
    
    logger.error('Failed to fetch alarms after retries:', error);
  }
}
```

**Key Points:**
- **Fetches alarms from backend** via API call
- **Merges with local state** to preserve snooze alarms and local changes
- **Cancels orphaned alarms** (deleted or disabled)
- **Filters alarms** to schedule only:
  - Enabled alarms
  - Not marked as stopped
  - Future alarms (for one-time alarms)
- **Schedules natively** using `ReliableAlarmService`
- **Retry logic**: Up to 3 retries for network errors with exponential backoff

---

## 4. Alarm Scheduling

### 4.1 Reliable Alarm Service

**Location:** `ManageTimeApp_React-Native/src/services/ReliableAlarmService.ts`

This service schedules alarms using native Android AlarmManager:

```typescript
// Line 24-48: scheduleAlarm method
async scheduleAlarm(alarm: Alarm): Promise<string> {
  const alarmId = alarm.id;
  
  logger.info(`📅 Scheduling native alarm "${alarm.title}"`);

  try {
    // Use native alarm bridge - schedules via Android AlarmManager
    await nativeAlarmBridge.scheduleAlarm(alarm);
    // ↑ This calls native Android code to schedule the alarm

    // Store alarm info for reference (optional, for UI purposes)
    await AsyncStorage.setItem(`alarm_${alarmId}`, JSON.stringify({
      id: alarmId,
      title: alarm.title,
      time: alarm.time,
      recurrenceRule: alarm.recurrenceRule,
      scheduledAt: Date.now(),
    }));

    logger.info('✅ Native alarm scheduled successfully');
    return alarmId;
  } catch (error) {
    logger.error('❌ Failed to schedule native alarm:', error);
    throw error;
  }
}
```

**Key Points:**
- Uses **native Android AlarmManager** for reliable scheduling
- Works even when app is closed or device is rebooted
- Stores alarm info in AsyncStorage for reference
- Returns alarm ID on success

### 4.2 Native Alarm Bridge

**Location:** `ManageTimeApp_React-Native/src/services/NativeAlarmBridge.ts`

This is the bridge between React Native and native Android code:

```typescript
// The nativeAlarmBridge.scheduleAlarm() method:
// - Calls native Android AlarmManager API
// - Schedules alarm with exact time
// - Sets up notification to show when alarm fires
// - Handles alarm firing even when app is closed
```

**Key Points:**
- **Native implementation**: Uses Android's AlarmManager
- **Reliable**: Works even when app is closed
- **Persistent**: Survives device reboots (if using RTC_WAKEUP)
- **Notification**: Shows notification when alarm fires

---

## 5. How Alarms Work

### 5.1 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CREATES TASK                                            │
│    - User fills form with title, dueDate, dueTime               │
│    - Clicks "Save"                                               │
└────────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: taskStore.createTask()                              │
│    - Validates and filters data                                  │
│    - Calls taskService.createTask()                              │
│    - Updates local state                                         │
│    - Schedules alarm refresh (1 second delay)                    │
└────────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. API CALL: POST /api/v1/tasks                                  │
│    - Sends task data to backend                                 │
│    - Includes authentication token                               │
└────────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKEND: routes/task.ts POST handler                         │
│    - Validates request                                           │
│    - Checks permissions (project/goal access)                   │
│    - Calculates order                                            │
│    - Creates task in database                                    │
│    - If dueDate exists: calls scheduleTaskDueDateNotifications()│
│    - Returns created task                                        │
└────────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND: notificationScheduler.scheduleTaskDueDateNotifications()│
│    - Deletes existing alarms/reminders for task                 │
│    - Calculates due date/time                                   │
│    - Creates 3 reminders (1 day, 1 hour, at due time)          │
│    - Creates 1 alarm record in database:                        │
│      * title: "Task Due: {taskTitle}"                           │
│      * time: calculated dueDateTime                             │
│      * linkedTaskId: taskId                                     │
│      * enabled: true                                            │
│      * recurrenceRule: null (one-time)                          │
│    - Schedules reminders (for push notifications)               │
└────────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND: Alarm Refresh (after 1 second delay)               │
│    - taskStore calls useAlarmStore.fetchAlarms()              │
│    - Fetches alarms from backend: GET /api/v1/alarms            │
│    - Merges with local state (preserves snooze alarms)          │
│    - Cancels orphaned/disabled alarms                           │
│    - Filters alarms to schedule                                 │
│    - Calls ReliableAlarmService.scheduleAlarm() for each         │
└────────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. NATIVE SCHEDULING: ReliableAlarmService.scheduleAlarm()      │
│    - Calls nativeAlarmBridge.scheduleAlarm()                    │
│    - Native Android code schedules via AlarmManager             │
│    - Stores alarm info in AsyncStorage                          │
└────────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. ALARM FIRES (at scheduled time)                              │
│    - Android AlarmManager triggers alarm                        │
│    - Native code shows notification                              │
│    - User can stop/snooze alarm                                 │
│    - Alarm plays sound/vibration                                │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Alarm Lifecycle

1. **Creation**: Alarm is created in database when task with dueDate is created
2. **Fetching**: Frontend fetches alarm from backend after task creation
3. **Scheduling**: Alarm is scheduled natively using Android AlarmManager
4. **Firing**: Alarm fires at scheduled time (even if app is closed)
5. **User Interaction**: User can stop, snooze, or dismiss alarm
6. **Cleanup**: Alarm is cancelled if task is deleted or alarm is disabled

### 5.3 Alarm Properties

When an alarm is created for a task, it has these properties:

```typescript
{
  id: string,                    // Unique alarm ID (from database)
  userId: string,                 // User who owns the alarm
  title: "Task Due: {taskTitle}", // Alarm title
  time: Date,                    // When alarm should fire (due date/time)
  timezone: string,              // User's timezone
  linkedTaskId: string,          // ID of the task this alarm is for
  enabled: true,               // Alarm is enabled by default
  recurrenceRule: null,         // One-time alarm (no recurrence)
  createdAt: Date,              // When alarm was created
  updatedAt: Date,              // Last update time
}
```

### 5.4 Important Behaviors

1. **One Alarm Per Task**: Only one alarm is created per task (at due time)
2. **Multiple Reminders**: Three reminders are created (1 day, 1 hour, at due time) for push notifications
3. **Automatic Cleanup**: Existing alarms are deleted before creating new ones (prevents duplicates)
4. **Future Only**: Alarms are only created if due date is in the future
5. **Timezone Aware**: Alarms use user's timezone
6. **Native Scheduling**: Uses Android AlarmManager for reliability
7. **Survives App Close**: Alarms work even when app is closed
8. **Retry Logic**: Network errors are retried up to 3 times

---

## 6. Troubleshooting

### 6.1 Alarm Not Appearing After Task Creation

**Possible Causes:**
1. **Network Error**: Backend failed to create alarm
   - **Check**: Backend logs for errors
   - **Solution**: Retry logic should handle this (up to 3 retries)

2. **Timing Issue**: Frontend fetched alarms before backend created them
   - **Check**: 1-second delay should be enough
   - **Solution**: Increase delay if needed (change `1000` to `2000` in taskStore.ts)

3. **Pagination Issue**: Alarm not in first page
   - **Check**: Using `fetchAlarms(1, 1000, true)` should fetch all alarms
   - **Solution**: Already fixed - using limit of 1000

4. **Alarm Disabled**: Alarm was created but disabled
   - **Check**: Verify `enabled: true` in database
   - **Solution**: Check backend alarm creation code

5. **Past Due Date**: Task due date is in the past
   - **Check**: Backend skips alarm creation for past dates
   - **Solution**: Use future due date

### 6.2 Alarm Not Firing

**Possible Causes:**
1. **Not Scheduled**: Alarm wasn't scheduled natively
   - **Check**: Check logs for "Successfully scheduled" message
   - **Solution**: Verify `ReliableAlarmService.scheduleAlarm()` is called

2. **Device Doze Mode**: Android doze mode preventing alarm
   - **Check**: Device battery optimization settings
   - **Solution**: Exclude app from battery optimization

3. **Alarm Cancelled**: Alarm was cancelled before firing
   - **Check**: Check for "Cancelled alarm" logs
   - **Solution**: Verify alarm isn't being cancelled unintentionally

4. **Time Zone Issue**: Alarm scheduled in wrong timezone
   - **Check**: Verify user timezone in database
   - **Solution**: Ensure timezone is correct

### 6.3 Duplicate Alarms

**Possible Causes:**
1. **Multiple Calls**: `fetchAlarms()` called multiple times
   - **Check**: Check logs for multiple "Scheduling alarm" messages
   - **Solution**: `cancelAlarm()` is called before scheduling to prevent duplicates

2. **Backend Duplicates**: Multiple alarms created in database
   - **Check**: Database for duplicate `linkedTaskId` values
   - **Solution**: Backend should delete existing alarms before creating new ones

### 6.4 Debugging Steps

1. **Check Backend Logs**:
   ```
   - Look for "scheduleTaskDueDateNotifications called"
   - Look for "Created alarm record for task"
   - Check for any errors
   ```

2. **Check Frontend Logs**:
   ```
   - Look for "Failed to refresh alarms after task creation"
   - Look for "Scheduling X enabled alarms natively"
   - Look for "Successfully scheduled: Task Due: ..."
   ```

3. **Check Database**:
   ```sql
   SELECT * FROM Alarm WHERE linkedTaskId = 'your-task-id';
   ```

4. **Check AsyncStorage**:
   ```javascript
   const alarms = await AsyncStorage.getItem('alarm_*');
   console.log(alarms);
   ```

---

## Summary

**Task Creation → Alarm Creation Flow:**

1. User creates task with `dueDate` (and optionally `dueTime`)
2. Frontend sends task to backend via API
3. Backend creates task in database
4. Backend automatically creates alarm record in database (if `dueDate` exists)
5. Frontend waits 1 second, then fetches alarms from backend
6. Frontend schedules alarm natively using Android AlarmManager
7. Alarm fires at scheduled time (even if app is closed)

**Key Files:**
- **Frontend Task Store**: `ManageTimeApp_React-Native/src/store/taskStore.ts`
- **Frontend Alarm Store**: `ManageTimeApp_React-Native/src/store/alarmStore.ts`
- **Backend Task Route**: `clean_repo/src/routes/task.ts`
- **Backend Notification Scheduler**: `clean_repo/src/services/notificationScheduler.ts`
- **Alarm Service**: `ManageTimeApp_React-Native/src/services/ReliableAlarmService.ts`

**Key Points:**
- Alarms are created automatically by backend when task has `dueDate`
- Frontend automatically refreshes alarms after task creation (1 second delay)
- Alarms are scheduled natively using Android AlarmManager
- Network errors are handled with retry logic (up to 3 retries)
- Alarms work even when app is closed

