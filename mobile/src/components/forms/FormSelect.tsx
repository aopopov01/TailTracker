import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Text, useTheme, HelperText } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface SelectOption {
  label: string;
  value: string;
  icon?: string;
}

export interface FormSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: any;
  testID?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
  style,
  testID,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };

  const renderOption = ({ item }: { item: SelectOption }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        { 
          backgroundColor: item.value === value ? theme.colors.primaryContainer : 'transparent',
          borderBottomColor: theme.colors.outline 
        }
      ]}
      onPress={() => handleSelect(item.value)}
    >
      {item.icon && (
        <Icon 
          name={item.icon} 
          size={20} 
          color={item.value === value ? theme.colors.onPrimaryContainer : theme.colors.onSurface}
          style={styles.optionIcon}
        />
      )}
      <Text 
        style={[
          styles.optionText,
          { color: item.value === value ? theme.colors.onPrimaryContainer : theme.colors.onSurface }
        ]}
      >
        {item.label}
      </Text>
      {item.value === value && (
        <Icon 
          name="check" 
          size={20} 
          color={theme.colors.onPrimaryContainer}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: theme.colors.onSurface }]}>
        {label}
        {required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.outline,
            opacity: disabled ? 0.5 : 1,
          }
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        testID={testID}
      >
        <View style={styles.selectContent}>
          {selectedOption?.icon && (
            <Icon 
              name={selectedOption.icon} 
              size={20} 
              color={theme.colors.onSurface}
              style={styles.selectedIcon}
            />
          )}
          <Text 
            style={[
              styles.selectText,
              { 
                color: selectedOption ? theme.colors.onSurface : theme.colors.onSurfaceVariant 
              }
            ]}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <Icon 
          name="chevron-down" 
          size={20} 
          color={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>
      
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Select {label}
            </Text>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.cancelText, { color: theme.colors.onSurfaceVariant }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 56,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIcon: {
    marginRight: 8,
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});