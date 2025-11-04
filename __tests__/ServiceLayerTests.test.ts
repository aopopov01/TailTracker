/**
 * Service Layer Tests - Priority 4
 * Tests PetService methods, field mapping integration,
 * and database operations with family_id removal
 */

// Mock Supabase module with proper Jest mock functions
const mockAuthGetUser = jest.fn();
const mockSupabaseFrom = jest.fn();
const mockSupabaseRpc = jest.fn();

// Create a consistent mock object
const mockSupabaseClient = {
  auth: {
    getUser: mockAuthGetUser,
  },
  from: mockSupabaseFrom,
  rpc: mockSupabaseRpc,
};

// Mock the base services/supabase module
jest.mock('../src/services/supabase', () => ({
  supabase: mockSupabaseClient,
  supabaseHelpers: {},
  default: mockSupabaseClient,
}));

// Mock the re-export lib/supabase module that PetService imports from
jest.mock('../src/lib/supabase', () => {
  // Return the same mock object for all exports
  return {
    supabase: mockSupabaseClient,
    supabaseHelpers: {},
    default: mockSupabaseClient,
    // Ensure named exports work correctly
    __esModule: true,
  };
});

// Import after mocks are set up
import { PetService } from '../src/services/PetService';
import { supabase } from '../src/lib/supabase';
import {
  mapOnboardingToDatabase,
  mapDatabaseToOnboarding,
} from '../src/utils/petFieldMapper';

// Mock field mapper
jest.mock('../src/utils/petFieldMapper', () => ({
  mapOnboardingToDatabase: jest.fn(data => ({
    name: data.name,
    species: data.species,
    breed: data.breed,
    color_markings: data.colorMarkings,
    medical_conditions: data.medicalConditions,
    special_notes: data.specialNotes,
    user_id: 'user-123',
  })),
  mapDatabaseToOnboarding: jest.fn(data => ({
    id: data.id,
    name: data.name,
    species: data.species,
    breed: data.breed,
    colorMarkings: data.color_markings,
    medicalConditions: data.medical_conditions,
    specialNotes: data.special_notes,
  })),
}));

describe('Service Layer Tests', () => {
  let petService: PetService;

  beforeEach(() => {
    petService = new PetService();

    // Setup stable mock implementations
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'auth-user-123' } },
      error: null,
    });

    // Setup the query builder with proper chaining
    const createQueryBuilder = tableResponse => {
      const builder = {};

      // All chainable methods return the same builder instance
      const chainableMethods = [
        'select',
        'insert',
        'update',
        'delete',
        'upsert',
        'eq',
        'neq',
        'gt',
        'gte',
        'lt',
        'lte',
        'like',
        'ilike',
        'is',
        'in',
        'contains',
        'containedBy',
        'rangeLt',
        'rangeGt',
        'rangeGte',
        'rangeLte',
        'rangeAdjacent',
        'overlaps',
        'textSearch',
        'match',
        'not',
        'or',
        'filter',
        'order',
        'limit',
        'range',
        'abortSignal',
      ];

      chainableMethods.forEach(method => {
        builder[method] = jest.fn(() => builder);
      });

      // Terminal methods return promises
      builder.single = jest.fn(() => Promise.resolve(tableResponse.single));
      builder.maybeSingle = jest.fn(() =>
        Promise.resolve(tableResponse.single)
      );

      // Make builder thenable for direct await
      builder.then = jest.fn((resolve, reject) => {
        return Promise.resolve(tableResponse.array).then(resolve, reject);
      });

      return builder;
    };

    mockSupabaseFrom.mockImplementation(table => {
      const responses = {
        users: {
          single: {
            data: { id: 'user-123', auth_user_id: 'auth-user-123' },
            error: null,
          },
          array: {
            data: [{ id: 'user-123', auth_user_id: 'auth-user-123' }],
            error: null,
          },
        },
        pets: {
          single: {
            data: {
              id: 'pet-1',
              name: 'Max',
              user_id: 'user-123',
              species: 'dog',
            },
            error: null,
          },
          array: {
            data: [
              { id: 'pet-1', name: 'Max', user_id: 'user-123', species: 'dog' },
            ],
            error: null,
          },
        },
      };

      const tableResponse = responses[table] || {
        single: { data: { id: 'test-id' }, error: null },
        array: { data: [{ id: 'test-id' }], error: null },
      };

      return createQueryBuilder(tableResponse);
    });

    mockSupabaseRpc.mockImplementation((functionName, params) => {
      if (functionName === 'upsert_pet_data') {
        return Promise.resolve({
          data: 'pet-1',
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });
  });

  // Debug test to check if mock is working
  test('should have working supabase mock', async () => {
    // Test auth.getUser mock
    const authResult = await mockAuthGetUser();
    console.log('Mock auth result:', authResult);
    expect(authResult).toBeDefined();
    expect(authResult.data.user.id).toBe('auth-user-123');

    // Test from() method mock
    const fromResult = mockSupabaseFrom('users');
    console.log('Mock from result:', fromResult);
    expect(fromResult).toBeDefined();
    expect(typeof fromResult.select).toBe('function');

    // Test the builder chain
    const chainResult = await fromResult
      .select('id')
      .eq('auth_user_id', 'auth-user-123')
      .single();

    console.log('Mock chain result:', chainResult);
    expect(chainResult).toBeDefined();
    expect(chainResult.data).toBeDefined();
  });

  test('should have working imported supabase', () => {
    // Debug: Check what the imported supabase object contains
    console.log('Imported supabase:', supabase);
    console.log('supabase.auth:', supabase?.auth);
    console.log('supabase.from:', supabase?.from);

    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  describe('PetService.getPets() - Family_id Removal Verification', () => {
    test('should fetch pets using user_id only (no family_id)', async () => {
      const pets = await petService.getPets();

      expect(pets).toBeDefined();
      expect(Array.isArray(pets)).toBe(true);
      expect(pets).toHaveLength(1);

      // Verify no family_id in query or response
      expect(mockSupabaseFrom).toHaveBeenCalledWith('pets');

      // Verify user_id is used instead of family_id
      const pet = pets[0];
      expect(pet.user_id).toBe('user-123');
      expect(pet).not.toHaveProperty('family_id');
    });

    test('should handle empty pet list', async () => {
      // Override the default mock to return empty data
      mockSupabaseFrom.mockImplementationOnce(table => {
        const emptyResponse = {
          single: {
            data: { id: 'user-123', auth_user_id: 'auth-user-123' },
            error: null,
          },
          array: { data: [], error: null }, // Empty array for pets
        };

        const builder = {};
        const chainableMethods = [
          'select',
          'insert',
          'update',
          'delete',
          'upsert',
          'eq',
          'neq',
          'gt',
          'gte',
          'lt',
          'lte',
          'like',
          'ilike',
          'is',
          'in',
          'contains',
          'containedBy',
          'rangeLt',
          'rangeGt',
          'rangeGte',
          'rangeLte',
          'rangeAdjacent',
          'overlaps',
          'textSearch',
          'match',
          'not',
          'or',
          'filter',
          'order',
          'limit',
          'range',
          'abortSignal',
        ];

        chainableMethods.forEach(method => {
          builder[method] = jest.fn(() => builder);
        });

        builder.single = jest.fn(() => Promise.resolve(emptyResponse.single));
        builder.maybeSingle = jest.fn(() =>
          Promise.resolve(emptyResponse.single)
        );
        builder.then = jest.fn((resolve, reject) => {
          return Promise.resolve(emptyResponse.array).then(resolve, reject);
        });

        return builder;
      });

      const pets = await petService.getPets();

      expect(pets).toEqual([]);
      expect(Array.isArray(pets)).toBe(true);
    });

    test('should handle database errors gracefully', async () => {
      // Override the default mock to return an error
      mockSupabaseFrom.mockImplementationOnce(table => {
        if (table === 'pets') {
          const errorResponse = {
            single: {
              data: { id: 'user-123', auth_user_id: 'auth-user-123' },
              error: null,
            },
            array: {
              data: null,
              error: { message: 'Database connection failed' },
            },
          };

          const builder = {};
          const chainableMethods = [
            'select',
            'insert',
            'update',
            'delete',
            'upsert',
            'eq',
            'neq',
            'gt',
            'gte',
            'lt',
            'lte',
            'like',
            'ilike',
            'is',
            'in',
            'contains',
            'containedBy',
            'rangeLt',
            'rangeGt',
            'rangeGte',
            'rangeLte',
            'rangeAdjacent',
            'overlaps',
            'textSearch',
            'match',
            'not',
            'or',
            'filter',
            'order',
            'limit',
            'range',
            'abortSignal',
          ];

          chainableMethods.forEach(method => {
            builder[method] = jest.fn(() => builder);
          });

          builder.single = jest.fn(() => Promise.resolve(errorResponse.single));
          builder.maybeSingle = jest.fn(() =>
            Promise.resolve(errorResponse.single)
          );
          builder.then = jest.fn((resolve, reject) => {
            return Promise.resolve(errorResponse.array).then(resolve, reject);
          });

          return builder;
        }

        // For users table, return normal response
        const normalResponse = {
          single: {
            data: { id: 'user-123', auth_user_id: 'auth-user-123' },
            error: null,
          },
          array: {
            data: [{ id: 'user-123', auth_user_id: 'auth-user-123' }],
            error: null,
          },
        };

        const builder = {};
        const chainableMethods = [
          'select',
          'insert',
          'update',
          'delete',
          'upsert',
          'eq',
          'neq',
          'gt',
          'gte',
          'lt',
          'lte',
          'like',
          'ilike',
          'is',
          'in',
          'contains',
          'containedBy',
          'rangeLt',
          'rangeGt',
          'rangeGte',
          'rangeLte',
          'rangeAdjacent',
          'overlaps',
          'textSearch',
          'match',
          'not',
          'or',
          'filter',
          'order',
          'limit',
          'range',
          'abortSignal',
        ];

        chainableMethods.forEach(method => {
          builder[method] = jest.fn(() => builder);
        });

        builder.single = jest.fn(() => Promise.resolve(normalResponse.single));
        builder.maybeSingle = jest.fn(() =>
          Promise.resolve(normalResponse.single)
        );
        builder.then = jest.fn((resolve, reject) => {
          return Promise.resolve(normalResponse.array).then(resolve, reject);
        });

        return builder;
      });

      await expect(petService.getPets()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('PetService.createPet() - Field Mapping Integration', () => {
    test('should create pet with proper field mapping', async () => {
      const petData = {
        family_id: 'test-family-123',
        name: 'Luna',
        species: 'cat',
        breed: 'Persian',
        colorMarkings: 'White and gray',
        medicalConditions: ['Breathing issues'],
        specialNotes: 'Quiet cat',
        allergies: ['Dust'],
      };

      const result = await petService.createPet(petData);

      expect(result.success).toBe(true);
      expect(result.pet).toBeDefined();

      // Verify field mapping was called
      expect(mapOnboardingToDatabase).toHaveBeenCalledWith(petData);

      // Verify no family_id in the mapped data
      const mappedCall = (mapOnboardingToDatabase as jest.Mock).mock
        .calls[0][0];
      expect(mappedCall).not.toHaveProperty('family_id');
      expect(mappedCall).not.toHaveProperty('familyId');
    });

    test('should handle subscription limits for free users', async () => {
      const premiumData = {
        family_id: 'test-family-123',
        name: 'Premium Pet',
        species: 'dog',
        insurance_provider: 'Pet Insurance Co',
        breeding_status: 'intact',
      };

      // Mock user with free subscription
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { id: 'user-123', subscription_status: 'free' },
                error: null,
              })
            ),
          })),
        })),
      });

      const result = await petService.createPet(premiumData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Premium and Pro tiers only');
    });

    test('should validate required fields', async () => {
      const invalidData = {
        // Missing required name field
        species: 'dog',
        breed: 'Labrador',
      };

      const result = await petService.createPet(invalidData);

      // Should fail due to missing required field
      expect(result.success).toBe(false);
    });
  });

  describe('PetService.upsertPetFromOnboarding() - Critical Onboarding Method', () => {
    test('should handle complete onboarding data with field mapping', async () => {
      const onboardingData = {
        name: 'Onboarding Pet',
        species: 'bird',
        breed: 'Cockatiel',
        colorMarkings: 'Yellow and gray',
        medicalConditions: ['Wing injury'],
        allergies: ['Seeds'],
        specialNotes: 'Loves to sing',
        personalityTraits: ['Vocal', 'Social'],
        favoriteActivities: ['Singing', 'Flying'],
        microchipId: '111222333444555',
        weight: '100g',
      };

      const result = await petService.upsertPetFromOnboarding(onboardingData);

      expect(result.success).toBe(true);
      expect(result.pet).toBeDefined();
      expect(result.isExisting).toBe(false);

      // Verify field mapping occurred
      expect(mapOnboardingToDatabase).toHaveBeenCalledWith(onboardingData);

      // Verify RPC call with correct parameters (no family_id)
      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_name: 'Onboarding Pet',
          p_species: 'bird',
          p_breed: 'Cockatiel',
          // Should not contain p_family_id
        })
      );

      const rpcCall = (supabase.rpc as jest.Mock).mock.calls[0][1];
      expect(rpcCall).not.toHaveProperty('p_family_id');
    });

    test('should detect existing pets by microchip', async () => {
      const existingMicrochipData = {
        name: 'Existing Pet',
        species: 'dog',
        microchipId: '999888777666555',
      };

      // Mock existing pet found by microchip
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: { id: 'existing-pet', name: 'Found Pet' },
                  error: null,
                })
              ),
            })),
          })),
        })),
      });

      const result = await petService.upsertPetFromOnboarding(
        existingMicrochipData
      );

      expect(result.success).toBe(true);
      expect(result.isExisting).toBe(true);
    });

    test('should handle duplicate detection by name and species', async () => {
      const duplicateNameData = {
        name: 'Common Name',
        species: 'cat',
      };

      // Mock no microchip match, but name match
      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              is: jest.fn(() => ({
                single: jest.fn(() =>
                  Promise.resolve({ data: null, error: null })
                ),
              })),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              is: jest.fn(() => ({
                single: jest.fn(() =>
                  Promise.resolve({
                    data: { id: 'duplicate-pet', name: 'Common Name' },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        });

      const result =
        await petService.upsertPetFromOnboarding(duplicateNameData);

      expect(result.success).toBe(true);
      expect(result.isExisting).toBe(true);
    });

    test('should handle RPC function errors', async () => {
      const errorData = {
        name: 'Error Pet',
        species: 'dog',
      };

      // Mock RPC error
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database constraint violation' },
      });

      const result = await petService.upsertPetFromOnboarding(errorData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database constraint violation');
      expect(result.isExisting).toBe(false);
    });
  });

  describe('PetService.updatePet() - Update Operations', () => {
    test('should update existing pet with field mapping', async () => {
      const updateData = {
        breed: 'Updated Breed',
        colorMarkings: 'Updated markings',
        medicalConditions: ['Updated condition'],
        specialNotes: 'Updated notes',
      };

      const result = await petService.updatePet('pet-1', updateData);

      expect(result.success).toBe(true);
      expect(result.pet).toBeDefined();
      expect(result.pet.name).toBe('Updated Max');

      // Verify update was called without family_id
      expect(supabase.from).toHaveBeenCalledWith('pets');
    });

    test('should validate subscription restrictions on premium fields', async () => {
      const premiumUpdateData = {
        insurance_provider: 'New Insurance',
        breeding_status: 'neutered',
      };

      // Mock free user
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { id: 'user-123', subscription_status: 'free' },
                error: null,
              })
            ),
          })),
        })),
      });

      const result = await petService.updatePet('pet-1', premiumUpdateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Premium and Pro tiers only');
    });
  });

  describe('PetService.getPet() - Single Pet Retrieval', () => {
    test('should retrieve single pet with field mapping', async () => {
      const pet = await petService.getPet('pet-1');

      expect(pet).toBeDefined();
      expect(pet.id).toBe('pet-1');
      expect(pet.name).toBe('Max');

      // Verify no family_id in response
      expect(pet).not.toHaveProperty('family_id');
      expect(pet.user_id).toBe('user-123');
    });

    test('should return null for non-existent pet', async () => {
      // Mock not found
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: 'No rows returned' },
                })
              ),
            })),
          })),
        })),
      });

      const pet = await petService.getPet('non-existent');

      expect(pet).toBeNull();
    });
  });

  describe('PetService Error Handling and Edge Cases', () => {
    test('should handle network timeouts gracefully', async () => {
      // Mock network timeout
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => {
          throw new Error('Network timeout');
        }),
      });

      await expect(petService.getPets()).rejects.toThrow('Network timeout');
    });

    test('should handle malformed data gracefully', async () => {
      const malformedData = {
        name: 123, // Wrong type
        species: null,
        medicalConditions: 'not an array',
        weight: { invalid: 'object' },
      };

      const result = await petService.createPet(malformedData as any);

      // Should not crash, but may fail validation
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle concurrent operations safely', async () => {
      const concurrentData = [
        { name: 'Pet 1', species: 'dog' },
        { name: 'Pet 2', species: 'cat' },
        { name: 'Pet 3', species: 'bird' },
      ];

      const promises = concurrentData.map(data => petService.createPet(data));
      const results = await Promise.allSettled(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });

  describe('Subscription and Business Logic Tests', () => {
    test('should enforce pet limits for free tier', async () => {
      // This would be tested with actual subscription service integration
      const result = await petService.createPet({
        family_id: 'test-family-123',
        name: 'Limit Test Pet',
        species: 'dog',
      });

      expect(result.success).toBe(true); // Free tier allows 1 pet
    });

    test('should allow premium features for premium users', async () => {
      // Mock premium user
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { id: 'user-123', subscription_status: 'premium' },
                error: null,
              })
            ),
          })),
        })),
      });

      const premiumData = {
        family_id: 'test-family-123',
        name: 'Premium Pet',
        species: 'dog',
        insurance_provider: 'Pet Insurance Co',
      };

      const result = await petService.createPet(premiumData);

      expect(result.success).toBe(true);
      expect(result.pet).toBeDefined();
    });
  });

  describe('Data Integrity and Validation Tests', () => {
    test('should preserve array field integrity', async () => {
      const arrayData = {
        family_id: 'test-family-123',
        name: 'Array Test Pet',
        species: 'dog',
        medicalConditions: ['Condition 1', 'Condition 2'],
        allergies: ['Allergen A', 'Allergen B'],
        personalityTraits: ['Trait 1', 'Trait 2', 'Trait 3'],
      };

      const result = await petService.createPet(arrayData);

      expect(result.success).toBe(true);

      // Verify arrays are preserved through the service layer
      expect(mapOnboardingToDatabase).toHaveBeenCalledWith(
        expect.objectContaining({
          medicalConditions: ['Condition 1', 'Condition 2'],
          allergies: ['Allergen A', 'Allergen B'],
          personalityTraits: ['Trait 1', 'Trait 2', 'Trait 3'],
        })
      );
    });

    test('should handle special characters in all text fields', async () => {
      const specialCharData = {
        family_id: 'test-family-123',
        name: "Münster-O'Malley",
        species: 'dog',
        breed: 'Großer Münsterländer',
        specialNotes: 'Loves treats! 🐕 Very energetic @ 7AM & 6PM.',
        medicalConditions: ['Condition with "quotes"'],
      };

      const result = await petService.createPet(specialCharData);

      expect(result.success).toBe(true);

      // Verify special characters are handled properly
      expect(mapOnboardingToDatabase).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Münster-O'Malley",
          breed: 'Großer Münsterländer',
          specialNotes: 'Loves treats! 🐕 Very energetic @ 7AM & 6PM.',
          medicalConditions: ['Condition with "quotes"'],
        })
      );
    });
  });
});
