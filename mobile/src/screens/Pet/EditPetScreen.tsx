import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

interface Pet {
  id?: string;
  user_id?: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
  birth_date?: string;
  weight?: string;
  height?: string;
  color_markings?: string;
  microchip_id?: string;
  registration_number?: string;
  gender?: 'male' | 'female';
  neutered?: boolean;
  photo_url?: string;
  medical_conditions?: string;
  dietary_restrictions?: string;
  emergency_contact?: string;
  veterinarian_info?: string;
  insurance_info?: string;
}

export default function EditPetScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const petId = route.params?.petId;
  const isEditing = !!petId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState<Pet>({
    name: '',
    species: 'dog',
    breed: '',
    birth_date: '',
    weight: '',
    height: '',
    color_markings: '',
    microchip_id: '',
    registration_number: '',
    gender: undefined,
    neutered: undefined,
    photo_url: '',
    medical_conditions: '',
    dietary_restrictions: '',
    emergency_contact: '',
    veterinarian_info: '',
    insurance_info: '',
  });

  useEffect(() => {
    if (isEditing) {
      loadPetData();
    }
  }, [isEditing, petId]);

  const loadPetData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          ...data,
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          medical_conditions: Array.isArray(data.medical_conditions) 
            ? data.medical_conditions.join(', ') 
            : data.medical_conditions || '',
          dietary_restrictions: Array.isArray(data.dietary_restrictions)
            ? data.dietary_restrictions.join(', ')
            : data.dietary_restrictions || '',
        });
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
      Alert.alert('Error', 'Failed to load pet information.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof Pet, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant photo library access to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        updateField('photo_url', asset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const savePet = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Pet name is required.');
      return;
    }

    try {
      setSaving(true);

      const petData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        medical_conditions: formData.medical_conditions 
          ? formData.medical_conditions.split(',').map(item => item.trim()).filter(Boolean)
          : [],
        dietary_restrictions: formData.dietary_restrictions
          ? formData.dietary_restrictions.split(',').map(item => item.trim()).filter(Boolean)
          : [],
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', petId);

        if (error) throw error;
        Alert.alert('Success', 'Pet profile updated successfully!');
      } else {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('pets')
          .insert({
            ...petData,
            user_id: user.user.id,
            status: 'safe',
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        Alert.alert('Success', 'Pet profile created successfully!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving pet:', error);
      Alert.alert('Error', 'Failed to save pet profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={colors.white} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>
        {isEditing ? 'Edit Pet' : 'Add New Pet'}
      </Text>
      
      <TouchableOpacity
        style={styles.saveButton}
        onPress={savePet}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPhotoSection = () => (
    <View style={styles.photoSection}>
      <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
        {formData.photo_url ? (
          <Image source={{ uri: formData.photo_url }} style={styles.petPhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={32} color={colors.gray400} />
            <Text style={styles.photoPlaceholderText}>Add Photo</Text>
          </View>
        )}
        <View style={styles.photoOverlay}>
          <Ionicons name="camera" size={20} color={colors.white} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      placeholder?: string;
      keyboardType?: any;
      multiline?: boolean;
      numberOfLines?: number;
    }
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, options?.multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options?.placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.gray400}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        numberOfLines={options?.numberOfLines}
      />
    </View>
  );

  const renderPickerField = (
    label: string,
    value: string,
    options: { label: string; value: string }[],
    onSelect: (value: string) => void
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              value === option.value && styles.selectedOption,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.pickerOptionText,
                value === option.value && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBooleanField = (
    label: string,
    value: boolean | undefined,
    onSelect: (value: boolean | undefined) => void
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.booleanContainer}>
        {[
          { label: 'Yes', value: true },
          { label: 'No', value: false },
          { label: 'Unknown', value: undefined },
        ].map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.booleanOption,
              value === option.value && styles.selectedOption,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.booleanOptionText,
                value === option.value && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDateField = () => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>Birth Date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {formData.birth_date 
            ? new Date(formData.birth_date).toLocaleDateString()
            : 'Select birth date'
          }
        </Text>
        <Ionicons name="calendar" size={20} color={colors.primary} />
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={formData.birth_date ? new Date(formData.birth_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              updateField('birth_date', selectedDate.toISOString().split('T')[0]);
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading pet information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.gradient}
      >
        {renderHeader()}
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
          {renderPhotoSection()}

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {renderFormField(
              'Pet Name *',
              formData.name,
              (text) => updateField('name', text),
              { placeholder: 'Enter your pet\'s name' }
            )}

            {renderPickerField(
              'Species *',
              formData.species,
              [
                { label: 'Dog', value: 'dog' },
                { label: 'Cat', value: 'cat' },
                { label: 'Bird', value: 'bird' },
                { label: 'Other', value: 'other' },
              ],
              (value) => updateField('species', value)
            )}

            {renderFormField(
              'Breed',
              formData.breed || '',
              (text) => updateField('breed', text),
              { placeholder: 'Enter breed or mix' }
            )}

            {renderDateField()}

            {renderPickerField(
              'Gender',
              formData.gender || '',
              [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
              ],
              (value) => updateField('gender', value)
            )}

            {renderBooleanField(
              'Neutered/Spayed',
              formData.neutered,
              (value) => updateField('neutered', value)
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Physical Details</Text>
            
            {renderFormField(
              'Weight (kg)',
              formData.weight || '',
              (text) => updateField('weight', text),
              { keyboardType: 'numeric', placeholder: 'Enter weight' }
            )}

            {renderFormField(
              'Height (cm)',
              formData.height || '',
              (text) => updateField('height', text),
              { keyboardType: 'numeric', placeholder: 'Enter height' }
            )}

            {renderFormField(
              'Color & Markings',
              formData.color_markings || '',
              (text) => updateField('color_markings', text),
              { 
                placeholder: 'Describe color and distinctive markings',
                multiline: true,
                numberOfLines: 3
              }
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Identification</Text>
            
            {renderFormField(
              'Microchip ID',
              formData.microchip_id || '',
              (text) => updateField('microchip_id', text),
              { placeholder: 'Enter microchip number' }
            )}

            {renderFormField(
              'Registration Number',
              formData.registration_number || '',
              (text) => updateField('registration_number', text),
              { placeholder: 'Enter registration or license number' }
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Health Information</Text>
            
            {renderFormField(
              'Medical Conditions',
              formData.medical_conditions || '',
              (text) => updateField('medical_conditions', text),
              { 
                placeholder: 'List conditions separated by commas',
                multiline: true,
                numberOfLines: 3
              }
            )}

            {renderFormField(
              'Dietary Restrictions',
              formData.dietary_restrictions || '',
              (text) => updateField('dietary_restrictions', text),
              { 
                placeholder: 'List restrictions separated by commas',
                multiline: true,
                numberOfLines: 3
              }
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            
            {renderFormField(
              'Emergency Contact',
              formData.emergency_contact || '',
              (text) => updateField('emergency_contact', text),
              { 
                placeholder: 'Name and phone number',
                multiline: true,
                numberOfLines: 2
              }
            )}

            {renderFormField(
              'Veterinarian Info',
              formData.veterinarian_info || '',
              (text) => updateField('veterinarian_info', text),
              { 
                placeholder: 'Vet name, clinic, and contact',
                multiline: true,
                numberOfLines: 3
              }
            )}

            {renderFormField(
              'Insurance Info',
              formData.insurance_info || '',
              (text) => updateField('insurance_info', text),
              { 
                placeholder: 'Insurance provider and policy number',
                multiline: true,
                numberOfLines: 2
              }
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  gradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white,
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
  photoSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  photoContainer: {
    position: 'relative',
  },
  petPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  formSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  formField: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pickerOption: {
    backgroundColor: colors.gray50,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  selectedOption: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  selectedOptionText: {
    color: colors.primary,
  },
  booleanContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  booleanOption: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  booleanOptionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});