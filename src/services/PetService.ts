import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

export interface Pet {
  id: string;
  user_id?: string; // NOTE: Database allows null
  name: string;
  species: string;
  breed?: string;
  color?: string; // Color property for compatibility
  color_markings?: string;
  gender?: string;
  date_of_birth?: string;
  weight_kg?: number;
  height?: string; // NOTE: Database field
  microchip_number?: string;
  status?: 'active' | 'deceased' | 'lost' | 'found'; // NOTE: Database allows null
  anonymous_session_id?: string; // NOTE: Database field
  is_public?: boolean; // NOTE: Database field

  // Onboarding fields (matching database schema)
  personality_traits?: string[]; // NOTE: Stored as array in database
  favorite_activities?: string[]; // NOTE: Stored as array in database
  exercise_needs?: 'low' | 'moderate' | 'high';
  favorite_food?: string;
  feeding_schedule?: string;
  special_diet_notes?: string;
  special_notes?: string;

  // Pet insurance (Premium/Pro only)
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_contact_phone?: string;
  insurance_coverage_details?: string;

  // Breeding information (Premium/Pro only)
  breeding_status?: 'not_applicable' | 'intact' | 'neutered' | 'breeding';
  breeding_notes?: string;
  sire_name?: string;
  dam_name?: string;
  registration_number?: string;
  registration_organization?: string;

  // Health and special needs (all tiers)
  special_needs?: string;
  allergies?: string; // NOTE: Stored as JSON string in database
  medical_conditions?: string[]; // NOTE: Stored as array in database
  current_medications?: string[]; // NOTE: Stored as array in database
  behavioral_notes?: string; // Behavioral notes for compatibility

  // Dietary information as simple notes (all tiers)
  dietary_notes?: string;

  // Photo URL (consistent with database schema)
  photo_url?: string;
  profile_photo_url?: string; // NOTE: Database field name

  created_by?: string; // NOTE: created_by column doesn't exist in database
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface PetPhoto {
  id: string;
  pet_id: string;
  photo_url: string;
  caption?: string;
  file_size_bytes?: number;
  is_profile_photo: boolean;
  created_at: string;
}

interface PetData {
  // NOTE: family_id removed - pets belong to users, not directly to families
  name: string;
  species: string;
  breed?: string;
  color?: string; // Add color field
  color_markings?: string;
  gender?: string;
  date_of_birth?: string;
  weight_kg?: number;
  height?: string;
  microchip_number?: string;
  identification_number?: string;
  personality_traits?: string[]; // NOTE: Database expects array
  favorite_activities?: string[];
  exercise_needs?: 'low' | 'moderate' | 'high';
  favorite_food?: string;
  feeding_schedule?: string;
  special_diet_notes?: string;
  behavioral_notes?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_contact_phone?: string;
  insurance_coverage_details?: string;
  breeding_status?: string;
  breeding_notes?: string;
  sire_name?: string;
  dam_name?: string;
  registration_number?: string;
  registration_organization?: string;
  special_needs?: string;
  allergies?: string[];
  medical_conditions?: string[];
  current_medications?: string[];
  dietary_notes?: string;
  special_notes?: string;
  profile_photo_url?: string;
}

class PetService {
  /**
   * Get all pets for the current user's families
   */
  async getPets(): Promise<Pet[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const userQueryResult = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      const { data: userRecord } = userQueryResult;

      if (!userRecord) throw new Error('User not found');

      // Validate that userRecord is not malformed (specifically check for string)
      if (typeof userRecord === 'string') {
        throw new Error(
          'Invalid database response format: malformed user record'
        );
      }

      // Get pets from all families where user is a member
      const { data: pets, error } = await supabase
        .from('pets')
        .select(
          `
          id,
          user_id,
          name,
          species,
          breed,
          color_markings,
          gender,
          date_of_birth,
          weight_kg,
          height,
          microchip_number,
          status,
          personality_traits,
          favorite_activities,
          exercise_needs,
          favorite_food,
          feeding_schedule,
          special_diet_notes,
          allergies,
          medical_conditions,
          current_medications,
          special_notes,
          profile_photo_url,
          created_at,
          updated_at,
          deleted_at
        `
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Validate that pets is an array
      if (pets && !Array.isArray(pets)) {
        throw new Error('Invalid database response format: expected array');
      }

      return (pets || []) as Pet[];
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  }

  /**
   * Get a specific pet by ID
   */
  async getPet(petId: string): Promise<Pet | null> {
    try {
      const { data: pet, error } = await supabase
        .from('pets')
        .select(
          `
          id,
          user_id,
          name,
          species,
          breed,
          color_markings,
          gender,
          date_of_birth,
          weight_kg,
          height,
          microchip_number,
          status,
          personality_traits,
          favorite_activities,
          exercise_needs,
          favorite_food,
          feeding_schedule,
          special_diet_notes,
          allergies,
          medical_conditions,
          current_medications,
          special_notes,
          profile_photo_url,
          created_at,
          updated_at,
          deleted_at
        `
        )
        .eq('id', petId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      return pet as Pet | null;
    } catch (error: any) {
      console.error('Error fetching pet:', error);
      return null;
    }
  }

  /**
   * Alias for getPet (for backward compatibility)
   */
  async getPetById(petId: string): Promise<Pet | null> {
    return this.getPet(petId);
  }

  /**
   * Create a new pet (with deduplication and subscription limits)
   */
  async createPet(
    petData: PetData
  ): Promise<{ success: boolean; pet?: Pet; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id, subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Validate Premium/Pro only fields
      const premiumFields = [
        'insurance_provider',
        'insurance_policy_number',
        'insurance_contact_phone',
        'insurance_coverage_details',
        'breeding_status',
        'breeding_notes',
        'sire_name',
        'dam_name',
        'registration_number',
        'registration_organization',
      ];

      // Check if free user is trying to use premium fields
      if (userRecord.subscription_status === 'free') {
        const usingPremiumFields = premiumFields.some(
          field =>
            petData[field as keyof PetData] !== undefined &&
            petData[field as keyof PetData] !== null
        );

        if (usingPremiumFields) {
          return {
            success: false,
            error:
              'Advanced pet profile features (insurance info, breeding details) are available in Premium and Pro tiers only.',
          };
        }
      }

      // NOTE: Direct table insert instead of RPC - upsert_pet_data function doesn't exist
      const { data: createdPet, error } = await supabase
        .from('pets')
        .insert({
          user_id: userRecord.id,
          name: petData.name,
          species: petData.species,
          breed: petData.breed,
          color_markings: petData.color_markings,
          gender: petData.gender,
          date_of_birth: petData.date_of_birth,
          weight_kg: petData.weight_kg,
          microchip_number: petData.microchip_number,
          special_needs: petData.special_needs,
          allergies: petData.allergies
            ? JSON.stringify(petData.allergies)
            : null,
          created_by: userRecord.id,
        })
        .select('id')
        .single();

      const petId = createdPet?.id;

      if (error) {
        // Handle database constraint errors with user-friendly messages
        if (
          error.message.includes('Pet limit exceeded') ||
          error.message.includes('Free tier allows only')
        ) {
          return { success: false, error: error.message };
        }
        throw error;
      }

      // Fetch the complete pet data
      if (!petId) {
        return {
          success: false,
          error: 'Failed to create pet - no ID returned',
        };
      }

      const pet = await this.getPet(petId);
      if (!pet) {
        return {
          success: false,
          error: 'Pet created but could not retrieve data',
        };
      }

      return { success: true, pet };
    } catch (error: any) {
      console.error('Error creating pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upsert pet data during onboarding - prevents duplicates and syncs across app
   * This is the main method to use during user onboarding flow
   */
  async upsertPetFromOnboarding(petData: PetData): Promise<{
    success: boolean;
    pet?: Pet;
    isExisting: boolean;
    error?: string;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          isExisting: false,
          error: 'User not authenticated',
        };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id, subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { success: false, isExisting: false, error: 'User not found' };
      }

      // Check for existing pets first to determine if this is new or existing
      let existingPet = null;

      // Check by microchip first
      if (petData.microchip_number) {
        const { data: byMicrochip } = await supabase
          .from('pets')
          .select('id, name')
          .eq('microchip_number', petData.microchip_number)
          .is('deleted_at', null)
          .single();

        if (byMicrochip) existingPet = byMicrochip;
      }

      // Check by name + user + species if no microchip match
      // NOTE: Changed from family_id to user_id since pets belong to users
      if (!existingPet) {
        const { data: byName } = await supabase
          .from('pets')
          .select('id, name')
          .eq('user_id', userRecord.id)
          .eq('name', petData.name)
          .eq('species', petData.species)
          .is('deleted_at', null)
          .single();

        if (byName) existingPet = byName;
      }

      // Use direct upsert - upsert_pet_data RPC function doesn't exist
      // If existingPet found, update it; otherwise insert new
      let petId: string | undefined;
      let error: any;

      if (existingPet) {
        // Update existing pet
        const { data: updated, error: updateError } = await supabase
          .from('pets')
          .update({
            name: petData.name,
            species: petData.species,
            breed: petData.breed,
            color_markings: petData.color_markings,
            gender: petData.gender,
            date_of_birth: petData.date_of_birth,
            weight_kg: petData.weight_kg,
            microchip_number: petData.microchip_number,
            special_needs: petData.special_needs,
            special_notes: petData.special_notes,
            allergies: petData.allergies
              ? Array.isArray(petData.allergies)
                ? JSON.stringify(petData.allergies)
                : (petData.allergies as string)
              : null,
            medical_conditions: petData.medical_conditions || null,
            personality_traits: petData.personality_traits || null,
            favorite_activities: petData.favorite_activities || null,
            exercise_needs: petData.exercise_needs,
            favorite_food: petData.favorite_food,
            feeding_schedule: petData.feeding_schedule,
            special_diet_notes: petData.special_diet_notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPet.id)
          .select('id')
          .single();

        petId = updated?.id;
        error = updateError;
      } else {
        // Insert new pet
        const { data: inserted, error: insertError } = await supabase
          .from('pets')
          .insert({
            user_id: userRecord.id,
            name: petData.name,
            species: petData.species,
            breed: petData.breed,
            color_markings: petData.color_markings,
            gender: petData.gender,
            date_of_birth: petData.date_of_birth,
            weight_kg: petData.weight_kg,
            microchip_number: petData.microchip_number,
            special_needs: petData.special_needs,
            special_notes: petData.special_notes,
            allergies: petData.allergies
              ? Array.isArray(petData.allergies)
                ? JSON.stringify(petData.allergies)
                : (petData.allergies as string)
              : null,
            medical_conditions: petData.medical_conditions || null,
            personality_traits: petData.personality_traits || null,
            favorite_activities: petData.favorite_activities || null,
            exercise_needs: petData.exercise_needs,
            favorite_food: petData.favorite_food,
            feeding_schedule: petData.feeding_schedule,
            special_diet_notes: petData.special_diet_notes,
            created_by: userRecord.id,
          })
          .select('id')
          .single();

        petId = inserted?.id;
        error = insertError;
      }

      if (error) {
        console.error('Upsert error:', error);
        return { success: false, isExisting: false, error: error.message };
      }

      // Fetch the complete pet data
      if (!petId) {
        return {
          success: false,
          isExisting: false,
          error: 'Failed to upsert pet - no ID returned',
        };
      }

      const pet = await this.getPet(petId);
      if (!pet) {
        return {
          success: false,
          isExisting: false,
          error: 'Pet processed but could not retrieve data',
        };
      }

      return {
        success: true,
        pet,
        isExisting: existingPet !== null,
      };
    } catch (error: any) {
      console.error('Error upserting pet during onboarding:', error);
      return { success: false, isExisting: false, error: error.message };
    }
  }

  /**
   * Update an existing pet
   */
  async updatePet(
    petId: string,
    petData: Partial<PetData>
  ): Promise<{ success: boolean; pet?: Pet; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id, subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Validate Premium/Pro only fields
      const premiumFields = [
        'insurance_provider',
        'insurance_policy_number',
        'insurance_contact_phone',
        'insurance_coverage_details',
        'breeding_status',
        'breeding_notes',
        'sire_name',
        'dam_name',
        'registration_number',
        'registration_organization',
      ];

      // Check if free user is trying to use premium fields
      if (userRecord.subscription_status === 'free') {
        const usingPremiumFields = premiumFields.some(
          field =>
            petData[field as keyof PetData] !== undefined &&
            petData[field as keyof PetData] !== null
        );

        if (usingPremiumFields) {
          return {
            success: false,
            error:
              'Advanced pet profile features (insurance info, breeding details) are available in Premium and Pro tiers only.',
          };
        }
      }

      // Convert array fields to JSON strings for database storage
      const updateData: any = { ...petData };
      if (updateData.allergies && Array.isArray(updateData.allergies)) {
        updateData.allergies = JSON.stringify(updateData.allergies);
      }
      if (
        updateData.medical_conditions &&
        Array.isArray(updateData.medical_conditions)
      ) {
        updateData.medical_conditions = JSON.stringify(
          updateData.medical_conditions
        );
      }
      if (
        updateData.personality_traits &&
        Array.isArray(updateData.personality_traits)
      ) {
        updateData.personality_traits = JSON.stringify(
          updateData.personality_traits
        );
      }
      if (
        updateData.favorite_activities &&
        Array.isArray(updateData.favorite_activities)
      ) {
        updateData.favorite_activities = JSON.stringify(
          updateData.favorite_activities
        );
      }
      if (
        updateData.current_medications &&
        Array.isArray(updateData.current_medications)
      ) {
        updateData.current_medications = JSON.stringify(
          updateData.current_medications
        );
      }

      const { data: pet, error } = await supabase
        .from('pets')
        .update(updateData)
        .eq('id', petId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, pet: pet as Pet };
    } catch (error: any) {
      console.error('Error updating pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a pet (soft delete)
   */
  async deletePet(
    petId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', petId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get photos for a specific pet
   * NOTE: pet_photos table doesn't exist - feature not implemented
   */
  async getPetPhotos(petId: string): Promise<PetPhoto[]> {
    console.warn('getPetPhotos: pet_photos table does not exist in database');
    return [];
  }

  /**
   * Upload a pet photo with subscription limits
   * NOTE: pet_photos table doesn't exist - feature not implemented
   */
  async uploadPetPhoto(
    petId: string,
    imageUri: string,
    caption?: string
  ): Promise<{ success: boolean; photo?: PetPhoto; error?: string }> {
    return {
      success: false,
      error:
        'Photo upload feature requires database schema update. pet_photos table does not exist.',
    };
  }

  /**
   * Set a photo as profile photo
   * NOTE: pet_photos table doesn't exist - feature not implemented
   */
  async setProfilePhoto(
    petId: string,
    photoId: string
  ): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error:
        'Photo management feature requires database schema update. pet_photos table does not exist.',
    };
  }

  /**
   * Delete a pet photo
   * NOTE: pet_photos table doesn't exist - feature not implemented
   */
  async deletePetPhoto(
    photoId: string
  ): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error:
        'Photo management feature requires database schema update. pet_photos table does not exist.',
    };
  }

  /**
   * Get pet photo limits based on subscription
   */
  async getPetPhotoLimits(): Promise<{
    current: number;
    max: number;
    canUpload: boolean;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { current: 0, max: 1, canUpload: false };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { current: 0, max: 1, canUpload: false };
      }

      // Get photo limits based on subscription
      const maxPhotos = userRecord.subscription_status === 'free' ? 1 : 12;

      return { current: 0, max: maxPhotos, canUpload: true };
    } catch (error: any) {
      console.error('Error getting photo limits:', error);
      return { current: 0, max: 1, canUpload: false };
    }
  }

  /**
   * Check user's subscription status
   */
  async getSubscriptionStatus(): Promise<{
    status: string;
    canUsePremiumFeatures: boolean;
    canUseProFeatures: boolean;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          status: 'free',
          canUsePremiumFeatures: false,
          canUseProFeatures: false,
        };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return {
          status: 'free',
          canUsePremiumFeatures: false,
          canUseProFeatures: false,
        };
      }

      const subscriptionStatus = userRecord.subscription_status || 'free';
      const canUsePremiumFeatures = ['premium', 'family'].includes(
        subscriptionStatus
      );
      const canUseProFeatures = subscriptionStatus === 'family'; // NOTE: 'family' = Pro tier

      return {
        status: subscriptionStatus,
        canUsePremiumFeatures,
        canUseProFeatures,
      };
    } catch (error: any) {
      console.error('Error getting subscription status:', error);
      return {
        status: 'free',
        canUsePremiumFeatures: false,
        canUseProFeatures: false,
      };
    }
  }

  /**
   * Find potential duplicate pets for cleanup
   * NOTE: find_potential_duplicate_pets RPC function doesn't exist - feature not implemented
   */
  async findDuplicatePets(userId: string): Promise<
    {
      pet1_id: string;
      pet1_name: string;
      pet2_id: string;
      pet2_name: string;
      similarity_reason: string;
    }[]
  > {
    console.warn('findDuplicatePets: RPC function does not exist in database');
    return [];
  }

  /**
   * Merge duplicate pets (for cleanup)
   * NOTE: merge_duplicate_pets RPC function doesn't exist - feature not implemented
   */
  async mergeDuplicatePets(
    keepPetId: string,
    duplicatePetId: string
  ): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error:
        'Merge duplicate pets feature requires database RPC function implementation.',
    };
  }

  /**
   * Get complete pet data with all related information
   * NOTE: get_complete_pet_data RPC function doesn't exist - using direct queries
   */
  async getCompletePetData(petId: string): Promise<any> {
    try {
      // Use getPet method which does the same thing
      return await this.getPet(petId);
    } catch (error: any) {
      console.error('Error getting complete pet data:', error);
      return null;
    }
  }

  /**
   * Clean up incomplete pet records (for maintenance)
   * NOTE: cleanup_incomplete_pets RPC function doesn't exist - feature not implemented
   */
  async cleanupIncompletePets(
    userId: string
  ): Promise<{ cleaned: number; error?: string }> {
    console.warn(
      'cleanupIncompletePets: RPC function does not exist in database'
    );
    return { cleaned: 0 };
  }
}

export { PetService };
export const petService = new PetService();
