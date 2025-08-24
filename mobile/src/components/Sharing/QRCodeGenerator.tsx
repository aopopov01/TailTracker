import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { SharingService, QRCodeData } from '../../services/sharingService';
import { useAuth } from '../../contexts/AuthContext';
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { TailTrackerModal } from '../UI/TailTrackerModal';

interface QRCodeGeneratorProps {
  onClose?: () => void;
  expirationHours?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  onClose,
  expirationHours = 24
}) => {
  const { user } = useAuth();
  const { modalConfig, showModal, hideModal, showWarning, showSuccess, showError, showConfirm } = useTailTrackerModal();
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expirationTime, setExpirationTime] = useState<string | null>(null);
  const [qrRef, setQrRef] = useState<any>(null);

  const screenWidth = Dimensions.get('window').width;
  const qrSize = Math.min(screenWidth * 0.7, 300);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const result = await SharingService.generateSharingToken(user.id, expirationHours);
      
      if (result.success && result.token) {
        const qrCodeData: QRCodeData = SharingService.createQRCodeData(result.token);
        const qrDataString = JSON.stringify(qrCodeData);
        
        setQrData(qrDataString);
        setToken(result.token);
        
        // Calculate expiration time
        const expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
        setExpirationTime(expiresAt.toISOString());
      } else {
        showError('Error', result.error || 'Failed to generate sharing code', 'alert-circle');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      showError('Error', 'Failed to generate sharing code', 'alert-circle');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareQRCode = async () => {
    if (!qrData || !token) return;

    try {
      const shareUrl = `tailtracker://share/${token}`;
      const message = `Scan this QR code or use this link to access my pet information in TailTracker: ${shareUrl}\n\nThis link expires in ${expirationHours} hours.`;

      await Share.share({
        message,
        title: 'Share Pet Information',
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      showError('Error', 'Failed to share QR code', 'alert-circle');
    }
  };

  const saveQRCode = async () => {
    if (!qrRef || !qrData) return;

    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showWarning('Permission Required', 'Please grant permission to save images to your photo library', 'folder');
        return;
      }

      // Generate SVG and save as PNG would require additional setup
      // For now, we'll show an info message
      showSuccess(
        'QR Code Generated',
        'Take a screenshot to save this QR code, or use the share button to send it to others.',
        'qr-code'
      );
    } catch (error) {
      console.error('Error saving QR code:', error);
      showError('Error', 'Failed to save QR code', 'alert-circle');
    }
  };

  const copyToken = async () => {
    if (!token) return;

    // Note: Clipboard functionality would require expo-clipboard
    // For now, we'll show the token in an alert
    showModal({
      title: 'Sharing Token',
      message: `Token: ${token}\n\nYou can manually share this token with others.`,
      type: 'info',
      icon: 'copy',
      actions: [
        { text: 'OK', style: 'primary', onPress: hideModal }
      ]
    });
  };

  const regenerateQRCode = () => {
    showConfirm(
      'Regenerate QR Code',
      'This will create a new sharing code and invalidate the current one. Continue?',
      generateQRCode,
      'Regenerate',
      'Cancel',
      false
    );
  };

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Generating sharing code...</Text>
      </View>
    );
  }

  if (!qrData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to generate QR code</Text>
        <TouchableOpacity style={styles.retryButton} onPress={generateQRCode}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Share Pet Information</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={qrSize}
          backgroundColor="white"
          color="black"
          logo={require('../../../assets/images/icon.png')}
          logoSize={qrSize * 0.15}
          logoMargin={5}
          logoBackgroundColor="white"
          getRef={(ref) => setQrRef(ref)}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to share:</Text>
        <Text style={styles.instructionText}>
          1. Have the other person open TailTracker
        </Text>
        <Text style={styles.instructionText}>
          2. They should scan this QR code using the app
        </Text>
        <Text style={styles.instructionText}>
          3. They'll get read-only access to your pet information
        </Text>
      </View>

      {/* Expiration Info */}
      {expirationTime && (
        <View style={styles.expirationContainer}>
          <MaterialIcons name="schedule" size={16} color="#8E8E93" />
          <Text style={styles.expirationText}>
            Expires: {SharingService.formatExpirationTime(expirationTime)}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={shareQRCode}>
          <MaterialIcons name="share" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={saveQRCode}>
          <MaterialIcons name="save" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={copyToken}>
          <MaterialIcons name="content-copy" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Copy Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={regenerateQRCode}>
          <MaterialIcons name="refresh" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>New Code</Text>
        </TouchableOpacity>
      </View>

      {/* Security Notice */}
      <View style={styles.securityContainer}>
        <MaterialIcons name="security" size={16} color="#FF9500" />
        <Text style={styles.securityText}>
          Only share this code with people you trust. They will be able to view your pet information.
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
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  qrContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 4,
    paddingLeft: 8,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  expirationText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  securityText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default QRCodeGenerator;