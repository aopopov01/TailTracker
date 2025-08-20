# TailTracker Design System Style Guide

*Version 1.0 • Complete Implementation Guide for Pet-Centric Mobile Experience*

---

## 🐾 Design Philosophy

TailTracker's design system is built on the foundation that **every interaction should strengthen the emotional bond between pets and their humans**. Our design language combines:

- **Emotional Intelligence**: Colors, animations, and interactions that evoke trust, care, and joy
- **Intuitive Simplicity**: Complex features feel effortless through thoughtful UX
- **Premium Experience**: Every detail communicates quality and reliability
- **Accessibility First**: Inclusive design that works for all users and all pets

---

## 🎨 Visual Foundation

### Color System

Our color palette is psychologically designed to create feelings of trust, safety, and happiness in pet care contexts.

#### Primary Colors
```typescript
// Primary Brand Colors
const primaryColors = {
  // Main brand color - trustworthy blue
  brand: '#3B82F6',           // Primary actions, main brand
  brandLight: '#60A5FA',      // Hover states, secondary elements
  brandDark: '#1D4ED8',       // Active states, emphasis
  
  // Pet-themed accents
  loyal: '#8B5CF6',           // Loyalty rewards, premium features
  caring: '#06B6D4',          // Health tracking, medical info
  playful: '#F59E0B',         // Activities, play time
  gentle: '#10B981',          // Success states, positive feedback
}
```

#### Semantic Colors
```typescript
const semanticColors = {
  // Status colors with emotional context
  success: '#22C55E',         // Vaccinations up to date, healthy pet
  warning: '#F59E0B',         // Upcoming appointments, reminders
  error: '#EF4444',           // Emergency alerts, critical issues
  info: '#3B82F6',            // Tips, information, guidance
  
  // Pet status colors
  happy: '#22C55E',           // Pet is happy and healthy
  excited: '#F59E0B',         // High energy, playtime
  calm: '#06B6D4',            // Relaxed, content
  sleepy: '#8B5CF6',          // Rest time, quiet moments
  alert: '#EF4444',           // Attention needed, urgent
}
```

#### Neutral Colors
```typescript
const neutralColors = {
  // Text hierarchy
  text: {
    primary: '#111827',       // Main headings, important text
    secondary: '#374151',     // Body text, descriptions
    tertiary: '#6B7280',      // Supporting text, metadata
    quaternary: '#9CA3AF',    // Placeholder text, disabled states
  },
  
  // Background system
  background: {
    primary: '#FFFFFF',       // Main app background
    secondary: '#F9FAFB',     // Card backgrounds, sections
    tertiary: '#F3F4F6',      // Input backgrounds, subtle areas
    overlay: 'rgba(0,0,0,0.5)', // Modal overlays, dimmed areas
  },
  
  // Border system
  border: {
    subtle: '#F3F4F6',        // Hairline borders, dividers
    default: '#E5E7EB',       // Card borders, input borders
    strong: '#D1D5DB',        // Emphasized borders
    interactive: '#9CA3AF',   // Interactive element borders
  }
}
```

### Typography System

Our typography creates hierarchy while maintaining readability and emotional warmth.

#### Font Families
```typescript
const fontFamilies = {
  // iOS
  ios: {
    regular: 'SF Pro Display',
    bold: 'SF Pro Display',
    medium: 'SF Pro Display',
  },
  
  // Android
  android: {
    regular: 'Roboto',
    bold: 'Roboto',
    medium: 'Roboto',
  },
  
  // Monospace for technical data
  mono: {
    ios: 'SF Mono',
    android: 'Roboto Mono',
  }
}
```

#### Typography Scale
```typescript
const typography = {
  // Display text - Hero sections, major headings
  display: {
    large: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
    medium: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
    small: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  },
  
  // Headings - Section titles, card headers
  heading: {
    h1: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
    h2: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
    h4: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  },
  
  // Body text - Content, descriptions
  body: {
    large: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
    medium: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  },
  
  // UI text - Buttons, labels, captions
  ui: {
    button: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
    label: { fontSize: 14, lineHeight: 16, fontWeight: '500' },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
    overline: { fontSize: 10, lineHeight: 12, fontWeight: '600', textTransform: 'uppercase' },
  }
}
```

### Spacing System

Consistent spacing that creates visual rhythm and hierarchy.

```typescript
const spacing = {
  // Base spacing unit (4px)
  xs: 4,      // Micro spacing - icon padding, tight layouts
  sm: 8,      // Small spacing - compact elements
  md: 12,     // Medium spacing - comfortable padding
  lg: 16,     // Large spacing - section padding
  xl: 20,     // Extra large - major sections
  '2xl': 24,  // Card padding, comfortable layouts
  '3xl': 32,  // Page padding, major sections
  '4xl': 40,  // Large page sections
  '5xl': 48,  // Hero sections, major divisions
  '6xl': 64,  // Maximum spacing for emphasis
}
```

### Elevation System

Depth and hierarchy through shadows and elevation.

```typescript
const shadows = {
  // Card shadows
  card: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    }
  },
  
  // Modal shadows
  modal: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    }
  },
  
  // Button shadows
  button: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    }
  }
}
```

---

## 🧩 Component System

### Button Components

#### Primary Button
```tsx
// Usage Example
import { AnimatedButton } from '@/design-system/components/magic-ui';

<AnimatedButton 
  variant="shimmer"
  size="lg"
  onPress={handlePetRegistration}
>
  Register My Pet
</AnimatedButton>
```

**When to use**: Primary actions, main CTAs, important submissions
**Accessibility**: Minimum 44pt touch target, clear focus states
**Animation**: Subtle shimmer effect on idle, satisfying press feedback

#### Secondary Button
```tsx
<AnimatedButton 
  variant="pulsating"
  size="md"
  pulseColor="#06B6D4"
  onPress={handleQuickAction}
>
  Quick Check-in
</AnimatedButton>
```

**When to use**: Secondary actions, alternative options
**Visual hierarchy**: Less prominent than primary but still actionable

#### Pet Status Buttons
```tsx
// Happy pet status
<AnimatedButton 
  variant="rainbow"
  size="sm"
  style={{ backgroundColor: semanticColors.happy }}
>
  Pet is Happy! 🐾
</AnimatedButton>
```

### Text Components

#### Display Text with Animation
```tsx
import { TextReveal, TypingAnimation } from '@/design-system/components/magic-ui';

// Hero text that reveals on scroll
<TextReveal 
  animationType="slideUp"
  staggerDelay={100}
  style={typography.display.large}
>
  Welcome to TailTracker
</TextReveal>

// Typing animation for onboarding
<TypingAnimation
  text="Let's set up your pet's profile"
  duration={50}
  showCursor={true}
  style={typography.heading.h2}
/>
```

#### Gradient Text for Premium Features
```tsx
<AnimatedGradientText
  colors={['#8B5CF6', '#3B82F6', '#06B6D4']}
  speed={2}
  style={typography.heading.h1}
>
  Premium Pet Care
</AnimatedGradientText>
```

### Card Components

#### Pet Profile Card
```tsx
import { BlurFade } from '@/design-system/components/magic-ui';

<BlurFade delay={200} direction="up">
  <View style={cardStyles.petProfile}>
    <Image source={petPhoto} style={cardStyles.petImage} />
    <Text style={typography.heading.h3}>{petName}</Text>
    <Text style={typography.body.small}>{petBreed}</Text>
  </View>
</BlurFade>
```

#### Health Status Card
```tsx
<View style={[cardStyles.base, { borderLeftColor: semanticColors.success, borderLeftWidth: 4 }]}>
  <AnimatedCircularProgressBar
    value={healthScore}
    primaryColor={semanticColors.success}
    secondaryColor={neutralColors.border.subtle}
    size={80}
  />
  <Text style={typography.body.medium}>Health Score</Text>
</View>
```

### Progress Components

#### Vaccination Progress
```tsx
import { AnimatedCircularProgressBar, NumberTicker } from '@/design-system/components/magic-ui';

<View style={progressStyles.container}>
  <AnimatedCircularProgressBar
    value={vaccinationProgress}
    primaryColor={semanticColors.caring}
    showText={false}
    size={120}
  />
  <NumberTicker
    value={vaccinationProgress}
    suffix="%"
    style={typography.heading.h2}
  />
  <Text style={typography.body.small}>Vaccinations Complete</Text>
</View>
```

#### Activity Tracking
```tsx
<OrbitingCircles
  radius={60}
  iconSize={32}
  duration={6000}
>
  <ActivityIcon name="walk" />
  <ActivityIcon name="play" />
  <ActivityIcon name="feed" />
  <ActivityIcon name="sleep" />
</OrbitingCircles>
```

---

## 🎭 Animation Guidelines

### Motion Principles

Our animations follow three core principles:

1. **Purposeful**: Every animation serves a functional purpose
2. **Delightful**: Micro-interactions that create joy and surprise
3. **Respectful**: Respects user preferences and accessibility needs

### Animation Categories

#### Micro-interactions
```typescript
// Button press feedback
const buttonPress = {
  scale: 0.95,
  duration: 150,
  haptic: 'light'
}

// Success celebration
const successFeedback = {
  scale: [1, 1.1, 1],
  duration: 600,
  haptic: 'success'
}
```

#### Page Transitions
```typescript
// Standard navigation
const pageTransition = {
  duration: 400,
  easing: 'natural',
  type: 'slide'
}

// Modal presentation
const modalTransition = {
  duration: 500,
  easing: 'easeOut',
  type: 'slideUp'
}
```

#### Loading States
```typescript
// Pet-themed loading
const petLoadingAnimation = {
  type: 'pawPrint',
  staggerDelay: 200,
  colors: [primaryColors.playful, primaryColors.caring]
}
```

### Accessibility Considerations

#### Reduced Motion Support
```typescript
// Automatically adapts for users with motion sensitivity
const respectsReducedMotion = {
  standard: fadeInAnimation,
  reduced: simpleFadeAnimation,
  severe: instantAnimation
}
```

#### Screen Reader Support
```typescript
// Announce important state changes
const accessibleStateChange = {
  visualFeedback: subtleOpacityChange,
  screenReaderAnnouncement: "Pet profile updated successfully"
}
```

---

## 🎯 Usage Patterns

### Pet-Centric Design Patterns

#### Health Status Indicators
```tsx
// Visual health status with color coding
const HealthIndicator = ({ status }) => (
  <View style={[
    indicatorStyles.base,
    { backgroundColor: semanticColors[status] }
  ]}>
    <Text style={typography.ui.label}>
      {status === 'happy' ? '😊' : status === 'alert' ? '⚠️' : '😴'}
    </Text>
  </View>
);
```

#### Emergency Quick Actions
```tsx
// High-priority emergency button
<AnimatedButton
  variant="pulsating"
  pulseColor={semanticColors.error}
  size="lg"
  style={{ backgroundColor: semanticColors.error }}
  onPress={handleEmergency}
>
  🚨 Emergency Vet
</AnimatedButton>
```

#### Celebration Moments
```tsx
// Celebrate pet milestones
const CelebrationAnimation = () => (
  <BoxReveal boxColor={primaryColors.playful}>
    <Text style={typography.display.medium}>
      🎉 Happy Birthday, {petName}!
    </Text>
  </BoxReveal>
);
```

### Premium Feature Patterns

#### Premium Unlock Animation
```tsx
<ShinyText shimmerColor="rgba(139, 92, 246, 0.3)">
  <Text style={[typography.heading.h3, { color: primaryColors.loyal }]}>
    ✨ Premium Feature
  </Text>
</ShinyText>
```

#### Subscription Status
```tsx
<NumberTicker
  value={daysRemaining}
  prefix="Premium expires in "
  suffix=" days"
  style={typography.body.medium}
/>
```

---

## 📱 Platform Considerations

### iOS-Specific Guidelines

#### Native Feel
- Use SF Pro Display font family
- Implement iOS-style navigation patterns
- Leverage iOS haptic feedback system
- Follow iOS Human Interface Guidelines

#### iOS Components
```tsx
// iOS-style modal presentation
const iOSModal = {
  presentation: 'pageSheet',
  animation: 'slideUp',
  hapticFeedback: 'medium'
}
```

### Android-Specific Guidelines

#### Material Design Integration
- Use Roboto font family
- Implement Material Design elevation
- Follow Android accessibility guidelines
- Use Android-style navigation patterns

#### Android Components
```tsx
// Material Design floating action button
const androidFAB = {
  elevation: 6,
  rippleEffect: true,
  materialColors: true
}
```

---

## 🔧 Implementation Guidelines

### Component Development

#### File Structure
```
src/design-system/
├── components/
│   ├── magic-ui/           # Animated components
│   ├── buttons/            # Button variants
│   ├── cards/              # Card components
│   └── forms/              # Form components
├── animations/             # Animation system
├── core/                   # Design tokens
└── utils/                  # Helper utilities
```

#### Component Template
```tsx
interface ComponentProps {
  // Props with clear documentation
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  // Animation props
  animationDuration?: number;
  // Accessibility props
  accessibilityLabel?: string;
}

export const Component: React.FC<ComponentProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props
}) => {
  // Implementation with accessibility and animation support
};
```

### Testing Guidelines

#### Visual Regression Testing
- Test all component variants
- Verify animation states
- Check accessibility compliance
- Test platform-specific styling

#### Animation Testing
```typescript
// Test animation completion
const testAnimation = async () => {
  const component = render(<AnimatedComponent />);
  await waitFor(() => {
    expect(component.getByTestId('animated-element')).toHaveAnimatedStyle({
      opacity: 1
    });
  });
};
```

---

## 🎨 Design Tokens Reference

### Complete Token System
```typescript
export const designTokens = {
  colors: {
    primary: primaryColors,
    semantic: semanticColors,
    neutral: neutralColors,
  },
  typography,
  spacing,
  shadows,
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  zIndex: {
    base: 0,
    elevated: 10,
    overlay: 50,
    modal: 100,
    toast: 1000,
  }
};
```

---

## 📋 Component Checklist

When creating new components, ensure:

- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Animation**: Respectful motion design
- [ ] **Platform**: iOS and Android optimization
- [ ] **Performance**: 60fps animations
- [ ] **Testing**: Unit and visual regression tests
- [ ] **Documentation**: Clear usage examples
- [ ] **Types**: Full TypeScript support
- [ ] **Consistency**: Follows design system patterns

---

## 🚀 Getting Started

### Quick Implementation
```tsx
import React from 'react';
import { View } from 'react-native';
import { 
  AnimatedButton, 
  TextReveal, 
  AnimatedCircularProgressBar 
} from '@/design-system/components/magic-ui';

export const ExampleScreen = () => (
  <View style={{ padding: 20 }}>
    <TextReveal animationType="slideUp">
      Welcome to TailTracker
    </TextReveal>
    
    <AnimatedCircularProgressBar
      value={85}
      primaryColor="#3B82F6"
    />
    
    <AnimatedButton variant="shimmer" onPress={() => {}}>
      Get Started
    </AnimatedButton>
  </View>
);
```

### Advanced Usage
```tsx
// Custom themed component
const ThemedPetCard = styled(BlurFade).attrs({
  delay: 200,
  direction: 'up'
})`
  background-color: ${designTokens.colors.neutral.background.secondary};
  border-radius: ${designTokens.borderRadius.lg}px;
  padding: ${designTokens.spacing['2xl']}px;
`;
```

---

*This style guide is a living document that evolves with our design system. For questions or contributions, reach out to the design systems team.*

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete Implementation Ready