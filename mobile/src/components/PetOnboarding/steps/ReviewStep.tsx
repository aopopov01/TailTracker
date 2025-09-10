/**
 * Step 7: Review & Save
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StepProps } from '../PetOnboardingWizard';

const ReviewStep: React.FC<StepProps> = ({
  profile,
}) => {
  const theme = useTheme();

  const formatList = (items?: string[]) => {
    if (!items || items.length === 0) return 'None specified';
    return items.join(', ');
  };

  const getSpeciesIcon = (species?: string) => {
    switch (species) {
      case 'dog': return 'dog';
      case 'cat': return 'cat';
      case 'bird': return 'bird';
      default: return 'paw';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Review {profile.name || 'Your Pet'}'s Profile
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Make sure everything looks correct before saving.
        </Text>
      </View>

      {/* Basic Info */}
      <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Icon name={getSpeciesIcon(profile.species)} size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Basic Information
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Name:</Text>
          <Text style={[styles.value, { color: theme.colors.onSurface }]}>
            {profile.name || 'Not specified'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Species:</Text>
          <Text style={[styles.value, { color: theme.colors.onSurface }]}>
            {profile.species ? profile.species.charAt(0).toUpperCase() + profile.species.slice(1) : 'Not specified'}
          </Text>
        </View>
        {profile.breed && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Breed:</Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {profile.breed}
            </Text>
          </View>
        )}
      </Card>

      {/* Physical Details */}
      {(profile.weight || profile.colorMarkings) && (
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Icon name="tape-measure" size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Physical Details
            </Text>
          </View>
          {profile.weight && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Weight:</Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {profile.weight}
              </Text>
            </View>
          )}
          {profile.colorMarkings && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Color & Markings:</Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {profile.colorMarkings}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Personality & Activities */}
      {(profile.personalityTraits?.length || profile.favoriteActivities?.length) && (
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Icon name="heart-multiple" size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Personality & Activities
            </Text>
          </View>
          {profile.personalityTraits && profile.personalityTraits.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Personality:</Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {formatList(profile.personalityTraits)}
              </Text>
            </View>
          )}
          {profile.favoriteActivities && profile.favoriteActivities.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Favorite Activities:</Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {formatList(profile.favoriteActivities)}
              </Text>
            </View>
          )}
          {profile.exerciseNeeds && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Exercise Needs:</Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {profile.exerciseNeeds.charAt(0).toUpperCase() + profile.exerciseNeeds.slice(1)}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Health Info */}
      {(profile.medicalConditions?.length || profile.allergies?.length) && (
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Icon name="medical-bag" size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Health Information
            </Text>
          </View>
          {profile.medicalConditions && profile.medicalConditions.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Medical Conditions:</Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {formatList(profile.medicalConditions)}
              </Text>
            </View>
          )}
          {profile.allergies && profile.allergies.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Allergies:</Text>
              <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                {formatList(profile.allergies)}
              </Text>
            </View>
          )}
        </Card>
      )}

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
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    width: 120,
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ReviewStep;