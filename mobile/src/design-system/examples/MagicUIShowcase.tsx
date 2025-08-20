/**
 * Magic UI Showcase - Interactive Examples
 * 
 * Demonstrates all Magic UI components with real TailTracker use cases
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import {
  AnimatedButton,
  TypingAnimation,
  AnimatedGradientText,
  TextReveal,
  ShinyText,
  BoxReveal,
  AnimatedCircularProgressBar,
  NumberTicker,
  OrbitingCircles,
  BlurFade,
  ScrollProgress,
} from '../components/magic-ui';

const MagicUIShowcase: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('buttons');
  const [petHealthScore, setPetHealthScore] = useState(85);
  const [vaccinationProgress, setVaccinationProgress] = useState(75);
  const [scrollProgress, setScrollProgress] = useState(0);

  const demoSections = [
    { id: 'buttons', title: '🔘 Animated Buttons', icon: '🎯' },
    { id: 'text', title: '📝 Text Animations', icon: '✨' },
    { id: 'progress', title: '📊 Progress & Loading', icon: '🔄' },
    { id: 'interactions', title: '🎭 Micro-interactions', icon: '💫' },
  ];

  const renderButtonDemo = () => (
    <View style={styles.demoSection}>
      <Text style={styles.sectionTitle}>Button Variants</Text>
      
      {/* Primary Action Button */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Shimmer Button - Primary Actions</Text>
        <AnimatedButton
          variant="shimmer"
          size="lg"
          onPress={() => console.log('Register pet pressed')}
        >
          Register My Pet 🐾
        </AnimatedButton>
      </View>

      {/* Pulsating Button */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Pulsating Button - Urgent Actions</Text>
        <AnimatedButton
          variant="pulsating"
          size="md"
          pulseColor="#EF4444"
          onPress={() => console.log('Emergency pressed')}
        >
          🚨 Emergency Vet
        </AnimatedButton>
      </View>

      {/* Rainbow Button */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Rainbow Button - Premium Features</Text>
        <AnimatedButton
          variant="rainbow"
          size="md"
          onPress={() => console.log('Premium pressed')}
        >
          ✨ Upgrade to Premium
        </AnimatedButton>
      </View>

      {/* Shine Button */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Shine Button - Success States</Text>
        <AnimatedButton
          variant="shine"
          size="sm"
          onPress={() => console.log('Achievement unlocked')}
        >
          🏆 Achievement Unlocked!
        </AnimatedButton>
      </View>
    </View>
  );

  const renderTextDemo = () => (
    <View style={styles.demoSection}>
      <Text style={styles.sectionTitle}>Text Animations</Text>

      {/* Typing Animation */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Typing Animation - Onboarding</Text>
        <TypingAnimation
          text="Welcome to TailTracker! Let's set up your pet's profile."
          duration={80}
          showCursor={true}
          style={styles.typingText}
        />
      </View>

      {/* Gradient Text */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Gradient Text - Premium Features</Text>
        <AnimatedGradientText
          colors={['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981']}
          speed={2}
          style={styles.gradientText}
        >
          Premium Pet Care
        </AnimatedGradientText>
      </View>

      {/* Text Reveal */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Text Reveal - Hero Content</Text>
        <TextReveal
          animationType="slideUp"
          staggerDelay={100}
          style={styles.revealText}
        >
          Your pet deserves the best care
        </TextReveal>
      </View>

      {/* Shiny Text */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Shiny Text - Highlights</Text>
        <ShinyText
          shimmerColor="rgba(59, 130, 246, 0.4)"
          style={styles.shinyText}
        >
          🌟 Featured Pet of the Month
        </ShinyText>
      </View>

      {/* Box Reveal */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Box Reveal - Announcements</Text>
        <BoxReveal
          boxColor="#3B82F6"
          duration={600}
          delay={200}
        >
          <Text style={styles.boxRevealText}>
            🎉 Max completed all vaccinations!
          </Text>
        </BoxReveal>
      </View>
    </View>
  );

  const renderProgressDemo = () => (
    <View style={styles.demoSection}>
      <Text style={styles.sectionTitle}>Progress & Loading</Text>

      {/* Circular Progress */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Health Score Progress</Text>
        <View style={styles.progressRow}>
          <AnimatedCircularProgressBar
            value={petHealthScore}
            primaryColor="#22C55E"
            secondaryColor="#E5E7EB"
            size={100}
            showText={true}
            textColor="#374151"
          />
          <View style={styles.progressControls}>
            <Pressable
              style={styles.controlButton}
              onPress={() => setPetHealthScore(Math.max(0, petHealthScore - 10))}
            >
              <Text>-10</Text>
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={() => setPetHealthScore(Math.min(100, petHealthScore + 10))}
            >
              <Text>+10</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Number Ticker */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Vaccination Progress</Text>
        <NumberTicker
          value={vaccinationProgress}
          startValue={0}
          duration={1500}
          suffix="%"
          style={styles.numberTicker}
        />
        <Text style={styles.tickerLabel}>Vaccinations Complete</Text>
      </View>

      {/* Orbiting Circles */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Activity Tracking</Text>
        <OrbitingCircles
          radius={60}
          duration={8000}
          iconSize={32}
        >
          <View style={[styles.orbitIcon, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.orbitEmoji}>🚶</Text>
          </View>
          <View style={[styles.orbitIcon, { backgroundColor: '#22C55E' }]}>
            <Text style={styles.orbitEmoji}>🎾</Text>
          </View>
          <View style={[styles.orbitIcon, { backgroundColor: '#3B82F6' }]}>
            <Text style={styles.orbitEmoji}>🍽️</Text>
          </View>
          <View style={[styles.orbitIcon, { backgroundColor: '#8B5CF6' }]}>
            <Text style={styles.orbitEmoji}>😴</Text>
          </View>
        </OrbitingCircles>
        <Text style={styles.orbitLabel}>Daily Activities</Text>
      </View>

      {/* Scroll Progress */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Scroll Progress Indicator</Text>
        <ScrollProgress
          progress={scrollProgress}
          height={6}
          colors={['#3B82F6', '#06B6D4', '#10B981']}
          style={styles.scrollProgress}
        />
        <View style={styles.progressControls}>
          <Pressable
            style={styles.controlButton}
            onPress={() => setScrollProgress(Math.max(0, scrollProgress - 0.2))}
          >
            <Text>← Back</Text>
          </Pressable>
          <Pressable
            style={styles.controlButton}
            onPress={() => setScrollProgress(Math.min(1, scrollProgress + 0.2))}
          >
            <Text>Forward →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderInteractionsDemo = () => (
    <View style={styles.demoSection}>
      <Text style={styles.sectionTitle}>Micro-interactions</Text>

      {/* Blur Fade Components */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Blur Fade - Staggered Entry</Text>
        <BlurFade delay={0} direction="up">
          <View style={styles.fadeCard}>
            <Text style={styles.fadeCardText}>🐕 Buddy's Profile</Text>
          </View>
        </BlurFade>
        <BlurFade delay={200} direction="up">
          <View style={styles.fadeCard}>
            <Text style={styles.fadeCardText}>🐱 Whiskers' Health</Text>
          </View>
        </BlurFade>
        <BlurFade delay={400} direction="up">
          <View style={styles.fadeCard}>
            <Text style={styles.fadeCardText}>🐦 Tweety's Activities</Text>
          </View>
        </BlurFade>
      </View>

      {/* Combined Animations */}
      <View style={styles.demoItem}>
        <Text style={styles.itemLabel}>Combined Effects - Achievement</Text>
        <View style={styles.achievementContainer}>
          <BlurFade delay={100} direction="up">
            <AnimatedGradientText
              colors={['#F59E0B', '#EF4444', '#8B5CF6']}
              style={styles.achievementText}
            >
              🏆 Level Up!
            </AnimatedGradientText>
          </BlurFade>
          <NumberTicker
            value={25}
            startValue={0}
            prefix="Level "
            duration={2000}
            style={styles.levelText}
          />
        </View>
      </View>
    </View>
  );

  const renderCurrentDemo = () => {
    switch (selectedDemo) {
      case 'buttons':
        return renderButtonDemo();
      case 'text':
        return renderTextDemo();
      case 'progress':
        return renderProgressDemo();
      case 'interactions':
        return renderInteractionsDemo();
      default:
        return renderButtonDemo();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Magic UI Showcase</Text>
        <Text style={styles.headerSubtitle}>
          Interactive examples for TailTracker
        </Text>
      </View>

      {/* Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navigation}
        contentContainerStyle={styles.navigationContent}
      >
        {demoSections.map((section) => (
          <Pressable
            key={section.id}
            style={[
              styles.navItem,
              selectedDemo === section.id && styles.navItemActive,
            ]}
            onPress={() => setSelectedDemo(section.id)}
          >
            <Text style={styles.navIcon}>{section.icon}</Text>
            <Text
              style={[
                styles.navText,
                selectedDemo === section.id && styles.navTextActive,
              ]}
            >
              {section.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          const progress = contentOffset.y / (contentSize.height - layoutMeasurement.height);
          setScrollProgress(Math.min(Math.max(progress, 0), 1));
        }}
        scrollEventThrottle={16}
      >
        {renderCurrentDemo()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  navigation: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navigationContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    minWidth: 100,
  },
  navItemActive: {
    backgroundColor: '#3B82F6',
  },
  navIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  navTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  demoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  demoItem: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typingText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  gradientText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  revealText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  shinyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
  },
  boxRevealText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    padding: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  numberTicker: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'center',
  },
  tickerLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  orbitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitEmoji: {
    fontSize: 16,
  },
  orbitLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  scrollProgress: {
    borderRadius: 3,
    marginBottom: 16,
  },
  fadeCard: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  fadeCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  achievementContainer: {
    alignItems: 'center',
    padding: 20,
  },
  achievementText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  levelText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
});

export default MagicUIShowcase;