import { jest } from '@jest/globals';

// Comprehensive Stripe Mock for Payment Testing
class MockStripeService {
  private mockPaymentMethods: any[] = [];
  private mockCustomers: any[] = [];
  private mockSubscriptions: any[] = [];
  private mockPaymentIntents: any[] = [];
  private mockSetupIntents: any[] = [];
  private mockInvoices: any[] = [];

  // Card component mock
  CardField = {
    focus: jest.fn(),
    blur: jest.fn(),
    clear: jest.fn(),
    isComplete: jest.fn(() => true),
  };

  // Apple Pay mock
  ApplePay = {
    isApplePaySupported: jest.fn(async () => true),
    presentApplePay: jest.fn(async (params: any) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      return { paymentMethod: this.createMockPaymentMethod('apple_pay') };
    }),
    updateApplePaySummaryItems: jest.fn(),
    confirmApplePayPayment: jest.fn(async (clientSecret: string) => {
      return { paymentIntent: this.createMockPaymentIntent('succeeded') };
    }),
  };

  // Google Pay mock
  GooglePay = {
    isGooglePaySupported: jest.fn(async () => true),
    presentGooglePay: jest.fn(async (params: any) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      return { paymentMethod: this.createMockPaymentMethod('google_pay') };
    }),
    createGooglePayPaymentMethod: jest.fn(async (params: any) => {
      return { paymentMethod: this.createMockPaymentMethod('google_pay') };
    }),
  };

  // Core payment methods
  createPaymentMethod = jest.fn(async (params: any) => {
    const paymentMethod = this.createMockPaymentMethod(params.type, params);
    this.mockPaymentMethods.push(paymentMethod);
    
    return { paymentMethod, error: null };
  });

  confirmPayment = jest.fn(async (clientSecret: string, data?: any) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const paymentIntent = this.createMockPaymentIntent('succeeded', { client_secret: clientSecret });
    this.mockPaymentIntents.push(paymentIntent);
    
    return { paymentIntent, error: null };
  });

  confirmSetupIntent = jest.fn(async (clientSecret: string, data?: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const setupIntent = this.createMockSetupIntent('succeeded', { client_secret: clientSecret });
    this.mockSetupIntents.push(setupIntent);
    
    return { setupIntent, error: null };
  });

  retrievePaymentIntent = jest.fn(async (clientSecret: string) => {
    const existing = this.mockPaymentIntents.find(pi => pi.client_secret === clientSecret);
    if (existing) {
      return { paymentIntent: existing, error: null };
    }
    
    const paymentIntent = this.createMockPaymentIntent('requires_payment_method', { client_secret: clientSecret });
    return { paymentIntent, error: null };
  });

  handleNextAction = jest.fn(async (clientSecret: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const paymentIntent = this.createMockPaymentIntent('succeeded', { client_secret: clientSecret });
    return { paymentIntent, error: null };
  });

  // Setup intents
  createSetupIntent = jest.fn(async (params: any) => {
    const setupIntent = this.createMockSetupIntent('requires_payment_method', params);
    this.mockSetupIntents.push(setupIntent);
    
    return { setupIntent, error: null };
  });

  // Customer management
  createCustomer = jest.fn(async (params: any) => {
    const customer = this.createMockCustomer(params);
    this.mockCustomers.push(customer);
    
    return { customer, error: null };
  });

  retrieveCustomer = jest.fn(async (customerId: string) => {
    const customer = this.mockCustomers.find(c => c.id === customerId) 
      || this.createMockCustomer({ id: customerId });
    
    return { customer, error: null };
  });

  // Subscription management
  createSubscription = jest.fn(async (params: any) => {
    const subscription = this.createMockSubscription(params);
    this.mockSubscriptions.push(subscription);
    
    return { subscription, error: null };
  });

  updateSubscription = jest.fn(async (subscriptionId: string, params: any) => {
    const existingIndex = this.mockSubscriptions.findIndex(s => s.id === subscriptionId);
    
    if (existingIndex !== -1) {
      this.mockSubscriptions[existingIndex] = { 
        ...this.mockSubscriptions[existingIndex], 
        ...params,
        updated: Date.now() / 1000,
      };
      return { subscription: this.mockSubscriptions[existingIndex], error: null };
    }
    
    return { subscription: null, error: { message: 'Subscription not found' } };
  });

  cancelSubscription = jest.fn(async (subscriptionId: string) => {
    const subscription = this.mockSubscriptions.find(s => s.id === subscriptionId);
    
    if (subscription) {
      subscription.status = 'canceled';
      subscription.canceled_at = Date.now() / 1000;
      return { subscription, error: null };
    }
    
    return { subscription: null, error: { message: 'Subscription not found' } };
  });

  // Initialization
  initStripe = jest.fn(async (publishableKey: string, options?: any) => {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!publishableKey?.startsWith('pk_')) {
      throw new Error('Invalid publishable key');
    }
    
    return {
      isInitialized: true,
      publishableKey,
      ...options,
    };
  });

  // UI Components
  StripeProvider = ({ children, ...props }: any) => children;
  
  CardFieldInput = {
    focus: jest.fn(),
    blur: jest.fn(),
    clear: jest.fn(),
    dangerouslyGetFullCardDetails: jest.fn(async () => ({
      number: '4242424242424242',
      expiryMonth: 12,
      expiryYear: 2025,
      cvc: '123',
      complete: true,
    })),
  };

  // Mock factory methods
  private createMockPaymentMethod(type: string, params?: any) {
    const baseId = `pm_${Math.random().toString(36).substr(2, 9)}`;
    
    const baseMethod = {
      id: baseId,
      object: 'payment_method',
      created: Math.floor(Date.now() / 1000),
      customer: params?.customer || null,
      livemode: false,
      type,
    };

    switch (type) {
      case 'card':
        return {
          ...baseMethod,
          card: {
            brand: 'visa',
            checks: {
              address_line1_check: 'pass',
              address_postal_code_check: 'pass',
              cvc_check: 'pass',
            },
            country: 'US',
            exp_month: 12,
            exp_year: 2025,
            fingerprint: 'abc123',
            funding: 'credit',
            generated_from: null,
            last4: '4242',
            networks: { available: ['visa'], preferred: null },
            three_d_secure_usage: { supported: true },
            wallet: null,
          },
        };
      
      case 'apple_pay':
        return {
          ...baseMethod,
          apple_pay: {},
        };
      
      case 'google_pay':
        return {
          ...baseMethod,
          google_pay: {},
        };
      
      default:
        return baseMethod;
    }
  }

  private createMockPaymentIntent(status: string, params?: any) {
    return {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      object: 'payment_intent',
      amount: params?.amount || 2000,
      amount_capturable: 0,
      amount_received: status === 'succeeded' ? (params?.amount || 2000) : 0,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: status === 'canceled' ? Math.floor(Date.now() / 1000) : null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: {
        object: 'list',
        data: status === 'succeeded' ? [this.createMockCharge()] : [],
        has_more: false,
        total_count: status === 'succeeded' ? 1 : 0,
        url: '/v1/charges?payment_intent=pi_test',
      },
      client_secret: params?.client_secret || `pi_test_${Math.random().toString(36).substr(2, 9)}_secret_test`,
      confirmation_method: 'automatic',
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      customer: params?.customer || null,
      description: params?.description || null,
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: params?.metadata || {},
      next_action: null,
      on_behalf_of: null,
      payment_method: params?.payment_method || null,
      payment_method_options: {},
      payment_method_types: ['card'],
      processing: null,
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status,
      transfer_data: null,
      transfer_group: null,
    };
  }

  private createMockSetupIntent(status: string, params?: any) {
    return {
      id: `seti_${Math.random().toString(36).substr(2, 9)}`,
      object: 'setup_intent',
      application: null,
      automatic_payment_methods: null,
      cancellation_reason: null,
      client_secret: params?.client_secret || `seti_test_${Math.random().toString(36).substr(2, 9)}_secret_test`,
      created: Math.floor(Date.now() / 1000),
      customer: params?.customer || null,
      description: null,
      flow_directions: null,
      last_setup_error: null,
      latest_attempt: null,
      livemode: false,
      mandate: null,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: params?.payment_method || null,
      payment_method_options: {},
      payment_method_types: ['card'],
      single_use_mandate: null,
      status,
      usage: 'off_session',
    };
  }

  private createMockCustomer(params?: any) {
    return {
      id: params?.id || `cus_${Math.random().toString(36).substr(2, 9)}`,
      object: 'customer',
      address: params?.address || null,
      balance: 0,
      created: Math.floor(Date.now() / 1000),
      currency: null,
      default_source: null,
      delinquent: false,
      description: params?.description || null,
      discount: null,
      email: params?.email || null,
      invoice_prefix: 'ABC123',
      invoice_settings: {
        custom_fields: null,
        default_payment_method: null,
        footer: null,
      },
      livemode: false,
      metadata: params?.metadata || {},
      name: params?.name || null,
      next_invoice_sequence: 1,
      phone: params?.phone || null,
      preferred_locales: [],
      shipping: null,
      sources: { object: 'list', data: [], has_more: false, total_count: 0, url: '/v1/customers/cus_test/sources' },
      subscriptions: { object: 'list', data: [], has_more: false, total_count: 0, url: '/v1/customers/cus_test/subscriptions' },
      tax_exempt: 'none',
      tax_ids: { object: 'list', data: [], has_more: false, total_count: 0, url: '/v1/customers/cus_test/tax_ids' },
      tax_info: null,
      tax_info_verification: null,
    };
  }

  private createMockSubscription(params?: any) {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      id: `sub_${Math.random().toString(36).substr(2, 9)}`,
      object: 'subscription',
      application_fee_percent: null,
      automatic_tax: { enabled: false },
      billing_cycle_anchor: now,
      billing_thresholds: null,
      cancel_at: null,
      cancel_at_period_end: false,
      canceled_at: null,
      collection_method: 'charge_automatically',
      created: now,
      current_period_end: now + (30 * 24 * 60 * 60), // 30 days from now
      current_period_start: now,
      customer: params?.customer || `cus_${Math.random().toString(36).substr(2, 9)}`,
      days_until_due: null,
      default_payment_method: params?.default_payment_method || null,
      default_source: null,
      default_tax_rates: [],
      description: null,
      discount: null,
      ended_at: null,
      items: {
        object: 'list',
        data: [
          {
            id: `si_${Math.random().toString(36).substr(2, 9)}`,
            object: 'subscription_item',
            billing_thresholds: null,
            created: now,
            metadata: {},
            plan: params?.plan || {
              id: 'premium_monthly',
              object: 'plan',
              amount: 999,
              currency: 'usd',
              interval: 'month',
              interval_count: 1,
              nickname: 'Premium Monthly',
            },
            price: params?.price || null,
            quantity: 1,
            subscription: `sub_${Math.random().toString(36).substr(2, 9)}`,
            tax_rates: [],
          },
        ],
        has_more: false,
        total_count: 1,
        url: '/v1/subscription_items?subscription=sub_test',
      },
      latest_invoice: `in_${Math.random().toString(36).substr(2, 9)}`,
      livemode: false,
      metadata: params?.metadata || {},
      next_pending_invoice_item_invoice: null,
      pause_collection: null,
      payment_settings: {
        payment_method_options: null,
        payment_method_types: null,
      },
      pending_invoice_item_interval: null,
      pending_setup_intent: null,
      pending_update: null,
      schedule: null,
      start_date: now,
      status: params?.status || 'active',
      transfer_data: null,
      trial_end: null,
      trial_start: null,
    };
  }

  private createMockCharge() {
    return {
      id: `ch_${Math.random().toString(36).substr(2, 9)}`,
      object: 'charge',
      amount: 2000,
      amount_captured: 2000,
      amount_refunded: 0,
      application: null,
      application_fee: null,
      application_fee_amount: null,
      balance_transaction: `txn_${Math.random().toString(36).substr(2, 9)}`,
      billing_details: {
        address: null,
        email: null,
        name: null,
        phone: null,
      },
      calculated_statement_descriptor: 'TAILTRACKER',
      captured: true,
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      customer: null,
      description: null,
      disputed: false,
      failure_code: null,
      failure_message: null,
      fraud_details: {},
      invoice: null,
      livemode: false,
      metadata: {},
      on_behalf_of: null,
      outcome: {
        network_status: 'approved_by_network',
        reason: null,
        risk_level: 'normal',
        risk_score: 34,
        seller_message: 'Payment complete.',
        type: 'authorized',
      },
      paid: true,
      payment_intent: `pi_${Math.random().toString(36).substr(2, 9)}`,
      payment_method: `pm_${Math.random().toString(36).substr(2, 9)}`,
      payment_method_details: {
        card: {
          brand: 'visa',
          checks: {
            address_line1_check: null,
            address_postal_code_check: null,
            cvc_check: 'pass',
          },
          country: 'US',
          exp_month: 12,
          exp_year: 2025,
          fingerprint: 'abc123',
          funding: 'credit',
          installments: null,
          last4: '4242',
          mandate: null,
          network: 'visa',
          three_d_secure: null,
          wallet: null,
        },
        type: 'card',
      },
      receipt_email: null,
      receipt_number: null,
      receipt_url: 'https://pay.stripe.com/receipts/test_receipt',
      refunded: false,
      refunds: { object: 'list', data: [], has_more: false, total_count: 0, url: '/v1/charges/ch_test/refunds' },
      review: null,
      shipping: null,
      source_transfer: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null,
    };
  }

  // Error simulation methods
  simulatePaymentError(errorType: string = 'card_declined') {
    const error = {
      type: 'card_error',
      code: errorType,
      decline_code: errorType,
      message: this.getErrorMessage(errorType),
      payment_intent: this.createMockPaymentIntent('requires_payment_method'),
    };

    this.confirmPayment.mockResolvedValue({ paymentIntent: null, error });
    return error;
  }

  simulateNetworkError() {
    const networkError = new Error('Network request failed');
    
    this.confirmPayment.mockRejectedValue(networkError);
    this.createPaymentMethod.mockRejectedValue(networkError);
    this.createSubscription.mockRejectedValue(networkError);
  }

  private getErrorMessage(errorType: string): string {
    const messages: { [key: string]: string } = {
      card_declined: 'Your card was declined.',
      expired_card: 'Your card has expired.',
      incorrect_cvc: 'Your card\'s security code is incorrect.',
      processing_error: 'An error occurred while processing your card.',
      insufficient_funds: 'Your card has insufficient funds.',
    };
    
    return messages[errorType] || 'An unknown error occurred.';
  }

  // Test utilities
  reset() {
    this.mockPaymentMethods = [];
    this.mockCustomers = [];
    this.mockSubscriptions = [];
    this.mockPaymentIntents = [];
    this.mockSetupIntents = [];
    this.mockInvoices = [];

    // Reset all mocks
    Object.values(this).forEach(prop => {
      if (jest.isMockFunction(prop)) {
        prop.mockClear();
      }
    });

    // Reset nested mocks
    Object.values(this.ApplePay).forEach(prop => {
      if (jest.isMockFunction(prop)) {
        prop.mockClear();
      }
    });

    Object.values(this.GooglePay).forEach(prop => {
      if (jest.isMockFunction(prop)) {
        prop.mockClear();
      }
    });

    this.setupDefaultMocks();
  }

  private setupDefaultMocks() {
    // Set up default successful responses
    this.confirmPayment.mockImplementation(async (clientSecret, data) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const paymentIntent = this.createMockPaymentIntent('succeeded', { client_secret: clientSecret });
      return { paymentIntent, error: null };
    });

    this.createPaymentMethod.mockImplementation(async (params) => {
      const paymentMethod = this.createMockPaymentMethod(params.type, params);
      return { paymentMethod, error: null };
    });

    this.ApplePay.presentApplePay.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { paymentMethod: this.createMockPaymentMethod('apple_pay') };
    });

    this.GooglePay.presentGooglePay.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { paymentMethod: this.createMockPaymentMethod('google_pay') };
    });
  }

  getTestState() {
    return {
      paymentMethods: [...this.mockPaymentMethods],
      customers: [...this.mockCustomers],
      subscriptions: [...this.mockSubscriptions],
      paymentIntents: [...this.mockPaymentIntents],
      setupIntents: [...this.mockSetupIntents],
      invoices: [...this.mockInvoices],
    };
  }
}

// Export the mock service
export const mockStripeService = new MockStripeService();
export default mockStripeService;