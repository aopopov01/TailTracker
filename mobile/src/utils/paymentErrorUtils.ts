import { Alert } from 'react-native';
import { StripeError } from '@stripe/stripe-react-native';
import { PaymentError, StripePaymentService } from '../services/StripePaymentService';

/**
 * Utility functions for handling payment errors throughout the app
 */

export class PaymentErrorUtils {
  private static paymentService = StripePaymentService.getInstance();

  /**
   * Show a user-friendly alert for payment errors
   */
  static showPaymentAlert(error: StripeError | PaymentError | string, onRetry?: () => void): void {
    let parsedError: PaymentError;

    if (typeof error === 'string') {
      parsedError = {
        code: 'unknown_error',
        message: error,
        type: 'api_error',
      };
    } else if ('code' in error && 'message' in error && 'type' in error) {
      parsedError = error as PaymentError;
    } else {
      parsedError = this.paymentService.parseStripeError(error as StripeError);
    }

    const buttons = [
      { text: 'OK', style: 'default' as const },
    ];

    if (onRetry) {
      buttons.unshift({ text: 'Try Again', onPress: onRetry });
    }

    Alert.alert(
      this.getErrorTitle(parsedError.type),
      parsedError.message,
      buttons
    );
  }

  /**
   * Get user-friendly title for error type
   */
  static getErrorTitle(type: PaymentError['type']): string {
    switch (type) {
      case 'card_error':
        return 'Card Error';
      case 'validation_error':
        return 'Invalid Information';
      case 'authentication_error':
        return 'Authentication Required';
      case 'api_error':
      default:
        return 'Payment Error';
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: PaymentError | StripeError): boolean {
    const retryableCodes = [
      'processing_error',
      'api_connection_error',
      'rate_limit_error',
      'authentication_required',
    ];

    const errorCode = 'code' in error ? error.code : '';
    return retryableCodes.includes(errorCode);
  }

  /**
   * Get quick action suggestion for error
   */
  static getQuickActionSuggestion(error: PaymentError): string {
    const suggestions: Record<string, string> = {
      'card_declined': 'Try a different payment method',
      'insufficient_funds': 'Check your account balance',
      'incorrect_cvc': 'Check your security code',
      'expired_card': 'Use a different card',
      'incorrect_number': 'Double-check your card number',
      'processing_error': 'Please try again',
      'authentication_required': 'Complete verification',
      'api_connection_error': 'Check your internet connection',
    };

    return suggestions[error.code] || 'Please try again or contact support';
  }

  /**
   * Handle subscription creation errors with specific messaging
   */
  static handleSubscriptionError(error: any, onRetry?: () => void): void {
    if (error?.code === 'setup_intent_authentication_failure') {
      Alert.alert(
        'Payment Verification Failed',
        'We couldn\'t verify your payment method. This might be due to:\n\n• 3D Secure authentication failure\n• Bank declining the verification\n• Network connectivity issues\n\nPlease try a different payment method or contact your bank.',
        [
          { text: 'Try Different Method', onPress: onRetry },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (error?.code === 'payment_intent_authentication_failure') {
      Alert.alert(
        'Payment Authentication Failed',
        'Your payment requires additional authentication. Please complete the verification process and try again.',
        [
          { text: 'Try Again', onPress: onRetry },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    this.showPaymentAlert(error, onRetry);
  }

  /**
   * Handle payment method addition errors
   */
  static handlePaymentMethodError(error: any, onRetry?: () => void): void {
    if (error?.code === 'card_declined') {
      Alert.alert(
        'Card Declined',
        'Your card was declined. This could be due to:\n\n• Insufficient funds\n• Card restrictions\n• Security measures\n\nPlease try a different payment method or contact your bank.',
        [
          { text: 'Try Different Card', onPress: onRetry },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    this.showPaymentAlert(error, onRetry);
  }

  /**
   * Handle billing portal errors
   */
  static handleBillingPortalError(error: any): void {
    Alert.alert(
      'Billing Portal Error',
      'We couldn\'t open the billing portal at this time. Please try again later or contact support.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Show connection error alert
   */
  static showConnectionError(onRetry?: () => void): void {
    Alert.alert(
      'Connection Error',
      'We\'re having trouble connecting to our payment service. Please check your internet connection and try again.',
      [
        { text: 'Try Again', onPress: onRetry },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  /**
   * Show maintenance alert
   */
  static showMaintenanceAlert(): void {
    Alert.alert(
      'Service Temporarily Unavailable',
      'Our payment service is temporarily unavailable for maintenance. Please try again in a few minutes.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Log error for debugging (in development)
   */
  static logError(error: any, context: string): void {
    if (__DEV__) {
      console.group(`Payment Error - ${context}`);
      console.error('Error:', error);
      console.error('Error Code:', error?.code);
      console.error('Error Message:', error?.message);
      console.error('Error Type:', error?.type);
      console.error('Decline Code:', error?.declineCode);
      console.groupEnd();
    }
  }

  /**
   * Create a user-friendly error message from raw error
   */
  static createUserFriendlyMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      // Replace technical terms with user-friendly language
      let message = error.message;
      
      message = message.replace(/payment_intent/gi, 'payment');
      message = message.replace(/setup_intent/gi, 'payment method setup');
      message = message.replace(/customer/gi, 'account');
      message = message.replace(/API/gi, 'service');
      
      return message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Determine if error should trigger a specific UI flow
   */
  static shouldShowErrorComponent(error: PaymentError): boolean {
    const componentErrorTypes = [
      'card_error',
      'validation_error',
      'authentication_error',
    ];

    return componentErrorTypes.includes(error.type);
  }

  /**
   * Get error severity level
   */
  static getErrorSeverity(error: PaymentError): 'low' | 'medium' | 'high' {
    const highSeverityErrors = [
      'card_declined',
      'authentication_required',
      'setup_intent_authentication_failure',
    ];

    const mediumSeverityErrors = [
      'incorrect_cvc',
      'expired_card',
      'insufficient_funds',
    ];

    if (highSeverityErrors.includes(error.code)) {
      return 'high';
    } else if (mediumSeverityErrors.includes(error.code)) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

export default PaymentErrorUtils;