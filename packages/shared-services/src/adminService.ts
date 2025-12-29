/**
 * Admin Service
 * Platform-agnostic admin management operations
 */

import type {
  AdminUser,
  AdminStats,
  AdminActivity,
  AdminPetListItem,
  AdminSubscription,
  Ad,
  PromoCode,
  AdminAuditLog,
  PlatformSettings,
  ApiResult,
  AdminRole,
  AdPlacement,
  AdTargetAudience,
  DiscountType,
  AdminAuditTargetType,
} from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';

// ===================================
// ADMIN AUTH & ROLE CHECK
// ===================================

/**
 * Check if current user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('isAdmin: Auth error:', authError.message);
      return false;
    }

    if (!user.user) {
      console.log('isAdmin: No authenticated user');
      return false;
    }

    const { data: userRecord, error: queryError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.user.id)
      .single();

    if (queryError) {
      console.error('isAdmin: Query error:', queryError.message, queryError.code);
      return false;
    }

    if (!userRecord) {
      console.log('isAdmin: No user record found for auth_user_id:', user.user.id);
      return false;
    }

    const isAdminUser = userRecord.role === 'admin' || userRecord.role === 'super_admin';
    console.log('isAdmin: User role:', userRecord.role, 'Is admin:', isAdminUser);
    return isAdminUser;
  } catch (error) {
    console.error('isAdmin: Unexpected error:', error);
    return false;
  }
};

/**
 * Get current admin user info
 */
export const getCurrentAdminUser = async (): Promise<AdminUser | null> => {
  const supabase = getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data: userRecord } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.user.id)
    .single();

  if (!userRecord || (userRecord.role !== 'admin' && userRecord.role !== 'super_admin')) {
    return null;
  }

  return mapDbUserToAdmin(userRecord);
};

// ===================================
// STATS & OVERVIEW
// ===================================

/**
 * Get admin dashboard stats
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const supabase = getSupabaseClient();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Get total pets
  const { count: totalPets } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Get subscription breakdown from users table
  // users.subscription_status uses enum: 'free' | 'premium' | 'pro'
  const { data: subscriptionData } = await supabase
    .from('users')
    .select('subscription_status');

  let freeUsers = 0;
  let premiumUsers = 0;
  let proUsers = 0;

  subscriptionData?.forEach((u) => {
    const tier = u.subscription_status || 'free';
    if (tier === 'free') freeUsers++;
    else if (tier === 'premium') premiumUsers++;
    else if (tier === 'pro') proUsers++;
  });

  // Get new users this week
  const { count: newUsersThisWeek } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo);

  // Get new pets this week
  const { count: newPetsThisWeek } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo)
    .is('deleted_at', null);

  // Get vaccination and medical record counts
  const { count: totalVaccinations } = await supabase
    .from('vaccinations')
    .select('*', { count: 'exact', head: true });

  const { count: totalMedicalRecords } = await supabase
    .from('medical_records')
    .select('*', { count: 'exact', head: true });

  // Get lost pets count
  const { count: lostPetsCount } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'lost')
    .is('deleted_at', null);

  // Get overdue vaccinations (next_due_date < today)
  const { count: overdueVaccinations } = await supabase
    .from('vaccinations')
    .select('*', { count: 'exact', head: true })
    .lt('next_due_date', new Date().toISOString().split('T')[0]);

  // Calculate monthly revenue (estimate: premium = $4.99, pro = $9.99)
  const monthlyRevenue = premiumUsers * 4.99 + proUsers * 9.99;

  return {
    totalUsers: totalUsers || 0,
    totalPets: totalPets || 0,
    activeSubscriptions: premiumUsers + proUsers,
    freeUsers,
    premiumUsers,
    proUsers,
    newUsersThisWeek: newUsersThisWeek || 0,
    newPetsThisWeek: newPetsThisWeek || 0,
    monthlyRevenue,
    totalVaccinations: totalVaccinations || 0,
    totalMedicalRecords: totalMedicalRecords || 0,
    lostPetsCount: lostPetsCount || 0,
    overdueVaccinations: overdueVaccinations || 0,
  };
};

/**
 * Get recent activity feed
 */
export const getRecentActivity = async (limit = 20): Promise<AdminActivity[]> => {
  const supabase = getSupabaseClient();
  const activities: AdminActivity[] = [];

  // Get recent users
  const { data: recentUsers } = await supabase
    .from('users')
    .select('id, email, full_name, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  recentUsers?.forEach((user) => {
    const name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
    activities.push({
      id: `signup-${user.id}`,
      type: 'user_signup',
      description: `New user signed up: ${name}`,
      userId: user.id,
      userName: name,
      createdAt: user.created_at,
    });
  });

  // Get recent pets
  const { data: recentPets } = await supabase
    .from('pets')
    .select(`
      id, name, species, created_at, user_id,
      users!pets_user_id_fkey (email, full_name, first_name, last_name)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  recentPets?.forEach((pet) => {
    const owner = pet.users as { email?: string; full_name?: string; first_name?: string; last_name?: string } | null;
    const ownerName = owner?.full_name || `${owner?.first_name || ''} ${owner?.last_name || ''}`.trim() || owner?.email || 'Unknown';
    activities.push({
      id: `pet-${pet.id}`,
      type: 'pet_created',
      description: `New ${pet.species} "${pet.name}" added by ${ownerName}`,
      userId: pet.user_id,
      userName: ownerName,
      petId: pet.id,
      petName: pet.name,
      createdAt: pet.created_at,
    });
  });

  // Sort by date and return top items
  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

// ===================================
// USER MANAGEMENT
// ===================================

/**
 * Get all users with filters
 */
export const getAdminUsers = async (options?: {
  search?: string;
  role?: AdminRole;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUser[]; total: number }> => {
  const supabase = getSupabaseClient();

  // Build users query without embedded pets query (more reliable)
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' });

  if (options?.search) {
    query = query.or(`email.ilike.%${options.search}%,full_name.ilike.%${options.search}%,first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%`);
  }

  if (options?.role) {
    query = query.eq('role', options.role);
  }

  // Note: subscriptionStatus and subscriptionTier filters are applied after mapping
  // since we need to map the subscription_status column to tier first

  if (options?.isActive !== undefined) {
    if (options.isActive) {
      query = query.is('deleted_at', null);
    } else {
      query = query.not('deleted_at', 'is', null);
    }
  }

  query = query.order('created_at', { ascending: false });

  // Handle pagination - support both page and offset
  const limit = options?.limit || 10;
  let offset = options?.offset || 0;
  if (options?.page !== undefined && options.page > 0) {
    offset = (options.page - 1) * limit;
  }

  if (limit) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  // Get auth_user_ids for fetching pet counts
  const authUserIds = data?.map(u => u.auth_user_id).filter(Boolean) || [];
  let petCounts: Record<string, number> = {};

  if (authUserIds.length > 0) {
    // Get pet counts for each user (using auth_user_id as the link)
    const { data: petData } = await supabase
      .from('pets')
      .select('user_id')
      .in('user_id', authUserIds)
      .is('deleted_at', null);

    // Count pets per user
    petData?.forEach(p => {
      petCounts[p.user_id] = (petCounts[p.user_id] || 0) + 1;
    });
  }

  // Map users - subscription_status is already in users table
  let users = data?.map((u) => {
    // subscription_status in users table uses enum: 'free' | 'premium' | 'pro'
    const subscriptionTier = u.subscription_status || 'free';
    // Derive subscription status: premium/pro = 'active', free = undefined
    const subscriptionStatus = subscriptionTier === 'premium' || subscriptionTier === 'pro'
      ? 'active' as const
      : undefined;
    return {
      ...mapDbUserToAdmin(u),
      subscriptionTier: mapDbStatusToTier(subscriptionTier),
      subscriptionStatus,
      petCount: petCounts[u.auth_user_id] || 0,
    };
  }) || [];

  // Apply subscription filters
  if (options?.subscriptionStatus || options?.subscriptionTier) {
    const filterTier = options.subscriptionTier || options.subscriptionStatus;
    users = users.filter(u => u.subscriptionTier === filterTier || u.subscriptionStatus === filterTier);
  }

  return { users, total: count || 0 };
};

/**
 * Get a single user by ID
 */
export const getAdminUserById = async (userId: string): Promise<AdminUser | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  // Get pet count separately
  const { count: petCountResult } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', data.auth_user_id)
    .is('deleted_at', null);

  // subscription_status is already in users table (enum: 'free' | 'premium' | 'pro')
  const subscriptionTier = data.subscription_status || 'free';

  // Derive subscription status: premium/pro = 'active', free = undefined
  const subscriptionStatus = subscriptionTier === 'premium' || subscriptionTier === 'pro'
    ? 'active' as const
    : undefined;

  return {
    ...mapDbUserToAdmin(data),
    subscriptionTier: mapDbStatusToTier(subscriptionTier),
    subscriptionStatus,
    petCount: petCountResult || 0,
  };
};

/**
 * Update user role
 */
export const updateUserRole = async (userId: string, role: AdminRole): Promise<ApiResult> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  await logAdminAction('update_role', 'user', userId, { newRole: role });
  return { success: true };
};

/**
 * Update user subscription tier
 * Updates users.subscription_status column directly
 *
 * Database subscription_status enum: 'free' | 'premium' | 'pro'
 */
export const updateUserSubscription = async (
  userId: string,
  subscriptionTier: string
): Promise<ApiResult> => {
  const supabase = getSupabaseClient();

  // Update the users table subscription_status column
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: subscriptionTier,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update subscription in users:', error);
    return { success: false, error: error.message };
  }

  await logAdminAction('update_subscription', 'user', userId, {
    newTier: subscriptionTier
  });
  return { success: true };
};

/**
 * Disable/Enable user account
 */
export const toggleUserStatus = async (userId: string, disabled: boolean): Promise<ApiResult> => {
  const supabase = getSupabaseClient();

  const updateData = disabled
    ? { deleted_at: new Date().toISOString() }
    : { deleted_at: null };

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  await logAdminAction(disabled ? 'disable_user' : 'enable_user', 'user', userId);
  return { success: true };
};

/**
 * Update user profile (Super Admin only)
 * Allows updating email, name, role, subscription, and password
 * Subscription tier is in users.subscription_status column
 */
export const updateUserProfile = async (
  userId: string,
  updates: {
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    role?: AdminRole;
    subscriptionTier?: string;
    phone?: string;
    city?: string;
  }
): Promise<ApiResult> => {
  const supabase = getSupabaseClient();

  // Build update object for users table (includes subscription_status)
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
  if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
  if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.city !== undefined) updateData.city = updates.city;
  // subscription_status in users table uses enum: 'free' | 'premium' | 'pro'
  if (updates.subscriptionTier !== undefined) updateData.subscription_status = updates.subscriptionTier;

  // Update users table
  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  await logAdminAction('update_user_profile', 'user', userId, updates);
  return { success: true };
};

/**
 * Delete user permanently
 */
export const deleteUser = async (userId: string): Promise<ApiResult> => {
  const supabase = getSupabaseClient();

  // First, get the user's auth_user_id
  const { data: userData } = await supabase
    .from('users')
    .select('auth_user_id')
    .eq('id', userId)
    .single();

  if (!userData) return { success: false, error: 'User not found' };

  // Soft delete user record
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  await logAdminAction('delete_user', 'user', userId);
  return { success: true };
};

// ===================================
// PET MANAGEMENT
// ===================================

/**
 * Get all pets with filters
 */
export const getAdminPets = async (options?: {
  search?: string;
  species?: string;
  status?: string;
  hasPhotos?: boolean;
  isFlagged?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
}): Promise<{ pets: AdminPetListItem[]; total: number }> => {
  const supabase = getSupabaseClient();

  // Use a simpler query approach
  let query = supabase
    .from('pets')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,breed.ilike.%${options.search}%`);
  }

  if (options?.species) {
    query = query.eq('species', options.species);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.hasPhotos === true) {
    query = query.not('profile_photo_url', 'is', null);
  } else if (options?.hasPhotos === false) {
    query = query.is('profile_photo_url', null);
  }

  query = query.order('created_at', { ascending: false });

  // Handle pagination - support both page and offset
  const limit = options?.limit || 10;
  let offset = options?.offset || 0;
  if (options?.page !== undefined && options.page > 0) {
    offset = (options.page - 1) * limit;
  }

  if (limit) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data: pets, count, error } = await query;

  if (error) throw new Error(error.message);

  // Fetch user info separately for each pet
  const userIds = [...new Set(pets?.map(p => p.user_id).filter(Boolean) || [])];
  const { data: users } = await supabase
    .from('users')
    .select('auth_user_id, email, full_name, first_name, last_name')
    .in('auth_user_id', userIds);

  const userMap = new Map(users?.map(u => [u.auth_user_id, u]) || []);

  const mappedPets: AdminPetListItem[] = pets?.map((pet) => {
    const owner = userMap.get(pet.user_id);
    const ownerName = owner?.full_name || `${owner?.first_name || ''} ${owner?.last_name || ''}`.trim() || 'Unknown';

    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      status: pet.status,
      ownerId: pet.user_id,
      ownerName,
      ownerEmail: owner?.email,
      profilePhotoUrl: pet.profile_photo_url,
      photoUrl: pet.profile_photo_url,
      photosCount: pet.profile_photo_url ? 1 : 0,
      microchipNumber: pet.microchip_id,
      isFlagged: false,
      createdAt: pet.created_at,
    };
  }) || [];

  return { pets: mappedPets, total: count || 0 };
};

/**
 * Delete pet permanently
 */
export const deletePet = async (petId: string): Promise<ApiResult> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('pets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', petId);

  if (error) return { success: false, error: error.message };

  await logAdminAction('delete_pet', 'pet', petId);
  return { success: true };
};

// ===================================
// SUBSCRIPTION MANAGEMENT
// ===================================

/**
 * Get all subscriptions
 */
export const getAdminSubscriptions = async (options?: {
  search?: string;
  status?: string;
  tier?: string;
  page?: number;
  limit?: number;
  offset?: number;
}): Promise<{ subscriptions: AdminSubscription[]; total: number }> => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      users!subscriptions_user_id_fkey (email, full_name, first_name, last_name)
    `, { count: 'exact' });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.tier) {
    query = query.eq('plan_name', options.tier);
  }

  query = query.order('created_at', { ascending: false });

  // Handle pagination - support both page and offset
  const limit = options?.limit || 10;
  let offset = options?.offset || 0;
  if (options?.page !== undefined && options.page > 0) {
    offset = (options.page - 1) * limit;
  }

  if (limit) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  const subscriptions: AdminSubscription[] = data?.map((s) => {
    const user = s.users as { email?: string; full_name?: string; first_name?: string; last_name?: string } | null;
    const userName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown';

    // Map plan_name to tier
    const tierMap: Record<string, 'free' | 'premium' | 'pro'> = {
      'free': 'free',
      'premium': 'premium',
      'family': 'pro', // Map family to pro
      'pro': 'pro',
    };
    const tier = tierMap[s.plan_name?.toLowerCase()] || 'free';

    return {
      id: s.id,
      userId: s.user_id,
      userName,
      userEmail: user?.email,
      planName: s.plan_name,
      tier,
      status: s.status,
      startedAt: s.current_period_start,
      endsAt: s.current_period_end,
      trialEndsAt: s.trial_ends_at,
      currentPeriodStart: s.current_period_start,
      currentPeriodEnd: s.current_period_end,
      stripeSubscriptionId: s.stripe_subscription_id,
      createdAt: s.created_at,
    };
  }) || [];

  return { subscriptions, total: count || 0 };
};

// ===================================
// ADS MANAGEMENT
// ===================================

/**
 * Get all ads
 */
export const getAds = async (): Promise<Ad[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data?.map(mapDbAdToAd) || [];
};

/**
 * Create a new ad
 */
export const createAd = async (ad: Omit<Ad, 'id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>): Promise<ApiResult<Ad>> => {
  const supabase = getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: userRecord } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.user?.id)
    .single();

  const { data, error } = await supabase
    .from('ads')
    .insert({
      title: ad.title,
      description: ad.description,
      image_url: ad.imageUrl,
      link_url: ad.linkUrl,
      placement: ad.placement,
      start_date: ad.startDate,
      end_date: ad.endDate,
      target_audience: ad.targetAudience,
      is_active: ad.isActive,
      created_by: userRecord?.id,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAdminAction('create_ad', 'ad', data.id, { title: ad.title });
  return { success: true, data: mapDbAdToAd(data) };
};

/**
 * Update an ad
 */
export const updateAd = async (id: string, ad: Partial<Ad>): Promise<ApiResult<Ad>> => {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (ad.title !== undefined) updateData.title = ad.title;
  if (ad.description !== undefined) updateData.description = ad.description;
  if (ad.imageUrl !== undefined) updateData.image_url = ad.imageUrl;
  if (ad.linkUrl !== undefined) updateData.link_url = ad.linkUrl;
  if (ad.placement !== undefined) updateData.placement = ad.placement;
  if (ad.startDate !== undefined) updateData.start_date = ad.startDate;
  if (ad.endDate !== undefined) updateData.end_date = ad.endDate;
  if (ad.targetAudience !== undefined) updateData.target_audience = ad.targetAudience;
  if (ad.isActive !== undefined) updateData.is_active = ad.isActive;

  const { data, error } = await supabase
    .from('ads')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAdminAction('update_ad', 'ad', id);
  return { success: true, data: mapDbAdToAd(data) };
};

/**
 * Delete an ad
 */
export const deleteAd = async (id: string): Promise<ApiResult> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('ads')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  await logAdminAction('delete_ad', 'ad', id);
  return { success: true };
};

// ===================================
// PROMO CODE MANAGEMENT
// ===================================

/**
 * Get all promo codes
 */
export const getPromoCodes = async (): Promise<PromoCode[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data?.map(mapDbPromoCodeToPromoCode) || [];
};

/**
 * Create a promo code
 */
export const createPromoCode = async (
  promoCode: Omit<PromoCode, 'id' | 'createdAt' | 'updatedAt' | 'timesUsed'>
): Promise<ApiResult<PromoCode>> => {
  const supabase = getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: userRecord } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.user?.id)
    .single();

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code: promoCode.code.toUpperCase(),
      discount_type: promoCode.discountType,
      discount_value: promoCode.discountValue,
      expiration_date: promoCode.expirationDate,
      usage_limit: promoCode.usageLimit,
      min_purchase_amount: promoCode.minPurchaseAmount,
      applicable_plans: promoCode.applicablePlans,
      is_active: promoCode.isActive,
      created_by: userRecord?.id,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAdminAction('create_promo_code', 'promo_code', data.id, { code: promoCode.code });
  return { success: true, data: mapDbPromoCodeToPromoCode(data) };
};

/**
 * Update a promo code
 */
export const updatePromoCode = async (
  id: string,
  promoCode: Partial<PromoCode>
): Promise<ApiResult<PromoCode>> => {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (promoCode.code !== undefined) updateData.code = promoCode.code.toUpperCase();
  if (promoCode.discountType !== undefined) updateData.discount_type = promoCode.discountType;
  if (promoCode.discountValue !== undefined) updateData.discount_value = promoCode.discountValue;
  if (promoCode.expirationDate !== undefined) updateData.expiration_date = promoCode.expirationDate;
  if (promoCode.usageLimit !== undefined) updateData.usage_limit = promoCode.usageLimit;
  if (promoCode.minPurchaseAmount !== undefined) updateData.min_purchase_amount = promoCode.minPurchaseAmount;
  if (promoCode.applicablePlans !== undefined) updateData.applicable_plans = promoCode.applicablePlans;
  if (promoCode.isActive !== undefined) updateData.is_active = promoCode.isActive;

  const { data, error } = await supabase
    .from('promo_codes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAdminAction('update_promo_code', 'promo_code', id);
  return { success: true, data: mapDbPromoCodeToPromoCode(data) };
};

/**
 * Delete a promo code
 */
export const deletePromoCode = async (id: string): Promise<ApiResult> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  await logAdminAction('delete_promo_code', 'promo_code', id);
  return { success: true };
};

// ===================================
// PLATFORM SETTINGS
// ===================================

/**
 * Get all platform settings as an object
 */
export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .order('key');

  if (error) throw new Error(error.message);

  // Default values
  const settings: PlatformSettings = {
    maintenanceMode: false,
    maxPetsFree: 1,
    maxPetsPremium: 5,
    maxFamilyFree: 2,
    maxFamilyPremium: 5,
    maxPhotosFree: 1,
    maxPhotosPremium: 10,
    maxPhotosPro: 50,
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: true,
  };

  // Override with database values
  data?.forEach((s) => {
    const key = s.key as keyof PlatformSettings;
    if (key in settings) {
      // Handle boolean conversion
      if (typeof settings[key] === 'boolean') {
        settings[key] = s.value === true || s.value === 'true' || s.value === 1;
      } else if (typeof settings[key] === 'number') {
        settings[key] = Number(s.value) || settings[key];
      } else {
        settings[key] = s.value;
      }
    }
  });

  return settings;
};

/**
 * Update a platform setting
 */
export const updatePlatformSetting = async (
  key: string,
  value: unknown
): Promise<ApiResult> => {
  const supabase = getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: userRecord } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.user?.id)
    .single();

  const { error } = await supabase
    .from('platform_settings')
    .update({
      value,
      updated_by: userRecord?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key);

  if (error) return { success: false, error: error.message };

  await logAdminAction('update_setting', 'settings', undefined, { key, value });
  return { success: true };
};

// ===================================
// AUDIT LOG
// ===================================

/**
 * Get admin audit logs
 */
export const getAdminAuditLogs = async (options?: {
  adminId?: string;
  action?: string;
  targetType?: AdminAuditTargetType;
  page?: number;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AdminAuditLog[]; total: number }> => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('admin_audit_log')
    .select('*', { count: 'exact' });

  if (options?.adminId) {
    query = query.eq('admin_id', options.adminId);
  }

  if (options?.action) {
    query = query.eq('action', options.action);
  }

  if (options?.targetType) {
    query = query.eq('target_type', options.targetType);
  }

  query = query.order('created_at', { ascending: false });

  // Handle pagination - support both page and offset
  const limit = options?.limit || 10;
  let offset = options?.offset || 0;
  if (options?.page !== undefined && options.page > 0) {
    offset = (options.page - 1) * limit;
  }

  if (limit) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  const logs: AdminAuditLog[] = data?.map((log) => ({
    id: log.id,
    adminId: log.admin_id,
    action: log.action,
    targetType: log.target_type,
    targetId: log.target_id,
    details: log.details,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    createdAt: log.created_at,
  })) || [];

  return { logs, total: count || 0 };
};

/**
 * Log an admin action
 */
export const logAdminAction = async (
  action: string,
  targetType: AdminAuditTargetType,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> => {
  const supabase = getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: userRecord } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.user?.id)
    .single();

  if (!userRecord) return;

  await supabase.from('admin_audit_log').insert({
    admin_id: userRecord.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
};

// ===================================
// HELPER FUNCTIONS
// ===================================

interface DbUser {
  id: string;
  auth_user_id?: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  role: string;
  subscription_status?: string;
  last_seen_at?: string;
  is_verified?: boolean;
  avatar_url?: string;
  phone?: string;
  city?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Map database subscription_status to UI SubscriptionTier
 * DB subscription_status enum: 'free' | 'premium' | 'pro'
 * UI tier: 'free' | 'premium' | 'pro'
 */
const mapDbStatusToTier = (status: string | null | undefined): AdminUser['subscriptionTier'] => {
  // Database uses 'free', 'premium', 'pro' directly (subscription_tier enum in users.subscription_status)
  const statusToTier: Record<string, AdminUser['subscriptionTier']> = {
    free: 'free',
    premium: 'premium',
    pro: 'pro',
    family: 'pro', // Legacy fallback: DB 'family' maps to UI 'pro'
    cancelled: 'free',
    expired: 'free',
  };
  return statusToTier[status || 'free'] || 'free';
};

const mapDbUserToAdmin = (user: DbUser): AdminUser => ({
  id: user.id,
  authUserId: user.auth_user_id,
  email: user.email,
  fullName: user.full_name,
  firstName: user.first_name,
  lastName: user.last_name,
  displayName: user.display_name,
  role: user.role as AdminRole,
  subscriptionStatus: user.subscription_status as AdminUser['subscriptionStatus'],
  subscriptionTier: mapDbStatusToTier(user.subscription_status),
  isActive: !user.deleted_at,
  petCount: 0,
  lastSeenAt: user.last_seen_at,
  isVerified: user.is_verified,
  avatarUrl: user.avatar_url,
  phone: user.phone,
  city: user.city,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

interface DbAd {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  placement: string;
  start_date?: string;
  end_date?: string;
  target_audience: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const mapDbAdToAd = (ad: DbAd): Ad => ({
  id: ad.id,
  title: ad.title,
  description: ad.description,
  imageUrl: ad.image_url,
  linkUrl: ad.link_url,
  placement: ad.placement as AdPlacement,
  startDate: ad.start_date,
  endDate: ad.end_date,
  targetAudience: ad.target_audience as AdTargetAudience,
  isActive: ad.is_active,
  impressions: ad.impressions,
  clicks: ad.clicks,
  createdBy: ad.created_by,
  createdAt: ad.created_at,
  updatedAt: ad.updated_at,
});

interface DbPromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  expiration_date?: string;
  usage_limit?: number;
  times_used: number;
  min_purchase_amount?: number;
  applicable_plans?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const mapDbPromoCodeToPromoCode = (promoCode: DbPromoCode): PromoCode => ({
  id: promoCode.id,
  code: promoCode.code,
  discountType: promoCode.discount_type as DiscountType,
  discountValue: promoCode.discount_value,
  expirationDate: promoCode.expiration_date,
  usageLimit: promoCode.usage_limit,
  timesUsed: promoCode.times_used,
  minPurchaseAmount: promoCode.min_purchase_amount,
  applicablePlans: promoCode.applicable_plans,
  isActive: promoCode.is_active,
  createdBy: promoCode.created_by,
  createdAt: promoCode.created_at,
  updatedAt: promoCode.updated_at,
});
