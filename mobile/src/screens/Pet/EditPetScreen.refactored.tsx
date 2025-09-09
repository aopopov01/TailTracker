import React from 'react';
import {
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { 
  FormField, 
  SelectField, 
  BooleanField, 
  DateField, 
  PhotoField, 
  FormSection 
} from '@/components/forms';
import { colors } from '@/constants/colors';
import {
  SPECIES_OPTIONS,
  GENDER_OPTIONS,
  SUCCESS_MESSAGES,
} from '@/constants/petForm';
import { spacing } from '@/constants/spacing';
import { usePetForm } from '@/hooks/usePetForm';

// Import header components
import { EditPetHeader } from './components/EditPetHeader';
import { LoadingView } from './components/LoadingView';

interface EditPetScreenRouteParams {
  petId?: string;
}

/**
 * Clean, refactored EditPetScreen using composition and separation of concerns
 * 
 * Key improvements:
 * - Extracted form logic into custom hook (usePetForm)
 * - Broke down into reusable form components
 * - Replaced magic strings with constants
 * - Improved readability and maintainability
 * - Single responsibility principle applied
 */
export default function EditPetScreen() {
  const route = useRoute();
  const { petId } = (route.params as EditPetScreenRouteParams) || {};

  const {
    formData,
    isLoading,
    isSaving,
    isEditing,
    updateField,
    handleImagePicker,
    savePet,
    canSave,
  } = usePetForm(petId);

  if (isLoading) {
    return <LoadingView message="Loading pet information..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.gradient}
      >
        <EditPetHeader 
          isEditing={isEditing}
          isSaving={isSaving}
          canSave={canSave}
          onSave={savePet}
        />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PhotoField
            label="Pet Photo"
            value={formData.photo_url}
            onImageChange={(uri: string) => updateField('photo_url', uri)}
          />

          <FormSection title="Basic Information">
            <FormField
              label="Pet Name"
              value={formData.name}
              onChangeText={(text: string) => updateField('name', text)}
              placeholder="Enter your pet's name"
              required
            />

            <SelectField
              label="Species"
              value={formData.species}
              options={[...SPECIES_OPTIONS]}
              onValueChange={(value: string) => updateField('species', value as 'dog' | 'cat' | 'bird' | 'other')}
              required
            />

            <FormField
              label="Breed"
              value={formData.breed || ''}
              onChangeText={(text: string) => updateField('breed', text)}
              placeholder="Enter breed or mix"
            />

            <DateField
              label="Birth Date"
              value={formData.birth_date ? new Date(formData.birth_date) : undefined}
              onDateChange={(date: Date) => updateField('birth_date', date.toISOString())}
              maximumDate={new Date()}
            />

            <SelectField
              label="Gender"
              value={formData.gender || ''}
              options={[...GENDER_OPTIONS]}
              onValueChange={(value: string) => updateField('gender', value as 'male' | 'female')}
            />

            <BooleanField
              label="Neutered/Spayed"
              value={formData.neutered || false}
              onValueChange={(value: boolean) => updateField('neutered', value)}
            />
          </FormSection>

          <FormSection title="Physical Details">
            <FormField
              label="Weight (kg)"
              value={formData.weight || ''}
              onChangeText={(text: string) => updateField('weight', text)}
              keyboardType="numeric"
              placeholder="Enter weight"
            />

            <FormField
              label="Height (cm)"
              value={formData.height || ''}
              onChangeText={(text: string) => updateField('height', text)}
              keyboardType="numeric"
              placeholder="Enter height"
            />

            <FormField
              label="Color & Markings"
              value={formData.color_markings || ''}
              onChangeText={(text: string) => updateField('color_markings', text)}
              placeholder="Describe color and distinctive markings"
              multiline
              numberOfLines={3}
            />
          </FormSection>

          <FormSection title="Identification">
            <FormField
              label="Microchip ID"
              value={formData.microchip_id || ''}
              onChangeText={(text: string) => updateField('microchip_id', text)}
              placeholder="Enter microchip number"
            />

            <FormField
              label="Registration Number"
              value={formData.registration_number || ''}
              onChangeText={(text: string) => updateField('registration_number', text)}
              placeholder="Enter registration or license number"
            />
          </FormSection>

          <FormSection title="Health Information">
            <FormField
              label="Medical Conditions"
              value={formData.medical_conditions || ''}
              onChangeText={(text: string) => updateField('medical_conditions', text)}
              placeholder="List conditions separated by commas"
              multiline
              numberOfLines={3}
            />

            <FormField
              label="Dietary Restrictions"
              value={formData.dietary_restrictions || ''}
              onChangeText={(text: string) => updateField('dietary_restrictions', text)}
              placeholder="List restrictions separated by commas"
              multiline
              numberOfLines={3}
            />
          </FormSection>

          <FormSection title="Emergency Contacts">
            <FormField
              label="Emergency Contact"
              value={formData.emergency_contact || ''}
              onChangeText={(text: string) => updateField('emergency_contact', text)}
              placeholder="Name and phone number"
              multiline
              numberOfLines={2}
            />

            <FormField
              label="Veterinarian Info"
              value={formData.veterinarian_info || ''}
              onChangeText={(text: string) => updateField('veterinarian_info', text)}
              placeholder="Vet name, clinic, and contact"
              multiline
              numberOfLines={3}
            />

            <FormField
              label="Insurance Info"
              value={formData.insurance_info || ''}
              onChangeText={(text: string) => updateField('insurance_info', text)}
              placeholder="Insurance provider and policy number"
              multiline
              numberOfLines={2}
            />
          </FormSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    paddingBottom: spacing.lg,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
});