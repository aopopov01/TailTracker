/**
 * Sync Status Indicator Component
 * 
 * Displays the current synchronization status in the UI
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDataSync, useSyncNotifications } from '@/hooks/useDataSync';
import { colors } from '@/design-system/core/colors';

interface SyncStatusIndicatorProps {
  variant?: 'badge' | 'full' | 'minimal';
  onPress?: () => void;
  showRetryButton?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  variant = 'badge',
  onPress,
  showRetryButton = true
}) => {
  const { syncStatus, syncProgress, retryFailedSyncs, queueFullSync } = useDataSync();
  const { notification, hideNotification } = useSyncNotifications();

  // Determine status info
  const getStatusInfo = () => {
    if (syncStatus.inProgress) {
      return {
        icon: 'sync' as const,
        color: colors.primary,
        text: syncProgress ? `Syncing... ${syncProgress.percentage}%` : 'Syncing...',
        animated: true
      };
    }
    
    if (syncStatus.failedOperations.length > 0) {
      return {
        icon: 'alert-circle' as const,
        color: colors.error,
        text: `${syncStatus.failedOperations.length} sync(s) failed`,
        animated: false
      };
    }
    
    if (syncStatus.queueSize > 0) {
      return {
        icon: 'clock-outline' as const,
        color: colors.warning,
        text: `${syncStatus.queueSize} pending`,
        animated: false
      };
    }
    
    return {
      icon: 'check-circle' as const,
      color: colors.success,
      text: 'All synced',
      animated: false
    };
  };

  const statusInfo = getStatusInfo();

  // Handle press actions
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (syncStatus.failedOperations.length > 0) {
      retryFailedSyncs();
    } else {
      queueFullSync();
    }
  };

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <TouchableOpacity onPress={handlePress} style={{ padding: 4 }}>
        {statusInfo.animated ? (
          <ActivityIndicator size="small" color={statusInfo.color} />
        ) : (
          <MaterialCommunityIcons
            name={statusInfo.icon}
            size={20}
            color={statusInfo.color}
          />
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'badge') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: `${statusInfo.color}15`,
          borderColor: statusInfo.color,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 4,
          maxWidth: 120
        }}
      >
        {statusInfo.animated ? (
          <ActivityIndicator size="small" color={statusInfo.color} />
        ) : (
          <MaterialCommunityIcons
            name={statusInfo.icon}
            size={16}
            color={statusInfo.color}
          />
        )}
        <Text
          style={{
            marginLeft: 4,
            fontSize: 12,
            fontWeight: '500',
            color: statusInfo.color
          }}
          numberOfLines={1}
        >
          {statusInfo.text}
        </Text>
      </TouchableOpacity>
    );
  }

  // Full variant
  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {statusInfo.animated ? (
          <ActivityIndicator size="small" color={statusInfo.color} />
        ) : (
          <MaterialCommunityIcons
            name={statusInfo.icon}
            size={24}
            color={statusInfo.color}
          />
        )}
        <Text
          style={{
            marginLeft: 8,
            fontSize: 16,
            fontWeight: '600',
            color: colors.text.primary
          }}
        >
          {statusInfo.text}
        </Text>
      </View>

      {/* Progress bar */}
      {syncProgress && (
        <View
          style={{
            height: 4,
            backgroundColor: colors.background.secondary,
            borderRadius: 2,
            overflow: 'hidden',
            marginBottom: 8
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${syncProgress.percentage}%`,
              backgroundColor: statusInfo.color,
              borderRadius: 2
            }}
          />
        </View>
      )}

      {/* Current operation */}
      {syncProgress && (
        <Text
          style={{
            fontSize: 12,
            color: colors.text.secondary,
            marginBottom: 8
          }}
        >
          {syncProgress.current}
        </Text>
      )}

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {showRetryButton && syncStatus.failedOperations.length > 0 && (
          <TouchableOpacity
            onPress={retryFailedSyncs}
            style={{
              backgroundColor: colors.error,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
              Retry Failed
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={() => queueFullSync()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6
          }}
          disabled={syncStatus.inProgress}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
            Full Sync
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification overlay */}
      {notification && notification.visible && (
        <TouchableOpacity
          onPress={hideNotification}
          style={{
            position: 'absolute',
            top: 0,
            left: 16,
            right: 16,
            backgroundColor: notification.type === 'error' ? colors.error : 
                           notification.type === 'success' ? colors.success : 
                           colors.primary,
            padding: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
          }}
        >
          <MaterialCommunityIcons
            name={notification.type === 'error' ? 'alert-circle' : 
                  notification.type === 'success' ? 'check-circle' : 'information'}
            size={20}
            color="white"
          />
          <Text
            style={{
              marginLeft: 8,
              color: 'white',
              fontSize: 14,
              fontWeight: '500',
              flex: 1
            }}
          >
            {notification.message}
          </Text>
          <MaterialCommunityIcons name="close" size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};