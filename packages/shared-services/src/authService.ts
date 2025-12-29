/**
 * Authentication Service
 * Platform-agnostic authentication operations
 */

import type {
  User,
  UserCredentials,
  UserRegistration,
  AuthResult,
  LoginResult,
  RegistrationResult,
} from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';

/**
 * Transform Supabase user to app User type
 */
const transformUser = (supabaseUser: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  firstName: supabaseUser.user_metadata?.firstName || '',
  lastName: supabaseUser.user_metadata?.lastName || '',
  createdAt: supabaseUser.created_at,
  updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
  lastLoginAt: supabaseUser.last_sign_in_at,
  profilePictureUrl: supabaseUser.user_metadata?.avatar_url,
});

/**
 * Sign up a new user
 */
export const signUp = async (
  registration: UserRegistration
): Promise<RegistrationResult> => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email: registration.email,
      password: registration.password,
      options: {
        data: {
          firstName: registration.firstName,
          lastName: registration.lastName,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        errorCode: error.name,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Registration failed - no user returned',
      };
    }

    return {
      success: true,
      user: transformUser(data.user),
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      requiresEmailVerification: !data.session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (credentials: UserCredentials): Promise<LoginResult> => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        errorCode: error.name,
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Login failed - invalid response',
      };
    }

    // Fetch role from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, subscription_tier')
      .eq('auth_user_id', data.user.id)
      .single();

    if (profileError) {
      console.warn('signIn: Failed to fetch user profile:', profileError.message);
    }

    const user = transformUser(data.user);

    return {
      success: true,
      user: {
        ...user,
        role: userProfile?.role || 'user',
        subscriptionTier: userProfile?.subscription_tier || 'free',
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<AuthResult> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed',
    };
  }
};

/**
 * Get the current authenticated user with role from database
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    // Fetch role from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, subscription_tier')
      .eq('auth_user_id', data.user.id)
      .single();

    if (profileError) {
      console.warn('getCurrentUser: Failed to fetch user profile:', profileError.message);
    }

    const user = transformUser(data.user);

    // Add role and subscription tier from database
    return {
      ...user,
      role: userProfile?.role || 'user',
      subscriptionTier: userProfile?.subscription_tier || 'free',
    };
  } catch (err) {
    console.error('getCurrentUser: Unexpected error:', err);
    return null;
  }
};

/**
 * Get the current session with user role from database
 */
export const getSession = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    // Fetch role from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, subscription_tier')
      .eq('auth_user_id', data.session.user.id)
      .single();

    if (profileError) {
      console.warn('getSession: Failed to fetch user profile:', profileError.message);
    }

    const user = transformUser(data.session.user);

    return {
      user: {
        ...user,
        role: userProfile?.role || 'user',
        subscriptionTier: userProfile?.subscription_tier || 'free',
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  } catch {
    return null;
  }
};

/**
 * Refresh the current session
 */
export const refreshSession = async (): Promise<AuthResult> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.session) {
      return {
        success: false,
        error: 'No session to refresh',
      };
    }

    return {
      success: true,
      user: transformUser(data.session.user),
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session refresh failed',
    };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password reset failed',
    };
  }
};

/**
 * Update password with reset token
 */
export const updatePassword = async (newPassword: string): Promise<AuthResult> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user ? transformUser(data.user) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password update failed',
    };
  }
};

/**
 * Subscribe to auth state changes
 * Fetches fresh user profile with role from database on each auth change
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
): (() => void) => {
  const supabase = getSupabaseClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }

    // Fetch role from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, subscription_tier')
      .eq('auth_user_id', session.user.id)
      .single();

    if (profileError) {
      console.warn('onAuthStateChange: Failed to fetch user profile:', profileError.message);
    }

    const user = transformUser(session.user);
    callback({
      ...user,
      role: userProfile?.role || 'user',
      subscriptionTier: userProfile?.subscription_tier || 'free',
    });
  });

  return () => {
    subscription.unsubscribe();
  };
};
