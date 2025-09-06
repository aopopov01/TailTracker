import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Linking,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  FAB,
  Searchbar,
} from 'react-native-paper';

import PremiumFeatureWrapper from '../../components/Payment/PremiumFeatureWrapper';
import { 
  premiumLostPetService, 
  LostPetAlert, 
  LostPetHelpers 
} from '../../services/PremiumLostPetService';

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
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            AccessibilityInfo.announceForAccessibility('Cancelled marking pet as found.');
          }
        },
        {
          text: 'Yes, Found!',
          onPress: async () => {
            try {
              AccessibilityInfo.announceForAccessibility(`Marking ${alert.pet_name} as found and notifying the owner.`);
              const result = await premiumLostPetService.markPetFound(alert.id, 'community_member');
              if (result.success) {
                const successMessage = `Thank you! The owner has been notified that ${alert.pet_name} was found!`;
                Alert.alert('Thank You!', successMessage);
                AccessibilityInfo.announceForAccessibility(successMessage);
                loadAlerts(); // Refresh the list
              } else {
                const errorMessage = 'Error: Unable to mark pet as found. Please try again.';
                Alert.alert('Error', 'Unable to mark pet as found. Please try again.');
                AccessibilityInfo.announceForAccessibility(errorMessage);
              }
            } catch (error) {
              const errorMessage = 'Error: Something went wrong. Please try again.';
              Alert.alert('Error', 'Something went wrong. Please try again.');
              AccessibilityInfo.announceForAccessibility(errorMessage);
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

  const renderAlert = ({ item, index }: { item: LostPetAlert; index: number }) => {
    const urgencyLevel = LostPetHelpers.getUrgencyLevel(item.last_seen_date);
    const urgencyText = urgencyLevel === 'high' ? 'High urgency' : urgencyLevel === 'medium' ? 'Medium urgency' : 'Low urgency';
    
    return (
      <Card 
        style={[styles.alertCard, getUrgencyStyle(item.last_seen_date)]}
        accessible={true}
        accessibilityRole="article"
        accessibilityLabel={`Lost pet alert ${index + 1} of ${filteredAlerts.length}. ${item.pet_name}, a ${item.species}${item.breed ? ` ${item.breed}` : ''}. ${urgencyText}. Distance: ${premiumLostPetService.formatDistance(item.distance_km)}. ${LostPetHelpers.formatTimeAgo(item.last_seen_date)}.`}
        accessibilityHint="Double tap to interact with this lost pet alert"
      >
        <Card.Content>
          <View style={styles.alertHeader}>
            <View style={styles.alertInfo}>
              <Text 
                style={styles.petName}
                accessibilityRole="header"
                accessibilityLevel={2}
                accessible={true}
                accessibilityLabel={`Pet name: ${item.pet_name}`}
              >
                {item.pet_name}
              </Text>
              <Text 
                style={styles.petDetails}
                accessible={true}
                accessibilityLabel={`Pet details: ${item.species}${item.breed ? `, breed: ${item.breed}` : ''}`}
              >
                {LostPetHelpers.getSpeciesIcon(item.species)} {item.species}
                {item.breed && ` • ${item.breed}`}
              </Text>
              <View 
                style={styles.metaInfo}
                accessible={true}
                accessibilityLabel="Location and timing information"
              >
                <Chip
                  icon="map-marker"
                  style={styles.distanceChip}
                  textStyle={styles.chipText}
                  accessible={true}
                  accessibilityLabel={`Distance from your location: ${premiumLostPetService.formatDistance(item.distance_km)}`}
                  accessibilityRole="text"
                >
                  {premiumLostPetService.formatDistance(item.distance_km)}
                </Chip>
                <Text 
                  style={styles.timeAgo}
                  accessible={true}
                  accessibilityLabel={`Time since last seen: ${LostPetHelpers.formatTimeAgo(item.last_seen_date)}`}
                >
                  {LostPetHelpers.formatTimeAgo(item.last_seen_date)}
                </Text>
              </View>
            </View>
            {item.photo_url && (
              <FastImage
                source={{ uri: item.photo_url }}
                style={styles.petPhoto}
                resizeMode={FastImage.resizeMode.cover}
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`Photo of ${item.pet_name}, the missing ${item.species}${item.breed ? ` ${item.breed}` : ''}`}
                accessibilityHint="This is a recent photo of the missing pet to help with identification"
              />
            )}
          </View>

          {item.last_seen_address && (
            <Text 
              style={styles.location}
              accessible={true}
              accessibilityLabel={`Last seen location: ${item.last_seen_address}`}
              accessibilityRole="text"
            >
              📍 Last seen: {item.last_seen_address}
            </Text>
          )}

          {item.description && (
            <Text 
              style={styles.description}
              accessible={true}
              accessibilityLabel={`Description from owner: ${item.description}`}
              accessibilityRole="text"
            >
              {item.description}
            </Text>
          )}

          {item.reward_amount && (
            <View 
              style={styles.rewardContainer}
              accessible={true}
              accessibilityLabel="Reward information"
            >
              <Chip
                icon="cash"
                style={styles.rewardChip}
                textStyle={{ color: 'white', fontWeight: 'bold' }}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Reward offered: ${premiumLostPetService.formatReward(item.reward_amount, item.reward_currency)}`}
              >
                {premiumLostPetService.formatReward(item.reward_amount, item.reward_currency)}
              </Chip>
            </View>
          )}

          <View 
            style={styles.actionButtons}
            accessible={true}
            accessibilityRole="group"
            accessibilityLabel="Action buttons for this lost pet alert"
          >
            {item.contact_phone && (
              <Button
                mode="outlined"
                icon="phone"
                onPress={() => {
                  handleCall(item.contact_phone!);
                  AccessibilityInfo.announceForAccessibility(`Calling ${item.pet_name}'s owner at ${item.contact_phone}`);
                }}
                style={[styles.actionButton, { minHeight: 44 }]}
                compact
                accessible={true}
                accessibilityLabel={`Call ${item.pet_name}'s owner at ${item.contact_phone}`}
                accessibilityHint="Double tap to call the pet owner's phone number"
                accessibilityRole="button"
              >
                Call Owner
              </Button>
            )}
            <Button
              mode="contained"
              icon="check-circle"
              onPress={() => handleFoundPet(item)}
              style={[styles.foundButton, { minHeight: 44 }]}
              buttonColor="#4CAF50"
              compact
              accessible={true}
              accessibilityLabel={`Mark ${item.pet_name} as found`}
              accessibilityHint="Double tap to report that you have found this pet. This will notify the owner and remove the alert."
              accessibilityRole="button"
            >
              Found!
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <PremiumFeatureWrapper feature="lost-pet-alerts">
        <View 
          style={styles.centerContainer}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityLabel="Loading nearby lost pets"
        >
          <ActivityIndicator 
            size="large" 
            accessible={true}
            accessibilityLabel="Loading indicator"
          />
          <Text 
            style={styles.loadingText}
            accessible={true}
            accessibilityLabel="Loading nearby lost pets, please wait"
          >
            Loading nearby lost pets...
          </Text>
        </View>
      </PremiumFeatureWrapper>
    );
  }

  return (
    <PremiumFeatureWrapper feature="lost-pet-alerts">
      <View style={styles.container}>
        <View 
          style={styles.header}
          accessible={false}
          accessibilityLabel="Search and filter controls"
        >
          <Searchbar
            placeholder="Search lost pets..."
            onChangeText={(query) => {
              setSearchQuery(query);
              if (query.trim()) {
                AccessibilityInfo.announceForAccessibility(`Searching for: ${query}`);
              }
            }}
            value={searchQuery}
            style={styles.searchbar}
            accessible={true}
            accessibilityLabel="Search lost pets by name, species, breed, or description"
            accessibilityHint="Type to filter the list of nearby lost pets"
            accessibilityRole="search"
          />
          
          <View 
            style={styles.radiusSelector}
            accessible={true}
            accessibilityRole="radiogroup"
            accessibilityLabel="Search radius selection"
          >
            <Text 
              style={styles.radiusLabel}
              accessible={true}
              accessibilityRole="text"
            >
              Search radius:
            </Text>
            <View style={styles.radiusChips}>
              {[10, 25, 50].map((radius) => (
                <Chip
                  key={radius}
                  selected={radiusKm === radius}
                  onPress={() => {
                    setRadiusKm(radius);
                    loadAlerts(radius);
                    AccessibilityInfo.announceForAccessibility(`Search radius changed to ${radius} kilometers. Loading new results.`);
                  }}
                  style={[styles.radiusChip, { minHeight: 44 }]}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel={`${radius} kilometer radius`}
                  accessibilityHint={`Change search radius to ${radius} kilometers`}
                  accessibilityState={{ selected: radiusKm === radius, checked: radiusKm === radius }}
                >
                  {radius}km
                </Chip>
              ))}
            </View>
          </View>
        </View>

        {error ? (
          <View 
            style={styles.errorContainer}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel={`Error: ${error}`}
          >
            <Text 
              style={styles.errorText}
              accessible={true}
              accessibilityRole="text"
            >
              {error}
            </Text>
            <Button 
              mode="outlined" 
              onPress={() => {
                loadAlerts();
                AccessibilityInfo.announceForAccessibility('Retrying to load nearby lost pet alerts.');
              }}
              accessible={true}
              accessibilityLabel="Retry loading nearby lost pet alerts"
              accessibilityHint="Double tap to try loading the alerts again"
              style={{ minHeight: 44 }}
            >
              Retry
            </Button>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View 
            style={styles.emptyContainer}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="No lost pets found in your area"
          >
            <Text 
              style={styles.emptyTitle}
              accessibilityRole="header"
              accessibilityLevel={1}
              accessible={true}
            >
              No Lost Pets Nearby
            </Text>
            <Text 
              style={styles.emptyDescription}
              accessible={true}
              accessibilityLabel="Great news! There are no reported lost pets in your area."
            >
              Great news! There are no reported lost pets in your area.
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                handleRefresh();
                AccessibilityInfo.announceForAccessibility('Checking again for nearby lost pets.');
              }}
              style={{ marginTop: 16, minHeight: 44 }}
              accessible={true}
              accessibilityLabel="Check again for nearby lost pets"
              accessibilityHint="Double tap to refresh and check for new lost pet alerts"
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
                onRefresh={() => {
                  handleRefresh();
                  AccessibilityInfo.announceForAccessibility('Refreshing nearby lost pet alerts.');
                }}
                accessible={true}
                accessibilityLabel="Pull to refresh lost pet alerts"
              />
            }
            showsVerticalScrollIndicator={false}
            accessible={false}
            accessibilityLabel={`List of ${filteredAlerts.length} nearby lost pet alerts`}
            accessibilityHint="Swipe up and down to navigate through lost pet alerts"
          />
        )}

        <FAB
          icon="refresh"
          style={styles.fab}
          onPress={() => {
            handleRefresh();
            AccessibilityInfo.announceForAccessibility('Refreshing nearby lost pet alerts.');
          }}
          small
          accessible={true}
          accessibilityLabel="Refresh nearby lost pet alerts"
          accessibilityHint="Double tap to refresh and check for new lost pet alerts"
          accessibilityRole="button"
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