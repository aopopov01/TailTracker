// QR Code Scanner Component for Joining Families
import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Text, Modal, RadioButton, Card, useTheme, Portal } from 'react-native-paper';
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
  const theme = useTheme();

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
      <Portal>
        <Modal visible={isOpen} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
          <Card style={styles.permissionCard}>
            <Card.Title title="Camera Permission Required" />
            <Card.Content>
              <View style={styles.verticalStack}>
                <Text style={styles.permissionText}>
                  TailTracker needs camera access to scan QR codes for family invitations.
                </Text>
                <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
                  Grant Camera Permission
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const scannerSize = screenWidth * 0.7;
  const overlayColor = 'rgba(0, 0, 0, 0.6)';

  return (
    <Portal>
      <Modal visible={isOpen} onDismiss={onClose} contentContainerStyle={styles.fullScreenModal}>
        <View style={styles.scannerContainer}>
        
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
            <View style={[styles.overlaySection, styles.instructionsArea, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
              <View style={styles.verticalStack}>
                <Text style={styles.instructionTitle}>
                  Scan Family Invite QR Code
                </Text>
                <Text style={styles.instructionSubtitle}>
                  Position the QR code within the frame to join a family
                </Text>
                
                {processing && (
                  <View style={styles.processingBox}>
                    <Text style={styles.processingText}>
                      Processing invite...
                    </Text>
                  </View>
                )}
                
                {scanned && !processing && (
                  <Button
                    mode="outlined"
                    onPress={() => setScanned(false)}
                    style={styles.scanAgainButton}
                    labelStyle={styles.scanAgainButtonText}
                  >
                    Scan Again
                  </Button>
                )}
              </View>
            </View>
          </View>
        </CameraView>
        </View>
      </Modal>
    </Portal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionCard: {
    minWidth: 300,
  },
  verticalStack: {
    gap: 16,
    alignItems: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionButton: {
    marginTop: 8,
  },
  fullScreenModal: {
    flex: 1,
    margin: 0,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  instructionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionSubtitle: {
    color: '#e0e0e0',
    fontSize: 14,
    textAlign: 'center',
  },
  processingBox: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  processingText: {
    color: 'white',
    fontSize: 14,
  },
  scanAgainButton: {
    borderColor: 'white',
  },
  scanAgainButtonText: {
    color: 'white',
  },
});