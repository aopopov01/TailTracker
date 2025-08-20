# TailTracker Database - Stripe Payment Integration

This directory contains the database schema and migration scripts for TailTracker's Stripe payment integration.

## 📁 Files Overview

- **`schema.sql`** - Complete database schema with Stripe payment integration
- **`rls_policies.sql`** - Row Level Security policies for multi-tenant data isolation
- **`migration_free_to_payments.sql`** - Migration script from free-tier to payment-enabled schema
- **`rollback_payments_to_free.sql`** - Rollback script to revert to free-tier only
- **`schema_with_payments.sql`** - Legacy backup schema (reference only)
- **`optimization.sql`** - Additional performance optimizations (if exists)

## 🚀 Quick Start

### For New Installations
```sql
-- Run the complete schema for new databases
\i schema.sql
\i rls_policies.sql
```

### For Existing Free-Tier Databases
```sql
-- Migrate existing free-tier database to support payments
\i migration_free_to_payments.sql
```

### To Rollback (⚠️ Destructive)
```sql
-- WARNING: This removes all payment data!
\i rollback_payments_to_free.sql
```

## 💳 Stripe Integration Features

### 🔐 Security & Compliance
- **Row Level Security (RLS)** enforced on all tables
- **GDPR compliance** with audit logging and data export/deletion
- **Webhook idempotency** prevents duplicate event processing
- **Encrypted customer data** through Stripe customer IDs

### 💰 Subscription Management
- **Premium Tier**: €7.99/month
  - Unlimited pets and photos
  - Lost pet alerts with GPS tracking
  - Vaccination reminders
  - Advanced medical record management
  
- **Family Tier**: €12.99/month (planned)
  - All premium features
  - Up to 6 family members
  - Shared pet management

- **Free Tier**: €0/month
  - 1 pet maximum
  - 1 photo per pet
  - Basic medical records
  - No lost pet alerts or reminders

### 📊 Payment Tracking
- **Payment Intents** tracked with Stripe payment intent IDs
- **Invoice Management** with automatic PDF generation
- **Failed Payment Handling** with automatic retry logic
- **Refund Processing** with partial and full refund support

### 🔔 Webhook Processing
- **Idempotent Event Processing** using Stripe event IDs
- **Automatic Retry Logic** for failed webhook processing
- **Status Tracking** for all webhook events
- **Error Logging** for debugging payment issues

## 🗄️ Database Schema Overview

### Core Tables
```
users (with Stripe customer integration)
├── families (premium member limits)
│   ├── family_members
│   └── pets (premium unlimited vs free 1-pet limit)
│       ├── vaccinations
│       ├── medications
│       ├── medical_records
│       └── files (premium unlimited vs free 1-photo limit)
├── lost_pets (premium feature only)
├── notifications (including payment notifications)
└── audit_logs (GDPR compliance)
```

### Payment Tables
```
subscriptions (Stripe subscription tracking)
├── payments (payment intent and invoice tracking)
├── stripe_webhook_events (webhook processing log)
└── feature_usage (usage analytics and limits)
```

### Key Indexes for Performance
```sql
-- User lookups
idx_users_stripe_customer_id
idx_users_subscription_status
idx_users_subscription_expires

-- Payment queries
idx_subscriptions_stripe_subscription_id
idx_payments_stripe_payment_intent_id
idx_payments_stripe_invoice_id

-- Webhook processing
idx_stripe_webhook_events_stripe_event_id
idx_stripe_webhook_events_event_type
```

## 🔧 Database Functions & Triggers

### Premium Feature Enforcement
- **`has_premium_access(user_auth_id)`** - Check if user has active premium subscription
- **`check_pet_limit()`** - Enforce pet limits based on subscription tier
- **`check_photo_limit()`** - Enforce photo limits based on subscription tier
- **`check_premium_features()`** - Block premium features for free users

### Subscription Management
- **`update_subscription_status()`** - Sync subscription status from Stripe webhooks
- **`track_feature_usage()`** - Log feature usage for analytics

### Utility Functions
- **`update_updated_at_column()`** - Automatic timestamp updates
- **`get_user_subscription_status()`** - Get current subscription status

## 🔐 Row Level Security (RLS) Policies

### Data Isolation
All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Family members can access shared family data
- Service role has full access for backend operations
- Webhook processing is restricted to service role

### Payment Data Security
- Subscription data is only visible to the owning user
- Payment history is restricted to subscription owners
- Webhook events are only accessible to service role
- Feature usage data is private to each user

## 🚨 Migration Considerations

### Before Migration
1. **Backup your database** - Migration is generally safe but backup first
2. **Test in staging** - Run migration on copy of production data
3. **Check dependencies** - Ensure all required PostgreSQL extensions are available
4. **Verify Stripe integration** - Make sure backend can process webhooks

### During Migration
- Migration adds new tables and columns to existing schema
- Existing data remains untouched
- All users start with 'free' subscription status
- Premium features are immediately enforced via triggers

### After Migration
1. **Verify RLS policies** - Test that data isolation works correctly
2. **Test webhook processing** - Send test webhooks from Stripe
3. **Validate subscription limits** - Try creating multiple pets as free user
4. **Monitor performance** - Check query performance with new indexes

## 📈 Performance Optimizations

### Database Level
- **Proper indexing** on all foreign keys and query paths
- **Partial indexes** for conditional lookups (e.g., non-null Stripe IDs)
- **GiST indexes** for geospatial lost pet queries
- **GIN indexes** for full-text search on pets and veterinarians

### Application Level
- **Connection pooling** recommended for high-traffic applications
- **Prepared statements** for frequently executed queries
- **Read replicas** for analytics and reporting queries
- **Batch processing** for webhook events during high volume

### Monitoring
- **pg_stat_statements** for query performance analysis
- **Connection monitoring** for pool utilization
- **Webhook processing metrics** for payment reliability
- **Feature usage analytics** for product insights

## 🐛 Troubleshooting

### Common Issues

#### Migration Fails
```sql
-- Check for missing extensions
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm', 'btree_gin');

-- Verify permissions
SELECT current_user, session_user;
```

#### RLS Blocking Queries
```sql
-- Temporarily disable RLS for debugging (use carefully!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Check current user context
SELECT auth.uid(), auth.role();
```

#### Webhook Processing Failures
```sql
-- Check webhook event status
SELECT event_type, status, processing_attempts, last_processing_error 
FROM stripe_webhook_events 
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Retry failed webhooks
UPDATE stripe_webhook_events 
SET status = 'pending', processing_attempts = 0 
WHERE id = 'failed-webhook-id';
```

#### Subscription Status Sync Issues
```sql
-- Check user subscription status
SELECT u.email, u.subscription_status, u.subscription_expires_at, s.status as stripe_status
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.stripe_customer_id = 'cus_stripe_customer_id';

-- Manually sync subscription status
SELECT update_subscription_status() FROM subscriptions WHERE stripe_subscription_id = 'sub_stripe_id';
```

## 📞 Support

For issues related to:
- **Database schema** - Check this README and migration scripts
- **Stripe integration** - Verify webhook configuration and event processing
- **Performance** - Review indexes and query execution plans
- **Data integrity** - Check RLS policies and constraint violations

## 🔄 Schema Versioning

Current schema version: **v2.0** (Stripe Integration)
- v1.0: Free-tier only schema
- v2.0: Added Stripe payment integration with premium features

Migration path: v1.0 → v2.0 via `migration_free_to_payments.sql`
Rollback path: v2.0 → v1.0 via `rollback_payments_to_free.sql`