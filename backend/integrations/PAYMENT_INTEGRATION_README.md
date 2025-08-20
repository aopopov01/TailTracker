# TailTracker Stripe Payment Integration

This document provides comprehensive documentation for the TailTracker Stripe payment integration, including setup, usage, and deployment instructions.

## Overview

The TailTracker payment system implements a freemium monetization model with Stripe for payment processing:

- **Free Tier**: 1 pet, 1 photo, basic features
- **Premium Tier**: €7.99/month - unlimited pets, lost pet alerts, vaccination reminders

## Features

✅ **Customer Management**
- Create, update, and delete Stripe customers
- GDPR-compliant customer data handling

✅ **Subscription Management**
- Create premium subscriptions (€7.99/month)
- Handle subscription updates and cancellations
- Support for trial subscriptions
- Automatic subscription status synchronization

✅ **Payment Processing**
- Secure payment method handling
- Support for cards via Stripe Elements
- Payment history tracking
- Failed payment handling

✅ **Webhook Integration**
- Real-time subscription status updates
- Payment success/failure notifications
- Trial expiration handling
- Automatic database synchronization

✅ **Subscription Limits**
- Automated feature limit enforcement
- Resource usage tracking (pets, photos, family members)
- Premium feature access control

✅ **Security & Compliance**
- Secure API key management
- Webhook signature verification
- GDPR compliance features
- Audit logging

## Installation

### 1. Install Dependencies

```bash
npm install stripe @supabase/supabase-js crypto
```

### 2. Database Setup

Ensure your Supabase database includes the payment-related tables from `schema_with_payments.sql`:

- `subscriptions` - Subscription records
- `payments` - Payment history
- `users` (updated) - Subscription status tracking

### 3. Environment Configuration

Create a `.env` file with the following variables:

```env
# Stripe Configuration (Sandbox)
STRIPE_SECRET_KEY=STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Payment Configuration
PAYMENT_CURRENCY=eur
NODE_ENV=development
```

## Quick Start

### 1. Initialize Payment Processor

```javascript
const { PaymentProcessor } = require('./payment_processing');

// Method 1: Using environment variables
const processor = PaymentProcessor.createWithConfig();

// Method 2: Manual configuration
const processor = new PaymentProcessor(
  process.env.STRIPE_SECRET_KEY,
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: 'eur',
    environment: 'sandbox'
  }
);
```

### 2. Setup Stripe Products

```javascript
// Run once during initial setup
await processor.setupStripeProducts();
```

### 3. Create Customer and Subscription

```javascript
// Create customer
const customer = await processor.createCustomer({
  userId: 'user-uuid',
  email: 'user@example.com',
  name: 'John Doe'
});

// Create subscription
const subscription = await processor.createSubscription({
  userId: 'user-uuid',
  customerId: customer.customer.id,
  priceId: PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.priceId,
  paymentMethodId: 'pm_card_token'
});
```

## API Reference

### PaymentProcessor Class

#### Constructor

```javascript
new PaymentProcessor(stripeSecretKey, supabaseUrl, supabaseKey, options)
```

**Parameters:**
- `stripeSecretKey` (string): Stripe secret API key
- `supabaseUrl` (string): Supabase project URL
- `supabaseKey` (string): Supabase service role key
- `options` (object): Configuration options
  - `webhookSecret` (string): Stripe webhook secret
  - `currency` (string): Default currency (default: 'eur')
  - `environment` (string): Environment ('sandbox', 'production')

#### Customer Management

```javascript
// Create customer
await processor.createCustomer(userData)

// Update customer
await processor.updateCustomer(customerId, updateData)

// Get customer
await processor.getCustomer(customerId)

// Delete customer (GDPR)
await processor.deleteCustomer(customerId)
```

#### Subscription Management

```javascript
// Create subscription
await processor.createSubscription(subscriptionData)

// Update subscription
await processor.updateSubscription(subscriptionId, updateData)

// Cancel subscription
await processor.cancelSubscription(userId, immediately = false)

// Reactivate subscription
await processor.reactivateSubscription(userId)

// Get subscription status
await processor.getSubscriptionStatus(userId)

// Check premium access
await processor.checkPremiumAccess(userId)
```

#### Payment Methods

```javascript
// Create setup intent
await processor.createSetupIntent(customerId)

// List payment methods
await processor.listPaymentMethods(customerId)

// Delete payment method
await processor.deletePaymentMethod(paymentMethodId)

// Set default payment method
await processor.setDefaultPaymentMethod(customerId, paymentMethodId)
```

#### Webhooks

```javascript
// Handle webhook
await processor.handleWebhook(payload, signature)
```

#### Utility Methods

```javascript
// Setup Stripe products
await processor.setupStripeProducts()

// Create billing portal session
await processor.createBillingPortalSession(customerId, returnUrl)

// Validate subscription limits
await processor.validateSubscriptionLimits(userId, resource, count)

// Create trial subscription
await processor.createTrialSubscription(trialData)

// Health check
await processor.healthCheck()
```

## Subscription Plans

### Free Tier
- **Cost**: Free
- **Limits**: 1 pet, 1 photo per pet, 1 family member
- **Features**: Basic profiles, basic vaccination tracking

### Premium Tier
- **Cost**: €7.99/month
- **Limits**: Unlimited pets, photos, 10 family members
- **Features**: All free features plus:
  - Lost pet alerts
  - Vaccination reminders
  - Medication tracking
  - Advanced health tracking
  - Priority support

## Webhook Events

The integration handles the following Stripe webhook events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`
- `payment_method.attached`

### Webhook Endpoint Setup

1. Configure webhook in Stripe Dashboard: `https://your-domain.com/webhooks/stripe`
2. Select the events listed above
3. Copy the webhook secret to your environment variables

## Express.js Integration Example

```javascript
const express = require('express');
const { PaymentProcessor } = require('./payment_processing');

const app = express();
const processor = PaymentProcessor.createWithConfig();

// Webhook endpoint (raw body required)
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    await processor.handleWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create subscription endpoint
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { userId, paymentMethodId } = req.body;
    
    // Get user data
    const user = await getUserData(userId);
    
    // Create customer
    const customer = await processor.createCustomer({
      userId,
      email: user.email,
      name: user.full_name
    });
    
    // Create subscription
    const subscription = await processor.createSubscription({
      userId,
      customerId: customer.customer.id,
      priceId: PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.priceId,
      paymentMethodId
    });
    
    res.json({
      success: true,
      clientSecret: subscription.clientSecret
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check premium access
app.get('/api/users/:userId/premium', async (req, res) => {
  try {
    const access = await processor.checkPremiumAccess(req.params.userId);
    res.json(access);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Frontend Integration

### React Example with Stripe Elements

```jsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('STRIPE_PUBLISHABLE_KEY_HERE');

function SubscriptionForm({ userId }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    // Create payment method
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      console.error(error);
      return;
    }

    // Create subscription
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        paymentMethodId: paymentMethod.id
      })
    });

    const { clientSecret } = await response.json();

    // Confirm payment
    const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);

    if (confirmError) {
      console.error(confirmError);
    } else {
      console.log('Subscription created successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Subscribe to Premium (€7.99/month)
      </button>
    </form>
  );
}

function App() {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionForm userId="user-uuid" />
    </Elements>
  );
}
```

## Error Handling

The payment processor includes comprehensive error handling:

```javascript
try {
  const result = await processor.createSubscription(data);
  console.log('Success:', result);
} catch (error) {
  console.error('Payment error:', error.message);
  
  // Handle specific error types
  if (error.message.includes('card_declined')) {
    // Handle declined card
  } else if (error.message.includes('insufficient_funds')) {
    // Handle insufficient funds
  }
}
```

## Testing

### Test Cards

Use Stripe test cards for development:

```
Success: 4242424242424242
Declined: 4000000000000002
Insufficient funds: 4000000000009995
```

### Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

## Production Deployment

### 1. Environment Variables

Replace test keys with live Stripe keys:

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
NODE_ENV=production
```

### 2. Webhook Configuration

- Update webhook URL to production domain
- Ensure HTTPS is configured
- Update webhook secret

### 3. Security Considerations

- Use environment variables for all sensitive data
- Implement rate limiting on payment endpoints
- Monitor for suspicious activity
- Regular security audits

### 4. Monitoring

- Set up Stripe Dashboard monitoring
- Implement application-level payment monitoring
- Configure alerts for failed payments
- Track subscription metrics

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Ensure webhook secret is correct
   - Check that raw body is passed to webhook handler

2. **Subscription not updating in database**
   - Verify webhook events are being processed
   - Check Supabase connection and permissions

3. **Payment method attachment fails**
   - Ensure customer exists before attaching payment methods
   - Verify payment method is not already attached

### Debug Mode

Enable detailed logging:

```javascript
const processor = new PaymentProcessor(secretKey, supabaseUrl, supabaseKey, {
  environment: 'development' // Enables detailed logging
});
```

## Support

For issues related to:
- **Stripe Integration**: Check Stripe Dashboard logs and documentation
- **Database Issues**: Verify Supabase connection and table structure
- **Webhook Problems**: Use Stripe CLI for local testing

## License

This payment integration is part of the TailTracker project and follows the same licensing terms.

---

**Security Note**: Never expose secret keys in client-side code. Always handle sensitive operations on the server side.