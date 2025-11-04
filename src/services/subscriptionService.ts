import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface SubscriptionFeatures {
  maxPets: number;
  maxFamilyMembers: number;
  photosPerPet: number;
  lostPetReporting: boolean; // Can report lost pets (vs just receive alerts)
  healthRecordExport: boolean; // Export to PDF
  enhancedFamilyCoordination: boolean;
  cloudBackup: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: SubscriptionFeatures;
  popular?: boolean;
}

// Subscription plans configuration - Based on actual app store description
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for single pet owners',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: {
      maxPets: 1,
      maxFamilyMembers: 2, // 2 family members total
      photosPerPet: 1, // 1 photo per pet
      lostPetReporting: false, // Can receive alerts but not report
      healthRecordExport: false,
      enhancedFamilyCoordination: false,
      cloudBackup: true, // Basic backup
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: '3 family members + 2 pet profiles',
    price: {
      monthly: 5.99, // €5.99/month from app store description
      yearly: 50.0, // €50/year from app store description
    },
    features: {
      maxPets: 2, // 2 pet profiles
      maxFamilyMembers: 3, // 3 family members total
      photosPerPet: 12, // 12 photos per pet
      lostPetReporting: true, // Pro tier users can report lost pets
      healthRecordExport: true, // Export health records to PDF
      enhancedFamilyCoordination: true,
      cloudBackup: true,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Unlimited family members + unlimited pets',
    price: {
      monthly: 8.99, // €8.99/month from app store description
      yearly: 80.0, // €80/year from app store description
    },
    features: {
      maxPets: 999, // Unlimited pet profiles
      maxFamilyMembers: 999, // Unlimited family members
      photosPerPet: 12, // 12 photos per pet
      lostPetReporting: true, // Pro tier users can report lost pets
      healthRecordExport: true, // Export health records to PDF
      enhancedFamilyCoordination: true,
      cloudBackup: true,
    },
    popular: true, // Mark Pro as most popular
  },
};

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  subscription_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

class SubscriptionService {
  private currentSubscription: UserSubscription | null = null;
  private readonly CACHE_KEY = 'user_subscription';
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user's current subscription tier
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      // Check cache first
      const cached = await this.getCachedSubscription();
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.subscription;
      }

      // Fetch from users table where subscription status is stored
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, auth_user_id, subscription_status, subscription_expires_at, created_at, updated_at'
        )
        .eq('auth_user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Not found is OK
        console.error('Error fetching subscription:', error);
        return this.getDefaultSubscription(userId);
      }

      const subscription = data
        ? {
            id: data.id,
            user_id: data.auth_user_id || userId,
            tier: this.mapStatusToTier(data.subscription_status),
            status: this.mapDatabaseStatusToSubscriptionStatus(
              data.subscription_status
            ),
            subscription_expires_at: data.subscription_expires_at
              ? new Date(data.subscription_expires_at)
              : undefined,
            created_at: new Date(data.created_at || new Date()),
            updated_at: new Date(data.updated_at || new Date()),
          }
        : this.getDefaultSubscription(userId);

      // Cache the result
      await this.cacheSubscription(subscription);
      this.currentSubscription = subscription;

      return subscription;
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return this.getDefaultSubscription(userId);
    }
  }

  /**
   * Get subscription features for a user
   */
  async getSubscriptionFeatures(userId: string): Promise<SubscriptionFeatures> {
    const subscription = await this.getUserSubscription(userId);
    return SUBSCRIPTION_PLANS[subscription?.tier || 'free'].features;
  }

  /**
   * Check if user can perform a specific action
   */
  async canPerformAction(
    userId: string,
    action: keyof SubscriptionFeatures
  ): Promise<boolean> {
    const features = await this.getSubscriptionFeatures(userId);
    return features[action] as boolean;
  }

  /**
   * Check if user can add more pets
   */
  async canAddPet(userId: string, currentPetCount: number): Promise<boolean> {
    const features = await this.getSubscriptionFeatures(userId);
    return currentPetCount < features.maxPets;
  }

  /**
   * Get maximum pets allowed for user
   */
  async getMaxPetsAllowed(userId: string): Promise<number> {
    const features = await this.getSubscriptionFeatures(userId);
    return features.maxPets;
  }

  /**
   * Get maximum family members allowed for user
   */
  async getMaxFamilyMembersAllowed(userId: string): Promise<number> {
    const features = await this.getSubscriptionFeatures(userId);
    return features.maxFamilyMembers;
  }

  /**
   * Check if user can add more family members
   */
  async canAddFamilyMember(
    userId: string,
    currentFamilyCount: number
  ): Promise<boolean> {
    const features = await this.getSubscriptionFeatures(userId);
    return currentFamilyCount < features.maxFamilyMembers;
  }

  /**
   * Get maximum photos per pet allowed for user
   */
  async getMaxPhotosPerPet(userId: string): Promise<number> {
    const features = await this.getSubscriptionFeatures(userId);
    return features.photosPerPet;
  }

  /**
   * Check if user can add more photos to a pet
   */
  async canAddPhoto(
    userId: string,
    currentPhotoCount: number
  ): Promise<boolean> {
    const features = await this.getSubscriptionFeatures(userId);
    return currentPhotoCount < features.photosPerPet;
  }

  /**
   * Check if user can report lost pets
   */
  async canReportLostPet(userId: string): Promise<boolean> {
    const features = await this.getSubscriptionFeatures(userId);
    return features.lostPetReporting;
  }

  /**
   * Check if user can export health records
   */
  async canExportHealthRecords(userId: string): Promise<boolean> {
    const features = await this.getSubscriptionFeatures(userId);
    return features.healthRecordExport;
  }

  /**
   * Create a new subscription for user (update user_profiles)
   */
  async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    isTrialSubscription: boolean = false
  ): Promise<UserSubscription | null> {
    try {
      const now = new Date();
      const monthlyDays = 30;

      const subscriptionExpiresAt = new Date(
        now.getTime() + monthlyDays * 24 * 60 * 60 * 1000
      );

      const { data, error } = await supabase
        .from('users')
        .update({
          subscription_status: 'premium',
          subscription_expires_at: subscriptionExpiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('auth_user_id', userId)
        .select(
          'id, auth_user_id, subscription_status, subscription_expires_at, created_at, updated_at'
        )
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return null;
      }

      const subscription: UserSubscription = {
        id: data.id,
        user_id: data.auth_user_id || '',
        tier,
        status: this.mapDatabaseStatusToSubscriptionStatus(
          data.subscription_status
        ),
        subscription_expires_at: data.subscription_expires_at
          ? new Date(data.subscription_expires_at)
          : undefined,
        created_at: new Date(data.created_at || new Date()),
        updated_at: new Date(data.updated_at || new Date()),
      };

      // Update cache
      await this.cacheSubscription(subscription);
      this.currentSubscription = subscription;

      return subscription;
    } catch (error) {
      console.error('Error in createSubscription:', error);
      return null;
    }
  }

  /**
   * Upgrade user subscription
   */
  async upgradeSubscription(
    userId: string,
    newTier: SubscriptionTier
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: 'premium',
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error upgrading subscription:', error);
        return false;
      }

      // Clear cache
      await this.clearCache();

      return true;
    } catch (error) {
      console.error('Error in upgradeSubscription:', error);
      return false;
    }
  }

  /**
   * Get subscription plan details
   */
  getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
    return SUBSCRIPTION_PLANS[tier];
  }

  /**
   * Get all available plans
   */
  getAllPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  /**
   * Check if user is on trial
   */
  async isOnTrial(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription || subscription.status !== 'active') {
      return false;
    }

    // Check if subscription expires soon (within 7 days could be considered trial period)
    if (subscription.subscription_expires_at) {
      const now = new Date();
      const daysRemaining =
        (subscription.subscription_expires_at.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24);
      return daysRemaining <= 7 && daysRemaining > 0;
    }

    return false;
  }

  /**
   * Get trial days remaining
   */
  async getTrialDaysRemaining(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription || !subscription.subscription_expires_at) {
      return 0;
    }

    const now = new Date();
    const expiresAt = subscription.subscription_expires_at;

    if (now > expiresAt) {
      return 0;
    }

    const diffTime = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Only consider it trial days if it's within 7 days
    return daysRemaining <= 7 ? daysRemaining : 0;
  }

  // Private helper methods

  private mapStatusToTier(status: string | null): SubscriptionTier {
    // Map database subscription_status to tier
    switch (status) {
      case 'premium':
        return 'premium';
      case 'family':
        return 'pro'; // family = Pro tier
      case 'free':
      case 'cancelled':
      case 'expired':
      case null:
      default:
        return 'free';
    }
  }

  private mapDatabaseStatusToSubscriptionStatus(
    dbStatus: 'free' | 'premium' | 'family' | 'cancelled' | 'expired' | null
  ): 'active' | 'inactive' | 'canceled' | 'past_due' {
    // Map database subscription_status to UserSubscription status
    switch (dbStatus) {
      case 'premium':
      case 'family':
        return 'active';
      case 'cancelled':
        return 'canceled';
      case 'expired':
        return 'past_due';
      case 'free':
      case null:
      default:
        return 'inactive';
    }
  }

  private getDefaultSubscription(userId: string): UserSubscription {
    const now = new Date();
    return {
      id: 'default',
      user_id: userId,
      tier: 'free',
      status: 'inactive',
      created_at: now,
      updated_at: now,
    };
  }

  private async getCachedSubscription(): Promise<{
    subscription: UserSubscription | null;
    timestamp: number;
  } | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async cacheSubscription(
    subscription: UserSubscription | null
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.CACHE_KEY,
        JSON.stringify({
          subscription,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn('Failed to cache subscription:', error);
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_EXPIRY;
  }

  private async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      this.currentSubscription = null;
    } catch (error) {
      console.warn('Failed to clear subscription cache:', error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
