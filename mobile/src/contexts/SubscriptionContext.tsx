import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { subscriptionService, SubscriptionTier, SubscriptionFeatures, UserSubscription } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  features: SubscriptionFeatures | null;
  isLoading: boolean;
  tier: SubscriptionTier;
  isProUser: boolean;
  isPremiumUser: boolean;
  canAddPet: (currentCount: number) => Promise<boolean>;
  canPerformAction: (action: keyof SubscriptionFeatures) => boolean;
  getMaxPetsAllowed: () => number;
  isOnTrial: boolean;
  trialDaysRemaining: number;
  refreshSubscription: () => Promise<void>;
  upgradeSubscription: (newTier: SubscriptionTier) => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [features, setFeatures] = useState<SubscriptionFeatures | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setFeatures(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch subscription and features
      const [userSubscription, subscriptionFeatures, onTrial, daysRemaining] = await Promise.all([
        subscriptionService.getUserSubscription(user.id),
        subscriptionService.getSubscriptionFeatures(user.id),
        subscriptionService.isOnTrial(user.id),
        subscriptionService.getTrialDaysRemaining(user.id),
      ]);

      setSubscription(userSubscription);
      setFeatures(subscriptionFeatures);
      setIsOnTrial(onTrial);
      setTrialDaysRemaining(daysRemaining);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      // Set defaults in case of error
      setSubscription(null);
      setFeatures(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const canAddPet = async (currentCount: number): Promise<boolean> => {
    if (!user) return false;
    return await subscriptionService.canAddPet(user.id, currentCount);
  };

  const canPerformAction = (action: keyof SubscriptionFeatures): boolean => {
    if (!features) return false;
    return features[action] as boolean;
  };

  const getMaxPetsAllowed = (): number => {
    return features?.maxPets || 1;
  };

  const upgradeSubscription = async (newTier: SubscriptionTier): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await subscriptionService.upgradeSubscription(user.id, newTier);
      if (success) {
        await refreshSubscription();
      }
      return success;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return false;
    }
  };

  // Load subscription when user changes
  useEffect(() => {
    refreshSubscription();
  }, [user, refreshSubscription]);

  // Computed values
  const tier: SubscriptionTier = subscription?.tier || 'free';
  const isProUser = tier === 'pro';
  const isPremiumUser = tier === 'premium' || tier === 'pro'; // Both premium and pro are premium users

  const contextValue: SubscriptionContextType = {
    subscription,
    features,
    isLoading,
    tier,
    isProUser,
    isPremiumUser,
    canAddPet,
    canPerformAction,
    getMaxPetsAllowed,
    isOnTrial,
    trialDaysRemaining,
    refreshSubscription,
    upgradeSubscription,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};