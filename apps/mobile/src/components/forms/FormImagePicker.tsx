import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export interface FormImagePickerProps {
  label: string;
  value?: string;
  onImageChange: (uri: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: any;
  testID?: string;
}

export const FormImagePicker: React.FC<FormImagePickerProps> = ({
  label,
  value,
  onImageChange,
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
      <Text style={{ color: theme.colors.onSurfaceVariant }}>
        Image picker component - implementation needed
      </Text>
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
});
