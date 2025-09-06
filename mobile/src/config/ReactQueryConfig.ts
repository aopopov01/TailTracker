import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, QueryCache, MutationCache, DefaultOptions } from 'react-query';
import { errorRecoveryService } from '../services/ErrorRecoveryService';
import { offlineQueueManager } from '../services/OfflineQueueManager';

export interface QueryErrorWithRetry extends Error {
  isRetryable?: boolean;
  statusCode?: number;
  networkError?: boolean;
}

export interface EnhancedQueryOptions {
  priority?: 'critical' | 'high' | 'medium' | 'low';
  offlineSupport?: boolean;
  circuitBreaker?: string;
  deduplicationKey?: string;
}

/**
 * Enhanced Query Client configuration with error recovery
 */
export class EnhancedQueryClient extends QueryClient {
  private isOnline = true;
  private retryFailures = new Map<string, number>();

  constructor() {
    super({
      queryCache: createEnhancedQueryCache(),
      mutationCache: createEnhancedMutationCache(),
      defaultOptions: createEnhancedDefaultOptions(),
    });

    this.initializeNetworkMonitoring();
    this.setupPersistence();
  }

  /**
   * Initialize network status monitoring
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Resume paused queries when connection is restored
      if (!wasOnline && this.isOnline) {
        this.resumePausedMutations();
        this.invalidateQueries({ type: 'active' });
      }
    });
  }

  /**
   * Setup query persistence for offline support
   */
  private setupPersistence(): void {
    // Restore cached queries on app start
    this.restoreFromPersistence();

    // Persist important queries
    this.getQueryCache().subscribe(event => {
      if (event.type === 'updated' && event.query.state.data) {
        this.persistQuery(event.query);
      }
    });
  }

  /**
   * Restore cached queries from AsyncStorage
   */
  private async restoreFromPersistence(): Promise<void> {
    try {
      const cachedQueries = await AsyncStorage.getItem('@tailtracker:cached_queries');
      if (cachedQueries) {
        const queries = JSON.parse(cachedQueries);
        
        Object.entries(queries).forEach(([queryKey, queryData]: [string, any]) => {
          if (this.shouldRestoreQuery(queryData)) {
            this.setQueryData(queryKey, queryData.data, {
              updatedAt: queryData.updatedAt,
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to restore cached queries:', error);
    }
  }

  /**
   * Persist important queries
   */
  private async persistQuery(query: any): Promise<void> {
    if (!this.shouldPersistQuery(query)) {
      return;
    }

    try {
      const cachedQueries = await AsyncStorage.getItem('@tailtracker:cached_queries');
      const queries = cachedQueries ? JSON.parse(cachedQueries) : {};
      
      queries[query.queryKey] = {
        data: query.state.data,
        updatedAt: query.state.dataUpdatedAt,
        queryKey: query.queryKey,
      };

      // Limit cache size to prevent storage overflow
      const queryKeys = Object.keys(queries);
      if (queryKeys.length > 100) {
        // Remove oldest entries
        queryKeys
          .sort((a, b) => queries[a].updatedAt - queries[b].updatedAt)
          .slice(0, queryKeys.length - 100)
          .forEach(key => delete queries[key]);
      }

      await AsyncStorage.setItem('@tailtracker:cached_queries', JSON.stringify(queries));
    } catch (error) {
      console.warn('Failed to persist query:', error);
    }
  }

  /**
   * Check if query should be restored from cache
   */
  private shouldRestoreQuery(queryData: any): boolean {
    // Only restore recent data (within last hour)
    const maxAge = 60 * 60 * 1000; // 1 hour
    return Date.now() - queryData.updatedAt < maxAge;
  }

  /**
   * Check if query should be persisted
   */
  private shouldPersistQuery(query: any): boolean {
    const queryKey = query.queryKey[0];
    
    // Persist critical data
    const persistableQueries = [
      'pets',
      'user_profile',
      'vaccinations',
      'lost_pet_alerts',
      'emergency_contacts',
    ];
    
    return persistableQueries.some(key => queryKey.includes(key));
  }

  /**
   * Resume paused mutations when connection is restored
   */
  private resumePausedMutations(): void {
    this.getMutationCache().getAll().forEach(mutation => {
      if (mutation.state.isPaused) {
        mutation.continue();
      }
    });
  }

  /**
   * Enhanced query with error recovery options
   */
  public async queryWithRetry<T>(
    queryKey: any,
    queryFn: () => Promise<T>,
    options: EnhancedQueryOptions = {}
  ): Promise<T> {
    const enhancedQueryFn = async () => {
      if (options.circuitBreaker) {
        return errorRecoveryService.executeWithCircuitBreaker(
          options.circuitBreaker,
          queryFn
        );
      }

      if (options.deduplicationKey) {
        return errorRecoveryService.deduplicateRequest(
          options.deduplicationKey,
          queryFn
        );
      }

      return errorRecoveryService.executeWithRetry(queryFn);
    };

    return this.fetchQuery(queryKey, enhancedQueryFn);
  }

  /**
   * Enhanced mutation with offline queue support
   */
  public async mutateWithQueue<T>(
    mutationFn: () => Promise<T>,
    options: EnhancedQueryOptions & {
      actionType?: string;
      actionPayload?: any;
    } = {}
  ): Promise<T> {
    try {
      if (options.circuitBreaker) {
        return await errorRecoveryService.executeWithCircuitBreaker(
          options.circuitBreaker,
          mutationFn
        );
      }

      return await errorRecoveryService.executeWithRetry(mutationFn);
    } catch (error) {
      // Queue for offline retry if network is down
      if (options.offlineSupport && !this.isOnline && options.actionType) {
        await offlineQueueManager.enqueueAction(
          options.actionType,
          options.actionPayload || {},
          {
            priority: options.priority,
            requiresAuthentication: true,
          }
        );

        // Return optimistic result or throw specific error
        throw new Error('Operation queued for offline retry');
      }

      throw error;
    }
  }
}

/**
 * Create enhanced query cache with error handling
 */
function createEnhancedQueryCache(): QueryCache {
  return new QueryCache({
    onError: (error: any, query) => {
      console.error(`Query error for ${query.queryKey}:`, error);
      
      // Track query failures
      const queryKey = JSON.stringify(query.queryKey);
      const currentFailures = (global as any).queryFailures?.get(queryKey) || 0;
      
      if (!((global as any).queryFailures)) {
        (global as any).queryFailures = new Map();
      }
      
      (global as any).queryFailures.set(queryKey, currentFailures + 1);
      
      // Disable query if too many consecutive failures
      if (currentFailures >= 5) {
        query.disable();
        console.warn(`Query ${queryKey} disabled due to repeated failures`);
      }
    },
    onSuccess: (data, query) => {
      // Reset failure count on success
      const queryKey = JSON.stringify(query.queryKey);
      if ((global as any).queryFailures) {
        (global as any).queryFailures.set(queryKey, 0);
      }
    },
  });
}

/**
 * Create enhanced mutation cache with offline queue support
 */
function createEnhancedMutationCache(): MutationCache {
  return new MutationCache({
    onError: (error: any, variables, context, mutation) => {
      console.error('Mutation error:', error);
      
      // Check if mutation should be queued for offline retry
      if (isNetworkError(error)) {
        console.log('Network error detected, mutation may be queued for retry');
      }
    },
    onSuccess: (data, variables, context, mutation) => {
      // Clear any related offline queue entries on successful mutation
      console.log('Mutation successful');
    },
  });
}

/**
 * Create enhanced default options for queries and mutations
 */
function createEnhancedDefaultOptions(): DefaultOptions {
  return {
    queries: {
      // Retry configuration
      retry: (failureCount: number, error: QueryErrorWithRetry) => {
        // Don't retry on authentication errors
        if (error.statusCode === 401 || error.statusCode === 403) {
          return false;
        }

        // Don't retry on client errors (4xx except 401, 403, 429)
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
          return false;
        }

        // Retry up to 3 times for retryable errors
        return failureCount < 3 && (error.isRetryable !== false);
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => {
        const delay = Math.min(1000 * Math.pow(2, attemptIndex), 30000);
        // Add jitter to prevent thundering herd
        return delay + Math.random() * 1000;
      },

      // Stale time configuration
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes

      // Background refetch configuration
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,

      // Network mode configuration
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry configuration for mutations
      retry: (failureCount: number, error: QueryErrorWithRetry) => {
        // Don't retry mutations on client errors
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }

        // Retry up to 2 times for network errors
        return failureCount < 2 && isNetworkError(error);
      },

      // Retry delay for mutations
      retryDelay: (attemptIndex) => {
        return Math.min(2000 * Math.pow(2, attemptIndex), 10000);
      },

      // Network mode for mutations
      networkMode: 'offlineFirst',
    },
  };
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: any): boolean {
  return (
    error.networkError ||
    error.code === 'NETWORK_ERROR' ||
    error.message?.includes('Network Error') ||
    error.message?.includes('fetch') ||
    error.message?.includes('timeout') ||
    (error.statusCode && error.statusCode >= 500)
  );
}

/**
 * Create and configure enhanced query client
 */
export function createEnhancedQueryClient(): EnhancedQueryClient {
  return new EnhancedQueryClient();
}

// Export configured client instance
export const queryClient = createEnhancedQueryClient();

// Enhanced query hooks
export const useEnhancedQuery = (queryKey: any, queryFn: any, options: any = {}) => {
  const enhancedOptions = {
    ...options,
    queryFn: () => {
      if (options.circuitBreaker) {
        return errorRecoveryService.executeWithCircuitBreaker(
          options.circuitBreaker,
          queryFn
        );
      }

      if (options.deduplicationKey) {
        return errorRecoveryService.deduplicateRequest(
          options.deduplicationKey,
          queryFn
        );
      }

      return errorRecoveryService.executeWithRetry(queryFn);
    },
  };

  return queryClient.useQuery(queryKey, enhancedOptions.queryFn, enhancedOptions);
};

export const useEnhancedMutation = (mutationFn: any, options: any = {}) => {
  const enhancedMutationFn = async (variables: any) => {
    try {
      if (options.circuitBreaker) {
        return await errorRecoveryService.executeWithCircuitBreaker(
          options.circuitBreaker,
          () => mutationFn(variables)
        );
      }

      return await errorRecoveryService.executeWithRetry(() => mutationFn(variables));
    } catch (error) {
      // Queue for offline retry if network is down
      if (options.offlineSupport && !navigator.onLine && options.actionType) {
        await offlineQueueManager.enqueueAction(
          options.actionType,
          variables,
          {
            priority: options.priority || 'medium',
            requiresAuthentication: true,
          }
        );

        throw new Error('Operation queued for offline retry');
      }

      throw error;
    }
  };

  return queryClient.useMutation(enhancedMutationFn, options);
};