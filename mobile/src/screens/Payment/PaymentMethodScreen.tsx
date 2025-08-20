import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  Appbar,
  Text,
  Button,
  Card,
  ActivityIndicator,
  Portal,
  Modal,
  Divider,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PaymentMethod } from '@stripe/stripe-react-native';
import { 
  StripePaymentService, 
  SubscriptionPlan 
} from '../../services/StripePaymentService';
import { 
  PaymentCardForm, 
  PaymentMethodSelector 
} from '../../components/Payment';

interface PaymentMethodScreenProps {
  route: {
    params: {
      planId?: string;
      isAddingPaymentMethod?: boolean;
    };
  };
}

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { planId, isAddingPaymentMethod = false } = route.params || {};

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const paymentService = StripePaymentService.getInstance();

  useEffect(() => {
    if (planId) {
      const plans = paymentService.getSubscriptionPlans();
      const selectedPlan = plans.find(p => p.id === planId);
      setPlan(selectedPlan || null);
    }
  }, [planId]);

  const handlePaymentMethodSelected = (paymentMethodId: string) => {
    setSelectedPaymentMethodId(paymentMethodId);
  };

  const handleAddNewPaymentMethod = () => {
    setShowAddCardForm(true);
  };

  const handlePaymentMethodCreated = async (paymentMethod: PaymentMethod) => {
    try {
      setProcessing(true);
      
      // Add payment method to customer
      const { success, error } = await paymentService.addPaymentMethod(paymentMethod.id);
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }

      // If we're just adding a payment method, go back
      if (isAddingPaymentMethod) {
        Alert.alert(
          'Success',
          'Payment method added successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Otherwise, use this payment method for subscription
      setSelectedPaymentMethodId(paymentMethod.id);
      setShowAddCardForm(false);
      
      Alert.alert(
        'Payment Method Added',
        'Would you like to use this payment method for your subscription?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: () => handleSubscribe(paymentMethod.id) },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add payment method');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubscribe = async (paymentMethodId?: string) => {
    if (!plan) {
      Alert.alert('Error', 'No subscription plan selected');
      return;
    }

    const methodId = paymentMethodId || selectedPaymentMethodId;
    
    if (!methodId) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setProcessing(true);

      // Handle digital wallet payments
      if (methodId === 'apple_pay') {
        const { paymentMethod, error } = await paymentService.createApplePayPaymentMethod(
          plan.price,
          plan.currency
        );

        if (error) {
          const parsedError = paymentService.parseStripeError(error);
          Alert.alert('Payment Error', parsedError.message);
          return;
        }

        if (paymentMethod) {
          await createSubscriptionWithPaymentMethod(paymentMethod.id);
        }
        return;
      }

      if (methodId === 'google_pay') {
        const { paymentMethod, error } = await paymentService.createGooglePayPaymentMethod(
          plan.price,
          plan.currency
        );

        if (error) {
          const parsedError = paymentService.parseStripeError(error);
          Alert.alert('Payment Error', parsedError.message);
          return;
        }

        if (paymentMethod) {
          await createSubscriptionWithPaymentMethod(paymentMethod.id);
        }
        return;
      }

      // Handle saved payment methods
      await createSubscriptionWithPaymentMethod(methodId);
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription');
    } finally {
      setProcessing(false);
    }
  };

  const createSubscriptionWithPaymentMethod = async (paymentMethodId: string) => {
    if (!plan) return;

    try {
      const { success, error, requiresAction, clientSecret } = await paymentService.createSubscription(
        plan.id,
        paymentMethodId
      );

      if (error) {
        Alert.alert('Subscription Error', error);
        return;
      }

      if (success) {
        Alert.alert(
          'Subscription Created!',
          `Welcome to ${plan.name}! Your subscription is now active.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.popToTop();
                navigation.navigate('Subscription');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create subscription');
    }
  };

  const renderSubscriptionSummary = () => {
    if (!plan) return null;

    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.summaryTitle}>Subscription Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan:</Text>
            <Text style={styles.summaryValue}>{plan.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price:</Text>
            <Text style={styles.summaryValue}>
              €{(plan.price / 100).toFixed(2)}/{plan.interval}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Trial:</Text>
            <Text style={styles.summaryValue}>7 days free</Text>
          </View>
          <Divider style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total Today:</Text>
            <Text style={styles.summaryTotal}>€0.00</Text>
          </View>
          <Text style={styles.trialNote}>
            You'll be charged €{(plan.price / 100).toFixed(2)} after your 7-day free trial.
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderAddCardModal = () => (
    <Portal>
      <Modal
        visible={showAddCardForm}
        onDismiss={() => setShowAddCardForm(false)}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Payment Method</Text>
          <Button
            mode="text"
            onPress={() => setShowAddCardForm(false)}
            disabled={processing}
          >
            Cancel
          </Button>
        </View>
        
        <PaymentCardForm
          onPaymentMethodCreated={handlePaymentMethodCreated}
          onError={(error) => Alert.alert('Error', error)}
          loading={processing}
          disabled={processing}
        />
      </Modal>
    </Portal>
  );

  const canProceed = selectedPaymentMethodId !== '';
  const screenTitle = isAddingPaymentMethod ? 'Add Payment Method' : 'Select Payment Method';

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={screenTitle} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {plan && renderSubscriptionSummary()}

        <PaymentMethodSelector
          onPaymentMethodSelected={handlePaymentMethodSelected}
          onAddNewPaymentMethod={handleAddNewPaymentMethod}
          selectedPaymentMethodId={selectedPaymentMethodId}
          showApplePay={!isAddingPaymentMethod}
          showGooglePay={!isAddingPaymentMethod}
        />

        {!isAddingPaymentMethod && plan && (
          <View style={styles.actionContainer}>
            <Button
              mode="contained"
              onPress={() => handleSubscribe()}
              disabled={!canProceed || processing}
              loading={processing}
              style={styles.subscribeButton}
              contentStyle={styles.subscribeButtonContent}
            >
              {processing ? 'Processing...' : `Start ${plan.name} Trial`}
            </Button>

            <Text style={styles.termsText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              You can cancel anytime.
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderAddCardModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryValue: {
    fontWeight: '500',
  },
  summaryDivider: {
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trialNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionContainer: {
    padding: 16,
  },
  subscribeButton: {
    marginVertical: 16,
  },
  subscribeButtonContent: {
    height: 48,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomPadding: {
    height: 32,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentMethodScreen;