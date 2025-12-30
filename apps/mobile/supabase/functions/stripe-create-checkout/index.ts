import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

/**
 * Stripe Create Checkout Session Edge Function
 * Creates a Stripe checkout session for subscription purchases
 *
 * Pricing (EUR):
 *   Premium: €5.99/month or €60/year
 *   Pro: €8.99/month or €90/year
 */

type SubscriptionTier = 'premium' | 'pro';
type BillingCycle = 'monthly' | 'annual';

interface CheckoutRequest {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  successUrl?: string;
  cancelUrl?: string;
}

// Stripe Price IDs - these must be configured in environment variables
// Format: STRIPE_PRICE_ID_<TIER>_<CYCLE>
const getPriceId = (tier: SubscriptionTier, billingCycle: BillingCycle): string => {
  const priceIdKey = `STRIPE_PRICE_ID_${tier.toUpperCase()}_${billingCycle.toUpperCase()}`;
  const priceId = Deno.env.get(priceIdKey);

  if (!priceId) {
    throw new Error(`Price ID not configured for ${tier} ${billingCycle}. Set ${priceIdKey} environment variable.`);
  }

  return priceId;
};

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

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

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
    const { tier, billingCycle, successUrl, cancelUrl }: CheckoutRequest = await req.json();

    // Validate input
    if (!tier || !['premium', 'pro'].includes(tier)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier. Must be "premium" or "pro".' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
      return new Response(
        JSON.stringify({ error: 'Invalid billing cycle. Must be "monthly" or "annual".' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Use service role client for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    // Check if user already has a subscription with Stripe customer ID
    const { data: existingSub } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Upsert subscription record with customer ID
      await serviceClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          tier: 'free',
          status: 'active',
        }, { onConflict: 'user_id' });
    }

    // Get the Stripe Price ID
    const priceId = getPriceId(tier, billingCycle);

    // Default URLs if not provided
    const appUrl = Deno.env.get('APP_URL') || 'https://tailtracker.app';
    const finalSuccessUrl = successUrl || `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${appUrl}/pricing`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          tier: tier,
          billing_cycle: billingCycle,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        tier: tier,
        billing_cycle: billingCycle,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Stripe checkout error:', error);
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
