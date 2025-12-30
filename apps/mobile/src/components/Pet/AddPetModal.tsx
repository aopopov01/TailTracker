import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { petService, Pet } from '@/services/PetService';

interface AddPetModalProps {
  visible: boolean;
  onClose: () => void;
  familyId: string;
  pet?: Pet; // For editing
  onSuccess: () => void;
}

export const AddPetModal: React.FC<AddPetModalProps> = ({
  visible,
  onClose,
  familyId,
  pet,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [weight, setWeight] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');
  const [personalityTraits, setPersonalityTraits] = useState('');
  const [behavioralNotes, setBehavioralNotes] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState('');

  // Insurance (Premium/Pro only)
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceContactPhone, setInsuranceContactPhone] = useState('');
  const [insuranceCoverageDetails, setInsuranceCoverageDetails] = useState('');

  // Breeding (Premium/Pro only)
  const [breedingStatus, setBreedingStatus] = useState('not_applicable');
  const [breedingNotes, setBreedingNotes] = useState('');
  const [sireName, setSireName] = useState('');
  const [damName, setDamName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationOrganization, setRegistrationOrganization] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    status: 'free',
    canUsePremiumFeatures: false,
    canUseProFeatures: false,
  });

  useEffect(() => {
    if (visible) {
      loadSubscriptionStatus();
      if (pet) {
        // Edit mode - populate fields
        populateFields(pet);
      } else {
        // Add mode - reset fields
        resetFields();
      }
    }
  }, [visible, pet]);

  const loadSubscriptionStatus = async () => {
    const status = await petService.getSubscriptionStatus();
    setSubscriptionStatus(status);
  };

  const populateFields = (petData: Pet) => {
    setName(petData.name);
    setSpecies(petData.species);
    setBreed(petData.breed || '');
    setColor(petData.color || '');
    setGender(petData.gender || '');
    setDateOfBirth(
      petData.date_of_birth ? new Date(petData.date_of_birth) : null
    );
    setWeight(petData.weight_kg?.toString() || '');
    setMicrochipNumber(petData.microchip_number || '');
    setPersonalityTraits(
      Array.isArray(petData.personality_traits)
        ? petData.personality_traits.join(', ')
        : petData.personality_traits || ''
    );
    setBehavioralNotes(petData.behavioral_notes || '');
    setSpecialNeeds(petData.special_needs || '');
    setAllergies(
      Array.isArray(petData.allergies)
        ? petData.allergies.join(', ')
        : petData.allergies || ''
    );
    setMedicalConditions(petData.medical_conditions || []);
    setDietaryNotes(petData.dietary_notes || '');

    // Insurance
    setInsuranceProvider(petData.insurance_provider || '');
    setInsurancePolicyNumber(petData.insurance_policy_number || '');
    setInsuranceContactPhone(petData.insurance_contact_phone || '');
    setInsuranceCoverageDetails(petData.insurance_coverage_details || '');

    // Breeding
    setBreedingStatus(petData.breeding_status || 'not_applicable');
    setBreedingNotes(petData.breeding_notes || '');
    setSireName(petData.sire_name || '');
    setDamName(petData.dam_name || '');
    setRegistrationNumber(petData.registration_number || '');
    setRegistrationOrganization(petData.registration_organization || '');
  };

  const resetFields = () => {
    setName('');
    setSpecies('');
    setBreed('');
    setColor('');
    setGender('');
    setDateOfBirth(null);
    setWeight('');
    setMicrochipNumber('');
    setPersonalityTraits('');
    setBehavioralNotes('');
    setSpecialNeeds('');
    setAllergies('');
    setDietaryNotes('');
    setMedicalConditions([]);
    setInsuranceProvider('');
    setInsurancePolicyNumber('');
    setInsuranceContactPhone('');
    setInsuranceCoverageDetails('');
    setBreedingStatus('not_applicable');
    setBreedingNotes('');
    setSireName('');
    setDamName('');
    setRegistrationNumber('');
    setRegistrationOrganization('');
  };
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for your pet');
      return;
    }

    if (!species.trim()) {
      Alert.alert('Error', 'Please enter the species');
      return;
    }

    setIsLoading(true);

    try {
      const petData = {
        name: name.trim(),
        species: species.trim(),
        breed: breed.trim() || undefined,
        color: color.trim() || undefined,
        gender: gender || undefined,
        date_of_birth: dateOfBirth?.toISOString().split('T')[0] || undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
        microchip_number: microchipNumber.trim() || undefined,
        personality_traits: personalityTraits.trim()
          ? personalityTraits
              .split(',')
              .map(trait => trait.trim())
              .filter(Boolean)
          : undefined,
        behavioral_notes: behavioralNotes.trim() || undefined,
        special_needs: specialNeeds.trim() || undefined,
        allergies: allergies.trim() || undefined,
        medical_conditions:
          medicalConditions.length > 0 ? medicalConditions : undefined,
        dietary_notes: dietaryNotes.trim() || undefined,

        // Premium/Pro fields
        ...(subscriptionStatus.canUsePremiumFeatures && {
          insurance_provider: insuranceProvider.trim() || undefined,
          insurance_policy_number: insurancePolicyNumber.trim() || undefined,
          insurance_contact_phone: insuranceContactPhone.trim() || undefined,
          insurance_coverage_details:
            insuranceCoverageDetails.trim() || undefined,
        }),

        // Pro-only fields (breeding information)
        ...(subscriptionStatus.canUseProFeatures && {
          breeding_status:
            breedingStatus !== 'not_applicable' ? breedingStatus : undefined,
          breeding_notes: breedingNotes.trim() || undefined,
          sire_name: sireName.trim() || undefined,
          dam_name: damName.trim() || undefined,
          registration_number: registrationNumber.trim() || undefined,
          registration_organization:
            registrationOrganization.trim() || undefined,
        }),
      };

      let result;
      if (pet) {
        // Update existing pet
        result = await petService.updatePet(pet.id, petData as any);

        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to save pet');
          return;
        }

        onSuccess();
        onClose();
        Alert.alert('Success', 'Pet updated successfully');
      } else {
        // Use upsert method to prevent duplicates during onboarding
        result = await petService.upsertPetFromOnboarding(petData as any);

        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to save pet');
          return;
        }

        onSuccess();
        onClose();

        // Show appropriate message based on whether pet was new or existing
        if (result.isExisting) {
          Alert.alert(
            'Pet Found',
            "This pet already exists! We've updated it with the new information instead of creating a duplicate."
          );
        } else {
          Alert.alert('Success', 'Pet created successfully');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save pet');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // On iOS, don't close the picker automatically to allow full date selection
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) {
      setDateOfBirth(selectedDate);
      // On Android, close after selection as it handles date picking differently
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      // On iOS, keep picker open until user explicitly closes it
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {pet ? 'Edit Pet' : 'Add Pet'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isLoading}>
              <Text style={[styles.saveText, isLoading && styles.disabledText]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter pet's name"
                  maxLength={255}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Species *</Text>
                <TextInput
                  style={styles.input}
                  value={species}
                  onChangeText={setSpecies}
                  placeholder='e.g., Dog, Cat, Bird, Fish'
                  maxLength={100}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Breed</Text>
                  <TextInput
                    style={styles.input}
                    value={breed}
                    onChangeText={setBreed}
                    placeholder='e.g., Golden Retriever'
                    maxLength={100}
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Color</Text>
                  <TextInput
                    style={styles.input}
                    value={color}
                    onChangeText={setColor}
                    placeholder='e.g., Golden'
                    maxLength={100}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      style={styles.picker}
                      selectedValue={gender}
                      onValueChange={setGender}
                    >
                      <Picker.Item label='Select gender' value='' />
                      <Picker.Item label='Male' value='male' />
                      <Picker.Item label='Female' value='female' />
                      <Picker.Item label='Unknown' value='unknown' />
                    </Picker>
                  </View>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder='e.g., 25.5'
                    keyboardType='decimal-pad'
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {dateOfBirth
                      ? dateOfBirth.toDateString()
                      : 'Select date of birth'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <View>
                    <DateTimePicker
                      value={dateOfBirth || new Date()}
                      mode='date'
                      display='default'
                      onChange={onDateChange}
                      maximumDate={new Date()}
                    />
                    {/* Show Done button for both iOS and Android to give users explicit control */}
                    <TouchableOpacity
                      style={styles.datePickerCloseButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerCloseText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Microchip Number</Text>
                <TextInput
                  style={styles.input}
                  value={microchipNumber}
                  onChangeText={setMicrochipNumber}
                  placeholder='e.g., 123456789012345'
                  maxLength={50}
                />
              </View>
            </View>

            {/* Personality & Behavior */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personality & Behavior</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Personality Traits</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={personalityTraits}
                  onChangeText={setPersonalityTraits}
                  placeholder='e.g., Friendly, energetic, loves children, shy with strangers...'
                  multiline={true}
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Behavioral Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={behavioralNotes}
                  onChangeText={setBehavioralNotes}
                  placeholder='Behavioral patterns, training notes, special behaviors...'
                  multiline={true}
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>
            </View>

            {/* Health Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Health & Medical</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Special Needs</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={specialNeeds}
                  onChangeText={setSpecialNeeds}
                  placeholder='Special care requirements, mobility issues, medications...'
                  multiline={true}
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Allergies</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder='Food allergies, environmental allergies, medication allergies...'
                  multiline={true}
                  numberOfLines={2}
                  maxLength={500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dietary Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={dietaryNotes}
                  onChangeText={setDietaryNotes}
                  placeholder='Food preferences, special diet requirements, feeding schedule...'
                  multiline={true}
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>
            </View>

            {/* Premium Features */}
            {subscriptionStatus.canUsePremiumFeatures && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pet Insurance</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Insurance Provider</Text>
                    <TextInput
                      style={styles.input}
                      value={insuranceProvider}
                      onChangeText={setInsuranceProvider}
                      placeholder='e.g., Petplan, Trupanion'
                      maxLength={100}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Policy Number</Text>
                      <TextInput
                        style={styles.input}
                        value={insurancePolicyNumber}
                        onChangeText={setInsurancePolicyNumber}
                        placeholder='Policy number'
                        maxLength={50}
                      />
                    </View>

                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Contact Phone</Text>
                      <TextInput
                        style={styles.input}
                        value={insuranceContactPhone}
                        onChangeText={setInsuranceContactPhone}
                        placeholder='Insurance phone'
                        keyboardType='phone-pad'
                        maxLength={20}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Coverage Details</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={insuranceCoverageDetails}
                      onChangeText={setInsuranceCoverageDetails}
                      placeholder='Coverage details, deductibles, limits...'
                      multiline={true}
                      numberOfLines={3}
                      maxLength={500}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Pro Features */}
            {subscriptionStatus.canUseProFeatures && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Breeding Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Breeding Status</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      style={styles.picker}
                      selectedValue={breedingStatus}
                      onValueChange={setBreedingStatus}
                    >
                      <Picker.Item
                        label='Not Applicable'
                        value='not_applicable'
                      />
                      <Picker.Item label='Intact' value='intact' />
                      <Picker.Item label='Neutered/Spayed' value='neutered' />
                      <Picker.Item label='Breeding' value='breeding' />
                    </Picker>
                  </View>
                </View>

                {breedingStatus !== 'not_applicable' && (
                  <>
                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Sire Name</Text>
                        <TextInput
                          style={styles.input}
                          value={sireName}
                          onChangeText={setSireName}
                          placeholder="Father's name"
                          maxLength={100}
                        />
                      </View>

                      <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Dam Name</Text>
                        <TextInput
                          style={styles.input}
                          value={damName}
                          onChangeText={setDamName}
                          placeholder="Mother's name"
                          maxLength={100}
                        />
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Registration Number</Text>
                        <TextInput
                          style={styles.input}
                          value={registrationNumber}
                          onChangeText={setRegistrationNumber}
                          placeholder='Registration #'
                          maxLength={50}
                        />
                      </View>

                      <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Organization</Text>
                        <TextInput
                          style={styles.input}
                          value={registrationOrganization}
                          onChangeText={setRegistrationOrganization}
                          placeholder='e.g., AKC, UKC'
                          maxLength={100}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Breeding Notes</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={breedingNotes}
                        onChangeText={setBreedingNotes}
                        placeholder='Breeding history, genetic testing results, etc.'
                        multiline={true}
                        numberOfLines={3}
                        maxLength={500}
                      />
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Upgrade prompt for free users */}
            {!subscriptionStatus.canUsePremiumFeatures && (
              <View style={styles.upgradePrompt}>
                <Text style={styles.upgradeTitle}>
                  🚀 Unlock Advanced Features
                </Text>
                <Text style={styles.upgradeText}>
                  Upgrade to Premium for pet insurance tracking and more
                  detailed health records. Pro tier includes breeding
                  information and lineage tracking.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  cancelText: {
    color: '#6C757D',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  saveText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#ADB5BD',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#495057',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  upgradePrompt: {
    backgroundColor: '#FFF8E1',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCC02',
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#EF6C00',
    lineHeight: 20,
  },
  datePickerCloseButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  datePickerCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
