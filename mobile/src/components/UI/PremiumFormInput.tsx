/**
 * TailTracker Premium Form Input Component
 * 
 * Beautiful form inputs with smooth animations, validation feedback,
 * and delightful micro-interactions that guide users gently.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';

import premiumAnimations from '../../design-system/animations/premiumAnimations';
import { useMaterialTheme } from '../../theme/MaterialThemeProvider';
import hapticUtils from '../../utils/hapticUtils';

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export interface PremiumFormInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  
  // Validation
  validationRules?: ValidationRule[];
  showValidation?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  
  // Appearance
  variant?: 'outlined' | 'filled' | 'underlined';
  size?: 'small' | 'medium' | 'large';
  emotion?: 'neutral' | 'trust' | 'love' | 'success' | 'warning' | 'error';
  
  // Icons and Actions
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  
  // States
  isValid?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  
  // Customization
  helperText?: string;
  successText?: string;
  floatingLabel?: boolean;
  animateOnFocus?: boolean;
  hapticFeedback?: boolean;
  
  // Styles
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

// ====================================
// PREMIUM FORM INPUT COMPONENT
// ====================================

export const PremiumFormInput: React.FC<PremiumFormInputProps> = ({
  label,
  value,
  onChangeText,
  validationRules = [],
  showValidation = true,
  validateOnBlur = true,
  validateOnChange = false,
  variant = 'outlined',
  size = 'medium',
  emotion = 'neutral',
  leftIcon,
  rightIcon,
  onRightIconPress,
  isValid,
  isLoading = false,
  disabled = false,
  helperText,
  successText,
  floatingLabel = true,
  animateOnFocus = true,
  hapticFeedback = true,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const { theme } = useMaterialTheme();
  const inputRef = useRef<TextInput>(null);
  
  // State
  const [isFocused, setIsFocused] = useState(false);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    errorMessage: string;
  }>({ isValid: true, errorMessage: '' });
  
  // Animation values
  const borderColor = useSharedValue(theme.colors.outline);
  const borderWidth = useSharedValue(1);
  const labelY = useSharedValue(0);
  const labelScale = useSharedValue(1);
  const labelOpacity = useSharedValue(0.6);
  const shakeTranslateX = useSharedValue(0);
  const successScale = useSharedValue(0);
  const errorOpacity = useSharedValue(0);
  
  // ====================================
  // VALIDATION LOGIC
  // ====================================
  
  const validateInput = useCallback((inputValue: string): { isValid: boolean; errorMessage: string } => {
    for (const rule of validationRules) {
      if (rule.required && (!inputValue || inputValue.trim() === '')) {
        return { isValid: false, errorMessage: rule.message };
      }
      
      if (rule.minLength && inputValue.length < rule.minLength) {
        return { isValid: false, errorMessage: rule.message };
      }
      
      if (rule.maxLength && inputValue.length > rule.maxLength) {
        return { isValid: false, errorMessage: rule.message };
      }
      
      if (rule.pattern && !rule.pattern.test(inputValue)) {
        return { isValid: false, errorMessage: rule.message };
      }
      
      if (rule.custom && !rule.custom(inputValue)) {
        return { isValid: false, errorMessage: rule.message };
      }
    }
    
    return { isValid: true, errorMessage: '' };
  }, [validationRules]);
  
  // ====================================
  // ANIMATION HELPERS
  // ====================================
  
  const animateToFocused = useCallback(() => {
    if (animateOnFocus) {
      const focusAnimation = premiumAnimations.forms.focus();
      borderWidth.value = withSpring(focusAnimation.borderWidth, premiumAnimations.springs.crisp);
      borderColor.value = withTiming(theme.colors.primary, { duration: premiumAnimations.timings.fast });
    }
    
    if (floatingLabel) {
      const labelAnimation = premiumAnimations.forms.floatingLabel(true, !!value);
      labelY.value = labelAnimation.translateY;
      labelScale.value = labelAnimation.scale;
      labelOpacity.value = labelAnimation.opacity;
    }
  }, [animateOnFocus, floatingLabel, value, theme.colors.primary, borderColor, borderWidth, labelOpacity, labelScale, labelY]);
  
  const animateToUnfocused = useCallback(() => {
    if (animateOnFocus) {
      borderWidth.value = withSpring(1, premiumAnimations.springs.gentle);
      borderColor.value = withTiming(theme.colors.outline, { duration: premiumAnimations.timings.fast });
    }
    
    if (floatingLabel) {
      const labelAnimation = premiumAnimations.forms.floatingLabel(false, !!value);
      labelY.value = labelAnimation.translateY;
      labelScale.value = labelAnimation.scale;
      labelOpacity.value = labelAnimation.opacity;
    }
  }, [animateOnFocus, floatingLabel, value, theme.colors.outline, borderColor, borderWidth, labelOpacity, labelScale, labelY]);
  
  const animateError = useCallback(() => {
    const errorAnimation = premiumAnimations.forms.error();
    shakeTranslateX.value = withSequence(...errorAnimation.translateX.map((x: number) => withTiming(x, { duration: 50 })));
    borderColor.value = withTiming(theme.colors.error, { duration: premiumAnimations.timings.fast });
    errorOpacity.value = withTiming(1, { duration: premiumAnimations.timings.standard });
    
    if (hapticFeedback) {
      runOnJS(hapticUtils.error)();
    }
  }, [theme.colors.error, hapticFeedback, borderColor, errorOpacity, shakeTranslateX]);
  
  const animateSuccess = useCallback(() => {
    const successAnimation = premiumAnimations.success.checkmark();
    successScale.value = successAnimation.scale;
    borderColor.value = withTiming(theme.colors.primary, { duration: premiumAnimations.timings.fast });
    errorOpacity.value = withTiming(0, { duration: premiumAnimations.timings.fast });
    
    if (hapticFeedback) {
      runOnJS(hapticUtils.success)();
    }
  }, [theme.colors.primary, hapticFeedback, borderColor, errorOpacity, successScale]);
  
  // ====================================
  // EVENT HANDLERS
  // ====================================
  
  const handleFocus = useCallback((event: any) => {
    setIsFocused(true);
    animateToFocused();
    
    if (hapticFeedback) {
      hapticUtils.feedback('light');
    }
    
    onFocus?.(event);
  }, [animateToFocused, hapticFeedback, onFocus]);
  
  const handleBlur = useCallback((event: any) => {
    setIsFocused(false);
    animateToUnfocused();
    
    if (validateOnBlur && showValidation) {
      const validation = validateInput(value);
      setValidationState(validation);
      
      if (!validation.isValid) {
        animateError();
      } else if (value) {
        animateSuccess();
      }
    }
    
    onBlur?.(event);
  }, [animateToUnfocused, validateOnBlur, showValidation, validateInput, value, animateError, animateSuccess, onBlur]);
  
  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    
    if (validateOnChange && showValidation) {
      const validation = validateInput(text);
      setValidationState(validation);
      
      if (!validation.isValid && text) {
        animateError();
      } else if (validation.isValid && text) {
        animateSuccess();
      }
    }
  }, [onChangeText, validateOnChange, showValidation, validateInput, animateError, animateSuccess]);
  
  // ====================================
  // ANIMATED STYLES
  // ====================================
  
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      borderColor: borderColor.value,
      borderWidth: borderWidth.value,
      transform: [{ translateX: shakeTranslateX.value }],
    };
  });
  
  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: labelY.value },
        { scale: labelScale.value },
      ],
      opacity: labelOpacity.value,
    };
  });
  
  const animatedSuccessStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: successScale.value }],
      opacity: successScale.value,
    };
  });
  
  const animatedErrorStyle = useAnimatedStyle(() => {
    return {
      opacity: errorOpacity.value,
    };
  });
  
  // ====================================
  // STYLE HELPERS
  // ====================================
  
  const getContainerStyles = (): ViewStyle => {
    const baseStyles = styles[variant];
    const sizeStyles = styles[`${size}Container` as keyof typeof styles];
    const emotionStyles = getEmotionStyles();
    
    return {
      ...baseStyles,
      ...sizeStyles,
      ...emotionStyles,
    };
  };
  
  const getEmotionStyles = (): ViewStyle => {
    const colors = {
      neutral: theme.colors.outline,
      trust: theme.colors.primary,
      love: '#F87171',
      success: '#10B981',
      warning: '#F59E0B',
      error: theme.colors.error,
    };
    
    return {
      shadowColor: colors[emotion],
    };
  };
  
  const getInputStyles = (): TextStyle => {
    const sizeStyles = styles[`${size}Input` as keyof typeof styles];
    
    return {
      ...sizeStyles,
      color: theme.colors.onSurface,
    };
  };
  
  const getLabelStyles = (): TextStyle => {
    const sizeStyles = styles[`${size}Label` as keyof typeof styles];
    
    return {
      ...sizeStyles,
      color: theme.colors.onSurfaceVariant,
    };
  };
  
  // ====================================
  // RENDER HELPERS
  // ====================================
  
  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    
    return (
      <View style={styles.leftIconContainer}>
        <Ionicons
          name={leftIcon}
          size={getIconSize()}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    );
  };
  
  const renderRightIcon = () => {
    if (isLoading) {
      return (
        <View style={styles.rightIconContainer}>
          <Animated.View style={animatedSuccessStyle}>
            <Ionicons
              name="checkmark-circle"
              size={getIconSize()}
              color="#10B981"
            />
          </Animated.View>
        </View>
      );
    }
    
    if (rightIcon) {
      return (
        <TouchableOpacity
          style={styles.rightIconContainer}
          onPress={onRightIconPress}
          disabled={!onRightIconPress}
        >
          <Ionicons
            name={rightIcon}
            size={getIconSize()}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      );
    }
    
    if (showValidation && !validationState.isValid && validationState.errorMessage) {
      return (
        <View style={styles.rightIconContainer}>
          <Ionicons
            name="alert-circle"
            size={getIconSize()}
            color={theme.colors.error}
          />
        </View>
      );
    }
    
    if (showValidation && validationState.isValid && value) {
      return (
        <View style={styles.rightIconContainer}>
          <Animated.View style={animatedSuccessStyle}>
            <Ionicons
              name="checkmark-circle"
              size={getIconSize()}
              color="#10B981"
            />
          </Animated.View>
        </View>
      );
    }
    
    return null;
  };
  
  const renderHelperText = () => {
    if (showValidation && !validationState.isValid && validationState.errorMessage) {
      return (
        <Animated.View style={[styles.helperContainer, animatedErrorStyle]}>
          <Text style={[styles.helperText, styles.errorText, errorStyle]}>
            {validationState.errorMessage}
          </Text>
        </Animated.View>
      );
    }
    
    if (showValidation && validationState.isValid && successText && value) {
      return (
        <View style={styles.helperContainer}>
          <Text style={[styles.helperText, styles.successText]}>
            {successText}
          </Text>
        </View>
      );
    }
    
    if (helperText) {
      return (
        <View style={styles.helperContainer}>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            {helperText}
          </Text>
        </View>
      );
    }
    
    return null;
  };
  
  const getIconSize = () => {
    switch (size) {
      case 'small': return 18;
      case 'large': return 26;
      default: return 22;
    }
  };
  
  // ====================================
  // RENDER COMPONENT
  // ====================================
  
  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={[getContainerStyles(), animatedContainerStyle]}>
        {renderLeftIcon()}
        
        <View style={styles.inputContainer}>
          {floatingLabel && (
            <Animated.Text
              style={[
                getLabelStyles(),
                styles.floatingLabel,
                animatedLabelStyle,
                labelStyle,
              ]}
              pointerEvents="none"
            >
              {label}
            </Animated.Text>
          )}
          
          <TextInput
            ref={inputRef}
            style={[getInputStyles(), inputStyle]}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={!floatingLabel ? label : undefined}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            editable={!disabled && !isLoading}
            {...textInputProps}
          />
        </View>
        
        {renderRightIcon()}
      </Animated.View>
      
      {renderHelperText()}
    </View>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  
  // Container variants
  outlined: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  filled: {
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  underlined: {
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 2,
    backgroundColor: 'transparent',
  },
  
  // Size variants
  smallContainer: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediumContainer: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  largeContainer: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  // Input container
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  
  // Input sizes
  smallInput: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediumInput: {
    fontSize: 16,
    lineHeight: 24,
  },
  largeInput: {
    fontSize: 18,
    lineHeight: 28,
  },
  
  // Label sizes
  smallLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  mediumLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  largeLabel: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Floating label
  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontWeight: '500',
  },
  
  // Icons
  leftIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Helper text
  helperContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  successText: {
    color: '#10B981',
    fontWeight: '500',
  },
});

export default PremiumFormInput;