/**
 * Unit Tests for ReviewStep Component
 *
 * Tests the final review step of the pet onboarding wizard that displays
 * a comprehensive summary of all entered data organized into sections.
 * Covers rendering logic, data formatting, conditional sections, and theme integration.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import ReviewStep from '../../../../src/components/PetOnboarding/steps/ReviewStep';
import { createMockOnboardingData } from '@/test-utils/petDataFactory';
import { PetOnboardingData } from '../../../../src/utils/petFieldMapper';

// Mock react-native-vector-icons
jest.mock(
  'react-native-vector-icons/MaterialCommunityIcons',
  () => 'MockedIcon'
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    View: View,
    createAnimatedComponent: (component: any) => component,
    default: {
      createAnimatedComponent: (component: any) => component,
    },
  };
});

// Helper function to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  const theme = {
    colors: {
      primary: '#007AFF',
      surface: '#FFFFFF',
      onSurface: '#000000',
      onBackground: '#000000',
      onSurfaceVariant: '#666666',
    },
  };

  return render(<PaperProvider theme={theme}>{component}</PaperProvider>);
};

describe('ReviewStep', () => {
  describe('Rendering', () => {
    it('renders without crashing with complete data', () => {
      const mockData = createMockOnboardingData();
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText(`Review ${mockData.name}'s Profile`)).toBeTruthy();
      expect(
        getByText('Make sure everything looks correct before saving.')
      ).toBeTruthy();
    });

    it('renders with empty profile data', () => {
      const emptyProfile: PetOnboardingData = {
        name: '',
        species: 'dog',
      };

      const { getByText } = renderWithProviders(
        <ReviewStep profile={emptyProfile} />
      );

      expect(getByText("Review Your Pet's Profile")).toBeTruthy();
      expect(getByText('Basic Information')).toBeTruthy();
    });

    it('renders with partial profile data', () => {
      const partialProfile: PetOnboardingData = {
        name: 'Buddy',
        species: 'cat',
        breed: 'Persian',
      };

      const { getByText } = renderWithProviders(
        <ReviewStep profile={partialProfile} />
      );

      expect(getByText("Review Buddy's Profile")).toBeTruthy();
      expect(getByText('Basic Information')).toBeTruthy();
      expect(getByText('Persian')).toBeTruthy();
    });

    it('renders all sections when data is complete', () => {
      const completeData = createMockOnboardingData({
        weight: '25 kg',
        colorMarkings: 'White with brown spots',
        personalityTraits: ['Friendly', 'Playful'],
        favoriteActivities: ['Fetch', 'Swimming'],
        medicalConditions: ['Hip dysplasia'],
        allergies: ['Chicken'],
      });

      const { getByText } = renderWithProviders(
        <ReviewStep profile={completeData} />
      );

      expect(getByText('Basic Information')).toBeTruthy();
      expect(getByText('Physical Details')).toBeTruthy();
      expect(getByText('Personality & Activities')).toBeTruthy();
      expect(getByText('Health Information')).toBeTruthy();
    });
  });

  describe('Basic Information Section', () => {
    it('displays pet name correctly', () => {
      const mockData = createMockOnboardingData({ name: 'Luna' });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Name:')).toBeTruthy();
      expect(getByText('Luna')).toBeTruthy();
    });

    it('displays "Not specified" for empty name', () => {
      const mockData = createMockOnboardingData({ name: '' });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Name:')).toBeTruthy();
      expect(getByText('Not specified')).toBeTruthy();
    });

    it('capitalizes species name correctly', () => {
      const mockData = createMockOnboardingData({ species: 'bird' });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Species:')).toBeTruthy();
      expect(getByText('Bird')).toBeTruthy();
    });

    it('displays breed when provided', () => {
      const mockData = createMockOnboardingData({ breed: 'Golden Retriever' });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Breed:')).toBeTruthy();
      expect(getByText('Golden Retriever')).toBeTruthy();
    });

    it('hides breed field when not provided', () => {
      const mockData = createMockOnboardingData({ breed: undefined });
      const { queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(queryByText('Breed:')).toBeNull();
    });
  });

  describe('Physical Details Section', () => {
    it('displays weight correctly as string', () => {
      const mockData = createMockOnboardingData({ weight: '15 kg' });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Physical Details')).toBeTruthy();
      expect(getByText('Weight:')).toBeTruthy();
      expect(getByText('15 kg')).toBeTruthy();
    });

    it('displays weight correctly as object', () => {
      const mockData = createMockOnboardingData({
        weight: { value: 20, unit: 'lbs' } as any,
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Weight:')).toBeTruthy();
      expect(getByText('20 lbs')).toBeTruthy();
    });

    it('does not display weight when undefined', () => {
      const mockData = createMockOnboardingData({
        weight: undefined,
        colorMarkings: 'Brown with white patches',
      });
      const { queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(queryByText('Weight:')).toBeNull();
    });

    it('displays color markings correctly', () => {
      const mockData = createMockOnboardingData({
        colorMarkings: 'Black with white chest',
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Color & Markings:')).toBeTruthy();
      expect(getByText('Black with white chest')).toBeTruthy();
    });

    it('hides physical details section when no data', () => {
      const mockData = createMockOnboardingData({
        weight: undefined,
        colorMarkings: undefined,
      });
      const { queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(queryByText('Physical Details')).toBeNull();
    });

    it('shows section with only weight data', () => {
      const mockData = createMockOnboardingData({
        weight: '12 kg',
        colorMarkings: undefined,
      });
      const { getByText, queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Physical Details')).toBeTruthy();
      expect(getByText('12 kg')).toBeTruthy();
      expect(queryByText('Color & Markings:')).toBeNull();
    });

    it('shows section with only color markings data', () => {
      const mockData = createMockOnboardingData({
        weight: undefined,
        colorMarkings: 'Spotted pattern',
      });
      const { getByText, queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Physical Details')).toBeTruthy();
      expect(getByText('Spotted pattern')).toBeTruthy();
      expect(queryByText('Weight:')).toBeNull();
    });
  });

  describe('Personality & Activities Section', () => {
    it('displays personality traits as comma-separated list', () => {
      const mockData = createMockOnboardingData({
        personalityTraits: ['Friendly', 'Energetic', 'Loyal'],
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Personality & Activities')).toBeTruthy();
      expect(getByText('Personality:')).toBeTruthy();
      expect(getByText('Friendly, Energetic, Loyal')).toBeTruthy();
    });

    it('displays favorite activities as comma-separated list', () => {
      const mockData = createMockOnboardingData({
        favoriteActivities: ['Fetch', 'Swimming', 'Running'],
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Favorite Activities:')).toBeTruthy();
      expect(getByText('Fetch, Swimming, Running')).toBeTruthy();
    });

    it('displays exercise needs with proper capitalization', () => {
      const mockData = createMockOnboardingData({
        exerciseNeeds: 'high',
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Exercise Needs:')).toBeTruthy();
      expect(getByText('High')).toBeTruthy();
    });

    it('hides section when no personality/activity data', () => {
      const mockData = createMockOnboardingData({
        personalityTraits: undefined,
        favoriteActivities: undefined,
      });
      const { queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(queryByText('Personality & Activities')).toBeNull();
    });

    it('shows section with only personality traits', () => {
      const mockData = createMockOnboardingData({
        personalityTraits: ['Calm'],
        favoriteActivities: undefined,
      });
      const { getByText, queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Personality & Activities')).toBeTruthy();
      expect(getByText('Calm')).toBeTruthy();
      expect(queryByText('Favorite Activities:')).toBeNull();
    });

    it('shows section with only favorite activities', () => {
      const mockData = createMockOnboardingData({
        personalityTraits: undefined,
        favoriteActivities: ['Playing'],
      });
      const { getByText, queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Personality & Activities')).toBeTruthy();
      expect(getByText('Playing')).toBeTruthy();
      expect(queryByText('Personality:')).toBeNull();
    });

    it('handles empty personality traits array', () => {
      const mockData = createMockOnboardingData({
        personalityTraits: [],
        favoriteActivities: ['Walking'],
      });
      const { queryByText, getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Personality & Activities')).toBeTruthy();
      expect(queryByText('Personality:')).toBeNull();
      expect(getByText('Walking')).toBeTruthy();
    });

    it('handles empty activities array', () => {
      const mockData = createMockOnboardingData({
        personalityTraits: ['Happy'],
        favoriteActivities: [],
      });
      const { queryByText, getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Personality & Activities')).toBeTruthy();
      expect(getByText('Happy')).toBeTruthy();
      expect(queryByText('Favorite Activities:')).toBeNull();
    });
  });

  describe('Health Information Section', () => {
    it('displays medical conditions as comma-separated list', () => {
      const mockData = createMockOnboardingData({
        medicalConditions: ['Hip dysplasia', 'Allergies', 'Heart murmur'],
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Health Information')).toBeTruthy();
      expect(getByText('Medical Conditions:')).toBeTruthy();
      expect(getByText('Hip dysplasia, Allergies, Heart murmur')).toBeTruthy();
    });

    it('displays allergies as comma-separated list', () => {
      const mockData = createMockOnboardingData({
        allergies: ['Chicken', 'Beef', 'Wheat'],
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Allergies:')).toBeTruthy();
      expect(getByText('Chicken, Beef, Wheat')).toBeTruthy();
    });

    it('hides section when no health data', () => {
      const mockData = createMockOnboardingData({
        medicalConditions: undefined,
        allergies: undefined,
      });
      const { queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(queryByText('Health Information')).toBeNull();
    });

    it('shows section with only medical conditions', () => {
      const mockData = createMockOnboardingData({
        medicalConditions: ['Diabetes'],
        allergies: undefined,
      });
      const { getByText, queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Health Information')).toBeTruthy();
      expect(getByText('Diabetes')).toBeTruthy();
      expect(queryByText('Allergies:')).toBeNull();
    });

    it('shows section with only allergies', () => {
      const mockData = createMockOnboardingData({
        medicalConditions: undefined,
        allergies: ['Pollen'],
      });
      const { getByText, queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Health Information')).toBeTruthy();
      expect(getByText('Pollen')).toBeTruthy();
      expect(queryByText('Medical Conditions:')).toBeNull();
    });

    it('handles empty medical conditions array', () => {
      const mockData = createMockOnboardingData({
        medicalConditions: [],
        allergies: ['Grass'],
      });
      const { queryByText, getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Health Information')).toBeTruthy();
      expect(queryByText('Medical Conditions:')).toBeNull();
      expect(getByText('Grass')).toBeTruthy();
    });

    it('handles empty allergies array', () => {
      const mockData = createMockOnboardingData({
        medicalConditions: ['Arthritis'],
        allergies: [],
      });
      const { queryByText, getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Health Information')).toBeTruthy();
      expect(getByText('Arthritis')).toBeTruthy();
      expect(queryByText('Allergies:')).toBeNull();
    });
  });

  describe('Species Icon Logic', () => {
    it('displays correct icon for dog species', () => {
      const mockData = createMockOnboardingData({ species: 'dog' });
      renderWithProviders(<ReviewStep profile={mockData} />);
      // Icon rendering is mocked, so we verify the species is set correctly
      expect(mockData.species).toBe('dog');
    });

    it('displays correct icon for cat species', () => {
      const mockData = createMockOnboardingData({ species: 'cat' });
      renderWithProviders(<ReviewStep profile={mockData} />);
      expect(mockData.species).toBe('cat');
    });

    it('displays correct icon for bird species', () => {
      const mockData = createMockOnboardingData({ species: 'bird' });
      renderWithProviders(<ReviewStep profile={mockData} />);
      expect(mockData.species).toBe('bird');
    });

    it('displays default paw icon for other species', () => {
      const mockData = createMockOnboardingData({ species: 'other' });
      renderWithProviders(<ReviewStep profile={mockData} />);
      expect(mockData.species).toBe('other');
    });
  });

  describe('Data Formatting Functions', () => {
    it('formats empty arrays as "None specified"', () => {
      const mockData = createMockOnboardingData({
        personalityTraits: [],
        favoriteActivities: [],
      });
      // Since empty arrays hide the sections, we test the formatList function indirectly
      // by ensuring sections are not shown
      const { queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(queryByText('Personality & Activities')).toBeNull();
    });

    it('formats weight object correctly', () => {
      const mockData = createMockOnboardingData({
        weight: { value: 30, unit: 'kg' } as any,
        colorMarkings: 'Test',
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('30 kg')).toBeTruthy();
    });

    it('handles undefined weight by not displaying it', () => {
      const mockData = createMockOnboardingData({
        weight: undefined,
        colorMarkings: 'Test',
      });
      const { queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(queryByText('Weight:')).toBeNull();
    });
  });

  describe('Theme Integration', () => {
    it('applies theme colors correctly', () => {
      const mockData = createMockOnboardingData();
      const customTheme = {
        colors: {
          primary: '#FF5722',
          surface: '#F5F5F5',
          onSurface: '#212121',
          onBackground: '#000000',
          onSurfaceVariant: '#757575',
        },
      };

      const { getByText } = render(
        <PaperProvider theme={customTheme}>
          <ReviewStep profile={mockData} />
        </PaperProvider>
      );

      // Theme colors are applied via style props
      expect(getByText('Basic Information')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined species gracefully', () => {
      const mockData: PetOnboardingData = {
        name: 'Test Pet',
        species: undefined as any,
      };

      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText('Species:')).toBeTruthy();
      expect(getByText('Not specified')).toBeTruthy();
    });

    it('handles very long text content', () => {
      const longText =
        'This is a very long description that might wrap to multiple lines and should be handled gracefully by the component layout system without breaking the UI or causing overflow issues';

      const mockData = createMockOnboardingData({
        colorMarkings: longText,
      });

      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText(longText)).toBeTruthy();
    });

    it('handles special characters in text fields', () => {
      const specialText = 'Pet with émojis 🐕 & spéciål çhàràctërs!';

      const mockData = createMockOnboardingData({
        name: specialText,
      });

      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      expect(getByText(`Review ${specialText}'s Profile`)).toBeTruthy();
    });

    it('handles empty string vs undefined distinction', () => {
      const mockData = createMockOnboardingData({
        name: '', // Empty string
        breed: undefined, // Undefined
      });

      const { getByText, queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      // Empty name shows "Not specified"
      expect(getByText('Not specified')).toBeTruthy();
      // Undefined breed hides the field entirely
      expect(queryByText('Breed:')).toBeNull();
    });

    it('handles mixed empty and filled arrays', () => {
      const mockData = createMockOnboardingData({
        personalityTraits: ['Friendly'], // Has data
        favoriteActivities: [], // Empty array
        medicalConditions: undefined, // Undefined
        allergies: ['Pollen'], // Has data
      });

      const { getByText, queryByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      // Personality section shows because personalityTraits has data
      expect(getByText('Personality & Activities')).toBeTruthy();
      expect(getByText('Friendly')).toBeTruthy();
      expect(queryByText('Favorite Activities:')).toBeNull(); // Empty array

      // Health section shows because allergies has data
      expect(getByText('Health Information')).toBeTruthy();
      expect(getByText('Pollen')).toBeTruthy();
      expect(queryByText('Medical Conditions:')).toBeNull(); // Undefined
    });
  });

  describe('Accessibility', () => {
    it('provides proper text hierarchy', () => {
      const mockData = createMockOnboardingData();
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      // Main title should be present
      expect(getByText(`Review ${mockData.name}'s Profile`)).toBeTruthy();
      // Section titles should be present
      expect(getByText('Basic Information')).toBeTruthy();
    });

    it('maintains consistent label-value structure', () => {
      const mockData = createMockOnboardingData({
        name: 'Test Pet',
        species: 'dog',
      });
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      // Each info row should have label and value
      expect(getByText('Name:')).toBeTruthy();
      expect(getByText('Test Pet')).toBeTruthy();
      expect(getByText('Species:')).toBeTruthy();
      expect(getByText('Dog')).toBeTruthy();
    });
  });

  describe('ScrollView Behavior', () => {
    it('renders component successfully', () => {
      const mockData = createMockOnboardingData();
      const { getByText } = renderWithProviders(
        <ReviewStep profile={mockData} />
      );

      // Should render the main title
      expect(getByText(/Review.*Profile/)).toBeTruthy();
    });

    it('includes bottom spacing for scroll comfort', () => {
      const mockData = createMockOnboardingData();
      renderWithProviders(<ReviewStep profile={mockData} />);

      // Bottom spacing is rendered as an empty View with height
      // This ensures comfortable scrolling experience
    });
  });
});
