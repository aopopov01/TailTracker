/**
 * Sync History Modal Component
 * 
 * Displays detailed sync history and logs for debugging
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSyncHistory, useDataSync } from '@/hooks/useDataSync';
import { colors } from '@/design-system/core/colors';

interface SyncHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SyncHistoryModal: React.FC<SyncHistoryModalProps> = ({
  visible,
  onClose
}) => {
  const { history, loading, error, refresh } = useSyncHistory(100);
  const { clearFailedSyncs, retryFailedSyncs } = useDataSync();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return { name: 'check-circle', color: colors.success };
      case 'failed':
        return { name: 'alert-circle', color: colors.error };
      case 'pending':
        return { name: 'clock-outline', color: colors.warning };
      default:
        return { name: 'sync', color: colors.primary };
    }
  };

  const getSyncTypeLabel = (syncType: string) => {
    switch (syncType) {
      case 'user_profile':
        return 'User Profile';
      case 'pet_data':
        return 'Pet Data';
      case 'veterinarian':
        return 'Veterinarian';
      case 'full_sync':
        return 'Full Sync';
      default:
        return syncType;
    }
  };

  const handleClearFailed = () => {
    Alert.alert(
      'Clear Failed Syncs',
      'This will remove all failed sync operations from the queue. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearFailedSyncs();
            refresh();
          }
        }
      ]
    );
  };

  const handleRetryFailed = () => {
    Alert.alert(
      'Retry Failed Syncs',
      'This will retry all failed sync operations. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: async () => {
            await retryFailedSyncs();
            refresh();
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            paddingTop: 60,
            backgroundColor: colors.background.secondary,
            borderBottomWidth: 1,
            borderBottomColor: colors.neutral.gray300
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: colors.text.primary
            }}
          >
            Sync History
          </Text>
          
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View
          style={{
            flexDirection: 'row',
            padding: 16,
            gap: 12,
            backgroundColor: colors.background.secondary
          }}
        >
          <TouchableOpacity
            onPress={handleRetryFailed}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              padding: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontWeight: '500' }}>
              Retry Failed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleClearFailed}
            style={{
              flex: 1,
              backgroundColor: colors.error,
              padding: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontWeight: '500' }}>
              Clear Failed
            </Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {error && (
            <View
              style={{
                margin: 16,
                padding: 16,
                backgroundColor: colors.neutral.gray100,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: colors.error
              }}
            >
              <Text style={{ color: colors.error, fontWeight: '500' }}>
                Error loading sync history
              </Text>
              <Text style={{ color: colors.error, marginTop: 4 }}>
                {error}
              </Text>
            </View>
          )}

          {history.length === 0 && !loading && (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40
              }}
            >
              <MaterialCommunityIcons
                name="sync-off"
                size={48}
                color={colors.text.secondary}
              />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: colors.text.secondary,
                  textAlign: 'center'
                }}
              >
                No sync history available
              </Text>
            </View>
          )}

          {history.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const statusIcon = getStatusIcon(item.sync_status);

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleExpanded(item.id)}
                style={{
                  marginHorizontal: 16,
                  marginVertical: 4,
                  backgroundColor: colors.background.secondary,
                  borderRadius: 8,
                  overflow: 'hidden',
                  borderLeftWidth: 4,
                  borderLeftColor: statusIcon.color
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16
                  }}
                >
                  <MaterialCommunityIcons
                    name={statusIcon.name as any}
                    size={20}
                    color={statusIcon.color}
                  />
                  
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: colors.text.primary
                      }}
                    >
                      {getSyncTypeLabel(item.sync_type)}
                    </Text>
                    
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.text.secondary,
                        marginTop: 2
                      }}
                    >
                      {formatDate(item.created_at)}
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingBottom: 16,
                      borderTopWidth: 1,
                      borderTopColor: colors.neutral.gray300
                    }}
                  >
                    {/* Target Table */}
                    <View style={{ marginBottom: 8 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: colors.text.secondary,
                          marginBottom: 2
                        }}
                      >
                        Target Table:
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.text.primary
                        }}
                      >
                        {item.target_table}
                      </Text>
                    </View>

                    {/* Status */}
                    <View style={{ marginBottom: 8 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: colors.text.secondary,
                          marginBottom: 2
                        }}
                      >
                        Status:
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: statusIcon.color,
                          fontWeight: '500'
                        }}
                      >
                        {item.sync_status.toUpperCase()}
                      </Text>
                    </View>

                    {/* Completion time */}
                    {item.completed_at && (
                      <View style={{ marginBottom: 8 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: colors.text.secondary,
                            marginBottom: 2
                          }}
                        >
                          Completed:
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.text.primary
                          }}
                        >
                          {formatDate(item.completed_at)}
                        </Text>
                      </View>
                    )}

                    {/* Error message */}
                    {item.error_message && (
                      <View style={{ marginBottom: 8 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: colors.error,
                            marginBottom: 2
                          }}
                        >
                          Error:
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.error,
                            fontStyle: 'italic'
                          }}
                        >
                          {item.error_message}
                        </Text>
                      </View>
                    )}

                    {/* Sync details */}
                    {item.sync_details && (
                      <View>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: colors.text.secondary,
                            marginBottom: 2
                          }}
                        >
                          Details:
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.text.primary,
                            fontFamily: 'monospace',
                            backgroundColor: colors.background.primary,
                            padding: 8,
                            borderRadius: 4
                          }}
                        >
                          {JSON.stringify(item.sync_details, null, 2)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};