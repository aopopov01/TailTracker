import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { TailTrackerModal } from '../../src/components/UI/TailTrackerModal';
import { useTailTrackerModal } from '../../src/hooks/useTailTrackerModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
  lightGray: '#E2E8F0',
};

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  delay?: number;
  optional?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  delay = 0,
  optional = false,
  icon,
}) => {
  return (
    <Animated.View
      entering={SlideInDown.delay(delay).springify()}
      style={styles.inputContainer}
    >
      <View style={styles.labelContainer}>
        <View style={styles.labelIconWrapper}>
          <LinearGradient
            colors={[COLORS.lightCyan, COLORS.midCyan]}
            style={styles.labelIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon} size={16} color={COLORS.white} />
          </LinearGradient>
        </View>
        <Text style={styles.inputLabel}>
          {label}
          {!optional && <Text style={styles.required}> *</Text>}
          {optional && <Text style={styles.optional}> (optional)</Text>}
        </Text>
      </View>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.mediumGray}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </Animated.View>
  );
};


export default function OfficialRecordsScreen() {
  const router = useRouter();
  const { modalConfig, hideModal, showConfirm } = useTailTrackerModal();
  const progressWidth = useSharedValue(0);
  
  // Get species from route params
  const params = useLocalSearchParams<{ species?: string }>();
  const species = params.species ?? 'dog';

  const [registrationNumber, setRegistrationNumber] = useState('');

  useEffect(() => {
    // Animate progress bar to show step 4 of 7
    progressWidth.value = withDelay(
      300,
      withTiming((SCREEN_WIDTH - 40) * (4 / 7), {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
  }, [progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const handleNext = () => {
    // All fields are optional, so we can always proceed
    router.push({
      pathname: '/onboarding/health-profile',
      params: { species }
    } as any);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    showConfirm(
      'Skip Official Records?',
      'You can add these details later in your pet\'s profile settings.',
      () => {
        router.push({
          pathname: '/onboarding/health-profile',
          params: { species }
        } as any);
      },
      'Skip',
      'Cancel',
      false
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <Text style={styles.progressText}>Step 4 of 7</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.header}
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="document-text" size={32} color={COLORS.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Official Records</Text>
          <Text style={styles.subtitle}>
            Keep important identification and veterinary information organized
          </Text>
        </Animated.View>

        {/* Identification Section */}
        <Animated.View
          entering={SlideInDown.delay(400).springify()}
          style={styles.sectionContainer}
        >
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.sectionIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="id-card" size={20} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Identification</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Official identification numbers for your pet
          </Text>
          
          <View style={styles.sectionContent}>
            <InputField
              label="Registration Number"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              placeholder="e.g. KC Registration or License Number"
              delay={500}
              optional
              icon="bookmark-outline"
            />
          </View>
        </Animated.View>


        {/* Info Box */}
        <Animated.View
          entering={FadeIn.delay(1000).duration(600)}
          style={styles.infoBox}
        >
          <LinearGradient
            colors={[COLORS.softGray, COLORS.white]}
            style={styles.infoBoxGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={20} color={COLORS.midCyan} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Secure Storage</Text>
              <Text style={styles.infoText}>
                All information is encrypted and securely stored. Only you have access to your pet's records.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Animated.View
          entering={FadeIn.delay(1100).duration(600)}
          style={styles.buttonRow}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.mediumGray} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.nextText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1200).duration(600)}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={modalConfig.actions?.[0]?.onPress || hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
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
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.deepNavy,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionContent: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIconWrapper: {
    marginRight: 8,
  },
  labelIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.deepNavy,
    flex: 1,
  },
  required: {
    color: COLORS.lightCyan,
  },
  optional: {
    color: COLORS.mediumGray,
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.deepNavy,
    backgroundColor: COLORS.white,
  },
  multilineInput: {
    height: 80,
    paddingTop: 14,
  },
  infoBox: {
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoBoxGradient: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
  },
  infoIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.softGray,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: COLORS.softGray,
    flex: 0.4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginLeft: 8,
  },
  nextButton: {
    flex: 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: 8,
  },
  skipButton: {
    padding: 8,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textDecorationLine: 'underline',
  },
});