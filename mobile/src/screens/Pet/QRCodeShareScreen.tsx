import React, { useState, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qr-code-svg';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import { databaseService } from '../../services/databaseService';
import { PremiumFeatureWrapper } from '../../components/Payment/PremiumFeatureWrapper';

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
}

export default function QRCodeShareScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const viewShotRef = useRef<ViewShot>(null);

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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState('');

  React.useEffect(() => {
    loadPetData();
  }, [petId]);

  const loadPetData = async () => {
    if (!petId) return;
    
    try {
      const pet = await databaseService.getPet(petId);
      const owner = await databaseService.getCurrentUser();
      
      if (pet && owner) {
        setShareData(prev => ({
          ...prev,
          petName: pet.name,
          ownerName: owner.display_name || owner.email || '',
          phone: owner.phone || '',
          email: owner.email || '',
          emergencyContact: owner.emergency_contact || '',
          medicalInfo: pet.medical_conditions?.join(', ') || '',
        }));
        
        generateQRData({
          ...shareData,
          petName: pet.name,
          ownerName: owner.display_name || owner.email || '',
          phone: owner.phone || '',
          email: owner.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
      Alert.alert('Error', 'Failed to load pet information');
    }
  };

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

      const uri = await viewShotRef.current.capture();
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
            <Text style={styles.inputLabel}>Custom Message</Text>
            <TextInput
              style={styles.textInput}
              value={shareData.customMessage}
              onChangeText={(text) => handleDataChange('customMessage', text)}
              placeholder="Enter a message for whoever finds your pet"
              multiline
              numberOfLines={3}
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