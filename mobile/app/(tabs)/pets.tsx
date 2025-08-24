import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PetsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pets</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => router.push('/sharing')}
          >
            <MaterialIcons name="qr-code" size={18} color="#007AFF" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Pet</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.petCard}>
        <View style={styles.petHeader}>
          <Text style={styles.petEmoji}>🐕</Text>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>Max</Text>
            <Text style={styles.petBreed}>Golden Retriever • 3 years</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
        <View style={styles.petStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2.1 mi</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Home</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Battery</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.petCard}>
        <View style={styles.petHeader}>
          <Text style={styles.petEmoji}>🐱</Text>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>Luna</Text>
            <Text style={styles.petBreed}>Persian Cat • 2 years</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.statusText}>Exploring</Text>
          </View>
        </View>
        <View style={styles.petStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0.5 mi</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Garden</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>76%</Text>
            <Text style={styles.statLabel}>Battery</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.petCard}>
        <View style={styles.petHeader}>
          <Text style={styles.petEmoji}>🐕</Text>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>Buddy</Text>
            <Text style={styles.petBreed}>Labrador Mix • 5 years</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#9E9E9E' }]}>
            <Text style={styles.statusText}>Resting</Text>
          </View>
        </View>
        <View style={styles.petStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1.8 mi</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Home</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>84%</Text>
            <Text style={styles.statLabel}>Battery</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  shareButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  petCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  petEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  petStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});