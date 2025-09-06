/**
 * User Behavior Analytics Service for TailTracker
 * 
 * Provides comprehensive user journey mapping, funnel analysis,
 * cohort tracking, and engagement metrics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics, AnalyticsEvent } from './AnalyticsService';
import { errorMonitoring } from './ErrorMonitoringService';

// ========================= TYPES =========================

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  screenViews: ScreenView[];
  actions: UserAction[];
  totalEvents: number;
  bounced: boolean;
  converted: boolean;
  conversionValue?: number;
}

export interface ScreenView {
  screenName: string;
  timestamp: number;
  duration?: number;
  exitType: 'navigation' | 'back' | 'app_background' | 'crash';
  scrollDepth?: number;
  interactions: number;
}

export interface UserAction {
  action: string;
  target: string;
  timestamp: number;
  screenName: string;
  properties: Record<string, any>;
  successful: boolean;
}

export interface ConversionFunnel {
  name: string;
  steps: FunnelStep[];
  timeWindow: number; // in milliseconds
  created: number;
}

export interface FunnelStep {
  name: string;
  eventPattern: string;
  requiredProperties?: Record<string, any>;
  orderIndex: number;
}

export interface FunnelAnalysis {
  funnelName: string;
  period: { start: number; end: number };
  totalUsers: number;
  stepAnalysis: FunnelStepAnalysis[];
  conversionRate: number;
  averageTimeToConvert: number;
  dropoffPoints: DropoffPoint[];
}

export interface FunnelStepAnalysis {
  stepName: string;
  usersEntered: number;
  usersCompleted: number;
  conversionRate: number;
  averageTime: number;
  dropoffRate: number;
}

export interface DropoffPoint {
  fromStep: string;
  toStep: string;
  dropoffRate: number;
  commonExitActions: string[];
  reasons: DropoffReason[];
}

export interface DropoffReason {
  reason: string;
  frequency: number;
  impact: 'low' | 'medium' | 'high';
}

export interface CohortAnalysis {
  cohortType: 'weekly' | 'monthly';
  startDate: number;
  cohorts: Cohort[];
  retentionMatrix: number[][];
  averageRetention: number[];
}

export interface Cohort {
  name: string;
  startDate: number;
  initialUsers: number;
  retentionRates: number[];
  ltv?: number;
}

export interface EngagementMetrics {
  period: { start: number; end: number };
  activeUsers: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  sessionMetrics: {
    averageSessionDuration: number;
    averageSessionsPerUser: number;
    bounceRate: number;
  };
  featureAdoption: FeatureAdoption[];
  userSegments: UserSegment[];
}

export interface FeatureAdoption {
  featureName: string;
  adoptionRate: number;
  usageFrequency: number;
  retentionImpact: number;
  timeToFirstUse: number;
}

export interface UserSegment {
  name: string;
  criteria: Record<string, any>;
  userCount: number;
  engagementScore: number;
  conversionRate: number;
  ltv: number;
}

// ========================= MAIN SERVICE =========================

export class UserBehaviorAnalyticsService {
  private static instance: UserBehaviorAnalyticsService;
  private currentSession?: UserSession;
  private currentScreenView?: ScreenView;
  private conversionFunnels: ConversionFunnel[] = [];
  private userSessions: UserSession[] = [];

  private readonly STORAGE_KEYS = {
    SESSIONS: '@tailtracker:user_sessions',
    FUNNELS: '@tailtracker:conversion_funnels',
    COHORTS: '@tailtracker:user_cohorts',
    SEGMENTS: '@tailtracker:user_segments',
  };

  private constructor() {
    this.initializeDefaultFunnels();
    this.loadStoredData();
  }

  public static getInstance(): UserBehaviorAnalyticsService {
    if (!UserBehaviorAnalyticsService.instance) {
      UserBehaviorAnalyticsService.instance = new UserBehaviorAnalyticsService();
    }
    return UserBehaviorAnalyticsService.instance;
  }

  // ========================= SESSION TRACKING =========================

  public async startSession(userId?: string): Promise<string> {
    try {
      // End current session if exists
      if (this.currentSession) {
        await this.endSession();
      }

      const sessionId = this.generateSessionId();
      this.currentSession = {
        id: sessionId,
        userId,
        startTime: Date.now(),
        screenViews: [],
        actions: [],
        totalEvents: 0,
        bounced: false,
        converted: false,
      };

      await this.track('session_started', {
        session_id: sessionId,
        user_id: userId,
      });

      return sessionId;

    } catch (error) {
      console.error('Failed to start user session:', error);
      await errorMonitoring.reportError(
        error as Error,
        { component: 'UserBehaviorAnalytics', action: 'startSession' },
        'medium',
        ['analytics', 'session']
      );
      return '';
    }
  }

  public async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.currentSession.endTime = Date.now();
      
      // End current screen view
      if (this.currentScreenView) {
        this.endScreenView('app_background');
      }

      // Calculate bounce
      const sessionDuration = this.currentSession.endTime - this.currentSession.startTime;
      this.currentSession.bounced = sessionDuration < 30000 && this.currentSession.screenViews.length <= 1;

      // Store session
      this.userSessions.push(this.currentSession);
      await this.saveUserSessions();

      await this.track('session_ended', {
        session_id: this.currentSession.id,
        duration: sessionDuration,
        screen_views: this.currentSession.screenViews.length,
        actions: this.currentSession.actions.length,
        bounced: this.currentSession.bounced,
        converted: this.currentSession.converted,
      });

      this.currentSession = undefined;

    } catch (error) {
      console.error('Failed to end user session:', error);
    }
  }

  // ========================= SCREEN VIEW TRACKING =========================

  public async trackScreenView(
    screenName: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      // End previous screen view
      if (this.currentScreenView) {
        this.endScreenView('navigation');
      }

      // Start new screen view
      this.currentScreenView = {
        screenName,
        timestamp: Date.now(),
        exitType: 'navigation',
        interactions: 0,
      };

      if (this.currentSession) {
        this.currentSession.screenViews.push(this.currentScreenView);
        this.currentSession.totalEvents++;
      }

      await this.track('screen_view', {
        screen_name: screenName,
        previous_screen: properties.previousScreen,
        ...properties,
      });

      // Track funnel progression
      await this.checkFunnelProgression('screen_view', { screen_name: screenName, ...properties });

    } catch (error) {
      console.error('Failed to track screen view:', error);
    }
  }

  private endScreenView(exitType: ScreenView['exitType']): void {
    if (!this.currentScreenView) return;

    this.currentScreenView.duration = Date.now() - this.currentScreenView.timestamp;
    this.currentScreenView.exitType = exitType;
  }

  // ========================= USER ACTION TRACKING =========================

  public async trackUserAction(
    action: string,
    target: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      const userAction: UserAction = {
        action,
        target,
        timestamp: Date.now(),
        screenName: this.currentScreenView?.screenName || 'unknown',
        properties,
        successful: properties.success !== false,
      };

      if (this.currentSession) {
        this.currentSession.actions.push(userAction);
        this.currentSession.totalEvents++;
      }

      if (this.currentScreenView) {
        this.currentScreenView.interactions++;
      }

      await this.track('user_action', {
        action,
        target,
        screen_name: userAction.screenName,
        ...properties,
      });

      // Track funnel progression
      await this.checkFunnelProgression('user_action', { action, target, ...properties });

    } catch (error) {
      console.error('Failed to track user action:', error);
    }
  }

  // ========================= FUNNEL ANALYSIS =========================

  private initializeDefaultFunnels(): void {
    this.conversionFunnels = [
      // Subscription funnel
      {
        name: 'subscription_conversion',
        timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
        created: Date.now(),
        steps: [
          { name: 'app_launch', eventPattern: 'session_started', orderIndex: 0 },
          { name: 'view_premium_features', eventPattern: 'screen_view', requiredProperties: { screen_name: 'premium' }, orderIndex: 1 },
          { name: 'initiate_subscription', eventPattern: 'user_action', requiredProperties: { action: 'subscribe' }, orderIndex: 2 },
          { name: 'complete_payment', eventPattern: 'subscription_event', requiredProperties: { event: 'subscribe' }, orderIndex: 3 },
        ],
      },
      // Pet onboarding funnel
      {
        name: 'pet_onboarding',
        timeWindow: 24 * 60 * 60 * 1000, // 1 day
        created: Date.now(),
        steps: [
          { name: 'start_onboarding', eventPattern: 'screen_view', requiredProperties: { screen_name: 'onboarding' }, orderIndex: 0 },
          { name: 'add_pet_info', eventPattern: 'screen_view', requiredProperties: { screen_name: 'add_pet' }, orderIndex: 1 },
          { name: 'add_pet_photo', eventPattern: 'user_action', requiredProperties: { action: 'upload_photo' }, orderIndex: 2 },
          { name: 'complete_profile', eventPattern: 'pet_event', requiredProperties: { event: 'add' }, orderIndex: 3 },
        ],
      },
      // Lost pet alert funnel
      {
        name: 'lost_pet_alert',
        timeWindow: 60 * 60 * 1000, // 1 hour
        created: Date.now(),
        steps: [
          { name: 'report_lost', eventPattern: 'user_action', requiredProperties: { action: 'report_lost' }, orderIndex: 0 },
          { name: 'add_location', eventPattern: 'user_action', requiredProperties: { action: 'add_location' }, orderIndex: 1 },
          { name: 'customize_alert', eventPattern: 'screen_view', requiredProperties: { screen_name: 'customize_alert' }, orderIndex: 2 },
          { name: 'activate_alert', eventPattern: 'lost_pet_alert', requiredProperties: { action: 'create' }, orderIndex: 3 },
        ],
      },
    ];
  }

  private async checkFunnelProgression(
    eventType: string,
    properties: Record<string, any>
  ): Promise<void> {
    for (const funnel of this.conversionFunnels) {
      await this.processFunnelStep(funnel, eventType, properties);
    }
  }

  private async processFunnelStep(
    funnel: ConversionFunnel,
    eventType: string,
    properties: Record<string, any>
  ): Promise<void> {
    for (const step of funnel.steps) {
      if (this.matchesFunnelStep(step, eventType, properties)) {
        await this.track('funnel_step_completed', {
          funnel_name: funnel.name,
          step_name: step.name,
          step_index: step.orderIndex,
          session_id: this.currentSession?.id,
        });
        break;
      }
    }
  }

  private matchesFunnelStep(
    step: FunnelStep,
    eventType: string,
    properties: Record<string, any>
  ): boolean {
    if (eventType !== step.eventPattern) return false;

    if (step.requiredProperties) {
      for (const [key, value] of Object.entries(step.requiredProperties)) {
        if (properties[key] !== value) return false;
      }
    }

    return true;
  }

  public async analyzeFunnel(
    funnelName: string,
    startDate: number,
    endDate: number
  ): Promise<FunnelAnalysis | null> {
    try {
      const funnel = this.conversionFunnels.find(f => f.name === funnelName);
      if (!funnel) return null;

      // This would typically query stored events from a database
      // For now, we'll create a placeholder analysis
      const analysis: FunnelAnalysis = {
        funnelName,
        period: { start: startDate, end: endDate },
        totalUsers: 1000, // Placeholder
        stepAnalysis: funnel.steps.map((step, index) => ({
          stepName: step.name,
          usersEntered: 1000 - (index * 200),
          usersCompleted: 1000 - ((index + 1) * 200),
          conversionRate: (800 - (index * 200)) / (1000 - (index * 200)) * 100,
          averageTime: 5000 + (index * 2000),
          dropoffRate: 20,
        })),
        conversionRate: 20,
        averageTimeToConvert: 15000,
        dropoffPoints: [],
      };

      return analysis;

    } catch (error) {
      console.error('Failed to analyze funnel:', error);
      return null;
    }
  }

  // ========================= COHORT ANALYSIS =========================

  public async generateCohortAnalysis(
    cohortType: 'weekly' | 'monthly',
    startDate: number,
    periods: number
  ): Promise<CohortAnalysis> {
    try {
      // This would typically analyze stored user data
      // For now, we'll create a placeholder analysis
      const analysis: CohortAnalysis = {
        cohortType,
        startDate,
        cohorts: [],
        retentionMatrix: [],
        averageRetention: [],
      };

      // Generate sample cohorts
      for (let i = 0; i < periods; i++) {
        const periodMs = cohortType === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const cohortStartDate = startDate + (i * periodMs);
        
        analysis.cohorts.push({
          name: `${cohortType === 'weekly' ? 'Week' : 'Month'} ${i + 1}`,
          startDate: cohortStartDate,
          initialUsers: Math.floor(Math.random() * 500) + 200,
          retentionRates: this.generateRetentionRates(periods - i),
        });
      }

      await this.track('cohort_analysis_generated', {
        cohort_type: cohortType,
        periods,
        start_date: startDate,
      });

      return analysis;

    } catch (error) {
      console.error('Failed to generate cohort analysis:', error);
      throw error;
    }
  }

  private generateRetentionRates(periods: number): number[] {
    const rates = [];
    let currentRate = 100;

    for (let i = 0; i < periods; i++) {
      rates.push(currentRate);
      currentRate *= 0.7 + (Math.random() * 0.2); // Decay with some variance
    }

    return rates.map(rate => Math.round(rate * 100) / 100);
  }

  // ========================= ENGAGEMENT METRICS =========================

  public async getEngagementMetrics(
    startDate: number,
    endDate: number
  ): Promise<EngagementMetrics> {
    try {
      // This would typically query stored analytics data
      // For now, we'll create a placeholder analysis
      const metrics: EngagementMetrics = {
        period: { start: startDate, end: endDate },
        activeUsers: {
          daily: this.generateActiveUsersData(30),
          weekly: this.generateActiveUsersData(12),
          monthly: this.generateActiveUsersData(6),
        },
        sessionMetrics: {
          averageSessionDuration: 180000, // 3 minutes
          averageSessionsPerUser: 2.5,
          bounceRate: 35,
        },
        featureAdoption: [
          {
            featureName: 'Pet Profile',
            adoptionRate: 95,
            usageFrequency: 4.2,
            retentionImpact: 15,
            timeToFirstUse: 120000, // 2 minutes
          },
          {
            featureName: 'Health Tracking',
            adoptionRate: 67,
            usageFrequency: 2.8,
            retentionImpact: 25,
            timeToFirstUse: 300000, // 5 minutes
          },
          {
            featureName: 'Lost Pet Alerts',
            adoptionRate: 23,
            usageFrequency: 0.5,
            retentionImpact: 40,
            timeToFirstUse: 600000, // 10 minutes
          },
        ],
        userSegments: [
          {
            name: 'Power Users',
            criteria: { sessions_per_week: '>= 7', features_used: '>= 5' },
            userCount: 150,
            engagementScore: 9.2,
            conversionRate: 75,
            ltv: 250,
          },
          {
            name: 'Regular Users',
            criteria: { sessions_per_week: '2-6', features_used: '2-4' },
            userCount: 800,
            engagementScore: 6.5,
            conversionRate: 35,
            ltv: 120,
          },
          {
            name: 'Casual Users',
            criteria: { sessions_per_week: '<= 1', features_used: '<= 2' },
            userCount: 450,
            engagementScore: 3.1,
            conversionRate: 8,
            ltv: 45,
          },
        ],
      };

      await this.track('engagement_metrics_generated', {
        start_date: startDate,
        end_date: endDate,
        total_segments: metrics.userSegments.length,
      });

      return metrics;

    } catch (error) {
      console.error('Failed to get engagement metrics:', error);
      throw error;
    }
  }

  private generateActiveUsersData(periods: number): number[] {
    const data = [];
    const baseUsers = 1000;

    for (let i = 0; i < periods; i++) {
      // Add some realistic variance
      const variance = (Math.random() - 0.5) * 0.3;
      const users = Math.floor(baseUsers * (1 + variance));
      data.push(Math.max(users, 0));
    }

    return data;
  }

  // ========================= USER SEGMENTATION =========================

  public async segmentUsers(criteria: Record<string, any>): Promise<UserSegment> {
    try {
      // This would typically query user data and apply segmentation logic
      const segment: UserSegment = {
        name: criteria.name || 'Custom Segment',
        criteria,
        userCount: Math.floor(Math.random() * 500) + 50,
        engagementScore: Math.random() * 10,
        conversionRate: Math.random() * 100,
        ltv: Math.random() * 300 + 50,
      };

      await this.track('user_segment_created', {
        segment_name: segment.name,
        user_count: segment.userCount,
        criteria,
      });

      return segment;

    } catch (error) {
      console.error('Failed to segment users:', error);
      throw error;
    }
  }

  // ========================= STORAGE =========================

  private async loadStoredData(): Promise<void> {
    try {
      const [sessionsData, funnelsData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.SESSIONS),
        AsyncStorage.getItem(this.STORAGE_KEYS.FUNNELS),
      ]);

      if (sessionsData) {
        this.userSessions = JSON.parse(sessionsData);
        // Keep only recent sessions to prevent memory issues
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.userSessions = this.userSessions.filter(s => s.startTime > thirtyDaysAgo);
      }

      if (funnelsData) {
        const storedFunnels = JSON.parse(funnelsData);
        // Merge with default funnels
        this.conversionFunnels = [...this.conversionFunnels, ...storedFunnels];
      }

    } catch (error) {
      console.error('Failed to load stored user behavior data:', error);
    }
  }

  private async saveUserSessions(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(this.userSessions));
    } catch (error) {
      console.error('Failed to save user sessions:', error);
    }
  }

  private async track(eventName: string, properties: Record<string, any>): Promise<void> {
    await analytics.track(eventName, properties, 'user_behavior', 'medium');
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `behavior_session_${timestamp}_${randomPart}`;
  }
}

// ========================= EXPORTS =========================

export const userBehaviorAnalytics = UserBehaviorAnalyticsService.getInstance();

export default userBehaviorAnalytics;