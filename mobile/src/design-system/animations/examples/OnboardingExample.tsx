/**
 * TailTracker Onboarding Animation Example
 * 
 * Comprehensive example showing how to create an emotionally engaging
 * onboarding experience that builds trust and excitement about the app.
 * 
 * Features demonstrated:
 * - Progressive animation complexity (simple to delightful)
 * - Emotional story-telling through animation
 * - Achievement unlock celebrations
 * - Contextual micro-interactions
 * - Performance-optimized transitions
 * - Accessibility-aware animations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Pressable,
  StatusBar,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from 'expo-haptics';

// Import our animation systems
import {
  useHeartEyesAnimation,
  usePlayfulBounceAnimation,
  useTailWagAnimation,
} from '../emotionalAnimationSystem';
import {
  usePremiumButtonAnimation,
  useSuccessCelebration,
  usePersonalizedLoadingAnimation,
} from '../premiumMicroInteractions';
import {
  useEmotionalIntelligence,
  useContextualSuccessAnimation,
  useMoodResponsivePetAnimation,
} from '../emotionalIntelligenceHooks';
import { useAnimationProfiler } from '../performanceMonitoring';
import { tailTrackerMotions } from '../motionSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ====================================
// TYPES
// ====================================

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  illustration: string;
  buttonText: string;
  celebrationLevel?: 'minor' | 'moderate' | 'major' | 'milestone';
  emotionalContext: 'welcome' | 'discovery' | 'trust_building' | 'excitement' | 'completion';
}

// ====================================
// ONBOARDING STEPS DATA
// ====================================

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TailTracker! 🐾',
    subtitle: 'Your pet\'s happiness starts here',
    description: 'Join thousands of pet parents who trust TailTracker to keep their furry family safe and happy.',
    illustration: '🏠',
    buttonText: 'Get Started',
    celebrationLevel: 'minor',
    emotionalContext: 'welcome',
  },
  {
    id: 'safety',
    title: 'Keep Your Pet Safe 🛡️',
    subtitle: 'Real-time location tracking',
    description: 'Never worry about losing your pet again with our advanced GPS tracking and instant alerts.',
    illustration: '📍',
    buttonText: 'Sounds Great!',
    celebrationLevel: 'moderate',
    emotionalContext: 'trust_building',
  },
  {
    id: 'health',
    title: 'Monitor Their Health 💗',
    subtitle: 'Smart health insights',
    description: 'Track vital signs, activity levels, and get personalized health recommendations from our AI.',
    illustration: '🏥',
    buttonText: 'I Love This!',
    celebrationLevel: 'moderate',
    emotionalContext: 'discovery',
  },
  {
    id: 'community',
    title: 'Join the Pack 👥',
    subtitle: 'Connect with pet parents',
    description: 'Share moments, get advice, and celebrate milestones with a community that loves pets as much as you do.',
    illustration: '🤝',
    buttonText: 'Join Community',
    celebrationLevel: 'major',
    emotionalContext: 'excitement',
  },
  {
    id: 'premium',
    title: 'Unlock Premium Features 🌟',
    subtitle: 'The ultimate pet care experience',
    description: 'Get access to advanced analytics, veterinary consultations, and exclusive features.',
    illustration: '👑',
    buttonText: 'Start Free Trial',
    celebrationLevel: 'milestone',
    emotionalContext: 'completion',
  },
];

// ====================================
// ANIMATED ONBOARDING COMPONENT
// ====================================

export const AnimatedOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Performance monitoring
  const { startProfiling, stopProfiling } = useAnimationProfiler(
    'onboarding_flow',
    'high'
  );

  // Emotional intelligence
  const {
    userState,
    inferEmotionalState,
    getOptimalAnimationConfig,
  } = useEmotionalIntelligence();

  // Shared animation values
  const slideProgress = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);
  const illustrationScale = useSharedValue(0);
  const progressBarWidth = useSharedValue(0);
  const backgroundGradientProgress = useSharedValue(0);

  // Pet mascot animations
  const heartEyesAnimation = useHeartEyesAnimation();
  const { animatedStyle: bounceStyle, bounce } = usePlayfulBounceAnimation({
    emotion: 'excited',
    intensity: 'enthusiastic',
    hapticFeedback: true,
  });

  const { animatedStyle: tailWagStyle, startWagging } = useTailWagAnimation({
    emotion: 'happy',
    personality: 'playful',
    intensity: 'celebration',
    hapticFeedback: true,
  });

  // Premium button animation
  const {
    animatedStyle: buttonStyle,
    pressGesture
  } = usePremiumButtonAnimation(false, false, false, 'premium');

  // Success celebrations
  const {
    celebrate,
    animatedStyle: celebrationStyle,
    particleAnimatedStyle,
    heartAnimatedStyle,
  } = useSuccessCelebration();

  // Contextual success animation
  const {
    celebrate: contextualCelebrate,
    animatedStyle: contextualStyle,
  } = useContextualSuccessAnimation('achievement');

  // Mood-responsive pet animation
  const {
    animatedStyle: petMoodStyle,
    inferEmotionalState: inferPetEmotion,
  } = useMoodResponsivePetAnimation();

  // Loading animation for transitions
  const {
    animatedStyle: loadingStyle,
  } = usePersonalizedLoadingAnimation('processing');

  // ====================================
  // ANIMATION FUNCTIONS
  // ====================================

  const animateStepTransition = useCallback((direction: 'forward' | 'backward' = 'forward') => {
    setIsTransitioning(true);
    startProfiling();

    const config = getOptimalAnimationConfig();
    const duration = config.duration;

    // Slide out current content
    slideProgress.value = withTiming(direction === 'forward' ? -1 : 1, {
      duration: duration * 0.3,
      easing: tailTrackerMotions.easing.easeIn,
    });

    // Fade out elements
    titleOpacity.value = withTiming(0, { duration: duration * 0.2 });
    subtitleOpacity.value = withTiming(0, { duration: duration * 0.2 });
    descriptionOpacity.value = withTiming(0, { duration: duration * 0.2 });
    illustrationScale.value = withTiming(0, { duration: duration * 0.3 });

    setTimeout(() => {
      // Reset position and animate in new content
      slideProgress.value = direction === 'forward' ? 1 : -1;
      
      slideProgress.value = withTiming(0, {
        duration: duration * 0.4,
        easing: tailTrackerMotions.easing.easeOut,
      });

      // Staggered fade in
      titleOpacity.value = withDelay(50, withTiming(1, {
        duration: duration * 0.4,
        easing: tailTrackerMotions.easing.easeOut,
      }));

      subtitleOpacity.value = withDelay(150, withTiming(1, {
        duration: duration * 0.4,
        easing: tailTrackerMotions.easing.easeOut,
      }));

      descriptionOpacity.value = withDelay(250, withTiming(1, {
        duration: duration * 0.4,
        easing: tailTrackerMotions.easing.easeOut,
      }));

      illustrationScale.value = withDelay(100, withSpring(1, {
        damping: 15,
        stiffness: 200,
      }));

      setTimeout(() => {
        setIsTransitioning(false);
        stopProfiling();
      }, duration * 0.5);
    }, duration * 0.3);
  }, [currentStep, getOptimalAnimationConfig]);

  const animateProgressBar = useCallback(() => {
    const progress = (currentStep + 1) / ONBOARDING_STEPS.length;
    progressBarWidth.value = withSpring(progress, {
      damping: 20,
      stiffness: 150,
    });
  }, [currentStep]);

  const animateBackgroundGradient = useCallback(() => {
    const step = ONBOARDING_STEPS[currentStep];
    const gradientIndex = currentStep / (ONBOARDING_STEPS.length - 1);
    
    backgroundGradientProgress.value = withTiming(gradientIndex, {
      duration: tailTrackerMotions.durations.graceful,
      easing: tailTrackerMotions.easing.caring,
    });
  }, [currentStep]);

  // ====================================
  // INTERACTION HANDLERS
  // ====================================

  const handleNext = useCallback(() => {
    if (isTransitioning) return;

    const step = ONBOARDING_STEPS[currentStep];
    
    // Add to completed steps
    setCompletedSteps(prev => [...prev, step.id]);

    // Infer emotional state based on step context
    switch (step.emotionalContext) {
      case 'welcome':
        inferEmotionalState('discovery');
        break;
      case 'discovery':
        inferEmotionalState('discovery');
        inferPetEmotion('discovery');
        break;
      case 'trust_building':
        inferEmotionalState('routine');
        break;
      case 'excitement':
        inferEmotionalState('success');
        inferPetEmotion('success');
        break;
      case 'completion':
        inferEmotionalState('success');
        inferPetEmotion('success');
        break;
    }

    // Trigger appropriate celebration
    if (step.celebrationLevel) {
      switch (step.celebrationLevel) {
        case 'minor':
          contextualCelebrate();
          break;
        case 'moderate':
          celebrate('achievement');
          bounce();
          break;
        case 'major':
          celebrate('milestone');
          heartEyesAnimation.showHeartEyes();
          startWagging();
          break;
        case 'milestone':
          celebrate('major_success');
          heartEyesAnimation.showHeartEyes();
          startWagging();
          bounce();
          break;
      }
    }

    // Move to next step or complete onboarding
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      animateStepTransition('forward');
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        animateProgressBar();
        animateBackgroundGradient();
      }, 300);
    } else {
      // Complete onboarding
      handleComplete();
    }
  }, [currentStep, isTransitioning, animateStepTransition]);

  const handlePrevious = useCallback(() => {
    if (isTransitioning || currentStep === 0) return;

    animateStepTransition('backward');
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      animateProgressBar();
      animateBackgroundGradient();
    }, 300);
  }, [currentStep, isTransitioning, animateStepTransition]);

  const handleComplete = useCallback(() => {
    // Final celebration
    celebrate('major_success');
    heartEyesAnimation.showHeartEyes();
    
    // Navigate to main app (in real implementation)
    setTimeout(() => {
      console.log('Onboarding completed! Navigate to main app.');
    }, 2000);
  }, [celebrate, heartEyesAnimation]);

  // ====================================
  // INITIALIZATION
  // ====================================

  useEffect(() => {
    // Initial animation
    setTimeout(() => {
      titleOpacity.value = withDelay(200, withTiming(1, {
        duration: tailTrackerMotions.durations.graceful,
        easing: tailTrackerMotions.easing.caring,
      }));

      subtitleOpacity.value = withDelay(400, withTiming(1, {
        duration: tailTrackerMotions.durations.graceful,
        easing: tailTrackerMotions.easing.caring,
      }));

      descriptionOpacity.value = withDelay(600, withTiming(1, {
        duration: tailTrackerMotions.durations.graceful,
        easing: tailTrackerMotions.easing.caring,
      }));

      illustrationScale.value = withDelay(300, withSpring(1, {
        damping: 15,
        stiffness: 200,
      }));

      animateProgressBar();
      animateBackgroundGradient();
    }, 100);
  }, []);

  // ====================================
  // ANIMATED STYLES
  // ====================================

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          slideProgress.value,
          [-1, 0, 1],
          [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [
      {
        translateY: interpolate(
          titleOpacity.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [
      {
        translateY: interpolate(
          subtitleOpacity.value,
          [0, 1],
          [15, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const descriptionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [
      {
        translateY: interpolate(
          descriptionOpacity.value,
          [0, 1],
          [10, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const illustrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: illustrationScale.value }],
  }));

  const progressBarAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value * 100}%`,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const colors = [
      ['#667eea', '#764ba2'], // Purple gradient
      ['#f093fb', '#f5576c'], // Pink gradient
      ['#4facfe', '#00f2fe'], // Blue gradient
      ['#43e97b', '#38f9d7'], // Green gradient
      ['#ffecd2', '#fcb69f'], // Orange gradient
    ];

    const colorIndex = Math.floor(backgroundGradientProgress.value * (colors.length - 1));
    const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
    
    return {
      // This would need proper gradient interpolation in a real implementation
      opacity: 1,
    };
  });

  // ====================================
  // RENDER
  // ====================================

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated background */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.background}
      />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, progressBarAnimatedStyle]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} of {ONBOARDING_STEPS.length}
        </Text>
      </View>

      {/* Pet mascot */}
      <Animated.View style={[styles.mascotContainer, petMoodStyle, bounceStyle]}>
        <Animated.Text style={[styles.mascotEmoji, tailWagStyle]}>🐕</Animated.Text>
        <Animated.View style={[styles.heartEyesContainer, heartEyesAnimation.animatedStyle]}>
          <Text style={styles.heartEyes}>😍</Text>
        </Animated.View>
      </Animated.View>

      {/* Main content */}
      <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
        {/* Illustration */}
        <Animated.View style={[styles.illustrationContainer, illustrationAnimatedStyle]}>
          <Text style={styles.illustration}>{step.illustration}</Text>
          
          {/* Celebration overlays */}
          <Animated.View style={[styles.celebrationOverlay, celebrationStyle]}>
            <Animated.View style={[styles.particleContainer, particleAnimatedStyle]}>
              <Text style={styles.particle}>✨</Text>
              <Text style={styles.particle}>🎉</Text>
              <Text style={styles.particle}>⭐</Text>
            </Animated.View>
          </Animated.View>
          
          <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
            <Text style={styles.celebrationHeart}>❤️</Text>
          </Animated.View>
        </Animated.View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.title, titleAnimatedStyle]}>
            {step.title}
          </Animated.Text>
          
          <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
            {step.subtitle}
          </Animated.Text>
          
          <Animated.Text style={[styles.description, descriptionAnimatedStyle]}>
            {step.description}
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <Pressable style={styles.backButton} onPress={handlePrevious}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
        )}
        
        <Animated.View style={[styles.nextButton, buttonStyle, contextualStyle]}>
          <Pressable style={styles.nextButtonPressable} onPress={handleNext}>
            <Text style={styles.nextButtonText}>{step.buttonText}</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Loading overlay for transitions */}
      {isTransitioning && (
        <Animated.View style={[styles.loadingOverlay, loadingStyle]}>
          <Text style={styles.loadingEmoji}>🐾</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },

  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginRight: 16,
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  mascotContainer: {
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
  },

  mascotEmoji: {
    fontSize: 40,
  },

  heartEyesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heartEyes: {
    fontSize: 50,
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },

  illustration: {
    fontSize: 80,
    marginBottom: 20,
  },

  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  particleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 200,
  },

  particle: {
    fontSize: 24,
  },

  heartContainer: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
    width: '100%',
  },

  celebrationHeart: {
    fontSize: 30,
  },

  textContainer: {
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },

  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },

  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },

  backButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },

  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  nextButtonPressable: {
    alignItems: 'center',
  },

  nextButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingEmoji: {
    fontSize: 30,
  },
});

export default AnimatedOnboarding;