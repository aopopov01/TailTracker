import { InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageMemoryPool } from '@/components/Performance/AdvancedImage';
import { PerformanceMonitor } from '@/services/PerformanceMonitor';
import { log } from './Logger';

interface StartupTask {
  name: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  execute: () => Promise<void>;
  timeout?: number;
}

interface StartupConfig {
  enablePreloading: boolean;
  enableCaching: boolean;
  maxConcurrentTasks: number;
  criticalTimeout: number;
}

class AppStartupOptimizer {
  private static instance: AppStartupOptimizer;
  private isStartupComplete = false;
  private startupTasks: StartupTask[] = [];
  private completedTasks: Set<string> = new Set();
  private failedTasks: Set<string> = new Set();
  private startupStartTime: number;
  
  private config: StartupConfig = {
    enablePreloading: true,
    enableCaching: true,
    maxConcurrentTasks: 3,
    criticalTimeout: 5000,
  };

  private constructor() {
    this.startupStartTime = Date.now();
    this.registerStartupTasks();
    this.startOptimizedStartup();
  }

  static getInstance(): AppStartupOptimizer {
    if (!AppStartupOptimizer.instance) {
      AppStartupOptimizer.instance = new AppStartupOptimizer();
    }
    return AppStartupOptimizer.instance;
  }

  private registerStartupTasks(): void {
    // Critical tasks - must complete before app is usable
    this.addTask({
      name: 'initialize_storage',
      priority: 'critical',
      execute: this.initializeStorage.bind(this),
      timeout: 2000,
    });

    this.addTask({
      name: 'load_user_session',
      priority: 'critical',
      execute: this.loadUserSession.bind(this),
      timeout: 3000,
    });

    // High priority tasks - should complete quickly but not blocking
    this.addTask({
      name: 'initialize_performance_monitoring',
      priority: 'high',
      execute: this.initializePerformanceMonitoring.bind(this),
      timeout: 1000,
    });

    this.addTask({
      name: 'warm_up_image_cache',
      priority: 'high',
      execute: this.warmUpImageCache.bind(this),
      timeout: 2000,
    });

    this.addTask({
      name: 'preload_critical_assets',
      priority: 'high',
      execute: this.preloadCriticalAssets.bind(this),
      timeout: 3000,
    });

    // Normal priority tasks - can run in background
    this.addTask({
      name: 'sync_offline_data',
      priority: 'normal',
      execute: this.syncOfflineData.bind(this),
      timeout: 5000,
    });

    this.addTask({
      name: 'update_app_metadata',
      priority: 'normal',
      execute: this.updateAppMetadata.bind(this),
      timeout: 2000,
    });

    // Low priority tasks - non-essential background tasks
    this.addTask({
      name: 'cleanup_old_cache',
      priority: 'low',
      execute: this.cleanupOldCache.bind(this),
      timeout: 10000,
    });

    this.addTask({
      name: 'preload_secondary_assets',
      priority: 'low',
      execute: this.preloadSecondaryAssets.bind(this),
      timeout: 15000,
    });
  }

  private addTask(task: StartupTask): void {
    this.startupTasks.push(task);
  }

  private async startOptimizedStartup(): Promise<void> {
    try {
      // Phase 1: Execute critical tasks synchronously
      await this.executeCriticalTasks();
      
      // Phase 2: Execute high priority tasks
      InteractionManager.runAfterInteractions(() => {
        this.executeHighPriorityTasks();
      });
      
      // Phase 3: Execute normal and low priority tasks in background
      setTimeout(() => {
        this.executeBackgroundTasks();
      }, 100);

      this.markStartupComplete();
    } catch (error) {
      log.error('Startup optimization failed:', error);
      PerformanceMonitor.recordMetric({
        name: 'startup_error',
        value: 1,
        timestamp: Date.now(),
        category: 'startup',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  private async executeCriticalTasks(): Promise<void> {
    const criticalTasks = this.startupTasks.filter(task => task.priority === 'critical');
    
    for (const task of criticalTasks) {
      const taskStartTime = Date.now();
      try {
        await this.executeTaskWithTimeout(task);
        this.completedTasks.add(task.name);
        
        const duration = Date.now() - taskStartTime;
        PerformanceMonitor.recordMetric({
          name: 'startup_task_duration',
          value: duration,
          timestamp: Date.now(),
          category: 'startup',
          metadata: { 
            taskName: task.name, 
            priority: task.priority,
            success: true
          },
        });
      } catch (error) {
        this.failedTasks.add(task.name);
        log.warn(`Critical startup task failed: ${task.name}`, error);
        
        PerformanceMonitor.recordMetric({
          name: 'startup_task_failure',
          value: 1,
          timestamp: Date.now(),
          category: 'startup',
          metadata: { 
            taskName: task.name, 
            priority: task.priority,
            error: error instanceof Error ? error.message : String(error)
          },
        });
      }
    }
  }

  private async executeHighPriorityTasks(): Promise<void> {
    const highPriorityTasks = this.startupTasks.filter(task => task.priority === 'high');
    
    // Execute high priority tasks concurrently with limited concurrency
    const concurrentBatches = this.createConcurrentBatches(highPriorityTasks, this.config.maxConcurrentTasks);
    
    for (const batch of concurrentBatches) {
      await Promise.allSettled(
        batch.map(async (task) => {
          const taskStartTime = Date.now();
          try {
            await this.executeTaskWithTimeout(task);
            this.completedTasks.add(task.name);
            
            const duration = Date.now() - taskStartTime;
            PerformanceMonitor.recordMetric({
              name: 'startup_task_duration',
              value: duration,
              timestamp: Date.now(),
              category: 'startup',
              metadata: { 
                taskName: task.name, 
                priority: task.priority,
                success: true
              },
            });
          } catch (error) {
            this.failedTasks.add(task.name);
            log.warn(`High priority startup task failed: ${task.name}`, error);
          }
        })
      );
    }
  }

  private async executeBackgroundTasks(): Promise<void> {
    const backgroundTasks = this.startupTasks.filter(
      task => task.priority === 'normal' || task.priority === 'low'
    );

    // Execute background tasks with even lower priority
    const concurrentBatches = this.createConcurrentBatches(backgroundTasks, 2);
    
    for (const batch of concurrentBatches) {
      // Add delay between batches to not overwhelm the system
      await new Promise(resolve => setTimeout(resolve, 200));
      
      Promise.allSettled(
        batch.map(async (task) => {
          try {
            await this.executeTaskWithTimeout(task);
            this.completedTasks.add(task.name);
          } catch (error) {
            this.failedTasks.add(task.name);
            log.warn(`Background startup task failed: ${task.name}`, error);
          }
        })
      );
    }
  }

  private createConcurrentBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async executeTaskWithTimeout(task: StartupTask): Promise<void> {
    const timeout = task.timeout || 10000;
    
    return Promise.race([
      task.execute(),
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Task ${task.name} timed out after ${timeout}ms`));
        }, timeout);
      })
    ]);
  }

  private markStartupComplete(): void {
    this.isStartupComplete = true;
    const totalStartupTime = Date.now() - this.startupStartTime;
    
    PerformanceMonitor.recordMetric({
      name: 'total_startup_time',
      value: totalStartupTime,
      timestamp: Date.now(),
      category: 'startup',
      metadata: {
        completedTasks: this.completedTasks.size,
        failedTasks: this.failedTasks.size,
        totalTasks: this.startupTasks.length,
      },
    });

    log.performance(`App startup completed in ${totalStartupTime}ms`);
    log.debug(`Tasks completed: ${this.completedTasks.size}/${this.startupTasks.length}`);
    
    if (this.failedTasks.size > 0) {
      log.warn('Failed startup tasks:', Array.from(this.failedTasks));
    }
  }

  // Individual startup task implementations
  private async initializeStorage(): Promise<void> {
    try {
      // Initialize AsyncStorage and perform any necessary migrations
      await AsyncStorage.getItem('@app_version');
      
      // Clear old temporary data
      const keys = await AsyncStorage.getAllKeys();
      const tempKeys = keys.filter(key => key.includes('_temp_'));
      if (tempKeys.length > 0) {
        await AsyncStorage.multiRemove(tempKeys);
      }
    } catch (error) {
      log.warn('Storage initialization failed:', error);
      throw error;
    }
  }

  private async loadUserSession(): Promise<void> {
    try {
      // Load user authentication state and critical user data
      const userToken = await AsyncStorage.getItem('@user_token');
      const userPreferences = await AsyncStorage.getItem('@user_preferences');
      
      // Validate and refresh tokens if necessary
      if (userToken) {
        // Token validation logic would go here
      }
      
      return Promise.resolve();
    } catch (error) {
      log.warn('User session loading failed:', error);
      throw error;
    }
  }

  private async initializePerformanceMonitoring(): Promise<void> {
    try {
      // Performance monitoring should already be initialized,
      // this just ensures it's properly configured
      PerformanceMonitor.setEnabled(true);
      
      return Promise.resolve();
    } catch (error) {
      log.warn('Performance monitoring initialization failed:', error);
      throw error;
    }
  }

  private async warmUpImageCache(): Promise<void> {
    try {
      const imagePool = ImageMemoryPool.getInstance();
      // Pre-warm the image cache with default images
      const defaultImages = [
        'default_pet_avatar.png',
        'app_logo.png',
        'placeholder_image.png',
      ];
      
      await Promise.all(
        defaultImages.map(image => 
          imagePool.preloadImage(image, 'high').catch(() => {
            // Ignore individual preload failures
          })
        )
      );
    } catch (error) {
      log.warn('Image cache warming failed:', error);
      throw error;
    }
  }

  private async preloadCriticalAssets(): Promise<void> {
    try {
      // Preload fonts, critical icons, and other essential assets
      // This would integrate with your asset management system
      
      return Promise.resolve();
    } catch (error) {
      log.warn('Critical asset preloading failed:', error);
      throw error;
    }
  }

  private async syncOfflineData(): Promise<void> {
    try {
      // Sync any offline changes or cached data
      // This would integrate with your data synchronization system
      
      return Promise.resolve();
    } catch (error) {
      log.warn('Offline data sync failed:', error);
      // Don't throw - this is not critical
    }
  }

  private async updateAppMetadata(): Promise<void> {
    try {
      const appVersion = '1.0.0'; // Get from app config
      await AsyncStorage.setItem('@app_version', appVersion);
      await AsyncStorage.setItem('@last_startup', Date.now().toString());
    } catch (error) {
      log.warn('App metadata update failed:', error);
      // Don't throw - this is not critical
    }
  }

  private async cleanupOldCache(): Promise<void> {
    try {
      // Clean up old cache files and expired data
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.includes('_cache_'));
      
      for (const key of cacheKeys) {
        try {
          const cacheData = await AsyncStorage.getItem(key);
          if (cacheData) {
            const parsed = JSON.parse(cacheData);
            if (parsed.expiry && Date.now() > parsed.expiry) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch {
          // Remove corrupted cache entries
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      log.warn('Cache cleanup failed:', error);
      // Don't throw - this is not critical
    }
  }

  private async preloadSecondaryAssets(): Promise<void> {
    try {
      // Preload non-essential assets in the background
      // This would integrate with your asset management system
      
      return Promise.resolve();
    } catch (error) {
      log.warn('Secondary asset preloading failed:', error);
      // Don't throw - this is not critical
    }
  }

  // Public API
  isStartupCompleted(): boolean {
    return this.isStartupComplete;
  }

  getStartupStats(): {
    totalTime: number;
    completedTasks: string[];
    failedTasks: string[];
    isComplete: boolean;
  } {
    return {
      totalTime: Date.now() - this.startupStartTime,
      completedTasks: Array.from(this.completedTasks),
      failedTasks: Array.from(this.failedTasks),
      isComplete: this.isStartupComplete,
    };
  }

  async waitForStartupCompletion(timeout = 10000): Promise<boolean> {
    if (this.isStartupComplete) {
      return true;
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isStartupComplete) {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandler);
          resolve(true);
        }
      }, 100);

      const timeoutHandler = setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, timeout);
    });
  }
}

export const appStartupOptimizer = AppStartupOptimizer.getInstance();
export { AppStartupOptimizer };