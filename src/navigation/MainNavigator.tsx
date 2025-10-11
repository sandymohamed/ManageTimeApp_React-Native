// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';

// import { theme } from '@/utils/theme';
// import { EnhancedHeader } from '@/components/EnhancedHeader';
// import { EnhancedTabBar } from '@/components/EnhancedTabBar';

// // Import screens
// import { TasksScreen } from '@/screens/tasks/TasksScreen';
// import { TaskCreateScreen } from '@/screens/tasks/TaskCreateScreen';
// import { TaskEditScreen } from '@/screens/tasks/TaskEditScreen';
// import { TaskDetailScreen } from '@/screens/tasks/TaskDetailScreen';
// import { GoalsScreen } from '@/screens/goals/GoalsScreen';
// import { AlarmsScreen } from '@/screens/alarms/AlarmsScreen';
// import { AnalyticsScreen } from '@/screens/analytics/AnalyticsScreen';
// import { ProfileScreen } from '@/screens/profile/ProfileScreen';
// import { ProjectsScreen } from '@/screens/projects/ProjectsScreen';
// import { ProjectCreateScreen } from '@/screens/projects/ProjectCreateScreen';
// import { ProjectDetailScreen } from '@/screens/projects/ProjectDetailScreen';
// import { ProjectInviteScreen } from '@/screens/projects/ProjectInviteScreen';
// import { MilestoneCreateScreen } from '@/screens/projects/MilestoneCreateScreen';
// import { SettingsScreen } from '@/screens/settings/SettingsScreen';
// import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
// import { CalendarScreen } from '@/screens/calendar/CalendarScreen';
// import { RoutinesScreen } from '@/screens/routines/RoutinesScreen';

// export type MainTabParamList = {
//   Dashboard: undefined;
//   Tasks: undefined;
//   Calendar: undefined;
//   Projects: undefined;
//   Routines: undefined;
//   Goals: undefined;
//   Alarms: undefined;
//   Analytics: undefined;
//   Profile: undefined;
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
//   Settings: undefined;
//   Calendar: undefined;
//   Routines: undefined;
// };


// const Tab = createBottomTabNavigator<MainTabParamList>();
// const Stack = createStackNavigator<RootStackParamList>();


// const MainTabs: React.FC = () => {
//   const { t } = useTranslation();
//   const { isRTL } = useLanguage();

//   return (
//     <Tab.Navigator
//       tabBar={(props) => <EnhancedTabBar {...props} />}
//       screenOptions={({ route }) => ({
//         header: ({ navigation, options }) => {
//           // Get subtitle based on route name
//           const getSubtitle = (routeName: string) => {
//             switch (routeName) {
//               case 'Dashboard':
//                 return t('navigation.dashboard');
//               case 'Tasks':
//                 return t('navigation.tasks');
//               case 'Calendar':
//                 return t('navigation.calendar');
//               case 'Routines':
//                 return t('navigation.routines');
//               case 'Alarms':
//                 return t('navigation.alarms');
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
//               onMenuPress={() => {
//                 // Handle profile menu actions
//                 console.log('Profile menu pressed');
//               }}
//             />
//           );
//         },
//         headerShown: true,
//       })}>

//       {/* does't exist */}
//       <Tab.Screen
//         name="Dashboard"
//         component={DashboardScreen}
//         options={{
//           title: t('navigation.dashboard'),
//         }}
//       />
//       <Tab.Screen
//         name="Tasks"
//         component={TasksScreen}
//         options={{
//           title: t('navigation.myTasks'),
//         }}
//       />
//       {/* does't exist */}
//       <Tab.Screen
//         name="Calendar"
//         component={CalendarScreen}
//         options={{
//           title: t('navigation.calendar'),
//         }}
//       />
//       <Tab.Screen
//         name="Projects"
//         component={ProjectsScreen}
//         options={{
//           title: t('navigation.projects'),
//         }}
//       />
//       {/* does't exist */}
//       <Tab.Screen
//         name="Routines"
//         component={RoutinesScreen}
//         options={{
//           title: t('navigation.routines'),
//         }}
//       />
//       <Tab.Screen
//         name="Goals"
//         component={GoalsScreen}
//         options={{
//           title: t('navigation.goals'),
//         }}
//       />
//       <Tab.Screen
//         name="Alarms"
//         component={AlarmsScreen}
//         options={{
//           title: t('navigation.alarmsReminders'),
//         }}
//       />
//       <Tab.Screen
//         name="Analytics"
//         component={AnalyticsScreen}
//         options={{
//           title: t('navigation.analytics'),
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={ProfileScreen}
//         options={{
//           title: t('navigation.profile'),
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// export const MainNavigator: React.FC = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="MainTabs" component={MainTabs} />
//       <Stack.Screen
//         name="TaskCreate"
//         component={TaskCreateScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="TaskEdit"
//         component={TaskEditScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="TaskDetail"
//         component={TaskDetailScreen}
//         options={{
//           headerShown: false,
//         }}
//       />
//       <Stack.Screen
//         name="ProjectCreate"
//         component={ProjectCreateScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="ProjectDetail"
//         component={ProjectDetailScreen}
//         options={{
//           headerShown: false,
//         }}
//       />
//       <Stack.Screen
//         name="ProjectEdit"
//         component={ProjectCreateScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="ProjectInvite"
//         component={ProjectInviteScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="MilestoneCreate"
//         component={MilestoneCreateScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="Settings"
//         component={SettingsScreen}
//         options={{
//           headerShown: false,
//         }}
//       />
//     </Stack.Navigator>
//   );
// };



// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { theme } from '@/utils/theme';
// import { EnhancedHeader } from '@/components/EnhancedHeader';
// import { EnhancedTabBar } from '@/components/EnhancedTabBar';

// // Import existing screens
// import { TasksScreen } from '@/screens/tasks/TasksScreen';
// import { TaskCreateScreen } from '@/screens/tasks/TaskCreateScreen';
// import { TaskEditScreen } from '@/screens/tasks/TaskEditScreen';
// import { TaskDetailScreen } from '@/screens/tasks/TaskDetailScreen';
// import { GoalsScreen } from '@/screens/goals/GoalsScreen';
// import { AlarmsScreen } from '@/screens/alarms/AlarmsScreen';
// import { AnalyticsScreen } from '@/screens/analytics/AnalyticsScreen';
// import { ProfileScreen } from '@/screens/profile/ProfileScreen';
// import { ProjectsScreen } from '@/screens/projects/ProjectsScreen';
// import { ProjectCreateScreen } from '@/screens/projects/ProjectCreateScreen';
// import { ProjectDetailScreen } from '@/screens/projects/ProjectDetailScreen';
// import { ProjectInviteScreen } from '@/screens/projects/ProjectInviteScreen';
// import { MilestoneCreateScreen } from '@/screens/projects/MilestoneCreateScreen';
// import { SettingsScreen } from '@/screens/settings/SettingsScreen';
// import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';


// export type MainTabParamList = {
//   Dashboard: undefined;
//   Tasks: undefined;
//   Calendar: undefined;
//   Projects: undefined;
//   Routines: undefined;
//   Goals: undefined;
//   Alarms: undefined;
//   Analytics: undefined;
//   Profile: undefined;
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
//   Settings: undefined;
//   Calendar: undefined;
//   Routines: undefined;
// };

// const Tab = createBottomTabNavigator<MainTabParamList>();
// const Stack = createStackNavigator<RootStackParamList>();

// // Enhanced Tab Bar Component with better styling
// const CustomTabBar: React.FC<any> = (props) => {
//   return (
//     <EnhancedTabBar 
//       {...props} 
//       style={{
//         backgroundColor: theme.colors.surface,
//         borderTopColor: theme.colors.outline,
//         borderTopWidth: 1,
//         elevation: 8,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//       }}
//       activeTintColor={theme.colors.primary}
//       inactiveTintColor={theme.colors.textSecondary}
//       labelStyle={{
//         fontSize: 12,
//         fontWeight: '600',
//         marginTop: 4,
//       }}
//       iconStyle={{
//         marginBottom: 2,
//       }}
//     />
//   );
// };

// const MainTabs: React.FC = () => {
//   const { t } = useTranslation();
//   const { isRTL } = useLanguage();

//   // Define tab icons
//   const getTabIcon = (routeName: string, focused: boolean) => {
//     const iconColor = focused ? theme.colors.primary : theme.colors.textSecondary;
    
//     switch (routeName) {
//       case 'Dashboard':
//         return 'view-dashboard';
//       case 'Tasks':
//         return 'checkbox-marked-circle-outline';
//       case 'Calendar':
//         return 'calendar';
//       case 'Projects':
//         return 'file-tree';
//       case 'Routines':
//         return 'repeat';
//       case 'Goals':
//         return 'flag';
//       case 'Alarms':
//         return 'alarm';
//       case 'Analytics':
//         return 'chart-bar';
//       case 'Profile':
//         return 'account';
//       default:
//         return 'circle';
//     }
//   };

//   return (
//     <Tab.Navigator
//       tabBar={(props) => <CustomTabBar {...props} />}
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           const iconName = getTabIcon(route.name, focused);
//           return (
//             <Icon
//               name={iconName}
//               size={24}
//               color={focused ? theme.colors.primary : theme.colors.textSecondary}
//             />
//           );
//         },
//         header: ({ navigation, route, options }) => {
//           // Get subtitle based on route name
//           const getSubtitle = (routeName: string) => {
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
//               onMenuPress={() => {
//                 navigation.navigate('Settings');
//               }}
//               style={{
//                 backgroundColor: theme.colors.surface,
//                 elevation: 4,
//                 shadowColor: '#000',
//                 shadowOffset: { width: 0, height: 2 },
//                 shadowOpacity: 0.1,
//                 shadowRadius: 8,
//               }}
//               titleStyle={{
//                 color: theme.colors.text,
//                 fontSize: 20,
//                 fontWeight: '700',
//               }}
//               subtitleStyle={{
//                 color: theme.colors.textSecondary,
//                 fontSize: 14,
//               }}
//             />
//           );
//         },
//         headerShown: true,
//         tabBarStyle: {
//           backgroundColor: theme.colors.surface,
//           borderTopColor: theme.colors.outline,
//           borderTopWidth: 1,
//           height: 70,
//           paddingBottom: 8,
//           paddingTop: 8,
//         },
//         tabBarLabelStyle: {
//           fontSize: 12,
//           fontWeight: '600',
//           marginTop: 4,
//         },
//         tabBarActiveTintColor: theme.colors.primary,
//         tabBarInactiveTintColor: theme.colors.textSecondary,
//       })}
//     >
//       <Tab.Screen
//         name="Dashboard"
//         component={DashboardScreen}
//         options={{
//           title: t('navigation.dashboard') || 'Dashboard',
//           tabBarLabel: t('navigation.dashboard') || 'Dashboard',
//         }}
//       />
      
//       <Tab.Screen
//         name="Tasks"
//         component={TasksScreen}
//         options={{
//           title: t('navigation.myTasks') || 'Tasks',
//           tabBarLabel: t('navigation.tasks') || 'Tasks',
//         }}
//       />
      
//       <Tab.Screen
//         name="Calendar"
//         component={CalendarScreen}
//         options={{
//           title: t('navigation.calendar') || 'Calendar',
//           tabBarLabel: t('navigation.calendar') || 'Calendar',
//         }}
//       />
      
//       <Tab.Screen
//         name="Projects"
//         component={ProjectsScreen}
//         options={{
//           title: t('navigation.projects') || 'Projects',
//           tabBarLabel: t('navigation.projects') || 'Projects',
//         }}
//       />
      
//       <Tab.Screen
//         name="Routines"
//         component={RoutinesScreen}
//         options={{
//           title: t('navigation.routines') || 'Routines',
//           tabBarLabel: t('navigation.routines') || 'Routines',
//         }}
//       />
      
//       <Tab.Screen
//         name="Goals"
//         component={GoalsScreen}
//         options={{
//           title: t('navigation.goals') || 'Goals',
//           tabBarLabel: t('navigation.goals') || 'Goals',
//         }}
//       />
      
//       <Tab.Screen
//         name="Alarms"
//         component={AlarmsScreen}
//         options={{
//           title: t('navigation.alarmsReminders') || 'Alarms',
//           tabBarLabel: t('navigation.alarms') || 'Alarms',
//         }}
//       />
      
//       <Tab.Screen
//         name="Analytics"
//         component={AnalyticsScreen}
//         options={{
//           title: t('navigation.analytics') || 'Analytics',
//           tabBarLabel: t('navigation.analytics') || 'Analytics',
//         }}
//       />
      
//       <Tab.Screen
//         name="Profile"
//         component={ProfileScreen}
//         options={{
//           title: t('navigation.profile') || 'Profile',
//           tabBarLabel: t('navigation.profile') || 'Profile',
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
//       <Stack.Screen
//         name="TaskCreate"
//         component={TaskCreateScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="TaskEdit"
//         component={TaskEditScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="TaskDetail"
//         component={TaskDetailScreen}
//         options={{
//           headerShown: false,
//         }}
//       />
//       <Stack.Screen
//         name="ProjectCreate"
//         component={ProjectCreateScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="ProjectDetail"
//         component={ProjectDetailScreen}
//         options={{
//           headerShown: false,
//         }}
//       />
//       <Stack.Screen
//         name="ProjectEdit"
//         component={ProjectCreateScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="ProjectInvite"
//         component={ProjectInviteScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="MilestoneCreate"
//         component={MilestoneCreateScreen}
//         options={{
//           headerShown: false,
//           presentation: 'modal',
//         }}
//       />
//       <Stack.Screen
//         name="Settings"
//         component={SettingsScreen}
//         options={{
//           headerShown: false,
//         }}
//       />
//     </Stack.Navigator>
//   );
// };

// // Add these imports at the top if not already present
// import { View } from 'react-native';
// import { Text } from 'react-native-paper';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { RoutinesScreen } from '@/screens/routines/RoutinesScreen';import { CalendarScreen } from '@/screens/calendar/CalendarScreen';




import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions,
  ScrollView 
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { theme } from '@/utils/theme';
import { EnhancedHeader } from '@/components/EnhancedHeader';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
import { MilestoneCreateScreen } from '@/screens/projects/MilestoneCreateScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';


const { width: screenWidth } = Dimensions.get('window');

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Projects: undefined;
  Analytics: undefined;
  Profile: undefined;
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
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Custom Swipeable Tab Bar Component
const SwipeableTabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  const tabConfig = [
    { key: 'Dashboard', icon: 'view-dashboard', label: t('navigation.dashboard') || 'Dashboard' },
    { key: 'Tasks', icon: 'checkbox-marked-circle-outline', label: t('navigation.tasks') || 'Tasks' },
    { key: 'Projects', icon: 'file-tree', label: t('navigation.projects') || 'Projects' },
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
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
      >
        <View style={styles.tabsContainer}>
          {tabConfig.map((tab, index) => {
            const route = state.routes.find(r:any => r.name === tab.key);
            if (!route) return null;

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
  const { isRTL } = useLanguage();

  return (
    <Tab.Navigator
      tabBar={(props) => <SwipeableTabBar {...props} />}
      screenOptions={({ route }) => ({
        header: ({ navigation, route, options }) => {
          const getSubtitle = (routeName: string) => {
            switch (routeName) {
              case 'Dashboard':
                return t('navigation.dashboardSubtitle') || 'Overview and insights';
              case 'Tasks':
                return t('navigation.tasksSubtitle') || 'Manage your tasks';
              case 'Projects':
                return t('navigation.projectsSubtitle') || 'Team projects';
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
        }}
      />
      
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: t('navigation.myTasks') || 'Tasks',
        }}
      />
      
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          title: t('navigation.projects') || 'Projects',
        }}
      />
      
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: t('navigation.analytics') || 'Analytics',
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile') || 'Profile',
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
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
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