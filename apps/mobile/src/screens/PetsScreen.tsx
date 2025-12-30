/**
 * TailTracker Pets Screen
 * Main screen showing all user's pets with onboarding data integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useMaterialTheme } from '@/theme/MaterialThemeProvider';
import { PetProfile } from '@/types/Pet';
import petProfileService from '@/services/PetProfileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PetsScreen: React.FC = () => {
  const theme = useTheme();
  const materialTheme = useMaterialTheme();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load pets from database on component mount
  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoading(true);
        const petProfiles = await petProfileService.getPetProfiles();
        setPets(petProfiles);
        console.log('📋 Loaded pet profiles:', petProfiles.length);
      } catch (error) {
        console.error('❌ Error loading pets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPets();
  }, []);

  const getAge = (birthDate: Date | undefined): string => {
    if (!birthDate) return 'Age unknown';

    const birth = new Date(birthDate);
    const today = new Date();
    const ageInYears = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (ageInYears < 1) {
      const ageInMonths = monthDiff <= 0 ? 12 + monthDiff : monthDiff;
      return `${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'}`;
    }

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return `${ageInYears - 1} ${ageInYears - 1 === 1 ? 'year' : 'years'}`;
    }

    return `${ageInYears} ${ageInYears === 1 ? 'year' : 'years'}`;
  };

  const renderPetCard = ({ item: pet }: { item: PetProfile }) => (
    <TouchableOpacity
      style={[styles.petCard, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.7}
    >
      <View style={styles.petImageContainer}>
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={styles.petImage} />
        ) : (
          <View
            style={[
              styles.placeholderImage,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Ionicons
              name='paw'
              size={32}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        )}
      </View>

      <View style={styles.petInfo}>
        <Text style={[styles.petName, { color: theme.colors.onSurface }]}>
          {pet.name || 'Unnamed Pet'}
        </Text>
        <Text
          style={[styles.petDetails, { color: theme.colors.onSurfaceVariant }]}
        >
          {pet.breed ? `${pet.species} • ${pet.breed}` : pet.species}
          {pet.colorMarkings && ` • ${pet.colorMarkings}`}
        </Text>
        <Text style={[styles.petAge, { color: theme.colors.onSurfaceVariant }]}>
          {getAge(pet.dateOfBirth || pet.date_of_birth)}
          {typeof pet.weight === 'string' && pet.weight && ` • ${pet.weight}`}
          {typeof pet.weight === 'object' &&
            pet.weight &&
            ` • ${pet.weight.value}${pet.weight.unit}`}
        </Text>

        {/* Show favorite activities from onboarding */}
        {pet.favoriteActivities && pet.favoriteActivities.length > 0 && (
          <Text
            style={[styles.petActivities, { color: theme.colors.primary }]}
            numberOfLines={1}
          >
            🎾 {pet.favoriteActivities.slice(0, 2).join(', ')}
            {pet.favoriteActivities.length > 2 && '...'}
          </Text>
        )}

        {/* Show personality traits from onboarding */}
        {pet.personalityTraits && pet.personalityTraits.length > 0 && (
          <Text
            style={[styles.petPersonality, { color: theme.colors.secondary }]}
            numberOfLines={1}
          >
            ✨ {pet.personalityTraits.slice(0, 2).join(', ')}
            {pet.personalityTraits.length > 2 && '...'}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.menuButton}>
        <Ionicons
          name='ellipsis-vertical'
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name='paw' size={64} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        No pets yet
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
      >
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, { color: theme.colors.onBackground }]}
        >
          My Pets
        </Text>
        <TouchableOpacity style={styles.addIconButton}>
          <Ionicons name='add' size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Loading your pets...
          </Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPetCard}
          keyExtractor={item => item.id || 'unknown'}
          contentContainerStyle={
            pets.length === 0 ? styles.emptyContainer : styles.listContainer
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
  petActivities: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  petPersonality: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  menuButton: {
    padding: 8,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
