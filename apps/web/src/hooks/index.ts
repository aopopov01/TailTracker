/**
 * Web App Hooks
 * Centralized exports for all custom hooks
 */

export { useAuth } from './useAuth';
export {
  useSubscription,
  useSubscriptionLimits,
  type UseSubscriptionReturn,
  type UserSubscription,
  type SubscriptionFeatures,
  type SubscriptionTier,
} from './useSubscription';
export { useRealtimeUpdates, useTableUpdates } from './useRealtimeUpdates';
export {
  useFamilySharing,
  useMyFamilyShares,
  useSharesWithMe,
  usePendingInvitations,
  usePetsSharedWithMe,
  useHasSharedPets,
  useSharedPetsForShare,
  useFamilySharingSummary,
  usePetAccess,
  useInviteFamilyMember,
  useRespondToInvitation,
  useRemoveFamilyMember,
  useUpdateSharedPets,
  useAddPetToShare,
  useRemovePetFromShare,
  FAMILY_SHARING_KEYS,
  type FamilyShare,
  type SharedPet,
  type FamilySharingSummary,
  type InviteFamilyMemberRequest,
  type UpdateSharedPetsRequest,
  type RespondToShareRequest,
  type FamilySharingResult,
} from './useFamilyShares';
