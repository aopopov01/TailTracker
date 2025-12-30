/**
 * Pet ID Card Component
 * Displays pet information in a card format with flip animation
 * Front: Picture, name, breed, identification number
 * Back: Health information, medical conditions, allergies, notes
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PetProfile } from '@/types/Pet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 200;

interface PetIDCardProps {
  pet: PetProfile;
  onPress?: () => void;
}

export const PetIDCard: React.FC<PetIDCardProps> = ({ pet, onPress }) => {
  const theme = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    if (isFlipped) {
      // Flip back to front
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      // Flip to back
      Animated.spring(animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = animatedValue.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [1, 0, 0],
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [0, 0, 1],
  });

  // Get species-specific icon
  const getSpeciesIcon = (species: string | null) => {
    switch (species) {
      case 'dog':
        return 'dog';
      case 'cat':
        return 'cat';
      case 'bird':
        return 'bird';
      default:
        return 'paw';
    }
  };

  const formatArrayField = (field: string[] | undefined) => {
    if (!field || field.length === 0) return 'None';
    return field.join(', ');
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={flipCard}
      activeOpacity={0.8}
    >
      {/* Front Side */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
            transform: [{ rotateY: frontInterpolate }],
            opacity: frontOpacity,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Pet ID Card
          </Text>
          <Icon name='credit-card' size={24} color={theme.colors.primary} />
        </View>

        <View style={styles.frontContent}>
          {/* Pet Photo or Icon */}
          <View
            style={[
              styles.photoContainer,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            {pet.photo_url ? (
              <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
            ) : (
              <Icon
                name={getSpeciesIcon(pet.species || 'other')}
                size={60}
                color={theme.colors.onPrimaryContainer}
              />
            )}
          </View>

          {/* Pet Information */}
          <View style={styles.petInfo}>
            <Text style={[styles.petName, { color: theme.colors.onSurface }]}>
              {pet.name || 'Unnamed Pet'}
            </Text>

            {pet.breed && (
              <Text
                style={[
                  styles.petBreed,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {pet.breed}
              </Text>
            )}

            <Text
              style={[
                styles.petSpecies,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {pet.species
                ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1)
                : 'Unknown Species'}
            </Text>

            {pet.identificationNumber && (
              <View style={styles.idContainer}>
                <Text
                  style={[
                    styles.idLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  ID:
                </Text>
                <Text
                  style={[styles.idNumber, { color: theme.colors.primary }]}
                >
                  {pet.identificationNumber}
                </Text>
              </View>
            )}

            {pet.microchipId && (
              <View style={styles.idContainer}>
                <Icon
                  name='chip'
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.microchip,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {pet.microchipId}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.flipHint}>
          <Icon
            name='rotate-3d-variant'
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.flipHintText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Tap to flip for details
          </Text>
        </View>
      </Animated.View>

      {/* Back Side */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
            transform: [{ rotateY: backInterpolate }],
            opacity: backOpacity,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Health & Care Details
          </Text>
          <Icon name='medical-bag' size={24} color={theme.colors.primary} />
        </View>

        <View style={styles.backContent}>
          {/* Physical Details */}
          {(pet.weight || pet.height || pet.colorMarkings) && (
            <View style={styles.detailSection}>
              <Text
                style={[styles.detailLabel, { color: theme.colors.onSurface }]}
              >
                Physical:
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {[pet.weight, pet.height, pet.colorMarkings]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            </View>
          )}

          {/* Personality Traits */}
          {pet.personalityTraits && pet.personalityTraits.length > 0 && (
            <View style={styles.detailSection}>
              <Text
                style={[styles.detailLabel, { color: theme.colors.onSurface }]}
              >
                Personality:
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {formatArrayField(pet.personalityTraits)}
              </Text>
            </View>
          )}

          {/* Favorite Activities */}
          {pet.favoriteActivities && pet.favoriteActivities.length > 0 && (
            <View style={styles.detailSection}>
              <Text
                style={[styles.detailLabel, { color: theme.colors.onSurface }]}
              >
                Favorite Activities:
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {formatArrayField(pet.favoriteActivities)}
              </Text>
            </View>
          )}

          {/* Exercise Needs & Favorite Food */}
          {(pet.exerciseNeeds || pet.favoriteFood) && (
            <View style={styles.detailSection}>
              <Text
                style={[styles.detailLabel, { color: theme.colors.onSurface }]}
              >
                Care:
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {[
                  pet.exerciseNeeds
                    ? `Exercise: ${pet.exerciseNeeds.charAt(0).toUpperCase() + pet.exerciseNeeds.slice(1)}`
                    : null,
                  pet.favoriteFood ? `Food: ${pet.favoriteFood}` : null,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            </View>
          )}

          {/* Medical Conditions */}
          <View style={styles.detailSection}>
            <Text
              style={[styles.detailLabel, { color: theme.colors.onSurface }]}
            >
              Medical Conditions:
            </Text>
            <Text
              style={[
                styles.detailText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {formatArrayField(pet.medicalConditions)}
            </Text>
          </View>

          {/* Allergies */}
          <View style={styles.detailSection}>
            <Text
              style={[styles.detailLabel, { color: theme.colors.onSurface }]}
            >
              Allergies:
            </Text>
            <Text
              style={[
                styles.detailText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {formatArrayField(pet.allergies)}
            </Text>
          </View>

          {/* Medications */}
          {pet.medications && pet.medications.length > 0 && (
            <View style={styles.detailSection}>
              <Text
                style={[styles.detailLabel, { color: theme.colors.onSurface }]}
              >
                Medications:
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {formatArrayField(pet.medications)}
              </Text>
            </View>
          )}

          {/* Feeding Schedule */}
          {pet.feedingSchedule && (
            <View style={styles.detailSection}>
              <Text
                style={[styles.detailLabel, { color: theme.colors.onSurface }]}
              >
                Feeding Schedule:
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {pet.feedingSchedule}
              </Text>
            </View>
          )}

          {/* Special Notes */}
          {pet.specialNotes && (
            <View style={styles.detailSection}>
              <Text
                style={[styles.detailLabel, { color: theme.colors.onSurface }]}
              >
                Notes:
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {pet.specialNotes}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.flipHint}>
          <Icon
            name='rotate-3d-variant'
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.flipHintText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Tap to flip back
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    marginVertical: 10,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    backfaceVisibility: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  frontContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  petPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 16,
    marginBottom: 2,
  },
  petSpecies: {
    fontSize: 14,
    marginBottom: 8,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  idLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  idNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  microchip: {
    fontSize: 12,
    marginLeft: 4,
  },
  backContent: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 18,
  },
  flipHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  flipHintText: {
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});

export default PetIDCard;
