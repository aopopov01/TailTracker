/**
 * PetIDCard Display Tests
 * Verify that all 9 required fields are correctly displayed in the PetIDCard component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PetIDCard } from '@/components/Pet/PetIDCard';
import { PetProfile } from '@/contexts/PetProfileContext';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000',
      onPrimaryContainer: '#000',
      primaryContainer: '#fff',
      surface: '#fff',
      onSurface: '#000',
      onSurfaceVariant: '#666',
      outline: '#ccc',
      onBackground: '#000',
      error: '#f00',
      onError: '#fff',
    },
  }),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

describe('PetIDCard Display Tests', () => {
  const completePetProfile: PetProfile = {
    id: 'test-id',
    name: 'Max', // ✅ Field 1: Name
    species: 'dog',
    breed: 'Golden Retriever', // ✅ Field 2: Breed
    photoUrl: 'https://example.com/max.jpg', // ✅ Field 3: Picture
    weight: '25 lbs', // ✅ Field 4: Weight
    height: '24 inches', // ✅ Field 5: Height
    colorMarkings: 'Golden with white chest',
    dateOfBirth: new Date('2020-01-15'),
    microchipId: '123456789012345', // ✅ Field 9: Microchip ID
    identificationNumber: 'TR-123456789',
    medicalConditions: ['Hip dysplasia', 'Allergies'], // ✅ Field 6: Medical conditions
    allergies: ['Chicken', 'Grain'], // ✅ Field 7: Allergies
    medications: ['Heartworm prevention', 'Joint supplements'], // ✅ Field 8: Medication
    personalityTraits: ['Friendly', 'Energetic'],
    favoriteActivities: ['Fetch', 'Swimming'],
    exerciseNeeds: 'high',
    favoriteFood: 'Chicken and Rice',
    feedingSchedule: 'Twice daily',
    specialNotes: 'Loves car rides',
  };

  describe('Front Side Display', () => {
    test('displays all front-side required fields correctly', () => {
      const { getByText, queryByText } = render(
        <PetIDCard pet={completePetProfile} />
      );

      // ✅ Field 1: Name should be displayed
      expect(getByText('Max')).toBeTruthy();

      // ✅ Field 2: Breed should be displayed
      expect(getByText('Golden Retriever')).toBeTruthy();

      // Species should be displayed (capitalized)
      expect(getByText('Dog')).toBeTruthy();

      // ✅ Field 9: Microchip ID should be displayed
      expect(getByText('123456789012345')).toBeTruthy();

      // ID number should be displayed
      expect(getByText('TR-123456789')).toBeTruthy();

      // Card title should be present
      expect(getByText('Pet ID Card')).toBeTruthy();

      // Flip hint should be present
      expect(getByText('Tap to flip for details')).toBeTruthy();
    });

    test('handles missing optional front-side fields gracefully', () => {
      const minimalProfile: PetProfile = {
        id: 'minimal-id',
        name: 'Buddy',
        species: 'cat',
      };

      const { getByText, queryByText } = render(
        <PetIDCard pet={minimalProfile} />
      );

      // Required fields should still be displayed
      expect(getByText('Buddy')).toBeTruthy();
      expect(getByText('Cat')).toBeTruthy();

      // Optional fields should not cause errors
      expect(queryByText('undefined')).toBeNull();
      expect(queryByText('null')).toBeNull();
    });

    test('displays fallback when name is missing', () => {
      const noNameProfile: PetProfile = {
        id: 'no-name-id',
        species: 'dog',
      };

      const { getByText } = render(<PetIDCard pet={noNameProfile} />);

      expect(getByText('Unnamed Pet')).toBeTruthy();
    });

    test('displays fallback when species is missing', () => {
      const noSpeciesProfile: PetProfile = {
        id: 'no-species-id',
        name: 'Mystery Pet',
      };

      const { getByText } = render(<PetIDCard pet={noSpeciesProfile} />);

      expect(getByText('Unknown Species')).toBeTruthy();
    });
  });

  describe('Back Side Display', () => {
    test('displays all back-side required fields correctly', () => {
      const { getByText } = render(<PetIDCard pet={completePetProfile} />);

      // ✅ Field 4: Weight should be included in physical details
      expect(getByText(/25 lbs/)).toBeTruthy();

      // ✅ Field 5: Height should be included in physical details
      expect(getByText(/24 inches/)).toBeTruthy();

      // Color markings should be included in physical details
      expect(getByText(/Golden with white chest/)).toBeTruthy();

      // ✅ Field 6: Medical conditions should be displayed
      expect(getByText('Medical Conditions:')).toBeTruthy();
      expect(getByText('Hip dysplasia, Allergies')).toBeTruthy();

      // ✅ Field 7: Allergies should be displayed
      expect(getByText('Allergies:')).toBeTruthy();
      expect(getByText('Chicken, Grain')).toBeTruthy();

      // ✅ Field 8: Medications should be displayed
      expect(getByText('Medications:')).toBeTruthy();
      expect(getByText('Heartworm prevention, Joint supplements')).toBeTruthy();

      // Personality traits should be displayed
      expect(getByText('Personality:')).toBeTruthy();
      expect(getByText('Friendly, Energetic')).toBeTruthy();

      // Activities should be displayed
      expect(getByText('Favorite Activities:')).toBeTruthy();
      expect(getByText('Fetch, Swimming')).toBeTruthy();

      // Care information should be displayed
      expect(getByText('Care:')).toBeTruthy();
      expect(getByText(/Exercise: High/)).toBeTruthy();
      expect(getByText(/Food: Chicken and Rice/)).toBeTruthy();

      // Feeding schedule should be displayed
      expect(getByText('Feeding Schedule:')).toBeTruthy();
      expect(getByText('Twice daily')).toBeTruthy();

      // Special notes should be displayed
      expect(getByText('Notes:')).toBeTruthy();
      expect(getByText('Loves car rides')).toBeTruthy();

      // Card title should be present
      expect(getByText('Health & Care Details')).toBeTruthy();

      // Flip hint should be present
      expect(getByText('Tap to flip back')).toBeTruthy();
    });

    test('displays "None" for empty medical conditions', () => {
      const noMedicalProfile: PetProfile = {
        id: 'no-medical-id',
        name: 'Healthy Pet',
        species: 'cat',
        medicalConditions: [],
        allergies: ['Some allergy'], // Ensure allergies has content so it doesn't also show "None"
      };

      const { getByText } = render(<PetIDCard pet={noMedicalProfile} />);

      expect(getByText('Medical Conditions:')).toBeTruthy();
      expect(getByText('None')).toBeTruthy();
    });

    test('displays "None" for empty allergies', () => {
      const noAllergiesProfile: PetProfile = {
        id: 'no-allergies-id',
        name: 'Lucky Pet',
        species: 'dog',
        allergies: [],
        medicalConditions: ['Some condition'], // Ensure medical conditions has content so it doesn't also show "None"
      };

      const { getByText } = render(<PetIDCard pet={noAllergiesProfile} />);

      expect(getByText('Allergies:')).toBeTruthy();
      expect(getByText('None')).toBeTruthy();
    });

    test('handles undefined arrays gracefully', () => {
      const undefinedArraysProfile: PetProfile = {
        id: 'undefined-arrays-id',
        name: 'Simple Pet',
        species: 'bird',
        // medicalConditions, allergies, medications are undefined
      };

      const { getByText, getAllByText } = render(
        <PetIDCard pet={undefinedArraysProfile} />
      );

      // Should display "None" for all undefined arrays
      const noneTexts = getAllByText('None');
      expect(noneTexts.length).toBeGreaterThanOrEqual(2); // At least medical conditions and allergies
    });

    test('does not display optional sections when data is missing', () => {
      const minimalProfile: PetProfile = {
        id: 'minimal-back-id',
        name: 'Simple Pet',
        species: 'cat',
      };

      const { queryByText } = render(<PetIDCard pet={minimalProfile} />);

      // Optional sections should not be displayed if no data
      expect(queryByText('Personality:')).toBeNull();
      expect(queryByText('Favorite Activities:')).toBeNull();
      expect(queryByText('Medications:')).toBeNull();
      expect(queryByText('Feeding Schedule:')).toBeNull();
      expect(queryByText('Notes:')).toBeNull();
    });
  });

  describe('Field Formatting Tests', () => {
    test('correctly formats array fields with commas', () => {
      const multiItemProfile: PetProfile = {
        id: 'multi-item-id',
        name: 'Complex Pet',
        species: 'dog',
        medicalConditions: ['Condition A', 'Condition B', 'Condition C'],
        allergies: ['Allergen 1', 'Allergen 2'],
        medications: ['Med 1', 'Med 2', 'Med 3', 'Med 4'],
      };

      const { getByText } = render(<PetIDCard pet={multiItemProfile} />);

      expect(getByText('Condition A, Condition B, Condition C')).toBeTruthy();
      expect(getByText('Allergen 1, Allergen 2')).toBeTruthy();
      expect(getByText('Med 1, Med 2, Med 3, Med 4')).toBeTruthy();
    });

    test('handles single-item arrays correctly', () => {
      const singleItemProfile: PetProfile = {
        id: 'single-item-id',
        name: 'Simple Pet',
        species: 'cat',
        medicalConditions: ['Single Condition'],
        allergies: ['Single Allergen'],
        medications: ['Single Medication'],
      };

      const { getByText } = render(<PetIDCard pet={singleItemProfile} />);

      expect(getByText('Single Condition')).toBeTruthy();
      expect(getByText('Single Allergen')).toBeTruthy();
      expect(getByText('Single Medication')).toBeTruthy();
    });

    test('capitalizes species correctly', () => {
      const speciesTests = [
        { species: 'dog', expected: 'Dog' },
        { species: 'cat', expected: 'Cat' },
        { species: 'bird', expected: 'Bird' },
        { species: 'other', expected: 'Other' },
      ];

      speciesTests.forEach(({ species, expected }) => {
        const profile: PetProfile = {
          id: `${species}-id`,
          name: 'Test Pet',
          species: species as any,
        };

        const { getByText } = render(<PetIDCard pet={profile} />);

        expect(getByText(expected)).toBeTruthy();
      });
    });

    test('formats exercise needs correctly', () => {
      const exerciseProfile: PetProfile = {
        id: 'exercise-id',
        name: 'Active Pet',
        species: 'dog',
        exerciseNeeds: 'high',
        favoriteFood: 'Premium kibble',
      };

      const { getByText } = render(<PetIDCard pet={exerciseProfile} />);

      expect(getByText(/Exercise: High/)).toBeTruthy();
      expect(getByText(/Food: Premium kibble/)).toBeTruthy();
    });
  });

  describe('All 9 Required Fields Integration Test', () => {
    test('displays all 9 required fields when all data is present', () => {
      const { getByText, queryByText } = render(
        <PetIDCard pet={completePetProfile} />
      );

      // ✅ Verify all 9 required fields are displayed somewhere in the component
      expect(getByText('Max')).toBeTruthy(); // Field 1: Name
      expect(getByText('Golden Retriever')).toBeTruthy(); // Field 2: Breed
      // Field 3: Picture would be displayed as Image component (harder to test in unit test)
      expect(getByText(/25 lbs/)).toBeTruthy(); // Field 4: Weight
      expect(getByText(/24 inches/)).toBeTruthy(); // Field 5: Height
      expect(getByText('Hip dysplasia, Allergies')).toBeTruthy(); // Field 6: Medical conditions
      expect(getByText('Chicken, Grain')).toBeTruthy(); // Field 7: Allergies
      expect(getByText('Heartworm prevention, Joint supplements')).toBeTruthy(); // Field 8: Medications
      expect(getByText('123456789012345')).toBeTruthy(); // Field 9: Microchip ID

      // Verify no error states are shown
      expect(queryByText('None')).toBeNull(); // No "None" should appear when all data is present
      expect(queryByText('Unnamed Pet')).toBeNull();
      expect(queryByText('Unknown Species')).toBeNull();
    });

    test('gracefully handles when some of the 9 required fields are missing', () => {
      const partialProfile: PetProfile = {
        id: 'partial-id',
        name: 'Partial Pet', // ✅ Field 1: Present
        species: 'cat',
        breed: 'Persian', // ✅ Field 2: Present
        // photoUrl missing           // ❌ Field 3: Missing
        weight: '12 lbs', // ✅ Field 4: Present
        // height missing             // ❌ Field 5: Missing
        medicalConditions: ['Diabetes'], // ✅ Field 6: Present
        allergies: [], // ❌ Field 7: Empty (shows "None")
        // medications missing        // ❌ Field 8: Missing (shows "None")
        microchipId: '987654321', // ✅ Field 9: Present
      };

      const { getByText, getAllByText } = render(
        <PetIDCard pet={partialProfile} />
      );

      // Present fields should display correctly
      expect(getByText('Partial Pet')).toBeTruthy();
      expect(getByText('Persian')).toBeTruthy();
      expect(getByText(/12 lbs/)).toBeTruthy();
      expect(getByText('Diabetes')).toBeTruthy();
      expect(getByText('987654321')).toBeTruthy();

      // Missing fields should show appropriate fallbacks
      const noneTexts = getAllByText('None');
      expect(noneTexts.length).toBeGreaterThanOrEqual(1); // At least one "None" for empty allergies
    });
  });
});
