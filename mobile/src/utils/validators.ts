/**
 * Form Validation Utilities
 * 
 * Centralized validation functions with consistent error messages
 * Follows clean code principles with clear, testable functions
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} cannot be empty`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): ValidationResult {
  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }
  
  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${maxLength} characters`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }
  
  return { isValid: true };
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  
  if (!phoneRegex.test(cleanedPhone)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number'
    };
  }
  
  return { isValid: true };
}

/**
 * Validate numeric value within range
 */
export function validateNumericRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  if (isNaN(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`
    };
  }
  
  if (value < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min}`
    };
  }
  
  if (value > max) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${max}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate date
 */
export function validateDate(
  dateString: string,
  maxDate?: Date,
  minDate?: Date
): ValidationResult {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid date'
    };
  }
  
  if (maxDate && date > maxDate) {
    return {
      isValid: false,
      error: `Date cannot be later than ${maxDate.toLocaleDateString()}`
    };
  }
  
  if (minDate && date < minDate) {
    return {
      isValid: false,
      error: `Date cannot be earlier than ${minDate.toLocaleDateString()}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate pet name
 */
export function validatePetName(name: string): ValidationResult {
  const requiredResult = validateRequired(name.trim(), 'Pet name');
  if (!requiredResult.isValid) {
    return requiredResult;
  }
  
  return validateStringLength(name.trim(), 1, 50, 'Pet name');
}

/**
 * Validate weight
 */
export function validateWeight(weight: string): ValidationResult {
  if (!weight.trim()) {
    return { isValid: true }; // Optional field
  }
  
  const numericWeight = parseFloat(weight);
  return validateNumericRange(numericWeight, 0.1, 500, 'Weight');
}

/**
 * Validate height
 */
export function validateHeight(height: string): ValidationResult {
  if (!height.trim()) {
    return { isValid: true }; // Optional field
  }
  
  const numericHeight = parseFloat(height);
  return validateNumericRange(numericHeight, 1, 300, 'Height');
}

/**
 * Validate microchip ID format
 */
export function validateMicrochipId(microchipId: string): ValidationResult {
  if (!microchipId.trim()) {
    return { isValid: true }; // Optional field
  }
  
  // Microchip IDs are typically 15 digits, but allow some flexibility
  const microchipRegex = /^[0-9A-Fa-f]{10,20}$/;
  
  if (!microchipRegex.test(microchipId)) {
    return {
      isValid: false,
      error: 'Microchip ID should contain 10-20 alphanumeric characters'
    };
  }
  
  return { isValid: true };
}