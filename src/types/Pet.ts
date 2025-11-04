// Pet data model for TailTracker
export interface Pet {
  // Basic Information (Screen 3)
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  photos: string[];

  // Physical Details (Screen 4)
  breed?: string;
  dateOfBirth?: Date;
  age?: number; // Calculated or approximate
  approximateAge?: number; // Alternative for age
  useApproximateAge?: boolean; // Flag for using approximate age
  gender?: 'male' | 'female' | 'unknown';
  color?: string;
  colorMarkings?: string; // Alternative naming for color/markings
  markings?: string;
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  weightUnit?: 'kg' | 'lbs'; // Alternative flat structure
  height?: {
    value: number;
    unit: 'cm' | 'inches';
  };
  heightUnit?: 'cm' | 'inches'; // Alternative flat structure

  // Official Records (Screen 5)
  microchip_number?: string;
  registrationNumber?: string; // For compatibility with legacy code

  // Health Profile (Screen 6)
  medicalConditions?: string[];
  currentMedications?: {
    name: string;
    dosage?: string;
    frequency?: string;
  }[];
  allergies?: string[];
  lastVetVisit?: Date;
  testResults?: {
    date: Date;
    type: string;
    fileUrl?: string;
  }[];
  vaccinationStatus?: {
    vaccine: string;
    date: Date;
    nextDue?: Date;
  }[];

  // Personality & Care (Screen 7)
  personalityTraits?: string[]; // Array of personality traits
  foodPreferences?: {
    favorites?: string[];
    schedule?: string;
    specialDiet?: string[];
  };
  favoriteActivities?: string[];
  favoriteToys?: string[]; // Additional personality field
  favoriteFood?: string; // Flat alternative to foodPreferences.favorites
  exerciseNeeds?: 'low' | 'moderate' | 'high';
  feedingSchedule?: string; // Flat alternative to foodPreferences.schedule
  specialNotes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  medications?: string[]; // Simplified from currentMedications
  insuranceProvider?: string;
  insurancePolicyNumber?: string;

  // Additional premium features
  mood?: 'happy' | 'sad' | 'excited' | 'calm' | 'anxious' | 'unknown';
  health_status?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  activity_level?: 'low' | 'moderate' | 'high' | 'very_high';
  photo_url?: string;
  photoUrl?: string; // Alias for photo_url (camelCase compatibility)

  // Alternative naming for date of birth - Support both camelCase and snake_case
  date_of_birth?: Date;

  // Onboarding interface compatibility
  microchipId?: string;

  // Lost Pet Status
  status?: 'active' | 'lost' | 'found' | 'inactive' | 'deceased';
  lostPetId?: string; // Reference to lost pet report

  // Meta information
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  user_id: string; // Required for database compatibility
  profileCompleteness: number; // Percentage

  // Additional database fields
  behavioral_notes?: string;

  // Snake_case aliases for database compatibility
  color_markings?: string; // Alias for colorMarkings
  weight_kg?: number; // Alias for weight value
  special_notes?: string; // Alias for specialNotes
  favorite_food?: string; // Alias for favoriteFood
  exercise_needs?: 'low' | 'moderate' | 'high'; // Alias for exerciseNeeds
  personality_traits?: string[]; // Alias for personalityTraits
  favorite_activities?: string[]; // Alias for favoriteActivities
}

// PetProfile interface with explicit properties (no inheritance to avoid TypeScript caching issues)
export interface PetProfile {
  // Basic Information - all from Pet interface (optional for onboarding)
  name?: string;
  species?: 'dog' | 'cat' | 'bird' | 'other';
  photos?: string[];

  // Physical Details
  breed?: string;
  dateOfBirth?: Date;
  age?: number;
  approximateAge?: number;
  useApproximateAge?: boolean;
  gender?: 'male' | 'female' | 'unknown';
  color?: string;
  colorMarkings?: string;
  markings?: string;
  weightUnit?: 'kg' | 'lbs';
  heightUnit?: 'cm' | 'inches';

  // Official Records
  microchip_number?: string;
  registrationNumber?: string;

  // Health Profile
  medicalConditions?: string[];
  currentMedications?: {
    name: string;
    dosage?: string;
    frequency?: string;
  }[];
  allergies?: string[];
  lastVetVisit?: Date;
  testResults?: {
    date: Date;
    type: string;
    fileUrl?: string;
  }[];
  vaccinationStatus?: {
    vaccine: string;
    date: Date;
    nextDue?: Date;
  }[];

  // Personality & Care
  personalityTraits?: string[];
  foodPreferences?: {
    favorites?: string[];
    schedule?: string;
    specialDiet?: string[];
  };
  favoriteActivities?: string[];
  exerciseNeeds?: 'low' | 'moderate' | 'high';
  specialNotes?: string;

  // Additional premium features
  mood?: 'happy' | 'sad' | 'excited' | 'calm' | 'anxious' | 'unknown';
  health_status?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  activity_level?: 'low' | 'moderate' | 'high' | 'very_high';
  photo_url?: string;
  photoUrl?: string; // Alias for photo_url (camelCase compatibility)

  // Alternative naming for date of birth
  date_of_birth?: Date;

  // Onboarding interface compatibility
  microchipId?: string;

  // Lost Pet Status
  status?: 'active' | 'lost' | 'found' | 'inactive' | 'deceased';
  lostPetId?: string;

  // Additional database fields
  behavioral_notes?: string;

  // Meta information - optional for onboarding flow
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ownerId?: string;
  user_id?: string;
  profileCompleteness?: number;

  // Additional properties from PetIDCard and other components
  favoriteFood?: string;
  medications?: string[];
  feedingSchedule?: string;
  specialDietNotes?: string;

  // Support both string and object formats for weight and height
  weight?: string | { value: number; unit: 'kg' | 'lbs' };
  height?: string | { value: number; unit: 'cm' | 'inches' };

  // Missing properties for compatibility
  identificationNumber?: string;
}

// Onboarding state to track progress
export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  petData: Partial<Pet>;
  completedSteps: number[];
  skippedFields: string[];
}

// Unified onboarding data interface for field mapping
export interface PetOnboardingData {
  // Required fields
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';

  // Basic information
  photos?: string[];
  breed?: string;
  dateOfBirth?: Date;
  date_of_birth?: Date; // Support both formats
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  color?: string;
  colorMarkings?: string; // Maps to color_markings in database
  markings?: string;
  weight?: string | { value: number; unit: 'kg' | 'lbs' };
  height?: string | { value: number; unit: 'cm' | 'inches' };

  // Official Records - removed registrationNumber as per user request
  microchip_number?: string;
  microchipId?: string; // Alternative naming

  // Health Profile
  medicalConditions?: string[]; // Maps to medical_conditions in database
  currentMedications?: {
    name: string;
    dosage?: string;
    frequency?: string;
  }[];
  allergies?: string[];
  specialNotes?: string; // Maps to special_notes in database

  // Personality & Care
  personalityTraits?: string[]; // Maps to personality_traits in database
  favoriteActivities?: string[]; // Maps to favorite_activities in database
  exerciseNeeds?: 'low' | 'moderate' | 'high';
  foodPreferences?: {
    favorites?: string[];
    schedule?: string;
    specialDiet?: string[];
  };

  // Meta fields
  user_id?: string;
}

// Database pet data interface (snake_case format)
export interface DatabasePet {
  id?: string;
  user_id: string;
  name: string;
  species: string;
  breed?: string;
  color?: string;
  color_markings?: string; // Database field name
  gender?: string;
  date_of_birth?: string; // ISO string format
  weight_kg?: number;
  microchip_number?: string;

  // Health information
  medical_conditions?: string[]; // Database field name
  allergies?: string[];
  special_notes?: string; // Database field name

  // Personality & care
  personality_traits?: string[]; // Database field name
  favorite_activities?: string[]; // Database field name
  exercise_needs?: 'low' | 'moderate' | 'high';
  favorite_food?: string;
  feeding_schedule?: string;
  special_diet_notes?: string;

  // Status and metadata
  status: 'active' | 'lost' | 'found' | 'inactive' | 'deceased';
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
