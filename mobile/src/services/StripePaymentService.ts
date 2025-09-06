// Stripe Payment Service - Stub implementation for simplified feature set
export interface StripeSubscription {
  id: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  plan: string;
  current_period_start: Date;
  current_period_end: Date;
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
}

export class StripePaymentService {
  private static instance: StripePaymentService;

  public static getInstance(): StripePaymentService {
    if (!StripePaymentService.instance) {
      StripePaymentService.instance = new StripePaymentService();
    }
    return StripePaymentService.instance;
  }

  // Initialize Stripe (stub)
  async initialize(): Promise<void> {
    console.log('StripePaymentService: Initialized (stub implementation)');
  }

  // Create subscription (stub)
  async createSubscription(planId: string, paymentMethodId: string): Promise<StripeSubscription> {
    console.log('StripePaymentService: Creating subscription (stub)', { planId, paymentMethodId });
    
    return {
      id: `sub_${Date.now()}`,
      status: 'active',
      plan: planId,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  // Cancel subscription (stub)
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log('StripePaymentService: Canceling subscription (stub)', { subscriptionId });
    return true;
  }

  // Get subscription status (stub)
  async getSubscriptionStatus(subscriptionId: string): Promise<StripeSubscription | null> {
    console.log('StripePaymentService: Getting subscription status (stub)', { subscriptionId });
    return null;
  }

  // Add payment method (stub)
  async addPaymentMethod(): Promise<StripePaymentMethod> {
    console.log('StripePaymentService: Adding payment method (stub)');
    
    return {
      id: `pm_${Date.now()}`,
      type: 'card',
      last4: '4242',
      brand: 'Visa',
    };
  }

  // Remove payment method (stub)
  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    console.log('StripePaymentService: Removing payment method (stub)', { paymentMethodId });
    return true;
  }

  // Get payment methods (stub)
  async getPaymentMethods(): Promise<StripePaymentMethod[]> {
    console.log('StripePaymentService: Getting payment methods (stub)');
    return [];
  }

  // Validate resource access (stub)
  async validateResourceAccess(userId: string, resource: string): Promise<boolean> {
    console.log('StripePaymentService: Validating resource access (stub)', { userId, resource });
    return true; // Allow access in stub implementation
  }
}

export default StripePaymentService;