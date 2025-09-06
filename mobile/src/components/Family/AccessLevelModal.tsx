// Access Level Confirmation Modal for Family Owners
import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { 
  Modal as RNModal,
  Portal,
  Text,
  Button,
  RadioButton,
  Avatar,
  Card,
  useTheme
} from 'react-native-paper';
import { familyAccessService, type AccessLevel } from '@/services/FamilyAccessService';

interface PendingMember {
  id: string;
  potential_member_id: string;
  invite_token: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface AccessLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingMember: PendingMember | null;
  onConfirmed: () => void;
}

export const AccessLevelModal: React.FC<AccessLevelModalProps> = ({
  isOpen,
  onClose,
  pendingMember,
  onConfirmed
}) => {
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<AccessLevel>('read');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleConfirmAccess = async () => {
    if (!pendingMember) return;
    
    try {
      setLoading(true);
      
      const result = await familyAccessService.confirmFamilyMemberAccess(
        pendingMember.invite_token,
        pendingMember.potential_member_id,
        selectedAccessLevel
      );
      
      if (result.success) {
        Alert.alert(
          'Access Granted!',
          `${pendingMember.user?.full_name || 'Family member'} now has ${selectedAccessLevel === 'read' ? 'read-only' : 'read and write'} access to your family's pet information.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onConfirmed();
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to grant access. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = () => {
    Alert.alert(
      'Deny Access',
      `Are you sure you want to deny access to ${pendingMember?.user?.full_name || 'this person'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Deny', 
          style: 'destructive',
          onPress: () => {
            // Deny family member access and close modal
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Portal>
      <RNModal
        visible={isOpen}
        onDismiss={onClose}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.modalContent}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Confirm Family Access
          </Text>
          
          <View style={styles.modalBody}>
            {/* Member Info */}
            {pendingMember && (
              <Card style={[styles.memberCard, { borderColor: theme.colors.outline }]}>
                <Card.Content>
                  <View style={styles.memberInfo}>
                    <Avatar.Text
                      size={48}
                      label={pendingMember.user?.full_name?.charAt(0) || '?'}
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <View style={styles.memberDetails}>
                      <Text variant="titleMedium">
                        {pendingMember.user?.full_name || 'Unknown User'}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {pendingMember.user?.email}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}
            
            {/* Access Level Selection */}
            <View style={styles.accessLevelSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Choose Access Level:
              </Text>
              
              <RadioButton.Group
                onValueChange={(value) => setSelectedAccessLevel(value as AccessLevel)}
                value={selectedAccessLevel}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="read" />
                  <View style={styles.radioContent}>
                    <Text variant="titleSmall">Read Only</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Can view pet profiles, health records, and photos. Cannot make changes.
                    </Text>
                  </View>
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton value="read_write" />
                  <View style={styles.radioContent}>
                    <Text variant="titleSmall">Read & Write</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Can view and edit pet profiles, add health records, and upload photos.
                    </Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>
            
            {/* Security Note */}
            <Card style={[styles.noteCard, { backgroundColor: theme.colors.primaryContainer }]}>
              <Card.Content>
                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  💡 You can change their access level later from Family Settings.
                </Text>
              </Card.Content>
            </Card>
            
            {/* Warning for Write Access */}
            {selectedAccessLevel === 'read_write' && (
              <Card style={[styles.noteCard, { backgroundColor: theme.colors.errorContainer }]}>
                <Card.Content>
                  <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                    ⚠️ Read & Write access allows this person to modify pet information, add health records, and upload photos.
                  </Text>
                </Card.Content>
              </Card>
            )}
          </View>
          
          <View style={styles.modalFooter}>
            <Button
              mode="text"
              onPress={handleDeny}
              disabled={loading}
              buttonColor={theme.colors.errorContainer}
              textColor={theme.colors.onErrorContainer}
              style={styles.footerButton}
            >
              Deny Access
            </Button>
            
            <Button
              mode="contained"
              onPress={handleConfirmAccess}
              loading={loading}
              disabled={loading}
              style={styles.footerButton}
            >
              Grant Access
            </Button>
          </View>
        </View>
      </RNModal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBody: {
    gap: 16,
  },
  memberCard: {
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDetails: {
    flex: 1,
  },
  accessLevelSection: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
  },
  radioContent: {
    flex: 1,
    gap: 4,
  },
  noteCard: {
    padding: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  footerButton: {
    flex: 1,
  },
});