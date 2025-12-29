/**
 * Authentication Hook
 * Provides authentication methods and state with robust error handling
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  isClientInitialized,
} from '@tailtracker/shared-services';
import type {
  UserCredentials,
  UserRegistration,
} from '@tailtracker/shared-types';
import { useAuthStore } from '@/stores/authStore';
import { isSupabaseConfigured, supabaseError } from '@/lib/supabase';

// Timeout for auth initialization (3 seconds)
const AUTH_INIT_TIMEOUT = 3000;

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,
    authError,
    setUser,
    setInitialized,
    setLoading,
    setError,
    setAuthError,
    logout,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    // Skip if already initialized
    if (isInitialized) return;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      // If Supabase isn't configured, mark as initialized immediately
      if (!isSupabaseConfigured || !isClientInitialized()) {
        if (mounted) {
          setAuthError(supabaseError || 'Authentication service not available');
          setUser(null);
          setInitialized(true);
        }
        return;
      }

      // Set a timeout to ensure we don't hang forever
      timeoutId = setTimeout(() => {
        if (mounted && !isInitialized) {
          console.warn('Auth initialization timed out, proceeding without session');
          setAuthError('Authentication service connection timed out');
          setUser(null);
          setInitialized(true);
        }
      }, AUTH_INIT_TIMEOUT);

      try {
        // Try to get the current user
        const currentUser = await getCurrentUser();

        if (mounted) {
          clearTimeout(timeoutId);
          setUser(currentUser);
          setAuthError(null);
          setInitialized(true);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          clearTimeout(timeoutId);
          setAuthError(err instanceof Error ? err.message : 'Authentication initialization failed');
          setUser(null);
          setInitialized(true);
        }
      }

      // Subscribe to auth changes (only if Supabase is configured)
      if (isSupabaseConfigured && isClientInitialized()) {
        try {
          unsubscribe = onAuthStateChange((authUser) => {
            if (mounted) {
              setUser(authUser);
            }
          });
        } catch (err) {
          console.error('Auth state subscription error:', err);
          // Continue without subscription if it fails
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInitialized, setUser, setInitialized, setAuthError]);

  const handleSignIn = useCallback(
    async (credentials: UserCredentials) => {
      // Check if auth service is available
      if (!isSupabaseConfigured || !isClientInitialized()) {
        const errorMsg = supabaseError || 'Authentication service not available';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      setLoading(true);
      setError(null);

      try {
        const result = await signIn(credentials);

        if (result.success && result.user) {
          setUser(result.user);
          navigate('/dashboard');
        } else {
          setError(result.error || 'Sign in failed');
        }

        setLoading(false);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [navigate, setUser, setLoading, setError]
  );

  const handleSignUp = useCallback(
    async (registration: UserRegistration) => {
      // Check if auth service is available
      if (!isSupabaseConfigured || !isClientInitialized()) {
        const errorMsg = supabaseError || 'Authentication service not available';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      setLoading(true);
      setError(null);

      try {
        const result = await signUp(registration);

        if (result.success) {
          if (result.requiresEmailVerification) {
            navigate('/auth/verify-email');
          } else if (result.user) {
            setUser(result.user);
            navigate('/dashboard');
          }
        } else {
          setError(result.error || 'Registration failed');
        }

        setLoading(false);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [navigate, setUser, setLoading, setError]
  );

  const handleSignOut = useCallback(async () => {
    setLoading(true);

    try {
      // Try to sign out from Supabase if available
      if (isSupabaseConfigured && isClientInitialized()) {
        const result = await signOut();
        if (!result.success) {
          console.warn('Sign out from server failed:', result.error);
        }
      }

      // Always clear local state
      logout();
      navigate('/');
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      console.error('Sign out error:', errorMessage);
      // Even on error, log out locally
      logout();
      navigate('/');
      setLoading(false);
      return { success: true }; // Return success since local logout worked
    }
  }, [navigate, logout, setLoading]);

  // Refresh user data (e.g., after subscription change)
  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured || !isClientInitialized()) {
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, [setUser]);

  // Auto-refresh user data when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated) {
        refreshUser();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, refreshUser]);

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,
    authError,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    refreshUser,
    clearError: () => setError(null),
  };
};
