/**
 * TailTracker - Centralized Constants and Configuration
 * 
 * This file serves as the single source of truth for all application constants,
 * configuration values, and magic numbers used throughout the TailTracker mobile app.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * - All constants use SCREAMING_SNAKE_CASE
 * - Constants are grouped by functional domain
 * - Environment-specific values are handled separately
 * - All magic numbers and strings are centralized here
 */

// ===================================
// APPLICATION METADATA
// ===================================

export const APP_INFO = {
  NAME: 'TailTracker',
  DESCRIPTION: 'Comprehensive Pet Care Management',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  BUNDLE_ID: 'com.tailtracker.mobile',
  WEBSITE: 'https://tailtracker.com',
  SUPPORT_EMAIL: 'support@tailtracker.com',
  PRIVACY_POLICY_URL: 'https://tailtracker.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://tailtracker.com/terms',
} as const;

// ===================================
// PET FORM CONSTANTS
// ===================================

/**
 * Pet species options for registration forms
 */
export const PET_SPECIES_OPTIONS = [
  { label: 'Dog', value: 'dog', icon: '🐕' },
  { label: 'Cat', value: 'cat', icon: '🐱' },
  { label: 'Bird', value: 'bird', icon: '🦜' },
  { label: 'Rabbit', value: 'rabbit', icon: '🐰' },
  { label: 'Fish', value: 'fish', icon: '🐠' },
  { label: 'Reptile', value: 'reptile', icon: '🦎' },
  { label: 'Other', value: 'other', icon: '🐾' },
] as const;

/**
 * Pet gender options
 */
export const PET_GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Unknown', value: 'unknown' },
] as const;

/**
 * Pet status options
 */
export const PET_STATUS_OPTIONS = [
  { label: 'Active', value: 'active', color: '#4CAF50' },
  { label: 'Lost', value: 'lost', color: '#F44336' },
  { label: 'Found', value: 'found', color: '#2196F3' },
  { label: 'Inactive', value: 'inactive', color: '#9E9E9E' },
] as const;

/**
 * Exercise needs levels
 */
export const EXERCISE_NEEDS_OPTIONS = [
  { label: 'Low', value: 'low', description: 'Minimal exercise required' },
  { label: 'Moderate', value: 'moderate', description: 'Regular daily exercise' },
  { label: 'High', value: 'high', description: 'Intense daily exercise required' },
] as const;

// ===================================
// FORM VALIDATION CONSTANTS
// ===================================

export const VALIDATION_RULES = {
  // Text field limits
  PET_NAME_MIN_LENGTH: 1,
  PET_NAME_MAX_LENGTH: 50,
  BREED_MAX_LENGTH: 50,
  MICROCHIP_MAX_LENGTH: 20,
  NOTES_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 1000,
  
  // Numeric limits
  WEIGHT_MIN_VALUE: 0.1, // kg
  WEIGHT_MAX_VALUE: 500, // kg
  HEIGHT_MIN_VALUE: 1, // cm
  HEIGHT_MAX_VALUE: 300, // cm
  AGE_MIN_VALUE: 0,
  AGE_MAX_VALUE: 50, // years
  
  // Email validation
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  
  // Phone number
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
} as const;

/**
 * User-friendly validation messages
 */
export const VALIDATION_MESSAGES = {
  // Required fields
  REQUIRED_FIELD: 'This field is required',
  PET_NAME_REQUIRED: 'Pet name is required',
  EMAIL_REQUIRED: 'Email address is required',
  PASSWORD_REQUIRED: 'Password is required',
  
  // Format validation
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_DATE: 'Please select a valid date',
  INVALID_WEIGHT: 'Weight must be a valid number',
  INVALID_HEIGHT: 'Height must be a valid number',
  INVALID_AGE: 'Age must be a valid number',
  
  // Length validation
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.PET_NAME_MIN_LENGTH} character`,
  NAME_TOO_LONG: `Name must be no more than ${VALIDATION_RULES.PET_NAME_MAX_LENGTH} characters`,
  NOTES_TOO_LONG: `Notes must be no more than ${VALIDATION_RULES.NOTES_MAX_LENGTH} characters`,
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be no more than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`,
  
  // Value validation
  WEIGHT_OUT_OF_RANGE: `Weight must be between ${VALIDATION_RULES.WEIGHT_MIN_VALUE} and ${VALIDATION_RULES.WEIGHT_MAX_VALUE} kg`,
  HEIGHT_OUT_OF_RANGE: `Height must be between ${VALIDATION_RULES.HEIGHT_MIN_VALUE} and ${VALIDATION_RULES.HEIGHT_MAX_VALUE} cm`,
  AGE_OUT_OF_RANGE: `Age must be between ${VALIDATION_RULES.AGE_MIN_VALUE} and ${VALIDATION_RULES.AGE_MAX_VALUE} years`,
  
  // Password strength
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number, and special character',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
} as const;

// ===================================
// SUCCESS AND ERROR MESSAGES
// ===================================

export const SUCCESS_MESSAGES = {
  // Pet management
  PET_CREATED: 'Pet profile created successfully!',
  PET_UPDATED: 'Pet profile updated successfully!',
  PET_DELETED: 'Pet profile deleted successfully!',
  
  // Media operations
  PHOTO_UPLOADED: 'Photo uploaded successfully!',
  PHOTO_DELETED: 'Photo deleted successfully!',
  
  // Authentication
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSWORD_CHANGED: 'Password changed successfully!',
  
  // Data operations
  DATA_EXPORTED: 'Data exported successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  
  // Family sharing
  INVITATION_SENT: 'Family invitation sent!',
  MEMBER_ADDED: 'Family member added successfully!',
} as const;

export const ERROR_MESSAGES = {
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  USER_NOT_AUTHENTICATED: 'You must be logged in to perform this action',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  
  // Permission errors
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  PHOTO_PERMISSION_DENIED: 'Please grant photo library access to add pet photos',
  CAMERA_PERMISSION_DENIED: 'Please grant camera access to take photos',
  LOCATION_PERMISSION_DENIED: 'Please grant location access for lost pet alerts',
  
  // Data operation errors
  SAVE_FAILED: 'Failed to save. Please check your connection and try again.',
  LOAD_FAILED: 'Failed to load data. Please try again.',
  DELETE_FAILED: 'Failed to delete. Please try again.',
  
  // Media operation errors
  PHOTO_SELECT_FAILED: 'Failed to select image',
  PHOTO_UPLOAD_FAILED: 'Failed to upload photo. Please try again.',
  FILE_TOO_LARGE: 'File size is too large. Please choose a smaller file.',
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  
  // Pet-specific errors
  PET_NOT_FOUND: 'Pet not found',
  DUPLICATE_PET_NAME: 'A pet with this name already exists',
  
  // Family sharing errors
  INVITATION_FAILED: 'Failed to send invitation. Please try again.',
  INVALID_INVITATION: 'Invalid or expired invitation',
} as const;

// ===================================
// UI AND DESIGN CONSTANTS
// ===================================

export const UI_CONSTANTS = {
  // Timing
  ANIMATION_DURATION_SHORT: 150,
  ANIMATION_DURATION_MEDIUM: 300,
  ANIMATION_DURATION_LONG: 500,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  LOADING_TIMEOUT: 30000,
  
  // Dimensions
  BORDER_RADIUS_SMALL: 4,
  BORDER_RADIUS_MEDIUM: 8,
  BORDER_RADIUS_LARGE: 12,
  BORDER_RADIUS_XL: 16,
  
  // Spacing (using 8px grid system)
  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,
  SPACING_2XL: 48,
  
  // Z-index layers
  Z_INDEX_MODAL: 1000,
  Z_INDEX_OVERLAY: 999,
  Z_INDEX_DROPDOWN: 998,
  Z_INDEX_TOOLTIP: 997,
  Z_INDEX_HEADER: 996,
  
  // Screen breakpoints
  SCREEN_SM: 375,
  SCREEN_MD: 768,
  SCREEN_LG: 1024,
  SCREEN_XL: 1200,
} as const;

// ===================================
// IMAGE AND MEDIA CONSTANTS
// ===================================

export const MEDIA_CONFIG = {
  // Image processing
  MAX_IMAGE_WIDTH: 1024,
  MAX_IMAGE_HEIGHT: 1024,
  IMAGE_QUALITY: 0.8,
  THUMBNAIL_SIZE: 150,
  
  // File size limits (in bytes)
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Supported file types
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
  
  // Aspect ratios
  PROFILE_PHOTO_ASPECT_RATIO: 1, // 1:1 square
  GALLERY_PHOTO_ASPECT_RATIO: 4/3, // 4:3 landscape
} as const;

// ===================================
// API AND NETWORK CONSTANTS
// ===================================

export const API_CONFIG = {
  // Timeouts (in milliseconds)
  REQUEST_TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 120000,
  RETRY_DELAY: 1000,
  
  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache durations (in milliseconds)
  CACHE_DURATION_SHORT: 5 * 60 * 1000, // 5 minutes
  CACHE_DURATION_MEDIUM: 30 * 60 * 1000, // 30 minutes
  CACHE_DURATION_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ===================================
// FEATURE FLAGS AND LIMITS
// ===================================

export const FEATURE_LIMITS = {
  // Free tier limits
  MAX_PETS_FREE: 3,
  MAX_PHOTOS_PER_PET_FREE: 5,
  MAX_FAMILY_MEMBERS_FREE: 3,
  
  // Premium tier limits
  MAX_PETS_PREMIUM: 20,
  MAX_PHOTOS_PER_PET_PREMIUM: 50,
  MAX_FAMILY_MEMBERS_PREMIUM: 10,
  
  // General limits
  MAX_ONBOARDING_STEPS: 7,
  MAX_NOTIFICATION_HISTORY: 100,
  MAX_SEARCH_RESULTS: 50,
} as const;

export const FEATURE_FLAGS = {
  // Core features
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_FAMILY_SHARING: true,
  ENABLE_LOST_PET_ALERTS: true,
  
  // Premium features
  ENABLE_PREMIUM_FEATURES: true,
  ENABLE_ADVANCED_ANALYTICS: false,
  ENABLE_VETERINARY_INTEGRATION: false,
  
  // Experimental features
  ENABLE_AI_RECOMMENDATIONS: false,
  ENABLE_VOICE_NOTES: false,
  ENABLE_AUGMENTED_REALITY: false,
  
  // Platform-specific features
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_WIDGETS: true,
  ENABLE_SHORTCUTS: true,
} as const;

// ===================================
// NOTIFICATION CONSTANTS
// ===================================

export const NOTIFICATION_CONFIG = {
  // Types and priorities
  TYPES: {
    REMINDER: 'reminder',
    ALERT: 'alert',
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
  },
  
  PRIORITIES: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  },
  
  // Scheduling
  DEFAULT_ADVANCE_NOTICE: 60, // minutes
  MAX_ADVANCE_NOTICE: 24 * 60, // 24 hours in minutes
  MIN_ADVANCE_NOTICE: 5, // minutes
  
  // Channels
  CHANNELS: {
    PUSH: 'push',
    EMAIL: 'email',
    SMS: 'sms',
    IN_APP: 'in_app',
  },
} as const;

// ===================================
// ANALYTICS AND TRACKING
// ===================================

export const ANALYTICS_CONFIG = {
  // Event categories
  CATEGORIES: {
    USER_BEHAVIOR: 'user_behavior',
    PET_MANAGEMENT: 'pet_management',
    FAMILY_SHARING: 'family_sharing',
    PREMIUM_FEATURES: 'premium_features',
    ERROR_TRACKING: 'error_tracking',
  },
  
  // Event priorities
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
  
  // Batch configuration
  BATCH_SIZE: 50,
  FLUSH_INTERVAL: 30000, // 30 seconds
  MAX_QUEUE_SIZE: 1000,
} as const;

// ===================================
// SECURITY CONSTANTS
// ===================================

export const SECURITY_CONFIG = {
  // Session management
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_TOKEN_THRESHOLD: 15 * 60 * 1000, // 15 minutes
  
  // Encryption
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  KEY_DERIVATION_ITERATIONS: 100000,
  SALT_LENGTH: 32,
  IV_LENGTH: 16,
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Privacy
  DATA_RETENTION_PERIOD: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
  ANONYMIZATION_DELAY: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// ===================================
// DEVELOPMENT AND DEBUG
// ===================================

export const DEBUG_CONFIG = {
  // Logging levels
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    VERBOSE: 'verbose',
  },
  
  // Performance monitoring
  ENABLE_PERFORMANCE_MONITORING: true,
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10% sampling
  
  // Error reporting
  ENABLE_ERROR_REPORTING: true,
  ERROR_SAMPLE_RATE: 1.0, // 100% error reporting
} as const;

// ===================================
// STORAGE KEYS
// ===================================

export const STORAGE_KEYS = {
  // User data
  USER_SESSION: '@TailTracker:userSession',
  USER_PREFERENCES: '@TailTracker:userPreferences',
  
  // App state
  ONBOARDING_COMPLETED: '@TailTracker:onboardingCompleted',
  FIRST_LAUNCH: '@TailTracker:firstLaunch',
  APP_VERSION: '@TailTracker:appVersion',
  
  // Pet data
  SELECTED_PET_ID: '@TailTracker:selectedPetId',
  PET_FORM_DRAFT: '@TailTracker:petFormDraft',
  
  // Notifications
  NOTIFICATION_TOKEN: '@TailTracker:notificationToken',
  NOTIFICATION_SETTINGS: '@TailTracker:notificationSettings',
  
  // Cache
  CACHE_PREFIX: '@TailTracker:cache:',
  OFFLINE_QUEUE: '@TailTracker:offlineQueue',
  
  // Security
  BIOMETRIC_ENABLED: '@TailTracker:biometricEnabled',
  PASSCODE_ENABLED: '@TailTracker:passcodeEnabled',
} as const;

// ===================================
// DEFAULT EXPORTS
// ===================================

// All constants are already exported above as named exports