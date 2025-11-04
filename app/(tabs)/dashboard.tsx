import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { databaseService, StoredPetProfile } from '../../services/database';
import { useAuth } from '../../src/contexts/AuthContext';
import { userService } from '../../src/services/userService';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#F39C12',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  mediumGray: '#6C757D',
  darkGray: '#343A40',
  background: '#F5F7FA',
};

interface DashboardStats {
  totalPets: number;
  healthyPets: number;
  upcomingVaccinations: number;
  recentActivities: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'add-pet',
    title: 'Add Pet',
    icon: 'add-circle',
    color: COLORS.primary,
    route: '/add-pet',
  },
  {
    id: 'vaccination',
    title: 'Vaccinations',
    icon: 'medical',
    color: COLORS.success,
    route: '/vaccination',
  },
  {
    id: 'health',
    title: 'Health',
    icon: 'heart',
    color: COLORS.danger,
    route: '/health',
  },
  {
    id: 'appointments',
    title: 'Appointments',
    icon: 'calendar',
    color: COLORS.secondary,
    route: '/appointments',
  },
];

const PetCard: React.FC<{ pet: StoredPetProfile; onPress: () => void }> = ({
  pet,
  onPress,
}) => {
  const getSpeciesIcon = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return 'paw';
      case 'cat':
        return 'paw';
      case 'bird':
        return 'airplane';
      case 'fish':
        return 'fish';
      case 'rabbit':
        return 'ear';
      default:
        return 'heart';
    }
  };

  return (
    <TouchableOpacity
      style={styles.petCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.petCardContent}>
        <View style={styles.petImageContainer}>
          {pet.photoUrl ? (
            <Image source={{ uri: pet.photoUrl }} style={styles.petImage} />
          ) : (
            <View
              style={[
                styles.petImagePlaceholder,
                { backgroundColor: COLORS.lightGray },
              ]}
            >
              <Ionicons
                name={getSpeciesIcon(pet.species)}
                size={24}
                color={COLORS.mediumGray}
              />
            </View>
          )}
        </View>
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petDetails}>
            {pet.breed || pet.species} • {pet.age || 'Age unknown'}
          </Text>
          <View style={styles.healthIndicator}>
            <View
              style={[styles.healthDot, { backgroundColor: COLORS.success }]}
            />
            <Text style={styles.healthText}>Healthy</Text>
          </View>
        </View>
        <Ionicons name='chevron-forward' size={20} color={COLORS.mediumGray} />
      </View>
    </TouchableOpacity>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </View>
);

const QuickActionCard: React.FC<{
  action: QuickAction;
  onPress: () => void;
}> = ({ action, onPress }) => (
  <TouchableOpacity
    style={styles.quickActionCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}
    >
      <Ionicons name={action.icon} size={24} color={action.color} />
    </View>
    <Text style={styles.quickActionTitle}>{action.title}</Text>
  </TouchableOpacity>
);

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<StoredPetProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    healthyPets: 0,
    upcomingVaccinations: 0,
    recentActivities: 0,
  });

  const loadDashboardData = async () => {
    try {
      if (!user?.id) return;

      // Load pets data
      const petProfiles = await databaseService.getUserPets(user.id);
      setPets(petProfiles);

      // Load user's first name
      const userFirstName = await userService.getUserFirstName(user.id);
      setFirstName(userFirstName);

      // Calculate stats
      const totalPets = petProfiles.length;
      const healthyPets = petProfiles.filter(
        (pet: StoredPetProfile) => !pet.medicalConditions?.length
      ).length;

      setStats({
        totalPets,
        healthyPets,
        upcomingVaccinations: 0, // TODO: Calculate from vaccination data
        recentActivities: 0, // TODO: Calculate from activity data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handlePetPress = (pet: StoredPetProfile) => {
    router.push(`/pet/${pet.id}` as any);
  };

  const handleQuickAction = (action: QuickAction) => {
    router.push(action.route as any);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [user?.id])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primary + '90']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>
              {firstName ||
                user?.user_metadata?.first_name ||
                user?.email?.split('@')[0] ||
                'Pet Parent'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons
              name='notifications-outline'
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title='Total Pets'
            value={stats.totalPets}
            icon='paw'
            color={COLORS.primary}
          />
          <StatCard
            title='Healthy'
            value={stats.healthyPets}
            icon='heart'
            color={COLORS.success}
          />
          <StatCard
            title='Vaccinations Due'
            value={stats.upcomingVaccinations}
            icon='medical'
            color={COLORS.warning}
          />
          <StatCard
            title='Activities'
            value={stats.recentActivities}
            icon='fitness'
            color={COLORS.secondary}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(action => (
            <QuickActionCard
              key={action.id}
              action={action}
              onPress={() => handleQuickAction(action)}
            />
          ))}
        </View>
      </View>

      {/* My Pets Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Pets</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/pets' as any)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {pets.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconContainer}>
              <Ionicons name='paw' size={48} color={COLORS.mediumGray} />
            </View>
            <Text style={styles.emptyTitle}>No pets yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first pet to start tracking their health and activities
            </Text>
            <TouchableOpacity
              style={styles.addPetButton}
              onPress={() => router.push('/add-pet' as any)}
            >
              <Text style={styles.addPetButtonText}>Add Your First Pet</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.petsContainer}>
            {pets.slice(0, 3).map((pet, index) => (
              <Animated.View
                key={pet.id}
                entering={FadeInDown.delay(index * 100)}
              >
                <PetCard pet={pet} onPress={() => handlePetPress(pet)} />
              </Animated.View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Activity */}
      {pets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityIconContainer}>
              <Ionicons name='time-outline' size={24} color={COLORS.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>No recent activities</Text>
              <Text style={styles.activityDescription}>
                Activities will appear here once you start using the app
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: COLORS.white + 'CC',
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  petsContainer: {
    gap: 12,
  },
  petCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  petCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImageContainer: {
    marginRight: 16,
  },
  petImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  petImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addPetButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addPetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});
