// TailTracker Feature Flag Management System
// Comprehensive feature flag service with A/B testing and gradual rollout capabilities

const { createClient } = require('@supabase/supabase-js');
const EventEmitter = require('events');

class TailTrackerFeatureFlags extends EventEmitter {
  constructor(config) {
    super();
    
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.environment = config.environment || 'production';
    this.cacheTimeout = config.cacheTimeout || 300000; // 5 minutes
    
    // In-memory cache for feature flags
    this.flagsCache = new Map();
    this.lastCacheUpdate = null;
    
    // User segment cache
    this.userSegments = new Map();
    
    // A/B test configurations
    this.abTestConfigs = new Map();
    
    this.initializeFeatureFlags();
  }

  async initializeFeatureFlags() {
    try {
      // Load initial feature flags from database
      await this.refreshFeatureFlags();
      
      // Set up periodic cache refresh
      setInterval(() => {
        this.refreshFeatureFlags();
      }, this.cacheTimeout);
      
      // Load A/B test configurations
      await this.loadABTestConfigs();
      
      console.log(`Feature flags initialized for ${this.environment} environment`);
      
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
      this.emit('error', error);
    }
  }

  async refreshFeatureFlags() {
    try {
      const { data: flags, error } = await this.supabase
        .from('feature_flags')
        .select('*')
        .eq('environment', this.environment)
        .eq('is_active', true);

      if (error) throw error;

      // Update cache
      this.flagsCache.clear();
      flags.forEach(flag => {
        this.flagsCache.set(flag.name, flag);
      });

      this.lastCacheUpdate = new Date();
      this.emit('flags_updated', flags.length);

    } catch (error) {
      console.error('Failed to refresh feature flags:', error);
      this.emit('error', error);
    }
  }

  async loadABTestConfigs() {
    try {
      const { data: tests, error } = await this.supabase
        .from('ab_tests')
        .select('*')
        .eq('environment', this.environment)
        .eq('status', 'active');

      if (error) throw error;

      this.abTestConfigs.clear();
      tests.forEach(test => {
        this.abTestConfigs.set(test.name, test);
      });

      console.log(`Loaded ${tests.length} A/B test configurations`);

    } catch (error) {
      console.error('Failed to load A/B test configs:', error);
    }
  }

  // Main feature flag evaluation method
  async isEnabled(flagName, userId = null, context = {}) {
    try {
      const flag = this.flagsCache.get(flagName);
      
      if (!flag) {
        console.warn(`Feature flag '${flagName}' not found, defaulting to false`);
        await this.logFlagEvaluation(flagName, userId, false, 'flag_not_found', context);
        return false;
      }

      // Check if flag is globally enabled
      if (!flag.is_active) {
        await this.logFlagEvaluation(flagName, userId, false, 'flag_inactive', context);
        return false;
      }

      // Simple boolean flags
      if (flag.flag_type === 'boolean') {
        const result = flag.default_value;
        await this.logFlagEvaluation(flagName, userId, result, 'boolean_flag', context);
        return result;
      }

      // Percentage rollout flags
      if (flag.flag_type === 'percentage') {
        const result = await this.evaluatePercentageFlag(flag, userId, context);
        await this.logFlagEvaluation(flagName, userId, result, 'percentage_rollout', context);
        return result;
      }

      // User segment flags
      if (flag.flag_type === 'segment') {
        const result = await this.evaluateSegmentFlag(flag, userId, context);
        await this.logFlagEvaluation(flagName, userId, result, 'user_segment', context);
        return result;
      }

      // A/B test flags
      if (flag.flag_type === 'ab_test') {
        const result = await this.evaluateABTestFlag(flag, userId, context);
        await this.logFlagEvaluation(flagName, userId, result.enabled, 'ab_test', {
          ...context,
          variant: result.variant
        });
        return result.enabled;
      }

      // Default fallback
      const defaultResult = flag.default_value || false;
      await this.logFlagEvaluation(flagName, userId, defaultResult, 'default_fallback', context);
      return defaultResult;

    } catch (error) {
      console.error(`Error evaluating feature flag '${flagName}':`, error);
      await this.logFlagEvaluation(flagName, userId, false, 'evaluation_error', {
        ...context,
        error: error.message
      });
      return false;
    }
  }

  // Get feature flag with variant information (for A/B tests)
  async getFlag(flagName, userId = null, context = {}) {
    const flag = this.flagsCache.get(flagName);
    
    if (!flag) {
      return { enabled: false, variant: null, reason: 'flag_not_found' };
    }

    if (flag.flag_type === 'ab_test') {
      return await this.evaluateABTestFlag(flag, userId, context);
    }

    const enabled = await this.isEnabled(flagName, userId, context);
    return { enabled, variant: null, reason: 'standard_flag' };
  }

  async evaluatePercentageFlag(flag, userId, context) {
    const rolloutPercentage = flag.rollout_percentage || 0;
    
    if (rolloutPercentage === 0) return false;
    if (rolloutPercentage === 100) return true;

    // Use consistent hashing for user-based rollout
    if (userId) {
      const hash = this.hashString(`${flag.name}-${userId}`);
      const userPercentage = hash % 100;
      return userPercentage < rolloutPercentage;
    }

    // Random rollout for anonymous users
    return Math.random() * 100 < rolloutPercentage;
  }

  async evaluateSegmentFlag(flag, userId, context) {
    if (!userId) return false;

    try {
      // Get user segment information
      let userSegment = this.userSegments.get(userId);
      
      if (!userSegment) {
        userSegment = await this.getUserSegment(userId);
        this.userSegments.set(userId, userSegment);
      }

      const targetSegments = flag.target_segments || [];
      
      // Check if user belongs to any target segment
      return targetSegments.some(segment => 
        this.isUserInSegment(userSegment, segment, context)
      );

    } catch (error) {
      console.error('Error evaluating segment flag:', error);
      return false;
    }
  }

  async evaluateABTestFlag(flag, userId, context) {
    const testConfig = this.abTestConfigs.get(flag.name);
    
    if (!testConfig) {
      return { enabled: false, variant: null, reason: 'test_not_found' };
    }

    // Check if user is in test
    if (!this.isUserInTest(testConfig, userId, context)) {
      return { enabled: false, variant: 'control', reason: 'not_in_test' };
    }

    // Determine variant
    const variant = this.getTestVariant(testConfig, userId);
    const enabled = variant !== 'control';

    // Log A/B test exposure
    await this.logABTestExposure(testConfig.name, userId, variant, context);

    return { enabled, variant, reason: 'ab_test_assignment' };
  }

  isUserInTest(testConfig, userId, context) {
    // Traffic allocation check
    if (testConfig.traffic_allocation < 100) {
      const hash = this.hashString(`${testConfig.name}-traffic-${userId}`);
      const userTrafficPercentage = hash % 100;
      if (userTrafficPercentage >= testConfig.traffic_allocation) {
        return false;
      }
    }

    // Segment targeting
    if (testConfig.target_segments && testConfig.target_segments.length > 0) {
      const userSegment = this.userSegments.get(userId);
      if (!userSegment) return false;
      
      return testConfig.target_segments.some(segment =>
        this.isUserInSegment(userSegment, segment, context)
      );
    }

    return true;
  }

  getTestVariant(testConfig, userId) {
    const hash = this.hashString(`${testConfig.name}-variant-${userId}`);
    const variants = testConfig.variants || [
      { name: 'control', weight: 50 },
      { name: 'treatment', weight: 50 }
    ];

    // Calculate cumulative weights
    let cumulativeWeight = 0;
    const weightedVariants = variants.map(variant => {
      cumulativeWeight += variant.weight;
      return { ...variant, cumulativeWeight };
    });

    // Determine variant based on hash
    const userWeight = hash % 100;
    const selectedVariant = weightedVariants.find(variant => 
      userWeight < variant.cumulativeWeight
    );

    return selectedVariant ? selectedVariant.name : 'control';
  }

  async getUserSegment(userId) {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select(`
          *,
          subscriptions (*),
          user_profile (*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        user_id: userId,
        subscription_status: user.subscriptions?.[0]?.status || 'free',
        plan_type: user.subscriptions?.[0]?.plan_type || 'free',
        registration_date: user.created_at,
        country: user.user_profile?.country,
        device_type: user.user_profile?.device_type,
        app_version: user.user_profile?.app_version,
        pet_count: user.user_profile?.pet_count || 0,
        is_premium: user.subscriptions?.[0]?.status === 'active'
      };

    } catch (error) {
      console.error('Error fetching user segment:', error);
      return null;
    }
  }

  isUserInSegment(userSegment, targetSegment, context) {
    if (!userSegment) return false;

    // Subscription-based targeting
    if (targetSegment.subscription_status) {
      if (userSegment.subscription_status !== targetSegment.subscription_status) {
        return false;
      }
    }

    // Plan type targeting
    if (targetSegment.plan_type) {
      if (userSegment.plan_type !== targetSegment.plan_type) {
        return false;
      }
    }

    // Geographic targeting
    if (targetSegment.countries && targetSegment.countries.length > 0) {
      if (!targetSegment.countries.includes(userSegment.country)) {
        return false;
      }
    }

    // Device type targeting
    if (targetSegment.device_types && targetSegment.device_types.length > 0) {
      if (!targetSegment.device_types.includes(userSegment.device_type)) {
        return false;
      }
    }

    // Registration date targeting (new vs old users)
    if (targetSegment.user_age_days) {
      const registrationDate = new Date(userSegment.registration_date);
      const daysSinceRegistration = (new Date() - registrationDate) / (1000 * 60 * 60 * 24);
      
      if (targetSegment.user_age_days.min && daysSinceRegistration < targetSegment.user_age_days.min) {
        return false;
      }
      
      if (targetSegment.user_age_days.max && daysSinceRegistration > targetSegment.user_age_days.max) {
        return false;
      }
    }

    // Pet count targeting
    if (targetSegment.pet_count) {
      if (targetSegment.pet_count.min && userSegment.pet_count < targetSegment.pet_count.min) {
        return false;
      }
      
      if (targetSegment.pet_count.max && userSegment.pet_count > targetSegment.pet_count.max) {
        return false;
      }
    }

    return true;
  }

  // Flag management methods
  async createFlag(flagConfig) {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .insert({
          ...flagConfig,
          environment: this.environment,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update cache
      await this.refreshFeatureFlags();

      this.emit('flag_created', data);
      return data;

    } catch (error) {
      console.error('Error creating feature flag:', error);
      throw error;
    }
  }

  async updateFlag(flagName, updates) {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('name', flagName)
        .eq('environment', this.environment)
        .select()
        .single();

      if (error) throw error;

      // Update cache
      await this.refreshFeatureFlags();

      this.emit('flag_updated', data);
      return data;

    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw error;
    }
  }

  async deleteFlag(flagName) {
    try {
      const { error } = await this.supabase
        .from('feature_flags')
        .delete()
        .eq('name', flagName)
        .eq('environment', this.environment);

      if (error) throw error;

      // Update cache
      await this.refreshFeatureFlags();

      this.emit('flag_deleted', flagName);

    } catch (error) {
      console.error('Error deleting feature flag:', error);
      throw error;
    }
  }

  // A/B testing methods
  async createABTest(testConfig) {
    try {
      const { data, error } = await this.supabase
        .from('ab_tests')
        .insert({
          ...testConfig,
          environment: this.environment,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Also create corresponding feature flag
      await this.createFlag({
        name: testConfig.name,
        flag_type: 'ab_test',
        description: `A/B test: ${testConfig.description}`,
        is_active: true
      });

      await this.loadABTestConfigs();

      this.emit('ab_test_created', data);
      return data;

    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  async stopABTest(testName, winningVariant = null) {
    try {
      const { data, error } = await this.supabase
        .from('ab_tests')
        .update({
          status: 'completed',
          winning_variant: winningVariant,
          ended_at: new Date().toISOString()
        })
        .eq('name', testName)
        .eq('environment', this.environment)
        .select()
        .single();

      if (error) throw error;

      // If there's a winning variant, convert to permanent feature flag
      if (winningVariant && winningVariant !== 'control') {
        await this.updateFlag(testName, {
          flag_type: 'boolean',
          default_value: true,
          description: `Graduated from A/B test - winning variant: ${winningVariant}`
        });
      } else {
        // Remove feature flag if control won
        await this.deleteFlag(testName);
      }

      await this.loadABTestConfigs();

      this.emit('ab_test_stopped', { testName, winningVariant });
      return data;

    } catch (error) {
      console.error('Error stopping A/B test:', error);
      throw error;
    }
  }

  // Logging and analytics
  async logFlagEvaluation(flagName, userId, result, reason, context) {
    try {
      await this.supabase
        .from('feature_flag_evaluations')
        .insert({
          flag_name: flagName,
          user_id: userId,
          result: result,
          reason: reason,
          context: context,
          environment: this.environment,
          timestamp: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error logging flag evaluation:', error);
    }
  }

  async logABTestExposure(testName, userId, variant, context) {
    try {
      await this.supabase
        .from('ab_test_exposures')
        .insert({
          test_name: testName,
          user_id: userId,
          variant: variant,
          context: context,
          environment: this.environment,
          timestamp: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error logging A/B test exposure:', error);
    }
  }

  // Analytics and reporting
  async getFlagAnalytics(flagName, timeRange = '7d') {
    try {
      const startDate = this.getStartDate(timeRange);

      const { data: evaluations, error } = await this.supabase
        .from('feature_flag_evaluations')
        .select('*')
        .eq('flag_name', flagName)
        .eq('environment', this.environment)
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;

      const analytics = {
        total_evaluations: evaluations.length,
        unique_users: new Set(evaluations.map(e => e.user_id).filter(Boolean)).size,
        enabled_rate: evaluations.filter(e => e.result === true).length / evaluations.length,
        disabled_rate: evaluations.filter(e => e.result === false).length / evaluations.length,
        reasons: this.groupBy(evaluations, 'reason'),
        daily_breakdown: this.groupByDate(evaluations)
      };

      return analytics;

    } catch (error) {
      console.error('Error getting flag analytics:', error);
      throw error;
    }
  }

  async getABTestResults(testName) {
    try {
      const { data: exposures, error } = await this.supabase
        .from('ab_test_exposures')
        .select('*')
        .eq('test_name', testName)
        .eq('environment', this.environment);

      if (error) throw error;

      const results = {
        total_exposures: exposures.length,
        unique_users: new Set(exposures.map(e => e.user_id)).size,
        variant_breakdown: this.groupBy(exposures, 'variant'),
        daily_exposures: this.groupByDate(exposures)
      };

      return results;

    } catch (error) {
      console.error('Error getting A/B test results:', error);
      throw error;
    }
  }

  // Utility methods
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  groupByDate(array) {
    const dateGroups = {};
    array.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      dateGroups[date] = dateGroups[date] || [];
      dateGroups[date].push(item);
    });
    return dateGroups;
  }

  // Health check
  getHealthStatus() {
    return {
      flags_cached: this.flagsCache.size,
      ab_tests_cached: this.abTestConfigs.size,
      last_cache_update: this.lastCacheUpdate,
      cache_age_ms: this.lastCacheUpdate ? new Date() - this.lastCacheUpdate : null,
      environment: this.environment
    };
  }
}

module.exports = TailTrackerFeatureFlags;