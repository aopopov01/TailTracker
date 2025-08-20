// TailTracker New Relic APM Integration
// Comprehensive application performance monitoring with custom metrics and business intelligence

const newrelic = require('newrelic');

class TailTrackerAPM {
  constructor(config) {
    this.environment = config.environment || 'production';
    this.applicationName = config.applicationName || 'TailTracker API';
    this.licenseKey = config.newRelicLicenseKey;
    
    this.initializeNewRelic();
    this.setupCustomMetrics();
    this.setupBusinessMetrics();
  }

  initializeNewRelic() {
    // New Relic configuration is typically done via newrelic.js config file
    // This method provides additional runtime configuration
    
    newrelic.setApplicationName([this.applicationName, `${this.applicationName}-${this.environment}`]);
    
    // Set custom attributes that will appear on all transactions
    newrelic.addCustomAttributes({
      environment: this.environment,
      service: 'tailtracker-api',
      version: process.env.APP_VERSION || '1.0.0',
      deployment: process.env.DEPLOYMENT_ID || 'unknown'
    });

    console.log(`New Relic APM initialized for ${this.applicationName} in ${this.environment}`);
  }

  setupCustomMetrics() {
    // Set up interval for collecting custom metrics
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
    }, 60000); // Every minute
  }

  setupBusinessMetrics() {
    // Business-specific metrics collection
    this.businessMetricsInterval = setInterval(() => {
      this.collectBusinessMetrics();
    }, 300000); // Every 5 minutes
  }

  // System Metrics Collection
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Memory metrics
    newrelic.recordMetric('Custom/Memory/RSS', memUsage.rss / 1024 / 1024); // MB
    newrelic.recordMetric('Custom/Memory/HeapUsed', memUsage.heapUsed / 1024 / 1024); // MB
    newrelic.recordMetric('Custom/Memory/HeapTotal', memUsage.heapTotal / 1024 / 1024); // MB
    newrelic.recordMetric('Custom/Memory/External', memUsage.external / 1024 / 1024); // MB
    
    // CPU metrics (note: these are cumulative, not instantaneous)
    newrelic.recordMetric('Custom/CPU/User', cpuUsage.user / 1000); // milliseconds to seconds
    newrelic.recordMetric('Custom/CPU/System', cpuUsage.system / 1000); // milliseconds to seconds
    
    // Event loop metrics
    if (process._getActiveRequests && process._getActiveHandles) {
      newrelic.recordMetric('Custom/EventLoop/ActiveRequests', process._getActiveRequests().length);
      newrelic.recordMetric('Custom/EventLoop/ActiveHandles', process._getActiveHandles().length);
    }
  }

  collectApplicationMetrics() {
    // These would be populated by your application logic
    // For now, we'll set up the framework
    
    // Connection pool metrics (if available)
    if (global.dbPool) {
      newrelic.recordMetric('Custom/Database/ConnectionPool/Total', global.dbPool.totalCount);
      newrelic.recordMetric('Custom/Database/ConnectionPool/Idle', global.dbPool.idleCount);
      newrelic.recordMetric('Custom/Database/ConnectionPool/Waiting', global.dbPool.waitingCount);
    }
    
    // Cache metrics (if Redis client is available)
    if (global.redisClient) {
      // These metrics would need to be collected from Redis INFO command
      // Implementation depends on your Redis client setup
    }
  }

  async collectBusinessMetrics() {
    try {
      // These metrics should be collected from your database or business logic
      // Example implementations:
      
      // Active users (you'd implement this based on your user session tracking)
      const activeUsers = await this.getActiveUsersCount();
      newrelic.recordMetric('Custom/Business/ActiveUsers', activeUsers);
      
      // Pet profiles count
      const petCount = await this.getTotalPetCount();
      newrelic.recordMetric('Custom/Business/TotalPets', petCount);
      
      // Active lost pet alerts
      const activeLostPetAlerts = await this.getActiveLostPetAlerts();
      newrelic.recordMetric('Custom/Business/ActiveLostPetAlerts', activeLostPetAlerts);
      
      // Subscription metrics
      const subscriptionMetrics = await this.getSubscriptionMetrics();
      newrelic.recordMetric('Custom/Business/ActiveSubscriptions', subscriptionMetrics.active);
      newrelic.recordMetric('Custom/Business/TrialSubscriptions', subscriptionMetrics.trial);
      newrelic.recordMetric('Custom/Business/CancelledSubscriptions', subscriptionMetrics.cancelled);
      
    } catch (error) {
      console.error('Error collecting business metrics:', error);
      newrelic.noticeError(error);
    }
  }

  // Transaction Tracking Methods
  startTransaction(name, category = 'Custom') {
    return newrelic.startWebTransaction(name, () => {
      const transaction = newrelic.getTransaction();
      transaction.addAttribute('category', category);
      return transaction;
    });
  }

  recordCustomTransaction(name, duration, attributes = {}) {
    newrelic.recordMetric(`Custom/Transaction/${name}`, duration);
    
    Object.entries(attributes).forEach(([key, value]) => {
      newrelic.addCustomAttribute(key, value);
    });
  }

  // Database Transaction Tracking
  trackDatabaseQuery(operation, table, duration, rowCount = null) {
    const metricName = `Custom/Database/${operation}/${table}`;
    newrelic.recordMetric(metricName, duration);
    
    if (rowCount !== null) {
      newrelic.recordMetric(`${metricName}/RowCount`, rowCount);
    }
    
    newrelic.addCustomAttributes({
      'db.operation': operation,
      'db.table': table,
      'db.duration': duration,
      'db.row_count': rowCount
    });
  }

  // User Action Tracking
  trackUserAction(userId, action, details = {}) {
    newrelic.startWebTransaction(`UserAction/${action}`, () => {
      newrelic.addCustomAttributes({
        'user.id': userId,
        'user.action': action,
        'user.action_details': JSON.stringify(details),
        'timestamp': new Date().toISOString()
      });
      
      // Record as custom event
      newrelic.recordCustomEvent('UserAction', {
        userId: userId,
        action: action,
        ...details
      });
    });
  }

  // Pet Management Tracking
  trackPetProfileCreation(userId, petId, petType, success = true) {
    const eventName = 'PetProfileCreated';
    
    newrelic.recordCustomEvent(eventName, {
      userId: userId,
      petId: petId,
      petType: petType,
      success: success,
      timestamp: new Date().toISOString()
    });
    
    // Increment counter metric
    const metricName = success ? 'Custom/Pet/ProfileCreated/Success' : 'Custom/Pet/ProfileCreated/Failed';
    newrelic.incrementMetric(metricName);
  }

  trackLostPetAlert(userId, alertId, petId, alertType, urgency = 'normal') {
    const eventName = 'LostPetAlertCreated';
    
    newrelic.recordCustomEvent(eventName, {
      userId: userId,
      alertId: alertId,
      petId: petId,
      alertType: alertType,
      urgency: urgency,
      timestamp: new Date().toISOString()
    });
    
    // Record metrics
    newrelic.incrementMetric('Custom/Alerts/LostPet/Created');
    newrelic.incrementMetric(`Custom/Alerts/LostPet/Urgency/${urgency}`);
    
    // If high urgency, record special metric
    if (urgency === 'high' || urgency === 'critical') {
      newrelic.incrementMetric('Custom/Alerts/LostPet/HighPriority');
    }
  }

  trackPetRecovery(userId, alertId, petId, recoveryMethod, timeMissing) {
    const eventName = 'PetRecovered';
    
    newrelic.recordCustomEvent(eventName, {
      userId: userId,
      alertId: alertId,
      petId: petId,
      recoveryMethod: recoveryMethod,
      timeMissingHours: timeMissing,
      timestamp: new Date().toISOString()
    });
    
    // Record metrics
    newrelic.incrementMetric('Custom/Recovery/PetRecovered');
    newrelic.recordMetric('Custom/Recovery/AverageTimeMissing', timeMissing);
    newrelic.incrementMetric(`Custom/Recovery/Method/${recoveryMethod}`);
  }

  // Subscription and Payment Tracking
  trackSubscriptionEvent(userId, subscriptionId, event, planType, amount = null) {
    const eventName = 'SubscriptionEvent';
    
    newrelic.recordCustomEvent(eventName, {
      userId: userId,
      subscriptionId: subscriptionId,
      event: event, // 'created', 'cancelled', 'renewed', 'failed'
      planType: planType,
      amount: amount,
      timestamp: new Date().toISOString()
    });
    
    // Record specific metrics
    newrelic.incrementMetric(`Custom/Subscription/${event}`);
    newrelic.incrementMetric(`Custom/Subscription/Plan/${planType}/${event}`);
    
    if (amount) {
      newrelic.recordMetric('Custom/Revenue/Subscription', amount);
      newrelic.recordMetric(`Custom/Revenue/Plan/${planType}`, amount);
    }
  }

  trackPaymentEvent(userId, paymentId, event, amount, currency, paymentMethod) {
    const eventName = 'PaymentEvent';
    
    newrelic.recordCustomEvent(eventName, {
      userId: userId,
      paymentId: paymentId,
      event: event, // 'succeeded', 'failed', 'refunded'
      amount: amount,
      currency: currency,
      paymentMethod: paymentMethod,
      timestamp: new Date().toISOString()
    });
    
    // Record metrics
    newrelic.incrementMetric(`Custom/Payment/${event}`);
    newrelic.incrementMetric(`Custom/Payment/Method/${paymentMethod}/${event}`);
    
    if (event === 'succeeded') {
      newrelic.recordMetric('Custom/Revenue/Payment', amount);
    } else if (event === 'failed') {
      newrelic.incrementMetric('Custom/Payment/Failures');
    }
  }

  // Performance Tracking
  trackAPIEndpoint(method, endpoint, statusCode, duration, userId = null) {
    const transactionName = `${method} ${endpoint}`;
    
    newrelic.addCustomAttributes({
      'http.method': method,
      'http.endpoint': endpoint,
      'http.status_code': statusCode,
      'http.response_time': duration,
      'user.id': userId
    });
    
    // Record endpoint-specific metrics
    newrelic.recordMetric(`Custom/API/${method}${endpoint}/ResponseTime`, duration);
    newrelic.incrementMetric(`Custom/API/${method}${endpoint}/Requests`);
    newrelic.incrementMetric(`Custom/API/${method}${endpoint}/Status/${statusCode}`);
    
    // Track errors
    if (statusCode >= 400) {
      newrelic.incrementMetric(`Custom/API/Errors/${statusCode}`);
      
      if (statusCode >= 500) {
        newrelic.incrementMetric('Custom/API/ServerErrors');
      } else if (statusCode >= 400) {
        newrelic.incrementMetric('Custom/API/ClientErrors');
      }
    }
    
    // Alert on slow endpoints
    if (duration > 5000) { // 5 seconds
      newrelic.recordCustomEvent('SlowAPIEndpoint', {
        method: method,
        endpoint: endpoint,
        duration: duration,
        status_code: statusCode,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Error Tracking
  trackError(error, context = {}, userId = null) {
    // Add context to the error
    const errorAttributes = {
      'error.context': JSON.stringify(context),
      'user.id': userId,
      'timestamp': new Date().toISOString(),
      ...context
    };
    
    newrelic.addCustomAttributes(errorAttributes);
    newrelic.noticeError(error);
    
    // Record error metrics
    newrelic.incrementMetric('Custom/Errors/Total');
    newrelic.incrementMetric(`Custom/Errors/Type/${error.constructor.name}`);
    
    // Record custom event for error analysis
    newrelic.recordCustomEvent('ErrorOccurred', {
      errorType: error.constructor.name,
      errorMessage: error.message,
      userId: userId,
      context: context,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  // Feature Usage Tracking
  trackFeatureUsage(userId, feature, action, isPremiumFeature = false, subscriptionStatus = null) {
    newrelic.recordCustomEvent('FeatureUsage', {
      userId: userId,
      feature: feature,
      action: action,
      isPremiumFeature: isPremiumFeature,
      subscriptionStatus: subscriptionStatus,
      timestamp: new Date().toISOString()
    });
    
    // Record metrics
    newrelic.incrementMetric(`Custom/Feature/${feature}/${action}`);
    
    if (isPremiumFeature) {
      newrelic.incrementMetric('Custom/Feature/Premium/Usage');
      newrelic.incrementMetric(`Custom/Feature/Premium/${feature}`);
    } else {
      newrelic.incrementMetric('Custom/Feature/Free/Usage');
    }
  }

  // Business Intelligence Helpers (these would need to be implemented based on your data layer)
  async getActiveUsersCount() {
    // Implement based on your user tracking logic
    // This might query your database for users active in the last 24 hours
    return 0; // Placeholder
  }

  async getTotalPetCount() {
    // Implement based on your database
    return 0; // Placeholder
  }

  async getActiveLostPetAlerts() {
    // Implement based on your database
    return 0; // Placeholder
  }

  async getSubscriptionMetrics() {
    // Implement based on your subscription system
    return {
      active: 0,
      trial: 0,
      cancelled: 0
    }; // Placeholder
  }

  // Health and Monitoring
  getHealthMetrics() {
    return {
      newrelic_connected: true,
      application_name: this.applicationName,
      environment: this.environment,
      metrics_collection_active: !!this.metricsInterval,
      business_metrics_active: !!this.businessMetricsInterval
    };
  }

  // Shutdown cleanup
  shutdown() {
    console.log('Shutting down New Relic APM...');
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.businessMetricsInterval) {
      clearInterval(this.businessMetricsInterval);
    }
    
    // New Relic doesn't have an explicit shutdown method
    // It handles cleanup automatically
    console.log('New Relic APM shutdown complete');
  }
}

module.exports = TailTrackerAPM;