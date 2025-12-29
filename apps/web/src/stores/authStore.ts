/**
 * Authentication Store
 * Manages user authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@tailtracker/shared-types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // Whether auth has been checked (separate from loading)
  isLoading: boolean; // For auth operations (login, signup, etc.)
  error: string | null;
  authError: string | null; // Connection/config error
  setUser: (user: User | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
      error: null,
      authError: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),

      setInitialized: (isInitialized) => set({ isInitialized }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setAuthError: (authError) => set({ authError }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
