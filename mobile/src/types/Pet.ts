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
  gender?: 'male' | 'female' | 'unknown';
  color?: string;
  markings?: string;
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  height?: {
    value: number;
    unit: 'cm' | 'inches';
  };
  
  // Official Records (Screen 5)
  registrationNumber?: string;
  microchip_number?: string;
  
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
  
  // Emergency contact information
  emergency_contact_name?: string;
  
  // Alternative naming for date of birth
  date_of_birth?: Date;
  
  // Lost Pet Status
  status?: 'active' | 'lost' | 'found' | 'inactive' | 'deceased';
  lostPetId?: string; // Reference to lost pet report
  
  // Meta information
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  profileCompleteness: number; // Percentage
}

// Onboarding state to track progress
export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  petData: Partial<Pet>;
  completedSteps: number[];
  skippedFields: string[];
}