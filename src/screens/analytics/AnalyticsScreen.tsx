import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Dimensions} from 'react-native';
import {Text, Card, SegmentedButtons, Chip} from 'react-native-paper';
import {LineChart, BarChart, PieChart} from 'react-native-chart-kit';
import {theme} from '@/utils/theme';

const screenWidth = Dimensions.get('window').width;

export const AnalyticsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Mock data
  const productivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [8, 6, 9, 7, 8, 4, 5],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const taskCompletionData = {
    labels: ['Completed', 'In Progress', 'Pending'],
    data: [65, 25, 10],
  };

  const categoryData = {
    labels: ['Work', 'Personal', 'Learning', 'Health'],
    data: [40, 30, 20, 10],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const stats = [
    {label: 'Tasks Completed', value: '45', change: '+12%'},
    {label: 'Goals Achieved', value: '3', change: '+1'},
    {label: 'Productivity Score', value: '87%', change: '+5%'},
    {label: 'Time Tracked', value: '32h', change: '+8h'},
  ];

  const renderStatCard = (stat: any, index: number) => (
    <Card key={index} style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <Text variant="headlineSmall" style={styles.statValue}>
          {stat.value}
        </Text>
        <Text variant="bodyMedium" style={styles.statLabel}>
          {stat.label}
        </Text>
        <Chip
          mode="outlined"
          compact
          textStyle={styles.changeText}
          style={styles.changeChip}>
          {stat.change}
        </Chip>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Analytics
        </Text>
        <SegmentedButtons
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          buttons={[
            {value: '7d', label: '7D'},
            {value: '30d', label: '30D'},
            {value: '90d', label: '90D'},
            {value: '1y', label: '1Y'},
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => renderStatCard(stat, index))}
      </View>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            Daily Productivity
          </Text>
          <LineChart
            data={productivityData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <View style={styles.chartsRow}>
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              Task Status
            </Text>
            <PieChart
              data={taskCompletionData.data.map((value, index) => ({
                name: taskCompletionData.labels[index],
                population: value,
                color: ['#4CAF50', '#FF9800', '#F44336'][index],
                legendFontColor: theme.colors.text,
                legendFontSize: 12,
              }))}
              width={screenWidth / 2 - 24}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              Categories
            </Text>
            <PieChart
              data={categoryData.data.map((value, index) => ({
                name: categoryData.labels[index],
                population: value,
                color: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'][index],
                legendFontColor: theme.colors.text,
                legendFontSize: 12,
              }))}
              width={screenWidth / 2 - 24}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.insightsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            Insights
          </Text>
          <View style={styles.insightItem}>
            <Text variant="bodyMedium" style={styles.insightText}>
              • You're most productive on Wednesdays
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text variant="bodyMedium" style={styles.insightText}>
              • Work tasks make up 40% of your activities
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text variant="bodyMedium" style={styles.insightText}>
              • Your productivity has increased by 12% this month
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text variant="bodyMedium" style={styles.insightText}>
              • Consider setting more personal goals
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.primary,
  },
  segmentedButtons: {
    marginLeft: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: '48%',
    margin: '1%',
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  changeChip: {
    alignSelf: 'center',
  },
  changeText: {
    fontSize: 12,
    color: theme.colors.success,
  },
  chartCard: {
    margin: theme.spacing.sm,
  },
  chartTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: 16,
  },
  chartsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
  },
  insightsCard: {
    margin: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  insightItem: {
    marginBottom: theme.spacing.sm,
  },
  insightText: {
    color: theme.colors.textSecondary,
  },
});
