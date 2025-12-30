import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Subscription Reactivate Edge Function
 * Cancels pending downgrade or cancellation, restores subscription
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
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
          JSON.stringify({ error: 'No subscription found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      throw new Error(`Failed to fetch subscription: ${subError.message}`);
    }

    // Check if there's a pending change to cancel
    if (!currentSub.cancel_at_period_end && !currentSub.downgrade_to_tier) {
      return new Response(
        JSON.stringify({ error: 'No pending cancellation or downgrade to reactivate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const now = new Date();
    const previousDowngradeTo = currentSub.downgrade_to_tier;

    // Clear pending changes
    const updateData = {
      cancel_at_period_end: false,
      downgrade_to_tier: null,
      updated_at: now.toISOString(),
    };

    const { data: updatedSub, error: updateError } = await serviceClient
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to reactivate subscription: ${updateError.message}`);
    }

    // Record history
    const historyData = {
      subscription_id: updatedSub.id,
      user_id: user.id,
      action: 'reactivate',
      from_tier: currentSub.tier,
      to_tier: currentSub.tier, // Staying at current tier
      from_billing_cycle: currentSub.billing_cycle,
      to_billing_cycle: currentSub.billing_cycle,
      proration_amount: null,
      metadata: {
        cancelled_downgrade_to: previousDowngradeTo,
        was_cancellation: previousDowngradeTo === 'free',
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

    const actionCancelled = previousDowngradeTo === 'free' ? 'cancellation' : 'downgrade';

    return new Response(
      JSON.stringify({
        success: true,
        subscription: updatedSub,
        historyEntry: historyEntry || null,
        message: `Successfully cancelled pending ${actionCancelled}. Your ${currentSub.tier} subscription will continue.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Subscription reactivate error:', error);
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
