import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';
import { useSubscription } from '../../hooks/useSubscription';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  originalPrice?: number;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

export const SubscriptionManagementScreen: React.FC = () => {
  const { isPremium, loading: premiumLoading } = usePremiumStatus();
  const {
    subscription: currentSubscription,
    availablePlans,
    loading: subscriptionLoading,
    upgradeSubscription: purchasePlan,
    cancelSubscription,
    refetch: restorePurchases,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'month',
      current: !isPremium,
      features: [
        { text: 'Up to 3 pets', included: true },
        { text: 'Basic pet profiles', included: true },
        { text: 'Vaccination tracking', included: true },
        { text: 'Local photo storage', included: true },
        { text: 'Lost pet alerts (limited)', included: true },
        { text: 'Cloud sync and backup', included: false },
        { text: 'Unlimited pets', included: false },
        { text: 'Advanced health tracking', included: false },
        { text: 'Priority support', included: false },
        { text: 'Family sharing', included: false },
      ],
    },
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      price: 5.99,
      period: 'month',
      current: isPremium && currentSubscription?.planId === 'premium_monthly',
      features: [
        { text: 'Unlimited pets', included: true },
        { text: 'Cloud sync and backup', included: true },
        { text: 'Advanced health tracking', included: true },
        { text: 'Extended lost pet alerts', included: true },
        { text: 'Family sharing (up to 6 members)', included: true },
        { text: 'Priority support', included: true },
        { text: 'Export data', included: true },
        { text: 'Offline mode', included: true },
        { text: 'Custom reminders', included: true },
        { text: 'Advanced analytics', included: true },
      ],
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      price: 39.99,
      period: 'year',
      originalPrice: 59.88,
      popular: true,
      current: isPremium && currentSubscription?.planId === 'premium_yearly',
      features: [
        { text: 'All Premium Monthly features', included: true },
        { text: '33% savings vs monthly', included: true },
        { text: 'Priority feature requests', included: true },
        { text: 'Extended storage (10GB)', included: true },
      ],
    },
  ];

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      // Show downgrade confirmation
      if (isPremium) {
        Alert.alert(
          'Downgrade to Free',
          'Are you sure you want to downgrade to the free plan? You will lose access to premium features at the end of your current billing period.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Downgrade',
              style: 'destructive',
              onPress: handleCancelSubscription,
            },
          ]
        );
      }
      return;
    }

    setSelectedPlan(planId);
  };

  const handlePurchase = async (planId: string) => {
    if (!planId) return;

    setIsPurchasing(true);
    try {
      await purchasePlan(planId);

      Alert.alert(
        'Subscription Activated',
        'Welcome to TailTracker Premium! You now have access to all premium features.',
        [{ text: 'Great!', onPress: () => setSelectedPlan(null) }]
      );
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        error.message || 'Failed to complete purchase. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will continue to have access to premium features until the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setIsCanceling(true);
            try {
              await cancelSubscription();

              Alert.alert(
                'Subscription Canceled',
                'Your subscription has been canceled. You will continue to have access to premium features until the end of your current billing period.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert(
                'Cancellation Failed',
                error.message ||
                  'Failed to cancel subscription. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    try {
      await restorePurchases();

      Alert.alert(
        'Purchases Restored',
        'Your previous purchases have been restored successfully.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Restore Failed',
        error.message || 'Failed to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => (
    <View
      key={plan.id}
      style={[
        styles.planCard,
        plan.current && styles.currentPlanCard,
        plan.popular && styles.popularPlanCard,
      ]}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most Popular</Text>
        </View>
      )}

      {plan.current && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Current Plan</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>

        <View style={styles.planPricing}>
          {plan.originalPrice && (
            <Text style={styles.originalPrice}>
              ${plan.originalPrice}/{plan.period}
            </Text>
          )}
          <Text style={styles.planPrice}>
            {plan.price === 0 ? 'Free' : `$${plan.price}/${plan.period}`}
          </Text>
          {plan.originalPrice && (
            <Text style={styles.savings}>
              Save ${(plan.originalPrice - plan.price).toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.planFeatures}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons
              name={feature.included ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={feature.included ? '#34C759' : '#C7C7CC'}
            />
            <Text
              style={[
                styles.featureText,
                !feature.included && styles.disabledFeatureText,
              ]}
            >
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.planActions}>
        {plan.id === 'free' ? (
          isPremium ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.downgradeButton]}
              onPress={() => handlePlanSelect(plan.id)}
              disabled={isCanceling}
            >
              {isCanceling ? (
                <ActivityIndicator size='small' color='#FF3B30' />
              ) : (
                <Text style={styles.downgradeButtonText}>Downgrade</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.currentPlanIndicator}>
              <Text style={styles.currentPlanText}>Current Plan</Text>
            </View>
          )
        ) : plan.current ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelSubscription}
            disabled={isCanceling}
          >
            {isCanceling ? (
              <ActivityIndicator size='small' color='#FF3B30' />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.upgradeButton,
              plan.popular && styles.popularUpgradeButton,
            ]}
            onPress={() => handlePurchase(plan.id)}
            disabled={isPurchasing}
          >
            {isPurchasing && selectedPlan === plan.id ? (
              <ActivityIndicator size='small' color='#FFF' />
            ) : (
              <Text style={styles.upgradeButtonText}>
                {isPremium ? 'Change Plan' : 'Upgrade Now'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (premiumLoading || subscriptionLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>
            Loading subscription details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Subscription Info */}
        {isPremium && currentSubscription && (
          <View style={styles.currentSubscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Ionicons name='diamond' size={24} color='#FF9500' />
              <Text style={styles.subscriptionTitle}>Premium Active</Text>
            </View>

            <View style={styles.subscriptionDetails}>
              <Text style={styles.subscriptionPlan}>
                {(currentSubscription as any).plan_name || 'Premium Plan'}
              </Text>
              <Text style={styles.subscriptionStatus}>
                {!(currentSubscription as any).cancelAtPeriodEnd
                  ? `Renews on ${new Date(currentSubscription.currentPeriodEnd || '').toLocaleDateString()}`
                  : `Expires on ${new Date(currentSubscription.currentPeriodEnd || '').toLocaleDateString()}`}
              </Text>
            </View>
          </View>
        )}

        {/* Plan Comparison */}
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <Text style={styles.sectionDescription}>
            Unlock powerful features to better care for your pets
          </Text>

          {plans.map(renderPlanCard)}
        </View>

        {/* Additional Options */}
        <View style={styles.additionalOptions}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleRestorePurchases}
          >
            <Ionicons name='refresh' size={20} color='#007AFF' />
            <Text style={styles.optionButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Subscription Benefits</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Ionicons name='shield-checkmark' size={16} color='#34C759' />
                <Text style={styles.benefitText}>
                  30-day money-back guarantee
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name='sync' size={16} color='#007AFF' />
                <Text style={styles.benefitText}>
                  Automatic cloud sync across devices
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name='people' size={16} color='#FF9500' />
                <Text style={styles.benefitText}>
                  Share with family members
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name='headset' size={16} color='#8E8E93' />
                <Text style={styles.benefitText}>
                  Priority customer support
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              Subscriptions automatically renew unless canceled at least 24
              hours before the end of the current period. You can manage your
              subscription in your App Store account settings.
            </Text>

            <View style={styles.legalLinks}>
              <TouchableOpacity style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  currentSubscriptionCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
  },
  subscriptionDetails: {
    marginLeft: 32,
  },
  subscriptionPlan: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#8E8E93',
  },
  plansContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  currentPlanCard: {
    borderColor: '#34C759',
  },
  popularPlanCard: {
    borderColor: '#007AFF',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  planPricing: {
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  savings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 4,
  },
  planFeatures: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  disabledFeatureText: {
    color: '#C7C7CC',
  },
  planActions: {
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
  },
  popularUpgradeButton: {
    backgroundColor: '#007AFF',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  downgradeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  downgradeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF9500',
  },
  currentPlanIndicator: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  currentPlanText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34C759',
  },
  additionalOptions: {
    padding: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 12,
  },
  legalSection: {
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    gap: 24,
  },
  legalLink: {
    paddingVertical: 8,
  },
  legalLinkText: {
    fontSize: 14,
    color: '#007AFF',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SubscriptionManagementScreen;
