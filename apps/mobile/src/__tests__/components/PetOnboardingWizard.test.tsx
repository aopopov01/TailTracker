import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PetOnboardingWizard } from '../../components/PetOnboarding/PetOnboardingWizard';
import { PetPersonalityService } from '../../services/PetPersonalityService';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Create a stateful mock that actually updates
let currentMockProfile = {
  name: '',
  species: '',
  breed: '',
  personality_traits: [] as string[],
  favorite_activities: [] as string[],
  exercise_needs: 'moderate' as const,
  special_notes: '',
};

let currentMockIsLoading = false;

const mockSetCurrentProfile = jest.fn((updater: any) => {
  if (typeof updater === 'function') {
    currentMockProfile = updater(currentMockProfile);
  } else {
    currentMockProfile = { ...currentMockProfile, ...updater };
  }
});

const mockHandleSave = jest.fn().mockResolvedValue(undefined);

const mockResetProfile = jest.fn(() => {
  currentMockProfile = {
    name: '',
    species: '',
    breed: '',
    personality_traits: [],
    favorite_activities: [],
    exercise_needs: 'moderate',
    special_notes: '',
  };
});

// Mock services and hooks
jest.mock('../../hooks/usePetProfile');

const usePetProfileMock = require('../../hooks/usePetProfile')
  .usePetProfile as jest.MockedFunction<any>;

// Set default implementation that returns current state
usePetProfileMock.mockImplementation(() => ({
  currentProfile: currentMockProfile,
  setCurrentProfile: mockSetCurrentProfile,
  isLoading: currentMockIsLoading,
  handleSave: mockHandleSave,
  resetProfile: mockResetProfile,
}));

jest.mock('../../services/PetPersonalityService', () => ({
  PetPersonalityService: {
    getAllFavoriteActivities: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('PetOnboardingWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetCurrentProfile.mockClear();
    mockHandleSave.mockClear();
    mockResetProfile.mockClear();

    // Reset state
    currentMockProfile = {
      name: '',
      species: '',
      breed: '',
      personality_traits: [],
      favorite_activities: [],
      exercise_needs: 'moderate',
      special_notes: '',
    };
    currentMockIsLoading = false;

    // Ensure mock returns current state
    usePetProfileMock.mockImplementation(() => ({
      currentProfile: currentMockProfile,
      setCurrentProfile: mockSetCurrentProfile,
      isLoading: currentMockIsLoading,
      handleSave: mockHandleSave,
      resetProfile: mockResetProfile,
    }));

    // Setup default mock returns
    (
      PetPersonalityService.getAllFavoriteActivities as jest.Mock
    ).mockReturnValue(['Playing Fetch', 'Long Walks', 'Swimming', 'Dog Parks']);
  });

  describe('Step Navigation', () => {
    it('should start at step 1 with basic information', () => {
      render(<PetOnboardingWizard />);

      expect(screen.getByText(/basic information/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/pet name/i)).toBeTruthy();
    });

    it('should navigate forward through steps', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Fill required fields for step 1
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Max');
      fireEvent.press(screen.getByTestId('species-dog'));

      // Manually update mock profile to simulate state update
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Max',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      // Navigate to step 2
      fireEvent.press(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByText(/physical details/i)).toBeTruthy();
      });
    });

    it('should navigate backward through steps', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Navigate forward first
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Max');
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update mock profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Max',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      fireEvent.press(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByText(/physical details/i)).toBeTruthy();
      });

      // Navigate back
      fireEvent.press(screen.getByTestId('back-button'));

      await waitFor(() => {
        expect(screen.getByText(/basic information/i)).toBeTruthy();
      });
    });

    it('should prevent advancing with incomplete required fields', () => {
      render(<PetOnboardingWizard />);

      // Try to advance without filling required fields
      fireEvent.press(screen.getByTestId('next-button'));

      // Should show validation alert
      expect(Alert.alert).toHaveBeenCalledWith(
        'Required Field',
        'Pet name is required'
      );

      // Should still be on step 1
      expect(screen.getByText(/basic information/i)).toBeTruthy();
    });
  });

  describe('Species-Specific Activity Flow', () => {
    it('should show dog activities when dog species is selected', async () => {
      const dogActivities = [
        {
          id: 'fetch',
          label: 'Playing Fetch',
          description: 'Retrieving thrown objects',
          species: ['dog'],
        },
        {
          id: 'walks',
          label: 'Long Walks',
          description: 'Extended outdoor exercise',
          species: ['dog'],
        },
        {
          id: 'parks',
          label: 'Dog Parks',
          description: 'Socializing with other dogs',
          species: ['dog'],
        },
        {
          id: 'swimming',
          label: 'Swimming',
          description: 'Water-based exercise',
          species: ['dog'],
        },
      ];
      (
        PetPersonalityService.getAllFavoriteActivities as jest.Mock
      ).mockReturnValue(dogActivities);

      const { rerender } = render(<PetOnboardingWizard />);

      // Fill step 1 with dog selection
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Max');
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update mock profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Max',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      // Navigate to step 6 (activities)
      for (let i = 0; i < 5; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByText(/favorite activities/i)).toBeTruthy();
        expect(screen.getByText('Playing Fetch')).toBeTruthy();
        expect(screen.getByText('Dog Parks')).toBeTruthy();
      });
    });

    it('should show cat activities when cat species is selected', async () => {
      const catActivities = [
        {
          id: 'laser',
          label: 'Laser Pointer',
          description: 'Chasing light',
          species: ['cat'],
        },
        {
          id: 'birds',
          label: 'Window Bird Watching',
          description: 'Observing wildlife',
          species: ['cat'],
        },
        {
          id: 'catnip',
          label: 'Catnip Toys',
          description: 'Interactive play',
          species: ['cat'],
        },
      ];
      (
        PetPersonalityService.getAllFavoriteActivities as jest.Mock
      ).mockReturnValue(catActivities);

      const { rerender } = render(<PetOnboardingWizard />);

      // Fill step 1 with cat selection
      fireEvent.changeText(
        screen.getByPlaceholderText(/pet name/i),
        'Whiskers'
      );
      fireEvent.press(screen.getByTestId('species-cat'));

      // Update mock profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Whiskers',
        species: 'cat',
      };
      rerender(<PetOnboardingWizard />);

      // Navigate to step 6 (activities)
      for (let i = 0; i < 5; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByText(/favorite activities/i)).toBeTruthy();
        expect(screen.getByText('Laser Pointer')).toBeTruthy();
        expect(screen.getByText('Window Bird Watching')).toBeTruthy();
      });
    });

    it('should update activities when species changes', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Start with dog
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Pet');
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Pet',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      // Change to cat
      fireEvent.press(screen.getByTestId('species-cat'));

      // Update profile
      currentMockProfile = { ...currentMockProfile, species: 'cat' };
      rerender(<PetOnboardingWizard />);

      // Verify getAllFavoriteActivities called with new species
      expect(
        PetPersonalityService.getAllFavoriteActivities
      ).toHaveBeenCalledWith('cat');
    });
  });

  describe('Data Persistence', () => {
    it('should persist form data when navigating between steps', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Fill step 1
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Bella');
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Bella',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      fireEvent.press(screen.getByTestId('next-button'));

      // Fill step 2
      await waitFor(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText(/breed/i),
          'Golden Retriever'
        );
      });

      // Update profile
      currentMockProfile = { ...currentMockProfile, breed: 'Golden Retriever' };
      rerender(<PetOnboardingWizard />);

      fireEvent.press(screen.getByTestId('next-button'));

      // Navigate back to step 1
      fireEvent.press(screen.getByTestId('back-button'));
      fireEvent.press(screen.getByTestId('back-button'));

      // Verify data is still there
      await waitFor(() => {
        expect(screen.getByDisplayValue('Bella')).toBeTruthy();
      });
    });

    it('should clear profile data on cancellation', async () => {
      const onCancel = jest.fn();
      render(<PetOnboardingWizard onCancel={onCancel} />);

      // Fill some data
      fireEvent.changeText(
        screen.getByPlaceholderText(/pet name/i),
        'Test Pet'
      );

      // Cancel
      fireEvent.press(screen.getByTestId('cancel-button'));

      // Verify resetProfile was called
      expect(mockResetProfile).toHaveBeenCalled();

      // Verify onCancel callback was called
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Field Validation', () => {
    it('should validate required fields', () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Try to advance without name
      fireEvent.press(screen.getByTestId('next-button'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'Required Field',
        'Pet name is required'
      );

      // Try to advance without species
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Test');
      currentMockProfile = { ...currentMockProfile, name: 'Test' };
      rerender(<PetOnboardingWizard />);

      fireEvent.press(screen.getByTestId('next-button'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'Required Field',
        'Please select a species'
      );
    });

    it('should handle optional fields gracefully', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Fill only required fields
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Min');
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Min',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      // Should be able to navigate through all steps
      for (let i = 0; i < 6; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      // Should reach final step
      await waitFor(() => {
        expect(screen.getByText(/review/i)).toBeTruthy();
        expect(screen.getByText('Create')).toBeTruthy();
      });
    });

    it('should handle array fields correctly', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Navigate to personality step (step 4)
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Test');
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Test',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      for (let i = 0; i < 3; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      // Select multiple personality traits
      await waitFor(() => {
        fireEvent.press(screen.getByTestId('trait-friendly'));
        fireEvent.press(screen.getByTestId('trait-energetic'));
      });

      // Verify multiple selections are handled
      expect(screen.getByTestId('trait-friendly')).toBeTruthy();
      expect(screen.getByTestId('trait-energetic')).toBeTruthy();
    });
  });

  describe('Final Step and Submission', () => {
    it('should show Create button on final step without icon', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Fill minimal required data and navigate to final step
      fireEvent.changeText(screen.getByPlaceholderText(/pet name/i), 'Final');
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Final',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      // Navigate to step 7
      for (let i = 0; i < 6; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      await waitFor(() => {
        const createButton = screen.getByText('Create');
        expect(createButton).toBeTruthy();

        // Verify no icon on create button
        expect(screen.queryByTestId('chevron-right-icon')).toBeNull();
      });
    });

    it('should call handleSave when Create button is pressed', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Navigate to final step
      fireEvent.changeText(
        screen.getByPlaceholderText(/pet name/i),
        'Save Test'
      );
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Save Test',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      for (let i = 0; i < 6; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      // Press Create
      await waitFor(() => {
        fireEvent.press(screen.getByText('Create'));
      });

      expect(mockHandleSave).toHaveBeenCalled();
    });

    it('should display review summary correctly', async () => {
      const { rerender } = render(<PetOnboardingWizard />);

      // Fill complete profile data
      fireEvent.changeText(
        screen.getByPlaceholderText(/pet name/i),
        'Review Pet'
      );
      fireEvent.press(screen.getByTestId('species-dog'));

      // Update profile
      currentMockProfile = {
        ...currentMockProfile,
        name: 'Review Pet',
        species: 'dog',
      };
      rerender(<PetOnboardingWizard />);

      fireEvent.press(screen.getByTestId('next-button'));

      // Step 2: Physical details
      await waitFor(() => {
        fireEvent.changeText(screen.getByPlaceholderText(/breed/i), 'Labrador');
      });

      // Update profile
      currentMockProfile = { ...currentMockProfile, breed: 'Labrador' };
      rerender(<PetOnboardingWizard />);

      fireEvent.press(screen.getByTestId('next-button'));

      // Navigate to review step
      for (let i = 0; i < 4; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      // Verify review shows entered data
      await waitFor(() => {
        expect(screen.getByText('Review Pet')).toBeTruthy();
        expect(screen.getByText('Dog')).toBeTruthy();
        expect(screen.getByText('Labrador')).toBeTruthy();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during save operation', async () => {
      // Set up profile state
      currentMockProfile = {
        name: 'Test',
        species: 'dog',
        breed: '',
        personality_traits: [],
        favorite_activities: [],
        exercise_needs: 'moderate',
        special_notes: '',
      };

      const { rerender } = render(<PetOnboardingWizard />);

      // Navigate to final step
      for (let i = 0; i < 6; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
        await waitFor(() => {});
      }

      // Set loading state and trigger rerender
      currentMockIsLoading = true;
      rerender(<PetOnboardingWizard />);

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeTruthy();
        expect(screen.getByText('Creating...')).toBeTruthy();
      });
    });

    it('should disable navigation during loading', async () => {
      // Set loading state before render
      currentMockProfile = {
        name: 'Test',
        species: 'dog',
        breed: '',
        personality_traits: [],
        favorite_activities: [],
        exercise_needs: 'moderate',
        special_notes: '',
      };
      currentMockIsLoading = true;

      render(<PetOnboardingWizard />);

      // Navigation buttons should be disabled
      const nextButton = screen.getByTestId('next-button');
      expect(nextButton.props.disabled).toBe(true);
    });
  });
});
