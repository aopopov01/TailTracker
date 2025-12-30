import React, { ComponentType, forwardRef } from 'react';
import { useDataSync } from '../../contexts/DataSyncContext';

// Field mapping configurations for different screen types
type FieldMappings = {
  [key: string]: { [fieldName: string]: string };
};

export const FIELD_MAPPINGS: FieldMappings = {
  // Pet-related fields that should be synchronized
  pet: {
    name: 'name',
    species: 'species',
    breed: 'breed',
    color: 'color',
    weight: 'weight',
    birth_date: 'birth_date',
    microchip_id: 'microchip_id',
    photo_url: 'photo_url',
    medical_conditions: 'medical_conditions',
    dietary_restrictions: 'dietary_restrictions',
    is_lost: 'is_lost',
  },

  // User-related fields that should be synchronized
  user: {
    full_name: 'full_name',
    ownerName: 'full_name', // Alternative field name mapping
    email: 'email',
    phone: 'phone',
    location: 'location',
    emergency_contact_name: 'emergency_contact_name',
    emergency_contact_phone: 'emergency_contact_phone',
    emergencyContact: 'emergency_contact_name', // Alternative mapping
    preferred_vet_clinic: 'preferred_vet_clinic',
  },

  // Medical-related fields that should be synchronized
  medical: {
    veterinarian: 'veterinarian',
    vet: 'veterinarian', // Alternative field name
    notes: 'notes',
    date: 'date',
    administered_date: 'date',
    next_due_date: 'date',
  },
};

export interface AutoPopulateConfig {
  petId?: string;
  context?: 'pet' | 'user' | 'medical';
  fieldMappings?: Record<string, string>;
  enableAutoPopulate?: boolean;
}

export interface WithAutoPopulateProps {
  autoPopulateConfig?: AutoPopulateConfig;
}

// Higher-order component to add auto-population capabilities to any form component
export const withAutoPopulate = <P extends object>(
  WrappedComponent: ComponentType<P>
) => {
  const WithAutoPopulateComponent = forwardRef<any, P & WithAutoPopulateProps>(
    (props, ref) => {
      const { autoPopulateConfig, ...restProps } = props;
      const dataSync = useDataSync();

      const config = {
        context: 'pet' as const,
        enableAutoPopulate: true,
        ...autoPopulateConfig,
      };

      // Enhanced props with auto-population capabilities
      const enhancedProps = {
        ...restProps,

        // Auto-population helper functions
        getAutoValue: (
          fieldName: string,
          context?: 'pet' | 'user' | 'medical'
        ) => {
          const ctx = context || config.context;
          const contextMappings = ctx ? FIELD_MAPPINGS[ctx] : {};
          const mappedField =
            config.fieldMappings?.[fieldName] ||
            contextMappings?.[fieldName] ||
            fieldName;
          return dataSync.getFieldValue(mappedField);
        },

        setAutoValue: (
          fieldName: string,
          value: any,
          context?: 'pet' | 'user' | 'medical'
        ) => {
          const ctx = context || config.context;
          const contextMappings = ctx ? FIELD_MAPPINGS[ctx] : {};
          const mappedField =
            config.fieldMappings?.[fieldName] ||
            contextMappings?.[fieldName] ||
            fieldName;
          dataSync.setFieldValue(mappedField, value);
        },

        // Pre-populated field values
        autoPopulatedValues: config.enableAutoPopulate
          ? (() => {
              const ctx = config.context;
              const values: Record<string, any> = {};
              const mappings =
                config.fieldMappings || FIELD_MAPPINGS[ctx] || {};

              Object.entries(mappings).forEach(([formField, dataField]) => {
                const value = dataSync.getFieldValue(dataField);
                if (value !== undefined && value !== null && value !== '') {
                  values[formField] = value;
                }
              });

              return values;
            })()
          : {},

        // Data sync context
        dataSync,

        // Configuration
        autoPopulateConfig: config,
      } as P & {
        getAutoValue: (
          fieldName: string,
          context?: 'pet' | 'user' | 'medical'
        ) => any;
        setAutoValue: (
          fieldName: string,
          value: any,
          context?: 'pet' | 'user' | 'medical'
        ) => void;
        autoPopulatedValues: Record<string, any>;
        dataSync: ReturnType<typeof useDataSync>;
        autoPopulateConfig: AutoPopulateConfig;
      };

      return <WrappedComponent ref={ref} {...enhancedProps} />;
    }
  );

  WithAutoPopulateComponent.displayName = `withAutoPopulate(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAutoPopulateComponent;
};

// Utility hook for forms that need auto-population
export const useFormAutoPopulate = (config: AutoPopulateConfig = {}) => {
  const dataSync = useDataSync();

  const finalConfig = {
    context: 'pet' as const,
    enableAutoPopulate: true,
    ...config,
  };

  const getFieldValue = (
    fieldName: string,
    context?: 'pet' | 'user' | 'medical'
  ) => {
    const ctx = context || finalConfig.context;
    const contextMappings = ctx ? FIELD_MAPPINGS[ctx] : {};
    const mappedField =
      finalConfig.fieldMappings?.[fieldName] ||
      contextMappings?.[fieldName] ||
      fieldName;
    return dataSync.getFieldValue(mappedField);
  };

  const setFieldValue = (
    fieldName: string,
    value: any,
    context?: 'pet' | 'user' | 'medical'
  ) => {
    const ctx = context || finalConfig.context;
    const contextMappings = ctx ? FIELD_MAPPINGS[ctx] : {};
    const mappedField =
      finalConfig.fieldMappings?.[fieldName] ||
      contextMappings?.[fieldName] ||
      fieldName;
    dataSync.setFieldValue(mappedField, value);
  };

  // Get all pre-populated values for the specified context
  const getAutoPopulatedValues = () => {
    if (!finalConfig.enableAutoPopulate) return {};

    const ctx = finalConfig.context;
    const values: Record<string, any> = {};
    const mappings = finalConfig.fieldMappings || FIELD_MAPPINGS[ctx] || {};

    Object.entries(mappings).forEach(([formField, dataField]) => {
      const value = dataSync.getFieldValue(dataField);
      if (value !== undefined && value !== null && value !== '') {
        values[formField] = value;
      }
    });

    return values;
  };

  return {
    getFieldValue,
    setFieldValue,
    autoPopulatedValues: getAutoPopulatedValues(),
    dataSync,
    isLoading: dataSync.isLoading,
    lastSync: dataSync.lastSync,
  };
};

export default withAutoPopulate;
