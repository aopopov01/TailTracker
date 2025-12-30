import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Subscription Upgrade Edge Function
 * Handles immediate subscription upgrades with proration
 *
 * Pricing (EUR):
 *   Free: €0/month
 *   Premium: €5.99/month or €60/year
 *   Pro: €8.99/month or €90/year
 */

type SubscriptionTier = 'free' | 'premium' | 'pro';
type BillingCycle = 'monthly' | 'annual';

interface UpgradeRequest {
  targetTier: SubscriptionTier;
  billingCycle: BillingCycle;
}

// Pricing constants in EUR
const PRICING = {
  free: { monthly: 0, annual: 0 },
  premium: { monthly: 5.99, annual: 60 },
  pro: { monthly: 8.99, annual: 90 },
} as const;

// Tier hierarchy for validation
const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

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
 * Calculate proration amount for upgrade
 */
const calculateProration = (
  currentTier: SubscriptionTier,
  targetTier: SubscriptionTier,
  currentBillingCycle: BillingCycle | null,
  targetBillingCycle: BillingCycle,
  periodEndDate: string | null
): number => {
  const daysRemaining = calculateDaysRemaining(periodEndDate);

  if (daysRemaining <= 0) return 0;

  const currentDailyRate = calculateDailyRate(
    currentTier,
    currentBillingCycle || 'monthly'
  );
  const targetDailyRate = calculateDailyRate(targetTier, targetBillingCycle);

  // Proration: days remaining × (new rate - old rate)
  const proration = daysRemaining * (targetDailyRate - currentDailyRate);

  return Math.max(0, Number(proration.toFixed(2)));
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body
    const { targetTier, billingCycle }: UpgradeRequest = await req.json();

    // Validate input
    if (!targetTier || !['free', 'premium', 'pro'].includes(targetTier)) {
      return new Response(
        JSON.stringify({ error: 'Invalid target tier' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
      return new Response(
        JSON.stringify({ error: 'Invalid billing cycle' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Use service role client for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current subscription
    const { data: currentSub, error: subError } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no subscription exists, create one
    let subscription = currentSub;
    if (subError && subError.code === 'PGRST116') {
      // No subscription found, user is on implicit free tier
      subscription = {
        user_id: user.id,
        tier: 'free',
        billing_cycle: null,
        status: 'active',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        downgrade_to_tier: null,
      };
    } else if (subError) {
      throw new Error(`Failed to fetch subscription: ${subError.message}`);
    }

    const currentTier = subscription.tier as SubscriptionTier || 'free';

    // Validate this is an upgrade
    if (TIER_HIERARCHY[targetTier] <= TIER_HIERARCHY[currentTier]) {
      return new Response(
        JSON.stringify({
          error: 'Target tier must be higher than current tier. Use downgrade endpoint instead.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Calculate proration
    const prorationAmount = calculateProration(
      currentTier,
      targetTier,
      subscription.billing_cycle as BillingCycle | null,
      billingCycle,
      subscription.current_period_end
    );

    // Calculate new period dates
    const now = new Date();
    const periodDays = billingCycle === 'monthly' ? 30 : 365;
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    // Update subscription
    const updateData = {
      user_id: user.id,
      tier: targetTier,
      billing_cycle: billingCycle,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      downgrade_to_tier: null,
      updated_at: now.toISOString(),
    };

    const { data: updatedSub, error: updateError } = await serviceClient
      .from('subscriptions')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    // Record history
    const historyData = {
      subscription_id: updatedSub.id,
      user_id: user.id,
      action: 'upgrade',
      from_tier: currentTier,
      to_tier: targetTier,
      from_billing_cycle: subscription.billing_cycle,
      to_billing_cycle: billingCycle,
      proration_amount: prorationAmount,
      metadata: {
        previous_period_end: subscription.current_period_end,
        new_period_end: periodEnd.toISOString(),
      },
      created_at: now.toISOString(),
    };

    const { data: historyEntry, error: historyError } = await serviceClient
      .from('subscription_history')
      .insert(historyData)
      .select()
      .single();

    if (historyError) {
      console.error('Failed to record history:', historyError);
      // Don't fail the request, history is for audit purposes
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: updatedSub,
        historyEntry: historyEntry || null,
        prorationAmount,
        effectiveDate: now.toISOString(),
        message: `Successfully upgraded to ${targetTier} (${billingCycle})`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
