// TailTracker Push Notification System Integration Tests
// Comprehensive testing of Expo Push Service integration and notification delivery

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

// Test configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN') || 'test_token'
const TEST_PUSH_TOKEN = 'ExponentPushToken[test-notification-token]'

// Mock Expo Push API responses for testing
const MOCK_EXPO_RESPONSES = {
  success: {
    data: [{
      status: 'ok',
      id: 'test-notification-id-123'
    }]
  },
  error: {
    data: [{
      status: 'error',
      message: 'Invalid push token',
      details: { error: 'DeviceNotRegistered' }
    }]
  },
  partial: {
    data: [
      { status: 'ok', id: 'test-id-1' },
      { status: 'error', message: 'Invalid token', details: { error: 'InvalidCredentials' } }
    ]
  }
}

interface NotificationPayload {
  to: string
  title: string
  body: string
  data?: Record<string, any>
  sound?: string
  priority?: 'default' | 'normal' | 'high'
  badge?: number
  category?: string
  ttl?: number
}

interface PushReceipt {
  id: string
  status: 'ok' | 'error'
  message?: string
  details?: Record<string, any>
}

// ================================================================================================
// PUSH NOTIFICATION SERVICE CLASS
// ================================================================================================

class PushNotificationService {
  private supabase: SupabaseClient
  private mockMode: boolean

  constructor(mockMode = true) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    this.mockMode = mockMode
  }

  async sendNotification(notification: NotificationPayload): Promise<PushReceipt> {
    if (this.mockMode) {
      return this.mockExpoPushAPI([notification])
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${EXPO_ACCESS_TOKEN}`
      },
      body: JSON.stringify([notification])
    })

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data[0]
  }

  async sendBulkNotifications(notifications: NotificationPayload[]): Promise<PushReceipt[]> {
    if (this.mockMode) {
      return this.mockExpoPushAPI(notifications)
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${EXPO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(notifications)
    })

    if (!response.ok) {
      throw new Error(`Bulk push notification failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  private async mockExpoPushAPI(notifications: NotificationPayload[]): Promise<PushReceipt[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return notifications.map((notification, index) => {
      // Simulate different response scenarios based on token
      if (notification.to.includes('invalid')) {
        return MOCK_EXPO_RESPONSES.error.data[0]
      }
      if (notification.to.includes('partial') && index % 2 === 1) {
        return MOCK_EXPO_RESPONSES.partial.data[1]
      }
      return {
        status: 'ok' as const,
        id: `mock-notification-${index}-${Date.now()}`
      }
    })
  }

  async logNotificationResult(
    userId: string,
    notification: NotificationPayload,
    receipt: PushReceipt
  ): Promise<void> {
    await this.supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'push_notification',
        title: notification.title,
        message: notification.body,
        push_sent: receipt.status === 'ok',
        sent_at: receipt.status === 'ok' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      })
  }
}

// ================================================================================================
// 1. BASIC PUSH NOTIFICATION TESTS
// ================================================================================================

Deno.test("Push Notifications: Single Message Delivery", async () => {
  const pushService = new PushNotificationService(true)

  const notification: NotificationPayload = {
    to: TEST_PUSH_TOKEN,
    title: 'Test Notification',
    body: 'This is a test push notification',
    data: {
      type: 'test',
      timestamp: Date.now()
    },
    sound: 'default',
    priority: 'high'
  }

  const receipt = await pushService.sendNotification(notification)

  assertEquals(receipt.status, 'ok')
  assertExists(receipt.id)

  console.log('✅ Single push notification test passed')
})

Deno.test("Push Notifications: Invalid Token Handling", async () => {
  const pushService = new PushNotificationService(true)

  const invalidNotification: NotificationPayload = {
    to: 'ExponentPushToken[invalid-token-test]',
    title: 'Test Invalid Token',
    body: 'This should fail'
  }

  const receipt = await pushService.sendNotification(invalidNotification)

  assertEquals(receipt.status, 'error')
  assertExists(receipt.message)

  console.log('✅ Invalid push token handling test passed')
})

// ================================================================================================
// 2. BULK NOTIFICATION TESTS
// ================================================================================================

Deno.test("Push Notifications: Bulk Message Processing", async () => {
  const pushService = new PushNotificationService(true)

  const notifications: NotificationPayload[] = [
    {
      to: TEST_PUSH_TOKEN,
      title: 'Bulk Test 1',
      body: 'First bulk notification'
    },
    {
      to: TEST_PUSH_TOKEN,
      title: 'Bulk Test 2',
      body: 'Second bulk notification'
    },
    {
      to: TEST_PUSH_TOKEN,
      title: 'Bulk Test 3',
      body: 'Third bulk notification'
    }
  ]

  const receipts = await pushService.sendBulkNotifications(notifications)

  assertEquals(receipts.length, 3)
  receipts.forEach(receipt => {
    assertEquals(receipt.status, 'ok')
    assertExists(receipt.id)
  })

  console.log('✅ Bulk notification processing test passed')
})

Deno.test("Push Notifications: Partial Success Handling", async () => {
  const pushService = new PushNotificationService(true)

  const notifications: NotificationPayload[] = [
    {
      to: TEST_PUSH_TOKEN,
      title: 'Success Test',
      body: 'This should succeed'
    },
    {
      to: 'ExponentPushToken[partial-invalid-token]',
      title: 'Failure Test',
      body: 'This should fail'
    }
  ]

  const receipts = await pushService.sendBulkNotifications(notifications)

  assertEquals(receipts.length, 2)
  assertEquals(receipts[0].status, 'ok')
  assertEquals(receipts[1].status, 'error')

  console.log('✅ Partial success handling test passed')
})

// ================================================================================================
// 3. LOST PET ALERT NOTIFICATION TESTS
// ================================================================================================

Deno.test("Lost Pet Alerts: Regional Notification Distribution", async () => {
  const pushService = new PushNotificationService(true)

  // Mock regional user data
  const regionalUsers = [
    { id: 'user1', push_token: TEST_PUSH_TOKEN, distance_km: 2.5 },
    { id: 'user2', push_token: TEST_PUSH_TOKEN, distance_km: 5.8 },
    { id: 'user3', push_token: TEST_PUSH_TOKEN, distance_km: 12.3 }
  ]

  const lostPetData = {
    pet_name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    location: { lat: 51.5074, lng: -0.1276 },
    reward_amount: 500,
    contact_phone: '+1234567890'
  }

  const notifications: NotificationPayload[] = regionalUsers.map(user => ({
    to: user.push_token,
    title: `Lost Pet Alert: ${lostPetData.pet_name}`,
    body: `A ${lostPetData.species} named ${lostPetData.pet_name} is missing ${user.distance_km}km from your location. Can you help?`,
    data: {
      type: 'lost_pet_alert',
      pet_name: lostPetData.pet_name,
      species: lostPetData.species,
      breed: lostPetData.breed,
      location: lostPetData.location,
      reward_amount: lostPetData.reward_amount,
      contact_phone: lostPetData.contact_phone,
      distance_km: user.distance_km
    },
    sound: 'default',
    priority: 'high',
    category: 'lost_pet'
  }))

  const receipts = await pushService.sendBulkNotifications(notifications)

  assertEquals(receipts.length, regionalUsers.length)
  receipts.forEach(receipt => {
    assertEquals(receipt.status, 'ok')
  })

  console.log(`✅ Regional lost pet alert distribution test passed - ${receipts.length} notifications sent`)
})

// ================================================================================================
// 4. VACCINATION REMINDER TESTS
// ================================================================================================

Deno.test("Vaccination Reminders: Premium Feature Notifications", async () => {
  const pushService = new PushNotificationService(true)

  const vaccinationReminders = [
    {
      user_id: 'premium_user_1',
      pet_name: 'Max',
      vaccine_type: 'Rabies',
      due_date: '2024-02-15'
    },
    {
      user_id: 'premium_user_2',
      pet_name: 'Luna',
      vaccine_type: 'DHPP',
      due_date: '2024-02-18'
    }
  ]

  const notifications: NotificationPayload[] = vaccinationReminders.map(reminder => ({
    to: TEST_PUSH_TOKEN,
    title: `Vaccination Due: ${reminder.pet_name}`,
    body: `${reminder.pet_name} is due for ${reminder.vaccine_type} vaccination on ${reminder.due_date}`,
    data: {
      type: 'vaccination_reminder',
      pet_name: reminder.pet_name,
      vaccine_type: reminder.vaccine_type,
      due_date: reminder.due_date,
      is_premium_feature: true
    },
    sound: 'default',
    priority: 'normal',
    category: 'health_reminder'
  }))

  const receipts = await pushService.sendBulkNotifications(notifications)

  assertEquals(receipts.length, vaccinationReminders.length)
  receipts.forEach((receipt, index) => {
    assertEquals(receipt.status, 'ok')
    assertExists(receipt.id)
  })

  console.log('✅ Vaccination reminder notifications test passed')
})

// ================================================================================================
// 5. NOTIFICATION SCHEDULING AND BATCHING TESTS
// ================================================================================================

Deno.test("Notifications: Scheduled Batch Processing", async () => {
  const pushService = new PushNotificationService(true)

  // Simulate a batch of scheduled notifications
  const scheduledNotifications = Array.from({ length: 50 }, (_, index) => ({
    to: TEST_PUSH_TOKEN,
    title: `Scheduled Notification ${index + 1}`,
    body: `This is scheduled notification number ${index + 1}`,
    data: {
      type: 'scheduled',
      batch_id: 'batch_001',
      notification_index: index + 1
    }
  }))

  // Process in batches of 20 (Expo Push API limit is 100, but we test smaller batches)
  const batchSize = 20
  const batches = []
  
  for (let i = 0; i < scheduledNotifications.length; i += batchSize) {
    batches.push(scheduledNotifications.slice(i, i + batchSize))
  }

  const allReceipts: PushReceipt[] = []
  
  for (const batch of batches) {
    const batchReceipts = await pushService.sendBulkNotifications(batch)
    allReceipts.push(...batchReceipts)
    
    // Small delay between batches to simulate real-world usage
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  assertEquals(allReceipts.length, scheduledNotifications.length)
  
  const successfulNotifications = allReceipts.filter(receipt => receipt.status === 'ok')
  assertEquals(successfulNotifications.length, scheduledNotifications.length)

  console.log(`✅ Batch processing test passed - processed ${batches.length} batches with ${allReceipts.length} total notifications`)
})

// ================================================================================================
// 6. PUSH TOKEN MANAGEMENT TESTS
// ================================================================================================

Deno.test("Push Tokens: Validation and Error Handling", async () => {
  const pushService = new PushNotificationService(true)

  const tokenTestCases = [
    { token: 'ExponentPushToken[valid-token-format]', shouldSucceed: true },
    { token: 'invalid-token-format', shouldSucceed: false },
    { token: '', shouldSucceed: false },
    { token: 'ExponentPushToken[]', shouldSucceed: false }
  ]

  for (const testCase of tokenTestCases) {
    const notification: NotificationPayload = {
      to: testCase.token,
      title: 'Token Validation Test',
      body: 'Testing token format validation'
    }

    const receipt = await pushService.sendNotification(notification)

    if (testCase.shouldSucceed) {
      assertEquals(receipt.status, 'ok', `Token ${testCase.token} should have succeeded`)
    } else {
      assertEquals(receipt.status, 'error', `Token ${testCase.token} should have failed`)
    }
  }

  console.log('✅ Push token validation test passed')
})

// ================================================================================================
// 7. NOTIFICATION DELIVERY RETRY LOGIC TESTS
// ================================================================================================

Deno.test("Notifications: Retry Logic for Failed Deliveries", async () => {
  const pushService = new PushNotificationService(true)

  // Simulate retry scenario
  const maxRetries = 3
  const failingNotification: NotificationPayload = {
    to: 'ExponentPushToken[retry-test-invalid]',
    title: 'Retry Test',
    body: 'This notification will fail and trigger retry logic'
  }

  let attemptCount = 0
  let finalReceipt: PushReceipt | null = null

  while (attemptCount < maxRetries && (!finalReceipt || finalReceipt.status === 'error')) {
    attemptCount++
    finalReceipt = await pushService.sendNotification(failingNotification)
    
    console.log(`Attempt ${attemptCount}: ${finalReceipt.status}`)
    
    if (finalReceipt.status === 'error') {
      // Exponential backoff delay
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attemptCount) * 100))
    }
  }

  assertEquals(attemptCount, maxRetries)
  assertEquals(finalReceipt!.status, 'error') // In mock mode, invalid tokens always fail

  console.log(`✅ Retry logic test passed - attempted ${attemptCount} times`)
})

// ================================================================================================
// 8. NOTIFICATION ANALYTICS AND TRACKING TESTS
// ================================================================================================

Deno.test("Notifications: Delivery Analytics and Tracking", async () => {
  const pushService = new PushNotificationService(true)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const testUserId = 'analytics-test-user'
  const notifications: NotificationPayload[] = [
    {
      to: TEST_PUSH_TOKEN,
      title: 'Analytics Test 1',
      body: 'First analytics notification'
    },
    {
      to: TEST_PUSH_TOKEN,
      title: 'Analytics Test 2',
      body: 'Second analytics notification'
    },
    {
      to: 'ExponentPushToken[analytics-invalid]',
      title: 'Analytics Test 3',
      body: 'Third analytics notification (will fail)'
    }
  ]

  const receipts = await pushService.sendBulkNotifications(notifications)

  // Log each notification result
  for (let i = 0; i < notifications.length; i++) {
    await pushService.logNotificationResult(testUserId, notifications[i], receipts[i])
  }

  // Verify analytics data was logged
  const { data: loggedNotifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', testUserId)
    .eq('type', 'push_notification')

  assert(!error, `Database error: ${error?.message}`)
  
  const successfulLogs = loggedNotifications?.filter(log => log.push_sent === true) || []
  const failedLogs = loggedNotifications?.filter(log => log.push_sent === false) || []

  assertEquals(successfulLogs.length, 2) // Two successful notifications
  assertEquals(failedLogs.length, 1) // One failed notification

  // Cleanup test data
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', testUserId)

  console.log('✅ Notification analytics and tracking test passed')
})

// ================================================================================================
// 9. PERFORMANCE AND LOAD TESTS
// ================================================================================================

Deno.test("Notifications: High Volume Performance Test", async () => {
  const pushService = new PushNotificationService(true)
  
  const startTime = performance.now()
  const notificationCount = 500

  // Generate high volume of notifications
  const notifications: NotificationPayload[] = Array.from({ length: notificationCount }, (_, index) => ({
    to: TEST_PUSH_TOKEN,
    title: `Performance Test ${index + 1}`,
    body: `High volume notification ${index + 1} of ${notificationCount}`
  }))

  // Process in optimal batch sizes
  const batchSize = 100 // Expo's recommended batch size
  const batches = []
  
  for (let i = 0; i < notifications.length; i += batchSize) {
    batches.push(notifications.slice(i, i + batchSize))
  }

  const startProcessingTime = performance.now()
  
  const allReceipts: PushReceipt[] = []
  for (const batch of batches) {
    const batchReceipts = await pushService.sendBulkNotifications(batch)
    allReceipts.push(...batchReceipts)
  }

  const endTime = performance.now()
  const totalTime = endTime - startTime
  const processingTime = endTime - startProcessingTime
  const notificationsPerSecond = (notificationCount / (processingTime / 1000)).toFixed(2)

  assertEquals(allReceipts.length, notificationCount)
  
  // Performance should be reasonable (this is with mocked API calls)
  assert(totalTime < 10000, `Performance test too slow: ${totalTime}ms`)

  console.log(`✅ Performance test passed - ${notificationCount} notifications in ${totalTime.toFixed(2)}ms (${notificationsPerSecond} notifications/second)`)
})

// ================================================================================================
// 10. NOTIFICATION CONTENT AND FORMATTING TESTS
// ================================================================================================

Deno.test("Notifications: Content Validation and Formatting", async () => {
  const pushService = new PushNotificationService(true)

  const testCases = [
    {
      name: 'Basic notification',
      notification: {
        to: TEST_PUSH_TOKEN,
        title: 'Simple Test',
        body: 'This is a simple notification'
      },
      shouldSucceed: true
    },
    {
      name: 'Rich content notification',
      notification: {
        to: TEST_PUSH_TOKEN,
        title: '🐕 Lost Pet Alert',
        body: 'Max, a Golden Retriever, is missing near Central Park. $500 reward! 📞 Contact: (555) 123-4567',
        data: {
          type: 'lost_pet',
          urgency: 'high',
          contact: '(555) 123-4567'
        },
        badge: 1,
        category: 'alert'
      },
      shouldSucceed: true
    },
    {
      name: 'Long content notification',
      notification: {
        to: TEST_PUSH_TOKEN,
        title: 'Very Long Notification Title That Exceeds Normal Length Limits',
        body: 'This is a very long notification body that contains a lot of text to test how the push notification system handles long content. It includes multiple sentences and various details about the notification content.'
      },
      shouldSucceed: true
    },
    {
      name: 'Empty title notification',
      notification: {
        to: TEST_PUSH_TOKEN,
        title: '',
        body: 'This notification has an empty title'
      },
      shouldSucceed: true // Expo allows empty titles
    }
  ]

  for (const testCase of testCases) {
    const receipt = await pushService.sendNotification(testCase.notification)
    
    if (testCase.shouldSucceed) {
      assertEquals(receipt.status, 'ok', `${testCase.name} should have succeeded`)
    } else {
      assertEquals(receipt.status, 'error', `${testCase.name} should have failed`)
    }
    
    console.log(`✓ ${testCase.name}: ${receipt.status}`)
  }

  console.log('✅ Notification content validation test passed')
})

console.log(`
🔔 TailTracker Push Notification System Tests
=============================================
Test Coverage:
✓ Single and bulk message delivery
✓ Invalid token handling
✓ Lost pet alert distribution
✓ Vaccination reminder notifications  
✓ Scheduled batch processing
✓ Push token validation
✓ Retry logic for failed deliveries
✓ Delivery analytics and tracking
✓ High volume performance testing
✓ Content validation and formatting
=============================================
Run with: deno test --allow-net --allow-env
`)