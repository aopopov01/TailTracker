import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  priority: 'low' | 'normal' | 'high';
  size: number;
}

interface NetworkConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheTimeout: number;
  maxCacheSize: number; // MB
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  cache?: boolean;
  cacheTTL?: number;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retries?: number;
}

interface BatchRequest {
  id: string;
  url: string;
  options: RequestOptions;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

class PerformanceNetworkService {
  private static instance: PerformanceNetworkService;
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, Promise<any>>();
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private networkState: NetInfoState | null = null;
  private offlineQueue: { url: string; options: RequestOptions }[] = [];
  private currentCacheSize = 0;
  
  private readonly config: NetworkConfig = {
    baseURL: '',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 25, // 25MB
  };

  private constructor() {
    this.initializeNetworkMonitoring();
    this.loadCacheFromStorage();
  }

  static getInstance(): PerformanceNetworkService {
    if (!PerformanceNetworkService.instance) {
      PerformanceNetworkService.instance = new PerformanceNetworkService();
    }
    return PerformanceNetworkService.instance;
  }

  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = this.networkState?.isConnected === false;
      this.networkState = state;
      
      // Process offline queue when coming back online
      if (wasOffline && state.isConnected) {
        this.processOfflineQueue();
      }
    });
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('@network_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        // Restore cache with validation
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (this.isCacheEntryValid(value)) {
            this.cache.set(key, value);
            this.currentCacheSize += value.size || 0;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('@network_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private isCacheEntryValid<T>(entry: CacheEntry<T>): boolean {
    return entry.timestamp + entry.ttl > Date.now();
  }

  private getCacheKey(url: string, options: RequestOptions): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private estimateResponseSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size / (1024 * 1024); // Convert to MB
    } catch {
      return 0.1; // Default estimate
    }
  }

  private cleanupCache(): void {
    if (this.currentCacheSize <= this.config.maxCacheSize) return;

    // Sort by priority (low first) and timestamp (oldest first)
    const sortedEntries = Array.from(this.cache.entries()).sort((a, b) => {
      const priorityOrder = { low: 1, normal: 2, high: 3 };
      const aPriority = priorityOrder[a[1].priority];
      const bPriority = priorityOrder[b[1].priority];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      return a[1].timestamp - b[1].timestamp;
    });

    // Remove entries until we're under the limit
    let removedSize = 0;
    const targetRemoval = this.currentCacheSize - this.config.maxCacheSize * 0.8; // 80% of max
    
    for (const [key, entry] of sortedEntries) {
      if (removedSize >= targetRemoval) break;
      
      this.cache.delete(key);
      removedSize += entry.size;
      this.currentCacheSize -= entry.size;
    }

    // Save updated cache
    this.saveCacheToStorage();
  }

  private async processOfflineQueue(): Promise<void> {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        await this.request(item.url, item.options);
      } catch (error) {
        // Re-queue failed requests
        this.offlineQueue.push(item);
      }
    }
  }

  private async executeBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    // Group requests by domain and execute in parallel batches
    const domainGroups = new Map<string, BatchRequest[]>();
    
    batch.forEach((request) => {
      try {
        const domain = new URL(request.url).hostname;
        if (!domainGroups.has(domain)) {
          domainGroups.set(domain, []);
        }
        domainGroups.get(domain)!.push(request);
      } catch {
        // Invalid URL, execute individually
        this.executeRequest(request.url, request.options)
          .then(request.resolve)
          .catch(request.reject);
      }
    });

    // Execute domain batches
    Array.from(domainGroups.values()).forEach((requests) => {
      this.executeBatchForDomain(requests);
    });
  }

  private async executeBatchForDomain(requests: BatchRequest[]): Promise<void> {
    // Limit concurrent requests per domain
    const maxConcurrent = 4;
    const chunks = [];
    
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      chunks.push(requests.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(async (request) => {
          try {
            const result = await this.executeRequest(request.url, request.options);
            request.resolve(result);
          } catch (error) {
            request.reject(error);
          }
        })
      );
    }
  }

  private async executeRequest(url: string, options: RequestOptions = {}): Promise<any> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.timeout,
      retries = this.config.retryAttempts,
    } = options;

    // Check if offline and queue request
    if (this.networkState?.isConnected === false) {
      this.offlineQueue.push({ url, options });
      throw new Error('Network unavailable - request queued');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Retry logic
      if (retries > 0 && !controller.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
        return this.executeRequest(url, { ...options, retries: retries - 1 });
      }

      throw error;
    }
  }

  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const cacheKey = this.getCacheKey(url, options);
    const shouldCache = options.cache !== false && (options.method || 'GET') === 'GET';

    // Check cache first
    if (shouldCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheEntryValid(cached)) {
        return cached.data;
      }
    }

    // Check for duplicate requests
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Create request promise
    const requestPromise = this.executeRequest(url, options);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;

      // Cache successful GET requests
      if (shouldCache && data) {
        const size = this.estimateResponseSize(data);
        const ttl = options.cacheTTL || this.config.cacheTimeout;
        const priority = options.priority || 'normal';

        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl,
          priority,
          size,
        });

        this.currentCacheSize += size;
        this.cleanupCache();
      }

      return data;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  batchRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: `${Date.now()}-${Math.random()}`,
        url,
        options,
        resolve,
        reject,
      };

      this.batchQueue.push(batchRequest);

      // Start batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      this.batchTimer = setTimeout(() => {
        this.executeBatch();
        this.batchTimer = null;
      }, 50); // 50ms batch window
    });
  }

  // Preload requests for predictive caching
  async preloadRequests(urls: string[], options: RequestOptions = {}): Promise<void> {
    const preloadOptions = {
      ...options,
      priority: 'low' as const,
      cache: true,
    };

    // Stagger preload requests to avoid overwhelming the network
    for (let i = 0; i < urls.length; i++) {
      setTimeout(() => {
        this.request(urls[i], preloadOptions).catch(() => {
          // Ignore preload failures
        });
      }, i * 100);
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
    AsyncStorage.removeItem('@network_cache');
  }

  getCacheStats(): { size: number; entries: number; hitRate: number } {
    return {
      size: this.currentCacheSize,
      entries: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for actual calculation
    };
  }

  getNetworkState(): NetInfoState | null {
    return this.networkState;
  }

  isOnline(): boolean {
    return this.networkState?.isConnected === true;
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }
}

export const performanceNetworkService = PerformanceNetworkService.getInstance();
export { PerformanceNetworkService };