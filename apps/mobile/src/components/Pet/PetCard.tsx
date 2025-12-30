import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Pet } from '@/services/PetService';

interface PetCardProps {
  pet: Pet;
  onPress: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  onPress,
  onEdit,
  onDelete,
}) => {
  const getAge = (birthDate: string | undefined): string => {
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

  const getStatusColor = () => {
    switch (pet.status) {
      case 'lost':
        return '#E74C3C';
      case 'found':
        return '#27AE60';
      case 'deceased':
        return '#7F8C8D';
      default:
        return '#3498DB';
    }
  };

  const getStatusText = () => {
    switch (pet.status) {
      case 'lost':
        return 'Lost';
      case 'found':
        return 'Found';
      case 'deceased':
        return 'Deceased';
      default:
        return 'Active';
    }
  };

  return (
    <TouchableOpacity
      testID='pet-card'
      style={[styles.card, { borderLeftColor: getStatusColor() }]}
      onPress={() => onPress(pet)}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole='button'
      accessibilityLabel={`Pet profile for ${pet.name}`}
      accessibilityHint='Double tap to view pet details'
    >
      <View style={styles.header}>
        {pet.photo_url && (
          <Image
            source={{ uri: pet.photo_url }}
            style={styles.petPhoto}
            resizeMode='cover'
          />
        )}
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petDetails}>
            {pet.breed && `${pet.breed}`}
            {pet.breed && pet.color_markings && ` • `}
            {pet.color_markings && `${pet.color_markings}`}
          </Text>
          <Text style={styles.petAge}>
            {getAge(pet.date_of_birth)}
            {pet.weight_kg && ` • ${pet.weight_kg} kg`}
            {pet.gender &&
              ` • ${pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}`}
          </Text>
        </View>

        <View style={styles.actions}>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
          >
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>

          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(pet)}
              style={styles.actionButton}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(pet)}
              style={styles.actionButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {pet.microchip_number && (
        <View style={styles.microchipContainer}>
          <Text style={styles.microchipLabel}>🔍 Microchip:</Text>
          <Text style={styles.microchipNumber}>{pet.microchip_number}</Text>
        </View>
      )}

      {pet.special_notes && (
        <View style={styles.specialNeedsContainer}>
          <Text style={styles.specialNeedsLabel}>📝 Special Notes:</Text>
          <Text style={styles.specialNeedsText} numberOfLines={2}>
            {pet.special_notes}
          </Text>
        </View>
      )}

      {pet.favorite_food && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>🍽️ Favorite Food:</Text>
          <Text style={styles.infoText}>{pet.favorite_food}</Text>
        </View>
      )}

      {pet.feeding_schedule && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>⏰ Feeding Schedule:</Text>
          <Text style={styles.infoText}>{pet.feeding_schedule}</Text>
        </View>
      )}

      {(pet as any).current_medications &&
        (pet as any).current_medications.length > 0 && (
          <View style={styles.medicationContainer}>
            <Text style={styles.medicationLabel}>💊 Medications:</Text>
            <Text style={styles.medicationText} numberOfLines={2}>
              {(pet as any).current_medications.join(', ')}
            </Text>
          </View>
        )}

      {pet.allergies && pet.allergies.length > 0 && (
        <View style={styles.allergyContainer}>
          <Text style={styles.allergyLabel}>⚠️ Allergies:</Text>
          <Text style={styles.allergyText} numberOfLines={2}>
            {/* NOTE: allergies is JSON string in database, parse before displaying */}
            {(typeof pet.allergies === 'string'
              ? JSON.parse(pet.allergies)
              : pet.allergies
            ).join(', ')}
          </Text>
        </View>
      )}

      {pet.medical_conditions && pet.medical_conditions.length > 0 && (
        <View style={styles.medicalContainer}>
          <Text style={styles.medicalLabel}>🏥 Medical Conditions:</Text>
          <Text style={styles.medicalText} numberOfLines={2}>
            {pet.medical_conditions.join(', ')}
          </Text>
        </View>
      )}

      {/* Accessibility helper for screen readers */}
      <View
        accessible={true}
        accessibilityLabel='Flip card to see more details'
        accessibilityRole='button'
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  petPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  petAge: {
    fontSize: 14,
    color: '#34495E',
    fontWeight: '500',
  },
  actions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editText: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
  },
  microchipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  microchipLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    marginRight: 4,
  },
  microchipNumber: {
    fontSize: 13,
    color: '#3498DB',
    fontWeight: '500',
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    marginRight: 4,
  },
  contactInfo: {
    fontSize: 13,
    color: '#27AE60',
    fontWeight: '500',
    flex: 1,
  },
  specialNeedsContainer: {
    marginTop: 4,
  },
  specialNeedsLabel: {
    fontSize: 13,
    color: '#E67E22',
    fontWeight: '600',
    marginBottom: 4,
  },
  specialNeedsText: {
    fontSize: 13,
    color: '#E67E22',
    lineHeight: 18,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    marginRight: 4,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 13,
    color: '#34495E',
    flex: 1,
    flexWrap: 'wrap',
  },
  medicationContainer: {
    marginTop: 4,
  },
  medicationLabel: {
    fontSize: 13,
    color: '#8E44AD',
    fontWeight: '600',
    marginBottom: 4,
  },
  medicationText: {
    fontSize: 13,
    color: '#8E44AD',
    lineHeight: 18,
  },
  allergyContainer: {
    marginTop: 4,
  },
  allergyLabel: {
    fontSize: 13,
    color: '#E74C3C',
    fontWeight: '600',
    marginBottom: 4,
  },
  allergyText: {
    fontSize: 13,
    color: '#E74C3C',
    lineHeight: 18,
  },
  medicalContainer: {
    marginTop: 4,
  },
  medicalLabel: {
    fontSize: 13,
    color: '#2980B9',
    fontWeight: '600',
    marginBottom: 4,
  },
  medicalText: {
    fontSize: 13,
    color: '#2980B9',
    lineHeight: 18,
  },
});
