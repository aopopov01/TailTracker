import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { premiumLostPetService } from '../../services/PremiumLostPetService';
import { Pet } from '../../types/Pet';
import usePremiumAccess from '../../hooks/usePremiumAccess';

interface LostPetStatusProps {
  pet: Pet;
  onStatusChange?: () => void;
}

export const LostPetStatus: React.FC<LostPetStatusProps> = ({
  pet,
  onStatusChange,
}) => {
  const navigation = useNavigation();
  const { hasPremiumAccess } = usePremiumAccess();
  const [loading, setLoading] = useState(false);
  const [lostPetId, setLostPetId] = useState<string | null>(null);

  useEffect(() => {
    // Check if pet is currently reported as lost
    // This would typically come from the pet's status or a separate API call
    if (pet.status === 'lost') {
      // In a real app, you'd fetch the lost pet ID from the pet's data
      setLostPetId(pet.lostPetId || null);
    }
  }, [pet]);

  const handleReportLost = () => {
    if (!hasPremiumAccess) {
      premiumLostPetService.showPremiumPrompt();
      return;
    }

    // Navigate to report lost pet screen
    navigation.navigate('ReportLostPet', { pet });
  };

  const handleMarkFound = async () => {
    if (!lostPetId) return;

    Alert.alert(
      'Mark as Found',
      `Great news! Is ${pet.name} safely home?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Found!',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await premiumLostPetService.markPetFound(lostPetId, undefined);
              
              if (result.success) {
                Alert.alert(
                  'Welcome Home!',
                  `${pet.name} has been marked as found. The community has been notified!`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setLostPetId(null);
                        onStatusChange?.();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'Unable to mark pet as found. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewNearbyAlerts = () => {
    navigation.navigate('NearbyLostPets');
  };

  // If pet is currently lost
  if (pet.status === 'lost' && lostPetId) {
    return (
      <Card style={[styles.card, styles.lostCard]}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.statusIndicator}>
              <Chip
                icon="alert-circle"
                style={styles.lostChip}
                textStyle={{ color: 'white', fontWeight: 'bold' }}
              >
                MISSING
              </Chip>
            </View>
          </View>

          <Text style={styles.lostTitle}>
            {pet.name} is currently reported as missing
          </Text>
          <Text style={styles.lostDescription}>
            Regional alerts have been sent to the community.
          </Text>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="check-circle"
              onPress={handleMarkFound}
              loading={loading}
              disabled={loading}
              style={styles.foundButton}
              buttonColor="#4CAF50"
            >
              Mark as Found
            </Button>
            <Button
              mode="outlined"
              icon="eye"
              onPress={handleViewNearbyAlerts}
              style={styles.viewButton}
            >
              View Nearby Alerts
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  }

  // If pet is not lost - show options to report or view nearby
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Lost Pet Community</Text>
          {!hasPremiumAccess && (
            <Chip
              icon="star"
              style={styles.premiumChip}
              textStyle={{ color: '#FF9800', fontSize: 10 }}
              compact
            >
              Premium
            </Chip>
          )}
        </View>

        <Text style={styles.description}>
          Join the community effort to help find lost pets in your area.
        </Text>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            icon="alert-circle-outline"
            onPress={handleReportLost}
            style={styles.reportButton}
          >
            Report {pet.name} Lost
          </Button>
          <Button
            mode="contained"
            icon="map-search"
            onPress={handleViewNearbyAlerts}
            style={styles.nearbyButton}
          >
            Help Find Others
          </Button>
        </View>

        {!hasPremiumAccess && (
          <Text style={styles.premiumNote}>
            Premium required to report lost pets and send regional alerts.
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  lostCard: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lostTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  lostDescription: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lostChip: {
    backgroundColor: '#F44336',
  },
  premiumChip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reportButton: {
    flex: 1,
    borderColor: '#FF9800',
  },
  nearbyButton: {
    flex: 1,
  },
  foundButton: {
    flex: 1,
  },
  viewButton: {
    flex: 1,
  },
  premiumNote: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default LostPetStatus;