/**
 * ReviewStep - Step 7
 * Review all entered information before saving
 */

import { Check, AlertCircle } from 'lucide-react';
import type { StepProps } from '../types';
import { getAllPersonalityTraits, getActivitiesBySpecies, getExerciseOptions } from '../petPersonalityData';

interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

const ReviewSection = ({ title, children, isEmpty }: ReviewSectionProps) => (
  <div className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
    <h4 className="text-sm font-medium text-slate-500 mb-2">{title}</h4>
    {isEmpty ? (
      <p className="text-slate-400 text-sm italic">Not provided</p>
    ) : (
      <div className="text-slate-700">{children}</div>
    )}
  </div>
);

const formatExerciseLevel = (level: string | undefined): string => {
  const options = getExerciseOptions();
  const option = options.find((o) => o.value === level);
  return option?.label || 'Not specified';
};

export const ReviewStep = ({ data }: StepProps) => {
  const allTraits = getAllPersonalityTraits();
  const activities = data.species ? getActivitiesBySpecies(data.species) : [];

  const getTraitLabels = (traitIds: string[] = []) =>
    traitIds.map((id) => allTraits.find((t) => t.id === id)?.label || id);

  const getActivityLabels = (activityIds: string[] = []) =>
    activityIds.map((id) => activities.find((a) => a.id === id)?.label || id);

  const isValid = data.name && data.species;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Review & Create
        </h2>
        <p className="text-slate-500">
          Please review the information below before creating {data.name}'s profile.
        </p>
      </div>

      {/* Validation Warning */}
      {!isValid && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Missing Required Information</p>
            <p className="text-sm text-amber-700 mt-1">
              Please go back and provide the pet's name and species.
            </p>
          </div>
        </div>
      )}

      {/* Review Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 text-white">
          <h3 className="text-xl font-semibold">{data.name || 'Unnamed Pet'}</h3>
          <p className="text-primary-100 capitalize">{data.species || 'No species selected'}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Physical Details */}
          <ReviewSection title="Physical Details" isEmpty={!data.breed && !data.gender && !data.weightKg && !data.color}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.breed && <p><span className="text-slate-500">Breed:</span> {data.breed}</p>}
              {data.gender && <p><span className="text-slate-500">Gender:</span> <span className="capitalize">{data.gender}</span></p>}
              {data.dateOfBirth && <p><span className="text-slate-500">Born:</span> {new Date(data.dateOfBirth).toLocaleDateString()}</p>}
              {data.weightKg && <p><span className="text-slate-500">Weight:</span> {data.weightKg} kg</p>}
              {data.height && <p><span className="text-slate-500">Height:</span> {data.height}</p>}
              {data.color && <p><span className="text-slate-500">Color:</span> {data.color}</p>}
              {data.colorMarkings && <p><span className="text-slate-500">Markings:</span> {data.colorMarkings}</p>}
            </div>
          </ReviewSection>

          {/* Health Info */}
          <ReviewSection
            title="Health Information"
            isEmpty={!data.medicalConditions?.length && !data.allergies?.length && !data.currentMedications?.length}
          >
            <div className="space-y-2 text-sm">
              {data.medicalConditions?.length ? (
                <p><span className="text-slate-500">Conditions:</span> {data.medicalConditions.join(', ')}</p>
              ) : null}
              {data.allergies?.length ? (
                <p><span className="text-slate-500">Allergies:</span> {data.allergies.join(', ')}</p>
              ) : null}
              {data.currentMedications?.length ? (
                <p><span className="text-slate-500">Medications:</span> {data.currentMedications.join(', ')}</p>
              ) : null}
            </div>
          </ReviewSection>

          {/* Personality */}
          <ReviewSection title="Personality Traits" isEmpty={!data.personalityTraits?.length}>
            <div className="flex flex-wrap gap-1.5">
              {getTraitLabels(data.personalityTraits).map((label, i) => (
                <span key={i} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {label}
                </span>
              ))}
            </div>
          </ReviewSection>

          {/* Care Preferences */}
          <ReviewSection title="Care Preferences" isEmpty={!data.exerciseNeeds && !data.specialNotes}>
            <div className="text-sm space-y-2">
              {data.exerciseNeeds && (
                <p><span className="text-slate-500">Exercise:</span> {formatExerciseLevel(data.exerciseNeeds)}</p>
              )}
              {data.specialNotes && (
                <p><span className="text-slate-500">Notes:</span> {data.specialNotes}</p>
              )}
            </div>
          </ReviewSection>

          {/* Favorite Activities */}
          <ReviewSection title="Favorite Activities" isEmpty={!data.favoriteActivities?.length}>
            <div className="flex flex-wrap gap-1.5">
              {getActivityLabels(data.favoriteActivities).map((label, i) => (
                <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {label}
                </span>
              ))}
            </div>
          </ReviewSection>
        </div>
      </div>

      {/* Ready indicator */}
      {isValid && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">Ready to create {data.name}'s profile!</span>
        </div>
      )}
    </div>
  );
};
