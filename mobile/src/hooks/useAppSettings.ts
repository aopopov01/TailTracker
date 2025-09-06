import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  locationTracking: boolean;
  biometricAuth: boolean;
  language: string;
  units: 'metric' | 'imperial';
  autoBackup: boolean;
  dataSharing: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  notifications: true,
  locationTracking: true,
  biometricAuth: false,
  language: 'en',
  units: 'metric',
  autoBackup: true,
  dataSharing: false,
};

const SETTINGS_STORAGE_KEY = '@TailTracker:app_settings';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating app setting:', error);
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Error resetting app settings:', error);
    }
  };

  const refetch = () => {
    loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    resetSettings,
    refetch,
  };
};