/**
 * TailTracker Redis Caching Strategy
 * Multi-layer caching for 150K+ users with 99.9% uptime
 */

const redis = require('redis');
const { promisify } = require('util');

class TailTrackerCache {
  constructor(redisConfig) {
    // Primary Redis instance for caching
    this.cache = redis.createClient(redisConfig.cache);
    
    // Separate Redis instance for sessions (high availability)
    this.sessions = redis.createClient(redisConfig.sessions);
    
    // Separate Redis instance for pub/sub (real-time features)
    this.pubsub = redis.createClient(redisConfig.pubsub);
    
    // Promisify Redis methods
    this.get = promisify(this.cache.get).bind(this.cache);
    this.set = promisify(this.cache.set).bind(this.cache);
    this.del = promisify(this.cache.del).bind(this.cache);
    this.exists = promisify(this.cache.exists).bind(this.cache);
    this.ttl = promisify(this.cache.ttl).bind(this.cache);
    this.pipeline = this.cache.pipeline.bind(this.cache);
  }

  /**
   * Cache configuration for different data types
   */
  static CACHE_CONFIG = {
    // User data caching
    user_profile: { ttl: 1800, version: 1 }, // 30 minutes
    user_families: { ttl: 3600, version: 1 }, // 1 hour
    user_subscription: { ttl: 300, version: 1 }, // 5 minutes
    
    // Pet data caching
    pet_profile: { ttl: 1800, version: 1 }, // 30 minutes
    pet_list: { ttl: 900, version: 1 }, // 15 minutes
    pet_health_records: { ttl: 3600, version: 1 }, // 1 hour
    
    // Medical data caching
    vaccinations: { ttl: 7200, version: 1 }, // 2 hours
    medications: { ttl: 1800, version: 1 }, // 30 minutes
    medical_records: { ttl: 3600, version: 1 }, // 1 hour
    
    // Location and lost pets (real-time data)
    lost_pets_area: { ttl: 300, version: 1 }, // 5 minutes
    geo_search: { ttl: 600, version: 1 }, // 10 minutes
    
    // API responses (short-term caching)
    api_response: { ttl: 60, version: 1 }, // 1 minute
    search_results: { ttl: 300, version: 1 }, // 5 minutes
    
    // Static data (long-term caching)
    veterinarians: { ttl: 86400, version: 1 }, // 24 hours
    breeds: { ttl: 604800, version: 1 }, // 1 week
    
    // Session data
    user_session: { ttl: 86400, version: 1 }, // 24 hours
    temp_session: { ttl: 1800, version: 1 }, // 30 minutes
  };

  /**
   * Generate cache key with versioning
   */
  generateKey(type, identifier, userId = null) {
    const config = TailTrackerCache.CACHE_CONFIG[type];
    const version = config?.version || 1;
    const userPrefix = userId ? `user:${userId}:` : '';
    
    return `tailtracker:v${version}:${userPrefix}${type}:${identifier}`;
  }

  /**
   * Set cached value with automatic TTL
   */
  async setCached(type, identifier, value, userId = null, customTtl = null) {
    try {
      const key = this.generateKey(type, identifier, userId);
      const config = TailTrackerCache.CACHE_CONFIG[type];
      const ttl = customTtl || config?.ttl || 300;
      
      const serialized = JSON.stringify({
        data: value,
        cached_at: Date.now(),
        ttl: ttl
      });
      
      await this.set(key, serialized, 'EX', ttl);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cached value with freshness check
   */
  async getCached(type, identifier, userId = null) {
    try {
      const key = this.generateKey(type, identifier, userId);
      const cached = await this.get(key);
      
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.cached_at;
      const maxAge = parsed.ttl * 1000;
      
      // Return with metadata
      return {
        data: parsed.data,
        cached_at: parsed.cached_at,
        age_seconds: Math.floor(age / 1000),
        fresh: age < (maxAge * 0.8), // Consider stale at 80% of TTL
        ttl_remaining: await this.ttl(key)
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await this.cache.keys(pattern);
      if (keys.length > 0) {
        await this.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Cache-aside pattern implementation
   */
  async getOrSet(type, identifier, fetchFunction, userId = null, customTtl = null) {
    // Try cache first
    const cached = await this.getCached(type, identifier, userId);
    
    if (cached && cached.fresh) {
      return { data: cached.data, source: 'cache' };
    }
    
    try {
      // Fetch fresh data
      const freshData = await fetchFunction();
      
      // Cache the result
      await this.setCached(type, identifier, freshData, userId, customTtl);
      
      return { data: freshData, source: 'database' };
    } catch (error) {
      // Return stale cache if available and fresh fetch fails
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error.message);
        return { data: cached.data, source: 'stale_cache' };
      }
      throw error;
    }
  }

  /**
   * Batch cache operations for efficiency
   */
  async batchSet(operations) {
    try {
      const pipeline = this.cache.multi();
      
      for (const op of operations) {
        const { type, identifier, value, userId, customTtl } = op;
        const key = this.generateKey(type, identifier, userId);
        const config = TailTrackerCache.CACHE_CONFIG[type];
        const ttl = customTtl || config?.ttl || 300;
        
        const serialized = JSON.stringify({
          data: value,
          cached_at: Date.now(),
          ttl: ttl
        });
        
        pipeline.setex(key, ttl, serialized);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Batch cache set error:', error);
      return false;
    }
  }

  /**
   * Smart cache warming for frequently accessed data
   */
  async warmCache(userId, userData) {
    const warmingOperations = [
      // User profile data
      {
        type: 'user_profile',
        identifier: userId,
        value: userData
      },
      
      // User families
      {
        type: 'user_families',
        identifier: userId,
        value: userData.families || []
      }
    ];
    
    await this.batchSet(warmingOperations);
  }

  /**
   * Cache invalidation strategies
   */
  async invalidateUserCache(userId) {
    const patterns = [
      `tailtracker:*:user:${userId}:*`,
      `tailtracker:*:pet_list:*:${userId}`,
      `tailtracker:*:user_families:${userId}`
    ];
    
    let totalInvalidated = 0;
    for (const pattern of patterns) {
      totalInvalidated += await this.invalidatePattern(pattern);
    }
    
    return totalInvalidated;
  }

  async invalidatePetCache(petId, familyId) {
    const patterns = [
      `tailtracker:*:pet_profile:${petId}`,
      `tailtracker:*:pet_list:${familyId}`,
      `tailtracker:*:vaccinations:${petId}`,
      `tailtracker:*:medications:${petId}`,
      `tailtracker:*:medical_records:${petId}`
    ];
    
    let totalInvalidated = 0;
    for (const pattern of patterns) {
      totalInvalidated += await this.invalidatePattern(pattern);
    }
    
    return totalInvalidated;
  }

  /**
   * Real-time cache for lost pets with geo-spatial support
   */
  async cacheLostPetsInArea(latitude, longitude, radius, lostPets) {
    const geohash = this.generateGeohash(latitude, longitude, 6); // 6 char precision ~1.2km
    const key = this.generateKey('lost_pets_area', `${geohash}:${radius}`);
    
    await this.setCached('lost_pets_area', `${geohash}:${radius}`, {
      pets: lostPets,
      center: { latitude, longitude },
      radius,
      count: lostPets.length
    });
  }

  /**
   * Session caching with Redis
   */
  async setSession(sessionId, sessionData, ttl = 86400) {
    const key = `session:${sessionId}`;
    return await this.sessions.setex(key, ttl, JSON.stringify(sessionData));
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    const session = await promisify(this.sessions.get).bind(this.sessions)(key);
    return session ? JSON.parse(session) : null;
  }

  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await promisify(this.sessions.del).bind(this.sessions)(key);
  }

  /**
   * Pub/Sub for real-time features
   */
  async publishLostPetAlert(petData, location) {
    const channel = `lost_pets:area:${this.generateGeohash(location.latitude, location.longitude, 4)}`;
    const message = JSON.stringify({
      type: 'LOST_PET_ALERT',
      pet: petData,
      location,
      timestamp: Date.now()
    });
    
    return await this.pubsub.publish(channel, message);
  }

  async subscribeToLostPetAlerts(latitude, longitude, callback) {
    const geohash = this.generateGeohash(latitude, longitude, 4);
    const channel = `lost_pets:area:${geohash}`;
    
    this.pubsub.subscribe(channel);
    this.pubsub.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(JSON.parse(message));
      }
    });
  }

  /**
   * Cache health monitoring
   */
  async getCacheHealth() {
    try {
      const cacheInfo = await promisify(this.cache.info).bind(this.cache)();
      const sessionInfo = await promisify(this.sessions.info).bind(this.sessions)();
      
      return {
        cache: {
          connected: this.cache.connected,
          memory_usage: this.parseRedisInfo(cacheInfo, 'used_memory_human'),
          connected_clients: this.parseRedisInfo(cacheInfo, 'connected_clients'),
          keyspace_hits: this.parseRedisInfo(cacheInfo, 'keyspace_hits'),
          keyspace_misses: this.parseRedisInfo(cacheInfo, 'keyspace_misses')
        },
        sessions: {
          connected: this.sessions.connected,
          memory_usage: this.parseRedisInfo(sessionInfo, 'used_memory_human'),
          connected_clients: this.parseRedisInfo(sessionInfo, 'connected_clients')
        },
        pubsub: {
          connected: this.pubsub.connected
        }
      };
    } catch (error) {
      return { error: error.message, status: 'unhealthy' };
    }
  }

  /**
   * Utility methods
   */
  generateGeohash(lat, lng, precision) {
    // Simple geohash implementation for spatial indexing
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let idx = 0;
    let bit = 0;
    let evenBit = true;
    let geohash = '';
    
    let latRange = [-90.0, 90.0];
    let lngRange = [-180.0, 180.0];
    
    while (geohash.length < precision) {
      if (evenBit) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (lng >= mid) {
          idx = (idx << 1) + 1;
          lngRange[0] = mid;
        } else {
          idx = idx << 1;
          lngRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (lat >= mid) {
          idx = (idx << 1) + 1;
          latRange[0] = mid;
        } else {
          idx = idx << 1;
          latRange[1] = mid;
        }
      }
      
      evenBit = !evenBit;
      if (++bit === 5) {
        geohash += base32[idx];
        bit = 0;
        idx = 0;
      }
    }
    
    return geohash;
  }

  parseRedisInfo(info, key) {
    const lines = info.split('\r\n');
    const line = lines.find(l => l.startsWith(key + ':'));
    return line ? line.split(':')[1] : null;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    await Promise.all([
      this.cache.quit(),
      this.sessions.quit(),
      this.pubsub.quit()
    ]);
  }
}

/**
 * Cache middleware for Express routes
 */
class CacheMiddleware {
  constructor(cache) {
    this.cache = cache;
  }

  /**
   * Cache GET requests
   */
  cacheResponse(type, ttl = null) {
    return async (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') return next();
      
      const cacheKey = this.generateRequestKey(req, type);
      const cached = await this.cache.getCached(type, cacheKey, req.user?.id);
      
      if (cached && cached.fresh) {
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Age': cached.age_seconds,
          'X-Cache-TTL': cached.ttl_remaining
        });
        return res.json(cached.data);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await this.cache.setCached(type, cacheKey, data, req.user?.id, ttl);
        }
        
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Source': 'database'
        });
        
        return originalJson(data);
      };
      
      next();
    };
  }

  generateRequestKey(req, type) {
    const baseKey = `${req.method}:${req.route.path}`;
    const queryString = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    
    return queryString ? `${baseKey}?${queryString}` : baseKey;
  }
}

module.exports = {
  TailTrackerCache,
  CacheMiddleware
};