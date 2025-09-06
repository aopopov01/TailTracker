import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { errorRecoveryService } from '../../services/ErrorRecoveryService';
import { offlineQueueManager } from '../../services/OfflineQueueManager';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isRetrying: boolean;
  retryCount: number;
  networkStatus: {
    isConnected: boolean;
    type: string;
  };
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: (string | number)[];
  enableRetry?: boolean;
  maxRetries?: number;
  showNetworkStatus?: boolean;
  criticalFlow?: boolean;
  logErrors?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout;
  private networkUnsubscribe?: () => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      isRetrying: false,
      retryCount: 0,
      networkStatus: {
        isConnected: false,
        type: 'unknown',
      },
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error
    if (this.props.logErrors !== false) {
      this.logError(error, errorInfo);
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidMount() {
    // Monitor network status if needed
    if (this.props.showNetworkStatus) {
      this.setupNetworkMonitoring();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary when resetKeys change
    if (this.props.resetOnPropsChange && this.props.resetKeys && prevProps.resetKeys) {
      const resetKeysChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      
      if (resetKeysChanged && this.state.hasError) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
  }

  private setupNetworkMonitoring() {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      this.setState({
        networkStatus: {
          isConnected: state.isConnected ?? false,
          type: state.type,
        },
      });
    });
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorLog = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        timestamp: new Date().toISOString(),
        networkStatus: this.state.networkStatus,
        retryCount: this.state.retryCount,
        criticalFlow: this.props.criticalFlow,
        userAgent: navigator.userAgent,
      };

      // Store error log locally
      const existingLogs = await AsyncStorage.getItem('@tailtracker:error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push(errorLog);

      // Keep only last 50 error logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      await AsyncStorage.setItem('@tailtracker:error_logs', JSON.stringify(logs));

      // Queue error report for sending to server when online
      if (this.props.criticalFlow) {
        await offlineQueueManager.enqueueAction(
          'ERROR_REPORT',
          errorLog,
          {
            priority: 'high',
            requiresAuthentication: false,
          }
        );
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      isRetrying: false,
      retryCount: 0,
    });
  };

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      Alert.alert(
        'Maximum Retries Reached',
        'The operation has failed multiple times. Please check your connection and try again later.',
        [{ text: 'OK' }]
      );
      return;
    }

    this.setState({
      isRetrying: true,
      retryCount: this.state.retryCount + 1,
    });

    // Reset error boundary after a short delay
    this.retryTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 1000);
  };

  private renderNetworkStatus() {
    if (!this.props.showNetworkStatus) {
      return null;
    }

    const { networkStatus } = this.state;
    const statusColor = networkStatus.isConnected ? '#4CAF50' : '#F44336';
    const statusText = networkStatus.isConnected 
      ? `Connected (${networkStatus.type})` 
      : 'Offline';

    return (
      <View style={[styles.networkStatus, { backgroundColor: statusColor }]}>
        <Text style={styles.networkStatusText}>{statusText}</Text>
      </View>
    );
  }

  private renderDefaultErrorFallback() {
    const { error, isRetrying, retryCount, networkStatus } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    return (
      <ScrollView contentContainerStyle={styles.errorContainer}>
        {this.renderNetworkStatus()}
        
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>
            {this.props.criticalFlow ? 'Critical Error' : 'Something went wrong'}
          </Text>
          
          <Text style={styles.errorMessage}>
            {this.getErrorMessage(error)}
          </Text>

          {!networkStatus.isConnected && (
            <View style={styles.offlineNotice}>
              <Text style={styles.offlineText}>
                You're currently offline. Some features may be limited.
              </Text>
            </View>
          )}

          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailsTitle}>Technical Details:</Text>
            <Text style={styles.errorDetailsText}>
              {error?.name}: {error?.message}
            </Text>
            
            {retryCount > 0 && (
              <Text style={styles.retryInfo}>
                Retry attempts: {retryCount}/{maxRetries}
              </Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            {this.props.enableRetry !== false && retryCount < maxRetries && (
              <TouchableOpacity
                style={[styles.button, styles.retryButton, isRetrying && styles.disabledButton]}
                onPress={this.handleRetry}
                disabled={isRetrying}
              >
                <Text style={styles.buttonText}>
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={this.resetErrorBoundary}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {this.props.criticalFlow && (
            <View style={styles.criticalFlowInfo}>
              <Text style={styles.criticalFlowText}>
                This is a critical feature. The error has been logged and will be investigated.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  private getErrorMessage(error?: Error): string {
    if (!error) return 'An unknown error occurred';

    // Provide user-friendly messages for common errors
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (error.message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Your session has expired. Please sign in again.';
    }

    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'You don\'t have permission to perform this action.';
    }

    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return 'The requested resource could not be found.';
    }

    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'A server error occurred. Our team has been notified.';
    }

    // Return original message for other errors
    return error.message;
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleRetry);
      }

      return this.renderDefaultErrorFallback();
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  networkStatus: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  networkStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  offlineNotice: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  errorDetails: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  retryInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#2196f3',
  },
  resetButton: {
    backgroundColor: '#757575',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  criticalFlowInfo: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  criticalFlowText: {
    fontSize: 12,
    color: '#d32f2f',
    textAlign: 'center',
  },
});

export default ErrorBoundary;