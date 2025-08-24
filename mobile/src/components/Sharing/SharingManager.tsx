import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SharingService } from '../../services/sharingService';
import { SharingToken, SharedAccess } from '../../../services/database';
import { useAuth } from '../../contexts/AuthContext';
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { TailTrackerModal } from '../UI/TailTrackerModal';

interface SharingManagerProps {
  onClose?: () => void;
  onGenerateNew?: () => void;
}

interface ExtendedSharedAccess extends SharedAccess {
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
}

const SharingManager: React.FC<SharingManagerProps> = ({
  onClose,
  onGenerateNew
}) => {
  const { user } = useAuth();
  const { modalConfig, showModal, hideModal, showError, showSuccess, showConfirm } = useTailTrackerModal();
  const [activeTokens, setActiveTokens] = useState<SharingToken[]>([]);
  const [sharedAccess, setSharedAccess] = useState<ExtendedSharedAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSharingData();
  }, []);

  const loadSharingData = async () => {
    if (!user) return;

    try {
      const [tokens, access] = await Promise.all([
        SharingService.getUserSharingTokens(user.id),
        SharingService.getActiveSharedAccess(user.id)
      ]);

      setActiveTokens(tokens);
      setSharedAccess(access as ExtendedSharedAccess[]);
    } catch (error) {
      console.error('Error loading sharing data:', error);
      showError('Error', 'Failed to load sharing information', 'alert-circle');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSharingData();
  };

  const revokeToken = (token: SharingToken) => {
    showConfirm(
      'Revoke Sharing Code',
      'This will permanently disable this sharing code and remove access for all users who used it. This action cannot be undone.',
      async () => {
        try {
          const result = await SharingService.revokeSharingToken(token.id, user!.id);
          if (result.success) {
            showSuccess('Success', 'Sharing code has been revoked', 'checkmark-circle');
            loadSharingData();
          } else {
            showError('Error', result.error || 'Failed to revoke sharing code', 'alert-circle');
          }
        } catch (error) {
          console.error('Error revoking token:', error);
          showError('Error', 'Failed to revoke sharing code', 'alert-circle');
        }
      },
      'Revoke',
      'Cancel',
      true
    );
  };

  const revokeUserAccess = (access: ExtendedSharedAccess) => {
    showConfirm(
      'Remove User Access',
      `Remove access for ${access.guestFirstName} ${access.guestLastName}?`,
      async () => {
        try {
          const result = await SharingService.revokeUserAccess(access.id, user!.id);
          if (result.success) {
            showSuccess('Success', 'User access has been removed', 'checkmark-circle');
            loadSharingData();
          } else {
            showError('Error', result.error || 'Failed to remove user access', 'alert-circle');
          }
        } catch (error) {
          console.error('Error revoking user access:', error);
          showError('Error', 'Failed to remove user access', 'alert-circle');
        }
      },
      'Remove',
      'Cancel',
      true
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderTokenItem = ({ item }: { item: SharingToken }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <MaterialIcons name="qr-code" size={24} color="#007AFF" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>Sharing Code</Text>
          <Text style={styles.itemSubtitle}>
            Created: {formatDate(item.createdAt)}
          </Text>
          {item.lastUsedAt && (
            <Text style={styles.itemSubtitle}>
              Last used: {formatDate(item.lastUsedAt)}
            </Text>
          )}
        </View>
        <View style={styles.itemActions}>
          <View style={[
            styles.statusBadge,
            SharingService.isTokenExpired(item.expiresAt) ? styles.expiredBadge : styles.activeBadge
          ]}>
            <Text style={[
              styles.statusText,
              SharingService.isTokenExpired(item.expiresAt) ? styles.expiredText : styles.activeText
            ]}>
              {SharingService.isTokenExpired(item.expiresAt) ? 'Expired' : 'Active'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.revokeButton}
            onPress={() => revokeToken(item)}
          >
            <MaterialIcons name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.expirationContainer}>
        <MaterialIcons name="schedule" size={16} color="#8E8E93" />
        <Text style={styles.expirationText}>
          {SharingService.formatExpirationTime(item.expiresAt)}
        </Text>
      </View>
    </View>
  );

  const renderAccessItem = ({ item }: { item: ExtendedSharedAccess }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <MaterialIcons name="person" size={24} color="#34C759" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {item.guestFirstName} {item.guestLastName}
          </Text>
          <Text style={styles.itemSubtitle}>
            {item.guestEmail}
          </Text>
          <Text style={styles.itemSubtitle}>
            Access granted: {formatDate(item.accessGrantedAt)}
          </Text>
          {item.lastAccessedAt && (
            <Text style={styles.itemSubtitle}>
              Last viewed: {formatDate(item.lastAccessedAt)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => revokeUserAccess(item)}
        >
          <MaterialIcons name="remove-circle" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sharing information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manage Sharing</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Generate New Button */}
      <TouchableOpacity style={styles.generateButton} onPress={onGenerateNew}>
        <MaterialIcons name="qr-code" size={20} color="white" />
        <Text style={styles.generateButtonText}>Generate New QR Code</Text>
      </TouchableOpacity>

      {/* Active Tokens Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Sharing Codes ({activeTokens.length})</Text>
        {activeTokens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="qr-code" size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>No active sharing codes</Text>
            <Text style={styles.emptySubtext}>
              Generate a QR code to share your pet information
            </Text>
          </View>
        ) : (
          <FlatList
            data={activeTokens}
            renderItem={renderTokenItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>

      {/* Shared Access Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users with Access ({sharedAccess.length})</Text>
        {sharedAccess.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people" size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>No users have access</Text>
            <Text style={styles.emptySubtext}>
              Share a QR code for others to access your pet information
            </Text>
          </View>
        ) : (
          <FlatList
            data={sharedAccess}
            renderItem={renderAccessItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>

      {/* Help Section */}
      <View style={styles.helpContainer}>
        <MaterialIcons name="info" size={16} color="#8E8E93" />
        <Text style={styles.helpText}>
          Sharing codes expire automatically after 24 hours for security. 
          Users will only have read-only access to your pet information.
        </Text>
      </View>
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={modalConfig.actions?.[0]?.onPress || hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: '#E8F5E8',
  },
  expiredBadge: {
    backgroundColor: '#FFE8E8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#34C759',
  },
  expiredText: {
    color: '#FF3B30',
  },
  revokeButton: {
    padding: 8,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 36,
  },
  expirationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    margin: 20,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default SharingManager;