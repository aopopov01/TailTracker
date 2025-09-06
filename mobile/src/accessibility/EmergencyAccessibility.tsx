/**
 * TailTracker Emergency Accessibility System
 * 
 * Crisis-focused accessibility features designed to ensure all users can access
 * critical pet care functions during emergencies, regardless of their abilities
 * or the stress of the situation.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Vibration,
  Linking,
  BackHandler,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import * as Speech from 'expo-speech';
import { log } from '../utils/Logger';
import AccessibilityManager from './AccessibilityManager';

/**
 * Emergency Contact Information
 */
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: 'veterinarian' | 'family' | 'friend' | 'neighbor' | 'emergency_service';
  accessibilityNotes?: string;
  preferredContactMethod: 'call' | 'text' | 'email';
  isVerified: boolean;
}

/**
 * Emergency Situation Types
 */
type EmergencyType = 
  | 'pet_lost'
  | 'pet_injured'
  | 'pet_sick'
  | 'user_incapacitated'
  | 'evacuation'
  | 'natural_disaster'
  | 'general_emergency';

/**
 * Emergency Accessibility Configuration
 */
interface EmergencyAccessibilityConfig {
  panicButtonEnabled: boolean;
  voiceActivationEnabled: boolean;
  gestureActivationEnabled: boolean;
  automaticLocationSharing: boolean;
  emergencySimplification: boolean;
  multiModalAlerts: boolean;
  emergencyContacts: EmergencyContact[];
  medicalInformation: {
    userConditions: string[];
    medications: string[];
    allergies: string[];
    emergencyInstructions: string;
  };
}

/**
 * Emergency Accessibility Provider
 */
interface EmergencyAccessibilityProviderProps {
  children: React.ReactNode;
  onEmergencyActivated?: (type: EmergencyType) => void;
  onEmergencyResolved?: () => void;
}

export const EmergencyAccessibilityProvider: React.FC<EmergencyAccessibilityProviderProps> = ({
  children,
  onEmergencyActivated,
  onEmergencyResolved,
}) => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyType | null>(null);
  const [emergencyConfig, setEmergencyConfig] = useState<EmergencyAccessibilityConfig | null>(null);
  const [shakeDetectionActive] = useState(true); // setShakeDetectionActive unused
  const [voiceListening, setVoiceListening] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  
  const accessibilityManager = AccessibilityManager.getInstance();
  const shakeStartTime = useRef<number>(0);

  const provideCrisisAccessibilityFeedback = useCallback(async (
    type: EmergencyType,
    activationMethod: string
  ) => {
    // Multi-modal feedback for crisis situations
    const emergencyMessage = getEmergencyMessage(type);
    
    // High-priority announcement
    accessibilityManager.announceForAccessibility(
      `🚨 Emergency activated: ${emergencyMessage}`,
      'critical'
    );
    
    // Intense haptic feedback pattern
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
    
    // Vibration pattern
    Vibration.vibrate([
      100, 50,  // Strong pulse
      100, 50,  // Strong pulse
      300       // Long alert
    ]);
    
    // Text-to-speech for additional clarity
    Speech.speak(emergencyMessage, {
      rate: 0.8,
      pitch: 1.2,
      language: 'en-US',
    });
    
    // Visual flash for users with hearing impairments
    StatusBar.setBackgroundColor('#FF0000', true);
    setTimeout(() => StatusBar.setBackgroundColor('#FFFFFF', true), 200);
    setTimeout(() => StatusBar.setBackgroundColor('#FF0000', true), 400);
    setTimeout(() => StatusBar.setBackgroundColor('#FFFFFF', true), 600);
  }, [accessibilityManager]);
  const shakeCount = useRef<number>(0);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getEmergencyMessage = (type: EmergencyType): string => {
    const messages = {
      pet_lost: 'Pet emergency: Pet is lost. Emergency services activated.',
      pet_injured: 'Pet emergency: Pet is injured. Veterinary assistance needed.',
      pet_sick: 'Pet emergency: Pet is sick. Medical attention required.',
      user_incapacitated: 'User emergency: Owner needs assistance. Emergency contacts notified.',
      evacuation: 'Evacuation emergency: Immediate pet evacuation required.',
      natural_disaster: 'Natural disaster emergency: Pet safety protocols activated.',
      general_emergency: 'General emergency: Emergency assistance activated.',
    };
    
    return messages[type] || 'Emergency situation detected. Help is on the way.';
  };

  // Load emergency configuration
  useEffect(() => {
    loadEmergencyConfig();
  }, []);

  // Forward declare functions to avoid dependency cycles
  const shareLocationWithContacts = useCallback(async (location: Location.LocationObject) => {
    const locationText = `Emergency location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
    
    // This would integrate with messaging services
    log.debug('Sharing location:', locationText);
  }, []);

  const notifyEmergencyContacts = useCallback(async (type: EmergencyType) => {
    if (!emergencyConfig?.emergencyContacts) return;
    
    const message = `TailTracker Emergency Alert: ${getEmergencyMessage(type)}. Please respond immediately.`;
    
    for (const contact of emergencyConfig.emergencyContacts) {
      try {
        if (contact.preferredContactMethod === 'call') {
          // Would integrate with phone call functionality
          log.debug(`Calling ${contact.name}: ${contact.phone}`);
        } else if (contact.preferredContactMethod === 'text') {
          // Would integrate with SMS functionality
          log.debug(`Texting ${contact.name}: ${message}`);
        }
      } catch (error) {
        log.error(`Failed to contact ${contact.name}:`, error);
      }
    }
  }, [emergencyConfig]);

  const logEmergencyEvent = useCallback(async (type: EmergencyType) => {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      location: currentLocation ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      } : null,
      userAccessibilitySettings: accessibilityManager.getPreferences(),
    };
    
    try {
      const existingLogs = await AsyncStorage.getItem('emergency_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(event);
      
      // Keep only last 50 emergency events
      const recentLogs = logs.slice(-50);
      await AsyncStorage.setItem('emergency_logs', JSON.stringify(recentLogs));
    } catch (error) {
      log.error('Failed to log emergency event:', error);
    }
  }, [currentLocation, accessibilityManager]);

  const handleEmergencyResolution = useCallback(() => {
    setEmergencyActive(false);
    setEmergencyType(null);
    
    if (emergencyTimeoutRef.current) {
      clearTimeout(emergencyTimeoutRef.current);
      emergencyTimeoutRef.current = null;
    }
    
    // Provide resolution feedback
    accessibilityManager.announceForAccessibility(
      'Emergency resolved. Returning to normal mode.',
      'high'
    );
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    onEmergencyResolved?.();
  }, [onEmergencyResolved, accessibilityManager]);

  const executeEmergencyProtocols = useCallback(async (type: EmergencyType) => {
    try {
      // Get current location if permission available
      if (emergencyConfig?.automaticLocationSharing && currentLocation) {
        await shareLocationWithContacts(currentLocation);
      }
      
      // Send notifications to emergency contacts
      if (emergencyConfig?.emergencyContacts?.length && emergencyConfig.emergencyContacts.length > 0) {
        await notifyEmergencyContacts(type);
      }
      
      // Log emergency event
      await logEmergencyEvent(type);
      
    } catch (error) {
      log.error('Emergency protocol execution failed:', error);
    }
  }, [emergencyConfig, currentLocation, shareLocationWithContacts, notifyEmergencyContacts, logEmergencyEvent]);

  const handleEmergencyActivation = useCallback(async (
    type: EmergencyType,
    activationMethod: 'button' | 'voice' | 'shake_gesture' | 'automatic'
  ) => {
    log.debug(`🚨 Emergency activated: ${type} via ${activationMethod}`);
    
    setEmergencyActive(true);
    setEmergencyType(type);
    
    // Provide immediate feedback
    await provideCrisisAccessibilityFeedback(type, activationMethod);
    
    // Simplify interface if configured
    if (emergencyConfig?.emergencySimplification) {
      await accessibilityManager.activateEmergencyMode();
    }
    
    // Start emergency protocols
    await executeEmergencyProtocols(type);
    
    onEmergencyActivated?.(type);
    
    // Auto-resolve after 30 minutes if not manually resolved
    emergencyTimeoutRef.current = setTimeout(() => {
      handleEmergencyResolution();
    }, 30 * 60 * 1000);
    
  }, [emergencyConfig, onEmergencyActivated, accessibilityManager, provideCrisisAccessibilityFeedback, executeEmergencyProtocols, handleEmergencyResolution]);

  // Shake detection for emergency activation
  const handleShakeGesture = useCallback(() => {
    handleEmergencyActivation('general_emergency', 'shake_gesture');
  }, [handleEmergencyActivation]);

  useEffect(() => {
    let subscription: any;

    if (shakeDetectionActive) {
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        if (acceleration > 2.5) { // Strong shake threshold
          const now = Date.now();
          
          if (now - shakeStartTime.current > 1000) {
            // Reset shake detection after 1 second
            shakeCount.current = 0;
            shakeStartTime.current = now;
          }
          
          shakeCount.current++;
          
          // Triple shake within 2 seconds activates emergency
          if (shakeCount.current >= 3 && now - shakeStartTime.current < 2000) {
            handleShakeGesture();
            shakeCount.current = 0;
          }
        }
      });

      Accelerometer.setUpdateInterval(100);
    }

    return () => subscription?.remove();
  }, [shakeDetectionActive, handleShakeGesture]);

  // Voice activation listener
  useEffect(() => {
    if (voiceListening) {
      // In a real implementation, this would listen for "Emergency" keyword
      const voiceTimeout = setTimeout(() => {
        setVoiceListening(false);
      }, 10000); // Stop listening after 10 seconds

      return () => clearTimeout(voiceTimeout);
    }
  }, [voiceListening]);

  // Get current location for emergency services
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation(location);
        }
      } catch (error) {
        log.error('Failed to get location:', error);
      }
    };

    if (emergencyActive) {
      getCurrentLocation();
    }
  }, [emergencyActive]);

  const loadEmergencyConfig = async () => {
    try {
      const config = await AsyncStorage.getItem('emergency_accessibility_config');
      if (config) {
        setEmergencyConfig(JSON.parse(config));
      } else {
        // Set default configuration
        const defaultConfig: EmergencyAccessibilityConfig = {
          panicButtonEnabled: true,
          voiceActivationEnabled: true,
          gestureActivationEnabled: true,
          automaticLocationSharing: true,
          emergencySimplification: true,
          multiModalAlerts: true,
          emergencyContacts: [],
          medicalInformation: {
            userConditions: [],
            medications: [],
            allergies: [],
            emergencyInstructions: '',
          },
        };
        setEmergencyConfig(defaultConfig);
        await AsyncStorage.setItem('emergency_accessibility_config', JSON.stringify(defaultConfig));
      }
    } catch (error) {
      log.error('Failed to load emergency config:', error);
    }
  };



  return (
    <View style={{ flex: 1 }}>
      {children}
      
      {/* Emergency Mode Overlay */}
      {emergencyActive && (
        <EmergencyModeOverlay
          emergencyType={emergencyType!}
          onResolve={handleEmergencyResolution}
          emergencyConfig={emergencyConfig!}
          currentLocation={currentLocation}
        />
      )}
      
      {/* Emergency Panic Button (always accessible) */}
      <EmergencyPanicButton
        onEmergencyActivated={handleEmergencyActivation}
        enabled={emergencyConfig?.panicButtonEnabled ?? true}
        emergencyActive={emergencyActive}
      />
      
      {/* Voice Activation Indicator */}
      {voiceListening && (
        <VoiceActivationIndicator
          onEmergencyDetected={(type) => handleEmergencyActivation(type, 'voice')}
        />
      )}
    </View>
  );
};

/**
 * Emergency Mode Overlay
 */
interface EmergencyModeOverlayProps {
  emergencyType: EmergencyType;
  onResolve: () => void;
  emergencyConfig: EmergencyAccessibilityConfig;
  currentLocation: Location.LocationObject | null;
}

const EmergencyModeOverlay: React.FC<EmergencyModeOverlayProps> = ({
  emergencyType,
  onResolve,
  emergencyConfig,
  currentLocation,
}) => {
  const [countdown, setCountdown] = useState(30);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCallEmergencyServices = () => {
    const emergencyNumber = '911'; // Would be localized
    Linking.openURL(`tel:${emergencyNumber}`);
  };

  const handleShareLocation = () => {
    if (currentLocation) {
      const { latitude, longitude } = currentLocation.coords;
      const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(`sms:&body=Emergency location: ${locationUrl}`);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="none"
      transparent={false}
      onRequestClose={() => {}} // Prevent accidental dismissal
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#FF0000',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Emergency mode active. Emergency assistance required`}
      >
        {/* Emergency Status */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 30,
            width: width * 0.9,
            alignItems: 'center',
          }}
          accessible={true}
          accessibilityRole="text"
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#FF0000',
              textAlign: 'center',
              marginBottom: 20,
            }}
            accessible={true}
            accessibilityRole="text"
          >
            🚨 EMERGENCY
          </Text>

          <Text
            style={{
              fontSize: 20,
              textAlign: 'center',
              marginBottom: 30,
              color: '#333',
            }}
            accessible={true}
          >
            Emergency assistance required
          </Text>

          {/* Emergency Actions */}
          <View style={{ width: '100%', gap: 15 }}>
            <TouchableOpacity
              onPress={handleCallEmergencyServices}
              style={{
                backgroundColor: '#FF0000',
                padding: 20,
                borderRadius: 15,
                minHeight: 80,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Call emergency services 911"
              accessibilityHint="Calls emergency services immediately"
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                📞 CALL 911
              </Text>
            </TouchableOpacity>

            {currentLocation && (
              <TouchableOpacity
                onPress={handleShareLocation}
                style={{
                  backgroundColor: '#FF9800',
                  padding: 20,
                  borderRadius: 15,
                  minHeight: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Share current location"
                accessibilityHint="Sends your location via text message"
              >
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                  📍 SHARE LOCATION
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onResolve}
              style={{
                backgroundColor: '#4CAF50',
                padding: 20,
                borderRadius: 15,
                minHeight: 80,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Emergency resolved"
              accessibilityHint="Marks the emergency as resolved and exits emergency mode"
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                ✓ EMERGENCY RESOLVED
              </Text>
            </TouchableOpacity>
          </View>

          {/* Auto-resolve countdown */}
          <Text
            style={{
              fontSize: 14,
              color: '#666',
              marginTop: 20,
              textAlign: 'center',
            }}
            accessible={true}
            accessibilityLiveRegion="polite"
          >
            Auto-resolve in {countdown} seconds
          </Text>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Emergency Panic Button
 */
interface EmergencyPanicButtonProps {
  onEmergencyActivated: (type: EmergencyType, method: 'button') => void;
  enabled: boolean;
  emergencyActive: boolean;
}

const EmergencyPanicButton: React.FC<EmergencyPanicButtonProps> = ({
  onEmergencyActivated,
  enabled,
  emergencyActive,
}) => {
  const [pressCount, setPressCount] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);
  
  const handlePress = () => {
    const now = Date.now();
    
    if (now - lastPressTime > 2000) {
      // Reset if more than 2 seconds since last press
      setPressCount(1);
    } else {
      setPressCount(prev => prev + 1);
    }
    
    setLastPressTime(now);
    
    // Triple tap to activate (prevent accidental activation)
    if (pressCount >= 2) {
      onEmergencyActivated('general_emergency', 'button');
      setPressCount(0);
    }
  };

  if (!enabled || emergencyActive) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        alignItems: 'center',
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={{
          backgroundColor: '#FF0000',
          width: 80,
          height: 80,
          borderRadius: 40,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 10,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Emergency panic button"
        accessibilityHint="Triple tap quickly to activate emergency mode"
      >
        <Text style={{ color: 'white', fontSize: 24 }}>🚨</Text>
      </TouchableOpacity>
      
      {pressCount > 0 && (
        <Text
          style={{
            color: '#FF0000',
            fontSize: 12,
            fontWeight: 'bold',
            marginTop: 8,
          }}
          accessible={true}
          accessibilityLiveRegion="polite"
        >
          Press {3 - pressCount} more time{3 - pressCount === 1 ? '' : 's'}
        </Text>
      )}
    </View>
  );
};

/**
 * Voice Activation Indicator
 */
interface VoiceActivationIndicatorProps {
  onEmergencyDetected: (type: EmergencyType) => void;
}

const VoiceActivationIndicator: React.FC<VoiceActivationIndicatorProps> = ({
  onEmergencyDetected,
}) => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: '#FF0000',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
      }}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel="Voice emergency detection active"
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
        🎤 Say "Emergency" to activate
      </Text>
    </View>
  );
};

export default {
  EmergencyAccessibilityProvider,
};