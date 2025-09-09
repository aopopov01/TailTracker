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
  onDelete
}) => {
  const getAge = (birthDate: string | undefined): string => {
    if (!birthDate) return 'Age unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInYears = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (ageInYears < 1) {
      const ageInMonths = monthDiff <= 0 ? 
        12 + monthDiff : monthDiff;
      return `${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'}`;
    }
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
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
      style={[styles.card, { borderLeftColor: getStatusColor() }]}
      onPress={() => onPress(pet)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petDetails}>
            {pet.species}
            {pet.breed && ` • ${pet.breed}`}
            {pet.color && ` • ${pet.color}`}
          </Text>
          <Text style={styles.petAge}>
            {getAge(pet.date_of_birth)}
            {pet.weight_kg && ` • ${pet.weight_kg}kg`}
            {pet.gender && ` • ${pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}`}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
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

      {pet.emergency_contact_name && (
        <View style={styles.contactContainer}>
          <Text style={styles.contactLabel}>📞 Emergency:</Text>
          <Text style={styles.contactInfo}>
            {pet.emergency_contact_name}
            {pet.emergency_contact_phone && ` • ${pet.emergency_contact_phone}`}
          </Text>
        </View>
      )}

      {pet.special_needs && (
        <View style={styles.specialNeedsContainer}>
          <Text style={styles.specialNeedsLabel}>⚠️ Special Needs:</Text>
          <Text style={styles.specialNeedsText} numberOfLines={2}>
            {pet.special_needs}
          </Text>
        </View>
      )}
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
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
});