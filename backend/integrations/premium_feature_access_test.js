/**
 * TailTracker Premium Feature Access Control Test Suite
 * Comprehensive testing for subscription-based feature limitations
 * 
 * Test Cases:
 * 1. Pet limits (Free: 1, Premium: unlimited)
 * 2. Photo limits per pet (Free: 1, Premium: unlimited)
 * 3. Lost pet alerts (Free: disabled, Premium: enabled)
 * 4. Vaccination reminders (Free: basic, Premium: advanced)
 * 5. Family sharing limits (Free: 1 member, Premium: 10 members)
 * 6. Advanced health tracking (Premium only)
 * 7. Priority support access (Premium only)
 * 8. Feature degradation on subscription expiry
 */

const { PaymentProcessor } = require('./payment_processing');
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  stripeSecretKey: 'STRIPE_SECRET_KEY_HERE',
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
  environment: 'sandbox'
};

class PremiumFeatureAccessTestSuite {
  constructor() {
    this.paymentProcessor = null;
    this.supabase = null;
    this.testResults = [];
    this.testUsers = [];
    this.cleanupIds = {
      users: [],
      families: [],
      pets: [],
      subscriptions: [],
      lostPets: [],
      notifications: []
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Premium Feature Access Test Suite...');
      
      // Initialize payment processor
      this.paymentProcessor = new PaymentProcessor(
        TEST_CONFIG.stripeSecretKey,
        TEST_CONFIG.supabaseUrl,
        TEST_CONFIG.supabaseKey,
        {
          currency: 'eur',
          environment: TEST_CONFIG.environment
        }
      );

      // Initialize Supabase client
      this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
      
      console.log('✅ Premium feature access test suite initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize test suite:', error);
      return false;
    }
  }

  async runAllTests() {
    try {
      console.log('\n🔍 Starting Premium Feature Access Test Suite...\n');

      // Create test users
      await this.createTestUsers();

      // Run feature access tests
      await this.testPetLimits();
      await this.testPhotoLimits();
      await this.testLostPetAlerts();
      await this.testVaccinationReminders();
      await this.testFamilySharingLimits();
      await this.testAdvancedHealthTracking();
      await this.testPrioritySupport();
      await this.testFeatureDegradation();
      await this.testSubscriptionTransitions();

      // Generate test report
      this.generateTestReport();
      
      // Cleanup test data
      await this.cleanup();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async createTestUsers() {
    console.log('👥 Creating test users...');
    
    try {
      // Create free user
      const freeUser = await this.createTestUser('free_user@test.com', 'free');
      this.testUsers.push({ ...freeUser, type: 'free' });

      // Create premium user
      const premiumUser = await this.createTestUser('premium_user@test.com', 'premium');
      this.testUsers.push({ ...premiumUser, type: 'premium' });

      // Create expired premium user
      const expiredUser = await this.createTestUser('expired_user@test.com', 'premium', true);
      this.testUsers.push({ ...expiredUser, type: 'expired' });

      console.log('✅ Test users created successfully');
    } catch (error) {
      console.error('❌ Failed to create test users:', error);
      throw error;
    }
  }

  async createTestUser(email, subscriptionType, expired = false) {
    const authUserId = this.generateUUID();
    const userId = this.generateUUID();
    
    const expiresAt = expired 
      ? new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      : subscriptionType === 'premium' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        : null;

    // Insert user
    const { error: userError } = await this.supabase
      .from('users')
      .insert({
        id: userId,
        auth_user_id: authUserId,
        email,
        full_name: `Test User (${subscriptionType})`,
        subscription_status: expired ? 'expired' : subscriptionType,
        subscription_expires_at: expiresAt?.toISOString(),
        created_at: new Date().toISOString()
      });

    if (userError) throw userError;

    // Create family for user
    const familyId = this.generateUUID();
    const { error: familyError } = await this.supabase
      .from('families')
      .insert({
        id: familyId,
        owner_id: userId,
        name: `${subscriptionType} Family`,
        invite_code: `${subscriptionType.toUpperCase()}123`,
        created_at: new Date().toISOString()
      });

    if (familyError) throw familyError;

    // Track for cleanup
    this.cleanupIds.users.push(userId);
    this.cleanupIds.families.push(familyId);

    return { userId, familyId, email, subscriptionType };
  }

  async testPetLimits() {
    console.log('\n🐕 Testing Pet Limits...');
    
    const freeUser = this.testUsers.find(u => u.type === 'free');
    const premiumUser = this.testUsers.find(u => u.type === 'premium');

    try {
      // Test free user pet limit (should be 1)
      const freePetLimit = await this.paymentProcessor.validateSubscriptionLimits(
        freeUser.userId, 'pets', 1
      );
      
      this.addTestResult(
        'Free User Pet Limit (1 pet)', 
        !freePetLimit.allowed, 
        { limit: 1, attempted: 1, message: freePetLimit.message }
      );

      // Test premium user pet limit (should be unlimited)
      const premiumPetLimit = await this.paymentProcessor.validateSubscriptionLimits(
        premiumUser.userId, 'pets', 10
      );
      
      this.addTestResult(
        'Premium User Pet Limit (unlimited)', 
        premiumPetLimit.allowed, 
        { unlimited: true, attempted: 10, message: premiumPetLimit.message }
      );

      // Test actual pet creation for free user
      await this.createTestPet(freeUser.familyId, freeUser.userId, 'Free User Pet 1');
      
      try {
        await this.createTestPet(freeUser.familyId, freeUser.userId, 'Free User Pet 2');
        this.addTestResult('Free User Second Pet Creation', false, { 
          message: 'Should be prevented by application logic' 
        });
      } catch (error) {
        this.addTestResult('Free User Second Pet Creation', true, { 
          message: 'Correctly prevented by validation' 
        });
      }

      // Test pet creation for premium user (multiple pets)
      for (let i = 1; i <= 5; i++) {
        await this.createTestPet(premiumUser.familyId, premiumUser.userId, `Premium Pet ${i}`);
      }
      
      const premiumPetCount = await this.getPetCount(premiumUser.userId);
      this.addTestResult('Premium User Multiple Pets', premiumPetCount >= 5, { 
        count: premiumPetCount, expected: '5+' 
      });

      console.log('✅ Pet limits testing completed');
    } catch (error) {
      this.addTestResult('Pet Limits', false, { error: error.message });
      console.log('❌ Pet limits testing failed:', error.message);
    }
  }

  async testPhotoLimits() {
    console.log('\n📸 Testing Photo Limits...');
    
    const freeUser = this.testUsers.find(u => u.type === 'free');
    const premiumUser = this.testUsers.find(u => u.type === 'premium');

    try {
      // Get first pet for each user
      const freePets = await this.getUserPets(freeUser.userId);
      const premiumPets = await this.getUserPets(premiumUser.userId);

      if (freePets.length > 0 && premiumPets.length > 0) {
        // Test free user photo limit (1 per pet)
        const freePhotoLimit = await this.paymentProcessor.validateSubscriptionLimits(
          freeUser.userId, 'photos_per_pet', 1
        );
        
        this.addTestResult(
          'Free User Photo Limit (1 per pet)', 
          !freePhotoLimit.allowed, 
          { limit: 1, attempted: 1 }
        );

        // Test premium user photo limit (unlimited)
        const premiumPhotoLimit = await this.paymentProcessor.validateSubscriptionLimits(
          premiumUser.userId, 'photos_per_pet', 10
        );
        
        this.addTestResult(
          'Premium User Photo Limit (unlimited)', 
          premiumPhotoLimit.allowed, 
          { unlimited: true, attempted: 10 }
        );
      }

      console.log('✅ Photo limits testing completed');
    } catch (error) {
      this.addTestResult('Photo Limits', false, { error: error.message });
      console.log('❌ Photo limits testing failed:', error.message);
    }
  }

  async testLostPetAlerts() {
    console.log('\n🚨 Testing Lost Pet Alerts...');
    
    const freeUser = this.testUsers.find(u => u.type === 'free');
    const premiumUser = this.testUsers.find(u => u.type === 'premium');

    try {
      // Check feature access
      const freeAccess = await this.paymentProcessor.checkPremiumAccess(freeUser.userId);
      const premiumAccess = await this.paymentProcessor.checkPremiumAccess(premiumUser.userId);

      this.addTestResult(
        'Free User Lost Pet Alerts Access', 
        !freeAccess.hasPremium, 
        { access: false, message: 'Feature requires premium' }
      );

      this.addTestResult(
        'Premium User Lost Pet Alerts Access', 
        premiumAccess.hasPremium, 
        { access: true, message: 'Premium feature available' }
      );

      // Test lost pet alert creation for premium user
      const premiumPets = await this.getUserPets(premiumUser.userId);
      if (premiumPets.length > 0) {
        const lostPetId = await this.createLostPetAlert(premiumPets[0].id, premiumUser.userId);
        this.addTestResult(
          'Premium User Lost Pet Alert Creation', 
          lostPetId !== null, 
          { alertCreated: true }
        );
      }

      console.log('✅ Lost pet alerts testing completed');
    } catch (error) {
      this.addTestResult('Lost Pet Alerts', false, { error: error.message });
      console.log('❌ Lost pet alerts testing failed:', error.message);
    }
  }

  async testVaccinationReminders() {
    console.log('\n💉 Testing Vaccination Reminders...');
    
    const freeUser = this.testUsers.find(u => u.type === 'free');
    const premiumUser = this.testUsers.find(u => u.type === 'premium');

    try {
      // Test basic vaccination tracking (available to all)
      const freePets = await this.getUserPets(freeUser.userId);
      const premiumPets = await this.getUserPets(premiumUser.userId);

      // Both should be able to create basic vaccination records
      if (freePets.length > 0) {
        await this.createVaccinationRecord(freePets[0].id, freeUser.userId, false);
        this.addTestResult('Free User Basic Vaccination Tracking', true, { 
          feature: 'basic vaccination tracking' 
        });
      }

      if (premiumPets.length > 0) {
        await this.createVaccinationRecord(premiumPets[0].id, premiumUser.userId, true);
        this.addTestResult('Premium User Advanced Vaccination Tracking', true, { 
          feature: 'advanced vaccination with reminders' 
        });
      }

      console.log('✅ Vaccination reminders testing completed');
    } catch (error) {
      this.addTestResult('Vaccination Reminders', false, { error: error.message });
      console.log('❌ Vaccination reminders testing failed:', error.message);
    }
  }

  async testFamilySharingLimits() {
    console.log('\n👨‍👩‍👧‍👦 Testing Family Sharing Limits...');
    
    const freeUser = this.testUsers.find(u => u.type === 'free');
    const premiumUser = this.testUsers.find(u => u.type === 'premium');

    try {
      // Test free user family member limit (1)
      const freeMemberLimit = await this.paymentProcessor.validateSubscriptionLimits(
        freeUser.userId, 'family_members', 1
      );
      
      this.addTestResult(
        'Free User Family Member Limit (1)', 
        !freeMemberLimit.allowed, 
        { limit: 1, attempted: 1 }
      );

      // Test premium user family member limit (10)
      const premiumMemberLimit = await this.paymentProcessor.validateSubscriptionLimits(
        premiumUser.userId, 'family_members', 5
      );
      
      this.addTestResult(
        'Premium User Family Member Limit (10)', 
        premiumMemberLimit.allowed, 
        { limit: 10, attempted: 5 }
      );

      console.log('✅ Family sharing limits testing completed');
    } catch (error) {
      this.addTestResult('Family Sharing Limits', false, { error: error.message });
      console.log('❌ Family sharing limits testing failed:', error.message);
    }
  }

  async testAdvancedHealthTracking() {
    console.log('\n🏥 Testing Advanced Health Tracking...');
    
    const freeUser = this.testUsers.find(u => u.type === 'free');
    const premiumUser = this.testUsers.find(u => u.type === 'premium');

    try {
      // Check subscription limits for advanced features
      const freeLimits = this.paymentProcessor.getSubscriptionLimits('free');
      const premiumLimits = this.paymentProcessor.getSubscriptionLimits('premium');

      this.addTestResult(
        'Free User Advanced Health Tracking', 
        !freeLimits.advanced_health_tracking, 
        { feature: 'advanced_health_tracking', available: false }
      );

      this.addTestResult(
        'Premium User Advanced Health Tracking', 
        premiumLimits.advanced_health_tracking, 
        { feature: 'advanced_health_tracking', available: true }
      );

      console.log('✅ Advanced health tracking testing completed');
    } catch (error) {
      this.addTestResult('Advanced Health Tracking', false, { error: error.message });
      console.log('❌ Advanced health tracking testing failed:', error.message);
    }
  }

  async testPrioritySupport() {
    console.log('\n🎧 Testing Priority Support Access...');
    
    const freeUser = this.testUsers.find(u => u.type === 'free');
    const premiumUser = this.testUsers.find(u => u.type === 'premium');

    try {
      // Check feature availability in subscription plans
      const freePlan = PaymentProcessor.SUBSCRIPTION_PLANS.free;
      const premiumPlan = PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly;

      this.addTestResult(
        'Free User Priority Support', 
        !freePlan.features.includes('priority_support'), 
        { feature: 'priority_support', available: false }
      );

      this.addTestResult(
        'Premium User Priority Support', 
        premiumPlan.features.includes('priority_support'), 
        { feature: 'priority_support', available: true }
      );

      console.log('✅ Priority support testing completed');
    } catch (error) {
      this.addTestResult('Priority Support', false, { error: error.message });
      console.log('❌ Priority support testing failed:', error.message);
    }
  }

  async testFeatureDegradation() {
    console.log('\n⏰ Testing Feature Degradation on Expiry...');
    
    const expiredUser = this.testUsers.find(u => u.type === 'expired');

    try {
      // Test expired premium user should have free limits
      const expiredAccess = await this.paymentProcessor.checkPremiumAccess(expiredUser.userId);
      
      this.addTestResult(
        'Expired User Premium Access', 
        !expiredAccess.hasPremium, 
        { 
          subscriptionStatus: expiredAccess.subscriptionStatus,
          message: expiredAccess.message 
        }
      );

      // Test that expired user gets free tier limits
      const expiredLimits = await this.paymentProcessor.validateSubscriptionLimits(
        expiredUser.userId, 'pets', 2
      );
      
      this.addTestResult(
        'Expired User Feature Limits', 
        !expiredLimits.allowed, 
        { 
          limit: expiredLimits.limit,
          message: 'Should revert to free tier limits' 
        }
      );

      console.log('✅ Feature degradation testing completed');
    } catch (error) {
      this.addTestResult('Feature Degradation', false, { error: error.message });
      console.log('❌ Feature degradation testing failed:', error.message);
    }
  }

  async testSubscriptionTransitions() {
    console.log('\n🔄 Testing Subscription Transitions...');
    
    try {
      // Create a test user for subscription transitions
      const transitionUser = await this.createTestUser('transition@test.com', 'free');
      
      // Simulate upgrade to premium
      const { error: upgradeError } = await this.supabase
        .from('users')
        .update({
          subscription_status: 'premium',
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', transitionUser.userId);

      if (!upgradeError) {
        const upgradedAccess = await this.paymentProcessor.checkPremiumAccess(transitionUser.userId);
        this.addTestResult(
          'Free to Premium Upgrade', 
          upgradedAccess.hasPremium, 
          { transition: 'free -> premium' }
        );
      }

      // Simulate downgrade to free
      const { error: downgradeError } = await this.supabase
        .from('users')
        .update({
          subscription_status: 'free',
          subscription_expires_at: null
        })
        .eq('id', transitionUser.userId);

      if (!downgradeError) {
        const downgradedAccess = await this.paymentProcessor.checkPremiumAccess(transitionUser.userId);
        this.addTestResult(
          'Premium to Free Downgrade', 
          !downgradedAccess.hasPremium, 
          { transition: 'premium -> free' }
        );
      }

      console.log('✅ Subscription transitions testing completed');
    } catch (error) {
      this.addTestResult('Subscription Transitions', false, { error: error.message });
      console.log('❌ Subscription transitions testing failed:', error.message);
    }
  }

  // Helper methods
  async createTestPet(familyId, userId, name) {
    const petId = this.generateUUID();
    
    const { error } = await this.supabase
      .from('pets')
      .insert({
        id: petId,
        family_id: familyId,
        name,
        species: 'Dog',
        created_by: userId,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    
    this.cleanupIds.pets.push(petId);
    return petId;
  }

  async createLostPetAlert(petId, userId) {
    const alertId = this.generateUUID();
    
    const { error } = await this.supabase
      .from('lost_pets')
      .insert({
        id: alertId,
        pet_id: petId,
        reported_by: userId,
        status: 'lost',
        last_seen_date: new Date().toISOString(),
        description: 'Test lost pet alert',
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    
    this.cleanupIds.lostPets.push(alertId);
    return alertId;
  }

  async createVaccinationRecord(petId, userId, withReminder = false) {
    const vaccinationId = this.generateUUID();
    
    const { error } = await this.supabase
      .from('vaccinations')
      .insert({
        id: vaccinationId,
        pet_id: petId,
        vaccine_name: 'Test Vaccine',
        administered_date: new Date().toISOString().split('T')[0],
        next_due_date: withReminder ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        created_by: userId,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return vaccinationId;
  }

  async getUserPets(userId) {
    const { data, error } = await this.supabase
      .from('pets')
      .select('*')
      .eq('created_by', userId);

    if (error) throw error;
    return data || [];
  }

  async getPetCount(userId) {
    const { count, error } = await this.supabase
      .from('pets')
      .select('id', { count: 'exact' })
      .eq('created_by', userId);

    if (error) throw error;
    return count || 0;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  addTestResult(testName, passed, details = {}) {
    this.testResults.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  generateTestReport() {
    console.log('\n📊 PREMIUM FEATURE ACCESS TEST REPORT');
    console.log('====================================');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('');
    
    // Feature breakdown
    const featureTests = {
      'Pet Limits': this.testResults.filter(r => r.test.includes('Pet')),
      'Photo Limits': this.testResults.filter(r => r.test.includes('Photo')),
      'Lost Pet Alerts': this.testResults.filter(r => r.test.includes('Lost Pet')),
      'Vaccination': this.testResults.filter(r => r.test.includes('Vaccination')),
      'Family Sharing': this.testResults.filter(r => r.test.includes('Family')),
      'Advanced Features': this.testResults.filter(r => r.test.includes('Advanced') || r.test.includes('Priority')),
      'Subscription Management': this.testResults.filter(r => r.test.includes('Expired') || r.test.includes('Transition'))
    };

    console.log('FEATURE TEST BREAKDOWN:');
    console.log('----------------------');
    
    Object.entries(featureTests).forEach(([feature, tests]) => {
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
      console.log(`${feature}: ${passed}/${total} (${rate}%)`);
    });
    
    // Detailed results
    console.log('\nDETAILED RESULTS:');
    console.log('-----------------');
    
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.test}: ${status}`);
      
      if (result.details.error) {
        console.log(`   Error: ${result.details.error}`);
      } else if (result.details.message) {
        console.log(`   Details: ${result.details.message}`);
      }
    });
    
    // Premium features summary
    console.log('\nPREMIUM FEATURES TESTED:');
    console.log('------------------------');
    const premiumFeatures = PaymentProcessor.SUBSCRIPTION_PLANS.premium_monthly.features;
    premiumFeatures.forEach(feature => {
      console.log(`- ${feature}`);
    });
    
    // Free tier limitations summary
    console.log('\nFREE TIER LIMITATIONS:');
    console.log('---------------------');
    const freeLimits = PaymentProcessor.SUBSCRIPTION_PLANS.free.limits;
    Object.entries(freeLimits).forEach(([resource, limit]) => {
      console.log(`- ${resource}: ${limit === -1 ? 'unlimited' : limit}`);
    });
    
    console.log('\n🎉 Premium Feature Access Test Report Complete!\n');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete in reverse order of dependencies
      for (const table of ['lost_pets', 'pets', 'families', 'users']) {
        const ids = this.cleanupIds[table] || [];
        if (ids.length > 0) {
          const { error } = await this.supabase
            .from(table)
            .delete()
            .in('id', ids);
          
          if (error) {
            console.log(`   Failed to cleanup ${table}:`, error.message);
          } else {
            console.log(`   Cleaned up ${ids.length} ${table} records`);
          }
        }
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('❌ Cleanup failed:', error.message);
    }
  }
}

// Export test runner
module.exports = { PremiumFeatureAccessTestSuite };

// Run tests if called directly
if (require.main === module) {
  async function runTests() {
    const testSuite = new PremiumFeatureAccessTestSuite();
    
    const initialized = await testSuite.initialize();
    if (!initialized) {
      console.error('Failed to initialize test suite');
      process.exit(1);
    }
    
    await testSuite.runAllTests();
  }
  
  runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}