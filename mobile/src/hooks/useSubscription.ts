import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export interface Subscription {
  id: string | null;
  planId: string | null;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'none';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({
    id: null,
    planId: null,
    status: 'none',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialEnd: null,
  });
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // In a real implementation, this would fetch from Supabase or payment provider
      // For now, return default no subscription
      setSubscription({
        id: null,
        planId: null,
        status: 'none',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      });

      // Mock available plans
      setAvailablePlans([
        {
          id: 'premium_monthly',
          name: 'Premium Monthly',
          price: 7.99,
          currency: 'EUR',
          interval: 'monthly',
          features: [
            'Real-time GPS tracking',
            'Health monitoring',
            'Multiple pets',
            'Emergency alerts'
          ],
        },
        {
          id: 'premium_yearly',
          name: 'Premium Yearly',
          price: 79.99,
          currency: 'EUR',
          interval: 'yearly',
          features: [
            'Real-time GPS tracking',
            'Health monitoring',
            'Multiple pets',
            'Emergency alerts',
            '2 months free'
          ],
        },
      ]);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refetch = useCallback(() => {
    loadSubscription();
  }, [loadSubscription]);

  const cancelSubscription = useCallback(async () => {
    // In a real implementation, this would handle subscription cancellation
    console.log('Cancel subscription requested');
  }, []);

  const upgradeSubscription = useCallback(async (planId: string) => {
    // In a real implementation, this would handle subscription upgrade
    console.log('Upgrade subscription requested for plan:', planId);
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  return {
    subscription,
    availablePlans,
    loading,
    refetch,
    cancelSubscription,
    upgradeSubscription,
  };
};