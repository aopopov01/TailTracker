import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Subscription Cancel Edge Function
 * Schedules subscription cancellation for end of current billing period
 * User will be downgraded to free tier at period end
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
          JSON.stringify({ error: 'No active subscription found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      throw new Error(`Failed to fetch subscription: ${subError.message}`);
    }

    const currentTier = currentSub.tier || 'free';

    // Already on free tier
    if (currentTier === 'free') {
      return new Response(
        JSON.stringify({ error: 'Already on free tier, nothing to cancel' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Already scheduled for cancellation
    if (currentSub.cancel_at_period_end && currentSub.downgrade_to_tier === 'free') {
      return new Response(
        JSON.stringify({
          error: 'Cancellation already scheduled',
          effectiveDate: currentSub.current_period_end,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const now = new Date();

    // Schedule cancellation for period end
    const updateData = {
      cancel_at_period_end: true,
      downgrade_to_tier: 'free',
      updated_at: now.toISOString(),
    };

    const { data: updatedSub, error: updateError } = await serviceClient
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to schedule cancellation: ${updateError.message}`);
    }

    // Record history
    const historyData = {
      subscription_id: updatedSub.id,
      user_id: user.id,
      action: 'cancel',
      from_tier: currentTier,
      to_tier: 'free',
      from_billing_cycle: currentSub.billing_cycle,
      to_billing_cycle: null,
      proration_amount: null,
      metadata: {
        scheduled_for: currentSub.current_period_end,
        type: 'scheduled_cancellation',
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

    return new Response(
      JSON.stringify({
        success: true,
        subscription: updatedSub,
        historyEntry: historyEntry || null,
        effectiveDate: currentSub.current_period_end,
        message: `Cancellation scheduled for ${new Date(currentSub.current_period_end).toLocaleDateString()}. You will retain ${currentTier} benefits until then.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Subscription cancel error:', error);
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
