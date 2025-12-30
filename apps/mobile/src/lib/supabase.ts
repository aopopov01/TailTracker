/**
 * TailTracker Supabase Client Configuration
 * Re-export for consistent imports across the app
 */

// Re-export initialization utilities
export { initializeSupabase, getSupabase, isClientInitialized } from './supabaseInit';

// Re-export native storage adapter
export { nativeStorageAdapter } from './nativeStorageAdapter';

// Re-export main supabase service
export { supabase, supabaseHelpers } from '../services/supabase';
export { default } from '../services/supabase';

// Re-export shared services for direct usage
export {
  // Auth
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  refreshSession,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  // Pets
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  upsertPetFromOnboarding,
  getPetCount,
  // Subscriptions
  getUserSubscription,
  getSubscriptionFeatures,
  canPerformAction,
  canAddPet,
  getMaxPetsAllowed,
  getMaxFamilyMembersAllowed,
  canAddFamilyMember,
  getMaxPhotosPerPet,
  canAddPhoto,
  canReportLostPet,
  canExportHealthRecords,
  getSubscriptionPlan,
  getAllPlans,
  upgradeSubscription,
  isOnTrial,
  getTrialDaysRemaining,
  SUBSCRIPTION_PLANS,
} from '../services/supabase';
