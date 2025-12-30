/**
 * Cookie Consent Banner Component
 * GDPR-compliant cookie consent management
 * Displays banner on first visit and allows users to manage preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie, Settings, ChevronDown, ChevronUp } from 'lucide-react';

// Cookie consent preferences
export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  consentGivenAt: string | null;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_CONSENT_VERSION = '1.0';

// Default preferences - essential only
const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  consentGivenAt: null,
};

// Get saved preferences from localStorage
export const getCookiePreferences = (): CookiePreferences | null => {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if version matches (for future updates)
      if (parsed.version === COOKIE_CONSENT_VERSION) {
        return parsed.preferences;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

// Save preferences to localStorage
const saveCookiePreferences = (preferences: CookiePreferences): void => {
  localStorage.setItem(
    COOKIE_CONSENT_KEY,
    JSON.stringify({
      version: COOKIE_CONSENT_VERSION,
      preferences: {
        ...preferences,
        consentGivenAt: new Date().toISOString(),
      },
    })
  );
};

// Check if consent has been given
export const hasConsentBeenGiven = (): boolean => {
  return getCookiePreferences()?.consentGivenAt !== null;
};

interface CookieConsentProps {
  isOpen?: boolean; // For external control (e.g., Cookie Settings link)
  onClose?: () => void;
}

export const CookieConsent = ({ isOpen: externalIsOpen, onClose }: CookieConsentProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  // Check if we need to show the banner
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsVisible(externalIsOpen);
      if (externalIsOpen) {
        // Load current preferences when opening settings
        const saved = getCookiePreferences();
        if (saved) {
          setPreferences(saved);
        }
      }
    } else {
      // Auto-show if no consent given
      const hasConsent = hasConsentBeenGiven();
      setIsVisible(!hasConsent);
    }
  }, [externalIsOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setShowDetails(false);
    onClose?.();
  }, [onClose]);

  const handleAcceptAll = useCallback(() => {
    const newPreferences: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      consentGivenAt: new Date().toISOString(),
    };
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    handleClose();
  }, [handleClose]);

  const handleRejectNonEssential = useCallback(() => {
    const newPreferences: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      consentGivenAt: new Date().toISOString(),
    };
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    handleClose();
  }, [handleClose]);

  const handleSavePreferences = useCallback(() => {
    saveCookiePreferences(preferences);
    handleClose();
  }, [preferences, handleClose]);

  const togglePreference = (key: 'analytics' | 'marketing') => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={externalIsOpen ? handleClose : undefined}
      />

      {/* Banner */}
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Cookie className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Cookie Preferences
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                We respect your privacy
              </p>
            </div>
          </div>
          {externalIsOpen && (
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            We use cookies to enhance your experience. Essential cookies are required for the platform
            to function. You can choose to enable analytics cookies to help us improve our services.
            Learn more in our{' '}
            <Link to="/cookies" className="text-primary-600 hover:text-primary-700" onClick={handleClose}>
              Cookie Policy
            </Link>
            .
          </p>

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm font-medium mb-4 hover:text-primary-600 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Settings className="h-4 w-4" />
            Customize preferences
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Detailed Options */}
          {showDetails && (
            <div className="space-y-3 mb-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              {/* Essential Cookies */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    Essential Cookies
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Required for the platform to function
                  </p>
                </div>
                <div
                  className="px-3 py-1 text-xs rounded-full bg-slate-200 dark:bg-slate-700"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Always on
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    Analytics Cookies
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Help us understand how you use our platform
                  </p>
                </div>
                <button
                  onClick={() => togglePreference('analytics')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.analytics
                      ? 'bg-primary-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    Marketing Cookies
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Used for personalized advertising (currently not in use)
                  </p>
                </div>
                <button
                  onClick={() => togglePreference('marketing')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.marketing
                      ? 'bg-primary-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex flex-col sm:flex-row gap-3" style={{ borderColor: 'var(--color-border)' }}>
          {showDetails ? (
            <>
              <button
                onClick={handleRejectNonEssential}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Essential Only
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                Save Preferences
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRejectNonEssential}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Essential Only
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                Accept All
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
