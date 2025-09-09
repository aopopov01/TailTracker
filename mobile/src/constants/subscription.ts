/**
 * TailTracker Subscription Constants
 * Contains pricing, limits, and configuration for all subscription tiers
 */

import { SubscriptionTier, SubscriptionTierConfig, SubscriptionLimits } from '../types';

// ===================================
// SUBSCRIPTION TIER LIMITS
// ===================================

/**
 * Free tier limits
 */
export const FREE_TIER_LIMITS: SubscriptionLimits = {
  maxPets: 1,
  maxFamilyMembers: 2,
  canCreateLostPets: false,
  maxPhotosPerPet: 1,
  hasAdvancedFeatures: false,
};

/**
 * Premium tier limits
 */
export const PREMIUM_TIER_LIMITS: SubscriptionLimits = {
  maxPets: 2,
  maxFamilyMembers: 3,
  canCreateLostPets: false,
  maxPhotosPerPet: 6,
  hasAdvancedFeatures: true,
};

/**
 * Pro tier limits
 */
export const PRO_TIER_LIMITS: SubscriptionLimits = {
  maxPets: Infinity,
  maxFamilyMembers: Infinity,
  canCreateLostPets: true,
  maxPhotosPerPet: 12,
  hasAdvancedFeatures: true,
};

// ===================================
// SUBSCRIPTION TIER CONFIGURATIONS
// ===================================

/**
 * Complete configuration for all subscription tiers
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  free: {
    tier: 'free',
    name: 'Free',
    limits: FREE_TIER_LIMITS,
    features: [
      '1 pet profile',
      '2 family members',
      '1 photo per pet',
      'Basic health tracking',
      'Essential reminders',
      'Receive lost pet alerts',
      'Family sharing (read-only)',
    ],
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    pricing: {
      monthlyPrice: 5.99,
      annualPrice: 50.00,
      currency: 'EUR',
    },
    limits: PREMIUM_TIER_LIMITS,
    features: [
      '2 pet profiles',
      '3 family members',
      '6 photos per pet',
      'Enhanced health tracking',
      'Advanced reminders',
      'Receive lost pet alerts',
      'Family collaboration',
      'QR code sharing',
      'Export capabilities',
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    pricing: {
      monthlyPrice: 8.99,
      annualPrice: 80.00,
      currency: 'EUR',
    },
    limits: PRO_TIER_LIMITS,
    features: [
      'Unlimited pet profiles',
      'Unlimited family members',
      '12 photos per pet',
      'Create lost pet alerts',
      'Receive lost pet alerts',
      'Community notifications',
      'Advanced family management',
      'Professional tools',
      'Advanced analytics',
    ],
  },
};

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Get subscription limits for a specific tier
 */
export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  return SUBSCRIPTION_TIERS[tier].limits;
}

/**
 * Get subscription configuration for a specific tier
 */
export function getSubscriptionConfig(tier: SubscriptionTier): SubscriptionTierConfig {
  return SUBSCRIPTION_TIERS[tier];
}

/**
 * Check if a user can add more pets based on their subscription tier
 */
export function canAddMorePets(currentPetCount: number, tier: SubscriptionTier): boolean {
  const limits = getSubscriptionLimits(tier);
  return currentPetCount < limits.maxPets;
}

/**
 * Check if a user can add more family members based on their subscription tier
 */
export function canAddMoreFamilyMembers(currentMemberCount: number, tier: SubscriptionTier): boolean {
  const limits = getSubscriptionLimits(tier);
  return currentMemberCount < limits.maxFamilyMembers;
}

/**
 * Check if a user can create lost pet alerts based on their subscription tier
 */
export function canCreateLostPets(tier: SubscriptionTier): boolean {
  const limits = getSubscriptionLimits(tier);
  return limits.canCreateLostPets;
}

/**
 * Check if a user can add more photos to a pet based on their subscription tier
 */
export function canAddMorePhotos(currentPhotoCount: number, tier: SubscriptionTier): boolean {
  const limits = getSubscriptionLimits(tier);
  return currentPhotoCount < limits.maxPhotosPerPet;
}

/**
 * Get the maximum allowed count for a specific limit type
 */
export function getMaxAllowed(tier: SubscriptionTier, limitType: keyof SubscriptionLimits): number | boolean {
  const limits = getSubscriptionLimits(tier);
  return limits[limitType];
}

// ===================================
// PRICING CONSTANTS
// ===================================

/**
 * Monthly prices by tier (in EUR)
 */
export const MONTHLY_PRICES = {
  premium: 5.99,
  pro: 8.99,
} as const;

/**
 * Annual prices by tier (in EUR)
 */
export const ANNUAL_PRICES = {
  premium: 50.00,
  pro: 80.00,
} as const;

/**
 * Annual discount percentages
 */
export const ANNUAL_DISCOUNTS = {
  premium: Math.round((1 - ANNUAL_PRICES.premium / (MONTHLY_PRICES.premium * 12)) * 100),
  pro: Math.round((1 - ANNUAL_PRICES.pro / (MONTHLY_PRICES.pro * 12)) * 100),
} as const;