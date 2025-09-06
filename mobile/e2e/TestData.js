const TestData = {
  users: {
    testUser: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@tailtracker.com',
      password: 'TestPassword123!'
    },
    adminUser: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@tailtracker.com',
      password: 'AdminPassword123!'
    }
  },
  
  pets: {
    testDog: {
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 3,
      weight: 65,
      color: 'Golden',
      microchipId: 'TEST123456789',
      description: 'Friendly golden retriever, loves playing fetch'
    },
    testCat: {
      name: 'Whiskers',
      species: 'Cat',
      breed: 'Maine Coon',
      age: 2,
      weight: 12,
      color: 'Gray',
      microchipId: 'TEST987654321',
      description: 'Indoor cat, very social and loves treats'
    }
  },

  locations: {
    home: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Test Street, San Francisco, CA'
    },
    park: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: 'Golden Gate Park, San Francisco, CA'
    }
  },

  medications: {
    heartguard: {
      name: 'Heartguard Plus',
      dosage: '1 tablet',
      frequency: 'Monthly',
      instructions: 'Give with food'
    }
  },

  safeZones: {
    home: {
      name: 'Home',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 100,
      type: 'home'
    },
    dogPark: {
      name: 'Dog Park',
      latitude: 37.7849,
      longitude: -122.4094,
      radius: 50,
      type: 'recreation'
    }
  },

  emergencyContacts: {
    vet: {
      name: 'Test Veterinary Clinic',
      phone: '+1-555-VET-HELP',
      address: '456 Vet Street, San Francisco, CA',
      type: 'veterinarian'
    },
    emergency: {
      name: 'Emergency Animal Hospital',
      phone: '+1-555-EMERGENCY',
      address: '789 Emergency Blvd, San Francisco, CA',
      type: 'emergency'
    }
  }
};

module.exports = TestData;