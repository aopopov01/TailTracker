/**
 * BasicInfoStep Unit Tests
 * Tests the first step of pet onboarding wizard (name, species, photo)
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BasicInfoStep from '../../../../src/components/PetOnboarding/steps/BasicInfoStep';
import { StepProps } from '../../../../src/components/PetOnboarding/PetOnboardingWizard';
import { createMockOnboardingData } from '@/test-utils/petDataFactory';
import * as ImagePicker from 'expo-image-picker';

// Mock dependencies
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

// React Native, Paper, and Vector Icons are now mocked globally in jest.setup.js

const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;

describe('BasicInfoStep', () => {
  const mockProfile = createMockOnboardingData({
    name: 'Buddy',
    species: 'dog',
    photo_url: 'https://example.com/photo.jpg',
  });

  const defaultProps: StepProps = {
    profile: mockProfile,
    onUpdate: jest.fn(),
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    isFirstStep: true,
    isLastStep: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Alert.alert as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render the basic info step with all elements', () => {
      const { getByText, getByDisplayValue, getByTestId } = render(
        <BasicInfoStep {...defaultProps} />
      );

      expect(getByText('Pet Name *')).toBeTruthy();
      expect(getByText('What kind of pet is Buddy? *')).toBeTruthy();
      expect(getByDisplayValue('Buddy')).toBeTruthy();
      expect(getByTestId('species-dog')).toBeTruthy();
    });

    it('should display all species options', () => {
      const { getByTestId } = render(<BasicInfoStep {...defaultProps} />);

      expect(getByTestId('species-dog')).toBeTruthy();
      expect(getByTestId('species-cat')).toBeTruthy();
      expect(getByTestId('species-bird')).toBeTruthy();
      expect(getByTestId('species-other')).toBeTruthy();
    });

    it('should show photo when provided in profile', () => {
      const { getByTestId } = render(<BasicInfoStep {...defaultProps} />);

      expect(getByTestId('pet-photo')).toBeTruthy();
    });

    it('should show add photo button when no photo', () => {
      const propsWithoutPhoto = {
        ...defaultProps,
        profile: { ...mockProfile, photo_url: undefined },
      };

      const { getByText } = render(<BasicInfoStep {...propsWithoutPhoto} />);

      expect(getByText('Tap to add photo')).toBeTruthy();
    });
  });

  describe('Name Input', () => {
    it('should update name when text changes', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByDisplayValue } = render(<BasicInfoStep {...props} />);
      const nameInput = getByDisplayValue('Buddy');

      fireEvent.changeText(nameInput, 'Max');

      expect(onUpdate).toHaveBeenCalledWith({ name: 'Max' });
    });

    it('should trim whitespace from name', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByDisplayValue } = render(<BasicInfoStep {...props} />);
      const nameInput = getByDisplayValue('Buddy');

      fireEvent.changeText(nameInput, '  Luna  ');

      expect(onUpdate).toHaveBeenCalledWith({ name: 'Luna' });
    });

    it('should handle empty name', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByDisplayValue } = render(<BasicInfoStep {...props} />);
      const nameInput = getByDisplayValue('Buddy');

      fireEvent.changeText(nameInput, '');

      expect(onUpdate).toHaveBeenCalledWith({ name: '' });
    });

    it('should handle very long names', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };
      const longName = 'A'.repeat(100);

      const { getByDisplayValue } = render(<BasicInfoStep {...props} />);
      const nameInput = getByDisplayValue('Buddy');

      fireEvent.changeText(nameInput, longName);

      expect(onUpdate).toHaveBeenCalledWith({ name: longName });
    });

    it('should handle special characters in name', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByDisplayValue } = render(<BasicInfoStep {...props} />);
      const nameInput = getByDisplayValue('Buddy');

      fireEvent.changeText(nameInput, "Mr. O'Malley-Smith");

      expect(onUpdate).toHaveBeenCalledWith({ name: "Mr. O'Malley-Smith" });
    });
  });

  describe('Species Selection', () => {
    it('should update species when dog is selected', () => {
      const onUpdate = jest.fn();
      const props = {
        ...defaultProps,
        onUpdate,
        profile: { ...mockProfile, species: undefined },
      };

      const { getByTestId } = render(<BasicInfoStep {...props} />);
      const dogOption = getByTestId('species-dog');

      fireEvent.press(dogOption);

      expect(onUpdate).toHaveBeenCalledWith({ species: 'dog' });
    });

    it('should update species when cat is selected', () => {
      const onUpdate = jest.fn();
      const props = {
        ...defaultProps,
        onUpdate,
        profile: { ...mockProfile, species: undefined },
      };

      const { getByTestId } = render(<BasicInfoStep {...props} />);
      const catOption = getByTestId('species-cat');

      fireEvent.press(catOption);

      expect(onUpdate).toHaveBeenCalledWith({ species: 'cat' });
    });

    it('should update species when bird is selected', () => {
      const onUpdate = jest.fn();
      const props = {
        ...defaultProps,
        onUpdate,
        profile: { ...mockProfile, species: undefined },
      };

      const { getByTestId } = render(<BasicInfoStep {...props} />);
      const birdOption = getByTestId('species-bird');

      fireEvent.press(birdOption);

      expect(onUpdate).toHaveBeenCalledWith({ species: 'bird' });
    });

    it('should update species when other is selected', () => {
      const onUpdate = jest.fn();
      const props = {
        ...defaultProps,
        onUpdate,
        profile: { ...mockProfile, species: undefined },
      };

      const { getByTestId } = render(<BasicInfoStep {...props} />);
      const otherOption = getByTestId('species-other');

      fireEvent.press(otherOption);

      expect(onUpdate).toHaveBeenCalledWith({ species: 'other' });
    });

    it('should show selected species as active', () => {
      const { getByTestId } = render(<BasicInfoStep {...defaultProps} />);
      const dogOption = getByTestId('species-dog');

      // Should have some indication of being selected
      expect(dogOption).toBeTruthy();
    });

    it('should allow changing species selection', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByTestId } = render(<BasicInfoStep {...props} />);

      // Change from dog to cat
      const catOption = getByTestId('species-cat');
      fireEvent.press(catOption);

      expect(onUpdate).toHaveBeenCalledWith({ species: 'cat' });
    });
  });

  describe('Photo Management', () => {
    beforeEach(() => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: true,
        status: 'granted',
      } as any);

      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: true,
        status: 'granted',
      } as any);
    });

    it('should request permissions and open image picker when add photo is pressed', async () => {
      const onUpdate = jest.fn();
      const props = {
        ...defaultProps,
        onUpdate,
        profile: { ...mockProfile, photo_url: undefined },
      };

      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'new-photo-uri.jpg' }],
      } as any);

      const { getByText } = render(<BasicInfoStep {...props} />);
      const addPhotoButton = getByText('Tap to add photo');

      fireEvent.press(addPhotoButton);

      await waitFor(() => {
        expect(
          mockImagePicker.requestMediaLibraryPermissionsAsync
        ).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      });

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith({
          photo_url: 'new-photo-uri.jpg',
        });
      });
    });

    it('should show alert when media library permission is denied', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: false,
        status: 'denied',
      } as any);

      const props = {
        ...defaultProps,
        profile: { ...mockProfile, photo_url: undefined },
      };

      const { getByText } = render(<BasicInfoStep {...props} />);
      const addPhotoButton = getByText('Tap to add photo');

      fireEvent.press(addPhotoButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          'Please allow access to your photo library to add a pet photo.'
        );
      });
    });

    it('should handle cancelled image selection', async () => {
      const onUpdate = jest.fn();
      const props = {
        ...defaultProps,
        onUpdate,
        profile: { ...mockProfile, photo_url: undefined },
      };

      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: true,
      } as any);

      const { getByText } = render(<BasicInfoStep {...props} />);
      const addPhotoButton = getByText('Tap to add photo');

      fireEvent.press(addPhotoButton);

      await waitFor(() => {
        expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });

      // Should not call onUpdate when cancelled
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should allow removing existing photo', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByTestId } = render(<BasicInfoStep {...props} />);
      const removePhotoButton = getByTestId('remove-photo-button');

      fireEvent.press(removePhotoButton);

      expect(onUpdate).toHaveBeenCalledWith({ photo_url: undefined });
    });

    it('should handle image picker errors gracefully', async () => {
      const props = {
        ...defaultProps,
        profile: { ...mockProfile, photo_url: undefined },
      };

      mockImagePicker.launchImageLibraryAsync.mockRejectedValue(
        new Error('Image picker failed')
      );

      const { getByText } = render(<BasicInfoStep {...props} />);
      const addPhotoButton = getByText('Tap to add photo');

      fireEvent.press(addPhotoButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to pick image. Please try again.'
        );
      });
    });
  });

  describe('Data Persistence', () => {
    it('should sync local state with profile prop changes', () => {
      const { rerender, getByDisplayValue } = render(
        <BasicInfoStep {...defaultProps} />
      );

      expect(getByDisplayValue('Buddy')).toBeTruthy();

      // Update profile prop
      const updatedProps = {
        ...defaultProps,
        profile: { ...mockProfile, name: 'Luna' },
      };

      rerender(<BasicInfoStep {...updatedProps} />);

      expect(getByDisplayValue('Luna')).toBeTruthy();
    });

    it('should handle undefined profile values', () => {
      const propsWithEmptyProfile = {
        ...defaultProps,
        profile: {},
      };

      const { getByPlaceholderText } = render(
        <BasicInfoStep {...propsWithEmptyProfile} />
      );

      expect(getByPlaceholderText("Enter your pet's name")).toBeTruthy();
    });

    it('should preserve local changes when profile prop updates', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByDisplayValue, rerender } = render(
        <BasicInfoStep {...props} />
      );

      // Make local change
      const nameInput = getByDisplayValue('Buddy');
      fireEvent.changeText(nameInput, 'Max');

      expect(onUpdate).toHaveBeenCalledWith({ name: 'Max' });

      // Profile prop updates with our change
      const updatedProps = {
        ...props,
        profile: { ...mockProfile, name: 'Max' },
      };

      rerender(<BasicInfoStep {...updatedProps} />);

      expect(getByDisplayValue('Max')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for form elements', () => {
      const { getByPlaceholderText } = render(
        <BasicInfoStep {...defaultProps} />
      );

      expect(getByPlaceholderText("Enter your pet's name")).toBeTruthy();
    });

    it('should have accessible species selection buttons', () => {
      const { getByTestId } = render(<BasicInfoStep {...defaultProps} />);

      expect(getByTestId('species-dog')).toBeTruthy();
      expect(getByTestId('species-cat')).toBeTruthy();
      expect(getByTestId('species-bird')).toBeTruthy();
      expect(getByTestId('species-other')).toBeTruthy();
    });

    it('should show validation message when some fields are filled but incomplete', () => {
      const props = {
        ...defaultProps,
        profile: { ...mockProfile, name: 'Buddy', species: null },
      };

      const { getByText } = render(<BasicInfoStep {...props} />);

      expect(getByText('Please select a species.')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long names gracefully', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };
      const extremelyLongName = 'A'.repeat(10000);

      const { getByDisplayValue } = render(<BasicInfoStep {...props} />);
      const nameInput = getByDisplayValue('Buddy');

      fireEvent.changeText(nameInput, extremelyLongName);

      expect(onUpdate).toHaveBeenCalledWith({ name: extremelyLongName });
    });

    it('should handle names with only whitespace', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByDisplayValue } = render(<BasicInfoStep {...props} />);
      const nameInput = getByDisplayValue('Buddy');

      fireEvent.changeText(nameInput, '   ');

      expect(onUpdate).toHaveBeenCalledWith({ name: '' });
    });

    it('should handle unicode characters in names', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };
      const unicodeName = '🐕 Félix 猫 Müller';

      const { getByDisplayValue } = render(<BasicInfoStep {...props} />);
      const nameInput = getByDisplayValue('Buddy');

      fireEvent.changeText(nameInput, unicodeName);

      expect(onUpdate).toHaveBeenCalledWith({ name: unicodeName });
    });

    it('should handle rapid species selection changes', () => {
      const onUpdate = jest.fn();
      const props = { ...defaultProps, onUpdate };

      const { getByTestId } = render(<BasicInfoStep {...props} />);

      // Rapidly change species
      fireEvent.press(getByTestId('species-cat'));
      fireEvent.press(getByTestId('species-bird'));
      fireEvent.press(getByTestId('species-other'));
      fireEvent.press(getByTestId('species-dog'));

      expect(onUpdate).toHaveBeenCalledTimes(4);
      expect(onUpdate).toHaveBeenLastCalledWith({ species: 'dog' });
    });
  });
});
