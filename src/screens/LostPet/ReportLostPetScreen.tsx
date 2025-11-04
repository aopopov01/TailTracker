import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

import PremiumFeatureWrapper from '../../components/Payment/PremiumFeatureWrapper';
import lostPetService from '../../services/LostPetService'; // NOTE: LostPetService exports default
import type { LostPetAlert } from '../../services/LostPetService';
import { Pet } from '../../types/Pet';
import { AutoPopulateField } from '../../components/AutoPopulate/AutoPopulateField';
import { useDataSync } from '../../contexts/DataSyncContext';

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
  const { updateUserData, updatePetData } = useDataSync();

  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'high' | 'medium' | 'low'>(
    'high'
  );
  const [lastSeenAddress, setLastSeenAddress] = useState('');
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // Update context when form data changes
  useEffect(() => {
    if (contactPhone || ownerName) {
      updateUserData({
        phone: contactPhone,
        full_name: ownerName,
      });
    }

    updatePetData({
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
    });
  }, [contactPhone, ownerName, pet, updateUserData, updatePetData]);

  const checkAccessibilitySettings = useCallback(async () => {
    // Check if screen reader is enabled
    const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    setIsScreenReaderEnabled(screenReaderEnabled);
  }, []);

  // Check accessibility on mount
  useEffect(() => {
    checkAccessibilitySettings();
  }, [checkAccessibilitySettings]);

  const handleReportLostPet = async () => {
    if (!lastSeenAddress.trim()) {
      Alert.alert(
        'Address Required',
        'Please provide the address where your pet was last seen.'
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Description Required',
        'Please provide a description to help others identify your pet.'
      );
      return;
    }

    try {
      setLoading(true);

      // NOTE: reportLostPet expects a single params object
      const result = await lostPetService.reportLostPet({
        pet_id: pet.id,
        reported_by: 'current_user_id', // TODO: Get from auth context
        description: description.trim(),
        last_seen_address: lastSeenAddress.trim(),
        contact_phone: contactPhone,
        photo_urls: [], // photos array
        reward_amount: rewardAmount ? parseFloat(rewardAmount) : undefined,
      });

      if (result.success) {
        Alert.alert(
          'Lost Pet Reported',
          `Alert created successfully. Nearby users will be notified. We'll help bring ${pet.name} home!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Report Failed',
          result.error || 'Failed to report lost pet. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#FF5722';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#FF5722';
    }
  };

  return (
    <PremiumFeatureWrapper
      feature='lost-pet-alerts'
      gateProps={{
        title: 'Premium Feature: Lost Pet Alerts',
        description:
          'Report lost pets and receive regional community alerts to help find your beloved companion.',
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
            <Paragraph>
              {pet.species} • {pet.breed}
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Title>Alert Details</Title>

            <TextInput
              label='Last Seen Address *'
              value={lastSeenAddress}
              onChangeText={setLastSeenAddress}
              style={styles.input}
              multiline
              numberOfLines={2}
              placeholder='Enter the full address where your pet was last seen'
              accessibilityLabel='Required address field where your pet was last seen'
              accessibilityHint='Type the complete address including street, city, and state'
            />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description *</Text>
              <AutoPopulateField
                style={[styles.autoInput, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder={`Help others identify ${pet.name}. What was ${pet.name} wearing? Any distinctive features?`}
                multiline
                numberOfLines={4}
                context='pet'
                fieldPath='description'
                accessibilityLabel={`Required description field for ${pet.name}`}
                accessibilityHint="Describe your pet's appearance, clothing, collar, or any distinctive features to help others identify them"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contact Phone (optional)</Text>
              <AutoPopulateField
                style={styles.autoInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder='Phone number for direct contact'
                keyboardType='phone-pad'
                context='user'
                fieldPath='phone'
                accessibilityLabel='Optional phone number for direct contact'
                accessibilityHint='Provide a phone number where people can call you directly if they find your pet'
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Emergency Contact (optional)
              </Text>
              <AutoPopulateField
                style={styles.autoInput}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder='Backup contact person'
                keyboardType='phone-pad'
                context='user'
                fieldPath='emergency_contact'
                accessibilityLabel='Optional emergency contact'
                accessibilityHint="Provide an alternative contact if you're unreachable"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Owner Name (optional)</Text>
              <AutoPopulateField
                style={styles.autoInput}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder='Your full name'
                context='user'
                fieldPath='full_name'
                accessibilityLabel='Optional owner name'
                accessibilityHint='Your name to display on lost pet alerts'
              />
            </View>

            <TextInput
              label='Reward Amount (optional)'
              value={rewardAmount}
              onChangeText={setRewardAmount}
              placeholder='0.00'
              keyboardType='numeric'
              style={styles.input}
              left={<TextInput.Affix text='$' />}
              accessibilityLabel='Optional reward amount in US dollars'
              accessibilityHint="Enter the monetary reward you're offering to anyone who helps find your pet"
            />

            <View
              style={styles.urgencyContainer}
              accessible={true}
              accessibilityRole='radiogroup'
              accessibilityLabel='Search urgency level selection'
            >
              <Text style={styles.urgencyLabel} accessibilityRole='header'>
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
                      AccessibilityInfo.announceForAccessibility(
                        'High urgency selected. Will notify users within 5 kilometers.'
                      );
                    }
                  }}
                  style={[
                    styles.chip,
                    urgencyLevel === 'high' && { backgroundColor: '#D32F2F' },
                  ]}
                  textStyle={{
                    color: urgencyLevel === 'high' ? 'white' : undefined,
                  }}
                  accessible={true}
                  accessibilityRole='radio'
                  accessibilityLabel='High urgency, 5 kilometer radius'
                  accessibilityHint='Sends alerts to users within 5 kilometers for immediate help'
                  accessibilityState={{
                    selected: urgencyLevel === 'high',
                    checked: urgencyLevel === 'high',
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  High (5km)
                </Chip>
                <Chip
                  selected={urgencyLevel === 'medium'}
                  onPress={() => {
                    setUrgencyLevel('medium');
                    if (isScreenReaderEnabled) {
                      AccessibilityInfo.announceForAccessibility(
                        'Medium urgency selected. Will notify users within 10 kilometers.'
                      );
                    }
                  }}
                  style={[
                    styles.chip,
                    urgencyLevel === 'medium' && { backgroundColor: '#F57C00' },
                  ]}
                  textStyle={{
                    color: urgencyLevel === 'medium' ? 'white' : undefined,
                  }}
                  accessible={true}
                  accessibilityRole='radio'
                  accessibilityLabel='Medium urgency, 10 kilometer radius'
                  accessibilityHint='Sends alerts to users within 10 kilometers for broader coverage'
                  accessibilityState={{
                    selected: urgencyLevel === 'medium',
                    checked: urgencyLevel === 'medium',
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  Medium (10km)
                </Chip>
                <Chip
                  selected={urgencyLevel === 'low'}
                  onPress={() => {
                    setUrgencyLevel('low');
                    if (isScreenReaderEnabled) {
                      AccessibilityInfo.announceForAccessibility(
                        'Low urgency selected. Will notify users within 15 kilometers.'
                      );
                    }
                  }}
                  style={[
                    styles.chip,
                    urgencyLevel === 'low' && { backgroundColor: '#388E3C' },
                  ]}
                  textStyle={{
                    color: urgencyLevel === 'low' ? 'white' : undefined,
                  }}
                  accessible={true}
                  accessibilityRole='radio'
                  accessibilityLabel='Low urgency, 15 kilometer radius'
                  accessibilityHint='Sends alerts to users within 15 kilometers for wide area coverage'
                  accessibilityState={{
                    selected: urgencyLevel === 'low',
                    checked: urgencyLevel === 'low',
                  }}
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
            <View style={styles.autoPopulateInfo}>
              <Text style={styles.autoPopulateText}>
                💡 Contact information auto-fills from your previous entries for
                faster reporting.
              </Text>
            </View>
            <Button
              mode='contained'
              onPress={handleReportLostPet}
              disabled={
                loading || !lastSeenAddress.trim() || !description.trim()
              }
              loading={loading}
              style={[styles.reportButton, { minHeight: 48 }]} // WCAG touch target minimum
              contentStyle={{ paddingVertical: 12 }}
              accessibilityLabel={`Send emergency alert for missing ${pet.name}`}
              accessibilityHint={`This will immediately notify nearby TailTracker users within ${urgencyLevel === 'high' ? '5' : urgencyLevel === 'medium' ? '10' : '15'} kilometers to help find your pet`}
              accessibilityState={{
                disabled:
                  loading || !lastSeenAddress.trim() || !description.trim(),
              }}
            >
              🚨 Send Regional Alert
            </Button>
            <Text
              style={styles.disclaimer}
              accessibilityLabel={`Important: This emergency alert will immediately notify all TailTracker users within ${urgencyLevel === 'high' ? '5' : urgencyLevel === 'medium' ? '10' : '15'} kilometers of the selected location to help find ${pet.name}. The alert includes your pet's photo, description, and contact information if provided.`}
            >
              ⚠️ This will notify nearby TailTracker users in your selected
              radius to help find {pet.name}.
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

  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  autoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  autoPopulateInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  autoPopulateText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
  },
});

export default ReportLostPetScreen;
