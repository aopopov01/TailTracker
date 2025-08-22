# TailTracker Supabase Backend

A complete, production-ready backend infrastructure for TailTracker using Supabase. This backend provides a scalable, secure foundation for a pet management application with premium features, real-time capabilities, and comprehensive payment integration.

## 🏗️ Architecture Overview

The TailTracker backend is built on Supabase and includes:

- **Database**: PostgreSQL with complete schema, RLS policies, and optimized indexes
- **Authentication**: Email/password, social login (Google, Apple), and phone verification
- **Storage**: Secure file storage with automatic resizing and bucket policies
- **Edge Functions**: 8 serverless functions for API endpoints
- **Real-time**: Live updates for lost pets, notifications, and family updates
- **Payments**: Stripe integration with webhook handling
- **Monitoring**: Comprehensive logging, metrics, and health checks

## 📋 Features

### Core Features
- 👥 **Multi-tenant Architecture**: Family-based pet sharing with role-based access
- 🏷️ **Row Level Security**: Secure data isolation between families
- 📱 **Real-time Updates**: Live notifications and status updates
- 💳 **Payment Processing**: Stripe integration with subscription management
- 📊 **Analytics**: Usage tracking and performance monitoring
- 🔒 **GDPR Compliance**: Data export, deletion, and audit logs

### Premium Features
- 🆓 **Free Tier**: 1 pet, 1 photo, basic features
- 💎 **Premium Tier**: €7.99/month - unlimited pets, lost pet alerts, vaccination reminders

### API Endpoints
- `pets/` - Pet CRUD operations with premium limits
- `vaccinations/` - Vaccination tracking and reminders
- `lost-pets/` - Lost pet reports with geolocation
- `stripe-webhook/` - Payment webhook processing
- `user-profile/` - User management and subscription info
- `file-upload/` - Secure file uploads with validation
- `auth-helpers/` - Authentication utilities
- `notification-scheduler/` - Scheduled notification processing

## 🚀 Quick Start

### Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Node.js 18+ and npm
- A Supabase project (staging and production)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd TailTracker/backend/supabase
npm install
```

### 2. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env.staging
cp .env.example .env.production

# Edit with your actual values
nano .env.staging
nano .env.production
```

### 3. Deploy to Staging
```bash
# Set your project IDs
export SUPABASE_STAGING_PROJECT_ID="your-staging-project-id"
export SUPABASE_PRODUCTION_PROJECT_ID="your-production-project-id"

# Deploy to staging
./deploy.sh staging
```

### 4. Deploy to Production
```bash
./deploy.sh production
```

## 📁 Project Structure

```
backend/supabase/
├── config.toml              # Supabase configuration
├── migrations/               # Database migrations
│   ├── 000_migration_management.sql
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   ├── 003_storage_setup.sql
│   ├── 004_auth_setup.sql
│   └── 005_realtime_setup.sql
├── functions/               # Edge Functions
│   ├── _shared/
│   │   └── cors.ts
│   ├── pets/
│   ├── vaccinations/
│   ├── lost-pets/
│   ├── stripe-webhook/
│   ├── user-profile/
│   ├── file-upload/
│   ├── auth-helpers/
│   └── notification-scheduler/
├── monitoring/              # Monitoring and alerting
│   ├── setup-monitoring.sh
│   ├── dashboards/
│   ├── alerts/
│   └── scripts/
├── deploy.sh               # Deployment script
├── health-check.sh         # Health check script
├── migration-tool.sh       # Migration management
├── docker-compose.yml      # Local development
└── package.json           # NPM scripts
```

## 🗄️ Database Schema

### Core Tables
- `users` - User profiles and subscription status
- `families` - Family groups for sharing pets
- `family_members` - Junction table with roles
- `pets` - Pet profiles and information
- `vaccinations` - Vaccination records and reminders
- `lost_pets` - Lost pet reports with geolocation
- `notifications` - System notifications

### Payment Tables
- `subscriptions` - Stripe subscription management
- `payments` - Payment history and records
- `stripe_webhook_events` - Webhook event tracking
- `feature_usage` - Premium feature usage tracking

### System Tables
- `files` - File storage metadata
- `audit_logs` - GDPR compliance logging
- `migration_history` - Database version control

## 🔐 Security

### Row Level Security (RLS)
All tables have comprehensive RLS policies ensuring:
- Users can only see their own data
- Family members can access shared pets
- Premium features require active subscriptions
- Lost pets are publicly visible for safety

### Authentication
- JWT-based authentication via Supabase Auth
- Social login with Google and Apple
- Phone verification for lost pet alerts
- Password complexity requirements
- Account lockout after failed attempts

### Data Protection
- All sensitive data encrypted at rest
- HTTPS/TLS for all communications
- Input validation and sanitization
- SQL injection prevention
- File upload restrictions and scanning

## 💳 Payment Integration

### Stripe Configuration
The backend includes complete Stripe integration:

```javascript
// Subscription plans
SUBSCRIPTION_PLANS = {
  premium_monthly: {
    amount: 799, // €7.99
    currency: 'eur',
    interval: 'month',
    features: ['unlimited_pets', 'lost_pet_alerts', 'vaccination_reminders']
  }
}
```

### Webhook Events
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 📱 Real-time Features

### Live Updates
- Lost pet alerts broadcast to nearby users
- Family member updates
- Vaccination reminders
- Payment status changes
- Pet status updates

### Channel Subscriptions
```javascript
// Example: Subscribe to lost pet alerts
supabase
  .channel('lost_pet_alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'lost_pets'
  }, handleLostPetAlert)
  .subscribe()
```

## 🔧 Management Scripts

### Migration Tool
```bash
# Create new migration
./migration-tool.sh create add_user_preferences

# Run migrations
./migration-tool.sh migrate --environment staging

# Check status
./migration-tool.sh status

# Rollback
./migration-tool.sh rollback 003
```

### Deployment
```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production

# Health check
./health-check.sh production
```

### Monitoring
```bash
# Setup monitoring
./monitoring/setup-monitoring.sh

# View logs
npm run logs

# Database backup
npm run backup:production
```

## 📊 Monitoring & Observability

### Health Checks
- API endpoint availability
- Database connectivity
- Storage bucket access
- Edge Function responses
- Payment processing status

### Metrics Tracked
- API response times
- Error rates
- Database connection pools
- Storage usage
- Payment success rates
- User engagement

### Alerting
- High error rates
- Slow response times
- Payment failures
- Storage quota warnings
- Database connection issues

## 🧪 Testing

### Local Development
```bash
# Start local Supabase
npm run dev

# Run tests
npm test

# Validate schema
npm run validate
```

### Environment Testing
```bash
# Test staging deployment
npm run deploy:staging
./health-check.sh staging

# Test production deployment
npm run deploy:production
./health-check.sh production
```

## 📈 Scaling Considerations

### Database
- Optimized indexes for common queries
- Connection pooling enabled
- Read replicas for analytics
- Automated backups

### Edge Functions
- Stateless design for horizontal scaling
- Efficient error handling
- Rate limiting implemented
- Caching strategies

### Storage
- CDN integration for public files
- Automatic image optimization
- Bucket-level access controls
- Lifecycle policies for cleanup

## 🔧 Configuration

### Environment Variables
Key configuration options:

```bash
# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Stripe
STRIPE_SECRET_KEY="sk_live_your_key"
STRIPE_WEBHOOK_SECRET="whsec_your_secret"

# Features
ENABLE_PREMIUM_FEATURES="true"
ENABLE_LOST_PET_ALERTS="true"
ENABLE_VACCINATION_REMINDERS="true"
```

### Feature Flags
Toggle features via environment variables:
- `ENABLE_PREMIUM_FEATURES`
- `ENABLE_LOST_PET_ALERTS`
- `ENABLE_VACCINATION_REMINDERS`
- `ENABLE_FAMILY_SHARING`
- `ENABLE_ANALYTICS`

## 🆘 Troubleshooting

### Common Issues

**Migration Failures**
```bash
# Check migration status
./migration-tool.sh status

# Validate schema
./migration-tool.sh validate

# Check logs
npm run logs
```

**Authentication Issues**
```bash
# Check auth configuration
./health-check.sh staging

# Verify JWT secrets
# Check Supabase dashboard auth settings
```

**Payment Webhook Issues**
```bash
# Check webhook events
# View Stripe dashboard
# Check function logs: npm run logs
```

### Support
- 📧 Backend issues: backend@tailtracker.app
- 💳 Payment issues: payments@tailtracker.app
- 🔒 Security issues: security@tailtracker.app

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests and validations
4. Submit a pull request

---

**TailTracker Backend** - A production-ready pet management platform built with Supabase. 🐾