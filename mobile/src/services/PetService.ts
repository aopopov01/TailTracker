import { decode } from 'base64-arraybuffer';
import { FileSystem } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

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
  
  // Emergency contacts (Free: basic, Premium/Pro: multiple)
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  emergency_contact_2_name?: string; // Premium/Pro only
  emergency_contact_2_phone?: string; // Premium/Pro only
  emergency_contact_2_email?: string; // Premium/Pro only
  
  // Pet insurance (Premium/Pro only)
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
  
  // Health and special needs (all tiers)
  special_needs?: string;
  allergies?: string;
  medical_conditions?: string[];
  
  // Dietary information as simple notes (all tiers)
  dietary_notes?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface PetPhoto {
  id: string;
  pet_id: string;
  photo_url: string;
  caption?: string;
  file_size_bytes?: number;
  is_profile_photo: boolean;
  created_at: string;
}

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
  food_allergies?: string;
  dietary_preferences?: string;
}

class PetService {
  /**
   * Get all pets for the current user's families
   */
  async getPets(): Promise<Pet[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) throw new Error('User not found');

      // Get pets from all families where user is a member
      const { data: pets, error } = await supabase
        .from('pets')
        .select(`
          id,
          family_id,
          name,
          species,
          breed,
          color,
          gender,
          date_of_birth,
          weight_kg,
          microchip_number,
          status,
          personality_traits,
          behavioral_notes,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_email,
          emergency_contact_2_name,
          emergency_contact_2_phone,
          emergency_contact_2_email,
          insurance_provider,
          insurance_policy_number,
          insurance_contact_phone,
          insurance_coverage_details,
          breeding_status,
          breeding_notes,
          sire_name,
          dam_name,
          registration_number,
          registration_organization,
          special_needs,
          allergies,
          medical_conditions,
          food_allergies,
          dietary_preferences,
          created_by,
          created_at,
          updated_at,
          deleted_at
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return pets || [];
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  }

  /**
   * Get a specific pet by ID
   */
  async getPet(petId: string): Promise<Pet | null> {
    try {
      const { data: pet, error } = await supabase
        .from('pets')
        .select(`
          id,
          family_id,
          name,
          species,
          breed,
          color,
          gender,
          date_of_birth,
          weight_kg,
          microchip_number,
          status,
          personality_traits,
          behavioral_notes,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_email,
          emergency_contact_2_name,
          emergency_contact_2_phone,
          emergency_contact_2_email,
          insurance_provider,
          insurance_policy_number,
          insurance_contact_phone,
          insurance_coverage_details,
          breeding_status,
          breeding_notes,
          sire_name,
          dam_name,
          registration_number,
          registration_organization,
          special_needs,
          allergies,
          medical_conditions,
          food_allergies,
          dietary_preferences,
          created_by,
          created_at,
          updated_at,
          deleted_at
        `)
        .eq('id', petId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      return pet;
    } catch (error: any) {
      console.error('Error fetching pet:', error);
      return null;
    }
  }

  /**
   * Create a new pet (with subscription limits)
   */
  async createPet(petData: PetData): Promise<{ success: boolean; pet?: Pet; error?: string }> {
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
        return { success: false, error: 'User not found' };
      }

      // Validate Premium/Pro only fields
      const premiumFields = [
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
      ];

      // Check if free user is trying to use premium fields
      if (userRecord.subscription_status === 'free') {
        const usingPremiumFields = premiumFields.some(field => 
          petData[field as keyof PetData] !== undefined && petData[field as keyof PetData] !== null
        );

        if (usingPremiumFields) {
          return {
            success: false,
            error: 'Advanced pet profile features (multiple emergency contacts, insurance info, breeding details) are available in Premium and Pro tiers only.'
          };
        }
      }

      // Create pet
      const { data: pet, error } = await supabase
        .from('pets')
        .insert({
          ...petData,
          created_by: userRecord.id
        })
        .select()
        .single();

      if (error) {
        // Handle database constraint errors with user-friendly messages
        if (error.message.includes('Pet limit exceeded') || error.message.includes('Free tier allows only')) {
          return { success: false, error: error.message };
        }
        throw error;
      }

      return { success: true, pet };
    } catch (error: any) {
      console.error('Error creating pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing pet
   */
  async updatePet(petId: string, petData: Partial<PetData>): Promise<{ success: boolean; pet?: Pet; error?: string }> {
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
        return { success: false, error: 'User not found' };
      }

      // Validate Premium/Pro only fields
      const premiumFields = [
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
      ];

      // Check if free user is trying to use premium fields
      if (userRecord.subscription_status === 'free') {
        const usingPremiumFields = premiumFields.some(field => 
          petData[field as keyof PetData] !== undefined && petData[field as keyof PetData] !== null
        );

        if (usingPremiumFields) {
          return {
            success: false,
            error: 'Advanced pet profile features (multiple emergency contacts, insurance info, breeding details) are available in Premium and Pro tiers only.'
          };
        }
      }

      const { data: pet, error } = await supabase
        .from('pets')
        .update(petData)
        .eq('id', petId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, pet };
    } catch (error: any) {
      console.error('Error updating pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a pet (soft delete)
   */
  async deletePet(petId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', petId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get photos for a specific pet
   */
  async getPetPhotos(petId: string): Promise<PetPhoto[]> {
    try {
      const { data: photos, error } = await supabase
        .from('pet_photos')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return photos || [];
    } catch (error: any) {
      console.error('Error fetching pet photos:', error);
      return [];
    }
  }

  /**
   * Upload a pet photo with subscription limits
   */
  async uploadPetPhoto(
    petId: string, 
    imageUri: string, 
    caption?: string
  ): Promise<{ success: boolean; photo?: PetPhoto; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      const fileExt = 'jpg';
      const fileName = `${petId}/${Date.now()}.${fileExt}`;
      const filePath = `pet-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(uploadData.path);

      // Save photo record to database (this will trigger subscription limit checks)
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

        // Handle subscription limit errors
        if (dbError.message.includes('Photo limit exceeded')) {
          return { success: false, error: dbError.message };
        }
        throw dbError;
      }

      return { success: true, photo };
    } catch (error: any) {
      console.error('Error uploading pet photo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set a photo as profile photo
   */
  async setProfilePhoto(petId: string, photoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, remove profile photo flag from all photos for this pet
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

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error setting profile photo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a pet photo
   */
  async deletePetPhoto(photoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get photo info first
      const { data: photo, error: fetchError } = await supabase
        .from('pet_photos')
        .select('photo_url')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;

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

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting pet photo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pet photo limits based on subscription
   */
  async getPetPhotoLimits(): Promise<{ current: number; max: number; canUpload: boolean }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { current: 0, max: 1, canUpload: false };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { current: 0, max: 1, canUpload: false };
      }

      // Get photo limits based on subscription
      const maxPhotos = userRecord.subscription_status === 'free' ? 1 : 12;

      return { current: 0, max: maxPhotos, canUpload: true };
    } catch (error: any) {
      console.error('Error getting photo limits:', error);
      return { current: 0, max: 1, canUpload: false };
    }
  }

  /**
   * Check user's subscription status
   */
  async getSubscriptionStatus(): Promise<{ status: string; canUsePremiumFeatures: boolean; canUseProFeatures: boolean }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { status: 'free', canUsePremiumFeatures: false, canUseProFeatures: false };
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) {
        return { status: 'free', canUsePremiumFeatures: false, canUseProFeatures: false };
      }

      const canUsePremiumFeatures = ['premium', 'pro'].includes(userRecord.subscription_status);
      const canUseProFeatures = userRecord.subscription_status === 'pro';

      return {
        status: userRecord.subscription_status,
        canUsePremiumFeatures,
        canUseProFeatures
      };
    } catch (error: any) {
      console.error('Error getting subscription status:', error);
      return { status: 'free', canUsePremiumFeatures: false };
    }
  }
}

export const petService = new PetService();