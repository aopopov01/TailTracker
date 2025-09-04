import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import { IntegrationTestUtils } from '../../test/integration-setup';
import { LostPetAlert } from '../LostPetAlertService';
import { supabase } from '../supabase';
import * as Notifications from 'expo-notifications';

// Mock components for testing
const MockLostPetReportComponent = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  return (
    <div>
      <button
        testID="report-lost-pet"
        onClick={() => onSubmit({
          petId: 'pet-1',
          lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
          lastSeenAddress: '123 Main St, San Francisco, CA',
          description: 'Last seen at the park',
          rewardAmount: 100,
          contactPhone: '+1234567890',
        })}
      >
        Report Lost Pet
      </button>
    </div>
  );
};

const MockNearbyAlertsComponent = ({ onLoad }: { onLoad: () => void }) => {
  React.useEffect(() => {
    onLoad();
  }, [onLoad]);

  return <div testID="nearby-alerts">Nearby Alerts</div>;
};

describe('Lost Pet Alerts Integration Tests', () => {
  let lostPetService: LostPetAlert;

  beforeEach(async () => {
    // Initialize test environment
    await IntegrationTestUtils.loginUser({
      id: 'user-1',
      email: 'test@example.com',
      subscription_status: 'premium',
    });

    IntegrationTestUtils.createTestPet({
      id: 'pet-1',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      created_by: 'user-1',
    });

    lostPetService = new LostPetAlert();
  });

  afterEach(() => {
    IntegrationTestUtils.clearTestDb();
  });

  describe('Lost Pet Reporting Flow', () => {
    it('should create lost pet report successfully', async () => {
      const reportData = {
        petId: 'pet-1',
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
        lastSeenAddress: '123 Main St, San Francisco, CA',
        description: 'Last seen at the park',
        rewardAmount: 100,
        contactPhone: '+1234567890',
      };

      const result = await lostPetService.reportLostPet(reportData);

      expect(result).toEqual({
        success: true,
        lostPetId: expect.any(String),
        alertsSent: expect.any(Number),
        message: expect.stringContaining('Lost pet report created'),
      });

      // Verify database state
      const testDb = IntegrationTestUtils.getTestDb();
      expect(testDb.lostPets).toHaveLength(1);
      expect(testDb.lostPets[0]).toMatchObject({
        pet_id: 'pet-1',
        reported_by: 'user-1',
        status: 'lost',
      });
    });

    it('should fail for non-premium users', async () => {
      // Login as free user
      await IntegrationTestUtils.loginUser({
        id: 'user-2',
        email: 'free@example.com',
        subscription_status: 'free',
      });

      const reportData = {
        petId: 'pet-1',
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
        description: 'Last seen at the park',
      };

      await expect(lostPetService.reportLostPet(reportData)).rejects.toThrow(
        'Premium subscription required'
      );
    });

    it('should validate pet ownership', async () => {
      // Try to report another user's pet
      const reportData = {
        petId: 'pet-2', // Pet owned by different user
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
        description: 'Last seen at the park',
      };

      await expect(lostPetService.reportLostPet(reportData)).rejects.toThrow(
        'Pet not found or not owned by user'
      );
    });

    it('should send notifications to nearby users', async () => {
      // Create nearby users in test database
      const testDb = IntegrationTestUtils.getTestDb();
      testDb.nearbyUsers = [
        {
          id: 'nearby-user-1',
          push_token: 'ExponentPushToken[test1]',
          latitude: 37.7750,
          longitude: -122.4195,
          distance_km: 0.5,
        },
        {
          id: 'nearby-user-2',
          push_token: 'ExponentPushToken[test2]',
          latitude: 37.7748,
          longitude: -122.4193,
          distance_km: 0.3,
        },
      ];

      const reportData = {
        petId: 'pet-1',
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
        searchRadiusKm: 5,
      };

      const result = await lostPetService.reportLostPet(reportData);

      expect(result.alertsSent).toBe(2);
    });
  });

  describe('Lost Pet Status Management', () => {
    beforeEach(async () => {
      // Create a lost pet report first
      await lostPetService.reportLostPet({
        petId: 'pet-1',
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
      });
    });

    it('should mark pet as found by owner', async () => {
      const testDb = IntegrationTestUtils.getTestDb();
      const lostPetId = testDb.lostPets[0].id;

      const result = await lostPetService.markAsFound({
        lostPetId,
        foundBy: 'user-1',
      });

      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('has been marked as found'),
      });

      // Verify database state
      const updatedLostPet = testDb.lostPets.find(p => p.id === lostPetId);
      expect(updatedLostPet.status).toBe('found');
      expect(updatedLostPet.found_by).toBe('user-1');
    });

    it('should mark pet as found by helper', async () => {
      // Create helper user
      await IntegrationTestUtils.loginUser({
        id: 'helper-1',
        email: 'helper@example.com',
      });

      const testDb = IntegrationTestUtils.getTestDb();
      const lostPetId = testDb.lostPets[0].id;

      const result = await lostPetService.markAsFound({
        lostPetId,
        foundBy: 'helper-1',
      });

      expect(result.success).toBe(true);
    });

    it('should prevent unauthorized users from marking as found', async () => {
      // Create unauthorized user
      await IntegrationTestUtils.loginUser({
        id: 'unauthorized-1',
        email: 'unauthorized@example.com',
      });

      const testDb = IntegrationTestUtils.getTestDb();
      const lostPetId = testDb.lostPets[0].id;

      await expect(
        lostPetService.markAsFound({
          lostPetId,
          foundBy: 'unauthorized-1',
        })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Nearby Alerts Retrieval', () => {
    beforeEach(async () => {
      // Create multiple lost pet reports
      const locations = [
        { lat: 37.7749, lng: -122.4194 }, // San Francisco
        { lat: 37.7849, lng: -122.4294 }, // ~1km away
        { lat: 37.8049, lng: -122.4494 }, // ~5km away
      ];

      for (let i = 0; i < locations.length; i++) {
        await IntegrationTestUtils.loginUser({
          id: `user-${i + 1}`,
          subscription_status: 'premium',
        });

        IntegrationTestUtils.createTestPet({
          id: `pet-${i + 1}`,
          name: `Pet${i + 1}`,
          created_by: `user-${i + 1}`,
        });

        await lostPetService.reportLostPet({
          petId: `pet-${i + 1}`,
          lastSeenLocation: locations[i],
        });
      }
    });

    it('should retrieve nearby lost pets within radius', async () => {
      const userLocation = { lat: 37.7749, lng: -122.4194 };
      const radiusKm = 3;

      const result = await lostPetService.getNearbyAlerts(userLocation, radiusKm);

      expect(result.success).toBe(true);
      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.alerts.length).toBeLessThanOrEqual(2); // Within 3km radius
    });

    it('should return empty array when no pets in radius', async () => {
      const userLocation = { lat: 40.7128, lng: -74.0060 }; // New York (far away)
      const radiusKm = 5;

      const result = await lostPetService.getNearbyAlerts(userLocation, radiusKm);

      expect(result.success).toBe(true);
      expect(result.alerts).toHaveLength(0);
    });

    it('should use default radius when not specified', async () => {
      const userLocation = { lat: 37.7749, lng: -122.4194 };

      const result = await lostPetService.getNearbyAlerts(userLocation);

      expect(result.success).toBe(true);
      // Should use default 25km radius and find all pets
      expect(result.alerts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Notification Integration', () => {
    beforeEach(() => {
      IntegrationTestUtils.grantNotificationPermissions();
    });

    it('should send push notification when pet is reported lost', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [{ status: 'ok', id: 'notification-id' }],
        }),
      });
      global.fetch = mockFetch;

      // Create nearby user
      const testDb = IntegrationTestUtils.getTestDb();
      testDb.nearbyUsers = [{
        id: 'nearby-1',
        push_token: 'ExponentPushToken[test]',
        latitude: 37.7750,
        longitude: -122.4195,
      }];

      await lostPetService.reportLostPet({
        petId: 'pet-1',
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('ExponentPushToken[test]'),
        })
      );
    });

    it('should handle push notification failures gracefully', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      // Should not throw error even if notifications fail
      const result = await lostPetService.reportLostPet({
        petId: 'pet-1',
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
      });

      expect(result.success).toBe(true);
      expect(result.alertsSent).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      jest.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(
        lostPetService.reportLostPet({
          petId: 'pet-1',
          lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle missing required fields', async () => {
      await expect(
        lostPetService.reportLostPet({
          petId: '', // Missing pet ID
          lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
        })
      ).rejects.toThrow();
    });

    it('should handle invalid location coordinates', async () => {
      await expect(
        lostPetService.reportLostPet({
          petId: 'pet-1',
          lastSeenLocation: { lat: 999, lng: 999 }, // Invalid coordinates
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should create lost pet report within acceptable time', async () => {
      const startTime = Date.now();

      await lostPetService.reportLostPet({
        petId: 'pet-1',
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle multiple concurrent reports', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        lostPetService.reportLostPet({
          petId: `pet-${i}`,
          lastSeenLocation: { lat: 37.7749 + i * 0.001, lng: -122.4194 + i * 0.001 },
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('UI Integration Tests', () => {
    it('should handle complete lost pet reporting flow', async () => {
      let submittedData: any;

      const { getByTestId } = render(
        <MockLostPetReportComponent 
          onSubmit={async (data) => {
            submittedData = data;
            await lostPetService.reportLostPet(data);
          }} 
        />
      );

      const reportButton = getByTestId('report-lost-pet');
      
      await act(async () => {
        fireEvent.click(reportButton);
      });

      await waitFor(() => {
        expect(submittedData).toBeDefined();
      });

      expect(submittedData).toMatchObject({
        petId: 'pet-1',
        lastSeenLocation: expect.any(Object),
        rewardAmount: 100,
      });

      // Verify the report was created
      const testDb = IntegrationTestUtils.getTestDb();
      expect(testDb.lostPets).toHaveLength(1);
    });

    it('should load nearby alerts on component mount', async () => {
      // Create some lost pets first
      await lostPetService.reportLostPet({
        petId: 'pet-1',
        lastSeenLocation: { lat: 37.7749, lng: -122.4194 },
      });

      let alertsLoaded = false;

      const { getByTestId } = render(
        <MockNearbyAlertsComponent 
          onLoad={() => {
            alertsLoaded = true;
          }} 
        />
      );

      expect(getByTestId('nearby-alerts')).toBeDefined();
      expect(alertsLoaded).toBe(true);
    });
  });
});

// Mock LostPetAlertService for testing
export class LostPetAlert {
  async reportLostPet(data: any) {
    // Simulate API call to Supabase function
    const response = await fetch('/functions/v1/lost-pet-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'report_lost_pet',
        data: { ...data, user_id: 'user-1' },
      }),
    });

    return response.json();
  }

  async markAsFound(data: { lostPetId: string; foundBy: string }) {
    const response = await fetch('/functions/v1/lost-pet-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark_found',
        data: { ...data, user_id: data.foundBy },
      }),
    });

    return response.json();
  }

  async getNearbyAlerts(location: { lat: number; lng: number }, radiusKm = 25) {
    const response = await fetch('/functions/v1/lost-pet-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_nearby_alerts',
        data: { user_location: location, radius_km: radiusKm },
      }),
    });

    return response.json();
  }
}