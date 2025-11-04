import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Database } from '@/types/supabase';

// NOTE: health_records table doesn't exist - using medical_records structure
type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];

// NOTE: Omit document_urls and veterinarian_id to redefine with different types
interface HealthRecord
  extends Omit<MedicalRecord, 'document_urls' | 'veterinarian_id'> {
  weight?: number;
  temperature?: number;
  notes?: string;
  veterinarian_id?: string; // Redefine as string | undefined instead of string | null
}

interface Veterinarian {
  id: string;
  name: string;
  clinic_name?: string;
}

interface AddHealthRecordModalProps {
  visible: boolean;
  onClose: () => void;
  petId: string;
  record?: HealthRecord; // For editing
  onSuccess: () => void;
}

export const AddHealthRecordModal: React.FC<AddHealthRecordModalProps> = ({
  visible,
  onClose,
  petId,
  record,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordDate, setRecordDate] = useState(new Date());
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedVetId, setSelectedVetId] = useState('');
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadVeterinarians();
      if (record) {
        // Edit mode - populate fields
        setTitle(record.title);
        setDescription(record.description || '');
        setRecordDate(new Date(record.date_of_record));
        setWeight(record.weight?.toString() || '');
        setTemperature(record.temperature?.toString() || '');
        setNotes(record.notes || '');
        setSelectedVetId(record.veterinarian_id || '');
      } else {
        // Add mode - reset fields
        resetFields();
      }
    }
  }, [visible, record]);

  const resetFields = () => {
    setTitle('');
    setDescription('');
    setRecordDate(new Date());
    setWeight('');
    setTemperature('');
    setNotes('');
    setSelectedVetId('');
    setSelectedPhotos([]);
  };

  const loadVeterinarians = async () => {
    // NOTE: Veterinarians table doesn't exist - stubbed out
    // const vets = await healthRecordsService.getVeterinarians();
    setVeterinarians([]);
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Camera roll permission is needed to add photos'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the health record');
      return;
    }

    setIsLoading(true);

    try {
      const healthRecordData = {
        pet_id: petId,
        title: title.trim(),
        description: description.trim() || undefined,
        record_date: recordDate.toISOString().split('T')[0],
        veterinarian_id: selectedVetId || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        notes: notes.trim() || undefined,
      };

      // NOTE: health_records table doesn't exist - feature not implemented
      Alert.alert(
        'Feature Not Available',
        'Health records feature requires database schema update. Please use Medical Records instead.'
      );
      return;

      // Stubbed out code:
      // let result;
      // if (record) {
      //   result = await healthRecordsService.updateHealthRecord(record.id, healthRecordData);
      // } else {
      //   result = await healthRecordsService.createHealthRecord(healthRecordData);
      // }
      // if (!result.success) { Alert.alert('Error', 'Failed to save health record'); return; }
      // if (selectedPhotos.length > 0 && result.healthRecord) {
      //   for (const photoUri of selectedPhotos) {
      //     const uploadResult = await healthRecordsService.uploadHealthRecordPhoto(result.healthRecord.id, photoUri);
      //     if (!uploadResult.success) { Alert.alert('Photo Upload Error', uploadResult.error || 'Failed to upload photo'); }
      //   }
      // }

      onSuccess();
      onClose();
      Alert.alert(
        'Success',
        `Health record ${record ? 'updated' : 'created'} successfully`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save health record');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setRecordDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {record ? 'Edit Health Record' : 'Add Health Record'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text style={[styles.saveText, isLoading && styles.disabledText]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder='e.g., Annual Checkup, Dental Cleaning'
                maxLength={255}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder='Describe the health record...'
                multiline
                numberOfLines={3}
                textAlignVertical='top'
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {recordDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={recordDate}
                  mode='date'
                  display='default'
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Veterinarian</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Veterinarian (Optional)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedVetId}
                  onValueChange={setSelectedVetId}
                  style={styles.picker}
                >
                  <Picker.Item label='Select Veterinarian' value='' />
                  {veterinarians.map(vet => (
                    <Picker.Item
                      key={vet.id}
                      label={`Dr. ${vet.name}${vet.clinic_name ? ` - ${vet.clinic_name}` : ''}`}
                      value={vet.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Measurements</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder='0.0'
                  keyboardType='decimal-pad'
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Temperature (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={temperature}
                  onChangeText={setTemperature}
                  placeholder='0.0'
                  keyboardType='decimal-pad'
                />
              </View>
            </View>
          </View>

          {!record && ( // Only show photo section for new records
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={pickImage}
              >
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>

              {selectedPhotos.length > 0 && (
                <View style={styles.photosContainer}>
                  {selectedPhotos.map((uri, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri }} style={styles.photoPreview} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Text style={styles.removePhotoText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder='Any additional notes or observations...'
                multiline
                numberOfLines={4}
                textAlignVertical='top'
              />
            </View>
          </View>
        </ScrollView>
      </View>
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
    height: 100,
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
  addPhotoButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoItem: {
    position: 'relative',
    marginRight: 12,
    marginBottom: 12,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
