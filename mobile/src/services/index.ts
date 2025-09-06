/**
 * TailTracker Analytics Services Index
 * 
 * Central export point for all analytics and monitoring services
 */

// Core Analytics Infrastructure
// Import React for the hook (this would be handled by your bundler)
import * as React from 'react';

export { analytics, trackEvent, trackScreenView, trackUserAction, trackConversion } from './AnalyticsService';
export type { 
  AnalyticsEvent, 
  AnalyticsContext, 
  UserProfile, 
  AnalyticsConfig,
  EventCategory,
  EventPriority 
} from './AnalyticsService';

// User Behavior Analytics
export { userBehaviorAnalytics } from './UserBehaviorAnalytics';
export type { 
  UserSession, 
  ScreenView, 
  UserAction, 
  ConversionFunnel, 
  FunnelAnalysis,
  CohortAnalysis,
  EngagementMetrics,
  FeatureAdoption,
  UserSegment 
} from './UserBehaviorAnalytics';

// Business Intelligence
export { businessIntelligence } from './BusinessIntelligenceService';
export type { 
  RevenueMetrics, 
  SubscriptionMetrics, 
  UserAcquisitionMetrics, 
  ProductMetrics,
  BusinessForecast,
  CompetitorAnalysis,
  MarketPosition 
} from './BusinessIntelligenceService';

// Health & Wellness Analytics
export { healthWellnessAnalytics } from './HealthWellnessAnalytics';
export type { 
  HealthMetrics, 
  VaccinationStatus, 
  HealthTrend, 
  WellnessInsights,
  EmergencyPattern,
  BreedInsight,
  PredictiveHealthModel 
} from './HealthWellnessAnalytics';

// Real-Time Monitoring
export { realTimeMonitoring } from './RealTimeMonitoringService';
export type { 
  MonitoringConfig, 
  Alert, 
  SystemHealth, 
  AlertType,
  AlertSeverity,
  ComponentHealth,
  MetricSnapshot 
} from './RealTimeMonitoringService';

// Privacy Compliance
export { privacyCompliance } from './PrivacyComplianceService';
export type { 
  PrivacyConfig, 
  ConsentRecord, 
  ConsentMap, 
  DataSubjectRequest,
  PrivacyAudit,
  DataProcessingPurpose 
} from './PrivacyComplianceService';

// Analytics Dashboards
export { analyticsDashboard } from './AnalyticsDashboardService';
export type { 
  Dashboard, 
  Widget, 
  Report, 
  DashboardType,
  WidgetType,
  DataSource,
  VisualizationConfig,
  ReportSchedule 
} from './AnalyticsDashboardService';

// Predictive Analytics
export { predictiveAnalytics } from './PredictiveAnalyticsService';
export type { 
  MLModel, 
  Prediction, 
  ChurnPrediction, 
  LTVPrediction,
  HealthOutcomePrediction,
  Recommendation,
  MLPipeline,
  ModelType 
} from './PredictiveAnalyticsService';

// Error Monitoring (Enhanced)
export { 
  errorMonitoring, 
  reportError, 
  reportApiError, 
  reportAuthError, 
  reportCriticalFlowError, 
  addBreadcrumb 
} from './ErrorMonitoringService';
export type { 
  ErrorReport, 
  ErrorBreadcrumb, 
  ErrorMetrics 
} from './ErrorMonitoringService';

// Performance Monitor (Enhanced)
export { PerformanceMonitor, usePerformanceMonitor } from './PerformanceMonitor';

/**
 * Analytics Service Manager
 * 
 * Central orchestrator for all analytics services
 */
export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  /**
   * Initialize all analytics services
   */
  public async initialize(
    userId?: string,
    config?: {
      enableAnalytics?: boolean;
      enableRealTimeMonitoring?: boolean;
      enablePredictiveAnalytics?: boolean;
      privacyCompliance?: boolean;
    }
  ): Promise<void> {
    try {
      console.log('🚀 Initializing TailTracker Analytics System...');

      const defaultConfig = {
        enableAnalytics: true,
        enableRealTimeMonitoring: true,
        enablePredictiveAnalytics: true,
        privacyCompliance: true,
        ...config,
      };

      // 1. Initialize core analytics
      if (defaultConfig.enableAnalytics) {
        const { analytics } = await import('./AnalyticsService');
        await analytics.initialize(userId, {
          enabledCategories: ['user_behavior', 'business_metrics', 'performance', 'health_wellness'],
          batchSize: 50,
          flushInterval: 30000,
          enableRealTimeReporting: true,
          enablePerformanceTracking: true,
        });
      }

      // 2. Initialize user behavior analytics
      const { userBehaviorAnalytics } = await import('./UserBehaviorAnalytics');
      await userBehaviorAnalytics.startSession(userId);

      // 3. Initialize real-time monitoring
      if (defaultConfig.enableRealTimeMonitoring) {
        const { realTimeMonitoring } = await import('./RealTimeMonitoringService');
        await realTimeMonitoring.startMonitoring();
      }

      // 4. Initialize predictive analytics
      if (defaultConfig.enablePredictiveAnalytics) {
        const { predictiveAnalytics } = await import('./PredictiveAnalyticsService');
        await predictiveAnalytics.initialize();
      }

      // 5. Initialize privacy compliance
      if (defaultConfig.privacyCompliance) {
        const { privacyCompliance } = await import('./PrivacyComplianceService');
        
        // Set up basic privacy configuration
        await privacyCompliance.updateConfig({
          gdprCompliance: true,
          ccpaCompliance: true,
          dataRetentionDays: 1095, // 3 years
          anonymizationEnabled: true,
          consentRequired: true,
        });

        // Clean up expired data
        await privacyCompliance.cleanupExpiredData();
      }

      this.isInitialized = true;

      console.log('✅ TailTracker Analytics System initialized successfully');

      // Track initialization
      if (defaultConfig.enableAnalytics) {
        const { analytics } = await import('./AnalyticsService');
        await analytics.track('analytics_system_initialized', {
          user_id: userId,
          config: defaultConfig,
          services_enabled: Object.keys(defaultConfig).filter(k => defaultConfig[k as keyof typeof defaultConfig]),
        }, 'system', 'high');
      }

    } catch (error) {
      console.error('❌ Failed to initialize Analytics System:', error);
      
      // Report initialization error
      const { errorMonitoring } = await import('./ErrorMonitoringService');
      await errorMonitoring.reportError(
        error as Error,
        { component: 'AnalyticsManager', action: 'initialize' },
        'critical',
        ['analytics', 'initialization', 'system']
      );
      
      throw error;
    }
  }

  /**
   * Shutdown all analytics services gracefully
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('🔄 Shutting down TailTracker Analytics System...');

      // Stop real-time monitoring
      try {
        const { realTimeMonitoring } = await import('./RealTimeMonitoringService');
        await realTimeMonitoring.stopMonitoring();
      } catch (error) {
        console.warn('Warning: Failed to stop monitoring:', error);
      }

      // End user session
      try {
        const { userBehaviorAnalytics } = await import('./UserBehaviorAnalytics');
        await userBehaviorAnalytics.endSession();
      } catch (error) {
        console.warn('Warning: Failed to end user session:', error);
      }

      // Flush analytics data
      try {
        const { analytics } = await import('./AnalyticsService');
        await analytics.flush();
        await analytics.dispose();
      } catch (error) {
        console.warn('Warning: Failed to flush analytics:', error);
      }

      console.log('✅ Analytics System shutdown complete');

    } catch (error) {
      console.error('❌ Error during analytics shutdown:', error);
    }
  }

  /**
   * Get analytics system health status
   */
  public async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    services: Record<string, boolean>;
    lastCheck: number;
  }> {
    const health = {
      status: 'healthy' as const,
      services: {} as Record<string, boolean>,
      lastCheck: Date.now(),
    };

    try {
      // Check core analytics
      health.services.analytics = this.isInitialized;

      // Check monitoring service
      const { realTimeMonitoring } = await import('./RealTimeMonitoringService');
      const systemHealth = realTimeMonitoring.getSystemHealth();
      health.services.monitoring = systemHealth !== null;

      // Check dashboard service
      const { analyticsDashboard } = await import('./AnalyticsDashboardService');
      health.services.dashboards = analyticsDashboard.getDashboards().length > 0;

      // Determine overall status
      const serviceStatuses = Object.values(health.services);
      if (serviceStatuses.every(status => status)) {
        health.status = 'healthy';
      } else if (serviceStatuses.some(status => status)) {
        health.status = 'warning';
      } else {
        health.status = 'critical';
      }

    } catch (error) {
      console.error('Failed to check system health:', error);
      health.status = 'critical';
    }

    return health;
  }

  /**
   * Quick analytics tracking for common events
   */
  public async quickTrack(event: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized - skipping event tracking');
      return;
    }

    try {
      const { analytics } = await import('./AnalyticsService');
      await analytics.track(event, properties, 'user_behavior', 'medium');
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  public async generateAnalyticsReport(): Promise<{
    summary: Record<string, any>;
    userBehavior: any;
    businessMetrics: any;
    healthInsights: any;
    systemHealth: any;
  }> {
    try {
      const [userBehavior, businessMetrics, healthInsights, systemHealth] = await Promise.all([
        this.getUserBehaviorSummary(),
        this.getBusinessMetricsSummary(),
        this.getHealthInsightsSummary(),
        this.getSystemHealth(),
      ]);

      return {
        summary: {
          reportGenerated: Date.now(),
          servicesActive: Object.keys(systemHealth.services).filter(k => systemHealth.services[k]).length,
          overallHealth: systemHealth.status,
        },
        userBehavior,
        businessMetrics,
        healthInsights,
        systemHealth,
      };

    } catch (error) {
      console.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  private async getUserBehaviorSummary(): Promise<any> {
    try {
      const { userBehaviorAnalytics } = await import('./UserBehaviorAnalytics');
      return await userBehaviorAnalytics.getEngagementMetrics(
        Date.now() - (30 * 24 * 60 * 60 * 1000),
        Date.now()
      );
    } catch (error) {
      return { error: 'Failed to get user behavior data' };
    }
  }

  private async getBusinessMetricsSummary(): Promise<any> {
    try {
      const { businessIntelligence } = await import('./BusinessIntelligenceService');
      return await businessIntelligence.getRevenueMetrics(
        Date.now() - (30 * 24 * 60 * 60 * 1000),
        Date.now()
      );
    } catch (error) {
      return { error: 'Failed to get business metrics' };
    }
  }

  private async getHealthInsightsSummary(): Promise<any> {
    try {
      const { healthWellnessAnalytics } = await import('./HealthWellnessAnalytics');
      return await healthWellnessAnalytics.getWellnessInsights();
    } catch (error) {
      return { error: 'Failed to get health insights' };
    }
  }

  /**
   * Enable or disable specific analytics features
   */
  public async configureFeatures(features: {
    userTracking?: boolean;
    performanceMonitoring?: boolean;
    errorReporting?: boolean;
    predictiveAnalytics?: boolean;
    realTimeAlerts?: boolean;
  }): Promise<void> {
    try {
      if (features.performanceMonitoring !== undefined) {
        // Configure performance monitoring
        const { PerformanceMonitor } = await import('./PerformanceMonitor');
        if (features.performanceMonitoring) {
          PerformanceMonitor.markAppLaunchComplete();
        }
      }

      if (features.realTimeAlerts !== undefined) {
        // Configure real-time alerts
        const { realTimeMonitoring } = await import('./RealTimeMonitoringService');
        await realTimeMonitoring.updateConfig({
          enableRealTimeAlerts: features.realTimeAlerts,
        });
      }

      // Track configuration change
      await this.quickTrack('analytics_features_configured', features);

    } catch (error) {
      console.error('Failed to configure analytics features:', error);
    }
  }

  /**
   * Check if analytics system is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const analyticsManager = AnalyticsManager.getInstance();

/**
 * Convenience function to initialize analytics with default settings
 */
export const initializeAnalytics = async (
  userId?: string,
  options?: Parameters<AnalyticsManager['initialize']>[1]
): Promise<void> => {
  return analyticsManager.initialize(userId, options);
};

/**
 * Convenience function to shutdown analytics
 */
export const shutdownAnalytics = async (): Promise<void> => {
  return analyticsManager.shutdown();
};

/**
 * Convenience function for quick event tracking
 */
export const track = async (event: string, properties?: Record<string, any>): Promise<void> => {
  return analyticsManager.quickTrack(event, properties);
};

/**
 * React Hook for Analytics
 */
export const useAnalytics = () => {
  const [isReady, setIsReady] = React.useState(false);
  const [systemHealth, setSystemHealth] = React.useState<any>(null);

  React.useEffect(() => {
    const checkStatus = async () => {
      setIsReady(analyticsManager.isReady());
      try {
        const health = await analyticsManager.getSystemHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('Failed to get system health:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    isReady,
    systemHealth,
    track: analyticsManager.quickTrack.bind(analyticsManager),
    generateReport: analyticsManager.generateAnalyticsReport.bind(analyticsManager),
    configureFeatures: analyticsManager.configureFeatures.bind(analyticsManager),
  };
};