import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StoredPetProfile } from '../../../services/database';
import { databaseService } from '../../../services/database';
import { TailTrackerModal } from '../../../src/components/UI/TailTrackerModal';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTailTrackerModal } from '../../../src/hooks/useTailTrackerModal';
import { SharingService } from '../../../src/services/sharingService';
import { log } from '../../../src/utils/Logger';

const SharedPetDetailScreen: React.FC = () => {
  const { user } = useAuth();
  const { id, ownerName } = useLocalSearchParams<{
    id: string;
    ownerName?: string;
  }>();
  const [pet, setPet] = useState<StoredPetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { modalConfig, showError, hideModal } = useTailTrackerModal();

  const loadPetDetails = useCallback(async () => {
    if (!id || !user) return;

    try {
      // Get shared pets for this user and find the specific one
      const sharedPets = await SharingService.getSharedPets(
        parseInt(user.id, 10)
      );
      const targetPet = sharedPets.find(p => p.petId.toString() === id);

      if (targetPet) {
        // Get full pet details using the database service
        const fullPetDetails = await databaseService.getSharedPetDetails(
          targetPet.petId,
          parseInt(user.id, 10)
        );
        if (fullPetDetails) {
          setPet(fullPetDetails);
        } else {
          showError(
            'Pet Not Found',
            'Unable to load pet details.',
            'paw-outline',
            () => router.back()
          );
        }
        // Update access time for analytics
        // We would need the tokenId for this, which we could get from the sharing service
      } else {
        showError(
          'Pet Not Found',
          'This pet is no longer shared with you or the sharing has expired.',
          'share-outline',
          () => router.back()
        );
      }
    } catch (error) {
      log.error('Error loading pet details:', error);
      showError(
        'Error',
        'Failed to load pet details.',
        'alert-circle-outline',
        () => router.back()
      );
    } finally {
      setIsLoading(false);
    }
  }, [id, user, showError]);

  useEffect(() => {
    if (id && user) {
      loadPetDetails();
    }
  }, [id, user, loadPetDetails]);

  const getSpeciesIcon = (species: string | undefined) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return 'pets';
      case 'cat':
        return 'pets';
      case 'bird':
      case 'parrot':
        return 'flutter-dash';
      default:
        return 'pets';
    }
  };

  const getSpeciesColor = (species: string | undefined) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return '#8B4513';
      case 'cat':
        return '#FF6B35';
      case 'bird':
      case 'parrot':
        return '#00CED1';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not specified';
    return date.toLocaleDateString();
  };

  const calculateAge = (
    birthDate: Date | undefined,
    approximateAge: string | number | undefined,
    useApproximate: boolean | undefined
  ) => {
    if (useApproximate && approximateAge) {
      return String(approximateAge);
    }
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      const years = Math.floor(
        (today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      const months = Math.floor(
        ((today.getTime() - birth.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) /
          (30.44 * 24 * 60 * 60 * 1000)
      );

      if (years > 0) {
        return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} month${months !== 1 ? 's' : ''}` : ''}`;
      }
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return 'Not specified';
  };

  const renderInfoSection = (
    title: string,
    icon: string,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon as any} size={20} color='#007AFF' />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderInfoItem = (
    label: string,
    value: string | undefined,
    fallback: string = 'Not specified'
  ) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || fallback}</Text>
    </View>
  );

  const renderArrayInfo = (label: string, items: string[] | undefined) => {
    if (!items || items.length === 0) return null;

    return (
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.tagContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderContactInfo = (contact: any, title: string) => {
    if (!contact) return null;

    return (
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>{title}</Text>
        {contact.name && (
          <Text style={styles.contactDetail}>
            <MaterialIcons name='person' size={16} color='#8E8E93' />{' '}
            {contact.name}
          </Text>
        )}
        {contact.phone && (
          <Text style={styles.contactDetail}>
            <MaterialIcons name='phone' size={16} color='#8E8E93' />{' '}
            {contact.phone}
          </Text>
        )}
        {contact.address && (
          <Text style={styles.contactDetail}>
            <MaterialIcons name='location-on' size={16} color='#8E8E93' />{' '}
            {contact.address}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name='arrow-back' size={24} color='#007AFF' />
          </TouchableOpacity>
          <Text style={styles.title}>Pet Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>Loading pet details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name='arrow-back' size={24} color='#007AFF' />
          </TouchableOpacity>
          <Text style={styles.title}>Pet Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name='error' size={48} color='#FF3B30' />
          <Text style={styles.errorText}>Pet details not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasPhoto = pet.photos && pet.photos.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name='arrow-back' size={24} color='#007AFF' />
        </TouchableOpacity>
        <Text style={styles.title}>{pet.name ?? 'Pet Details'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Owner Info Banner */}
        <View style={styles.ownerBanner}>
          <MaterialIcons name='share' size={20} color='#007AFF' />
          <Text style={styles.ownerBannerText}>
            Shared by {ownerName || 'Pet Owner'} • Read-only access
          </Text>
        </View>

        {/* Pet Photo/Header */}
        <View style={styles.petHeader}>
          {hasPhoto ? (
            <Image source={{ uri: pet.photos?.[0] }} style={styles.petPhoto} />
          ) : (
            <View
              style={[
                styles.petIconContainer,
                { backgroundColor: `${getSpeciesColor(pet.species)}20` },
              ]}
            >
              <MaterialIcons
                name={getSpeciesIcon(pet.species)}
                size={60}
                color={getSpeciesColor(pet.species)}
              />
            </View>
          )}
          <View style={styles.petHeaderInfo}>
            <Text style={styles.petName}>{pet.name ?? 'Unnamed Pet'}</Text>
            <Text style={styles.petSpecies}>
              {pet.species
                ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1)
                : 'Unknown species'}
            </Text>
            <Text style={styles.petAge}>
              {calculateAge(
                pet.dateOfBirth,
                pet.approximateAge,
                pet.useApproximateAge
              )}
            </Text>
          </View>
        </View>

        {/* Basic Information */}
        {renderInfoSection(
          'Basic Information',
          'info',
          <>
            {renderInfoItem('Breed', pet.breed)}
            {renderInfoItem('Gender', pet.gender)}
            {renderInfoItem('Date of Birth', formatDate(pet.dateOfBirth))}
            {renderInfoItem('Color/Markings', pet.colorMarkings)}
            {pet.weight &&
              renderInfoItem(
                'Weight',
                `${pet.weight} ${pet.weightUnit ?? 'lbs'}`
              )}
            {pet.height &&
              renderInfoItem(
                'Height',
                `${pet.height} ${pet.heightUnit ?? 'inches'}`
              )}
          </>
        )}

        {/* Identification */}
        {pet.registrationNumber &&
          renderInfoSection(
            'Identification',
            'badge',
            <>{renderInfoItem('Registration Number', pet.registrationNumber)}</>
          )}

        {/* Health Information */}
        {renderInfoSection(
          'Health Information',
          'medical-services',
          <>
            {renderArrayInfo('Medical Conditions', pet.medicalConditions)}
            {renderArrayInfo('Medications', pet.medications)}
            {renderArrayInfo('Allergies', pet.allergies)}
            {renderInfoItem('Insurance Provider', pet.insuranceProvider)}
            {renderInfoItem('Policy Number', pet.insurancePolicyNumber)}
          </>
        )}

        {/* Care Information */}
        {renderInfoSection(
          'Care Information',
          'favorite',
          <>
            {renderArrayInfo('Personality Traits', pet.personalityTraits)}
            {renderArrayInfo('Favorite Toys', pet.favoriteToys)}
            {renderArrayInfo('Favorite Activities', pet.favoriteActivities)}
            {renderInfoItem('Exercise Needs', pet.exerciseNeeds)}
            {renderInfoItem('Feeding Schedule', pet.feedingSchedule)}
            {pet.specialNotes &&
              renderInfoItem('Special Notes', pet.specialNotes)}
          </>
        )}

        {/* Contact Information */}
        {pet.emergencyContact &&
          renderInfoSection(
            'Contacts',
            'contacts',
            <>{renderContactInfo(pet.emergencyContact, 'Emergency Contact')}</>
          )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C7C7CC',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FF3B30',
  },
  content: {
    flex: 1,
  },
  ownerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  ownerBannerText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
    fontWeight: '500',
  },
  petHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  petPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  petIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  petHeaderInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  petSpecies: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  petAge: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  contactCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  contactDetail: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SharedPetDetailScreen;
