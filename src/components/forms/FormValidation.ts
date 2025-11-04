// Form validation utilities
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => ValidationResult;
}

export class FormValidation {
  static validateField(value: any, rules: ValidationRule): ValidationResult {
    // Required validation
    if (
      rules.required &&
      (!value || (typeof value === 'string' && value.trim().length === 0))
    ) {
      return { isValid: false, error: 'This field is required' };
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return { isValid: true };
    }

    const stringValue = String(value);

    // Min length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
      return {
        isValid: false,
        error: `Must be at least ${rules.minLength} characters long`,
      };
    }

    // Max length validation
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return {
        isValid: false,
        error: `Must be no more than ${rules.maxLength} characters long`,
      };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return { isValid: false, error: 'Invalid format' };
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return { isValid: true };
  }

  static validateEmail(email: string): ValidationResult {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validateField(email, {
      required: true,
      pattern: emailPattern,
    });
  }

  static validatePhone(phone: string): ValidationResult {
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
    return this.validateField(phone, {
      pattern: phonePattern,
    });
  }

  static validatePassword(password: string): ValidationResult {
    if (!password || password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters long',
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one number',
      };
    }

    return { isValid: true };
  }

  static validatePetName(name: string): ValidationResult {
    return this.validateField(name, {
      required: true,
      minLength: 1,
      maxLength: 50,
      pattern: /^[a-zA-Z\s\-']+$/,
    });
  }

  static validateWeight(weight: string): ValidationResult {
    if (!weight) return { isValid: true }; // Optional field

    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || numericWeight <= 0) {
      return { isValid: false, error: 'Weight must be a positive number' };
    }

    if (numericWeight > 1000) {
      return { isValid: false, error: 'Weight seems too high' };
    }

    return { isValid: true };
  }

  static validateAge(age: string): ValidationResult {
    if (!age) return { isValid: true }; // Optional field

    const numericAge = parseInt(age, 10);
    if (isNaN(numericAge) || numericAge < 0) {
      return { isValid: false, error: 'Age must be a non-negative number' };
    }

    if (numericAge > 50) {
      return { isValid: false, error: 'Age seems too high' };
    }

    return { isValid: true };
  }

  static validateMicrochipId(microchipId: string): ValidationResult {
    if (!microchipId) return { isValid: true }; // Optional field

    // Microchip IDs are typically 15 digits
    const microchipPattern = /^\d{15}$/;
    return this.validateField(microchipId, {
      pattern: microchipPattern,
      custom: value => {
        if (value && !microchipPattern.test(value)) {
          return { isValid: false, error: 'Microchip ID must be 15 digits' };
        }
        return { isValid: true };
      },
    });
  }

  static validateForm(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
  ): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const fieldValue = data[fieldName];
      const fieldRules = rules[fieldName];
      const result = this.validateField(fieldValue, fieldRules);

      if (!result.isValid && result.error) {
        errors[fieldName] = result.error;
        isValid = false;
      }
    });

    return { isValid, errors };
  }

  // Specific validation sets
  static petFormValidation = {
    name: { required: true, minLength: 1, maxLength: 50 },
    species: { required: true },
    breed: { maxLength: 100 },
    weight: {
      custom: (value: string) => this.validateWeight(value),
    },
    age: {
      custom: (value: string) => this.validateAge(value),
    },
    microchipId: {
      custom: (value: string) => this.validateMicrochipId(value),
    },
  };

  static userRegistrationValidation = {
    name: { required: true, minLength: 2, maxLength: 100 },
    email: {
      required: true,
      custom: (value: string) => this.validateEmail(value),
    },
    password: {
      required: true,
      custom: (value: string) => this.validatePassword(value),
    },
    confirmPassword: {
      required: true,
      custom: (value: string, formData?: any) => {
        if (formData && value !== formData.password) {
          return { isValid: false, error: 'Passwords do not match' };
        }
        return { isValid: true };
      },
    },
  };

  static contactFormValidation = {
    name: { required: true, minLength: 2, maxLength: 100 },
    phone: {
      custom: (value: string) => this.validatePhone(value),
    },
    email: {
      custom: (value: string) =>
        value ? this.validateEmail(value) : { isValid: true },
    },
  };
}
