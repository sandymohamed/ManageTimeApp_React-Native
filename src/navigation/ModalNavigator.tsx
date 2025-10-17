import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '@/utils/theme';

// Import modal screens
import { TaskCreateScreen } from '@/screens/tasks/TaskCreateScreen';
import { TaskEditScreen } from '@/screens/tasks/TaskEditScreen';
import { TaskDetailScreen } from '@/screens/tasks/TaskDetailScreen';
import { ProjectCreateScreen } from '@/screens/projects/ProjectCreateScreen';
import { ProjectDetailScreen } from '@/screens/projects/ProjectDetailScreen';
import { ProjectEditScreen } from '@/screens/projects/ProjectEditScreen';
import { ProjectInviteScreen } from '@/screens/projects/ProjectInviteScreen';
import { MilestoneCreateScreen } from '@/screens/projects/MilestoneCreateScreen';
import { GoalCreateScreen } from '@/screens/goals/GoalCreateScreen';
import { GoalEditScreen } from '@/screens/goals/GoalEditScreen';
import { GoalDetailScreen } from '@/screens/goals/GoalDetailScreen';
import { GoalAnalyticsScreen } from '@/screens/goals/GoalAnalyticsScreen';
import { MilestoneManagementScreen } from '@/screens/goals/MilestoneManagementScreen';
import { AlarmCreateScreen } from '@/screens/alarms/AlarmCreateScreen';
import { AlarmEditScreen } from '@/screens/alarms/AlarmEditScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

export type ModalStackParamList = {
  TaskCreate: { projectId?: string; goalId?: string };
  TaskEdit: { taskId: string };
  TaskDetail: { taskId: string };
  ProjectCreate: undefined;
  ProjectDetail: { projectId: string };
  ProjectEdit: { projectId: string };
  ProjectInvite: { projectId: string };
  MilestoneCreate: { projectId: string };
  GoalCreate: undefined;
  GoalEdit: { goalId: string };
  GoalDetail: { goalId: string };
  GoalAnalytics: { goalId: string };
  MilestoneManagement: { goalId: string };
  AlarmCreate: undefined;
  AlarmEdit: { alarmId: string };
  Settings: undefined;
};

const Stack = createStackNavigator<ModalStackParamList>();

export const ModalNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        cardStyle: { backgroundColor: theme.colors.background },
      }}>
      {/* Task Screens */}
      <Stack.Screen
        name="TaskCreate"
        component={TaskCreateScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="TaskEdit"
        component={TaskEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Project Screens */}
      <Stack.Screen
        name="ProjectCreate"
        component={ProjectCreateScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProjectEdit"
        component={ProjectEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="ProjectInvite"
        component={ProjectInviteScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="MilestoneCreate"
        component={MilestoneCreateScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />

      {/* Goal Screens */}
      <Stack.Screen
        name="GoalCreate"
        component={GoalCreateScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="GoalEdit"
        component={GoalEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="GoalDetail"
        component={GoalDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GoalAnalytics"
        component={GoalAnalyticsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MilestoneManagement"
        component={MilestoneManagementScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Alarm Screens */}
      <Stack.Screen
        name="AlarmCreate"
        component={AlarmCreateScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="AlarmEdit"
        component={AlarmEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />

      {/* Settings Screen */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};
