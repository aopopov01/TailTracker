/**
 * HealthInfoStep - Step 3
 * Collects medical conditions, allergies, and medications
 */

import { useState } from 'react';
import { Plus, X, Phone, Mail, User } from 'lucide-react';
import type { StepProps } from '../types';

// Simple email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email === '' || emailRegex.test(email);
};

// Simple phone validation (allows various formats)
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]*$/;
  return phone === '' || (phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 6);
};

interface ArrayInputProps {
  label: string;
  placeholder: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  helpText?: string;
}

const ArrayInput = ({ label, placeholder, items, onAdd, onRemove, helpText }: ArrayInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      {helpText && (
        <p className="text-xs text-slate-500 mb-2">{helpText}</p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const HealthInfoStep = ({ data, onUpdate, hideHeader = false }: StepProps) => {
  const handleAddCondition = (condition: string) => {
    onUpdate({ medicalConditions: [...(data.medicalConditions || []), condition] });
  };

  const handleRemoveCondition = (index: number) => {
    onUpdate({
      medicalConditions: (data.medicalConditions || []).filter((_, i) => i !== index),
    });
  };

  const handleAddAllergy = (allergy: string) => {
    onUpdate({ allergies: [...(data.allergies || []), allergy] });
  };

  const handleRemoveAllergy = (index: number) => {
    onUpdate({
      allergies: (data.allergies || []).filter((_, i) => i !== index),
    });
  };

  const handleAddMedication = (medication: string) => {
    onUpdate({ currentMedications: [...(data.currentMedications || []), medication] });
  };

  const handleRemoveMedication = (index: number) => {
    onUpdate({
      currentMedications: (data.currentMedications || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Health Information
          </h2>
          <p className="text-slate-500">
            Add any health-related information about {data.name}. This helps track their overall wellness.
          </p>
        </div>
      )}

      {/* Medical Conditions */}
      <ArrayInput
        label="Medical Conditions"
        placeholder="e.g., Diabetes, Heart murmur"
        items={data.medicalConditions || []}
        onAdd={handleAddCondition}
        onRemove={handleRemoveCondition}
        helpText="Any ongoing health conditions or diagnoses"
      />

      {/* Allergies */}
      <ArrayInput
        label="Allergies"
        placeholder="e.g., Chicken, Grass, Pollen"
        items={data.allergies || []}
        onAdd={handleAddAllergy}
        onRemove={handleRemoveAllergy}
        helpText="Known allergies to food, medications, or environmental factors"
      />

      {/* Current Medications */}
      <ArrayInput
        label="Current Medications"
        placeholder="e.g., Insulin, Heartworm prevention"
        items={data.currentMedications || []}
        onAdd={handleAddMedication}
        onRemove={handleRemoveMedication}
        helpText="Medications currently being administered"
      />

      {/* Emergency Contact Section */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-lg font-medium text-slate-800 mb-2">Emergency Contact</h3>
        <p className="text-sm text-slate-500 mb-4">
          Someone who can be contacted if your pet is found or in an emergency. All fields are optional but recommended.
        </p>

        <div className="space-y-4">
          {/* Emergency Contact Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contact Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={data.emergencyContactName || ''}
                onChange={(e) => onUpdate({ emergencyContactName: e.target.value })}
                placeholder="Name of person to contact in emergency"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Emergency Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={data.emergencyContactPhone || ''}
                onChange={(e) => onUpdate({ emergencyContactPhone: e.target.value })}
                placeholder="Phone number"
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  data.emergencyContactPhone && !isValidPhone(data.emergencyContactPhone)
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
                }`}
              />
            </div>
            {data.emergencyContactPhone && !isValidPhone(data.emergencyContactPhone) && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid phone number</p>
            )}
          </div>

          {/* Emergency Contact Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={data.emergencyContactEmail || ''}
                onChange={(e) => onUpdate({ emergencyContactEmail: e.target.value })}
                placeholder="Email address"
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  data.emergencyContactEmail && !isValidEmail(data.emergencyContactEmail)
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
                }`}
              />
            </div>
            {data.emergencyContactEmail && !isValidEmail(data.emergencyContactEmail) && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
            )}
          </div>
        </div>
      </div>

      {/* No health issues note */}
      {!data.medicalConditions?.length && !data.allergies?.length && !data.currentMedications?.length && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
          <p className="font-medium">No health concerns added</p>
          <p className="mt-1">If {data.name} is healthy with no known issues, you can skip to the next step.</p>
        </div>
      )}
    </div>
  );
};
