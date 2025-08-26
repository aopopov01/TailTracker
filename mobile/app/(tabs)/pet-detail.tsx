import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, StoredPetProfile } from '../../services/database';
import { useAuth } from '../../src/contexts/AuthContext';
import Animated, {
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
  lightGray: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
};

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  delay?: number;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, delay = 0 }) => {
  return (
    <Animated.View
      entering={SlideInDown.delay(delay).springify()}
      style={styles.infoRow}
    >
      <View style={styles.infoIconContainer}>
        <LinearGradient
          colors={[COLORS.lightCyan, COLORS.midCyan]}
          style={styles.infoIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon} size={16} color={COLORS.white} />
        </LinearGradient>
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </Animated.View>
  );
};

const calculateAge = (dateOfBirth?: Date, approximateAge?: string, useApproximateAge?: boolean) => {
  if (useApproximateAge && approximateAge) {
    return approximateAge;
  }

  if (!dateOfBirth) return 'Age unknown';

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 1) {
    const months = Math.max(0, (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                  today.getMonth() - birthDate.getMonth());
    return months === 1 ? '1 month' : `${months} months`;
  }
  
  return age === 1 ? '1 year' : `${age} years`;
};

const getPetPhotos = (photosString?: string): string[] => {
  if (!photosString) return [];
  try {
    return JSON.parse(photosString);
  } catch {
    return [];
  }
};

export default function PetDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ petId?: string }>();
  const petId = params.petId ? parseInt(params.petId) : null;

  const [pet, setPet] = useState<StoredPetProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPetDetails();
  }, [petId]);

  const loadPetDetails = async () => {
    if (!petId || !user) {
      setLoading(false);
      return;
    }

    try {
      const pets = await databaseService.getAllPets(user.id);
      const foundPet = pets.find(p => p.id === petId);
      setPet(foundPet || null);
    } catch (error) {
      console.error('Error loading pet details:', error);
      Alert.alert('Error', 'Failed to load pet details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    // TODO: Navigate to edit pet profile
    Alert.alert('Edit Profile', 'Edit functionality coming soon!');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading pet details...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Pet not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photos = getPetPhotos(pet.photos);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pet.name || 'Pet Profile'}</Text>
        <TouchableOpacity style={styles.headerEditButton} onPress={handleEdit}>
          <Ionicons name="create-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet Photo */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.photoSection}
        >
          {photos.length > 0 ? (
            <View style={styles.petPhotoContainer}>
              <Image source={{ uri: photos[0] }} style={styles.petPhoto} />
            </View>
          ) : (
            <View style={styles.placeholderPhotoContainer}>
              <LinearGradient
                colors={[COLORS.lightCyan, COLORS.midCyan]}
                style={styles.placeholderPhoto}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera-outline" size={48} color={COLORS.white} />
                <Text style={styles.placeholderText}>No Photo</Text>
              </LinearGradient>
            </View>
          )}
        </Animated.View>

        {/* Basic Information */}
        <Animated.View
          entering={SlideInDown.delay(400).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <InfoRow
            icon="paw-outline"
            label="Species"
            value={pet.species ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1) : 'Not specified'}
            delay={500}
          />
          
          <InfoRow
            icon="ribbon-outline"
            label="Breed"
            value={pet.breed || 'Mixed breed'}
            delay={550}
          />
          
          <InfoRow
            icon="calendar-outline"
            label="Age"
            value={calculateAge(pet.dateOfBirth, pet.approximateAge, pet.useApproximateAge)}
            delay={600}
          />
          
          <InfoRow
            icon="transgender-outline"
            label="Gender"
            value={pet.gender ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1) : 'Not specified'}
            delay={650}
          />
          
          <InfoRow
            icon="scale-outline"
            label="Weight"
            value={pet.weight ? `${pet.weight} ${pet.weightUnit || 'kg'}` : 'Not specified'}
            delay={700}
          />
          
          {pet.height && (
            <InfoRow
              icon="resize-outline"
              label="Height"
              value={`${pet.height} ${pet.heightUnit || 'cm'}`}
              delay={750}
            />
          )}
        </Animated.View>

        {/* Appearance */}
        {pet.colorMarkings && (
          <Animated.View
            entering={SlideInDown.delay(800).springify()}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Appearance</Text>
            
            <InfoRow
              icon="color-palette-outline"
              label="Color & Markings"
              value={pet.colorMarkings}
              delay={850}
            />
          </Animated.View>
        )}

        {/* Official Records */}
        {(pet.microchipId || pet.registrationNumber) && (
          <Animated.View
            entering={SlideInDown.delay(900).springify()}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Official Records</Text>
            
            {pet.microchipId && (
              <InfoRow
                icon="radio-outline"
                label="Microchip"
                value={pet.microchipId}
                delay={950}
              />
            )}
            
            {pet.registrationNumber && (
              <InfoRow
                icon="bookmark-outline"
                label="Registration"
                value={pet.registrationNumber}
                delay={1000}
              />
            )}
          </Animated.View>
        )}

        {/* Veterinarian Information */}
        {(pet.vetName || pet.clinicName) && (
          <Animated.View
            entering={SlideInDown.delay(1050).springify()}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Veterinarian</Text>
            
            {pet.clinicName && (
              <InfoRow
                icon="business-outline"
                label="Clinic"
                value={pet.clinicName}
                delay={1100}
              />
            )}
            
            {pet.vetName && (
              <InfoRow
                icon="person-outline"
                label="Veterinarian"
                value={pet.vetName}
                delay={1150}
              />
            )}
            
            {pet.vetPhone && (
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={pet.vetPhone}
                delay={1200}
              />
            )}
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={SlideInDown.delay(1300).springify()}
          style={styles.actionsSection}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.success, '#0D9488']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="medical" size={24} color={COLORS.white} />
                <Text style={styles.actionText}>Health Log</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.warning, '#D97706']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="calendar" size={24} color={COLORS.white} />
                <Text style={styles.actionText}>Appointments</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.lightCyan, COLORS.midCyan]}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="share" size={24} color={COLORS.white} />
                <Text style={styles.actionText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.deepNavy, '#0F172A']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="create" size={24} color={COLORS.white} />
                <Text style={styles.actionText}>Edit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.lightCyan,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.lightCyan,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  headerEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: -40,
  },
  petPhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  petPhoto: {
    width: '100%',
    height: '100%',
  },
  placeholderPhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderPhoto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.deepNavy,
  },
  actionsSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 8,
  },
});