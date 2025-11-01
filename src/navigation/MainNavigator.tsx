// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
// } from 'react-native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useTranslation } from 'react-i18next';
// import { theme } from '@/utils/theme';
// import { EnhancedHeader } from '@/components/EnhancedHeader';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// // Import screens
// import { TasksScreen } from '@/screens/tasks/TasksScreen';
// import { GoalsScreen } from '@/screens/goals/GoalsScreen';
// import { AlarmsScreen } from '@/screens/alarms/AlarmsScreen';
// import { AnalyticsScreen } from '@/screens/analytics/AnalyticsScreen';
// import { ProfileScreen } from '@/screens/profile/ProfileScreen';
// import { ProjectsScreen } from '@/screens/projects/ProjectsScreen';
// import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
// import { RoutinesScreen } from '@/screens/routines/RoutinesScreen';
// import { CalendarScreen } from '@/screens/calendar/CalendarScreen';

// export type MainTabParamList = {
//   Dashboard: undefined;
//   Tasks: undefined;
//   Projects: undefined;
//   Analytics: undefined;
//   Profile: undefined;
//   Calendar: undefined;
//   Routines: undefined;
//   Alarms: undefined;
//   Goals: undefined;
// };

// export type RootStackParamList = {
//   MainTabs: undefined;
//   TaskCreate: { projectId?: string; goalId?: string };
//   TaskEdit: { taskId: string };
//   TaskDetail: { taskId: string };
//   ProjectCreate: undefined;
//   ProjectDetail: { projectId: string };
//   ProjectEdit: { projectId: string };
//   ProjectInvite: { projectId: string };
//   MilestoneCreate: { projectId: string };
//   GoalCreate: undefined;
//   GoalEdit: { goalId: string };
//   GoalDetail: { goalId: string };
//   GoalAnalytics: { goalId: string };
//   MilestoneManagement: { goalId: string };
//   AlarmCreate: undefined;
//   AlarmEdit: { alarmId: string };
//   InvitationAccept: { token: string };
//   PendingInvitations: undefined;
//   ProjectInvitations: undefined;
//   Settings: undefined;
// };

// const Tab = createBottomTabNavigator<MainTabParamList>();
// const Stack = createStackNavigator<RootStackParamList>();

// // Simple test component to isolate the issue
// const TestScreen: React.FC = () => {
//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
//       <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
//         Test Screen Working! 🎉
//       </Text>
//       <Text style={{ fontSize: 16, color: '#666', marginTop: 10 }}>
//         If you can see this, navigation is working.
//       </Text>
//     </View>
//   );
// };

// const MainTabs: React.FC = () => {
//   const { t } = useTranslation();

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }: { route: any }) => ({
//         tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
//           const getIconName = (routeName: string) => {
//             switch (routeName) {
//               case 'Dashboard': return 'view-dashboard';
//               case 'Tasks': return 'checkbox-marked-circle-outline';
//               case 'Calendar': return 'calendar';
//               case 'Routines': return 'repeat';
//               case 'Goals': return 'flag';
//               case 'Projects': return 'file-tree';
//               case 'Alarms': return 'alarm';
//               case 'Analytics': return 'chart-bar';
//               case 'Profile': return 'account';
//               default: return 'help-circle';
//             }
//           };

//           return (
//             <Icon
//               name={getIconName(route.name)}
//               size={size || 24}
//               color={color}
//             />
//           );
//         },
//         tabBarActiveTintColor: theme.colors.primary,
//         tabBarInactiveTintColor: theme.colors.textSecondary,
//         tabBarStyle: {
//           backgroundColor: '#FFFFFF',
//           borderTopColor: '#E5E5E5',
//           borderTopWidth: 1,
//           height: 70,
//           paddingBottom: 8,
//           paddingTop: 8,
//         },
//         tabBarLabelStyle: {
//           fontSize: 12,
//           fontWeight: '600',
//         },
//         header: ({ navigation, route, options }) => {
//           const getSubtitle = (routeName: string) => {
//             if (!t) return 'Loading...';
//             switch (routeName) {
//               case 'Dashboard':
//                 return t('navigation.dashboardSubtitle') || 'Overview and insights';
//               case 'Tasks':
//                 return t('navigation.tasksSubtitle') || 'Manage your tasks';
//               case 'Calendar':
//                 return t('navigation.calendarSubtitle') || 'Schedule and events';
//               case 'Routines':
//                 return t('navigation.routinesSubtitle') || 'Daily routines';
//               case 'Alarms':
//                 return t('navigation.alarmsSubtitle') || 'Reminders and alerts';
//               case 'Projects':
//                 return t('navigation.projectsSubtitle') || 'Team projects';
//               case 'Goals':
//                 return t('navigation.goalsSubtitle') || 'Track your goals';
//               case 'Analytics':
//                 return t('navigation.analyticsSubtitle') || 'Progress insights';
//               case 'Profile':
//                 return t('navigation.profileSubtitle') || 'Account settings';
//               default:
//                 return undefined;
//             }
//           };

//           return (
//             <EnhancedHeader
//               title={options.title || route.name}
//               subtitle={getSubtitle(route.name)}
//               showLanguageSwitcher={true}
//               showMenu={route.name === 'Profile'}
//               onMenuPress={() => navigation.navigate('Settings')}
//               style={styles.header}
//               titleStyle={styles.headerTitle}
//               subtitleStyle={styles.headerSubtitle}
//             />
//           );
//         },
//         headerShown: true,
//       })}
//     >
//       <Tab.Screen
//         name="Dashboard"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.dashboard')) || 'Dashboard',
//           tabBarLabel: (t && t('navigation.dashboard')) || 'Dashboard',
//         }}
//       />
//       <Tab.Screen
//         name="Tasks"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.myTasks')) || 'Tasks',
//           tabBarLabel: (t && t('navigation.tasks')) || 'Tasks',
//         }}
//       />
//       <Tab.Screen
//         name="Calendar"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.calendar')) || 'Calendar',
//           tabBarLabel: (t && t('navigation.calendar')) || 'Calendar',
//         }}
//       />
//       <Tab.Screen
//         name="Routines"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.routines')) || 'Routines',
//           tabBarLabel: (t && t('navigation.routines')) || 'Routines',
//         }}
//       />
//       <Tab.Screen
//         name="Goals"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.goals')) || 'Goals',
//           tabBarLabel: (t && t('navigation.goals')) || 'Goals',
//         }}
//       />
//       <Tab.Screen
//         name="Projects"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.projects')) || 'Projects',
//           tabBarLabel: (t && t('navigation.projects')) || 'Projects',
//         }}
//       />
//       <Tab.Screen
//         name="Alarms"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.alarmsReminders')) || 'Alarms',
//           tabBarLabel: (t && t('navigation.alarms')) || 'Alarms',
//         }}
//       />
//       <Tab.Screen
//         name="Analytics"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.analytics')) || 'Analytics',
//           tabBarLabel: (t && t('navigation.analytics')) || 'Analytics',
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={TestScreen}
//         options={{
//           title: (t && t('navigation.profile')) || 'Profile',
//           tabBarLabel: (t && t('navigation.profile')) || 'Profile',
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// export const MainNavigator: React.FC = () => {
//   return (
//     <Stack.Navigator
//       screenOptions={{
//         headerShown: false,
//         cardStyle: {
//           backgroundColor: theme.colors.background,
//         }
//       }}
//     >
//       <Stack.Screen name="MainTabs" component={MainTabs} />
//     </Stack.Navigator>
//   );
// };

// const styles = StyleSheet.create({
//   // Header Styles
//   header: {
//     backgroundColor: '#FFFFFF',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   headerTitle: {
//     color: '#1A1A1A',
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   headerSubtitle: {
//     color: '#666666',
//     fontSize: 14,
//   },
// });



// @ts-ignore - React version compatibility issue
import React from 'react';
// @ts-ignore - React version compatibility issue
import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { theme } from '@/utils/theme';
import { EnhancedHeader } from '@/components/EnhancedHeader';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ModalNavigator } from './ModalNavigator';

// Import screens
import { TasksScreen } from '@/screens/tasks/TasksScreen';
import { TaskCreateScreen } from '@/screens/tasks/TaskCreateScreen';
import { TaskEditScreen } from '@/screens/tasks/TaskEditScreen';
import { TaskDetailScreen } from '@/screens/tasks/TaskDetailScreen';
import { GoalsScreen } from '@/screens/goals/GoalsScreen';
import { GoalCreateScreen } from '@/screens/goals/GoalCreateScreen';
import { GoalEditScreen } from '@/screens/goals/GoalEditScreen';
import { GoalDetailScreen } from '@/screens/goals/GoalDetailScreen';
import { GoalAnalyticsScreen } from '@/screens/goals/GoalAnalyticsScreen';
import { MilestoneManagementScreen } from '@/screens/goals/MilestoneManagementScreen';
import { AlarmsScreen } from '@/screens/alarms/AlarmsScreen';
import { AlarmCreateScreen } from '@/screens/alarms/AlarmCreateScreen';
import { AlarmEditScreen } from '@/screens/alarms/AlarmEditScreen';
import { AnalyticsScreen } from '@/screens/analytics/AnalyticsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { ProjectsScreen } from '@/screens/projects/ProjectsScreen';
import { ProjectCreateScreen } from '@/screens/projects/ProjectCreateScreen';
import { ProjectDetailScreen } from '@/screens/projects/ProjectDetailScreen';
import { ProjectInviteScreen } from '@/screens/projects/ProjectInviteScreen';
import { MilestoneCreateScreen } from '@/screens/projects/MilestoneCreateScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { RoutinesScreen } from '@/screens/routines/RoutinesScreen';
import { RoutineCreateScreen } from '@/screens/routines/RoutineCreateScreen';
import { RoutineEditScreen } from '@/screens/routines/RoutineEditScreen';
import { CalendarScreen } from '@/screens/calendar/CalendarScreen';
import { ProjectInvitationsScreen } from '@/screens/profile/ProjectInvitationsScreen';
import { PendingInvitationsScreen } from '@/screens/invitations/PendingInvitationsScreen';
import { InvitationAcceptScreen } from '@/screens/invitations/InvitationAcceptScreen';


const { width: screenWidth } = Dimensions.get('window');

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Projects: undefined;
  Analytics: undefined;
  Profile: undefined;
  Calendar: undefined;
  Routines: undefined;
  Alarms: undefined;
  Goals: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
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
  RoutineCreate: undefined;
  RoutineEdit: { routineId: string };
  Settings: undefined;
  ProjectInvitations: undefined;
  PendingInvitations: undefined;
  InvitationAccept: { token: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Custom Swipeable Tab Bar Component
const SwipeableTabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  console.log('state', state);
  console.log('descriptors', descriptors);
  console.log('navigation', navigation);
  const tabConfig = [
    { key: 'Dashboard', icon: 'view-dashboard', label: t('navigation.dashboard') || 'Dashboard' },
    { key: 'Tasks', icon: 'checkbox-marked-circle-outline', label: t('navigation.tasks') || 'Tasks' },
    { key: 'Calendar', icon: 'calendar', label: t('navigation.calendar') || 'Calendar' },
    { key: 'Routines', icon: 'repeat', label: t('navigation.routines') || 'Routines' },
    { key: 'Goals', icon: 'flag', label: t('navigation.goals') || 'Goals' },
    { key: 'Projects', icon: 'file-tree', label: t('navigation.projects') || 'Projects' },
    { key: 'Alarms', icon: 'alarm', label: t('navigation.alarms') || 'Alarms' },
    { key: 'Analytics', icon: 'chart-bar', label: t('navigation.analytics') || 'Analytics' },
    { key: 'Profile', icon: 'account', label: t('navigation.profile') || 'Profile' },
  ];

  const onTabPress = (routeKey: string, isFocused: boolean) => {
    if (!isFocused) {
      navigation.navigate(routeKey);
    }
  };

  const scrollToTab = (index: number) => {
    const tabWidth = 100; // Fixed width for each tab
    const scrollToX = index * tabWidth;

    scrollViewRef.current?.scrollTo({ x: scrollToX, animated: true });
    setScrollPosition(scrollToX);
  };

  const onScroll = (event: any) => {
    const position = event.nativeEvent.contentOffset.x;
    setScrollPosition(position);
  };

  const onContentSizeChange = (contentWidth: number) => {
    setMaxScroll(contentWidth - screenWidth);
  };

  return (
    <View style={styles.tabBarContainer}>
      {/* Left Scroll Button */}
      {scrollPosition > 0 && (
        <TouchableOpacity
          style={[styles.scrollButton, styles.leftScrollButton]}
          onPress={() => scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollPosition - 200), animated: true })}
        >
          <Icon name="chevron-left" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      )}

      {/* Tab Items */}
        {/* @ts-ignore - ScrollView ref compatibility issue */}
        {/* @ts-ignore */}
        {/* @ts-ignore */}
        <ScrollView
          ref={scrollViewRef as any}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onContentSizeChange={onContentSizeChange}
        >
        <View style={styles.tabsContainer}>
          {tabConfig.map((tab, index) => {
            const route = state.routes.find((r: any) => r.name === tab.key);
            if (!route) return null;

            console.log(' state.index === index', state.index, index);
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabItem,
                  isFocused && styles.tabItemActive
                ]}
                onPress={() => {
                  onTabPress(route.name, isFocused);
                  scrollToTab(index);
                }}
                activeOpacity={0.7}
              >
                <Icon
                  name={tab.icon}
                  size={22}
                  color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>

                {/* Active Indicator */}
                {isFocused && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Right Scroll Button */}
      {scrollPosition < maxScroll && (
        <TouchableOpacity
          style={[styles.scrollButton, styles.rightScrollButton]}
          onPress={() => scrollViewRef.current?.scrollTo({ x: Math.min(maxScroll, scrollPosition + 200), animated: true })}
        >
          <Icon name="chevron-right" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const MainTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props: any) => <SwipeableTabBar {...props} />}
      screenOptions={({ route }: { route: any }) => ({
        header: ({ navigation, route, options }: { navigation: any; route: any; options: any }) => {
          const getSubtitle = (routeName: string) => {
            switch (routeName) {
              case 'Dashboard':
                return t('navigation.dashboardSubtitle') || 'Overview and insights';
              case 'Tasks':
                return t('navigation.tasksSubtitle') || 'Manage your tasks';
              case 'Calendar':
                return t('navigation.calendarSubtitle') || 'Schedule and events';
              case 'Routines':
                return t('navigation.routinesSubtitle') || 'Daily routines';
              case 'Alarms':
                return t('navigation.alarmsSubtitle') || 'Reminders and alerts';
              case 'Projects':
                return t('navigation.projectsSubtitle') || 'Team projects';
              case 'Goals':
                return t('navigation.goalsSubtitle') || 'Track your goals';
              case 'Analytics':
                return t('navigation.analyticsSubtitle') || 'Progress insights';
              case 'Profile':
                return t('navigation.profileSubtitle') || 'Account settings';
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
              onMenuPress={() => navigation.navigate('Settings')}
              style={styles.header}
              titleStyle={styles.headerTitle}
              subtitleStyle={styles.headerSubtitle}
            />
          );
        },
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t('navigation.dashboard') || 'Dashboard',
          tabBarLabel: t('navigation.dashboard') || 'Dashboard',
        }}
      />

      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: t('navigation.myTasks') || 'Tasks',
          tabBarLabel: t('navigation.tasks') || 'Tasks',
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: t('navigation.calendar') || 'Calendar',
          tabBarLabel: t('navigation.calendar') || 'Calendar',
        }}
      />

      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{
          title: t('navigation.routines') || 'Routines',
          tabBarLabel: t('navigation.routines') || 'Routines',
        }}
      />
  
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          title: t('navigation.goals') || 'Goals',
          tabBarLabel: t('navigation.goals') || 'Goals',
        }}
      />
  
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          title: t('navigation.projects') || 'Projects',
          tabBarLabel: t('navigation.projects') || 'Projects',
        }}
      />

      <Tab.Screen
        name="Alarms"
        component={AlarmsScreen}
        options={{
          title: t('navigation.alarmsReminders') || 'Alarms',
          tabBarLabel: t('navigation.alarms') || 'Alarms',
        }}
      />

      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: t('navigation.analytics') || 'Analytics',
          tabBarLabel: t('navigation.analytics') || 'Analytics',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile') || 'Profile',
          tabBarLabel: t('navigation.profile') || 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};


export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {
          backgroundColor: theme.colors.background,
        }
      }}
    >
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
        name="MilestoneCreate"
        component={MilestoneCreateScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
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
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProjectInvitations"
        component={ProjectInvitationsScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="PendingInvitations"
        component={PendingInvitationsScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="InvitationAccept"
        component={InvitationAcceptScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="RoutineCreate"
        component={RoutineCreateScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="RoutineEdit"
        component={RoutineEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  // Tab Bar Styles
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    height: 70,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabScrollView: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    borderRadius: 20,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: theme.colors.primary || '#1976D2',
  },
  tabLabelInactive: {
    color: theme.colors.textSecondary || '#666666',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary || '#1976D2',
  },
  scrollButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  leftScrollButton: {
    left: 8,
  },
  rightScrollButton: {
    right: 8,
  },

  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 14,
  },

  // Placeholder Styles
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background || '#FAFAFA',
    padding: 20,
  },
  placeholderText: {
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: '#666666',
    textAlign: 'center',
  },
});