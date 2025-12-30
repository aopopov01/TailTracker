import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Subscription Change Billing Cycle Edge Function
 * Switches between monthly and annual billing with proration
 *
 * Pricing (EUR):
 *   Premium: €5.99/month or €60/year (~17% savings)
 *   Pro: €8.99/month or €90/year (~17% savings)
 */

type SubscriptionTier = 'free' | 'premium' | 'pro';
type BillingCycle = 'monthly' | 'annual';

interface BillingCycleChangeRequest {
  newBillingCycle: BillingCycle;
}

// Pricing constants in EUR
const PRICING = {
  free: { monthly: 0, annual: 0 },
  premium: { monthly: 5.99, annual: 60 },
  pro: { monthly: 8.99, annual: 90 },
} as const;

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
    const { newBillingCycle }: BillingCycleChangeRequest = await req.json();

    // Validate input
    if (!newBillingCycle || !['monthly', 'annual'].includes(newBillingCycle)) {
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

    if (subError) {
      if (subError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'No active subscription found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      throw new Error(`Failed to fetch subscription: ${subError.message}`);
    }

    const currentTier = currentSub.tier as SubscriptionTier || 'free';
    const currentBillingCycle = currentSub.billing_cycle as BillingCycle;

    // Free tier doesn't have billing cycles
    if (currentTier === 'free') {
      return new Response(
        JSON.stringify({ error: 'Free tier does not have billing cycles' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Already on the requested billing cycle
    if (currentBillingCycle === newBillingCycle) {
      return new Response(
        JSON.stringify({ error: `Already on ${newBillingCycle} billing` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Calculate proration
    const daysRemaining = calculateDaysRemaining(currentSub.current_period_end);
    const currentDailyRate = calculateDailyRate(currentTier, currentBillingCycle);
    const newDailyRate = calculateDailyRate(currentTier, newBillingCycle);

    // Credit for unused days at old rate
    const creditAmount = daysRemaining * currentDailyRate;

    // Cost for new billing cycle
    const newCost = PRICING[currentTier][newBillingCycle];

    // Proration: new cost - credit (positive means user pays more)
    const prorationAmount = Number((newCost - creditAmount).toFixed(2));

    const now = new Date();
    const periodDays = newBillingCycle === 'monthly' ? 30 : 365;
    const newPeriodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    // Update subscription
    const updateData = {
      billing_cycle: newBillingCycle,
      current_period_start: now.toISOString(),
      current_period_end: newPeriodEnd.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: updatedSub, error: updateError } = await serviceClient
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update billing cycle: ${updateError.message}`);
    }

    // Record history
    const historyData = {
      subscription_id: updatedSub.id,
      user_id: user.id,
      action: 'billing_cycle_change',
      from_tier: currentTier,
      to_tier: currentTier,
      from_billing_cycle: currentBillingCycle,
      to_billing_cycle: newBillingCycle,
      proration_amount: prorationAmount,
      metadata: {
        days_remaining: daysRemaining,
        credit_amount: creditAmount,
        new_cost: newCost,
        previous_period_end: currentSub.current_period_end,
        new_period_end: newPeriodEnd.toISOString(),
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
    }

    const savingsMessage = newBillingCycle === 'annual'
      ? ' Save ~17% with annual billing!'
      : '';

    return new Response(
      JSON.stringify({
        success: true,
        subscription: updatedSub,
        historyEntry: historyEntry || null,
        prorationAmount,
        effectiveDate: now.toISOString(),
        message: `Successfully switched to ${newBillingCycle} billing.${savingsMessage}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Billing cycle change error:', error);
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
