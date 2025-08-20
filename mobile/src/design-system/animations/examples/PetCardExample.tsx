/**
 * TailTracker Pet Card Example
 * 
 * Comprehensive example showing how to create an emotionally intelligent
 * pet card with personality-driven animations, contextual interactions,
 * and premium micro-interactions.
 * 
 * Features demonstrated:
 * - Pet personality animations (tail wagging, breathing, blinking)
 * - Context-aware interactions
 * - Performance optimization
 * - Accessibility support
 * - Haptic feedback coordination
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from 'expo-haptics';

// Import our animation systems
import {
  useTailWagAnimation,
  useBreathingAnimation,
  useBlinkingAnimation,
  useHeadTiltAnimation,
  usePlayfulBounceAnimation,
  useHeartEyesAnimation,
} from '../emotionalAnimationSystem';
import {
  usePetCardAnimation,
  useSuccessCelebration,
} from '../premiumMicroInteractions';
import {
  useEmotionalIntelligence,
  useContextualSuccessAnimation,
} from '../emotionalIntelligenceHooks';
import { useAnimationProfiler } from '../performanceMonitoring';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ====================================
// TYPES
// ====================================

interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit';
  personality: 'energetic' | 'gentle' | 'playful' | 'calm';
  mood: 'happy' | 'sleepy' | 'playful' | 'calm' | 'excited';
  healthStatus: 'excellent' | 'good' | 'needs_attention';
  lastSeen: Date;
  isAsleep: boolean;
  imageUrl: string;
}

interface PetCardProps {
  pet: Pet;
  onPress?: (pet: Pet) => void;
  onLongPress?: (pet: Pet) => void;
  onHeartPress?: (pet: Pet) => void;
  style?: any;
}

// ====================================
// ANIMATED PET CARD COMPONENT
// ====================================

export const AnimatedPetCard: React.FC<PetCardProps> = ({
  pet,
  onPress,
  onLongPress,
  onHeartPress,
  style,
}) => {
  const [lastInteraction, setLastInteraction] = useState<Date>(new Date());
  const [heartCount, setHeartCount] = useState(0);

  // Animation profiling for performance monitoring
  const { startProfiling, stopProfiling } = useAnimationProfiler(
    'pet_card_interaction',
    'medium'
  );

  // Emotional intelligence integration
  const {
    userState,
    inferEmotionalState,
    getOptimalAnimationConfig,
  } = useEmotionalIntelligence();

  // Pet personality animations
  const tailWagAnimation = useTailWagAnimation({
    emotion: pet.mood,
    personality: pet.personality,
    intensity: 'moderate',
    hapticFeedback: true,
  });

  const breathingAnimation = useBreathingAnimation(pet.isAsleep, pet.mood);
  const blinkingAnimation = useBlinkingAnimation(pet.mood);
  const { animatedStyle: headTiltStyle, tilt } = useHeadTiltAnimation();
  
  const playfulBounceAnimation = usePlayfulBounceAnimation({
    emotion: pet.mood,
    personality: pet.personality,
    intensity: 'enthusiastic',
    hapticFeedback: true,
  });

  const heartEyesAnimation = useHeartEyesAnimation();

  // Premium micro-interactions
  const { animatedStyle: cardAnimationStyle, tapGesture } = usePetCardAnimation(pet.personality);
  
  const { celebrate: celebrateSuccess, animatedStyle: successStyle } = useSuccessCelebration();

  // Contextual success animation
  const { celebrate: contextualCelebrate, animatedStyle: contextualSuccessStyle } = 
    useContextualSuccessAnimation('achievement');

  // ====================================
  // INTERACTION HANDLERS
  // ====================================

  const handleCardPress = useCallback(() => {
    startProfiling();
    
    // Infer emotional state from interaction
    inferEmotionalState('discovery');
    
    // Trigger personality-appropriate response
    if (pet.personality === 'playful') {
      playfulBounceAnimation.bounce();
    } else if (pet.personality === 'gentle') {
      tilt('right');
    } else if (pet.personality === 'energetic') {
      tailWagAnimation.startWagging();
      setTimeout(() => tailWagAnimation.stopWagging(), 2000);
    }

    setLastInteraction(new Date());
    onPress?.(pet);
    
    setTimeout(() => stopProfiling(), 1000);
  }, [pet, onPress, inferEmotionalState]);

  const handleLongPress = useCallback(() => {
    // Indicate deeper interaction
    inferEmotionalState('discovery');
    
    // Show heart eyes for long press (bonding moment)
    heartEyesAnimation.showHeartEyes();
    
    onLongPress?.(pet);
  }, [pet, onLongPress, inferEmotionalState]);

  const handleHeartPress = useCallback(() => {
    // Celebrate love interaction
    inferEmotionalState('success');
    setHeartCount(prev => prev + 1);
    
    // Multiple celebration levels based on heart count
    if (heartCount < 2) {
      contextualCelebrate();
    } else if (heartCount < 5) {
      celebrateSuccess('achievement');
    } else {
      celebrateSuccess('milestone');
    }

    // Show heart eyes
    heartEyesAnimation.showHeartEyes();

    onHeartPress?.(pet);
  }, [pet, heartCount, onHeartPress, contextualCelebrate, celebrateSuccess]);

  // ====================================
  // AUTO BEHAVIORS
  // ====================================

  // Automatic tail wagging for happy pets
  useEffect(() => {
    if (pet.mood === 'happy' || pet.mood === 'excited') {
      const interval = setInterval(() => {
        if (!pet.isAsleep && Math.random() > 0.7) {
          tailWagAnimation.startWagging();
          setTimeout(() => tailWagAnimation.stopWagging(), 1500);
        }
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [pet.mood, pet.isAsleep]);

  // Curious head tilts
  useEffect(() => {
    if (pet.mood === 'playful' && !pet.isAsleep) {
      const interval = setInterval(() => {
        if (Math.random() > 0.8) {
          tilt(Math.random() > 0.5 ? 'left' : 'right');
        }
      }, 12000);

      return () => clearInterval(interval);
    }
  }, [pet.mood, pet.isAsleep]);

  // ====================================
  // GESTURE CONFIGURATION
  // ====================================

  const combinedTapGesture = Gesture.Tap()
    .onStart(() => {
      runOnJS(handleCardPress)();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(800)
    .onStart(() => {
      runOnJS(handleLongPress)();
    });

  const combinedGesture = Gesture.Exclusive(longPressGesture, combinedTapGesture);

  // ====================================
  // STYLES
  // ====================================

  const getHealthStatusColor = () => {
    switch (pet.healthStatus) {
      case 'excellent': return '#22C55E';
      case 'good': return '#3B82F6';
      case 'needs_attention': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getSleepOpacity = () => pet.isAsleep ? 0.7 : 1.0;

  // ====================================
  // RENDER
  // ====================================

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View 
        style={[
          styles.card,
          cardAnimationStyle,
          successStyle,
          contextualSuccessStyle,
          { opacity: getSleepOpacity() },
          style,
        ]}
      >
        {/* Background gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.gradientBackground}
        />

        {/* Pet image with breathing animation */}
        <Animated.View style={[styles.imageContainer, breathingAnimation]}>
          <Animated.View style={[styles.imageWrapper, headTiltStyle]}>
            <Image source={{ uri: pet.imageUrl }} style={styles.petImage} />
            
            {/* Tail overlay with wagging animation */}
            <Animated.View style={[styles.tailOverlay, tailWagAnimation.animatedStyle]}>
              {pet.species === 'dog' && <Text style={styles.tailEmoji}>🐕‍🦺</Text>}
              {pet.species === 'cat' && <Text style={styles.tailEmoji}>🐱</Text>}
            </Animated.View>

            {/* Eyes with blinking animation */}
            <Animated.View style={[styles.eyesOverlay, blinkingAnimation]}>
              <View style={styles.eyeContainer}>
                <Text style={styles.eyeEmoji}>👁️</Text>
                <Text style={styles.eyeEmoji}>👁️</Text>
              </View>
            </Animated.View>

            {/* Heart eyes animation */}
            <Animated.View style={[styles.heartEyesOverlay, heartEyesAnimation.animatedStyle]}>
              <Text style={styles.heartEyesEmoji}>😍</Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        {/* Pet information */}
        <View style={styles.infoContainer}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petMood}>{pet.mood.charAt(0).toUpperCase() + pet.mood.slice(1)}</Text>
          
          {/* Health status indicator */}
          <View style={styles.healthContainer}>
            <View 
              style={[
                styles.healthIndicator, 
                { backgroundColor: getHealthStatusColor() }
              ]} 
            />
            <Text style={styles.healthText}>{pet.healthStatus.replace('_', ' ')}</Text>
          </View>

          {/* Last seen */}
          <Text style={styles.lastSeen}>
            Last seen: {pet.lastSeen.toLocaleTimeString()}
          </Text>
        </View>

        {/* Heart button */}
        <Pressable 
          style={styles.heartButton}
          onPress={handleHeartPress}
        >
          <Text style={styles.heartButtonText}>❤️</Text>
          {heartCount > 0 && (
            <View style={styles.heartBadge}>
              <Text style={styles.heartBadgeText}>{heartCount}</Text>
            </View>
          )}
        </Pressable>

        {/* Sleep indicator */}
        {pet.isAsleep && (
          <View style={styles.sleepIndicator}>
            <Text style={styles.sleepEmoji}>💤</Text>
          </View>
        )}

        {/* Playful bounce animation overlay */}
        <Animated.View 
          style={[
            styles.bounceOverlay, 
            playfulBounceAnimation.animatedStyle
          ]} 
        />
      </Animated.View>
    </GestureDetector>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 32,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },

  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
  },

  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },

  tailOverlay: {
    position: 'absolute',
    bottom: 10,
    right: -5,
    transform: [{ rotate: '45deg' }],
  },

  tailEmoji: {
    fontSize: 20,
  },

  eyesOverlay: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  eyeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 40,
  },

  eyeEmoji: {
    fontSize: 12,
  },

  heartEyesOverlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  heartEyesEmoji: {
    fontSize: 40,
  },

  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },

  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },

  petMood: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },

  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  healthIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  healthText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },

  lastSeen: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heartButtonText: {
    fontSize: 16,
  },

  heartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  heartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  sleepIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
  },

  sleepEmoji: {
    fontSize: 16,
  },

  bounceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});

// ====================================
// EXAMPLE USAGE
// ====================================

export const PetCardUsageExample = () => {
  const [pets] = useState<Pet[]>([
    {
      id: '1',
      name: 'Buddy',
      species: 'dog',
      personality: 'playful',
      mood: 'happy',
      healthStatus: 'excellent',
      lastSeen: new Date(),
      isAsleep: false,
      imageUrl: 'https://example.com/buddy.jpg',
    },
    {
      id: '2',
      name: 'Whiskers',
      species: 'cat',
      personality: 'gentle',
      mood: 'sleepy',
      healthStatus: 'good',
      lastSeen: new Date(Date.now() - 3600000),
      isAsleep: true,
      imageUrl: 'https://example.com/whiskers.jpg',
    },
    {
      id: '3',
      name: 'Charlie',
      species: 'dog',
      personality: 'energetic',
      mood: 'excited',
      healthStatus: 'excellent',
      lastSeen: new Date(Date.now() - 1800000),
      isAsleep: false,
      imageUrl: 'https://example.com/charlie.jpg',
    },
  ]);

  const handlePetPress = (pet: Pet) => {
    console.log('Pet pressed:', pet.name);
    // Navigate to pet details
  };

  const handlePetLongPress = (pet: Pet) => {
    console.log('Pet long pressed:', pet.name);
    // Show context menu or quick actions
  };

  const handlePetHeart = (pet: Pet) => {
    console.log('Pet hearted:', pet.name);
    // Record love interaction
  };

  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      {pets.map(pet => (
        <AnimatedPetCard
          key={pet.id}
          pet={pet}
          onPress={handlePetPress}
          onLongPress={handlePetLongPress}
          onHeartPress={handlePetHeart}
        />
      ))}
    </View>
  );
};

export default AnimatedPetCard;