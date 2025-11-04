/**
 * TailTracker Payment Error Utilities
 * Comprehensive error handling for payment operations
 */

// Payment error codes and types
export enum PaymentErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Authentication/Authorization
  INVALID_API_KEY = 'INVALID_API_KEY',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Card errors
  CARD_DECLINED = 'CARD_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_CARD = 'INVALID_CARD',
  EXPIRED_CARD = 'EXPIRED_CARD',
  INVALID_CVC = 'INVALID_CVC',
  PROCESSING_ERROR = 'PROCESSING_ERROR',

  // Subscription errors
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  INVALID_PRODUCT = 'INVALID_PRODUCT',

  // Purchase validation
  RECEIPT_VALIDATION_FAILED = 'RECEIPT_VALIDATION_FAILED',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  INVALID_PURCHASE = 'INVALID_PURCHASE',

  // Store errors
  APP_STORE_ERROR = 'APP_STORE_ERROR',
  PLAY_STORE_ERROR = 'PLAY_STORE_ERROR',
  STORE_CONNECTION_FAILED = 'STORE_CONNECTION_FAILED',

  // RevenueCat errors
  REVENUECAT_ERROR = 'REVENUECAT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // Stripe errors
  STRIPE_ERROR = 'STRIPE_ERROR',
  PAYMENT_INTENT_FAILED = 'PAYMENT_INTENT_FAILED',
}

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
  debugInfo?: any;
}

// User-friendly error messages
const errorMessages: Record<
  PaymentErrorCode,
  {
    message: string;
    userMessage: string;
    recoverable: boolean;
    retryable: boolean;
  }
> = {
  [PaymentErrorCode.UNKNOWN_ERROR]: {
    message: 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again.',
    recoverable: true,
    retryable: true,
  },
  [PaymentErrorCode.NETWORK_ERROR]: {
    message: 'Network connection failed',
    userMessage: 'Please check your internet connection and try again.',
    recoverable: true,
    retryable: true,
  },
  [PaymentErrorCode.SERVICE_UNAVAILABLE]: {
    message: 'Payment service is temporarily unavailable',
    userMessage:
      'Payment services are temporarily unavailable. Please try again later.',
    recoverable: true,
    retryable: true,
  },
  [PaymentErrorCode.CARD_DECLINED]: {
    message: 'Card was declined',
    userMessage:
      'Your card was declined. Please try a different payment method.',
    recoverable: true,
    retryable: false,
  },
  [PaymentErrorCode.INSUFFICIENT_FUNDS]: {
    message: 'Insufficient funds',
    userMessage:
      'Your card has insufficient funds. Please try a different payment method.',
    recoverable: true,
    retryable: false,
  },
  [PaymentErrorCode.INVALID_CARD]: {
    message: 'Invalid card details',
    userMessage: 'Please check your card details and try again.',
    recoverable: true,
    retryable: false,
  },
  [PaymentErrorCode.EXPIRED_CARD]: {
    message: 'Card has expired',
    userMessage:
      'Your card has expired. Please use a different payment method.',
    recoverable: true,
    retryable: false,
  },
  [PaymentErrorCode.INVALID_CVC]: {
    message: 'Invalid security code',
    userMessage: 'Please check your card security code and try again.',
    recoverable: true,
    retryable: false,
  },
  [PaymentErrorCode.SUBSCRIPTION_NOT_FOUND]: {
    message: 'Subscription not found',
    userMessage: "We couldn't find your subscription. Please contact support.",
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.SUBSCRIPTION_CANCELED]: {
    message: 'Subscription has been canceled',
    userMessage:
      'Your subscription has been canceled. You can resubscribe anytime.',
    recoverable: true,
    retryable: false,
  },
  [PaymentErrorCode.PRODUCT_NOT_FOUND]: {
    message: 'Product not found',
    userMessage:
      'The selected plan is not available. Please try a different option.',
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.APP_STORE_ERROR]: {
    message: 'App Store connection failed',
    userMessage: 'Cannot connect to the App Store. Please try again later.',
    recoverable: true,
    retryable: true,
  },
  [PaymentErrorCode.PLAY_STORE_ERROR]: {
    message: 'Google Play Store connection failed',
    userMessage: 'Cannot connect to Google Play. Please try again later.',
    recoverable: true,
    retryable: true,
  },
  [PaymentErrorCode.RECEIPT_VALIDATION_FAILED]: {
    message: 'Receipt validation failed',
    userMessage: "We couldn't validate your purchase. Please contact support.",
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.REVENUECAT_ERROR]: {
    message: 'RevenueCat service error',
    userMessage: 'Payment service error. Please try again.',
    recoverable: true,
    retryable: true,
  },
  [PaymentErrorCode.STRIPE_ERROR]: {
    message: 'Stripe payment processing error',
    userMessage: 'Payment processing failed. Please try again.',
    recoverable: true,
    retryable: true,
  },
  // Add defaults for other error codes
  [PaymentErrorCode.INVALID_API_KEY]: {
    message: 'Invalid API key',
    userMessage: 'Configuration error. Please contact support.',
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.UNAUTHORIZED]: {
    message: 'Unauthorized request',
    userMessage: 'Authentication error. Please log in again.',
    recoverable: true,
    retryable: false,
  },
  [PaymentErrorCode.ACCESS_DENIED]: {
    message: 'Access denied',
    userMessage: "You don't have permission to perform this action.",
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.PROCESSING_ERROR]: {
    message: 'Payment processing error',
    userMessage: 'Payment processing failed. Please try again.',
    recoverable: true,
    retryable: true,
  },
  [PaymentErrorCode.SUBSCRIPTION_EXPIRED]: {
    message: 'Subscription expired',
    userMessage: 'Your subscription has expired. Please renew to continue.',
    recoverable: true,
    retryable: false,
  },
  [PaymentErrorCode.INVALID_PRODUCT]: {
    message: 'Invalid product configuration',
    userMessage: 'This subscription plan is not available.',
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.DUPLICATE_TRANSACTION]: {
    message: 'Duplicate transaction detected',
    userMessage: 'This transaction has already been processed.',
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.INVALID_PURCHASE]: {
    message: 'Invalid purchase data',
    userMessage: 'Purchase validation failed. Please contact support.',
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.STORE_CONNECTION_FAILED]: {
    message: 'Store connection failed',
    userMessage:
      'Cannot connect to the app store. Please check your connection.',
    recoverable: true,
    retryable: true,
  },
  [PaymentErrorCode.CONFIGURATION_ERROR]: {
    message: 'Configuration error',
    userMessage: 'Service configuration error. Please contact support.',
    recoverable: false,
    retryable: false,
  },
  [PaymentErrorCode.PAYMENT_INTENT_FAILED]: {
    message: 'Payment intent failed',
    userMessage: 'Payment setup failed. Please try again.',
    recoverable: true,
    retryable: true,
  },
};

// Error creation utilities
export function createPaymentError(
  code: PaymentErrorCode,
  debugInfo?: any,
  customMessage?: string
): PaymentError {
  const errorInfo =
    errorMessages[code] || errorMessages[PaymentErrorCode.UNKNOWN_ERROR];

  return {
    code,
    message: customMessage || errorInfo.message,
    userMessage: errorInfo.userMessage,
    recoverable: errorInfo.recoverable,
    retryable: errorInfo.retryable,
    debugInfo,
  };
}

// Map platform-specific errors to our error codes
export function mapRevenueCatError(error: any): PaymentError {
  const errorCode = error.code || error.userInfo?.code;

  switch (errorCode) {
    case 'NETWORK_ERROR':
      return createPaymentError(PaymentErrorCode.NETWORK_ERROR, error);
    case 'PURCHASE_CANCELLED':
      return createPaymentError(PaymentErrorCode.SUBSCRIPTION_CANCELED, error);
    case 'STORE_PROBLEM':
      return createPaymentError(PaymentErrorCode.APP_STORE_ERROR, error);
    case 'PURCHASE_NOT_ALLOWED':
      return createPaymentError(PaymentErrorCode.ACCESS_DENIED, error);
    case 'PURCHASE_INVALID':
      return createPaymentError(PaymentErrorCode.INVALID_PURCHASE, error);
    case 'PRODUCT_NOT_AVAILABLE':
      return createPaymentError(PaymentErrorCode.PRODUCT_NOT_FOUND, error);
    case 'RECEIPT_ALREADY_IN_USE':
      return createPaymentError(PaymentErrorCode.DUPLICATE_TRANSACTION, error);
    default:
      return createPaymentError(PaymentErrorCode.REVENUECAT_ERROR, error);
  }
}

export function mapStripeError(error: any): PaymentError {
  const type = error.type;
  const code = error.code;

  switch (type) {
    case 'card_error':
      switch (code) {
        case 'card_declined':
          return createPaymentError(PaymentErrorCode.CARD_DECLINED, error);
        case 'insufficient_funds':
          return createPaymentError(PaymentErrorCode.INSUFFICIENT_FUNDS, error);
        case 'invalid_number':
        case 'invalid_expiry_month':
        case 'invalid_expiry_year':
          return createPaymentError(PaymentErrorCode.INVALID_CARD, error);
        case 'invalid_cvc':
          return createPaymentError(PaymentErrorCode.INVALID_CVC, error);
        case 'expired_card':
          return createPaymentError(PaymentErrorCode.EXPIRED_CARD, error);
        default:
          return createPaymentError(PaymentErrorCode.STRIPE_ERROR, error);
      }
    case 'validation_error':
      return createPaymentError(PaymentErrorCode.INVALID_CARD, error);
    case 'api_connection_error':
      return createPaymentError(PaymentErrorCode.NETWORK_ERROR, error);
    case 'api_error':
      return createPaymentError(PaymentErrorCode.SERVICE_UNAVAILABLE, error);
    case 'authentication_error':
      return createPaymentError(PaymentErrorCode.INVALID_API_KEY, error);
    case 'rate_limit_error':
      return createPaymentError(PaymentErrorCode.SERVICE_UNAVAILABLE, error);
    default:
      return createPaymentError(PaymentErrorCode.STRIPE_ERROR, error);
  }
}

// Error handling utilities
export function isRetryableError(error: PaymentError): boolean {
  return error.retryable;
}

export function isRecoverableError(error: PaymentError): boolean {
  return error.recoverable;
}

export function getRetryDelay(
  attemptNumber: number,
  baseDelay: number = 1000
): number {
  // Exponential backoff with jitter
  const delay = baseDelay * Math.pow(2, attemptNumber - 1);
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, 30000); // Cap at 30 seconds
}

// Error logging and reporting
export function logPaymentError(error: PaymentError, context?: string): void {
  console.error('Payment Error:', {
    code: error.code,
    message: error.message,
    context,
    debugInfo: error.debugInfo,
    timestamp: new Date().toISOString(),
  });
}

// Recovery suggestions
export function getRecoverySuggestions(error: PaymentError): string[] {
  const suggestions: string[] = [];

  switch (error.code) {
    case PaymentErrorCode.NETWORK_ERROR:
      suggestions.push('Check your internet connection');
      suggestions.push('Try switching between Wi-Fi and mobile data');
      break;
    case PaymentErrorCode.CARD_DECLINED:
    case PaymentErrorCode.INSUFFICIENT_FUNDS:
      suggestions.push('Try a different payment method');
      suggestions.push('Contact your bank if the issue persists');
      break;
    case PaymentErrorCode.INVALID_CARD:
      suggestions.push('Double-check your card details');
      suggestions.push('Ensure your card is not expired');
      break;
    case PaymentErrorCode.APP_STORE_ERROR:
    case PaymentErrorCode.PLAY_STORE_ERROR:
      suggestions.push('Check your app store connection');
      suggestions.push('Sign out and back into your app store account');
      break;
    case PaymentErrorCode.SERVICE_UNAVAILABLE:
      suggestions.push('Try again in a few minutes');
      suggestions.push('Check our status page for service updates');
      break;
    default:
      suggestions.push('Try again later');
      suggestions.push('Contact support if the issue persists');
  }

  return suggestions;
}
