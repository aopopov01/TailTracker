import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import ErrorBoundary, { ErrorBoundaryProps } from './ErrorBoundary';
import { offlineQueueManager } from '../../services/OfflineQueueManager';

export interface CriticalFlowErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'criticalFlow' | 'fallback'> {
  flowName: string;
  onFallbackAction?: () => void;
  fallbackActionLabel?: string;
  emergencyContact?: {
    email: string;
    phone: string;
  };
}

/**
 * Enhanced error boundary specifically for critical user flows
 * like lost pet alerts, emergency contacts, and authentication
 */
export function CriticalFlowErrorBoundary({
  flowName,
  onFallbackAction,
  fallbackActionLabel = 'Use Offline Mode',
  emergencyContact,
  children,
  ...errorBoundaryProps
}: CriticalFlowErrorBoundaryProps) {
  
  const handleEmergencyContact = () => {
    if (!emergencyContact) return;

    Alert.alert(
      'Emergency Contact',
      `If this is an emergency regarding a lost pet, please contact us directly:\n\nEmail: ${emergencyContact.email}\nPhone: ${emergencyContact.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            // In a real app, you would use Linking.openURL(`tel:${emergencyContact.phone}`)
            console.log('Calling emergency contact:', emergencyContact.phone);
          },
        },
        {
          text: 'Email',
          onPress: () => {
            // In a real app, you would use Linking.openURL(`mailto:${emergencyContact.email}`)
            console.log('Emailing emergency contact:', emergencyContact.email);
          },
        },
      ]
    );
  };

  const renderCriticalFlowFallback = (error: Error, retry: () => void) => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Critical Feature Unavailable</Text>
          <Text style={styles.flowName}>{flowName}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.message}>
            We're experiencing technical difficulties with this critical feature. 
            Your data is safe and we're working to resolve this issue.
          </Text>

          <View style={styles.errorInfo}>
            <Text style={styles.errorTitle}>What happened?</Text>
            <Text style={styles.errorText}>
              {getErrorDescription(error)}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={retry}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {onFallbackAction && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onFallbackAction}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  {fallbackActionLabel}
                </Text>
              </TouchableOpacity>
            )}

            {emergencyContact && (
              <TouchableOpacity
                style={[styles.button, styles.emergencyButton]}
                onPress={handleEmergencyContact}
              >
                <Text style={styles.buttonText}>Emergency Contact</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Error ID: {generateErrorId(error)}
            </Text>
            <Text style={styles.footerText}>
              Please include this ID when contacting support
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ErrorBoundary
      {...errorBoundaryProps}
      criticalFlow={true}
      fallback={renderCriticalFlowFallback}
      enableRetry={true}
      maxRetries={5}
      showNetworkStatus={true}
      logErrors={true}
    >
      {children}
    </ErrorBoundary>
  );
}

function getErrorDescription(error: Error): string {
  if (error.message.includes('Network Error') || error.message.includes('fetch')) {
    return 'Unable to connect to our servers. Please check your internet connection and try again.';
  }

  if (error.message.includes('timeout')) {
    return 'The request is taking longer than expected. This might be due to a poor connection.';
  }

  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    return 'Your session has expired for security reasons. Please sign in again.';
  }

  if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
    return 'Our servers are experiencing technical difficulties. Our team has been automatically notified.';
  }

  return 'An unexpected error occurred. Our technical team has been notified and is investigating.';
}

function generateErrorId(error: Error): string {
  const timestamp = Date.now().toString(36);
  const errorHash = btoa(error.message + error.stack).slice(0, 8);
  return `ERR-${timestamp}-${errorHash}`.toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#d32f2f',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  flowName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196f3',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  emergencyButton: {
    backgroundColor: '#ff5722',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2196f3',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

// Specific error boundaries for different critical flows

export function LostPetAlertErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CriticalFlowErrorBoundary
      flowName="Lost Pet Alert System"
      onFallbackAction={() => {
        // Navigate to offline lost pet form or show emergency contact
        console.log('Fallback to offline lost pet reporting');
      }}
      fallbackActionLabel="Report Offline"
      emergencyContact={{
        email: 'emergency@tailtracker.com',
        phone: '+1-800-TAILTRACKER',
      }}
    >
      {children}
    </CriticalFlowErrorBoundary>
  );
}

export function AuthenticationErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CriticalFlowErrorBoundary
      flowName="User Authentication"
      onFallbackAction={() => {
        // Navigate to offline mode or guest access
        console.log('Fallback to offline mode');
      }}
      fallbackActionLabel="Continue Offline"
    >
      {children}
    </CriticalFlowErrorBoundary>
  );
}

export function VaccinationErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CriticalFlowErrorBoundary
      flowName="Vaccination Records"
      onFallbackAction={() => {
        // Save vaccination data locally
        console.log('Fallback to local storage');
      }}
      fallbackActionLabel="Save Locally"
    >
      {children}
    </CriticalFlowErrorBoundary>
  );
}

export function EmergencyContactErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CriticalFlowErrorBoundary
      flowName="Emergency Contacts"
      emergencyContact={{
        email: 'support@tailtracker.com',
        phone: '+1-800-TAILTRACKER',
      }}
    >
      {children}
    </CriticalFlowErrorBoundary>
  );
}