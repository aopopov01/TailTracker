import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorMonitoring } from './ErrorMonitoringService';

export interface ValidationRule<T = any> {
  name: string;
  validator: (value: T, context?: ValidationContext) => ValidationResult;
  priority: number;
  errorMessage?: string;
  async?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorCode?: string;
  severity: 'error' | 'warning' | 'info';
  suggestions?: string[];
  metadata?: any;
}

export interface ValidationContext {
  field?: string;
  parentObject?: any;
  userId?: string;
  formData?: any;
  isRealTime?: boolean;
  previousValue?: any;
}

export interface FieldValidationConfig {
  rules: ValidationRule[];
  realTimeValidation: boolean;
  debounceMs: number;
  validateOnBlur: boolean;
  validateOnChange: boolean;
  showErrorsImmediately: boolean;
  customErrorRenderer?: (errors: ValidationResult[]) => string;
}

export interface FormValidationSchema {
  fields: Record<string, FieldValidationConfig>;
  crossFieldRules?: ValidationRule[];
  submitValidation?: ValidationRule[];
  asyncValidationTimeout?: number;
}

export interface ValidationState {
  isValidating: boolean;
  isValid: boolean;
  errors: Record<string, ValidationResult[]>;
  warnings: Record<string, ValidationResult[]>;
  touched: Set<string>;
  submitted: boolean;
  lastValidation: number;
}

export class DataValidationService {
  private static instance: DataValidationService;
  private validationSchemas = new Map<string, FormValidationSchema>();
  private validationStates = new Map<string, ValidationState>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private asyncValidationCache = new Map<string, { result: ValidationResult; timestamp: number }>();

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEYS = {
    VALIDATION_CACHE: '@tailtracker:validation_cache',
    VALIDATION_HISTORY: '@tailtracker:validation_history',
  };

  private constructor() {
    this.setupBuiltInValidators();
    this.loadCachedData();
  }

  public static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  /**
   * Register validation schema for a form
   */
  public registerSchema(formId: string, schema: FormValidationSchema): void {
    this.validationSchemas.set(formId, schema);
    
    // Initialize validation state
    this.validationStates.set(formId, {
      isValidating: false,
      isValid: false,
      errors: {},
      warnings: {},
      touched: new Set(),
      submitted: false,
      lastValidation: 0,
    });
  }

  /**
   * Validate a single field
   */
  public async validateField(
    formId: string,
    fieldName: string,
    value: any,
    context: ValidationContext = {}
  ): Promise<{
    isValid: boolean;
    errors: ValidationResult[];
    warnings: ValidationResult[];
  }> {
    const schema = this.validationSchemas.get(formId);
    if (!schema?.fields[fieldName]) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const fieldConfig = schema.fields[fieldName];
    const state = this.validationStates.get(formId)!;

    // Mark field as touched
    state.touched.add(fieldName);

    // Clear existing debounce timer
    const debounceKey = `${formId}_${fieldName}`;
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey)!);
    }

    return new Promise((resolve) => {
      const validateFn = async () => {
        try {
          state.isValidating = true;
          
          const results = await this.executeValidationRules(
            fieldConfig.rules,
            value,
            { ...context, field: fieldName, isRealTime: true }
          );

          const errors = results.filter(r => r.severity === 'error');
          const warnings = results.filter(r => r.severity === 'warning');

          // Update validation state
          state.errors[fieldName] = errors;
          state.warnings[fieldName] = warnings;
          state.lastValidation = Date.now();

          // Check overall form validity
          state.isValid = this.isFormValid(formId);

          const result = {
            isValid: errors.length === 0,
            errors,
            warnings,
          };

          resolve(result);
        } catch (error) {
          errorMonitoring.reportError(
            error as Error,
            { action: 'Field Validation', component: 'DataValidationService' }
          );
          
          resolve({
            isValid: false,
            errors: [{
              isValid: false,
              errorMessage: 'Validation error occurred',
              severity: 'error' as const,
            }],
            warnings: [],
          });
        } finally {
          state.isValidating = false;
        }
      };

      if (fieldConfig.realTimeValidation && fieldConfig.debounceMs > 0) {
        const timer = setTimeout(validateFn, fieldConfig.debounceMs);
        this.debounceTimers.set(debounceKey, timer);
      } else {
        validateFn();
      }
    });
  }

  /**
   * Validate entire form
   */
  public async validateForm(
    formId: string,
    formData: any,
    context: ValidationContext = {}
  ): Promise<{
    isValid: boolean;
    errors: Record<string, ValidationResult[]>;
    warnings: Record<string, ValidationResult[]>;
    summary: {
      totalErrors: number;
      totalWarnings: number;
      criticalErrors: number;
      fieldErrors: string[];
    };
  }> {
    const schema = this.validationSchemas.get(formId);
    if (!schema) {
      throw new Error(`No validation schema found for form: ${formId}`);
    }

    const state = this.validationStates.get(formId)!;
    state.submitted = true;
    state.isValidating = true;

    try {
      const fieldPromises = Object.entries(schema.fields).map(
        async ([fieldName, fieldConfig]) => {
          const fieldValue = this.getFieldValue(formData, fieldName);
          const fieldContext = {
            ...context,
            field: fieldName,
            parentObject: formData,
            formData,
          };

          const results = await this.executeValidationRules(
            fieldConfig.rules,
            fieldValue,
            fieldContext
          );

          return {
            fieldName,
            results: results.filter(r => r.severity === 'error'),
            warnings: results.filter(r => r.severity === 'warning'),
          };
        }
      );

      const fieldResults = await Promise.all(fieldPromises);

      // Process field validation results
      const errors: Record<string, ValidationResult[]> = {};
      const warnings: Record<string, ValidationResult[]> = {};

      fieldResults.forEach(({ fieldName, results, warnings: fieldWarnings }) => {
        if (results.length > 0) {
          errors[fieldName] = results;
        }
        if (fieldWarnings.length > 0) {
          warnings[fieldName] = fieldWarnings;
        }
      });

      // Execute cross-field validation
      if (schema.crossFieldRules) {
        const crossFieldResults = await this.executeValidationRules(
          schema.crossFieldRules,
          formData,
          { ...context, formData }
        );

        crossFieldResults.forEach(result => {
          const targetField = result.metadata?.field || '_form';
          if (result.severity === 'error') {
            if (!errors[targetField]) errors[targetField] = [];
            errors[targetField].push(result);
          } else if (result.severity === 'warning') {
            if (!warnings[targetField]) warnings[targetField] = [];
            warnings[targetField].push(result);
          }
        });
      }

      // Execute submit-specific validation
      if (schema.submitValidation) {
        const submitResults = await this.executeValidationRules(
          schema.submitValidation,
          formData,
          { ...context, formData }
        );

        submitResults.forEach(result => {
          const targetField = result.metadata?.field || '_submit';
          if (result.severity === 'error') {
            if (!errors[targetField]) errors[targetField] = [];
            errors[targetField].push(result);
          } else if (result.severity === 'warning') {
            if (!warnings[targetField]) warnings[targetField] = [];
            warnings[targetField].push(result);
          }
        });
      }

      // Update validation state
      state.errors = errors;
      state.warnings = warnings;
      state.isValid = Object.keys(errors).length === 0;
      state.lastValidation = Date.now();

      // Create summary
      const totalErrors = Object.values(errors).reduce((sum, errs) => sum + errs.length, 0);
      const totalWarnings = Object.values(warnings).reduce((sum, warns) => sum + warns.length, 0);
      const criticalErrors = Object.values(errors)
        .flat()
        .filter(e => e.metadata?.critical).length;
      const fieldErrors = Object.keys(errors);

      const summary = {
        totalErrors,
        totalWarnings,
        criticalErrors,
        fieldErrors,
      };

      // Log validation attempt
      errorMonitoring.addBreadcrumb({
        category: 'user_action',
        message: `Form validation: ${formId}`,
        level: state.isValid ? 'info' : 'warning',
        data: {
          formId,
          isValid: state.isValid,
          errorCount: totalErrors,
          warningCount: totalWarnings,
        },
      });

      return {
        isValid: state.isValid,
        errors,
        warnings,
        summary,
      };
    } catch (error) {
      errorMonitoring.reportError(
        error as Error,
        { action: 'Form Validation', component: 'DataValidationService' }
      );
      
      throw error;
    } finally {
      state.isValidating = false;
    }
  }

  /**
   * Get current validation state
   */
  public getValidationState(formId: string): ValidationState | null {
    return this.validationStates.get(formId) || null;
  }

  /**
   * Reset validation state
   */
  public resetValidation(formId: string, fieldName?: string): void {
    const state = this.validationStates.get(formId);
    if (!state) return;

    if (fieldName) {
      // Reset specific field
      delete state.errors[fieldName];
      delete state.warnings[fieldName];
      state.touched.delete(fieldName);
    } else {
      // Reset entire form
      state.errors = {};
      state.warnings = {};
      state.touched.clear();
      state.submitted = false;
      state.isValid = false;
    }

    state.lastValidation = Date.now();
  }

  /**
   * Execute validation rules
   */
  private async executeValidationRules(
    rules: ValidationRule[],
    value: any,
    context: ValidationContext
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Sort rules by priority (higher priority first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        let result: ValidationResult;

        if (rule.async) {
          // Check cache for async validation
          const cacheKey = this.generateCacheKey(rule.name, value, context);
          const cached = this.asyncValidationCache.get(cacheKey);
          
          if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            result = cached.result;
          } else {
            result = await Promise.race([
              Promise.resolve(rule.validator(value, context)),
              new Promise<ValidationResult>((_, reject) => 
                setTimeout(() => reject(new Error('Validation timeout')), 5000)
              ),
            ]);

            // Cache async result
            this.asyncValidationCache.set(cacheKey, {
              result,
              timestamp: Date.now(),
            });
          }
        } else {
          result = rule.validator(value, context);
        }

        // Override error message if provided in rule
        if (!result.isValid && rule.errorMessage) {
          result.errorMessage = rule.errorMessage;
        }

        results.push(result);

        // Stop on first error for critical validations
        if (!result.isValid && result.metadata?.stopOnError) {
          break;
        }
      } catch (error) {
        results.push({
          isValid: false,
          errorMessage: `Validation rule '${rule.name}' failed: ${error.message}`,
          errorCode: 'VALIDATION_ERROR',
          severity: 'error',
        });
      }
    }

    return results;
  }

  /**
   * Setup built-in validators
   */
  private setupBuiltInValidators(): void {
    // Common validation schemas can be registered here
    this.registerCommonPetValidationSchema();
    this.registerUserProfileValidationSchema();
    this.registerPaymentValidationSchema();
  }

  /**
   * Register common validation schemas
   */
  private registerCommonPetValidationSchema(): void {
    const petSchema: FormValidationSchema = {
      fields: {
        name: {
          rules: [
            {
              name: 'required',
              priority: 10,
              validator: (value) => ({
                isValid: Boolean(value?.trim()),
                errorMessage: 'Pet name is required',
                severity: 'error',
              }),
            },
            {
              name: 'length',
              priority: 8,
              validator: (value) => ({
                isValid: !value || (value.length >= 2 && value.length <= 50),
                errorMessage: 'Pet name must be between 2 and 50 characters',
                severity: 'error',
              }),
            },
            {
              name: 'special_characters',
              priority: 6,
              validator: (value) => {
                const invalidChars = /[<>{}[\]\\\/]/;
                return {
                  isValid: !value || !invalidChars.test(value),
                  errorMessage: 'Pet name contains invalid characters',
                  severity: 'error',
                };
              },
            },
          ],
          realTimeValidation: true,
          debounceMs: 300,
          validateOnBlur: true,
          validateOnChange: true,
          showErrorsImmediately: false,
        },
        breed: {
          rules: [
            {
              name: 'required',
              priority: 10,
              validator: (value) => ({
                isValid: Boolean(value),
                errorMessage: 'Please select a breed',
                severity: 'error',
              }),
            },
          ],
          realTimeValidation: false,
          debounceMs: 0,
          validateOnBlur: true,
          validateOnChange: false,
          showErrorsImmediately: false,
        },
        birthDate: {
          rules: [
            {
              name: 'required',
              priority: 10,
              validator: (value) => ({
                isValid: Boolean(value),
                errorMessage: 'Birth date is required',
                severity: 'error',
              }),
            },
            {
              name: 'valid_date',
              priority: 9,
              validator: (value) => {
                if (!value) return { isValid: true, severity: 'error' as const };
                
                const date = new Date(value);
                const now = new Date();
                const maxAge = new Date(now.getFullYear() - 30, now.getMonth(), now.getDate());
                
                return {
                  isValid: date <= now && date >= maxAge,
                  errorMessage: 'Please enter a valid birth date',
                  severity: 'error',
                };
              },
            },
          ],
          realTimeValidation: false,
          debounceMs: 0,
          validateOnBlur: true,
          validateOnChange: false,
          showErrorsImmediately: false,
        },
        weight: {
          rules: [
            {
              name: 'numeric',
              priority: 10,
              validator: (value) => ({
                isValid: !value || (!isNaN(parseFloat(value)) && parseFloat(value) > 0),
                errorMessage: 'Weight must be a positive number',
                severity: 'error',
              }),
            },
            {
              name: 'reasonable_range',
              priority: 8,
              validator: (value) => {
                if (!value) return { isValid: true, severity: 'warning' as const };
                
                const weight = parseFloat(value);
                const isReasonable = weight >= 0.1 && weight <= 200; // 0.1kg to 200kg
                
                return {
                  isValid: isReasonable,
                  errorMessage: isReasonable ? '' : 'Please verify the weight is correct',
                  severity: isReasonable ? 'info' : 'warning',
                  suggestions: ['Double-check the weight measurement'],
                };
              },
            },
          ],
          realTimeValidation: true,
          debounceMs: 500,
          validateOnBlur: true,
          validateOnChange: true,
          showErrorsImmediately: false,
        },
      },
      crossFieldRules: [
        {
          name: 'age_weight_consistency',
          priority: 5,
          validator: (formData) => {
            const { birthDate, weight } = formData;
            if (!birthDate || !weight) return { isValid: true, severity: 'info' as const };

            const age = this.calculateAgeInMonths(new Date(birthDate));
            const weightKg = parseFloat(weight);

            // Basic age-weight consistency check (very simplified)
            if (age < 6 && weightKg > 30) {
              return {
                isValid: true,
                errorMessage: 'Weight seems high for a young pet',
                severity: 'warning',
                suggestions: ['Verify weight measurement', 'Consider breed size'],
                metadata: { field: 'weight' },
              };
            }

            return { isValid: true, severity: 'info' as const };
          },
        },
      ],
    };

    this.registerSchema('pet_profile', petSchema);
  }

  private registerUserProfileValidationSchema(): void {
    const userSchema: FormValidationSchema = {
      fields: {
        email: {
          rules: [
            {
              name: 'required',
              priority: 10,
              validator: (value) => ({
                isValid: Boolean(value?.trim()),
                errorMessage: 'Email is required',
                severity: 'error',
              }),
            },
            {
              name: 'email_format',
              priority: 9,
              validator: (value) => {
                if (!value) return { isValid: true, severity: 'error' as const };
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return {
                  isValid: emailRegex.test(value),
                  errorMessage: 'Please enter a valid email address',
                  severity: 'error',
                };
              },
            },
            {
              name: 'email_availability',
              priority: 7,
              async: true,
              validator: async (value, context) => {
                if (!value || context?.isRealTime) {
                  return { isValid: true, severity: 'info' as const };
                }

                // Simulate async email check
                await this.delay(500);
                
                // This would be replaced with actual API call
                const isAvailable = !value.includes('taken@');
                
                return {
                  isValid: isAvailable,
                  errorMessage: isAvailable ? '' : 'Email address is already in use',
                  severity: isAvailable ? 'info' : 'error',
                };
              },
            },
          ],
          realTimeValidation: true,
          debounceMs: 1000,
          validateOnBlur: true,
          validateOnChange: true,
          showErrorsImmediately: false,
        },
        phone: {
          rules: [
            {
              name: 'phone_format',
              priority: 10,
              validator: (value) => {
                if (!value) return { isValid: true, severity: 'info' as const };
                
                const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
                return {
                  isValid: phoneRegex.test(value),
                  errorMessage: 'Please enter a valid phone number',
                  severity: 'error',
                };
              },
            },
          ],
          realTimeValidation: true,
          debounceMs: 500,
          validateOnBlur: true,
          validateOnChange: true,
          showErrorsImmediately: false,
        },
      },
    };

    this.registerSchema('user_profile', userSchema);
  }

  private registerPaymentValidationSchema(): void {
    const paymentSchema: FormValidationSchema = {
      fields: {
        cardNumber: {
          rules: [
            {
              name: 'required',
              priority: 10,
              validator: (value) => ({
                isValid: Boolean(value?.trim()),
                errorMessage: 'Card number is required',
                severity: 'error',
              }),
            },
            {
              name: 'card_number_format',
              priority: 9,
              validator: (value) => {
                if (!value) return { isValid: true, severity: 'error' as const };
                
                // Remove spaces and check if numeric
                const cleaned = value.replace(/\s/g, '');
                const isNumeric = /^\d{13,19}$/.test(cleaned);
                
                return {
                  isValid: isNumeric,
                  errorMessage: 'Please enter a valid card number',
                  severity: 'error',
                };
              },
            },
            {
              name: 'luhn_check',
              priority: 8,
              validator: (value) => {
                if (!value) return { isValid: true, severity: 'error' as const };
                
                const isValid = this.luhnCheck(value.replace(/\s/g, ''));
                return {
                  isValid,
                  errorMessage: isValid ? '' : 'Invalid card number',
                  severity: 'error',
                };
              },
            },
          ],
          realTimeValidation: true,
          debounceMs: 800,
          validateOnBlur: true,
          validateOnChange: true,
          showErrorsImmediately: false,
        },
        expiryDate: {
          rules: [
            {
              name: 'required',
              priority: 10,
              validator: (value) => ({
                isValid: Boolean(value?.trim()),
                errorMessage: 'Expiry date is required',
                severity: 'error',
              }),
            },
            {
              name: 'expiry_format',
              priority: 9,
              validator: (value) => {
                if (!value) return { isValid: true, severity: 'error' as const };
                
                const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
                return {
                  isValid: expiryRegex.test(value),
                  errorMessage: 'Please enter date as MM/YY',
                  severity: 'error',
                };
              },
            },
            {
              name: 'not_expired',
              priority: 8,
              validator: (value) => {
                if (!value || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(value)) {
                  return { isValid: true, severity: 'error' as const };
                }

                const [month, year] = value.split('/');
                const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
                const now = new Date();
                
                return {
                  isValid: expiryDate > now,
                  errorMessage: 'Card has expired',
                  severity: 'error',
                };
              },
            },
          ],
          realTimeValidation: true,
          debounceMs: 500,
          validateOnBlur: true,
          validateOnChange: true,
          showErrorsImmediately: false,
        },
        cvv: {
          rules: [
            {
              name: 'required',
              priority: 10,
              validator: (value) => ({
                isValid: Boolean(value?.trim()),
                errorMessage: 'CVV is required',
                severity: 'error',
              }),
            },
            {
              name: 'cvv_format',
              priority: 9,
              validator: (value) => {
                if (!value) return { isValid: true, severity: 'error' as const };
                
                const cvvRegex = /^[0-9]{3,4}$/;
                return {
                  isValid: cvvRegex.test(value),
                  errorMessage: 'CVV must be 3 or 4 digits',
                  severity: 'error',
                };
              },
            },
          ],
          realTimeValidation: false,
          debounceMs: 0,
          validateOnBlur: true,
          validateOnChange: false,
          showErrorsImmediately: false,
        },
      },
    };

    this.registerSchema('payment_form', paymentSchema);
  }

  /**
   * Utility methods
   */
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private isFormValid(formId: string): boolean {
    const state = this.validationStates.get(formId);
    return Boolean(state && Object.keys(state.errors).length === 0);
  }

  private generateCacheKey(ruleName: string, value: any, context: ValidationContext): string {
    const contextKey = JSON.stringify({
      field: context.field,
      userId: context.userId,
    });
    return `${ruleName}_${typeof value}_${JSON.stringify(value)}_${contextKey}`;
  }

  private calculateAgeInMonths(birthDate: Date): number {
    const now = new Date();
    const ageInMs = now.getTime() - birthDate.getTime();
    return ageInMs / (1000 * 60 * 60 * 24 * 30.44); // Approximate months
  }

  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async loadCachedData(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(this.STORAGE_KEYS.VALIDATION_CACHE);
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        this.asyncValidationCache = new Map(cache);
      }
    } catch (error) {
      console.warn('Failed to load validation cache:', error);
    }
  }

  private async persistCache(): Promise<void> {
    try {
      const cacheArray = Array.from(this.asyncValidationCache.entries());
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.VALIDATION_CACHE,
        JSON.stringify(cacheArray)
      );
    } catch (error) {
      console.warn('Failed to persist validation cache:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  public cleanupCache(): void {
    const now = Date.now();
    for (const [key, { timestamp }] of this.asyncValidationCache.entries()) {
      if (now - timestamp > this.CACHE_TTL) {
        this.asyncValidationCache.delete(key);
      }
    }
    this.persistCache();
  }
}

// Export singleton
export const dataValidationService = DataValidationService.getInstance();