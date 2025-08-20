/**
 * TailTracker Rate Limiting Middleware
 * Implements tiered rate limiting for different user types and endpoints
 */

const redis = require('redis');
const { promisify } = require('util');

class RateLimiter {
  constructor(redisClient) {
    this.redis = redisClient;
    this.incr = promisify(redisClient.incr).bind(redisClient);
    this.expire = promisify(redisClient.expire).bind(redisClient);
    this.ttl = promisify(redisClient.ttl).bind(redisClient);
  }

  // Rate limit configurations based on subscription tier
  static RATE_LIMITS = {
    // Free tier limits
    free: {
      api_calls: { limit: 1000, window: 3600 }, // 1000/hour
      uploads: { limit: 10, window: 3600 }, // 10/hour
      lost_pet_reports: { limit: 5, window: 86400 }, // 5/day
      notifications: { limit: 50, window: 3600 }, // 50/hour
      search: { limit: 100, window: 3600 } // 100/hour
    },
    
    // Premium tier limits
    premium: {
      api_calls: { limit: 5000, window: 3600 }, // 5000/hour
      uploads: { limit: 100, window: 3600 }, // 100/hour
      lost_pet_reports: { limit: 20, window: 86400 }, // 20/day
      notifications: { limit: 500, window: 3600 }, // 500/hour
      search: { limit: 1000, window: 3600 } // 1000/hour
    },
    
    // Family tier limits
    family: {
      api_calls: { limit: 10000, window: 3600 }, // 10000/hour
      uploads: { limit: 200, window: 3600 }, // 200/hour
      lost_pet_reports: { limit: 50, window: 86400 }, // 50/day
      notifications: { limit: 1000, window: 3600 }, // 1000/hour
      search: { limit: 2000, window: 3600 } // 2000/hour
    },
    
    // Anonymous/public limits
    anonymous: {
      api_calls: { limit: 100, window: 3600 }, // 100/hour
      lost_pet_search: { limit: 50, window: 3600 }, // 50/hour
      registration: { limit: 5, window: 86400 } // 5/day
    }
  };

  // Endpoint-specific rate limit categories
  static ENDPOINT_CATEGORIES = {
    'POST /auth/signup': 'registration',
    'POST /auth/login': 'api_calls',
    'POST /upload': 'uploads',
    'POST /lost-pets': 'lost_pet_reports',
    'GET /lost-pets': 'lost_pet_search',
    'POST /notifications': 'notifications',
    'GET /pets/search': 'search',
    // Default to api_calls for unlisted endpoints
    default: 'api_calls'
  };

  /**
   * Get rate limit configuration for user and endpoint
   */
  getRateLimitConfig(userTier, endpoint) {
    const method = endpoint.split(' ')[0];
    const path = endpoint.split(' ')[1];
    const endpointKey = `${method} ${path}`;
    
    const category = RateLimiter.ENDPOINT_CATEGORIES[endpointKey] || 
                    RateLimiter.ENDPOINT_CATEGORIES.default;
    
    const tierLimits = RateLimiter.RATE_LIMITS[userTier] || 
                      RateLimiter.RATE_LIMITS.anonymous;
    
    return tierLimits[category] || tierLimits.api_calls;
  }

  /**
   * Check and increment rate limit counter
   */
  async checkRateLimit(userId, userTier, endpoint, ip) {
    const config = this.getRateLimitConfig(userTier, endpoint);
    if (!config) return { allowed: true };

    // Create rate limit key
    const key = userId ? 
      `rate_limit:user:${userId}:${endpoint}` : 
      `rate_limit:ip:${ip}:${endpoint}`;

    try {
      // Get current count
      const current = await this.incr(key);
      
      // Set expiry on first request
      if (current === 1) {
        await this.expire(key, config.window);
      }

      const allowed = current <= config.limit;
      const remaining = Math.max(0, config.limit - current);
      const resetTime = await this.ttl(key);

      return {
        allowed,
        limit: config.limit,
        remaining,
        resetTime: resetTime > 0 ? Date.now() + (resetTime * 1000) : null
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if Redis is down
      return { allowed: true, error: 'rate_limiter_unavailable' };
    }
  }

  /**
   * Express middleware factory
   */
  middleware() {
    return async (req, res, next) => {
      const userId = req.user?.id;
      const userTier = req.user?.subscription_status || 'anonymous';
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      const ip = req.ip || req.connection.remoteAddress;

      const result = await this.checkRateLimit(userId, userTier, endpoint, ip);

      // Set rate limit headers
      if (result.limit) {
        res.set({
          'X-RateLimit-Limit': result.limit,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.resetTime
        });
      }

      if (!result.allowed) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime
          }
        });
      }

      next();
    };
  }
}

/**
 * Advanced rate limiting with burst protection
 */
class BurstProtectionLimiter extends RateLimiter {
  static BURST_LIMITS = {
    // Burst protection: max requests per minute
    free: 50,
    premium: 200,
    family: 500,
    anonymous: 20
  };

  async checkBurstProtection(userId, userTier, ip) {
    const burstLimit = BurstProtectionLimiter.BURST_LIMITS[userTier] || 
                      BurstProtectionLimiter.BURST_LIMITS.anonymous;
    
    const key = userId ? 
      `burst_limit:user:${userId}` : 
      `burst_limit:ip:${ip}`;

    try {
      const current = await this.incr(key);
      
      if (current === 1) {
        await this.expire(key, 60); // 1 minute window
      }

      return {
        allowed: current <= burstLimit,
        remaining: Math.max(0, burstLimit - current),
        limit: burstLimit
      };
    } catch (error) {
      console.error('Burst protection error:', error);
      return { allowed: true, error: 'burst_limiter_unavailable' };
    }
  }

  middleware() {
    return async (req, res, next) => {
      const userId = req.user?.id;
      const userTier = req.user?.subscription_status || 'anonymous';
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      const ip = req.ip || req.connection.remoteAddress;

      // Check burst protection first
      const burstResult = await this.checkBurstProtection(userId, userTier, ip);
      
      if (!burstResult.allowed) {
        return res.status(429).json({
          error: {
            code: 'BURST_LIMIT_EXCEEDED',
            message: 'Too many requests in short time. Please slow down.',
            type: 'burst_protection'
          }
        });
      }

      // Then check regular rate limits
      const result = await this.checkRateLimit(userId, userTier, endpoint, ip);

      // Set headers
      res.set({
        'X-RateLimit-Limit': result.limit,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': result.resetTime,
        'X-BurstLimit-Remaining': burstResult.remaining
      });

      if (!result.allowed) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            type: 'rate_limit'
          }
        });
      }

      next();
    };
  }
}

/**
 * IP-based geographic rate limiting for global deployment
 */
class GeographicRateLimiter extends BurstProtectionLimiter {
  constructor(redisClient, geoipService) {
    super(redisClient);
    this.geoip = geoipService;
  }

  static GEOGRAPHIC_LIMITS = {
    // Higher limits for primary markets
    'US': 1.0,
    'CA': 1.0,
    'GB': 1.0,
    'AU': 1.0,
    'DE': 1.0,
    'FR': 1.0,
    'NL': 1.0,
    'SE': 1.0,
    
    // Standard limits for other markets
    'default': 0.7
  };

  getGeographicMultiplier(ip) {
    try {
      const geo = this.geoip.lookup(ip);
      const country = geo?.country;
      return GeographicRateLimiter.GEOGRAPHIC_LIMITS[country] || 
             GeographicRateLimiter.GEOGRAPHIC_LIMITS.default;
    } catch {
      return GeographicRateLimiter.GEOGRAPHIC_LIMITS.default;
    }
  }

  getRateLimitConfig(userTier, endpoint, ip) {
    const baseConfig = super.getRateLimitConfig(userTier, endpoint);
    const geoMultiplier = this.getGeographicMultiplier(ip);
    
    return {
      limit: Math.floor(baseConfig.limit * geoMultiplier),
      window: baseConfig.window
    };
  }
}

module.exports = {
  RateLimiter,
  BurstProtectionLimiter,
  GeographicRateLimiter
};