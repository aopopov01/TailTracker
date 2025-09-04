import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringPeriodMs: number;
}

export interface QueuedOperation {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  headers?: Record<string, string>;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  priority: 'high' | 'medium' | 'low';
  requiresNetwork: boolean;
}

export interface NetworkStatus {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private activeRequests = new Map<string, Promise<any>>();
  private networkStatus: NetworkStatus = {
    isConnected: false,
    type: 'unknown',
    isInternetReachable: null,
  };
  private operationQueue: QueuedOperation[] = [];
  private isProcessingQueue = false;
  private networkListeners: (() => void)[] = [];

  private readonly STORAGE_KEYS = {
    OPERATION_QUEUE: '@tailtracker:operation_queue',
    CIRCUIT_BREAKER_STATE: '@tailtracker:circuit_breaker_state',
    FAILED_OPERATIONS: '@tailtracker:failed_operations',
  };

  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryCondition: (error) => this.isRetryableError(error),
  };

  private readonly DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    monitoringPeriodMs: 300000,
  };

  private constructor() {
    this.initializeNetworkMonitoring();
    this.loadPersistedQueue();
  }

  public static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Execute operation with automatic retry logic and exponential backoff
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: any;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Reset circuit breaker on success if it exists
        const circuitBreaker = this.getCircuitBreakerForOperation(operation);
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }

        return result;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!retryConfig.retryCondition?.(error)) {
          throw error;
        }

        // Record failure in circuit breaker
        const circuitBreaker = this.getCircuitBreakerForOperation(operation);
        if (circuitBreaker) {
          circuitBreaker.recordFailure();
          
          // Check if circuit is open
          if (circuitBreaker.getState() === 'OPEN') {
            throw new Error('Circuit breaker is open. Service temporarily unavailable.');
          }
        }

        // Don't retry on last attempt
        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Call retry callback if provided
        retryConfig.onRetry?.(attempt, error);

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelayMs
        );
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await this.delay(jitteredDelay);
      }
    }

    throw lastError;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  public async executeWithCircuitBreaker<T>(
    operationKey: string,
    operation: () => Promise<T>,
    config: Partial<CircuitBreakerConfig> = {}
  ): Promise<T> {
    const circuitBreaker = this.getOrCreateCircuitBreaker(operationKey, config);

    if (circuitBreaker.getState() === 'OPEN') {
      throw new Error(`Circuit breaker is open for ${operationKey}. Service temporarily unavailable.`);
    }

    try {
      const result = await operation();
      circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      circuitBreaker.recordFailure();
      throw error;
    }
  }

  /**
   * Add operation to offline queue for later retry
   */
  public async queueOperation(
    operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'attempts'>
  ): Promise<string> {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
      attempts: 0,
    };

    this.operationQueue.push(queuedOp);
    this.sortQueueByPriority();
    
    await this.persistQueue();

    // Process queue if network is available
    if (this.networkStatus.isConnected) {
      this.processQueue();
    }

    return queuedOp.id;
  }

  /**
   * Remove operation from queue
   */
  public async removeFromQueue(operationId: string): Promise<void> {
    this.operationQueue = this.operationQueue.filter(op => op.id !== operationId);
    await this.persistQueue();
  }

  /**
   * Get current queue status
   */
  public getQueueStatus(): {
    totalOperations: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
    oldestOperation?: Date;
  } {
    const totalOperations = this.operationQueue.length;
    const highPriorityCount = this.operationQueue.filter(op => op.priority === 'high').length;
    const mediumPriorityCount = this.operationQueue.filter(op => op.priority === 'medium').length;
    const lowPriorityCount = this.operationQueue.filter(op => op.priority === 'low').length;
    
    const oldestTimestamp = Math.min(...this.operationQueue.map(op => op.timestamp));
    const oldestOperation = totalOperations > 0 ? new Date(oldestTimestamp) : undefined;

    return {
      totalOperations,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
      oldestOperation,
    };
  }

  /**
   * Deduplicate requests by creating a unique key and reusing promises
   */
  public async deduplicateRequest<T>(
    requestKey: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in progress
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey) as Promise<T>;
    }

    // Create new request
    const requestPromise = operation().finally(() => {
      // Remove from active requests when done
      this.activeRequests.delete(requestKey);
    });

    // Store active request
    this.activeRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Check if operation should be retried based on error
   */
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return true;
    }

    // Timeout errors
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return true;
    }

    // Server errors (5xx)
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Rate limiting (429)
    if (error.status === 429) {
      return true;
    }

    // Specific Supabase errors
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('fetch')) {
      return true;
    }

    // Connection refused
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return true;
    }

    return false;
  }

  /**
   * Initialize network status monitoring
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      this.networkStatus = {
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      };

      // Process queue when connection is restored
      if (this.networkStatus.isConnected && this.operationQueue.length > 0) {
        this.processQueue();
      }

      // Notify listeners
      this.networkListeners.forEach(listener => listener());
    });
  }

  /**
   * Process queued operations when network is available
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.networkStatus.isConnected) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process high priority operations first
      const sortedQueue = [...this.operationQueue].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const operation of sortedQueue) {
        if (!this.networkStatus.isConnected) {
          break; // Stop if network is lost during processing
        }

        try {
          await this.executeQueuedOperation(operation);
          await this.removeFromQueue(operation.id);
        } catch (error) {
          console.warn('Failed to execute queued operation:', operation.id, error);
          
          // Remove if max attempts reached
          if (operation.attempts >= operation.maxAttempts) {
            await this.removeFromQueue(operation.id);
            await this.logFailedOperation(operation, error);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeQueuedOperation(operation: QueuedOperation): Promise<any> {
    operation.attempts++;

    const response = await fetch(operation.endpoint, {
      method: operation.method,
      headers: {
        'Content-Type': 'application/json',
        ...operation.headers,
      },
      body: operation.data ? JSON.stringify(operation.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get or create circuit breaker for operation
   */
  private getOrCreateCircuitBreaker(
    key: string,
    config: Partial<CircuitBreakerConfig> = {}
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      const breakerConfig = { ...this.DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
      this.circuitBreakers.set(key, new CircuitBreaker(breakerConfig));
    }
    return this.circuitBreakers.get(key)!;
  }

  /**
   * Get circuit breaker for operation (if exists)
   */
  private getCircuitBreakerForOperation(operation: Function): CircuitBreaker | null {
    // This is a simplified approach - in practice, you might want to
    // identify operations by their endpoint or other characteristics
    const operationKey = operation.name || 'anonymous';
    return this.circuitBreakers.get(operationKey) || null;
  }

  /**
   * Persist operation queue to storage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OPERATION_QUEUE,
        JSON.stringify(this.operationQueue)
      );
    } catch (error) {
      console.error('Failed to persist operation queue:', error);
    }
  }

  /**
   * Load persisted operation queue
   */
  private async loadPersistedQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEYS.OPERATION_QUEUE);
      if (queueData) {
        this.operationQueue = JSON.parse(queueData);
        this.sortQueueByPriority();
      }
    } catch (error) {
      console.error('Failed to load persisted queue:', error);
    }
  }

  /**
   * Sort queue by priority and timestamp
   */
  private sortQueueByPriority(): void {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    this.operationQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log failed operation for debugging
   */
  private async logFailedOperation(operation: QueuedOperation, error: any): Promise<void> {
    try {
      const failedOps = await AsyncStorage.getItem(this.STORAGE_KEYS.FAILED_OPERATIONS);
      const failed = failedOps ? JSON.parse(failedOps) : [];
      
      failed.push({
        ...operation,
        error: error.message || 'Unknown error',
        failedAt: Date.now(),
      });

      // Keep only last 100 failed operations
      if (failed.length > 100) {
        failed.splice(0, failed.length - 100);
      }

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.FAILED_OPERATIONS,
        JSON.stringify(failed)
      );
    } catch (storageError) {
      console.error('Failed to log failed operation:', storageError);
    }
  }

  /**
   * Add network status listener
   */
  public addNetworkStatusListener(listener: () => void): () => void {
    this.networkListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.networkListeners.indexOf(listener);
      if (index > -1) {
        this.networkListeners.splice(index, 1);
      }
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;

  constructor(private config: CircuitBreakerConfig) {}

  recordSuccess(): void {
    this.successCount++;
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.resetTimeoutMs;
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    if (this.state === 'OPEN' && this.nextAttemptTime && Date.now() >= this.nextAttemptTime) {
      this.state = 'HALF_OPEN';
      this.failureCount = 0;
    }

    return this.state;
  }

  getStats(): {
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime?: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Export singleton instance
export const errorRecoveryService = ErrorRecoveryService.getInstance();