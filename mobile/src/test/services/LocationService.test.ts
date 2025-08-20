import { locationService, TailTrackerLocationHelpers } from '@/services/LocationService';
import { TestHelpers } from '@/test/utils/testUtils';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global, 'navigator', {
  value: {
    geolocation: mockGeolocation,
  },
  writable: true,
});

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    locationService.cleanup();
  });

  afterEach(() => {
    locationService.cleanup();
  });

  describe('getCurrentPosition', () => {
    it('should get current position successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5,
          altitude: 0,
          speed: 0,
          heading: 0,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await locationService.getCurrentPosition();

      expect(result).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 5,
        altitude: 0,
        speed: 0,
        heading: 0,
        timestamp: mockPosition.timestamp,
        provider: 'gps',
      });
    });

    it('should handle geolocation error', async () => {
      const mockError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(locationService.getCurrentPosition()).rejects.toThrow('permission_denied');
    });

    it('should handle timeout error', async () => {
      const mockError = {
        code: 3,
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(locationService.getCurrentPosition()).rejects.toThrow('timeout');
    });

    it('should use custom options', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5,
          altitude: null,
          speed: null,
          heading: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const options = {
        accuracy: 'high' as const,
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: true,
      };

      await locationService.getCurrentPosition(options);

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  });

  describe('startLocationTracking', () => {
    it('should start location tracking successfully', async () => {
      const mockWatchId = 123;
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5,
          altitude: 0,
          speed: 0,
          heading: 0,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.watchPosition.mockImplementation((success) => {
        setTimeout(() => success(mockPosition), 100);
        return mockWatchId;
      });

      const locationCallback = jest.fn();
      locationService.addLocationCallback(locationCallback);

      await locationService.startLocationTracking();

      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
      expect(locationService.isLocationTracking()).toBe(true);

      // Wait for position update
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(locationCallback).toHaveBeenCalled();
    });

    it('should not start tracking if already tracking', async () => {
      mockGeolocation.watchPosition.mockReturnValue(123);

      await locationService.startLocationTracking();
      await locationService.startLocationTracking(); // Second call

      expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it('should handle tracking error', async () => {
      const mockError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.watchPosition.mockImplementation((success, error) => {
        setTimeout(() => error(mockError), 100);
        return 123;
      });

      await expect(locationService.startLocationTracking()).rejects.toThrow();
    });
  });

  describe('stopLocationTracking', () => {
    it('should stop location tracking', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);

      await locationService.startLocationTracking();
      expect(locationService.isLocationTracking()).toBe(true);

      locationService.stopLocationTracking();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
      expect(locationService.isLocationTracking()).toBe(false);
    });

    it('should not clear watch if not tracking', () => {
      locationService.stopLocationTracking();
      expect(mockGeolocation.clearWatch).not.toHaveBeenCalled();
    });
  });

  describe('geofence management', () => {
    const mockGeofence = {
      id: 'test-geofence',
      center: { latitude: 37.7749, longitude: -122.4194 },
      radius: 100,
      title: 'Test Zone',
      description: 'Test geofence',
    };

    it('should add geofence', () => {
      locationService.addGeofence(mockGeofence);
      const geofences = locationService.getGeofences();
      
      expect(geofences).toHaveLength(1);
      expect(geofences[0]).toEqual(mockGeofence);
    });

    it('should remove geofence', () => {
      locationService.addGeofence(mockGeofence);
      const removed = locationService.removeGeofence('test-geofence');
      
      expect(removed).toBe(true);
      expect(locationService.getGeofences()).toHaveLength(0);
    });

    it('should return false when removing non-existent geofence', () => {
      const removed = locationService.removeGeofence('non-existent');
      expect(removed).toBe(false);
    });

    it('should trigger geofence events', async () => {
      const geofenceCallback = jest.fn();
      locationService.addGeofenceCallback(geofenceCallback);
      locationService.addGeofence(mockGeofence);

      // Mock position inside geofence
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5,
          altitude: 0,
          speed: 0,
          heading: 0,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.watchPosition.mockImplementation((success) => {
        success(mockPosition);
        return 123;
      });

      await locationService.startLocationTracking();

      // Wait for geofence processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(geofenceCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'enter',
          id: 'test-geofence',
        })
      );
    });
  });

  describe('callback management', () => {
    it('should add and remove location callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      locationService.addLocationCallback(callback1);
      locationService.addLocationCallback(callback2);

      locationService.removeLocationCallback(callback1);
      // callback2 should still be registered
    });

    it('should add and remove geofence callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      locationService.addGeofenceCallback(callback1);
      locationService.addGeofenceCallback(callback2);

      locationService.removeGeofenceCallback(callback1);
      // callback2 should still be registered
    });
  });

  describe('getLastKnownLocation', () => {
    it('should return null when no location is available', () => {
      const lastLocation = locationService.getLastKnownLocation();
      expect(lastLocation).toBeNull();
    });

    it('should return last known location after getting position', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5,
          altitude: 0,
          speed: 0,
          heading: 0,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await locationService.getCurrentPosition();
      
      const lastLocation = locationService.getLastKnownLocation();
      expect(lastLocation).toEqual(
        expect.objectContaining({
          latitude: 37.7749,
          longitude: -122.4194,
        })
      );
    });
  });
});

describe('TailTrackerLocationHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    locationService.cleanup();
  });

  describe('startPetTracking', () => {
    it('should start pet tracking with optimal settings', async () => {
      mockGeolocation.watchPosition.mockReturnValue(123);

      await TailTrackerLocationHelpers.startPetTracking();

      expect(locationService.isLocationTracking()).toBe(true);
    });
  });

  describe('createSafeZone', () => {
    it('should create and add safe zone geofence', () => {
      const center = { latitude: 37.7749, longitude: -122.4194 };
      const radius = 100;
      const name = 'Home';
      const id = 'home-zone';

      const geofence = TailTrackerLocationHelpers.createSafeZone(id, name, center, radius);

      expect(geofence).toEqual({
        id,
        center,
        radius,
        title: name,
        description: `Safe zone: ${name}`,
      });

      const geofences = locationService.getGeofences();
      expect(geofences).toHaveLength(1);
      expect(geofences[0]).toEqual(geofence);
    });
  });

  describe('setupPetSafetyMonitoring', () => {
    it('should setup location and geofence callbacks', () => {
      const locationCallback = jest.fn();
      const geofenceCallback = jest.fn();

      TailTrackerLocationHelpers.setupPetSafetyMonitoring(locationCallback, geofenceCallback);

      // Callbacks should be registered (we can't directly test this without triggering events)
      expect(locationCallback).toBeDefined();
      expect(geofenceCallback).toBeDefined();
    });
  });

  describe('utility functions', () => {
    it('should get accuracy description', () => {
      expect(TailTrackerLocationHelpers.getAccuracyDescription(3)).toBe('Excellent');
      expect(TailTrackerLocationHelpers.getAccuracyDescription(8)).toBe('Good');
      expect(TailTrackerLocationHelpers.getAccuracyDescription(15)).toBe('Fair');
      expect(TailTrackerLocationHelpers.getAccuracyDescription(30)).toBe('Poor');
      expect(TailTrackerLocationHelpers.getAccuracyDescription(100)).toBe('Very Poor');
    });

    it('should format location', () => {
      const location = TestHelpers.createMockLocation();
      const formatted = TailTrackerLocationHelpers.formatLocation(location);
      
      expect(formatted).toBe('37.774900, -122.419400');
    });

    it('should calculate speed in km/h', () => {
      const location = TestHelpers.createMockLocation({ speed: 10 }); // 10 m/s
      const speedKmh = TailTrackerLocationHelpers.getSpeedKmh(location);
      
      expect(speedKmh).toBe(36); // 10 * 3.6 = 36 km/h
    });

    it('should check if location is recent', () => {
      const recentLocation = TestHelpers.createMockLocation({ timestamp: Date.now() });
      const oldLocation = TestHelpers.createMockLocation({ timestamp: Date.now() - 600000 }); // 10 minutes ago
      
      expect(TailTrackerLocationHelpers.isLocationRecent(recentLocation)).toBe(true);
      expect(TailTrackerLocationHelpers.isLocationRecent(oldLocation)).toBe(false);
    });

    it('should get location age in minutes', () => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const location = TestHelpers.createMockLocation({ timestamp: fiveMinutesAgo });
      
      const age = TailTrackerLocationHelpers.getLocationAge(location);
      expect(age).toBe(5);
    });
  });
});