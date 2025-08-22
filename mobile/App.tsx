import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import our tab screens - using require to handle any module issues
const DashboardScreen = () => {
  const { View, Text, StyleSheet, ScrollView } = require('react-native');
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back! (Hot Reload Test)</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Active Pets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>2.1</Text>
          <Text style={styles.statLabel}>Miles Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Safe Zones</Text>
        </View>
      </View>
      
      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>🐕 Max entered Home safe zone</Text>
          <Text style={styles.activityTime}>2 hours ago</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const TrackingScreen = () => {
  const { View, Text, StyleSheet, TouchableOpacity } = require('react-native');
  
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Map View</Text>
        <Text style={styles.mapSubtext}>Real-time pet tracking will appear here</Text>
      </View>
    </View>
  );
};

const PetsScreen = () => {
  const { View, Text, StyleSheet, ScrollView, TouchableOpacity } = require('react-native');
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pets</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Pet</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const SettingsScreen = () => {
  const { View, Text, StyleSheet, ScrollView } = require('react-native');
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Text>Settings options would appear here</Text>
      </View>
    </ScrollView>
  );
};

const styles = require('react-native').StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  recentActivity: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  activityItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 20,
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
});

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Tracking') {
              iconName = focused ? 'location' : 'location-outline';
            } else if (route.name === 'Pets') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Tracking" component={TrackingScreen} />
        <Tab.Screen name="Pets" component={PetsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}