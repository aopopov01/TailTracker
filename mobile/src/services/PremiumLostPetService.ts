// Premium Lost Pet Service - Stub implementation for simplified feature set

export interface PremiumAlert {
  id: string;
  petId: string;
  alertRadius: number;
  contactMethod: 'sms' | 'email' | 'push' | 'all';
  priority: 'standard' | 'high' | 'urgent';
  autoReward: boolean;
  rewardAmount?: number;
}

export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  resolved: number;
  responseRate: number;
  averageResolutionTime: number;
}

export interface LostPetAlert {
  id: string;
  petId: string;
  pet_name: string;
  species: string;
  breed?: string;
  status: 'active' | 'found' | 'cancelled';
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  timestamp: string;
  last_seen_date: Date;
  last_seen_address?: string;
  description?: string;
  photo_url?: string;
  reward_amount?: number;
  reward_currency?: string;
  contact_phone?: string;
  distance_km: number;
}

export interface LostPetReport {
  id: string;
  alertId: string;
  reporterId: string;
  sightingLocation: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  description: string;
  photos?: string[];
  verified: boolean;
}

export class PremiumLostPetService {
  private static instance: PremiumLostPetService;

  public static getInstance(): PremiumLostPetService {
    if (!PremiumLostPetService.instance) {
      PremiumLostPetService.instance = new PremiumLostPetService();
    }
    return PremiumLostPetService.instance;
  }

  // Create premium alert (stub)
  async createPremiumAlert(alert: Omit<PremiumAlert, 'id'>): Promise<string> {
    console.log('PremiumLostPetService: Creating premium alert (stub)', alert);
    return `premium_alert_${Date.now()}`;
  }

  // Get alert statistics (stub)
  async getAlertStatistics(userId: string): Promise<AlertStatistics> {
    console.log('PremiumLostPetService: Getting alert statistics (stub)', { userId });
    return {
      totalAlerts: 5,
      activeAlerts: 1,
      resolved: 4,
      responseRate: 0.8,
      averageResolutionTime: 24 * 60 * 60 * 1000, // 24 hours in ms
    };
  }

  // Enable premium features (stub)
  async enablePremiumFeatures(alertId: string): Promise<boolean> {
    console.log('PremiumLostPetService: Enabling premium features (stub)', { alertId });
    return true;
  }

  // Send priority notification (stub)
  async sendPriorityNotification(alertId: string, contacts: string[]): Promise<void> {
    console.log('PremiumLostPetService: Sending priority notification (stub)', { alertId, contacts });
  }

  // Get nearby alerts (stub)
  async getNearbyAlerts(radius: number = 25): Promise<{ success: boolean; alerts?: LostPetAlert[]; error?: string }> {
    console.log('PremiumLostPetService: Getting nearby alerts (stub)', { radius });
    
    // Mock data for demo purposes
    const mockAlerts: LostPetAlert[] = [
      {
        id: 'alert_1',
        petId: 'pet_1',
        pet_name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        status: 'active',
        location: { latitude: 40.7128, longitude: -74.0060 },
        radius: 25,
        timestamp: new Date().toISOString(),
        last_seen_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        last_seen_address: '123 Main St, New York, NY',
        description: 'Friendly golden retriever, responds to his name. Last seen wearing a red collar.',
        photo_url: 'https://example.com/buddy.jpg',
        reward_amount: 500,
        reward_currency: 'USD',
        contact_phone: '+1-555-123-4567',
        distance_km: 2.5,
      },
      {
        id: 'alert_2',
        petId: 'pet_2',
        pet_name: 'Whiskers',
        species: 'Cat',
        breed: 'Siamese',
        status: 'active',
        location: { latitude: 40.7589, longitude: -73.9851 },
        radius: 25,
        timestamp: new Date().toISOString(),
        last_seen_date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        last_seen_address: '456 Oak Ave, New York, NY',
        description: 'Indoor cat that got out. Very shy around strangers.',
        photo_url: 'https://example.com/whiskers.jpg',
        reward_amount: 200,
        reward_currency: 'USD',
        contact_phone: '+1-555-987-6543',
        distance_km: 1.2,
      }
    ];

    return {
      success: true,
      alerts: mockAlerts
    };
  }

  // Mark pet as found (stub)
  async markPetFound(alertId: string, reporterType: string): Promise<{ success: boolean; error?: string }> {
    console.log('PremiumLostPetService: Marking pet as found (stub)', { alertId, reporterType });
    return { success: true };
  }

  // Format distance for display
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km away`;
    } else {
      return `${Math.round(distanceKm)}km away`;
    }
  }

  // Format reward for display
  formatReward(amount: number, currency: string = 'USD'): string {
    const currencySymbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
    };
    
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()} reward`;
  }

  // Check location permission (stub)
  async checkLocationPermission(): Promise<boolean> {
    console.log('PremiumLostPetService: Checking location permission (stub)');
    return true; // Mock allowing location access
  }

  // Request location permission (stub)
  async requestLocationPermission(): Promise<boolean> {
    console.log('PremiumLostPetService: Requesting location permission (stub)');
    return true; // Mock granting location access
  }

  // Report lost pet (stub)
  async reportLostPet(petData: LostPetReport): Promise<{ success: boolean; error?: string; requiresPremium?: boolean; queued?: boolean; alerts_sent?: number }> {
    console.log('PremiumLostPetService: Reporting lost pet (stub)', petData);
    return {
      success: true,
      alerts_sent: 15,
      queued: false
    };
  }
}

// Helper utilities for lost pet functionality
export class LostPetHelpers {
  // Get urgency level based on time since last seen
  static getUrgencyLevel(lastSeenDate: Date): 'high' | 'medium' | 'low' {
    const now = new Date();
    const hoursAgo = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo <= 24) {
      return 'high'; // Within 24 hours - very urgent
    } else if (hoursAgo <= 72) {
      return 'medium'; // 1-3 days - medium urgency
    } else {
      return 'low'; // Over 3 days - lower urgency
    }
  }

  // Format time ago in a human-readable format
  static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
  }

  // Get species icon/emoji
  static getSpeciesIcon(species: string): string {
    const speciesIcons: { [key: string]: string } = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      rabbit: '🐰',
      hamster: '🐹',
      guinea_pig: '🐹',
      ferret: '🦦',
      reptile: '🦎',
      fish: '🐠',
      other: '🐾',
    };
    
    const normalizedSpecies = species.toLowerCase().replace(/\s+/g, '_');
    return speciesIcons[normalizedSpecies] || speciesIcons.other;
  }
}

// Export singleton instance for use in components
export const premiumLostPetService = PremiumLostPetService.getInstance();

export default PremiumLostPetService;