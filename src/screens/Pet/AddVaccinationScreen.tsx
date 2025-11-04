import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';
import { AutoPopulateField } from '@/components/AutoPopulate/AutoPopulateField';
import { useDataSync } from '@/contexts/DataSyncContext';

interface VaccinationData {
  vaccine_name: string;
  administered_date: string;
  next_due_date: string;
  batch_number: string;
  notes: string;
  veterinarian: string;
  clinic_name: string;
  cost?: string;
}

export default function AddVaccinationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const petId = (route.params as any)?.petId;

  const [saving, setSaving] = useState(false);
  const [showAdministeredPicker, setShowAdministeredPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);

  const { updateMedicalData } = useDataSync();

  const [formData, setFormData] = useState<VaccinationData>({
    vaccine_name: '',
    administered_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    batch_number: '',
    notes: '',
    veterinarian: '',
    clinic_name: '',
    cost: '',
  });

  // Update context when form data changes
  useEffect(() => {
    updateMedicalData({
      veterinarian: formData.veterinarian,
      notes: formData.notes,
      last_visit_date: formData.administered_date,
      last_visit_cost: formData.cost ? parseFloat(formData.cost) : undefined,
    } as any);
  }, [
    formData.veterinarian,
    formData.notes,
    formData.clinic_name,
    formData.administered_date,
    formData.cost,
    updateMedicalData,
  ]);

  const updateField = (field: keyof VaccinationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateNextDueDate = (administeredDate: string) => {
    const date = new Date(administeredDate);
    // Default to 12 months for next due date
    date.setMonth(date.getMonth() + 12);
    return date.toISOString().split('T')[0];
  };

  const handleVaccineNameChange = (name: string) => {
    updateField('vaccine_name', name);

    // Auto-calculate next due date if administered date exists
    if (formData.administered_date && name) {
      const nextDue = calculateNextDueDate(formData.administered_date);
      updateField('next_due_date', nextDue);
    }
  };

  const saveVaccination = async () => {
    if (!formData.vaccine_name.trim()) {
      Alert.alert('Validation Error', 'Please enter a vaccine name.');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from('vaccinations').insert({
        pet_id: petId,
        vaccine_name: formData.vaccine_name,
        administered_date: formData.administered_date,
        next_due_date: formData.next_due_date || null,
        batch_number: formData.batch_number || null,
        notes: formData.notes || null,
        veterinarian: formData.veterinarian || null,
        clinic_name: formData.clinic_name || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Final sync with context for future use
      updateMedicalData({
        veterinarian: formData.veterinarian,
        notes: formData.notes,
        last_visit_date: formData.administered_date,
        last_visit_cost: formData.cost ? parseFloat(formData.cost) : undefined,
      } as any);

      Alert.alert(
        'Success',
        'Vaccination record has been saved successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving vaccination:', error);
      Alert.alert(
        'Error',
        'Failed to save vaccination record. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name='arrow-back' size={24} color='#fff' />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Add Vaccination</Text>

      <TouchableOpacity
        style={[styles.headerButton, saving && styles.disabledButton]}
        onPress={saveVaccination}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderDateField = (
    label: string,
    value: string,
    onChange: (date: string) => void,
    showPicker: boolean,
    setShowPicker: (show: boolean) => void,
    minimumDate?: Date,
    maximumDate?: Date
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {value ? new Date(value).toLocaleDateString() : 'Select date'}
        </Text>
        <Ionicons name='calendar' size={20} color={colors.primary} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode='date'
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowPicker(Platform.OS === 'ios');
            if (selectedDate) {
              const dateString = selectedDate.toISOString().split('T')[0];
              onChange(dateString);
            }
          }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
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
      autoPopulateContext?: 'medical' | 'user' | 'pet';
      autoPopulateField?: string;
    }
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label}
        {options?.required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      {options?.autoPopulateContext && options?.autoPopulateField ? (
        <AutoPopulateField
          style={[
            styles.textInput,
            options?.multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={options?.placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.gray400}
          keyboardType={options?.keyboardType || 'default'}
          multiline={options?.multiline}
          numberOfLines={options?.numberOfLines}
          context={options.autoPopulateContext}
          fieldPath={options.autoPopulateField}
        />
      ) : (
        <Text style={styles.regularInput}>
          Regular input (no auto-populate available)
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
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Vaccine Information</Text>

            {renderFormField(
              'Vaccine Name',
              formData.vaccine_name,
              handleVaccineNameChange,
              {
                placeholder: 'e.g., Rabies, DHPP, etc.',
                required: true,
              }
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Vaccination Details</Text>

            {renderDateField(
              'Date Administered *',
              formData.administered_date,
              date => {
                updateField('administered_date', date);
                // Auto-update next due date when administered date changes
                if (formData.vaccine_name) {
                  const nextDue = calculateNextDueDate(date);
                  updateField('next_due_date', nextDue);
                }
              },
              showAdministeredPicker,
              setShowAdministeredPicker,
              undefined,
              new Date()
            )}

            {renderDateField(
              'Next Due Date',
              formData.next_due_date,
              date => updateField('next_due_date', date),
              showDuePicker,
              setShowDuePicker,
              new Date(formData.administered_date)
            )}

            {renderFormField(
              'Batch Number',
              formData.batch_number,
              text => updateField('batch_number', text),
              { placeholder: 'Vaccine batch/lot number' }
            )}

            {renderFormField(
              'Veterinarian',
              formData.veterinarian,
              text => updateField('veterinarian', text),
              {
                placeholder: 'Dr. Name or clinic veterinarian',
                autoPopulateContext: 'medical',
                autoPopulateField: 'veterinarian',
              }
            )}

            {renderFormField(
              'Clinic Name',
              formData.clinic_name,
              text => updateField('clinic_name', text),
              {
                placeholder: 'Veterinary clinic name',
                autoPopulateContext: 'medical',
                autoPopulateField: 'clinic_name',
              }
            )}

            {renderFormField(
              'Cost',
              formData.cost || '',
              text => updateField('cost', text),
              {
                placeholder: '0.00',
                keyboardType: 'numeric',
              }
            )}

            {renderFormField(
              'Notes',
              formData.notes,
              text => updateField('notes', text),
              {
                placeholder: 'Any additional notes or reactions',
                multiline: true,
                numberOfLines: 4,
                autoPopulateContext: 'medical',
                autoPopulateField: 'notes',
              }
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons
                name='information-circle'
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                The next due date is automatically set to 12 months from the
                administered date. You can modify it as needed.
              </Text>
            </View>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: colors.success + '20',
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Ionicons name='sync' size={20} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.success }]}>
                Veterinarian and notes fields auto-populate from your previous
                entries.
              </Text>
            </View>
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
  gradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.medium,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.md,
  },
  formField: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  requiredMark: {
    color: colors.error,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  regularInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.gray500,
    backgroundColor: '#f9f9f9',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.primary,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
