/**
 * Advanced Stress Testing Framework for TailTracker
 * 
 * This framework simulates extreme load conditions, concurrent operations,
 * and high-stress scenarios to ensure the app remains stable and performant.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';

export interface StressTestResult {
  testName: string;
  category: 'load' | 'concurrency' | 'memory' | 'network' | 'database' | 'ui' | 'notifications';
  status: 'pass' | 'fail' | 'error';
  duration: number;
  operationsCompleted: number;
  operationsPerSecond: number;
  errorRate: number;
  memoryPeakUsage?: number;
  details: string;
  errorDetails?: string;
  performanceMetrics: {
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
  };
}

export interface StressTestConfig {
  duration: number; // Test duration in milliseconds
  concurrentUsers: number; // Number of concurrent operations
  operationsPerSecond: number; // Target operations per second
  maxMemoryUsage: number; // Maximum allowed memory usage in bytes
  maxErrorRate: number; // Maximum acceptable error rate (0-1)
  rampUpTime: number; // Time to ramp up to full load
  coolDownTime: number; // Time to cool down after test
}

export class StressTestFramework {
  private testResults: StressTestResult[] = [];
  private activeOperations = new Map<string, Promise<any>>();
  private performanceMetrics: number[] = [];
  private errorCount = 0;
  private totalOperations = 0;
  private testStartTime = 0;

  /**
   * Run comprehensive stress testing suite
   */
  async runAllStressTests(): Promise<StressTestResult[]> {
    console.log('⚡ Starting Comprehensive Stress Testing Suite...');
    
    try {
      this.testResults = [];
      
      // High load stress tests
      await this.runHighLoadStressTests();
      
      // Concurrent operation stress tests
      await this.runConcurrentOperationTests();
      
      // Memory stress tests
      await this.runMemoryStressTests();
      
      // Network stress tests
      await this.runNetworkStressTests();
      
      // Database stress tests
      await this.runDatabaseStressTests();
      
      // UI stress tests
      await this.runUIStressTests();
      
      // Notification flood tests
      await this.runNotificationStressTests();
      
      // Combined stress scenarios
      await this.runCombinedStressTests();
      
      console.log(`✅ Stress Testing Complete: ${this.testResults.length} tests executed`);
      return this.testResults;
    } catch (error) {
      console.error('❌ Stress Testing Framework Error:', error);
      throw error;
    }
  }

  /**
   * High load stress tests
   */
  private async runHighLoadStressTests(): Promise<void> {
    console.log('🔥 Running High Load Stress Tests...');

    // Test massive pet creation load
    await this.executeStressTest(
      'Massive Pet Creation Load',
      'load',
      {
        duration: 60000, // 1 minute
        concurrentUsers: 50,
        operationsPerSecond: 10,
        maxMemoryUsage: 200 * 1024 * 1024, // 200MB
        maxErrorRate: 0.05, // 5%
        rampUpTime: 10000,
        coolDownTime: 5000
      },
      async (config) => await this.simulateMassivePetCreation(config)
    );

    // Test rapid-fire user interactions
    await this.executeStressTest(
      'Rapid Fire User Interactions',
      'load',
      {
        duration: 45000,
        concurrentUsers: 100,
        operationsPerSecond: 20,
        maxMemoryUsage: 150 * 1024 * 1024,
        maxErrorRate: 0.03,
        rampUpTime: 5000,
        coolDownTime: 3000
      },
      async (config) => await this.simulateRapidUserInteractions(config)
    );

    // Test high-frequency data synchronization
    await this.executeStressTest(
      'High Frequency Data Sync',
      'load',
      {
        duration: 120000, // 2 minutes
        concurrentUsers: 25,
        operationsPerSecond: 5,
        maxMemoryUsage: 300 * 1024 * 1024,
        maxErrorRate: 0.02,
        rampUpTime: 15000,
        coolDownTime: 10000
      },
      async (config) => await this.simulateHighFrequencyDataSync(config)
    );

    // Test image processing overload
    await this.executeStressTest(
      'Image Processing Overload',
      'load',
      {
        duration: 90000,
        concurrentUsers: 20,
        operationsPerSecond: 3,
        maxMemoryUsage: 400 * 1024 * 1024,
        maxErrorRate: 0.10,
        rampUpTime: 20000,
        coolDownTime: 15000
      },
      async (config) => await this.simulateImageProcessingOverload(config)
    );
  }

  /**
   * Concurrent operation stress tests
   */
  private async runConcurrentOperationTests(): Promise<void> {
    console.log('⚡ Running Concurrent Operation Tests...');

    // Test concurrent database operations
    await this.executeStressTest(
      'Concurrent Database Operations',
      'concurrency',
      {
        duration: 60000,
        concurrentUsers: 100,
        operationsPerSecond: 15,
        maxMemoryUsage: 250 * 1024 * 1024,
        maxErrorRate: 0.05,
        rampUpTime: 10000,
        coolDownTime: 5000
      },
      async (config) => await this.simulateConcurrentDatabaseOperations(config)
    );

    // Test concurrent API requests
    await this.executeStressTest(
      'Concurrent API Requests',
      'concurrency',
      {
        duration: 90000,
        concurrentUsers: 200,
        operationsPerSecond: 25,
        maxMemoryUsage: 200 * 1024 * 1024,
        maxErrorRate: 0.08,
        rampUpTime: 15000,
        coolDownTime: 10000
      },
      async (config) => await this.simulateConcurrentAPIRequests(config)
    );

    // Test concurrent file operations
    await this.executeStressTest(
      'Concurrent File Operations',
      'concurrency',
      {
        duration: 75000,
        concurrentUsers: 50,
        operationsPerSecond: 8,
        maxMemoryUsage: 300 * 1024 * 1024,
        maxErrorRate: 0.10,
        rampUpTime: 12000,
        coolDownTime: 8000
      },
      async (config) => await this.simulateConcurrentFileOperations(config)
    );

    // Test concurrent navigation operations
    await this.executeStressTest(
      'Concurrent Navigation Operations',
      'concurrency',
      {
        duration: 45000,
        concurrentUsers: 150,
        operationsPerSecond: 30,
        maxMemoryUsage: 180 * 1024 * 1024,
        maxErrorRate: 0.03,
        rampUpTime: 8000,
        coolDownTime: 5000
      },
      async (config) => await this.simulateConcurrentNavigation(config)
    );
  }

  /**
   * Memory stress tests
   */
  private async runMemoryStressTests(): Promise<void> {
    console.log('🧠 Running Memory Stress Tests...');

    // Test memory allocation bombing
    await this.executeStressTest(
      'Memory Allocation Bomb',
      'memory',
      {
        duration: 30000,
        concurrentUsers: 10,
        operationsPerSecond: 5,
        maxMemoryUsage: 500 * 1024 * 1024, // 500MB limit
        maxErrorRate: 0.20,
        rampUpTime: 5000,
        coolDownTime: 15000
      },
      async (config) => await this.simulateMemoryAllocationBomb(config)
    );

    // Test memory leak simulation
    await this.executeStressTest(
      'Memory Leak Simulation',
      'memory',
      {
        duration: 120000,
        concurrentUsers: 20,
        operationsPerSecond: 3,
        maxMemoryUsage: 400 * 1024 * 1024,
        maxErrorRate: 0.15,
        rampUpTime: 20000,
        coolDownTime: 30000
      },
      async (config) => await this.simulateMemoryLeakScenario(config)
    );

    // Test rapid garbage collection triggers
    await this.executeStressTest(
      'Rapid GC Triggers',
      'memory',
      {
        duration: 60000,
        concurrentUsers: 30,
        operationsPerSecond: 10,
        maxMemoryUsage: 300 * 1024 * 1024,
        maxErrorRate: 0.10,
        rampUpTime: 10000,
        coolDownTime: 20000
      },
      async (config) => await this.simulateRapidGCTriggers(config)
    );
  }

  /**
   * Network stress tests
   */
  private async runNetworkStressTests(): Promise<void> {
    console.log('🌐 Running Network Stress Tests...');

    // Test API flooding
    await this.executeStressTest(
      'API Request Flooding',
      'network',
      {
        duration: 90000,
        concurrentUsers: 300,
        operationsPerSecond: 50,
        maxMemoryUsage: 250 * 1024 * 1024,
        maxErrorRate: 0.15,
        rampUpTime: 15000,
        coolDownTime: 10000
      },
      async (config) => await this.simulateAPIFlooding(config)
    );

    // Test large data transfer stress
    await this.executeStressTest(
      'Large Data Transfer Stress',
      'network',
      {
        duration: 120000,
        concurrentUsers: 20,
        operationsPerSecond: 2,
        maxMemoryUsage: 400 * 1024 * 1024,
        maxErrorRate: 0.20,
        rampUpTime: 20000,
        coolDownTime: 15000
      },
      async (config) => await this.simulateLargeDataTransferStress(config)
    );

    // Test network timeout scenarios
    await this.executeStressTest(
      'Network Timeout Stress',
      'network',
      {
        duration: 60000,
        concurrentUsers: 100,
        operationsPerSecond: 15,
        maxMemoryUsage: 200 * 1024 * 1024,
        maxErrorRate: 0.30,
        rampUpTime: 10000,
        coolDownTime: 5000
      },
      async (config) => await this.simulateNetworkTimeoutStress(config)
    );
  }

  /**
   * Database stress tests
   */
  private async runDatabaseStressTests(): Promise<void> {
    console.log('💾 Running Database Stress Tests...');

    // Test transaction overload
    await this.executeStressTest(
      'Database Transaction Overload',
      'database',
      {
        duration: 75000,
        concurrentUsers: 80,
        operationsPerSecond: 12,
        maxMemoryUsage: 300 * 1024 * 1024,
        maxErrorRate: 0.10,
        rampUpTime: 15000,
        coolDownTime: 10000
      },
      async (config) => await this.simulateDatabaseTransactionOverload(config)
    );

    // Test massive data insertion
    await this.executeStressTest(
      'Massive Data Insertion',
      'database',
      {
        duration: 90000,
        concurrentUsers: 50,
        operationsPerSecond: 8,
        maxMemoryUsage: 350 * 1024 * 1024,
        maxErrorRate: 0.08,
        rampUpTime: 20000,
        coolDownTime: 15000
      },
      async (config) => await this.simulateMassiveDataInsertion(config)
    );

    // Test complex query overload
    await this.executeStressTest(
      'Complex Query Overload',
      'database',
      {
        duration: 60000,
        concurrentUsers: 40,
        operationsPerSecond: 6,
        maxMemoryUsage: 280 * 1024 * 1024,
        maxErrorRate: 0.12,
        rampUpTime: 12000,
        coolDownTime: 8000
      },
      async (config) => await this.simulateComplexQueryOverload(config)
    );
  }

  /**
   * UI stress tests
   */
  private async runUIStressTests(): Promise<void> {
    console.log('🎨 Running UI Stress Tests...');

    // Test scroll performance under load
    await this.executeStressTest(
      'Scroll Performance Under Load',
      'ui',
      {
        duration: 45000,
        concurrentUsers: 1, // Single UI thread
        operationsPerSecond: 60, // 60 FPS target
        maxMemoryUsage: 200 * 1024 * 1024,
        maxErrorRate: 0.02,
        rampUpTime: 5000,
        coolDownTime: 3000
      },
      async (config) => await this.simulateScrollPerformanceStress(config)
    );

    // Test animation stress
    await this.executeStressTest(
      'Animation Performance Stress',
      'ui',
      {
        duration: 60000,
        concurrentUsers: 1,
        operationsPerSecond: 60,
        maxMemoryUsage: 250 * 1024 * 1024,
        maxErrorRate: 0.05,
        rampUpTime: 8000,
        coolDownTime: 5000
      },
      async (config) => await this.simulateAnimationStress(config)
    );

    // Test layout thrashing
    await this.executeStressTest(
      'Layout Thrashing Stress',
      'ui',
      {
        duration: 30000,
        concurrentUsers: 1,
        operationsPerSecond: 30,
        maxMemoryUsage: 180 * 1024 * 1024,
        maxErrorRate: 0.08,
        rampUpTime: 3000,
        coolDownTime: 5000
      },
      async (config) => await this.simulateLayoutThrashing(config)
    );
  }

  /**
   * Notification stress tests
   */
  private async runNotificationStressTests(): Promise<void> {
    console.log('🔔 Running Notification Stress Tests...');

    // Test notification flooding
    await this.executeStressTest(
      'Notification Flooding',
      'notifications',
      {
        duration: 30000,
        concurrentUsers: 10,
        operationsPerSecond: 20,
        maxMemoryUsage: 150 * 1024 * 1024,
        maxErrorRate: 0.05,
        rampUpTime: 3000,
        coolDownTime: 10000
      },
      async (config) => await this.simulateNotificationFlooding(config)
    );

    // Test push notification overload
    await this.executeStressTest(
      'Push Notification Overload',
      'notifications',
      {
        duration: 60000,
        concurrentUsers: 5,
        operationsPerSecond: 10,
        maxMemoryUsage: 200 * 1024 * 1024,
        maxErrorRate: 0.10,
        rampUpTime: 5000,
        coolDownTime: 15000
      },
      async (config) => await this.simulatePushNotificationOverload(config)
    );
  }

  /**
   * Combined stress scenarios
   */
  private async runCombinedStressTests(): Promise<void> {
    console.log('🌪️ Running Combined Stress Scenarios...');

    // Test everything at once - the ultimate stress test
    await this.executeStressTest(
      'Ultimate Combined Stress Test',
      'load',
      {
        duration: 180000, // 3 minutes
        concurrentUsers: 500,
        operationsPerSecond: 100,
        maxMemoryUsage: 600 * 1024 * 1024, // 600MB
        maxErrorRate: 0.25, // Allow higher error rate for extreme test
        rampUpTime: 30000,
        coolDownTime: 60000
      },
      async (config) => await this.simulateUltimateStressTest(config)
    );
  }

  /**
   * Execute stress test with monitoring and metrics collection
   */
  private async executeStressTest(
    testName: string,
    category: StressTestResult['category'],
    config: StressTestConfig,
    stressFunction: (config: StressTestConfig) => Promise<void>
  ): Promise<void> {
    console.log(`  ⚡ Running: ${testName}`);
    
    this.testStartTime = Date.now();
    this.performanceMetrics = [];
    this.errorCount = 0;
    this.totalOperations = 0;
    this.activeOperations.clear();

    let result: StressTestResult;
    let initialMemory = 0;
    let peakMemory = 0;

    try {
      // Get initial memory usage
      initialMemory = await this.getMemoryUsage();
      
      // Start memory monitoring
      const memoryMonitor = this.startMemoryMonitoring();
      
      // Execute stress test
      await stressFunction(config);
      
      // Stop memory monitoring
      clearInterval(memoryMonitor);
      peakMemory = await this.getMemoryUsage();

      // Wait for all operations to complete
      await this.waitForAllOperations();

      // Calculate metrics
      const duration = Date.now() - this.testStartTime;
      const errorRate = this.errorCount / Math.max(this.totalOperations, 1);
      const operationsPerSecond = (this.totalOperations / duration) * 1000;

      const performanceMetrics = this.calculatePerformanceMetrics();

      result = {
        testName,
        category,
        status: errorRate <= config.maxErrorRate ? 'pass' : 'fail',
        duration,
        operationsCompleted: this.totalOperations,
        operationsPerSecond,
        errorRate,
        memoryPeakUsage: peakMemory - initialMemory,
        details: this.generateTestDetails(config, errorRate, peakMemory - initialMemory),
        performanceMetrics
      };

      // Check if test exceeded memory limits
      if (peakMemory - initialMemory > config.maxMemoryUsage) {
        result.status = 'fail';
        result.details += ` FAILED: Memory usage exceeded limit (${Math.round((peakMemory - initialMemory) / 1024 / 1024)}MB > ${Math.round(config.maxMemoryUsage / 1024 / 1024)}MB)`;
      }

    } catch (error: any) {
      const duration = Date.now() - this.testStartTime;
      result = {
        testName,
        category,
        status: 'error',
        duration,
        operationsCompleted: this.totalOperations,
        operationsPerSecond: 0,
        errorRate: 1,
        memoryPeakUsage: peakMemory - initialMemory,
        details: `Test failed with error: ${error.message}`,
        errorDetails: error.stack,
        performanceMetrics: {
          averageResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
          p95ResponseTime: 0,
          throughput: 0
        }
      };
    }

    this.testResults.push(result);
    this.logStressTestResult(result);
    
    // Cool down period
    if (config.coolDownTime > 0) {
      console.log(`    ⏳ Cooling down for ${config.coolDownTime}ms...`);
      await this.sleep(config.coolDownTime);
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
    }
  }

  /**
   * Individual stress test implementations
   */
  private async simulateMassivePetCreation(config: StressTestConfig): Promise<void> {
    const operationsPerIteration = Math.ceil(config.operationsPerSecond / 10); // 10 iterations per second
    
    const createPets = async () => {
      for (let i = 0; i < operationsPerIteration; i++) {
        const operation = this.simulatePetCreation();
        this.trackOperation(`pet_creation_${Date.now()}_${i}`, operation);
        await this.sleep(Math.random() * 100); // Randomize timing
      }
    };

    await this.runStressTestLoop(config, createPets, 100); // 100ms intervals
  }

  private async simulateRapidUserInteractions(config: StressTestConfig): Promise<void> {
    const interactions = ['tap', 'swipe', 'scroll', 'pinch', 'long_press'];
    
    const performInteractions = async () => {
      const numInteractions = Math.ceil(config.operationsPerSecond / 20); // 20 iterations per second
      
      for (let i = 0; i < numInteractions; i++) {
        const interaction = interactions[Math.floor(Math.random() * interactions.length)];
        const operation = this.simulateUserInteraction(interaction);
        this.trackOperation(`interaction_${interaction}_${Date.now()}`, operation);
      }
    };

    await this.runStressTestLoop(config, performInteractions, 50); // 50ms intervals
  }

  private async simulateHighFrequencyDataSync(config: StressTestConfig): Promise<void> {
    const syncData = async () => {
      const numSyncs = Math.ceil(config.operationsPerSecond / 5); // 5 iterations per second
      
      for (let i = 0; i < numSyncs; i++) {
        const operation = this.simulateDataSynchronization();
        this.trackOperation(`data_sync_${Date.now()}_${i}`, operation);
        await this.sleep(Math.random() * 200); // Randomize timing
      }
    };

    await this.runStressTestLoop(config, syncData, 200); // 200ms intervals
  }

  private async simulateImageProcessingOverload(config: StressTestConfig): Promise<void> {
    const processImages = async () => {
      const numImages = Math.ceil(config.operationsPerSecond / 3); // 3 iterations per second
      
      for (let i = 0; i < numImages; i++) {
        const operation = this.simulateImageProcessing();
        this.trackOperation(`image_process_${Date.now()}_${i}`, operation);
      }
    };

    await this.runStressTestLoop(config, processImages, 333); // ~333ms intervals
  }

  private async simulateConcurrentDatabaseOperations(config: StressTestConfig): Promise<void> {
    const dbOperations = ['insert', 'update', 'delete', 'select'];
    
    const performDBOperations = async () => {
      const numOps = Math.ceil(config.operationsPerSecond / 10); // 10 iterations per second
      
      for (let i = 0; i < numOps; i++) {
        const operation = dbOperations[Math.floor(Math.random() * dbOperations.length)];
        const dbOp = this.simulateDatabaseOperation(operation);
        this.trackOperation(`db_${operation}_${Date.now()}`, dbOp);
      }
    };

    await this.runStressTestLoop(config, performDBOperations, 100); // 100ms intervals
  }

  private async simulateConcurrentAPIRequests(config: StressTestConfig): Promise<void> {
    const apiEndpoints = ['/pets', '/families', '/activities', '/medical', '/alerts'];
    
    const makeAPIRequests = async () => {
      const numRequests = Math.ceil(config.operationsPerSecond / 10); // 10 iterations per second
      
      for (let i = 0; i < numRequests; i++) {
        const endpoint = apiEndpoints[Math.floor(Math.random() * apiEndpoints.length)];
        const request = this.simulateAPIRequest(endpoint);
        this.trackOperation(`api_${endpoint.replace('/', '')}_${Date.now()}`, request);
      }
    };

    await this.runStressTestLoop(config, makeAPIRequests, 100); // 100ms intervals
  }

  private async simulateConcurrentFileOperations(config: StressTestConfig): Promise<void> {
    const fileOps = ['read', 'write', 'delete', 'copy'];
    
    const performFileOps = async () => {
      const numOps = Math.ceil(config.operationsPerSecond / 8); // 8 iterations per second
      
      for (let i = 0; i < numOps; i++) {
        const operation = fileOps[Math.floor(Math.random() * fileOps.length)];
        const fileOp = this.simulateFileOperation(operation);
        this.trackOperation(`file_${operation}_${Date.now()}`, fileOp);
      }
    };

    await this.runStressTestLoop(config, performFileOps, 125); // 125ms intervals
  }

  private async simulateConcurrentNavigation(config: StressTestConfig): Promise<void> {
    const screens = ['PetList', 'PetDetail', 'AddPet', 'Family', 'Settings'];
    
    const performNavigation = async () => {
      const numNavs = Math.ceil(config.operationsPerSecond / 15); // 15 iterations per second
      
      for (let i = 0; i < numNavs; i++) {
        const screen = screens[Math.floor(Math.random() * screens.length)];
        const nav = this.simulateNavigation(screen);
        this.trackOperation(`nav_${screen}_${Date.now()}`, nav);
      }
    };

    await this.runStressTestLoop(config, performNavigation, 66); // ~66ms intervals
  }

  private async simulateMemoryAllocationBomb(config: StressTestConfig): Promise<void> {
    const allocateMemory = async () => {
      const numAllocations = Math.ceil(config.operationsPerSecond / 5); // 5 iterations per second
      
      for (let i = 0; i < numAllocations; i++) {
        const operation = this.simulateMemoryAllocation();
        this.trackOperation(`memory_alloc_${Date.now()}_${i}`, operation);
      }
    };

    await this.runStressTestLoop(config, allocateMemory, 200); // 200ms intervals
  }

  private async simulateMemoryLeakScenario(config: StressTestConfig): Promise<void> {
    const memoryLeaks: any[] = [];
    
    const createMemoryLeaks = async () => {
      const numLeaks = Math.ceil(config.operationsPerSecond / 3); // 3 iterations per second
      
      for (let i = 0; i < numLeaks; i++) {
        // Intentionally create objects that won't be garbage collected
        const leakyData = {
          id: Date.now() + i,
          data: new Array(10000).fill(`leak_data_${i}`),
          circularRef: null as any
        };
        leakyData.circularRef = leakyData; // Create circular reference
        memoryLeaks.push(leakyData);
        
        this.totalOperations++;
      }
    };

    await this.runStressTestLoop(config, createMemoryLeaks, 333); // ~333ms intervals
    
    // Clean up memory leaks at the end
    memoryLeaks.length = 0;
  }

  private async simulateRapidGCTriggers(config: StressTestConfig): Promise<void> {
    const triggerGC = async () => {
      const numTriggers = Math.ceil(config.operationsPerSecond / 10); // 10 iterations per second
      
      for (let i = 0; i < numTriggers; i++) {
        const operation = this.simulateGCTrigger();
        this.trackOperation(`gc_trigger_${Date.now()}_${i}`, operation);
      }
    };

    await this.runStressTestLoop(config, triggerGC, 100); // 100ms intervals
  }

  private async simulateAPIFlooding(config: StressTestConfig): Promise<void> {
    const floodAPI = async () => {
      const numRequests = Math.ceil(config.operationsPerSecond / 20); // 20 iterations per second
      
      for (let i = 0; i < numRequests; i++) {
        const request = this.simulateFloodRequest();
        this.trackOperation(`flood_request_${Date.now()}_${i}`, request);
      }
    };

    await this.runStressTestLoop(config, floodAPI, 50); // 50ms intervals
  }

  private async simulateLargeDataTransferStress(config: StressTestConfig): Promise<void> {
    const transferData = async () => {
      const numTransfers = Math.ceil(config.operationsPerSecond / 2); // 2 iterations per second
      
      for (let i = 0; i < numTransfers; i++) {
        const transfer = this.simulateLargeDataTransfer();
        this.trackOperation(`large_transfer_${Date.now()}_${i}`, transfer);
      }
    };

    await this.runStressTestLoop(config, transferData, 500); // 500ms intervals
  }

  private async simulateNetworkTimeoutStress(config: StressTestConfig): Promise<void> {
    const timeoutRequests = async () => {
      const numRequests = Math.ceil(config.operationsPerSecond / 15); // 15 iterations per second
      
      for (let i = 0; i < numRequests; i++) {
        const request = this.simulateTimeoutRequest();
        this.trackOperation(`timeout_request_${Date.now()}_${i}`, request);
      }
    };

    await this.runStressTestLoop(config, timeoutRequests, 66); // ~66ms intervals
  }

  private async simulateDatabaseTransactionOverload(config: StressTestConfig): Promise<void> {
    const runTransactions = async () => {
      const numTransactions = Math.ceil(config.operationsPerSecond / 12); // 12 iterations per second
      
      for (let i = 0; i < numTransactions; i++) {
        const transaction = this.simulateDatabaseTransaction();
        this.trackOperation(`db_transaction_${Date.now()}_${i}`, transaction);
      }
    };

    await this.runStressTestLoop(config, runTransactions, 83); // ~83ms intervals
  }

  private async simulateMassiveDataInsertion(config: StressTestConfig): Promise<void> {
    const insertData = async () => {
      const numInserts = Math.ceil(config.operationsPerSecond / 8); // 8 iterations per second
      
      for (let i = 0; i < numInserts; i++) {
        const insert = this.simulateMassiveDataInsert();
        this.trackOperation(`data_insert_${Date.now()}_${i}`, insert);
      }
    };

    await this.runStressTestLoop(config, insertData, 125); // 125ms intervals
  }

  private async simulateComplexQueryOverload(config: StressTestConfig): Promise<void> {
    const runQueries = async () => {
      const numQueries = Math.ceil(config.operationsPerSecond / 6); // 6 iterations per second
      
      for (let i = 0; i < numQueries; i++) {
        const query = this.simulateComplexQuery();
        this.trackOperation(`complex_query_${Date.now()}_${i}`, query);
      }
    };

    await this.runStressTestLoop(config, runQueries, 166); // ~166ms intervals
  }

  private async simulateScrollPerformanceStress(config: StressTestConfig): Promise<void> {
    const performScrolls = async () => {
      const numScrolls = Math.ceil(config.operationsPerSecond / 60); // 60 iterations per second (60 FPS)
      
      for (let i = 0; i < numScrolls; i++) {
        const scroll = this.simulateScrollOperation();
        this.trackOperation(`scroll_${Date.now()}_${i}`, scroll);
      }
    };

    await this.runStressTestLoop(config, performScrolls, 16); // ~16ms intervals (60 FPS)
  }

  private async simulateAnimationStress(config: StressTestConfig): Promise<void> {
    const runAnimations = async () => {
      const numAnimations = Math.ceil(config.operationsPerSecond / 60); // 60 iterations per second
      
      for (let i = 0; i < numAnimations; i++) {
        const animation = this.simulateAnimationFrame();
        this.trackOperation(`animation_${Date.now()}_${i}`, animation);
      }
    };

    await this.runStressTestLoop(config, runAnimations, 16); // ~16ms intervals
  }

  private async simulateLayoutThrashing(config: StressTestConfig): Promise<void> {
    const thrashLayouts = async () => {
      const numThrashes = Math.ceil(config.operationsPerSecond / 30); // 30 iterations per second
      
      for (let i = 0; i < numThrashes; i++) {
        const thrash = this.simulateLayoutThrash();
        this.trackOperation(`layout_thrash_${Date.now()}_${i}`, thrash);
      }
    };

    await this.runStressTestLoop(config, thrashLayouts, 33); // ~33ms intervals
  }

  private async simulateNotificationFlooding(config: StressTestConfig): Promise<void> {
    const floodNotifications = async () => {
      const numNotifications = Math.ceil(config.operationsPerSecond / 20); // 20 iterations per second
      
      for (let i = 0; i < numNotifications; i++) {
        const notification = this.simulateNotificationCreation();
        this.trackOperation(`notification_${Date.now()}_${i}`, notification);
      }
    };

    await this.runStressTestLoop(config, floodNotifications, 50); // 50ms intervals
  }

  private async simulatePushNotificationOverload(config: StressTestConfig): Promise<void> {
    const pushNotifications = async () => {
      const numPushes = Math.ceil(config.operationsPerSecond / 10); // 10 iterations per second
      
      for (let i = 0; i < numPushes; i++) {
        const push = this.simulatePushNotification();
        this.trackOperation(`push_notification_${Date.now()}_${i}`, push);
      }
    };

    await this.runStressTestLoop(config, pushNotifications, 100); // 100ms intervals
  }

  private async simulateUltimateStressTest(config: StressTestConfig): Promise<void> {
    // Run multiple stress scenarios simultaneously
    const ultimateStress = async () => {
      const operations = [
        this.simulatePetCreation(),
        this.simulateUserInteraction('tap'),
        this.simulateDataSynchronization(),
        this.simulateImageProcessing(),
        this.simulateDatabaseOperation('select'),
        this.simulateAPIRequest('/pets'),
        this.simulateFileOperation('read'),
        this.simulateNavigation('PetDetail'),
        this.simulateMemoryAllocation(),
        this.simulateNotificationCreation()
      ];

      operations.forEach((op, index) => {
        this.trackOperation(`ultimate_${Date.now()}_${index}`, op);
      });
    };

    await this.runStressTestLoop(config, ultimateStress, 10); // 10ms intervals - maximum stress!
  }

  /**
   * Core simulation methods
   */
  private async simulatePetCreation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate pet creation with realistic data
      const pet = {
        id: `pet_${Date.now()}_${Math.random()}`,
        name: `StressPet_${Math.floor(Math.random() * 10000)}`,
        species: ['dog', 'cat', 'bird', 'rabbit'][Math.floor(Math.random() * 4)],
        breed: 'Stress Test Breed',
        age: Math.floor(Math.random() * 15),
        photos: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, 
          (_, i) => `stress_photo_${Date.now()}_${i}.jpg`),
        medicalHistory: Array.from({ length: Math.floor(Math.random() * 10) }, 
          (_, i) => ({ id: i, treatment: `Stress treatment ${i}`, date: new Date().toISOString() })),
        activities: Array.from({ length: Math.floor(Math.random() * 20) }, 
          (_, i) => ({ id: i, type: 'walk', duration: Math.random() * 3600, timestamp: Date.now() }))
      };

      // Simulate saving to storage
      await AsyncStorage.setItem(`stress_pet_${pet.id}`, JSON.stringify(pet));
      
      // Add random delay to simulate processing time
      await this.sleep(Math.random() * 100);
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateUserInteraction(type: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate different interaction types with varying complexity
      switch (type) {
        case 'tap':
          await this.sleep(Math.random() * 10); // Quick tap
          break;
        case 'swipe':
          await this.sleep(Math.random() * 50); // Swipe with animation
          break;
        case 'scroll':
          await this.sleep(Math.random() * 30); // Scroll rendering
          break;
        case 'pinch':
          await this.sleep(Math.random() * 100); // Pinch zoom calculation
          break;
        case 'long_press':
          await this.sleep(Math.random() * 200); // Long press with haptic feedback
          break;
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateDataSynchronization(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate data sync with server
      const syncData = {
        pets: Array.from({ length: 10 }, (_, i) => ({ id: i, updated: Date.now() })),
        families: Array.from({ length: 3 }, (_, i) => ({ id: i, updated: Date.now() })),
        activities: Array.from({ length: 50 }, (_, i) => ({ id: i, updated: Date.now() }))
      };

      // Simulate network delay
      await this.sleep(Math.random() * 500 + 100);
      
      // Simulate local storage update
      await AsyncStorage.setItem(`sync_data_${Date.now()}`, JSON.stringify(syncData));
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateImageProcessing(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate image processing operations
      const imageSize = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 pixels
      const processingTime = (imageSize / 1000) * 50; // Simulate processing time based on size
      
      await this.sleep(processingTime);
      
      // Simulate memory allocation for image processing
      const imageData = new Array(imageSize).fill(0);
      
      // Simulate image transformations
      for (let i = 0; i < imageSize / 100; i++) {
        imageData[i] = Math.random() * 255;
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateDatabaseOperation(operation: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      let processingTime = 0;
      
      switch (operation) {
        case 'insert':
          processingTime = Math.random() * 50 + 10;
          break;
        case 'update':
          processingTime = Math.random() * 40 + 15;
          break;
        case 'delete':
          processingTime = Math.random() * 30 + 5;
          break;
        case 'select':
          processingTime = Math.random() * 100 + 20;
          break;
      }
      
      await this.sleep(processingTime);
      
      // Simulate database result
      const result = {
        operation,
        affected_rows: Math.floor(Math.random() * 10) + 1,
        execution_time: processingTime,
        timestamp: Date.now()
      };
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateAPIRequest(endpoint: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate network latency
      const networkDelay = Math.random() * 200 + 50; // 50-250ms
      await this.sleep(networkDelay);
      
      // Simulate random failures (5% failure rate)
      if (Math.random() < 0.05) {
        throw new Error(`API request failed for ${endpoint}`);
      }
      
      // Simulate response processing
      const responseSize = Math.floor(Math.random() * 10000) + 1000; // 1KB-11KB
      const responseData = new Array(responseSize).fill('x').join('');
      
      await this.sleep(Math.random() * 50); // Processing time
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateFileOperation(operation: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      let processingTime = 0;
      const fileSize = Math.floor(Math.random() * 1000000) + 100000; // 100KB-1.1MB
      
      switch (operation) {
        case 'read':
          processingTime = (fileSize / 1000000) * 100; // Time based on file size
          break;
        case 'write':
          processingTime = (fileSize / 1000000) * 150;
          break;
        case 'delete':
          processingTime = Math.random() * 20 + 5;
          break;
        case 'copy':
          processingTime = (fileSize / 1000000) * 200;
          break;
      }
      
      await this.sleep(processingTime);
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateNavigation(screen: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate navigation processing time
      const navigationTime = Math.random() * 100 + 50; // 50-150ms
      await this.sleep(navigationTime);
      
      // Simulate screen rendering time
      const renderTime = Math.random() * 200 + 100; // 100-300ms
      await this.sleep(renderTime);
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateMemoryAllocation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate large memory allocation
      const allocationSize = Math.floor(Math.random() * 10000000) + 1000000; // 1MB-11MB
      const memoryBlock = new Array(allocationSize).fill('memory_stress_test');
      
      // Process the memory block to ensure it's actually allocated
      for (let i = 0; i < Math.min(allocationSize, 10000); i++) {
        memoryBlock[i] = `processed_${i}`;
      }
      
      await this.sleep(Math.random() * 50); // Processing time
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateGCTrigger(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create objects that will trigger garbage collection
      const tempObjects = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: new Array(1000).fill(`gc_trigger_${i}`),
        timestamp: Date.now()
      }));
      
      // Process objects to ensure they're created
      tempObjects.forEach(obj => {
        obj.data = obj.data.map(item => item.toUpperCase());
      });
      
      // Objects go out of scope and become eligible for GC
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateFloodRequest(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate rapid-fire network requests
      const requestDelay = Math.random() * 10; // Very short delays
      await this.sleep(requestDelay);
      
      // High chance of timeout/failure under flood conditions
      if (Math.random() < 0.2) { // 20% failure rate
        throw new Error('Request flooded - server overwhelmed');
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateLargeDataTransfer(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate large data transfer (images, videos, etc.)
      const dataSize = Math.floor(Math.random() * 50000000) + 10000000; // 10MB-60MB
      const transferTime = (dataSize / 1000000) * 100; // Time based on size
      
      await this.sleep(transferTime);
      
      // Higher chance of failure for large transfers
      if (Math.random() < 0.1) { // 10% failure rate
        throw new Error('Large data transfer failed - connection interrupted');
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateTimeoutRequest(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate requests that might timeout
      const requestTime = Math.random() * 10000 + 5000; // 5-15 second requests
      
      // Simulate timeout conditions
      if (requestTime > 8000) { // Timeout after 8 seconds
        throw new Error('Request timeout');
      }
      
      await this.sleep(requestTime);
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateDatabaseTransaction(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate complex database transaction
      const operations = Math.floor(Math.random() * 10) + 5; // 5-15 operations
      
      for (let i = 0; i < operations; i++) {
        await this.sleep(Math.random() * 50 + 10); // Each operation takes 10-60ms
      }
      
      // Chance of transaction rollback
      if (Math.random() < 0.05) { // 5% rollback rate
        throw new Error('Transaction rolled back due to conflict');
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateMassiveDataInsert(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate inserting large amounts of data
      const recordCount = Math.floor(Math.random() * 1000) + 500; // 500-1500 records
      const processingTime = recordCount * 2; // 2ms per record
      
      await this.sleep(processingTime);
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateComplexQuery(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate complex query with joins, aggregations, etc.
      const complexity = Math.floor(Math.random() * 5) + 3; // Complexity factor 3-7
      const processingTime = complexity * 200; // 600-1400ms
      
      await this.sleep(processingTime);
      
      // Complex queries have higher chance of failure
      if (Math.random() < 0.08) { // 8% failure rate
        throw new Error('Complex query timeout - too many resources required');
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateScrollOperation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate scroll rendering - should be very fast
      const renderTime = Math.random() * 16; // Target 16ms (60 FPS)
      await this.sleep(renderTime);
      
      // Scroll operations should rarely fail
      if (Math.random() < 0.01) { // 1% failure rate
        throw new Error('Scroll lag detected - frame dropped');
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateAnimationFrame(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate animation frame processing - must be fast
      const frameTime = Math.random() * 16; // Target 16ms (60 FPS)
      await this.sleep(frameTime);
      
      // Animation frames should rarely fail
      if (Math.random() < 0.005) { // 0.5% failure rate
        throw new Error('Animation frame dropped - performance issue');
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateLayoutThrash(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate layout thrashing - multiple reflows
      const thrashCount = Math.floor(Math.random() * 5) + 3; // 3-7 reflows
      
      for (let i = 0; i < thrashCount; i++) {
        await this.sleep(Math.random() * 10 + 5); // Each reflow takes 5-15ms
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulateNotificationCreation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate notification creation and display
      const processingTime = Math.random() * 50 + 10; // 10-60ms
      await this.sleep(processingTime);
      
      // Simulate notification permission checks
      if (Math.random() < 0.1) { // 10% permission denied
        throw new Error('Notification permission denied');
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async simulatePushNotification(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate push notification processing
      const processingTime = Math.random() * 100 + 50; // 50-150ms
      await this.sleep(processingTime);
      
      // Push notifications can fail for various reasons
      if (Math.random() < 0.15) { // 15% failure rate
        throw new Error('Push notification delivery failed');
      }
      
      this.recordOperationTime(Date.now() - startTime);
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  /**
   * Stress test execution utilities
   */
  private async runStressTestLoop(
    config: StressTestConfig,
    operation: () => Promise<void>,
    intervalMs: number
  ): Promise<void> {
    const endTime = this.testStartTime + config.duration;
    let currentConcurrency = 0;
    
    // Ramp up phase
    const rampUpEndTime = this.testStartTime + config.rampUpTime;
    
    while (Date.now() < endTime) {
      const now = Date.now();
      
      // Calculate current target concurrency (ramp up)
      let targetConcurrency = config.concurrentUsers;
      if (now < rampUpEndTime) {
        const rampUpProgress = (now - this.testStartTime) / config.rampUpTime;
        targetConcurrency = Math.floor(config.concurrentUsers * rampUpProgress);
      }
      
      // Adjust concurrency
      if (currentConcurrency < targetConcurrency) {
        // Ramp up
        const concurrencyIncrease = Math.min(5, targetConcurrency - currentConcurrency);
        for (let i = 0; i < concurrencyIncrease; i++) {
          operation().catch(() => {}); // Fire and forget with error handling
          currentConcurrency++;
        }
      }
      
      await this.sleep(intervalMs);
    }
  }

  private trackOperation(operationId: string, operation: Promise<any>): void {
    this.activeOperations.set(operationId, operation);
    this.totalOperations++;
    
    operation
      .finally(() => {
        this.activeOperations.delete(operationId);
      })
      .catch(() => {
        // Errors are already counted in individual operations
      });
  }

  private recordOperationTime(duration: number): void {
    this.performanceMetrics.push(duration);
  }

  private async waitForAllOperations(): Promise<void> {
    const operations = Array.from(this.activeOperations.values());
    await Promise.allSettled(operations);
  }

  private startMemoryMonitoring(): NodeJS.Timeout {
    return setInterval(async () => {
      // Memory monitoring would be implemented here
      // This is a placeholder for actual memory monitoring
    }, 1000);
  }

  private async getMemoryUsage(): Promise<number> {
    // This is a placeholder - actual implementation would use device-specific memory APIs
    return Math.random() * 200 * 1024 * 1024; // Random value for simulation
  }

  private calculatePerformanceMetrics(): StressTestResult['performanceMetrics'] {
    if (this.performanceMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        throughput: 0
      };
    }

    const sortedMetrics = this.performanceMetrics.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedMetrics.length * 0.95);
    
    return {
      averageResponseTime: sortedMetrics.reduce((a, b) => a + b, 0) / sortedMetrics.length,
      minResponseTime: sortedMetrics[0],
      maxResponseTime: sortedMetrics[sortedMetrics.length - 1],
      p95ResponseTime: sortedMetrics[p95Index],
      throughput: (this.totalOperations / (Date.now() - this.testStartTime)) * 1000
    };
  }

  private generateTestDetails(config: StressTestConfig, errorRate: number, memoryUsage: number): string {
    const duration = Date.now() - this.testStartTime;
    const throughput = (this.totalOperations / duration) * 1000;
    
    return `Completed ${this.totalOperations} operations in ${duration}ms. ` +
           `Throughput: ${throughput.toFixed(2)} ops/sec. ` +
           `Error rate: ${(errorRate * 100).toFixed(2)}%. ` +
           `Memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB. ` +
           `Target: ${config.operationsPerSecond} ops/sec, ${config.concurrentUsers} concurrent users.`;
  }

  private logStressTestResult(result: StressTestResult): void {
    const statusEmoji = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    const duration = `${(result.duration / 1000).toFixed(1)}s`;
    const ops = `${result.operationsCompleted} ops`;
    const throughput = `${result.operationsPerSecond.toFixed(1)} ops/s`;
    const errorRate = `${(result.errorRate * 100).toFixed(1)}% errors`;
    const avgTime = `${result.performanceMetrics.averageResponseTime.toFixed(1)}ms avg`;
    
    console.log(`  ${statusEmoji} ${result.testName} (${duration})`);
    console.log(`    Performance: ${ops}, ${throughput}, ${errorRate}, ${avgTime}`);
    
    if (result.status !== 'pass') {
      console.log(`    Issue: ${result.details}`);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive stress test report
   */
  generateStressTestReport(): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      errors: number;
      totalOperations: number;
      averageThroughput: number;
      averageErrorRate: number;
      categories: Record<string, { 
        passed: number; 
        failed: number; 
        errors: number; 
        avgThroughput: number;
      }>;
    };
    results: StressTestResult[];
    performanceAnalysis: {
      bottlenecks: string[];
      recommendations: string[];
      riskAreas: string[];
    };
  } {
    const summary = {
      total: this.testResults.length,
      passed: this.testResults.filter(r => r.status === 'pass').length,
      failed: this.testResults.filter(r => r.status === 'fail').length,
      errors: this.testResults.filter(r => r.status === 'error').length,
      totalOperations: this.testResults.reduce((sum, r) => sum + r.operationsCompleted, 0),
      averageThroughput: this.testResults.reduce((sum, r) => sum + r.operationsPerSecond, 0) / this.testResults.length,
      averageErrorRate: this.testResults.reduce((sum, r) => sum + r.errorRate, 0) / this.testResults.length,
      categories: {} as Record<string, { passed: number; failed: number; errors: number; avgThroughput: number; }>
    };

    // Categorize results
    for (const result of this.testResults) {
      if (!summary.categories[result.category]) {
        summary.categories[result.category] = { passed: 0, failed: 0, errors: 0, avgThroughput: 0 };
      }
      const cat = summary.categories[result.category];
      cat[result.status === 'pass' ? 'passed' : result.status === 'fail' ? 'failed' : 'errors']++;
      cat.avgThroughput += result.operationsPerSecond;
    }

    // Calculate average throughput per category
    Object.keys(summary.categories).forEach(category => {
      const categoryResults = this.testResults.filter(r => r.category === category);
      summary.categories[category].avgThroughput = 
        summary.categories[category].avgThroughput / categoryResults.length;
    });

    // Performance analysis
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];
    const riskAreas: string[] = [];

    // Identify bottlenecks
    const slowTests = this.testResults.filter(r => r.performanceMetrics.averageResponseTime > 1000);
    if (slowTests.length > 0) {
      bottlenecks.push(`Slow response times detected in: ${slowTests.map(t => t.testName).join(', ')}`);
    }

    const lowThroughputTests = this.testResults.filter(r => r.operationsPerSecond < 1);
    if (lowThroughputTests.length > 0) {
      bottlenecks.push(`Low throughput detected in: ${lowThroughputTests.map(t => t.testName).join(', ')}`);
    }

    const highMemoryTests = this.testResults.filter(r => 
      r.memoryPeakUsage && r.memoryPeakUsage > 300 * 1024 * 1024
    );
    if (highMemoryTests.length > 0) {
      bottlenecks.push(`High memory usage in: ${highMemoryTests.map(t => t.testName).join(', ')}`);
    }

    // Generate recommendations
    if (summary.failed > 0) {
      recommendations.push('Optimize failed stress scenarios to improve system reliability under load');
    }

    if (summary.averageErrorRate > 0.1) {
      recommendations.push('Error rate exceeds 10% - implement better error handling and retry mechanisms');
    }

    if (summary.averageThroughput < 10) {
      recommendations.push('Low average throughput - consider performance optimizations');
    }

    // Identify risk areas
    const highErrorRateTests = this.testResults.filter(r => r.errorRate > 0.2);
    if (highErrorRateTests.length > 0) {
      riskAreas.push(`High error rates (>20%): ${highErrorRateTests.map(t => t.testName).join(', ')}`);
    }

    const memoryIntensiveTests = this.testResults.filter(r => 
      r.memoryPeakUsage && r.memoryPeakUsage > 400 * 1024 * 1024
    );
    if (memoryIntensiveTests.length > 0) {
      riskAreas.push(`Memory intensive operations: ${memoryIntensiveTests.map(t => t.testName).join(', ')}`);
    }

    const unstableTests = this.testResults.filter(r => r.status === 'error');
    if (unstableTests.length > 0) {
      riskAreas.push(`Unstable under stress: ${unstableTests.map(t => t.testName).join(', ')}`);
    }

    return {
      summary,
      results: this.testResults,
      performanceAnalysis: {
        bottlenecks,
        recommendations,
        riskAreas
      }
    };
  }
}

export default StressTestFramework;