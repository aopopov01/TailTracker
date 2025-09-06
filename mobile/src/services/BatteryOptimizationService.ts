import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface BatteryOptimizationConfig {
  locationUpdateInterval: number;
  backgroundSyncInterval: number;
  maxConcurrentRequests: number;
  enableAggressiveCaching: boolean;
  enableBatteryOptimizations: boolean;
}

interface NetworkOptimizationSettings {
  requestTimeouts: Record<string, number>;
  retryDelays: number[];
  batchRequestThreshold: number;
  enableRequestBatching: boolean;
}

class BatteryOptimizationService {
  private static instance: BatteryOptimizationService;
  private appState: AppStateStatus = AppState.currentState;
  private isLowPowerMode = false;
  private networkState: NetInfoState | null = null;
  private activeRequests = new Set<string>();
  private requestQueue: Array<() => Promise<any>> = [];
  private locationUpdateTimer: NodeJS.Timeout | null = null;
  
  private config: BatteryOptimizationConfig = {
    locationUpdateInterval: 30000, // 30 seconds default
    backgroundSyncInterval: 300000, // 5 minutes
    maxConcurrentRequests: 3,
    enableAggressiveCaching: true,
    enableBatteryOptimizations: true,
  };

  private networkConfig: NetworkOptimizationSettings = {
    requestTimeouts: {
      'auth': 10000,
      'pet-data': 15000,
      'image-upload': 30000,
      'sync': 20000,
    },
    retryDelays: [1000, 3000, 5000],
    batchRequestThreshold: 5,
    enableRequestBatching: true,
  };

  public static getInstance(): BatteryOptimizationService {
    if (!BatteryOptimizationService.instance) {
      BatteryOptimizationService.instance = new BatteryOptimizationService();
    }
    return BatteryOptimizationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Monitor app state changes
      AppState.addEventListener('change', this.handleAppStateChange);
      
      // Monitor network state
      NetInfo.addEventListener(this.handleNetworkStateChange);
      
      // Initialize network state
      this.networkState = await NetInfo.fetch();
      
      // Detect low power mode (iOS specific)
      await this.detectLowPowerMode();
      
      console.log('BatteryOptimizationService initialized');
    } catch (error) {
      console.error('Failed to initialize BatteryOptimizationService:', error);
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    const previousState = this.appState;
    this.appState = nextAppState;

    if (nextAppState === 'background' && previousState === 'active') {
      this.optimizeForBackground();
    } else if (nextAppState === 'active' && previousState !== 'active') {
      this.optimizeForForeground();
    }
  };

  private handleNetworkStateChange = (state: NetInfoState) => {
    this.networkState = state;
    this.adjustForNetworkConditions(state);
  };

  private async detectLowPowerMode(): Promise<void> {
    // Note: React Native doesn't have direct API for low power mode
    // This is a simplified implementation
    try {
      // Use performance metrics as proxy for low power mode
      const start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      const elapsed = performance.now() - start;
      
      // If execution is significantly slower, assume low power mode
      this.isLowPowerMode = elapsed > 150;
      
      if (this.isLowPowerMode) {
        this.enableAggressiveBatteryOptimizations();
      }
    } catch (error) {
      console.error('Failed to detect low power mode:', error);
    }
  }

  private optimizeForBackground(): void {
    console.log('Optimizing for background mode');
    
    // Reduce location update frequency
    this.adjustLocationUpdateFrequency('background');
    
    // Pause non-critical operations
    this.pauseNonCriticalOperations();
    
    // Enable aggressive caching
    this.config.enableAggressiveCaching = true;
  }

  private optimizeForForeground(): void {
    console.log('Optimizing for foreground mode');
    
    // Restore normal location update frequency
    this.adjustLocationUpdateFrequency('foreground');
    
    // Resume operations
    this.resumeOperations();
    
    // Process queued requests
    this.processRequestQueue();
  }

  private adjustForNetworkConditions(networkState: NetInfoState): void {
    if (!networkState.isConnected) {
      // Offline mode optimizations
      this.enableOfflineMode();
      return;
    }

    const connectionType = networkState.type;
    const isSlowConnection = this.isSlowConnection(networkState);

    if (isSlowConnection || connectionType === 'cellular') {
      // Optimize for slow/cellular connections
      this.optimizeForSlowNetwork();
    } else {
      // Normal network optimizations
      this.optimizeForFastNetwork();
    }
  }

  private isSlowConnection(networkState: NetInfoState): boolean {
    const effectiveType = networkState.details?.effectiveType;
    return effectiveType === 'slow-2g' || effectiveType === '2g';
  }

  private adjustLocationUpdateFrequency(mode: 'foreground' | 'background'): void {
    if (this.locationUpdateTimer) {
      clearInterval(this.locationUpdateTimer);
      this.locationUpdateTimer = null;
    }

    const interval = mode === 'background' 
      ? this.config.backgroundSyncInterval 
      : this.config.locationUpdateInterval;

    if (mode === 'background') {
      // Reduce frequency in background
      this.config.locationUpdateInterval = Math.max(interval * 3, 60000); // At least 1 minute
    } else {
      // Restore normal frequency
      this.config.locationUpdateInterval = 30000; // 30 seconds
    }
  }

  private pauseNonCriticalOperations(): void {
    // Cancel non-critical pending requests
    const nonCriticalRequests = Array.from(this.activeRequests)
      .filter(id => !id.includes('critical') && !id.includes('emergency'));
    
    nonCriticalRequests.forEach(id => {
      this.activeRequests.delete(id);
    });
  }

  private resumeOperations(): void {
    // Resume normal operation limits
    this.config.maxConcurrentRequests = 3;
  }

  private enableOfflineMode(): void {
    console.log('Enabling offline mode optimizations');
    
    // Queue requests for later processing
    this.config.maxConcurrentRequests = 0;
    
    // Enable aggressive caching
    this.config.enableAggressiveCaching = true;
  }

  private optimizeForSlowNetwork(): void {
    console.log('Optimizing for slow network');
    
    // Reduce concurrent requests
    this.config.maxConcurrentRequests = 1;
    
    // Enable request batching
    this.networkConfig.enableRequestBatching = true;
    
    // Increase timeouts
    Object.keys(this.networkConfig.requestTimeouts).forEach(key => {
      this.networkConfig.requestTimeouts[key] *= 1.5;
    });
  }

  private optimizeForFastNetwork(): void {
    console.log('Optimizing for fast network');
    
    // Allow more concurrent requests
    this.config.maxConcurrentRequests = 5;
    
    // Disable request batching for faster responses
    this.networkConfig.enableRequestBatching = false;
    
    // Use normal timeouts
    this.networkConfig.requestTimeouts = {
      'auth': 10000,
      'pet-data': 15000,
      'image-upload': 30000,
      'sync': 20000,
    };
  }

  private enableAggressiveBatteryOptimizations(): void {
    console.log('Enabling aggressive battery optimizations (low power mode detected)');
    
    // Significantly reduce update frequencies
    this.config.locationUpdateInterval = Math.max(this.config.locationUpdateInterval * 2, 60000);
    this.config.backgroundSyncInterval = Math.max(this.config.backgroundSyncInterval * 2, 600000);
    
    // Reduce concurrent operations
    this.config.maxConcurrentRequests = 1;
    
    // Enable all caching
    this.config.enableAggressiveCaching = true;
  }

  private processRequestQueue(): void {
    if (this.requestQueue.length === 0) return;
    
    const maxConcurrent = this.config.maxConcurrentRequests;
    const currentActive = this.activeRequests.size;
    
    if (currentActive >= maxConcurrent) return;
    
    const toProcess = Math.min(
      this.requestQueue.length, 
      maxConcurrent - currentActive
    );
    
    for (let i = 0; i < toProcess; i++) {
      const request = this.requestQueue.shift();
      if (request) {
        this.executeRequest(request);
      }
    }
  }

  private async executeRequest(request: () => Promise<any>): Promise<void> {
    const requestId = `req_${Date.now()}_${Math.random()}`;
    this.activeRequests.add(requestId);
    
    try {
      await request();
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      this.activeRequests.delete(requestId);
      
      // Process next queued request
      setTimeout(() => this.processRequestQueue(), 100);
    }
  }

  // Public API methods

  public async optimizeLocationTracking(options: {
    accuracy?: Location.Accuracy;
    distanceInterval?: number;
    timeInterval?: number;
  } = {}): Promise<Location.LocationOptions> {
    const baseOptions: Location.LocationOptions = {
      accuracy: this.isLowPowerMode 
        ? Location.Accuracy.Balanced 
        : (options.accuracy || Location.Accuracy.High),
      timeInterval: options.timeInterval || this.config.locationUpdateInterval,
      distanceInterval: options.distanceInterval || 10,
    };

    // Adjust for network conditions
    if (!this.networkState?.isConnected) {
      baseOptions.accuracy = Location.Accuracy.Lowest;
      baseOptions.timeInterval = Math.max(baseOptions.timeInterval * 2, 60000);
    }

    return baseOptions;
  }

  public shouldBatchRequest(requestType: string): boolean {
    if (!this.networkConfig.enableRequestBatching) return false;
    
    const queueSize = this.requestQueue.length;
    return queueSize >= this.networkConfig.batchRequestThreshold;
  }

  public getOptimizedTimeout(requestType: string): number {
    const baseTimeout = this.networkConfig.requestTimeouts[requestType] || 15000;
    
    if (this.isSlowConnection(this.networkState!)) {
      return baseTimeout * 1.5;
    }
    
    if (this.isLowPowerMode) {
      return baseTimeout * 1.2;
    }
    
    return baseTimeout;
  }

  public async scheduleRequest<T>(
    request: () => Promise<T>,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      if (priority === 'critical' || this.activeRequests.size < this.config.maxConcurrentRequests) {
        this.executeRequest(wrappedRequest);
      } else {
        // Add to queue based on priority
        if (priority === 'high') {
          this.requestQueue.unshift(wrappedRequest);
        } else {
          this.requestQueue.push(wrappedRequest);
        }
      }
    });
  }

  public getConfig(): BatteryOptimizationConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<BatteryOptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getBatteryOptimizationStatus(): {
    isLowPowerMode: boolean;
    appState: AppStateStatus;
    networkConnected: boolean;
    activeRequestsCount: number;
    queuedRequestsCount: number;
  } {
    return {
      isLowPowerMode: this.isLowPowerMode,
      appState: this.appState,
      networkConnected: this.networkState?.isConnected || false,
      activeRequestsCount: this.activeRequests.size,
      queuedRequestsCount: this.requestQueue.length,
    };
  }

  public cleanup(): void {
    AppState.removeEventListener('change', this.handleAppStateChange);
    
    if (this.locationUpdateTimer) {
      clearInterval(this.locationUpdateTimer);
      this.locationUpdateTimer = null;
    }
    
    this.activeRequests.clear();
    this.requestQueue = [];
  }
}

export default BatteryOptimizationService;

// Export hook for React components
export const useBatteryOptimization = () => {
  const service = BatteryOptimizationService.getInstance();
  
  return {
    scheduleRequest: service.scheduleRequest.bind(service),
    getOptimizedTimeout: service.getOptimizedTimeout.bind(service),
    shouldBatchRequest: service.shouldBatchRequest.bind(service),
    optimizeLocationTracking: service.optimizeLocationTracking.bind(service),
    getBatteryStatus: service.getBatteryOptimizationStatus.bind(service),
  };
};