/**
 * TailTracker Add Pet Screen
 * Screen for adding a new pet to the user's account
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export const AddPetScreen: React.FC = () => {
  const theme = useTheme();
  const [petData, setPetData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
  });

  const handleSave = () => {
    if (!petData.name.trim()) {
      Alert.alert('Error', 'Pet name is required');
      return;
    }
    // Would save pet data here
    Alert.alert('Success', 'Pet added successfully!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Add New Pet
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>Name *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.surface,
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline
              }]}
              value={petData.name}
              onChangeText={(text) => setPetData(prev => ({ ...prev, name: text }))}
              placeholder="Enter pet's name"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>Species</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.surface,
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline
              }]}
              value={petData.species}
              onChangeText={(text) => setPetData(prev => ({ ...prev, species: text }))}
              placeholder="e.g., Dog, Cat, Bird"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>Breed</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.surface,
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline
              }]}
              value={petData.breed}
              onChangeText={(text) => setPetData(prev => ({ ...prev, breed: text }))}
              placeholder="Enter breed"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.onPrimary }]}>
              Add Pet
            </Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddPetScreen;