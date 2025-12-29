/**
 * Data Transformation Utilities
 * Platform-agnostic data transformation functions
 */

/**
 * Transform comma-separated string to array
 */
export function stringToArray(value: string | undefined | null): string[] {
  if (!value || typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Transform array to comma-separated string
 */
export function arrayToString(value: string[] | undefined | null): string {
  if (!Array.isArray(value)) {
    return '';
  }

  return value
    .filter(Boolean)
    .map((item) => item.trim())
    .join(', ');
}

/**
 * Safely parse number from string
 */
export function parseNumberSafely(
  value: string | number | undefined | null
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format date for display (basic, use dateUtils for more options)
 */
export function formatDateForDisplay(dateString?: string | null): string {
  if (!dateString) {
    return '';
  }

  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    console.warn('Invalid date string:', dateString);
    return '';
  }
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Clean and validate pet name
 */
export function cleanPetName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .substring(0, 50); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Generate safe filename from text
 */
export function generateSafeFilename(text: string, extension?: string): string {
  const safe = text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return extension ? `${safe}.${extension}` : safe;
}

/**
 * Truncate string with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Remove undefined values from object
 */
export function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Generate a random ID (for client-side use only)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
