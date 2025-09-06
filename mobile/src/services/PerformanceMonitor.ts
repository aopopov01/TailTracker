// Fallback performance implementation for when react-native-performance is not available
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
let performancePolyfill: any;
try {
  performancePolyfill = require('react-native-performance').performance;
} catch {
  performancePolyfill = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntries: () => [],
    clearMarks: () => {},
    clearMeasures: () => {}
  };
}
const performance = performancePolyfill;

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'startup' | 'navigation' | 'image' | 'api' | 'memory' | 'battery';
  metadata?: Record<string, any>;
}

interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private startTimes: Map<string, number> = new Map();
  private appStartTime: number;
  private memoryCheckInterval?: NodeJS.Timeout;
  private appStateSubscription: any = null;

  constructor() {
    this.appStartTime = Date.now();
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor app state changes for performance tracking
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Initialize performance observers
    this.initializeObservers();
  }

  private initializeObservers() {
    // Navigation performance observer
    if ('PerformanceObserver' in global) {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: entry.name,
            value: entry.duration,
            timestamp: Date.now(),
            category: 'navigation',
            metadata: { entryType: entry.entryType }
          });
        });
      });
      navObserver.observe({ entryTypes: ['navigation', 'measure'] });
      this.observers.set('navigation', navObserver);
    }
  }

  // Startup Performance Tracking
  markAppLaunchComplete() {
    const launchTime = Date.now() - this.appStartTime;
    this.recordMetric({
      name: 'app_launch_time',
      value: launchTime,
      timestamp: Date.now(),
      category: 'startup'
    });

    // Target: <1500ms
    if (launchTime > 1500) {
      console.warn(`App launch time (${launchTime}ms) exceeds target of 1500ms`);
    }
  }

  // Screen Transition Performance
  startScreenTransition(screenName: string) {
    const key = `screen_transition_${screenName}`;
    this.startTimes.set(key, performance.now());
  }

  endScreenTransition(screenName: string) {
    const key = `screen_transition_${screenName}`;
    const startTime = this.startTimes.get(key);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: 'screen_transition',
        value: duration,
        timestamp: Date.now(),
        category: 'navigation',
        metadata: { screenName }
      });

      // Target: <200ms
      if (duration > 200) {
        console.warn(`Screen transition to ${screenName} (${duration}ms) exceeds target of 200ms`);
      }

      this.startTimes.delete(key);
    }
  }

  // Image Loading Performance
  startImageLoad(imageId: string, size?: { width: number; height: number }) {
    const key = `image_load_${imageId}`;
    this.startTimes.set(key, performance.now());
  }

  endImageLoad(imageId: string, success: boolean = true) {
    const key = `image_load_${imageId}`;
    const startTime = this.startTimes.get(key);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: 'image_load',
        value: duration,
        timestamp: Date.now(),
        category: 'image',
        metadata: { imageId, success }
      });

      // Target: <300ms
      if (duration > 300 && success) {
        console.warn(`Image load ${imageId} (${duration}ms) exceeds target of 300ms`);
      }

      this.startTimes.delete(key);
    }
  }  // API Performance Tracking
  startAPICall(endpoint: string, method: string = 'GET') {
    const key = `api_${method}_${endpoint}`;
    this.startTimes.set(key, performance.now());
  }

  endAPICall(endpoint: string, method: string = 'GET', statusCode?: number, error?: boolean) {
    const key = `api_${method}_${endpoint}`;
    const startTime = this.startTimes.get(key);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: 'api_call',
        value: duration,
        timestamp: Date.now(),
        category: 'api',
        metadata: { endpoint, method, statusCode, error }
      });

      // Target: <400ms average
      if (duration > 400 && !error) {
        console.warn(`API call ${method} ${endpoint} (${duration}ms) exceeds target of 400ms`);
      }

      this.startTimes.delete(key);
    }
  }

  // Memory Performance Monitoring
  private startMemoryMonitoring() {
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 5000); // Check every 5 seconds
  }

  private checkMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory as MemoryInfo;
      const memoryUsageMB = memInfo.usedJSHeapSize / (1024 * 1024);
      
      this.recordMetric({
        name: 'memory_usage',
        value: memoryUsageMB,
        timestamp: Date.now(),
        category: 'memory',
        metadata: {
          totalHeap: memInfo.totalJSHeapSize / (1024 * 1024),
          heapLimit: memInfo.jsHeapSizeLimit / (1024 * 1024)
        }
      });

      // Target: <150MB peak
      if (memoryUsageMB > 150) {
        console.warn(`Memory usage (${memoryUsageMB.toFixed(2)}MB) exceeds target of 150MB`);
      }
    }
  }

  // Generic Performance Timing
  startTiming(name: string) {
    this.startTimes.set(name, performance.now());
  }

  endTiming(name: string, category: PerformanceMetric['category'] = 'navigation', metadata?: Record<string, any>) {
    const startTime = this.startTimes.get(name);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        category,
        metadata
      });

      this.startTimes.delete(name);
      return duration;
    }
    return 0;
  }

  // Record custom metrics
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Store critical metrics for analysis
    this.persistCriticalMetrics(metric);
  }

  private async persistCriticalMetrics(metric: PerformanceMetric) {
    // Only persist metrics that exceed targets or are startup-related
    const shouldPersist = metric.category === 'startup' || 
      (metric.category === 'navigation' && metric.value > 200) ||
      (metric.category === 'image' && metric.value > 300) ||
      (metric.category === 'api' && metric.value > 400) ||
      (metric.category === 'memory' && metric.value > 150);

    if (shouldPersist) {
      try {
        const existingMetrics = await AsyncStorage.getItem('performance_metrics');
        const metrics = existingMetrics ? JSON.parse(existingMetrics) : [];
        metrics.push(metric);
        
        // Keep only last 100 critical metrics
        const limitedMetrics = metrics.slice(-100);
        await AsyncStorage.setItem('performance_metrics', JSON.stringify(limitedMetrics));
      } catch (error) {
        console.error('Failed to persist performance metric:', error);
      }
    }
  }  // Analytics and Reporting
  getPerformanceReport() {
    const now = Date.now();
    const last24h = this.metrics.filter(m => now - m.timestamp <= 24 * 60 * 60 * 1000);

    const report = {
      period: '24h',
      timestamp: now,
      metrics: {
        startup: this.analyzeMetrics(last24h.filter(m => m.category === 'startup')),
        navigation: this.analyzeMetrics(last24h.filter(m => m.category === 'navigation')),
        images: this.analyzeMetrics(last24h.filter(m => m.category === 'image')),
        api: this.analyzeMetrics(last24h.filter(m => m.category === 'api')),
        memory: this.analyzeMetrics(last24h.filter(m => m.category === 'memory'))
      },
      targets: {
        startup: { target: 1500, unit: 'ms' },
        navigation: { target: 200, unit: 'ms' },
        images: { target: 300, unit: 'ms' },
        api: { target: 400, unit: 'ms' },
        memory: { target: 150, unit: 'MB' }
      }
    };

    return report;
  }

  private analyzeMetrics(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  private handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'active') {
      this.recordMetric({
        name: 'app_foreground',
        value: Date.now() - this.appStartTime,
        timestamp: Date.now(),
        category: 'startup'
      });
    }
  };

  // Cleanup
  dispose() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.startTimes.clear();
  }
}

// Singleton instance
export const PerformanceMonitor = new PerformanceMonitorService();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    startTiming: PerformanceMonitor.startTiming.bind(PerformanceMonitor),
    endTiming: PerformanceMonitor.endTiming.bind(PerformanceMonitor),
    startScreenTransition: PerformanceMonitor.startScreenTransition.bind(PerformanceMonitor),
    endScreenTransition: PerformanceMonitor.endScreenTransition.bind(PerformanceMonitor),
    startImageLoad: PerformanceMonitor.startImageLoad.bind(PerformanceMonitor),
    endImageLoad: PerformanceMonitor.endImageLoad.bind(PerformanceMonitor),
    startAPICall: PerformanceMonitor.startAPICall.bind(PerformanceMonitor),
    endAPICall: PerformanceMonitor.endAPICall.bind(PerformanceMonitor),
    recordMetric: PerformanceMonitor.recordMetric.bind(PerformanceMonitor),
    getReport: PerformanceMonitor.getPerformanceReport.bind(PerformanceMonitor)
  };
}

export default PerformanceMonitor;