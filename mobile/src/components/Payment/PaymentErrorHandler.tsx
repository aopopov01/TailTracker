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
import { useTailTrackerModal } from '../../hooks/useTailTrackerModal';
import { PaymentError } from '../../services/StripePaymentService';
import { TailTrackerModal } from '../UI/TailTrackerModal';

interface PaymentErrorHandlerProps {
  error: PaymentError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showSuggestions?: boolean;
}

export const PaymentErrorHandler: React.FC<PaymentErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showSuggestions = true,
}) => {
  const { modalConfig, showModal, hideModal, showInfo } = useTailTrackerModal();
  if (!error) return null;

  const paymentError = typeof error === 'string' 
    ? { code: 'unknown_error', message: error, type: 'api_error' as const }
    : error;

  const getErrorIcon = (type: PaymentError['type']) => {
    switch (type) {
      case 'card_error':
        return 'credit-card-off';
      case 'validation_error':
        return 'alert-circle';
      case 'authentication_error':
        return 'shield-alert';
      default:
        return 'alert';
    }
  };

  const getErrorColor = (type: PaymentError['type']) => {
    switch (type) {
      case 'card_error':
        return '#F44336';
      case 'validation_error':
        return '#FF9800';
      case 'authentication_error':
        return '#9C27B0';
      default:
        return '#F44336';
    }
  };

  const getSuggestions = (code: string, type: PaymentError['type']): string[] => {
    const suggestions: Record<string, string[]> = {
      // Card errors
      'card_declined': [
        'Try a different payment method',
        'Contact your bank to authorize the payment',
        'Check if your card supports international transactions',
        'Ensure sufficient funds are available'
      ],
      'insufficient_funds': [
        'Check your account balance',
        'Try a different payment method',
        'Contact your bank for assistance'
      ],
      'incorrect_cvc': [
        'Check the 3-digit code on the back of your card',
        'For American Express, use the 4-digit code on the front'
      ],
      'expired_card': [
        'Use a different payment method',
        'Contact your bank to get a new card'
      ],
      'incorrect_number': [
        'Double-check your card number',
        'Make sure you\'re entering all digits correctly'
      ],
      'processing_error': [
        'Wait a moment and try again',
        'Check your internet connection',
        'Try a different payment method'
      ],
      
      // Authentication errors
      'authentication_required': [
        'Complete the verification process',
        'Check for SMS or email verification codes',
        'Ensure you have a stable internet connection'
      ],
      'setup_intent_authentication_failure': [
        'Try adding your payment method again',
        'Use a different browser or clear cache',
        'Contact your bank if the issue persists'
      ],
      'payment_intent_authentication_failure': [
        'Complete the 3D Secure verification',
        'Check for popup blockers that might prevent verification',
        'Try a different payment method'
      ],
      
      // General errors
      'api_connection_error': [
        'Check your internet connection',
        'Try again in a few moments',
        'Contact support if the issue persists'
      ],
      'rate_limit_error': [
        'Wait a moment before trying again',
        'Too many requests were made in a short time'
      ]
    };

    return suggestions[code] || [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact our support team if the issue persists'
    ];
  };

  const suggestions = showSuggestions ? getSuggestions(paymentError.code, paymentError.type) : [];

  return (
    <>
      <Card style={[styles.container, { borderLeftColor: getErrorColor(paymentError.type) }]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: getErrorColor(paymentError.type) + '20' }]}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>
          <Title style={[styles.title, { color: getErrorColor(paymentError.type) }]}>
            Payment Error
          </Title>
        </View>

        <Text style={styles.message}>{paymentError.message}</Text>

        {paymentError.declineCode && (
          <Text style={styles.declineCode}>
            Decline Code: {paymentError.declineCode}
          </Text>
        )}

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>What you can try:</Text>
            {suggestions.map((suggestion, index) => (
              <List.Item
                key={index}
                title={suggestion}
                left={(props) => (
                  <List.Icon 
                    {...props} 
                    icon="lightbulb-outline" 
                    color="#FFC107" 
                  />
                )}
                titleStyle={styles.suggestionText}
                style={styles.suggestionItem}
              />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          {showRetry && onRetry && (
            <Button
              mode="contained"
              onPress={onRetry}
              style={[styles.button, styles.retryButton]}
              contentStyle={styles.buttonContent}
            >
              Try Again
            </Button>
          )}

          {onDismiss && (
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={[styles.button, styles.dismissButton]}
              contentStyle={styles.buttonContent}
            >
              Dismiss
            </Button>
          )}

          <Button
            mode="text"
            onPress={() => showInfo(
              'Contact Support',
              'If you continue to experience issues, please contact our support team with error code: ' + paymentError.code,
              'help-circle'
            )}
            style={styles.button}
          >
            Contact Support
          </Button>
        </View>
      </Card.Content>
    </Card>
    <TailTrackerModal
      visible={modalConfig.visible}
      onClose={modalConfig.actions?.[0]?.onPress || hideModal}
      title={modalConfig.title}
      message={modalConfig.message}
      type={modalConfig.type}
      actions={modalConfig.actions}
      icon={modalConfig.icon}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 4,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  declineCode: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  suggestionsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  suggestionItem: {
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 18,
  },
  actions: {
    marginTop: 16,
  },
  button: {
    marginVertical: 4,
  },
  retryButton: {
    backgroundColor: '#6200EE',
  },
  dismissButton: {
    borderColor: '#666',
  },
  buttonContent: {
    height: 40,
  },
});

export default PaymentErrorHandler;