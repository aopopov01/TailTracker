// QR Code Generator Component for Family Member Invitations
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, Share, Dimensions } from 'react-native';
import { Button, VStack, HStack, Box, useColorModeValue } from 'native-base';
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

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    generateInvite();
  }, []);

  const generateInvite = async () => {
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
  };

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
      <Box flex={1} justifyContent="center" alignItems="center" p={4}>
        <Text>Generating secure invite...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" p={4}>
        <VStack space={4} alignItems="center">
          <Text color="red.500">{error}</Text>
          <Button onPress={generateInvite}>Try Again</Button>
          <Button variant="ghost" onPress={onClose}>Close</Button>
        </VStack>
      </Box>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const qrSize = Math.min(screenWidth * 0.6, 250);

  return (
    <Box flex={1} p={4} bg={bgColor}>
      <VStack space={6} alignItems="center">
        {/* Header */}
        <VStack space={2} alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            Family Invite QR Code
          </Text>
          <Text fontSize="md" color={textColor} textAlign="center">
            Share this QR code with family members to give them access to {familyName}
          </Text>
        </VStack>

        {/* QR Code */}
        <Box 
          p={4} 
          bg="white" 
          rounded="lg" 
          shadow={3}
          borderWidth={1}
          borderColor={borderColor}
        >
          <QRCode
            value={qrData}
            size={qrSize}
            color="black"
            backgroundColor="white"
            logo={require('@/assets/images/logo-small.png')}
            logoSize={qrSize * 0.2}
            logoBackgroundColor="white"
            logoBorderRadius={10}
          />
        </Box>

        {/* Expiry Info */}
        {expiresAt && (
          <VStack space={1} alignItems="center">
            <Text fontSize="sm" color={textColor}>
              Expires in: {formatExpiryTime(expiresAt)}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {expiresAt.toLocaleString()}
            </Text>
          </VStack>
        )}

        {/* Instructions */}
        <Box p={4} bg="blue.50" rounded="md" w="100%">
          <VStack space={2}>
            <Text fontSize="sm" fontWeight="semibold" color="blue.800">
              How to use:
            </Text>
            <Text fontSize="xs" color="blue.700">
              1. Family member opens TailTracker app
            </Text>
            <Text fontSize="xs" color="blue.700">
              2. Goes to Settings → Family Access → Join Family
            </Text>
            <Text fontSize="xs" color="blue.700">
              3. Scans this QR code
            </Text>
            <Text fontSize="xs" color="blue.700">
              4. You'll receive a confirmation to set their access level
            </Text>
          </VStack>
        </Box>

        {/* Action Buttons */}
        <VStack space={3} w="100%">
          <Button
            onPress={shareInvite}
            variant="solid"
            colorScheme="blue"
          >
            Share Invite
          </Button>
          
          <HStack space={3} w="100%">
            <Button
              flex={1}
              variant="outline"
              onPress={generateInvite}
            >
              Regenerate
            </Button>
            
            <Button
              flex={1}
              variant="ghost"
              onPress={onClose}
            >
              Close
            </Button>
          </HStack>
        </VStack>

        {/* Security Note */}
        <Box p={3} bg="yellow.50" rounded="md" w="100%">
          <Text fontSize="xs" color="yellow.800" textAlign="center">
            🔒 This invite expires in 24 hours for security. Only share with trusted family members.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});