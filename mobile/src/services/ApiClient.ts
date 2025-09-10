import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase as supabaseEnhanced } from '@/services/supabase';
import ErrorRecoveryService from './ErrorRecoveryService';
import { OfflineQueueManager } from './OfflineQueueManager';

// Initialize service instances
const errorRecoveryService = ErrorRecoveryService.getInstance();
const offlineQueueManager = OfflineQueueManager.getInstance();

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  };
  cache?: {
    enabled?: boolean;
    ttl?: number; // Time to live in milliseconds
    key?: string;
  };
  circuitBreaker?: string;
  deduplicate?: boolean;
  offlineQueue?: {
    enabled?: boolean;
    priority?: 'critical' | 'high' | 'medium' | 'low';
  };
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  cached?: boolean;
  fromQueue?: boolean;
}

export interface CachedResponse<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  url: string;
}

/**
 * Enhanced API client with error recovery, caching, and deduplication
 */
export class ApiClient {
  private static instance: ApiClient;
  private requestCache = new Map<string, CachedResponse>();
  private activeRequests = new Map<string, Promise<ApiResponse>>();
  private baseURL = '';

  private constructor() {
    this.loadCachedResponses();
    this.setupCacheCleanup();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Make API request with full error recovery and caching
   */
  public async request<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestKey = this.generateRequestKey(url, config);

    // Check cache first
    if (config.cache?.enabled && config.method !== 'POST') {
      const cachedResponse = this.getCachedResponse<T>(requestKey);
      if (cachedResponse) {
        return {
          data: cachedResponse.data,
          error: null,
          status: 200,
          cached: true,
        };
      }
    }

    // Deduplicate requests
    if (config.deduplicate && this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const requestPromise = this.executeRequest<T>(url, config, requestKey);

    // Store active request for deduplication
    if (config.deduplicate) {
      this.activeRequests.set(requestKey, requestPromise);
      
      // Clean up after request completes
      requestPromise.finally(() => {
        this.activeRequests.delete(requestKey);
      });
    }

    return requestPromise;
  }

  /**
   * GET request with enhanced error recovery
   */
  public async get<T = any>(
    endpoint: string,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
      cache: { enabled: true, ttl: 300000, ...config.cache }, // 5 minutes default cache
      deduplicate: true,
    });
  }

  /**
   * POST request with offline queue support
   */
  public async post<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data,
      offlineQueue: { enabled: true, priority: 'high', ...config.offlineQueue },
    });
  }

  /**
   * PUT request with offline queue support
   */
  public async put<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data,
      offlineQueue: { enabled: true, priority: 'high', ...config.offlineQueue },
    });
  }

  /**
   * DELETE request with offline queue support
   */
  public async delete<T = any>(
    endpoint: string,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
      offlineQueue: { enabled: true, priority: 'medium', ...config.offlineQueue },
    });
  }

  /**
   * Execute the actual request with error recovery
   */
  private async executeRequest<T>(
    url: string,
    config: ApiRequestConfig,
    requestKey: string
  ): Promise<ApiResponse<T>> {
    const operation = async (): Promise<ApiResponse<T>> => {
      const networkStatus = errorRecoveryService.getNetworkStatus();
      
      // If offline and operation can be queued
      if (!networkStatus.isConnected && config.offlineQueue?.enabled) {
        if (config.method === 'POST' || config.method === 'PUT' || config.method === 'DELETE') {
          await (offlineQueueManager as any).enqueue({
            type: 'API_REQUEST',
            data: {
              url,
              method: config.method,
              body: config.body,
              headers: config.headers,
            },
            priority: config.offlineQueue.priority || 'medium',
            requiresAuthentication: true,
          });

          return {
            data: null,
            error: 'Request queued for offline retry',
            status: 202, // Accepted
            fromQueue: true,
          };
        }
      }

      const response = await this.makeHttpRequest<T>(url, config);
      
      // Cache successful GET responses
      if (config.cache?.enabled && config.method !== 'POST' && response.status === 200) {
        this.setCachedResponse(requestKey, response.data, config.cache.ttl || 300000);
      }

      return response;
    };

    // Apply error recovery strategies
    if (config.circuitBreaker) {
      return (errorRecoveryService as any).executeWithCircuitBreaker(
        config.circuitBreaker,
        operation
      );
    }

    return (errorRecoveryService as any).executeWithRetry(operation, config.retry?.maxAttempts || 3);
  }

  /**
   * Make actual HTTP request
   */
  private async makeHttpRequest<T>(
    url: string,
    config: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const { data: session } = await supabaseEnhanced.auth.getSession();
      const token = session.session?.access_token;

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...config.headers,
      };

      const controller = new AbortController();
      const timeoutId = config.timeout ? setTimeout(() => {
        controller.abort();
      }, config.timeout) : null;

      const fetchOptions: RequestInit = {
        method: config.method || 'GET',
        headers,
        signal: controller.signal,
      };

      if (config.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, fetchOptions);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const responseData = response.status === 204 ? null : await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      return {
        data: responseData,
        error: null,
        status: response.status,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          data: null,
          error: 'Request timeout',
          status: 408,
        };
      }

      return {
        data: null,
        error: error.message || 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Get cached response if valid
   */
  private getCachedResponse<T>(key: string): CachedResponse<T> | null {
    const cached = this.requestCache.get(key);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - cached.timestamp > cached.ttl;

    if (isExpired) {
      this.requestCache.delete(key);
      return null;
    }

    return cached as CachedResponse<T>;
  }

  /**
   * Set cached response
   */
  private setCachedResponse<T>(key: string, data: T, ttl: number): void {
    const cachedResponse: CachedResponse<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      url: key,
    };

    this.requestCache.set(key, cachedResponse);
    this.persistCachedResponses();
  }

  /**
   * Generate unique request key for caching and deduplication
   */
  private generateRequestKey(url: string, config: ApiRequestConfig): string {
    const keyData = {
      url,
      method: config.method || 'GET',
      body: config.body,
      headers: config.headers,
    };

    // Create a simple hash of the request data
    const keyString = JSON.stringify(keyData);
    return btoa(keyString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // For Supabase functions, use the functions URL
    if (endpoint.startsWith('/functions/')) {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      return `${supabaseUrl}${endpoint}`;
    }

    // For REST API, use the REST URL
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/rest/v1${endpoint}`;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.requestCache.clear();
    AsyncStorage.removeItem('@tailtracker:api_cache');
  }

  /**
   * Clear expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.requestCache.forEach((cached, key) => {
      if (now - cached.timestamp > cached.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.requestCache.delete(key);
    });

    if (keysToDelete.length > 0) {
      this.persistCachedResponses();
    }
  }

  /**
   * Setup periodic cache cleanup
   */
  private setupCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Load cached responses from storage
   */
  private async loadCachedResponses(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem('@tailtracker:api_cache');
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        Object.entries(cached).forEach(([key, value]) => {
          this.requestCache.set(key, value as CachedResponse);
        });
        
        // Clean up expired entries after loading
        this.cleanupExpiredCache();
      }
    } catch (error) {
      console.warn('Failed to load cached API responses:', error);
    }
  }

  /**
   * Persist cached responses to storage
   */
  private async persistCachedResponses(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.requestCache);
      await AsyncStorage.setItem('@tailtracker:api_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to persist API cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number;
    totalSizeBytes: number;
    hitRate: number;
  } {
    const totalEntries = this.requestCache.size;
    const totalSizeBytes = JSON.stringify(Object.fromEntries(this.requestCache)).length;
    
    // This is a simplified hit rate calculation
    // In a real implementation, you'd track hits and misses
    const hitRate = totalEntries > 0 ? 0.75 : 0; // Placeholder

    return {
      totalEntries,
      totalSizeBytes,
      hitRate,
    };
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Convenience methods for common TailTracker operations
export const TailTrackerAPI = {
  // Pet operations
  pets: {
    getAll: () => apiClient.get('/pets'),
    getById: (id: string) => apiClient.get(`/pets/${id}`),
    create: (petData: any) => apiClient.post('/pets', petData),
    update: (id: string, petData: any) => apiClient.put(`/pets/${id}`, petData),
    delete: (id: string) => apiClient.delete(`/pets/${id}`),
  },

  // Vaccination operations
  vaccinations: {
    getByPetId: (petId: string) => apiClient.get(`/vaccinations?pet_id=eq.${petId}`),
    create: (vaccinationData: any) => apiClient.post('/vaccinations', vaccinationData),
    update: (id: string, vaccinationData: any) => apiClient.put(`/vaccinations/${id}`, vaccinationData),
    delete: (id: string) => apiClient.delete(`/vaccinations/${id}`),
  },

  // Lost pet operations
  lostPets: {
    report: (reportData: any) => apiClient.post('/functions/v1/lost-pet-alerts', {
      action: 'report_lost_pet',
      data: reportData,
    }, {
      circuitBreaker: 'lost_pet_reports',
      offlineQueue: { priority: 'critical' },
    }),
    
    markFound: (lostPetId: string, foundBy?: string) => apiClient.post('/functions/v1/lost-pet-alerts', {
      action: 'mark_found',
      data: { lost_pet_id: lostPetId, found_by: foundBy },
    }, {
      circuitBreaker: 'lost_pet_reports',
      offlineQueue: { priority: 'critical' },
    }),
    
    getNearby: (location: { lat: number; lng: number }, radiusKm: number = 25) => 
      apiClient.post('/functions/v1/lost-pet-alerts', {
        action: 'get_nearby_alerts',
        data: { user_location: location, radius_km: radiusKm },
      }, {
        cache: { enabled: true, ttl: 60000 }, // 1 minute cache
        deduplicate: true,
      }),
  },

  // User operations
  user: {
    getProfile: () => apiClient.get('/users', {
      cache: { enabled: true, ttl: 300000 }, // 5 minute cache
    }),
    updateProfile: (profileData: any) => apiClient.put('/users', profileData),
  },

  // Image upload
  images: {
    upload: (imageData: any, type: string, petId?: string) => apiClient.post('/functions/v1/file-upload', {
      imageData,
      type,
      petId,
    }, {
      timeout: 30000, // 30 second timeout for uploads
      offlineQueue: { priority: 'medium' },
    }),
  },
};