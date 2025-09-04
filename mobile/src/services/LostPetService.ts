// TailTracker Lost Pet Alert Service with Pro-Only Reporting
import { supabase } from '@/lib/supabase';

export interface LostPetAlert {
  id: string;
  pet_id: string;
  reporter_user_id: string;
  last_seen_location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  description: string;
  photos: string[];
  contact_info: {
    name: string;
    phone?: string;
    email?: string;
  };
  reward_amount?: number;
  status: 'active' | 'found' | 'cancelled';
  created_at: string;
  updated_at: string;
  pet?: {
    name: string;
    species: string;
    breed?: string;
    color?: string;
    photos: string[];
  };
}

export interface NearbyAlert extends LostPetAlert {
  distance_km: number;
}

class LostPetService {
  /**
   * Get nearby lost pet alerts within 10km radius
   * Available to all users (free, premium, pro)
   */
  async getNearbyAlerts(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<NearbyAlert[]> {
    try {
      // Use PostGIS to find nearby alerts within radius (default 10km)
      const { data, error } = await supabase.rpc('get_nearby_lost_pets', {
        center_lat: latitude,
        center_lng: longitude,
        radius_km: radius
      });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching nearby lost pet alerts:', error);
      return [];
    }
  }

  /**
   * Report a lost pet - PRO TIER ONLY
   * Free and Premium users can only receive notifications
   */
  async reportLostPet(
    petId: string,
    lastSeenLocation: {
      latitude: number;
      longitude: number;
      address?: string;
    },
    description: string,
    contactInfo: {
      name: string;
      phone?: string;
      email?: string;
    },
    photos: string[] = [],
    rewardAmount?: number
  ): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Check if user has PRO subscription
      const hasProAccess = await this.checkProSubscription(user.user.id);
      if (!hasProAccess) {
        return {
          success: false,
          error: 'Lost pet reporting is available in Pro tier only. Free and Premium users can receive community alerts but cannot create reports. Upgrade to Pro to report lost pets.'
        };
      }

      // Verify pet ownership
      const { data: pet } = await supabase
        .from('pets')
        .select('id, name, family_id, families!inner(owner_id)')
        .eq('id', petId)
        .single();

      if (!pet || pet.families.owner_id !== user.user.id) {
        return {
          success: false,
          error: 'Pet not found or you do not have permission to report this pet as lost'
        };
      }

      // Create lost pet alert
      const { data: alert, error } = await supabase
        .from('lost_pet_alerts')
        .insert({
          pet_id: petId,
          reporter_user_id: user.user.id,
          last_seen_location: lastSeenLocation,
          description,
          contact_info: contactInfo,
          photos,
          reward_amount: rewardAmount,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Update pet status to lost
      await supabase
        .from('pets')
        .update({ status: 'lost' })
        .eq('id', petId);

      // Send notifications to nearby users (within 10km)
      await this.notifyNearbyUsers(lastSeenLocation, alert);

      return {
        success: true,
        alertId: alert.id
      };

    } catch (error: any) {
      console.error('Error reporting lost pet:', error);
      return {
        success: false,
        error: error.message || 'Failed to report lost pet'
      };
    }
  }

  /**
   * Mark a lost pet as found
   * Available to the original reporter only
   */
  async markPetFound(
    alertId: string
  ): Promise<{ success: boolean }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Verify alert ownership
      const { data: alert } = await supabase
        .from('lost_pet_alerts')
        .select('id, reporter_user_id, pet_id')
        .eq('id', alertId)
        .single();

      if (!alert || alert.reporter_user_id !== user.user.id) {
        throw new Error('Alert not found or you do not have permission to update it');
      }

      // Update alert status to found
      const { error: alertError } = await supabase
        .from('lost_pet_alerts')
        .update({
          status: 'found',
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (alertError) throw alertError;

      // Update pet status back to active
      await supabase
        .from('pets')
        .update({ status: 'active' })
        .eq('id', alert.pet_id);

      return { success: true };

    } catch (error: any) {
      console.error('Error marking pet as found:', error);
      return { success: false };
    }
  }

  /**
   * Get user's own lost pet reports
   * PRO users only (since only they can create reports)
   */
  async getUserReports(): Promise<LostPetAlert[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('lost_pet_alerts')
        .select(`
          *,
          pet:pets!inner(name, species, breed, color, photos)
        `)
        .eq('reporter_user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }
  }

  // Communication features removed - users can only view lost pet alerts

  // Private helper methods

  private async checkProSubscription(userId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', userId)
        .single();

      return user?.subscription_status === 'pro';

    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  private async notifyNearbyUsers(
    location: { latitude: number; longitude: number },
    alert: LostPetAlert
  ): Promise<void> {
    try {
      // Find all users within 10km radius
      const { data: nearbyUsers } = await supabase.rpc('find_nearby_users', {
        center_lat: location.latitude,
        center_lng: location.longitude,
        radius_meters: 10000 // 10km in meters
      });

      if (!nearbyUsers?.length) return;

      // Send push notifications to nearby users
      const notifications = nearbyUsers.map((user: any) => ({
        to: user.push_token,
        title: 'Lost Pet Alert in Your Area',
        body: `A ${alert.pet?.species} named ${alert.pet?.name} is missing nearby. Help bring them home!`,
        data: {
          type: 'lost_pet_alert',
          alert_id: alert.id,
          pet_name: alert.pet?.name,
          location: location
        }
      }));

      // Send notifications (implementation would use Expo push service)
      console.log(`Sending ${notifications.length} lost pet notifications`);

    } catch (error) {
      console.error('Error notifying nearby users:', error);
    }
  }

  private async notifyOwnerOfSighting(
    alertId: string,
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      // Get alert details and owner info
      const { data: alert } = await supabase
        .from('lost_pet_alerts')
        .select(`
          id,
          pet:pets!inner(name),
          reporter:users!inner(push_token)
        `)
        .eq('id', alertId)
        .single();

      if (!alert?.reporter.push_token) return;

      // Send notification to pet owner
      const notification = {
        to: alert.reporter.push_token,
        title: `${alert.pet.name} Spotted!`,
        body: 'Someone reported seeing your pet. Check the app for details.',
        data: {
          type: 'pet_sighting',
          alert_id: alertId,
          sighting_location: location
        }
      };

      // Send notification (implementation would use Expo push service)
      console.log('Sending sighting notification to pet owner');

    } catch (error) {
      console.error('Error notifying owner of sighting:', error);
    }
  }

}

export const lostPetService = new LostPetService();