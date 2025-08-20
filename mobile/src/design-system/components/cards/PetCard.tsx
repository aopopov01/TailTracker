/**
 * PetCard Component
 * 
 * A beautiful, emotionally engaging card that showcases pet information
 * with magazine-quality layout and delightful interactions. This component
 * is the heart of the pet-centric design philosophy.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { tailTrackerColors, colorUtils } from '../../core/colors';
import { tailTrackerTypography } from '../../core/typography';
import { tailTrackerSpacing } from '../../core/spacing';
import { tailTrackerMotions } from '../animations/motionSystem';

// ====================================
// COMPONENT TYPES
// ====================================

export interface PetInfo {
  id: string;
  name: string;
  breed?: string;
  age?: string;
  type: 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'hamster' | 'reptile' | 'other';
  photo: ImageSourcePropType;
  mood?: 'happy' | 'playful' | 'calm' | 'sleepy' | 'anxious' | 'excited';
  lastSeen?: string;
  location?: string;
  healthStatus?: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical';
  activityLevel?: 'veryActive' | 'active' | 'moderate' | 'low' | 'resting';
  batteryLevel?: number; // For trackers
  isOnline?: boolean;
}

export interface PetCardProps {
  pet: PetInfo;
  variant?: 'compact' | 'standard' | 'detailed' | 'hero';
  interactive?: boolean;
  showMood?: boolean;
  showLocation?: boolean;
  showHealth?: boolean;
  showActivity?: boolean;
  showBattery?: boolean;
  onPress?: (pet: PetInfo) => void;
  onLongPress?: (pet: PetInfo) => void;
  onMoodPress?: (pet: PetInfo) => void;
  style?: ViewStyle;
  testID?: string;
}

// ====================================
// HELPER FUNCTIONS
// ====================================

const getMoodInfo = (mood: PetInfo['mood']) => {
  const moodData = tailTrackerColors.moods[mood || 'calm'];
  return {
    color: moodData.color,
    background: moodData.background,
    icon: moodData.icon,
    label: mood?.charAt(0).toUpperCase() + mood?.slice(1) || 'Calm',
  };
};

const getHealthInfo = (status: PetInfo['healthStatus']) => {
  switch (status) {
    case 'excellent':
      return { color: tailTrackerColors.semantic.successPrimary, label: 'Excellent' };
    case 'good':
      return { color: tailTrackerColors.contextual.healthyGreen, label: 'Good' };
    case 'fair':
      return { color: tailTrackerColors.semantic.warningPrimary, label: 'Fair' };
    case 'needs_attention':
      return { color: tailTrackerColors.contextual.concernOrange, label: 'Needs Attention' };
    case 'critical':
      return { color: tailTrackerColors.semantic.errorPrimary, label: 'Critical' };
    default:
      return { color: tailTrackerColors.contextual.unknownGray, label: 'Unknown' };
  }
};

const getActivityInfo = (level: PetInfo['activityLevel']) => {
  return tailTrackerColors.activities[level || 'moderate'];
};

// ====================================
// MAIN COMPONENT
// ====================================

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  variant = 'standard',
  interactive = true,
  showMood = true,
  showLocation = true,
  showHealth = true,
  showActivity = true,
  showBattery = true,
  onPress,
  onLongPress,
  onMoodPress,
  style,
  testID,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(4)).current;
  const [isPressed, setIsPressed] = useState(false);
  
  // Get pet type colors
  const petColors = colorUtils.getPetColor(pet.type);
  const moodInfo = getMoodInfo(pet.mood);
  const healthInfo = getHealthInfo(pet.healthStatus);
  const activityInfo = getActivityInfo(pet.activityLevel);
  
  // ====================================
  // ANIMATION FUNCTIONS
  // ====================================
  
  const animatePress = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 8,
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
        useNativeDriver: false,
      }),
    ]).start();
  };
  
  const animateRelease = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: tailTrackerMotions.durations.quick,
        easing: tailTrackerMotions.easing.bounce,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 4,
        duration: tailTrackerMotions.durations.quick,
        easing: tailTrackerMotions.easing.easeOut,
        useNativeDriver: false,
      }),
    ]).start();
  };
  
  // ====================================
  // EVENT HANDLERS
  // ====================================
  
  const handlePress = () => {
    if (interactive && onPress) {
      onPress(pet);
    }
  };
  
  const handleLongPress = () => {
    if (interactive && onLongPress) {
      onLongPress(pet);
    }
  };
  
  const handleMoodPress = () => {
    if (onMoodPress) {
      onMoodPress(pet);
    }
  };
  
  // ====================================
  // SIZE CONFIGURATIONS
  // ====================================
  
  const getSizeConfig = () => {
    switch (variant) {
      case 'compact':
        return {
          height: 80,
          imageSize: 60,
          padding: tailTrackerSpacing.base.sm,
          titleSize: tailTrackerTypography.body.body,
          subtitleSize: tailTrackerTypography.utility.helper,
        };
      case 'standard':
        return {
          height: 120,
          imageSize: 80,
          padding: tailTrackerSpacing.base.md,
          titleSize: tailTrackerTypography.display.cardTitle,
          subtitleSize: tailTrackerTypography.body.bodySmall,
        };
      case 'detailed':
        return {
          height: 180,
          imageSize: 100,
          padding: tailTrackerSpacing.base.lg,
          titleSize: tailTrackerTypography.display.cardTitle,
          subtitleSize: tailTrackerTypography.body.body,
        };
      case 'hero':
        return {
          height: 240,
          imageSize: 140,
          padding: tailTrackerSpacing.base.xl,
          titleSize: tailTrackerTypography.display.sectionHeader,
          subtitleSize: tailTrackerTypography.body.bodyLarge,
        };
      default:
        return {
          height: 120,
          imageSize: 80,
          padding: tailTrackerSpacing.base.md,
          titleSize: tailTrackerTypography.display.cardTitle,
          subtitleSize: tailTrackerTypography.body.bodySmall,
        };
    }
  };
  
  const sizeConfig = getSizeConfig();
  
  // ====================================
  // RENDER FUNCTIONS
  // ====================================
  
  const renderPetImage = () => (
    <View style={[styles.imageContainer, { 
      width: sizeConfig.imageSize, 
      height: sizeConfig.imageSize,
      borderColor: petColors.primary,
    }]}>
      <Image
        source={pet.photo}
        style={[styles.petImage, { 
          width: sizeConfig.imageSize - 4, 
          height: sizeConfig.imageSize - 4 
        }]}
        resizeMode="cover"
      />
      
      {/* Online/Offline Indicator */}
      {pet.isOnline !== undefined && (
        <View style={[styles.onlineIndicator, {
          backgroundColor: pet.isOnline ? 
            tailTrackerColors.contextual.safeHaven : 
            tailTrackerColors.contextual.unknownGray,
        }]} />
      )}
      
      {/* Mood Indicator */}
      {showMood && pet.mood && (
        <TouchableOpacity
          style={[styles.moodIndicator, {
            backgroundColor: moodInfo.background,
            borderColor: moodInfo.color,
          }]}
          onPress={handleMoodPress}
          activeOpacity={0.7}
        >
          <Text style={styles.moodEmoji}>{moodInfo.icon}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  const renderPetInfo = () => (
    <View style={styles.infoContainer}>
      <Text style={[sizeConfig.titleSize, styles.petName, { color: petColors.primary }]}>
        {pet.name}
      </Text>
      
      {pet.breed && (
        <Text style={[sizeConfig.subtitleSize, styles.petBreed]}>
          {pet.breed} • {pet.age || 'Unknown age'}
        </Text>
      )}
      
      {showLocation && pet.location && (
        <Text style={[styles.locationText, { color: tailTrackerColors.contextual.safeHaven }]}>
          📍 {pet.location}
        </Text>
      )}
      
      {pet.lastSeen && (
        <Text style={styles.lastSeenText}>
          Last seen: {pet.lastSeen}
        </Text>
      )}
    </View>
  );
  
  const renderStatusIndicators = () => (
    <View style={styles.statusContainer}>
      {/* Health Status */}
      {showHealth && pet.healthStatus && (
        <View style={[styles.statusBadge, { backgroundColor: healthInfo.color }]}>
          <Text style={styles.statusText}>Health: {healthInfo.label}</Text>
        </View>
      )}
      
      {/* Activity Level */}
      {showActivity && pet.activityLevel && (
        <View style={[styles.statusBadge, { backgroundColor: activityInfo.color }]}>
          <Text style={styles.statusText}>{activityInfo.label}</Text>
        </View>
      )}
      
      {/* Battery Level */}
      {showBattery && pet.batteryLevel !== undefined && (
        <View style={styles.batteryContainer}>
          <View style={styles.batteryOutline}>
            <View style={[styles.batteryFill, {
              width: `${pet.batteryLevel}%`,
              backgroundColor: pet.batteryLevel > 20 ? 
                tailTrackerColors.contextual.healthyGreen : 
                tailTrackerColors.contextual.alertAmber,
            }]} />
          </View>
          <Text style={styles.batteryText}>{pet.batteryLevel}%</Text>
        </View>
      )}
    </View>
  );
  
  // ====================================
  // MAIN RENDER
  // ====================================
  
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPressIn={interactive ? animatePress : undefined}
      onPressOut={interactive ? animateRelease : undefined}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={1}
      disabled={!interactive}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.card,
          {
            height: variant === 'hero' ? undefined : sizeConfig.height,
            padding: sizeConfig.padding,
            transform: [{ scale: scaleAnim }],
            shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
            elevation: Platform.OS === 'android' ? shadowAnim : 0,
          },
        ]}
      >
        {/* Pet Image */}
        {renderPetImage()}
        
        {/* Pet Information */}
        {renderPetInfo()}
        
        {/* Status Indicators */}
        {(variant === 'detailed' || variant === 'hero') && renderStatusIndicators()}
        
        {/* Background Pattern */}
        <View style={[styles.backgroundPattern, {
          backgroundColor: colorUtils.withOpacity(petColors.background, 0.1),
        }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  container: {
    marginVertical: tailTrackerSpacing.base.xs,
  },
  
  card: {
    backgroundColor: tailTrackerColors.light.surfacePrimary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: tailTrackerColors.light.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.05,
    zIndex: -1,
  },
  
  imageContainer: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 2,
    position: 'relative',
  },
  
  petImage: {
    borderRadius: 10,
  },
  
  onlineIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: tailTrackerColors.light.surfacePrimary,
  },
  
  moodIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  moodEmoji: {
    fontSize: 12,
  },
  
  infoContainer: {
    flex: 1,
    marginLeft: tailTrackerSpacing.base.md,
    justifyContent: 'center',
  },
  
  petName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  
  petBreed: {
    color: tailTrackerColors.light.textSecondary,
    marginBottom: 4,
  },
  
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  
  lastSeenText: {
    fontSize: 11,
    color: tailTrackerColors.light.textTertiary,
    fontStyle: 'italic',
  },
  
  statusContainer: {
    position: 'absolute',
    top: tailTrackerSpacing.base.sm,
    right: tailTrackerSpacing.base.sm,
    alignItems: 'flex-end',
  },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: tailTrackerColors.light.textInverse,
  },
  
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tailTrackerColors.light.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  
  batteryOutline: {
    width: 20,
    height: 8,
    borderWidth: 1,
    borderColor: tailTrackerColors.light.borderSecondary,
    borderRadius: 2,
    marginRight: 4,
    overflow: 'hidden',
  },
  
  batteryFill: {
    height: '100%',
    borderRadius: 1,
  },
  
  batteryText: {
    fontSize: 9,
    fontWeight: '600',
    color: tailTrackerColors.light.textSecondary,
  },
});

export default PetCard;