import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
import { useNavigation } from '@react-navigation/native';
import { 
  StripePaymentService, 
  SubscriptionPlan, 
  SubscriptionStatus 
} from '../../services/StripePaymentService';
import { SubscriptionPlanCard } from '../../components/Payment';
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { TailTrackerModal } from '../../components/UI/TailTrackerModal';

export const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const paymentService = StripePaymentService.getInstance();
  const { modalConfig, showError, showSuccess, showModal, hideModal } = useTailTrackerModal();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load current subscription status
      const status = await paymentService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      
      // Load available plans
      const plans = paymentService.getSubscriptionPlans();
      setAvailablePlans(plans);
    } catch (error) {
      showError('Error', 'Failed to load subscription information', 'alert-circle-outline');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    navigation.navigate('PaymentMethod', { planId });
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async (immediately: boolean = false) => {
    try {
      setCancelling(true);
      setShowCancelModal(false);
      
      const { success, error } = await paymentService.cancelSubscription(immediately);
      
      if (error) {
        showError('Error', error, 'alert-circle-outline');
      } else {
        showSuccess(
          'Subscription Cancelled',
          immediately 
            ? 'Your subscription has been cancelled immediately.'
            : 'Your subscription will be cancelled at the end of the current billing period.',
          'checkmark-circle-outline',
          loadSubscriptionData
        );
      }
    } catch (error) {
      showError('Error', 'Failed to cancel subscription', 'alert-circle-outline');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setSubscribing(true);
      
      const { success, error } = await paymentService.reactivateSubscription();
      
      if (error) {
        showError('Error', error, 'alert-circle-outline');
      } else {
        showSuccess(
          'Subscription Reactivated',
          'Your subscription has been reactivated successfully.',
          'checkmark-circle-outline',
          loadSubscriptionData
        );
      }
    } catch (error) {
      showError('Error', 'Failed to reactivate subscription', 'alert-circle-outline');
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url, error } = await paymentService.getBillingPortalUrl();
      
      if (error) {
        showError('Error', error, 'alert-circle-outline');
      } else if (url) {
        // Open billing portal URL
        // This would typically use Linking.openURL or in-app browser
        showModal({
          title: 'Billing Portal',
          message: 'This would open the Stripe billing portal for subscription management.',
          type: 'info',
          icon: 'open-outline',
          actions: [{ text: 'OK', style: 'primary', onPress: hideModal }]
        });
      }
    } catch (error) {
      showError('Error', 'Failed to open billing portal', 'alert-circle-outline');
    }
  };

  const renderCurrentSubscription = () => {
    if (!subscriptionStatus || subscriptionStatus.status === 'free') {
      return (
        <Card style={styles.currentSubscriptionCard}>
          <Card.Content>
            <Text style={styles.currentPlanTitle}>Current Plan: Free</Text>
            <Text style={styles.currentPlanDescription}>
              Basic pet management features with limited access.
            </Text>
            <Text style={styles.upgradePrompt}>
              Upgrade to Premium for unlimited pets, lost pet alerts, and more!
            </Text>
          </Card.Content>
        </Card>
      );
    }

    const isActive = subscriptionStatus.isActive;
    const willRenew = subscriptionStatus.willRenew !== false;

    return (
      <Card style={styles.currentSubscriptionCard}>
        <Card.Content>
          <Text style={styles.currentPlanTitle}>
            Current Plan: {subscriptionStatus.plan || 'Premium'}
          </Text>
          
          {subscriptionStatus.expiresAt && (
            <Text style={styles.expirationDate}>
              {willRenew ? 'Renews' : 'Expires'} on {subscriptionStatus.expiresAt.toLocaleDateString()}
            </Text>
          )}

          {subscriptionStatus.trialEndsAt && (
            <Text style={styles.trialDate}>
              Trial ends on {subscriptionStatus.trialEndsAt.toLocaleDateString()}
            </Text>
          )}

          <View style={styles.subscriptionActions}>
            {isActive && willRenew && (
              <Button
                mode="outlined"
                onPress={handleCancelSubscription}
                loading={cancelling}
                disabled={cancelling}
                style={styles.actionButton}
              >
                Cancel Subscription
              </Button>
            )}

            {isActive && !willRenew && (
              <Button
                mode="contained"
                onPress={handleReactivateSubscription}
                loading={subscribing}
                disabled={subscribing}
                style={styles.actionButton}
              >
                Reactivate Subscription
              </Button>
            )}

            <Button
              mode="text"
              onPress={handleManageBilling}
              style={styles.actionButton}
            >
              Manage Billing
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderCancelModal = () => (
    <Portal>
      <Modal
        visible={showCancelModal}
        onDismiss={() => setShowCancelModal(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>Cancel Subscription</Text>
        <Text style={styles.modalDescription}>
          How would you like to cancel your subscription?
        </Text>

        <Button
          mode="contained"
          onPress={() => confirmCancelSubscription(false)}
          loading={cancelling}
          disabled={cancelling}
          style={styles.modalButton}
        >
          Cancel at Period End
        </Button>

        <Button
          mode="outlined"
          onPress={() => confirmCancelSubscription(true)}
          loading={cancelling}
          disabled={cancelling}
          style={styles.modalButton}
        >
          Cancel Immediately
        </Button>

        <Button
          mode="text"
          onPress={() => setShowCancelModal(false)}
          disabled={cancelling}
          style={styles.modalButton}
        >
          Keep Subscription
        </Button>
      </Modal>
    </Portal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading subscription information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Subscription" />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentSubscription()}

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Available Plans</Text>
        
        {availablePlans.map((plan) => (
          <SubscriptionPlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={subscriptionStatus?.plan === plan.id}
            isPopular={plan.id === 'premium_monthly'}
            onSelectPlan={handleSelectPlan}
            loading={subscribing && selectedPlanId === plan.id}
            disabled={subscribing}
          />
        ))}

        <Card style={styles.benefitsCard}>
          <Card.Content>
            <Text style={styles.benefitsTitle}>Why Upgrade to Premium?</Text>
            <Text style={styles.benefitsDescription}>
              • Unlimited pets and photos{'\n'}
              • Lost pet alerts with GPS tracking{'\n'}
              • Vaccination reminders and health tracking{'\n'}
              • Family sharing with up to 10 members{'\n'}
              • Priority customer support{'\n'}
              • No ads and premium features
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderCancelModal()}
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  currentSubscriptionCard: {
    margin: 16,
    elevation: 4,
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  currentPlanDescription: {
    color: '#666',
    marginBottom: 8,
  },
  upgradePrompt: {
    color: '#6200EE',
    fontWeight: '500',
    marginBottom: 12,
  },
  expirationDate: {
    color: '#666',
    marginBottom: 4,
  },
  trialDate: {
    color: '#FF9800',
    marginBottom: 12,
    fontWeight: '500',
  },
  subscriptionActions: {
    marginTop: 8,
  },
  actionButton: {
    marginVertical: 4,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  benefitsCard: {
    margin: 16,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benefitsDescription: {
    lineHeight: 22,
    color: '#333',
  },
  bottomPadding: {
    height: 32,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    marginVertical: 4,
  },
});

export default SubscriptionScreen;