import React, { Suspense, lazy, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { usePerformanceMonitor } from '../../services/PerformanceMonitor';

interface LazyLoadOptions {
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  timeout?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  options?: LazyLoadOptions;
  componentName: string;
}

// Default loading component
const DefaultLoadingComponent = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2196F3" />
  </View>
);

// Default error boundary
class DefaultErrorBoundary extends React.Component<
  { error: Error; retry: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { error: Error; retry: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Lazy component error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          {/* Add error UI here if needed */}
        </View>
      );
    }

    return this.props.children;
  }
}

// Lazy component wrapper with performance monitoring
const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  children,
  options = {},
  componentName
}) => {
  const performanceMonitor = usePerformanceMonitor();
  const FallbackComponent = options.fallback || DefaultLoadingComponent;
  const ErrorBoundary = options.errorBoundary || DefaultErrorBoundary;

  React.useEffect(() => {
    performanceMonitor.startTiming(`lazy_load_${componentName}`);
    
    return () => {
      performanceMonitor.endTiming(`lazy_load_${componentName}`, 'navigation', {
        componentName,
        lazyLoaded: true
      });
    };
  }, [componentName, performanceMonitor]);

  return (
    <ErrorBoundary error={new Error()} retry={() => window.location.reload()}>
      <Suspense fallback={<FallbackComponent />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};// Factory function to create lazy-loaded components
export function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(importFunction);
  
  const WrappedComponent: React.FC<React.ComponentProps<T> & { componentName?: string }> = (props) => {
    const { componentName = 'unknown', ...restProps } = props;
    
    return (
      <LazyComponentWrapper options={options} componentName={componentName}>
        <LazyComponent {...(restProps as any)} />
      </LazyComponentWrapper>
    );
  };

  // Set display name for debugging
  WrappedComponent.displayName = `LazyLoaded(${(LazyComponent as any).displayName || 'Component'})`;
  
  return WrappedComponent;
}

// Hook for component-level lazy loading state
export function useLazyLoadState(componentName: string) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const performanceMonitor = usePerformanceMonitor();

  const loadComponent = React.useCallback(async (importFunction: () => Promise<any>) => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    performanceMonitor.startTiming(`component_load_${componentName}`);

    try {
      await importFunction();
      setIsLoaded(true);
      
      performanceMonitor.endTiming(`component_load_${componentName}`, 'navigation', {
        componentName,
        success: true
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      performanceMonitor.endTiming(`component_load_${componentName}`, 'navigation', {
        componentName,
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [componentName, isLoaded, isLoading, performanceMonitor]);

  return {
    isLoaded,
    isLoading,
    error,
    loadComponent
  };
}

// Preloader for critical components
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();
  
  static async preload(
    componentName: string,
    importFunction: () => Promise<{ default: ComponentType<any> }>
  ) {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    try {
      await importFunction();
      this.preloadedComponents.add(componentName);
      console.log(`Preloaded component: ${componentName}`);
    } catch (error) {
      console.error(`Failed to preload component ${componentName}:`, error);
    }
  }

  static isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    backgroundColor: '#f5f5f5',
  },
});

export default LazyComponentWrapper;