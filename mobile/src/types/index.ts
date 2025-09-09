/**
 * TailTracker - Centralized Type Definitions
 * 
 * This file serves as the central hub for all TypeScript type definitions
 * used throughout the TailTracker mobile application.
 * 
 * ARCHITECTURAL STANDARDS:
 * - All interfaces use PascalCase naming
 * - All type unions use camelCase with descriptive names
 * - Consistent date handling (string for API, Date for local)
 * - Consistent ID types (string for all entities)
 * - Comprehensive JSDoc documentation for complex types
 */

// ===================================
// CORE ENTITY TYPES
// ===================================

/**
 * Base interface for all entities with audit fields
 * Provides consistent timestamp and ID patterns
 */
export interface BaseEntity {
  /** Unique identifier for the entity */
  id: string;
  /** ISO 8601 timestamp of entity creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Extended base for entities with ownership
 */
export interface OwnedEntity extends BaseEntity {
  /** ID of the user who owns this entity */
  ownerId: string;
}

// ===================================
// USER & AUTHENTICATION TYPES
// ===================================

/**
 * Authentication result types for service layer
 */
export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
  requiresTwoFactor?: boolean;
}

export interface RegistrationResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  requiresEmailVerification?: boolean;
}

/**
 * Core user entity with consistent field types
 */
export interface User extends BaseEntity {
  /** User's email address - unique identifier */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Optional profile picture URL */
  profilePictureUrl?: string;
  /** ISO 8601 timestamp of last login */
  lastLoginAt?: string;
  /** User's preferred timezone */
  timezone?: string;
  /** User's locale/language preference */
  locale?: string;
}

/**
 * User credentials for authentication
 */
export interface UserCredentials {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Extended credentials for user registration
 */
export interface UserRegistration extends UserCredentials {
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Password confirmation */
  confirmPassword: string;
  /** Optional invitation code */
  invitationCode?: string;
}

/**
 * Active user session information
 */
export interface AuthSession {
  /** Authenticated user details */
  user: User;
  /** JWT access token */
  token: string;
  /** Optional refresh token */
  refreshToken?: string;
  /** Unix timestamp when token expires */
  expiresAt: number;
  /** Session creation timestamp */
  createdAt: number;
}

/**
 * Authentication operation result
 */
export interface AuthResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** User data if successful */
  user?: User;
  /** Session token if successful */
  token?: string;
  /** Error message if failed */
  error?: string;
  /** Detailed error code for handling */
  errorCode?: string;
}

// ===================================
// PET TYPES
// ===================================

/**
 * Supported pet species with extensible 'other' option
 */
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other';

/**
 * Pet gender options
 */
export type PetGender = 'male' | 'female' | 'unknown';

/**
 * Pet status for lost pet functionality
 */
export type PetStatus = 'active' | 'lost' | 'found' | 'inactive' | 'deceased';

/**
 * Pet photo entity for profile images and gallery
 */
export interface PetPhoto extends BaseEntity {
  /** ID of the pet this photo belongs to */
  petId: string;
  /** URL of the stored image */
  url: string;
  /** Caption or description */
  caption?: string;
  /** Whether this is the primary profile photo */
  isPrimary: boolean;
  /** File size in bytes */
  fileSize?: number;
  /** Image dimensions */
  width?: number;
  height?: number;
}

/**
 * Family membership relationship
 */
export interface FamilyMembership extends BaseEntity {
  /** ID of the family unit */
  familyId: string;
  /** ID of the user who is a member */
  userId: string;
  /** Role within the family */
  role: FamilyRole;
  /** Whether membership is active */
  isActive: boolean;
  /** Permissions granted to this member */
  permissions: FamilyPermission[];
}

/**
 * Family roles with different permission levels
 */
export type FamilyRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Family permissions for accessing pet data
 */
export type FamilyPermission = 
  | 'view_pets'
  | 'edit_pets' 
  | 'add_pets'
  | 'delete_pets'
  | 'view_health_records'
  | 'edit_health_records'
  | 'manage_family'
  | 'view_location';

/**
 * Physical measurement with unit flexibility
 */
export interface PhysicalMeasurement {
  /** Numeric value of the measurement */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** When the measurement was taken */
  measuredAt?: string;
}

/**
 * Medical condition or medication record
 */
export interface MedicalRecord {
  /** Unique identifier */
  id: string;
  /** Name of condition or medication */
  name: string;
  /** Dosage information (for medications) */
  dosage?: string;
  /** Frequency of administration */
  frequency?: string;
  /** Start date */
  startDate?: string;
  /** End date (if applicable) */
  endDate?: string;
  /** Additional notes */
  notes?: string;
}

/**
 * Vaccination record
 */
export interface VaccinationRecord {
  /** Unique identifier */
  id: string;
  /** Name of the vaccine */
  vaccine: string;
  /** Date administered */
  administeredDate: string;
  /** Date next dose is due */
  nextDueDate?: string;
  /** Veterinarian who administered */
  veterinarian?: string;
  /** Batch number or lot information */
  batchNumber?: string;
}

/**
 * Comprehensive pet profile
 */
export interface Pet extends OwnedEntity {
  // Basic Information
  /** Pet's name */
  name: string;
  /** Pet species */
  species: PetSpecies;
  /** Array of photo URLs */
  photos: string[];
  
  // Physical Details
  /** Pet breed (optional) */
  breed?: string;
  /** Date of birth */
  dateOfBirth?: string;
  /** Calculated or estimated age in years */
  age?: number;
  /** Pet's gender */
  gender?: PetGender;
  /** Primary color description */
  color?: string;
  /** Distinctive markings */
  markings?: string;
  /** Weight measurement */
  weight?: PhysicalMeasurement;
  /** Height measurement */
  height?: PhysicalMeasurement;
  
  // Official Records
  /** Registration number or microchip ID */
  registrationNumber?: string;
  /** Microchip number */
  microchipNumber?: string;
  
  // Health Profile
  /** Current medical conditions */
  medicalConditions?: MedicalRecord[];
  /** Current medications */
  currentMedications?: MedicalRecord[];
  /** Known allergies */
  allergies?: string[];
  /** Date of last veterinary visit */
  lastVetVisit?: string;
  /** Vaccination records */
  vaccinations?: VaccinationRecord[];
  
  // Personality & Care
  /** Personality trait tags */
  personalityTraits?: string[];
  /** Favorite foods and dietary preferences */
  foodPreferences?: {
    favorites?: string[];
    schedule?: string;
    specialDiet?: string[];
  };
  /** Favorite activities */
  favoriteActivities?: string[];
  /** Exercise requirements level */
  exerciseNeeds?: 'low' | 'moderate' | 'high';
  /** Special care notes */
  specialNotes?: string;
  
  // Status and Meta
  /** Current pet status */
  status: PetStatus;
  /** Reference to lost pet report if applicable */
  lostPetId?: string;
  /** Profile completion percentage (0-100) */
  profileCompleteness: number;
}

/**
 * Pet onboarding progress state
 */
export interface PetOnboardingState {
  /** Current step index */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Partial pet data being collected */
  petData: Partial<Pet>;
  /** Array of completed step indices */
  completedSteps: number[];
  /** Fields that were intentionally skipped */
  skippedFields: string[];
  /** Onboarding session ID */
  sessionId: string;
}

// ===================================
// FORM AND VALIDATION TYPES
// ===================================

/**
 * Form validation state
 */
export interface FormValidation {
  /** Whether the form is valid */
  isValid: boolean;
  /** Field-specific error messages */
  errors: Record<string, string>;
  /** Fields that have been touched by user */
  touchedFields: Set<string>;
  /** Whether validation is currently running */
  isValidating: boolean;
}

/**
 * Form submission state
 */
export interface FormSubmissionState {
  /** Whether form is being submitted */
  isSubmitting: boolean;
  /** Whether submission was successful */
  isSuccess: boolean;
  /** Error message if submission failed */
  error?: string;
  /** Success message if submission succeeded */
  successMessage?: string;
}

// ===================================
// API RESPONSE TYPES
// ===================================

/**
 * Standardized API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data if successful */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Request timestamp */
  timestamp: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of items */
    totalItems: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there are more pages */
    hasNextPage: boolean;
    /** Whether there are previous pages */
    hasPreviousPage: boolean;
  };
}

// ===================================
// ERROR HANDLING TYPES
// ===================================

/**
 * Application error categories
 */
export type ErrorCategory = 
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'business_logic'
  | 'system'
  | 'unknown';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Comprehensive error information
 */
export interface AppError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Error category */
  category: ErrorCategory;
  /** Error severity */
  severity: ErrorSeverity;
  /** Additional context data */
  context?: Record<string, any>;
  /** Stack trace for debugging */
  stack?: string;
  /** When the error occurred */
  timestamp: string;
  /** User ID if available */
  userId?: string;
  /** Request ID for tracing */
  requestId?: string;
}


// ===================================
// NOTIFICATION TYPES
// ===================================

/**
 * Notification types supported by the app
 */
export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'reminder'
  | 'alert'
  | 'social';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification delivery channels
 */
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

/**
 * Notification configuration
 */
export interface NotificationConfig {
  /** Whether notifications are enabled */
  enabled: boolean;
  /** Enabled delivery channels */
  channels: NotificationChannel[];
  /** Quiet hours configuration */
  quietHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  /** Category-specific settings */
  categories: Record<NotificationType, {
    enabled: boolean;
    priority: NotificationPriority;
    channels: NotificationChannel[];
  }>;
}

// ===================================
// UTILITY TYPES
// ===================================

/**
 * Generic loading state
 */
export interface LoadingState {
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Loading message or identifier */
  loadingMessage?: string;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Generic async operation state
 */
export interface AsyncOperationState<T = any> extends LoadingState {
  /** Operation result data */
  data?: T;
  /** Error if operation failed */
  error?: string;
  /** Whether operation completed successfully */
  isSuccess: boolean;
  /** When the operation was last attempted */
  lastAttempt?: string;
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * File upload information
 */
export interface FileUpload {
  /** Unique identifier for the upload */
  id: string;
  /** Original filename */
  filename: string;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Upload URL or local URI */
  uri: string;
  /** Upload progress (0-100) */
  progress: number;
  /** Upload status */
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  /** Error message if upload failed */
  error?: string;
  /** Upload timestamp */
  uploadedAt?: string;
}

/**
 * Geolocation coordinates
 */
export interface GeoCoordinates {
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Accuracy in meters */
  accuracy?: number;
  /** Altitude in meters */
  altitude?: number;
  /** When the coordinates were obtained */
  timestamp?: string;
}

// ===================================
// SUBSCRIPTION TYPES
// ===================================

/**
 * Subscription tier levels with specific limits
 */
export type SubscriptionTier = 'free' | 'premium' | 'pro';

/**
 * Subscription pricing information
 */
export interface SubscriptionPricing {
  /** Monthly price in euros */
  monthlyPrice: number;
  /** Annual price in euros */
  annualPrice: number;
  /** Currency code */
  currency: 'EUR';
}

/**
 * Subscription tier limits and features
 */
export interface SubscriptionLimits {
  /** Maximum number of pets allowed */
  maxPets: number;
  /** Maximum number of family members allowed */
  maxFamilyMembers: number;
  /** Whether lost pet creation is allowed */
  canCreateLostPets: boolean;
  /** Maximum photos per pet */
  maxPhotosPerPet: number;
  /** Whether advanced features are available */
  hasAdvancedFeatures: boolean;
}

/**
 * Complete subscription tier configuration
 */
export interface SubscriptionTierConfig {
  /** Tier identifier */
  tier: SubscriptionTier;
  /** Display name */
  name: string;
  /** Pricing information (undefined for free tier) */
  pricing?: SubscriptionPricing;
  /** Feature limits */
  limits: SubscriptionLimits;
  /** Feature descriptions */
  features: string[];
}

/**
 * User's current subscription information
 */
export interface UserSubscription extends BaseEntity {
  /** User this subscription belongs to */
  userId: string;
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Subscription status */
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  /** Current billing period start */
  currentPeriodStart?: string;
  /** Current billing period end */
  currentPeriodEnd?: string;
  /** Whether subscription auto-renews */
  autoRenew: boolean;
  /** Payment method identifier */
  paymentMethodId?: string;
  /** Subscription provider (Stripe, Apple, Google) */
  provider?: 'stripe' | 'apple' | 'google';
  /** Provider-specific subscription ID */
  providerSubscriptionId?: string;
}

// ===================================
// CONFIGURATION TYPES
// ===================================

/**
 * Application configuration
 */
export interface AppConfig {
  /** Application environment */
  environment: 'development' | 'staging' | 'production';
  /** API base URL */
  apiBaseUrl: string;
  /** Enable debug logging */
  debugMode: boolean;
  /** Feature flags */
  features: Record<string, boolean>;
  /** Third-party service configurations */
  services: {
    analytics?: boolean;
    crashReporting?: boolean;
    performance?: boolean;
  };
  /** App version information */
  version: {
    app: string;
    build: string;
    platform: string;
  };
}

// Re-export types from other files for convenience
export * from './Pet';
export * from './User';
// Wellness types removed for simplified feature set