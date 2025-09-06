/**
 * Enterprise-grade Analytics Service for TailTracker
 * 
 * This service provides comprehensive analytics tracking including:
 * - User behavior analytics
 * - Business metrics tracking
 * - Performance monitoring integration
 * - Privacy-compliant data collection
 * - Real-time event streaming
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { errorMonitoring } from './ErrorMonitoringService';
import { offlineQueueManager } from './OfflineQueueManager';
import { PerformanceMonitor } from './PerformanceMonitor';

// ========================= TYPES =========================

export interface AnalyticsEvent {
  id: string;
  name: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  context: AnalyticsContext;
  category: EventCategory;
  priority: EventPriority;
}

export interface AnalyticsContext {
  appVersion: string;
  platform: string;
  osVersion: string;
  deviceModel: string;
  screenName?: string;
  networkType: string;
  isConnected: boolean;
  batteryLevel?: number;
  memoryUsage?: number;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  userAgent?: string;
  timezone: string;
  locale: string;
}

export type EventCategory = 
  | 'user_behavior'
  | 'business_metrics'
  | 'performance'
  | 'health_wellness'
  | 'navigation'
  | 'feature_usage'
  | 'conversion'
  | 'error'
  | 'system'
  | 'security';

export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

export interface UserProfile {
  userId: string;
  createdAt: number;
  lastSeen: number;
  totalSessions: number;
  totalEvents: number;
  subscriptionStatus: 'free' | 'premium' | 'family';
  petCount: number;
  primaryUseCases: string[];
  demographics: {
    ageRange?: string;
    location?: string;
    familySize?: number;
  };
  preferences: {
    notificationsEnabled: boolean;
    dataShareOptIn: boolean;
    privacyLevel: 'minimal' | 'standard' | 'enhanced';
  };
}

export interface AnalyticsConfig {
  enabledCategories: EventCategory[];
  batchSize: number;
  flushInterval: number;
  retentionDays: number;
  privacyMode: 'strict' | 'standard' | 'enhanced';
  enableRealTimeReporting: boolean;
  enableCrashReporting: boolean;
  enablePerformanceTracking: boolean;
  dataProcessingConsent: boolean;
}

// ========================= MAIN SERVICE =========================

export class AnalyticsService {
  private static instance: AnalyticsService;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private userProfile?: UserProfile;
  private config: AnalyticsConfig;
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;

  private readonly STORAGE_KEYS = {
    SESSION_ID: '@tailtracker:analytics_session',
    USER_PROFILE: '@tailtracker:user_profile',
    CONFIG: '@tailtracker:analytics_config',
    EVENTS: '@tailtracker:analytics_events',
    METRICS: '@tailtracker:analytics_metrics',
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // ========================= INITIALIZATION =========================

  public async initialize(userId?: string, config?: Partial<AnalyticsConfig>): Promise<void> {
    try {
      this.userId = userId;
      
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Load stored data
      await this.loadStoredData();

      // Initialize user profile
      if (userId) {
        await this.initializeUserProfile(userId);
      }

      // Start session
      await this.startSession();

      // Setup periodic flush
      this.setupPeriodicFlush();

      // Setup network listeners
      this.setupNetworkListeners();

      this.isInitialized = true;

      // Track initialization
      await this.track('analytics_initialized', {
        userId: userId || 'anonymous',
        config: this.config,
      }, 'system', 'low');

      console.log('✅ Analytics Service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Analytics Service:', error);
      await errorMonitoring.reportError(
        error as Error,
        { component: 'AnalyticsService', action: 'initialize' },
        'high',
        ['analytics', 'initialization']
      );
    }
  }

  // ========================= EVENT TRACKING =========================

  public async track(
    eventName: string,
    properties: Record<string, any> = {},
    category: EventCategory = 'user_behavior',
    priority: EventPriority = 'medium'
  ): Promise<string> {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Call initialize() first.');
      return '';
    }

    try {
      const event: AnalyticsEvent = {
        id: this.generateEventId(),
        name: eventName,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        properties: this.sanitizeProperties(properties),
        context: await this.getContext(),
        category,
        priority,
      };

      // Add to queue
      this.eventQueue.push(event);

      // Immediate flush for critical events
      if (priority === 'critical') {
        await this.flush();
      }

      // Update user profile
      if (this.userProfile) {
        this.userProfile.totalEvents++;
        this.userProfile.lastSeen = Date.now();
        await this.saveUserProfile();
      }

      // Performance tracking integration
      if (category === 'performance') {
        this.integrateWithPerformanceMonitor(eventName, properties);
      }

      return event.id;

    } catch (error) {
      console.error('Failed to track event:', error);
      await errorMonitoring.reportError(
        error as Error,
        { component: 'AnalyticsService', action: 'track', eventName },
        'medium',
        ['analytics', 'tracking']
      );
      return '';
    }
  }

  // ========================= USER BEHAVIOR TRACKING =========================

  public async trackScreenView(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    const startTime = PerformanceMonitor.startTiming(`screen_view_${screenName}`);
    
    await this.track('screen_view', {
      screen_name: screenName,
      previous_screen: properties.previousScreen,
      navigation_source: properties.navigationSource,
      ...properties,
    }, 'navigation', 'low');

    // Track screen performance
    setTimeout(() => {
      const renderTime = PerformanceMonitor.endTiming(`screen_view_${screenName}`, 'navigation');
      this.track('screen_performance', {
        screen_name: screenName,
        render_time: renderTime,
      }, 'performance', 'low');
    }, 100);
  }

  public async trackUserAction(
    action: string,
    target: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('user_action', {
      action,
      target,
      screen_name: properties.screenName,
      element_type: properties.elementType,
      position: properties.position,
      ...properties,
    }, 'user_behavior', 'medium');
  }

  public async trackFeatureUsage(
    feature: string,
    action: 'start' | 'complete' | 'abandon',
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('feature_usage', {
      feature,
      action,
      duration: properties.duration,
      success: properties.success,
      error: properties.error,
      ...properties,
    }, 'feature_usage', 'medium');
  }

  // ========================= BUSINESS METRICS TRACKING =========================

  public async trackConversion(
    conversionType: string,
    value?: number,
    currency?: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('conversion', {
      conversion_type: conversionType,
      value,
      currency,
      funnel_step: properties.funnelStep,
      source: properties.source,
      campaign: properties.campaign,
      ...properties,
    }, 'conversion', 'high');
  }

  public async trackSubscriptionEvent(
    event: 'subscribe' | 'upgrade' | 'downgrade' | 'cancel' | 'renew',
    plan: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('subscription_event', {
      event,
      plan,
      previous_plan: properties.previousPlan,
      price: properties.price,
      currency: properties.currency,
      billing_cycle: properties.billingCycle,
      promotion_code: properties.promotionCode,
      ...properties,
    }, 'business_metrics', 'high');
  }

  public async trackPetEvent(
    event: 'add' | 'edit' | 'remove' | 'share',
    petType: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('pet_event', {
      event,
      pet_type: petType,
      pet_id: properties.petId,
      breed: properties.breed,
      age: properties.age,
      medical_conditions: properties.medicalConditions,
      ...properties,
    }, 'user_behavior', 'medium');
  }

  // ========================= HEALTH & WELLNESS TRACKING =========================

  public async trackHealthEvent(
    event: 'vaccination' | 'checkup' | 'medication' | 'emergency',
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('health_event', {
      event,
      pet_id: properties.petId,
      provider: properties.provider,
      cost: properties.cost,
      outcome: properties.outcome,
      reminder_effectiveness: properties.reminderEffectiveness,
      ...properties,
    }, 'health_wellness', 'high');
  }

  public async trackWellnessMetric(
    metric: 'weight' | 'activity' | 'mood' | 'appetite',
    value: number,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('wellness_metric', {
      metric,
      value,
      pet_id: properties.petId,
      trend: properties.trend,
      alert_triggered: properties.alertTriggered,
      ...properties,
    }, 'health_wellness', 'medium');
  }

  // ========================= LOST PET TRACKING =========================

  public async trackLostPetAlert(
    action: 'create' | 'update' | 'resolve' | 'share',
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.track('lost_pet_alert', {
      action,
      pet_id: properties.petId,
      location_accuracy: properties.locationAccuracy,
      share_radius: properties.shareRadius,
      resolution_time: properties.resolutionTime,
      found_by: properties.foundBy,
      ...properties,
    }, 'business_metrics', 'critical');
  }

  // ========================= PERFORMANCE INTEGRATION =========================

  private integrateWithPerformanceMonitor(eventName: string, properties: Record<string, any>): void {
    // Integrate with existing PerformanceMonitor
    if (eventName.includes('api_call')) {
      PerformanceMonitor.recordMetric({
        name: properties.endpoint || 'unknown_endpoint',
        value: properties.duration || 0,
        timestamp: Date.now(),
        category: 'api',
        metadata: properties,
      });
    }
  }

  // ========================= DATA MANAGEMENT =========================

  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Send events in batches
      const batchSize = this.config.batchSize;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await this.sendEventBatch(batch);
      }

      console.log(`📊 Flushed ${events.length} analytics events`);

    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      await errorMonitoring.reportError(
        error as Error,
        { component: 'AnalyticsService', action: 'flush' },
        'medium',
        ['analytics', 'flush']
      );
    }
  }

  private async sendEventBatch(events: AnalyticsEvent[]): Promise<void> {
    try {
      // Queue for offline handling
      await offlineQueueManager.enqueueAction(
        'ANALYTICS_BATCH',
        { events },
        {
          priority: 'low',
          requiresAuthentication: false,
        }
      );
    } catch (error) {
      console.error('Failed to queue analytics batch:', error);
    }
  }

  // ========================= USER PROFILE MANAGEMENT =========================

  private async initializeUserProfile(userId: string): Promise<void> {
    try {
      let profile = await this.loadUserProfile();
      
      if (!profile || profile.userId !== userId) {
        profile = {
          userId,
          createdAt: Date.now(),
          lastSeen: Date.now(),
          totalSessions: 0,
          totalEvents: 0,
          subscriptionStatus: 'free',
          petCount: 0,
          primaryUseCases: [],
          demographics: {},
          preferences: {
            notificationsEnabled: true,
            dataShareOptIn: false,
            privacyLevel: 'standard',
          },
        };
      }

      profile.totalSessions++;
      this.userProfile = profile;
      await this.saveUserProfile();

    } catch (error) {
      console.error('Failed to initialize user profile:', error);
    }
  }

  public async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.userProfile) return;

    this.userProfile = { ...this.userProfile, ...updates };
    await this.saveUserProfile();

    await this.track('user_profile_updated', {
      updated_fields: Object.keys(updates),
    }, 'user_behavior', 'low');
  }

  // ========================= PRIVACY & CONSENT =========================

  public async setPrivacyConsent(consent: boolean, privacyLevel: 'minimal' | 'standard' | 'enhanced'): Promise<void> {
    this.config.dataProcessingConsent = consent;
    this.config.privacyMode = consent ? 'standard' : 'strict';

    if (this.userProfile) {
      this.userProfile.preferences.privacyLevel = privacyLevel;
      this.userProfile.preferences.dataShareOptIn = consent;
      await this.saveUserProfile();
    }

    await this.saveConfig();

    await this.track('privacy_consent_updated', {
      consent,
      privacy_level: privacyLevel,
    }, 'system', 'high');
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    if (this.config.privacyMode === 'strict') {
      // Remove PII in strict mode
      const sanitized = { ...properties };
      delete sanitized.email;
      delete sanitized.phone;
      delete sanitized.fullName;
      delete sanitized.address;
      return sanitized;
    }
    return properties;
  }

  // ========================= HELPERS =========================

  private async getContext(): Promise<AnalyticsContext> {
    const netInfo = await NetInfo.fetch();
    
    return {
      appVersion: '1.0.0', // Get from app config
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      deviceModel: Platform.constants?.Model || 'unknown',
      networkType: netInfo.type,
      isConnected: netInfo.isConnected ?? false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: 'en-US', // Get from device settings
    };
  }

  private async startSession(): Promise<void> {
    await this.track('session_start', {
      session_id: this.sessionId,
      user_id: this.userId,
    }, 'system', 'low');
  }

  private setupPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupNetworkListeners(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.eventQueue.length > 0) {
        this.flush();
      }
    });
  }

  private getDefaultConfig(): AnalyticsConfig {
    return {
      enabledCategories: ['user_behavior', 'business_metrics', 'performance', 'health_wellness', 'navigation', 'feature_usage', 'conversion', 'system'],
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      retentionDays: 90,
      privacyMode: 'standard',
      enableRealTimeReporting: true,
      enableCrashReporting: true,
      enablePerformanceTracking: true,
      dataProcessingConsent: false,
    };
  }

  // ========================= STORAGE =========================

  private async loadStoredData(): Promise<void> {
    try {
      const [configData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.CONFIG),
      ]);

      if (configData) {
        const storedConfig = JSON.parse(configData);
        this.config = { ...this.config, ...storedConfig };
      }
    } catch (error) {
      console.error('Failed to load stored analytics data:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save analytics config:', error);
    }
  }

  private async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  private async saveUserProfile(): Promise<void> {
    if (!this.userProfile) return;

    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(this.userProfile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${randomPart}`;
  }

  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `event_${timestamp}_${randomPart}`;
  }

  // ========================= CLEANUP =========================

  public async dispose(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();

    await this.track('session_end', {
      session_id: this.sessionId,
      duration: Date.now() - (this.userProfile?.lastSeen || Date.now()),
    }, 'system', 'low');

    await this.flush();
  }
}

// ========================= EXPORTS =========================

export const analytics = AnalyticsService.getInstance();

// Convenience functions
export const trackEvent = (name: string, properties?: Record<string, any>, category?: EventCategory, priority?: EventPriority) =>
  analytics.track(name, properties, category, priority);

export const trackScreenView = (screenName: string, properties?: Record<string, any>) =>
  analytics.trackScreenView(screenName, properties);

export const trackUserAction = (action: string, target: string, properties?: Record<string, any>) =>
  analytics.trackUserAction(action, target, properties);

export const trackConversion = (type: string, value?: number, currency?: string, properties?: Record<string, any>) =>
  analytics.trackConversion(type, value, currency, properties);

export default analytics;