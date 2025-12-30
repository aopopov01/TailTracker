/**
 * TailTracker Services Index
 *
 * Central export point for core services aligned with tier features
 */

// Core Services
export { ApiClient } from './ApiClient';
export { AuthService } from './authService';
export { CryptoService } from './cryptoService';
export { SessionService } from './sessionService';
export { modalService } from './modalService';

// Database & Offline Services
export { databaseService, DatabaseService } from './databaseService';
export { offlineManager, OfflineManager } from './OfflineManager';

// Pet Management
export { petService } from './PetService';
// export { healthRecordsService } from './HealthRecordsService'; // NOTE: File doesn't exist, only .bak
export { default as lostPetService } from './LostPetService'; // NOTE: LostPetService exports default
export { PetPersonalityService } from './PetPersonalityService';

// Family Features
export { default as familyAccessService } from './FamilyAccessService'; // NOTE: FamilyAccessService exports default
export { familyCoordinationService } from './FamilyCoordinationService';
export { SharingService } from './sharingService';

// Notifications
export { notificationService } from './NotificationService';
export { NotificationPermissionManager } from './NotificationPermissionManager';

// Payment Services (Stripe)
export { subscriptionService } from './subscriptionService';

// Export types from core services
export type { Pet } from '../types/Pet';
export type { User } from '../types/User';
