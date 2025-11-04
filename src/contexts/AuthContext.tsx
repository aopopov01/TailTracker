/**
 * AuthContext - Authentication state management with Supabase integration
 */

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { supabaseHelpers, supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  clearError: () => void;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearError = () => {
    setError(null);
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await supabaseHelpers.signIn(email, password);

      if (result.user) {
        console.log('✅ User signed in successfully:', result.user.email);
        return { success: true, data: result };
      } else {
        const errorMsg = 'Sign in failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in';

      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage =
          'Please check your email and click the confirmation link';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const metadata = {
        first_name: firstName || '',
        last_name: lastName || '',
        full_name: firstName && lastName ? `${firstName} ${lastName}` : '',
      };

      const result = await supabaseHelpers.signUp(email, password, metadata);

      if (result.user) {
        console.log('✅ User registered successfully:', result.user.email);

        // For immediate account creation, the user should be logged in automatically
        // Supabase handles this automatically when email verification is disabled
        return {
          success: true,
          data: result,
          error: undefined,
        };
      } else {
        const errorMsg = 'Registration failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to create account';

      if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      await supabaseHelpers.signOut();
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      const errorMessage = error.message || 'Failed to sign out';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Aliases for compatibility
  const login = signIn;
  const logout = signOut;
  const register = signUp;

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    login,
    logout,
    clearError,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
