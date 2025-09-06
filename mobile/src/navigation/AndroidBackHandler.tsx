import React, { useEffect, useCallback, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationState, useFocusEffect } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { modalService } from '../services/modalService';

const DOUBLE_BACK_EXIT_KEY = '@TailTracker:double_back_exit_enabled';
const BACK_PRESS_TIMEOUT = 2000; // 2 seconds

interface BackHandlerConfig {
  enableDoubleBackToExit?: boolean;
  customExitMessage?: string;
  preventBack?: boolean;
  onBackPress?: () => boolean; // Return true to prevent default behavior
  confirmExit?: boolean;
  confirmExitMessage?: string;
  homeScreenNames?: string[]; // Screen names that should trigger exit behavior
}

// Global back handler state management
class AndroidBackHandlerManager {
  private handlers: Map<string, BackHandlerConfig> = new Map();
  private backPressCount = 0;
  private backPressTimer: NodeJS.Timeout | null = null;
  private doubleBackExitEnabled = true;

  constructor() {
    this.setupBackHandler();
    this.loadSettings();
  }

  private setupBackHandler(): void {
    if (Platform.OS !== 'android') return;

    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress.bind(this));
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(DOUBLE_BACK_EXIT_KEY);
      this.doubleBackExitEnabled = stored !== null ? JSON.parse(stored) : true;
    } catch (error) {
      console.error('Error loading back handler settings:', error);
    }
  }

  async setDoubleBackExitEnabled(enabled: boolean): Promise<void> {
    try {
      this.doubleBackExitEnabled = enabled;
      await AsyncStorage.setItem(DOUBLE_BACK_EXIT_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving back handler settings:', error);
    }
  }

  registerHandler(screenId: string, config: BackHandlerConfig): void {
    this.handlers.set(screenId, config);
  }

  unregisterHandler(screenId: string): void {
    this.handlers.delete(screenId);
  }

  private handleBackPress(): boolean {
    // Find the active handler
    const activeHandler = this.getActiveHandler();
    
    if (activeHandler) {
      const { config } = activeHandler;

      // Check if back press should be prevented
      if (config.preventBack) {
        return true; // Prevent default behavior
      }

      // Check for custom back press handler
      if (config.onBackPress) {
        const customHandled = config.onBackPress();
        if (customHandled) {
          return true; // Custom handler handled the back press
        }
      }

      // Check if this is a home screen and double back exit is enabled
      if (config.enableDoubleBackToExit && this.doubleBackExitEnabled) {
        return this.handleDoubleBackToExit(config);
      }

      // Check for exit confirmation
      if (config.confirmExit) {
        this.showExitConfirmation(config);
        return true; // Prevent immediate exit
      }
    }

    return false; // Allow default behavior
  }

  private getActiveHandler(): { screenId: string; config: BackHandlerConfig } | null {
    // In a real implementation, you'd get the current screen from navigation state
    // For now, we'll return the first handler (would need navigation context)
    const [screenId, config] = Array.from(this.handlers.entries())[0] || [null, null];
    return screenId && config ? { screenId, config } : null;
  }

  private handleDoubleBackToExit(config: BackHandlerConfig): boolean {
    if (this.backPressCount === 0) {
      this.backPressCount = 1;
      
      const message = config.customExitMessage || 'Press back again to exit TailTracker';
      ToastAndroid.show(message, ToastAndroid.SHORT);

      this.backPressTimer = setTimeout(() => {
        this.backPressCount = 0;
      }, BACK_PRESS_TIMEOUT);

      return true; // Prevent exit on first press
    } else {
      // Second press within timeout - exit app
      if (this.backPressTimer) {
        clearTimeout(this.backPressTimer);
        this.backPressTimer = null;
      }
      this.backPressCount = 0;
      BackHandler.exitApp();
      return true;
    }
  }

  private showExitConfirmation(config: BackHandlerConfig): void {
    const message = config.confirmExitMessage || 'Are you sure you want to exit TailTracker?';
    
    modalService.showConfirm(
      'Exit App',
      message,
      () => BackHandler.exitApp(),
      'Exit',
      'Cancel',
      true,
      'alert-circle-outline'
    );
  }

  destroy(): void {
    if (this.backPressTimer) {
      clearTimeout(this.backPressTimer);
    }
    this.handlers.clear();
  }
}

// Global instance
const backHandlerManager = new AndroidBackHandlerManager();

// Hook for using Android back handler in components
export const useAndroidBackHandler = (config: BackHandlerConfig = {}) => {
  const navigation = useNavigation();
  const screenIdRef = useRef<string>(`screen_${Math.random()}`);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const screenId = screenIdRef.current;
      backHandlerManager.registerHandler(screenId, config);

      return () => {
        backHandlerManager.unregisterHandler(screenId);
      };
    }, [config])
  );

  const setDoubleBackExitEnabled = useCallback(async (enabled: boolean) => {
    await backHandlerManager.setDoubleBackExitEnabled(enabled);
  }, []);

  return {
    setDoubleBackExitEnabled,
  };
};

// Hook for navigation-aware back handling
export const useNavigationBackHandler = () => {
  const navigation = useNavigation();

  const handleBackPress = useCallback((): boolean => {
    const state = navigation.getState();
    
    // Check if we can go back in current navigator
    if (state.index > 0) {
      navigation.goBack();
      return true; // Handled
    }

    // Check if we're in a nested navigator
    const currentRoute = state.routes[state.index];
    if (currentRoute.state && currentRoute.state.index > 0) {
      navigation.goBack();
      return true; // Handled
    }

    // Check if we're on a tab and can switch to home tab
    if (state.type === 'tab' && state.index !== 0) {
      navigation.dispatch(
        CommonActions.navigate({
          name: state.routeNames[0], // Navigate to first tab (usually home)
        })
      );
      return true; // Handled
    }

    return false; // Let default behavior handle it
  }, [navigation]);

  return { handleBackPress };
};

// Component for handling back button in specific screens
export const AndroidBackHandlerProvider: React.FC<{
  children: React.ReactNode;
  config?: BackHandlerConfig;
}> = ({ children, config = {} }) => {
  useAndroidBackHandler(config);
  return <>{children}</>;
};

// Higher-order component for adding back handler to screens
export const withAndroidBackHandler = <P extends object>(
  Component: React.ComponentType<P>,
  config: BackHandlerConfig = {}
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <AndroidBackHandlerProvider config={config}>
      <Component {...props} ref={ref} />
    </AndroidBackHandlerProvider>
  ));
};

// Predefined configurations for common scenarios
export const BackHandlerConfigs = {
  // Home screen with double back to exit
  homeScreen: {
    enableDoubleBackToExit: true,
    customExitMessage: 'Press back again to exit TailTracker',
  },

  // Modal or overlay screen that should prevent back navigation
  modal: {
    preventBack: true,
  },

  // Form screen with unsaved changes
  unsavedForm: {
    confirmExit: true,
    confirmExitMessage: 'You have unsaved changes. Are you sure you want to go back?',
  },

  // Critical process that shouldn't be interrupted
  criticalProcess: {
    preventBack: true,
  },

  // Settings screen
  settings: {
    enableDoubleBackToExit: false,
  },

  // Emergency/SOS screen
  emergency: {
    confirmExit: true,
    confirmExitMessage: 'Are you sure you want to exit emergency mode?',
  },

  // Pet setup/onboarding
  petSetup: {
    confirmExit: true,
    confirmExitMessage: 'Your pet profile is not complete. Exit anyway?',
  },

  // Photo capture screen
  photoCapture: {
    onBackPress: () => {
      // Custom logic for photo capture cleanup
      // Return true to handle, false to allow default
      return false;
    },
  },
} as const;

// Utility functions for common back button scenarios
export const AndroidBackUtils = {
  /**
   * Exit app with confirmation
   */
  exitWithConfirmation: (message?: string) => {
    const confirmMessage = message || 'Are you sure you want to exit TailTracker?';
    modalService.showConfirm(
      'Exit App',
      confirmMessage,
      () => BackHandler.exitApp(),
      'Exit',
      'Cancel',
      true,
      'alert-circle-outline'
    );
  },

  /**
   * Exit app immediately
   */
  exitApp: () => {
    BackHandler.exitApp();
  },

  /**
   * Show double back toast
   */
  showDoubleBackToast: (message?: string) => {
    const toastMessage = message || 'Press back again to exit';
    ToastAndroid.show(toastMessage, ToastAndroid.SHORT);
  },

  /**
   * Handle unsaved changes
   */
  handleUnsavedChanges: (
    hasUnsavedChanges: boolean,
    onSave?: () => Promise<void>,
    onDiscard?: () => void
  ): boolean => {
    if (!hasUnsavedChanges) {
      return false; // Allow normal back behavior
    }

    const actions = [
      {
        text: 'Cancel',
        style: 'cancel' as const,
        onPress: () => {},
      },
      {
        text: 'Discard',
        style: 'destructive' as const,
        onPress: onDiscard || (() => {}),
      },
    ];

    if (onSave) {
      actions.push({
        text: 'Save',
        style: 'primary' as const,
        onPress: async () => {
          try {
            await onSave();
          } catch (error) {
            console.error('Error saving:', error);
          }
        },
      });
    }

    modalService.showModal({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. What would you like to do?',
      type: 'warning',
      icon: 'alert-circle-outline',
      actions,
    });

    return true; // Prevent default back behavior
  },

  /**
   * Navigate to home and reset stack
   */
  navigateToHome: (navigation: any) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      })
    );
  },

  /**
   * Smart back navigation
   */
  smartGoBack: (navigation: any): boolean => {
    const state = navigation.getState();
    
    // If we can go back, do it
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }

    // If we're on a non-home tab, go to home tab
    if (state.type === 'tab' && state.index !== 0) {
      navigation.navigate(state.routeNames[0]);
      return true;
    }

    return false; // Can't handle, let default behavior take over
  },
};

// Context for providing back handler state to child components
export interface BackHandlerContextType {
  isDoubleBackExitEnabled: boolean;
  setDoubleBackExitEnabled: (enabled: boolean) => Promise<void>;
  exitApp: () => void;
  exitWithConfirmation: (message?: string) => void;
}

export const BackHandlerContext = React.createContext<BackHandlerContextType | undefined>(undefined);

export const useBackHandlerContext = (): BackHandlerContextType => {
  const context = React.useContext(BackHandlerContext);
  if (!context) {
    throw new Error('useBackHandlerContext must be used within a BackHandlerProvider');
  }
  return context;
};

export const BackHandlerContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDoubleBackExitEnabled, setIsDoubleBackExitEnabledState] = React.useState(true);

  const setDoubleBackExitEnabled = React.useCallback(async (enabled: boolean) => {
    await backHandlerManager.setDoubleBackExitEnabled(enabled);
    setIsDoubleBackExitEnabledState(enabled);
  }, []);

  const contextValue: BackHandlerContextType = {
    isDoubleBackExitEnabled,
    setDoubleBackExitEnabled,
    exitApp: AndroidBackUtils.exitApp,
    exitWithConfirmation: AndroidBackUtils.exitWithConfirmation,
  };

  return (
    <BackHandlerContext.Provider value={contextValue}>
      {children}
    </BackHandlerContext.Provider>
  );
};

export default backHandlerManager;