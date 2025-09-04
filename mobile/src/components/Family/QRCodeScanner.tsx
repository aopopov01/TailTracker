// QR Code Scanner Component for Joining Families
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, Dimensions } from 'react-native';
import { Button, VStack, HStack, Box, useColorModeValue, Modal, Radio } from 'native-base';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { familyAccessService, type FamilyInviteData, type AccessLevel } from '@/services/FamilyAccessService';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<FamilyInviteData | null>(null);
  const [showAccessLevelModal, setShowAccessLevelModal] = useState(false);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<AccessLevel>('read');
  const [processing, setProcessing] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const overlayColor = useColorModeValue('rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)');

  useEffect(() => {
    if (isOpen) {
      setScanned(false);
      setPendingInvite(null);
      setShowAccessLevelModal(false);
    }
  }, [isOpen]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);

    try {
      // Validate the QR code
      const result = await familyAccessService.processScannedInvite(data);
      
      if (!result.isValid) {
        Alert.alert('Invalid QR Code', result.error || 'This QR code is not valid');
        setScanned(false);
        return;
      }

      // Join family process
      const joinResult = await familyAccessService.joinFamilyWithQRCode(data);
      
      if (!joinResult.success) {
        Alert.alert('Failed to Join', joinResult.error || 'Could not join family');
        setScanned(false);
        return;
      }

      if (joinResult.requiresConfirmation) {
        // Show success message for pending confirmation
        Alert.alert(
          'Request Sent!',
          `Your request to join "${result.inviteData?.family_name}" has been sent to the family owner. They will need to confirm your access level.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess();
                onClose();
              }
            }
          ]
        );
      } else {
        // Direct join (shouldn't happen with new flow, but kept for safety)
        Alert.alert(
          'Welcome!',
          `You've joined "${result.inviteData?.family_name}" successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess();
                onClose();
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process QR code. Please try again.');
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Camera Permission Required</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Text>
                TailTracker needs camera access to scan QR codes for family invitations.
              </Text>
              <Button onPress={requestPermission}>
                Grant Camera Permission
              </Button>
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const scannerSize = screenWidth * 0.7;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <Modal.Content flex={1} bg="black">
        <Modal.CloseButton color="white" />
        
        {/* Camera View */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Overlay with scanning area */}
          <View style={[StyleSheet.absoluteFillObject, styles.overlay]}>
            {/* Top overlay */}
            <View style={[styles.overlaySection, { backgroundColor: overlayColor }]} />
            
            {/* Middle section with scanner frame */}
            <View style={styles.scannerRow}>
              <View style={[styles.overlaySection, { backgroundColor: overlayColor }]} />
              
              {/* Scanner frame */}
              <View style={[styles.scannerFrame, { width: scannerSize, height: scannerSize }]}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              
              <View style={[styles.overlaySection, { backgroundColor: overlayColor }]} />
            </View>
            
            {/* Bottom overlay with instructions */}
            <View style={[styles.overlaySection, styles.instructionsArea, { backgroundColor: overlayColor }]}>
              <VStack space={4} alignItems="center" px={6}>
                <Text color="white" fontSize="lg" fontWeight="semibold" textAlign="center">
                  Scan Family Invite QR Code
                </Text>
                <Text color="gray.200" fontSize="sm" textAlign="center">
                  Position the QR code within the frame to join a family
                </Text>
                
                {processing && (
                  <Box bg="blue.600" px={4} py={2} rounded="full">
                    <Text color="white" fontSize="sm">
                      Processing invite...
                    </Text>
                  </Box>
                )}
                
                {scanned && !processing && (
                  <Button
                    variant="outline"
                    colorScheme="white"
                    onPress={() => setScanned(false)}
                  >
                    Scan Again
                  </Button>
                )}
              </VStack>
            </View>
          </View>
        </CameraView>
      </Modal.Content>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlaySection: {
    flex: 1,
  },
  scannerRow: {
    flexDirection: 'row',
    height: 250,
  },
  scannerFrame: {
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00ff00',
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsArea: {
    justifyContent: 'center',
    minHeight: 150,
  },
});