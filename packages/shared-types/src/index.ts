/**
 * TailTracker Shared Types
 * Platform-agnostic type definitions for web and mobile
 */

export * from './database.types';

// ===================================
// CORE ENTITY TYPES
// ===================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface OwnedEntity extends BaseEntity {
  ownerId: string;
}

// ===================================
// USER & AUTHENTICATION TYPES
// ===================================

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  lastLoginAt?: string;
  profilePictureUrl?: string;
  role?: 'user' | 'admin' | 'super_admin';
  subscriptionTier?: 'free' | 'premium' | 'pro';
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  firstName: string;
  lastName: string;
  confirmPassword: string;
  invitationCode?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: number;
  createdAt: number;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
  errorCode?: string;
  requiresEmailVerification?: boolean;
  smtpDelay?: boolean;
}

export interface LoginResult extends AuthResult {
  requiresTwoFactor?: boolean;
}

export interface RegistrationResult extends AuthResult {}

// ===================================
// PET TYPES
// ===================================

export type PetSpecies = 'dog' | 'cat' | 'bird' | 'other';
export type PetGender = 'male' | 'female' | 'unknown';
export type PetStatus = 'active' | 'lost' | 'found' | 'inactive' | 'deceased';
export type ExerciseLevel = 'low' | 'moderate' | 'high';

export interface PhysicalMeasurement {
  value: number;
  unit: string;
  measuredAt?: string;
}

export interface MedicalRecord {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface VaccinationRecord {
  id: string;
  vaccine: string;
  administeredDate: string;
  nextDueDate?: string;
  batchNumber?: string;
  veterinarianId?: string;
  notes?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  email?: string;
}

export interface Pet extends OwnedEntity {
  // Basic Information
  name: string;
  species: PetSpecies;
  photos: string[];

  // Physical Details
  breed?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: PetGender;
  color?: string;
  markings?: string;
  weight?: PhysicalMeasurement;
  height?: PhysicalMeasurement;

  // Official Records
  microchipNumber?: string;
  registrationNumber?: string;

  // Health Profile
  medicalConditions?: MedicalRecord[];
  currentMedications?: MedicalRecord[];
  allergies?: string[];
  lastVetVisit?: string;
  vaccinations?: VaccinationRecord[];

  // Emergency Contact
  emergencyContact?: EmergencyContact;

  // Last Checkup (vet visit)
  lastCheckup?: string;

  // Personality & Care
  personalityTraits?: string[];
  foodPreferences?: {
    favorites?: string[];
    schedule?: string;
    specialDiet?: string[];
  };
  favoriteActivities?: string[];
  exerciseNeeds?: ExerciseLevel;
  specialNotes?: string;

  // Status and Meta
  status: PetStatus;
  lostPetId?: string;
  profileCompleteness: number;
  isPublic?: boolean;
}

export interface PetProfile extends Partial<Pet> {
  // All fields are optional for onboarding flow
}

export interface PetOnboardingState {
  currentStep: number;
  totalSteps: number;
  petData: Partial<Pet>;
  completedSteps: number[];
  skippedFields: string[];
  sessionId: string;
}

// Database format (snake_case)
export interface DatabasePet {
  id?: string;
  user_id: string;
  name: string;
  species: string;
  breed?: string | null;
  color?: string | null;
  color_markings?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  weight_kg?: number | null;
  height?: string | null;
  microchip_number?: string | null;
  medical_conditions?: string[] | null;
  current_medications?: string[] | null;
  allergies?: string | null;
  special_notes?: string | null;
  emergency_contact?: EmergencyContact | null;
  last_checkup?: string | null;
  personality_traits?: string[] | null;
  favorite_activities?: string[] | null;
  exercise_needs?: string | null;
  favorite_food?: string | null;
  feeding_schedule?: string | null;
  special_diet_notes?: string | null;
  profile_photo_url?: string | null;
  status: PetStatus;
  is_public?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

// ===================================
// FAMILY TYPES
// ===================================

export type FamilyRole = 'owner' | 'admin' | 'member' | 'viewer';

export type FamilyPermission =
  | 'view_pets'
  | 'edit_pets'
  | 'add_pets'
  | 'delete_pets'
  | 'view_health_records'
  | 'edit_health_records'
  | 'manage_family'
  | 'view_location';

export interface FamilyMembership extends BaseEntity {
  familyId: string;
  userId: string;
  role: FamilyRole;
  isActive: boolean;
  permissions: FamilyPermission[];
}

export interface FamilyInvite {
  id: string;
  familyId: string;
  email: string;
  role: FamilyRole;
  expiresAt: string;
  createdAt: string;
}

// ===================================
// SUBSCRIPTION TYPES
// ===================================

export type SubscriptionTier = 'free' | 'premium' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface SubscriptionLimits {
  maxPets: number;
  maxFamilyMembers: number;
  maxPhotosPerPet: number;
  canCreateLostPets: boolean;
  hasAdvancedFeatures: boolean;
}

export interface SubscriptionPricing {
  monthlyPrice: number;
  annualPrice: number;
  currency: 'EUR';
}

export interface SubscriptionTierConfig {
  tier: SubscriptionTier;
  name: string;
  pricing?: SubscriptionPricing;
  limits: SubscriptionLimits;
  features: string[];
}

export interface UserSubscription extends BaseEntity {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  autoRenew: boolean;
  paymentMethodId?: string;
  provider?: 'stripe' | 'apple' | 'google';
  providerSubscriptionId?: string;
}

// Subscription tier configurations
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  free: {
    tier: 'free',
    name: 'Free',
    limits: {
      maxPets: 1,
      maxFamilyMembers: 2,
      maxPhotosPerPet: 1,
      canCreateLostPets: false,
      hasAdvancedFeatures: false,
    },
    features: [
      '1 pet profile',
      '2 family members',
      'Basic health tracking',
      'Receive lost pet alerts',
    ],
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    pricing: { monthlyPrice: 5.99, annualPrice: 50, currency: 'EUR' },
    limits: {
      maxPets: 2,
      maxFamilyMembers: 3,
      maxPhotosPerPet: 6,
      canCreateLostPets: false,
      hasAdvancedFeatures: true,
    },
    features: [
      '2 pet profiles',
      '3 family members',
      '6 photos per pet',
      'Export capabilities',
      'Advanced reminders',
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    pricing: { monthlyPrice: 8.99, annualPrice: 80, currency: 'EUR' },
    limits: {
      maxPets: 999,
      maxFamilyMembers: 999,
      maxPhotosPerPet: 12,
      canCreateLostPets: true,
      hasAdvancedFeatures: true,
    },
    features: [
      'Unlimited pets',
      'Unlimited family members',
      '12 photos per pet',
      'Create lost pet alerts',
      'All premium features',
    ],
  },
};

// ===================================
// LOST PET TYPES
// ===================================

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: string;
}

export interface LostPetReport extends BaseEntity {
  petId: string;
  userId: string;
  lastSeenLocation: GeoCoordinates;
  lastSeenDate: string;
  description: string;
  contactPhone?: string;
  contactEmail?: string;
  reward?: number;
  status: 'active' | 'found' | 'closed';
  foundDate?: string;
}

export interface PetSighting extends BaseEntity {
  lostPetId: string;
  reporterId: string;
  location: GeoCoordinates;
  sightingDate: string;
  description: string;
  photoUrl?: string;
  confidence: 'low' | 'medium' | 'high';
  verified: boolean;
}

// ===================================
// NOTIFICATION TYPES
// ===================================

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'reminder'
  | 'alert'
  | 'social';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

// ===================================
// API RESPONSE TYPES
// ===================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ===================================
// ERROR TYPES
// ===================================

export type ErrorCategory =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'business_logic'
  | 'system'
  | 'unknown';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  stack?: string;
  timestamp: string;
  userId?: string;
  requestId?: string;
}

// ===================================
// UTILITY TYPES
// ===================================

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

export interface AsyncOperationState<T = unknown> extends LoadingState {
  data?: T;
  error?: string;
  isSuccess: boolean;
  lastAttempt?: string;
  retryCount: number;
}

export interface FileUpload {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uri: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  uploadedAt?: string;
}

// ===================================
// FORM TYPES
// ===================================

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  touchedFields: Set<string>;
  isValidating: boolean;
}

export interface FormSubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error?: string;
  successMessage?: string;
}

// ===================================
// PLATFORM ABSTRACTION
// ===================================

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl?: string;
  debugMode: boolean;
  features: Record<string, boolean>;
}

// ===================================
// SERVICE TYPES
// ===================================

/**
 * Generic API result for service operations
 */
export interface ApiResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Pet data input for create/update operations
 */
export interface PetData {
  name: string;
  species: string;
  breed?: string;
  color?: string;
  colorMarkings?: string;
  gender?: string;
  dateOfBirth?: string;
  weightKg?: number;
  height?: string;
  microchipNumber?: string;
  identificationNumber?: string;
  personalityTraits?: string[];
  favoriteActivities?: string[];
  exerciseNeeds?: ExerciseLevel;
  favoriteFood?: string;
  feedingSchedule?: string;
  specialDietNotes?: string;
  behavioralNotes?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceContactPhone?: string;
  insuranceCoverageDetails?: string;
  breedingStatus?: string;
  breedingNotes?: string;
  sireName?: string;
  damName?: string;
  registrationNumber?: string;
  registrationOrganization?: string;
  specialNeeds?: string;
  allergies?: string[];
  medicalConditions?: string[];
  currentMedications?: string[];
  dietaryNotes?: string;
  specialNotes?: string;
  lastCheckup?: string;
  profilePhotoUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
}

// ===================================
// ADMIN TYPES
// ===================================

export type AdminRole = 'user' | 'admin' | 'super_admin';

export type AdPlacement = 'dashboard' | 'pets_page' | 'settings' | 'sidebar' | 'modal' | 'banner';
export type AdTargetAudience = 'all' | 'free_users' | 'premium_users' | 'pro_users' | 'new_users';
export type DiscountType = 'percentage' | 'fixed_amount';
export type AdminAuditTargetType = 'user' | 'pet' | 'subscription' | 'ad' | 'promo_code' | 'settings' | 'system';

export interface AdminUser extends BaseEntity {
  email: string;
  authUserId?: string; // Maps to auth.users.id for current user comparison
  fullName?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: AdminRole;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionTier: SubscriptionTier;
  petsCount?: number;
  petCount?: number; // Alias for petsCount
  lastSeenAt?: string;
  isVerified?: boolean;
  isActive: boolean;
  avatarUrl?: string;
  phone?: string;
  city?: string;
}

export interface Ad extends BaseEntity {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  placement: AdPlacement;
  startDate?: string;
  endDate?: string;
  targetAudience: AdTargetAudience;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdBy?: string;
}

export interface PromoCode extends BaseEntity {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expirationDate?: string;
  usageLimit?: number;
  timesUsed: number;
  minPurchaseAmount?: number;
  applicablePlans?: string[];
  isActive: boolean;
  createdBy?: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: AdminAuditTargetType;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper type for accessing settings by key
export interface PlatformSettings {
  maintenanceMode: boolean;
  maxPetsFree: number;
  maxPetsPremium: number;
  maxFamilyFree: number;
  maxFamilyPremium: number;
  maxPhotosFree: number;
  maxPhotosPremium: number;
  maxPhotosPro: number;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  [key: string]: unknown;
}

export interface AdminStats {
  totalUsers: number;
  totalPets: number;
  activeSubscriptions: number;
  freeUsers: number;
  premiumUsers: number;
  proUsers: number;
  newUsersThisWeek: number;
  newPetsThisWeek: number;
  monthlyRevenue: number;
  totalVaccinations: number;
  totalMedicalRecords: number;
  lostPetsCount: number;
  overdueVaccinations: number;
}

export interface AdminActivity {
  id: string;
  type: 'user_signup' | 'pet_created' | 'subscription_change' | 'pet_lost' | 'pet_found';
  description: string;
  userId?: string;
  userName?: string;
  petId?: string;
  petName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminPetListItem {
  id: string;
  name: string;
  species: string;
  breed?: string;
  status: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  profilePhotoUrl?: string;
  photoUrl?: string; // Alias for profilePhotoUrl
  photosCount?: number;
  microchipNumber?: string;
  isFlagged?: boolean;
  createdAt: string;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  planName: string;
  tier: SubscriptionTier;
  status: string;
  startedAt?: string;
  endsAt?: string;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  amount?: number;
  currency?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
}

// ===================================
// ENHANCED LOST PET ALERT TYPES
// ===================================

export type AlertUrgency = 'low' | 'medium' | 'high' | 'critical';
export type LostPetAlertStatus = 'active' | 'found' | 'canceled';

/**
 * User's current location for lost pet proximity alerts
 */
export interface UserLocation extends BaseEntity {
  userId: string;
  location: GeoCoordinates;
  accuracyMeters?: number;
  isActive: boolean;
  lastUpdated: string;
}

/**
 * Push notification token for multi-platform delivery
 */
export interface PushToken extends BaseEntity {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  isActive: boolean;
  lastUsed?: string;
}

/**
 * Enhanced Lost Pet Alert with full location and notification data
 */
export interface LostPetAlert extends BaseEntity {
  petId: string;
  userId: string;
  status: LostPetAlertStatus;
  lastSeenDate: string;
  lastSeenLocation: GeoCoordinates;
  lastSeenAddress?: string;
  description: string;
  additionalInfo?: string;
  contactPhone?: string;
  contactEmail?: string;
  rewardAmount?: number;
  urgency: AlertUrgency;
  alertRadius: number; // in meters (default 5000)
  photos: string[];
  isResolved: boolean;
  foundDate?: string;
  foundLocation?: GeoCoordinates;
  foundDescription?: string;
}

/**
 * Form data for creating a new lost pet alert
 */
export interface LostPetAlertFormData {
  petId: string;
  lastSeenDate: Date;
  lastSeenLocation: GeoCoordinates;
  lastSeenAddress?: string;
  description: string;
  additionalInfo?: string;
  contactPhone?: string;
  contactEmail?: string;
  rewardAmount?: number;
  urgency?: AlertUrgency;
  alertRadius?: number;
  photos?: File[];
}

/**
 * Tracking which users received lost pet notifications
 */
export interface LostPetNotification extends BaseEntity {
  lostPetReportId: string;
  userId: string;
  notificationId?: string;
  distanceMeters: number;
  sentAt: string;
  openedAt?: string;
}

/**
 * Result from finding nearby users for alerts
 */
export interface NearbyUserForAlert {
  userId: string;
  pushTokens: string[];
  distanceMeters: number;
  platforms: ('ios' | 'android' | 'web')[];
}

/**
 * Pet sighting report from community member
 */
export interface PetSightingReport {
  lostPetReportId: string;
  sightingDate: Date;
  location: GeoCoordinates;
  address?: string;
  description: string;
  photos?: File[];
  confidenceLevel?: 1 | 2 | 3 | 4 | 5;
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

/**
 * Summary statistics for lost pet dashboard
 */
export interface LostPetStats {
  totalActive: number;
  foundThisMonth: number;
  averageResolutionDays: number;
  nearbyAlerts: number;
}
