/**
 * Subscription Management Service
 * Handles subscription upgrades, downgrades, cancellations, and billing cycles
 *
 * Pricing (EUR):
 *   Free: €0/month
 *   Premium: €5.99/month or €60/year
 *   Pro: €8.99/month or €90/year
 */

import { getSupabaseClient } from './supabase/client';
import type {
  SubscriptionTier,
  BillingCycle,
  Subscription,
  SubscriptionHistoryEntry,
  ProrationPreview,
  SubscriptionUpgradeRequest,
  SubscriptionDowngradeRequest,
  BillingCycleChangeRequest,
  SubscriptionOperationResult,
} from '@tailtracker/shared-types';

// Pricing constants in EUR
const PRICING = {
  free: { monthly: 0, annual: 0 },
  premium: { monthly: 5.99, annual: 60 },
  pro: { monthly: 8.99, annual: 90 },
} as const;

/**
 * Get the full subscription record for the current user
 */
export const getFullSubscription = async (
  userId: string
): Promise<Subscription | null> => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // No subscription found - user might be on implicit free tier
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching subscription:', error);
      throw new Error('Failed to fetch subscription');
    }

    return transformSubscription(data);
  } catch (error) {
    console.error('Error in getFullSubscription:', error);
    throw error;
  }
};

/**
 * Get subscription history for the current user
 */
export const getSubscriptionHistory = async (
  userId: string,
  limit = 50
): Promise<SubscriptionHistoryEntry[]> => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching subscription history:', error);
      throw new Error('Failed to fetch subscription history');
    }

    return (data || []).map(transformHistoryEntry);
  } catch (error) {
    console.error('Error in getSubscriptionHistory:', error);
    throw error;
  }
};

/**
 * Calculate proration preview for an upgrade
 * Used to show users what they'll pay before confirming
 */
export const calculateProrationPreview = async (
  userId: string,
  targetTier: SubscriptionTier,
  targetBillingCycle: BillingCycle
): Promise<ProrationPreview | null> => {
  try {
    const subscription = await getFullSubscription(userId);

    // If no subscription or free tier, no proration needed
    if (!subscription || subscription.tier === 'free') {
      return {
        currentTier: subscription?.tier || 'free',
        targetTier,
        billingCycle: targetBillingCycle,
        daysRemaining: 0,
        currentDailyRate: 0,
        targetDailyRate: calculateDailyRate(targetTier, targetBillingCycle),
        prorationAmount: 0,
        effectiveDate: new Date().toISOString(),
      };
    }

    // Calculate days remaining in current period
    const daysRemaining = calculateDaysRemaining(subscription.currentPeriodEnd);

    if (daysRemaining <= 0) {
      return {
        currentTier: subscription.tier,
        targetTier,
        billingCycle: targetBillingCycle,
        daysRemaining: 0,
        currentDailyRate: calculateDailyRate(
          subscription.tier,
          subscription.billingCycle || 'monthly'
        ),
        targetDailyRate: calculateDailyRate(targetTier, targetBillingCycle),
        prorationAmount: 0,
        effectiveDate: new Date().toISOString(),
      };
    }

    const currentDailyRate = calculateDailyRate(
      subscription.tier,
      subscription.billingCycle || 'monthly'
    );
    const targetDailyRate = calculateDailyRate(targetTier, targetBillingCycle);

    // Proration: days remaining × (new rate - old rate)
    const prorationAmount = Math.max(
      0,
      Number((daysRemaining * (targetDailyRate - currentDailyRate)).toFixed(2))
    );

    return {
      currentTier: subscription.tier,
      targetTier,
      billingCycle: targetBillingCycle,
      daysRemaining,
      currentDailyRate,
      targetDailyRate,
      prorationAmount,
      effectiveDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating proration preview:', error);
    return null;
  }
};

/**
 * Upgrade subscription to a higher tier
 * Immediate effect with proration
 *
 * NOTE: This is a TEST version that directly updates the database.
 * For production, this should call a Stripe Edge Function.
 */
export const upgradeSubscription = async (
  request: SubscriptionUpgradeRequest
): Promise<SubscriptionOperationResult> => {
  try {
    const supabase = getSupabaseClient();

    // Get current auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get the public.users.id for this auth user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user profile:', userError);
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    const userId = userData.id;
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (request.billingCycle === 'annual' ? 12 : 1));

    // Try to update existing subscription
    const { data: existingSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', fetchError);
    }

    let subscriptionData;
    if (existingSub) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          tier: request.targetTier,
          plan_name: request.targetTier, // Required field
          billing_cycle: request.billingCycle,
          status: request.targetTier, // status column uses subscription_tier enum
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          downgrade_to_tier: null,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        return {
          success: false,
          error: error.message || 'Failed to update subscription',
        };
      }
      subscriptionData = data;
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          tier: request.targetTier,
          plan_name: request.targetTier, // Required field
          billing_cycle: request.billingCycle,
          status: request.targetTier, // status column uses subscription_tier enum
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return {
          success: false,
          error: error.message || 'Failed to create subscription',
        };
      }
      subscriptionData = data;
    }

    // Also update the users table subscription_status and subscription_tier
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        subscription_status: request.targetTier,
        subscription_tier: request.targetTier,
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (updateUserError) {
      console.error('Error updating user subscription status:', updateUserError);
    }

    return {
      success: true,
      subscription: subscriptionData ? transformSubscription(subscriptionData) : undefined,
      prorationAmount: 0,
      effectiveDate: now.toISOString(),
      message: `Successfully upgraded to ${request.targetTier}! (Test mode - no payment processed)`,
    };
  } catch (error) {
    console.error('Error in upgradeSubscription:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to upgrade subscription',
    };
  }
};

/**
 * Downgrade subscription to a lower tier
 * Takes effect at end of current billing period
 *
 * NOTE: This is a TEST version that directly updates the database.
 * For production, this should call a Stripe Edge Function.
 */
export const downgradeSubscription = async (
  request: SubscriptionDowngradeRequest
): Promise<SubscriptionOperationResult> => {
  try {
    const supabase = getSupabaseClient();

    // Get current auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get the public.users.id for this auth user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    const userId = userData.id;

    // Get existing subscription
    const { data: existingSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingSub) {
      return {
        success: false,
        error: 'No active subscription found',
      };
    }

    const now = new Date();

    // For downgrades, we schedule the change for end of billing period
    // Set cancel_at_period_end = true and downgrade_to_tier = target tier
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        downgrade_to_tier: request.targetTier,
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error scheduling downgrade:', error);
      return {
        success: false,
        error: error.message || 'Failed to schedule downgrade',
      };
    }

    return {
      success: true,
      subscription: data ? transformSubscription(data) : undefined,
      effectiveDate: existingSub.current_period_end,
      message: `Downgrade to ${request.targetTier} scheduled for end of billing period. (Test mode)`,
    };
  } catch (error) {
    console.error('Error in downgradeSubscription:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to downgrade subscription',
    };
  }
};

/**
 * Cancel subscription
 * Takes effect at end of current billing period (downgrades to free)
 *
 * NOTE: This is a TEST version that directly updates the database.
 * For production, this should call a Stripe Edge Function.
 */
export const cancelSubscription = async (): Promise<SubscriptionOperationResult> => {
  try {
    const supabase = getSupabaseClient();

    // Get current auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get the public.users.id for this auth user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    const userId = userData.id;

    // Get existing subscription
    const { data: existingSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingSub) {
      return {
        success: false,
        error: 'No active subscription found',
      };
    }

    const now = new Date();

    // Schedule cancellation for end of billing period
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        downgrade_to_tier: 'free',
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error scheduling cancellation:', error);
      return {
        success: false,
        error: error.message || 'Failed to schedule cancellation',
      };
    }

    return {
      success: true,
      subscription: data ? transformSubscription(data) : undefined,
      effectiveDate: existingSub.current_period_end,
      message: `Subscription will be cancelled at end of billing period. (Test mode)`,
    };
  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
};

/**
 * Reactivate subscription (undo pending cancellation/downgrade)
 *
 * NOTE: This is a TEST version that directly updates the database.
 * For production, this should call a Stripe Edge Function.
 */
export const reactivateSubscription =
  async (): Promise<SubscriptionOperationResult> => {
    try {
      const supabase = getSupabaseClient();

      // Get current auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // Get the public.users.id for this auth user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          error: 'User profile not found',
        };
      }

      const userId = userData.id;
      const now = new Date();

      // Clear cancellation/downgrade flags
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          downgrade_to_tier: null,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error reactivating subscription:', error);
        return {
          success: false,
          error: error.message || 'Failed to reactivate subscription',
        };
      }

      return {
        success: true,
        subscription: data ? transformSubscription(data) : undefined,
        message: 'Subscription reactivated successfully! (Test mode)',
      };
    } catch (error) {
      console.error('Error in reactivateSubscription:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reactivate subscription',
      };
    }
  };

/**
 * Change billing cycle (monthly <-> annual)
 *
 * NOTE: This is a TEST version that directly updates the database.
 * For production, this should call a Stripe Edge Function.
 */
export const changeBillingCycle = async (
  request: BillingCycleChangeRequest
): Promise<SubscriptionOperationResult> => {
  try {
    const supabase = getSupabaseClient();

    // Get current auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get the public.users.id for this auth user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    const userId = userData.id;

    // Get existing subscription
    const { data: existingSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingSub) {
      return {
        success: false,
        error: 'No active subscription found',
      };
    }

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (request.newBillingCycle === 'annual' ? 12 : 1));

    // Update billing cycle immediately
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        billing_cycle: request.newBillingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error changing billing cycle:', error);
      return {
        success: false,
        error: error.message || 'Failed to change billing cycle',
      };
    }

    return {
      success: true,
      subscription: data ? transformSubscription(data) : undefined,
      prorationAmount: 0,
      effectiveDate: now.toISOString(),
      message: `Billing cycle changed to ${request.newBillingCycle}! (Test mode - no payment processed)`,
    };
  } catch (error) {
    console.error('Error in changeBillingCycle:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to change billing cycle',
    };
  }
};

/**
 * Check if user has a pending change (downgrade or cancellation)
 */
export const hasPendingChange = async (
  userId: string
): Promise<{
  hasPending: boolean;
  type: 'downgrade' | 'cancel' | null;
  targetTier: SubscriptionTier | null;
  effectiveDate: string | null;
}> => {
  try {
    const subscription = await getFullSubscription(userId);

    if (!subscription) {
      return { hasPending: false, type: null, targetTier: null, effectiveDate: null };
    }

    if (subscription.cancelAtPeriodEnd) {
      return {
        hasPending: true,
        type: subscription.downgradeToTier ? 'downgrade' : 'cancel',
        targetTier: subscription.downgradeToTier || 'free',
        effectiveDate: subscription.currentPeriodEnd,
      };
    }

    return { hasPending: false, type: null, targetTier: null, effectiveDate: null };
  } catch (error) {
    console.error('Error checking pending change:', error);
    return { hasPending: false, type: null, targetTier: null, effectiveDate: null };
  }
};

/**
 * Get pricing for a specific tier and billing cycle
 */
export const getTierPricing = (
  tier: SubscriptionTier,
  billingCycle: BillingCycle
): number => {
  return PRICING[tier][billingCycle];
};

/**
 * Get all pricing information
 */
export const getAllPricing = () => PRICING;

// ===================================
// Helper Functions
// ===================================

/**
 * Calculate daily rate for a tier and billing cycle
 */
const calculateDailyRate = (
  tier: SubscriptionTier,
  billingCycle: BillingCycle
): number => {
  const price = PRICING[tier][billingCycle];
  const days = billingCycle === 'monthly' ? 30 : 365;
  return Number((price / days).toFixed(4));
};

/**
 * Calculate days remaining until a given date
 */
const calculateDaysRemaining = (endDate: string | null): number => {
  if (!endDate) return 0;

  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Transform database subscription row to Subscription type
 */
const transformSubscription = (row: Record<string, unknown>): Subscription => {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    tier: (row.tier as SubscriptionTier) || 'free',
    billingCycle: (row.billing_cycle as BillingCycle) || null,
    status: (row.status as Subscription['status']) || 'active',
    currentPeriodStart: (row.current_period_start as string) || null,
    currentPeriodEnd: (row.current_period_end as string) || null,
    cancelAtPeriodEnd: (row.cancel_at_period_end as boolean) || false,
    downgradeToTier: (row.downgrade_to_tier as SubscriptionTier) || null,
    stripeSubscriptionId: (row.stripe_subscription_id as string) || null,
    stripeCustomerId: (row.stripe_customer_id as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
};

/**
 * Transform database history row to SubscriptionHistoryEntry type
 */
const transformHistoryEntry = (
  row: Record<string, unknown>
): SubscriptionHistoryEntry => {
  return {
    id: row.id as string,
    subscriptionId: row.subscription_id as string,
    userId: row.user_id as string,
    action: row.action as SubscriptionHistoryEntry['action'],
    fromTier: (row.from_tier as SubscriptionTier) || null,
    toTier: (row.to_tier as SubscriptionTier) || null,
    fromBillingCycle: (row.from_billing_cycle as BillingCycle) || null,
    toBillingCycle: (row.to_billing_cycle as BillingCycle) || null,
    prorationAmount: (row.proration_amount as number) || null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
    updatedAt: row.created_at as string, // History entries don't have updated_at
  };
};

// ===================================
// Stripe Integration Functions
// ===================================

export interface StripeCheckoutRequest {
  tier: 'premium' | 'pro';
  billingCycle: BillingCycle;
  successUrl?: string;
  cancelUrl?: string;
}

export interface StripeCheckoutResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface StripePortalResult {
  success: boolean;
  url?: string;
  error?: string;
  code?: string;
}

/**
 * Create a Stripe checkout session for subscription purchase
 * Redirects user to Stripe's hosted checkout page
 */
export const createStripeCheckoutSession = async (
  request: StripeCheckoutRequest
): Promise<StripeCheckoutResult> => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.functions.invoke(
      'stripe-create-checkout',
      {
        body: request,
      }
    );

    if (error) {
      console.error('Error creating Stripe checkout session:', error);
      return {
        success: false,
        error: error.message || 'Failed to create checkout session',
      };
    }

    return {
      success: data.success,
      sessionId: data.sessionId,
      url: data.url,
      error: data.error,
    };
  } catch (error) {
    console.error('Error in createStripeCheckoutSession:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create checkout session',
    };
  }
};

/**
 * Create a Stripe customer portal session
 * Allows users to manage their subscription, payment methods, and invoices
 */
export const createStripePortalSession = async (
  returnUrl?: string
): Promise<StripePortalResult> => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.functions.invoke(
      'stripe-create-portal',
      {
        body: returnUrl ? { returnUrl } : {},
      }
    );

    if (error) {
      console.error('Error creating Stripe portal session:', error);
      return {
        success: false,
        error: error.message || 'Failed to create portal session',
      };
    }

    return {
      success: data.success,
      url: data.url,
      error: data.error,
      code: data.code,
    };
  } catch (error) {
    console.error('Error in createStripePortalSession:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create portal session',
    };
  }
};

/**
 * Check if user has an active Stripe subscription
 */
export const hasStripeSubscription = async (
  userId: string
): Promise<boolean> => {
  try {
    const subscription = await getFullSubscription(userId);
    return !!(subscription?.stripeSubscriptionId && subscription.tier !== 'free');
  } catch (error) {
    console.error('Error checking Stripe subscription:', error);
    return false;
  }
};
