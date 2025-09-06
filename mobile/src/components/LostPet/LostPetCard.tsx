import React from 'react';
import {
  View,
  StyleSheet,
  Linking,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  Text,
  Card,
  Button,
  Chip,
} from 'react-native-paper';

import { 
  LostPetAlert, 
  LostPetHelpers,
  premiumLostPetService 
} from '../../services/PremiumLostPetService';
import { 
  premiumNotificationService 
} from '../../services/PremiumNotificationService';

interface LostPetCardProps {
  alert: LostPetAlert;
  onFoundPress?: (alert: LostPetAlert) => void;
  onCallPress?: (phone: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const LostPetCard: React.FC<LostPetCardProps> = ({
  alert,
  onFoundPress,
  onCallPress,
  showActions = true,
  compact = false,
}) => {
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

  const handleCall = () => {
    if (alert.contact_phone) {
      if (onCallPress) {
        onCallPress(alert.contact_phone);
      } else {
        Linking.openURL(`tel:${alert.contact_phone}`);
      }
    }
  };

  const handleFound = () => {
    if (onFoundPress) {
      onFoundPress(alert);
    } else {
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
    }
  };

  const urgencyLevel = LostPetHelpers.getUrgencyLevel(alert.last_seen_date);
  const urgencyText = urgencyLevel === 'high' ? 'High urgency' : urgencyLevel === 'medium' ? 'Medium urgency' : 'Low urgency';
  
  return (
    <Card 
      style={[styles.card, getUrgencyStyle(alert.last_seen_date)]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Lost pet alert for ${alert.pet_name}, a ${alert.species}${alert.breed ? ` ${alert.breed}` : ''}. ${urgencyText}. Distance: ${premiumLostPetService.formatDistance(alert.distance_km)}. ${LostPetHelpers.formatTimeAgo(alert.last_seen_date)}.`}
      accessibilityHint="Double tap to interact with this lost pet alert"
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={[styles.info, { flex: compact ? 1 : undefined }]}>
            <Text 
              style={styles.petName}
              accessibilityRole="header"
              accessible={true}
              accessibilityLabel={`Pet name: ${alert.pet_name}`}
            >
              {alert.pet_name}
            </Text>
            <Text 
              style={styles.petDetails}
              accessible={true}
              accessibilityLabel={`Pet details: ${alert.species}${alert.breed && !compact ? `, breed: ${alert.breed}` : ''}`}
            >
              {LostPetHelpers.getSpeciesIcon(alert.species)} {alert.species}
              {alert.breed && !compact && ` • ${alert.breed}`}
            </Text>
            
            <View 
              style={styles.metaInfo}
              accessible={true}
              accessibilityLabel={`Location and timing information`}
            >
              <Chip
                icon="map-marker"
                style={styles.distanceChip}
                textStyle={styles.chipText}
                compact
                accessible={true}
                accessibilityLabel={`Distance from your location: ${premiumLostPetService.formatDistance(alert.distance_km)}`}
                accessibilityRole="text"
              >
                {premiumLostPetService.formatDistance(alert.distance_km)}
              </Chip>
              <Text 
                style={styles.timeAgo}
                accessible={true}
                accessibilityLabel={`Time since last seen: ${LostPetHelpers.formatTimeAgo(alert.last_seen_date)}`}
              >
                {LostPetHelpers.formatTimeAgo(alert.last_seen_date)}
              </Text>
            </View>
          </View>

          {alert.photo_url && (
            <FastImage
              source={{ uri: alert.photo_url }}
              style={[styles.petPhoto, compact && styles.petPhotoCompact]}
              resizeMode={FastImage.resizeMode.cover}
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel={`Photo of ${alert.pet_name}, the missing ${alert.species}${alert.breed ? ` ${alert.breed}` : ''}`}
              accessibilityHint="This is a recent photo of the missing pet to help with identification"
            />
          )}
        </View>

        {alert.last_seen_address && !compact && (
          <Text 
            style={styles.location} 
            numberOfLines={2}
            accessible={true}
            accessibilityLabel={`Last seen location: ${alert.last_seen_address}`}
            accessibilityRole="text"
          >
            📍 Last seen: {alert.last_seen_address}
          </Text>
        )}

        {alert.description && !compact && (
          <Text 
            style={styles.description} 
            numberOfLines={3}
            accessible={true}
            accessibilityLabel={`Description from owner: ${alert.description}`}
            accessibilityRole="text"
          >
            {alert.description}
          </Text>
        )}

        {alert.reward_amount && (
          <View 
            style={styles.rewardContainer}
            accessible={true}
            accessibilityLabel="Reward information"
          >
            <Chip
              icon="cash"
              style={styles.rewardChip}
              textStyle={{ color: 'white', fontWeight: 'bold' }}
              compact={compact}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Reward offered: ${premiumLostPetService.formatReward(alert.reward_amount, alert.reward_currency)}`}
            >
              {premiumLostPetService.formatReward(alert.reward_amount, alert.reward_currency)}
            </Chip>
          </View>
        )}

        {showActions && (
          <View 
            style={[styles.actionButtons, compact && styles.actionButtonsCompact]}
            accessible={true}
            accessibilityLabel="Action buttons for this lost pet alert"
          >
            {alert.contact_phone && (
              <Button
                mode="outlined"
                icon="phone"
                onPress={() => {
                  handleCall();
                  AccessibilityInfo.announceForAccessibility(`Calling ${alert.pet_name}'s owner at ${alert.contact_phone}`);
                }}
                style={[styles.actionButton, { minHeight: 44 }]}
                compact={compact}
                labelStyle={compact ? styles.compactButtonText : undefined}
                accessible={true}
                accessibilityLabel={`Call ${alert.pet_name}'s owner at ${alert.contact_phone}`}
                accessibilityHint="Double tap to call the pet owner's phone number"
                accessibilityRole="button"
              >
                {compact ? 'Call' : 'Call Owner'}
              </Button>
            )}
            <Button
              mode="contained"
              icon="check-circle"
              onPress={() => {
                handleFound();
                AccessibilityInfo.announceForAccessibility(`Marking ${alert.pet_name} as found. This will notify the owner.`);
              }}
              style={[styles.foundButton, { minHeight: 44 }]}
              buttonColor="#4CAF50"
              compact={compact}
              labelStyle={compact ? styles.compactButtonText : undefined}
              accessible={true}
              accessibilityLabel={`Mark ${alert.pet_name} as found`}
              accessibilityHint="Double tap to report that you have found this pet. This will notify the owner and remove the alert."
              accessibilityRole="button"
            >
              Found!
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
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
  petPhotoCompact: {
    width: 50,
    height: 50,
    borderRadius: 6,
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
  actionButtonsCompact: {
    marginTop: 12,
    gap: 6,
  },
  actionButton: {
    flex: 1,
  },
  foundButton: {
    flex: 1,
  },
  compactButtonText: {
    fontSize: 12,
  },
});

export default LostPetCard;