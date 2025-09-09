import { useState, useEffect, useCallback, useRef } from 'react';
import { CacheAnalyticsService } from '../services/CacheAnalyticsService';
import { CacheOrchestrator } from '../services/CacheOrchestrator';
import { ImageOptimizationService } from '../services/ImageOptimizationService';
import { PredictiveLoadingService } from '../services/PredictiveLoadingService';

// Initialize service instances
const cacheOrchestrator = CacheOrchestrator.getInstance();
const cacheAnalyticsService = CacheAnalyticsService.getInstance();
const imageOptimizationService = ImageOptimizationService.getInstance();
const predictiveLoadingService = PredictiveLoadingService.getInstance();

interface CacheOptions {
  ttl?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  enablePrediction?: boolean;
  enableCompression?: boolean;
  fallback?: () => Promise<any>;
  validate?: (data: any) => boolean;
  onLoading?: (loading: boolean) => void;
  onError?: (error: Error) => void;
}

interface CacheState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
  lastUpdated: number | null;
}

interface ImageCacheOptions {
  quality?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  enableLazyLoading?: boolean;
  preloadVariants?: boolean;
  optimizeOnLoad?: boolean;
}

interface PredictiveCacheOptions {
  routeName?: string;
  userContext?: Record<string, any>;
  enablePatternLearning?: boolean;
  prefetchProbability?: number;
}

export function useAdvancedCache<T>(
  key: string,
  options: CacheOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
  invalidate: () => void;
  updateCache: (newData: T) => Promise<void>;
  cacheStats: () => any;
} {
  const [state, setState] = useState<CacheState<T>>({
    data: null,
    loading: true,
    error: null,
    fromCache: false,
    lastUpdated: null
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load data from cache or fallback
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    options.onLoading?.(true);

    try {
      // Try to get from cache first
      const cachedData = await cacheOrchestrator.get<T>(key, {
        strategy: { 
          level: 'auto', 
          priority: options.priority || 'medium',
          enablePrediction: options.enablePrediction 
        },
        validate: options.validate
      });

      if (cachedData && isMountedRef.current) {
        setState({
          data: cachedData,
          loading: false,
          error: null,
          fromCache: true,
          lastUpdated: Date.now()
        });
        options.onLoading?.(false);
        return;
      }

      // If no cached data and fallback is provided
      if (options.fallback) {
        const freshData = await options.fallback();
        
        if (abortControllerRef.current?.signal.aborted) return;
        
        // Cache the fresh data
        await cacheOrchestrator.set(key, freshData, {
          strategy: {
            level: 'auto',
            priority: options.priority || 'medium',
            ttl: options.ttl,
            enableCompression: options.enableCompression,
            enablePrediction: options.enablePrediction
          }
        });

        if (isMountedRef.current) {
          setState({
            data: freshData,
            loading: false,
            error: null,
            fromCache: false,
            lastUpdated: Date.now()
          });
        }
      } else {
        // No fallback, just set loading to false
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, loading: false }));
        }
      }

    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) return;
      
      const err = error as Error;
      console.error(`Cache load failed for ${key}:`, err);
      
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, loading: false, error: err }));
        options.onError?.(err);
      }
    } finally {
      options.onLoading?.(false);
    }
  }, [key, options]);

  // Refresh data (bypass cache)
  const refresh = useCallback(async () => {
    if (options.fallback) {
      setState(prev => ({ ...prev, loading: true, error: null, fromCache: false }));
      options.onLoading?.(true);

      try {
        const freshData = await options.fallback();
        
        // Update cache
        await cacheOrchestrator.set(key, freshData, {
          strategy: {
            level: 'auto',
            priority: options.priority || 'medium',
            ttl: options.ttl,
            enableCompression: options.enableCompression
          }
        });

        if (isMountedRef.current) {
          setState({
            data: freshData,
            loading: false,
            error: null,
            fromCache: false,
            lastUpdated: Date.now()
          });
        }

      } catch (error) {
        const err = error as Error;
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, loading: false, error: err }));
          options.onError?.(err);
        }
      } finally {
        options.onLoading?.(false);
      }
    }
  }, [key, options]);

  // Invalidate cache entry
  const invalidate = useCallback(() => {
    // This would call a method to remove the cache entry
    // For now, we'll just trigger a reload
    loadData();
  }, [loadData]);

  // Update cache with new data
  const updateCache = useCallback(async (newData: T) => {
    await cacheOrchestrator.set(key, newData, {
      strategy: {
        level: 'auto',
        priority: options.priority || 'medium',
        ttl: options.ttl,
        enableCompression: options.enableCompression
      }
    });

    setState({
      data: newData,
      loading: false,
      error: null,
      fromCache: true,
      lastUpdated: Date.now()
    });
  }, [key, options]);

  // Get cache statistics
  const cacheStats = useCallback(() => {
    return cacheAnalyticsService.getCurrentMetrics();
  }, []);

  // Load data on mount and key change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    fromCache: state.fromCache,
    refresh,
    invalidate,
    updateCache,
    cacheStats
  };
}

export function useImageCache(
  imageUrl: string,
  options: ImageCacheOptions = {}
): {
  optimizedUrl: string;
  isLoading: boolean;
  error: Error | null;
  variants: { quality: string; url: string; loaded: boolean }[];
  preload: () => Promise<void>;
  getVariant: (quality: string) => string | null;
} {
  const [optimizedUrl, setOptimizedUrl] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [variants, setVariants] = useState<{ quality: string; url: string; loaded: boolean }[]>([]);

  const quality = options.quality || 'medium';
  const isMountedRef = useRef(true);

  // Load optimized image
  useEffect(() => {
    let mounted = true;

    const loadOptimizedImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get optimized URL
        const optimized = await imageOptimizationService.getOptimizedImageUrl(imageUrl, quality);
        
        if (mounted) {
          setOptimizedUrl(optimized);
        }

        // Get metadata with all variants
        const metadata = imageOptimizationService.getImageMetadata(imageUrl);
        if (metadata && metadata.variants && mounted) {
          const variantData = metadata.variants.map(variant => ({
            quality: variant.quality,
            url: variant.url || optimized,
            loaded: false
          }));
          setVariants(variantData);
        }

        // Optimize image if needed
        if (options.optimizeOnLoad) {
          await imageOptimizationService.optimizeImage(imageUrl, [quality]);
        }

        // Preload other variants if requested
        if (options.preloadVariants) {
          const variantsToPreload: any[] = ['thumbnail'];
          if (quality !== 'large') variantsToPreload.push('large');
          
          await imageOptimizationService.optimizeImage(imageUrl, variantsToPreload, {
            priority: 2
          });
        }

        if (mounted) {
          setIsLoading(false);
        }

      } catch (err) {
        console.error('Image optimization failed:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadOptimizedImage();

    return () => {
      mounted = false;
    };
  }, [imageUrl, quality, options.optimizeOnLoad, options.preloadVariants]);

  // Preload image
  const preload = useCallback(async () => {
    try {
      await imageOptimizationService.preloadImages([imageUrl], 'high');
    } catch (err) {
      console.error('Image preload failed:', err);
    }
  }, [imageUrl]);

  // Get specific variant
  const getVariant = useCallback((requestedQuality: string) => {
    const variant = variants.find(v => v.quality === requestedQuality);
    return variant ? variant.url : null;
  }, [variants]);

  // Setup lazy loading if enabled
  useEffect(() => {
    if (options.enableLazyLoading) {
      // This would integrate with the lazy loading system
      imageOptimizationService.handleImageIntersection(imageUrl, true, 0);
    }
  }, [imageUrl, options.enableLazyLoading]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    optimizedUrl,
    isLoading,
    error,
    variants,
    preload,
    getVariant
  };
}

export function usePredictiveCache(
  options: PredictiveCacheOptions = {}
): {
  predictions: { dataType: string; probability: number; preloaded: boolean }[];
  accuracy: number;
  prefetch: (dataTypes: string[]) => Promise<void>;
  updateContext: (context: Record<string, any>) => void;
  recordAction: (action: string, data: any) => Promise<void>;
  isLearning: boolean;
} {
  const [predictions, setPredictions] = useState<{ dataType: string; probability: number; preloaded: boolean }[]>([]);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isLearning, setIsLearning] = useState<boolean>(false);

  // Load current predictions
  useEffect(() => {
    const loadPredictions = () => {
      const currentPredictions = predictiveLoadingService.getCurrentPredictions();
      setPredictions(currentPredictions.map(p => ({
        dataType: p.dataType || 'unknown',
        probability: p.probability || 0,
        preloaded: false // Would check if actually preloaded
      })));
    };

    loadPredictions();
    
    // Update predictions every 30 seconds
    const interval = setInterval(loadPredictions, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Load accuracy metrics
  useEffect(() => {
    const loadAccuracy = () => {
      const metrics = predictiveLoadingService.getMetrics();
      setAccuracy(metrics.averagePredictionAccuracy);
    };

    loadAccuracy();
    
    // Update accuracy every minute
    const interval = setInterval(loadAccuracy, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Prefetch specific data types
  const prefetch = useCallback(async (dataTypes: string[]) => {
    setIsLearning(true);
    
    try {
      // This would trigger prefetching of specific data types
      for (const dataType of dataTypes) {
        // Implementation would depend on how data types map to actual data
        console.log(`Prefetching ${dataType}`);
      }
    } catch (error) {
      console.error('Prefetch failed:', error);
    } finally {
      setIsLearning(false);
    }
  }, []);

  // Update user context
  const updateContext = useCallback((context: Record<string, any>) => {
    predictiveLoadingService.updateContext(context);
  }, []);

  // Record user action for learning
  const recordAction = useCallback(async (action: string, data: any) => {
    setIsLearning(true);
    
    try {
      await predictiveLoadingService.recordUserAction(action, data, 0);
    } catch (error) {
      console.error('Failed to record action:', error);
    } finally {
      setIsLearning(false);
    }
  }, []);

  // Update context with route if provided
  useEffect(() => {
    if (options.routeName) {
      updateContext({ route: options.routeName, ...options.userContext });
    }
  }, [options.routeName, options.userContext, updateContext]);

  return {
    predictions,
    accuracy,
    prefetch,
    updateContext,
    recordAction,
    isLearning
  };
}

export function useCachePerformance(): {
  metrics: any;
  score: number;
  grade: string;
  recommendations: string[];
  optimize: () => Promise<void>;
  isOptimizing: boolean;
} {
  const [metrics, setMetrics] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [grade, setGrade] = useState<string>('F');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Load performance metrics
  const loadMetrics = useCallback(async () => {
    try {
      const report = await cacheOrchestrator.getPerformanceReport();
      setMetrics(report.systems);
      setScore(report.overall.score);
      setGrade(report.overall.grade);
      setRecommendations(report.recommendations);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  }, []);

  // Optimize performance
  const optimize = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      await cacheOrchestrator.optimizePerformance();
      await loadMetrics(); // Reload metrics after optimization
    } catch (error) {
      console.error('Performance optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [loadMetrics]);

  // Load metrics on mount and periodically
  useEffect(() => {
    loadMetrics();
    
    // Refresh metrics every 2 minutes
    const interval = setInterval(loadMetrics, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadMetrics]);

  return {
    metrics,
    score,
    grade,
    recommendations,
    optimize,
    isOptimizing
  };
}

// Navigation tracking hook
export function useNavigationCache(routeName: string): {
  trackNavigation: (fromRoute: string, loadTime: number) => Promise<void>;
  prefetchForRoute: () => Promise<void>;
  isPrefetching: boolean;
} {
  const [isPrefetching, setIsPrefetching] = useState<boolean>(false);

  const trackNavigation = useCallback(async (fromRoute: string, loadTime: number) => {
    try {
      await cacheOrchestrator.trackNavigation(fromRoute, routeName, loadTime);
    } catch (error) {
      console.error('Navigation tracking failed:', error);
    }
  }, [routeName]);

  const prefetchForRoute = useCallback(async () => {
    setIsPrefetching(true);
    
    try {
      await cacheOrchestrator.prefetchForRoute(routeName);
    } catch (error) {
      console.error('Route prefetch failed:', error);
    } finally {
      setIsPrefetching(false);
    }
  }, [routeName]);

  // Auto-prefetch on route change
  useEffect(() => {
    prefetchForRoute();
  }, [prefetchForRoute]);

  return {
    trackNavigation,
    prefetchForRoute,
    isPrefetching
  };
}

export default {
  useAdvancedCache,
  useImageCache,
  usePredictiveCache,
  useCachePerformance,
  useNavigationCache
};