import { Platform, InteractionManager, AppState, DeviceEventEmitter } from 'react-native';
import { BlurView } from 'expo-blur';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

/**
 * iOS-specific performance optimizations for TailTracker
 * This module provides utilities and configurations for optimal iOS performance
 */

export class iOSPerformanceOptimizer {
  private static instance: iOSPerformanceOptimizer;
  private appStateChangeListeners: Array<(state: string) => void> = [];
  private backgroundTaskId: number | null = null;
  private performanceMetrics = {
    appLaunchTime: 0,
    memoryWarnings: 0,
    frameDrops: 0,
    locationUpdates: 0,
  };

  private constructor() {
    this.initializePerformanceMonitoring();
    this.setupAppStateHandling();
  }

  static getInstance(): iOSPerformanceOptimizer {
    if (!iOSPerformanceOptimizer.instance) {
      iOSPerformanceOptimizer.instance = new iOSPerformanceOptimizer();
    }
    return iOSPerformanceOptimizer.instance;
  }

  /**
   * Initialize performance monitoring for iOS
   */
  private initializePerformanceMonitoring(): void {
    if (Platform.OS !== 'ios') return;

    // Track app launch time
    this.performanceMetrics.appLaunchTime = Date.now();

    // Listen for memory warnings
    if (__DEV__) {
      DeviceEventEmitter.addListener('memoryWarning', this.handleMemoryWarning.bind(this));
    }
  }

  /**
   * Setup app state change handling for performance optimization
   */
  private setupAppStateHandling(): void {
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle app state changes for performance optimization
   */
  private handleAppStateChange(nextAppState: string): void {
    switch (nextAppState) {
      case 'background':
        this.onAppBackground();
        break;
      case 'active':
        this.onAppForeground();
        break;
      case 'inactive':
        this.onAppInactive();
        break;
    }

    // Notify registered listeners
    this.appStateChangeListeners.forEach(listener => listener(nextAppState));
  }

  /**
   * Optimize app when going to background
   */
  private onAppBackground(): void {
    // Pause non-essential operations
    this.pauseNonEssentialOperations();
    
    // Setup background task for critical operations
    this.startBackgroundTask();
    
    // Reduce memory footprint
    this.optimizeMemoryUsage();
  }

  /**
   * Restore full functionality when app becomes active
   */
  private onAppForeground(): void {
    // Resume all operations
    this.resumeOperations();
    
    // End background task
    this.endBackgroundTask();
    
    // Refresh critical data
    this.refreshCriticalData();
  }

  /**
   * Handle app inactive state (e.g., during phone calls)
   */
  private onAppInactive(): void {
    // Pause animations and reduce CPU usage
    this.pauseAnimations();
  }

  /**
   * Pause non-essential operations to save battery and CPU
   */
  private pauseNonEssentialOperations(): void {
    // Pause location updates (except for critical tracking)
    this.reduceLocationUpdateFrequency();
    
    // Pause analytics and non-critical network requests
    this.pauseAnalytics();
    
    // Reduce push notification processing
    this.reducePushNotificationProcessing();
  }

  /**
   * Resume all operations when app becomes active
   */
  private resumeOperations(): void {
    // Resume normal location updates
    this.resumeLocationUpdates();
    
    // Resume analytics
    this.resumeAnalytics();
    
    // Resume normal push notification processing
    this.resumePushNotificationProcessing();
  }

  /**
   * Start background task for critical operations
   */
  private startBackgroundTask(): void {
    if (Platform.OS !== 'ios') return;

    // Use iOS background task to maintain critical operations
    this.backgroundTaskId = BackgroundFetch.startBackgroundTaskAsync();
  }

  /**
   * End background task
   */
  private endBackgroundTask(): void {
    if (Platform.OS !== 'ios' || this.backgroundTaskId === null) return;

    BackgroundFetch.endBackgroundTaskAsync(this.backgroundTaskId);
    this.backgroundTaskId = null;
  }

  /**
   * Optimize memory usage for better performance
   */
  private optimizeMemoryUsage(): void {
    // Clear image caches for non-visible content
    this.clearNonEssentialImageCaches();
    
    // Reduce data structures in memory
    this.compactDataStructures();
    
    // Force garbage collection if possible
    if (global.gc && __DEV__) {
      global.gc();
    }
  }

  /**
   * Handle memory warnings from iOS
   */
  private handleMemoryWarning(): void {
    console.warn('iOS Memory Warning - Optimizing memory usage');
    this.performanceMetrics.memoryWarnings++;
    
    // Aggressive memory cleanup
    this.clearNonEssentialImageCaches();
    this.compactDataStructures();
    this.clearCaches();
    
    // Notify components to reduce memory usage
    DeviceEventEmitter.emit('memoryPressure', { level: 'high' });
  }

  /**
   * Optimize location updates for battery efficiency
   */
  private reduceLocationUpdateFrequency(): void {
    // Switch to significant location changes only
    DeviceEventEmitter.emit('locationOptimization', { 
      mode: 'battery', 
      updateInterval: 300000 // 5 minutes 
    });
  }

  /**
   * Resume normal location update frequency
   */
  private resumeLocationUpdates(): void {
    DeviceEventEmitter.emit('locationOptimization', { 
      mode: 'normal', 
      updateInterval: 30000 // 30 seconds 
    });
  }

  /**
   * Clear non-essential image caches
   */
  private clearNonEssentialImageCaches(): void {
    // Emit event for image cache clearing
    DeviceEventEmitter.emit('clearImageCache', { essential: false });
  }

  /**
   * Compact data structures to save memory
   */
  private compactDataStructures(): void {
    // Emit event for data structure optimization
    DeviceEventEmitter.emit('compactData', { aggressive: false });
  }

  /**
   * Clear various caches
   */
  private clearCaches(): void {
    DeviceEventEmitter.emit('clearCaches', { 
      types: ['network', 'analytics', 'temporary'] 
    });
  }

  /**
   * Pause animations to save CPU
   */
  private pauseAnimations(): void {
    DeviceEventEmitter.emit('pauseAnimations', { pause: true });
  }

  /**
   * Pause analytics collection
   */
  private pauseAnalytics(): void {
    DeviceEventEmitter.emit('analyticsControl', { enabled: false });
  }

  /**
   * Resume analytics collection
   */
  private resumeAnalytics(): void {
    DeviceEventEmitter.emit('analyticsControl', { enabled: true });
  }

  /**
   * Reduce push notification processing
   */
  private reducePushNotificationProcessing(): void {
    DeviceEventEmitter.emit('pushNotificationControl', { 
      processing: 'reduced' 
    });
  }

  /**
   * Resume normal push notification processing
   */
  private resumePushNotificationProcessing(): void {
    DeviceEventEmitter.emit('pushNotificationControl', { 
      processing: 'normal' 
    });
  }

  /**
   * Refresh critical data when app becomes active
   */
  private refreshCriticalData(): void {
    // Use InteractionManager to wait for animations to complete
    InteractionManager.runAfterInteractions(() => {
      DeviceEventEmitter.emit('refreshCriticalData', { 
        types: ['location', 'notifications', 'petStatus'] 
      });
    });
  }

  /**
   * Register app state change listener
   */
  addAppStateListener(callback: (state: string) => void): () => void {
    this.appStateChangeListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.appStateChangeListeners.indexOf(callback);
      if (index > -1) {
        this.appStateChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      appUptimeMs: Date.now() - this.performanceMetrics.appLaunchTime,
    };
  }

  /**
   * Configure background fetch for iOS
   */
  async configureBackgroundFetch(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    try {
      await BackgroundFetch.registerTaskAsync('BACKGROUND_FETCH_TASK', {
        minimumInterval: 15 * 60 * 1000, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      await BackgroundFetch.setMinimumIntervalAsync(15 * 60 * 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to configure background fetch:', error);
      return false;
    }
  }

  /**
   * Optimize for low power mode
   */
  optimizeForLowPowerMode(): void {
    if (Platform.OS !== 'ios') return;

    // Reduce update frequencies
    this.reduceLocationUpdateFrequency();
    
    // Disable non-essential animations
    DeviceEventEmitter.emit('disableAnimations', { 
      types: ['decorative', 'transitions'] 
    });
    
    // Reduce network requests
    DeviceEventEmitter.emit('networkOptimization', { 
      mode: 'lowPower' 
    });
    
    // Use static UI elements where possible
    DeviceEventEmitter.emit('uiOptimization', { 
      mode: 'static' 
    });
  }

  /**
   * Restore normal power mode
   */
  restoreNormalPowerMode(): void {
    if (Platform.OS !== 'ios') return;

    this.resumeLocationUpdates();
    
    DeviceEventEmitter.emit('enableAnimations', { 
      types: ['all'] 
    });
    
    DeviceEventEmitter.emit('networkOptimization', { 
      mode: 'normal' 
    });
    
    DeviceEventEmitter.emit('uiOptimization', { 
      mode: 'dynamic' 
    });
  }

  /**
   * Optimize image loading and caching
   */
  optimizeImageHandling(): void {
    DeviceEventEmitter.emit('imageOptimization', {
      cacheSize: 100, // MB
      compressionQuality: 0.8,
      enableWebP: true,
      lazyLoading: true,
      placeholder: true,
    });
  }

  /**
   * Optimize list rendering performance
   */
  optimizeListRendering(): object {
    return {
      // FlatList optimizations for iOS
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 50,
      initialNumToRender: 10,
      windowSize: 21,
      getItemLayout: (data: any[], index: number) => ({
        length: 80, // Estimated item height
        offset: 80 * index,
        index,
      }),
    };
  }

  /**
   * Optimize networking for iOS
   */
  optimizeNetworking(): void {
    DeviceEventEmitter.emit('networkOptimization', {
      connectionPooling: true,
      requestDeduplication: true,
      cachePolicy: 'aggressive',
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
      },
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Remove listeners
    this.appStateChangeListeners = [];
    
    // End any active background tasks
    if (this.backgroundTaskId) {
      this.endBackgroundTask();
    }
    
    // Clear performance metrics
    this.performanceMetrics = {
      appLaunchTime: 0,
      memoryWarnings: 0,
      frameDrops: 0,
      locationUpdates: 0,
    };
  }
}

/**
 * Performance optimization utilities for iOS components
 */
export class iOSComponentOptimizer {
  /**
   * Create optimized blur view configuration for iOS
   */
  static getOptimizedBlurViewProps(intensity: number = 80) {
    if (Platform.OS !== 'ios') {
      return null;
    }

    return {
      intensity,
      tint: 'default' as const,
      reducedTransparencyFallbackColor: '#F2F2F7',
    };
  }

  /**
   * Get optimized scroll view props for iOS
   */
  static getOptimizedScrollViewProps() {
    return Platform.select({
      ios: {
        showsVerticalScrollIndicator: true,
        indicatorStyle: 'default' as const,
        contentInsetAdjustmentBehavior: 'automatic' as const,
        bounces: true,
        bouncesZoom: false,
        scrollEventThrottle: 16,
        decelerationRate: 'normal' as const,
      },
      default: {},
    });
  }

  /**
   * Get optimized text input props for iOS
   */
  static getOptimizedTextInputProps() {
    return Platform.select({
      ios: {
        clearButtonMode: 'while-editing' as const,
        keyboardAppearance: 'default' as const,
        returnKeyType: 'done' as const,
        enablesReturnKeyAutomatically: true,
        textContentType: 'none' as const,
        smartInsertDelete: false,
        spellCheck: true,
      },
      default: {},
    });
  }

  /**
   * Create performance-optimized style for iOS
   */
  static createOptimizedStyle(baseStyle: object) {
    return Platform.select({
      ios: {
        ...baseStyle,
        // Enable hardware acceleration
        transform: [{ translateZ: 0 }],
        // Optimize shadows for performance
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        // Use RGB colors for better performance
        shadowColor: '#000000',
      },
      default: baseStyle,
    });
  }

  /**
   * Get optimized animation configuration for iOS
   */
  static getOptimizedAnimationConfig() {
    return Platform.select({
      ios: {
        useNativeDriver: true,
        duration: 250,
        easing: 'easeInOut' as const,
        // Reduce motion if accessibility setting is enabled
        reduceMotion: true,
      },
      default: {
        useNativeDriver: false,
        duration: 300,
      },
    });
  }
}

/**
 * Location optimization utilities for iOS
 */
export class iOSLocationOptimizer {
  /**
   * Get battery-optimized location configuration
   */
  static getBatteryOptimizedLocationConfig() {
    return Platform.select({
      ios: {
        accuracy: 5, // LocationAccuracy.Balanced
        timeInterval: 30000, // 30 seconds
        distanceInterval: 50, // 50 meters
        deferredUpdatesInterval: 300000, // 5 minutes
        deferredUpdatesDistance: 500, // 500 meters
      },
      default: {
        accuracy: 6,
        timeInterval: 10000,
        distanceInterval: 10,
      },
    });
  }

  /**
   * Get high-accuracy location configuration for critical tracking
   */
  static getHighAccuracyLocationConfig() {
    return Platform.select({
      ios: {
        accuracy: 6, // LocationAccuracy.BestForNavigation
        timeInterval: 5000, // 5 seconds
        distanceInterval: 5, // 5 meters
        pausesLocationUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      },
      default: {
        accuracy: 6,
        timeInterval: 5000,
        distanceInterval: 5,
      },
    });
  }
}

// Export singleton instance
export const iOSPerformance = iOSPerformanceOptimizer.getInstance();