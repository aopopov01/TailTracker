/**
 * PhysicalDetailsStep - Step 2
 * Collects breed, weight, height, color, markings, and microchip ID
 */

import { HelpCircle } from 'lucide-react';
import type { StepProps } from '../types';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unknown', label: 'Unknown' },
] as const;

export const PhysicalDetailsStep = ({ data, onUpdate, hideHeader = false }: StepProps) => {
  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Physical Details
          </h2>
          <p className="text-slate-500">
            Help us understand {data.name}'s physical characteristics.
          </p>
        </div>
      )}

      {/* Breed */}
      <div>
        <label htmlFor="breed" className="block text-sm font-medium text-slate-700 mb-1">
          Breed
        </label>
        <input
          id="breed"
          type="text"
          value={data.breed || ''}
          onChange={(e) => onUpdate({ breed: e.target.value })}
          placeholder={`What breed is ${data.name}?`}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Gender
        </label>
        <div className="flex gap-3">
          {GENDER_OPTIONS.map((option) => {
            const isSelected = data.gender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdate({ gender: option.value })}
                className={`
                  flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all
                  ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date of Birth */}
      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">
          Date of Birth
        </label>
        <input
          id="dateOfBirth"
          type="date"
          value={data.dateOfBirth || ''}
          onChange={(e) => onUpdate({ dateOfBirth: e.target.value })}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>

      {/* Weight and Height Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-slate-700 mb-1">
            Weight (kg)
          </label>
          <input
            id="weight"
            type="number"
            step="0.1"
            min="0"
            value={data.weightKg || ''}
            onChange={(e) => onUpdate({ weightKg: parseFloat(e.target.value) || undefined })}
            placeholder="e.g., 5.5"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-slate-700 mb-1">
            Height
          </label>
          <input
            id="height"
            type="text"
            value={data.height || ''}
            onChange={(e) => onUpdate({ height: e.target.value })}
            placeholder="e.g., 30cm"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Color and Markings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-slate-700 mb-1">
            Color
          </label>
          <input
            id="color"
            type="text"
            value={data.color || ''}
            onChange={(e) => onUpdate({ color: e.target.value })}
            placeholder="e.g., Golden"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="markings" className="block text-sm font-medium text-slate-700 mb-1">
            Markings
          </label>
          <input
            id="markings"
            type="text"
            value={data.colorMarkings || ''}
            onChange={(e) => onUpdate({ colorMarkings: e.target.value })}
            placeholder="e.g., White chest"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Microchip ID */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="microchipNumber" className="block text-sm font-medium text-slate-700">
            Microchip ID
          </label>
          <span className="text-xs text-slate-400">(optional)</span>
          <div className="group relative">
            <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
            <div className="absolute left-0 bottom-6 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              The unique identification number on your pet's implanted microchip. Usually 9-15 digits.
            </div>
          </div>
        </div>
        <input
          id="microchipNumber"
          type="text"
          value={data.microchipNumber || ''}
          onChange={(e) => onUpdate({ microchipNumber: e.target.value })}
          placeholder="Enter microchip number (optional)"
          maxLength={20}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors font-mono"
        />
        <p className="mt-1 text-xs text-slate-500">
          Found on your pet's registration documents or by scanning the microchip
        </p>
      </div>
    </div>
  );
};
