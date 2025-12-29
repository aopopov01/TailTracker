/**
 * Pet Service
 * Platform-agnostic pet management operations
 */

import type { Pet, PetData, DatabasePet, ApiResult } from '@tailtracker/shared-types';
import { mapPetToDatabase, mapDatabaseToPet } from '@tailtracker/shared-utils';
import { getSupabaseClient } from './supabase/client';

interface UserRecord {
  id: string;
  subscription_status?: string;
}

interface PetRecord {
  id: string;
  name?: string;
}

/**
 * Get all pets for the current user
 */
export const getPets = async (): Promise<Pet[]> => {
  const supabase = getSupabaseClient();

  const { data: user, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('getPets: Auth error:', authError.message);
    throw new Error('Authentication error: ' + authError.message);
  }

  if (!user.user) {
    console.log('getPets: No authenticated user');
    throw new Error('User not authenticated');
  }

  console.log('getPets: Fetching user record for auth_user_id:', user.user.id);

  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.user.id)
    .single();

  if (userError) {
    console.error('getPets: User query error:', userError.message, userError.code);
    throw new Error('Failed to fetch user record: ' + userError.message);
  }

  if (!userRecord) {
    console.log('getPets: No user record found');
    throw new Error('User not found');
  }

  console.log('getPets: Found user record, fetching pets');

  const { data: pets, error } = await supabase
    .from('pets')
    .select(
      `
      id,
      user_id,
      name,
      species,
      breed,
      color,
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
      emergency_contact,
      last_checkup,
      profile_photo_url,
      created_at,
      updated_at,
      deleted_at,
      hidden_at,
      hidden_reason
    `
    )
    .is('deleted_at', null)
    .is('hidden_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (pets && !Array.isArray(pets)) {
    throw new Error('Invalid database response format: expected array');
  }

  return (pets || []).map((dbPet) => mapDatabaseToPet(dbPet as DatabasePet));
};

/**
 * Get a specific pet by ID
 */
export const getPetById = async (petId: string): Promise<Pet | null> => {
  const supabase = getSupabaseClient();

  const { data: pet, error } = await supabase
    .from('pets')
    .select(
      `
      id,
      user_id,
      name,
      species,
      breed,
      color,
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
      emergency_contact,
      last_checkup,
      profile_photo_url,
      created_at,
      updated_at,
      deleted_at,
      hidden_at,
      hidden_reason
    `
    )
    .eq('id', petId)
    .is('deleted_at', null)
    .is('hidden_at', null)
    .single();

  if (error) {
    console.error('Error fetching pet:', error);
    return null;
  }

  return pet ? mapDatabaseToPet(pet as DatabasePet) : null;
};

/**
 * Create a new pet
 */
export const createPet = async (
  petData: PetData
): Promise<ApiResult<Pet>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const userResult = await supabase
      .from('users')
      .select('id, subscription_status')
      .eq('auth_user_id', user.user.id)
      .single();

    const userRecord = userResult.data as UserRecord | null;

    if (!userRecord) {
      return { success: false, error: 'User not found' };
    }

    // Validate Premium/Pro only fields
    const premiumFields = [
      'insuranceProvider',
      'insurancePolicyNumber',
      'insuranceContactPhone',
      'insuranceCoverageDetails',
      'breedingStatus',
      'breedingNotes',
      'sireName',
      'damName',
      'registrationNumber',
      'registrationOrganization',
    ];

    // Check if free user is trying to use premium fields
    if (userRecord.subscription_status === 'free') {
      const usingPremiumFields = premiumFields.some(
        (field) =>
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

    // Map frontend data to database format
    // IMPORTANT: Use auth user ID (user.user.id) for RLS policies, not internal users table ID
    const dbData = mapPetToDatabase(petData as Partial<Pet>, user.user.id);

    const insertResult = await supabase
      .from('pets')
      .insert(dbData as Record<string, unknown>)
      .select('id')
      .single();

    const createdPet = insertResult.data as PetRecord | null;
    const insertError = insertResult.error;

    if (insertError) {
      if (
        insertError.message.includes('Pet limit exceeded') ||
        insertError.message.includes('Free tier allows only')
      ) {
        return { success: false, error: insertError.message };
      }
      throw insertError;
    }

    if (!createdPet?.id) {
      return {
        success: false,
        error: 'Failed to create pet - no ID returned',
      };
    }

    const pet = await getPetById(createdPet.id);
    if (!pet) {
      return {
        success: false,
        error: 'Pet created but could not retrieve data',
      };
    }

    return { success: true, data: pet };
  } catch (error) {
    console.error('Error creating pet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create pet',
    };
  }
};

/**
 * Update an existing pet
 */
export const updatePet = async (
  petId: string,
  petData: Partial<PetData>
): Promise<ApiResult<Pet>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const userResult = await supabase
      .from('users')
      .select('id, subscription_status')
      .eq('auth_user_id', user.user.id)
      .single();

    const userRecord = userResult.data as UserRecord | null;

    if (!userRecord) {
      return { success: false, error: 'User not found' };
    }

    // Validate Premium/Pro only fields
    const premiumFields = [
      'insuranceProvider',
      'insurancePolicyNumber',
      'insuranceContactPhone',
      'insuranceCoverageDetails',
      'breedingStatus',
      'breedingNotes',
      'sireName',
      'damName',
      'registrationNumber',
      'registrationOrganization',
    ];

    // Check if free user is trying to use premium fields
    if (userRecord.subscription_status === 'free') {
      const usingPremiumFields = premiumFields.some(
        (field) =>
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

    // Map frontend data to database format
    // IMPORTANT: Use auth user ID (user.user.id) for RLS policies, not internal users table ID
    const dbData = mapPetToDatabase(petData as Partial<Pet>, user.user.id);

    const updateResult = await supabase
      .from('pets')
      .update({ ...dbData, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', petId)
      .select()
      .single();

    if (updateResult.error) throw updateResult.error;

    return { success: true, data: mapDatabaseToPet(updateResult.data as DatabasePet) };
  } catch (error) {
    console.error('Error updating pet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update pet',
    };
  }
};

/**
 * Delete a pet (soft delete)
 */
export const deletePet = async (petId: string): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const deleteResult = await supabase
      .from('pets')
      .update({ deleted_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', petId);

    if (deleteResult.error) throw deleteResult.error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting pet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete pet',
    };
  }
};

/**
 * Upsert pet data during onboarding - prevents duplicates
 */
export const upsertPetFromOnboarding = async (
  petData: PetData
): Promise<ApiResult<Pet> & { isExisting: boolean }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        isExisting: false,
        error: 'User not authenticated',
      };
    }

    const userResult = await supabase
      .from('users')
      .select('id, subscription_status')
      .eq('auth_user_id', user.user.id)
      .single();

    const userRecord = userResult.data as UserRecord | null;

    if (!userRecord) {
      return { success: false, isExisting: false, error: 'User not found' };
    }

    // Check for existing pets first
    let existingPet: PetRecord | null = null;

    // Check by microchip first
    if (petData.microchipNumber) {
      const microchipResult = await supabase
        .from('pets')
        .select('id, name')
        .eq('microchip_number', petData.microchipNumber)
        .is('deleted_at', null)
        .single();

      if (microchipResult.data) existingPet = microchipResult.data as PetRecord;
    }

    // Check by name + user + species if no microchip match
    // Use auth user ID for consistency with RLS policies
    if (!existingPet) {
      const nameResult = await supabase
        .from('pets')
        .select('id, name')
        .eq('user_id', user.user.id)
        .eq('name', petData.name)
        .eq('species', petData.species)
        .is('deleted_at', null)
        .single();

      if (nameResult.data) existingPet = nameResult.data as PetRecord;
    }

    // Map frontend data to database format
    // IMPORTANT: Use auth user ID (user.user.id) for RLS policies, not internal users table ID
    const dbData = mapPetToDatabase(petData as Partial<Pet>, user.user.id);

    let petId: string | undefined;
    let upsertError: { message: string } | null = null;

    if (existingPet) {
      // Update existing pet
      const updateResult = await supabase
        .from('pets')
        .update({ ...dbData, updated_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', existingPet.id)
        .select('id')
        .single();

      petId = (updateResult.data as PetRecord | null)?.id;
      upsertError = updateResult.error;
    } else {
      // Insert new pet
      const insertResult = await supabase
        .from('pets')
        .insert(dbData as Record<string, unknown>)
        .select('id')
        .single();

      petId = (insertResult.data as PetRecord | null)?.id;
      upsertError = insertResult.error;
    }

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return { success: false, isExisting: false, error: upsertError.message };
    }

    if (!petId) {
      return {
        success: false,
        isExisting: false,
        error: 'Failed to upsert pet - no ID returned',
      };
    }

    const pet = await getPetById(petId);
    if (!pet) {
      return {
        success: false,
        isExisting: false,
        error: 'Pet processed but could not retrieve data',
      };
    }

    return {
      success: true,
      data: pet,
      isExisting: existingPet !== null,
    };
  } catch (error) {
    console.error('Error upserting pet during onboarding:', error);
    return {
      success: false,
      isExisting: false,
      error: error instanceof Error ? error.message : 'Failed to upsert pet',
    };
  }
};

/**
 * Get pet count for the current user
 */
export const getPetCount = async (): Promise<number> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return 0;

  const { count, error } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .is('hidden_at', null);

  if (error) {
    console.error('Error getting pet count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Get hidden pets for the current user (for restoration UI)
 */
export const getHiddenPets = async (): Promise<Pet[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data: pets, error } = await supabase
    .from('pets')
    .select(
      `
      id,
      user_id,
      name,
      species,
      breed,
      color,
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
      emergency_contact,
      last_checkup,
      profile_photo_url,
      created_at,
      updated_at,
      deleted_at,
      hidden_at,
      hidden_reason
    `
    )
    .is('deleted_at', null)
    .not('hidden_at', 'is', null)
    .order('hidden_at', { ascending: false });

  if (error) throw error;

  return (pets || []).map((dbPet) => mapDatabaseToPet(dbPet as DatabasePet));
};

/**
 * Hide pets when user downgrades their subscription
 * @param petIdsToHide - Array of pet IDs to hide
 * @returns Result indicating success or failure
 */
export const hidePetsOnDowngrade = async (
  petIdsToHide: string[]
): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (petIdsToHide.length === 0) {
      return { success: true };
    }

    const { error } = await supabase
      .from('pets')
      .update({
        hidden_at: new Date().toISOString(),
        hidden_reason: 'subscription_downgrade',
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .in('id', petIdsToHide)
      .eq('user_id', user.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error hiding pets on downgrade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to hide pets',
    };
  }
};

/**
 * Restore hidden pets (e.g., when user upgrades subscription)
 * @param petIds - Optional array of specific pet IDs to restore. If not provided, restores all hidden pets.
 * @returns Result indicating success or failure
 */
export const restoreHiddenPets = async (
  petIds?: string[]
): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    let query = supabase
      .from('pets')
      .update({
        hidden_at: null,
        hidden_reason: null,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('user_id', user.user.id)
      .not('hidden_at', 'is', null);

    if (petIds && petIds.length > 0) {
      query = query.in('id', petIds);
    }

    const { error } = await query;

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error restoring hidden pets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore pets',
    };
  }
};

/**
 * Get count of hidden pets for the current user
 */
export const getHiddenPetCount = async (): Promise<number> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return 0;

  const { count, error } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .not('hidden_at', 'is', null);

  if (error) {
    console.error('Error getting hidden pet count:', error);
    return 0;
  }

  return count || 0;
};
