// TailTracker Health Records Service with Tier-Based Restrictions
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

export interface Veterinarian {
  id: string;
  user_id: string;
  name: string;
  clinic_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  pet_id: string;
  title: string;
  description?: string;
  record_date: string;
  veterinarian_id?: string;
  weight?: number;
  temperature?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  veterinarian?: Veterinarian;
  photos: HealthRecordPhoto[];
}

export interface HealthRecordPhoto {
  id: string;
  health_record_id: string;
  photo_url: string;
  caption?: string;
  file_size_bytes?: number;
  created_at: string;
}

export interface Vaccination {
  id: string;
  pet_id: string;
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string;
  batch_number?: string;
  veterinarian_id?: string;
  notes?: string;
  certificate_photo_url?: string;
  created_at: string;
  updated_at: string;
  veterinarian?: Veterinarian;
}

export interface HealthNotification {
  id: string;
  user_id: string;
  pet_id: string;
  notification_type: 'vaccination_reminder' | 'custom_reminder';
  title: string;
  description?: string;
  notification_date: string;
  is_sent: boolean;
  vaccination_id?: string;
  created_at: string;
}

class HealthRecordsService {
  /**
   * Get all veterinarians for the current user
   * Respects subscription limits: Free (1), Premium/Pro (3)
   */
  async getVeterinarians(): Promise<Veterinarian[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) throw new Error('User record not found');

      const { data, error } = await supabase
        .from('veterinarians')
        .select('*')
        .eq('user_id', userRecord.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching veterinarians:', error);
      return [];
    }
  }

  /**
   * Add a new veterinarian
   * Enforces subscription limits at database level
   */
  async addVeterinarian(veterinarian: {
    name: string;
    clinic_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }): Promise<{ success: boolean; veterinarian?: Veterinarian; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) throw new Error('User record not found');

      const { data, error } = await supabase
        .from('veterinarians')
        .insert({
          user_id: userRecord.id,
          ...veterinarian
        })
        .select()
        .single();

      if (error) {
        // Handle subscription limit errors
        if (error.message.includes('Free tier allows 1 veterinarian')) {
          return {
            success: false,
            error: 'Free tier allows 1 veterinarian contact. Upgrade to Premium or Pro for 3 veterinarian contacts.'
          };
        }
        if (error.message.includes('Premium and Pro tiers allow 3 veterinarian')) {
          return {
            success: false,
            error: 'Premium and Pro tiers allow 3 veterinarian contacts.'
          };
        }
        throw error;
      }

      return { success: true, veterinarian: data };

    } catch (error: any) {
      console.error('Error adding veterinarian:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update veterinarian information
   */
  async updateVeterinarian(
    veterinarianId: string,
    updates: Partial<Omit<Veterinarian, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; veterinarian?: Veterinarian }> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', veterinarianId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, veterinarian: data };

    } catch (error) {
      console.error('Error updating veterinarian:', error);
      return { success: false };
    }
  }

  /**
   * Delete a veterinarian
   */
  async deleteVeterinarian(veterinarianId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('veterinarians')
        .delete()
        .eq('id', veterinarianId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error deleting veterinarian:', error);
      return { success: false };
    }
  }

  /**
   * Get health records for a pet
   */
  async getHealthRecords(petId: string): Promise<HealthRecord[]> {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select(`
          *,
          veterinarian:veterinarians(id, name, clinic_name),
          photos:health_record_photos(*)
        `)
        .eq('pet_id', petId)
        .order('record_date', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching health records:', error);
      return [];
    }
  }

  /**
   * Create a new health record
   */
  async createHealthRecord(healthRecord: {
    pet_id: string;
    title: string;
    description?: string;
    record_date: string;
    veterinarian_id?: string;
    weight?: number;
    temperature?: number;
    notes?: string;
  }): Promise<{ success: boolean; healthRecord?: HealthRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .insert(healthRecord)
        .select(`
          *,
          veterinarian:veterinarians(id, name, clinic_name),
          photos:health_record_photos(*)
        `)
        .single();

      if (error) throw error;
      return { success: true, healthRecord: data };

    } catch (error: any) {
      console.error('Error creating health record:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a health record
   */
  async updateHealthRecord(
    healthRecordId: string,
    updates: Partial<Omit<HealthRecord, 'id' | 'pet_id' | 'created_at' | 'updated_at' | 'veterinarian' | 'photos'>>
  ): Promise<{ success: boolean; healthRecord?: HealthRecord }> {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', healthRecordId)
        .select(`
          *,
          veterinarian:veterinarians(id, name, clinic_name),
          photos:health_record_photos(*)
        `)
        .single();

      if (error) throw error;
      return { success: true, healthRecord: data };

    } catch (error) {
      console.error('Error updating health record:', error);
      return { success: false };
    }
  }

  /**
   * Delete a health record
   */
  async deleteHealthRecord(healthRecordId: string): Promise<{ success: boolean }> {
    try {
      // Delete associated photos first
      const { data: photos } = await supabase
        .from('health_record_photos')
        .select('photo_url')
        .eq('health_record_id', healthRecordId);

      if (photos) {
        // Delete photo files from storage
        const filePaths = photos.map(photo => {
          const url = new URL(photo.photo_url);
          return url.pathname.replace('/storage/v1/object/public/health-records/', '');
        });
        
        if (filePaths.length > 0) {
          await supabase.storage.from('health-records').remove(filePaths);
        }
      }

      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', healthRecordId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error deleting health record:', error);
      return { success: false };
    }
  }

  /**
   * Upload photo to health record
   * Enforces photo limits: Free (1), Premium/Pro (5)
   */
  async uploadHealthRecordPhoto(
    healthRecordId: string,
    photoUri: string,
    caption?: string
  ): Promise<{ success: boolean; photo?: HealthRecordPhoto; error?: string }> {
    try {
      // Read photo file
      const photoBase64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate unique filename
      const fileExt = photoUri.split('.').pop();
      const fileName = `${healthRecordId}_${Date.now()}.${fileExt}`;
      const filePath = `health-records/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('health-records')
        .upload(filePath, decode(photoBase64), {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health-records')
        .getPublicUrl(filePath);

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      const fileSize = fileInfo.exists ? fileInfo.size : undefined;

      // Insert photo record (database trigger will enforce limits)
      const { data, error } = await supabase
        .from('health_record_photos')
        .insert({
          health_record_id: healthRecordId,
          photo_url: publicUrl,
          caption,
          file_size_bytes: fileSize
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('health-records').remove([filePath]);
        
        // Handle subscription limit errors
        if (error.message.includes('Free tier allows 1 photo per health record')) {
          return {
            success: false,
            error: 'Free tier allows 1 photo per health record. Upgrade to Premium or Pro for 5 photos per health record.'
          };
        }
        if (error.message.includes('Premium and Pro tiers allow 5 photos')) {
          return {
            success: false,
            error: 'Premium and Pro tiers allow 5 photos per health record.'
          };
        }
        throw error;
      }

      return { success: true, photo: data };

    } catch (error: any) {
      console.error('Error uploading health record photo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete health record photo
   */
  async deleteHealthRecordPhoto(photoId: string): Promise<{ success: boolean }> {
    try {
      // Get photo info
      const { data: photo } = await supabase
        .from('health_record_photos')
        .select('photo_url')
        .eq('id', photoId)
        .single();

      if (photo) {
        // Extract file path from URL
        const url = new URL(photo.photo_url);
        const filePath = url.pathname.replace('/storage/v1/object/public/health-records/', '');
        
        // Delete from storage
        await supabase.storage.from('health-records').remove([filePath]);
      }

      // Delete database record
      const { error } = await supabase
        .from('health_record_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error deleting health record photo:', error);
      return { success: false };
    }
  }

  /**
   * Get vaccinations for a pet
   */
  async getVaccinations(petId: string): Promise<Vaccination[]> {
    try {
      const { data, error } = await supabase
        .from('vaccinations')
        .select(`
          *,
          veterinarian:veterinarians(id, name, clinic_name)
        `)
        .eq('pet_id', petId)
        .order('date_administered', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching vaccinations:', error);
      return [];
    }
  }

  /**
   * Create a new vaccination record
   */
  async createVaccination(vaccination: {
    pet_id: string;
    vaccine_name: string;
    date_administered: string;
    next_due_date?: string;
    batch_number?: string;
    veterinarian_id?: string;
    notes?: string;
    certificate_photo_url?: string;
  }): Promise<{ success: boolean; vaccination?: Vaccination; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('vaccinations')
        .insert(vaccination)
        .select(`
          *,
          veterinarian:veterinarians(id, name, clinic_name)
        `)
        .single();

      if (error) throw error;
      return { success: true, vaccination: data };

    } catch (error: any) {
      console.error('Error creating vaccination:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a vaccination record
   */
  async updateVaccination(
    vaccinationId: string,
    updates: Partial<Omit<Vaccination, 'id' | 'pet_id' | 'created_at' | 'updated_at' | 'veterinarian'>>
  ): Promise<{ success: boolean; vaccination?: Vaccination }> {
    try {
      const { data, error } = await supabase
        .from('vaccinations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', vaccinationId)
        .select(`
          *,
          veterinarian:veterinarians(id, name, clinic_name)
        `)
        .single();

      if (error) throw error;
      return { success: true, vaccination: data };

    } catch (error) {
      console.error('Error updating vaccination:', error);
      return { success: false };
    }
  }

  /**
   * Delete a vaccination record
   */
  async deleteVaccination(vaccinationId: string): Promise<{ success: boolean }> {
    try {
      // Get vaccination info to clean up certificate photo
      const { data: vaccination } = await supabase
        .from('vaccinations')
        .select('certificate_photo_url')
        .eq('id', vaccinationId)
        .single();

      if (vaccination?.certificate_photo_url) {
        // Extract file path and delete from storage
        const url = new URL(vaccination.certificate_photo_url);
        const filePath = url.pathname.replace('/storage/v1/object/public/health-records/', '');
        await supabase.storage.from('vaccination-certificates').remove([filePath]);
      }

      const { error } = await supabase
        .from('vaccinations')
        .delete()
        .eq('id', vaccinationId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error deleting vaccination:', error);
      return { success: false };
    }
  }

  /**
   * Create health notification (Premium/Pro only)
   */
  async createHealthNotification(notification: {
    pet_id: string;
    notification_type: 'vaccination_reminder' | 'custom_reminder';
    title: string;
    description?: string;
    notification_date: string;
    vaccination_id?: string;
  }): Promise<{ success: boolean; notification?: HealthNotification; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) throw new Error('User record not found');

      const { data, error } = await supabase
        .from('health_notifications')
        .insert({
          user_id: userRecord.id,
          ...notification
        })
        .select()
        .single();

      if (error) {
        // Handle subscription restriction
        if (error.message.includes('Health notifications are available in Premium and Pro tiers only')) {
          return {
            success: false,
            error: 'Health notifications are available in Premium and Pro tiers only. Free tier users cannot set reminders.'
          };
        }
        throw error;
      }

      return { success: true, notification: data };

    } catch (error: any) {
      console.error('Error creating health notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's health notifications
   */
  async getHealthNotifications(): Promise<HealthNotification[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord) return [];

      const { data, error } = await supabase
        .from('health_notifications')
        .select('*')
        .eq('user_id', userRecord.id)
        .eq('is_sent', false)
        .order('notification_date', { ascending: true });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching health notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as sent
   */
  async markNotificationSent(notificationId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('health_notifications')
        .update({ is_sent: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error marking notification as sent:', error);
      return { success: false };
    }
  }

  /**
   * Delete health notification
   */
  async deleteHealthNotification(notificationId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('health_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error deleting health notification:', error);
      return { success: false };
    }
  }

  /**
   * Export health records to PDF (Premium/Pro only)
   */
  async exportHealthRecordsToPDF(petId: string): Promise<{ success: boolean; pdfUri?: string; error?: string }> {
    try {
      // Check subscription status
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: userRecord } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!userRecord || userRecord.subscription_status === 'free') {
        return {
          success: false,
          error: 'PDF export is available in Premium and Pro tiers only.'
        };
      }

      // Get all health records and vaccinations
      const [healthRecords, vaccinations] = await Promise.all([
        this.getHealthRecords(petId),
        this.getVaccinations(petId)
      ]);

      // PDF generation using react-native-html-to-pdf - implement in production
      // This would use a library like react-native-html-to-pdf or similar
      console.log('Generating PDF with health records:', healthRecords.length, 'vaccinations:', vaccinations.length);

      return {
        success: true,
        pdfUri: 'placeholder-pdf-uri' // Would return actual PDF file URI
      };

    } catch (error: any) {
      console.error('Error exporting health records to PDF:', error);
      return { success: false, error: error.message };
    }
  }
}

export const healthRecordsService = new HealthRecordsService();