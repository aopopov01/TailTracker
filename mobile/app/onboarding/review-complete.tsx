import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePetProfile } from '../../contexts/PetProfileContext';
import { databaseService } from '../../services/database';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTailTrackerModal } from '../../src/hooks/useTailTrackerModal';
import { TailTrackerModal } from '../../src/components/UI/TailTrackerModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  SlideInDown,
  SlideInUp,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
  lightGray: '#E2E8F0',
  lightGreen: '#F0FDF4',
  green: '#16A34A',
};

interface ProgressStepProps {
  stepNumber: number;
  title: string;
  completed: boolean;
  delay: number;
  icon: keyof typeof Ionicons.glyphMap;
}

const ProgressStep: React.FC<ProgressStepProps> = ({
  stepNumber,
  title,
  completed,
  delay,
  icon,
}) => {
  const scale = useSharedValue(0.8);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
      })
    );

    if (completed) {
      checkScale.value = withDelay(
        delay + 200,
        withSequence(
          withTiming(1.2, { duration: 200 }),
          withTiming(1, { duration: 100 })
        )
      );
    }
  }, [completed, delay]);

  const stepStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <Animated.View style={[styles.progressStep, stepStyle]}>
      <View style={styles.progressStepContent}>
        <View style={[
          styles.progressStepCircle,
          { backgroundColor: completed ? COLORS.green : COLORS.lightGray }
        ]}>
          {completed ? (
            <Animated.View style={checkStyle}>
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
            </Animated.View>
          ) : (
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.progressStepIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={icon} size={14} color={COLORS.white} />
            </LinearGradient>
          )}
        </View>
        <Text style={[
          styles.progressStepText,
          { color: completed ? COLORS.deepNavy : COLORS.mediumGray }
        ]}>
          {title}
        </Text>
      </View>
    </Animated.View>
  );
};


function ReviewCompleteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { modalConfig, showModal, hideModal, showError, showSuccess } = useTailTrackerModal();
  const { profile, resetProfile } = usePetProfile();
  const [isCreating, setIsCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const progressWidth = useSharedValue(0);
  const celebrationScale = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);

  const completedSteps = [
    { id: 1, title: 'Welcome', icon: 'paw' as keyof typeof Ionicons.glyphMap },
    { id: 2, title: 'Basic Info', icon: 'information-circle' as keyof typeof Ionicons.glyphMap },
    { id: 3, title: 'Physical Details', icon: 'resize' as keyof typeof Ionicons.glyphMap },
    { id: 4, title: 'Official Records', icon: 'document-text' as keyof typeof Ionicons.glyphMap },
    { id: 5, title: 'Health Profile', icon: 'heart' as keyof typeof Ionicons.glyphMap },
    { id: 6, title: 'Personality & Care', icon: 'happy' as keyof typeof Ionicons.glyphMap },
    { id: 7, title: 'Complete!', icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap },
  ];

  useEffect(() => {
    // Animate progress bar to 100%
    progressWidth.value = withDelay(
      300,
      withTiming(SCREEN_WIDTH - 40, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );

    // Celebration animation
    celebrationScale.value = withDelay(
      2000,
      withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1, { duration: 200 })
      )
    );

    // Continuous sparkle rotation
    sparkleRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const handleCreateProfile = async () => {
    setIsCreating(true);
    
    try {
      // Save pet profile to database
      const petId = await databaseService.savePetProfile(profile, user?.id || 0);
      
      if (petId) {
        // Reset the profile context for next use
        resetProfile();
        
        showModal({
          title: '🎉 Profile Created!',
          message: `${profile.name || 'Your pet'}\'s profile has been successfully created. Welcome to TailTracker!`,
          type: 'success',
          icon: 'checkmark-circle',
          actions: [
            {
              text: 'Get Started',
              style: 'primary',
              onPress: () => {
                hideModal();
                setIsCreating(false);
                router.push('/(tabs)/dashboard');
              }
            }
          ],
          showCloseButton: false
        });
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving pet profile:', error);
      setIsCreating(false);
      showError(
        'Error',
        'Failed to create profile. Please try again.',
        'alert-circle'
      );
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const navigateToEdit = (screen: string) => {
    setShowEditModal(false);
    // Wait for modal to close before navigating
    setTimeout(() => {
      router.push(screen as any);
    }, 300);
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]}>
            <LinearGradient
              colors={[COLORS.green, '#15803D']}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <Text style={styles.progressText}>Step 7 of 7 - Complete!</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.header}
        >
          <Animated.View style={[styles.celebrationIconContainer, celebrationStyle]}>
            <LinearGradient
              colors={[COLORS.green, '#15803D']}
              style={styles.celebrationIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark-circle" size={40} color={COLORS.white} />
              <Animated.View style={[styles.sparkleIcon, sparkleStyle]}>
                <Ionicons name="sparkles" size={20} color={COLORS.white} />
              </Animated.View>
            </LinearGradient>
          </Animated.View>
          <Text style={styles.title}>Profile Complete!</Text>
          <Text style={styles.subtitle}>
            Great job! You've created a comprehensive profile for your pet.
          </Text>
        </Animated.View>

        {/* Progress Steps */}
        <Animated.View
          entering={FadeIn.delay(800).duration(600)}
          style={styles.progressStepsContainer}
        >
          <Text style={styles.progressStepsTitle}>Your Journey</Text>
          <View style={styles.progressStepsGrid}>
            {completedSteps.map((step, index) => (
              <ProgressStep
                key={step.id}
                stepNumber={step.id}
                title={step.title}
                completed={true}
                icon={step.icon}
                delay={1000 + (index * 100)}
              />
            ))}
          </View>
        </Animated.View>


        {/* What's Next */}
        <Animated.View
          entering={SlideInDown.delay(1800).springify()}
          style={styles.whatsNextContainer}
        >
          <LinearGradient
            colors={[COLORS.softGray, COLORS.white]}
            style={styles.whatsNextGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.whatsNextHeader}>
              <View style={styles.whatsNextIcon}>
                <LinearGradient
                  colors={[COLORS.lightCyan, COLORS.midCyan]}
                  style={styles.whatsNextIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="rocket" size={24} color={COLORS.white} />
                </LinearGradient>
              </View>
              <Text style={styles.whatsNextTitle}>What's Next?</Text>
            </View>
            
            <View style={styles.whatsNextList}>
              <View style={styles.whatsNextItem}>
                <View style={styles.whatsNextBullet}>
                  <Ionicons name="calendar" size={16} color={COLORS.midCyan} />
                </View>
                <Text style={styles.whatsNextText}>
                  Set up vaccination reminders and health tracking
                </Text>
              </View>
              <View style={styles.whatsNextItem}>
                <View style={styles.whatsNextBullet}>
                  <Ionicons name="people" size={16} color={COLORS.midCyan} />
                </View>
                <Text style={styles.whatsNextText}>
                  Share your pet's profile with family members
                </Text>
              </View>
              <View style={styles.whatsNextItem}>
                <View style={styles.whatsNextBullet}>
                  <Ionicons name="location" size={16} color={COLORS.midCyan} />
                </View>
                <Text style={styles.whatsNextText}>
                  Explore the lost pet alert community in your area
                </Text>
              </View>
            </View>

            {/* Action Buttons - Moved inside What's Next */}
            <Animated.View
              entering={SlideInUp.delay(2200).springify()}
              style={styles.buttonRowInline}
            >
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.mediumGray} />
                <Text style={styles.editText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  { opacity: isCreating ? 0.7 : 1 }
                ]}
                onPress={handleCreateProfile}
                activeOpacity={0.9}
                disabled={isCreating}
              >
                <LinearGradient
                  colors={[COLORS.green, '#15803D']}
                  style={styles.createButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isCreating ? (
                    <View style={styles.loadingContainer}>
                      <Animated.View
                        style={[styles.loadingSpinner, sparkleStyle]}
                      >
                        <Ionicons name="sync" size={20} color={COLORS.white} />
                      </Animated.View>
                      <Text style={styles.createText}>Creating...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.createText}>Create Profile</Text>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Which section would you like to edit? Your current data will be preserved.
            </Text>

            <View style={styles.editOptions}>
              <TouchableOpacity 
                style={styles.editOption}
                onPress={() => navigateToEdit('/onboarding/basic-info')}
              >
                <View style={styles.editIconContainer}>
                  <Ionicons name="paw" size={24} color={COLORS.lightCyan} />
                </View>
                <View style={styles.editOptionContent}>
                  <Text style={styles.editOptionTitle}>Basic Information</Text>
                  <Text style={styles.editOptionDesc}>Name, species, breed, photo</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.editOption}
                onPress={() => navigateToEdit('/onboarding/physical-details')}
              >
                <View style={styles.editIconContainer}>
                  <Ionicons name="fitness" size={24} color={COLORS.lightCyan} />
                </View>
                <View style={styles.editOptionContent}>
                  <Text style={styles.editOptionTitle}>Physical Details</Text>
                  <Text style={styles.editOptionDesc}>Age, weight, size, color</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.editOption}
                onPress={() => navigateToEdit('/onboarding/health-profile')}
              >
                <View style={styles.editIconContainer}>
                  <Ionicons name="medical" size={24} color={COLORS.lightCyan} />
                </View>
                <View style={styles.editOptionContent}>
                  <Text style={styles.editOptionTitle}>Health Information</Text>
                  <Text style={styles.editOptionDesc}>Medical conditions, medications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={modalConfig.actions?.[0]?.onPress || hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
        showCloseButton={modalConfig.showCloseButton}
      />
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
    height: 6,
    backgroundColor: COLORS.softGray,
    borderRadius: 3,
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
    color: COLORS.green,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  celebrationIconContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  celebrationIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  progressStepsContainer: {
    marginBottom: 30,
  },
  progressStepsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 16,
    textAlign: 'center',
  },
  progressStepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  progressStep: {
    alignItems: 'center',
    minWidth: 80,
  },
  progressStepContent: {
    alignItems: 'center',
  },
  progressStepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressStepIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  whatsNextContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  whatsNextGradient: {
    padding: 20,
    borderRadius: 16,
  },
  whatsNextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  whatsNextIcon: {
    marginRight: 12,
  },
  whatsNextIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsNextTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.deepNavy,
  },
  whatsNextList: {
    gap: 12,
  },
  whatsNextItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  whatsNextBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.softGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  whatsNextText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
  },
  buttonRowInline: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: COLORS.softGray,
    flex: 0.4,
  },
  editText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginLeft: 8,
  },
  createButton: {
    flex: 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  editOptions: {
    paddingHorizontal: 20,
  },
  editOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.softGray,
    borderRadius: 12,
    marginBottom: 12,
  },
  editIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  editOptionContent: {
    flex: 1,
  },
  editOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 2,
  },
  editOptionDesc: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  modalCancelButton: {
    margin: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
});

export default ReviewCompleteScreen;