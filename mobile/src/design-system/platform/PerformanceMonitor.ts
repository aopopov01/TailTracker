/**
 * TailTracker Cross-Platform Performance Monitor
 * 
 * Real-time performance monitoring system that tracks and compares
 * performance metrics across iOS and Android platforms.
 */

import { Platform, InteractionManager, DeviceEventEmitter } from 'react-native';
import { platformAdapter } from './PlatformAdapter';

// ====================================
// PERFORMANCE METRIC TYPES
// ====================================

export interface FrameMetrics {
  timestamp: number;
  frameTime: number;
  droppedFrames: number;
  frameLoss: number;
}

export interface MemoryMetrics {
  timestamp: number;
  usedMemory: number;
  totalMemory: number;
  memoryPressure: 'low' | 'medium' | 'high';
}

export interface InteractionMetrics {
  timestamp: number;
  eventType: string;
  responseTime: number;
  componentName?: string;
  successful: boolean;
}

export interface NetworkMetrics {
  timestamp: number;
  url: string;
  method: string;
  responseTime: number;
  dataSize: number;
  success: boolean;
  errorMessage?: string;
}

export interface PerformanceBenchmark {
  platform: string;
  timestamp: string;
  frameMetrics: FrameMetrics[];
  memoryMetrics: MemoryMetrics[];
  interactionMetrics: InteractionMetrics[];
  networkMetrics: NetworkMetrics[];
  overallScore: number;
  recommendations: string[];
}

// ====================================
// PERFORMANCE MONITOR CLASS
// ====================================

export class CrossPlatformPerformanceMonitor {
  private static instance: CrossPlatformPerformanceMonitor;
  private isMonitoring = false;
  private frameMetrics: FrameMetrics[] = [];
  private memoryMetrics: MemoryMetrics[] = [];
  private interactionMetrics: InteractionMetrics[] = [];
  private networkMetrics: NetworkMetrics[] = [];
  private performanceThresholds: any;

  private constructor() {
    this.performanceThresholds = this.getPerformanceThresholds();
  }

  static getInstance(): CrossPlatformPerformanceMonitor {
    if (!CrossPlatformPerformanceMonitor.instance) {
      CrossPlatformPerformanceMonitor.instance = new CrossPlatformPerformanceMonitor();
    }
    return CrossPlatformPerformanceMonitor.instance;
  }

  // ====================================
  // PERFORMANCE THRESHOLDS
  // ====================================

  private getPerformanceThresholds() {
    return {
      frame: {
        maxFrameTime: Platform.OS === 'ios' ? 16.67 : 16.67, // 60fps
        maxDroppedFrames: 2,
        maxFrameLoss: 5, // percentage
      },
      memory: {
        maxMemoryUsage: Platform.select({ ios: 200, android: 150 }), // MB
        pressureThreshold: Platform.select({ ios: 80, android: 70 }), // percentage
      },
      interaction: {
        maxResponseTime: 100, // ms
        targetResponseTime: 50, // ms
      },
      network: {
        maxResponseTime: 3000, // ms
        targetResponseTime: 1000, // ms
      },
    };
  }

  // ====================================
  // MONITORING CONTROLS
  // ====================================

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log(`[TailTracker Performance Monitor] Started monitoring on ${Platform.OS}`);

    // Start frame monitoring
    this.startFrameMonitoring();

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Start interaction monitoring
    this.startInteractionMonitoring();

    // Start network monitoring
    this.startNetworkMonitoring();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('[TailTracker Performance Monitor] Stopped monitoring');
  }

  clearMetrics(): void {
    this.frameMetrics = [];
    this.memoryMetrics = [];
    this.interactionMetrics = [];
    this.networkMetrics = [];
  }

  // ====================================
  // FRAME MONITORING
  // ====================================

  private startFrameMonitoring(): void {
    if (!this.isMonitoring) return;

    // React Native doesn't provide direct frame monitoring API
    // This is a simplified simulation - in production, you'd use
    // performance monitoring libraries like Flipper or custom native modules

    const measureFrame = () => {
      if (!this.isMonitoring) return;

      const timestamp = Date.now();
      const frameTime = Math.random() * 20 + 10; // Simulated frame time
      const droppedFrames = Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0;
      const frameLoss = (droppedFrames / 60) * 100; // percentage

      this.frameMetrics.push({
        timestamp,
        frameTime,
        droppedFrames,
        frameLoss,
      });

      // Keep only last 1000 measurements
      if (this.frameMetrics.length > 1000) {
        this.frameMetrics = this.frameMetrics.slice(-1000);
      }

      // Check for performance issues
      if (frameTime > this.performanceThresholds.frame.maxFrameTime) {
        console.warn(`[Performance] Frame time exceeded threshold: ${frameTime}ms`);
      }

      setTimeout(measureFrame, 1000 / 60); // 60fps monitoring
    };

    measureFrame();
  }

  // ====================================
  // MEMORY MONITORING
  // ====================================

  private startMemoryMonitoring(): void {
    if (!this.isMonitoring) return;

    const measureMemory = () => {
      if (!this.isMonitoring) return;

      // Simulated memory metrics - in production, use native modules
      const timestamp = Date.now();
      const usedMemory = Math.random() * 100 + 50; // MB
      const totalMemory = Platform.select({ ios: 1024, android: 768 }) || 512; // MB
      const memoryPressure = usedMemory > 150 ? 'high' : usedMemory > 100 ? 'medium' : 'low';

      this.memoryMetrics.push({
        timestamp,
        usedMemory,
        totalMemory,
        memoryPressure,
      });

      // Keep only last 100 measurements
      if (this.memoryMetrics.length > 100) {
        this.memoryMetrics = this.memoryMetrics.slice(-100);
      }

      // Check for memory issues
      if (usedMemory > this.performanceThresholds.memory.maxMemoryUsage) {
        console.warn(`[Performance] Memory usage high: ${usedMemory}MB`);
      }

      setTimeout(measureMemory, 5000); // Every 5 seconds
    };

    measureMemory();
  }

  // ====================================
  // INTERACTION MONITORING
  // ====================================

  private startInteractionMonitoring(): void {
    // Set up interaction monitoring using InteractionManager
    const originalRunAfterInteractions = InteractionManager.runAfterInteractions;
    
    InteractionManager.runAfterInteractions = (task?: (() => any) | undefined) => {
      const startTime = Date.now();
      
      return originalRunAfterInteractions(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        this.recordInteraction('interaction', responseTime, undefined, true);
        
        if (task) {
          return task();
        }
      });
    };
  }

  recordInteraction(eventType: string, responseTime: number, componentName?: string, successful = true): void {
    if (!this.isMonitoring) return;

    const interaction: InteractionMetrics = {
      timestamp: Date.now(),
      eventType,
      responseTime,
      componentName,
      successful,
    };

    this.interactionMetrics.push(interaction);

    // Keep only last 500 interactions
    if (this.interactionMetrics.length > 500) {
      this.interactionMetrics = this.interactionMetrics.slice(-500);
    }

    // Check for slow interactions
    if (responseTime > this.performanceThresholds.interaction.maxResponseTime) {
      console.warn(`[Performance] Slow interaction: ${eventType} took ${responseTime}ms`);
    }
  }

  // ====================================
  // NETWORK MONITORING
  // ====================================

  private startNetworkMonitoring(): void {
    // In production, you would intercept fetch or XMLHttpRequest
    // This is a simplified example
    
    const originalFetch = global.fetch;
    
    global.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      const method = args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Estimate data size (simplified)
        const dataSize = parseInt(response.headers.get('content-length') || '0');
        
        this.recordNetworkRequest(url, method, responseTime, dataSize, response.ok);
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        this.recordNetworkRequest(url, method, responseTime, 0, false, (error as Error).message);
        throw error;
      }
    };
  }

  private recordNetworkRequest(
    url: string,
    method: string,
    responseTime: number,
    dataSize: number,
    success: boolean,
    errorMessage?: string
  ): void {
    if (!this.isMonitoring) return;

    const networkMetric: NetworkMetrics = {
      timestamp: Date.now(),
      url,
      method,
      responseTime,
      dataSize,
      success,
      errorMessage,
    };

    this.networkMetrics.push(networkMetric);

    // Keep only last 200 network requests
    if (this.networkMetrics.length > 200) {
      this.networkMetrics = this.networkMetrics.slice(-200);
    }

    // Check for slow network requests
    if (responseTime > this.performanceThresholds.network.maxResponseTime) {
      console.warn(`[Performance] Slow network request: ${method} ${url} took ${responseTime}ms`);
    }
  }

  // ====================================
  // REPORTING AND ANALYSIS
  // ====================================

  generatePerformanceReport(): PerformanceBenchmark {
    const report: PerformanceBenchmark = {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      frameMetrics: [...this.frameMetrics],
      memoryMetrics: [...this.memoryMetrics],
      interactionMetrics: [...this.interactionMetrics],
      networkMetrics: [...this.networkMetrics],
      overallScore: this.calculateOverallScore(),
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  private calculateOverallScore(): number {
    let score = 100;

    // Frame performance impact
    const recentFrameMetrics = this.frameMetrics.slice(-60); // Last second
    const avgFrameTime = recentFrameMetrics.reduce((sum, metric) => sum + metric.frameTime, 0) / recentFrameMetrics.length;
    if (avgFrameTime > this.performanceThresholds.frame.maxFrameTime) {
      score -= 10;
    }

    // Memory performance impact
    const recentMemoryMetric = this.memoryMetrics[this.memoryMetrics.length - 1];
    if (recentMemoryMetric?.usedMemory > this.performanceThresholds.memory.maxMemoryUsage) {
      score -= 15;
    }

    // Interaction performance impact
    const recentInteractions = this.interactionMetrics.slice(-20);
    const avgResponseTime = recentInteractions.reduce((sum, metric) => sum + metric.responseTime, 0) / recentInteractions.length;
    if (avgResponseTime > this.performanceThresholds.interaction.maxResponseTime) {
      score -= 10;
    }

    // Network performance impact
    const recentNetworkRequests = this.networkMetrics.slice(-10);
    const avgNetworkTime = recentNetworkRequests.reduce((sum, metric) => sum + metric.responseTime, 0) / recentNetworkRequests.length;
    if (avgNetworkTime > this.performanceThresholds.network.maxResponseTime) {
      score -= 15;
    }

    // Failed interactions/requests impact
    const failedInteractions = recentInteractions.filter(i => !i.successful).length;
    const failedNetworkRequests = recentNetworkRequests.filter(r => !r.success).length;
    score -= (failedInteractions + failedNetworkRequests) * 5;

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Frame rate recommendations
    const recentFrameMetrics = this.frameMetrics.slice(-60);
    const droppedFramesCount = recentFrameMetrics.reduce((sum, metric) => sum + metric.droppedFrames, 0);
    if (droppedFramesCount > 5) {
      recommendations.push('Optimize animations and reduce UI complexity to improve frame rate');
    }

    // Memory recommendations
    const recentMemoryMetric = this.memoryMetrics[this.memoryMetrics.length - 1];
    if (recentMemoryMetric?.memoryPressure === 'high') {
      recommendations.push('Reduce memory usage by optimizing image sizes and clearing unused references');
    }

    // Interaction recommendations
    const slowInteractions = this.interactionMetrics.filter(
      i => i.responseTime > this.performanceThresholds.interaction.targetResponseTime
    ).length;
    if (slowInteractions > 5) {
      recommendations.push('Optimize touch response times by reducing computation in event handlers');
    }

    // Network recommendations
    const slowNetworkRequests = this.networkMetrics.filter(
      r => r.responseTime > this.performanceThresholds.network.targetResponseTime
    ).length;
    if (slowNetworkRequests > 2) {
      recommendations.push('Improve network performance with request caching and data compression');
    }

    return recommendations;
  }

  // ====================================
  // COMPARISON UTILITIES
  // ====================================

  compareWithBaseline(baseline: PerformanceBenchmark): {
    frameImprovement: number;
    memoryImprovement: number;
    interactionImprovement: number;
    networkImprovement: number;
  } {
    const current = this.generatePerformanceReport();

    const currentAvgFrameTime = current.frameMetrics.reduce((sum, m) => sum + m.frameTime, 0) / current.frameMetrics.length;
    const baselineAvgFrameTime = baseline.frameMetrics.reduce((sum, m) => sum + m.frameTime, 0) / baseline.frameMetrics.length;

    const currentMemoryUsage = current.memoryMetrics[current.memoryMetrics.length - 1]?.usedMemory || 0;
    const baselineMemoryUsage = baseline.memoryMetrics[baseline.memoryMetrics.length - 1]?.usedMemory || 0;

    const currentAvgInteractionTime = current.interactionMetrics.reduce((sum, m) => sum + m.responseTime, 0) / current.interactionMetrics.length;
    const baselineAvgInteractionTime = baseline.interactionMetrics.reduce((sum, m) => sum + m.responseTime, 0) / baseline.interactionMetrics.length;

    const currentAvgNetworkTime = current.networkMetrics.reduce((sum, m) => sum + m.responseTime, 0) / current.networkMetrics.length;
    const baselineAvgNetworkTime = baseline.networkMetrics.reduce((sum, m) => sum + m.responseTime, 0) / baseline.networkMetrics.length;

    return {
      frameImprovement: ((baselineAvgFrameTime - currentAvgFrameTime) / baselineAvgFrameTime) * 100,
      memoryImprovement: ((baselineMemoryUsage - currentMemoryUsage) / baselineMemoryUsage) * 100,
      interactionImprovement: ((baselineAvgInteractionTime - currentAvgInteractionTime) / baselineAvgInteractionTime) * 100,
      networkImprovement: ((baselineAvgNetworkTime - currentAvgNetworkTime) / baselineAvgNetworkTime) * 100,
    };
  }

  // ====================================
  // GETTERS
  // ====================================

  getLatestMetrics() {
    return {
      frame: this.frameMetrics[this.frameMetrics.length - 1],
      memory: this.memoryMetrics[this.memoryMetrics.length - 1],
      interaction: this.interactionMetrics.slice(-5),
      network: this.networkMetrics.slice(-5),
    };
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

// ====================================
// SINGLETON INSTANCE
// ====================================

export const performanceMonitor = CrossPlatformPerformanceMonitor.getInstance();

export default performanceMonitor;