/**
 * SubscriptionContext - Subscription state management
 */

import React, { createContext, useContext, ReactNode } from 'react';

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  subscriptionTier: 'free' | 'premium' | 'pro';
  tier: 'free' | 'premium' | 'pro';
  checkSubscription: () => Promise<void>;
  upgrade: (tier: 'premium' | 'pro') => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const value: SubscriptionContextType = {
    isPremium: false,
    isLoading: false,
    error: null,
    subscriptionTier: 'free',
    tier: 'free',
    checkSubscription: async () => {},
    upgrade: async () => {},
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }
  return context;
};

export { SubscriptionContext };
