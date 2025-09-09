import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
  Image,
  Share
} from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Chip,
  FAB,
  Button,
  ActivityIndicator,
  Avatar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Navigation types (imported from AppNavigator)
type RootStackParamList = {
  PetDetail: { petId: string };
  LocationHistory: { petId: string };
  AddPet: undefined;
};

type PetDetailScreenRouteProp = RouteProp<RootStackParamList, 'PetDetail'>;
type PetDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PetDetail'>;

interface Props {
  route: PetDetailScreenRouteProp;
  navigation: PetDetailScreenNavigationProp;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  color?: string;
  microchipId?: string;
  photos: string[];
  medicalConditions: string[];
  vaccinations: Vaccination[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  veterinarian?: {
    name: string;
    phone: string;
    address: string;
  };
  status: 'active' | 'lost' | 'found';
  lastSeen?: {
    date: Date;
    location: string;
  };
  notes?: string;
  createdAt: Date;
}

interface Vaccination {
  id: string;
  name: string;
  dateAdministered: Date;
  nextDue?: Date;
  veterinarian: string;
  notes?: string;
}

export const PetDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme();
  const { petId } = route.params;
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const loadPetDetails = useCallback(async () => {
    try {
      // Mock pet data - replace with actual API call
      const mockPet: Pet = {
        id: petId,
        name: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
        weight: 30.5,
        color: 'Golden',
        microchipId: '123456789012345',
        photos: [
          'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
          'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400'
        ],
        medicalConditions: ['Allergies', 'Hip Dysplasia'],
        vaccinations: [
          {
            id: '1',
            name: 'Rabies',
            dateAdministered: new Date('2024-01-15'),
            nextDue: new Date('2025-01-15'),
            veterinarian: 'Dr. Smith',
            notes: 'Annual vaccination'
          },
          {
            id: '2',
            name: 'DHPP',
            dateAdministered: new Date('2024-02-01'),
            nextDue: new Date('2025-02-01'),
            veterinarian: 'Dr. Smith'
          }
        ],
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+1 (555) 987-6543',
          relation: 'Family Member'
        },
        veterinarian: {
          name: 'Happy Paws Veterinary Clinic',
          phone: '+1 (555) 123-4567',
          address: '123 Pet Street, San Francisco, CA'
        },
        status: 'active',
        notes: 'Friendly and energetic dog. Loves to play fetch and swim.',
        createdAt: new Date('2024-01-01')
      };
      
      setPet(mockPet);
    } catch (error) {
      console.error('Failed to load pet details:', error);
      Alert.alert('Error', 'Failed to load pet information');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadPetDetails();
  }, [loadPetDetails]);

  const handleReportLost = () => {
    if (!pet) return;

    Alert.alert(
      'Report Lost Pet',
      `Are you sure you want to report ${pet.name} as lost? This will send alerts to nearby users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Lost',
          style: 'destructive',
          onPress: () => {
            // Implement lost pet reporting logic
            setPet({ ...pet, status: 'lost', lastSeen: { date: new Date(), location: 'Current Location' } });
            Alert.alert('Lost Pet Reported', 'Alert has been sent to nearby users.');
          }
        }
      ]
    );
  };

  const handleMarkFound = () => {
    if (!pet) return;

    Alert.alert(
      'Mark as Found',
      `Mark ${pet.name} as found and cancel lost alerts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Found',
          onPress: () => {
            setPet({ ...pet, status: 'active' });
            Alert.alert('Great News!', `${pet.name} has been marked as found!`);
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    if (!pet) return;

    try {
      const message = `Check out my pet ${pet.name}!\n\nBreed: ${pet.breed}\nAge: ${pet.age} years\n\nShared via TailTracker`;
      await Share.share({
        message,
        title: `Meet ${pet.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleEditPet = () => {
    // Navigate to edit screen - implement when available
    Alert.alert('Edit Pet', 'Edit pet feature coming soon!');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            Loading pet details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="paw-off" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Pet not found
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.retryButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: Pet['status']) => {
    switch (status) {
      case 'lost':
        return theme.colors.error;
      case 'found':
        return theme.colors.tertiary;
      default:
        return theme.colors.primary;
    }
  };

  const getStatusLabel = (status: Pet['status']) => {
    switch (status) {
      case 'lost':
        return 'Missing';
      case 'found':
        return 'Found';
      default:
        return 'Active';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        <View style={styles.photoContainer}>
          {pet.photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
            >
              {pet.photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo }} style={styles.petPhoto} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.placeholderPhoto, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon name="camera-plus" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
                No photos
              </Text>
            </View>
          )}
          
          {pet.photos.length > 1 && (
            <View style={styles.photoIndicator}>
              {pet.photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === currentImageIndex 
                        ? theme.colors.primary 
                        : theme.colors.outline
                    }
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Pet Info Header */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.petInfo}>
                <Text style={[styles.petName, { color: theme.colors.onSurface }]}>
                  {pet.name}
                </Text>
                <Text style={[styles.petBreed, { color: theme.colors.onSurfaceVariant }]}>
                  {pet.breed} • {pet.species}
                </Text>
              </View>
              <Chip 
                style={{ backgroundColor: getStatusColor(pet.status) }}
                textStyle={{ color: 'white' }}
              >
                {getStatusLabel(pet.status)}
              </Chip>
            </View>
            
            {pet.status === 'lost' && pet.lastSeen && (
              <View style={[styles.lostAlert, { backgroundColor: theme.colors.errorContainer }]}>
                <Icon name="alert" size={20} color={theme.colors.error} />
                <Text style={[styles.lostText, { color: theme.colors.error }]}>
                  Last seen: {pet.lastSeen.date.toLocaleDateString()} at {pet.lastSeen.location}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Basic Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Basic Information
            </Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Icon name="calendar" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Age</Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  {pet.age ? `${pet.age} years` : 'Unknown'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Icon name="scale" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Weight</Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  {pet.weight ? `${pet.weight} lbs` : 'Unknown'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Icon name="palette" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Color</Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  {pet.color || 'Not specified'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Icon name="chip" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Microchip</Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  {pet.microchipId ? pet.microchipId.slice(-6) : 'None'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Medical Conditions */}
        {pet.medicalConditions.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Medical Conditions
              </Text>
              <View style={styles.chipContainer}>
                {pet.medicalConditions.map((condition, index) => (
                  <Chip
                    key={index}
                    style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
                    textStyle={{ color: theme.colors.onSecondaryContainer }}
                  >
                    {condition}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Vaccinations */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Vaccinations
              </Text>
              <Button mode="text" onPress={() => Alert.alert('Add Vaccination', 'Feature coming soon!')}>
                Add
              </Button>
            </View>
            
            {pet.vaccinations.map((vaccination) => (
              <View key={vaccination.id} style={styles.vaccinationItem}>
                <View style={styles.vaccinationInfo}>
                  <Text style={[styles.vaccinationName, { color: theme.colors.onSurface }]}>
                    {vaccination.name}
                  </Text>
                  <Text style={[styles.vaccinationDate, { color: theme.colors.onSurfaceVariant }]}>
                    Given: {vaccination.dateAdministered.toLocaleDateString()}
                  </Text>
                  {vaccination.nextDue && (
                    <Text style={[styles.vaccinationDue, { color: theme.colors.primary }]}>
                      Next due: {vaccination.nextDue.toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Icon 
                  name="check-circle" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Emergency Contacts */}
        {pet.emergencyContact && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Emergency Contact
              </Text>
              <TouchableOpacity style={styles.contactItem}>
                <Avatar.Icon size={40} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} />
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: theme.colors.onSurface }]}>
                    {pet.emergencyContact.name}
                  </Text>
                  <Text style={[styles.contactPhone, { color: theme.colors.primary }]}>
                    {pet.emergencyContact.phone}
                  </Text>
                  <Text style={[styles.contactRelation, { color: theme.colors.onSurfaceVariant }]}>
                    {pet.emergencyContact.relation}
                  </Text>
                </View>
                <Icon name="phone" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}

        {/* Veterinarian */}
        {pet.veterinarian && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Veterinarian
              </Text>
              <TouchableOpacity style={styles.contactItem}>
                <Avatar.Icon size={40} icon="medical-bag" style={{ backgroundColor: theme.colors.tertiaryContainer }} />
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: theme.colors.onSurface }]}>
                    {pet.veterinarian.name}
                  </Text>
                  <Text style={[styles.contactPhone, { color: theme.colors.primary }]}>
                    {pet.veterinarian.phone}
                  </Text>
                  <Text style={[styles.contactRelation, { color: theme.colors.onSurfaceVariant }]}>
                    {pet.veterinarian.address}
                  </Text>
                </View>
                <Icon name="phone" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}

        {/* Notes */}
        {pet.notes && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Notes
              </Text>
              <Text style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]}>
                {pet.notes}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {pet.status === 'lost' ? (
            <Button
              mode="contained"
              onPress={handleMarkFound}
              style={[styles.actionButton, { backgroundColor: theme.colors.tertiary }]}
              icon="check-circle"
            >
              Mark as Found
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleReportLost}
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
              icon="alert"
            >
              Report Lost
            </Button>
          )}
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('LocationHistory', { petId: pet.id })}
            style={[styles.actionButton, { borderColor: theme.colors.outline }]}
            icon="map-marker-path"
          >
            Location History
          </Button>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FAB
          icon="share"
          style={[styles.fab, styles.shareFab, { backgroundColor: theme.colors.secondary }]}
          onPress={handleShare}
          size="medium"
        />
        <FAB
          icon="pencil"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleEditPet}
          size="medium"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  photoContainer: {
    position: 'relative',
  },
  petPhoto: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  placeholderPhoto: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
  },
  photoIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 16,
  },
  lostAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  lostText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  vaccinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  vaccinationInfo: {
    flex: 1,
  },
  vaccinationName: {
    fontSize: 16,
    fontWeight: '500',
  },
  vaccinationDate: {
    fontSize: 14,
    marginTop: 2,
  },
  vaccinationDue: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  contactRelation: {
    fontSize: 12,
    marginTop: 2,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButton: {
    marginVertical: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    marginBottom: 12,
  },
  shareFab: {
    marginBottom: 16,
  },
});