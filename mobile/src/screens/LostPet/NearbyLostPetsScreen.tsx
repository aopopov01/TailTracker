import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  FAB,
  Searchbar,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

import { 
  premiumLostPetService, 
  LostPetAlert, 
  LostPetHelpers 
} from '../../services/PremiumLostPetService';
import PremiumFeatureWrapper from '../../components/Payment/PremiumFeatureWrapper';

const NearbyLostPetsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<LostPetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);

  const loadAlerts = useCallback(async (radius: number = radiusKm) => {
    try {
      setError(null);
      
      const result = await premiumLostPetService.getNearbyAlerts(radius);
      
      if (result.success && result.alerts) {
        setAlerts(result.alerts);
      } else {
        setError(result.error || 'Failed to load nearby alerts');
      }
    } catch (err) {
      setError('Unable to load nearby lost pet alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [radiusKm]);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleFoundPet = async (alert: LostPetAlert) => {
    Alert.alert(
      'Mark as Found?',
      `Have you found ${alert.pet_name}? This will notify the owner and remove the alert.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Found!',
          onPress: async () => {
            try {
              const result = await premiumLostPetService.markPetFound(alert.id, 'community_member');
              if (result.success) {
                Alert.alert('Thank You!', `The owner has been notified that ${alert.pet_name} was found!`);
                loadAlerts(); // Refresh the list
              } else {
                Alert.alert('Error', 'Unable to mark pet as found. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getUrgencyStyle = (lastSeenDate: Date) => {
    const urgency = LostPetHelpers.getUrgencyLevel(lastSeenDate);
    switch (urgency) {
      case 'high':
        return { backgroundColor: '#FFEBEE', borderLeftColor: '#F44336', borderLeftWidth: 4 };
      case 'medium':
        return { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800', borderLeftWidth: 4 };
      case 'low':
        return { backgroundColor: '#F3E5F5', borderLeftColor: '#9C27B0', borderLeftWidth: 4 };
      default:
        return {};
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    alert.pet_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAlert = ({ item }: { item: LostPetAlert }) => (
    <Card style={[styles.alertCard, getUrgencyStyle(item.last_seen_date)]}>
      <Card.Content>
        <View style={styles.alertHeader}>
          <View style={styles.alertInfo}>
            <Text style={styles.petName}>{item.pet_name}</Text>
            <Text style={styles.petDetails}>
              {LostPetHelpers.getSpeciesIcon(item.species)} {item.species}
              {item.breed && ` • ${item.breed}`}
            </Text>
            <View style={styles.metaInfo}>
              <Chip
                icon="map-marker"
                style={styles.distanceChip}
                textStyle={styles.chipText}
              >
                {premiumLostPetService.formatDistance(item.distance_km)}
              </Chip>
              <Text style={styles.timeAgo}>
                {LostPetHelpers.formatTimeAgo(item.last_seen_date)}
              </Text>
            </View>
          </View>
          {item.photo_url && (
            <FastImage
              source={{ uri: item.photo_url }}
              style={styles.petPhoto}
              resizeMode={FastImage.resizeMode.cover}
            />
          )}
        </View>

        {item.last_seen_address && (
          <Text style={styles.location}>
            📍 Last seen: {item.last_seen_address}
          </Text>
        )}

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {item.reward_amount && (
          <View style={styles.rewardContainer}>
            <Chip
              icon="cash"
              style={styles.rewardChip}
              textStyle={{ color: 'white', fontWeight: 'bold' }}
            >
              {premiumLostPetService.formatReward(item.reward_amount, item.reward_currency)}
            </Chip>
          </View>
        )}

        <View style={styles.actionButtons}>
          {item.contact_phone && (
            <Button
              mode="outlined"
              icon="phone"
              onPress={() => handleCall(item.contact_phone!)}
              style={styles.actionButton}
              compact
            >
              Call Owner
            </Button>
          )}
          <Button
            mode="contained"
            icon="check-circle"
            onPress={() => handleFoundPet(item)}
            style={styles.foundButton}
            buttonColor="#4CAF50"
            compact
          >
            Found!
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <PremiumFeatureWrapper feature="lost-pet-alerts">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading nearby lost pets...</Text>
        </View>
      </PremiumFeatureWrapper>
    );
  }

  return (
    <PremiumFeatureWrapper feature="lost-pet-alerts">
      <View style={styles.container}>
        <View style={styles.header}>
          <Searchbar
            placeholder="Search lost pets..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <View style={styles.radiusSelector}>
            <Text style={styles.radiusLabel}>Search radius:</Text>
            <View style={styles.radiusChips}>
              {[10, 25, 50].map((radius) => (
                <Chip
                  key={radius}
                  selected={radiusKm === radius}
                  onPress={() => {
                    setRadiusKm(radius);
                    loadAlerts(radius);
                  }}
                  style={styles.radiusChip}
                >
                  {radius}km
                </Chip>
              ))}
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="outlined" onPress={() => loadAlerts()}>
              Retry
            </Button>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Lost Pets Nearby</Text>
            <Text style={styles.emptyDescription}>
              Great news! There are no reported lost pets in your area.
            </Text>
            <Button
              mode="outlined"
              onPress={handleRefresh}
              style={{ marginTop: 16 }}
            >
              Check Again
            </Button>
          </View>
        ) : (
          <FlatList
            data={filteredAlerts}
            renderItem={renderAlert}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <FAB
          icon="refresh"
          style={styles.fab}
          onPress={handleRefresh}
          small
        />
      </View>
    </PremiumFeatureWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchbar: {
    marginBottom: 12,
  },
  radiusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    marginRight: 4,
  },
  listContainer: {
    padding: 8,
  },
  alertCard: {
    margin: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  distanceChip: {
    marginRight: 8,
    backgroundColor: '#E3F2FD',
  },
  chipText: {
    fontSize: 12,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  petPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  location: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 20,
  },
  rewardContainer: {
    marginTop: 8,
  },
  rewardChip: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  foundButton: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default NearbyLostPetsScreen;