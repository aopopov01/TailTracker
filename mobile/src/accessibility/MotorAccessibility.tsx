/**
 * TailTracker Advanced Motor Accessibility System
 * 
 * Comprehensive motor accessibility features supporting users with various
 * motor impairments, including tremor compensation, switch control,
 * voice control, and one-handed operation optimizations.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Vibration, Dimensions, Text } from 'react-native';
import { PanGestureHandler, LongPressGestureHandler, State } from 'react-native-gesture-handler';
import AccessibilityManager from './AccessibilityManager';

interface MotorAccessibilityProps {
  children: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  
  // Motor-specific props
  minimumTouchTarget?: number;
  tremorCompensation?: boolean;
  oneHandedOptimized?: boolean;
  switchControlEnabled?: boolean;
  voiceControlEnabled?: boolean;
  
  // Timing adjustments
  holdDelay?: number;
  doubleTapDelay?: number;
  
  // Visual feedback
  enhancedFeedback?: boolean;
  hapticFeedback?: boolean;
}

/**
 * Advanced Touch Target Component with Motor Accessibility
 */
export const MotorAccessibleTouchTarget: React.FC<MotorAccessibilityProps> = ({
  children,
  disabled = false,
  onPress,
  onLongPress,
  minimumTouchTarget = 48,
  tremorCompensation = false,
  oneHandedOptimized = false,
  holdDelay = 0,
  doubleTapDelay = 300,
  enhancedFeedback = false,
  hapticFeedback = true,
}) => {
  const accessibilityManager = AccessibilityManager.getInstance();
  const preferences = accessibilityManager.getPreferences();
  
  const [isPressed, setIsPressed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  
  const panRef = useRef<PanGestureHandler>(null);
  const longPressRef = useRef<LongPressGestureHandler>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate effective touch target size
  const effectiveTouchTarget = Math.max(
    minimumTouchTarget,
    preferences.motorAccessibility.touchTargetMinSize
  );
  
  // Calculate tremor tolerance
  const tremorTolerance = tremorCompensation || preferences.motorAccessibility.tremorCompensation
    ? preferences.motorAccessibility.clickTolerance
    : 5;

  
  // Calculate hold delay
  const effectiveHoldDelay = Math.max(
    holdDelay,
    preferences.motorAccessibility.holdDelay
  );
  
  /**
   * Execute press with appropriate feedback
   */
  const executePress = useCallback((tapCount: number) => {
    if (disabled) return;
    
    // Provide haptic feedback
    if (hapticFeedback && preferences.auditoryAccessibility.hapticFeedbackEnabled) {
      if (tapCount === 1) {
        Vibration.vibrate(50);
      } else if (tapCount === 2) {
        Vibration.vibrate([50, 50, 50]);
      }
    }
    
    // Enhanced visual feedback
    if (enhancedFeedback) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
    }
    
    // Execute callback
    if (onPress) {
      onPress();
    }
    
    // Announce action for screen readers
    accessibilityManager.announceForAccessibility('Button activated', 'medium');
  }, [disabled, hapticFeedback, enhancedFeedback, onPress, preferences, accessibilityManager]);

  /**
   * Handle tap with double-tap detection
   */
  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    if (timeSinceLastTap < doubleTapDelay) {
      // Double tap detected
      setTapCount(tapCount + 1);
      
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current);
      }
      
      // Execute after delay to allow for triple tap, etc.
      doubleTapTimerRef.current = setTimeout(() => {
        executePress(tapCount + 1);
        setTapCount(0);
      }, doubleTapDelay);
    } else {
      // Single tap
      setTapCount(1);
      
      doubleTapTimerRef.current = setTimeout(() => {
        if (tapCount === 1) {
          executePress(1);
        }
        setTapCount(0);
      }, doubleTapDelay);
    }
    
    setLastTapTime(now);
  }, [lastTapTime, doubleTapDelay, tapCount, executePress]);
  
  /**
   * Enhanced pan gesture handler with tremor compensation
   */
  const onPanGestureEvent = useCallback((event: any) => {
    const { translationX, translationY, state } = event.nativeEvent;
    const distance = Math.sqrt(translationX * translationX + translationY * translationY);
    
    if (state === State.BEGAN) {
      setIsPressed(true);
      
      // Start hold timer if configured
      if (effectiveHoldDelay > 0 && onLongPress) {
        holdTimerRef.current = setTimeout(() => {
          setIsHolding(true);
          if (hapticFeedback) {
            Vibration.vibrate([50, 20, 50]);
          }
        }, effectiveHoldDelay);
      }
    }
    
    if (state === State.ACTIVE) {
      // Check if movement exceeds tremor tolerance
      if (distance > tremorTolerance) {
        // Movement detected - may be intentional pan or tremor
        if (tremorCompensation) {
          // Implement tremor compensation algorithm
          const isLikelyTremor = isMovementLikelyTremor(translationX, translationY, event.nativeEvent.timestamp);
          
          if (isLikelyTremor) {
            // Ignore tremor movement
            return;
          }
        }
        
        // Clear hold timer for intentional movement
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
          setIsHolding(false);
        }
      }
    }
    
    if (state === State.END || state === State.CANCELLED) {
      setIsPressed(false);
      
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      
      if (isHolding && onLongPress) {
        setIsHolding(false);
        onLongPress();
        return;
      }
      
      // Handle tap/press if within tolerance
      if (distance <= tremorTolerance && !isHolding && onPress) {
        handleTap();
      }
      
      setIsHolding(false);
    }
  }, [effectiveHoldDelay, tremorTolerance, tremorCompensation, onPress, onLongPress, isHolding, handleTap, hapticFeedback]);
  
  /**
   * Tremor detection algorithm
   */
  const isMovementLikelyTremor = (x: number, y: number, timestamp: number): boolean => {
    // Simple tremor detection based on movement patterns
    // In a real implementation, this would be more sophisticated
    const movement = Math.sqrt(x * x + y * y);
    const frequency = 1000 / timestamp; // Rough frequency calculation
    
    // Typical tremor characteristics: 4-12 Hz frequency, small amplitude
    return movement < 20 && frequency >= 4 && frequency <= 12;
  };
  
  /**
   * One-handed optimization styles
   */
  const getOneHandedStyles = () => {
    if (!oneHandedOptimized && preferences.motorAccessibility.oneHandedMode === 'off') {
      return {};
    }
    
    const { width, height } = Dimensions.get('window');
    const isLeftHanded = preferences.motorAccessibility.oneHandedMode === 'left';
    
    // Position elements within thumb reach
    const thumbReachRadius = width * 0.4; // Approximate thumb reach
    
    return {
      alignSelf: (isLeftHanded ? 'flex-start' : 'flex-end') as 'flex-start' | 'flex-end',
      maxWidth: thumbReachRadius,
    };
  };
  
  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onPanGestureEvent}
      enabled={!disabled}
      shouldCancelWhenOutside={false}
      minDist={tremorTolerance}
    >
      <View
        style={[
          {
            minHeight: effectiveTouchTarget,
            minWidth: effectiveTouchTarget,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: disabled ? 0.5 : 1,
            backgroundColor: isPressed 
              ? (enhancedFeedback ? '#E3F2FD' : 'transparent')
              : 'transparent',
            borderWidth: enhancedFeedback && isPressed ? 2 : 0,
            borderColor: '#2196F3',
            borderRadius: 8,
          },
          getOneHandedStyles(),
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityHint={
          tremorCompensation 
            ? "Touch target with tremor compensation enabled" 
            : "Enhanced touch target"
        }
      >
        {children}
      </View>
    </PanGestureHandler>
  );
};

/**
 * Switch Control Navigation Component
 */
interface SwitchControlProps {
  items: {
    id: string;
    label: string;
    action: () => void;
    disabled?: boolean;
  }[];
  scanningSpeed?: number;
  onSelectionChange?: (itemId: string) => void;
}

export const SwitchControlNavigator: React.FC<SwitchControlProps> = ({
  items,
  scanningSpeed = 2000,
  onSelectionChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isWaitingForSelection, setIsWaitingForSelection] = useState(false);
  
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accessibilityManager = AccessibilityManager.getInstance();
  const preferences = accessibilityManager.getPreferences();
  
  const effectiveScanSpeed = preferences.motorAccessibility.switchControlEnabled
    ? preferences.motorAccessibility.switchScanningSpeed * 1000
    : scanningSpeed;
  
  /**
   * Scan to next item
   */
  const scanToNextItem = useCallback(() => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
    }
    
    scanTimerRef.current = setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % items.length;
        
        // Skip disabled items
        if (items[nextIndex]?.disabled) {
          return (nextIndex + 1) % items.length;
        }
        
        // Announce current item
        accessibilityManager.announceForAccessibility(
          `Scanning: ${items[nextIndex]?.label}`,
          'medium'
        );
        
        onSelectionChange?.(items[nextIndex]?.id);
        
        return nextIndex;
      });
      
      if (isScanning) {
        scanToNextItem();
      }
    }, effectiveScanSpeed);
  }, [items, effectiveScanSpeed, isScanning, onSelectionChange, accessibilityManager]);

  /**
   * Start switch scanning
   */
  const startScanning = useCallback(() => {
    if (!preferences.motorAccessibility.switchControlEnabled) return;
    
    setIsScanning(true);
    setCurrentIndex(0);
    
    // Announce scanning start
    accessibilityManager.announceForAccessibility(
      'Switch scanning started. Press switch to select.',
      'high'
    );
    
    scanToNextItem();
  }, [preferences.motorAccessibility.switchControlEnabled, accessibilityManager, scanToNextItem]);
  
  /**
   * Handle switch press
   */
  const handleSwitchPress = useCallback(() => {
    if (!isScanning) {
      startScanning();
      return;
    }
    
    // Select current item
    const currentItem = items[currentIndex];
    if (currentItem && !currentItem.disabled) {
      setIsScanning(false);
      setIsWaitingForSelection(true);
      
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }
      
      // Announce selection
      accessibilityManager.announceForAccessibility(
        `Selected: ${currentItem.label}`,
        'high'
      );
      
      // Execute action after brief delay
      setTimeout(() => {
        currentItem.action();
        setIsWaitingForSelection(false);
      }, 500);
    }
  }, [isScanning, currentIndex, items, startScanning, accessibilityManager]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
    };
  }, []);
  
  // Auto-start scanning if switch control is enabled
  useEffect(() => {
    if (preferences.motorAccessibility.switchControlEnabled) {
      startScanning();
    }
  }, [preferences.motorAccessibility.switchControlEnabled, startScanning]);
  
  return (
    <View style={{ padding: 16 }}>
      {/* Switch Control Instructions */}
      {preferences.motorAccessibility.switchControlEnabled && (
        <View
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Switch control active. Press your switch to start scanning or select highlighted item."
          style={{
            backgroundColor: '#E8F5E8',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        />
      )}
      
      {/* Navigation Items */}
      {items.map((item, index) => (
        <MotorAccessibleTouchTarget
          key={item.id}
          onPress={item.action}
          disabled={item.disabled}
          enhancedFeedback={true}
          hapticFeedback={true}
        >
          <View
            style={[
              {
                padding: 16,
                backgroundColor: '#F5F5F5',
                borderRadius: 8,
                marginVertical: 4,
                minHeight: 60,
                justifyContent: 'center',
                alignItems: 'center',
              },
              currentIndex === index && isScanning && {
                backgroundColor: '#2196F3',
                borderWidth: 3,
                borderColor: '#1976D2',
              },
              isWaitingForSelection && currentIndex === index && {
                backgroundColor: '#4CAF50',
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{
              disabled: item.disabled,
              selected: currentIndex === index && isScanning,
            }}
          >
            <Text
              style={[
                { fontSize: 16, textAlign: 'center' },
                currentIndex === index && isScanning && { color: 'white', fontWeight: 'bold' },
              ]}
            >
              {item.label}
            </Text>
          </View>
        </MotorAccessibleTouchTarget>
      ))}
      
      {/* Manual Switch Control Trigger */}
      {preferences.motorAccessibility.switchControlEnabled && (
        <MotorAccessibleTouchTarget
          onPress={handleSwitchPress}
          enhancedFeedback={true}
          hapticFeedback={true}
        >
          <View
            style={{
              padding: 16,
              backgroundColor: '#FF9800',
              borderRadius: 8,
              marginTop: 16,
              alignItems: 'center',
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isScanning 
                ? "Select current item" 
                : "Start switch scanning"
            }
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              {isScanning ? 'SELECT' : 'START SCANNING'}
            </Text>
          </View>
        </MotorAccessibleTouchTarget>
      )}
    </View>
  );
};

/**
 * Voice Control Integration
 */
interface VoiceControlProps {
  commands: {
    phrase: string;
    action: () => void;
    description: string;
  }[];
  onCommandRecognized?: (command: string) => void;
}

export const VoiceControlProvider: React.FC<VoiceControlProps & { children: React.ReactNode }> = ({
  commands,
  children,
  onCommandRecognized,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  
  const accessibilityManager = AccessibilityManager.getInstance();
  const preferences = accessibilityManager.getPreferences();
  
  /**
   * Start voice recognition
   */
  const startListening = useCallback(() => {
    if (!preferences.motorAccessibility.voiceControlEnabled) return;
    
    setIsListening(true);
    
    // Announce voice control activation
    accessibilityManager.announceForAccessibility(
      'Voice control activated. Say a command.',
      'high'
    );
    
    // In a real implementation, this would integrate with speech recognition
    // For now, we'll simulate the interface
    console.log('Voice control listening started');
  }, [preferences.motorAccessibility.voiceControlEnabled, accessibilityManager]);
  
  /**
   * Process recognized speech
   */
  const processRecognizedSpeech = useCallback((text: string) => {
    setRecognizedText(text);
    
    // Find matching command
    const matchedCommand = commands.find(cmd =>
      text.toLowerCase().includes(cmd.phrase.toLowerCase())
    );
    
    if (matchedCommand) {
      // Execute command
      accessibilityManager.announceForAccessibility(
        `Executing: ${matchedCommand.description}`,
        'high'
      );
      
      matchedCommand.action();
      onCommandRecognized?.(matchedCommand.phrase);
    } else {
      // No command matched
      accessibilityManager.announceForAccessibility(
        'Command not recognized. Try again.',
        'medium'
      );
    }
    
    setIsListening(false);
  }, [commands, onCommandRecognized, accessibilityManager]);
  
  return (
    <View style={{ flex: 1 }}>
      {/* Voice Control Status */}
      {preferences.motorAccessibility.voiceControlEnabled && (
        <View
          style={{
            position: 'absolute',
            top: 40,
            left: 16,
            right: 16,
            backgroundColor: isListening ? '#4CAF50' : '#2196F3',
            padding: 12,
            borderRadius: 8,
            zIndex: 1000,
          }}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={
            isListening 
              ? "Voice control is listening" 
              : "Voice control is available"
          }
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {isListening ? 'Listening...' : 'Voice Control Ready'}
          </Text>
          {recognizedText && (
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
              "{recognizedText}"
            </Text>
          )}
        </View>
      )}
      
      {children}
      
      {/* Voice Control Trigger */}
      {preferences.motorAccessibility.voiceControlEnabled && (
        <MotorAccessibleTouchTarget
          onPress={startListening}
          enhancedFeedback={true}
          hapticFeedback={true}
        >
          <View
            style={{
              position: 'absolute',
              bottom: 80,
              right: 16,
              width: 60,
              height: 60,
              backgroundColor: isListening ? '#F44336' : '#2196F3',
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 8,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Voice control microphone"
            accessibilityHint={
              isListening 
                ? "Voice control is listening" 
                : "Tap to start voice control"
            }
          >
            <Text style={{ color: 'white', fontSize: 24 }}>🎤</Text>
          </View>
        </MotorAccessibleTouchTarget>
      )}
    </View>
  );
};

export default {
  MotorAccessibleTouchTarget,
  SwitchControlNavigator,
  VoiceControlProvider,
};