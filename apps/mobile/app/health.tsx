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
 * Health Management Screen
 * Central hub for all pet health records
 */
export default function HealthRoute() {
  const router = useRouter();

  const healthCategories = [
    {
      id: 'vaccinations',
      title: 'Vaccinations',
      icon: 'medical' as const,
      color: '#4CAF50',
      route: '/vaccination',
    },
    {
      id: 'medical-records',
      title: 'Medical Records',
      icon: 'document-text' as const,
      color: '#2196F3',
      description: 'View from pet profiles',
    },
    {
      id: 'health-log',
      title: 'Health Log',
      icon: 'heart' as const,
      color: '#E91E63',
      route: '/features/health-log',
    },
    {
      id: 'appointments',
      title: 'Appointments',
      icon: 'calendar' as const,
      color: '#FF9800',
      route: '/features/schedule',
    },
  ];

  const handleCategoryPress = (category: (typeof healthCategories)[0]) => {
    if (category.route) {
      router.push(category.route as any);
    } else {
      // Navigate to pets list to access medical records
      router.push('/(tabs)/pets' as any);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Management</Text>
        <Text style={styles.subtitle}>
          Comprehensive health tracking for all your pets
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Health Categories</Text>

        {healthCategories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
          >
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: category.color + '20' },
              ]}
            >
              <Ionicons name={category.icon} size={28} color={category.color} />
            </View>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              {category.description && (
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              )}
            </View>
            <Ionicons name='chevron-forward' size={24} color='#ccc' />
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Ionicons
            name='information-circle-outline'
            size={24}
            color='#007AFF'
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Health Features</Text>
            <Text style={styles.infoText}>
              • Track vaccinations and medical history{'\n'}• Set health
              reminders and alerts{'\n'}• Schedule vet appointments{'\n'}•
              Monitor health metrics over time{'\n'}• Export health reports for
              vet visits
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
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
