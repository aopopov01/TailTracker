/**
 * TailTracker Shared Utilities
 * Platform-agnostic utility functions
 */

// Date utilities
export {
  formatDate,
  formatDisplayDate,
  formatDateTime,
  formatDateForAPI,
  formatRelativeTime,
  calculateAge,
  isPastDate,
  isWithinDays,
  getDaysUntilDate,
  parseDateString,
} from './dateUtils';

// Data transformers
export {
  stringToArray,
  arrayToString,
  parseNumberSafely,
  formatDateForDisplay,
  capitalizeWords,
  cleanPetName,
  isValidEmail,
  isValidPhoneNumber,
  generateSafeFilename,
  truncateString,
  deepClone,
  isEmpty,
  removeUndefined,
  generateId,
} from './dataTransformers';

// Pet field mapper
export {
  mapPetToDatabase,
  mapDatabaseToPet,
  mapProfileToDatabase,
  calculateProfileCompleteness,
  validatePetFields,
} from './petFieldMapper';
