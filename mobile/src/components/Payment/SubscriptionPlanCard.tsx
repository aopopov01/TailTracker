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
import { colors } from '../../design-system/core/colors';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
}

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
          {plan.features.map((feature: string, index: number) => (
            <List.Item
              key={index}
              title={formatFeature(feature)}
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon="check" 
                  color={isPopular ? colors.primary : colors.success} 
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
    borderColor: colors.primary, // WCAG AA compliant
    borderWidth: 2,
    elevation: 8,
  },
  currentPlan: {
    borderColor: colors.success, // WCAG AA compliant
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    zIndex: 1,
  },
  popularChip: {
    backgroundColor: colors.primary, // WCAG AA compliant
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
    color: colors.primary, // WCAG AA: 7.63:1
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary, // WCAG AA: 16.05:1
  },
  popularPrice: {
    color: colors.primary, // WCAG AA: 7.63:1
  },
  interval: {
    fontSize: 16,
    color: colors.text.secondary, // WCAG AA: 7.24:1
    marginLeft: 4,
  },
  description: {
    textAlign: 'center',
    color: colors.text.secondary, // WCAG AA: 7.24:1
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
    color: colors.text.primary, // WCAG AA: 16.05:1
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
    backgroundColor: colors.primary, // WCAG AA compliant
  },
  currentPlanButton: {
    borderColor: colors.success, // WCAG AA compliant
  },
  selectButtonContent: {
    height: 48,
  },
  selectButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentPlanButtonLabel: {
    color: colors.success, // WCAG AA: 4.8:1
  },
  trialNote: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text.secondary, // WCAG AA: 7.24:1
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default SubscriptionPlanCard;