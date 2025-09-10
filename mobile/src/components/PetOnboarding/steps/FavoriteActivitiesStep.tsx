/**
 * Step 6: Favorite Activities - Species-Specific Activities Selection
 * Dynamically shows activities based on the pet's species selected in step 1
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme, Chip, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StepProps } from '../PetOnboardingWizard';
import PetPersonalityService, { FavoriteActivity } from '../../../services/PetPersonalityService';

const FavoriteActivitiesStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const theme = useTheme();
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    profile.favoriteActivities || []
  );

  // Get species-specific activities
  const speciesActivities = useMemo(() => {
    if (!profile.species) {
      return [];
    }
    return PetPersonalityService.getAllFavoriteActivities(profile.species);
  }, [profile.species]);

  // Group activities by category
  const activitiesByCategory = useMemo(() => {
    const categories: Record<string, FavoriteActivity[]> = {};
    
    speciesActivities.forEach(activity => {
      if (!categories[activity.category]) {
        categories[activity.category] = [];
      }
      categories[activity.category].push(activity);
    });
    
    return categories;
  }, [speciesActivities]);

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    indoor: 'home',
    outdoor: 'tree',
    social: 'account-group',
    training: 'school',
  };

  // Category descriptions
  const categoryDescriptions: Record<string, string> = {
    indoor: 'Activities your pet enjoys inside',
    outdoor: 'Activities your pet loves outdoors',
    social: 'Activities with other pets or people',
    training: 'Learning and skill-building activities',
  };

  // Species-specific messaging
  const getSpeciesMessage = () => {
    switch (profile.species) {
      case 'dog':
        return 'Dogs love variety! Select activities that match your dog\'s energy level and interests.';
      case 'cat':
        return 'Cats have unique preferences. Choose activities that appeal to your cat\'s hunting instincts and personality.';
      case 'bird':
        return 'Birds are intelligent and active. Select enrichment activities that keep your bird mentally stimulated.';
      case 'other':
        return 'Every pet is unique. Choose activities that are suitable for your pet\'s species and personality.';
      default:
        return 'Please go back and select your pet\'s species first.';
    }
  };

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivities(prev => {
      const isSelected = prev.includes(activityId);
      const updated = isSelected
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId];
      
      // Update profile immediately
      onUpdate({ favoriteActivities: updated });
      
      return updated;
    });
  };

  const handleNext = () => {
    if (selectedActivities.length === 0) {
      Alert.alert(
        'No Activities Selected',
        'Please select at least one activity your pet enjoys, or skip this step if none apply.',
        [
          { text: 'Select Activities', style: 'cancel' },
          { 
            text: 'Skip for Now', 
            onPress: () => {
              onUpdate({ favoriteActivities: [] });
              onNext();
            }
          },
        ]
      );
      return;
    }
    
    onNext();
  };

  // Show species selection prompt if no species selected
  if (!profile.species) {
    return (
      <View style={styles.container}>
        <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
          <View style={styles.errorContent}>
            <Icon name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={[styles.errorTitle, { color: theme.colors.onErrorContainer }]}>
              Species Required
            </Text>
            <Text style={[styles.errorMessage, { color: theme.colors.onErrorContainer }]}>
              Please go back to Step 1 and select your pet's species to see relevant activities.
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
              onPress={onPrevious}
            >
              <Icon name="chevron-left" size={20} color={theme.colors.onPrimary} />
              <Text style={[styles.backButtonText, { color: theme.colors.onPrimary }]}>
                Go Back to Basic Info
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          What does your {profile.species} love to do?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {getSpeciesMessage()}
        </Text>
        
        {/* Species indicator */}
        <View style={[styles.speciesIndicator, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon 
            name={profile.species === 'dog' ? 'dog' : profile.species === 'cat' ? 'cat' : 'paw'} 
            size={20} 
            color={theme.colors.onPrimaryContainer} 
          />
          <Text style={[styles.speciesText, { color: theme.colors.onPrimaryContainer }]}>
            {profile.species.charAt(0).toUpperCase() + profile.species.slice(1)} Activities
          </Text>
        </View>
      </View>

      {/* Activities by Category */}
      {Object.entries(activitiesByCategory).map(([category, activities]) => (
        <View key={category} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Icon
              name={categoryIcons[category] || 'heart'}
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.categoryTitleContainer}>
              <Text style={[styles.categoryTitle, { color: theme.colors.onBackground }]}>
                {category.charAt(0).toUpperCase() + category.slice(1)} Activities
              </Text>
              <Text style={[styles.categoryDescription, { color: theme.colors.onSurfaceVariant }]}>
                {categoryDescriptions[category]}
              </Text>
            </View>
          </View>

          <View style={styles.activitiesGrid}>
            {activities.map((activity) => {
              const isSelected = selectedActivities.includes(activity.id);
              return (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.outline,
                    },
                  ]}
                  onPress={() => handleActivityToggle(activity.id)}
                >
                  <Icon
                    name={isSelected ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={isSelected ? theme.colors.onPrimary : theme.colors.onSurface}
                  />
                  <Text
                    style={[
                      styles.activityText,
                      {
                        color: isSelected
                          ? theme.colors.onPrimary
                          : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {activity.label}
                  </Text>
                  {activity.description && (
                    <Text
                      style={[
                        styles.activityDescription,
                        {
                          color: isSelected
                            ? theme.colors.onPrimary
                            : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {activity.description}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Selection Summary */}
      {selectedActivities.length > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon name="check-circle" size={24} color={theme.colors.onPrimaryContainer} />
          <Text style={[styles.summaryText, { color: theme.colors.onPrimaryContainer }]}>
            {selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'} selected
          </Text>
        </View>
      )}

      {/* Custom Activity Input */}
      <Card style={[styles.customCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.customTitle, { color: theme.colors.onSurface }]}>
          Don't see your pet's favorite activity?
        </Text>
        <Text style={[styles.customSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          You can add custom activities after completing the setup in your pet's profile.
        </Text>
      </Card>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  speciesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  speciesText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 8,
    minWidth: '45%',
    flex: 1,
    maxWidth: '48%',
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  activityDescription: {
    fontSize: 12,
    marginLeft: 8,
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  customCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorCard: {
    padding: 24,
    borderRadius: 12,
    margin: 20,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default FavoriteActivitiesStep;