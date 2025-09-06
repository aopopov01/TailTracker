import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  FadeIn,
  SlideInDown,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Ellipse, Polygon, Rect, LinearGradient as SvgLinearGradient, Stop, Defs, G, Line } from 'react-native-svg';

import { databaseService, StoredPetProfile } from '../../services/database';
import { useAuth } from '../../src/contexts/AuthContext';
import { log } from '../../src/utils/Logger';

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

// Pet Icons (same as from basic-info)
const DogIcon = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="dogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5DD4DC"/>
        <Stop offset="100%" stopColor="#4BA8B5"/>
      </SvgLinearGradient>
    </Defs>
    <Rect width="100" height="100" rx="20" fill="url(#dogGradient)"/>
    <G fill="white">
      <Ellipse cx="50" cy="65" rx="25" ry="20"/>
      <Circle cx="50" cy="40" r="18"/>
      <Ellipse cx="62" cy="42" rx="8" ry="5"/>
      <Ellipse cx="40" cy="28" rx="6" ry="12" transform="rotate(-30 40 28)"/>
      <Ellipse cx="60" cy="28" rx="6" ry="12" transform="rotate(30 60 28)"/>
      <Ellipse cx="72" cy="55" rx="4" ry="15" transform="rotate(45 72 55)"/>
      <Rect x="35" y="80" width="4" height="15" rx="2"/>
      <Rect x="45" y="80" width="4" height="15" rx="2"/>
      <Rect x="55" y="80" width="4" height="15" rx="2"/>
      <Rect x="65" y="80" width="4" height="15" rx="2"/>
    </G>
  </Svg>
);

const CatIcon = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="catGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4BA8B5"/>
        <Stop offset="100%" stopColor="#1B3A57"/>
      </SvgLinearGradient>
    </Defs>
    <Rect width="100" height="100" rx="20" fill="url(#catGradient)"/>
    <G fill="white">
      <Ellipse cx="50" cy="70" rx="22" ry="25"/>
      <Circle cx="50" cy="40" r="16"/>
      <Polygon points="38,25 42,10 48,25"/>
      <Polygon points="52,25 58,10 62,25"/>
      <Polygon points="40,22 42,15 46,22" fill="#4BA8B5"/>
      <Polygon points="54,22 58,15 60,22" fill="#4BA8B5"/>
      <Ellipse cx="50" cy="45" rx="3" ry="2"/>
      <Line x1="30" y1="42" x2="40" y2="40" stroke="white" strokeWidth="1"/>
      <Line x1="30" y1="46" x2="40" y2="46" stroke="white" strokeWidth="1"/>
      <Line x1="60" y1="40" x2="70" y2="42" stroke="white" strokeWidth="1"/>
      <Line x1="60" y1="46" x2="70" y2="46" stroke="white" strokeWidth="1"/>
      <Path d="M 72 65 Q 80 50 75 35" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round"/>
    </G>
  </Svg>
);

const ParrotIcon = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="parrotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#1B3A57"/>
        <Stop offset="100%" stopColor="#0F1F35"/>
      </SvgLinearGradient>
    </Defs>
    <Rect width="100" height="100" rx="20" fill="url(#parrotGradient)"/>
    <G fill="white">
      <Ellipse cx="50" cy="65" rx="18" ry="25"/>
      <Circle cx="50" cy="38" r="15"/>
      <Polygon points="42,20 45,8 48,20"/>
      <Polygon points="48,20 50,5 52,20"/>
      <Polygon points="52,20 55,8 58,20"/>
      <Path d="M 62 38 Q 70 42 65 48 Q 62 45 62 38" fill="white"/>
      <Ellipse cx="45" cy="65" rx="8" ry="20"/>
      <Ellipse cx="40" cy="65" rx="4" ry="18" fill="#5DD4DC" fillOpacity="0.3"/>
      <Ellipse cx="50" cy="85" rx="12" ry="8"/>
      <Ellipse cx="52" cy="90" rx="8" ry="5" fill="#5DD4DC" fillOpacity="0.3"/>
      <Circle cx="52" cy="35" r="2" fill="#1B3A57"/>
    </G>
  </Svg>
);

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

const getPetIcon = (species: string, size: number = 80) => {
  switch (species) {
    case 'dog':
      return <DogIcon size={size} />;
    case 'cat':
      return <CatIcon size={size} />;
    case 'bird':
      return <ParrotIcon size={size} />;
    default:
      return <DogIcon size={size} />;
  }
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

const PetAvatar: React.FC<{ pet: StoredPetProfile; size?: number }> = ({ pet, size = 70 }) => {
  const photos = getPetPhotos(pet.photos);
  const hasPhoto = photos.length > 0;

  if (hasPhoto) {
    return (
      <View style={[styles.petImageContainer, { width: size, height: size }]}>
        <Image 
          source={{ uri: photos[0] }} 
          style={[styles.petImage, { width: size, height: size }]}
          onError={() => {
            // If image fails to load, fallback to default icon
            // Note: Consider using a logger service instead of console.log in production
          }}
        />
      </View>
    );
  }

  return getPetIcon(pet.species ?? 'other', size);
};

// Swipeable Pet Card Component
interface SwipeablePetCardProps {
  pet: StoredPetProfile;
  onDelete: (petId: number, petName: string) => void;
  onEdit?: (petId: number) => void;
  isNewlyCreated: boolean;
  onPress?: () => void;
}

const SwipeablePetCard: React.FC<SwipeablePetCardProps> = ({ 
  pet, 
  onDelete, 
  onEdit, 
  isNewlyCreated,
  onPress 
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const SWIPE_THRESHOLD = -80;
  const DELETE_THRESHOLD = -120;

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {},
    onActive: (event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, DELETE_THRESHOLD);
      }
    },
    onEnd: (event) => {
      if (event.translationX < SWIPE_THRESHOLD) {
        if (event.translationX < DELETE_THRESHOLD) {
          // Delete action
          runOnJS(onDelete)(pet.id, pet.name ?? 'Pet');
        }
        // Show delete button
        translateX.value = withSpring(SWIPE_THRESHOLD);
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: Math.abs(translateX.value) > 10 ? 1 : 0,
  }));

  return (
    <View style={styles.swipeContainer}>
      {/* Delete background */}
      <Animated.View 
        style={[
          styles.deleteBackground, 
          backgroundStyle,
          styles.deleteBackgroundFull
        ]}
      >
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={styles.deleteGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.deleteContent}>
            <Ionicons name="trash-outline" size={24} color={COLORS.white} />
            <Text style={styles.deleteText}>Delete</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Pet Card */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[animatedStyle]}>
          <TouchableOpacity 
            style={[
              styles.petCard,
              isNewlyCreated && styles.petCardHighlighted
            ]}
            activeOpacity={0.8}
            onPress={onPress}
          >
            <View style={styles.petCardContent}>
              <View style={styles.petIconContainer}>
                <PetAvatar pet={pet} size={70} />
              </View>
              
              <View style={styles.petInfo}>
                <View style={styles.petNameContainer}>
                  <Text style={styles.petName}>{pet.name ?? 'Unnamed Pet'}</Text>
                  {isNewlyCreated && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.petBreed}>{pet.breed ?? 'Mixed breed'}</Text>
                <Text style={styles.petAge}>
                  {calculateAge(pet.dateOfBirth, pet.approximateAge, pet.useApproximateAge)} old
                </Text>
                
                <View style={styles.petStatus}>
                  <View style={styles.statusItem}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={16} 
                      color={COLORS.success} 
                    />
                    <Text style={[styles.statusText, { color: COLORS.success }]}>
                      Profile Complete
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.petActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.mediumGray} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="medical-outline" size={20} color={COLORS.mediumGray} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.petCardFooter}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Weight:</Text>
                <Text style={styles.footerValue}>
                  {pet.weight ? `${pet.weight} ${pet.weightUnit ?? 'kg'}` : 'Not specified'}
                </Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Photos:</Text>
                <Text style={styles.footerValue}>
                  {getPetPhotos(pet.photos).length > 0 ? `${getPetPhotos(pet.photos).length} uploaded` : 'None'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [pets, setPets] = useState<StoredPetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newlyCreatedPetId, setNewlyCreatedPetId] = useState<number | null>(null);

  // Calculate real statistics
  const stats = {
    activePets: pets.length,
    dueSoon: pets.filter(pet => {
      // Calculate if any vaccinations are due soon (within 30 days)
      // For now, return 0 since we don't have vaccination data yet
      return false;
    }).length,
    records: pets.reduce((total, pet) => {
      // Count records for each pet (profile + vaccinations + health records)
      // For now, each pet has at least 1 record (their profile)
      return total + 1;
    }, 0)
  };

  const loadPets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Loading pets for user
      const petProfiles = await databaseService.getAllPets(parseInt(user.id, 10));
      // Retrieved pet profiles successfully
      setPets(petProfiles);
      
      // Check if there's a newly created pet (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentPet = petProfiles.find(pet => 
        new Date(pet.createdAt) > fiveMinutesAgo
      );
      
      if (recentPet && !newlyCreatedPetId) {
        setNewlyCreatedPetId(recentPet.id);
        // Clear the highlight after 30 seconds
        setTimeout(() => {
          setNewlyCreatedPetId(null);
        }, 30000);
      }
    } catch (error) {
      log.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  }, [user, newlyCreatedPetId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  };

  const handleAddPet = () => {
    router.push('/onboarding/welcome' as any);
  };

  const isNewlyCreated = (pet: StoredPetProfile) => {
    return pet.id === newlyCreatedPetId;
  };

  const handleDeletePet = (petId: number, petName: string) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${petName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await databaseService.deletePet(petId, parseInt(user.id, 10));
                await loadPets(); // Reload the pet list
              }
            } catch (error) {
              log.error('Error deleting pet:', error);
              Alert.alert('Error', 'Failed to delete pet. Please try again.');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  // Auto-refresh when screen comes into focus (e.g., after creating a pet)
  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading your pets...</Text>
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to TailTracker!</Text>
          <Text style={styles.headerTitle}>Let's add your first pet</Text>
        </View>
        <View style={[styles.container, styles.centerContent]}>
          <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddPet}>
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.emptyStateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle" size={48} color={COLORS.white} />
              <Text style={styles.emptyStateText}>Add Your First Pet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View entering={FadeIn.delay(200).duration(600)}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.headerTitle}>Your Pet Family</Text>
          </View>
        </Animated.View>
        
        <Animated.View entering={FadeIn.delay(400).duration(600)}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        <Animated.View
          entering={SlideInDown.delay(600).springify()}
          style={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.success, '#0D9488']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="heart" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.activePets}</Text>
              <Text style={styles.statLabel}>Active Pets</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.warning, '#D97706']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="medical" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.dueSoon}</Text>
              <Text style={styles.statLabel}>Due Soon</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="document-text" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.records}</Text>
              <Text style={styles.statLabel}>Records</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Your Pets Section */}
        <Animated.View
          entering={SlideInDown.delay(800).springify()}
          style={styles.petsSection}
        >
          <Text style={styles.sectionTitle}>Your Pets</Text>
          
          {pets.map((pet, index) => (
            <Animated.View
              key={pet.id}
              entering={SlideInDown.delay(900 + (index * 100)).springify()}
            >
              {isNewlyCreated(pet) && (
                <Animated.View
                  entering={FadeIn.delay(1000).duration(800)}
                  style={styles.welcomeMessage}
                >
                  <LinearGradient
                    colors={[COLORS.lightCyan, COLORS.midCyan]}
                    style={styles.welcomeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                    <Text style={styles.welcomeTitle}>Welcome to TailTracker!</Text>
                    <Text style={styles.welcomeMessageText}>
                      {pet.name}'s profile has been created successfully. You can now track their health, vaccinations, and more!
                    </Text>
                  </LinearGradient>
                </Animated.View>
              )}
              
              <SwipeablePetCard
                pet={pet}
                onDelete={handleDeletePet}
                isNewlyCreated={isNewlyCreated(pet)}
                onPress={() => router.push(`/(tabs)/pet-detail?petId=${parseInt(pet.id.toString(), 10)}` as any)}
              />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={SlideInDown.delay(1200).springify()}
          style={styles.quickActionsSection}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={handleAddPet}>
              <LinearGradient
                colors={[COLORS.lightCyan, COLORS.midCyan]}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add-circle" size={28} color={COLORS.white} />
                <Text style={styles.quickActionText}>Add Pet</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.success, '#0D9488']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="calendar" size={28} color={COLORS.white} />
                <Text style={styles.quickActionText}>Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.warning, '#D97706']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="medical" size={28} color={COLORS.white} />
                <Text style={styles.quickActionText}>Health Log</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.deepNavy, '#0F172A']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="location" size={28} color={COLORS.white} />
                <Text style={styles.quickActionText}>Find Vet</Text>
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  petsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 16,
  },
  petCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  petCardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  petIconContainer: {
    marginRight: 16,
  },
  petImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  petImage: {
    borderRadius: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 2,
  },
  petAge: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  petStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  petActions: {
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.softGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  petCardFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.deepNavy,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
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
  quickActionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 8,
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
  emptyStateButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyStateGradient: {
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  welcomeMessage: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  welcomeGradient: {
    padding: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 4,
  },
  welcomeMessageText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  petNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petCardHighlighted: {
    borderColor: COLORS.lightCyan,
    borderWidth: 2,
  },
  newBadge: {
    backgroundColor: COLORS.lightCyan,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Swipe-to-delete styles
  swipeContainer: {
    marginBottom: 16,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    borderRadius: 20,
    overflow: 'hidden',
  },
  deleteGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 20,
  },
  deleteContent: {
    alignItems: 'center',
  },
  deleteText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  deleteBackgroundFull: {
    height: '100%',
  },
});

export default DashboardScreen;