/**
 * PhotoGallery Component
 * Displays pet photos in a grid with lightbox and management options
 * Tier-aware: limits update when subscription changes
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Trash2,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from 'lucide-react';
import {
  getPetPhotos,
  deletePetPhoto,
  setProfilePhoto,
  type PetPhoto,
} from '@tailtracker/shared-services';
import { PhotoUpload } from './PhotoUpload';
import { useSubscription } from '@/hooks/useSubscription';

interface PhotoGalleryProps {
  petId: string;
  petName: string;
}

export const PhotoGallery = ({ petId, petName }: PhotoGalleryProps) => {
  const queryClient = useQueryClient();
  const { tier } = useSubscription();
  const [selectedPhoto, setSelectedPhoto] = useState<PetPhoto | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Fetch photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['petPhotos', petId],
    queryFn: () => getPetPhotos(petId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (photoPath: string) => {
      const result = await deletePetPhoto(petId, photoPath);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete photo');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petPhotos', petId] });
      // Include tier in query key to match PhotoUpload's query
      queryClient.invalidateQueries({ queryKey: ['photoLimits', petId, tier] });
      queryClient.invalidateQueries({ queryKey: ['pet', petId] });
      setShowDeleteConfirm(null);
      setSelectedPhoto(null);
    },
  });

  // Set profile photo mutation
  const setProfileMutation = useMutation({
    mutationFn: async (photoPath: string) => {
      const result = await setProfilePhoto(petId, photoPath);
      if (!result.success) {
        throw new Error(result.error || 'Failed to set profile photo');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petPhotos', petId] });
      queryClient.invalidateQueries({ queryKey: ['pet', petId] });
    },
  });

  const handleDeleteClick = (photoPath: string) => {
    setShowDeleteConfirm(photoPath);
  };

  const handleConfirmDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate(showDeleteConfirm);
    }
  };

  const handleSetProfile = (photoPath: string) => {
    setProfileMutation.mutate(photoPath);
  };

  const handlePrevious = () => {
    if (!selectedPhoto || photos.length === 0) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    setSelectedPhoto(photos[prevIndex]);
  };

  const handleNext = () => {
    if (!selectedPhoto || photos.length === 0) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    setSelectedPhoto(photos[nextIndex]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <PhotoUpload petId={petId} />

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <ImageOff className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No photos yet</p>
          <p className="text-sm text-slate-400">Upload photos of {petName} to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={`${petName} photo`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Profile badge */}
              {photo.isProfilePhoto && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Profile
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          {/* Close button */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={selectedPhoto.url}
            alt={`${petName} photo`}
            className="max-h-[80vh] max-w-[90vw] object-contain"
          />

          {/* Actions */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 px-4 py-2 rounded-lg">
            {!selectedPhoto.isProfilePhoto && (
              <button
                onClick={() => handleSetProfile(selectedPhoto.path)}
                disabled={setProfileMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:text-primary-300 transition-colors"
              >
                {setProfileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Set as Profile
              </button>
            )}
            <button
              onClick={() => handleDeleteClick(selectedPhoto.path)}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:text-red-400 transition-colors"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete Photo?
            </h3>
            <p className="text-slate-600 mb-6">
              This action cannot be undone. The photo will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
