/**
 * Subscription Context
 * Global subscription tier management with Supabase Realtime sync
 * Automatically updates when subscription changes from any source (Admin, Settings, etc.)
 *
 * Provides:
 * - Current subscription tier
 * - Full subscription details (billing cycle, period dates, pending changes)
 * - Realtime sync for instant updates
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { SubscriptionTier, BillingCycle, SubscriptionState } from '@tailtracker/shared-types';

interface SubscriptionDetails {
  id: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle | null;
  status: SubscriptionState;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  downgradeToTier: SubscriptionTier | null;
}

interface SubscriptionContextType {
  // Basic tier (for feature gating)
  tier: SubscriptionTier;

  // Full subscription details
  subscription: SubscriptionDetails | null;

  // State
  loading: boolean;

  // Helpers
  hasPendingChange: boolean;
  isActive: boolean;

  // Actions
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch subscription from users table and subscriptions table
  const fetchSubscription = useCallback(async (authUserId?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const client = supabase; // TypeScript narrowing helper

    try {
      // Get auth user if not provided
      let uid = authUserId;
      if (!uid) {
        const { data: { user } } = await client.auth.getUser();
        uid = user?.id;
      }

      if (!uid) {
        setTier('free');
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Fetch from users table - users.auth_user_id links to auth.users.id
      const { data: userData, error: userError } = await client
        .from('users')
        .select('id, subscription_tier')
        .eq('auth_user_id', uid)
        .single();

      if (userError) {
        console.warn('SubscriptionContext: Failed to fetch user:', userError.message);
        setTier('free');
        setSubscription(null);
        setLoading(false);
        return;
      }

      const userTier = (userData?.subscription_tier as SubscriptionTier) || 'free';
      setTier(userTier);
      console.log('SubscriptionContext: Fetched tier:', userTier, 'for auth_user_id:', uid);

      // Also fetch full subscription details from subscriptions table
      // Note: subscriptions.user_id references users.id (not auth.users.id)
      const { data: subData, error: subError } = await client
        .from('subscriptions')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is OK for free tier
        console.warn('SubscriptionContext: Failed to fetch subscription details:', subError.message);
      }

      if (subData) {
        setSubscription({
          id: subData.id,
          tier: subData.tier || userTier,
          billingCycle: subData.billing_cycle,
          status: subData.status || 'active',
          currentPeriodStart: subData.current_period_start,
          currentPeriodEnd: subData.current_period_end,
          cancelAtPeriodEnd: subData.cancel_at_period_end || false,
          downgradeToTier: subData.downgrade_to_tier,
        });
      } else {
        // Free tier or no subscription record
        setSubscription(null);
      }
    } catch (err) {
      console.error('SubscriptionContext: Unexpected error:', err);
      setTier('free');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const client = supabase; // TypeScript narrowing helper
    let channel: ReturnType<typeof client.channel> | null = null;

    const init = async () => {
      // Get current user
      const { data: { user } } = await client.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch initial subscription
      await fetchSubscription(user.id);

      // Get the users table ID for the realtime filter
      const { data: userData } = await client
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData?.id) {
        console.warn('SubscriptionContext: No users table record found');
        return;
      }

      // Subscribe to realtime changes on THIS user's record in users table
      channel = client
        .channel('subscription-sync')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userData.id}`,
          },
          (payload) => {
            // Automatically update when subscription changes
            const newTier = payload.new.subscription_tier as SubscriptionTier;
            console.log('SubscriptionContext: Realtime update received (users):', newTier);
            setTier(newTier || 'free');
            // Refetch full subscription details on tier change
            fetchSubscription(user.id);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Automatically update when subscription details change
            console.log('SubscriptionContext: Realtime update received (subscriptions)');
            if (payload.new) {
              setSubscription({
                id: payload.new.id,
                tier: payload.new.tier || tier,
                billingCycle: payload.new.billing_cycle,
                status: payload.new.status || 'active',
                currentPeriodStart: payload.new.current_period_start,
                currentPeriodEnd: payload.new.current_period_end,
                cancelAtPeriodEnd: payload.new.cancel_at_period_end || false,
                downgradeToTier: payload.new.downgrade_to_tier,
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('SubscriptionContext: Realtime subscription active');
          }
        });
    };

    init();

    // Cleanup function
    return () => {
      if (channel) {
        client.removeChannel(channel);
      }
    };
  }, [fetchSubscription]);

  // Also listen for auth state changes (login/logout)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const client = supabase; // TypeScript narrowing helper

    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true);
          await fetchSubscription(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setTier('free');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSubscription]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchSubscription();
  }, [fetchSubscription]);

  // Computed helpers
  const hasPendingChange = Boolean(subscription?.cancelAtPeriodEnd && subscription?.downgradeToTier);
  const isActive = subscription?.status === 'active' || tier === 'free';

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        subscription,
        loading,
        hasPendingChange,
        isActive,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
