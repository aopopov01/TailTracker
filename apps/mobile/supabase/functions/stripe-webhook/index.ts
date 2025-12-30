import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

/**
 * Stripe Webhook Handler Edge Function
 * Processes Stripe webhook events for subscription lifecycle management
 *
 * Handled Events:
 *   - checkout.session.completed
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 */

type SubscriptionTier = 'free' | 'premium' | 'pro';
type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'paused';

// Map Stripe Price IDs to tiers - configured via environment variables
const getTierFromPriceId = (priceId: string): SubscriptionTier => {
  const priceMappings: Record<string, SubscriptionTier> = {
    [Deno.env.get('STRIPE_PRICE_ID_PREMIUM_MONTHLY') || '']: 'premium',
    [Deno.env.get('STRIPE_PRICE_ID_PREMIUM_ANNUAL') || '']: 'premium',
    [Deno.env.get('STRIPE_PRICE_ID_PRO_MONTHLY') || '']: 'pro',
    [Deno.env.get('STRIPE_PRICE_ID_PRO_ANNUAL') || '']: 'pro',
  };

  return priceMappings[priceId] || 'free';
};

// Map Stripe subscription status to our status
const mapStripeStatus = (stripeStatus: string): SubscriptionStatus => {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelled';
    case 'paused':
      return 'paused';
    default:
      return 'active';
  }
};

// Get billing cycle from Stripe price interval
const getBillingCycle = (interval: string): 'monthly' | 'annual' => {
  return interval === 'year' ? 'annual' : 'monthly';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase service client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseClient, stripe, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseClient, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseClient, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabaseClient, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseClient, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Handle checkout.session.completed event
 * This is fired when a customer completes the checkout process
 */
async function handleCheckoutCompleted(
  supabaseClient: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('No supabase_user_id in session metadata');
    return;
  }

  console.log(`Checkout completed for user ${userId}`);

  // Fetch the subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);
  const billingCycle = getBillingCycle(subscription.items.data[0]?.price.recurring?.interval || 'month');

  // Update subscription in database
  const { error } = await supabaseClient
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier: tier,
      billing_cycle: billingCycle,
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      downgrade_to_tier: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  // Record in subscription history
  await supabaseClient.from('subscription_history').insert({
    subscription_id: (await supabaseClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()).data?.id,
    user_id: userId,
    action: 'upgrade',
    from_tier: 'free',
    to_tier: tier,
    to_billing_cycle: billingCycle,
    metadata: {
      stripe_session_id: session.id,
      stripe_subscription_id: subscriptionId,
    },
  });
}

/**
 * Handle customer.subscription.created and customer.subscription.updated events
 */
async function handleSubscriptionUpdate(
  supabaseClient: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata?.supabase_user_id;
  const customerId = subscription.customer as string;

  if (!userId) {
    // Try to find user by customer ID
    const { data } = await supabaseClient
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!data?.user_id) {
      console.error('Cannot find user for subscription:', subscription.id);
      return;
    }
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);
  const billingCycle = getBillingCycle(subscription.items.data[0]?.price.recurring?.interval || 'month');
  const status = mapStripeStatus(subscription.status);

  // Update subscription in database
  const { error } = await supabaseClient
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      tier: tier,
      billing_cycle: billingCycle,
      status: status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      downgrade_to_tier: subscription.cancel_at_period_end ? 'free' : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  console.log(`Subscription updated: ${subscription.id}, tier: ${tier}, status: ${status}`);
}

/**
 * Handle customer.subscription.deleted event
 * This is fired when a subscription is cancelled and the period ends
 */
async function handleSubscriptionDeleted(
  supabaseClient: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  // Get the user's subscription record
  const { data: subData } = await supabaseClient
    .from('subscriptions')
    .select('id, user_id, tier')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!subData) {
    console.error('Cannot find subscription for customer:', customerId);
    return;
  }

  // Update subscription to free tier
  const { error } = await supabaseClient
    .from('subscriptions')
    .update({
      tier: 'free',
      billing_cycle: null,
      status: 'active',
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      downgrade_to_tier: null,
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  // Record in subscription history
  await supabaseClient.from('subscription_history').insert({
    subscription_id: subData.id,
    user_id: subData.user_id,
    action: 'cancel',
    from_tier: subData.tier,
    to_tier: 'free',
    metadata: {
      stripe_subscription_id: subscription.id,
      reason: 'subscription_deleted',
    },
  });

  console.log(`Subscription deleted for customer ${customerId}, reverted to free tier`);
}

/**
 * Handle invoice.payment_succeeded event
 * Used for renewal tracking
 */
async function handlePaymentSucceeded(
  supabaseClient: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    // One-time payment, not subscription-related
    return;
  }

  console.log(`Payment succeeded for subscription ${subscriptionId}`);

  // Update subscription status to active (in case it was past_due)
  const { error } = await supabaseClient
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(
  supabaseClient: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  console.log(`Payment failed for subscription ${subscriptionId}`);

  // Get the user's subscription record
  const { data: subData } = await supabaseClient
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!subData) {
    console.error('Cannot find subscription for customer:', customerId);
    return;
  }

  // Update subscription status to past_due
  const { error } = await supabaseClient
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }

  // Record in subscription history
  await supabaseClient.from('subscription_history').insert({
    subscription_id: subData.id,
    user_id: subData.user_id,
    action: 'payment_failed',
    metadata: {
      stripe_invoice_id: invoice.id,
      amount_due: invoice.amount_due,
      attempt_count: invoice.attempt_count,
    },
  });
}
