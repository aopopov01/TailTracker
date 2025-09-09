import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, Surface, RadioButton, Divider } from 'react-native-paper';
import { StripePaymentService, StripePaymentMethod } from '../../services/StripePaymentService';

interface PaymentMethodSelectorProps {
  onPaymentMethodSelected: (paymentMethodId: string) => void;
  onAddNewPaymentMethod: () => void;
  selectedPaymentMethodId: string;
  showApplePay?: boolean;
  showGooglePay?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onPaymentMethodSelected,
  onAddNewPaymentMethod,
  selectedPaymentMethodId,
  showApplePay = true,
  showGooglePay = true,
}) => {
  const [savedMethods, setSavedMethods] = useState<StripePaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const paymentService = StripePaymentService.getInstance();

  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods();
      setSavedMethods(methods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  }, [paymentService]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleDigitalWalletPayment = (type: 'apple_pay' | 'google_pay') => {
    onPaymentMethodSelected(type);
  };

  const renderDigitalWallets = () => {
    const showApple = showApplePay && Platform.OS === 'ios';
    const showGoogle = showGooglePay && Platform.OS === 'android';

    if (!showApple && !showGoogle) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Digital Wallets</Text>
        
        {showApple && (
          <Surface style={styles.paymentOption}>
            <RadioButton.Group
              onValueChange={() => handleDigitalWalletPayment('apple_pay')}
              value={selectedPaymentMethodId === 'apple_pay' ? 'apple_pay' : ''}
            >
              <RadioButton.Item
                label="Apple Pay"
                value="apple_pay"
                labelStyle={styles.optionLabel}
              />
            </RadioButton.Group>
          </Surface>
        )}

        {showGoogle && (
          <Surface style={styles.paymentOption}>
            <RadioButton.Group
              onValueChange={() => handleDigitalWalletPayment('google_pay')}
              value={selectedPaymentMethodId === 'google_pay' ? 'google_pay' : ''}
            >
              <RadioButton.Item
                label="Google Pay"
                value="google_pay"
                labelStyle={styles.optionLabel}
              />
            </RadioButton.Group>
          </Surface>
        )}
      </View>
    );
  };

  const renderSavedPaymentMethods = () => {
    if (savedMethods.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
        
        <RadioButton.Group
          onValueChange={onPaymentMethodSelected}
          value={selectedPaymentMethodId}
        >
          {savedMethods.map((method) => (
            <Surface key={method.id} style={styles.paymentOption}>
              <RadioButton.Item
                label={`${method.brand?.toUpperCase()} •••• ${method.last4}`}
                value={method.id}
                labelStyle={styles.optionLabel}
              />
            </Surface>
          ))}
        </RadioButton.Group>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderDigitalWallets()}
      
      {renderSavedPaymentMethods()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add New Payment Method</Text>
        
        <Button
          mode="outlined"
          onPress={onAddNewPaymentMethod}
          style={styles.addButton}
          icon="plus"
        >
          Add New Card
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  paymentOption: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  optionLabel: {
    fontSize: 14,
  },
  addButton: {
    borderRadius: 8,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
});

export default PaymentMethodSelector;