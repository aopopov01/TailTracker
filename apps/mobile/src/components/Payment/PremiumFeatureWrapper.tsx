import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import usePremiumAccess from '../../hooks/usePremiumAccess';
import PremiumGate from './PremiumGate';

interface PremiumFeatureWrapperProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showGate?: boolean;
  gateProps?: {
    title?: string;
    description?: string;
    benefits?: string[];
    onUpgrade?: () => void;
  };
}

export const PremiumFeatureWrapper: React.FC<PremiumFeatureWrapperProps> = ({
  feature,
  children,
  fallback,
  showGate = true,
  gateProps,
}) => {
  const { canAccessFeature, loading, error } = usePremiumAccess();

  // Show loading state
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <ActivityIndicator size='large' />
        <Text style={{ marginTop: 16 }}>Checking subscription status...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Text>Unable to verify subscription status.</Text>
        <Text style={{ color: '#666', marginTop: 8 }}>{error}</Text>
      </View>
    );
  }

  // Check if user has access to the feature
  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show premium gate if showGate is true
  if (showGate) {
    return <PremiumGate feature={feature} {...gateProps} />;
  }

  // Return null if no fallback and no gate
  return null;
};

export default PremiumFeatureWrapper;
