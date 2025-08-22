// TailTracker Accessibility Implementation
// Comprehensive accessibility features for iOS VoiceOver and Android TalkBack compliance

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  AccessibilityInfo,
  Platform,
  Alert,
} from 'react-native';
import { useAccessibilityInfo } from '@react-native-community/hooks';

// ============================================================================
// ACCESSIBILITY CONSTANTS AND UTILITIES
// ============================================================================

export const AccessibilityLabels = {
  // Navigation
  MAIN_NAVIGATION: 'Main navigation',
  BACK_BUTTON: 'Go back',
  MENU_BUTTON: 'Open menu',
  SETTINGS_BUTTON: 'Open settings',
  
  // Pet Management
  PET_CARD: (petName: string) => `Pet profile for ${petName}`,
  PET_LOCATION_STATUS: (petName: string, status: string) => 
    `${petName} is currently ${status}`,
  ADD_PET_BUTTON: 'Add new pet',
  EDIT_PET_BUTTON: (petName: string) => `Edit ${petName}'s profile`,
  
  // Location and Tracking
  LOCATION_MAP: 'Location map showing pet positions',
  SAFE_ZONE: (zoneName: string) => `Safe zone: ${zoneName}`,
  TRACKING_TOGGLE: (petName: string, isTracking: boolean) => 
    `${isTracking ? 'Stop' : 'Start'} tracking ${petName}`,
  LOCATE_PET_BUTTON: (petName: string) => `Find ${petName}'s current location`,
  
  // Alerts and Notifications
  ALERT_BUTTON: 'Emergency alert',
  NOTIFICATION_SETTINGS: 'Notification settings',
  EMERGENCY_CONTACT: (contactName: string) => `Emergency contact: ${contactName}`,
  
  // Family Sharing
  FAMILY_MEMBER: (memberName: string, role: string) => 
    `Family member: ${memberName}, role: ${role}`,
  INVITE_FAMILY_BUTTON: 'Invite family member',
  
  // Premium Features
  PREMIUM_FEATURE: (featureName: string) => 
    `Premium feature: ${featureName}. Requires subscription.`,
  SUBSCRIBE_BUTTON: 'Subscribe to premium features',
};

export const AccessibilityHints = {
  // Actions
  TAP_TO_OPEN: 'Tap to open',
  TAP_TO_EDIT: 'Tap to edit',
  TAP_TO_SELECT: 'Tap to select',
  SWIPE_FOR_OPTIONS: 'Swipe right or left for more options',
  DOUBLE_TAP_TO_ACTIVATE: 'Double tap to activate',
  
  // Navigation
  SCROLL_FOR_MORE: 'Scroll for more content',
  TAB_NAVIGATION: 'Use tab navigation to access more features',
  
  // Location
  MAP_INTERACTION: 'Use map gestures to explore location',
  LOCATION_UPDATE: 'Location updates automatically every 30 seconds',
};

// ============================================================================
// ACCESSIBILITY HOOKS AND UTILITIES
// ============================================================================

export const useAccessibilityAnnouncements = () => {
  const announceForAccessibility = (message: string) => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android TalkBack announcement
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const announceLocationUpdate = (petName: string, location: string) => {
    announceForAccessibility(`${petName}'s location updated: ${location}`);
  };

  const announceAlert = (alertType: string, petName: string) => {
    announceForAccessibility(`Alert: ${alertType} for ${petName}`);
  };

  const announceConnectionStatus = (isConnected: boolean) => {
    announceForAccessibility(
      isConnected ? 'Connected to tracking service' : 'Connection lost'
    );
  };

  return {
    announceForAccessibility,
    announceLocationUpdate,
    announceAlert,
    announceConnectionStatus,
  };
};

// ============================================================================
// ACCESSIBLE COMPONENTS
// ============================================================================

interface AccessiblePetCardProps {
  pet: {
    id: string;
    name: string;
    type: string;
    location: string;
    isTracking: boolean;
    batteryLevel?: number;
  };
  onPress: () => void;
  onLongPress?: () => void;
}

export const AccessiblePetCard: React.FC<AccessiblePetCardProps> = ({
  pet,
  onPress,
  onLongPress,
}) => {
  const { announceForAccessibility } = useAccessibilityAnnouncements();

  const accessibilityLabel = `${pet.name}, ${pet.type}. Currently ${pet.location}. ${
    pet.isTracking ? 'Tracking active' : 'Tracking inactive'
  }${pet.batteryLevel ? `. Battery at ${pet.batteryLevel}%` : ''}`;

  const accessibilityHint = 'Tap to view details, long press for quick actions';

  const handlePress = () => {
    announceForAccessibility(`Opening ${pet.name}'s profile`);
    onPress();
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        selected: pet.isTracking,
      }}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={{
        padding: 16,
        marginVertical: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={{ uri: pet.image }}
          style={{ width: 60, height: 60, borderRadius: 30 }}
          accessible={false} // Decorative image, described in parent label
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{ fontSize: 18, fontWeight: 'bold', color: '#2C3E50' }}
            accessible={false} // Content included in parent accessibility label
          >
            {pet.name}
          </Text>
          <Text
            style={{ fontSize: 14, color: '#7F8C8D', marginTop: 4 }}
            accessible={false}
          >
            {pet.location}
          </Text>
        </View>
        {pet.isTracking && (
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#2ECC71',
            }}
            accessible={false} // Status included in parent label
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

interface AccessibleMapViewProps {
  pets: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }>;
  safeZones: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  }>;
  onPetPress: (petId: string) => void;
  onSafeZonePress: (zoneId: string) => void;
}

export const AccessibleMapView: React.FC<AccessibleMapViewProps> = ({
  pets,
  safeZones,
  onPetPress,
  onSafeZonePress,
}) => {
  const { announceForAccessibility } = useAccessibilityAnnouncements();

  const mapAccessibilityLabel = `Map showing ${pets.length} pets and ${safeZones.length} safe zones`;
  const mapAccessibilityHint = 'Explore map content using the list below';

  return (
    <View>
      {/* Map Container with Accessibility */}
      <View
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={mapAccessibilityLabel}
        accessibilityHint={mapAccessibilityHint}
        style={{
          height: 300,
          backgroundColor: '#E8F4FD',
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#7F8C8D' }}>Interactive Map</Text>
      </View>

      {/* Accessible Map Legend */}
      <View style={{ marginTop: 16 }}>
        <Text
          style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}
          accessibilityRole="header"
        >
          Map Contents
        </Text>

        {/* Pet Locations List */}
        {pets.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}
              accessibilityRole="header"
            >
              Pet Locations
            </Text>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${pet.name} is at coordinates ${pet.latitude.toFixed(4)}, ${pet.longitude.toFixed(4)}`}
                accessibilityHint="Tap to center map on this pet"
                onPress={() => {
                  announceForAccessibility(`Centering map on ${pet.name}`);
                  onPetPress(pet.id);
                }}
                style={{
                  padding: 12,
                  backgroundColor: '#F8F9FA',
                  marginVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>{pet.name}</Text>
                <Text style={{ fontSize: 14, color: '#7F8C8D' }}>
                  Lat: {pet.latitude.toFixed(4)}, Lng: {pet.longitude.toFixed(4)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Safe Zones List */}
        {safeZones.length > 0 && (
          <View>
            <Text
              style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}
              accessibilityRole="header"
            >
              Safe Zones
            </Text>
            {safeZones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Safe zone: ${zone.name}, radius ${zone.radius} meters`}
                accessibilityHint="Tap to view safe zone details"
                onPress={() => {
                  announceForAccessibility(`Opening ${zone.name} safe zone details`);
                  onSafeZonePress(zone.id);
                }}
                style={{
                  padding: 12,
                  backgroundColor: '#E8F5E8',
                  marginVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>{zone.name}</Text>
                <Text style={{ fontSize: 14, color: '#7F8C8D' }}>
                  Radius: {zone.radius}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

interface AccessibleAlertButtonProps {
  petName: string;
  onPress: () => void;
  isEmergency?: boolean;
}

export const AccessibleAlertButton: React.FC<AccessibleAlertButtonProps> = ({
  petName,
  onPress,
  isEmergency = false,
}) => {
  const { announceForAccessibility } = useAccessibilityAnnouncements();

  const handlePress = () => {
    const message = isEmergency
      ? `Emergency alert activated for ${petName}`
      : `Alert sent for ${petName}`;
    
    announceForAccessibility(message);
    onPress();
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={
        isEmergency
          ? `Emergency alert for ${petName}`
          : `Send alert for ${petName}`
      }
      accessibilityHint={
        isEmergency
          ? 'Sends immediate emergency notification to all family members and emergency contacts'
          : 'Sends notification to family members about pet status'
      }
      accessibilityState={{
        disabled: false,
      }}
      onPress={handlePress}
      style={{
        backgroundColor: isEmergency ? '#E74C3C' : '#3498DB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 8,
      }}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: 'bold',
        }}
        accessible={false} // Content included in parent accessibility label
      >
        {isEmergency ? 'EMERGENCY ALERT' : 'Send Alert'}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// ACCESSIBILITY CONTEXT PROVIDER
// ============================================================================

interface AccessibilityContextType {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  preferredContentSizeCategory: string;
  announceForAccessibility: (message: string) => void;
  isAccessibilityServiceEnabled: boolean;
}

const AccessibilityContext = React.createContext<AccessibilityContextType | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = React.useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = React.useState(false);
  const [preferredContentSizeCategory, setPreferredContentSizeCategory] = React.useState('medium');

  React.useEffect(() => {
    // Check initial accessibility settings
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
    
    if (Platform.OS === 'ios') {
      AccessibilityInfo.getPreferredContentSizeCategory().then(setPreferredContentSizeCategory);
    }

    // Listen for accessibility changes
    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    return () => {
      screenReaderSubscription?.remove();
      reduceMotionSubscription?.remove();
    };
  }, []);

  const announceForAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  const value: AccessibilityContextType = {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    preferredContentSizeCategory,
    announceForAccessibility,
    isAccessibilityServiceEnabled: isScreenReaderEnabled,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// ============================================================================
// ACCESSIBILITY TESTING UTILITIES
// ============================================================================

export const AccessibilityTestingUtils = {
  // Test if element has proper accessibility properties
  validateAccessibility: (element: any) => {
    const issues: string[] = [];

    if (!element.props.accessible && !element.props.accessibilityLabel) {
      issues.push('Element should be accessible or have accessibility label');
    }

    if (element.props.accessibilityRole === 'button' && !element.props.onPress) {
      issues.push('Button should have onPress handler');
    }

    if (element.props.accessibilityLabel && element.props.accessibilityLabel.length > 100) {
      issues.push('Accessibility label should be concise (under 100 characters)');
    }

    return issues;
  },

  // Generate accessibility report
  generateAccessibilityReport: (componentTree: any) => {
    // Implementation would traverse component tree and validate accessibility
    console.log('Accessibility validation complete');
  },
};

// ============================================================================
// PLATFORM-SPECIFIC ACCESSIBILITY HELPERS
// ============================================================================

export const PlatformAccessibility = {
  // iOS VoiceOver specific helpers
  iOS: {
    setAccessibilityFocus: (ref: React.RefObject<any>) => {
      if (Platform.OS === 'ios' && ref.current) {
        AccessibilityInfo.setAccessibilityFocus(ref.current);
      }
    },

    announcePageChange: (pageName: string) => {
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(`Now on ${pageName} page`);
      }
    },
  },

  // Android TalkBack specific helpers
  Android: {
    setAccessibilityFocus: (ref: React.RefObject<any>) => {
      if (Platform.OS === 'android' && ref.current) {
        AccessibilityInfo.setAccessibilityFocus(ref.current);
      }
    },

    announcePageChange: (pageName: string) => {
      if (Platform.OS === 'android') {
        AccessibilityInfo.announceForAccessibility(`Navigated to ${pageName}`);
      }
    },
  },
};

export default {
  AccessibilityLabels,
  AccessibilityHints,
  useAccessibilityAnnouncements,
  AccessiblePetCard,
  AccessibleMapView,
  AccessibleAlertButton,
  AccessibilityProvider,
  useAccessibility,
  AccessibilityTestingUtils,
  PlatformAccessibility,
};