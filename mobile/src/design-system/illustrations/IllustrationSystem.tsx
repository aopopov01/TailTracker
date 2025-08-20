/**
 * TailTracker Emotional Illustration System
 * 
 * A comprehensive illustration system designed to create instant emotional connections
 * between pets and their humans. Every illustration is crafted to evoke love, trust,
 * joy, and the special bond that exists between pets and their families.
 * 
 * EMOTIONAL DESIGN PRINCIPLES:
 * 1. Instant Love - Every pet illustration should make users think "I want my pet to be this happy"
 * 2. Warm Approachability - Soft, rounded forms that feel huggable and safe
 * 3. Emotional Eyes - Large, expressive eyes that create deep connection
 * 4. Gentle Movement - Subtle animations that bring illustrations to life
 * 5. Contextual Warmth - Colors and expressions that match emotional contexts
 */

import React from 'react';
import { tailTrackerColors } from '../core/colors';

// ====================================
// ILLUSTRATION DESIGN TOKENS
// ====================================

/**
 * Emotional Color Palette for Illustrations
 * These colors are specifically chosen to evoke warmth, trust, and joy
 */
export const illustrationColors = {
  // Primary Pet Colors - Warm and Inviting
  petFur: {
    golden: '#F59E0B',      // Golden retriever warmth
    brown: '#92400E',       // Chocolate lab richness
    cream: '#FEF3C7',       // Gentle cream warmth
    black: '#374151',       // Soft black, not harsh
    white: '#F9FAFB',       // Pure but soft white
    gray: '#9CA3AF',        // Friendly gray
    orange: '#EA580C',      // Vibrant orange tabby
  },
  
  // Emotional Eye Colors - Windows to the Soul
  eyes: {
    warm: '#92400E',        // Warm brown eyes
    bright: '#1E3A8A',      // Bright blue eyes
    gentle: '#059669',      // Gentle green eyes
    loving: '#7C2D12',      // Deep loving brown
    playful: '#A855F7',     // Playful violet
  },
  
  // Background Environments - Context and Mood
  environments: {
    home: '#FEF3C7',        // Warm home environment
    park: '#DCFCE7',        // Fresh park green
    vet: '#F0F9FF',         // Clean, medical blue
    play: '#FBBF24',        // Energetic play yellow
    rest: '#F3E8FF',        // Peaceful rest purple
    safe: '#D1FAE5',        // Safe zone green
  },
  
  // Emotional Accents - Mood Enhancers
  accents: {
    heart: '#F87171',       // Love hearts
    star: '#FDE047',        // Achievement stars
    sparkle: '#C084FC',     // Magic sparkles
    bubble: '#67E8F9',      // Playful bubbles
    flower: '#FB7185',      // Gentle flowers
    bone: '#FEF3C7',        // Treat rewards
  },
  
  // State-Specific Colors
  states: {
    happy: '#22C55E',       // Joyful green
    excited: '#F59E0B',     // Excited orange
    calm: '#8B5CF6',        // Peaceful purple
    sleepy: '#64748B',      // Drowsy gray
    alert: '#EF4444',       // Alert red
    loving: '#EC4899',      // Loving pink
  },
} as const;

/**
 * Illustration Style Guidelines
 * Consistent styling rules for all TailTracker illustrations
 */
export const illustrationStyles = {
  // Line weights for different elements
  lineWeights: {
    delicate: 1,            // Delicate details
    standard: 2,            // Main outlines
    bold: 3,                // Emphasis lines
    heavy: 4,               // Strong elements
  },
  
  // Border radius for rounded, friendly shapes
  borderRadius: {
    subtle: 4,              // Slight rounding
    soft: 8,                // Comfortable rounding
    round: 16,              // Very round
    circle: '50%',          // Perfect circles
  },
  
  // Spacing within illustrations
  spacing: {
    tight: 4,               // Close elements
    cozy: 8,                // Comfortable spacing
    breathe: 16,            // Breathing room
    generous: 24,           // Generous spacing
  },
  
  // Shadow and depth
  shadows: {
    subtle: '0 1px 3px rgba(0, 0, 0, 0.12)',
    soft: '0 4px 6px rgba(0, 0, 0, 0.07)',
    warm: '0 8px 15px rgba(251, 191, 36, 0.15)',
    glow: '0 0 20px rgba(139, 92, 246, 0.3)',
  },
  
  // Animation properties
  animations: {
    gentle: {
      duration: '0.3s',
      easing: 'ease-out',
    },
    bounce: {
      duration: '0.5s',
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    float: {
      duration: '2s',
      easing: 'ease-in-out',
      iteration: 'infinite',
      alternate: true,
    },
  },
} as const;

// ====================================
// ILLUSTRATION COMPONENT SYSTEM
// ====================================

/**
 * Base Illustration Container
 * Provides consistent container for all illustrations
 */
interface IllustrationContainerProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  mood?: 'happy' | 'calm' | 'playful' | 'safe' | 'premium';
  animated?: boolean;
  children: React.ReactNode;
}

export const IllustrationContainer: React.FC<IllustrationContainerProps> = ({
  size = 'medium',
  mood = 'happy',
  animated = false,
  children
}) => {
  const sizes = {
    small: { width: 120, height: 120 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 },
    hero: { width: 400, height: 400 },
  };
  
  const moodBackgrounds = {
    happy: illustrationColors.environments.home,
    calm: illustrationColors.environments.rest,
    playful: illustrationColors.environments.play,
    safe: illustrationColors.environments.safe,
    premium: 'linear-gradient(135deg, #F59E0B 0%, #FDE047 50%, #F59E0B 100%)',
  };
  
  return (
    <div
      style={{
        ...sizes[size],
        background: moodBackgrounds[mood],
        borderRadius: illustrationStyles.borderRadius.round,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: illustrationStyles.shadows.soft,
        ...(animated && {
          animation: `gentle-float ${illustrationStyles.animations.float.duration} ${illustrationStyles.animations.float.easing} ${illustrationStyles.animations.float.iteration}`,
        }),
      }}
    >
      {children}
    </div>
  );
};

/**
 * Pet Eyes Component - The Soul of Every Illustration
 * Large, expressive eyes that create instant emotional connection
 */
interface PetEyesProps {
  emotion?: 'happy' | 'loving' | 'playful' | 'sleepy' | 'alert';
  size?: 'small' | 'medium' | 'large';
  color?: keyof typeof illustrationColors.eyes;
}

export const PetEyes: React.FC<PetEyesProps> = ({
  emotion = 'happy',
  size = 'medium',
  color = 'warm'
}) => {
  const eyeSizes = {
    small: { width: 12, height: 12 },
    medium: { width: 16, height: 16 },
    large: { width: 20, height: 20 },
  };
  
  const emotionShapes = {
    happy: '50%',           // Round, joyful eyes
    loving: '50% 50% 0 0',  // Heart-shaped loving eyes
    playful: '20px',        // Slightly angular playful eyes
    sleepy: '50% / 30%',    // Sleepy, half-closed eyes
    alert: '50%',           // Wide, alert round eyes
  };
  
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {/* Left Eye */}
      <div
        style={{
          ...eyeSizes[size],
          background: illustrationColors.eyes[color],
          borderRadius: emotionShapes[emotion],
          position: 'relative',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Eye shine for life and warmth */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '30%',
            height: '30%',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
          }}
        />
      </div>
      
      {/* Right Eye */}
      <div
        style={{
          ...eyeSizes[size],
          background: illustrationColors.eyes[color],
          borderRadius: emotionShapes[emotion],
          position: 'relative',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Eye shine for life and warmth */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '30%',
            height: '30%',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
          }}
        />
      </div>
    </div>
  );
};

/**
 * Emotional Accent Components
 * Small elements that enhance emotional impact
 */
export const HeartFloat: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = illustrationColors.accents.heart
}) => (
  <div
    style={{
      width: size,
      height: size,
      background: color,
      borderRadius: '50% 50% 0 0',
      transform: 'rotate(45deg)',
      position: 'relative',
      animation: `gentle-float 3s ease-in-out infinite alternate`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: -size/2,
        width: size,
        height: size,
        background: color,
        borderRadius: '50%',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: -size/2,
        left: 0,
        width: size,
        height: size,
        background: color,
        borderRadius: '50%',
      }}
    />
  </div>
);

export const SparkleEffect: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          background: illustrationColors.accents.sparkle,
          borderRadius: '50%',
          top: `${20 + i * 30}%`,
          left: `${10 + i * 35}%`,
          animation: `twinkle ${1 + i * 0.5}s ease-in-out infinite alternate`,
          boxShadow: `0 0 10px ${illustrationColors.accents.sparkle}`,
        }}
      />
    ))}
  </div>
);

// ====================================
// ILLUSTRATION USAGE GUIDELINES
// ====================================

/**
 * Illustration Usage Guidelines
 * 
 * EMOTIONAL CONTEXT GUIDELINES:
 * 
 * 1. ONBOARDING MOMENTS:
 *    - Use warm, golden colors (#F59E0B, #FEF3C7)
 *    - Large, welcoming eyes with happy emotion
 *    - Gentle floating animations
 *    - Heart accents for love and connection
 * 
 * 2. FEATURE EXPLANATIONS:
 *    - Use trustworthy blues (#1E3A8A, #3B82F6)
 *    - Alert but calm eye expressions
 *    - Subtle sparkle effects for premium feel
 *    - Clean, medical environments for health features
 * 
 * 3. SUCCESS CELEBRATIONS:
 *    - Bright, joyful colors (#22C55E, #FDE047)
 *    - Extremely happy eye expressions
 *    - Bounce animations
 *    - Multiple heart and star accents
 * 
 * 4. ERROR STATES:
 *    - Soft, comforting colors (avoid harsh reds)
 *    - Slightly sad but hopeful eye expressions
 *    - Gentle, reassuring animations
 *    - Minimal, calming accents
 * 
 * 5. EMPTY STATES:
 *    - Encouraging colors (#8B5CF6, #C084FC)
 *    - Curious, inviting eye expressions
 *    - Subtle breathing animations
 *    - Sparkle effects to suggest possibility
 * 
 * TECHNICAL IMPLEMENTATION:
 * 
 * 1. SVG Format:
 *    - All illustrations should be vector-based
 *    - Use semantic naming for easy theming
 *    - Include multiple size variants
 * 
 * 2. Animation Ready:
 *    - Layer illustrations for smooth animations
 *    - Use transform-origin for natural movement
 *    - Include pause states for accessibility
 * 
 * 3. Performance:
 *    - Optimize SVG paths for mobile performance
 *    - Use CSS animations over JavaScript when possible
 *    - Provide static fallbacks for low-end devices
 * 
 * 4. Accessibility:
 *    - Include meaningful alt text
 *    - Respect reduced motion preferences
 *    - Maintain contrast ratios for text over illustrations
 */

export const illustrationGuidelines = {
  // Color usage by context
  contextColors: {
    onboarding: [illustrationColors.petFur.golden, illustrationColors.environments.home],
    health: [illustrationColors.states.calm, illustrationColors.environments.vet],
    play: [illustrationColors.states.excited, illustrationColors.environments.park],
    safety: [illustrationColors.states.alert, illustrationColors.environments.safe],
    premium: [illustrationColors.petFur.golden, illustrationColors.accents.star],
  },
  
  // Animation usage
  animationContext: {
    onboarding: 'gentle',
    success: 'bounce', 
    loading: 'float',
    error: 'gentle',
    premium: 'glow',
  },
  
  // Eye emotion mapping
  eyeEmotions: {
    welcome: 'happy',
    success: 'loving',
    error: 'sleepy',
    loading: 'playful',
    premium: 'alert',
  },
} as const;

// ====================================
// CSS ANIMATIONS
// ====================================

export const illustrationCSS = `
@keyframes gentle-float {
  0% { transform: translateY(0px); }
  100% { transform: translateY(-8px); }
}

@keyframes twinkle {
  0% { opacity: 0.3; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1.2); }
}

@keyframes heart-beat {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes tail-wag {
  0% { transform: rotate(-15deg); }
  50% { transform: rotate(15deg); }
  100% { transform: rotate(-15deg); }
}

@keyframes eye-blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

/* Accessibility: Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

export default {
  IllustrationContainer,
  PetEyes,
  HeartFloat,
  SparkleEffect,
  illustrationColors,
  illustrationStyles,
  illustrationGuidelines,
  illustrationCSS,
};