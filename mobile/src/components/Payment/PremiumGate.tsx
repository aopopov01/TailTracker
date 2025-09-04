import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  List,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

interface PremiumGateProps {
  feature: string;
  title?: string;
  description?: string;
  benefits?: string[];
  children?: React.ReactNode;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  title,
  description,
  benefits = [],
  children,
  showUpgradeButton = true,
  onUpgrade,
}) => {
  const navigation = useNavigation();

  const defaultTitles: Record<string, string> = {
    unlimited_pets: 'Unlimited Pets',
    unlimited_photos: 'Unlimited Photos',
    push_notifications: 'Push Notifications',
    lost_pet_alerts: 'Lost Pet Alerts',
    vaccination_reminders: 'Vaccination Reminders',
    medication_tracking: 'Medication Tracking',
    advanced_health_tracking: 'Advanced Health Tracking',
    family_sharing_unlimited: 'Family Sharing',
  };

  const defaultDescriptions: Record<string, string> = {
    unlimited_pets: 'Add as many pets as you want to your family.',
    unlimited_photos: 'Upload unlimited photos for each of your pets.',
    push_notifications: 'Receive instant push notifications for pet alerts, reminders, and emergencies.',
    lost_pet_alerts: 'Report lost pets with location pins and contact info. Community alerts sent to all nearby users.',
    vaccination_reminders: 'Never miss a vaccination with smart reminders.',
    medication_tracking: 'Track medications and get dosage reminders.',
    advanced_health_tracking: 'Monitor your pet\'s health with detailed tracking.',
    family_sharing_unlimited: 'Share pet profiles with up to 10 family members.',
  };

  const defaultBenefits: Record<string, string[]> = {
    unlimited_pets: [
      'Add unlimited pets to your account',
      'No restrictions on pet profiles',
      'Perfect for pet families and professionals',
    ],
    unlimited_photos: [
      'Upload unlimited photos per pet',
      'High-quality photo storage',
      'Create beautiful pet albums',
    ],
    lost_pet_alerts: [
      'Post lost pet alerts with last known location',
      'Add contact phone number and custom message',
      'Community receives push notifications to help',
      'Pin location on map for all users to see',
    ],
    vaccination_reminders: [
      'Smart vaccination scheduling',
      'Automatic reminder notifications',
      'Vaccination history tracking',
      'Vet appointment integration',
    ],
    medication_tracking: [
      'Medication schedule management',
      'Dosage tracking and reminders',
      'Prescription refill alerts',
      'Health progress monitoring',
    ],
    advanced_health_tracking: [
      'Detailed health metrics',
      'Weight and growth tracking',
      'Symptom logging and trends',
      'Vet report generation',
    ],
    family_sharing_unlimited: [
      'Share with up to 10 family members',
      'Role-based access controls',
      'Real-time collaboration',
      'Family activity timeline',
    ],
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate('Subscription' as never);
    }
  };

  const featureTitle = title || defaultTitles[feature] || 'Premium Feature';
  const featureDescription = description || defaultDescriptions[feature] || 'This feature requires a premium subscription.';
  const featureBenefits = benefits.length > 0 ? benefits : (defaultBenefits[feature] || []);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          {/* Premium Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.crownIcon}>
              <Text style={styles.crownText}>👑</Text>
            </View>
          </View>

          {/* Title and Description */}
          <Title style={styles.title}>{featureTitle}</Title>
          <Text style={styles.description}>{featureDescription}</Text>

          {/* Benefits List */}
          {featureBenefits.length > 0 && (
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Premium Benefits:</Text>
              {featureBenefits.map((benefit, index) => (
                <List.Item
                  key={index}
                  title={benefit}
                  left={(props) => (
                    <List.Icon 
                      {...props} 
                      icon="check-circle" 
                      color="#6200EE" 
                    />
                  )}
                  titleStyle={styles.benefitText}
                  style={styles.benefitItem}
                />
              ))}
            </View>
          )}

          {/* Custom Content */}
          {children}

          {/* Upgrade Button */}
          {showUpgradeButton && (
            <Button
              mode="contained"
              onPress={handleUpgrade}
              style={styles.upgradeButton}
              contentStyle={styles.upgradeButtonContent}
              icon="crown"
            >
              Upgrade to Premium
            </Button>
          )}

          {/* Free Trial Info */}
          <Text style={styles.trialInfo}>
            7-day free trial • Cancel anytime • €7.99/month after trial
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    elevation: 8,
    borderRadius: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  crownIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownText: {
    fontSize: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#6200EE',
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  benefitItem: {
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  benefitText: {
    fontSize: 14,
    lineHeight: 18,
  },
  upgradeButton: {
    marginVertical: 16,
    backgroundColor: '#6200EE',
  },
  upgradeButtonContent: {
    height: 48,
  },
  trialInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default PremiumGate;