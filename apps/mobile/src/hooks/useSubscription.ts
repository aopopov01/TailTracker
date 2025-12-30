/**
 * useSubscription Hook
 */

import { useState } from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'premium' | 'pro';
  price: number;
  features: string[];
}

interface Subscription {
  tier: string;
  active: boolean;
  planId?: string;
  currentPeriodEnd?: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription>({
    tier: 'free',
    active: false,
    planId: undefined,
    currentPeriodEnd: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  const availablePlans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      tier: 'free',
      price: 0,
      features: ['1 pet', '2 family members'],
    },
    {
      id: 'premium',
      name: 'Premium',
      tier: 'premium',
      price: 4.99,
      features: ['2 pets', '3 family members'],
    },
    {
      id: 'pro',
      name: 'Pro',
      tier: 'pro',
      price: 9.99,
      features: ['Unlimited pets', 'Lost pet alerts'],
    },
  ];

  const upgrade = async (tier: string) => ({ success: true });
  const cancel = async () => ({ success: true });
  const restore = async () => ({ success: true });
  const refetch = async () => {};

  return {
    subscription,
    isLoading,
    loading: isLoading, // Alias for compatibility
    availablePlans,
    upgrade,
    upgradeSubscription: upgrade, // Alias
    cancel,
    cancelSubscription: cancel, // Alias
    restore,
    refetch,
  };
};
