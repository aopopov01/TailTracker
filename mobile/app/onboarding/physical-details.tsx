import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
};

// Breed suggestions by species
const DOG_BREEDS = [
  'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog',
  'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund',
  'Mixed Breed', 'Other',
];

const CAT_BREEDS = [
  'Persian', 'Maine Coon', 'Siamese', 'British Shorthair', 'Ragdoll',
  'Bengal', 'American Shorthair', 'Scottish Fold', 'Russian Blue', 'Sphynx',
  'Mixed Breed', 'Other',
];

const BIRD_BREEDS = [
  'Parakeet', 'Cockatiel', 'Canary', 'Lovebird', 'Conure', 'Macaw',
  'African Grey', 'Cockatoo', 'Finch', 'Parrot', 'Mixed Breed', 'Other',
];

interface UnitToggleProps {
  leftUnit: string;
  rightUnit: string;
  selectedUnit: string;
  onToggle: (unit: string) => void;
  delay?: number;
}

const UnitToggle: React.FC<UnitToggleProps> = ({
  leftUnit,
  rightUnit,
  selectedUnit,
  onToggle,
  delay = 0,
}) => {
  return (
    <Animated.View
      entering={SlideInDown.delay(delay).springify()}
      style={styles.unitToggle}
    >
      <TouchableOpacity
        style={[
          styles.unitButton,
          styles.leftUnit,
          selectedUnit === leftUnit && styles.unitButtonSelected,
        ]}
        onPress={() => onToggle(leftUnit)}
        activeOpacity={0.8}
      >
        {selectedUnit === leftUnit ? (
          <LinearGradient
            colors={[COLORS.lightCyan, COLORS.midCyan]}
            style={styles.unitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.unitText, styles.unitTextSelected]}>{leftUnit}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.unitText}>{leftUnit}</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.unitButton,
          styles.rightUnit,
          selectedUnit === rightUnit && styles.unitButtonSelected,
        ]}
        onPress={() => onToggle(rightUnit)}
        activeOpacity={0.8}
      >
        {selectedUnit === rightUnit ? (
          <LinearGradient
            colors={[COLORS.lightCyan, COLORS.midCyan]}
            style={styles.unitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.unitText, styles.unitTextSelected]}>{rightUnit}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.unitText}>{rightUnit}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function PhysicalDetailsScreen() {
  const router = useRouter();
  const progressWidth = useSharedValue(0);

  const [breed, setBreed] = useState('');
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useApproximateAge, setUseApproximateAge] = useState(false);
  const [approximateAge, setApproximateAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown' | ''>('');
  const [colorMarkings, setColorMarkings] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

  // Get species from route params
  const params = useLocalSearchParams<{ species?: string }>();
  const species = params.species || 'dog';

  useEffect(() => {
    // Animate progress bar to show step 3 of 7
    progressWidth.value = withDelay(
      300,
      withTiming((SCREEN_WIDTH - 40) * (3 / 7), {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  // Get breed suggestions based on species
  const getBreedSuggestions = () => {
    const breeds = species === 'dog' ? DOG_BREEDS : 
                  species === 'cat' ? CAT_BREEDS :
                  species === 'bird' ? BIRD_BREEDS : DOG_BREEDS;
    
    return breeds.filter(b => 
      b.toLowerCase().includes(breed.toLowerCase())
    ).slice(0, 5);
  };

  const breedSuggestions = getBreedSuggestions();

  const calculateAge = () => {
    if (useApproximateAge) {
      return approximateAge || 'Enter age';
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Check if this is the default date (today)
    if (birthDate.toDateString() === today.toDateString()) {
      return 'Select date of birth';
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 1) {
      const months = Math.max(0, (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                    today.getMonth() - birthDate.getMonth());
      return months === 1 ? '1 month' : `${months} months`;
    }
    
    return age === 1 ? '1 year' : `${age} years`;
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/official-records',
      params: { species }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const isAndroid = Platform.OS === 'android';
    
    // Handle date selection
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate);
      // Close picker after selection
      setShowDatePicker(false);
    } else if (event.type === 'dismissed' || event.type === 'neutralButtonPressed') {
      // Only close on explicit dismissal/cancel
      setShowDatePicker(false);
    }
    // Note: Don't close on 'onChange' events as user might still be selecting
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
        <Text style={styles.progressText}>Step 3 of 7</Text>
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
              <Ionicons name="resize-outline" size={32} color={COLORS.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Physical Details</Text>
          <Text style={styles.subtitle}>
            Help us build a complete picture of your pet
          </Text>
        </Animated.View>

        {/* Breed Input */}
        <Animated.View
          entering={SlideInDown.delay(400).springify()}
          style={styles.inputContainer}
        >
          <Text style={styles.label}>Breed <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.textInput}
            value={breed}
            onChangeText={(text) => {
              setBreed(text);
              setShowBreedSuggestions(text.length > 0);
            }}
            placeholder="e.g. Golden Retriever, Mixed Breed"
            placeholderTextColor={COLORS.mediumGray}
            onBlur={() => setShowBreedSuggestions(false)}
          />
          
          {showBreedSuggestions && breedSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {breedSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestion}
                  onPress={() => {
                    setBreed(suggestion);
                    setShowBreedSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Age Section */}
        <Animated.View
          entering={SlideInDown.delay(500).springify()}
          style={styles.inputContainer}
        >
          <Text style={styles.label}>Age <Text style={styles.optional}>(optional)</Text></Text>
          
          <View style={styles.ageToggleContainer}>
            <TouchableOpacity
              style={[
                styles.ageToggleButton,
                !useApproximateAge && styles.ageToggleButtonActive,
              ]}
              onPress={() => setUseApproximateAge(false)}
            >
              {!useApproximateAge ? (
                <LinearGradient
                  colors={[COLORS.lightCyan, COLORS.midCyan]}
                  style={styles.ageToggleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.ageToggleText, styles.ageToggleTextActive]}>
                    Date of Birth
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.ageToggleText}>Date of Birth</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.ageToggleButton,
                useApproximateAge && styles.ageToggleButtonActive,
              ]}
              onPress={() => setUseApproximateAge(true)}
            >
              {useApproximateAge ? (
                <LinearGradient
                  colors={[COLORS.lightCyan, COLORS.midCyan]}
                  style={styles.ageToggleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.ageToggleText, styles.ageToggleTextActive]}>
                    Approximate
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.ageToggleText}>Approximate</Text>
              )}
            </TouchableOpacity>
          </View>

          {useApproximateAge ? (
            <TextInput
              style={styles.textInput}
              value={approximateAge}
              onChangeText={setApproximateAge}
              placeholder="e.g. 3 years, 8 months, 2 years old"
              placeholderTextColor={COLORS.mediumGray}
            />
          ) : (
            <TouchableOpacity
              style={[styles.textInput, styles.dateButton]}
              onPress={() => {
                setShowDatePicker(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dateButtonText,
                calculateAge() === 'Select date of birth' && styles.placeholderText
              ]}>
                {calculateAge()}
              </Text>
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={calculateAge() === 'Select date of birth' ? COLORS.mediumGray : COLORS.lightCyan} 
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Gender Selection */}
        <Animated.View
          entering={SlideInDown.delay(600).springify()}
          style={styles.inputContainer}
        >
          <Text style={styles.label}>Gender <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.genderContainer}>
            {[
              { value: 'male', label: 'Male', icon: 'male' },
              { value: 'female', label: 'Female', icon: 'female' },
              { value: 'unknown', label: 'Unknown', icon: 'help-circle' },
            ].map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderButton,
                  gender === option.value && styles.genderButtonSelected,
                ]}
                onPress={() => setGender(option.value as any)}
                activeOpacity={0.8}
              >
                {gender === option.value ? (
                  <LinearGradient
                    colors={[COLORS.lightCyan, COLORS.midCyan]}
                    style={styles.genderButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={option.icon as any} size={20} color={COLORS.white} />
                    <Text style={[styles.genderButtonText, styles.genderButtonTextSelected]}>
                      {option.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.genderButtonContent}>
                    <Ionicons name={option.icon as any} size={20} color={COLORS.mediumGray} />
                    <Text style={styles.genderButtonText}>{option.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Color & Markings */}
        <Animated.View
          entering={SlideInDown.delay(700).springify()}
          style={styles.inputContainer}
        >
          <Text style={styles.label}>Color & Markings <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={colorMarkings}
            onChangeText={setColorMarkings}
            placeholder="e.g. Golden with white chest, black spots on ears"
            placeholderTextColor={COLORS.mediumGray}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Weight Section */}
        <Animated.View
          entering={SlideInDown.delay(800).springify()}
          style={styles.measurementContainer}
        >
          <Text style={styles.label}>Weight <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.measurementRow}>
            <TextInput
              style={[styles.textInput, styles.measurementInput]}
              value={weight}
              onChangeText={setWeight}
              placeholder="0"
              placeholderTextColor={COLORS.mediumGray}
              keyboardType="numeric"
            />
            <UnitToggle
              leftUnit="kg"
              rightUnit="lbs"
              selectedUnit={weightUnit}
              onToggle={(unit) => setWeightUnit(unit as 'kg' | 'lbs')}
              delay={850}
            />
          </View>
        </Animated.View>

        {/* Height Section */}
        <Animated.View
          entering={SlideInDown.delay(900).springify()}
          style={styles.measurementContainer}
        >
          <Text style={styles.label}>Height <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.measurementRow}>
            <TextInput
              style={[styles.textInput, styles.measurementInput]}
              value={height}
              onChangeText={setHeight}
              placeholder="0"
              placeholderTextColor={COLORS.mediumGray}
              keyboardType="numeric"
            />
            <UnitToggle
              leftUnit="cm"
              rightUnit="ft"
              selectedUnit={heightUnit}
              onToggle={(unit) => setHeightUnit(unit as 'cm' | 'ft')}
              delay={950}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Animated.View
          entering={FadeIn.delay(1000).duration(600)}
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
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <View style={styles.iosDatePickerContainer}>
          <View style={styles.iosDatePickerModal}>
            <View style={styles.iosDatePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.iosDatePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setShowDatePicker(false);
              }}>
                <Text style={styles.iosDatePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                style={{ backgroundColor: 'white', height: 216 }}
                textColor={COLORS.deepNavy}
                themeVariant="light"
              />
            </View>
          </View>
        </View>
      )}
      
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
      
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
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 8,
  },
  optional: {
    color: COLORS.mediumGray,
    fontSize: 14,
    fontWeight: '400',
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
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestion: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softGray,
  },
  suggestionText: {
    fontSize: 16,
    color: COLORS.deepNavy,
  },
  ageToggleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: COLORS.softGray,
    borderRadius: 8,
    padding: 2,
  },
  ageToggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ageToggleButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ageToggleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  ageToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  ageToggleTextActive: {
    color: COLORS.white,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.deepNavy,
  },
  placeholderText: {
    color: COLORS.mediumGray,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: 'hidden',
    minHeight: 48,
  },
  genderButtonSelected: {
    borderColor: COLORS.lightCyan,
    borderWidth: 2,
  },
  genderButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  genderButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginLeft: 6,
  },
  genderButtonTextSelected: {
    color: COLORS.white,
  },
  measurementContainer: {
    marginBottom: 24,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    justifyContent: 'space-between',
  },
  measurementInput: {
    flex: 1,
    maxWidth: '60%',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.softGray,
    borderRadius: 8,
    overflow: 'hidden',
    height: 48,
    minWidth: 120,
    alignSelf: 'flex-start',
  },
  unitButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftUnit: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  rightUnit: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  unitButtonSelected: {
    overflow: 'hidden',
  },
  unitButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  unitTextSelected: {
    color: COLORS.white,
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
  iosDatePickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosDatePickerModal: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  datePickerWrapper: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  iosDatePickerCancel: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  iosDatePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.lightCyan,
  },
});