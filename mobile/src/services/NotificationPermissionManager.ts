/**
 * TailTracker Notification Permission Manager
 * 
 * This service provides graceful permission handling with clear user communication,
 * addressing the permission flow inconsistencies identified in the QA report.
 */

import React from 'react';
import { Platform, Alert, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { unifiedNotificationService, PermissionState } from './UnifiedNotificationService';

// Storage key for permission flow state
const PERMISSION_FLOW_STORAGE_KEY = '@TailTracker:notification_permission_flow';

// Permission flow states
export type PermissionFlowState = 
  | 'initial'         // First time asking
  | 'explained'       // User has seen explanation
  | 'prompted'        // User has been prompted
  | 'denied_once'     // User denied once
  | 'denied_multiple' // User denied multiple times
  | 'granted'         // Permission granted
  | 'permanently_denied'; // User needs to go to settings

// Permission request reasons
export type PermissionReason = 
  | 'lost_pet_alerts'      // For receiving lost pet notifications
  | 'health_reminders'     // For medication/vaccination reminders
  | 'location_safety'      // For location-based safety alerts
  | 'emergency_alerts'     // For critical emergency notifications
  | 'first_time_setup'     // During onboarding
  | 'settings_change';     // User changing settings

// Permission flow configuration
interface PermissionFlowConfig {
  reason: PermissionReason;
  title: string;
  message: string;
  benefits: string[];
  criticalAlerts?: boolean;
  showAlternatives?: boolean;
}

// Permission flow result
interface PermissionResult {
  granted: boolean;
  flowState: PermissionFlowState;
  showedRationale: boolean;
  needsSettings: boolean;
}

export class NotificationPermissionManager {
  private static instance: NotificationPermissionManager;
  private flowState: PermissionFlowState = 'initial';
  private lastRequestReason: PermissionReason | null = null;

  private constructor() {
    this.loadFlowState();
  }

  static getInstance(): NotificationPermissionManager {
    if (!NotificationPermissionManager.instance) {
      NotificationPermissionManager.instance = new NotificationPermissionManager();
    }
    return NotificationPermissionManager.instance;
  }

  /**
   * Request notification permissions with graceful flow
   */
  async requestPermissions(reason: PermissionReason, options?: {
    criticalAlerts?: boolean;
    skipExplanation?: boolean;
  }): Promise<PermissionResult> {
    try {
      console.log(`Requesting notification permissions for: ${reason}`);
      
      this.lastRequestReason = reason;
      const config = this.getFlowConfig(reason);

      // Check current permission status
      const currentStatus = await this.getCurrentPermissionStatus();
      
      if (currentStatus.granted) {
        return {
          granted: true,
          flowState: 'granted',
          showedRationale: false,
          needsSettings: false,
        };
      }

      // Determine if we need to show rationale
      const shouldShowRationale = this.shouldShowRationale();
      
      if (shouldShowRationale && !options?.skipExplanation) {
        const userWantsToGrant = await this.showPermissionRationale(config);
        if (!userWantsToGrant) {
          this.flowState = 'explained';
          await this.saveFlowState();
          return {
            granted: false,
            flowState: this.flowState,
            showedRationale: true,
            needsSettings: false,
          };
        }
      }

      // Request permissions through unified service
      const permissionState = await unifiedNotificationService.requestPermissions({
        criticalAlerts: options?.criticalAlerts,
      });

      // Update flow state based on result
      if (permissionState.granted) {
        this.flowState = 'granted';
      } else {
        this.flowState = permissionState.deniedCount === 1 ? 'denied_once' : 'denied_multiple';
      }

      await this.saveFlowState();

      // Show post-denial guidance if needed
      if (!permissionState.granted) {
        await this.handlePermissionDenied(config);
      }

      return {
        granted: permissionState.granted,
        flowState: this.flowState,
        showedRationale: shouldShowRationale,
        needsSettings: this.flowState === 'denied_multiple',
      };

    } catch (error) {
      console.error('Error requesting permissions:', error);
      return {
        granted: false,
        flowState: this.flowState,
        showedRationale: false,
        needsSettings: false,
      };
    }
  }

  /**
   * Check if notification permissions are available and explain benefits
   */
  async checkAndExplainPermissions(reason: PermissionReason): Promise<{
    hasPermission: boolean;
    needsExplanation: boolean;
    canRequest: boolean;
  }> {
    const currentStatus = await this.getCurrentPermissionStatus();
    
    if (currentStatus.granted) {
      return {
        hasPermission: true,
        needsExplanation: false,
        canRequest: false,
      };
    }

    const needsExplanation = this.shouldShowRationale();
    const canRequest = this.flowState !== 'permanently_denied';

    return {
      hasPermission: false,
      needsExplanation,
      canRequest,
    };
  }

  /**
   * Show permission explanation without requesting
   */
  async showPermissionExplanation(reason: PermissionReason): Promise<boolean> {
    const config = this.getFlowConfig(reason);
    return await this.showPermissionRationale(config);
  }

  /**
   * Open device notification settings
   */
  async openNotificationSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // Try to use openSettingsAsync if available, otherwise show alert
        if (Notifications.openSettingsAsync) {
          await Notifications.openSettingsAsync();
        } else {
          Alert.alert(
            'Notification Settings',
            'Please go to Settings > Notifications > TailTracker to enable notifications.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // For Android, try to open app notification settings
        const androidIntent = `package:com.tailtracker.app`;
        const canOpen = await Linking.canOpenURL(`android-app://com.android.settings/.Settings`);
        
        if (canOpen) {
          await Linking.openURL(`android-app://com.android.settings/.Settings`);
        } else {
          // Fallback to general settings
          await Linking.openSettings();
        }
      }
    } catch (error) {
      console.error('Error opening notification settings:', error);
      
      // Show manual instructions
      Alert.alert(
        'Open Settings Manually',
        Platform.OS === 'ios'
          ? 'Go to Settings > TailTracker > Notifications and enable notifications.'
          : 'Go to Settings > Apps > TailTracker > Notifications and enable notifications.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Reset permission flow state (for testing or user request)
   */
  async resetPermissionFlow(): Promise<void> {
    this.flowState = 'initial';
    this.lastRequestReason = null;
    await this.saveFlowState();
  }

  /**
   * Get current flow state
   */
  getFlowState(): PermissionFlowState {
    return this.flowState;
  }

  /**
   * Check if user can still be prompted for permissions
   */
  canPromptForPermissions(): boolean {
    return this.flowState !== 'permanently_denied';
  }

  // Private methods

  private async getCurrentPermissionStatus(): Promise<PermissionState> {
    const { status } = await Notifications.getPermissionsAsync();
    const existing = unifiedNotificationService.getPermissionState();
    
    return {
      granted: status === 'granted',
      requestedAt: existing?.requestedAt,
      deniedCount: existing?.deniedCount || 0,
      shouldShowRationale: status === 'denied' && (existing?.deniedCount || 0) > 0,
      criticalAlertsEnabled: existing?.criticalAlertsEnabled,
    };
  }

  private shouldShowRationale(): boolean {
    return this.flowState === 'initial' || this.flowState === 'denied_once';
  }

  private getFlowConfig(reason: PermissionReason): PermissionFlowConfig {
    switch (reason) {
      case 'lost_pet_alerts':
        return {
          reason,
          title: 'Stay Connected to Lost Pet Alerts',
          message: 'Get notified instantly when pets go missing in your area so you can help bring them home.',
          benefits: [
            'Receive urgent lost pet alerts in your neighborhood',
            'Help reunite pets with their families',
            'Get real-time updates with photos and contact details',
            'Make a difference in your pet community',
          ],
          criticalAlerts: true,
        };

      case 'health_reminders':
        return {
          reason,
          title: 'Never Miss Important Health Care',
          message: 'Keep your pets healthy with timely reminders for medications, vaccinations, and vet appointments.',
          benefits: [
            'Medication and vaccination reminders',
            'Vet appointment notifications',
            'Health milestone tracking',
            'Emergency health alerts',
          ],
        };

      case 'location_safety':
        return {
          reason,
          title: 'Location-Based Safety Alerts',
          message: 'Receive important safety notifications based on your location to keep your pets secure.',
          benefits: [
            'Geofence alerts when pets enter/exit safe zones',
            'Local hazard warnings',
            'Weather-related safety alerts',
            'Community safety updates',
          ],
          criticalAlerts: true,
        };

      case 'emergency_alerts':
        return {
          reason,
          title: 'Critical Emergency Notifications',
          message: 'Get immediate alerts for pet emergencies that require urgent attention.',
          benefits: [
            'Immediate emergency notifications',
            'Critical health alerts',
            'Lost pet emergency updates',
            'Time-sensitive safety warnings',
          ],
          criticalAlerts: true,
        };

      case 'first_time_setup':
        return {
          reason,
          title: 'Enable Notifications for Complete Protection',
          message: 'TailTracker uses notifications to keep your pets safe and healthy. Enable notifications to get the full experience.',
          benefits: [
            'Lost pet alerts in your area',
            'Health and medication reminders',
            'Emergency notifications',
            'Community updates',
          ],
          showAlternatives: true,
        };

      case 'settings_change':
        return {
          reason,
          title: 'Update Notification Preferences',
          message: 'Customize your notification settings to receive the alerts that matter most to you.',
          benefits: [
            'Personalized notification types',
            'Custom quiet hours',
            'Priority-based filtering',
            'Channel-specific preferences',
          ],
        };

      default:
        return {
          reason,
          title: 'Enable Notifications',
          message: 'Allow TailTracker to send you notifications to enhance your pet care experience.',
          benefits: [
            'Important pet-related updates',
            'Safety and health alerts',
            'Community notifications',
          ],
        };
    }
  }

  private async showPermissionRationale(config: PermissionFlowConfig): Promise<boolean> {
    return new Promise((resolve) => {
      const benefits = config.benefits.map((benefit, index) => `\u2022 ${benefit}`).join('\n');
      
      Alert.alert(
        config.title,
        `${config.message}\n\nWith notifications enabled, you'll receive:\n\n${benefits}`,
        [
          {
            text: config.showAlternatives ? 'Skip for Now' : 'Not Now',
            style: 'cancel',
            onPress: () => {
              console.log('User declined permission rationale');
              resolve(false);
            },
          },
          {
            text: 'Enable Notifications',
            onPress: () => {
              console.log('User accepted permission rationale');
              resolve(true);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  private async handlePermissionDenied(config: PermissionFlowConfig): Promise<void> {
    const isFirstDenial = this.flowState === 'denied_once';
    const isMultipleDenials = this.flowState === 'denied_multiple';

    if (isFirstDenial) {
      // Show gentle encouragement after first denial
      Alert.alert(
        'Notifications Disabled',
        'You can enable notifications anytime in Settings to receive important pet alerts and reminders.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => this.openNotificationSettings(),
          },
        ]
      );
    } else if (isMultipleDenials) {
      // Show more urgent message for multiple denials
      Alert.alert(
        'Missing Important Alerts',
        Platform.OS === 'ios' 
          ? 'To receive lost pet alerts and health reminders, please enable notifications in Settings > TailTracker > Notifications.'
          : 'To receive lost pet alerts and health reminders, please enable notifications in Settings > Apps > TailTracker > Notifications.',
        [
          { text: 'Skip', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => this.openNotificationSettings(),
          },
        ]
      );
      
      // Mark as permanently denied for this session
      this.flowState = 'permanently_denied';
      await this.saveFlowState();
    }
  }

  private async loadFlowState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(PERMISSION_FLOW_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.flowState = data.flowState || 'initial';
        this.lastRequestReason = data.lastRequestReason || null;
      }
    } catch (error) {
      console.error('Error loading permission flow state:', error);
      this.flowState = 'initial';
    }
  }

  private async saveFlowState(): Promise<void> {
    try {
      const data = {
        flowState: this.flowState,
        lastRequestReason: this.lastRequestReason,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(PERMISSION_FLOW_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving permission flow state:', error);
    }
  }
}

// Export singleton instance
export const notificationPermissionManager = NotificationPermissionManager.getInstance();

// React hook for permission management
export const useNotificationPermissions = () => {
  const [permissionState, setPermissionState] = React.useState<PermissionState | null>(null);
  const [flowState, setFlowState] = React.useState<PermissionFlowState>('initial');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    loadInitialState();
    
    // Listen for permission changes
    const removeListener = unifiedNotificationService.addEventListener(
      'permission_changed',
      (_, state: PermissionState) => {
        setPermissionState(state);
      }
    );

    return removeListener;
  }, []);

  const loadInitialState = async () => {
    try {
      setIsLoading(true);
      
      const currentPermissionState = unifiedNotificationService.getPermissionState();
      const currentFlowState = notificationPermissionManager.getFlowState();
      
      setPermissionState(currentPermissionState);
      setFlowState(currentFlowState);
    } catch (error) {
      console.error('Error loading initial permission state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async (
    reason: PermissionReason,
    options?: { criticalAlerts?: boolean; skipExplanation?: boolean }
  ): Promise<PermissionResult> => {
    try {
      setIsLoading(true);
      
      const result = await notificationPermissionManager.requestPermissions(reason, options);
      
      // Update local state
      setFlowState(result.flowState);
      const updatedPermissionState = unifiedNotificationService.getPermissionState();
      setPermissionState(updatedPermissionState);
      
      return result;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermissions = async (reason: PermissionReason) => {
    return await notificationPermissionManager.checkAndExplainPermissions(reason);
  };

  const openSettings = async () => {
    return await notificationPermissionManager.openNotificationSettings();
  };

  const showExplanation = async (reason: PermissionReason) => {
    return await notificationPermissionManager.showPermissionExplanation(reason);
  };

  const resetFlow = async () => {
    try {
      setIsLoading(true);
      await notificationPermissionManager.resetPermissionFlow();
      setFlowState('initial');
    } catch (error) {
      console.error('Error resetting permission flow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permissionState,
    flowState,
    isLoading,
    hasPermission: permissionState?.granted || false,
    canPrompt: notificationPermissionManager.canPromptForPermissions(),
    requestPermissions,
    checkPermissions,
    openSettings,
    showExplanation,
    resetFlow,
  };
};

