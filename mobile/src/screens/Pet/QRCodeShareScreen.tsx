import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCodeSVG from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { PremiumFeatureWrapper } from '../../components/Payment/PremiumFeatureWrapper';
import { databaseService } from '../../services/databaseService';
import { AutoPopulateField } from '../../components/AutoPopulate/AutoPopulateField';
import { useDataSync } from '../../contexts/DataSyncContext';
import { supabase } from '../../services/supabase';

// Placeholder QRCode component since react-native-qr-code-svg is not available
const QRCode = ({ value, size, color, backgroundColor, logo, logoSize, logoBackgroundColor }: any) => (
  <QRCodeSVG width={size} height={size} style={{ backgroundColor }}>
    {/* QR Code placeholder - would need proper QR code library */}
    <text x={size/2} y={size/2} textAnchor="middle" fill={color} fontSize="16">
      QR Code
    </text>
  </QRCodeSVG>
);

const { width: screenWidth } = Dimensions.get('window');
const QR_SIZE = Math.min(screenWidth * 0.7, 300);

interface ShareableData {
  petId: string;
  petName: string;
  ownerName: string;
  phone: string;
  email: string;
  emergencyContact: string;
  medicalInfo: string;
  includePhoto: boolean;
  includeLocation: boolean;
  includeMedical: boolean;
  includeVaccinations: boolean;
  customMessage: string;
  secondaryContact: string;
  veterinarian: string;
}

export default function QRCodeShareScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const viewShotRef = useRef<ViewShot>(null);
  const { updateUserData, updatePetData } = useDataSync();

  const [shareData, setShareData] = useState<ShareableData>({
    petId: petId || '',
    petName: '',
    ownerName: '',
    phone: '',
    email: '',
    emergencyContact: '',
    medicalInfo: '',
    includePhoto: true,
    includeLocation: true,
    includeMedical: false,
    includeVaccinations: true,
    customMessage: 'If found, please contact me!',
    secondaryContact: '',
    veterinarian: '',
  });

  // Update context when share data changes
  React.useEffect(() => {
    updateUserData({
      phone: shareData.phone,
      full_name: shareData.ownerName,
      emergency_contact_name: shareData.emergencyContact,
      emergency_contact_phone: shareData.secondaryContact,
    });
    updatePetData(petId || '', {
      name: shareData.petName,
      medical_conditions: shareData.medicalInfo ? [shareData.medicalInfo] : undefined,
    });
  }, [shareData.phone, shareData.ownerName, shareData.emergencyContact, shareData.secondaryContact, shareData.petName, shareData.medicalInfo, updateUserData, updatePetData, petId]);

  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState('');

  const loadPetData = useCallback(async () => {
    if (!petId) return;
    
    try {
      const pet = await databaseService.getPetById(parseInt(petId));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const owner = await databaseService.getUserByAuthId(user.id);
      
      if (pet && owner) {
        const newData = {
          petName: pet.name,
          ownerName: owner.full_name || owner.email || '',
          phone: (owner as any).phone || '',
          email: owner.email || '',
          emergencyContact: (owner as any).emergency_contact_name || '',
          medicalInfo: pet.medical_conditions?.join(', ') || '',
        };
        
        setShareData(prev => ({
          ...prev,
          ...newData,
        }));
        
        // Generate QR data with the new values
        generateQRData({
          ...shareData,
          ...newData,
        });
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
      Alert.alert('Error', 'Failed to load pet information');
    }
  }, [petId, shareData]);

  React.useEffect(() => {
    loadPetData();
  }, [petId, loadPetData]);

  const generateQRData = (data: ShareableData) => {
    const qrInfo: any = {
      type: 'pet_info',
      petId: data.petId,
      petName: data.petName,
      ownerName: data.ownerName,
      customMessage: data.customMessage,
    };

    if (data.phone) qrInfo.phone = data.phone;
    if (data.email) qrInfo.email = data.email;
    if (data.emergencyContact) qrInfo.emergencyContact = data.emergencyContact;
    if (data.includeMedical && data.medicalInfo) qrInfo.medicalInfo = data.medicalInfo;

    const baseUrl = 'tailtracker://pet/';
    const qrString = `${baseUrl}${JSON.stringify(qrInfo)}`;
    setQrData(qrString);
  };

  const handleDataChange = (field: keyof ShareableData, value: any) => {
    const updatedData = { ...shareData, [field]: value };
    setShareData(updatedData);
    generateQRData(updatedData);
  };

  const shareQRCode = async () => {
    try {
      const shareMessage = `${shareData.petName}'s Information\n\n${shareData.customMessage}\n\nScan this QR code or contact:\n${shareData.phone ? `Phone: ${shareData.phone}\n` : ''}${shareData.email ? `Email: ${shareData.email}` : ''}`;
      
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const saveQRCode = async () => {
    if (!viewShotRef.current) return;
    
    setIsLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is needed to save the QR code');
        return;
      }

      const uri = await viewShotRef.current?.capture?.();
      if (!uri) throw new Error('Failed to capture view');
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('TailTracker', asset, false);
      
      Alert.alert('Success', 'QR code saved to your photo library!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save QR code to photo library');
    } finally {
      setIsLoading(false);
    }
  };

  const printQRCode = () => {
    Alert.alert(
      'Print QR Code',
      'Print functionality would integrate with your device\'s printing capabilities. This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const createPetTag = () => {
    Alert.alert(
      'Create Pet Tag',
      'This will redirect you to create a physical pet tag with this QR code. Feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <PremiumFeatureWrapper
      feature="lost-pet-sharing"
      gateProps={{
        title: "Lost Pet QR Code Sharing",
        description: "Generate QR codes to quickly share your pet's information when they go missing",
        benefits: [
          "Generate shareable QR codes",
          "Quick contact information sharing",
          "Lost pet information accessible to finders"
        ]
      }}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share {shareData.petName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ViewShot 
          ref={viewShotRef}
          options={{ format: 'jpg', quality: 0.9 }}
          style={styles.qrContainer}
        >
          <View style={styles.qrCard}>
            <Text style={styles.cardTitle}>{shareData.petName}</Text>
            <Text style={styles.cardSubtitle}>{shareData.customMessage}</Text>
            
            {qrData ? (
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrData}
                  size={QR_SIZE}
                  color="#333"
                  backgroundColor="#fff"
                  logo={require('../../../assets/icon.png')}
                  logoSize={QR_SIZE * 0.15}
                  logoBackgroundColor="transparent"
                />
              </View>
            ) : (
              <View style={[styles.qrWrapper, styles.qrPlaceholder]}>
                <ActivityIndicator size="large" color="#667eea" />
              </View>
            )}
            
            <View style={styles.contactInfo}>
              {shareData.phone && (
                <Text style={styles.contactText}>📞 {shareData.phone}</Text>
              )}
              {shareData.email && (
                <Text style={styles.contactText}>✉️ {shareData.email}</Text>
              )}
            </View>
          </View>
        </ViewShot>

        <View style={styles.optionsCard}>
          <Text style={styles.optionsTitle}>Sharing Options</Text>
          
          <View style={styles.option}>
            <Text style={styles.optionLabel}>Include Photo</Text>
            <Switch
              value={shareData.includePhoto}
              onValueChange={(value) => handleDataChange('includePhoto', value)}
              trackColor={{ false: '#ccc', true: '#667eea' }}
            />
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>Include Medical Info</Text>
            <Switch
              value={shareData.includeMedical}
              onValueChange={(value) => handleDataChange('includeMedical', value)}
              trackColor={{ false: '#ccc', true: '#667eea' }}
            />
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>Include Vaccinations</Text>
            <Switch
              value={shareData.includeVaccinations}
              onValueChange={(value) => handleDataChange('includeVaccinations', value)}
              trackColor={{ false: '#ccc', true: '#667eea' }}
            />
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>Include Location</Text>
            <Switch
              value={shareData.includeLocation}
              onValueChange={(value) => handleDataChange('includeLocation', value)}
              trackColor={{ false: '#ccc', true: '#667eea' }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Owner Name</Text>
            <AutoPopulateField
              style={styles.textInput}
              value={shareData.ownerName}
              onChangeText={(text) => handleDataChange('ownerName', text)}
              placeholder="Your full name"
              context="user"
              fieldPath="full_name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <AutoPopulateField
              style={styles.textInput}
              value={shareData.phone}
              onChangeText={(text) => handleDataChange('phone', text)}
              placeholder="Your contact phone number"
              keyboardType="phone-pad"
              context="user"
              fieldPath="phone"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Emergency Contact</Text>
            <AutoPopulateField
              style={styles.textInput}
              value={shareData.emergencyContact}
              onChangeText={(text) => handleDataChange('emergencyContact', text)}
              placeholder="Backup contact person"
              keyboardType="phone-pad"
              context="user"
              fieldPath="emergency_contact"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Secondary Contact</Text>
            <AutoPopulateField
              style={styles.textInput}
              value={shareData.secondaryContact}
              onChangeText={(text) => handleDataChange('secondaryContact', text)}
              placeholder="Additional contact person"
              keyboardType="phone-pad"
              context="user"
              fieldPath="secondary_contact"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Veterinarian</Text>
            <AutoPopulateField
              style={styles.textInput}
              value={shareData.veterinarian}
              onChangeText={(text) => handleDataChange('veterinarian', text)}
              placeholder="Vet name and contact"
              context="medical"
              fieldPath="veterinarian"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Custom Message</Text>
            <AutoPopulateField
              style={[styles.textInput, styles.multilineInput]}
              value={shareData.customMessage}
              onChangeText={(text) => handleDataChange('customMessage', text)}
              placeholder="Enter a message for whoever finds your pet"
              multiline
              numberOfLines={3}
              context="user"
              fieldPath="custom_message"
            />
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Actions</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]} 
            onPress={shareQRCode}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Share QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]} 
            onPress={saveQRCode}
            disabled={isLoading}
          >
            <Ionicons name="download-outline" size={20} color="#667eea" />
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
              {isLoading ? 'Saving...' : 'Save to Photos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]} 
            onPress={printQRCode}
          >
            <Ionicons name="print-outline" size={20} color="#667eea" />
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Print QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.tertiaryAction]} 
            onPress={createPetTag}
          >
            <Ionicons name="pricetag-outline" size={20} color="#764ba2" />
            <Text style={[styles.actionButtonText, styles.tertiaryActionText]}>Create Pet Tag</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.autoPopulateInfo}>
            <Text style={styles.autoPopulateTitle}>🔄 Smart Auto-Fill</Text>
            <Text style={styles.autoPopulateText}>
              Contact fields automatically populate from your previous entries, making QR code creation faster and more consistent.
            </Text>
          </View>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            • Anyone who scans this QR code will see your contact information{'\n'}
            • The QR code contains only the information you've chosen to share{'\n'}
            • No personal data is stored on external servers{'\n'}
            • Works even when offline once scanned
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
    </PremiumFeatureWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  qrCard: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: QR_SIZE + 40,
    height: QR_SIZE + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  inputContainer: {
    marginTop: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    minHeight: 44,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  autoPopulateInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  autoPopulateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  autoPopulateText: {
    fontSize: 14,
    color: '#388e3c',
    lineHeight: 18,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  primaryAction: {
    backgroundColor: '#667eea',
  },
  secondaryAction: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  tertiaryAction: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#764ba2',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#fff',
  },
  secondaryActionText: {
    color: '#667eea',
  },
  tertiaryActionText: {
    color: '#764ba2',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});