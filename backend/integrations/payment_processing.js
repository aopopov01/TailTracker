/**
 * TailTracker Payment Processing Integration
 * Stripe + RevenueCat integration for freemium subscription model
 */

const stripe = require('stripe');
const { Purchases } = require('@revenuecat/purchases-js');
const crypto = require('crypto');

class PaymentProcessor {
  constructor(stripeSecretKey, revenueCatApiKey, supabaseClient) {
    this.stripe = stripe(stripeSecretKey);
    this.revenueCatApiKey = revenueCatApiKey;
    this.supabase = supabaseClient;
    
    // Initialize RevenueCat
    if (typeof window !== 'undefined') {
      Purchases.configure({
        apiKey: revenueCatApiKey,
      });
    }
  }

  /**
   * Subscription plans configuration
   */
  static SUBSCRIPTION_PLANS = {
    premium_monthly: {
      stripe_price_id: 'price_premium_monthly',
      revenuecat_product_id: 'premium_monthly',
      amount: 899, // $8.99 in cents
      currency: 'usd',
      interval: 'month',
      features: ['unlimited_pets', 'advanced_health_tracking', 'priority_support']
    },
    premium_yearly: {
      stripe_price_id: 'price_premium_yearly',
      revenuecat_product_id: 'premium_yearly', 
      amount: 8999, // $89.99 in cents (2 months free)
      currency: 'usd',
      interval: 'year',
      features: ['unlimited_pets', 'advanced_health_tracking', 'priority_support']
    },
    family_monthly: {
      stripe_price_id: 'price_family_monthly',
      revenuecat_product_id: 'family_monthly',
      amount: 1499, // $14.99 in cents
      currency: 'usd',
      interval: 'month',
      features: ['unlimited_pets', 'unlimited_family_members', 'advanced_health_tracking', 'priority_support', 'family_sharing']
    },
    family_yearly: {
      stripe_price_id: 'price_family_yearly',
      revenuecat_product_id: 'family_yearly',
      amount: 14999, // $149.99 in cents (2 months free)
      currency: 'usd',
      interval: 'year',
      features: ['unlimited_pets', 'unlimited_family_members', 'advanced_health_tracking', 'priority_support', 'family_sharing']
    }
  };

  /**
   * Create customer in Stripe
   */
  async createStripeCustomer(userId, email, name) {
    try {
      const customer = await this.stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          user_id: userId,
          source: 'tailtracker_app'
        }
      });

      // Store Stripe customer ID in database
      await this.supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      return customer;
    } catch (error) {
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  /**
   * Create subscription with Stripe
   */
  async createSubscription(userId, planId, paymentMethodId, trialDays = null) {
    try {
      const plan = PaymentProcessor.SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Get or create Stripe customer
      let { data: userData } = await this.supabase
        .from('users')
        .select('stripe_customer_id, email, full_name')
        .eq('id', userId)
        .single();

      let customerId = userData.stripe_customer_id;
      
      if (!customerId) {
        const customer = await this.createStripeCustomer(userId, userData.email, userData.full_name);
        customerId = customer.id;
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscriptionParams = {
        customer: customerId,
        items: [{
          price: plan.stripe_price_id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
          plan_id: planId
        }
      };

      if (trialDays) {
        subscriptionParams.trial_period_days = trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      // Store subscription in database
      await this.createSubscriptionRecord(userId, subscription, planId);

      return {
        subscription_id: subscription.id,
        client_secret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Create subscription record in database
   */
  async createSubscriptionRecord(userId, stripeSubscription, planId) {
    const subscriptionData = {
      user_id: userId,
      plan_name: planId,
      status: this.mapStripeStatus(stripeSubscription.status),
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeSubscription.customer,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000).toISOString() : null,
      trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null
    };

    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) throw error;

    // Update user subscription status
    await this.supabase
      .from('users')
      .update({
        subscription_status: subscriptionData.status,
        subscription_expires_at: subscriptionData.current_period_end,
        trial_ends_at: subscriptionData.trial_end
      })
      .eq('id', userId);

    return data;
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event, signature, webhookSecret) {
    try {
      // Verify webhook signature
      const stripeEvent = this.stripe.webhooks.constructEvent(
        event,
        signature,
        webhookSecret
      );

      switch (stripeEvent.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(stripeEvent.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(stripeEvent.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(stripeEvent.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(stripeEvent.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(stripeEvent.data.object);
          break;
        
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(stripeEvent.data.object);
          break;

        default:
          console.log(`Unhandled Stripe event type: ${stripeEvent.type}`);
      }

      return { received: true };
    } catch (error) {
      throw new Error(`Webhook handling failed: ${error.message}`);
    }
  }

  /**
   * Handle successful subscription creation
   */
  async handleSubscriptionCreated(subscription) {
    const userId = subscription.metadata.user_id;
    
    await this.supabase
      .from('subscriptions')
      .update({
        status: this.mapStripeStatus(subscription.status),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    // Send welcome email
    await this.sendSubscriptionWelcomeEmail(userId);
  }

  /**
   * Handle subscription updates
   */
  async handleSubscriptionUpdated(subscription) {
    const userId = subscription.metadata.user_id;
    const newStatus = this.mapStripeStatus(subscription.status);
    
    await this.supabase
      .from('subscriptions')
      .update({
        status: newStatus,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end
      })
      .eq('stripe_subscription_id', subscription.id);

    // Update user status
    await this.supabase
      .from('users')
      .update({
        subscription_status: newStatus,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', userId);
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    const subscriptionId = invoice.subscription;
    
    // Get subscription details
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.user_id;

    // Record payment
    const paymentData = {
      subscription_id: await this.getSubscriptionRecordId(subscriptionId),
      stripe_payment_intent_id: invoice.payment_intent,
      amount: invoice.amount_paid / 100, // Convert cents to dollars
      currency: invoice.currency,
      status: 'completed',
      description: `Payment for ${subscription.metadata.plan_id}`,
      invoice_url: invoice.hosted_invoice_url,
      processed_at: new Date().toISOString()
    };

    await this.supabase
      .from('payments')
      .insert(paymentData);

    // Send payment confirmation email
    await this.sendPaymentConfirmationEmail(userId, paymentData);
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    const subscriptionId = invoice.subscription;
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.user_id;

    // Record failed payment
    const paymentData = {
      subscription_id: await this.getSubscriptionRecordId(subscriptionId),
      stripe_payment_intent_id: invoice.payment_intent,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      description: `Failed payment for ${subscription.metadata.plan_id}`,
      processed_at: new Date().toISOString()
    };

    await this.supabase
      .from('payments')
      .insert(paymentData);

    // Send payment failure notification
    await this.sendPaymentFailedEmail(userId, paymentData);
  }

  /**
   * RevenueCat integration for mobile payments
   */
  async syncRevenueCatSubscription(userId, revenueCatUserId) {
    try {
      // Get RevenueCat customer info
      const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${revenueCatUserId}`, {
        headers: {
          'Authorization': `Bearer ${this.revenueCatApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch RevenueCat data');
      }

      const customerInfo = await response.json();
      const activeEntitlements = customerInfo.subscriber.entitlements;

      // Process active subscriptions
      for (const [entitlementId, entitlement] of Object.entries(activeEntitlements)) {
        if (entitlement.expires_date && new Date(entitlement.expires_date) > new Date()) {
          await this.syncMobileSubscription(userId, entitlement, revenueCatUserId);
        }
      }

    } catch (error) {
      console.error('RevenueCat sync failed:', error);
      throw new Error(`RevenueCat sync failed: ${error.message}`);
    }
  }

  /**
   * Sync mobile subscription data
   */
  async syncMobileSubscription(userId, entitlement, revenueCatUserId) {
    const subscriptionData = {
      user_id: userId,
      plan_name: entitlement.product_identifier,
      status: 'premium', // or 'family' based on product
      revenuecat_user_id: revenueCatUserId,
      current_period_start: new Date(entitlement.purchase_date).toISOString(),
      current_period_end: new Date(entitlement.expires_date).toISOString()
    };

    // Upsert subscription record
    const { data, error } = await this.supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    // Update user subscription status
    await this.supabase
      .from('users')
      .update({
        subscription_status: subscriptionData.status,
        subscription_expires_at: subscriptionData.current_period_end
      })
      .eq('id', userId);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, immediate = false) {
    try {
      // Get subscription record
      const { data: subscriptionData } = await this.supabase
        .from('subscriptions')
        .select('stripe_subscription_id, revenuecat_user_id')
        .eq('user_id', userId)
        .single();

      if (!subscriptionData) {
        throw new Error('No active subscription found');
      }

      if (subscriptionData.stripe_subscription_id) {
        // Cancel Stripe subscription
        if (immediate) {
          await this.stripe.subscriptions.del(subscriptionData.stripe_subscription_id);
        } else {
          await this.stripe.subscriptions.update(subscriptionData.stripe_subscription_id, {
            cancel_at_period_end: true
          });
        }
      }

      // Update database
      await this.supabase
        .from('subscriptions')
        .update({
          status: immediate ? 'cancelled' : 'premium',
          cancel_at_period_end: !immediate,
          canceled_at: immediate ? new Date().toISOString() : null
        })
        .eq('user_id', userId);

      if (immediate) {
        await this.supabase
          .from('users')
          .update({ subscription_status: 'cancelled' })
          .eq('id', userId);
      }

      return { success: true, immediate };
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Get subscription usage and limits
   */
  async getSubscriptionUsage(userId) {
    const { data: userData } = await this.supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    const { data: petCount } = await this.supabase
      .from('pets')
      .select('id', { count: 'exact' })
      .eq('families.family_members.user_id', userId);

    const { data: familyMemberCount } = await this.supabase
      .from('family_members')
      .select('id', { count: 'exact' })
      .eq('families.owner_id', userId);

    const limits = this.getSubscriptionLimits(userData.subscription_status);

    return {
      subscription_status: userData.subscription_status,
      pets: {
        current: petCount || 0,
        limit: limits.pets
      },
      family_members: {
        current: familyMemberCount || 0,
        limit: limits.family_members
      },
      features: limits.features
    };
  }

  /**
   * Get subscription limits based on tier
   */
  getSubscriptionLimits(subscriptionStatus) {
    const limits = {
      free: {
        pets: 2,
        family_members: 1,
        features: ['basic_profiles', 'basic_health_tracking']
      },
      premium: {
        pets: -1, // unlimited
        family_members: 6,
        features: ['unlimited_pets', 'advanced_health_tracking', 'priority_support']
      },
      family: {
        pets: -1, // unlimited
        family_members: -1, // unlimited
        features: ['unlimited_pets', 'unlimited_family_members', 'advanced_health_tracking', 'priority_support', 'family_sharing']
      }
    };

    return limits[subscriptionStatus] || limits.free;
  }

  /**
   * Utility methods
   */
  mapStripeStatus(stripeStatus) {
    const statusMap = {
      'active': 'premium',
      'trialing': 'premium',
      'past_due': 'premium',
      'canceled': 'cancelled',
      'unpaid': 'cancelled',
      'incomplete': 'free',
      'incomplete_expired': 'free'
    };

    return statusMap[stripeStatus] || 'free';
  }

  async getSubscriptionRecordId(stripeSubscriptionId) {
    const { data } = await this.supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single();
    
    return data?.id;
  }

  // Email notification methods (to be implemented with email service)
  async sendSubscriptionWelcomeEmail(userId) {
    // Implementation depends on email service integration
    console.log('Sending welcome email to user:', userId);
  }

  async sendPaymentConfirmationEmail(userId, paymentData) {
    console.log('Sending payment confirmation to user:', userId, paymentData);
  }

  async sendPaymentFailedEmail(userId, paymentData) {
    console.log('Sending payment failure notification to user:', userId, paymentData);
  }

  async handleTrialWillEnd(subscription) {
    const userId = subscription.metadata.user_id;
    console.log('Trial ending soon for user:', userId);
  }
}

module.exports = { PaymentProcessor };