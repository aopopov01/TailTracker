import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import {
  SubscriptionTier,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from '../services/subscriptionService';
import { useSubscription } from '../contexts/SubscriptionContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
  lightGray: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

interface SubscriptionUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  currentTier?: SubscriptionTier;
  restrictedFeature?: string;
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  isPopular?: boolean;
  onSelect: (tier: SubscriptionTier) => void;
  isSelected: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan,
  isPopular,
  onSelect,
  isSelected,
}) => {
  const getFeatureIcon = (feature: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      maxPets: 'paw',
      maxFamilyMembers: 'people',
      photosPerPet: 'camera',
      lostPetReporting: 'alert-circle',
      healthRecordExport: 'document-text',
      enhancedFamilyCoordination: 'git-network',
      cloudBackup: 'cloud',
    };
    return iconMap[feature] || 'checkmark-circle';
  };

  const getFeatureLabel = (feature: string, value: any): string => {
    switch (feature) {
      case 'maxPets':
        return value === 999
          ? 'Unlimited pets'
          : `${value} pet profile${value > 1 ? 's' : ''}`;
      case 'maxFamilyMembers':
        return value === 999
          ? 'Unlimited family members'
          : `${value} family members total`;
      case 'photosPerPet':
        return `${value} photo${value > 1 ? 's' : ''} per pet`;
      case 'lostPetReporting':
        return 'Lost pet reporting & alerts';
      case 'healthRecordExport':
        return 'Health record PDF export';
      case 'enhancedFamilyCoordination':
        return 'Enhanced family coordination';
      case 'cloudBackup':
        return 'Cloud backup & sync';
      default:
        return feature
          .replace(/([A-Z])/g, ' $1')
          .toLowerCase()
          .replace(/^./, str => str.toUpperCase());
    }
  };

  const getCardColors = (): readonly [string, string, ...string[]] => {
    if (plan.id === 'premium') {
      return [COLORS.deepNavy, '#0F172A'] as const;
    } else if (plan.id === 'pro') {
      return [COLORS.lightCyan, COLORS.midCyan] as const;
    }
    return [COLORS.white, COLORS.softGray] as const;
  };

  const getTextColor = () => {
    return plan.id === 'free' ? COLORS.deepNavy : COLORS.white;
  };

  const borderColor = isSelected ? COLORS.success : 'transparent';
  const borderWidth = isSelected ? 2 : 0;

  return (
    <Animated.View
      entering={SlideInDown.delay(200).springify()}
      style={[styles.planCard, { borderColor, borderWidth }]}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}

      <LinearGradient
        colors={getCardColors()}
        style={styles.planCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planName, { color: getTextColor() }]}>
            {plan.name}
          </Text>
          <Text
            style={[
              styles.planDescription,
              { color: getTextColor(), opacity: 0.8 },
            ]}
          >
            {plan.description}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          {plan.price.monthly === 0 ? (
            <Text style={[styles.priceText, { color: getTextColor() }]}>
              Free Forever
            </Text>
          ) : (
            <>
              <Text style={[styles.priceText, { color: getTextColor() }]}>
                €{plan.price.monthly}
                <Text style={styles.pricePeriod}>/month</Text>
              </Text>
              <Text
                style={[
                  styles.yearlyPrice,
                  { color: getTextColor(), opacity: 0.7 },
                ]}
              >
                or €{plan.price.yearly}/year (save{' '}
                {Math.round(
                  ((plan.price.monthly * 12 - plan.price.yearly) /
                    (plan.price.monthly * 12)) *
                    100
                )}
                %)
              </Text>
            </>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {Object.entries(plan.features).map(([feature, value]) => {
            if (typeof value === 'boolean' && !value && plan.id !== 'free')
              return null;

            return (
              <View key={feature} style={styles.featureRow}>
                <Ionicons
                  name={value ? getFeatureIcon(feature) : 'close-circle'}
                  size={16}
                  color={value ? COLORS.success : COLORS.error}
                />
                <Text
                  style={[
                    styles.featureText,
                    {
                      color: getTextColor(),
                      opacity: value ? 1 : 0.5,
                      textDecorationLine: value ? 'none' : 'line-through',
                    },
                  ]}
                >
                  {getFeatureLabel(feature, value)}
                </Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.selectButton,
            isCurrentPlan && styles.currentPlanButton,
            isSelected && styles.selectedButton,
          ]}
          onPress={() => onSelect(plan.id)}
          disabled={isCurrentPlan}
        >
          <Text
            style={[
              styles.selectButtonText,
              isCurrentPlan && styles.currentPlanButtonText,
            ]}
          >
            {isCurrentPlan
              ? 'Current Plan'
              : isSelected
                ? 'Selected'
                : 'Select Plan'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

export const SubscriptionUpgradeModal: React.FC<
  SubscriptionUpgradeModalProps
> = ({ visible, onClose, currentTier = 'free', restrictedFeature }) => {
  const { upgrade } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
    null
  );
  const [isUpgrading, setIsUpgrading] = useState(false);

  const plans = Object.values(SUBSCRIPTION_PLANS);

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === currentTier) return;
    setSelectedTier(tier);
  };

  const handleUpgrade = async () => {
    if (!selectedTier || selectedTier === currentTier) return;

    try {
      setIsUpgrading(true);

      // In a real app, this would integrate with a payment processor
      // For now, we'll simulate the upgrade
      if (selectedTier !== 'free') {
        await upgrade(selectedTier);
      }
      const success = true;

      if (success) {
        Alert.alert(
          'Subscription Updated!',
          `You've successfully upgraded to ${SUBSCRIPTION_PLANS[selectedTier].name}. Enjoy your new features!`,
          [
            {
              text: 'Great!',
              onPress: onClose,
            },
          ]
        );
      } else {
        Alert.alert(
          'Upgrade Failed',
          'There was an issue upgrading your subscription. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name='close' size={24} color={COLORS.deepNavy} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Choose Your Plan</Text>
            {restrictedFeature && (
              <Text style={styles.headerSubtitle}>
                Upgrade to unlock {restrictedFeature}
              </Text>
            )}
          </View>
        </View>

        {/* Plans */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.delay(100)}>
            <Text style={styles.sectionTitle}>
              Unlock premium features for your pets
            </Text>
          </Animated.View>

          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={plan.id === currentTier}
              isPopular={plan.popular}
              onSelect={handleSelectPlan}
              isSelected={selectedTier === plan.id}
            />
          ))}
        </ScrollView>

        {/* Action Button */}
        {selectedTier && selectedTier !== currentTier && (
          <Animated.View
            entering={SlideInDown.springify()}
            style={styles.actionContainer}
          >
            <TouchableOpacity
              style={[
                styles.upgradeButton,
                isUpgrading && styles.upgradeButtonDisabled,
              ]}
              onPress={handleUpgrade}
              disabled={isUpgrading}
            >
              <LinearGradient
                colors={[COLORS.lightCyan, COLORS.midCyan]}
                style={styles.upgradeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.upgradeButtonText}>
                  {isUpgrading
                    ? 'Processing...'
                    : `Upgrade to ${SUBSCRIPTION_PLANS[selectedTier].name}`}
                </Text>
                {!isUpgrading && (
                  <Ionicons
                    name='arrow-forward'
                    size={20}
                    color={COLORS.white}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.softGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.deepNavy,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  planCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: COLORS.warning,
    paddingVertical: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  planCardGradient: {
    padding: 24,
    paddingTop: 30,
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
  },
  priceContainer: {
    marginBottom: 24,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pricePeriod: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  yearlyPrice: {
    fontSize: 12,
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  currentPlanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedButton: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  currentPlanButtonText: {
    opacity: 0.7,
  },
  actionContainer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonDisabled: {
    opacity: 0.7,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default SubscriptionUpgradeModal;
