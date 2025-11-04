import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databaseService } from '../../services/databaseService';

interface LostPetAlert {
  id?: string;
  pet_id: string;
  is_active: boolean;
  lost_date: string;
  lost_location: string;
  last_seen_location?: string;
  description: string;
  reward_amount?: number;
  emergency_contacts: string[];
  special_instructions?: string;
  created_at?: string;
  updated_at?: string;
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export default function LostPetAlertScreen() {
  const { petId, alertId } = useLocalSearchParams<{
    petId: string;
    alertId?: string;
  }>();
  const router = useRouter();

  const [pet, setPet] = useState<any>(null);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<LostPetAlert | null>(null);

  const [alertData, setAlertData] = useState<LostPetAlert>({
    pet_id: petId || '',
    is_active: true,
    lost_date: new Date().toISOString().split('T')[0],
    lost_location: '',
    last_seen_location: '',
    description: '',
    reward_amount: 0,
    emergency_contacts: [''],
    special_instructions: '',
    location_coordinates: undefined,
  });

  const loadData = useCallback(async () => {
    try {
      if (petId) {
        const petData = await databaseService.getPetById(petId);
        setPet(petData);

        // TODO: Implement lost pet alert functionality when approved
        // Currently placeholder - lost pet alerts are Pro tier only
      }

      if (alertId) {
        // TODO: Implement alert retrieval when service is ready
        console.log('Alert ID provided:', alertId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load pet information');
    }
  }, [petId, alertId]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to set the lost location'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);

      // Auto-fill location if not already set
      if (!alertData.lost_location) {
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address && address.length > 0) {
          const addr = address[0];
          const locationString =
            `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
          setAlertData(prev => ({
            ...prev,
            lost_location: locationString,
            location_coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
          }));
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, [alertData.lost_location]);

  useEffect(() => {
    loadData();
    getCurrentLocation();
  }, [petId, alertId, loadData, getCurrentLocation]);

  const updateField = (field: keyof LostPetAlert, value: any) => {
    setAlertData(prev => ({ ...prev, [field]: value }));
  };

  const addEmergencyContact = () => {
    setAlertData(prev => ({
      ...prev,
      emergency_contacts: [...prev.emergency_contacts, ''],
    }));
  };

  const updateEmergencyContact = (index: number, value: string) => {
    const newContacts = [...alertData.emergency_contacts];
    newContacts[index] = value;
    setAlertData(prev => ({ ...prev, emergency_contacts: newContacts }));
  };

  const removeEmergencyContact = (index: number) => {
    if (alertData.emergency_contacts.length > 1) {
      const newContacts = alertData.emergency_contacts.filter(
        (_, i) => i !== index
      );
      setAlertData(prev => ({ ...prev, emergency_contacts: newContacts }));
    }
  };

  const createAlert = async () => {
    if (!alertData.lost_location || !alertData.description) {
      Alert.alert(
        'Required Fields',
        'Please fill in the lost location and description'
      );
      return;
    }

    const validContacts = alertData.emergency_contacts.filter(
      contact => contact.trim() !== ''
    );
    if (validContacts.length === 0) {
      Alert.alert(
        'Emergency Contact Required',
        'Please add at least one emergency contact'
      );
      return;
    }

    setIsLoading(true);
    try {
      const alertToSave = {
        ...alertData,
        emergency_contacts: validContacts,
      };

      // TODO: Implement lost pet alert database operations when service is ready
      const savedAlert = {
        ...alertToSave,
        id: activeAlert?.id || Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setActiveAlert(savedAlert);
      Alert.alert(
        'Alert Created',
        'Lost pet alert has been activated. Share it with your community to help find your pet!',
        [
          { text: 'Share Alert', onPress: shareAlert },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error creating alert:', error);
      Alert.alert('Error', 'Failed to create lost pet alert');
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateAlert = async () => {
    if (!activeAlert?.id) return;

    Alert.alert(
      'Deactivate Alert',
      'Are you sure you want to deactivate this lost pet alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement alert deactivation when service is ready
              console.log('Deactivating alert:', activeAlert.id);
              setActiveAlert(null);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate alert');
            }
          },
        },
      ]
    );
  };

  const shareAlert = async () => {
    if (!pet || !activeAlert) return;

    const message = `🚨 LOST PET ALERT 🚨

${pet.name} (${pet.species}) is missing!

Lost Date: ${new Date(alertData.lost_date).toLocaleDateString()}
Last Seen: ${alertData.lost_location}
${alertData.last_seen_location ? `Additional Location: ${alertData.last_seen_location}` : ''}

Description: ${alertData.description}

${alertData.reward_amount && alertData.reward_amount > 0 ? `Reward: $${alertData.reward_amount}` : ''}

Emergency Contacts:
${alertData.emergency_contacts
  .filter(c => c.trim())
  .map(contact => `• ${contact}`)
  .join('\n')}

${alertData.special_instructions ? `Special Instructions: ${alertData.special_instructions}` : ''}

Please share to help bring ${pet.name} home safely! 🙏

#LostPet #Help${pet.name}GetHome`;

    try {
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share alert');
    }
  };

  const callEmergencyContact = (contact: string) => {
    const phoneNumber = contact.replace(/[^\d+]/g, '');
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const openInMaps = () => {
    if (!alertData.location_coordinates) return;

    const { latitude, longitude } = alertData.location_coordinates;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const reportSighting = () => {
    Alert.alert(
      'Report Sighting',
      'This would allow someone to report seeing your lost pet. Feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <LinearGradient colors={['#ff6b6b', '#ee5a24']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name='arrow-back' size={24} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeAlert?.is_active ? 'Active Lost Pet Alert' : 'Lost Pet Alert'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {pet && (
          <View style={styles.petCard}>
            <View style={styles.petHeader}>
              <Text style={styles.petName}>{pet.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  activeAlert?.is_active
                    ? styles.activeBadge
                    : styles.inactiveBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {activeAlert?.is_active ? 'ACTIVE ALERT' : 'CREATE ALERT'}
                </Text>
              </View>
            </View>
            <Text style={styles.petInfo}>
              {pet.species} • {pet.breed} • {pet.color}
            </Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Alert Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lost Date *</Text>
            <TextInput
              style={styles.input}
              value={alertData.lost_date}
              onChangeText={text => updateField('lost_date', text)}
              placeholder='YYYY-MM-DD'
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Seen Location *</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={alertData.lost_location}
                onChangeText={text => updateField('lost_location', text)}
                placeholder='Enter address or description'
                multiline
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
              >
                <Ionicons name='location' size={20} color='#fff' />
              </TouchableOpacity>
            </View>
            {alertData.location_coordinates && (
              <TouchableOpacity style={styles.mapButton} onPress={openInMaps}>
                <Ionicons name='map' size={16} color='#ff6b6b' />
                <Text style={styles.mapButtonText}>View on Map</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Location Info</Text>
            <TextInput
              style={styles.input}
              value={alertData.last_seen_location}
              onChangeText={text => updateField('last_seen_location', text)}
              placeholder='Any other locations where the pet was seen'
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={alertData.description}
              onChangeText={text => updateField('description', text)}
              placeholder="Describe your pet's appearance, behavior, or any distinguishing features"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reward Amount (Optional)</Text>
            <TextInput
              style={styles.input}
              value={alertData.reward_amount?.toString() || ''}
              onChangeText={text =>
                updateField('reward_amount', parseInt(text) || 0)
              }
              placeholder='Enter reward amount'
              keyboardType='numeric'
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Special Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={alertData.special_instructions}
              onChangeText={text => updateField('special_instructions', text)}
              placeholder='Any special handling instructions, medical conditions, etc.'
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.formTitle}>Emergency Contacts *</Text>

          {alertData.emergency_contacts.map((contact, index) => (
            <View key={index} style={styles.contactRow}>
              <TextInput
                style={[styles.input, styles.contactInput]}
                value={contact}
                onChangeText={text => updateEmergencyContact(index, text)}
                placeholder='Phone number or email'
                keyboardType='default'
              />

              {contact.includes('@') ? (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(`mailto:${contact}`)}
                >
                  <Ionicons name='mail' size={20} color='#fff' />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => callEmergencyContact(contact)}
                >
                  <Ionicons name='call' size={20} color='#fff' />
                </TouchableOpacity>
              )}

              {alertData.emergency_contacts.length > 1 && (
                <TouchableOpacity
                  style={[styles.contactButton, styles.removeButton]}
                  onPress={() => removeEmergencyContact(index)}
                >
                  <Ionicons name='trash' size={20} color='#fff' />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.addContactButton}
            onPress={addEmergencyContact}
          >
            <Ionicons name='add' size={20} color='#ff6b6b' />
            <Text style={styles.addContactText}>Add Another Contact</Text>
          </TouchableOpacity>
        </View>

        {activeAlert?.is_active ? (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Alert Actions</Text>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={shareAlert}
            >
              <Ionicons name='share-social' size={20} color='#fff' />
              <Text style={styles.actionButtonText}>Share Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.updateButton]}
              onPress={createAlert}
              disabled={isLoading}
            >
              <Ionicons name='create' size={20} color='#fff' />
              <Text style={styles.actionButtonText}>
                {isLoading ? 'Updating...' : 'Update Alert'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.reportButton]}
              onPress={reportSighting}
            >
              <Ionicons name='eye' size={20} color='#fff' />
              <Text style={styles.actionButtonText}>Report Sighting</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deactivateButton]}
              onPress={deactivateAlert}
            >
              <Ionicons name='stop-circle' size={20} color='#fff' />
              <Text style={styles.actionButtonText}>Deactivate Alert</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.createButton}
            onPress={createAlert}
            disabled={isLoading}
          >
            <Ionicons name='alert-circle' size={24} color='#fff' />
            <Text style={styles.createButtonText}>
              {isLoading ? 'Creating Alert...' : 'Create Lost Pet Alert'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Lost Pet Alerts Work</Text>
          <Text style={styles.infoText}>
            • Your alert will be visible to the TailTracker community{'\n'}•
            Share on social media to reach more people{'\n'}• QR codes on your
            pet's profile can help finders contact you{'\n'}• Update the alert
            with new sightings or information{'\n'}• Deactivate when your pet is
            found safely
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  petCard: {
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
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#ff6b6b',
  },
  inactiveBadge: {
    backgroundColor: '#95a5a6',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  petInfo: {
    fontSize: 16,
    color: '#666',
  },
  formCard: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationInput: {
    flex: 1,
    marginRight: 10,
  },
  locationButton: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  mapButtonText: {
    marginLeft: 4,
    color: '#ff6b6b',
    fontSize: 14,
  },
  contactCard: {
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactInput: {
    flex: 1,
    marginRight: 10,
  },
  contactButton: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    marginLeft: 5,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addContactText: {
    marginLeft: 8,
    color: '#ff6b6b',
    fontSize: 16,
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
  shareButton: {
    backgroundColor: '#3498db',
  },
  updateButton: {
    backgroundColor: '#f39c12',
  },
  reportButton: {
    backgroundColor: '#27ae60',
  },
  deactivateButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#fff',
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
