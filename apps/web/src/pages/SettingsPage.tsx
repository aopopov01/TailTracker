/**
 * Settings Page
 * User account and app settings with full functionality
 */

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Loader2,
  Save,
  Check,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { usePreferences, type DateFormat, type WeightUnit, type TemperatureUnit } from '@/contexts/PreferencesContext';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS } from '@tailtracker/shared-services';

const tabs = [
  { id: 'account', name: 'Account', icon: User },
  { id: 'preferences', name: 'Preferences', icon: Palette },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'privacy', name: 'Privacy', icon: Shield },
  { id: 'subscription', name: 'Subscription', icon: CreditCard },
];

interface ProfileForm {
  firstName: string;
  lastName: string;
}

// Local state for regional settings before saving
interface LocalRegionalSettings {
  dateFormat: DateFormat;
  weightUnit: WeightUnit;
  temperatureUnit: TemperatureUnit;
}

interface NotificationSettings {
  vaccinationReminders: boolean;
  lostPetAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface PrivacySettings {
  publicProfiles: boolean;
  locationSharing: boolean;
  analyticsOptIn: boolean;
}


const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  vaccinationReminders: true,
  lostPetAlerts: true,
  emailNotifications: true,
  pushNotifications: true,
};

const DEFAULT_PRIVACY: PrivacySettings = {
  publicProfiles: false,
  locationSharing: true,
  analyticsOptIn: true,
};

// Plan display configuration
const PLAN_DISPLAY = {
  free: {
    name: 'Free Plan',
    color: 'primary',
    pets: '1',
    family: '2',
    photos: '1',
  },
  premium: {
    name: 'Premium Plan',
    color: 'blue',
    pets: '2',
    family: '3',
    photos: '6',
  },
  pro: {
    name: 'Pro Plan',
    color: 'purple',
    pets: 'Unlimited',
    family: 'Unlimited',
    photos: '12',
  },
};

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('account');
  const user = useAuthStore((state) => state.user);
  const { signOut, isLoading } = useAuth();
  const { tier, isLoading: subscriptionLoading, refetch: refetchSubscription } = useSubscription();
  const { theme, setTheme } = useTheme();

  // Regional preferences from context
  const {
    dateFormat,
    weightUnit,
    temperatureUnit,
    isLoading: preferencesLoading,
    isSaving: preferencesSaving,
    updatePreferences,
  } = usePreferences();

  // Refetch subscription when tab changes to subscription
  useEffect(() => {
    if (activeTab === 'subscription') {
      refetchSubscription();
    }
  }, [activeTab, refetchSubscription]);

  // Get current plan display info
  const currentPlan = PLAN_DISPLAY[tier] || PLAN_DISPLAY.free;

  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Local regional settings state (for editing before save)
  const [localRegional, setLocalRegional] = useState<LocalRegionalSettings>({
    dateFormat: 'DD/MM/YYYY',
    weightUnit: 'kg',
    temperatureUnit: 'celsius',
  });
  const [regionalSaved, setRegionalSaved] = useState(false);
  const [hasRegionalChanges, setHasRegionalChanges] = useState(false);

  // Notification settings state
  const [notifications, setNotifications] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);

  // Privacy settings state
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);

  // Sync local regional state with context values
  useEffect(() => {
    if (!preferencesLoading) {
      setLocalRegional({
        dateFormat,
        weightUnit,
        temperatureUnit,
      });
      setHasRegionalChanges(false);
    }
  }, [dateFormat, weightUnit, temperatureUnit, preferencesLoading]);

  // Load notification and privacy settings from localStorage
  useEffect(() => {
    const savedNotifs = localStorage.getItem('tailtracker_notifications');
    if (savedNotifs) {
      setNotifications({ ...DEFAULT_NOTIFICATIONS, ...JSON.parse(savedNotifs) });
    }
    const savedPrivacy = localStorage.getItem('tailtracker_privacy');
    if (savedPrivacy) {
      setPrivacy({ ...DEFAULT_PRIVACY, ...JSON.parse(savedPrivacy) });
    }
  }, []);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      if (!supabase) {
        throw new Error('Database not configured');
      }
      const { error } = await supabase
        .from('users')
        .update({
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user?.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    },
  });

  // Update local regional settings (before save)
  const updateLocalRegional = (newSettings: Partial<LocalRegionalSettings>) => {
    setLocalRegional((prev) => ({ ...prev, ...newSettings }));
    setHasRegionalChanges(true);
  };

  // Save regional preferences to database
  const handleSaveRegionalPreferences = async () => {
    const success = await updatePreferences(localRegional);
    if (success) {
      setRegionalSaved(true);
      setHasRegionalChanges(false);
      setTimeout(() => setRegionalSaved(false), 3000);
    }
  };

  // Save notifications
  const saveNotifications = (newNotifs: Partial<NotificationSettings>) => {
    const updated = { ...notifications, ...newNotifs };
    setNotifications(updated);
    localStorage.setItem('tailtracker_notifications', JSON.stringify(updated));
  };

  // Save privacy
  const savePrivacy = (newPrivacy: Partial<PrivacySettings>) => {
    const updated = { ...privacy, ...newPrivacy };
    setPrivacy(updated);
    localStorage.setItem('tailtracker_privacy', JSON.stringify(updated));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate(profileForm);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="card">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">
                  Account Information
                </h2>
              </div>
              <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl font-medium text-primary-700">
                      {profileForm.firstName?.[0] ||
                        user?.email?.[0]?.toUpperCase() ||
                        'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {profileForm.firstName} {profileForm.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      className="input"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="input"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="input bg-gray-50"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={signOut}
                    disabled={isLoading}
                    className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Sign Out'
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={saveProfileMutation.isPending}
                    className="btn-primary"
                  >
                    {saveProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : profileSaved ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Appearance */}
              <div className="card">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-gray-900">Appearance</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value as Theme)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                            theme === option.value
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <option.icon
                            className={`h-6 w-6 ${
                              theme === option.value
                                ? 'text-primary-600'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              theme === option.value
                                ? 'text-primary-700 dark:text-primary-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Settings */}
              <div className="card">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-gray-900">
                    Regional Settings
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {preferencesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="label">Date Format</label>
                        <select
                          value={localRegional.dateFormat}
                          onChange={(e) =>
                            updateLocalRegional({
                              dateFormat: e.target.value as DateFormat,
                            })
                          }
                          className="input"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Weight Unit</label>
                          <select
                            value={localRegional.weightUnit}
                            onChange={(e) =>
                              updateLocalRegional({
                                weightUnit: e.target.value as WeightUnit,
                              })
                            }
                            className="input"
                          >
                            <option value="kg">Kilograms (kg)</option>
                            <option value="lbs">Pounds (lbs)</option>
                          </select>
                        </div>

                        <div>
                          <label className="label">Temperature Unit</label>
                          <select
                            value={localRegional.temperatureUnit}
                            onChange={(e) =>
                              updateLocalRegional({
                                temperatureUnit: e.target.value as TemperatureUnit,
                              })
                            }
                            className="input"
                          >
                            <option value="celsius">Celsius</option>
                            <option value="fahrenheit">Fahrenheit</option>
                          </select>
                        </div>
                      </div>

                      {/* Save Preferences Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <button
                          onClick={handleSaveRegionalPreferences}
                          disabled={preferencesSaving || !hasRegionalChanges}
                          className={`btn-primary ${
                            !hasRegionalChanges ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {preferencesSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Saving...
                            </>
                          ) : regionalSaved ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Saved!
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Preferences
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">
                  Notification Preferences
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Vaccination Reminders
                    </h3>
                    <p className="text-sm text-gray-500">
                      Get notified about upcoming vaccinations
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.vaccinationReminders}
                      onChange={(e) =>
                        saveNotifications({
                          vaccinationReminders: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Lost Pet Alerts
                    </h3>
                    <p className="text-sm text-gray-500">
                      Get notified about lost pets in your area
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.lostPetAlerts}
                      onChange={(e) =>
                        saveNotifications({ lostPetAlerts: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive updates via email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) =>
                        saveNotifications({
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Push Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive push notifications in browser
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) =>
                        saveNotifications({
                          pushNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="card">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Privacy Settings</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Public Pet Profiles
                    </h3>
                    <p className="text-sm text-gray-500">
                      Allow others to see your pet profiles via shared links
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacy.publicProfiles}
                      onChange={(e) =>
                        savePrivacy({ publicProfiles: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Location Sharing
                    </h3>
                    <p className="text-sm text-gray-500">
                      Share your location for lost pet alerts (Pro tier)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacy.locationSharing}
                      onChange={(e) =>
                        savePrivacy({ locationSharing: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Analytics & Improvement
                    </h3>
                    <p className="text-sm text-gray-500">
                      Help us improve by sharing anonymous usage data
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacy.analyticsOptIn}
                      onChange={(e) =>
                        savePrivacy({ analyticsOptIn: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Data Management
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn-outline text-sm">
                      Export My Data
                    </button>
                    <button className="btn-outline text-red-600 border-red-300 hover:bg-red-50 text-sm">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="card">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Subscription</h2>
              </div>
              <div className="p-6">
                {subscriptionLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : (
                  <>
                    {/* Current Plan */}
                    <div className={`rounded-xl p-6 mb-6 ${
                      tier === 'pro' ? 'bg-purple-50' :
                      tier === 'premium' ? 'bg-blue-50' : 'bg-primary-50'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {tier === 'pro' && <Crown className="h-6 w-6 text-purple-600" />}
                          {tier === 'premium' && <Sparkles className="h-6 w-6 text-blue-600" />}
                          <div>
                            <h3 className={`text-lg font-semibold ${
                              tier === 'pro' ? 'text-purple-900' :
                              tier === 'premium' ? 'text-blue-900' : 'text-primary-900'
                            }`}>
                              {currentPlan.name}
                            </h3>
                            <p className={`text-sm ${
                              tier === 'pro' ? 'text-purple-700' :
                              tier === 'premium' ? 'text-blue-700' : 'text-primary-700'
                            }`}>
                              {currentPlan.pets} {currentPlan.pets === '1' ? 'pet' : 'pets'}, {currentPlan.family} family members, {currentPlan.photos} {currentPlan.photos === '1' ? 'photo' : 'photos'} per pet
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tier === 'pro' ? 'bg-purple-100 text-purple-700' :
                          tier === 'premium' ? 'bg-blue-100 text-blue-700' : 'bg-primary-100 text-primary-700'
                        }`}>
                          Current Plan
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className={`text-2xl font-bold ${
                            tier === 'pro' ? 'text-purple-900' :
                            tier === 'premium' ? 'text-blue-900' : 'text-primary-900'
                          }`}>{currentPlan.pets}</p>
                          <p className={`text-xs ${
                            tier === 'pro' ? 'text-purple-700' :
                            tier === 'premium' ? 'text-blue-700' : 'text-primary-700'
                          }`}>{currentPlan.pets === '1' ? 'Pet' : 'Pets'}</p>
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${
                            tier === 'pro' ? 'text-purple-900' :
                            tier === 'premium' ? 'text-blue-900' : 'text-primary-900'
                          }`}>{currentPlan.family}</p>
                          <p className={`text-xs ${
                            tier === 'pro' ? 'text-purple-700' :
                            tier === 'premium' ? 'text-blue-700' : 'text-primary-700'
                          }`}>Family</p>
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${
                            tier === 'pro' ? 'text-purple-900' :
                            tier === 'premium' ? 'text-blue-900' : 'text-primary-900'
                          }`}>{currentPlan.photos}</p>
                          <p className={`text-xs ${
                            tier === 'pro' ? 'text-purple-700' :
                            tier === 'premium' ? 'text-blue-700' : 'text-primary-700'
                          }`}>{currentPlan.photos === '1' ? 'Photo' : 'Photos'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pro Plan - Already on best plan message */}
                    {tier === 'pro' ? (
                      <div className="text-center py-8 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/50">
                        <Crown className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold text-purple-900 mb-2">
                          You're on our best plan!
                        </h4>
                        <p className="text-sm text-purple-700 max-w-md mx-auto">
                          Enjoy unlimited pets, unlimited family members, and all premium features.
                          Thank you for being a Pro member!
                        </p>
                      </div>
                    ) : (
                      /* Available Plans */
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">
                          Upgrade Your Plan
                        </h4>

                        {/* Premium Plan - Only show if not on Premium or Pro */}
                        {tier === 'free' && (
                          <div className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                                <div>
                                  <h5 className="font-semibold text-gray-900">Premium</h5>
                                  <p className="text-sm text-gray-500">
                                    Perfect for pet families
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">
                                  ${SUBSCRIPTION_PLANS.premium.price.monthly.toFixed(2)}
                                </span>
                                <span className="text-gray-500">/mo</span>
                              </div>
                            </div>
                            <ul className="space-y-2 mb-4">
                              <li className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="h-4 w-4 text-green-500" />2 pet profiles
                              </li>
                              <li className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="h-4 w-4 text-green-500" />3 family members
                              </li>
                              <li className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="h-4 w-4 text-green-500" />6 photos per pet
                              </li>
                              <li className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="h-4 w-4 text-green-500" />
                                QR code sharing
                              </li>
                              <li className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="h-4 w-4 text-green-500" />
                                Export capabilities
                              </li>
                            </ul>
                            <button className="btn-outline w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                              Upgrade to Premium
                            </button>
                          </div>
                        )}

                        {/* Pro Plan - Show for Free and Premium users */}
                        <div className="border-2 border-purple-600 rounded-lg p-4 relative">
                          <div className="absolute -top-3 left-4 px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded">
                            BEST VALUE
                          </div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <Crown className="h-5 w-5 text-purple-500" />
                              <div>
                                <h5 className="font-semibold text-gray-900">Pro</h5>
                                <p className="text-sm text-gray-500">
                                  For dedicated pet lovers
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-gray-900">
                                ${SUBSCRIPTION_PLANS.pro.price.monthly.toFixed(2)}
                              </span>
                              <span className="text-gray-500">/mo</span>
                            </div>
                          </div>
                          <ul className="space-y-2 mb-4">
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500" />
                              Unlimited pets
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500" />
                              Unlimited family members
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500" />
                              12 photos per pet
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500" />
                              Create lost pet alerts
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500" />
                              Advanced analytics
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500" />
                              Priority support
                            </li>
                          </ul>
                          <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                            Upgrade to Pro
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
