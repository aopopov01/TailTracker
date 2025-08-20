/**
 * EmotionalButton Component
 * 
 * A button that creates emotional connections through thoughtful design,
 * delightful animations, and contextual feedback. This is the primary
 * interactive element that guides users through their pet care journey.
 */

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { tailTrackerColors } from '../../core/colors';
import { tailTrackerTypography } from '../../core/typography';
import { tailTrackerSpacing } from '../../core/spacing';
import { tailTrackerMotions } from '../animations/motionSystem';

// ====================================
// COMPONENT TYPES
// ====================================

export interface EmotionalButtonProps {
  // Content
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  
  // Behavior
  onPress: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  
  // Emotional Design
  emotion?: 'trust' | 'love' | 'joy' | 'calm' | 'urgent' | 'playful';
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'premium';
  size?: 'small' | 'medium' | 'large' | 'hero';
  
  // Visual Customization
  fullWidth?: boolean;
  rounded?: boolean;
  elevated?: boolean;
  
  // Interaction
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  animationIntensity?: 'subtle' | 'normal' | 'enthusiastic';
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  
  // Style overrides
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// ====================================
// EMOTIONAL COLOR MAPPINGS
// ====================================

const getEmotionalColors = (emotion: EmotionalButtonProps['emotion']) => {
  switch (emotion) {
    case 'trust':
      return {
        primary: tailTrackerColors.primary.trustBlue,
        secondary: tailTrackerColors.primary.guardianBlue,
        background: tailTrackerColors.primary.skyBlue,
      };
    case 'love':
      return {
        primary: tailTrackerColors.primary.heartCoral,
        secondary: tailTrackerColors.primary.snuggleRose,
        background: tailTrackerColors.primary.gentlePink,
      };
    case 'joy':
      return {
        primary: tailTrackerColors.primary.playGreen,
        secondary: tailTrackerColors.primary.joyfulLime,
        background: tailTrackerColors.primary.sunshineYellow,
      };
    case 'calm':
      return {
        primary: tailTrackerColors.primary.peaceLavender,
        secondary: tailTrackerColors.primary.zenViolet,
        background: tailTrackerColors.primary.dreamPurple,
      };
    case 'urgent':
      return {
        primary: tailTrackerColors.contextual.emergencyRed,
        secondary: tailTrackerColors.contextual.alertAmber,
        background: tailTrackerColors.contextual.concernOrange,
      };
    case 'playful':
      return {
        primary: tailTrackerColors.contextual.mischievousGold,
        secondary: tailTrackerColors.contextual.playfulOrange,
        background: tailTrackerColors.primary.sunshineYellow,
      };
    default:
      return {
        primary: tailTrackerColors.primary.trustBlue,
        secondary: tailTrackerColors.primary.guardianBlue,
        background: tailTrackerColors.primary.skyBlue,
      };
  }
};

// ====================================
// SIZE CONFIGURATIONS
// ====================================

const getSizeConfig = (size: EmotionalButtonProps['size']) => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: tailTrackerSpacing.base.xs,
        paddingHorizontal: tailTrackerSpacing.base.sm,
        minHeight: 32,
        typography: tailTrackerTypography.body.bodySmall,
      };
    case 'medium':
      return {
        paddingVertical: tailTrackerSpacing.base.sm,
        paddingHorizontal: tailTrackerSpacing.base.md,
        minHeight: 44,
        typography: tailTrackerTypography.interactive.buttonSecondary,
      };
    case 'large':
      return {
        paddingVertical: tailTrackerSpacing.base.md,
        paddingHorizontal: tailTrackerSpacing.base.lg,
        minHeight: 56,
        typography: tailTrackerTypography.interactive.buttonPrimary,
      };
    case 'hero':
      return {
        paddingVertical: tailTrackerSpacing.base.lg,
        paddingHorizontal: tailTrackerSpacing.base.xl,
        minHeight: 64,
        typography: tailTrackerTypography.display.cardTitle,
      };
    default:
      return {
        paddingVertical: tailTrackerSpacing.base.sm,
        paddingHorizontal: tailTrackerSpacing.base.md,
        minHeight: 44,
        typography: tailTrackerTypography.interactive.buttonPrimary,
      };
  }
};

// ====================================
// MAIN COMPONENT
// ====================================

export const EmotionalButton: React.FC<EmotionalButtonProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  emotion = 'trust',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  rounded = false,
  elevated = false,
  hapticFeedback = 'medium',
  animationIntensity = 'normal',
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  textStyle,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(elevated ? 4 : 0)).current;
  
  // Get configuration
  const emotionalColors = getEmotionalColors(emotion);
  const sizeConfig = getSizeConfig(size);
  
  // ====================================
  // ANIMATION FUNCTIONS
  // ====================================
  
  const animatePress = () => {
    const intensity = animationIntensity === 'subtle' ? 0.98 : 
                     animationIntensity === 'enthusiastic' ? 0.92 : 0.95;
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: intensity,
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const animateRelease = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: tailTrackerMotions.durations.quick,
        easing: animationIntensity === 'enthusiastic' ? 
               tailTrackerMotions.easing.bounce : 
               tailTrackerMotions.easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: tailTrackerMotions.durations.quick,
        easing: tailTrackerMotions.easing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // ====================================
  // STYLE CONFIGURATIONS
  // ====================================
  
  const getButtonStyle = (): ViewStyle => {
    let backgroundColor: string;
    let borderColor: string | undefined;
    let borderWidth: number = 0;
    
    switch (variant) {
      case 'primary':
        backgroundColor = emotionalColors.primary;
        break;
      case 'secondary':
        backgroundColor = 'transparent';
        borderColor = emotionalColors.primary;
        borderWidth = 2;
        break;
      case 'ghost':
        backgroundColor = 'transparent';
        break;
      case 'destructive':
        backgroundColor = tailTrackerColors.semantic.errorPrimary;
        break;
      case 'premium':
        backgroundColor = tailTrackerColors.contextual.mischievousGold;
        break;
      default:
        backgroundColor = emotionalColors.primary;
    }
    
    return {
      backgroundColor: disabled ? tailTrackerColors.light.interactiveDisabled : backgroundColor,
      borderColor: disabled ? tailTrackerColors.light.borderTertiary : borderColor,
      borderWidth,
      borderRadius: rounded ? sizeConfig.minHeight / 2 : 12,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      minHeight: sizeConfig.minHeight,
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: icon ? 'row' : 'column',
      shadowColor: elevated ? tailTrackerColors.light.shadowMedium : 'transparent',
      shadowOffset: { width: 0, height: elevated ? 2 : 0 },
      shadowOpacity: elevated ? 0.1 : 0,
      shadowRadius: elevated ? 4 : 0,
      elevation: elevated ? 4 : 0,
    };
  };
  
  const getTextStyle = (): TextStyle => {
    let color: string;
    
    switch (variant) {
      case 'primary':
      case 'destructive':
      case 'premium':
        color = tailTrackerColors.light.textInverse;
        break;
      case 'secondary':
      case 'ghost':
        color = disabled ? tailTrackerColors.light.textTertiary : emotionalColors.primary;
        break;
      default:
        color = tailTrackerColors.light.textInverse;
    }
    
    return {
      ...sizeConfig.typography,
      color,
      textAlign: 'center',
      marginLeft: icon ? tailTrackerSpacing.base.xs : 0,
    };
  };
  
  // ====================================
  // HAPTIC FEEDBACK
  // ====================================
  
  const triggerHapticFeedback = () => {
    if (Platform.OS === 'ios') {
      // iOS Haptic Feedback implementation would go here
      // Example: Haptics.impactAsync(Haptics.ImpactFeedbackStyle[hapticFeedback]);
    }
  };
  
  // ====================================
  // EVENT HANDLERS
  // ====================================
  
  const handlePressIn = () => {
    if (!disabled && !loading) {
      animatePress();
      triggerHapticFeedback();
    }
  };
  
  const handlePressOut = () => {
    if (!disabled && !loading) {
      animateRelease();
    }
  };
  
  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled && !loading) {
      onPress(event);
      
      // Celebration animation for positive emotions
      if (emotion === 'joy' || emotion === 'love') {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: tailTrackerMotions.durations.instant,
            easing: tailTrackerMotions.easing.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: tailTrackerMotions.durations.quick,
            easing: tailTrackerMotions.easing.bounce,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };
  
  // ====================================
  // RENDER
  // ====================================
  
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled || loading}
      activeOpacity={1} // We handle opacity with animations
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
    >
      <Animated.View
        style={[
          getButtonStyle(),
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {icon && (
          <Animated.View style={styles.iconContainer}>
            {icon}
          </Animated.View>
        )}
        
        <Animated.View style={styles.textContainer}>
          <Text style={[getTextStyle(), textStyle]}>
            {loading ? 'Loading...' : title}
          </Text>
          
          {subtitle && !loading && (
            <Text style={[getTextStyle(), styles.subtitle]}>
              {subtitle}
            </Text>
          )}
        </Animated.View>
        
        {loading && (
          <Animated.View style={styles.loadingContainer}>
            {/* Loading spinner would go here */}
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  container: {
    // Container styles are minimal as most styling is dynamic
  },
  
  iconContainer: {
    marginRight: tailTrackerSpacing.base.xs,
  },
  
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  subtitle: {
    fontSize: tailTrackerTypography.body.bodySmall.fontSize,
    opacity: 0.8,
    marginTop: 2,
  },
  
  loadingContainer: {
    position: 'absolute',
    right: tailTrackerSpacing.base.md,
  },
});

// ====================================
// USAGE EXAMPLES & STORIES
// ====================================

/**
 * Usage Examples:
 * 
 * // Primary trust button for main actions
 * <EmotionalButton
 *   title="Find My Pet"
 *   emotion="trust"
 *   variant="primary"
 *   size="large"
 *   onPress={handleFindPet}
 *   hapticFeedback="heavy"
 * />
 * 
 * // Loving action for pet interaction
 * <EmotionalButton
 *   title="Give Love"
 *   emotion="love"
 *   variant="primary"
 *   size="medium"
 *   icon={<HeartIcon />}
 *   onPress={handleGiveLove}
 *   animationIntensity="enthusiastic"
 * />
 * 
 * // Urgent emergency button
 * <EmotionalButton
 *   title="Emergency Alert"
 *   subtitle="Tap to notify contacts"
 *   emotion="urgent"
 *   variant="primary"
 *   size="hero"
 *   onPress={handleEmergency}
 *   hapticFeedback="error"
 * />
 * 
 * // Premium upgrade
 * <EmotionalButton
 *   title="Upgrade to Premium"
 *   emotion="playful"
 *   variant="premium"
 *   size="large"
 *   fullWidth
 *   onPress={handleUpgrade}
 * />
 */

export default EmotionalButton;