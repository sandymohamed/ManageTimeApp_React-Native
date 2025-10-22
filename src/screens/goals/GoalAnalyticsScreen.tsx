// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
// import { 
//   Text, 
//   Card, 
//   useTheme,
//   ActivityIndicator,
//   Chip,
//   SegmentedButtons,
//   ProgressBar,
//   IconButton
// } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
// import { useNotification } from '@/contexts/NotificationContext';
// import { useGoalStore } from '@/store/goalStore';
// import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
// import { LineChart, PieChart } from 'react-native-chart-kit';
// import { Dimensions } from 'react-native';

// interface GoalAnalyticsScreenProps {
//   navigation: any;
//   route: {
//     params: {
//       goalId: string;
//     };
//   };
// }

// export const GoalAnalyticsScreen: React.FC<GoalAnalyticsScreenProps> = ({ navigation, route }) => {
//   const { t } = useTranslation();
//   const { isRTL } = useLanguage();
//   const paperTheme = useTheme();
//   const customTheme = useCustomTheme();
//   const theme = customTheme.theme;
//   const styles = createStyles(theme);
//   const { showError } = useNotification();

//   const { currentGoal, fetchGoal, getGoalAnalytics, isLoading } = useGoalStore();

//   const [analytics, setAnalytics] = useState<any>(null);
//   const [timeRange, setTimeRange] = useState('all');
//   const [refreshing, setRefreshing] = useState(false);

//   const timeRanges = [
//     { value: 'week', label: t('analytics.week') },
//     { value: 'month', label: t('analytics.month') },
//     { value: 'quarter', label: t('analytics.quarter') },
//     { value: 'year', label: t('analytics.year') },
//     { value: 'all', label: t('analytics.all') },
//   ];

//   useEffect(() => {
//     fetchGoal(route.params.goalId);
//   }, [route.params.goalId]);

//   useEffect(() => {
//     if (currentGoal) {
//       loadAnalytics();
//     }
//   }, [currentGoal, timeRange]);

//   const loadAnalytics = async () => {
//     try {
//       const data = await getGoalAnalytics(route.params.goalId, timeRange);
//       setAnalytics(data);
//     } catch (error: any) {
//       showError(error.message || t('goals.analyticsError'));
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchGoal(route.params.goalId);
//     await loadAnalytics();
//     setRefreshing(false);
//   };

//   const getProgressColor = (progress: number) => {
//     if (progress >= 80) return '#4CAF50';
//     if (progress >= 60) return '#8BC34A';
//     if (progress >= 40) return '#FFC107';
//     if (progress >= 20) return '#FF9800';
//     return '#F44336';
//   };

//   const getTimeStatus = () => {
//     if (!currentGoal?.targetDate) return null;

//     const target = new Date(currentGoal.targetDate);
//     const now = new Date();
//     const daysLeft = differenceInDays(target, now);

//     if (isBefore(target, now)) {
//       return { text: t('goals.overdue'), color: '#F44336', icon: 'alert-circle' };
//     }

//     if (daysLeft <= 7) {
//       return { text: t('goals.dueInDays', { days: daysLeft }), color: '#FF9800', icon: 'clock-alert' };
//     }

//     return { text: t('goals.dueInDays', { days: daysLeft }), color: '#4CAF50', icon: 'clock' };
//   };

//   const renderOverviewCards = () => {
//     if (!analytics || !currentGoal) return null;

//     return (
//       <View style={styles.overviewContainer}>
//         <Card style={styles.overviewCard}>
//           <Card.Content>
//             <View style={styles.cardHeader}>
//               <Text variant="titleMedium" style={styles.cardTitle}>
//                 {t('goals.progress')}
//               </Text>
//               <Text variant="headlineSmall" style={[styles.progressText, { color: getProgressColor(analytics.progress) }]}>
//                 {analytics.progress}%
//               </Text>
//             </View>
//             <ProgressBar
//               progress={analytics.progress / 100}
//               color={getProgressColor(analytics.progress)}
//               style={styles.progressBar}
//             />
//           </Card.Content>
//         </Card>

//         <Card style={styles.overviewCard}>
//           <Card.Content>
//             <View style={styles.cardHeader}>
//               <Text variant="titleMedium" style={styles.cardTitle}>
//                 {t('goals.milestones')}
//               </Text>
//               <Text variant="headlineSmall" style={styles.milestoneText}>
//                 {analytics.completedMilestones}/{analytics.totalMilestones}
//               </Text>
//             </View>
//             <Text variant="bodySmall" style={styles.milestoneSubtext}>
//               {t('goals.completed')}
//             </Text>
//           </Card.Content>
//         </Card>

//         <Card style={styles.overviewCard}>
//           <Card.Content>
//             <View style={styles.cardHeader}>
//               <Text variant="titleMedium" style={styles.cardTitle}>
//                 {t('goals.streak')}
//               </Text>
//               <Text variant="headlineSmall" style={styles.streakText}>
//                 {analytics.streak}
//               </Text>
//             </View>
//             <Text variant="bodySmall" style={styles.streakSubtext}>
//               {t('goals.daysInARow')}
//             </Text>
//           </Card.Content>
//         </Card>
//       </View>
//     );
//   };

//   const renderMilestoneChart = () => {
//     if (!analytics || analytics.totalMilestones === 0) return null;

//     const data = [
//       {
//         name: t('goals.completed'),
//         population: analytics.completedMilestones,
//         color: '#4CAF50',
//         legendFontColor: theme.colors.text,
//         legendFontSize: 12,
//       },
//       {
//         name: t('goals.remaining'),
//         population: analytics.totalMilestones - analytics.completedMilestones,
//         color: '#E0E0E0',
//         legendFontColor: theme.colors.text,
//         legendFontSize: 12,
//       },
//     ];

//     return (
//       <Card style={styles.chartCard}>
//         <Card.Content>
//           <Text variant="titleMedium" style={styles.chartTitle}>
//             {t('goals.milestoneProgress')}
//           </Text>
//           <View style={styles.chartContainer}>
//             <PieChart
//               data={data}
//               width={Dimensions.get('window').width - 80}
//               height={200}
//               chartConfig={{
//                 color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
//               }}
//               accessor="population"
//               backgroundColor="transparent"
//               paddingLeft="15"
//               center={[10, 0]}
//               absolute
//             />
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderProgressChart = () => {
//     // Mock data for progress over time
//     const data = {
//       labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
//       datasets: [
//         {
//           data: [0, 25, 50, analytics?.progress || 0],
//           color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
//           strokeWidth: 2,
//         },
//       ],
//     };

//     const chartConfig = {
//       backgroundColor: theme.colors.surface,
//       backgroundGradientFrom: theme.colors.surface,
//       backgroundGradientTo: theme.colors.surface,
//       decimalPlaces: 0,
//       color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
//       labelColor: (opacity = 1) => `rgba(${theme.colors.text.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
//       style: {
//         borderRadius: 16,
//       },
//       propsForDots: {
//         r: '6',
//         strokeWidth: '2',
//         stroke: theme.colors.primary,
//       },
//     };

//     return (
//       <Card style={styles.chartCard}>
//         <Card.Content>
//           <Text variant="titleMedium" style={styles.chartTitle}>
//             {t('goals.progressOverTime')}
//           </Text>
//           <View style={styles.chartContainer}>
//             <LineChart
//               data={data}
//               width={Dimensions.get('window').width - 80}
//               height={200}
//               chartConfig={chartConfig}
//               bezier
//               style={styles.lineChart}
//             />
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderInsights = () => {
//     if (!analytics?.insights || analytics.insights.length === 0) return null;

//     return (
//       <Card style={styles.insightsCard}>
//         <Card.Content>
//           <Text variant="titleMedium" style={styles.insightsTitle}>
//             {t('goals.insights')}
//           </Text>
//           {analytics.insights.map((insight: string, index: number) => (
//             <View key={index} style={styles.insightItem}>
//               <IconButton
//                 icon="lightbulb"
//                 size={20}
//                 iconColor={theme.colors.primary}
//                 style={styles.insightIcon}
//               />
//               <Text variant="bodyMedium" style={styles.insightText}>
//                 {insight}
//               </Text>
//             </View>
//           ))}
//         </Card.Content>
//       </Card>
//     );
//   };

//   const renderTimeStatus = () => {
//     const timeStatus = getTimeStatus();
//     if (!timeStatus) return null;

//     return (
//       <Card style={[styles.timeStatusCard, { borderLeftColor: timeStatus.color }]}>
//         <Card.Content>
//           <View style={styles.timeStatusHeader}>
//             <IconButton
//               icon={timeStatus.icon}
//               size={24}
//               iconColor={timeStatus.color}
//             />
//             <View style={styles.timeStatusInfo}>
//               <Text variant="titleMedium" style={styles.timeStatusTitle}>
//                 {t('goals.targetDate')}
//               </Text>
//               <Text variant="bodyLarge" style={[styles.timeStatusText, { color: timeStatus.color }]}>
//                 {timeStatus.text}
//               </Text>
//               {currentGoal?.targetDate && (
//                 <Text variant="bodySmall" style={styles.timeStatusDate}>
//                   {format(new Date(currentGoal.targetDate), 'MMM dd, yyyy')}
//                 </Text>
//               )}
//             </View>
//           </View>
//         </Card.Content>
//       </Card>
//     );
//   };

//   if (isLoading && !refreshing) {
//     return (
//       <View style={[styles.container, styles.loadingContainer]}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//         <Text variant="bodyLarge" style={styles.loadingText}>
//           {t('goals.loading')}
//         </Text>
//       </View>
//     );
//   }

//   if (!currentGoal) {
//     return (
//       <View style={[styles.container, styles.errorContainer]}>
//         <Text variant="headlineSmall" style={styles.errorTitle}>
//           {t('goals.goalNotFound')}
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
//         <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
//           {t('goals.analytics')}
//         </Text>
//         <Text variant="bodyMedium" style={styles.subtitle}>
//           {currentGoal.title}
//         </Text>
//       </View>

//       <View style={styles.timeRangeContainer}>
//         <SegmentedButtons
//           value={timeRange}
//           onValueChange={setTimeRange}
//           buttons={timeRanges}
//           style={styles.segmentedButtons}
//         />
//       </View>

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {renderOverviewCards()}
//         {renderTimeStatus()}
//         {renderMilestoneChart()}
//         {renderProgressChart()}
//         {renderInsights()}
//       </ScrollView>
//     </View>
//   );
// };

// const createStyles = (theme: any) => StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   loadingContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 16,
//     color: theme.colors.text,
//   },
//   errorContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   errorTitle: {
//     marginBottom: 16,
//     color: theme.colors.text,
//     textAlign: 'center',
//   },
//   header: {
//     padding: 16,
//     elevation: 2,
//   },
//   title: {
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   subtitle: {
//     color: theme.colors.textSecondary,
//   },
//   timeRangeContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   segmentedButtons: {
//     marginBottom: 8,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: 16,
//   },
//   overviewContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginBottom: 16,
//   },
//   overviewCard: {
//     flex: 1,
//     minWidth: '30%',
//     elevation: 2,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   cardTitle: {
//     fontWeight: '600',
//     color: theme.colors.text,
//   },
//   progressText: {
//     fontWeight: 'bold',
//   },
//   progressBar: {
//     height: 8,
//     borderRadius: 4,
//   },
//   milestoneText: {
//     fontWeight: 'bold',
//     color: theme.colors.primary,
//   },
//   milestoneSubtext: {
//     color: theme.colors.textSecondary,
//   },
//   streakText: {
//     fontWeight: 'bold',
//     color: '#FF9800',
//   },
//   streakSubtext: {
//     color: theme.colors.textSecondary,
//   },
//   timeStatusCard: {
//     borderLeftWidth: 4,
//     marginBottom: 16,
//     elevation: 2,
//   },
//   timeStatusHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   timeStatusInfo: {
//     flex: 1,
//     marginLeft: 8,
//   },
//   timeStatusTitle: {
//     fontWeight: '600',
//     color: theme.colors.text,
//   },
//   timeStatusText: {
//     fontWeight: 'bold',
//     marginTop: 4,
//   },
//   timeStatusDate: {
//     color: theme.colors.textSecondary,
//     marginTop: 2,
//   },
//   chartCard: {
//     marginBottom: 16,
//     elevation: 2,
//   },
//   chartTitle: {
//     fontWeight: '600',
//     marginBottom: 16,
//     color: theme.colors.text,
//   },
//   chartContainer: {
//     alignItems: 'center',
//   },
//   lineChart: {
//     borderRadius: 16,
//   },
//   insightsCard: {
//     marginBottom: 16,
//     elevation: 2,
//   },
//   insightsTitle: {
//     fontWeight: '600',
//     marginBottom: 16,
//     color: theme.colors.text,
//   },
//   insightItem: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   insightIcon: {
//     margin: 0,
//     marginRight: 8,
//   },
//   insightText: {
//     flex: 1,
//     color: theme.colors.text,
//     lineHeight: 20,
//   },
// });


import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
  ProgressBar,
  IconButton,
  Avatar,
  Badge,
  Divider,
  FAB
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { format, differenceInDays, isAfter, isBefore, isToday, isTomorrow } from 'date-fns';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

interface GoalAnalyticsScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
    };
  };
}

export const GoalAnalyticsScreen: React.FC<GoalAnalyticsScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showError } = useNotification();

  const { currentGoal, fetchGoal, getGoalAnalytics, isLoading } = useGoalStore();

  const [analytics, setAnalytics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  // const timeRanges = [
  //   { value: 'week', label: t('analytics.week'), icon: 'calendar-week' },
  //   { value: 'month', label: t('analytics.month'), icon: 'calendar-month' },
  //   { value: 'quarter', label: t('analytics.quarter'), icon: 'calendar-blank' },
  //   { value: 'year', label: t('analytics.year'), icon: 'calendar-year' },
  //   { value: 'all', label: t('analytics.all'), icon: 'calendar' },
  // ];

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    fetchGoal(route.params.goalId);
  }, [route.params.goalId]);

  useEffect(() => {
    if (currentGoal) {
      loadAnalytics();
    }
  }, [currentGoal, timeRange]);

  const loadAnalytics = async () => {
    try {
      console.log('Loading analytics for timeRange:', timeRange);
      const data = await getGoalAnalytics(route.params.goalId, timeRange);
      console.log('Analytics data:', data);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Analytics error:', error);
      showError(error.message || t('goals.analyticsError'));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoal(route.params.goalId);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return theme.colors.success || '#4CAF50';
    if (progress >= 60) return theme.colors.warning || '#8BC34A';
    if (progress >= 40) return theme.colors.warning || '#FFC107';
    if (progress >= 20) return theme.colors.warning || '#FF9800';
    return theme.colors.error || '#F44336';
  };

  const getGoalIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'health': 'heart',
      'fitness': 'run',
      'career': 'briefcase',
      'education': 'school',
      'finance': 'currency-usd',
      'personal': 'account',
      'family': 'home',
      'travel': 'airplane',
    };
    return icons[category.toLowerCase()] || 'target';
  };

  const getTimeStatus = () => {
    if (!currentGoal?.targetDate) return null;

    const target = new Date(currentGoal.targetDate);
    const now = new Date();

    if (isToday(target)) return { text: t('goals.dueToday'), color: theme.colors.warning, icon: 'alert-circle' };
    if (isTomorrow(target)) return { text: t('goals.dueTomorrow'), color: theme.colors.info, icon: 'clock-alert' };
    if (isBefore(target, now)) return { text: t('goals.overdue'), color: theme.colors.error, icon: 'alert-circle' };

    const daysLeft = differenceInDays(target, now);
    if (daysLeft <= 7) return { text: t('goals.dueInDays', { days: daysLeft }), color: theme.colors.warning, icon: 'clock-alert' };

    return { text: t('goals.dueInDays', { days: daysLeft }), color: theme.colors.success, icon: 'clock' };
  };

  const renderOverviewCards = () => {
    if (!analytics || !currentGoal) return null;

    const progressColor = getProgressColor(analytics.progress);

    return (
      <View style={styles.overviewContainer}>
        {/* Progress Card */}
        <Card style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <IconButton
                  icon="chart-line"
                  size={12}
                  iconColor={progressColor}
                  style={styles.cardIcon}
                />
                <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {t('goals.progress')}
                </Text>
              </View>
              <Text variant="headlineMedium" style={[styles.progressText, { color: progressColor }]}>
                {analytics.progress}%
              </Text>
            </View>
            <ProgressBar
              progress={analytics.progress / 100}
              color={progressColor}
              style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
            />
            <Text variant="bodySmall" style={[styles.progressSubtext, { color: theme.colors.textSecondary }]}>
              {t('analytics.towardsGoal')}
            </Text>
          </Card.Content>
        </Card>

        {/* Milestones Card */}
        <Card style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <IconButton
                  icon="flag"
                  size={20}
                  iconColor={theme.colors.primary}
                  style={styles.cardIcon}
                />
                <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {t('goals.milestones')}
                </Text>
              </View>
              <View style={styles.milestoneCount}>
                <Text variant="headlineMedium" style={[styles.milestoneText, { color: theme.colors.primary }]}>
                  {analytics.completedMilestones}
                </Text>
                <Text variant="bodyLarge" style={[styles.milestoneTotal, { color: theme.colors.textSecondary }]}>
                  /{analytics.totalMilestones}
                </Text>
              </View>
            </View>
            <View style={styles.milestoneProgress}>
              <ProgressBar
                progress={analytics.totalMilestones > 0 ? analytics.completedMilestones / analytics.totalMilestones : 0}
                color={theme.colors.primary}
                style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
              />
            </View>
            <Text variant="bodySmall" style={[styles.milestoneSubtext, { color: theme.colors.textSecondary }]}>
              {t('goals.completed')}
            </Text>
          </Card.Content>
        </Card>

        {/* Streak Card */}
        <Card style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <IconButton
                  icon="fire"
                  size={20}
                  iconColor="#FF9800"
                  style={styles.cardIcon}
                />
                <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {t('goals.streak')}
                </Text>
              </View>
              <Text variant="headlineMedium" style={[styles.streakText, { color: '#FF9800' }]}>
                {analytics.streak}
              </Text>
            <View style={styles.streakBadge}>
              <Badge size={24} style={[styles.streakBadge, { backgroundColor: analytics.streak > 0 ? '#FF9800' : theme.colors.textDisabled }]}>
                {analytics.streak > 0 ? '🔥' : '💤'}
              </Badge>
            </View>
            </View>
            <Text variant="bodySmall" style={[styles.streakSubtext, { color: theme.colors.textSecondary }]}>
              {t('goals.daysInARow')}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderTimeStatus = () => {
    const timeStatus = getTimeStatus();
    if (!timeStatus) return null;

    return (
      <Card style={[styles.timeStatusCard, {
        backgroundColor: theme.colors.surface,
        borderLeftWidth: 6,
        borderLeftColor: timeStatus.color
      }]} elevation={2}>
        <Card.Content>
          <View style={styles.timeStatusHeader}>
            <Avatar.Icon
              size={50}
              icon={timeStatus.icon}
              style={[styles.timeStatusIcon, { backgroundColor: timeStatus.color + '20' }]}
              color={timeStatus.color}
            />
            <View style={styles.timeStatusInfo}>
              <Text variant="titleMedium" style={[styles.timeStatusTitle, { color: theme.colors.text }]}>
                {t('goals.targetDate')}
              </Text>
              <Text variant="titleLarge" style={[styles.timeStatusText, { color: timeStatus.color }]}>
                {timeStatus.text}
              </Text>
              {currentGoal?.targetDate && (
                <Text variant="bodySmall" style={[styles.timeStatusDate, { color: theme.colors.textSecondary }]}>
                  {format(new Date(currentGoal.targetDate), 'MMMM dd, yyyy')}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMilestoneChart = () => {
    if (!analytics || analytics.totalMilestones === 0) return null;

    const completedPercentage = analytics.totalMilestones > 0 ?
      (analytics.completedMilestones / analytics.totalMilestones) * 100 : 0;

    const data = [
      {
        name: t('goals.completed'),
        population: analytics.completedMilestones,
        color: theme.colors.success || '#4CAF50',
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
      {
        name: t('goals.remaining'),
        population: analytics.totalMilestones - analytics.completedMilestones,
        color: theme.colors.surfaceVariant || '#E0E0E0',
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
    ];

    return (
      <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <IconButton
                icon="chart-pie"
                size={24}
                iconColor={theme.colors.primary}
                style={styles.chartIcon}
              />
              <Text variant="titleLarge" style={[styles.chartTitle, { color: theme.colors.text }]}>
                {t('goals.milestoneProgress')}
              </Text>
            </View>
            <Chip
              mode="outlined"
              style={[styles.chartChip, { backgroundColor: theme.colors.surfaceVariant }]}
              textStyle={{ color: theme.colors.textSecondary }}
            >
              {completedPercentage.toFixed(0)}% {t('goals.complete')}
            </Chip>
          </View>
          <View style={styles.chartContainer}>
            <PieChart
              data={data}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  // const renderProgressChart = () => {
  //   // Use real progress history data from analytics
  //   const progressData = analytics?.progressHistory || [];
  //   console.log('Progress chart data:', progressData);
    
  //   // If no data, show a message
  //   if (progressData.length === 0) {
  //     return (
  //       <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
  //         <Card.Content>
  //           <View style={styles.chartHeader}>
  //             <View style={styles.chartTitleContainer}>
  //               <IconButton
  //                 icon="chart-line"
  //                 size={24}
  //                 iconColor={theme.colors.primary}
  //                 style={styles.chartIcon}
  //               />
  //               <Text variant="titleLarge" style={[styles.chartTitle, { color: theme.colors.text }]}>
  //                 {t('goals.progressOverTime')} 
  //               </Text>
  //             </View>
  //             <Chip
  //               mode="outlined"
  //               style={[styles.chartChip, { backgroundColor: theme.colors.surfaceVariant }]}
  //               textStyle={{ color: theme.colors.textSecondary }}
  //             >
  //               {timeRange}
  //             </Chip>
  //           </View>
  //           <View style={[styles.noDataContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
  //             <Text variant="bodyMedium" style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
  //               {t('goals.noProgressData')}
  //             </Text>
  //           </View>
  //         </Card.Content>
  //       </Card>
  //     );
  //   }

  //   const data = {
  //     labels: progressData.map((item: { week: string, progress: number }) => item.week),
  //     datasets: [
  //       {
  //         data: progressData.map((item: { week: string, progress: number }) => item.progress),
  //         color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
  //         strokeWidth: 3,
  //       },
  //     ],
  //   };

  //   const chartConfig = {
  //     backgroundColor: theme.colors.surface,
  //     backgroundGradientFrom: theme.colors.surface,
  //     backgroundGradientTo: theme.colors.surface,
  //     decimalPlaces: 0,
  //     color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
  //     labelColor: (opacity = 1) => theme.colors.text + Math.round(opacity * 255).toString(16).padStart(2, '0'),
  //     style: {
  //       borderRadius: 16,
  //     },
  //     propsForDots: {
  //       r: '6',
  //       strokeWidth: '2',
  //       stroke: theme.colors.primary,
  //       fill: theme.colors.surface,
  //     },
  //     propsForBackgroundLines: {
  //       stroke: theme.colors.surfaceVariant,
  //       strokeWidth: 1,
  //     },
  //   };

  //   return (
  //     <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
  //       <Card.Content>
  //         <View style={styles.chartHeader}>
  //           <View style={styles.chartTitleContainer}>
  //             <IconButton
  //               icon="chart-line"
  //               size={12}
  //               iconColor={theme.colors.primary}
  //               style={styles.chartIcon}
  //             />
  //             <Text variant="titleLarge" style={[styles.chartTitle, { color: theme.colors.text }]}>
  //               {t('goals.progressOverTime')} 
  //             </Text>
  //           </View>
  //           <Chip
  //             mode="outlined"
  //             style={[styles.chartChip, { backgroundColor: theme.colors.surfaceVariant }]}
  //             textStyle={{ color: theme.colors.textSecondary }}
  //           >
  //             {timeRange}
  //           </Chip>
  //         </View>
  //         <View style={styles.chartContainer}>
  //           <LineChart
  //             data={data}
  //             width={screenWidth - 15}
  //             height={220}
  //             chartConfig={chartConfig}
  //             bezier
  //             style={styles.lineChart}
  //             withVerticalLines={false}
  //             withHorizontalLines={true}
  //             withInnerLines={true}
  //             withOuterLines={true}
  //           />
  //         </View>
  //       </Card.Content>
  //     </Card>
  //   );
  // };

  const renderInsights = () => {
    if (!analytics?.insights || analytics.insights.length === 0) return null;

    return (
      <Card style={[styles.insightsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <View style={styles.insightsHeader}>
            <IconButton
              icon="lightbulb-on"
              size={24}
              iconColor={theme.colors.warning}
              style={styles.insightsIcon}
            />
            <Text variant="titleLarge" style={[styles.insightsTitle, { color: theme.colors.text }]}>
              {t('goals.insights')}
            </Text>
          </View>
          <Divider style={[styles.insightsDivider, { backgroundColor: theme.colors.surfaceVariant }]} />
          {analytics.insights.map((insight: string, index: number) => (
            <View key={index}>
              <View style={styles.insightItem}>
                <Avatar.Icon
                  size={36}
                  icon="chart-bell-curve"
                  style={[styles.insightAvatar, { backgroundColor: theme.colors.primary + '20' }]}
                  color={theme.colors.primary}
                />
                <View style={styles.insightContent}>
                  <Text variant="bodyMedium" style={[styles.insightText, { color: theme.colors.text }]}>
                    {insight}
                  </Text>
                </View>
              </View>
              {index < analytics.insights.length - 1 && (
                <Divider style={[styles.insightDivider, { backgroundColor: theme.colors.surfaceVariant }]} />
              )}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.text }]}>
          {t('goals.loadingAnalytics')}
        </Text>
      </View>
    );
  }

  if (!currentGoal) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Avatar.Icon
          size={80}
          icon="chart-line"
          style={[styles.errorIcon, { backgroundColor: theme.colors.surfaceVariant }]}
          color={theme.colors.error}
        />
        <Text variant="headlineSmall" style={[styles.errorTitle, { color: theme.colors.text }]}>
          {t('goals.analyticsNotFound')}
        </Text>
        <Text variant="bodyMedium" style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
          {t('goals.analyticsNotFoundDescription')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Avatar.Icon
              size={40}
              icon={getGoalIcon(currentGoal.category)}
              style={[styles.headerIcon, { backgroundColor: theme.colors.primary + '20' }]}
              color={theme.colors.primary}
            />
            <View>
              <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                {t('goals.analytics')}
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {currentGoal.title}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Time Range Selector */}
      {/* <View style={[styles.timeRangeContainer, { backgroundColor: theme.colors.surface }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
          }}
        >
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.value}
              onPress={() => {
                console.log('Time range button pressed:', range.value);
                setTimeRange(range.value);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                marginRight: 8,
                backgroundColor: timeRange === range.value ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: timeRange === range.value ? theme.colors.onPrimary : theme.colors.text,
                }}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View> */}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
      {renderOverviewCards()}
        {renderTimeStatus()}
        {renderMilestoneChart()}
        {/* {renderProgressChart()} */}
        {renderInsights()}
      </ScrollView>

      {/* FAB for quick actions */}
      <FAB
        icon="refresh"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={onRefresh}
        color={theme.colors.onPrimary}
        small
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  timeRangeContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap:4,
    marginBottom: 20,
  },
  overviewCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 8,
  },
  cardIcon: {
    margin: 0,
    // marginRight: 8,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  progressText: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 12,
  },
  milestoneCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  milestoneText: {
    fontWeight: 'bold',
    fontSize: 28,
  },
  milestoneTotal: {
    fontSize: 18,
    marginLeft: 2,
  },
  milestoneProgress: {
    marginBottom: 4,
  },
  milestoneSubtext: {
    fontSize: 12,
  },
  streakText: {
    fontWeight: 'bold',
    fontSize: 28,
  },
  streakBadge: {
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 12,
  },
  timeStatusCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  timeStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeStatusIcon: {
    marginRight: 16,
  },
  timeStatusInfo: {
    flex: 1,
  },
  timeStatusTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  timeStatusText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeStatusDate: {
    fontSize: 13,
  },
  chartCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chartIcon: {
    margin: 0,
    marginRight: 8,
  },
  chartTitle: {
    fontWeight: '600',
    flex: 1,
  },
  chartChip: {
    height: 32,
  },
  chartContainer: {
    alignItems: 'center',
  },
  lineChart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  insightsCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsIcon: {
    margin: 0,
    marginRight: 8,
  },
  insightsTitle: {
    fontWeight: '600',
    flex: 1,
  },
  insightsDivider: {
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  insightAvatar: {
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
    justifyContent: 'center',
  },
  insightText: {
    lineHeight: 20,
    fontSize: 14,
  },
  insightDivider: {
    marginLeft: 48,
  },
  noDataContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  noDataText: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    elevation: 4,
  },
});