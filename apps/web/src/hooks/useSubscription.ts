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
 * Hook for checking subscription limits
 */
export const useSubscriptionLimits = () => {
  const { features, tier, isLoading } = useSubscription();

  const canAddPet = (currentCount: number) => currentCount < features.maxPets;
  const canAddFamilyMember = (currentCount: number) => currentCount < features.maxFamilyMembers;
  const canAddPhoto = (currentCount: number) => currentCount < features.photosPerPet;
  const canReportLostPet = () => features.lostPetReporting;
  const canExportHealthRecords = () => features.healthRecordExport;

  return {
    maxPets: features.maxPets,
    maxFamilyMembers: features.maxFamilyMembers,
    maxPhotosPerPet: features.photosPerPet,
    canAddPet,
    canAddFamilyMember,
    canAddPhoto,
    canReportLostPet,
    canExportHealthRecords,
    tier,
    isLoading,
  };
};

export type { UserSubscription, SubscriptionFeatures, SubscriptionTier };
