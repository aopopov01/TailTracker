import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  RefreshControl 
} from 'react-native';
import { format } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import { wellnessService, WellnessHelpers } from '../../src/services/WellnessService';
import { CareTask, WellnessAlert } from '../../src/types/Wellness';

const { width: screenWidth } = Dimensions.get('window');

export default function WellnessDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPetId] = useState<string | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<CareTask[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<WellnessAlert[]>([]);
  const [wellnessScore, setWellnessScore] = useState<number>(0);
  const [complianceRate, setComplianceRate] = useState<number>(0);
  const [wellnessData, setWellnessData] = useState<number[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      // For demo purposes, using a mock pet ID
      const petId = selectedPetId ?? 'pet_demo_001';
      
      const tasks = wellnessService.getTodaysTasks(petId);
      const alerts = wellnessService.getWellnessAlerts(petId).slice(0, 3);
      const score = wellnessService.getWellnessScore(petId);
      const compliance = wellnessService.getComplianceRate(petId);
      
      // Generate mock wellness data for chart
      const mockData = Array.from({ length: 7 }, (_, i) => Math.floor(Math.random() * 3) + 7);
      
      setTodaysTasks(tasks);
      setRecentAlerts(alerts);
      setWellnessScore(score ?? 8);
      setComplianceRate(compliance ?? 85);
      setWellnessData(mockData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [selectedPetId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await wellnessService.completeCareTask(taskId);
      await loadDashboardData();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const renderWellnessChart = () => {
    const chartData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: wellnessData,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={180}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#4CAF50',
          },
        }}
        bezier
        style={styles.chartStyle}
      />
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wellness Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {format(new Date(), 'EEEE, MMMM do')}
        </Text>
      </View>

      {/* Wellness Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Overall Wellness</Text>
          <View style={styles.scoreContainer}>
            <Text style={[
              styles.scoreValue, 
              { color: WellnessHelpers.getWellnessScoreColor(wellnessScore) }
            ]}>
              {wellnessScore}
            </Text>
            <Text style={styles.scoreOutOf}>/10</Text>
          </View>
          <Text style={styles.scoreDescription}>
            {WellnessHelpers.getWellnessScoreDescription(wellnessScore)}
          </Text>
        </View>
        
        <View style={styles.complianceSection}>
          <Text style={styles.complianceLabel}>Care Compliance</Text>
          <Text style={styles.complianceValue}>{complianceRate}%</Text>
          <View style={styles.complianceBar}>
            <View 
              style={[
                styles.complianceProgress, 
                { width: `${complianceRate}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Wellness Trend Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Wellness Trend (Last 7 Days)</Text>
        {renderWellnessChart()}
      </View>

      {/* Today's Care Tasks */}
      <View style={styles.tasksCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Care Tasks</Text>
          <Text style={styles.taskCount}>{todaysTasks.length}</Text>
        </View>
        
        {todaysTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>🎉 All caught up!</Text>
            <Text style={styles.emptyStateSubtext}>No tasks scheduled for today</Text>
          </View>
        ) : (
          todaysTasks.slice(0, 4).map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskIcon}>
                  {WellnessHelpers.getTaskTypeIcon(task.type)}
                </Text>
                <View style={styles.taskDetails}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskTime}>
                    {format(new Date(task.dueDate), 'h:mm a')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  { backgroundColor: WellnessHelpers.getPriorityColor(task.priority) }
                ]}
                onPress={() => handleCompleteTask(task.id)}
              >
                <Text style={styles.completeButtonText}>✓</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        
        {todaysTasks.length > 4 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>
              View All ({todaysTasks.length - 4} more)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.cardTitle}>Recent Alerts</Text>
          {recentAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View 
                style={[
                  styles.alertIndicator,
                  { backgroundColor: WellnessHelpers.getSeverityColor(alert.severity) }
                ]}
              />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {format(new Date(alert.createdAt), 'MMM dd, h:mm a')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Add Metrics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💊</Text>
            <Text style={styles.actionText}>Log Medication</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🏥</Text>
            <Text style={styles.actionText}>Schedule Vet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pet Health Summary */}
      <View style={styles.healthCard}>
        <Text style={styles.cardTitle}>Health Summary</Text>
        <View style={styles.healthMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricIcon}>⚖️</Text>
            <Text style={styles.metricLabel}>Weight</Text>
            <Text style={styles.metricValue}>12.5 kg</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricIcon}>❤️</Text>
            <Text style={styles.metricLabel}>Activity</Text>
            <Text style={styles.metricValue}>High</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricIcon}>😊</Text>
            <Text style={styles.metricLabel}>Mood</Text>
            <Text style={styles.metricValue}>9/10</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricIcon}>🍽️</Text>
            <Text style={styles.metricLabel}>Appetite</Text>
            <Text style={styles.metricValue}>Excellent</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  scoreCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreOutOf: {
    fontSize: 18,
    color: '#999',
    marginLeft: 4,
  },
  scoreDescription: {
    fontSize: 12,
    color: '#666',
  },
  complianceSection: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    paddingLeft: 20,
  },
  complianceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  complianceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  complianceBar: {
    width: 60,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  complianceProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  tasksCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskCount: {
    backgroundColor: '#e3f2fd',
    color: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  taskTime: {
    fontSize: 12,
    color: '#666',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  alertsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 10,
    color: '#999',
  },
  actionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  healthCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  healthMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});