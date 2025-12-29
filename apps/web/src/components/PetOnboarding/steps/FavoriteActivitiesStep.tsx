/**
 * FavoriteActivitiesStep - Step 6
 * Collects species-specific favorite activities
 */

import { useMemo } from 'react';
import type { StepProps } from '../types';
import { getActivitiesBySpecies } from '../petPersonalityData';

export const FavoriteActivitiesStep = ({ data, onUpdate, hideHeader = false }: StepProps) => {
  const activities = useMemo(() => {
    if (!data.species) return [];
    return getActivitiesBySpecies(data.species);
  }, [data.species]);

  const selectedActivities = data.favoriteActivities || [];

  const toggleActivity = (activityId: string) => {
    const newActivities = selectedActivities.includes(activityId)
      ? selectedActivities.filter((a) => a !== activityId)
      : [...selectedActivities, activityId];
    onUpdate({ favoriteActivities: newActivities });
  };

  if (!data.species) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">Please select a species in Step 1 first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Favorite Activities
          </h2>
          <p className="text-slate-500">
            Select the activities that {data.name} enjoys the most.
          </p>
        </div>
      )}

      {/* Activity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activities.map((activity) => {
          const isSelected = selectedActivities.includes(activity.id);
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => toggleActivity(activity.id)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-slate-300'}
                  `}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      isSelected ? 'text-primary-700' : 'text-slate-700'
                    }`}
                  >
                    {activity.label}
                  </p>
                  <p className="text-sm text-slate-500">{activity.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty state for activities */}
      {activities.length === 0 && (
        <div className="bg-slate-50 p-6 rounded-lg text-center">
          <p className="text-slate-500">
            No specific activities available for this species type.
          </p>
        </div>
      )}

      {/* Selected count */}
      <div className="pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          {selectedActivities.length === 0 ? (
            'No activities selected yet'
          ) : (
            <>
              <span className="font-medium text-primary-600">{selectedActivities.length}</span>{' '}
              activit{selectedActivities.length !== 1 ? 'ies' : 'y'} selected
            </>
          )}
        </p>
      </div>
    </div>
  );
};
