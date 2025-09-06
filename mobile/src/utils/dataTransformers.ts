/**
 * Data Transformation Utilities
 * 
 * Centralized functions for common data transformations
 * Applies single responsibility principle and reduces duplication
 */

import { log } from './Logger';

/**
 * Transform comma-separated string to array
 */
export function stringToArray(value: string | undefined): string[] {
  if (!value || typeof value !== 'string') {
    return [];
  }
  
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/**
 * Transform array to comma-separated string
 */
export function arrayToString(value: string[] | undefined): string {
  if (!Array.isArray(value)) {
    return '';
  }
  
  return value
    .filter(Boolean)
    .map(item => item.trim())
    .join(', ');
}

/**
 * Safely parse number from string
 */
export function parseNumberSafely(
  value: string | number | undefined
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format date for display
 */
export function formatDateForDisplay(dateString?: string): string {
  if (!dateString) {
    return '';
  }
  
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    log.warn('Invalid date string:', dateString);
    return '';
  }
}

/**
 * Format date for API (ISO string, date only)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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