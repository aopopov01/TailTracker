/**
 * Pet Form Constants
 * 
 * Centralized constants for pet form configuration
 * Replaces magic strings and numbers throughout the application
 */

/**
 * Species options for pet registration
 */
export const SPECIES_OPTIONS = [
  { label: 'Dog', value: 'dog' },
  { label: 'Cat', value: 'cat' },
  { label: 'Bird', value: 'bird' },
  { label: 'Other', value: 'other' },
] as const;

/**
 * Gender options for pet registration
 */
export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
] as const;

/**
 * Form validation messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  PET_NAME_REQUIRED: 'Pet name is required',
  INVALID_WEIGHT: 'Weight must be a valid number',
  INVALID_HEIGHT: 'Height must be a valid number',
  INVALID_DATE: 'Please select a valid date',
} as const;/**
 * Success messages for form operations
 */
export const SUCCESS_MESSAGES = {
  PET_CREATED: 'Pet profile created successfully!',
  PET_UPDATED: 'Pet profile updated successfully!',
  PHOTO_UPLOADED: 'Photo uploaded successfully!',
} as const;

/**
 * Error messages for form operations
 */
export const ERROR_MESSAGES = {
  SAVE_FAILED: 'Failed to save pet profile. Please check your connection and try again.',
  LOAD_FAILED: 'Failed to load pet information.',
  PHOTO_SELECT_FAILED: 'Failed to select image.',
  PERMISSION_DENIED: 'Please grant photo library access to add pet photos.',
  USER_NOT_AUTHENTICATED: 'You must be logged in to perform this action.',
} as const;

/**
 * Form field limits and constraints
 */
export const FIELD_LIMITS = {
  NAME_MAX_LENGTH: 50,
  BREED_MAX_LENGTH: 50,
  WEIGHT_MAX_VALUE: 500, // kg
  HEIGHT_MAX_VALUE: 200, // cm
  TEXT_AREA_MAX_LENGTH: 500,
  MICROCHIP_MAX_LENGTH: 20,
} as const;

/**
 * Image processing constants
 */
export const IMAGE_CONFIG = {
  MAX_WIDTH: 1024,
  COMPRESS_QUALITY: 0.8,
  ASPECT_RATIO: [1, 1] as const,
} as const;