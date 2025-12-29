/**
 * TailTracker Shared Services
 * Platform-agnostic business logic and API operations
 */

// Supabase Client
export {
  createSupabaseClient,
  getSupabaseClient,
  resetSupabaseClient,
  isClientInitialized,
  browserStorageAdapter,
  createMemoryStorageAdapter,
  type SupabaseConfig,
  type SupabaseClient,
} from './supabase/client';

// Authentication Service
export {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  refreshSession,
  resetPassword,
  updatePassword,
  onAuthStateChange,
} from './authService';

// Pet Service
export {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  upsertPetFromOnboarding,
  getPetCount,
  getHiddenPets,
  hidePetsOnDowngrade,
  restoreHiddenPets,
  getHiddenPetCount,
} from './petService';

// Pet Photo Service
export {
  getPetPhotos,
  getPetPhotoCount,
  uploadPetPhoto,
  deletePetPhoto,
  setProfilePhoto,
  getPhotoLimits,
  type PetPhoto,
  type PhotoUploadResult,
} from './petPhotoService';

// Subscription Service
export {
  setSubscriptionStorageAdapter,
  clearSubscriptionCache,
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
  type SubscriptionTier,
  type SubscriptionStatus,
  type SubscriptionFeatures,
  type SubscriptionPlan,
  type UserSubscription,
} from './subscriptionService';

// Vaccination Service
export {
  getVaccinations,
  getVaccinationsWithStatus,
  getVaccinationById,
  createVaccination,
  updateVaccination,
  deleteVaccination,
  getUpcomingVaccinations,
  getOverdueVaccinations,
  getVaccinationSummary,
  type Vaccination,
  type VaccinationData,
  type VaccinationStatus,
  type VaccinationWithStatus,
  type VaccinationSummary,
  type DatabaseVaccination,
  type VaccinationEntryType,
  type VaccinationDocument,
} from './vaccinationService';

// Medical Record Service
export {
  getMedicalRecords,
  getMedicalRecordsByType,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getRecentMedicalRecords,
  getScheduledRecords,
  getMedicalRecordSummary,
  RECORD_TYPE_INFO,
  type MedicalRecord,
  type MedicalRecordData,
  type MedicalRecordType,
  type MedicalRecordSummary,
  type RecordTypeInfo,
  type DatabaseMedicalRecord,
  type MedicalRecordEntryType,
  type MedicalRecordDocument,
} from './medicalRecordService';

// Reminder Service
export {
  getReminders,
  getReminderById,
  getPendingRemindersCount,
  createReminder,
  resolveReminder,
  dismissReminder,
  deleteReminder,
  syncReminders,
  getReminderSummary,
  type Reminder,
  type ReminderWithPet,
  type ReminderStatus,
  type ReminderSourceType,
  type CreateReminderData,
  type ReminderSummary,
  type DatabaseReminder,
} from './reminderService';

// Family Sharing Service
export {
  getPetFamilyMembers,
  getPetFamilyMemberCount,
  getTotalFamilyMemberCount,
  addFamilyMember,
  removeFamilyMember,
  getSharedPetsWithMe,
  isUserFamilyMember,
  checkPetAccess,
  type PetShare,
  type FamilyMember,
} from './familySharingService';

// Admin Service
export {
  isAdmin,
  getCurrentAdminUser,
  getAdminStats,
  getRecentActivity,
  getAdminUsers,
  getAdminUserById,
  updateUserRole,
  updateUserSubscription,
  updateUserProfile,
  toggleUserStatus,
  deleteUser,
  getAdminPets,
  deletePet as adminDeletePet,
  getAdminSubscriptions,
  getAds,
  createAd,
  updateAd,
  deleteAd,
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPlatformSettings,
  updatePlatformSetting,
  getAdminAuditLogs,
  logAdminAction,
} from './adminService';
