// Stripe Payment Service - Stub implementation for simplified feature set
import { initStripe, useStripe } from '@stripe/stripe-react-native';
import Config from '../config/config';

export interface StripeSubscription {
  id: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  plan: string;
  current_period_start: Date;
  current_period_end: Date;
  success?: boolean;
  error?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  success?: boolean;
  error?: string;
}

export interface CreateSubscriptionParams {
  planId: string;
  paymentMethodId: string;
  userId: string;
}

// Subscription plan interface
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  description?: string;
  features: string[];
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: string | null;
  currentPeriodEnd: Date | null;
  status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
  cancelAtPeriodEnd: boolean;
  isPremium: boolean;
  features: string[];
}

export class StripePaymentService {
  private static instance: StripePaymentService;
  private isInitialized: boolean = false;

  public static getInstance(): StripePaymentService {
    if (!StripePaymentService.instance) {
      StripePaymentService.instance = new StripePaymentService();
    }
    return StripePaymentService.instance;
  }

  /**
   * Initialize Stripe with publishable key
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const publishableKey = Config.STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }

      await initStripe({
        publishableKey,
        merchantIdentifier: Config.APPLE_MERCHANT_ID || 'merchant.com.tailtracker.app',
      });

      this.isInitialized = true;
      console.log('StripePaymentService: Successfully initialized');
    } catch (error) {
      console.error('StripePaymentService: Failed to initialize', error);
      throw error;
    }
  }

  /**
   * Create subscription with real Stripe integration
   */
  async createSubscriptionWithParams(params: CreateSubscriptionParams): Promise<StripeSubscription> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Call backend API to create subscription with Stripe
      const response = await fetch(`${Config.API_BASE_URL}/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          planId: params.planId,
          paymentMethodId: params.paymentMethodId,
          userId: params.userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create subscription: ${response.statusText}`);
      }

      const subscription = await response.json();
      
      return {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan.id,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      console.error('StripePaymentService: Failed to create subscription', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${Config.API_BASE_URL}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('StripePaymentService: Failed to cancel subscription', error);
      return false;
    }
  }

  /**
   * Get specific subscription by ID from backend
   */
  async getSubscriptionById(subscriptionId: string): Promise<StripeSubscription | null> {
    try {
      const response = await fetch(`${Config.API_BASE_URL}/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const subscription = await response.json();
      
      return {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan.id,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      console.error('StripePaymentService: Failed to get subscription status', error);
      return null;
    }
  }

  /**
   * Add new payment method via Stripe
   */
  async addPaymentMethod(paymentMethodId?: string): Promise<StripePaymentMethod> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // In a real implementation, this would use Stripe's createPaymentMethod
      // and then save it to the customer via backend API
      const response = await fetch(`${Config.API_BASE_URL}/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }

      const paymentMethod = await response.json();
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        success: true,
      };
    } catch (error) {
      console.error('StripePaymentService: Failed to add payment method', error);
      return {
        id: '',
        type: 'card',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add payment method',
      };
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await fetch(`${Config.API_BASE_URL}/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('StripePaymentService: Failed to remove payment method', error);
      return false;
    }
  }

  /**
   * Get user's payment methods
   */
  async getPaymentMethods(): Promise<StripePaymentMethod[]> {
    try {
      const response = await fetch(`${Config.API_BASE_URL}/payment-methods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
      }));
    } catch (error) {
      console.error('StripePaymentService: Failed to get payment methods', error);
      return [];
    }
  }

  /**
   * Simple resource access validation (legacy method)
   */
  async validateSimpleResourceAccess(userId: string, resource: string): Promise<boolean> {
    try {
      // Use the enhanced validation and return just the allowed status
      const result = await this.validateResourceAccess(resource, 0);
      return result.allowed;
    } catch (error) {
      console.error('StripePaymentService: Failed to validate resource access', error);
      return false; // Deny access on error for security
    }
  }

  /**
   * Get current user's subscription status - convenience method without requiring subscription ID
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await fetch(`${Config.API_BASE_URL}/subscriptions/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        return {
          isActive: false,
          plan: null,
          currentPeriodEnd: null,
          status: 'inactive',
          cancelAtPeriodEnd: false,
          isPremium: false,
          features: [],
        };
      }

      const data = await response.json();
      const isActive = data.status === 'active';
      const plan = data.plan?.id || null;
      const isPremium = isActive && (plan === 'premium' || plan === 'pro');
      
      // Define features based on plan
      const features: string[] = [];
      if (plan === 'premium' || plan === 'pro') {
        features.push('lost_pet_alerts', 'family_sharing', 'enhanced_photos');
      }
      if (plan === 'pro') {
        features.push('unlimited_pets', 'priority_support');
      }
      
      return {
        isActive,
        plan,
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end * 1000) : null,
        status: data.status || 'inactive',
        cancelAtPeriodEnd: data.cancel_at_period_end || false,
        isPremium,
        features,
      };
    } catch (error) {
      console.error('StripePaymentService: Failed to get subscription status', error);
      return {
        isActive: false,
        plan: null,
        currentPeriodEnd: null,
        status: 'inactive',
        cancelAtPeriodEnd: false,
        isPremium: false,
        features: [],
      };
    }
  }

  /**
   * Validate resource access with detailed response
   */
  async validateResourceAccess(resource: string, currentCount: number = 0): Promise<{
    allowed: boolean;
    limit?: number;
    message: string;
    requiresPremium: boolean;
  }> {
    try {
      const status = await this.getSubscriptionStatus();
      
      // Define resource limits based on subscription tiers
      const resourceLimits: Record<string, Record<string, { limit?: number; requiresPremium: boolean }>> = {
        'free': {
          'pets': { limit: 1, requiresPremium: false },
          'photos_per_pet': { limit: 1, requiresPremium: false },
          'lost_pet_alerts': { requiresPremium: true },
          'family_sharing': { limit: 2, requiresPremium: false },
        },
        'premium': {
          'pets': { limit: 2, requiresPremium: false },
          'photos_per_pet': { limit: 6, requiresPremium: false },
          'lost_pet_alerts': { requiresPremium: true },
          'family_sharing': { limit: 3, requiresPremium: false },
        },
        'pro': {
          'pets': { requiresPremium: false }, // unlimited
          'photos_per_pet': { limit: 12, requiresPremium: false },
          'lost_pet_alerts': { requiresPremium: false },
          'family_sharing': { requiresPremium: false }, // unlimited
        }
      };

      const userTier = status.isActive && status.plan ? status.plan : 'free';
      const limits = resourceLimits[userTier] || resourceLimits['free'];
      const resourceConfig = limits[resource];

      if (!resourceConfig) {
        return {
          allowed: true,
          message: 'Resource access allowed',
          requiresPremium: false,
        };
      }

      if (resourceConfig.requiresPremium && userTier === 'free') {
        return {
          allowed: false,
          message: 'This feature requires a premium subscription',
          requiresPremium: true,
        };
      }

      if (resourceConfig.limit && currentCount >= resourceConfig.limit) {
        return {
          allowed: false,
          limit: resourceConfig.limit,
          message: `You've reached the limit of ${resourceConfig.limit} for this feature`,
          requiresPremium: userTier === 'free',
        };
      }

      return {
        allowed: true,
        limit: resourceConfig.limit,
        message: 'Access granted',
        requiresPremium: false,
      };
    } catch (error) {
      console.error('StripePaymentService: Failed to validate resource access', error);
      return {
        allowed: false,
        message: 'Unable to verify access at this time',
        requiresPremium: false,
      };
    }
  }

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'basic_monthly',
        name: 'Basic Monthly',
        price: 999, // $9.99 in cents
        currency: 'USD',
        interval: 'month',
        description: 'Basic features for pet management',
        features: ['Basic pet profiles', 'Vaccination tracking', 'Basic notifications'],
      },
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 1999, // $19.99 in cents
        currency: 'USD',
        interval: 'month',
        description: 'All features including lost pet alerts',
        features: ['All basic features', 'Lost pet alerts', 'Premium notifications', 'Advanced tracking'],
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 19999, // $199.99 in cents
        currency: 'USD',
        interval: 'year',
        description: 'Best value - Premium features billed annually',
        features: ['All premium features', '2 months free'],
      },
    ];
  }

  /**
   * Create Apple Pay payment method
   */
  async createApplePayPaymentMethod(amount: number, currency: string): Promise<{
    paymentMethod?: StripePaymentMethod;
    error?: any;
  }> {
    try {
      // Mock Apple Pay implementation
      const paymentMethod = {
        id: 'pm_applepay_' + Math.random().toString(36).substring(7),
        type: 'card' as const,
        success: true,
      };
      return { paymentMethod };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Create Google Pay payment method
   */
  async createGooglePayPaymentMethod(amount: number, currency: string): Promise<{
    paymentMethod?: StripePaymentMethod;
    error?: any;
  }> {
    try {
      // Mock Google Pay implementation
      const paymentMethod = {
        id: 'pm_googlepay_' + Math.random().toString(36).substring(7),
        type: 'card' as const,
        success: true,
      };
      return { paymentMethod };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Parse Stripe errors
   */
  parseStripeError(error: any): { message: string; code?: string } {
    if (error.message) {
      return { message: error.message, code: error.code };
    }
    return { message: 'An unknown error occurred', code: 'unknown' };
  }

  /**
   * Create subscription with proper return type
   */
  async createSubscription(planId: string, paymentMethodId: string): Promise<StripeSubscription> {
    try {
      // Implementation would depend on your Stripe setup
      const subscription = {
        id: 'sub_' + Math.random().toString(36).substring(7),
        status: 'active' as const,
        plan: planId,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
        success: true,
      };
      return subscription;
    } catch (error) {
      return {
        id: '',
        status: 'inactive' as const,
        plan: '',
        current_period_start: new Date(),
        current_period_end: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      };
    }
  }

  /**
   * Get authentication token from auth service
   */
  private async getAuthToken(): Promise<string> {
    // This needs to be connected to the actual auth service
    // For now, return a placeholder - this is a critical security integration point
    return 'user_auth_token_placeholder';
  }
}

export default StripePaymentService;