import { PerformanceTestUtils, PERFORMANCE_THRESHOLDS } from '../performance-setup';
import { premiumLostPetService, LostPetReport, LostPetAlert } from '../../services/PremiumLostPetService';
import * as Location from 'expo-location';

// Mock dependencies
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  }),
  Accuracy: {
    Balanced: 4,
  },
}));

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Lost Pet Alerts Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  test('Location permission request performance', async () => {
    const { result, duration } = await PerformanceTestUtils.measureApiCall(
      async () => {
        return await premiumLostPetService.requestLocationPermission();
      },
      'location-permission-request'
    );

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL);
    expect(result).toBe(true);
    
    console.log('Location Permission Request Performance:', {
      duration,
      threshold: PERFORMANCE_THRESHOLDS.API_CALL,
      result,
    });
  });

  test('Current location retrieval performance', async () => {
    const iterations = 5;
    const locationTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const location = await premiumLostPetService.getCurrentLocation();
      const endTime = Date.now();
      
      locationTimes.push(endTime - startTime);
      
      expect(location).toBeDefined();
      expect(location?.lat).toBe(37.7749);
      expect(location?.lng).toBe(-122.4194);
    }

    const averageTime = locationTimes.reduce((sum, time) => sum + time, 0) / locationTimes.length;
    const maxTime = Math.max(...locationTimes);
    const minTime = Math.min(...locationTimes);

    // Location retrieval should be fast, especially after first call (cached)
    expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_FILTER);
    expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL);

    console.log('Location Retrieval Performance:', {
      average: averageTime,
      min: minTime,
      max: maxTime,
      iterations,
      consistency: Math.round((minTime / maxTime) * 100) + '%',
    });
  });

  test('Lost pet reporting performance', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        lost_pet_id: 'test-lost-pet-id',
        alerts_sent: 15,
      }),
    } as Response);

    const testReport: LostPetReport = {
      pet_id: 'test-pet-id',
      last_seen_location: { lat: 37.7749, lng: -122.4194 },
      last_seen_address: '123 Test St, San Francisco, CA',
      last_seen_date: new Date(),
      description: 'Small brown dog, very friendly',
      reward_amount: 100,
      reward_currency: 'USD',
      contact_phone: '+1234567890',
      photo_urls: ['https://example.com/pet1.jpg'],
      search_radius_km: 5,
    };

    const { result, duration } = await PerformanceTestUtils.measureApiCall(
      async () => {
        return await premiumLostPetService.reportLostPet(testReport);
      },
      'report-lost-pet'
    );

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL);
    expect(result.success).toBe(true);
    expect(result.lost_pet_id).toBe('test-lost-pet-id');
    expect(result.alerts_sent).toBe(15);

    console.log('Lost Pet Reporting Performance:', {
      duration,
      threshold: PERFORMANCE_THRESHOLDS.API_CALL,
      success: result.success,
      alertsSent: result.alerts_sent,
    });
  });

  test('Nearby alerts retrieval performance', async () => {
    // Mock alerts data
    const mockAlerts: LostPetAlert[] = Array.from({ length: 25 }, (_, i) => ({
      id: `alert-${i}`,
      pet_id: `pet-${i}`,
      pet_name: `Pet ${i}`,
      species: i % 2 === 0 ? 'dog' : 'cat',
      breed: 'Mixed',
      photo_url: `https://example.com/pet${i}.jpg`,
      last_seen_location: {
        lat: 37.7749 + (Math.random() - 0.5) * 0.1,
        lng: -122.4194 + (Math.random() - 0.5) * 0.1,
      },
      last_seen_address: `${100 + i} Test St, San Francisco, CA`,
      last_seen_date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      description: `Lost pet ${i}`,
      reward_amount: 50 + i * 10,
      distance_km: Math.random() * 10,
      created_at: new Date(),
    }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        count: mockAlerts.length,
      }),
    } as Response);

    const { result, duration } = await PerformanceTestUtils.measureApiCall(
      async () => {
        return await premiumLostPetService.getNearbyAlerts(25);
      },
      'get-nearby-alerts'
    );

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL);
    expect(result.success).toBe(true);
    expect(result.alerts).toHaveLength(25);
    expect(result.count).toBe(25);

    console.log('Nearby Alerts Retrieval Performance:', {
      duration,
      threshold: PERFORMANCE_THRESHOLDS.API_CALL,
      alertCount: result.alerts?.length,
      processingTime: duration / result.alerts?.length,
    });
  });

  test('Batch operations performance', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const batchOperations = [
      () => premiumLostPetService.getCurrentLocation(),
      () => premiumLostPetService.checkPremiumAccess(),
      () => premiumLostPetService.getNearbyAlerts(10),
    ];

    const startTime = Date.now();
    const results = await Promise.all(batchOperations.map(op => op()));
    const batchDuration = Date.now() - startTime;

    // Batch operations should complete within reasonable time
    expect(batchDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL * 2);
    expect(results).toHaveLength(3);

    console.log('Batch Operations Performance:', {
      totalDuration: batchDuration,
      operationCount: batchOperations.length,
      averagePerOperation: batchDuration / batchOperations.length,
    });
  });

  test('Premium access check performance', async () => {
    // Test multiple rapid checks to simulate real usage
    const iterations = 10;
    const checkTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { duration } = await PerformanceTestUtils.measureApiCall(
        async () => {
          return await premiumLostPetService.checkPremiumAccess();
        },
        `premium-check-${i}`
      );
      
      checkTimes.push(duration);
    }

    const averageCheckTime = checkTimes.reduce((sum, time) => sum + time, 0) / checkTimes.length;
    
    // Premium checks should be very fast (likely cached)
    expect(averageCheckTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_FILTER);

    console.log('Premium Access Check Performance:', {
      average: averageCheckTime,
      iterations,
      totalTime: checkTimes.reduce((sum, time) => sum + time, 0),
    });
  });

  test('Geographic calculations performance', async () => {
    const testLocations = Array.from({ length: 100 }, (_, i) => ({
      lat: 37.7749 + (Math.random() - 0.5) * 1,
      lng: -122.4194 + (Math.random() - 0.5) * 1,
    }));

    const startTime = Date.now();
    
    // Test location validation performance
    const validationResults = testLocations.map(location => 
      premiumLostPetService.isValidLocation(location)
    );
    
    const validationTime = Date.now() - startTime;
    
    expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_FILTER);
    expect(validationResults.every(result => result === true)).toBe(true);

    console.log('Geographic Calculations Performance:', {
      locationsProcessed: testLocations.length,
      totalTime: validationTime,
      averagePerLocation: validationTime / testLocations.length,
    });
  });

  test('Helper functions performance', async () => {
    const { LostPetHelpers } = require('../../services/PremiumLostPetService');
    
    // Test time formatting performance
    const dates = Array.from({ length: 100 }, (_, i) => 
      new Date(Date.now() - i * 60 * 60 * 1000) // Each hour back
    );

    const startTime = Date.now();
    const timeFormatResults = dates.map(date => LostPetHelpers.formatTimeAgo(date));
    const formatTime = Date.now() - startTime;

    expect(formatTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_FILTER);
    expect(timeFormatResults).toHaveLength(100);

    // Test urgency level calculation performance
    const urgencyStartTime = Date.now();
    const urgencyResults = dates.map(date => LostPetHelpers.getUrgencyLevel(date));
    const urgencyTime = Date.now() - urgencyStartTime;

    expect(urgencyTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_FILTER);
    expect(urgencyResults).toHaveLength(100);

    console.log('Helper Functions Performance:', {
      timeFormatting: {
        items: dates.length,
        totalTime: formatTime,
        averagePerItem: formatTime / dates.length,
      },
      urgencyCalculation: {
        items: dates.length,
        totalTime: urgencyTime,
        averagePerItem: urgencyTime / dates.length,
      },
    });
  });

  test('Error handling performance', async () => {
    // Test performance when API calls fail
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result, duration } = await PerformanceTestUtils.measureApiCall(
      async () => {
        return await premiumLostPetService.reportLostPet({
          pet_id: 'test-pet',
          last_seen_location: { lat: 37.7749, lng: -122.4194 },
          last_seen_date: new Date(),
        } as LostPetReport);
      },
      'error-handling'
    );

    // Error handling should still be performant
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    console.log('Error Handling Performance:', {
      duration,
      success: result.success,
      error: result.error,
    });
  });

  test('Memory usage during alert processing', async () => {
    const initialMemory = PerformanceTestUtils.measureMemoryUsage('alerts-start');
    
    // Process large number of alerts
    const largeAlertSet: LostPetAlert[] = Array.from({ length: 500 }, (_, i) => ({
      id: `alert-${i}`,
      pet_id: `pet-${i}`,
      pet_name: `Pet ${i}`,
      species: 'dog',
      breed: 'Mixed',
      last_seen_location: { lat: 37.7749, lng: -122.4194 },
      last_seen_date: new Date(),
      distance_km: Math.random() * 25,
      created_at: new Date(),
    }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        alerts: largeAlertSet,
        count: largeAlertSet.length,
      }),
    } as Response);

    await premiumLostPetService.getNearbyAlerts(25);
    
    const finalMemory = PerformanceTestUtils.measureMemoryUsage('alerts-end');
    const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;

    // Memory increase should be reasonable for processing alerts
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB max increase

    console.log('Alert Processing Memory Usage:', {
      alertCount: largeAlertSet.length,
      memoryIncrease: Math.round(memoryIncrease / 1024 / 1024) + 'MB',
      memoryPerAlert: Math.round(memoryIncrease / largeAlertSet.length) + ' bytes',
    });
  });

  test('Concurrent alert operations performance', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, alerts: [], count: 0 }),
    } as Response);

    const concurrentOperations = 10;
    const startTime = Date.now();

    // Run multiple alert retrievals concurrently
    const promises = Array.from({ length: concurrentOperations }, (_, i) =>
      premiumLostPetService.getNearbyAlerts(5 + i)
    );

    const results = await Promise.all(promises);
    const concurrentDuration = Date.now() - startTime;

    expect(concurrentDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL * 2);
    expect(results).toHaveLength(concurrentOperations);
    expect(results.every(result => result.success)).toBe(true);

    console.log('Concurrent Alert Operations Performance:', {
      concurrentCount: concurrentOperations,
      totalDuration: concurrentDuration,
      averagePerOperation: concurrentDuration / concurrentOperations,
      efficiency: Math.round((concurrentOperations / (concurrentDuration / 1000)) * 100) / 100 + ' ops/sec',
    });
  });
});