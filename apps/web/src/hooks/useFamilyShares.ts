/**
 * Family Shares Hook
 * Provides family sharing data and mutations with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyFamilyShares,
  getSharesWithMe,
  getPendingInvitations,
  getPetsSharedWithMe,
  getSharedPetsForShare,
  getFamilySharingSummary,
  inviteFamilyMember,
  respondToShareInvitation,
  removeFamilyMember,
  updateSharedPets,
  addPetToShare,
  removePetFromShare,
  checkPetAccess,
  hasSharedPets,
  type FamilyShare,
  type SharedPet,
  type FamilySharingSummary,
  type InviteFamilyMemberRequest,
  type UpdateSharedPetsRequest,
  type RespondToShareRequest,
  type FamilySharingResult,
} from '@tailtracker/shared-services';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { invalidateFamilyData } from '@/lib/cacheUtils';

// Query Keys
export const FAMILY_SHARING_KEYS = {
  all: ['familySharing'] as const,
  myShares: () => [...FAMILY_SHARING_KEYS.all, 'myShares'] as const,
  sharesWithMe: () => [...FAMILY_SHARING_KEYS.all, 'sharesWithMe'] as const,
  pendingInvitations: () => [...FAMILY_SHARING_KEYS.all, 'pendingInvitations'] as const,
  petsSharedWithMe: () => [...FAMILY_SHARING_KEYS.all, 'petsSharedWithMe'] as const,
  sharedPetsForShare: (shareId: string) =>
    [...FAMILY_SHARING_KEYS.all, 'sharedPets', shareId] as const,
  summary: () => [...FAMILY_SHARING_KEYS.all, 'summary'] as const,
  hasSharedPets: () => [...FAMILY_SHARING_KEYS.all, 'hasSharedPets'] as const,
  petAccess: (petId: string) => [...FAMILY_SHARING_KEYS.all, 'petAccess', petId] as const,
};

/**
 * Hook for managing family shares (as the owner)
 */
export const useMyFamilyShares = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: shares,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: FAMILY_SHARING_KEYS.myShares(),
    queryFn: getMyFamilyShares,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidate = async () => {
    await invalidateFamilyData(queryClient);
  };

  return {
    shares: shares || [],
    isLoading,
    error: error as Error | null,
    refetch,
    invalidate,
  };
};

/**
 * Hook for viewing shares where pets are shared with me
 */
export const useSharesWithMe = () => {
  const { user } = useAuth();

  const {
    data: shares,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: FAMILY_SHARING_KEYS.sharesWithMe(),
    queryFn: getSharesWithMe,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    shares: shares || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook for pending family share invitations
 */
export const usePendingInvitations = () => {
  const { user } = useAuth();

  const {
    data: invitations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: FAMILY_SHARING_KEYS.pendingInvitations(),
    queryFn: getPendingInvitations,
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute - check more frequently for invitations
    refetchOnWindowFocus: true,
  });

  return {
    invitations: invitations || [],
    count: invitations?.length || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook for pets shared with the current user
 */
export const usePetsSharedWithMe = () => {
  const { user } = useAuth();

  const {
    data: sharedPets,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: FAMILY_SHARING_KEYS.petsSharedWithMe(),
    queryFn: getPetsSharedWithMe,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    sharedPets: sharedPets || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook for checking if user has any shared pets
 */
export const useHasSharedPets = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: FAMILY_SHARING_KEYS.hasSharedPets(),
    queryFn: hasSharedPets,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    hasSharedPets: data || false,
    isLoading,
  };
};

/**
 * Hook for getting shared pets in a specific family share
 */
export const useSharedPetsForShare = (familyShareId: string | undefined) => {
  const { user } = useAuth();

  const {
    data: sharedPets,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: FAMILY_SHARING_KEYS.sharedPetsForShare(familyShareId || ''),
    queryFn: () => getSharedPetsForShare(familyShareId!),
    enabled: !!user?.id && !!familyShareId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    sharedPets: sharedPets || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook for family sharing summary (counts and limits)
 */
export const useFamilySharingSummary = () => {
  const { user } = useAuth();
  const { tier, features } = useSubscription();

  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: FAMILY_SHARING_KEYS.summary(),
    queryFn: () => getFamilySharingSummary(tier),
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  // Use pre-computed features from useSubscription (already resolved from tier)
  const maxFamilyMembers = features?.maxFamilyMembers ?? 1;

  const defaultSummary: FamilySharingSummary = {
    totalSharedByMe: 0,
    totalSharedWithMe: 0,
    pendingInvitations: 0,
    acceptedShares: 0,
    remainingSlots: maxFamilyMembers,
    maxAllowed: maxFamilyMembers,
  };

  // Always override maxAllowed with correct tier limit from features
  // The backend may return stale/incorrect values
  const correctedSummary: FamilySharingSummary = summary
    ? {
        ...summary,
        maxAllowed: maxFamilyMembers,
        remainingSlots: maxFamilyMembers - (summary.acceptedShares || 0),
      }
    : defaultSummary;

  return {
    summary: correctedSummary,
    isLoading,
    error: error as Error | null,
    refetch,
    canInviteMore: correctedSummary.remainingSlots > 0,
  };
};

/**
 * Hook for checking pet access (owner or shared)
 */
export const usePetAccess = (petId: string | undefined) => {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: FAMILY_SHARING_KEYS.petAccess(petId || ''),
    queryFn: () => checkPetAccess(petId!),
    enabled: !!user?.id && !!petId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    hasAccess: data?.hasAccess || false,
    isOwner: data?.isOwner || false,
    permissions: data?.permissions,
    isLoading,
    error: error as Error | null,
  };
};

// ===================================
// MUTATIONS
// ===================================

/**
 * Hook for inviting a family member
 */
export const useInviteFamilyMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: InviteFamilyMemberRequest) => inviteFamilyMember(request),
    onSuccess: async () => {
      await invalidateFamilyData(queryClient);
    },
  });
};

/**
 * Hook for responding to a family share invitation
 */
export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RespondToShareRequest) => respondToShareInvitation(request),
    onSuccess: async () => {
      await invalidateFamilyData(queryClient);
    },
  });
};

/**
 * Hook for removing a family member
 */
export const useRemoveFamilyMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => removeFamilyMember(shareId),
    onSuccess: async () => {
      await invalidateFamilyData(queryClient);
    },
  });
};

/**
 * Hook for updating shared pets configuration
 */
export const useUpdateSharedPets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateSharedPetsRequest) => updateSharedPets(request),
    onSuccess: async (_, variables) => {
      // Invalidate the specific share's pets
      queryClient.invalidateQueries({
        queryKey: FAMILY_SHARING_KEYS.sharedPetsForShare(variables.familyShareId),
      });
      // Also invalidate the general family data
      await invalidateFamilyData(queryClient);
    },
  });
};

/**
 * Hook for adding a pet to a share
 */
export const useAddPetToShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      familyShareId,
      petId,
      options,
    }: {
      familyShareId: string;
      petId: string;
      options?: {
        shareCalendar?: boolean;
        shareVaccinations?: boolean;
        shareMedicalRecords?: boolean;
      };
    }) => addPetToShare(familyShareId, petId, options),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: FAMILY_SHARING_KEYS.sharedPetsForShare(variables.familyShareId),
      });
      await invalidateFamilyData(queryClient);
    },
  });
};

/**
 * Hook for removing a pet from a share
 */
export const useRemovePetFromShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyShareId, petId }: { familyShareId: string; petId: string }) =>
      removePetFromShare(familyShareId, petId),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: FAMILY_SHARING_KEYS.sharedPetsForShare(variables.familyShareId),
      });
      await invalidateFamilyData(queryClient);
    },
  });
};

// ===================================
// COMBINED HOOK
// ===================================

/**
 * Combined hook for family sharing - provides all data and mutations
 */
export const useFamilySharing = () => {
  const { shares: myShares, isLoading: isLoadingMyShares } = useMyFamilyShares();
  const { shares: sharesWithMe, isLoading: isLoadingSharesWithMe } = useSharesWithMe();
  const { invitations, count: pendingCount } = usePendingInvitations();
  const { sharedPets } = usePetsSharedWithMe();
  const { summary, canInviteMore } = useFamilySharingSummary();

  const inviteMutation = useInviteFamilyMember();
  const respondMutation = useRespondToInvitation();
  const removeMutation = useRemoveFamilyMember();

  return {
    // Data
    myShares,
    sharesWithMe,
    invitations,
    pendingCount,
    sharedPets,
    summary,
    canInviteMore,

    // Loading states
    isLoading: isLoadingMyShares || isLoadingSharesWithMe,

    // Mutations
    invite: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    inviteError: inviteMutation.error?.message,

    respond: respondMutation.mutateAsync,
    isResponding: respondMutation.isPending,
    respondError: respondMutation.error?.message,

    remove: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
    removeError: removeMutation.error?.message,
  };
};

// Export types
export type {
  FamilyShare,
  SharedPet,
  FamilySharingSummary,
  InviteFamilyMemberRequest,
  UpdateSharedPetsRequest,
  RespondToShareRequest,
  FamilySharingResult,
};
