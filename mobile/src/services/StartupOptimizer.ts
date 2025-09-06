import { InteractionManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AdvancedCacheService } from './AdvancedCacheService';
import { ImageOptimizationService } from './ImageOptimizationService';
import { MemoryManager } from './MemoryManager';
import { PerformanceMonitor } from './PerformanceMonitor';

interface StartupTask {
  id: string;
  name: string;
  priority: 'critical' | 'important' | 'normal' | 'background';
  task: () => Promise<void>;
  dependencies?: string[];
  timeout?: number;
}

interface StartupConfig {
  maxConcurrentTasks: number;
  criticalTimeout: number;
  backgroundDelay: number;
  enablePreloading: boolean;
}

class StartupOptimizerService {
  private tasks: Map<string, StartupTask> = new Map();
  private completedTasks: Set<string> = new Set();
  private runningTasks: Set<string> = new Set();
  private config: StartupConfig;
  private startupComplete = false;

  constructor() {
    this.config = {
      maxConcurrentTasks: 4,
      criticalTimeout: 5000,
      backgroundDelay: 2000,
      enablePreloading: true
    };

    this.initializeDefaultTasks();
  }

  private initializeDefaultTasks() {
    // Critical path tasks (must complete before app is usable)
    this.addTask({
      id: 'splash',
      name: 'Initialize Splash Screen',
      priority: 'critical',
      task: this.initializeSplashScreen
    });

    this.addTask({
      id: 'performance_monitor',
      name: 'Initialize Performance Monitor',
      priority: 'critical',
      task: this.initializePerformanceMonitor,
      dependencies: ['splash']
    });

    this.addTask({
      id: 'memory_manager',
      name: 'Initialize Memory Manager',
      priority: 'critical',
      task: this.initializeMemoryManager,
      dependencies: ['performance_monitor']
    });

    // Important tasks (should complete quickly)
    this.addTask({
      id: 'cache_service',
      name: 'Initialize Cache Service',
      priority: 'important',
      task: this.initializeCacheService,
      dependencies: ['memory_manager']
    });

    this.addTask({
      id: 'user_preferences',
      name: 'Load User Preferences',
      priority: 'important',
      task: this.loadUserPreferences
    });

    // Normal priority tasks
    this.addTask({
      id: 'image_service',
      name: 'Initialize Image Optimization',
      priority: 'normal',
      task: this.initializeImageService,
      dependencies: ['cache_service']
    });

    // Background tasks (can run after app is ready)
    this.addTask({
      id: 'preload_critical_assets',
      name: 'Preload Critical Assets',
      priority: 'background',
      task: this.preloadCriticalAssets,
      dependencies: ['image_service']
    });

    this.addTask({
      id: 'sync_offline_data',
      name: 'Sync Offline Data',
      priority: 'background',
      task: this.syncOfflineData,
      dependencies: ['cache_service']
    });
  }  // Task management
  addTask(task: StartupTask) {
    this.tasks.set(task.id, task);
  }

  removeTask(taskId: string) {
    this.tasks.delete(taskId);
  }

  // Main startup orchestration
  async optimizeStartup(): Promise<void> {
    console.log('🚀 Starting TailTracker startup optimization...');
    PerformanceMonitor.startTiming('app_startup_total');

    try {
      // Phase 1: Critical tasks (sequential for fastest critical path)
      await this.runCriticalTasks();
      
      // Phase 2: Important tasks (parallel but limited concurrency)
      await this.runImportantTasks();
      
      // Phase 3: Normal tasks (parallel)
      await this.runNormalTasks();
      
      // Hide splash screen now - app is ready
      await this.hideSplashScreen();
      
      // Phase 4: Background tasks (after app is interactive)
      this.runBackgroundTasks();

      this.startupComplete = true;
      const totalTime = PerformanceMonitor.endTiming('app_startup_total');
      
      console.log(`✅ Startup completed in ${totalTime.toFixed(0)}ms`);
      PerformanceMonitor.markAppLaunchComplete();

    } catch (error) {
      console.error('❌ Startup optimization failed:', error);
      // Ensure splash screen is hidden even on error
      await this.hideSplashScreen();
      throw error;
    }
  }

  private async runCriticalTasks(): Promise<void> {
    PerformanceMonitor.startTiming('startup_critical_tasks');
    
    const criticalTasks = this.getTasksByPriority('critical');
    
    for (const task of criticalTasks) {
      if (this.areDependenciesComplete(task)) {
        await this.runTaskWithTimeout(task, this.config.criticalTimeout);
      }
    }
    
    PerformanceMonitor.endTiming('startup_critical_tasks');
  }

  private async runImportantTasks(): Promise<void> {
    PerformanceMonitor.startTiming('startup_important_tasks');
    
    const importantTasks = this.getTasksByPriority('important');
    const readyTasks = importantTasks.filter(task => this.areDependenciesComplete(task));
    
    // Run important tasks with limited concurrency
    await this.runTasksConcurrently(readyTasks, Math.min(2, this.config.maxConcurrentTasks));
    
    PerformanceMonitor.endTiming('startup_important_tasks');
  }

  private async runNormalTasks(): Promise<void> {
    PerformanceMonitor.startTiming('startup_normal_tasks');
    
    const normalTasks = this.getTasksByPriority('normal');
    const readyTasks = normalTasks.filter(task => this.areDependenciesComplete(task));
    
    // Run normal tasks with full concurrency
    await this.runTasksConcurrently(readyTasks, this.config.maxConcurrentTasks);
    
    PerformanceMonitor.endTiming('startup_normal_tasks');
  }

  private runBackgroundTasks(): void {
    // Run background tasks after a delay to ensure UI is responsive
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        const backgroundTasks = this.getTasksByPriority('background');
        const readyTasks = backgroundTasks.filter(task => this.areDependenciesComplete(task));
        
        this.runTasksConcurrently(readyTasks, 2); // Limited background concurrency
      }, this.config.backgroundDelay);
    });
  }  // Task execution utilities
  private async runTasksConcurrently(tasks: StartupTask[], maxConcurrency: number): Promise<void> {
    const promises: Promise<void>[] = [];
    let index = 0;

    const runNext = async (): Promise<void> => {
      if (index >= tasks.length) return;
      
      const task = tasks[index++];
      await this.runTask(task);
      
      // Run next task
      return runNext();
    };

    // Start initial batch
    for (let i = 0; i < Math.min(maxConcurrency, tasks.length); i++) {
      promises.push(runNext());
    }

    await Promise.all(promises);
  }

  private async runTask(task: StartupTask): Promise<void> {
    if (this.completedTasks.has(task.id) || this.runningTasks.has(task.id)) {
      return;
    }

    this.runningTasks.add(task.id);
    PerformanceMonitor.startTiming(`startup_task_${task.id}`);

    try {
      console.log(`🔄 Running startup task: ${task.name}`);
      await task.task();
      
      this.completedTasks.add(task.id);
      console.log(`✅ Completed startup task: ${task.name}`);
      
    } catch (error) {
      console.error(`❌ Failed startup task: ${task.name}`, error);
      throw error;
    } finally {
      this.runningTasks.delete(task.id);
      PerformanceMonitor.endTiming(`startup_task_${task.id}`, 'startup', {
        taskName: task.name,
        priority: task.priority
      });
    }
  }

  private async runTaskWithTimeout(task: StartupTask, timeout: number): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Task ${task.name} timed out`)), timeout);
    });

    await Promise.race([this.runTask(task), timeoutPromise]);
  }

  // Utility methods
  private getTasksByPriority(priority: StartupTask['priority']): StartupTask[] {
    return Array.from(this.tasks.values()).filter(task => task.priority === priority);
  }

  private areDependenciesComplete(task: StartupTask): boolean {
    if (!task.dependencies) return true;
    return task.dependencies.every(dep => this.completedTasks.has(dep));
  }

  // Task implementations
  private initializeSplashScreen = async (): Promise<void> => {
    await SplashScreen.preventAutoHideAsync();
  };

  private initializePerformanceMonitor = async (): Promise<void> => {
    // Performance monitor is already initialized, just mark it
    PerformanceMonitor.startTiming('app_interactive');
  };

  private initializeMemoryManager = async (): Promise<void> => {
    MemoryManager.initializeImagePool();
  };

  private initializeCacheService = async (): Promise<void> => {
    // Cache service is already initialized
  };

  private initializeImageService = async (): Promise<void> => {
    // Image service is already initialized
  };  private loadUserPreferences = async (): Promise<void> => {
    try {
      await AdvancedCacheService.get('user_preferences');
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  };

  private preloadCriticalAssets = async (): Promise<void> => {
    if (!this.config.enablePreloading) return;

    // Preload critical images
    const criticalImages = [
      'placeholder_pet.webp',
      'app_icon.webp',
      'default_avatar.webp'
    ];

    const preloadPromises = criticalImages.map(async (imageName) => {
      try {
        const uri = `../assets/images/${imageName}`;
        ImageOptimizationService.preloadImages([uri], 'high');
      } catch (error) {
        console.warn(`Failed to preload ${imageName}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  };

  private syncOfflineData = async (): Promise<void> => {
    try {
      // Trigger sync of any offline changes
      // This would integrate with your actual sync logic
      console.log('Syncing offline data...');
    } catch (error) {
      console.warn('Failed to sync offline data:', error);
    }
  };

  private hideSplashScreen = async (): Promise<void> => {
    try {
      await SplashScreen.hideAsync();
      PerformanceMonitor.endTiming('app_interactive', 'startup');
    } catch (error) {
      console.error('Failed to hide splash screen:', error);
    }
  };

  // Public API
  isStartupComplete(): boolean {
    return this.startupComplete;
  }

  getStartupProgress(): { completed: number; total: number; percentage: number } {
    const total = this.tasks.size;
    const completed = this.completedTasks.size;
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  }

  getStartupStats() {
    return {
      tasksCompleted: this.completedTasks.size,
      tasksTotal: this.tasks.size,
      tasksRunning: this.runningTasks.size,
      startupComplete: this.startupComplete,
      config: this.config
    };
  }
}

// Singleton instance
export const StartupOptimizer = new StartupOptimizerService();
export default StartupOptimizer;