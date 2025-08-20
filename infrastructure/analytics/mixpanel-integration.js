// TailTracker Analytics Integration
// Comprehensive analytics tracking with Mixpanel and custom business intelligence

const mixpanel = require('mixpanel');
const { createClient } = require('@supabase/supabase-js');

class TailTrackerAnalytics {
  constructor(config) {
    this.mixpanel = mixpanel.init(config.mixpanelToken, {
      debug: config.debug || false,
      protocol: 'https',
      batch_requests: true,
      batch_size: 50,
      batch_flush_interval_ms: 5000
    });

    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.environment = config.environment || 'production';
    
    // Business metrics tracking
    this.businessMetrics = {
      userRegistrations: 0,
      subscriptionConversions: 0,
      lostPetAlerts: 0,
      petRecoveries: 0,
      activeUsers: new Set(),
      revenue: 0
    };

    this.initializeTracking();
  }

  initializeTracking() {
    // Set up periodic business metrics reporting
    setInterval(() => {
      this.reportBusinessMetrics();
    }, 60000); // Every minute

    // Set up daily summary reporting
    setInterval(() => {
      this.generateDailyReport();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  // User Events Tracking
  trackUserRegistration(userId, userDetails) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      email: userDetails.email,
      registration_method: userDetails.method || 'email',
      user_agent: userDetails.userAgent,
      platform: userDetails.platform,
      referrer: userDetails.referrer,
      utm_source: userDetails.utmSource,
      utm_medium: userDetails.utmMedium,
      utm_campaign: userDetails.utmCampaign,
      device_type: userDetails.deviceType,
      country: userDetails.country,
      timestamp: new Date().toISOString()
    };

    // Track in Mixpanel
    this.mixpanel.track('User Registration', eventData);

    // Set user profile
    this.mixpanel.people.set(userId, {
      $email: userDetails.email,
      $created: new Date(),
      $last_login: new Date(),
      platform: userDetails.platform,
      country: userDetails.country
    });

    // Update business metrics
    this.businessMetrics.userRegistrations++;

    // Store in custom analytics database
    this.storeBusinessEvent('user_registration', eventData);

    console.log(`User registration tracked: ${userId}`);
  }

  trackUserLogin(userId, loginDetails) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      login_method: loginDetails.method || 'email',
      platform: loginDetails.platform,
      device_type: loginDetails.deviceType,
      session_id: loginDetails.sessionId,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('User Login', eventData);
    
    // Update last login
    this.mixpanel.people.set(userId, {
      $last_login: new Date()
    });

    // Track active users
    this.businessMetrics.activeUsers.add(userId);

    this.storeBusinessEvent('user_login', eventData);
  }

  // Pet Management Events
  trackPetProfileCreation(userId, petDetails) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      pet_id: petDetails.id,
      pet_type: petDetails.type,
      pet_breed: petDetails.breed,
      pet_age: petDetails.age,
      has_photo: !!petDetails.photo,
      has_microchip: !!petDetails.microchipId,
      location_enabled: petDetails.locationEnabled,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('Pet Profile Created', eventData);
    
    // Update user profile
    this.mixpanel.people.increment(userId, 'pets_count', 1);

    this.storeBusinessEvent('pet_profile_created', eventData);

    console.log(`Pet profile creation tracked: ${petDetails.id} for user ${userId}`);
  }

  trackLostPetAlert(userId, alertDetails) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      alert_id: alertDetails.id,
      pet_id: alertDetails.petId,
      pet_type: alertDetails.petType,
      alert_type: alertDetails.alertType || 'lost',
      location_lat: alertDetails.location?.latitude,
      location_lng: alertDetails.location?.longitude,
      has_reward: !!alertDetails.reward,
      reward_amount: alertDetails.rewardAmount,
      emergency_contacts: alertDetails.emergencyContacts?.length || 0,
      social_share_enabled: alertDetails.socialShareEnabled,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('Lost Pet Alert Created', eventData);
    
    // Update user profile
    this.mixpanel.people.increment(userId, 'lost_pet_alerts', 1);

    // Update business metrics
    this.businessMetrics.lostPetAlerts++;

    this.storeBusinessEvent('lost_pet_alert_created', eventData);

    // Send urgent notification to analytics team for high-priority alerts
    if (alertDetails.priority === 'high') {
      this.sendUrgentAlert('lost_pet_high_priority', eventData);
    }

    console.log(`Lost pet alert tracked: ${alertDetails.id}`);
  }

  trackPetRecovery(userId, recoveryDetails) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      alert_id: recoveryDetails.alertId,
      pet_id: recoveryDetails.petId,
      recovery_method: recoveryDetails.method, // 'found_by_owner', 'found_by_stranger', 'returned_home'
      time_missing: recoveryDetails.timeMissingHours,
      recovery_location_distance: recoveryDetails.recoveryDistance,
      reward_paid: !!recoveryDetails.rewardPaid,
      finder_user_id: recoveryDetails.finderUserId,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('Pet Recovered', eventData);
    
    // Update user profile
    this.mixpanel.people.increment(userId, 'pets_recovered', 1);

    // Update business metrics
    this.businessMetrics.petRecoveries++;

    this.storeBusinessEvent('pet_recovered', eventData);

    console.log(`Pet recovery tracked: ${recoveryDetails.petId}`);
  }

  // Subscription and Payment Events
  trackSubscriptionConversion(userId, subscriptionDetails) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      subscription_id: subscriptionDetails.id,
      plan_type: subscriptionDetails.planType,
      billing_cycle: subscriptionDetails.billingCycle,
      price: subscriptionDetails.price,
      currency: subscriptionDetails.currency,
      payment_method: subscriptionDetails.paymentMethod,
      trial_days: subscriptionDetails.trialDays || 0,
      discount_code: subscriptionDetails.discountCode,
      conversion_source: subscriptionDetails.source, // 'onboarding', 'lost_pet_alert', 'feature_limit'
      days_from_registration: subscriptionDetails.daysFromRegistration,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('Subscription Conversion', eventData);
    
    // Update user profile
    this.mixpanel.people.set(userId, {
      subscription_status: 'active',
      plan_type: subscriptionDetails.planType,
      subscription_start_date: new Date()
    });

    // Track revenue
    this.mixpanel.people.track_charge(userId, subscriptionDetails.price);

    // Update business metrics
    this.businessMetrics.subscriptionConversions++;
    this.businessMetrics.revenue += subscriptionDetails.price;

    this.storeBusinessEvent('subscription_conversion', eventData);

    console.log(`Subscription conversion tracked: ${subscriptionDetails.id} for user ${userId}`);
  }

  trackPaymentFailure(userId, paymentDetails) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      payment_id: paymentDetails.id,
      failure_reason: paymentDetails.failureReason,
      payment_method: paymentDetails.paymentMethod,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      retry_count: paymentDetails.retryCount || 0,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('Payment Failed', eventData);

    this.storeBusinessEvent('payment_failed', eventData);

    // Send alert for payment failures
    this.sendUrgentAlert('payment_failure', eventData);
  }

  // App Performance and Engagement
  trackAppPerformance(userId, performanceData) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      screen: performanceData.screen,
      load_time: performanceData.loadTime,
      memory_usage: performanceData.memoryUsage,
      network_type: performanceData.networkType,
      device_type: performanceData.deviceType,
      os_version: performanceData.osVersion,
      app_version: performanceData.appVersion,
      timestamp: new Date().toISOString()
    };

    // Only track performance issues
    if (performanceData.loadTime > 3000 || performanceData.memoryUsage > 100) {
      this.mixpanel.track('App Performance Issue', eventData);
      this.storeBusinessEvent('app_performance_issue', eventData);
    }
  }

  trackFeatureUsage(userId, featureDetails) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      feature: featureDetails.feature,
      screen: featureDetails.screen,
      action: featureDetails.action,
      value: featureDetails.value,
      is_premium_feature: featureDetails.isPremium,
      subscription_status: featureDetails.subscriptionStatus,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('Feature Used', eventData);

    // Track feature adoption
    this.mixpanel.people.set(userId, {
      [`last_used_${featureDetails.feature}`]: new Date()
    });

    this.storeBusinessEvent('feature_used', eventData);
  }

  // Business Intelligence Methods
  async storeBusinessEvent(eventType, eventData) {
    try {
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: eventType,
          event_data: eventData,
          user_id: eventData.user_id,
          timestamp: new Date(),
          environment: this.environment
        });
    } catch (error) {
      console.error('Failed to store business event:', error);
    }
  }

  async reportBusinessMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      user_registrations: this.businessMetrics.userRegistrations,
      subscription_conversions: this.businessMetrics.subscriptionConversions,
      lost_pet_alerts: this.businessMetrics.lostPetAlerts,
      pet_recoveries: this.businessMetrics.petRecoveries,
      active_users_count: this.businessMetrics.activeUsers.size,
      revenue: this.businessMetrics.revenue,
      recovery_rate: this.businessMetrics.lostPetAlerts > 0 
        ? (this.businessMetrics.petRecoveries / this.businessMetrics.lostPetAlerts) * 100 
        : 0
    };

    // Send to Mixpanel
    this.mixpanel.track('Business Metrics Report', metrics);

    // Store in database
    try {
      await this.supabase
        .from('business_metrics')
        .insert(metrics);
    } catch (error) {
      console.error('Failed to store business metrics:', error);
    }

    // Reset counters
    this.businessMetrics.userRegistrations = 0;
    this.businessMetrics.subscriptionConversions = 0;
    this.businessMetrics.lostPetAlerts = 0;
    this.businessMetrics.petRecoveries = 0;
    this.businessMetrics.revenue = 0;
  }

  async generateDailyReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      // Query business events from the last 24 hours
      const { data: events, error } = await this.supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', yesterday.toISOString())
        .eq('environment', this.environment);

      if (error) throw error;

      // Generate comprehensive report
      const report = this.generateAnalyticsReport(events);
      
      // Store daily report
      await this.supabase
        .from('daily_reports')
        .insert({
          date: yesterday.toISOString().split('T')[0],
          report_data: report,
          environment: this.environment
        });

      // Send to stakeholders
      this.sendDailyReport(report);

    } catch (error) {
      console.error('Failed to generate daily report:', error);
    }
  }

  generateAnalyticsReport(events) {
    const report = {
      summary: {
        total_events: events.length,
        unique_users: new Set(events.map(e => e.user_id)).size,
        date: new Date().toISOString().split('T')[0]
      },
      user_metrics: {
        new_registrations: events.filter(e => e.event_type === 'user_registration').length,
        active_users: events.filter(e => e.event_type === 'user_login').length,
        retention_rate: 0 // Calculate based on return users
      },
      business_metrics: {
        lost_pet_alerts: events.filter(e => e.event_type === 'lost_pet_alert_created').length,
        pet_recoveries: events.filter(e => e.event_type === 'pet_recovered').length,
        subscription_conversions: events.filter(e => e.event_type === 'subscription_conversion').length,
        revenue: events
          .filter(e => e.event_type === 'subscription_conversion')
          .reduce((sum, e) => sum + (e.event_data.price || 0), 0)
      },
      performance_metrics: {
        app_performance_issues: events.filter(e => e.event_type === 'app_performance_issue').length,
        payment_failures: events.filter(e => e.event_type === 'payment_failed').length
      },
      feature_adoption: this.calculateFeatureAdoption(events)
    };

    // Calculate recovery rate
    report.business_metrics.recovery_rate = report.business_metrics.lost_pet_alerts > 0
      ? (report.business_metrics.pet_recoveries / report.business_metrics.lost_pet_alerts) * 100
      : 0;

    return report;
  }

  calculateFeatureAdoption(events) {
    const featureEvents = events.filter(e => e.event_type === 'feature_used');
    const features = {};

    featureEvents.forEach(event => {
      const feature = event.event_data.feature;
      if (!features[feature]) {
        features[feature] = {
          usage_count: 0,
          unique_users: new Set()
        };
      }
      features[feature].usage_count++;
      features[feature].unique_users.add(event.user_id);
    });

    // Convert sets to counts
    Object.keys(features).forEach(feature => {
      features[feature].unique_users = features[feature].unique_users.size;
    });

    return features;
  }

  sendUrgentAlert(alertType, data) {
    // Integration with alerting system (Slack, PagerDuty, etc.)
    console.log(`URGENT ALERT [${alertType}]:`, data);
    
    // Send to monitoring system
    this.mixpanel.track('Urgent Alert', {
      alert_type: alertType,
      alert_data: data,
      timestamp: new Date().toISOString()
    });
  }

  sendDailyReport(report) {
    // Send daily report via email/Slack
    console.log('Daily Analytics Report Generated:', report);
    
    this.mixpanel.track('Daily Report Generated', {
      report_summary: report.summary,
      timestamp: new Date().toISOString()
    });
  }

  // Funnel Analysis
  trackConversionFunnel(userId, step, stepData) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      funnel_step: step,
      step_data: stepData,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('Conversion Funnel', eventData);
    this.storeBusinessEvent('conversion_funnel', eventData);
  }

  // A/B Testing Support
  trackABTestExposure(userId, testName, variant) {
    const eventData = {
      distinct_id: userId,
      user_id: userId,
      test_name: testName,
      variant: variant,
      timestamp: new Date().toISOString()
    };

    this.mixpanel.track('AB Test Exposure', eventData);
    
    // Set user property for segmentation
    this.mixpanel.people.set(userId, {
      [`ab_test_${testName}`]: variant
    });

    this.storeBusinessEvent('ab_test_exposure', eventData);
  }
}

module.exports = TailTrackerAnalytics;