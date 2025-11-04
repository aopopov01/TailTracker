/**
 * Authentication Service
 * Handles user authentication with Supabase
 */

import { supabase } from './supabase';
import { User } from '@/types';

interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Transform Supabase user to our User interface
const transformSupabaseUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    firstName: supabaseUser.user_metadata?.firstName || '',
    lastName: supabaseUser.user_metadata?.lastName || '',
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
    lastLoginAt: supabaseUser.last_sign_in_at,
  };
};

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          ...data,
          user: data.user ? transformSupabaseUser(data.user) : null,
        },
      };
    } catch (error) {
      return { success: false, error: 'Sign up failed' };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          ...data,
          user: data.user ? transformSupabaseUser(data.user) : null,
        },
      };
    } catch (error) {
      return { success: false, error: 'Sign in failed' };
    }
  },

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Sign out failed' };
    }
  },

  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: user ? transformSupabaseUser(user) : null,
      };
    } catch (error) {
      return { success: false, error: 'Failed to get current user' };
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async login(email: string, password: string): Promise<AuthResult> {
    // Alias for signIn for compatibility
    return this.signIn(email, password);
  },

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Password reset failed' };
    }
  },

  async register(email: string, password: string): Promise<AuthResult> {
    // Alias for signUp for compatibility
    return this.signUp(email, password);
  },

  clearError(): void {
    // Mock implementation for clearing auth errors
    console.log('Auth error cleared');
  },

  async refreshSession(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Session refresh failed' };
    }
  },

  async logout(): Promise<AuthResult> {
    // Alias for signOut for compatibility
    return this.signOut();
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Password change failed' };
    }
  },
};

export class AuthService {
  async signUp(email: string, password: string) {
    return authService.signUp(email, password);
  }
  async signIn(email: string, password: string) {
    return authService.signIn(email, password);
  }
  async signOut() {
    return authService.signOut();
  }
  async getCurrentUser() {
    return authService.getCurrentUser();
  }
  async login(email: string, password: string) {
    return authService.login(email, password);
  }
  async resetPassword(email: string) {
    return authService.resetPassword(email);
  }
  async register(email: string, password: string) {
    return authService.register(email, password);
  }
  async refreshSession() {
    return authService.refreshSession();
  }
  async logout() {
    return authService.logout();
  }
  async changePassword(currentPassword: string, newPassword: string) {
    return authService.changePassword(currentPassword, newPassword);
  }
  clearError() {
    return authService.clearError();
  }
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return authService.onAuthStateChange(callback);
  }

  // Static methods for direct class access
  static async register(email: string, password: string) {
    return authService.register(email, password);
  }
  static async resetPassword(email: string) {
    return authService.resetPassword(email);
  }
  static async getCurrentUser() {
    return authService.getCurrentUser();
  }
  static async refreshSession() {
    return authService.refreshSession();
  }
  static async logout() {
    return authService.logout();
  }
  static async changePassword(currentPassword: string, newPassword: string) {
    return authService.changePassword(currentPassword, newPassword);
  }
  static async login(email: string, password: string) {
    return authService.login(email, password);
  }
  static async signIn(email: string, password: string) {
    return authService.signIn(email, password);
  }
}

export default authService;
