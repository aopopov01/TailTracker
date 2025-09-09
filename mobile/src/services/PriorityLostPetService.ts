/**
 * Priority Lost Pet Service for TailTracker
 * Handles lost pet reporting with priority queuing and emergency notifications
 */

import { databaseService, DatabasePet } from './databaseService';
import { offlineManager } from './OfflineManager';
import { ServiceHelpers, handleServiceError } from '../utils/serviceHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LostPetReport {
  id: string;
  petId: number;
  userId: number;
  reportedAt: string;
  lastSeenLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  lastSeenDateTime?: string;
  description: string;
  contactInfo: {
    phone?: string;
    email: string;
    alternateContact?: string;
  };
  reward?: number;
  photos?: string[];
  status: 'active' | 'found' | 'cancelled';
  priority: 'normal' | 'urgent' | 'emergency';
  searchRadius: number; // in kilometers
  alertsSent: number;
  createdAt: string;
  updatedAt: string;
}

export interface LostPetSearchCriteria {
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  species?: string;
  breed?: string;
  color?: string;
  reportedAfter?: string;
  status?: 'active' | 'found' | 'cancelled';
  priority?: 'normal' | 'urgent' | 'emergency';
}

export interface PriorityQueueItem {
  reportId: string;
  priority: number; // Higher number = higher priority
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  data: LostPetReport;
}

export class PriorityLostPetService {
  private static instance: PriorityLostPetService;
  private readonly STORAGE_KEYS = {
    LOST_PET_QUEUE: '@TailTracker:lostPetQueue',
    ACTIVE_REPORTS: '@TailTracker:activeLostPets',
    ALERT_HISTORY: '@TailTracker:lostPetAlerts',
  };

  private priorityQueue: PriorityQueueItem[] = [];
  private processingQueue = false;

  public static getInstance(): PriorityLostPetService {
    if (!PriorityLostPetService.instance) {
      PriorityLostPetService.instance = new PriorityLostPetService();
    }
    return PriorityLostPetService.instance;
  }

  private constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadPriorityQueue();
      this.startQueueProcessor();
    } catch (error) {
      console.error('Failed to initialize PriorityLostPetService:', error);
    }
  }

  private async loadPriorityQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEYS.LOST_PET_QUEUE);
      if (queueData) {
        this.priorityQueue = JSON.parse(queueData);
        this.priorityQueue.sort((a, b) => b.priority - a.priority);
      }
    } catch (error) {
      console.error('Failed to load priority queue:', error);
    }
  }

  private async savePriorityQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.LOST_PET_QUEUE, 
        JSON.stringify(this.priorityQueue)
      );
    } catch (error) {
      console.error('Failed to save priority queue:', error);
    }
  }

  private getPriorityScore(report: LostPetReport): number {
    let score = 50; // Base score

    // Priority level adjustments
    switch (report.priority) {
      case 'emergency':
        score += 100;
        break;
      case 'urgent':
        score += 50;
        break;
      case 'normal':
        score += 0;
        break;
    }

    // Time-based urgency (more urgent as time passes)
    const hoursElapsed = (Date.now() - new Date(report.reportedAt).getTime()) / (1000 * 60 * 60);
    if (hoursElapsed < 1) score += 30;
    else if (hoursElapsed < 6) score += 20;
    else if (hoursElapsed < 24) score += 10;

    // Reward-based priority
    if (report.reward && report.reward > 0) {
      score += Math.min(20, Math.floor(report.reward / 100));
    }

    // Location availability
    if (report.lastSeenLocation) {
      score += 15;
    }

    return score;
  }

  public async reportLostPet(
    petId: number, 
    reportData: Omit<LostPetReport, 'id' | 'petId' | 'createdAt' | 'updatedAt' | 'alertsSent' | 'status'>
  ): Promise<LostPetReport> {
    try {
      const pet = await databaseService.getPetById(petId);
      if (!pet) {
        throw new Error('Pet not found');
      }

      const report: LostPetReport = {
        id: `lost_${petId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        petId,
        ...reportData,
        alertsSent: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mark pet as lost in database
      await databaseService.updatePet(petId, { is_lost: true });

      // Add to priority queue
      await this.addToPriorityQueue(report);

      // Save to active reports
      await this.saveActiveReport(report);

      // Queue for offline sync if needed
      if (!offlineManager.isOnline()) {
        await offlineManager.queueForOfflineSync({
          type: 'pet',
          data: { id: petId, is_lost: true },
          syncStatus: 'pending',
          action: 'update',
        });
      }

      console.log(`Lost pet report created: ${report.id} (Priority: ${report.priority})`);
      return report;

    } catch (error) {
      throw handleServiceError(error, 'Failed to report lost pet');
    }
  }

  private async addToPriorityQueue(report: LostPetReport): Promise<void> {
    const priority = this.getPriorityScore(report);
    const queueItem: PriorityQueueItem = {
      reportId: report.id,
      priority,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: report.priority === 'emergency' ? 5 : 3,
      data: report,
    };

    this.priorityQueue.push(queueItem);
    this.priorityQueue.sort((a, b) => b.priority - a.priority);
    
    await this.savePriorityQueue();
    console.log(`Added to priority queue: ${report.id} (Score: ${priority})`);
  }

  private async saveActiveReport(report: LostPetReport): Promise<void> {
    try {
      const activeReportsData = await AsyncStorage.getItem(this.STORAGE_KEYS.ACTIVE_REPORTS);
      const activeReports: Record<string, LostPetReport> = activeReportsData 
        ? JSON.parse(activeReportsData) : {};
      
      activeReports[report.id] = report;
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.ACTIVE_REPORTS, 
        JSON.stringify(activeReports)
      );
    } catch (error) {
      console.error('Failed to save active report:', error);
      throw error;
    }
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.processingQueue && this.priorityQueue.length > 0) {
        await this.processQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue) return;
    
    this.processingQueue = true;
    console.log(`Processing priority queue: ${this.priorityQueue.length} items`);

    try {
      while (this.priorityQueue.length > 0 && offlineManager.isOnline()) {
        const item = this.priorityQueue.shift();
        if (!item) break;

        try {
          const success = await this.processQueueItem(item);
          if (!success && item.retryCount < item.maxRetries) {
            item.retryCount++;
            item.priority = Math.max(0, item.priority - 5); // Reduce priority on retry
            this.priorityQueue.push(item);
            this.priorityQueue.sort((a, b) => b.priority - a.priority);
          }
        } catch (error) {
          console.error(`Failed to process queue item ${item.reportId}:`, error);
          
          if (item.retryCount < item.maxRetries) {
            item.retryCount++;
            this.priorityQueue.push(item);
          }
        }
      }

      await this.savePriorityQueue();
    } catch (error) {
      console.error('Queue processing failed:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  private async processQueueItem(item: PriorityQueueItem): Promise<boolean> {
    try {
      // Send emergency notifications
      if (item.data.priority === 'emergency') {
        await this.sendEmergencyAlerts(item.data);
      }

      // Update alert count
      const updatedReport = {
        ...item.data,
        alertsSent: item.data.alertsSent + 1,
        updatedAt: new Date().toISOString(),
      };

      await this.saveActiveReport(updatedReport);
      
      console.log(`Processed lost pet alert: ${item.reportId} (Attempt ${item.retryCount + 1})`);
      return true;

    } catch (error) {
      console.error(`Failed to process item ${item.reportId}:`, error);
      return false;
    }
  }

  private async sendEmergencyAlerts(report: LostPetReport): Promise<void> {
    try {
      console.log(`Sending emergency alerts for lost pet: ${report.id}`);
      
      // In a real implementation, this would:
      // 1. Send push notifications to nearby users
      // 2. Send SMS alerts to emergency contacts
      // 3. Post to social media APIs
      // 4. Notify local animal shelters/veterinarians
      // 5. Alert community groups and neighborhood apps

      // For now, we'll just log the action
      const alertData = {
        reportId: report.id,
        type: 'emergency_alert',
        timestamp: new Date().toISOString(),
        recipients: ['nearby_users', 'emergency_contacts', 'shelters'],
        location: report.lastSeenLocation,
      };

      await this.saveAlertHistory(alertData);

    } catch (error) {
      console.error('Failed to send emergency alerts:', error);
      throw error;
    }
  }

  private async saveAlertHistory(alertData: any): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(this.STORAGE_KEYS.ALERT_HISTORY);
      const history: any[] = historyData ? JSON.parse(historyData) : [];
      
      history.push(alertData);
      
      // Keep only last 100 alerts
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.ALERT_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save alert history:', error);
    }
  }

  public async updateLostPetReport(reportId: string, updates: Partial<LostPetReport>): Promise<LostPetReport> {
    try {
      const activeReportsData = await AsyncStorage.getItem(this.STORAGE_KEYS.ACTIVE_REPORTS);
      const activeReports: Record<string, LostPetReport> = activeReportsData 
        ? JSON.parse(activeReportsData) : {};

      const existingReport = activeReports[reportId];
      if (!existingReport) {
        throw new Error('Lost pet report not found');
      }

      const updatedReport = {
        ...existingReport,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      activeReports[reportId] = updatedReport;
      await AsyncStorage.setItem(this.STORAGE_KEYS.ACTIVE_REPORTS, JSON.stringify(activeReports));

      // If status changed to 'found', mark pet as no longer lost
      if (updates.status === 'found') {
        await databaseService.updatePet(existingReport.petId, { is_lost: false });
        
        if (!offlineManager.isOnline()) {
          await offlineManager.queueForOfflineSync({
            type: 'pet',
            data: { id: existingReport.petId, is_lost: false },
            syncStatus: 'pending',
            action: 'update',
          });
        }
      }

      console.log(`Updated lost pet report: ${reportId}`);
      return updatedReport;

    } catch (error) {
      throw handleServiceError(error, 'Failed to update lost pet report');
    }
  }

  public async getLostPetReports(criteria: LostPetSearchCriteria = {}): Promise<LostPetReport[]> {
    try {
      const activeReportsData = await AsyncStorage.getItem(this.STORAGE_KEYS.ACTIVE_REPORTS);
      const activeReports: Record<string, LostPetReport> = activeReportsData 
        ? JSON.parse(activeReportsData) : {};

      let reports = Object.values(activeReports);

      // Apply filters
      if (criteria.status) {
        reports = reports.filter(report => report.status === criteria.status);
      }

      if (criteria.priority) {
        reports = reports.filter(report => report.priority === criteria.priority);
      }

      if (criteria.species) {
        reports = reports.filter(report => {
          return report.petId && this.petMatchesSpecies(report.petId, criteria.species!);
        });
      }

      if (criteria.location) {
        reports = reports.filter(report => {
          if (!report.lastSeenLocation) return false;
          const distance = this.calculateDistance(
            criteria.location!.latitude,
            criteria.location!.longitude,
            report.lastSeenLocation.latitude,
            report.lastSeenLocation.longitude
          );
          return distance <= criteria.location!.radius;
        });
      }

      if (criteria.reportedAfter) {
        const afterDate = new Date(criteria.reportedAfter);
        reports = reports.filter(report => new Date(report.reportedAt) > afterDate);
      }

      // Sort by priority and recency
      reports.sort((a, b) => {
        const priorityScore = this.getPriorityScore(b) - this.getPriorityScore(a);
        if (priorityScore !== 0) return priorityScore;
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      });

      return reports;

    } catch (error) {
      throw handleServiceError(error, 'Failed to get lost pet reports');
    }
  }

  private async petMatchesSpecies(petId: number, species: string): Promise<boolean> {
    try {
      const pet = await databaseService.getPetById(petId);
      return pet?.species.toLowerCase() === species.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  public async getQueueStatus(): Promise<{
    totalItems: number;
    processingQueue: boolean;
    nextProcessingTime: string | null;
    priorityBreakdown: Record<string, number>;
  }> {
    const priorityBreakdown: Record<string, number> = {
      emergency: 0,
      urgent: 0,
      normal: 0,
    };

    this.priorityQueue.forEach(item => {
      priorityBreakdown[item.data.priority]++;
    });

    return {
      totalItems: this.priorityQueue.length,
      processingQueue: this.processingQueue,
      nextProcessingTime: this.priorityQueue.length > 0 ? 
        new Date(Date.now() + 5000).toISOString() : null,
      priorityBreakdown,
    };
  }

  public async clearCompletedReports(): Promise<number> {
    try {
      const activeReportsData = await AsyncStorage.getItem(this.STORAGE_KEYS.ACTIVE_REPORTS);
      const activeReports: Record<string, LostPetReport> = activeReportsData 
        ? JSON.parse(activeReportsData) : {};

      const completedReports = Object.values(activeReports).filter(
        report => report.status === 'found' || report.status === 'cancelled'
      );

      for (const report of completedReports) {
        delete activeReports[report.id];
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.ACTIVE_REPORTS, JSON.stringify(activeReports));

      console.log(`Cleared ${completedReports.length} completed reports`);
      return completedReports.length;

    } catch (error) {
      throw handleServiceError(error, 'Failed to clear completed reports');
    }
  }

  public async getEmergencyContacts(): Promise<string[]> {
    // In a real implementation, this would get contacts from:
    // 1. User's emergency contacts
    // 2. Local animal control
    // 3. Nearby veterinarians
    // 4. Animal shelters in the area
    // 5. Community response groups

    return [
      'emergency@example.com',
      'animalcontrol@city.gov', 
      'shelter@localrescue.org'
    ];
  }
}

export const priorityLostPetService = PriorityLostPetService.getInstance();
export default priorityLostPetService;