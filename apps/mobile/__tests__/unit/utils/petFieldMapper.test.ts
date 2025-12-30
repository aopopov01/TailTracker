/**
 * Pet Field Mapper Unit Tests
 * Tests the critical data transformation between camelCase (frontend) and snake_case (database)
 * This is foundational infrastructure that all pet data operations depend on
 */

import {
  mapOnboardingToDatabase,
  mapDatabaseToOnboarding,
  validatePetCardFields,
  createDatabasePet,
  PetOnboardingData,
} from '../../../src/utils/petFieldMapper';
import { Pet } from '../../../src/services/PetService';

describe('petFieldMapper', () => {
  // Mock data for testing
  const mockOnboardingData: PetOnboardingData = {
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    colorMarkings: 'Golden with white chest',
    dateOfBirth: new Date('2020-01-15'),
    weight: '25 kg',
    microchipId: '123456789012345',
    medicalConditions: ['Hip dysplasia', 'Allergies'],
    allergies: ['Chicken', 'Grain'],
    medications: ['Heartworm prevention'],
    personalityTraits: ['Friendly', 'Energetic'],
    favoriteActivities: ['Fetch', 'Swimming'],
    exerciseNeeds: 'high',
    specialNotes: 'Loves car rides',
    foodPreferences: {
      favorites: ['Chicken', 'Rice'],
      schedule: 'Twice daily',
      specialDiet: ['Grain-free'],
    },
    photos: ['https://example.com/photo1.jpg'],
    user_id: 'user-123',
  };

  const mockDatabasePet: Pet = {
    id: 'pet-123',
    user_id: 'user-123',
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    color_markings: 'Golden with white chest',
    date_of_birth: '2020-01-15T00:00:00.000Z',
    weight_kg: 25,
    microchip_number: '123456789012345',
    status: 'active',
    medical_conditions: ['Hip dysplasia', 'Allergies'],
    allergies: ['Chicken', 'Grain'],
    personality_traits: ['Friendly', 'Energetic'],
    favorite_activities: ['Fetch', 'Swimming'],
    exercise_needs: 'high',
    favorite_food: 'Chicken, Rice',
    feeding_schedule: 'Twice daily',
    special_diet_notes: 'Grain-free',
    special_notes: 'Loves car rides',
    photo_url: 'https://example.com/photo1.jpg',
    created_by: 'user-123',
    created_at: '2025-01-20T10:00:00.000Z',
    updated_at: '2025-01-20T10:00:00.000Z',
  };

  describe('mapOnboardingToDatabase', () => {
    test('should map basic required fields correctly', () => {
      const basicData: PetOnboardingData = {
        name: 'Buddy',
        species: 'dog',
      };

      const result = mapOnboardingToDatabase(basicData);

      expect(result.name).toBe('Buddy');
      expect(result.species).toBe('dog');
      expect(result.status).toBe('active');
    });

    test('should map camelCase to snake_case fields', () => {
      const result = mapOnboardingToDatabase(mockOnboardingData);

      // Test camelCase -> snake_case conversions
      expect(result.color_markings).toBe('Golden with white chest');
      expect(result.date_of_birth).toBe('2020-01-15T00:00:00.000Z');
      expect(result.microchip_number).toBe('123456789012345');
      expect(result.medical_conditions).toEqual(['Hip dysplasia', 'Allergies']);
      expect(result.personality_traits).toEqual(['Friendly', 'Energetic']);
      expect(result.favorite_activities).toEqual(['Fetch', 'Swimming']);
      expect(result.exercise_needs).toBe('high');
      expect(result.special_notes).toBe('Loves car rides');
    });

    test('should handle weight conversion from string to number', () => {
      const testCases = [
        { input: '25 kg', expected: 25 },
        { input: '55 lbs', expected: 25 }, // 55 lbs ≈ 25 kg
        { input: '30.5 kg', expected: 30.5 },
        { input: '', expected: undefined },
        { input: null, expected: undefined },
        { input: undefined, expected: undefined },
      ];

      testCases.forEach(({ input, expected }) => {
        const data: PetOnboardingData = {
          name: 'Test',
          species: 'dog',
          weight: input as any,
        };
        const result = mapOnboardingToDatabase(data);
        expect(result.weight_kg).toBe(expected);
      });
    });

    test('should handle weight conversion from object format', () => {
      const dataKg: PetOnboardingData = {
        name: 'Test',
        species: 'dog',
        weight: { value: 25, unit: 'kg' } as any,
      };
      const resultKg = mapOnboardingToDatabase(dataKg);
      expect(resultKg.weight_kg).toBe(25);

      const dataLbs: PetOnboardingData = {
        name: 'Test',
        species: 'dog',
        weight: { value: 55, unit: 'lbs' } as any,
      };
      const resultLbs = mapOnboardingToDatabase(dataLbs);
      expect(resultLbs.weight_kg).toBe(25); // 55 lbs ≈ 25 kg
    });

    test('should map food preferences to individual database fields', () => {
      const result = mapOnboardingToDatabase(mockOnboardingData);

      expect(result.favorite_food).toBe('Chicken, Rice');
      expect(result.feeding_schedule).toBe('Twice daily');
      expect(result.special_diet_notes).toBe('Grain-free');
    });

    test('should handle photo array mapping', () => {
      const result = mapOnboardingToDatabase(mockOnboardingData);
      expect(result.photo_url).toBe('https://example.com/photo1.jpg');
    });

    test('should handle microchip field variations', () => {
      const dataWithMicrochipId: PetOnboardingData = {
        name: 'Test',
        species: 'dog',
        microchipId: '123456789',
      };
      const result1 = mapOnboardingToDatabase(dataWithMicrochipId);
      expect(result1.microchip_number).toBe('123456789');

      const dataWithMicrochipNumber: PetOnboardingData = {
        name: 'Test',
        species: 'dog',
        microchip_number: '987654321',
      };
      const result2 = mapOnboardingToDatabase(dataWithMicrochipNumber);
      expect(result2.microchip_number).toBe('987654321');
    });

    test('should handle null and undefined values gracefully', () => {
      const dataWithNulls: PetOnboardingData = {
        name: 'Test',
        species: 'dog',
        breed: null as any,
        weight: null,
        dateOfBirth: null,
        allergies: undefined,
        specialNotes: '',
      };

      const result = mapOnboardingToDatabase(dataWithNulls);

      expect(result.name).toBe('Test');
      expect(result.species).toBe('dog');
      expect(result.weight_kg).toBe(undefined);
      expect(result.date_of_birth).toBe(undefined);
      expect(result.special_notes).toBe('');
    });
  });

  describe('mapDatabaseToOnboarding', () => {
    test('should map snake_case back to camelCase', () => {
      const result = mapDatabaseToOnboarding(mockDatabasePet);

      expect(result.name).toBe('Max');
      expect(result.species).toBe('dog');
      expect(result.colorMarkings).toBe('Golden with white chest');
      expect(result.microchipId).toBe('123456789012345');
      expect(result.medicalConditions).toEqual(['Hip dysplasia', 'Allergies']);
      expect(result.personalityTraits).toEqual(['Friendly', 'Energetic']);
      expect(result.favoriteActivities).toEqual(['Fetch', 'Swimming']);
    });

    test('should handle date conversion from string to Date object', () => {
      const result = mapDatabaseToOnboarding(mockDatabasePet);
      expect(result.dateOfBirth).toBeInstanceOf(Date);
      expect(result.dateOfBirth?.getFullYear()).toBe(2020);
    });

    test('should handle null date values', () => {
      const petWithNullDate = { ...mockDatabasePet, date_of_birth: null };
      const result = mapDatabaseToOnboarding(petWithNullDate);
      expect(result.dateOfBirth).toBe(undefined);
    });

    test('should format weight with units', () => {
      const result = mapDatabaseToOnboarding(mockDatabasePet);
      expect(result.weight).toBe('25 kg');
    });

    test('should handle null weight', () => {
      const petWithNullWeight = { ...mockDatabasePet, weight_kg: null };
      const result = mapDatabaseToOnboarding(petWithNullWeight);
      expect(result.weight).toBe(undefined);
    });

    test('should reconstruct food preferences object', () => {
      const result = mapDatabaseToOnboarding(mockDatabasePet);
      expect(result.foodPreferences).toEqual({
        favorites: ['Chicken', 'Rice'],
        schedule: 'Twice daily',
        specialDiet: ['Grain-free'],
      });
    });

    test('should map photo URL to photos array', () => {
      const result = mapDatabaseToOnboarding(mockDatabasePet);
      expect(result.photos).toEqual(['https://example.com/photo1.jpg']);
    });

    test('should handle missing optional fields', () => {
      const minimalPet: Pet = {
        id: 'pet-123',
        user_id: 'user-123',
        name: 'Simple Pet',
        species: 'cat',
        status: 'active',
      };

      const result = mapDatabaseToOnboarding(minimalPet);
      expect(result.name).toBe('Simple Pet');
      expect(result.species).toBe('cat');
      expect(result.breed).toBeUndefined();
      expect(result.weight).toBeUndefined();
    });
  });

  describe('validatePetCardFields', () => {
    test('should return empty array for valid pet with required fields', () => {
      const validPet: Pet = {
        id: 'pet-123',
        user_id: 'user-123',
        name: 'Valid Pet',
        species: 'dog',
        status: 'active',
      };

      const missing = validatePetCardFields(validPet);
      expect(missing).toEqual([]);
    });

    test('should identify missing required fields', () => {
      const invalidPet: Pet = {
        id: 'pet-123',
        user_id: 'user-123',
        name: '',
        species: '',
        status: 'active',
      };

      const missing = validatePetCardFields(invalidPet);
      expect(missing).toContain('name');
      expect(missing).toContain('species');
    });

    test('should handle pet without name', () => {
      const petWithoutName: Pet = {
        id: 'pet-123',
        user_id: 'user-123',
        name: '',
        species: 'dog',
        status: 'active',
      };

      const missing = validatePetCardFields(petWithoutName);
      expect(missing).toEqual(['name']);
    });

    test('should handle pet without species', () => {
      const petWithoutSpecies: Pet = {
        id: 'pet-123',
        user_id: 'user-123',
        name: 'Pet',
        species: '',
        status: 'active',
      };

      const missing = validatePetCardFields(petWithoutSpecies);
      expect(missing).toEqual(['species']);
    });
  });

  describe('createDatabasePet', () => {
    test('should create database-ready pet with all required fields', () => {
      const userId = 'user-456';
      const result = createDatabasePet(mockOnboardingData, userId);

      expect(result.user_id).toBe(userId);
      expect(result.created_by).toBe(userId);
      expect(result.name).toBe('Max');
      expect(result.species).toBe('dog');
      expect(result.status).toBe('active');
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
      expect(typeof result.created_at).toBe('string');
      expect(typeof result.updated_at).toBe('string');
    });

    test('should override user_id from onboarding data', () => {
      const onboardingWithUserId = {
        ...mockOnboardingData,
        user_id: 'old-user',
      };
      const newUserId = 'new-user-123';

      const result = createDatabasePet(onboardingWithUserId, newUserId);

      expect(result.user_id).toBe(newUserId);
      expect(result.created_by).toBe(newUserId);
    });

    test('should set timestamps as ISO strings', () => {
      const result = createDatabasePet(mockOnboardingData, 'user-123');

      expect(result.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(result.updated_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );

      // Should be recent timestamps
      const createdAt = new Date(result.created_at!);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      expect(diffMs).toBeLessThan(1000); // Within 1 second
    });

    test('should include all mapped onboarding fields', () => {
      const result = createDatabasePet(mockOnboardingData, 'user-123');

      // Test critical field mappings
      expect(result.color_markings).toBe('Golden with white chest');
      expect(result.weight_kg).toBe(25);
      expect(result.microchip_number).toBe('123456789012345');
      expect(result.medical_conditions).toEqual(['Hip dysplasia', 'Allergies']);
      expect(result.favorite_food).toBe('Chicken, Rice');
      expect(result.photo_url).toBe('https://example.com/photo1.jpg');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty onboarding data', () => {
      const emptyData: PetOnboardingData = {
        name: '',
        species: 'dog',
      };

      const result = mapOnboardingToDatabase(emptyData);
      expect(result.name).toBe('');
      expect(result.species).toBe('dog');
      expect(result.status).toBe('active');
    });

    test('should handle malformed weight strings', () => {
      const trulyMalformedCases = ['invalid', 'kg', 'twenty kg', 'abc kg'];

      trulyMalformedCases.forEach(weight => {
        const data: PetOnboardingData = {
          name: 'Test',
          species: 'dog',
          weight,
        };
        const result = mapOnboardingToDatabase(data);
        // Should not crash and should handle gracefully by returning undefined
        expect(result.weight_kg).toBe(undefined);
      });
    });

    test('should handle partially parseable weight strings', () => {
      // These strings contain valid numbers that can be extracted
      const partiallyValidCases = [
        { input: '25.5.5 kg', expected: 25.5 }, // Extracts first valid number
        { input: '30kg extra text', expected: 30 },
        { input: '12.5 kg and more', expected: 12.5 },
      ];

      partiallyValidCases.forEach(({ input, expected }) => {
        const data: PetOnboardingData = {
          name: 'Test',
          species: 'dog',
          weight: input,
        };
        const result = mapOnboardingToDatabase(data);
        expect(result.weight_kg).toBe(expected);
      });
    });

    test('should handle empty arrays', () => {
      const dataWithEmptyArrays: PetOnboardingData = {
        name: 'Test',
        species: 'dog',
        medicalConditions: [],
        allergies: [],
        personalityTraits: [],
        favoriteActivities: [],
        photos: [],
      };

      const result = mapOnboardingToDatabase(dataWithEmptyArrays);
      expect(result.medical_conditions).toEqual([]);
      expect(result.allergies).toEqual([]);
      expect(result.personality_traits).toEqual([]);
      expect(result.favorite_activities).toEqual([]);
      expect(result.photo_url).toBeUndefined();
    });

    test('should handle invalid date objects', () => {
      const dataWithInvalidDate: PetOnboardingData = {
        name: 'Test',
        species: 'dog',
        dateOfBirth: new Date('invalid-date'),
      };

      expect(() => {
        mapOnboardingToDatabase(dataWithInvalidDate);
      }).not.toThrow();
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency in round-trip conversion', () => {
      // Convert onboarding -> database -> onboarding
      const databaseFormat = mapOnboardingToDatabase(mockOnboardingData);
      const mockDatabasePetComplete = {
        ...databaseFormat,
        id: 'test-id',
        created_at: '2025-01-20T10:00:00.000Z',
        updated_at: '2025-01-20T10:00:00.000Z',
      } as Pet;

      const backToOnboarding = mapDatabaseToOnboarding(mockDatabasePetComplete);

      // Test key fields maintain consistency
      expect(backToOnboarding.name).toBe(mockOnboardingData.name);
      expect(backToOnboarding.species).toBe(mockOnboardingData.species);
      expect(backToOnboarding.breed).toBe(mockOnboardingData.breed);
      expect(backToOnboarding.microchipId).toBe(mockOnboardingData.microchipId);
      expect(backToOnboarding.medicalConditions).toEqual(
        mockOnboardingData.medicalConditions
      );
      expect(backToOnboarding.personalityTraits).toEqual(
        mockOnboardingData.personalityTraits
      );
    });

    test('should handle species type safety', () => {
      const validSpecies = ['dog', 'cat', 'bird', 'other'];

      validSpecies.forEach(species => {
        const data: PetOnboardingData = {
          name: 'Test',
          species: species as any,
        };
        const result = mapOnboardingToDatabase(data);
        expect(result.species).toBe(species);
      });
    });

    test('should handle gender type safety', () => {
      const validGenders = ['male', 'female', 'unknown'];

      validGenders.forEach(gender => {
        const data: PetOnboardingData = {
          name: 'Test',
          species: 'dog',
          gender: gender as any,
        };
        const result = mapOnboardingToDatabase(data);
        expect(result.gender).toBe(gender);
      });
    });
  });
});
