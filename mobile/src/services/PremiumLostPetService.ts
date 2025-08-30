import { Platform, Alert } from 'react-native';
import { androidPermissions } from './AndroidPermissions';
import * as Location from 'expo-location';
import { supabase } from './supabase';

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
   * Report a pet as lost (Premium feature only)
   */
  async reportLostPet(reportData: LostPetReport): Promise<{
    success: boolean;
    lost_pet_id?: string;
    alerts_sent?: number;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'report_lost_pet',
          data: {
            ...reportData,
            user_id: user.id,
            last_seen_date: reportData.last_seen_date.toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to report lost pet');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error reporting lost pet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Mark a lost pet as found
   */
  async markPetFound(lostPetId: string, foundBy?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'mark_found',
          data: {
            lost_pet_id: lostPetId,
            user_id: user.id,
            found_by: foundBy,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark pet as found');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking pet as found:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get nearby lost pet alerts
   */
  async getNearbyAlerts(radiusKm: number = 25): Promise<{
    success: boolean;
    alerts?: LostPetAlert[];
    count?: number;
    error?: string;
  }> {
    try {
      const userLocation = await this.getCurrentLocation();
      if (!userLocation) {
        throw new Error('Unable to get user location');
      }

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_nearby_alerts',
          data: {
            user_location: userLocation,
            radius_km: radiusKm,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get nearby alerts');
      }

      const result = await response.json();
      
      // Convert date strings back to Date objects
      if (result.alerts) {
        result.alerts = result.alerts.map((alert: any) => ({
          ...alert,
          last_seen_date: new Date(alert.last_seen_date),
          created_at: new Date(alert.created_at),
        }));
      }

      return result;
    } catch (error) {
      console.error('Error getting nearby alerts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if user has premium subscription for lost pet features
   */
  async checkPremiumAccess(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking premium access:', error);
        return false;
      }

      return data?.subscription_status === 'premium' || data?.subscription_status === 'family';
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
      'Premium Feature',
      'Lost pet alerts are available with TailTracker Premium. Upgrade now to report lost pets and receive regional alerts from the community.',
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
        },
        {
          text: 'Upgrade to Premium',
          onPress: () => {
            // Navigate to subscription screen
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