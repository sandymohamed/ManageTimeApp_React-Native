import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

import { theme } from '@/utils/theme';
import { EnhancedHeader } from '@/components/EnhancedHeader';
import { EnhancedTabBar } from '@/components/EnhancedTabBar';

// Import screens
import { TasksScreen } from '@/screens/tasks/TasksScreen';
import { TaskCreateScreen } from '@/screens/tasks/TaskCreateScreen';
import { TaskEditScreen } from '@/screens/tasks/TaskEditScreen';
import { TaskDetailScreen } from '@/screens/tasks/TaskDetailScreen';
import { GoalsScreen } from '@/screens/goals/GoalsScreen';
import { AlarmsScreen } from '@/screens/alarms/AlarmsScreen';
import { AnalyticsScreen } from '@/screens/analytics/AnalyticsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { ProjectsScreen } from '@/screens/projects/ProjectsScreen';
import { ProjectCreateScreen } from '@/screens/projects/ProjectCreateScreen';
import { ProjectDetailScreen } from '@/screens/projects/ProjectDetailScreen';
import { ProjectInviteScreen } from '@/screens/projects/ProjectInviteScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

export type MainTabParamList = {
  Tasks: undefined;
  Projects: undefined;
  Goals: undefined;
  Alarms: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  TaskCreate: undefined;
  TaskEdit: { taskId: string };
  TaskDetail: { taskId: string };
  ProjectCreate: undefined;
  ProjectDetail: { projectId: string };
  ProjectEdit: { projectId: string };
  ProjectInvite: { projectId: string };
  Settings: undefined;
};


const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();


const MainTabs: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <Tab.Navigator
      tabBar={(props) => <EnhancedTabBar {...props} />}
      screenOptions={({ route }) => ({
        header: ({ navigation, options }) => {
          // Get subtitle based on route name
          const getSubtitle = (routeName: string) => {
            switch (routeName) {
              case 'Tasks':
                return t('navigation.tasks');
              case 'Alarms':
                return t('navigation.alarms');
              default:
                return undefined;
            }
          };

          return (
            <EnhancedHeader
              title={options.title || route.name}
              subtitle={getSubtitle(route.name)}
              showLanguageSwitcher={true}
              showMenu={route.name === 'Profile'}
              onMenuPress={() => {
                // Handle profile menu actions
                console.log('Profile menu pressed');
              }}
            />
          );
        },
        headerShown: true,
      })}>


      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: t('navigation.myTasks'),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          title: t('navigation.projects'),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          title: t('navigation.goals'),
        }}
      />
      <Tab.Screen
        name="Alarms"
        component={AlarmsScreen}
        options={{
          title: t('navigation.alarmsReminders'),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: t('navigation.analytics'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile'),
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
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
        component={ProjectCreateScreen}
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
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
