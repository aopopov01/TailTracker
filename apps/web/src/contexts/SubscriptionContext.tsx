/**
 * Subscription Context
 * Global subscription tier management with Supabase Realtime sync
 * Automatically updates when subscription changes from any source (Admin, Settings, etc.)
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
import type { SubscriptionTier } from '@tailtracker/shared-types';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  // Fetch subscription from users table (users.auth_user_id = auth user UUID)
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
        setLoading(false);
        return;
      }

      // Fetch from users table - users.auth_user_id links to auth.users.id
      const { data, error } = await client
        .from('users')
        .select('id, subscription_tier')
        .eq('auth_user_id', uid)
        .single();

      console.log('SubscriptionContext: Fetched tier:', data?.subscription_tier, 'for auth_user_id:', uid);

      if (error) {
        console.warn('SubscriptionContext: Failed to fetch subscription:', error.message);
        setTier('free');
      } else if (data) {
        setTier((data.subscription_tier as SubscriptionTier) || 'free');
      }
    } catch (err) {
      console.error('SubscriptionContext: Unexpected error:', err);
      setTier('free');
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
            console.log('SubscriptionContext: Realtime update received:', newTier);
            setTier(newTier || 'free');
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

  return (
    <SubscriptionContext.Provider value={{ tier, loading, refresh }}>
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
