import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Brand colors extracted from logo
const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  darkNavy: '#0F1F2E',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
};

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <Animated.View
      entering={SlideInDown.delay(delay).springify()}
      style={styles.featureCard}
    >
      <LinearGradient
        colors={[COLORS.white, COLORS.softGray]}
        style={styles.featureCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.featureIconContainer}>
          <LinearGradient
            colors={[COLORS.lightCyan, COLORS.midCyan]}
            style={styles.featureIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon} size={24} color={COLORS.white} />
          </LinearGradient>
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function PremiumLandingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Logo entrance animation
    logoScale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoOpacity.value = withTiming(1, { duration: 800 });

    // Floating animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { translateY: floatY.value },
    ],
    opacity: logoOpacity.value,
  }));

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // If user is logged in, go to dashboard
      router.push('/(tabs)/dashboard');
    } else {
      // If not logged in, go to registration
      router.push('/auth/register');
    }
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Hero Section with Gradient Background */}
      <LinearGradient
        colors={[COLORS.lightCyan, COLORS.midCyan, COLORS.deepNavy]}
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Decorative Background Circles */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />

        {/* Logo Container */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../assets/images/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.logoShadow} />
        </Animated.View>

        {/* Hero Text */}
        <Animated.View entering={FadeIn.delay(500).duration(800)}>
          <Text style={styles.heroTitle}>TailTracker</Text>
          <Text style={styles.heroSubtitle}>
            Where Every Tail Has a Story
          </Text>
        </Animated.View>

        {/* Get Started Button - Moved to hero section */}
        <Animated.View 
          entering={FadeIn.delay(800).duration(600)}
          style={styles.heroCtaContainer}
        >
          <TouchableOpacity
            style={styles.heroCtaButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.white, 'rgba(255, 255, 255, 0.9)']}
              style={styles.heroCtaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroCtaText}>Get Started</Text>
              <View style={styles.heroCtaArrowContainer}>
                <Ionicons name="arrow-forward" size={18} color={COLORS.midCyan} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Sign In Link for existing users */}
          {!isAuthenticated && (
            <TouchableOpacity
              style={styles.heroSignInLink}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.heroSignInText}>Already have an account? </Text>
              <Text style={styles.heroSignInTextBold}>Sign In</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

      </LinearGradient>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Animated.Text
          entering={FadeIn.delay(1000).duration(600)}
          style={styles.featuresTitle}
        >
          Everything Your Pet Needs
        </Animated.Text>
        
        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="medical-outline"
            title="Digital Pet Passport"
            description="Store all your pet's important information in one secure place"
            delay={1200}
          />
          <FeatureCard
            icon="calendar-outline"
            title="Vaccination Tracking"
            description="Never miss a vaccination with smart reminders and records"
            delay={1350}
          />
          <FeatureCard
            icon="people-outline"
            title="Family Sharing"
            description="Keep everyone connected to your pet's wellbeing"
            delay={1500}
          />
          <FeatureCard
            icon="notifications-outline"
            title="Lost Pet Alerts"
            description="Community-powered alerts to help find lost pets quickly"
            delay={1650}
          />
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  heroSection: {
    height: SCREEN_HEIGHT * 0.65,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  // Decorative background circles for depth
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -100,
    left: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: 50,
    right: -50,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    top: 150,
    right: 30,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoShadow: {
    position: 'absolute',
    bottom: -10,
    width: 120,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 60,
    transform: [{ scaleX: 1 }],
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  heroCtaContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  heroCtaButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: 260,
  },
  heroCtaGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroCtaText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.deepNavy,
    letterSpacing: 0.5,
  },
  heroCtaArrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(77, 168, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSignInLink: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 8,
  },
  heroSignInText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heroSignInTextBold: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  featuresSection: {
    padding: 25,
    backgroundColor: COLORS.white,
  },
  featuresTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  featureCardGradient: {
    padding: 20,
    borderRadius: 20,
    minHeight: 160,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  featureIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
    lineHeight: 18,
  },
});