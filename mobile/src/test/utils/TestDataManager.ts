import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockNotificationService } from '../mocks/NotificationMock';
import { mockStripeService } from '../mocks/StripeMock';
import { createMockSupabaseClient } from '../mocks/SupabaseMock';

// Comprehensive Test Data Management for TailTracker
export class TestDataManager {
  private static instance: TestDataManager;
  private supabaseMock: any;
  private testData: TestDataCollection = {};
  private originalConsoleWarn: any;
  private originalConsoleError: any;

  private constructor() {
    this.supabaseMock = createMockSupabaseClient();
    this.initializeTestData();
    this.suppressConsoleWarnings();
  }

  public static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  // Initialize default test data
  private initializeTestData() {
    this.testData = {
      users: this.createTestUsers(),
      pets: this.createTestPets(),
      lostPets: [],
      notifications: [],
      subscriptions: this.createTestSubscriptions(),
      paymentMethods: [],
      veterinarians: this.createTestVeterinarians(),
      careReminders: [],
      activities: [],
      locations: this.createTestLocations(),
    };
  }

  // Test Users
  private createTestUsers(): TestUser[] {
    return [
      {
        id: 'user-premium-1',
        email: 'premium@tailtracker.com',
        firstName: 'Premium',
        lastName: 'User',
        subscription_status: 'premium',
        push_token: 'ExponentPushToken[premium]',
        location: { lat: 37.7749, lng: -122.4194 }, // San Francisco
        created_at: '2023-01-01T00:00:00.000Z',
        avatar_url: 'https://example.com/avatars/premium.jpg',
        phone: '+1-555-0001',
        emergency_contact: '+1-555-0002',
      },
      {
        id: 'user-free-1',
        email: 'free@tailtracker.com',
        firstName: 'Free',
        lastName: 'User',
        subscription_status: 'free',
        push_token: null,
        location: { lat: 37.7849, lng: -122.4294 },
        created_at: '2023-01-15T00:00:00.000Z',
        avatar_url: null,
        phone: '+1-555-0003',
        emergency_contact: null,
      },
      {
        id: 'user-family-1',
        email: 'family@tailtracker.com',
        firstName: 'Family',
        lastName: 'User',
        subscription_status: 'family',
        push_token: 'ExponentPushToken[family]',
        location: { lat: 37.7949, lng: -122.4394 },
        created_at: '2023-02-01T00:00:00.000Z',
        avatar_url: 'https://example.com/avatars/family.jpg',
        phone: '+1-555-0004',
        emergency_contact: '+1-555-0005',
        family_members: ['user-family-2', 'user-family-3'],
      },
      {
        id: 'user-expired-1',
        email: 'expired@tailtracker.com',
        firstName: 'Expired',
        lastName: 'User',
        subscription_status: 'expired',
        push_token: 'ExponentPushToken[expired]',
        location: { lat: 37.8049, lng: -122.4494 },
        created_at: '2023-01-01T00:00:00.000Z',
        subscription_end_date: '2023-06-01T00:00:00.000Z',
        avatar_url: null,
        phone: '+1-555-0006',
        emergency_contact: null,
      },
    ];
  }

  // Test Pets
  private createTestPets(): TestPet[] {
    return [
      {
        id: 'pet-dog-1',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        weight: 30.5,
        gender: 'male',
        color: 'Golden',
        microchip_id: '123456789012345',
        created_by: 'user-premium-1',
        status: 'safe',
        photo_url: 'https://example.com/pets/buddy.jpg',
        vaccination_records: [
          {
            id: 'vacc-1',
            vaccine_name: 'Rabies',
            date_administered: '2023-01-15T00:00:00.000Z',
            next_due_date: '2024-01-15T00:00:00.000Z',
            veterinarian: 'vet-1',
          },
        ],
        medical_conditions: [],
        allergies: ['grass pollen'],
        medications: [],
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      },
      {
        id: 'pet-cat-1',
        name: 'Whiskers',
        species: 'cat',
        breed: 'Persian',
        age: 2,
        weight: 8.2,
        gender: 'female',
        color: 'White',
        microchip_id: '987654321098765',
        created_by: 'user-premium-1',
        status: 'safe',
        photo_url: 'https://example.com/pets/whiskers.jpg',
        vaccination_records: [
          {
            id: 'vacc-2',
            vaccine_name: 'FVRCP',
            date_administered: '2023-02-01T00:00:00.000Z',
            next_due_date: '2024-02-01T00:00:00.000Z',
            veterinarian: 'vet-1',
          },
        ],
        medical_conditions: ['Chronic Kidney Disease'],
        allergies: [],
        medications: [
          {
            name: 'Special Diet',
            dosage: 'As needed',
            frequency: 'Daily',
          },
        ],
        created_at: '2023-01-15T00:00:00.000Z',
        updated_at: '2023-01-15T00:00:00.000Z',
      },
      {
        id: 'pet-dog-2',
        name: 'Max',
        species: 'dog',
        breed: 'Labrador Mix',
        age: 5,
        weight: 25.0,
        gender: 'male',
        color: 'Black',
        microchip_id: '111222333444555',
        created_by: 'user-free-1',
        status: 'safe',
        photo_url: 'https://example.com/pets/max.jpg',
        vaccination_records: [],
        medical_conditions: [],
        allergies: [],
        medications: [],
        created_at: '2023-02-01T00:00:00.000Z',
        updated_at: '2023-02-01T00:00:00.000Z',
      },
    ];
  }

  // Test Subscriptions
  private createTestSubscriptions(): TestSubscription[] {
    return [
      {
        id: 'sub-premium-1',
        user_id: 'user-premium-1',
        plan: 'premium_monthly',
        status: 'active',
        current_period_start: '2023-08-01T00:00:00.000Z',
        current_period_end: '2023-09-01T00:00:00.000Z',
        cancel_at_period_end: false,
        stripe_subscription_id: 'sub_stripe_premium',
        stripe_customer_id: 'cus_premium',
        created_at: '2023-08-01T00:00:00.000Z',
      },
      {
        id: 'sub-family-1',
        user_id: 'user-family-1',
        plan: 'family_monthly',
        status: 'active',
        current_period_start: '2023-08-01T00:00:00.000Z',
        current_period_end: '2023-09-01T00:00:00.000Z',
        cancel_at_period_end: false,
        stripe_subscription_id: 'sub_stripe_family',
        stripe_customer_id: 'cus_family',
        created_at: '2023-08-01T00:00:00.000Z',
      },
      {
        id: 'sub-expired-1',
        user_id: 'user-expired-1',
        plan: 'premium_monthly',
        status: 'canceled',
        current_period_start: '2023-05-01T00:00:00.000Z',
        current_period_end: '2023-06-01T00:00:00.000Z',
        cancel_at_period_end: true,
        canceled_at: '2023-06-01T00:00:00.000Z',
        stripe_subscription_id: 'sub_stripe_expired',
        stripe_customer_id: 'cus_expired',
        created_at: '2023-05-01T00:00:00.000Z',
      },
    ];
  }

  // Test Veterinarians
  private createTestVeterinarians(): TestVeterinarian[] {
    return [
      {
        id: 'vet-1',
        name: 'Dr. Sarah Johnson',
        clinic_name: 'Happy Paws Veterinary Clinic',
        address: '123 Pet Street, San Francisco, CA 94102',
        phone: '+1-555-VET-CARE',
        email: 'dr.johnson@happypaws.com',
        website: 'https://happypaws.com',
        specialties: ['General Medicine', 'Surgery'],
        emergency_hours: true,
        location: { lat: 37.7849, lng: -122.4194 },
        rating: 4.8,
        reviews_count: 127,
      },
      {
        id: 'vet-2',
        name: 'Dr. Michael Chen',
        clinic_name: 'City Animal Hospital',
        address: '456 Main Ave, San Francisco, CA 94103',
        phone: '+1-555-ANIMALS',
        email: 'dr.chen@cityanimalhospital.com',
        website: 'https://cityanimalhospital.com',
        specialties: ['Dentistry', 'Cardiology'],
        emergency_hours: false,
        location: { lat: 37.7749, lng: -122.4094 },
        rating: 4.6,
        reviews_count: 89,
      },
    ];
  }

  // Test Locations
  private createTestLocations(): TestLocation[] {
    return [
      {
        id: 'loc-sf-park',
        name: 'Golden Gate Park',
        type: 'park',
        address: 'Golden Gate Park, San Francisco, CA',
        location: { lat: 37.7694, lng: -122.4862 },
        pet_friendly: true,
        amenities: ['Dog Park', 'Walking Trails', 'Water Fountains'],
      },
      {
        id: 'loc-sf-beach',
        name: 'Ocean Beach',
        type: 'beach',
        address: 'Ocean Beach, San Francisco, CA',
        location: { lat: 37.7594, lng: -122.5107 },
        pet_friendly: true,
        amenities: ['Off-Leash Area', 'Beach Access'],
      },
      {
        id: 'loc-emergency-vet',
        name: '24/7 Emergency Veterinary Clinic',
        type: 'veterinary',
        address: '789 Emergency Blvd, San Francisco, CA',
        location: { lat: 37.7849, lng: -122.4094 },
        pet_friendly: true,
        amenities: ['24/7 Service', 'Emergency Surgery', 'ICU'],
        hours: '24/7',
        phone: '+1-555-EMERGENCY',
      },
    ];
  }

  // Data Access Methods
  public getUser(userId?: string): TestUser | TestUser[] {
    if (userId) {
      const user = this.testData.users.find(u => u.id === userId);
      if (!user) {
        throw new Error(`Test user with ID ${userId} not found`);
      }
      return user;
    }
    return this.testData.users;
  }

  public getPremiumUser(): TestUser {
    return this.getUser('user-premium-1') as TestUser;
  }

  public getFreeUser(): TestUser {
    return this.getUser('user-free-1') as TestUser;
  }

  public getFamilyUser(): TestUser {
    return this.getUser('user-family-1') as TestUser;
  }

  public getExpiredUser(): TestUser {
    return this.getUser('user-expired-1') as TestUser;
  }

  public getPet(petId?: string): TestPet | TestPet[] {
    if (petId) {
      const pet = this.testData.pets.find(p => p.id === petId);
      if (!pet) {
        throw new Error(`Test pet with ID ${petId} not found`);
      }
      return pet;
    }
    return this.testData.pets;
  }

  public getDogPet(): TestPet {
    return this.getPet('pet-dog-1') as TestPet;
  }

  public getCatPet(): TestPet {
    return this.getPet('pet-cat-1') as TestPet;
  }

  public getVeterinarian(vetId?: string): TestVeterinarian | TestVeterinarian[] {
    if (vetId) {
      const vet = this.testData.veterinarians.find(v => v.id === vetId);
      if (!vet) {
        throw new Error(`Test veterinarian with ID ${vetId} not found`);
      }
      return vet;
    }
    return this.testData.veterinarians;
  }

  public getLocation(locationId?: string): TestLocation | TestLocation[] {
    if (locationId) {
      const location = this.testData.locations.find(l => l.id === locationId);
      if (!location) {
        throw new Error(`Test location with ID ${locationId} not found`);
      }
      return location;
    }
    return this.testData.locations;
  }

  // Data Creation Methods
  public createLostPetAlert(data: Partial<TestLostPet>): TestLostPet {
    const lostPet: TestLostPet = {
      id: `lost-pet-${Date.now()}`,
      pet_id: data.pet_id || 'pet-dog-1',
      reported_by: data.reported_by || 'user-premium-1',
      status: 'lost',
      last_seen_location: data.last_seen_location || { lat: 37.7749, lng: -122.4194 },
      last_seen_address: data.last_seen_address || 'Golden Gate Park, SF',
      last_seen_date: data.last_seen_date || new Date().toISOString(),
      description: data.description || 'Last seen playing fetch',
      reward_amount: data.reward_amount || 100,
      reward_currency: data.reward_currency || 'USD',
      contact_phone: data.contact_phone || '+1-555-0001',
      contact_email: data.contact_email || 'premium@tailtracker.com',
      photo_urls: data.photo_urls || ['https://example.com/lost-pet-photo.jpg'],
      search_radius_km: data.search_radius_km || 10,
      alert_sent_count: data.alert_sent_count || 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };

    this.testData.lostPets.push(lostPet);
    return lostPet;
  }

  public createCareReminder(data: Partial<TestCareReminder>): TestCareReminder {
    const reminder: TestCareReminder = {
      id: `reminder-${Date.now()}`,
      pet_id: data.pet_id || 'pet-dog-1',
      user_id: data.user_id || 'user-premium-1',
      title: data.title || 'Vaccination Due',
      description: data.description || 'Annual rabies vaccination is due',
      reminder_type: data.reminder_type || 'vaccination',
      due_date: data.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_completed: data.is_completed || false,
      notification_sent: data.notification_sent || false,
      repeat_interval: data.repeat_interval || 'yearly',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };

    this.testData.careReminders.push(reminder);
    return reminder;
  }

  // Mock Service Integration
  public setupSupabaseMocks() {
    // Pre-populate Supabase mock with test data
    this.supabaseMock.resetMockData();
    
    // Add test users
    this.testData.users.forEach(user => {
      this.supabaseMock.addMockUser(user);
    });

    // Add test pets
    this.testData.pets.forEach(pet => {
      this.supabaseMock.addMockPet(pet);
    });

    // Add lost pets
    this.testData.lostPets.forEach(lostPet => {
      this.supabaseMock.addMockLostPet(lostPet);
    });

    return this.supabaseMock;
  }

  public setupNotificationMocks() {
    mockNotificationService.reset();
    mockNotificationService.simulatePermissionGranted();
    return mockNotificationService;
  }

  public setupStripeMocks() {
    mockStripeService.reset();
    return mockStripeService;
  }

  // Test Environment Management
  public async setupTestEnvironment() {
    // Clear AsyncStorage
    await AsyncStorage.clear();

    // Set up mock services
    this.setupSupabaseMocks();
    this.setupNotificationMocks();
    this.setupStripeMocks();

    // Set default authenticated user
    await AsyncStorage.setItem('currentUser', JSON.stringify(this.getPremiumUser()));

    console.log('✅ Test environment setup complete');
  }

  public async cleanupTestEnvironment() {
    // Clear all AsyncStorage data
    await AsyncStorage.clear();

    // Reset all mocks
    this.supabaseMock.resetMockData();
    mockNotificationService.reset();
    mockStripeService.reset();

    // Reset test data to initial state
    this.initializeTestData();

    console.log('✅ Test environment cleanup complete');
  }

  // Scenario-specific setups
  public async setupLostPetScenario(): Promise<{
    user: TestUser;
    pet: TestPet;
    lostPetAlert: TestLostPet;
  }> {
    const user = this.getPremiumUser();
    const pet = this.getDogPet();
    const lostPetAlert = this.createLostPetAlert({
      pet_id: pet.id,
      reported_by: user.id,
    });

    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    
    // Mock notification for lost pet
    mockNotificationService.simulateLostPetAlert(pet);

    return { user, pet, lostPetAlert };
  }

  public async setupPaymentScenario(): Promise<{
    user: TestUser;
    paymentMethod: any;
    subscription: TestSubscription;
  }> {
    const user = this.getFreeUser(); // Start with free user
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));

    // Create mock payment method
    const paymentMethod = await mockStripeService.createPaymentMethod({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });

    // Create subscription
    const subscription = this.testData.subscriptions.find(s => s.plan === 'premium_monthly');
    if (!subscription) {
      throw new Error('Premium subscription not found in test data');
    }

    return { user, paymentMethod: paymentMethod.paymentMethod, subscription };
  }

  public async setupFamilyScenario(): Promise<{
    primaryUser: TestUser;
    familyMembers: TestUser[];
    pets: TestPet[];
  }> {
    const primaryUser = this.getFamilyUser();
    const familyMembers = this.testData.users.filter(u => 
      primaryUser.family_members?.includes(u.id)
    );
    const pets = this.testData.pets.filter(p => 
      p.created_by === primaryUser.id || familyMembers.some(fm => fm.id === p.created_by)
    );

    await AsyncStorage.setItem('currentUser', JSON.stringify(primaryUser));

    return { primaryUser, familyMembers, pets };
  }

  // Utility Methods
  private suppressConsoleWarnings() {
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;

    console.warn = (...args: any[]) => {
      const message = args[0];
      // Suppress known test warnings
      if (
        typeof message === 'string' &&
        (message.includes('ReactNativeFiberHostComponent') ||
         message.includes('componentWillReceiveProps') ||
         message.includes('Warning: React.createElement'))
      ) {
        return;
      }
      this.originalConsoleWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args[0];
      // Suppress known test errors
      if (
        typeof message === 'string' &&
        (message.includes('Warning: Failed prop type') ||
         message.includes('Warning: React.createElement'))
      ) {
        return;
      }
      this.originalConsoleError.apply(console, args);
    };
  }

  public restoreConsole() {
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn;
    }
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }
  }

  // Data validation helpers
  public validateTestData(): boolean {
    try {
      // Validate users have required fields
      this.testData.users.forEach(user => {
        if (!user.id || !user.email || !user.subscription_status) {
          throw new Error(`Invalid user data: ${user.id}`);
        }
      });

      // Validate pets have required fields
      this.testData.pets.forEach(pet => {
        if (!pet.id || !pet.name || !pet.species || !pet.created_by) {
          throw new Error(`Invalid pet data: ${pet.id}`);
        }
      });

      // Validate referential integrity
      this.testData.pets.forEach(pet => {
        const owner = this.testData.users.find(u => u.id === pet.created_by);
        if (!owner) {
          throw new Error(`Pet ${pet.id} references non-existent user ${pet.created_by}`);
        }
      });

      console.log('✅ Test data validation passed');
      return true;
    } catch (error) {
      console.error('❌ Test data validation failed:', error);
      return false;
    }
  }
}

// Type definitions for test data structures
interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscription_status: 'free' | 'premium' | 'family' | 'expired';
  push_token: string | null;
  location: { lat: number; lng: number };
  created_at: string;
  avatar_url: string | null;
  phone: string;
  emergency_contact: string | null;
  family_members?: string[];
  subscription_end_date?: string;
}

interface TestPet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  age: number;
  weight: number;
  gender: 'male' | 'female';
  color: string;
  microchip_id: string;
  created_by: string;
  status: 'safe' | 'lost' | 'found';
  photo_url: string;
  vaccination_records: any[];
  medical_conditions: string[];
  allergies: string[];
  medications: any[];
  created_at: string;
  updated_at: string;
}

interface TestLostPet {
  id: string;
  pet_id: string;
  reported_by: string;
  status: 'lost' | 'found';
  last_seen_location: { lat: number; lng: number };
  last_seen_address: string;
  last_seen_date: string;
  description: string;
  reward_amount: number;
  reward_currency: string;
  contact_phone: string;
  contact_email: string;
  photo_urls: string[];
  search_radius_km: number;
  alert_sent_count: number;
  created_at: string;
  updated_at: string;
  found_date?: string;
  found_by?: string;
}

interface TestSubscription {
  id: string;
  user_id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  created_at: string;
}

interface TestVeterinarian {
  id: string;
  name: string;
  clinic_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  specialties: string[];
  emergency_hours: boolean;
  location: { lat: number; lng: number };
  rating: number;
  reviews_count: number;
}

interface TestLocation {
  id: string;
  name: string;
  type: 'park' | 'beach' | 'veterinary' | 'store' | 'other';
  address: string;
  location: { lat: number; lng: number };
  pet_friendly: boolean;
  amenities: string[];
  hours?: string;
  phone?: string;
}

interface TestCareReminder {
  id: string;
  pet_id: string;
  user_id: string;
  title: string;
  description: string;
  reminder_type: 'vaccination' | 'medication' | 'checkup' | 'grooming' | 'other';
  due_date: string;
  is_completed: boolean;
  notification_sent: boolean;
  repeat_interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';
  created_at: string;
  updated_at: string;
}

interface TestDataCollection {
  users: TestUser[];
  pets: TestPet[];
  lostPets: TestLostPet[];
  notifications: any[];
  subscriptions: TestSubscription[];
  paymentMethods: any[];
  veterinarians: TestVeterinarian[];
  careReminders: TestCareReminder[];
  activities: any[];
  locations: TestLocation[];
}

// Export singleton instance
export const testDataManager = TestDataManager.getInstance();

// Export types for use in tests
export type {
  TestUser,
  TestPet,
  TestLostPet,
  TestSubscription,
  TestVeterinarian,
  TestLocation,
  TestCareReminder,
  TestDataCollection,
};