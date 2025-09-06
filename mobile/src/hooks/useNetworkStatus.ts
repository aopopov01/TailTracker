import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  type: string;
  isWifiEnabled: boolean;
  isInternetReachable: boolean | null;
  connectionSpeed: 'slow' | 'medium' | 'fast' | 'unknown';
  hasStrongSignal: boolean;
  isRoaming: boolean;
  canSync: boolean;
  shouldSyncImages: boolean;
}

export interface NetworkQuality {
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  latency: number; // ms
  packetLoss: number; // percentage
  signalStrength: number; // percentage (0-100)
}

const CONNECTION_SPEED_THRESHOLDS = {
  SLOW: 1, // < 1 Mbps
  MEDIUM: 5, // 1-5 Mbps
  FAST: 5, // > 5 Mbps
};

const SYNC_REQUIREMENTS = {
  MIN_SPEED_FOR_SYNC: 0.5, // Mbps
  MIN_SPEED_FOR_IMAGES: 2, // Mbps
  MAX_ACCEPTABLE_LATENCY: 1000, // ms
  MIN_SIGNAL_STRENGTH: 30, // percentage
};

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    type: 'none',
    isWifiEnabled: false,
    isInternetReachable: null,
    connectionSpeed: 'unknown',
    hasStrongSignal: false,
    isRoaming: false,
    canSync: false,
    shouldSyncImages: false,
  });

  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>({
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: 0,
    packetLoss: 0,
    signalStrength: 0,
  });

  const [history, setHistory] = useState<NetworkStatus[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Measure network quality
  const measureNetworkQuality = useCallback(async (): Promise<NetworkQuality> => {
    try {
      const startTime = Date.now();
      
      // Simple ping test using a small request
      const response = await fetch('https://httpbin.org/bytes/1024', {
        method: 'GET',
        cache: 'no-cache',
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Estimate download speed (very rough approximation)
      const bytesDownloaded = 1024; // 1KB test
      const downloadTime = latency / 1000; // in seconds
      const downloadSpeed = (bytesDownloaded * 8) / (downloadTime * 1000000); // Mbps

      return {
        downloadSpeed: Math.max(downloadSpeed, 0.1),
        uploadSpeed: downloadSpeed * 0.8, // Rough estimate
        latency,
        packetLoss: response.ok ? 0 : 10, // Simple binary check
        signalStrength: response.ok ? Math.min(100, (100 - latency / 10)) : 0,
      };
    } catch (error) {
      console.warn('Network quality measurement failed:', error);
      return {
        downloadSpeed: 0,
        uploadSpeed: 0,
        latency: 9999,
        packetLoss: 100,
        signalStrength: 0,
      };
    }
  }, []);

  // Determine connection speed category
  const categorizeConnectionSpeed = useCallback((quality: NetworkQuality): 'slow' | 'medium' | 'fast' | 'unknown' => {
    if (quality.downloadSpeed === 0) return 'unknown';
    if (quality.downloadSpeed < CONNECTION_SPEED_THRESHOLDS.SLOW) return 'slow';
    if (quality.downloadSpeed < CONNECTION_SPEED_THRESHOLDS.MEDIUM) return 'medium';
    return 'fast';
  }, []);

  // Check if network conditions are suitable for syncing
  const canSyncWithCurrentNetwork = useCallback((quality: NetworkQuality, netInfo: NetInfoState): boolean => {
    if (!netInfo.isConnected || !netInfo.isInternetReachable) return false;
    
    return (
      quality.downloadSpeed >= SYNC_REQUIREMENTS.MIN_SPEED_FOR_SYNC &&
      quality.latency <= SYNC_REQUIREMENTS.MAX_ACCEPTABLE_LATENCY &&
      quality.signalStrength >= SYNC_REQUIREMENTS.MIN_SIGNAL_STRENGTH &&
      quality.packetLoss < 50
    );
  }, []);

  // Check if network conditions are suitable for image syncing
  const shouldSyncImagesWithCurrentNetwork = useCallback((quality: NetworkQuality, netInfo: NetInfoState): boolean => {
    if (!canSyncWithCurrentNetwork(quality, netInfo)) return false;
    
    // Only sync images on WiFi or fast cellular
    if (netInfo.type === 'wifi') return true;
    
    return (
      quality.downloadSpeed >= SYNC_REQUIREMENTS.MIN_SPEED_FOR_IMAGES &&
      quality.latency <= 500 && // Stricter latency for images
      !netInfo.details?.isConnectionExpensive // Avoid expensive connections
    );
  }, [canSyncWithCurrentNetwork]);

  // Update network status
  const updateNetworkStatus = useCallback(async (netInfo: NetInfoState) => {
    let quality = networkQuality;
    
    // Only measure quality if we're connected
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      try {
        quality = await measureNetworkQuality();
        setNetworkQuality(quality);
      } catch (error) {
        console.warn('Failed to measure network quality:', error);
      }
    } else {
      quality = {
        downloadSpeed: 0,
        uploadSpeed: 0,
        latency: 9999,
        packetLoss: 100,
        signalStrength: 0,
      };
      setNetworkQuality(quality);
    }

    const newStatus: NetworkStatus = {
      isConnected: netInfo.isConnected || false,
      type: netInfo.type || 'none',
      isWifiEnabled: netInfo.type === 'wifi',
      isInternetReachable: netInfo.isInternetReachable,
      connectionSpeed: categorizeConnectionSpeed(quality),
      hasStrongSignal: quality.signalStrength >= SYNC_REQUIREMENTS.MIN_SIGNAL_STRENGTH,
      isRoaming: (netInfo.details as any)?.isRoaming || false,
      canSync: canSyncWithCurrentNetwork(quality, netInfo),
      shouldSyncImages: shouldSyncImagesWithCurrentNetwork(quality, netInfo),
    };

    setNetworkStatus(newStatus);

    // Add to history (keep last 10 entries)
    setHistory(prev => {
      const newHistory = [newStatus, ...prev].slice(0, 10);
      return newHistory;
    });
  }, [networkQuality, categorizeConnectionSpeed, canSyncWithCurrentNetwork, shouldSyncImagesWithCurrentNetwork, measureNetworkQuality]);

  // Start monitoring network quality
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Initial measurement
    NetInfo.fetch().then(updateNetworkStatus);
    
    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);
    
    return () => {
      setIsMonitoring(false);
      unsubscribe();
    };
  }, [updateNetworkStatus]);

  // Get network recommendations
  const getNetworkRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    
    if (!networkStatus.isConnected) {
      recommendations.push('Connect to a network to sync your data');
      return recommendations;
    }

    if (!networkStatus.isInternetReachable) {
      recommendations.push('Internet access is required for syncing');
      return recommendations;
    }

    if (networkStatus.connectionSpeed === 'slow') {
      recommendations.push('Slow connection detected. Sync may take longer than usual');
      if (!networkStatus.isWifiEnabled) {
        recommendations.push('Consider connecting to WiFi for faster sync');
      }
    }

    if (!networkStatus.hasStrongSignal) {
      recommendations.push('Weak signal detected. Move closer to your router or cell tower');
    }

    if (networkStatus.isRoaming) {
      recommendations.push('Roaming detected. Image sync is disabled to avoid charges');
    }

    if (!networkStatus.shouldSyncImages && networkStatus.canSync) {
      recommendations.push('Basic sync available. Connect to WiFi for image sync');
    }

    if (networkStatus.canSync && networkStatus.shouldSyncImages) {
      recommendations.push('Excellent connection! All features available');
    }

    return recommendations;
  }, [networkStatus]);

  // Get connection stability score
  const getConnectionStability = useCallback((): number => {
    if (history.length < 3) return 50; // Default score with insufficient data
    
    const recentHistory = history.slice(0, 5);
    const connectionChanges = recentHistory.reduce((changes, status, index) => {
      if (index === 0) return changes;
      const prevStatus = recentHistory[index - 1];
      if (status.isConnected !== prevStatus.isConnected) {
        changes++;
      }
      return changes;
    }, 0);

    // Higher score = more stable (fewer connection changes)
    return Math.max(0, 100 - (connectionChanges * 20));
  }, [history]);

  // Force refresh network status
  const refreshNetworkStatus = useCallback(async () => {
    const netInfo = await NetInfo.fetch();
    await updateNetworkStatus(netInfo);
  }, [updateNetworkStatus]);

  // Check if specific operation is recommended
  const isOperationRecommended = useCallback((operation: 'sync' | 'imageSync' | 'upload' | 'download'): boolean => {
    switch (operation) {
      case 'sync':
        return networkStatus.canSync;
      case 'imageSync':
        return networkStatus.shouldSyncImages;
      case 'upload':
        return networkStatus.canSync && networkQuality.uploadSpeed >= 1;
      case 'download':
        return networkStatus.canSync && networkQuality.downloadSpeed >= 1;
      default:
        return false;
    }
  }, [networkStatus, networkQuality]);

  // Get estimated sync time
  const getEstimatedSyncTime = useCallback((dataSize: number): number => {
    if (!networkStatus.canSync) return -1; // Cannot sync
    
    const sizeInMB = dataSize / (1024 * 1024);
    const speedMbps = Math.max(networkQuality.downloadSpeed, 0.1);
    const timeInSeconds = (sizeInMB * 8) / speedMbps;
    
    // Add overhead for processing and network latency
    return Math.round(timeInSeconds * 1.5);
  }, [networkStatus, networkQuality]);

  // Initialize monitoring
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    // Current status
    networkStatus,
    networkQuality,
    isMonitoring,
    
    // History and stability
    history,
    connectionStability: getConnectionStability(),
    
    // Utility functions
    refreshNetworkStatus,
    getNetworkRecommendations,
    isOperationRecommended,
    getEstimatedSyncTime,
    
    // Raw measurement function
    measureNetworkQuality,
  };
};

// Hook for simplified network status
export const useSimpleNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [canSync, setCanSync] = useState(false);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected || false);
      setCanSync(
        (state.isConnected || false) && 
        (state.isInternetReachable !== false)
      );
    });
    
    // Get initial state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected || false);
      setCanSync(
        (state.isConnected || false) && 
        (state.isInternetReachable !== false)
      );
    });
    
    return unsubscribe;
  }, []);
  
  return { isOnline, canSync };
};

// Hook for network-aware operations
export const useNetworkAwareOperation = () => {
  const { networkStatus, isOperationRecommended } = useNetworkStatus();
  
  const executeWhenOnline = useCallback(
    <T>(operation: () => Promise<T>, fallback?: () => T): Promise<T> => {
      if (networkStatus.isConnected) {
        return operation();
      } else if (fallback) {
        return Promise.resolve(fallback());
      } else {
        return Promise.reject(new Error('Operation requires internet connection'));
      }
    },
    [networkStatus.isConnected]
  );
  
  const executeWhenOptimal = useCallback(
    <T>(
      operation: () => Promise<T>, 
      requiredOperation: 'sync' | 'imageSync' | 'upload' | 'download' = 'sync',
      fallback?: () => T
    ): Promise<T> => {
      if (isOperationRecommended(requiredOperation)) {
        return operation();
      } else if (fallback) {
        return Promise.resolve(fallback());
      } else {
        return Promise.reject(new Error(`Network conditions not optimal for ${requiredOperation}`));
      }
    },
    [isOperationRecommended]
  );
  
  return {
    executeWhenOnline,
    executeWhenOptimal,
    networkStatus,
  };
};