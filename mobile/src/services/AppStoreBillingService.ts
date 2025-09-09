// AppStore/PlayStore billing integration - REMOVED RevenueCat dependency
// This service is now disabled - use StripePaymentService instead

import { Platform } from 'react-native';
import { StripePaymentService } from './StripePaymentService';

export interface SubscriptionProduct {
  identifier: string;
  description: string;
  title: string;
  price: string;
  priceString: string;
  currencyCode: string;
}

// Minimal service that delegates to Stripe
export class AppStoreBillingService {
  private static instance: AppStoreBillingService;
  private stripeService = StripePaymentService.getInstance();

  static getInstance(): AppStoreBillingService {
    if (!AppStoreBillingService.instance) {
      AppStoreBillingService.instance = new AppStoreBillingService();
    }
    return AppStoreBillingService.instance;
  }

  async initialize(): Promise<void> {
    // RevenueCat integration removed - using Stripe only
    console.log('AppStoreBillingService: Using Stripe payment service instead of RevenueCat');
  }

  async getOfferings(): Promise<SubscriptionProduct[]> {
    // Delegate to Stripe service
    const plans = this.stripeService.getSubscriptionPlans();
    return plans.map(plan => ({
      identifier: plan.id,
      description: plan.description || '',
      title: plan.name,
      price: plan.price.toString(),
      priceString: `$${plan.price}`,
      currencyCode: plan.currency.toUpperCase()
    }));
  }

  async purchasePackage(packageId: string): Promise<{ success: boolean; error?: string }> {
    // RevenueCat removed - return error to redirect to Stripe
    return {
      success: false,
      error: 'Please use web payment method - in-app purchases not available'
    };
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    // RevenueCat removed
    return {
      success: false,
      error: 'Restore purchases not available - please contact support'
    };
  }
}