/**
 * TailTracker Premium Button Component
 *
 * A world-class button with smooth animations, haptic feedback,
 * and delightful micro-interactions that users will love.
 */

import React, { useRef, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';

import premiumAnimations from '../../design-system/animations/premiumAnimations';
import { useMaterialTheme } from '../../theme/MaterialThemeProvider';
import hapticUtils from '../../utils/hapticUtils';

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface PremiumButtonProps {
  // Content
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';

  // Variants and Styles
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success';
  size?: 'small' | 'medium' | 'large' | 'xl';
  emotion?: 'trust' | 'love' | 'joy' | 'urgent' | 'playful' | 'calm';

  // States
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;

  // Behavior
  fullWidth?: boolean;
  animationIntensity?: 'subtle' | 'medium' | 'bold';
  hapticFeedback?: boolean;
  hapticType?: Parameters<typeof hapticUtils.feedback>[0];

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;

  // Events
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;

  // Style overrides
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: readonly [string, string, ...string[]];
}

// ====================================
// PREMIUM BUTTON COMPONENT
// ====================================

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  subtitle,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'medium',
  emotion = 'trust',
  disabled = false,
  loading = false,
  loadingText,
  fullWidth = false,
  animationIntensity = 'medium',
  hapticFeedback = true,
  hapticType,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  style,
  textStyle,
  gradientColors,
}) => {
  const { theme } = useMaterialTheme();

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  // Refs
  const pressTimestamp = useRef<number>(0);

  // ====================================
  // HELPER FUNCTIONS
  // ====================================

  const getAnimationIntensityValue = (
    intensity: 'subtle' | 'medium' | 'bold'
  ): number => {
    switch (intensity) {
      case 'subtle':
        return 0.5;
      case 'medium':
        return 1;
      case 'bold':
        return 1.5;
      default:
        return 1;
    }
  };

  // ====================================
  // ANIMATION STYLES
  // ====================================

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const animatedRippleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: rippleScale.value }],
      opacity: rippleOpacity.value,
    };
  });

  // ====================================
  // HELPER FUNCTIONS
  // ====================================

  const getRippleColor = useCallback((): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
        return 'rgba(255, 255, 255, 0.3)';
      default:
        return `${theme.colors.primary}30`;
    }
  }, [variant, theme.colors.primary]);

  const getRippleIntensity = useCallback((): number => {
    switch (animationIntensity) {
      case 'subtle':
        return 0.1;
      case 'medium':
        return 0.2;
      case 'bold':
        return 0.3;
      default:
        return 0.2;
    }
  }, [animationIntensity]);

  // ====================================
  // EVENT HANDLERS
  // ====================================

  const handlePressIn = useCallback(() => {
    pressTimestamp.current = Date.now();

    // Trigger haptic feedback
    if (hapticFeedback && !disabled) {
      const feedbackType = hapticType || getHapticTypeForVariant(variant);
      hapticUtils.feedback(feedbackType);
    }

    // Trigger press animation
    if (!disabled) {
      const animation = premiumAnimations.buttons.press(
        getAnimationIntensityValue(animationIntensity)
      );
      const pressInConfig = animation.pressIn();
      scale.value = withSpring(pressInConfig.scale);

      // Start ripple animation
      const rippleAnimation = premiumAnimations.buttons.ripple(
        getRippleColor(),
        getRippleIntensity()
      );
      rippleScale.value = withSpring(rippleAnimation.scale);
      rippleOpacity.value = withSpring(rippleAnimation.opacity);
    }

    onPressIn?.();
  }, [
    hapticFeedback,
    hapticType,
    variant,
    disabled,
    animationIntensity,
    onPressIn,
    rippleOpacity,
    rippleScale,
    scale,
    getRippleColor,
    getRippleIntensity,
  ]);

  const handlePressOut = useCallback(() => {
    if (!disabled) {
      const animation = premiumAnimations.buttons.press(
        getAnimationIntensityValue(animationIntensity)
      );
      const pressOutConfig = animation.pressOut();
      scale.value = withSpring(pressOutConfig.scale);
    }

    onPressOut?.();
  }, [disabled, animationIntensity, onPressOut, scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    const pressDuration = Date.now() - pressTimestamp.current;

    // Add slight delay for very quick taps to feel more responsive
    if (pressDuration < 100) {
      setTimeout(() => {
        onPress?.();
      }, 100 - pressDuration);
    } else {
      onPress?.();
    }
  }, [disabled, loading, onPress]);

  // ====================================
  // STYLE HELPERS
  // ====================================

  const getButtonStyles = (): ViewStyle => {
    const baseStyles = styles[size];
    const variantStyles = getVariantStyles();
    const emotionStyles = getEmotionStyles();

    return {
      ...baseStyles,
      ...variantStyles,
      ...emotionStyles,
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          borderWidth: 0,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success || '#10B981',
          borderWidth: 0,
        };
      default:
        return {};
    }
  };

  const getEmotionStyles = (): ViewStyle => {
    switch (emotion) {
      case 'trust':
        return { shadowColor: theme.colors.primary };
      case 'love':
        return { shadowColor: '#F87171' };
      case 'joy':
        return { shadowColor: '#10B981' };
      case 'urgent':
        return { shadowColor: theme.colors.error };
      case 'playful':
        return { shadowColor: '#8B5CF6' };
      case 'calm':
        return { shadowColor: '#6B7280' };
      default:
        return {};
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseTextStyle = textStyles[size];
    const variantTextStyle = getVariantTextStyle();

    return {
      ...baseTextStyle,
      ...variantTextStyle,
    };
  };

  const getVariantTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
        return { color: '#FFFFFF' };
      case 'outline':
        return { color: theme.colors.primary };
      case 'ghost':
        return { color: theme.colors.onSurface };
      default:
        return { color: '#FFFFFF' };
    }
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      case 'xl':
        return 28;
      default:
        return 20;
    }
  };

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (gradientColors) return gradientColors;

    switch (emotion) {
      case 'trust':
        return [theme.colors.primary, '#1D4ED8'] as const;
      case 'love':
        return ['#F87171', '#EF4444'] as const;
      case 'joy':
        return ['#10B981', '#059669'] as const;
      case 'urgent':
        return [theme.colors.error, '#DC2626'] as const;
      case 'playful':
        return ['#8B5CF6', '#7C3AED'] as const;
      case 'calm':
        return ['#6B7280', '#4B5563'] as const;
      default:
        return [theme.colors.primary, theme.colors.primary] as const;
    }
  };

  const getHapticTypeForVariant = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'medium' as const;
      case 'danger':
        return 'warning' as const;
      case 'success':
        return 'success' as const;
      default:
        return 'light' as const;
    }
  };

  // ====================================
  // RENDER CONTENT
  // ====================================

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getVariantTextStyle().color}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'large'}
            color={getVariantTextStyle().color}
          />
          {loadingText && (
            <Text style={[getTextStyles(), styles.loadingText]}>
              {loadingText}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && renderIcon()}

        <View style={styles.textContainer}>
          <Text style={[getTextStyles(), textStyle]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[getTextStyles(), styles.subtitle]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {icon && iconPosition === 'right' && renderIcon()}
      </View>
    );
  };

  // ====================================
  // RENDER COMPONENT
  // ====================================

  const buttonContent = (
    <Animated.View style={[getButtonStyles(), animatedButtonStyle, style]}>
      {/* Gradient Background */}
      {(variant === 'primary' || variant === 'secondary') && (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Ripple Effect */}
      <Animated.View
        style={[styles.ripple, animatedRippleStyle]}
        pointerEvents='none'
      />

      {/* Button Content */}
      {renderContent()}
    </Animated.View>
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole='button'
      accessibilityState={{
        disabled: disabled || loading,
      }}
    >
      {buttonContent}
    </Pressable>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  // Size variations
  small: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    height: 60,
    paddingHorizontal: 28,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  // Content layout
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },

  // Icons
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },

  // Ripple effect
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginTop: -50,
    marginLeft: -50,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

const textStyles = StyleSheet.create({
  small: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  medium: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  large: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 28,
  },
  xl: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 32,
  },
});

export default PremiumButton;
