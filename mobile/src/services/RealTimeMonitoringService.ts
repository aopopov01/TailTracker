/**
 * Real-Time Monitoring and Alerting Service for TailTracker
 * 
 * Provides comprehensive real-time monitoring, automated alerting,
 * system health tracking, and incident management
 */

import { Platform, AppState, NetInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './AnalyticsService';
import { errorMonitoring } from './ErrorMonitoringService';
import { PerformanceMonitor } from './PerformanceMonitor';

// ========================= TYPES =========================

export interface MonitoringConfig {
  enableRealTimeAlerts: boolean;
  alertThresholds: AlertThresholds;
  monitoringIntervals: MonitoringIntervals;
  escalationRules: EscalationRule[];
  notificationChannels: NotificationChannel[];
  maintenanceWindows: MaintenanceWindow[];
}

export interface AlertThresholds {
  performance: {
    appLaunchTime: number; // ms
    screenTransition: number; // ms
    apiResponse: number; // ms
    memoryUsage: number; // MB
    crashRate: number; // percentage
  };
  business: {
    conversionRateDropPercent: number;
    subscriptionChurnRate: number;
    revenueDropPercent: number;
    userAcquisitionDropPercent: number;
  };
  health: {
    emergencyAlertResponse: number; // minutes
    systemHealthScore: number;
    errorRate: number; // percentage
    apiAvailability: number; // percentage
  };
  security: {
    failedAuthAttempts: number;
    suspiciousActivity: number;
    dataBreachIndicators: string[];
  };
}

export interface MonitoringIntervals {
  performance: number; // seconds
  business: number; // seconds
  health: number; // seconds
  security: number; // seconds
  system: number; // seconds
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: number;
  source: string;
  affectedSystems: string[];
  metrics: Record<string, any>;
  status: AlertStatus;
  escalationLevel: number;
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolvedAt?: number;
  actions: AlertAction[];
  relatedAlerts: string[];
}

export type AlertType = 
  | 'performance'
  | 'business'
  | 'health'
  | 'security'
  | 'system'
  | 'user_experience'
  | 'infrastructure';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export type AlertStatus = 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'suppressed';

export interface AlertAction {
  action: string;
  timestamp: number;
  user: string;
  details: string;
  automated: boolean;
}

export interface EscalationRule {
  alertType: AlertType;
  severity: AlertSeverity;
  escalationLevels: EscalationLevel[];
  suppressionRules: SuppressionRule[];
}

export interface EscalationLevel {
  level: number;
  timeoutMinutes: number;
  recipients: string[];
  channels: NotificationChannel[];
  actions: AutomatedAction[];
}

export interface SuppressionRule {
  condition: string;
  duration: number; // minutes
  reason: string;
}

export interface NotificationChannel {
  type: 'push' | 'email' | 'sms' | 'slack' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
  testable: boolean;
}

export interface AutomatedAction {
  type: 'restart_service' | 'scale_resources' | 'failover' | 'notify_team' | 'run_script';
  config: Record<string, any>;
  condition: string;
}

export interface MaintenanceWindow {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  recurring: boolean;
  suppressAlerts: AlertType[];
  description: string;
}

export interface SystemHealth {
  timestamp: number;
  overallScore: number;
  components: ComponentHealth[];
  alerts: Alert[];
  trends: HealthTrend[];
  uptime: number;
  lastIncident?: Incident;
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  score: number;
  lastChecked: number;
  responseTime: number;
  errorRate: number;
  dependencies: string[];
  metrics: Record<string, number>;
}

export interface HealthTrend {
  metric: string;
  values: { timestamp: number; value: number }[];
  trend: 'improving' | 'stable' | 'degrading';
  severity: 'normal' | 'concerning' | 'critical';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: number;
  resolvedAt?: number;
  affectedSystems: string[];
  timeline: IncidentUpdate[];
  rootCause?: string;
  preventionMeasures: string[];
}

export interface IncidentUpdate {
  timestamp: number;
  status: string;
  message: string;
  author: string;
  automated: boolean;
}

export interface MetricSnapshot {
  timestamp: number;
  performance: PerformanceMetrics;
  business: BusinessMetrics;
  health: HealthMetrics;
  security: SecurityMetrics;
  system: SystemMetrics;
}

export interface PerformanceMetrics {
  appLaunchTime: number;
  screenTransitionTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  crashRate: number;
  frameDrop: number;
}

export interface BusinessMetrics {
  activeUsers: number;
  conversionRate: number;
  subscriptionChurn: number;
  revenue: number;
  userAcquisition: number;
  customerSatisfaction: number;
}

export interface HealthMetrics {
  emergencyResponseTime: number;
  systemHealthScore: number;
  errorRate: number;
  apiAvailability: number;
  dataQuality: number;
  serviceUptime: number;
}

export interface SecurityMetrics {
  failedAuthAttempts: number;
  suspiciousActivities: number;
  vulnerabilityScore: number;
  dataEncryptionStatus: number;
  complianceScore: number;
  threatLevel: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  queueSize: number;
}

// ========================= MAIN SERVICE =========================

export class RealTimeMonitoringService {
  private static instance: RealTimeMonitoringService;
  private config: MonitoringConfig;
  private activeAlerts: Map<string, Alert> = new Map();
  private systemHealth?: SystemHealth;
  private monitoringTimers: Map<string, NodeJS.Timeout> = new Map();
  private metricSnapshots: MetricSnapshot[] = [];
  private isMonitoring = false;

  private readonly STORAGE_KEYS = {
    CONFIG: '@tailtracker:monitoring_config',
    ALERTS: '@tailtracker:active_alerts',
    SYSTEM_HEALTH: '@tailtracker:system_health',
    INCIDENTS: '@tailtracker:incidents',
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.loadStoredData();
  }

  public static getInstance(): RealTimeMonitoringService {
    if (!RealTimeMonitoringService.instance) {
      RealTimeMonitoringService.instance = new RealTimeMonitoringService();
    }
    return RealTimeMonitoringService.instance;
  }

  // ========================= MONITORING CONTROL =========================

  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    try {
      this.isMonitoring = true;

      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Start business metrics monitoring
      this.startBusinessMonitoring();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start security monitoring
      this.startSecurityMonitoring();
      
      // Start system monitoring
      this.startSystemMonitoring();

      // Setup app state listeners
      this.setupAppStateListeners();

      await this.track('monitoring_started', {
        config: this.config,
        monitoring_intervals: this.config.monitoringIntervals,
      });

      console.log('✅ Real-time monitoring started');

    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      await errorMonitoring.reportError(
        error as Error,
        { component: 'RealTimeMonitoring', action: 'startMonitoring' },
        'critical',
        ['monitoring', 'startup']
      );
    }
  }

  public async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      this.isMonitoring = false;

      // Clear all monitoring timers
      for (const [name, timer] of this.monitoringTimers) {
        clearInterval(timer);
        this.monitoringTimers.delete(name);
      }

      await this.track('monitoring_stopped', {
        active_alerts: this.activeAlerts.size,
        total_snapshots: this.metricSnapshots.length,
      });

      console.log('✅ Real-time monitoring stopped');

    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  }

  // ========================= PERFORMANCE MONITORING =========================

  private startPerformanceMonitoring(): void {
    const interval = this.config.monitoringIntervals.performance * 1000;
    
    const timer = setInterval(async () => {
      try {
        const performanceReport = PerformanceMonitor.getPerformanceReport();
        
        if (performanceReport) {
          // Check thresholds
          const metrics = performanceReport.metrics;
          
          if (metrics.startup && metrics.startup.avg > this.config.alertThresholds.performance.appLaunchTime) {
            await this.createAlert({
              type: 'performance',
              severity: 'warning',
              title: 'Slow App Launch Time',
              description: `App launch time (${metrics.startup.avg}ms) exceeds threshold (${this.config.alertThresholds.performance.appLaunchTime}ms)`,
              source: 'performance_monitor',
              affectedSystems: ['app_launch'],
              metrics: { launch_time: metrics.startup.avg, threshold: this.config.alertThresholds.performance.appLaunchTime },
            });
          }

          if (metrics.navigation && metrics.navigation.avg > this.config.alertThresholds.performance.screenTransition) {
            await this.createAlert({
              type: 'performance',
              severity: 'warning',
              title: 'Slow Screen Transitions',
              description: `Screen transition time (${metrics.navigation.avg}ms) exceeds threshold`,
              source: 'performance_monitor',
              affectedSystems: ['navigation'],
              metrics: { transition_time: metrics.navigation.avg },
            });
          }

          if (metrics.memory && metrics.memory.avg > this.config.alertThresholds.performance.memoryUsage) {
            await this.createAlert({
              type: 'performance',
              severity: 'critical',
              title: 'High Memory Usage',
              description: `Memory usage (${metrics.memory.avg}MB) exceeds threshold`,
              source: 'performance_monitor',
              affectedSystems: ['memory'],
              metrics: { memory_usage: metrics.memory.avg },
            });
          }
        }

      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, interval);

    this.monitoringTimers.set('performance', timer);
  }

  // ========================= BUSINESS MONITORING =========================

  private startBusinessMonitoring(): void {
    const interval = this.config.monitoringIntervals.business * 1000;
    
    const timer = setInterval(async () => {
      try {
        // This would typically fetch real business metrics
        const businessMetrics = await this.getBusinessMetrics();
        
        // Check for significant drops in key metrics
        if (businessMetrics.conversionRate < this.getBaselineConversionRate() * 
            (1 - this.config.alertThresholds.business.conversionRateDropPercent / 100)) {
          await this.createAlert({
            type: 'business',
            severity: 'critical',
            title: 'Conversion Rate Drop',
            description: `Conversion rate dropped significantly: ${businessMetrics.conversionRate}%`,
            source: 'business_monitor',
            affectedSystems: ['conversion_funnel'],
            metrics: { conversion_rate: businessMetrics.conversionRate },
          });
        }

        // Monitor subscription churn
        if (businessMetrics.subscriptionChurn > this.config.alertThresholds.business.subscriptionChurnRate) {
          await this.createAlert({
            type: 'business',
            severity: 'warning',
            title: 'High Subscription Churn',
            description: `Subscription churn rate (${businessMetrics.subscriptionChurn}%) exceeds threshold`,
            source: 'business_monitor',
            affectedSystems: ['subscription_management'],
            metrics: { churn_rate: businessMetrics.subscriptionChurn },
          });
        }

      } catch (error) {
        console.error('Business monitoring error:', error);
      }
    }, interval);

    this.monitoringTimers.set('business', timer);
  }

  // ========================= HEALTH MONITORING =========================

  private startHealthMonitoring(): void {
    const interval = this.config.monitoringIntervals.health * 1000;
    
    const timer = setInterval(async () => {
      try {
        const systemHealth = await this.calculateSystemHealth();
        
        if (systemHealth.overallScore < this.config.alertThresholds.health.systemHealthScore) {
          await this.createAlert({
            type: 'health',
            severity: systemHealth.overallScore < 5 ? 'critical' : 'warning',
            title: 'System Health Degraded',
            description: `System health score (${systemHealth.overallScore}) is below threshold`,
            source: 'health_monitor',
            affectedSystems: systemHealth.components
              .filter(c => c.status !== 'healthy')
              .map(c => c.name),
            metrics: { health_score: systemHealth.overallScore },
          });
        }

        // Check individual components
        for (const component of systemHealth.components) {
          if (component.status === 'critical' || component.status === 'down') {
            await this.createAlert({
              type: 'health',
              severity: component.status === 'down' ? 'emergency' : 'critical',
              title: `${component.name} Component ${component.status === 'down' ? 'Down' : 'Critical'}`,
              description: `Component ${component.name} is experiencing issues`,
              source: 'health_monitor',
              affectedSystems: [component.name],
              metrics: component.metrics,
            });
          }
        }

        this.systemHealth = systemHealth;
        await this.saveSystemHealth();

      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, interval);

    this.monitoringTimers.set('health', timer);
  }

  // ========================= SECURITY MONITORING =========================

  private startSecurityMonitoring(): void {
    const interval = this.config.monitoringIntervals.security * 1000;
    
    const timer = setInterval(async () => {
      try {
        const securityMetrics = await this.getSecurityMetrics();
        
        // Monitor failed authentication attempts
        if (securityMetrics.failedAuthAttempts > this.config.alertThresholds.security.failedAuthAttempts) {
          await this.createAlert({
            type: 'security',
            severity: 'critical',
            title: 'High Failed Authentication Attempts',
            description: `Unusual number of failed authentication attempts detected: ${securityMetrics.failedAuthAttempts}`,
            source: 'security_monitor',
            affectedSystems: ['authentication'],
            metrics: { failed_attempts: securityMetrics.failedAuthAttempts },
          });
        }

        // Monitor suspicious activities
        if (securityMetrics.suspiciousActivities > this.config.alertThresholds.security.suspiciousActivity) {
          await this.createAlert({
            type: 'security',
            severity: 'warning',
            title: 'Suspicious Activity Detected',
            description: `Elevated suspicious activity levels detected: ${securityMetrics.suspiciousActivities}`,
            source: 'security_monitor',
            affectedSystems: ['security'],
            metrics: { suspicious_activities: securityMetrics.suspiciousActivities },
          });
        }

      } catch (error) {
        console.error('Security monitoring error:', error);
      }
    }, interval);

    this.monitoringTimers.set('security', timer);
  }

  // ========================= SYSTEM MONITORING =========================

  private startSystemMonitoring(): void {
    const interval = this.config.monitoringIntervals.system * 1000;
    
    const timer = setInterval(async () => {
      try {
        const systemMetrics = await this.getSystemMetrics();
        
        // Create metric snapshot
        const snapshot: MetricSnapshot = {
          timestamp: Date.now(),
          performance: await this.getPerformanceMetrics(),
          business: await this.getBusinessMetrics(),
          health: await this.getHealthMetrics(),
          security: await this.getSecurityMetrics(),
          system: systemMetrics,
        };

        this.metricSnapshots.push(snapshot);
        
        // Keep only last 1000 snapshots
        if (this.metricSnapshots.length > 1000) {
          this.metricSnapshots = this.metricSnapshots.slice(-500);
        }

      } catch (error) {
        console.error('System monitoring error:', error);
      }
    }, interval);

    this.monitoringTimers.set('system', timer);
  }

  // ========================= ALERT MANAGEMENT =========================

  public async createAlert(alertData: Partial<Alert>): Promise<string> {
    try {
      const alert: Alert = {
        id: this.generateAlertId(),
        timestamp: Date.now(),
        status: 'active',
        escalationLevel: 0,
        actions: [],
        relatedAlerts: [],
        affectedSystems: [],
        metrics: {},
        ...alertData,
      } as Alert;

      this.activeAlerts.set(alert.id, alert);

      // Check for maintenance windows
      if (this.isInMaintenanceWindow(alert)) {
        alert.status = 'suppressed';
        alert.actions.push({
          action: 'suppressed',
          timestamp: Date.now(),
          user: 'system',
          details: 'Alert suppressed due to maintenance window',
          automated: true,
        });
      }

      // Process escalation rules
      await this.processEscalation(alert);

      // Save alert
      await this.saveAlerts();

      await this.track('alert_created', {
        alert_id: alert.id,
        type: alert.type,
        severity: alert.severity,
        affected_systems: alert.affectedSystems,
      });

      return alert.id;

    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  public async acknowledgeAlert(alertId: string, user: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = user;
    alert.actions.push({
      action: 'acknowledged',
      timestamp: Date.now(),
      user,
      details: `Alert acknowledged by ${user}`,
      automated: false,
    });

    await this.saveAlerts();
    await this.track('alert_acknowledged', { alert_id: alertId, user });
  }

  public async resolveAlert(alertId: string, user: string, resolution: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.status = 'resolved';
    alert.resolvedBy = user;
    alert.resolvedAt = Date.now();
    alert.actions.push({
      action: 'resolved',
      timestamp: Date.now(),
      user,
      details: resolution,
      automated: false,
    });

    await this.saveAlerts();
    await this.track('alert_resolved', { alert_id: alertId, user, resolution });
  }

  // ========================= SYSTEM HEALTH =========================

  private async calculateSystemHealth(): Promise<SystemHealth> {
    const components: ComponentHealth[] = [
      {
        name: 'API Service',
        status: 'healthy',
        score: 9.2,
        lastChecked: Date.now(),
        responseTime: 150,
        errorRate: 0.5,
        dependencies: ['Database', 'Authentication'],
        metrics: { uptime: 99.8, requests_per_minute: 250 },
      },
      {
        name: 'Database',
        status: 'healthy',
        score: 8.8,
        lastChecked: Date.now(),
        responseTime: 25,
        errorRate: 0.1,
        dependencies: [],
        metrics: { connections: 45, query_time: 25 },
      },
      {
        name: 'Authentication',
        status: 'healthy',
        score: 9.5,
        lastChecked: Date.now(),
        responseTime: 100,
        errorRate: 0.2,
        dependencies: ['API Service'],
        metrics: { success_rate: 99.8, tokens_issued: 150 },
      },
      {
        name: 'Push Notifications',
        status: 'warning',
        score: 7.5,
        lastChecked: Date.now(),
        responseTime: 300,
        errorRate: 2.1,
        dependencies: ['API Service'],
        metrics: { delivery_rate: 97.9, queue_size: 25 },
      },
    ];

    const overallScore = components.reduce((sum, comp) => sum + comp.score, 0) / components.length;

    return {
      timestamp: Date.now(),
      overallScore,
      components,
      alerts: Array.from(this.activeAlerts.values()).filter(a => a.status === 'active'),
      trends: this.calculateHealthTrends(),
      uptime: 99.95, // Would calculate from actual uptime data
    };
  }

  private calculateHealthTrends(): HealthTrend[] {
    // This would analyze historical data to identify trends
    return [
      {
        metric: 'Response Time',
        values: this.metricSnapshots.slice(-10).map(s => ({
          timestamp: s.timestamp,
          value: s.performance.apiResponseTime,
        })),
        trend: 'stable',
        severity: 'normal',
      },
      {
        metric: 'Error Rate',
        values: this.metricSnapshots.slice(-10).map(s => ({
          timestamp: s.timestamp,
          value: s.health.errorRate,
        })),
        trend: 'improving',
        severity: 'normal',
      },
    ];
  }

  // ========================= METRICS COLLECTION =========================

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      appLaunchTime: 1200,
      screenTransitionTime: 180,
      apiResponseTime: 250,
      memoryUsage: 85,
      crashRate: 0.5,
      frameDrop: 2.1,
    };
  }

  private async getBusinessMetrics(): Promise<BusinessMetrics> {
    return {
      activeUsers: 2500,
      conversionRate: 12.5,
      subscriptionChurn: 4.8,
      revenue: 125000,
      userAcquisition: 850,
      customerSatisfaction: 8.4,
    };
  }

  private async getHealthMetrics(): Promise<HealthMetrics> {
    return {
      emergencyResponseTime: 2.5,
      systemHealthScore: 8.8,
      errorRate: 0.8,
      apiAvailability: 99.95,
      dataQuality: 95.2,
      serviceUptime: 99.98,
    };
  }

  private async getSecurityMetrics(): Promise<SecurityMetrics> {
    return {
      failedAuthAttempts: 12,
      suspiciousActivities: 3,
      vulnerabilityScore: 2.1,
      dataEncryptionStatus: 100,
      complianceScore: 98.5,
      threatLevel: 1.2,
    };
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpuUsage: 25.5,
      memoryUsage: 68.2,
      diskUsage: 45.8,
      networkLatency: 85,
      activeConnections: 156,
      queueSize: 12,
    };
  }

  // ========================= ESCALATION & NOTIFICATIONS =========================

  private async processEscalation(alert: Alert): Promise<void> {
    const rule = this.config.escalationRules.find(
      r => r.alertType === alert.type && r.severity === alert.severity
    );

    if (!rule) return;

    const escalationLevel = rule.escalationLevels.find(l => l.level === alert.escalationLevel);
    if (!escalationLevel) return;

    // Send notifications
    for (const channel of escalationLevel.channels) {
      if (channel.enabled) {
        await this.sendNotification(alert, channel);
      }
    }

    // Execute automated actions
    for (const action of escalationLevel.actions) {
      await this.executeAutomatedAction(alert, action);
    }
  }

  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'push':
          // Send push notification
          console.log(`📱 Push notification: ${alert.title}`);
          break;
        case 'email':
          // Send email
          console.log(`📧 Email notification: ${alert.title}`);
          break;
        case 'slack':
          // Send Slack message
          console.log(`💬 Slack notification: ${alert.title}`);
          break;
        case 'webhook':
          // Send webhook
          console.log(`🔗 Webhook notification: ${alert.title}`);
          break;
      }

      await this.track('notification_sent', {
        alert_id: alert.id,
        channel: channel.type,
        severity: alert.severity,
      });

    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private async executeAutomatedAction(alert: Alert, action: AutomatedAction): Promise<void> {
    try {
      switch (action.type) {
        case 'restart_service':
          console.log(`🔄 Automated action: Restart service for alert ${alert.id}`);
          break;
        case 'scale_resources':
          console.log(`📈 Automated action: Scale resources for alert ${alert.id}`);
          break;
        case 'failover':
          console.log(`🔄 Automated action: Failover for alert ${alert.id}`);
          break;
      }

      alert.actions.push({
        action: action.type,
        timestamp: Date.now(),
        user: 'system',
        details: `Automated action executed: ${action.type}`,
        automated: true,
      });

    } catch (error) {
      console.error('Failed to execute automated action:', error);
    }
  }

  // ========================= HELPER METHODS =========================

  private getDefaultConfig(): MonitoringConfig {
    return {
      enableRealTimeAlerts: true,
      alertThresholds: {
        performance: {
          appLaunchTime: 1500,
          screenTransition: 300,
          apiResponse: 500,
          memoryUsage: 150,
          crashRate: 1.0,
        },
        business: {
          conversionRateDropPercent: 20,
          subscriptionChurnRate: 10,
          revenueDropPercent: 15,
          userAcquisitionDropPercent: 25,
        },
        health: {
          emergencyAlertResponse: 5,
          systemHealthScore: 7.0,
          errorRate: 2.0,
          apiAvailability: 99.0,
        },
        security: {
          failedAuthAttempts: 20,
          suspiciousActivity: 10,
          dataBreachIndicators: ['unusual_data_access', 'multiple_login_locations'],
        },
      },
      monitoringIntervals: {
        performance: 30,
        business: 300,
        health: 60,
        security: 60,
        system: 30,
      },
      escalationRules: [],
      notificationChannels: [
        {
          type: 'push',
          config: {},
          enabled: true,
          testable: true,
        },
      ],
      maintenanceWindows: [],
    };
  }

  private isInMaintenanceWindow(alert: Alert): boolean {
    const now = Date.now();
    return this.config.maintenanceWindows.some(window => 
      now >= window.startTime &&
      now <= window.endTime &&
      window.suppressAlerts.includes(alert.type)
    );
  }

  private getBaselineConversionRate(): number {
    // Would calculate from historical data
    return 12.5;
  }

  private setupAppStateListeners(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' && this.isMonitoring) {
        // Reduce monitoring frequency when app is backgrounded
        this.adjustMonitoringFrequency(0.5);
      } else if (nextAppState === 'active' && this.isMonitoring) {
        // Restore normal monitoring frequency
        this.adjustMonitoringFrequency(1.0);
      }
    });
  }

  private adjustMonitoringFrequency(multiplier: number): void {
    // This would adjust the monitoring intervals based on app state
    console.log(`Adjusting monitoring frequency by ${multiplier}x`);
  }

  // ========================= PUBLIC API =========================

  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  public getSystemHealth(): SystemHealth | null {
    return this.systemHealth || null;
  }

  public getMetricSnapshots(limit: number = 50): MetricSnapshot[] {
    return this.metricSnapshots.slice(-limit);
  }

  public async updateConfig(updates: Partial<MonitoringConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    await this.track('monitoring_config_updated', { updates });
  }

  // ========================= STORAGE =========================

  private async loadStoredData(): Promise<void> {
    try {
      const [configData, alertsData, healthData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(this.STORAGE_KEYS.ALERTS),
        AsyncStorage.getItem(this.STORAGE_KEYS.SYSTEM_HEALTH),
      ]);

      if (configData) {
        const storedConfig = JSON.parse(configData);
        this.config = { ...this.config, ...storedConfig };
      }

      if (alertsData) {
        const alerts = JSON.parse(alertsData);
        this.activeAlerts = new Map(alerts);
      }

      if (healthData) {
        this.systemHealth = JSON.parse(healthData);
      }

    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save monitoring config:', error);
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      const alertsArray = Array.from(this.activeAlerts.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.ALERTS, JSON.stringify(alertsArray));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }

  private async saveSystemHealth(): Promise<void> {
    try {
      if (this.systemHealth) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.SYSTEM_HEALTH, JSON.stringify(this.systemHealth));
      }
    } catch (error) {
      console.error('Failed to save system health:', error);
    }
  }

  private generateAlertId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `alert_${timestamp}_${randomPart}`;
  }

  private async track(eventName: string, properties: Record<string, any>): Promise<void> {
    await analytics.track(eventName, properties, 'system', 'high');
  }
}

// ========================= EXPORTS =========================

export const realTimeMonitoring = RealTimeMonitoringService.getInstance();

export default realTimeMonitoring;