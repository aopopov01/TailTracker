/**
 * Family Sharing Service
 * Manages pet sharing with family members (read-only access)
 * Uses family_shares and shared_pets tables
 */

import type {
  ApiResult,
  FamilyShare,
  SharedPet,
  FamilyShareStatus,
  FamilySharingSummary,
  SharedPetDetails,
  InviteFamilyMemberRequest,
  UpdateSharedPetsRequest,
  RespondToShareRequest,
  FamilySharingResult,
  DatabaseFamilyShare,
  DatabaseSharedPet,
  SubscriptionTier,
  Pet,
} from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';

// ===================================
// TYPE MAPPERS
// ===================================

/**
 * Map database family_shares record to FamilyShare
 */
const mapDatabaseToFamilyShare = (
  db: DatabaseFamilyShare & {
    owner?: { email?: string; first_name?: string; last_name?: string };
    shared_user?: { email?: string; first_name?: string; last_name?: string };
    shared_pets_count?: number;
  }
): FamilyShare => ({
  id: db.id,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  ownerId: db.owner_id,
  ownerEmail: db.owner?.email,
  ownerName: db.owner?.first_name && db.owner?.last_name
    ? `${db.owner.first_name} ${db.owner.last_name}`
    : db.owner?.email,
  sharedWithEmail: db.shared_with_email,
  sharedWithUserId: db.shared_with_user_id,
  sharedWithName: db.shared_user?.first_name && db.shared_user?.last_name
    ? `${db.shared_user.first_name} ${db.shared_user.last_name}`
    : undefined,
  status: db.status,
  accessLevel: db.access_level,
  acceptedAt: db.accepted_at,
  sharedPetsCount: db.shared_pets_count,
});

/**
 * Map database shared_pets record to SharedPet
 */
const mapDatabaseToSharedPet = (
  db: DatabaseSharedPet & {
    pet?: {
      id: string;
      name: string;
      species: string;
      profile_photo_url?: string;
      user_id?: string;
    };
    family_share?: {
      owner_id: string;
      owner?: { first_name?: string; last_name?: string };
    };
  }
): SharedPet => ({
  id: db.id,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  familyShareId: db.family_share_id,
  petId: db.pet_id,
  petName: db.pet?.name,
  petSpecies: db.pet?.species as SharedPet['petSpecies'],
  petPhotoUrl: db.pet?.profile_photo_url,
  shareCalendar: db.share_calendar,
  shareVaccinations: db.share_vaccinations,
  shareMedicalRecords: db.share_medical_records,
  ownerId: db.family_share?.owner_id,
  ownerName: db.family_share?.owner?.first_name && db.family_share?.owner?.last_name
    ? `${db.family_share.owner.first_name} ${db.family_share.owner.last_name}`
    : undefined,
});

// ===================================
// FAMILY SHARES MANAGEMENT
// ===================================

/**
 * Get all family members I've shared my pets with (as owner)
 */
export const getMyFamilyShares = async (): Promise<FamilyShare[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('family_shares')
    .select(`
      *,
      shared_user:shared_with_user_id(email, first_name, last_name),
      shared_pets_count:shared_pets(count)
    `)
    .eq('owner_id', user.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((share) => mapDatabaseToFamilyShare({
    ...share,
    shared_user: share.shared_user,
    shared_pets_count: share.shared_pets_count?.[0]?.count || 0,
  }));
};

/**
 * Get all shares where pets are shared with me (as family member)
 */
export const getSharesWithMe = async (): Promise<FamilyShare[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('family_shares')
    .select(`
      *,
      owner:owner_id(email, first_name, last_name),
      shared_pets_count:shared_pets(count)
    `)
    .eq('shared_with_user_id', user.user.id)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((share) => mapDatabaseToFamilyShare({
    ...share,
    owner: share.owner,
    shared_pets_count: share.shared_pets_count?.[0]?.count || 0,
  }));
};

/**
 * Get pending invitations for the current user
 */
export const getPendingInvitations = async (): Promise<FamilyShare[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Check by email first (for invitations sent before user registered)
  const { data, error } = await supabase
    .from('family_shares')
    .select(`
      *,
      owner:owner_id(email, first_name, last_name)
    `)
    .eq('status', 'pending')
    .or(`shared_with_user_id.eq.${user.user.id},shared_with_email.eq.${user.user.email?.toLowerCase()}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((share) => mapDatabaseToFamilyShare({
    ...share,
    owner: share.owner,
  }));
};

/**
 * Get family member count for the current user
 * Used to check subscription limits
 */
export const getFamilyMemberCount = async (): Promise<number> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return 0;

  const { count, error } = await supabase
    .from('family_shares')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.user.id)
    .in('status', ['pending', 'accepted']);

  if (error) {
    console.error('Error getting family member count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Get family sharing summary for the current user
 */
export const getFamilySharingSummary = async (
  subscriptionTier: SubscriptionTier = 'free'
): Promise<FamilySharingSummary> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    const tierConfig = (await import('@tailtracker/shared-types')).SUBSCRIPTION_TIERS[subscriptionTier];
    return {
      totalSharedByMe: 0,
      totalSharedWithMe: 0,
      pendingInvitations: 0,
      acceptedShares: 0,
      remainingSlots: tierConfig.limits.maxFamilyMembers,
      maxAllowed: tierConfig.limits.maxFamilyMembers,
    };
  }

  // Get shares by me
  const { data: sharesByMe } = await supabase
    .from('family_shares')
    .select('status')
    .eq('owner_id', user.user.id)
    .in('status', ['pending', 'accepted']);

  // Get shares with me
  const { data: sharesWithMe } = await supabase
    .from('family_shares')
    .select('status')
    .eq('shared_with_user_id', user.user.id)
    .in('status', ['pending', 'accepted']);

  const tierConfig = (await import('@tailtracker/shared-types')).SUBSCRIPTION_TIERS[subscriptionTier];
  const totalSharedByMe = sharesByMe?.length || 0;
  const pendingCount = sharesByMe?.filter(s => s.status === 'pending').length || 0;
  const acceptedCount = sharesByMe?.filter(s => s.status === 'accepted').length || 0;

  return {
    totalSharedByMe,
    totalSharedWithMe: sharesWithMe?.length || 0,
    pendingInvitations: pendingCount,
    acceptedShares: acceptedCount,
    remainingSlots: Math.max(0, tierConfig.limits.maxFamilyMembers - totalSharedByMe),
    maxAllowed: tierConfig.limits.maxFamilyMembers,
  };
};

/**
 * Invite a family member to share pets with
 */
export const inviteFamilyMember = async (
  request: InviteFamilyMemberRequest
): Promise<FamilySharingResult> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const email = request.email.toLowerCase().trim();

    // Check if user is trying to invite themselves
    if (email === user.user.email?.toLowerCase()) {
      return { success: false, error: 'You cannot invite yourself' };
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('family_shares')
      .select('id, status')
      .eq('owner_id', user.user.id)
      .eq('shared_with_email', email)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        return { success: false, error: 'An invitation is already pending for this email' };
      }
      if (existing.status === 'accepted') {
        return { success: false, error: 'This person is already a family member' };
      }
      // If declined, allow re-inviting by updating the status
      const { data: updated, error: updateError } = await supabase
        .from('family_shares')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        familyShare: mapDatabaseToFamilyShare(updated),
      };
    }

    // Check if the invited email belongs to an existing user
    const { data: existingUser } = await supabase
      .from('users')
      .select('auth_user_id')
      .eq('email', email)
      .single();

    // Create the family share invitation
    const { data: share, error: shareError } = await supabase
      .from('family_shares')
      .insert({
        owner_id: user.user.id,
        shared_with_email: email,
        shared_with_user_id: existingUser?.auth_user_id || null,
        status: 'pending',
        access_level: 'reader',
      })
      .select()
      .single();

    if (shareError) throw shareError;

    // If petIds provided, create shared_pets entries
    if (request.petIds && request.petIds.length > 0) {
      const sharedPetsData = request.petIds.map(petId => ({
        family_share_id: share.id,
        pet_id: petId,
        share_calendar: true,
        share_vaccinations: true,
        share_medical_records: true,
      }));

      const { error: petsError } = await supabase
        .from('shared_pets')
        .insert(sharedPetsData);

      if (petsError) {
        console.error('Error creating shared pets:', petsError);
      }
    }

    return {
      success: true,
      familyShare: mapDatabaseToFamilyShare(share),
    };
  } catch (error) {
    console.error('Error inviting family member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to invite family member',
    };
  }
};

/**
 * Respond to a family share invitation (accept or decline)
 */
export const respondToShareInvitation = async (
  request: RespondToShareRequest
): Promise<FamilySharingResult> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const newStatus: FamilyShareStatus = request.response === 'accept' ? 'accepted' : 'declined';

    const { data: share, error } = await supabase
      .from('family_shares')
      .update({
        status: newStatus,
        shared_with_user_id: user.user.id,
        accepted_at: request.response === 'accept' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.shareId)
      .or(`shared_with_user_id.eq.${user.user.id},shared_with_email.eq.${user.user.email?.toLowerCase()}`)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      familyShare: mapDatabaseToFamilyShare(share),
    };
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to respond to invitation',
    };
  }
};

/**
 * Remove a family member (revoke all shared access)
 */
export const removeFamilyMember = async (shareId: string): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Delete the family share (cascade will delete shared_pets)
    const { error } = await supabase
      .from('family_shares')
      .delete()
      .eq('id', shareId)
      .eq('owner_id', user.user.id);

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

// ===================================
// SHARED PETS MANAGEMENT
// ===================================

/**
 * Get all pets shared in a specific family share
 */
export const getSharedPetsForShare = async (familyShareId: string): Promise<SharedPet[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('shared_pets')
    .select(`
      *,
      pet:pet_id(id, name, species, profile_photo_url, user_id),
      family_share:family_share_id(owner_id, owner:owner_id(first_name, last_name))
    `)
    .eq('family_share_id', familyShareId);

  if (error) throw error;

  return (data || []).map(mapDatabaseToSharedPet);
};

/**
 * Get all pets shared with the current user (as a family member)
 */
export const getPetsSharedWithMe = async (): Promise<SharedPet[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Get all accepted family shares where I'm the recipient
  const { data: shares, error: sharesError } = await supabase
    .from('family_shares')
    .select('id')
    .eq('shared_with_user_id', user.user.id)
    .eq('status', 'accepted');

  if (sharesError) throw sharesError;

  if (!shares || shares.length === 0) {
    return [];
  }

  const shareIds = shares.map(s => s.id);

  const { data, error } = await supabase
    .from('shared_pets')
    .select(`
      *,
      pet:pet_id(id, name, species, profile_photo_url, user_id),
      family_share:family_share_id(owner_id, owner:owner_id(first_name, last_name))
    `)
    .in('family_share_id', shareIds);

  if (error) throw error;

  return (data || []).map(mapDatabaseToSharedPet);
};

/**
 * Update shared pets for a family share
 */
export const updateSharedPets = async (
  request: UpdateSharedPetsRequest
): Promise<FamilySharingResult> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify ownership of the family share
    const { data: share } = await supabase
      .from('family_shares')
      .select('id')
      .eq('id', request.familyShareId)
      .eq('owner_id', user.user.id)
      .single();

    if (!share) {
      return { success: false, error: 'Family share not found or access denied' };
    }

    // Delete existing shared pets for this share
    await supabase
      .from('shared_pets')
      .delete()
      .eq('family_share_id', request.familyShareId);

    // Insert new shared pets
    if (request.pets.length > 0) {
      const sharedPetsData = request.pets.map(pet => ({
        family_share_id: request.familyShareId,
        pet_id: pet.petId,
        share_calendar: pet.shareCalendar,
        share_vaccinations: pet.shareVaccinations,
        share_medical_records: pet.shareMedicalRecords,
      }));

      const { data: sharedPets, error: insertError } = await supabase
        .from('shared_pets')
        .insert(sharedPetsData)
        .select(`
          *,
          pet:pet_id(id, name, species, profile_photo_url)
        `);

      if (insertError) throw insertError;

      return {
        success: true,
        sharedPets: (sharedPets || []).map(mapDatabaseToSharedPet),
      };
    }

    return { success: true, sharedPets: [] };
  } catch (error) {
    console.error('Error updating shared pets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update shared pets',
    };
  }
};

/**
 * Add a single pet to a family share
 */
export const addPetToShare = async (
  familyShareId: string,
  petId: string,
  options?: {
    shareCalendar?: boolean;
    shareVaccinations?: boolean;
    shareMedicalRecords?: boolean;
  }
): Promise<FamilySharingResult> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: sharedPet, error } = await supabase
      .from('shared_pets')
      .insert({
        family_share_id: familyShareId,
        pet_id: petId,
        share_calendar: options?.shareCalendar ?? true,
        share_vaccinations: options?.shareVaccinations ?? true,
        share_medical_records: options?.shareMedicalRecords ?? true,
      })
      .select(`
        *,
        pet:pet_id(id, name, species, profile_photo_url)
      `)
      .single();

    if (error) throw error;

    return {
      success: true,
      sharedPets: [mapDatabaseToSharedPet(sharedPet)],
    };
  } catch (error) {
    console.error('Error adding pet to share:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add pet to share',
    };
  }
};

/**
 * Remove a pet from a family share
 */
export const removePetFromShare = async (
  familyShareId: string,
  petId: string
): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('shared_pets')
      .delete()
      .eq('family_share_id', familyShareId)
      .eq('pet_id', petId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing pet from share:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove pet from share',
    };
  }
};

// ===================================
// ACCESS CONTROL
// ===================================

/**
 * Check if current user has access to a specific pet (either owner or shared)
 */
export const checkPetAccess = async (
  petId: string
): Promise<{ hasAccess: boolean; isOwner: boolean; permissions?: SharedPet }> => {
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

  // Check if user has shared access via family_shares
  const { data: sharedPet } = await supabase
    .from('shared_pets')
    .select(`
      *,
      family_share:family_share_id!inner(
        id,
        status,
        shared_with_user_id
      )
    `)
    .eq('pet_id', petId)
    .eq('family_share.shared_with_user_id', user.user.id)
    .eq('family_share.status', 'accepted')
    .single();

  if (sharedPet) {
    return {
      hasAccess: true,
      isOwner: false,
      permissions: mapDatabaseToSharedPet(sharedPet),
    };
  }

  return { hasAccess: false, isOwner: false };
};

/**
 * Get full pet details with sharing information for family member view
 */
export const getSharedPetDetails = async (petId: string): Promise<SharedPetDetails | null> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data: sharedPet, error } = await supabase
    .from('shared_pets')
    .select(`
      *,
      pet:pet_id(*),
      family_share:family_share_id!inner(
        id,
        owner_id,
        status,
        shared_with_user_id,
        owner:owner_id(email, first_name, last_name)
      )
    `)
    .eq('pet_id', petId)
    .eq('family_share.shared_with_user_id', user.user.id)
    .eq('family_share.status', 'accepted')
    .single();

  if (error || !sharedPet) return null;

  const petData = sharedPet.pet as unknown as Pet;
  const owner = sharedPet.family_share?.owner;

  return {
    ...petData,
    sharedBy: {
      userId: sharedPet.family_share.owner_id,
      name: owner?.first_name && owner?.last_name
        ? `${owner.first_name} ${owner.last_name}`
        : owner?.email || 'Unknown',
      email: owner?.email || '',
    },
    permissions: {
      canViewCalendar: sharedPet.share_calendar,
      canViewVaccinations: sharedPet.share_vaccinations,
      canViewMedicalRecords: sharedPet.share_medical_records,
    },
    familyShareId: sharedPet.family_share_id,
  };
};

/**
 * Check if the current user has any shared pets (is a family member for any pet)
 */
export const hasSharedPets = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { count, error } = await supabase
    .from('family_shares')
    .select('*', { count: 'exact', head: true })
    .eq('shared_with_user_id', user.user.id)
    .eq('status', 'accepted');

  if (error) return false;

  return (count || 0) > 0;
};

// ===================================
// LEGACY COMPATIBILITY
// (Keep these for backward compatibility with existing code)
// ===================================

export interface FamilyMember {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

/**
 * Get all family members I've shared with (legacy format)
 */
export const getMyFamilyMembers = async (): Promise<FamilyMember[]> => {
  const shares = await getMyFamilyShares();
  return shares.map(share => ({
    id: share.id,
    email: share.sharedWithEmail,
    name: share.sharedWithName,
    status: share.status,
    createdAt: share.createdAt,
  }));
};

/**
 * Get total family member count (legacy)
 */
export const getTotalFamilyMemberCount = async (): Promise<number> => {
  return getFamilyMemberCount();
};
