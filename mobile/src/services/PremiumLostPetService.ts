import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabaseEnhanced } from '../../config/supabase';
import { androidPermissions } from './AndroidPermissions';
import { TailTrackerAPI } from './ApiClient';
import { errorRecoveryService } from './ErrorRecoveryService';
import { offlineQueueManager } from './OfflineQueueManager';
import { premiumNotificationService } from './PremiumNotificationService';

export interface LostPetReport {
  pet_id: string;
  last_seen_location: {
    lat: number;
    lng: number;
  };
  last_seen_address?: string;
  last_seen_date: Date;
  description?: string;
  reward_amount?: number;
  reward_currency?: string;
  contact_phone?: string;
  contact_email?: string;
  photo_urls?: string[];
  search_radius_km?: number;
}

export interface LostPetAlert {
  id: string;
  pet_id: string;
  pet_name: string;
  species: string;
  breed?: string;
  photo_url?: string;
  last_seen_location: {
    lat: number;
    lng: number;
  };
  last_seen_address?: string;
  last_seen_date: Date;
  description?: string;
  reward_amount?: number;
  reward_currency?: string;
  contact_phone?: string;
  distance_km: number;
  created_at: Date;
}

class PremiumLostPetService {
  private supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  private functionUrl = `${this.supabaseUrl}/functions/v1/lost-pet-alerts`;

  /**
   * Request location permission for lost pet features
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const result = await androidPermissions.requestPermission({
          type: 'location',
          title: 'Location Permission for Lost Pet Alerts',
          message: 'TailTracker needs location access to report lost pets and send regional alerts to nearby users.',
          buttonPositive: 'Grant Permission',
        });
        return result.status === 'granted';
      } else {
        // iOS
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Check if user has location permission
   */
  async checkLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const result = await androidPermissions.checkPermission('location');
        return result.status === 'granted';
      } else {
        // iOS
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Get current user location for lost pet reporting
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
      const hasPermission = await this.checkLocationPermission();
      if (!hasPermission) {
        const granted = await this.requestLocationPermission();
        if (!granted) {
          throw new Error('Location permission required for lost pet alerts');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Report a pet as lost (Premium feature only) - Enhanced with error recovery
   */
  async reportLostPet(reportData: LostPetReport): Promise<{
    success: boolean;
    lost_pet_id?: string;
    alerts_sent?: number;
    error?: string;
    queued?: boolean;
    requiresPremium?: boolean;
  }> {
    try {
      // Check authentication with enhanced client
      const session = await supabaseEnhanced.getSession();
      if (!session.data.session) {
        throw new Error('User not authenticated');
      }

      // PREMIUM CHECK: Reporting lost pets requires premium subscription
      const hasPremium = await this.checkPremiumAccess();
      if (!hasPremium) {
        return {
          success: false,
          requiresPremium: true,
          error: 'Premium subscription required to report lost pets',
        };
      }

      const reportPayload = {
        ...reportData,
        user_id: session.data.session.user.id,
        last_seen_date: reportData.last_seen_date.toISOString(),
      };

      // Use enhanced API client with error recovery
      const response = await TailTrackerAPI.lostPets.report(reportPayload);

      if (response.error) {
        // Check if request was queued for offline retry
        if (response.fromQueue) {
          return {
            success: true,
            queued: true,
            error: 'Lost pet report queued. Will be sent when connection is restored.',
          };
        }
        
        throw new Error(response.error);
      }

      // Send community notifications to all nearby users
      if (response.data?.lost_pet_id) {
        try {
          await this.sendCommunityLostPetNotification({
            petName: reportData.pet_id, // Will need pet name from database
            location: reportData.last_seen_location,
            contactPhone: reportData.contact_phone,
            message: reportData.description,
          });
        } catch (notificationError) {
          console.warn('Failed to send community notifications:', notificationError);
          // Don't fail the main operation if notifications fail
        }
      }

      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      console.error('Error reporting lost pet:', error);

      // Try to queue the operation for offline retry (only for premium users)
      try {
        await offlineQueueManager.enqueueAction(
          'LOST_PET_REPORT',
          {
            ...reportData,
            last_seen_date: reportData.last_seen_date.toISOString(),
          },
          {
            priority: 'critical',
            requiresAuthentication: true,
          }
        );

        return {
          success: true,
          queued: true,
          error: 'Lost pet report queued for when you\'re back online. This is a critical feature so we\'ll make sure it gets reported.',
        };
      } catch (queueError) {
        console.error('Failed to queue lost pet report:', queueError);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.',
        };
      }
    }
  }

  /**
   * Mark a lost pet as found - Enhanced with error recovery
   */
  async markPetFound(lostPetId: string, foundBy?: string): Promise<{
    success: boolean;
    error?: string;
    queued?: boolean;
  }> {
    try {
      // Check authentication with enhanced client
      const session = await supabaseEnhanced.getSession();
      if (!session.data.session) {
        throw new Error('User not authenticated');
      }

      // Use enhanced API client with error recovery
      const response = await TailTrackerAPI.lostPets.markFound(lostPetId, foundBy);

      if (response.error) {
        // Check if request was queued for offline retry
        if (response.fromQueue) {
          return {
            success: true,
            queued: true,
            error: 'Pet found notification queued. Will be sent when connection is restored.',
          };
        }
        
        throw new Error(response.error);
      }

      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      console.error('Error marking pet as found:', error);

      // Try to queue the operation for offline retry
      try {
        await offlineQueueManager.enqueueAction(
          'LOST_PET_FOUND',
          {
            lostPetId,
            foundBy,
          },
          {
            priority: 'critical',
            requiresAuthentication: true,
          }
        );

        return {
          success: true,
          queued: true,
          error: 'Pet found notification queued. This great news will be shared when you\'re back online!',
        };
      } catch (queueError) {
        console.error('Failed to queue pet found notification:', queueError);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.',
        };
      }
    }
  }

  /**
   * Get nearby lost pet alerts - Enhanced with error recovery
   */
  async getNearbyAlerts(radiusKm: number = 25): Promise<{
    success: boolean;
    alerts?: LostPetAlert[];
    count?: number;
    error?: string;
    cached?: boolean;
  }> {
    try {
      const userLocation = await this.getCurrentLocation();
      if (!userLocation) {
        throw new Error('Unable to get user location');
      }

      // Use enhanced API client with caching for nearby alerts
      const response = await TailTrackerAPI.lostPets.getNearby(userLocation, radiusKm);

      if (response.error) {
        throw new Error(response.error);
      }

      const result = response.data;
      
      // Convert date strings back to Date objects
      if (result.alerts) {
        result.alerts = result.alerts.map((alert: any) => ({
          ...alert,
          last_seen_date: new Date(alert.last_seen_date),
          created_at: new Date(alert.created_at),
        }));
      }

      return {
        success: true,
        cached: response.cached,
        ...result,
      };
    } catch (error) {
      console.error('Error getting nearby alerts:', error);
      
      // For read operations, we don't queue but can return cached data
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to fetch nearby alerts. Please check your connection.',
      };
    }
  }

  /**
   * Check if user has premium subscription for lost pet features - Enhanced with error recovery
   */
  async checkPremiumAccess(): Promise<boolean> {
    try {
      const session = await supabaseEnhanced.getSession();
      if (!session.data.session) {
        return false;
      }

      const user = session.data.session.user;

      // Use enhanced Supabase client with caching for subscription status
      const result = await supabaseEnhanced.select(
        'users',
        'subscription_status',
        {
          cache: { enabled: true, ttl: 300000 }, // Cache for 5 minutes
          deduplicate: true,
          circuitBreaker: 'user_subscription_check',
        }
      );

      if (result.error) {
        console.error('Error checking premium access:', result.error);
        return false;
      }

      const userData = result.data?.[0];
      return userData?.subscription_status === 'premium' || userData?.subscription_status === 'family';
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  }

  /**
   * Show premium upgrade prompt for lost pet features
   */
  showPremiumPrompt(): void {
    Alert.alert(
      'Premium Feature - Lost Pet Alerts',
      'Report lost pets and pin their last known location on the map. Premium users can post alerts with photos, contact info, and reward offers. All community members will receive notifications to help find your pet.',
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
        },
        {
          text: 'Learn More',
          onPress: () => {
            // Navigate to subscription screen with lost_pet_alerts feature highlighted
            // This would be handled by the calling component
          },
        },
      ]
    );
  }

  /**
   * Helper function to format distance for display
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km away`;
    } else {
      return `${Math.round(distanceKm)}km away`;
    }
  }

  /**
   * Helper function to format reward amount
   */
  formatReward(amount?: number, currency: string = 'USD'): string {
    if (!amount) return 'No reward offered';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    
    return `${formatter.format(amount)} reward`;
  }

  /**
   * Helper function to validate location coordinates
   */
  isValidLocation(location: { lat: number; lng: number }): boolean {
    return (
      location.lat >= -90 && 
      location.lat <= 90 && 
      location.lng >= -180 && 
      location.lng <= 180
    );
  }

  /**
   * Send community lost pet notifications to all nearby users
   * Premium users post alerts, ALL users receive notifications
   */
  private async sendCommunityLostPetNotification(data: {
    petName: string;
    location: { lat: number; lng: number };
    contactPhone?: string;
    message?: string;
  }): Promise<void> {
    try {
      // Create lost pet alert notification data
      const notificationData = {
        petName: data.petName,
        lastSeenLocation: data.location,
        contactPhone: data.contactPhone,
        message: data.message || 'Help find this lost pet!',
      };

      // Send notification to community (all users regardless of premium status)
      // This uses the system notification type which is free for all users
      const result = await premiumNotificationService.sendNotification({
        id: 'lost-pet-community-' + Date.now(),
        type: 'system_update', // Free notification type for community alerts
        title: `Lost Pet Alert: ${data.petName}`,
        body: `A pet named ${data.petName} is missing in your area. Tap to help find them.`,
        priority: 'high',
        channels: ['push', 'sound', 'badge'],
        data: {
          petName: data.petName,
          location: data.location,
          contactPhone: data.contactPhone,
          message: data.message,
          deepLinkRoute: '/lost-pet-alerts',
          notificationType: 'community_lost_pet',
        },
      });

      if (result.success) {
        console.log('Community lost pet notification sent successfully');
      } else {
        console.warn('Failed to send community notification:', result.error);
      }
    } catch (error) {
      console.error('Error sending community lost pet notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const premiumLostPetService = new PremiumLostPetService();

// Export helper functions for components
export const LostPetHelpers = {
  formatTimeAgo: (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  },

  getUrgencyLevel: (lastSeenDate: Date): 'high' | 'medium' | 'low' => {
    const hoursAgo = (new Date().getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo < 6) return 'high';
    if (hoursAgo < 48) return 'medium';
    return 'low';
  },

  getSpeciesIcon: (species: string): string => {
    const speciesMap: Record<string, string> = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      rabbit: '🐰',
      hamster: '🐹',
      fish: '🐠',
      reptile: '🦎',
      other: '🐾',
    };

    return speciesMap[species.toLowerCase()] || '🐾';
  },
};