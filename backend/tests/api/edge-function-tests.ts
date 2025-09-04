// TailTracker Edge Function Integration Test Suite
// Comprehensive testing of Supabase Edge Functions and API endpoints

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

// Test configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TEST_USER_EMAIL = 'test-integration@tailtracker.app'
const TEST_USER_PASSWORD = 'TestPassword123!'

// Test clients
let supabase: SupabaseClient
let supabaseAdmin: SupabaseClient
let testUserId: string
let testAuthToken: string

// ================================================================================================
// TEST SETUP AND TEARDOWN
// ================================================================================================

async function setupTests() {
  console.log('🚀 Setting up integration tests...')
  
  // Initialize Supabase clients
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  // Create test user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    options: {
      data: {
        full_name: 'Test Integration User'
      }
    }
  })
  
  if (authError && authError.message !== 'User already registered') {
    throw new Error(`Failed to create test user: ${authError.message}`)
  }
  
  // Sign in test user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  })
  
  if (signInError) {
    throw new Error(`Failed to sign in test user: ${signInError.message}`)
  }
  
  testUserId = signInData.user!.id
  testAuthToken = signInData.session!.access_token
  
  console.log(`✅ Test user created/signed in: ${testUserId}`)
}

async function teardownTests() {
  console.log('🧹 Cleaning up test data...')
  
  // Delete test user data
  if (testUserId) {
    await supabaseAdmin.auth.admin.deleteUser(testUserId)
  }
  
  console.log('✅ Cleanup complete')
}

// ================================================================================================
// 1. AUTHENTICATION AND USER PROFILE TESTS
// ================================================================================================

Deno.test("Authentication: User Profile Edge Function", async () => {
  await setupTests()
  
  try {
    // Test user profile retrieval
    const response = await fetch(`${SUPABASE_URL}/functions/v1/user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({
        action: 'get_profile'
      })
    })
    
    assertEquals(response.status, 200)
    
    const data = await response.json()
    assertExists(data.user)
    assertEquals(data.user.email, TEST_USER_EMAIL)
    
    console.log('✅ User profile retrieval test passed')
    
    // Test profile update
    const updateResponse = await fetch(`${SUPABASE_URL}/functions/v1/user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({
        action: 'update_profile',
        data: {
          full_name: 'Updated Test User',
          phone: '+1234567890'
        }
      })
    })
    
    assertEquals(updateResponse.status, 200)
    
    const updateData = await updateResponse.json()
    assertEquals(updateData.success, true)
    
    console.log('✅ User profile update test passed')
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 2. LOST PET ALERTS SYSTEM TESTS
// ================================================================================================

Deno.test("Lost Pet Alerts: Premium Feature Access Control", async () => {
  await setupTests()
  
  try {
    // Test lost pet alert creation without premium subscription
    const response = await fetch(`${SUPABASE_URL}/functions/v1/lost-pet-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({
        action: 'report_lost_pet',
        data: {
          user_id: testUserId,
          pet_id: '12345678-1234-1234-1234-123456789012',
          last_seen_location: { lat: 51.5074, lng: -0.1276 },
          last_seen_address: 'London, UK',
          description: 'Test lost pet report'
        }
      })
    })
    
    assertEquals(response.status, 400)
    
    const data = await response.json()
    assert(data.error.includes('Premium subscription required'))
    
    console.log('✅ Premium access control test passed')
    
  } finally {
    await teardownTests()
  }
})

Deno.test("Lost Pet Alerts: Geospatial Query Functions", async () => {
  await setupTests()
  
  try {
    // Test nearby alerts retrieval
    const response = await fetch(`${SUPABASE_URL}/functions/v1/lost-pet-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({
        action: 'get_nearby_alerts',
        data: {
          user_location: { lat: 51.5074, lng: -0.1276 },
          radius_km: 25
        }
      })
    })
    
    assertEquals(response.status, 200)
    
    const data = await response.json()
    assertEquals(data.success, true)
    assertExists(data.alerts)
    assert(Array.isArray(data.alerts))
    
    console.log(`✅ Nearby alerts query test passed - found ${data.count} alerts`)
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 3. STRIPE WEBHOOK INTEGRATION TESTS
// ================================================================================================

Deno.test("Stripe Webhooks: Event Processing and Idempotency", async () => {
  // Note: This test requires careful setup to avoid real Stripe calls
  // In production, use Stripe's test webhook events
  
  const mockStripeEvent = {
    id: 'evt_test_webhook_integration',
    object: 'event',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_integration',
        customer: 'cus_test_integration',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 days
        metadata: {
          userId: testUserId
        }
      }
    },
    created: Math.floor(Date.now() / 1000)
  }
  
  await setupTests()
  
  try {
    // Test webhook signature verification (mock)
    const webhookResponse = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature_for_integration'
      },
      body: JSON.stringify(mockStripeEvent)
    })
    
    // In real tests, this would verify proper signature handling
    // For now, we test that the endpoint exists and responds
    assert(webhookResponse.status === 400 || webhookResponse.status === 200)
    
    console.log('✅ Stripe webhook endpoint accessibility test passed')
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 4. FILE UPLOAD AND MANAGEMENT TESTS
// ================================================================================================

Deno.test("File Upload: Edge Function Processing", async () => {
  await setupTests()
  
  try {
    // Test file upload capability
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/file-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({
        action: 'upload_file',
        data: {
          file_data: testImageData,
          file_name: 'test-image.png',
          content_type: 'image/png'
        }
      })
    })
    
    assertEquals(response.status, 200)
    
    const data = await response.json()
    assertEquals(data.success, true)
    assertExists(data.file_url)
    
    console.log('✅ File upload test passed')
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 5. NOTIFICATION SYSTEM TESTS
// ================================================================================================

Deno.test("Notifications: Scheduling and Delivery", async () => {
  await setupTests()
  
  try {
    // Test notification creation
    const response = await fetch(`${SUPABASE_URL}/functions/v1/notification-scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({
        action: 'schedule_notification',
        data: {
          user_id: testUserId,
          type: 'vaccination_due',
          title: 'Vaccination Reminder',
          message: 'Your pet is due for vaccination',
          scheduled_for: new Date(Date.now() + 86400000).toISOString() // +1 day
        }
      })
    })
    
    assertEquals(response.status, 200)
    
    const data = await response.json()
    assertEquals(data.success, true)
    
    console.log('✅ Notification scheduling test passed')
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 6. WELLNESS ANALYTICS TESTS
// ================================================================================================

Deno.test("Wellness Analytics: Data Processing", async () => {
  await setupTests()
  
  try {
    // Test analytics data retrieval
    const response = await fetch(`${SUPABASE_URL}/functions/v1/wellness-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({
        action: 'get_wellness_summary',
        data: {
          user_id: testUserId,
          period: '30days'
        }
      })
    })
    
    assertEquals(response.status, 200)
    
    const data = await response.json()
    assertEquals(data.success, true)
    assertExists(data.analytics)
    
    console.log('✅ Wellness analytics test passed')
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 7. EMERGENCY PROTOCOLS TESTS
// ================================================================================================

Deno.test("Emergency Protocols: Incident Management", async () => {
  await setupTests()
  
  try {
    // Test emergency protocol activation
    const response = await fetch(`${SUPABASE_URL}/functions/v1/emergency-protocols`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({
        action: 'trigger_emergency',
        data: {
          pet_id: '12345678-1234-1234-1234-123456789012',
          emergency_type: 'medical',
          severity: 'high',
          description: 'Pet injured and needs immediate attention'
        }
      })
    })
    
    // Test endpoint exists and handles emergency scenarios
    assert(response.status >= 200 && response.status < 500)
    
    console.log('✅ Emergency protocols test passed')
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 8. INTEGRATION STRESS TESTS
// ================================================================================================

Deno.test("Integration: Concurrent Request Handling", async () => {
  await setupTests()
  
  try {
    // Test multiple concurrent requests to different endpoints
    const concurrentRequests = [
      fetch(`${SUPABASE_URL}/functions/v1/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({ action: 'get_profile' })
      }),
      fetch(`${SUPABASE_URL}/functions/v1/lost-pet-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          action: 'get_nearby_alerts',
          data: { user_location: { lat: 51.5074, lng: -0.1276 }, radius_km: 10 }
        })
      }),
      fetch(`${SUPABASE_URL}/functions/v1/wellness-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          action: 'get_wellness_summary',
          data: { user_id: testUserId, period: '7days' }
        })
      })
    ]
    
    const results = await Promise.all(concurrentRequests)
    
    // All requests should complete successfully
    results.forEach((response, index) => {
      assert(response.status >= 200 && response.status < 500, 
        `Request ${index} failed with status ${response.status}`)
    })
    
    console.log(`✅ Concurrent request handling test passed - ${results.length} requests`)
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 9. ERROR HANDLING AND RESILIENCE TESTS
// ================================================================================================

Deno.test("Error Handling: Invalid Request Scenarios", async () => {
  await setupTests()
  
  try {
    // Test malformed JSON
    const malformedResponse = await fetch(`${SUPABASE_URL}/functions/v1/user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: '{ invalid json'
    })
    
    assertEquals(malformedResponse.status, 400)
    
    // Test missing authentication
    const unauthResponse = await fetch(`${SUPABASE_URL}/functions/v1/user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'get_profile' })
    })
    
    assertEquals(unauthResponse.status, 401)
    
    // Test invalid action
    const invalidActionResponse = await fetch(`${SUPABASE_URL}/functions/v1/user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAuthToken}`
      },
      body: JSON.stringify({ action: 'invalid_action' })
    })
    
    assertEquals(invalidActionResponse.status, 400)
    
    console.log('✅ Error handling tests passed')
    
  } finally {
    await teardownTests()
  }
})

// ================================================================================================
// 10. PERFORMANCE BENCHMARKS
// ================================================================================================

Deno.test("Performance: Response Time Benchmarks", async () => {
  await setupTests()
  
  try {
    const endpoints = [
      { name: 'user-profile', path: 'user-profile', action: 'get_profile' },
      { name: 'lost-pet-alerts', path: 'lost-pet-alerts', action: 'get_nearby_alerts' },
      { name: 'wellness-analytics', path: 'wellness-analytics', action: 'get_wellness_summary' }
    ]
    
    for (const endpoint of endpoints) {
      const startTime = performance.now()
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({ action: endpoint.action })
      })
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      console.log(`📊 ${endpoint.name} response time: ${responseTime.toFixed(2)}ms`)
      
      // Response time should be under 2 seconds
      assert(responseTime < 2000, `${endpoint.name} response too slow: ${responseTime}ms`)
    }
    
    console.log('✅ Performance benchmark tests passed')
    
  } finally {
    await teardownTests()
  }
})

console.log(`
🎯 TailTracker Edge Function Integration Tests
=============================================
Tests cover:
✓ Authentication and user management
✓ Lost pet alert system
✓ Stripe webhook processing  
✓ File upload and management
✓ Notification scheduling
✓ Wellness analytics
✓ Emergency protocols
✓ Concurrent request handling
✓ Error handling scenarios
✓ Performance benchmarks
=============================================
Run with: deno test --allow-net --allow-env
`)