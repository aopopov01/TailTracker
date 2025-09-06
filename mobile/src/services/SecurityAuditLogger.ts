import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { MilitaryGradeCryptoService } from './MilitaryGradeCryptoService';

export interface SecurityEvent {
  id: string;
  timestamp: number;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  description: string;
  metadata: Record<string, any>;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  encrypted: boolean;
}

export type SecurityEventType = 
  // Authentication Events
  | 'USER_LOGIN_SUCCESS' | 'USER_LOGIN_FAILED' | 'USER_LOGOUT' | 'USER_REGISTERED'
  | 'PASSWORD_CHANGED' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'MFA_SETUP_INITIATED'
  | 'TOTP_SECRET_GENERATED' | 'TOTP_VERIFICATION_SUCCESS' | 'TOTP_VERIFICATION_FAILED'
  | 'BACKUP_CODE_USED' | 'BACKUP_CODES_GENERATED'
  
  // Session Events  
  | 'SECURE_SESSION_CREATED' | 'SESSION_ROTATED' | 'SESSION_TERMINATED'
  | 'SESSION_EXPIRED' | 'SESSION_REVOKED' | 'ALL_SESSIONS_INVALIDATED'
  | 'SUSPICIOUS_SESSION_ACTIVITY' | 'SESSION_HIJACKING_DETECTED'
  
  // Security Events
  | 'TAMPERING_DETECTION_COMPLETED' | 'INTEGRITY_CHECK_PERFORMED' | 'INTEGRITY_VALIDATION_FAILED'
  | 'ROOT_DETECTED' | 'JAILBREAK_DETECTED' | 'DEBUGGER_DETECTED' | 'EMULATOR_DETECTED'
  | 'HOOKING_FRAMEWORK_DETECTED' | 'BINARY_MODIFICATION_DETECTED'
  | 'HIGH_RISK_ENVIRONMENT_DETECTED' | 'SECURITY_POLICY_VIOLATION'
  
  // Data Protection Events
  | 'DATA_ENCRYPTED' | 'DATA_DECRYPTED' | 'ENCRYPTION_KEY_ROTATED'
  | 'SENSITIVE_DATA_ACCESSED' | 'DATA_EXPORT_REQUESTED' | 'DATA_DELETION_REQUESTED'
  | 'GDPR_COMPLIANCE_CHECK' | 'PRIVACY_SETTING_CHANGED'
  
  // Network Security Events
  | 'API_REQUEST_BLOCKED' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_API_ACTIVITY'
  | 'CERTIFICATE_VALIDATION_FAILED' | 'MITM_ATTACK_DETECTED'
  | 'NETWORK_INTRUSION_DETECTED' | 'MALICIOUS_REQUEST_BLOCKED'
  
  // Application Security Events
  | 'SECURITY_SCAN_COMPLETED' | 'VULNERABILITY_DETECTED' | 'SECURITY_UPDATE_AVAILABLE'
  | 'SECURITY_CONFIGURATION_CHANGED' | 'SECURITY_INCIDENT_REPORTED'
  
  // Error and Failure Events
  | 'ENCRYPTION_ERROR' | 'DECRYPTION_ERROR' | 'KEY_DERIVATION_ERROR'
  | 'AUTHENTICATION_ERROR' | 'AUTHORIZATION_ERROR' | 'SESSION_ERROR'
  | 'SECURITY_HEALTH_CHECK_FAILED' | 'AUDIT_LOG_ERROR';

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceId: string;
  deviceModel?: string;
  isEmulator?: boolean;
  isRooted?: boolean;
}

export interface NetworkInfo {
  isConnected: boolean;
  connectionType?: string;
  ipAddress?: string;
  isVPN?: boolean;
}

export interface AuditLogMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<string, number>;
  eventsLast24Hours: number;
  criticalEventsLast24Hours: number;
  encryptedEvents: number;
  averageEventsPerDay: number;
}

export interface SecurityInsight {
  type: 'trend' | 'anomaly' | 'threshold' | 'pattern';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
  timestamp: number;
  relatedEvents: string[];
}

/**
 * Security Audit Logger Service
 * 
 * Comprehensive security event logging and monitoring system:
 * - Encrypted audit log storage
 * - Real-time security event tracking
 * - Compliance audit trail (GDPR, SOX, etc.)
 * - Security metrics and analytics
 * - Threat pattern detection
 * - Automated security insights
 * - Log retention and archival
 * - Secure log transmission
 */
export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private cryptoService: MilitaryGradeCryptoService;

  // Storage configuration
  private readonly AUDIT_LOG_PREFIX = '@tailtracker:audit_log_';
  private readonly ENCRYPTED_LOG_PREFIX = '@tailtracker:encrypted_audit_';
  private readonly METRICS_CACHE_KEY = '@tailtracker:audit_metrics';
  private readonly LOG_BATCH_KEY = '@tailtracker:audit_batch';
  
  // Security configuration
  private readonly MAX_LOGS_IN_MEMORY = 100;
  private readonly LOG_RETENTION_DAYS = 90;
  private readonly BATCH_SIZE = 50;
  private readonly ENCRYPTION_ENABLED = true;
  private readonly REAL_TIME_SYNC_ENABLED = true;
  
  // Monitoring configuration
  private readonly CRITICAL_EVENT_THRESHOLD = 5; // per hour
  private readonly SUSPICIOUS_PATTERN_THRESHOLD = 10; // per day
  private readonly LOG_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  // Runtime state
  private logBuffer: SecurityEvent[] = [];
  private logSyncTimer?: NodeJS.Timeout;
  private deviceInfo?: DeviceInfo;
  private isInitialized = false;

  private constructor() {
    this.cryptoService = MilitaryGradeCryptoService.getInstance();
    this.initializeLogger();
  }

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * Log security event with comprehensive metadata
   */
  async logSecurityEvent(
    eventType: SecurityEventType,
    metadata: Record<string, any> = {},
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    try {
      // Generate unique event ID
      const eventId = await this.cryptoService.generateSecureToken(16);
      
      // Determine severity if not provided
      const eventSeverity = severity || this.determineSeverity(eventType);
      
      // Get current device and network info
      const deviceInfo = await this.getDeviceInfo();
      const networkInfo = await this.getNetworkInfo();
      
      // Create security event
      const securityEvent: SecurityEvent = {
        id: eventId,
        timestamp: Date.now(),
        eventType,
        severity: eventSeverity,
        userId: metadata.userId,
        sessionId: metadata.sessionId,
        description: this.generateEventDescription(eventType, metadata),
        metadata: this.sanitizeMetadata(metadata),
        deviceInfo,
        networkInfo,
        encrypted: this.ENCRYPTION_ENABLED
      };

      // Add to buffer
      this.logBuffer.push(securityEvent);
      
      // Persist immediately for critical events
      if (eventSeverity === 'critical' || eventSeverity === 'high') {
        await this.flushLogBuffer();
      }
      
      // Maintain buffer size
      if (this.logBuffer.length > this.MAX_LOGS_IN_MEMORY) {
        await this.flushLogBuffer();
      }
      
      // Check for security patterns
      await this.analyzeSecurityPatterns(securityEvent);
      
      console.log(`Security event logged: ${eventType} [${eventSeverity}]`);
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Store in fallback location to prevent event loss
      await this.fallbackLogEvent(eventType, metadata, severity);
    }
  }

  /**
   * Get audit log metrics and statistics
   */
  async getAuditMetrics(): Promise<AuditLogMetrics> {
    try {
      // Try to get cached metrics first
      const cachedMetrics = await AsyncStorage.getItem(this.METRICS_CACHE_KEY);
      if (cachedMetrics) {
        const metrics: AuditLogMetrics = JSON.parse(cachedMetrics);
        // Return if metrics are less than 1 hour old
        if (Date.now() - (metrics as any).lastCalculated < 3600000) {
          return metrics;
        }
      }
      
      // Calculate metrics from stored logs
      const allEvents = await this.getAllSecurityEvents();
      const now = Date.now();
      const last24Hours = now - (24 * 60 * 60 * 1000);
      
      const eventsByType: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};
      let eventsLast24Hours = 0;
      let criticalEventsLast24Hours = 0;
      let encryptedEvents = 0;
      
      allEvents.forEach(event => {
        // Count by type
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
        
        // Count by severity
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
        
        // Count recent events
        if (event.timestamp > last24Hours) {
          eventsLast24Hours++;
          if (event.severity === 'critical') {
            criticalEventsLast24Hours++;
          }
        }
        
        // Count encrypted events
        if (event.encrypted) {
          encryptedEvents++;
        }
      });
      
      const metrics: AuditLogMetrics = {
        totalEvents: allEvents.length,
        eventsByType: eventsByType as Record<SecurityEventType, number>,
        eventsBySeverity,
        eventsLast24Hours,
        criticalEventsLast24Hours,
        encryptedEvents,
        averageEventsPerDay: allEvents.length > 0 ? 
          allEvents.length / Math.max(1, Math.ceil((now - allEvents[0].timestamp) / (24 * 60 * 60 * 1000))) : 0
      };
      
      // Cache metrics with timestamp
      await AsyncStorage.setItem(
        this.METRICS_CACHE_KEY,
        JSON.stringify({ ...metrics, lastCalculated: now })
      );
      
      return metrics;
    } catch (error) {
      console.error('Failed to calculate audit metrics:', error);
      // Return empty metrics
      return {
        totalEvents: 0,
        eventsByType: {} as Record<SecurityEventType, number>,
        eventsBySeverity: {},
        eventsLast24Hours: 0,
        criticalEventsLast24Hours: 0,
        encryptedEvents: 0,
        averageEventsPerDay: 0
      };
    }
  }

  /**
   * Generate security insights from audit logs
   */
  async generateSecurityInsights(): Promise<SecurityInsight[]> {
    const insights: SecurityInsight[] = [];
    
    try {
      const metrics = await this.getAuditMetrics();
      const allEvents = await this.getAllSecurityEvents();
      const now = Date.now();
      const last24Hours = now - (24 * 60 * 60 * 1000);
      const lastWeek = now - (7 * 24 * 60 * 60 * 1000);
      
      // Critical events threshold check
      if (metrics.criticalEventsLast24Hours > this.CRITICAL_EVENT_THRESHOLD) {
        insights.push({
          type: 'threshold',
          severity: 'critical',
          title: 'High Number of Critical Security Events',
          description: `${metrics.criticalEventsLast24Hours} critical security events detected in the last 24 hours (threshold: ${this.CRITICAL_EVENT_THRESHOLD})`,
          recommendation: 'Investigate security incidents immediately and implement additional security measures',
          timestamp: now,
          relatedEvents: allEvents
            .filter(e => e.severity === 'critical' && e.timestamp > last24Hours)
            .map(e => e.id)
            .slice(0, 10)
        });
      }
      
      // Failed authentication pattern detection
      const failedLogins = allEvents.filter(
        e => e.eventType === 'USER_LOGIN_FAILED' && e.timestamp > lastWeek
      );
      if (failedLogins.length > 20) {
        insights.push({
          type: 'pattern',
          severity: 'warning',
          title: 'Unusual Authentication Activity',
          description: `${failedLogins.length} failed login attempts detected in the last week`,
          recommendation: 'Monitor for brute force attacks and consider implementing additional rate limiting',
          timestamp: now,
          relatedEvents: failedLogins.map(e => e.id).slice(0, 10)
        });
      }
      
      // Device security trend analysis
      const tamperingEvents = allEvents.filter(
        e => e.eventType.includes('DETECTED') && e.timestamp > lastWeek
      );
      if (tamperingEvents.length > 0) {
        insights.push({
          type: 'trend',
          severity: 'warning',
          title: 'Device Security Issues Detected',
          description: `${tamperingEvents.length} device security issues detected recently`,
          recommendation: 'Review device security policies and user education materials',
          timestamp: now,
          relatedEvents: tamperingEvents.map(e => e.id).slice(0, 5)
        });
      }
      
      // Session anomaly detection
      const sessionEvents = allEvents.filter(
        e => e.eventType.includes('SESSION') && e.timestamp > last24Hours
      );
      const suspiciousSessions = sessionEvents.filter(
        e => e.eventType === 'SUSPICIOUS_SESSION_ACTIVITY'
      );
      if (suspiciousSessions.length > 5) {
        insights.push({
          type: 'anomaly',
          severity: 'warning',
          title: 'Suspicious Session Activity',
          description: `${suspiciousSessions.length} suspicious session activities detected in the last 24 hours`,
          recommendation: 'Review session security policies and implement additional session validation',
          timestamp: now,
          relatedEvents: suspiciousSessions.map(e => e.id)
        });
      }
      
      // Data protection compliance check
      const gdprEvents = allEvents.filter(
        e => e.eventType.includes('GDPR') && e.timestamp > lastWeek
      );
      if (gdprEvents.length > 0) {
        insights.push({
          type: 'trend',
          severity: 'info',
          title: 'Privacy Compliance Activity',
          description: `${gdprEvents.length} GDPR-related activities recorded`,
          recommendation: 'Continue monitoring privacy compliance and data protection measures',
          timestamp: now,
          relatedEvents: gdprEvents.map(e => e.id)
        });
      }
      
    } catch (error) {
      console.error('Failed to generate security insights:', error);
    }
    
    return insights;
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportAuditLogs(
    startDate?: Date,
    endDate?: Date,
    eventTypes?: SecurityEventType[]
  ): Promise<SecurityEvent[]> {
    try {
      let allEvents = await this.getAllSecurityEvents();
      
      // Apply date filters
      if (startDate) {
        allEvents = allEvents.filter(event => event.timestamp >= startDate.getTime());
      }
      if (endDate) {
        allEvents = allEvents.filter(event => event.timestamp <= endDate.getTime());
      }
      
      // Apply event type filters
      if (eventTypes && eventTypes.length > 0) {
        allEvents = allEvents.filter(event => eventTypes.includes(event.eventType));
      }
      
      // Sort by timestamp (newest first)
      allEvents.sort((a, b) => b.timestamp - a.timestamp);
      
      // Log export activity
      await this.logSecurityEvent('DATA_EXPORT_REQUESTED', {
        exportType: 'audit_logs',
        dateRange: { startDate, endDate },
        eventTypes,
        recordCount: allEvents.length,
        timestamp: Date.now()
      }, 'medium');
      
      return allEvents;
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw new Error('Audit log export failed');
    }
  }

  /**
   * Clear audit logs (with retention policy)
   */
  async clearAuditLogs(olderThanDays?: number): Promise<number> {
    try {
      const retentionDays = olderThanDays || this.LOG_RETENTION_DAYS;
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      
      const allEvents = await this.getAllSecurityEvents();
      const eventsToKeep = allEvents.filter(event => event.timestamp > cutoffTime);
      const eventsToDelete = allEvents.length - eventsToKeep.length;
      
      // Clear all stored logs
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => 
        key.startsWith(this.AUDIT_LOG_PREFIX) || 
        key.startsWith(this.ENCRYPTED_LOG_PREFIX)
      );
      
      if (logKeys.length > 0) {
        await AsyncStorage.multiRemove(logKeys);
      }
      
      // Re-store events within retention period
      if (eventsToKeep.length > 0) {
        await this.batchStoreEvents(eventsToKeep);
      }
      
      // Clear metrics cache
      await AsyncStorage.removeItem(this.METRICS_CACHE_KEY);
      
      // Log cleanup activity
      await this.logSecurityEvent('AUDIT_LOG_CLEANUP', {
        retentionDays,
        eventsDeleted: eventsToDelete,
        eventsRetained: eventsToKeep.length,
        timestamp: Date.now()
      }, 'medium');
      
      return eventsToDelete;
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
      throw new Error('Audit log cleanup failed');
    }
  }

  /**
   * Initialize audit logger
   */
  private async initializeLogger(): Promise<void> {
    try {
      // Get device info
      this.deviceInfo = await this.getDeviceInfo();
      
      // Start periodic log sync
      if (this.REAL_TIME_SYNC_ENABLED) {
        this.startLogSync();
      }
      
      // Perform initial cleanup
      await this.performMaintenance();
      
      this.isInitialized = true;
      console.log('Security audit logger initialized');
    } catch (error) {
      console.error('Failed to initialize audit logger:', error);
    }
  }

  /**
   * Determine event severity based on type
   */
  private determineSeverity(eventType: SecurityEventType): 'low' | 'medium' | 'high' | 'critical' {
    const criticalEvents = [
      'ROOT_DETECTED', 'JAILBREAK_DETECTED', 'INTEGRITY_VALIDATION_FAILED',
      'HOOKING_FRAMEWORK_DETECTED', 'BINARY_MODIFICATION_DETECTED',
      'SESSION_HIJACKING_DETECTED', 'MITM_ATTACK_DETECTED',
      'NETWORK_INTRUSION_DETECTED', 'HIGH_RISK_ENVIRONMENT_DETECTED'
    ];
    
    const highEvents = [
      'USER_LOGIN_FAILED', 'TOTP_VERIFICATION_FAILED', 'DEBUGGER_DETECTED',
      'EMULATOR_DETECTED', 'SUSPICIOUS_SESSION_ACTIVITY', 'RATE_LIMIT_EXCEEDED',
      'API_REQUEST_BLOCKED', 'CERTIFICATE_VALIDATION_FAILED'
    ];
    
    const mediumEvents = [
      'PASSWORD_CHANGED', 'MFA_ENABLED', 'MFA_DISABLED', 'SESSION_EXPIRED',
      'DATA_EXPORT_REQUESTED', 'PRIVACY_SETTING_CHANGED', 'SECURITY_CONFIGURATION_CHANGED'
    ];
    
    if (criticalEvents.includes(eventType as any)) return 'critical';
    if (highEvents.includes(eventType as any)) return 'high';
    if (mediumEvents.includes(eventType as any)) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable event description
   */
  private generateEventDescription(eventType: SecurityEventType, metadata: Record<string, any>): string {
    const descriptions: Record<SecurityEventType, string> = {
      'USER_LOGIN_SUCCESS': 'User successfully authenticated',
      'USER_LOGIN_FAILED': 'User authentication failed',
      'USER_LOGOUT': 'User logged out',
      'USER_REGISTERED': 'New user registered',
      'PASSWORD_CHANGED': 'User changed password',
      'MFA_ENABLED': 'Multi-factor authentication enabled',
      'MFA_DISABLED': 'Multi-factor authentication disabled',
      'ROOT_DETECTED': 'Device root access detected',
      'JAILBREAK_DETECTED': 'Device jailbreak detected',
      'SESSION_HIJACKING_DETECTED': 'Potential session hijacking detected',
      'RATE_LIMIT_EXCEEDED': 'API rate limit exceeded',
      'DATA_EXPORT_REQUESTED': 'User data export requested',
      // Add more descriptions as needed
    } as Record<SecurityEventType, string>;
    
    const baseDescription = descriptions[eventType] || `Security event: ${eventType}`;
    
    // Add relevant metadata to description
    if (metadata.userId) {
      return `${baseDescription} (User: ${metadata.userId})`;
    }
    
    return baseDescription;
  }

  /**
   * Sanitize metadata to remove sensitive information
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    
    Object.keys(sanitized).forEach(key => {
      const lowercaseKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowercaseKey.includes(field))) {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 0) {
          sanitized[key] = '*'.repeat(Math.min(8, sanitized[key].length));
        }
      }
    });
    
    return sanitized;
  }

  /**
   * Get current device information
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      // In production, get actual device info
      return {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: '1.0.0', // Would get from Application.nativeApplicationVersion
        deviceId: 'device_id_placeholder', // Would get from DeviceInfo
        deviceModel: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
        isEmulator: false, // Would detect using antiTamperingService
        isRooted: false // Would detect using antiTamperingService
      };
    } catch (error) {
      console.warn('Failed to get device info:', error);
      return {
        platform: 'unknown',
        osVersion: 'unknown',
        appVersion: 'unknown',
        deviceId: 'unknown'
      };
    }
  }

  /**
   * Get current network information
   */
  private async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const netInfo = await NetInfo.fetch();
      return {
        isConnected: netInfo.isConnected || false,
        connectionType: netInfo.type || 'unknown',
        ipAddress: undefined, // Would get actual IP if needed
        isVPN: false // Would detect VPN usage if needed
      };
    } catch (error) {
      return {
        isConnected: false,
        connectionType: 'unknown'
      };
    }
  }

  /**
   * Flush log buffer to storage
   */
  private async flushLogBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    try {
      const eventsToStore = [...this.logBuffer];
      this.logBuffer = [];
      
      await this.batchStoreEvents(eventsToStore);
    } catch (error) {
      console.error('Failed to flush log buffer:', error);
      // Put events back in buffer for retry
      this.logBuffer.unshift(...this.logBuffer);
    }
  }

  /**
   * Store events in batches
   */
  private async batchStoreEvents(events: SecurityEvent[]): Promise<void> {
    try {
      const batches: SecurityEvent[][] = [];
      
      // Split into batches
      for (let i = 0; i < events.length; i += this.BATCH_SIZE) {
        batches.push(events.slice(i, i + this.BATCH_SIZE));
      }
      
      // Store each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchKey = `${this.AUDIT_LOG_PREFIX}${Date.now()}_${i}`;
        
        if (this.ENCRYPTION_ENABLED) {
          // Encrypt batch before storage
          const encryptedBatch = await this.cryptoService.encryptForStorage(
            JSON.stringify(batch),
            'audit_logs'
          );
          await AsyncStorage.setItem(`${this.ENCRYPTED_LOG_PREFIX}${Date.now()}_${i}`, encryptedBatch);
        } else {
          await AsyncStorage.setItem(batchKey, JSON.stringify(batch));
        }
      }
    } catch (error) {
      console.error('Failed to batch store events:', error);
      throw error;
    }
  }

  /**
   * Retrieve all security events from storage
   */
  private async getAllSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => 
        key.startsWith(this.AUDIT_LOG_PREFIX) || 
        key.startsWith(this.ENCRYPTED_LOG_PREFIX)
      );
      
      const allEvents: SecurityEvent[] = [];
      
      for (const key of logKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (!data) continue;
          
          let events: SecurityEvent[];
          
          if (key.startsWith(this.ENCRYPTED_LOG_PREFIX)) {
            // Decrypt encrypted logs
            const decryptedData = await this.cryptoService.decryptFromStorage(data, 'audit_logs');
            events = JSON.parse(decryptedData);
          } else {
            events = JSON.parse(data);
          }
          
          allEvents.push(...events);
        } catch (error) {
          console.warn(`Failed to load log batch ${key}:`, error);
        }
      }
      
      // Sort by timestamp
      allEvents.sort((a, b) => a.timestamp - b.timestamp);
      
      return allEvents;
    } catch (error) {
      console.error('Failed to retrieve security events:', error);
      return [];
    }
  }

  /**
   * Analyze security patterns and generate alerts
   */
  private async analyzeSecurityPatterns(event: SecurityEvent): Promise<void> {
    try {
      // Pattern analysis logic would go here
      // For now, just log critical events immediately
      if (event.severity === 'critical') {
        console.warn(`CRITICAL SECURITY EVENT: ${event.eventType}`, event.metadata);
      }
    } catch (error) {
      console.error('Security pattern analysis failed:', error);
    }
  }

  /**
   * Fallback logging for when main logging fails
   */
  private async fallbackLogEvent(
    eventType: SecurityEventType,
    metadata: Record<string, any>,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    try {
      const fallbackEvent = {
        eventType,
        timestamp: Date.now(),
        severity: severity || 'medium',
        metadata,
        fallback: true
      };
      
      await AsyncStorage.setItem(
        `@tailtracker:fallback_log_${Date.now()}`,
        JSON.stringify(fallbackEvent)
      );
    } catch (error) {
      console.error('Fallback logging failed:', error);
    }
  }

  /**
   * Start periodic log synchronization
   */
  private startLogSync(): void {
    this.logSyncTimer = setInterval(async () => {
      await this.flushLogBuffer();
    }, this.LOG_SYNC_INTERVAL);
  }

  /**
   * Stop log synchronization
   */
  private stopLogSync(): void {
    if (this.logSyncTimer) {
      clearInterval(this.logSyncTimer);
      this.logSyncTimer = undefined;
    }
  }

  /**
   * Perform maintenance tasks
   */
  private async performMaintenance(): Promise<void> {
    try {
      // Clean up old logs based on retention policy
      await this.clearAuditLogs(this.LOG_RETENTION_DAYS);
      
      // Clean up fallback logs
      const keys = await AsyncStorage.getAllKeys();
      const fallbackKeys = keys.filter(key => key.startsWith('@tailtracker:fallback_log_'));
      if (fallbackKeys.length > 0) {
        await AsyncStorage.multiRemove(fallbackKeys);
      }
    } catch (error) {
      console.error('Audit log maintenance failed:', error);
    }
  }

  /**
   * Shutdown logger and cleanup
   */
  async shutdown(): Promise<void> {
    try {
      // Flush any remaining logs
      await this.flushLogBuffer();
      
      // Stop sync timer
      this.stopLogSync();
      
      console.log('Security audit logger shutdown complete');
    } catch (error) {
      console.error('Logger shutdown failed:', error);
    }
  }
}

// Export singleton instance
export const securityAuditLogger = SecurityAuditLogger.getInstance();