/**
 * Pet Profile Service - Maps between onboarding PetProfile and database Pet interfaces
 * Handles the conversion and synchronization between the onboarding wizard data structure
 * and the Supabase database schema
 */

import { petService, Pet } from './PetService';
import { PetProfile } from '@/types/Pet';
import { supabase } from '@/lib/supabase';

export interface DatabasePet extends Pet {
  // Additional display fields
  weight_display?: string;
  height_display?: string;
  // NOTE: identification_number removed - doesn't exist in database
  // NOTE: All other fields inherited from Pet interface which matches database
  special_notes?: string;
}

class PetProfileService {
  /**
   * Convert PetProfile (from onboarding) to database Pet format
   */
  private mapPetProfileToDatabase(
    profile: PetProfile,
    familyId: string | null
  ): Partial<DatabasePet> {
    // Extract numeric weight from weight string or object with unit conversion
    const extractWeight = (
      weight?: string | { value: number; unit: string }
    ): number | undefined => {
      if (!weight) return undefined;
      if (typeof weight === 'object') {
        const { value, unit } = weight;
        return unit === 'lbs' ? Math.round(value * 0.453592) : value;
      }
      // Try to parse if it's a string like "25 lbs" or "15 kg"
      const weightMatch = weight.match(/(\d+\.?\d*)\s*(kg|lbs)?/);
      if (weightMatch) {
        const value = parseFloat(weightMatch[1]);
        const unit = weightMatch[2] || 'kg';
        return unit === 'lbs' ? Math.round(value * 0.453592) : value;
      }
      return undefined;
    };

    // Convert height to string format for database
    const formatHeight = (
      height?: string | { value: number; unit: string }
    ): string | undefined => {
      if (!height) return undefined;
      if (typeof height === 'string') return height;
      return `${height.value} ${height.unit}`;
    };

    console.log('🔄 Mapping PetProfile to Database format:');
    console.log('  Input profile:', JSON.stringify(profile, null, 2));

    const mapped = {
      name: profile.name,
      species: profile.species || 'other',
      breed: profile.breed || undefined,
      color_markings: profile.colorMarkings || undefined,
      weight_kg: extractWeight(profile.weight),
      height: formatHeight(profile.height),

      // Health information - medical_conditions and medications are arrays, allergies is JSON string
      medical_conditions: profile.medicalConditions || [],
      allergies:
        profile.allergies && profile.allergies.length > 0
          ? JSON.stringify(profile.allergies)
          : null,
      current_medications: profile.medications || [],
      special_notes: profile.specialNotes || undefined,

      // Personality and care - Keep as arrays to match database schema
      personality_traits: profile.personalityTraits || [],
      favorite_activities: profile.favoriteActivities || [],
      exercise_needs: profile.exerciseNeeds || undefined,
      favorite_food: profile.favoriteFood || undefined,
      feeding_schedule: profile.feedingSchedule || undefined,
      special_diet_notes: profile.specialDietNotes || undefined,

      // Additional fields from PetProfile interface
      microchip_number: profile.microchipId || undefined,
      // NOTE: identification_number removed - doesn't exist in database

      // Photo - handle both photos array and photo_url field for backward compatibility
      photo_url: (() => {
        // Support both photoUrl (string) and photos (array) for test compatibility
        if (profile.photos && profile.photos.length > 0) {
          return profile.photos[0];
        }
        if (profile.photo_url) {
          return profile.photo_url;
        }
        // Check for legacy photoUrl field from tests
        if ((profile as any).photoUrl) {
          return (profile as any).photoUrl;
        }
        return undefined;
      })(),

      // Dates - Fix dateOfBirth mapping with proper validation
      date_of_birth: (() => {
        if (
          profile.dateOfBirth &&
          profile.dateOfBirth instanceof Date &&
          !isNaN(profile.dateOfBirth.getTime())
        ) {
          return profile.dateOfBirth.toISOString().split('T')[0];
        } else if (
          profile.date_of_birth &&
          profile.date_of_birth instanceof Date &&
          !isNaN(profile.date_of_birth.getTime())
        ) {
          return profile.date_of_birth.toISOString().split('T')[0];
        }
        return undefined;
      })(),

      status: 'active' as const,
    };

    console.log(
      '  Mapped to database format:',
      JSON.stringify(mapped, null, 2)
    );
    console.log(
      '  Non-null/undefined fields:',
      Object.entries(mapped)
        .filter(([key, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          return value !== null && value !== undefined && value !== '';
        })
        .map(([key]) => key)
    );

    return mapped as Partial<DatabasePet>;
  }

  /**
   * Convert database Pet to PetProfile format for display
   */
  private mapDatabaseToPetProfile(pet: DatabasePet): PetProfile {
    return {
      id: pet.id,
      name: pet.name,
      species: pet.species as 'dog' | 'cat' | 'bird' | 'other',
      breed: pet.breed || undefined,
      weight: pet.weight_kg ? `${pet.weight_kg} kg` : undefined,
      colorMarkings: pet.color_markings || undefined,
      height: pet.height || undefined,

      // Health information - medical_conditions and medications are arrays, allergies is JSON string
      medicalConditions: pet.medical_conditions || [],
      allergies: pet.allergies
        ? typeof pet.allergies === 'string'
          ? JSON.parse(pet.allergies)
          : pet.allergies
        : [],
      medications: pet.current_medications || [],
      specialNotes: pet.special_notes || undefined,

      // Personality and care - arrays are stored as arrays in database
      personalityTraits: pet.personality_traits || [],
      favoriteActivities: pet.favorite_activities || [],
      exerciseNeeds:
        (pet.exercise_needs as 'low' | 'moderate' | 'high') || undefined,
      favoriteFood: pet.favorite_food || undefined,
      feedingSchedule: pet.feeding_schedule || undefined,
      specialDietNotes: pet.special_diet_notes || undefined,

      // Additional fields from database
      microchipId: pet.microchip_number || undefined,
      // NOTE: identificationNumber removed - doesn't exist in database

      // Photo - map back to photos array and include photoUrl for test compatibility
      photos: pet.photo_url ? [pet.photo_url] : undefined,
      photo_url: pet.photo_url || undefined, // Keep original field
      ...(pet.photo_url && { photoUrl: pet.photo_url }), // Add legacy photoUrl field for tests

      // Dates - Support both dateOfBirth and date_of_birth
      dateOfBirth: pet.date_of_birth ? new Date(pet.date_of_birth) : undefined,
      date_of_birth: pet.date_of_birth
        ? new Date(pet.date_of_birth)
        : undefined,
      createdAt: new Date(pet.created_at),
      updatedAt: new Date(pet.updated_at),
    };
  }

  /**
   * Save pet profile from onboarding wizard to database
   */
  async savePetProfile(
    profile: PetProfile
  ): Promise<{ success: boolean; pet?: PetProfile; error?: string }> {
    try {
      console.log(
        '🔥 PetProfileService.savePetProfile called with profile:',
        JSON.stringify(profile, null, 2)
      );

      // Get current user and family information
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.error('❌ User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Convert profile to database format (no family required for basic onboarding)
      const petData = this.mapPetProfileToDatabase(profile, null);
      console.log('🔄 Mapped pet data:', JSON.stringify(petData, null, 2));

      // Add user_id separately since it's not part of the Pet interface
      const insertData = {
        ...petData,
        user_id: userRecord.id,
      } as any; // Type assertion needed due to Partial<DatabasePet> + user_id combination
      console.log('📥 Final insert data:', JSON.stringify(insertData, null, 2));

      // Save to database using enhanced insert with new fields
      const { data: pet, error } = await supabase
        .from('pets')
        .insert(insertData)
        .select(
          `
          id,
          name,
          species,
          breed,
          color_markings,
          weight_kg,
          height,
          microchip_number,
          medical_conditions,
          allergies,
          current_medications,
          special_notes,
          personality_traits,
          favorite_activities,
          exercise_needs,
          favorite_food,
          feeding_schedule,
          special_diet_notes,
          profile_photo_url,
          date_of_birth,
          status,
          user_id,
          created_at,
          updated_at
        `
        )
        .single();

      if (error) {
        console.error('Database error:', error);
        return { success: false, error: error.message };
      }

      // Convert back to PetProfile format
      const savedProfile = this.mapDatabaseToPetProfile(pet as DatabasePet);

      return { success: true, pet: savedProfile };
    } catch (error: any) {
      console.error('Error saving pet profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all pets for current user as PetProfile format
   */
  async getPetProfiles(): Promise<PetProfile[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) return [];

      // Get pets with correct database fields
      const { data: pets, error } = await supabase
        .from('pets')
        .select(
          `
          id,
          name,
          species,
          breed,
          color_markings,
          weight_kg,
          height,
          microchip_number,
          medical_conditions,
          allergies,
          current_medications,
          special_notes,
          personality_traits,
          favorite_activities,
          exercise_needs,
          favorite_food,
          feeding_schedule,
          special_diet_notes,
          profile_photo_url,
          date_of_birth,
          status,
          user_id,
          created_at,
          updated_at
        `
        )
        .eq('user_id', userRecord.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pets:', error);
        return [];
      }

      return (pets || []).map(pet =>
        this.mapDatabaseToPetProfile(pet as DatabasePet)
      );
    } catch (error) {
      console.error('Error getting pet profiles:', error);
      return [];
    }
  }

  /**
   * Get a specific pet profile by ID
   */
  async getPetProfile(petId: string): Promise<PetProfile | null> {
    try {
      const { data: pet, error } = await supabase
        .from('pets')
        .select(
          `
          id,
          name,
          species,
          breed,
          color_markings,
          weight_kg,
          height,
          microchip_number,
          medical_conditions,
          allergies,
          current_medications,
          special_notes,
          personality_traits,
          favorite_activities,
          exercise_needs,
          favorite_food,
          feeding_schedule,
          special_diet_notes,
          profile_photo_url,
          date_of_birth,
          status,
          user_id,
          created_at,
          updated_at
        `
        )
        .eq('id', petId)
        .is('deleted_at', null)
        .single();

      if (error || !pet) {
        console.error('Error fetching pet profile:', error);
        return null;
      }

      return this.mapDatabaseToPetProfile(pet as DatabasePet);
    } catch (error) {
      console.error('Error getting pet profile:', error);
      return null;
    }
  }

  /**
   * Update a pet profile
   */
  async updatePetProfile(
    petId: string,
    profile: Partial<PetProfile>
  ): Promise<{ success: boolean; pet?: PetProfile; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Convert partial profile to database format
      const updateData = this.mapPetProfileToDatabase(
        profile as PetProfile,
        ''
      );

      const { data: pet, error } = await supabase
        .from('pets')
        .update(updateData)
        .eq('id', petId)
        .select(
          `
          id,
          name,
          species,
          breed,
          color_markings,
          weight_kg,
          height,
          microchip_number,
          medical_conditions,
          allergies,
          current_medications,
          special_notes,
          personality_traits,
          favorite_activities,
          exercise_needs,
          favorite_food,
          feeding_schedule,
          special_diet_notes,
          profile_photo_url,
          date_of_birth,
          status,
          user_id,
          created_at,
          updated_at
        `
        )
        .single();

      if (error || !pet) {
        console.error('Error updating pet profile:', error);
        return { success: false, error: error?.message || 'Update failed' };
      }

      const updatedProfile = this.mapDatabaseToPetProfile(pet as DatabasePet);
      return { success: true, pet: updatedProfile };
    } catch (error: any) {
      console.error('Error updating pet profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a pet profile
   */
  async deletePetProfile(
    petId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      const { error } = await supabase
        .from('pets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', petId);

      if (error) {
        console.error('Error deleting pet profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting pet profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load a pet profile by ID (alias for getPetProfile)
   */
  async loadPetProfile(petId: string): Promise<PetProfile | null> {
    return this.getPetProfile(petId);
  }

  /**
   * Generate a unique identification number for a pet
   */
  generateIdentificationNumber(): string {
    const prefix = 'TR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
  }
}

export { PetProfileService };
export const petProfileService = new PetProfileService();
export default petProfileService;
