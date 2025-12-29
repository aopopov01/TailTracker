/**
 * Pet Selection Modal
 * Allows users to select which pets to keep when downgrading their subscription
 */

import { useState } from 'react';
import { X, AlertTriangle, Check, Clock } from 'lucide-react';
import type { Pet } from '@tailtracker/shared-types';

// Helper function to get default image by species
const getDefaultPetImage = (species: string): string => {
  switch (species?.toLowerCase()) {
    case 'dog':
      return '/images/pets/dog.png';
    case 'cat':
      return '/images/pets/cat.png';
    case 'bird':
      return '/images/pets/bird.png';
    default:
      return '/images/pets/logo.png';
  }
};

// Get pet image - use uploaded photo if available, otherwise default species image
const getPetImage = (pet: { species: string; photos?: string[] }): string => {
  if (pet.photos && pet.photos.length > 0) {
    return pet.photos[0];
  }
  return getDefaultPetImage(pet.species);
};

interface PetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pets: Pet[];
  maxPets: number;
  onConfirm: (selectedPetIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

export const PetSelectionModal = ({
  isOpen,
  onClose,
  pets,
  maxPets,
  onConfirm,
  isLoading = false,
}: PetSelectionModalProps) => {
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const petsToHide = pets.length - maxPets;
  const canConfirm = selectedPetIds.length === maxPets;

  const togglePetSelection = (petId: string) => {
    setError(null);
    setSelectedPetIds((prev) => {
      if (prev.includes(petId)) {
        return prev.filter((id) => id !== petId);
      }
      if (prev.length >= maxPets) {
        setError(`You can only select ${maxPets} pet${maxPets !== 1 ? 's' : ''} to keep.`);
        return prev;
      }
      return [...prev, petId];
    });
  };

  const handleConfirm = async () => {
    if (!canConfirm) {
      setError(`Please select exactly ${maxPets} pet${maxPets !== 1 ? 's' : ''} to keep.`);
      return;
    }

    try {
      await onConfirm(selectedPetIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pets. Please try again.');
    }
  };

  const unselectedPets = pets.filter((pet) => !selectedPetIds.includes(pet.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select Pets to Keep</h2>
              <p className="text-sm text-slate-500">
                Your new plan allows {maxPets} pet{maxPets !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {petsToHide} pet{petsToHide !== 1 ? 's' : ''} will be hidden
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Unselected pets will be hidden from your account for 30 days. You can restore them
                  anytime by upgrading your plan within this period. After 30 days, hidden pets may
                  be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          {/* Selection Counter */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              Select {maxPets} pet{maxPets !== 1 ? 's' : ''} to keep active
            </p>
            <p className={`text-sm font-medium ${canConfirm ? 'text-primary-600' : 'text-slate-500'}`}>
              {selectedPetIds.length} / {maxPets} selected
            </p>
          </div>

          {/* Pet Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pets.map((pet) => {
              const isSelected = selectedPetIds.includes(pet.id);
              return (
                <button
                  key={pet.id}
                  onClick={() => togglePetSelection(pet.id)}
                  disabled={isLoading}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Selection indicator */}
                  <div
                    className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-primary-500' : 'border-2 border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white" />}
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={getPetImage(pet)}
                      alt={pet.name}
                      className="w-14 h-14 rounded-lg object-contain bg-slate-100"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-900">{pet.name}</h3>
                      <p className="text-sm text-slate-500 capitalize">
                        {pet.species}
                        {pet.breed && ` - ${pet.breed}`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Pets to be hidden preview */}
          {selectedPetIds.length > 0 && unselectedPets.length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Pets that will be hidden:
              </p>
              <div className="flex flex-wrap gap-2">
                {unselectedPets.map((pet) => (
                  <span
                    key={pet.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-full text-sm"
                  >
                    <img
                      src={getPetImage(pet)}
                      alt={pet.name}
                      className="w-5 h-5 rounded-full object-contain bg-white"
                    />
                    {pet.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              canConfirm && !isLoading
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Processing...' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </div>
  );
};
