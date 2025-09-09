import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, useTheme, HelperText } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface FormDatePickerProps {
  label: string;
  value: Date | undefined;
  onDateChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  style?: any;
  testID?: string;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onDateChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select date',
  style,
  testID,
}) => {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    switch (mode) {
      case 'time':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return date.toLocaleString();
      default:
        return date.toLocaleDateString();
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'time':
        return 'clock-outline';
      case 'datetime':
        return 'calendar-clock';
      default:
        return 'calendar';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: theme.colors.onSurface }]}>
        {label}
        {required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.dateButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.outline,
            opacity: disabled ? 0.5 : 1,
          }
        ]}
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
        testID={testID}
      >
        <Icon 
          name={getIcon()} 
          size={20} 
          color={theme.colors.onSurface}
          style={styles.icon}
        />
        <Text 
          style={[
            styles.dateText,
            { 
              color: value ? theme.colors.onSurface : theme.colors.onSurfaceVariant 
            }
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>
      
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 56,
  },
  icon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },
});