/**
 * Preferences Context
 * Global user preferences management with format helper functions
 * Persists to database and provides formatDate, formatWeight, formatTemperature helpers
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { format, parse } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

// Types
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type WeightUnit = 'kg' | 'lbs';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface UserPreferences {
  dateFormat: DateFormat;
  weightUnit: WeightUnit;
  temperatureUnit: TemperatureUnit;
}

interface PreferencesContextType extends UserPreferences {
  isLoading: boolean;
  isSaving: boolean;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<boolean>;
  formatDate: (date: string | Date | null | undefined) => string;
  formatWeight: (weightKg: number | null | undefined) => string;
  formatTemperature: (tempCelsius: number | null | undefined) => string;
  parseWeight: (displayWeight: number) => number; // Convert display weight to kg for storage
}

const DEFAULT_PREFERENCES: UserPreferences = {
  dateFormat: 'DD/MM/YYYY',
  weightUnit: 'kg',
  temperatureUnit: 'celsius',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

const PREFERENCES_STORAGE_KEY = 'tailtracker_preferences';

// Convert date format string to date-fns format
function getDateFnsFormat(dateFormat: DateFormat): string {
  switch (dateFormat) {
    case 'MM/DD/YYYY':
      return 'MM/dd/yyyy';
    case 'DD/MM/YYYY':
      return 'dd/MM/yyyy';
    case 'YYYY-MM-DD':
      return 'yyyy-MM-dd';
    default:
      return 'dd/MM/yyyy';
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Load preferences from localStorage first, then from database
  useEffect(() => {
    const loadPreferences = async () => {
      // First, try localStorage for immediate display
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch {
          // Invalid JSON, ignore
        }
      }

      // If user is logged in, fetch from database
      if (user?.id && supabase) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('date_format, weight_unit, temperature_unit')
            .eq('auth_user_id', user.id)
            .single();

          if (!error && data) {
            const dbPrefs: UserPreferences = {
              dateFormat: (data.date_format as DateFormat) || 'DD/MM/YYYY',
              weightUnit: (data.weight_unit as WeightUnit) || 'kg',
              temperatureUnit:
                (data.temperature_unit as TemperatureUnit) || 'celsius',
            };
            setPreferences(dbPrefs);
            // Sync to localStorage
            localStorage.setItem(
              PREFERENCES_STORAGE_KEY,
              JSON.stringify(dbPrefs)
            );
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }

      setIsLoading(false);
    };

    loadPreferences();
  }, [user?.id]);

  // Update preferences in database and localStorage
  const updatePreferences = useCallback(
    async (newPrefs: Partial<UserPreferences>): Promise<boolean> => {
      const updated = { ...preferences, ...newPrefs };
      setIsSaving(true);

      try {
        // Update localStorage immediately
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
        setPreferences(updated);

        // If user is logged in, save to database
        if (user?.id && supabase) {
          const { error } = await supabase
            .from('users')
            .update({
              date_format: updated.dateFormat,
              weight_unit: updated.weightUnit,
              temperature_unit: updated.temperatureUnit,
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', user.id);

          if (error) {
            console.error('Error saving preferences:', error);
            setIsSaving(false);
            return false;
          }
        }

        setIsSaving(false);
        return true;
      } catch (error) {
        console.error('Error updating preferences:', error);
        setIsSaving(false);
        return false;
      }
    },
    [preferences, user?.id]
  );

  // Format date according to user preferences
  const formatDate = useCallback(
    (date: string | Date | null | undefined): string => {
      if (!date) return '-';

      try {
        let dateObj: Date;

        if (typeof date === 'string') {
          // Handle various input formats
          if (date.includes('T')) {
            // ISO format
            dateObj = new Date(date);
          } else if (date.includes('-')) {
            // YYYY-MM-DD format
            dateObj = parse(date, 'yyyy-MM-dd', new Date());
          } else if (date.includes('/')) {
            // Try to parse as either MM/DD/YYYY or DD/MM/YYYY
            // Assume storage format is ISO/YYYY-MM-DD, so this shouldn't happen often
            dateObj = new Date(date);
          } else {
            dateObj = new Date(date);
          }
        } else {
          dateObj = date;
        }

        if (isNaN(dateObj.getTime())) {
          return String(date);
        }

        return format(dateObj, getDateFnsFormat(preferences.dateFormat));
      } catch {
        return String(date);
      }
    },
    [preferences.dateFormat]
  );

  // Format weight according to user preferences
  const formatWeight = useCallback(
    (weightKg: number | null | undefined): string => {
      if (weightKg === null || weightKg === undefined) return '-';

      if (preferences.weightUnit === 'lbs') {
        const lbs = weightKg * 2.20462;
        return `${lbs.toFixed(1)} lbs`;
      }

      return `${weightKg.toFixed(1)} kg`;
    },
    [preferences.weightUnit]
  );

  // Parse display weight back to kg for storage
  const parseWeight = useCallback(
    (displayWeight: number): number => {
      if (preferences.weightUnit === 'lbs') {
        return displayWeight / 2.20462;
      }
      return displayWeight;
    },
    [preferences.weightUnit]
  );

  // Format temperature according to user preferences
  const formatTemperature = useCallback(
    (tempCelsius: number | null | undefined): string => {
      if (tempCelsius === null || tempCelsius === undefined) return '-';

      if (preferences.temperatureUnit === 'fahrenheit') {
        const fahrenheit = (tempCelsius * 9) / 5 + 32;
        return `${fahrenheit.toFixed(1)}°F`;
      }

      return `${tempCelsius.toFixed(1)}°C`;
    },
    [preferences.temperatureUnit]
  );

  return (
    <PreferencesContext.Provider
      value={{
        ...preferences,
        isLoading,
        isSaving,
        updatePreferences,
        formatDate,
        formatWeight,
        formatTemperature,
        parseWeight,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
