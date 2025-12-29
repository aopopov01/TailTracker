/**
 * Date Utilities
 * Platform-agnostic date formatting and manipulation functions
 */

import {
  format,
  parseISO,
  isValid,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';

/**
 * Format a date to a human-readable string
 */
export const formatDate = (
  date: Date | string,
  formatString: string = 'MMM dd, yyyy'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    return format(dateObj, formatString);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format a date for display in cards and lists
 */
export const formatDisplayDate = (date: Date | string): string => {
  return formatDate(date, 'MMM dd, yyyy');
};

/**
 * Format a date with time
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: Date | string): string => {
  try {
    const dateObj = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    if (!isValid(dateObj)) {
      return 'Unknown';
    }

    const now = new Date();
    const years = differenceInYears(now, dateObj);

    if (years >= 1) {
      return `${years} year${years > 1 ? 's' : ''}`;
    }

    const months = differenceInMonths(now, dateObj);
    if (months >= 1) {
      return `${months} month${months > 1 ? 's' : ''}`;
    }

    const days = differenceInDays(now, dateObj);
    return `${days} day${days > 1 ? 's' : ''}`;
  } catch {
    return 'Unknown';
  }
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    return dateObj < new Date();
  } catch {
    return false;
  }
};

/**
 * Check if a date is within the next N days
 */
export const isWithinDays = (date: Date | string, days: number): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }

    const daysDiff = differenceInDays(dateObj, new Date());
    return daysDiff >= 0 && daysDiff <= days;
  } catch {
    return false;
  }
};

/**
 * Get the number of days until a date
 */
export const getDaysUntilDate = (date: Date | string): number => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 0;
    }
    return differenceInDays(dateObj, new Date());
  } catch {
    return 0;
  }
};

/**
 * Format relative time (e.g., "2 days ago", "in 3 weeks")
 */
export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }

    const now = new Date();
    const daysDiff = differenceInDays(now, dateObj);

    if (daysDiff === 0) {
      return 'Today';
    } else if (daysDiff === 1) {
      return 'Yesterday';
    } else if (daysDiff === -1) {
      return 'Tomorrow';
    } else if (daysDiff > 0) {
      if (daysDiff < 7) {
        return `${daysDiff} days ago`;
      } else if (daysDiff < 30) {
        const weeks = Math.floor(daysDiff / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else if (daysDiff < 365) {
        const months = differenceInMonths(now, dateObj);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      } else {
        const years = differenceInYears(now, dateObj);
        return `${years} year${years > 1 ? 's' : ''} ago`;
      }
    } else {
      const absDays = Math.abs(daysDiff);
      if (absDays < 7) {
        return `in ${absDays} days`;
      } else if (absDays < 30) {
        const weeks = Math.floor(absDays / 7);
        return `in ${weeks} week${weeks > 1 ? 's' : ''}`;
      } else if (absDays < 365) {
        const months = differenceInMonths(dateObj, now);
        return `in ${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = differenceInYears(dateObj, now);
        return `in ${years} year${years > 1 ? 's' : ''}`;
      }
    }
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date for API (ISO string, date only)
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse ISO date string to Date object
 */
export const parseDateString = (dateString: string): Date | null => {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};
