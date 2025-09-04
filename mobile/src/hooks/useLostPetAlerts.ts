/**
 * Lost Pet Alerts Hook
 * 
 * Manages lost pet alerts with premium restrictions:
 * - Only premium users can POST lost pet alerts
 * - ALL users receive community notifications
 * - All users can VIEW nearby lost pet alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  premiumLostPetService,
  LostPetAlert,
  LostPetReport 
} from '../services/PremiumLostPetService';
import { usePremiumAccess } from './usePremiumAccess';
import { router } from 'expo-router';

interface LostPetAlertsHook {
  // State
  nearbyAlerts: LostPetAlert[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  hasLocationPermission: boolean;
  
  // Premium status
  hasPremiumAccess: boolean;
  canPostAlerts: boolean;
  
  // Actions
  loadNearbyAlerts: (radiusKm?: number) => Promise<void>;
  refreshAlerts: () => Promise<void>;
  reportLostPet: (petData: LostPetReport) => Promise<{
    success: boolean;
    error?: string;
    requiresPremium?: boolean;
  }>;
  markPetFound: (alertId: string) => Promise<{ success: boolean; error?: string }>;
  requestLocationPermission: () => Promise<boolean>;
  showPremiumUpgrade: () => void;
}

export const useLostPetAlerts = (radiusKm: number = 25): LostPetAlertsHook => {
  const [nearbyAlerts, setNearbyAlerts] = useState<LostPetAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const { hasPremiumAccess } = usePremiumAccess();

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Load nearby alerts on mount and when radius changes
  useEffect(() => {
    loadNearbyAlerts(radiusKm);
  }, [radiusKm]);

  const checkLocationPermission = useCallback(async () => {
    try {
      const hasPermission = await premiumLostPetService.checkLocationPermission();
      setHasLocationPermission(hasPermission);
    } catch (error) {
      console.error('Error checking location permission:', error);
      setHasLocationPermission(false);
    }
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await premiumLostPetService.requestLocationPermission();
      setHasLocationPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setHasLocationPermission(false);
      return false;
    }
  }, []);

  const loadNearbyAlerts = useCallback(async (radius: number = radiusKm) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await premiumLostPetService.getNearbyAlerts(radius);
      
      if (result.success && result.alerts) {
        setNearbyAlerts(result.alerts);
      } else {
        setError(result.error || 'Failed to load nearby alerts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error loading nearby alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [radiusKm]);

  const refreshAlerts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadNearbyAlerts();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadNearbyAlerts]);

  const reportLostPet = useCallback(async (petData: LostPetReport) => {
    try {
      // Check if user has premium access for posting alerts
      if (!hasPremiumAccess) {
        return {
          success: false,
          requiresPremium: true,
          error: 'Premium subscription required to report lost pets',
        };
      }

      const result = await premiumLostPetService.reportLostPet(petData);
      
      if (result.success) {
        // Refresh alerts to include the new report
        await refreshAlerts();
        
        Alert.alert(
          'Lost Pet Report Sent',
          result.queued 
            ? 'Your report has been queued and will be sent when you\'re back online.'
            : `Your lost pet alert has been sent to the community. ${result.alerts_sent || 0} nearby users were notified.`,
          [{ text: 'OK' }]
        );
      } else if (result.requiresPremium) {
        showPremiumUpgrade();
      }
      
      return result;
    } catch (error) {
      console.error('Error reporting lost pet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to report lost pet',
      };
    }
  }, [hasPremiumAccess, refreshAlerts]);

  const markPetFound = useCallback(async (alertId: string) => {
    try {
      const result = await premiumLostPetService.markPetFound(alertId, 'community_member');
      
      if (result.success) {
        // Remove the alert from local state
        setNearbyAlerts(prev => prev.filter(alert => alert.id !== alertId));
        
        if (!result.queued) {
          Alert.alert(
            'Thank You!',
            'The pet owner has been notified that their pet was found. Thank you for helping reunite them!',
            [{ text: 'You\'re Welcome!' }]
          );
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error marking pet as found:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark pet as found',
      };
    }
  }, []);

  const showPremiumUpgrade = useCallback(() => {
    Alert.alert(
      'Premium Feature - Lost Pet Alerts',
      'Report lost pets with location pins, contact info, and photos. Premium users can post alerts and the entire community receives notifications to help find your pet.',
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
        },
        {
          text: 'Upgrade to Premium',
          onPress: () => {
            router.push('/subscription?feature=lost_pet_alerts');
          },
        },
      ]
    );
  }, []);

  return {
    // State
    nearbyAlerts,
    isLoading,
    error,
    isRefreshing,
    hasLocationPermission,
    
    // Premium status
    hasPremiumAccess,
    canPostAlerts: hasPremiumAccess,
    
    // Actions
    loadNearbyAlerts,
    refreshAlerts,
    reportLostPet,
    markPetFound,
    requestLocationPermission,
    showPremiumUpgrade,
  };
};

export default useLostPetAlerts;