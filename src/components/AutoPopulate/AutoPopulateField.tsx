import React, { useEffect, useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useAutoPopulateField } from '../../contexts/DataSyncContext';

interface AutoPopulateFieldProps
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  fieldPath: string;
  context?: 'pet' | 'user' | 'medical';
  value?: string;
  onChangeText?: (text: string) => void;
  enableAutoPopulate?: boolean;
  fallbackValue?: string;
}

export const AutoPopulateField: React.FC<AutoPopulateFieldProps> = ({
  fieldPath,
  context,
  value: controlledValue,
  onChangeText: controlledOnChangeText,
  enableAutoPopulate = true,
  fallbackValue = '',
  ...textInputProps
}) => {
  const {
    value: autoValue,
    setValue: setAutoValue,
    hasValue: hasAutoValue,
  } = useAutoPopulateField(fieldPath, context);

  const [localValue, setLocalValue] = useState('');
  const [hasBeenManuallyEdited, setHasBeenManuallyEdited] = useState(false);

  // Determine the current value based on priority:
  // 1. Controlled value (if provided)
  // 2. Local value (if manually edited)
  // 3. Auto-populated value (if available and auto-populate is enabled)
  // 4. Fallback value
  const currentValue =
    controlledValue !== undefined
      ? controlledValue
      : hasBeenManuallyEdited
        ? localValue
        : enableAutoPopulate && hasAutoValue
          ? autoValue
          : fallbackValue;

  // Auto-populate when field gains focus and is empty
  useEffect(() => {
    if (
      enableAutoPopulate &&
      !hasBeenManuallyEdited &&
      hasAutoValue &&
      !currentValue
    ) {
      setLocalValue(autoValue);
    }
  }, [
    autoValue,
    hasAutoValue,
    enableAutoPopulate,
    hasBeenManuallyEdited,
    currentValue,
  ]);

  const handleTextChange = (text: string) => {
    setHasBeenManuallyEdited(true);
    setLocalValue(text);

    // Update the shared context
    if (enableAutoPopulate) {
      setAutoValue(text);
    }

    // Call controlled onChangeText if provided
    if (controlledOnChangeText) {
      controlledOnChangeText(text);
    }
  };

  return (
    <TextInput
      {...textInputProps}
      value={currentValue}
      onChangeText={handleTextChange}
    />
  );
};

export default AutoPopulateField;
