import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  full_name: string;
  phone: string;
  location: string;
  bio: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  preferred_vet_clinic: string;
  preferred_language: string;
  avatar_url?: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // In a real implementation, this would fetch from Supabase or other backend
      // For now, create a basic profile from user data
      const defaultProfile: UserProfile = {
        full_name: `${user.firstName} ${user.lastName}`,
        phone: '',
        location: '',
        bio: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        preferred_vet_clinic: '',
        preferred_language: 'en',
      };
      setProfile(defaultProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refetch = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    refetch,
  };
};