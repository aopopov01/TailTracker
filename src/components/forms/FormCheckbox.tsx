import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Checkbox } from 'react-native-paper';

export interface FormCheckboxProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  error?: string;
  disabled?: boolean;
  style?: any;
  testID?: string;
  onSelect?: (value: boolean) => void; // Alias for backward compatibility
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  value,
  onValueChange,
  onSelect,
  error,
  disabled = false,
  style,
  testID,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.checkboxRow}>
        <Checkbox
          status={value ? 'checked' : 'unchecked'}
          onPress={() => {
            const newValue = !value;
            onValueChange(newValue);
            onSelect?.(newValue); // Also call onSelect if provided
          }}
          disabled={disabled}
          testID={testID}
        />
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.onSurface,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          onPress={() => {
            if (!disabled) {
              const newValue = !value;
              onValueChange(newValue);
              onSelect?.(newValue);
            }
          }}
        >
          {label}
        </Text>
      </View>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
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
