/**
 * CarePreferencesStep - Step 5
 * Collects exercise needs and special notes
 */

import type { StepProps } from '../types';
import { getExerciseOptions } from '../petPersonalityData';
import type { ExerciseLevel } from '@tailtracker/shared-types';

export const CarePreferencesStep = ({ data, onUpdate, hideHeader = false }: StepProps) => {
  const exerciseOptions = getExerciseOptions();

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Care Preferences
          </h2>
          <p className="text-slate-500">
            Tell us about {data.name}'s exercise needs and any special care requirements.
          </p>
        </div>
      )}

      {/* Exercise Needs */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Exercise Level
        </label>
        <div className="space-y-3">
          {exerciseOptions.map((option) => {
            const isSelected = data.exerciseNeeds === option.value;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onUpdate({ exerciseNeeds: option.value as ExerciseLevel })}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? 'border-primary-500' : 'border-slate-300'}
                    `}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        isSelected ? 'text-primary-700' : 'text-slate-700'
                      }`}
                    >
                      {option.label}
                    </p>
                    <p className="text-sm text-slate-500">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Notes */}
      <div>
        <label htmlFor="specialNotes" className="block text-sm font-medium text-slate-700 mb-1">
          Special Notes
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Any special care instructions, routines, or things to remember
        </p>
        <textarea
          id="specialNotes"
          value={data.specialNotes || ''}
          onChange={(e) => onUpdate({ specialNotes: e.target.value })}
          placeholder={`e.g., ${data.name} needs to be fed at specific times, prefers quiet environments, etc.`}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">
          {(data.specialNotes || '').length}/500 characters
        </p>
      </div>
    </div>
  );
};
