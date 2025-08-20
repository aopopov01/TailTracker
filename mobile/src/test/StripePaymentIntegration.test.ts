/**
 * TailTracker Mobile Stripe Integration Test Suite
 * Comprehensive testing for React Native Stripe SDK integration
 * 
 * Test Cases:
 * 1. Stripe SDK initialization and configuration
 * 2. Payment method creation (Card, Apple Pay, Google Pay)
 * 3. Subscription creation and management
 * 4. Premium feature access validation
 * 5. Error handling and user feedback
 * 6. Platform-specific payment methods
 * 7. 3D Secure authentication flows
 * 8. Billing portal integration
 */

import { Platform } from 'react-native';
import StripePaymentService, {
  SubscriptionPlan,
  PaymentMethodInfo,
  SubscriptionStatus,
  PurchaseResult,
  PaymentError
} from '../services/StripePaymentService';

// Mock Stripe React Native SDK
jest.mock('@stripe/stripe-react-native', () => ({
  initStripe: jest.fn().mockResolvedValue(undefined),
  createPaymentMethod: jest.fn(),
  confirmPayment: jest.fn(),
  createApplePayPaymentMethod: jest.fn(),
  createGooglePayPaymentMethod: jest.fn(),
  isApplePaySupported: jest.fn(),
  isGooglePaySupported: jest.fn(),
  presentApplePay: jest.fn(),
  presentGooglePay: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('TailTracker Stripe Payment Integration', () => {
  let stripeService: StripePaymentService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  
  // Test data
  const testUser = {
    userId: 'test_user_123',
    authToken: 'test_auth_token_456',
    email: 'test@tailtracker.com',
    name: 'Test User'
  };

  const mockSubscriptionStatus: SubscriptionStatus = {
    isActive: true,
    isPremium: true,
    plan: 'premium_monthly',
    expiresAt: new Date('2024-12-31'),
    willRenew: true,
    status: 'active',
    features: [
      'unlimited_pets',
      'unlimited_photos',
      'lost_pet_alerts',
      'vaccination_reminders'
    ]
  };

  const mockPaymentMethods: PaymentMethodInfo[] = [
    {
      id: 'pm_test_card_123',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2028,
      isDefault: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    stripeService = StripePaymentService.getInstance();
    mockFetch.mockClear();
  });

  describe('Service Initialization', () => {
    it('should initialize Stripe with correct configuration', async () => {
      const { initStripe } = require('@stripe/stripe-react-native');
      
      const result = await stripeService.initialize(testUser.userId, testUser.authToken);
      
      expect(result).toBe(true);
      expect(initStripe).toHaveBeenCalledWith({
        publishableKey: expect.stringContaining('STRIPE_PUBLISHABLE_KEY_HERE'),
        merchantIdentifier: 'merchant.com.tailtracker.app',
        urlScheme: 'tailtracker://',
        setReturnUrlSchemeOnAndroid: true,
      });
    });

    it('should handle initialization failure gracefully', async () => {
      const { initStripe } = require('@stripe/stripe-react-native');
      initStripe.mockRejectedValue(new Error('Initialization failed'));
      
      const result = await stripeService.initialize(testUser.userId, testUser.authToken);
      
      expect(result).toBe(false);
    });

    it('should return subscription plans configuration', () => {
      const plans = stripeService.getSubscriptionPlans();
      
      expect(plans).toHaveLength(1);
      expect(plans[0]).toMatchObject({
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 799, // €7.99
        currency: 'eur',
        interval: 'month'
      });
    });
  });

  describe('Payment Method Support Detection', () => {
    it('should check Apple Pay availability on iOS', async () => {
      Platform.OS = 'ios';
      const { isApplePaySupported } = require('@stripe/stripe-react-native');
      isApplePaySupported.mockResolvedValue(true);
      
      const isAvailable = await stripeService.isApplePayAvailable();
      
      expect(isAvailable).toBe(true);
      expect(isApplePaySupported).toHaveBeenCalled();
    });

    it('should return false for Apple Pay on Android', async () => {
      Platform.OS = 'android';
      
      const isAvailable = await stripeService.isApplePayAvailable();
      
      expect(isAvailable).toBe(false);
    });

    it('should check Google Pay availability on Android', async () => {
      Platform.OS = 'android';
      const { isGooglePaySupported } = require('@stripe/stripe-react-native');
      isGooglePaySupported.mockResolvedValue(true);
      
      const isAvailable = await stripeService.isGooglePayAvailable();
      
      expect(isAvailable).toBe(true);
      expect(isGooglePaySupported).toHaveBeenCalledWith({
        testEnv: expect.any(Boolean),
      });
    });

    it('should return false for Google Pay on iOS', async () => {
      Platform.OS = 'ios';
      
      const isAvailable = await stripeService.isGooglePayAvailable();
      
      expect(isAvailable).toBe(false);
    });
  });

  describe('Payment Method Creation', () => {
    it('should create card payment method successfully', async () => {
      const { createPaymentMethod } = require('@stripe/stripe-react-native');
      const mockPaymentMethod = { id: 'pm_test_card_123' };
      createPaymentMethod.mockResolvedValue({ paymentMethod: mockPaymentMethod });
      
      const cardDetails = {
        number: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2028,
        cvc: '123'
      };
      
      const result = await stripeService.createCardPaymentMethod(cardDetails);
      
      expect(result.paymentMethod).toEqual(mockPaymentMethod);
      expect(result.error).toBeUndefined();
      expect(createPaymentMethod).toHaveBeenCalledWith({
        paymentMethodType: 'Card',
        paymentMethodData: cardDetails,
      });
    });

    it('should handle card payment method creation errors', async () => {
      const { createPaymentMethod } = require('@stripe/stripe-react-native');
      const mockError = { message: 'Invalid card number', code: 'incorrect_number' };
      createPaymentMethod.mockResolvedValue({ error: mockError });
      
      const result = await stripeService.createCardPaymentMethod({});
      
      expect(result.error).toEqual(mockError);
      expect(result.paymentMethod).toBeUndefined();
    });

    it('should create Apple Pay payment method on iOS', async () => {
      Platform.OS = 'ios';
      const { createApplePayPaymentMethod } = require('@stripe/stripe-react-native');
      const mockPaymentMethod = { id: 'pm_test_apple_pay_123' };
      createApplePayPaymentMethod.mockResolvedValue({ paymentMethod: mockPaymentMethod });
      
      const result = await stripeService.createApplePayPaymentMethod(799, 'eur');
      
      expect(result.paymentMethod).toEqual(mockPaymentMethod);
      expect(createApplePayPaymentMethod).toHaveBeenCalledWith({
        paymentSummaryItems: [
          {
            label: 'TailTracker Premium',
            amount: '7.99',
          },
        ],
        merchantIdentifier: 'merchant.com.tailtracker.app',
        countryCode: 'DE',
        currencyCode: 'EUR',
      });
    });

    it('should create Google Pay payment method on Android', async () => {
      Platform.OS = 'android';
      const { createGooglePayPaymentMethod } = require('@stripe/stripe-react-native');
      const mockPaymentMethod = { id: 'pm_test_google_pay_123' };
      createGooglePayPaymentMethod.mockResolvedValue({ paymentMethod: mockPaymentMethod });
      
      const result = await stripeService.createGooglePayPaymentMethod(799, 'eur');
      
      expect(result.paymentMethod).toEqual(mockPaymentMethod);
      expect(createGooglePayPaymentMethod).toHaveBeenCalledWith({
        amount: 799,
        currencyCode: 'EUR',
        countryCode: 'DE',
        testEnv: expect.any(Boolean),
      });
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
    });

    it('should get subscription status successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'active',
          plan: 'premium_monthly',
          expiresAt: '2024-12-31T23:59:59Z',
          willRenew: true,
          features: mockSubscriptionStatus.features
        }),
      } as Response);
      
      const status = await stripeService.getSubscriptionStatus();
      
      expect(status.isActive).toBe(true);
      expect(status.isPremium).toBe(true);
      expect(status.plan).toBe('premium_monthly');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/subscriptions/status'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${testUser.authToken}`,
          }),
        })
      );
    });

    it('should create subscription successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          subscriptionId: 'sub_test_123',
          clientSecret: 'pi_test_client_secret',
        }),
      } as Response);
      
      const result = await stripeService.createSubscription('premium_monthly', 'pm_test_card_123');
      
      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe('sub_test_123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/subscriptions/create'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            priceId: expect.stringContaining('price_premium_monthly_799'),
            paymentMethodId: 'pm_test_card_123',
          }),
        })
      );
    });

    it('should handle 3D Secure authentication', async () => {
      const { confirmPayment } = require('@stripe/stripe-react-native');
      confirmPayment.mockResolvedValue({ error: null });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          subscriptionId: 'sub_test_123',
          clientSecret: 'pi_test_client_secret',
          requiresAction: true,
        }),
      } as Response);
      
      const result = await stripeService.createSubscription('premium_monthly', 'pm_test_3ds_card');
      
      expect(confirmPayment).toHaveBeenCalledWith('pi_test_client_secret', {
        paymentMethodType: 'Card',
      });
      expect(result.success).toBe(true);
    });

    it('should cancel subscription successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      const result = await stripeService.cancelSubscription(false);
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/subscriptions/cancel'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ immediately: false }),
        })
      );
    });

    it('should reactivate subscription successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      const result = await stripeService.reactivateSubscription();
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/subscriptions/reactivate'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Payment Method Management', () => {
    beforeEach(() => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
    });

    it('should get payment methods successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ paymentMethods: mockPaymentMethods }),
      } as Response);
      
      const result = await stripeService.getPaymentMethods();
      
      expect(result.paymentMethods).toEqual(mockPaymentMethods);
      expect(result.error).toBeUndefined();
    });

    it('should add payment method successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      const result = await stripeService.addPaymentMethod('pm_test_new_card');
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/payment-methods/add'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ paymentMethodId: 'pm_test_new_card' }),
        })
      );
    });

    it('should remove payment method successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      const result = await stripeService.removePaymentMethod('pm_test_card_123');
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/payment-methods/remove'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ paymentMethodId: 'pm_test_card_123' }),
        })
      );
    });

    it('should set default payment method successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      const result = await stripeService.setDefaultPaymentMethod('pm_test_card_123');
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/payment-methods/set-default'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ paymentMethodId: 'pm_test_card_123' }),
        })
      );
    });
  });

  describe('Premium Feature Access', () => {
    beforeEach(() => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
    });

    it('should check premium access correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscriptionStatus,
      } as Response);
      
      const hasPremium = await stripeService.hasPremiumAccess();
      
      expect(hasPremium).toBe(true);
    });

    it('should check specific feature access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscriptionStatus,
      } as Response);
      
      const canAccess = await stripeService.canAccessFeature('unlimited_pets');
      
      expect(canAccess).toBe(true);
    });

    it('should validate resource access for free users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSubscriptionStatus,
          isActive: false,
          isPremium: false,
          status: 'free',
          features: ['basic_profiles']
        }),
      } as Response);
      
      const result = await stripeService.validateResourceAccess('pets', 1);
      
      expect(result.allowed).toBe(false);
      expect(result.requiresPremium).toBe(true);
      expect(result.limit).toBe(1);
    });

    it('should validate resource access for premium users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscriptionStatus,
      } as Response);
      
      const result = await stripeService.validateResourceAccess('pets', 5);
      
      expect(result.allowed).toBe(true);
      expect(result.requiresPremium).toBe(false);
      expect(result.message).toContain('unlimited');
    });
  });

  describe('Billing Portal Integration', () => {
    beforeEach(() => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
    });

    it('should get billing portal URL successfully', async () => {
      const mockPortalUrl = 'https://billing.stripe.com/session/test_123';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: mockPortalUrl }),
      } as Response);
      
      const result = await stripeService.getBillingPortalUrl('tailtracker://subscription');
      
      expect(result.url).toBe(mockPortalUrl);
      expect(result.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/billing/portal'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ returnUrl: 'tailtracker://subscription' }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should parse Stripe errors correctly', () => {
      const stripeError = {
        code: 'card_declined',
        message: 'Your card was declined.',
        declineCode: 'generic_decline'
      };
      
      const parsedError = stripeService.parseStripeError(stripeError as any);
      
      expect(parsedError.code).toBe('card_declined');
      expect(parsedError.type).toBe('card_error');
      expect(parsedError.message).toContain('declined');
      expect(parsedError.declineCode).toBe('generic_decline');
    });

    it('should handle API errors gracefully', async () => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Subscription not found' }),
      } as Response);
      
      const result = await stripeService.createSubscription('premium_monthly', 'pm_invalid');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Subscription not found');
    });

    it('should handle network errors', async () => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await stripeService.getSubscriptionStatus();
      
      expect(result.isActive).toBe(false);
      expect(result.isPremium).toBe(false);
      expect(result.status).toBe('free');
    });

    it('should handle unauthenticated requests', async () => {
      const result = await stripeService.createSubscription('premium_monthly', 'pm_test');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not authenticated');
    });
  });

  describe('Test Card Integration', () => {
    const testCards = [
      { number: '4242424242424242', description: 'Visa - Success' },
      { number: '4000000000000002', description: 'Visa - Declined' },
      { number: '4000000000009995', description: 'Visa - Insufficient Funds' },
      { number: '4000000000000069', description: 'Visa - Expired' },
      { number: '4000000000000127', description: 'Visa - Incorrect CVC' },
      { number: '4000000000003220', description: 'Visa - 3D Secure Required' }
    ];

    it.each(testCards)('should handle test card: $description', async ({ number, description }) => {
      const { createPaymentMethod } = require('@stripe/stripe-react-native');
      
      // Mock different responses based on card type
      if (number === '4000000000000002') {
        createPaymentMethod.mockResolvedValue({ 
          error: { code: 'card_declined', message: 'Your card was declined.' }
        });
      } else if (number === '4000000000009995') {
        createPaymentMethod.mockResolvedValue({ 
          error: { code: 'insufficient_funds', message: 'Your card has insufficient funds.' }
        });
      } else {
        createPaymentMethod.mockResolvedValue({ 
          paymentMethod: { id: `pm_test_${number.slice(-4)}` }
        });
      }
      
      const cardDetails = {
        number,
        expiryMonth: 12,
        expiryYear: 2028,
        cvc: '123'
      };
      
      const result = await stripeService.createCardPaymentMethod(cardDetails);
      
      if (number === '4242424242424242') {
        expect(result.paymentMethod).toBeDefined();
        expect(result.error).toBeUndefined();
      } else if (number.includes('0000000000000002') || number.includes('9995')) {
        expect(result.error).toBeDefined();
        expect(result.paymentMethod).toBeUndefined();
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid subscription status checks', async () => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSubscriptionStatus,
      } as Response);
      
      const promises = Array(5).fill(null).map(() => stripeService.getSubscriptionStatus());
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.isPremium).toBe(true);
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should handle concurrent payment method operations', async () => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      const operations = [
        stripeService.addPaymentMethod('pm_test_1'),
        stripeService.addPaymentMethod('pm_test_2'),
        stripeService.setDefaultPaymentMethod('pm_test_1'),
      ];
      
      const results = await Promise.all(operations);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle subscription state transitions', async () => {
      stripeService.setAuth(testUser.userId, testUser.authToken);
      
      // Test subscription lifecycle: create -> active -> cancel -> reactivate
      const statusResponses = [
        { status: 'incomplete', isPremium: false },
        { status: 'active', isPremium: true },
        { status: 'canceled', isPremium: false },
        { status: 'active', isPremium: true },
      ];
      
      statusResponses.forEach(response => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => response,
        } as Response);
      });
      
      const statuses = [];
      for (let i = 0; i < statusResponses.length; i++) {
        const status = await stripeService.getSubscriptionStatus();
        statuses.push(status);
      }
      
      expect(statuses[0].isPremium).toBe(false); // incomplete
      expect(statuses[1].isPremium).toBe(true);  // active
      expect(statuses[2].isPremium).toBe(false); // canceled
      expect(statuses[3].isPremium).toBe(true);  // reactivated
    });
  });
});

// Integration test runner for manual testing
export class StripeIntegrationTestRunner {
  private stripeService: StripePaymentService;
  
  constructor() {
    this.stripeService = StripePaymentService.getInstance();
  }
  
  async runManualTests() {
    console.log('🧪 Starting Manual Stripe Integration Tests...');
    
    try {
      // Initialize Stripe
      await this.testInitialization();
      
      // Test payment method detection
      await this.testPaymentMethodDetection();
      
      // Test subscription flow
      await this.testSubscriptionFlow();
      
      // Test feature access
      await this.testFeatureAccess();
      
      console.log('✅ Manual tests completed successfully');
    } catch (error) {
      console.error('❌ Manual tests failed:', error);
    }
  }
  
  private async testInitialization() {
    console.log('Testing Stripe initialization...');
    const result = await this.stripeService.initialize('test_user', 'test_token');
    console.log('Initialization result:', result);
  }
  
  private async testPaymentMethodDetection() {
    console.log('Testing payment method detection...');
    const applePayAvailable = await this.stripeService.isApplePayAvailable();
    const googlePayAvailable = await this.stripeService.isGooglePayAvailable();
    console.log('Apple Pay available:', applePayAvailable);
    console.log('Google Pay available:', googlePayAvailable);
  }
  
  private async testSubscriptionFlow() {
    console.log('Testing subscription flow...');
    const plans = this.stripeService.getSubscriptionPlans();
    console.log('Available plans:', plans.length);
    
    const status = await this.stripeService.getSubscriptionStatus();
    console.log('Subscription status:', status);
  }
  
  private async testFeatureAccess() {
    console.log('Testing feature access...');
    const hasPremium = await this.stripeService.hasPremiumAccess();
    console.log('Has premium access:', hasPremium);
    
    const petAccess = await this.stripeService.validateResourceAccess('pets', 2);
    console.log('Pet access validation:', petAccess);
  }
}