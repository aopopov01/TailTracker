import React from 'react';
import { Platform, AppState, AppStateStatus, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const BATTERY_SETTINGS_KEY = '@TailTracker:battery_settings';
const BATTERY_STATS_KEY = '@TailTracker:battery_stats';

export interface BatteryOptimizationSettings {
  adaptiveLocation: boolean;
  reducedAccuracyMode: boolean;
  intelligentTracking: boolean;
  backgroundOptimization: boolean;
  batteryThreshold: number; // Percentage below which optimizations kick in
  locationUpdateInterval: number; // Base interval in seconds
  maxLocationUpdateInterval: number; // Max interval in low battery mode
  useWifiForLocation: boolean;
  disableInLowBattery: boolean;
  dozeOptimization: boolean;
}

export interface BatteryStats {
  currentLevel: number;
  isCharging: boolean;
  batteryOptimizationActive: boolean;
  locationUpdatesCount: number;
  lastOptimizationTime: number;
  energySavedToday: number; // Estimated mAh saved
  averageBatteryDrain: number; // Per hour
}

export interface LocationProfile {
  accuracy: Location.Accuracy;
  interval: number;
  distanceFilter: number;
  enableBackground: boolean;
  description: string;
}

class AndroidBatteryOptimizationService {
  private settings: BatteryOptimizationSettings = {
    adaptiveLocation: true,
    reducedAccuracyMode: true,
    intelligentTracking: true,
    backgroundOptimization: true,
    batteryThreshold: 30,
    locationUpdateInterval: 30, // 30 seconds default
    maxLocationUpdateInterval: 300, // 5 minutes max
    useWifiForLocation: true,
    disableInLowBattery: false,
    dozeOptimization: true,
  };

  private batteryStats: BatteryStats = {
    currentLevel: 100,
    isCharging: false,
    batteryOptimizationActive: false,
    locationUpdatesCount: 0,
    lastOptimizationTime: 0,
    energySavedToday: 0,
    averageBatteryDrain: 0,
  };

  private currentProfile: LocationProfile | null = null;
  private appState: AppStateStatus = 'active';
  private isDozeMode = false;
  private batteryCallbacks: Set<(stats: BatteryStats) => void> = new Set();
  private optimizationCallbacks: Set<(profile: LocationProfile) => void> = new Set();

  // Predefined location profiles for different battery scenarios
  private locationProfiles: Record<string, LocationProfile> = {
    high_accuracy: {
      accuracy: Location.Accuracy.BestForNavigation,
      interval: 10,
      distanceFilter: 5,
      enableBackground: true,
      description: 'High accuracy for critical tracking',
    },
    balanced: {
      accuracy: Location.Accuracy.High,
      interval: 30,
      distanceFilter: 10,
      enableBackground: true,
      description: 'Balanced accuracy and battery usage',
    },
    battery_saver: {
      accuracy: Location.Accuracy.Balanced,
      interval: 120,
      distanceFilter: 50,
      enableBackground: true,
      description: 'Optimized for battery life',
    },
    low_battery: {
      accuracy: Location.Accuracy.Low,
      interval: 300,
      distanceFilter: 100,
      enableBackground: false,
      description: 'Minimal tracking for low battery',
    },
    emergency_only: {
      accuracy: Location.Accuracy.Lowest,
      interval: 600,
      distanceFilter: 200,
      enableBackground: false,
      description: 'Emergency tracking only',
    },
  };

  constructor() {
    this.initializeBatteryOptimization();
  }

  /**
   * Initialize battery optimization service
   */
  private async initializeBatteryOptimization(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('Android Battery Optimization is only available on Android');
      return;
    }

    try {
      await this.loadSettings();
      await this.loadBatteryStats();
      await this.setupBatteryMonitoring();
      await this.setupAppStateHandling();
      await this.updateCurrentProfile();
      
      console.log('Android Battery Optimization initialized');
    } catch (error) {
      console.error('Error initializing battery optimization:', error);
    }
  }

  /**
   * Get current battery level (mock implementation)
   */
  async getBatteryLevel(): Promise<number> {
    try {
      // Mock implementation - would use native battery API
      return this.batteryStats.currentLevel;
    } catch (error) {
      console.error('Error getting battery level:', error);
      return 100;
    }
  }

  /**
   * Check if device is charging
   */
  async isCharging(): Promise<boolean> {
    try {
      // Mock implementation - would use native battery API
      return this.batteryStats.isCharging;
    } catch (error) {
      console.error('Error checking charging status:', error);
      return false;
    }
  }

  /**
   * Get optimal location profile based on current conditions
   */
  async getOptimalLocationProfile(): Promise<LocationProfile> {
    try {
      const batteryLevel = await this.getBatteryLevel();
      const isCharging = await this.isCharging();
      const isBackground = this.appState !== 'active';

      // If charging, use high accuracy
      if (isCharging) {
        return this.locationProfiles.high_accuracy;
      }

      // Check battery thresholds
      if (batteryLevel <= 10) {
        return this.locationProfiles.emergency_only;
      } else if (batteryLevel <= this.settings.batteryThreshold) {
        if (this.settings.disableInLowBattery) {
          return this.locationProfiles.emergency_only;
        } else {
          return this.locationProfiles.low_battery;
        }
      } else if (batteryLevel <= 50) {
        return this.locationProfiles.battery_saver;
      }

      // Background vs foreground optimization
      if (isBackground && this.settings.backgroundOptimization) {
        return this.locationProfiles.battery_saver;
      }

      // Default balanced profile
      return this.locationProfiles.balanced;
    } catch (error) {
      console.error('Error getting optimal location profile:', error);
      return this.locationProfiles.balanced;
    }
  }

  /**
   * Apply battery optimization to location settings
   */
  async optimizeLocationSettings(): Promise<LocationProfile> {
    try {
      if (!this.settings.adaptiveLocation) {
        return this.currentProfile || this.locationProfiles.balanced;
      }

      const optimalProfile = await this.getOptimalLocationProfile();
      
      // Only update if profile changed significantly
      if (!this.currentProfile || this.shouldUpdateProfile(this.currentProfile, optimalProfile)) {
        this.currentProfile = optimalProfile;
        this.batteryStats.lastOptimizationTime = Date.now();
        this.batteryStats.batteryOptimizationActive = true;
        
        // Calculate energy savings
        await this.calculateEnergySavings(optimalProfile);
        
        // Notify callbacks
        this.notifyOptimizationCallbacks(optimalProfile);
        
        // Save stats
        await this.saveBatteryStats();
        
        console.log(`Applied battery optimization: ${optimalProfile.description}`);
      }

      return optimalProfile;
    } catch (error) {
      console.error('Error optimizing location settings:', error);
      return this.currentProfile || this.locationProfiles.balanced;
    }
  }

  /**
   * Get intelligent tracking interval based on movement patterns
   */
  async getIntelligentTrackingInterval(): Promise<number> {
    try {
      if (!this.settings.intelligentTracking) {
        return this.settings.locationUpdateInterval;
      }

      // Mock implementation - would analyze movement patterns
      const baseInterval = this.settings.locationUpdateInterval;
      const batteryLevel = await this.getBatteryLevel();
      const isStationary = await this.detectStationaryMode();
      
      let multiplier = 1;

      // Increase interval if stationary
      if (isStationary) {
        multiplier *= 3;
      }

      // Increase interval based on battery level
      if (batteryLevel < 20) {
        multiplier *= 4;
      } else if (batteryLevel < 50) {
        multiplier *= 2;
      }

      // Apply doze mode optimization
      if (this.isDozeMode && this.settings.dozeOptimization) {
        multiplier *= 5;
      }

      const optimizedInterval = Math.min(
        baseInterval * multiplier,
        this.settings.maxLocationUpdateInterval
      );

      return optimizedInterval;
    } catch (error) {
      console.error('Error calculating intelligent tracking interval:', error);
      return this.settings.locationUpdateInterval;
    }
  }

  /**
   * Enable aggressive battery saving mode
   */
  async enableAggressiveBatterySaving(): Promise<void> {
    try {
      const aggressiveSettings: Partial<BatteryOptimizationSettings> = {
        adaptiveLocation: true,
        reducedAccuracyMode: true,
        backgroundOptimization: true,
        batteryThreshold: 50,
        locationUpdateInterval: 120,
        maxLocationUpdateInterval: 600,
        disableInLowBattery: true,
        dozeOptimization: true,
      };

      await this.updateSettings(aggressiveSettings);
      await this.optimizeLocationSettings();
      
      console.log('Aggressive battery saving mode enabled');
    } catch (error) {
      console.error('Error enabling aggressive battery saving:', error);
    }
  }

  /**
   * Disable battery optimizations
   */
  async disableBatteryOptimizations(): Promise<void> {
    try {
      const settings: Partial<BatteryOptimizationSettings> = {
        adaptiveLocation: false,
        reducedAccuracyMode: false,
        backgroundOptimization: false,
        disableInLowBattery: false,
      };

      await this.updateSettings(settings);
      
      // Reset to high accuracy profile
      this.currentProfile = this.locationProfiles.high_accuracy;
      this.batteryStats.batteryOptimizationActive = false;
      
      await this.saveBatteryStats();
      
      console.log('Battery optimizations disabled');
    } catch (error) {
      console.error('Error disabling battery optimizations:', error);
    }
  }

  /**
   * Get battery optimization settings
   */
  getSettings(): BatteryOptimizationSettings {
    return { ...this.settings };
  }

  /**
   * Update battery optimization settings
   */
  async updateSettings(newSettings: Partial<BatteryOptimizationSettings>): Promise<void> {
    try {
      this.settings = {
        ...this.settings,
        ...newSettings,
      };

      await this.saveSettings();
      await this.updateCurrentProfile();
    } catch (error) {
      console.error('Error updating battery optimization settings:', error);
    }
  }

  /**
   * Get current battery statistics
   */
  getBatteryStats(): BatteryStats {
    return { ...this.batteryStats };
  }

  /**
   * Reset battery statistics
   */
  async resetBatteryStats(): Promise<void> {
    try {
      this.batteryStats = {
        ...this.batteryStats,
        locationUpdatesCount: 0,
        lastOptimizationTime: 0,
        energySavedToday: 0,
        averageBatteryDrain: 0,
      };

      await this.saveBatteryStats();
    } catch (error) {
      console.error('Error resetting battery stats:', error);
    }
  }

  /**
   * Add battery status callback
   */
  addBatteryCallback(callback: (stats: BatteryStats) => void): () => void {
    this.batteryCallbacks.add(callback);
    return () => this.batteryCallbacks.delete(callback);
  }

  /**
   * Add optimization callback
   */
  addOptimizationCallback(callback: (profile: LocationProfile) => void): () => void {
    this.optimizationCallbacks.add(callback);
    return () => this.optimizationCallbacks.delete(callback);
  }

  /**
   * Private methods
   */

  private async setupBatteryMonitoring(): Promise<void> {
    try {
      // Mock battery monitoring setup
      // In real implementation, would use native battery events
      
      // Simulate battery level changes
      setInterval(async () => {
        await this.updateBatteryStats();
      }, 60000); // Check every minute
      
    } catch (error) {
      console.error('Error setting up battery monitoring:', error);
    }
  }

  private async setupAppStateHandling(): Promise<void> {
    try {
      AppState.addEventListener('change', this.handleAppStateChange.bind(this));
      
      // Listen for doze mode changes (mock implementation)
      DeviceEventEmitter.addListener('dozeMode', (isDoze: boolean) => {
        this.isDozeMode = isDoze;
        this.optimizeLocationSettings();
      });
    } catch (error) {
      console.error('Error setting up app state handling:', error);
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const previousState = this.appState;
    this.appState = nextAppState;

    // Optimize when app goes to background
    if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
      this.optimizeLocationSettings();
    }
    
    // Restore when app becomes active (if charging or good battery)
    if (nextAppState === 'active' && previousState.match(/inactive|background/)) {
      this.optimizeLocationSettings();
    }
  }

  private async updateBatteryStats(): Promise<void> {
    try {
      // Mock battery updates
      const currentLevel = await this.getBatteryLevel();
      const isCharging = await this.isCharging();
      
      // Simulate battery drain
      if (!isCharging && this.batteryStats.currentLevel > 0) {
        this.batteryStats.currentLevel = Math.max(0, this.batteryStats.currentLevel - 0.5);
      } else if (isCharging && this.batteryStats.currentLevel < 100) {
        this.batteryStats.currentLevel = Math.min(100, this.batteryStats.currentLevel + 1);
      }

      this.batteryStats.isCharging = isCharging;
      
      // Check if optimization should be triggered
      if (currentLevel <= this.settings.batteryThreshold && !this.batteryStats.batteryOptimizationActive) {
        await this.optimizeLocationSettings();
      }

      // Notify callbacks
      this.notifyBatteryCallbacks();
      
      // Save stats periodically
      await this.saveBatteryStats();
    } catch (error) {
      console.error('Error updating battery stats:', error);
    }
  }

  private async updateCurrentProfile(): Promise<void> {
    try {
      const optimalProfile = await this.getOptimalLocationProfile();
      this.currentProfile = optimalProfile;
    } catch (error) {
      console.error('Error updating current profile:', error);
    }
  }

  private shouldUpdateProfile(current: LocationProfile, optimal: LocationProfile): boolean {
    // Check if significant changes in accuracy or interval
    const accuracyChanged = current.accuracy !== optimal.accuracy;
    const intervalChanged = Math.abs(current.interval - optimal.interval) > 10;
    const backgroundChanged = current.enableBackground !== optimal.enableBackground;
    
    return accuracyChanged || intervalChanged || backgroundChanged;
  }

  private async detectStationaryMode(): Promise<boolean> {
    try {
      // Mock implementation - would analyze recent location data
      // Returns true if device hasn't moved significantly in the last 15 minutes
      return false; // Simplified for mock
    } catch (error) {
      console.error('Error detecting stationary mode:', error);
      return false;
    }
  }

  private async calculateEnergySavings(profile: LocationProfile): Promise<void> {
    try {
      // Calculate estimated energy savings compared to high accuracy mode
      const baseProfile = this.locationProfiles.high_accuracy;
      
      // Simplified calculation based on interval differences
      const intervalSavings = (profile.interval - baseProfile.interval) / baseProfile.interval;
      const accuracySavings = profile.accuracy < baseProfile.accuracy ? 0.3 : 0;
      
      const totalSavings = (intervalSavings + accuracySavings) * 0.5; // Estimated 0.5 mAh base consumption
      
      this.batteryStats.energySavedToday += totalSavings;
    } catch (error) {
      console.error('Error calculating energy savings:', error);
    }
  }

  private notifyBatteryCallbacks(): void {
    this.batteryCallbacks.forEach(callback => {
      try {
        callback(this.batteryStats);
      } catch (error) {
        console.error('Error in battery callback:', error);
      }
    });
  }

  private notifyOptimizationCallbacks(profile: LocationProfile): void {
    this.optimizationCallbacks.forEach(callback => {
      try {
        callback(profile);
      } catch (error) {
        console.error('Error in optimization callback:', error);
      }
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(BATTERY_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading battery settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(BATTERY_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving battery settings:', error);
    }
  }

  private async loadBatteryStats(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(BATTERY_STATS_KEY);
      if (stored) {
        this.batteryStats = { ...this.batteryStats, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading battery stats:', error);
    }
  }

  private async saveBatteryStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(BATTERY_STATS_KEY, JSON.stringify(this.batteryStats));
    } catch (error) {
      console.error('Error saving battery stats:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.batteryCallbacks.clear();
    this.optimizationCallbacks.clear();
    AppState.removeEventListener('change', this.handleAppStateChange.bind(this));
    DeviceEventEmitter.removeAllListeners('dozeMode');
  }
}

// Export singleton instance
export const androidBatteryOptimization = new AndroidBatteryOptimizationService();

// TailTracker-specific battery optimization helpers
export const TailTrackerBatteryOptimization = {
  /**
   * Optimize for pet tracking scenarios
   */
  async optimizeForPetTracking(isEmergency: boolean = false): Promise<LocationProfile> {
    if (isEmergency) {
      // Emergency mode - use high accuracy regardless of battery
      return await androidBatteryOptimization.getOptimalLocationProfile();
    } else {
      // Normal tracking - apply battery optimizations
      return await androidBatteryOptimization.optimizeLocationSettings();
    }
  },

  /**
   * Get battery-optimized update interval for pet tracking
   */
  async getPetTrackingInterval(): Promise<number> {
    return await androidBatteryOptimization.getIntelligentTrackingInterval();
  },

  /**
   * Check if we should reduce tracking due to battery
   */
  async shouldReduceTracking(): Promise<boolean> {
    const stats = androidBatteryOptimization.getBatteryStats();
    const settings = androidBatteryOptimization.getSettings();
    
    return stats.currentLevel <= settings.batteryThreshold && 
           !stats.isCharging && 
           settings.adaptiveLocation;
  },

  /**
   * Get recommended tracking mode based on battery and pet urgency
   */
  async getRecommendedTrackingMode(petUrgency: 'low' | 'normal' | 'high' | 'emergency'): Promise<string> {
    const stats = androidBatteryOptimization.getBatteryStats();
    
    if (petUrgency === 'emergency') {
      return 'high_accuracy';
    }
    
    if (stats.isCharging) {
      return petUrgency === 'high' ? 'high_accuracy' : 'balanced';
    }
    
    if (stats.currentLevel < 15) {
      return 'emergency_only';
    } else if (stats.currentLevel < 30) {
      return petUrgency === 'high' ? 'battery_saver' : 'low_battery';
    } else {
      return 'balanced';
    }
  },

  /**
   * Enable pet emergency tracking (ignore battery optimizations)
   */
  async enableEmergencyTracking(): Promise<void> {
    await androidBatteryOptimization.disableBatteryOptimizations();
    console.log('Emergency tracking enabled - battery optimizations disabled');
  },

  /**
   * Resume normal battery-optimized tracking
   */
  async resumeNormalTracking(): Promise<void> {
    const defaultSettings: Partial<BatteryOptimizationSettings> = {
      adaptiveLocation: true,
      reducedAccuracyMode: true,
      backgroundOptimization: true,
      batteryThreshold: 30,
    };
    
    await androidBatteryOptimization.updateSettings(defaultSettings);
    await androidBatteryOptimization.optimizeLocationSettings();
    console.log('Normal battery-optimized tracking resumed');
  },
};

// React hooks for battery optimization
export const useAndroidBatteryOptimization = () => {
  const [batteryStats, setBatteryStats] = React.useState<BatteryStats>(
    androidBatteryOptimization.getBatteryStats()
  );
  const [currentProfile, setCurrentProfile] = React.useState<LocationProfile | null>(null);
  const [settings, setSettings] = React.useState<BatteryOptimizationSettings>(
    androidBatteryOptimization.getSettings()
  );
  const [isOptimizing, setIsOptimizing] = React.useState(false);

  React.useEffect(() => {
    // Add battery status callback
    const removeBatteryCallback = androidBatteryOptimization.addBatteryCallback(setBatteryStats);
    
    // Add optimization callback
    const removeOptimizationCallback = androidBatteryOptimization.addOptimizationCallback(setCurrentProfile);

    return () => {
      removeBatteryCallback();
      removeOptimizationCallback();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<BatteryOptimizationSettings>) => {
    try {
      setIsOptimizing(true);
      await androidBatteryOptimization.updateSettings(newSettings);
      setSettings(androidBatteryOptimization.getSettings());
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizeLocation = async () => {
    try {
      setIsOptimizing(true);
      const profile = await androidBatteryOptimization.optimizeLocationSettings();
      setCurrentProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error optimizing location:', error);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  };

  const enableAggressiveSaving = async () => {
    try {
      setIsOptimizing(true);
      await androidBatteryOptimization.enableAggressiveBatterySaving();
      setSettings(androidBatteryOptimization.getSettings());
    } catch (error) {
      console.error('Error enabling aggressive saving:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const disableOptimizations = async () => {
    try {
      setIsOptimizing(true);
      await androidBatteryOptimization.disableBatteryOptimizations();
      setSettings(androidBatteryOptimization.getSettings());
    } catch (error) {
      console.error('Error disabling optimizations:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    batteryStats,
    currentProfile,
    settings,
    isOptimizing,
    updateSettings,
    optimizeLocation,
    enableAggressiveSaving,
    disableOptimizations,
    resetStats: androidBatteryOptimization.resetBatteryStats.bind(androidBatteryOptimization),
    getIntelligentInterval: androidBatteryOptimization.getIntelligentTrackingInterval.bind(androidBatteryOptimization),
    // TailTracker-specific helpers
    optimizeForPetTracking: TailTrackerBatteryOptimization.optimizeForPetTracking,
    getPetTrackingInterval: TailTrackerBatteryOptimization.getPetTrackingInterval,
    shouldReduceTracking: TailTrackerBatteryOptimization.shouldReduceTracking,
    getRecommendedTrackingMode: TailTrackerBatteryOptimization.getRecommendedTrackingMode,
    enableEmergencyTracking: TailTrackerBatteryOptimization.enableEmergencyTracking,
    resumeNormalTracking: TailTrackerBatteryOptimization.resumeNormalTracking,
  };
};