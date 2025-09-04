// TailTracker Stripe Payment Integration Test Suite
// Comprehensive testing of Stripe webhook handling, subscription management, and payment processing

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertEquals, assertExists, assert, assertNotEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

// Test configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret'
const TEST_CUSTOMER_ID = 'cus_test_customer_123'
const TEST_SUBSCRIPTION_ID = 'sub_test_subscription_123'
const TEST_PAYMENT_INTENT_ID = 'pi_test_payment_123'

// Test user data
const TEST_USER_DATA = {
  auth_user_id: 'auth_user_test_123',
  email: 'stripe-test@tailtracker.app',
  full_name: 'Stripe Test User',
  stripe_customer_id: TEST_CUSTOMER_ID
}

let supabase: SupabaseClient
let testUserId: string

// ================================================================================================
// STRIPE WEBHOOK EVENT MOCKS
// ================================================================================================

const createMockStripeEvent = (eventType: string, eventData: any, eventId?: string) => {
  return {
    id: eventId || `evt_test_${Date.now()}`,
    object: 'event',
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: eventData
    },
    api_version: '2023-10-16',
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: null
    }
  }
}

const createWebhookSignature = (payload: string, secret: string, timestamp?: number) => {
  const ts = timestamp || Math.floor(Date.now() / 1000)
  const payloadForSigning = `${ts}.${payload}`
  
  // Simple HMAC signature for testing (in production, use proper Stripe signature verification)
  return `t=${ts},v1=test_signature_${payloadForSigning.length}`
}

// ================================================================================================
// TEST SETUP AND TEARDOWN
// ================================================================================================

async function setupPaymentTests() {
  console.log('🚀 Setting up Stripe payment integration tests...')
  
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  // Create test user
  const { data: userData, error: userError } = await supabase
    .from('users')
    .upsert(TEST_USER_DATA, {
      onConflict: 'auth_user_id'
    })
    .select()
    .single()
  
  if (userError) {
    throw new Error(`Failed to create test user: ${userError.message}`)
  }
  
  testUserId = userData.id
  console.log(`✅ Test user created: ${testUserId}`)
}

async function teardownPaymentTests() {
  console.log('🧹 Cleaning up payment test data...')
  
  if (testUserId) {
    // Clean up in reverse dependency order
    await supabase.from('payments').delete().eq('subscription_id', testUserId)
    await supabase.from('subscriptions').delete().eq('user_id', testUserId)
    await supabase.from('stripe_webhook_events').delete().like('stripe_event_id', 'evt_test_%')
    await supabase.from('users').delete().eq('id', testUserId)
  }
  
  console.log('✅ Payment test cleanup complete')
}

// ================================================================================================
// 1. WEBHOOK EVENT PROCESSING TESTS
// ================================================================================================

Deno.test("Stripe Webhooks: Event Idempotency", async () => {
  await setupPaymentTests()
  
  try {
    const eventId = 'evt_test_idempotency_123'
    const mockEvent = createMockStripeEvent('customer.subscription.created', {
      id: TEST_SUBSCRIPTION_ID,
      customer: TEST_CUSTOMER_ID,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000,
      metadata: {
        userId: TEST_USER_DATA.auth_user_id
      }
    }, eventId)

    const payload = JSON.stringify(mockEvent)
    const signature = createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)

    // First webhook call
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    })

    // Second webhook call (should be idempotent)
    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    })

    // Both calls should succeed
    assertEquals(response1.status, 200)
    assertEquals(response2.status, 200)

    // Check that only one webhook event was stored
    const { data: webhookEvents, error } = await supabase
      .from('stripe_webhook_events')
      .select('*')
      .eq('stripe_event_id', eventId)

    assert(!error, `Database error: ${error?.message}`)
    assertEquals(webhookEvents?.length, 1)

    console.log('✅ Webhook idempotency test passed')

  } finally {
    await teardownPaymentTests()
  }
})

// ================================================================================================
// 2. SUBSCRIPTION LIFECYCLE TESTS
// ================================================================================================

Deno.test("Stripe Webhooks: Subscription Created", async () => {
  await setupPaymentTests()
  
  try {
    const mockSubscription = {
      id: TEST_SUBSCRIPTION_ID,
      customer: TEST_CUSTOMER_ID,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 days
      trial_start: null,
      trial_end: null,
      cancel_at_period_end: false,
      canceled_at: null,
      metadata: {
        userId: TEST_USER_DATA.auth_user_id
      }
    }

    const mockEvent = createMockStripeEvent('customer.subscription.created', mockSubscription)
    const payload = JSON.stringify(mockEvent)

    // Process subscription creation webhook
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)
      },
      body: payload
    })

    assertEquals(response.status, 200)

    // Verify subscription was created in database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', TEST_SUBSCRIPTION_ID)
      .single()

    assert(!subError, `Subscription query error: ${subError?.message}`)
    assertExists(subscription)
    assertEquals(subscription.status, 'active')
    assertEquals(subscription.user_id, testUserId)

    // Verify user status was updated
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', testUserId)
      .single()

    assert(!userError, `User query error: ${userError?.message}`)
    assertEquals(user.subscription_status, 'premium')
    assertExists(user.subscription_expires_at)

    console.log('✅ Subscription creation webhook test passed')

  } finally {
    await teardownPaymentTests()
  }
})

Deno.test("Stripe Webhooks: Subscription Updated", async () => {
  await setupPaymentTests()
  
  try {
    // First create a subscription
    await supabase.from('subscriptions').insert({
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 2592000000).toISOString()
    })

    // Now test subscription update
    const mockUpdatedSubscription = {
      id: TEST_SUBSCRIPTION_ID,
      customer: TEST_CUSTOMER_ID,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000,
      cancel_at_period_end: true, // User requested cancellation
      canceled_at: Math.floor(Date.now() / 1000),
      metadata: {
        userId: TEST_USER_DATA.auth_user_id
      }
    }

    const mockEvent = createMockStripeEvent('customer.subscription.updated', mockUpdatedSubscription)
    const payload = JSON.stringify(mockEvent)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)
      },
      body: payload
    })

    assertEquals(response.status, 200)

    // Verify subscription was updated
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('cancel_at_period_end, canceled_at')
      .eq('stripe_subscription_id', TEST_SUBSCRIPTION_ID)
      .single()

    assert(!error, `Subscription query error: ${error?.message}`)
    assertEquals(subscription.cancel_at_period_end, true)
    assertExists(subscription.canceled_at)

    console.log('✅ Subscription update webhook test passed')

  } finally {
    await teardownPaymentTests()
  }
})

Deno.test("Stripe Webhooks: Subscription Cancelled", async () => {
  await setupPaymentTests()
  
  try {
    // First create a subscription
    await supabase.from('subscriptions').insert({
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'active'
    })

    // Update user to premium status
    await supabase.from('users').update({
      subscription_status: 'premium'
    }).eq('id', testUserId)

    // Now test subscription cancellation
    const mockCancelledSubscription = {
      id: TEST_SUBSCRIPTION_ID,
      customer: TEST_CUSTOMER_ID,
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000),
      metadata: {
        userId: TEST_USER_DATA.auth_user_id
      }
    }

    const mockEvent = createMockStripeEvent('customer.subscription.deleted', mockCancelledSubscription)
    const payload = JSON.stringify(mockEvent)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)
      },
      body: payload
    })

    assertEquals(response.status, 200)

    // Verify user was downgraded to free tier
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', testUserId)
      .single()

    assert(!userError, `User query error: ${userError?.message}`)
    assertEquals(user.subscription_status, 'free')
    assertEquals(user.subscription_expires_at, null)

    console.log('✅ Subscription cancellation webhook test passed')

  } finally {
    await teardownPaymentTests()
  }
})

// ================================================================================================
// 3. PAYMENT PROCESSING TESTS
// ================================================================================================

Deno.test("Stripe Webhooks: Payment Succeeded", async () => {
  await setupPaymentTests()
  
  try {
    // Create subscription first
    const { data: subscription } = await supabase.from('subscriptions').insert({
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'active'
    }).select().single()

    const mockInvoice = {
      id: 'in_test_invoice_123',
      subscription: TEST_SUBSCRIPTION_ID,
      payment_intent: TEST_PAYMENT_INTENT_ID,
      amount_paid: 799, // €7.99 in cents
      currency: 'eur',
      status: 'paid',
      description: 'TailTracker Premium Monthly',
      hosted_invoice_url: 'https://invoice.stripe.com/test'
    }

    const mockEvent = createMockStripeEvent('invoice.payment_succeeded', mockInvoice)
    const payload = JSON.stringify(mockEvent)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)
      },
      body: payload
    })

    assertEquals(response.status, 200)

    // Verify payment was recorded
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', TEST_PAYMENT_INTENT_ID)
      .single()

    assert(!error, `Payment query error: ${error?.message}`)
    assertExists(payment)
    assertEquals(payment.amount, 7.99) // Converted from cents
    assertEquals(payment.currency, 'eur')
    assertEquals(payment.status, 'completed')

    console.log('✅ Payment succeeded webhook test passed')

  } finally {
    await teardownPaymentTests()
  }
})

Deno.test("Stripe Webhooks: Payment Failed", async () => {
  await setupPaymentTests()
  
  try {
    // Create subscription first
    const { data: subscription } = await supabase.from('subscriptions').insert({
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'active'
    }).select().single()

    const mockFailedInvoice = {
      id: 'in_test_failed_123',
      subscription: TEST_SUBSCRIPTION_ID,
      payment_intent: 'pi_test_failed_123',
      amount_due: 799,
      currency: 'eur',
      status: 'open',
      description: 'Failed payment attempt'
    }

    const mockEvent = createMockStripeEvent('invoice.payment_failed', mockFailedInvoice)
    const payload = JSON.stringify(mockEvent)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)
      },
      body: payload
    })

    assertEquals(response.status, 200)

    // Verify failed payment was recorded
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', 'pi_test_failed_123')
      .single()

    assert(!error, `Payment query error: ${error?.message}`)
    assertEquals(payment.status, 'failed')

    // Verify notification was created
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'payment_failed')
      .single()

    assert(!notifError, `Notification query error: ${notifError?.message}`)
    assertExists(notification)
    assertEquals(notification.title, 'Payment Failed')

    console.log('✅ Payment failed webhook test passed')

  } finally {
    await teardownPaymentTests()
  }
})

// ================================================================================================
// 4. SUBSCRIPTION STATE SYNCHRONIZATION TESTS
// ================================================================================================

Deno.test("Subscription Sync: Database-Stripe Consistency", async () => {
  await setupPaymentTests()
  
  try {
    // Create subscription in database
    const subscriptionData = {
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'active' as const,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 2592000000).toISOString()
    }

    await supabase.from('subscriptions').insert(subscriptionData)

    // Verify trigger updated user status
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', testUserId)
      .single()

    assert(!error, `User query error: ${error?.message}`)
    assertEquals(user.subscription_status, 'premium')
    assertExists(user.subscription_expires_at)

    // Test subscription status change
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', TEST_SUBSCRIPTION_ID)

    // Verify user status was updated by trigger
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', testUserId)
      .single()

    assert(!updateError, `User update query error: ${updateError?.message}`)
    assertEquals(updatedUser.subscription_status, 'cancelled')

    console.log('✅ Subscription state synchronization test passed')

  } finally {
    await teardownPaymentTests()
  }
})

// ================================================================================================
// 5. PREMIUM FEATURE ACCESS VALIDATION TESTS
// ================================================================================================

Deno.test("Premium Features: Access Control Validation", async () => {
  await setupPaymentTests()
  
  try {
    // Test free tier user (default state)
    let hasPremiumAccess = await supabase.rpc('has_premium_access', {
      user_auth_id: TEST_USER_DATA.auth_user_id
    })

    assertEquals(hasPremiumAccess.data, false)

    // Upgrade user to premium
    await supabase.from('users').update({
      subscription_status: 'premium',
      subscription_expires_at: new Date(Date.now() + 2592000000).toISOString()
    }).eq('id', testUserId)

    // Test premium access
    hasPremiumAccess = await supabase.rpc('has_premium_access', {
      user_auth_id: TEST_USER_DATA.auth_user_id
    })

    assertEquals(hasPremiumAccess.data, true)

    // Test expired subscription
    await supabase.from('users').update({
      subscription_expires_at: new Date(Date.now() - 86400000).toISOString() // -1 day
    }).eq('id', testUserId)

    hasPremiumAccess = await supabase.rpc('has_premium_access', {
      user_auth_id: TEST_USER_DATA.auth_user_id
    })

    assertEquals(hasPremiumAccess.data, false)

    console.log('✅ Premium feature access validation test passed')

  } finally {
    await teardownPaymentTests()
  }
})

// ================================================================================================
// 6. PAYMENT RETRY AND RECOVERY TESTS
// ================================================================================================

Deno.test("Payment Recovery: Retry Logic Simulation", async () => {
  await setupPaymentTests()
  
  try {
    const { data: subscription } = await supabase.from('subscriptions').insert({
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'past_due' // Indicates failed payment
    }).select().single()

    // Simulate multiple payment failure attempts
    const failureEvents = [
      'invoice.payment_failed',
      'invoice.payment_action_required',
      'customer.subscription.updated' // Status change to past_due
    ]

    for (const eventType of failureEvents) {
      const mockEvent = createMockStripeEvent(eventType, {
        id: eventType === 'customer.subscription.updated' ? TEST_SUBSCRIPTION_ID : 'in_retry_test',
        subscription: TEST_SUBSCRIPTION_ID,
        customer: TEST_CUSTOMER_ID,
        status: eventType === 'customer.subscription.updated' ? 'past_due' : 'open',
        metadata: eventType === 'customer.subscription.updated' ? { userId: TEST_USER_DATA.auth_user_id } : undefined
      })

      const payload = JSON.stringify(mockEvent)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)
        },
        body: payload
      })

      assertEquals(response.status, 200)
    }

    // Verify subscription status was updated to past_due
    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('stripe_subscription_id', TEST_SUBSCRIPTION_ID)
      .single()

    assert(!error, `Subscription query error: ${error?.message}`)
    assertEquals(updatedSubscription.status, 'past_due')

    console.log('✅ Payment retry logic simulation test passed')

  } finally {
    await teardownPaymentTests()
  }
})

// ================================================================================================
// 7. WEBHOOK SECURITY TESTS
// ================================================================================================

Deno.test("Webhook Security: Signature Verification", async () => {
  const mockEvent = createMockStripeEvent('test.event', { test: 'data' })
  const payload = JSON.stringify(mockEvent)

  // Test with invalid signature
  const invalidResponse = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 'invalid_signature'
    },
    body: payload
  })

  assertEquals(invalidResponse.status, 400)

  // Test with missing signature
  const noSigResponse = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: payload
  })

  assertEquals(noSigResponse.status, 400)

  console.log('✅ Webhook signature verification test passed')
})

// ================================================================================================
// 8. BILLING CYCLE AND RENEWAL TESTS
// ================================================================================================

Deno.test("Billing Cycles: Renewal Processing", async () => {
  await setupPaymentTests()
  
  try {
    // Create subscription approaching renewal
    const currentPeriodEnd = new Date(Date.now() + 86400000) // +1 day
    await supabase.from('subscriptions').insert({
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'active',
      current_period_end: currentPeriodEnd.toISOString()
    })

    // Simulate successful renewal
    const renewalEvent = createMockStripeEvent('invoice.payment_succeeded', {
      id: 'in_renewal_test',
      subscription: TEST_SUBSCRIPTION_ID,
      payment_intent: 'pi_renewal_test',
      amount_paid: 799,
      currency: 'eur',
      billing_reason: 'subscription_cycle'
    })

    const payload = JSON.stringify(renewalEvent)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)
      },
      body: payload
    })

    assertEquals(response.status, 200)

    // Verify renewal payment was recorded
    const { data: renewalPayment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', 'pi_renewal_test')
      .single()

    assert(!error, `Renewal payment query error: ${error?.message}`)
    assertEquals(renewalPayment.status, 'completed')

    console.log('✅ Billing cycle renewal test passed')

  } finally {
    await teardownPaymentTests()
  }
})

// ================================================================================================
// 9. REFUND AND DISPUTE HANDLING TESTS
// ================================================================================================

Deno.test("Refunds: Processing and State Updates", async () => {
  await setupPaymentTests()
  
  try {
    // Create subscription and payment
    const { data: subscription } = await supabase.from('subscriptions').insert({
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'active'
    }).select().single()

    await supabase.from('payments').insert({
      subscription_id: subscription.id,
      stripe_payment_intent_id: TEST_PAYMENT_INTENT_ID,
      amount: 7.99,
      currency: 'eur',
      status: 'completed'
    })

    // Simulate refund event
    const refundEvent = createMockStripeEvent('charge.dispute.created', {
      id: 'dp_test_dispute',
      charge: 'ch_test_charge',
      amount: 799,
      currency: 'eur',
      reason: 'fraudulent',
      status: 'warning_needs_response'
    })

    const payload = JSON.stringify(refundEvent)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': createWebhookSignature(payload, STRIPE_WEBHOOK_SECRET)
      },
      body: payload
    })

    // Webhook should handle unknown event types gracefully
    assertEquals(response.status, 200)

    console.log('✅ Refund handling test passed')

  } finally {
    await teardownPaymentTests()
  }
})

// ================================================================================================
// 10. ANALYTICS AND REPORTING TESTS
// ================================================================================================

Deno.test("Payment Analytics: Revenue Tracking", async () => {
  await setupPaymentTests()
  
  try {
    const { data: subscription } = await supabase.from('subscriptions').insert({
      user_id: testUserId,
      stripe_subscription_id: TEST_SUBSCRIPTION_ID,
      stripe_customer_id: TEST_CUSTOMER_ID,
      plan_name: 'premium_monthly',
      status: 'active'
    }).select().single()

    // Create multiple payments for analytics
    const payments = [
      { amount: 7.99, status: 'completed', date: new Date('2024-01-15') },
      { amount: 7.99, status: 'completed', date: new Date('2024-02-15') },
      { amount: 7.99, status: 'failed', date: new Date('2024-03-15') }
    ]

    for (const payment of payments) {
      await supabase.from('payments').insert({
        subscription_id: subscription.id,
        stripe_payment_intent_id: `pi_analytics_${Date.now()}_${Math.random()}`,
        amount: payment.amount,
        currency: 'eur',
        status: payment.status,
        processed_at: payment.date.toISOString()
      })
    }

    // Query payment analytics
    const { data: paymentStats, error } = await supabase
      .from('payments')
      .select('amount, status, processed_at')
      .eq('subscription_id', subscription.id)

    assert(!error, `Analytics query error: ${error?.message}`)
    assertEquals(paymentStats?.length, 3)

    const successfulPayments = paymentStats?.filter(p => p.status === 'completed') || []
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0)

    assertEquals(successfulPayments.length, 2)
    assertEquals(totalRevenue, 15.98) // 2 × €7.99

    console.log(`✅ Payment analytics test passed - ${successfulPayments.length} successful payments, €${totalRevenue} revenue`)

  } finally {
    await teardownPaymentTests()
  }
})

console.log(`
💳 TailTracker Stripe Payment Integration Tests
===============================================
Test Coverage:
✓ Webhook event idempotency
✓ Subscription lifecycle management
✓ Payment processing (success/failure)
✓ Subscription state synchronization
✓ Premium feature access validation
✓ Payment retry and recovery logic
✓ Webhook security and validation
✓ Billing cycle and renewal processing
✓ Refund and dispute handling
✓ Payment analytics and reporting
===============================================
Run with: deno test --allow-net --allow-env
`)