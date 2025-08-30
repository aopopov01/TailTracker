import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { format, parseISO } from 'date-fns';

const { width: screenWidth } = Dimensions.get('window');

interface WellnessChartProps {
  type: 'line' | 'bar' | 'pie';
  data: WellnessChartData;
  title?: string;
  color?: string;
  height?: number;
  showLegend?: boolean;
}

interface WellnessChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
}

interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

export const WellnessChart: React.FC<WellnessChartProps> = ({
  type,
  data,
  title,
  color = '#4CAF50',
  height = 200,
  showLegend = false,
}) => {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => color.replace('1)', `${opacity})`).replace('rgb', 'rgba'),
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: '#e0e0e0',
    },
  };

  const chartWidth = screenWidth - 40;

  const renderLineChart = () => (
    <LineChart
      data={data}
      width={chartWidth}
      height={height}
      chartConfig={chartConfig}
      bezier
      style={styles.chart}
      withHorizontalLabels={true}
      withVerticalLabels={true}
      withInnerLines={true}
      withOuterLines={true}
      withHorizontalLines={true}
      withVerticalLines={false}
    />
  );

  const renderBarChart = () => (
    <BarChart
      data={data}
      width={chartWidth}
      height={height}
      chartConfig={chartConfig}
      style={styles.chart}
      yAxisLabel=""
      yAxisSuffix=""
      showValuesOnTopOfBars={true}
      withHorizontalLabels={true}
      withInnerLines={true}
    />
  );

  const renderPieChart = () => {
    // Convert data to pie chart format
    const pieData: PieChartDataItem[] = data.labels.map((label, index) => ({
      name: label,
      value: data.datasets[0]?.data[index] || 0,
      color: generateColorForIndex(index),
      legendFontColor: '#333',
      legendFontSize: 12,
    }));

    return (
      <PieChart
        data={pieData}
        width={chartWidth}
        height={height}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        style={styles.chart}
        center={[chartWidth / 4, 0]}
        hasLegend={showLegend}
      />
    );
  };

  const generateColorForIndex = (index: number): string => {
    const colors = [
      '#4CAF50',
      '#2196F3', 
      '#FF9800',
      '#F44336',
      '#9C27B0',
      '#00BCD4',
      '#FFEB3B',
      '#795548'
    ];
    return colors[index % colors.length];
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {renderChart()}
    </View>
  );
};

// Specialized wellness charts
interface WeightTrackingChartProps {
  weightData: { date: string; weight: number }[];
  targetWeight?: number;
  height?: number;
}

export const WeightTrackingChart: React.FC<WeightTrackingChartProps> = ({
  weightData,
  targetWeight,
  height = 200,
}) => {
  const chartData = {
    labels: weightData.slice(-7).map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        data: weightData.slice(-7).map(item => item.weight),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      },
      ...(targetWeight ? [{
        data: Array(Math.min(7, weightData.length)).fill(targetWeight),
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        strokeWidth: 2,
        withDots: false,
      }] : []),
    ],
    legend: targetWeight ? ['Actual Weight', 'Target Weight'] : ['Weight'],
  };

  return (
    <WellnessChart
      type="line"
      data={chartData}
      title="Weight Tracking"
      color="#4CAF50"
      height={height}
      showLegend={true}
    />
  );
};

interface ActivityChartProps {
  activityData: { date: string; level: number }[];
  height?: number;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  activityData,
  height = 200,
}) => {
  const chartData = {
    labels: activityData.slice(-7).map(item => format(parseISO(item.date), 'EEE')),
    datasets: [
      {
        data: activityData.slice(-7).map(item => item.level),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <WellnessChart
      type="bar"
      data={chartData}
      title="Activity Level"
      color="#2196F3"
      height={height}
    />
  );
};

interface MoodChartProps {
  moodData: { date: string; mood: number }[];
  height?: number;
}

export const MoodChart: React.FC<MoodChartProps> = ({
  moodData,
  height = 200,
}) => {
  const chartData = {
    labels: moodData.slice(-7).map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        data: moodData.slice(-7).map(item => item.mood),
        color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <WellnessChart
      type="line"
      data={chartData}
      title="Mood Tracking"
      color="#9C27B0"
      height={height}
    />
  );
};

interface CareComplianceChartProps {
  complianceData: {
    completed: number;
    overdue: number;
    pending: number;
    total: number;
  };
  height?: number;
}

export const CareComplianceChart: React.FC<CareComplianceChartProps> = ({
  complianceData,
  height = 200,
}) => {
  const pieData = [
    {
      name: 'Completed',
      value: complianceData.completed,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Pending',
      value: complianceData.pending,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Overdue',
      value: complianceData.overdue,
      color: '#F44336',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ].filter(item => item.value > 0);

  const chartData = {
    labels: pieData.map(item => item.name),
    datasets: [{ data: pieData.map(item => item.value) }],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Care Task Compliance</Text>
      <PieChart
        data={pieData}
        width={screenWidth - 40}
        height={height}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        style={styles.chart}
        center={[(screenWidth - 40) / 4, 0]}
        hasLegend={true}
      />
      <View style={styles.complianceStats}>
        <Text style={styles.complianceText}>
          {Math.round((complianceData.completed / complianceData.total) * 100)}% Complete
        </Text>
        <Text style={styles.complianceSubtext}>
          {complianceData.completed} of {complianceData.total} tasks
        </Text>
      </View>
    </View>
  );
};

interface HealthMetricsOverviewProps {
  metrics: {
    weight: { current: number; target: number; trend: 'up' | 'down' | 'stable' };
    activity: { level: number; trend: 'up' | 'down' | 'stable' };
    mood: { score: number; trend: 'up' | 'down' | 'stable' };
    appetite: { score: number; trend: 'up' | 'down' | 'stable' };
  };
}

export const HealthMetricsOverview: React.FC<HealthMetricsOverviewProps> = ({
  metrics,
}) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      case 'stable': return '#FF9800';
    }
  };

  return (
    <View style={styles.metricsContainer}>
      <Text style={styles.title}>Health Metrics Overview</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>⚖️</Text>
            <Text style={styles.metricTrend} style={[styles.metricTrend, { color: getTrendColor(metrics.weight.trend) }]}>
              {getTrendIcon(metrics.weight.trend)}
            </Text>
          </View>
          <Text style={styles.metricValue}>{metrics.weight.current} kg</Text>
          <Text style={styles.metricLabel}>Weight</Text>
          <Text style={styles.metricTarget}>Target: {metrics.weight.target} kg</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>🏃</Text>
            <Text style={[styles.metricTrend, { color: getTrendColor(metrics.activity.trend) }]}>
              {getTrendIcon(metrics.activity.trend)}
            </Text>
          </View>
          <Text style={styles.metricValue}>{metrics.activity.level}/10</Text>
          <Text style={styles.metricLabel}>Activity</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>😊</Text>
            <Text style={[styles.metricTrend, { color: getTrendColor(metrics.mood.trend) }]}>
              {getTrendIcon(metrics.mood.trend)}
            </Text>
          </View>
          <Text style={styles.metricValue}>{metrics.mood.score}/10</Text>
          <Text style={styles.metricLabel}>Mood</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>🍽️</Text>
            <Text style={[styles.metricTrend, { color: getTrendColor(metrics.appetite.trend) }]}>
              {getTrendIcon(metrics.appetite.trend)}
            </Text>
          </View>
          <Text style={styles.metricValue}>{metrics.appetite.score}/10</Text>
          <Text style={styles.metricLabel}>Appetite</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  complianceStats: {
    alignItems: 'center',
    marginTop: 16,
  },
  complianceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  complianceSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  metricsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  metricIcon: {
    fontSize: 24,
  },
  metricTrend: {
    fontSize: 16,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricTarget: {
    fontSize: 10,
    color: '#999',
  },
});