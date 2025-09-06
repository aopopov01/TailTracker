import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineData } from '../../hooks/useOfflineData';

interface OfflineStatusBarProps {
  dataLayer: any;
  onPress?: () => void;
  showDetails?: boolean;
  style?: any;
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  dataLayer,
  onPress,
  showDetails = false,
  style
}) => {
  const { networkStatus, getNetworkRecommendations } = useNetworkStatus();
  const { state } = useOfflineData(dataLayer);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [visible, setVisible] = useState(false);

  // Show/hide status bar based on network and sync state
  useEffect(() => {
    const shouldShow = 
      !networkStatus.isConnected || 
      state.syncInProgress || 
      state.pendingUpdates > 0 ||
      state.error !== null;

    if (shouldShow !== visible) {
      setVisible(shouldShow);
      
      Animated.timing(slideAnim, {
        toValue: shouldShow ? 0 : -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [networkStatus.isConnected, state.syncInProgress, state.pendingUpdates, state.error, visible, slideAnim]);

  const getStatusInfo = () => {
    if (state.error) {
      return {
        icon: 'warning-outline' as const,
        text: 'Sync Error',
        subtext: state.error,
        color: '#FF6B6B',
        backgroundColor: '#FFE6E6'
      };
    }

    if (state.syncInProgress) {
      return {
        icon: 'sync' as const,
        text: 'Syncing...',
        subtext: state.pendingUpdates > 0 ? `${state.pendingUpdates} items pending` : 'Updating data',
        color: '#4ECDC4',
        backgroundColor: '#E6F7F7'
      };
    }

    if (!networkStatus.isConnected) {
      return {
        icon: 'cloud-offline-outline' as const,
        text: 'Offline Mode',
        subtext: state.pendingUpdates > 0 ? `${state.pendingUpdates} items will sync when online` : 'Working offline',
        color: '#FFA726',
        backgroundColor: '#FFF3E0'
      };
    }

    if (state.pendingUpdates > 0) {
      return {
        icon: 'cloud-upload-outline' as const,
        text: `${state.pendingUpdates} items to sync`,
        subtext: networkStatus.canSync ? 'Ready to sync' : 'Waiting for better connection',
        color: '#42A5F5',
        backgroundColor: '#E3F2FD'
      };
    }

    return {
      icon: 'checkmark-circle-outline' as const,
      text: 'All synced',
      subtext: 'Your data is up to date',
      color: '#66BB6A',
      backgroundColor: '#E8F5E8'
    };
  };

  const statusInfo = getStatusInfo();
  const recommendations = getNetworkRecommendations();

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          backgroundColor: statusInfo.backgroundColor,
          transform: [{ translateY: slideAnim }]
        },
        style
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.statusRow}>
          <Ionicons 
            name={statusInfo.icon} 
            size={20} 
            color={statusInfo.color}
            style={[
              styles.icon,
              state.syncInProgress && styles.spinningIcon
            ]} 
          />
          
          <View style={styles.textContainer}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
            
            {showDetails && (
              <Text style={styles.subtextText}>
                {statusInfo.subtext}
              </Text>
            )}
          </View>
          
          {!networkStatus.isConnected && (
            <View style={styles.indicators}>
              <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.indicatorText}>No Internet</Text>
            </View>
          )}
          
          {networkStatus.isConnected && !networkStatus.canSync && (
            <View style={styles.indicators}>
              <View style={[styles.dot, { backgroundColor: '#FFA726' }]} />
              <Text style={styles.indicatorText}>Weak Signal</Text>
            </View>
          )}
          
          {networkStatus.canSync && networkStatus.shouldSyncImages && (
            <View style={styles.indicators}>
              <View style={[styles.dot, { backgroundColor: '#66BB6A' }]} />
              <Text style={styles.indicatorText}>Full Sync</Text>
            </View>
          )}
        </View>

        {showDetails && recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={styles.recommendationsTitle}>Recommendations:</Text>
            {recommendations.slice(0, 2).map((rec, index) => (
              <Text key={index} style={styles.recommendationText}>
                • {rec}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Compact version for minimal space usage
export const CompactOfflineStatus: React.FC<{
  dataLayer: any;
  onPress?: () => void;
}> = ({ dataLayer, onPress }) => {
  const { networkStatus } = useNetworkStatus();
  const { state } = useOfflineData(dataLayer);

  const getStatusColor = () => {
    if (state.error) return '#FF6B6B';
    if (state.syncInProgress) return '#4ECDC4';
    if (!networkStatus.isConnected) return '#FFA726';
    if (state.pendingUpdates > 0) return '#42A5F5';
    return '#66BB6A';
  };

  const getStatusIcon = () => {
    if (state.error) return 'warning-outline';
    if (state.syncInProgress) return 'sync';
    if (!networkStatus.isConnected) return 'cloud-offline-outline';
    if (state.pendingUpdates > 0) return 'cloud-upload-outline';
    return 'checkmark-circle-outline';
  };

  return (
    <TouchableOpacity 
      style={[styles.compactContainer, { borderColor: getStatusColor() }]}
      onPress={onPress}
    >
      <Ionicons 
        name={getStatusIcon() as any} 
        size={16} 
        color={getStatusColor()}
        style={state.syncInProgress ? styles.spinningIcon : undefined}
      />
      
      {state.pendingUpdates > 0 && (
        <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.badgeText}>
            {state.pendingUpdates > 99 ? '99+' : state.pendingUpdates}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Floating action button style status
export const FloatingOfflineStatus: React.FC<{
  dataLayer: any;
  onPress?: () => void;
  bottom?: number;
  right?: number;
}> = ({ dataLayer, onPress, bottom = 100, right = 20 }) => {
  const { networkStatus } = useNetworkStatus();
  const { state } = useOfflineData(dataLayer);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for pending updates
  useEffect(() => {
    if (state.pendingUpdates > 0 || state.syncInProgress) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(pulse).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.pendingUpdates, state.syncInProgress, pulseAnim]);

  const shouldShow = 
    !networkStatus.isConnected || 
    state.syncInProgress || 
    state.pendingUpdates > 0 ||
    state.error !== null;

  if (!shouldShow) return null;

  const getStatusColor = () => {
    if (state.error) return '#FF6B6B';
    if (state.syncInProgress) return '#4ECDC4';
    if (!networkStatus.isConnected) return '#FFA726';
    if (state.pendingUpdates > 0) return '#42A5F5';
    return '#66BB6A';
  };

  const getStatusIcon = () => {
    if (state.error) return 'warning-outline';
    if (state.syncInProgress) return 'sync';
    if (!networkStatus.isConnected) return 'cloud-offline-outline';
    if (state.pendingUpdates > 0) return 'cloud-upload-outline';
    return 'checkmark-circle-outline';
  };

  return (
    <Animated.View 
      style={[
        styles.floatingContainer,
        {
          bottom,
          right,
          backgroundColor: getStatusColor(),
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={onPress}
      >
        <Ionicons 
          name={getStatusIcon() as any} 
          size={24} 
          color="#FFFFFF"
          style={state.syncInProgress ? styles.spinningIcon : undefined}
        />
        
        {state.pendingUpdates > 0 && (
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>
              {state.pendingUpdates > 99 ? '99+' : state.pendingUpdates}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  spinningIcon: {
    // Add rotation animation if needed
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtextText: {
    fontSize: 14,
    color: '#666',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  recommendations: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingContainer: {
    position: 'absolute',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBadgeText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
});