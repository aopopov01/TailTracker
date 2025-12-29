/**
 * Pet Field Mapper Utility
 * Handles conversion between frontend (camelCase) and database (snake_case) formats
 */

import type { Pet, DatabasePet, PetProfile, PetSpecies, PetGender, ExerciseLevel, EmergencyContact } from '@tailtracker/shared-types';

/**
 * Extended pet data type that accepts both Pet and PetData formats
 * Uses 'any' for flexible array types to handle both string[] and object[] inputs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtendedPetInput = Partial<Pet> & {
  // PetData format fields (camelCase direct values)
  colorMarkings?: string;
  weightKg?: number;
  // Allow both string[] and object[] for health fields
  medicalConditions?: any[];
  currentMedications?: any[];
  // Emergency contact from PetData format
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
};

/**
 * Maps frontend pet data (camelCase) to database format (snake_case)
 * Handles both Pet type and PetData type inputs
 */
export const mapPetToDatabase = (pet: ExtendedPetInput, userId: string): Partial<DatabasePet> => {
  const mapped: Partial<DatabasePet> = {
    user_id: userId,
    status: pet.status || 'active',
  };

  // Basic Information
  if (pet.name !== undefined) mapped.name = pet.name;
  if (pet.species !== undefined) mapped.species = pet.species;

  // Physical Details
  if (pet.breed !== undefined) mapped.breed = pet.breed || null;
  if (pet.gender !== undefined) mapped.gender = pet.gender || null;
  if (pet.color !== undefined) mapped.color = pet.color || null;

  // Handle both Pet.markings and PetData.colorMarkings
  if (pet.markings !== undefined) mapped.color_markings = pet.markings || null;
  if (pet.colorMarkings !== undefined) mapped.color_markings = pet.colorMarkings || null;

  // Date of birth
  if (pet.dateOfBirth !== undefined) {
    mapped.date_of_birth = pet.dateOfBirth || null;
  }

  // Weight - Handle both Pet.weight (object) and PetData.weightKg (number)
  if (pet.weight !== undefined) {
    if (pet.weight && typeof pet.weight === 'object') {
      const { value, unit } = pet.weight;
      mapped.weight_kg = unit === 'lbs' ? Math.round(value * 0.453592 * 100) / 100 : value;
    }
  }
  if (pet.weightKg !== undefined) {
    mapped.weight_kg = pet.weightKg;
  }

  // Height - Handle both Pet.height (object) and PetData.height (string)
  if (pet.height !== undefined) {
    if (typeof pet.height === 'object') {
      mapped.height = `${pet.height.value} ${pet.height.unit}`;
    } else if (typeof pet.height === 'string') {
      mapped.height = pet.height || null;
    }
  }

  // Official Records
  if (pet.microchipNumber !== undefined) {
    mapped.microchip_number = pet.microchipNumber || null;
  }

  // Health Profile - Handle both array of objects and array of strings
  if (pet.medicalConditions !== undefined) {
    if (Array.isArray(pet.medicalConditions)) {
      if (pet.medicalConditions.length > 0) {
        if (typeof pet.medicalConditions[0] === 'string') {
          mapped.medical_conditions = pet.medicalConditions as string[];
        } else {
          mapped.medical_conditions = (pet.medicalConditions as { name: string }[]).map((c) => c.name);
        }
      } else {
        mapped.medical_conditions = undefined;
      }
    }
  }
  if (pet.currentMedications !== undefined) {
    if (Array.isArray(pet.currentMedications)) {
      if (pet.currentMedications.length > 0) {
        if (typeof pet.currentMedications[0] === 'string') {
          mapped.current_medications = pet.currentMedications as string[];
        } else {
          mapped.current_medications = (pet.currentMedications as { name: string }[]).map((m) => m.name);
        }
      } else {
        mapped.current_medications = undefined;
      }
    }
  }
  if (pet.allergies !== undefined) {
    if (Array.isArray(pet.allergies)) {
      mapped.allergies = pet.allergies.length > 0 ? pet.allergies.join(', ') : undefined;
    }
  }
  if (pet.specialNotes !== undefined) {
    mapped.special_notes = pet.specialNotes || null;
  }

  // Personality & Care
  if (pet.personalityTraits !== undefined) {
    mapped.personality_traits = pet.personalityTraits || null;
  }
  if (pet.favoriteActivities !== undefined) {
    mapped.favorite_activities = pet.favoriteActivities || null;
  }
  if (pet.exerciseNeeds !== undefined) {
    mapped.exercise_needs = pet.exerciseNeeds || null;
  }

  // Food preferences
  if (pet.foodPreferences !== undefined) {
    if (pet.foodPreferences?.favorites?.length) {
      mapped.favorite_food = pet.foodPreferences.favorites.join(', ');
    }
    if (pet.foodPreferences?.schedule) {
      mapped.feeding_schedule = pet.foodPreferences.schedule;
    }
    if (pet.foodPreferences?.specialDiet?.length) {
      mapped.special_diet_notes = pet.foodPreferences.specialDiet.join(', ');
    }
  }

  // Emergency Contact - Handle both Pet.emergencyContact (object) and PetData fields
  if (pet.emergencyContact !== undefined) {
    mapped.emergency_contact = pet.emergencyContact;
  }
  // Handle individual emergency contact fields from PetData/PetOnboardingData
  if (pet.emergencyContactName || pet.emergencyContactPhone || pet.emergencyContactEmail) {
    const emergencyContact: EmergencyContact = {};
    if (pet.emergencyContactName) emergencyContact.name = pet.emergencyContactName;
    if (pet.emergencyContactPhone) emergencyContact.phone = pet.emergencyContactPhone;
    if (pet.emergencyContactEmail) emergencyContact.email = pet.emergencyContactEmail;
    mapped.emergency_contact = emergencyContact;
  }

  // Last Checkup
  if (pet.lastCheckup !== undefined) {
    mapped.last_checkup = pet.lastCheckup || null;
  }

  // Photo
  if (pet.photos !== undefined && pet.photos.length > 0) {
    mapped.profile_photo_url = pet.photos[0];
  }

  // Public status
  if (pet.isPublic !== undefined) {
    mapped.is_public = pet.isPublic;
  }

  return mapped;
};

/**
 * Maps database pet data (snake_case) to frontend format (camelCase)
 */
export const mapDatabaseToPet = (dbPet: DatabasePet): Pet => {
  const pet: Pet = {
    id: dbPet.id || '',
    ownerId: dbPet.user_id,
    createdAt: dbPet.created_at || new Date().toISOString(),
    updatedAt: dbPet.updated_at || new Date().toISOString(),
    name: dbPet.name,
    species: dbPet.species as PetSpecies,
    photos: dbPet.profile_photo_url ? [dbPet.profile_photo_url] : [],
    status: dbPet.status,
    profileCompleteness: calculateProfileCompleteness(dbPet),
  };

  // Physical Details
  if (dbPet.breed) pet.breed = dbPet.breed;
  if (dbPet.gender) pet.gender = dbPet.gender as PetGender;
  if (dbPet.color) pet.color = dbPet.color;
  if (dbPet.color_markings) pet.markings = dbPet.color_markings;
  if (dbPet.date_of_birth) pet.dateOfBirth = dbPet.date_of_birth;

  // Weight
  if (dbPet.weight_kg) {
    pet.weight = { value: dbPet.weight_kg, unit: 'kg' };
  }

  // Height
  if (dbPet.height) {
    const match = dbPet.height.match(/(\d+\.?\d*)\s*(cm|inches)?/);
    if (match) {
      pet.height = {
        value: parseFloat(match[1]),
        unit: (match[2] as 'cm' | 'inches') || 'cm',
      };
    }
  }

  // Official Records
  if (dbPet.microchip_number) pet.microchipNumber = dbPet.microchip_number;

  // Health Profile
  if (dbPet.medical_conditions?.length) {
    pet.medicalConditions = dbPet.medical_conditions.map((name, idx) => ({
      id: `mc-${idx}`,
      name,
    }));
  }
  if (dbPet.current_medications?.length) {
    pet.currentMedications = dbPet.current_medications.map((name, idx) => ({
      id: `med-${idx}`,
      name,
    }));
  }
  if (dbPet.allergies) {
    pet.allergies = dbPet.allergies.split(',').map((a) => a.trim());
  }
  if (dbPet.special_notes) pet.specialNotes = dbPet.special_notes;

  // Personality & Care
  if (dbPet.personality_traits) pet.personalityTraits = dbPet.personality_traits;
  if (dbPet.favorite_activities) pet.favoriteActivities = dbPet.favorite_activities;
  if (dbPet.exercise_needs) pet.exerciseNeeds = dbPet.exercise_needs as ExerciseLevel;

  // Food preferences
  const foodPrefs: Pet['foodPreferences'] = {};
  if (dbPet.favorite_food) {
    foodPrefs.favorites = dbPet.favorite_food.split(',').map((f) => f.trim());
  }
  if (dbPet.feeding_schedule) {
    foodPrefs.schedule = dbPet.feeding_schedule;
  }
  if (dbPet.special_diet_notes) {
    foodPrefs.specialDiet = dbPet.special_diet_notes.split(',').map((d) => d.trim());
  }
  if (Object.keys(foodPrefs).length > 0) {
    pet.foodPreferences = foodPrefs;
  }

  // Emergency Contact
  if (dbPet.emergency_contact) {
    pet.emergencyContact = dbPet.emergency_contact as EmergencyContact;
  }

  // Last Checkup
  if (dbPet.last_checkup) {
    pet.lastCheckup = dbPet.last_checkup;
  }

  // Public status
  if (dbPet.is_public !== undefined) pet.isPublic = dbPet.is_public ?? false;

  return pet;
};

/**
 * Calculate profile completeness percentage
 */
export const calculateProfileCompleteness = (pet: Partial<DatabasePet>): number => {
  const fields = [
    pet.name,
    pet.species,
    pet.breed,
    pet.gender,
    pet.date_of_birth,
    pet.color,
    pet.weight_kg,
    pet.profile_photo_url,
    pet.personality_traits?.length,
    pet.favorite_activities?.length,
  ];

  const filledFields = fields.filter((f) => f !== null && f !== undefined && f !== '').length;
  return Math.round((filledFields / fields.length) * 100);
};

/**
 * Maps profile/onboarding data to database format
 */
export const mapProfileToDatabase = (
  profile: PetProfile,
  userId: string
): Partial<DatabasePet> => {
  return mapPetToDatabase(profile as Partial<Pet>, userId);
};

/**
 * Validates required fields for pet creation
 */
export const validatePetFields = (pet: Partial<Pet>): string[] => {
  const errors: string[] = [];

  if (!pet.name?.trim()) {
    errors.push('Pet name is required');
  }
  if (!pet.species) {
    errors.push('Pet species is required');
  }

  return errors;
};
