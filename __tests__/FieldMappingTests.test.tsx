/**
 * Critical Field Mapping Tests - Priority 1
 * Tests the core petFieldMapper.ts utility that transforms data between
 * onboarding (camelCase) and database (snake_case) formats
 */

import {
  mapOnboardingToDatabase,
  mapDatabaseToOnboarding,
} from '../src/utils/petFieldMapper';
import { PetProfile } from '../src/types/Pet';
import { DatabasePet } from '../src/types/Pet';

describe('Field Mapping Tests - CRITICAL DATA FLOW', () => {
  describe('mapOnboardingToDatabase - camelCase → snake_case', () => {
    test('should map all critical field transformations correctly', () => {
      const onboardingData: Partial<PetProfile> = {
        // Test critical field mappings
        colorMarkings: 'Golden with white chest',
        medicalConditions: ['Hip dysplasia', 'Allergies'],
        specialNotes: 'Very friendly dog',
        personalityTraits: ['Energetic', 'Loyal'],
        favoriteActivities: ['Fetch', 'Swimming'],
        dateOfBirth: new Date('2020-01-15'),
        microchipId: '123456789012345',

        // Test standard fields
        name: 'Max',
        species: 'dog',
        breed: 'Golden Retriever',
        weight: '25 kg',
        height: '60 cm',
        allergies: ['Chicken', 'Grain'],
      };

      const mapped = mapOnboardingToDatabase(onboardingData);

      // Verify critical field name transformations
      expect(mapped.color_markings).toBe('Golden with white chest');
      expect(mapped.medical_conditions).toEqual(['Hip dysplasia', 'Allergies']);
      expect(mapped.special_notes).toBe('Very friendly dog');
      expect(mapped.personality_traits).toEqual(['Energetic', 'Loyal']);
      expect(mapped.favorite_activities).toEqual(['Fetch', 'Swimming']);
      expect(mapped.date_of_birth).toBe('2020-01-15T00:00:00.000Z');
      expect(mapped.microchip_number).toBe('123456789012345');

      // Verify standard fields remain correct
      expect(mapped.name).toBe('Max');
      expect(mapped.species).toBe('dog');
      expect(mapped.breed).toBe('Golden Retriever');
      expect(mapped.allergies).toEqual(['Chicken', 'Grain']);
    });

    test('should handle null and undefined values correctly', () => {
      const onboardingData: Partial<PetProfile> = {
        name: 'Buddy',
        species: 'cat',
        colorMarkings: undefined,
        medicalConditions: null,
        specialNotes: '',
        personalityTraits: [],
        dateOfBirth: null,
      };

      const mapped = mapOnboardingToDatabase(onboardingData);

      expect(mapped.name).toBe('Buddy');
      expect(mapped.species).toBe('cat');
      expect(mapped.color_markings).toBeUndefined();
      expect(mapped.medical_conditions).toBeNull();
      expect(mapped.special_notes).toBe('');
      expect(mapped.personality_traits).toEqual([]);
      expect(mapped.date_of_birth).toBe(undefined);
    });

    test('should handle empty arrays vs undefined arrays', () => {
      const onboardingData: Partial<PetProfile> = {
        name: 'Luna',
        species: 'bird',
        medicalConditions: [], // Empty array
        allergies: undefined, // Undefined
        personalityTraits: ['Vocal'], // Non-empty array
      };

      const mapped = mapOnboardingToDatabase(onboardingData);

      expect(mapped.medical_conditions).toEqual([]);
      expect(mapped.allergies).toBeUndefined();
      expect(mapped.personality_traits).toEqual(['Vocal']);
    });

    test('should handle special characters and unicode', () => {
      const onboardingData: Partial<PetProfile> = {
        name: "Münster-O'Malley",
        breed: 'Großer Münsterländer/Mix',
        colorMarkings: 'Brown & white with "spots"',
        specialNotes: 'Loves treats! 🐕 Very energetic @ 7AM & 6PM.',
        medicalConditions: ['Condition with "quotes"', 'Allergie für Staub'],
        personalityTraits: ['Très énergique', 'Súper amigable'],
      };

      const mapped = mapOnboardingToDatabase(onboardingData);

      expect(mapped.name).toBe("Münster-O'Malley");
      expect(mapped.breed).toBe('Großer Münsterländer/Mix');
      expect(mapped.color_markings).toBe('Brown & white with "spots"');
      expect(mapped.special_notes).toBe(
        'Loves treats! 🐕 Very energetic @ 7AM & 6PM.'
      );
      expect(mapped.medical_conditions).toContain('Condition with "quotes"');
      expect(mapped.personality_traits).toContain('Très énergique');
    });

    test('should handle weight format transformations', () => {
      const testCases = [
        { input: '25 kg', expected: 25 },
        { input: '55 lbs', expected: 25 }, // Approximate conversion
        { input: { value: 30, unit: 'kg' }, expected: 30 },
        { input: { value: 66, unit: 'lbs' }, expected: 30 }, // Approximate conversion
        { input: '25', expected: 25 }, // Number string
        { input: '', expected: undefined },
        { input: undefined, expected: undefined },
      ];

      testCases.forEach(({ input, expected }) => {
        const onboardingData: Partial<PetProfile> = {
          name: 'Test',
          species: 'dog',
          weight: input,
        };

        const mapped = mapOnboardingToDatabase(onboardingData);
        expect(mapped.weight_kg).toBe(expected);
      });
    });
  });

  describe('mapDatabaseToOnboarding - snake_case → camelCase', () => {
    test('should reverse map all critical fields correctly', () => {
      const databaseData: Partial<DatabasePet> = {
        id: 'pet-123',
        name: 'Rex',
        species: 'dog',
        breed: 'German Shepherd',
        color_markings: 'Black and tan',
        medical_conditions: ['Hip dysplasia', 'Arthritis'],
        special_notes: 'Rescue dog, very gentle',
        personality_traits: ['Protective', 'Intelligent'],
        favorite_activities: ['Guarding', 'Training'],
        date_of_birth: '2019-03-10T00:00:00.000Z',
        microchip_number: '987654321098765',
        weight_kg: 35,
        allergies: ['Beef', 'Soy'],
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-06-01T00:00:00.000Z',
      };

      const mapped = mapDatabaseToOnboarding(databaseData);

      // Verify critical reverse field transformations
      expect(mapped.colorMarkings).toBe('Black and tan');
      expect(mapped.medicalConditions).toEqual(['Hip dysplasia', 'Arthritis']);
      expect(mapped.specialNotes).toBe('Rescue dog, very gentle');
      expect(mapped.personalityTraits).toEqual(['Protective', 'Intelligent']);
      expect(mapped.favoriteActivities).toEqual(['Guarding', 'Training']);
      expect(mapped.dateOfBirth).toEqual(new Date('2019-03-10T00:00:00.000Z'));
      expect(mapped.microchipId).toBe('987654321098765');
      expect(mapped.weight).toBe('35 kg');

      // Verify standard fields (note: id is not part of onboarding data)
      expect(mapped.name).toBe('Rex');
      expect(mapped.breed).toBe('German Shepherd');
      expect(mapped.allergies).toEqual(['Beef', 'Soy']);
    });

    test('should handle missing database fields gracefully', () => {
      const databaseData: Partial<DatabasePet> = {
        id: 'pet-456',
        name: 'Whiskers',
        species: 'cat',
        // Many fields missing
        medical_conditions: null,
        allergies: [],
        weight_kg: null,
      };

      const mapped = mapDatabaseToOnboarding(databaseData);

      expect(mapped.name).toBe('Whiskers');
      expect(mapped.species).toBe('cat');
      expect(mapped.medicalConditions).toBeNull();
      expect(mapped.allergies).toEqual([]);
      expect(mapped.weight).toBe(undefined);
      expect(mapped.colorMarkings).toBeUndefined();
    });
  });

  describe('Round-trip Data Integrity', () => {
    test('should maintain data integrity through round-trip transformation', () => {
      const originalData: Partial<PetProfile> = {
        name: 'Buddy',
        species: 'dog',
        breed: 'Labrador',
        colorMarkings: 'Chocolate brown',
        medicalConditions: ['Allergies', 'Hip dysplasia'],
        specialNotes: 'Very friendly with children',
        personalityTraits: ['Gentle', 'Playful'],
        favoriteActivities: ['Swimming', 'Fetch'],
        allergies: ['Chicken'],
        weight: '30 kg',
        microchipId: '111222333444555',
      };

      // Forward transformation
      const dbFormat = mapOnboardingToDatabase(originalData);

      // Reverse transformation
      const backToOnboarding = mapDatabaseToOnboarding(dbFormat);

      // Verify data integrity (accounting for weight format change)
      expect(backToOnboarding.name).toBe(originalData.name);
      expect(backToOnboarding.breed).toBe(originalData.breed);
      expect(backToOnboarding.colorMarkings).toBe(originalData.colorMarkings);
      expect(backToOnboarding.medicalConditions).toEqual(
        originalData.medicalConditions
      );
      expect(backToOnboarding.specialNotes).toBe(originalData.specialNotes);
      expect(backToOnboarding.personalityTraits).toEqual(
        originalData.personalityTraits
      );
      expect(backToOnboarding.favoriteActivities).toEqual(
        originalData.favoriteActivities
      );
      expect(backToOnboarding.allergies).toEqual(originalData.allergies);
      expect(backToOnboarding.microchipId).toBe(originalData.microchipId);
      // Weight format changes: '30 kg' → 30 → '30 kg'
      expect(backToOnboarding.weight).toBe('30 kg');
    });

    test('should handle edge cases in round-trip transformation', () => {
      const edgeCaseData: Partial<PetProfile> = {
        name: '',
        species: 'other',
        medicalConditions: [],
        allergies: null,
        specialNotes: undefined,
        weight: '',
        microchipId: '',
      };

      const dbFormat = mapOnboardingToDatabase(edgeCaseData);
      const backToOnboarding = mapDatabaseToOnboarding(dbFormat);

      expect(backToOnboarding.name).toBe('');
      expect(backToOnboarding.species).toBe('other');
      expect(backToOnboarding.medicalConditions).toEqual([]);
      expect(backToOnboarding.allergies).toBeNull();
      expect(backToOnboarding.specialNotes).toBeUndefined();
      expect(backToOnboarding.weight).toBe(undefined);
      expect(backToOnboarding.microchipId).toBe('');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', () => {
      const largeDataset: Partial<PetProfile> = {
        name: 'A'.repeat(100),
        breed: 'B'.repeat(200),
        specialNotes: 'C'.repeat(1000),
        medicalConditions: Array(50).fill('Medical condition'),
        personalityTraits: Array(20).fill('Trait'),
        favoriteActivities: Array(15).fill('Activity'),
        allergies: Array(30).fill('Allergen'),
      };

      const startTime = performance.now();
      const mapped = mapOnboardingToDatabase(largeDataset);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
      expect(mapped.name).toBe('A'.repeat(100));
      expect(mapped.medical_conditions).toHaveLength(50);
      expect(mapped.personality_traits).toHaveLength(20);
    });
  });

  describe('Error Handling', () => {
    test('should handle corrupted data gracefully', () => {
      const corruptedData = {
        name: 123, // Wrong type
        medicalConditions: 'should be array', // Wrong type
        dateOfBirth: 'invalid date', // Invalid date
        weight: { invalid: 'object' }, // Invalid weight format
      };

      expect(() => {
        mapOnboardingToDatabase(corruptedData as any);
      }).not.toThrow();
    });

    test('should handle circular references', () => {
      const circularData: any = { name: 'Test' };
      circularData.self = circularData;

      expect(() => {
        mapOnboardingToDatabase(circularData);
      }).not.toThrow();
    });
  });
});
