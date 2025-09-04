# TailTracker Performance Implementation Guide

This guide provides step-by-step instructions for implementing the performance optimizations identified in the performance audit. Follow this guide to systematically improve the app's startup time, memory usage, network performance, and overall user experience.

## Quick Start Implementation (Week 1)

### 1. Immediate Performance Wins

#### A. Update Metro Configuration
Replace your current `metro.config.js` with the optimized version:

```bash
# Backup current config
cp metro.config.js metro.config.js.backup

# Use the performance-optimized config
cp metro.config.performance.js metro.config.js
```

**Expected Impact**: 15-20% reduction in bundle size, faster development builds

#### B. Enable Performance Optimizer
Add the performance optimizer to your app's entry point:

```typescript
// app/_layout.tsx
import { PerformanceMonitor } from '../src/utils/PerformanceOptimizer';

export default function RootLayout() {
  return (
    <PerformanceMonitor>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          {/* your existing layout */}
        </AuthProvider>
      </GestureHandlerRootView>
    </PerformanceMonitor>
  );
}
```

**Expected Impact**: Device-specific optimizations, performance monitoring

#### C. Implement API Client Optimization
Replace direct fetch calls with the optimized API client:

```typescript
// Example: Update PremiumLostPetService.ts
import { apiClient } from '../utils/OptimizedApiClient';

// Replace this:
const response = await fetch(this.functionUrl, {
  method: 'POST',
  headers: { /* headers */ },
  body: JSON.stringify(data),
});

// With this:
const response = await apiClient.post('/lost-pet-alerts', data, {
  timeout: 10000,
  retries: 3,
  cache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
});
```

**Expected Impact**: 30-50% faster API responses, reduced network usage

### 2. Lazy Loading Implementation

#### A. Create Lazy Components
Convert heavy screens to lazy-loaded components:

```typescript
// Create lazy versions of heavy screens
const LazyDashboard = createLazyComponent(
  () => import('./(tabs)/dashboard'),
  { chunkName: 'dashboard', preload: true }
);

const LazyLostPetAlerts = createLazyComponent(
  () => import('./components/LostPet'),
  { chunkName: 'lost-pet-alerts' }
);

const LazyPaymentScreen = createLazyComponent(
  () => import('./components/Payment'),
  { chunkName: 'payment' }
);
```

#### B. Update Navigation
Wrap lazy components in your navigation:

```typescript
// app/(tabs)/_layout.tsx
import { LazyLoadingWrapper } from '../src/components/Performance/LazyLoadingWrapper';

function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="dashboard" 
        component={() => (
          <LazyLoadingWrapper loadingText="Loading Dashboard...">
            <LazyDashboard />
          </LazyLoadingWrapper>
        )}
      />
      {/* Other tabs */}
    </Tabs>
  );
}
```

**Expected Impact**: 40-60% faster initial app startup

### 3. Memory Optimization

#### A. Fix Context Memory Leaks
Update AuthContext to prevent memory leaks:

```typescript
// src/contexts/AuthContext.tsx
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const refreshed = await AuthService.refreshSession();
        if (!refreshed) {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Session refresh error:', error);
        dispatch({ type: 'LOGOUT' });
      }
    }, 15 * 60 * 1000);

    // FIX: Properly clean up interval
    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout,
    refreshSession,
    changePassword,
    clearError
  }), [state, login, register, logout, refreshSession, changePassword, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### B. Optimize Animation Memory Usage
Update the landing page animations to prevent memory leaks:

```typescript
// app/index.tsx
export default function PremiumLandingPage() {
  const { shouldEnableAnimations } = usePerformanceOptimizer();
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (!shouldEnableAnimations) {
      // Skip animations on low-end devices
      logoScale.value = 1;
      logoOpacity.value = 1;
      return;
    }

    // Logo entrance animation
    logoScale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoOpacity.value = withTiming(1, { duration: 800 });

    // Floating animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Cleanup function to cancel animations
    return () => {
      logoScale.value = 1;
      logoOpacity.value = 1;
      floatY.value = 0;
    };
  }, [shouldEnableAnimations]);

  // Rest of component...
}
```

**Expected Impact**: 20-30% reduction in memory usage, eliminated memory leaks

## Advanced Optimizations (Week 2-3)

### 4. Network Layer Enhancement

#### A. Implement Request Caching
Update all service files to use the optimized API client:

```typescript
// src/services/authService.ts
import { apiClient } from '../utils/OptimizedApiClient';

export class AuthService {
  static async login(credentials: UserCredentials): Promise<LoginResult> {
    try {
      const response = await apiClient.post<{ user: User; token: string }>(
        '/auth/login', 
        credentials,
        {
          timeout: 8000,
          retries: 2,
          cache: false, // Don't cache auth requests
        }
      );

      if (response.success) {
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}
```

#### B. Implement Offline Support
Add network state monitoring:

```typescript
// src/hooks/useNetworkState.ts
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

export const useNetworkState = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [networkType, setNetworkType] = useState<string>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setNetworkType(state.type);
      
      // Update API client with network state
      if (state.isConnected) {
        apiClient.clearCache(); // Refresh data when back online
      }
    });

    return unsubscribe;
  }, []);

  return { isConnected, networkType };
};
```

### 5. Lost Pet Alert System Optimization

#### A. Implement Location Caching
Create an optimized location service:

```typescript
// src/services/OptimizedLocationService.ts
import * as Location from 'expo-location';

class OptimizedLocationService {
  private locationCache: {
    location: { lat: number; lng: number };
    timestamp: number;
  } | null = null;
  
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getCurrentLocation(forceRefresh = false): Promise<{ lat: number; lng: number } | null> {
    // Use cached location if available and not expired
    if (!forceRefresh && this.isLocationCacheValid()) {
      return this.locationCache!.location;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: this.CACHE_DURATION,
        timeout: 10000,
      });

      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      // Cache the location
      this.locationCache = {
        location: coords,
        timestamp: Date.now(),
      };

      return coords;
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    }
  }

  private isLocationCacheValid(): boolean {
    return this.locationCache !== null && 
           (Date.now() - this.locationCache.timestamp) < this.CACHE_DURATION;
  }
}

export const locationService = new OptimizedLocationService();
```

#### B. Implement Real-time WebSocket Connection
Add WebSocket support for live alerts:

```typescript
// src/services/RealTimeLostPetAlerts.ts
import { LostPetAlert } from './PremiumLostPetService';

class RealTimeLostPetAlerts {
  private websocket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private alertSubscribers = new Set<(alert: LostPetAlert) => void>();
  private isConnected = false;

  connect(userLocation: { lat: number; lng: number }) {
    const wsUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'wss://your-websocket-url';
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      
      // Subscribe to alerts in user's area
      this.websocket?.send(JSON.stringify({
        type: 'subscribe_alerts',
        location: userLocation,
        radius: 25,
      }));
    };
    
    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'lost_pet_alert') {
          this.notifySubscribers(data.alert);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.websocket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.scheduleReconnect();
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isConnected) {
        console.log('Attempting WebSocket reconnection...');
        // Reconnect logic would go here
      }
    }, 5000);
  }

  subscribe(callback: (alert: LostPetAlert) => void) {
    this.alertSubscribers.add(callback);
    return () => this.alertSubscribers.delete(callback);
  }

  private notifySubscribers(alert: LostPetAlert) {
    this.alertSubscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert subscriber:', error);
      }
    });
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isConnected = false;
  }
}

export const realTimeLostPetAlerts = new RealTimeLostPetAlerts();
```

### 6. Performance Testing Integration

#### A. Run Performance Tests
Add performance testing to your CI/CD pipeline:

```bash
# Add to package.json scripts
npm run test:performance
```

#### B. Monitor Performance in Development
Enable performance monitoring in development:

```typescript
// App.tsx or main entry point
if (__DEV__) {
  import('./src/utils/PerformanceOptimizer').then(({ performanceOptimizer }) => {
    performanceOptimizer.initialize();
    performanceOptimizer.startPerfMonitoring();
  });
}
```

## Production Deployment (Week 4)

### 7. Build Optimization

#### A. Enable Production Optimizations
Update your build commands:

```bash
# For Android
expo build:android --release-channel production --optimize

# For iOS
expo build:ios --release-channel production --optimize
```

#### B. Bundle Analysis
Analyze your bundle size:

```bash
ANALYZE_BUNDLE=true npm start
```

### 8. Monitoring and Alerting

#### A. Production Performance Monitoring
Add performance monitoring to your app:

```typescript
// src/utils/ProductionMonitoring.ts
import Crashlytics from '@react-native-firebase/crashlytics';
import { performanceOptimizer } from './PerformanceOptimizer';

export const initializeProductionMonitoring = () => {
  if (!__DEV__) {
    // Report performance metrics to crashlytics
    setInterval(() => {
      const report = performanceOptimizer.getPerformanceReport();
      
      if (report.averageFPS < 30) {
        Crashlytics().log('Low FPS detected: ' + report.averageFPS);
      }
      
      if (report.memoryUsage > 200 * 1024 * 1024) { // 200MB
        Crashlytics().log('High memory usage: ' + report.memoryUsage);
      }
    }, 60000); // Every minute
  }
};
```

## Verification and Testing

### Performance Benchmarks

After implementation, you should see these improvements:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Cold Start Time | ~3-4s | <2s | 40-50% |
| Hot Start Time | ~1s | <500ms | 50% |
| Memory Usage | ~200MB | <150MB | 25% |
| API Response Time | ~2-3s | <1s | 60% |
| Bundle Size | ~15MB | ~10MB | 33% |

### Testing Checklist

- [ ] App launches in under 2 seconds on test devices
- [ ] Memory usage stays below 150MB during normal usage
- [ ] All animations run at 60 FPS
- [ ] API responses complete within 1 second
- [ ] Lost pet alerts load instantly
- [ ] No memory leaks after extended usage
- [ ] Performance tests pass in CI/CD
- [ ] Bundle size reduced by at least 20%

### Device Testing Matrix

Test performance on these device categories:

- **Low-end devices**: <2GB RAM, older processors
- **Mid-range devices**: 3-6GB RAM, recent processors  
- **High-end devices**: >6GB RAM, latest processors

## Troubleshooting

### Common Issues

#### 1. Metro Build Errors
If you encounter Metro configuration errors:

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Reset node modules
rm -rf node_modules && npm install
```

#### 2. Performance Regression
If performance degrades after implementation:

1. Check performance tests: `npm run test:performance`
2. Analyze bundle: `ANALYZE_BUNDLE=true npm start`
3. Review error logs in development console

#### 3. Memory Leaks
If memory usage increases over time:

1. Run memory leak tests
2. Check component cleanup in `useEffect` hooks
3. Review context provider implementations

## Maintenance

### Ongoing Performance Monitoring

1. **Weekly**: Review performance metrics dashboard
2. **Monthly**: Run full performance test suite
3. **Quarterly**: Analyze and optimize bundle size
4. **Major releases**: Complete performance audit

### Performance Budget

Maintain these performance budgets:

- **JavaScript bundle**: <10MB
- **Asset bundle**: <5MB
- **Cold start time**: <2s
- **Memory usage**: <150MB baseline
- **API response time**: <1s average

## Support

For questions about implementation:

1. Review the performance audit report
2. Check the implementation examples in the codebase
3. Run performance tests to identify issues
4. Monitor performance metrics in development

The performance optimizations should be implemented incrementally, with testing at each stage to ensure stability and measure improvement.