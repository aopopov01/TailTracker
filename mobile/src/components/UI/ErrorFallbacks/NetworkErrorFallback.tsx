import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import { advancedNetworkErrorHandler } from '../../../services/AdvancedNetworkErrorHandler';

interface NetworkErrorFallbackProps {
  onRetry: () => void;
  onWorkOffline?: () => void;
  showOfflineOption?: boolean;
  title?: string;
  message?: string;
  endpoint?: string;
}

const { width, height } = Dimensions.get('window');

export const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({
  onRetry,
  onWorkOffline,
  showOfflineOption = true,
  title = 'Connection Lost',
  message = 'Please check your internet connection and try again.',
  endpoint,
}) => {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [networkStats, setNetworkStats] = useState<any>(null);

  useEffect(() => {
    // Start entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start pulse animation for connection icon
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };
    pulseAnimation();

    // Monitor network state
    const unsubscribe = NetInfo.addEventListener(setNetworkState);

    // Get network statistics
    if (endpoint) {
      const stats = advancedNetworkErrorHandler.getNetworkStatistics();
      setNetworkStats(stats);
    }

    return unsubscribe;
  }, [fadeAnim, pulseAnim, endpoint]);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate retry delay
      onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getConnectionStatusIcon = () => {
    if (!networkState) return '📡';
    
    if (networkState.isConnected) {
      switch (networkState.type) {
        case 'wifi': return '📶';
        case 'cellular': return '📱';
        case 'ethernet': return '🌐';
        default: return '📡';
      }
    }
    
    return '❌';
  };

  const getConnectionStatusText = () => {
    if (!networkState) return 'Checking connection...';
    
    if (networkState.isConnected) {
      const type = networkState.type.charAt(0).toUpperCase() + networkState.type.slice(1);
      return `Connected via ${type}`;
    }
    
    return 'No internet connection';
  };

  const getConnectionStatusColor = () => {
    if (!networkState?.isConnected) return '#FF6B6B';
    return '#4CAF50';
  };

  const renderNetworkDiagnostics = () => {
    if (!networkStats) return null;

    return (
      <View style={styles.diagnosticsContainer}>
        <Text style={styles.diagnosticsTitle}>Network Status</Text>
        
        <View style={styles.diagnosticItem}>
          <Text style={styles.diagnosticLabel}>Active Requests:</Text>
          <Text style={styles.diagnosticValue}>{networkStats.activeRequests}</Text>
        </View>
        
        <View style={styles.diagnosticItem}>
          <Text style={styles.diagnosticLabel}>Queued Requests:</Text>
          <Text style={styles.diagnosticValue}>{networkStats.queuedRequests}</Text>
        </View>

        {Object.entries(networkStats.endpointHealth).map(([endpoint, health]: [string, any]) => (
          <View key={endpoint} style={styles.endpointItem}>
            <Text style={styles.endpointUrl} numberOfLines={1}>
              {endpoint}
            </Text>
            <View style={[
              styles.healthIndicator,
              { backgroundColor: health.status === 'healthy' ? '#4CAF50' : '#FF6B6B' }
            ]}>
              <Text style={styles.healthText}>
                {health.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      >
        <View style={styles.content}>
          {/* Connection Status Icon */}
          <Animated.View style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Text style={styles.connectionIcon}>
              {getConnectionStatusIcon()}
            </Text>
          </Animated.View>

          {/* Title and Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Connection Status */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: getConnectionStatusColor() }
            ]}>
              <Text style={styles.statusText}>
                {getConnectionStatusText()}
              </Text>
            </View>
          </View>

          {/* Network Diagnostics */}
          {renderNetworkDiagnostics()}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              <LinearGradient
                colors={isRetrying ? ['#CCCCCC', '#999999'] : ['#4CAF50', '#45A049']}
                style={styles.buttonGradient}
              >
                <Text style={styles.retryButtonText}>
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {showOfflineOption && onWorkOffline && (
              <TouchableOpacity
                style={styles.offlineButton}
                onPress={onWorkOffline}
              >
                <Text style={styles.offlineButtonText}>
                  Work Offline
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tips Section */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Quick Fixes</Text>
            <Text style={styles.tipItem}>• Check your WiFi or mobile data</Text>
            <Text style={styles.tipItem}>• Move to an area with better signal</Text>
            <Text style={styles.tipItem}>• Restart your router if using WiFi</Text>
            {networkState?.type === 'cellular' && (
              <Text style={styles.tipItem}>• Try switching to WiFi</Text>
            )}
          </View>

          {/* Connection Test */}
          {networkState?.isConnected && (
            <View style={styles.testContainer}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleRetry}
              >
                <Text style={styles.testButtonText}>
                  Test Connection
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  connectionIcon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  diagnosticsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  diagnosticsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  diagnosticItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosticLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  diagnosticValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  endpointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  endpointUrl: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  healthIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  actionContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  offlineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  tipsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  testContainer: {
    width: '100%',
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NetworkErrorFallback;