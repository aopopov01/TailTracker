import React from 'react';
import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_DATA_KEY = '@TailTracker:widget_data';
const WIDGET_SETTINGS_KEY = '@TailTracker:widget_settings';

// Widget native module interface
interface WidgetNativeModule {
  updateWidget: (widgetId: number, data: string) => Promise<boolean>;
  updateAllWidgets: (data: string) => Promise<boolean>;
  getActiveWidgets: () => Promise<number[]>;
  removeWidget: (widgetId: number) => Promise<boolean>;
  isWidgetSupported: () => Promise<boolean>;
}

export interface PetWidgetData {
  pets: {
    id: string;
    name: string;
    imageUrl?: string;
    location?: {
      isInSafeZone: boolean;
      lastSeen: number;
      latitude?: number;
      longitude?: number;
    };
    health?: {
      score: number;
      status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      lastCheckup?: number;
    };
    activity?: {
      level: 'low' | 'normal' | 'high';
      stepsToday: number;
      lastActivity?: number;
    };
  }[];
  selectedPetId?: string;
  lastUpdated: number;
}

export interface WidgetSettings {
  autoUpdate: boolean;
  updateInterval: number; // minutes
  showSteps: boolean;
  showHealth: boolean;
  showLocation: boolean;
  compactMode: boolean;
}

class AndroidWidgetService {
  private widgetModule: WidgetNativeModule | null = null;
  private isSupported = false;
  private widgetData: PetWidgetData | null = null;
  private settings: WidgetSettings = {
    autoUpdate: true,
    updateInterval: 15,
    showSteps: true,
    showHealth: true,
    showLocation: true,
    compactMode: false,
  };

  constructor() {
    this.initializeWidget();
  }

  /**
   * Initialize widget service
   */
  private async initializeWidget(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('Android Widget Service is only available on Android');
      return;
    }

    try {
      // In a real implementation, this would use a native module
      // For now, we'll simulate the functionality
      this.isSupported = true;
      
      await this.loadWidgetData();
      await this.loadWidgetSettings();
      
      // Setup update listeners
      this.setupUpdateListeners();
      
      console.log('Android Widget Service initialized');
    } catch (error) {
      console.error('Error initializing Android Widget Service:', error);
    }
  }

  /**
   * Check if widgets are supported
   */
  async isWidgetSupported(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      // Mock implementation
      return this.isSupported;
    } catch (error) {
      console.error('Error checking widget support:', error);
      return false;
    }
  }

  /**
   * Update widget data
   */
  async updateWidgetData(data: PetWidgetData): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Widgets not supported');
      return false;
    }

    try {
      this.widgetData = {
        ...data,
        lastUpdated: Date.now(),
      };

      // Save to storage
      await this.saveWidgetData();

      // Update all active widgets
      return await this.updateAllWidgets();
    } catch (error) {
      console.error('Error updating widget data:', error);
      return false;
    }
  }

  /**
   * Update specific widget
   */
  async updateWidget(widgetId: number, data?: PetWidgetData): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const dataToSend = data || this.widgetData;
      if (!dataToSend) {
        console.warn('No widget data available');
        return false;
      }

      // Mock implementation - would call native module
      console.log(`Updating widget ${widgetId} with data:`, dataToSend);
      return true;
    } catch (error) {
      console.error(`Error updating widget ${widgetId}:`, error);
      return false;
    }
  }

  /**
   * Update all active widgets
   */
  async updateAllWidgets(): Promise<boolean> {
    if (!this.isSupported || !this.widgetData) return false;

    try {
      // Mock implementation - would call native module
      console.log('Updating all widgets with data:', this.widgetData);
      return true;
    } catch (error) {
      console.error('Error updating all widgets:', error);
      return false;
    }
  }

  /**
   * Get active widget IDs
   */
  async getActiveWidgets(): Promise<number[]> {
    if (!this.isSupported) return [];

    // Mock implementation - would call native module
    return [1001, 1002]; // Example widget IDs
  }

  /**
   * Remove widget
   */
  async removeWidget(widgetId: number): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      // Mock implementation - would call native module
      console.log(`Removing widget ${widgetId}`);
      return true;
    } catch (error) {
      console.error(`Error removing widget ${widgetId}:`, error);
      return false;
    }
  }

  /**
   * Get widget settings
   */
  getWidgetSettings(): WidgetSettings {
    return { ...this.settings };
  }

  /**
   * Update widget settings
   */
  async updateWidgetSettings(newSettings: Partial<WidgetSettings>): Promise<void> {
    try {
      this.settings = {
        ...this.settings,
        ...newSettings,
      };

      await this.saveWidgetSettings();

      // If auto-update settings changed, update widgets
      if ('autoUpdate' in newSettings || 'updateInterval' in newSettings) {
        this.setupUpdateListeners();
      }

      // Update widgets with new settings
      await this.updateAllWidgets();
    } catch (error) {
      console.error('Error updating widget settings:', error);
    }
  }

  /**
   * Get current widget data
   */
  getWidgetData(): PetWidgetData | null {
    return this.widgetData;
  }

  /**
   * Force refresh all widgets
   */
  async refreshWidgets(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      // Reload data and update widgets
      await this.loadWidgetData();
      return await this.updateAllWidgets();
    } catch (error) {
      console.error('Error refreshing widgets:', error);
      return false;
    }
  }

  /**
   * Private methods
   */

  private async loadWidgetData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      if (stored) {
        this.widgetData = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading widget data:', error);
    }
  }

  private async saveWidgetData(): Promise<void> {
    try {
      if (this.widgetData) {
        await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(this.widgetData));
      }
    } catch (error) {
      console.error('Error saving widget data:', error);
    }
  }

  private async loadWidgetSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading widget settings:', error);
    }
  }

  private async saveWidgetSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving widget settings:', error);
    }
  }

  private setupUpdateListeners(): void {
    // Setup automatic updates based on settings
    if (this.settings.autoUpdate) {
      // In a real implementation, this would setup periodic updates
      console.log(`Auto-update enabled with ${this.settings.updateInterval} minute interval`);
    }

    // Listen for app state changes
    DeviceEventEmitter.addListener('appStateChange', (state: string) => {
      if (state === 'active') {
        // App became active, refresh widgets
        this.refreshWidgets();
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    DeviceEventEmitter.removeAllListeners('appStateChange');
  }
}

// Export singleton instance
export const androidWidgetService = new AndroidWidgetService();

// TailTracker-specific widget helpers
export const TailTrackerWidget = {
  /**
   * Update widget with pet data
   */
  async updateWithPetData(pets: any[]): Promise<boolean> {
    try {
      const widgetData: PetWidgetData = {
        pets: pets.map(pet => ({
          id: pet.id,
          name: pet.name,
          imageUrl: pet.profileImage,
          location: {
            isInSafeZone: pet.location?.isInSafeZone ?? true,
            lastSeen: pet.location?.lastSeen || Date.now(),
            latitude: pet.location?.latitude,
            longitude: pet.location?.longitude,
          },
          health: {
            score: pet.health?.score || 100,
            status: pet.health?.status || 'excellent',
            lastCheckup: pet.health?.lastCheckup,
          },
          activity: {
            level: pet.activity?.level || 'normal',
            stepsToday: pet.activity?.stepsToday || 0,
            lastActivity: pet.activity?.lastActivity,
          },
        })),
        lastUpdated: Date.now(),
      };

      return await androidWidgetService.updateWidgetData(widgetData);
    } catch (error) {
      console.error('Error updating widget with pet data:', error);
      return false;
    }
  },

  /**
   * Update widget for specific pet
   */
  async updateForPet(pet: any): Promise<boolean> {
    try {
      const currentData = androidWidgetService.getWidgetData();
      if (!currentData) {
        return await TailTrackerWidget.updateWithPetData([pet]);
      }

      // Update or add pet data
      const updatedPets = [...currentData.pets];
      const existingIndex = updatedPets.findIndex(p => p.id === pet.id);

      const petData = {
        id: pet.id,
        name: pet.name,
        imageUrl: pet.profileImage,
        location: {
          isInSafeZone: pet.location?.isInSafeZone ?? true,
          lastSeen: pet.location?.lastSeen || Date.now(),
          latitude: pet.location?.latitude,
          longitude: pet.location?.longitude,
        },
        health: {
          score: pet.health?.score || 100,
          status: pet.health?.status || 'excellent',
          lastCheckup: pet.health?.lastCheckup,
        },
        activity: {
          level: pet.activity?.level || 'normal',
          stepsToday: pet.activity?.stepsToday || 0,
          lastActivity: pet.activity?.lastActivity,
        },
      };

      if (existingIndex >= 0) {
        updatedPets[existingIndex] = petData;
      } else {
        updatedPets.push(petData);
      }

      const updatedData: PetWidgetData = {
        ...currentData,
        pets: updatedPets,
        lastUpdated: Date.now(),
      };

      return await androidWidgetService.updateWidgetData(updatedData);
    } catch (error) {
      console.error('Error updating widget for pet:', error);
      return false;
    }
  },

  /**
   * Remove pet from widget
   */
  async removePet(petId: string): Promise<boolean> {
    try {
      const currentData = androidWidgetService.getWidgetData();
      if (!currentData) return true;

      const updatedPets = currentData.pets.filter(pet => pet.id !== petId);
      
      const updatedData: PetWidgetData = {
        ...currentData,
        pets: updatedPets,
        selectedPetId: currentData.selectedPetId === petId ? updatedPets[0]?.id : currentData.selectedPetId,
        lastUpdated: Date.now(),
      };

      return await androidWidgetService.updateWidgetData(updatedData);
    } catch (error) {
      console.error('Error removing pet from widget:', error);
      return false;
    }
  },

  /**
   * Set selected pet for widget
   */
  async setSelectedPet(petId: string): Promise<boolean> {
    try {
      const currentData = androidWidgetService.getWidgetData();
      if (!currentData) return false;

      const updatedData: PetWidgetData = {
        ...currentData,
        selectedPetId: petId,
        lastUpdated: Date.now(),
      };

      return await androidWidgetService.updateWidgetData(updatedData);
    } catch (error) {
      console.error('Error setting selected pet:', error);
      return false;
    }
  },

  /**
   * Update pet location status
   */
  async updatePetLocation(petId: string, location: { isInSafeZone: boolean; lastSeen: number; latitude?: number; longitude?: number }): Promise<boolean> {
    try {
      const currentData = androidWidgetService.getWidgetData();
      if (!currentData) return false;

      const updatedPets = currentData.pets.map(pet => 
        pet.id === petId 
          ? { ...pet, location: { ...pet.location, ...location } }
          : pet
      );

      const updatedData: PetWidgetData = {
        ...currentData,
        pets: updatedPets,
        lastUpdated: Date.now(),
      };

      return await androidWidgetService.updateWidgetData(updatedData);
    } catch (error) {
      console.error('Error updating pet location:', error);
      return false;
    }
  },

  /**
   * Update pet activity
   */
  async updatePetActivity(petId: string, activity: { level?: 'low' | 'normal' | 'high'; stepsToday?: number; lastActivity?: number }): Promise<boolean> {
    try {
      const currentData = androidWidgetService.getWidgetData();
      if (!currentData) return false;

      const updatedPets = currentData.pets.map(pet => 
        pet.id === petId 
          ? { ...pet, activity: { ...pet.activity, ...activity } }
          : pet
      );

      const updatedData: PetWidgetData = {
        ...currentData,
        pets: updatedPets,
        lastUpdated: Date.now(),
      };

      return await androidWidgetService.updateWidgetData(updatedData);
    } catch (error) {
      console.error('Error updating pet activity:', error);
      return false;
    }
  },
};

// React hooks for widget functionality
export const useAndroidWidget = () => {
  const [isSupported, setIsSupported] = React.useState(false);
  const [activeWidgets, setActiveWidgets] = React.useState<number[]>([]);
  const [settings, setSettings] = React.useState<WidgetSettings>(androidWidgetService.getWidgetSettings());
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    checkSupport();
    loadActiveWidgets();
  }, []);

  const checkSupport = async () => {
    try {
      const supported = await androidWidgetService.isWidgetSupported();
      setIsSupported(supported);
    } catch (error) {
      console.error('Error checking widget support:', error);
    }
  };

  const loadActiveWidgets = async () => {
    try {
      setIsLoading(true);
      const widgets = await androidWidgetService.getActiveWidgets();
      setActiveWidgets(widgets);
    } catch (error) {
      console.error('Error loading active widgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<WidgetSettings>) => {
    try {
      setIsLoading(true);
      await androidWidgetService.updateWidgetSettings(newSettings);
      setSettings(androidWidgetService.getWidgetSettings());
    } catch (error) {
      console.error('Error updating widget settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWidgets = async () => {
    try {
      setIsLoading(true);
      await androidWidgetService.refreshWidgets();
      await loadActiveWidgets();
    } catch (error) {
      console.error('Error refreshing widgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    activeWidgets,
    settings,
    isLoading,
    updateSettings,
    refreshWidgets,
    updateWithPetData: TailTrackerWidget.updateWithPetData,
    updateForPet: TailTrackerWidget.updateForPet,
    removePet: TailTrackerWidget.removePet,
    setSelectedPet: TailTrackerWidget.setSelectedPet,
    updatePetLocation: TailTrackerWidget.updatePetLocation,
    updatePetActivity: TailTrackerWidget.updatePetActivity,
  };
};