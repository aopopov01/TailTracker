/**
 * User Service - Handle user profile data and operations
 */

import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

class UserService {
  /**
   * Get user profile by auth user ID
   */
  async getUserProfile(authUserId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // NOTE: Convert null to undefined for optional fields to match UserProfile type
      return data
        ? ({
            ...data,
            first_name: data.first_name || undefined,
            last_name: data.last_name || undefined,
            full_name: data.full_name || undefined,
          } as UserProfile)
        : null;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Get user's first name
   */
  async getUserFirstName(authUserId: string): Promise<string | null> {
    try {
      const profile = await this.getUserProfile(authUserId);
      return profile?.first_name || null;
    } catch (error) {
      console.error('Error getting user first name:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    authUserId: string,
    updates: Partial<
      Pick<UserProfile, 'first_name' | 'last_name' | 'full_name'>
    >
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', authUserId);

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  /**
   * Create user profile (called after registration)
   */
  async createUserProfile(
    authUserId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ): Promise<boolean> {
    try {
      const fullName =
        firstName && lastName ? `${firstName} ${lastName}` : firstName || '';

      const { error } = await supabase.from('users').insert({
        auth_user_id: authUserId,
        email,
        first_name: firstName || '',
        last_name: lastName || '',
        full_name: fullName,
        subscription_status: 'free',
      });

      if (error) {
        console.error('Error creating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return false;
    }
  }
}

export const userService = new UserService();
export default userService;
