import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { dataExportService, ExportOptions } from '@/services/DataExportService';

interface DataExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  visible,
  onClose
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['pets']);
  const [availableDataTypes, setAvailableDataTypes] = useState<string[]>([]);
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [includePhotos, setIncludePhotos] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAvailableDataTypes();
      // Set default date range (last year)
      const now = new Date();
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      setStartDate(lastYear);
      setEndDate(now);
    }
  }, [visible]);

  const loadAvailableDataTypes = async () => {
    const available = await dataExportService.getAvailableDataTypes();
    setAvailableDataTypes(available);
    
    // Select all available types by default
    if (available.length > 0) {
      setSelectedDataTypes(available);
    }
  };

  const handleDataTypeToggle = (dataType: string) => {
    setSelectedDataTypes(prev => {
      if (prev.includes(dataType)) {
        return prev.filter(type => type !== dataType);
      } else {
        return [...prev, dataType];
      }
    });
  };

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one data type to export');
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format: exportFormat,
        dataTypes: selectedDataTypes as any[],
        includePhotos,
        ...(useDateRange && {
          dateRange: {
            start: startDate,
            end: endDate
          }
        })
      };

      const result = await dataExportService.exportUserData(options);

      if (!result.success) {
        Alert.alert('Export Failed', result.error || 'Failed to export data');
        return;
      }

      if (result.filePath) {
        // Show success and share file
        Alert.alert(
          'Export Complete',
          'Your data has been exported successfully. Would you like to share it?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Share', 
              onPress: () => dataExportService.shareExportedFile(result.filePath!)
            }
          ]
        );
        onClose();
      }

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const getDataTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'pets': 'Pet Profiles',
      'vaccinations': 'Vaccination Records',
      'health_records': 'Health Records',
      'appointments': 'Veterinary Appointments',
      'lost_pet_reports': 'Lost Pet Reports'
    };
    return labels[type] || type;
  };

  const getDataTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'pets': 'paw',
      'vaccinations': 'medical',
      'health_records': 'heart',
      'appointments': 'calendar',
      'lost_pet_reports': 'alert-circle'
    };
    return icons[type] || 'document';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Export Data</Text>
          <TouchableOpacity onPress={handleExport} disabled={isExporting}>
            {isExporting ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.exportButton}>Export</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Export Format Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export Format</Text>
            <View style={styles.formatContainer}>
              <TouchableOpacity
                style={[
                  styles.formatOption,
                  exportFormat === 'csv' && styles.formatSelected
                ]}
                onPress={() => setExportFormat('csv')}
              >
                <Ionicons 
                  name="document-text" 
                  size={24} 
                  color={exportFormat === 'csv' ? '#007AFF' : '#666'} 
                />
                <Text style={[
                  styles.formatText,
                  exportFormat === 'csv' && styles.formatTextSelected
                ]}>
                  CSV
                </Text>
                <Text style={styles.formatDescription}>
                  Comma-separated values, compatible with Excel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formatOption,
                  exportFormat === 'pdf' && styles.formatSelected
                ]}
                onPress={() => setExportFormat('pdf')}
              >
                <Ionicons 
                  name="document" 
                  size={24} 
                  color={exportFormat === 'pdf' ? '#007AFF' : '#666'} 
                />
                <Text style={[
                  styles.formatText,
                  exportFormat === 'pdf' && styles.formatTextSelected
                ]}>
                  PDF
                </Text>
                <Text style={styles.formatDescription}>
                  Portable document format, ready to print
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Data Types Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data to Export</Text>
            {availableDataTypes.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Ionicons name="folder-open" size={48} color="#CCC" />
                <Text style={styles.noDataText}>No data available to export</Text>
              </View>
            ) : (
              <View style={styles.dataTypesContainer}>
                {availableDataTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dataTypeOption,
                      selectedDataTypes.includes(type) && styles.dataTypeSelected
                    ]}
                    onPress={() => handleDataTypeToggle(type)}
                  >
                    <View style={styles.dataTypeInfo}>
                      <Ionicons 
                        name={getDataTypeIcon(type) as any}
                        size={20} 
                        color={selectedDataTypes.includes(type) ? '#007AFF' : '#666'} 
                      />
                      <Text style={[
                        styles.dataTypeText,
                        selectedDataTypes.includes(type) && styles.dataTypeTextSelected
                      ]}>
                        {getDataTypeLabel(type)}
                      </Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      selectedDataTypes.includes(type) && styles.checkboxSelected
                    ]}>
                      {selectedDataTypes.includes(type) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Range Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <Switch
                value={useDateRange}
                onValueChange={setUseDateRange}
                trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                thumbColor="white"
              />
            </View>
            
            {useDateRange && (
              <View style={styles.dateRangeContainer}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={styles.dateText}>{format(startDate, 'MMM dd, yyyy')}</Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={styles.dateText}>{format(endDate, 'MMM dd, yyyy')}</Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Additional Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Options</Text>
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="image" size={20} color="#666" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Include Photos</Text>
                  <Text style={styles.optionDescription}>
                    Include pet photos in export (PDF only)
                  </Text>
                </View>
              </View>
              <Switch
                value={includePhotos}
                onValueChange={setIncludePhotos}
                trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                thumbColor="white"
                disabled={exportFormat === 'csv'}
              />
            </View>
          </View>

          {/* Pro Feature Info */}
          <View style={styles.proInfo}>
            <View style={styles.proHeader}>
              <Ionicons name="diamond" size={20} color="#FF9800" />
              <Text style={styles.proTitle}>Pro Feature</Text>
            </View>
            <Text style={styles.proDescription}>
              Data export is available to Pro subscribers. Export your complete pet data in CSV or PDF format for your records or to share with veterinarians.
            </Text>
          </View>
        </ScrollView>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
            maximumDate={endDate}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) setEndDate(selectedDate);
            }}
            minimumDate={startDate}
            maximumDate={new Date()}
          />
        )}
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  exportButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formatContainer: {
    gap: 12,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  formatSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  formatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
    marginRight: 8,
  },
  formatTextSelected: {
    color: '#007AFF',
  },
  formatDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  dataTypesContainer: {
    gap: 8,
  },
  dataTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  dataTypeSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  dataTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dataTypeText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  dataTypeTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  proInfo: {
    backgroundColor: '#FFF8E1',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginLeft: 8,
  },
  proDescription: {
    fontSize: 14,
    color: '#EF6C00',
    lineHeight: 20,
  },
});