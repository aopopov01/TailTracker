import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { User, UserCredentials, UserRegistration, LoginResult, RegistrationResult } from '../types/User';
import { AuthService } from '../services/authService';
import { SessionService } from '../services/sessionService';

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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const currentUser = await AuthService.getCurrentUser();
        if (!isMountedRef.current) return; // Prevent state update on unmounted component
        
        if (currentUser) {
          // Refresh session to ensure it's still valid
          const isValid = await AuthService.refreshSession();
          if (!isMountedRef.current) return; // Prevent state update on unmounted component
          
          if (isValid) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: currentUser });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMountedRef.current) {
          dispatch({ type: 'LOGOUT' });
        }
      } finally {
        if (isMountedRef.current) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        if (!isMountedRef.current) return; // Prevent operations on unmounted component
        
        const refreshed = await AuthService.refreshSession();
        if (!isMountedRef.current) return; // Prevent state update on unmounted component
        
        if (!refreshed) {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Session refresh error:', error);
        if (isMountedRef.current) {
          dispatch({ type: 'LOGOUT' });
        }
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    // Critical fix: Always clear interval on cleanup
    return () => {
      clearInterval(refreshInterval);
    };
  }, [state.isAuthenticated]);

  const login = async (credentials: UserCredentials): Promise<LoginResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.login(credentials);
      
      if (result.success && result.user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Login failed' });
      }

      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during login';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: UserRegistration): Promise<RegistrationResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.register(userData);
      
      if (result.success && result.user) {
        // Auto-login after successful registration
        dispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
        
        // Create a session for the new user
        await SessionService.createSession(result.user);
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Registration failed' });
      }

      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during registration';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const refreshed = await AuthService.refreshSession();
      if (!isMountedRef.current) return false; // Prevent state update on unmounted component
      
      if (refreshed) {
        const currentUser = await AuthService.getCurrentUser();
        if (!isMountedRef.current) return false; // Prevent state update on unmounted component
        
        if (currentUser) {
          dispatch({ type: 'UPDATE_USER', payload: currentUser });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }

      return refreshed;
    } catch (error) {
      console.error('Session refresh error:', error);
      if (isMountedRef.current) {
        dispatch({ type: 'LOGOUT' });
      }
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.changePassword(currentPassword, newPassword);
      
      if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Password change failed' });
      }

      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while changing password';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

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