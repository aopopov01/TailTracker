import React, { useState } from 'react';
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

interface MedicalRecordData {
  record_type:
    | 'checkup'
    | 'surgery'
    | 'emergency'
    | 'prescription'
    | 'test_result'
    | 'other';
  title: string;
  description: string;
  date_of_record: string;
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

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState<MedicalRecordData>({
    record_type: 'checkup',
    title: '',
    description: '',
    date_of_record: new Date().toISOString().split('T')[0],
    cost: '',
    notes: '',
  });

  const updateField = (field: keyof MedicalRecordData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];

        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `medical-records/${petId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-attachments')
          .upload(filePath, file as any);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from('medical-attachments')
          .getPublicUrl(filePath);

        setDocumentUrls(prev => [...prev, data.publicUrl]);
        Alert.alert('Success', 'Attachment added successfully.');
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      Alert.alert('Error', 'Failed to add attachment.');
    }
  };

  const removeAttachment = (index: number) => {
    Alert.alert(
      'Remove Attachment',
      'Are you sure you want to remove this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setDocumentUrls(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const saveRecord = async () => {
    if (!formData.title.trim()) {
      Alert.alert(
        'Validation Error',
        'Please enter a title for this medical record.'
      );
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description.');
      return;
    }

    try {
      setSaving(true);

      const recordData = {
        pet_id: petId,
        record_type: formData.record_type,
        title: formData.title,
        description: formData.description,
        date_of_record: formData.date_of_record,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes || null,
        document_urls: documentUrls.length > 0 ? documentUrls : null,
        created_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from('medical_records')
          .update({
            ...recordData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recordId);

        if (error) throw error;
        Alert.alert('Success', 'Medical record updated successfully!');
      } else {
        const { error } = await supabase
          .from('medical_records')
          .insert(recordData);

        if (error) throw error;
        Alert.alert('Success', 'Medical record added successfully!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving medical record:', error);
      Alert.alert('Error', 'Failed to save medical record. Please try again.');
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
        <Ionicons name='chevron-back' size={24} color={colors.white} />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {isEditing ? 'Edit Medical Record' : 'Add Medical Record'}
      </Text>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveRecord}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size='small' color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTypeSelection = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Record Type</Text>

      <View style={styles.typeGrid}>
        {RECORD_TYPES.map(type => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeOption,
              formData.record_type === type.value && styles.selectedTypeOption,
            ]}
            onPress={() => updateField('record_type', type.value)}
          >
            <Ionicons
              name={type.icon as any}
              size={20}
              color={
                formData.record_type === type.value
                  ? colors.primary
                  : colors.gray400
              }
            />
            <Text
              style={[
                styles.typeOptionText,
                formData.record_type === type.value && styles.selectedTypeText,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
      required?: boolean;
    }
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label}
        {options?.required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
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

  const renderDateField = () => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        Date <Text style={styles.requiredMark}>*</Text>
      </Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {new Date(formData.date_of_record).toLocaleDateString()}
        </Text>
        <Ionicons name='calendar' size={20} color={colors.primary} />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.date_of_record)}
          mode='date'
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              updateField(
                'date_of_record',
                selectedDate.toISOString().split('T')[0]
              );
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </View>
  );

  const renderAttachments = () => (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Attachments</Text>
        <TouchableOpacity
          style={styles.addAttachmentButton}
          onPress={addAttachment}
        >
          <Ionicons name='attach' size={16} color={colors.primary} />
          <Text style={styles.addAttachmentText}>Add File</Text>
        </TouchableOpacity>
      </View>

      {documentUrls.length > 0 ? (
        <View style={styles.attachmentsList}>
          {documentUrls.map((attachment, index) => (
            <View key={index} style={styles.attachmentItem}>
              <View style={styles.attachmentInfo}>
                <Ionicons name='document' size={20} color={colors.primary} />
                <Text style={styles.attachmentName} numberOfLines={1}>
                  Attachment {index + 1}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeAttachmentButton}
                onPress={() => removeAttachment(index)}
              >
                <Ionicons name='close' size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noAttachmentsText}>
          No attachments added. You can attach documents, images, or test
          results.
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor={colors.primary} />

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
          {renderTypeSelection()}

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Record Details</Text>

            {renderFormField(
              'Title',
              formData.title,
              text => updateField('title', text),
              {
                placeholder: 'Enter a title for this record',
                required: true,
              }
            )}

            {renderFormField(
              'Description',
              formData.description,
              text => updateField('description', text),
              {
                placeholder:
                  'Describe the medical procedure, diagnosis, or treatment',
                multiline: true,
                numberOfLines: 4,
                required: true,
              }
            )}

            {renderDateField()}

            {renderFormField(
              'Cost',
              formData.cost,
              text => updateField('cost', text),
              {
                placeholder: 'Enter cost (optional)',
                keyboardType: 'numeric',
              }
            )}

            {renderFormField(
              'Additional Notes',
              formData.notes,
              text => updateField('notes', text),
              {
                placeholder:
                  'Any additional information, follow-up instructions, etc.',
                multiline: true,
                numberOfLines: 3,
              }
            )}
          </View>

          {renderAttachments()}

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
  formSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    minWidth: '47%',
    gap: spacing.sm,
  },
  selectedTypeOption: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  selectedTypeText: {
    color: colors.primary,
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
  requiredMark: {
    color: colors.error,
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
    height: 100,
    textAlignVertical: 'top',
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
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  addAttachmentText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  attachmentsList: {
    gap: spacing.sm,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.md,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  attachmentName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
  },
  removeAttachmentButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAttachmentsText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
    backgroundColor: colors.gray50,
    borderRadius: 8,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
