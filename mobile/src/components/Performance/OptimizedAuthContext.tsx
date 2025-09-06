import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, ReactNode, useMemo } from 'react';
import { AuthService } from '../../services/authService';
import { SessionService } from '../../services/sessionService';
import { User, UserCredentials, UserRegistration, LoginResult, RegistrationResult } from '../../types';

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

// PERFORMANCE OPTIMIZATION: Memoized Auth Provider to reduce re-renders
export const OptimizedAuthProvider: React.FC<{ children: ReactNode }> = React.memo(({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // PERFORMANCE OPTIMIZATION: Use useCallback for all dispatch functions to prevent re-renders
  const safeDispatch = useCallback((action: AuthAction) => {
    if (isMountedRef.current) {
      dispatch(action);
    }
  }, []);

  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // PERFORMANCE OPTIMIZATION: Optimized auth initialization with retry logic
  const initializeAuth = useCallback(async () => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      
      // Add timeout to prevent hanging on network issues
      const authPromise = AuthService.getCurrentUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      );
      
      const currentUser = await Promise.race([authPromise, timeoutPromise]) as User | null;
      
      if (abortController.signal.aborted || !isMountedRef.current) {
        return;
      }
      
      if (currentUser) {
        const isValid = await AuthService.refreshSession();
        
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
      if (!abortController.signal.aborted) {
        console.error('Auth initialization error:', error);
        safeDispatch({ type: 'LOGOUT' });
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      
      safeDispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [safeDispatch]);

  useEffect(() => {
    initializeAuth();
    return cleanup;
  }, [initializeAuth, cleanup]);

  // PERFORMANCE OPTIMIZATION: Debounced refresh with better interval management
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (!state.isAuthenticated) {
      return;
    }

    const refreshSession = async () => {
      if (!isMountedRef.current || !state.isAuthenticated) {
        return;
      }
      
      try {
        const refreshed = await AuthService.refreshSession();
        
        if (!isMountedRef.current || !state.isAuthenticated) {
          return;
        }
        
        if (!refreshed) {
          safeDispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('Session refresh error:', error);
          safeDispatch({ type: 'LOGOUT' });
        }
      }
    };

    // PERFORMANCE OPTIMIZATION: Longer interval to reduce battery usage
    refreshIntervalRef.current = setInterval(refreshSession, 20 * 60 * 1000); // 20 minutes

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [state.isAuthenticated, safeDispatch]);

  // PERFORMANCE OPTIMIZATION: Memoized action functions
  const login = useCallback(async (credentials: UserCredentials): Promise<LoginResult> => {
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.login(credentials);
      
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
  }, [safeDispatch]);

  const register = useCallback(async (userData: UserRegistration): Promise<RegistrationResult> => {
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.register(userData);
      
      if (!isMountedRef.current) {
        return { success: false, error: 'Component unmounted during registration' };
      }
      
      if (result.success && result.user) {
        safeDispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
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
  }, [safeDispatch]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      cleanup();
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      safeDispatch({ type: 'LOGOUT' });
    }
  }, [cleanup, safeDispatch]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshed = await AuthService.refreshSession();
      
      if (!isMountedRef.current) {
        return false;
      }
      
      if (refreshed) {
        const currentUser = await AuthService.getCurrentUser();
        
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
  }, [safeDispatch]);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const result = await AuthService.changePassword(currentPassword, newPassword);
      
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
  }, [safeDispatch]);

  const clearError = useCallback(() => {
    safeDispatch({ type: 'CLEAR_ERROR' });
  }, [safeDispatch]);

  // PERFORMANCE OPTIMIZATION: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
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
  }), [
    state.user,
    state.isAuthenticated,
    state.isLoading,
    state.error,
    login,
    register,
    logout,
    refreshSession,
    changePassword,
    clearError
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
});

OptimizedAuthProvider.displayName = 'OptimizedAuthProvider';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};