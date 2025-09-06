/**
 * TailTracker Payment Initialization Service
 * 
 * Handles initialization of payment services during app startup
 * Ensures proper Stripe and billing service configuration
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStoreBillingService } from './AppStoreBillingService';
import { StripePaymentService } from './StripePaymentService';

export interface PaymentInitializationResult {
  success: boolean;
  error?: string;
  stripeInitialized: boolean;
  billingInitialized: boolean;
}

export class PaymentInitializationService {
  private static instance: PaymentInitializationService;
  private isInitialized = false;

  // RevenueCat API keys (for iOS App Store compliance)
  private static readonly REVENUECAT_KEYS = {
    ios: __DEV__ ? 'appl_your_test_key_here' : 'appl_your_prod_key_here',
    android: __DEV__ ? 'goog_your_test_key_here' : 'goog_your_prod_key_here',
  };

  private constructor() {}

  static getInstance(): PaymentInitializationService {
    if (!PaymentInitializationService.instance) {
      PaymentInitializationService.instance = new PaymentInitializationService();
    }
    return PaymentInitializationService.instance;
  }

  /**
   * Initialize all payment services
   */
  async initializePaymentServices(userId?: string, authToken?: string): Promise<PaymentInitializationResult> {
    if (this.isInitialized) {
      return {
        success: true,
        stripeInitialized: true,
        billingInitialized: true,
      };
    }

    try {
      console.log('Initializing payment services...');

      // Initialize Stripe payment service (cross-platform)
      const stripeService = StripePaymentService.getInstance();
      const stripeInitialized = await stripeService.initialize(userId, authToken);

      if (!stripeInitialized) {
        console.warn('Failed to initialize Stripe service');
        return {
          success: false,
          error: 'Failed to initialize Stripe payment service',
          stripeInitialized: false,
          billingInitialized: false,
        };
      }

      // Initialize platform-specific billing service
      const billingService = AppStoreBillingService.getInstance();
      const revenueCatKey = Platform.OS === 'ios' 
        ? PaymentInitializationService.REVENUECAT_KEYS.ios
        : PaymentInitializationService.REVENUECAT_KEYS.android;

      const billingInitialized = await billingService.initialize(
        revenueCatKey,
        userId,
        authToken
      );

      if (!billingInitialized) {
        console.warn('Failed to initialize billing service, but Stripe is working');
        // Don't fail completely if RevenueCat fails - Stripe can handle payments
      }

      // Cache initialization status
      await this.cacheInitializationStatus(true);

      this.isInitialized = true;

      console.log('Payment services initialized successfully', {
        stripe: stripeInitialized,
        billing: billingInitialized,
      });

      return {
        success: true,
        stripeInitialized,
        billingInitialized,
      };
    } catch (error) {
      console.error('Error initializing payment services:', error);
      
      await this.cacheInitializationStatus(false);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stripeInitialized: false,
        billingInitialized: false,
      };
    }
  }

  /**
   * Update user authentication for payment services
   */
  async updateUserAuth(userId: string, authToken: string): Promise<void> {
    try {
      // Update Stripe service auth
      const stripeService = StripePaymentService.getInstance();
      stripeService.setAuth(userId, authToken);

      // Update billing service for iOS
      if (Platform.OS === 'ios') {
        const billingService = AppStoreBillingService.getInstance();
        await billingService.loginUser(userId);
      }

      console.log('Payment services auth updated for user:', userId);
    } catch (error) {
      console.error('Error updating payment services auth:', error);
    }
  }

  /**
   * Clear user authentication from payment services
   */
  async clearUserAuth(): Promise<void> {
    try {
      // Clear Stripe service auth
      const stripeService = StripePaymentService.getInstance();
      stripeService.setAuth('', '');

      // Logout from billing service on iOS
      if (Platform.OS === 'ios') {
        const billingService = AppStoreBillingService.getInstance();
        await billingService.logoutUser();
      }

      console.log('Payment services auth cleared');
    } catch (error) {
      console.error('Error clearing payment services auth:', error);
    }
  }

  /**
   * Check if payment services are available and working
   */
  async checkPaymentServicesHealth(): Promise<{
    stripe: boolean;
    billing: boolean;
    overall: boolean;
  }> {
    try {
      // Check Stripe service
      const stripeService = StripePaymentService.getInstance();
      let stripeHealthy = false;
      try {
        // Try to get subscription status as health check
        await stripeService.getSubscriptionStatus();
        stripeHealthy = true;
      } catch (error) {
        console.warn('Stripe service health check failed:', error);
      }

      // Check billing service
      let billingHealthy = false;
      try {
        const billingService = AppStoreBillingService.getInstance();
        await billingService.hasActiveSubscription();
        billingHealthy = true;
      } catch (error) {
        console.warn('Billing service health check failed:', error);
      }

      const overall = stripeHealthy; // Stripe is primary, billing is secondary

      return {
        stripe: stripeHealthy,
        billing: billingHealthy,
        overall,
      };
    } catch (error) {
      console.error('Error checking payment services health:', error);
      return {
        stripe: false,
        billing: false,
        overall: false,
      };
    }
  }

  /**
   * Get payment service capabilities
   */
  async getPaymentCapabilities(): Promise<{
    applePay: boolean;
    googlePay: boolean;
    creditCard: boolean;
    subscriptions: boolean;
  }> {
    try {
      const stripeService = StripePaymentService.getInstance();

      const [applePay, googlePay] = await Promise.all([
        stripeService.isApplePayAvailable(),
        stripeService.isGooglePayAvailable(),
      ]);

      return {
        applePay,
        googlePay,
        creditCard: true, // Always supported via Stripe
        subscriptions: true, // Always supported via Stripe
      };
    } catch (error) {
      console.error('Error getting payment capabilities:', error);
      return {
        applePay: false,
        googlePay: false,
        creditCard: true,
        subscriptions: true,
      };
    }
  }

  /**
   * Handle payment service errors gracefully
   */
  handlePaymentServiceError(error: any, context: string): {
    shouldRetry: boolean;
    userMessage: string;
    fallbackAvailable: boolean;
  } {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    // Network-related errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('connection')) {
      return {
        shouldRetry: true,
        userMessage: 'Connection issue. Please check your internet and try again.',
        fallbackAvailable: false,
      };
    }

    // Payment method errors
    if (errorMessage.includes('card') || 
        errorMessage.includes('payment method')) {
      return {
        shouldRetry: false,
        userMessage: 'There was an issue with your payment method. Please try a different card.',
        fallbackAvailable: true,
      };
    }

    // API/Server errors
    if (errorMessage.includes('api') || 
        errorMessage.includes('server') || 
        errorMessage.includes('500')) {
      return {
        shouldRetry: true,
        userMessage: 'Our payment service is temporarily unavailable. Please try again.',
        fallbackAvailable: false,
      };
    }

    // Authentication errors
    if (errorMessage.includes('auth') || 
        errorMessage.includes('unauthorized')) {
      return {
        shouldRetry: false,
        userMessage: 'Please log in again and try your purchase.',
        fallbackAvailable: false,
      };
    }

    // Default error handling
    return {
      shouldRetry: false,
      userMessage: 'An unexpected error occurred. Please try again or contact support.',
      fallbackAvailable: false,
    };
  }

  /**
   * Cache initialization status for faster app startup
   */
  private async cacheInitializationStatus(success: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('payment_services_initialized', JSON.stringify({
        success,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('Failed to cache payment initialization status:', error);
    }
  }

  /**
   * Get cached initialization status
   */
  private async getCachedInitializationStatus(): Promise<{ success: boolean; timestamp: string } | null> {
    try {
      const cached = await AsyncStorage.getItem('payment_services_initialized');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to get cached payment initialization status:', error);
      return null;
    }
  }

  /**
   * Reset payment services (for debugging or error recovery)
   */
  async resetPaymentServices(): Promise<void> {
    try {
      this.isInitialized = false;
      await AsyncStorage.removeItem('payment_services_initialized');
      console.log('Payment services reset');
    } catch (error) {
      console.error('Error resetting payment services:', error);
    }
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export default PaymentInitializationService;