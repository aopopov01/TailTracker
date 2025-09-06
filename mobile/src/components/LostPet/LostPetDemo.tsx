import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
} from 'react-native-paper';

import { notificationService } from '../../services/NotificationService';
import { premiumLostPetService, LostPetHelpers } from '../../services/PremiumLostPetService';
import { LostPetCard, LostPetStatus, LostPetNotificationSettings } from './';

// Demo data
const demoLostPetAlert = {
  id: 'demo-1',
  pet_id: 'pet-demo',
  pet_name: 'Max',
  species: 'dog',
  breed: 'Golden Retriever',
  photo_url: 'https://example.com/max.jpg',
  last_seen_location: { lat: 40.7128, lng: -74.0060 },
  last_seen_address: '123 Main St, New York, NY',
  last_seen_date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  description: 'Friendly golden retriever, wearing a red collar with tags. Responds to Max.',
  reward_amount: 100,
  reward_currency: 'USD',
  contact_phone: '+1-555-123-4567',
  distance_km: 2.5,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

const demoPet = {
  id: 'pet-demo',
  name: 'Max',
  species: 'dog' as const,
  breed: 'Golden Retriever',
  photos: ['https://example.com/max.jpg'],
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: 'user-demo',
  profileCompleteness: 85,
};

export const LostPetDemo: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (message: string, success: boolean = true) => {
    const emoji = success ? '✅' : '❌';
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`${emoji} [${timestamp}] ${message}`, ...prev]);
  };

  const testLocationPermissions = async () => {
    try {
      setLoading(true);
      addTestResult('Testing location permissions...');
      
      const hasPermission = await premiumLostPetService.checkLocationPermission();
      if (hasPermission) {
        addTestResult('Location permission already granted');
      } else {
        const granted = await premiumLostPetService.requestLocationPermission();
        addTestResult(granted ? 'Location permission granted' : 'Location permission denied', granted);
      }
    } catch (error) {
      addTestResult('Location permission test failed', false);
    } finally {
      setLoading(false);
    }
  };

  const testGetCurrentLocation = async () => {
    try {
      setLoading(true);
      addTestResult('Getting current location...');
      
      const location = await premiumLostPetService.getCurrentLocation();
      if (location) {
        addTestResult(`Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      } else {
        addTestResult('Failed to get current location', false);
      }
    } catch (error) {
      addTestResult('Get location test failed', false);
    } finally {
      setLoading(false);
    }
  };

  const testPremiumAccess = async () => {
    try {
      setLoading(true);
      addTestResult('Checking premium access...');
      
      const hasPremium = await premiumLostPetService.checkPremiumAccess();
      addTestResult(hasPremium ? 'Premium access confirmed' : 'Premium access required');
    } catch (error) {
      addTestResult('Premium access check failed', false);
    } finally {
      setLoading(false);
    }
  };

  const testNearbyAlerts = async () => {
    try {
      setLoading(true);
      addTestResult('Fetching nearby alerts...');
      
      const result = await premiumLostPetService.getNearbyAlerts(25);
      if (result.success) {
        addTestResult(`Found ${result.count || 0} nearby alerts`);
      } else {
        addTestResult(`Nearby alerts failed: ${result.error}`, false);
      }
    } catch (error) {
      addTestResult('Nearby alerts test failed', false);
    } finally {
      setLoading(false);
    }
  };

  const testNotifications = async () => {
    try {
      setLoading(true);
      addTestResult('Testing push notifications...');
      
      await notificationService.testNotification();
      addTestResult('Test notification scheduled');
    } catch (error) {
      addTestResult('Notification test failed', false);
    } finally {
      setLoading(false);
    }
  };

  const testHelpers = () => {
    try {
      addTestResult('Testing helper functions...');
      
      // Test time formatting
      const timeAgo = LostPetHelpers.formatTimeAgo(demoLostPetAlert.last_seen_date);
      addTestResult(`Time helper: "${timeAgo}"`);
      
      // Test urgency level
      const urgency = LostPetHelpers.getUrgencyLevel(demoLostPetAlert.last_seen_date);
      addTestResult(`Urgency helper: "${urgency}"`);
      
      // Test species icon
      const icon = LostPetHelpers.getSpeciesIcon(demoLostPetAlert.species);
      addTestResult(`Species icon: ${icon}`);
      
      // Test distance formatting
      const distance = premiumLostPetService.formatDistance(demoLostPetAlert.distance_km);
      addTestResult(`Distance helper: "${distance}"`);
      
      // Test reward formatting
      const reward = premiumLostPetService.formatReward(demoLostPetAlert.reward_amount);
      addTestResult(`Reward helper: "${reward}"`);
      
    } catch (error) {
      addTestResult('Helper functions test failed', false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    clearResults();
    addTestResult('Starting comprehensive test suite...');
    
    await testLocationPermissions();
    await testGetCurrentLocation();
    await testPremiumAccess();
    await testNearbyAlerts();
    await testNotifications();
    testHelpers();
    
    addTestResult('All tests completed!');
    
    Alert.alert(
      'Testing Complete',
      'Check the test results below for detailed information about the lost pet functionality.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Lost Pet Feature Demo & Testing</Text>
          <Text style={styles.description}>
            This demo allows you to test the premium lost pet functionality and see component examples.
          </Text>
        </Card.Content>
      </Card>

      {/* Component Demos */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Component Examples</Text>
          
          <Text style={styles.subsection}>Lost Pet Status Component:</Text>
          <LostPetStatus 
            pet={demoPet}
            onStatusChange={() => console.log('Status changed')}
          />
          
          <Divider style={styles.divider} />
          
          <Text style={styles.subsection}>Lost Pet Card Component:</Text>
          <LostPetCard
            alert={demoLostPetAlert}
            onFoundPress={() => Alert.alert('Demo', 'Pet marked as found!')}
            onCallPress={() => Alert.alert('Demo', 'Calling owner...')}
          />

          <Divider style={styles.divider} />
          
          <Text style={styles.subsection}>Notification Settings:</Text>
          <LostPetNotificationSettings showTitle={false} />
        </Card.Content>
      </Card>

      {/* Testing Controls */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Feature Testing</Text>
          
          <View style={styles.testButtons}>
            <Button
              mode="outlined"
              onPress={testLocationPermissions}
              loading={loading}
              disabled={loading}
              style={styles.testButton}
              compact
            >
              Test Location
            </Button>
            
            <Button
              mode="outlined"
              onPress={testPremiumAccess}
              loading={loading}
              disabled={loading}
              style={styles.testButton}
              compact
            >
              Test Premium
            </Button>
            
            <Button
              mode="outlined"
              onPress={testNearbyAlerts}
              loading={loading}
              disabled={loading}
              style={styles.testButton}
              compact
            >
              Test Alerts
            </Button>
            
            <Button
              mode="outlined"
              onPress={testNotifications}
              loading={loading}
              disabled={loading}
              style={styles.testButton}
              compact
            >
              Test Notifications
            </Button>
          </View>

          <View style={styles.mainActions}>
            <Button
              mode="contained"
              onPress={runAllTests}
              loading={loading}
              disabled={loading}
              style={styles.runAllButton}
              icon="test-tube"
            >
              Run All Tests
            </Button>
            
            <Button
              mode="outlined"
              onPress={clearResults}
              style={styles.clearButton}
            >
              Clear Results
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Test Results</Text>
            
            <View style={styles.resultsContainer}>
              {testResults.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultText}>{result}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Feature Information */}
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Feature Overview</Text>
          
          <View style={styles.featureList}>
            <Chip icon="check" style={styles.featureChip}>Location Services</Chip>
            <Chip icon="check" style={styles.featureChip}>Premium Gating</Chip>
            <Chip icon="check" style={styles.featureChip}>Push Notifications</Chip>
            <Chip icon="check" style={styles.featureChip}>Regional Alerts</Chip>
            <Chip icon="check" style={styles.featureChip}>Map Integration</Chip>
            <Chip icon="check" style={styles.featureChip}>Database Schema</Chip>
          </View>
          
          <Text style={styles.info}>
            The premium lost pet feature includes:
            {'\n'}• Location-based pet reporting
            {'\n'}• Regional push notifications
            {'\n'}• Community-driven search assistance
            {'\n'}• Reward system integration
            {'\n'}• Real-time status updates
            {'\n'}• Premium access validation
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  lastCard: {
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subsection: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  testButton: {
    flex: 1,
    minWidth: 100,
  },
  mainActions: {
    flexDirection: 'row',
    gap: 8,
  },
  runAllButton: {
    flex: 2,
  },
  clearButton: {
    flex: 1,
  },
  resultsContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  resultItem: {
    marginBottom: 4,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00FF00',
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  featureChip: {
    backgroundColor: '#E8F5E8',
  },
  info: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default LostPetDemo;