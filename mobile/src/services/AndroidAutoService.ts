import React from 'react';
import { Platform, Alert, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { androidNotificationService } from './AndroidNotificationService';

const ANDROID_AUTO_SETTINGS_KEY = '@TailTracker:android_auto_settings';

// Android Auto native module interface
interface AndroidAutoNativeModule {
  isAndroidAutoConnected: () => Promise<boolean>;
  sendVoiceMessage: (message: string, priority: 'normal' | 'high' | 'urgent') => Promise<boolean>;
  registerVoiceCommand: (command: string, action: string) => Promise<boolean>;
  unregisterVoiceCommand: (command: string) => Promise<boolean>;
  setCarMode: (enabled: boolean) => Promise<void>;
  isCarModeActive: () => Promise<boolean>;
}

export interface AndroidAutoSettings {
  enabled: boolean;
  voiceAlerts: boolean;
  emergencyAnnouncements: boolean;
  routineUpdates: boolean;
  voiceCommands: boolean;
  autoCarMode: boolean;
  alertPriority: 'normal' | 'high' | 'urgent';
  maxAlertsPerHour: number;
}

export interface VoiceCommand {
  command: string;
  action: string;
  description: string;
  enabled: boolean;
}

export interface CarModeStatus {
  isActive: boolean;
  isAndroidAutoConnected: boolean;
  isDriving: boolean;
  lastActivated?: number;
}

class AndroidAutoService {
  private autoModule: AndroidAutoNativeModule | null = null;
  private isSupported = false;
  private settings: AndroidAutoSettings = {
    enabled: true,
    voiceAlerts: true,
    emergencyAnnouncements: true,
    routineUpdates: false,
    voiceCommands: true,
    autoCarMode: true,
    alertPriority: 'high',
    maxAlertsPerHour: 5,
  };
  private alertCount = 0;
  private lastAlertHour = -1;
  private voiceCommands: VoiceCommand[] = [];

  constructor() {
    this.initializeAndroidAuto();
  }

  /**
   * Initialize Android Auto service
   */
  private async initializeAndroidAuto(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('Android Auto Service is only available on Android');
      return;
    }

    try {
      // In a real implementation, this would use a native module
      // For now, we'll simulate the functionality
      this.isSupported = true;
      
      await this.loadSettings();
      await this.setupVoiceCommands();
      
      console.log('Android Auto Service initialized');
    } catch (error) {
      console.error('Error initializing Android Auto Service:', error);
    }
  }

  /**
   * Check if Android Auto is supported
   */
  async isAndroidAutoSupported(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      // Mock implementation
      return this.isSupported;
    } catch (error) {
      console.error('Error checking Android Auto support:', error);
      return false;
    }
  }

  /**
   * Check if Android Auto is connected
   */
  async isAndroidAutoConnected(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      // Mock implementation - would call native module
      return false; // Simulating not connected for development
    } catch (error) {
      console.error('Error checking Android Auto connection:', error);
      return false;
    }
  }

  /**
   * Get car mode status
   */
  async getCarModeStatus(): Promise<CarModeStatus> {
    try {
      const isAndroidAutoConnected = await this.isAndroidAutoConnected();
      
      return {
        isActive: this.settings.autoCarMode && isAndroidAutoConnected,
        isAndroidAutoConnected,
        isDriving: isAndroidAutoConnected, // Simplified logic
        lastActivated: isAndroidAutoConnected ? Date.now() : undefined,
      };
    } catch (error) {
      console.error('Error getting car mode status:', error);
      return {
        isActive: false,
        isAndroidAutoConnected: false,
        isDriving: false,
      };
    }
  }

  /**
   * Send voice message through Android Auto
   */
  async sendVoiceMessage(
    message: string, 
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<boolean> {
    if (!this.isSupported || !this.settings.enabled || !this.settings.voiceAlerts) {
      return false;
    }

    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.warn('Android Auto voice message rate limit exceeded');
        return false;
      }

      // Check if Android Auto is connected
      const isConnected = await this.isAndroidAutoConnected();
      if (!isConnected) {
        console.warn('Android Auto not connected');
        return false;
      }

      // Mock implementation - would call native module
      console.log(`Android Auto voice message (${priority}): ${message}`);
      
      // Increment alert count
      this.incrementAlertCount();
      
      return true;
    } catch (error) {
      console.error('Error sending voice message:', error);
      return false;
    }
  }

  /**
   * Send emergency alert through Android Auto
   */
  async sendEmergencyAlert(petName: string, message: string): Promise<boolean> {
    if (!this.settings.emergencyAnnouncements) {
      return false;
    }

    const fullMessage = `Emergency alert for ${petName}: ${message}`;
    return await this.sendVoiceMessage(fullMessage, 'urgent');
  }

  /**
   * Send pet safety alert
   */
  async sendPetSafetyAlert(petName: string, alertType: 'geofence' | 'health' | 'activity', message: string): Promise<boolean> {
    if (!this.settings.voiceAlerts) {
      return false;
    }

    const priority = alertType === 'health' ? 'high' : 'normal';
    const fullMessage = `Pet safety alert for ${petName}: ${message}`;
    
    return await this.sendVoiceMessage(fullMessage, priority);
  }

  /**
   * Send routine update
   */
  async sendRoutineUpdate(message: string): Promise<boolean> {
    if (!this.settings.routineUpdates) {
      return false;
    }

    return await this.sendVoiceMessage(message, 'normal');
  }

  /**
   * Register voice command
   */
  async registerVoiceCommand(command: VoiceCommand): Promise<boolean> {
    if (!this.settings.voiceCommands) {
      return false;
    }

    try {
      // Mock implementation - would call native module
      console.log(`Registering voice command: "${command.command}" -> ${command.action}`);
      
      // Add to local commands
      const existingIndex = this.voiceCommands.findIndex(c => c.command === command.command);
      if (existingIndex >= 0) {
        this.voiceCommands[existingIndex] = command;
      } else {
        this.voiceCommands.push(command);
      }
      
      await this.saveVoiceCommands();
      return true;
    } catch (error) {
      console.error('Error registering voice command:', error);
      return false;
    }
  }

  /**
   * Unregister voice command
   */
  async unregisterVoiceCommand(commandText: string): Promise<boolean> {
    try {
      // Mock implementation - would call native module
      console.log(`Unregistering voice command: "${commandText}"`);
      
      // Remove from local commands
      this.voiceCommands = this.voiceCommands.filter(c => c.command !== commandText);
      await this.saveVoiceCommands();
      
      return true;
    } catch (error) {
      console.error('Error unregistering voice command:', error);
      return false;
    }
  }

  /**
   * Get registered voice commands
   */
  getVoiceCommands(): VoiceCommand[] {
    return [...this.voiceCommands];
  }

  /**
   * Enable/disable car mode
   */
  async setCarMode(enabled: boolean): Promise<void> {
    try {
      // Mock implementation - would call native module
      console.log(`Setting car mode: ${enabled}`);
      
      if (enabled) {
        // Enable car-optimized features
        await this.enableCarOptimizations();
      } else {
        // Disable car-optimized features
        await this.disableCarOptimizations();
      }
    } catch (error) {
      console.error('Error setting car mode:', error);
    }
  }

  /**
   * Get Android Auto settings
   */
  getSettings(): AndroidAutoSettings {
    return { ...this.settings };
  }

  /**
   * Update Android Auto settings
   */
  async updateSettings(newSettings: Partial<AndroidAutoSettings>): Promise<void> {
    try {
      this.settings = {
        ...this.settings,
        ...newSettings,
      };

      await this.saveSettings();

      // Update voice commands if setting changed
      if ('voiceCommands' in newSettings) {
        await this.setupVoiceCommands();
      }
    } catch (error) {
      console.error('Error updating Android Auto settings:', error);
    }
  }

  /**
   * Private methods
   */

  private async setupVoiceCommands(): Promise<void> {
    if (!this.settings.voiceCommands) return;

    try {
      // Default voice commands for TailTracker
      const defaultCommands: VoiceCommand[] = [
        {
          command: 'Check on my pets',
          action: 'check_pets_status',
          description: 'Get status update for all pets',
          enabled: true,
        },
        {
          command: 'Where is [pet name]',
          action: 'locate_pet',
          description: 'Get location of specific pet',
          enabled: true,
        },
        {
          command: 'Emergency pet alert',
          action: 'emergency_alert',
          description: 'Trigger emergency pet alert',
          enabled: true,
        },
        {
          command: 'Pet safety status',
          action: 'safety_status',
          description: 'Get safety status for all pets',
          enabled: true,
        },
        {
          command: 'Navigate to lost pet',
          action: 'navigate_to_pet',
          description: 'Start navigation to pet location',
          enabled: true,
        },
      ];

      // Load existing commands
      await this.loadVoiceCommands();

      // Register new commands that aren't already registered
      for (const command of defaultCommands) {
        const existing = this.voiceCommands.find(c => c.command === command.command);
        if (!existing) {
          await this.registerVoiceCommand(command);
        }
      }
    } catch (error) {
      console.error('Error setting up voice commands:', error);
    }
  }

  private checkRateLimit(): boolean {
    const currentHour = new Date().getHours();
    
    if (currentHour !== this.lastAlertHour) {
      // Reset counter for new hour
      this.alertCount = 0;
      this.lastAlertHour = currentHour;
    }
    
    return this.alertCount < this.settings.maxAlertsPerHour;
  }

  private incrementAlertCount(): void {
    this.alertCount++;
  }

  private async enableCarOptimizations(): Promise<void> {
    try {
      // Enable car-specific features
      console.log('Enabling car optimizations');
      
      // Increase notification priority for car mode
      // Reduce visual distractions
      // Enable voice-only interactions
    } catch (error) {
      console.error('Error enabling car optimizations:', error);
    }
  }

  private async disableCarOptimizations(): Promise<void> {
    try {
      // Disable car-specific features
      console.log('Disabling car optimizations');
      
      // Restore normal notification priority
      // Re-enable visual features
    } catch (error) {
      console.error('Error disabling car optimizations:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ANDROID_AUTO_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading Android Auto settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(ANDROID_AUTO_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving Android Auto settings:', error);
    }
  }

  private async loadVoiceCommands(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@TailTracker:voice_commands');
      if (stored) {
        this.voiceCommands = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading voice commands:', error);
    }
  }

  private async saveVoiceCommands(): Promise<void> {
    try {
      await AsyncStorage.setItem('@TailTracker:voice_commands', JSON.stringify(this.voiceCommands));
    } catch (error) {
      console.error('Error saving voice commands:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Cleanup resources
  }
}

// Export singleton instance
export const androidAutoService = new AndroidAutoService();

// TailTracker-specific Android Auto helpers
export const TailTrackerAndroidAuto = {
  /**
   * Send pet location alert
   */
  async sendLocationAlert(petName: string, isInSafeZone: boolean, location?: string): Promise<boolean> {
    if (isInSafeZone) {
      return await androidAutoService.sendPetSafetyAlert(
        petName,
        'geofence',
        `${petName} has entered a safe zone${location ? ` at ${location}` : ''}.`
      );
    } else {
      return await androidAutoService.sendPetSafetyAlert(
        petName,
        'geofence',
        `${petName} has left the safe zone${location ? ` and is now at ${location}` : ''}.`
      );
    }
  },

  /**
   * Send health alert
   */
  async sendHealthAlert(petName: string, healthStatus: string, message?: string): Promise<boolean> {
    const alertMessage = message || `${petName}'s health status is ${healthStatus}.`;
    return await androidAutoService.sendPetSafetyAlert(petName, 'health', alertMessage);
  },

  /**
   * Send activity alert
   */
  async sendActivityAlert(petName: string, activityLevel: string): Promise<boolean> {
    return await androidAutoService.sendPetSafetyAlert(
      petName,
      'activity',
      `${petName} has ${activityLevel} activity levels today.`
    );
  },

  /**
   * Send lost pet emergency
   */
  async sendLostPetEmergency(petName: string, lastKnownLocation?: string): Promise<boolean> {
    const locationText = lastKnownLocation ? ` Last known location: ${lastKnownLocation}.` : '';
    return await androidAutoService.sendEmergencyAlert(
      petName,
      `${petName} is missing!${locationText} Please check the app for details.`
    );
  },

  /**
   * Send daily summary
   */
  async sendDailySummary(pets: Array<{ name: string; stepsToday: number; healthStatus: string }>): Promise<boolean> {
    if (pets.length === 0) return false;

    let summary = 'Daily pet summary: ';
    pets.forEach((pet, index) => {
      summary += `${pet.name} took ${pet.stepsToday} steps and is in ${pet.healthStatus} health`;
      if (index < pets.length - 1) {
        summary += ', ';
      }
    });
    summary += '.';

    return await androidAutoService.sendRoutineUpdate(summary);
  },

  /**
   * Handle voice command response
   */
  async handleVoiceCommand(command: string, petData: any[]): Promise<string | null> {
    try {
      const lowerCommand = command.toLowerCase();

      if (lowerCommand.includes('check on my pets') || lowerCommand.includes('pet status')) {
        // Generate status summary
        if (petData.length === 0) {
          return 'You have no pets registered in TailTracker.';
        }

        let response = `You have ${petData.length} pet${petData.length > 1 ? 's' : ''}. `;
        petData.forEach(pet => {
          response += `${pet.name} is ${pet.location?.isInSafeZone ? 'in a safe zone' : 'outside safe zones'} and in ${pet.health?.status || 'good'} health. `;
        });

        return response;
      }

      if (lowerCommand.includes('where is')) {
        // Extract pet name from command
        const petNameMatch = lowerCommand.match(/where is (.+)/);
        if (petNameMatch) {
          const searchName = petNameMatch[1].trim();
          const pet = petData.find(p => p.name.toLowerCase().includes(searchName));
          
          if (pet) {
            const location = pet.location?.lastKnownAddress || 'unknown location';
            const timeAgo = pet.location?.lastSeen ? this.formatTimeAgo(pet.location.lastSeen) : 'unknown time';
            return `${pet.name} was last seen at ${location}, ${timeAgo}.`;
          } else {
            return `I couldn't find a pet named ${searchName}.`;
          }
        }
      }

      if (lowerCommand.includes('emergency') || lowerCommand.includes('lost pet')) {
        return 'Emergency mode activated. Opening TailTracker app for immediate assistance.';
      }

      if (lowerCommand.includes('safety status')) {
        const safePets = petData.filter(p => p.location?.isInSafeZone).length;
        const totalPets = petData.length;
        
        if (totalPets === 0) {
          return 'You have no pets registered.';
        }
        
        if (safePets === totalPets) {
          return `All ${totalPets} of your pets are in safe zones.`;
        } else {
          return `${safePets} of ${totalPets} pets are in safe zones. ${totalPets - safePets} pets need attention.`;
        }
      }

      return 'I didn\'t understand that command. Try saying "check on my pets" or "where is [pet name]".';
    } catch (error) {
      console.error('Error handling voice command:', error);
      return 'Sorry, I encountered an error processing your request.';
    }
  },

  /**
   * Format time ago for voice response
   */
  formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  },
};

// React hooks for Android Auto
export const useAndroidAuto = () => {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [carModeStatus, setCarModeStatus] = React.useState<CarModeStatus>({
    isActive: false,
    isAndroidAutoConnected: false,
    isDriving: false,
  });
  const [settings, setSettings] = React.useState<AndroidAutoSettings>(androidAutoService.getSettings());
  const [voiceCommands, setVoiceCommands] = React.useState<VoiceCommand[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    checkSupport();
    checkConnection();
    loadVoiceCommands();
    
    // Set up periodic connection checks
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkSupport = async () => {
    try {
      const supported = await androidAutoService.isAndroidAutoSupported();
      setIsSupported(supported);
    } catch (error) {
      console.error('Error checking Android Auto support:', error);
    }
  };

  const checkConnection = async () => {
    try {
      const connected = await androidAutoService.isAndroidAutoConnected();
      setIsConnected(connected);
      
      const status = await androidAutoService.getCarModeStatus();
      setCarModeStatus(status);
    } catch (error) {
      console.error('Error checking Android Auto connection:', error);
    }
  };

  const loadVoiceCommands = () => {
    try {
      const commands = androidAutoService.getVoiceCommands();
      setVoiceCommands(commands);
    } catch (error) {
      console.error('Error loading voice commands:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<AndroidAutoSettings>) => {
    try {
      setIsLoading(true);
      await androidAutoService.updateSettings(newSettings);
      setSettings(androidAutoService.getSettings());
    } catch (error) {
      console.error('Error updating Android Auto settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendVoiceMessage = async (message: string, priority: 'normal' | 'high' | 'urgent' = 'normal') => {
    try {
      return await androidAutoService.sendVoiceMessage(message, priority);
    } catch (error) {
      console.error('Error sending voice message:', error);
      return false;
    }
  };

  const registerVoiceCommand = async (command: VoiceCommand) => {
    try {
      setIsLoading(true);
      const success = await androidAutoService.registerVoiceCommand(command);
      if (success) {
        loadVoiceCommands();
      }
      return success;
    } catch (error) {
      console.error('Error registering voice command:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isConnected,
    carModeStatus,
    settings,
    voiceCommands,
    isLoading,
    updateSettings,
    sendVoiceMessage,
    registerVoiceCommand,
    checkConnection,
    setCarMode: androidAutoService.setCarMode.bind(androidAutoService),
    // TailTracker-specific helpers
    sendLocationAlert: TailTrackerAndroidAuto.sendLocationAlert,
    sendHealthAlert: TailTrackerAndroidAuto.sendHealthAlert,
    sendActivityAlert: TailTrackerAndroidAuto.sendActivityAlert,
    sendLostPetEmergency: TailTrackerAndroidAuto.sendLostPetEmergency,
    sendDailySummary: TailTrackerAndroidAuto.sendDailySummary,
    handleVoiceCommand: TailTrackerAndroidAuto.handleVoiceCommand,
  };
};