import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OfflineSyncEngine } from '../../services/OfflineSyncEngine';

interface SyncProgressModalProps {
  visible: boolean;
  onClose: () => void;
  syncEngine: OfflineSyncEngine;
  style?: any;
}

interface SyncItem {
  id: string;
  table: string;
  action: string;
  status: 'pending' | 'syncing' | 'success' | 'error';
  error?: string;
  progress?: number;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({
  visible,
  onClose,
  syncEngine,
  style
}) => {
  const [syncProgress, setSyncProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    current: '',
    percentage: 0,
    estimatedTimeRemaining: 0
  });

  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  // Listen for sync events
  useEffect(() => {
    if (!visible) return;

    const handleSyncStarted = () => {
      setSyncProgress(prev => ({ ...prev, percentage: 0 }));
    };

    const handleSyncProgress = (progress: any) => {
      setSyncProgress(progress);
    };

    const handleSyncCompleted = (progress: any) => {
      setSyncProgress(progress);
      // Auto-close after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    };

    const handleSyncFailed = (error: any) => {
      console.error('Sync failed:', error);
    };

    syncEngine.on('syncStarted', handleSyncStarted);
    syncEngine.on('syncProgress', handleSyncProgress);
    syncEngine.on('syncCompleted', handleSyncCompleted);
    syncEngine.on('syncFailed', handleSyncFailed);

    return () => {
      syncEngine.off('syncStarted', handleSyncStarted);
      syncEngine.off('syncProgress', handleSyncProgress);
      syncEngine.off('syncCompleted', handleSyncCompleted);
      syncEngine.off('syncFailed', handleSyncFailed);
    };
  }, [visible, syncEngine, onClose]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing':
        return <Ionicons name="sync" size={20} color="#4ECDC4" />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color="#66BB6A" />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#FF6B6B" />;
      default:
        return <Ionicons name="time-outline" size={20} color="#999" />;
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${syncProgress.percentage}%`,
            },
          ]}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>
      
      <View style={styles.progressText}>
        <Text style={styles.percentageText}>
          {Math.round(syncProgress.percentage)}%
        </Text>
        <Text style={styles.progressDetails}>
          {syncProgress.completed} of {syncProgress.total} items
        </Text>
      </View>
    </View>
  );

  const renderCurrentItem = () => (
    <View style={styles.currentItemContainer}>
      <View style={styles.syncingIcon}>
        <Ionicons name="sync" size={24} color="#4ECDC4" />
      </View>
      
      <View style={styles.currentItemText}>
        <Text style={styles.currentItemTitle}>
          {syncProgress.current || 'Preparing sync...'}
        </Text>
        
        {syncProgress.estimatedTimeRemaining > 0 && (
          <Text style={styles.timeRemaining}>
            About {formatTimeRemaining(syncProgress.estimatedTimeRemaining)} remaining
          </Text>
        )}
      </View>
    </View>
  );

  const renderSyncStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Ionicons name="checkmark-circle" size={18} color="#66BB6A" />
        <Text style={styles.statNumber}>{syncProgress.completed}</Text>
        <Text style={styles.statLabel}>Synced</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Ionicons name="close-circle" size={18} color="#FF6B6B" />
        <Text style={styles.statNumber}>{syncProgress.failed}</Text>
        <Text style={styles.statLabel}>Failed</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Ionicons name="time-outline" size={18} color="#999" />
        <Text style={styles.statNumber}>
          {syncProgress.total - syncProgress.completed - syncProgress.failed}
        </Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
    </View>
  );

  const renderExpandedDetails = () => {
    if (!isExpanded) return null;

    return (
      <View style={styles.expandedContainer}>
        <Text style={styles.detailsTitle}>Sync Details</Text>
        
        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          {syncItems.map((item) => (
            <View key={item.id} style={styles.syncItemRow}>
              {getStatusIcon(item.status)}
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemTable}>
                  {item.table.replace('_', ' ')} - {item.action}
                </Text>
                
                {item.error && (
                  <Text style={styles.itemError}>{item.error}</Text>
                )}
              </View>
              
              {item.progress !== undefined && (
                <Text style={styles.itemProgress}>
                  {Math.round(item.progress)}%
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }]
            },
            style
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Syncing Your Data</Text>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            {renderProgressBar()}
            {renderCurrentItem()}
            {renderSyncStats()}
          </View>

          {/* Expand/Collapse Toggle */}
          <TouchableOpacity
            style={styles.expandToggle}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.expandText}>
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>

          {/* Expanded Details */}
          {renderExpandedDetails()}

          {/* Actions */}
          {syncProgress.percentage === 100 && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Compact sync progress indicator
export const CompactSyncProgress: React.FC<{
  syncEngine: OfflineSyncEngine;
  onPress?: () => void;
}> = ({ syncEngine, onPress }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleSyncStarted = () => setIsVisible(true);
    const handleSyncProgress = (prog: any) => setProgress(prog.percentage);
    const handleSyncCompleted = () => {
      setTimeout(() => setIsVisible(false), 1000);
    };

    syncEngine.on('syncStarted', handleSyncStarted);
    syncEngine.on('syncProgress', handleSyncProgress);
    syncEngine.on('syncCompleted', handleSyncCompleted);

    return () => {
      syncEngine.off('syncStarted', handleSyncStarted);
      syncEngine.off('syncProgress', handleSyncProgress);
      syncEngine.off('syncCompleted', handleSyncCompleted);
    };
  }, [syncEngine]);

  if (!isVisible) return null;

  return (
    <TouchableOpacity style={styles.compactContainer} onPress={onPress}>
      <View style={styles.compactProgressRing}>
        <Ionicons name="sync" size={16} color="#4ECDC4" />
      </View>
      <Text style={styles.compactText}>{Math.round(progress)}%</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  progressSection: {
    padding: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  progressDetails: {
    fontSize: 14,
    color: '#666',
  },
  currentItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  syncingIcon: {
    marginRight: 12,
  },
  currentItemText: {
    flex: 1,
  },
  currentItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  timeRemaining: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  expandToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  expandText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  expandedContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    maxHeight: 200,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  itemsList: {
    paddingHorizontal: 20,
  },
  syncItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTable: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  itemError: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 2,
  },
  itemProgress: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  doneButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compactProgressRing: {
    marginRight: 8,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
});