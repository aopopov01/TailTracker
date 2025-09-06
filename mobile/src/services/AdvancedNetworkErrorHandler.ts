import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { errorMonitoring } from './ErrorMonitoringService';
import { errorRecoveryService } from './ErrorRecoveryService';
import { offlineQueueManager } from './OfflineQueueManager';

export interface NetworkErrorConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitterEnabled: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  rateLimitHandling: boolean;
  timeoutSettings: {
    connection: number;
    request: number;
    response: number;
  };
}

export interface EndpointHealth {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  consecutiveFailures: number;
  lastSuccess?: number;
  lastFailure?: number;
  averageResponseTime: number;
  errorRate: number;
  circuitBreakerOpen: boolean;
  rateLimited: boolean;
  rateLimitReset?: number;
}

export interface NetworkRetryOptions {
  maxAttempts?: number;
  customBackoff?: (attempt: number) => number;
  retryCondition?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
  abortSignal?: AbortSignal;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  attempt: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  abortController?: AbortController;
  metadata?: any;
}

export class AdvancedNetworkErrorHandler {
  private static instance: AdvancedNetworkErrorHandler;
  private endpointHealth = new Map<string, EndpointHealth>();
  private activeRequests = new Map<string, NetworkRequest>();
  private networkState: NetInfoState | null = null;
  private connectionHistory: { timestamp: number; connected: boolean; type: string }[] = [];
  private requestQueue: NetworkRequest[] = [];
  private isProcessingQueue = false;

  private readonly config: NetworkErrorConfig = {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 32000,
    backoffFactor: 2,
    jitterEnabled: true,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 60000,
    rateLimitHandling: true,
    timeoutSettings: {
      connection: 10000,
      request: 30000,
      response: 30000,
    },
  };

  private readonly STORAGE_KEYS = {
    ENDPOINT_HEALTH: '@tailtracker:endpoint_health',
    CONNECTION_HISTORY: '@tailtracker:connection_history',
    NETWORK_PREFERENCES: '@tailtracker:network_preferences',
  };

  private constructor() {
    this.initializeNetworkMonitoring();
    this.loadPersistedData();
  }

  public static getInstance(): AdvancedNetworkErrorHandler {
    if (!AdvancedNetworkErrorHandler.instance) {
      AdvancedNetworkErrorHandler.instance = new AdvancedNetworkErrorHandler();
    }
    return AdvancedNetworkErrorHandler.instance;
  }

  /**
   * Execute HTTP request with advanced error handling
   */
  public async executeRequest<T>(
    url: string,
    options: RequestInit & NetworkRetryOptions = {}
  ): Promise<T> {
    const requestId = this.generateRequestId();
    const priority = options.priority || 'medium';
    
    // Check circuit breaker
    const endpointKey = this.getEndpointKey(url);
    if (this.isCircuitBreakerOpen(endpointKey)) {
      throw new Error(`Circuit breaker open for ${endpointKey}. Service temporarily unavailable.`);
    }

    // Check network connectivity
    if (!this.isNetworkAvailable()) {
      return this.handleOfflineRequest(url, options);
    }

    // Check rate limiting
    if (this.isRateLimited(endpointKey)) {
      await this.waitForRateLimit(endpointKey);
    }

    const request: NetworkRequest = {
      id: requestId,
      url,
      method: options.method || 'GET',
      headers: (options.headers as Record<string, string>) || {},
      body: options.body,
      timestamp: Date.now(),
      attempt: 0,
      priority,
      abortController: new AbortController(),
      metadata: options.metadata,
    };

    this.activeRequests.set(requestId, request);

    try {
      return await this.executeWithAdvancedRetry(request, options);
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Execute request with advanced retry logic
   */
  private async executeWithAdvancedRetry<T>(
    request: NetworkRequest,
    options: NetworkRetryOptions
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || this.config.maxRetries;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      request.attempt = attempt;
      
      try {
        const response = await this.performRequest(request, options);
        
        // Update endpoint health on success
        this.recordEndpointSuccess(this.getEndpointKey(request.url), Date.now() - request.timestamp);
        
        return response;
      } catch (error: any) {
        lastError = error;
        
        // Record endpoint failure
        this.recordEndpointFailure(this.getEndpointKey(request.url), error);
        
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error, attempt, options);
        if (!isRetryable || attempt === maxAttempts) {
          break;
        }

        // Handle specific error types
        await this.handleSpecificError(error, request);

        // Call retry callback
        options.onRetry?.(error, attempt);

        // Calculate delay with backoff and jitter
        const delay = this.calculateRetryDelay(attempt, options);
        
        await errorMonitoring.addBreadcrumb({
          category: 'api',
          message: `Retrying request to ${request.url} (attempt ${attempt}/${maxAttempts})`,
          level: 'warning',
          data: { requestId: request.id, delay, error: error.message },
        });

        await this.delay(delay);
        
        // Check if request was aborted during delay
        if (options.abortSignal?.aborted || request.abortController?.signal.aborted) {
          throw new Error('Request aborted');
        }
      }
    }

    throw lastError!;
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest<T>(
    request: NetworkRequest,
    options: NetworkRetryOptions
  ): Promise<T> {
    const timeoutId = setTimeout(() => {
      request.abortController?.abort();
    }, this.config.timeoutSettings.request);

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: request.abortController?.signal,
      };

      const response = await fetch(request.url, fetchOptions);
      
      clearTimeout(timeoutId);

      // Handle HTTP error status codes
      if (!response.ok) {
        await this.handleHttpError(response, request);
      }

      // Handle rate limiting headers
      this.processRateLimitHeaders(response.headers, this.getEndpointKey(request.url));

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as T;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Enhance error with context
      error.requestId = request.id;
      error.url = request.url;
      error.method = request.method;
      error.attempt = request.attempt;
      
      throw error;
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleHttpError(response: Response, request: NetworkRequest): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorBody: any;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorBody = await response.json();
        errorMessage = errorBody.message || errorBody.error || errorMessage;
      }
    } catch {
      // Ignore parsing errors
    }

    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.statusText = response.statusText;
    error.headers = Object.fromEntries(response.headers.entries());
    error.body = errorBody;
    error.url = request.url;
    error.method = request.method;

    throw error;
  }

  /**
   * Handle specific error types
   */
  private async handleSpecificError(error: any, request: NetworkRequest): Promise<void> {
    const endpointKey = this.getEndpointKey(request.url);

    // Rate limiting
    if (error.status === 429) {
      const resetTime = this.extractRateLimitReset(error.headers);
      this.setRateLimit(endpointKey, resetTime);
    }

    // Server errors
    if (error.status >= 500) {
      this.incrementCircuitBreakerFailures(endpointKey);
    }

    // Authentication errors
    if (error.status === 401) {
      await this.handleAuthenticationError(error, request);
    }

    // Network connectivity issues
    if (this.isNetworkConnectivityError(error)) {
      await this.handleConnectivityError(error, request);
    }
  }

  /**
   * Handle offline requests
   */
  private async handleOfflineRequest<T>(url: string, options: RequestInit): Promise<T> {
    // Queue request for later processing
    const queuedOperation = {
      endpoint: url,
      method: options.method || 'GET',
      data: options.body,
      headers: options.headers as Record<string, string>,
      maxAttempts: 3,
      priority: 'medium' as const,
      requiresNetwork: true,
    };

    await offlineQueueManager.enqueueAction('HTTP_REQUEST', queuedOperation, {
      priority: 'medium',
      requiresAuthentication: false,
    });

    throw new Error('Request queued for offline processing');
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any, attempt: number, options: NetworkRetryOptions): boolean {
    // Custom retry condition
    if (options.retryCondition) {
      return options.retryCondition(error, attempt);
    }

    // Network errors
    if (this.isNetworkConnectivityError(error)) {
      return true;
    }

    // Timeout errors
    if (error.name === 'AbortError' && error.message.includes('timeout')) {
      return true;
    }

    // Server errors (5xx)
    if (error.status >= 500) {
      return true;
    }

    // Rate limiting
    if (error.status === 429) {
      return true;
    }

    // Too Many Requests with Retry-After header
    if (error.status === 429 && error.headers?.['retry-after']) {
      return true;
    }

    return false;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, options: NetworkRetryOptions): number {
    if (options.customBackoff) {
      return options.customBackoff(attempt);
    }

    let delay = this.config.initialDelay * Math.pow(this.config.backoffFactor, attempt - 1);
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.config.jitterEnabled) {
      const jitter = Math.random() * 0.3 * delay; // 30% jitter
      delay += jitter;
    }

    return delay;
  }

  /**
   * Endpoint health management
   */
  private recordEndpointSuccess(endpointKey: string, responseTime: number): void {
    const health = this.getEndpointHealth(endpointKey);
    health.status = 'healthy';
    health.consecutiveFailures = 0;
    health.lastSuccess = Date.now();
    health.averageResponseTime = this.updateAverage(health.averageResponseTime, responseTime);
    health.circuitBreakerOpen = false;
    
    this.updateEndpointHealth(endpointKey, health);
  }

  private recordEndpointFailure(endpointKey: string, error: any): void {
    const health = this.getEndpointHealth(endpointKey);
    health.consecutiveFailures++;
    health.lastFailure = Date.now();
    
    // Update status based on failure count
    if (health.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      health.status = 'unhealthy';
      health.circuitBreakerOpen = true;
    } else if (health.consecutiveFailures >= Math.floor(this.config.circuitBreakerThreshold / 2)) {
      health.status = 'degraded';
    }

    this.updateEndpointHealth(endpointKey, health);
  }

  private getEndpointHealth(endpointKey: string): EndpointHealth {
    if (!this.endpointHealth.has(endpointKey)) {
      this.endpointHealth.set(endpointKey, {
        endpoint: endpointKey,
        status: 'healthy',
        consecutiveFailures: 0,
        averageResponseTime: 0,
        errorRate: 0,
        circuitBreakerOpen: false,
        rateLimited: false,
      });
    }
    return this.endpointHealth.get(endpointKey)!;
  }

  private updateEndpointHealth(endpointKey: string, health: EndpointHealth): void {
    this.endpointHealth.set(endpointKey, health);
    this.persistEndpointHealth();
  }

  /**
   * Circuit breaker functionality
   */
  private isCircuitBreakerOpen(endpointKey: string): boolean {
    const health = this.getEndpointHealth(endpointKey);
    
    if (!health.circuitBreakerOpen) {
      return false;
    }

    // Check if timeout has passed
    if (health.lastFailure && Date.now() - health.lastFailure > this.config.circuitBreakerTimeout) {
      health.circuitBreakerOpen = false;
      health.status = 'degraded';
      this.updateEndpointHealth(endpointKey, health);
      return false;
    }

    return true;
  }

  private incrementCircuitBreakerFailures(endpointKey: string): void {
    const health = this.getEndpointHealth(endpointKey);
    health.consecutiveFailures++;
    
    if (health.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      health.circuitBreakerOpen = true;
      health.status = 'unhealthy';
      
      errorMonitoring.addBreadcrumb({
        category: 'api',
        message: `Circuit breaker opened for ${endpointKey}`,
        level: 'error',
        data: { 
          endpointKey, 
          consecutiveFailures: health.consecutiveFailures,
          threshold: this.config.circuitBreakerThreshold,
        },
      });
    }
    
    this.updateEndpointHealth(endpointKey, health);
  }

  /**
   * Rate limiting functionality
   */
  private isRateLimited(endpointKey: string): boolean {
    const health = this.getEndpointHealth(endpointKey);
    
    if (!health.rateLimited || !health.rateLimitReset) {
      return false;
    }

    if (Date.now() >= health.rateLimitReset) {
      health.rateLimited = false;
      health.rateLimitReset = undefined;
      this.updateEndpointHealth(endpointKey, health);
      return false;
    }

    return true;
  }

  private setRateLimit(endpointKey: string, resetTime: number): void {
    const health = this.getEndpointHealth(endpointKey);
    health.rateLimited = true;
    health.rateLimitReset = resetTime;
    this.updateEndpointHealth(endpointKey, health);
  }

  private async waitForRateLimit(endpointKey: string): Promise<void> {
    const health = this.getEndpointHealth(endpointKey);
    
    if (health.rateLimitReset) {
      const waitTime = health.rateLimitReset - Date.now();
      if (waitTime > 0) {
        await errorMonitoring.addBreadcrumb({
          category: 'api',
          message: `Waiting for rate limit reset: ${endpointKey}`,
          level: 'info',
          data: { endpointKey, waitTime },
        });
        
        await this.delay(Math.min(waitTime, 60000)); // Max 1 minute wait
      }
    }
  }

  private processRateLimitHeaders(headers: Headers, endpointKey: string): void {
    const remaining = headers.get('x-ratelimit-remaining') || headers.get('x-rate-limit-remaining');
    const reset = headers.get('x-ratelimit-reset') || headers.get('x-rate-limit-reset');

    if (remaining === '0' && reset) {
      const resetTime = parseInt(reset) * 1000; // Convert to milliseconds
      this.setRateLimit(endpointKey, resetTime);
    }
  }

  private extractRateLimitReset(headers: Record<string, string>): number {
    const retryAfter = headers['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter);
      return Date.now() + (seconds * 1000);
    }

    const reset = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'];
    if (reset) {
      return parseInt(reset) * 1000;
    }

    return Date.now() + 60000; // Default to 1 minute
  }

  /**
   * Network connectivity handling
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      this.networkState = state;
      this.connectionHistory.push({
        timestamp: Date.now(),
        connected: state.isConnected ?? false,
        type: state.type,
      });

      // Limit history size
      if (this.connectionHistory.length > 100) {
        this.connectionHistory = this.connectionHistory.slice(-100);
      }

      // Process queue when connection is restored
      if (state.isConnected && !this.isProcessingQueue) {
        this.processRequestQueue();
      }

      this.persistConnectionHistory();
    });
  }

  private isNetworkAvailable(): boolean {
    return this.networkState?.isConnected ?? false;
  }

  private isNetworkConnectivityError(error: any): boolean {
    const connectivityPatterns = [
      /network error/i,
      /connection failed/i,
      /no internet/i,
      /offline/i,
      /econnrefused/i,
      /enotfound/i,
      /etimedout/i,
    ];

    return connectivityPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private async handleConnectivityError(error: any, request: NetworkRequest): Promise<void> {
    // Queue request for retry when network is restored
    this.requestQueue.push(request);
    this.sortQueueByPriority();
  }

  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0 && this.isNetworkAvailable()) {
        const request = this.requestQueue.shift()!;
        
        try {
          await this.performRequest(request, {});
        } catch (error) {
          console.warn('Failed to process queued request:', error);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private sortQueueByPriority(): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    this.requestQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });
  }

  /**
   * Authentication error handling
   */
  private async handleAuthenticationError(error: any, request: NetworkRequest): Promise<void> {
    // This would trigger re-authentication flow
    errorMonitoring.addBreadcrumb({
      category: 'api',
      message: 'Authentication error detected',
      level: 'error',
      data: { requestId: request.id, url: request.url },
    });
  }

  /**
   * Utility methods
   */
  private getEndpointKey(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateAverage(current: number, newValue: number, weight: number = 0.2): number {
    return current === 0 ? newValue : (current * (1 - weight)) + (newValue * weight);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Persistence methods
   */
  private async persistEndpointHealth(): Promise<void> {
    try {
      const healthData = Array.from(this.endpointHealth.entries());
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.ENDPOINT_HEALTH,
        JSON.stringify(healthData)
      );
    } catch (error) {
      console.warn('Failed to persist endpoint health:', error);
    }
  }

  private async persistConnectionHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CONNECTION_HISTORY,
        JSON.stringify(this.connectionHistory.slice(-50)) // Keep last 50 entries
      );
    } catch (error) {
      console.warn('Failed to persist connection history:', error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const [healthData, historyData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.ENDPOINT_HEALTH),
        AsyncStorage.getItem(this.STORAGE_KEYS.CONNECTION_HISTORY),
      ]);

      if (healthData) {
        const healthEntries = JSON.parse(healthData);
        this.endpointHealth = new Map(healthEntries);
      }

      if (historyData) {
        this.connectionHistory = JSON.parse(historyData);
      }
    } catch (error) {
      console.warn('Failed to load persisted network data:', error);
    }
  }

  /**
   * Public API methods
   */
  public getEndpointHealthStatus(): Map<string, EndpointHealth> {
    return new Map(this.endpointHealth);
  }

  public getNetworkStatistics(): {
    currentState: NetInfoState | null;
    connectionHistory: typeof this.connectionHistory;
    activeRequests: number;
    queuedRequests: number;
    endpointHealth: Record<string, EndpointHealth>;
  } {
    return {
      currentState: this.networkState,
      connectionHistory: [...this.connectionHistory],
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      endpointHealth: Object.fromEntries(this.endpointHealth),
    };
  }

  public async resetEndpointHealth(endpointKey?: string): Promise<void> {
    if (endpointKey) {
      this.endpointHealth.delete(endpointKey);
    } else {
      this.endpointHealth.clear();
    }
    await this.persistEndpointHealth();
  }

  public updateConfig(updates: Partial<NetworkErrorConfig>): void {
    Object.assign(this.config, updates);
  }
}

// Export singleton
export const advancedNetworkErrorHandler = AdvancedNetworkErrorHandler.getInstance();