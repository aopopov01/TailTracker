import { decode } from 'base64-arraybuffer';
import { FileSystem } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { IMAGE_CONFIG } from '@/constants/petForm';
import { supabase } from '@/lib/supabase';

/**
 * Pet data interface with comprehensive typing
 */
export interface Pet {
  id: string;
  family_id: string;
  name: string;
  species: string;
  breed?: string;
  color?: string;
  gender?: string;
  date_of_birth?: string;
  weight_kg?: number;
  microchip_number?: string;
  status: 'active' | 'deceased' | 'lost' | 'found';
  
  // Basic information (all tiers)
  personality_traits?: string;
  behavioral_notes?: string;
  
  // Emergency contacts
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  emergency_contact_2_name?: string; // Premium/Pro only
  emergency_contact_2_phone?: string; // Premium/Pro only
  emergency_contact_2_email?: string; // Premium/Pro only
  
  // Insurance (Premium/Pro only)
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_contact_phone?: string;
  insurance_coverage_details?: string;
  
  // Breeding information (Premium/Pro only)
  breeding_status?: 'not_applicable' | 'intact' | 'neutered' | 'breeding';
  breeding_notes?: string;
  sire_name?: string;
  dam_name?: string;
  registration_number?: string;
  registration_organization?: string;
  
  // Health information
  special_needs?: string;
  allergies?: string;
  medical_conditions?: string[];
  dietary_notes?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Pet photo interface
 */
export interface PetPhoto {
  id: string;
  pet_id: string;
  photo_url: string;
  caption?: string;
  file_size_bytes?: number;
  is_profile_photo: boolean;
  created_at: string;
}

/**
 * Service result interface for consistent error handling
 */
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Pet creation/update data interface
 */
interface PetData {
  family_id: string;
  name: string;
  species: string;
  breed?: string;
  color?: string;
  gender?: string;
  date_of_birth?: string;
  weight_kg?: number;
  microchip_number?: string;
  personality_traits?: string;
  behavioral_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  emergency_contact_2_name?: string;
  emergency_contact_2_phone?: string;
  emergency_contact_2_email?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_contact_phone?: string;
  insurance_coverage_details?: string;
  breeding_status?: string;
  breeding_notes?: string;
  sire_name?: string;
  dam_name?: string;
  registration_number?: string;
  registration_organization?: string;
  special_needs?: string;
  allergies?: string;
  medical_conditions?: string[];
  dietary_notes?: string;
}

/**
 * Subscription status interface
 */
interface SubscriptionInfo {
  status: string;
  canUsePremiumFeatures: boolean;
  canUseProFeatures: boolean;
}

/**
 * Photo limits interface
 */
interface PhotoLimits {
  current: number;
  max: number;
  canUpload: boolean;
}

/**
 * Premium feature fields that require subscription
 */
const PREMIUM_ONLY_FIELDS = [
  'emergency_contact_2_name',
  'emergency_contact_2_phone', 
  'emergency_contact_2_email',
  'insurance_provider',
  'insurance_policy_number',
  'insurance_contact_phone',
  'insurance_coverage_details',
  'breeding_status',
  'breeding_notes',
  'sire_name',
  'dam_name',
  'registration_number',
  'registration_organization'
] as const;/**
 * Enhanced Pet Service with clean code principles
 * 
 * Key improvements:
 * - Consistent error handling with ServiceResult interface
 * - Descriptive method names following verb-noun pattern
 * - Proper separation of concerns
 * - Comprehensive JSDoc documentation
 * - Type safety with TypeScript interfaces
 * - Single responsibility principle applied
 */
class PetService {

  /**
   * Get current authenticated user record
   * @private
   */
  private async getCurrentUser(): Promise<ServiceResult<any>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id, subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { success: false, error: 'User record not found' };
      }

      return { success: true, data: userRecord };
    } catch (error: any) {
      console.error('Error getting current user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate premium features access
   * @private
   */
  private validatePremiumFeatures(
    petData: Partial<PetData>, 
    subscriptionStatus: string
  ): ServiceResult<void> {
    if (subscriptionStatus === 'free') {
      const usingPremiumFields = PREMIUM_ONLY_FIELDS.some(field => 
        petData[field as keyof PetData] !== undefined && 
        petData[field as keyof PetData] !== null
      );

      if (usingPremiumFields) {
        return {
          success: false,
          error: 'Advanced pet profile features (multiple emergency contacts, insurance info, breeding details) are available in Premium and Pro tiers only.'
        };
      }
    }

    return { success: true };
  }

  /**
   * Retrieve all pets for the current user's families
   */
  async getAllUserPets(): Promise<ServiceResult<Pet[]>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.success) {
        return { success: false, error: userResult.error };
      }

      const { data: pets, error } = await supabase
        .from('pets')
        .select(`
          id, family_id, name, species, breed, color, gender, date_of_birth,
          weight_kg, microchip_number, status, personality_traits, behavioral_notes,
          emergency_contact_name, emergency_contact_phone, emergency_contact_email,
          emergency_contact_2_name, emergency_contact_2_phone, emergency_contact_2_email,
          insurance_provider, insurance_policy_number, insurance_contact_phone,
          insurance_coverage_details, breeding_status, breeding_notes, sire_name,
          dam_name, registration_number, registration_organization, special_needs,
          allergies, medical_conditions, dietary_notes, created_by, created_at,
          updated_at, deleted_at
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch pets: ${error.message}`);
      }

      return { success: true, data: pets || [] };
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve a specific pet by ID
   */
  async getPetById(petId: string): Promise<ServiceResult<Pet>> {
    try {
      const { data: pet, error } = await supabase
        .from('pets')
        .select(`
          id, family_id, name, species, breed, color, gender, date_of_birth,
          weight_kg, microchip_number, status, personality_traits, behavioral_notes,
          emergency_contact_name, emergency_contact_phone, emergency_contact_email,
          emergency_contact_2_name, emergency_contact_2_phone, emergency_contact_2_email,
          insurance_provider, insurance_policy_number, insurance_contact_phone,
          insurance_coverage_details, breeding_status, breeding_notes, sire_name,
          dam_name, registration_number, registration_organization, special_needs,
          allergies, medical_conditions, dietary_notes, created_by, created_at,
          updated_at, deleted_at
        `)
        .eq('id', petId)
        .is('deleted_at', null)
        .single();

      if (error) {
        throw new Error(`Failed to fetch pet: ${error.message}`);
      }

      if (!pet) {
        return { success: false, error: 'Pet not found' };
      }

      return { success: true, data: pet };
    } catch (error: any) {
      console.error('Error fetching pet by ID:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new pet profile
   */
  async createPetProfile(petData: PetData): Promise<ServiceResult<Pet>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.success) {
        return { success: false, error: userResult.error };
      }

      const user = userResult.data;

      // Validate premium features
      const validationResult = this.validatePremiumFeatures(petData, user.subscription_status);
      if (!validationResult.success) {
        return validationResult;
      }

      const { data: pet, error } = await supabase
        .from('pets')
        .insert({
          ...petData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('Pet limit exceeded') || 
            error.message.includes('Free tier allows only')) {
          return { success: false, error: error.message };
        }
        throw new Error(`Failed to create pet: ${error.message}`);
      }

      return { success: true, data: pet };
    } catch (error: any) {
      console.error('Error creating pet:', error);
      return { success: false, error: error.message };
    }
  }  /**
   * Update an existing pet profile
   */
  async updatePetProfile(petId: string, petData: Partial<PetData>): Promise<ServiceResult<Pet>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.success) {
        return { success: false, error: userResult.error };
      }

      const user = userResult.data;

      // Validate premium features
      const validationResult = this.validatePremiumFeatures(petData, user.subscription_status);
      if (!validationResult.success) {
        return validationResult;
      }

      const { data: pet, error } = await supabase
        .from('pets')
        .update(petData)
        .eq('id', petId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update pet: ${error.message}`);
      }

      return { success: true, data: pet };
    } catch (error: any) {
      console.error('Error updating pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Soft delete a pet profile
   */
  async deletePetProfile(petId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('pets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', petId);

      if (error) {
        throw new Error(`Failed to delete pet: ${error.message}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve all photos for a specific pet
   */
  async getPetPhotos(petId: string): Promise<ServiceResult<PetPhoto[]>> {
    try {
      const { data: photos, error } = await supabase
        .from('pet_photos')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch pet photos: ${error.message}`);
      }

      return { success: true, data: photos || [] };
    } catch (error: any) {
      console.error('Error fetching pet photos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process and optimize image for upload
   * @private
   */
  private async processImageForUpload(imageUri: string): Promise<ServiceResult<string>> {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: IMAGE_CONFIG.MAX_WIDTH } }],
        {
          compress: IMAGE_CONFIG.COMPRESS_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      return { success: true, data: base64 };
    } catch (error: any) {
      console.error('Error processing image:', error);
      return { success: false, error: 'Failed to process image' };
    }
  }

  /**
   * Upload a photo for a pet
   */
  async uploadPetPhoto(
    petId: string, 
    imageUri: string, 
    caption?: string
  ): Promise<ServiceResult<PetPhoto>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.success) {
        return { success: false, error: userResult.error };
      }

      // Process image
      const imageResult = await this.processImageForUpload(imageUri);
      if (!imageResult.success) {
        return imageResult;
      }

      const base64 = imageResult.data!;
      const fileName = `${petId}/${Date.now()}.jpg`;
      const filePath = `pet-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(uploadData.path);

      // Save photo record to database
      const { data: photo, error: dbError } = await supabase
        .from('pet_photos')
        .insert({
          pet_id: petId,
          photo_url: publicUrl,
          caption: caption || null,
          file_size_bytes: base64.length,
          is_profile_photo: false
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('pet-photos')
          .remove([uploadData.path]);

        if (dbError.message.includes('Photo limit exceeded')) {
          return { success: false, error: dbError.message };
        }
        throw new Error(`Failed to save photo record: ${dbError.message}`);
      }

      return { success: true, data: photo };
    } catch (error: any) {
      console.error('Error uploading pet photo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set a photo as the profile photo for a pet
   */
  async setProfilePhoto(petId: string, photoId: string): Promise<ServiceResult<void>> {
    try {
      // Remove profile photo flag from all photos for this pet
      await supabase
        .from('pet_photos')
        .update({ is_profile_photo: false })
        .eq('pet_id', petId);

      // Set the selected photo as profile photo
      const { error } = await supabase
        .from('pet_photos')
        .update({ is_profile_photo: true })
        .eq('id', photoId)
        .eq('pet_id', petId);

      if (error) {
        throw new Error(`Failed to set profile photo: ${error.message}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error setting profile photo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a pet photo
   */
  async deletePetPhoto(photoId: string): Promise<ServiceResult<void>> {
    try {
      // Get photo info first
      const { data: photo, error: fetchError } = await supabase
        .from('pet_photos')
        .select('photo_url')
        .eq('id', photoId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch photo info: ${fetchError.message}`);
      }

      // Extract file path from URL
      const urlParts = photo.photo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const petId = urlParts[urlParts.length - 2];
      const filePath = `pet-photos/${petId}/${fileName}`;

      // Delete from storage
      await supabase.storage
        .from('pet-photos')
        .remove([filePath]);

      // Delete from database
      const { error: deleteError } = await supabase
        .from('pet_photos')
        .delete()
        .eq('id', photoId);

      if (deleteError) {
        throw new Error(`Failed to delete photo record: ${deleteError.message}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting pet photo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get photo upload limits based on subscription
   */
  async getPhotoLimits(): Promise<ServiceResult<PhotoLimits>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.success) {
        return { 
          success: true, 
          data: { current: 0, max: 1, canUpload: false } 
        };
      }

      const user = userResult.data;
      const maxPhotos = user.subscription_status === 'free' ? 1 : 12;

      return { 
        success: true, 
        data: { current: 0, max: maxPhotos, canUpload: true } 
      };
    } catch (error: any) {
      console.error('Error getting photo limits:', error);
      return { 
        success: true, 
        data: { current: 0, max: 1, canUpload: false } 
      };
    }
  }

  /**
   * Get user's subscription information
   */
  async getSubscriptionInfo(): Promise<ServiceResult<SubscriptionInfo>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.success) {
        return { 
          success: true, 
          data: { 
            status: 'free', 
            canUsePremiumFeatures: false, 
            canUseProFeatures: false 
          } 
        };
      }

      const user = userResult.data;
      const canUsePremiumFeatures = ['premium', 'pro'].includes(user.subscription_status);
      const canUseProFeatures = user.subscription_status === 'pro';

      return {
        success: true,
        data: {
          status: user.subscription_status,
          canUsePremiumFeatures,
          canUseProFeatures
        }
      };
    } catch (error: any) {
      console.error('Error getting subscription info:', error);
      return { 
        success: true, 
        data: { 
          status: 'free', 
          canUsePremiumFeatures: false, 
          canUseProFeatures: false 
        } 
      };
    }
  }
}

/**
 * Export singleton instance of PetService
 */
export const petService = new PetService();