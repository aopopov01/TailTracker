// TailTracker In-App Purchase Testing Flows
// Comprehensive testing implementation for subscription flows and premium features

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
} from 'react-native-purchases';

// ============================================================================
// PURCHASE SERVICE IMPLEMENTATION
// ============================================================================

export class PurchaseService {
  private static instance: PurchaseService;
  private isInitialized = false;

  static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService();
    }
    return PurchaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = Platform.OS === 'ios' 
        ? process.env.REVENUECAT_APPLE_API_KEY
        : process.env.REVENUECAT_GOOGLE_API_KEY;

      if (!apiKey) {
        throw new Error('RevenueCat API key not configured');
      }

      await Purchases.configure({ apiKey });
      
      // Set debug mode for testing
      if (__DEV__) {
        await Purchases.setDebugLogsEnabled(true);
      }

      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async identifyUser(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log(`✅ User identified: ${userId}`);
    } catch (error) {
      console.error('❌ Failed to identify user:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('❌ Failed to get offerings:', error);
      return null;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('❌ Failed to get customer info:', error);
      throw error;
    }
  }

  async purchasePackage(purchasePackage: PurchasesPackage): Promise<boolean> {
    try {
      const customerInfo = await Purchases.purchasePackage(purchasePackage);
      const isPremium = customerInfo.entitlements.active.premium !== undefined;
      
      if (isPremium) {
        console.log('✅ Purchase successful - Premium activated');
        return true;
      } else {
        console.log('⚠️ Purchase completed but premium not activated');
        return false;
      }
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('ℹ️ User cancelled purchase');
        return false;
      } else {
        console.error('❌ Purchase failed:', error);
        throw error;
      }
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active.premium !== undefined;
      
      if (isPremium) {
        console.log('✅ Purchases restored - Premium activated');
        return true;
      } else {
        console.log('ℹ️ No active purchases to restore');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(): Promise<{
    isPremium: boolean;
    expirationDate?: string;
    willRenew?: boolean;
    isInTrial?: boolean;
    productIdentifier?: string;
  }> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const premiumEntitlement = customerInfo.entitlements.active.premium;

      if (premiumEntitlement) {
        return {
          isPremium: true,
          expirationDate: premiumEntitlement.expirationDate,
          willRenew: premiumEntitlement.willRenew,
          isInTrial: premiumEntitlement.isInIntroOfferPeriod,
          productIdentifier: premiumEntitlement.productIdentifier,
        };
      } else {
        return { isPremium: false };
      }
    } catch (error) {
      console.error('❌ Failed to check subscription status:', error);
      return { isPremium: false };
    }
  }
}

// ============================================================================
// TESTING COMPONENTS
// ============================================================================

export const PurchaseTestingDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const purchaseService = PurchaseService.getInstance();

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    setIsLoading(true);
    try {
      await purchaseService.initialize();
      await refreshData();
      addTestResult('✅ Purchase service initialized');
    } catch (error) {
      addTestResult(`❌ Initialization failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [status, currentOfferings] = await Promise.all([
        purchaseService.checkSubscriptionStatus(),
        purchaseService.getOfferings(),
      ]);
      
      setSubscriptionStatus(status);
      setOfferings(currentOfferings);
    } catch (error) {
      addTestResult(`❌ Failed to refresh data: ${error}`);
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // ============================================================================
  // TEST SCENARIOS
  // ============================================================================

  const testScenarios = {
    // Test 1: Purchase Monthly Subscription
    testMonthlyPurchase: async () => {
      addTestResult('🧪 Testing monthly subscription purchase...');
      setIsLoading(true);
      
      try {
        if (!offerings?.monthly) {
          throw new Error('Monthly package not available');
        }

        const success = await purchaseService.purchasePackage(offerings.monthly);
        if (success) {
          addTestResult('✅ Monthly subscription purchased successfully');
          await refreshData();
        } else {
          addTestResult('⚠️ Monthly subscription purchase failed');
        }
      } catch (error: any) {
        addTestResult(`❌ Monthly purchase error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },

    // Test 2: Purchase Yearly Subscription
    testYearlyPurchase: async () => {
      addTestResult('🧪 Testing yearly subscription purchase...');
      setIsLoading(true);
      
      try {
        if (!offerings?.annual) {
          throw new Error('Yearly package not available');
        }

        const success = await purchaseService.purchasePackage(offerings.annual);
        if (success) {
          addTestResult('✅ Yearly subscription purchased successfully');
          await refreshData();
        } else {
          addTestResult('⚠️ Yearly subscription purchase failed');
        }
      } catch (error: any) {
        addTestResult(`❌ Yearly purchase error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },

    // Test 3: Restore Purchases
    testRestorePurchases: async () => {
      addTestResult('🧪 Testing restore purchases...');
      setIsLoading(true);
      
      try {
        const success = await purchaseService.restorePurchases();
        if (success) {
          addTestResult('✅ Purchases restored successfully');
          await refreshData();
        } else {
          addTestResult('ℹ️ No purchases to restore');
        }
      } catch (error: any) {
        addTestResult(`❌ Restore error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },

    // Test 4: Check Subscription Status
    testSubscriptionStatus: async () => {
      addTestResult('🧪 Testing subscription status check...');
      
      try {
        const status = await purchaseService.checkSubscriptionStatus();
        addTestResult(`📊 Subscription Status: ${JSON.stringify(status, null, 2)}`);
        setSubscriptionStatus(status);
      } catch (error: any) {
        addTestResult(`❌ Status check error: ${error.message}`);
      }
    },

    // Test 5: User Identification
    testUserIdentification: async () => {
      addTestResult('🧪 Testing user identification...');
      
      try {
        const testUserId = `test_user_${Date.now()}`;
        await purchaseService.identifyUser(testUserId);
        addTestResult(`✅ User identified: ${testUserId}`);
      } catch (error: any) {
        addTestResult(`❌ User identification error: ${error.message}`);
      }
    },

    // Test 6: Error Handling
    testErrorHandling: async () => {
      addTestResult('🧪 Testing error handling...');
      
      try {
        // Simulate error by trying to purchase without offerings
        await purchaseService.purchasePackage(null as any);
      } catch (error: any) {
        addTestResult(`✅ Error handled correctly: ${error.message}`);
      }
    },
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderSubscriptionStatus = () => (
    <View style={{ padding: 16, backgroundColor: '#F8F9FA', borderRadius: 8, marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
        Subscription Status
      </Text>
      {subscriptionStatus ? (
        <>
          <Text>Premium: {subscriptionStatus.isPremium ? '✅ Active' : '❌ Inactive'}</Text>
          {subscriptionStatus.isPremium && (
            <>
              <Text>Expires: {subscriptionStatus.expirationDate}</Text>
              <Text>Will Renew: {subscriptionStatus.willRenew ? 'Yes' : 'No'}</Text>
              <Text>In Trial: {subscriptionStatus.isInTrial ? 'Yes' : 'No'}</Text>
              <Text>Product: {subscriptionStatus.productIdentifier}</Text>
            </>
          )}
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );

  const renderOfferings = () => (
    <View style={{ padding: 16, backgroundColor: '#F8F9FA', borderRadius: 8, marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
        Available Offerings
      </Text>
      {offerings ? (
        <>
          <Text>Offering ID: {offerings.identifier}</Text>
          <Text>Packages: {offerings.availablePackages.length}</Text>
          {offerings.availablePackages.map((pkg, index) => (
            <Text key={index}>
              • {pkg.identifier}: {pkg.product.priceString}
            </Text>
          ))}
        </>
      ) : (
        <Text>No offerings available</Text>
      )}
    </View>
  );

  const renderTestButtons = () => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
        Test Scenarios
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testScenarios.testMonthlyPurchase}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Monthly Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#34C759', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testScenarios.testYearlyPurchase}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Yearly Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#FF9500', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testScenarios.testRestorePurchases}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Restore</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#5856D6', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testScenarios.testSubscriptionStatus}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Check Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#AF52DE', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testScenarios.testUserIdentification}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test User ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#FF3B30', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testScenarios.testErrorHandling}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Errors</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTestResults = () => (
    <View style={{ padding: 16, backgroundColor: '#F8F9FA', borderRadius: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
        Test Results
      </Text>
      <ScrollView style={{ maxHeight: 200 }}>
        {testResults.map((result, index) => (
          <Text key={index} style={{ fontSize: 12, marginBottom: 4, fontFamily: 'monospace' }}>
            {result}
          </Text>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={{ backgroundColor: '#8E8E93', padding: 8, borderRadius: 4, marginTop: 8 }}
        onPress={() => setTestResults([])}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>Clear Results</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        TailTracker Purchase Testing
      </Text>

      {isLoading && (
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 8 }}>Processing...</Text>
        </View>
      )}

      {renderSubscriptionStatus()}
      {renderOfferings()}
      {renderTestButtons()}
      {renderTestResults()}
    </ScrollView>
  );
};

// ============================================================================
// PREMIUM FEATURE GATE COMPONENT
// ============================================================================

interface PremiumGateProps {
  featureName: string;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  featureName,
  children,
  fallbackComponent,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const purchaseService = PurchaseService.getInstance();
      const status = await purchaseService.checkSubscriptionStatus();
      setIsPremium(status.isPremium);
    } catch (error) {
      console.error('Failed to check premium status:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const showUpgradePrompt = () => {
    Alert.alert(
      'Premium Feature',
      `${featureName} is a premium feature. Upgrade to TailTracker Premium to unlock this and other advanced features.`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => {/* Navigate to paywall */} },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator size="small" color="#007AFF" />;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return fallbackComponent || (
    <TouchableOpacity
      style={{
        padding: 16,
        backgroundColor: '#FFF3CD',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFEAA7',
      }}
      onPress={showUpgradePrompt}
    >
      <Text style={{ textAlign: 'center', color: '#856404' }}>
        🔒 {featureName} - Premium Feature
      </Text>
      <Text style={{ textAlign: 'center', fontSize: 12, color: '#856404', marginTop: 4 }}>
        Tap to upgrade
      </Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

export const PurchaseTestingUtils = {
  // Automated test suite
  runAutomatedTests: async () => {
    const results: { test: string; success: boolean; error?: string }[] = [];
    const purchaseService = PurchaseService.getInstance();

    const tests = [
      {
        name: 'Initialize Purchase Service',
        test: () => purchaseService.initialize(),
      },
      {
        name: 'Get Offerings',
        test: () => purchaseService.getOfferings(),
      },
      {
        name: 'Check Customer Info',
        test: () => purchaseService.getCustomerInfo(),
      },
      {
        name: 'Check Subscription Status',
        test: () => purchaseService.checkSubscriptionStatus(),
      },
    ];

    for (const { name, test } of tests) {
      try {
        await test();
        results.push({ test: name, success: true });
      } catch (error: any) {
        results.push({ test: name, success: false, error: error.message });
      }
    }

    return results;
  },

  // Performance benchmarks
  measurePerformance: async () => {
    const start = Date.now();
    const purchaseService = PurchaseService.getInstance();
    
    try {
      await purchaseService.getCustomerInfo();
      const duration = Date.now() - start;
      console.log(`Performance: Customer info retrieved in ${duration}ms`);
      return duration;
    } catch (error) {
      console.error('Performance test failed:', error);
      return -1;
    }
  },

  // Validate purchase receipts
  validateReceipt: async () => {
    try {
      const purchaseService = PurchaseService.getInstance();
      const customerInfo = await purchaseService.getCustomerInfo();
      
      const hasValidReceipt = Object.keys(customerInfo.entitlements.active).length > 0;
      console.log(`Receipt validation: ${hasValidReceipt ? 'Valid' : 'Invalid'}`);
      return hasValidReceipt;
    } catch (error) {
      console.error('Receipt validation failed:', error);
      return false;
    }
  },
};

export default {
  PurchaseService,
  PurchaseTestingDashboard,
  PremiumGate,
  PurchaseTestingUtils,
};