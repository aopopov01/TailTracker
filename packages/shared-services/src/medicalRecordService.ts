/**
 * Medical Record Service
 * Platform-agnostic medical record management operations
 */

import type { ApiResult } from '@tailtracker/shared-types';
import { getSupabaseClient } from './supabase/client';

// ===================================
// TYPES
// ===================================

/**
 * Medical record types
 */
export type MedicalRecordType =
  | 'checkup'
  | 'surgery'
  | 'emergency'
  | 'prescription'
  | 'test_result'
  | 'vaccination'
  | 'dental'
  | 'grooming'
  | 'other';

/**
 * Entry type for medical records - determines which form fields to show in edit mode
 */
export type MedicalRecordEntryType = 'past' | 'scheduled';

/**
 * Document metadata for medical record documents
 */
export interface MedicalRecordDocument {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

/**
 * Medical record data as stored in the database
 */
export interface DatabaseMedicalRecord {
  id: string;
  pet_id: string;
  record_type: MedicalRecordType;
  title: string;
  description?: string | null;
  date_of_record: string;
  veterinarian_id?: string | null;
  clinic_name?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  follow_up_date?: string | null;
  follow_up_start_time?: string | null;
  follow_up_end_time?: string | null;
  cost?: number | null;
  currency?: string | null;
  document_urls?: string[] | null;
  documents?: MedicalRecordDocument[] | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  entry_type?: 'past' | 'scheduled' | null;
}

/**
 * Medical record data for frontend use (camelCase)
 */
export interface MedicalRecord {
  id: string;
  petId: string;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  dateOfRecord: string;
  veterinarianId?: string;
  clinicName?: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: string;
  followUpStartTime?: string;
  followUpEndTime?: string;
  cost?: number;
  currency?: string;
  documentUrls?: string[];
  documents?: MedicalRecordDocument[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  entryType?: MedicalRecordEntryType;
}

/**
 * Input data for creating/updating a medical record
 */
export interface MedicalRecordData {
  petId: string;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  dateOfRecord: string;
  veterinarianId?: string;
  clinicName?: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: string;
  followUpStartTime?: string;
  followUpEndTime?: string;
  cost?: number;
  currency?: string;
  documentUrls?: string[];
  documents?: MedicalRecordDocument[];
  notes?: string;
  entryType?: MedicalRecordEntryType;
}

/**
 * Medical record type information for UI display
 */
export interface RecordTypeInfo {
  type: MedicalRecordType;
  label: string;
  icon: string;
  color: string;
}

export const RECORD_TYPE_INFO: Record<MedicalRecordType, RecordTypeInfo> = {
  checkup: { type: 'checkup', label: 'Checkup', icon: 'stethoscope', color: 'green' },
  surgery: { type: 'surgery', label: 'Surgery', icon: 'scissors', color: 'orange' },
  emergency: { type: 'emergency', label: 'Emergency', icon: 'alert-triangle', color: 'red' },
  prescription: { type: 'prescription', label: 'Prescription', icon: 'pill', color: 'blue' },
  test_result: { type: 'test_result', label: 'Test Result', icon: 'file-text', color: 'purple' },
  vaccination: { type: 'vaccination', label: 'Vaccination', icon: 'syringe', color: 'teal' },
  dental: { type: 'dental', label: 'Dental', icon: 'smile', color: 'cyan' },
  grooming: { type: 'grooming', label: 'Grooming', icon: 'scissors', color: 'pink' },
  other: { type: 'other', label: 'Other', icon: 'more-horizontal', color: 'gray' },
};

// ===================================
// MAPPERS
// ===================================

/**
 * Map database format to frontend format
 */
const mapDatabaseToMedicalRecord = (
  dbRecord: DatabaseMedicalRecord
): MedicalRecord => ({
  id: dbRecord.id,
  petId: dbRecord.pet_id,
  recordType: dbRecord.record_type,
  title: dbRecord.title,
  description: dbRecord.description ?? undefined,
  dateOfRecord: dbRecord.date_of_record,
  veterinarianId: dbRecord.veterinarian_id ?? undefined,
  clinicName: dbRecord.clinic_name ?? undefined,
  diagnosis: dbRecord.diagnosis ?? undefined,
  treatment: dbRecord.treatment ?? undefined,
  followUpDate: dbRecord.follow_up_date ?? undefined,
  followUpStartTime: dbRecord.follow_up_start_time ?? undefined,
  followUpEndTime: dbRecord.follow_up_end_time ?? undefined,
  cost: dbRecord.cost ?? undefined,
  currency: dbRecord.currency ?? undefined,
  documentUrls: dbRecord.document_urls ?? undefined,
  documents: dbRecord.documents ?? undefined,
  notes: dbRecord.notes ?? undefined,
  createdAt: dbRecord.created_at,
  updatedAt: dbRecord.updated_at,
  entryType: dbRecord.entry_type ?? undefined,
});

/**
 * Map frontend format to database format
 */
const mapMedicalRecordToDatabase = (
  data: MedicalRecordData
): Omit<DatabaseMedicalRecord, 'id' | 'created_at' | 'updated_at'> => ({
  pet_id: data.petId,
  record_type: data.recordType,
  title: data.title,
  description: data.description ?? null,
  date_of_record: data.dateOfRecord,
  veterinarian_id: data.veterinarianId ?? null,
  clinic_name: data.clinicName ?? null,
  diagnosis: data.diagnosis ?? null,
  treatment: data.treatment ?? null,
  follow_up_date: data.followUpDate ?? null,
  follow_up_start_time: data.followUpStartTime ?? null,
  follow_up_end_time: data.followUpEndTime ?? null,
  cost: data.cost ?? null,
  currency: data.currency ?? null,
  document_urls: data.documentUrls ?? null,
  documents: data.documents ?? [],
  notes: data.notes ?? null,
  entry_type: data.entryType ?? 'past',
});

// ===================================
// SERVICE FUNCTIONS
// ===================================

/**
 * Get all medical records for a pet
 */
export const getMedicalRecords = async (
  petId: string
): Promise<MedicalRecord[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('pet_id', petId)
    .order('date_of_record', { ascending: false });

  if (error) throw error;

  return (data || []).map((dbRecord) =>
    mapDatabaseToMedicalRecord(dbRecord as DatabaseMedicalRecord)
  );
};

/**
 * Get medical records filtered by type
 */
export const getMedicalRecordsByType = async (
  petId: string,
  recordType: MedicalRecordType
): Promise<MedicalRecord[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('pet_id', petId)
    .eq('record_type', recordType)
    .order('date_of_record', { ascending: false });

  if (error) throw error;

  return (data || []).map((dbRecord) =>
    mapDatabaseToMedicalRecord(dbRecord as DatabaseMedicalRecord)
  );
};

/**
 * Get a specific medical record by ID
 */
export const getMedicalRecordById = async (
  id: string
): Promise<MedicalRecord | null> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching medical record:', error);
    return null;
  }

  return data
    ? mapDatabaseToMedicalRecord(data as DatabaseMedicalRecord)
    : null;
};

/**
 * Create a new medical record
 */
export const createMedicalRecord = async (
  data: MedicalRecordData
): Promise<ApiResult<MedicalRecord>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify the user owns this pet
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('id', data.petId)
      .single();

    if (petError || !pet) {
      return { success: false, error: 'Pet not found or access denied' };
    }

    const dbData = mapMedicalRecordToDatabase(data);

    const { data: created, error } = await supabase
      .from('medical_records')
      .insert(dbData as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: mapDatabaseToMedicalRecord(created as DatabaseMedicalRecord),
    };
  } catch (error) {
    console.error('Error creating medical record:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create medical record',
    };
  }
};

/**
 * Update an existing medical record
 */
export const updateMedicalRecord = async (
  id: string,
  data: Partial<MedicalRecordData>
): Promise<ApiResult<MedicalRecord>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.recordType !== undefined)
      updateData.record_type = data.recordType;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.dateOfRecord !== undefined)
      updateData.date_of_record = data.dateOfRecord;
    if (data.veterinarianId !== undefined)
      updateData.veterinarian_id = data.veterinarianId;
    if (data.clinicName !== undefined) updateData.clinic_name = data.clinicName;
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
    if (data.treatment !== undefined) updateData.treatment = data.treatment;
    if (data.followUpDate !== undefined)
      updateData.follow_up_date = data.followUpDate;
    if (data.followUpStartTime !== undefined)
      updateData.follow_up_start_time = data.followUpStartTime;
    if (data.followUpEndTime !== undefined)
      updateData.follow_up_end_time = data.followUpEndTime;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.documentUrls !== undefined)
      updateData.document_urls = data.documentUrls;
    if (data.documents !== undefined)
      updateData.documents = data.documents;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.entryType !== undefined) updateData.entry_type = data.entryType;

    const { data: updated, error } = await supabase
      .from('medical_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: mapDatabaseToMedicalRecord(updated as DatabaseMedicalRecord),
    };
  } catch (error) {
    console.error('Error updating medical record:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update medical record',
    };
  }
};

/**
 * Delete a medical record
 */
export const deleteMedicalRecord = async (
  id: string
): Promise<ApiResult<void>> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting medical record:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete medical record',
    };
  }
};

/**
 * Get records from the last N days
 */
export const getRecentMedicalRecords = async (
  petId: string,
  days: number = 30
): Promise<MedicalRecord[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - days);

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('pet_id', petId)
    .gte('date_of_record', pastDate.toISOString())
    .order('date_of_record', { ascending: false });

  if (error) throw error;

  return (data || []).map((dbRecord) =>
    mapDatabaseToMedicalRecord(dbRecord as DatabaseMedicalRecord)
  );
};

/**
 * Get scheduled medical records (appointments that haven't happened yet)
 */
export const getScheduledRecords = async (
  petId: string
): Promise<MedicalRecord[]> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('pet_id', petId)
    .eq('entry_type', 'scheduled')
    .order('follow_up_date', { ascending: true });

  if (error) throw error;

  return (data || []).map((dbRecord) =>
    mapDatabaseToMedicalRecord(dbRecord as DatabaseMedicalRecord)
  );
};

/**
 * Medical records summary
 */
export interface MedicalRecordSummary {
  total: number;
  last30Days: number;
  scheduled: number;
  totalCost: number;
  byType: Record<MedicalRecordType, number>;
}

/**
 * Get medical record summary for a pet
 */
export const getMedicalRecordSummary = async (
  petId: string
): Promise<MedicalRecordSummary> => {
  const [allRecords, recentRecords, scheduledRecords] = await Promise.all([
    getMedicalRecords(petId),
    getRecentMedicalRecords(petId, 30),
    getScheduledRecords(petId),
  ]);

  const byType: Record<MedicalRecordType, number> = {
    checkup: 0,
    surgery: 0,
    emergency: 0,
    prescription: 0,
    test_result: 0,
    vaccination: 0,
    dental: 0,
    grooming: 0,
    other: 0,
  };

  let totalCost = 0;

  allRecords.forEach((record) => {
    byType[record.recordType]++;
    if (record.cost) {
      totalCost += record.cost;
    }
  });

  return {
    total: allRecords.length,
    last30Days: recentRecords.length,
    scheduled: scheduledRecords.length,
    totalCost,
    byType,
  };
};
