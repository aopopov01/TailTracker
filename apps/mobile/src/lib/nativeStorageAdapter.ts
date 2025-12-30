/**
 * Native Storage Adapter for React Native
 * Uses AsyncStorage for session persistence in mobile apps
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@tailtracker/shared-types';

/**
 * React Native storage adapter using AsyncStorage
 * Compatible with @tailtracker/shared-services
 */
export const nativeStorageAdapter: StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
    }
  },
};

export default nativeStorageAdapter;
