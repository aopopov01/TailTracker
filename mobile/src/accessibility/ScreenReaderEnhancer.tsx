/**
 * TailTracker Enhanced Screen Reader Support
 * 
 * Advanced screen reader optimization that goes beyond basic accessibility labels
 * to provide rich, contextual, and intelligent screen reader experiences.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
  findNodeHandle,
  Platform,
} from 'react-native';
import AccessibilityManager from './AccessibilityManager';

/**
 * Enhanced accessibility roles beyond standard React Native
 */
export type EnhancedAccessibilityRole = 
  | 'navigation'
  | 'landmark'
  | 'article'
  | 'complementary'
  | 'contentinfo'
  | 'main'
  | 'region'
  | 'banner'
  | 'form'
  | 'search'
  | 'tabpanel'
  | 'button'
  | 'text'
  | 'tablist'
  | 'tab'
  | 'listitem'
  | 'group'
  | 'rowheader'
  | 'columnheader'
  | 'cell'
  | 'gridcell'
  | 'rowgroup'
  | 'presentation'
  | 'status'
  | 'alert'
  | 'alertdialog'
  | 'dialog'
  | 'marquee'
  | 'log'
  | 'timer';

/**
 * Rich semantic context for screen readers
 */
export interface ScreenReaderContext {
  // Location context
  screenName: string;
  sectionName?: string;
  subsectionName?: string;
  
  // Hierarchical context
  level: number;
  position?: { current: number; total: number };
  
  // Content context
  dataType: 'pet' | 'location' | 'health' | 'family' | 'subscription' | 'general';
  importance: 'critical' | 'high' | 'medium' | 'low';
  
  // Interaction context
  actions: string[];
  shortcuts?: string[];
  relatedElements?: string[];
}

/**
 * Enhanced accessibility props for components
 */
export interface EnhancedAccessibilityProps {
  // Standard props (enhanced)
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: EnhancedAccessibilityRole;
  
  // Rich semantic props
  accessibilityContext?: ScreenReaderContext;
  accessibilityDescription?: string;
  accessibilityInstructions?: string[];
  
  // State and relationship props
  accessibilityExpanded?: boolean;
  accessibilitySelected?: boolean;
  accessibilityChecked?: boolean | 'mixed';
  accessibilityLevel?: number;
  accessibilitySetSize?: number;
  accessibilityPositionInSet?: number;
  
  // Interactive props
  accessibilityActions?: {
    name: string;
    label: string;
    shortcut?: string;
  }[];
  
  // Content structure props
  accessibilityHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  accessibilityLabelledBy?: string;
  accessibilityDescribedBy?: string;
  accessibilityOwns?: string[];
  accessibilityControls?: string;
  
  // Live region props
  accessibilityLiveRegion?: 'polite' | 'assertive' | 'off';
  accessibilityAtomic?: boolean;
  accessibilityBusy?: boolean;
  accessibilityRelevant?: 'additions' | 'removals' | 'text' | 'all';
}

/**
 * Hook for enhanced screen reader support
 */
export function useEnhancedScreenReader() {
  const accessibilityManager = AccessibilityManager.getInstance();
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [preferences, setPreferences] = useState(accessibilityManager.getPreferences());

  useEffect(() => {
    const checkScreenReader = async () => {
      const isActive = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderActive(isActive);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderActive
    );

    const preferencesListener = (newPreferences: any) => {
      setPreferences(newPreferences);
    };

    accessibilityManager.on('preferences-updated', preferencesListener);

    return () => {
      subscription?.remove();
      accessibilityManager.off('preferences-updated', preferencesListener);
    };
  }, [accessibilityManager]);

  const announceWithContext = (
    message: string,
    context?: ScreenReaderContext,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    let enhancedMessage = message;

    if (context && isScreenReaderActive) {
      // Add positional context
      if (context.position) {
        enhancedMessage = `${enhancedMessage}. Item ${context.position.current} of ${context.position.total}`;
      }

      // Add level context for hierarchical content
      if (context.level > 1) {
        enhancedMessage = `Level ${context.level}. ${enhancedMessage}`;
      }

      // Add section context
      if (context.sectionName) {
        enhancedMessage = `${context.sectionName}. ${enhancedMessage}`;
      }

      // Add available actions
      if (context.actions && context.actions.length > 0) {
        enhancedMessage = `${enhancedMessage}. Available actions: ${context.actions.join(', ')}`;
      }
    }

    accessibilityManager.announceForAccessibility(enhancedMessage, priority, context?.screenName);
  };

  const announceNavigation = (
    from: string,
    to: string,
    context?: Partial<ScreenReaderContext>
  ) => {
    const message = `Navigated from ${from} to ${to}`;
    announceWithContext(message, context as ScreenReaderContext, 'medium');
  };

  const announceStateChange = (
    element: string,
    oldState: string,
    newState: string,
    context?: Partial<ScreenReaderContext>
  ) => {
    const message = `${element} changed from ${oldState} to ${newState}`;
    announceWithContext(message, context as ScreenReaderContext, 'high');
  };

  const announceError = (
    error: string,
    context?: Partial<ScreenReaderContext>
  ) => {
    const message = `Error: ${error}`;
    announceWithContext(message, context as ScreenReaderContext, 'critical');
  };

  const announceSuccess = (
    action: string,
    context?: Partial<ScreenReaderContext>
  ) => {
    const message = `Success: ${action}`;
    announceWithContext(message, context as ScreenReaderContext, 'high');
  };

  return {
    isScreenReaderActive,
    preferences,
    announceWithContext,
    announceNavigation,
    announceStateChange,
    announceError,
    announceSuccess,
  };
}

/**
 * Enhanced Screen Reader Component wrapper
 */
interface ScreenReaderEnhancedProps extends EnhancedAccessibilityProps {
  children: React.ReactNode;
  component?: 'View' | 'TouchableOpacity' | 'ScrollView' | 'Text';
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
}

export const ScreenReaderEnhanced: React.FC<ScreenReaderEnhancedProps> = ({
  children,
  component = 'View',
  accessibilityContext,
  accessibilityActions,
  onAccessibilityAction,
  ...accessibilityProps
}) => {
  const { isScreenReaderActive, preferences } = useEnhancedScreenReader();
  const elementRef = useRef<any>(null);

  // Generate enhanced accessibility label with context
  const enhancedLabel = React.useMemo(() => {
    let label = accessibilityProps.accessibilityLabel;

    if (isScreenReaderActive && accessibilityContext) {
      // Add data type context
      if (accessibilityContext.dataType) {
        const typeLabels = {
          pet: 'Pet information',
          location: 'Location data',
          health: 'Health record',
          family: 'Family member',
          subscription: 'Subscription feature',
          general: '',
        };
        const typeLabel = typeLabels[accessibilityContext.dataType];
        if (typeLabel) {
          label = `${typeLabel}: ${label}`;
        }
      }

      // Add importance context for critical information
      if (accessibilityContext.importance === 'critical') {
        label = `Important: ${label}`;
      }

      // Add position context
      if (accessibilityContext.position) {
        label = `${label}, item ${accessibilityContext.position.current} of ${accessibilityContext.position.total}`;
      }
    }

    return label;
  }, [accessibilityProps.accessibilityLabel, isScreenReaderActive, accessibilityContext]);

  // Generate enhanced accessibility hint
  const enhancedHint = React.useMemo(() => {
    let hint = accessibilityProps.accessibilityHint || '';

    if (isScreenReaderActive && accessibilityContext) {
      // Add available actions to hint
      if (accessibilityContext.actions && accessibilityContext.actions.length > 0) {
        const actionsText = accessibilityContext.actions.join(', ');
        hint = hint ? `${hint}. Actions: ${actionsText}` : `Actions: ${actionsText}`;
      }

      // Add shortcut information
      if (accessibilityContext.shortcuts && accessibilityContext.shortcuts.length > 0) {
        const shortcutsText = accessibilityContext.shortcuts.join(', ');
        hint = hint ? `${hint}. Shortcuts: ${shortcutsText}` : `Shortcuts: ${shortcutsText}`;
      }
    }

    return hint;
  }, [accessibilityProps.accessibilityHint, isScreenReaderActive, accessibilityContext]);

  // Enhanced accessibility actions
  const enhancedActions = React.useMemo(() => {
    const actions = accessibilityActions || [];
    
    // Add standard actions based on context
    if (accessibilityContext?.actions) {
      accessibilityContext.actions.forEach(action => {
        if (!actions.find(a => a.name === action)) {
          actions.push({
            name: action,
            label: action.charAt(0).toUpperCase() + action.slice(1),
          });
        }
      });
    }

    return actions;
  }, [accessibilityActions, accessibilityContext]);

  const commonProps = {
    ref: elementRef,
    accessible: true,
    ...accessibilityProps,
    accessibilityLabel: enhancedLabel,
    accessibilityHint: enhancedHint,
    accessibilityActions: enhancedActions.map(action => ({
      name: action.name,
      label: action.label,
    })),
    onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) => {
      const actionName = event.nativeEvent.actionName;
      
      // Handle enhanced actions
      const action = enhancedActions.find(a => a.name === actionName);
      if (action?.shortcut) {
        // Announce shortcut usage
        AccessibilityInfo.announceForAccessibility(`Used ${action.label} shortcut`);
      }

      onAccessibilityAction?.(event);
    },
  };

  // Platform-specific optimizations
  if (Platform.OS === 'ios' && preferences.platformSettings.voiceOverOptimized) {
    Object.assign(commonProps, {
      accessibilityTraits: accessibilityProps.accessibilityRole ? [accessibilityProps.accessibilityRole] : undefined,
    });
  }

  if (Platform.OS === 'android' && preferences.platformSettings.talkBackOptimized) {
    Object.assign(commonProps, {
      importantForAccessibility: 'yes',
    });
  }

  // Create component-specific props
  const baseAccessibilityProps = {
    accessible: true,
    accessibilityLabel: enhancedLabel,
    accessibilityHint: enhancedHint,
    accessibilityActions: enhancedActions.map(action => ({
      name: action.name,
      label: action.label,
    })),
    onAccessibilityAction: commonProps.onAccessibilityAction,
  };

  // Render appropriate component
  switch (component) {
    case 'TouchableOpacity':
      return (
        <TouchableOpacity 
          ref={elementRef}
          {...baseAccessibilityProps}
          {...(accessibilityProps as any)}
        >
          {children}
        </TouchableOpacity>
      );
    case 'ScrollView':
      return (
        <ScrollView 
          ref={elementRef}
          {...baseAccessibilityProps}
          {...(accessibilityProps as any)}
        >
          {children}
        </ScrollView>
      );
    case 'Text':
      return (
        <Text 
          ref={elementRef}
          {...baseAccessibilityProps}
          {...(accessibilityProps as any)}
        >
          {children}
        </Text>
      );
    default:
      return (
        <View 
          ref={elementRef}
          {...baseAccessibilityProps}
          {...(accessibilityProps as any)}
        >
          {children}
        </View>
      );
  }
};

/**
 * Screen Reader optimized Pet Card component
 */
interface ScreenReaderPetCardProps {
  pet: {
    id: string;
    name: string;
    type: string;
    breed?: string;
    age?: number;
    location: string;
    batteryLevel?: number;
    isTracking: boolean;
    healthStatus?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    lastSeen?: Date;
  };
  position?: { current: number; total: number };
  onPress: () => void;
  onQuickAction?: (action: string) => void;
}

export const ScreenReaderPetCard: React.FC<ScreenReaderPetCardProps> = ({
  pet,
  position,
  onPress,
  onQuickAction,
}) => {
  const { announceWithContext } = useEnhancedScreenReader();

  const accessibilityLabel = React.useMemo(() => {
    let label = `${pet.name}, ${pet.type}`;
    
    if (pet.breed) {
      label += `, ${pet.breed}`;
    }
    
    if (pet.age) {
      label += `, ${pet.age} years old`;
    }
    
    label += `. Currently at ${pet.location}`;
    
    if (pet.batteryLevel) {
      label += `. Battery at ${pet.batteryLevel} percent`;
    }
    
    label += `. Tracking is ${pet.isTracking ? 'active' : 'inactive'}`;
    
    if (pet.healthStatus) {
      label += `. Health status: ${pet.healthStatus}`;
    }
    
    if (pet.lastSeen) {
      const timeSince = Math.floor((Date.now() - pet.lastSeen.getTime()) / (1000 * 60));
      if (timeSince < 60) {
        label += `. Last seen ${timeSince} minutes ago`;
      }
    }

    return label;
  }, [pet]);

  const handlePress = () => {
    announceWithContext(
      `Opening ${pet.name}'s profile`,
      {
        screenName: 'Pet Profile',
        level: 1,
        dataType: 'pet',
        importance: 'medium',
        actions: ['view details', 'edit pet', 'track location'],
      },
      'medium'
    );
    onPress();
  };

  const handleQuickAction = (action: string) => {
    announceWithContext(
      `${action} for ${pet.name}`,
      {
        screenName: 'Pet Card',
        level: 2,
        dataType: 'pet',
        importance: 'high',
        actions: [action],
      },
      'high'
    );
    onQuickAction?.(action);
  };

  const context: ScreenReaderContext = {
    screenName: 'Pet List',
    sectionName: 'Pet Cards',
    level: 2,
    position,
    dataType: 'pet',
    importance: pet.healthStatus === 'critical' ? 'critical' : 'medium',
    actions: ['view details', 'track location', 'quick actions'],
    shortcuts: ['double tap to open', 'swipe right for actions'],
  };

  return (
    <ScreenReaderEnhanced
      component="TouchableOpacity"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to view pet details. Swipe right for quick actions."
      accessibilityRole="button"
      accessibilityContext={context}
      accessibilitySelected={false}
      accessibilityExpanded={false}
      accessibilityActions={[
        { name: 'view-details', label: 'View Details' },
        { name: 'track-location', label: 'Track Location' },
        { name: 'emergency-alert', label: 'Emergency Alert' },
      ]}
      onAccessibilityAction={(event) => {
        const action = event.nativeEvent.actionName;
        switch (action) {
          case 'view-details':
            handlePress();
            break;
          case 'track-location':
            handleQuickAction('start tracking');
            break;
          case 'emergency-alert':
            handleQuickAction('emergency alert');
            break;
        }
      }}
    >
      <View style={{
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginVertical: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        {/* Pet information - hidden from screen reader as it's in the label */}
        <View accessible={false}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{pet.name}</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>{pet.location}</Text>
          {pet.healthStatus === 'critical' && (
            <View style={{ backgroundColor: '#ff4444', padding: 4, borderRadius: 4, marginTop: 4 }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                HEALTH ALERT
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScreenReaderEnhanced>
  );
};

export default {
  useEnhancedScreenReader,
  ScreenReaderEnhanced,
  ScreenReaderPetCard,
};