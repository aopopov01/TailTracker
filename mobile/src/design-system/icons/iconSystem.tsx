/**
 * TailTracker Icon System
 * 
 * A comprehensive icon library designed with personality and emotional resonance.
 * Every icon tells part of the story of the loving relationship between pets and humans.
 */

import React from 'react';
import { Svg, Path, Circle, Ellipse, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { tailTrackerColors } from '../core/colors';

// ====================================
// ICON SYSTEM CONFIGURATION
// ====================================

export interface IconProps {
  size?: number;
  color?: string;
  emotion?: 'love' | 'trust' | 'joy' | 'calm' | 'playful' | 'caring';
  variant?: 'outline' | 'filled' | 'duotone';
  strokeWidth?: number;
  style?: any;
  testID?: string;
}

const getEmotionalColor = (emotion?: IconProps['emotion']) => {
  switch (emotion) {
    case 'love':
      return tailTrackerColors.primary.heartCoral;
    case 'trust':
      return tailTrackerColors.primary.trustBlue;
    case 'joy':
      return tailTrackerColors.primary.playGreen;
    case 'calm':
      return tailTrackerColors.primary.peaceLavender;
    case 'playful':
      return tailTrackerColors.contextual.mischievousGold;
    case 'caring':
      return tailTrackerColors.contextual.safeHaven;
    default:
      return tailTrackerColors.light.textPrimary;
  }
};

// ====================================
// PET-SPECIFIC ICONS
// ====================================

export const PetIcons = {
  // Dog Icons
  Dog: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    const fillColor = variant === 'filled' ? iconColor : 'none';
    const strokeColor = variant === 'filled' ? 'none' : iconColor;
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {variant === 'duotone' && (
          <Defs>
            <LinearGradient id="dogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={iconColor} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={iconColor} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
        )}
        
        {/* Dog face */}
        <Path
          d="M12 4c-4 0-7 3-7 7 0 2 1 4 2.5 5.5L12 21l4.5-4.5C18 15 19 13 19 11c0-4-3-7-7-7z"
          fill={variant === 'duotone' ? 'url(#dogGradient)' : fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Eyes */}
        <Circle cx="9.5" cy="9" r="0.5" fill={iconColor} />
        <Circle cx="14.5" cy="9" r="0.5" fill={iconColor} />
        
        {/* Nose */}
        <Path
          d="M12 10.5c-0.5 0-1 0.5-1 1s0.5 1 1 1 1-0.5 1-1-0.5-1-1-1z"
          fill={iconColor}
        />
        
        {/* Mouth */}
        <Path
          d="M11 13c0.5 0.5 1.5 0.5 2 0"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Ears */}
        <Ellipse cx="8" cy="6" rx="1.5" ry="2" fill={iconColor} opacity="0.7" />
        <Ellipse cx="16" cy="6" rx="1.5" ry="2" fill={iconColor} opacity="0.7" />
      </Svg>
    );
  },
  
  // Cat Icons
  Cat: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    const fillColor = variant === 'filled' ? iconColor : 'none';
    const strokeColor = variant === 'filled' ? 'none' : iconColor;
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* Cat face */}
        <Circle
          cx="12"
          cy="12"
          r="6"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Ears */}
        <Path
          d="M8 8l-2-4 M16 8l2-4"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Eyes */}
        <Ellipse cx="10" cy="11" rx="0.8" ry="1.2" fill={iconColor} />
        <Ellipse cx="14" cy="11" rx="0.8" ry="1.2" fill={iconColor} />
        
        {/* Nose */}
        <Path d="M12 13l-0.5-0.5 1 0z" fill={iconColor} />
        
        {/* Whiskers */}
        <Path
          d="M7 12h-2 M17 12h2 M7.5 13.5l-1.5 1 M16.5 13.5l1.5 1 M7.5 10.5l-1.5-1 M16.5 10.5l1.5-1"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    );
  },
  
  // Bird Icon
  Bird: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    const fillColor = variant === 'filled' ? iconColor : 'none';
    const strokeColor = variant === 'filled' ? 'none' : iconColor;
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* Bird body */}
        <Ellipse
          cx="12"
          cy="14"
          rx="4"
          ry="6"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Bird head */}
        <Circle
          cx="12"
          cy="8"
          r="3"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Wing */}
        <Path
          d="M8 12c-2 0-4 1-4 3s2 3 4 3"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Beak */}
        <Path
          d="M9 8l-2-1"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Eye */}
        <Circle cx="13" cy="7" r="0.5" fill={iconColor} />
        
        {/* Tail */}
        <Path
          d="M12 20l-2 2 M12 20l2 2"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    );
  },
};

// ====================================
// ACTIVITY & HEALTH ICONS
// ====================================

export const ActivityIcons = {
  // Walking Icon
  Walking: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* Person walking */}
        <Circle cx="9" cy="4" r="2" fill={iconColor} />
        <Path
          d="M9 6v6l-2 6 M11 12l2-2 M9 12l2 2v6"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Dog silhouette */}
        <Ellipse cx="17" cy="16" rx="2" ry="1" fill={iconColor} opacity="0.6" />
        <Circle cx="16" cy="14" r="1" fill={iconColor} opacity="0.6" />
        
        {/* Leash */}
        <Path
          d="M11 14c2 0 4 1 5 2"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="2,2"
        />
      </Svg>
    );
  },
  
  // Playing Icon
  Playing: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* Ball */}
        <Circle
          cx="12"
          cy="12"
          r="6"
          fill="none"
          stroke={iconColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Ball pattern */}
        <Path
          d="M6 12c2-2 4-2 6 0s4 2 6 0 M12 6c0 2 0 4 0 6s0 4 0 6"
          stroke={iconColor}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
        />
        
        {/* Motion lines */}
        <Path
          d="M2 8l2 2 M2 16l2-2 M22 8l-2 2 M22 16l-2-2"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.5"
        />
      </Svg>
    );
  },
  
  // Sleeping Icon
  Sleeping: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* Pet sleeping silhouette */}
        <Ellipse
          cx="12"
          cy="16"
          rx="6"
          ry="3"
          fill={iconColor}
          opacity="0.3"
        />
        <Circle
          cx="8"
          cy="14"
          r="2.5"
          fill={iconColor}
          opacity="0.6"
        />
        
        {/* Sleep symbols */}
        <Path
          d="M14 6c0 1 1 2 2 2s2-1 2-2-1-2-2-2-2 1-2 2z M16 4c0.5 0 1-0.5 1-1s-0.5-1-1-1-1 0.5-1 1 0.5 1 1 1z M18 8c0.5 0 1-0.5 1-1s-0.5-1-1-1-1 0.5-1 1 0.5 1 1 1z"
          fill={iconColor}
          opacity="0.7"
        />
      </Svg>
    );
  },
  
  // Health Heart Icon
  HealthHeart: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion) || tailTrackerColors.primary.heartCoral;
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* Heart shape */}
        <Path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={variant === 'filled' ? 'none' : iconColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Heartbeat line */}
        <Path
          d="M7 12h2l1-3 2 6 1-3h2"
          stroke={variant === 'filled' ? 'white' : iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  },
};

// ====================================
// LOCATION & SAFETY ICONS
// ====================================

export const LocationIcons = {
  // Home Icon
  Home: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* House */}
        <Path
          d="M3 12l9-9 9 9M5 10v10h4v-6h2v6h4V10"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Roof detail */}
        <Path
          d="M9 21v-6h6v6"
          fill="none"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Heart on house */}
        <Circle cx="12" cy="8" r="1" fill={tailTrackerColors.primary.heartCoral} />
      </Svg>
    );
  },
  
  // Safe Zone Icon
  SafeZone: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || tailTrackerColors.contextual.safeHaven;
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* Outer circle */}
        <Circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeDasharray="4,2"
          opacity="0.5"
        />
        
        {/* Inner circle */}
        <Circle
          cx="12"
          cy="12"
          r="5"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth={strokeWidth}
          fillOpacity="0.2"
        />
        
        {/* Shield icon */}
        <Path
          d="M12 8c-2 0-3 1-3 3v2c0 2 1 3 3 3s3-1 3-3v-2c0-2-1-3-3-3z"
          fill={iconColor}
        />
        
        {/* Checkmark */}
        <Path
          d="M10 12l1 1 2-2"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  },
  
  // GPS Tracking Icon
  GPSTracking: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        {/* Target circles */}
        <Circle
          cx="12"
          cy="12"
          r="8"
          fill="none"
          stroke={iconColor}
          strokeWidth={strokeWidth * 0.5}
          opacity="0.3"
        />
        <Circle
          cx="12"
          cy="12"
          r="5"
          fill="none"
          stroke={iconColor}
          strokeWidth={strokeWidth * 0.7}
          opacity="0.5"
        />
        <Circle
          cx="12"
          cy="12"
          r="2"
          fill={iconColor}
        />
        
        {/* Cross hairs */}
        <Path
          d="M12 2v4 M12 18v4 M2 12h4 M18 12h4"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Pulsing animation indicators */}
        <Circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={iconColor}
          strokeWidth={strokeWidth * 0.3}
          opacity="0.2"
        />
      </Svg>
    );
  },
};

// ====================================
// EMOTIONAL & INTERACTION ICONS
// ====================================

export const EmotionIcons = {
  // Love/Heart Icon
  Love: ({ size = 24, color, emotion = 'love', variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        <Path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={variant === 'filled' ? 'none' : iconColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Sparkles */}
        <Circle cx="6" cy="6" r="1" fill={iconColor} opacity="0.6" />
        <Circle cx="18" cy="6" r="0.5" fill={iconColor} opacity="0.4" />
        <Circle cx="20" cy="10" r="0.5" fill={iconColor} opacity="0.5" />
      </Svg>
    );
  },
  
  // Trust/Shield Icon
  Trust: ({ size = 24, color, emotion = 'trust', variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        <Path
          d="M12 2l8 3v7c0 5.55-3.84 10.74-8 12-4.16-1.26-8-6.45-8-12V5l8-3z"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        
        {/* Checkmark */}
        <Path
          d="M9 12l2 2 4-4"
          stroke={variant === 'filled' ? 'white' : iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  },
  
  // Joy/Star Icon
  Joy: ({ size = 24, color, emotion = 'joy', variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        <Path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        
        {/* Inner sparkle */}
        <Circle cx="12" cy="12" r="2" fill={iconColor} opacity="0.3" />
      </Svg>
    );
  },
};

// ====================================
// SYSTEM ICONS
// ====================================

export const SystemIcons = {
  // Add/Plus Icon
  Add: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        <Circle
          cx="12"
          cy="12"
          r="10"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth={strokeWidth}
        />
        <Path
          d="M12 8v8 M8 12h8"
          stroke={variant === 'filled' ? 'white' : iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    );
  },
  
  // Settings Icon
  Settings: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        <Circle
          cx="12"
          cy="12"
          r="3"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth={strokeWidth}
        />
        <Path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
          fill="none"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  },
  
  // Notification Bell Icon
  Notification: ({ size = 24, color, emotion, variant = 'outline', strokeWidth = 2, ...props }: IconProps) => {
    const iconColor = color || getEmotionalColor(emotion);
    
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        <Path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          fill={variant === 'filled' ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.73 21a2 2 0 0 1-3.46 0"
          stroke={iconColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Notification dot */}
        <Circle
          cx="18"
          cy="6"
          r="3"
          fill={tailTrackerColors.contextual.emergencyRed}
        />
      </Svg>
    );
  },
};

// ====================================
// ICON SYSTEM UTILITIES
// ====================================

export const IconUtils = {
  // Get all available icons
  getAllIcons: () => ({
    pets: Object.keys(PetIcons),
    activities: Object.keys(ActivityIcons),
    locations: Object.keys(LocationIcons),
    emotions: Object.keys(EmotionIcons),
    system: Object.keys(SystemIcons),
  }),
  
  // Get icon by name and category
  getIcon: (category: string, name: string) => {
    const iconSets = {
      pets: PetIcons,
      activities: ActivityIcons,
      locations: LocationIcons,
      emotions: EmotionIcons,
      system: SystemIcons,
    };
    
    return iconSets[category]?.[name];
  },
  
  // Get emotional color for icon
  getEmotionalColor,
  
  // Create icon with specific emotion
  createEmotionalIcon: (IconComponent: React.ComponentType<IconProps>, emotion: IconProps['emotion']) => {
    return (props: Omit<IconProps, 'emotion'>) => (
      <IconComponent {...props} emotion={emotion} />
    );
  },
};

// ====================================
// ICON DESIGN SPECIFICATIONS
// ====================================

export const IconDesignSpecs = {
  // Size specifications
  sizes: {
    xs: 12,      // Tiny icons for badges
    sm: 16,      // Small icons for inputs
    md: 24,      // Standard size for most UI
    lg: 32,      // Large icons for emphasis
    xl: 48,      // Extra large for heroes
    xxl: 64,     // Massive for splash screens
  },
  
  // Stroke width guidelines
  strokeWidths: {
    thin: 1,     // Delicate, minimal
    normal: 2,   // Standard weight
    thick: 3,    // Bold emphasis
    heavy: 4,    // Maximum impact
  },
  
  // Grid system
  grid: {
    baseUnit: 24,        // 24x24 base grid
    padding: 2,          // 2px internal padding
    activeArea: 20,      // 20x20 active drawing area
    strokeAlignment: 'center', // Stroke alignment
  },
  
  // Accessibility guidelines
  accessibility: {
    minimumSize: 24,     // Minimum touch target
    colorContrast: 4.5,  // WCAG AA contrast ratio
    focusIndicator: 2,   // Focus ring width
    motionSafe: true,    // Respect reduced motion
  },
  
  // Export guidelines
  export: {
    formats: ['SVG', 'PNG', 'PDF'],
    sizes: [16, 24, 32, 48, 64, 128, 256],
    variants: ['outline', 'filled', 'duotone'],
    darkMode: true,      // Include dark mode variants
  },
};

// ====================================
// COMPLETE ICON LIBRARY EXPORT
// ====================================

export const TailTrackerIcons = {
  Pets: PetIcons,
  Activities: ActivityIcons,
  Locations: LocationIcons,
  Emotions: EmotionIcons,
  System: SystemIcons,
  Utils: IconUtils,
  Specs: IconDesignSpecs,
};

export default TailTrackerIcons;