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
export { MigrationService } from './migrationService';

// Database & Offline Services
export { databaseService, DatabaseService } from './databaseService';
export { offlineDataLayer, OfflineDataLayer } from './OfflineDataLayer';
export { offlineManager, OfflineManager } from './OfflineManager';
export { offlineSyncEngine, OfflineSyncEngine } from './OfflineSyncEngine';
export { priorityLostPetService, PriorityLostPetService } from './PriorityLostPetService';

// Pet Management
export { petService } from './PetService';
export { healthRecordsService } from './HealthRecordsService';
export { lostPetService } from './LostPetService';

// Family Features
export { familyAccessService } from './FamilyAccessService';
export { familyCoordinationService } from './FamilyCoordinationService';
export { SharingService } from './sharingService';

// Notifications
export { notificationService } from './NotificationService';
export { NotificationPermissionManager } from './NotificationPermissionManager';
export { healthNotificationService } from './HealthNotificationService';

// Payment Services (for Premium/Pro tiers)
export { googlePlayBillingService } from './GooglePlayBillingService';
export { AppStoreBillingService } from './AppStoreBillingService';

// Export types from core services
export type { Pet } from '../types/Pet';
export type { User } from '../types/User';