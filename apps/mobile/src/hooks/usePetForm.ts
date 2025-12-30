import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/services/supabase';

/**
 * Interface for pet form data with comprehensive typing
 */
export interface PetFormData {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
  birth_date?: string;
  weight_kg?: string;
  height?: string;
  color_markings?: string;
  microchip_id?: string;
  registration_number?: string;
  gender?: 'male' | 'female';
  neutered?: boolean;
  photo_url?: string;
  medical_conditions?: string;
  emergency_contact?: string;
  insurance_info?: string;
}

/**
 * Initial empty form state
 */
const INITIAL_FORM_DATA: PetFormData = {
  name: '',
  species: 'dog',
  breed: '',
  birth_date: '',
  weight_kg: '',
  height: '',
  color_markings: '',
  microchip_id: '',
  registration_number: '',
  gender: undefined,
  neutered: undefined,
  photo_url: '',
  medical_conditions: '',
  emergency_contact: '',
  insurance_info: '',
};

/**
 * Custom hook for managing pet form state and operations
 * Handles form data, loading, validation, and CRUD operations
 */
export function usePetForm(petId?: string) {
  const navigation = useNavigation();
  const isEditing = Boolean(petId);

  const [formData, setFormData] = useState<PetFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Update a specific field in the form data
   */
  const updateField = useCallback(
    <K extends keyof PetFormData>(field: K, value: PetFormData[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  /**
   * Load pet data for editing
   */
  const loadPetData = useCallback(async () => {
    if (!petId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (error) {
        throw new Error(`Failed to load pet data: ${error.message}`);
      }

      if (data) {
        // NOTE: Type assertion needed - database types differ from form types
        setFormData({
          ...data,
          weight_kg: data.weight_kg?.toString() || '',
          height: data.height || '',
          medical_conditions: Array.isArray(data.medical_conditions)
            ? data.medical_conditions.join(', ')
            : data.medical_conditions || '',
        } as any);
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
      Alert.alert('Error', 'Failed to load pet information.');
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  /**
   * Handle image selection from device gallery
   */
  const handleImagePicker = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to add pet photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateField('photo_url', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  }, [updateField]);

  /**
   * Validate form data before submission
   */
  const validateForm = useCallback((): { isValid: boolean; error?: string } => {
    if (!formData.name.trim()) {
      return { isValid: false, error: 'Pet name is required.' };
    }

    // Add more validation rules as needed
    return { isValid: true };
  }, [formData.name]);

  /**
   * Transform form data for database submission
   */
  const transformFormDataForSubmission = useCallback(() => {
    return {
      ...formData,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      height: formData.height || null,
      medical_conditions: formData.medical_conditions
        ? formData.medical_conditions
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
        : [],
      updated_at: new Date().toISOString(),
    };
  }, [formData]);

  /**
   * Save pet data (create or update)
   */
  const savePet = useCallback(async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    try {
      setIsSaving(true);
      const petData = transformFormDataForSubmission();

      if (isEditing) {
        if (!petId) {
          throw new Error('Pet ID is required for editing');
        }
        const { error } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', petId); // NOTE: Safe to use after null check

        if (error) {
          throw new Error(`Failed to update pet: ${error.message}`);
        }

        Alert.alert('Success', 'Pet profile updated successfully!');
      } else {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error('User not authenticated');
        }

        const { error } = await supabase.from('pets').insert({
          ...petData,
          user_id: user.user.id,
          status: 'active',
          created_at: new Date().toISOString(),
        });

        if (error) {
          throw new Error(`Failed to create pet: ${error.message}`);
        }

        Alert.alert('Success', 'Pet profile created successfully!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving pet:', error);
      Alert.alert(
        'Error',
        'Failed to save pet profile. Please check your connection and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm,
    transformFormDataForSubmission,
    isEditing,
    petId,
    navigation,
  ]);

  /**
   * Load data when component mounts (for editing)
   */
  useEffect(() => {
    if (isEditing) {
      loadPetData();
    }
  }, [isEditing, loadPetData]);

  return {
    // State
    formData,
    isLoading,
    isSaving,
    isEditing,

    // Actions
    updateField,
    handleImagePicker,
    savePet,

    // Computed values
    canSave: !isSaving && formData.name.trim().length > 0,
  };
}
