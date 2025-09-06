/**
 * TailTracker Services Index
 * 
 * Central export point for core services aligned with tier features
 */

// Core Services
export { ApiClient } from './ApiClient';
export { authService } from './authService';
export { cryptoService } from './cryptoService';
export { sessionService } from './sessionService';
export { modalService } from './modalService';
export { migrationService } from './migrationService';

// Pet Management
export { PetService } from './PetService';
export { HealthRecordsService } from './HealthRecordsService';
export { LostPetService } from './LostPetService';

// Family Features
export { FamilyAccessService } from './FamilyAccessService';
export { FamilyCoordinationService } from './FamilyCoordinationService';
export { sharingService } from './sharingService';

// Notifications
export { NotificationService } from './NotificationService';
export { NotificationPermissionManager } from './NotificationPermissionManager';
export { HealthNotificationService } from './HealthNotificationService';

// Payment Services (for Premium/Pro tiers)
export { GooglePlayBillingService } from './GooglePlayBillingService';
export { AppStoreBillingService } from './AppStoreBillingService';

// Export types from core services
export type { Pet, PetProfile, HealthRecord } from '../types';
export type { User, Family, FamilyMember } from '../types';