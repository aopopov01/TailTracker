import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StripePaymentService, 
  SubscriptionStatus 
} from '../services/StripePaymentService';
import { PaymentErrorUtils } from '../utils/paymentErrorUtils';

interface PremiumAccessHook {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  hasPremiumAccess: boolean;
  canAccessFeature: (feature: string) => boolean;
  checkResourceAccess: (resource: string, currentCount?: number) => Promise<{
    allowed: boolean;
    limit?: number;
    message: string;
    requiresPremium: boolean;
  }>;
  refreshStatus: () => Promise<void>;
  isInitialized: boolean;
  retryCount: number;
  lastRefreshTime: Date | null;
}

export const usePremiumAccess = (): PremiumAccessHook => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const paymentService = StripePaymentService.getInstance();
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadSubscriptionStatus = useCallback(async (isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);
      
      const status = await paymentService.getSubscriptionStatus();
      
      if (isMountedRef.current) {
        setSubscriptionStatus(status);
        setIsInitialized(true);
        setLastRefreshTime(new Date());
        setRetryCount(0);
        PaymentErrorUtils.logError({ message: 'Subscription status loaded successfully' }, 'usePremiumAccess');
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription status';
        setError(errorMessage);
        setRetryCount(prev => prev + 1);
        PaymentErrorUtils.logError(err, 'usePremiumAccess - loadSubscriptionStatus');
        
        // Auto-retry with exponential backoff for network errors
        if (retryCount < 3 && isRetryableError(err)) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            if (isMountedRef.current) {
              loadSubscriptionStatus(true);
            }
          }, delay);
        }
      }
    } finally {
      if (isMountedRef.current && !isRetry) {
        setLoading(false);
      }
    }
  }, [retryCount, paymentService]);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  const refreshStatus = useCallback(async () => {
    setRetryCount(0); // Reset retry count on manual refresh
    await loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  // Helper function to check if error is retryable
  const isRetryableError = (error: any): boolean => {
    const retryableMessages = [
      'network error',
      'timeout',
      'connection',
      'failed to fetch',
      'ECONNRESET',
      'ETIMEDOUT'
    ];
    
    const errorMessage = error?.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  };

  const hasPremiumAccess = subscriptionStatus?.isPremium || false;

  const canAccessFeature = useCallback((feature: string): boolean => {
    if (!subscriptionStatus) return false;
    return subscriptionStatus.features.includes(feature);
  }, [subscriptionStatus]);

  const checkResourceAccess = useCallback(async (resource: string, currentCount: number = 0) => {
    return await paymentService.validateResourceAccess(resource, currentCount);
  }, [paymentService]);

  return {
    subscriptionStatus,
    loading,
    error,
    hasPremiumAccess,
    canAccessFeature,
    checkResourceAccess,
    refreshStatus,
    isInitialized,
    retryCount,
    lastRefreshTime,
  };
};

export default usePremiumAccess;