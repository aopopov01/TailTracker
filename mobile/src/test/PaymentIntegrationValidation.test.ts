/**
 * TailTracker Payment Integration Validation Tests
 * 
 * These tests validate the complete payment integration setup
 * Run with: npm test PaymentIntegrationValidation.test.ts
 */

import { StripePaymentService } from '../services/StripePaymentService';
import { AppStoreBillingService } from '../services/AppStoreBillingService';
import { PaymentInitializationService } from '../services/PaymentInitializationService';
import { PaymentErrorUtils } from '../utils/paymentErrorUtils';
import { renderHook, act } from '@testing-library/react-native';
import { usePremiumAccess } from '../hooks/usePremiumAccess';

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  initStripe: jest.fn().mockResolvedValue(true),
  createPaymentMethod: jest.fn(),
  confirmPayment: jest.fn(),
  isApplePaySupported: jest.fn().mockResolvedValue(true),
  isGooglePaySupported: jest.fn().mockResolvedValue(true),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock RevenueCat
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  logIn: jest.fn().mockResolvedValue({ customerInfo: {} }),
  logOut: jest.fn().mockResolvedValue({ customerInfo: {} }),
  getCustomerInfo: jest.fn().mockResolvedValue({}),
  getOfferings: jest.fn().mockResolvedValue({ current: null, all: {} }),
}));

describe('Payment Integration Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('StripePaymentService singleton works correctly', () => {
      const service1 = StripePaymentService.getInstance();
      const service2 = StripePaymentService.getInstance();
      expect(service1).toBe(service2);
    });

    test('AppStoreBillingService singleton works correctly', () => {
      const service1 = AppStoreBillingService.getInstance();
      const service2 = AppStoreBillingService.getInstance();
      expect(service1).toBe(service2);
    });

    test('PaymentInitializationService initializes correctly', async () => {
      const initService = PaymentInitializationService.getInstance();
      
      const result = await initService.initializePaymentServices('test_user', 'test_token');
      
      expect(result.success).toBe(true);
      expect(result.stripeInitialized).toBe(true);
    });
  });

  describe('Subscription Plans Configuration', () => {
    test('Premium monthly plan is correctly configured', () => {
      const stripeService = StripePaymentService.getInstance();
      const plans = stripeService.getSubscriptionPlans();
      
      const premiumPlan = plans.find(p => p.id === 'premium_monthly');
      
      expect(premiumPlan).toBeDefined();
      expect(premiumPlan?.price).toBe(799); // €7.99 in cents
      expect(premiumPlan?.currency).toBe('eur');
      expect(premiumPlan?.interval).toBe('month');
      expect(premiumPlan?.features).toContain('unlimited_pets');
      expect(premiumPlan?.features).toContain('lost_pet_alerts');
    });

    test('Premium features are properly defined', () => {
      const stripeService = StripePaymentService.getInstance();
      const plans = stripeService.getSubscriptionPlans();
      const premiumPlan = plans.find(p => p.id === 'premium_monthly');
      
      const expectedFeatures = [
        'unlimited_pets',
        'unlimited_photos',
        'lost_pet_alerts',
        'vaccination_reminders',
        'medication_tracking',
        'advanced_health_tracking',
        'family_sharing_unlimited',
        'priority_support'
      ];
      
      expectedFeatures.forEach(feature => {
        expect(premiumPlan?.features).toContain(feature);
      });
    });
  });

  describe('Resource Access Validation', () => {
    test('validateResourceAccess works for free tier limits', async () => {
      const stripeService = StripePaymentService.getInstance();
      
      // Mock free user
      jest.spyOn(stripeService, 'getSubscriptionStatus').mockResolvedValue({
        isActive: false,
        isPremium: false,
        status: 'free',
        features: ['basic_profiles', 'basic_vaccination_tracking'],
      });
      
      const result = await stripeService.validateResourceAccess('pets', 0);
      
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1);
      expect(result.requiresPremium).toBe(false);
    });

    test('validateResourceAccess blocks free users at limit', async () => {
      const stripeService = StripePaymentService.getInstance();
      
      // Mock free user at limit
      jest.spyOn(stripeService, 'getSubscriptionStatus').mockResolvedValue({
        isActive: false,
        isPremium: false,
        status: 'free',
        features: ['basic_profiles', 'basic_vaccination_tracking'],
      });
      
      const result = await stripeService.validateResourceAccess('pets', 1);
      
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(1);
      expect(result.requiresPremium).toBe(true);
      expect(result.message).toContain('Upgrade to Premium');
    });

    test('validateResourceAccess allows premium users unlimited access', async () => {
      const stripeService = StripePaymentService.getInstance();
      
      // Mock premium user
      jest.spyOn(stripeService, 'getSubscriptionStatus').mockResolvedValue({
        isActive: true,
        isPremium: true,
        status: 'active',
        features: ['unlimited_pets', 'lost_pet_alerts'],
      });
      
      const result = await stripeService.validateResourceAccess('pets', 10);
      
      expect(result.allowed).toBe(true);
      expect(result.requiresPremium).toBe(false);
      expect(result.message).toContain('unlimited');
    });
  });

  describe('Premium Access Hook', () => {
    test('usePremiumAccess hook handles loading states', async () => {
      const { result } = renderHook(() => usePremiumAccess());
      
      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.subscriptionStatus).toBe(null);
      
      // Wait for async operations to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.loading).toBe(false);
    });

    test('usePremiumAccess correctly identifies premium users', async () => {
      // Mock StripePaymentService response
      const stripeService = StripePaymentService.getInstance();
      jest.spyOn(stripeService, 'getSubscriptionStatus').mockResolvedValue({
        isActive: true,
        isPremium: true,
        status: 'active',
        features: ['unlimited_pets', 'lost_pet_alerts'],
      });
      
      const { result } = renderHook(() => usePremiumAccess());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.hasPremiumAccess).toBe(true);
      expect(result.current.canAccessFeature('unlimited_pets')).toBe(true);
      expect(result.current.canAccessFeature('lost_pet_alerts')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('PaymentErrorUtils creates user-friendly messages', () => {
      const testError = {
        code: 'card_declined',
        message: 'Your card was declined.',
        type: 'card_error' as const,
      };
      
      const title = PaymentErrorUtils.getErrorTitle(testError.type);
      const suggestion = PaymentErrorUtils.getQuickActionSuggestion(testError);
      
      expect(title).toBe('Card Error');
      expect(suggestion).toBe('Try a different payment method');
    });

    test('PaymentErrorUtils identifies retryable errors', () => {
      const retryableError = {
        code: 'processing_error',
        message: 'Processing error',
        type: 'api_error' as const,
      };
      
      const nonRetryableError = {
        code: 'card_declined',
        message: 'Card declined',
        type: 'card_error' as const,
      };
      
      expect(PaymentErrorUtils.isRetryableError(retryableError)).toBe(true);
      expect(PaymentErrorUtils.isRetryableError(nonRetryableError)).toBe(false);
    });
  });

  describe('Cross-Platform Support', () => {
    test('Payment capabilities detection works', async () => {
      const initService = PaymentInitializationService.getInstance();
      
      const capabilities = await initService.getPaymentCapabilities();
      
      expect(capabilities.creditCard).toBe(true);
      expect(capabilities.subscriptions).toBe(true);
      expect(typeof capabilities.applePay).toBe('boolean');
      expect(typeof capabilities.googlePay).toBe('boolean');
    });

    test('Health check reports service status', async () => {
      const initService = PaymentInitializationService.getInstance();
      
      const health = await initService.checkPaymentServicesHealth();
      
      expect(health).toHaveProperty('stripe');
      expect(health).toHaveProperty('billing');
      expect(health).toHaveProperty('overall');
      expect(typeof health.stripe).toBe('boolean');
      expect(typeof health.billing).toBe('boolean');
      expect(typeof health.overall).toBe('boolean');
    });
  });

  describe('Integration Completeness', () => {
    test('All required services are properly exported', () => {
      // These imports should not throw
      expect(StripePaymentService).toBeDefined();
      expect(AppStoreBillingService).toBeDefined();
      expect(PaymentInitializationService).toBeDefined();
      expect(PaymentErrorUtils).toBeDefined();
      expect(usePremiumAccess).toBeDefined();
    });

    test('Configuration constants are properly set', () => {
      const stripeService = StripePaymentService.getInstance();
      const plans = stripeService.getSubscriptionPlans();
      
      // Verify critical configuration
      expect(plans.length).toBeGreaterThan(0);
      
      const premiumPlan = plans.find(p => p.id === 'premium_monthly');
      expect(premiumPlan?.price).toBe(799); // €7.99
      expect(premiumPlan?.currency).toBe('eur');
      expect(premiumPlan?.features.length).toBeGreaterThan(0);
    });

    test('Free tier limits are correctly configured', async () => {
      const stripeService = StripePaymentService.getInstance();
      
      // Mock free user
      jest.spyOn(stripeService, 'getSubscriptionStatus').mockResolvedValue({
        isActive: false,
        isPremium: false,
        status: 'free',
        features: ['basic_profiles', 'basic_vaccination_tracking'],
      });
      
      // Test pet limit
      const petAccess = await stripeService.validateResourceAccess('pets', 0);
      expect(petAccess.limit).toBe(1);
      
      // Test photo limit
      const photoAccess = await stripeService.validateResourceAccess('photos_per_pet', 0);
      expect(photoAccess.limit).toBe(1);
      
      // Test family limit
      const familyAccess = await stripeService.validateResourceAccess('family_members', 0);
      expect(familyAccess.limit).toBe(1);
    });
  });
});

describe('End-to-End Payment Flow Validation', () => {
  test('Complete payment initialization flow', async () => {
    const initService = PaymentInitializationService.getInstance();
    
    // Reset service state
    await initService.resetPaymentServices();
    
    // Initialize with user credentials
    const result = await initService.initializePaymentServices('test_user', 'test_token');
    
    expect(result.success).toBe(true);
    expect(result.stripeInitialized).toBe(true);
    
    // Verify services are ready
    const health = await initService.checkPaymentServicesHealth();
    expect(health.overall).toBe(true);
  });

  test('User authentication flow works correctly', async () => {
    const initService = PaymentInitializationService.getInstance();
    
    // Initialize without user
    await initService.initializePaymentServices();
    
    // Update user auth
    await initService.updateUserAuth('new_user', 'new_token');
    
    // Verify no errors thrown
    expect(true).toBe(true); // Test passes if no errors
    
    // Clear auth
    await initService.clearUserAuth();
    
    // Verify no errors thrown
    expect(true).toBe(true); // Test passes if no errors
  });
});

export {};