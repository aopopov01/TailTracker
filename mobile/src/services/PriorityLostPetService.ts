import { EventEmitter } from 'events';
import * as Location from 'expo-location';
import { OfflineStorageService } from './OfflineStorageService';
import { OfflineSyncEngine } from './OfflineSyncEngine';

export interface LostPetReport {
  id: string;
  petId: string;
  reporterId: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  description: string;
  contactInfo: {
    phone: string;
    email?: string;
    alternateContact?: string;
  };
  photos: string[];
  lastSeenTime: number;
  circumstances: string;
  reward?: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'INVESTIGATING' | 'SIGHTING_REPORTED' | 'FOUND' | 'CLOSED';
  alertRadius: number; // km
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
}

export interface LostPetSighting {
  id: string;
  lostPetReportId: string;
  reporterId: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  description: string;
  photos?: string[];
  reliability: 'LOW' | 'MEDIUM' | 'HIGH';
  verified: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isVet: boolean;
  isEmergencyVet: boolean;
  available24h: boolean;
  notes?: string;
}

export interface LostPetAlert {
  id: string;
  lostPetReportId: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  lastNotified: number;
  isActive: boolean;
}

export interface PriorityConfig {
  immediateUploadEnabled: boolean;
  backgroundLocationEnabled: boolean;
  highFrequencySync: boolean;
  emergencyContactsSync: boolean;
  localAlertCaching: boolean;
  compressionForUrgentUploads: boolean;
  batteryOptimizedMode: boolean;
}

export class PriorityLostPetService extends EventEmitter {
  private storage: OfflineStorageService;
  private syncEngine: OfflineSyncEngine;
  private config: PriorityConfig;
  private isMonitoringLocation = false;
  private locationWatchId?: Location.LocationSubscription;
  private syncIntervalId?: NodeJS.Timeout;
  private emergencyContacts: EmergencyContact[] = [];

  constructor(
    storage: OfflineStorageService,
    syncEngine: OfflineSyncEngine,
    config: PriorityConfig
  ) {
    super();
    this.storage = storage;
    this.syncEngine = syncEngine;
    this.config = config;

    this.initializeEmergencyContacts();
    this.setupPrioritySync();
  }

  private async initializeEmergencyContacts(): Promise<void> {
    try {
      // Load emergency contacts from secure storage
      this.emergencyContacts = await this.loadEmergencyContacts();
      this.emit('emergencyContactsLoaded', this.emergencyContacts);
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
    }
  }

  private setupPrioritySync(): void {
    if (this.config.highFrequencySync) {
      // Sync every 30 seconds for lost pet data
      this.syncIntervalId = setInterval(async () => {
        try {
          await this.syncEngine.forceSyncTable('lost_pet_reports');
        } catch (error) {
          console.warn('Priority sync failed:', error);
        }
      }, 30000);
    }

    // Listen for sync events
    this.syncEngine.on('syncCompleted', () => {
      this.emit('prioritySyncCompleted');
    });
  }

  // Create Lost Pet Report with Priority Processing
  async createLostPetReport(
    petId: string, 
    reportData: Omit<LostPetReport, 'id' | 'timestamp' | 'priority' | 'syncStatus'>
  ): Promise<string> {
    try {
      // Get current location if not provided
      let location = reportData.location;
      if (!location || (location.latitude === 0 && location.longitude === 0)) {
        location = await this.getCurrentLocation();
      }

      // Enhance report with priority data
      const fullReport: LostPetReport = {
        ...reportData,
        id: this.generateId(),
        timestamp: Date.now(),
        location,
        priority: this.calculatePriority(reportData.urgencyLevel, reportData.lastSeenTime),
        syncStatus: 'PENDING'
      };

      // Save to offline storage with priority
      await this.saveLostPetReportOffline(fullReport);

      // Immediate sync attempt if possible
      if (this.config.immediateUploadEnabled) {
        this.attemptImmediateSync(fullReport);
      }

      // Start location monitoring for updates
      if (this.config.backgroundLocationEnabled) {
        await this.startLocationMonitoring();
      }

      // Send local notifications to nearby users (if cached)
      await this.broadcastLocalAlert(fullReport);

      // Notify emergency contacts
      await this.notifyEmergencyContacts(fullReport);

      this.emit('lostPetReportCreated', fullReport);

      return fullReport.id;
    } catch (error) {
      console.error('Failed to create lost pet report:', error);
      throw new Error('Failed to create lost pet report');
    }
  }

  // Update Lost Pet Report Status
  async updateLostPetReportStatus(
    reportId: string, 
    status: LostPetReport['status'], 
    notes?: string
  ): Promise<void> {
    try {
      const report = await this.getLostPetReport(reportId);
      if (!report) {
        throw new Error('Lost pet report not found');
      }

      const updatedReport = {
        ...report,
        status,
        notes,
        timestamp: Date.now()
      };

      await this.saveLostPetReportOffline(updatedReport);

      // Priority sync for status changes
      if (this.config.immediateUploadEnabled) {
        this.attemptImmediateSync(updatedReport);
      }

      // Stop location monitoring if found
      if (status === 'FOUND' || status === 'CLOSED') {
        await this.stopLocationMonitoring();
        await this.notifySuccessToEmergencyContacts(updatedReport);
      }

      this.emit('lostPetReportUpdated', updatedReport);
    } catch (error) {
      console.error('Failed to update lost pet report:', error);
      throw error;
    }
  }

  // Report Sighting
  async reportSighting(
    lostPetReportId: string,
    sightingData: Omit<LostPetSighting, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      const sighting: LostPetSighting = {
        ...sightingData,
        id: this.generateId(),
        timestamp: Date.now()
      };

      // Save sighting offline
      await this.saveSightingOffline(sighting);

      // Immediate sync for sightings (high priority)
      if (this.config.immediateUploadEnabled) {
        await this.syncEngine.forceSyncTable('lost_pet_sightings');
      }

      // Notify the pet owner and emergency contacts
      await this.notifySightingToOwner(lostPetReportId, sighting);

      this.emit('sightingReported', sighting);

      return sighting.id;
    } catch (error) {
      console.error('Failed to report sighting:', error);
      throw error;
    }
  }

  // Get Lost Pet Report
  async getLostPetReport(id: string): Promise<LostPetReport | null> {
    try {
      // Check offline storage first
      const report = await this.storage.getPet(`lost_pet_report_${id}`);
      return report ? JSON.parse(report.data) : null;
    } catch (error) {
      console.error('Failed to get lost pet report:', error);
      return null;
    }
  }

  // Get Nearby Lost Pet Alerts
  async getNearbyLostPetAlerts(
    userLocation: { latitude: number; longitude: number },
    radiusKm: number = 10
  ): Promise<LostPetReport[]> {
    try {
      // Get all active reports from offline storage
      const allReports = await this.getAllActiveLostPetReports();

      // Filter by distance
      const nearbyReports = allReports.filter(report => {
        const distance = this.calculateDistance(
          userLocation,
          report.location
        );
        return distance <= radiusKm;
      });

      // Sort by urgency and distance
      nearbyReports.sort((a, b) => {
        const urgencyOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
          return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        }
        
        // If same urgency, sort by distance
        const distanceA = this.calculateDistance(userLocation, a.location);
        const distanceB = this.calculateDistance(userLocation, b.location);
        return distanceA - distanceB;
      });

      return nearbyReports;
    } catch (error) {
      console.error('Failed to get nearby alerts:', error);
      return [];
    }
  }

  // Emergency Contacts Management
  async addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<string> {
    const fullContact: EmergencyContact = {
      ...contact,
      id: this.generateId()
    };

    this.emergencyContacts.push(fullContact);
    await this.saveEmergencyContacts();

    if (this.config.emergencyContactsSync) {
      await this.syncEngine.forceSyncTable('emergency_contacts');
    }

    this.emit('emergencyContactAdded', fullContact);
    return fullContact.id;
  }

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    return [...this.emergencyContacts];
  }

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<void> {
    const index = this.emergencyContacts.findIndex(contact => contact.id === id);
    if (index === -1) {
      throw new Error('Emergency contact not found');
    }

    this.emergencyContacts[index] = { ...this.emergencyContacts[index], ...updates };
    await this.saveEmergencyContacts();

    if (this.config.emergencyContactsSync) {
      await this.syncEngine.forceSyncTable('emergency_contacts');
    }

    this.emit('emergencyContactUpdated', this.emergencyContacts[index]);
  }

  // Location Services
  private async getCurrentLocation(): Promise<LostPetReport['location']> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000
      });

      // Reverse geocode for address
      let address: string | undefined;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
        }
      } catch (error) {
        console.warn('Failed to reverse geocode location:', error);
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        address
      };
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw new Error('Could not get current location');
    }
  }

  private async startLocationMonitoring(): Promise<void> {
    if (this.isMonitoringLocation) return;

    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Background location permission not granted');
        return;
      }

      this.locationWatchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 100, // 100 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isMonitoringLocation = true;
      this.emit('locationMonitoringStarted');
    } catch (error) {
      console.error('Failed to start location monitoring:', error);
    }
  }

  private async stopLocationMonitoring(): Promise<void> {
    if (this.locationWatchId) {
      this.locationWatchId.remove();
      this.locationWatchId = undefined;
    }

    this.isMonitoringLocation = false;
    this.emit('locationMonitoringStopped');
  }

  private handleLocationUpdate(location: Location.LocationObject): void {
    this.emit('locationUpdate', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp
    });
  }

  // Priority and Utility Methods
  private calculatePriority(
    urgencyLevel: LostPetReport['urgencyLevel'],
    lastSeenTime: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const timeSinceLastSeen = Date.now() - lastSeenTime;
    const hoursAgo = timeSinceLastSeen / (1000 * 60 * 60);

    // Critical if recent and high urgency
    if (urgencyLevel === 'CRITICAL' || (urgencyLevel === 'HIGH' && hoursAgo < 6)) {
      return 'CRITICAL';
    }

    // High priority for medium/high urgency within 24 hours
    if ((urgencyLevel === 'HIGH' || urgencyLevel === 'MEDIUM') && hoursAgo < 24) {
      return 'HIGH';
    }

    // Medium priority for recent reports
    if (hoursAgo < 72) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Offline Storage Methods
  private async saveLostPetReportOffline(report: LostPetReport): Promise<void> {
    await this.storage.savePet({
      id: `lost_pet_report_${report.id}`,
      data: JSON.stringify(report),
      type: 'lost_pet_report'
    });

    // Add to sync queue with priority
    await this.storage.addToSyncQueue(
      'lost_pet_reports',
      'CREATE',
      report,
      report.priority
    );
  }

  private async saveSightingOffline(sighting: LostPetSighting): Promise<void> {
    await this.storage.savePet({
      id: `sighting_${sighting.id}`,
      data: JSON.stringify(sighting),
      type: 'sighting'
    });

    await this.storage.addToSyncQueue(
      'lost_pet_sightings',
      'CREATE',
      sighting,
      'HIGH' // Sightings are always high priority
    );
  }

  private async getAllActiveLostPetReports(): Promise<LostPetReport[]> {
    // This would need to be implemented in the storage service
    // For now, return empty array
    return [];
  }

  private async loadEmergencyContacts(): Promise<EmergencyContact[]> {
    // Load from secure storage or database
    // Implementation would depend on storage system
    return [];
  }

  private async saveEmergencyContacts(): Promise<void> {
    try {
      // Save to secure storage or database
      // Implementation would depend on storage system
    } catch (error) {
      console.error('Failed to save emergency contacts:', error);
    }
  }

  // Sync and Communication Methods
  private async attemptImmediateSync(report: LostPetReport): Promise<void> {
    try {
      await this.syncEngine.forceSyncTable('lost_pet_reports');
      this.emit('immediateSyncAttempted', report);
    } catch (error) {
      console.warn('Immediate sync failed, will retry later:', error);
    }
  }

  private async broadcastLocalAlert(report: LostPetReport): Promise<void> {
    if (!this.config.localAlertCaching) return;

    try {
      // This would send local notifications to nearby cached users
      // Implementation would depend on local notification system
      this.emit('localAlertBroadcasted', report);
    } catch (error) {
      console.warn('Failed to broadcast local alert:', error);
    }
  }

  private async notifyEmergencyContacts(report: LostPetReport): Promise<void> {
    try {
      const notifications = this.emergencyContacts.map(contact => {
        return {
          to: contact.phone,
          title: 'Lost Pet Alert',
          body: `${report.description} - Last seen at ${report.location.address || 'Unknown location'}`,
          data: { reportId: report.id, type: 'lost_pet_alert' }
        };
      });

      // Store notifications for offline sending
      for (const notification of notifications) {
        await this.storage.addToSyncQueue(
          'notifications',
          'CREATE',
          notification,
          'HIGH'
        );
      }

      this.emit('emergencyContactsNotified', notifications);
    } catch (error) {
      console.error('Failed to notify emergency contacts:', error);
    }
  }

  private async notifySightingToOwner(reportId: string, sighting: LostPetSighting): Promise<void> {
    try {
      const notification = {
        reportId,
        sightingId: sighting.id,
        title: 'Possible Pet Sighting',
        body: `Someone reported a possible sighting of your pet at ${sighting.location.address || 'a nearby location'}`,
        data: sighting
      };

      await this.storage.addToSyncQueue(
        'notifications',
        'CREATE',
        notification,
        'CRITICAL'
      );

      this.emit('sightingNotificationSent', notification);
    } catch (error) {
      console.error('Failed to notify owner of sighting:', error);
    }
  }

  private async notifySuccessToEmergencyContacts(report: LostPetReport): Promise<void> {
    try {
      const notifications = this.emergencyContacts.map(contact => {
        return {
          to: contact.phone,
          title: 'Great News - Pet Found!',
          body: `The lost pet has been ${report.status === 'FOUND' ? 'found' : 'located'}!`,
          data: { reportId: report.id, type: 'pet_found' }
        };
      });

      for (const notification of notifications) {
        await this.storage.addToSyncQueue(
          'notifications',
          'CREATE',
          notification,
          'HIGH'
        );
      }

      this.emit('successNotificationsSent', notifications);
    } catch (error) {
      console.error('Failed to send success notifications:', error);
    }
  }

  // Utility
  private generateId(): string {
    return `lost_pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    if (this.locationWatchId) {
      this.locationWatchId.remove();
    }

    this.removeAllListeners();
  }
}