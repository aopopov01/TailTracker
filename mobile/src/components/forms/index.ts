/**
 * Form Components - Reusable form components with consistent styling
 * 
 * This module provides a collection of form components that follow clean code principles:
 * - Single responsibility: Each component handles one type of input
 * - Consistent API: All components follow the same prop patterns
 * - Reusable: Can be used across different forms
 * - Accessible: Include proper labels and error states
 */

export { FormField } from './FormField';
export { SelectField } from './SelectField';
export { BooleanField } from './BooleanField';
export { DateField } from './DateField';
export { PhotoField } from './PhotoField';
export { FormSection } from './FormSection';

// Types
export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
}