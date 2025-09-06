/**
 * TailTracker Cross-Platform Components
 * 
 * Components that maintain visual consistency while respecting platform conventions.
 * Each component automatically adapts to iOS and Android design guidelines.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tailTrackerColors } from '../core/colors';
import { tailTrackerTypography } from '../core/typography';
import { platformAdapter, platformDesign, consistentStyling } from './PlatformAdapter';

// ====================================
// CROSS-PLATFORM BUTTON COMPONENT
// ====================================

interface CrossPlatformButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const CrossPlatformButton: React.FC<CrossPlatformButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  hapticFeedback = 'medium',
  style,
  textStyle,
}) => {
  const metrics = platformAdapter.getMetrics();
  const capabilities = platformAdapter.getCapabilities();

  const handlePress = () => {
    if (disabled || loading) return;

    // Platform-appropriate haptic feedback
    if (capabilities.supportsHapticFeedback) {
      switch (hapticFeedback) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    onPress();
  };

  const getButtonStyles = () => {
    const baseButton = consistentStyling.getConsistentStyles().button;
    const tokens = platformDesign.getTokens();

    // Size variations
    const sizeStyles = {
      small: { height: 36, paddingHorizontal: 16 },
      medium: { height: tokens.spacing.touch, paddingHorizontal: 24 },
      large: { height: 52, paddingHorizontal: 32 },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: tailTrackerColors.primary.trustBlue,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: Platform.select({ ios: 1, android: 2 }),
        borderColor: tailTrackerColors.primary.trustBlue,
      },
      tertiary: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      danger: {
        backgroundColor: tailTrackerColors.semantic.errorPrimary,
        borderWidth: 0,
      },
    };

    return StyleSheet.flatten([
      baseButton,
      sizeStyles[size],
      variantStyles[variant],
      fullWidth && { width: '100%' },
      disabled && {
        opacity: 0.6,
        backgroundColor: tailTrackerColors.light.interactiveDisabled,
      },
      // Platform-specific overrides
      Platform.select({
        ios: {
          borderRadius: tokens.borderRadius.small + 2, // Slightly more rounded on iOS
        },
        android: {
          elevation: disabled ? 0 : 2,
        },
      }),
      style,
    ]);
  };

  const getTextStyles = () => {
    const baseText = tailTrackerTypography.interactive.buttonPrimary;
    
    const variantTextStyles = {
      primary: { color: 'white' },
      secondary: { color: tailTrackerColors.primary.trustBlue },
      tertiary: { color: tailTrackerColors.primary.trustBlue },
      danger: { color: 'white' },
    };

    const sizeTextStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    return StyleSheet.flatten([
      baseText,
      sizeTextStyles[size],
      variantTextStyles[variant],
      disabled && { color: tailTrackerColors.light.textTertiary },
      textStyle,
    ]);
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={Platform.select({ ios: 0.7, android: 0.8 })}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' || variant === 'danger' ? 'white' : tailTrackerColors.primary.trustBlue}
            size="small"
          />
        ) : (
          <>
            {icon && <View style={styles.buttonIcon}>{icon}</View>}
            <Text style={getTextStyles()}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ====================================
// CROSS-PLATFORM INPUT COMPONENT
// ====================================

interface CrossPlatformInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

const CrossPlatformInput: React.FC<CrossPlatformInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  helperText,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
}) => {
  const tokens = platformDesign.getTokens();
  const baseInput = consistentStyling.getConsistentStyles().input;

  const getInputContainerStyles = () => {
    return StyleSheet.flatten([
      styles.inputContainer,
      error && {
        borderColor: tailTrackerColors.semantic.errorPrimary,
        borderWidth: Platform.select({ ios: 1, android: 2 }),
      },
      disabled && {
        backgroundColor: tailTrackerColors.light.surfaceSecondary,
        opacity: 0.6,
      },
      style,
    ]);
  };

  const getInputStyles = () => {
    return StyleSheet.flatten([
      baseInput,
      {
        borderWidth: 0, // Remove border from input, handled by container
        backgroundColor: 'transparent',
        flex: 1,
      },
      multiline && {
        height: numberOfLines * 20 + 24,
        textAlignVertical: 'top',
      },
      Platform.select({
        android: {
          paddingTop: 12,
          paddingBottom: 12,
        },
      }),
      inputStyle,
    ]);
  };

  return (
    <View style={styles.inputWrapper}>
      {label && (
        <Text style={[tailTrackerTypography.utility.inputLabel, styles.label]}>
          {label}
        </Text>
      )}
      
      <View style={getInputContainerStyles()}>
        {leftIcon && <View style={styles.inputIcon}>{leftIcon}</View>}
        
        <TextInput
          style={getInputStyles()}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tailTrackerColors.light.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={!disabled}
          // Platform-specific props
          underlineColorAndroid="transparent"
          selectionColor={tailTrackerColors.primary.trustBlue}
        />
        
        {rightIcon && <View style={styles.inputIcon}>{rightIcon}</View>}
      </View>
      
      {(error || helperText) && (
        <Text
          style={[
            error ? styles.errorText : styles.helperText,
            error
              ? tailTrackerTypography.utility.error
              : tailTrackerTypography.utility.helper,
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

// ====================================
// CROSS-PLATFORM CARD COMPONENT
// ====================================

interface CrossPlatformCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const CrossPlatformCard: React.FC<CrossPlatformCardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'medium',
  style,
}) => {
  const tokens = platformDesign.getTokens();
  const baseCard = consistentStyling.getConsistentStyles().card;

  const getCardStyles = () => {
    const paddingStyles = {
      small: { padding: 12 },
      medium: { padding: tokens.spacing.comfortable },
      large: { padding: 32 },
    };

    const variantStyles = {
      default: {
        ...baseCard,
      },
      elevated: {
        ...baseCard,
        ...tokens.shadows.medium,
      },
      outlined: {
        ...baseCard,
        borderWidth: Platform.select({ ios: 1, android: 1 }),
        borderColor: tailTrackerColors.light.borderPrimary,
        elevation: 0,
        shadowOpacity: 0,
      },
    };

    return StyleSheet.flatten([
      variantStyles[variant],
      paddingStyles[padding],
      style,
    ]);
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={getCardStyles()}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </CardWrapper>
  );
};

// ====================================
// CROSS-PLATFORM MODAL COMPONENT
// ====================================

interface CrossPlatformModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  animated?: boolean;
  backdropBlur?: boolean;
}

const CrossPlatformModal: React.FC<CrossPlatformModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  animated = true,
  backdropBlur = true,
}) => {
  const metrics = platformAdapter.getMetrics();
  const capabilities = platformAdapter.getCapabilities();
  const tokens = platformDesign.getTokens();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { maxHeight: metrics.screenHeight * 0.4 };
      case 'large':
        return { maxHeight: metrics.screenHeight * 0.8 };
      case 'fullscreen':
        return { height: metrics.screenHeight, borderRadius: 0 };
      default:
        return { maxHeight: metrics.screenHeight * 0.6 };
    }
  };

  const BackdropComponent = capabilities.supportsBlur && backdropBlur ? BlurView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animated ? (Platform.OS === 'ios' ? 'slide' : 'fade') : 'none'}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <BackdropComponent
        style={styles.modalBackdrop}
        intensity={80}
        tint="dark"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalContent, getSizeStyles()]}>
            {(title || showCloseButton) && (
              <View style={styles.modalHeader}>
                {title && (
                  <Text style={[tailTrackerTypography.display.cardTitle, styles.modalTitle]}>
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={Platform.OS === 'ios'}
            >
              {children}
            </ScrollView>
          </View>
        </SafeAreaView>
      </BackdropComponent>
    </Modal>
  );
};// ====================================
// CROSS-PLATFORM SWITCH COMPONENT
// ====================================

interface CrossPlatformSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  color?: string;
}

const CrossPlatformSwitch: React.FC<CrossPlatformSwitchProps> = ({
  value,
  onValueChange,
  label,
  disabled = false,
  size = 'medium',
  color = tailTrackerColors.primary.trustBlue,
}) => {
  const handleValueChange = (newValue: boolean) => {
    if (disabled) return;
    
    // Haptic feedback on toggle
    if (platformAdapter.getCapabilities().supportsHapticFeedback) {
      Haptics.selectionAsync();
    }
    
    onValueChange(newValue);
  };

  const switchStyle = {
    transform: Platform.select({
      ios: [{ scale: size === 'small' ? 0.8 : 1 }],
      android: [{ scale: size === 'small' ? 0.9 : 1.1 }],
    }),
  };

  return (
    <View style={styles.switchContainer}>
      <Switch
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        trackColor={{
          false: Platform.select({
            ios: tailTrackerColors.light.borderSecondary,
            android: tailTrackerColors.light.surfaceSecondary,
          }),
          true: Platform.select({
            ios: color,
            android: `${color}80`, // 50% opacity
          }),
        }}
        thumbColor={Platform.select({
          ios: 'white',
          android: value ? color : tailTrackerColors.light.surfacePrimary,
        })}
        style={switchStyle}
      />
      {label && (
        <Text style={[tailTrackerTypography.body.body, styles.switchLabel, disabled && { opacity: 0.6 }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  // Button styles
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },

  // Input styles
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tailTrackerColors.light.surfacePrimary,
    borderRadius: platformDesign.getBorderRadius('small'),
    borderWidth: Platform.select({ ios: 1, android: 0 }),
    borderColor: tailTrackerColors.light.borderPrimary,
    paddingHorizontal: 12,
    minHeight: platformDesign.getSpacing('touch'),
  },
  inputIcon: {
    marginHorizontal: 4,
  },
  label: {
    marginBottom: 6,
    color: tailTrackerColors.light.textSecondary,
  },
  errorText: {
    marginTop: 4,
    color: tailTrackerColors.semantic.errorPrimary,
  },
  helperText: {
    marginTop: 4,
    color: tailTrackerColors.light.textTertiary,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: Platform.select({
      ios: 'rgba(0, 0, 0, 0.5)',
      android: 'rgba(0, 0, 0, 0.7)',
    }),
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: tailTrackerColors.light.background,
    borderTopLeftRadius: platformDesign.getBorderRadius('large'),
    borderTopRightRadius: platformDesign.getBorderRadius('large'),
    paddingTop: 12,
    ...platformDesign.getShadow('large'),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: Platform.select({ ios: StyleSheet.hairlineWidth, android: 1 }),
    borderBottomColor: tailTrackerColors.light.borderPrimary,
  },
  modalTitle: {
    flex: 1,
    color: tailTrackerColors.light.textPrimary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: tailTrackerColors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: tailTrackerColors.light.textSecondary,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Switch styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginLeft: 12,
    color: tailTrackerColors.light.textPrimary,
  },
});

// ====================================
// EXPORTS
// ====================================

export {
  CrossPlatformButton,
  CrossPlatformInput,
  CrossPlatformCard,
  CrossPlatformModal,
  CrossPlatformSwitch,
};

export default {
  Button: CrossPlatformButton,
  Input: CrossPlatformInput,
  Card: CrossPlatformCard,
  Modal: CrossPlatformModal,
  Switch: CrossPlatformSwitch,
};