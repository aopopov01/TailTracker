/**
 * Pet Data Factory
 * Creates consistent mock data for testing across all test suites
 * Provides both onboarding and database format mock data
 */

import { PetOnboardingData } from '../../src/utils/petFieldMapper';
import { Pet } from '../../src/services/PetService';

// Counter for generating unique IDs
let idCounter = 1;
const generateId = () => `test-${Date.now()}-${idCounter++}`;

/**
 * Creates mock onboarding data with customizable overrides
 */
export const createMockOnboardingData = (
  overrides: Partial<PetOnboardingData> = {}
): PetOnboardingData => {
  const baseData: PetOnboardingData = {
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    color: 'Golden',
    colorMarkings: 'Golden with white chest',
    dateOfBirth: new Date('2020-01-15'),
    weight: '25 kg',
    microchipId: '123456789012345',
    medicalConditions: ['Hip dysplasia'],
    allergies: ['Chicken'],
    currentMedications: [{ name: 'Heartworm prevention' }],
    personalityTraits: ['Friendly', 'Energetic'],
    favoriteActivities: ['Fetch', 'Swimming'],
    exerciseNeeds: 'high',
    specialNotes: 'Loves car rides',
    foodPreferences: {
      favorites: ['Chicken', 'Rice'],
      schedule: 'Twice daily',
      specialDiet: ['Grain-free'],
    },
    photos: ['https://example.com/photo1.jpg'],
    user_id: 'user-123',
  };

  return { ...baseData, ...overrides };
};

/**
 * Creates mock database pet data with customizable overrides
 */
export const createMockDatabasePet = (overrides: Partial<Pet> = {}): Pet => {
  const id = generateId();
  const now = new Date().toISOString();

  const baseData: Pet = {
    id,
    user_id: 'user-123',
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    color: 'Golden',
    color_markings: 'Golden with white chest',
    date_of_birth: '2020-01-15T00:00:00.000Z',
    weight_kg: 25,
    microchip_number: '123456789012345',
    status: 'active',
    medical_conditions: ['Hip dysplasia'],
    allergies: JSON.stringify(['Chicken']), // NOTE: allergies stored as JSON string in database
    personality_traits: ['Friendly', 'Energetic'],
    favorite_activities: ['Fetch', 'Swimming'],
    exercise_needs: 'high',
    favorite_food: 'Chicken, Rice',
    feeding_schedule: 'Twice daily',
    special_diet_notes: 'Grain-free',
    special_notes: 'Loves car rides',
    photo_url: 'https://example.com/photo1.jpg',
    created_by: 'user-123',
    created_at: now,
    updated_at: now,
  };

  return { ...baseData, ...overrides };
};

/**
 * Creates minimal pet data with only required fields
 */
export const createMinimalPet = (overrides: Partial<Pet> = {}): Pet => {
  const id = generateId();
  const now = new Date().toISOString();

  const minimalData: Pet = {
    id,
    user_id: 'user-123',
    name: 'Simple Pet',
    species: 'cat',
    status: 'active',
    created_by: 'user-123',
    created_at: now,
    updated_at: now,
  };

  return { ...minimalData, ...overrides };
};

/**
 * Pet species-specific data factories
 */
export const petSpeciesFactories = {
  dog: (overrides: Partial<PetOnboardingData> = {}): PetOnboardingData =>
    createMockOnboardingData({
      species: 'dog',
      breed: 'Golden Retriever',
      favoriteActivities: ['Fetch', 'Long walks', 'Swimming'],
      exerciseNeeds: 'high',
      ...overrides,
    }),

  cat: (overrides: Partial<PetOnboardingData> = {}): PetOnboardingData =>
    createMockOnboardingData({
      species: 'cat',
      breed: 'Maine Coon',
      favoriteActivities: ['Laser pointer', 'Window watching', 'Catnip toys'],
      exerciseNeeds: 'moderate',
      ...overrides,
    }),

  bird: (overrides: Partial<PetOnboardingData> = {}): PetOnboardingData =>
    createMockOnboardingData({
      species: 'bird',
      breed: 'Cockatiel',
      favoriteActivities: ['Singing', 'Perch swinging', 'Foraging'],
      exerciseNeeds: 'moderate',
      weight: '100 g',
      ...overrides,
    }),

  other: (overrides: Partial<PetOnboardingData> = {}): PetOnboardingData =>
    createMockOnboardingData({
      species: 'other',
      breed: 'Rabbit',
      favoriteActivities: ['Hopping', 'Digging', 'Hiding'],
      exerciseNeeds: 'moderate',
      weight: '2 kg',
      ...overrides,
    }),
};

/**
 * Creates an array of multiple pets for list testing
 */
export const createMockPetList = (count: number = 3): Pet[] => {
  const pets: Pet[] = [];

  for (let i = 0; i < count; i++) {
    const species = ['dog', 'cat', 'bird'][i % 3] as 'dog' | 'cat' | 'bird';
    pets.push(
      createMockDatabasePet({
        name: `Pet ${i + 1}`,
        species,
        user_id: `user-${i + 1}`,
      })
    );
  }

  return pets;
};

/**
 * Health-specific pet data for testing medical features
 */
export const createPetWithHealthIssues = (
  overrides: Partial<Pet> = {}
): Pet => {
  return createMockDatabasePet({
    medical_conditions: [
      'Hip dysplasia',
      'Allergies',
      'Heart murmur',
      'Diabetes',
    ],
    allergies: JSON.stringify(['Chicken', 'Beef', 'Wheat', 'Dairy']), // NOTE: allergies stored as JSON string in database
    special_notes:
      'Requires daily insulin injections. Monitor for allergic reactions.',
    ...overrides,
  });
};

/**
 * Creates pet data with missing optional fields for testing null handling
 */
export const createPartialPet = (overrides: Partial<Pet> = {}): Pet => {
  return createMockDatabasePet({
    breed: undefined,
    weight_kg: undefined,
    date_of_birth: undefined,
    allergies: undefined,
    medical_conditions: undefined,
    photo_url: undefined,
    special_notes: undefined,
    ...overrides,
  });
};

/**
 * Error scenario test data
 */
export const createInvalidPetData = (): Partial<Pet> => {
  return {
    // Missing required fields
    name: '',
    species: '',
    user_id: '',
  };
};

/**
 * Test data for specific user scenarios
 */
export const userScenarios = {
  freeUser: {
    userId: 'free-user-123',
    pets: [createMockDatabasePet({ user_id: 'free-user-123' })],
    maxPets: 1,
  },

  premiumUser: {
    userId: 'premium-user-456',
    pets: createMockPetList(2).map(pet => ({
      ...pet,
      user_id: 'premium-user-456',
    })),
    maxPets: 2,
  },

  proUser: {
    userId: 'pro-user-789',
    pets: createMockPetList(5).map(pet => ({
      ...pet,
      user_id: 'pro-user-789',
    })),
    maxPets: -1, // unlimited
  },
};

/**
 * API response mock factories
 */
export const apiResponseFactories = {
  success: (data: any) => ({
    success: true,
    data,
    error: null,
  }),

  error: (message: string, code?: string) => ({
    success: false,
    data: null,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
    },
  }),

  validationError: (fields: string[]) => ({
    success: false,
    data: null,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      fields,
    },
  }),
};

/**
 * Creates test data for different lifecycle stages
 */
export const lifecycleTestData = {
  onboarding: createMockOnboardingData(),
  saved: createMockDatabasePet(),
  updated: createMockDatabasePet({
    name: 'Updated Pet Name',
    updated_at: new Date().toISOString(),
  }),
  lost: createMockDatabasePet({ status: 'lost' }),
  found: createMockDatabasePet({ status: 'found' }),
  deceased: createMockDatabasePet({ status: 'deceased' }),
};

/**
 * Mock Supabase response formats
 */
export const supabaseResponseFactories = {
  select: (data: any[]) => ({
    data,
    error: null,
  }),

  single: (data: any) => ({
    data,
    error: null,
  }),

  insert: (data: any) => ({
    data: [data],
    error: null,
  }),

  update: (data: any) => ({
    data: [data],
    error: null,
  }),

  delete: () => ({
    data: [],
    error: null,
  }),

  error: (message: string, code?: string) => ({
    data: null,
    error: {
      message,
      code: code || 'SUPABASE_ERROR',
      details: null,
      hint: null,
    },
  }),
};

/**
 * Creates realistic test scenarios for integration testing
 */
export const integrationScenarios = {
  newUserOnboarding: {
    user: { id: 'new-user-123', email: 'test@example.com' },
    onboardingData: createMockOnboardingData({ user_id: 'new-user-123' }),
    expectedDatabasePet: createMockDatabasePet({ user_id: 'new-user-123' }),
  },

  existingUserAddingPet: {
    user: { id: 'existing-user-456', email: 'existing@example.com' },
    existingPets: [createMockDatabasePet({ user_id: 'existing-user-456' })],
    newPetData: createMockOnboardingData({
      user_id: 'existing-user-456',
      name: 'Second Pet',
      species: 'cat',
    }),
  },

  dataUpdateFlow: {
    originalPet: createMockDatabasePet(),
    updatedData: createMockOnboardingData({
      name: 'Updated Name',
      weight: '30 kg',
      medicalConditions: ['Hip dysplasia', 'New condition'],
    }),
  },
};

export default {
  createMockOnboardingData,
  createMockDatabasePet,
  createMinimalPet,
  petSpeciesFactories,
  createMockPetList,
  createPetWithHealthIssues,
  createPartialPet,
  createInvalidPetData,
  userScenarios,
  apiResponseFactories,
  lifecycleTestData,
  supabaseResponseFactories,
  integrationScenarios,
};
