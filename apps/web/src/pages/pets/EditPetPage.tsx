/**
 * Edit Pet Page
 * Edit an existing pet's profile information
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, X } from 'lucide-react';
import { getPetById, updatePet } from '@tailtracker/shared-services';
import type { PetData } from '@tailtracker/shared-types';

import type { PetOnboardingData } from '@/components/PetOnboarding/types';
import { INITIAL_PET_DATA } from '@/components/PetOnboarding/types';
import { BasicInfoStep } from '@/components/PetOnboarding/steps/BasicInfoStep';
import { PhysicalDetailsStep } from '@/components/PetOnboarding/steps/PhysicalDetailsStep';
import { HealthInfoStep } from '@/components/PetOnboarding/steps/HealthInfoStep';
import { PersonalityStep } from '@/components/PetOnboarding/steps/PersonalityStep';
import { CarePreferencesStep } from '@/components/PetOnboarding/steps/CarePreferencesStep';
import { FavoriteActivitiesStep } from '@/components/PetOnboarding/steps/FavoriteActivitiesStep';

export const EditPetPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [petData, setPetData] = useState<PetOnboardingData>(INITIAL_PET_DATA);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch the pet data
  const {
    data: pet,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => getPetById(id!),
    enabled: !!id,
  });

  // Populate form with existing pet data
  useEffect(() => {
    if (pet) {
      setPetData({
        name: pet.name || '',
        species: pet.species || '',
        breed: pet.breed || undefined,
        gender: pet.gender as 'male' | 'female' | 'unknown' | undefined,
        dateOfBirth: pet.dateOfBirth || undefined,
        weightKg: pet.weight?.value || undefined,
        height: pet.height?.value ? String(pet.height.value) : undefined,
        color: pet.color || undefined,
        colorMarkings: pet.markings || undefined,
        microchipNumber: pet.microchipNumber || undefined,
        medicalConditions: pet.medicalConditions?.map((c) => (typeof c === 'string' ? c : c.name)) || undefined,
        allergies: pet.allergies || undefined,
        currentMedications: pet.currentMedications?.map((m) => (typeof m === 'string' ? m : m.name)) || undefined,
        personalityTraits: pet.personalityTraits || undefined,
        exerciseNeeds: pet.exerciseNeeds || undefined,
        specialNotes: pet.specialNotes || undefined,
        favoriteActivities: pet.favoriteActivities || undefined,
        emergencyContactName: pet.emergencyContact?.name || undefined,
        emergencyContactPhone: pet.emergencyContact?.phone || undefined,
        emergencyContactEmail: pet.emergencyContact?.email || undefined,
      });
    }
  }, [pet]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PetData>) => {
      const result = await updatePet(id!, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update pet');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', id] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      navigate(`/pets/${id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update pet');
    },
  });

  const updatePetData = (updates: Partial<PetOnboardingData>) => {
    setPetData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    if (!petData.name || !petData.species) {
      setError('Pet name and species are required');
      return;
    }

    setError(null);

    // Map wizard data to PetData format
    const submitData: Partial<PetData> = {
      name: petData.name,
      species: petData.species,
      breed: petData.breed,
      gender: petData.gender,
      dateOfBirth: petData.dateOfBirth,
      weightKg: petData.weightKg,
      height: petData.height,
      color: petData.color,
      colorMarkings: petData.colorMarkings,
      microchipNumber: petData.microchipNumber,
      medicalConditions: petData.medicalConditions,
      allergies: petData.allergies,
      currentMedications: petData.currentMedications,
      personalityTraits: petData.personalityTraits,
      exerciseNeeds: petData.exerciseNeeds,
      specialNotes: petData.specialNotes,
      favoriteActivities: petData.favoriteActivities,
      emergencyContactName: petData.emergencyContactName,
      emergencyContactPhone: petData.emergencyContactPhone,
      emergencyContactEmail: petData.emergencyContactEmail,
    };

    updateMutation.mutate(submitData);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/pets/${id}`);
      }
    } else {
      navigate(`/pets/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (fetchError || !pet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pet not found</h2>
        <p className="text-gray-600 mb-4">
          The pet you're trying to edit doesn't exist or has been removed.
        </p>
        <Link to="/pets" className="btn-primary">
          Back to My Pets
        </Link>
      </div>
    );
  }

  const stepProps = { data: petData, onUpdate: updatePetData };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/pets/${id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {pet.name}'s Profile
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Edit {pet.name}'s Profile</h1>
              <p className="mt-1 text-slate-600">
                Update your pet's information below
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={updateMutation.isPending || !hasChanges}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors
                  ${
                    updateMutation.isPending || !hasChanges
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }
                `}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h2>
            <BasicInfoStep {...stepProps} hideHeader />
          </div>

          {/* Physical Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Physical Details</h2>
            <PhysicalDetailsStep {...stepProps} hideHeader />
          </div>

          {/* Health Info Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Health Information</h2>
            <HealthInfoStep {...stepProps} hideHeader />
          </div>

          {/* Personality Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Personality Traits</h2>
            <PersonalityStep {...stepProps} hideHeader />
          </div>

          {/* Care Preferences Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Care Preferences</h2>
            <CarePreferencesStep {...stepProps} hideHeader />
          </div>

          {/* Favorite Activities Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Favorite Activities</h2>
            <FavoriteActivitiesStep {...stepProps} hideHeader />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-8 flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending || !hasChanges}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors
              ${
                updateMutation.isPending || !hasChanges
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }
            `}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
