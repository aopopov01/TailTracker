import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CommunityAlert {
  id: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  lastSeenAddress: string;
  description: string;
  contactPhone?: string;
  rewardAmount?: number;
  urgencyLevel: 'high' | 'medium' | 'low';
  isActive: boolean;
  createdAt: Date;
  distance: string; // e.g., "2.3 km away"
}

export default function CommunityAlertsScreen() {
  const [alerts, setAlerts] = useState<CommunityAlert[]>([]);

  useEffect(() => {
    loadCommunityAlerts();
  }, []);

  const loadCommunityAlerts = async () => {
    try {
      // Mock data for community lost pet alerts
      const mockAlerts: CommunityAlert[] = [
        {
          id: '1',
          petId: 'pet1',
          petName: 'Buddy',
          petSpecies: 'Dog',
          petBreed: 'Golden Retriever',
          lastSeenAddress: '123 Main Street, Downtown',
          description: 'Friendly golden retriever wearing a red collar. Responds to "Buddy". Last seen near the park.',
          contactPhone: '(555) 123-4567',
          rewardAmount: 200,
          urgencyLevel: 'high',
          isActive: true,
          createdAt: new Date('2024-01-20T10:30:00'),
          distance: '2.3 km away'
        },
        {
          id: '2',
          petId: 'pet2',
          petName: 'Whiskers',
          petSpecies: 'Cat',
          petBreed: 'Persian',
          lastSeenAddress: '456 Oak Avenue, Midtown',
          description: 'White Persian cat with blue eyes. Very shy, may be hiding. Indoor cat that got out.',
          urgencyLevel: 'medium',
          isActive: true,
          createdAt: new Date('2024-01-19T15:45:00'),
          distance: '5.7 km away'
        }
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading community alerts:', error);
    }
  };

  const handleContactOwner = (alert: CommunityAlert) => {
    if (alert.contactPhone) {
      Alert.alert(
        'Contact Pet Owner',
        `Call ${alert.contactPhone} to report sighting of ${alert.petName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call Now', onPress: () => {
            // In a real app, this would open the phone dialer
            Alert.alert('Calling...', `This would dial ${alert.contactPhone}`);
          }}
        ]
      );
    } else {
      Alert.alert(
        'Report Sighting',
        'This would allow you to report a sighting through the app messaging system.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleReportSighting = (alert: CommunityAlert) => {
    Alert.alert(
      'Report Sighting',
      `Have you seen ${alert.petName}? This will send your contact information to the pet owner.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report Sighting', onPress: () => {
          Alert.alert('Thank You!', 'Your sighting report has been sent to the pet owner. They will contact you soon.');
        }}
      ]
    );
  };

  const AlertCard = ({ alert }: { alert: CommunityAlert }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <View style={styles.petHeader}>
            <Text style={styles.petName}>{alert.petName}</Text>
            <View style={[styles.urgencyBadge, 
              alert.urgencyLevel === 'high' ? styles.urgencyHigh :
              alert.urgencyLevel === 'medium' ? styles.urgencyMedium : styles.urgencyLow
            ]}>
              <Text style={styles.urgencyText}>{alert.urgencyLevel.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.petDetails}>{alert.petSpecies} • {alert.petBreed}</Text>
          <Text style={styles.alertLocation}>📍 {alert.lastSeenAddress}</Text>
          <Text style={styles.distance}>{alert.distance}</Text>
          <Text style={styles.description}>{alert.description}</Text>
          {alert.rewardAmount && (
            <Text style={styles.reward}>💰 Reward: ${alert.rewardAmount}</Text>
          )}
        </View>
      </View>
      <View style={styles.alertActions}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleContactOwner(alert)}
        >
          <Ionicons name="call-outline" size={20} color="#4CAF50" />
          <Text style={styles.contactText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sightingButton}
          onPress={() => handleReportSighting(alert)}
        >
          <Ionicons name="eye-outline" size={20} color="#2196F3" />
          <Text style={styles.sightingText}>Report Sighting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Lost Pet Alerts</Text>
        <Text style={styles.subtitle}>
          Help reunite missing pets with their families in your area
        </Text>
      </View>

      <View style={styles.alertsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Lost Pet Alerts</Text>
          <Text style={styles.sectionSubtitle}>Within 10km of your area</Text>
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No Lost Pets Nearby</Text>
            <Text style={styles.emptySubtitle}>
              Great news! There are currently no missing pets in your area. Check back later to help reunite pets with their families.
            </Text>
          </View>
        ) : (
          alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How Community Alerts Work</Text>
        <Text style={styles.infoText}>
          • Receive notifications about missing pets within 10km of your area{'\n'}
          • Help pet owners by reporting sightings and providing contact information{'\n'}
          • Pro tier users can report their own lost pets to the community{'\n'}
          • All users receive community alerts to help reunite families{'\n'}
          • Contact pet owners directly or report sightings through the app
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  permissionSection: {
    margin: 15,
  },
  permissionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  permissionStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  alertsSection: {
    margin: 15,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    marginBottom: 10,
  },
  alertInfo: {
    flex: 1,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  urgencyHigh: {
    backgroundColor: '#F44336',
  },
  urgencyMedium: {
    backgroundColor: '#FF9800',
  },
  urgencyLow: {
    backgroundColor: '#4CAF50',
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  distance: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  reward: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
  },
  contactText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  sightingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
  },
  sightingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    margin: 15,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});