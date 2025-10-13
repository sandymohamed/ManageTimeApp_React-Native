import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  useTheme,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
  ProgressBar,
  IconButton
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

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
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showError } = useNotification();

  const { currentGoal, fetchGoal, getGoalAnalytics, isLoading } = useGoalStore();

  const [analytics, setAnalytics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const timeRanges = [
    { value: 'week', label: t('analytics.week') },
    { value: 'month', label: t('analytics.month') },
    { value: 'quarter', label: t('analytics.quarter') },
    { value: 'year', label: t('analytics.year') },
    { value: 'all', label: t('analytics.all') },
  ];

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
      const data = await getGoalAnalytics(route.params.goalId, timeRange);
      setAnalytics(data);
    } catch (error: any) {
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
    if (progress >= 80) return '#4CAF50';
    if (progress >= 60) return '#8BC34A';
    if (progress >= 40) return '#FFC107';
    if (progress >= 20) return '#FF9800';
    return '#F44336';
  };

  const getTimeStatus = () => {
    if (!currentGoal?.targetDate) return null;
    
    const target = new Date(currentGoal.targetDate);
    const now = new Date();
    const daysLeft = differenceInDays(target, now);
    
    if (isBefore(target, now)) {
      return { text: t('goals.overdue'), color: '#F44336', icon: 'alert-circle' };
    }
    
    if (daysLeft <= 7) {
      return { text: t('goals.dueInDays', { days: daysLeft }), color: '#FF9800', icon: 'clock-alert' };
    }
    
    return { text: t('goals.dueInDays', { days: daysLeft }), color: '#4CAF50', icon: 'clock' };
  };

  const renderOverviewCards = () => {
    if (!analytics || !currentGoal) return null;

    return (
      <View style={styles.overviewContainer}>
        <Card style={styles.overviewCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('goals.progress')}
              </Text>
              <Text variant="headlineSmall" style={[styles.progressText, { color: getProgressColor(analytics.progress) }]}>
                {analytics.progress}%
              </Text>
            </View>
            <ProgressBar
              progress={analytics.progress / 100}
              color={getProgressColor(analytics.progress)}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        <Card style={styles.overviewCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('goals.milestones')}
              </Text>
              <Text variant="headlineSmall" style={styles.milestoneText}>
                {analytics.completedMilestones}/{analytics.totalMilestones}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.milestoneSubtext}>
              {t('goals.completed')}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.overviewCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('goals.streak')}
              </Text>
              <Text variant="headlineSmall" style={styles.streakText}>
                {analytics.streak}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.streakSubtext}>
              {t('goals.daysInARow')}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderMilestoneChart = () => {
    if (!analytics || analytics.totalMilestones === 0) return null;

    const data = [
      {
        name: t('goals.completed'),
        population: analytics.completedMilestones,
        color: '#4CAF50',
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
      {
        name: t('goals.remaining'),
        population: analytics.totalMilestones - analytics.completedMilestones,
        color: '#E0E0E0',
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
    ];

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            {t('goals.milestoneProgress')}
          </Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={data}
              width={Dimensions.get('window').width - 80}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
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

  const renderProgressChart = () => {
    // Mock data for progress over time
    const data = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          data: [0, 25, 50, analytics?.progress || 0],
          color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    const chartConfig = {
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${theme.colors.text.replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: theme.colors.primary,
      },
    };

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            {t('goals.progressOverTime')}
          </Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={data}
              width={Dimensions.get('window').width - 80}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.lineChart}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderInsights = () => {
    if (!analytics?.insights || analytics.insights.length === 0) return null;

    return (
      <Card style={styles.insightsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.insightsTitle}>
            {t('goals.insights')}
          </Text>
          {analytics.insights.map((insight: string, index: number) => (
            <View key={index} style={styles.insightItem}>
              <IconButton
                icon="lightbulb"
                size={20}
                iconColor={theme.colors.primary}
                style={styles.insightIcon}
              />
              <Text variant="bodyMedium" style={styles.insightText}>
                {insight}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderTimeStatus = () => {
    const timeStatus = getTimeStatus();
    if (!timeStatus) return null;

    return (
      <Card style={[styles.timeStatusCard, { borderLeftColor: timeStatus.color }]}>
        <Card.Content>
          <View style={styles.timeStatusHeader}>
            <IconButton
              icon={timeStatus.icon}
              size={24}
              iconColor={timeStatus.color}
            />
            <View style={styles.timeStatusInfo}>
              <Text variant="titleMedium" style={styles.timeStatusTitle}>
                {t('goals.targetDate')}
              </Text>
              <Text variant="bodyLarge" style={[styles.timeStatusText, { color: timeStatus.color }]}>
                {timeStatus.text}
              </Text>
              {currentGoal?.targetDate && (
                <Text variant="bodySmall" style={styles.timeStatusDate}>
                  {format(new Date(currentGoal.targetDate), 'MMM dd, yyyy')}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          {t('goals.loading')}
        </Text>
      </View>
    );
  }

  if (!currentGoal) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text variant="headlineSmall" style={styles.errorTitle}>
          {t('goals.goalNotFound')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
          {t('goals.analytics')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {currentGoal.title}
        </Text>
      </View>

      <View style={styles.timeRangeContainer}>
        <SegmentedButtons
          value={timeRange}
          onValueChange={setTimeRange}
          buttons={timeRanges}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderOverviewCards()}
        {renderTimeStatus()}
        {renderMilestoneChart()}
        {renderProgressChart()}
        {renderInsights()}
      </ScrollView>
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
    color: theme.colors.text,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    marginBottom: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  timeRangeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
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
    gap: 12,
    marginBottom: 16,
  },
  overviewCard: {
    flex: 1,
    minWidth: '30%',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressText: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  milestoneText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  milestoneSubtext: {
    color: theme.colors.textSecondary,
  },
  streakText: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  streakSubtext: {
    color: theme.colors.textSecondary,
  },
  timeStatusCard: {
    borderLeftWidth: 4,
    marginBottom: 16,
    elevation: 2,
  },
  timeStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeStatusInfo: {
    flex: 1,
    marginLeft: 8,
  },
  timeStatusTitle: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  timeStatusText: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  timeStatusDate: {
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chartCard: {
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: theme.colors.text,
  },
  chartContainer: {
    alignItems: 'center',
  },
  lineChart: {
    borderRadius: 16,
  },
  insightsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  insightsTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: theme.colors.text,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    margin: 0,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
