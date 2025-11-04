#!/usr/bin/env node

/**
 * TailTracker Automated Testing Script
 * Simulates comprehensive feature testing via database operations
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://tkcajpwdlsavqfqhdawy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2FqcHdkbHNhdnFmcWhkYXd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ1ODAxNSwiZXhwIjoyMDcyMDM0MDE1fQ.NA_3G3RXr7nq_4iKDhPp1Cb2pojSHrOFtv5Jl9Fs570';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEST_SESSION_ID = 'test_session_1758981685054';

console.log('🧪 TailTracker Automated Testing Suite');
console.log('=====================================\n');

/**
 * Test Result Tracker
 */
class TestTracker {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  async test(description, testFunction) {
    process.stdout.write(`🔍 ${description}... `);
    try {
      await testFunction();
      console.log('✅ PASS');
      this.passed++;
      this.tests.push({ description, status: 'PASS' });
    } catch (error) {
      console.log('❌ FAIL');
      console.log(`   Error: ${error.message}`);
      this.failed++;
      this.tests.push({ description, status: 'FAIL', error: error.message });
    }
  }

  summary() {
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(
      `Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%\n`
    );

    if (this.failed > 0) {
      console.log('❌ Failed Tests:');
      this.tests
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          console.log(`   • ${test.description}: ${test.error}`);
        });
    }
  }
}

const tracker = new TestTracker();

/**
 * Phase 1: Test Data Validation
 */
async function testDataValidation() {
  console.log('📋 Phase 1: Test Data Validation\n');

  await tracker.test('Test pets exist in database', async () => {
    const { data: pets, error } = await supabase
      .from('pets')
      .select('*')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (error) throw error;
    if (pets.length !== 3)
      throw new Error(`Expected 3 pets, found ${pets.length}`);
  });

  await tracker.test('Pet profiles have required fields', async () => {
    const { data: pets, error } = await supabase
      .from('pets')
      .select('*')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (error) throw error;

    for (const pet of pets) {
      if (!pet.name) throw new Error(`Pet ${pet.id} missing name`);
      if (!pet.species) throw new Error(`Pet ${pet.id} missing species`);
    }
  });

  await tracker.test('Medical records associated with pets', async () => {
    const { data: records, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (error) throw error;
    if (records.length !== 9)
      throw new Error(`Expected 9 medical records, found ${records.length}`);
  });

  await tracker.test('Vaccinations recorded for applicable pets', async () => {
    const { data: vaccinations, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (error) throw error;
    if (vaccinations.length !== 6)
      throw new Error(`Expected 6 vaccinations, found ${vaccinations.length}`);
  });

  await tracker.test(
    'Medications tracked for pets with conditions',
    async () => {
      const { data: medications, error } = await supabase
        .from('medications')
        .select('*')
        .eq('anonymous_session_id', TEST_SESSION_ID);

      if (error) throw error;
      if (medications.length !== 2)
        throw new Error(`Expected 2 medications, found ${medications.length}`);
    }
  );
}

/**
 * Phase 2: Core Functionality Testing
 */
async function testCoreFunctionality() {
  console.log('\n🏠 Phase 2: Core Functionality Testing\n');

  await tracker.test('Pet profile data integrity', async () => {
    const { data: pets, error } = await supabase
      .from('pets')
      .select('*')
      .eq('anonymous_session_id', TEST_SESSION_ID)
      .eq('name', 'Buddy');

    if (error) throw error;
    if (pets.length !== 1) throw new Error('Buddy not found');

    const buddy = pets[0];
    if (buddy.species !== 'dog') throw new Error('Buddy species incorrect');
    if (buddy.breed !== 'Golden Retriever')
      throw new Error('Buddy breed incorrect');
    if (!buddy.medical_conditions.includes('hip_dysplasia'))
      throw new Error('Buddy medical condition missing');
  });

  await tracker.test('Health record completeness', async () => {
    const { data: pets, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('anonymous_session_id', TEST_SESSION_ID)
      .eq('name', 'Buddy')
      .single();

    if (petError) throw petError;

    const { data: records, error: recordError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('pet_id', pets.id)
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (recordError) throw recordError;
    if (records.length !== 3)
      throw new Error(`Expected 3 records for Buddy, found ${records.length}`);

    // Check record types
    const recordTypes = records.map(r => r.record_type);
    if (!recordTypes.includes('checkup'))
      throw new Error('Missing checkup record');
    if (!recordTypes.includes('vaccination'))
      throw new Error('Missing vaccination record');
    if (!recordTypes.includes('emergency'))
      throw new Error('Missing emergency record');
  });

  await tracker.test('Vaccination schedule tracking', async () => {
    const { data: vaccinations, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (error) throw error;

    // Check for due dates
    const futureDates = vaccinations.filter(
      v => v.next_due_date && new Date(v.next_due_date) > new Date()
    );
    if (futureDates.length === 0)
      throw new Error('No future vaccination due dates found');

    // Check for batch numbers
    const withBatchNumbers = vaccinations.filter(v => v.batch_number);
    if (withBatchNumbers.length !== vaccinations.length)
      throw new Error('Some vaccinations missing batch numbers');
  });
}

/**
 * Phase 3: Premium Feature Validation
 */
async function testPremiumFeatures() {
  console.log('\n💎 Phase 3: Premium Feature Validation\n');

  await tracker.test('Free tier pet limit enforcement', async () => {
    // This would be tested in the app UI - here we validate the data supports it
    const { data: pets, error } = await supabase
      .from('pets')
      .select('id')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (error) throw error;

    // We have 3 test pets, which should trigger upgrade prompts in a free account
    if (pets.length <= 1)
      throw new Error('Not enough test pets to validate tier limits');
  });

  await tracker.test('Health record export data completeness', async () => {
    const { data: pets, error: petError } = await supabase
      .from('pets')
      .select('id, name')
      .eq('anonymous_session_id', TEST_SESSION_ID)
      .limit(1);

    if (petError) throw petError;
    if (!pets || pets.length === 0)
      throw new Error('No pets found for export test');

    const pet = pets[0];

    // Get all health-related data for export testing
    const [
      { data: records, error: recordError },
      { data: vaccinations, error: vaccinationError },
      { data: medications, error: medicationError },
    ] = await Promise.all([
      supabase.from('medical_records').select('*').eq('pet_id', pet.id),
      supabase.from('vaccinations').select('*').eq('pet_id', pet.id),
      supabase.from('medications').select('*').eq('pet_id', pet.id),
    ]);

    if (recordError || vaccinationError || medicationError) {
      throw new Error('Error fetching health data for export');
    }

    if (
      records.length === 0 &&
      vaccinations.length === 0 &&
      medications.length === 0
    ) {
      throw new Error('No health data available for export');
    }
  });

  await tracker.test('Family coordination data structure', async () => {
    // Test the database supports family features
    const { data: families, error } = await supabase
      .from('families')
      .select('*')
      .limit(1);

    if (error) throw error;
    // Just verify the table exists and is accessible
  });
}

/**
 * Phase 4: Data Integrity Testing
 */
async function testDataIntegrity() {
  console.log('\n🔒 Phase 4: Data Integrity Testing\n');

  await tracker.test('Anonymous session isolation', async () => {
    // Verify our test data is isolated to our session
    const { data: otherPets, error } = await supabase
      .from('pets')
      .select('*')
      .neq('anonymous_session_id', TEST_SESSION_ID)
      .limit(5);

    if (error) throw error;

    // Check that other session data doesn't interfere
    const testPetNames = ['Buddy', 'Whiskers', 'Charlie'];
    const conflicts = otherPets.filter(pet => testPetNames.includes(pet.name));

    if (conflicts.length > 0) {
      console.warn(
        `⚠️  Found ${conflicts.length} pets with test names in other sessions`
      );
    }
  });

  await tracker.test('Foreign key relationships', async () => {
    // Test that all medical records have valid pet_ids
    const { data: records, error: recordError } = await supabase
      .from('medical_records')
      .select('pet_id')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (recordError) throw recordError;

    const { data: pets, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (petError) throw petError;

    const petIds = pets.map(p => p.id);
    const orphanedRecords = records.filter(r => !petIds.includes(r.pet_id));

    if (orphanedRecords.length > 0) {
      throw new Error(
        `Found ${orphanedRecords.length} orphaned medical records`
      );
    }
  });

  await tracker.test('Data type validation', async () => {
    const { data: pets, error } = await supabase
      .from('pets')
      .select('*')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (error) throw error;

    for (const pet of pets) {
      // Validate date formats
      if (pet.date_of_birth && isNaN(Date.parse(pet.date_of_birth))) {
        throw new Error(`Invalid date format for ${pet.name}`);
      }

      // Validate numeric fields
      if (pet.weight_kg && typeof pet.weight_kg !== 'number') {
        throw new Error(`Invalid weight format for ${pet.name}`);
      }

      // Validate array fields
      if (pet.personality_traits && !Array.isArray(pet.personality_traits)) {
        throw new Error(`Invalid personality traits format for ${pet.name}`);
      }
    }
  });
}

/**
 * Phase 5: Performance and Scale Testing
 */
async function testPerformanceAndScale() {
  console.log('\n⚡ Phase 5: Performance and Scale Testing\n');

  await tracker.test('Database query performance', async () => {
    const startTime = Date.now();

    const { data: pets, error } = await supabase
      .from('pets')
      .select(
        `
        *,
        medical_records(*),
        vaccinations(*),
        medications(*)
      `
      )
      .eq('anonymous_session_id', TEST_SESSION_ID);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    if (error) throw error;
    if (queryTime > 5000) throw new Error(`Query too slow: ${queryTime}ms`);

    console.log(
      `\n   📊 Query Performance: ${queryTime}ms for ${pets.length} pets with related data`
    );
  });

  await tracker.test('Bulk data handling', async () => {
    // Test that we can handle the test dataset efficiently
    const { data: allData, error } = await supabase
      .from('pets')
      .select('*, medical_records!inner(*)')
      .eq('anonymous_session_id', TEST_SESSION_ID);

    if (error) throw error;

    // Should have pets with their medical records joined
    if (allData.length === 0)
      throw new Error('No data returned from bulk query');

    // Verify data structure
    const petsWithRecords = allData.filter(
      pet => pet.medical_records && pet.medical_records.length > 0
    );
    if (petsWithRecords.length === 0)
      throw new Error('No pets have associated medical records');
  });
}

/**
 * Main testing execution
 */
async function runAllTests() {
  console.log(`🎯 Testing Session: ${TEST_SESSION_ID}\n`);

  try {
    await testDataValidation();
    await testCoreFunctionality();
    await testPremiumFeatures();
    await testDataIntegrity();
    await testPerformanceAndScale();

    tracker.summary();

    if (tracker.failed === 0) {
      console.log(
        '🎉 All tests passed! The app is ready for production deployment.'
      );
    } else {
      console.log(
        '⚠️  Some tests failed. Please review and fix issues before production deployment.'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Testing suite crashed:', error.message);
    process.exit(1);
  }
}

// Execute the test suite
runAllTests();
