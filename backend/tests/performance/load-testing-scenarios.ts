// TailTracker Performance & Load Testing Scenarios
// Comprehensive testing of system performance under various load conditions

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

// Test configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOAD_TEST_DURATION_MS = 30000 // 30 seconds
const CONCURRENT_USERS = [1, 5, 10, 25, 50, 100]
const TARGET_RESPONSE_TIME_MS = 2000 // 2 seconds
const TARGET_SUCCESS_RATE = 0.95 // 95%

interface LoadTestResult {
  scenario: string
  concurrentUsers: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  requestsPerSecond: number
  successRate: number
  errors: string[]
}

interface PerformanceMetrics {
  responseTime: number
  success: boolean
  error?: string
  timestamp: number
}

// ================================================================================================
// LOAD TESTING UTILITIES
// ================================================================================================

class LoadTestRunner {
  private supabase: SupabaseClient
  private results: LoadTestResult[] = []

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  }

  async executeLoadTest(
    scenario: string,
    concurrentUsers: number,
    testFunction: () => Promise<PerformanceMetrics>
  ): Promise<LoadTestResult> {
    console.log(`🚀 Starting load test: ${scenario} with ${concurrentUsers} concurrent users`)
    
    const startTime = Date.now()
    const endTime = startTime + LOAD_TEST_DURATION_MS
    const allMetrics: PerformanceMetrics[] = []
    const activePromises: Promise<void>[] = []

    // Start concurrent user simulations
    for (let i = 0; i < concurrentUsers; i++) {
      const userSimulation = async () => {
        while (Date.now() < endTime) {
          try {
            const metrics = await testFunction()
            allMetrics.push(metrics)
            
            // Small delay between requests to simulate realistic user behavior
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
          } catch (error) {
            allMetrics.push({
              responseTime: 0,
              success: false,
              error: error.message,
              timestamp: Date.now()
            })
          }
        }
      }
      
      activePromises.push(userSimulation())
    }

    // Wait for all user simulations to complete
    await Promise.all(activePromises)

    // Calculate results
    const totalRequests = allMetrics.length
    const successfulRequests = allMetrics.filter(m => m.success).length
    const failedRequests = totalRequests - successfulRequests
    const responseTimes = allMetrics.filter(m => m.success).map(m => m.responseTime)
    const errors = allMetrics.filter(m => !m.success).map(m => m.error || 'Unknown error')
    
    const result: LoadTestResult = {
      scenario,
      concurrentUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      requestsPerSecond: totalRequests / (LOAD_TEST_DURATION_MS / 1000),
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
      errors: [...new Set(errors)] // Unique errors
    }

    this.results.push(result)
    this.logTestResult(result)
    
    return result
  }

  private logTestResult(result: LoadTestResult) {
    console.log(`📊 ${result.scenario} Results:`)
    console.log(`   Concurrent Users: ${result.concurrentUsers}`)
    console.log(`   Total Requests: ${result.totalRequests}`)
    console.log(`   Success Rate: ${(result.successRate * 100).toFixed(1)}%`)
    console.log(`   Avg Response Time: ${result.averageResponseTime.toFixed(0)}ms`)
    console.log(`   Requests/Second: ${result.requestsPerSecond.toFixed(1)}`)
    
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`)
    }
    
    console.log('---')
  }

  getResults(): LoadTestResult[] {
    return this.results
  }

  generateReport(): void {
    console.log('\n🎯 LOAD TESTING SUMMARY REPORT')
    console.log('==============================')
    
    this.results.forEach(result => {
      const status = result.successRate >= TARGET_SUCCESS_RATE && 
                    result.averageResponseTime <= TARGET_RESPONSE_TIME_MS ? '✅ PASS' : '❌ FAIL'
      
      console.log(`${status} ${result.scenario} (${result.concurrentUsers} users):`)
      console.log(`    Success Rate: ${(result.successRate * 100).toFixed(1)}% (Target: ≥95%)`)
      console.log(`    Avg Response: ${result.averageResponseTime.toFixed(0)}ms (Target: ≤2000ms)`)
      console.log(`    Throughput: ${result.requestsPerSecond.toFixed(1)} req/s`)
      console.log('')
    })
  }
}

// ================================================================================================
// 1. DATABASE QUERY PERFORMANCE TESTS
// ================================================================================================

Deno.test("Load Test: Database Query Performance", async () => {
  const loadTester = new LoadTestRunner()
  
  const databaseQueryTest = async (): Promise<PerformanceMetrics> => {
    const startTime = Date.now()
    
    try {
      // Complex query involving joins and geospatial operations
      const { data, error } = await loadTester.supabase
        .from('pets')
        .select(`
          id,
          name,
          species,
          breed,
          family:families(name),
          owner:users!pets_created_by_fkey(full_name),
          vaccinations(vaccine_name, administered_date),
          medical_records(title, date_of_record)
        `)
        .limit(20)

      const responseTime = Date.now() - startTime

      if (error) {
        return {
          responseTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        }
      }

      return {
        responseTime,
        success: true,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  // Test with different concurrent user loads
  for (const userCount of [1, 10, 25]) {
    await loadTester.executeLoadTest(
      'Database Complex Queries',
      userCount,
      databaseQueryTest
    )
  }

  loadTester.generateReport()
})

// ================================================================================================
// 2. GEOSPATIAL QUERY PERFORMANCE TESTS
// ================================================================================================

Deno.test("Load Test: Geospatial Query Performance", async () => {
  const loadTester = new LoadTestRunner()
  
  const geospatialQueryTest = async (): Promise<PerformanceMetrics> => {
    const startTime = Date.now()
    
    try {
      // Random location for testing (around major cities)
      const locations = [
        { lat: 51.5074, lng: -0.1276 }, // London
        { lat: 40.7128, lng: -74.0060 }, // New York
        { lat: 48.8566, lng: 2.3522 },   // Paris
        { lat: 52.5200, lng: 13.4050 },  // Berlin
        { lat: 35.6762, lng: 139.6503 }  // Tokyo
      ]
      
      const location = locations[Math.floor(Math.random() * locations.length)]
      const radius = Math.floor(Math.random() * 25) + 5 // 5-30km radius

      const { data, error } = await loadTester.supabase.rpc('get_lost_pets_within_radius', {
        center_lat: location.lat,
        center_lng: location.lng,
        radius_km: radius
      })

      const responseTime = Date.now() - startTime

      if (error) {
        return {
          responseTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        }
      }

      return {
        responseTime,
        success: true,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  // Test geospatial performance under load
  for (const userCount of [5, 15, 30]) {
    await loadTester.executeLoadTest(
      'Geospatial Queries',
      userCount,
      geospatialQueryTest
    )
  }

  loadTester.generateReport()
})

// ================================================================================================
// 3. EDGE FUNCTION PERFORMANCE TESTS
// ================================================================================================

Deno.test("Load Test: Edge Function Performance", async () => {
  const loadTester = new LoadTestRunner()
  
  const edgeFunctionTest = async (): Promise<PerformanceMetrics> => {
    const startTime = Date.now()
    
    try {
      // Test user profile edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` // Use service role for testing
        },
        body: JSON.stringify({
          action: 'get_profile'
        })
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        return {
          responseTime,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: Date.now()
        }
      }

      const data = await response.json()
      
      return {
        responseTime,
        success: true,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  // Test edge function performance
  for (const userCount of [5, 20, 40]) {
    await loadTester.executeLoadTest(
      'Edge Function Calls',
      userCount,
      edgeFunctionTest
    )
  }

  loadTester.generateReport()
})

// ================================================================================================
// 4. REAL-TIME SUBSCRIPTION PERFORMANCE TESTS
// ================================================================================================

Deno.test("Load Test: Real-time Subscription Performance", async () => {
  const loadTester = new LoadTestRunner()
  
  const realtimeSubscriptionTest = async (): Promise<PerformanceMetrics> => {
    const startTime = Date.now()
    
    try {
      return new Promise<PerformanceMetrics>((resolve) => {
        const channel = loadTester.supabase
          .channel('performance_test_' + Math.random())
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'notifications' },
            (payload) => {
              const responseTime = Date.now() - startTime
              resolve({
                responseTime,
                success: true,
                timestamp: Date.now()
              })
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Trigger a change to test real-time response
              loadTester.supabase
                .from('notifications')
                .insert({
                  user_id: '12345678-1234-1234-1234-123456789012',
                  type: 'appointment',
                  title: 'Performance Test Notification',
                  message: 'This is a test notification for performance testing'
                })
                .then(() => {
                  // Clean up the test notification
                  setTimeout(() => {
                    loadTester.supabase
                      .from('notifications')
                      .delete()
                      .eq('title', 'Performance Test Notification')
                  }, 1000)
                })
            }
          })

        // Timeout after 5 seconds
        setTimeout(() => {
          channel.unsubscribe()
          resolve({
            responseTime: Date.now() - startTime,
            success: false,
            error: 'Real-time subscription timeout',
            timestamp: Date.now()
          })
        }, 5000)
      })
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  // Test real-time subscriptions (limited concurrency due to connection limits)
  for (const userCount of [2, 5, 10]) {
    await loadTester.executeLoadTest(
      'Real-time Subscriptions',
      userCount,
      realtimeSubscriptionTest
    )
  }

  loadTester.generateReport()
})

// ================================================================================================
// 5. BULK DATA OPERATIONS PERFORMANCE TESTS
// ================================================================================================

Deno.test("Load Test: Bulk Data Operations", async () => {
  const loadTester = new LoadTestRunner()
  
  const bulkInsertTest = async (): Promise<PerformanceMetrics> => {
    const startTime = Date.now()
    
    try {
      // Create bulk test data
      const testNotifications = Array.from({ length: 50 }, (_, index) => ({
        user_id: '12345678-1234-1234-1234-123456789012',
        type: 'appointment' as const,
        title: `Bulk Test Notification ${index}`,
        message: `Test notification ${index} for bulk operations performance testing`,
        created_at: new Date().toISOString()
      }))

      const { data, error } = await loadTester.supabase
        .from('notifications')
        .insert(testNotifications)
        .select('id')

      const responseTime = Date.now() - startTime

      // Clean up test data
      if (data && data.length > 0) {
        setTimeout(async () => {
          await loadTester.supabase
            .from('notifications')
            .delete()
            .in('id', data.map(n => n.id))
        }, 1000)
      }

      if (error) {
        return {
          responseTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        }
      }

      return {
        responseTime,
        success: true,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  // Test bulk operations performance
  for (const userCount of [2, 8, 15]) {
    await loadTester.executeLoadTest(
      'Bulk Data Operations',
      userCount,
      bulkInsertTest
    )
  }

  loadTester.generateReport()
})

// ================================================================================================
// 6. AUTHENTICATION AND AUTHORIZATION PERFORMANCE TESTS
// ================================================================================================

Deno.test("Load Test: Authentication Performance", async () => {
  const loadTester = new LoadTestRunner()
  
  const authPerformanceTest = async (): Promise<PerformanceMetrics> => {
    const startTime = Date.now()
    
    try {
      // Test token verification performance
      const { data: { user }, error } = await loadTester.supabase.auth.getUser()

      const responseTime = Date.now() - startTime

      if (error) {
        return {
          responseTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        }
      }

      return {
        responseTime,
        success: true,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  // Test authentication performance
  for (const userCount of [10, 30, 50]) {
    await loadTester.executeLoadTest(
      'Authentication Checks',
      userCount,
      authPerformanceTest
    )
  }

  loadTester.generateReport()
})

// ================================================================================================
// 7. FILE UPLOAD PERFORMANCE TESTS
// ================================================================================================

Deno.test("Load Test: File Upload Performance", async () => {
  const loadTester = new LoadTestRunner()
  
  const fileUploadTest = async (): Promise<PerformanceMetrics> => {
    const startTime = Date.now()
    
    try {
      // Create a small test file (1KB base64 image)
      const testFileData = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='.repeat(50)
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/file-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          action: 'upload_file',
          data: {
            file_data: testFileData,
            file_name: `performance_test_${Date.now()}.png`,
            content_type: 'image/png'
          }
        })
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        return {
          responseTime,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: Date.now()
        }
      }

      return {
        responseTime,
        success: true,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  // Test file upload performance (lower concurrency due to bandwidth limits)
  for (const userCount of [2, 5, 10]) {
    await loadTester.executeLoadTest(
      'File Upload Operations',
      userCount,
      fileUploadTest
    )
  }

  loadTester.generateReport()
})

// ================================================================================================
// 8. COMPREHENSIVE STRESS TEST SCENARIO
// ================================================================================================

Deno.test("Stress Test: Mixed Workload Scenario", async () => {
  const loadTester = new LoadTestRunner()
  
  const mixedWorkloadTest = async (): Promise<PerformanceMetrics> => {
    const startTime = Date.now()
    
    try {
      // Randomly select operation type
      const operations = [
        'database_query',
        'geospatial_query', 
        'edge_function',
        'bulk_operation'
      ]
      
      const operation = operations[Math.floor(Math.random() * operations.length)]
      
      switch (operation) {
        case 'database_query':
          const { data: pets, error: petsError } = await loadTester.supabase
            .from('pets')
            .select('id, name, species, breed')
            .limit(10)
          
          if (petsError) throw petsError
          break
          
        case 'geospatial_query':
          const { data: locations, error: locError } = await loadTester.supabase.rpc('get_lost_pets_within_radius', {
            center_lat: 51.5074,
            center_lng: -0.1276,
            radius_km: 15
          })
          
          if (locError) throw locError
          break
          
        case 'edge_function':
          const response = await fetch(`${SUPABASE_URL}/functions/v1/user-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ action: 'get_profile' })
          })
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          break
          
        case 'bulk_operation':
          const testData = Array.from({ length: 5 }, (_, i) => ({
            user_id: '12345678-1234-1234-1234-123456789012',
            type: 'appointment' as const,
            title: `Stress Test ${i}`,
            message: `Mixed workload test notification ${i}`
          }))
          
          const { error: insertError } = await loadTester.supabase
            .from('notifications')
            .insert(testData)
            
          if (insertError) throw insertError
          
          // Clean up
          setTimeout(async () => {
            await loadTester.supabase
              .from('notifications')
              .delete()
              .like('title', 'Stress Test %')
          }, 2000)
          break
      }

      return {
        responseTime: Date.now() - startTime,
        success: true,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  // Comprehensive stress test with high concurrency
  for (const userCount of [25, 50, 75]) {
    await loadTester.executeLoadTest(
      'Mixed Workload Stress Test',
      userCount,
      mixedWorkloadTest
    )
  }

  loadTester.generateReport()
})

console.log(`
⚡ TailTracker Performance & Load Testing Suite
=============================================
Test Scenarios:
✓ Database query performance under load
✓ Geospatial query optimization
✓ Edge function responsiveness
✓ Real-time subscription handling
✓ Bulk data operation efficiency
✓ Authentication system performance
✓ File upload throughput
✓ Mixed workload stress testing

Performance Targets:
• Response Time: ≤2000ms average
• Success Rate: ≥95%
• Concurrent Users: Up to 100 users
• Test Duration: 30 seconds per scenario

Run with: deno test --allow-net --allow-env
=============================================
`)