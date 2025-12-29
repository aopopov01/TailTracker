/**
 * PetImage Component
 * Displays pet photo with intelligent fallback to species-specific images
 * Fetches photos from Supabase Storage for each pet
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getPetPhotos } from '@tailtracker/shared-services';

interface PetImageProps {
  petId: string;
  species: string;
  petName?: string;
  className?: string;
  showLoader?: boolean;
}

// Get species-specific default image path
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

export const PetImage = ({
  petId,
  species,
  petName = 'Pet',
  className = '',
  showLoader = false,
}: PetImageProps) => {
  const [imageError, setImageError] = useState(false);

  // Fetch photos for this pet
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['petPhotos', petId],
    queryFn: () => getPetPhotos(petId),
    enabled: !!petId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get profile photo or first photo
  const profilePhoto = photos.find((p) => p.isProfilePhoto) || photos[0];
  const hasUploadedPhoto = !imageError && profilePhoto?.url;

  // Determine image source
  const imageSrc = hasUploadedPhoto ? profilePhoto.url : getDefaultPetImage(species);

  // Handle image load error - fallback to species image
  const handleError = () => {
    if (!imageError) {
      setImageError(true);
    }
  };

  // Show loader only if explicitly requested and loading
  if (showLoader && isLoading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={petName}
      className={className}
      onError={handleError}
      style={{
        // For uploaded photos, use cover to fill the space
        // For default species images, use contain to show full image
        objectFit: hasUploadedPhoto ? 'cover' : 'contain',
      }}
    />
  );
};
