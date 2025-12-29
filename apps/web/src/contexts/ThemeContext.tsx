/**
 * Theme Context
 * Global theme management with system preference support
 * Default: Light mode
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'tailtracker-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function getStoredTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  }
  // Default to light mode
  return 'light';
}

// Apply theme to document root - called immediately and on changes
function applyThemeToDOM(effectiveTheme: 'light' | 'dark') {
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove('dark', 'light');

  // Apply the appropriate class
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  }
  // For light mode, we just remove 'dark' class (Tailwind's default is light)
}

// Calculate effective theme from selection
function resolveTheme(selectedTheme: Theme): 'light' | 'dark' {
  if (selectedTheme === 'system') {
    return getSystemTheme();
  }
  return selectedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(getStoredTheme())
  );

  // Apply theme function that updates both state and DOM
  const applyTheme = useCallback((selectedTheme: Theme) => {
    const effective = resolveTheme(selectedTheme);
    setResolvedTheme(effective);
    applyThemeToDOM(effective);
  }, []);

  // Set theme handler - updates state, localStorage, and DOM
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  // Apply theme on initial mount
  useEffect(() => {
    const savedTheme = getStoredTheme();
    applyTheme(savedTheme);
  }, [applyTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const effective = e.matches ? 'dark' : 'light';
      setResolvedTheme(effective);
      applyThemeToDOM(effective);
    };

    // Apply current system preference
    applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
