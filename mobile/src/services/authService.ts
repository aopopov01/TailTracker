import { supabase } from '../lib/supabase';
import { databaseService } from './databaseService';
import { User, UserCredentials, UserRegistration, LoginResult, RegistrationResult } from '../types';
import { ServiceHelpers, handleServiceError } from '../utils/serviceHelpers';

export class AuthService {
  /**
   * Registers a new user using Supabase Auth
   */
  static async register(userData: UserRegistration): Promise<RegistrationResult> {
    try {
      // Validate input
      const validation = this.validateRegistration(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Step 1: Create user with email confirmation enabled
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.toLowerCase(),
        password: userData.password,
        options: {
          data: {
            firstName: userData.firstName.trim(),
            lastName: userData.lastName.trim(),
            full_name: `${userData.firstName.trim()} ${userData.lastName.trim()}`
          },
          // Email verification disabled - users can use app immediately
        }
      });

      if (error) {
        // Handle 504 timeout gracefully - this is common with slow SMTP
        if (error.status === 504 || error.name === 'AuthRetryableFetchError') {
          console.log('⏱️ SMTP timeout detected - treating as successful signup with delayed email');
          return {
            success: true,
            user: {
              id: 'pending', // Temporary ID since we don't have the real one yet
              email: userData.email.toLowerCase(),
              firstName: userData.firstName.trim(),
              lastName: userData.lastName.trim(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            requiresEmailVerification: false,
            smtpDelay: true // Flag to indicate timeout occurred
          };
        }
        
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Note: User profile will be created automatically on first sign-in
      // This avoids RLS policy issues since the user isn't authenticated yet after registration
      console.log('✅ User registration completed, no email verification required');

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          createdAt: data.user.created_at!,
          updatedAt: data.user.updated_at!,
        },
        requiresEmailVerification: false // No email verification required
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Authenticates user with Supabase Auth
   */
  static async login(credentials: UserCredentials): Promise<LoginResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.toLowerCase(),
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      // Get or create user profile in our database
      let dbUser = await databaseService.getUserByAuthId(data.user.id);
      
      if (!dbUser) {
        // Check if profile exists by email first
        dbUser = await databaseService.getUserByEmail(data.user.email!);
        
        if (dbUser) {
          // Profile exists but not linked - link it
          console.log('Found existing user profile by email during login, linking with auth user');
          await databaseService.updateUserAuthId(dbUser.id, data.user.id);
        } else {
          // Create new profile if it doesn't exist
          try {
            dbUser = await databaseService.createUser({
              auth_user_id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata?.full_name || data.user.email!.split('@')[0]
            });
          } catch (createError: any) {
            // Last resort: check for email again in case of race condition
            if (createError?.code === '23505' || createError?.message?.includes('already exists')) {
              console.log('Race condition detected during login, attempting to find existing user by email');
              dbUser = await databaseService.getUserByEmail(data.user.email!);
              if (dbUser) {
                await databaseService.updateUserAuthId(dbUser.id, data.user.id);
              }
            } else {
              console.error('Failed to create user profile:', createError);
            }
            // Continue without database profile if all fails
          }
        }
      }

      // Convert to our User type
      const user: User = {
        id: dbUser?.id.toString() || data.user.id,
        email: data.user.email!,
        firstName: data.user.user_metadata?.firstName || dbUser?.full_name?.split(' ')[0] || '',
        lastName: data.user.user_metadata?.lastName || dbUser?.full_name?.split(' ').slice(1).join(' ') || '',
        createdAt: dbUser?.created_at || data.user.created_at!,
        updatedAt: dbUser?.updated_at || data.user.updated_at!,
        lastLoginAt: new Date().toISOString(),
      };

      return {
        success: true,
        user,
        token: data.session?.access_token,
        refreshToken: data.session?.refresh_token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Logs out the current user
   */
  static async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error to ensure logout always appears to succeed
    }
  }

  /**
   * Gets the current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Get user profile from database
      const dbUser = await databaseService.getUserByAuthId(user.id);

      return {
        id: dbUser?.id.toString() || user.id,
        email: user.email!,
        firstName: user.user_metadata?.firstName || dbUser?.full_name?.split(' ')[0] || '',
        lastName: user.user_metadata?.lastName || dbUser?.full_name?.split(' ').slice(1).join(' ') || '',
        createdAt: dbUser?.created_at || user.created_at!,
        updatedAt: dbUser?.updated_at || user.updated_at!,
        lastLoginAt: user.last_sign_in_at || undefined,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Checks if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Refreshes the current session
   */
  static async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  }

  /**
   * Changes user password
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate new password
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        };
      }

      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Failed to change password. Please try again.'
      };
    }
  }

  /**
   * Resets user password via email
   */
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'Failed to reset password. Please try again.'
      };
    }
  }

  /**
   * Validates user registration data
   */
  private static validateRegistration(userData: UserRegistration): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Email validation
    if (!userData.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    // Name validation
    if (!userData.firstName?.trim()) {
      errors.push('First name is required');
    }
    if (!userData.lastName?.trim()) {
      errors.push('Last name is required');
    }

    // Password validation
    const passwordValidation = this.validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Confirm password
    if (userData.password !== userData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates password strength
   */
  private static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Email verification has been disabled for better UX
   * Users can immediately use the app after registration
   */

  /**
   * Validates email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}