import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  CardField,
  CardFieldInput,
  PaymentMethod,
  StripeError,
} from '@stripe/stripe-react-native';
import {
  Card,
  Title,
  Button,
  Text,
} from 'react-native-paper';
import { StripePaymentService } from '../../services/StripePaymentService';

interface PaymentCardFormProps {
  onPaymentMethodCreated: (paymentMethod: PaymentMethod.Result) => void;
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
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [cardValid, setCardValid] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const paymentService = StripePaymentService.getInstance();

  const handleCardDetailsChange = (details: CardFieldInput.Details) => {
    setCardDetails(details);
    setCardValid(details.complete && !details.validExpiryDate && !details.validCVC && !details.validNumber ? false : details.complete);
  };

  const handleCreatePaymentMethod = async () => {
    if (!cardDetails || !cardValid) {
      onError('Please enter valid card details');
      return;
    }

    setProcessingPayment(true);

    try {
      const { paymentMethod, error } = await paymentService.createCardPaymentMethod({
        type: 'Card',
        billingDetails: {
          // Optional: collect billing details
        },
      });

      if (error) {
        const parsedError = paymentService.parseStripeError(error);
        onError(parsedError.message);
      } else if (paymentMethod) {
        onPaymentMethodCreated(paymentMethod);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to create payment method');
    } finally {
      setProcessingPayment(false);
    }
  };

  const isDisabled = disabled || loading || processingPayment || !cardValid;

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Title style={styles.title}>Card Information</Title>
        
        <View style={styles.cardFieldContainer}>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
              expiration: 'MM/YY',
              cvc: 'CVC',
            }}
            cardStyle={{
              backgroundColor: '#FFFFFF',
              textColor: '#000000',
              fontSize: 16,
              placeholderColor: '#999999',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E0E0E0',
            }}
            style={styles.cardField}
            onCardChange={handleCardDetailsChange}
            disabled={disabled || loading}
          />
        </View>

        {Platform.OS === 'ios' && (
          <Text style={styles.securityNote}>
            Your payment information is encrypted and secure. We never store your card details.
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleCreatePaymentMethod}
          disabled={isDisabled}
          loading={processingPayment}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {processingPayment ? 'Processing...' : 'Add Payment Method'}
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 4,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  cardFieldContainer: {
    marginVertical: 16,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  securityNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
  submitButtonContent: {
    height: 48,
  },
});

export default PaymentCardForm;