import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  OfflineStatusBar,
  SyncProgressModal,
  ConflictResolutionModal,
} from '../components/Offline';
import {
  useOffline,
  useOfflinePets,
  useOfflineSync,
  useOfflineLostPets,
  useOfflineStatus,
} from '../contexts/OfflineContext';

/**
 * Complete example showing how to integrate all offline features
 * This demonstrates the recommended patterns and best practices
 */
export const OfflineIntegrationExample: React.FC = () => {
  const {
    isReady,
    manager,
    dataLayer,
    syncEngine,
    lostPetService,
  } = useOffline();

  const {
    pets,
    loading: petsLoading,
    createPet,
    updatePet,
    deletePet,
  } = useOfflinePets();

  const {
    isSyncing,
    syncProgress,
    forceSync,
    hasConflicts,
    conflicts,
    resolveConflict,
    canSync,
  } = useOfflineSync();

  const {
    createLostPetReport,
    addEmergencyContact,
  } = useOfflineLostPets();

  const {
    networkState,
    status,
    health,
    refreshStatus,
  } = useOfflineStatus();

  // UI State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Monitor conflicts
  useEffect(() => {
    if (hasConflicts && conflicts.length > 0) {
      setShowConflictModal(true);
    }
  }, [hasConflicts, conflicts]);

  // Example: Creating a pet with offline support
  const handleCreateExamplePet = async () => {
    try {
      const examplePet = {
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
        weight: 65,
        color: 'Golden',
        microchipId: 'CHIP123456789',
        description: 'Friendly and energetic dog',
      };

      const petId = await createPet(examplePet);
      
      Alert.alert(
        'Pet Created!',
        `${examplePet.name} has been created ${networkState.isConnected ? 'and will sync' : 'offline and will sync when online'}`
      );

      console.log('Created pet with ID:', petId);
    } catch (error) {
      console.error('Failed to create pet:', error);
      Alert.alert('Error', 'Failed to create pet. Please try again.');
    }
  };

  // Example: Creating a lost pet report (priority sync)
  const handleCreateLostPetReport = async () => {
    if (pets.length === 0) {
      Alert.alert('No Pets', 'Please create a pet first before reporting as lost.');
      return;
    }

    try {
      const firstPet = pets[0];
      const lostPetReport = {
        description: `${firstPet.name} is missing from the park area`,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
          address: 'Golden Gate Park, San Francisco, CA'
        },
        contactInfo: {
          phone: '(555) 123-4567',
          email: 'owner@example.com'
        },
        lastSeenTime: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        circumstances: 'Last seen playing in the dog park around 2 PM',
        urgencyLevel: 'HIGH' as const,
        alertRadius: 5, // 5km radius
        photos: [],
      };

      const reportId = await createLostPetReport(firstPet.id, lostPetReport);
      
      Alert.alert(
        'Lost Pet Report Created!',
        'Your lost pet report has been created with high priority. Nearby users will be notified.'
      );

      console.log('Created lost pet report with ID:', reportId);
    } catch (error) {
      console.error('Failed to create lost pet report:', error);
      Alert.alert('Error', 'Failed to create lost pet report. Please try again.');
    }
  };

  // Example: Adding emergency contact
  const handleAddEmergencyContact = async () => {
    try {
      const emergencyContact = {
        name: 'Dr. Smith',
        relationship: 'Veterinarian',
        phone: '(555) 987-6543',
        email: 'drsmith@vetclinic.com',
        isVet: true,
        isEmergencyVet: false,
        available24h: false,
        notes: 'Regular vet at Downtown Animal Hospital'
      };

      const contactId = await addEmergencyContact(emergencyContact);
      
      Alert.alert(
        'Emergency Contact Added!',
        'Dr. Smith has been added to your emergency contacts.'
      );

      console.log('Added emergency contact with ID:', contactId);
    } catch (error) {
      console.error('Failed to add emergency contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact. Please try again.');
    }
  };

  // Example: Batch operations
  const handleBatchOperations = async () => {
    if (!dataLayer) {
      Alert.alert('Error', 'Data layer not ready');
      return;
    }

    try {
      const batchResults = await dataLayer.batch([
        () => createPet({
          name: 'Max',
          species: 'Dog',
          breed: 'Labrador',
          age: 2,
        }),
        () => createPet({
          name: 'Luna',
          species: 'Cat',
          breed: 'Persian',
          age: 4,
        }),
      ]);

      Alert.alert(
        'Batch Operation Complete!',
        `Created ${batchResults.length} pets in a single transaction.`
      );
    } catch (error) {
      console.error('Batch operation failed:', error);
      Alert.alert('Error', 'Batch operation failed. Changes have been rolled back.');
    }
  };

  // Example: Export data
  const handleExportData = async () => {
    try {
      const exportedData = await manager?.exportData();
      
      Alert.alert(
        'Data Exported!',
        `Exported ${exportedData?.pets?.length || 0} pets and ${exportedData?.healthRecords?.length || 0} health records.`
      );

      console.log('Exported data:', exportedData);
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  // Loading state
  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="sync" size={48} color="#4ECDC4" />
          <Text style={styles.loadingText}>Setting up offline features...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Status Bar */}
      <OfflineStatusBar
        dataLayer={dataLayer!}
        showDetails={showDetails}
        onPress={() => setShowDetails(!showDetails)}
      />

      <ScrollView style={styles.content}>
        {/* Network Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Status</Text>
          <View style={styles.statusGrid}>
            <StatusItem
              icon="wifi"
              label="Connected"
              value={networkState.isConnected ? 'Yes' : 'No'}
              color={networkState.isConnected ? '#4CAF50' : '#F44336'}
            />
            <StatusItem
              icon="cellular"
              label="Type"
              value={networkState.type}
              color="#2196F3"
            />
            <StatusItem
              icon="sync"
              label="Can Sync"
              value={canSync ? 'Yes' : 'No'}
              color={canSync ? '#4CAF50' : '#FF9800'}
            />
          </View>
        </View>

        {/* Data Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Overview</Text>
          <View style={styles.statusGrid}>
            <StatusItem
              icon="paw"
              label="Pets"
              value={pets.length.toString()}
              color="#4CAF50"
            />
            <StatusItem
              icon="cloud-upload"
              label="Pending Sync"
              value={status?.pendingUpdates?.toString() || '0'}
              color="#FF9800"
            />
            <StatusItem
              icon="warning"
              label="Conflicts"
              value={conflicts.length.toString()}
              color={conflicts.length > 0 ? '#F44336' : '#4CAF50'}
            />
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Example Actions</Text>
          
          <ActionButton
            title="Create Example Pet"
            subtitle="Creates a pet with optimistic updates"
            icon="add-circle"
            color="#4CAF50"
            onPress={handleCreateExamplePet}
            disabled={petsLoading}
          />
          
          <ActionButton
            title="Report Pet Lost"
            subtitle="Creates high-priority lost pet report"
            icon="alert-circle"
            color="#F44336"
            onPress={handleCreateLostPetReport}
            disabled={pets.length === 0}
          />
          
          <ActionButton
            title="Add Emergency Contact"
            subtitle="Adds vet to emergency contacts"
            icon="medical"
            color="#2196F3"
            onPress={handleAddEmergencyContact}
          />
          
          <ActionButton
            title="Batch Operations"
            subtitle="Creates multiple pets in one transaction"
            icon="layers"
            color="#9C27B0"
            onPress={handleBatchOperations}
          />
        </View>

        {/* Sync Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Controls</Text>
          
          <ActionButton
            title={isSyncing ? 'Syncing...' : 'Force Sync'}
            subtitle="Manually trigger data synchronization"
            icon="sync"
            color="#4ECDC4"
            onPress={() => setShowSyncModal(true)}
            disabled={isSyncing || !canSync}
          />
          
          <ActionButton
            title="Export Data"
            subtitle="Export all offline data"
            icon="download"
            color="#607D8B"
            onPress={handleExportData}
          />
          
          <ActionButton
            title="Refresh Status"
            subtitle="Update system status information"
            icon="refresh"
            color="#795548"
            onPress={refreshStatus}
          />
        </View>

        {/* System Health Section */}
        {health && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthGrid}>
              <HealthItem label="Storage" healthy={health.storage} />
              <HealthItem label="Sync Engine" healthy={health.syncEngine} />
              <HealthItem label="Data Layer" healthy={health.dataLayer} />
              <HealthItem label="Lost Pet Service" healthy={health.lostPetService} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sync Progress Modal */}
      <SyncProgressModal
        visible={showSyncModal}
        syncEngine={syncEngine!}
        onClose={() => setShowSyncModal(false)}
      />

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        visible={showConflictModal}
        conflicts={conflicts}
        onResolve={resolveConflict}
        onClose={() => setShowConflictModal(false)}
      />
    </SafeAreaView>
  );
};

// Helper Components
const StatusItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <View style={styles.statusItem}>
    <Ionicons name={icon as any} size={24} color={color} />
    <Text style={styles.statusLabel}>{label}</Text>
    <Text style={[styles.statusValue, { color }]}>{value}</Text>
  </View>
);

const ActionButton: React.FC<{
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({ title, subtitle, icon, color, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Ionicons name={icon as any} size={24} color={disabled ? '#999' : color} />
    <View style={styles.actionTextContainer}>
      <Text style={[styles.actionTitle, disabled && styles.actionTextDisabled]}>
        {title}
      </Text>
      <Text style={[styles.actionSubtitle, disabled && styles.actionTextDisabled]}>
        {subtitle}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={disabled ? '#999' : '#666'} />
  </TouchableOpacity>
);

const HealthItem: React.FC<{
  label: string;
  healthy: boolean;
}> = ({ label, healthy }) => (
  <View style={styles.healthItem}>
    <Ionicons
      name={healthy ? 'checkmark-circle' : 'close-circle'}
      size={20}
      color={healthy ? '#4CAF50' : '#F44336'}
    />
    <Text style={[styles.healthLabel, { color: healthy ? '#4CAF50' : '#F44336' }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    width: '48%',
    paddingVertical: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionTextDisabled: {
    color: '#999',
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 8,
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default OfflineIntegrationExample;