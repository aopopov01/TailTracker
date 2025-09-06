import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface PremiumStatus {
  isPremium: boolean;
  subscriptionType: 'free' | 'premium' | 'premium_plus';
  expiryDate: string | null;
  trialDaysRemaining: number | null;
}

export const usePremiumStatus = () => {
  const { user } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({
    isPremium: false,
    subscriptionType: 'free',
    expiryDate: null,
    trialDaysRemaining: null,
  });
  const [loading, setLoading] = useState(true);

  const checkPremiumStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // In a real implementation, this would check with Supabase or payment provider
      // For now, return default free status
      setPremiumStatus({
        isPremium: false,
        subscriptionType: 'free',
        expiryDate: null,
        trialDaysRemaining: null,
      });
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refetch = useCallback(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  return {
    ...premiumStatus,
    loading,
    refetch,
  };
};

// Export as default for compatibility
export default usePremiumStatus;