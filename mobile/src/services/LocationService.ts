import { Platform } from 'react-native';
import { MapLocation, GeofenceRegion } from './GoogleMapsService';

// Location accuracy levels
export type LocationAccuracy = 'low' | 'balanced' | 'high' | 'passive';

// Location update options
export interface LocationOptions {
  accuracy: LocationAccuracy;
  distanceFilter: number; // minimum distance (in meters) to update
  timeInterval: number; // minimum time (in ms) between updates
  enableHighAccuracy: boolean;
  timeout: number; // timeout for location request
  maximumAge: number; // maximum age of cached location
}

// Location data
export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number; // accuracy in meters
  speed?: number; // speed in m/s
  heading?: number; // heading in degrees
  timestamp: number;
  provider?: 'gps' | 'network' | 'passive' | 'fused';
}

// Geofence event
export interface GeofenceEvent {
  id: string;
  type: 'enter' | 'exit';
  location: LocationData;
  geofence: GeofenceRegion;
  timestamp: number;
}

// Location error types
export type LocationError = 
  | 'permission_denied'
  | 'location_disabled'
  | 'network_error'
  | 'timeout'
  | 'accuracy_insufficient'
  | 'unknown';

class LocationService {
  private isTracking = false;
  private watchId: number | null = null;
  private geofences: Map<string, GeofenceRegion> = new Map();
  private locationCallbacks: Set<(location: LocationData) => void> = new Set();
  private geofenceCallbacks: Set<(event: GeofenceEvent) => void> = new Set();
  private lastKnownLocation: LocationData | null = null;

  /**
   * Get current position
   */
  async getCurrentPosition(options?: Partial<LocationOptions>): Promise<LocationData> {
    const defaultOptions: LocationOptions = {
      accuracy: 'high',
      distanceFilter: 0,
      timeInterval: 0,
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000, // 5 minutes
    };

    const locationOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: position.timestamp,
            provider: this.determineProvider(position.coords.accuracy),
          };
          
          this.lastKnownLocation = location;
          resolve(location);
        },
        (error) => {
          const locationError = this.mapLocationError(error);
          reject(new Error(locationError));
        },
        {
          enableHighAccuracy: locationOptions.enableHighAccuracy,
          timeout: locationOptions.timeout,
          maximumAge: locationOptions.maximumAge,
        }
      );
    });
  }

  /**
   * Start location tracking
   */
  async startLocationTracking(options?: Partial<LocationOptions>): Promise<void> {
    if (this.isTracking) {
      console.warn('Location tracking is already active');
      return;
    }

    const defaultOptions: LocationOptions = {
      accuracy: 'high',
      distanceFilter: 10, // 10 meters
      timeInterval: 5000, // 5 seconds
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000, // 30 seconds
    };

    const locationOptions = { ...defaultOptions, ...options };

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    return new Promise((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: position.timestamp,
            provider: this.determineProvider(position.coords.accuracy),
          };

          // Check distance filter
          if (this.lastKnownLocation) {
            const distance = this.calculateDistance(
              this.lastKnownLocation,
              location
            );
            if (distance < locationOptions.distanceFilter) {
              return; // Skip this update
            }
          }

          this.lastKnownLocation = location;
          this.notifyLocationCallbacks(location);
          this.checkGeofences(location);
          
          if (!this.isTracking) {
            this.isTracking = true;
            resolve();
          }
        },
        (error) => {
          const locationError = this.mapLocationError(error);
          if (!this.isTracking) {
            reject(new Error(locationError));
          } else {
            console.error('Location tracking error:', locationError);
          }
        },
        {
          enableHighAccuracy: locationOptions.enableHighAccuracy,
          timeout: locationOptions.timeout,
          maximumAge: locationOptions.maximumAge,
        }
      );
    });
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    if (!this.isTracking) {
      return;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Add location callback
   */
  addLocationCallback(callback: (location: LocationData) => void): void {
    this.locationCallbacks.add(callback);
  }

  /**
   * Remove location callback
   */
  removeLocationCallback(callback: (location: LocationData) => void): void {
    this.locationCallbacks.delete(callback);
  }

  /**
   * Add geofence
   */
  addGeofence(geofence: GeofenceRegion): void {
    this.geofences.set(geofence.id, geofence);
    console.log(`Added geofence: ${geofence.id}`);
  }

  /**
   * Remove geofence
   */
  removeGeofence(geofenceId: string): boolean {
    const removed = this.geofences.delete(geofenceId);
    if (removed) {
      console.log(`Removed geofence: ${geofenceId}`);
    }
    return removed;
  }

  /**
   * Get all geofences
   */
  getGeofences(): GeofenceRegion[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Add geofence callback
   */
  addGeofenceCallback(callback: (event: GeofenceEvent) => void): void {
    this.geofenceCallbacks.add(callback);
  }

  /**
   * Remove geofence callback
   */
  removeGeofenceCallback(callback: (event: GeofenceEvent) => void): void {
    this.geofenceCallbacks.delete(callback);
  }

  /**
   * Check if location is within any geofences
   */
  private checkGeofences(location: LocationData): void {
    for (const geofence of this.geofences.values()) {
      const distance = this.calculateDistance(
        location,
        geofence.center
      );

      const isInside = distance <= geofence.radius;
      const wasInside = this.wasLocationInGeofence(geofence.id);

      if (isInside && !wasInside) {
        // Entered geofence
        const event: GeofenceEvent = {
          id: geofence.id,
          type: 'enter',
          location,
          geofence,
          timestamp: Date.now(),
        };
        this.notifyGeofenceCallbacks(event);
        this.updateGeofenceState(geofence.id, true);
      } else if (!isInside && wasInside) {
        // Exited geofence
        const event: GeofenceEvent = {
          id: geofence.id,
          type: 'exit',
          location,
          geofence,
          timestamp: Date.now(),
        };
        this.notifyGeofenceCallbacks(event);
        this.updateGeofenceState(geofence.id, false);
      }
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: MapLocation, point2: MapLocation): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Determine location provider based on accuracy
   */
  private determineProvider(accuracy: number): LocationData['provider'] {
    if (accuracy <= 10) return 'gps';
    if (accuracy <= 100) return 'fused';
    if (accuracy <= 1000) return 'network';
    return 'passive';
  }

  /**
   * Map native location errors to our error types
   */
  private mapLocationError(error: GeolocationPositionError): LocationError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'permission_denied';
      case error.POSITION_UNAVAILABLE:
        return 'location_disabled';
      case error.TIMEOUT:
        return 'timeout';
      default:
        return 'unknown';
    }
  }

  /**
   * Notify location callbacks
   */
  private notifyLocationCallbacks(location: LocationData): void {
    this.locationCallbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  /**
   * Notify geofence callbacks
   */
  private notifyGeofenceCallbacks(event: GeofenceEvent): void {
    this.geofenceCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in geofence callback:', error);
      }
    });
  }

  // Geofence state management (simple in-memory for now)
  private geofenceStates: Map<string, boolean> = new Map();

  private wasLocationInGeofence(geofenceId: string): boolean {
    return this.geofenceStates.get(geofenceId) || false;
  }

  private updateGeofenceState(geofenceId: string, isInside: boolean): void {
    this.geofenceStates.set(geofenceId, isInside);
  }

  /**
   * Get tracking status
   */
  isLocationTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopLocationTracking();
    this.locationCallbacks.clear();
    this.geofenceCallbacks.clear();
    this.geofences.clear();
    this.geofenceStates.clear();
    this.lastKnownLocation = null;
  }
}

// Export singleton instance
export const locationService = new LocationService();

// TailTracker-specific location helpers
export const TailTrackerLocationHelpers = {
  /**
   * Start pet tracking with optimal settings
   */
  async startPetTracking(): Promise<void> {
    const options: Partial<LocationOptions> = {
      accuracy: 'high',
      distanceFilter: 5, // 5 meters for precise pet tracking
      timeInterval: 10000, // 10 seconds
      enableHighAccuracy: true,
      timeout: 20000, // 20 seconds timeout
      maximumAge: 60000, // 1 minute max age
    };

    return locationService.startLocationTracking(options);
  },

  /**
   * Create safe zone geofence
   */
  createSafeZone(
    id: string,
    name: string,
    center: MapLocation,
    radius: number
  ): GeofenceRegion {
    const geofence: GeofenceRegion = {
      id,
      center,
      radius,
      title: name,
      description: `Safe zone: ${name}`,
    };

    locationService.addGeofence(geofence);
    return geofence;
  },

  /**
   * Setup pet safety monitoring
   */
  setupPetSafetyMonitoring(
    onLocationUpdate: (location: LocationData) => void,
    onGeofenceEvent: (event: GeofenceEvent) => void
  ): void {
    locationService.addLocationCallback(onLocationUpdate);
    locationService.addGeofenceCallback(onGeofenceEvent);
  },

  /**
   * Get location accuracy description
   */
  getAccuracyDescription(accuracy: number): string {
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    if (accuracy <= 20) return 'Fair';
    if (accuracy <= 50) return 'Poor';
    return 'Very Poor';
  },

  /**
   * Format location for display
   */
  formatLocation(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  },

  /**
   * Calculate speed in km/h
   */
  getSpeedKmh(location: LocationData): number {
    return (location.speed || 0) * 3.6; // Convert m/s to km/h
  },

  /**
   * Check if location is recent
   */
  isLocationRecent(location: LocationData, maxAge: number = 300000): boolean {
    return (Date.now() - location.timestamp) <= maxAge;
  },

  /**
   * Get location age in minutes
   */
  getLocationAge(location: LocationData): number {
    return Math.floor((Date.now() - location.timestamp) / 60000);
  },
};