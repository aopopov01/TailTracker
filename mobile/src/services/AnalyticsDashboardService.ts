/**
 * Analytics Dashboard Service for TailTracker
 * 
 * Provides comprehensive dashboard creation, data visualization,
 * automated reporting, and executive insights
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './AnalyticsService';
import { businessIntelligence } from './BusinessIntelligenceService';
import { errorMonitoring } from './ErrorMonitoringService';
import { healthWellnessAnalytics } from './HealthWellnessAnalytics';
import { privacyCompliance } from './PrivacyComplianceService';
import { realTimeMonitoring } from './RealTimeMonitoringService';
import { userBehaviorAnalytics } from './UserBehaviorAnalytics';

// ========================= TYPES =========================

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  type: DashboardType;
  audience: DashboardAudience;
  widgets: Widget[];
  layout: LayoutConfig;
  refreshInterval: number; // seconds
  permissions: DashboardPermissions;
  filters: DashboardFilter[];
  created: number;
  lastModified: number;
  isPublic: boolean;
  tags: string[];
}

export type DashboardType = 
  | 'executive'
  | 'operational'
  | 'technical'
  | 'health_insights'
  | 'business_metrics'
  | 'user_analytics'
  | 'performance'
  | 'security'
  | 'compliance';

export type DashboardAudience = 
  | 'executives'
  | 'product_managers'
  | 'developers'
  | 'analysts'
  | 'veterinarians'
  | 'support_team'
  | 'marketing'
  | 'all_users';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  dataSource: DataSource;
  visualization: VisualizationConfig;
  position: Position;
  size: Size;
  filters: WidgetFilter[];
  drillDownEnabled: boolean;
  exportEnabled: boolean;
  alertsEnabled: boolean;
  refreshInterval?: number;
}

export type WidgetType = 
  | 'metric_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'heatmap'
  | 'table'
  | 'funnel'
  | 'cohort_table'
  | 'gauge'
  | 'progress_bar'
  | 'trend_indicator'
  | 'alert_list'
  | 'map'
  | 'timeline';

export interface DataSource {
  type: 'analytics' | 'business' | 'health' | 'monitoring' | 'compliance' | 'custom';
  endpoint: string;
  parameters: Record<string, any>;
  aggregation?: AggregationConfig;
  timeRange: TimeRange;
  refreshStrategy: 'real_time' | 'polling' | 'on_demand';
}

export interface AggregationConfig {
  groupBy: string[];
  metrics: MetricAggregation[];
  timeWindow: string;
}

export interface MetricAggregation {
  field: string;
  operation: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'percentile';
  percentile?: number;
}

export interface TimeRange {
  type: 'relative' | 'absolute';
  start: string | number;
  end: string | number;
  timezone: string;
}

export interface VisualizationConfig {
  colorScheme: ColorScheme;
  axes: AxisConfig[];
  legends: LegendConfig;
  animations: boolean;
  responsive: boolean;
  customOptions: Record<string, any>;
}

export interface ColorScheme {
  primary: string[];
  secondary: string[];
  accent: string[];
  semantic: SemanticColors;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface AxisConfig {
  type: 'x' | 'y' | 'z';
  label: string;
  scale: 'linear' | 'logarithmic' | 'time';
  min?: number;
  max?: number;
  format: string;
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  orientation: 'horizontal' | 'vertical';
}

export interface Position {
  row: number;
  column: number;
}

export interface Size {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface DashboardFilter {
  field: string;
  type: 'select' | 'multi_select' | 'date_range' | 'text' | 'numeric_range';
  label: string;
  values?: any[];
  defaultValue?: any;
  required: boolean;
}

export interface WidgetFilter extends DashboardFilter {
  widgetId: string;
}

export interface LayoutConfig {
  columns: number;
  rowHeight: number;
  gap: number;
  breakpoints: Breakpoint[];
}

export interface Breakpoint {
  width: number;
  columns: number;
}

export interface DashboardPermissions {
  canView: string[];
  canEdit: string[];
  canShare: string[];
  canExport: string[];
}

export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  schedule: ReportSchedule;
  recipients: Recipient[];
  dashboardId?: string;
  widgets: string[];
  format: ReportFormat;
  template: ReportTemplate;
  created: number;
  lastGenerated?: number;
  nextGeneration: number;
  isActive: boolean;
}

export type ReportType = 
  | 'executive_summary'
  | 'operational_report'
  | 'health_insights'
  | 'business_metrics'
  | 'compliance_report'
  | 'incident_report'
  | 'custom';

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  timezone: string;
}

export interface Recipient {
  email: string;
  name: string;
  role: string;
  preferences: RecipientPreferences;
}

export interface RecipientPreferences {
  format: ReportFormat[];
  deliveryMethod: 'email' | 'slack' | 'push' | 'download_link';
  summaryOnly: boolean;
}

export type ReportFormat = 'pdf' | 'html' | 'json' | 'csv' | 'excel';

export interface ReportTemplate {
  header: ReportHeader;
  sections: ReportSection[];
  footer: ReportFooter;
  styling: ReportStyling;
}

export interface ReportHeader {
  title: string;
  subtitle?: string;
  logo?: string;
  generatedAt: boolean;
  timeRange: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  widgets: string[];
  analysis?: string;
  recommendations?: string[];
}

export interface ReportFooter {
  includeDisclaimer: boolean;
  includeMethodology: boolean;
  includeContact: boolean;
  customText?: string;
}

export interface ReportStyling {
  colorScheme: 'light' | 'dark' | 'branded';
  typography: TypographyConfig;
  branding: BrandingConfig;
}

export interface TypographyConfig {
  fontFamily: string;
  baseFontSize: number;
  headingScale: number[];
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  watermark?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  widgetId: string;
  metric: string;
  condition: AlertCondition;
  threshold: number | string;
  severity: 'info' | 'warning' | 'critical';
  frequency: number; // minutes
  recipients: string[];
  isActive: boolean;
  created: number;
  lastTriggered?: number;
}

export interface AlertCondition {
  operator: '>' | '<' | '=' | '!=' | '>=' | '<=' | 'contains' | 'not_contains';
  timeWindow: number; // minutes
  consecutiveViolations: number;
}

// ========================= MAIN SERVICE =========================

export class AnalyticsDashboardService {
  private static instance: AnalyticsDashboardService;
  private dashboards: Map<string, Dashboard> = new Map();
  private reports: Map<string, Report> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private widgetDataCache: Map<string, any> = new Map();
  private reportGenerationQueue: Report[] = [];

  private readonly STORAGE_KEYS = {
    DASHBOARDS: '@tailtracker:dashboards',
    REPORTS: '@tailtracker:reports',
    ALERT_RULES: '@tailtracker:alert_rules',
    WIDGET_CACHE: '@tailtracker:widget_cache',
  };

  private constructor() {
    this.loadStoredData();
    this.initializeDefaultDashboards();
    this.startReportScheduler();
  }

  public static getInstance(): AnalyticsDashboardService {
    if (!AnalyticsDashboardService.instance) {
      AnalyticsDashboardService.instance = new AnalyticsDashboardService();
    }
    return AnalyticsDashboardService.instance;
  }

  // ========================= DASHBOARD MANAGEMENT =========================

  public async createDashboard(dashboardConfig: Partial<Dashboard>): Promise<string> {
    try {
      const dashboard: Dashboard = {
        id: this.generateDashboardId(),
        name: 'Untitled Dashboard',
        description: '',
        type: 'operational',
        audience: 'all_users',
        widgets: [],
        layout: this.getDefaultLayout(),
        refreshInterval: 300, // 5 minutes
        permissions: this.getDefaultPermissions(),
        filters: [],
        created: Date.now(),
        lastModified: Date.now(),
        isPublic: false,
        tags: [],
        ...dashboardConfig,
      };

      this.dashboards.set(dashboard.id, dashboard);
      await this.saveDashboards();

      await this.track('dashboard_created', {
        dashboard_id: dashboard.id,
        type: dashboard.type,
        audience: dashboard.audience,
        widgets_count: dashboard.widgets.length,
      });

      return dashboard.id;

    } catch (error) {
      console.error('Failed to create dashboard:', error);
      throw error;
    }
  }

  public async updateDashboard(
    dashboardId: string,
    updates: Partial<Dashboard>
  ): Promise<void> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      const updatedDashboard = {
        ...dashboard,
        ...updates,
        lastModified: Date.now(),
      };

      this.dashboards.set(dashboardId, updatedDashboard);
      await this.saveDashboards();

      // Invalidate widget cache for this dashboard
      this.invalidateWidgetCache(dashboardId);

      await this.track('dashboard_updated', {
        dashboard_id: dashboardId,
        changes: Object.keys(updates),
      });

    } catch (error) {
      console.error('Failed to update dashboard:', error);
      throw error;
    }
  }

  public async deleteDashboard(dashboardId: string): Promise<void> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      this.dashboards.delete(dashboardId);
      await this.saveDashboards();

      // Clean up related reports
      const relatedReports = Array.from(this.reports.values())
        .filter(report => report.dashboardId === dashboardId);
      
      for (const report of relatedReports) {
        await this.deleteReport(report.id);
      }

      await this.track('dashboard_deleted', {
        dashboard_id: dashboardId,
        type: dashboard.type,
      });

    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      throw error;
    }
  }

  public getDashboard(dashboardId: string): Dashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  public getDashboards(filters?: {
    type?: DashboardType;
    audience?: DashboardAudience;
    tags?: string[];
  }): Dashboard[] {
    let dashboards = Array.from(this.dashboards.values());

    if (filters) {
      if (filters.type) {
        dashboards = dashboards.filter(d => d.type === filters.type);
      }
      if (filters.audience) {
        dashboards = dashboards.filter(d => d.audience === filters.audience);
      }
      if (filters.tags && filters.tags.length > 0) {
        dashboards = dashboards.filter(d => 
          filters.tags!.some(tag => d.tags.includes(tag))
        );
      }
    }

    return dashboards.sort((a, b) => b.lastModified - a.lastModified);
  }

  // ========================= WIDGET MANAGEMENT =========================

  public async addWidget(
    dashboardId: string,
    widgetConfig: Partial<Widget>
  ): Promise<string> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      const widget: Widget = {
        id: this.generateWidgetId(),
        type: 'metric_card',
        title: 'Untitled Widget',
        dataSource: this.getDefaultDataSource(),
        visualization: this.getDefaultVisualization(),
        position: this.getNextAvailablePosition(dashboard),
        size: this.getDefaultSize(widgetConfig.type || 'metric_card'),
        filters: [],
        drillDownEnabled: false,
        exportEnabled: true,
        alertsEnabled: false,
        ...widgetConfig,
      };

      dashboard.widgets.push(widget);
      dashboard.lastModified = Date.now();

      this.dashboards.set(dashboardId, dashboard);
      await this.saveDashboards();

      await this.track('widget_added', {
        dashboard_id: dashboardId,
        widget_id: widget.id,
        widget_type: widget.type,
      });

      return widget.id;

    } catch (error) {
      console.error('Failed to add widget:', error);
      throw error;
    }
  }

  public async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<Widget>
  ): Promise<void> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) {
        throw new Error(`Widget ${widgetId} not found`);
      }

      dashboard.widgets[widgetIndex] = {
        ...dashboard.widgets[widgetIndex],
        ...updates,
      };

      dashboard.lastModified = Date.now();
      this.dashboards.set(dashboardId, dashboard);
      await this.saveDashboards();

      // Clear cache for this widget
      this.widgetDataCache.delete(`${dashboardId}_${widgetId}`);

      await this.track('widget_updated', {
        dashboard_id: dashboardId,
        widget_id: widgetId,
        changes: Object.keys(updates),
      });

    } catch (error) {
      console.error('Failed to update widget:', error);
      throw error;
    }
  }

  public async removeWidget(dashboardId: string, widgetId: string): Promise<void> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
      dashboard.lastModified = Date.now();

      this.dashboards.set(dashboardId, dashboard);
      await this.saveDashboards();

      // Clean up related alert rules
      const relatedAlerts = Array.from(this.alertRules.values())
        .filter(rule => rule.widgetId === widgetId);
      
      for (const alert of relatedAlerts) {
        this.alertRules.delete(alert.id);
      }

      await this.track('widget_removed', {
        dashboard_id: dashboardId,
        widget_id: widgetId,
      });

    } catch (error) {
      console.error('Failed to remove widget:', error);
      throw error;
    }
  }

  // ========================= DATA FETCHING =========================

  public async getWidgetData(
    dashboardId: string,
    widgetId: string,
    forceRefresh: boolean = false
  ): Promise<any> {
    try {
      const cacheKey = `${dashboardId}_${widgetId}`;
      
      if (!forceRefresh && this.widgetDataCache.has(cacheKey)) {
        const cached = this.widgetDataCache.get(cacheKey);
        if (Date.now() - cached.timestamp < cached.ttl) {
          return cached.data;
        }
      }

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      const widget = dashboard.widgets.find(w => w.id === widgetId);
      if (!widget) {
        throw new Error(`Widget ${widgetId} not found`);
      }

      const data = await this.fetchDataForWidget(widget);

      // Cache the data
      this.widgetDataCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: (widget.refreshInterval || dashboard.refreshInterval) * 1000,
      });

      return data;

    } catch (error) {
      console.error('Failed to get widget data:', error);
      throw error;
    }
  }

  private async fetchDataForWidget(widget: Widget): Promise<any> {
    const { dataSource } = widget;

    switch (dataSource.type) {
      case 'analytics':
        return await this.fetchAnalyticsData(dataSource);
      case 'business':
        return await this.fetchBusinessData(dataSource);
      case 'health':
        return await this.fetchHealthData(dataSource);
      case 'monitoring':
        return await this.fetchMonitoringData(dataSource);
      case 'compliance':
        return await this.fetchComplianceData(dataSource);
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  private async fetchAnalyticsData(dataSource: DataSource): Promise<any> {
    switch (dataSource.endpoint) {
      case 'user_metrics':
        return await userBehaviorAnalytics.getEngagementMetrics(
          Date.now() - (30 * 24 * 60 * 60 * 1000),
          Date.now()
        );
      case 'funnel_analysis':
        return await userBehaviorAnalytics.analyzeFunnel(
          dataSource.parameters.funnelName,
          Date.now() - (7 * 24 * 60 * 60 * 1000),
          Date.now()
        );
      case 'cohort_analysis':
        return await userBehaviorAnalytics.generateCohortAnalysis(
          'monthly',
          Date.now() - (12 * 30 * 24 * 60 * 60 * 1000),
          12
        );
      default:
        return { message: 'Analytics data placeholder' };
    }
  }

  private async fetchBusinessData(dataSource: DataSource): Promise<any> {
    switch (dataSource.endpoint) {
      case 'revenue_metrics':
        return await businessIntelligence.getRevenueMetrics(
          Date.now() - (30 * 24 * 60 * 60 * 1000),
          Date.now()
        );
      case 'subscription_metrics':
        return await businessIntelligence.getSubscriptionMetrics();
      case 'product_metrics':
        return await businessIntelligence.getProductMetrics();
      case 'forecast':
        return await businessIntelligence.generateBusinessForecast(12);
      default:
        return { message: 'Business data placeholder' };
    }
  }

  private async fetchHealthData(dataSource: DataSource): Promise<any> {
    switch (dataSource.endpoint) {
      case 'wellness_insights':
        return await healthWellnessAnalytics.getWellnessInsights();
      case 'health_metrics':
        if (dataSource.parameters.petId) {
          return await healthWellnessAnalytics.getHealthMetrics(dataSource.parameters.petId);
        }
        return { message: 'Pet ID required for health metrics' };
      default:
        return { message: 'Health data placeholder' };
    }
  }

  private async fetchMonitoringData(dataSource: DataSource): Promise<any> {
    switch (dataSource.endpoint) {
      case 'system_health':
        return realTimeMonitoring.getSystemHealth();
      case 'active_alerts':
        return realTimeMonitoring.getActiveAlerts();
      case 'metric_snapshots':
        return realTimeMonitoring.getMetricSnapshots(50);
      default:
        return { message: 'Monitoring data placeholder' };
    }
  }

  private async fetchComplianceData(dataSource: DataSource): Promise<any> {
    switch (dataSource.endpoint) {
      case 'privacy_config':
        return privacyCompliance.getConfig();
      case 'data_subject_requests':
        return privacyCompliance.getDataSubjectRequests();
      case 'audit_log':
        return await privacyCompliance.getPrivacyAuditLog();
      default:
        return { message: 'Compliance data placeholder' };
    }
  }

  // ========================= REPORT MANAGEMENT =========================

  public async createReport(reportConfig: Partial<Report>): Promise<string> {
    try {
      const report: Report = {
        id: this.generateReportId(),
        name: 'Untitled Report',
        description: '',
        type: 'operational_report',
        schedule: {
          frequency: 'weekly',
          time: '09:00',
          dayOfWeek: 1, // Monday
          timezone: 'UTC',
        },
        recipients: [],
        widgets: [],
        format: 'pdf',
        template: this.getDefaultReportTemplate(),
        created: Date.now(),
        nextGeneration: this.calculateNextGeneration({
          frequency: 'weekly',
          time: '09:00',
          dayOfWeek: 1,
          timezone: 'UTC',
        }),
        isActive: true,
        ...reportConfig,
      };

      this.reports.set(report.id, report);
      await this.saveReports();

      await this.track('report_created', {
        report_id: report.id,
        type: report.type,
        frequency: report.schedule.frequency,
        recipients: report.recipients.length,
      });

      return report.id;

    } catch (error) {
      console.error('Failed to create report:', error);
      throw error;
    }
  }

  public async generateReport(reportId: string): Promise<any> {
    try {
      const report = this.reports.get(reportId);
      if (!report) {
        throw new Error(`Report ${reportId} not found`);
      }

      const reportData = await this.compileReportData(report);
      const formattedReport = await this.formatReport(report, reportData);

      // Update last generated timestamp
      report.lastGenerated = Date.now();
      report.nextGeneration = this.calculateNextGeneration(report.schedule);
      this.reports.set(reportId, report);
      await this.saveReports();

      // Send to recipients
      if (report.recipients.length > 0) {
        await this.distributeReport(report, formattedReport);
      }

      await this.track('report_generated', {
        report_id: reportId,
        type: report.type,
        format: report.format,
        recipients: report.recipients.length,
      });

      return formattedReport;

    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  private async compileReportData(report: Report): Promise<any> {
    const data: any = {
      metadata: {
        reportId: report.id,
        name: report.name,
        type: report.type,
        generatedAt: Date.now(),
        timeRange: {
          start: Date.now() - (30 * 24 * 60 * 60 * 1000),
          end: Date.now(),
        },
      },
      sections: [],
    };

    // Compile data for each section
    for (const section of report.template.sections) {
      const sectionData = {
        id: section.id,
        title: section.title,
        description: section.description,
        widgets: [],
        analysis: section.analysis,
        recommendations: section.recommendations,
      };

      // Get data for each widget in the section
      for (const widgetId of section.widgets) {
        try {
          const widgetData = await this.getWidgetDataForReport(widgetId);
          sectionData.widgets.push({
            id: widgetId,
            data: widgetData,
          });
        } catch (error) {
          console.error(`Failed to get data for widget ${widgetId}:`, error);
          sectionData.widgets.push({
            id: widgetId,
            error: 'Data unavailable',
          });
        }
      }

      data.sections.push(sectionData);
    }

    return data;
  }

  private async getWidgetDataForReport(widgetId: string): Promise<any> {
    // Find widget across all dashboards
    for (const dashboard of this.dashboards.values()) {
      const widget = dashboard.widgets.find(w => w.id === widgetId);
      if (widget) {
        return await this.fetchDataForWidget(widget);
      }
    }
    throw new Error(`Widget ${widgetId} not found`);
  }

  private async formatReport(report: Report, data: any): Promise<any> {
    switch (report.format) {
      case 'json':
        return data;
      case 'html':
        return this.formatAsHTML(report, data);
      case 'pdf':
        return this.formatAsPDF(report, data);
      case 'csv':
        return this.formatAsCSV(report, data);
      default:
        return data;
    }
  }

  private formatAsHTML(report: Report, data: any): string {
    // Generate HTML report
    const html = `
      <html>
        <head>
          <title>${data.metadata.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; margin-bottom: 20px; }
            .section { margin: 20px 0; }
            .widget { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.metadata.name}</h1>
            <p>Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
          </div>
          ${data.sections.map((section: any) => `
            <div class="section">
              <h2>${section.title}</h2>
              ${section.description ? `<p>${section.description}</p>` : ''}
              ${section.widgets.map((widget: any) => `
                <div class="widget">
                  <h3>Widget: ${widget.id}</h3>
                  <pre>${JSON.stringify(widget.data, null, 2)}</pre>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </body>
      </html>
    `;
    return html;
  }

  private formatAsPDF(report: Report, data: any): any {
    // In a real implementation, you'd use a PDF generation library
    return {
      format: 'pdf',
      content: data,
      pages: 1,
      size: 'A4',
    };
  }

  private formatAsCSV(report: Report, data: any): string {
    // Convert data to CSV format
    let csv = 'Report,Section,Widget,Metric,Value\n';
    
    for (const section of data.sections) {
      for (const widget of section.widgets) {
        if (widget.data && typeof widget.data === 'object') {
          for (const [key, value] of Object.entries(widget.data)) {
            csv += `"${data.metadata.name}","${section.title}","${widget.id}","${key}","${value}"\n`;
          }
        }
      }
    }
    
    return csv;
  }

  private async distributeReport(report: Report, formattedReport: any): Promise<void> {
    for (const recipient of report.recipients) {
      try {
        await this.sendReportToRecipient(recipient, report, formattedReport);
      } catch (error) {
        console.error(`Failed to send report to ${recipient.email}:`, error);
      }
    }
  }

  private async sendReportToRecipient(
    recipient: Recipient,
    report: Report,
    formattedReport: any
  ): Promise<void> {
    switch (recipient.preferences.deliveryMethod) {
      case 'email':
        console.log(`📧 Sending report to ${recipient.email}`);
        // Implement email delivery
        break;
      case 'slack':
        console.log(`💬 Sending report to Slack for ${recipient.email}`);
        // Implement Slack delivery
        break;
      case 'push':
        console.log(`📱 Sending push notification to ${recipient.email}`);
        // Implement push notification
        break;
      case 'download_link':
        console.log(`🔗 Generating download link for ${recipient.email}`);
        // Implement download link generation
        break;
    }
  }

  // ========================= ALERT MANAGEMENT =========================

  public async createAlertRule(alertConfig: Partial<AlertRule>): Promise<string> {
    try {
      const alertRule: AlertRule = {
        id: this.generateAlertId(),
        name: 'Untitled Alert',
        description: '',
        widgetId: '',
        metric: '',
        condition: {
          operator: '>',
          timeWindow: 5,
          consecutiveViolations: 1,
        },
        threshold: 0,
        severity: 'warning',
        frequency: 5,
        recipients: [],
        isActive: true,
        created: Date.now(),
        ...alertConfig,
      };

      this.alertRules.set(alertRule.id, alertRule);
      await this.saveAlertRules();

      await this.track('alert_rule_created', {
        alert_id: alertRule.id,
        widget_id: alertRule.widgetId,
        severity: alertRule.severity,
      });

      return alertRule.id;

    } catch (error) {
      console.error('Failed to create alert rule:', error);
      throw error;
    }
  }

  // ========================= SCHEDULER =========================

  private startReportScheduler(): void {
    // Check for scheduled reports every minute
    setInterval(() => {
      this.processScheduledReports();
    }, 60000);
  }

  private async processScheduledReports(): Promise<void> {
    const now = Date.now();
    
    for (const report of this.reports.values()) {
      if (report.isActive && report.nextGeneration <= now) {
        try {
          this.reportGenerationQueue.push(report);
        } catch (error) {
          console.error(`Failed to queue report ${report.id}:`, error);
        }
      }
    }

    // Process queue
    while (this.reportGenerationQueue.length > 0) {
      const report = this.reportGenerationQueue.shift();
      if (report) {
        try {
          await this.generateReport(report.id);
        } catch (error) {
          console.error(`Failed to generate scheduled report ${report.id}:`, error);
        }
      }
    }
  }

  private calculateNextGeneration(schedule: ReportSchedule): number {
    const now = new Date();
    const next = new Date();

    switch (schedule.frequency) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilWeekDay = (schedule.dayOfWeek! - now.getDay() + 7) % 7;
        next.setDate(now.getDate() + (daysUntilWeekDay || 7));
        break;
      case 'monthly':
        next.setMonth(now.getMonth() + 1);
        next.setDate(schedule.dayOfMonth || 1);
        break;
      case 'quarterly':
        next.setMonth(now.getMonth() + 3);
        next.setDate(1);
        break;
      default:
        return now.getTime();
    }

    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      next.setHours(hours, minutes, 0, 0);
    }

    return next.getTime();
  }

  // ========================= INITIALIZATION =========================

  private async initializeDefaultDashboards(): Promise<void> {
    // Create default dashboards if none exist
    if (this.dashboards.size === 0) {
      await this.createExecutiveDashboard();
      await this.createOperationalDashboard();
      await this.createHealthDashboard();
      await this.createTechnicalDashboard();
    }
  }

  private async createExecutiveDashboard(): Promise<void> {
    const dashboardId = await this.createDashboard({
      name: 'Executive Summary',
      description: 'High-level business metrics and KPIs for executive leadership',
      type: 'executive',
      audience: 'executives',
      tags: ['executive', 'summary', 'kpis'],
    });

    // Add key business widgets
    await this.addWidget(dashboardId, {
      type: 'metric_card',
      title: 'Total Revenue',
      dataSource: {
        type: 'business',
        endpoint: 'revenue_metrics',
        parameters: {},
        timeRange: { type: 'relative', start: '-30d', end: 'now', timezone: 'UTC' },
        refreshStrategy: 'polling',
      },
    });

    await this.addWidget(dashboardId, {
      type: 'line_chart',
      title: 'User Growth',
      dataSource: {
        type: 'analytics',
        endpoint: 'user_metrics',
        parameters: {},
        timeRange: { type: 'relative', start: '-90d', end: 'now', timezone: 'UTC' },
        refreshStrategy: 'polling',
      },
    });
  }

  private async createOperationalDashboard(): Promise<void> {
    const dashboardId = await this.createDashboard({
      name: 'Operational Metrics',
      description: 'Day-to-day operational metrics and performance indicators',
      type: 'operational',
      audience: 'product_managers',
      tags: ['operations', 'daily', 'performance'],
    });

    await this.addWidget(dashboardId, {
      type: 'gauge',
      title: 'System Health Score',
      dataSource: {
        type: 'monitoring',
        endpoint: 'system_health',
        parameters: {},
        timeRange: { type: 'relative', start: '-1h', end: 'now', timezone: 'UTC' },
        refreshStrategy: 'real_time',
      },
    });
  }

  private async createHealthDashboard(): Promise<void> {
    const dashboardId = await this.createDashboard({
      name: 'Pet Health Insights',
      description: 'Comprehensive pet health analytics and wellness trends',
      type: 'health_insights',
      audience: 'veterinarians',
      tags: ['health', 'pets', 'wellness'],
    });

    await this.addWidget(dashboardId, {
      type: 'area_chart',
      title: 'Population Health Trends',
      dataSource: {
        type: 'health',
        endpoint: 'wellness_insights',
        parameters: {},
        timeRange: { type: 'relative', start: '-12m', end: 'now', timezone: 'UTC' },
        refreshStrategy: 'polling',
      },
    });
  }

  private async createTechnicalDashboard(): Promise<void> {
    const dashboardId = await this.createDashboard({
      name: 'Technical Performance',
      description: 'Application performance, errors, and system metrics',
      type: 'technical',
      audience: 'developers',
      tags: ['technical', 'performance', 'errors'],
    });

    await this.addWidget(dashboardId, {
      type: 'table',
      title: 'Active Alerts',
      dataSource: {
        type: 'monitoring',
        endpoint: 'active_alerts',
        parameters: {},
        timeRange: { type: 'relative', start: '-24h', end: 'now', timezone: 'UTC' },
        refreshStrategy: 'real_time',
      },
    });
  }

  // ========================= HELPER METHODS =========================

  private getDefaultLayout(): LayoutConfig {
    return {
      columns: 12,
      rowHeight: 100,
      gap: 10,
      breakpoints: [
        { width: 1200, columns: 12 },
        { width: 996, columns: 10 },
        { width: 768, columns: 8 },
        { width: 576, columns: 6 },
        { width: 0, columns: 4 },
      ],
    };
  }

  private getDefaultPermissions(): DashboardPermissions {
    return {
      canView: ['all'],
      canEdit: ['admin', 'analyst'],
      canShare: ['admin'],
      canExport: ['admin', 'analyst'],
    };
  }

  private getDefaultDataSource(): DataSource {
    return {
      type: 'analytics',
      endpoint: 'user_metrics',
      parameters: {},
      timeRange: { type: 'relative', start: '-7d', end: 'now', timezone: 'UTC' },
      refreshStrategy: 'polling',
    };
  }

  private getDefaultVisualization(): VisualizationConfig {
    return {
      colorScheme: {
        primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        secondary: ['#6B7280', '#9CA3AF', '#D1D5DB'],
        accent: ['#8B5CF6', '#EC4899', '#06B6D4'],
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      axes: [],
      legends: {
        show: true,
        position: 'bottom',
        orientation: 'horizontal',
      },
      animations: true,
      responsive: true,
      customOptions: {},
    };
  }

  private getDefaultSize(widgetType: WidgetType): Size {
    const sizeMap: Record<WidgetType, Size> = {
      metric_card: { width: 3, height: 2 },
      line_chart: { width: 6, height: 4 },
      bar_chart: { width: 6, height: 4 },
      pie_chart: { width: 4, height: 4 },
      area_chart: { width: 6, height: 4 },
      heatmap: { width: 8, height: 6 },
      table: { width: 12, height: 6 },
      funnel: { width: 6, height: 6 },
      cohort_table: { width: 12, height: 8 },
      gauge: { width: 4, height: 4 },
      progress_bar: { width: 6, height: 2 },
      trend_indicator: { width: 3, height: 2 },
      alert_list: { width: 6, height: 6 },
      map: { width: 8, height: 6 },
      timeline: { width: 12, height: 6 },
    };

    return sizeMap[widgetType] || { width: 4, height: 4 };
  }

  private getNextAvailablePosition(dashboard: Dashboard): Position {
    // Simple algorithm to find next available position
    const occupied = dashboard.widgets.map(w => w.position);
    let row = 0;
    let column = 0;

    while (occupied.some(pos => pos.row === row && pos.column === column)) {
      column += 3;
      if (column >= dashboard.layout.columns) {
        column = 0;
        row++;
      }
    }

    return { row, column };
  }

  private getDefaultReportTemplate(): ReportTemplate {
    return {
      header: {
        title: 'TailTracker Analytics Report',
        subtitle: 'Comprehensive insights and metrics',
        generatedAt: true,
        timeRange: true,
      },
      sections: [
        {
          id: 'executive_summary',
          title: 'Executive Summary',
          description: 'Key metrics and highlights',
          widgets: [],
        },
        {
          id: 'detailed_analysis',
          title: 'Detailed Analysis',
          description: 'In-depth data and trends',
          widgets: [],
        },
      ],
      footer: {
        includeDisclaimer: true,
        includeMethodology: false,
        includeContact: true,
      },
      styling: {
        colorScheme: 'branded',
        typography: {
          fontFamily: 'Arial, sans-serif',
          baseFontSize: 12,
          headingScale: [24, 20, 16, 14],
        },
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
        },
      },
    };
  }

  private invalidateWidgetCache(dashboardId: string): void {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return;

    for (const widget of dashboard.widgets) {
      const cacheKey = `${dashboardId}_${widget.id}`;
      this.widgetDataCache.delete(cacheKey);
    }
  }

  // ========================= STORAGE =========================

  private async loadStoredData(): Promise<void> {
    try {
      const [dashboardsData, reportsData, alertRulesData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.DASHBOARDS),
        AsyncStorage.getItem(this.STORAGE_KEYS.REPORTS),
        AsyncStorage.getItem(this.STORAGE_KEYS.ALERT_RULES),
      ]);

      if (dashboardsData) {
        const dashboards = JSON.parse(dashboardsData);
        this.dashboards = new Map(dashboards);
      }

      if (reportsData) {
        const reports = JSON.parse(reportsData);
        this.reports = new Map(reports);
      }

      if (alertRulesData) {
        const alertRules = JSON.parse(alertRulesData);
        this.alertRules = new Map(alertRules);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  private async saveDashboards(): Promise<void> {
    try {
      const dashboardsArray = Array.from(this.dashboards.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.DASHBOARDS, JSON.stringify(dashboardsArray));
    } catch (error) {
      console.error('Failed to save dashboards:', error);
    }
  }

  private async saveReports(): Promise<void> {
    try {
      const reportsArray = Array.from(this.reports.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.REPORTS, JSON.stringify(reportsArray));
    } catch (error) {
      console.error('Failed to save reports:', error);
    }
  }

  private async saveAlertRules(): Promise<void> {
    try {
      const alertRulesArray = Array.from(this.alertRules.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.ALERT_RULES, JSON.stringify(alertRulesArray));
    } catch (error) {
      console.error('Failed to save alert rules:', error);
    }
  }

  private generateDashboardId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `dash_${timestamp}_${randomPart}`;
  }

  private generateWidgetId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `widget_${timestamp}_${randomPart}`;
  }

  private generateReportId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `report_${timestamp}_${randomPart}`;
  }

  private generateAlertId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `alert_${timestamp}_${randomPart}`;
  }

  private async track(eventName: string, properties: Record<string, any>): Promise<void> {
    await analytics.track(eventName, properties, 'system', 'medium');
  }

  // ========================= PUBLIC API =========================

  public async deleteReport(reportId: string): Promise<void> {
    this.reports.delete(reportId);
    await this.saveReports();
  }

  public getReports(): Report[] {
    return Array.from(this.reports.values());
  }

  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }
}

// ========================= EXPORTS =========================

export const analyticsDashboard = AnalyticsDashboardService.getInstance();

export default analyticsDashboard;