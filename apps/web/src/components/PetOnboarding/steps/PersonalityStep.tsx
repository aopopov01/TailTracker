/**
 * PersonalityStep - Step 4
 * Collects personality traits
 */

import type { StepProps } from '../types';
import { getAllPersonalityTraits } from '../petPersonalityData';

export const PersonalityStep = ({ data, onUpdate, hideHeader = false }: StepProps) => {
  const allTraits = getAllPersonalityTraits();
  const selectedTraits = data.personalityTraits || [];

  const toggleTrait = (traitId: string) => {
    const newTraits = selectedTraits.includes(traitId)
      ? selectedTraits.filter((t) => t !== traitId)
      : [...selectedTraits, traitId];
    onUpdate({ personalityTraits: newTraits });
  };

  // Group traits by category
  const traitsByCategory = allTraits.reduce(
    (acc, trait) => {
      if (!acc[trait.category]) {
        acc[trait.category] = [];
      }
      acc[trait.category].push(trait);
      return acc;
    },
    {} as Record<string, typeof allTraits>
  );

  const categoryLabels: Record<string, string> = {
    social: 'Social',
    behavior: 'Behavior',
    temperament: 'Temperament',
    energy: 'Energy Level',
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Personality Traits
          </h2>
          <p className="text-slate-500">
            Select the traits that best describe {data.name}'s personality. You can select multiple traits.
          </p>
        </div>
      )}

      {/* Traits by category */}
      {Object.entries(traitsByCategory).map(([category, traits]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-slate-600 mb-3">
            {categoryLabels[category] || category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {traits.map((trait) => {
              const isSelected = selectedTraits.includes(trait.id);
              return (
                <button
                  key={trait.id}
                  type="button"
                  onClick={() => toggleTrait(trait.id)}
                  className={`
                    px-4 py-2 rounded-full border-2 text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }
                  `}
                  title={trait.description}
                >
                  {trait.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected count */}
      <div className="pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          {selectedTraits.length === 0 ? (
            'No traits selected yet'
          ) : (
            <>
              <span className="font-medium text-primary-600">{selectedTraits.length}</span>{' '}
              trait{selectedTraits.length !== 1 ? 's' : ''} selected
            </>
          )}
        </p>
      </div>
    </div>
  );
};
