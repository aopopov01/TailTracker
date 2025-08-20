// TailTracker Error Tracking and APM Integration
// Comprehensive error monitoring with Sentry, custom alerting, and performance tracking

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const express = require('express');

class TailTrackerErrorTracking {
  constructor(config) {
    this.environment = config.environment || 'production';
    this.dsn = config.sentryDsn;
    this.release = config.release || '1.0.0';
    this.serverName = config.serverName || 'tailtracker-api';
    
    this.initializeSentry();
    this.initializeCustomIntegrations();
    this.setupPerformanceTracking();
  }

  initializeSentry() {
    Sentry.init({
      dsn: this.dsn,
      environment: this.environment,
      release: this.release,
      serverName: this.serverName,
      
      // Performance Monitoring
      tracesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
      profilesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
      
      // Session Tracking
      autoSessionTracking: true,
      
      // Integrations
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: express() }),
        new Sentry.Integrations.Postgres(),
        new Sentry.Integrations.Redis(),
        new ProfilingIntegration(),
        new Sentry.Integrations.RequestData({
          include: {
            cookies: false,
            data: true,
            headers: ['user-agent', 'x-forwarded-for'],
            ip: true,
            query_string: true,
            url: true,
            user: true
          }
        })
      ],
      
      // Error Filtering
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        if (event.exception) {
          const error = hint.originalException;
          
          // Skip validation errors for non-production environments
          if (error?.name === 'ValidationError' && process.env.NODE_ENV !== 'production') {
            return null;
          }
          
          // Skip rate limiting errors (they're handled separately)
          if (error?.message?.includes('Rate limit exceeded')) {
            return null;
          }
          
          // Skip database connection timeouts in development
          if (error?.code === 'ETIMEOUT' && process.env.NODE_ENV === 'development') {
            return null;
          }
        }
        
        return event;
      },
      
      // Performance Filtering
      beforeSendTransaction(event) {
        // Don't track health check transactions
        if (event.transaction === 'GET /health') {
          return null;
        }
        
        // Don't track metrics endpoints
        if (event.transaction?.includes('/metrics')) {
          return null;
        }
        
        return event;
      },
      
      // Custom Tags
      initialScope: {
        tags: {
          component: 'backend-api',
          server: this.serverName,
          version: this.release
        },
        level: 'error'
      }
    });

    console.log(`Sentry initialized for ${this.environment} environment`);
  }

  initializeCustomIntegrations() {
    // Express middleware
    this.requestHandler = Sentry.Handlers.requestHandler({
      user: ['id', 'email'],
      request: ['headers', 'method', 'query_string', 'url'],
      serverName: this.serverName
    });

    this.tracingHandler = Sentry.Handlers.tracingHandler();
    this.errorHandler = Sentry.Handlers.errorHandler();

    // Custom error context enrichment
    Sentry.configureScope(scope => {
      scope.setContext('runtime', {
        name: 'node',
        version: process.version,
        platform: process.platform
      });
      
      scope.setContext('app', {
        name: 'TailTracker API',
        version: this.release,
        environment: this.environment
      });
    });
  }

  setupPerformanceTracking() {
    // Database query performance tracking
    this.trackDatabasePerformance();
    
    // Cache performance tracking
    this.trackCachePerformance();
    
    // External API performance tracking
    this.trackExternalAPIPerformance();
    
    // Custom business logic performance tracking
    this.trackBusinessLogicPerformance();
  }

  trackDatabasePerformance() {
    const originalQuery = require('pg').Client.prototype.query;
    
    require('pg').Client.prototype.query = function(...args) {
      const transaction = Sentry.startTransaction({
        op: 'db.query',
        name: 'Database Query'
      });
      
      const startTime = Date.now();
      
      return originalQuery.apply(this, args).then(result => {
        transaction.setData('query', args[0]);
        transaction.setData('rows_affected', result.rowCount);
        transaction.setTag('database', 'postgresql');
        transaction.finish();
        
        const duration = Date.now() - startTime;
        
        // Alert on slow queries
        if (duration > 5000) {
          Sentry.addBreadcrumb({
            message: 'Slow database query detected',
            category: 'database',
            level: 'warning',
            data: {
              query: args[0],
              duration: duration,
              rows: result.rowCount
            }
          });
        }
        
        return result;
      }).catch(error => {
        transaction.setStatus('internal_error');
        transaction.finish();
        throw error;
      });
    };
  }

  trackCachePerformance() {
    // Redis performance tracking
    const redis = require('redis');
    const originalSendCommand = redis.RedisClient?.prototype?.send_command;
    
    if (originalSendCommand) {
      redis.RedisClient.prototype.send_command = function(command, args, callback) {
        const transaction = Sentry.startTransaction({
          op: 'cache.query',
          name: `Redis ${command.toUpperCase()}`
        });
        
        const startTime = Date.now();
        
        const wrappedCallback = (err, result) => {
          const duration = Date.now() - startTime;
          
          transaction.setData('command', command);
          transaction.setData('args_count', args ? args.length : 0);
          transaction.setTag('cache', 'redis');
          
          if (err) {
            transaction.setStatus('internal_error');
          } else {
            transaction.setStatus('ok');
          }
          
          transaction.finish();
          
          // Alert on cache misses or slow operations
          if (duration > 1000) {
            Sentry.addBreadcrumb({
              message: 'Slow cache operation',
              category: 'cache',
              level: 'warning',
              data: {
                command: command,
                duration: duration
              }
            });
          }
          
          if (callback) callback(err, result);
        };
        
        return originalSendCommand.call(this, command, args, wrappedCallback);
      };
    }
  }

  trackExternalAPIPerformance() {
    // HTTP request tracking
    const https = require('https');
    const http = require('http');
    
    const wrapHttpRequest = (module, protocol) => {
      const originalRequest = module.request;
      
      module.request = function(options, callback) {
        const transaction = Sentry.startTransaction({
          op: 'http.client',
          name: `${protocol.toUpperCase()} Request`
        });
        
        const startTime = Date.now();
        
        const req = originalRequest.call(this, options, (res) => {
          const duration = Date.now() - startTime;
          
          transaction.setData('url', `${protocol}://${options.hostname}${options.path}`);
          transaction.setData('method', options.method || 'GET');
          transaction.setData('status_code', res.statusCode);
          transaction.setTag('http.status_code', res.statusCode.toString());
          
          if (res.statusCode >= 400) {
            transaction.setStatus('failed_precondition');
          } else {
            transaction.setStatus('ok');
          }
          
          transaction.finish();
          
          // Alert on slow external API calls
          if (duration > 10000) {
            Sentry.addBreadcrumb({
              message: 'Slow external API call',
              category: 'http',
              level: 'warning',
              data: {
                url: `${protocol}://${options.hostname}${options.path}`,
                method: options.method || 'GET',
                status: res.statusCode,
                duration: duration
              }
            });
          }
          
          if (callback) callback(res);
        });
        
        req.on('error', (error) => {
          transaction.setStatus('internal_error');
          transaction.finish();
          
          this.captureException(error, {
            tags: {
              operation: 'http_request',
              url: `${protocol}://${options.hostname}${options.path}`
            }
          });
        });
        
        return req;
      };
    };
    
    wrapHttpRequest(https, 'https');
    wrapHttpRequest(http, 'http');
  }

  trackBusinessLogicPerformance() {
    // Custom transaction tracking for business operations
    this.createTransactionWrapper = (operation, name) => {
      return async (data) => {
        const transaction = Sentry.startTransaction({
          op: 'business.operation',
          name: name
        });
        
        try {
          Sentry.configureScope(scope => {
            scope.setTag('business_operation', operation);
            scope.setContext('operation_data', {
              operation: operation,
              timestamp: new Date().toISOString()
            });
          });
          
          const result = await operation(data);
          transaction.setStatus('ok');
          
          return result;
        } catch (error) {
          transaction.setStatus('internal_error');
          throw error;
        } finally {
          transaction.finish();
        }
      };
    };
  }

  // Business-specific error tracking methods
  captureUserError(error, userId, context = {}) {
    Sentry.withScope(scope => {
      scope.setUser({ id: userId });
      scope.setTag('error_type', 'user_error');
      scope.setLevel('error');
      scope.setContext('user_context', context);
      
      Sentry.captureException(error);
    });
  }

  capturePetAlertError(error, alertId, userId, context = {}) {
    Sentry.withScope(scope => {
      scope.setUser({ id: userId });
      scope.setTag('error_type', 'pet_alert_error');
      scope.setTag('alert_id', alertId);
      scope.setLevel('error');
      scope.setContext('alert_context', {
        alert_id: alertId,
        ...context
      });
      
      Sentry.captureException(error);
    });
    
    // Send urgent notification for pet alert failures
    this.sendUrgentAlert('pet_alert_error', {
      error: error.message,
      alert_id: alertId,
      user_id: userId,
      context: context
    });
  }

  capturePaymentError(error, userId, paymentData = {}) {
    Sentry.withScope(scope => {
      scope.setUser({ id: userId });
      scope.setTag('error_type', 'payment_error');
      scope.setLevel('error');
      scope.setContext('payment_context', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentData.paymentMethod,
        subscription_id: paymentData.subscriptionId
      });
      
      Sentry.captureException(error);
    });
    
    // Immediate notification for payment failures
    this.sendUrgentAlert('payment_error', {
      error: error.message,
      user_id: userId,
      payment_data: paymentData
    });
  }

  captureSecurityEvent(event, userId, ipAddress, context = {}) {
    Sentry.withScope(scope => {
      scope.setUser({ id: userId, ip_address: ipAddress });
      scope.setTag('event_type', 'security_event');
      scope.setLevel('warning');
      scope.setContext('security_context', {
        event_type: event,
        ip_address: ipAddress,
        timestamp: new Date().toISOString(),
        ...context
      });
      
      Sentry.captureMessage(`Security event: ${event}`, 'warning');
    });
    
    // Send security alert
    this.sendSecurityAlert(event, userId, ipAddress, context);
  }

  captureAPIPerformanceIssue(endpoint, duration, context = {}) {
    if (duration > 5000) { // 5 seconds threshold
      Sentry.withScope(scope => {
        scope.setTag('issue_type', 'performance');
        scope.setTag('endpoint', endpoint);
        scope.setLevel('warning');
        scope.setContext('performance_context', {
          endpoint: endpoint,
          duration: duration,
          threshold_exceeded: '5000ms',
          ...context
        });
        
        Sentry.captureMessage(`Slow API endpoint: ${endpoint} (${duration}ms)`, 'warning');
      });
    }
  }

  // Custom alerting methods
  sendUrgentAlert(alertType, data) {
    console.log(`URGENT ALERT [${alertType}]:`, data);
    
    // Send to Sentry as high-priority message
    Sentry.withScope(scope => {
      scope.setLevel('fatal');
      scope.setTag('alert_type', alertType);
      scope.setContext('alert_data', data);
      
      Sentry.captureMessage(`Urgent Alert: ${alertType}`, 'fatal');
    });
  }

  sendSecurityAlert(event, userId, ipAddress, context) {
    console.log(`SECURITY ALERT [${event}]:`, { userId, ipAddress, context });
    
    Sentry.withScope(scope => {
      scope.setLevel('error');
      scope.setTag('alert_type', 'security');
      scope.setTag('security_event', event);
      scope.setContext('security_data', {
        user_id: userId,
        ip_address: ipAddress,
        context: context
      });
      
      Sentry.captureMessage(`Security Alert: ${event}`, 'error');
    });
  }

  // Health check and monitoring endpoints
  getHealthStatus() {
    return {
      sentry_connected: true,
      environment: this.environment,
      release: this.release,
      server: this.serverName,
      timestamp: new Date().toISOString()
    };
  }

  // Express middleware setup
  setupExpressMiddleware(app) {
    // Request tracking
    app.use(this.requestHandler);
    app.use(this.tracingHandler);
    
    // Custom middleware for business context
    app.use((req, res, next) => {
      Sentry.configureScope(scope => {
        scope.setTag('request_id', req.id || 'unknown');
        scope.setTag('endpoint', `${req.method} ${req.route?.path || req.path}`);
        
        if (req.user) {
          scope.setUser({
            id: req.user.id,
            email: req.user.email
          });
        }
        
        if (req.headers['user-agent']) {
          scope.setTag('user_agent', req.headers['user-agent']);
        }
      });
      
      next();
    });
    
    // Error handling middleware (should be last)
    app.use(this.errorHandler);
    
    // Health check endpoint
    app.get('/health/sentry', (req, res) => {
      res.json(this.getHealthStatus());
    });
  }

  // Performance profiling
  startPerformanceProfile(name, metadata = {}) {
    return Sentry.startTransaction({
      op: 'performance.profile',
      name: name,
      metadata: metadata
    });
  }

  // Custom metrics integration
  recordCustomMetric(name, value, tags = {}) {
    Sentry.addBreadcrumb({
      message: `Custom metric: ${name}`,
      category: 'metric',
      data: {
        metric_name: name,
        value: value,
        tags: tags
      },
      level: 'info'
    });
  }

  // Shutdown and cleanup
  async shutdown() {
    console.log('Shutting down Sentry error tracking...');
    
    // Flush any pending events
    await Sentry.close(5000); // 5 second timeout
    
    console.log('Sentry error tracking shutdown complete');
  }
}

module.exports = TailTrackerErrorTracking;