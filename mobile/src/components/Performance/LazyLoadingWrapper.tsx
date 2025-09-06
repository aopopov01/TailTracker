import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { log } from '../../utils/Logger';
import { usePerformanceOptimizer } from '../../utils/PerformanceOptimizer';

/**
 * Lazy Loading Wrapper for Performance Optimization
 * Provides code splitting and dynamic imports for React Native components
 */

interface LazyLoadingWrapperProps {
  children?: React.ReactNode;
  fallback?: React.ComponentType;
  loadingText?: string;
  enablePreload?: boolean;
  preloadDelay?: number;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface LazyComponentOptions {
  preload?: boolean;
  chunkName?: string;
  webpackPrefetch?: boolean;
  webpackPreload?: boolean;
}

/**
 * Enhanced lazy loading with performance tracking and error boundaries
 */
export const createLazyComponent = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<ComponentType<P>> => {
  const { preload = false, chunkName } = options;

  // Create lazy component with performance tracking
  const LazyComponent = lazy(async () => {
    const startTime = performance.now();
    
    try {
      const module = await importFunc();
      const loadTime = performance.now() - startTime;
      
      // Track lazy loading performance
      if (__DEV__) {
        log.performance(`Lazy component loaded: ${chunkName || 'unknown'} in ${loadTime.toFixed(2)}ms`);
      }
      
      // Track metric for performance monitoring
      if (typeof window !== 'undefined' && window.performance) {
        performance.mark(`lazy-${chunkName || 'component'}-loaded`);
        performance.measure(
          `lazy-${chunkName || 'component'}-load-time`,
          `lazy-${chunkName || 'component'}-start`,
          `lazy-${chunkName || 'component'}-loaded`
        );
      }
      
      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      log.error(`Failed to load lazy component ${chunkName || 'unknown'} after ${loadTime.toFixed(2)}ms:`, error);
      throw error;
    }
  });

  // Preload component if requested
  if (preload) {
    setTimeout(() => {
      importFunc().catch(error => {
        log.warn('Failed to preload component:', error);
      });
    }, 0);
  }

  return LazyComponent;
};

/**
 * Default loading component
 */
const DefaultFallback: React.FC<{ loadingText?: string }> = ({ loadingText = 'Loading...' }) => {
  const { shouldEnableAnimations } = usePerformanceOptimizer();

  return (
    <View style={styles.fallbackContainer}>
      <ActivityIndicator 
        size="large" 
        color="#4BA8B5"
        animating={shouldEnableAnimations}
      />
      <Text style={styles.loadingText}>{loadingText}</Text>
    </View>
  );
};

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Failed to Load Component</Text>
    <Text style={styles.errorMessage}>{error.message}</Text>
    <Text style={styles.retryButton} onPress={retry}>Tap to Retry</Text>
  </View>
);

/**
 * Error boundary for lazy loading
 */
interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class LazyErrorBoundary extends React.Component<
  { 
    children: React.ReactNode;
    fallback: React.ComponentType<{ error: Error; retry: () => void }>;
    maxRetries?: number;
  },
  LazyErrorBoundaryState
> {
  private maxRetries: number;

  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
    this.maxRetries = props.maxRetries || 3;
  }

  static getDerivedStateFromError(error: Error): Partial<LazyErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error('Lazy loading error:', error, errorInfo);
    
    // Track error for performance monitoring
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark('lazy-component-error');
    }
  }

  retry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        retryCount: this.state.retryCount + 1,
      });
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const ErrorComponent = this.props.fallback;
      return <ErrorComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * Main lazy loading wrapper component
 */
export const LazyLoadingWrapper: React.FC<LazyLoadingWrapperProps> = ({
  children,
  fallback: FallbackComponent = DefaultFallback,
  loadingText = 'Loading...',
  enablePreload = false,
  preloadDelay = 1000,
  errorFallback: ErrorFallbackComponent = DefaultErrorFallback,
}) => {
  const { isInitialized, trackMetric } = usePerformanceOptimizer();

  React.useEffect(() => {
    if (enablePreload) {
      const preloadTimer = setTimeout(() => {
        // Trigger preloading logic here
        trackMetric('lazy_preload_trigger', Date.now());
      }, preloadDelay);

      return () => clearTimeout(preloadTimer);
    }
  }, [enablePreload, preloadDelay, trackMetric]);

  // Performance tracking
  React.useEffect(() => {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      trackMetric('lazy_component_mount_duration', duration);
    };
  }, [trackMetric]);

  if (!isInitialized) {
    return <FallbackComponent loadingText={loadingText} />;
  }

  return (
    <LazyErrorBoundary fallback={ErrorFallbackComponent}>
      <Suspense fallback={<FallbackComponent loadingText={loadingText} />}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
};

/**
 * HOC for lazy loading components with performance optimization
 */
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions & {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  } = {}
) => {
  const LazyComponent = createLazyComponent(importFunc, options);

  return React.forwardRef<any, P>((props, ref) => (
    <LazyLoadingWrapper
      fallback={options.fallback}
      errorFallback={options.errorFallback}
    >
      <LazyComponent {...props} ref={ref} />
    </LazyLoadingWrapper>
  ));
};

/**
 * Hook for dynamic imports with performance tracking
 */
export const useDynamicImport = <T extends unknown>(
  importFunc: () => Promise<T>,
  deps: React.DependencyList = []
) => {
  const [module, setModule] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const { trackMetric } = usePerformanceOptimizer();

  const loadModule = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      const loadedModule = await importFunc();
      const loadTime = Date.now() - startTime;
      
      setModule(loadedModule);
      trackMetric('dynamic_import_success', loadTime);
      
      if (__DEV__) {
        log.performance(`Dynamic import completed in ${loadTime.toFixed(2)}ms`);
      }
    } catch (err) {
      const loadTime = Date.now() - startTime;
      const error = err instanceof Error ? err : new Error('Unknown import error');
      
      setError(error);
      trackMetric('dynamic_import_error', loadTime);
      
      log.error(`Dynamic import failed after ${loadTime.toFixed(2)}ms:`, error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importFunc, trackMetric, ...deps]);

  React.useEffect(() => {
    loadModule();
  }, [loadModule]);

  return {
    module,
    loading,
    error,
    retry: loadModule,
  };
};

/**
 * Preload utility for critical components
 */
export const preloadComponents = (
  components: (() => Promise<any>)[],
  options: { priority?: 'high' | 'low'; delay?: number } = {}
) => {
  const { priority = 'low', delay = 0 } = options;
  
  const preload = () => {
    const startTime = Date.now();
    
    const preloadPromises = components.map(async (importFunc, index) => {
      try {
        await importFunc();
        const loadTime = Date.now() - startTime;
        
        if (__DEV__) {
          log.performance(`Preloaded component ${index} in ${loadTime.toFixed(2)}ms`);
        }
      } catch (error) {
        log.warn(`Failed to preload component ${index}:`, error);
      }
    });

    return Promise.allSettled(preloadPromises);
  };

  if (priority === 'high') {
    // High priority - load immediately
    setTimeout(preload, delay);
  } else {
    // Low priority - load when idle
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        setTimeout(preload, delay);
      });
    } else {
      setTimeout(preload, delay + 100);
    }
  }
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    fontSize: 16,
    color: '#4BA8B5',
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4BA8B5',
    borderRadius: 8,
    textAlign: 'center',
  },
});

export default LazyLoadingWrapper;