import { Platform } from 'react-native';
import React from 'react';

// Types for billing
export interface Product {
  productId: string;
  price: string;
  currency: string;
  localizedPrice: string;
  title: string;
  description: string;
  type: 'inapp' | 'subs';
}

export interface Purchase {
  productId: string;
  transactionId: string;
  transactionDate: string;
  transactionReceipt: string;
  purchaseToken?: string;
  orderId?: string;
}

export interface PurchaseError {
  code: string;
  message: string;
  debugMessage?: string;
}

export type PurchaseResult = {
  success: true;
  purchase: Purchase;
} | {
  success: false;
  error: PurchaseError;
};

// Product IDs for TailTracker
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
  REMOVE_ADS: 'remove_ads',
  EXTRA_PETS: 'extra_pets_pack',
  PREMIUM_FEATURES: 'premium_features_pack',
} as const;

export const SUBSCRIPTION_IDS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
} as const;

class GooglePlayBillingService {
  private isInitialized = false;
  private availableProducts: Product[] = [];
  private activePurchases: Purchase[] = [];

  /**
   * Initialize Google Play Billing
   */
  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('Google Play Billing is only available on Android');
    }

    try {
      // Initialize RNIap (react-native-iap) or equivalent
      // This is a placeholder for the actual implementation
      console.log('Initializing Google Play Billing...');
      
      // Check if billing is supported
      const isSupported = await this.checkBillingSupport();
      if (!isSupported) {
        throw new Error('Google Play Billing is not supported on this device');
      }

      this.isInitialized = true;
      console.log('Google Play Billing initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Play Billing:', error);
      throw error;
    }
  }

  /**
   * Check if billing is supported
   */
  private async checkBillingSupport(): Promise<boolean> {
    // Implementation would check if Google Play Services is available
    // and if billing is supported
    return true; // Placeholder
  }

  /**
   * Get available products
   */
  async getProducts(): Promise<Product[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Fetch both in-app products and subscriptions
      const productIds = Object.values(PRODUCT_IDS);
      const subscriptionIds = Object.values(SUBSCRIPTION_IDS);

      // NOTE: Google Play Billing API integration pending
      // const skuDetails = await RNIap.getSubscriptions(subscriptionIds);
      // const productDetails = await RNIap.getProducts(productIds);
      
      // For now, return empty array until real billing is implemented
      this.availableProducts = [];
      return [];
    } catch (error) {
      console.error('Failed to get products:', error);
      throw error;
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`Purchasing product: ${productId}`);
      
      // Check if product exists
      const product = this.availableProducts.find(p => p.productId === productId);
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // For subscriptions, use subscription purchase flow
      if (product.type === 'subs') {
        return await this.purchaseSubscription(productId);
      }

      // Mock purchase flow - replace with actual billing API
      const purchase: Purchase = {
        productId,
        transactionId: `txn_${Date.now()}`,
        transactionDate: new Date().toISOString(),
        transactionReceipt: `receipt_${Date.now()}`,
        purchaseToken: `token_${Date.now()}`,
        orderId: `order_${Date.now()}`,
      };

      // Add to active purchases
      this.activePurchases.push(purchase);

      return {
        success: true,
        purchase,
      };
    } catch (error) {
      console.error(`Failed to purchase product ${productId}:`, error);
      
      return {
        success: false,
        error: {
          code: 'PURCHASE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Purchase a subscription
   */
  private async purchaseSubscription(subscriptionId: string): Promise<PurchaseResult> {
    try {
      console.log(`Purchasing subscription: ${subscriptionId}`);
      
      // Mock subscription purchase - replace with actual billing API
      const purchase: Purchase = {
        productId: subscriptionId,
        transactionId: `sub_txn_${Date.now()}`,
        transactionDate: new Date().toISOString(),
        transactionReceipt: `sub_receipt_${Date.now()}`,
        purchaseToken: `sub_token_${Date.now()}`,
        orderId: `sub_order_${Date.now()}`,
      };

      // Add to active purchases
      this.activePurchases.push(purchase);

      return {
        success: true,
        purchase,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SUBSCRIPTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<Purchase[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('Restoring purchases...');
      
      // Mock restore - replace with actual billing API
      // This would typically query Google Play to get all purchases for the user
      
      return this.activePurchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const purchases = await this.restorePurchases();
      return purchases.some(purchase => 
        Object.values(SUBSCRIPTION_IDS).includes(purchase.productId as any)
      );
    } catch (error) {
      console.error('Failed to check active subscription:', error);
      return false;
    }
  }

  /**
   * Check if user purchased specific product
   */
  async hasPurchasedProduct(productId: string): Promise<boolean> {
    try {
      const purchases = await this.restorePurchases();
      return purchases.some(purchase => purchase.productId === productId);
    } catch (error) {
      console.error('Failed to check product purchase:', error);
      return false;
    }
  }

  /**
   * Get purchase details for a product
   */
  async getPurchaseDetails(productId: string): Promise<Purchase | null> {
    try {
      const purchases = await this.restorePurchases();
      return purchases.find(purchase => purchase.productId === productId) || null;
    } catch (error) {
      console.error('Failed to get purchase details:', error);
      return null;
    }
  }

  /**
   * Validate purchase on server
   */
  async validatePurchase(purchase: Purchase): Promise<boolean> {
    try {
      // Send purchase details to your backend for validation
      const response = await fetch('/api/billing/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken,
          transactionId: purchase.transactionId,
          platform: 'android',
        }),
      });

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Failed to validate purchase:', error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.isInitialized = false;
    this.availableProducts = [];
    this.activePurchases = [];
  }
}

// Export singleton instance
export const googlePlayBilling = new GooglePlayBillingService();

// React hooks for billing
export const useBilling = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const availableProducts = await googlePlayBilling.getProducts();
      setProducts(availableProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const purchaseProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await googlePlayBilling.purchaseProduct(productId);
      
      if (!result.success) {
        setError(result.error.message);
        return null;
      }
      
      return result.purchase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    loadProducts,
    purchaseProduct,
    hasActiveSubscription: googlePlayBilling.hasActiveSubscription.bind(googlePlayBilling),
    hasPurchasedProduct: googlePlayBilling.hasPurchasedProduct.bind(googlePlayBilling),
  };
};