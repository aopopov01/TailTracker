import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import { usePerformanceMonitor } from '../../services/PerformanceMonitor';

interface StartupTask {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  execute: () => Promise<void>;
  timeout?: number;
}

interface StartupOptimizerProps {
  children: React.ReactNode;
  enableProgressIndicator?: boolean;
  minimumLoadTime?: number;
  maxLoadTime?: number;
  onLoadComplete?: () => void;
  onLoadError?: (error: Error) => void;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  currentTask: string;
  completedTasks: Set<string>;
  error: Error | null;
}

// PERFORMANCE OPTIMIZATION: Optimized startup sequence with task prioritization
const StartupOptimizer: React.FC<StartupOptimizerProps> = React.memo(({
  children,
  enableProgressIndicator = false,
  minimumLoadTime = 1000,
  maxLoadTime = 10000,
  onLoadComplete,
  onLoadError,
}) => {
  const performanceMonitor = usePerformanceMonitor();
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    currentTask: 'Initializing...',
    completedTasks: new Set(),
    error: null,
  });

  // PERFORMANCE OPTIMIZATION: Define startup tasks with priorities
  const startupTasks = React.useMemo<StartupTask[]>(() => [
    // Critical tasks - must complete for basic functionality
    {
      id: 'splash-screen',
      name: 'Initializing splash screen',
      priority: 'critical',
      timeout: 2000,
      execute: async () => {
        await SplashScreen.preventAutoHideAsync();
      },
    },
    
    // High priority - essential for core functionality
    {
      id: 'load-fonts',
      name: 'Loading fonts',
      priority: 'high',
      timeout: 5000,
      execute: async () => {
        await Font.loadAsync({
          // Add your custom fonts here
          'custom-regular': require('../../../assets/fonts/custom-regular.ttf'),
          'custom-bold': require('../../../assets/fonts/custom-bold.ttf'),
        });
      },
    },
    
    {
      id: 'preload-critical-assets',
      name: 'Loading essential assets',
      priority: 'high',
      timeout: 5000,
      execute: async () => {
        const criticalAssets = [
          require('../../../assets/images/icon.png'),
          require('../../../assets/images/splash.png'),
          require('../../../assets/images/logo.png'),
        ];
        
        await Asset.loadAsync(criticalAssets);
      },
    },
    
    {
      id: 'initialize-services',
      name: 'Initializing services',
      priority: 'high',
      timeout: 5000,
      execute: async () => {
        // Initialize critical services
        const { AuthService } = await import('../../services/authService');
        // NOTE: BatteryOptimizationService removed - feature not approved
        
        await Promise.all([
          // AuthService doesn't need initialization
          Promise.resolve(), // Placeholder for removed BatteryOptimizationService
        ]);
      },
    },
    
    // Medium priority - enhances user experience
    {
      id: 'preload-components',
      name: 'Preparing components',
      priority: 'medium',
      timeout: 3000,
      execute: async () => {
        // Preload frequently used components
        const { ComponentPreloader } = await import('../UI/LazyComponent');
        
        await Promise.all([
          ComponentPreloader.preload('PetProfile', () => import('../../screens/Pet/PetProfileScreen')),
          // ComponentPreloader.preload('Dashboard', () => import('../../screens/Dashboard/DashboardScreen')), // DashboardScreen not found
        ]);
      },
    },
    
    {
      id: 'initialize-cache',
      name: 'Setting up cache',
      priority: 'medium',
      timeout: 3000,
      execute: async () => {
        // Initialize image cache and other caching systems
        const { ImageCacheUtils } = await import('./OptimizedImageComponent');
        await ImageCacheUtils.getCacheSize();
      },
    },
    
    // Low priority - nice to have features
    {
      id: 'preload-secondary-assets',
      name: 'Loading additional assets',
      priority: 'low',
      timeout: 2000,
      execute: async () => {
        const secondaryAssets = [
          require('../../../assets/images/placeholder.png'),
          require('../../../assets/images/empty-state.png'),
        ];
        
        await Asset.loadAsync(secondaryAssets);
      },
    },
  ], []);

  // PERFORMANCE OPTIMIZATION: Execute tasks in priority order with timeout handling
  const executeStartupTasks = useCallback(async () => {
    const startTime = performance.now();
    performanceMonitor.startTiming('app_startup');

    try {
      // Group tasks by priority
      const tasksByPriority = startupTasks.reduce((acc, task) => {
        if (!acc[task.priority]) acc[task.priority] = [];
        acc[task.priority].push(task);
        return acc;
      }, {} as Record<string, StartupTask[]>);

      const priorityOrder: (keyof typeof tasksByPriority)[] = ['critical', 'high', 'medium', 'low'];
      let completedCount = 0;
      const totalTasks = startupTasks.length;

      // Execute tasks by priority, with parallelization within each priority level
      for (const priority of priorityOrder) {
        const tasks = tasksByPriority[priority] || [];
        
        setLoadingState(prev => ({
          ...prev,
          currentTask: `Executing ${priority} priority tasks...`,
        }));

        // Execute all tasks of current priority in parallel
        const taskPromises = tasks.map(async (task) => {
          try {
            setLoadingState(prev => ({
              ...prev,
              currentTask: task.name,
            }));

            const taskStartTime = performance.now();
            
            // Add timeout wrapper
            const taskWithTimeout = Promise.race([
              task.execute(),
              new Promise<void>((_, reject) => 
                setTimeout(() => reject(new Error(`Task ${task.id} timed out`)), task.timeout || 5000)
              ),
            ]);

            await taskWithTimeout;
            
            const taskDuration = performance.now() - taskStartTime;
            console.log(`[Startup] Task ${task.id} completed in ${taskDuration.toFixed(2)}ms`);

            completedCount++;
            setLoadingState(prev => ({
              ...prev,
              completedTasks: new Set([...prev.completedTasks, task.id]),
              progress: (completedCount / totalTasks) * 100,
            }));
          } catch (error) {
            console.error(`[Startup] Task ${task.id} failed:`, error);
            
            // Only throw error for critical tasks
            if (task.priority === 'critical') {
              throw new Error(`Critical startup task failed: ${task.id}`);
            }
            
            // For non-critical tasks, just log and continue
            completedCount++;
            setLoadingState(prev => ({
              ...prev,
              progress: (completedCount / totalTasks) * 100,
            }));
          }
        });

        await Promise.all(taskPromises);
      }

      // Ensure minimum load time for better UX (prevents flash)
      const elapsed = performance.now() - startTime;
      if (elapsed < minimumLoadTime) {
        await new Promise(resolve => setTimeout(resolve, minimumLoadTime - elapsed));
      }

      // Hide splash screen
      await SplashScreen.hideAsync();
      
      const totalDuration = performance.now() - startTime;
      performanceMonitor.endTiming('app_startup', 'startup', {
        duration: totalDuration,
        tasksCompleted: completedCount,
        totalTasks: totalTasks,
      });

      console.log(`[Startup] Complete in ${totalDuration.toFixed(2)}ms`);

      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        currentTask: 'Ready!',
      }));

      onLoadComplete?.();
      
    } catch (error) {
      console.error('[Startup] Failed:', error);
      
      performanceMonitor.endTiming('app_startup', 'startup', {
        error: error instanceof Error ? error.message : String(error),
        success: false,
      });

      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));

      onLoadError?.(error as Error);
    }
  }, [startupTasks, minimumLoadTime, performanceMonitor, onLoadComplete, onLoadError]);

  // PERFORMANCE OPTIMIZATION: Add timeout protection for entire startup process
  useEffect(() => {
    const startupTimeout = setTimeout(() => {
      if (loadingState.isLoading) {
        console.warn('[Startup] Maximum load time exceeded, forcing completion');
        
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          error: new Error('Startup timeout exceeded'),
        }));
        
        onLoadError?.(new Error('Application startup took too long'));
      }
    }, maxLoadTime);

    executeStartupTasks();

    return () => {
      clearTimeout(startupTimeout);
    };
  }, [executeStartupTasks, maxLoadTime, loadingState.isLoading, onLoadError]);

  // Show loading screen while startup tasks are running
  if (loadingState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          {/* Add your app logo here */}
          <Text style={styles.appName}>TailTracker</Text>
        </View>
        
        {enableProgressIndicator && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${loadingState.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {loadingState.currentTask}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(loadingState.progress)}%
            </Text>
          </View>
        )}
        
        {!enableProgressIndicator && (
          <ActivityIndicator 
            size="large" 
            color="#2196F3" 
            style={styles.spinner}
          />
        )}
      </View>
    );
  }

  // Show error state if startup failed
  if (loadingState.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Startup Failed</Text>
        <Text style={styles.errorMessage}>
          {loadingState.error.message}
        </Text>
        {/* Add retry button here if needed */}
      </View>
    );
  }

  // Render main app once startup is complete
  return <>{children}</>;
});

StartupOptimizer.displayName = 'StartupOptimizer';

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  spinner: {
    marginTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default StartupOptimizer;

// PERFORMANCE OPTIMIZATION: Export startup performance monitoring hook
export const useStartupMetrics = () => {
  const performanceMonitor = usePerformanceMonitor();
  
  return {
    measureStartupTask: useCallback((taskName: string, task: () => Promise<void>) => {
      return performanceMonitor.measureRenderTime(`startup_${taskName}`, task);
    }, [performanceMonitor]),
    
    getStartupMetrics: useCallback(() => {
      return performanceMonitor.metrics.filter(m => 
        m.componentRenderTime !== undefined && 
        String(m).includes('startup')
      );
    }, [performanceMonitor]),
  };
};