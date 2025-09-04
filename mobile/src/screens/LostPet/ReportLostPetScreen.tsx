import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  TextInput,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

import { premiumLostPetService, LostPetReport } from '../../services/PremiumLostPetService';
import PremiumFeatureWrapper from '../../components/Payment/PremiumFeatureWrapper';
import { Pet } from '../../types/Pet';

interface ReportLostPetScreenProps {
  route: {
    params: {
      pet: Pet;
    };
  };
}

const ReportLostPetScreen: React.FC<ReportLostPetScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { pet } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [lastSeenAddress, setLastSeenAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [locationSelectionMode, setLocationSelectionMode] = useState<'current' | 'manual' | 'selected'>('current');

  // Check accessibility and get current location on mount
  useEffect(() => {
    checkAccessibilityAndInit();
  }, []);

  const checkAccessibilityAndInit = async () => {
    // Check if screen reader is enabled
    const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    setIsScreenReaderEnabled(screenReaderEnabled);
    
    // Get current location
    getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const currentLocation = await premiumLostPetService.getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        setSelectedLocation(currentLocation);
        // Get address from coordinates
        const addressResult = await Location.reverseGeocodeAsync(currentLocation);
        if (addressResult.length > 0) {
          const address = addressResult[0];
          setLastSeenAddress(
            `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`
          );
        }
      }
    } catch (error) {
      Alert.alert('Location Error', 'Unable to get current location. Please select on map.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ lat: latitude, lng: longitude });
    setLocationSelectionMode('selected');
    
    // Get address for selected location
    Location.reverseGeocodeAsync({ latitude, longitude }).then((result) => {
      if (result.length > 0) {
        const address = result[0];
        const newAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`;
        setLastSeenAddress(newAddress);
        
        // Announce location change to screen readers
        if (isScreenReaderEnabled) {
          AccessibilityInfo.announceForAccessibility(
            `Location selected: ${newAddress}. Pet ${pet.name} was last seen here.`
          );
        }
      }
    });
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      await getCurrentLocation();
      setLocationSelectionMode('current');
      
      if (isScreenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility(
          `Using your current location for ${pet.name}'s last seen location.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddressEntry = () => {
    setLocationSelectionMode('manual');
    if (isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(
        'Switched to manual address entry mode. You can now type the address where your pet was last seen.'
      );
    }
  };

  const handleReportLostPet = async () => {
    if (!selectedLocation) {
      Alert.alert('Location Required', 'Please select where your pet was last seen on the map.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a description to help others identify your pet.');
      return;
    }

    try {
      setLoading(true);

      const reportData: LostPetReport = {
        pet_id: pet.id,
        last_seen_location: selectedLocation,
        last_seen_address: lastSeenAddress,
        last_seen_date: new Date(),
        description: description.trim(),
        reward_amount: rewardAmount ? parseFloat(rewardAmount) : undefined,
        reward_currency: 'USD',
        contact_phone: contactPhone.trim() || undefined,
        search_radius_km: urgencyLevel === 'high' ? 5 : urgencyLevel === 'medium' ? 10 : 15,
      };

      const result = await premiumLostPetService.reportLostPet(reportData);

      if (result.success) {
        Alert.alert(
          'Lost Pet Reported',
          `Alert sent to ${result.alerts_sent || 0} users in your area. We'll help bring ${pet.name} home!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Report Failed', result.error || 'Failed to report lost pet. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#FF5722';
    }
  };

  return (
    <PremiumFeatureWrapper
      feature="lost-pet-alerts"
      gateProps={{
        title: 'Premium Feature: Lost Pet Alerts',
        description: 'Report lost pets and receive regional community alerts to help find your beloved companion.',
        benefits: [
          'Send alerts to users within 5-15km radius',
          'Real-time location-based notifications',
          'Contact information sharing with helpers',
          'Reward system to incentivize assistance',
          'Mark as found when reunited',
        ],
      }}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.petCard}>
          <Card.Content>
            <Title>{pet.name} is Missing</Title>
            <Paragraph>{pet.species} • {pet.breed}</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.mapCard}>
          <Card.Content>
            <Title>Last Seen Location</Title>
            <Paragraph style={styles.instruction}>
              Tap on the map to mark where {pet.name} was last seen
            </Paragraph>
          </Card.Content>
          
          {location ? (
            <View>
              {/* Screen Reader Alternative */}
              {isScreenReaderEnabled && (
                <View style={styles.accessibleLocationContainer}>
                  <Text style={styles.accessibleLocationTitle}>
                    Location Selection (Accessible Mode)
                  </Text>
                  <Text style={styles.accessibleLocationDescription}>
                    Since you're using a screen reader, we've provided accessible alternatives to the map.
                  </Text>
                  
                  <View style={styles.accessibleButtonsContainer}>
                    <Button
                      mode="outlined"
                      onPress={handleUseCurrentLocation}
                      style={[styles.accessibleButton, locationSelectionMode === 'current' && styles.selectedButton]}
                      contentStyle={{ paddingVertical: 8 }}
                      disabled={loading}
                      accessibilityLabel="Use my current location as where the pet was last seen"
                      accessibilityHint="This will use your device's current location"
                      accessibilityState={{ selected: locationSelectionMode === 'current' }}
                    >
                      Use Current Location
                    </Button>
                    
                    <Button
                      mode="outlined"
                      onPress={handleManualAddressEntry}
                      style={[styles.accessibleButton, locationSelectionMode === 'manual' && styles.selectedButton]}
                      contentStyle={{ paddingVertical: 8 }}
                      accessibilityLabel="Enter address manually"
                      accessibilityHint="This will let you type the address where your pet was last seen"
                      accessibilityState={{ selected: locationSelectionMode === 'manual' }}
                    >
                      Enter Address Manually
                    </Button>
                  </View>
                  
                  {selectedLocation && (
                    <Text style={styles.selectedLocationText}
                          accessibilityLabel={`Selected location: ${lastSeenAddress}`}>
                      📍 Selected: {lastSeenAddress}
                    </Text>
                  )}
                </View>
              )}
              
              {/* Visual Map (hidden from screen readers) */}
              <MapView
                style={[styles.map, isScreenReaderEnabled && styles.hiddenFromScreenReader]}
                provider={PROVIDER_GOOGLE}
                region={{
                  latitude: location.lat,
                  longitude: location.lng,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                onPress={handleMapPress}
                accessible={!isScreenReaderEnabled}
                accessibilityLabel={isScreenReaderEnabled ? undefined : `Interactive map showing ${pet.name}'s location area`}
                accessibilityHint={isScreenReaderEnabled ? undefined : "Tap on the map to select where your pet was last seen"}
                importantForAccessibility={isScreenReaderEnabled ? 'no-hide-descendants' : 'auto'}
              >
                {selectedLocation && (
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.lat,
                      longitude: selectedLocation.lng,
                    }}
                    title={`${pet.name} last seen here`}
                    description={lastSeenAddress}
                    pinColor={getUrgencyColor(urgencyLevel)}
                    accessible={!isScreenReaderEnabled}
                    accessibilityLabel={`Map marker showing ${pet.name} was last seen at ${lastSeenAddress}`}
                  />
                )}
              </MapView>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text>Unable to load map</Text>
              <Button mode="outlined" onPress={getCurrentLocation}>
                Retry
              </Button>
            </View>
          )}
        </Card>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Title>Alert Details</Title>
            
            <TextInput
              label={locationSelectionMode === 'manual' ? "Address *" : "Address (optional)"}
              value={lastSeenAddress}
              onChangeText={setLastSeenAddress}
              style={styles.input}
              multiline
              numberOfLines={2}
              placeholder={locationSelectionMode === 'manual' ? "Enter the full address where your pet was last seen" : "Address will be filled automatically from map selection"}
              accessibilityLabel={locationSelectionMode === 'manual' ? "Required address field where your pet was last seen" : "Optional address field, automatically filled from map selection"}
              accessibilityHint={locationSelectionMode === 'manual' ? "Type the complete address including street, city, and state" : "This field is automatically populated when you select a location on the map"}
              editable={locationSelectionMode === 'manual' || !isScreenReaderEnabled}
            />

            <TextInput
              label="Description *"
              value={description}
              onChangeText={setDescription}
              placeholder={`Help others identify ${pet.name}. What was ${pet.name} wearing? Any distinctive features?`}
              style={styles.input}
              multiline
              numberOfLines={4}
              accessibilityLabel={`Required description field for ${pet.name}`}
              accessibilityHint="Describe your pet's appearance, clothing, collar, or any distinctive features to help others identify them"
              error={!description.trim() && description.length > 0}
            />

            <TextInput
              label="Contact Phone (optional)"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="Phone number for direct contact"
              keyboardType="phone-pad"
              style={styles.input}
              accessibilityLabel="Optional phone number for direct contact"
              accessibilityHint="Provide a phone number where people can call you directly if they find your pet"
            />

            <TextInput
              label="Reward Amount (optional)"
              value={rewardAmount}
              onChangeText={setRewardAmount}
              placeholder="0.00"
              keyboardType="numeric"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
              accessibilityLabel="Optional reward amount in US dollars"
              accessibilityHint="Enter the monetary reward you're offering to anyone who helps find your pet"
            />

            <View style={styles.urgencyContainer}
                  accessible={true}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Search urgency level selection">
              <Text style={styles.urgencyLabel}
                    accessibilityRole="header">
                Search Urgency
              </Text>
              <Text style={styles.urgencyDescription}>
                Higher urgency sends alerts to more nearby users
              </Text>
              <View style={styles.chipContainer}>
                <Chip
                  selected={urgencyLevel === 'high'}
                  onPress={() => {
                    setUrgencyLevel('high');
                    if (isScreenReaderEnabled) {
                      AccessibilityInfo.announceForAccessibility('High urgency selected. Will notify users within 5 kilometers.');
                    }
                  }}
                  style={[styles.chip, urgencyLevel === 'high' && { backgroundColor: '#D32F2F' }]}
                  textStyle={{ color: urgencyLevel === 'high' ? 'white' : undefined }}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel="High urgency, 5 kilometer radius"
                  accessibilityHint="Sends alerts to users within 5 kilometers for immediate help"
                  accessibilityState={{ selected: urgencyLevel === 'high', checked: urgencyLevel === 'high' }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  High (5km)
                </Chip>
                <Chip
                  selected={urgencyLevel === 'medium'}
                  onPress={() => {
                    setUrgencyLevel('medium');
                    if (isScreenReaderEnabled) {
                      AccessibilityInfo.announceForAccessibility('Medium urgency selected. Will notify users within 10 kilometers.');
                    }
                  }}
                  style={[styles.chip, urgencyLevel === 'medium' && { backgroundColor: '#F57C00' }]}
                  textStyle={{ color: urgencyLevel === 'medium' ? 'white' : undefined }}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel="Medium urgency, 10 kilometer radius"
                  accessibilityHint="Sends alerts to users within 10 kilometers for broader coverage"
                  accessibilityState={{ selected: urgencyLevel === 'medium', checked: urgencyLevel === 'medium' }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  Medium (10km)
                </Chip>
                <Chip
                  selected={urgencyLevel === 'low'}
                  onPress={() => {
                    setUrgencyLevel('low');
                    if (isScreenReaderEnabled) {
                      AccessibilityInfo.announceForAccessibility('Low urgency selected. Will notify users within 15 kilometers.');
                    }
                  }}
                  style={[styles.chip, urgencyLevel === 'low' && { backgroundColor: '#388E3C' }]}
                  textStyle={{ color: urgencyLevel === 'low' ? 'white' : undefined }}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel="Low urgency, 15 kilometer radius"
                  accessibilityHint="Sends alerts to users within 15 kilometers for wide area coverage"
                  accessibilityState={{ selected: urgencyLevel === 'low', checked: urgencyLevel === 'low' }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  Low (15km)
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleReportLostPet}
              disabled={loading || (!selectedLocation && locationSelectionMode !== 'manual') || !description.trim() || (locationSelectionMode === 'manual' && !lastSeenAddress.trim())}
              loading={loading}
              style={[styles.reportButton, { minHeight: 48 }]} // WCAG touch target minimum
              contentStyle={{ paddingVertical: 12 }}
              accessibilityLabel={`Send emergency alert for missing ${pet.name}`}
              accessibilityHint={`This will immediately notify nearby TailTracker users within ${urgencyLevel === 'high' ? '5' : urgencyLevel === 'medium' ? '10' : '15'} kilometers to help find your pet`}
              accessibilityState={{ disabled: loading || (!selectedLocation && locationSelectionMode !== 'manual') || !description.trim() }}
            >
              🚨 Send Regional Alert
            </Button>
            <Text style={styles.disclaimer}
                  accessibilityLabel={`Important: This emergency alert will immediately notify all TailTracker users within ${urgencyLevel === 'high' ? '5' : urgencyLevel === 'medium' ? '10' : '15'} kilometers of the selected location to help find ${pet.name}. The alert includes your pet's photo, description, and contact information if provided.`}>
              ⚠️ This will notify nearby TailTracker users in your selected radius to help find {pet.name}.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </PremiumFeatureWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  petCard: {
    margin: 16,
    marginBottom: 8,
  },
  mapCard: {
    margin: 16,
    marginVertical: 8,
  },
  map: {
    height: 200,
    marginTop: 8,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  detailsCard: {
    margin: 16,
    marginVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  urgencyContainer: {
    marginTop: 8,
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  urgencyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    minHeight: 48, // WCAG AA touch target requirement (48dp Android minimum)
    minWidth: 88,
    // Add padding to ensure touch area meets requirements
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionCard: {
    margin: 16,
    marginVertical: 8,
    marginBottom: 32,
  },
  reportButton: {
    marginVertical: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Accessibility-specific styles
  accessibleLocationContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  accessibleLocationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  accessibleLocationDescription: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 16,
    lineHeight: 20,
  },
  accessibleButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  accessibleButton: {
    minHeight: 48, // WCAG AA touch target requirement
  },
  selectedButton: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  selectedLocationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 4,
    textAlign: 'center',
  },
  hiddenFromScreenReader: {
    opacity: 0.3, // Visual indication that map is not accessible
  },
});

export default ReportLostPetScreen;