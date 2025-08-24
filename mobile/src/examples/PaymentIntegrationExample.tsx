/**
 * TailTracker Payment Integration Example
 * 
 * This file demonstrates how to integrate Stripe payment processing
 * into your React Native app with proper initialization and error handling.
 * 
 * Copy the relevant parts into your App.tsx and main screens.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { PaymentInitializationService } from '../services/PaymentInitializationService';
import { StripePaymentService } from '../services/StripePaymentService';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import { PremiumGate } from '../components/Payment/PremiumGate';
import { PaymentErrorUtils } from '../utils/paymentErrorUtils';
import { modalService } from '../utils/modalService';

/**
 * Main App Component with Payment Integration
 */
export const AppWithPayments: React.FC = () => {
  const [paymentServicesReady, setPaymentServicesReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('user_123'); // From your auth system
  const [authToken, setAuthToken] = useState<string>('auth_token_here'); // From your auth system

  // Initialize payment services on app start
  useEffect(() => {
    initializePaymentServices();
  }, []);

  const initializePaymentServices = async () => {
    try {
      const paymentInit = PaymentInitializationService.getInstance();
      
      const result = await paymentInit.initializePaymentServices(userId, authToken);
      
      if (result.success) {
        setPaymentServicesReady(true);
        console.log('Payment services initialized successfully');
      } else {
        setInitializationError(result.error || 'Failed to initialize payment services');
        console.error('Payment initialization failed:', result.error);
      }
    } catch (error) {
      setInitializationError('Unexpected error during payment initialization');
      console.error('Payment initialization error:', error);
    }
  };

  // Handle user authentication changes
  const handleUserLogin = async (newUserId: string, newAuthToken: string) => {
    setUserId(newUserId);
    setAuthToken(newAuthToken);
    
    if (paymentServicesReady) {
      const paymentInit = PaymentInitializationService.getInstance();
      await paymentInit.updateUserAuth(newUserId, newAuthToken);
    }
  };

  const handleUserLogout = async () => {
    setUserId('');
    setAuthToken('');
    
    if (paymentServicesReady) {
      const paymentInit = PaymentInitializationService.getInstance();
      await paymentInit.clearUserAuth();
    }
  };

  if (!paymentServicesReady) {
    return (
      <View style={styles.initializationContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.initializationText}>
          {initializationError ? 'Payment services unavailable' : 'Initializing payment services...'}
        </Text>
        {initializationError && (
          <>
            <Text style={styles.errorText}>{initializationError}</Text>
            <Button mode="outlined" onPress={initializePaymentServices} style={styles.retryButton}>
              Retry
            </Button>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Your main app content here */}
      <PaymentDemoScreen />
    </View>
  );
};

/**
 * Demo screen showing payment integration usage
 */
const PaymentDemoScreen: React.FC = () => {
  const {
    subscriptionStatus,
    loading,
    error,
    hasPremiumAccess,
    canAccessFeature,
    checkResourceAccess,
    refreshStatus,
  } = usePremiumAccess();

  const [petCount, setPetCount] = useState(1);

  // Check if user can add more pets
  const handleAddPet = async () => {
    const access = await checkResourceAccess('pets', petCount);
    
    if (access.allowed) {
      setPetCount(prev => prev + 1);
      modalService.showSuccess('Success', 'Pet added successfully!', 'checkmark-circle-outline');
    } else {
      // Show premium gate
      modalService.showModal({
        title: 'Premium Feature Required',
        message: access.message,
        type: 'warning',
        icon: 'star-outline',
        actions: [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Upgrade', style: 'primary', onPress: () => navigateToSubscription() },
        ]
      });
    }
  };

  const navigateToSubscription = () => {
    // Navigate to subscription screen
    console.log('Navigate to subscription screen');
  };

  const handleSubscriptionAction = async () => {
    try {
      const stripeService = StripePaymentService.getInstance();
      
      if (hasPremiumAccess) {
        // Cancel subscription
        const result = await stripeService.cancelSubscription();
        if (result.success) {
          modalService.showSuccess('Success', 'Subscription cancelled successfully', 'checkmark-circle-outline');
          await refreshStatus();
        } else {
          PaymentErrorUtils.showPaymentAlert(result.error || 'Failed to cancel subscription');
        }
      } else {
        // Navigate to subscription purchase
        navigateToSubscription();
      }
    } catch (error) {
      PaymentErrorUtils.showPaymentAlert(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading subscription status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button mode="outlined" onPress={refreshStatus}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.demoContainer}>
      <Text style={styles.title}>TailTracker Payment Demo</Text>
      
      {/* Subscription Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Subscription Status</Text>
        <Text>Status: {subscriptionStatus?.status || 'Unknown'}</Text>
        <Text>Premium Access: {hasPremiumAccess ? 'Yes' : 'No'}</Text>
        <Text>Current Pets: {petCount}</Text>
        {subscriptionStatus?.expiresAt && (
          <Text>Expires: {subscriptionStatus.expiresAt.toLocaleDateString()}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleAddPet}
          style={styles.actionButton}
        >
          Add Pet {!hasPremiumAccess && petCount >= 1 && '(Premium)'}
        </Button>

        <Button
          mode={hasPremiumAccess ? 'outlined' : 'contained'}
          onPress={handleSubscriptionAction}
          style={styles.actionButton}
        >
          {hasPremiumAccess ? 'Cancel Subscription' : 'Upgrade to Premium'}
        </Button>

        <Button
          mode="text"
          onPress={refreshStatus}
          style={styles.actionButton}
        >
          Refresh Status
        </Button>
      </View>

      {/* Feature Access Examples */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Feature Access</Text>
        <Text>Unlimited Pets: {canAccessFeature('unlimited_pets') ? '✅' : '❌'}</Text>
        <Text>Lost Pet Alerts: {canAccessFeature('lost_pet_alerts') ? '✅' : '❌'}</Text>
        <Text>Vaccination Reminders: {canAccessFeature('vaccination_reminders') ? '✅' : '❌'}</Text>
        <Text>Family Sharing: {canAccessFeature('family_sharing_unlimited') ? '✅' : '❌'}</Text>
      </View>
    </View>
  );
};

/**
 * Example of Premium Gate Usage
 */
const PremiumFeatureExample: React.FC = () => {
  const { canAccessFeature } = usePremiumAccess();

  // Check if user can access vaccination reminders
  if (!canAccessFeature('vaccination_reminders')) {
    return (
      <PremiumGate
        feature="vaccination_reminders"
        title="Smart Vaccination Reminders"
        description="Never miss an important vaccination with our intelligent reminder system."
        benefits={[
          'Automatic vaccination scheduling',
          'Push notifications for upcoming vaccines',
          'Vet appointment integration',
          'Complete vaccination history'
        ]}
        onUpgrade={() => {
          // Navigate to subscription screen
          console.log('Navigate to upgrade');
        }}
      />
    );
  }

  // User has access, show the actual feature
  return (
    <View>
      <Text>Vaccination Reminders Feature Content</Text>
      {/* Your vaccination reminders UI here */}
    </View>
  );
};

/**
 * Example of Error Handling
 */
const PaymentErrorExample: React.FC = () => {
  const handlePaymentError = (error: any) => {
    // Log error for debugging
    PaymentErrorUtils.logError(error, 'PaymentErrorExample');

    // Show user-friendly error message
    PaymentErrorUtils.showPaymentAlert(error, () => {
      // Retry logic
      console.log('User requested retry');
    });
  };

  const handleSubscriptionError = (error: any) => {
    // Handle subscription-specific errors
    PaymentErrorUtils.handleSubscriptionError(error, () => {
      // Retry with different payment method
      console.log('Retry with different payment method');
    });
  };

  return (
    <View>
      <Button onPress={() => handlePaymentError('Test error')}>
        Test Error Handling
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  initializationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  initializationText: {
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  demoContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButtons: {
    marginBottom: 20,
  },
  actionButton: {
    marginVertical: 4,
  },
  featuresCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default AppWithPayments;