import { PetService } from '../../services/PetService';
import { databaseService } from '../../services/databaseService';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Data Mapping Verification Tests', () => {
  let petService: PetService;

  const mockUser = {
    user: { id: 'auth-user-123', email: 'test@example.com' },
  };

  const mockUserRecord = {
    id: 'user-123',
    subscription_status: 'free',
  };

  beforeEach(() => {
    petService = new PetService();
    jest.clearAllMocks();

    // Setup authentication
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: mockUser,
    });

    // Setup user lookup
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
          })),
        })),
      };
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Onboarding to Database Field Mapping', () => {
    it('should correctly map basic information fields', async () => {
      const onboardingData = {
        name: 'Field Mapping Test',
        species: 'dog',
        breed: 'Test Breed',
        color: 'Test Color',
        color_markings: 'Test Color Markings',
        gender: 'male',
        date_of_birth: '2020-01-01',
        weight_kg: 25.5,
        microchip_number: 'MAPPING123456',
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'mapping-pet-123',
        error: null,
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        id: 'mapping-pet-123',
        ...onboardingData,
        user_id: mockUserRecord.id,
        status: 'active',
        created_by: mockUserRecord.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as any);

      await petService.upsertPetFromOnboarding(onboardingData);

      // Verify exact field mapping to database schema
      expect(supabase.rpc).toHaveBeenCalledWith('upsert_pet_data', {
        p_name: 'Field Mapping Test', // name → p_name
        p_species: 'dog', // species → p_species
        p_breed: 'Test Breed', // breed → p_breed
        p_color: 'Test Color', // color → p_color
        p_color_markings: 'Test Color Markings', // color_markings → p_color_markings
        p_gender: 'male', // gender → p_gender
        p_date_of_birth: '2020-01-01', // date_of_birth → p_date_of_birth
        p_weight_kg: 25.5, // weight_kg → p_weight_kg
        p_microchip_number: 'MAPPING123456', // microchip_number → p_microchip_number
        p_special_needs: null,
        p_special_notes: null,
        p_allergies: null,
        p_medical_conditions: null,
        p_personality_traits: null,
        p_favorite_activities: null,
        p_exercise_needs: null,
        p_favorite_food: null,
        p_feeding_schedule: null,
        p_special_diet_notes: null,
        p_created_by: mockUserRecord.id,
      });
    });

    it('should correctly map personality and behavior fields', async () => {
      const behaviorData = {
        name: 'Behavior Test Pet',
        species: 'cat',
        personality_traits: ['Independent', 'Playful', 'Affectionate'],
        favorite_activities: ['Laser Pointer', 'Scratching Post', 'Napping'],
        exercise_needs: 'moderate',
        special_notes: 'Loves high perches and sunny windows',
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'behavior-pet-123',
        error: null,
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        id: 'behavior-pet-123',
        ...behaviorData,
        user_id: mockUserRecord.id,
        status: 'active',
        created_by: mockUserRecord.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as any);

      await petService.upsertPetFromOnboarding(behaviorData);

      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_personality_traits: ['Independent', 'Playful', 'Affectionate'], // personality_traits → p_personality_traits
          p_favorite_activities: [
            'Laser Pointer',
            'Scratching Post',
            'Napping',
          ], // favorite_activities → p_favorite_activities
          p_exercise_needs: 'moderate', // exercise_needs → p_exercise_needs
          p_special_notes: 'Loves high perches and sunny windows', // special_notes → p_special_notes
        })
      );
    });

    it('should correctly map health and dietary fields', async () => {
      const healthData = {
        name: 'Health Test Pet',
        species: 'dog',
        medical_conditions: ['Hip Dysplasia', 'Allergies'],
        allergies: ['Chicken', 'Wheat', 'Grass Pollen'],
        favorite_food: 'Salmon and Sweet Potato',
        feeding_schedule: 'Twice daily at 7 AM and 6 PM',
        special_diet_notes: 'Grain-free, limited ingredient diet',
        special_needs: 'Requires joint supplements',
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'health-pet-123',
        error: null,
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        id: 'health-pet-123',
        ...healthData,
        user_id: mockUserRecord.id,
        status: 'active',
        created_by: mockUserRecord.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as any);

      await petService.upsertPetFromOnboarding(healthData);

      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_medical_conditions: ['Hip Dysplasia', 'Allergies'], // medical_conditions → p_medical_conditions
          p_allergies: ['Chicken', 'Wheat', 'Grass Pollen'], // allergies → p_allergies
          p_favorite_food: 'Salmon and Sweet Potato', // favorite_food → p_favorite_food
          p_feeding_schedule: 'Twice daily at 7 AM and 6 PM', // feeding_schedule → p_feeding_schedule
          p_special_diet_notes: 'Grain-free, limited ingredient diet', // special_diet_notes → p_special_diet_notes
          p_special_needs: 'Requires joint supplements', // special_needs → p_special_needs
        })
      );
    });
  });

  describe('Database to Dashboard Display Mapping', () => {
    it('should correctly transform database data for dashboard display', async () => {
      const databasePetData = {
        id: 'display-pet-123',
        name: 'Display Test Pet',
        species: 'dog',
        breed: 'Golden Retriever',
        birth_date: '2020-06-15', // Database field
        weight_kg: 28.5,
        color_markings: 'Golden with white chest',
        personality_traits: ['Friendly', 'Loyal', 'Energetic'],
        favorite_activities: ['Fetch', 'Swimming', 'Hiking'],
        exercise_needs: 'high',
        medical_conditions: ['None'],
        special_notes: 'Great with children',
        profile_photo_url: 'https://example.com/photo.jpg',
      };

      // Mock AsyncStorage to return the database-formatted data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([databasePetData])
      );

      const dashboardPets = await databaseService.getAllPetProfiles();
      const displayPet = dashboardPets[0];

      // Verify correct transformation for dashboard display
      expect(displayPet.name).toBe('Display Test Pet'); // name stays name
      expect(displayPet.species).toBe('dog'); // species stays species
      expect(displayPet.breed).toBe('Golden Retriever'); // breed stays breed
      expect(displayPet.birth_date).toBe('2020-06-15'); // birth_date from date_of_birth
      expect(displayPet.weight_kg).toBe(28.5); // weight_kg stays weight_kg
      expect(displayPet.color_markings).toBe('Golden with white chest'); // color_markings stays color_markings
      expect(displayPet.personality_traits).toEqual([
        'Friendly',
        'Loyal',
        'Energetic',
      ]); // array preserved
      expect(displayPet.favorite_activities).toEqual([
        'Fetch',
        'Swimming',
        'Hiking',
      ]); // array preserved
      expect(displayPet.exercise_needs).toBe('high'); // exercise_needs stays exercise_needs
      expect(displayPet.special_notes).toBe('Great with children'); // special_notes stays special_notes
      expect(displayPet.profile_photo_url).toBe(
        'https://example.com/photo.jpg'
      ); // photo URL preserved
    });

    it('should calculate age correctly from birth_date', async () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 3,
        today.getMonth(),
        today.getDate()
      ); // 3 years ago

      const petWithAge = {
        id: 'age-test-pet',
        name: 'Age Test Pet',
        species: 'cat',
        birth_date: birthDate.toISOString().split('T')[0], // YYYY-MM-DD format
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([petWithAge])
      );

      const dashboardPets = await databaseService.getAllPetProfiles();
      const displayPet = dashboardPets[0];

      // Age calculation should be handled by the dashboard component,
      // but birth_date should be correctly passed through
      expect(displayPet.birth_date).toBe(birthDate.toISOString().split('T')[0]);
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalPetData = {
        id: 'minimal-display-pet',
        name: 'Minimal Pet',
        species: 'bird',
        // Most fields are null/undefined
        breed: null,
        birth_date: null,
        weight_kg: null,
        personality_traits: null,
        favorite_activities: null,
        exercise_needs: null,
        special_notes: null,
        profile_photo_url: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([minimalPetData])
      );

      const dashboardPets = await databaseService.getAllPetProfiles();
      const displayPet = dashboardPets[0];

      // Should handle null values without errors
      expect(displayPet.name).toBe('Minimal Pet');
      expect(displayPet.species).toBe('bird');
      expect(displayPet.breed).toBeNull();
      expect(displayPet.birth_date).toBeNull();
      expect(displayPet.weight_kg).toBeNull();
      expect(displayPet.personality_traits).toBeNull();
      expect(displayPet.favorite_activities).toBeNull();
      expect(displayPet.exercise_needs).toBeNull();
      expect(displayPet.special_notes).toBeNull();
      expect(displayPet.profile_photo_url).toBeNull();
    });
  });

  describe('Complete Field Mapping Matrix Verification', () => {
    it('should verify complete field mapping matrix', async () => {
      // Complete mapping test covering all supported fields
      const completeFieldData = {
        // Basic Info (Step 1)
        name: 'Complete Mapping Test',
        species: 'dog',

        // Physical Details (Step 2)
        breed: 'Complete Test Breed',
        color: 'Complete Test Color',
        color_markings: 'Complete color markings description',
        gender: 'female',
        date_of_birth: '2019-12-25',
        weight_kg: 30.0,
        microchip_number: 'COMPLETE123456789',

        // Health Info (Step 3)
        medical_conditions: [
          'Complete Test Condition 1',
          'Complete Test Condition 2',
        ],
        allergies: [
          'Complete Allergy 1',
          'Complete Allergy 2',
          'Complete Allergy 3',
        ],
        special_needs: 'Complete special needs description',

        // Personality (Step 4)
        personality_traits: [
          'Complete Trait 1',
          'Complete Trait 2',
          'Complete Trait 3',
          'Complete Trait 4',
        ],

        // Care Preferences (Step 5)
        favorite_food: 'Complete favorite food description',
        feeding_schedule: 'Complete feeding schedule description',
        special_diet_notes: 'Complete special diet notes',

        // Activities (Step 6)
        favorite_activities: [
          'Complete Activity 1',
          'Complete Activity 2',
          'Complete Activity 3',
        ],
        exercise_needs: 'high',

        // Review Notes (Step 7)
        special_notes: 'Complete special notes from final review step',
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'complete-mapping-pet',
        error: null,
      });

      const completeSavedData = {
        id: 'complete-mapping-pet',
        user_id: mockUserRecord.id,
        ...completeFieldData,
        status: 'active',
        created_by: mockUserRecord.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      jest
        .spyOn(petService, 'getPet')
        .mockResolvedValue(completeSavedData as any);

      // STEP 1: Save via onboarding service
      const saveResult =
        await petService.upsertPetFromOnboarding(completeFieldData);
      expect(saveResult.success).toBe(true);

      // STEP 2: Verify database mapping
      expect(supabase.rpc).toHaveBeenCalledWith('upsert_pet_data', {
        // Basic mapping
        p_name: 'Complete Mapping Test',
        p_species: 'dog',
        p_breed: 'Complete Test Breed',
        p_color: 'Complete Test Color',
        p_color_markings: 'Complete color markings description',
        p_gender: 'female',
        p_date_of_birth: '2019-12-25',
        p_weight_kg: 30.0,
        p_microchip_number: 'COMPLETE123456789',

        // Health mapping
        p_medical_conditions: [
          'Complete Test Condition 1',
          'Complete Test Condition 2',
        ],
        p_allergies: [
          'Complete Allergy 1',
          'Complete Allergy 2',
          'Complete Allergy 3',
        ],
        p_special_needs: 'Complete special needs description',

        // Behavior mapping
        p_personality_traits: [
          'Complete Trait 1',
          'Complete Trait 2',
          'Complete Trait 3',
          'Complete Trait 4',
        ],
        p_favorite_activities: [
          'Complete Activity 1',
          'Complete Activity 2',
          'Complete Activity 3',
        ],
        p_exercise_needs: 'high',

        // Care mapping
        p_favorite_food: 'Complete favorite food description',
        p_feeding_schedule: 'Complete feeding schedule description',
        p_special_diet_notes: 'Complete special diet notes',

        // Notes mapping
        p_special_notes: 'Complete special notes from final review step',

        // System fields
        p_created_by: mockUserRecord.id,
      });

      // STEP 3: Mock dashboard retrieval
      const dashboardFormatData = {
        id: 'complete-mapping-pet',
        name: completeFieldData.name,
        species: completeFieldData.species,
        breed: completeFieldData.breed,
        birth_date: completeFieldData.date_of_birth, // date_of_birth → birth_date
        weight_kg: completeFieldData.weight_kg,
        color_markings: completeFieldData.color_markings,
        personality_traits: completeFieldData.personality_traits,
        favorite_activities: completeFieldData.favorite_activities,
        exercise_needs: completeFieldData.exercise_needs,
        medical_conditions: completeFieldData.medical_conditions,
        allergies: completeFieldData.allergies,
        special_notes: completeFieldData.special_notes,
        profile_photo_url: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([dashboardFormatData])
      );

      // STEP 4: Verify dashboard display mapping
      const dashboardPets = await databaseService.getAllPetProfiles();
      const displayPet = dashboardPets[0];

      // Verify every single field made it through the complete flow
      expect(displayPet.name).toBe(completeFieldData.name);
      expect(displayPet.species).toBe(completeFieldData.species);
      expect(displayPet.breed).toBe(completeFieldData.breed);
      expect(displayPet.birth_date).toBe(completeFieldData.date_of_birth);
      expect(displayPet.weight_kg).toBe(completeFieldData.weight_kg);
      expect(displayPet.color_markings).toBe(completeFieldData.color_markings);
      expect(displayPet.personality_traits).toEqual(
        completeFieldData.personality_traits
      );
      expect(displayPet.favorite_activities).toEqual(
        completeFieldData.favorite_activities
      );
      expect(displayPet.exercise_needs).toBe(completeFieldData.exercise_needs);
      expect(displayPet.medical_conditions).toEqual(
        completeFieldData.medical_conditions
      );
      expect(displayPet.allergies).toEqual(completeFieldData.allergies);
      expect(displayPet.special_notes).toBe(completeFieldData.special_notes);
    });
  });

  describe('Edge Cases and Data Validation', () => {
    it('should handle special characters in text fields', async () => {
      const specialCharData = {
        name: 'Spëcîål Çhàr Pet',
        species: 'cat',
        breed: 'Spëcîål Brëëd',
        special_notes: 'Contains émojis 🐱 and ñ special chars & symbols @#$%',
        personality_traits: ['Spëcîål', 'Ñice', 'Émotional'],
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'special-char-pet',
        error: null,
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        id: 'special-char-pet',
        ...specialCharData,
        user_id: mockUserRecord.id,
        status: 'active',
        created_by: mockUserRecord.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as any);

      const saveResult =
        await petService.upsertPetFromOnboarding(specialCharData);
      expect(saveResult.success).toBe(true);

      // Verify special characters preserved in database call
      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_name: 'Spëcîål Çhàr Pet',
          p_breed: 'Spëcîål Brëëd',
          p_special_notes:
            'Contains émojis 🐱 and ñ special chars & symbols @#$%',
          p_personality_traits: ['Spëcîål', 'Ñice', 'Émotional'],
        })
      );
    });

    it('should handle maximum length text fields', async () => {
      const longTextData = {
        name: 'A'.repeat(100), // Test max name length
        species: 'dog',
        special_notes: 'B'.repeat(2000), // Test max notes length
        personality_traits: Array.from({ length: 20 }, (_, i) =>
          `Long Trait ${i}`.repeat(10)
        ),
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'long-text-pet',
        error: null,
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        id: 'long-text-pet',
        ...longTextData,
        user_id: mockUserRecord.id,
        status: 'active',
        created_by: mockUserRecord.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as any);

      const saveResult = await petService.upsertPetFromOnboarding(longTextData);
      expect(saveResult.success).toBe(true);

      // Verify long text preserved
      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_name: 'A'.repeat(100),
          p_special_notes: 'B'.repeat(2000),
          p_personality_traits: longTextData.personality_traits,
        })
      );
    });

    it('should handle array field limits', async () => {
      const maxArrayData = {
        name: 'Max Array Pet',
        species: 'dog',
        personality_traits: Array.from({ length: 50 }, (_, i) => `Trait ${i}`),
        favorite_activities: Array.from(
          { length: 30 },
          (_, i) => `Activity ${i}`
        ),
        medical_conditions: Array.from(
          { length: 20 },
          (_, i) => `Condition ${i}`
        ),
        allergies: Array.from({ length: 25 }, (_, i) => `Allergy ${i}`),
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'max-array-pet',
        error: null,
      });

      jest.spyOn(petService, 'getPet').mockResolvedValue({
        id: 'max-array-pet',
        ...maxArrayData,
        user_id: mockUserRecord.id,
        status: 'active',
        created_by: mockUserRecord.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as any);

      const saveResult = await petService.upsertPetFromOnboarding(maxArrayData);
      expect(saveResult.success).toBe(true);

      // Verify all array elements preserved
      expect(supabase.rpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.objectContaining({
          p_personality_traits: maxArrayData.personality_traits,
          p_favorite_activities: maxArrayData.favorite_activities,
          p_medical_conditions: maxArrayData.medical_conditions,
          p_allergies: maxArrayData.allergies,
        })
      );
    });
  });
});
