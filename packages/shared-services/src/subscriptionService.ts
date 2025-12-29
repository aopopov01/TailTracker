/**
 * Subscription Service
 * Platform-agnostic subscription management
 */

import type { StorageAdapter } from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';

export type SubscriptionTier = 'free' | 'premium' | 'pro';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due';

export interface SubscriptionFeatures {
  maxPets: number;
  maxFamilyMembers: number;
  photosPerPet: number;
  lostPetReporting: boolean;
  healthRecordExport: boolean;
  enhancedFamilyCoordination: boolean;
  cloudBackup: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: SubscriptionFeatures;
  popular?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription plans configuration
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for single pet owners',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: {
      maxPets: 1,
      maxFamilyMembers: 2,
      photosPerPet: 1,
      lostPetReporting: false,
      healthRecordExport: false,
      enhancedFamilyCoordination: false,
      cloudBackup: true,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: '3 family members + 2 pet profiles',
    price: {
      monthly: 5.99,
      yearly: 50.0,
    },
    features: {
      maxPets: 2,
      maxFamilyMembers: 3,
      photosPerPet: 6,         // Premium tier: 6 photos per pet
      lostPetReporting: false, // Premium tier: can receive but NOT create lost pet alerts
      healthRecordExport: true,
      enhancedFamilyCoordination: true,
      cloudBackup: true,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Unlimited family members + unlimited pets',
    price: {
      monthly: 8.99,
      yearly: 80.0,
    },
    features: {
      maxPets: 999,
      maxFamilyMembers: 999,
      photosPerPet: 12,
      lostPetReporting: true,
      healthRecordExport: true,
      enhancedFamilyCoordination: true,
      cloudBackup: true,
    },
    popular: true,
  },
};

// Cache key and expiry
const CACHE_KEY = 'user_subscription';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Optional storage adapter for caching
let storageAdapter: StorageAdapter | null = null;

/**
 * Set the storage adapter for subscription caching
 */
export const setSubscriptionStorageAdapter = (adapter: StorageAdapter): void => {
  storageAdapter = adapter;
};

/**
 * Map database status to subscription tier
 * Database now uses 'free', 'premium', 'pro' directly (subscription_tier enum)
 */
const mapStatusToTier = (status: string | null): SubscriptionTier => {
  switch (status) {
    case 'pro':
      return 'pro';
    case 'premium':
      return 'premium';
    case 'free':
    case null:
    default:
      return 'free';
  }
};

/**
 * Map database status to subscription status
 * Database now uses 'free', 'premium', 'pro' directly (subscription_tier enum)
 */
const mapDatabaseStatusToSubscriptionStatus = (
  dbStatus: string | null
): SubscriptionStatus => {
  switch (dbStatus) {
    case 'pro':
    case 'premium':
      return 'active';
    case 'free':
    case null:
    default:
      return 'inactive';
  }
};

/**
 * Get default subscription for a user
 */
const getDefaultSubscription = (userId: string): UserSubscription => {
  const now = new Date();
  return {
    id: 'default',
    userId,
    tier: 'free',
    status: 'inactive',
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Get cached subscription if available
 */
const getCachedSubscription = async (): Promise<{
  subscription: UserSubscription | null;
  timestamp: number;
} | null> => {
  if (!storageAdapter) return null;

  try {
    const cached = await storageAdapter.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

/**
 * Cache subscription data
 */
const cacheSubscription = async (
  subscription: UserSubscription | null
): Promise<void> => {
  if (!storageAdapter) return;

  try {
    await storageAdapter.setItem(
      CACHE_KEY,
      JSON.stringify({
        subscription,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.warn('Failed to cache subscription:', error);
  }
};

/**
 * Check if cache is still valid
 */
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_EXPIRY;
};

/**
 * Clear subscription cache
 */
export const clearSubscriptionCache = async (): Promise<void> => {
  if (!storageAdapter) return;

  try {
    await storageAdapter.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear subscription cache:', error);
  }
};

/**
 * Get user's current subscription
 */
export const getUserSubscription = async (
  userId: string
): Promise<UserSubscription | null> => {
  try {
    // Check cache first
    const cached = await getCachedSubscription();
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.subscription;
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select(
        'id, auth_user_id, subscription_status, subscription_expires_at, created_at, updated_at'
      )
      .eq('auth_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return getDefaultSubscription(userId);
    }

    const subscription = data
      ? {
          id: data.id,
          userId: data.auth_user_id || userId,
          tier: mapStatusToTier(data.subscription_status),
          status: mapDatabaseStatusToSubscriptionStatus(data.subscription_status),
          expiresAt: data.subscription_expires_at
            ? new Date(data.subscription_expires_at)
            : undefined,
          createdAt: new Date(data.created_at || new Date()),
          updatedAt: new Date(data.updated_at || new Date()),
        }
      : getDefaultSubscription(userId);

    // Cache the result
    await cacheSubscription(subscription);

    return subscription;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return getDefaultSubscription(userId);
  }
};

/**
 * Get subscription features for a user
 */
export const getSubscriptionFeatures = async (
  userId: string
): Promise<SubscriptionFeatures> => {
  const subscription = await getUserSubscription(userId);
  return SUBSCRIPTION_PLANS[subscription?.tier || 'free'].features;
};

/**
 * Check if user can perform a specific action
 */
export const canPerformAction = async (
  userId: string,
  action: keyof SubscriptionFeatures
): Promise<boolean> => {
  const features = await getSubscriptionFeatures(userId);
  return features[action] as boolean;
};

/**
 * Check if user can add more pets
 */
export const canAddPet = async (
  userId: string,
  currentPetCount: number
): Promise<boolean> => {
  const features = await getSubscriptionFeatures(userId);
  return currentPetCount < features.maxPets;
};

/**
 * Get maximum pets allowed for user
 */
export const getMaxPetsAllowed = async (userId: string): Promise<number> => {
  const features = await getSubscriptionFeatures(userId);
  return features.maxPets;
};

/**
 * Get maximum family members allowed for user
 */
export const getMaxFamilyMembersAllowed = async (
  userId: string
): Promise<number> => {
  const features = await getSubscriptionFeatures(userId);
  return features.maxFamilyMembers;
};

/**
 * Check if user can add more family members
 */
export const canAddFamilyMember = async (
  userId: string,
  currentFamilyCount: number
): Promise<boolean> => {
  const features = await getSubscriptionFeatures(userId);
  return currentFamilyCount < features.maxFamilyMembers;
};

/**
 * Get maximum photos per pet allowed for user
 */
export const getMaxPhotosPerPet = async (userId: string): Promise<number> => {
  const features = await getSubscriptionFeatures(userId);
  return features.photosPerPet;
};

/**
 * Check if user can add more photos to a pet
 */
export const canAddPhoto = async (
  userId: string,
  currentPhotoCount: number
): Promise<boolean> => {
  const features = await getSubscriptionFeatures(userId);
  return currentPhotoCount < features.photosPerPet;
};

/**
 * Check if user can report lost pets
 */
export const canReportLostPet = async (userId: string): Promise<boolean> => {
  const features = await getSubscriptionFeatures(userId);
  return features.lostPetReporting;
};

/**
 * Check if user can export health records
 */
export const canExportHealthRecords = async (
  userId: string
): Promise<boolean> => {
  const features = await getSubscriptionFeatures(userId);
  return features.healthRecordExport;
};

/**
 * Get subscription plan details
 */
export const getSubscriptionPlan = (tier: SubscriptionTier): SubscriptionPlan => {
  return SUBSCRIPTION_PLANS[tier];
};

/**
 * Get all available plans
 */
export const getAllPlans = (): SubscriptionPlan[] => {
  return Object.values(SUBSCRIPTION_PLANS);
};

/**
 * Upgrade user subscription
 * Database now uses 'free', 'premium', 'pro' directly (subscription_tier enum)
 */
export const upgradeSubscription = async (
  userId: string,
  newTier: SubscriptionTier
): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', userId);

    if (error) {
      console.error('Error upgrading subscription:', error);
      return false;
    }

    // Clear cache
    await clearSubscriptionCache();

    return true;
  } catch (error) {
    console.error('Error in upgradeSubscription:', error);
    return false;
  }
};

/**
 * Check if user is on trial
 */
export const isOnTrial = async (userId: string): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);
  if (!subscription || subscription.status !== 'active') {
    return false;
  }

  if (subscription.expiresAt) {
    const now = new Date();
    const daysRemaining =
      (subscription.expiresAt.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);
    return daysRemaining <= 7 && daysRemaining > 0;
  }

  return false;
};

/**
 * Get trial days remaining
 */
export const getTrialDaysRemaining = async (userId: string): Promise<number> => {
  const subscription = await getUserSubscription(userId);
  if (!subscription || !subscription.expiresAt) {
    return 0;
  }

  const now = new Date();
  const expiresAt = subscription.expiresAt;

  if (now > expiresAt) {
    return 0;
  }

  const diffTime = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return daysRemaining <= 7 ? daysRemaining : 0;
};
