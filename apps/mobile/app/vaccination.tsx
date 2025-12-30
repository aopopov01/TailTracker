import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/**
 * Vaccination Management Screen
 * Lists all pets and their vaccination records
 */
export default function VaccinationRoute() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vaccinations</Text>
        <Text style={styles.subtitle}>
          Track vaccination records for all your pets
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons name='medical-outline' size={64} color='#ccc' />
          <Text style={styles.emptyTitle}>No Vaccination Records</Text>
          <Text style={styles.emptyText}>
            View and manage vaccination records for your pets from their
            individual pet profiles.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)/pets' as any)}
          >
            <Text style={styles.buttonText}>View My Pets</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons
            name='information-circle-outline'
            size={24}
            color='#007AFF'
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Manage Vaccinations</Text>
            <Text style={styles.infoText}>
              • Add vaccination records from each pet's profile{'\n'}• Set
              reminders for upcoming vaccinations{'\n'}• Track vaccination
              history and schedule{'\n'}• Export records for vet visits
            </Text>
          </View>
        </View>
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
