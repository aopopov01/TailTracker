// TailTracker Stripe Webhook Handler Edge Function
// Processes Stripe webhooks for subscription and payment events

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret')
      return new Response('Missing signature or webhook secret', { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log(`Processing webhook: ${event.type}`)

    // Check if event has already been processed
    const { data: existingEvent } = await supabaseClient
      .from('stripe_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single()

    if (existingEvent) {
      console.log(`Event ${event.id} already processed`)
      return new Response('Event already processed', { status: 200 })
    }

    // Store webhook event
    await supabaseClient
      .from('stripe_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event,
        processed: false
      })

    // Process the event
    let processed = false
    let errorMessage = null

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await handleSubscriptionCreated(supabaseClient, event.data.object as Stripe.Subscription)
          processed = true
          break

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(supabaseClient, event.data.object as Stripe.Subscription)
          processed = true
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(supabaseClient, event.data.object as Stripe.Subscription)
          processed = true
          break

        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(supabaseClient, event.data.object as Stripe.Invoice)
          processed = true
          break

        case 'invoice.payment_failed':
          await handlePaymentFailed(supabaseClient, event.data.object as Stripe.Invoice)
          processed = true
          break

        case 'customer.subscription.trial_will_end':
          await handleTrialWillEnd(supabaseClient, event.data.object as Stripe.Subscription)
          processed = true
          break

        case 'payment_method.attached':
          await handlePaymentMethodAttached(supabaseClient, event.data.object as Stripe.PaymentMethod)
          processed = true
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
          processed = true
      }
    } catch (error) {
      console.error(`Error processing event ${event.type}:`, error)
      errorMessage = error.message
    }

    // Update webhook event status
    await supabaseClient
      .from('stripe_webhook_events')
      .update({
        processed,
        error_message: errorMessage,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', event.id)

    return new Response(
      JSON.stringify({ processed, eventType: event.type }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function handleSubscriptionCreated(supabaseClient: any, subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.warn('No userId in subscription metadata')
    return
  }

  try {
    // Get user by auth_user_id (Stripe metadata stores auth.uid())
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found for subscription:', userId)
      return
    }

    // Upsert subscription record
    await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: userData.id,
        plan_name: 'premium_monthly',
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
      }, {
        onConflict: 'stripe_subscription_id'
      })

    // Update user subscription status
    const userStatus = subscription.status === 'active' ? 'premium' : subscription.status
    await supabaseClient
      .from('users')
      .update({
        subscription_status: userStatus,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
      })
      .eq('id', userData.id)

    console.log(`Subscription created for user: ${userData.id}`)
  } catch (error) {
    console.error('Error handling subscription created:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(supabaseClient: any, subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.warn('No userId in subscription metadata')
    return
  }

  try {
    // Get user by auth_user_id
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found for subscription:', userId)
      return
    }

    // Update subscription record
    await supabaseClient
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
      })
      .eq('stripe_subscription_id', subscription.id)

    // Update user subscription status
    let userStatus = subscription.status
    if (subscription.status === 'active') userStatus = 'premium'
    if (subscription.status === 'canceled') userStatus = 'cancelled'

    await supabaseClient
      .from('users')
      .update({
        subscription_status: userStatus,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', userData.id)

    console.log(`Subscription updated for user: ${userData.id}, status: ${subscription.status}`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(supabaseClient: any, subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.warn('No userId in subscription metadata')
    return
  }

  try {
    // Get user by auth_user_id
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found for subscription:', userId)
      return
    }

    // Update subscription record
    await supabaseClient
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    // Update user to free tier
    await supabaseClient
      .from('users')
      .update({
        subscription_status: 'free',
        subscription_expires_at: null
      })
      .eq('id', userData.id)

    console.log(`Subscription deleted for user: ${userData.id}`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
    throw error
  }
}

async function handlePaymentSucceeded(supabaseClient: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  try {
    // Get subscription from database
    const { data: subscriptionData, error } = await supabaseClient
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (error || !subscriptionData) {
      console.error('Subscription not found for payment:', subscriptionId)
      return
    }

    // Record payment
    await supabaseClient
      .from('payments')
      .insert({
        subscription_id: subscriptionData.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: (invoice.amount_paid || 0) / 100, // Convert from cents
        currency: invoice.currency,
        status: 'completed',
        description: invoice.description || `Payment for subscription`,
        invoice_url: invoice.hosted_invoice_url,
        processed_at: new Date().toISOString()
      })

    console.log(`Payment succeeded for subscription: ${subscriptionId}`)
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

async function handlePaymentFailed(supabaseClient: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  try {
    // Get subscription from database
    const { data: subscriptionData, error } = await supabaseClient
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (error || !subscriptionData) {
      console.error('Subscription not found for failed payment:', subscriptionId)
      return
    }

    // Record failed payment
    await supabaseClient
      .from('payments')
      .insert({
        subscription_id: subscriptionData.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: (invoice.amount_due || 0) / 100, // Convert from cents
        currency: invoice.currency,
        status: 'failed',
        description: `Failed payment for subscription`,
        processed_at: new Date().toISOString()
      })

    // Send notification about failed payment
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: subscriptionData.user_id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please update your payment method to continue using premium features.',
        scheduled_for: new Date().toISOString()
      })

    console.log(`Payment failed for subscription: ${subscriptionId}`)
  } catch (error) {
    console.error('Error handling payment failed:', error)
    throw error
  }
}

async function handleTrialWillEnd(supabaseClient: any, subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  try {
    // Get user by auth_user_id
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found for trial ending:', userId)
      return
    }

    // Send notification about trial ending
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: userData.id,
        type: 'trial_ending',
        title: 'Your trial is ending soon',
        message: 'Your premium trial ends in 3 days. Add a payment method to continue enjoying premium features.',
        scheduled_for: new Date().toISOString()
      })

    console.log(`Trial ending notification sent for user: ${userData.id}`)
  } catch (error) {
    console.error('Error handling trial will end:', error)
    throw error
  }
}

async function handlePaymentMethodAttached(supabaseClient: any, paymentMethod: Stripe.PaymentMethod) {
  try {
    console.log(`Payment method attached: ${paymentMethod.id} to customer: ${paymentMethod.customer}`)
    // Could implement additional logic here if needed
  } catch (error) {
    console.error('Error handling payment method attached:', error)
    throw error
  }
}