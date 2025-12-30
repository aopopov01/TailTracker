/**
 * Subscription Hook
 * Provides fresh subscription data with real-time updates
 * Uses staleTime: 0 to always fetch fresh data from DB
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUserSubscription,
  clearSubscriptionCache,
  SUBSCRIPTION_PLANS,
  type UserSubscription,
  type SubscriptionFeatures,
  type SubscriptionTier,
} from '@tailtracker/shared-services';
import { useAuth } from './useAuth';

export interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  features: SubscriptionFeatures;
  tier: SubscriptionTier;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  invalidate: () => Promise<void>;
}

/**
 * Hook for accessing user subscription data with real-time freshness
 * Uses staleTime: 0 to ensure admin changes reflect immediately
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: subscription,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Clear any cached data to ensure fresh read
      await clearSubscriptionCache();
      return getUserSubscription(user.id);
    },
    enabled: !!user?.id,
    // CRITICAL: staleTime: 0 ensures we always fetch fresh data
    staleTime: 0,
    // Refetch when window regains focus (e.g., after admin makes changes)
    refetchOnWindowFocus: true,
    // Refetch when component mounts
    refetchOnMount: true,
    // Retry on failure
    retry: 2,
  });

  const tier = subscription?.tier || 'free';
  const features = SUBSCRIPTION_PLANS[tier].features;

  /**
   * Force invalidate subscription cache and refetch
   * Call this after admin makes subscription changes
   */
  const invalidate = async () => {
    await clearSubscriptionCache();
    await queryClient.invalidateQueries({ queryKey: ['subscription'] });
  };

  return {
    subscription: subscription || null,
    features,
    tier,
    isLoading,
    error: error as Error | null,
    refetch,
    invalidate,
  };
};

/**
 * Hook for checking subscription limits and feature access
 * Provides helper functions for feature gating across the platform
 */
export const useSubscriptionLimits = () => {
  const { features, tier, isLoading } = useSubscription();

  // Limit checks - returns true if user can add more
  const canAddPet = (currentCount: number) => currentCount < features.maxPets;
  const canAddFamilyMember = (currentCount: number) => currentCount < features.maxFamilyMembers;
  const canAddPhoto = (currentCount: number) => currentCount < features.photosPerPet;
  const canUploadDocument = (currentCount: number) => currentCount < features.maxDocumentsPerAppointment;

  // Feature access checks - returns true if feature is available for tier
  const canSyncCalendar = () => features.canSyncCalendar;
  const canReceiveEmailReminders = () => features.canReceiveEmailReminders;
  const canCreateLostPetAlert = () => features.canCreateLostPets;
  const isAdFree = () => features.isAdFree;

  // Legacy feature checks (kept for backwards compatibility)
  const canReportLostPet = () => features.lostPetReporting;
  const canExportHealthRecords = () => features.healthRecordExport;

  // Upgrade prompts - returns required tier for feature
  const getRequiredTierForFeature = (feature: keyof SubscriptionFeatures): SubscriptionTier | null => {
    if (features[feature]) return null; // Already have access

    // Check which tier unlocks this feature
    const premiumFeatures = SUBSCRIPTION_PLANS.premium.features;
    const proFeatures = SUBSCRIPTION_PLANS.pro.features;

    if (premiumFeatures[feature]) return 'premium';
    if (proFeatures[feature]) return 'pro';
    return null;
  };

  // Check if user is at or above a specific tier
  const isAtLeastTier = (requiredTier: SubscriptionTier): boolean => {
    const tierOrder: SubscriptionTier[] = ['free', 'premium', 'pro'];
    const currentIndex = tierOrder.indexOf(tier);
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return currentIndex >= requiredIndex;
  };

  return {
    // Current tier info
    tier,
    isLoading,
    isPremium: tier === 'premium' || tier === 'pro',
    isPro: tier === 'pro',

    // Limits (raw values)
    maxPets: features.maxPets,
    maxFamilyMembers: features.maxFamilyMembers,
    maxPhotosPerPet: features.photosPerPet,
    maxDocumentsPerAppointment: features.maxDocumentsPerAppointment,

    // Limit check functions
    canAddPet,
    canAddFamilyMember,
    canAddPhoto,
    canUploadDocument,

    // Feature access functions
    canSyncCalendar,
    canReceiveEmailReminders,
    canCreateLostPetAlert,
    isAdFree,

    // Legacy functions (deprecated but kept for compatibility)
    canReportLostPet,
    canExportHealthRecords,

    // Utility functions
    getRequiredTierForFeature,
    isAtLeastTier,

    // Raw features object for advanced use cases
    features,
  };
};

export type { UserSubscription, SubscriptionFeatures, SubscriptionTier };
