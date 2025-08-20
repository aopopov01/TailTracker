// TailTracker Services - Cross-platform and iOS-specific integrations
// These services provide native integrations and payment features

export { AppleMapsService, type Coordinates, type MapLocation, type AppleMapsOptions } from './AppleMapsService';
export { iOSNotificationService, type iOSNotificationOptions, type NotificationAction, type NotificationCategory } from './iOSNotificationService';
export { AppStoreBillingService, type SubscriptionProduct, type PurchaseResult, type RestoreResult } from './AppStoreBillingService';
export { iOSBiometricsService, type BiometricAuthResult, type KeychainOptions } from './iOSBiometricsService';
export { StripePaymentService, type SubscriptionPlan, type PaymentMethodInfo, type SubscriptionStatus, type PurchaseResult as StripePurchaseResult, type PaymentError } from './StripePaymentService';
export { PaymentInitializationService, type PaymentInitializationResult } from './PaymentInitializationService';

// Service Usage Guidelines:
//
// 1. AppleMapsService:
//    - Use for opening locations in Apple Maps
//    - Supports directions, search, and multiple pins
//    - Integrates with TailTracker's lost pet features
//
// 2. iOSNotificationService:
//    - Handles iOS-specific notifications
//    - Supports critical alerts and time-sensitive notifications
//    - Custom categories for pet alerts and reminders
//
// 3. AppStoreBillingService:
//    - Manages cross-platform subscription purchases
//    - iOS: RevenueCat + Stripe backend integration
//    - Android: Direct Stripe integration
//    - Handles premium feature access and restore purchases
//
// 5. StripePaymentService:
//    - Primary payment processing service using Stripe
//    - Handles subscriptions, payment methods, and billing
//    - Supports Apple Pay, Google Pay, and card payments
//    - Premium feature access control and validation
//
// 6. PaymentInitializationService:
//    - Manages initialization of all payment services
//    - Handles app startup payment service configuration
//    - Provides health checks and error recovery
//    - Manages user authentication updates across services
//
// 4. iOSBiometricsService:
//    - Face ID and Touch ID authentication
//    - Secure keychain storage
//    - Biometric-protected sensitive data
//
// Platform Compatibility:
// All services include platform checks and graceful fallbacks
// iOS-specific features are only available on iOS devices
// Services log warnings when used on unsupported platforms

// Service Initialization:
// Services use singleton pattern for consistent state
// Initialize services in App.tsx during app startup
// Handle permission requests early in app lifecycle