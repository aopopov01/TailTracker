import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

interface PremiumGateProps {
  feature: string;
  title?: string;
  description?: string;
  benefits?: string[];
  onUpgrade?: () => void;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  title = 'Premium Feature',
  description = 'This feature requires a premium subscription.',
  benefits = ['Unlock all features', 'Priority support', 'No ads'],
  onUpgrade,
}) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.description}>
            {description}
          </Text>
          
          {benefits.length > 0 && (
            <View style={styles.benefitsContainer}>
              <Text variant="titleMedium" style={styles.benefitsTitle}>
                Premium Benefits:
              </Text>
              {benefits.map((benefit, index) => (
                <Text key={index} style={styles.benefit}>
                  • {benefit}
                </Text>
              ))}
            </View>
          )}
          
          <Button
            mode="contained"
            onPress={onUpgrade}
            style={styles.upgradeButton}
          >
            Upgrade to Premium
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    maxWidth: 400,
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitsTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  benefit: {
    marginBottom: 4,
    paddingLeft: 8,
  },
  upgradeButton: {
    marginTop: 12,
  },
});

export default PremiumGate;