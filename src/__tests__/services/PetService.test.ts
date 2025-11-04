import { PetService, Pet } from '../../services/PetService';
import { supabase } from '../../lib/supabase';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
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
    rpc: jest.fn(),
  },
}));

// Mock image manipulation
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
}));

const mockUser = {
  user: {
    id: 'auth-user-123',
    email: 'test@example.com',
  },
};

const mockUserRecord = {
  id: 'user-123',
  subscription_status: 'free',
};

const mockPetData = {
  name: 'Max',
  species: 'dog',
  breed: 'Golden Retriever',
  color: 'Golden',
  personality_traits: ['Friendly', 'Energetic'],
  favorite_activities: ['Playing Fetch', 'Swimming'],
  exercise_needs: 'high' as const,
  special_notes: 'Loves treats and belly rubs',
  medical_conditions: ['Hip Dysplasia'],
  allergies: ['Pollen'],
};

describe('PetService', () => {
  let petService: PetService;

  beforeEach(() => {
    petService = new PetService();
    jest.clearAllMocks();

    // Setup default mocks
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: mockUser,
    });

    (supabase.from as jest.Mock).mockImplementation(table => {
      if (table === 'users') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
              }),
            })),
          })),
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
            is: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: [],
              }),
            })),
          })),
          is: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: [],
            }),
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
      };
    });
  });

  describe('upsertPetFromOnboarding', () => {
    beforeEach(() => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'pet-123',
        error: null,
      });
    });

    it('should successfully create a new pet with all onboarding data', async () => {
      const mockSavedPet: Pet = {
        id: 'pet-123',
        user_id: 'user-123',
        name: mockPetData.name,
        species: mockPetData.species,
        breed: mockPetData.breed,
        color_markings: mockPetData.color,
        personality_traits: mockPetData.personality_traits,
        favorite_activities: mockPetData.favorite_activities,
        exercise_needs: mockPetData.exercise_needs,
        special_notes: mockPetData.special_notes,
        medical_conditions: mockPetData.medical_conditions,
        allergies: mockPetData.allergies,
        status: 'active',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock getPet to return the saved pet
      jest.spyOn(petService, 'getPet').mockResolvedValue(mockSavedPet);

      const result = await petService.upsertPetFromOnboarding(mockPetData);

      expect(result.success).toBe(true);
      expect(result.pet).toEqual(mockSavedPet);
      expect(result.isExisting).toBe(false);
      expect(supabase.rpc).toHaveBeenCalledWith('upsert_pet_data', {
        p_name: mockPetData.name,
        p_species: mockPetData.species,
        p_breed: mockPetData.breed,
        p_color: mockPetData.color,
        p_color_markings: null,
        p_gender: null,
        p_date_of_birth: null,
        p_weight_kg: null,
        p_microchip_number: null,
        p_special_needs: null,
        p_special_notes: mockPetData.special_notes,
        p_allergies: mockPetData.allergies,
        p_medical_conditions: mockPetData.medical_conditions,
        p_personality_traits: mockPetData.personality_traits,
        p_favorite_activities: mockPetData.favorite_activities,
        p_exercise_needs: mockPetData.exercise_needs,
        p_favorite_food: null,
        p_feeding_schedule: null,
        p_special_diet_notes: null,
        p_created_by: mockUserRecord.id,
      });
    });

    it('should map onboarding fields to database schema correctly', async () => {
      const onboardingData = {
        name: 'Bella',
        species: 'cat',
        breed: 'Persian',
        color_markings: 'White with gray patches',
        personality_traits: ['Calm', 'Affectionate'],
        favorite_activities: ['Laser Pointer', 'Window Bird Watching'],
        exercise_needs: 'low' as const,
        favorite_food: 'Salmon',
        feeding_schedule: 'Twice daily',
        special_diet_notes: 'Grain-free diet',
        special_notes: 'Prefers quiet environments',
      };

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        ...mockPetData,
        id: 'pet-456',
      } as Pet);

      await petService.upsertPetFromOnboarding(onboardingData);

      expect(supabase.rpc).toHaveBeenCalledWith('upsert_pet_data', {
        p_name: 'Bella',
        p_species: 'cat',
        p_breed: 'Persian',
        p_color: null,
        p_color_markings: 'White with gray patches',
        p_gender: null,
        p_date_of_birth: null,
        p_weight_kg: null,
        p_microchip_number: null,
        p_special_needs: null,
        p_special_notes: 'Prefers quiet environments',
        p_allergies: null,
        p_medical_conditions: null,
        p_personality_traits: ['Calm', 'Affectionate'],
        p_favorite_activities: ['Laser Pointer', 'Window Bird Watching'],
        p_exercise_needs: 'low',
        p_favorite_food: 'Salmon',
        p_feeding_schedule: 'Twice daily',
        p_special_diet_notes: 'Grain-free diet',
        p_created_by: mockUserRecord.id,
      });
    });

    it('should detect existing pets by microchip', async () => {
      const existingPet = { id: 'existing-pet', name: 'Existing Max' };

      // Mock existing pet found by microchip
      (supabase.from as jest.Mock).mockImplementation(table => {
        if (table === 'pets') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                is: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: existingPet,
                  }),
                })),
              })),
            })),
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
              }),
            })),
          })),
        };
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        ...mockPetData,
        id: 'existing-pet',
      } as Pet);

      const dataWithMicrochip = {
        ...mockPetData,
        microchip_number: '123456789',
      };

      const result =
        await petService.upsertPetFromOnboarding(dataWithMicrochip);

      expect(result.success).toBe(true);
      expect(result.isExisting).toBe(true);
    });

    it('should detect existing pets by name and species when no microchip', async () => {
      const existingPet = { id: 'existing-pet-2', name: 'Max' };
      let callCount = 0;

      // Mock: first call (microchip check) returns null, second call (name check) returns existing pet
      (supabase.from as jest.Mock).mockImplementation(table => {
        if (table === 'pets') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                is: jest.fn(() => ({
                  single: jest.fn().mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                      // First call - microchip check returns null
                      return Promise.resolve({ data: null });
                    } else {
                      // Second call - name check returns existing pet
                      return Promise.resolve({ data: existingPet });
                    }
                  }),
                })),
              })),
            })),
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUserRecord,
              }),
            })),
          })),
        };
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        ...mockPetData,
        id: 'existing-pet-2',
      } as Pet);

      const result = await petService.upsertPetFromOnboarding({
        ...mockPetData,
        family_id: 'family-123',
      });

      expect(result.success).toBe(true);
      expect(result.isExisting).toBe(true);
    });

    it('should handle authentication errors', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      const result = await petService.upsertPetFromOnboarding(mockPetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
      expect(result.isExisting).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await petService.upsertPetFromOnboarding(mockPetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(result.isExisting).toBe(false);
    });

    it('should handle pet retrieval failure after successful upsert', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'pet-123',
        error: null,
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue(null);

      const result = await petService.upsertPetFromOnboarding(mockPetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Pet processed but could not retrieve data');
      expect(result.isExisting).toBe(false);
    });
  });

  describe('Data Transformation', () => {
    it('should handle personality_traits as both string and array', async () => {
      jest.spyOn(petService, 'getPet').mockResolvedValue({
        ...mockPetData,
        id: 'pet-123',
      } as Pet);

      // Test with string
      const dataWithStringTraits = {
        ...mockPetData,
        personality_traits: 'Friendly, Energetic',
      };

      await petService.upsertPetFromOnboarding(dataWithStringTraits);

      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_personality_traits: 'Friendly, Energetic',
        })
      );

      // Test with array
      const dataWithArrayTraits = {
        ...mockPetData,
        personality_traits: ['Friendly', 'Energetic'],
      };

      await petService.upsertPetFromOnboarding(dataWithArrayTraits);

      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_personality_traits: ['Friendly', 'Energetic'],
        })
      );
    });

    it('should handle null and undefined values correctly', async () => {
      jest.spyOn(petService, 'getPet').mockResolvedValue({
        ...mockPetData,
        id: 'pet-123',
      } as Pet);

      const minimalData = {
        name: 'Minimal Pet',
        species: 'dog',
        // All other fields undefined
      };

      await petService.upsertPetFromOnboarding(minimalData);

      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_name: 'Minimal Pet',
          p_species: 'dog',
          p_breed: null,
          p_color: null,
          p_personality_traits: null,
          p_favorite_activities: null,
          p_special_notes: null,
        })
      );
    });

    it('should preserve array fields correctly', async () => {
      jest.spyOn(petService, 'getPet').mockResolvedValue({
        ...mockPetData,
        id: 'pet-123',
      } as Pet);

      const dataWithArrays = {
        name: 'Array Pet',
        species: 'cat',
        personality_traits: ['Calm', 'Independent', 'Affectionate'],
        favorite_activities: ['Laser Pointer', 'Scratching Post', 'Napping'],
        medical_conditions: ['Asthma', 'Sensitive Stomach'],
        allergies: ['Dust', 'Certain Proteins'],
      };

      await petService.upsertPetFromOnboarding(dataWithArrays);

      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_personality_traits: ['Calm', 'Independent', 'Affectionate'],
          p_favorite_activities: [
            'Laser Pointer',
            'Scratching Post',
            'Napping',
          ],
          p_medical_conditions: ['Asthma', 'Sensitive Stomach'],
          p_allergies: ['Dust', 'Certain Proteins'],
        })
      );
    });
  });

  describe('Subscription Limits', () => {
    it('should allow free users to create basic pet profiles', async () => {
      jest.spyOn(petService, 'getPet').mockResolvedValue({
        ...mockPetData,
        id: 'pet-123',
      } as Pet);

      const freeUserData = {
        name: 'Free Pet',
        species: 'dog',
        breed: 'Mixed',
        personality_traits: ['Friendly'],
        // No premium fields
      };

      const result = await petService.upsertPetFromOnboarding(freeUserData);

      expect(result.success).toBe(true);
    });

    it('should handle premium features correctly for premium users', async () => {
      // Mock premium user
      (supabase.from as jest.Mock).mockImplementation(table => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockUserRecord, subscription_status: 'premium' },
                }),
              })),
            })),
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        };
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        ...mockPetData,
        id: 'pet-123',
      } as Pet);

      const premiumData = {
        ...mockPetData,
        insurance_provider: 'Pet Insurance Co',
        breeding_status: 'intact',
      };

      const result = await petService.upsertPetFromOnboarding(premiumData);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (supabase.auth.getUser as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await petService.upsertPetFromOnboarding(mockPetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle malformed data gracefully', async () => {
      const malformedData = {
        name: null, // Invalid - name should be string
        species: 'dog',
      } as any;

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid data format' },
      });

      const result = await petService.upsertPetFromOnboarding(malformedData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid data format');
    });
  });
});
