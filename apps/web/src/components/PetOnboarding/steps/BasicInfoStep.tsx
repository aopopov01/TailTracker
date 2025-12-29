/**
 * BasicInfoStep - Step 1
 * Collects pet name and species
 */

import type { StepProps } from '../types';
import type { PetSpecies } from '@tailtracker/shared-types';

interface SpeciesOption {
  value: PetSpecies;
  label: string;
  icon: React.ReactNode;
}

const SPECIES_OPTIONS: SpeciesOption[] = [
  { value: 'dog', label: 'Dog', icon: <img src="/images/pets/Dog.png" alt="Dog" className="w-12 h-12 object-contain" /> },
  { value: 'cat', label: 'Cat', icon: <img src="/images/pets/Cat.png" alt="Cat" className="w-12 h-12 object-contain" /> },
  { value: 'bird', label: 'Bird', icon: <img src="/images/pets/Bird.png" alt="Bird" className="w-12 h-12 object-contain" /> },
  { value: 'other', label: 'Other', icon: <img src="/images/pets/Logo.png" alt="Other" className="w-12 h-12 object-contain" /> },
];

export const BasicInfoStep = ({ data, onUpdate, hideHeader = false }: StepProps) => {
  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Let's get started!
          </h2>
          <p className="text-slate-500">
            Tell us your pet's name and what type of pet they are.
          </p>
        </div>
      )}

      {/* Pet Name */}
      <div>
        <label htmlFor="petName" className="block text-sm font-medium text-slate-700 mb-1">
          Pet Name <span className="text-red-500">*</span>
        </label>
        <input
          id="petName"
          type="text"
          value={data.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Enter your pet's name"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          autoFocus
        />
      </div>

      {/* Species Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Species <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {SPECIES_OPTIONS.map((option) => {
            const isSelected = data.species === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdate({ species: option.value, favoriteActivities: [] })}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                  ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                <div className={isSelected ? 'text-primary-600' : 'text-slate-400'}>
                  {option.icon}
                </div>
                <span className="mt-2 text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Helper text */}
      {data.species && (
        <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
          Great! You selected <strong>{data.species}</strong>. We'll show you species-specific options in the following steps.
        </p>
      )}
    </div>
  );
};
