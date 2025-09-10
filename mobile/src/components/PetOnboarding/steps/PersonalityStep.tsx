/**
 * Step 4: Personality Traits
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StepProps } from '../PetOnboardingWizard';
import PetPersonalityService from '../../../services/PetPersonalityService';

const PersonalityStep: React.FC<StepProps> = ({
  profile,
  onUpdate,
}) => {
  const theme = useTheme();
  const [selectedTraits, setSelectedTraits] = useState<string[]>(
    profile.personalityTraits || []
  );

  const availableTraits = useMemo(() => {
    if (!profile.species) return [];
    return PetPersonalityService.getAllPersonalityTraits(profile.species);
  }, [profile.species]);

  const handleTraitToggle = (traitId: string) => {
    setSelectedTraits(prev => {
      const updated = prev.includes(traitId)
        ? prev.filter(id => id !== traitId)
        : [...prev, traitId];
      
      onUpdate({ personalityTraits: updated });
      return updated;
    });
  };

  if (!profile.species) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Please select your pet's species first
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          What's {profile.name || 'your pet'}'s personality like?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Select traits that describe your {profile.species}.
        </Text>
      </View>

      <View style={styles.traitsGrid}>
        {availableTraits.map((trait) => {
          const isSelected = selectedTraits.includes(trait.id);
          return (
            <TouchableOpacity
              key={trait.id}
              style={[
                styles.traitChip,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.outline,
                },
              ]}
              onPress={() => handleTraitToggle(trait.id)}
            >
              <Icon
                name={isSelected ? 'check-circle' : 'circle-outline'}
                size={20}
                color={isSelected ? theme.colors.onPrimary : theme.colors.onSurface}
              />
              <Text
                style={[
                  styles.traitText,
                  {
                    color: isSelected
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {trait.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 8,
  },
  traitText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default PersonalityStep;