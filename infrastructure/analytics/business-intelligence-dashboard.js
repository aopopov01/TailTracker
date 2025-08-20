// TailTracker Business Intelligence Dashboard
// Real-time business metrics and KPI tracking system

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const prometheus = require('prom-client');

class BusinessIntelligenceDashboard {
  constructor(config) {
    this.app = express();
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.environment = config.environment || 'production';
    
    this.initializeMetrics();
    this.initializeRoutes();
    this.startMetricsCollection();
  }

  initializeMetrics() {
    // Create Prometheus metrics for business KPIs
    this.metrics = {
      // User Metrics
      totalUsers: new prometheus.Gauge({
        name: 'tailtracker_total_users',
        help: 'Total number of registered users'
      }),
      
      activeUsers: new prometheus.Gauge({
        name: 'tailtracker_active_users_24h',
        help: 'Number of active users in the last 24 hours'
      }),
      
      newUsersToday: new prometheus.Gauge({
        name: 'tailtracker_new_users_today',
        help: 'Number of new user registrations today'
      }),
      
      userRetention: new prometheus.Gauge({
        name: 'tailtracker_user_retention_rate',
        help: 'User retention rate percentage',
        labelNames: ['period'] // 7d, 30d, 90d
      }),

      // Subscription Metrics
      totalSubscribers: new prometheus.Gauge({
        name: 'tailtracker_total_subscribers',
        help: 'Total number of active subscribers'
      }),
      
      subscriptionConversions: new prometheus.Counter({
        name: 'tailtracker_subscription_conversions_total',
        help: 'Total subscription conversions',
        labelNames: ['plan_type', 'source']
      }),
      
      monthlyRecurringRevenue: new prometheus.Gauge({
        name: 'tailtracker_mrr_dollars',
        help: 'Monthly recurring revenue in dollars'
      }),
      
      churnRate: new prometheus.Gauge({
        name: 'tailtracker_churn_rate',
        help: 'Monthly churn rate percentage'
      }),

      // Pet and Alert Metrics
      totalPets: new prometheus.Gauge({
        name: 'tailtracker_total_pets',
        help: 'Total number of registered pets'
      }),
      
      lostPetAlerts: new prometheus.Counter({
        name: 'tailtracker_lost_pet_alerts_total',
        help: 'Total number of lost pet alerts created',
        labelNames: ['alert_type', 'urgency']
      }),
      
      petRecoveries: new prometheus.Counter({
        name: 'tailtracker_pets_recovered_total',
        help: 'Total number of pets recovered'
      }),
      
      recoveryRate: new prometheus.Gauge({
        name: 'tailtracker_recovery_rate',
        help: 'Pet recovery rate percentage',
        labelNames: ['time_period']
      }),
      
      averageRecoveryTime: new prometheus.Gauge({
        name: 'tailtracker_average_recovery_time_hours',
        help: 'Average time to recover lost pets in hours'
      }),

      // Engagement Metrics
      dailyActiveUsers: new prometheus.Gauge({
        name: 'tailtracker_daily_active_users',
        help: 'Daily active users'
      }),
      
      weeklyActiveUsers: new prometheus.Gauge({
        name: 'tailtracker_weekly_active_users',
        help: 'Weekly active users'
      }),
      
      monthlyActiveUsers: new prometheus.Gauge({
        name: 'tailtracker_monthly_active_users',
        help: 'Monthly active users'
      }),
      
      averageSessionDuration: new prometheus.Gauge({
        name: 'tailtracker_average_session_duration_minutes',
        help: 'Average user session duration in minutes'
      }),

      // Feature Adoption Metrics
      featureUsage: new prometheus.Counter({
        name: 'tailtracker_feature_usage_total',
        help: 'Total feature usage count',
        labelNames: ['feature', 'user_type']
      }),
      
      premiumFeatureUsage: new prometheus.Counter({
        name: 'tailtracker_premium_feature_usage_total',
        help: 'Premium feature usage count',
        labelNames: ['feature']
      }),

      // Business Health Metrics
      customerLifetimeValue: new prometheus.Gauge({
        name: 'tailtracker_customer_lifetime_value_dollars',
        help: 'Average customer lifetime value in dollars'
      }),
      
      customerAcquisitionCost: new prometheus.Gauge({
        name: 'tailtracker_customer_acquisition_cost_dollars',
        help: 'Customer acquisition cost in dollars'
      }),
      
      netPromoterScore: new prometheus.Gauge({
        name: 'tailtracker_net_promoter_score',
        help: 'Net Promoter Score'
      }),

      // Operational Metrics
      supportTickets: new prometheus.Counter({
        name: 'tailtracker_support_tickets_total',
        help: 'Total support tickets created',
        labelNames: ['priority', 'category']
      }),
      
      appStoreRating: new prometheus.Gauge({
        name: 'tailtracker_app_store_rating',
        help: 'Average app store rating',
        labelNames: ['platform']
      })
    };

    // Register all metrics
    Object.values(this.metrics).forEach(metric => {
      prometheus.register.registerMetric(metric);
    });
  }

  initializeRoutes() {
    this.app.use(express.json());
    
    // Metrics endpoint for Prometheus scraping
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', prometheus.register.contentType);
      res.end(await prometheus.register.metrics());
    });

    // Business metrics endpoint
    this.app.get('/metrics/business', async (req, res) => {
      try {
        const businessMetrics = await this.getBusinessMetrics();
        res.json(businessMetrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Real-time dashboard data
    this.app.get('/dashboard/realtime', async (req, res) => {
      try {
        const realtimeData = await this.getRealtimeDashboardData();
        res.json(realtimeData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // KPI trends
    this.app.get('/dashboard/trends', async (req, res) => {
      const { period = '30d' } = req.query;
      try {
        const trends = await this.getKPITrends(period);
        res.json(trends);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // User cohort analysis
    this.app.get('/analytics/cohorts', async (req, res) => {
      try {
        const cohortData = await this.getCohortAnalysis();
        res.json(cohortData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Funnel analysis
    this.app.get('/analytics/funnel/:funnelType', async (req, res) => {
      const { funnelType } = req.params;
      try {
        const funnelData = await this.getFunnelAnalysis(funnelType);
        res.json(funnelData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async startMetricsCollection() {
    // Update metrics every minute
    setInterval(async () => {
      await this.updateAllMetrics();
    }, 60000);

    // Generate hourly reports
    setInterval(async () => {
      await this.generateHourlyReport();
    }, 3600000); // Every hour

    // Initial metrics collection
    await this.updateAllMetrics();
  }

  async updateAllMetrics() {
    try {
      await Promise.all([
        this.updateUserMetrics(),
        this.updateSubscriptionMetrics(),
        this.updatePetMetrics(),
        this.updateEngagementMetrics(),
        this.updateFeatureMetrics(),
        this.updateBusinessHealthMetrics()
      ]);
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  async updateUserMetrics() {
    // Total users
    const { data: totalUsers } = await this.supabase
      .from('users')
      .select('id', { count: 'exact' });
    this.metrics.totalUsers.set(totalUsers?.length || 0);

    // Active users (24h)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const { data: activeUsers } = await this.supabase
      .from('user_sessions')
      .select('user_id')
      .gte('last_activity', yesterday.toISOString())
      .group('user_id');
    this.metrics.activeUsers.set(activeUsers?.length || 0);

    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: newUsers } = await this.supabase
      .from('users')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString());
    this.metrics.newUsersToday.set(newUsers?.length || 0);

    // User retention rates
    await this.updateRetentionRates();
  }

  async updateSubscriptionMetrics() {
    // Total subscribers
    const { data: subscribers } = await this.supabase
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .eq('status', 'active');
    this.metrics.totalSubscribers.set(subscribers?.length || 0);

    // MRR calculation
    const { data: subscriptionData } = await this.supabase
      .from('subscriptions')
      .select('plan_type, price')
      .eq('status', 'active');
    
    const mrr = subscriptionData?.reduce((total, sub) => {
      const monthlyPrice = sub.plan_type === 'yearly' ? sub.price / 12 : sub.price;
      return total + monthlyPrice;
    }, 0) || 0;
    
    this.metrics.monthlyRecurringRevenue.set(mrr);

    // Churn rate (monthly)
    await this.updateChurnRate();
  }

  async updatePetMetrics() {
    // Total pets
    const { data: totalPets } = await this.supabase
      .from('pets')
      .select('id', { count: 'exact' });
    this.metrics.totalPets.set(totalPets?.length || 0);

    // Recovery rate calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: alertsLast30Days } = await this.supabase
      .from('lost_pet_alerts')
      .select('id, status')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const recoveredCount = alertsLast30Days?.filter(alert => alert.status === 'recovered').length || 0;
    const totalAlerts = alertsLast30Days?.length || 1;
    const recoveryRate = (recoveredCount / totalAlerts) * 100;
    
    this.metrics.recoveryRate.set(recoveryRate, { time_period: '30d' });

    // Average recovery time
    const { data: recoveredAlerts } = await this.supabase
      .from('lost_pet_alerts')
      .select('created_at, recovered_at')
      .eq('status', 'recovered')
      .not('recovered_at', 'is', null)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recoveredAlerts && recoveredAlerts.length > 0) {
      const averageRecoveryTime = recoveredAlerts.reduce((total, alert) => {
        const recoveryTimeMs = new Date(alert.recovered_at) - new Date(alert.created_at);
        return total + (recoveryTimeMs / (1000 * 60 * 60)); // Convert to hours
      }, 0) / recoveredAlerts.length;
      
      this.metrics.averageRecoveryTime.set(averageRecoveryTime);
    }
  }

  async updateEngagementMetrics() {
    const now = new Date();
    
    // DAU
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: dauData } = await this.supabase
      .from('analytics_events')
      .select('user_id')
      .gte('timestamp', dayAgo.toISOString())
      .group('user_id');
    this.metrics.dailyActiveUsers.set(dauData?.length || 0);

    // WAU
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: wauData } = await this.supabase
      .from('analytics_events')
      .select('user_id')
      .gte('timestamp', weekAgo.toISOString())
      .group('user_id');
    this.metrics.weeklyActiveUsers.set(wauData?.length || 0);

    // MAU
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: mauData } = await this.supabase
      .from('analytics_events')
      .select('user_id')
      .gte('timestamp', monthAgo.toISOString())
      .group('user_id');
    this.metrics.monthlyActiveUsers.set(mauData?.length || 0);
  }

  async updateFeatureMetrics() {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const { data: featureUsageData } = await this.supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'feature_used')
      .gte('timestamp', monthAgo.toISOString());

    // Process feature usage data
    const featureUsage = {};
    featureUsageData?.forEach(event => {
      const feature = event.event_data.feature;
      const userType = event.event_data.subscription_status === 'active' ? 'premium' : 'free';
      
      if (!featureUsage[feature]) {
        featureUsage[feature] = { free: 0, premium: 0 };
      }
      featureUsage[feature][userType]++;
    });

    // Update Prometheus metrics
    Object.entries(featureUsage).forEach(([feature, usage]) => {
      this.metrics.featureUsage.inc({ feature, user_type: 'free' }, usage.free);
      this.metrics.featureUsage.inc({ feature, user_type: 'premium' }, usage.premium);
    });
  }

  async updateBusinessHealthMetrics() {
    // Customer Lifetime Value (CLV)
    const { data: clvData } = await this.supabase
      .from('user_lifetime_metrics')
      .select('average_clv');
    
    if (clvData && clvData.length > 0) {
      this.metrics.customerLifetimeValue.set(clvData[0].average_clv || 0);
    }

    // Customer Acquisition Cost (CAC)
    const { data: cacData } = await this.supabase
      .from('marketing_metrics')
      .select('average_cac')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (cacData && cacData.length > 0) {
      this.metrics.customerAcquisitionCost.set(cacData[0].average_cac || 0);
    }
  }

  async updateRetentionRates() {
    const periods = ['7d', '30d', '90d'];
    
    for (const period of periods) {
      const days = parseInt(period);
      const periodAgo = new Date();
      periodAgo.setDate(periodAgo.getDate() - days);
      
      const cohortStart = new Date();
      cohortStart.setDate(cohortStart.getDate() - (days * 2));
      
      // Get users who registered in the cohort period
      const { data: cohortUsers } = await this.supabase
        .from('users')
        .select('id')
        .gte('created_at', cohortStart.toISOString())
        .lt('created_at', periodAgo.toISOString());
      
      if (cohortUsers && cohortUsers.length > 0) {
        const cohortUserIds = cohortUsers.map(u => u.id);
        
        // Check how many are still active
        const { data: activeUsers } = await this.supabase
          .from('analytics_events')
          .select('user_id')
          .in('user_id', cohortUserIds)
          .gte('timestamp', periodAgo.toISOString())
          .group('user_id');
        
        const retentionRate = ((activeUsers?.length || 0) / cohortUsers.length) * 100;
        this.metrics.userRetention.set({ period }, retentionRate);
      }
    }
  }

  async updateChurnRate() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    // Get subscribers at beginning of last month
    const { data: beginningSubscribers } = await this.supabase
      .from('subscription_history')
      .select('user_id')
      .eq('status', 'active')
      .lte('created_at', lastMonth.toISOString());
    
    // Get churned subscribers during last month
    const { data: churnedSubscribers } = await this.supabase
      .from('subscription_history')
      .select('user_id')
      .eq('status', 'cancelled')
      .gte('cancelled_at', lastMonth.toISOString());
    
    if (beginningSubscribers && beginningSubscribers.length > 0) {
      const churnRate = ((churnedSubscribers?.length || 0) / beginningSubscribers.length) * 100;
      this.metrics.churnRate.set(churnRate);
    }
  }

  async getBusinessMetrics() {
    return {
      users: {
        total: this.metrics.totalUsers.get(),
        active_24h: this.metrics.activeUsers.get(),
        new_today: this.metrics.newUsersToday.get()
      },
      subscriptions: {
        total: this.metrics.totalSubscribers.get(),
        mrr: this.metrics.monthlyRecurringRevenue.get(),
        churn_rate: this.metrics.churnRate.get()
      },
      pets: {
        total: this.metrics.totalPets.get(),
        recovery_rate_30d: this.metrics.recoveryRate.get({ time_period: '30d' }),
        average_recovery_time: this.metrics.averageRecoveryTime.get()
      },
      engagement: {
        dau: this.metrics.dailyActiveUsers.get(),
        wau: this.metrics.weeklyActiveUsers.get(),
        mau: this.metrics.monthlyActiveUsers.get()
      }
    };
  }

  async getRealtimeDashboardData() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get real-time events
    const { data: recentEvents } = await this.supabase
      .from('analytics_events')
      .select('*')
      .gte('timestamp', hourAgo.toISOString())
      .order('timestamp', { ascending: false });

    // Process real-time metrics
    const realtimeMetrics = {
      recent_events: recentEvents?.length || 0,
      active_users_now: new Set(recentEvents?.map(e => e.user_id)).size,
      lost_pet_alerts_last_hour: recentEvents?.filter(e => e.event_type === 'lost_pet_alert_created').length || 0,
      recoveries_last_hour: recentEvents?.filter(e => e.event_type === 'pet_recovered').length || 0,
      subscriptions_last_hour: recentEvents?.filter(e => e.event_type === 'subscription_conversion').length || 0,
      recent_activity: recentEvents?.slice(0, 10) || []
    };

    return realtimeMetrics;
  }

  async getKPITrends(period) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily metrics for the period
    const { data: dailyMetrics } = await this.supabase
      .from('business_metrics')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    return {
      period,
      data_points: dailyMetrics?.length || 0,
      trends: dailyMetrics || []
    };
  }

  async getCohortAnalysis() {
    // Implement cohort analysis logic
    const cohorts = [];
    const months = 12; // Analyze last 12 months

    for (let i = 0; i < months; i++) {
      const cohortDate = new Date();
      cohortDate.setMonth(cohortDate.getMonth() - i);
      cohortDate.setDate(1); // First day of month
      
      const nextMonth = new Date(cohortDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Get users who registered in this month
      const { data: cohortUsers } = await this.supabase
        .from('users')
        .select('id')
        .gte('created_at', cohortDate.toISOString())
        .lt('created_at', nextMonth.toISOString());

      if (cohortUsers && cohortUsers.length > 0) {
        const cohortSize = cohortUsers.length;
        const userIds = cohortUsers.map(u => u.id);
        
        // Calculate retention for subsequent months
        const retentionData = [];
        for (let j = 0; j < 12; j++) {
          const checkDate = new Date(nextMonth);
          checkDate.setMonth(checkDate.getMonth() + j);
          
          const { data: activeUsers } = await this.supabase
            .from('analytics_events')
            .select('user_id')
            .in('user_id', userIds)
            .gte('timestamp', checkDate.toISOString())
            .lt('timestamp', new Date(checkDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())
            .group('user_id');
          
          const retentionRate = ((activeUsers?.length || 0) / cohortSize) * 100;
          retentionData.push({
            month: j,
            retention_rate: retentionRate,
            retained_users: activeUsers?.length || 0
          });
        }

        cohorts.push({
          cohort_month: cohortDate.toISOString().substring(0, 7),
          cohort_size: cohortSize,
          retention_data: retentionData
        });
      }
    }

    return { cohorts };
  }

  async getFunnelAnalysis(funnelType) {
    const funnels = {
      onboarding: [
        'user_registration',
        'pet_profile_created',
        'location_services_enabled',
        'subscription_conversion'
      ],
      lost_pet_recovery: [
        'lost_pet_alert_created',
        'alert_shared',
        'search_initiated',
        'pet_recovered'
      ]
    };

    const steps = funnels[funnelType];
    if (!steps) {
      throw new Error('Invalid funnel type');
    }

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const funnelData = [];
    let previousStepUsers = null;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      let query = this.supabase
        .from('analytics_events')
        .select('user_id')
        .eq('event_type', step)
        .gte('timestamp', last30Days.toISOString());

      // For subsequent steps, only count users who completed previous steps
      if (previousStepUsers) {
        query = query.in('user_id', previousStepUsers);
      }

      const { data: stepUsers } = await query.group('user_id');
      const userIds = stepUsers?.map(u => u.user_id) || [];
      
      const conversionRate = previousStepUsers 
        ? (userIds.length / previousStepUsers.length) * 100 
        : 100;

      funnelData.push({
        step: i + 1,
        event_type: step,
        users: userIds.length,
        conversion_rate: conversionRate,
        drop_off_rate: 100 - conversionRate
      });

      previousStepUsers = userIds;
    }

    return {
      funnel_type: funnelType,
      period: '30d',
      steps: funnelData,
      overall_conversion_rate: funnelData.length > 0 
        ? (funnelData[funnelData.length - 1].users / funnelData[0].users) * 100 
        : 0
    };
  }

  async generateHourlyReport() {
    const hourlyMetrics = await this.getBusinessMetrics();
    
    // Store hourly report
    await this.supabase
      .from('hourly_reports')
      .insert({
        timestamp: new Date().toISOString(),
        metrics: hourlyMetrics,
        environment: this.environment
      });

    console.log('Hourly business report generated:', hourlyMetrics);
  }

  start(port = 3001) {
    this.app.listen(port, () => {
      console.log(`Business Intelligence Dashboard running on port ${port}`);
      console.log(`Metrics available at http://localhost:${port}/metrics`);
      console.log(`Business metrics at http://localhost:${port}/metrics/business`);
    });
  }
}

module.exports = BusinessIntelligenceDashboard;