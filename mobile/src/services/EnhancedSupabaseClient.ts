import { createClient, SupabaseClient, PostgrestError, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { errorRecoveryService, RetryConfig } from './ErrorRecoveryService';
import { offlineQueueManager } from './OfflineQueueManager';

export interface EnhancedQueryOptions {
  retry?: Partial<RetryConfig>;
  circuitBreaker?: string;
  offlineQueue?: {
    priority?: 'critical' | 'high' | 'medium' | 'low';
    requiresAuth?: boolean;
  };
  deduplicate?: boolean;
  timeout?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isSupabaseReachable: boolean;
  lastSuccessfulRequest: number | null;
  consecutiveFailures: number;
}

export class EnhancedSupabaseClient {
  private client: SupabaseClient;
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    isSupabaseReachable: false,
    lastSuccessfulRequest: null,
    consecutiveFailures: 0,
  };
  
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private authListeners: ((event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED', session: any) => void)[] = [];

  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'tailtracker-mobile-enhanced',
        },
      },
    });

    this.initializeNetworkMonitoring();
    this.initializeAuthStateChanges();
    this.startHealthCheck();
  }

  /**
   * Enhanced select with error recovery
   */
  public async select<T = any>(
    tableName: string,
    query?: string,
    options: EnhancedQueryOptions = {}
  ): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    const operationKey = options.circuitBreaker || `select_${tableName}`;
    
    const operation = async () => {
      let queryBuilder = this.client.from(tableName).select(query || '*');
      
      if (options.timeout) {
        queryBuilder = queryBuilder.abortSignal(AbortSignal.timeout(options.timeout));
      }

      const result = await queryBuilder;
      
      if (result.error) {
        throw result.error;
      }

      this.recordSuccessfulRequest();
      return result;
    };

    if (options.deduplicate) {
      const requestKey = `${operationKey}_${query}_${JSON.stringify(options)}`;
      return errorRecoveryService.deduplicateRequest(requestKey, operation);
    }

    if (options.circuitBreaker) {
      return errorRecoveryService.executeWithCircuitBreaker(operationKey, operation);
    }

    if (options.retry) {
      return errorRecoveryService.executeWithRetry(operation, options.retry);
    }

    try {
      return await operation();
    } catch (error) {
      this.recordFailedRequest(error);
      
      // Queue for offline retry if network is down
      if (options.offlineQueue && !this.connectionStatus.isConnected) {
        await offlineQueueManager.enqueueAction(
          'SUPABASE_SELECT',
          { tableName, query, options },
          {
            priority: options.offlineQueue.priority,
            requiresAuthentication: options.offlineQueue.requiresAuth,
          }
        );
      }
      
      throw error;
    }
  }

  /**
   * Enhanced insert with error recovery
   */
  public async insert<T = any>(
    tableName: string,
    data: any,
    options: EnhancedQueryOptions = {}
  ): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    const operationKey = options.circuitBreaker || `insert_${tableName}`;
    
    const operation = async () => {
      let queryBuilder = this.client.from(tableName).insert(data);
      
      if (options.timeout) {
        queryBuilder = queryBuilder.abortSignal(AbortSignal.timeout(options.timeout));
      }

      const result = await queryBuilder;
      
      if (result.error) {
        throw result.error;
      }

      this.recordSuccessfulRequest();
      return result;
    };

    try {
      if (options.circuitBreaker) {
        return await errorRecoveryService.executeWithCircuitBreaker(operationKey, operation);
      }

      if (options.retry) {
        return await errorRecoveryService.executeWithRetry(operation, options.retry);
      }

      return await operation();
    } catch (error) {
      this.recordFailedRequest(error);
      
      // Queue for offline retry
      if (options.offlineQueue && !this.connectionStatus.isConnected) {
        await offlineQueueManager.enqueueAction(
          'SUPABASE_INSERT',
          { tableName, data, options },
          {
            priority: options.offlineQueue.priority || 'high',
            requiresAuthentication: options.offlineQueue.requiresAuth,
          }
        );
        
        // Return optimistic result for offline case
        return { data: Array.isArray(data) ? data : [data], error: null };
      }
      
      throw error;
    }
  }

  /**
   * Enhanced update with error recovery
   */
  public async update<T = any>(
    tableName: string,
    data: any,
    filter: any,
    options: EnhancedQueryOptions = {}
  ): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    const operationKey = options.circuitBreaker || `update_${tableName}`;
    
    const operation = async () => {
      let queryBuilder = this.client.from(tableName).update(data);
      
      // Apply filters
      Object.entries(filter).forEach(([column, value]) => {
        queryBuilder = queryBuilder.eq(column, value);
      });
      
      if (options.timeout) {
        queryBuilder = queryBuilder.abortSignal(AbortSignal.timeout(options.timeout));
      }

      const result = await queryBuilder;
      
      if (result.error) {
        throw result.error;
      }

      this.recordSuccessfulRequest();
      return result;
    };

    try {
      if (options.circuitBreaker) {
        return await errorRecoveryService.executeWithCircuitBreaker(operationKey, operation);
      }

      if (options.retry) {
        return await errorRecoveryService.executeWithRetry(operation, options.retry);
      }

      return await operation();
    } catch (error) {
      this.recordFailedRequest(error);
      
      // Queue for offline retry
      if (options.offlineQueue && !this.connectionStatus.isConnected) {
        await offlineQueueManager.enqueueAction(
          'SUPABASE_UPDATE',
          { tableName, data, filter, options },
          {
            priority: options.offlineQueue.priority || 'high',
            requiresAuthentication: options.offlineQueue.requiresAuth,
          }
        );
      }
      
      throw error;
    }
  }

  /**
   * Enhanced delete with error recovery
   */
  public async delete<T = any>(
    tableName: string,
    filter: any,
    options: EnhancedQueryOptions = {}
  ): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    const operationKey = options.circuitBreaker || `delete_${tableName}`;
    
    const operation = async () => {
      let queryBuilder = this.client.from(tableName).delete();
      
      // Apply filters
      Object.entries(filter).forEach(([column, value]) => {
        queryBuilder = queryBuilder.eq(column, value);
      });
      
      if (options.timeout) {
        queryBuilder = queryBuilder.abortSignal(AbortSignal.timeout(options.timeout));
      }

      const result = await queryBuilder;
      
      if (result.error) {
        throw result.error;
      }

      this.recordSuccessfulRequest();
      return result;
    };

    try {
      if (options.circuitBreaker) {
        return await errorRecoveryService.executeWithCircuitBreaker(operationKey, operation);
      }

      if (options.retry) {
        return await errorRecoveryService.executeWithRetry(operation, options.retry);
      }

      return await operation();
    } catch (error) {
      this.recordFailedRequest(error);
      
      // Queue for offline retry
      if (options.offlineQueue && !this.connectionStatus.isConnected) {
        await offlineQueueManager.enqueueAction(
          'SUPABASE_DELETE',
          { tableName, filter, options },
          {
            priority: options.offlineQueue.priority || 'medium',
            requiresAuthentication: options.offlineQueue.requiresAuth,
          }
        );
      }
      
      throw error;
    }
  }

  /**
   * Enhanced authentication with retry
   */
  public async signInWithPassword(
    credentials: { email: string; password: string },
    options: EnhancedQueryOptions = {}
  ) {
    const operation = async () => {
      const result = await this.client.auth.signInWithPassword(credentials);
      
      if (result.error) {
        throw result.error;
      }

      this.recordSuccessfulRequest();
      return result;
    };

    return this.executeAuthOperation('signIn', operation, options);
  }

  /**
   * Enhanced sign up with retry
   */
  public async signUp(
    credentials: { email: string; password: string; options?: any },
    options: EnhancedQueryOptions = {}
  ) {
    const operation = async () => {
      const result = await this.client.auth.signUp(credentials);
      
      if (result.error) {
        throw result.error;
      }

      this.recordSuccessfulRequest();
      return result;
    };

    return this.executeAuthOperation('signUp', operation, options);
  }

  /**
   * Enhanced sign out with retry
   */
  public async signOut(options: EnhancedQueryOptions = {}) {
    const operation = async () => {
      const result = await this.client.auth.signOut();
      
      if (result.error) {
        throw result.error;
      }

      this.recordSuccessfulRequest();
      return result;
    };

    return this.executeAuthOperation('signOut', operation, options);
  }

  /**
   * Enhanced session refresh with retry
   */
  public async refreshSession(options: EnhancedQueryOptions = {}) {
    const operation = async () => {
      const result = await this.client.auth.refreshSession();
      
      if (result.error) {
        throw result.error;
      }

      this.recordSuccessfulRequest();
      return result;
    };

    return this.executeAuthOperation('refreshSession', operation, options);
  }

  /**
   * Get current session with fallback to cached session
   */
  public async getSession() {
    try {
      const result = await this.client.auth.getSession();
      
      if (result.data.session) {
        this.recordSuccessfulRequest();
        // Cache session locally
        await AsyncStorage.setItem(
          '@tailtracker:cached_session',
          JSON.stringify(result.data.session)
        );
      }
      
      return result;
    } catch (error) {
      this.recordFailedRequest(error);
      
      // Try to return cached session if available
      try {
        const cachedSession = await AsyncStorage.getItem('@tailtracker:cached_session');
        if (cachedSession) {
          const session = JSON.parse(cachedSession);
          
          // Check if cached session is still valid (not expired)
          if (session.expires_at && new Date(session.expires_at * 1000) > new Date()) {
            return { data: { session }, error: null };
          }
        }
      } catch (cacheError) {
        console.warn('Failed to retrieve cached session:', cacheError);
      }
      
      throw error;
    }
  }

  /**
   * Execute auth operation with error recovery
   */
  private async executeAuthOperation<T>(
    operationType: string,
    operation: () => Promise<T>,
    options: EnhancedQueryOptions
  ): Promise<T> {
    const operationKey = options.circuitBreaker || `auth_${operationType}`;

    try {
      if (options.circuitBreaker) {
        return await errorRecoveryService.executeWithCircuitBreaker(operationKey, operation);
      }

      const retryConfig = {
        maxAttempts: 3,
        baseDelayMs: 2000,
        maxDelayMs: 10000,
        ...options.retry,
      };

      return await errorRecoveryService.executeWithRetry(operation, retryConfig);
    } catch (error) {
      this.recordFailedRequest(error);
      
      // Queue auth operations for retry (except sign out)
      if (options.offlineQueue && operationType !== 'signOut' && !this.connectionStatus.isConnected) {
        await offlineQueueManager.enqueueAction(
          `AUTH_${operationType.toUpperCase()}`,
          { operationType, options },
          {
            priority: 'high',
            requiresAuthentication: false,
          }
        );
      }
      
      throw error;
    }
  }

  /**
   * Health check to monitor Supabase connectivity
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const result = await this.client.from('user_profiles').select('id').limit(1);
      
      if (result.error) {
        throw result.error;
      }

      this.connectionStatus.isSupabaseReachable = true;
      this.recordSuccessfulRequest();
    } catch (error) {
      this.connectionStatus.isSupabaseReachable = false;
      this.recordFailedRequest(error);
    }

    this.notifyStatusListeners();
  }

  /**
   * Record successful request
   */
  private recordSuccessfulRequest(): void {
    this.connectionStatus.lastSuccessfulRequest = Date.now();
    this.connectionStatus.consecutiveFailures = 0;
  }

  /**
   * Record failed request
   */
  private recordFailedRequest(error: any): void {
    this.connectionStatus.consecutiveFailures++;
    
    // Mark as unreachable after multiple consecutive failures
    if (this.connectionStatus.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      this.connectionStatus.isSupabaseReachable = false;
    }

    console.warn('Supabase request failed:', error);
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      this.connectionStatus.isConnected = state.isConnected ?? false;
      this.notifyStatusListeners();
    });
  }

  /**
   * Initialize auth state changes
   */
  private initializeAuthStateChanges(): void {
    this.client.auth.onAuthStateChange((event, session) => {
      this.authListeners.forEach(listener => {
        try {
          listener(event, session);
        } catch (error) {
          console.error('Error in auth listener:', error);
        }
      });

      // Cache session on auth state changes
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        AsyncStorage.setItem(
          '@tailtracker:cached_session',
          JSON.stringify(session)
        ).catch(error => {
          console.warn('Failed to cache session:', error);
        });
      } else if (event === 'SIGNED_OUT') {
        AsyncStorage.removeItem('@tailtracker:cached_session').catch(error => {
          console.warn('Failed to remove cached session:', error);
        });
      }
    });
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Stop health checks
   */
  public stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Add connection status listener
   */
  public addStatusListener(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);
    
    // Send initial status
    listener(this.connectionStatus);
    
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add auth state listener
   */
  public addAuthListener(
    listener: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED', session: any) => void
  ): () => void {
    this.authListeners.push(listener);
    
    return () => {
      const index = this.authListeners.indexOf(listener);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify status listeners
   */
  private notifyStatusListeners(): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(this.connectionStatus);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get underlying Supabase client (for advanced operations)
   */
  public getClient(): SupabaseClient {
    return this.client;
  }
}

// Create and export enhanced client instance
export const createEnhancedSupabaseClient = (url: string, anonKey: string) => {
  return new EnhancedSupabaseClient(url, anonKey);
};