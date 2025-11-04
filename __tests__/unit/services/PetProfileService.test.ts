/**
 * PetProfileService Unit Tests
 * Comprehensive test suite for the pet profile service that handles mapping
 * between onboarding PetProfile data and database Pet schema
 */

import { petProfileService } from '../../../src/services/PetProfileService';
import { PetProfile } from '../../../src/types/Pet';
import { supabase } from '../../../src/lib/supabase';
import {
  createMockOnboardingData,
  createMockDatabasePet,
  apiResponseFactories,
  supabaseResponseFactories,
  createPetWithHealthIssues,
  createPartialPet,
} from '@/test-utils/petDataFactory';

// Mock Supabase
jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        is: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve()),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('PetProfileService', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockUser = { user: { id: 'auth-user-123' } };
  const mockUserRecord = { id: 'user-123' };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth mock
    mockSupabase.auth.getUser.mockResolvedValue({
      data: mockUser,
      error: null,
    } as any);

    // Default user record mock
    const mockUserQuery = {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockUserRecord,
            error: null,
          }),
        })),
      })),
    };
    mockSupabase.from.mockReturnValue(mockUserQuery as any);
  });

  describe('savePetProfile', () => {
    it('should save a complete pet profile successfully', async () => {
      const onboardingData = createMockOnboardingData({
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        weight: '25 kg',
        medicalConditions: ['Hip dysplasia'],
        allergies: ['Chicken'],
        favoriteActivities: ['Fetch', 'Swimming'],
        exerciseNeeds: 'high',
      });

      const savedPet = createMockDatabasePet({
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        weight_kg: 25,
        medical_conditions: ['Hip dysplasia'],
        allergies: ['Chicken'],
        favorite_activities: ['Fetch', 'Swimming'],
        exercise_needs: 'high',
      });

      // Mock the insert operation
      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: savedPet,
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(true);
      expect(result.pet).toBeDefined();
      expect(result.pet?.name).toBe('Buddy');
      expect(result.pet?.species).toBe('dog');
      expect(result.pet?.weight).toBe('25 kg');
      expect(result.pet?.medicalConditions).toEqual(['Hip dysplasia']);
      expect(result.pet?.allergies).toEqual(['Chicken']);
      expect(result.pet?.favoriteActivities).toEqual(['Fetch', 'Swimming']);
      expect(result.pet?.exerciseNeeds).toBe('high');

      // Verify insert was called with correct data
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Buddy',
          species: 'dog',
          breed: 'Golden Retriever',
          weight_kg: 25,
          medical_conditions: ['Hip dysplasia'],
          allergies: ['Chicken'],
          favorite_activities: ['Fetch', 'Swimming'],
          exercise_needs: 'high',
          user_id: 'user-123',
          status: 'active',
        })
      );
    });

    it('should handle weight conversion from string format', async () => {
      const onboardingData = createMockOnboardingData({
        weight: '15.5 kg',
      });

      const savedPet = createMockDatabasePet({
        weight_kg: 15.5,
      });

      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: savedPet,
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(true);
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          weight_kg: 15.5,
        })
      );
    });

    it('should handle weight conversion from object format', async () => {
      const onboardingData = createMockOnboardingData({
        weight: { value: 20, unit: 'kg' } as any,
      });

      const savedPet = createMockDatabasePet({
        weight_kg: 20,
      });

      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: savedPet,
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(true);
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          weight_kg: 20,
        })
      );
    });

    it('should handle date of birth conversion', async () => {
      const birthDate = new Date('2020-01-15');
      const onboardingData = createMockOnboardingData({
        dateOfBirth: birthDate,
      });

      const savedPet = createMockDatabasePet({
        date_of_birth: '2020-01-15',
      });

      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: savedPet,
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(true);
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          date_of_birth: '2020-01-15',
        })
      );
    });

    it('should handle empty and undefined fields correctly', async () => {
      const onboardingData = createMockOnboardingData({
        breed: undefined,
        weight: undefined,
        medicalConditions: [],
        allergies: undefined,
        specialNotes: '',
      });

      const savedPet = createMockDatabasePet({
        breed: undefined,
        weight_kg: undefined,
        medical_conditions: [],
        allergies: [],
        special_notes: undefined,
      });

      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: savedPet,
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(true);
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          breed: undefined,
          weight_kg: undefined,
          medical_conditions: [],
          allergies: [],
          special_notes: undefined,
        })
      );
    });

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const onboardingData = createMockOnboardingData();
      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should return error when user record is not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      } as any);

      const onboardingData = createMockOnboardingData();
      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error when database insert fails', async () => {
      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database constraint violation' },
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const onboardingData = createMockOnboardingData();
      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database constraint violation');
    });
  });

  describe('getPetProfiles', () => {
    it('should return all pet profiles for authenticated user', async () => {
      const mockPets = [
        createMockDatabasePet({
          id: 'pet-1',
          name: 'Max',
          species: 'dog',
          weight_kg: 25,
        }),
        createMockDatabasePet({
          id: 'pet-2',
          name: 'Luna',
          species: 'cat',
          weight_kg: 5,
        }),
      ];

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: mockPets,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockQuery as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.getPetProfiles();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Max');
      expect(result[0].species).toBe('dog');
      expect(result[0].weight).toBe('25 kg');
      expect(result[1].name).toBe('Luna');
      expect(result[1].species).toBe('cat');
      expect(result[1].weight).toBe('5 kg');
    });

    it('should return empty array when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await petProfileService.getPetProfiles();

      expect(result).toEqual([]);
    });

    it('should return empty array when user record is not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      } as any);

      const result = await petProfileService.getPetProfiles();

      expect(result).toEqual([]);
    });

    it('should handle database query errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            })),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockQuery as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.getPetProfiles();

      expect(result).toEqual([]);
    });

    it('should properly convert database fields to PetProfile format', async () => {
      const mockPet = createMockDatabasePet({
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        color_markings: 'Golden with white chest',
        weight_kg: 30,
        height: '60 cm',
        microchip_number: '123456789012345',
        medical_conditions: ['Hip dysplasia', 'Allergies'],
        allergies: ['Chicken', 'Beef'],
        personality_traits: ['Friendly', 'Energetic'],
        favorite_activities: ['Fetch', 'Swimming'],
        exercise_needs: 'high',
        favorite_food: 'Chicken and rice',
        feeding_schedule: 'Twice daily',
        special_diet_notes: 'Grain-free',
        special_notes: 'Loves car rides',
        date_of_birth: '2020-01-15T00:00:00.000Z',
      });

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: [mockPet],
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockQuery as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.getPetProfiles();

      expect(result).toHaveLength(1);
      const petProfile = result[0];

      expect(petProfile.name).toBe('Buddy');
      expect(petProfile.species).toBe('dog');
      expect(petProfile.breed).toBe('Golden Retriever');
      expect(petProfile.colorMarkings).toBe('Golden with white chest');
      expect(petProfile.weight).toBe('30 kg');
      expect(petProfile.height).toBe('60 cm');
      expect(petProfile.microchipId).toBe('123456789012345');
      expect(petProfile.medicalConditions).toEqual([
        'Hip dysplasia',
        'Allergies',
      ]);
      expect(petProfile.allergies).toEqual(['Chicken', 'Beef']);
      expect(petProfile.personalityTraits).toEqual(['Friendly', 'Energetic']);
      expect(petProfile.favoriteActivities).toEqual(['Fetch', 'Swimming']);
      expect(petProfile.exerciseNeeds).toBe('high');
      expect(petProfile.favoriteFood).toBe('Chicken and rice');
      expect(petProfile.feedingSchedule).toBe('Twice daily');
      expect(petProfile.specialDietNotes).toBe('Grain-free');
      expect(petProfile.specialNotes).toBe('Loves car rides');
      expect(petProfile.dateOfBirth).toEqual(
        new Date('2020-01-15T00:00:00.000Z')
      );
    });
  });

  describe('getPetProfile', () => {
    it('should return specific pet profile by ID', async () => {
      const mockPet = createMockDatabasePet({
        id: 'pet-123',
        name: 'Fluffy',
        species: 'cat',
      });

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockPet,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await petProfileService.getPetProfile('pet-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('pet-123');
      expect(result?.name).toBe('Fluffy');
      expect(result?.species).toBe('cat');
    });

    it('should return null when pet is not found', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows returned' },
              }),
            })),
          })),
        })),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await petProfileService.getPetProfile('non-existent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn().mockRejectedValue(new Error('Database error')),
            })),
          })),
        })),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await petProfileService.getPetProfile('pet-123');

      expect(result).toBeNull();
    });
  });

  describe('updatePetProfile', () => {
    it('should update pet profile successfully', async () => {
      const updateData: Partial<PetProfile> = {
        name: 'Updated Name',
        weight: '28 kg',
        medicalConditions: ['New condition'],
      };

      const updatedPet = createMockDatabasePet({
        id: 'pet-123',
        name: 'Updated Name',
        weight_kg: 28,
        medical_conditions: ['New condition'],
      });

      const mockUpdate = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: updatedPet,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockUpdate as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.updatePetProfile(
        'pet-123',
        updateData
      );

      expect(result.success).toBe(true);
      expect(result.pet?.name).toBe('Updated Name');
      expect(result.pet?.weight).toBe('28 kg');
      expect(result.pet?.medicalConditions).toEqual(['New condition']);

      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          weight_kg: 28,
          medical_conditions: ['New condition'],
        })
      );
    });

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await petProfileService.updatePetProfile('pet-123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should return error when update fails', async () => {
      const mockUpdate = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            })),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockUpdate as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.updatePetProfile('pet-123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('deletePetProfile', () => {
    it('should soft delete pet profile successfully', async () => {
      const mockUpdate = {
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockUpdate as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.deletePetProfile('pet-123');

      expect(result.success).toBe(true);
      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
    });

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await petProfileService.deletePetProfile('pet-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should return error when delete fails', async () => {
      const mockUpdate = {
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Delete failed' },
          }),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockUpdate as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.deletePetProfile('pet-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('generateIdentificationNumber', () => {
    it('should generate unique identification numbers', () => {
      const id1 = petProfileService.generateIdentificationNumber();
      const id2 = petProfileService.generateIdentificationNumber();

      expect(id1).toMatch(/^TR-\d{9}$/);
      expect(id2).toMatch(/^TR-\d{9}$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format', () => {
      const id = petProfileService.generateIdentificationNumber();

      expect(id).toMatch(/^TR-\d{9}$/);
      expect(id.startsWith('TR-')).toBe(true);
      expect(id.length).toBe(12); // TR- + 9 digits
    });

    it('should generate multiple unique IDs in sequence', () => {
      const ids = Array.from({ length: 10 }, () =>
        petProfileService.generateIdentificationNumber()
      );

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10); // All should be unique
    });
  });

  describe('Field Mapping Edge Cases', () => {
    it('should handle complex weight formats', async () => {
      const testCases = [
        { input: '25.5 kg', expected: 25.5 },
        { input: '12', expected: 12 },
        { input: '10.0', expected: 10 },
        { input: '', expected: undefined },
        { input: undefined, expected: undefined },
        { input: null, expected: undefined },
      ];

      for (const testCase of testCases) {
        const onboardingData = createMockOnboardingData({
          weight: testCase.input as any,
        });

        const savedPet = createMockDatabasePet({
          weight_kg: testCase.expected,
        });

        const mockInsert = {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: savedPet,
                error: null,
              }),
            })),
          })),
        };

        mockSupabase.from.mockImplementation(table => {
          if (table === 'pets') return mockInsert as any;
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockUserRecord,
                  error: null,
                }),
              })),
            })),
          } as any;
        });

        const result = await petProfileService.savePetProfile(onboardingData);

        expect(result.success).toBe(true);
        expect(mockInsert.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            weight_kg: testCase.expected,
          })
        );
      }
    });

    it('should handle height format conversion', async () => {
      const testCases = [
        { input: '60 cm', expected: '60 cm' },
        { input: { value: 24, unit: 'inches' }, expected: '24 inches' },
        { input: undefined, expected: undefined },
      ];

      for (const testCase of testCases) {
        const onboardingData = createMockOnboardingData({
          height: testCase.input as any,
        });

        const savedPet = createMockDatabasePet({
          height: testCase.expected,
        });

        const mockInsert = {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: savedPet,
                error: null,
              }),
            })),
          })),
        };

        mockSupabase.from.mockImplementation(table => {
          if (table === 'pets') return mockInsert as any;
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockUserRecord,
                  error: null,
                }),
              })),
            })),
          } as any;
        });

        const result = await petProfileService.savePetProfile(onboardingData);

        expect(result.success).toBe(true);
        expect(mockInsert.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            height: testCase.expected,
          })
        );
      }
    });

    it('should handle array fields correctly', async () => {
      const onboardingData = createMockOnboardingData({
        medicalConditions: ['Condition 1', 'Condition 2'],
        allergies: ['Allergy 1'],
        personalityTraits: ['Trait 1', 'Trait 2', 'Trait 3'],
        favoriteActivities: ['Activity 1'],
      });

      const savedPet = createMockDatabasePet({
        medical_conditions: ['Condition 1', 'Condition 2'],
        allergies: ['Allergy 1'],
        personality_traits: ['Trait 1', 'Trait 2', 'Trait 3'],
        favorite_activities: ['Activity 1'],
      });

      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: savedPet,
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(true);
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          medical_conditions: ['Condition 1', 'Condition 2'],
          allergies: ['Allergy 1'],
          personality_traits: ['Trait 1', 'Trait 2', 'Trait 3'],
          favorite_activities: ['Activity 1'],
        })
      );
    });

    it('should handle null date of birth', async () => {
      const onboardingData = createMockOnboardingData({
        dateOfBirth: null,
      });

      const savedPet = createMockDatabasePet({
        date_of_birth: null,
      });

      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: savedPet,
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(true);
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          date_of_birth: undefined,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during save', async () => {
      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const onboardingData = createMockOnboardingData();
      const result = await petProfileService.savePetProfile(onboardingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle concurrent modification errors', async () => {
      const mockUpdate = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Row was modified by another process' },
              }),
            })),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockUpdate as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.updatePetProfile('pet-123', {
        name: 'New Name',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Row was modified by another process');
    });

    it('should handle malformed data gracefully', async () => {
      const invalidData = {
        name: '',
        species: 'invalid-species',
        weight: 'not-a-number kg',
        dateOfBirth: 'invalid-date',
      } as any;

      const savedPet = createMockDatabasePet({
        name: '',
        species: 'invalid-species',
        weight_kg: undefined,
        date_of_birth: undefined,
      });

      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: savedPet,
              error: null,
            }),
          })),
        })),
      };

      mockSupabase.from.mockImplementation(table => {
        if (table === 'pets') return mockInsert as any;
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
                error: null,
              }),
            })),
          })),
        } as any;
      });

      const result = await petProfileService.savePetProfile(invalidData);

      expect(result.success).toBe(true);
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '',
          species: 'invalid-species',
          weight_kg: undefined,
          date_of_birth: undefined,
        })
      );
    });
  });
});
