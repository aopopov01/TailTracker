/**
 * Pet Field Mapper Utility
 *
 * Handles conversion between onboarding data (camelCase) and database schema (snake_case)
 * Ensures proper field mapping from PetProfile (onboarding) to Pet (database) interface
 */

import { PetOnboardingData } from '../types/Pet';
import { Pet } from '../services/PetService';

// Re-export the interface for convenience
export type { PetOnboardingData } from '../types/Pet';

/**
 * Maps onboarding data (PetProfile/camelCase) to database format (Pet/snake_case)
 */
export const mapOnboardingToDatabase = (
  onboardingData: PetOnboardingData
): Partial<Pet> => {
  const mapped: Partial<Pet> = {};

  // Basic Information - handle null values explicitly
  if (onboardingData.name !== undefined) {
    mapped.name = onboardingData.name;
  }
  if (onboardingData.species !== undefined) {
    mapped.species = onboardingData.species;
  }

  // Physical Details
  if (onboardingData.breed !== undefined) mapped.breed = onboardingData.breed;
  if (onboardingData.gender !== undefined) {
    mapped.gender = onboardingData.gender;
  }
  if (onboardingData.color !== undefined) mapped.color = onboardingData.color;

  // Map colorMarkings (camelCase) to color_markings (snake_case)
  if (onboardingData.colorMarkings !== undefined) {
    mapped.color_markings = onboardingData.colorMarkings;
  }
  if (onboardingData.markings !== undefined) {
    mapped.color_markings = onboardingData.markings;
  }

  // Date of birth - handle both formats with better validation
  if (onboardingData.dateOfBirth !== undefined) {
    if (onboardingData.dateOfBirth === null) {
      mapped.date_of_birth = undefined;
    } else if (onboardingData.dateOfBirth instanceof Date) {
      // Check if date is valid before converting to ISO string
      if (!isNaN(onboardingData.dateOfBirth.getTime())) {
        mapped.date_of_birth = onboardingData.dateOfBirth.toISOString();
      } else {
        mapped.date_of_birth = undefined;
      }
    }
  } else if (onboardingData.date_of_birth !== undefined) {
    if (onboardingData.date_of_birth === null) {
      mapped.date_of_birth = undefined;
    } else if (onboardingData.date_of_birth instanceof Date) {
      // Check if date is valid before converting to ISO string
      if (!isNaN(onboardingData.date_of_birth.getTime())) {
        mapped.date_of_birth = onboardingData.date_of_birth.toISOString();
      } else {
        mapped.date_of_birth = undefined;
      }
    }
  }

  // Weight - convert to kg if needed, handle empty strings and undefined as null
  if (
    onboardingData.weight === undefined ||
    onboardingData.weight === '' ||
    onboardingData.weight === null
  ) {
    mapped.weight_kg = undefined;
  } else if (typeof onboardingData.weight === 'string') {
    // Try to parse if it's a string like "15 kg"
    const weightMatch = onboardingData.weight.match(/(\d+\.?\d*)\s*(kg|lbs)?/);
    if (weightMatch) {
      const value = parseFloat(weightMatch[1]);
      const unit = weightMatch[2] || 'kg';
      mapped.weight_kg = unit === 'lbs' ? Math.round(value * 0.453592) : value;
    } else {
      // Handle malformed weight strings by setting to undefined
      mapped.weight_kg = undefined;
    }
  } else if (typeof onboardingData.weight === 'object') {
    const { value, unit } = onboardingData.weight;
    mapped.weight_kg = unit === 'lbs' ? Math.round(value * 0.453592) : value;
  }

  // Official Records - removed identificationNumber/registration_number as per user request
  if (onboardingData.microchip_number !== undefined) {
    mapped.microchip_number = onboardingData.microchip_number;
  }
  if (onboardingData.microchipId !== undefined) {
    mapped.microchip_number = onboardingData.microchipId;
  }

  // Health Profile - Map medicalConditions to medical_conditions with null handling
  if (onboardingData.medicalConditions !== undefined) {
    mapped.medical_conditions = onboardingData.medicalConditions;
  }

  if (onboardingData.allergies !== undefined) {
    // NOTE: Database stores allergies as JSON string, onboarding has array
    mapped.allergies =
      onboardingData.allergies.length > 0
        ? JSON.stringify(onboardingData.allergies)
        : undefined; // NOTE: Pet interface uses undefined, not null
  }

  // Map specialNotes to special_notes - preserve empty strings
  if (onboardingData.specialNotes !== undefined) {
    mapped.special_notes = onboardingData.specialNotes;
  }

  // Personality & Care - Map to snake_case with null handling
  if (onboardingData.personalityTraits !== undefined) {
    mapped.personality_traits = onboardingData.personalityTraits;
  }

  if (onboardingData.favoriteActivities !== undefined) {
    mapped.favorite_activities = onboardingData.favoriteActivities;
  }

  if (onboardingData.exerciseNeeds) {
    mapped.exercise_needs = onboardingData.exerciseNeeds;
  }

  // Food preferences - map to individual fields
  if (onboardingData.foodPreferences) {
    if (onboardingData.foodPreferences.favorites?.length) {
      mapped.favorite_food =
        onboardingData.foodPreferences.favorites.join(', ');
    }
    if (onboardingData.foodPreferences.schedule) {
      mapped.feeding_schedule = onboardingData.foodPreferences.schedule;
    }
    if (onboardingData.foodPreferences.specialDiet?.length) {
      mapped.special_diet_notes =
        onboardingData.foodPreferences.specialDiet.join(', ');
    }
  }

  // Photo handling - map to database field name with backward compatibility
  if (onboardingData.photos && onboardingData.photos.length > 0) {
    mapped.photo_url = onboardingData.photos[0]; // Use first photo as profile photo
  } else if ((onboardingData as any).photoUrl) {
    // Support legacy photoUrl field from tests
    mapped.photo_url = (onboardingData as any).photoUrl;
  }

  // Meta fields
  if (onboardingData.user_id) mapped.user_id = onboardingData.user_id;

  // Set default status
  mapped.status = 'active';

  return mapped;
};

/**
 * Maps database data (Pet/snake_case) back to onboarding format (camelCase)
 * Useful for editing existing pets
 */
export const mapDatabaseToOnboarding = (petData: Pet): PetOnboardingData => {
  const mapped: PetOnboardingData = {
    name: petData.name || '',
    species: petData.species as 'dog' | 'cat' | 'bird' | 'other',
  };

  // Note: ID is not part of onboarding data as it's generated by the database

  // Physical Details - handle null values explicitly
  if (petData.breed !== undefined) mapped.breed = petData.breed;
  if (petData.gender !== undefined)
    mapped.gender = petData.gender as 'male' | 'female' | 'unknown';
  if (petData.color !== undefined) mapped.color = petData.color;

  // Map color_markings (snake_case) to colorMarkings (camelCase)
  if (petData.color_markings !== undefined) {
    mapped.colorMarkings = petData.color_markings;
  }

  // Date of birth - handle null
  if (petData.date_of_birth !== undefined) {
    if (petData.date_of_birth === null) {
      mapped.dateOfBirth = undefined;
    } else {
      mapped.dateOfBirth = new Date(petData.date_of_birth);
    }
  }

  // Weight - return as string format for compatibility with null handling
  if (petData.weight_kg !== undefined) {
    if (petData.weight_kg === null) {
      mapped.weight = undefined;
    } else {
      mapped.weight = `${petData.weight_kg} kg`;
    }
  }

  // Official Records - map microchip_number to microchipId for consistency
  if (petData.microchip_number !== undefined) {
    mapped.microchipId = petData.microchip_number;
  }

  // Health Profile - Map medical_conditions to medicalConditions with null handling
  if (petData.medical_conditions !== undefined) {
    mapped.medicalConditions = petData.medical_conditions;
  }

  if (petData.allergies !== undefined) {
    // NOTE: Database stores allergies as JSON string, PetProfile expects array
    mapped.allergies = petData.allergies
      ? typeof petData.allergies === 'string'
        ? JSON.parse(petData.allergies)
        : petData.allergies
      : [];
  }

  // Map special_notes to specialNotes
  if (petData.special_notes) {
    mapped.specialNotes = petData.special_notes;
  }

  // Personality & Care
  if (petData.personality_traits) {
    mapped.personalityTraits = petData.personality_traits;
  }

  if (petData.favorite_activities) {
    mapped.favoriteActivities = petData.favorite_activities;
  }

  if (petData.exercise_needs) {
    mapped.exerciseNeeds = petData.exercise_needs;
  }

  // Food preferences
  const foodPreferences: {
    favorites?: string[];
    schedule?: string;
    specialDiet?: string[];
  } = {};
  if (petData.favorite_food) {
    foodPreferences.favorites = petData.favorite_food.split(', ');
  }
  if (petData.feeding_schedule) {
    foodPreferences.schedule = petData.feeding_schedule;
  }
  if (petData.special_diet_notes) {
    foodPreferences.specialDiet = petData.special_diet_notes.split(', ');
  }
  if (Object.keys(foodPreferences).length > 0) {
    mapped.foodPreferences = foodPreferences;
  }

  // Photo handling - map from database field name with backward compatibility
  if (petData.photo_url) {
    mapped.photos = [petData.photo_url];
    // Add legacy photoUrl field for test compatibility
    (mapped as any).photoUrl = petData.photo_url;
  }

  // Meta fields
  mapped.user_id = petData.user_id;

  return mapped;
};

/**
 * Validates that all required fields for PetCard display are present
 */
export const validatePetCardFields = (petData: Pet): string[] => {
  const missingFields: string[] = [];

  if (!petData.name) missingFields.push('name');
  if (!petData.species) missingFields.push('species');

  return missingFields;
};

/**
 * Helper to create a database-ready pet object from onboarding data
 */
export const createDatabasePet = (
  onboardingData: PetOnboardingData,
  userId: string
): Partial<Pet> => {
  const mapped = mapOnboardingToDatabase(onboardingData);

  // Add required fields
  mapped.user_id = userId;
  mapped.created_by = userId;

  // Set timestamps
  const now = new Date().toISOString();
  mapped.created_at = now;
  mapped.updated_at = now;

  return mapped;
};
