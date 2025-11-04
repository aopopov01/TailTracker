/**
 * TailTracker Haptic Feedback System
 *
 * Premium haptic feedback that makes every interaction feel delightful.
 * Carefully crafted patterns that enhance emotional connection with pets.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// ====================================
// HAPTIC PATTERNS
// ====================================

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'heartbeat'
  | 'playful'
  | 'gentle'
  | 'urgent';

export type HapticIntensity = 'subtle' | 'normal' | 'strong';

// ====================================
// HAPTIC FEEDBACK FUNCTIONS
// ====================================

export const hapticFeedback = async (
  type: HapticType,
  intensity: HapticIntensity = 'normal'
) => {
  if (Platform.OS === 'web') return; // No haptics on web

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;

      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;

      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;

      case 'success':
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        break;

      case 'warning':
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        break;

      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;

      case 'heartbeat':
        await createHeartbeatPattern(intensity);
        break;

      case 'playful':
        await createPlayfulPattern(intensity);
        break;

      case 'gentle':
        await createGentlePattern(intensity);
        break;

      case 'urgent':
        await createUrgentPattern(intensity);
        break;

      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

// ====================================
// CUSTOM HAPTIC PATTERNS
// ====================================

const createHeartbeatPattern = async (intensity: HapticIntensity) => {
  const impactType =
    intensity === 'subtle'
      ? Haptics.ImpactFeedbackStyle.Light
      : intensity === 'strong'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium;

  // Two quick pulses like a heartbeat
  await Haptics.impactAsync(impactType);
  await new Promise(resolve => setTimeout(resolve, 120));
  await Haptics.impactAsync(impactType);
};

const createPlayfulPattern = async (_intensity: HapticIntensity) => {
  const lightImpact = Haptics.ImpactFeedbackStyle.Light;
  const mediumImpact = Haptics.ImpactFeedbackStyle.Medium;

  // Playful bounce pattern
  await Haptics.impactAsync(lightImpact);
  await new Promise(resolve => setTimeout(resolve, 80));
  await Haptics.impactAsync(mediumImpact);
  await new Promise(resolve => setTimeout(resolve, 60));
  await Haptics.impactAsync(lightImpact);
};

const createGentlePattern = async (_intensity: HapticIntensity) => {
  // Soft, caring pattern
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await new Promise(resolve => setTimeout(resolve, 200));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const createUrgentPattern = async (_intensity: HapticIntensity) => {
  // Urgent but not panic-inducing
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise(resolve => setTimeout(resolve, 100));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise(resolve => setTimeout(resolve, 100));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

// ====================================
// CONTEXT-SPECIFIC HAPTIC FUNCTIONS
// ====================================

export const buttonPressHaptic = (
  variant: 'primary' | 'secondary' | 'tertiary' = 'primary'
) => {
  switch (variant) {
    case 'primary':
      return hapticFeedback('medium');
    case 'secondary':
      return hapticFeedback('light');
    case 'tertiary':
      return hapticFeedback('light', 'subtle');
  }
};

export const cardTapHaptic = () => hapticFeedback('light');

export const swipeHaptic = (direction: 'left' | 'right' | 'up' | 'down') => {
  // Different intensities based on swipe direction
  if (direction === 'left' || direction === 'right') {
    return hapticFeedback('medium');
  }
  return hapticFeedback('light');
};

export const toggleHaptic = (isOn: boolean) => {
  return hapticFeedback(isOn ? 'success' : 'light');
};

export const errorHaptic = () => hapticFeedback('error');

export const successHaptic = () => hapticFeedback('success');

export const warningHaptic = () => hapticFeedback('warning');

// Pet-specific haptics
export const petFoundHaptic = () => hapticFeedback('success');

export const petLostHaptic = () => hapticFeedback('urgent');

export const petHealthHaptic = (status: 'good' | 'warning' | 'critical') => {
  switch (status) {
    case 'good':
      return hapticFeedback('heartbeat', 'subtle');
    case 'warning':
      return hapticFeedback('warning');
    case 'critical':
      return hapticFeedback('urgent');
  }
};

export const petMoodHaptic = (
  mood: 'happy' | 'playful' | 'sleepy' | 'excited'
) => {
  switch (mood) {
    case 'happy':
      return hapticFeedback('gentle');
    case 'playful':
      return hapticFeedback('playful');
    case 'sleepy':
      return hapticFeedback('light', 'subtle');
    case 'excited':
      return hapticFeedback('playful', 'strong');
  }
};

// ====================================
// HAPTIC PREFERENCES
// ====================================

export interface HapticSettings {
  enabled: boolean;
  intensity: HapticIntensity;
  reduceForAccessibility: boolean;
}

let hapticSettings: HapticSettings = {
  enabled: true,
  intensity: 'normal',
  reduceForAccessibility: false,
};

export const updateHapticSettings = (settings: Partial<HapticSettings>) => {
  hapticSettings = { ...hapticSettings, ...settings };
};

export const getHapticSettings = (): HapticSettings => hapticSettings;

// Wrapper that respects user preferences
export const hapticWithSettings = async (type: HapticType) => {
  if (!hapticSettings.enabled) return;

  const intensity = hapticSettings.reduceForAccessibility
    ? 'subtle'
    : hapticSettings.intensity;

  return hapticFeedback(type, intensity);
};

export default {
  feedback: hapticFeedback,
  button: buttonPressHaptic,
  card: cardTapHaptic,
  swipe: swipeHaptic,
  toggle: toggleHaptic,
  error: errorHaptic,
  success: successHaptic,
  warning: warningHaptic,
  pet: {
    found: petFoundHaptic,
    lost: petLostHaptic,
    health: petHealthHaptic,
    mood: petMoodHaptic,
  },
  settings: {
    update: updateHapticSettings,
    get: getHapticSettings,
  },
  withSettings: hapticWithSettings,
};
