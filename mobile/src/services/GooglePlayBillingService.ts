import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { modalService } from './modalService';

// Note: This would typically use react-native-purchases or @react-native-google-play/billing
// For this implementation, we'll create the interface and mock the functionality

const BILLING_STORAGE_KEY = '@TailTracker:billing_state';
const PURCHASED_PRODUCTS_KEY = '@TailTracker:purchased_products';

export interface BillingProduct {
  productId: string;
  type: 'inapp' | 'subs';
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  title: string;
  description: string;
  subscriptionPeriod?: string; // For subscriptions: P1M, P1Y, etc.
  freeTrialPeriod?: string; // For subscriptions
  introductoryPrice?: string;
  introductoryPriceAmountMicros?: number;
  introductoryPricePeriod?: string;
  introductoryPriceCycles?: number;
}

export interface BillingPurchase {
  purchaseToken: string;
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseState: 'purchased' | 'pending' | 'unspecified_state';
  acknowledged: boolean;
  autoRenewing?: boolean; // For subscriptions
  originalTransactionId?: string;
  isAcknowledged: boolean;
}

export interface BillingSubscription extends BillingPurchase {
  expiryDate: number;
  isActive: boolean;
  willRenew: boolean;
  renewalDate?: number;
  cancellationDate?: number;
  gracePeriodEndDate?: number;
  isInGracePeriod: boolean;
  isTrialPeriod: boolean;
  trialEndDate?: number;
}

export interface BillingError {
  code: string;
  message: string;
  debugMessage?: string;
}

export interface BillingState {
  isConnected: boolean;
  isInitialized: boolean;
  availableProducts: BillingProduct[];
  purchasedProducts: BillingPurchase[];
  activeSubscriptions: BillingSubscription[];
  pendingPurchases: BillingPurchase[];
}

// TailTracker product IDs
export const PRODUCT_IDS = {
  // One-time purchases
  PREMIUM_FEATURES: 'com.tailtracker.premium_features',
  ADVANCED_TRACKING: 'com.tailtracker.advanced_tracking',
  VETERINARY_RECORDS: 'com.tailtracker.veterinary_records',
  
  // Subscriptions
  PREMIUM_MONTHLY: 'com.tailtracker.premium_monthly',
  PREMIUM_YEARLY: 'com.tailtracker.premium_yearly',
  FAMILY_PLAN: 'com.tailtracker.family_plan',
  VET_PLAN: 'com.tailtracker.vet_plan',
  PRO_YEARLY: 'com.tailtracker.pro_yearly',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

class GooglePlayBillingService {
  private billingState: BillingState = {
    isConnected: false,
    isInitialized: false,
    availableProducts: [],
    purchasedProducts: [],
    activeSubscriptions: [],
    pendingPurchases: [],
  };

  private purchaseCallbacks: Set<(purchase: BillingPurchase) => void> = new Set();
  private errorCallbacks: Set<(error: BillingError) => void> = new Set();
  private connectionCallbacks: Set<(isConnected: boolean) => void> = new Set();

  constructor() {
    this.initializeBilling();
  }

  /**
   * Initialize Google Play Billing
   */
  async initializeBilling(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('Google Play Billing is only available on Android');
      return false;
    }

    try {
      // In a real implementation, this would initialize the billing client
      // For now, we'll simulate the initialization
      console.log('Initializing Google Play Billing...');
      
      // Load cached billing state
      await this.loadBillingState();
      
      // Connect to billing service
      const connected = await this.connectToBillingService();
      
      if (connected) {
        // Load available products
        await this.loadAvailableProducts();
        
        // Load purchase history
        await this.loadPurchaseHistory();
        
        // Check for pending purchases
        await this.processPendingPurchases();
        
        this.billingState.isInitialized = true;
        this.saveBillingState();
        
        console.log('Google Play Billing initialized successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing Google Play Billing:', error);
      this.notifyErrorCallbacks({
        code: 'BILLING_INIT_ERROR',
        message: 'Failed to initialize billing service',
        debugMessage: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Connect to billing service
   */
  private async connectToBillingService(): Promise<boolean> {
    try {
      // Mock connection - in real implementation, this would use the billing library
      this.billingState.isConnected = true;
      this.notifyConnectionCallbacks(true);
      return true;
    } catch (error) {
      console.error('Error connecting to billing service:', error);
      this.billingState.isConnected = false;
      this.notifyConnectionCallbacks(false);
      return false;
    }
  }

  /**
   * Load available products from Google Play
   */
  private async loadAvailableProducts(): Promise<void> {
    try {
      // Mock product data - in real implementation, this would query Google Play
      const mockProducts: BillingProduct[] = [
        {
          productId: PRODUCT_IDS.PREMIUM_FEATURES,
          type: 'inapp',
          price: '$9.99',
          priceAmountMicros: 9990000,
          priceCurrencyCode: 'USD',
          title: 'Premium Features',
          description: 'Unlock all premium features for TailTracker',
        },
        {
          productId: PRODUCT_IDS.PREMIUM_MONTHLY,
          type: 'subs',
          price: '€5.99',
          priceAmountMicros: 5990000,
          priceCurrencyCode: 'EUR',
          title: 'Premium Monthly',
          description: 'Monthly premium subscription',
          subscriptionPeriod: 'P1M',
        },
        {
          productId: PRODUCT_IDS.PREMIUM_YEARLY,
          type: 'subs',
          price: '€50.00',
          priceAmountMicros: 50000000,
          priceCurrencyCode: 'EUR',
          title: 'Premium Yearly',
          description: 'Yearly premium subscription with 30% savings',
          subscriptionPeriod: 'P1Y',
        },
        {
          productId: PRODUCT_IDS.FAMILY_PLAN,
          type: 'subs',
          price: '€8.99',
          priceAmountMicros: 8990000,
          priceCurrencyCode: 'EUR',
          title: 'Pro Plan Monthly',
          description: 'Pro features with unlimited family members',
          subscriptionPeriod: 'P1M',
        },
        {
          productId: PRODUCT_IDS.PRO_YEARLY,
          type: 'subs',
          price: '€80.00',
          priceAmountMicros: 80000000,
          priceCurrencyCode: 'EUR',
          title: 'Pro Plan Yearly',
          description: 'Yearly pro subscription with 26% savings',
          subscriptionPeriod: 'P1Y',
        },
      ];

      this.billingState.availableProducts = mockProducts;
    } catch (error) {
      console.error('Error loading available products:', error);
    }
  }

  /**
   * Load purchase history
   */
  private async loadPurchaseHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(PURCHASED_PRODUCTS_KEY);
      if (stored) {
        const purchases: BillingPurchase[] = JSON.parse(stored);
        this.billingState.purchasedProducts = purchases;
        
        // Filter active subscriptions
        this.updateActiveSubscriptions();
      }
    } catch (error) {
      console.error('Error loading purchase history:', error);
    }
  }

  /**
   * Update active subscriptions
   */
  private updateActiveSubscriptions(): void {
    const now = Date.now();
    this.billingState.activeSubscriptions = this.billingState.purchasedProducts
      .filter(purchase => {
        const product = this.getProductById(purchase.productId);
        return product?.type === 'subs' && purchase.purchaseState === 'purchased';
      })
      .map(purchase => {
        const subscription = purchase as BillingSubscription;
        subscription.isActive = subscription.expiryDate > now;
        subscription.isInGracePeriod = false; // Would be calculated based on grace period
        return subscription;
      });
  }

  /**
   * Process pending purchases
   */
  private async processPendingPurchases(): Promise<void> {
    try {
      // In real implementation, this would query pending purchases from Google Play
      this.billingState.pendingPurchases = [];
    } catch (error) {
      console.error('Error processing pending purchases:', error);
    }
  }

  /**
   * Get available products
   */
  getAvailableProducts(): BillingProduct[] {
    return this.billingState.availableProducts;
  }

  /**
   * Get product by ID
   */
  getProductById(productId: string): BillingProduct | undefined {
    return this.billingState.availableProducts.find(product => product.productId === productId);
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<BillingPurchase | null> {
    if (!this.billingState.isConnected) {
      throw new Error('Billing service not connected');
    }

    try {
      const product = this.getProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      console.log(`Initiating purchase for: ${productId}`);

      // In real implementation, this would launch the purchase flow
      // For now, we'll simulate a successful purchase
      const mockPurchase: BillingPurchase = {
        purchaseToken: `mock_token_${Date.now()}`,
        productId,
        transactionId: `mock_transaction_${Date.now()}`,
        transactionDate: Date.now(),
        transactionReceipt: 'mock_receipt_data',
        purchaseState: 'purchased',
        acknowledged: false,
        isAcknowledged: false,
      };

      // Add subscription-specific properties
      if (product.type === 'subs') {
        const subscription = mockPurchase as BillingSubscription;
        const expiryDate = new Date();
        
        if (product.subscriptionPeriod === 'P1M') {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (product.subscriptionPeriod === 'P1Y') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        subscription.expiryDate = expiryDate.getTime();
        subscription.isActive = true;
        subscription.willRenew = true;
        subscription.isInGracePeriod = false;
        subscription.isTrialPeriod = false;
        subscription.autoRenewing = true;
      }

      // Acknowledge the purchase
      await this.acknowledgePurchase(mockPurchase);
      
      // Add to purchased products
      this.billingState.purchasedProducts.push(mockPurchase);
      
      // Update active subscriptions
      this.updateActiveSubscriptions();
      
      // Save state
      await this.savePurchasedProducts();
      await this.saveBillingState();
      
      // Notify callbacks
      this.notifyPurchaseCallbacks(mockPurchase);
      
      return mockPurchase;
    } catch (error) {
      console.error('Error purchasing product:', error);
      this.notifyErrorCallbacks({
        code: 'PURCHASE_ERROR',
        message: 'Failed to purchase product',
        debugMessage: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Acknowledge a purchase
   */
  async acknowledgePurchase(purchase: BillingPurchase): Promise<boolean> {
    try {
      // In real implementation, this would acknowledge the purchase with Google Play
      purchase.acknowledged = true;
      purchase.isAcknowledged = true;
      
      console.log(`Purchase acknowledged: ${purchase.productId}`);
      return true;
    } catch (error) {
      console.error('Error acknowledging purchase:', error);
      return false;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<BillingPurchase[]> {
    try {
      if (!this.billingState.isConnected) {
        throw new Error('Billing service not connected');
      }

      // In real implementation, this would query purchase history from Google Play
      // For now, we'll return the cached purchases
      await this.loadPurchaseHistory();
      
      return this.billingState.purchasedProducts;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      this.notifyErrorCallbacks({
        code: 'RESTORE_ERROR',
        message: 'Failed to restore purchases',
        debugMessage: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Check if user has purchased a product
   */
  hasPurchased(productId: string): boolean {
    return this.billingState.purchasedProducts.some(
      purchase => purchase.productId === productId && purchase.purchaseState === 'purchased'
    );
  }

  /**
   * Check if user has active subscription
   */
  hasActiveSubscription(productId?: string): boolean {
    if (productId) {
      return this.billingState.activeSubscriptions.some(
        subscription => subscription.productId === productId && subscription.isActive
      );
    }
    
    return this.billingState.activeSubscriptions.some(subscription => subscription.isActive);
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): BillingSubscription[] {
    return this.billingState.activeSubscriptions.filter(sub => sub.isActive);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(productId: string): Promise<boolean> {
    try {
      // In real implementation, this would direct user to Google Play to cancel
      // We can't directly cancel subscriptions through the app
      
      modalService.showModal({
        title: 'Cancel Subscription',
        message: 'To cancel your subscription, you need to go to the Google Play Store.',
        type: 'info',
        icon: 'storefront-outline',
        actions: [
          { text: 'Cancel', style: 'default', onPress: () => {} },
          {
            text: 'Open Play Store',
            style: 'primary',
            onPress: () => {
              // Open Play Store subscriptions page
              // Linking.openURL('https://play.google.com/store/account/subscriptions');
            },
          },
        ]
      });
      
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  /**
   * Get billing state
   */
  getBillingState(): BillingState {
    return { ...this.billingState };
  }

  /**
   * Check if billing is available
   */
  isBillingAvailable(): boolean {
    return Platform.OS === 'android' && this.billingState.isConnected;
  }

  /**
   * Add purchase callback
   */
  addPurchaseCallback(callback: (purchase: BillingPurchase) => void): () => void {
    this.purchaseCallbacks.add(callback);
    return () => this.purchaseCallbacks.delete(callback);
  }

  /**
   * Add error callback
   */
  addErrorCallback(callback: (error: BillingError) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Add connection callback
   */
  addConnectionCallback(callback: (isConnected: boolean) => void): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  /**
   * Private helper methods
   */

  private async loadBillingState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(BILLING_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        this.billingState = { ...this.billingState, ...state };
      }
    } catch (error) {
      console.error('Error loading billing state:', error);
    }
  }

  private async saveBillingState(): Promise<void> {
    try {
      await AsyncStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(this.billingState));
    } catch (error) {
      console.error('Error saving billing state:', error);
    }
  }

  private async savePurchasedProducts(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PURCHASED_PRODUCTS_KEY,
        JSON.stringify(this.billingState.purchasedProducts)
      );
    } catch (error) {
      console.error('Error saving purchased products:', error);
    }
  }

  private notifyPurchaseCallbacks(purchase: BillingPurchase): void {
    this.purchaseCallbacks.forEach(callback => {
      try {
        callback(purchase);
      } catch (error) {
        console.error('Error in purchase callback:', error);
      }
    });
  }

  private notifyErrorCallbacks(error: BillingError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }

  private notifyConnectionCallbacks(isConnected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.purchaseCallbacks.clear();
    this.errorCallbacks.clear();
    this.connectionCallbacks.clear();
  }
}

// Export singleton instance
export const googlePlayBillingService = new GooglePlayBillingService();

// TailTracker-specific billing helpers
export const TailTrackerBilling = {
  /**
   * Check if user has premium access
   */
  hasPremiumAccess(): boolean {
    return (
      googlePlayBillingService.hasPurchased(PRODUCT_IDS.PREMIUM_FEATURES) ||
      googlePlayBillingService.hasActiveSubscription(PRODUCT_IDS.PREMIUM_MONTHLY) ||
      googlePlayBillingService.hasActiveSubscription(PRODUCT_IDS.PREMIUM_YEARLY) ||
      googlePlayBillingService.hasActiveSubscription(PRODUCT_IDS.FAMILY_PLAN)
    );
  },

  /**
   * Check if user has family plan access
   */
  hasFamilyPlanAccess(): boolean {
    return googlePlayBillingService.hasActiveSubscription(PRODUCT_IDS.FAMILY_PLAN);
  },

  /**
   * Check if user has vet plan access
   */
  hasVetPlanAccess(): boolean {
    return googlePlayBillingService.hasActiveSubscription(PRODUCT_IDS.VET_PLAN);
  },

  /**
   * Get premium subscription status
   */
  getPremiumStatus(): {
    isPremium: boolean;
    subscriptionType: 'none' | 'monthly' | 'yearly' | 'family' | 'vet' | 'lifetime';
    expiryDate?: number;
    willRenew?: boolean;
  } {
    const activeSubscriptions = googlePlayBillingService.getActiveSubscriptions();
    
    // Check for lifetime purchase
    if (googlePlayBillingService.hasPurchased(PRODUCT_IDS.PREMIUM_FEATURES)) {
      return {
        isPremium: true,
        subscriptionType: 'lifetime',
      };
    }

    // Check for active subscriptions
    for (const subscription of activeSubscriptions) {
      switch (subscription.productId) {
        case PRODUCT_IDS.PREMIUM_MONTHLY:
          return {
            isPremium: true,
            subscriptionType: 'monthly',
            expiryDate: subscription.expiryDate,
            willRenew: subscription.willRenew,
          };
        case PRODUCT_IDS.PREMIUM_YEARLY:
          return {
            isPremium: true,
            subscriptionType: 'yearly',
            expiryDate: subscription.expiryDate,
            willRenew: subscription.willRenew,
          };
        case PRODUCT_IDS.FAMILY_PLAN:
          return {
            isPremium: true,
            subscriptionType: 'family',
            expiryDate: subscription.expiryDate,
            willRenew: subscription.willRenew,
          };
        case PRODUCT_IDS.VET_PLAN:
          return {
            isPremium: true,
            subscriptionType: 'vet',
            expiryDate: subscription.expiryDate,
            willRenew: subscription.willRenew,
          };
      }
    }

    return {
      isPremium: false,
      subscriptionType: 'none',
    };
  },

  /**
   * Purchase premium features
   */
  async purchasePremium(type: 'monthly' | 'yearly' | 'lifetime' | 'family' = 'yearly'): Promise<BillingPurchase | null> {
    let productId: string;
    
    switch (type) {
      case 'monthly':
        productId = PRODUCT_IDS.PREMIUM_MONTHLY;
        break;
      case 'yearly':
        productId = PRODUCT_IDS.PREMIUM_YEARLY;
        break;
      case 'lifetime':
        productId = PRODUCT_IDS.PREMIUM_FEATURES;
        break;
      case 'family':
        productId = PRODUCT_IDS.FAMILY_PLAN;
        break;
      default:
        productId = PRODUCT_IDS.PREMIUM_YEARLY;
    }

    return await googlePlayBillingService.purchaseProduct(productId);
  },
};

// React hooks for billing
export const useGooglePlayBilling = () => {
  const [billingState, setBillingState] = React.useState<BillingState>(
    googlePlayBillingService.getBillingState()
  );
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    // Add callbacks
    const removePurchaseCallback = googlePlayBillingService.addPurchaseCallback((purchase) => {
      setBillingState(googlePlayBillingService.getBillingState());
    });

    const removeErrorCallback = googlePlayBillingService.addErrorCallback((error) => {
      console.error('Billing error:', error);
    });

    const removeConnectionCallback = googlePlayBillingService.addConnectionCallback((isConnected) => {
      setBillingState(googlePlayBillingService.getBillingState());
    });

    return () => {
      removePurchaseCallback();
      removeErrorCallback();
      removeConnectionCallback();
    };
  }, []);

  const purchaseProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      return await googlePlayBillingService.purchaseProduct(productId);
    } catch (error) {
      console.error('Error purchasing product:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      const purchases = await googlePlayBillingService.restorePurchases();
      setBillingState(googlePlayBillingService.getBillingState());
      return purchases;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    billingState,
    isLoading,
    purchaseProduct,
    restorePurchases,
    hasPurchased: googlePlayBillingService.hasPurchased.bind(googlePlayBillingService),
    hasActiveSubscription: googlePlayBillingService.hasActiveSubscription.bind(googlePlayBillingService),
    cancelSubscription: googlePlayBillingService.cancelSubscription.bind(googlePlayBillingService),
    isBillingAvailable: googlePlayBillingService.isBillingAvailable.bind(googlePlayBillingService),
    // TailTracker-specific helpers
    hasPremiumAccess: TailTrackerBilling.hasPremiumAccess,
    getPremiumStatus: TailTrackerBilling.getPremiumStatus,
    purchasePremium: TailTrackerBilling.purchasePremium,
  };
};