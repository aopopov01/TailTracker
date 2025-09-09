import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Dimensions,
  Share,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';
import { Pet, petService } from '@/services/PetService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VaccinationRecord {
  id: string;
  pet_id: string;
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string;
  veterinarian: string;
  batch_number?: string;
  notes?: string;
}

interface MedicalRecord {
  id: string;
  pet_id: string;
  type: 'checkup' | 'surgery' | 'emergency' | 'prescription' | 'test_result';
  title: string;
  description: string;
  date: string;
  veterinarian: string;
  attachments?: string[];
  cost?: number;
}

interface PetProfileRouteParams {
  petId: string;
}

export default function PetProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const qrRef = useRef(null);
  
  const petId = (route.params as PetProfileRouteParams)?.petId;
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'health' | 'photos' | 'records'>('info');
  const [showQRModal, setShowQRModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  }, []);

  const loadPetData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load pet basic info
      const petData = await petService.getPet(petId);
      if (!petData) {
        throw new Error('Pet not found');
      }
      setPet(petData);

      // Load vaccinations
      const { data: vaccinationData, error: vaccinationError } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('pet_id', petId)
        .order('date_administered', { ascending: false });

      if (!vaccinationError) {
        setVaccinations(vaccinationData || []);
      }

      // Load medical records
      const { data: medicalData, error: medicalError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .order('date', { ascending: false });

      if (!medicalError) {
        setMedicalRecords(medicalData || []);
      }

      // Load photos
      const { data: photoList, error: photoError } = await supabase.storage
        .from('pet-photos')
        .list(`pets/${petId}`, { limit: 50 });

      if (!photoError && photoList) {
        const photoUrls = await Promise.all(
          photoList.map(async (photo) => {
            const { data } = supabase.storage
              .from('pet-photos')
              .getPublicUrl(`pets/${petId}/${photo.name}`);
            return data.publicUrl;
          })
        );
        setPhotos(photoUrls);
      }

    } catch (error) {
      console.error('Error loading pet data:', error);
      Alert.alert('Error', 'Failed to load pet information.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (petId) {
      loadPetData();
      requestLocationPermission();
    }
  }, [petId, loadPetData, requestLocationPermission]);

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'Unknown age';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInYears = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000));
    
    if (ageInYears < 1) {
      const ageInMonths = Math.floor(ageInMs / (30.44 * 24 * 60 * 60 * 1000));
      return ageInMonths === 1 ? '1 month' : `${ageInMonths} months`;
    }
    
    return ageInYears === 1 ? '1 year' : `${ageInYears} years`;
  };

  const getNextVaccination = () => {
    const upcoming = vaccinations
      .filter(v => v.next_due_date && new Date(v.next_due_date) > new Date())
      .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime());
    
    return upcoming[0];
  };

  const addPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant photo library access to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Upload to storage
        const fileExt = asset.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `pets/${petId}/${fileName}`;

        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: fileName,
          type: `image/${fileExt}`,
        } as any);

        const { error } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, formData, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Reload photos
        loadPetData();
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    }
  };

  const reportLost = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please grant location access to report your pet as lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestLocationPermission },
        ]
      );
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      
      Alert.alert(
        'Report Lost Pet',
        `Are you sure you want to report ${pet?.name} as lost? This will send alerts to nearby TailTracker users.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report Lost',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('pets')
                  .update({
                    status: 'lost',
                  })
                  .eq('id', petId);

                if (error) throw error;

                // Call lost pet alert function
                await supabase.functions.invoke('lost-pet-alerts', {
                  body: {
                    pet_id: petId,
                    location: {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    },
                  },
                });

                setPet(prev => prev ? { ...prev, status: 'lost' } : null);
                Alert.alert('Alert Sent', 'Nearby users have been notified about your lost pet.');
              } catch (error) {
                console.error('Error reporting lost pet:', error);
                Alert.alert('Error', 'Failed to report lost pet. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    }
  };

  const markFound = async () => {
    Alert.alert(
      'Mark as Found',
      `Great news! Mark ${pet?.name} as found?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Found',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('pets')
                .update({
                  status: 'active',
                })
                .eq('id', petId);

              if (error) throw error;

              setPet(prev => prev ? { ...prev, status: 'active' } : null);
              Alert.alert('Success', 'Your pet has been marked as found!');
            } catch (error) {
              console.error('Error marking pet as found:', error);
              Alert.alert('Error', 'Failed to update pet status.');
            }
          },
        },
      ]
    );
  };

  const shareProfile = async () => {
    try {
      const shareUrl = `https://tailtracker.app/pet/${petId}`;
      await Share.share({
        title: `${pet?.name}'s Pet Profile`,
        message: `Check out ${pet?.name}'s profile on TailTracker: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const generateQRCode = () => {
    setShowQRModal(true);
  };

  const saveQRCode = async () => {
    try {
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 0.9,
      });

      Alert.alert('QR Code Saved', 'QR code has been saved to your photo library.');
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code.');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={colors.white} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{pet?.name || 'Pet Profile'}</Text>
      
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton} onPress={shareProfile}>
          <Ionicons name="share" size={20} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={generateQRCode}>
          <Ionicons name="qr-code" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileCard = () => (
    <View style={styles.profileCard}>
      <View style={styles.petImageContainer}>
        {photos[0] ? (
          <Image
            source={{ uri: photos[0] }}
            style={styles.petImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="camera" size={32} color={colors.gray400} />
          </View>
        )}
        
        {pet?.status === 'lost' && (
          <View style={styles.lostBadge}>
            <Text style={styles.lostBadgeText}>LOST</Text>
          </View>
        )}
      </View>
      
      <View style={styles.petBasicInfo}>
        <Text style={styles.petName}>{pet?.name}</Text>
        <Text style={styles.petBreed}>
          {pet?.breed && `${pet.breed} • `}{calculateAge(pet?.date_of_birth)}
        </Text>
        <Text style={styles.petSpecies}>
          {pet?.species ? pet.species.charAt(0)?.toUpperCase() + pet.species.slice(1) : ''}
          {pet?.gender ? ` • ${pet.gender.charAt(0)?.toUpperCase() + pet.gender.slice(1)}` : ''}
          {pet?.color && ` • ${pet.color}`}
        </Text>
      </View>

      {pet?.status === 'lost' ? (
        <TouchableOpacity style={styles.foundButton} onPress={markFound}>
          <Ionicons name="checkmark" size={20} color={colors.white} />
          <Text style={styles.foundButtonText}>Mark as Found</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.lostButton} onPress={reportLost}>
          <Ionicons name="alert" size={20} color={colors.white} />
          <Text style={styles.lostButtonText}>Report Lost</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'info', label: 'Info', icon: 'information-circle' },
        { key: 'health', label: 'Health', icon: 'medical' },
        { key: 'photos', label: 'Photos', icon: 'images' },
        { key: 'records', label: 'Records', icon: 'document-text' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.key ? colors.primary : colors.gray400}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="scale" size={16} color={colors.primary} />
            <Text style={styles.infoLabel}>Weight</Text>
            <Text style={styles.infoValue}>{pet?.weight_kg ? `${pet.weight_kg} kg` : 'Not set'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{calculateAge(pet?.date_of_birth)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="color-palette" size={16} color={colors.primary} />
            <Text style={styles.infoLabel}>Color</Text>
            <Text style={styles.infoValue}>{pet?.color || 'Not specified'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="male-female" size={16} color={colors.primary} />
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>
              {pet?.gender ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1) : 'Not specified'}
            </Text>
          </View>
        </View>
      </View>

      {pet?.microchip_number && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Identification</Text>
          
          <View style={styles.idCard}>
            <Ionicons name="hardware-chip" size={24} color={colors.primary} />
            <View style={styles.idInfo}>
              <Text style={styles.idLabel}>Microchip Number</Text>
              <Text style={styles.idValue}>{pet.microchip_number}</Text>
            </View>
          </View>
        </View>
      )}

      {pet?.personality_traits && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Personality & Behavior</Text>
          
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>Personality Traits</Text>
            <Text style={styles.textValue}>{pet.personality_traits}</Text>
          </View>
          
          {pet.behavioral_notes && (
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>Behavioral Notes</Text>
              <Text style={styles.textValue}>{pet.behavioral_notes}</Text>
            </View>
          )}
        </View>
      )}

      {(pet?.special_needs || pet?.allergies || pet?.medical_conditions?.length) && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Health & Medical</Text>
          
          {pet.special_needs && (
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>Special Needs</Text>
              <Text style={styles.textValue}>{pet.special_needs}</Text>
            </View>
          )}

          {pet.allergies && (
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>Allergies</Text>
              <Text style={styles.textValue}>{pet.allergies}</Text>
            </View>
          )}

          {pet.medical_conditions && pet.medical_conditions.length > 0 && (
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>Medical Conditions</Text>
              {pet.medical_conditions.map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <Ionicons name="medical" size={16} color={colors.warning} />
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {pet?.dietary_notes && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Dietary Information</Text>
          
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>Dietary Notes</Text>
            <Text style={styles.textValue}>{pet.dietary_notes}</Text>
          </View>
        </View>
      )}

      {pet?.emergency_contact_name && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <View style={styles.contactCard}>
            <Ionicons name="person" size={24} color={colors.primary} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{pet.emergency_contact_name}</Text>
              {pet.emergency_contact_phone && (
                <Text style={styles.contactDetail}>📞 {pet.emergency_contact_phone}</Text>
              )}
              {pet.emergency_contact_email && (
                <Text style={styles.contactDetail}>✉️ {pet.emergency_contact_email}</Text>
              )}
            </View>
          </View>

          {pet.emergency_contact_2_name && (
            <View style={styles.contactCard}>
              <Ionicons name="person" size={24} color={colors.secondary} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{pet.emergency_contact_2_name}</Text>
                {pet.emergency_contact_2_phone && (
                  <Text style={styles.contactDetail}>📞 {pet.emergency_contact_2_phone}</Text>
                )}
                {pet.emergency_contact_2_email && (
                  <Text style={styles.contactDetail}>✉️ {pet.emergency_contact_2_email}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {pet?.insurance_provider && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Pet Insurance</Text>
          
          <View style={styles.insuranceCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <View style={styles.insuranceInfo}>
              <Text style={styles.insuranceProvider}>{pet.insurance_provider}</Text>
              {pet.insurance_policy_number && (
                <Text style={styles.insuranceDetail}>Policy: {pet.insurance_policy_number}</Text>
              )}
              {pet.insurance_contact_phone && (
                <Text style={styles.insuranceDetail}>Contact: {pet.insurance_contact_phone}</Text>
              )}
            </View>
          </View>

          {pet.insurance_coverage_details && (
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>Coverage Details</Text>
              <Text style={styles.textValue}>{pet.insurance_coverage_details}</Text>
            </View>
          )}
        </View>
      )}

      {pet?.breeding_status && pet.breeding_status !== 'not_applicable' && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Breeding Information</Text>
          
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>Breeding Status</Text>
            <Text style={styles.textValue}>
              {pet.breeding_status.charAt(0).toUpperCase() + pet.breeding_status.slice(1)}
            </Text>
          </View>

          {(pet.sire_name || pet.dam_name) && (
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>Lineage</Text>
              {pet.sire_name && (
                <Text style={styles.textValue}>Sire: {pet.sire_name}</Text>
              )}
              {pet.dam_name && (
                <Text style={styles.textValue}>Dam: {pet.dam_name}</Text>
              )}
            </View>
          )}

          {(pet.registration_number || pet.registration_organization) && (
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>Registration</Text>
              {pet.registration_organization && (
                <Text style={styles.textValue}>Organization: {pet.registration_organization}</Text>
              )}
              {pet.registration_number && (
                <Text style={styles.textValue}>Number: {pet.registration_number}</Text>
              )}
            </View>
          )}

          {pet.breeding_notes && (
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>Breeding Notes</Text>
              <Text style={styles.textValue}>{pet.breeding_notes}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderHealthTab = () => {
    const nextVaccination = getNextVaccination();
    
    return (
      <View style={styles.tabContent}>
        {nextVaccination && (
          <View style={styles.healthAlert}>
            <Ionicons name="calendar" size={20} color={colors.warning} />
            <View style={styles.healthAlertContent}>
              <Text style={styles.healthAlertTitle}>Upcoming Vaccination</Text>
              <Text style={styles.healthAlertText}>
                {nextVaccination.vaccine_name} due on{' '}
                {new Date(nextVaccination.next_due_date!).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.healthSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vaccinations</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {vaccinations.length > 0 ? (
            vaccinations.slice(0, 3).map((vaccination, index) => (
              <View key={vaccination.id} style={styles.healthRecord}>
                <View style={styles.healthRecordIcon}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                </View>
                <View style={styles.healthRecordContent}>
                  <Text style={styles.healthRecordTitle}>{vaccination.vaccine_name}</Text>
                  <Text style={styles.healthRecordDate}>
                    {new Date(vaccination.date_administered).toLocaleDateString()}
                  </Text>
                  <Text style={styles.healthRecordVet}>{vaccination.veterinarian}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No vaccination records yet</Text>
          )}
        </View>
      </View>
    );
  };

  const renderPhotosTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Photo Gallery</Text>
        <TouchableOpacity style={styles.addButton} onPress={addPhoto}>
          <Ionicons name="camera" size={16} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Photo</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <TouchableOpacity key={index} style={styles.photoItem}>
            <Image source={{ uri: photo }} style={styles.photoThumbnail} />
          </TouchableOpacity>
        ))}
        
        {photos.length === 0 && (
          <View style={styles.emptyPhotos}>
            <Ionicons name="images" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No photos yet</Text>
            <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto}>
              <Text style={styles.addPhotoButtonText}>Add First Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderRecordsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Medical Records</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="document-text" size={16} color={colors.primary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      {medicalRecords.length > 0 ? (
        medicalRecords.map((record, index) => (
          <View key={record.id} style={styles.recordItem}>
            <View style={styles.recordIcon}>
              <Ionicons
                name={
                  record.type === 'checkup' ? 'medical' :
                  record.type === 'surgery' ? 'cut' :
                  record.type === 'emergency' ? 'alert' :
                  record.type === 'prescription' ? 'medical' : 'document'
                }
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.recordContent}>
              <Text style={styles.recordTitle}>{record.title}</Text>
              <Text style={styles.recordDescription} numberOfLines={2}>
                {record.description}
              </Text>
              <Text style={styles.recordDate}>
                {new Date(record.date).toLocaleDateString()} • {record.veterinarian}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No medical records yet</Text>
      )}
    </View>
  );

  const renderQRModal = () => (
    <Modal visible={showQRModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.qrModal}>
        <View style={styles.qrHeader}>
          <TouchableOpacity onPress={() => setShowQRModal(false)}>
            <Text style={styles.qrCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.qrTitle}>Pet Profile QR Code</Text>
          <TouchableOpacity onPress={saveQRCode}>
            <Text style={styles.qrSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.qrContent}>
          <View ref={qrRef} style={styles.qrContainer}>
            <QRCode
              value={`https://tailtracker.app/pet/${petId}`}
              size={200}
              color={colors.text}
              backgroundColor={colors.white}
            />
          </View>
          
          <Text style={styles.qrDescription}>
            Share this QR code with veterinarians or others who need access to {pet?.name}'s profile.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading pet profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="paw" size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>Pet not found</Text>
          <TouchableOpacity
            style={styles.backToListButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToListButtonText}>Back to Pets</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.gradient}
      >
        {renderHeader()}
        {renderProfileCard()}
      </LinearGradient>
      
      {renderTabs()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'photos' && renderPhotosTab()}
        {activeTab === 'records' && renderRecordsTab()}
      </ScrollView>
      
      {renderQRModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  gradient: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  petImageContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  petImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lostBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lostBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  petBasicInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  petName: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  petBreed: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  petSpecies: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray400,
  },
  lostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lostButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  foundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  foundButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tabContent: {
    padding: spacing.md,
  },
  infoSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    padding: spacing.md,
  },
  idInfo: {
    marginLeft: spacing.md,
  },
  idLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  idValue: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningContainer,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  conditionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.warning,
    marginLeft: spacing.sm,
  },
  healthSection: {
    marginBottom: spacing.xl,
  },
  healthAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningContainer,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  healthAlertContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  healthAlertTitle: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  healthAlertText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.warning,
  },
  healthRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  healthRecordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  healthRecordContent: {
    flex: 1,
  },
  healthRecordTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  healthRecordDate: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  healthRecordVet: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray400,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: (SCREEN_WIDTH - spacing.md * 3) / 2,
    height: (SCREEN_WIDTH - spacing.md * 3) / 2,
    marginBottom: spacing.md,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  emptyPhotos: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  addPhotoButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addPhotoButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recordDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  recordDate: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray400,
  },
  qrModal: {
    flex: 1,
    backgroundColor: colors.white,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  qrCancelText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  qrTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  qrSaveText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  qrContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  qrContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrDescription: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 22,
  },
  backToListButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  backToListButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
  },
  textSection: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  textLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  textValue: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  contactInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  contactDetail: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  insuranceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.successContainer,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  insuranceInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  insuranceProvider: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  insuranceDetail: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
});