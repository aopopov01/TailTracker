import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PetProfileProvider } from '../contexts/PetProfileContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { AdvancedCacheService } from '../src/services/AdvancedCacheService';
import { MemoryManager } from '../src/services/MemoryManager';
import { PerformanceMonitor } from '../src/services/PerformanceMonitor';
import { StartupOptimizer } from '../src/services/StartupOptimizer';
import { log } from '../src/utils/Logger';
import { PerformanceTesting } from '../src/utils/PerformanceTesting';

// Performance-optimized root layout
export default function OptimizedRootLayout() {
  const initializationRef = useRef(false);

  useEffect(() => {
    // Ensure initialization only happens once
    if (initializationRef.current) return;
    initializationRef.current = true;

    // Start optimized startup sequence
    const initializeApp = async () => {
      try {
        // Initialize startup optimizer
        await StartupOptimizer.optimizeStartup();

        // Start continuous performance monitoring in development
        if (__DEV__) {
          PerformanceTesting.startContinuousMonitoring();
          
          // Log initial performance stats
          setTimeout(() => {
            log.performance('TailTracker Performance Stats:');
            log.debug('Memory:', MemoryManager.getMemoryStats());
            log.debug('Cache:', AdvancedCacheService.getCacheStats());
            log.debug('Startup:', StartupOptimizer.getStartupStats());
          }, 3000);
        }

      } catch (error) {
        log.error('❌ Failed to initialize optimized app:', error);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      PerformanceMonitor.dispose();
      MemoryManager.dispose();
    };
  }, []);

  // Memory cleanup for this component
  const cleanup = MemoryManager.createComponentCleanup();
  
  useEffect(() => {
    return cleanup.cleanup;
  }, [cleanup.cleanup]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <PetProfileProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2196F3',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              // Enable native stack for better performance
              animation: 'slide_from_right',
              presentation: 'card',
              // Optimize header rendering
              headerTitleAlign: 'center',
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{ 
                title: 'TailTracker'
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="auth/login" 
              options={{ 
                title: 'Login'
              }} 
            />
            <Stack.Screen 
              name="auth/register" 
              options={{ 
                title: 'Register'
              }} 
            />
            <Stack.Screen 
              name="sharing" 
              options={{ 
                headerShown: false
              }} 
            />
          </Stack>
          <StatusBar style="light" backgroundColor="#2196F3" translucent={false} />
        </PetProfileProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});