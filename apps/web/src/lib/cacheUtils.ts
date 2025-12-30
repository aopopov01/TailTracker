/**
 * Cache Invalidation Utilities
 * Centralized cache management for TailTracker
 */

import { queryClient } from './queryClient';

/**
 * Invalidate all cached queries
 * Use sparingly - only for major state changes like logout
 */
export const invalidateAll = () => {
  queryClient.invalidateQueries();
};

/**
 * Clear all cached queries and reset
 * Use for logout or major state resets
 */
export const clearAllCache = () => {
  queryClient.clear();
};

/**
 * Invalidate pet-related data
 * Call after creating, updating, or deleting pet data
 */
export const invalidatePetData = (petId?: string) => {
  queryClient.invalidateQueries({ queryKey: ['pets'] });

  if (petId) {
    queryClient.invalidateQueries({ queryKey: ['pet', petId] });
    queryClient.invalidateQueries({ queryKey: ['vaccinations', petId] });
    queryClient.invalidateQueries({ queryKey: ['medical-records', petId] });
    queryClient.invalidateQueries({ queryKey: ['reminders', petId] });
  }

  // Also invalidate related data that might display pet info
  queryClient.invalidateQueries({ queryKey: ['calendar'] });
  queryClient.invalidateQueries({ queryKey: ['reminders'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

/**
 * Invalidate vaccination-related data
 * Call after creating, updating, or deleting vaccinations
 */
export const invalidateVaccinationData = (petId?: string) => {
  queryClient.invalidateQueries({ queryKey: ['vaccinations'] });

  if (petId) {
    queryClient.invalidateQueries({ queryKey: ['vaccinations', petId] });
    queryClient.invalidateQueries({ queryKey: ['pet', petId] });
  }

  queryClient.invalidateQueries({ queryKey: ['calendar'] });
  queryClient.invalidateQueries({ queryKey: ['reminders'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

/**
 * Invalidate medical record data
 * Call after creating, updating, or deleting medical records
 */
export const invalidateMedicalRecordData = (petId?: string) => {
  queryClient.invalidateQueries({ queryKey: ['medical-records'] });

  if (petId) {
    queryClient.invalidateQueries({ queryKey: ['medical-records', petId] });
    queryClient.invalidateQueries({ queryKey: ['pet', petId] });
  }

  queryClient.invalidateQueries({ queryKey: ['calendar'] });
  queryClient.invalidateQueries({ queryKey: ['reminders'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

/**
 * Invalidate reminder data
 * Call after creating, updating, or deleting reminders
 */
export const invalidateReminderData = (petId?: string) => {
  queryClient.invalidateQueries({ queryKey: ['reminders'] });

  if (petId) {
    queryClient.invalidateQueries({ queryKey: ['reminders', petId] });
  }

  queryClient.invalidateQueries({ queryKey: ['calendar'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

/**
 * Invalidate user and subscription data
 * Call after subscription changes or profile updates
 */
export const invalidateUserData = () => {
  queryClient.invalidateQueries({ queryKey: ['user'] });
  queryClient.invalidateQueries({ queryKey: ['subscription'] });
  queryClient.invalidateQueries({ queryKey: ['profile'] });
};

/**
 * Invalidate subscription data specifically
 * Call after subscription upgrades, downgrades, or cancellations
 */
export const invalidateSubscriptionData = () => {
  queryClient.invalidateQueries({ queryKey: ['subscription'] });
  queryClient.invalidateQueries({ queryKey: ['user'] });
};

/**
 * Invalidate family sharing data
 * Call after adding or removing family members
 */
export const invalidateFamilyData = (petId?: string) => {
  queryClient.invalidateQueries({ queryKey: ['family'] });
  queryClient.invalidateQueries({ queryKey: ['family-members'] });
  queryClient.invalidateQueries({ queryKey: ['user'] });

  if (petId) {
    queryClient.invalidateQueries({ queryKey: ['pet', petId] });
  }
};

/**
 * Invalidate lost pet data
 * Call after reporting or updating lost pet status
 */
export const invalidateLostPetData = (petId?: string) => {
  queryClient.invalidateQueries({ queryKey: ['lost-pets'] });
  queryClient.invalidateQueries({ queryKey: ['pets'] });

  if (petId) {
    queryClient.invalidateQueries({ queryKey: ['pet', petId] });
  }

  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

/**
 * Invalidate admin data
 * Call after admin operations
 */
export const invalidateAdminData = () => {
  // Admin overview/dashboard
  queryClient.invalidateQueries({ queryKey: ['admin'] });
  queryClient.invalidateQueries({ queryKey: ['adminStats'] });

  // Admin users management
  queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

  // Admin pets management
  queryClient.invalidateQueries({ queryKey: ['adminPets'] });

  // Admin ads and promo codes
  queryClient.invalidateQueries({ queryKey: ['adminAds'] });
  queryClient.invalidateQueries({ queryKey: ['adminPromoCodes'] });

  // Platform settings
  queryClient.invalidateQueries({ queryKey: ['platformSettings'] });

  // Audit logs
  queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
};

/**
 * Force refetch specific query
 * Use when you need immediate fresh data
 */
export const forceRefetch = (queryKey: string[]) => {
  queryClient.refetchQueries({ queryKey });
};

/**
 * Prefetch data for a route
 * Call before navigation to improve perceived performance
 */
export const prefetchPetData = async (petId: string, fetchFn: () => Promise<unknown>) => {
  await queryClient.prefetchQuery({
    queryKey: ['pet', petId],
    queryFn: fetchFn,
    staleTime: 1000 * 60, // 1 minute
  });
};
