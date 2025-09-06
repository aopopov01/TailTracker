// QR Code Generator Component for Family Member Invitations
import React, { useState, useEffect, useCallback } from 'react';
import { View, Alert, StyleSheet, Share, Dimensions } from 'react-native';
import { Button, Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { familyAccessService } from '@/services/FamilyAccessService';

interface QRCodeGeneratorProps {
  familyId: string;
  familyName: string;
  onClose: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  familyId,
  familyName,
  onClose
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [inviteToken, setInviteToken] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const theme = useTheme();

  const generateInvite = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await familyAccessService.generateFamilyInvite(familyId);
      
      setQrData(result.qrCodeData);
      setInviteToken(result.inviteToken);
      setExpiresAt(result.expiresAt);
      
    } catch (err: any) {
      setError(err.message || 'Failed to generate invite');
      Alert.alert('Error', err.message || 'Failed to generate invite');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    generateInvite();
  }, [generateInvite]);

  const shareInvite = async () => {
    try {
      await Share.share({
        message: `Join my pet family "${familyName}" on TailTracker! Scan this QR code with the TailTracker app to get access to our pet information. Invite expires in 24 hours.`,
        title: `TailTracker Family Invite - ${familyName}`
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const formatExpiryTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Generating secure invite...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text variant="bodyLarge" style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <View style={styles.errorActions}>
          <Button mode="contained" onPress={generateInvite}>
            Try Again
          </Button>
          <Button mode="text" onPress={onClose}>
            Close
          </Button>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const qrSize = Math.min(screenWidth * 0.6, 250);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Family Invite QR Code
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Share this QR code with family members to give them access to {familyName}
          </Text>
        </View>

        {/* QR Code */}
        <Card style={[styles.qrContainer, { borderColor: theme.colors.outline }]}>
          <Card.Content style={styles.qrContent}>
            <QRCode
              value={qrData}
              size={qrSize}
              color="black"
              backgroundColor="white"
            />
          </Card.Content>
        </Card>

        {/* Expiry Info */}
        {expiresAt && (
          <View style={styles.expiryInfo}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Expires in: {formatExpiryTime(expiresAt)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {expiresAt.toLocaleString()}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <Card style={[styles.instructionsCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Text variant="titleSmall" style={[styles.instructionsTitle, { color: theme.colors.onPrimaryContainer }]}>
              How to use:
            </Text>
            <Text variant="bodySmall" style={[styles.instruction, { color: theme.colors.onPrimaryContainer }]}>
              1. Family member opens TailTracker app
            </Text>
            <Text variant="bodySmall" style={[styles.instruction, { color: theme.colors.onPrimaryContainer }]}>
              2. Goes to Settings → Family Access → Join Family
            </Text>
            <Text variant="bodySmall" style={[styles.instruction, { color: theme.colors.onPrimaryContainer }]}>
              3. Scans this QR code
            </Text>
            <Text variant="bodySmall" style={[styles.instruction, { color: theme.colors.onPrimaryContainer }]}>
              4. You'll receive a confirmation to set their access level
            </Text>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={shareInvite}
            style={styles.primaryButton}
          >
            Share Invite
          </Button>
          
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={generateInvite}
              style={styles.secondaryButton}
            >
              Regenerate
            </Button>
            
            <Button
              mode="text"
              onPress={onClose}
              style={styles.secondaryButton}
            >
              Close
            </Button>
          </View>
        </View>

        {/* Security Note */}
        <Card style={[styles.securityCard, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Card.Content>
            <Text variant="bodySmall" style={[styles.securityNote, { color: theme.colors.onSecondaryContainer }]}>
              🔒 This invite expires in 24 hours for security. Only share with trusted family members.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    gap: 24,
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  qrContainer: {
    borderWidth: 1,
    elevation: 4,
  },
  qrContent: {
    alignItems: 'center',
    padding: 16,
  },
  expiryInfo: {
    alignItems: 'center',
    gap: 4,
  },
  instructionsCard: {
    width: '100%',
  },
  instructionsTitle: {
    marginBottom: 8,
  },
  instruction: {
    marginBottom: 4,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  securityCard: {
    width: '100%',
  },
  securityNote: {
    textAlign: 'center',
  },
});