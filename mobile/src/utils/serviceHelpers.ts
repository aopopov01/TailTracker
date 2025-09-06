/**
 * TailTracker Service Layer Helpers
 * 
 * Standardized utilities for consistent service layer architecture.
 * Provides common patterns for error handling, API responses, and service operations.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * - Consistent error handling across all services
 * - Standardized response types and patterns
 * - Centralized logging and monitoring integration
 * - Type-safe service operations
 */

import { 
  ERROR_MESSAGES, 
  API_CONFIG, 
  ANALYTICS_CONFIG 
} from '../constants';
import { 
  ApiResponse, 
  AppError, 
  ErrorCategory, 
  ErrorSeverity,
  AsyncOperationState 
} from '../types';

// ===================================
// ERROR HANDLING UTILITIES
// ===================================

/**
 * Creates a standardized AppError with consistent structure
 */
export function createAppError(
  code: string,
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity = 'error',
  context?: Record<string, any>,
  originalError?: Error
): AppError {
  return {
    code,
    message,
    category,
    severity,
    context,
    stack: originalError?.stack || new Error().stack,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
    userId: context?.userId,
  };
}

/**
 * Maps common HTTP status codes to application errors
 */
export function mapHttpStatusToError(
  statusCode: number,
  message?: string,
  context?: Record<string, any>
): AppError {
  const baseContext = { statusCode, ...context };

  switch (statusCode) {
    case 400:
      return createAppError(
        'INVALID_REQUEST',
        message || 'The request was invalid or malformed',
        'validation',
        'warning',
        baseContext
      );
    
    case 401:
      return createAppError(
        'UNAUTHORIZED',
        message || ERROR_MESSAGES.SESSION_EXPIRED,
        'authentication',
        'warning',
        baseContext
      );
    
    case 403:
      return createAppError(
        'FORBIDDEN',
        message || ERROR_MESSAGES.PERMISSION_DENIED,
        'authorization',
        'warning',
        baseContext
      );
    
    case 404:
      return createAppError(
        'NOT_FOUND',
        message || 'The requested resource was not found',
        'business_logic',
        'warning',
        baseContext
      );
    
    case 409:
      return createAppError(
        'CONFLICT',
        message || 'The request conflicts with the current state',
        'business_logic',
        'warning',
        baseContext
      );
    
    case 422:
      return createAppError(
        'VALIDATION_ERROR',
        message || 'The request data failed validation',
        'validation',
        'warning',
        baseContext
      );
    
    case 429:
      return createAppError(
        'RATE_LIMITED',
        message || 'Too many requests. Please slow down.',
        'system',
        'warning',
        baseContext
      );
    
    case 500:
      return createAppError(
        'INTERNAL_SERVER_ERROR',
        message || 'An internal server error occurred',
        'system',
        'error',
        baseContext
      );
    
    case 502:
    case 503:
    case 504:
      return createAppError(
        'SERVICE_UNAVAILABLE',
        message || 'The service is temporarily unavailable',
        'network',
        'error',
        baseContext
      );
    
    default:
      return createAppError(
        'UNKNOWN_HTTP_ERROR',
        message || `HTTP ${statusCode}: ${ERROR_MESSAGES.UNKNOWN_ERROR}`,
        'network',
        'error',
        baseContext
      );
  }
}

/**
 * Maps JavaScript errors to application errors
 */
export function mapJavaScriptError(
  error: Error,
  context?: Record<string, any>
): AppError {
  const baseContext = { 
    errorName: error.name, 
    originalMessage: error.message,
    ...context 
  };

  // Network-related errors
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return createAppError(
      'NETWORK_ERROR',
      ERROR_MESSAGES.NETWORK_ERROR,
      'network',
      'error',
      baseContext,
      error
    );
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return createAppError(
      'TIMEOUT_ERROR',
      ERROR_MESSAGES.TIMEOUT_ERROR,
      'network',
      'warning',
      baseContext,
      error
    );
  }

  // Permission errors
  if (error.message.includes('permission') || error.message.includes('denied')) {
    return createAppError(
      'PERMISSION_ERROR',
      ERROR_MESSAGES.PERMISSION_DENIED,
      'authorization',
      'warning',
      baseContext,
      error
    );
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return createAppError(
      'VALIDATION_ERROR',
      error.message,
      'validation',
      'warning',
      baseContext,
      error
    );
  }

  // Default unknown error
  return createAppError(
    'UNKNOWN_ERROR',
    ERROR_MESSAGES.UNKNOWN_ERROR,
    'unknown',
    'error',
    baseContext,
    error
  );
}

// ===================================
// SERVICE OPERATION UTILITIES
// ===================================

/**
 * Standardized service operation result type
 */
export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: AppError;
  metadata?: {
    requestId: string;
    timestamp: string;
    duration: number;
  };
};

/**
 * Creates a successful service result
 */
export function createSuccessResult<T>(
  data: T,
  requestId?: string,
  duration?: number
): ServiceResult<T> {
  return {
    success: true,
    data,
    metadata: {
      requestId: requestId || generateRequestId(),
      timestamp: new Date().toISOString(),
      duration: duration || 0,
    },
  };
}

/**
 * Creates an error service result
 */
export function createErrorResult<T = any>(
  error: AppError,
  requestId?: string,
  duration?: number
): ServiceResult<T> {
  return {
    success: false,
    error,
    metadata: {
      requestId: requestId || generateRequestId(),
      timestamp: new Date().toISOString(),
      duration: duration || 0,
    },
  };
}

/**
 * Executes a service operation with standardized error handling and monitoring
 */
export async function executeServiceOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<ServiceResult<T>> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  try {
    // Add breadcrumb for debugging
    addBreadcrumb({
      category: 'service',
      message: `Starting ${operationName}`,
      level: 'info',
      data: { requestId, ...context },
    });

    const result = await operation();
    const duration = Date.now() - startTime;

    // Log successful operation
    addBreadcrumb({
      category: 'service',
      message: `Completed ${operationName}`,
      level: 'info',
      data: { requestId, duration, ...context },
    });

    return createSuccessResult(result, requestId, duration);

  } catch (error) {
    const duration = Date.now() - startTime;
    const appError = error instanceof Error 
      ? mapJavaScriptError(error, { operationName, requestId, ...context })
      : createAppError(
          'UNKNOWN_SERVICE_ERROR',
          ERROR_MESSAGES.UNKNOWN_ERROR,
          'unknown',
          'error',
          { operationName, requestId, ...context }
        );

    // Log error
    addBreadcrumb({
      category: 'service',
      message: `Failed ${operationName}`,
      level: 'error',
      data: { 
        requestId, 
        duration, 
        errorCode: appError.code,
        errorMessage: appError.message,
        ...context 
      },
    });

    // Report to error monitoring if critical
    if (appError.severity === 'critical' || appError.severity === 'error') {
      reportError(appError, { operationName, ...context });
    }

    return createErrorResult(appError, requestId, duration);
  }
}

/**
 * Retry wrapper for service operations with exponential backoff
 */
export async function executeWithRetry<T>(
  operation: () => Promise<ServiceResult<T>>,
  operationName: string,
  maxAttempts: number = API_CONFIG.MAX_RETRY_ATTEMPTS,
  baseDelay: number = API_CONFIG.RETRY_DELAY
): Promise<ServiceResult<T>> {
  let lastResult: ServiceResult<T> | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await operation();
    
    if (result.success) {
      if (attempt > 1) {
        // Log successful retry
        addBreadcrumb({
          category: 'retry',
          message: `${operationName} succeeded on attempt ${attempt}`,
          level: 'info',
          data: { attempt, maxAttempts },
        });
      }
      return result;
    }

    lastResult = result;
    
    // Don't retry on certain error types
    if (result.error && !shouldRetryError(result.error)) {
      break;
    }

    // Don't sleep on the last attempt
    if (attempt < maxAttempts) {
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      await sleep(delay);
      
      addBreadcrumb({
        category: 'retry',
        message: `Retrying ${operationName} (attempt ${attempt + 1}/${maxAttempts})`,
        level: 'warning',
        data: { attempt: attempt + 1, maxAttempts, delay },
      });
    }
  }

  // All attempts failed
  if (lastResult) {
    addBreadcrumb({
      category: 'retry',
      message: `${operationName} failed after ${maxAttempts} attempts`,
      level: 'error',
      data: { maxAttempts, finalError: lastResult.error?.code },
    });
  }

  return lastResult || createErrorResult(
    createAppError(
      'RETRY_EXHAUSTED',
      `Operation failed after ${maxAttempts} attempts`,
      'system',
      'error'
    )
  );
}

// ===================================
// ASYNC STATE MANAGEMENT
// ===================================

/**
 * Creates an initial async operation state
 */
export function createAsyncState<T = any>(): AsyncOperationState<T> {
  return {
    isLoading: false,
    isSuccess: false,
    retryCount: 0,
  };
}

/**
 * Updates async state for loading operation
 */
export function setAsyncLoading<T>(
  state: AsyncOperationState<T>,
  loadingMessage?: string
): AsyncOperationState<T> {
  return {
    ...state,
    isLoading: true,
    isSuccess: false,
    error: undefined,
    loadingMessage,
    lastAttempt: new Date().toISOString(),
  };
}

/**
 * Updates async state for successful operation
 */
export function setAsyncSuccess<T>(
  state: AsyncOperationState<T>,
  data: T
): AsyncOperationState<T> {
  return {
    ...state,
    isLoading: false,
    isSuccess: true,
    data,
    error: undefined,
    retryCount: 0,
  };
}

/**
 * Updates async state for failed operation
 */
export function setAsyncError<T>(
  state: AsyncOperationState<T>,
  error: string | AppError
): AsyncOperationState<T> {
  return {
    ...state,
    isLoading: false,
    isSuccess: false,
    error: typeof error === 'string' ? error : error.message,
    retryCount: state.retryCount + 1,
  };
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Generates a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determines if an error should be retried
 */
export function shouldRetryError(error: AppError): boolean {
  const retryableCategories: ErrorCategory[] = ['network', 'system'];
  const retryableCodes = [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR', 
    'SERVICE_UNAVAILABLE',
    'INTERNAL_SERVER_ERROR',
    'RATE_LIMITED'
  ];
  
  return (
    retryableCategories.includes(error.category) ||
    retryableCodes.includes(error.code)
  );
}

/**
 * Validates required fields in service input
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): AppError | null {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    return createAppError(
      'MISSING_REQUIRED_FIELDS',
      `Missing required fields: ${missingFields.join(', ')}`,
      'validation',
      'warning',
      { missingFields, providedFields: Object.keys(data) }
    );
  }

  return null;
}

/**
 * Sanitizes sensitive data from context before logging
 */
export function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'ssn', 'social', 'credit', 'card', 'account', 'pin', 'otp'
  ];
  
  const sanitized = { ...context };
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// ===================================
// INTEGRATION STUBS
// ===================================

/**
 * Adds debugging breadcrumb for development monitoring
 */
function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}): void {
  // Development breadcrumb logging - replace with monitoring service in production
  console.log(`[${breadcrumb.level.toUpperCase()}] ${breadcrumb.category}: ${breadcrumb.message}`, 
    breadcrumb.data ? sanitizeContext(breadcrumb.data) : '');
}

/**
 * Reports error for development monitoring
 */
function reportError(error: AppError, context?: Record<string, any>): void {
  // Development error reporting - replace with service like Sentry in production
  console.error(`[ERROR REPORT] ${error.code}: ${error.message}`, {
    ...error,
    context: context ? sanitizeContext(context) : undefined
  });
}