import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Subscription Period Processor Edge Function
 * Daily cron job to process subscription period-end transitions
 *
 * Tasks:
 * - Process scheduled downgrades (cancel_at_period_end = true, downgrade_to_tier set)
 * - Process scheduled cancellations (cancel_at_period_end = true, downgrade_to_tier = 'free')
 * - Update period dates for active subscriptions
 *
 * Schedule: Should run daily via Supabase cron or external scheduler
 */

type SubscriptionTier = 'free' | 'premium' | 'pro';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  subscriptionId: string;
  userId: string;
  action: 'downgrade' | 'cancel';
  fromTier: SubscriptionTier;
  toTier: SubscriptionTier;
  success: boolean;
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This endpoint should be called by cron job or admin
    // Verify the request is from a trusted source
    const authHeader = req.headers.get('Authorization');

    // Allow service role key or admin bearer token
    const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // If not service role, verify admin user
    if (!isServiceRole && authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Verify user is admin (would need to check users table)
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: userData, error: userDataError } = await serviceClient
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (userDataError || !['admin', 'super_admin'].includes(userData?.role)) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    // Use service role client for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const results: ProcessingResult[] = [];

    // Find subscriptions with period ending today or earlier that have pending changes
    const { data: pendingSubscriptions, error: fetchError } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('cancel_at_period_end', true)
      .lte('current_period_end', now.toISOString())
      .not('downgrade_to_tier', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch pending subscriptions: ${fetchError.message}`);
    }

    console.log(`Found ${pendingSubscriptions?.length || 0} subscriptions to process`);

    // Process each subscription
    for (const subscription of pendingSubscriptions || []) {
      const result: ProcessingResult = {
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        action: subscription.downgrade_to_tier === 'free' ? 'cancel' : 'downgrade',
        fromTier: subscription.tier,
        toTier: subscription.downgrade_to_tier,
        success: false,
      };

      try {
        const targetTier = subscription.downgrade_to_tier as SubscriptionTier;
        const isCancellation = targetTier === 'free';

        // Update subscription
        const updateData = {
          tier: targetTier,
          status: isCancellation ? 'cancelled' : 'active',
          billing_cycle: isCancellation ? null : subscription.billing_cycle,
          current_period_start: isCancellation ? null : now.toISOString(),
          current_period_end: isCancellation
            ? null
            : new Date(
                now.getTime() +
                  (subscription.billing_cycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
              ).toISOString(),
          cancel_at_period_end: false,
          downgrade_to_tier: null,
          updated_at: now.toISOString(),
        };

        const { error: updateError } = await serviceClient
          .from('subscriptions')
          .update(updateData)
          .eq('id', subscription.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        // Record history
        const historyData = {
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          action: 'period_end',
          from_tier: subscription.tier,
          to_tier: targetTier,
          from_billing_cycle: subscription.billing_cycle,
          to_billing_cycle: isCancellation ? null : subscription.billing_cycle,
          proration_amount: null,
          metadata: {
            processed_at: now.toISOString(),
            was_cancellation: isCancellation,
            processor: 'subscription-period-processor',
          },
          created_at: now.toISOString(),
        };

        await serviceClient.from('subscription_history').insert(historyData);

        result.success = true;
      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to process subscription ${subscription.id}:`, error);
      }

      results.push(result);
    }

    // Also check for expired subscriptions (past_due status check could be added here)

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        processedAt: now.toISOString(),
        totalProcessed: results.length,
        successCount,
        failureCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Period processor error:', error);
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
