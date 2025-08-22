import React from 'react';
import { Platform, Alert, AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { androidPermissions } from './AndroidPermissions';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCE_TASK_NAME = 'geofence-task';
const LOCATION_STORAGE_KEY = '@TailTracker:last_location';
const GEOFENCES_STORAGE_KEY = '@TailTracker:geofences';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeofenceRegion {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
}

export interface GeofenceEvent {
  region: GeofenceRegion;
  eventType: 'enter' | 'exit';
  timestamp: number;
  location: LocationData;
}

export interface LocationServiceOptions {
  accuracy?: Location.Accuracy;
  timeInterval?: number; // milliseconds
  distanceInterval?: number; // meters
  enableBackground?: boolean;
  showsBackgroundLocationIndicator?: boolean;
}

export interface LocationServiceConfig {
  accuracy: Location.Accuracy;
  timeInterval: number;
  distanceInterval: number;
  enableBackground: boolean;
  deferredUpdatesInterval?: number;
  mayShowUserSettingsDialog?: boolean;
  foregroundService?: {
    notificationTitle: string;
    notificationBody: string;
    notificationColor?: string;
  };
}

class AndroidLocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private geofences: GeofenceRegion[] = [];
  private locationCallbacks: Set<(location: LocationData) => void> = new Set();
  private geofenceCallbacks: Set<(event: GeofenceEvent) => void> = new Set();
  private appStateSubscription: any = null;

  constructor() {
    this.initializeLocationTasks();
    this.loadGeofences();
    this.setupAppStateHandling();
  }

  /**
   * Initialize background location tasks
   */
  private initializeLocationTasks(): void {
    // Define background location task
    TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: any) => {
      if (error) {
        console.error('Background location task error:', error);
        return;
      }

      if (data) {
        const { locations } = data;
        const location = locations[0];
        
        if (location) {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          };

          // Store last location
          this.storeLastLocation(locationData);
          
          // Notify callbacks
          this.notifyLocationCallbacks(locationData);
          
          // Check geofences
          this.checkGeofences(locationData);
        }
      }
    });

    // Define geofence task
    TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data, error }: any) => {
      if (error) {
        console.error('Geofence task error:', error);
        return;
      }

      if (data) {
        const { eventType, region } = data;
        console.log('Geofence event:', eventType, region);
        
        // Handle geofence events
        this.handleGeofenceEvent(eventType, region);
      }
    });
  }

  /**
   * Setup app state handling
   */
  private setupAppStateHandling(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background' && this.isTracking) {
      // App moved to background, ensure background location is active
      this.ensureBackgroundLocationActive();
    } else if (nextAppState === 'active' && this.isTracking) {
      // App became active, can switch to foreground location updates
      this.ensureForegroundLocationActive();
    }
  }

  /**
   * Check location permissions
   */
  async checkLocationPermissions(): Promise<{
    foreground: boolean;
    background: boolean;
  }> {
    try {
      const foregroundResult = await androidPermissions.checkPermission('location');
      const backgroundResult = await androidPermissions.checkPermission('locationAlways');

      return {
        foreground: foregroundResult.status === 'granted',
        background: backgroundResult.status === 'granted',
      };
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return { foreground: false, background: false };
    }
  }

  /**
   * Request location permissions
   */
  async requestLocationPermissions(includeBackground = false): Promise<{
    foreground: boolean;
    background: boolean;
  }> {
    try {
      // Request foreground permission first
      const foregroundGranted = await androidPermissions.requestPermission({
        type: 'location',
        title: 'Location Permission',
        message: 'TailTracker needs location access to track your pets and help find them if they get lost.',
        buttonPositive: 'Grant Permission',
      });

      let backgroundGranted = false;

      if (foregroundGranted.status === 'granted' && includeBackground) {
        // Request background permission
        const backgroundResult = await androidPermissions.requestPermission({
          type: 'locationAlways',
          title: 'Background Location',
          message: 'TailTracker needs background location access to monitor your pets even when the app is closed. This ensures you get alerts if your pet leaves their safe zone.',
          buttonPositive: 'Allow All The Time',
        });
        
        backgroundGranted = backgroundResult.status === 'granted';
      }

      return {
        foreground: foregroundGranted.status === 'granted',
        background: backgroundGranted,
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return { foreground: false, background: false };
    }
  }

  /**
   * Start location tracking
   */
  async startLocationTracking(options: LocationServiceOptions = {}): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidLocationService is only available on Android');
    }

    try {
      // Check permissions
      const permissions = await this.checkLocationPermissions();
      
      if (!permissions.foreground) {
        const requested = await this.requestLocationPermissions(options.enableBackground);
        if (!requested.foreground) {
          Alert.alert(
            'Permission Required',
            'Location permission is required to track your pets.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Settings', 
                onPress: () => androidPermissions.openSettings() 
              },
            ]
          );
          return false;
        }
      }

      const config: LocationServiceConfig = {
        accuracy: options.accuracy || Location.Accuracy.High,
        timeInterval: options.timeInterval || 10000, // 10 seconds
        distanceInterval: options.distanceInterval || 10, // 10 meters
        enableBackground: options.enableBackground || false,
        deferredUpdatesInterval: 60000, // 1 minute for battery optimization
        mayShowUserSettingsDialog: true,
        foregroundService: {
          notificationTitle: 'TailTracker is monitoring your pets',
          notificationBody: 'Keeping your pets safe with location tracking',
          notificationColor: '#6750A4',
        },
      };

      if (config.enableBackground && permissions.background) {
        // Start background location updates
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: config.accuracy,
          timeInterval: config.timeInterval,
          distanceInterval: config.distanceInterval,
          deferredUpdatesInterval: config.deferredUpdatesInterval,
          showsBackgroundLocationIndicator: options.showsBackgroundLocationIndicator,
          foregroundService: config.foregroundService,
        });
      } else {
        // Start foreground location updates
        this.locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: config.accuracy,
            timeInterval: config.timeInterval,
            distanceInterval: config.distanceInterval,
            mayShowUserSettingsDialog: config.mayShowUserSettingsDialog,
          },
          (location) => {
            const locationData: LocationData = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              altitude: location.coords.altitude,
              accuracy: location.coords.accuracy,
              heading: location.coords.heading,
              speed: location.coords.speed,
              timestamp: location.timestamp,
            };

            this.storeLastLocation(locationData);
            this.notifyLocationCallbacks(locationData);
            this.checkGeofences(locationData);
          }
        );
      }

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking. Please try again.');
      return false;
    }
  }

  /**
   * Stop location tracking
   */
  async stopLocationTracking(): Promise<void> {
    try {
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Stop background location updates
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      this.isTracking = false;
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(options: LocationServiceOptions = {}): Promise<LocationData | null> {
    try {
      const permissions = await this.checkLocationPermissions();
      
      if (!permissions.foreground) {
        const requested = await this.requestLocationPermissions();
        if (!requested.foreground) {
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: options.accuracy || Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };

      await this.storeLastLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get last known location
   */
  async getLastKnownLocation(): Promise<LocationData | null> {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  /**
   * Add geofence region
   */
  async addGeofence(region: GeofenceRegion): Promise<boolean> {
    try {
      const permissions = await this.checkLocationPermissions();
      
      if (!permissions.foreground) {
        console.warn('Location permission required for geofencing');
        return false;
      }

      // Add to local array
      this.geofences.push(region);
      
      // Save to storage
      await this.saveGeofences();
      
      // Start geofencing if not already started
      await this.startGeofencing();
      
      return true;
    } catch (error) {
      console.error('Error adding geofence:', error);
      return false;
    }
  }

  /**
   * Remove geofence region
   */
  async removeGeofence(regionId: string): Promise<boolean> {
    try {
      this.geofences = this.geofences.filter(region => region.id !== regionId);
      await this.saveGeofences();
      
      // Restart geofencing with updated regions
      await this.stopGeofencing();
      if (this.geofences.length > 0) {
        await this.startGeofencing();
      }
      
      return true;
    } catch (error) {
      console.error('Error removing geofence:', error);
      return false;
    }
  }

  /**
   * Get active geofences
   */
  getGeofences(): GeofenceRegion[] {
    return [...this.geofences];
  }

  /**
   * Clear all geofences
   */
  async clearGeofences(): Promise<void> {
    try {
      this.geofences = [];
      await this.saveGeofences();
      await this.stopGeofencing();
    } catch (error) {
      console.error('Error clearing geofences:', error);
    }
  }

  /**
   * Add location update callback
   */
  addLocationCallback(callback: (location: LocationData) => void): () => void {
    this.locationCallbacks.add(callback);
    return () => this.locationCallbacks.delete(callback);
  }

  /**
   * Add geofence event callback
   */
  addGeofenceCallback(callback: (event: GeofenceEvent) => void): () => void {
    this.geofenceCallbacks.add(callback);
    return () => this.geofenceCallbacks.delete(callback);
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Private methods
   */

  private async storeLastLocation(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('Error storing location:', error);
    }
  }

  private async loadGeofences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(GEOFENCES_STORAGE_KEY);
      this.geofences = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading geofences:', error);
      this.geofences = [];
    }
  }

  private async saveGeofences(): Promise<void> {
    try {
      await AsyncStorage.setItem(GEOFENCES_STORAGE_KEY, JSON.stringify(this.geofences));
    } catch (error) {
      console.error('Error saving geofences:', error);
    }
  }

  private async startGeofencing(): Promise<void> {
    try {
      if (this.geofences.length === 0) return;

      const regions = this.geofences.map(geofence => ({
        identifier: geofence.id,
        latitude: geofence.latitude,
        longitude: geofence.longitude,
        radius: geofence.radius,
        notifyOnEntry: geofence.notifyOnEntry ?? true,
        notifyOnExit: geofence.notifyOnExit ?? true,
      }));

      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
    } catch (error) {
      console.error('Error starting geofencing:', error);
    }
  }

  private async stopGeofencing(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
      if (hasStarted) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      }
    } catch (error) {
      console.error('Error stopping geofencing:', error);
    }
  }

  private notifyLocationCallbacks(location: LocationData): void {
    this.locationCallbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  private notifyGeofenceCallbacks(event: GeofenceEvent): void {
    this.geofenceCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in geofence callback:', error);
      }
    });
  }

  private checkGeofences(location: LocationData): void {
    // Manual geofence checking for foreground mode
    // Background mode uses system geofencing
    this.geofences.forEach(geofence => {
      const distance = this.calculateDistance(location, geofence);
      // Additional logic for manual geofence checking would go here
    });
  }

  private handleGeofenceEvent(eventType: string, region: any): void {
    const geofence = this.geofences.find(g => g.id === region.identifier);
    if (!geofence) return;

    this.getCurrentLocation().then(location => {
      if (location) {
        const event: GeofenceEvent = {
          region: geofence,
          eventType: eventType as 'enter' | 'exit',
          timestamp: Date.now(),
          location,
        };

        this.notifyGeofenceCallbacks(event);
      }
    });
  }

  private async ensureBackgroundLocationActive(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (!hasStarted && this.isTracking) {
        await this.startLocationTracking({ enableBackground: true });
      }
    } catch (error) {
      console.error('Error ensuring background location:', error);
    }
  }

  private async ensureForegroundLocationActive(): Promise<void> {
    // Switch back to foreground location if needed
    // Implementation depends on specific requirements
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopLocationTracking();
    this.clearGeofences();
    this.locationCallbacks.clear();
    this.geofenceCallbacks.clear();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

// Export singleton instance
export const androidLocationService = new AndroidLocationService();

// React hooks for location functionality
export const useAndroidLocation = () => {
  const [currentLocation, setCurrentLocation] = React.useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = React.useState(false);
  const [hasPermissions, setHasPermissions] = React.useState({ foreground: false, background: false });
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    checkPermissions();
    loadLastLocation();

    // Add location callback
    const removeLocationCallback = androidLocationService.addLocationCallback(setCurrentLocation);

    return () => {
      removeLocationCallback();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const permissions = await androidLocationService.checkLocationPermissions();
      setHasPermissions(permissions);
    } catch (error) {
      console.error('Error checking location permissions:', error);
    }
  };

  const loadLastLocation = async () => {
    try {
      const lastLocation = await androidLocationService.getLastKnownLocation();
      if (lastLocation) {
        setCurrentLocation(lastLocation);
      }
    } catch (error) {
      console.error('Error loading last location:', error);
    }
  };

  const requestPermissions = async (includeBackground = false) => {
    try {
      setIsLoading(true);
      const permissions = await androidLocationService.requestLocationPermissions(includeBackground);
      setHasPermissions(permissions);
      return permissions;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return { foreground: false, background: false };
    } finally {
      setIsLoading(false);
    }
  };

  const startTracking = async (options?: LocationServiceOptions) => {
    try {
      setIsLoading(true);
      const success = await androidLocationService.startLocationTracking(options);
      setIsTracking(success);
      return success;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = async () => {
    try {
      await androidLocationService.stopLocationTracking();
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const location = await androidLocationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentLocation,
    isTracking,
    hasPermissions,
    isLoading,
    checkPermissions,
    requestPermissions,
    startTracking,
    stopTracking,
    getCurrentLocation,
    addGeofence: androidLocationService.addGeofence.bind(androidLocationService),
    removeGeofence: androidLocationService.removeGeofence.bind(androidLocationService),
    getGeofences: androidLocationService.getGeofences.bind(androidLocationService),
    calculateDistance: androidLocationService.calculateDistance.bind(androidLocationService),
  };
};