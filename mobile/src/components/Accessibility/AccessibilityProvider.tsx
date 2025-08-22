import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

interface AccessibilityContextType {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
  announceForAccessibility: (message: string) => void;
  focusOnElement: (element: any) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);

  useEffect(() => {
    // Check initial accessibility states
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
    }

    // Set up listeners
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    let reduceMotionListener: any;
    if (Platform.OS === 'ios') {
      reduceMotionListener = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setIsReduceMotionEnabled
      );
    }

    return () => {
      screenReaderListener?.remove();
      reduceMotionListener?.remove();
    };
  }, []);

  const announceForAccessibility = (message: string) => {
    if (isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const focusOnElement = (element: any) => {
    if (isScreenReaderEnabled && element) {
      AccessibilityInfo.setAccessibilityFocus(element);
    }
  };

  const value: AccessibilityContextType = {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isHighContrastEnabled,
    announceForAccessibility,
    focusOnElement,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;