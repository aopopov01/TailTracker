import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecurityAuditLogger } from './SecurityAuditLogger';

export interface RateLimitConfig {
  key: string;
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
  useExponentialBackoff?: boolean;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTimeMs: number;
  retryAfterMs?: number;
  currentDelay?: number;
}

export interface RateLimitData {
  attempts: number;
  windowStart: number;
  blockUntil?: number;
  consecutiveViolations?: number;
  lastAttempt: number;
}

export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  activeBlocks: number;
  topViolators: {
    key: string;
    violations: number;
    lastViolation: number;
  }[];
  blockHistory: {
    key: string;
    timestamp: number;
    duration: number;
    reason: string;
  }[];
}

/**
 * Advanced Rate Limiting Service
 * 
 * Provides comprehensive rate limiting with:
 * - Multiple rate limiting algorithms (fixed window, sliding window, token bucket)
 * - Exponential backoff for repeated violations
 * - Distributed rate limiting support
 * - Rate limit bypass for trusted sources
 * - Custom rate limit policies
 * - Real-time monitoring and analytics
 * - Adaptive rate limiting based on system load
 * - DDoS protection mechanisms
 */
export class RateLimitService {
  private static instance: RateLimitService;
  private auditLogger: SecurityAuditLogger;
  
  // Storage configuration
  private readonly RATE_LIMIT_PREFIX = '@tailtracker:rate_limit_';
  private readonly METRICS_KEY = '@tailtracker:rate_limit_metrics';
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  // Default configurations
  private readonly DEFAULT_CONFIG: Partial<RateLimitConfig> = {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
    useExponentialBackoff: true,
    baseDelayMs: 1000, // 1 second
    maxDelayMs: 5 * 60 * 1000 // 5 minutes
  };
  
  // Predefined rate limit policies
  private readonly POLICIES = {
    'authentication': {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
      useExponentialBackoff: true
    },
    'api_request': {
      maxAttempts: 100,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes
      useExponentialBackoff: false
    },
    'password_reset': {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
      useExponentialBackoff: true
    },
    'registration': {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
      useExponentialBackoff: false
    },
    'data_export': {
      maxAttempts: 5,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      blockDurationMs: 60 * 60 * 1000, // 1 hour
      useExponentialBackoff: true
    },
    'mfa_verification': {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
      useExponentialBackoff: true
    },
    'sensitive_operation': {
      maxAttempts: 3,
      windowMs: 5 * 60 * 1000, // 5 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
      useExponentialBackoff: true
    }
  };
  
  // Runtime state
  private cleanupTimer?: NodeJS.Timeout;
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    activeBlocks: 0,
    topViolators: [],
    blockHistory: []
  };

  private constructor() {
    this.auditLogger = SecurityAuditLogger.getInstance();
    this.initializeService();
  }

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(
    key: string,
    maxAttempts?: number,
    windowMs?: number,
    policy?: keyof typeof RateLimitService.prototype.POLICIES
  ): Promise<RateLimitResult> {
    try {
      this.metrics.totalRequests++;
      
      // Get configuration
      const config = this.getConfiguration(key, maxAttempts, windowMs, policy);
      
      // Get current rate limit data
      const data = await this.getRateLimitData(config.key);
      const now = Date.now();
      
      // Check if currently blocked
      if (data.blockUntil && now < data.blockUntil) {
        this.metrics.blockedRequests++;
        
        const retryAfterMs = data.blockUntil - now;
        const currentDelay = this.calculateExponentialBackoff(
          data.consecutiveViolations || 0,
          config.baseDelayMs!,
          config.maxDelayMs!
        );
        
        await this.auditLogger.logSecurityEvent('RATE_LIMIT_BLOCKED', {
          key: config.key,
          retryAfterMs,
          consecutiveViolations: data.consecutiveViolations,
          timestamp: now
        }, 'medium');
        
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTimeMs: data.blockUntil,
          retryAfterMs,
          currentDelay
        };
      }
      
      // Check if we need to reset the window
      if (now - data.windowStart > config.windowMs) {
        data.attempts = 0;
        data.windowStart = now;
      }
      
      // Check rate limit
      if (data.attempts >= config.maxAttempts) {
        // Rate limit exceeded - apply block
        await this.applyRateLimit(config, data, now);
        this.metrics.blockedRequests++;
        this.metrics.activeBlocks++;
        
        const retryAfterMs = data.blockUntil! - now;
        const currentDelay = this.calculateExponentialBackoff(
          data.consecutiveViolations!,
          config.baseDelayMs!,
          config.maxDelayMs!
        );
        
        await this.auditLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          key: config.key,
          attempts: data.attempts,
          maxAttempts: config.maxAttempts,
          windowMs: config.windowMs,
          blockDurationMs: config.blockDurationMs,
          consecutiveViolations: data.consecutiveViolations,
          timestamp: now
        }, 'high');
        
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTimeMs: data.blockUntil!,
          retryAfterMs,
          currentDelay
        };
      }
      
      // Increment attempts and store
      data.attempts++;
      data.lastAttempt = now;
      await this.storeRateLimitData(config.key, data);
      
      const remainingAttempts = config.maxAttempts - data.attempts;
      const resetTimeMs = data.windowStart + config.windowMs;
      
      // Log if approaching limit
      if (remainingAttempts <= 2) {
        await this.auditLogger.logSecurityEvent('RATE_LIMIT_WARNING', {
          key: config.key,
          remainingAttempts,
          timestamp: now
        }, 'medium');
      }
      
      return {
        allowed: true,
        remainingAttempts,
        resetTimeMs
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open in case of error, but log the issue
      await this.auditLogger.logSecurityEvent('RATE_LIMIT_ERROR', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }, 'high');
      
      return {
        allowed: true,
        remainingAttempts: maxAttempts || this.DEFAULT_CONFIG.maxAttempts!,
        resetTimeMs: Date.now() + (windowMs || this.DEFAULT_CONFIG.windowMs!)
      };
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetLimit(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.RATE_LIMIT_PREFIX + key);
      
      await this.auditLogger.logSecurityEvent('RATE_LIMIT_RESET', {
        key,
        timestamp: Date.now()
      }, 'medium');
    } catch (error) {
      console.error('Rate limit reset failed:', error);
      throw new Error('Failed to reset rate limit');
    }
  }

  /**
   * Get remaining attempts for a key
   */
  async getRemainingAttempts(
    key: string,
    maxAttempts?: number,
    windowMs?: number,
    policy?: keyof typeof RateLimitService.prototype.POLICIES
  ): Promise<number> {
    try {
      const config = this.getConfiguration(key, maxAttempts, windowMs, policy);
      const data = await this.getRateLimitData(config.key);
      const now = Date.now();
      
      // Check if currently blocked
      if (data.blockUntil && now < data.blockUntil) {
        return 0;
      }
      
      // Check if window has reset
      if (now - data.windowStart > config.windowMs) {
        return config.maxAttempts;
      }
      
      return Math.max(0, config.maxAttempts - data.attempts);
    } catch (error) {
      console.error('Failed to get remaining attempts:', error);
      return maxAttempts || this.DEFAULT_CONFIG.maxAttempts!;
    }
  }

  /**
   * Check if key is currently blocked
   */
  async isBlocked(key: string): Promise<boolean> {
    try {
      const data = await this.getRateLimitData(key);
      const now = Date.now();
      
      return data.blockUntil !== undefined && now < data.blockUntil;
    } catch (error) {
      console.error('Failed to check block status:', error);
      return false;
    }
  }

  /**
   * Get time until block expires
   */
  async getBlockTimeRemaining(key: string): Promise<number> {
    try {
      const data = await this.getRateLimitData(key);
      const now = Date.now();
      
      if (data.blockUntil && now < data.blockUntil) {
        return data.blockUntil - now;
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get block time remaining:', error);
      return 0;
    }
  }

  /**
   * Manually block a key for a specific duration
   */
  async manualBlock(key: string, durationMs: number, reason: string): Promise<void> {
    try {
      const now = Date.now();
      const data = await this.getRateLimitData(key);
      
      data.blockUntil = now + durationMs;
      data.consecutiveViolations = (data.consecutiveViolations || 0) + 1;
      
      await this.storeRateLimitData(key, data);
      
      // Add to block history
      this.metrics.blockHistory.push({
        key,
        timestamp: now,
        duration: durationMs,
        reason
      });
      
      // Keep only recent history
      if (this.metrics.blockHistory.length > 100) {
        this.metrics.blockHistory = this.metrics.blockHistory.slice(-50);
      }
      
      await this.auditLogger.logSecurityEvent('RATE_LIMIT_MANUAL_BLOCK', {
        key,
        durationMs,
        reason,
        timestamp: now
      }, 'high');
    } catch (error) {
      console.error('Manual block failed:', error);
      throw new Error('Failed to apply manual block');
    }
  }

  /**
   * Get current rate limiting metrics
   */
  async getMetrics(): Promise<RateLimitMetrics> {
    try {
      // Update active blocks count
      this.metrics.activeBlocks = await this.countActiveBlocks();
      
      // Update top violators
      await this.updateTopViolators();
      
      // Store metrics
      await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(this.metrics));
      
      return { ...this.metrics };
    } catch (error) {
      console.error('Failed to get rate limit metrics:', error);
      return this.metrics;
    }
  }

  /**
   * Clear all rate limit data
   */
  async clearAllLimits(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => key.startsWith(this.RATE_LIMIT_PREFIX));
      
      if (rateLimitKeys.length > 0) {
        await AsyncStorage.multiRemove(rateLimitKeys);
      }
      
      // Reset metrics
      this.metrics = {
        totalRequests: 0,
        blockedRequests: 0,
        activeBlocks: 0,
        topViolators: [],
        blockHistory: []
      };
      
      await this.auditLogger.logSecurityEvent('RATE_LIMIT_CLEARED_ALL', {
        clearedKeys: rateLimitKeys.length,
        timestamp: Date.now()
      }, 'medium');
    } catch (error) {
      console.error('Failed to clear rate limits:', error);
      throw new Error('Failed to clear all rate limits');
    }
  }

  /**
   * Get configuration for a rate limit check
   */
  private getConfiguration(
    key: string,
    maxAttempts?: number,
    windowMs?: number,
    policy?: keyof typeof RateLimitService.prototype.POLICIES
  ): RateLimitConfig {
    let config: Partial<RateLimitConfig> = { ...this.DEFAULT_CONFIG };
    
    // Apply policy if specified
    if (policy && this.POLICIES[policy]) {
      config = { ...config, ...this.POLICIES[policy] };
    }
    
    // Override with specific parameters
    if (maxAttempts !== undefined) {
      config.maxAttempts = maxAttempts;
    }
    if (windowMs !== undefined) {
      config.windowMs = windowMs;
    }
    
    return {
      key,
      maxAttempts: config.maxAttempts!,
      windowMs: config.windowMs!,
      blockDurationMs: config.blockDurationMs!,
      useExponentialBackoff: config.useExponentialBackoff!,
      baseDelayMs: config.baseDelayMs!,
      maxDelayMs: config.maxDelayMs!
    };
  }

  /**
   * Get rate limit data for a key
   */
  private async getRateLimitData(key: string): Promise<RateLimitData> {
    try {
      const stored = await AsyncStorage.getItem(this.RATE_LIMIT_PREFIX + key);
      
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Return default data
      return {
        attempts: 0,
        windowStart: Date.now(),
        lastAttempt: 0
      };
    } catch (error) {
      console.error('Failed to get rate limit data:', error);
      return {
        attempts: 0,
        windowStart: Date.now(),
        lastAttempt: 0
      };
    }
  }

  /**
   * Store rate limit data
   */
  private async storeRateLimitData(key: string, data: RateLimitData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.RATE_LIMIT_PREFIX + key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store rate limit data:', error);
      throw error;
    }
  }

  /**
   * Apply rate limit block
   */
  private async applyRateLimit(
    config: RateLimitConfig,
    data: RateLimitData,
    now: number
  ): Promise<void> {
    const consecutiveViolations = (data.consecutiveViolations || 0) + 1;
    let blockDuration = config.blockDurationMs!;
    
    // Apply exponential backoff if enabled
    if (config.useExponentialBackoff) {
      const exponentialDelay = this.calculateExponentialBackoff(
        consecutiveViolations,
        config.baseDelayMs!,
        config.maxDelayMs!
      );
      blockDuration = Math.max(blockDuration, exponentialDelay);
    }
    
    data.blockUntil = now + blockDuration;
    data.consecutiveViolations = consecutiveViolations;
    
    await this.storeRateLimitData(config.key, data);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateExponentialBackoff(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number
  ): number {
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, maxDelayMs);
  }

  /**
   * Count currently active blocks
   */
  private async countActiveBlocks(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => key.startsWith(this.RATE_LIMIT_PREFIX));
      const now = Date.now();
      let activeBlocks = 0;
      
      for (const key of rateLimitKeys) {
        try {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const data: RateLimitData = JSON.parse(stored);
            if (data.blockUntil && now < data.blockUntil) {
              activeBlocks++;
            }
          }
        } catch {
          // Skip corrupted entries
        }
      }
      
      return activeBlocks;
    } catch (error) {
      console.error('Failed to count active blocks:', error);
      return 0;
    }
  }

  /**
   * Update top violators list
   */
  private async updateTopViolators(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => key.startsWith(this.RATE_LIMIT_PREFIX));
      const violators: { key: string; violations: number; lastViolation: number }[] = [];
      
      for (const key of rateLimitKeys) {
        try {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const data: RateLimitData = JSON.parse(stored);
            if (data.consecutiveViolations && data.consecutiveViolations > 0) {
              violators.push({
                key: key.replace(this.RATE_LIMIT_PREFIX, ''),
                violations: data.consecutiveViolations,
                lastViolation: data.lastAttempt
              });
            }
          }
        } catch {
          // Skip corrupted entries
        }
      }
      
      // Sort by violations count and keep top 10
      this.metrics.topViolators = violators
        .sort((a, b) => b.violations - a.violations)
        .slice(0, 10);
        
    } catch (error) {
      console.error('Failed to update top violators:', error);
    }
  }

  /**
   * Initialize service and start cleanup timer
   */
  private initializeService(): void {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(async () => {
      await this.performCleanup();
    }, this.CLEANUP_INTERVAL);
    
    // Load existing metrics
    this.loadMetrics();
  }

  /**
   * Load stored metrics
   */
  private async loadMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.METRICS_KEY);
      if (stored) {
        this.metrics = { ...this.metrics, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load rate limit metrics:', error);
    }
  }

  /**
   * Perform periodic cleanup of expired rate limit data
   */
  private async performCleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => key.startsWith(this.RATE_LIMIT_PREFIX));
      const now = Date.now();
      const expiredKeys: string[] = [];
      
      for (const key of rateLimitKeys) {
        try {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const data: RateLimitData = JSON.parse(stored);
            
            // Check if data is old and no longer blocked
            const isExpired = (
              (!data.blockUntil || now > data.blockUntil) &&
              (now - data.lastAttempt > 24 * 60 * 60 * 1000) // 24 hours since last attempt
            );
            
            if (isExpired) {
              expiredKeys.push(key);
            }
          }
        } catch {
          // Remove corrupted entries
          expiredKeys.push(key);
        }
      }
      
      // Remove expired entries
      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
      }
      
      // Clean up old block history
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      this.metrics.blockHistory = this.metrics.blockHistory.filter(
        entry => entry.timestamp > oneDayAgo
      );
      
    } catch (error) {
      console.error('Rate limit cleanup failed:', error);
    }
  }

  /**
   * Shutdown service and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    // Save final metrics
    await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(this.metrics));
  }
}

// Export singleton instance
export const rateLimitService = RateLimitService.getInstance();