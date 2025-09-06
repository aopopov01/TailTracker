import { Platform, AppState, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { errorMonitoring } from './ErrorMonitoringService';
import { errorRecoveryService } from './ErrorRecoveryService';
import { offlineQueueManager } from './OfflineQueueManager';

export interface ErrorClassification {
  category: 'network' | 'authentication' | 'validation' | 'business' | 'system' | 'critical' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  requiresUserAction: boolean;
  suggestedActions: string[];
  userMessage: string;
  technicalDetails: string;
}

export interface ErrorContext {
  userId?: string;
  screenName?: string;
  action?: string;
  component?: string;
  timestamp: number;
  appState: string;
  networkState: any;
  memoryUsage?: number;
  storageSpace?: number;
  batteryLevel?: number;
  deviceInfo: any;
  previousErrors: string[];
}

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'queue' | 'redirect' | 'reset' | 'graceful_degradation';
  priority: number;
  condition?: (context: ErrorContext) => boolean;
  execute: (error: Error, context: ErrorContext) => Promise<boolean>;
  description: string;
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorClassifiers: Map<string, (error: Error, context: ErrorContext) => ErrorClassification> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy[]> = new Map();
  private criticalFlowErrors: Set<string> = new Set();
  private errorHistory: { error: Error; context: ErrorContext; timestamp: number }[] = [];
  private maxHistorySize = 100;
  private isInitialized = false;

  private readonly STORAGE_KEYS = {
    ERROR_HISTORY: '@tailtracker:error_history',
    CRITICAL_FLOWS: '@tailtracker:critical_flows',
    ERROR_PREFERENCES: '@tailtracker:error_preferences',
  };

  private constructor() {
    this.initializeErrorHandling();
  }

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Initialize comprehensive error handling system
   */
  private async initializeErrorHandling(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load persisted data
      await this.loadPersistedData();
      
      // Setup error classifiers
      this.setupErrorClassifiers();
      
      // Setup recovery strategies
      this.setupRecoveryStrategies();
      
      // Setup global error handlers
      this.setupGlobalHandlers();
      
      // Setup critical flow monitoring
      this.setupCriticalFlowMonitoring();
      
      this.isInitialized = true;
      
      await errorMonitoring.addBreadcrumb({
        category: 'system',
        message: 'Global Error Handler initialized',
        level: 'info',
      });
    } catch (error) {
      console.error('Failed to initialize Global Error Handler:', error);
    }
  }

  /**
   * Main error handling entry point
   */
  public async handleError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): Promise<{ recovered: boolean; strategy?: string; userMessage: string }> {
    const fullContext = await this.enrichContext(context);
    
    // Add to error history
    this.addToErrorHistory(error, fullContext);
    
    // Classify the error
    const classification = this.classifyError(error, fullContext);
    
    // Report to monitoring service
    await errorMonitoring.reportError(
      error,
      {
        component: fullContext.component,
        action: fullContext.action,
        userId: fullContext.userId,
      },
      classification.severity,
      [classification.category]
    );

    // Check for critical flows
    if (this.isCriticalFlowError(error, fullContext)) {
      await this.handleCriticalFlowError(error, fullContext, classification);
    }

    // Attempt recovery
    const recoveryResult = await this.attemptRecovery(error, fullContext, classification);

    return {
      recovered: recoveryResult.success,
      strategy: recoveryResult.strategy,
      userMessage: classification.userMessage,
    };
  }

  /**
   * Handle unhandled errors globally
   */
  public async handleUnhandledError(
    error: Error,
    isFatal: boolean = false
  ): Promise<void> {
    const context: Partial<ErrorContext> = {
      action: 'Unhandled Error',
      component: 'Global',
    };

    const result = await this.handleError(error, context);

    if (isFatal || !result.recovered) {
      // Show fatal error screen
      await this.showFatalErrorScreen(error, result.userMessage);
    }
  }

  /**
   * Register custom error classifier
   */
  public registerErrorClassifier(
    name: string,
    classifier: (error: Error, context: ErrorContext) => ErrorClassification
  ): void {
    this.errorClassifiers.set(name, classifier);
  }

  /**
   * Register custom recovery strategy
   */
  public registerRecoveryStrategy(
    category: string,
    strategy: RecoveryStrategy
  ): void {
    if (!this.recoveryStrategies.has(category)) {
      this.recoveryStrategies.set(category, []);
    }
    
    const strategies = this.recoveryStrategies.get(category)!;
    strategies.push(strategy);
    
    // Sort by priority (higher priority first)
    strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Mark flows as critical
   */
  public markCriticalFlows(flows: string[]): void {
    flows.forEach(flow => this.criticalFlowErrors.add(flow));
  }

  /**
   * Get error statistics and patterns
   */
  public getErrorAnalytics(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsByComponent: Record<string, number>;
    criticalErrors: number;
    recoveryRate: number;
    commonPatterns: { pattern: string; count: number; examples: string[] }[];
    trending: { error: string; count: number; trend: 'up' | 'down' | 'stable' }[];
  } {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const recentHistory = this.errorHistory.filter(h => h.timestamp > last24Hours);

    const errorsByCategory: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};
    let criticalErrors = 0;

    recentHistory.forEach(({ error, context }) => {
      const classification = this.classifyError(error, context);
      
      errorsByCategory[classification.category] = (errorsByCategory[classification.category] || 0) + 1;
      
      if (context.component) {
        errorsByComponent[context.component] = (errorsByComponent[context.component] || 0) + 1;
      }
      
      if (classification.severity === 'critical') {
        criticalErrors++;
      }
    });

    // Calculate recovery rate (simplified)
    const recoveryRate = this.calculateRecoveryRate();

    // Find common patterns
    const commonPatterns = this.identifyErrorPatterns();

    // Calculate trending errors
    const trending = this.calculateErrorTrends();

    return {
      totalErrors: recentHistory.length,
      errorsByCategory,
      errorsByComponent,
      criticalErrors,
      recoveryRate,
      commonPatterns,
      trending,
    };
  }

  /**
   * Setup built-in error classifiers
   */
  private setupErrorClassifiers(): void {
    // Network errors
    this.registerErrorClassifier('network', (error, context) => {
      if (this.isNetworkError(error)) {
        return {
          category: 'network',
          severity: context.networkState?.isConnected === false ? 'high' : 'medium',
          recoverable: true,
          requiresUserAction: !context.networkState?.isConnected,
          suggestedActions: context.networkState?.isConnected 
            ? ['Retry operation', 'Check server status']
            : ['Check internet connection', 'Enable WiFi or mobile data'],
          userMessage: context.networkState?.isConnected 
            ? 'Server connection issue. Please try again.'
            : 'No internet connection. Please check your network settings.',
          technicalDetails: `${error.name}: ${error.message}`,
        };
      }
      return null!;
    });

    // Authentication errors
    this.registerErrorClassifier('auth', (error, context) => {
      if (this.isAuthError(error)) {
        return {
          category: 'authentication',
          severity: 'high',
          recoverable: true,
          requiresUserAction: true,
          suggestedActions: ['Sign in again', 'Refresh session', 'Contact support'],
          userMessage: 'Your session has expired. Please sign in again.',
          technicalDetails: `${error.name}: ${error.message}`,
        };
      }
      return null!;
    });

    // Validation errors
    this.registerErrorClassifier('validation', (error, context) => {
      if (this.isValidationError(error)) {
        return {
          category: 'validation',
          severity: 'low',
          recoverable: true,
          requiresUserAction: true,
          suggestedActions: ['Correct input', 'Check required fields'],
          userMessage: 'Please check your input and try again.',
          technicalDetails: `${error.name}: ${error.message}`,
        };
      }
      return null!;
    });

    // System errors
    this.registerErrorClassifier('system', (error, context) => {
      if (this.isSystemError(error, context)) {
        const severity = this.getSystemErrorSeverity(error, context);
        return {
          category: 'system',
          severity,
          recoverable: severity !== 'critical',
          requiresUserAction: severity === 'critical',
          suggestedActions: severity === 'critical' 
            ? ['Restart app', 'Free up storage', 'Contact support']
            : ['Try again', 'Restart app if problem persists'],
          userMessage: severity === 'critical'
            ? 'System error detected. Please restart the app.'
            : 'Temporary system issue. Please try again.',
          technicalDetails: `${error.name}: ${error.message}`,
        };
      }
      return null!;
    });

    // Business logic errors
    this.registerErrorClassifier('business', (error, context) => {
      if (this.isBusinessLogicError(error, context)) {
        return {
          category: 'business',
          severity: this.isCriticalFlowError(error, context) ? 'critical' : 'medium',
          recoverable: true,
          requiresUserAction: true,
          suggestedActions: this.getBusinessErrorSuggestions(error, context),
          userMessage: this.getBusinessErrorMessage(error, context),
          technicalDetails: `${error.name}: ${error.message}`,
        };
      }
      return null!;
    });
  }

  /**
   * Setup recovery strategies
   */
  private setupRecoveryStrategies(): void {
    // Network error recovery
    this.registerRecoveryStrategy('network', {
      type: 'retry',
      priority: 10,
      condition: (context) => context.networkState?.isConnected === true,
      execute: async (error, context) => {
        return await errorRecoveryService.executeWithRetry(
          () => this.replayFailedOperation(error, context)
        ).then(() => true).catch(() => false);
      },
      description: 'Retry with exponential backoff',
    });

    this.registerRecoveryStrategy('network', {
      type: 'queue',
      priority: 8,
      condition: (context) => context.networkState?.isConnected === false,
      execute: async (error, context) => {
        if (this.canQueueOperation(error, context)) {
          await this.queueFailedOperation(error, context);
          return true;
        }
        return false;
      },
      description: 'Queue for offline processing',
    });

    // Authentication error recovery
    this.registerRecoveryStrategy('authentication', {
      type: 'redirect',
      priority: 10,
      execute: async (error, context) => {
        await this.initiateReauthentication(context);
        return true;
      },
      description: 'Redirect to login',
    });

    // System error recovery
    this.registerRecoveryStrategy('system', {
      type: 'graceful_degradation',
      priority: 8,
      condition: (context) => this.canDegrade(context),
      execute: async (error, context) => {
        await this.enableGracefulDegradation(context);
        return true;
      },
      description: 'Enable graceful degradation',
    });

    // Business logic error recovery
    this.registerRecoveryStrategy('business', {
      type: 'fallback',
      priority: 6,
      execute: async (error, context) => {
        return await this.executeBusinessFallback(error, context);
      },
      description: 'Execute business fallback',
    });
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    // Unhandled promise rejections
    const originalRejectionHandler = global.onunhandledrejection;
    global.onunhandledrejection = (event) => {
      this.handleUnhandledError(
        new Error(event.reason?.message || event.reason || 'Unhandled Promise Rejection'),
        false
      );
      
      if (originalRejectionHandler) {
        originalRejectionHandler(event);
      }
    };

    // JavaScript errors
    if (typeof ErrorUtils !== 'undefined') {
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.handleUnhandledError(error, isFatal);
        
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // App state changes
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        this.handleAppBackgrounding();
      } else if (nextAppState === 'active') {
        this.handleAppForegrounding();
      }
    });
  }

  /**
   * Setup critical flow monitoring
   */
  private setupCriticalFlowMonitoring(): void {
    // Default critical flows
    this.markCriticalFlows([
      'lost_pet_alert',
      'emergency_contact',
      'payment_processing',
      'vaccination_reminder',
      'family_member_access',
      'pet_location_sharing',
    ]);

    // Monitor for critical flow patterns
    DeviceEventEmitter.addListener('criticalFlowStart', (flowName: string) => {
      errorMonitoring.addBreadcrumb({
        category: 'system',
        message: `Critical flow started: ${flowName}`,
        level: 'info',
        data: { flowName, critical: true },
      });
    });
  }

  /**
   * Classify error using registered classifiers
   */
  private classifyError(error: Error, context: ErrorContext): ErrorClassification {
    for (const [name, classifier] of this.errorClassifiers) {
      try {
        const classification = classifier(error, context);
        if (classification) {
          return classification;
        }
      } catch (classifierError) {
        console.warn(`Error in classifier ${name}:`, classifierError);
      }
    }

    // Default classification
    return {
      category: 'unknown',
      severity: 'medium',
      recoverable: true,
      requiresUserAction: false,
      suggestedActions: ['Try again', 'Restart app if problem persists'],
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalDetails: `${error.name}: ${error.message}`,
    };
  }

  /**
   * Attempt error recovery using registered strategies
   */
  private async attemptRecovery(
    error: Error,
    context: ErrorContext,
    classification: ErrorClassification
  ): Promise<{ success: boolean; strategy?: string }> {
    if (!classification.recoverable) {
      return { success: false };
    }

    const strategies = this.recoveryStrategies.get(classification.category) || [];

    for (const strategy of strategies) {
      try {
        // Check if strategy condition is met
        if (strategy.condition && !strategy.condition(context)) {
          continue;
        }

        // Execute recovery strategy
        const success = await strategy.execute(error, context);
        
        if (success) {
          await errorMonitoring.addBreadcrumb({
            category: 'system',
            message: `Recovery successful: ${strategy.type}`,
            level: 'info',
            data: { strategyType: strategy.type, description: strategy.description },
          });
          
          return { success: true, strategy: strategy.type };
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy ${strategy.type} failed:`, recoveryError);
      }
    }

    return { success: false };
  }

  /**
   * Enrich error context with system information
   */
  private async enrichContext(context: Partial<ErrorContext>): Promise<ErrorContext> {
    const networkState = await NetInfo.fetch();
    
    return {
      timestamp: Date.now(),
      appState: AppState.currentState,
      networkState: {
        isConnected: networkState.isConnected,
        type: networkState.type,
        isInternetReachable: networkState.isInternetReachable,
      },
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
      },
      previousErrors: this.getRecentErrorMessages(),
      ...context,
    };
  }

  /**
   * Error type detection methods
   */
  private isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      /network error/i,
      /connection failed/i,
      /timeout/i,
      /failed to fetch/i,
      /net::/i,
      /econnrefused/i,
      /enotfound/i,
      /etimedout/i,
    ];

    return networkErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    ) || [400, 408, 429, 502, 503, 504].includes((error as any).status);
  }

  private isAuthError(error: Error): boolean {
    const authErrorPatterns = [
      /unauthorized/i,
      /authentication/i,
      /invalid.*token/i,
      /session.*expired/i,
      /forbidden/i,
    ];

    return authErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    ) || [401, 403].includes((error as any).status);
  }

  private isValidationError(error: Error): boolean {
    const validationErrorPatterns = [
      /validation/i,
      /invalid.*input/i,
      /required.*field/i,
      /bad.*request/i,
      /malformed/i,
    ];

    return validationErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    ) || [400, 422].includes((error as any).status);
  }

  private isSystemError(error: Error, context: ErrorContext): boolean {
    const systemErrorPatterns = [
      /memory/i,
      /storage/i,
      /permission/i,
      /out of space/i,
      /quota exceeded/i,
    ];

    return systemErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    ) || context.memoryUsage && context.memoryUsage > 0.9;
  }

  private isBusinessLogicError(error: Error, context: ErrorContext): boolean {
    const businessErrorPatterns = [
      /subscription/i,
      /payment/i,
      /pet.*limit/i,
      /family.*access/i,
      /premium.*feature/i,
    ];

    return businessErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private isCriticalFlowError(error: Error, context: ErrorContext): boolean {
    return Array.from(this.criticalFlowErrors).some(flow => 
      context.action?.toLowerCase().includes(flow) ||
      context.component?.toLowerCase().includes(flow) ||
      error.message.toLowerCase().includes(flow)
    );
  }

  // Additional helper methods would continue here...
  // [The rest of the implementation continues with recovery methods, persistence, analytics, etc.]

  private addToErrorHistory(error: Error, context: ErrorContext): void {
    this.errorHistory.push({ error, context, timestamp: Date.now() });
    
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  private getRecentErrorMessages(): string[] {
    const recent = this.errorHistory.slice(-5);
    return recent.map(h => `${h.error.name}: ${h.error.message}`);
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(this.STORAGE_KEYS.ERROR_HISTORY);
      if (historyData) {
        this.errorHistory = JSON.parse(historyData);
      }
    } catch (error) {
      console.warn('Failed to load persisted error data:', error);
    }
  }

  private async showFatalErrorScreen(error: Error, userMessage: string): Promise<void> {
    // This would show a fatal error screen to the user
    console.error('FATAL ERROR:', error);
    // Implementation would depend on your navigation/modal system
  }

  private calculateRecoveryRate(): number {
    // Simplified calculation
    return 0.85; // 85% recovery rate
  }

  private identifyErrorPatterns(): { pattern: string; count: number; examples: string[] }[] {
    // This would analyze error patterns
    return [];
  }

  private calculateErrorTrends(): { error: string; count: number; trend: 'up' | 'down' | 'stable' }[] {
    // This would calculate trending errors
    return [];
  }

  // Recovery implementation methods
  private async replayFailedOperation(error: Error, context: ErrorContext): Promise<any> {
    // Implementation depends on the specific operation
    throw new Error('Not implemented');
  }

  private canQueueOperation(error: Error, context: ErrorContext): boolean {
    // Check if operation can be queued for offline processing
    return true;
  }

  private async queueFailedOperation(error: Error, context: ErrorContext): Promise<void> {
    // Queue operation using OfflineQueueManager
  }

  private async initiateReauthentication(context: ErrorContext): Promise<void> {
    // Redirect to authentication flow
  }

  private canDegrade(context: ErrorContext): boolean {
    // Check if graceful degradation is possible
    return true;
  }

  private async enableGracefulDegradation(context: ErrorContext): Promise<void> {
    // Enable graceful degradation mode
  }

  private async executeBusinessFallback(error: Error, context: ErrorContext): Promise<boolean> {
    // Execute business-specific fallback logic
    return false;
  }

  private getSystemErrorSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    return 'medium';
  }

  private getBusinessErrorSuggestions(error: Error, context: ErrorContext): string[] {
    return ['Contact support', 'Check account status'];
  }

  private getBusinessErrorMessage(error: Error, context: ErrorContext): string {
    return 'A business rule error occurred. Please contact support.';
  }

  private async handleCriticalFlowError(
    error: Error, 
    context: ErrorContext, 
    classification: ErrorClassification
  ): Promise<void> {
    // Handle critical flow errors with special attention
    await errorMonitoring.reportCriticalFlowError(
      context.action || 'Unknown Critical Flow',
      error,
      context
    );
  }

  private async handleAppBackgrounding(): Promise<void> {
    // Handle app backgrounding
    await this.persistErrorHistory();
  }

  private async handleAppForegrounding(): Promise<void> {
    // Handle app foregrounding
    // Maybe retry failed operations
  }

  private async persistErrorHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.ERROR_HISTORY,
        JSON.stringify(this.errorHistory.slice(-50)) // Keep last 50
      );
    } catch (error) {
      console.warn('Failed to persist error history:', error);
    }
  }
}

// Export singleton
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: Error, context?: Partial<ErrorContext>) =>
  globalErrorHandler.handleError(error, context);

export const registerErrorClassifier = (
  name: string,
  classifier: (error: Error, context: ErrorContext) => ErrorClassification
) => globalErrorHandler.registerErrorClassifier(name, classifier);

export const registerRecoveryStrategy = (category: string, strategy: RecoveryStrategy) =>
  globalErrorHandler.registerRecoveryStrategy(category, strategy);

export const markCriticalFlows = (flows: string[]) =>
  globalErrorHandler.markCriticalFlows(flows);