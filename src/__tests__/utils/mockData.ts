/**
 * Mock Data Generators for Tests
 * Provides consistent test data for onboarding flow and pet profile testing
 */

export interface MockPetData {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'fish' | 'reptile' | 'other';
  breed: string;
  age: string;
  weight: string;
  color: string;
  gender: 'male' | 'female';
  microchip_id?: string;
  personality_traits: string[];
  favorite_activities: string[];
  exercise_needs: 'low' | 'medium' | 'high';
  medical_conditions: string[];
  dietary_restrictions: string[];
  is_spayed_neutered: boolean;
  date_of_birth: string;
  care_instructions: string;
  emergency_contact: string;
  emergency_phone: string;
  photo_url?: string;
}

export interface MockUserData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  location: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  preferred_vet_clinic: string;
  subscription_tier: 'free' | 'premium' | 'pro';
}

// Species-specific activity mappings for testing
export const SPECIES_ACTIVITIES = {
  dog: [
    'Playing Fetch',
    'Long Walks',
    'Dog Parks',
    'Swimming',
    'Running',
    'Hiking',
  ],
  cat: [
    'Laser Pointer',
    'Window Bird Watching',
    'Catnip Toys',
    'Climbing Trees',
    'Interactive Toys',
  ],
  bird: [
    'Foraging Games',
    'Talking/Mimicking',
    'Perch Swinging',
    'Flying Time',
    'Social Interaction',
  ],
  fish: ['Swimming', 'Feeding Time', 'Tank Exploration'],
  reptile: ['Basking', 'Climbing', 'Hiding', 'Temperature Regulation'],
  other: ['Playing', 'Exploring', 'Social Time', 'Exercise'],
} as const;

// Common personality traits for testing
export const PERSONALITY_TRAITS = [
  'Playful',
  'Calm',
  'Energetic',
  'Friendly',
  'Independent',
  'Affectionate',
  'Protective',
  'Curious',
  'Gentle',
  'Intelligent',
] as const;

// Medical conditions for testing
export const MEDICAL_CONDITIONS = [
  'Allergies',
  'Arthritis',
  'Heart Disease',
  'Diabetes',
  'Hip Dysplasia',
  'Skin Conditions',
  'Eye Problems',
  'Dental Issues',
  'Kidney Disease',
] as const;

// Dietary restrictions for testing
export const DIETARY_RESTRICTIONS = [
  'Grain-Free',
  'Low Fat',
  'High Protein',
  'Limited Ingredient',
  'Prescription Diet',
  'No Chicken',
  'No Beef',
  'Senior Formula',
] as const;

/**
 * Generate complete mock pet data for onboarding tests
 */
export const generateMockPetData = (
  overrides: Partial<MockPetData> = {}
): MockPetData => {
  const species = overrides.species || 'dog';
  const speciesActivities = SPECIES_ACTIVITIES[species];

  const baseData: MockPetData = {
    name: 'Test Pet',
    species,
    breed:
      species === 'dog'
        ? 'Golden Retriever'
        : species === 'cat'
          ? 'Persian'
          : species === 'bird'
            ? 'Parrot'
            : 'Mixed',
    age: '2 years',
    weight:
      species === 'dog'
        ? '30 kg'
        : species === 'cat'
          ? '4 kg'
          : species === 'bird'
            ? '0.5 kg'
            : '1 kg',
    color: 'Brown',
    gender: 'male',
    microchip_id: '123456789012345',
    personality_traits: ['Playful', 'Friendly'],
    favorite_activities: speciesActivities.slice(0, 2),
    exercise_needs: 'medium',
    medical_conditions: [],
    dietary_restrictions: [],
    is_spayed_neutered: true,
    date_of_birth: '2022-01-15',
    care_instructions: 'Feed twice daily, regular exercise',
    emergency_contact: 'Jane Doe',
    emergency_phone: '+1234567890',
    photo_url: 'https://example.com/pet-photo.jpg',
  };

  return { ...baseData, ...overrides };
};

/**
 * Generate mock pet data for different species
 */
export const generateDogData = (
  overrides: Partial<MockPetData> = {}
): MockPetData => {
  return generateMockPetData({
    species: 'dog',
    breed: 'Golden Retriever',
    weight: '30 kg',
    exercise_needs: 'high',
    favorite_activities: ['Playing Fetch', 'Long Walks'],
    ...overrides,
  });
};

export const generateCatData = (
  overrides: Partial<MockPetData> = {}
): MockPetData => {
  return generateMockPetData({
    species: 'cat',
    breed: 'Persian',
    weight: '4 kg',
    exercise_needs: 'low',
    favorite_activities: ['Laser Pointer', 'Window Bird Watching'],
    ...overrides,
  });
};

export const generateBirdData = (
  overrides: Partial<MockPetData> = {}
): MockPetData => {
  return generateMockPetData({
    species: 'bird',
    breed: 'Parrot',
    weight: '0.5 kg',
    exercise_needs: 'medium',
    favorite_activities: ['Foraging Games', 'Talking/Mimicking'],
    ...overrides,
  });
};

/**
 * Generate minimal pet data (required fields only)
 */
export const generateMinimalPetData = (): MockPetData => {
  return {
    name: 'Minimal Pet',
    species: 'dog',
    breed: '',
    age: '',
    weight: '',
    color: '',
    gender: 'male',
    personality_traits: [],
    favorite_activities: [],
    exercise_needs: 'medium',
    medical_conditions: [],
    dietary_restrictions: [],
    is_spayed_neutered: false,
    date_of_birth: '',
    care_instructions: '',
    emergency_contact: '',
    emergency_phone: '',
  };
};

/**
 * Generate mock user data
 */
export const generateMockUserData = (
  overrides: Partial<MockUserData> = {}
): MockUserData => {
  const baseData: MockUserData = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'John Doe',
    phone: '+1234567890',
    location: 'New York, NY',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '+0987654321',
    preferred_vet_clinic: 'City Veterinary Clinic',
    subscription_tier: 'free',
  };

  return { ...baseData, ...overrides };
};

/**
 * Generate mock data for different subscription tiers
 */
export const generateFreeUserData = (): MockUserData => {
  return generateMockUserData({ subscription_tier: 'free' });
};

export const generatePremiumUserData = (): MockUserData => {
  return generateMockUserData({ subscription_tier: 'premium' });
};

export const generateProUserData = (): MockUserData => {
  return generateMockUserData({ subscription_tier: 'pro' });
};

/**
 * Generate expected database parameters for PetService.upsertPetFromOnboarding
 */
export const generateExpectedDatabaseParams = (petData: MockPetData) => {
  return {
    p_name: petData.name,
    p_species: petData.species,
    p_breed: petData.breed,
    p_age: petData.age,
    p_weight: petData.weight,
    p_color: petData.color,
    p_gender: petData.gender,
    p_microchip_id: petData.microchip_id || null,
    p_personality_traits: petData.personality_traits,
    p_favorite_activities: petData.favorite_activities,
    p_exercise_needs: petData.exercise_needs,
    p_medical_conditions: petData.medical_conditions,
    p_dietary_restrictions: petData.dietary_restrictions,
    p_is_spayed_neutered: petData.is_spayed_neutered,
    p_birth_date: petData.date_of_birth || null,
    p_care_instructions: petData.care_instructions,
    p_emergency_contact: petData.emergency_contact,
    p_emergency_phone: petData.emergency_phone,
    p_photo_url: petData.photo_url || null,
  };
};

/**
 * Generate test data with edge cases
 */
export const generateEdgeCaseData = () => {
  return {
    emptyStrings: generateMockPetData({
      name: '',
      breed: '',
      care_instructions: '',
    }),

    specialCharacters: generateMockPetData({
      name: "Max's Pet & Co. (2024)",
      breed: 'Mix: German Shepherd / Golden Retriever',
      care_instructions: 'Feed @ 8AM & 6PM - avoid chocolate/grapes!',
    }),

    maxLengthStrings: generateMockPetData({
      name: 'A'.repeat(100),
      breed: 'B'.repeat(100),
      care_instructions: 'C'.repeat(1000),
    }),

    unicodeCharacters: generateMockPetData({
      name: 'Λύκος', // Greek
      breed: '柴犬', // Japanese
      care_instructions: 'Cuidado especial con la comida', // Spanish
    }),

    largeArrays: generateMockPetData({
      personality_traits: PERSONALITY_TRAITS.slice(),
      favorite_activities: SPECIES_ACTIVITIES.dog.slice(),
      medical_conditions: MEDICAL_CONDITIONS.slice(),
      dietary_restrictions: DIETARY_RESTRICTIONS.slice(),
    }),
  };
};

/**
 * Field mapping verification data
 */
export const FIELD_MAPPINGS_TEST_DATA = {
  onboardingToDatabaseMapping: {
    name: 'p_name',
    species: 'p_species',
    breed: 'p_breed',
    age: 'p_age',
    weight: 'p_weight',
    color: 'p_color',
    gender: 'p_gender',
    microchip_id: 'p_microchip_id',
    personality_traits: 'p_personality_traits',
    favorite_activities: 'p_favorite_activities',
    exercise_needs: 'p_exercise_needs',
    medical_conditions: 'p_medical_conditions',
    dietary_restrictions: 'p_dietary_restrictions',
    is_spayed_neutered: 'p_is_spayed_neutered',
    date_of_birth: 'p_birth_date',
    care_instructions: 'p_care_instructions',
    emergency_contact: 'p_emergency_contact',
    emergency_phone: 'p_emergency_phone',
    photo_url: 'p_photo_url',
  },

  databaseToDashboardMapping: {
    p_name: 'name',
    p_species: 'species',
    p_breed: 'breed',
    p_birth_date: 'birth_date',
    p_weight: 'weight',
    p_color: 'color',
    p_personality_traits: 'personality_traits',
    p_exercise_needs: 'exercise_needs',
    p_medical_conditions: 'medical_conditions',
  },
};
