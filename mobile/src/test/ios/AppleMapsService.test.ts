import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { AppleMapsService, Coordinates, MapLocation } from '../../services/AppleMapsService';

// Mock dependencies
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    High: 6,
  },
}));

describe('AppleMapsService', () => {
  const mockLinking = {
    canOpenURL: Linking.canOpenURL as jest.MockedFunction<typeof Linking.canOpenURL>,
    openURL: Linking.openURL as jest.MockedFunction<typeof Linking.openURL>,
  };

  const mockLocation = {
    requestForegroundPermissionsAsync: Location.requestForegroundPermissionsAsync as jest.MockedFunction<typeof Location.requestForegroundPermissionsAsync>,
    getCurrentPositionAsync: Location.getCurrentPositionAsync as jest.MockedFunction<typeof Location.getCurrentPositionAsync>,
  };

  const testCoordinates: Coordinates = {
    latitude: 37.7749,
    longitude: -122.4194,
  };

  const testLocation: MapLocation = {
    coordinates: testCoordinates,
    title: 'San Francisco',
    subtitle: 'California',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLinking.canOpenURL.mockResolvedValue(true);
    mockLinking.openURL.mockResolvedValue(true);
  });

  describe('Platform Availability', () => {
    it('returns true for iOS platform', () => {
      expect(AppleMapsService.isAvailable()).toBe(true);
    });

    it('returns false for non-iOS platform', () => {
      (Platform.OS as any) = 'android';
      expect(AppleMapsService.isAvailable()).toBe(false);
      (Platform.OS as any) = 'ios';
    });
  });

  describe('App Installation Check', () => {
    it('checks if Apple Maps is installed', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      
      const isInstalled = await AppleMapsService.isAppInstalled();
      
      expect(isInstalled).toBe(true);
      expect(mockLinking.canOpenURL).toHaveBeenCalledWith('maps://');
    });

    it('returns false if Apple Maps is not installed', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false);
      
      const isInstalled = await AppleMapsService.isAppInstalled();
      
      expect(isInstalled).toBe(false);
    });

    it('returns false for non-iOS platforms', async () => {
      (Platform.OS as any) = 'android';
      
      const isInstalled = await AppleMapsService.isAppInstalled();
      
      expect(isInstalled).toBe(false);
      expect(mockLinking.canOpenURL).not.toHaveBeenCalled();
      
      (Platform.OS as any) = 'ios';
    });
  });

  describe('Opening Locations', () => {
    it('opens a location in Apple Maps', async () => {
      const result = await AppleMapsService.openLocation(testLocation);
      
      expect(result).toBe(true);
      expect(mockLinking.canOpenURL).toHaveBeenCalled();
      expect(mockLinking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('maps://maps.apple.com')
      );
    });

    it('includes coordinates in the URL', async () => {
      await AppleMapsService.openLocation(testLocation);
      
      const calledUrl = mockLinking.openURL.mock.calls[0][0];
      expect(calledUrl).toContain('ll=37.7749%2C-122.4194');
    });

    it('includes location title in the URL', async () => {
      await AppleMapsService.openLocation(testLocation);
      
      const calledUrl = mockLinking.openURL.mock.calls[0][0];
      expect(calledUrl).toContain('q=San%20Francisco');
    });

    it('sets correct map type', async () => {
      await AppleMapsService.openLocation(testLocation, {
        mapType: 'satellite',
      });
      
      const calledUrl = mockLinking.openURL.mock.calls[0][0];
      expect(calledUrl).toContain('t=s');
    });

    it('returns false if Apple Maps cannot be opened', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false);
      
      const result = await AppleMapsService.openLocation(testLocation);
      
      expect(result).toBe(false);
    });

    it('returns false for non-iOS platforms', async () => {
      (Platform.OS as any) = 'android';
      
      const result = await AppleMapsService.openLocation(testLocation);
      
      expect(result).toBe(false);
      
      (Platform.OS as any) = 'ios';
    });
  });

  describe('Opening Directions', () => {
    const destination: Coordinates = {
      latitude: 40.7128,
      longitude: -74.0060,
    };

    it('opens directions without source location', async () => {
      const result = await AppleMapsService.openDirections(null, destination);
      
      expect(result).toBe(true);
      expect(mockLinking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('dll=40.7128%2C-74.006')
      );
    });

    it('opens directions with source and destination', async () => {
      const result = await AppleMapsService.openDirections(testCoordinates, destination);
      
      expect(result).toBe(true);
      const calledUrl = mockLinking.openURL.mock.calls[0][0];
      expect(calledUrl).toContain('sll=37.7749%2C-122.4194');
      expect(calledUrl).toContain('dll=40.7128%2C-74.006');
    });

    it('sets driving directions by default', async () => {
      await AppleMapsService.openDirections(null, destination);
      
      const calledUrl = mockLinking.openURL.mock.calls[0][0];
      expect(calledUrl).toContain('dirflg=d');
    });

    it('sets walking directions', async () => {
      await AppleMapsService.openDirections(null, destination, {
        directionsMode: 'walking',
      });
      
      const calledUrl = mockLinking.openURL.mock.calls[0][0];
      expect(calledUrl).toContain('dirflg=w');
    });

    it('sets transit directions', async () => {
      await AppleMapsService.openDirections(null, destination, {
        directionsMode: 'transit',
      });
      
      const calledUrl = mockLinking.openURL.mock.calls[0][0];
      expect(calledUrl).toContain('dirflg=r');
    });
  });

  describe('Searching Places', () => {
    it('searches for places', async () => {
      const result = await AppleMapsService.searchPlaces('coffee shops');
      
      expect(result).toBe(true);
      expect(mockLinking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('q=coffee%20shops')
      );
    });

    it('searches near a location', async () => {
      const result = await AppleMapsService.searchPlaces('restaurants', testCoordinates);
      
      expect(result).toBe(true);
      const calledUrl = mockLinking.openURL.mock.calls[0][0];
      expect(calledUrl).toContain('sll=37.7749%2C-122.4194');
      expect(calledUrl).toContain('q=restaurants');
    });
  });

  describe('Current Location', () => {
    it('gets current location with permissions', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      } as any);
      
      mockLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      } as any);
      
      const location = await AppleMapsService.getCurrentLocation();
      
      expect(location).toEqual(testCoordinates);
      expect(mockLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalled();
    });

    it('returns null if location permission denied', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
      } as any);
      
      const location = await AppleMapsService.getCurrentLocation();
      
      expect(location).toBeNull();
      expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
    });

    it('handles location errors gracefully', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      } as any);
      
      mockLocation.getCurrentPositionAsync.mockRejectedValue(new Error('Location error'));
      
      const location = await AppleMapsService.getCurrentLocation();
      
      expect(location).toBeNull();
    });
  });

  describe('Distance Calculation', () => {
    it('calculates distance between two coordinates', () => {
      const sanFrancisco: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      const newYork: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      
      const distance = AppleMapsService.calculateDistance(sanFrancisco, newYork);
      
      // Distance between SF and NYC is approximately 4,139 km
      expect(distance).toBeGreaterThan(4000);
      expect(distance).toBeLessThan(5000);
    });

    it('returns zero for same coordinates', () => {
      const distance = AppleMapsService.calculateDistance(testCoordinates, testCoordinates);
      
      expect(distance).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    it('formats coordinates correctly', () => {
      const formatted = AppleMapsService.formatCoordinates(testCoordinates);
      
      expect(formatted).toBe('37.7749,-122.4194');
    });

    it('returns correct URL scheme', () => {
      const scheme = AppleMapsService.getUrlScheme();
      
      expect(scheme).toBe('maps://');
    });
  });

  describe('Multiple Pins', () => {
    it('opens map with multiple locations', async () => {
      const locations: MapLocation[] = [
        testLocation,
        {
          coordinates: { latitude: 40.7128, longitude: -74.0060 },
          title: 'New York',
        },
      ];
      
      const result = await AppleMapsService.openWithPins(locations);
      
      expect(result).toBe(true);
      expect(mockLinking.openURL).toHaveBeenCalled();
    });

    it('returns false for empty locations array', async () => {
      const result = await AppleMapsService.openWithPins([]);
      
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles Linking errors gracefully', async () => {
      mockLinking.canOpenURL.mockRejectedValue(new Error('Linking error'));
      
      const result = await AppleMapsService.openLocation(testLocation);
      
      expect(result).toBe(false);
    });

    it('handles URL opening errors gracefully', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockRejectedValue(new Error('Cannot open URL'));
      
      const result = await AppleMapsService.openLocation(testLocation);
      
      expect(result).toBe(false);
    });
  });
});