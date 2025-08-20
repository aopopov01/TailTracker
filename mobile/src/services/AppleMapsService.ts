import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapLocation {
  coordinates: Coordinates;
  title?: string;
  subtitle?: string;
}

export interface AppleMapsOptions {
  directionsMode?: 'driving' | 'walking' | 'transit';
  mapType?: 'standard' | 'satellite' | 'hybrid';
  showTraffic?: boolean;
  center?: Coordinates;
  span?: {
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export class AppleMapsService {
  /**
   * Check if Apple Maps is available on the device
   */
  static isAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  /**
   * Open a location in Apple Maps
   */
  static async openLocation(
    location: MapLocation,
    options: AppleMapsOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Apple Maps is only available on iOS');
      return false;
    }

    try {
      const { coordinates, title } = location;
      const { latitude, longitude } = coordinates;

      let url = `maps://maps.apple.com/?`;
      const params = new URLSearchParams();

      // Add coordinates
      params.append('ll', `${latitude},${longitude}`);

      // Add location name if provided
      if (title) {
        params.append('q', title);
      }

      // Add map type
      if (options.mapType) {
        switch (options.mapType) {
          case 'satellite':
            params.append('t', 's');
            break;
          case 'hybrid':
            params.append('t', 'h');
            break;
          default:
            params.append('t', 'm');
            break;
        }
      }

      // Add span for zoom level
      if (options.span) {
        params.append(
          'spn',
          `${options.span.latitudeDelta},${options.span.longitudeDelta}`
        );
      }

      url += params.toString();

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error opening Apple Maps:', error);
      return false;
    }
  }

  /**
   * Open directions in Apple Maps
   */
  static async openDirections(
    from: Coordinates | null,
    to: Coordinates,
    options: AppleMapsOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Apple Maps is only available on iOS');
      return false;
    }

    try {
      let url = `maps://maps.apple.com/?`;
      const params = new URLSearchParams();

      // Source location
      if (from) {
        params.append('sll', `${from.latitude},${from.longitude}`);
      }

      // Destination location
      params.append('dll', `${to.latitude},${to.longitude}`);

      // Directions mode
      switch (options.directionsMode) {
        case 'walking':
          params.append('dirflg', 'w');
          break;
        case 'transit':
          params.append('dirflg', 'r');
          break;
        default:
          params.append('dirflg', 'd');
          break;
      }

      url += params.toString();

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error opening Apple Maps directions:', error);
      return false;
    }
  }

  /**
   * Search for places in Apple Maps
   */
  static async searchPlaces(
    query: string,
    near?: Coordinates,
    options: AppleMapsOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Apple Maps is only available on iOS');
      return false;
    }

    try {
      let url = `maps://maps.apple.com/?`;
      const params = new URLSearchParams();

      // Search query
      params.append('q', query);

      // Search near location
      if (near) {
        params.append('sll', `${near.latitude},${near.longitude}`);
      }

      url += params.toString();

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error searching Apple Maps:', error);
      return false;
    }
  }

  /**
   * Open Apple Maps with multiple pins
   */
  static async openWithPins(
    locations: MapLocation[],
    options: AppleMapsOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Apple Maps is only available on iOS');
      return false;
    }

    if (locations.length === 0) {
      return false;
    }

    try {
      // For multiple locations, we'll open the first one and let the user search for others
      const firstLocation = locations[0];
      return await this.openLocation(firstLocation, options);
    } catch (error) {
      console.error('Error opening Apple Maps with pins:', error);
      return false;
    }
  }

  /**
   * Get current user location for Apple Maps integration
   */
  static async getCurrentLocation(): Promise<Coordinates | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Format coordinates for Apple Maps URL
   */
  static formatCoordinates(coordinates: Coordinates): string {
    return `${coordinates.latitude},${coordinates.longitude}`;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) *
        Math.cos(this.toRadians(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get Apple Maps URL scheme for custom integration
   */
  static getUrlScheme(): string {
    return 'maps://';
  }

  /**
   * Check if Apple Maps app is installed
   */
  static async isAppInstalled(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await Linking.canOpenURL(this.getUrlScheme());
    } catch (error) {
      console.error('Error checking Apple Maps installation:', error);
      return false;
    }
  }
}