/**
 * useSubscriptionGate Hook
 */

import { useState } from 'react';

export const useSubscriptionGate = (feature?: string, description?: string) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
  const [restrictedFeatureName, setRestrictedFeatureName] = useState<string>(
    feature || ''
  );

  const checkAccess = (featureParam?: string) => {
    const targetFeature = featureParam || feature;
    if (targetFeature) setRestrictedFeatureName(targetFeature);
    return true;
  };
  const requestUpgrade = () => setShowUpgrade(true);
  const showUpgradeModal = (featureName?: string) => {
    setRestrictedFeatureName(featureName || feature || '');
    setIsUpgradeModalVisible(true);
  };
  const hideUpgradeModal = () => setIsUpgradeModalVisible(false);

  return {
    hasAccess,
    showUpgrade,
    checkAccess,
    requestUpgrade,
    showUpgradeModal,
    isUpgradeModalVisible,
    hideUpgradeModal,
    restrictedFeatureName,
  };
};

export const usePetCreationGate = () => {
  const [hasAccess, setHasAccess] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
  const [restrictedFeatureName, setRestrictedFeatureName] = useState<
    string | null
  >(null);

  const checkAccess = (feature?: string) => {
    if (feature) setRestrictedFeatureName(feature);
    return true;
  };

  const requestUpgrade = (feature?: string) => {
    if (feature) setRestrictedFeatureName(feature);
    setShowUpgrade(true);
  };

  const canAddPet = () => true;

  const getUpgradeMessage = (feature?: string) =>
    `Upgrade to premium to access ${feature || 'this feature'}`;

  const showUpgradeModal = () => setIsUpgradeModalVisible(true);
  const hideUpgradeModal = () => setIsUpgradeModalVisible(false);

  return {
    hasAccess,
    showUpgrade,
    checkAccess,
    requestUpgrade,
    canAddPet,
    getUpgradeMessage,
    showUpgradeModal,
    isUpgradeModalVisible,
    hideUpgradeModal,
    restrictedFeatureName,
  };
};
