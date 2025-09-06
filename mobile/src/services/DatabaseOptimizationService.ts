import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnhancedCacheManager } from './EnhancedCacheManager';
import { PerformanceMonitor } from './PerformanceMonitor';

interface QueryMetrics {
  queryId: string;
  sql: string;
  executionTime: number;
  resultCount: number;
  cacheHit: boolean;
  timestamp: number;
  parameters?: any[];
  errorMessage?: string;
}

interface QueryPattern {
  pattern: string;
  frequency: number;
  averageExecutionTime: number;
  lastExecuted: number;
  cacheable: boolean;
  indexSuggestions: string[];
  optimizationScore: number;
}

interface QueryOptimizationRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  autoFix?: (query: string) => string;
  impact: number;
}

interface DatabaseIndex {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  unique: boolean;
  size: number;
  usage: number;
  effectiveness: number;
}

interface OptimizationConfig {
  enableQueryCaching: boolean;
  enableQueryRewriting: boolean;
  enableParameterBinding: boolean;
  maxCacheSize: number;
  cacheTTL: number;
  slowQueryThreshold: number;
  maxResultSetSize: number;
  enableBatching: boolean;
  batchSize: number;
  connectionPoolSize: number;
}

class DatabaseOptimizationServiceClass {
  private queryMetrics: Map<string, QueryMetrics[]> = new Map();
  private queryPatterns: Map<string, QueryPattern> = new Map();
  private optimizationRules: QueryOptimizationRule[] = [];
  private suggestedIndexes: DatabaseIndex[] = [];
  private config: OptimizationConfig;
  private queryCache: Map<string, any> = new Map();
  private isMonitoring = false;
  private batchedQueries: { query: string; params: any[]; resolve: Function; reject: Function }[] = [];
  private batchTimeout?: NodeJS.Timeout;

  constructor() {
    this.config = {
      enableQueryCaching: true,
      enableQueryRewriting: true,
      enableParameterBinding: true,
      maxCacheSize: 1000,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      slowQueryThreshold: 1000, // 1 second
      maxResultSetSize: 10000,
      enableBatching: true,
      batchSize: 10,
      connectionPoolSize: 5
    };

    this.initializeOptimizationRules();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.loadStoredData();
      this.startQueryMonitoring();
      this.startPeriodicOptimization();
      console.log('Database Optimization Service initialized');
    } catch (error) {
      console.error('Failed to initialize Database Optimization Service:', error);
    }
  }

  // Query Optimization Rules
  private initializeOptimizationRules() {
    this.optimizationRules = [
      {
        id: 'select_star',
        name: 'Avoid SELECT *',
        description: 'SELECT * can be inefficient and return unnecessary data',
        pattern: /SELECT\s+\*\s+FROM/i,
        severity: 'medium',
        suggestion: 'Specify only the columns you need instead of using SELECT *',
        impact: 6
      },
      {
        id: 'missing_where',
        name: 'Missing WHERE clause',
        description: 'Query without WHERE clause may return too much data',
        pattern: /SELECT\s+.*\s+FROM\s+\w+\s*(?!WHERE)/i,
        severity: 'high',
        suggestion: 'Add a WHERE clause to limit the result set',
        impact: 8
      },
      {
        id: 'function_in_where',
        name: 'Function in WHERE clause',
        description: 'Functions in WHERE clause prevent index usage',
        pattern: /WHERE\s+\w+\([^)]*\w+\.[^)]*\)/i,
        severity: 'high',
        suggestion: 'Avoid functions on columns in WHERE clause',
        impact: 8
      },
      {
        id: 'not_equals',
        name: 'NOT EQUAL operator',
        description: 'NOT EQUAL (!=, <>) operators can be slow',
        pattern: /(!= |<> )/,
        severity: 'medium',
        suggestion: 'Consider using positive conditions instead of NOT EQUAL',
        impact: 5
      },
      {
        id: 'or_conditions',
        name: 'Multiple OR conditions',
        description: 'Multiple OR conditions can prevent efficient index usage',
        pattern: /\bOR\b.*\bOR\b/i,
        severity: 'medium',
        suggestion: 'Consider using UNION or IN clause instead of multiple ORs',
        autoFix: (query: string) => this.optimizeOrConditions(query),
        impact: 6
      },
      {
        id: 'like_prefix',
        name: 'LIKE with leading wildcard',
        description: 'LIKE patterns starting with % prevent index usage',
        pattern: /LIKE\s+['"]%/i,
        severity: 'high',
        suggestion: 'Avoid leading wildcards in LIKE patterns',
        impact: 8
      },
      {
        id: 'subquery_in_select',
        name: 'Subquery in SELECT',
        description: 'Subqueries in SELECT can be inefficient',
        pattern: /SELECT\s+.*\(\s*SELECT/i,
        severity: 'medium',
        suggestion: 'Consider using JOINs instead of subqueries in SELECT',
        impact: 7
      },
      {
        id: 'missing_limit',
        name: 'Missing LIMIT clause',
        description: 'Queries without LIMIT may return too many rows',
        pattern: /SELECT\s+.*FROM.*(?!LIMIT)/is,
        severity: 'low',
        suggestion: 'Add LIMIT clause for large result sets',
        impact: 4
      }
    ];
  }

  // Query Execution and Monitoring
  async executeQuery(
    sql: string, 
    parameters: any[] = [], 
    options: {
      useCache?: boolean;
      cacheTTL?: number;
      enableOptimization?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<any> {
    const startTime = performance.now();
    const queryId = this.generateQueryId(sql, parameters);
    
    try {
      // Check cache first
      if (options.useCache !== false && this.config.enableQueryCaching) {
        const cached = await this.getCachedResult(queryId);
        if (cached) {
          this.recordQueryMetrics({
            queryId,
            sql,
            executionTime: performance.now() - startTime,
            resultCount: Array.isArray(cached) ? cached.length : 1,
            cacheHit: true,
            timestamp: Date.now(),
            parameters
          });
          
          return cached;
        }
      }

      // Optimize query if enabled
      let optimizedSql = sql;
      if (options.enableOptimization !== false && this.config.enableQueryRewriting) {
        optimizedSql = await this.optimizeQuery(sql);
      }

      // Execute query (this would integrate with your actual database client)
      const result = await this.performDatabaseQuery(optimizedSql, parameters, options);

      // Cache result if applicable
      if (options.useCache !== false && this.shouldCacheQuery(sql, result)) {
        await this.cacheQueryResult(queryId, result, options.cacheTTL || this.config.cacheTTL);
      }

      // Record metrics
      this.recordQueryMetrics({
        queryId,
        sql: optimizedSql,
        executionTime: performance.now() - startTime,
        resultCount: Array.isArray(result) ? result.length : 1,
        cacheHit: false,
        timestamp: Date.now(),
        parameters
      });

      return result;

    } catch (error) {
      this.recordQueryMetrics({
        queryId,
        sql,
        executionTime: performance.now() - startTime,
        resultCount: 0,
        cacheHit: false,
        timestamp: Date.now(),
        parameters,
        errorMessage: error.message
      });

      throw error;
    }
  }

  private async performDatabaseQuery(sql: string, parameters: any[], options: any): Promise<any> {
    // This would integrate with your actual database client (Supabase, SQLite, etc.)
    // For demonstration, we'll simulate database execution
    
    const simulatedDelay = this.estimateQueryTime(sql);
    await new Promise(resolve => setTimeout(resolve, simulatedDelay));

    // Simulate different result types
    if (sql.toLowerCase().includes('select')) {
      const resultCount = Math.floor(Math.random() * 100) + 1;
      return Array.from({ length: Math.min(resultCount, options.maxResults || 1000) }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        created_at: new Date().toISOString()
      }));
    } else {
      return { affected: Math.floor(Math.random() * 10) + 1 };
    }
  }

  private estimateQueryTime(sql: string): number {
    let baseTime = 50; // Base 50ms

    // Add time based on query complexity
    if (sql.toLowerCase().includes('join')) baseTime += 100;
    if (sql.toLowerCase().includes('group by')) baseTime += 80;
    if (sql.toLowerCase().includes('order by')) baseTime += 60;
    if (sql.toLowerCase().includes('subquery') || sql.includes('(SELECT')) baseTime += 200;

    // Add random variation
    return baseTime + Math.random() * 200;
  }

  // Query Optimization
  private async optimizeQuery(sql: string): Promise<string> {
    let optimizedSql = sql;

    // Apply optimization rules
    for (const rule of this.optimizationRules) {
      if (rule.pattern.test(optimizedSql)) {
        if (rule.autoFix) {
          optimizedSql = rule.autoFix(optimizedSql);
          console.log(`Applied optimization rule: ${rule.name}`);
        }
      }
    }

    // Additional query optimizations
    optimizedSql = this.optimizeJoins(optimizedSql);
    optimizedSql = this.optimizeWhereClause(optimizedSql);
    optimizedSql = this.addMissingIndexHints(optimizedSql);

    return optimizedSql;
  }

  private optimizeOrConditions(query: string): string {
    // Convert multiple OR conditions to IN clause where possible
    // This is a simplified implementation
    const orPattern = /(\w+)\s*=\s*'([^']+)'\s+OR\s+(\w+)\s*=\s*'([^']+)'/gi;
    
    return query.replace(orPattern, (match, col1, val1, col2, val2) => {
      if (col1 === col2) {
        return `${col1} IN ('${val1}', '${val2}')`;
      }
      return match;
    });
  }

  private optimizeJoins(query: string): string {
    // Reorder joins to put most selective conditions first
    // This is a simplified implementation
    return query;
  }

  private optimizeWhereClause(query: string): string {
    // Optimize WHERE clause ordering
    // Put most selective conditions first
    return query;
  }

  private addMissingIndexHints(query: string): string {
    // Add index hints where beneficial
    // This would analyze the query structure and suggest indexes
    return query;
  }

  // Query Analysis and Pattern Recognition
  private recordQueryMetrics(metrics: QueryMetrics) {
    const pattern = this.extractQueryPattern(metrics.sql);
    
    // Store individual query metrics
    const existing = this.queryMetrics.get(metrics.queryId) || [];
    existing.push(metrics);
    
    // Keep only last 100 executions per query
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    this.queryMetrics.set(metrics.queryId, existing);

    // Update query patterns
    this.updateQueryPattern(pattern, metrics);

    // Check for performance issues
    this.analyzeQueryPerformance(metrics);

    // Persist metrics periodically
    if (Math.random() < 0.1) { // 10% chance to persist
      this.persistMetrics();
    }
  }

  private extractQueryPattern(sql: string): string {
    // Extract a normalized pattern from the SQL query
    return sql
      .replace(/\b\d+\b/g, '?') // Replace numbers with placeholders
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  private updateQueryPattern(pattern: string, metrics: QueryMetrics) {
    let queryPattern = this.queryPatterns.get(pattern);
    
    if (!queryPattern) {
      queryPattern = {
        pattern,
        frequency: 0,
        averageExecutionTime: 0,
        lastExecuted: 0,
        cacheable: this.isQueryCacheable(pattern),
        indexSuggestions: [],
        optimizationScore: 0
      };
    }

    // Update pattern statistics
    queryPattern.frequency++;
    queryPattern.averageExecutionTime = 
      (queryPattern.averageExecutionTime * (queryPattern.frequency - 1) + metrics.executionTime) / queryPattern.frequency;
    queryPattern.lastExecuted = metrics.timestamp;
    
    // Calculate optimization score
    queryPattern.optimizationScore = this.calculateOptimizationScore(pattern, queryPattern);

    // Generate index suggestions
    queryPattern.indexSuggestions = this.generateIndexSuggestions(pattern);

    this.queryPatterns.set(pattern, queryPattern);
  }

  private calculateOptimizationScore(pattern: string, queryPattern: QueryPattern): number {
    let score = 10; // Start with perfect score

    // Reduce score for slow queries
    if (queryPattern.averageExecutionTime > this.config.slowQueryThreshold) {
      score -= 4;
    }

    // Reduce score for optimization rule violations
    for (const rule of this.optimizationRules) {
      if (rule.pattern.test(pattern)) {
        score -= rule.impact * 0.1;
      }
    }

    return Math.max(0, Math.min(10, score));
  }

  private generateIndexSuggestions(pattern: string): string[] {
    const suggestions: string[] = [];
    
    // Extract table names
    const tableMatches = pattern.match(/from\s+(\w+)/gi);
    if (tableMatches) {
      const tables = tableMatches.map(match => match.split(' ')[1]);
      
      // Extract WHERE clause columns
      const whereMatches = pattern.match(/where\s+.*?(\w+)\s*[=<>]/gi);
      if (whereMatches) {
        const columns = whereMatches.map(match => {
          const parts = match.split(/[=<>]/);
          return parts[0].replace(/where\s+/i, '').trim();
        });
        
        tables.forEach(table => {
          columns.forEach(column => {
            suggestions.push(`CREATE INDEX idx_${table}_${column} ON ${table}(${column})`);
          });
        });
      }

      // Extract JOIN columns
      const joinMatches = pattern.match(/join\s+\w+\s+on\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)/gi);
      if (joinMatches) {
        joinMatches.forEach(match => {
          const parts = match.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
          if (parts) {
            suggestions.push(`CREATE INDEX idx_${parts[1]}_${parts[2]} ON ${parts[1]}(${parts[2]})`);
            suggestions.push(`CREATE INDEX idx_${parts[3]}_${parts[4]} ON ${parts[3]}(${parts[4]})`);
          }
        });
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  private analyzeQueryPerformance(metrics: QueryMetrics) {
    // Check for slow queries
    if (metrics.executionTime > this.config.slowQueryThreshold) {
      console.warn(`Slow query detected: ${metrics.queryId} (${metrics.executionTime}ms)`);
      
      // Record slow query event
      PerformanceMonitor.recordMetric({
        name: 'slow_database_query',
        value: metrics.executionTime,
        timestamp: Date.now(),
        category: 'api',
        metadata: {
          queryId: metrics.queryId,
          resultCount: metrics.resultCount,
          sql: metrics.sql.substring(0, 100) // First 100 chars
        }
      });
    }

    // Check for large result sets
    if (metrics.resultCount > this.config.maxResultSetSize) {
      console.warn(`Large result set: ${metrics.queryId} (${metrics.resultCount} rows)`);
    }
  }

  // Query Caching
  private async getCachedResult(queryId: string): Promise<any> {
    try {
      const cached = await EnhancedCacheManager.get(`db_query_${queryId}`);
      return cached;
    } catch (error) {
      console.error('Failed to get cached query result:', error);
      return null;
    }
  }

  private async cacheQueryResult(queryId: string, result: any, ttl: number): Promise<void> {
    try {
      await EnhancedCacheManager.set(
        `db_query_${queryId}`,
        result,
        {
          ttl,
          priority: 'medium',
          enableCompression: Array.isArray(result) && result.length > 10
        }
      );
    } catch (error) {
      console.error('Failed to cache query result:', error);
    }
  }

  private shouldCacheQuery(sql: string, result: any): boolean {
    // Don't cache writes
    if (/^(INSERT|UPDATE|DELETE)/i.test(sql.trim())) {
      return false;
    }

    // Don't cache very large results
    if (Array.isArray(result) && result.length > this.config.maxResultSetSize) {
      return false;
    }

    // Don't cache queries with functions that return current time
    if (/NOW\(\)|CURRENT_TIMESTAMP/i.test(sql)) {
      return false;
    }

    return true;
  }

  private isQueryCacheable(pattern: string): boolean {
    return this.shouldCacheQuery(pattern, []);
  }

  private generateQueryId(sql: string, parameters: any[]): string {
    const normalized = this.extractQueryPattern(sql);
    const paramString = parameters.length > 0 ? JSON.stringify(parameters) : '';
    return btoa(`${normalized}_${paramString}`).replace(/[/+=]/g, '').substring(0, 16);
  }

  // Query Batching
  async batchQuery(sql: string, parameters: any[] = []): Promise<any> {
    if (!this.config.enableBatching) {
      return this.executeQuery(sql, parameters);
    }

    return new Promise((resolve, reject) => {
      this.batchedQueries.push({ query: sql, params: parameters, resolve, reject });

      if (this.batchedQueries.length >= this.config.batchSize) {
        this.executeBatch();
      } else if (!this.batchTimeout) {
        // Execute batch after 100ms if not full
        this.batchTimeout = setTimeout(() => this.executeBatch(), 100);
      }
    });
  }

  private async executeBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }

    const batch = [...this.batchedQueries];
    this.batchedQueries = [];

    if (batch.length === 0) return;

    try {
      // Execute all queries in parallel
      const results = await Promise.allSettled(
        batch.map(item => this.executeQuery(item.query, item.params))
      );

      // Resolve/reject individual promises
      results.forEach((result, index) => {
        const item = batch[index];
        if (result.status === 'fulfilled') {
          item.resolve(result.value);
        } else {
          item.reject(result.reason);
        }
      });

    } catch (error) {
      // Reject all if batch execution fails
      batch.forEach(item => item.reject(error));
    }
  }

  // Performance Monitoring
  private startQueryMonitoring() {
    this.isMonitoring = true;
    // Query monitoring is handled through the recordQueryMetrics method
  }

  private startPeriodicOptimization() {
    // Run optimization analysis every 5 minutes
    setInterval(async () => {
      await this.performPeriodicOptimization();
    }, 5 * 60 * 1000);
  }

  private async performPeriodicOptimization() {
    try {
      // Analyze query patterns
      this.analyzeQueryPatterns();
      
      // Generate index recommendations
      await this.generateIndexRecommendations();
      
      // Clean up old metrics
      this.cleanupOldMetrics();
      
      // Persist optimization data
      await this.persistOptimizationData();

    } catch (error) {
      console.error('Periodic optimization failed:', error);
    }
  }

  private analyzeQueryPatterns() {
    const patterns = Array.from(this.queryPatterns.values());
    
    // Find frequently executed slow queries
    const slowFrequentQueries = patterns.filter(p => 
      p.frequency > 10 && 
      p.averageExecutionTime > this.config.slowQueryThreshold
    );

    if (slowFrequentQueries.length > 0) {
      console.warn(`Found ${slowFrequentQueries.length} frequently executed slow queries`);
    }

    // Find queries with poor optimization scores
    const poorlyOptimizedQueries = patterns.filter(p => p.optimizationScore < 5);
    
    if (poorlyOptimizedQueries.length > 0) {
      console.warn(`Found ${poorlyOptimizedQueries.length} poorly optimized queries`);
    }
  }

  private async generateIndexRecommendations() {
    const recommendations = new Map<string, number>();

    // Collect all index suggestions
    for (const pattern of this.queryPatterns.values()) {
      if (pattern.frequency > 5) { // Only for queries executed more than 5 times
        pattern.indexSuggestions.forEach(suggestion => {
          const current = recommendations.get(suggestion) || 0;
          recommendations.set(suggestion, current + pattern.frequency);
        });
      }
    }

    // Sort by frequency and keep top recommendations
    this.suggestedIndexes = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([suggestion, frequency]) => this.parseIndexSuggestion(suggestion, frequency));
  }

  private parseIndexSuggestion(suggestion: string, frequency: number): DatabaseIndex {
    // Parse CREATE INDEX statement to extract components
    const match = suggestion.match(/CREATE INDEX (\w+) ON (\w+)\(([^)]+)\)/);
    
    if (match) {
      return {
        table: match[2],
        columns: match[3].split(',').map(col => col.trim()),
        type: 'btree', // Default type
        unique: false,
        size: 0, // Would be calculated based on table size
        usage: frequency,
        effectiveness: this.calculateIndexEffectiveness(match[2], match[3])
      };
    }

    return {
      table: 'unknown',
      columns: [],
      type: 'btree',
      unique: false,
      size: 0,
      usage: frequency,
      effectiveness: 0
    };
  }

  private calculateIndexEffectiveness(table: string, columns: string): number {
    // Estimate index effectiveness based on query patterns
    // This would be more sophisticated in a real implementation
    return Math.random() * 10; // Placeholder
  }

  private cleanupOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    // Clean up old query metrics
    for (const [queryId, metrics] of this.queryMetrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      if (filtered.length === 0) {
        this.queryMetrics.delete(queryId);
      } else {
        this.queryMetrics.set(queryId, filtered);
      }
    }

    // Clean up old query patterns
    for (const [pattern, data] of this.queryPatterns.entries()) {
      if (data.lastExecuted < cutoff && data.frequency < 5) {
        this.queryPatterns.delete(pattern);
      }
    }
  }

  // Public API
  getQueryAnalytics(): {
    totalQueries: number;
    slowQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    topSlowQueries: { pattern: string; avgTime: number; frequency: number }[];
    optimizationScore: number;
  } {
    const allMetrics = Array.from(this.queryMetrics.values()).flat();
    const patterns = Array.from(this.queryPatterns.values());

    const totalQueries = allMetrics.length;
    const slowQueries = allMetrics.filter(m => m.executionTime > this.config.slowQueryThreshold).length;
    const cacheHits = allMetrics.filter(m => m.cacheHit).length;
    const averageExecutionTime = totalQueries > 0 
      ? allMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
      : 0;

    const topSlowQueries = patterns
      .filter(p => p.averageExecutionTime > this.config.slowQueryThreshold)
      .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime)
      .slice(0, 10)
      .map(p => ({
        pattern: p.pattern,
        avgTime: p.averageExecutionTime,
        frequency: p.frequency
      }));

    const averageOptimizationScore = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.optimizationScore, 0) / patterns.length
      : 10;

    return {
      totalQueries,
      slowQueries,
      averageExecutionTime,
      cacheHitRate: totalQueries > 0 ? cacheHits / totalQueries : 0,
      topSlowQueries,
      optimizationScore: averageOptimizationScore
    };
  }

  getIndexRecommendations(): DatabaseIndex[] {
    return [...this.suggestedIndexes];
  }

  getOptimizationRules(): QueryOptimizationRule[] {
    return [...this.optimizationRules];
  }

  analyzeQuery(sql: string): {
    issues: { rule: string; severity: string; suggestion: string }[];
    optimizationScore: number;
    estimatedTime: number;
    indexSuggestions: string[];
  } {
    const issues: { rule: string; severity: string; suggestion: string }[] = [];
    let score = 10;

    // Check against optimization rules
    for (const rule of this.optimizationRules) {
      if (rule.pattern.test(sql)) {
        issues.push({
          rule: rule.name,
          severity: rule.severity,
          suggestion: rule.suggestion
        });
        score -= rule.impact * 0.1;
      }
    }

    const pattern = this.extractQueryPattern(sql);
    const indexSuggestions = this.generateIndexSuggestions(pattern);
    const estimatedTime = this.estimateQueryTime(sql);

    return {
      issues,
      optimizationScore: Math.max(0, Math.min(10, score)),
      estimatedTime,
      indexSuggestions
    };
  }

  updateConfiguration(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.persistConfiguration();
  }

  // Cache Management
  async clearQueryCache(): Promise<void> {
    this.queryCache.clear();
    
    // Clear cache manager entries
    const keys = await AsyncStorage.getAllKeys();
    const dbQueryKeys = keys.filter(key => key.startsWith('db_query_'));
    await AsyncStorage.multiRemove(dbQueryKeys);
    
    console.log('Query cache cleared');
  }

  // Data Persistence
  private async loadStoredData(): Promise<void> {
    try {
      // Load query patterns
      const storedPatterns = await AsyncStorage.getItem('db_optimization_patterns');
      if (storedPatterns) {
        const patternsArray = JSON.parse(storedPatterns);
        this.queryPatterns = new Map(patternsArray);
      }

      // Load suggested indexes
      const storedIndexes = await AsyncStorage.getItem('db_optimization_indexes');
      if (storedIndexes) {
        this.suggestedIndexes = JSON.parse(storedIndexes);
      }

      // Load configuration
      const storedConfig = await AsyncStorage.getItem('db_optimization_config');
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }

    } catch (error) {
      console.error('Failed to load stored optimization data:', error);
    }
  }

  private async persistOptimizationData(): Promise<void> {
    try {
      await Promise.all([
        this.persistQueryPatterns(),
        this.persistIndexRecommendations(),
        this.persistConfiguration()
      ]);
    } catch (error) {
      console.error('Failed to persist optimization data:', error);
    }
  }

  private async persistMetrics(): Promise<void> {
    // Persist a subset of recent metrics to avoid storage bloat
    const recentMetrics = new Map<string, QueryMetrics[]>();
    
    for (const [queryId, metrics] of this.queryMetrics.entries()) {
      const recent = metrics.slice(-10); // Keep last 10 executions
      if (recent.length > 0) {
        recentMetrics.set(queryId, recent);
      }
    }

    try {
      const metricsArray = Array.from(recentMetrics.entries());
      await AsyncStorage.setItem('db_optimization_metrics', JSON.stringify(metricsArray));
    } catch (error) {
      console.error('Failed to persist query metrics:', error);
    }
  }

  private async persistQueryPatterns(): Promise<void> {
    try {
      const patternsArray = Array.from(this.queryPatterns.entries());
      await AsyncStorage.setItem('db_optimization_patterns', JSON.stringify(patternsArray));
    } catch (error) {
      console.error('Failed to persist query patterns:', error);
    }
  }

  private async persistIndexRecommendations(): Promise<void> {
    try {
      await AsyncStorage.setItem('db_optimization_indexes', JSON.stringify(this.suggestedIndexes));
    } catch (error) {
      console.error('Failed to persist index recommendations:', error);
    }
  }

  private async persistConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('db_optimization_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to persist configuration:', error);
    }
  }

  // Cleanup
  dispose(): void {
    this.isMonitoring = false;
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    // Execute any remaining batched queries
    if (this.batchedQueries.length > 0) {
      this.executeBatch();
    }
    
    this.persistOptimizationData();
  }
}

export const DatabaseOptimizationService = new DatabaseOptimizationServiceClass();
export default DatabaseOptimizationService;