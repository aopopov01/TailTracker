/**
 * Performance Monitor Service
 * Provides basic performance monitoring capabilities
 */

import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  componentRenderTime: number;
  memoryUsage: number;
  timestamp: number;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetrics[] = [];
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  measureRenderTime<T>(componentName: string, renderFunction: () => T): T {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    const metrics: PerformanceMetrics = {
      componentRenderTime: endTime - startTime,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
    };

    this.recordMetrics(metrics);
    return result;
  }

  startTiming(label: string): () => number {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(metrics));
  }

  addListener(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  private getMemoryUsage(): number {
    // Basic memory estimation (React Native doesn't have access to detailed memory info)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }
}

// Create singleton instance
const performanceMonitorService = new PerformanceMonitorService();

// Hook for using performance monitor in components
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    const unsubscribe = performanceMonitorService.addListener((newMetrics) => {
      setMetrics(performanceMonitorService.getMetrics());
    });

    return unsubscribe;
  }, []);

  const measureRenderTime = useCallback(<T>(componentName: string, renderFunction: () => T): T => {
    return performanceMonitorService.measureRenderTime(componentName, renderFunction);
  }, []);

  const startTiming = useCallback((label: string) => {
    return performanceMonitorService.startTiming(label);
  }, []);

  const endTiming = useCallback((label: string, category?: string, metadata?: any) => {
    // For compatibility - log the end timing
    console.log(`[Performance] ${label} ended`, category, metadata);
  }, []);

  const recordMetrics = useCallback((newMetrics: PerformanceMetrics) => {
    performanceMonitorService.recordMetrics(newMetrics);
  }, []);

  return {
    metrics,
    measureRenderTime,
    startTiming,
    endTiming,
    recordMetrics,
    clearMetrics: performanceMonitorService.clearMetrics.bind(performanceMonitorService),
  };
};

export default performanceMonitorService;