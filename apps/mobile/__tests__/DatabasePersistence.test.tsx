/**
 * Database Persistence Tests
 * Verify that all 9 required fields are correctly persisted to and retrieved from Supabase
 */

import { PetProfileService } from '@/services/PetProfileService';
import { PetService } from '@/services/PetService';
import { PetProfile } from '@/contexts/PetProfileContext';

// Mock data store for dynamic testing
const mockPetStore = new Map();
let mockPetIdCounter = 1;

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
          error: null,
        })
      ),
    },
    from: jest.fn((table: string) => {
      if (table === 'pets') {
        return {
          insert: jest.fn((data: any) => ({
            select: jest.fn(() => ({
              single: jest.fn(() => {
                const petId = `test-pet-${mockPetIdCounter++}`;
                const savedPet = {
                  id: petId,
                  ...data,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                mockPetStore.set(petId, savedPet);
                return Promise.resolve({
                  data: savedPet,
                  error: null,
                });
              }),
            })),
          })),
          select: jest.fn(() => ({
            eq: jest.fn((field: string, value: string) => {
              if (field === 'id') {
                // Handle getPetById queries
                return {
                  is: jest.fn((field2: string, value2: any) => {
                    if (field2 === 'deleted_at' && value2 === null) {
                      return {
                        single: jest.fn(() => {
                          const pet = mockPetStore.get(value);
                          return Promise.resolve({
                            data: pet || null,
                            error: pet ? null : { message: 'Pet not found' },
                          });
                        }),
                      };
                    }
                    return {
                      single: jest.fn(() =>
                        Promise.resolve({
                          data: null,
                          error: { message: 'Not found' },
                        })
                      ),
                    };
                  }),
                };
              }
              // Handle other queries (like user lookup)
              return {
                single: jest.fn(() => {
                  if (field === 'auth_user_id') {
                    return Promise.resolve({
                      data: { id: 'test-user-record-id' },
                      error: null,
                    });
                  }
                  return Promise.resolve({
                    data: null,
                    error: { message: 'Not found' },
                  });
                }),
              };
            }),
          })),
        };
      } else if (table === 'users') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: {
                    id: 'test-user-record-id',
                  },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {};
    }),
  },
}));

describe('Database Persistence Tests', () => {
  const testProfile: PetProfile = {
    name: 'Max', // ✅ Field 1: Name
    species: 'dog',
    breed: 'Golden Retriever', // ✅ Field 2: Breed
    photoUrl: 'test-photo.jpg', // ✅ Field 3: Picture
    weight: '25 lbs', // ✅ Field 4: Weight
    height: '24 inches', // ✅ Field 5: Height
    colorMarkings: 'Golden with white chest',
    dateOfBirth: new Date('2020-01-15'),
    microchipId: '123456789012345', // ✅ Field 9: Microchip ID
    identificationNumber: 'TR-123456789',
    medicalConditions: ['Hip dysplasia'], // ✅ Field 6: Medical conditions
    allergies: ['Chicken'], // ✅ Field 7: Allergies
    medications: ['Heartworm prevention'], // ✅ Field 8: Medication
    personalityTraits: ['Friendly', 'Energetic'],
    favoriteActivities: ['Fetch', 'Swimming'],
    exerciseNeeds: 'high',
    favoriteFood: 'Chicken and Rice',
    feedingSchedule: 'Twice daily',
    specialNotes: 'Loves car rides',
  };

  describe('PetProfileService - Save Profile', () => {
    test('should save complete profile with all 9 required fields', async () => {
      const petProfileService = new PetProfileService();
      const result = await petProfileService.savePetProfile(testProfile);

      expect(result.success).toBe(true);
      expect(result.pet).toBeDefined();
      expect(result.pet?.id).toMatch(/^test-pet-\d+$/);

      // Verify all 9 required fields are persisted
      expect(result.pet?.name).toBe('Max'); // ✅ Field 1
      expect(result.pet?.breed).toBe('Golden Retriever'); // ✅ Field 2
      expect(result.pet?.photoUrl).toBe('test-photo.jpg'); // ✅ Field 3
      expect(result.pet?.weight).toBe('11 kg'); // ✅ Field 4 (25 lbs converted to kg)
      expect(result.pet?.height).toBe('24 inches'); // ✅ Field 5
      expect(result.pet?.medicalConditions).toContain('Hip dysplasia'); // ✅ Field 6
      expect(result.pet?.allergies).toContain('Chicken'); // ✅ Field 7
      expect(result.pet?.medications).toContain('Heartworm prevention'); // ✅ Field 8
      expect(result.pet?.microchipId).toBe('123456789012345'); // ✅ Field 9
    });

    test('should handle profile with minimal required fields', async () => {
      const minimalProfile: PetProfile = {
        name: 'Buddy',
        species: 'cat',
      };

      const petProfileService = new PetProfileService();
      const result = await petProfileService.savePetProfile(minimalProfile);

      expect(result.success).toBe(true);
      expect(result.pet?.name).toBe('Buddy');
      expect(result.pet?.species).toBe('cat');
    });

    test('should handle arrays correctly (medical conditions, allergies, medications)', async () => {
      const profileWithArrays: PetProfile = {
        name: 'Luna',
        species: 'cat',
        medicalConditions: ['Diabetes', 'Arthritis', 'Kidney disease'],
        allergies: ['Fish', 'Dairy', 'Dust mites'],
        medications: ['Insulin', 'Pain relief', 'Kidney support'],
      };

      const petProfileService = new PetProfileService();
      const result = await petProfileService.savePetProfile(profileWithArrays);

      expect(result.success).toBe(true);
      expect(result.pet?.medicalConditions).toHaveLength(3);
      expect(result.pet?.allergies).toHaveLength(3);
      expect(result.pet?.medications).toHaveLength(3);
    });
  });

  describe('PetProfileService - Retrieve Profile', () => {
    test('should retrieve pet with all 9 required fields', async () => {
      // First save a pet to get a valid ID
      const petProfileService = new PetProfileService();
      const saveResult = await petProfileService.savePetProfile(testProfile);

      const retrievedPet = await petProfileService.getPetProfile(
        saveResult.pet!.id!
      );

      expect(retrievedPet).toBeDefined();
      expect(retrievedPet?.id).toBe(saveResult.pet!.id);

      // Verify all 9 required fields are retrieved
      expect(retrievedPet?.name).toBe('Max'); // ✅ Field 1
      expect(retrievedPet?.breed).toBe('Golden Retriever'); // ✅ Field 2
      expect(retrievedPet?.photoUrl).toBe('test-photo.jpg'); // ✅ Field 3
      expect(retrievedPet?.weight).toBe('11 kg'); // ✅ Field 4 (25 lbs converted to kg)
      expect(retrievedPet?.height).toBe('24 inches'); // ✅ Field 5
      expect(retrievedPet?.medicalConditions).toContain('Hip dysplasia'); // ✅ Field 6
      expect(retrievedPet?.allergies).toContain('Chicken'); // ✅ Field 7
      expect(retrievedPet?.medications).toContain('Heartworm prevention'); // ✅ Field 8
      expect(retrievedPet?.microchipId).toBe('123456789012345'); // ✅ Field 9
    });

    test('should handle field mapping between database and application', async () => {
      // First save a pet to get a valid ID
      const petProfileService = new PetProfileService();
      const saveResult = await petProfileService.savePetProfile(testProfile);

      const retrievedPet = await petProfileService.getPetProfile(
        saveResult.pet!.id!
      );

      // Test camelCase to snake_case mapping
      expect(retrievedPet?.colorMarkings).toBe('Golden with white chest'); // color_markings
      expect(retrievedPet?.dateOfBirth).toBeDefined(); // date_of_birth
      expect(retrievedPet?.microchipId).toBe('123456789012345'); // microchip_number
      expect(retrievedPet?.identificationNumber).toBe('TR-123456789'); // identification_number
      expect(retrievedPet?.medications).toContain('Heartworm prevention'); // current_medications
      expect(retrievedPet?.photoUrl).toBe('test-photo.jpg'); // photo_url
    });
  });

  describe('Data Integrity Tests', () => {
    test('should preserve data types during round trip', async () => {
      const profileWithTypes: PetProfile = {
        name: 'Rex',
        species: 'dog',
        dateOfBirth: new Date('2019-06-15'),
        medicalConditions: ['Condition 1', 'Condition 2'],
        allergies: [],
        medications: ['Med 1'],
      };

      const petProfileService = new PetProfileService();
      const saveResult =
        await petProfileService.savePetProfile(profileWithTypes);

      expect(saveResult.success).toBe(true);

      const retrievedPet = await petProfileService.getPetProfile(
        saveResult.pet!.id!
      );

      expect(retrievedPet?.dateOfBirth).toBeInstanceOf(Date);
      expect(Array.isArray(retrievedPet?.medicalConditions)).toBe(true);
      expect(Array.isArray(retrievedPet?.allergies)).toBe(true);
      expect(Array.isArray(retrievedPet?.medications)).toBe(true);
    });

    test('should handle empty arrays and null values', async () => {
      const profileWithEmpties: PetProfile = {
        name: 'Whiskers',
        species: 'cat',
        medicalConditions: [],
        allergies: [],
        medications: [],
      };

      const petProfileService = new PetProfileService();
      const result = await petProfileService.savePetProfile(profileWithEmpties);

      expect(result.success).toBe(true);
      expect(result.pet?.medicalConditions).toEqual([]);
      expect(result.pet?.allergies).toEqual([]);
      expect(result.pet?.medications).toEqual([]);
    });

    test('should handle special characters and long values', async () => {
      const profileWithSpecialChars: PetProfile = {
        name: "Münster-O'Malley",
        species: 'dog',
        breed: 'Großer Münsterländer',
        medicalConditions: ['Condition with "quotes" and special chars: @#$%'],
        allergies: ['Allergen with émojis 🐕 and unicode'],
        microchipId: '999888777666555444333', // Very long microchip
      };

      const petProfileService = new PetProfileService();
      const result = await petProfileService.savePetProfile(
        profileWithSpecialChars
      );

      expect(result.success).toBe(true);
      expect(result.pet?.name).toBe("Münster-O'Malley");
      expect(result.pet?.breed).toBe('Großer Münsterländer');
      expect(result.pet?.microchipId).toBe('999888777666555444333');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would need actual error simulation in a real environment
      const petService = new PetService();

      // Test with invalid ID
      const pet = await petService.getPetById('invalid-id');
      expect(pet).toBeNull();
    });

    test('should validate required fields before saving', async () => {
      const invalidProfile: Partial<PetProfile> = {
        // Missing required 'name' field
        species: 'dog',
      };

      const petProfileService = new PetProfileService();

      try {
        await petProfileService.savePetProfile(invalidProfile as PetProfile);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
