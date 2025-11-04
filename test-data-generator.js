#!/usr/bin/env node

/**
 * TailTracker Test Data Generator
 * Creates comprehensive test data for manual testing of all app features
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://tkcajpwdlsavqfqhdawy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2FqcHdkbHNhdnFmcWhkYXd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ1ODAxNSwiZXhwIjoyMDcyMDM0MDE1fQ.NA_3G3RXr7nq_4iKDhPp1Cb2pojSHrOFtv5Jl9Fs570';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Generate unique session ID for anonymous testing
const TEST_SESSION_ID = `test_session_${Date.now()}`;

console.log(`🧪 Starting TailTracker Test Data Generation`);
console.log(`📱 Anonymous Session ID: ${TEST_SESSION_ID}`);

/**
 * Test data templates
 */
const TEST_PETS = [
  {
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    date_of_birth: '2020-05-15',
    weight_kg: 28.5,
    color_markings: 'Golden coat with white chest',
    personality_traits: ['friendly', 'energetic', 'loyal'],
    favorite_activities: ['fetch', 'swimming', 'walking'],
    exercise_needs: 'high',
    favorite_food: 'chicken and rice',
    microchip_number: '123456789012345',
    medical_conditions: ['hip_dysplasia'],
    current_medications: ['glucosamine'],
    special_notes: 'Loves children and other dogs',
  },
  {
    name: 'Whiskers',
    species: 'cat',
    breed: 'Maine Coon',
    gender: 'female',
    date_of_birth: '2019-08-22',
    weight_kg: 6.2,
    color_markings: 'Brown tabby with white paws',
    personality_traits: ['independent', 'curious', 'affectionate'],
    favorite_activities: ['climbing', 'hunting', 'napping'],
    exercise_needs: 'moderate',
    favorite_food: 'salmon',
    microchip_number: '987654321098765',
    medical_conditions: [],
    current_medications: [],
    special_notes: 'Indoor cat, afraid of loud noises',
  },
  {
    name: 'Charlie',
    species: 'bird',
    breed: 'African Grey Parrot',
    gender: 'male',
    date_of_birth: '2018-03-10',
    weight_kg: 0.5,
    color_markings: 'Grey with red tail feathers',
    personality_traits: ['intelligent', 'talkative', 'social'],
    favorite_activities: ['talking', 'puzzle_solving', 'flying'],
    exercise_needs: 'moderate',
    favorite_food: 'sunflower seeds',
    medical_conditions: [],
    current_medications: [],
    special_notes: 'Knows over 50 words, very intelligent',
  },
];

const TEST_MEDICAL_RECORDS = [
  {
    record_type: 'checkup',
    title: 'Annual Health Checkup',
    description: 'Routine annual examination and vaccinations',
    date_of_record: '2024-09-15',
    diagnosis: 'Healthy, minor dental tartar',
    treatment: 'Dental cleaning recommended',
    cost: 125.0,
    follow_up_required: true,
    follow_up_date: '2025-03-15',
  },
  {
    record_type: 'vaccination',
    title: 'Rabies Vaccination',
    description: 'Annual rabies vaccination',
    date_of_record: '2024-09-15',
    diagnosis: 'Vaccination administered',
    treatment: 'Rabies vaccine - 1 year validity',
    cost: 45.0,
    follow_up_required: true,
    follow_up_date: '2025-09-15',
  },
  {
    record_type: 'emergency',
    title: 'Minor Cut Treatment',
    description: 'Small cut on paw from broken glass',
    date_of_record: '2024-08-22',
    diagnosis: 'Superficial laceration',
    treatment: 'Wound cleaning and bandaging',
    cost: 85.0,
    follow_up_required: false,
  },
];

const TEST_VACCINATIONS = [
  {
    vaccine_name: 'Rabies',
    administered_date: '2024-09-15',
    next_due_date: '2026-09-15',
    batch_number: 'RB2024-789',
    notes: 'Annual rabies vaccination - no adverse reactions',
  },
  {
    vaccine_name: 'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
    administered_date: '2024-09-15',
    next_due_date: '2026-09-15',
    batch_number: 'DHPP2024-456',
    notes: 'Core vaccination series - patient tolerates well',
  },
  {
    vaccine_name: 'Bordetella',
    administered_date: '2024-06-10',
    next_due_date: '2026-06-10',
    batch_number: 'BOR2024-123',
    notes: 'Kennel cough prevention - 6 month vaccine',
  },
];

const TEST_MEDICATIONS = [
  {
    medication_name: 'Glucosamine Chondroitin',
    dosage: '500mg',
    frequency: 'Once daily',
    start_date: '2024-07-01',
    end_date: null,
    instructions: 'Give with food to prevent stomach upset',
    side_effects: 'None observed',
    active: true,
  },
  {
    medication_name: 'Omega-3 Fish Oil',
    dosage: '1000mg',
    frequency: 'Twice daily',
    start_date: '2024-08-01',
    end_date: null,
    instructions: 'Can be mixed with food',
    side_effects: 'None',
    active: true,
  },
];

/**
 * Create test pets with anonymous session
 */
async function createTestPets() {
  console.log('🐕 Creating test pets...');

  const createdPets = [];

  for (const petData of TEST_PETS) {
    const { data, error } = await supabase
      .from('pets')
      .insert({
        ...petData,
        anonymous_session_id: TEST_SESSION_ID,
        user_id: null, // Anonymous user
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating pet ${petData.name}:`, error);
    } else {
      console.log(`✅ Created pet: ${data.name} (${data.species})`);
      createdPets.push(data);
    }
  }

  return createdPets;
}

/**
 * Create medical records for test pets
 */
async function createTestMedicalRecords(pets) {
  console.log('🏥 Creating test medical records...');

  for (const pet of pets) {
    for (const recordData of TEST_MEDICAL_RECORDS) {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          ...recordData,
          pet_id: pet.id,
          anonymous_session_id: TEST_SESSION_ID,
          created_by: null, // Anonymous user
        })
        .select()
        .single();

      if (error) {
        console.error(
          `❌ Error creating medical record for ${pet.name}:`,
          error
        );
      } else {
        console.log(`✅ Created medical record: ${data.title} for ${pet.name}`);
      }
    }
  }
}

/**
 * Create vaccinations for test pets
 */
async function createTestVaccinations(pets) {
  console.log('💉 Creating test vaccinations...');

  // Only create vaccinations for dogs and cats
  const eligiblePets = pets.filter(pet => ['dog', 'cat'].includes(pet.species));

  for (const pet of eligiblePets) {
    for (const vaccinationData of TEST_VACCINATIONS) {
      const { data, error } = await supabase
        .from('vaccinations')
        .insert({
          ...vaccinationData,
          pet_id: pet.id,
          anonymous_session_id: TEST_SESSION_ID,
          created_by: null, // Anonymous user
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating vaccination for ${pet.name}:`, error);
      } else {
        console.log(
          `✅ Created vaccination: ${data.vaccine_name} for ${pet.name}`
        );
      }
    }
  }
}

/**
 * Create medications for test pets
 */
async function createTestMedications(pets) {
  console.log('💊 Creating test medications...');

  // Only create medications for pets with medical conditions
  const petsWithConditions = pets.filter(
    pet => pet.medical_conditions && pet.medical_conditions.length > 0
  );

  for (const pet of petsWithConditions) {
    for (const medicationData of TEST_MEDICATIONS) {
      const { data, error } = await supabase
        .from('medications')
        .insert({
          ...medicationData,
          pet_id: pet.id,
          anonymous_session_id: TEST_SESSION_ID,
          created_by: null, // Anonymous user
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating medication for ${pet.name}:`, error);
      } else {
        console.log(
          `✅ Created medication: ${data.medication_name} for ${pet.name}`
        );
      }
    }
  }
}

/**
 * Create a test lost pet alert
 */
async function createTestLostPetAlert(pets) {
  console.log('🚨 Creating test lost pet alert...');

  if (pets.length === 0) return;

  const testPet = pets[0]; // Use first pet for lost pet test

  const { data, error } = await supabase
    .from('lost_pets')
    .insert({
      pet_id: testPet.id,
      reported_by: null, // Anonymous user
      status: 'lost',
      last_seen_address: '123 Test Street, Test City, Test State',
      last_seen_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      description:
        'Lost during evening walk, very friendly and responds to name',
      reward_amount: 100.0,
      reward_currency: 'USD',
      contact_phone: '+1-555-0123',
      contact_email: 'test@example.com',
      search_radius_km: 5,
      anonymous_session_id: TEST_SESSION_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating lost pet alert:', error);
  } else {
    console.log(`✅ Created lost pet alert for ${testPet.name}`);
  }
}

/**
 * Main execution function
 */
async function generateTestData() {
  try {
    console.log('🚀 Starting test data generation...\n');

    // Create pets first
    const pets = await createTestPets();

    if (pets.length === 0) {
      console.error('❌ No pets created, stopping data generation');
      return;
    }

    // Create associated data
    await createTestMedicalRecords(pets);
    await createTestVaccinations(pets);
    await createTestMedications(pets);
    await createTestLostPetAlert(pets);

    console.log('\n✅ Test data generation completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`   • ${pets.length} test pets created`);
    console.log(
      `   • ${TEST_MEDICAL_RECORDS.length * pets.length} medical records created`
    );
    console.log(
      `   • ${TEST_VACCINATIONS.length * pets.filter(p => ['dog', 'cat'].includes(p.species)).length} vaccinations created`
    );
    console.log(
      `   • ${TEST_MEDICATIONS.length * pets.filter(p => p.medical_conditions?.length > 0).length} medications created`
    );
    console.log(`   • 1 lost pet alert created`);
    console.log(`\n🔑 Anonymous Session ID: ${TEST_SESSION_ID}`);
    console.log(
      `\n🧪 Ready for testing! Use this session ID in the app for anonymous testing.`
    );
  } catch (error) {
    console.error('❌ Error during test data generation:', error);
  }
}

/**
 * Cleanup function to remove all test data
 */
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');

  try {
    // Delete in reverse order due to foreign key constraints
    await supabase
      .from('lost_pets')
      .delete()
      .eq('anonymous_session_id', TEST_SESSION_ID);
    await supabase
      .from('medications')
      .delete()
      .eq('anonymous_session_id', TEST_SESSION_ID);
    await supabase
      .from('vaccinations')
      .delete()
      .eq('anonymous_session_id', TEST_SESSION_ID);
    await supabase
      .from('medical_records')
      .delete()
      .eq('anonymous_session_id', TEST_SESSION_ID);
    await supabase
      .from('pets')
      .delete()
      .eq('anonymous_session_id', TEST_SESSION_ID);

    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'cleanup') {
  cleanupTestData();
} else if (command === 'generate' || !command) {
  generateTestData();
} else {
  console.log('Usage: node test-data-generator.js [generate|cleanup]');
  console.log('  generate (default): Create test data');
  console.log('  cleanup: Remove test data');
}
