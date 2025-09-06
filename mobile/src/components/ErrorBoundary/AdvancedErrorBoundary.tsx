import React, { Component, ReactNode, ErrorInfo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
// AsyncStorage import removed - unused
import { deviceErrorHandler } from '../../services/DeviceErrorHandler';
import { errorMonitoring } from '../../services/ErrorMonitoringService';
import { globalErrorHandler } from '../../services/GlobalErrorHandler';
import { log } from '../../utils/Logger';

export interface AdvancedErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorClassification?: any;
  isRecovering: boolean;
  recoveryAttempted: boolean;
  showTechnicalDetails: boolean;
  userFeedback: string;
  canContactSupport: boolean;
  alternativeFlows: string[];
  recoveryOptions: RecoveryOption[];
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export interface RecoveryOption {
  id: string;
  title: string;
  description: string;
  action: () => Promise<void>;
  icon?: string;
  priority: 'high' | 'medium' | 'low';
  requiresNetwork?: boolean;
  requiresAuth?: boolean;
}

export interface AdvancedErrorBoundaryProps {
  children: ReactNode;
  context?: {
    screenName?: string;
    feature?: string;
    userAction?: string;
    criticalFlow?: boolean;
  };
  fallbackComponent?: React.ComponentType<{
    error: Error;
    retry: () => void;
    goBack: () => void;
    contactSupport: () => void;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo, classification: any) => void;
  onRecovery?: (successful: boolean, strategy: string) => void;
  enableAutomaticRecovery?: boolean;
  enableUserFeedback?: boolean;
  showAlternativeFlows?: boolean;
  customRecoveryOptions?: RecoveryOption[];
  theme?: 'light' | 'dark' | 'auto';
}

export class AdvancedErrorBoundary extends Component<
  AdvancedErrorBoundaryProps,
  AdvancedErrorBoundaryState
> {
  private recoveryTimeout?: NodeJS.Timeout;
  private animationTimeout?: NodeJS.Timeout;

  constructor(props: AdvancedErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      isRecovering: false,
      recoveryAttempted: false,
      showTechnicalDetails: false,
      userFeedback: '',
      canContactSupport: true,
      alternativeFlows: [],
      recoveryOptions: [],
      fadeAnim: new Animated.Value(0),
      slideAnim: new Animated.Value(50),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AdvancedErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      // Handle error with global error handler
      const result = await globalErrorHandler.handleError(error, {
        screenName: this.props.context?.screenName,
        component: 'AdvancedErrorBoundary',
        action: this.props.context?.userAction,
      });

      // Get error classification
      const errorClassification = result;

      // Determine recovery options
      const recoveryOptions = await this.generateRecoveryOptions(error, errorClassification);

      // Get alternative flows
      const alternativeFlows = await this.generateAlternativeFlows(error);

      this.setState({
        errorInfo,
        errorClassification,
        recoveryOptions,
        alternativeFlows,
      });

      // Call custom error handler
      this.props.onError?.(error, errorInfo, errorClassification);

      // Start entrance animation
      this.startEntranceAnimation();

      // Attempt automatic recovery if enabled
      if (this.props.enableAutomaticRecovery && result.recovered) {
        await this.attemptAutomaticRecovery();
      }
    } catch (handlingError) {
      log.error('Error in error boundary:', handlingError);
    }
  }

  componentWillUnmount() {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
  }

  private startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(this.state.fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(this.state.slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  private generateRecoveryOptions = async (
    error: Error,
    classification: any
  ): Promise<RecoveryOption[]> => {
    const options: RecoveryOption[] = [];

    // Add retry option
    options.push({
      id: 'retry',
      title: 'Try Again',
      description: 'Retry the last action',
      action: this.handleRetry,
      icon: 'refresh',
      priority: 'high',
    });

    // Add reload option
    options.push({
      id: 'reload',
      title: 'Reload Screen',
      description: 'Refresh the current screen',
      action: this.handleReload,
      icon: 'reload',
      priority: 'medium',
    });

    // Network-specific options
    if (this.isNetworkError(error)) {
      options.push({
        id: 'check_connection',
        title: 'Check Connection',
        description: 'Test your internet connection',
        action: this.handleCheckConnection,
        icon: 'wifi',
        priority: 'high',
        requiresNetwork: false,
      });

      options.push({
        id: 'retry_offline',
        title: 'Work Offline',
        description: 'Continue with cached data',
        action: this.handleWorkOffline,
        icon: 'cloud-offline',
        priority: 'medium',
      });
    }

    // Authentication-specific options
    if (this.isAuthError(error)) {
      options.push({
        id: 'sign_in',
        title: 'Sign In Again',
        description: 'Refresh your session',
        action: this.handleSignIn,
        icon: 'key',
        priority: 'high',
        requiresAuth: false,
      });
    }

    // Device-specific options
    const deviceHealth = deviceErrorHandler.getDeviceHealth();
    if (deviceHealth?.memoryUsage.critical) {
      options.push({
        id: 'free_memory',
        title: 'Free Memory',
        description: 'Clear app cache to free memory',
        action: this.handleFreeMemory,
        icon: 'memory',
        priority: 'medium',
      });
    }

    // Add custom recovery options
    if (this.props.customRecoveryOptions) {
      options.push(...this.props.customRecoveryOptions);
    }

    // Add fallback options
    options.push({
      id: 'go_back',
      title: 'Go Back',
      description: 'Return to previous screen',
      action: this.handleGoBack,
      icon: 'arrow-back',
      priority: 'low',
    });

    options.push({
      id: 'restart_app',
      title: 'Restart App',
      description: 'Close and reopen the app',
      action: this.handleRestartApp,
      icon: 'restart',
      priority: 'low',
    });

    return options.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  private generateAlternativeFlows = async (error: Error): Promise<string[]> => {
    const flows: string[] = [];
    const context = this.props.context;

    if (context?.feature === 'pet_profile') {
      flows.push('View pets without editing');
      flows.push('Browse pet photos');
      flows.push('Check vaccination reminders');
    } else if (context?.feature === 'lost_pet_alert') {
      flows.push('Create manual lost pet post');
      flows.push('Contact local shelters');
      flows.push('Share on social media');
    } else if (context?.feature === 'payment') {
      flows.push('Continue with free features');
      flows.push('Try payment later');
      flows.push('Contact billing support');
    }

    return flows;
  };

  private attemptAutomaticRecovery = async () => {
    this.setState({ isRecovering: true });

    this.recoveryTimeout = setTimeout(async () => {
      try {
        // Attempt to recover based on error type
        const recovered = await this.performRecovery();
        
        this.setState({
          isRecovering: false,
          recoveryAttempted: true,
        });

        if (recovered) {
          // Recovery successful, reset error boundary
          this.props.onRecovery?.(true, 'automatic');
          this.resetErrorBoundary();
        } else {
          this.props.onRecovery?.(false, 'automatic');
        }
      } catch (recoveryError) {
        this.setState({
          isRecovering: false,
          recoveryAttempted: true,
        });
        this.props.onRecovery?.(false, 'automatic');
      }
    }, 2000);
  };

  private performRecovery = async (): Promise<boolean> => {
    const { error, errorClassification } = this.state;
    
    if (!error || !errorClassification) return false;

    try {
      // Network errors: wait for connection
      if (this.isNetworkError(error)) {
        return await this.waitForConnection();
      }

      // Memory errors: free memory
      if (this.isMemoryError(error)) {
        await deviceErrorHandler.handleMemoryPressure();
        return true;
      }

      // Permission errors: request permissions
      if (this.isPermissionError(error)) {
        return await this.handlePermissionRecovery();
      }

      return false;
    } catch {
      return false;
    }
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorClassification: undefined,
      isRecovering: false,
      recoveryAttempted: false,
      showTechnicalDetails: false,
      userFeedback: '',
      fadeAnim: new Animated.Value(0),
      slideAnim: new Animated.Value(50),
    });
  };

  // Recovery action handlers
  private handleRetry = async () => {
    this.setState({ isRecovering: true });
    
    // Simulate retry delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.resetErrorBoundary();
  };

  private handleReload = async () => {
    this.setState({ isRecovering: true });
    
    // Clear any cached data for this screen
    await this.clearScreenCache();
    
    this.resetErrorBoundary();
  };

  private handleCheckConnection = async () => {
    Alert.alert(
      'Connection Check',
      'Testing your connection...',
      [
        {
          text: 'Settings',
          onPress: () => Linking.openSettings(),
        },
        {
          text: 'Retry',
          onPress: this.handleRetry,
        },
      ]
    );
  };

  private handleWorkOffline = async () => {
    // Enable offline mode
    this.resetErrorBoundary();
  };

  private handleSignIn = async () => {
    // Navigate to sign in screen
    // This would integrate with your navigation system
    Alert.alert('Sign In', 'Redirecting to sign in...');
  };

  private handleFreeMemory = async () => {
    this.setState({ isRecovering: true });
    
    try {
      await deviceErrorHandler.handleMemoryPressure();
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.resetErrorBoundary();
    } catch {
      this.setState({ isRecovering: false });
    }
  };

  private handleGoBack = async () => {
    // Navigate back
    // This would integrate with your navigation system
    this.resetErrorBoundary();
  };

  private handleRestartApp = async () => {
    Alert.alert(
      'Restart Required',
      'The app needs to restart to recover from this error.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Restart',
          onPress: () => {
            // This would trigger an app restart
            // Implementation depends on your app structure
          },
        },
      ]
    );
  };

  private handleContactSupport = async () => {
    const errorDetails = this.generateErrorReport();
    
    Alert.alert(
      'Contact Support',
      'Would you like to send an error report to our support team?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Report',
          onPress: () => this.sendErrorReport(errorDetails),
        },
      ]
    );
  };

  private handleFeedbackSubmit = async () => {
    const { error, userFeedback } = this.state;
    
    if (!userFeedback.trim()) {
      Alert.alert('Feedback Required', 'Please provide feedback about the error.');
      return;
    }

    try {
      await errorMonitoring.reportError(
        error!,
        {
          component: 'AdvancedErrorBoundary',
          action: `User Feedback: ${userFeedback}`,
        },
        'medium',
        ['user_feedback']
      );

      Alert.alert('Thank You', 'Your feedback has been submitted.');
      this.setState({ userFeedback: '' });
    } catch {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  // Helper methods
  private isNetworkError = (error: Error): boolean => {
    return /network|connection|fetch|timeout/i.test(error.message);
  };

  private isAuthError = (error: Error): boolean => {
    return /auth|unauthorized|forbidden|401|403/i.test(error.message);
  };

  private isMemoryError = (error: Error): boolean => {
    return /memory|out of memory|allocation/i.test(error.message);
  };

  private isPermissionError = (error: Error): boolean => {
    return /permission|denied|access/i.test(error.message);
  };

  private waitForConnection = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000);
      
      // This would use NetInfo to monitor connection
      // Simplified for example
      setTimeout(() => {
        clearTimeout(timeout);
        resolve(true);
      }, 3000);
    });
  };

  private handlePermissionRecovery = async (): Promise<boolean> => {
    // Handle permission recovery
    return false;
  };

  private clearScreenCache = async (): Promise<void> => {
    // Clear screen-specific cache
  };

  private generateErrorReport = (): string => {
    const { error, errorInfo, errorClassification } = this.state;
    
    return JSON.stringify({
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      errorInfo,
      classification: errorClassification,
      context: this.props.context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }, null, 2);
  };

  private sendErrorReport = async (report: string): Promise<void> => {
    // Send error report to support
    log.debug('Sending error report:', report);
  };

  private renderErrorScreen = () => {
    const { 
      error, 
      isRecovering, 
      showTechnicalDetails, 
      recoveryOptions,
      alternativeFlows,
      fadeAnim,
      slideAnim,
    } = this.state;

    return (
      <View style={styles.container}>
        <BlurView
          style={styles.blurBackground}
          blurType="light"
          blurAmount={10}
        />
        
        <Animated.View
          style={[
            styles.errorContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon and Title */}
            <View style={styles.headerSection}>
              <View style={styles.iconContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
              </View>
              
              <Text style={styles.errorTitle}>
                {this.props.context?.criticalFlow 
                  ? 'Critical Error Detected'
                  : 'Something Went Wrong'
                }
              </Text>
              
              <Text style={styles.errorSubtitle}>
                {this.getErrorMessage(error)}
              </Text>
            </View>

            {/* Recovery Status */}
            {isRecovering && (
              <View style={styles.recoverySection}>
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.recoveryCard}
                >
                  <Text style={styles.recoveryText}>
                    🔄 Attempting to recover...
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Recovery Options */}
            {recoveryOptions.length > 0 && (
              <View style={styles.optionsSection}>
                <Text style={styles.sectionTitle}>Recovery Options</Text>
                {recoveryOptions.slice(0, 4).map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      option.priority === 'high' && styles.highPriorityCard,
                    ]}
                    onPress={option.action}
                    disabled={isRecovering}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionIcon}>{this.getOptionIcon(option.icon)}</Text>
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Alternative Flows */}
            {this.props.showAlternativeFlows && alternativeFlows.length > 0 && (
              <View style={styles.alternativesSection}>
                <Text style={styles.sectionTitle}>What you can do instead</Text>
                {alternativeFlows.map((flow, index) => (
                  <View key={index} style={styles.alternativeItem}>
                    <Text style={styles.alternativeIcon}>💡</Text>
                    <Text style={styles.alternativeText}>{flow}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* User Feedback */}
            {this.props.enableUserFeedback && (
              <View style={styles.feedbackSection}>
                <Text style={styles.sectionTitle}>Help Us Improve</Text>
                <View style={styles.feedbackCard}>
                  <Text style={styles.feedbackPrompt}>
                    What were you trying to do when this error occurred?
                  </Text>
                  {/* TextInput would go here */}
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={this.handleFeedbackSubmit}
                  >
                    <Text style={styles.submitButtonText}>Submit Feedback</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Technical Details Toggle */}
            <TouchableOpacity
              style={styles.technicalToggle}
              onPress={() => this.setState({ 
                showTechnicalDetails: !showTechnicalDetails 
              })}
            >
              <Text style={styles.technicalToggleText}>
                {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
              </Text>
            </TouchableOpacity>

            {/* Technical Details */}
            {showTechnicalDetails && (
              <View style={styles.technicalSection}>
                <Text style={styles.technicalTitle}>Technical Information</Text>
                <View style={styles.technicalContent}>
                  <Text style={styles.technicalText}>
                    Error: {error?.name}
                  </Text>
                  <Text style={styles.technicalText}>
                    Message: {error?.message}
                  </Text>
                  <Text style={styles.technicalText}>
                    Screen: {this.props.context?.screenName || 'Unknown'}
                  </Text>
                  <Text style={styles.technicalText}>
                    Feature: {this.props.context?.feature || 'Unknown'}
                  </Text>
                </View>
              </View>
            )}

            {/* Support Contact */}
            <View style={styles.supportSection}>
              <TouchableOpacity
                style={styles.supportButton}
                onPress={this.handleContactSupport}
              >
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </TouchableOpacity>
              
              <Text style={styles.supportNote}>
                If this problem persists, our support team can help resolve it.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  private getErrorMessage = (error?: Error): string => {
    if (!error) return 'An unexpected error occurred';

    if (this.isNetworkError(error)) {
      return 'Connection issue detected. Please check your internet connection.';
    }

    if (this.isAuthError(error)) {
      return 'Authentication required. Please sign in again.';
    }

    if (this.isMemoryError(error)) {
      return 'The app is running low on memory. Try closing other apps.';
    }

    if (this.isPermissionError(error)) {
      return 'Permission required. Please grant the necessary permissions.';
    }

    return 'We encountered an unexpected issue. Our team has been notified.';
  };

  private getOptionIcon = (icon?: string): string => {
    const iconMap: Record<string, string> = {
      refresh: '🔄',
      reload: '↻',
      wifi: '📶',
      'cloud-offline': '☁️',
      key: '🔑',
      memory: '💾',
      'arrow-back': '←',
      restart: '🔄',
    };

    return iconMap[icon || 'refresh'] || '⚡';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return (
          <FallbackComponent
            error={this.state.error!}
            retry={this.handleRetry}
            goBack={this.handleGoBack}
            contactSupport={this.handleContactSupport}
          />
        );
      }

      return this.renderErrorScreen();
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  errorContent: {
    flex: 1,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  recoverySection: {
    marginBottom: 24,
  },
  recoveryCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recoveryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  highPriorityCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  alternativesSection: {
    marginBottom: 24,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alternativeIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  alternativeText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  feedbackSection: {
    marginBottom: 24,
  },
  feedbackCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  feedbackPrompt: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  technicalToggle: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  technicalToggleText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  technicalSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  technicalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  technicalContent: {
    gap: 4,
  },
  technicalText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  supportSection: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  supportButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginBottom: 12,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  supportNote: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AdvancedErrorBoundary;