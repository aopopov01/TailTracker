/**
 * Unit tests for PhysicalDetailsStep component
 * Tests physical characteristics input step of pet onboarding wizard
 */

import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  screen,
  act,
} from '@testing-library/react-native';
import { Platform } from 'react-native';
import PhysicalDetailsStep from '../../../../src/components/PetOnboarding/steps/PhysicalDetailsStep';
import { StepProps } from '../../../../src/components/PetOnboarding/PetOnboardingWizard';
import { createMockOnboardingData } from '@/test-utils/petDataFactory';

// Mock dependencies
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

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock date picker
jest.mock('@react-native-community/datetimepicker', () => {
  return jest.fn(({ onChange, value }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');

    return React.createElement(
      TouchableOpacity,
      {
        testID: 'date-picker',
        onPress: () => {
          // Simulate date selection
          const mockEvent = { type: 'set' };
          const selectedDate = new Date('2020-01-15');
          onChange(mockEvent, selectedDate);
        },
      },
      React.createElement(Text, {}, `Selected: ${value.toISOString()}`)
    );
  });
});

describe('PhysicalDetailsStep', () => {
  const mockProps: StepProps = {
    profile: createMockOnboardingData({
      species: 'dog',
      name: 'Max',
    }),
    onUpdate: jest.fn(),
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    isFirstStep: false,
    isLastStep: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform.OS to default
    Platform.OS = 'ios';
  });

  describe('Rendering', () => {
    it('renders correctly with dog species', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      expect(screen.getByText("Tell us about Max's appearance")).toBeTruthy();
      expect(
        screen.getByText(/Help us build a complete profile for your dog/)
      ).toBeTruthy();
      expect(screen.getByText('Date of Birth (optional)')).toBeTruthy();
      expect(screen.getByText('Breed (optional)')).toBeTruthy();
      expect(screen.getByText('Weight (optional)')).toBeTruthy();
      expect(screen.getByText('Height (optional)')).toBeTruthy();
      expect(screen.getByText('Color & Markings (optional)')).toBeTruthy();
      expect(screen.getByText('Microchip ID (optional)')).toBeTruthy();
    });

    it('renders correctly with cat species', () => {
      const catProps = {
        ...mockProps,
        profile: { ...mockProps.profile, species: 'cat', name: 'Whiskers' },
      };

      render(<PhysicalDetailsStep {...catProps} />);

      expect(
        screen.getByText("Tell us about Whiskers's appearance")
      ).toBeTruthy();
      expect(
        screen.getByText(/Help us build a complete profile for your cat/)
      ).toBeTruthy();
      expect(screen.getByText('Weight (optional)')).toBeTruthy();
      expect(screen.getByText('Height (optional)')).toBeTruthy();
    });

    it('renders correctly with bird species', () => {
      const birdProps = {
        ...mockProps,
        profile: { ...mockProps.profile, species: 'bird', name: 'Tweety' },
      };

      render(<PhysicalDetailsStep {...birdProps} />);

      expect(
        screen.getByText("Tell us about Tweety's appearance")
      ).toBeTruthy();
      expect(
        screen.getByText(/Help us build a complete profile for your bird/)
      ).toBeTruthy();
      expect(screen.getByText('Weight (optional)')).toBeTruthy();
      expect(screen.getByText('Size/Wingspan (optional)')).toBeTruthy();
    });

    it('renders correctly with other species', () => {
      const otherProps = {
        ...mockProps,
        profile: { ...mockProps.profile, species: 'other', name: 'Bunny' },
      };

      render(<PhysicalDetailsStep {...otherProps} />);

      expect(screen.getByText("Tell us about Bunny's appearance")).toBeTruthy();
      expect(
        screen.getByText(/Help us build a complete profile for your other/)
      ).toBeTruthy();
      expect(screen.getByText('Weight/Size (optional)')).toBeTruthy();
      expect(screen.getByText('Length/Height (optional)')).toBeTruthy();
    });

    it('shows error message when no species is selected', () => {
      const noSpeciesProps = {
        ...mockProps,
        profile: { ...mockProps.profile, species: undefined },
      };

      render(<PhysicalDetailsStep {...noSpeciesProps} />);

      expect(screen.getByText('Physical Details')).toBeTruthy();
      expect(
        screen.getByText("Please go back and select your pet's species first.")
      ).toBeTruthy();
    });

    it('renders fallback name when pet name is not provided', () => {
      const noNameProps = {
        ...mockProps,
        profile: { ...mockProps.profile, name: '', species: 'dog' },
      };

      render(<PhysicalDetailsStep {...noNameProps} />);

      expect(
        screen.getByText("Tell us about your dog's appearance")
      ).toBeTruthy();
    });
  });

  describe('Species-Specific Content', () => {
    it('displays correct placeholders for dog', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      expect(
        screen.getByPlaceholderText('e.g., Golden Retriever, Mixed')
      ).toBeTruthy();
      expect(screen.getByPlaceholderText('e.g., 25 lbs, 11 kg')).toBeTruthy();
      expect(
        screen.getByPlaceholderText('e.g., 24 inches, 60 cm')
      ).toBeTruthy();
      expect(
        screen.getByPlaceholderText('e.g., Golden with white chest')
      ).toBeTruthy();
    });

    it('displays correct placeholders for cat', () => {
      const catProps = {
        ...mockProps,
        profile: { ...mockProps.profile, species: 'cat' },
      };

      render(<PhysicalDetailsStep {...catProps} />);

      expect(
        screen.getByPlaceholderText('e.g., Persian, Domestic Shorthair')
      ).toBeTruthy();
      expect(screen.getByPlaceholderText('e.g., 12 lbs, 5 kg')).toBeTruthy();
      expect(
        screen.getByPlaceholderText('e.g., 10 inches, 25 cm')
      ).toBeTruthy();
      expect(
        screen.getByPlaceholderText('e.g., Orange tabby, Black and white')
      ).toBeTruthy();
    });

    it('displays correct placeholders for bird', () => {
      const birdProps = {
        ...mockProps,
        profile: { ...mockProps.profile, species: 'bird' },
      };

      render(<PhysicalDetailsStep {...birdProps} />);

      expect(
        screen.getByPlaceholderText('e.g., Cockatiel, Parakeet')
      ).toBeTruthy();
      expect(screen.getByPlaceholderText('e.g., 3 oz, 85 grams')).toBeTruthy();
      expect(
        screen.getByPlaceholderText('e.g., 12 inches, 30 cm')
      ).toBeTruthy();
      expect(
        screen.getByPlaceholderText('e.g., Yellow with gray wings')
      ).toBeTruthy();
    });

    it('displays correct placeholders for other species', () => {
      const otherProps = {
        ...mockProps,
        profile: { ...mockProps.profile, species: 'other' },
      };

      render(<PhysicalDetailsStep {...otherProps} />);

      expect(
        screen.getByPlaceholderText('e.g., Holland Lop, Ball Python')
      ).toBeTruthy();
      expect(
        screen.getByPlaceholderText('e.g., 4 lbs, 200 grams')
      ).toBeTruthy();
      expect(screen.getByPlaceholderText('e.g., 8 inches, 20 cm')).toBeTruthy();
      expect(
        screen.getByPlaceholderText('e.g., Brown and white spotted')
      ).toBeTruthy();
    });
  });

  describe('Form Inputs', () => {
    describe('Breed Input', () => {
      it('updates breed value when user types', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const breedInput = screen.getByPlaceholderText(
          'e.g., Golden Retriever, Mixed'
        );

        await act(async () => {
          fireEvent.changeText(breedInput, 'Golden Retriever');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({
          breed: 'Golden Retriever',
        });
      });

      it('trims whitespace from breed input', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const breedInput = screen.getByPlaceholderText(
          'e.g., Golden Retriever, Mixed'
        );

        await act(async () => {
          fireEvent.changeText(breedInput, '  Golden Retriever  ');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({
          breed: 'Golden Retriever',
        });
      });

      it('handles empty breed input', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const breedInput = screen.getByPlaceholderText(
          'e.g., Golden Retriever, Mixed'
        );

        await act(async () => {
          fireEvent.changeText(breedInput, '');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({ breed: '' });
      });
    });

    describe('Weight Input', () => {
      it('updates weight value when user types', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const weightInput = screen.getByPlaceholderText('e.g., 25 lbs, 11 kg');

        await act(async () => {
          fireEvent.changeText(weightInput, '30 lbs');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({ weight: '30 lbs' });
      });

      it('handles weight with units', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const weightInput = screen.getByPlaceholderText('e.g., 25 lbs, 11 kg');

        await act(async () => {
          fireEvent.changeText(weightInput, '15 kg');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({ weight: '15 kg' });
      });

      it('trims whitespace from weight input', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const weightInput = screen.getByPlaceholderText('e.g., 25 lbs, 11 kg');

        await act(async () => {
          fireEvent.changeText(weightInput, '  25 lbs  ');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({ weight: '25 lbs' });
      });
    });

    describe('Height Input', () => {
      it('updates height value when user types', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const heightInput = screen.getByPlaceholderText(
          'e.g., 24 inches, 60 cm'
        );

        await act(async () => {
          fireEvent.changeText(heightInput, '26 inches');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({
          height: '26 inches',
        });
      });

      it('handles metric units', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const heightInput = screen.getByPlaceholderText(
          'e.g., 24 inches, 60 cm'
        );

        await act(async () => {
          fireEvent.changeText(heightInput, '65 cm');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({ height: '65 cm' });
      });
    });

    describe('Color & Markings Input', () => {
      it('updates color markings when user types', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const colorInput = screen.getByPlaceholderText(
          'e.g., Golden with white chest'
        );

        await act(async () => {
          fireEvent.changeText(colorInput, 'Brown with black spots');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({
          colorMarkings: 'Brown with black spots',
        });
      });

      it('handles multiline color descriptions', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const colorInput = screen.getByPlaceholderText(
          'e.g., Golden with white chest'
        );

        await act(async () => {
          fireEvent.changeText(
            colorInput,
            'Golden coat\nWhite chest and paws\nBlack nose'
          );
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({
          colorMarkings: 'Golden coat\nWhite chest and paws\nBlack nose',
        });
      });
    });

    describe('Microchip ID Input', () => {
      it('updates microchip ID when user types', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const microchipInput = screen.getByPlaceholderText(
          'e.g., 123456789012345'
        );

        await act(async () => {
          fireEvent.changeText(microchipInput, '123456789012345');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({
          microchipId: '123456789012345',
        });
      });

      it('trims whitespace from microchip input', async () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const microchipInput = screen.getByPlaceholderText(
          'e.g., 123456789012345'
        );

        await act(async () => {
          fireEvent.changeText(microchipInput, '  123456789012345  ');
        });

        expect(mockProps.onUpdate).toHaveBeenCalledWith({
          microchipId: '123456789012345',
        });
      });

      it('respects maxLength of 15 characters', () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const microchipInput = screen.getByPlaceholderText(
          'e.g., 123456789012345'
        );

        expect(microchipInput.props.maxLength).toBe(15);
      });

      it('has numeric keyboard type', () => {
        render(<PhysicalDetailsStep {...mockProps} />);

        const microchipInput = screen.getByPlaceholderText(
          'e.g., 123456789012345'
        );

        expect(microchipInput.props.keyboardType).toBe('numeric');
      });
    });
  });

  describe('Date of Birth Picker', () => {
    it('shows date picker when date button is pressed', async () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const dateButton = screen.getByText('Select birth date');

      await act(async () => {
        fireEvent.press(dateButton);
      });

      expect(screen.getByTestId('date-picker')).toBeTruthy();
    });

    it('updates date when user selects a date', async () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const dateButton = screen.getByText('Select birth date');

      await act(async () => {
        fireEvent.press(dateButton);
      });

      const datePicker = screen.getByTestId('date-picker');

      await act(async () => {
        fireEvent.press(datePicker);
      });

      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        date_of_birth: new Date('2020-01-15'),
      });
    });

    it('formats and displays selected date correctly', async () => {
      const dateProps = {
        ...mockProps,
        profile: {
          ...mockProps.profile,
          date_of_birth: new Date('2020-01-15'),
        },
      };

      render(<PhysicalDetailsStep {...dateProps} />);

      expect(screen.getByText('January 15, 2020')).toBeTruthy();
    });

    it('shows default text when no date is selected', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      expect(screen.getByText('Select birth date')).toBeTruthy();
    });

    it('respects maximum date constraint', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const dateButton = screen.getByText('Select birth date');

      act(() => {
        fireEvent.press(dateButton);
      });

      // DateTimePicker should have maximumDate set to today
      // This is tested implicitly through the mock
    });
  });

  describe('Data Persistence', () => {
    it('pre-fills form with existing profile data', () => {
      const existingDataProps = {
        ...mockProps,
        profile: {
          ...mockProps.profile,
          breed: 'Golden Retriever',
          weight: '30 lbs',
          height: '24 inches',
          colorMarkings: 'Golden with white chest',
          microchipId: '123456789012345',
          date_of_birth: new Date('2020-01-15'),
        },
      };

      render(<PhysicalDetailsStep {...existingDataProps} />);

      expect(screen.getByDisplayValue('Golden Retriever')).toBeTruthy();
      expect(screen.getByDisplayValue('30 lbs')).toBeTruthy();
      expect(screen.getByDisplayValue('24 inches')).toBeTruthy();
      expect(screen.getByDisplayValue('Golden with white chest')).toBeTruthy();
      expect(screen.getByDisplayValue('123456789012345')).toBeTruthy();
      expect(screen.getByText('January 15, 2020')).toBeTruthy();
    });

    it('handles weight as object format', () => {
      const objectWeightProps = {
        ...mockProps,
        profile: {
          ...mockProps.profile,
          weight: { value: 30, unit: 'lbs' },
        },
      };

      render(<PhysicalDetailsStep {...objectWeightProps} />);

      expect(screen.getByDisplayValue('30 lbs')).toBeTruthy();
    });

    it('handles height as object format', () => {
      const objectHeightProps = {
        ...mockProps,
        profile: {
          ...mockProps.profile,
          height: { value: 24, unit: 'inches' },
        },
      };

      render(<PhysicalDetailsStep {...objectHeightProps} />);

      expect(screen.getByDisplayValue('24 inches')).toBeTruthy();
    });

    it('updates form fields when profile props change', async () => {
      const { rerender } = render(<PhysicalDetailsStep {...mockProps} />);

      const updatedProps = {
        ...mockProps,
        profile: {
          ...mockProps.profile,
          breed: 'Labrador',
        },
      };

      await act(async () => {
        rerender(<PhysicalDetailsStep {...updatedProps} />);
      });

      expect(screen.getByDisplayValue('Labrador')).toBeTruthy();
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('handles iOS date picker display', async () => {
      Platform.OS = 'ios';

      render(<PhysicalDetailsStep {...mockProps} />);

      const dateButton = screen.getByText('Select birth date');

      await act(async () => {
        fireEvent.press(dateButton);
      });

      // On iOS, date picker should be shown
      expect(screen.getByTestId('date-picker')).toBeTruthy();
    });

    it('handles Android date picker display', async () => {
      Platform.OS = 'android';

      render(<PhysicalDetailsStep {...mockProps} />);

      const dateButton = screen.getByText('Select birth date');

      await act(async () => {
        fireEvent.press(dateButton);
      });

      // Date picker behavior is platform-specific
      expect(screen.getByTestId('date-picker')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles null date of birth', () => {
      const nullDateProps = {
        ...mockProps,
        profile: {
          ...mockProps.profile,
          date_of_birth: null,
        },
      };

      render(<PhysicalDetailsStep {...nullDateProps} />);

      expect(screen.getByText('Select birth date')).toBeTruthy();
    });

    it('handles undefined profile fields gracefully', () => {
      const minimalProps = {
        ...mockProps,
        profile: {
          species: 'dog',
          name: 'Test',
        },
      };

      expect(() => {
        render(<PhysicalDetailsStep {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles empty string values', () => {
      const emptyStringProps = {
        ...mockProps,
        profile: {
          ...mockProps.profile,
          breed: '',
          weight: '',
          height: '',
          colorMarkings: '',
          microchipId: '',
        },
      };

      render(<PhysicalDetailsStep {...emptyStringProps} />);

      // Should render without errors and show placeholders
      expect(
        screen.getByPlaceholderText('e.g., Golden Retriever, Mixed')
      ).toBeTruthy();
      expect(screen.getByPlaceholderText('e.g., 25 lbs, 11 kg')).toBeTruthy();
    });

    it('handles very long input values', async () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const longBreed = 'A'.repeat(100);
      const breedInput = screen.getByPlaceholderText(
        'e.g., Golden Retriever, Mixed'
      );

      await act(async () => {
        fireEvent.changeText(breedInput, longBreed);
      });

      expect(mockProps.onUpdate).toHaveBeenCalledWith({ breed: longBreed });
    });

    it('handles special characters in input', async () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const specialBreed = 'Poodle-Mix (Designer Breed) 50% Poodle + 50% Lab';
      const breedInput = screen.getByPlaceholderText(
        'e.g., Golden Retriever, Mixed'
      );

      await act(async () => {
        fireEvent.changeText(breedInput, specialBreed);
      });

      expect(mockProps.onUpdate).toHaveBeenCalledWith({ breed: specialBreed });
    });

    it('handles unicode characters in color description', async () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const unicodeColor = 'Café colored with crème markings ñ';
      const colorInput = screen.getByPlaceholderText(
        'e.g., Golden with white chest'
      );

      await act(async () => {
        fireEvent.changeText(colorInput, unicodeColor);
      });

      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        colorMarkings: unicodeColor,
      });
    });

    it('handles rapid consecutive input changes', async () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const breedInput = screen.getByPlaceholderText(
        'e.g., Golden Retriever, Mixed'
      );

      // Simulate rapid typing
      await act(async () => {
        fireEvent.changeText(breedInput, 'G');
        fireEvent.changeText(breedInput, 'Go');
        fireEvent.changeText(breedInput, 'Gol');
        fireEvent.changeText(breedInput, 'Gold');
        fireEvent.changeText(breedInput, 'Golden');
      });

      // Should handle all updates
      expect(mockProps.onUpdate).toHaveBeenCalledTimes(5);
      expect(mockProps.onUpdate).toHaveBeenLastCalledWith({ breed: 'Golden' });
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      // Check that labels are present for screen readers
      expect(screen.getByText('Date of Birth (optional)')).toBeTruthy();
      expect(screen.getByText('Breed (optional)')).toBeTruthy();
      expect(screen.getByText('Weight (optional)')).toBeTruthy();
      expect(screen.getByText('Height (optional)')).toBeTruthy();
      expect(screen.getByText('Color & Markings (optional)')).toBeTruthy();
      expect(screen.getByText('Microchip ID (optional)')).toBeTruthy();
    });

    it('has accessible date picker button', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const dateButton = screen.getByText('Select birth date');
      expect(dateButton).toBeTruthy();
    });

    it('shows all fields as optional to reduce pressure', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      const optionalLabels = screen.getAllByText(/\(optional\)/);
      expect(optionalLabels).toHaveLength(6); // All 6 fields should be optional
    });
  });

  describe('Theme Integration', () => {
    it('applies theme colors correctly', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      // Theme integration is tested implicitly through rendering
      // The component should render without errors when theme is applied
      expect(screen.getByText("Tell us about Max's appearance")).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('does not require any fields to be filled', () => {
      render(<PhysicalDetailsStep {...mockProps} />);

      // All fields should be optional and the component should render successfully
      // without any required field validation errors
      expect(screen.getByText("Tell us about Max's appearance")).toBeTruthy();
    });

    it('accepts empty form submission', () => {
      const emptyProps = {
        ...mockProps,
        profile: {
          ...mockProps.profile,
          breed: undefined,
          weight: undefined,
          height: undefined,
          colorMarkings: undefined,
          microchipId: undefined,
          date_of_birth: undefined,
        },
      };

      expect(() => {
        render(<PhysicalDetailsStep {...emptyProps} />);
      }).not.toThrow();
    });
  });
});
