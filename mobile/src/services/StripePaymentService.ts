/**
 * TailTracker Stripe Payment Service
 * 
 * Comprehensive Stripe integration for React Native with:
 * - Subscription management (Premium €7.99/month)
 * - Payment method collection and management
 * - 3D Secure authentication support
 * - Google Pay and Apple Pay integration
 * - Premium feature access controls
 * - Error handling and user feedback
 */

import { Platform } from 'react-native';
import {
  initStripe,
  createPaymentMethod,
  confirmPayment,
  collectBankAccountForPayment,
  createGooglePayPaymentMethod,
  createApplePayPaymentMethod,
  isApplePaySupported,
  isGooglePaySupported,
  presentApplePay,
  presentGooglePay,
  PaymentMethod,
  PaymentIntent,
  SetupIntent,
  ApplePayError,
  GooglePayError,
  StripeError,
} from '@stripe/stripe-react-native';

// Backend API configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://tailtracker-backend.fly.dev';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  priceId: string; // Stripe price ID
}

export interface PaymentMethodInfo {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isPremium: boolean;
  plan?: string;
  expiresAt?: Date;
  willRenew?: boolean;
  trialEndsAt?: Date;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'free';
  features: string[];
}

export interface PurchaseResult {
  success: boolean;
  subscriptionId?: string;
  clientSecret?: string;
  error?: string;
  requiresAction?: boolean;
  paymentIntent?: PaymentIntent;
}

export interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
  declineCode?: string;
}

export class StripePaymentService {
  private static instance: StripePaymentService;
  private isInitialized = false;
  private userId?: string;
  private authToken?: string;

  // TailTracker subscription plans
  static readonly SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
    premium_monthly: {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      description: 'Unlimited pets, lost pet alerts, vaccination reminders',
      price: 799, // €7.99
      currency: 'eur',
      interval: 'month',
      features: [
        'unlimited_pets',
        'unlimited_photos',
        'lost_pet_alerts',
        'vaccination_reminders',
        'medication_tracking',
        'advanced_health_tracking',
        'family_sharing_unlimited',
        'priority_support'
      ],
      priceId: 'price_premium_monthly_799' // Will be updated from backend
    }
  };

  // Sandbox Stripe configuration
  private static readonly STRIPE_CONFIG = {
    publishableKey: __DEV__ 
      ? 'STRIPE_PUBLISHABLE_KEY_HERE'
      : 'pk_live_your_live_publishable_key_here',
    merchantId: 'merchant.com.tailtracker.app',
    urlScheme: 'tailtracker://',
  };

  private constructor() {}

  static getInstance(): StripePaymentService {
    if (!StripePaymentService.instance) {
      StripePaymentService.instance = new StripePaymentService();
    }
    return StripePaymentService.instance;
  }

  /**
   * Initialize Stripe with configuration
   */
  async initialize(userId?: string, authToken?: string): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      await initStripe({
        publishableKey: StripePaymentService.STRIPE_CONFIG.publishableKey,
        merchantIdentifier: StripePaymentService.STRIPE_CONFIG.merchantId,
        urlScheme: StripePaymentService.STRIPE_CONFIG.urlScheme,
        setReturnUrlSchemeOnAndroid: true,
      });

      this.userId = userId;
      this.authToken = authToken;
      this.isInitialized = true;

      console.log('Stripe initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return false;
    }
  }

  /**
   * Update user authentication
   */
  setAuth(userId: string, authToken: string): void {
    this.userId = userId;
    this.authToken = authToken;
  }

  /**
   * Check if device supports Apple Pay
   */
  async isApplePayAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    
    try {
      return await isApplePaySupported();
    } catch (error) {
      console.error('Error checking Apple Pay support:', error);
      return false;
    }
  }

  /**
   * Check if device supports Google Pay
   */
  async isGooglePayAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await isGooglePaySupported({
        testEnv: __DEV__,
      });
    } catch (error) {
      console.error('Error checking Google Pay support:', error);
      return false;
    }
  }

  /**
   * Create payment method with card details
   */
  async createCardPaymentMethod(cardDetails: any): Promise<{ paymentMethod?: PaymentMethod; error?: StripeError }> {
    try {
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: cardDetails,
      });

      if (error) {
        return { error };
      }

      return { paymentMethod };
    } catch (error) {
      return { error: error as StripeError };
    }
  }

  /**
   * Create Apple Pay payment method
   */
  async createApplePayPaymentMethod(amount: number, currency: string = 'eur'): Promise<{ paymentMethod?: PaymentMethod; error?: ApplePayError }> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Pay is only available on iOS');
      }

      const { paymentMethod, error } = await createApplePayPaymentMethod({
        paymentSummaryItems: [
          {
            label: 'TailTracker Premium',
            amount: (amount / 100).toFixed(2),
          },
        ],
        merchantIdentifier: StripePaymentService.STRIPE_CONFIG.merchantId,
        countryCode: 'DE',
        currencyCode: currency.toUpperCase(),
      });

      if (error) {
        return { error };
      }

      return { paymentMethod };
    } catch (error) {
      return { error: error as ApplePayError };
    }
  }

  /**
   * Create Google Pay payment method
   */
  async createGooglePayPaymentMethod(amount: number, currency: string = 'eur'): Promise<{ paymentMethod?: PaymentMethod; error?: GooglePayError }> {
    try {
      if (Platform.OS !== 'android') {
        throw new Error('Google Pay is only available on Android');
      }

      const { paymentMethod, error } = await createGooglePayPaymentMethod({
        amount: amount,
        currencyCode: currency.toUpperCase(),
        countryCode: 'DE',
        testEnv: __DEV__,
      });

      if (error) {
        return { error };
      }

      return { paymentMethod };
    } catch (error) {
      return { error: error as GooglePayError };
    }
  }

  /**
   * Get subscription status from backend
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      if (!this.userId || !this.authToken) {
        return this.getFreeSubscriptionStatus();
      }

      const response = await fetch(`${API_BASE_URL}/api/subscriptions/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      
      return {
        isActive: data.status === 'active' || data.status === 'trialing',
        isPremium: data.status === 'active' || data.status === 'trialing',
        plan: data.plan,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        willRenew: data.willRenew,
        trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
        status: data.status || 'free',
        features: data.features || StripePaymentService.SUBSCRIPTION_PLANS.premium_monthly.features,
      };
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return this.getFreeSubscriptionStatus();
    }
  }

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return Object.values(StripePaymentService.SUBSCRIPTION_PLANS);
  }

  /**
   * Create subscription with payment method
   */
  async createSubscription(planId: string, paymentMethodId: string): Promise<PurchaseResult> {
    try {
      if (!this.userId || !this.authToken) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const plan = StripePaymentService.SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        return {
          success: false,
          error: 'Invalid subscription plan',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to create subscription',
        };
      }

      const data = await response.json();

      // Handle 3D Secure authentication if required
      if (data.clientSecret && data.requiresAction) {
        const { error: confirmError } = await confirmPayment(data.clientSecret, {
          paymentMethodType: 'Card',
        });

        if (confirmError) {
          return {
            success: false,
            error: confirmError.message,
          };
        }
      }

      return {
        success: true,
        subscriptionId: data.subscriptionId,
        clientSecret: data.clientSecret,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(immediately: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.userId || !this.authToken) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          immediately,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to cancel subscription',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.userId || !this.authToken) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/subscriptions/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to reactivate subscription',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(): Promise<{ paymentMethods: PaymentMethodInfo[]; error?: string }> {
    try {
      if (!this.userId || !this.authToken) {
        return {
          paymentMethods: [],
          error: 'User not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/payment-methods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          paymentMethods: [],
          error: errorData.message || 'Failed to fetch payment methods',
        };
      }

      const data = await response.json();
      
      return {
        paymentMethods: data.paymentMethods || [],
      };
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return {
        paymentMethods: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.userId || !this.authToken) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/payment-methods/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to add payment method',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.userId || !this.authToken) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/payment-methods/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to remove payment method',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.userId || !this.authToken) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/payment-methods/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to set default payment method',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if user has premium access
   */
  async hasPremiumAccess(): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();
      return status.isPremium;
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  }

  /**
   * Check if user can access specific feature
   */
  async canAccessFeature(feature: string): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();
      return status.features.includes(feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get billing portal URL for subscription management
   */
  async getBillingPortalUrl(returnUrl?: string): Promise<{ url?: string; error?: string }> {
    try {
      if (!this.userId || !this.authToken) {
        return {
          error: 'User not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/billing/portal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: returnUrl || 'tailtracker://subscription',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: errorData.message || 'Failed to get billing portal URL',
        };
      }

      const data = await response.json();
      
      return {
        url: data.url,
      };
    } catch (error) {
      console.error('Error getting billing portal URL:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Parse Stripe error for user-friendly message
   */
  parseStripeError(error: StripeError): PaymentError {
    const errorCode = error.code || 'unknown_error';
    const errorMessage = error.message || 'An unknown error occurred';

    // Map common Stripe error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'card_declined': 'Your card was declined. Please try a different payment method.',
      'insufficient_funds': 'Your card has insufficient funds. Please try a different payment method.',
      'incorrect_cvc': 'Your card\'s security code is incorrect. Please check and try again.',
      'expired_card': 'Your card has expired. Please try a different payment method.',
      'incorrect_number': 'Your card number is incorrect. Please check and try again.',
      'processing_error': 'An error occurred processing your card. Please try again.',
      'authentication_required': 'Your payment requires authentication. Please complete the verification.',
      'setup_intent_authentication_failure': 'Payment authentication failed. Please try again.',
      'payment_intent_authentication_failure': 'Payment authentication failed. Please try again.',
    };

    return {
      code: errorCode,
      message: errorMessages[errorCode] || errorMessage,
      type: this.getErrorType(errorCode),
      declineCode: error.declineCode,
    };
  }

  /**
   * Get error type from error code
   */
  private getErrorType(errorCode: string): PaymentError['type'] {
    const cardErrors = ['card_declined', 'insufficient_funds', 'incorrect_cvc', 'expired_card', 'incorrect_number'];
    const validationErrors = ['incorrect_number', 'invalid_expiry_month', 'invalid_expiry_year', 'invalid_cvc'];
    const authErrors = ['authentication_required', 'setup_intent_authentication_failure', 'payment_intent_authentication_failure'];

    if (cardErrors.includes(errorCode)) {
      return 'card_error';
    } else if (validationErrors.includes(errorCode)) {
      return 'validation_error';
    } else if (authErrors.includes(errorCode)) {
      return 'authentication_error';
    } else {
      return 'api_error';
    }
  }

  /**
   * Get free subscription status
   */
  private getFreeSubscriptionStatus(): SubscriptionStatus {
    return {
      isActive: false,
      isPremium: false,
      status: 'free',
      features: [
        'basic_profiles',
        'basic_vaccination_tracking'
      ],
    };
  }

  /**
   * Validate subscription limits for resource access
   */
  async validateResourceAccess(resource: string, currentCount: number = 0): Promise<{
    allowed: boolean;
    limit?: number;
    message: string;
    requiresPremium: boolean;
  }> {
    try {
      const status = await this.getSubscriptionStatus();
      
      // Free tier limits
      const freeLimits: Record<string, number> = {
        pets: 1,
        photos_per_pet: 1,
        family_members: 1,
      };

      const limit = freeLimits[resource];
      
      // If user has premium, allow unlimited access
      if (status.isPremium) {
        return {
          allowed: true,
          message: 'Premium access allows unlimited usage',
          requiresPremium: false,
        };
      }

      // Check if resource has limits
      if (limit === undefined) {
        return {
          allowed: true,
          message: 'No limits for this resource',
          requiresPremium: false,
        };
      }

      // Check if user has reached the limit
      const allowed = currentCount < limit;
      
      return {
        allowed,
        limit,
        message: allowed 
          ? `You can add ${limit - currentCount} more ${resource}`
          : `You've reached the limit of ${limit} ${resource}. Upgrade to Premium for unlimited access.`,
        requiresPremium: !allowed,
      };
    } catch (error) {
      console.error('Error validating resource access:', error);
      return {
        allowed: false,
        message: 'Unable to verify access limits',
        requiresPremium: true,
      };
    }
  }
}

export default StripePaymentService;