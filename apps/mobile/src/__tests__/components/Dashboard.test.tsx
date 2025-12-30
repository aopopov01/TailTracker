import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from '@testing-library/react-native';
import Dashboard from '../../../app/(tabs)/dashboard';
import { databaseService } from '../../services/databaseService';

// Mock services and navigation
jest.mock('../../services/databaseService', () => ({
  databaseService: {
    getAllPetProfiles: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    callback();
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34 }),
}));

const mockPetProfile = {
  id: 'pet-123',
  name: 'Max',
  species: 'dog',
  breed: 'Golden Retriever',
  birth_date: '2020-01-15',
  weight_kg: 25.5,
  color_markings: 'Golden coat with white chest',
  personality_traits: ['Friendly', 'Energetic', 'Loyal'],
  favorite_activities: ['Playing Fetch', 'Swimming', 'Long Walks'],
  exercise_needs: 'high',
  medical_conditions: ['Hip Dysplasia'],
  special_notes: 'Loves treats and belly rubs',
  profile_photo_url: 'https://example.com/max-photo.jpg',
  photos: [
    {
      id: 'photo-1',
      url: 'https://example.com/max-1.jpg',
      caption: 'Max playing fetch',
    },
    {
      id: 'photo-2',
      url: 'https://example.com/max-2.jpg',
      caption: 'Max swimming',
    },
  ],
};

const mockMultiplePets = [
  mockPetProfile,
  {
    id: 'pet-456',
    name: 'Luna',
    species: 'cat',
    breed: 'Persian',
    birth_date: '2019-06-10',
    weight_kg: 4.2,
    personality_traits: ['Calm', 'Independent'],
    favorite_activities: ['Laser Pointer', 'Window Bird Watching'],
    exercise_needs: 'low',
    profile_photo_url: 'https://example.com/luna-photo.jpg',
  },
];

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pet Card Rendering', () => {
    it('should render pet information correctly', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
        expect(screen.getByText('Golden Retriever')).toBeTruthy();
        expect(screen.getByText('Dog')).toBeTruthy();
      });
    });

    it('should calculate and display age correctly', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        // Pet born in 2020-01-15 should show age in years
        expect(screen.getByText(/4.*years?/i)).toBeTruthy();
      });
    });

    it('should display weight in correct format', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('25.5 kg')).toBeTruthy();
      });
    });

    it('should show profile photo with fallback', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        const profileImage = screen.getByTestId('pet-profile-image-Max');
        expect(profileImage.props.source.uri).toBe(
          'https://example.com/max-photo.jpg'
        );
      });
    });

    it('should render fallback when no profile photo', async () => {
      const petWithoutPhoto = { ...mockPetProfile, profile_photo_url: null };
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        petWithoutPhoto,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('pet-fallback-image-Max')).toBeTruthy();
      });
    });
  });

  describe('FlippablePetCard Functionality', () => {
    it('should flip card when tapped', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        const petCard = screen.getByTestId('pet-card-Max');
        fireEvent.press(petCard);
      });

      await waitFor(() => {
        // Back of card should show detailed information
        expect(screen.getByText('Personality')).toBeTruthy();
        expect(screen.getByText('Friendly')).toBeTruthy();
        expect(screen.getByText('Energetic')).toBeTruthy();
        expect(screen.getByText('Loyal')).toBeTruthy();
      });
    });

    it('should display personality traits as chips', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Max'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('trait-chip-Friendly')).toBeTruthy();
        expect(screen.getByTestId('trait-chip-Energetic')).toBeTruthy();
        expect(screen.getByTestId('trait-chip-Loyal')).toBeTruthy();
      });
    });

    it('should show favorite activities on card back', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Max'));
      });

      await waitFor(() => {
        expect(screen.getByText('Activities')).toBeTruthy();
        expect(screen.getByText('Playing Fetch')).toBeTruthy();
        expect(screen.getByText('Swimming')).toBeTruthy();
        expect(screen.getByText('Long Walks')).toBeTruthy();
      });
    });

    it('should display exercise needs badge', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Max'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('exercise-badge-high')).toBeTruthy();
        expect(screen.getByText('High Exercise')).toBeTruthy();
      });
    });

    it('should show medical conditions if present', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Max'));
      });

      await waitFor(() => {
        expect(screen.getByText('Health')).toBeTruthy();
        expect(screen.getByText('Hip Dysplasia')).toBeTruthy();
      });
    });

    it('should display special notes section', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Max'));
      });

      await waitFor(() => {
        expect(screen.getByText('Notes')).toBeTruthy();
        expect(screen.getByText('Loves treats and belly rubs')).toBeTruthy();
      });
    });

    it('should flip back to front when tapped again', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Max'));
      });

      // Flip back to front
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Max'));
      });

      await waitFor(() => {
        // Should show front again
        expect(screen.getByText('Max')).toBeTruthy();
        expect(screen.getByText('Golden Retriever')).toBeTruthy();
        // Back content should not be visible
        expect(screen.queryByText('Personality')).toBeNull();
      });
    });
  });

  describe('Multiple Pets Display', () => {
    it('should render multiple pet cards correctly', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue(
        mockMultiplePets
      );

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
        expect(screen.getByText('Luna')).toBeTruthy();
        expect(screen.getByText('Golden Retriever')).toBeTruthy();
        expect(screen.getByText('Persian')).toBeTruthy();
      });
    });

    it('should handle different species correctly', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue(
        mockMultiplePets
      );

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dog')).toBeTruthy();
        expect(screen.getByText('Cat')).toBeTruthy();
      });
    });

    it('should display different exercise needs', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue(
        mockMultiplePets
      );

      render(<Dashboard />);

      // Flip Max's card
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Max'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('exercise-badge-high')).toBeTruthy();
      });

      // Flip Luna's card
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Luna'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('exercise-badge-low')).toBeTruthy();
      });
    });
  });

  describe('Data Mapping Verification', () => {
    it('should correctly map onboarding data to display format', async () => {
      const onboardingMappedPet = {
        id: 'mapped-pet',
        name: 'Mapping Test Pet',
        species: 'bird',
        breed: 'Cockatiel',
        birth_date: '2021-03-20',
        personality_traits: ['Vocal', 'Social', 'Intelligent'],
        favorite_activities: ['Singing', 'Foraging Games', 'Perch Swinging'],
        exercise_needs: 'moderate',
        special_notes: 'Loves to mimic sounds',
        medical_conditions: [],
        weight_kg: 0.1,
      };

      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        onboardingMappedPet,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        // Front of card
        expect(screen.getByText('Mapping Test Pet')).toBeTruthy();
        expect(screen.getByText('Cockatiel')).toBeTruthy();
        expect(screen.getByText('Bird')).toBeTruthy();
        expect(screen.getByText('0.1 kg')).toBeTruthy();
      });

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Mapping Test Pet'));
      });

      await waitFor(() => {
        // Personality traits
        expect(screen.getByText('Vocal')).toBeTruthy();
        expect(screen.getByText('Social')).toBeTruthy();
        expect(screen.getByText('Intelligent')).toBeTruthy();

        // Activities
        expect(screen.getByText('Singing')).toBeTruthy();
        expect(screen.getByText('Foraging Games')).toBeTruthy();
        expect(screen.getByText('Perch Swinging')).toBeTruthy();

        // Exercise needs
        expect(screen.getByTestId('exercise-badge-moderate')).toBeTruthy();

        // Notes
        expect(screen.getByText('Loves to mimic sounds')).toBeTruthy();
      });
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalPet = {
        id: 'minimal-pet',
        name: 'Minimal Pet',
        species: 'dog',
        // Most fields undefined/null
      };

      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        minimalPet,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Minimal Pet')).toBeTruthy();
        expect(screen.getByText('Dog')).toBeTruthy();
      });

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Minimal Pet'));
      });

      await waitFor(() => {
        // Should handle missing data gracefully without crashes
        expect(screen.getByTestId('pet-card-Minimal Pet')).toBeTruthy();
      });
    });

    it('should handle empty arrays correctly', async () => {
      const petWithEmptyArrays = {
        id: 'empty-arrays-pet',
        name: 'Empty Arrays Pet',
        species: 'cat',
        personality_traits: [],
        favorite_activities: [],
        medical_conditions: [],
      };

      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        petWithEmptyArrays,
      ]);

      render(<Dashboard />);

      // Flip to back
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('pet-card-Empty Arrays Pet'));
      });

      await waitFor(() => {
        // Should not crash and handle empty arrays
        expect(screen.getByTestId('pet-card-Empty Arrays Pet')).toBeTruthy();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state while fetching pets', async () => {
      // Mock delayed response
      (databaseService.getAllPetProfiles as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      render(<Dashboard />);

      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should handle empty pet list', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([]);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no pets yet/i)).toBeTruthy();
        expect(screen.getByTestId('add-first-pet-button')).toBeTruthy();
      });
    });

    it('should handle service errors gracefully', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error loading pets/i)).toBeTruthy();
        expect(screen.getByTestId('retry-button')).toBeTruthy();
      });
    });

    it('should retry loading pets when retry button is pressed', async () => {
      (databaseService.getAllPetProfiles as jest.Mock)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce([mockPetProfile]);

      render(<Dashboard />);

      await waitFor(() => {
        fireEvent.press(screen.getByTestId('retry-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('Max')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        const petCard = screen.getByTestId('pet-card-Max');
        expect(petCard.props.accessibilityLabel).toBe('Pet profile for Max');
        expect(petCard.props.accessibilityHint).toBe(
          'Double tap to view detailed information'
        );
      });
    });

    it('should announce card flip to screen readers', async () => {
      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue([
        mockPetProfile,
      ]);

      render(<Dashboard />);

      await waitFor(() => {
        const petCard = screen.getByTestId('pet-card-Max');
        fireEvent.press(petCard);
      });

      await waitFor(() => {
        expect(
          screen.getByLabelText(/showing detailed information for Max/i)
        ).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many pets', async () => {
      const manyPets = Array.from({ length: 20 }, (_, i) => ({
        ...mockPetProfile,
        id: `pet-${i}`,
        name: `Pet ${i}`,
      }));

      (databaseService.getAllPetProfiles as jest.Mock).mockResolvedValue(
        manyPets
      );

      const startTime = Date.now();
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Pet 0')).toBeTruthy();
      });

      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
    });
  });
});
