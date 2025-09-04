import { performance, PerformanceObserver } from 'perf_hooks';

// Performance monitoring for React Native tests
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'render' | 'navigation' | 'api' | 'memory' | 'custom';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  
  start() {
    this.metrics = [];
    
    // Mock performance observer for React Native environment
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.push({
          name: entry.name,
          duration: entry.duration,
          timestamp: entry.startTime,
          type: this.categorizeMetric(entry.name),
        });
      }
    });
    
    if (typeof window !== 'undefined' && window.performance) {
      this.observer.observe({ entryTypes: ['measure', 'mark'] });
    }
  }
  
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
  
  measure(name: string, startMark?: string, endMark?: string) {
    if (typeof performance !== 'undefined' && performance.measure) {
      performance.measure(name, startMark, endMark);
    }
  }
  
  mark(name: string) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }
  
  getAverageByType(type: PerformanceMetric['type']): number {
    const typeMetrics = this.getMetricsByType(type);
    if (typeMetrics.length === 0) return 0;
    
    const total = typeMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / typeMetrics.length;
  }
  
  reset() {
    this.metrics = [];
  }
  
  private categorizeMetric(name: string): PerformanceMetric['type'] {
    if (name.includes('render') || name.includes('mount')) return 'render';
    if (name.includes('navigate') || name.includes('screen')) return 'navigation';
    if (name.includes('api') || name.includes('fetch')) return 'api';
    if (name.includes('memory')) return 'memory';
    return 'custom';
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance test utilities
export const PerformanceTestUtils = {
  // Test component rendering performance
  async measureComponentRender<T>(
    renderFunction: () => T,
    componentName: string,
    iterations = 1
  ): Promise<{ result: T; averageTime: number; allTimes: number[] }> {
    const times: number[] = [];
    let result: T;
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      result = renderFunction();
      const endTime = Date.now();
      times.push(endTime - startTime);
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    // Log performance metric
    performanceMonitor.metrics.push({
      name: `${componentName}-render`,
      duration: averageTime,
      timestamp: Date.now(),
      type: 'render',
    });
    
    return { result: result!, averageTime, allTimes: times };
  },
  
  // Test API call performance
  async measureApiCall<T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await apiCall();
    const duration = Date.now() - startTime;
    
    performanceMonitor.metrics.push({
      name: `${apiName}-api`,
      duration,
      timestamp: startTime,
      type: 'api',
    });
    
    return { result, duration };
  },
  
  // Test memory usage (simplified for React Native)
  measureMemoryUsage(testName: string) {
    // In real React Native app, you'd use performance.memory or similar
    const mockMemoryUsage = {
      usedJSHeapSize: Math.random() * 50000000, // Mock values
      totalJSHeapSize: 100000000,
    };
    
    performanceMonitor.metrics.push({
      name: `${testName}-memory`,
      duration: mockMemoryUsage.usedJSHeapSize,
      timestamp: Date.now(),
      type: 'memory',
    });
    
    return mockMemoryUsage;
  },
  
  // Assert performance thresholds
  assertPerformance(metric: PerformanceMetric, threshold: number, message?: string) {
    const defaultMessage = `Performance threshold exceeded: ${metric.name} took ${metric.duration}ms (threshold: ${threshold}ms)`;
    expect(metric.duration).toBeLessThan(threshold);
  },
  
  // Get performance summary
  getPerformanceSummary() {
    const metrics = performanceMonitor.getMetrics();
    
    return {
      totalMetrics: metrics.length,
      renderMetrics: performanceMonitor.getMetricsByType('render'),
      apiMetrics: performanceMonitor.getMetricsByType('api'),
      averageRenderTime: performanceMonitor.getAverageByType('render'),
      averageApiTime: performanceMonitor.getAverageByType('api'),
      slowestMetric: metrics.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest, 
        metrics[0] || { duration: 0 }
      ),
    };
  },
};

// Performance thresholds for different operations
export const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 100, // 100ms for component rendering
  SCREEN_NAVIGATION: 300, // 300ms for screen navigation
  API_CALL: 2000, // 2 seconds for API calls
  IMAGE_LOAD: 1000, // 1 second for image loading
  SEARCH_FILTER: 200, // 200ms for search/filter operations
  LIST_SCROLL: 16, // 16ms for smooth 60fps scrolling
  NOTIFICATION_DISPLAY: 500, // 500ms for notification display
};

// Setup and teardown for performance tests
beforeEach(() => {
  performanceMonitor.start();
});

afterEach(() => {
  performanceMonitor.stop();
  
  // Log performance summary if there were any metrics
  const summary = PerformanceTestUtils.getPerformanceSummary();
  if (summary.totalMetrics > 0) {
    console.log('Performance Test Summary:', summary);
  }
  
  performanceMonitor.reset();
});

// Mock high-resolution time for consistent testing
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
  } as any;
}