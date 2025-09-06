import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Path, LinearGradient as SvgLinearGradient, Stop, Defs, G, Rect } from 'react-native-svg';
import { usePetProfile } from '../../contexts/PetProfileContext';
import { TailTrackerModal } from '../../src/components/UI/TailTrackerModal';
import { useTailTrackerModal } from '../../src/hooks/useTailTrackerModal';
import { log } from '../../src/utils/Logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
  error: '#EF4444',
  success: '#10B981',
};

// Pet Icons Components using provided images
const DogIcon = ({ size = 60 }: { size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size * 0.2, overflow: 'hidden' }}>
    <Image 
      source={require('../../assets/images/Dog.jpeg')} 
      style={{ width: size, height: size }}
      resizeMode="cover"
    />
  </View>
);

const CatIcon = ({ size = 60 }: { size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size * 0.2, overflow: 'hidden' }}>
    <Image 
      source={require('../../assets/images/Cat.jpeg')} 
      style={{ width: size, height: size }}
      resizeMode="cover"
    />
  </View>
);

const ParrotIcon = ({ size = 60 }: { size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size * 0.2, overflow: 'hidden' }}>
    <Image 
      source={require('../../assets/images/Bird.jpeg')} 
      style={{ width: size, height: size }}
      resizeMode="cover"
    />
  </View>
);

const OtherPetIcon = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="otherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4BA8B5"/>
        <Stop offset="100%" stopColor="#5DD4DC"/>
      </SvgLinearGradient>
    </Defs>
    <Rect width="100" height="100" rx="20" fill="url(#otherGradient)"/>
    <G fill="white">
      <Path d="M 50 70 C 35 55, 20 45, 35 30 C 45 25, 55 25, 50 40 C 45 25, 55 25, 65 30 C 80 45, 65 55, 50 70 Z"/>
    </G>
  </Svg>
);

const SPECIES_OPTIONS = [
  { id: 'dog', label: 'Dog', component: DogIcon },
  { id: 'cat', label: 'Cat', component: CatIcon },
  { id: 'bird', label: 'Bird', component: ParrotIcon },
  { id: 'other', label: 'Other', component: OtherPetIcon },
];

export default function BasicInfoScreen() {
  const router = useRouter();
  const { modalConfig, showWarning } = useTailTrackerModal();
  const { profile, updateBasicInfo } = usePetProfile();
  const [petName, setPetName] = useState(profile.name ?? '');
  const [species, setSpecies] = useState(profile.species ?? '');
  const [petPhoto, setPetPhoto] = useState<string | null>(profile.photos?.[0] ?? null);
  const [nameError, setNameError] = useState('');
  
  const progressWidth = useSharedValue((SCREEN_WIDTH - 40) * (1 / 7));

  React.useEffect(() => {
    progressWidth.value = withTiming((SCREEN_WIDTH - 40) * (2 / 7), {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, [progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const validateName = (name: string) => {
    if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    if (name.length > 50) {
      setNameError('Name must be less than 50 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const pickImage = async () => {
    // Attempting to pick image from gallery
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Process image picker result
      if (!result.canceled) {
        // Image selected successfully
        setPetPhoto(result.assets[0].uri);
      }
    } catch (error) {
      log.error('Error picking image:', error);
    }
  };

  const takePhoto = async () => {
    // Attempting to take photo with camera
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      // Check camera permission status
      if (permission.granted) {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        // Process camera result
        if (!result.canceled) {
          // Photo taken successfully
          setPetPhoto(result.assets[0].uri);
        }
      } else {
        showWarning('Camera Permission', 'Camera access is required to take photos', 'camera');
      }
    } catch (error) {
      log.error('Error taking photo:', error);
    }
  };

  const handleNext = () => {
    if (!validateName(petName) || !species) {
      showWarning('Missing Information', 'Please enter your pet\'s name and select their species', 'information-circle');
      return;
    }
    
    // Save data to PetProfile context
    updateBasicInfo({
      name: petName,
      species: species as 'dog' | 'cat' | 'bird' | 'other',
      photos: petPhoto ? [petPhoto] : []
    });
    
    // Saving basic pet information
    
    // Navigate to next screen
    router.push('/onboarding/physical-details' as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.deepNavy} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
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
        <Text style={styles.progressText}>Step 2 of 7</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(200).duration(600)}>
          <Text style={styles.title}>What's your pet's name?</Text>
        </Animated.View>

        {/* Name Input */}
        <Animated.View
          entering={FadeIn.delay(300).duration(600)}
          style={styles.inputContainer}
        >
          <View style={[
            styles.textInputWrapper,
            nameError ? styles.inputError : petName.length >= 2 ? styles.inputSuccess : null
          ]}>
            <Ionicons
              name="paw"
              size={20}
              color={nameError ? COLORS.error : petName.length >= 2 ? COLORS.success : COLORS.mediumGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter pet's name"
              placeholderTextColor={COLORS.mediumGray}
              value={petName}
              onChangeText={(text) => {
                setPetName(text);
                validateName(text);
              }}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {petName.length >= 2 && !nameError && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            )}
          </View>
          {nameError ? (
            <Text style={styles.errorText}>{nameError}</Text>
          ) : null}
        </Animated.View>

        {/* Photo Upload */}
        <Animated.View
          entering={FadeIn.delay(400).duration(600)}
          style={styles.photoSection}
        >
          <Text style={styles.sectionTitle}>Add their best photo</Text>
          <Text style={styles.sectionSubtitle}>(Optional - you can add more later)</Text>
          
          <View style={styles.photoContainer}>
            {petPhoto ? (
              <TouchableOpacity onPress={pickImage} style={styles.photoPreview}>
                <Image source={{ uri: petPhoto }} style={styles.photo} />
                <View style={styles.photoOverlay}>
                  <Ionicons name="camera" size={24} color={COLORS.white} />
                  <Text style={styles.changePhotoText}>Change</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoPlaceholder}>
                <LinearGradient
                  colors={[COLORS.softGray, COLORS.white]}
                  style={styles.photoGradientBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="camera-outline" size={40} color={COLORS.mediumGray} />
                </LinearGradient>
              </View>
            )}
            
            <View style={styles.photoButtons}>
              <TouchableOpacity onPress={takePhoto} style={styles.photoButton}>
                <LinearGradient
                  colors={[COLORS.lightCyan, COLORS.midCyan]}
                  style={styles.photoButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="camera" size={20} color={COLORS.white} />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
                <View style={styles.photoButtonOutline}>
                  <Ionicons name="images" size={20} color={COLORS.midCyan} />
                  <Text style={[styles.photoButtonText, { color: COLORS.midCyan }]}>
                    Choose Photo
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Species Selection */}
        <Animated.View
          entering={FadeIn.delay(500).duration(600)}
          style={styles.speciesSection}
        >
          <Text style={styles.sectionTitle}>What type of pet?</Text>
          <View style={styles.speciesGrid}>
            {SPECIES_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSpecies(option.id)}
                style={[
                  styles.speciesCard,
                  species === option.id && styles.speciesCardSelected,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.speciesContent}>
                  <option.component size={species === option.id ? 70 : 60} />
                  <Text style={[
                    styles.speciesLabel, 
                    species === option.id && styles.speciesLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Next Button */}
        <Animated.View
          entering={FadeIn.delay(600).duration(600)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!petName || !species) && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!petName || !species}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                petName && species
                  ? [COLORS.lightCyan, COLORS.midCyan]
                  : [COLORS.mediumGray, COLORS.mediumGray]
              }
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
          
          {!petPhoto && (
            <TouchableOpacity style={styles.skipPhotoButton}>
              <Text style={styles.skipPhotoText}>I'll add photos later</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={modalConfig.actions?.[0]?.onPress || (() => {})}
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
    paddingBottom: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    fontSize: 16,
    color: COLORS.deepNavy,
    marginLeft: 8,
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
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 30,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.softGray,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputSuccess: {
    borderColor: COLORS.success,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.deepNavy,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 16,
  },
  photoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changePhotoText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 2,
  },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photoGradientBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    maxWidth: 150,
  },
  photoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  photoButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.midCyan,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  speciesSection: {
    marginBottom: 40,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speciesCard: {
    width: (SCREEN_WIDTH - 74) / 2,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.softGray,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  speciesCardSelected: {
    borderColor: COLORS.lightCyan,
    backgroundColor: COLORS.softGray,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  speciesContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  speciesLabel: {
    fontSize: 14,
    color: COLORS.deepNavy,
    marginTop: 8,
    fontWeight: '600',
  },
  speciesLabelSelected: {
    color: COLORS.deepNavy,
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: 20,
  },
  nextButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  skipPhotoButton: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  skipPhotoText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textDecorationLine: 'underline',
  },
});