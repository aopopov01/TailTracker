import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  Chip,
  List,
} from 'react-native-paper';
import { tailTrackerColors } from '../../design-system/core/colors';
import { SubscriptionPlan } from '../../services/StripePaymentService';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isCurrentPlan = false,
  isPopular = false,
  onSelectPlan,
  loading = false,
  disabled = false,
}) => {
  const formatPrice = (price: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    });
    return formatter.format(price / 100);
  };

  const formatFeature = (feature: string) => {
    const featureLabels: Record<string, string> = {
      unlimited_pets: 'Unlimited pets',
      unlimited_photos: 'Unlimited photos per pet',
      lost_pet_alerts: 'Lost pet alerts',
      vaccination_reminders: 'Vaccination reminders',
      medication_tracking: 'Medication tracking',
      advanced_health_tracking: 'Advanced health tracking',
      family_sharing_unlimited: 'Family sharing (up to 10 members)',
      basic_profiles: 'Basic pet profiles',
      basic_vaccination_tracking: 'Basic vaccination tracking',
    };

    return featureLabels[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getButtonText = () => {
    if (isCurrentPlan) {
      return 'Current Plan';
    }
    if (loading) {
      return 'Processing...';
    }
    return `Choose ${plan.name}`;
  };

  const getButtonMode = () => {
    if (isCurrentPlan) {
      return 'outlined' as const;
    }
    return 'contained' as const;
  };

  return (
    <Card style={[
      styles.container,
      isPopular && styles.popularPlan,
      isCurrentPlan && styles.currentPlan,
    ]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Chip mode="flat" style={styles.popularChip} textStyle={styles.popularChipText}>
            Most Popular
          </Chip>
        </View>
      )}

      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Title style={[
            styles.planName,
            isPopular && styles.popularPlanName,
          ]}>
            {plan.name}
          </Title>
          
          <View style={styles.priceContainer}>
            <Text style={[
              styles.price,
              isPopular && styles.popularPrice,
            ]}>
              {formatPrice(plan.price, plan.currency)}
            </Text>
            <Text style={styles.interval}>
              /{plan.interval}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          {plan.description}
        </Text>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features included:</Text>
          {plan.features.map((feature, index) => (
            <List.Item
              key={index}
              title={formatFeature(feature)}
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon="check" 
                  color={isPopular ? tailTrackerColors.primary.trustBlue : tailTrackerColors.semantic.successPrimary} 
                />
              )}
              titleStyle={styles.featureText}
              style={styles.featureItem}
            />
          ))}
        </View>

        <Button
          mode={getButtonMode()}
          onPress={() => onSelectPlan(plan.id)}
          disabled={disabled || loading || isCurrentPlan}
          loading={loading}
          style={[
            styles.selectButton,
            isPopular && styles.popularSelectButton,
            isCurrentPlan && styles.currentPlanButton,
          ]}
          contentStyle={styles.selectButtonContent}
          labelStyle={[
            styles.selectButtonLabel,
            isCurrentPlan && styles.currentPlanButtonLabel,
          ]}
        >
          {getButtonText()}
        </Button>

        {plan.id === 'premium_monthly' && !isCurrentPlan && (
          <Text style={styles.trialNote}>
            7-day free trial included
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
    elevation: 4,
    borderRadius: 12,
  },
  popularPlan: {
    borderColor: tailTrackerColors.primary.trustBlue, // WCAG AA compliant
    borderWidth: 2,
    elevation: 8,
  },
  currentPlan: {
    borderColor: tailTrackerColors.semantic.successPrimary, // WCAG AA compliant
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    zIndex: 1,
  },
  popularChip: {
    backgroundColor: tailTrackerColors.primary.trustBlue, // WCAG AA compliant
  },
  popularChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    textAlign: 'center',
    marginBottom: 8,
  },
  popularPlanName: {
    color: tailTrackerColors.primary.trustBlue, // WCAG AA: 7.63:1
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: tailTrackerColors.light.textPrimary, // WCAG AA: 16.05:1
  },
  popularPrice: {
    color: tailTrackerColors.primary.trustBlue, // WCAG AA: 7.63:1
  },
  interval: {
    fontSize: 16,
    color: tailTrackerColors.light.textSecondary, // WCAG AA: 7.24:1
    marginLeft: 4,
  },
  description: {
    textAlign: 'center',
    color: tailTrackerColors.light.textSecondary, // WCAG AA: 7.24:1
    marginBottom: 24,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: tailTrackerColors.light.textPrimary, // WCAG AA: 16.05:1
  },
  featureItem: {
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  popularSelectButton: {
    backgroundColor: tailTrackerColors.primary.trustBlue, // WCAG AA compliant
  },
  currentPlanButton: {
    borderColor: tailTrackerColors.semantic.successPrimary, // WCAG AA compliant
  },
  selectButtonContent: {
    height: 48,
  },
  selectButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentPlanButtonLabel: {
    color: tailTrackerColors.semantic.successPrimary, // WCAG AA: 4.8:1
  },
  trialNote: {
    textAlign: 'center',
    fontSize: 12,
    color: tailTrackerColors.light.textSecondary, // WCAG AA: 7.24:1
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default SubscriptionPlanCard;