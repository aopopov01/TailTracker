/**
 * Pet Photo Service
 * Platform-agnostic pet photo management using Supabase Storage
 */

import type { ApiResult } from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';
import { canAddPhoto, getMaxPhotosPerPet } from './subscriptionService';

const BUCKET_NAME = 'pet-photos';

export interface PetPhoto {
  id: string;
  url: string;
  path: string;
  name: string;
  size: number;
  createdAt: string;
  isProfilePhoto: boolean;
}

export interface PhotoUploadResult {
  photo: PetPhoto;
  isNewProfilePhoto: boolean;
}

/**
 * Get all photos for a pet
 */
export const getPetPhotos = async (petId: string): Promise<PetPhoto[]> => {
  const supabase = getSupabaseClient();

  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(petId, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Error fetching pet photos:', error);
    return [];
  }

  if (!files || files.length === 0) {
    return [];
  }

  // Get pet's profile photo URL
  const { data: pet } = await supabase
    .from('pets')
    .select('profile_photo_url')
    .eq('id', petId)
    .single();

  const profilePhotoPath = pet?.profile_photo_url;

  // Generate signed URLs for each photo
  const photos: PetPhoto[] = await Promise.all(
    files
      .filter((file) => !file.name.startsWith('.'))
      .map(async (file) => {
        const path = `${petId}/${file.name}`;
        const { data: signedUrl } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(path, 3600); // 1 hour expiry

        return {
          id: file.id || file.name,
          url: signedUrl?.signedUrl || '',
          path,
          name: file.name,
          size: file.metadata?.size || 0,
          createdAt: file.created_at || new Date().toISOString(),
          isProfilePhoto: profilePhotoPath === path,
        };
      })
  );

  return photos.filter((photo) => photo.url);
};

/**
 * Get photo count for a pet
 */
export const getPetPhotoCount = async (petId: string): Promise<number> => {
  const supabase = getSupabaseClient();

  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(petId);

  if (error) {
    console.error('Error counting pet photos:', error);
    return 0;
  }

  return files?.filter((file) => !file.name.startsWith('.')).length || 0;
};

/**
 * Upload a photo for a pet
 */
export const uploadPetPhoto = async (
  petId: string,
  file: File,
  setAsProfile: boolean = false
): Promise<ApiResult<PhotoUploadResult>> => {
  try {
    const supabase = getSupabaseClient();

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check photo limit
    const currentCount = await getPetPhotoCount(petId);
    const canAdd = await canAddPhoto(userData.user.id, currentCount);

    if (!canAdd) {
      const maxPhotos = await getMaxPhotosPerPet(userData.user.id);
      return {
        success: false,
        error: `Photo limit reached. Your plan allows ${maxPhotos} photo${maxPhotos === 1 ? '' : 's'} per pet. Upgrade to add more.`,
      };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large. Maximum size is 5MB.',
      };
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const fileName = `${timestamp}.${ext}`;
    const filePath = `${petId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return {
        success: false,
        error: uploadError.message || 'Failed to upload photo',
      };
    }

    // Get signed URL
    const { data: signedUrl } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600);

    // Check if this is the first photo or should be profile
    const isFirstPhoto = currentCount === 0;
    const shouldSetAsProfile = setAsProfile || isFirstPhoto;

    // Update pet's profile photo if needed
    if (shouldSetAsProfile) {
      await supabase
        .from('pets')
        .update({ profile_photo_url: filePath, updated_at: new Date().toISOString() })
        .eq('id', petId);
    }

    const photo: PetPhoto = {
      id: fileName,
      url: signedUrl?.signedUrl || '',
      path: filePath,
      name: fileName,
      size: file.size,
      createdAt: new Date().toISOString(),
      isProfilePhoto: shouldSetAsProfile,
    };

    return {
      success: true,
      data: {
        photo,
        isNewProfilePhoto: shouldSetAsProfile,
      },
    };
  } catch (error) {
    console.error('Error in uploadPetPhoto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload photo',
    };
  }
};

/**
 * Delete a photo
 */
export const deletePetPhoto = async (
  petId: string,
  photoPath: string
): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if this is the profile photo
    const { data: pet } = await supabase
      .from('pets')
      .select('profile_photo_url')
      .eq('id', petId)
      .single();

    const isProfilePhoto = pet?.profile_photo_url === photoPath;

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([photoPath]);

    if (deleteError) {
      console.error('Error deleting photo:', deleteError);
      return {
        success: false,
        error: deleteError.message || 'Failed to delete photo',
      };
    }

    // If this was the profile photo, clear it or set a new one
    if (isProfilePhoto) {
      // Get remaining photos
      const remainingPhotos = await getPetPhotos(petId);
      const newProfilePath = remainingPhotos.length > 0 ? remainingPhotos[0].path : null;

      await supabase
        .from('pets')
        .update({
          profile_photo_url: newProfilePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', petId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deletePetPhoto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete photo',
    };
  }
};

/**
 * Set a photo as the profile photo
 */
export const setProfilePhoto = async (
  petId: string,
  photoPath: string
): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('pets')
      .update({
        profile_photo_url: photoPath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', petId);

    if (error) {
      console.error('Error setting profile photo:', error);
      return {
        success: false,
        error: error.message || 'Failed to set profile photo',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in setProfilePhoto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set profile photo',
    };
  }
};

/**
 * Get photo limits for the current user
 */
export const getPhotoLimits = async (
  petId: string
): Promise<{ current: number; max: number; canUpload: boolean }> => {
  const supabase = getSupabaseClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { current: 0, max: 1, canUpload: false };
  }

  const current = await getPetPhotoCount(petId);
  const max = await getMaxPhotosPerPet(userData.user.id);
  const canUpload = current < max;

  return { current, max, canUpload };
};
