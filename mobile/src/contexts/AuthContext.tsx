import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { SessionService } from '../services/sessionService';
import { User, UserCredentials, UserRegistration, LoginResult, RegistrationResult } from '../types/User';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: UserCredentials) => Promise<LoginResult>;
  register: (userData: UserRegistration) => Promise<RegistrationResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Safe dispatch function that checks if component is still mounted
  const safeDispatch = useCallback((action: AuthAction) => {
    if (isMountedRef.current) {
      dispatch(action);
    }
  }, []);

  // Cleanup function for all resources
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    
    // Abort any ongoing async operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear refresh interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      // Create new AbortController for this operation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        safeDispatch({ type: 'SET_LOADING', payload: true });
        
        const currentUser = await AuthService.getCurrentUser();
        
        // Check if operation was aborted or component unmounted
        if (abortController.signal.aborted || !isMountedRef.current) {
          return;
        }
        
        if (currentUser) {
          // Refresh session to ensure it's still valid
          const isValid = await AuthService.refreshSession();
          
          // Check again if operation was aborted or component unmounted
          if (abortController.signal.aborted || !isMountedRef.current) {
            return;
          }
          
          if (isValid) {
            safeDispatch({ type: 'LOGIN_SUCCESS', payload: currentUser });
          } else {
            safeDispatch({ type: 'LOGOUT' });
          }
        } else {
          safeDispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        // Don't log or handle errors if operation was aborted
        if (!abortController.signal.aborted) {
          console.error('Auth initialization error:', error);
          safeDispatch({ type: 'LOGOUT' });
        }
      } finally {
        // Clear the abort controller reference if this is still the active one
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
        
        safeDispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, [safeDispatch]);

  // Auto-refresh session periodically
  useEffect(() => {
    // Clear any existing interval first to prevent multiple intervals
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (!state.isAuthenticated) {
      return;
    }

    const refreshSession = async () => {
      try {
        // Double-check component is still mounted and authenticated
        if (!isMountedRef.current || !state.isAuthenticated) {
          return;
        }
        
        const refreshed = await AuthService.refreshSession();
        
        // Check again after async operation
        if (!isMountedRef.current || !state.isAuthenticated) {
          return;
        }
        
        if (!refreshed) {
          safeDispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        // Only log and handle error if component is still mounted
        if (isMountedRef.current) {
          console.error('Session refresh error:', error);
          safeDispatch({ type: 'LOGOUT' });
        }
      }
    };

    // Set up the interval with proper cleanup
    refreshIntervalRef.current = setInterval(refreshSession, 15 * 60 * 1000); // Refresh every 15 minutes

    // Cleanup function for this effect
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [state.isAuthenticated, safeDispatch]);

  const login = async (credentials: UserCredentials): Promise<LoginResult> => {
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.login(credentials);
      
      // Check if component is still mounted after async operation
      if (!isMountedRef.current) {
        return { success: false, error: 'Component unmounted during login' };
      }
      
      if (result.success && result.user) {
        safeDispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
      } else {
        safeDispatch({ type: 'SET_ERROR', payload: result.error || 'Login failed' });
      }

      return result;
    } catch {
      const errorMessage = 'An unexpected error occurred during login';
      safeDispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      safeDispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (userData: UserRegistration): Promise<RegistrationResult> => {
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.register(userData);
      
      // Check if component is still mounted after async operation
      if (!isMountedRef.current) {
        return { success: false, error: 'Component unmounted during registration' };
      }
      
      if (result.success && result.user) {
        // Auto-login after successful registration
        safeDispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
        
        // Create a session for the new user
        await SessionService.createSession(result.user);
      } else {
        safeDispatch({ type: 'SET_ERROR', payload: result.error || 'Registration failed' });
      }

      return result;
    } catch {
      const errorMessage = 'An unexpected error occurred during registration';
      safeDispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      safeDispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      
      // Clear any ongoing operations first
      cleanup();
      
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      safeDispatch({ type: 'LOGOUT' });
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const refreshed = await AuthService.refreshSession();
      
      // Check if component is still mounted after async operation
      if (!isMountedRef.current) {
        return false;
      }
      
      if (refreshed) {
        const currentUser = await AuthService.getCurrentUser();
        
        // Check again after second async operation
        if (!isMountedRef.current) {
          return false;
        }
        
        if (currentUser) {
          safeDispatch({ type: 'UPDATE_USER', payload: currentUser });
        }
      } else {
        safeDispatch({ type: 'LOGOUT' });
      }

      return refreshed;
    } catch (error) {
      console.error('Session refresh error:', error);
      safeDispatch({ type: 'LOGOUT' });
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.changePassword(currentPassword, newPassword);
      
      // Check if component is still mounted after async operation
      if (!isMountedRef.current) {
        return { success: false, error: 'Component unmounted during password change' };
      }
      
      if (!result.success) {
        safeDispatch({ type: 'SET_ERROR', payload: result.error || 'Password change failed' });
      }

      return result;
    } catch {
      const errorMessage = 'An unexpected error occurred while changing password';
      safeDispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      safeDispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearError = useCallback(() => {
    safeDispatch({ type: 'CLEAR_ERROR' });
  }, [safeDispatch]);

  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    refreshSession,
    changePassword,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};