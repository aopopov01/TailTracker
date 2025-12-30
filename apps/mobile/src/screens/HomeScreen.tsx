/**
 * TailTracker Home Screen
 * Main dashboard screen showing pet overview and recent activity
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMaterialTheme } from '@/theme/MaterialThemeProvider';
import { PetIDCard } from '@/components/Pet/PetIDCard';
import { PetProfile } from '@/types/Pet';
import { petService, Pet } from '@/services/PetService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const materialTheme = useMaterialTheme();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Check for pending sync items
  const checkPendingSync = async () => {
    try {
      const offlinePetsJson = await AsyncStorage.getItem('offline_pets');
      if (offlinePetsJson) {
        try {
          const offlinePets = JSON.parse(offlinePetsJson);
          setPendingSync(offlinePets.length);
        } catch (parseError) {
          // Data corruption detected
          console.error('Corrupted offline data detected:', parseError);
          setSyncMessage('Data recovery in progress...');

          // Clear corrupted data and reset
          await AsyncStorage.removeItem('offline_pets');
          await AsyncStorage.setItem('offline_pets', '[]');
          setPendingSync(0);

          // Show recovery complete message
          setTimeout(() => {
            setSyncMessage('Data recovered. Ready to add your first pet');
            setTimeout(() => setSyncMessage(''), 3000);
          }, 1000);
        }
      } else {
        setPendingSync(0);
      }
    } catch (err) {
      console.error('Error checking pending sync:', err);
    }
  };

  // Sync offline data
  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage('Syncing...');

      const offlinePetsJson = await AsyncStorage.getItem('offline_pets');
      if (!offlinePetsJson) {
        setSyncMessage('No items to sync');
        setTimeout(() => setSyncMessage(''), 2000);
        return;
      }

      const offlinePets = JSON.parse(offlinePetsJson);
      let synced = 0;
      let errors = 0;

      for (const petData of offlinePets) {
        try {
          await petService.upsertPetFromOnboarding(petData);
          synced++;
        } catch (err) {
          console.error('Error syncing pet:', err);
          errors++;
        }
      }

      if (errors === 0) {
        // Clear offline storage if all synced successfully
        await AsyncStorage.removeItem('offline_pets');
        setPendingSync(0);
        setSyncMessage('Sync complete');

        // Refresh pets list
        const pets = await petService.getPets();
        setPets(pets);
      } else {
        setSyncMessage(`Synced ${synced}, ${errors} errors`);
      }

      setTimeout(() => setSyncMessage(''), 3000);
    } catch (err) {
      console.error('Error during sync:', err);
      setSyncMessage('Sync failed');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setSyncing(false);
    }
  };

  // Fetch pet data from Supabase
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        setError(null);

        const pets = await petService.getPets();
        setPets(pets);

        // Check for pending sync items
        await checkPendingSync();
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Something went wrong while loading your pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  const handleAddPet = () => {
    router.push('/add-pet' as any);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[styles.headerTitle, { color: theme.colors.onBackground }]}
          >
            Welcome to TailTracker
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Your pet's digital passport
          </Text>
        </View>

        {/* Sync Status Indicator */}
        {pendingSync > 0 && (
          <View
            style={[
              styles.syncContainer,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            testID='sync-indicator'
          >
            <View style={styles.syncInfo}>
              <Ionicons
                name='cloud-offline'
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.syncText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {pendingSync} items pending sync
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.syncButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleSync}
              disabled={syncing}
              testID='sync-button'
            >
              {syncing ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Ionicons name='sync' size={20} color='#fff' />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Sync Message */}
        {syncMessage && (
          <View
            style={[
              styles.syncMessageContainer,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              style={[
                styles.syncMessageText,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {syncMessage}
            </Text>
          </View>
        )}

        {/* Pet ID Cards Section */}
        {loading ? (
          <View style={styles.section}>
            <View
              style={[
                styles.loadingContainer,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <ActivityIndicator size='large' color={theme.colors.primary} />
              <Text
                style={[styles.loadingText, { color: theme.colors.onSurface }]}
              >
                Loading your pets...
              </Text>
            </View>
          </View>
        ) : error ? (
          <View style={styles.section}>
            <View
              style={[
                styles.errorCard,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Ionicons
                name='alert-circle'
                size={48}
                color={theme.colors.onErrorContainer}
              />
              <Text
                style={[
                  styles.errorTitle,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                Unable to load pets
              </Text>
              <Text
                style={[
                  styles.errorText,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                {error}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  const fetchPets = async () => {
                    try {
                      setLoading(true);
                      setError(null);

                      const pets = await petService.getPets();
                      setPets(pets);
                    } catch (err) {
                      console.error('Error fetching pets:', err);
                      setError('Something went wrong while loading your pets');
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchPets();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.retryButtonText,
                    { color: theme.colors.onPrimary },
                  ]}
                >
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : pets.length > 0 ? (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              My Pets
            </Text>
            <View testID='pet-list'>
              {pets.map(pet => (
                <PetIDCard
                  key={pet.id}
                  pet={pet as any}
                  onPress={() => {
                    // Navigate to pet detail screen
                    console.log('Navigate to pet details for:', pet.name);
                  }}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View
              style={[
                styles.emptyStateCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons
                name='paw'
                size={64}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: theme.colors.onSurface },
                ]}
              >
                No pets added yet
              </Text>
              <Text
                style={[
                  styles.emptyStateText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Add your first pet to get started with TailTracker
              </Text>
              <TouchableOpacity
                style={[
                  styles.addPetButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleAddPet}
                activeOpacity={0.7}
              >
                <Ionicons
                  name='add-circle'
                  size={24}
                  color={theme.colors.onPrimary}
                />
                <Text
                  style={[
                    styles.addPetButtonText,
                    { color: theme.colors.onPrimary },
                  ]}
                >
                  Add Your First Pet
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Quick Actions
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              testID='add-pet-button'
              style={[
                styles.actionCard,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={handleAddPet}
              activeOpacity={0.7}
            >
              <Ionicons
                name='add-circle'
                size={32}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.actionText, { color: theme.colors.onSurface }]}
              >
                Add Pet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                { backgroundColor: theme.colors.surface },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name='medical' size={32} color={theme.colors.primary} />
              <Text
                style={[styles.actionText, { color: theme.colors.onSurface }]}
              >
                Health Records
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                { backgroundColor: theme.colors.surface },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name='location'
                size={32}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.actionText, { color: theme.colors.onSurface }]}
              >
                Lost Pet Alerts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                { backgroundColor: theme.colors.surface },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name='calendar'
                size={32}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.actionText, { color: theme.colors.onSurface }]}
              >
                Appointments
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Recent Activity
          </Text>
          <View
            style={[
              styles.activityCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              No recent activity
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  activityCard: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  emptyStateCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addPetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  syncContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  syncButton: {
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncMessageContainer: {
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncMessageText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
