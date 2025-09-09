/**
 * TailTracker Pets Screen
 * Main screen showing all user's pets
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useMaterialTheme } from '@/theme/MaterialThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  photoUrl?: string;
}

export const PetsScreen: React.FC = () => {
  const theme = useTheme();
  const materialTheme = useMaterialTheme();
  const [pets] = useState<Pet[]>([]); // Would be loaded from context/API

  const renderPetCard = ({ item: pet }: { item: Pet }) => (
    <TouchableOpacity
      style={[styles.petCard, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.7}
    >
      <View style={styles.petImageContainer}>
        {pet.photoUrl ? (
          <Image source={{ uri: pet.photoUrl }} style={styles.petImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="paw" size={32} color={theme.colors.onSurfaceVariant} />
          </View>
        )}
      </View>
      
      <View style={styles.petInfo}>
        <Text style={[styles.petName, { color: theme.colors.onSurface }]}>
          {pet.name}
        </Text>
        <Text style={[styles.petDetails, { color: theme.colors.onSurfaceVariant }]}>
          {pet.breed ? `${pet.species} • ${pet.breed}` : pet.species}
        </Text>
        {pet.age && (
          <Text style={[styles.petAge, { color: theme.colors.onSurfaceVariant }]}>
            {pet.age}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="paw" size={64} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        No pets yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        Add your first pet to get started with TailTracker
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.addButtonText, { color: theme.colors.onPrimary }]}>
          Add Your First Pet
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          My Pets
        </Text>
        <TouchableOpacity style={styles.addIconButton}>
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pets}
        renderItem={renderPetCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={pets.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addIconButton: {
    padding: 8,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  petCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  petImageContainer: {
    marginRight: 16,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  petAge: {
    fontSize: 14,
  },
  menuButton: {
    padding: 8,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PetsScreen;