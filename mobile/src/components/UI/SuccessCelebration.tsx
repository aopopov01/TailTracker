/**
 * TailTracker Success Celebration Components
 * 
 * Delightful success states and celebrations that make users feel
 * accomplished and create positive emotional connections.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';

import premiumAnimations from '../../design-system/animations/premiumAnimations';
import { useMaterialTheme } from '../../theme/MaterialThemeProvider';
import hapticUtils from '../../utils/hapticUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface SuccessConfig {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  confetti?: boolean;
  autoHide?: boolean;
  duration?: number;
  onComplete?: () => void;
}

export interface CelebrationProps {
  isVisible: boolean;
  config: SuccessConfig;
  onHide?: () => void;
  style?: ViewStyle;
}

export interface ConfettiProps {
  count?: number;
  colors?: string[];
  duration?: number;
  isActive: boolean;
}

// ====================================
// SUCCESS CELEBRATION COMPONENT
// ====================================

export const SuccessCelebration: React.FC<CelebrationProps> = ({
  isVisible,
  config,
  onHide,
  style,
}) => {
  const { theme } = useMaterialTheme();
  
  // Animation values
  const overlayOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  
  // Auto-hide timer
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  
  // ====================================
  // ANIMATION SEQUENCE
  // ====================================
  
  const hideCelebration = useCallback(() => {
    // Clear timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Exit animation
    overlayOpacity.value = withTiming(0, premiumAnimations.timings.fast);
    containerScale.value = withTiming(0.8, premiumAnimations.timings.fast);
    
    // Call completion callbacks
    setTimeout(() => {
      config.onComplete?.();
      onHide?.();
    }, premiumAnimations.timings.fast.duration);
  }, [config, containerScale, overlayOpacity, onHide]);

  const startCelebration = useCallback(() => {
    // Haptic feedback
    hapticUtils.success();
    
    // Entry animation sequence
    overlayOpacity.value = withTiming(1, premiumAnimations.timings.fast);
    
    containerScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1.1, { 
        damping: 15,
        stiffness: 150,
        mass: 1 
      }),
      withSpring(1, { 
        damping: 20,
        stiffness: 120,
        mass: 1 
      })
    );
    
    // Icon animation
    iconScale.value = withSequence(
      withDelay(200, withSpring(1.3, { 
        damping: 10,
        stiffness: 300,
        mass: 1 
      })),
      withSpring(1, { 
        damping: 20,
        stiffness: 120,
        mass: 1 
      })
    );
    
    iconRotation.value = withSequence(
      withTiming(0, { duration: 0 }),
      withDelay(300, withTiming(360, premiumAnimations.timings.celebration))
    );
    
    // Text animations
    titleOpacity.value = withDelay(400, withTiming(1, premiumAnimations.timings.standard));
    messageOpacity.value = withDelay(600, withTiming(1, premiumAnimations.timings.standard));
    
    // Pulse effect
    pulseScale.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        2,
        false
      )
    );
    
    // Success haptic after main animation
    setTimeout(() => {
      hapticUtils.pet.mood('happy');
    }, 800);
    
    // Auto-hide
    if (config.autoHide !== false) {
      const hideDuration = config.duration || 3000;
      hideTimeoutRef.current = setTimeout(() => {
        hideCelebration();
      }, hideDuration);
    }
  }, [config.autoHide, config.duration, containerScale, hideCelebration, iconRotation, iconScale, messageOpacity, overlayOpacity, pulseScale, titleOpacity]);
  
  // ====================================
  // EFFECTS
  // ====================================
  
  useEffect(() => {
    if (isVisible) {
      startCelebration();
    } else {
      hideCelebration();
    }
    
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isVisible, startCelebration, hideCelebration]);
  
  // ====================================
  // ANIMATED STYLES
  // ====================================
  
  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });
  
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: containerScale.value },
        { scale: pulseScale.value },
      ],
    };
  });
  
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: iconScale.value },
        { rotate: `${iconRotation.value}deg` },
      ],
    };
  });
  
  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
    };
  });
  
  const animatedMessageStyle = useAnimatedStyle(() => {
    return {
      opacity: messageOpacity.value,
    };
  });
  
  // ====================================
  // RENDER COMPONENT
  // ====================================
  
  if (!isVisible) return null;
  
  return (
    <Animated.View style={[styles.overlay, animatedOverlayStyle, style]}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        {config.confetti && <ConfettiAnimation isActive={isVisible} />}
        
        <Animated.View style={[styles.container, animatedContainerStyle]}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Success Icon */}
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
              <View style={styles.iconBackground}>
                <Ionicons
                  name={config.icon || 'checkmark-circle'}
                  size={60}
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>
            
            {/* Title */}
            <Animated.Text style={[styles.title, animatedTitleStyle]}>
              {config.title}
            </Animated.Text>
            
            {/* Message */}
            {config.message && (
              <Animated.Text style={[styles.message, animatedMessageStyle]}>
                {config.message}
              </Animated.Text>
            )}
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
};

// ====================================
// CONFETTI ANIMATION COMPONENT
// ====================================

const ConfettiAnimation: React.FC<ConfettiProps> = ({
  count = 50,
  colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'],
  duration = 3000,
  isActive,
}) => {
  const confettiPieces = useRef<{
    translateX: Animated.SharedValue<number>;
    translateY: Animated.SharedValue<number>;
    rotation: Animated.SharedValue<number>;
    scale: Animated.SharedValue<number>;
    opacity: Animated.SharedValue<number>;
    color: string;
  }[]>([]);
  
  // Initialize confetti pieces
  useEffect(() => {
    confettiPieces.current = Array.from({ length: count }, () => ({
      translateX: useSharedValue(screenWidth / 2),
      translateY: useSharedValue(screenHeight / 2),
      rotation: useSharedValue(0),
      scale: useSharedValue(0),
      opacity: useSharedValue(0),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [count, colors]);
  
  // Start confetti animation
  useEffect(() => {
    if (isActive) {
      confettiPieces.current.forEach((piece, index) => {
        const delay = index * 20;
        const finalX = Math.random() * screenWidth;
        const finalY = screenHeight + 100;
        const rotationAmount = Math.random() * 1440; // 0-4 full rotations
        
        // Animate each piece
        piece.opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
        piece.scale.value = withDelay(delay, withSpring(1, { 
          damping: 10,
          stiffness: 300,
          mass: 1 
        }));
        
        piece.translateX.value = withDelay(
          delay,
          withTiming(finalX, { duration: duration })
        );
        
        piece.translateY.value = withDelay(
          delay,
          withTiming(finalY, { duration: duration })
        );
        
        piece.rotation.value = withDelay(
          delay,
          withTiming(rotationAmount, { duration: duration })
        );
        
        // Fade out at the end
        piece.opacity.value = withDelay(
          delay + duration - 500,
          withTiming(0, { duration: 500 })
        );
      });
    }
  }, [isActive, duration]);
  
  const renderConfettiPiece = (piece: typeof confettiPieces.current[0], index: number) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: piece.translateX.value },
          { translateY: piece.translateY.value },
          { rotate: `${piece.rotation.value}deg` },
          { scale: piece.scale.value },
        ],
        opacity: piece.opacity.value,
      };
    });
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.confettiPiece,
          { backgroundColor: piece.color },
          animatedStyle,
        ]}
      />
    );
  };
  
  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {confettiPieces.current.map(renderConfettiPiece)}
    </View>
  );
};

// ====================================
// QUICK SUCCESS TOAST
// ====================================

export const SuccessToast: React.FC<{
  message: string;
  isVisible: boolean;
  onHide?: () => void;
  position?: 'top' | 'center' | 'bottom';
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({
  message,
  isVisible,
  onHide,
  position = 'top',
  icon = 'checkmark-circle',
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  
  useEffect(() => {
    if (isVisible) {
      hapticUtils.success();
      
      opacity.value = withTiming(1, premiumAnimations.timings.fast);
      scale.value = withSpring(1, { 
        damping: 20,
        stiffness: 120,
        mass: 1 
      });
      
      const yPosition = position === 'top' ? 0 : position === 'bottom' ? 0 : 0;
      translateY.value = withSpring(yPosition, { 
        damping: 10,
        stiffness: 100,
        mass: 1 
      });
      
      // Auto-hide after 2 seconds
      setTimeout(() => {
        opacity.value = withTiming(0, premiumAnimations.timings.fast);
        translateY.value = withTiming(-100, premiumAnimations.timings.fast);
        setTimeout(() => onHide?.(), premiumAnimations.timings.fast.duration);
      }, 2000);
    }
  }, [isVisible, position, onHide, opacity, scale, translateY]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'top':
        return { top: 50 };
      case 'bottom':
        return { bottom: 50 };
      default:
        return { top: '50%', marginTop: -40 };
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <Animated.View style={[styles.toastContainer, getPositionStyle(), animatedStyle]}>
      <BlurView intensity={90} tint="light" style={styles.toastBlur}>
        <View style={styles.toastContent}>
          <Ionicons name={icon} size={24} color="#10B981" />
          <Text style={styles.toastMessage}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  // Success Celebration
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    width: screenWidth * 0.8,
    maxWidth: 300,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  
  // Confetti
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Success Toast
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toastBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  toastMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
});

export default {
  SuccessCelebration,
  SuccessToast,
};