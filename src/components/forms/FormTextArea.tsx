import React from 'react';
import { FormInput, FormInputProps } from './FormInput';

export interface FormTextAreaProps
  extends Omit<FormInputProps, 'multiline' | 'numberOfLines'> {
  numberOfLines?: number;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  numberOfLines = 4,
  ...props
}) => {
  return (
    <FormInput {...props} multiline={true} numberOfLines={numberOfLines} />
  );
};
