/**
 * Step 1: Basic Information - Pet Name and Species Selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StepProps } from '../PetOnboardingWizard';

const SPECIES_OPTIONS = [
  { id: 'dog', label: 'Dog', icon: 'dog', description: 'Loyal companion' },
  { id: 'cat', label: 'Cat', icon: 'cat', description: 'Independent friend' },
  { id: 'bird', label: 'Bird', icon: 'bird', description: 'Feathered friend' },
  { id: 'other', label: 'Other', icon: 'paw', description: 'Unique pet' },
] as const;

const BasicInfoStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const theme = useTheme();
  const [name, setName] = useState(profile.name || '');
  const [species, setSpecies] = useState(profile.species || null);

  const handleNameChange = (text: string) => {
    setName(text);
    onUpdate({ name: text.trim() });
  };

  const handleSpeciesSelect = (selectedSpecies: 'dog' | 'cat' | 'bird' | 'other') => {
    setSpecies(selectedSpecies);
    onUpdate({ species: selectedSpecies });
  };

  const canProceed = name.trim().length > 0 && species !== null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Let's start with the basics
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Tell us your pet's name and what kind of animal they are.
        </Text>
      </View>

      {/* Pet Name Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Pet Name *
        </Text>
        <TextInput
          style={[
            styles.nameInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
            },
          ]}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Enter your pet's name"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={50}
        />
        {name.trim().length > 0 && (
          <View style={styles.namePreview}>
            <Icon name="check-circle" size={20} color={theme.colors.primary} />
            <Text style={[styles.namePreviewText, { color: theme.colors.primary }]}>
              Hello, {name.trim()}! 👋
            </Text>
          </View>
        )}
      </View>

      {/* Species Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          What kind of pet is {name.trim() || 'your pet'}? *
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          This helps us show you relevant activities and care options.
        </Text>

        <View style={styles.speciesGrid}>
          {SPECIES_OPTIONS.map((option) => {
            const isSelected = species === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.speciesCard,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.outline,
                  },
                ]}
                onPress={() => handleSpeciesSelect(option.id)}
              >
                <Icon
                  name={option.icon}
                  size={40}
                  color={isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface}
                />
                <Text
                  style={[
                    styles.speciesLabel,
                    {
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurface,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.speciesDescription,
                    {
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {option.description}
                </Text>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Icon
                      name="check-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Progress Summary */}
      {canProceed && (
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.summaryContent}>
            <Icon name="information" size={24} color={theme.colors.onPrimaryContainer} />
            <View style={styles.summaryText}>
              <Text style={[styles.summaryTitle, { color: theme.colors.onPrimaryContainer }]}>
                Great! We're ready to continue.
              </Text>
              <Text style={[styles.summaryDescription, { color: theme.colors.onPrimaryContainer }]}>
                {name.trim()} is a {species} and we'll customize the next steps for {species === 'dog' || species === 'cat' ? 'them' : 'them'}.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Validation Message */}
      {!canProceed && (name.trim().length > 0 || species !== null) && (
        <Card style={[styles.validationCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={styles.validationContent}>
            <Icon name="alert-circle-outline" size={20} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.validationText, { color: theme.colors.onSurfaceVariant }]}>
              {!name.trim() && 'Please enter a name. '}
              {!species && 'Please select a species.'}
            </Text>
          </View>
        </Card>
      )}

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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  nameInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
  },
  namePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  namePreviewText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speciesCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    position: 'relative',
  },
  speciesLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  speciesDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryText: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  validationCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  validationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validationText: {
    fontSize: 14,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default BasicInfoStep;