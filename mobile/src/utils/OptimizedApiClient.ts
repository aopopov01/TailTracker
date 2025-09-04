import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

/**
 * Optimized API Client with caching, deduplication, and retry mechanisms
 * Designed for high-performance React Native applications
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  skipCache?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  status: number;
  cached?: boolean;
  duration?: number;
  error?: string;
}

class OptimizedApiClient {
  private cache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<any>>();
  private defaultTimeout = 10000; // 10 seconds
  private defaultRetries = 3;
  private defaultRetryDelay = 1000; // 1 second
  private defaultCacheTTL = 5 * 60 * 1000; // 5 minutes
  private maxCacheSize = 100; // Maximum number of cached entries
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    this.initializeCache();
  }

  /**
   * Initialize cache from storage
   */
  private async initializeCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('@TailTracker:api_cache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Filter out expired entries
        Object.entries(cacheData).forEach(([key, entry]: [string, any]) => {
          if (entry.expiresAt > now) {
            this.cache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load API cache:', error);
    }
  }

  /**
   * Persist cache to storage
   */
  private async persistCache(): Promise<void> {
    try {
      const cacheData: { [key: string]: CacheEntry } = {};
      this.cache.forEach((entry, key) => {
        cacheData[key] = entry;
      });
      
      await AsyncStorage.setItem('@TailTracker:api_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist API cache:', error);
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(url: string, options: RequestOptions): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    const headers = JSON.stringify(options.headers || {});
    
    return `${method}:${url}:${body}:${headers}`;
  }

  /**
   * Get cached response if valid
   */
  private getCachedResponse<T>(cacheKey: string): CacheEntry<T> | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;
    
    const now = Date.now();
    if (entry.expiresAt <= now) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry;
  }

  /**
   * Cache response with TTL
   */
  private cacheResponse<T>(
    cacheKey: string,
    data: T,
    cacheTTL: number,
    etag?: string
  ): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + cacheTTL,
      etag,
    };
    
    this.cache.set(cacheKey, entry);
    
    // Implement LRU eviction if cache is full
    if (this.cache.size > this.maxCacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
    
    // Persist cache asynchronously
    this.persistCache();
  }

  /**
   * Make HTTP request with optimizations
   */
  async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const requestOptions: RequestOptions = {
      timeout: this.defaultTimeout,
      retries: this.defaultRetries,
      retryDelay: this.defaultRetryDelay,
      cache: true,
      cacheTTL: this.defaultCacheTTL,
      ...options,
    };

    const cacheKey = this.generateCacheKey(fullUrl, requestOptions);

    // Check cache first (for GET requests)
    if (requestOptions.cache && !requestOptions.skipCache && (!options.method || options.method === 'GET')) {
      const cachedResponse = this.getCachedResponse<T>(cacheKey);
      if (cachedResponse) {
        return {
          data: cachedResponse.data,
          success: true,
          status: 200,
          cached: true,
          duration: Date.now() - startTime,
        };
      }
    }

    // Deduplicate in-flight requests
    if (this.inFlight.has(cacheKey)) {
      const result = await this.inFlight.get(cacheKey)!;
      return {
        ...result,
        duration: Date.now() - startTime,
      };
    }

    // Make the request
    const requestPromise = this.makeRequestWithRetries<T>(
      fullUrl,
      requestOptions,
      startTime
    );

    this.inFlight.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful GET responses
      if (
        result.success &&
        requestOptions.cache &&
        (!options.method || options.method === 'GET')
      ) {
        this.cacheResponse(cacheKey, result.data, requestOptions.cacheTTL!);
      }
      
      return result;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  /**
   * Make request with timeout and retries
   */
  private async makeRequestWithRetries<T>(
    url: string,
    options: RequestOptions,
    startTime: number,
    attempt = 1
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout!
    );

    try {
      // Add authentication if available
      const headers = { ...options.headers };
      try {
        const session = await supabase.auth.getSession();
        if (session.data.session?.access_token) {
          headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
        }
      } catch (authError) {
        // Continue without auth if not available
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      return {
        data,
        success: true,
        status: response.status,
        duration,
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Retry logic
      if (
        attempt < options.retries! &&
        error.name !== 'AbortError' &&
        this.shouldRetry(error, attempt)
      ) {
        await this.delay(options.retryDelay! * Math.pow(2, attempt - 1)); // Exponential backoff
        return this.makeRequestWithRetries<T>(url, options, startTime, attempt + 1);
      }

      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        data: null as unknown as T,
        success: false,
        status: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any, attempt: number): boolean {
    // Don't retry on client errors (4xx)
    if (error.message?.includes('HTTP 4')) return false;
    
    // Don't retry on authentication errors
    if (error.message?.includes('401') || error.message?.includes('403')) return false;
    
    // Retry on network errors, timeouts, and server errors (5xx)
    return true;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convenient methods for common HTTP verbs
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  async put<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Batch multiple requests
   */
  async batch<T = any>(
    requests: Array<{ url: string; options?: RequestOptions }>,
    options: { concurrent?: number; failFast?: boolean } = {}
  ): Promise<ApiResponse<T>[]> {
    const { concurrent = 5, failFast = false } = options;
    const results: ApiResponse<T>[] = [];
    
    // Process requests in chunks to limit concurrency
    for (let i = 0; i < requests.length; i += concurrent) {
      const chunk = requests.slice(i, i + concurrent);
      const chunkPromises = chunk.map(({ url, options }) => 
        this.request<T>(url, options).catch(error => ({
          data: null as unknown as T,
          success: false,
          status: 0,
          error: error.message,
        }))
      );

      if (failFast) {
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
        
        // Stop processing if any request failed
        if (chunkResults.some(result => !result.success)) {
          break;
        }
      } else {
        const chunkResults = await Promise.allSettled(chunkPromises);
        results.push(
          ...chunkResults.map(result => 
            result.status === 'fulfilled' 
              ? result.value 
              : {
                  data: null as unknown as T,
                  success: false,
                  status: 0,
                  error: 'Request failed',
                }
          )
        );
      }
    }

    return results;
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem('@TailTracker:api_cache');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
  } {
    // This would be implemented with proper metrics tracking
    return {
      size: this.cache.size,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
    };
  }

  /**
   * Preload critical data
   */
  async preloadCriticalData(urls: string[]): Promise<void> {
    const preloadPromises = urls.map(url => 
      this.get(url, { 
        cache: true, 
        cacheTTL: 30 * 60 * 1000, // 30 minutes
        timeout: 5000, // Shorter timeout for preload
        retries: 1, // Fewer retries for preload
      }).catch(error => {
        console.warn('Failed to preload:', url, error);
      })
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', {
        timeout: 3000,
        retries: 1,
        cache: false,
      });
      return response.success;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const apiClient = new OptimizedApiClient();

// React hook for API client
import { useCallback } from 'react';

export const useApiClient = () => {
  const get = useCallback(<T = any>(url: string, options?: RequestOptions) => 
    apiClient.get<T>(url, options), []);
  
  const post = useCallback(<T = any>(url: string, data?: any, options?: RequestOptions) => 
    apiClient.post<T>(url, data, options), []);
  
  const put = useCallback(<T = any>(url: string, data?: any, options?: RequestOptions) => 
    apiClient.put<T>(url, data, options), []);
  
  const del = useCallback(<T = any>(url: string, options?: RequestOptions) => 
    apiClient.delete<T>(url, options), []);

  return {
    get,
    post,
    put,
    delete: del,
    batch: apiClient.batch.bind(apiClient),
    clearCache: apiClient.clearCache.bind(apiClient),
    getCacheStats: apiClient.getCacheStats.bind(apiClient),
    healthCheck: apiClient.healthCheck.bind(apiClient),
  };
};

export default apiClient;