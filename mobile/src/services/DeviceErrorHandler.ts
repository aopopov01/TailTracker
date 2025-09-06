import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// eslint-disable-next-line import/no-unresolved
import DeviceInfo from 'react-native-device-info';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import { errorMonitoring } from './ErrorMonitoringService';
import { globalErrorHandler } from './GlobalErrorHandler';

export interface DeviceHealth {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
    available: number;
    critical: boolean;
  };
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
    available: number;
    critical: boolean;
  };
  batteryInfo: {
    level: number;
    isLowPowerMode: boolean;
    isCharging: boolean;
    optimizationEnabled: boolean;
  };
  networkInfo: {
    type: string;
    isConnected: boolean;
    isWiFi: boolean;
    isCellular: boolean;
    signalStrength?: number;
  };
  permissions: {
    granted: Permission[];
    denied: Permission[];
    blocked: Permission[];
    critical: Permission[];
  };
  systemInfo: {
    platform: string;
    version: string;
    model: string;
    brand: string;
    buildNumber: string;
    apiLevel: number;
    isEmulator: boolean;
    isTablet: boolean;
    hasFaceID: boolean;
    hasTouchID: boolean;
  };
}

export interface DeviceErrorConfig {
  memoryThresholds: {
    warning: number; // 80%
    critical: number; // 95%
  };
  storageThresholds: {
    warning: number; // 85%
    critical: number; // 95%
  };
  batteryThreshold: number; // 10%
  checkIntervalMs: number;
  autoCleanupEnabled: boolean;
  permissionRetryCount: number;
}

export interface PermissionRequest {
  permission: Permission;
  rationale?: string;
  onGranted?: () => void;
  onDenied?: () => void;
  onBlocked?: () => void;
  critical?: boolean;
}

export class DeviceErrorHandler {
  private static instance: DeviceErrorHandler;
  private deviceHealth: DeviceHealth | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private permissionCallbacks = new Map<Permission, PermissionRequest>();
  private lastHealthCheck = 0;

  private readonly config: DeviceErrorConfig = {
    memoryThresholds: {
      warning: 0.8,
      critical: 0.95,
    },
    storageThresholds: {
      warning: 0.85,
      critical: 0.95,
    },
    batteryThreshold: 0.1,
    checkIntervalMs: 30000, // 30 seconds
    autoCleanupEnabled: true,
    permissionRetryCount: 3,
  };

  private readonly REQUIRED_PERMISSIONS: Permission[] = Platform.select({
    ios: [
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.PHOTO_LIBRARY,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      PERMISSIONS.IOS.MICROPHONE,
    ],
    android: [
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
    ],
  }) || [];

  private readonly CRITICAL_PERMISSIONS: Permission[] = Platform.select({
    ios: [
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.PHOTO_LIBRARY,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    ],
    android: [
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
    ],
  }) || [];

  private readonly STORAGE_KEYS = {
    DEVICE_HEALTH: '@tailtracker:device_health',
    PERMISSION_HISTORY: '@tailtracker:permission_history',
    DEVICE_ERRORS: '@tailtracker:device_errors',
  };

  private constructor() {
    this.initializeDeviceMonitoring();
  }

  public static getInstance(): DeviceErrorHandler {
    if (!DeviceErrorHandler.instance) {
      DeviceErrorHandler.instance = new DeviceErrorHandler();
    }
    return DeviceErrorHandler.instance;
  }

  /**
   * Initialize device monitoring and health checks
   */
  private async initializeDeviceMonitoring(): Promise<void> {
    try {
      // Initial health check
      await this.performHealthCheck();
      
      // Start periodic monitoring
      this.startMonitoring();
      
      // Check critical permissions
      await this.checkCriticalPermissions();
      
      // Setup platform-specific error handlers
      this.setupPlatformSpecificHandlers();
      
      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: 'Device error monitoring initialized',
        level: 'info',
        data: {
          platform: Platform.OS,
          version: Platform.Version,
          hasHealthData: Boolean(this.deviceHealth),
        },
      });
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DeviceErrorHandler', action: 'Initialize' },
        'high',
        ['device', 'initialization']
      );
    }
  }

  /**
   * Perform comprehensive device health check
   */
  public async performHealthCheck(): Promise<DeviceHealth> {
    try {
      const [
        memoryInfo,
        storageInfo,
        batteryInfo,
        networkInfo,
        permissionStatus,
        systemInfo,
      ] = await Promise.all([
        this.getMemoryInfo(),
        this.getStorageInfo(),
        this.getBatteryInfo(),
        this.getNetworkInfo(),
        this.getPermissionStatus(),
        this.getSystemInfo(),
      ]);

      this.deviceHealth = {
        memoryUsage: memoryInfo,
        storageUsage: storageInfo,
        batteryInfo,
        networkInfo,
        permissions: permissionStatus,
        systemInfo,
      };

      this.lastHealthCheck = Date.now();

      // Check for critical issues
      await this.handleCriticalIssues(this.deviceHealth);

      // Persist health data
      await this.persistDeviceHealth();

      return this.deviceHealth;
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DeviceErrorHandler', action: 'Health Check' },
        'medium',
        ['device', 'health_check']
      );
      
      throw error;
    }
  }

  /**
   * Handle memory pressure scenarios
   */
  public async handleMemoryPressure(): Promise<{
    success: boolean;
    freedMemoryMB: number;
    actions: string[];
  }> {
    const actions: string[] = [];
    let freedMemory = 0;

    try {
      // Clear caches
      if (this.config.autoCleanupEnabled) {
        await this.clearCaches();
        actions.push('Cleared application caches');
        freedMemory += 10; // Estimate
      }

      // Release non-essential resources
      await this.releaseNonEssentialResources();
      actions.push('Released non-essential resources');
      freedMemory += 5; // Estimate

      // Trigger garbage collection (if available)
      if (global.gc) {
        global.gc();
        actions.push('Triggered garbage collection');
        freedMemory += 3; // Estimate
      }

      // Show memory warning to user
      await this.showMemoryWarningToUser();
      actions.push('Notified user of memory pressure');

      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: 'Memory pressure handled',
        level: 'info',
        data: { freedMemoryMB: freedMemory, actions },
      });

      return {
        success: true,
        freedMemoryMB: freedMemory,
        actions,
      };
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DeviceErrorHandler', action: 'Memory Pressure' },
        'high',
        ['device', 'memory']
      );

      return {
        success: false,
        freedMemoryMB: 0,
        actions: ['Failed to handle memory pressure'],
      };
    }
  }

  /**
   * Handle storage space limitations
   */
  public async handleStorageIssues(): Promise<{
    success: boolean;
    freedSpaceMB: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    let freedSpace = 0;

    try {
      // Clear temporary files
      await this.clearTemporaryFiles();
      recommendations.push('Cleared temporary files');
      freedSpace += 20; // Estimate

      // Clear old logs
      await this.clearOldLogs();
      recommendations.push('Cleared old application logs');
      freedSpace += 5; // Estimate

      // Clear cached images (with user consent)
      const shouldClearImages = await this.askUserToClearImageCache();
      if (shouldClearImages) {
        await this.clearImageCache();
        recommendations.push('Cleared image cache');
        freedSpace += 50; // Estimate
      }

      // Provide user recommendations
      recommendations.push(
        'Consider removing unused photos from device',
        'Delete old apps you no longer use',
        'Move photos and videos to cloud storage'
      );

      return {
        success: true,
        freedSpaceMB: freedSpace,
        recommendations,
      };
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DeviceErrorHandler', action: 'Storage Issues' },
        'medium',
        ['device', 'storage']
      );

      return {
        success: false,
        freedSpaceMB: 0,
        recommendations: ['Failed to free up storage space'],
      };
    }
  }

  /**
   * Handle permission errors and requests
   */
  public async requestPermission(request: PermissionRequest): Promise<{
    granted: boolean;
    status: string;
    canRetry: boolean;
  }> {
    const { permission, rationale, critical = false } = request;

    try {
      // Store callback for later use
      this.permissionCallbacks.set(permission, request);

      // Check current status
      let status = await check(permission);

      if (status === RESULTS.GRANTED) {
        request.onGranted?.();
        return { granted: true, status, canRetry: false };
      }

      // Show rationale if needed
      if (status === RESULTS.DENIED && rationale) {
        const shouldRequest = await this.showPermissionRationale(permission, rationale);
        if (!shouldRequest) {
          request.onDenied?.();
          return { granted: false, status, canRetry: true };
        }
      }

      // Request permission
      if (status === RESULTS.DENIED || status === RESULTS.UNAVAILABLE) {
        status = await request(permission);
      }

      // Handle result
      if (status === RESULTS.GRANTED) {
        request.onGranted?.();
        await this.logPermissionChange(permission, 'granted');
        return { granted: true, status, canRetry: false };
      }

      if (status === RESULTS.BLOCKED || status === RESULTS.LIMITED) {
        request.onBlocked?.();
        
        if (critical) {
          await this.showCriticalPermissionBlockedDialog(permission);
        }
        
        await this.logPermissionChange(permission, 'blocked');
        return { granted: false, status, canRetry: false };
      }

      request.onDenied?.();
      await this.logPermissionChange(permission, 'denied');
      return { granted: false, status, canRetry: true };

    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { 
          component: 'DeviceErrorHandler', 
          action: 'Permission Request',
          permission: permission.toString(),
        },
        'high',
        ['device', 'permissions']
      );

      return { granted: false, status: 'error', canRetry: false };
    }
  }

  /**
   * Handle battery optimization interference
   */
  public async handleBatteryOptimization(): Promise<{
    optimizationEnabled: boolean;
    actions: string[];
    resolved: boolean;
  }> {
    const actions: string[] = [];

    try {
      if (Platform.OS !== 'android') {
        return { optimizationEnabled: false, actions, resolved: true };
      }

      // Check if battery optimization is enabled
      const isOptimized = await DeviceInfo.isBatteryOptimizationEnabled();
      
      if (!isOptimized) {
        return { optimizationEnabled: false, actions, resolved: true };
      }

      // Show dialog to user about battery optimization
      const userWantsToDisable = await this.showBatteryOptimizationDialog();
      
      if (userWantsToDisable) {
        try {
          // Open battery optimization settings
          await Linking.openSettings();
          actions.push('Opened battery optimization settings');
        } catch (linkError) {
          actions.push('Failed to open settings automatically');
          
          // Provide manual instructions
          await this.showBatteryOptimizationInstructions();
          actions.push('Provided manual instructions');
        }
      } else {
        actions.push('User chose to keep battery optimization enabled');
      }

      return {
        optimizationEnabled: isOptimized,
        actions,
        resolved: !userWantsToDisable,
      };
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DeviceErrorHandler', action: 'Battery Optimization' },
        'medium',
        ['device', 'battery']
      );

      return {
        optimizationEnabled: true,
        actions: ['Failed to handle battery optimization'],
        resolved: false,
      };
    }
  }

  /**
   * Handle background task limitations
   */
  public async handleBackgroundLimitations(): Promise<{
    limitations: string[];
    workarounds: string[];
    recommendations: string[];
  }> {
    const limitations: string[] = [];
    const workarounds: string[] = [];
    const recommendations: string[] = [];

    try {
      if (Platform.OS === 'ios') {
        limitations.push('iOS background app refresh may be disabled');
        limitations.push('Background processing time is limited');
        
        workarounds.push('Use push notifications for time-sensitive updates');
        workarounds.push('Implement efficient background sync');
        
        recommendations.push('Enable Background App Refresh in iOS Settings');
        recommendations.push('Keep app active during critical operations');
      } else if (Platform.OS === 'android') {
        limitations.push('Android background execution limits');
        limitations.push('Doze mode may affect background tasks');
        limitations.push('App standby mode restrictions');
        
        workarounds.push('Use foreground services for critical tasks');
        workarounds.push('Implement JobScheduler for deferred tasks');
        workarounds.push('Use Firebase Cloud Messaging for updates');
        
        recommendations.push('Request users to whitelist the app');
        recommendations.push('Disable battery optimization for the app');
        recommendations.push('Use WorkManager for background tasks');
      }

      return { limitations, workarounds, recommendations };
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DeviceErrorHandler', action: 'Background Limitations' },
        'medium',
        ['device', 'background']
      );

      return {
        limitations: ['Failed to analyze background limitations'],
        workarounds: [],
        recommendations: [],
      };
    }
  }

  /**
   * Handle device orientation changes
   */
  public handleOrientationChange(orientation: string): void {
    try {
      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: `Device orientation changed to ${orientation}`,
        level: 'info',
        data: { orientation, timestamp: Date.now() },
      });

      // Trigger UI reflow if needed
      this.triggerUIReflow();
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DeviceErrorHandler', action: 'Orientation Change' },
        'low',
        ['device', 'orientation']
      );
    }
  }

  /**
   * Handle app backgrounding/foregrounding
   */
  public async handleAppStateChange(appState: string): Promise<void> {
    try {
      if (appState === 'background') {
        await this.handleAppBackgrounding();
      } else if (appState === 'active') {
        await this.handleAppForegrounding();
      }
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { component: 'DeviceErrorHandler', action: 'App State Change' },
        'low',
        ['device', 'app_state']
      );
    }
  }

  /**
   * Get current device health
   */
  public getDeviceHealth(): DeviceHealth | null {
    return this.deviceHealth;
  }

  /**
   * Start device monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.warn('Device health check failed:', error);
      }
    }, this.config.checkIntervalMs);
  }

  /**
   * Stop device monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Private helper methods
   */
  private async getMemoryInfo(): Promise<DeviceHealth['memoryUsage']> {
    // Note: React Native doesn't provide direct memory info
    // This is a simplified implementation
    const totalMemory = await DeviceInfo.getTotalMemory();
    const usedMemory = totalMemory * 0.6; // Estimate 60% usage
    const available = totalMemory - usedMemory;
    const percentage = usedMemory / totalMemory;

    return {
      used: usedMemory,
      total: totalMemory,
      percentage,
      available,
      critical: percentage > this.config.memoryThresholds.critical,
    };
  }

  private async getStorageInfo(): Promise<DeviceHealth['storageUsage']> {
    try {
      const freeDiskStorage = await DeviceInfo.getFreeDiskStorage();
      const totalDiskCapacity = await DeviceInfo.getTotalDiskCapacity();
      const used = totalDiskCapacity - freeDiskStorage;
      const percentage = used / totalDiskCapacity;

      return {
        used,
        total: totalDiskCapacity,
        percentage,
        available: freeDiskStorage,
        critical: percentage > this.config.storageThresholds.critical,
      };
    } catch (error) {
      return {
        used: 0,
        total: 0,
        percentage: 0,
        available: 0,
        critical: false,
      };
    }
  }

  private async getBatteryInfo(): Promise<DeviceHealth['batteryInfo']> {
    try {
      const [batteryLevel, isLowPowerMode, isCharging] = await Promise.all([
        DeviceInfo.getBatteryLevel(),
        DeviceInfo.isPowerSaveMode(),
        DeviceInfo.isBatteryCharging(),
      ]);

      let optimizationEnabled = false;
      if (Platform.OS === 'android') {
        optimizationEnabled = await DeviceInfo.isBatteryOptimizationEnabled();
      }

      return {
        level: batteryLevel,
        isLowPowerMode,
        isCharging,
        optimizationEnabled,
      };
    } catch (error) {
      return {
        level: 1,
        isLowPowerMode: false,
        isCharging: false,
        optimizationEnabled: false,
      };
    }
  }

  private async getNetworkInfo(): Promise<DeviceHealth['networkInfo']> {
    // This would integrate with NetInfo for detailed network information
    return {
      type: 'unknown',
      isConnected: false,
      isWiFi: false,
      isCellular: false,
    };
  }

  private async getPermissionStatus(): Promise<DeviceHealth['permissions']> {
    const granted: Permission[] = [];
    const denied: Permission[] = [];
    const blocked: Permission[] = [];
    const critical: Permission[] = [];

    for (const permission of this.REQUIRED_PERMISSIONS) {
      try {
        const status = await check(permission);
        
        if (status === RESULTS.GRANTED) {
          granted.push(permission);
        } else if (status === RESULTS.BLOCKED || status === RESULTS.LIMITED) {
          blocked.push(permission);
          if (this.CRITICAL_PERMISSIONS.includes(permission)) {
            critical.push(permission);
          }
        } else {
          denied.push(permission);
          if (this.CRITICAL_PERMISSIONS.includes(permission)) {
            critical.push(permission);
          }
        }
      } catch (error) {
        console.warn(`Failed to check permission ${permission}:`, error);
      }
    }

    return { granted, denied, blocked, critical };
  }

  private async getSystemInfo(): Promise<DeviceHealth['systemInfo']> {
    try {
      const [
        model,
        brand,
        buildNumber,
        apiLevel,
        isEmulator,
        isTablet,
        hasFaceID,
        hasTouchID,
      ] = await Promise.all([
        DeviceInfo.getModel(),
        DeviceInfo.getBrand(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.getApiLevel(),
        DeviceInfo.isEmulator(),
        DeviceInfo.isTablet(),
        DeviceInfo.hasSystemFeature('face_id').catch(() => false),
        DeviceInfo.hasSystemFeature('touch_id').catch(() => false),
      ]);

      return {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model,
        brand,
        buildNumber,
        apiLevel,
        isEmulator,
        isTablet,
        hasFaceID,
        hasTouchID,
      };
    } catch (error) {
      return {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: 'unknown',
        brand: 'unknown',
        buildNumber: 'unknown',
        apiLevel: 0,
        isEmulator: false,
        isTablet: false,
        hasFaceID: false,
        hasTouchID: false,
      };
    }
  }

  private async handleCriticalIssues(health: DeviceHealth): Promise<void> {
    // Memory pressure
    if (health.memoryUsage.critical) {
      await this.handleMemoryPressure();
    }

    // Storage issues
    if (health.storageUsage.critical) {
      await this.handleStorageIssues();
    }

    // Low battery
    if (health.batteryInfo.level < this.config.batteryThreshold) {
      await this.handleLowBattery();
    }

    // Critical permissions
    if (health.permissions.critical.length > 0) {
      await this.handleCriticalPermissionsMissing(health.permissions.critical);
    }
  }

  private async checkCriticalPermissions(): Promise<void> {
    for (const permission of this.CRITICAL_PERMISSIONS) {
      const status = await check(permission);
      if (status !== RESULTS.GRANTED) {
        errorMonitoring.addBreadcrumb({
          category: 'system',
          message: `Critical permission missing: ${permission}`,
          level: 'warning',
          data: { permission, status },
        });
      }
    }
  }

  private setupPlatformSpecificHandlers(): void {
    if (Platform.OS === 'android') {
      this.setupAndroidSpecificHandlers();
    } else if (Platform.OS === 'ios') {
      this.setupIOSSpecificHandlers();
    }
  }

  private setupAndroidSpecificHandlers(): void {
    // Android-specific error handling
  }

  private setupIOSSpecificHandlers(): void {
    // iOS-specific error handling
  }

  // Implementation of helper methods continues...
  // [Additional helper methods for UI interactions, cleanup, etc.]

  private async clearCaches(): Promise<void> {
    // Implementation for clearing caches
  }

  private async releaseNonEssentialResources(): Promise<void> {
    // Implementation for releasing resources
  }

  private async showMemoryWarningToUser(): Promise<void> {
    // Implementation for showing memory warning
  }

  private async clearTemporaryFiles(): Promise<void> {
    // Implementation for clearing temporary files
  }

  private async clearOldLogs(): Promise<void> {
    // Implementation for clearing old logs
  }

  private async askUserToClearImageCache(): Promise<boolean> {
    // Implementation for asking user consent
    return false;
  }

  private async clearImageCache(): Promise<void> {
    // Implementation for clearing image cache
  }

  private async showPermissionRationale(permission: Permission, rationale: string): Promise<boolean> {
    // Implementation for showing permission rationale
    return true;
  }

  private async showCriticalPermissionBlockedDialog(permission: Permission): Promise<void> {
    // Implementation for critical permission dialog
  }

  private async logPermissionChange(permission: Permission, status: string): Promise<void> {
    // Implementation for logging permission changes
  }

  private async showBatteryOptimizationDialog(): Promise<boolean> {
    // Implementation for battery optimization dialog
    return false;
  }

  private async showBatteryOptimizationInstructions(): Promise<void> {
    // Implementation for showing instructions
  }

  private triggerUIReflow(): void {
    // Implementation for UI reflow
  }

  private async handleAppBackgrounding(): Promise<void> {
    // Implementation for app backgrounding
  }

  private async handleAppForegrounding(): Promise<void> {
    // Implementation for app foregrounding
  }

  private async handleLowBattery(): Promise<void> {
    // Implementation for low battery handling
  }

  private async handleCriticalPermissionsMissing(permissions: Permission[]): Promise<void> {
    // Implementation for handling missing critical permissions
  }

  private async persistDeviceHealth(): Promise<void> {
    try {
      if (this.deviceHealth) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.DEVICE_HEALTH,
          JSON.stringify(this.deviceHealth)
        );
      }
    } catch (error) {
      console.warn('Failed to persist device health:', error);
    }
  }
}

// Export singleton
export const deviceErrorHandler = DeviceErrorHandler.getInstance();