import { useState, useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionFeatures } from '../services/subscriptionService';

interface SubscriptionGateResult {
  hasAccess: boolean;
  showUpgradeModal: () => void;
  hideUpgradeModal: () => void;
  isUpgradeModalVisible: boolean;
  restrictedFeatureName: string;
}

/**
 * Hook to handle subscription-based feature gating
 * @param feature - The feature key to check access for
 * @param featureName - Human-readable name of the feature for the upgrade modal
 * @returns Object with access status and modal controls
 */
export const useSubscriptionGate = (
  feature: keyof SubscriptionFeatures,
  featureName: string
): SubscriptionGateResult => {
  const { canPerformAction, tier, isLoading } = useSubscription();
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);

  // Check if user has access to the feature
  const hasAccess = !isLoading && canPerformAction(feature);

  const showUpgradeModal = useCallback(() => {
    if (!hasAccess) {
      setIsUpgradeModalVisible(true);
    }
  }, [hasAccess]);

  const hideUpgradeModal = useCallback(() => {
    setIsUpgradeModalVisible(false);
  }, []);

  return {
    hasAccess,
    showUpgradeModal,
    hideUpgradeModal,
    isUpgradeModalVisible,
    restrictedFeatureName: featureName,
  };
};

/**
 * Hook specifically for pet creation limits
 */
export const usePetCreationGate = (): {
  canAddPet: (currentCount: number) => Promise<boolean>;
  maxPetsAllowed: number;
  showUpgradeModal: () => void;
  hideUpgradeModal: () => void;
  isUpgradeModalVisible: boolean;
  restrictedFeatureName: string;
  getUpgradeMessage: (currentCount: number) => string;
} => {
  const { canAddPet, getMaxPetsAllowed, tier } = useSubscription();
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);

  const showUpgradeModal = useCallback(() => {
    setIsUpgradeModalVisible(true);
  }, []);

  const hideUpgradeModal = useCallback(() => {
    setIsUpgradeModalVisible(false);
  }, []);

  const getUpgradeMessage = useCallback((currentCount: number): string => {
    const maxAllowed = getMaxPetsAllowed();
    
    switch (tier) {
      case 'free':
        return `You've reached the limit of ${maxAllowed} pet on the Free plan. Upgrade to Pro to add up to 5 pets!`;
      case 'pro':
        return `You've reached the limit of ${maxAllowed} pets on the Pro plan. Upgrade to Premium for unlimited pets!`;
      case 'premium':
        return `You can add unlimited pets with your Premium plan!`;
      default:
        return `Upgrade your plan to add more pets.`;
    }
  }, [tier, getMaxPetsAllowed]);

  const getRestrictedFeatureName = useCallback(() => {
    switch (tier) {
      case 'free':
        return 'additional pets (Pro plan needed)';
      case 'pro':
        return 'unlimited pets (Premium plan needed)';
      default:
        return 'multiple pets';
    }
  }, [tier]);

  return {
    canAddPet,
    maxPetsAllowed: getMaxPetsAllowed(),
    showUpgradeModal,
    hideUpgradeModal,
    isUpgradeModalVisible,
    restrictedFeatureName: getRestrictedFeatureName(),
    getUpgradeMessage,
  };
};

/**
 * Utility function to get feature descriptions for upgrade prompts
 */
export const getFeatureDescription = (feature: keyof SubscriptionFeatures): string => {
  const descriptions: Record<keyof SubscriptionFeatures, string> = {
    maxPets: 'multiple pets',
    maxFamilyMembers: 'family member access',
    photosPerPet: 'photo storage per pet',
    lostPetReporting: 'lost pet community alerts',
    healthRecordExport: 'health record export',
    enhancedFamilyCoordination: 'family coordination features',
    cloudBackup: 'cloud backup and sync',
  };

  return descriptions[feature] || 'this premium feature';
};