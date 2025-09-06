/**
 * TailTracker Premium Pet Card Component
 * 
 * A beautiful, magazine-quality pet card with smooth animations,
 * haptic feedback, and delightful micro-interactions.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Pressable,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';

import { Pet } from '@/services/PetService';
import premiumAnimations from '../../design-system/animations/premiumAnimations';
import { useMaterialTheme } from '../../theme/MaterialThemeProvider';
import hapticUtils from '../../utils/hapticUtils';
import PremiumButton from '../UI/PremiumButton';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32;

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface PremiumPetCardProps {
  pet: Pet;
  variant?: 'standard' | 'hero' | 'compact' | 'featured';
  showMood?: boolean;
  showHealthIndicator?: boolean;
  showActivityLevel?: boolean;
  onPress?: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
  onLocationPress?: (pet: Pet) => void;
  onHealthPress?: (pet: Pet) => void;
  style?: ViewStyle;
}

// ====================================
// PREMIUM PET CARD COMPONENT
// ====================================

export const PremiumPetCard: React.FC<PremiumPetCardProps> = ({
  pet,
  variant = 'standard',
  showMood = true,
  showHealthIndicator = true,
  showActivityLevel = true,
  onPress,
  onEdit,
  onDelete,
  onLocationPress,
  onHealthPress,
  style,
}) => {
  const { theme } = useMaterialTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.1);
  const moodScale = useSharedValue(1);
  
  // State
  const [isPressed, setIsPressed] = useState(false);
  
  // ====================================
  // ANIMATION STYLES
  // ====================================
  
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      shadowOpacity: shadowOpacity.value,
    };
  });
  
  const animatedMoodStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: moodScale.value }],
    };
  });
  
  // ====================================
  // EVENT HANDLERS
  // ====================================
  
  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    
    // Haptic feedback
    hapticUtils.card();
    
    // Animation
    const hoverAnimation = premiumAnimations.cards.hover();
    scale.value = hoverAnimation.enter().scale;
    translateY.value = hoverAnimation.enter().translateY;
    shadowOpacity.value = hoverAnimation.enter().shadowOpacity;
    
    // Mood animation if pet is in good mood
    if (pet.mood && ['happy', 'playful', 'excited'].includes(pet.mood)) {
      const moodAnimation = premiumAnimations.pets.mood(pet.mood as any);
      moodScale.value = moodAnimation.scale || 1;
    }
  }, [pet.mood, moodScale, scale, shadowOpacity, translateY]);
  
  const handlePressOut = useCallback(() => {
    setIsPressed(false);
    
    // Animation
    const hoverAnimation = premiumAnimations.cards.hover();
    scale.value = hoverAnimation.exit().scale;
    translateY.value = hoverAnimation.exit().translateY;
    shadowOpacity.value = hoverAnimation.exit().shadowOpacity;
    moodScale.value = premiumAnimations.springs.gentle;
  }, [moodScale, scale, shadowOpacity, translateY]);
  
  const handlePress = useCallback(() => {
    if (onPress) {
      // Success haptic for main action
      hapticUtils.pet.mood(pet.mood as any || 'happy');
      onPress(pet);
    }
  }, [onPress, pet]);
  
  // ====================================
  // HELPER FUNCTIONS
  // ====================================
  
  const getAge = (birthDate: string | undefined): string => {
    if (!birthDate) return 'Unknown age';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInYears = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (ageInYears < 1) {
      const ageInMonths = monthDiff <= 0 ? 12 + monthDiff : monthDiff;
      return `${ageInMonths} months`;
    }
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return `${ageInYears - 1} years`;
    }
    
    return `${ageInYears} years`;
  };
  
  const getStatusColor = () => {
    switch (pet.status) {
      case 'lost':
        return '#EF4444';
      case 'found':
        return '#10B981';
      case 'deceased':
        return '#6B7280';
      default:
        return '#3B82F6';
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
        return 'Safe';
    }
  };
  
  const getMoodIcon = (mood: string | undefined) => {
    switch (mood) {
      case 'happy':
        return 'happy-outline';
      case 'playful':
        return 'tennisball-outline';
      case 'sleepy':
        return 'moon-outline';
      case 'excited':
        return 'flame-outline';
      case 'calm':
        return 'leaf-outline';
      default:
        return 'heart-outline';
    }
  };
  
  const getMoodColor = (mood: string | undefined) => {
    switch (mood) {
      case 'happy':
        return '#F59E0B';
      case 'playful':
        return '#10B981';
      case 'sleepy':
        return '#6366F1';
      case 'excited':
        return '#EF4444';
      case 'calm':
        return '#8B5CF6';
      default:
        return theme.colors.primary;
    }
  };
  
  const getHealthColor = (status: string | undefined) => {
    switch (status) {
      case 'excellent':
        return '#10B981';
      case 'good':
        return '#22C55E';
      case 'fair':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
      case 'critical':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };
  
  const getActivityLevelIcon = (level: string | undefined) => {
    switch (level) {
      case 'high':
        return 'flash-outline';
      case 'medium':
        return 'walk-outline';
      case 'low':
        return 'bed-outline';
      default:
        return 'help-circle-outline';
    }
  };
  
  const getCardHeight = () => {
    switch (variant) {
      case 'hero':
        return 280;
      case 'compact':
        return 120;
      case 'featured':
        return 240;
      default:
        return 180;
    }
  };
  
  // ====================================
  // RENDER HELPERS
  // ====================================
  
  const renderStatusBadge = () => (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.statusText}>{getStatusText()}</Text>
    </View>
  );
  
  const renderMoodIndicator = () => {
    if (!showMood || !pet.mood) return null;
    
    return (
      <Animated.View style={[styles.moodIndicator, animatedMoodStyle]}>
        <LinearGradient
          colors={[getMoodColor(pet.mood), `${getMoodColor(pet.mood)}80`]}
          style={styles.moodGradient}
        >
          <Ionicons
            name={getMoodIcon(pet.mood) as any}
            size={16}
            color="#FFFFFF"
          />
        </LinearGradient>
      </Animated.View>
    );
  };
  
  const renderHealthIndicator = () => {
    if (!showHealthIndicator || !pet.health_status) return null;
    
    return (
      <Pressable
        style={styles.healthIndicator}
        onPress={() => {
          hapticUtils.pet.health(pet.health_status as any);
          onHealthPress?.(pet);
        }}
      >
        <View style={[styles.healthDot, { backgroundColor: getHealthColor(pet.health_status) }]} />
        <Text style={styles.healthText}>{pet.health_status}</Text>
      </Pressable>
    );
  };
  
  const renderActivityLevel = () => {
    if (!showActivityLevel || !pet.activity_level) return null;
    
    return (
      <View style={styles.activityContainer}>
        <Ionicons
          name={getActivityLevelIcon(pet.activity_level) as any}
          size={14}
          color={theme.colors.onSurface}
        />
        <Text style={styles.activityText}>{pet.activity_level} activity</Text>
      </View>
    );
  };
  
  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {onLocationPress && (
        <PremiumButton
          title=""
          icon="location-outline"
          variant="ghost"
          size="small"
          emotion="trust"
          onPress={() => onLocationPress(pet)}
          style={styles.actionButton}
        />
      )}
      {onEdit && (
        <PremiumButton
          title=""
          icon="create-outline"
          variant="ghost"
          size="small"
          emotion="calm"
          onPress={() => onEdit(pet)}
          style={styles.actionButton}
        />
      )}
    </View>
  );
  
  const renderPetInfo = () => (
    <View style={styles.petInfo}>
      <View style={styles.petHeader}>
        <View style={styles.petNameContainer}>
          <Text style={[styles.petName, { color: theme.colors.onSurface }]}>
            {pet.name}
          </Text>
          {renderMoodIndicator()}
        </View>
        {renderStatusBadge()}
      </View>
      
      <Text style={[styles.petDetails, { color: theme.colors.onSurfaceVariant }]}>
        {pet.species}
        {pet.breed && ` • ${pet.breed}`}
        {pet.date_of_birth && ` • ${getAge(pet.date_of_birth)}`}
      </Text>
      
      <View style={styles.indicators}>
        {renderHealthIndicator()}
        {renderActivityLevel()}
      </View>
      
      {pet.microchip_number && (
        <View style={styles.microchipContainer}>
          <Ionicons name="pricetag-outline" size={14} color={theme.colors.primary} />
          <Text style={[styles.microchipText, { color: theme.colors.primary }]}>
            {pet.microchip_number}
          </Text>
        </View>
      )}
    </View>
  );
  
  // ====================================
  // RENDER COMPONENT
  // ====================================
  
  return (
    <Animated.View style={[styles.cardContainer, animatedCardStyle, style]}>
      <Pressable
        style={[styles.card, { height: getCardHeight() }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`Pet card for ${pet.name}`}
        accessibilityHint="Double tap to view pet details"
        accessibilityRole="button"
      >
        {/* Background Image */}
        {pet.photo_url && (
          <ImageBackground
            source={{ uri: pet.photo_url }}
            style={styles.backgroundImage}
            imageStyle={styles.backgroundImageStyle}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.backgroundGradient}
            />
          </ImageBackground>
        )}
        
        {/* Content Overlay */}
        <BlurView intensity={20} tint="dark" style={styles.contentOverlay}>
          <View style={styles.content}>
            {renderPetInfo()}
            {variant !== 'compact' && renderQuickActions()}
          </View>
        </BlurView>
        
        {/* Emergency Contact Info */}
        {pet.emergency_contact_name && variant === 'hero' && (
          <View style={styles.emergencyInfo}>
            <Ionicons name="call-outline" size={14} color="#10B981" />
            <Text style={styles.emergencyText} numberOfLines={1}>
              {pet.emergency_contact_name}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImageStyle: {
    borderRadius: 20,
  },
  backgroundGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  contentOverlay: {
    flex: 1,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  
  // Pet Info
  petInfo: {
    flex: 1,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  petNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  petDetails: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.9,
  },
  
  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Mood Indicator
  moodIndicator: {
    marginLeft: 8,
  },
  moodGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Indicators
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#FFFFFF',
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  
  // Microchip
  microchipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  microchipText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Emergency Info
  emergencyInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  emergencyText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
});

export default PremiumPetCard;