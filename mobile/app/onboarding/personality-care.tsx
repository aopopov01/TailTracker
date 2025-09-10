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
import { PetPersonalityService } from '../../src/services/PetPersonalityService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  lightBlue: '#EFF6FF',
  blue: '#2563EB',
};

interface TraitButtonProps {
  trait: string;
  selected: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  color?: 'cyan' | 'green' | 'blue';
  delay?: number;
}

const TraitButton: React.FC<TraitButtonProps> = ({
  trait,
  selected,
  onPress,
  icon,
  color = 'cyan',
  delay = 0,
}) => {
  const colorScheme = {
    cyan: { 
      bg: selected ? [COLORS.lightCyan, COLORS.midCyan] as const : [COLORS.white, COLORS.softGray] as const,
      text: selected ? COLORS.white : COLORS.deepNavy,
      border: selected ? COLORS.lightCyan : COLORS.lightGray
    },
    green: { 
      bg: selected ? [COLORS.green, '#15803D'] as const : [COLORS.lightGreen, COLORS.white] as const,
      text: selected ? COLORS.white : COLORS.green,
      border: selected ? COLORS.green : '#BBF7D0'
    },
    blue: { 
      bg: selected ? [COLORS.blue, '#1D4ED8'] as const : [COLORS.lightBlue, COLORS.white] as const,
      text: selected ? COLORS.white : COLORS.blue,
      border: selected ? COLORS.blue : '#DBEAFE'
    }
  };

  const scheme = colorScheme[color];

  return (
    <Animated.View entering={SlideInDown.delay(delay).springify()}>
      <TouchableOpacity
        style={[
          styles.traitButton,
          { borderColor: scheme.border },
          selected ? styles.traitButtonSelected : styles.traitButtonDefault
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={scheme.bg}
          style={styles.traitButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon} size={20} color={scheme.text} />
          <Text style={[styles.traitButtonText, { color: scheme.text }]}>
            {trait}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};


export default function PersonalityCareScreen() {
  const router = useRouter();
  const { modalConfig, hideModal, showConfirm } = useTailTrackerModal();
  const progressWidth = useSharedValue(0);

  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [favoriteActivities, setFavoriteActivities] = useState<string[]>([]);
  const [exerciseNeeds, setExerciseNeeds] = useState<'low' | 'moderate' | 'high' | null>(null);
  const [favoriteFoods, setFavoriteFoods] = useState('');
  const [feedingSchedule, setFeedingSchedule] = useState('');
  const [specialDiet, setSpecialDiet] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Get species from route params
  const params = useLocalSearchParams<{ species?: string }>();
  const species = params.species ?? 'dog';

  // Icon mapping for personality traits
  const getTraitIcon = (traitLabel: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      // Temperament traits
      'Loyal': 'heart-outline',
      'Calm': 'leaf-outline',
      'Protective': 'shield-outline',
      'Intelligent': 'bulb-outline',
      'Independent': 'compass-outline',
      'Gentle': 'flower-outline',
      'Shy': 'eye-off-outline',
      'Territorial': 'lock-closed-outline',
      
      // Behavior traits
      'Playful': 'game-controller-outline',
      'Energetic': 'flash-outline',
      'Curious': 'search-outline',
      'Vocal': 'chatbubble-outline',
      'Hunter': 'eye-outline',
      'Active': 'fitness-outline',
      
      // Social traits
      'Friendly': 'people-outline',
      'Social': 'people-outline',
      'Affectionate': 'heart-outline',
      'Lap Cat': 'heart-circle-outline',
    };
    
    return iconMap[traitLabel] || 'ellipse-outline';
  };

  // Icon mapping for activities
  const getActivityIcon = (activityLabel: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      // Dog activities
      'Playing Fetch': 'baseball-outline',
      'Long Walks': 'walk-outline', 
      'Running/Jogging': 'flash-outline',
      'Swimming': 'water-outline',
      'Training Sessions': 'school-outline',
      'Puzzle Toys': 'extension-puzzle-outline',
      'Tug of War': 'fitness-outline',
      'Dog Parks': 'people-outline',
      'Hiking': 'trail-sign-outline',
      'Agility Training': 'ribbon-outline',
      
      // Cat activities
      'Laser Pointer': 'radio-button-on-outline',
      'Feather Wand Play': 'leaf-outline',
      'Catnip Toys': 'flower-outline',
      'Window Bird Watching': 'eye-outline',
      'Cat Tree Climbing': 'trending-up-outline',
      'Hunting Games': 'search-outline',
      'Puzzle Feeders': 'extension-puzzle-outline',
      'Sunbathing': 'sunny-outline',
      'Exploring New Spaces': 'compass-outline',
      'Socializing with Humans': 'people-outline',
      
      // Bird activities
      'Foraging Games': 'search-outline',
      'Mirror Interaction': 'copy-outline',
      'Music & Dancing': 'musical-notes-outline',
      'Talking/Mimicking': 'chatbubble-outline',
      'Perch Swinging': 'git-branch-outline',
      'Shredding Toys': 'cut-outline',
      'Bath Time': 'water-outline',
      'Supervised Exploration': 'compass-outline',
      'Trick Training': 'school-outline',
      
      // Generic activities
      'Playing': 'game-controller-outline',
      'Exploring': 'compass-outline',
      'Resting': 'bed-outline',
      'Socializing': 'people-outline',
      'Exercise': 'fitness-outline',
      'Cuddling': 'heart-outline',
      'Habitat Exploration': 'map-outline',
      'Enrichment Toys': 'extension-puzzle-outline',
      'Natural Species Behaviors': 'leaf-outline',
      'Environmental Interaction': 'globe-outline',
    };
    
    return iconMap[activityLabel] || 'ellipse-outline';
  };

  // Color mapping for activities
  const getActivityColor = (activityLabel: string, category?: string): 'cyan' | 'green' | 'blue' => {
    if (category === 'training') return 'green';
    if (category === 'social') return 'cyan';
    if (category === 'outdoor') return 'blue';
    
    // Default color mapping
    const colorMap: Record<string, 'cyan' | 'green' | 'blue'> = {
      'Playing Fetch': 'green',
      'Long Walks': 'blue',
      'Running/Jogging': 'green',
      'Swimming': 'blue',
      'Training Sessions': 'green',
      'Puzzle Toys': 'green',
      'Tug of War': 'green',
      'Dog Parks': 'cyan',
      'Hiking': 'blue',
      'Agility Training': 'green',
    };
    
    return colorMap[activityLabel] || 'cyan';
  };

  // Get species-specific data from service
  const personalityProfile = PetPersonalityService.getPersonalityProfile(species as 'dog' | 'cat' | 'bird' | 'other');
  
  const personalityOptions = personalityProfile.personalityTraits.map(trait => ({
    trait: trait.label,
    icon: getTraitIcon(trait.label)
  }));
  
  const activityOptions = personalityProfile.favoriteActivities.map(activity => ({
    activity: activity.label,
    icon: getActivityIcon(activity.label),
    color: getActivityColor(activity.label, activity.category)
  }));

  useEffect(() => {
    // Animate progress bar to show step 6 of 7
    progressWidth.value = withDelay(
      300,
      withTiming((SCREEN_WIDTH - 40) * (6 / 7), {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
  }, [progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const togglePersonalityTrait = (trait: string) => {
    setPersonalityTraits(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  const toggleFavoriteActivity = (activity: string) => {
    setFavoriteActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/review-complete',
      params: { species }
    } as any);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    showConfirm(
      'Skip Personality & Care?',
      'This information helps create a complete profile for better care recommendations.',
      () => {
        router.push({
          pathname: '/onboarding/review-complete',
          params: { species }
        } as any);
      },
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
        <Text style={styles.progressText}>Step 6 of 7</Text>
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
              <Ionicons name="happy-outline" size={32} color={COLORS.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Personality & Care</Text>
          <Text style={styles.subtitle}>
            Help us understand your {species === 'other' ? 'pet' : species}'s unique character and preferences
          </Text>
        </Animated.View>

        {/* Personality Traits */}
        <Animated.View
          entering={SlideInDown.delay(400).springify()}
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
                <Ionicons name="happy-outline" size={16} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.sectionTitle}>
              Personality Traits <Text style={styles.optional}>(optional)</Text>
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select traits that best describe your {species === 'other' ? 'pet' : species}
          </Text>
          
          <View style={styles.traitsGrid}>
            {personalityOptions.map((option, index) => (
              <TraitButton
                key={option.trait}
                trait={option.trait}
                icon={option.icon}
                selected={personalityTraits.includes(option.trait)}
                onPress={() => togglePersonalityTrait(option.trait)}
                delay={500 + (index * 50)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Favorite Activities */}
        <Animated.View
          entering={SlideInDown.delay(900).springify()}
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
                <Ionicons name="game-controller-outline" size={16} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.sectionTitle}>
              Favorite Activities <Text style={styles.optional}>(optional)</Text>
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            What does your {species === 'other' ? 'pet' : species} love to do?
          </Text>
          
          <View style={styles.traitsGrid}>
            {activityOptions.map((option, index) => (
              <TraitButton
                key={option.activity}
                trait={option.activity}
                icon={option.icon}
                color={option.color}
                selected={favoriteActivities.includes(option.activity)}
                onPress={() => toggleFavoriteActivity(option.activity)}
                delay={1000 + (index * 50)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Exercise Needs */}
        <Animated.View
          entering={SlideInDown.delay(1400).springify()}
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
                <Ionicons name="fitness-outline" size={16} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.sectionTitle}>
              Exercise Needs <Text style={styles.optional}>(optional)</Text>
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            How active is your {species === 'other' ? 'pet' : species}?
          </Text>
          
          <View style={styles.exerciseLevelsContainer}>
            {personalityProfile.exerciseNeeds.map((exerciseOption, index) => (
              <Animated.View key={exerciseOption.id} entering={SlideInDown.delay(1500 + (index * 100)).springify()}>
                <TouchableOpacity
                  style={[
                    styles.exerciseLevelButton,
                    {
                      backgroundColor: exerciseNeeds === exerciseOption.value ? COLORS.softGray : COLORS.white,
                      borderColor: exerciseNeeds === exerciseOption.value ? COLORS.lightCyan : COLORS.lightGray,
                    },
                    exerciseNeeds === exerciseOption.value ? styles.exerciseLevelButtonSelected : styles.exerciseLevelButtonDefault
                  ]}
                  onPress={() => setExerciseNeeds(exerciseOption.value)}
                  activeOpacity={0.8}
                >
                  <View style={styles.exerciseLevelContent}>
                    <View style={[
                      styles.exerciseLevelIcon,
                      { backgroundColor: exerciseNeeds === exerciseOption.value ? COLORS.lightCyan : COLORS.softGray }
                    ]}>
                      <Ionicons 
                        name={exerciseOption.value === 'high' ? 'flash-outline' : exerciseOption.value === 'moderate' ? 'walk-outline' : 'bed-outline'} 
                        size={24} 
                        color={exerciseNeeds === exerciseOption.value ? COLORS.white : COLORS.lightCyan} 
                      />
                    </View>
                    <View style={styles.exerciseLevelText}>
                      <Text style={[
                        styles.exerciseLevelLabel,
                        { color: exerciseNeeds === exerciseOption.value ? COLORS.deepNavy : COLORS.mediumGray }
                      ]}>
                        {exerciseOption.label}
                      </Text>
                      <Text style={styles.exerciseLevelDescription}>
                        {exerciseOption.description}
                      </Text>
                    </View>
                    {exerciseNeeds === exerciseOption.value && (
                      <View style={styles.exerciseLevelCheck}>
                        <LinearGradient
                          colors={[COLORS.lightCyan, COLORS.midCyan]}
                          style={styles.exerciseLevelCheckGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Food Preferences */}
        <Animated.View
          entering={SlideInDown.delay(1800).springify()}
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
                <Ionicons name="restaurant-outline" size={16} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.sectionTitle}>
              Food Preferences <Text style={styles.optional}>(optional)</Text>
            </Text>
          </View>
          
          <View style={styles.foodInputsContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Favorite Foods</Text>
              <TextInput
                style={styles.textInput}
                value={favoriteFoods}
                onChangeText={setFavoriteFoods}
                placeholder="e.g. Chicken, carrots, salmon treats"
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Feeding Schedule</Text>
              <TextInput
                style={styles.textInput}
                value={feedingSchedule}
                onChangeText={setFeedingSchedule}
                placeholder="e.g. 2 meals daily at 8am and 6pm"
                placeholderTextColor={COLORS.mediumGray}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Special Diet Notes</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={specialDiet}
                onChangeText={setSpecialDiet}
                placeholder="e.g. Grain-free, limited ingredient diet"
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </Animated.View>

        {/* Special Notes */}
        <Animated.View
          entering={SlideInDown.delay(1900).springify()}
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
                <Ionicons name="document-text-outline" size={16} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.sectionTitle}>
              Special Notes <Text style={styles.optional}>(optional)</Text>
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Any additional information about your pet's behavior, preferences, or care needs
          </Text>
          
          <TextInput
            style={[styles.textInput, styles.specialNotesInput]}
            value={specialNotes}
            onChangeText={setSpecialNotes}
            placeholder="e.g. Doesn't like loud noises, loves belly rubs, needs medication with meals"
            placeholderTextColor={COLORS.mediumGray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Info Box */}
        <Animated.View
          entering={FadeIn.delay(2000).duration(600)}
          style={styles.infoBox}
        >
          <LinearGradient
            colors={[COLORS.softGray, COLORS.white]}
            style={styles.infoBoxGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.infoIconContainer}>
              <Ionicons name="bulb" size={20} color={COLORS.midCyan} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Personalized Care</Text>
              <Text style={styles.infoText}>
                This information helps create personalized care reminders and recommendations for your pet.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Animated.View
          entering={FadeIn.delay(2100).duration(600)}
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

        <Animated.View entering={FadeIn.delay(2200).duration(600)}>
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
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
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
  sectionTitle: {
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
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  traitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 4,
  },
  traitButtonSelected: {
    borderWidth: 2,
  },
  traitButtonDefault: {
    borderWidth: 1,
  },
  traitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  traitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  exerciseLevelsContainer: {
    gap: 12,
  },
  exerciseLevelButton: {
    borderRadius: 16,
    padding: 16,
  },
  exerciseLevelButtonSelected: {
    borderWidth: 2,
  },
  exerciseLevelButtonDefault: {
    borderWidth: 1,
  },
  exerciseLevelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseLevelIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseLevelText: {
    flex: 1,
  },
  exerciseLevelLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseLevelDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  exerciseLevelCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exerciseLevelCheckGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodInputsContainer: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.deepNavy,
    marginBottom: 8,
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
  specialNotesInput: {
    height: 100,
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