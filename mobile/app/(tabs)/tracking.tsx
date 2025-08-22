import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TrackingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Map View</Text>
        <Text style={styles.mapSubtext}>Real-time pet tracking will appear here</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlButtonText}>📍 Locate All Pets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlButtonText}>🚨 Emergency Alert</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlButtonText}>⚙️ Tracking Settings</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.petStatus}>
        <Text style={styles.sectionTitle}>Pet Status</Text>
        <View style={styles.petItem}>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>🐕 Max</Text>
            <Text style={styles.petStatusText}>At Home • Active</Text>
          </View>
          <View style={styles.statusIndicator} />
        </View>
        <View style={styles.petItem}>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>🐱 Luna</Text>
            <Text style={styles.petStatusText}>Exploring • Safe</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  mapText: {
    fontSize: 24,
    color: '#2196F3',
    marginBottom: 10,
  },
  mapSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  petStatus: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  petItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  petStatusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
});