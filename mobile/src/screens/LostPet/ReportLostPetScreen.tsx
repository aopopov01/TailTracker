import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
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

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

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
    
    // Get address for selected location
    Location.reverseGeocodeAsync({ latitude, longitude }).then((result) => {
      if (result.length > 0) {
        const address = result[0];
        setLastSeenAddress(
          `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`
        );
      }
    });
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
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={{
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={handleMapPress}
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
                />
              )}
            </MapView>
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
              label="Address (optional)"
              value={lastSeenAddress}
              onChangeText={setLastSeenAddress}
              style={styles.input}
              multiline
              numberOfLines={2}
            />

            <TextInput
              label="Description *"
              value={description}
              onChangeText={setDescription}
              placeholder={`Help others identify ${pet.name}. What was ${pet.name} wearing? Any distinctive features?`}
              style={styles.input}
              multiline
              numberOfLines={4}
            />

            <TextInput
              label="Contact Phone (optional)"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="Phone number for direct contact"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              label="Reward Amount (optional)"
              value={rewardAmount}
              onChangeText={setRewardAmount}
              placeholder="0.00"
              keyboardType="numeric"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />

            <View style={styles.urgencyContainer}>
              <Text style={styles.urgencyLabel}>Search Urgency</Text>
              <View style={styles.chipContainer}>
                <Chip
                  selected={urgencyLevel === 'high'}
                  onPress={() => setUrgencyLevel('high')}
                  style={[styles.chip, urgencyLevel === 'high' && { backgroundColor: '#FF5722' }]}
                  textStyle={{ color: urgencyLevel === 'high' ? 'white' : undefined }}
                >
                  High (5km)
                </Chip>
                <Chip
                  selected={urgencyLevel === 'medium'}
                  onPress={() => setUrgencyLevel('medium')}
                  style={[styles.chip, urgencyLevel === 'medium' && { backgroundColor: '#FF9800' }]}
                  textStyle={{ color: urgencyLevel === 'medium' ? 'white' : undefined }}
                >
                  Medium (10km)
                </Chip>
                <Chip
                  selected={urgencyLevel === 'low'}
                  onPress={() => setUrgencyLevel('low')}
                  style={[styles.chip, urgencyLevel === 'low' && { backgroundColor: '#4CAF50' }]}
                  textStyle={{ color: urgencyLevel === 'low' ? 'white' : undefined }}
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
              disabled={loading || !selectedLocation || !description.trim()}
              loading={loading}
              style={styles.reportButton}
              contentStyle={{ paddingVertical: 8 }}
            >
              Send Regional Alert
            </Button>
            <Text style={styles.disclaimer}>
              This will notify nearby TailTracker users in your selected radius to help find {pet.name}.
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
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
});

export default ReportLostPetScreen;