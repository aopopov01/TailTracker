/**
 * Database Service Layer for TailTracker
 * Provides centralized database operations with Supabase integration
 */

import { supabase } from '../lib/supabase';
import { User, Pet, PetPhoto, FamilyMembership } from '../types';
import { ServiceHelpers, handleServiceError } from '../utils/serviceHelpers';

export interface DatabaseUser {
  id: number;
  auth_user_id: string;
  email: string;
  full_name?: string;
  subscription_status: 'free' | 'premium' | 'family';
  created_at: string;
  updated_at: string;
}

export interface DatabasePet {
  id: number;
  user_id: number;
  family_id?: number;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  microchip_id?: string;
  weight?: number;
  color?: string;
  medical_conditions?: string[];
  dietary_restrictions?: string[];
  photo_url?: string;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateUserData {
  auth_user_id: string;
  email: string;
  full_name?: string;
  subscription_status?: 'free' | 'premium' | 'family';
}

export interface UpdateUserData {
  full_name?: string;
  subscription_status?: 'free' | 'premium' | 'family';
}

export interface CreatePetData {
  user_id: number;
  family_id?: number;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  microchip_id?: string;
  weight?: number;
  color?: string;
  medical_conditions?: string[];
  dietary_restrictions?: string[];
  photo_url?: string;
}

export interface UpdatePetData {
  name?: string;
  species?: string;
  breed?: string;
  birth_date?: string;
  microchip_id?: string;
  weight?: number;
  color?: string;
  medical_conditions?: string[];
  dietary_restrictions?: string[];
  photo_url?: string;
  is_lost?: boolean;
}

export class DatabaseService {
  private static instance: DatabaseService;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // User Management Methods
  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw error;
      }

      return data as DatabaseUser;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch user by email');
    }
  }

  async getUserById(id: number): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw error;
      }

      return data as DatabaseUser;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch user by ID');
    }
  }

  async getUserByAuthId(authUserId: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw error;
      }

      return data as DatabaseUser;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch user by auth ID');
    }
  }

  async createUser(userData: CreateUserData): Promise<DatabaseUser> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          auth_user_id: userData.auth_user_id,
          email: userData.email,
          full_name: userData.full_name,
          subscription_status: userData.subscription_status || 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return data as DatabaseUser;
    } catch (error) {
      throw handleServiceError(error, 'Failed to create user');
    }
  }

  async updateUser(userId: number, userData: UpdateUserData): Promise<DatabaseUser> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return data as DatabaseUser;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update user');
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to delete user');
    }
  }

  /**
   * Updates the auth_user_id for an existing user (for linking existing profiles)
   */
  async updateUserAuthId(userId: number, authUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ auth_user_id: authUserId })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update user auth ID');
    }
  }

  // Pet Management Methods
  async getPetsByUserId(userId: number, includeFamily: boolean = false): Promise<DatabasePet[]> {
    try {
      let query = supabase
        .from('pets')
        .select('*')
        .is('deleted_at', null);

      if (includeFamily) {
        // Include pets from family memberships
        query = query.or(`user_id.eq.${userId},family_id.in.(SELECT family_id FROM family_memberships WHERE user_id = ${userId})`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data as DatabasePet[]) || [];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch pets');
    }
  }

  async getPetById(petId: number): Promise<DatabasePet | null> {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Pet not found
        }
        throw error;
      }

      return data as DatabasePet;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch pet');
    }
  }

  async createPet(petData: CreatePetData): Promise<DatabasePet> {
    try {
      const { data, error } = await supabase
        .from('pets')
        .insert([{
          ...petData,
          is_lost: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return data as DatabasePet;
    } catch (error) {
      throw handleServiceError(error, 'Failed to create pet');
    }
  }

  async updatePet(petId: number, petData: UpdatePetData): Promise<DatabasePet> {
    try {
      const { data, error } = await supabase
        .from('pets')
        .update({
          ...petData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', petId)
        .select()
        .single();

      if (error) throw error;

      return data as DatabasePet;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update pet');
    }
  }

  async softDeletePet(petId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('pets')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', petId);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to delete pet');
    }
  }

  async hardDeletePet(petId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to permanently delete pet');
    }
  }

  // Pet Photo Methods
  async getPetPhotos(petId: number): Promise<PetPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('pet_photos')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as PetPhoto[]) || [];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch pet photos');
    }
  }

  async createPetPhoto(petId: number, photoUrl: string, metadata?: any): Promise<PetPhoto> {
    try {
      const { data, error } = await supabase
        .from('pet_photos')
        .insert([{
          pet_id: petId,
          photo_url: photoUrl,
          metadata: metadata,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return data as PetPhoto;
    } catch (error) {
      throw handleServiceError(error, 'Failed to create pet photo');
    }
  }

  async deletePetPhoto(photoId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('pet_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to delete pet photo');
    }
  }

  // Family Sharing Methods
  async getFamilyMemberships(userId: number): Promise<FamilyMembership[]> {
    try {
      const { data, error } = await supabase
        .from('family_memberships')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return (data as FamilyMembership[]) || [];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch family memberships');
    }
  }

  async createFamilyMembership(familyId: number, userId: number, role: string = 'member'): Promise<FamilyMembership> {
    try {
      const { data, error } = await supabase
        .from('family_memberships')
        .insert([{
          family_id: familyId,
          user_id: userId,
          role: role,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return data as FamilyMembership;
    } catch (error) {
      throw handleServiceError(error, 'Failed to create family membership');
    }
  }

  // Search and Filter Methods
  async searchPets(userId: number, searchTerm: string, includeFamily: boolean = false): Promise<DatabasePet[]> {
    try {
      let query = supabase
        .from('pets')
        .select('*')
        .is('deleted_at', null)
        .ilike('name', `%${searchTerm}%`);

      if (includeFamily) {
        query = query.or(`user_id.eq.${userId},family_id.in.(SELECT family_id FROM family_memberships WHERE user_id = ${userId})`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;

      return (data as DatabasePet[]) || [];
    } catch (error) {
      throw handleServiceError(error, 'Failed to search pets');
    }
  }

  async getLostPets(userId: number, includeFamily: boolean = false): Promise<DatabasePet[]> {
    try {
      let query = supabase
        .from('pets')
        .select('*')
        .eq('is_lost', true)
        .is('deleted_at', null);

      if (includeFamily) {
        query = query.or(`user_id.eq.${userId},family_id.in.(SELECT family_id FROM family_memberships WHERE user_id = ${userId})`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      return (data as DatabasePet[]) || [];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch lost pets');
    }
  }

  // Analytics and Statistics
  async getUserStats(userId: number): Promise<{
    totalPets: number;
    lostPets: number;
    familyMemberships: number;
    totalPhotos: number;
  }> {
    try {
      // Get pets count
      const { count: totalPets, error: petsError } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (petsError) throw petsError;

      // Get lost pets count
      const { count: lostPets, error: lostError } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_lost', true)
        .is('deleted_at', null);

      if (lostError) throw lostError;

      // Get family memberships count
      const { count: familyMemberships, error: familyError } = await supabase
        .from('family_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (familyError) throw familyError;

      // Get total photos count
      const { count: totalPhotos, error: photosError } = await supabase
        .from('pet_photos')
        .select('*', { count: 'exact', head: true })
        .in('pet_id', (
          await supabase
            .from('pets')
            .select('id')
            .eq('user_id', userId)
            .is('deleted_at', null)
        ).data?.map(p => p.id) || []);

      if (photosError) throw photosError;

      return {
        totalPets: totalPets || 0,
        lostPets: lostPets || 0,
        familyMemberships: familyMemberships || 0,
        totalPhotos: totalPhotos || 0,
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch user statistics');
    }
  }

  // Subscription and Limits
  async checkUserSubscriptionLimits(userId: number): Promise<{
    canAddMorePets: boolean;
    petLimit: number;
    currentPetCount: number;
    hasFamily: boolean;
  }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      const { count: currentPetCount, error } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) throw error;

      const petLimit = user.subscription_status === 'free' ? 3 : 
                      user.subscription_status === 'premium' ? 25 : 100;

      return {
        canAddMorePets: (currentPetCount || 0) < petLimit,
        petLimit,
        currentPetCount: currentPetCount || 0,
        hasFamily: user.subscription_status === 'family',
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to check subscription limits');
    }
  }

  // Health Check and Connectivity
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; timestamp: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      if (error) throw error;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Batch Operations for Offline Sync
  async batchCreatePets(pets: CreatePetData[]): Promise<DatabasePet[]> {
    try {
      const { data, error } = await supabase
        .from('pets')
        .insert(pets.map(pet => ({
          ...pet,
          is_lost: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })))
        .select();

      if (error) throw error;

      return (data as DatabasePet[]) || [];
    } catch (error) {
      throw handleServiceError(error, 'Failed to batch create pets');
    }
  }

  async batchUpdatePets(updates: { id: number; data: UpdatePetData }[]): Promise<DatabasePet[]> {
    try {
      const results: DatabasePet[] = [];

      for (const update of updates) {
        const result = await this.updatePet(update.id, update.data);
        results.push(result);
      }

      return results;
    } catch (error) {
      throw handleServiceError(error, 'Failed to batch update pets');
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
export default databaseService;