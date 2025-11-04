/**
 * useUserProfile Hook
 * Manages user profile data and operations
 */

import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  full_name?: string; // Alias for fullName (snake_case compatibility)
  avatar?: string;
}

interface UseUserProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refetch: () => Promise<void>; // Alias for refreshProfile
}

export const useUserProfile = (): UseUserProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      setError(null);
      // Mock implementation
      if (profile) {
        setProfile({ ...profile, ...updates });
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Mock implementation
      setProfile({
        id: 'test-user',
        email: 'test@example.com',
        fullName: 'Test User',
        full_name: 'Test User', // Sync with fullName
      });
    } catch (err) {
      setError('Failed to refresh profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return {
    profile,
    isLoading,
    loading: isLoading, // Alias for compatibility
    error,
    updateProfile,
    refreshProfile,
    refetch: refreshProfile, // Alias for compatibility
  };
};
