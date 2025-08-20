/**
 * TailTracker Screen Design Specifications
 * 
 * High-fidelity mockup specifications for all key screens that create
 * emotional connections and guide users through their pet care journey.
 * These designs represent the pinnacle of pet-centric UX.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import { tailTrackerColors } from '../core/colors';
import { tailTrackerTypography } from '../core/typography';
import { tailTrackerSpacing } from '../core/spacing';
import EmotionalButton from '../components/buttons/EmotionalButton';
import PetCard from '../components/cards/PetCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ====================================
// SPLASH SCREEN - MEMORABLE BRAND MOMENT
// ====================================

export const SplashScreenDesign = () => (
  <View style={styles.splashContainer}>
    <StatusBar barStyle="light-content" backgroundColor={tailTrackerColors.primary.trustBlue} />
    
    {/* Animated Background */}
    <ImageBackground
      source={{ uri: 'gradient-background' }}
      style={styles.splashBackground}
    >
      {/* Floating Pet Icons Animation */}
      <View style={styles.floatingIcons}>
        {/* Animated paw prints, hearts, and pet silhouettes */}
      </View>
      
      {/* Brand Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.brandTitle}>TailTracker</Text>
        <Text style={styles.brandTagline}>Where love meets technology</Text>
      </View>
      
      {/* Loading Animation */}
      <View style={styles.loadingContainer}>
        {/* Custom paw print loading animation */}
        <Text style={styles.loadingText}>Connecting hearts...</Text>
      </View>
    </ImageBackground>
  </View>
);

// ====================================
// ONBOARDING FLOW - EMOTIONAL BONDING EXPERIENCE
// ====================================

export const OnboardingWelcomeDesign = () => (
  <SafeAreaView style={styles.onboardingContainer}>
    <StatusBar barStyle="dark-content" />
    
    {/* Hero Section */}
    <View style={styles.heroSection}>
      <View style={styles.heroImageContainer}>
        {/* Large, warm illustration of pets and humans together */}
        <Text style={styles.heroEmoji}>🐕‍🦺💕👨‍👩‍👧‍👦</Text>
      </View>
      
      <Text style={styles.heroTitle}>
        Welcome to the family
      </Text>
      
      <Text style={styles.heroSubtitle}>
        TailTracker helps you keep your beloved pets safe, healthy, and happy. 
        Let's start by getting to know your furry family members.
      </Text>
    </View>
    
    {/* Trust Indicators */}
    <View style={styles.trustSection}>
      <View style={styles.trustItem}>
        <Text style={styles.trustIcon}>🔒</Text>
        <Text style={styles.trustText}>Privacy-first design</Text>
      </View>
      <View style={styles.trustItem}>
        <Text style={styles.trustIcon}>⚡</Text>
        <Text style={styles.trustText}>Real-time protection</Text>
      </View>
      <View style={styles.trustItem}>
        <Text style={styles.trustIcon}>❤️</Text>
        <Text style={styles.trustText}>Made with love</Text>
      </View>
    </View>
    
    {/* Action Buttons */}
    <View style={styles.actionSection}>
      <EmotionalButton
        title="Add My First Pet"
        emotion="love"
        variant="primary"
        size="large"
        fullWidth
        onPress={() => {}}
        hapticFeedback="heavy"
        animationIntensity="enthusiastic"
      />
      
      <EmotionalButton
        title="I Already Have TailTracker"
        emotion="trust"
        variant="ghost"
        size="medium"
        fullWidth
        onPress={() => {}}
        style={{ marginTop: tailTrackerSpacing.base.md }}
      />
    </View>
  </SafeAreaView>
);

// ====================================
// HOME DASHBOARD - PET-CENTRIC DESIGN
// ====================================

export const HomeDashboardDesign = () => (
  <SafeAreaView style={styles.homeContainer}>
    <StatusBar barStyle="dark-content" />
    
    {/* Header */}
    <View style={styles.homeHeader}>
      <View>
        <Text style={styles.greetingText}>Good morning</Text>
        <Text style={styles.userNameText}>Sarah</Text>
      </View>
      
      <View style={styles.headerActions}>
        {/* Notification bell with badge */}
        <View style={styles.notificationBell}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </View>
        
        {/* Profile image */}
        <View style={styles.profileImage}>
          <Text style={styles.profileEmoji}>👩</Text>
        </View>
      </View>
    </View>
    
    {/* Quick Status Cards */}
    <ScrollView style={styles.statusCardsContainer} horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.statusCard, { backgroundColor: tailTrackerColors.contextual.safeHaven }]}>
        <Text style={styles.statusIcon}>✅</Text>
        <Text style={styles.statusTitle}>All Safe</Text>
        <Text style={styles.statusSubtitle}>3 pets in safe zones</Text>
      </View>
      
      <View style={[styles.statusCard, { backgroundColor: tailTrackerColors.primary.playGreen }]}>
        <Text style={styles.statusIcon}>🏃‍♂️</Text>
        <Text style={styles.statusTitle}>Active</Text>
        <Text style={styles.statusSubtitle}>Max is playing</Text>
      </View>
      
      <View style={[styles.statusCard, { backgroundColor: tailTrackerColors.primary.heartCoral }]}>
        <Text style={styles.statusIcon}>❤️</Text>
        <Text style={styles.statusTitle}>Healthy</Text>
        <Text style={styles.statusSubtitle}>All pets feeling great</Text>
      </View>
    </ScrollView>
    
    {/* My Pets Section */}
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>My Pets</Text>
      <EmotionalButton
        title="Add Pet"
        emotion="joy"
        variant="ghost"
        size="small"
        onPress={() => {}}
      />
    </View>
    
    <ScrollView style={styles.petsContainer}>
      <PetCard
        pet={{
          id: '1',
          name: 'Max',
          breed: 'Golden Retriever',
          age: '3 years',
          type: 'dog',
          photo: { uri: 'max-photo' },
          mood: 'playful',
          location: 'Home - Backyard',
          healthStatus: 'excellent',
          activityLevel: 'active',
          batteryLevel: 85,
          isOnline: true,
        }}
        variant="standard"
        onPress={() => {}}
      />
      
      <PetCard
        pet={{
          id: '2',
          name: 'Luna',
          breed: 'Persian',
          age: '2 years',
          type: 'cat',
          photo: { uri: 'luna-photo' },
          mood: 'calm',
          location: 'Home - Living Room',
          healthStatus: 'good',
          activityLevel: 'resting',
          batteryLevel: 92,
          isOnline: true,
        }}
        variant="standard"
        onPress={() => {}}
      />
      
      <PetCard
        pet={{
          id: '3',
          name: 'Charlie',
          breed: 'Canary',
          age: '1 year',
          type: 'bird',
          photo: { uri: 'charlie-photo' },
          mood: 'happy',
          location: 'Home - Sunroom',
          healthStatus: 'excellent',
          activityLevel: 'moderate',
          batteryLevel: 78,
          isOnline: true,
        }}
        variant="standard"
        onPress={() => {}}
      />
    </ScrollView>
    
    {/* Quick Actions */}
    <View style={styles.quickActions}>
      <EmotionalButton
        title="Find Nearby"
        icon={<Text>📍</Text>}
        emotion="trust"
        variant="secondary"
        size="medium"
        onPress={() => {}}
        style={{ flex: 1, marginRight: tailTrackerSpacing.base.xs }}
      />
      
      <EmotionalButton
        title="Emergency"
        icon={<Text>🚨</Text>}
        emotion="urgent"
        variant="primary"
        size="medium"
        onPress={() => {}}
        style={{ flex: 1, marginLeft: tailTrackerSpacing.base.xs }}
      />
    </View>
  </SafeAreaView>
);

// ====================================
// PET PROFILE - MAGAZINE-QUALITY LAYOUT
// ====================================

export const PetProfileDesign = () => (
  <SafeAreaView style={styles.profileContainer}>
    <StatusBar barStyle="light-content" />
    
    {/* Hero Header */}
    <View style={styles.profileHero}>
      <ImageBackground
        source={{ uri: 'pet-background' }}
        style={styles.profileBackground}
        imageStyle={{ opacity: 0.3 }}
      >
        <View style={styles.profileHeader}>
          <EmotionalButton
            title="Back"
            icon={<Text>←</Text>}
            emotion="trust"
            variant="ghost"
            size="small"
            onPress={() => {}}
          />
          
          <EmotionalButton
            title="Edit"
            emotion="trust"
            variant="ghost"
            size="small"
            onPress={() => {}}
          />
        </View>
        
        <View style={styles.profileInfo}>
          <View style={styles.profileImageLarge}>
            {/* Large pet photo */}
          </View>
          
          <Text style={styles.profileName}>Max</Text>
          <Text style={styles.profileBreed}>Golden Retriever • 3 years old</Text>
          
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2,847</Text>
              <Text style={styles.statLabel}>Steps Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>Battery</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Safe</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
    
    {/* Content Sections */}
    <ScrollView style={styles.profileContent}>
      {/* Health Dashboard */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Health Dashboard</Text>
        <View style={styles.healthCards}>
          {/* Health metric cards */}
        </View>
      </View>
      
      {/* Activity Timeline */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.activityTimeline}>
          {/* Timeline items */}
        </View>
      </View>
      
      {/* Location History */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Location History</Text>
        <View style={styles.locationMap}>
          {/* Mini map with location dots */}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);

// ====================================
// LOST PET ALERT - URGENT BUT CALM
// ====================================

export const LostPetAlertDesign = () => (
  <SafeAreaView style={styles.alertContainer}>
    <StatusBar barStyle="light-content" backgroundColor={tailTrackerColors.contextual.emergencyRed} />
    
    {/* Alert Header */}
    <View style={styles.alertHeader}>
      <Text style={styles.alertIcon}>🚨</Text>
      <Text style={styles.alertTitle}>Max is Missing</Text>
      <Text style={styles.alertSubtitle}>
        Last seen 15 minutes ago at Central Park
      </Text>
    </View>
    
    {/* Pet Info */}
    <View style={styles.alertPetInfo}>
      <View style={styles.alertPetImage}>
        {/* Pet photo */}
      </View>
      <View style={styles.alertPetDetails}>
        <Text style={styles.alertPetName}>Max</Text>
        <Text style={styles.alertPetDescription}>
          Golden Retriever, 3 years old, wearing blue collar
        </Text>
      </View>
    </View>
    
    {/* Last Known Location */}
    <View style={styles.alertLocation}>
      <Text style={styles.alertLocationTitle}>Last Known Location</Text>
      <View style={styles.alertMap}>
        {/* Map showing last location */}
      </View>
      <Text style={styles.alertLocationText}>
        Central Park, near the pond • 2:45 PM
      </Text>
    </View>
    
    {/* Action Buttons */}
    <View style={styles.alertActions}>
      <EmotionalButton
        title="Notify Emergency Contacts"
        emotion="urgent"
        variant="primary"
        size="large"
        fullWidth
        onPress={() => {}}
        hapticFeedback="heavy"
      />
      
      <EmotionalButton
        title="Share on Social Media"
        emotion="trust"
        variant="secondary"
        size="large"
        fullWidth
        onPress={() => {}}
        style={{ marginTop: tailTrackerSpacing.base.md }}
      />
      
      <EmotionalButton
        title="Call Local Shelters"
        emotion="caring"
        variant="ghost"
        size="medium"
        fullWidth
        onPress={() => {}}
        style={{ marginTop: tailTrackerSpacing.base.sm }}
      />
    </View>
  </SafeAreaView>
);

// ====================================
// PREMIUM UPGRADE - VALUE-FOCUSED
// ====================================

export const PremiumUpgradeDesign = () => (
  <SafeAreaView style={styles.premiumContainer}>
    <StatusBar barStyle="dark-content" />
    
    {/* Header */}
    <View style={styles.premiumHeader}>
      <EmotionalButton
        title="×"
        emotion="trust"
        variant="ghost"
        size="small"
        onPress={() => {}}
      />
    </View>
    
    {/* Hero Section */}
    <View style={styles.premiumHero}>
      <Text style={styles.premiumIcon}>✨</Text>
      <Text style={styles.premiumTitle}>Unlock Premium Care</Text>
      <Text style={styles.premiumSubtitle}>
        Give your pets the ultimate protection and health monitoring they deserve
      </Text>
    </View>
    
    {/* Feature List */}
    <ScrollView style={styles.premiumFeatures}>
      <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>🎯</Text>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>Precision GPS Tracking</Text>
          <Text style={styles.featureDescription}>
            Real-time location updates every 30 seconds
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>🏥</Text>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>AI Health Insights</Text>
          <Text style={styles.featureDescription}>
            Early warning system for health issues
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>👥</Text>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>Family Sharing</Text>
          <Text style={styles.featureDescription}>
            Share access with family members
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>📱</Text>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>Smart Notifications</Text>
          <Text style={styles.featureDescription}>
            Intelligent alerts based on your pet's behavior
          </Text>
        </View>
      </View>
    </ScrollView>
    
    {/* Pricing */}
    <View style={styles.premiumPricing}>
      <Text style={styles.pricingText}>
        <Text style={styles.priceAmount}>€7.99</Text>
        <Text style={styles.pricePeriod}>/month</Text>
      </Text>
      <Text style={styles.pricingNote}>
        Start with 7-day free trial • Cancel anytime
      </Text>
    </View>
    
    {/* Action Button */}
    <View style={styles.premiumAction}>
      <EmotionalButton
        title="Start Free Trial"
        emotion="playful"
        variant="premium"
        size="hero"
        fullWidth
        onPress={() => {}}
        hapticFeedback="success"
        animationIntensity="enthusiastic"
      />
    </View>
  </SafeAreaView>
);

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: tailTrackerColors.primary.trustBlue,
  },
  
  splashBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  floatingIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: tailTrackerSpacing.base.xxxl,
  },
  
  brandTitle: {
    ...tailTrackerTypography.hero.brandHero,
    color: tailTrackerColors.light.textInverse,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  brandTagline: {
    ...tailTrackerTypography.body.bodyLarge,
    color: tailTrackerColors.light.textInverse,
    opacity: 0.9,
    marginTop: tailTrackerSpacing.base.sm,
  },
  
  loadingContainer: {
    alignItems: 'center',
  },
  
  loadingText: {
    ...tailTrackerTypography.body.body,
    color: tailTrackerColors.light.textInverse,
    opacity: 0.8,
  },
  
  // Onboarding Styles
  onboardingContainer: {
    flex: 1,
    backgroundColor: tailTrackerColors.light.background,
    padding: tailTrackerSpacing.semantic.containerMargin,
  },
  
  heroSection: {
    alignItems: 'center',
    paddingVertical: tailTrackerSpacing.base.xxxl,
  },
  
  heroImageContainer: {
    marginBottom: tailTrackerSpacing.base.xl,
  },
  
  heroEmoji: {
    fontSize: 60,
  },
  
  heroTitle: {
    ...tailTrackerTypography.hero.milestoneHero,
    color: tailTrackerColors.primary.trustBlue,
    textAlign: 'center',
    marginBottom: tailTrackerSpacing.base.md,
  },
  
  heroSubtitle: {
    ...tailTrackerTypography.body.bodyLarge,
    color: tailTrackerColors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: tailTrackerSpacing.base.xl,
  },
  
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  trustIcon: {
    fontSize: 24,
    marginBottom: tailTrackerSpacing.base.xs,
  },
  
  trustText: {
    ...tailTrackerTypography.body.bodySmall,
    color: tailTrackerColors.light.textSecondary,
    textAlign: 'center',
  },
  
  actionSection: {
    marginTop: 'auto',
    paddingBottom: tailTrackerSpacing.semantic.safeAreaBottom,
  },
  
  // Home Dashboard Styles
  homeContainer: {
    flex: 1,
    backgroundColor: tailTrackerColors.light.background,
  },
  
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tailTrackerSpacing.semantic.containerMargin,
    paddingTop: tailTrackerSpacing.semantic.safeAreaTop,
  },
  
  greetingText: {
    ...tailTrackerTypography.body.body,
    color: tailTrackerColors.light.textSecondary,
  },
  
  userNameText: {
    ...tailTrackerTypography.display.sectionHeader,
    color: tailTrackerColors.light.textPrimary,
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  notificationBell: {
    marginRight: tailTrackerSpacing.base.md,
    position: 'relative',
  },
  
  bellIcon: {
    fontSize: 24,
  },
  
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: tailTrackerColors.contextual.emergencyRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: tailTrackerColors.light.textInverse,
  },
  
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tailTrackerColors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  profileEmoji: {
    fontSize: 20,
  },
  
  statusCardsContainer: {
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
    marginBottom: tailTrackerSpacing.base.lg,
  },
  
  statusCard: {
    width: 120,
    height: 100,
    borderRadius: 16,
    padding: tailTrackerSpacing.base.md,
    marginRight: tailTrackerSpacing.base.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  statusIcon: {
    fontSize: 24,
    marginBottom: tailTrackerSpacing.base.xs,
  },
  
  statusTitle: {
    ...tailTrackerTypography.body.bodyEmphasized,
    color: tailTrackerColors.light.textInverse,
    textAlign: 'center',
  },
  
  statusSubtitle: {
    ...tailTrackerTypography.body.bodySmall,
    color: tailTrackerColors.light.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
    marginBottom: tailTrackerSpacing.base.md,
  },
  
  sectionTitle: {
    ...tailTrackerTypography.display.cardTitle,
    color: tailTrackerColors.light.textPrimary,
  },
  
  petsContainer: {
    flex: 1,
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
  },
  
  quickActions: {
    flexDirection: 'row',
    padding: tailTrackerSpacing.semantic.containerMargin,
    paddingBottom: tailTrackerSpacing.semantic.safeAreaBottom,
  },
  
  // Pet Profile Styles
  profileContainer: {
    flex: 1,
    backgroundColor: tailTrackerColors.light.background,
  },
  
  profileHero: {
    height: screenHeight * 0.4,
  },
  
  profileBackground: {
    flex: 1,
    backgroundColor: tailTrackerColors.primary.trustBlue,
  },
  
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: tailTrackerSpacing.semantic.containerMargin,
    paddingTop: tailTrackerSpacing.semantic.safeAreaTop,
  },
  
  profileInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  profileImageLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: tailTrackerColors.light.surfacePrimary,
    marginBottom: tailTrackerSpacing.base.md,
  },
  
  profileName: {
    ...tailTrackerTypography.hero.celebrationHero,
    color: tailTrackerColors.light.textInverse,
  },
  
  profileBreed: {
    ...tailTrackerTypography.body.bodyLarge,
    color: tailTrackerColors.light.textInverse,
    opacity: 0.9,
    marginBottom: tailTrackerSpacing.base.lg,
  },
  
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: tailTrackerSpacing.base.xl,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    ...tailTrackerTypography.utility.dataValue,
    color: tailTrackerColors.light.textInverse,
  },
  
  statLabel: {
    ...tailTrackerTypography.utility.dataLabel,
    color: tailTrackerColors.light.textInverse,
    opacity: 0.8,
  },
  
  profileContent: {
    flex: 1,
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
  },
  
  contentSection: {
    marginVertical: tailTrackerSpacing.base.lg,
  },
  
  healthCards: {
    // Health metric cards layout
  },
  
  activityTimeline: {
    // Activity timeline layout
  },
  
  locationMap: {
    height: 200,
    borderRadius: 12,
    backgroundColor: tailTrackerColors.light.surfaceSecondary,
  },
  
  // Lost Pet Alert Styles
  alertContainer: {
    flex: 1,
    backgroundColor: tailTrackerColors.contextual.emergencyRed,
  },
  
  alertHeader: {
    alignItems: 'center',
    paddingVertical: tailTrackerSpacing.base.xxxl,
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
  },
  
  alertIcon: {
    fontSize: 48,
    marginBottom: tailTrackerSpacing.base.md,
  },
  
  alertTitle: {
    ...tailTrackerTypography.hero.milestoneHero,
    color: tailTrackerColors.light.textInverse,
    textAlign: 'center',
  },
  
  alertSubtitle: {
    ...tailTrackerTypography.body.bodyLarge,
    color: tailTrackerColors.light.textInverse,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: tailTrackerSpacing.base.sm,
  },
  
  alertPetInfo: {
    flexDirection: 'row',
    backgroundColor: tailTrackerColors.light.background,
    marginHorizontal: tailTrackerSpacing.semantic.containerMargin,
    borderRadius: 16,
    padding: tailTrackerSpacing.base.lg,
    marginBottom: tailTrackerSpacing.base.lg,
  },
  
  alertPetImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tailTrackerColors.light.surfaceSecondary,
    marginRight: tailTrackerSpacing.base.md,
  },
  
  alertPetDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  
  alertPetName: {
    ...tailTrackerTypography.display.cardTitle,
    color: tailTrackerColors.light.textPrimary,
  },
  
  alertPetDescription: {
    ...tailTrackerTypography.body.body,
    color: tailTrackerColors.light.textSecondary,
    marginTop: tailTrackerSpacing.base.xs,
  },
  
  alertLocation: {
    backgroundColor: tailTrackerColors.light.background,
    marginHorizontal: tailTrackerSpacing.semantic.containerMargin,
    borderRadius: 16,
    padding: tailTrackerSpacing.base.lg,
    marginBottom: tailTrackerSpacing.base.lg,
  },
  
  alertLocationTitle: {
    ...tailTrackerTypography.display.subheader,
    color: tailTrackerColors.light.textPrimary,
    marginBottom: tailTrackerSpacing.base.md,
  },
  
  alertMap: {
    height: 200,
    borderRadius: 12,
    backgroundColor: tailTrackerColors.light.surfaceSecondary,
    marginBottom: tailTrackerSpacing.base.md,
  },
  
  alertLocationText: {
    ...tailTrackerTypography.body.body,
    color: tailTrackerColors.light.textSecondary,
  },
  
  alertActions: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
    paddingBottom: tailTrackerSpacing.semantic.safeAreaBottom,
  },
  
  // Premium Upgrade Styles
  premiumContainer: {
    flex: 1,
    backgroundColor: tailTrackerColors.light.background,
  },
  
  premiumHeader: {
    alignItems: 'flex-end',
    padding: tailTrackerSpacing.semantic.containerMargin,
    paddingTop: tailTrackerSpacing.semantic.safeAreaTop,
  },
  
  premiumHero: {
    alignItems: 'center',
    paddingVertical: tailTrackerSpacing.base.xxxl,
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
  },
  
  premiumIcon: {
    fontSize: 48,
    marginBottom: tailTrackerSpacing.base.md,
  },
  
  premiumTitle: {
    ...tailTrackerTypography.hero.milestoneHero,
    color: tailTrackerColors.contextual.mischievousGold,
    textAlign: 'center',
  },
  
  premiumSubtitle: {
    ...tailTrackerTypography.body.bodyLarge,
    color: tailTrackerColors.light.textSecondary,
    textAlign: 'center',
    marginTop: tailTrackerSpacing.base.md,
  },
  
  premiumFeatures: {
    flex: 1,
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tailTrackerSpacing.base.lg,
    borderBottomWidth: 1,
    borderBottomColor: tailTrackerColors.light.borderPrimary,
  },
  
  featureIcon: {
    fontSize: 32,
    marginRight: tailTrackerSpacing.base.lg,
  },
  
  featureText: {
    flex: 1,
  },
  
  featureTitle: {
    ...tailTrackerTypography.display.subheader,
    color: tailTrackerColors.light.textPrimary,
  },
  
  featureDescription: {
    ...tailTrackerTypography.body.body,
    color: tailTrackerColors.light.textSecondary,
    marginTop: tailTrackerSpacing.base.xs,
  },
  
  premiumPricing: {
    alignItems: 'center',
    paddingVertical: tailTrackerSpacing.base.xl,
  },
  
  pricingText: {
    alignItems: 'baseline',
  },
  
  priceAmount: {
    ...tailTrackerTypography.hero.celebrationHero,
    color: tailTrackerColors.contextual.mischievousGold,
  },
  
  pricePeriod: {
    ...tailTrackerTypography.body.bodyLarge,
    color: tailTrackerColors.light.textSecondary,
  },
  
  pricingNote: {
    ...tailTrackerTypography.body.bodySmall,
    color: tailTrackerColors.light.textSecondary,
    marginTop: tailTrackerSpacing.base.xs,
  },
  
  premiumAction: {
    paddingHorizontal: tailTrackerSpacing.semantic.containerMargin,
    paddingBottom: tailTrackerSpacing.semantic.safeAreaBottom,
  },
});

export {
  SplashScreenDesign,
  OnboardingWelcomeDesign,
  HomeDashboardDesign,
  PetProfileDesign,
  LostPetAlertDesign,
  PremiumUpgradeDesign,
};