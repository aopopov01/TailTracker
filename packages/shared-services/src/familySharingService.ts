/**
 * Family Sharing Service
 * Manages pet sharing with family members (read-only access)
 */

import type { ApiResult } from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';

export interface PetShare {
  id: string;
  petId: string;
  ownerUserId: string;
  sharedUserId: string | null;
  sharedEmail: string;
  status: 'pending' | 'active' | 'revoked';
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  email: string;
  status: 'pending' | 'active';
  createdAt: string;
}

interface DatabasePetShare {
  id: string;
  pet_id: string;
  owner_user_id: string;
  shared_user_id: string | null;
  shared_email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Map database record to PetShare
 */
const mapDatabaseToPetShare = (db: DatabasePetShare): PetShare => ({
  id: db.id,
  petId: db.pet_id,
  ownerUserId: db.owner_user_id,
  sharedUserId: db.shared_user_id,
  sharedEmail: db.shared_email,
  status: db.status as 'pending' | 'active' | 'revoked',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

/**
 * Get all family members (shares) for a specific pet
 */
export const getPetFamilyMembers = async (petId: string): Promise<FamilyMember[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('pet_shares')
    .select('id, shared_email, status, created_at')
    .eq('pet_id', petId)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((share) => ({
    id: share.id,
    email: share.shared_email,
    status: share.status as 'pending' | 'active',
    createdAt: share.created_at,
  }));
};

/**
 * Get the count of family members for a pet (excluding revoked)
 */
export const getPetFamilyMemberCount = async (petId: string): Promise<number> => {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('pet_shares')
    .select('*', { count: 'exact', head: true })
    .eq('pet_id', petId)
    .in('status', ['pending', 'active']);

  if (error) {
    console.error('Error getting family member count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Get total family member count across all pets for a user
 * This is used to check against subscription limits
 */
export const getTotalFamilyMemberCount = async (): Promise<number> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return 0;

  const { count, error } = await supabase
    .from('pet_shares')
    .select('*', { count: 'exact', head: true })
    .eq('owner_user_id', user.user.id)
    .in('status', ['pending', 'active']);

  if (error) {
    console.error('Error getting total family member count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Add a family member to a pet
 * Creates a new user account and shares the pet with them
 */
export const addFamilyMember = async (
  petId: string,
  email: string,
  password: string
): Promise<ApiResult<FamilyMember>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if this email is already shared for this pet
    const { data: existingShare } = await supabase
      .from('pet_shares')
      .select('id, status')
      .eq('pet_id', petId)
      .eq('shared_email', email.toLowerCase())
      .single();

    if (existingShare) {
      if (existingShare.status === 'active' || existingShare.status === 'pending') {
        return { success: false, error: 'This email already has access to this pet' };
      }
      // If revoked, we can reactivate
    }

    // Create a new auth user with the provided credentials
    // Note: In production, you'd want to use supabase.auth.admin.createUser()
    // which requires a service role key. For now, we'll use signUp which
    // the family member can confirm later.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          role: 'family_member',
          invited_by: currentUser.user.id,
        },
      },
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          error: 'This email is already registered. Please use a different email.'
        };
      }
      throw authError;
    }

    const newUserId = authData.user?.id;

    // Create the pet share record
    const shareData = {
      pet_id: petId,
      owner_user_id: currentUser.user.id,
      shared_user_id: newUserId || null,
      shared_email: email.toLowerCase(),
      status: newUserId ? 'active' : 'pending',
    };

    let shareResult;
    if (existingShare) {
      // Reactivate existing share
      shareResult = await supabase
        .from('pet_shares')
        .update({
          ...shareData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingShare.id)
        .select()
        .single();
    } else {
      // Create new share
      shareResult = await supabase
        .from('pet_shares')
        .insert(shareData)
        .select()
        .single();
    }

    if (shareResult.error) throw shareResult.error;

    // Create a user record for the family member
    if (newUserId) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: newUserId,
          email: email.toLowerCase(),
          role: 'family_member',
          subscription_status: 'free',
        });

      if (userError && !userError.message.includes('duplicate')) {
        console.error('Error creating user record:', userError);
      }
    }

    return {
      success: true,
      data: {
        id: shareResult.data.id,
        email: email.toLowerCase(),
        status: shareResult.data.status as 'pending' | 'active',
        createdAt: shareResult.data.created_at,
      },
    };
  } catch (error) {
    console.error('Error adding family member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add family member',
    };
  }
};

/**
 * Remove a family member's access to a pet
 */
export const removeFamilyMember = async (
  shareId: string
): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('pet_shares')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', shareId)
      .eq('owner_user_id', user.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing family member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove family member',
    };
  }
};

/**
 * Get all pets shared with the current user (as a family member)
 */
export const getSharedPetsWithMe = async (): Promise<PetShare[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('pet_shares')
    .select('*')
    .eq('shared_user_id', user.user.id)
    .eq('status', 'active');

  if (error) throw error;

  return (data || []).map(mapDatabaseToPetShare);
};

/**
 * Check if the current user is a family member (has shared access only)
 */
export const isUserFamilyMember = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  // Check the user's role in the users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.user.id)
    .single();

  return userData?.role === 'family_member';
};

/**
 * Check if current user has access to a specific pet (either owner or shared)
 */
export const checkPetAccess = async (
  petId: string
): Promise<{ hasAccess: boolean; isOwner: boolean }> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return { hasAccess: false, isOwner: false };
  }

  // Check if user owns the pet
  const { data: pet } = await supabase
    .from('pets')
    .select('user_id')
    .eq('id', petId)
    .single();

  if (pet?.user_id === user.user.id) {
    return { hasAccess: true, isOwner: true };
  }

  // Check if user has shared access
  const { data: share } = await supabase
    .from('pet_shares')
    .select('id')
    .eq('pet_id', petId)
    .eq('shared_user_id', user.user.id)
    .eq('status', 'active')
    .single();

  if (share) {
    return { hasAccess: true, isOwner: false };
  }

  return { hasAccess: false, isOwner: false };
};
