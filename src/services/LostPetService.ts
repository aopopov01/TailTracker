// TailTracker Lost Pet Alert Service (Simplified)
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Use actual database type
type LostPet = Database['public']['Tables']['lost_pets']['Row'];

export interface LostPetAlert extends LostPet {
  pet?: {
    name: string;
    species: string;
    breed?: string;
    color_markings?: string;
  };
}

export interface NearbyAlert extends LostPetAlert {
  distance_km?: number;
}

class LostPetService {
  /**
   * Get lost pet alerts
   * NOTE: Geolocation RPC function doesn't exist - returns all active alerts
   */
  async getNearbyAlerts(
    latitude?: number,
    longitude?: number,
    radius: number = 10
  ): Promise<NearbyAlert[]> {
    try {
      // NOTE: get_nearby_lost_pets RPC function doesn't exist
      // Returning all active alerts instead
      const { data, error } = await supabase
        .from('lost_pets')
        .select(
          `
          *,
          pets (
            name,
            species,
            breed,
            color_markings
          )
        `
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        pet: item.pets,
      })) as NearbyAlert[];
    } catch (error) {
      console.error('Error fetching lost pet alerts:', error);
      return [];
    }
  }

  /**
   * Get user's lost pet reports
   */
  async getUserLostPets(userId: string): Promise<LostPetAlert[]> {
    try {
      const { data, error } = await supabase
        .from('lost_pets')
        .select(
          `
          *,
          pets (
            name,
            species,
            breed,
            color_markings
          )
        `
        )
        .eq('reported_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        pet: item.pets,
      })) as LostPetAlert[];
    } catch (error) {
      console.error('Error fetching user lost pets:', error);
      return [];
    }
  }

  /**
   * Report a pet as lost (Pro tier only)
   */
  async reportLostPet(params: {
    pet_id: string;
    reported_by: string;
    description?: string;
    last_seen_address?: string;
    last_seen_date?: string;
    contact_email?: string;
    contact_phone?: string;
    photo_urls?: string[];
    reward_amount?: number;
  }): Promise<{ success: boolean; alert?: LostPetAlert; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('lost_pets')
        .insert({
          ...params,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, alert: data as LostPetAlert };
    } catch (error: any) {
      console.error('Error reporting lost pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update lost pet alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: 'active' | 'found' | 'cancelled',
    foundBy?: string
  ): Promise<{ success: boolean }> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'found' && foundBy) {
        updates.found_by = foundBy;
        updates.found_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('lost_pets')
        .update(updates)
        .eq('id', alertId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating alert status:', error);
      return { success: false };
    }
  }

  /**
   * Delete lost pet alert
   */
  async deleteAlert(alertId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('lost_pets')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting alert:', error);
      return { success: false };
    }
  }
}

export default new LostPetService();
