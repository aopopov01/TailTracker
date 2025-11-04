import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, RadioButton } from 'react-native-paper';

export interface RadioOption {
  label: string;
  value: string;
}

export interface FormRadioGroupProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: RadioOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: any;
  testID?: string;
}

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  label,
  value,
  onValueChange,
  options,
  error,
  required = false,
  disabled = false,
  style,
  testID,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: theme.colors.onSurface }]}>
        {label}
        {required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Text>
      <RadioButton.Group onValueChange={onValueChange} value={value}>
        {options.map(option => (
          <View key={option.value} style={styles.radioRow}>
            <RadioButton
              value={option.value}
              disabled={disabled}
              testID={`${testID}-${option.value}`}
            />
            <Text
              style={[
                styles.radioLabel,
                {
                  color: theme.colors.onSurface,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
              onPress={() => !disabled && onValueChange(option.value)}
            >
              {option.label}
            </Text>
          </View>
        ))}
      </RadioButton.Group>
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
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
    marginBottom: 8,
    marginLeft: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});
