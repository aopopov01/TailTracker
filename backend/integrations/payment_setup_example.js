/**
 * TailTracker Payment Processing Setup Example
 * 
 * This file demonstrates how to initialize and use the PaymentProcessor
 * with the provided Stripe sandbox credentials.
 */

const { PaymentProcessor } = require('./payment_processing');

/**
 * Environment Configuration for TailTracker
 * 
 * For production, these should be set as environment variables:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET  
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - PAYMENT_CURRENCY
 */
const TAILTRACKER_CONFIG = {
  // Stripe Sandbox Credentials (provided)
  stripeSecretKey: 'STRIPE_SECRET_KEY_HERE',
  stripePublishableKey: 'STRIPE_PUBLISHABLE_KEY_HERE',
  
  // Supabase Configuration (replace with your actual values)
  supabaseUrl: process.env.SUPABASE_URL || 'your-supabase-url',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-key',
  
  // Webhook Secret (generate this in Stripe Dashboard)
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  
  // Payment Configuration
  currency: 'eur',
  environment: 'sandbox'
};

/**
 * Initialize Payment Processor
 */
function initializePaymentProcessor() {
  try {
    const paymentProcessor = new PaymentProcessor(
      TAILTRACKER_CONFIG.stripeSecretKey,
      TAILTRACKER_CONFIG.supabaseUrl,
      TAILTRACKER_CONFIG.supabaseServiceRoleKey,
      {
        webhookSecret: TAILTRACKER_CONFIG.webhookSecret,
        currency: TAILTRACKER_CONFIG.currency,
        environment: TAILTRACKER_CONFIG.environment
      }
    );

    console.log('✅ Payment processor initialized successfully');
    return paymentProcessor;
  } catch (error) {
    console.error('❌ Failed to initialize payment processor:', error.message);
    throw error;
  }
}

/**
 * Setup Stripe Products and Prices
 * This should be run once during initial setup
 */
async function setupStripeProducts() {
  try {
    const processor = initializePaymentProcessor();
    
    console.log('🏗️  Setting up Stripe products...');
    const result = await processor.setupStripeProducts();
    
    console.log('✅ Stripe products setup completed:');
    console.log(`   Product ID: ${result.product.id}`);
    console.log(`   Price ID: ${result.price.id}`);
    console.log(`   Amount: €${result.price.unit_amount / 100}/month`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to setup Stripe products:', error.message);
    throw error;
  }
}

/**
 * Example: Create a Customer and Subscription
 */
async function createCustomerAndSubscription(userData, paymentMethodId) {
  try {
    const processor = initializePaymentProcessor();
    
    // Step 1: Create customer
    console.log('👤 Creating customer...');
    const customerResult = await processor.createCustomer({
      userId: userData.userId,
      email: userData.email,
      name: userData.name,
      metadata: {
        source: 'tailtracker_app',
        signup_date: new Date().toISOString()
      }
    });
    
    console.log(`✅ Customer created: ${customerResult.customer.id}`);
    
    // Step 2: Create subscription
    console.log('💳 Creating subscription...');
    const subscriptionResult = await processor.createSubscription({
      userId: userData.userId,
      customerId: customerResult.customer.id,
      priceId: PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.priceId,
      paymentMethodId: paymentMethodId,
      metadata: {
        plan: 'premium_monthly',
        created_via: 'api'
      }
    });
    
    console.log(`✅ Subscription created: ${subscriptionResult.subscription.id}`);
    
    return {
      customer: customerResult.customer,
      subscription: subscriptionResult.subscription,
      clientSecret: subscriptionResult.clientSecret
    };
  } catch (error) {
    console.error('❌ Failed to create customer and subscription:', error.message);
    throw error;
  }
}

/**
 * Example: Handle a Webhook
 */
async function handleWebhookExample(req, res) {
  try {
    const processor = initializePaymentProcessor();
    
    const payload = req.body;
    const signature = req.headers['stripe-signature'];
    
    console.log('🎣 Processing webhook...');
    const result = await processor.handleWebhook(payload, signature);
    
    console.log(`✅ Webhook processed: ${result.eventType}`);
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing failed:', error.message);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Example: Check Premium Access
 */
async function checkUserPremiumAccess(userId) {
  try {
    const processor = initializePaymentProcessor();
    
    const accessResult = await processor.checkPremiumAccess(userId);
    
    console.log(`🔍 Premium access check for user ${userId}:`);
    console.log(`   Has Premium: ${accessResult.hasPremium}`);
    console.log(`   Status: ${accessResult.subscriptionStatus}`);
    console.log(`   Expires: ${accessResult.expiresAt}`);
    
    return accessResult;
  } catch (error) {
    console.error('❌ Failed to check premium access:', error.message);
    throw error;
  }
}

/**
 * Example: Validate Subscription Limits
 */
async function validateResourceAccess(userId, resource, requestedCount = 1) {
  try {
    const processor = initializePaymentProcessor();
    
    const validation = await processor.validateSubscriptionLimits(userId, resource, requestedCount);
    
    console.log(`📊 Resource validation for ${resource}:`);
    console.log(`   Allowed: ${validation.allowed}`);
    console.log(`   Current Usage: ${validation.currentUsage}`);
    console.log(`   Limit: ${validation.limit}`);
    console.log(`   Message: ${validation.message}`);
    
    return validation;
  } catch (error) {
    console.error('❌ Failed to validate resource access:', error.message);
    throw error;
  }
}

/**
 * Example: Create Trial Subscription
 */
async function createTrialSubscription(userData) {
  try {
    const processor = initializePaymentProcessor();
    
    // First create customer
    const customerResult = await processor.createCustomer({
      userId: userData.userId,
      email: userData.email,
      name: userData.name
    });
    
    // Create trial subscription
    console.log('🎁 Creating trial subscription...');
    const trialResult = await processor.createTrialSubscription({
      userId: userData.userId,
      customerId: customerResult.customer.id,
      trialDays: 7
    });
    
    console.log(`✅ Trial subscription created for ${trialResult.trialDays} days`);
    console.log(`   Trial ends: ${trialResult.trialEndsAt}`);
    
    return trialResult;
  } catch (error) {
    console.error('❌ Failed to create trial subscription:', error.message);
    throw error;
  }
}

/**
 * Example: Health Check
 */
async function performHealthCheck() {
  try {
    const processor = initializePaymentProcessor();
    
    console.log('🏥 Performing health check...');
    const health = await processor.healthCheck();
    
    console.log(`Health Status: ${health.status}`);
    console.log(`Environment: ${health.environment}`);
    console.log(`Stripe Connected: ${health.stripeConnected}`);
    console.log(`Supabase Connected: ${health.supabaseConnected}`);
    
    return health;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
}

/**
 * Express.js Route Examples
 */
const expressRouteExamples = {
  // Create subscription endpoint
  async createSubscription(req, res) {
    try {
      const { userId, email, name, paymentMethodId } = req.body;
      
      const result = await createCustomerAndSubscription(
        { userId, email, name },
        paymentMethodId
      );
      
      res.status(200).json({
        success: true,
        customer: result.customer,
        subscription: result.subscription,
        clientSecret: result.clientSecret
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Webhook endpoint
  async webhook(req, res) {
    await handleWebhookExample(req, res);
  },

  // Check premium access endpoint
  async checkPremium(req, res) {
    try {
      const { userId } = req.params;
      const access = await checkUserPremiumAccess(userId);
      
      res.status(200).json({
        success: true,
        ...access
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Validate resource endpoint
  async validateResource(req, res) {
    try {
      const { userId, resource, count = 1 } = req.query;
      const validation = await validateResourceAccess(userId, resource, parseInt(count));
      
      res.status(200).json({
        success: true,
        ...validation
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Health check endpoint
  async health(req, res) {
    try {
      const health = await performHealthCheck();
      
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Required Environment Variables
 */
const REQUIRED_ENV_VARS = {
  production: [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  optional: [
    'PAYMENT_CURRENCY', // defaults to 'eur'
    'NODE_ENV' // defaults to 'development'
  ]
};

/**
 * Setup Instructions
 */
const SETUP_INSTRUCTIONS = `
🚀 TailTracker Payment Processing Setup Instructions

1. Install Dependencies:
   npm install stripe @supabase/supabase-js

2. Environment Variables (create .env file):
   STRIPE_SECRET_KEY=STRIPE_SECRET_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PAYMENT_CURRENCY=eur
   NODE_ENV=development

3. Database Setup:
   - Ensure you have the payment tables from schema_with_payments.sql
   - Run any pending migrations

4. Stripe Setup:
   - Create webhook endpoint in Stripe Dashboard
   - Configure webhook to point to your server's /webhooks/stripe endpoint
   - Add webhook secret to environment variables

5. Initialize Products:
   const processor = PaymentProcessor.createWithConfig();
   await processor.setupStripeProducts();

6. Test Integration:
   await performHealthCheck();

💡 For production:
   - Replace test keys with live Stripe keys
   - Set NODE_ENV=production
   - Configure proper webhook URL
   - Enable proper logging and monitoring
`;

module.exports = {
  initializePaymentProcessor,
  setupStripeProducts,
  createCustomerAndSubscription,
  handleWebhookExample,
  checkUserPremiumAccess,
  validateResourceAccess,
  createTrialSubscription,
  performHealthCheck,
  expressRouteExamples,
  TAILTRACKER_CONFIG,
  REQUIRED_ENV_VARS,
  SETUP_INSTRUCTIONS
};

// If running this file directly, perform setup
if (require.main === module) {
  console.log(SETUP_INSTRUCTIONS);
  
  // Uncomment to run setup
  // setupStripeProducts().catch(console.error);
}