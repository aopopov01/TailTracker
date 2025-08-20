// TailTracker Security Monitoring System
// Comprehensive security monitoring, threat detection, and compliance checks

const EventEmitter = require('events');
const crypto = require('crypto');
const geoip = require('geoip-lite');

class TailTrackerSecurityMonitoring extends EventEmitter {
  constructor(config) {
    super();
    
    this.environment = config.environment || 'production';
    this.alertingConfig = config.alerting || {};
    this.complianceConfig = config.compliance || {};
    
    // Security event storage and processing
    this.securityEvents = [];
    this.threatDetectionRules = new Map();
    this.complianceChecks = new Map();
    this.suspiciousActivities = new Map();
    
    // Rate limiting and anomaly detection
    this.requestPatterns = new Map();
    this.loginAttempts = new Map();
    this.ipReputationCache = new Map();
    
    // Initialize monitoring systems
    this.initializeSecurityRules();
    this.initializeComplianceChecks();
    this.startBackgroundProcessing();
    
    console.log(`Security monitoring initialized for ${this.environment}`);
  }

  initializeSecurityRules() {
    // Authentication-related threats
    this.threatDetectionRules.set('brute_force_login', {
      description: 'Brute force login attempts detection',
      threshold: 5,
      timeWindow: 300000, // 5 minutes
      severity: 'high',
      action: 'block_ip'
    });

    this.threatDetectionRules.set('credential_stuffing', {
      description: 'Credential stuffing attack detection',
      threshold: 10,
      timeWindow: 600000, // 10 minutes
      severity: 'high',
      action: 'block_ip'
    });

    this.threatDetectionRules.set('account_takeover', {
      description: 'Account takeover attempt detection',
      indicators: ['multiple_device_logins', 'location_change', 'password_change'],
      severity: 'critical',
      action: 'freeze_account'
    });

    // API abuse detection
    this.threatDetectionRules.set('api_abuse', {
      description: 'API abuse and scraping detection',
      requestThreshold: 1000,
      timeWindow: 60000, // 1 minute
      severity: 'medium',
      action: 'rate_limit'
    });

    this.threatDetectionRules.set('data_exfiltration', {
      description: 'Data exfiltration attempt detection',
      volumeThreshold: 1000, // API calls
      dataThreshold: 10000000, // 10MB
      timeWindow: 3600000, // 1 hour
      severity: 'critical',
      action: 'block_user'
    });

    // Injection attacks
    this.threatDetectionRules.set('sql_injection', {
      description: 'SQL injection attempt detection',
      patterns: [
        /('|(\\');|;--|;\\s*drop\\s+table|union\\s+select)/i,
        /(exec(\\s|\\+)+(s|x)p\\w+|sp_\\w+)/i
      ],
      severity: 'high',
      action: 'block_ip'
    });

    this.threatDetectionRules.set('xss_attempt', {
      description: 'XSS attack attempt detection',
      patterns: [
        /<script[^>]*>.*?<\\/script>/gi,
        /javascript:|data:text\\/html|vbscript:/gi,
        /on\\w+\\s*=\\s*["\']?[^"\'>]*["\']?/gi
      ],
      severity: 'medium',
      action: 'sanitize_input'
    });

    // Mobile app specific threats
    this.threatDetectionRules.set('app_tampering', {
      description: 'Mobile app tampering detection',
      indicators: ['invalid_signature', 'debug_mode', 'jailbreak_indicators'],
      severity: 'high',
      action: 'block_device'
    });

    this.threatDetectionRules.set('device_fingerprint_spoofing', {
      description: 'Device fingerprint spoofing detection',
      severity: 'medium',
      action: 'require_additional_verification'
    });
  }

  initializeComplianceChecks() {
    // GDPR Compliance
    this.complianceChecks.set('gdpr_data_retention', {
      description: 'GDPR data retention compliance',
      maxRetentionDays: 2555, // 7 years for financial records
      checkInterval: 86400000, // Daily
      severity: 'high'
    });

    this.complianceChecks.set('gdpr_right_to_deletion', {
      description: 'GDPR right to deletion compliance',
      maxResponseDays: 30,
      severity: 'critical'
    });

    this.complianceChecks.set('gdpr_data_portability', {
      description: 'GDPR data portability compliance',
      maxResponseDays: 30,
      severity: 'medium'
    });

    // CCPA Compliance
    this.complianceChecks.set('ccpa_opt_out', {
      description: 'CCPA opt-out compliance',
      maxResponseHours: 48,
      severity: 'high'
    });

    // PCI DSS Compliance (for payment processing)
    this.complianceChecks.set('pci_dss_encryption', {
      description: 'PCI DSS encryption compliance',
      requirements: ['data_at_rest', 'data_in_transit'],
      severity: 'critical'
    });

    // SOC 2 Compliance
    this.complianceChecks.set('soc2_access_controls', {
      description: 'SOC 2 access control compliance',
      requirements: ['mfa_enabled', 'role_based_access', 'audit_logging'],
      severity: 'high'
    });

    // App Store Compliance
    this.complianceChecks.set('app_store_privacy', {
      description: 'App store privacy compliance',
      requirements: ['privacy_manifest', 'data_usage_disclosure'],
      severity: 'medium'
    });
  }

  // Security event processing
  async processSecurityEvent(eventType, eventData, userId = null, ipAddress = null) {
    try {
      const securityEvent = {
        id: this.generateEventId(),
        type: eventType,
        data: eventData,
        userId: userId,
        ipAddress: ipAddress,
        timestamp: new Date(),
        severity: 'unknown',
        processed: false,
        geoLocation: ipAddress ? geoip.lookup(ipAddress) : null
      };

      // Store event
      this.securityEvents.push(securityEvent);
      
      // Keep only last 10000 events in memory
      if (this.securityEvents.length > 10000) {
        this.securityEvents = this.securityEvents.slice(-10000);
      }

      // Process threat detection
      await this.detectThreats(securityEvent);
      
      // Run compliance checks
      await this.runComplianceChecks(securityEvent);
      
      this.emit('security_event', securityEvent);
      
      return securityEvent.id;

    } catch (error) {
      console.error('Error processing security event:', error);
      this.emit('error', error);
    }
  }

  async detectThreats(securityEvent) {
    for (const [ruleName, rule] of this.threatDetectionRules) {
      try {
        const threatDetected = await this.evaluateThreatRule(ruleName, rule, securityEvent);
        
        if (threatDetected) {
          await this.handleThreatDetection(ruleName, rule, securityEvent, threatDetected);
        }
      } catch (error) {
        console.error(`Error evaluating threat rule ${ruleName}:`, error);
      }
    }
  }

  async evaluateThreatRule(ruleName, rule, securityEvent) {
    switch (ruleName) {
      case 'brute_force_login':
        return await this.detectBruteForceLogin(rule, securityEvent);
        
      case 'credential_stuffing':
        return await this.detectCredentialStuffing(rule, securityEvent);
        
      case 'account_takeover':
        return await this.detectAccountTakeover(rule, securityEvent);
        
      case 'api_abuse':
        return await this.detectAPIAbuse(rule, securityEvent);
        
      case 'data_exfiltration':
        return await this.detectDataExfiltration(rule, securityEvent);
        
      case 'sql_injection':
        return await this.detectSQLInjection(rule, securityEvent);
        
      case 'xss_attempt':
        return await this.detectXSSAttempt(rule, securityEvent);
        
      case 'app_tampering':
        return await this.detectAppTampering(rule, securityEvent);
        
      case 'device_fingerprint_spoofing':
        return await this.detectDeviceFingerprintSpoofing(rule, securityEvent);
        
      default:
        return false;
    }
  }

  async detectBruteForceLogin(rule, event) {
    if (event.type !== 'login_attempt' || !event.data.failed) {
      return false;
    }

    const key = `brute_force:${event.ipAddress}`;
    const attempts = this.getRecentAttempts(key, rule.timeWindow);
    attempts.push(event.timestamp);

    if (attempts.length >= rule.threshold) {
      return {
        type: 'brute_force_login',
        attempts: attempts.length,
        timeWindow: rule.timeWindow,
        ipAddress: event.ipAddress
      };
    }

    return false;
  }

  async detectCredentialStuffing(rule, event) {
    if (event.type !== 'login_attempt' || !event.data.failed) {
      return false;
    }

    // Look for attempts across multiple accounts from same IP
    const recentEvents = this.securityEvents.filter(e => 
      e.ipAddress === event.ipAddress &&
      e.type === 'login_attempt' &&
      e.data.failed &&
      (event.timestamp - e.timestamp) <= rule.timeWindow
    );

    const uniqueUsers = new Set(recentEvents.map(e => e.data.email || e.userId));
    
    if (uniqueUsers.size >= rule.threshold) {
      return {
        type: 'credential_stuffing',
        uniqueAccounts: uniqueUsers.size,
        totalAttempts: recentEvents.length,
        ipAddress: event.ipAddress
      };
    }

    return false;
  }

  async detectAccountTakeover(rule, event) {
    if (!event.userId) return false;

    const userEvents = this.securityEvents.filter(e => 
      e.userId === event.userId &&
      (event.timestamp - e.timestamp) <= 86400000 // 24 hours
    );

    const indicators = [];
    
    // Check for multiple device logins
    const devices = new Set(userEvents.map(e => e.data.deviceId).filter(Boolean));
    if (devices.size > 3) {
      indicators.push('multiple_device_logins');
    }

    // Check for location changes
    const locations = userEvents
      .map(e => e.geoLocation)
      .filter(Boolean)
      .map(geo => `${geo.country}-${geo.region}`);
    
    if (new Set(locations).size > 2) {
      indicators.push('location_change');
    }

    // Check for password changes
    const passwordChanges = userEvents.filter(e => e.type === 'password_change');
    if (passwordChanges.length > 0) {
      indicators.push('password_change');
    }

    const matchedIndicators = indicators.filter(i => rule.indicators.includes(i));
    
    if (matchedIndicators.length >= 2) {
      return {
        type: 'account_takeover',
        indicators: matchedIndicators,
        userId: event.userId,
        devices: devices.size,
        locations: new Set(locations).size
      };
    }

    return false;
  }

  async detectAPIAbuse(rule, event) {
    if (event.type !== 'api_request') return false;

    const key = `api_abuse:${event.ipAddress}`;
    const requests = this.getRecentAttempts(key, rule.timeWindow);
    requests.push(event.timestamp);

    if (requests.length >= rule.requestThreshold) {
      return {
        type: 'api_abuse',
        requests: requests.length,
        timeWindow: rule.timeWindow,
        ipAddress: event.ipAddress
      };
    }

    return false;
  }

  async detectDataExfiltration(rule, event) {
    if (!event.userId) return false;

    const userAPIEvents = this.securityEvents.filter(e => 
      e.userId === event.userId &&
      e.type === 'api_request' &&
      (event.timestamp - e.timestamp) <= rule.timeWindow
    );

    const totalRequests = userAPIEvents.length;
    const totalDataTransferred = userAPIEvents.reduce((sum, e) => sum + (e.data.responseSize || 0), 0);

    if (totalRequests >= rule.volumeThreshold || totalDataTransferred >= rule.dataThreshold) {
      return {
        type: 'data_exfiltration',
        totalRequests,
        totalDataTransferred,
        userId: event.userId,
        timeWindow: rule.timeWindow
      };
    }

    return false;
  }

  async detectSQLInjection(rule, event) {
    if (event.type !== 'api_request') return false;

    const payload = JSON.stringify(event.data.requestBody || '') + (event.data.queryParams || '');
    
    for (const pattern of rule.patterns) {
      if (pattern.test(payload)) {
        return {
          type: 'sql_injection',
          pattern: pattern.source,
          payload: payload.substring(0, 200), // Limit payload size
          ipAddress: event.ipAddress,
          userId: event.userId
        };
      }
    }

    return false;
  }

  async detectXSSAttempt(rule, event) {
    if (event.type !== 'api_request') return false;

    const payload = JSON.stringify(event.data.requestBody || '');
    
    for (const pattern of rule.patterns) {
      if (pattern.test(payload)) {
        return {
          type: 'xss_attempt',
          pattern: pattern.source,
          payload: payload.substring(0, 200),
          ipAddress: event.ipAddress,
          userId: event.userId
        };
      }
    }

    return false;
  }

  async detectAppTampering(rule, event) {
    if (event.type !== 'mobile_app_request') return false;

    const indicators = [];
    
    if (event.data.invalidSignature) {
      indicators.push('invalid_signature');
    }
    
    if (event.data.debugMode) {
      indicators.push('debug_mode');
    }
    
    if (event.data.jailbroken || event.data.rooted) {
      indicators.push('jailbreak_indicators');
    }

    const matchedIndicators = indicators.filter(i => rule.indicators.includes(i));
    
    if (matchedIndicators.length > 0) {
      return {
        type: 'app_tampering',
        indicators: matchedIndicators,
        deviceId: event.data.deviceId,
        userId: event.userId
      };
    }

    return false;
  }

  async detectDeviceFingerprintSpoofing(rule, event) {
    if (!event.data.deviceFingerprint) return false;

    // Check for inconsistent device fingerprints from same user
    const userEvents = this.securityEvents.filter(e => 
      e.userId === event.userId &&
      e.data.deviceFingerprint &&
      (event.timestamp - e.timestamp) <= 3600000 // 1 hour
    );

    const fingerprints = new Set(userEvents.map(e => e.data.deviceFingerprint));
    
    if (fingerprints.size > 3) {
      return {
        type: 'device_fingerprint_spoofing',
        fingerprintCount: fingerprints.size,
        userId: event.userId
      };
    }

    return false;
  }

  async handleThreatDetection(ruleName, rule, securityEvent, threatData) {
    console.log(`Threat detected: ${ruleName}`, threatData);

    const threat = {
      id: this.generateThreatId(),
      rule: ruleName,
      severity: rule.severity,
      data: threatData,
      event: securityEvent,
      timestamp: new Date(),
      action: rule.action,
      resolved: false
    };

    // Execute automated response
    await this.executeThreatResponse(threat);
    
    // Send alerts
    await this.sendSecurityAlert(threat);
    
    this.emit('threat_detected', threat);
  }

  async executeThreatResponse(threat) {
    try {
      switch (threat.action) {
        case 'block_ip':
          await this.blockIPAddress(threat.data.ipAddress, threat.rule);
          break;
          
        case 'block_user':
          await this.blockUser(threat.data.userId, threat.rule);
          break;
          
        case 'block_device':
          await this.blockDevice(threat.data.deviceId, threat.rule);
          break;
          
        case 'rate_limit':
          await this.applyRateLimit(threat.data.ipAddress, threat.rule);
          break;
          
        case 'freeze_account':
          await this.freezeAccount(threat.data.userId, threat.rule);
          break;
          
        case 'require_additional_verification':
          await this.requireAdditionalVerification(threat.data.userId, threat.rule);
          break;
          
        case 'sanitize_input':
          // Input sanitization would be handled at the application level
          console.log('Input sanitization required for threat:', threat.id);
          break;
          
        default:
          console.log('No automated action defined for threat:', threat.id);
      }

      console.log(`Threat response executed: ${threat.action} for threat ${threat.id}`);
      
    } catch (error) {
      console.error('Error executing threat response:', error);
      this.emit('threat_response_error', { threat, error });
    }
  }

  async runComplianceChecks(securityEvent) {
    for (const [checkName, check] of this.complianceChecks) {
      try {
        const violation = await this.evaluateComplianceCheck(checkName, check, securityEvent);
        
        if (violation) {
          await this.handleComplianceViolation(checkName, check, violation);
        }
      } catch (error) {
        console.error(`Error running compliance check ${checkName}:`, error);
      }
    }
  }

  async evaluateComplianceCheck(checkName, check, event) {
    switch (checkName) {
      case 'gdpr_data_retention':
        return await this.checkGDPRDataRetention(check, event);
        
      case 'gdpr_right_to_deletion':
        return await this.checkGDPRDeletionCompliance(check, event);
        
      case 'pci_dss_encryption':
        return await this.checkPCIDSSEncryption(check, event);
        
      default:
        return null;
    }
  }

  async checkGDPRDataRetention(check, event) {
    if (event.type !== 'data_access') return null;

    // Check if data being accessed is older than retention period
    const dataAge = event.data.dataCreatedDate ? 
      (new Date() - new Date(event.data.dataCreatedDate)) / (1000 * 60 * 60 * 24) : 0;

    if (dataAge > check.maxRetentionDays) {
      return {
        type: 'gdpr_data_retention_violation',
        dataAge: dataAge,
        maxRetention: check.maxRetentionDays,
        dataId: event.data.dataId
      };
    }

    return null;
  }

  async checkGDPRDeletionCompliance(check, event) {
    if (event.type !== 'gdpr_deletion_request') return null;

    // Check if deletion request is being processed within required timeframe
    const requestAge = (new Date() - new Date(event.data.requestDate)) / (1000 * 60 * 60 * 24);
    
    if (requestAge > check.maxResponseDays && !event.data.processed) {
      return {
        type: 'gdpr_deletion_delay',
        requestAge: requestAge,
        maxResponse: check.maxResponseDays,
        requestId: event.data.requestId
      };
    }

    return null;
  }

  async checkPCIDSSEncryption(check, event) {
    if (event.type !== 'payment_data_access') return null;

    const violations = [];
    
    if (!event.data.encryptedAtRest) {
      violations.push('data_at_rest_not_encrypted');
    }
    
    if (!event.data.encryptedInTransit) {
      violations.push('data_in_transit_not_encrypted');
    }

    if (violations.length > 0) {
      return {
        type: 'pci_dss_encryption_violation',
        violations: violations,
        paymentId: event.data.paymentId
      };
    }

    return null;
  }

  // Threat response actions
  async blockIPAddress(ipAddress, rule) {
    console.log(`Blocking IP address: ${ipAddress} (Rule: ${rule})`);
    // Implementation would integrate with firewall/WAF
    // For now, add to blocked IPs list
    this.addToBlocklist('ip', ipAddress, rule);
  }

  async blockUser(userId, rule) {
    console.log(`Blocking user: ${userId} (Rule: ${rule})`);
    // Implementation would update user account status
    this.addToBlocklist('user', userId, rule);
  }

  async blockDevice(deviceId, rule) {
    console.log(`Blocking device: ${deviceId} (Rule: ${rule})`);
    this.addToBlocklist('device', deviceId, rule);
  }

  async applyRateLimit(ipAddress, rule) {
    console.log(`Applying rate limit to: ${ipAddress} (Rule: ${rule})`);
    // Implementation would configure rate limiting
  }

  async freezeAccount(userId, rule) {
    console.log(`Freezing account: ${userId} (Rule: ${rule})`);
    // Implementation would temporarily disable account
  }

  async requireAdditionalVerification(userId, rule) {
    console.log(`Requiring additional verification for: ${userId} (Rule: ${rule})`);
    // Implementation would trigger MFA/additional verification
  }

  // Alert system
  async sendSecurityAlert(threat) {
    const alert = {
      id: this.generateAlertId(),
      type: 'security_threat',
      severity: threat.severity,
      title: `Security Threat Detected: ${threat.rule}`,
      description: `Threat detected: ${JSON.stringify(threat.data)}`,
      timestamp: new Date(),
      threat: threat
    };

    console.log('Security Alert:', alert);
    
    // Send to various alerting channels
    await this.sendToSlack(alert);
    await this.sendToPagerDuty(alert);
    await this.sendToEmail(alert);
    
    this.emit('security_alert', alert);
  }

  async handleComplianceViolation(checkName, check, violation) {
    const alert = {
      id: this.generateAlertId(),
      type: 'compliance_violation',
      severity: check.severity,
      check: checkName,
      violation: violation,
      timestamp: new Date()
    };

    console.log('Compliance Violation:', alert);
    
    await this.sendComplianceAlert(alert);
    this.emit('compliance_violation', alert);
  }

  // Utility methods
  getRecentAttempts(key, timeWindow) {
    const now = Date.now();
    if (!this.requestPatterns.has(key)) {
      this.requestPatterns.set(key, []);
    }
    
    const attempts = this.requestPatterns.get(key);
    const recentAttempts = attempts.filter(timestamp => (now - timestamp) <= timeWindow);
    this.requestPatterns.set(key, recentAttempts);
    
    return recentAttempts;
  }

  addToBlocklist(type, identifier, rule) {
    const blocklist = `${type}_blocklist`;
    if (!this[blocklist]) {
      this[blocklist] = new Map();
    }
    
    this[blocklist].set(identifier, {
      rule: rule,
      timestamp: new Date(),
      active: true
    });
  }

  generateEventId() {
    return `evt_${crypto.randomBytes(16).toString('hex')}`;
  }

  generateThreatId() {
    return `thr_${crypto.randomBytes(16).toString('hex')}`;
  }

  generateAlertId() {
    return `alt_${crypto.randomBytes(16).toString('hex')}`;
  }

  // Background processing
  startBackgroundProcessing() {
    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 3600000);

    // Generate security reports daily
    setInterval(() => {
      this.generateSecurityReport();
    }, 86400000);
  }

  cleanupOldEvents() {
    const cutoff = new Date(Date.now() - 86400000 * 7); // 7 days
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoff);
    console.log(`Cleaned up old security events. Current count: ${this.securityEvents.length}`);
  }

  async generateSecurityReport() {
    const last24Hours = this.securityEvents.filter(
      event => (new Date() - event.timestamp) <= 86400000
    );

    const report = {
      period: '24h',
      totalEvents: last24Hours.length,
      eventsByType: this.groupBy(last24Hours, 'type'),
      threatsSummary: this.generateThreatsSummary(last24Hours),
      topRiskIPs: this.getTopRiskIPs(last24Hours),
      complianceStatus: 'compliant', // Would be calculated based on violations
      recommendations: this.generateSecurityRecommendations(last24Hours)
    };

    console.log('Daily Security Report:', report);
    this.emit('security_report', report);
  }

  // Integration methods (stubs - would need actual implementation)
  async sendToSlack(alert) {
    // Slack webhook integration
    console.log('Sending to Slack:', alert.title);
  }

  async sendToPagerDuty(alert) {
    // PagerDuty integration for critical alerts
    if (alert.severity === 'critical') {
      console.log('Sending to PagerDuty:', alert.title);
    }
  }

  async sendToEmail(alert) {
    // Email alert integration
    console.log('Sending email alert:', alert.title);
  }

  async sendComplianceAlert(alert) {
    // Compliance-specific alerting
    console.log('Sending compliance alert:', alert.violation.type);
  }

  // Utility methods
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  generateThreatsSummary(events) {
    // Implementation would analyze threats and generate summary
    return {
      total: 0,
      high: 0,
      medium: 0,
      low: 0
    };
  }

  getTopRiskIPs(events) {
    // Implementation would identify highest risk IP addresses
    return [];
  }

  generateSecurityRecommendations(events) {
    // Implementation would generate actionable security recommendations
    return [];
  }

  // Status and health
  getSecurityStatus() {
    return {
      monitoring_active: true,
      total_events_24h: this.securityEvents.filter(
        e => (new Date() - e.timestamp) <= 86400000
      ).length,
      threat_rules: this.threatDetectionRules.size,
      compliance_checks: this.complianceChecks.size,
      environment: this.environment
    };
  }
}

module.exports = TailTrackerSecurityMonitoring;