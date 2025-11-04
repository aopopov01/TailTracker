import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PaymentMethod } from '@stripe/stripe-react-native';
import {
  Appbar,
  Text,
  Button,
  Card,
  Portal,
  Modal,
  Divider,
} from 'react-native-paper';
import {
  PaymentCardForm,
  PaymentMethodSelector,
} from '../../components/Payment';
import { TailTrackerModal } from '../../components/UI/TailTrackerModal';
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import {
  StripePaymentService,
  SubscriptionPlan,
} from '../../services/StripePaymentService';

interface RouteParams {
  planId?: string;
  isAddingPaymentMethod?: boolean;
}

interface PaymentMethodScreenProps {
  route: {
    params?: RouteParams;
  };
}

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { planId, isAddingPaymentMethod = false } =
    (route.params as RouteParams) || {};

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    useState<string>('');
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const paymentService = StripePaymentService.getInstance();
  const { modalConfig, showError, showSuccess, showModal, hideModal } =
    useTailTrackerModal();

  useEffect(() => {
    if (planId) {
      const plans = paymentService.getSubscriptionPlans();
      const selectedPlan = plans.find(p => p.id === planId);
      setPlan(selectedPlan || null);
    }
  }, [planId, paymentService]);

  const handlePaymentMethodSelected = (paymentMethodId: string) => {
    setSelectedPaymentMethodId(paymentMethodId);
  };

  const handleAddNewPaymentMethod = () => {
    setShowAddCardForm(true);
  };

  const handlePaymentMethodCreated = async (paymentMethod: any) => {
    try {
      setProcessing(true);

      // Add payment method to customer
      const result = await paymentService.addPaymentMethod(paymentMethod.id);
      const { success, error } = result;

      if (error) {
        showError('Error', error, 'card-outline');
        return;
      }

      // If we're just adding a payment method, go back
      if (isAddingPaymentMethod) {
        showSuccess(
          'Success',
          'Payment method added successfully!',
          'checkmark-circle-outline',
          () => navigation.goBack()
        );
        return;
      }

      // Otherwise, use this payment method for subscription
      setSelectedPaymentMethodId(paymentMethod.id);
      setShowAddCardForm(false);

      showModal({
        title: 'Payment Method Added',
        message:
          'Would you like to use this payment method for your subscription?',
        type: 'success',
        icon: 'card-outline',
        actions: [
          { text: 'No', style: 'default' as const, onPress: hideModal },
          {
            text: 'Yes',
            style: 'primary' as const,
            onPress: () => {
              hideModal();
              handleSubscribe(paymentMethod.id);
            },
          },
        ],
      });
    } catch (error) {
      showError(
        'Error',
        'Failed to add payment method',
        'alert-circle-outline'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSubscribe = async (paymentMethodId?: string) => {
    if (!plan) {
      showError(
        'Error',
        'No subscription plan selected',
        'alert-circle-outline'
      );
      return;
    }

    const methodId = paymentMethodId || selectedPaymentMethodId;

    if (!methodId) {
      showError('Error', 'Please select a payment method', 'card-outline');
      return;
    }

    try {
      setProcessing(true);

      // Handle digital wallet payments
      if (methodId === 'apple_pay') {
        const result = await paymentService.createApplePayPaymentMethod(
          plan.price,
          plan.currency
        );

        if (result.error) {
          const parsedError = paymentService.parseStripeError(result.error);
          showError('Payment Error', parsedError.message, 'logo-apple');
          return;
        }

        if (result.paymentMethod) {
          await createSubscriptionWithPaymentMethod(result.paymentMethod.id);
        }
        return;
      }

      if (methodId === 'google_pay') {
        const result = await paymentService.createGooglePayPaymentMethod(
          plan.price,
          plan.currency
        );

        if (result.error) {
          const parsedError = paymentService.parseStripeError(result.error);
          showError('Payment Error', parsedError.message, 'logo-google');
          return;
        }

        if (result.paymentMethod) {
          await createSubscriptionWithPaymentMethod(result.paymentMethod.id);
        }
        return;
      }

      // Handle saved payment methods
      await createSubscriptionWithPaymentMethod(methodId);
    } catch (error) {
      showError(
        'Error',
        'Failed to process subscription',
        'alert-circle-outline'
      );
    } finally {
      setProcessing(false);
    }
  };

  const createSubscriptionWithPaymentMethod = async (
    paymentMethodId: string
  ) => {
    if (!plan) return;

    try {
      const result = await paymentService.createSubscription(
        plan.id,
        paymentMethodId
      );

      if (result.error) {
        showError('Subscription Error', result.error, 'alert-circle-outline');
        return;
      }

      if (result.success) {
        showSuccess(
          'Subscription Created!',
          `Welcome to ${plan.name}! Your subscription is now active.`,
          'checkmark-circle-outline',
          () => {
            // Navigate back to main screen
            navigation.goBack();
          }
        );
      }
    } catch (error) {
      showError(
        'Error',
        'Failed to create subscription',
        'alert-circle-outline'
      );
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
            You'll be charged €{(plan.price / 100).toFixed(2)} after your 7-day
            free trial.
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
            mode='text'
            onPress={() => setShowAddCardForm(false)}
            disabled={processing}
          >
            Cancel
          </Button>
        </View>

        <PaymentCardForm
          onPaymentMethodCreated={handlePaymentMethodCreated}
          onError={(error: string) => showError('Error', error, 'card-outline')}
          loading={processing}
          disabled={processing}
        />
      </Modal>
    </Portal>
  );

  const canProceed = selectedPaymentMethodId !== '';
  const screenTitle = isAddingPaymentMethod
    ? 'Add Payment Method'
    : 'Select Payment Method';

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
              mode='contained'
              onPress={() => handleSubscribe()}
              disabled={!canProceed || processing}
              loading={processing}
              style={styles.subscribeButton}
              contentStyle={styles.subscribeButtonContent}
            >
              {processing ? 'Processing...' : `Start ${plan.name} Trial`}
            </Button>

            <Text style={styles.termsText}>
              By subscribing, you agree to our Terms of Service and Privacy
              Policy. You can cancel anytime.
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderAddCardModal()}

      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
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
