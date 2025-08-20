import { Platform } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  PRODUCT_TYPE,
  INTRO_ELIGIBILITY_STATUS,
} from 'react-native-purchases';

export interface SubscriptionProduct {
  identifier: string;
  description: string;
  title: string;
  price: string;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: string;
    priceString: string;
    period: string;
    cycles: number;
  };
  discounts?: Array<{
    identifier: string;
    price: string;
    priceString: string;
    cycles: number;
    period: string;
    type: 'introductory' | 'promotional';
  }>;
}

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  userCancelled?: boolean;
}

export interface RestoreResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

export class AppStoreBillingService {
  private static instance: AppStoreBillingService;
  private isConfigured = false;

  // TailTracker subscription identifiers
  private readonly SUBSCRIPTION_IDS = {
    PREMIUM_MONTHLY: 'com.tailtracker.premium.monthly',
    PREMIUM_YEARLY: 'com.tailtracker.premium.yearly',
    PREMIUM_LIFETIME: 'com.tailtracker.premium.lifetime',
  };

  private constructor() {}

  static getInstance(): AppStoreBillingService {
    if (!AppStoreBillingService.instance) {
      AppStoreBillingService.instance = new AppStoreBillingService();
    }
    return AppStoreBillingService.instance;
  }

  /**
   * Initialize RevenueCat with API keys
   */
  async initialize(apiKey: string, userId?: string): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('App Store billing is only available on iOS');
      return false;
    }

    try {
      Purchases.configure({ apiKey });

      if (userId) {
        await this.loginUser(userId);
      }

      // Set up delegate for customer info updates
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        // Handle customer info updates
        console.log('Customer info updated:', customerInfo);
      });

      this.isConfigured = true;
      return true;
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      return false;
    }
  }

  /**
   * Login user with custom user ID
   */
  async loginUser(userId: string): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      console.log('User logged in:', customerInfo);
      return true;
    } catch (error) {
      console.error('Error logging in user:', error);
      return false;
    }
  }

  /**
   * Logout current user
   */
  async logoutUser(): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.logOut();
      console.log('User logged out:', customerInfo);
      return true;
    } catch (error) {
      console.error('Error logging out user:', error);
      return false;
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isConfigured) {
      console.warn('RevenueCat not configured');
      return null;
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  /**
   * Get available offerings (subscription packages)
   */
  async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isConfigured) {
      console.warn('RevenueCat not configured');
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Error getting offerings:', error);
      return [];
    }
  }

  /**
   * Get current offering (default offering)
   */
  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    if (!this.isConfigured) {
      console.warn('RevenueCat not configured');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Error getting current offering:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<PurchaseResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'RevenueCat not configured',
      };
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      return {
        success: true,
        customerInfo,
      };
    } catch (error) {
      const purchaseError = error as PurchasesError;
      
      if (purchaseError.userCancelled) {
        return {
          success: false,
          userCancelled: true,
        };
      }

      return {
        success: false,
        error: purchaseError.message || 'Purchase failed',
      };
    }
  }

  /**
   * Purchase subscription by product ID
   */
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    const offering = await this.getCurrentOffering();
    
    if (!offering) {
      return {
        success: false,
        error: 'No offerings available',
      };
    }

    const packageToPurchase = offering.availablePackages.find(
      (pkg) => pkg.product.identifier === productId
    );

    if (!packageToPurchase) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    return this.purchasePackage(packageToPurchase);
  }

  /**
   * Purchase TailTracker Premium Monthly
   */
  async purchasePremiumMonthly(): Promise<PurchaseResult> {
    return this.purchaseSubscription(this.SUBSCRIPTION_IDS.PREMIUM_MONTHLY);
  }

  /**
   * Purchase TailTracker Premium Yearly
   */
  async purchasePremiumYearly(): Promise<PurchaseResult> {
    return this.purchaseSubscription(this.SUBSCRIPTION_IDS.PREMIUM_YEARLY);
  }

  /**
   * Purchase TailTracker Premium Lifetime
   */
  async purchasePremiumLifetime(): Promise<PurchaseResult> {
    return this.purchaseSubscription(this.SUBSCRIPTION_IDS.PREMIUM_LIFETIME);
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<RestoreResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'RevenueCat not configured',
      };
    }

    try {
      const { customerInfo } = await Purchases.restorePurchases();
      
      return {
        success: true,
        customerInfo,
      };
    } catch (error) {
      const restoreError = error as PurchasesError;
      
      return {
        success: false,
        error: restoreError.message || 'Restore failed',
      };
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return false;
    }

    // Check if any subscription is active
    const activeSubscriptions = Object.keys(customerInfo.entitlements.active);
    return activeSubscriptions.length > 0;
  }

  /**
   * Check if user has specific premium feature
   */
  async hasPremiumAccess(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return false;
    }

    // Check for TailTracker premium entitlement
    return customerInfo.entitlements.active['premium'] !== undefined;
  }

  /**
   * Get subscription product info
   */
  async getSubscriptionProducts(): Promise<SubscriptionProduct[]> {
    const offering = await this.getCurrentOffering();
    
    if (!offering) {
      return [];
    }

    return offering.availablePackages.map((pkg) => ({
      identifier: pkg.product.identifier,
      description: pkg.product.description,
      title: pkg.product.title,
      price: pkg.product.price.toString(),
      priceString: pkg.product.priceString,
      currencyCode: pkg.product.currencyCode,
      introPrice: pkg.product.introPrice ? {
        price: pkg.product.introPrice.price.toString(),
        priceString: pkg.product.introPrice.priceString,
        period: pkg.product.introPrice.periodUnit,
        cycles: pkg.product.introPrice.periodNumberOfUnits,
      } : undefined,
    }));
  }

  /**
   * Check intro eligibility for subscription
   */
  async checkIntroEligibility(productIds: string[]): Promise<{ [productId: string]: INTRO_ELIGIBILITY_STATUS }> {
    if (!this.isConfigured) {
      return {};
    }

    try {
      return await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);
    } catch (error) {
      console.error('Error checking intro eligibility:', error);
      return {};
    }
  }

  /**
   * Set user attributes for targeting and analytics
   */
  async setUserAttributes(attributes: { [key: string]: string | null }): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error('Error setting user attributes:', error);
    }
  }

  /**
   * Get subscriber attributes
   */
  async getSubscriberAttributes(): Promise<{ [key: string]: any }> {
    if (!this.isConfigured) {
      return {};
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo?.subscriberAttributes || {};
    } catch (error) {
      console.error('Error getting subscriber attributes:', error);
      return {};
    }
  }

  /**
   * Present code redemption sheet (iOS 14+)
   */
  async presentCodeRedemptionSheet(): Promise<void> {
    if (!this.isConfigured || Platform.OS !== 'ios') {
      return;
    }

    try {
      await Purchases.presentCodeRedemptionSheet();
    } catch (error) {
      console.error('Error presenting code redemption sheet:', error);
    }
  }

  /**
   * Get subscription status summary
   */
  async getSubscriptionStatus(): Promise<{
    hasActiveSubscription: boolean;
    hasPremiumAccess: boolean;
    expirationDate?: Date;
    productId?: string;
    willRenew?: boolean;
  }> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return {
        hasActiveSubscription: false,
        hasPremiumAccess: false,
      };
    }

    const premiumEntitlement = customerInfo.entitlements.active['premium'];
    
    if (!premiumEntitlement) {
      return {
        hasActiveSubscription: false,
        hasPremiumAccess: false,
      };
    }

    return {
      hasActiveSubscription: true,
      hasPremiumAccess: true,
      expirationDate: premiumEntitlement.expirationDate ? new Date(premiumEntitlement.expirationDate) : undefined,
      productId: premiumEntitlement.productIdentifier,
      willRenew: premiumEntitlement.willRenew,
    };
  }
}