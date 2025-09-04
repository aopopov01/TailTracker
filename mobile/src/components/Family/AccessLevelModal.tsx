// Access Level Confirmation Modal for Family Owners
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { 
  Modal, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Radio, 
  Box,
  Avatar,
  useColorModeValue
} from 'native-base';
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

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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
            // TODO: Implement deny functionality
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>Confirm Family Access</Modal.Header>
        
        <Modal.Body>
          <VStack space={4}>
            {/* Member Info */}
            {pendingMember && (
              <Box p={4} borderWidth={1} borderColor={borderColor} rounded="md">
                <HStack space={3} alignItems="center">
                  <Avatar
                    size="md"
                    source={{ uri: pendingMember.user?.avatar_url }}
                    bg="blue.500"
                  >
                    {pendingMember.user?.full_name?.charAt(0) || '?'}
                  </Avatar>
                  <VStack flex={1}>
                    <Text fontSize="md" fontWeight="semibold">
                      {pendingMember.user?.full_name || 'Unknown User'}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {pendingMember.user?.email}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            )}
            
            {/* Access Level Selection */}
            <VStack space={3}>
              <Text fontSize="md" fontWeight="semibold">
                Choose Access Level:
              </Text>
              
              <Radio.Group
                name="accessLevel"
                value={selectedAccessLevel}
                onChange={setSelectedAccessLevel as any}
              >
                <VStack space={3}>
                  <Radio value="read" my={1}>
                    <VStack ml={3} flex={1}>
                      <Text fontWeight="medium">Read Only</Text>
                      <Text fontSize="sm" color="gray.500">
                        Can view pet profiles, health records, and photos. Cannot make changes.
                      </Text>
                    </VStack>
                  </Radio>
                  
                  <Radio value="read_write" my={1}>
                    <VStack ml={3} flex={1}>
                      <Text fontWeight="medium">Read & Write</Text>
                      <Text fontSize="sm" color="gray.500">
                        Can view and edit pet profiles, add health records, and upload photos.
                      </Text>
                    </VStack>
                  </Radio>
                </VStack>
              </Radio.Group>
            </VStack>
            
            {/* Security Note */}
            <Box p={3} bg="blue.50" rounded="md">
              <Text fontSize="xs" color="blue.800">
                💡 You can change their access level later from Family Settings.
              </Text>
            </Box>
            
            {/* Warning for Write Access */}
            {selectedAccessLevel === 'read_write' && (
              <Box p={3} bg="yellow.50" rounded="md">
                <Text fontSize="xs" color="yellow.800">
                  ⚠️ Read & Write access allows this person to modify pet information, add health records, and upload photos.
                </Text>
              </Box>
            )}
          </VStack>
        </Modal.Body>
        
        <Modal.Footer>
          <HStack space={3} flex={1}>
            <Button
              flex={1}
              variant="ghost"
              colorScheme="red"
              onPress={handleDeny}
              disabled={loading}
            >
              Deny Access
            </Button>
            
            <Button
              flex={1}
              onPress={handleConfirmAccess}
              isLoading={loading}
              loadingText="Confirming..."
            >
              Grant Access
            </Button>
          </HStack>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};