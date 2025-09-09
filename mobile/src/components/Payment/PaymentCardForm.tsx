import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { PaymentMethod } from '@stripe/stripe-react-native';

interface PaymentCardFormProps {
  onPaymentMethodCreated: (paymentMethod: any) => void;
  onError: (error: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PaymentCardForm: React.FC<PaymentCardFormProps> = ({
  onPaymentMethodCreated,
  onError,
  loading = false,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreatePaymentMethod = async () => {
    try {
      setIsProcessing(true);
      
      // Mock payment method creation for now
      // In a real implementation, this would use Stripe's CardField component
      // and createPaymentMethod from useStripe hook
      
      const mockPaymentMethod: any = {
        id: 'pm_' + Math.random().toString(36).substring(7),
        customerId: 'cus_' + Math.random().toString(36).substring(7),
        liveMode: false,
        BillingDetails: {
          email: 'test@example.com',
        },
        Card: {
          brand: 'Visa',
          country: 'US',
          expMonth: 12,
          expYear: 2025,
          fingerprint: 'fingerprint_123',
          funding: 'credit',
          last4: '4242',
        },
        created: new Date(),
      };

      onPaymentMethodCreated(mockPaymentMethod);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to create payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.formContainer}>
        <Text style={styles.title}>Add Payment Method</Text>
        
        {/* In a real implementation, this would be replaced with Stripe's CardField */}
        <View style={styles.cardFieldPlaceholder}>
          <Text style={styles.placeholderText}>
            Card payment form will be implemented here with Stripe's CardField component
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleCreatePaymentMethod}
          loading={loading || isProcessing}
          disabled={disabled || isProcessing}
          style={styles.submitButton}
        >
          Add Card
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  formContainer: {
    padding: 20,
    borderRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardFieldPlaceholder: {
    height: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
  submitButton: {
    marginTop: 16,
  },
});

export default PaymentCardForm;