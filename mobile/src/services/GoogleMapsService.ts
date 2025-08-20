import { Platform } from 'react-native';

// Types for Google Maps
export interface MapLocation {
  latitude: number;
  longitude: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id: string;
  coordinate: MapLocation;
  title: string;
  description?: string;
  type: 'pet' | 'safe_zone' | 'alert' | 'service' | 'user';
  data?: any;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  location: MapLocation;
  types: string[];
  rating?: number;
  photos?: string[];
}

export interface GeofenceRegion {
  id: string;
  center: MapLocation;
  radius: number; // in meters
  title: string;
  description?: string;
}

export interface DirectionsResult {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  steps: DirectionStep[];
  polyline: string;
}

export interface DirectionStep {
  instruction: string;
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  startLocation: MapLocation;
  endLocation: MapLocation;
}

class GoogleMapsService {
  private apiKey: string = '';
  private isInitialized = false;

  /**
   * Initialize Google Maps service
   */
  initialize(apiKey: string): void {
    this.apiKey = apiKey;
    this.isInitialized = true;
    console.log('Google Maps service initialized');
  }

  /**
   * Check if service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('Google Maps service not initialized. Call initialize() first.');
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(point1: MapLocation, point2: MapLocation): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate bearing between two points
   */
  calculateBearing(point1: MapLocation, point2: MapLocation): number {
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360; // Bearing in degrees
  }

  /**
   * Create map region from center point and radius
   */
  createMapRegion(center: MapLocation, radiusInMeters: number): MapRegion {
    const aspectRatio = 1; // Assume square region
    const oneDegreeOfLongitudeInMeters = 111.32 * 1000;
    const angularDistance = radiusInMeters / oneDegreeOfLongitudeInMeters;

    const latitudeDelta = angularDistance;
    const longitudeDelta = angularDistance / Math.cos(center.latitude * (Math.PI / 180));

    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: latitudeDelta * 2.5, // Add padding
      longitudeDelta: longitudeDelta * 2.5,
    };
  }

  /**
   * Check if point is within geofence
   */
  isPointInGeofence(point: MapLocation, geofence: GeofenceRegion): boolean {
    const distance = this.calculateDistance(point, geofence.center);
    return distance <= geofence.radius;
  }

  /**
   * Search for places nearby
   */
  async searchNearbyPlaces(
    location: MapLocation,
    radius: number = 5000,
    type: string = 'veterinary_care'
  ): Promise<PlaceSearchResult[]> {
    this.ensureInitialized();

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${location.latitude},${location.longitude}` +
        `&radius=${radius}` +
        `&type=${type}` +
        `&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results.map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        types: place.types,
        rating: place.rating,
        photos: place.photos?.map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?` +
          `maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
        ),
      }));
    } catch (error) {
      console.error('Error searching nearby places:', error);
      throw error;
    }
  }

  /**
   * Search for places by text query
   */
  async searchPlaces(query: string, location?: MapLocation): Promise<PlaceSearchResult[]> {
    this.ensureInitialized();

    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=${encodeURIComponent(query)}` +
        `&key=${this.apiKey}`;

      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=50000`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results.map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        types: place.types,
        rating: place.rating,
        photos: place.photos?.map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?` +
          `maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
        ),
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: MapLocation,
    destination: MapLocation,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'walking'
  ): Promise<DirectionsResult> {
    this.ensureInitialized();

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destination.latitude},${destination.longitude}` +
        `&mode=${mode}` +
        `&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Directions API error: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance,
          duration: step.duration,
          startLocation: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
          endLocation: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          },
        })),
        polyline: route.overview_polyline.points,
      };
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  /**
   * Reverse geocoding - get address from coordinates
   */
  async reverseGeocode(location: MapLocation): Promise<string> {
    this.ensureInitialized();

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
        `latlng=${location.latitude},${location.longitude}` +
        `&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Geocoding API error: ${data.status}`);
      }

      return data.results[0]?.formatted_address || 'Unknown location';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown location';
    }
  }

  /**
   * Forward geocoding - get coordinates from address
   */
  async geocode(address: string): Promise<MapLocation | null> {
    this.ensureInitialized();

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(address)}` +
        `&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Geocoding API error: ${data.status}`);
      }

      const result = data.results[0];
      if (!result) return null;

      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      };
    } catch (error) {
      console.error('Error geocoding:', error);
      return null;
    }
  }

  /**
   * Get static map image URL
   */
  getStaticMapUrl(
    center: MapLocation,
    zoom: number = 15,
    size: string = '400x300',
    markers?: MapMarker[]
  ): string {
    this.ensureInitialized();

    let url = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${center.latitude},${center.longitude}` +
      `&zoom=${zoom}` +
      `&size=${size}` +
      `&maptype=roadmap` +
      `&key=${this.apiKey}`;

    if (markers && markers.length > 0) {
      const markerParams = markers.map(marker => 
        `markers=color:red%7Clabel:${marker.title.charAt(0)}%7C` +
        `${marker.coordinate.latitude},${marker.coordinate.longitude}`
      ).join('&');
      
      url += `&${markerParams}`;
    }

    return url;
  }

  /**
   * Create geofence from location and radius
   */
  createGeofence(
    id: string,
    center: MapLocation,
    radius: number,
    title: string,
    description?: string
  ): GeofenceRegion {
    return {
      id,
      center,
      radius,
      title,
      description,
    };
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();

// Pet-specific location helpers
export const PetLocationHelpers = {
  /**
   * Find nearby veterinary clinics
   */
  async findNearbyVets(location: MapLocation, radius: number = 10000): Promise<PlaceSearchResult[]> {
    return googleMapsService.searchNearbyPlaces(location, radius, 'veterinary_care');
  },

  /**
   * Find nearby pet stores
   */
  async findNearbyPetStores(location: MapLocation, radius: number = 10000): Promise<PlaceSearchResult[]> {
    return googleMapsService.searchNearbyPlaces(location, radius, 'pet_store');
  },

  /**
   * Find nearby dog parks
   */
  async findNearbyParks(location: MapLocation, radius: number = 10000): Promise<PlaceSearchResult[]> {
    return googleMapsService.searchPlaces('dog park', location);
  },

  /**
   * Check if pet is in safe zone
   */
  isPetInSafeZone(petLocation: MapLocation, safeZones: GeofenceRegion[]): boolean {
    return safeZones.some(zone => googleMapsService.isPointInGeofence(petLocation, zone));
  },

  /**
   * Get distance to nearest safe zone
   */
  getDistanceToNearestSafeZone(petLocation: MapLocation, safeZones: GeofenceRegion[]): number {
    if (safeZones.length === 0) return Infinity;

    const distances = safeZones.map(zone => 
      googleMapsService.calculateDistance(petLocation, zone.center) - zone.radius
    );

    return Math.min(...distances);
  },

  /**
   * Format distance for display
   */
  formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  },

  /**
   * Format duration for display
   */
  formatDuration(durationInSeconds: number): string {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  },
};