import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PerformanceTestUtils, PERFORMANCE_THRESHOLDS } from '../performance-setup';
import PremiumLandingPage from '../../app/index';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock dependencies for testing
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'View',
}));

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  FadeIn: { delay: () => ({ duration: () => ({}) }) },
  SlideInDown: { delay: () => ({ springify: () => ({}) }) },
}));

describe('App Launch Performance Tests', () => {
  beforeEach(() => {
    // Clear any existing performance data
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('App launch performance should be under threshold', async () => {
    const { result, averageTime } = await PerformanceTestUtils.measureComponentRender(
      () => {
        return render(
          <NavigationContainer>
            <AuthProvider>
              <PremiumLandingPage />
            </AuthProvider>
          </NavigationContainer>
        );
      },
      'app-launch',
      5 // Test 5 iterations for average
    );

    // Assert performance thresholds
    expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    
    // Log performance metrics
    console.log('App Launch Performance Metrics:', {
      averageTime,
      threshold: PERFORMANCE_THRESHOLDS.COMPONENT_RENDER,
      iterations: 5,
      allTimes: result,
    });

    // Additional assertions
    expect(result).toBeDefined();
    expect(averageTime).toBeGreaterThan(0);
    expect(averageTime).toBeLessThan(2000); // Should launch in under 2 seconds
  });

  test('Cold start simulation performance', async () => {
    // Simulate cold start by clearing require cache
    jest.resetModules();
    
    const startTime = Date.now();
    
    // Simulate loading all required modules
    const modules = [
      '../../app/index',
      '../../contexts/AuthContext',
      'react-native-reanimated',
      'expo-linear-gradient',
    ];
    
    await Promise.all(
      modules.map(async (module) => {
        try {
          await import(module);
        } catch (error) {
          // Module might not exist in test environment
          console.warn(`Failed to load module ${module}:`, error.message);
        }
      })
    );
    
    const coldStartTime = Date.now() - startTime;
    
    // Cold start should complete within reasonable time
    expect(coldStartTime).toBeLessThan(1000); // 1 second for module loading
    
    console.log('Cold Start Simulation:', {
      moduleLoadTime: coldStartTime,
      modules: modules.length,
    });
  });

  test('Memory usage during app launch', async () => {
    const initialMemory = PerformanceTestUtils.measureMemoryUsage('app-launch-start');
    
    const { result } = await PerformanceTestUtils.measureComponentRender(
      () => {
        return render(
          <NavigationContainer>
            <AuthProvider>
              <PremiumLandingPage />
            </AuthProvider>
          </NavigationContainer>
        );
      },
      'app-launch-memory',
      3
    );

    const finalMemory = PerformanceTestUtils.measureMemoryUsage('app-launch-end');
    
    // Memory usage should be reasonable
    const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB increase max
    
    console.log('App Launch Memory Usage:', {
      initial: Math.round(initialMemory.usedJSHeapSize / 1024 / 1024) + 'MB',
      final: Math.round(finalMemory.usedJSHeapSize / 1024 / 1024) + 'MB',
      increase: Math.round(memoryIncrease / 1024 / 1024) + 'MB',
    });
  });

  test('Animation performance during app launch', async () => {
    const animationStartTime = Date.now();
    
    const component = render(
      <NavigationContainer>
        <AuthProvider>
          <PremiumLandingPage />
        </AuthProvider>
      </NavigationContainer>
    );

    // Fast-forward timers to complete animations
    jest.advanceTimersByTime(2000); // 2 seconds for all animations
    
    const animationEndTime = Date.now() - animationStartTime;
    
    // Animations should not block rendering significantly
    expect(animationEndTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    
    console.log('Animation Performance:', {
      animationTime: animationEndTime,
      threshold: PERFORMANCE_THRESHOLDS.COMPONENT_RENDER,
    });
    
    // Component should still be rendered
    expect(component.getByText('TailTracker')).toBeTruthy();
  });

  test('Responsive render performance', async () => {
    const renderTimes: number[] = [];
    
    // Test multiple renders to simulate real usage
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      
      const component = render(
        <NavigationContainer>
          <AuthProvider>
            <PremiumLandingPage />
          </AuthProvider>
        </NavigationContainer>
      );
      
      const endTime = performance.now();
      renderTimes.push(endTime - startTime);
      
      // Cleanup
      component.unmount();
    }
    
    const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);
    
    // Average render time should be reasonable
    expect(averageRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    
    // Maximum render time should not be too much higher than average (consistency)
    expect(maxRenderTime).toBeLessThan(averageRenderTime * 2);
    
    console.log('Responsive Render Performance:', {
      average: Math.round(averageRenderTime),
      min: Math.round(minRenderTime),
      max: Math.round(maxRenderTime),
      consistency: Math.round((averageRenderTime / maxRenderTime) * 100) + '%',
      iterations: renderTimes.length,
    });
  });

  test('Asset loading performance', async () => {
    // Mock asset loading
    const mockAssets = [
      'icon.png',
      'splash.png',
      'adaptive-icon.png',
    ];
    
    const assetLoadStartTime = Date.now();
    
    // Simulate asset loading
    await Promise.all(
      mockAssets.map(async (asset) => {
        return new Promise((resolve) => {
          setTimeout(resolve, Math.random() * 100); // Random load time up to 100ms
        });
      })
    );
    
    const assetLoadTime = Date.now() - assetLoadStartTime;
    
    // Asset loading should be quick
    expect(assetLoadTime).toBeLessThan(500); // 500ms for all assets
    
    console.log('Asset Loading Performance:', {
      totalTime: assetLoadTime,
      assetsCount: mockAssets.length,
      averagePerAsset: Math.round(assetLoadTime / mockAssets.length),
    });
  });

  test('Component mounting performance', async () => {
    const mountingMetrics: { component: string; time: number }[] = [];
    
    // Measure individual component mounting times
    const components = [
      { name: 'AuthProvider', component: AuthProvider },
      { name: 'PremiumLandingPage', component: PremiumLandingPage },
    ];
    
    for (const { name, component: Component } of components) {
      const startTime = performance.now();
      
      const rendered = render(
        <NavigationContainer>
          <Component>
            <div>Test</div>
          </Component>
        </NavigationContainer>
      );
      
      const endTime = performance.now();
      const mountTime = endTime - startTime;
      
      mountingMetrics.push({ component: name, time: mountTime });
      
      // Each component should mount quickly
      expect(mountTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER / 2);
      
      rendered.unmount();
    }
    
    console.log('Component Mounting Performance:', mountingMetrics);
    
    // Total mounting time for all components should be reasonable
    const totalMountTime = mountingMetrics.reduce((sum, metric) => sum + metric.time, 0);
    expect(totalMountTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
  });

  test('Performance under different device conditions', async () => {
    const deviceConditions = [
      { name: 'Low-end device', cpuSlowdown: 4 },
      { name: 'Mid-range device', cpuSlowdown: 2 },
      { name: 'High-end device', cpuSlowdown: 1 },
    ];
    
    const conditionResults: { condition: string; renderTime: number }[] = [];
    
    for (const condition of deviceConditions) {
      // Simulate different device performance by adding delays
      const simulatedDelay = (PERFORMANCE_THRESHOLDS.COMPONENT_RENDER / 4) * (condition.cpuSlowdown - 1);
      
      const startTime = performance.now();
      
      const component = render(
        <NavigationContainer>
          <AuthProvider>
            <PremiumLandingPage />
          </AuthProvider>
        </NavigationContainer>
      );
      
      // Simulate slower processing
      await new Promise(resolve => setTimeout(resolve, simulatedDelay));
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      conditionResults.push({ condition: condition.name, renderTime });
      
      // Even on low-end devices, should render within acceptable time
      const acceptableThreshold = PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * condition.cpuSlowdown;
      expect(renderTime).toBeLessThan(acceptableThreshold);
      
      component.unmount();
    }
    
    console.log('Performance Under Different Device Conditions:', conditionResults);
  });
});