import { useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { AdvancedCacheService } from '../services/AdvancedCacheService';
import { log } from '../utils/Logger';
import { advancedMemoryManager } from './AdvancedMemoryManager';
import { performanceOptimizer } from './PerformanceOptimizer';

// React hook for startup status

/**
 * App Startup Optimization System
 * Target: <1.5 seconds to interactive, optimized splash screen, progressive loading
 */

interface StartupPhase {
  name: string;
  priority: 'critical' | 'important' | 'optional';
  task: () => Promise<void>;
  timeout?: number;
  dependencies?: string[];
  completed: boolean;
  startTime?: number;
  endTime?: number;
}

interface StartupMetrics {
  totalStartupTime: number;
  timeToInteractive: number;
  splashScreenDuration: number;
  criticalTasksTime: number;
  memoryUsageAtStart: number;
  bundleLoadTime: number;
  phases: Record<string, { duration: number; success: boolean }>;
}

class StartupOptimizer {
  private phases: Map<string, StartupPhase> = new Map();
  private startupMetrics: StartupMetrics | null = null;
  private startupStartTime: number = 0;
  private isStartupComplete: boolean = false;
  private preloadedResources: Set<string> = new Set();
  
  private readonly STORAGE_KEY = '@TailTracker:startup_cache';
  private readonly MAX_SPLASH_DURATION = 3000; // 3 seconds max
  private readonly TARGET_STARTUP_TIME = 1500; // 1.5 seconds target

  /**
   * Initialize startup optimization
   */
  async initialize(): Promise<void> {
    this.startupStartTime = Date.now();
    
    // Keep splash screen visible during initialization
    await SplashScreen.preventAutoHideAsync();
    
    // Register startup phases
    this.registerStartupPhases();
    
    // Load startup cache
    await this.loadStartupCache();
    
    // Start the optimized startup sequence
    await this.executeStartupSequence();
  }

  /**
   * Register all startup phases with priorities and dependencies
   */
  private registerStartupPhases(): void {
    // Critical phase - must complete for basic functionality
    this.phases.set('performance_init', {
      name: 'Performance System Initialization',
      priority: 'critical',
      task: this.initializePerformanceSystem.bind(this),
      timeout: 500,
      completed: false,
    });

    this.phases.set('memory_init', {
      name: 'Memory Management Initialization',
      priority: 'critical',
      task: this.initializeMemorySystem.bind(this),
      timeout: 300,
      dependencies: ['performance_init'],
      completed: false,
    });

    this.phases.set('cache_init', {
      name: 'Cache System Initialization',
      priority: 'critical',
      task: this.initializeCacheSystem.bind(this),
      timeout: 400,
      dependencies: ['memory_init'],
      completed: false,
    });

    // Important phase - affects user experience but not blocking
    this.phases.set('critical_resources', {
      name: 'Critical Resources Preload',
      priority: 'important',
      task: this.preloadCriticalResources.bind(this),
      timeout: 800,
      dependencies: ['cache_init'],
      completed: false,
    });

    this.phases.set('ui_framework', {
      name: 'UI Framework Setup',
      priority: 'important',
      task: this.initializeUIFramework.bind(this),
      timeout: 600,
      dependencies: ['performance_init'],
      completed: false,
    });

    this.phases.set('auth_check', {
      name: 'Authentication State Check',
      priority: 'important',
      task: this.checkAuthenticationState.bind(this),
      timeout: 500,
      dependencies: ['cache_init'],
      completed: false,
    });

    // Optional phase - can be deferred or run in background
    this.phases.set('background_services', {
      name: 'Background Services Setup',
      priority: 'optional',
      task: this.initializeBackgroundServices.bind(this),
      timeout: 1000,
      dependencies: ['auth_check'],
      completed: false,
    });

    this.phases.set('analytics_init', {
      name: 'Analytics Initialization',
      priority: 'optional',
      task: this.initializeAnalytics.bind(this),
      timeout: 300,
      completed: false,
    });

    this.phases.set('prefetch_data', {
      name: 'Data Prefetching',
      priority: 'optional',
      task: this.prefetchInitialData.bind(this),
      timeout: 1500,
      dependencies: ['auth_check'],
      completed: false,
    });
  }

  /**
   * Execute optimized startup sequence with progressive loading
   */
  private async executeStartupSequence(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Phase 1: Execute critical tasks in parallel where possible
      await this.executeCriticalPhases();
      
      // Check if we can show the app yet
      const criticalTime = Date.now() - startTime;
      if (criticalTime < this.TARGET_STARTUP_TIME) {
        // We're fast! Hide splash screen and show app
        await this.completeStartup();
        
        // Continue with important tasks in background
        this.executeImportantPhases();
      } else {
        // Taking too long, execute important tasks before showing app
        await this.executeImportantPhases();
        await this.completeStartup();
      }
      
      // Execute optional tasks in background
      this.executeOptionalPhases();
      
    } catch (error) {
      log.error('Startup sequence error:', error);
      
      // Fallback: Show app anyway after timeout
      setTimeout(() => {
        this.completeStartup();
      }, this.MAX_SPLASH_DURATION);
    }
  }

  /**
   * Execute critical phases that must complete before app is usable
   */
  private async executeCriticalPhases(): Promise<void> {
    const criticalPhases = Array.from(this.phases.values())
      .filter(phase => phase.priority === 'critical');
    
    await this.executePhasesBatch(criticalPhases, 'critical');
  }

  /**
   * Execute important phases that improve user experience
   */
  private async executeImportantPhases(): Promise<void> {
    const importantPhases = Array.from(this.phases.values())
      .filter(phase => phase.priority === 'important');
    
    // Run in background to avoid blocking
    InteractionManager.runAfterInteractions(() => {
      this.executePhasesBatch(importantPhases, 'important');
    });
  }

  /**
   * Execute optional phases in background
   */
  private executeOptionalPhases(): void {
    const optionalPhases = Array.from(this.phases.values())
      .filter(phase => phase.priority === 'optional');
    
    // Use background task to avoid interfering with user interactions
    setTimeout(() => {
      this.executePhasesBatch(optionalPhases, 'optional');
    }, 100);
  }

  /**
   * Execute a batch of phases with dependency resolution and error handling
   */
  private async executePhasesBatch(phases: StartupPhase[], batchName: string): Promise<void> {
    const startTime = Date.now();
    const results: Record<string, { duration: number; success: boolean }> = {};
    
    // Resolve dependencies and create execution plan
    const executionPlan = this.resolveDependencies(phases);
    
    for (const batch of executionPlan) {
      // Execute phases in parallel within each batch
      const batchPromises = batch.map(async (phase) => {
        const phaseStartTime = Date.now();
        phase.startTime = phaseStartTime;
        
        try {
          // Execute with timeout
          await Promise.race([
            phase.task(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), phase.timeout || 5000)
            )
          ]);
          
          phase.completed = true;
          phase.endTime = Date.now();
          
          results[phase.name] = {
            duration: phase.endTime - phaseStartTime,
            success: true,
          };
          
          if (__DEV__) {
            log.debug(`✓ ${phase.name} completed in ${phase.endTime - phaseStartTime}ms`);
          }
          
        } catch (error) {
          phase.endTime = Date.now();
          results[phase.name] = {
            duration: phase.endTime - phaseStartTime,
            success: false,
          };
          
          log.warn(`✗ ${phase.name} failed:`, error);
          
          // Don't throw for optional phases
          if (phase.priority === 'critical') {
            throw error;
          }
        }
      });
      
      // Wait for all phases in this batch to complete
      await Promise.allSettled(batchPromises);
    }
    
    const batchTime = Date.now() - startTime;
    performanceOptimizer.trackMetric(`startup_${batchName}_time`, batchTime);
    
    if (__DEV__) {
      log.debug(`${batchName} phases completed in ${batchTime}ms`);
    }
  }

  /**
   * Resolve dependencies and create batched execution plan
   */
  private resolveDependencies(phases: StartupPhase[]): StartupPhase[][] {
    const executionPlan: StartupPhase[][] = [];
    const completed = new Set<string>();
    const remaining = new Set(phases);
    
    while (remaining.size > 0) {
      const batch: StartupPhase[] = [];
      
      for (const phase of remaining) {
        // Check if all dependencies are completed
        const canExecute = !phase.dependencies || 
          phase.dependencies.every(dep => completed.has(dep));
        
        if (canExecute) {
          batch.push(phase);
        }
      }
      
      if (batch.length === 0) {
        // Circular dependency or unresolvable dependencies
        log.warn('Unable to resolve remaining dependencies:', 
          Array.from(remaining).map(p => p.name));
        batch.push(...remaining); // Execute remaining anyway
      }
      
      // Remove from remaining and mark as ready for execution
      batch.forEach(phase => {
        remaining.delete(phase);
      });
      
      executionPlan.push(batch);
      
      // Mark batch phases as completed for dependency resolution
      batch.forEach(phase => {
        completed.add(phase.name);
      });
    }
    
    return executionPlan;
  }

  /**
   * Complete startup sequence and show app
   */
  private async completeStartup(): Promise<void> {
    if (this.isStartupComplete) return;
    
    const totalTime = Date.now() - this.startupStartTime;
    
    // Create startup metrics
    this.startupMetrics = {
      totalStartupTime: totalTime,
      timeToInteractive: totalTime, // Simplified - would measure actual interactivity
      splashScreenDuration: totalTime,
      criticalTasksTime: this.getCriticalTasksTime(),
      memoryUsageAtStart: this.getCurrentMemoryUsage(),
      bundleLoadTime: this.startupStartTime, // Would be measured from bundle load start
      phases: this.getPhaseMetrics(),
    };
    
    // Track metrics
    performanceOptimizer.trackMetric('startup_total_time', totalTime);
    performanceOptimizer.trackMetric('startup_memory_usage', this.startupMetrics.memoryUsageAtStart);
    
    // Hide splash screen with smooth transition
    await SplashScreen.hideAsync();
    
    // Cache startup performance data for optimization
    await this.cacheStartupMetrics();
    
    this.isStartupComplete = true;
    
    if (__DEV__) {
      log.debug(`🚀 App startup completed in ${totalTime}ms`);
      log.debug('Startup metrics:', this.startupMetrics);
    }
  }

  /**
   * Individual phase implementations
   */
  private async initializePerformanceSystem(): Promise<void> {
    await performanceOptimizer.initialize();
  }

  private async initializeMemorySystem(): Promise<void> {
    advancedMemoryManager.initialize();
  }

  private async initializeCacheSystem(): Promise<void> {
    // Cache system would be initialized here
    // Already initialized in constructor, so just wait a bit
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async preloadCriticalResources(): Promise<void> {
    // Preload critical images, fonts, and other resources
    const criticalResources = [
      'logo',
      'default_avatar',
      'loading_indicator',
    ];
    
    const preloadPromises = criticalResources.map(async (resource) => {
      if (this.preloadedResources.has(resource)) return;
      
      // Preload logic would go here
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate loading
      
      this.preloadedResources.add(resource);
    });
    
    await Promise.allSettled(preloadPromises);
  }

  private async initializeUIFramework(): Promise<void> {
    // Initialize UI framework components, themes, etc.
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async checkAuthenticationState(): Promise<void> {
    // Check if user is logged in, validate tokens, etc.
    try {
      await AsyncStorage.getItem('@TailTracker:auth_state');
      // Process auth state...
    } catch (error) {
      log.warn('Auth state check failed:', error);
    }
  }

  private async initializeBackgroundServices(): Promise<void> {
    // Initialize push notifications, background tasks, etc.
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async initializeAnalytics(): Promise<void> {
    // Initialize analytics services
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async prefetchInitialData(): Promise<void> {
    // Prefetch initial app data based on user preferences
    await AdvancedCacheService.prefetch([
      'user_profile',
      'pet_list',
      'recent_activities',
    ], 'normal');
  }

  /**
   * Utility methods
   */
  private getCriticalTasksTime(): number {
    const criticalPhases = Array.from(this.phases.values())
      .filter(phase => phase.priority === 'critical' && phase.completed);
    
    return criticalPhases.reduce((total, phase) => {
      return total + ((phase.endTime || 0) - (phase.startTime || 0));
    }, 0);
  }

  private getCurrentMemoryUsage(): number {
    // Would use native modules to get actual memory usage
    // For now, estimate based on current state
    return 30 * 1024 * 1024; // 30MB estimate
  }

  private getPhaseMetrics(): Record<string, { duration: number; success: boolean }> {
    const metrics: Record<string, { duration: number; success: boolean }> = {};
    
    for (const [name, phase] of this.phases) {
      if (phase.startTime && phase.endTime) {
        metrics[name] = {
          duration: phase.endTime - phase.startTime,
          success: phase.completed,
        };
      }
    }
    
    return metrics;
  }

  private async loadStartupCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const cachedMetrics = JSON.parse(cached) as StartupMetrics;
        
        // Use cached metrics to optimize current startup
        if (cachedMetrics.totalStartupTime > this.TARGET_STARTUP_TIME) {
          // Previous startup was slow, be more aggressive with optimizations
          this.adjustPhaseTimeouts(0.8); // Reduce timeouts by 20%
        }
      }
    } catch (error) {
      log.warn('Failed to load startup cache:', error);
    }
  }

  private async cacheStartupMetrics(): Promise<void> {
    try {
      if (this.startupMetrics) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.startupMetrics)
        );
      }
    } catch (error) {
      log.warn('Failed to cache startup metrics:', error);
    }
  }

  private adjustPhaseTimeouts(factor: number): void {
    for (const phase of this.phases.values()) {
      if (phase.timeout) {
        phase.timeout = Math.max(100, Math.floor(phase.timeout * factor));
      }
    }
  }

  /**
   * Public API
   */
  getStartupMetrics(): StartupMetrics | null {
    return this.startupMetrics;
  }

  isComplete(): boolean {
    return this.isStartupComplete;
  }

  getPhaseStatus(): Record<string, { completed: boolean; duration?: number }> {
    const status: Record<string, { completed: boolean; duration?: number }> = {};
    
    for (const [name, phase] of this.phases) {
      status[name] = {
        completed: phase.completed,
        duration: phase.startTime && phase.endTime 
          ? phase.endTime - phase.startTime 
          : undefined,
      };
    }
    
    return status;
  }
}

// Export singleton instance
export const startupOptimizer = new StartupOptimizer();

export const useStartupStatus = () => {
  const [isComplete, setIsComplete] = useState(startupOptimizer.isComplete());
  const [metrics, setMetrics] = useState(startupOptimizer.getStartupMetrics());
  const [phaseStatus, setPhaseStatus] = useState(startupOptimizer.getPhaseStatus());
  
  useEffect(() => {
    const checkStatus = () => {
      setIsComplete(startupOptimizer.isComplete());
      setMetrics(startupOptimizer.getStartupMetrics());
      setPhaseStatus(startupOptimizer.getPhaseStatus());
    };
    
    const interval = setInterval(checkStatus, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    isComplete,
    metrics,
    phaseStatus,
  };
};

export default startupOptimizer;