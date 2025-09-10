# Pet Onboarding Wizard

A comprehensive 7-step onboarding flow for creating pet profiles with **species-specific favorite activities**.

## ✨ Key Features

- **Step 6 Dynamic Activities**: Favorite activities section automatically adapts based on the pet species selected in Step 1
- **Species-Specific Content**: Different activity options for dogs, cats, birds, and other pets
- **Progressive Disclosure**: Users can navigate back and forth between steps
- **Real-time Validation**: Form validation with helpful error messages
- **Visual Progress**: Progress bar and step navigator
- **Mobile Optimized**: Responsive design for mobile devices

## 📋 Onboarding Steps

1. **Basic Information** - Pet name and species selection
2. **Physical Details** - Breed, weight, color/markings
3. **Health Information** - Medical conditions and allergies
4. **Personality** - Character traits (species-specific)
5. **Care Preferences** - Exercise needs and care requirements
6. **🎯 Favorite Activities** - **DYNAMIC** activities based on species
7. **Review & Save** - Final confirmation

## 🎯 Step 6: Species-Specific Activities

### Dog Activities
- **Outdoor**: Playing Fetch, Long Walks, Running/Jogging, Swimming, Hiking
- **Indoor**: Puzzle Toys, Tug of War
- **Social**: Dog Parks
- **Training**: Training Sessions, Agility Training

### Cat Activities
- **Indoor**: Laser Pointer, Feather Wand Play, Catnip Toys, Window Bird Watching, Cat Tree Climbing, Hunting Games, Puzzle Feeders, Sunbathing, Exploring New Spaces
- **Social**: Socializing with Humans

### Bird Activities
- **Indoor**: Foraging Games, Puzzle Toys, Perch Swinging, Shredding Toys, Bath Time, Supervised Exploration
- **Social**: Mirror Interaction, Music & Dancing
- **Training**: Talking/Mimicking, Trick Training

### Other Pet Activities
- **Indoor**: Habitat Exploration, Enrichment Toys, Natural Species Behaviors, Environmental Interaction

## 🚀 Usage Example

```tsx
import React from 'react';
import { PetOnboardingWizard } from './components/PetOnboarding/PetOnboardingWizard';
import { usePetProfile } from './contexts/PetProfileContext';

const AddPetScreen: React.FC = ({ navigation }) => {
  const { savePetProfileWithSync } = usePetProfile();

  const handleOnboardingComplete = async (profile: PetProfile) => {
    try {
      const result = await savePetProfileWithSync(profile);
      
      // Navigate to pet profile or home screen
      navigation.navigate('PetProfile', { petId: result.localId });
    } catch (error) {
      console.error('Failed to save pet profile:', error);
      // Handle error
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <PetOnboardingWizard
      onComplete={handleOnboardingComplete}
      onCancel={handleCancel}
      initialProfile={{}} // Optional pre-filled data
    />
  );
};
```

## 🎨 Species Detection Logic

The wizard automatically detects when a user selects a species in Step 1 and updates all subsequent steps:

```tsx
// In FavoriteActivitiesStep.tsx
const speciesActivities = useMemo(() => {
  if (!profile.species) {
    return [];
  }
  return PetPersonalityService.getAllFavoriteActivities(profile.species);
}, [profile.species]);
```

## 🛡️ Error Handling

- **Species Required**: Step 6 shows an error screen if no species is selected
- **Validation**: Required fields are validated before proceeding
- **Navigation Guards**: Users can't skip ahead beyond completed steps
- **Graceful Fallbacks**: Missing data is handled gracefully

## 🔄 Integration with PetPersonalityService

The onboarding wizard leverages the existing `PetPersonalityService` to provide:

- Species-specific personality traits
- Relevant care options
- Dynamic favorite activities
- Appropriate exercise level options

## 📱 Mobile UX Features

- **Touch-friendly**: Large touch targets for mobile interaction
- **Progressive disclosure**: Information revealed step by step
- **Visual feedback**: Selected items are clearly highlighted
- **Navigation**: Back/Next buttons with visual progress
- **Accessibility**: Screen reader friendly with proper labels

## 🎯 Dynamic Activity Categories

Activities are organized by category for better UX:

- **Indoor Activities**: Home-based activities
- **Outdoor Activities**: Outside activities (mainly for dogs)
- **Social Activities**: Interaction with others
- **Training Activities**: Learning and skill building

## 🔧 Customization

The wizard is designed to be easily customizable:

- Add new species in `PetPersonalityService`
- Modify activity lists per species
- Add new onboarding steps
- Customize validation rules
- Change visual styling

## 📊 Debug Features

In development mode, the wizard shows debug information:
- Current species selection
- Number of available activities
- Step progression status

This helps developers verify that the species-specific logic is working correctly.