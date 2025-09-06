import AsyncStorage from '@react-native-async-storage/async-storage';
import { CDNIntegrationService } from './CDNIntegrationService';
import { EnhancedCacheManager } from './EnhancedCacheManager';
import { ImageOptimizationService } from './ImageOptimizationService';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PredictiveLoadingService } from './PredictiveLoadingService';

interface CacheMetrics {
  // Hit/Miss Ratios
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  
  // Performance Metrics
  averageHitTime: number;
  averageMissTime: number;
  totalResponseTime: number;
  
  // Memory Metrics
  memoryUsage: number;
  memoryUtilization: number;
  memoryFragmentation: number;
  
  // Storage Metrics
  diskUsage: number;
  compressionRatio: number;
  
  // Network Metrics
  networkSavings: number;
  bytesServedFromCache: number;
  bytesDownloaded: number;
  
  // Efficiency Metrics
  evictionRate: number;
  prefetchAccuracy: number;
  lazyLoadingEfficiency: number;
}

interface CacheEvent {
  id: string;
  timestamp: number;
  type: 'hit' | 'miss' | 'eviction' | 'prefetch' | 'error';
  key: string;
  duration: number;
  size?: number;
  source: 'memory' | 'disk' | 'network' | 'cdn';
  metadata?: Record<string, any>;
}

interface PerformanceAlert {
  id: string;
  type: 'performance_degradation' | 'memory_pressure' | 'high_miss_rate' | 'network_issues';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: Record<string, number>;
  timestamp: number;
  acknowledged: boolean;
  actions?: string[];
}

interface CacheTrend {
  period: 'hour' | 'day' | 'week' | 'month';
  metrics: CacheMetrics[];
  timestamps: number[];
  predictions?: CacheMetrics[];
}

interface OptimizationRecommendation {
  id: string;
  type: 'cache_size' | 'eviction_policy' | 'prefetch_strategy' | 'compression' | 'ttl_adjustment';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImprovement: string;
  implementation: string;
  impactScore: number;
}

class CacheAnalyticsServiceClass {
  private metrics: CacheMetrics;
  private events: CacheEvent[] = [];
  private alerts: PerformanceAlert[] = [];
  private trends: Map<string, CacheTrend> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private alertThresholds: Record<string, number>;
  private maxEventsHistory = 1000;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.alertThresholds = {
      hitRatio: 0.7, // Alert if hit ratio drops below 70%
      memoryUtilization: 0.85, // Alert if memory utilization exceeds 85%
      averageResponseTime: 500, // Alert if average response time exceeds 500ms
      evictionRate: 0.1, // Alert if eviction rate exceeds 10%
      networkLatency: 1000, // Alert if network latency exceeds 1s
      errorRate: 0.05 // Alert if error rate exceeds 5%
    };

    this.initialize();
  }

  private initializeMetrics(): CacheMetrics {
    return {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRatio: 0,
      averageHitTime: 0,
      averageMissTime: 0,
      totalResponseTime: 0,
      memoryUsage: 0,
      memoryUtilization: 0,
      memoryFragmentation: 0,
      diskUsage: 0,
      compressionRatio: 1.0,
      networkSavings: 0,
      bytesServedFromCache: 0,
      bytesDownloaded: 0,
      evictionRate: 0,
      prefetchAccuracy: 0,
      lazyLoadingEfficiency: 0
    };
  }

  private async initialize() {
    try {
      await this.loadStoredData();
      this.startMonitoring();
      console.log('Cache Analytics Service initialized');
    } catch (error) {
      console.error('Failed to initialize Cache Analytics Service:', error);
    }
  }

  // Real-time Monitoring
  startMonitoring(interval: number = 10000) { // 10 seconds default
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.analyzePerformance();
      await this.updateTrends();
      await this.checkAlerts();
    }, interval);

    console.log(`Cache monitoring started with ${interval}ms interval`);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('Cache monitoring stopped');
  }

  private async collectMetrics() {
    try {
      // Collect metrics from all cache services
      const enhancedCacheStats = EnhancedCacheManager.getStatistics();
      const cdnStats = CDNIntegrationService.getMetrics();
      const imageStats = ImageOptimizationService.getOptimizationStats();
      const predictiveStats = PredictiveLoadingService.getMetrics();

      // Update consolidated metrics
      this.updateConsolidatedMetrics(enhancedCacheStats, cdnStats, imageStats, predictiveStats);

      // Record performance snapshot
      await this.recordPerformanceSnapshot();

    } catch (error) {
      console.error('Failed to collect cache metrics:', error);
    }
  }

  private updateConsolidatedMetrics(
    cacheStats: any,
    cdnStats: any,
    imageStats: any,
    predictiveStats: any
  ) {
    // Consolidate hit/miss ratios
    this.metrics.totalRequests = cacheStats.totalRequests + cdnStats.totalRequests;
    this.metrics.cacheHits = cacheStats.hitCount + cdnStats.cacheHits;
    this.metrics.cacheMisses = cacheStats.missCount + cdnStats.cacheMisses;
    this.metrics.hitRatio = this.metrics.totalRequests > 0 
      ? this.metrics.cacheHits / this.metrics.totalRequests 
      : 0;

    // Consolidate memory metrics
    this.metrics.memoryUsage = cacheStats.memoryUsage;
    this.metrics.memoryUtilization = cacheStats.usagePercentage / 100;
    this.metrics.diskUsage = cacheStats.diskUsage + imageStats.totalOptimizedSize;

    // Consolidate network metrics
    this.metrics.networkSavings = cdnStats.compressionSavings + 
      (imageStats.totalOriginalSize - imageStats.totalOptimizedSize);
    this.metrics.bytesServedFromCache = cacheStats.memoryUsage + cacheStats.diskUsage;
    this.metrics.bytesDownloaded = cdnStats.dataTransferred;

    // Consolidate efficiency metrics
    this.metrics.evictionRate = cacheStats.evictionCount / Math.max(this.metrics.totalRequests, 1);
    this.metrics.prefetchAccuracy = predictiveStats.totalPredictions > 0 
      ? predictiveStats.successfulPredictions / predictiveStats.totalPredictions 
      : 0;
    this.metrics.compressionRatio = imageStats.averageCompressionRatio;
  }

  // Event Tracking
  recordEvent(event: Omit<CacheEvent, 'id' | 'timestamp'>) {
    const fullEvent: CacheEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...event
    };

    this.events.push(fullEvent);

    // Maintain event history limit
    if (this.events.length > this.maxEventsHistory) {
      this.events = this.events.slice(-Math.floor(this.maxEventsHistory * 0.8));
    }

    // Update real-time metrics based on event
    this.updateMetricsFromEvent(fullEvent);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateMetricsFromEvent(event: CacheEvent) {
    this.metrics.totalRequests++;

    switch (event.type) {
      case 'hit':
        this.metrics.cacheHits++;
        this.updateAverageTime('hit', event.duration);
        if (event.size) {
          this.metrics.bytesServedFromCache += event.size;
        }
        break;

      case 'miss':
        this.metrics.cacheMisses++;
        this.updateAverageTime('miss', event.duration);
        if (event.size) {
          this.metrics.bytesDownloaded += event.size;
        }
        break;

      case 'eviction':
        // Handled in consolidated metrics
        break;
    }

    // Update hit ratio
    this.metrics.hitRatio = this.metrics.totalRequests > 0 
      ? this.metrics.cacheHits / this.metrics.totalRequests 
      : 0;
  }

  private updateAverageTime(type: 'hit' | 'miss', duration: number) {
    const alpha = 0.1; // Exponential moving average factor
    
    if (type === 'hit') {
      this.metrics.averageHitTime = this.metrics.averageHitTime * (1 - alpha) + duration * alpha;
    } else {
      this.metrics.averageMissTime = this.metrics.averageMissTime * (1 - alpha) + duration * alpha;
    }

    this.metrics.totalResponseTime = 
      (this.metrics.averageHitTime * this.metrics.cacheHits + 
       this.metrics.averageMissTime * this.metrics.cacheMisses) / 
      Math.max(this.metrics.totalRequests, 1);
  }

  // Performance Analysis
  private async analyzePerformance() {
    try {
      // Analyze recent performance trends
      const recentEvents = this.getRecentEvents(5 * 60 * 1000); // Last 5 minutes
      
      if (recentEvents.length === 0) return;

      // Calculate recent metrics
      const recentMetrics = this.calculateMetricsFromEvents(recentEvents);
      
      // Compare with historical averages
      const performanceInsights = this.generatePerformanceInsights(recentMetrics);
      
      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(recentMetrics);
      
      // Update performance history
      await this.updatePerformanceHistory(recentMetrics);

    } catch (error) {
      console.error('Performance analysis failed:', error);
    }
  }

  private getRecentEvents(timeWindow: number): CacheEvent[] {
    const cutoff = Date.now() - timeWindow;
    return this.events.filter(event => event.timestamp >= cutoff);
  }

  private calculateMetricsFromEvents(events: CacheEvent[]): CacheMetrics {
    const metrics = this.initializeMetrics();
    
    events.forEach(event => {
      metrics.totalRequests++;
      
      if (event.type === 'hit') {
        metrics.cacheHits++;
        metrics.averageHitTime = (metrics.averageHitTime * (metrics.cacheHits - 1) + event.duration) / metrics.cacheHits;
      } else if (event.type === 'miss') {
        metrics.cacheMisses++;
        metrics.averageMissTime = (metrics.averageMissTime * (metrics.cacheMisses - 1) + event.duration) / metrics.cacheMisses;
      }
      
      if (event.size) {
        if (event.type === 'hit') {
          metrics.bytesServedFromCache += event.size;
        } else {
          metrics.bytesDownloaded += event.size;
        }
      }
    });

    metrics.hitRatio = metrics.totalRequests > 0 ? metrics.cacheHits / metrics.totalRequests : 0;
    metrics.totalResponseTime = (metrics.averageHitTime * metrics.cacheHits + 
                                metrics.averageMissTime * metrics.cacheMisses) / 
                               Math.max(metrics.totalRequests, 1);

    return metrics;
  }

  private generatePerformanceInsights(metrics: CacheMetrics): string[] {
    const insights: string[] = [];

    // Hit ratio insights
    if (metrics.hitRatio < 0.5) {
      insights.push('Low cache hit ratio detected. Consider increasing cache size or improving prefetch strategy.');
    } else if (metrics.hitRatio > 0.9) {
      insights.push('Excellent cache hit ratio. Current strategy is performing very well.');
    }

    // Response time insights
    if (metrics.totalResponseTime > 500) {
      insights.push('High response times detected. Consider optimizing cache lookup or network performance.');
    }

    // Memory utilization insights
    if (metrics.memoryUtilization > 0.9) {
      insights.push('High memory utilization. Consider implementing more aggressive eviction policies.');
    }

    // Network efficiency insights
    const networkEfficiency = metrics.networkSavings / Math.max(metrics.bytesDownloaded, 1);
    if (networkEfficiency < 0.3) {
      insights.push('Low network efficiency. Consider enabling compression and optimizing asset sizes.');
    }

    return insights;
  }

  // Alert System
  private async checkAlerts() {
    const alerts: PerformanceAlert[] = [];

    // Check hit ratio
    if (this.metrics.hitRatio < this.alertThresholds.hitRatio) {
      alerts.push({
        id: `alert_hit_ratio_${Date.now()}`,
        type: 'high_miss_rate',
        severity: this.metrics.hitRatio < 0.5 ? 'high' : 'medium',
        message: `Cache hit ratio is ${(this.metrics.hitRatio * 100).toFixed(1)}%, below threshold of ${(this.alertThresholds.hitRatio * 100).toFixed(1)}%`,
        metrics: { hitRatio: this.metrics.hitRatio },
        timestamp: Date.now(),
        acknowledged: false,
        actions: [
          'Increase cache size',
          'Improve prefetch strategy',
          'Analyze cache keys for patterns'
        ]
      });
    }

    // Check memory utilization
    if (this.metrics.memoryUtilization > this.alertThresholds.memoryUtilization) {
      alerts.push({
        id: `alert_memory_${Date.now()}`,
        type: 'memory_pressure',
        severity: this.metrics.memoryUtilization > 0.95 ? 'critical' : 'high',
        message: `Memory utilization is ${(this.metrics.memoryUtilization * 100).toFixed(1)}%, exceeding threshold`,
        metrics: { memoryUtilization: this.metrics.memoryUtilization },
        timestamp: Date.now(),
        acknowledged: false,
        actions: [
          'Implement more aggressive eviction',
          'Increase memory allocation',
          'Enable compression'
        ]
      });
    }

    // Check response time
    if (this.metrics.totalResponseTime > this.alertThresholds.averageResponseTime) {
      alerts.push({
        id: `alert_response_time_${Date.now()}`,
        type: 'performance_degradation',
        severity: this.metrics.totalResponseTime > 1000 ? 'high' : 'medium',
        message: `Average response time is ${this.metrics.totalResponseTime.toFixed(0)}ms, exceeding threshold`,
        metrics: { responseTime: this.metrics.totalResponseTime },
        timestamp: Date.now(),
        acknowledged: false,
        actions: [
          'Optimize cache lookup performance',
          'Check network connectivity',
          'Review database query performance'
        ]
      });
    }

    // Add new alerts
    alerts.forEach(alert => {
      // Check if similar alert already exists
      const existingAlert = this.alerts.find(existing => 
        existing.type === alert.type && !existing.acknowledged
      );
      
      if (!existingAlert) {
        this.alerts.push(alert);
        console.warn('Cache Performance Alert:', alert.message);
      }
    });

    // Persist alerts
    await this.persistAlerts();
  }

  // Optimization Recommendations
  private async generateOptimizationRecommendations(metrics: CacheMetrics): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Cache size recommendations
    if (metrics.evictionRate > 0.1) {
      recommendations.push({
        id: `rec_cache_size_${Date.now()}`,
        type: 'cache_size',
        priority: 'high',
        description: 'High eviction rate indicates insufficient cache size',
        expectedImprovement: 'Reduce evictions by 50-70%, improve hit ratio by 10-20%',
        implementation: 'Increase maxMemorySize in EnhancedCacheManager configuration',
        impactScore: 8.5
      });
    }

    // Compression recommendations
    if (metrics.compressionRatio > 0.8 && metrics.diskUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push({
        id: `rec_compression_${Date.now()}`,
        type: 'compression',
        priority: 'medium',
        description: 'Low compression ratio with high disk usage',
        expectedImprovement: 'Reduce storage usage by 20-40%',
        implementation: 'Enable aggressive compression for large assets',
        impactScore: 6.5
      });
    }

    // Prefetch recommendations
    if (metrics.prefetchAccuracy < 0.6) {
      recommendations.push({
        id: `rec_prefetch_${Date.now()}`,
        type: 'prefetch_strategy',
        priority: 'medium',
        description: 'Low prefetch accuracy indicates suboptimal prediction',
        expectedImprovement: 'Improve cache hit ratio by 15-25%',
        implementation: 'Refine machine learning model and user behavior patterns',
        impactScore: 7.0
      });
    }

    // TTL recommendations
    const avgHitMissRatio = metrics.averageHitTime / Math.max(metrics.averageMissTime, 1);
    if (avgHitMissRatio > 0.8) {
      recommendations.push({
        id: `rec_ttl_${Date.now()}`,
        type: 'ttl_adjustment',
        priority: 'low',
        description: 'Hit times are relatively high compared to miss times',
        expectedImprovement: 'Reduce hit times by 10-15%',
        implementation: 'Decrease TTL for frequently accessed items',
        impactScore: 4.5
      });
    }

    // Sort by impact score
    return recommendations.sort((a, b) => b.impactScore - a.impactScore);
  }

  // Trend Analysis
  private async updateTrends() {
    const now = Date.now();
    
    // Update hourly trend
    await this.updateTrend('hour', now, 60 * 60 * 1000); // 1 hour buckets
    
    // Update daily trend
    await this.updateTrend('day', now, 24 * 60 * 60 * 1000); // 1 day buckets
    
    // Update weekly trend (less frequently)
    if (now % (60 * 60 * 1000) < 10000) { // Every hour, check if we need to update weekly
      await this.updateTrend('week', now, 7 * 24 * 60 * 60 * 1000); // 1 week buckets
    }
  }

  private async updateTrend(period: 'hour' | 'day' | 'week', now: number, bucketSize: number) {
    const trendKey = `trend_${period}`;
    let trend = this.trends.get(trendKey);
    
    if (!trend) {
      trend = {
        period,
        metrics: [],
        timestamps: [],
        predictions: []
      };
    }

    // Add current metrics to trend
    const bucketTimestamp = Math.floor(now / bucketSize) * bucketSize;
    
    // Check if we need to add a new data point
    const lastTimestamp = trend.timestamps[trend.timestamps.length - 1];
    if (!lastTimestamp || bucketTimestamp > lastTimestamp) {
      trend.timestamps.push(bucketTimestamp);
      trend.metrics.push({ ...this.metrics });
      
      // Keep only last 24 points for hourly, 30 for daily, 12 for weekly
      const maxPoints = period === 'hour' ? 24 : (period === 'day' ? 30 : 12);
      if (trend.metrics.length > maxPoints) {
        trend.metrics = trend.metrics.slice(-maxPoints);
        trend.timestamps = trend.timestamps.slice(-maxPoints);
      }
      
      // Generate predictions for the trend
      trend.predictions = this.generateTrendPredictions(trend);
      
      this.trends.set(trendKey, trend);
    }
  }

  private generateTrendPredictions(trend: CacheTrend): CacheMetrics[] {
    if (trend.metrics.length < 3) return [];

    // Simple linear regression for predictions
    const recentMetrics = trend.metrics.slice(-5); // Use last 5 data points
    const predictions: CacheMetrics[] = [];

    // Predict next 3 data points
    for (let i = 1; i <= 3; i++) {
      const prediction = { ...this.initializeMetrics() };
      
      // Simple trend extrapolation for key metrics
      prediction.hitRatio = this.predictMetricTrend(recentMetrics.map(m => m.hitRatio), i);
      prediction.memoryUtilization = this.predictMetricTrend(recentMetrics.map(m => m.memoryUtilization), i);
      prediction.totalResponseTime = this.predictMetricTrend(recentMetrics.map(m => m.totalResponseTime), i);
      
      predictions.push(prediction);
    }

    return predictions;
  }

  private predictMetricTrend(values: number[], steps: number): number {
    if (values.length < 2) return values[0] || 0;

    // Calculate simple linear trend
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return intercept + slope * (n - 1 + steps);
  }

  // Public API Methods
  getCurrentMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getRecentEvents(count: number = 50): CacheEvent[] {
    return this.events.slice(-count);
  }

  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.persistAlerts();
    }
  }

  getTrends(period?: 'hour' | 'day' | 'week'): Map<string, CacheTrend> | CacheTrend | undefined {
    if (period) {
      return this.trends.get(`trend_${period}`);
    }
    return this.trends;
  }

  async getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    return await this.generateOptimizationRecommendations(this.metrics);
  }

  getPerformanceReport(): {
    metrics: CacheMetrics;
    insights: string[];
    alerts: PerformanceAlert[];
    recommendations: Promise<OptimizationRecommendation[]>;
    efficiency: {
      cacheEfficiency: number;
      networkEfficiency: number;
      memoryEfficiency: number;
      overallScore: number;
    };
  } {
    const insights = this.generatePerformanceInsights(this.metrics);
    const recommendations = this.generateOptimizationRecommendations(this.metrics);
    
    // Calculate efficiency scores
    const cacheEfficiency = this.metrics.hitRatio;
    const networkEfficiency = this.metrics.networkSavings / Math.max(this.metrics.bytesDownloaded, 1);
    const memoryEfficiency = 1 - this.metrics.memoryUtilization;
    const overallScore = (cacheEfficiency * 0.4 + networkEfficiency * 0.3 + memoryEfficiency * 0.3) * 100;

    return {
      metrics: this.metrics,
      insights,
      alerts: this.getActiveAlerts(),
      recommendations,
      efficiency: {
        cacheEfficiency: cacheEfficiency * 100,
        networkEfficiency: networkEfficiency * 100,
        memoryEfficiency: memoryEfficiency * 100,
        overallScore: Math.round(overallScore)
      }
    };
  }

  updateAlertThresholds(newThresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    this.persistConfiguration();
  }

  // Data Management
  async exportAnalyticsData(): Promise<{
    metrics: CacheMetrics;
    events: CacheEvent[];
    alerts: PerformanceAlert[];
    trends: { period: string; data: CacheTrend }[];
  }> {
    return {
      metrics: this.metrics,
      events: this.events,
      alerts: this.alerts,
      trends: Array.from(this.trends.entries()).map(([period, data]) => ({ period, data }))
    };
  }

  async clearAnalyticsData(): Promise<void> {
    this.metrics = this.initializeMetrics();
    this.events = [];
    this.alerts = [];
    this.trends.clear();
    
    await this.persistData();
    console.log('Cache analytics data cleared');
  }

  // Persistence Methods
  private async loadStoredData(): Promise<void> {
    try {
      // Load metrics
      const storedMetrics = await AsyncStorage.getItem('cache_analytics_metrics');
      if (storedMetrics) {
        this.metrics = { ...this.metrics, ...JSON.parse(storedMetrics) };
      }

      // Load events
      const storedEvents = await AsyncStorage.getItem('cache_analytics_events');
      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }

      // Load alerts
      const storedAlerts = await AsyncStorage.getItem('cache_analytics_alerts');
      if (storedAlerts) {
        this.alerts = JSON.parse(storedAlerts);
      }

      // Load trends
      const storedTrends = await AsyncStorage.getItem('cache_analytics_trends');
      if (storedTrends) {
        const trendsArray = JSON.parse(storedTrends);
        this.trends = new Map(trendsArray);
      }

      // Load configuration
      const storedConfig = await AsyncStorage.getItem('cache_analytics_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.alertThresholds = { ...this.alertThresholds, ...config.alertThresholds };
      }

    } catch (error) {
      console.error('Failed to load stored analytics data:', error);
    }
  }

  private async persistData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('cache_analytics_metrics', JSON.stringify(this.metrics)),
        AsyncStorage.setItem('cache_analytics_events', JSON.stringify(this.events.slice(-this.maxEventsHistory))),
        this.persistAlerts(),
        this.persistTrends(),
        this.persistConfiguration()
      ]);
    } catch (error) {
      console.error('Failed to persist analytics data:', error);
    }
  }

  private async persistAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem('cache_analytics_alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to persist alerts:', error);
    }
  }

  private async persistTrends(): Promise<void> {
    try {
      const trendsArray = Array.from(this.trends.entries());
      await AsyncStorage.setItem('cache_analytics_trends', JSON.stringify(trendsArray));
    } catch (error) {
      console.error('Failed to persist trends:', error);
    }
  }

  private async persistConfiguration(): Promise<void> {
    try {
      const config = {
        alertThresholds: this.alertThresholds
      };
      await AsyncStorage.setItem('cache_analytics_config', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to persist configuration:', error);
    }
  }

  private async recordPerformanceSnapshot(): Promise<void> {
    // Record a performance snapshot every collection cycle
    PerformanceMonitor.recordMetric({
      name: 'cache_performance_snapshot',
      value: this.metrics.hitRatio * 100,
      timestamp: Date.now(),
      category: 'api',
      metadata: {
        hitRatio: this.metrics.hitRatio,
        memoryUtilization: this.metrics.memoryUtilization,
        responseTime: this.metrics.totalResponseTime,
        networkSavings: this.metrics.networkSavings
      }
    });
  }

  private async updatePerformanceHistory(metrics: CacheMetrics): Promise<void> {
    // This could be expanded to maintain a more detailed performance history
    // For now, it's handled by the trends system
  }

  // Cleanup
  dispose(): void {
    this.stopMonitoring();
    this.persistData();
  }
}

export const CacheAnalyticsService = new CacheAnalyticsServiceClass();
export default CacheAnalyticsService;