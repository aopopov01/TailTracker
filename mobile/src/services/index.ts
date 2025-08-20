// iOS-specific services for TailTracker
// These services provide native iOS integrations and features

export { AppleMapsService, type Coordinates, type MapLocation, type AppleMapsOptions } from './AppleMapsService';
export { iOSNotificationService, type iOSNotificationOptions, type NotificationAction, type NotificationCategory } from './iOSNotificationService';
export { AppStoreBillingService, type SubscriptionProduct, type PurchaseResult, type RestoreResult } from './AppStoreBillingService';
export { iOSBiometricsService, type BiometricAuthResult, type KeychainOptions } from './iOSBiometricsService';

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
//    - Manages subscription purchases through RevenueCat
//    - Handles premium feature access
//    - Supports restore purchases and intro offers
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