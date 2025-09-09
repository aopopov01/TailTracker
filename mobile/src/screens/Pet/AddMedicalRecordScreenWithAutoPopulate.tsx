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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

// Import our auto-population components
import { AutoPopulateField, useFormAutoPopulate } from '@/components/AutoPopulate';
import { useDataSync, usePetDataSync } from '@/contexts/DataSyncContext';

interface MedicalRecordData {
  type: 'checkup' | 'surgery' | 'emergency' | 'prescription' | 'test_result' | 'other';
  title: string;
  description: string;
  date: string;
  veterinarian: string; // This field will be auto-populated from previous records and user preferences
  cost: string;
  notes: string;
}

const RECORD_TYPES = [
  { value: 'checkup', label: 'Regular Checkup', icon: 'medical' },
  { value: 'surgery', label: 'Surgery', icon: 'cut' },
  { value: 'emergency', label: 'Emergency Visit', icon: 'alert' },
  { value: 'prescription', label: 'Prescription', icon: 'medical' },
  { value: 'test_result', label: 'Test Results', icon: 'document-text' },
  { value: 'other', label: 'Other', icon: 'ellipse' },
];

export default function AddMedicalRecordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const petId = (route.params as any)?.petId;
  const recordId = (route.params as any)?.recordId;
  const isEditing = !!recordId;

  // Initialize auto-population for medical context
  const { getFieldValue, setFieldValue, autoPopulatedValues } = useFormAutoPopulate({
    petId,
    context: 'medical',
    enableAutoPopulate: true,
  });

  // Also get user data for veterinarian auto-population
  const userAutoPopulate = useFormAutoPopulate({
    context: 'user',
    enableAutoPopulate: true,
  });

  // Load pet data for context
  const { petData } = usePetDataSync(petId);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const [formData, setFormData] = useState<MedicalRecordData>({
    type: 'checkup',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    veterinarian: autoPopulatedValues.veterinarian || userAutoPopulate.autoPopulatedValues.preferred_vet_clinic || '',
    cost: '',
    notes: autoPopulatedValues.notes || '',
  });

  // Auto-populate fields when component mounts or auto-populated values change
  useEffect(() => {
    const updatedFormData = { ...formData };
    let hasUpdates = false;

    // Auto-populate veterinarian from previous medical records or user preferences
    if (!formData.veterinarian && (autoPopulatedValues.veterinarian || userAutoPopulate.autoPopulatedValues.preferred_vet_clinic)) {
      updatedFormData.veterinarian = autoPopulatedValues.veterinarian || userAutoPopulate.autoPopulatedValues.preferred_vet_clinic;
      hasUpdates = true;
    }

    // Auto-populate notes if available from previous records
    if (!formData.notes && autoPopulatedValues.notes) {
      updatedFormData.notes = autoPopulatedValues.notes;
      hasUpdates = true;
    }

    if (hasUpdates) {
      setFormData(updatedFormData);
    }
  }, [formData, autoPopulatedValues, userAutoPopulate.autoPopulatedValues]);

  const updateField = (field: keyof MedicalRecordData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update the shared context for future auto-population
    if (field === 'veterinarian' || field === 'notes' || field === 'date') {
      setFieldValue(field, value, 'medical');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      updateField('date', dateString);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the medical record.');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description.');
      return false;
    }

    if (!formData.veterinarian.trim()) {
      Alert.alert('Error', 'Please enter the veterinarian name.');
      return false;
    }

    return true;
  };

  const saveMedicalRecord = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const recordData = {
        pet_id: petId,
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        veterinarian: formData.veterinarian.trim(),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes.trim(),
        attachments: attachments.length > 0 ? attachments : null,
      };

      let error;
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('medical_records')
          .update({
            ...recordData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recordId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('medical_records')
          .insert([{
            ...recordData,
            created_at: new Date().toISOString(),
          }]);
        error = insertError;
      }

      if (error) throw error;

      // Update the shared context with the successful data
      setFieldValue('veterinarian', formData.veterinarian, 'medical');
      setFieldValue('notes', formData.notes, 'medical');
      setFieldValue('date', formData.date, 'medical');

      Alert.alert(
        'Success',
        `Medical record ${isEditing ? 'updated' : 'added'} successfully!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving medical record:', error);
      Alert.alert('Error', 'Failed to save medical record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `medical-records/${petId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-attachments')
          .upload(filePath, file as any);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('medical-attachments')
          .getPublicUrl(filePath);

        setAttachments(prev => [...prev, data.publicUrl]);
        Alert.alert('Success', 'Attachment added successfully.');
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      Alert.alert('Error', 'Failed to add attachment.');
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
        {isEditing ? 'Edit Medical Record' : 'Add Medical Record'}
      </Text>
      
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveMedicalRecord}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Ionicons name="checkmark" size={24} color={colors.white} />
        )}
      </TouchableOpacity>
    </View>
  );

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
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pet Context Display */}
          {petData && (
            <View style={styles.petContextCard}>
              <Text style={styles.petContextText}>
                Adding medical record for <Text style={styles.petName}>{petData.name}</Text>
              </Text>
            </View>
          )}

          {/* Auto-population Notice */}
          <View style={styles.autoPopulateNotice}>
            <Ionicons name="information-circle" size={16} color={colors.info} />
            <Text style={styles.autoPopulateNoticeText}>
              Some fields are auto-populated from your previous entries and preferences
            </Text>
          </View>

          {/* Record Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Record Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {RECORD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    formData.type === type.value && styles.selectedTypeButton,
                  ]}
                  onPress={() => updateField('type', type.value)}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={20} 
                    color={formData.type === type.value ? colors.white : colors.primary} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === type.value && styles.selectedTypeButtonText,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title Field */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
              placeholder="Enter record title (e.g., Annual Checkup)"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Description Field */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Describe the medical procedure or visit details"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date Field */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Date *</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {new Date(formData.date).toLocaleDateString()}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Veterinarian Field - Auto-populated */}
          <View style={styles.section}>
            <View style={styles.fieldLabelWithIcon}>
              <Text style={styles.fieldLabel}>Veterinarian *</Text>
              {(autoPopulatedValues.veterinarian || userAutoPopulate.autoPopulatedValues.preferred_vet_clinic) && (
                <View style={styles.autoPopulatedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.autoPopulatedBadgeText}>Auto-filled</Text>
                </View>
              )}
            </View>
            <AutoPopulateField
              style={styles.textInput}
              fieldPath="veterinarian"
              context="medical"
              value={formData.veterinarian}
              onChangeText={(text) => updateField('veterinarian', text)}
              placeholder="Enter veterinarian name"
              placeholderTextColor={colors.textSecondary}
              fallbackValue={userAutoPopulate.autoPopulatedValues.preferred_vet_clinic || ''}
            />
          </View>

          {/* Cost Field */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Cost (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.cost}
              onChangeText={(text) => updateField('cost', text)}
              placeholder="Enter cost (e.g., 150.00)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Notes Field - Auto-populated */}
          <View style={styles.section}>
            <View style={styles.fieldLabelWithIcon}>
              <Text style={styles.fieldLabel}>Notes (Optional)</Text>
              {autoPopulatedValues.notes && (
                <View style={styles.autoPopulatedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.autoPopulatedBadgeText}>Auto-filled</Text>
                </View>
              )}
            </View>
            <AutoPopulateField
              style={[styles.textInput, styles.textArea]}
              fieldPath="notes"
              context="medical"
              value={formData.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="Additional notes or observations"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Attachments */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Attachments</Text>
            <TouchableOpacity style={styles.attachmentButton} onPress={addAttachment}>
              <Ionicons name="attach" size={20} color={colors.primary} />
              <Text style={styles.attachmentButtonText}>Add Document or Photo</Text>
            </TouchableOpacity>
            
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    <Ionicons name="document" size={16} color={colors.primary} />
                    <Text style={styles.attachmentItemText}>Attachment {index + 1}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
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
    padding: spacing.md,
  },
  petContextCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  petContextText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
    textAlign: 'center',
  },
  petName: {
    fontFamily: fonts.bold,
  },
  autoPopulateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '20',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  autoPopulateNoticeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.info,
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fieldLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  autoPopulatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 2,
  },
  autoPopulatedBadgeText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.success,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  selectedTypeButton: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  selectedTypeButtonText: {
    color: colors.white,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  attachmentButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  attachmentsList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 6,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  attachmentItemText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});