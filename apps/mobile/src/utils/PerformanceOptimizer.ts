import React, { useEffect, useState } from 'react';
import { Platform, Dimensions, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

/**
 * Performance Optimizer Utility
 * Provides device-specific optimizations and performance monitoring
 */

export interface DeviceCapabilities {
  isLowEndDevice: boolean;
  memoryClass: 'low' | 'medium' | 'high';
  networkClass: '2g' | '3g' | '4g' | '5g';
  renderingTier: 'basic' | 'standard' | 'premium';
}

export interface PerformanceSettings {
  enableAnimations: boolean;
  enableGradients: boolean;
  maxConcurrentImages: number;
  imageQuality: number;
  cacheSize: number;
  enableBlur: boolean;
  enableShadows: boolean;
}

class PerformanceOptimizerService {
  private deviceCapabilities: DeviceCapabilities | null = null;
  private performanceSettings: PerformanceSettings | null = null;
  private performanceMetrics: Map<string, number[]> = new Map();

  /**
   * Initialize performance optimizer with device detection
   */
  async initialize(): Promise<void> {
    try {
      this.deviceCapabilities = await this.detectDeviceCapabilities();
      this.performanceSettings = this.generateOptimalSettings(
        this.deviceCapabilities
      );
      await this.saveSettings();
    } catch (error) {
      console.error('Performance optimizer initialization failed:', error);
      // Use safe defaults
      this.deviceCapabilities = this.getDefaultCapabilities();
      this.performanceSettings = this.getDefaultSettings();
    }
  }

  /**
   * Detect device capabilities for optimization
   */
  private async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    const { width, height } = Dimensions.get('screen');
    const screenSize = width * height;

    // Memory detection (simplified - would use native modules in production)
    let memoryClass: DeviceCapabilities['memoryClass'] = 'medium';
    try {
      const deviceInfo = await Device.getDeviceTypeAsync();
      const isTablet = deviceInfo === Device.DeviceType.TABLET;

      // Rough memory estimation based on device characteristics
      if (Platform.OS === 'ios') {
        // iOS devices generally have better memory management
        if (screenSize > 1800000 || isTablet) {
          // iPad or iPhone Pro
          memoryClass = 'high';
        } else if (screenSize > 1000000) {
          // Standard iPhone
          memoryClass = 'medium';
        } else {
          // Older devices
          memoryClass = 'low';
        }
      } else {
        // Android device memory estimation
        if (screenSize > 2000000 && isTablet) {
          memoryClass = 'high';
        } else if (screenSize > 1500000) {
          memoryClass = 'medium';
        } else {
          memoryClass = 'low';
        }
      }
    } catch (error) {
      console.warn('Could not detect device memory class:', error);
    }

    // Network class detection (would integrate with NetInfo in production)
    const networkClass: DeviceCapabilities['networkClass'] = '4g'; // Default assumption

    // Determine rendering tier based on device capabilities
    let renderingTier: DeviceCapabilities['renderingTier'] = 'standard';
    if (memoryClass === 'low' || screenSize < 1000000) {
      renderingTier = 'basic';
    } else if (memoryClass === 'high' && screenSize > 2000000) {
      renderingTier = 'premium';
    }

    return {
      isLowEndDevice: memoryClass === 'low',
      memoryClass,
      networkClass,
      renderingTier,
    };
  }

  /**
   * Generate optimal performance settings based on device capabilities
   */
  private generateOptimalSettings(
    capabilities: DeviceCapabilities
  ): PerformanceSettings {
    const baseSettings: PerformanceSettings = {
      enableAnimations: true,
      enableGradients: true,
      maxConcurrentImages: 10,
      imageQuality: 0.8,
      cacheSize: 50 * 1024 * 1024, // 50MB
      enableBlur: true,
      enableShadows: true,
    };

    // Optimize based on device capabilities
    switch (capabilities.renderingTier) {
      case 'basic':
        return {
          ...baseSettings,
          enableAnimations: false,
          enableGradients: false,
          maxConcurrentImages: 5,
          imageQuality: 0.6,
          cacheSize: 20 * 1024 * 1024, // 20MB
          enableBlur: false,
          enableShadows: false,
        };

      case 'standard':
        return {
          ...baseSettings,
          enableAnimations: true,
          enableGradients: true,
          maxConcurrentImages: 8,
          imageQuality: 0.7,
          cacheSize: 35 * 1024 * 1024, // 35MB
          enableBlur: false, // Disable blur for better performance
          enableShadows: true,
        };

      case 'premium':
        return {
          ...baseSettings,
          enableAnimations: true,
          enableGradients: true,
          maxConcurrentImages: 15,
          imageQuality: 0.9,
          cacheSize: 75 * 1024 * 1024, // 75MB
          enableBlur: true,
          enableShadows: true,
        };

      default:
        return baseSettings;
    }
  }

  /**
   * Get current performance settings
   */
  getSettings(): PerformanceSettings {
    return this.performanceSettings || this.getDefaultSettings();
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return this.deviceCapabilities || this.getDefaultCapabilities();
  }

  /**
   * Track performance metric
   */
  trackMetric(name: string, value: number): void {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }

    const metrics = this.performanceMetrics.get(name)!;
    metrics.push(value);

    // Keep only last 100 metrics to prevent memory bloat
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get average performance metric
   */
  getAverageMetric(name: string): number {
    const metrics = this.performanceMetrics.get(name);
    if (!metrics || metrics.length === 0) return 0;

    return metrics.reduce((sum, value) => sum + value, 0) / metrics.length;
  }

  /**
   * Check if animations should be enabled
   */
  shouldEnableAnimations(): boolean {
    return this.getSettings().enableAnimations;
  }

  /**
   * Check if gradients should be enabled
   */
  shouldEnableGradients(): boolean {
    return this.getSettings().enableGradients;
  }

  /**
   * Get optimal image quality setting
   */
  getImageQuality(): number {
    return this.getSettings().imageQuality;
  }

  /**
   * Get maximum concurrent images
   */
  getMaxConcurrentImages(): number {
    return this.getSettings().maxConcurrentImages;
  }

  /**
   * Get optimal cache size
   */
  getCacheSize(): number {
    return this.getSettings().cacheSize;
  }

  /**
   * Check if blur effects should be enabled
   */
  shouldEnableBlur(): boolean {
    return this.getSettings().enableBlur;
  }

  /**
   * Check if shadows should be enabled
   */
  shouldEnableShadows(): boolean {
    return this.getSettings().enableShadows;
  }

  /**
   * Update settings dynamically based on performance
   */
  adaptSettings(): void {
    const avgRenderTime = this.getAverageMetric('render_time');
    const avgMemoryUsage = this.getAverageMetric('memory_usage');

    if (!this.performanceSettings) return;

    // If render time is consistently high, reduce quality
    if (avgRenderTime > 16) {
      // 60fps threshold
      this.performanceSettings.enableAnimations = false;
      this.performanceSettings.enableGradients = false;
      this.performanceSettings.imageQuality = Math.max(
        0.5,
        this.performanceSettings.imageQuality - 0.1
      );
    }

    // If memory usage is high, reduce cache size
    if (avgMemoryUsage > 150 * 1024 * 1024) {
      // 150MB threshold
      this.performanceSettings.cacheSize = Math.max(
        10 * 1024 * 1024,
        this.performanceSettings.cacheSize * 0.8
      );
      this.performanceSettings.maxConcurrentImages = Math.max(
        3,
        this.performanceSettings.maxConcurrentImages - 2
      );
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        '@TailTracker:performance_settings',
        JSON.stringify({
          capabilities: this.deviceCapabilities,
          settings: this.performanceSettings,
        })
      );
    } catch (error) {
      console.warn('Failed to save performance settings:', error);
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(
        '@TailTracker:performance_settings'
      );
      if (stored) {
        const { capabilities, settings } = JSON.parse(stored);
        this.deviceCapabilities = capabilities;
        this.performanceSettings = settings;
      }
    } catch (error) {
      console.warn('Failed to load performance settings:', error);
    }
  }

  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.deviceCapabilities = this.getDefaultCapabilities();
    this.performanceSettings = this.getDefaultSettings();
  }

  /**
   * Get default device capabilities
   */
  private getDefaultCapabilities(): DeviceCapabilities {
    return {
      isLowEndDevice: false,
      memoryClass: 'medium',
      networkClass: '4g',
      renderingTier: 'standard',
    };
  }

  /**
   * Get default performance settings
   */
  private getDefaultSettings(): PerformanceSettings {
    return {
      enableAnimations: true,
      enableGradients: true,
      maxConcurrentImages: 8,
      imageQuality: 0.7,
      cacheSize: 35 * 1024 * 1024,
      enableBlur: false,
      enableShadows: true,
    };
  }

  /**
   * Performance monitoring utilities
   */
  startPerfMonitoring(): void {
    // Monitor render performance
    const originalRequestAnimationFrame = global.requestAnimationFrame;
    let frameCount = 0;
    let lastTime = performance.now();

    global.requestAnimationFrame = callback => {
      return originalRequestAnimationFrame(() => {
        const now = performance.now();
        const frameTime = now - lastTime;
        frameCount++;

        this.trackMetric('frame_time', frameTime);

        // Calculate FPS every 60 frames
        if (frameCount % 60 === 0) {
          const fps = 1000 / frameTime;
          this.trackMetric('fps', fps);

          // If FPS is consistently low, adapt settings
          if (fps < 30) {
            this.adaptSettings();
          }
        }

        lastTime = now;
        callback(now);
      });
    };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    averageFPS: number;
    averageFrameTime: number;
    averageRenderTime: number;
    memoryUsage: number;
    settings: PerformanceSettings;
    capabilities: DeviceCapabilities;
  } {
    return {
      averageFPS: this.getAverageMetric('fps'),
      averageFrameTime: this.getAverageMetric('frame_time'),
      averageRenderTime: this.getAverageMetric('render_time'),
      memoryUsage: this.getAverageMetric('memory_usage'),
      settings: this.getSettings(),
      capabilities: this.getDeviceCapabilities(),
    };
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizerService();

// React hook for using performance optimizer
export const usePerformanceOptimizer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<PerformanceSettings | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await performanceOptimizer.initialize();
      setSettings(performanceOptimizer.getSettings());
      setIsInitialized(true);
    };

    initialize();
  }, []);

  return {
    isInitialized,
    settings,
    shouldEnableAnimations: performanceOptimizer.shouldEnableAnimations(),
    shouldEnableGradients: performanceOptimizer.shouldEnableGradients(),
    imageQuality: performanceOptimizer.getImageQuality(),
    maxConcurrentImages: performanceOptimizer.getMaxConcurrentImages(),
    cacheSize: performanceOptimizer.getCacheSize(),
    shouldEnableBlur: performanceOptimizer.shouldEnableBlur(),
    shouldEnableShadows: performanceOptimizer.shouldEnableShadows(),
    deviceCapabilities: performanceOptimizer.getDeviceCapabilities(),
    trackMetric: performanceOptimizer.trackMetric.bind(performanceOptimizer),
    getPerformanceReport:
      performanceOptimizer.getPerformanceReport.bind(performanceOptimizer),
  };
};

// Performance monitoring component
export const PerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    performanceOptimizer.startPerfMonitoring();

    // Periodic performance checks
    const interval = setInterval(() => {
      const report = performanceOptimizer.getPerformanceReport();

      if (__DEV__) {
        console.log('Performance Report:', report);
      }

      // Emit performance events for monitoring
      DeviceEventEmitter.emit('performance_update', report);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return React.createElement(React.Fragment, null, children);
};

export default performanceOptimizer;
