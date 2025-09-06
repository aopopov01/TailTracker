import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, TextInputProps, HelperText } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

interface MaterialTextInputProps extends Omit<TextInputProps, 'mode'> {
  variant?: 'outlined' | 'flat';
  helperText?: string;
  errorText?: string;
  required?: boolean;
}

export const MaterialTextInput: React.FC<MaterialTextInputProps> = ({
  variant = 'outlined',
  helperText,
  errorText,
  required = false,
  label,
  style,
  ...props
}) => {
  const theme = useTheme();
  const hasError = Boolean(errorText);

  const displayLabel = required && label ? `${label} *` : label;

  return (
    <View style={styles.container}>
      <TextInput
        mode={variant}
        label={displayLabel}
        error={hasError}
        style={[
          styles.input,
          {
            backgroundColor: variant === 'flat' 
              ? theme.colors.surfaceVariant 
              : theme.colors.surface,
          },
          style,
        ]}
        theme={{
          colors: {
            primary: theme.colors.primary,
            error: theme.colors.error,
            onSurface: theme.colors.onSurface,
            onSurfaceVariant: theme.colors.onSurfaceVariant,
            outline: theme.colors.outline,
          },
        }}
        {...props}
      />
      {(errorText || helperText) && (
        <HelperText 
          type={hasError ? 'error' : 'info'}
          visible={Boolean(errorText || helperText)}
        >
          {errorText || helperText}
        </HelperText>
      )}
    </View>
  );
};

// Specialized input variants
export const SearchInput: React.FC<MaterialTextInputProps> = (props) => (
  <MaterialTextInput
    variant="outlined"
    left={<TextInput.Icon icon="magnify" />}
    placeholder="Search..."
    {...props}
  />
);

export const PasswordInput: React.FC<MaterialTextInputProps> = (props) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  return (
    <MaterialTextInput
      variant="outlined"
      secureTextEntry={!showPassword}
      right={
        <TextInput.Icon
          icon={showPassword ? 'eye-off' : 'eye'}
          onPress={() => setShowPassword(!showPassword)}
        />
      }
      {...props}
    />
  );
};

export const EmailInput: React.FC<MaterialTextInputProps> = (props) => (
  <MaterialTextInput
    variant="outlined"
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    left={<TextInput.Icon icon="mail" />}
    {...props}
  />
);

export const PhoneInput: React.FC<MaterialTextInputProps> = (props) => (
  <MaterialTextInput
    variant="outlined"
    keyboardType="phone-pad"
    left={<TextInput.Icon icon="phone" />}
    {...props}
  />
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  input: {
    fontSize: 16,
  },
});