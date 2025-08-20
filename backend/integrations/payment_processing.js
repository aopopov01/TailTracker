/**
 * TailTracker Payment Processing Integration
 * Stripe-based payment processing with subscription management
 * 
 * Features:
 * - Customer creation and management
 * - Subscription lifecycle management (create, update, cancel)
 * - Webhook handling for payment events
 * - Payment method management
 * - Secure API key handling
 * - Comprehensive error handling and logging
 * 
 * Monetization Model:
 * - Free tier: 1 pet, 1 photo, basic features
 * - Premium tier: €7.99/month - unlimited pets, lost pet alerts, vaccination reminders
 */

const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

class PaymentProcessor {
  constructor(stripeSecretKey, supabaseUrl, supabaseKey, options = {}) {
    // Initialize Stripe with secret key
    this.stripe = stripe(stripeSecretKey);
    
    // Initialize Supabase client
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Configuration
    this.isEnabled = true;
    this.webhookSecret = options.webhookSecret;
    this.currency = options.currency || 'eur';
    this.environment = options.environment || 'sandbox';
    
    console.log(`Stripe payment processing initialized (${this.environment} mode)`);
  }

  /**
   * Subscription plans configuration
   */
  static SUBSCRIPTION_PLANS = {
    premium_monthly: {
      priceId: 'price_premium_monthly_799', // Will be created in Stripe
      amount: 799, // €7.99 in cents
      currency: 'eur',
      interval: 'month',
      name: 'Premium Monthly',
      description: 'Unlimited pets, lost pet alerts, vaccination reminders',
      features: [
        'unlimited_pets',
        'unlimited_photos',
        'lost_pet_alerts',
        'vaccination_reminders',
        'medication_tracking',
        'advanced_health_tracking',
        'family_sharing_unlimited',
        'priority_support'
      ],
      limits: {
        pets: -1, // unlimited
        photos_per_pet: -1, // unlimited
        family_members: 10,
        vaccination_reminders: true,
        lost_pet_alerts: true,
        advanced_health_tracking: true
      }
    },
    free: {
      amount: 0,
      currency: 'eur',
      name: 'Free',
      description: 'Basic pet management features',
      features: [
        'basic_profiles',
        'basic_vaccination_tracking'
      ],
      limits: {
        pets: 1,
        photos_per_pet: 1,
        family_members: 1,
        vaccination_reminders: false,
        lost_pet_alerts: false,
        advanced_health_tracking: false
      }
    }
  };

  /**
   * Customer Management
   */
  
  /**
   * Create a new Stripe customer
   * @param {Object} userData - User data for customer creation
   * @param {string} userData.userId - Internal user ID
   * @param {string} userData.email - Customer email
   * @param {string} userData.name - Customer name
   * @param {Object} userData.metadata - Additional metadata
   * @returns {Promise<Object>} Created customer object
   */
  async createCustomer(userData) {
    try {
      if (!this.isEnabled) {
        throw new Error('Payment processing is disabled');
      }

      const { userId, email, name, metadata = {} } = userData;

      // Check if customer already exists in our database
      const { data: existingSubscription } = await this.supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (existingSubscription?.stripe_customer_id) {
        // Return existing customer
        const customer = await this.stripe.customers.retrieve(existingSubscription.stripe_customer_id);
        return {
          success: true,
          customer,
          isNew: false
        };
      }

      // Create new Stripe customer
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          environment: this.environment,
          ...metadata
        }
      });

      console.log(`Created Stripe customer: ${customer.id} for user: ${userId}`);

      return {
        success: true,
        customer,
        isNew: true
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Update customer information
   * @param {string} customerId - Stripe customer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated customer object
   */
  async updateCustomer(customerId, updateData) {
    try {
      const customer = await this.stripe.customers.update(customerId, updateData);
      
      console.log(`Updated Stripe customer: ${customerId}`);
      
      return {
        success: true,
        customer
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * Retrieve customer information
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Customer object
   */
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      return {
        success: true,
        customer
      };
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw new Error(`Failed to retrieve customer: ${error.message}`);
    }
  }

  /**
   * Delete customer (GDPR compliance)
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCustomer(customerId) {
    try {
      const deleted = await this.stripe.customers.del(customerId);
      
      console.log(`Deleted Stripe customer: ${customerId}`);
      
      return {
        success: true,
        deleted
      };
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Get subscription limits based on plan
   * @param {string} subscriptionStatus - Current subscription status
   * @returns {Object} Subscription limits and features
   */
  getSubscriptionLimits(subscriptionStatus = 'free') {
    const plan = PaymentProcessor.SUBSCRIPTION_PLANS[subscriptionStatus === 'premium' ? 'premium_monthly' : 'free'];
    
    return {
      ...plan.limits,
      features: plan.features,
      planName: plan.name,
      planDescription: plan.description
    };
  }

  /**
   * Subscription Management
   */

  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @param {string} subscriptionData.userId - Internal user ID
   * @param {string} subscriptionData.customerId - Stripe customer ID
   * @param {string} subscriptionData.priceId - Stripe price ID
   * @param {string} subscriptionData.paymentMethodId - Payment method ID
   * @param {Object} subscriptionData.metadata - Additional metadata
   * @returns {Promise<Object>} Created subscription object
   */
  async createSubscription(subscriptionData) {
    try {
      if (!this.isEnabled) {
        throw new Error('Payment processing is disabled');
      }

      const { userId, customerId, priceId, paymentMethodId, metadata = {} } = subscriptionData;

      // Attach payment method to customer
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        // Set as default payment method
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          environment: this.environment,
          ...metadata
        }
      });

      // Store subscription in database
      await this.supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: 'premium_monthly',
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId
        });

      // Update user subscription status
      await this.supabase
        .from('users')
        .update({
          subscription_status: subscription.status === 'active' ? 'premium' : subscription.status,
          subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', userId);

      console.log(`Created subscription: ${subscription.id} for user: ${userId}`);\n\n      return {\n        success: true,\n        subscription,\n        clientSecret: subscription.latest_invoice.payment_intent?.client_secret\n      };\n    } catch (error) {\n      console.error('Error creating subscription:', error);\n      throw new Error(`Failed to create subscription: ${error.message}`);\n    }\n  }\n\n  /**\n   * Update subscription\n   * @param {string} subscriptionId - Stripe subscription ID\n   * @param {Object} updateData - Data to update\n   * @returns {Promise<Object>} Updated subscription object\n   */\n  async updateSubscription(subscriptionId, updateData) {\n    try {\n      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData);\n      \n      // Update in database\n      await this.supabase\n        .from('subscriptions')\n        .update({\n          status: subscription.status,\n          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),\n          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),\n          cancel_at_period_end: subscription.cancel_at_period_end\n        })\n        .eq('stripe_subscription_id', subscriptionId);\n\n      console.log(`Updated subscription: ${subscriptionId}`);\n      \n      return {\n        success: true,\n        subscription\n      };\n    } catch (error) {\n      console.error('Error updating subscription:', error);\n      throw new Error(`Failed to update subscription: ${error.message}`);\n    }\n  }\n\n  /**\n   * Cancel subscription\n   * @param {string} userId - Internal user ID\n   * @param {boolean} immediately - Cancel immediately or at period end\n   * @returns {Promise<Object>} Cancellation result\n   */\n  async cancelSubscription(userId, immediately = false) {\n    try {\n      // Get subscription from database\n      const { data: subscriptionData, error } = await this.supabase\n        .from('subscriptions')\n        .select('stripe_subscription_id, stripe_customer_id')\n        .eq('user_id', userId)\n        .eq('status', 'active')\n        .single();\n\n      if (error || !subscriptionData) {\n        throw new Error('No active subscription found');\n      }\n\n      let subscription;\n      \n      if (immediately) {\n        // Cancel immediately\n        subscription = await this.stripe.subscriptions.cancel(subscriptionData.stripe_subscription_id);\n      } else {\n        // Cancel at period end\n        subscription = await this.stripe.subscriptions.update(subscriptionData.stripe_subscription_id, {\n          cancel_at_period_end: true\n        });\n      }\n\n      // Update database\n      await this.supabase\n        .from('subscriptions')\n        .update({\n          status: subscription.status,\n          cancel_at_period_end: subscription.cancel_at_period_end,\n          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null\n        })\n        .eq('stripe_subscription_id', subscriptionData.stripe_subscription_id);\n\n      // Update user status if canceled immediately\n      if (immediately) {\n        await this.supabase\n          .from('users')\n          .update({\n            subscription_status: 'cancelled'\n          })\n          .eq('id', userId);\n      }\n\n      console.log(`Cancelled subscription: ${subscriptionData.stripe_subscription_id} for user: ${userId}`);\n      \n      return {\n        success: true,\n        subscription,\n        cancelledImmediately: immediately\n      };\n    } catch (error) {\n      console.error('Error cancelling subscription:', error);\n      throw new Error(`Failed to cancel subscription: ${error.message}`);\n    }\n  }\n\n  /**\n   * Reactivate cancelled subscription\n   * @param {string} userId - Internal user ID\n   * @returns {Promise<Object>} Reactivation result\n   */\n  async reactivateSubscription(userId) {\n    try {\n      const { data: subscriptionData, error } = await this.supabase\n        .from('subscriptions')\n        .select('stripe_subscription_id')\n        .eq('user_id', userId)\n        .single();\n\n      if (error || !subscriptionData) {\n        throw new Error('No subscription found');\n      }\n\n      const subscription = await this.stripe.subscriptions.update(subscriptionData.stripe_subscription_id, {\n        cancel_at_period_end: false\n      });\n\n      // Update database\n      await this.supabase\n        .from('subscriptions')\n        .update({\n          cancel_at_period_end: false,\n          canceled_at: null\n        })\n        .eq('stripe_subscription_id', subscriptionData.stripe_subscription_id);\n\n      console.log(`Reactivated subscription: ${subscriptionData.stripe_subscription_id} for user: ${userId}`);\n      \n      return {\n        success: true,\n        subscription\n      };\n    } catch (error) {\n      console.error('Error reactivating subscription:', error);\n      throw new Error(`Failed to reactivate subscription: ${error.message}`);\n    }\n  }\n\n  /**\n   * Check if user can access premium features\n   */\n  async checkPremiumAccess(userId) {\n    try {\n      const { data: userData, error } = await this.supabase\n        .from('users')\n        .select(`\n          subscription_status,\n          subscription_expires_at,\n          trial_ends_at\n        `)\n        .eq('id', userId)\n        .single();\n\n      if (error || !userData) {\n        return {\n          hasPremium: false,\n          subscriptionStatus: 'free',\n          message: 'User not found'\n        };\n      }\n\n      const now = new Date();\n      const expiresAt = userData.subscription_expires_at ? new Date(userData.subscription_expires_at) : null;\n      const trialEndsAt = userData.trial_ends_at ? new Date(userData.trial_ends_at) : null;\n\n      const hasPremium = userData.subscription_status === 'premium' && \n                        (expiresAt > now || (trialEndsAt && trialEndsAt > now));\n\n      return {\n        hasPremium,\n        subscriptionStatus: userData.subscription_status,\n        expiresAt: userData.subscription_expires_at,\n        trialEndsAt: userData.trial_ends_at,\n        message: hasPremium ? 'Premium access active' : 'Premium access required'\n      };\n    } catch (error) {\n      console.error('Error checking premium access:', error);\n      return {\n        hasPremium: false,\n        subscriptionStatus: 'free',\n        message: 'Error checking subscription status'\n      };\n    }\n  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(userId) {
    try {
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select(`
          subscription_status,
          subscription_expires_at,
          trial_ends_at
        `)
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return {
          status: 'free',
          plan: 'free',
          expiresAt: null,
          features: this.getSubscriptionLimits('free').features
        };
      }

      const { data: subscriptionData } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        status: userData.subscription_status,
        plan: subscriptionData?.plan_name || 'free',
        expiresAt: userData.subscription_expires_at,
        trialEndsAt: userData.trial_ends_at,
        features: this.getSubscriptionLimits(userData.subscription_status).features,
        subscription: subscriptionData
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        status: 'free',
        plan: 'free',
        expiresAt: null,
        features: this.getSubscriptionLimits('free').features
      };
    }
  }

  /**
   * Payment Method Management
   */

  /**
   * Create a setup intent for payment method collection
   * @param {string} customerId - Stripe customer ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Setup intent object
   */
  async createSetupIntent(customerId, options = {}) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        ...options
      });

      return {
        success: true,
        setupIntent,
        clientSecret: setupIntent.client_secret
      };
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }

  /**
   * List customer payment methods
   * @param {string} customerId - Stripe customer ID
   * @param {string} type - Payment method type (default: 'card')
   * @returns {Promise<Object>} List of payment methods
   */
  async listPaymentMethods(customerId, type = 'card') {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data
      };
    } catch (error) {
      console.error('Error listing payment methods:', error);
      throw new Error(`Failed to list payment methods: ${error.message}`);
    }
  }

  /**
   * Delete a payment method
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Deletion result
   */
  async deletePaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

      return {
        success: true,
        paymentMethod
      };
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }
  }

  /**
   * Set default payment method
   * @param {string} customerId - Stripe customer ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Update result
   */
  async setDefaultPaymentMethod(customerId, paymentMethodId) {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      return {
        success: true,
        customer
      };
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error(`Failed to set default payment method: ${error.message}`);
    }
  }

  /**
   * Webhook Management
   */

  /**
   * Handle Stripe webhooks
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Stripe signature header
   * @returns {Promise<Object>} Webhook handling result
   */
  async handleWebhook(payload, signature) {
    try {
      if (!this.webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);

      console.log(`Processing webhook: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object);
          break;
        
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object);
          break;
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      return {
        success: true,
        eventType: event.type,
        processed: true
      };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Handle subscription created webhook
   */
  async handleSubscriptionCreated(subscription) {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        console.warn('No userId in subscription metadata');
        return;
      }

      // Update or insert subscription record
      await this.supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_name: 'premium_monthly',
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        });

      // Update user subscription status
      await this.supabase
        .from('users')
        .update({
          subscription_status: subscription.status === 'active' ? 'premium' : subscription.status,
          subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        })
        .eq('id', userId);

      console.log(`Subscription created for user: ${userId}`);
    } catch (error) {
      console.error('Error handling subscription created:', error);
    }
  }

  /**
   * Handle subscription updated webhook
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        console.warn('No userId in subscription metadata');
        return;
      }

      // Update subscription record
      await this.supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
        })
        .eq('stripe_subscription_id', subscription.id);

      // Update user subscription status
      let userStatus = subscription.status;
      if (subscription.status === 'active') userStatus = 'premium';
      if (subscription.status === 'canceled') userStatus = 'cancelled';

      await this.supabase
        .from('users')
        .update({
          subscription_status: userStatus,
          subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', userId);

      console.log(`Subscription updated for user: ${userId}, status: ${subscription.status}`);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  /**
   * Handle subscription deleted webhook
   */
  async handleSubscriptionDeleted(subscription) {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        console.warn('No userId in subscription metadata');
        return;
      }

      // Update subscription record
      await this.supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      // Update user to free tier
      await this.supabase
        .from('users')
        .update({
          subscription_status: 'free',
          subscription_expires_at: null
        })
        .eq('id', userId);

      console.log(`Subscription deleted for user: ${userId}`);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }

  /**
   * Handle payment succeeded webhook
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const subscriptionId = invoice.subscription;
      if (!subscriptionId) return;

      // Record payment
      await this.supabase
        .from('payments')
        .insert({
          subscription_id: subscriptionId,
          stripe_payment_intent_id: invoice.payment_intent,
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency,
          status: 'completed',
          description: invoice.description || `Payment for ${invoice.period_start} - ${invoice.period_end}`,
          invoice_url: invoice.hosted_invoice_url,
          processed_at: new Date().toISOString()
        });

      console.log(`Payment succeeded for subscription: ${subscriptionId}`);
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  /**
   * Handle payment failed webhook
   */
  async handlePaymentFailed(invoice) {
    try {
      const subscriptionId = invoice.subscription;
      if (!subscriptionId) return;

      // Record failed payment
      await this.supabase
        .from('payments')
        .insert({
          subscription_id: subscriptionId,
          stripe_payment_intent_id: invoice.payment_intent,
          amount: invoice.amount_due / 100, // Convert from cents
          currency: invoice.currency,
          status: 'failed',
          description: `Failed payment for ${invoice.period_start} - ${invoice.period_end}`,
          processed_at: new Date().toISOString()
        });

      // Optionally send notification to user about failed payment
      console.log(`Payment failed for subscription: ${subscriptionId}`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  /**
   * Handle trial will end webhook
   */
  async handleTrialWillEnd(subscription) {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) return;

      // Send notification to user about trial ending
      await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'trial_ending',
          title: 'Your trial is ending soon',
          message: 'Your premium trial ends in 3 days. Upgrade now to continue enjoying premium features.',
          scheduled_for: new Date().toISOString()
        });

      console.log(`Trial ending notification sent for user: ${userId}`);
    } catch (error) {
      console.error('Error handling trial will end:', error);
    }
  }

  /**
   * Handle payment method attached webhook
   */
  async handlePaymentMethodAttached(paymentMethod) {
    try {
      console.log(`Payment method attached: ${paymentMethod.id} to customer: ${paymentMethod.customer}`);
    } catch (error) {
      console.error('Error handling payment method attached:', error);
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Create or verify Stripe products and prices
   * This should be run during application setup
   */
  async setupStripeProducts() {
    try {
      console.log('Setting up Stripe products and prices...');

      // Create Premium Monthly Product
      let product = await this.findOrCreateProduct({
        name: 'TailTracker Premium',
        description: 'Unlimited pets, lost pet alerts, vaccination reminders and more',
        metadata: {
          plan: 'premium',
          features: JSON.stringify(PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.features)
        }
      });

      // Create Premium Monthly Price
      let price = await this.findOrCreatePrice(product.id, {
        unit_amount: PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.amount,
        currency: PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.currency,
        recurring: {
          interval: PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.interval
        },
        metadata: {
          plan: 'premium_monthly'
        }
      });

      // Update the price ID in our configuration
      PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.priceId = price.id;

      console.log(`Stripe products setup complete:
        Product ID: ${product.id}
        Price ID: ${price.id}
        Amount: €${PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.amount / 100}
      `);

      return {
        success: true,
        product,
        price
      };
    } catch (error) {
      console.error('Error setting up Stripe products:', error);
      throw new Error(`Failed to setup Stripe products: ${error.message}`);
    }
  }

  /**
   * Find existing product or create new one
   */
  async findOrCreateProduct(productData) {
    try {
      // Try to find existing product
      const products = await this.stripe.products.list({
        limit: 100
      });

      const existingProduct = products.data.find(p => 
        p.name === productData.name && p.active
      );

      if (existingProduct) {
        console.log(`Found existing product: ${existingProduct.id}`);
        return existingProduct;
      }

      // Create new product
      const product = await this.stripe.products.create(productData);
      console.log(`Created new product: ${product.id}`);
      
      return product;
    } catch (error) {
      console.error('Error finding/creating product:', error);
      throw error;
    }
  }

  /**
   * Find existing price or create new one
   */
  async findOrCreatePrice(productId, priceData) {
    try {
      // Try to find existing price
      const prices = await this.stripe.prices.list({
        product: productId,
        limit: 100
      });

      const existingPrice = prices.data.find(p => 
        p.unit_amount === priceData.unit_amount &&
        p.currency === priceData.currency &&
        p.recurring?.interval === priceData.recurring?.interval &&
        p.active
      );

      if (existingPrice) {
        console.log(`Found existing price: ${existingPrice.id}`);
        return existingPrice;
      }

      // Create new price
      const price = await this.stripe.prices.create({
        product: productId,
        ...priceData
      });
      
      console.log(`Created new price: ${price.id}`);
      
      return price;
    } catch (error) {
      console.error('Error finding/creating price:', error);
      throw error;
    }
  }

  /**
   * Get billing portal URL for customer management
   * @param {string} customerId - Stripe customer ID
   * @param {string} returnUrl - URL to return to after managing billing
   * @returns {Promise<Object>} Portal session object
   */
  async createBillingPortalSession(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });

      return {
        success: true,
        url: session.url
      };
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw new Error(`Failed to create billing portal session: ${error.message}`);
    }
  }

  /**
   * Validate subscription limits
   * @param {string} userId - User ID
   * @param {string} resource - Resource type (pets, photos, etc.)
   * @param {number} requestedCount - Requested resource count
   * @returns {Promise<Object>} Validation result
   */
  async validateSubscriptionLimits(userId, resource, requestedCount = 1) {
    try {
      const premiumAccess = await this.checkPremiumAccess(userId);
      const limits = this.getSubscriptionLimits(premiumAccess.subscriptionStatus);

      const resourceLimit = limits[resource];
      
      if (resourceLimit === -1) {
        // Unlimited
        return {
          allowed: true,
          unlimited: true,
          message: `Unlimited ${resource} allowed`
        };
      }

      // Check current usage (this would need to be implemented based on your data structure)
      const currentUsage = await this.getCurrentUsage(userId, resource);
      const totalAfterRequest = currentUsage + requestedCount;

      const allowed = totalAfterRequest <= resourceLimit;

      return {
        allowed,
        currentUsage,
        limit: resourceLimit,
        requestedCount,
        totalAfterRequest,
        message: allowed 
          ? `Request allowed (${totalAfterRequest}/${resourceLimit})` 
          : `Limit exceeded. ${totalAfterRequest} would exceed limit of ${resourceLimit}`
      };
    } catch (error) {
      console.error('Error validating subscription limits:', error);
      return {
        allowed: false,
        error: error.message
      };
    }
  }

  /**
   * Get current resource usage for user
   * @param {string} userId - User ID
   * @param {string} resource - Resource type
   * @returns {Promise<number>} Current usage count
   */
  async getCurrentUsage(userId, resource) {
    try {
      switch (resource) {
        case 'pets':
          const { count: petCount } = await this.supabase
            .from('pets')
            .select('id', { count: 'exact' })
            .eq('created_by', userId)
            .is('deleted_at', null);
          return petCount || 0;

        case 'family_members':
          const { count: memberCount } = await this.supabase
            .from('family_members')
            .select('id', { count: 'exact' })
            .eq('user_id', userId);
          return memberCount || 0;

        // Add more resource types as needed
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error getting current usage for ${resource}:`, error);
      return 0;
    }
  }

  /**
   * Create a trial subscription
   * @param {Object} trialData - Trial subscription data
   * @param {string} trialData.userId - User ID
   * @param {string} trialData.customerId - Stripe customer ID
   * @param {number} trialData.trialDays - Trial period in days (default: 7)
   * @returns {Promise<Object>} Trial subscription result
   */
  async createTrialSubscription(trialData) {
    try {
      const { userId, customerId, trialDays = 7 } = trialData;

      const trialEnd = Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60);

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.priceId }],
        trial_end: trialEnd,
        metadata: {
          userId,
          environment: this.environment,
          trial: 'true'
        }
      });

      // Update database
      await this.supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: 'premium_monthly',
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_start: new Date(subscription.trial_start * 1000).toISOString(),
          trial_end: new Date(subscription.trial_end * 1000).toISOString(),
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId
        });

      // Update user
      await this.supabase
        .from('users')
        .update({
          subscription_status: 'premium',
          trial_ends_at: new Date(subscription.trial_end * 1000).toISOString(),
          subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', userId);

      console.log(`Trial subscription created for user: ${userId}, ${trialDays} days`);

      return {
        success: true,
        subscription,
        trialEndsAt: new Date(subscription.trial_end * 1000),
        trialDays
      };
    } catch (error) {
      console.error('Error creating trial subscription:', error);
      throw new Error(`Failed to create trial subscription: ${error.message}`);
    }
  }

  /**
   * Static factory method to create PaymentProcessor with environment config
   * @param {Object} config - Configuration object
   * @returns {PaymentProcessor} Configured payment processor instance
   */
  static createWithConfig(config = {}) {
    const {
      stripeSecretKey = process.env.STRIPE_SECRET_KEY,
      supabaseUrl = process.env.SUPABASE_URL,
      supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
      webhookSecret = process.env.STRIPE_WEBHOOK_SECRET,
      currency = process.env.PAYMENT_CURRENCY || 'eur',
      environment = process.env.NODE_ENV || 'development'
    } = config;

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }

    return new PaymentProcessor(stripeSecretKey, supabaseUrl, supabaseKey, {
      webhookSecret,
      currency,
      environment
    });
  }

  /**
   * Health check for payment processor
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Test Stripe connection
      await this.stripe.accounts.retrieve();
      
      // Test Supabase connection
      const { error } = await this.supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
        throw new Error(`Supabase connection failed: ${error.message}`);
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: this.environment,
        currency: this.currency,
        stripeConnected: true,
        supabaseConnected: true
      };
    } catch (error) {
      console.error('Payment processor health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        environment: this.environment
      };
    }
  }
}

// Export configuration for easy setup
PaymentProcessor.SANDBOX_CONFIG = {
  stripePublishableKey: 'STRIPE_PUBLISHABLE_KEY_HERE',
  stripeSecretKey: 'STRIPE_SECRET_KEY_HERE',
  environment: 'sandbox',
  currency: 'eur'
};

module.exports = { PaymentProcessor };