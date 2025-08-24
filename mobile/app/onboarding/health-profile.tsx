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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTailTrackerModal } from '../../src/hooks/useTailTrackerModal';
import { TailTrackerModal } from '../../src/components/UI/TailTrackerModal';
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
  lightGray: '#E2E8F0',
  lightRed: '#FEF2F2',
  red: '#DC2626',
};

interface TagInputProps {
  label: string;
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder: string;
  delay?: number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: 'default' | 'red';
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onAddTag,
  onRemoveTag,
  placeholder,
  delay = 0,
  icon,
  color = 'default',
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onAddTag(trimmedValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (nativeEvent: any) => {
    if (nativeEvent.key === 'Enter' || nativeEvent.key === ',') {
      handleAddTag();
    }
  };

  const tagColors = color === 'red' 
    ? { bg: COLORS.lightRed, text: COLORS.red }
    : { bg: COLORS.softGray, text: COLORS.deepNavy };

  return (
    <Animated.View
      entering={SlideInDown.delay(delay).springify()}
      style={styles.tagInputContainer}
    >
      <View style={styles.labelContainer}>
        <View style={styles.labelIconWrapper}>
          <LinearGradient
            colors={color === 'red' ? [COLORS.red, '#B91C1C'] : [COLORS.lightCyan, COLORS.midCyan]}
            style={styles.labelIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon} size={16} color={COLORS.white} />
          </LinearGradient>
        </View>
        <Text style={styles.inputLabel}>
          {label} <Text style={styles.optional}>(optional)</Text>
        </Text>
      </View>

      <View style={styles.tagInputWrapper}>
        <TextInput
          style={styles.tagInput}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mediumGray}
          onSubmitEditing={handleAddTag}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent)}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[
            styles.addTagButton,
            { opacity: inputValue.trim() ? 1 : 0.5 }
          ]}
          onPress={handleAddTag}
          disabled={!inputValue.trim()}
        >
          <LinearGradient
            colors={[COLORS.lightCyan, COLORS.midCyan]}
            style={styles.addTagGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Animated.View
              key={tag}
              entering={SlideInDown.delay(100 * index).springify()}
              style={[styles.tag, { backgroundColor: tagColors.bg }]}
            >
              <Text style={[styles.tagText, { color: tagColors.text }]}>{tag}</Text>
              <TouchableOpacity
                onPress={() => onRemoveTag(tag)}
                style={styles.removeTagButton}
              >
                <Ionicons name="close" size={14} color={tagColors.text} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

interface MedicationItemProps {
  medication: {
    name: string;
    dosage: string;
    frequency: string;
  };
  onUpdate: (medication: any) => void;
  onRemove: () => void;
  delay?: number;
}

const MedicationItem: React.FC<MedicationItemProps> = ({
  medication,
  onUpdate,
  onRemove,
  delay = 0,
}) => {
  return (
    <Animated.View
      entering={SlideInDown.delay(delay).springify()}
      style={styles.medicationItem}
    >
      <LinearGradient
        colors={[COLORS.white, COLORS.softGray]}
        style={styles.medicationGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.medicationHeader}>
          <View style={styles.medicationIconContainer}>
            <LinearGradient
              colors={[COLORS.lightCyan, COLORS.midCyan]}
              style={styles.medicationIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="medical" size={16} color={COLORS.white} />
            </LinearGradient>
          </View>
          <Text style={styles.medicationTitle}>Medication</Text>
          <TouchableOpacity onPress={onRemove} style={styles.removeMedicationButton}>
            <Ionicons name="trash-outline" size={18} color={COLORS.mediumGray} />
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.medicationInput}
          value={medication.name}
          onChangeText={(text) => onUpdate({ ...medication, name: text })}
          placeholder="Medication name"
          placeholderTextColor={COLORS.mediumGray}
        />
        <View style={styles.medicationRow}>
          <TextInput
            style={[styles.medicationInput, styles.halfWidth]}
            value={medication.dosage}
            onChangeText={(text) => onUpdate({ ...medication, dosage: text })}
            placeholder="Dosage"
            placeholderTextColor={COLORS.mediumGray}
          />
          <TextInput
            style={[styles.medicationInput, styles.halfWidth]}
            value={medication.frequency}
            onChangeText={(text) => onUpdate({ ...medication, frequency: text })}
            placeholder="Frequency"
            placeholderTextColor={COLORS.mediumGray}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function HealthProfileScreen() {
  const router = useRouter();
  const { modalConfig, showConfirm, hideModal } = useTailTrackerModal();
  
  // Get species from route params
  const params = useLocalSearchParams<{ species?: string }>();
  const species = params.species || 'dog';
  const progressWidth = useSharedValue(0);

  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>>([]);

  useEffect(() => {
    // Animate progress bar to show step 5 of 7
    progressWidth.value = withDelay(
      300,
      withTiming((SCREEN_WIDTH - 40) * (5 / 7), {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const addMedicalCondition = (condition: string) => {
    setMedicalConditions([...medicalConditions, condition]);
  };

  const removeMedicalCondition = (condition: string) => {
    setMedicalConditions(medicalConditions.filter(c => c !== condition));
  };

  const addAllergy = (allergy: string) => {
    setAllergies([...allergies, allergy]);
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '' }
    ]);
  };

  const updateMedication = (index: number, medication: any) => {
    const updated = [...medications];
    updated[index] = medication;
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/personality-care',
      params: { species }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    showConfirm(
      'Skip Health Profile?',
      'Health information helps track important medical needs. You can add this later.',
      () => router.push({
        pathname: '/onboarding/personality-care',
        params: { species }
      }),
      'Skip',
      'Cancel',
      false
    );
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
        <Text style={styles.progressText}>Step 5 of 7</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
              <Ionicons name="heart-outline" size={32} color={COLORS.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Health Profile</Text>
          <Text style={styles.subtitle}>
            Track medical conditions, allergies, and current medications
          </Text>
        </Animated.View>

        {/* Medical Conditions */}
        <TagInput
          label="Medical Conditions"
          tags={medicalConditions}
          onAddTag={addMedicalCondition}
          onRemoveTag={removeMedicalCondition}
          placeholder="e.g. Hip dysplasia, Diabetes"
          delay={400}
          icon="medical-outline"
        />

        {/* Allergies */}
        <TagInput
          label="Allergies"
          tags={allergies}
          onAddTag={addAllergy}
          onRemoveTag={removeAllergy}
          placeholder="e.g. Chicken, Pollen, Fleas"
          delay={500}
          icon="alert-circle-outline"
          color="red"
        />

        {/* Current Medications */}
        <Animated.View
          entering={SlideInDown.delay(600).springify()}
          style={styles.sectionContainer}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.labelIconWrapper}>
              <LinearGradient
                colors={[COLORS.lightCyan, COLORS.midCyan]}
                style={styles.labelIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="medical" size={16} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.sectionTitle}>
              Current Medications <Text style={styles.optional}>(optional)</Text>
            </Text>
          </View>

          {medications.map((medication, index) => (
            <MedicationItem
              key={index}
              medication={medication}
              onUpdate={(med) => updateMedication(index, med)}
              onRemove={() => removeMedication(index)}
              delay={700 + (index * 100)}
            />
          ))}

          <Animated.View entering={FadeIn.delay(800 + (medications.length * 100))}>
            <TouchableOpacity
              style={styles.addMedicationButton}
              onPress={addMedication}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.softGray, COLORS.white]}
                style={styles.addMedicationGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.addMedicationIconContainer}>
                  <LinearGradient
                    colors={[COLORS.lightCyan, COLORS.midCyan]}
                    style={styles.addMedicationIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="add" size={20} color={COLORS.white} />
                  </LinearGradient>
                </View>
                <Text style={styles.addMedicationText}>Add Medication</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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
              <Ionicons name="shield-checkmark" size={20} color={COLORS.midCyan} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Medical Privacy</Text>
              <Text style={styles.infoText}>
                Health information is kept private and secure. This helps veterinarians provide better care during emergencies.
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
  tagInputContainer: {
    marginBottom: 30,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.deepNavy,
    flex: 1,
  },
  optional: {
    color: COLORS.mediumGray,
    fontSize: 14,
    fontWeight: '400',
  },
  tagInputWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.deepNavy,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addTagGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  removeTagButton: {
    padding: 2,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.deepNavy,
    flex: 1,
  },
  medicationItem: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  medicationGradient: {
    padding: 16,
    borderRadius: 16,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationIconContainer: {
    marginRight: 8,
  },
  medicationIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.deepNavy,
    flex: 1,
  },
  removeMedicationButton: {
    padding: 4,
  },
  medicationInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.deepNavy,
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  medicationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  addMedicationButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  addMedicationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  addMedicationIconContainer: {
    marginRight: 12,
  },
  addMedicationIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMedicationText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.deepNavy,
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