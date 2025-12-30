import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { databaseService, StoredPetProfile } from '../../services/database';
import { useAuth } from '../../src/contexts/AuthContext';

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
  error: '#EF4444',
};

interface HealthLogEntry {
  id: string;
  petId: string;
  date: Date;
  type:
    | 'checkup'
    | 'vaccination'
    | 'medication'
    | 'symptoms'
    | 'injury'
    | 'other';
  title: string;
  description: string;
  veterinarian?: string;
  weight?: number;
  temperature?: number;
  notes?: string;
}

export default function HealthLogScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [pets, setPets] = useState<StoredPetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<StoredPetProfile | null>(null);
  const [healthLogs, setHealthLogs] = useState<HealthLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLogEntry, setNewLogEntry] = useState<Partial<HealthLogEntry>>({
    type: 'checkup',
    date: new Date(),
  });

  const loadPets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userPets = await databaseService.getAllPets(user.id);
      setPets(userPets);

      if (userPets.length > 0) {
        setSelectedPet(userPets[0]);
        await loadHealthLogs(userPets[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading pets:', error);
      Alert.alert('Error', 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const loadHealthLogs = async (petId: string) => {
    // Simulate loading health logs from database
    // In a real app, this would be a database query
    const mockHealthLogs: HealthLogEntry[] = [
      {
        id: '1',
        petId: petId,
        date: new Date('2024-12-15'),
        type: 'vaccination',
        title: 'Annual Vaccination',
        description:
          'Completed annual vaccination series including rabies, DHPP',
        veterinarian: 'Dr. Sarah Johnson',
        weight: 25.5,
        notes:
          'Pet handled the vaccination well. No adverse reactions observed.',
      },
      {
        id: '2',
        petId: petId,
        date: new Date('2024-11-20'),
        type: 'checkup',
        title: 'Regular Health Checkup',
        description: 'Routine wellness examination',
        veterinarian: 'Dr. Michael Chen',
        weight: 25.2,
        temperature: 38.5,
        notes:
          'Overall health excellent. Recommended dental cleaning in next 6 months.',
      },
      {
        id: '3',
        petId: petId,
        date: new Date('2024-10-10'),
        type: 'symptoms',
        title: 'Digestive Issues',
        description: 'Pet experienced mild stomach upset, loss of appetite',
        notes:
          'Resolved within 2 days with dietary changes. Monitored closely.',
      },
    ];

    setHealthLogs(mockHealthLogs);
  };

  const handlePetSelect = async (pet: StoredPetProfile) => {
    setSelectedPet(pet);
    await loadHealthLogs(pet.id.toString());
  };

  const handleAddHealthLog = () => {
    setShowAddForm(true);
  };

  const handleSaveHealthLog = () => {
    if (!newLogEntry.title || !newLogEntry.description || !selectedPet) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const healthLog: HealthLogEntry = {
      id: Date.now().toString(),
      petId: selectedPet.id.toString(),
      date: newLogEntry.date || new Date(),
      type: newLogEntry.type || 'other',
      title: newLogEntry.title,
      description: newLogEntry.description,
      veterinarian: newLogEntry.veterinarian,
      weight: newLogEntry.weight,
      temperature: newLogEntry.temperature,
      notes: newLogEntry.notes,
    };

    setHealthLogs(prev => [healthLog, ...prev]);
    setNewLogEntry({ type: 'checkup', date: new Date() });
    setShowAddForm(false);

    Alert.alert('Success', 'Health log entry added successfully');
  };

  const getPetPhotos = (photos?: string | string[]): string[] => {
    if (!photos) return [];
    if (Array.isArray(photos)) return photos;
    try {
      return JSON.parse(photos);
    } catch {
      return [];
    }
  };

  const getHealthTypeIcon = (type: string) => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      checkup: 'medical',
      vaccination: 'shield-checkmark',
      medication: 'medical',
      symptoms: 'warning',
      injury: 'bandage',
      other: 'document-text',
    };
    return iconMap[type] || 'document-text';
  };

  const getHealthTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      checkup: COLORS.success,
      vaccination: COLORS.lightCyan,
      medication: COLORS.warning,
      symptoms: COLORS.error,
      injury: COLORS.error,
      other: COLORS.mediumGray,
    };
    return colorMap[type] || COLORS.mediumGray;
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={handleBack}
          >
            <Ionicons name='arrow-back' size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Log</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.loadingText}>Loading health records...</Text>
        </View>
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={handleBack}
          >
            <Ionicons name='arrow-back' size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Log</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={[styles.container, styles.centerContent]}>
          <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.emptyState}
          >
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.emptyStateIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name='paw' size={40} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.emptyStateTitle}>No Pets Found</Text>
            <Text style={styles.emptyStateDescription}>
              Add a pet first to start tracking their health
            </Text>
            <TouchableOpacity
              style={styles.addPetButton}
              onPress={() => router.push('/add-pet' as any)}
            >
              <Text style={styles.addPetButtonText}>Add Your First Pet</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
          <Ionicons name='arrow-back' size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Log</Text>
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={handleAddHealthLog}
        >
          <Ionicons name='add' size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pet Selection */}
        {pets.length > 1 && (
          <Animated.View
            entering={FadeIn.delay(200).duration(600)}
            style={styles.petSelection}
          >
            <Text style={styles.sectionTitle}>Select Pet</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.petScrollView}
            >
              {pets.map((pet, index) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petCard,
                    selectedPet?.id === pet.id && styles.selectedPetCard,
                  ]}
                  onPress={() => handlePetSelect(pet)}
                >
                  {getPetPhotos(pet.photos).length > 0 ? (
                    <Image
                      source={{ uri: getPetPhotos(pet.photos)[0] }}
                      style={styles.petCardImage}
                    />
                  ) : (
                    <View style={styles.petCardPlaceholder}>
                      <Ionicons
                        name='paw'
                        size={24}
                        color={COLORS.mediumGray}
                      />
                    </View>
                  )}
                  <Text style={styles.petCardName}>{pet.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Selected Pet Info */}
        {selectedPet && (
          <Animated.View
            entering={SlideInDown.delay(400).springify()}
            style={styles.petInfoSection}
          >
            <View style={styles.petInfoCard}>
              <View style={styles.petImageContainer}>
                {getPetPhotos(selectedPet.photos).length > 0 ? (
                  <Image
                    source={{ uri: getPetPhotos(selectedPet.photos)[0] }}
                    style={styles.petImage}
                  />
                ) : (
                  <View style={styles.petImagePlaceholder}>
                    <LinearGradient
                      colors={[COLORS.lightCyan, COLORS.midCyan]}
                      style={styles.placeholderGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name='paw' size={32} color={COLORS.white} />
                    </LinearGradient>
                  </View>
                )}
              </View>

              <View style={styles.petBasicInfo}>
                <Text style={styles.petName}>{selectedPet.name}</Text>
                <Text style={styles.petDetails}>
                  {selectedPet.species} • {selectedPet.breed || 'Mixed breed'}
                </Text>
                {selectedPet.weight && (
                  <Text style={styles.petWeight}>
                    Current Weight:{' '}
                    {typeof selectedPet.weight === 'object'
                      ? `${selectedPet.weight.value} ${selectedPet.weight.unit}`
                      : `${selectedPet.weight} ${selectedPet.weightUnit || 'kg'}`}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Health Log Entries */}
        <Animated.View
          entering={SlideInDown.delay(600).springify()}
          style={styles.healthLogSection}
        >
          <Text style={styles.sectionTitle}>
            Health Records ({healthLogs.length})
          </Text>

          {healthLogs.length === 0 ? (
            <View style={styles.emptyLogState}>
              <Ionicons
                name='medical-outline'
                size={48}
                color={COLORS.mediumGray}
              />
              <Text style={styles.emptyLogText}>No health records yet</Text>
              <Text style={styles.emptyLogSubtext}>
                Tap the + button to add your first health log entry
              </Text>
            </View>
          ) : (
            healthLogs.map((log, index) => (
              <Animated.View
                key={log.id}
                entering={SlideInDown.delay(700 + index * 100).springify()}
                style={styles.healthLogCard}
              >
                <View style={styles.logHeader}>
                  <View style={styles.logTypeIndicator}>
                    <View
                      style={[
                        styles.logTypeIcon,
                        { backgroundColor: getHealthTypeColor(log.type) },
                      ]}
                    >
                      <Ionicons
                        name={getHealthTypeIcon(log.type)}
                        size={16}
                        color={COLORS.white}
                      />
                    </View>
                    <View style={styles.logTitleContainer}>
                      <Text style={styles.logTitle}>{log.title}</Text>
                      <Text style={styles.logDate}>
                        {log.date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.logDescription}>{log.description}</Text>

                {(log.veterinarian || log.weight || log.temperature) && (
                  <View style={styles.logMetrics}>
                    {log.veterinarian && (
                      <View style={styles.metricItem}>
                        <Ionicons
                          name='person'
                          size={14}
                          color={COLORS.mediumGray}
                        />
                        <Text style={styles.metricText}>
                          {log.veterinarian}
                        </Text>
                      </View>
                    )}
                    {log.weight && (
                      <View style={styles.metricItem}>
                        <Ionicons
                          name='scale'
                          size={14}
                          color={COLORS.mediumGray}
                        />
                        <Text style={styles.metricText}>{log.weight} kg</Text>
                      </View>
                    )}
                    {log.temperature && (
                      <View style={styles.metricItem}>
                        <Ionicons
                          name='thermometer'
                          size={14}
                          color={COLORS.mediumGray}
                        />
                        <Text style={styles.metricText}>
                          {log.temperature}°C
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Add Health Log Form Modal */}
      {showAddForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Health Log Entry</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Ionicons name='close' size={24} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newLogEntry.title || ''}
                  onChangeText={text =>
                    setNewLogEntry(prev => ({ ...prev, title: text }))
                  }
                  placeholder='e.g., Annual checkup, Vaccination'
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={newLogEntry.description || ''}
                  onChangeText={text =>
                    setNewLogEntry(prev => ({ ...prev, description: text }))
                  }
                  placeholder='Describe the health event or observation...'
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Veterinarian</Text>
                <TextInput
                  style={styles.formInput}
                  value={newLogEntry.veterinarian || ''}
                  onChangeText={text =>
                    setNewLogEntry(prev => ({ ...prev, veterinarian: text }))
                  }
                  placeholder='Dr. Name'
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newLogEntry.weight?.toString() || ''}
                    onChangeText={text =>
                      setNewLogEntry(prev => ({
                        ...prev,
                        weight: text ? parseFloat(text) : undefined,
                      }))
                    }
                    placeholder='25.5'
                    keyboardType='numeric'
                  />
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Temperature (°C)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newLogEntry.temperature?.toString() || ''}
                    onChangeText={text =>
                      setNewLogEntry(prev => ({
                        ...prev,
                        temperature: text ? parseFloat(text) : undefined,
                      }))
                    }
                    placeholder='38.5'
                    keyboardType='numeric'
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Additional Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={newLogEntry.notes || ''}
                  onChangeText={text =>
                    setNewLogEntry(prev => ({ ...prev, notes: text }))
                  }
                  placeholder='Any additional observations or notes...'
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveHealthLog}
              >
                <LinearGradient
                  colors={[COLORS.success, '#0D9488']}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  headerAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  addPetButton: {
    backgroundColor: COLORS.lightCyan,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPetButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  petSelection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 15,
    marginTop: 20,
  },
  petScrollView: {
    marginBottom: 10,
  },
  petCard: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.softGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPetCard: {
    borderColor: COLORS.lightCyan,
    backgroundColor: 'rgba(93, 212, 220, 0.1)',
  },
  petCardImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  petCardPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  petCardName: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.deepNavy,
    textAlign: 'center',
  },
  petInfoSection: {
    marginBottom: 10,
  },
  petInfoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  petImageContainer: {
    marginRight: 15,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  petImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petBasicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 6,
  },
  petWeight: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
  },
  healthLogSection: {
    flex: 1,
  },
  emptyLogState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLogText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginTop: 15,
    marginBottom: 8,
  },
  emptyLogSubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  healthLogCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logHeader: {
    marginBottom: 12,
  },
  logTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logTitleContainer: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 2,
  },
  logDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  logDescription: {
    fontSize: 14,
    color: COLORS.deepNavy,
    lineHeight: 20,
    marginBottom: 12,
  },
  logMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  logNotes: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    backgroundColor: COLORS.softGray,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
  },
  formScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.deepNavy,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
});
