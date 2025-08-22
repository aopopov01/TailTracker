import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const navigateToTabs = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to TailTracker</Text>
      <Text style={styles.subtitle}>Keep your pets safe and happy</Text>
      
      <TouchableOpacity style={styles.button} onPress={navigateToTabs}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
      
      <View style={styles.featuresList}>
        <Text style={styles.featureItem}>📍 Real-time pet tracking</Text>
        <Text style={styles.featureItem}>🚨 Safe zone alerts</Text>
        <Text style={styles.featureItem}>👨‍👩‍👧‍👦 Family sharing</Text>
        <Text style={styles.featureItem}>📊 Activity monitoring</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    fontSize: 16,
    marginVertical: 8,
    color: '#333',
  },
});