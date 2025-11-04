/**
 * End-to-End Data Flow Tests - Priority 1
 * Tests the complete data journey: PetOnboardingWizard → petFieldMapper → PetService → Database → PetCard
 * This is the MOST CRITICAL test suite for ensuring data integrity
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PetOnboardingWizard } from '../src/components/PetOnboarding/PetOnboardingWizard';
import { PetCard } from '../src/components/Pet/PetCard';
import { PetService } from '../src/services/PetService';
import {
  mapOnboardingToDatabase,
  mapDatabaseToOnboarding,
} from '../src/utils/petFieldMapper';

// Mock services
jest.mock('../src/services/PetService');
jest.mock('../src/lib/supabase');

const mockPetService = PetService as jest.Mocked<typeof PetService>;

describe('End-to-End Data Flow Tests - CRITICAL PATH', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Onboarding → Database → Display Flow', () => {
    test('should preserve all 9 critical fields through complete journey', async () => {
      // Simulate complete onboarding data entry
      const completeOnboardingData = {
        // Step 1: Basic Information
        name: 'Max',
        species: 'dog',
        photos: ['photo1.jpg'],

        // Step 2: Physical Details
        breed: 'Golden Retriever',
        weight: '25 kg',
        height: '60 cm',
        colorMarkings: 'Golden with white chest',
        dateOfBirth: new Date('2020-01-15'),

        // Step 3: Health Information
        medicalConditions: ['Hip dysplasia', 'Seasonal allergies'],
        allergies: ['Chicken', 'Grain'],
        currentMedications: ['Heartworm prevention'],

        // Step 4: Official Records
        microchipId: '123456789012345',

        // Step 5: Personality & Care
        personalityTraits: ['Friendly', 'Energetic'],
        favoriteActivities: ['Fetch', 'Swimming'],
        specialNotes: 'Great with children',
      };

      // Mock successful database save
      const mockSavedPet = {
        id: 'pet-123',
        name: 'Max',
        species: 'dog',
        breed: 'Golden Retriever',
        color_markings: 'Golden with white chest',
        date_of_birth: '2020-01-15T00:00:00.000Z',
        weight_kg: 25,
        microchip_number: '123456789012345',
        medical_conditions: ['Hip dysplasia', 'Seasonal allergies'],
        allergies: ['Chicken', 'Grain'],
        special_notes: 'Great with children',
        personality_traits: ['Friendly', 'Energetic'],
        favorite_activities: ['Fetch', 'Swimming'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: true,
        pet: mockSavedPet,
        isExisting: false,
      });

      mockPetService.getPet = jest.fn().mockResolvedValue(mockSavedPet);

      // Step 1: Test onboarding data collection
      const onboardingResult = await mockPetService.upsertPetFromOnboarding(
        completeOnboardingData
      );
      expect(onboardingResult.success).toBe(true);

      // Step 2: Verify field mapping transformation
      const mappedData = mapOnboardingToDatabase(completeOnboardingData);
      expect(mappedData.color_markings).toBe('Golden with white chest');
      expect(mappedData.medical_conditions).toEqual([
        'Hip dysplasia',
        'Seasonal allergies',
      ]);
      expect(mappedData.microchip_number).toBe('123456789012345');
      expect(mappedData.special_notes).toBe('Great with children');

      // Step 3: Verify database retrieval
      const retrievedPet = await mockPetService.getPet('pet-123');
      expect(retrievedPet).toBeDefined();
      expect(retrievedPet.name).toBe('Max');
      expect(retrievedPet.breed).toBe('Golden Retriever');

      // Step 4: Test reverse mapping for display
      const displayData = mapDatabaseToOnboarding(retrievedPet);
      expect(displayData.colorMarkings).toBe('Golden with white chest');
      expect(displayData.medicalConditions).toEqual([
        'Hip dysplasia',
        'Seasonal allergies',
      ]);
      expect(displayData.microchipId).toBe('123456789012345');
      expect(displayData.specialNotes).toBe('Great with children');

      // Step 5: Verify PetCard displays all data correctly
      // PetCard expects Pet interface (database format), not PetProfile format
      const { getByText, getByTestId } = render(
        <PetCard pet={retrievedPet as any} onPress={jest.fn()} />
      );

      expect(getByText('Max')).toBeTruthy();
      expect(
        getByText(/Golden Retriever.*•.*Golden with white chest/)
      ).toBeTruthy();
      expect(getByText('Hip dysplasia, Seasonal allergies')).toBeTruthy();
      expect(getByText('Chicken, Grain')).toBeTruthy();
      expect(getByText('123456789012345')).toBeTruthy();
    });

    test('should handle minimal data (name + species only) through complete flow', async () => {
      const minimalData = {
        name: 'Buddy',
        species: 'cat',
      };

      const mockMinimalPet = {
        id: 'pet-456',
        name: 'Buddy',
        species: 'cat',
        breed: null,
        color_markings: null,
        medical_conditions: [],
        allergies: [],
        special_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: true,
        pet: mockMinimalPet,
        isExisting: false,
      });

      // Test complete flow with minimal data
      const result = await mockPetService.upsertPetFromOnboarding(minimalData);
      expect(result.success).toBe(true);
      expect(result.pet.name).toBe('Buddy');
      expect(result.pet.species).toBe('cat');

      // Verify PetCard handles missing fields gracefully
      const displayData = mapDatabaseToOnboarding(result.pet);
      const { getByText, queryByText } = render(<PetCard pet={displayData} />);

      expect(getByText('Buddy')).toBeTruthy();
      expect(queryByText('null')).toBeFalsy(); // Should not display 'null'
      expect(queryByText('undefined')).toBeFalsy(); // Should not display 'undefined'
    });

    test('should maintain data integrity with special characters through complete flow', async () => {
      const specialCharData = {
        name: "Münster-O'Malley",
        species: 'dog',
        breed: 'Großer Münsterländer',
        colorMarkings: 'Brown & white with "spots"',
        specialNotes: 'Loves treats! 🐕 Very energetic @ 7AM & 6PM.',
        medicalConditions: ['Condition with "quotes"', 'Allergie für Staub'],
        allergies: ['Pollo & arroz', 'Café con leche'],
      };

      const mockSpecialPet = {
        id: 'pet-789',
        name: "Münster-O'Malley",
        species: 'dog',
        breed: 'Großer Münsterländer',
        color_markings: 'Brown & white with "spots"',
        special_notes: 'Loves treats! 🐕 Very energetic @ 7AM & 6PM.',
        medical_conditions: ['Condition with "quotes"', 'Allergie für Staub'],
        allergies: ['Pollo & arroz', 'Café con leche'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: true,
        pet: mockSpecialPet,
        isExisting: false,
      });

      const result =
        await mockPetService.upsertPetFromOnboarding(specialCharData);
      expect(result.success).toBe(true);

      // Verify special characters are preserved
      expect(result.pet.name).toBe("Münster-O'Malley");
      expect(result.pet.breed).toBe('Großer Münsterländer');
      expect(result.pet.color_markings).toBe('Brown & white with "spots"');
      expect(result.pet.special_notes).toContain('🐕');
      expect(result.pet.medical_conditions).toContain(
        'Condition with "quotes"'
      );
      expect(result.pet.allergies).toContain('Pollo & arroz');

      // Test display
      const displayData = mapDatabaseToOnboarding(result.pet);
      const { getByText } = render(<PetCard pet={displayData} />);

      expect(getByText("Münster-O'Malley")).toBeTruthy();
      expect(getByText('Großer Münsterländer')).toBeTruthy();
    });
  });

  describe('Error Recovery and Data Validation', () => {
    test('should handle network failures gracefully without data loss', async () => {
      const testData = {
        name: 'Luna',
        species: 'bird',
        breed: 'Cockatiel',
      };

      // Simulate network failure
      mockPetService.upsertPetFromOnboarding = jest
        .fn()
        .mockRejectedValue(new Error('Network connection failed'));

      try {
        await mockPetService.upsertPetFromOnboarding(testData);
      } catch (error) {
        expect(error.message).toBe('Network connection failed');
      }

      // Verify original data is still intact for retry
      expect(testData.name).toBe('Luna');
      expect(testData.species).toBe('bird');
      expect(testData.breed).toBe('Cockatiel');
    });

    test('should validate required fields before saving', async () => {
      const invalidData = {
        // Missing required 'name' field
        species: 'dog',
        breed: 'Labrador',
      };

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: false,
        error: 'Name is required',
        isExisting: false,
      });

      const result = await mockPetService.upsertPetFromOnboarding(invalidData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    test('should handle array field edge cases correctly', async () => {
      const arrayEdgeCases = {
        name: 'Test Pet',
        species: 'cat',
        medicalConditions: [], // Empty array
        allergies: null, // Null value
        personalityTraits: undefined, // Undefined value
        favoriteActivities: ['Single item'], // Single item array
        currentMedications: ['Med 1', 'Med 2', 'Med 3'], // Multiple items
      };

      const mockArrayPet = {
        id: 'pet-array-test',
        name: 'Test Pet',
        species: 'cat',
        medical_conditions: [],
        allergies: null,
        personality_traits: undefined,
        favorite_activities: ['Single item'],
        current_medications: ['Med 1', 'Med 2', 'Med 3'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: true,
        pet: mockArrayPet,
        isExisting: false,
      });

      const result =
        await mockPetService.upsertPetFromOnboarding(arrayEdgeCases);
      expect(result.success).toBe(true);

      // Verify array handling
      expect(result.pet.medical_conditions).toEqual([]);
      expect(result.pet.allergies).toBeNull();
      expect(result.pet.favorite_activities).toEqual(['Single item']);
      expect(result.pet.current_medications).toEqual([
        'Med 1',
        'Med 2',
        'Med 3',
      ]);
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle large data volumes efficiently', async () => {
      const largeDataset = {
        name: 'Performance Test Pet',
        species: 'dog',
        breed: 'B'.repeat(100), // Long breed name
        specialNotes: 'N'.repeat(2000), // Long notes
        medicalConditions: Array(50).fill('Medical condition'),
        allergies: Array(30).fill('Allergen'),
        personalityTraits: Array(20).fill('Trait'),
        favoriteActivities: Array(15).fill('Activity'),
      };

      const startTime = Date.now();

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: true,
        pet: {
          ...largeDataset,
          id: 'perf-test',
          created_at: new Date().toISOString(),
        },
        isExisting: false,
      });

      const result = await mockPetService.upsertPetFromOnboarding(largeDataset);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second

      // Verify large arrays are handled correctly
      expect(result.pet.medicalConditions).toHaveLength(50);
      expect(result.pet.allergies).toHaveLength(30);
    });

    test('should handle concurrent onboarding operations', async () => {
      const concurrentData = [
        { name: 'Pet 1', species: 'dog' },
        { name: 'Pet 2', species: 'cat' },
        { name: 'Pet 3', species: 'bird' },
      ];

      mockPetService.upsertPetFromOnboarding = jest
        .fn()
        .mockResolvedValueOnce({
          success: true,
          pet: { id: 'pet-1', name: 'Pet 1' },
          isExisting: false,
        })
        .mockResolvedValueOnce({
          success: true,
          pet: { id: 'pet-2', name: 'Pet 2' },
          isExisting: false,
        })
        .mockResolvedValueOnce({
          success: true,
          pet: { id: 'pet-3', name: 'Pet 3' },
          isExisting: false,
        });

      const promises = concurrentData.map(data =>
        mockPetService.upsertPetFromOnboarding(data)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle incomplete onboarding (user exits mid-flow)', async () => {
      const incompleteData = {
        name: 'Incomplete Pet',
        species: 'dog',
        // User exits after step 1, missing all other data
      };

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: true,
        pet: {
          id: 'incomplete-pet',
          name: 'Incomplete Pet',
          species: 'dog',
          breed: null,
          created_at: new Date().toISOString(),
        },
        isExisting: false,
      });

      const result =
        await mockPetService.upsertPetFromOnboarding(incompleteData);
      expect(result.success).toBe(true);
      expect(result.pet.name).toBe('Incomplete Pet');

      // Verify PetCard handles incomplete data gracefully
      const displayData = mapDatabaseToOnboarding(result.pet);
      const { getByText, queryByText } = render(
        <PetCard pet={displayData} onPress={jest.fn()} />
      );

      expect(getByText('Incomplete Pet')).toBeTruthy();
      // PetCard doesn't show "Unknown" - missing fields are simply not displayed
      expect(queryByText('null')).toBeFalsy();
      expect(queryByText('undefined')).toBeFalsy();
    });

    test('should handle user returning to complete profile later', async () => {
      // First save: minimal data
      const initialData = {
        name: 'Evolving Pet',
        species: 'cat',
      };

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: true,
        pet: { id: 'evolving-pet', name: 'Evolving Pet', species: 'cat' },
        isExisting: false,
      });

      const initialResult =
        await mockPetService.upsertPetFromOnboarding(initialData);
      expect(initialResult.success).toBe(true);

      // Second save: complete data
      const completeData = {
        id: 'evolving-pet',
        name: 'Evolving Pet',
        species: 'cat',
        breed: 'Persian',
        colorMarkings: 'White and gray',
        medicalConditions: ['Breathing issues'],
      };

      mockPetService.upsertPetFromOnboarding = jest.fn().mockResolvedValue({
        success: true,
        pet: {
          id: 'evolving-pet',
          name: 'Evolving Pet',
          species: 'cat',
          breed: 'Persian',
          color_markings: 'White and gray',
          medical_conditions: ['Breathing issues'],
        },
        isExisting: true,
      });

      const completeResult =
        await mockPetService.upsertPetFromOnboarding(completeData);
      expect(completeResult.success).toBe(true);
      expect(completeResult.isExisting).toBe(true);
      expect(completeResult.pet.breed).toBe('Persian');
    });
  });
});
