import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ConflictResolution } from '../../services/OfflineSyncEngine';

interface ConflictResolutionModalProps {
  visible: boolean;
  conflicts: ConflictResolution[];
  onResolve: (conflictId: string, resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE', mergedData?: any) => Promise<void>;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  conflicts,
  onResolve,
  onClose,
}) => {
  const [selectedConflict, setSelectedConflict] = useState<ConflictResolution | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && conflicts.length > 0) {
      setSelectedConflict(conflicts[0]);
    }
  }, [visible, conflicts]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  const handleResolve = async (resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE', mergedData?: any) => {
    if (!selectedConflict) return;

    setIsResolving(true);
    try {
      await onResolve(selectedConflict.recordId, resolution, mergedData);
      
      // Move to next conflict or close if this was the last one
      const currentIndex = conflicts.findIndex(c => c.recordId === selectedConflict.recordId);
      if (currentIndex < conflicts.length - 1) {
        setSelectedConflict(conflicts[currentIndex + 1]);
      } else {
        onClose();
      }
    } catch (error) {
      Alert.alert('Resolution Failed', 'Failed to resolve conflict. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const renderDataComparison = (localData: any, serverData: any) => {
    const localKeys = Object.keys(localData || {});
    const serverKeys = Object.keys(serverData || {});
    const allKeys = [...new Set([...localKeys, ...serverKeys])];

    return (
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonHeader}>
          <View style={styles.columnHeader}>
            <Ionicons name="phone-portrait-outline" size={16} color="#42A5F5" />
            <Text style={[styles.headerText, { color: '#42A5F5' }]}>Your Device</Text>
          </View>
          <View style={styles.columnHeader}>
            <Ionicons name="cloud-outline" size={16} color="#66BB6A" />
            <Text style={[styles.headerText, { color: '#66BB6A' }]}>Server</Text>
          </View>
        </View>

        <ScrollView style={styles.comparisonBody} showsVerticalScrollIndicator={false}>
          {allKeys.map((key) => {
            const localValue = localData?.[key];
            const serverValue = serverData?.[key];
            const isDifferent = JSON.stringify(localValue) !== JSON.stringify(serverValue);

            return (
              <View key={key} style={[styles.fieldRow, isDifferent && styles.conflictRow]}>
                <Text style={styles.fieldLabel}>{key}</Text>
                
                <View style={styles.valuesContainer}>
                  <View style={styles.valueColumn}>
                    <Text style={[
                      styles.fieldValue,
                      isDifferent && { color: '#42A5F5', fontWeight: '600' }
                    ]}>
                      {formatValue(localValue)}
                    </Text>
                  </View>
                  
                  <View style={styles.valueColumn}>
                    <Text style={[
                      styles.fieldValue,
                      isDifferent && { color: '#66BB6A', fontWeight: '600' }
                    ]}>
                      {formatValue(serverValue)}
                    </Text>
                  </View>
                </View>

                {isDifferent && (
                  <View style={styles.conflictIndicator}>
                    <Ionicons name="warning" size={14} color="#FFA726" />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.length > 50) return value.substring(0, 47) + '...';
    return String(value);
  };

  const getConflictTypeDescription = (type: string) => {
    switch (type) {
      case 'UPDATE_CONFLICT':
        return 'Both you and another user modified this item at the same time.';
      case 'DELETE_CONFLICT':
        return 'This item was deleted on the server while you were modifying it.';
      case 'CREATE_CONFLICT':
        return 'A similar item was created on the server while you were offline.';
      default:
        return 'A conflict occurred while syncing your data.';
    }
  };

  const renderConflictSelector = () => {
    if (conflicts.length <= 1) return null;

    return (
      <View style={styles.conflictSelector}>
        <Text style={styles.selectorLabel}>
          Conflict {conflicts.findIndex(c => c.recordId === selectedConflict?.recordId) + 1} of {conflicts.length}
        </Text>
        
        <View style={styles.selectorButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              const currentIndex = conflicts.findIndex(c => c.recordId === selectedConflict?.recordId);
              if (currentIndex > 0) {
                setSelectedConflict(conflicts[currentIndex - 1]);
              }
            }}
            disabled={conflicts.findIndex(c => c.recordId === selectedConflict?.recordId) === 0}
          >
            <Ionicons name="chevron-back" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              const currentIndex = conflicts.findIndex(c => c.recordId === selectedConflict?.recordId);
              if (currentIndex < conflicts.length - 1) {
                setSelectedConflict(conflicts[currentIndex + 1]);
              }
            }}
            disabled={conflicts.findIndex(c => c.recordId === selectedConflict?.recordId) === conflicts.length - 1}
          >
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderResolutionOptions = () => (
    <View style={styles.resolutionOptions}>
      <Text style={styles.optionsTitle}>Choose Resolution:</Text>
      
      <TouchableOpacity
        style={[styles.optionButton, { borderColor: '#42A5F5' }]}
        onPress={() => handleResolve('LOCAL_WINS')}
        disabled={isResolving}
      >
        <LinearGradient
          colors={['#42A5F5', '#1E88E5']}
          style={styles.optionGradient}
        >
          <Ionicons name="phone-portrait" size={20} color="#FFFFFF" />
          <Text style={styles.optionTitle}>Keep My Version</Text>
          <Text style={styles.optionDescription}>Use the data from your device</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, { borderColor: '#66BB6A' }]}
        onPress={() => handleResolve('SERVER_WINS')}
        disabled={isResolving}
      >
        <LinearGradient
          colors={['#66BB6A', '#4CAF50']}
          style={styles.optionGradient}
        >
          <Ionicons name="cloud-download" size={20} color="#FFFFFF" />
          <Text style={styles.optionTitle}>Keep Server Version</Text>
          <Text style={styles.optionDescription}>Use the data from the server</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, { borderColor: '#FFA726' }]}
        onPress={() => {
          // For now, we'll just merge automatically
          // In a full implementation, this could open a merge editor
          handleResolve('MERGE');
        }}
        disabled={isResolving}
      >
        <LinearGradient
          colors={['#FFA726', '#FF9800']}
          style={styles.optionGradient}
        >
          <Ionicons name="git-merge" size={20} color="#FFFFFF" />
          <Text style={styles.optionTitle}>Smart Merge</Text>
          <Text style={styles.optionDescription}>Automatically combine both versions</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (!selectedConflict) return null;

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
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="git-branch" size={24} color="#FF6B6B" />
              <Text style={styles.headerTitle}>Data Conflict Detected</Text>
            </View>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Conflict Navigation */}
          {renderConflictSelector()}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Conflict Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.conflictType}>
                {selectedConflict.conflictType.replace('_', ' ')}
              </Text>
              <Text style={styles.conflictDescription}>
                {getConflictTypeDescription(selectedConflict.conflictType)}
              </Text>
            </View>

            {/* Toggle Diff View */}
            <TouchableOpacity
              style={styles.diffToggle}
              onPress={() => setShowDiff(!showDiff)}
            >
              <Ionicons 
                name={showDiff ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#666" 
              />
              <Text style={styles.diffToggleText}>
                {showDiff ? 'Hide' : 'Show'} Data Differences
              </Text>
              <Ionicons 
                name={showDiff ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>

            {/* Data Comparison */}
            {showDiff && renderDataComparison(selectedConflict.localData, selectedConflict.serverData)}

            {/* Resolution Options */}
            {renderResolutionOptions()}

            {/* Skip Option */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                const currentIndex = conflicts.findIndex(c => c.recordId === selectedConflict.recordId);
                if (currentIndex < conflicts.length - 1) {
                  setSelectedConflict(conflicts[currentIndex + 1]);
                } else {
                  onClose();
                }
              }}
            >
              <Text style={styles.skipButtonText}>Skip This Conflict</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Loading Overlay */}
          {isResolving && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <Ionicons name="sync" size={24} color="#4ECDC4" />
                <Text style={styles.loadingText}>Resolving conflict...</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: SCREEN_WIDTH - 40,
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    backgroundColor: '#FFF5F5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  conflictSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectorLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectorButtons: {
    flexDirection: 'row',
  },
  navButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  descriptionContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  conflictType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  conflictDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  diffToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  diffToggleText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  comparisonContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  columnHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  comparisonBody: {
    maxHeight: 200,
  },
  fieldRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  conflictRow: {
    backgroundColor: '#FFF8E1',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  valuesContainer: {
    flexDirection: 'row',
  },
  valueColumn: {
    flex: 1,
    marginRight: 10,
  },
  fieldValue: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  conflictIndicator: {
    position: 'absolute',
    right: 20,
    top: 12,
  },
  resolutionOptions: {
    padding: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  optionButton: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  optionGradient: {
    padding: 16,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});