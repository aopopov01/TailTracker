import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
};

interface BenefitCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  delay: number;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, delay }) => (
  <Animated.View
    entering={SlideInDown.delay(delay).springify()}
    style={styles.benefitCard}
  >
    <LinearGradient
      colors={[COLORS.lightCyan, COLORS.midCyan]}
      style={styles.benefitIconGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={icon} size={24} color={COLORS.white} />
    </LinearGradient>
    <Text style={styles.benefitText}>{title}</Text>
  </Animated.View>
);

export default function OnboardingWelcome() {
  const router = useRouter();
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Animate progress bar to show step 1 of 7
    progressWidth.value = withDelay(
      300,
      withTiming((SCREEN_WIDTH - 40) * (1 / 7), {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const handleGetStarted = () => {
    router.push('/onboarding/basic-info');
  };

  const handleSkip = () => {
    router.push('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]}>
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <Text style={styles.progressText}>Step 1 of 7</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.iconContainer}
        >
          <LinearGradient
            colors={[COLORS.lightCyan, COLORS.midCyan]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="paw" size={40} color={COLORS.white} />
            <View style={styles.heartIcon}>
              <Ionicons name="heart" size={16} color={COLORS.white} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeIn.delay(400).duration(600)}
          style={styles.title}
        >
          Let's meet your companion!
        </Animated.Text>

        {/* Description */}
        <Animated.Text
          entering={FadeIn.delay(500).duration(600)}
          style={styles.description}
        >
          We'll create both an official pet passport and a detailed care profile. 
          This takes about 3-5 minutes and you can always add more later.
        </Animated.Text>

        {/* Benefit Cards */}
        <View style={styles.benefitsContainer}>
          <BenefitCard
            icon="document-text-outline"
            title="Official Records"
            delay={600}
          />
          <BenefitCard
            icon="heart-outline"
            title="Health Tracking"
            delay={700}
          />
          <BenefitCard
            icon="notifications-outline"
            title="Care Reminders"
            delay={800}
          />
        </View>


        {/* Get Started Button - Moved down */}
        <Animated.View
          entering={FadeIn.delay(950).duration(600)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Skip Link */}
        <Animated.View entering={FadeIn.delay(1000).duration(600)}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>I'll set this up later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  progressContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.softGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  heartIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 35,
    paddingHorizontal: 10,
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  benefitCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  benefitIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  benefitText: {
    fontSize: 13,
    color: COLORS.deepNavy,
    textAlign: 'center',
    fontWeight: '500',
  },
  additionalInfo: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 15,
    fontWeight: '400',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  getStartedButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: 10,
    letterSpacing: 0.5,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textDecorationLine: 'underline',
  },
});