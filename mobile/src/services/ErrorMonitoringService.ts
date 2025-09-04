import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { errorRecoveryService } from './ErrorRecoveryService';
import { offlineQueueManager } from './OfflineQueueManager';

export interface ErrorReport {
  id: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
    cause?: any;
  };
  context: {
    component?: string;
    action?: string;
    userId?: string;
    sessionId: string;
    appVersion: string;
    platform: string;
    osVersion: string;
    networkStatus: {
      isConnected: boolean;
      type: string;
      isInternetReachable: boolean | null;
    };
    deviceInfo: {
      model: string;
      brand: string;
      buildNumber: string;
    };
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  breadcrumbs: ErrorBreadcrumb[];
  retryCount: number;
  affectedFeatures: string[];
}

export interface ErrorBreadcrumb {
  timestamp: number;
  category: 'navigation' | 'api' | 'user_action' | 'system' | 'error';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: any;
}

export interface ErrorMetrics {
  totalErrors: number;
  criticalErrors: number;
  highPriorityErrors: number;
  networkErrors: number;
  authErrors: number;
  crashRate: number;
  errorsByFeature: Record<string, number>;
  mostCommonErrors: Array<{
    error: string;
    count: number;
    lastOccurrence: number;
  }>;
}

export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private sessionId: string;
  private errorReports: ErrorReport[] = [];
  private maxBreadcrumbs = 50;
  private maxStoredErrors = 100;
  private reportingEnabled = true;

  private readonly STORAGE_KEYS = {
    ERROR_REPORTS: '@tailtracker:error_reports',
    ERROR_METRICS: '@tailtracker:error_metrics',
    BREADCRUMBS: '@tailtracker:breadcrumbs',
    SESSION_ID: '@tailtracker:session_id',
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
    this.loadStoredData();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  /**
   * Report an error with context
   */
  public async reportError(
    error: Error,
    context: Partial<ErrorReport['context']> = {},
    severity: ErrorReport['severity'] = 'medium',
    tags: string[] = []
  ): Promise<string> {
    const networkStatus = await this.getNetworkStatus();
    const deviceInfo = await this.getDeviceInfo();

    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      },
      context: {
        sessionId: this.sessionId,
        appVersion: await this.getAppVersion(),
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        networkStatus,
        deviceInfo,
        ...context,
      },
      severity,
      tags,
      breadcrumbs: [...this.breadcrumbs],
      retryCount: 0,
      affectedFeatures: this.inferAffectedFeatures(error, context),
    };

    // Store error report locally
    this.errorReports.push(errorReport);
    await this.persistErrorReports();

    // Add error breadcrumb
    this.addBreadcrumb({
      category: 'error',
      message: `${error.name}: ${error.message}`,
      level: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
      data: { errorId: errorReport.id, tags, context },
    });

    // Send to remote service if enabled and connected
    if (this.reportingEnabled) {
      this.sendErrorReport(errorReport);
    }

    return errorReport.id;
  }

  /**
   * Add breadcrumb for tracking user actions and system events
   */
  public addBreadcrumb(breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: ErrorBreadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Limit breadcrumbs to prevent memory issues
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    this.persistBreadcrumbs();
  }

  /**
   * Track API errors specifically
   */
  public async reportApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error,
    requestData?: any
  ): Promise<string> {
    const tags = ['api', `method:${method}`, `status:${statusCode}`];
    
    let severity: ErrorReport['severity'] = 'medium';
    if (statusCode >= 500) {
      severity = 'high';
    } else if (statusCode === 401 || statusCode === 403) {
      severity = 'high';
      tags.push('auth');
    } else if (statusCode === 429) {
      severity = 'medium';
      tags.push('rate_limit');
    }

    return this.reportError(error, {
      action: `API ${method} ${endpoint}`,
      component: 'ApiClient',
    }, severity, tags);
  }

  /**
   * Track authentication errors
   */
  public async reportAuthError(
    action: string,
    error: Error,
    userId?: string
  ): Promise<string> {
    return this.reportError(error, {
      action: `Auth: ${action}`,
      component: 'Authentication',
      userId,
    }, 'high', ['auth', action.toLowerCase()]);
  }

  /**
   * Track critical flow errors (lost pets, emergency contacts, etc.)
   */
  public async reportCriticalFlowError(
    flow: string,
    error: Error,
    context?: any
  ): Promise<string> {
    return this.reportError(error, {
      action: flow,
      component: 'CriticalFlow',
      ...context,
    }, 'critical', ['critical_flow', flow.toLowerCase().replace(/\s+/g, '_')]);
  }

  /**
   * Get error metrics and statistics
   */
  public async getErrorMetrics(): Promise<ErrorMetrics> {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const recentErrors = this.errorReports.filter(report => report.timestamp > last24Hours);

    const totalErrors = recentErrors.length;
    const criticalErrors = recentErrors.filter(r => r.severity === 'critical').length;
    const highPriorityErrors = recentErrors.filter(r => r.severity === 'high').length;
    const networkErrors = recentErrors.filter(r => 
      r.tags.includes('api') || r.error.message.includes('Network Error')
    ).length;
    const authErrors = recentErrors.filter(r => r.tags.includes('auth')).length;

    // Calculate crash rate (simplified)
    const crashRate = (criticalErrors / Math.max(totalErrors, 1)) * 100;

    // Group errors by affected features
    const errorsByFeature: Record<string, number> = {};
    recentErrors.forEach(report => {
      report.affectedFeatures.forEach(feature => {
        errorsByFeature[feature] = (errorsByFeature[feature] || 0) + 1;
      });
    });

    // Find most common errors
    const errorCounts: Record<string, { count: number; lastOccurrence: number }> = {};
    recentErrors.forEach(report => {
      const errorKey = `${report.error.name}: ${report.error.message}`;
      if (!errorCounts[errorKey]) {
        errorCounts[errorKey] = { count: 0, lastOccurrence: 0 };
      }
      errorCounts[errorKey].count++;
      errorCounts[errorKey].lastOccurrence = Math.max(
        errorCounts[errorKey].lastOccurrence,
        report.timestamp
      );
    });

    const mostCommonErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([error, data]) => ({ error, ...data }));

    return {
      totalErrors,
      criticalErrors,
      highPriorityErrors,
      networkErrors,
      authErrors,
      crashRate,
      errorsByFeature,
      mostCommonErrors,
    };
  }

  /**
   * Get recent error reports
   */
  public getRecentErrors(limit: number = 20): ErrorReport[] {
    return this.errorReports
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear stored error data
   */
  public async clearErrorData(): Promise<void> {
    this.errorReports = [];
    this.breadcrumbs = [];
    
    await Promise.all([
      AsyncStorage.removeItem(this.STORAGE_KEYS.ERROR_REPORTS),
      AsyncStorage.removeItem(this.STORAGE_KEYS.BREADCRUMBS),
      AsyncStorage.removeItem(this.STORAGE_KEYS.ERROR_METRICS),
    ]);
  }

  /**
   * Enable/disable error reporting
   */
  public setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    const originalPromiseRejection = global.onunhandledrejection;
    global.onunhandledrejection = (event) => {
      this.reportError(
        new Error(event.reason || 'Unhandled Promise Rejection'),
        { action: 'Unhandled Promise Rejection' },
        'high',
        ['unhandled_rejection']
      );

      if (originalPromiseRejection) {
        originalPromiseRejection(event);
      }
    };

    // Handle JavaScript errors (if available in React Native)
    if (typeof ErrorUtils !== 'undefined') {
      const originalErrorHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.reportError(
          error,
          { action: 'JavaScript Error' },
          isFatal ? 'critical' : 'high',
          isFatal ? ['fatal', 'javascript'] : ['javascript']
        );

        if (originalErrorHandler) {
          originalErrorHandler(error, isFatal);
        }
      });
    }
  }

  /**
   * Send error report to remote service
   */
  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      // Queue error report for sending
      await offlineQueueManager.enqueueAction(
        'ERROR_REPORT',
        errorReport,
        {
          priority: errorReport.severity === 'critical' ? 'critical' : 'low',
          requiresAuthentication: false,
        }
      );
    } catch (error) {
      console.warn('Failed to queue error report:', error);
    }
  }

  /**
   * Initialize session
   */
  private async initializeSession(): Promise<void> {
    try {
      // Check if we have a stored session ID
      const storedSessionId = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION_ID);
      if (!storedSessionId) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION_ID, this.sessionId);
      } else {
        this.sessionId = storedSessionId;
      }

      // Add session start breadcrumb
      this.addBreadcrumb({
        category: 'system',
        message: 'Session started',
        level: 'info',
        data: { sessionId: this.sessionId },
      });
    } catch (error) {
      console.warn('Failed to initialize error monitoring session:', error);
    }
  }

  /**
   * Load stored error data
   */
  private async loadStoredData(): Promise<void> {
    try {
      const [errorReportsData, breadcrumbsData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.ERROR_REPORTS),
        AsyncStorage.getItem(this.STORAGE_KEYS.BREADCRUMBS),
      ]);

      if (errorReportsData) {
        this.errorReports = JSON.parse(errorReportsData);
        
        // Limit stored errors to prevent memory issues
        if (this.errorReports.length > this.maxStoredErrors) {
          this.errorReports = this.errorReports.slice(-this.maxStoredErrors);
          await this.persistErrorReports();
        }
      }

      if (breadcrumbsData) {
        this.breadcrumbs = JSON.parse(breadcrumbsData);
      }
    } catch (error) {
      console.warn('Failed to load stored error data:', error);
    }
  }

  /**
   * Persist error reports to storage
   */
  private async persistErrorReports(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.ERROR_REPORTS,
        JSON.stringify(this.errorReports.slice(-this.maxStoredErrors))
      );
    } catch (error) {
      console.warn('Failed to persist error reports:', error);
    }
  }

  /**
   * Persist breadcrumbs to storage
   */
  private async persistBreadcrumbs(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.BREADCRUMBS,
        JSON.stringify(this.breadcrumbs)
      );
    } catch (error) {
      console.warn('Failed to persist breadcrumbs:', error);
    }
  }

  /**
   * Get current network status
   */
  private async getNetworkStatus(): Promise<ErrorReport['context']['networkStatus']> {
    try {
      const netInfo = await NetInfo.fetch();
      return {
        isConnected: netInfo.isConnected ?? false,
        type: netInfo.type,
        isInternetReachable: netInfo.isInternetReachable,
      };
    } catch (error) {
      return {
        isConnected: false,
        type: 'unknown',
        isInternetReachable: null,
      };
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<ErrorReport['context']['deviceInfo']> {
    return {
      model: Platform.constants?.Model || 'unknown',
      brand: Platform.constants?.Brand || 'unknown',
      buildNumber: Platform.constants?.Build || 'unknown',
    };
  }

  /**
   * Get app version
   */
  private async getAppVersion(): Promise<string> {
    // In a real app, you'd get this from expo-application or react-native-device-info
    return '1.0.0';
  }

  /**
   * Infer affected features from error context
   */
  private inferAffectedFeatures(
    error: Error,
    context: Partial<ErrorReport['context']>
  ): string[] {
    const features = new Set<string>();

    // Add based on component
    if (context.component) {
      features.add(context.component.toLowerCase());
    }

    // Add based on error message and type
    if (error.message.includes('auth') || error.name.includes('Auth')) {
      features.add('authentication');
    }

    if (error.message.includes('pet') || context.action?.includes('pet')) {
      features.add('pet_management');
    }

    if (error.message.includes('lost') || context.action?.includes('lost')) {
      features.add('lost_pet_alerts');
    }

    if (error.message.includes('vaccination')) {
      features.add('vaccination_records');
    }

    if (error.message.includes('profile') || context.action?.includes('profile')) {
      features.add('user_profile');
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      features.add('network');
    }

    if (error.message.includes('payment') || error.message.includes('subscription')) {
      features.add('billing');
    }

    // Default feature if none identified
    if (features.size === 0) {
      features.add('general');
    }

    return Array.from(features);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${randomPart}`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `error_${timestamp}_${randomPart}`;
  }
}

// Export singleton instance
export const errorMonitoring = ErrorMonitoringService.getInstance();

// Convenience functions
export const reportError = (error: Error, context?: any, severity?: ErrorReport['severity'], tags?: string[]) =>
  errorMonitoring.reportError(error, context, severity, tags);

export const reportApiError = (endpoint: string, method: string, statusCode: number, error: Error, requestData?: any) =>
  errorMonitoring.reportApiError(endpoint, method, statusCode, error, requestData);

export const reportAuthError = (action: string, error: Error, userId?: string) =>
  errorMonitoring.reportAuthError(action, error, userId);

export const reportCriticalFlowError = (flow: string, error: Error, context?: any) =>
  errorMonitoring.reportCriticalFlowError(flow, error, context);

export const addBreadcrumb = (breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>) =>
  errorMonitoring.addBreadcrumb(breadcrumb);