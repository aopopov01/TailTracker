import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SharingService } from '../../services/sharingService';
import { useAuth } from '../../contexts/AuthContext';
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { TailTrackerModal } from '../UI/TailTrackerModal';
import * as Haptics from 'expo-haptics';

interface QRCodeScannerProps {
  onClose: () => void;
  onAccessGranted: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onClose,
  onAccessGranted
}) => {
  const { user } = useAuth();
  const { modalConfig, showModal, hideModal, showWarning, showSuccess, showError } = useTailTrackerModal();
  const [manualToken, setManualToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleManualTokenSubmit = async () => {
    if (!manualToken.trim()) {
      showWarning('Invalid Token', 'Please enter a sharing token', 'qr-code-outline');
      return;
    }

    if (!user) {
      showWarning('Authentication Required', 'Please log in to access shared pets', 'lock-closed-outline');
      return;
    }

    setIsProcessing(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const success = await SharingService.processSharedAccess(manualToken.trim(), user.id);

      if (success) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        showModal({
          title: 'Access Granted! 🎉',
          message: 'You now have access to the shared pet information.',
          type: 'success',
          icon: 'checkmark-circle',
          actions: [
            {
              text: 'View Shared Pets',
              style: 'primary',
              onPress: () => {
                hideModal();
                onClose();
                onAccessGranted();
              }
            }
          ]
        });
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        showError(
          'Invalid or Expired Token',
          'The sharing token is invalid or has expired. Please check with the pet owner for a new code.',
          'time'
        );
      }
    } catch (error) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      console.error('Error processing shared access:', error);
      showError(
        'Access Failed',
        'Unable to process the sharing token. Please try again or contact the pet owner.',
        'alert-circle'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Sharing Code</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Information Banner */}
          <View style={styles.infoBanner}>
            <MaterialIcons name="info" size={24} color="#007AFF" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Camera Not Available</Text>
              <Text style={styles.infoText}>
                QR code scanning requires a development build. Please enter the sharing token manually.
              </Text>
            </View>
          </View>

          {/* Manual Entry Form */}
          <View style={styles.manualEntrySection}>
            <Text style={styles.sectionTitle}>Sharing Token</Text>
            <Text style={styles.sectionDescription}>
              Enter the sharing token provided by the pet owner
            </Text>

            <TextInput
              style={styles.tokenInput}
              placeholder="Enter sharing token (64 characters)"
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!manualToken.trim() || isProcessing) && styles.submitButtonDisabled
              ]}
              onPress={handleManualTokenSubmit}
              disabled={!manualToken.trim() || isProcessing}
            >
              {isProcessing ? (
                <Text style={styles.submitButtonText}>Processing...</Text>
              ) : (
                <>
                  <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Access Shared Pets</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>How to get a sharing token:</Text>
            <Text style={styles.instructionItem}>
              1. Ask the pet owner to generate a QR code in TailTracker
            </Text>
            <Text style={styles.instructionItem}>
              2. Have them share the QR code with you
            </Text>
            <Text style={styles.instructionItem}>
              3. Enter the token from the QR code above
            </Text>
            <Text style={styles.instructionItem}>
              4. Access expires automatically after 24 hours
            </Text>
          </View>
        </View>
      </SafeAreaView>
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={modalConfig.actions?.[0]?.onPress || hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  manualEntrySection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 20,
  },
  tokenInput: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F9F9F9',
    marginBottom: 16,
    minHeight: 80,
    fontFamily: 'Courier',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default QRCodeScanner;